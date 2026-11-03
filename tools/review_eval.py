#!/usr/bin/env python3
"""
AI vs human verification evaluation (brief 2026-11-02 'Verification Workbench' §07).

  python3 -I tools/review_eval.py --sample 40        # stratified human-review sample -> review/ai/sample-<date>.json (plants × fields × sources × priority)
  python3 -I tools/review_eval.py                    # compare AI assessments with the human decisions actually recorded -> eval/review-eval-<date>.md

Agreement rule: AI `supported_by_source` ↔ human `verify`; AI `not_supported` / `conflicting_evidence` ↔ human `dispute` or
`propose_correction`; AI `partially_supported` ↔ either (counted as partial agreement when the human verifies with a note or
corrects); AI `source_unavailable` / `insufficient_evidence` ↔ `request_evidence` / `defer`. Error types are read from the
human reason text and the AI record: extraction (numbers, units, categories), context (place, cultivar, condition), taxonomy,
source (unreachable / wrong page). Human decisions are never invented: with zero recorded decisions the report says so and the
agreement table is empty. Standard library only.
"""
import json, os, random, re, sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(HERE)
sys.path.insert(0, HERE)
import review_store as RS  # noqa: E402
import ai_review as AIR  # noqa: E402
TODAY = date.today().isoformat()
AGREE = {("supported_by_source", "verify"): "agree", ("not_supported", "dispute"): "agree", ("not_supported", "propose_correction"): "agree", ("conflicting_evidence", "dispute"): "agree", ("conflicting_evidence", "propose_correction"): "agree", ("conflicting_evidence", "defer"): "agree",
         ("partially_supported", "verify"): "partial", ("partially_supported", "propose_correction"): "partial", ("partially_supported", "dispute"): "partial", ("source_unavailable", "request_evidence"): "agree", ("source_unavailable", "defer"): "agree", ("insufficient_evidence", "request_evidence"): "agree", ("insufficient_evidence", "defer"): "agree"}
ERR = [("extraction", r"unit|number|convert|ft|metre|range|value|month|categor|vocab|mapping"), ("context", r"condition|cultivar|place|region|climate|UK|Missouri|Oregon|local|context"), ("taxonomy", r"taxon|species|genus|subsp|variety|synonym|hybrid"), ("source", r"unavailable|unreachable|404|page|not found|cannot (open|read)")]


def sample(n):
    q = json.load(open(os.path.join(AIR.AI, "queue.json"), encoding="utf-8"))["rows"]; A = AIR.latest_assessments(); rng = random.Random(2026)
    strata = defaultdict(list)
    for r in q: strata[(r["plant"], r["source_id"], r["priority"])].append(r)
    picks = []; by_plant = {}
    for k in sorted(strata): by_plant.setdefault(k[0], []).append(k)
    for v in by_plant.values(): rng.shuffle(v)   # so no source or priority dominates the first picks of each plant
    order = [k for i in range(max(len(v) for v in by_plant.values())) for pl in sorted(by_plant) for k in by_plant[pl][i:i + 1]]   # interleave plants so every plant is sampled before any stratum repeats
    while len(picks) < n and any(strata.values()):
        for k in order:
            if strata[k] and len(picks) < n:
                rows = strata[k]; pref = [r for r in rows if (A.get(r["claim_id"]) or {}).get("result") in ("not_supported", "conflicting_evidence", "partially_supported")] or rows
                r = rng.choice(pref); rows.remove(r); picks.append(r)
    out = {"generated": TODAY, "n": len(picks), "method": "stratified by plant × source × priority, round-robin over strata, within a stratum preferring claims whose AI result is not 'supported' (so disagreement is testable), seed 2026", "fields": sorted({r["field"] for r in picks}), "by_plant": dict(Counter(r["plant"] for r in picks)), "by_source": dict(Counter(r["source_id"] for r in picks)), "by_priority": dict(Counter(r["priority"] for r in picks)), "by_ai_result": dict(Counter((A.get(r["claim_id"]) or {}).get("result", "none") for r in picks)),
           "claims": [{"claim_id": r["claim_id"], "plant": r["plant"], "field": r["field"], "source_id": r["source_id"], "priority": r["priority"], "ai_result": (A.get(r["claim_id"]) or {}).get("result"), "human_decision": None} for r in picks], "note": "human_decision stays null until a reviewer records it in the workbench; this file is a target list, not a result"}
    p = os.path.join(AIR.AI, f"sample-{TODAY}.json"); json.dump(out, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"sample of {len(picks)} claims -> {os.path.relpath(p, ROOT)} · plants {len(out['by_plant'])} · sources {len(out['by_source'])} · priority {out['by_priority']} · AI results {out['by_ai_result']}")


def evaluate():
    A = AIR.latest_assessments(); decisions = {}
    for e in RS.events():
        if e["kind"] == "human_decision": decisions[e["claim_id"]] = e   # latest wins
    rows = []
    for cid, e in decisions.items():
        a = A.get(cid); d = e["payload"]["decision"]
        if not a: rows.append({"claim_id": cid, "ai": None, "human": d, "verdict": "no AI assessment"}); continue
        v = AGREE.get((a["result"], d), "disagree"); text = (e["payload"].get("reason") or "") + " " + (a.get("explanation") or "")
        errs = [k for k, rx in ERR if re.search(rx, text, re.I)] if v != "agree" or d in ("dispute", "propose_correction") else []
        rows.append({"claim_id": cid, "ai": a["result"], "human": d, "verdict": v, "error_types": errs, "reviewer": e["reviewer"], "synthetic": bool(e["payload"].get("synthetic")), "ai_current": a.get("current")})
    real = [r for r in rows if not r.get("synthetic")]
    c = Counter(r["verdict"] for r in real); e = Counter(t for r in real for t in r.get("error_types", []))
    sp = os.path.join(AIR.AI, f"sample-{TODAY}.json"); smp = json.load(open(sp, encoding="utf-8")) if os.path.exists(sp) else None
    o = [f"# AI vs human verification — evaluation · {TODAY}", "", "Generated by `python3 -I tools/review_eval.py`. Human decisions come only from `review/events/review_events.jsonl`; none are invented. Agreement rule in the tool docstring.", "",
         f"**Human decisions on record: {len(real)} real" + (f", {len(rows) - len(real)} synthetic test events excluded" if len(rows) != len(real) else "") + f".** AI assessments on file: {len(A)}." + (f" Target sample: {smp['n']} claims ({smp['method']}); decided so far: {sum(1 for s in smp['claims'] if s['claim_id'] in decisions)}." if smp else ""), "",
         "| measure | n |", "|---|---|", f"| AI / human agreement | {c.get('agree', 0)} |", f"| partial agreement (AI partial, human decided) | {c.get('partial', 0)} |", f"| AI / human disagreement | {c.get('disagree', 0)} |", f"| decided without an AI assessment | {c.get('no AI assessment', 0)} |",
         f"| unsupported claims detected (AI not_supported / conflicting) | {sum(1 for a in A.values() if a['result'] in ('not_supported', 'conflicting_evidence'))} |", f"| source extraction errors (human reason) | {e.get('extraction', 0)} |", f"| contextual interpretation errors | {e.get('context', 0)} |", f"| taxonomy errors | {e.get('taxonomy', 0)} |", f"| unresolved cases (defer / request evidence) | {sum(1 for r in real if r['human'] in ('defer', 'request_evidence'))} |", ""]
    if not real: o += ["No human review has been recorded yet, so no agreement figure exists. The mechanism was exercised only with synthetic test events on a copy of the database (`tools/review_tests.py`), which are excluded here by design.", ""]
    else:
        o += ["| claim | AI | human | verdict | error types |", "|---|---|---|---|---|"] + [f"| `{r['claim_id']}` | {r['ai']} | {r['human']} | {r['verdict']} | {', '.join(r.get('error_types', [])) or '—'} |" for r in real] + [""]
    o += ["## Limits", "", f"- Sample size: {len(real)} decided claims of 534 unverified; agreement on these says nothing about the rest.", "- The AI assessments and the original extractions come from the same model family (different runs, source re-read); an independent reviewer or a second model would strengthen the test.", "- Sources the AI could not open (Missouri Botanical Garden by script) were read in a browser by the agents; the API path was not run (no key).", "- Error types are keyword readings of free-text reasons; a reviewer can override them in the event notes."]
    p = os.path.join(ROOT, "eval", f"review-eval-{TODAY}.md"); open(p, "w", encoding="utf-8").write("\n".join(o) + "\n")
    print(f"evaluation: {len(real)} real human decisions · {dict(c)} -> {os.path.relpath(p, ROOT)}")


if __name__ == "__main__":
    a = sys.argv[1:]
    if "--sample" in a: sample(int(a[a.index("--sample") + 1]))
    else: evaluate()
