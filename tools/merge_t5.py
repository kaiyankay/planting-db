#!/usr/bin/env python3
"""
T5 step 4: land an assisted extraction file into the plant file (methods M8; 10-plant expansion 2026-11-02).

  python3 -I tools/merge_t5.py inputs/t5/cornus-sericea-2026-11-02.json [--dry-run]

- claims go through tools/merge_claims.py (duplicate check, id allocation, ontology annotation, validation, R10 retirement,
  README table); every claim stays `status: unverified` — nothing here verifies (D5: Kay's review)
- entity: external_refs filled where null (KPU as link only), synonyms_scientific and common names appended from
  `entity_facts`, `fill_plan.not_available` recorded with the reason per source
- `companions_named` → relations.json `outside_db` (named companions not in the database) or, when the named plant IS in the
  database, a documented `companion` relation from that source (status unverified)
- writes the review checklist review/<plant>-<date>.md via tools/review_list.py
Standard library only.
"""
import json, os, re, sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from merge_claims import merge_claims  # noqa: E402
import review_list  # noqa: E402

DRY = "--dry-run" in sys.argv
TODAY = date.today().isoformat()
J = lambda p: json.load(open(p, encoding="utf-8"))
def W(p, obj):
    if DRY: return
    with open(p, "w", encoding="utf-8") as f: json.dump(obj, f, ensure_ascii=False, indent=2); f.write("\n")

path = [a for a in sys.argv[1:] if a.endswith(".json")][0]
t5 = J(path); pid = t5["plant"]; ppath = os.path.join(ROOT, "plants", f"{pid}.json")
plant = J(ppath); e = plant["entity"]
syn = J(os.path.join(ROOT, "synonyms.json")); SYN = {x["id"]: x for x in syn["entries"]}
NAME2ID = {}
for x in syn["entries"]:
    for n in [x["scientific"], *x.get("names", []), *x.get("synonyms_scientific", [])]: NAME2ID[n.lower().strip()] = x["id"]

# ---------------------------------------------------------------- claims
for c in t5["claims"]:
    c.setdefault("status", "unverified")
    if c["status"] == "verified": c["status"] = "unverified"; c["note"] = (c.get("note", "") + " status forced to unverified at merge (D5)").strip()
res = merge_claims(ppath, t5["claims"], dry_run=DRY)
print(f"{pid}: added {len(res['added'])} · duplicates {len(res['skipped_duplicate'])} · reallocated {len(res['reallocated'])} · retired {len(res['retired'])} · errors {len(res['errors'])} · warnings {len(res['warnings'])}")
for x in res["errors"][:20]: print("  E", x)
for x in res["warnings"][:20]: print("  w", x)
if res["errors"]: sys.exit(1)

# ---------------------------------------------------------------- entity
plant = J(ppath); e = plant["entity"]; ef = t5.get("entity_facts") or {}
e.setdefault("external_refs", {})
for k, v in (t5.get("external_refs") or {}).items():
    if v and not e["external_refs"].get(k): e["external_refs"][k] = v
for s in ef.get("synonyms_scientific") or ef.get("synonyms") or []:
    s = s if isinstance(s, str) else s.get("name") or str(s)
    s = re.sub(r"\s+\(.*\)$", "", s).strip()
    if s and s not in e.setdefault("synonyms_scientific", []) and s != e["scientific_name"]: e["synonyms_scientific"].append(s)
cn = ef.get("common_names") or {}
if isinstance(cn, list): cn = {"en": cn}
for n in cn.get("en", []) if isinstance(cn, dict) else []:
    n = re.sub(r"\s+\(.*\)$", "", n if isinstance(n, str) else str(n)).strip()
    if n and n.lower() not in {x.lower() for x in e["common_names"]["en"]}: e["common_names"]["en"].append(n)
if ef.get("usda_symbol"): e["usda_symbol"] = ef["usda_symbol"]
if ef.get("kpu_plant_type") and ef["kpu_plant_type"] != e.get("kpu_plant_type"): e.setdefault("notes", []).append(f"T5 entity_facts suggest kpu_plant_type {ef['kpu_plant_type']!r} (entity keeps {e.get('kpu_plant_type')!r}; to confirm)")
plant.setdefault("fill_plan", {})["not_available"] = t5.get("not_available") or {}
plant["fill_plan"]["t5_extractions"] = sorted(set(plant["fill_plan"].get("t5_extractions", []) + [os.path.relpath(path, ROOT)]))
W(ppath, plant)
# synonyms.json: new names
entry = SYN.get(pid)
if entry:
    for n in e["common_names"]["en"] + e.get("synonyms_scientific", []):
        if n.lower() not in NAME2ID and n not in entry["names"]: entry["names"].append(n)
    entry["in_db"] = True
    W(os.path.join(ROOT, "synonyms.json"), syn)

# ---------------------------------------------------------------- companions → relations.json
rel = J(os.path.join(ROOT, "relations.json")); in_db = {f[:-5] for f in os.listdir(os.path.join(ROOT, "plants")) if f.endswith(".json")}
added = 0
for comp in t5.get("companions_named") or []:
    names = comp.get("plants") or comp.get("companions") or ([comp["species"]] if comp.get("species") else []) or ([comp["plant"]] if comp.get("plant") else [])
    if isinstance(names, str): names = [names]
    src = comp.get("source_id") or comp.get("source"); url = comp.get("source_url") or comp.get("url"); note = comp.get("note") or comp.get("context")
    outside, inside = [], []
    for n in names:
        q = NAME2ID.get(re.sub(r"\s+'.*'$", "", str(n)).lower().strip())
        (inside if q in in_db and q != pid else outside).append((n, q))
    if outside:
        rec = {"plant": pid, "companions_named": [n for n, _ in outside], "source_id": src, "source_url": url, "note": note or "named companions are not in the db; recorded here so they are not lost", "recorded_at": TODAY}
        if not any(x.get("plant") == pid and x.get("source_id") == src and set(x.get("companions_named", [])) == set(rec["companions_named"]) for x in rel["outside_db"]): rel["outside_db"].append(rec)
    for n, q in inside:
        a, b = sorted((pid, q))
        if any(x["relation_type"] == "companion" and x["source_id"] == src and {x["plant_a"], x["plant_b"]} == {a, b} for x in rel["relations"]): continue
        k = sum(1 for x in rel["relations"] if {x["plant_a"], x["plant_b"]} == {a, b}) + 1
        rel["relations"].append({"id": f"rel:{a}:{b}:{k:02d}", "plant_a": a, "plant_b": b, "relation_type": "companion", "direction": "mutual", "text": f"{src} names {n} as a companion / partner plant for {e['scientific_name']}.", "source_id": src, "source_type": "database", "context": note or "named as a companion on the source's plant page", "confidence": 0.7, "status": "unverified", "recorded_at": TODAY, "recorded_by": "tools/merge_t5.py (companions_named)", "source_url": url, "note": "a source naming two plants together is a design suggestion by that source, not an observed interaction"})
        added += 1
rel["updated"] = TODAY
W(os.path.join(ROOT, "relations.json"), rel)
print(f"  entity refs {sum(1 for v in e['external_refs'].values() if v)} · synonyms {len(e.get('synonyms_scientific', []))} · not_available {list((t5.get('not_available') or {}).keys())} · companion relations added {added}")
if not DRY:
    out, n = review_list.main(pid); print(f"  review list: {n} unverified -> {os.path.relpath(out, ROOT)}")
