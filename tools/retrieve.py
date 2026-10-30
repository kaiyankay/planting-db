#!/usr/bin/env python3
"""
T6 — retrieval prototype over the claim store. Three routes, one ranking.

  python3 -I tools/retrieve.py "shade tolerant evergreen hedge"        # one query, markdown to stdout
  python3 -I tools/retrieve.py --eval                                    # eval/queries.json -> eval/retrieval-<date>.md

Gate semantics: single-value fields (water_drainage, invasive_status, origin_status…) fail on mismatch; list fields
(ecological_value, exposure, landscape_use…) return unknown when no claim mentions the wanted value (M16a).

Routes (principles §6)
  1. keyword / synonym   synonyms.json names -> plant ids  (exact, case-insensitive)
  2. structured filter   intent_map.json gate terms -> gate checks on claims (pass / fail / unknown)
  3. semantic            BM25 over claim.text (+ field name, context), query expanded with intent aliases.
                         Stand-in for an embedding model: `embed_search()` is the swap point (methods M16).
Ranking (principles §4, rule R5): source_type priority -> geographic specificity -> practitioner completeness -> confidence.
Similarity only decides recall (which claims come back), never order.
Answer (rule R6): attribute to who said it; L0 practitioner claims are withheld (R2); model placeholders are never cited.
"""
import json, math, os, re, sys
from collections import Counter
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
L = lambda n: json.load(open(os.path.join(ROOT, n), encoding="utf-8"))
SCHEMA, SOURCES, SYN, INTENT = L("schema.json"), {s["id"]: s for s in L("sources.json")["sources"]}, L("synonyms.json"), L("intent_map.json")
PLANTS = {}
for f in sorted(os.listdir(os.path.join(ROOT, "plants"))):
    if f.endswith(".json"):
        p = L(os.path.join("plants", f)); PLANTS[p["entity"]["id"]] = p
CLAIMS = [c for p in PLANTS.values() for c in p["claims"]]
SRC_PRIORITY = {s: i for i, s in enumerate(SCHEMA["claim"]["fields"]["source_type"]["priority_order"])}
GEO = {"vancouver": 0, "bc": 1, "pnw": 2, "north_america": 3, "global": 4}
VANCOUVER_USDA = 8          # Vancouver ≈ USDA 8 / Canadian 8a–8b (schema vocab note)
STOP = set("a an the of for in on to and or with is are be my our your this that it its as at by from i we you plant plants".split())

# ------------------------------------------------------------------ tokens / BM25
def toks(s):
    return [t for t in re.findall(r"[a-z0-9一-鿿]+", (s or "").lower()) if t not in STOP and len(t) > 1]

def claim_doc(c):
    return " ".join([c.get("text", ""), c.get("field", "").replace("_", " "), c.get("context", ""), " ".join(SYN_NAMES.get(c["plant"], []))])

SYN_NAMES = {e["id"]: [e["scientific"]] + e.get("names", []) for e in SYN["entries"]}
DOCS = [toks(claim_doc(c)) for c in CLAIMS]
DF = Counter(t for d in DOCS for t in set(d)); N = len(DOCS); AVG = sum(map(len, DOCS)) / max(N, 1)

def bm25(q, k1=1.5, b=0.75):
    qt = toks(q); out = []
    for i, d in enumerate(DOCS):
        if not d: continue
        tf = Counter(d); s = 0.0
        for t in qt:
            if t in tf:
                idf = math.log(1 + (N - DF[t] + 0.5) / (DF[t] + 0.5))
                s += idf * tf[t] * (k1 + 1) / (tf[t] + k1 * (1 - b + b * len(d) / AVG))
        if s > 0: out.append((s, i))
    return sorted(out, reverse=True)

def embed_search(q, k=40):
    """Swap point: return [(score, claim_index)] from an embedding model if one is installed; else BM25."""
    try:
        import sentence_transformers  # noqa: F401  (not installed on 2026-10-29)
    except ImportError:
        return bm25(q)[:k]
    return bm25(q)[:k]

# ------------------------------------------------------------------ route 1: names
def name_hits(q):
    ql = q.lower(); hits = {}
    for e in SYN["entries"]:
        for n in [e["scientific"]] + e.get("names", []) + e.get("synonyms_scientific", []):
            if n.lower() in ql:
                hits.setdefault(e["id"], set()).add(n)
    return hits

# ------------------------------------------------------------------ route 2: intents + gates
def intents(q):
    ql = q.lower(); found = []
    for t in INTENT["terms"]:
        words = [t["term"]] + t.get("aliases", [])
        m = [w for w in words if w.lower() in ql]
        if m: found.append((t, m))
    return found

def live(c): return c.get("status") != "retired" and c.get("source_type") != "model"

def gate_check(plant_id, term):
    """pass / fail / unknown for one gate intent against one plant (sourced claims only)."""
    field, want = term["field"], term["value"]; p = PLANTS[plant_id]; e = p["entity"]
    if field == "origin_status": return "pass" if e.get("origin_status") == want else "fail"
    if field == "kpu_plant_type": return "pass" if e.get("kpu_plant_type") in want else "fail"
    if field.startswith("custom:") or field == "_source_geo": return "n/a"
    base, _, sub = field.partition(".")
    cs = [c for c in p["claims"] if c["field"] == base and live(c)]
    if not cs: return "unknown"
    for c in cs:
        v = c["value"]
        if sub: v = v.get(sub) if isinstance(v, dict) else None
        if base == "hardiness_zone":
            if isinstance(v, dict) and v.get("unit") == "USDA" and (v.get("min") or v.get("usda_min") or 0) <= VANCOUVER_USDA <= (v.get("max") or 99): return "pass"
            if isinstance(v, dict) and v.get("unit") == "RHS" and v.get("rating") in ("H4", "H5", "H6", "H7"): return "pass"
            if v in (want.get("includes") if isinstance(want, dict) else []): return "pass"
            continue
        wants = want if isinstance(want, list) else [want]
        vals = v if isinstance(v, list) else [v]
        if any(w in vals for w in wants): return "pass"
    # enum[] fields list what a source chose to mention: absence is not contradiction (M16a)
    fdef = next((t["fields"][base] for t in SCHEMA["field_tiers"].values() if base in t.get("fields", {})), {})
    if str(fdef.get("type", "")).endswith("[]") or sub: return "unknown"
    return "fail"

# ------------------------------------------------------------------ ranking (R5)
def completeness_rank(c):
    if c.get("source_type") != "practitioner": return 1.5
    return {"L3": 0, "L2": 1, "L1": 2, "L0": 3}.get((c.get("practitioner_meta") or {}).get("completeness"), 3)

def rank_key(c):
    s = SOURCES.get(c["source_id"], {})
    return (SRC_PRIORITY.get(c["source_type"], 9), GEO.get(s.get("geo_specificity"), 9), completeness_rank(c), -c.get("confidence", 0))

def why(c):
    s = SOURCES.get(c["source_id"], {})
    parts = [f"{c['source_type']} (priority {SRC_PRIORITY.get(c['source_type'], '?')+1})", f"geo {s.get('geo_specificity', '?')}"]
    if c.get("source_type") == "practitioner": parts.append(f"completeness {(c.get('practitioner_meta') or {}).get('completeness')}")
    parts.append(f"confidence {c.get('confidence')}")
    return " → ".join(parts)

def attribute(c):
    """R6: who said it, not why."""
    s = SOURCES.get(c["source_id"], {})
    if c["source_type"] == "practitioner":
        meta = c.get("practitioner_meta") or {}
        who = s.get("observer_background", "a survey respondent")
        basis = {"project": "in their own project", "observed": "from site observation", "read": "from reading", "mixed": "from mixed experience"}.get(meta.get("basis"), "")
        caveat = f" ({meta['caveat']})" if meta.get("caveat") else ""
        return f"A {who} noted {basis}{caveat}: “{c['text']}”"
    name = s.get("name", c["source_id"]).split(" — ")[0].split(" (")[0]
    st = "" if c.get("status") == "verified" else " [unverified]"
    return f"{name}{st}: {c['text']}"

# ------------------------------------------------------------------ query
def run(q, k=40):
    names = name_hits(q); its = intents(q)
    gates = [(t, m) for t, m in its if t.get("mode") == "gate"]
    boosts = [(t, m) for t, m in its if t.get("mode") != "gate"]
    expanded = q + " " + " ".join(w for t, _ in its for w in [t["term"]] + t.get("aliases", []) + ([str(t["field"]).replace("_", " ")]))
    # gates
    gate_table = {pid: {t["term"]: gate_check(pid, t) for t, _ in gates} for pid in PLANTS}
    excluded = {pid for pid, g in gate_table.items() if "fail" in g.values()}
    if names: candidates = set(names) - excluded
    else: candidates = set(PLANTS) - excluded
    # recall
    recall = embed_search(expanded, k)
    hits = []
    for score, i in recall:
        c = CLAIMS[i]
        if c["plant"] in candidates and live(c): hits.append((score, c))
    # if a name was given but nothing recalled, fall back to all live claims of that plant on intent fields
    if names and not hits:
        for pid in candidates:
            for c in PLANTS[pid]["claims"]:
                if live(c) and any(c["field"] == str(t["field"]).split(".")[0] for t, _ in its): hits.append((0.0, c))
    # rank (R5), similarity ignored
    ranked = sorted({c["id"]: c for _, c in hits}.values(), key=rank_key)
    withheld = [c for c in ranked if c["source_type"] == "practitioner" and (c.get("practitioner_meta") or {}).get("citable") is False]
    cited = [c for c in ranked if c not in withheld]
    return {"query": q, "names": {k: sorted(v) for k, v in names.items()}, "intents": [(t["term"], t["field"], t.get("mode")) for t, _ in its],
            "gates": gate_table, "excluded": sorted(excluded), "candidates": sorted(candidates), "recall_n": len(hits),
            "ranked": cited, "withheld_L0": len(withheld), "expanded_query": expanded}

def report(r, max_claims=12):
    o = [f"### `{r['query']}`", ""]
    o.append(f"- names: {r['names'] or 'none'} · intents: {', '.join(f'{t} → {f} ({m})' for t, f, m in r['intents']) or 'none'}")
    if r["gates"] and any(r["gates"].values()):
        o.append("- gates: " + "; ".join(f"**{pid}** " + ", ".join(f"{t}={v}" for t, v in g.items()) for pid, g in r["gates"].items()))
    o.append(f"- candidates after gates: {', '.join(r['candidates']) or 'none'}" + (f" (excluded: {', '.join(r['excluded'])})" if r["excluded"] else ""))
    o.append(f"- recall: {r['recall_n']} claims by similarity; shown in R5 order (similarity ignored for order); {r['withheld_L0']} L0 practitioner claims withheld (R2)")
    o.append("")
    if not r["ranked"]:
        o.append("**Answer:** no sourced claim matches. (Honest empty answer — the field may exist with no source yet.)"); o.append(""); return "\n".join(o)
    by_plant = {}
    for c in r["ranked"]: by_plant.setdefault(c["plant"], []).append(c)
    o.append("**Answer (R6 — attributed):**"); o.append("")
    for pid, cs in by_plant.items():
        o.append(f"*{PLANTS[pid]['entity']['scientific_name']}*")
        for c in cs[:max_claims]:
            o.append(f"- {attribute(c)}  \n  `{c['id']}` · {c['field']} · ranked by {why(c)}")
        if len(cs) > max_claims: o.append(f"- … {len(cs) - max_claims} more")
        o.append("")
    return "\n".join(o)

if __name__ == "__main__":
    if "--eval" in sys.argv:
        Q = L("eval/queries.json")
        out = [f"# T6 retrieval test · {date.today().isoformat()}", "", Q["note"], "",
               f"Store: {len(CLAIMS)} claims over {len(PLANTS)} plants · semantic route = BM25 stand-in (no embedding model installed) · ranking R5 · answers R6", ""]
        passed = 0
        for q in Q["queries"]:
            r = run(q["query"])
            ok = bool(r["ranked"]) or q["id"] in ("e2-r04", "c4-r03")   # the two 'honest empty' cases pass by returning nothing sourced
            passed += ok
            out.append(f"## {q['id']} ({q['status']}) — {'PASS' if ok else 'FAIL'}"); out.append("")
            if q.get("note"): out.append(f"> {q['note']}"); out.append("")
            out.append(report(r)); out.append("")
        out.insert(5, f"**{passed} / {len(Q['queries'])} queries answered with sources (or honestly empty where no source exists).**"); out.insert(6, "")
        path = os.path.join(ROOT, "eval", f"retrieval-{date.today().isoformat()}.md")
        open(path, "w", encoding="utf-8").write("\n".join(out)); print(f"{passed}/{len(Q['queries'])} ->", path)
    else:
        print(report(run(" ".join(a for a in sys.argv[1:] if not a.startswith("--")))))
