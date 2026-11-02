#!/usr/bin/env python3
"""
Scalability test for the knowledge-network pipeline (brief 2026-11-02, "Scalable Knowledge Network Revision", Tests B and C).

  python3 -I tools/scale_test.py                      # roots for 3+1, 10, 50 and 100 plants -> tests/scale/out/, report in eval/
  python3 -I tools/scale_test.py --n 1 10             # chosen sizes (number of SYNTHETIC plants added to the three real ones)

For each size a complete database root is written under tests/scale/out/db-<N>/ (gitignored): copies of schema.json,
intent_map.json, eval/queries.json; sources.json + two SYNTHETIC sources; synonyms.json + the synthetic names; relations.json
+ a few SYNTHETIC relations; plants/ = the three real plant files + N generated ones. Then tools/pipeline.py runs on that
root (build_ontology → build_graph → build_kg → validate) exactly as it would on the real database — nothing in the
interface is edited. The report records timings, counts, growth-form detection, plant pairs and gaps.

Synthetic plants are obviously synthetic: genus Synthetica / Fictiva / Probatrix / Exemplaria, family "Synthaceae …",
common name "Test plant NN (SYNTHETIC)", every claim from source `synth_test` / `synth_test2` ("SYNTHETIC TEST SOURCE"),
context "SYNTHETIC test data". They never enter plants/ of the real database. Standard library only.
Open the interface on a test root:  http://localhost:8766/brain/ontology-preview/?db=../../tests/scale/out/db-100
"""
import json, os, random, shutil, subprocess, sys, time
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
ONT = J("ontology.json"); O = {n["id"]: n for n in ONT["nodes"]}
TODAY = date.today().isoformat()
OUT = os.path.join(ROOT, "tests", "scale", "out")
label = lambda cid: O[cid]["label"]
HEIGHT = sorted([n for n in ONT["nodes"] if n["facet"] == "height_class"], key=lambda n: n["order"])
SPREAD = sorted([n for n in ONT["nodes"] if n["facet"] == "spread_class"], key=lambda n: n["order"])
FORMS = [("Tree - deciduous", "tree", "a small deciduous tree"), ("Shrub - deciduous", "shrub", "a deciduous shrub"), ("Broadleaf evergreen", "shrub", "an evergreen shrub"), ("Poales (grass-like)", "graminoid", "a clump-forming grass"), ("Herbaceous perennial", "herbaceous_perennial", "a herbaceous perennial"), ("Fern", "fern", "an evergreen fern"), ("Vine or climber", "vine", "a woody climber")]
GENERA = ["Synthetica", "Fictiva", "Probatrix", "Exemplaria"]
EXPOSURE = ["exposure:full_sun", "exposure:part_sun_part_shade", "exposure:filtered_shade", "exposure:deep_shade", "exposure:sheltered"]
SOIL = ["soil:acidic", "soil:humus_rich", "soil:well_drained", "soil:rocky_or_gravelly_or_dry", "soil:bog"]
WATER = ["water:dry", "water:average", "water:moist", "water:wet"]
USES = ["use:screening", "use:sheared_hedge", "use:hedge_row", "use:ground_cover", "use:group_or_mass_planting", "use:specimen_plant", "use:accent_plant", "use:filler", "use:shade_tree", "use:woodland_margin", "use:container_planting", "use:erosion_control", "use:native_planting", "use:wind_break", "use:spring_interest", "use:fall_interest"]
HABIT = ["habit:dense", "habit:open", "habit:spreading", "habit:upright", "habit:arching", "habit:twiggy"]
FORM = ["form:round", "form:mounded", "form:vase", "form:columnar", "form:creeping_mat_like", "form:weeping"]
RATE = ["growth_rate:slow", "growth_rate:moderate", "growth_rate:fast"]


def classes(bins, lo, hi): return [n["id"] for n in bins if hi >= (n.get("min_m") or 0) and lo < (n.get("max_m") if n.get("max_m") is not None else 1e9)]


def claim(pid, field, value, concepts, kind, src="synth_test", value_label=None, text=None, n=1):
    c = {"id": f"{pid}:{field}:synth{n:02d}", "plant": pid, "field": field, "value": value, "value_kind": kind, "text": text or f"SYNTHETIC: {field.replace('_', ' ')} of {pid} = {value_label if value_label is not None else value}.", "source_id": src, "source_type": "database", "context": "SYNTHETIC test data (tools/scale_test.py), not a real plant", "confidence": 0.5, "status": "unverified", "recorded_at": TODAY, "recorded_by": "tools/scale_test.py (synthetic)", "claim_kind": "attribute", "concepts": concepts, "conditions": [], "place": "place:global", "time": [], "cultivar": None}
    if value_label is not None: c["value_label"] = value_label
    return c


def synth_plant(i, rng):
    kpu, form, phrase = FORMS[i % len(FORMS)]; gen = GENERA[i % len(GENERA)]; pid = f"synth-plant-{i:03d}"; name = f"{gen} testplanta{i:03d}"
    e = {"id": pid, "scientific_name": name, "synonyms_scientific": [], "common_names": {"en": [f"Test plant {i:03d} (SYNTHETIC)"], "zh": []}, "family": f"Synthaceae-{gen[:3].lower()}", "kpu_plant_type": kpu, "respondent_roles": [], "raw_names": [], "origin_status": rng.choice(["native_bc_west_of_cascades", "non_native", "native_north_america"]), "external_refs": {}, "in_vancouver_street_tree_list": False, "prototype_role": "SYNTHETIC test plant generated by tools/scale_test.py — not real plant knowledge", "survey_mentions": 0}
    maxh = {"tree": (4, 15), "shrub": (0.5, 3), "graminoid": (0.3, 1.5), "herbaceous_perennial": (0.2, 1.2), "fern": (0.3, 1.2), "vine": (2, 8)}[form]
    lo = round(rng.uniform(maxh[0], (maxh[0] + maxh[1]) / 2), 1); hi = round(rng.uniform(lo + 0.2, maxh[1]), 1)
    slo = round(lo * rng.uniform(0.5, 1.2), 1); shi = round(hi * rng.uniform(0.6, 1.3), 1); slo, shi = min(slo, shi), max(slo, shi + 0.1)
    ex = sorted(rng.sample(EXPOSURE[:4], rng.randint(1, 3))); so = sorted(rng.sample(SOIL, rng.randint(1, 2))); wa = rng.choice(WATER); uses = sorted(rng.sample(USES, rng.randint(2, 4)))
    hab = rng.choice(HABIT); frm = rng.choice(FORM); rate = rng.choice(RATE); ever = kpu in ("Broadleaf evergreen", "Fern") or rng.random() < 0.2
    z1 = rng.randint(4, 8); z2 = min(9, z1 + rng.randint(1, 3))
    claims = [
        claim(pid, "exposure", ex, ex, "categorical", value_label=[label(x) for x in ex]),
        claim(pid, "soil_type", so, so, "categorical", value_label=[label(x) for x in so]),
        claim(pid, "water_drainage", wa, [wa], "categorical", value_label=label(wa)),
        claim(pid, "mature_height", {"min": lo, "max": hi, "unit": "m"}, classes(HEIGHT, lo, hi), "quantitative", text=f"SYNTHETIC: {name} is {phrase} reaching {lo}–{hi} m."),
        claim(pid, "mature_spread", {"min": slo, "max": shi, "unit": "m"}, classes(SPREAD, slo, shi), "quantitative"),
        claim(pid, "hardiness_zone", {"min": z1, "max": z2, "unit": "USDA"}, [f"hardiness_usda:z{z}" for z in range(z1, z2 + 1)], "quantitative"),
        claim(pid, "seasonal_interest", {"evergreen": ever}, ["evergreen:yes" if ever else "evergreen:no"], "categorical"),
        claim(pid, "landscape_use", uses, uses, "categorical", value_label=[label(x) for x in uses]),
        claim(pid, "habit", hab, [hab], "categorical", value_label=label(hab), text=f"SYNTHETIC: {name} is {phrase} with a {label(hab).lower()} habit."),
        claim(pid, "form", frm, [frm], "categorical", value_label=label(frm)),
        claim(pid, "growth_rate", rate, [rate], "categorical", value_label=label(rate)),
        claim(pid, "maintenance_level", "maintenance:low", ["maintenance:low"], "categorical", value_label="low"),
    ]
    if e["origin_status"] != "non_native": claims.append(claim(pid, "ecological_value", ["origin:native"] + (["ecology:pollinator"] if rng.random() < 0.5 else []), ["origin:native"] + (["ecology:pollinator"] if rng.random() < 0.5 else []), "categorical", value_label=["native"] + ([] if True else [])))
    if rng.random() < 0.5: claims.append(claim(pid, "resistances", ["stress:drought"], ["stress:drought"], "categorical", value_label=["drought"]))
    # a second synthetic source gives a second voice on growth form (M29 'supported' needs two sources)
    if rng.random() < 0.6: claims.append(claim(pid, "habit", hab, [hab], "categorical", src="synth_test2", value_label=label(hab), text=f"SYNTHETIC (second source): {name}, {phrase}.", n=2))
    return {"entity": e, "claims": claims, "custom": [], "fill_plan": {}}


def fix_eco_labels(plant):   # value_label must mirror the value list
    for c in plant["claims"]:
        if c["field"] == "ecological_value": c["value_label"] = [x.split(":")[1] for x in c["value"]]
    return plant


def make_root(n, seed=7):
    root = os.path.join(OUT, f"db-{n}"); rng = random.Random(seed + n)
    if os.path.exists(root): shutil.rmtree(root)
    os.makedirs(os.path.join(root, "plants")); os.makedirs(os.path.join(root, "eval")); os.makedirs(os.path.join(root, "brain", "data"))
    for f in ("schema.json", "intent_map.json"): shutil.copy(os.path.join(ROOT, f), root)
    shutil.copy(os.path.join(ROOT, "eval", "queries.json"), os.path.join(root, "eval"))
    for f in os.listdir(os.path.join(ROOT, "plants")):
        if f.endswith(".json"): shutil.copy(os.path.join(ROOT, "plants", f), os.path.join(root, "plants", f))
    src = J("sources.json"); syn = J("synonyms.json"); rel = J("relations.json")
    for k in (1, 2): src["sources"].append({"id": f"synth_test{'' if k == 1 else k}", "name": f"SYNTHETIC TEST SOURCE {k} — generated by tools/scale_test.py; not a real source", "type": "database", "url": None, "url_verified": False, "publisher": "none (synthetic)", "geo_specificity": "global", "covers_fields": [], "baseline_confidence": 0.5, "licence": "n/a — synthetic", "licence_tier": "A", "role_in_db": "scale test only", "accessed": TODAY})
    ids = []
    for i in range(1, n + 1):
        p = fix_eco_labels(synth_plant(i, rng)); pid = p["entity"]["id"]; ids.append(pid)
        json.dump(p, open(os.path.join(root, "plants", f"{pid}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        syn["entries"].append({"id": pid, "in_db": True, "scientific": p["entity"]["scientific_name"], "names": p["entity"]["common_names"]["en"]})
    # a few SYNTHETIC direct relations: every 7th synthetic plant with the next one; the first one also co-listed with salal (test B)
    for k, pid in enumerate(ids):
        if k % 7 == 0 and k + 1 < len(ids):
            rel["relations"].append({"id": f"rel:{pid}:{ids[k + 1]}:synth01", "plant_a": pid, "plant_b": ids[k + 1], "relation_type": rng.choice(["companion", "co_listed", "layered_under"]), "direction": "mutual", "text": f"SYNTHETIC relation between {pid} and {ids[k + 1]} (tools/scale_test.py).", "source_id": "synth_test", "source_type": "database", "context": "SYNTHETIC test data", "confidence": 0.5, "status": "unverified", "recorded_at": TODAY})
    if ids: rel["relations"].append({"id": f"rel:{ids[0]}:gaultheria-shallon:synth01", "plant_a": ids[0], "plant_b": "gaultheria-shallon", "relation_type": "co_listed", "direction": "mutual", "text": f"SYNTHETIC co-listing of {ids[0]} with Gaultheria shallon (tools/scale_test.py) — exists only in this test root.", "source_id": "synth_test", "source_type": "database", "context": "SYNTHETIC test data", "confidence": 0.5, "status": "unverified", "recorded_at": TODAY})
    for name, obj in (("sources.json", src), ("synonyms.json", syn), ("relations.json", rel)): json.dump(obj, open(os.path.join(root, name), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return root, ids


def run(n):
    root, ids = make_root(n); t = time.time()
    r = subprocess.run([sys.executable, "-I", os.path.join(HERE, "pipeline.py"), "--root", root, "--quiet"], capture_output=True, text=True)
    dt = time.time() - t
    if r.returncode != 0: return {"n": n, "ok": False, "log": r.stdout[-1500:] + r.stderr[-800:]}
    kg = json.load(open(os.path.join(root, "brain", "data", "kg.json"), encoding="utf-8")); size = os.path.getsize(os.path.join(root, "brain", "data", "kg.json"))
    gf = kg["growth_forms"]; forms = {}
    for pid, g in gf.items(): forms[g["status"]] = forms.get(g["status"], 0) + 1
    plants = [x for x in kg["nodes"] if x["type"] == "plant"]; nogf = [x["id"] for x in plants if x["id"].split(":")[1] not in gf]
    pairs = kg["plant_pairs"]; shared5 = sum(1 for p in pairs if p["n_shared"] >= 5); sourced = sum(1 for p in pairs if p["n_sourced_relations"])
    first = ids[0] if ids else None; fb = None
    if first:
        P = f"plant:{first}"; es = [e for e in kg["edges"] if (e.get("plant") or e["source"]) == P]
        fb = {"growth_form": gf.get(first), "taxonomy": [e["text"] for e in es if e["type"] == "taxonomy"], "claim_edges": sum(1 for e in es if e["type"] == "claim"), "height_bands": sorted({e["target"] for e in es if e["type"] == "height_band"}), "layers": [e["target"] for e in es if e["type"] == "layer"], "design": [(e["target"], e["kg_status"]) for e in es if e["type"] == "design" and e["kg_status"] != "unknown"], "pairs": [(p["plants"], p["n_shared"], p["n_sourced_relations"]) for p in pairs if P in p["plants"] and any(q.startswith("plant:") and "synth" not in q for q in p["plants"])], "areas": {a: len(d["concepts"]) for a, d in kg["plant_areas"][P].items()}}
    return {"n": n, "ok": True, "root": os.path.relpath(root, ROOT), "seconds": round(dt, 2), "plants": len(plants), "nodes": kg["counts"]["nodes"], "edges": kg["counts"]["edges"], "by_status": kg["counts"]["by_status"], "design": kg["counts"]["design_edges"], "kb": round(size / 1024), "growth_forms": forms, "no_growth_form": nogf, "pairs": len(pairs), "pairs_shared_ge5": shared5, "pairs_sourced": sourced, "max_shared": max((p["n_shared"] for p in pairs), default=0), "gaps": {k: (len(v) if isinstance(v, list) else v) for k, v in kg["gaps"].items()}, "first": fb}


if __name__ == "__main__":
    sizes = [int(x) for x in sys.argv[sys.argv.index("--n") + 1:]] if "--n" in sys.argv else [1, 10, 50, 100]
    os.makedirs(OUT, exist_ok=True); results = [run(n) for n in sizes]
    out = [f"# Scale test — synthetic plants through the real pipeline · {TODAY}", "", "Generated by `python3 -I tools/scale_test.py`. Each row is a complete database root under `tests/scale/out/` (gitignored): the three real plants plus N **synthetic** plants (genus Synthetica / Fictiva / Probatrix / Exemplaria, sources `synth_test*`, every claim marked SYNTHETIC). The pipeline (`tools/pipeline.py`: build_ontology → build_graph → build_kg → validate) ran unchanged; no interface file was edited. Synthetic knowledge is a load test, not plant knowledge.", "",
           "| synthetic plants | plants | nodes | edges | documented / derived / candidate / unknown | design links d/c/u | growth form supported / to confirm / none | pairs (≥5 shared · sourced relation · max shared) | kg.json | pipeline |", "|---|---|---|---|---|---|---|---|---|---|"]
    for r in results:
        if not r["ok"]: out.append(f"| {r['n']} | FAILED | | | | | | | | |\n\n```\n{r['log']}\n```"); continue
        s = r["by_status"]; d = r["design"]; g = r["growth_forms"]
        out.append(f"| {r['n']} | {r['plants']} | {r['nodes']} | {r['edges']} | {s['documented']} / {s['derived']} / {s['candidate']} / {s['unknown']} | {d['derived']} / {d['candidate']} / {d['unknown']} | {g.get('supported', 0)} / {g.get('to confirm', 0)} / {len(r['no_growth_form'])} | {r['pairs']} ({r['pairs_shared_ge5']} · {r['pairs_sourced']} · {r['max_shared']}) | {r['kb']} KB | {r['seconds']} s |")
    out.append("")
    fb = next((r["first"] for r in results if r["ok"] and r["first"]), None)
    if fb:
        out += ["## Test B — the first synthetic plant, read back from kg.json (nothing hand-written)", "", f"- growth form: `{fb['growth_form']['form'] if fb['growth_form'] else 'none'}` ({fb['growth_form']['status'] if fb['growth_form'] else 'no vote'}; evidence {', '.join((fb['growth_form'] or {}).get('evidence', {}).keys())})", f"- taxonomy: {' · '.join(fb['taxonomy'])}", f"- claim edges: {fb['claim_edges']} · height bands: {', '.join(b.split(':')[1] for b in fb['height_bands'])} · layers: {', '.join(l.split(':')[1] for l in fb['layers']) or 'none'}", "- design links: " + (', '.join(t.split(':')[1] + ' (' + st + ')' for t, st in fb['design']) or 'none'), f"- knowledge areas: {', '.join(f'{a} {k}' for a, k in sorted(fb['areas'].items()))}", f"- pairs with the real plants: " + '; '.join(f"{[q.split(':')[1] for q in ps]} share {k} nodes, {sr} sourced relation(s)" for ps, k, sr in fb['pairs']), ""]
    gaps = next((r["gaps"] for r in results if r["ok"]), {})
    out += ["## Gaps are reported, not filled", "", f"Last root: {', '.join(f'{k} {v}' for k, v in gaps.items())}. A synthetic plant with no habit claim gets `unknown` design links like a real one; nothing is invented to make the network denser.", ""]
    path = os.path.join(ROOT, "eval", f"scale-test-{TODAY}.md"); open(path, "w", encoding="utf-8").write("\n".join(out))
    print("\n".join(out[4:4 + len(results) + 2])); print("->", path)
