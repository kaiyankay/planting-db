#!/usr/bin/env python3
"""
Build the concept-centred knowledge graph and its diagnosis (brief 2026-10-31, Part 3).

  python3 -I tools/build_graph.py        # -> brain/data/graph.json, brain/data/diagnosis.json

Nodes: concepts (ontology.json), plants (+ cultivars as children), sources, practitioners (anonymous).
Edges: one per claim per concept it links to (plant -[claim]-> concept) carrying provenance; quantitative
claims give one edge per spanned class (spanned: true); relations.json -> plant -[relation]-> plant;
concept parent links. Fields are not nodes: a field is the facet of a concept.
Diagnosis (computed, never hand-written): hubs, variation, disagreement, gaps, single_voice — each with a
plain-language sentence and the ids behind it. brain/js/diagnosis.js is a port of the same rules so the
browser can recompute after a candidate is added. Standard library only.
"""
import json, os, re
from collections import defaultdict
from datetime import date
from itertools import combinations

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
ONT, SCHEMA, SRC, REL, SYN = J("ontology.json"), J("schema.json"), J("sources.json"), J("relations.json"), J("synonyms.json")
NODES = {n["id"]: n for n in ONT["nodes"]}
SOURCES = {s["id"]: s for s in SRC["sources"]}
PLANTS = {}
for f in sorted(os.listdir(os.path.join(ROOT, "plants"))):
    if f.endswith(".json"):
        p = J(os.path.join("plants", f)); PLANTS[p["entity"]["id"]] = p
TODAY = date.today().isoformat()
GATE_FIELDS = list(SCHEMA["field_tiers"]["gate"]["fields"].keys())
FIELD_FACETS = defaultdict(list)
for facet, fields in ONT["facet_fields"].items():
    for fld in fields: FIELD_FACETS[fld.split(".")[0]].append(facet)
GATE_FACETS = sorted({fc for fld in GATE_FIELDS for fc in FIELD_FACETS.get(fld, [])} - {"hardiness", "hardiness_rhs"} | {"hardiness_usda"})  # hardiness: any scale counts, see gap (a)
ORDINAL_FACETS = {"exposure", "water", "maintenance", "invasive", "growth_rate", "height_class", "spread_class", "hardiness", "hardiness_usda", "hardiness_rhs", "toxicity", "evergreen"}

live = lambda c: c.get("status") != "retired" and c.get("source_type") != "model"
plant_label = lambda pid: PLANTS[pid]["entity"]["scientific_name"]
clabel = lambda cid: NODES[cid]["label"] if cid in NODES else cid


def interval(v):
    if not isinstance(v, dict): return None
    if isinstance(v.get("median"), (int, float)) and v.get("unit") == "m": return (v.get("p10", v["median"]), v.get("p90", v["median"]))
    if "min" in v and "max" in v: return (v["min"], v["max"])
    if "max" in v: return (0, v["max"])
    if "min" in v: return (v["min"], v["min"])
    if "height_m" in v: return (v["height_m"], v["height_m"])
    if "spread_m" in v: return (v["spread_m"], v["spread_m"])
    if "typical_max_m" in v: return (0, v["typical_max_m"])
    if isinstance(v.get("median"), (int, float)) and v.get("unit") == "m": return (v.get("p10", v["median"]), v.get("p90", v["median"]))
    return None


def relation_for(field):
    return "resists" if field == "resistances" else "susceptible_to" if field == "pest_susceptibility" else "has"


# ---------------------------------------------------------------- nodes
nodes = []
for n in ONT["nodes"]:
    nodes.append({"id": n["id"], "type": "concept", "label": n["label"], "dimension": n["dimension"], "facet": n["facet"], "definition": n["definition"], "aliases": n.get("aliases", []), "parent": n.get("parent"), "order": n.get("order"), "source_of_term": n.get("source_of_term")})
cultivars = defaultdict(set)
for pid, p in PLANTS.items():
    e = p["entity"]
    nodes.append({"id": f"plant:{pid}", "type": "plant", "label": e["scientific_name"], "common": (e.get("common_names") or {}).get("en", []), "plant_type": e.get("kpu_plant_type"), "origin_status": e.get("origin_status"), "family": e.get("family"), "file": f"plants/{pid}.json"})
    for c in p["claims"]:
        if c.get("cultivar"): cultivars[pid].add(c["cultivar"])
for pid, cvs in cultivars.items():
    for cv in sorted(cvs):
        nodes.append({"id": f"cultivar:{pid}:{cv}", "type": "cultivar", "label": f"{plant_label(pid)} ‘{cv}’" if cv != "(unrecorded)" else f"{plant_label(pid)} (cultivar unrecorded)", "plant": f"plant:{pid}", "cultivar": cv})
for s in SRC["sources"]:
    t = "practitioner" if s.get("type") == "practitioner" else "source"
    nodes.append({"id": f"source:{s['id']}", "type": t, "label": s.get("name", s["id"]).split(" — ")[0] if t == "source" else (f"respondent {s['id'].split('-r')[-1]}" if s.get("parent") else "survey"), "source_type": s.get("type"), "geo": s.get("geo_specificity"), "licence_tier": s.get("licence_tier"), "parent": s.get("parent"), "observer_background": s.get("observer_background"), "url": s.get("url")})

# ---------------------------------------------------------------- edges
edges = []
for n in ONT["nodes"]:
    if n.get("parent"): edges.append({"id": f"parent:{n['id']}", "type": "parent", "source": n["id"], "target": n["parent"]})
for pid, cvs in cultivars.items():
    for cv in sorted(cvs): edges.append({"id": f"cultivar_of:{pid}:{cv}", "type": "cultivar_of", "source": f"cultivar:{pid}:{cv}", "target": f"plant:{pid}"})
for pid, p in PLANTS.items():
    for c in p["claims"]:
        quant = c.get("value_kind") == "quantitative"
        base = {"claim_id": c["id"], "plant": f"plant:{pid}", "field": c["field"], "relation": relation_for(c["field"]), "source_id": c["source_id"], "source_type": c["source_type"], "status": c.get("status"), "confidence": c.get("confidence"),
                "value_label": c.get("value_label"), "numbers": c.get("value") if quant else None, "text": c.get("text"), "context": c.get("context"), "conditions": c.get("conditions") or [], "place": c.get("place"), "time": c.get("time") or [], "cultivar": c.get("cultivar"),
                "practitioner_meta": c.get("practitioner_meta"), "live": live(c), "recorded_by": c.get("recorded_by")}
        concepts = c.get("concepts") or []
        for k, cid in enumerate(concepts):
            if cid not in NODES: continue
            e = dict(base); e.update({"id": f"e:{c['id']}:{k}", "type": "claim", "source": f"plant:{pid}", "target": cid, "facet": NODES[cid]["facet"], "spanned": quant and NODES[cid]["facet"] in ("height_class", "spread_class", "hardiness_usda", "hardiness")})
            edges.append(e)
        if not concepts:   # a claim with no concept still exists in the graph as a plant-side note (no target concept)
            e = dict(base); e.update({"id": f"e:{c['id']}:x", "type": "claim", "source": f"plant:{pid}", "target": None, "facet": None, "spanned": False}); edges.append(e)
for pid, p in PLANTS.items():
    e = p["entity"]
    for key, facet in (("kpu_plant_type", "plant_type"), ("origin_status", "origin")):
        val = e.get(key)
        cid = next((n["id"] for n in ONT["nodes"] if n["facet"] == facet and (n["label"] == val or n["id"] == f"{facet}:{val}")), None)
        if cid:
            edges.append({"id": f"entity:{pid}:{key}", "type": "entity", "source": f"plant:{pid}", "plant": f"plant:{pid}", "target": cid, "facet": facet, "field": f"entity.{key}", "relation": "is", "source_id": "entity", "source_type": "entity", "status": "entity", "live": True, "value_label": val, "text": f"{e['scientific_name']} is recorded as {NODES[cid]['label']} in its entity record.", "conditions": [], "place": None, "time": [], "cultivar": None, "numbers": None, "claim_id": None})
for r in REL["relations"]:
    if r["plant_a"] in PLANTS and r["plant_b"] in PLANTS:
        edges.append({"id": f"rel:{r['id']}", "type": "relation", "source": f"plant:{r['plant_a']}", "target": f"plant:{r['plant_b']}", "relation": r.get("relation_type"), "direction": r.get("direction"), "status": r.get("status"), "source_id": r.get("source_id"), "source_type": r.get("source_type"), "confidence": r.get("confidence"), "text": r.get("text"), "context": r.get("context"), "supporting_claims": r.get("supporting_claims") or [], "derived_from": r.get("derived_from") or [], "live": r.get("status") != "retired" and r.get("source_type") != "model"})


# ---------------------------------------------------------------- diagnosis
def claim_edges(): return [e for e in edges if e["type"] in ("claim", "entity") and e["target"] and e["live"]]
def cond_key(c):
    e = c["e"]; return tuple(sorted(x["concept_id"] for x in e["conditions"])) + ((("cv:" + e["cultivar"]),) if e.get("cultivar") else ())
def by_claim(E):
    out = {}
    for e in E:
        if not e.get("claim_id"): continue
        out.setdefault(e["claim_id"], {"claim_id": e["claim_id"], "plant": e["plant"], "facets": set(), "concepts": [], "e": e})
    for e in E:
        if e.get("claim_id"): out[e["claim_id"]]["facets"].add(e["facet"]); out[e["claim_id"]]["concepts"].append(e["target"])
    return out

def values_disjoint(a, b, facet):
    """two claims on the same facet: do their values not overlap? Size facets: the numeric intervals must be disjoint
    AND the KPU classes they span must share nothing (2.44 m and 2.4 m are both '2 - 3m', not a disagreement).
    Other ordinal facets: no shared concept. Open lists (uses, colours, pests): never a disagreement."""
    ca, cb = set(x for x in a["concepts"] if NODES[x]["facet"] == facet), set(x for x in b["concepts"] if NODES[x]["facet"] == facet)
    if not ca or not cb: return False
    if facet in ("height_class", "spread_class"):
        ia, ib = interval(a["e"]["numbers"]), interval(b["e"]["numbers"])
        num_disjoint = bool(ia and ib and (ia[1] < ib[0] or ia[0] > ib[1]))
        return num_disjoint and not (ca & cb)
    if facet in ORDINAL_FACETS: return not (ca & cb)
    return False

def describe(c):
    e = c["e"]; v = e["value_label"] if e["value_label"] is not None else (fmt_num(e["numbers"]) if e["numbers"] else ", ".join(clabel(x) for x in c["concepts"]))
    if isinstance(v, list): v = ", ".join(v)
    conds = ", ".join(clabel(x["concept_id"]).lower() for x in e["conditions"]) or "no condition stated"
    return v, conds

def fmt_num(v):
    if not isinstance(v, dict): return str(v)
    u = v.get("unit", "")
    if "median" in v: return f"median {v['median']} {u}".strip()
    if "min" in v and "max" in v: return f"{v['min']}–{v['max']} {u}".strip()
    if "max" in v: return f"≤ {v['max']} {u}".strip()
    if "height_m" in v: return f"{v['height_m']} m"
    if "spread_m" in v: return f"{v['spread_m']} m"
    if "typical_max_m" in v: return f"to {v['typical_max_m']} m"
    if "median" in v: return f"median {v['median']} {u}".strip()
    return json.dumps(v)

E = claim_edges()
C = by_claim(E)
SHORT = {"rhs": "RHS", "mobot": "Missouri BG", "gpp": "Great Plant Picks", "osu": "Oregon State", "eflora": "E-Flora BC", "usda_plants": "USDA PLANTS", "cov_trees": "City of Vancouver trees", "inat": "iNaturalist", "iscbc": "ISC BC", "kpu": "KPU", "aspca": "ASPCA", "growgreen": "Grow Green", "pojar": "Pojar & MacKinnon", "nats": "NATS Nursery", "model": "model placeholder", "candidate": "you (candidate)"}
src_label = lambda sid: SHORT.get(sid) or (f"survey respondent {sid.split('-r')[-1]}" if sid.startswith("survey-") else (SOURCES.get(sid, {}).get("name") or sid).split(" — ")[0].split(" (")[0])

# hubs: concepts linked to >= 2 plants (sourced, live)
hubs = []
by_concept = defaultdict(lambda: defaultdict(list))
for e in E: by_concept[e["target"]][e["plant"]].append(e)
for cid, plants in by_concept.items():
    if len(plants) >= 2:
        n = NODES[cid]; names = [plant_label(p.split(":")[1]) for p in plants]
        hubs.append({"concept": cid, "label": n["label"], "dimension": n["dimension"], "facet": n["facet"], "plants": sorted(plants), "n_edges": sum(len(v) for v in plants.values()), "sources": sorted({e["source_id"] for v in plants.values() for e in v}),
                     "text": f"{n['label']} links {len(plants)} plants ({', '.join(names)}) through {sum(len(v) for v in plants.values())} claims" + (" — a shared condition suggests they could share a planting layer." if n["dimension"] == "condition" else ".")})
hubs.sort(key=lambda h: (-len(h["plants"]), -h["n_edges"], h["concept"]))

# variation & disagreement: same plant + same facet
variation, disagreement = [], []
groups = defaultdict(list)
for c in C.values():
    for f in c["facets"]: groups[(c["plant"], f)].append(c)
for (plant, facet), cs in groups.items():
    cs = sorted(cs, key=lambda c: c["claim_id"])
    for a, b in combinations(cs, 2):
        if a["e"]["source_id"] == b["e"]["source_id"] and cond_key(a) == cond_key(b): continue
        if not values_disjoint(a, b, facet): continue
        ka, kb = cond_key(a), cond_key(b)
        cva, cvb = a["e"].get("cultivar"), b["e"].get("cultivar")
        if cva != cvb: continue   # species vs cultivar, or two cultivars: not the same thing, compared nowhere
        va, ca_ = describe(a); vb, cb_ = describe(b)
        pl = plant_label(plant.split(":")[1]); fl = facet.replace("_", " ")
        if ka != kb and a["e"]["conditions"] and b["e"]["conditions"]:
            variation.append({"plant": plant, "facet": facet, "claims": [a["claim_id"], b["claim_id"]], "conditions": [list(ka), list(kb)], "text": f"{pl} {fl} depends on conditions: {src_label(a['e']['source_id'])} gives {va} under {ca_}, {src_label(b['e']['source_id'])} gives {vb} under {cb_}."})
        elif ka == kb:
            disagreement.append({"plant": plant, "facet": facet, "claims": [a["claim_id"], b["claim_id"]], "sources": [a["e"]["source_id"], b["e"]["source_id"]], "conditions": list(ka), "text": f"Sources disagree on {pl} {fl}{' (' + cva + ')' if cva else ''}: {src_label(a['e']['source_id'])} says {va}, {src_label(b['e']['source_id'])} says {vb}, both {ca_ if ka else 'with no condition stated'}."})
        # one conditioned, one unconditioned: neither variation nor disagreement — left for the reader
# collapse variation pairs into one item per plant+facet
vmap = {}
for v in variation:
    key = (v["plant"], v["facet"]); vmap.setdefault(key, {"plant": v["plant"], "facet": v["facet"], "claims": [], "texts": []})
    for cid in v["claims"]:
        if cid not in vmap[key]["claims"]: vmap[key]["claims"].append(cid)
    vmap[key]["texts"].append(v["text"])
variation = [{"plant": v["plant"], "facet": v["facet"], "claims": v["claims"], "text": v["texts"][0], "pairs": len(v["texts"])} for v in vmap.values()]

# gaps
gaps = []
for pid in PLANTS:
    facets_here = {e["facet"] for e in E if e["plant"] == f"plant:{pid}"}
    for gf in GATE_FACETS:
        hard = gf.startswith("hardiness")
        if hard and any(f.startswith("hardiness") for f in facets_here): continue
        if gf not in facets_here:
            gaps.append({"kind": "gate_facet_missing", "plant": f"plant:{pid}", "facet": gf, "text": f"{plant_label(pid)} has no sourced claim on the gate facet ‘{gf.replace('_', ' ')}’ — the AI cannot gate on it."})
single_source = []
for cid, plants in by_concept.items():
    for plant, es in plants.items():
        srcs = {e["source_id"] for e in es}
        if len(srcs) == 1 and "entity" not in srcs: single_source.append({"plant": plant, "concept": cid, "source": next(iter(srcs)), "claims": sorted({e["claim_id"] for e in es if e.get("claim_id")})})
gaps.append({"kind": "single_source_links", "count": len(single_source), "items": single_source, "text": f"{len(single_source)} plant–concept links rest on a single source."})
rel_pairs = {tuple(sorted((e["source"], e["target"]))) for e in edges if e["type"] == "relation" and e["live"]}
for a, b in combinations(sorted(PLANTS), 2):
    sa = {e["target"] for e in E if e["plant"] == f"plant:{a}"}; sb = {e["target"] for e in E if e["plant"] == f"plant:{b}"}
    shared = sorted(sa & sb)
    if len(shared) >= 5 and tuple(sorted((f"plant:{a}", f"plant:{b}"))) not in rel_pairs:
        gaps.append({"kind": "shared_concepts_no_relation", "plants": [f"plant:{a}", f"plant:{b}"], "shared": shared, "text": f"{plant_label(a)} and {plant_label(b)} share {len(shared)} concepts but no sourced relation links them — shared conditions do not by themselves prove they combine."})
# single voice: concept links supported only by one source type
single_voice = []
for cid, plants in by_concept.items():
    types = {e["source_type"] for v in plants.values() for e in v} - {"entity"}
    if len(types) == 1 and not any(e["source_type"] == "entity" for v in plants.values() for e in v):
        single_voice.append({"concept": cid, "label": clabel(cid), "source_type": next(iter(types)), "plants": sorted(plants), "text": f"Everything linking plants to ‘{clabel(cid)}’ comes from {next(iter(types))} sources only."})

# per-plant sentences
plant_diag = {}
for pid in PLANTS:
    P = f"plant:{pid}"; my = [e for e in E if e["plant"] == P]
    concepts = {e["target"] for e in my}; facets = {e["facet"] for e in my}
    gate_cov = sum(1 for gf in GATE_FACETS if (gf in facets) or (gf.startswith("hardiness") and any(f.startswith("hardiness") for f in facets)))
    dis = [d for d in disagreement if d["plant"] == P]; var = [v for v in variation if v["plant"] == P]; gp = [g for g in gaps if g.get("plant") == P]
    ver = sum(1 for e in my if e["status"] == "verified")
    plant_diag[P] = {"concepts": len(concepts), "facets": len(facets), "gate_facets_covered": gate_cov, "gate_facets_total": len({gf for gf in GATE_FACETS if not gf.startswith("hardiness")}) + 1, "claims": len({e["claim_id"] for e in my if e.get("claim_id")}), "verified_edges": ver, "disagreements": len(dis), "variations": len(var), "gate_gaps": [g["facet"] for g in gp],
                     "text": f"{plant_label(pid)} is linked to {len(concepts)} concepts across {len(facets)} facets from {len({e['claim_id'] for e in my if e.get('claim_id')})} claims; " + (f"sources disagree on {', '.join(sorted({d['facet'].replace('_', ' ') for d in dis}))}; " if dis else "no disagreement found; ") + (f"{', '.join(sorted({v['facet'].replace('_', ' ') for v in var}))} depend{'s' if len(var) == 1 else ''} on conditions; " if var else "") + (f"missing gate facets: {', '.join(g.replace('_', ' ') for g in plant_diag.get(P, {}).get('gate_gaps', [g['facet'] for g in gp]))}." if gp else "every gate facet has at least one claim.")}

diagnosis = {"generated": TODAY, "rules": {"hubs": "concept linked to ≥ 2 plants by live sourced claims", "variation": "same plant + facet, two claims with different stated conditions (or cultivar equal) and non-overlapping values", "disagreement": "same plant + facet + same conditions (or none stated), different sources, non-overlapping values; ordinal facets only for categorical values", "gaps": "(a) plant with no live claim on a gate facet; (b) plant–concept link with one source; (c) two plants sharing ≥ 5 concepts with no live relation", "single_voice": "concept whose links all come from one source type"},
             "plants": plant_diag, "hubs": hubs, "variation": variation, "disagreement": disagreement, "gaps": gaps, "single_voice": single_voice,
             "counts": {"hubs": len(hubs), "variation": len(variation), "disagreement": len(disagreement), "gaps_gate": sum(1 for g in gaps if g["kind"] == "gate_facet_missing"), "gaps_single_source": len(single_source), "gaps_no_relation": sum(1 for g in gaps if g["kind"] == "shared_concepts_no_relation"), "single_voice": len(single_voice)}}

graph = {"generated": TODAY, "ontology_version": ONT["$ontology_version"], "schema_version": SCHEMA["$schema_version"], "generated_by": "tools/build_graph.py",
         "counts": {"nodes": len(nodes), "concepts": sum(1 for n in nodes if n["type"] == "concept"), "plants": len(PLANTS), "cultivars": sum(len(v) for v in cultivars.values()), "sources": sum(1 for n in nodes if n["type"] in ("source", "practitioner")), "edges": len(edges), "claim_edges": sum(1 for e in edges if e["type"] == "claim"), "live_claim_edges": len(E), "relation_edges": sum(1 for e in edges if e["type"] == "relation")},
         "gate_facets": GATE_FACETS, "nodes": nodes, "edges": edges}
os.makedirs(os.path.join(ROOT, "brain", "data"), exist_ok=True)
with open(os.path.join(ROOT, "brain", "data", "graph.json"), "w", encoding="utf-8") as f: json.dump(graph, f, ensure_ascii=False, indent=1)
with open(os.path.join(ROOT, "brain", "data", "diagnosis.json"), "w", encoding="utf-8") as f: json.dump(diagnosis, f, ensure_ascii=False, indent=1)
print(f"graph.json: {graph['counts']}")
print(f"diagnosis.json: {diagnosis['counts']}")
for v in variation: print("  variation:", v["text"])
for d in disagreement: print("  disagreement:", d["text"])
for g in gaps:
    if g["kind"] != "single_source_links": print("  gap:", g["text"])
print("  hubs (top 8):", [(h["label"], len(h["plants"])) for h in hubs[:8]])
for P, d in plant_diag.items(): print("  ", d["text"])
