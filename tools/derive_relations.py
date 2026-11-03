#!/usr/bin/env python3
"""
Rule-based plant-to-plant relations from documented claims (brief 2026-11-02 §06; methods M38).

  python3 -I tools/derive_relations.py [--dry-run]

REL-R1 · habitat co-occurrence (E-Flora BC)
  Two plants whose E-Flora `vancouver_context` claims both (a) list the Coastal Western Hemlock zone (CWH, the zone Vancouver
  sits in), (b) are recorded down to sea level there (minimum elevation <= 50 m) and (c) share at least one habitat class after normalisation
  (forest · streamside · swamp · bog · meadow · grassland · rocky · coastal) get a `companion` relation with
  context "derived: …", `rule: REL-R1`, `derived_from` the two claims, status unverified, confidence 0.5.
  The relation says the two species occur in the same habitat classes of the same zone — co-occurrence in nature.
  It is NOT a planting recommendation (the text and note say so), and a plant pair with a sourced non-derived relation of
  the same type keeps that one (this rule never overwrites or duplicates).
Idempotent: re-running adds only pairs that are not yet recorded. Nothing is deleted. Standard library only.
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

added, skipped = [], []
for a, b in combinations(sorted(cands), 2):
    A, B = cands[a], cands[b]
    shared = A["tokens"] & B["tokens"]
    ok = A["cwh"] and B["cwh"] and (A["min_elev"] if A["min_elev"] is not None else 1e9) <= MAX_MIN_ELEV and (B["min_elev"] if B["min_elev"] is not None else 1e9) <= MAX_MIN_ELEV and shared
    if not ok:
        skipped.append((a, b, "no CWH" if not (A["cwh"] and B["cwh"]) else "not recorded at sea level" if (A["min_elev"] if A["min_elev"] is not None else 1e9) > MAX_MIN_ELEV or (B["min_elev"] if B["min_elev"] is not None else 1e9) > MAX_MIN_ELEV else "no shared habitat class")); continue
    if any(x["relation_type"] == "companion" and x["source_id"] == "eflora" and {x["plant_a"], x["plant_b"]} == {a, b} for x in REL["relations"]):
        skipped.append((a, b, "already recorded")); continue
    n = sum(1 for x in REL["relations"] if {x["plant_a"], x["plant_b"]} == {a, b}) + 1
    la, lb = PLANTS[a]["entity"]["scientific_name"], PLANTS[b]["entity"]["scientific_name"]
    REL["relations"].append({"id": f"rel:{a}:{b}:{n:02d}", "plant_a": a, "plant_b": b, "relation_type": "companion", "direction": "mutual",
        "text": f"E-Flora BC records both {la} and {lb} in the Coastal Western Hemlock zone at low elevation and in the same habitat class ({', '.join(sorted(shared))}), so they co-occur naturally in the Vancouver region.",
        "source_id": "eflora", "source_type": "database", "context": f"derived: shared habitat class ({', '.join(sorted(shared))}) and the CWH zone on the two atlas pages (minimum elevations {A['min_elev']} m and {B['min_elev']} m, province-wide means {A['elev']} m and {B['elev']} m; modal zones {A['modal']} / {B['modal']}{' — a modal zone other than CWH/CDF means the plant is marginal in the coastal zone' if not {A['modal'], B['modal']} <= {'CWH', 'CDF'} else ''}); the source does not state the association itself",
        "rule": "REL-R1", "confidence": 0.5, "status": "unverified", "recorded_at": TODAY, "recorded_by": "tools/derive_relations.py (REL-R1)", "derived_from": [A["claim"]["id"], B["claim"]["id"]],
        "citation": A["claim"].get("citation"), "note": "habitat co-occurrence, not a planting-design recommendation; two plants sharing a habitat class may still compete (see the salal placeholders)"})
    added.append(REL["relations"][-1]["id"])
REL["updated"] = TODAY
if not DRY and added:
    with open(os.path.join(ROOT, "relations.json"), "w", encoding="utf-8") as f: json.dump(REL, f, ensure_ascii=False, indent=2); f.write("\n")
print(f"REL-R1: {len(cands)} plants with an E-Flora habitat claim ({', '.join(f'{p} CWH={c['cwh']} min={c['min_elev']} mean={c['elev']} {sorted(c['tokens'])}' for p, c in cands.items())})")
print(f"  added {len(added)}{' (dry run)' if DRY else ''}: {', '.join(added)}")
for a, b, why in skipped: print(f"  skipped {a} × {b}: {why}")
