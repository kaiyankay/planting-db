#!/usr/bin/env python3
"""
Shared-habitat connections between plants (brief 2026-11-02 §03A; methods M38 → M43).

  python3 -I tools/derive_relations.py                # REPORT: pairs that share E-Flora habitat / BGC-zone concept nodes (read-only)
  python3 -I tools/derive_relations.py --retire-r1    # one-off migration: retire the REL-R1 `companion` relations written on
                                                      # 2026-11-02 (and the hand-derived one of 2026-10-29); records are kept

REL-R1 (first version, 2026-11-02 afternoon) wrote a direct `companion` relation when two plants shared an E-Flora habitat
class in the CWH zone. That overstated the evidence: a shared habitat class is an INDIRECT connection — the two plants are
each linked to the same knowledge node (Plant → habitat:forest ← Plant) — not an observed co-occurrence and not companion
planting. Since M43 the habitat classes and BGC zones are ontology concepts (facets `habitat`, `bgc_zone`) that the
annotation step attaches to every E-Flora `vancouver_context` claim; `build_kg.py` then shows them as shared knowledge
nodes in `plant_pairs`. This tool no longer writes relations. Direct relations stay reserved for statements a source makes
(`co_occurs_with`, `companion` …), survey co-listing (`co_listed`) and model candidates. Standard library only.
"""
import json, os, re, sys
from datetime import date
from itertools import combinations

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(HERE)
DRY = "--dry-run" in sys.argv; TODAY = date.today().isoformat()
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
PLANTS = {f[:-5]: J(os.path.join("plants", f)) for f in sorted(os.listdir(os.path.join(ROOT, "plants"))) if f.endswith(".json")}
REL = J("relations.json")
TOKENS = {"forest": r"forest", "streamside": r"stream|riparian|river", "swamp": r"swamp|marsh", "bog": r"\bbog", "meadow": r"meadow", "grassland": r"grassland|prairie|steppe", "rocky": r"rock|outcrop|talus|shallow soil", "coastal": r"coast|shore"}
MAX_MIN_ELEV = 50   # recorded at (near) sea level: the plant reaches the Vancouver lowland, whatever its province-wide mean


def eflora_habitat(p):
    for c in p["claims"]:
        if c.get("source_id") == "eflora" and c.get("field") == "vancouver_context" and c.get("status") != "retired":
            v = c.get("value") or {}
            if isinstance(v, dict) and (v.get("habitat") or v.get("habitat_classes")):
                return c
    return None


def tokens(v):
    text = " ".join(str(x) for x in (v.get("habitat") or v.get("habitat_classes") or [])).lower()
    return {k for k, rx in TOKENS.items() if re.search(rx, text)}


def min_elev(v):
    e = v.get("elevation_m") or {}
    return e.get("min") if isinstance(e, dict) else None
def mean_elev(v):
    e = v.get("elevation_m") or {}
    return e.get("mean") if isinstance(e, dict) else None


cands = {}
for pid, p in PLANTS.items():
    c = eflora_habitat(p)
    if not c: continue
    v = c["value"]; zones = [z.upper() for z in (v.get("bgc_zones") or [])]
    cands[pid] = {"claim": c, "cwh": "CWH" in zones, "elev": mean_elev(v), "min_elev": min_elev(v), "tokens": tokens(v), "modal": v.get("modal_zone")}

R1_IDS = [r["id"] for r in REL["relations"] if r.get("rule") == "REL-R1" or (r.get("source_id") == "eflora" and r.get("relation_type") == "companion" and str(r.get("context", "")).startswith("derived"))]

if "--retire-r1" in sys.argv:
    n = 0
    for r in REL["relations"]:
        if r["id"] in R1_IDS and r.get("status") != "retired":
            r["status"] = "retired"; r["retired_at"] = TODAY; r["retired_reason"] = "REL-R1 withdrawn 2026-11-02 (brief 'Verification Workbench' §03A, methods M43): a shared E-Flora habitat class is an indirect connection expressed through the habitat / bgc_zone concept nodes both plants link to, not a direct companion relation; record kept as history"
            n += 1
    REL["updated"] = TODAY
    if not DRY:
        with open(os.path.join(ROOT, "relations.json"), "w", encoding="utf-8") as f: json.dump(REL, f, ensure_ascii=False, indent=2); f.write("\n")
    print(f"retired {n} REL-R1 relations (ids kept): {', '.join(R1_IDS)}")

shared = []
for a, b in combinations(sorted(cands), 2):
    A, B = cands[a], cands[b]; t = A["tokens"] & B["tokens"]; z = A["cwh"] and B["cwh"]
    if t or z: shared.append((a, b, sorted(t), z))
print(f"shared-habitat report (read-only; M43): {len(cands)} plants with an E-Flora habitat claim")
for p, c in cands.items(): print(f"  {p:26} CWH={c['cwh']} min elev={c['min_elev']} m · classes {sorted(c['tokens'])} · modal {c['modal']}")
print(f"  {len(shared)} pairs share a habitat class or the CWH zone — shown in kg.json plant_pairs as shared knowledge nodes (habitat:* / bgc_zone:*), never as a relation:")
for a, b, t, z in shared: print(f"    {a} × {b}: classes {t}{' + CWH' if z else ''}")
print(f"  REL-R1 relations in relations.json: {len(R1_IDS)} ({sum(1 for r in REL['relations'] if r['id'] in R1_IDS and r.get('status') == 'retired')} retired)")
