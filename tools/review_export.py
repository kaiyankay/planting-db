#!/usr/bin/env python3
"""
De-identified review export and dashboard (brief 2026-11-02 'Verification Workbench' §06).

  python3 -I tools/review_export.py            # -> review/exports/review-summary-<date>.json + eval/review-dashboard-<date>.md

Public scope: AI assessment counts and records (they cite public sources; no reviewer data), human review COUNTS and
timelines with the reviewer identifier replaced by a stable pseudonym (reviewer-1, reviewer-2 …), decision reasons kept
(they describe evidence, not people) unless marked private in the event (`payload.private: true`). Never exported: the
private map, raw survey rows, the events file itself. Counts never double-count: AI review and human review are separate
columns; a claim is in exactly one human state. Standard library only.
"""
import json, os, sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(HERE)
sys.path.insert(0, HERE)
import review_store as RS  # noqa: E402
import ai_review as AIR  # noqa: E402

TODAY = date.today().isoformat()
plants = {}
for f in sorted(os.listdir(os.path.join(ROOT, "plants"))):
    if f.endswith(".json"): p = json.load(open(os.path.join(ROOT, "plants", f), encoding="utf-8")); plants[p["entity"]["id"]] = p
claims = {c["id"]: c for p in plants.values() for c in p["claims"] if c.get("source_type") != "model"}
live = {k: c for k, c in claims.items() if c.get("status") != "retired"}
A = AIR.latest_assessments() if os.path.exists(os.path.join(AIR.AI, "queue.json")) else {}
st = RS.stats(); evs = RS.events()
pseud = {}
def who(r):
    if not r: return None
    if r not in pseud: pseud[r] = f"reviewer-{len(pseud) + 1}"
    return pseud[r]

ai_counts = Counter(a["result"] for a in A.values()); ai_by_plant = defaultdict(Counter)
for cid, a in A.items(): ai_by_plant[a["plant"]][a["result"]] += 1
timelines = defaultdict(list)
for e in evs:
    t = {"at": e["at"], "kind": e["kind"], "reviewer": who(e.get("reviewer")), "previous_status": e.get("previous_status"), "fingerprint": e.get("fingerprint")}
    if e["kind"] == "human_decision": t |= {"decision": e["payload"]["decision"], "reason": None if e["payload"].get("private") else e["payload"].get("reason"), "ai_review_id": e["payload"].get("ai_review_id"), "replaces_event": e["payload"].get("replaces_event"), "locally_applicable": e["payload"].get("locally_applicable")}
    elif e["kind"] == "decision_applied": t |= {"new_status": e.get("new_status"), "changed_keys": e["payload"].get("changed_keys"), "new_claim": e["payload"].get("new_claim")}
    elif e["kind"] == "kg_rebuilt": t |= {"pipeline_ok": (e["payload"].get("pipeline") or {}).get("ok")}
    elif e["kind"] == "apply_failed": t |= {"reason": e["payload"].get("reason")}
    timelines[e["claim_id"]].append(t)
summary = {"generated": TODAY, "scope": "de-identified: reviewer identifiers replaced by stable pseudonyms; AI assessments as on file; no survey ids, no private map",
           "claims": {"live": len(live), "by_status": dict(Counter(c.get("status") for c in live.values())), "unverified": sum(1 for c in live.values() if c.get("status") == "unverified")},
           "ai_review": {"assessed_claims": len(A), "by_result": dict(ai_counts), "source_checked": sum(1 for a in A.values() if a["result"] != "source_unavailable"), "source_unavailable": ai_counts.get("source_unavailable", 0), "stale_assessments": sum(1 for a in A.values() if not a.get("current")), "models": dict(Counter(a.get("model") for a in A.values())), "methods": dict(Counter((a.get("method") or "").split(":")[0] for a in A.values())), "by_plant": {k: dict(v) for k, v in ai_by_plant.items()}},
           "human_review": {"claims_with_decision": st["claims_with_human_decision"], "by_state": st["by_state"], "reviewers": len(st["reviewers"]), "events": st["events"]},
           "by_plant": {pid: {"name": p["entity"]["scientific_name"], "live": sum(1 for c in live.values() if c["plant"] == pid), "verified": sum(1 for c in live.values() if c["plant"] == pid and c.get("status") == "verified"), "disputed": sum(1 for c in live.values() if c["plant"] == pid and c.get("status") == "disputed"), "unverified": sum(1 for c in live.values() if c["plant"] == pid and c.get("status") == "unverified"), "ai_assessed": sum(1 for a in A.values() if a["plant"] == pid), "human_decided": sum(1 for cid in st["state"] if cid.startswith(pid + ":"))} for pid, p in plants.items()},
           "by_source": {s: {"unverified": n, "ai_assessed": sum(1 for a in A.values() if a["source_id"] == s)} for s, n in Counter(c["source_id"] for c in live.values() if c.get("status") == "unverified").items()},
           "by_field": dict(Counter(c["field"] for c in live.values() if c.get("status") == "unverified")),
           "timelines": dict(timelines), "ai_assessments": [{k: a.get(k) for k in ("review_id", "claim_id", "fingerprint", "plant", "field", "source_id", "source_url", "locator", "evidence_excerpt", "result", "explanation", "missing_context", "conflicting_claims", "conflict_reading", "taxonomy_check", "geo_check", "risk", "priority", "model", "method", "reviewed_at", "current")} for a in sorted(A.values(), key=lambda a: a["claim_id"])]}
os.makedirs(os.path.join(ROOT, "review", "exports"), exist_ok=True)
outp = os.path.join(ROOT, "review", "exports", f"review-summary-{TODAY}.json"); json.dump(summary, open(outp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
h = summary["human_review"]["by_state"]
md = [f"# Review dashboard · {TODAY}", "", "Generated by `python3 -I tools/review_export.py` (de-identified). AI review and human review are separate columns; a claim sits in exactly one human state.", "",
      "| measure | n |", "|---|---|", f"| live claims (non-model) | {summary['claims']['live']} |", f"| … verified / disputed / unverified | {summary['claims']['by_status'].get('verified', 0)} / {summary['claims']['by_status'].get('disputed', 0)} / {summary['claims']['by_status'].get('unverified', 0)} |",
      f"| AI reviewed (assessment on file) | {summary['ai_review']['assessed_claims']} |", f"| … source checked by AI | {summary['ai_review']['source_checked']} |", f"| … source unavailable to AI | {summary['ai_review']['source_unavailable']} |", f"| … stale (claim changed since) | {summary['ai_review']['stale_assessments']} |",
      f"| human reviewed (claims with a decision) | {summary['human_review']['claims_with_decision']} |", f"| … verify applied / pending | {h.get('verify_applied', 0)} / {h.get('verify_pending_apply', 0)} |", f"| … dispute applied / pending | {h.get('dispute_applied', 0)} / {h.get('dispute_pending_apply', 0)} |", f"| … correction applied / pending | {h.get('propose_correction_applied', 0)} / {h.get('propose_correction_pending_apply', 0)} |", f"| … more evidence requested / deferred | {h.get('request_evidence', 0)} / {h.get('defer', 0)} |", f"| review events | {summary['human_review']['events']} |", "",
      "## AI results", "", "| result | n |", "|---|---|"] + [f"| {k} | {v} |" for k, v in sorted(ai_counts.items(), key=lambda kv: -kv[1])] + ["", "## By plant", "", "| plant | live | verified | disputed | unverified | AI assessed | human decided |", "|---|---|---|---|---|---|---|"] + [f"| *{v['name']}* | {v['live']} | {v['verified']} | {v['disputed']} | {v['unverified']} | {v['ai_assessed']} | {v['human_decided']} |" for v in summary["by_plant"].values()] + ["", "## By source (unverified claims)", "", "| source | unverified | AI assessed |", "|---|---|---|"] + [f"| {s} | {v['unverified']} | {v['ai_assessed']} |" for s, v in sorted(summary["by_source"].items(), key=lambda kv: -kv[1]["unverified"])]
open(os.path.join(ROOT, "eval", f"review-dashboard-{TODAY}.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
print(f"export -> {os.path.relpath(outp, ROOT)} · dashboard -> eval/review-dashboard-{TODAY}.md · AI {summary['ai_review']['assessed_claims']} · human {summary['human_review']['claims_with_decision']}")
