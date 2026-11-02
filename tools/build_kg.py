#!/usr/bin/env python3
"""
Build the semantic knowledge graph (brief 2026-11-02, methods M32).

  python3 -I tools/build_graph.py      # first: brain/data/graph.json + diagnosis.json (claim edges, growth forms, diagnosis)
  python3 -I tools/build_kg.py         # then:  brain/data/kg.json

kg.json is a superset of graph.json: every graph.json node and edge is kept (same ids, same shape, so brain/js/diagnosis.js
still runs on it) and the XYZ layer is added on top —
  nodes   axis / category / facet nodes, taxon nodes, design (Z) concepts, plants, cultivars, sources, practitioners
  edges   every edge carries `rel` (relation vocabulary), `kg_status` (documented · derived · candidate · unknown), `verification`
          (the claim's status where one exists) and `basis` (claim ids, rule id or literature source):
            hierarchy   part_of / narrower_than                     ontology (documented)
            taxonomy    in_genus / in_family                         entity record (documented)
            classification  is_growth_form                           M29 reading of the sources (derived; status supported / to confirm)
            claim       grows_in / has_morphology / has_temporal_trait / has_ecological_value / resists / susceptible_to /
                        used_for / classified_as / has_origin         one per claim per concept (documented; verification = claim status)
            height_band in_height_band                               KG-R2 numeric bounds of the claim's range (derived)
            concept     requires_trait / maps_to / typically_formed_by / corresponds_to   ontology.relations (literature)
            design      suited_for                                   KG-R1 use mapping (derived) · KG-R4 requirement check (candidate | unknown)
            relation    companion / co_listed / competes / layered_under …   relations.json (documented · derived · candidate)
  claims  full index of every claim for the evidence trace
  gaps · conflicts   what is missing, unknown, contradicted or conditional — never shown as fact
Rules (named in every derived edge):
  KG-R1  a KPU landscape-use label that names a design concept maps to it (ontology maps_to); a plant with a sourced claim on
         that use is *derived* suited to the concept, with the claim as evidence and its verification status carried over.
  KG-R2  a quantitative height claim places the plant in every Robinson height band its range intersects; conditions,
         cultivar and place of the claim travel with the edge.
  KG-R3  a vertical layer corresponds to the height bands its plants occupy (ontology corresponds_to, to confirm).
  KG-R5  a plant occupies a vertical layer when its growth form forms that layer (typically_formed_by) and one of its height
         claims reaches a band the layer corresponds_to.
  KG-R4  a design concept's requires_trait relations are checked against the plant's live edges: met (evidence listed),
         unmet (claims on the facet, none matching — single-valued facets only, M16a) or unknown (no claim on the facet).
         All required met → *candidate* (inferred, never promoted); any required unmet → unmet; otherwise unknown.
Standard library only. Nothing in plants/, relations.json or ontology.json is written.
"""
import json, os
from collections import defaultdict
from itertools import combinations
from datetime import date

ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # a test root may be given (tools/scale_test.py)
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
ONT, GRAPH, DIAG, REL, SRC, SCHEMA = J("ontology.json"), J("brain/data/graph.json"), J("brain/data/diagnosis.json"), J("relations.json"), J("sources.json"), J("schema.json")
O = {n["id"]: n for n in ONT["nodes"]}
SOURCES = {s["id"]: s for s in SRC["sources"]}
PLANTS = {}
for f in sorted(os.listdir(os.path.join(ROOT, "plants"))):
    if f.endswith(".json"):
        p = J(os.path.join("plants", f)); PLANTS[p["entity"]["id"]] = p
TODAY = date.today().isoformat()
SINGLE_FACETS = {"habit", "form", "growth_rate", "evergreen", "growth_form", "height_band", "texture", "maintenance", "water", "invasive"}   # a non-matching claim here is an unmet requirement; on open lists it is unknown (M16a)

CAT_REL = {"cat:environment": "grows_in", "cat:morphology": "has_morphology", "cat:temporal": "has_temporal_trait", "cat:ecological": "has_ecological_value", "cat:growth_form_cat": "classified_as", "cat:taxonomy": "in_taxon", "cross:place": "recorded_in", "cross:time": "recorded_at_age"}
FIELD_REL = {"resistances": "resists", "pest_susceptibility": "susceptible_to", "landscape_use": "used_for", "ecological_value": "has_ecological_value", "entity.origin_status": "has_origin", "entity.kpu_plant_type": "classified_as"}


def rel_for(edge):
    if edge["type"] == "classification": return "is_growth_form"
    f = edge.get("field"); t = edge.get("target")
    if f in FIELD_REL: return FIELD_REL[f]
    if t and t in O: return CAT_REL.get(O[t].get("category"), "has_trait")
    return "notes"


def descendants(cid):
    out = [cid]
    for i in range(len(out)):
        for n in ONT["nodes"]:
            if n.get("parent") == out[i] and n["id"] not in out: out.append(n["id"])
    return out


def interval(v):
    if not isinstance(v, dict): return None
    if isinstance(v.get("median"), (int, float)) and v.get("unit") == "m": return (v.get("p10", v["median"]), v.get("p90", v["median"]))
    if "min" in v and "max" in v and v.get("unit") == "m": return (v["min"], v["max"])
    if "max" in v and v.get("unit") == "m": return (0, v["max"])
    if "height_m" in v: return (v["height_m"], v["height_m"])
    if "typical_max_m" in v: return (0, v["typical_max_m"])
    return None


# ---------------------------------------------------------------- nodes: graph.json's + the XYZ layer
nodes = []
seen = set()
for n in GRAPH["nodes"]:
    m = dict(n); o = O.get(n["id"])
    if o: m.update({"level": o.get("level", "concept"), "axis": o.get("axis"), "category": o.get("category"), "hierarchy_parent": o.get("hierarchy_parent")})
    nodes.append(m); seen.add(n["id"])
for o in ONT["nodes"]:
    if o["id"] in seen: continue
    m = {"id": o["id"], "type": "concept" if o.get("level", "concept") == "concept" else o["level"], "label": o["label"], "dimension": o["dimension"], "facet": o["facet"], "definition": o["definition"], "aliases": o.get("aliases", []), "parent": o.get("parent"), "order": o.get("order"), "source_of_term": o.get("source_of_term"),
         "level": o.get("level", "concept"), "axis": o.get("axis"), "category": o.get("category"), "hierarchy_parent": o.get("hierarchy_parent")}
    for k in ("min_m", "max_m", "to_confirm", "categories", "facets", "cross_layer", "facet_key"):
        if k in o: m[k] = o[k]
    nodes.append(m); seen.add(o["id"])
N = {n["id"]: n for n in nodes}
plant_ids = [n["id"] for n in nodes if n["type"] == "plant"]
plant_label = lambda pid: N[pid]["label"]
clabel = lambda cid: N[cid]["label"] if cid in N else cid

# ---------------------------------------------------------------- edges: graph.json's, annotated
edges = []
for e in GRAPH["edges"]:
    m = dict(e)
    if e["type"] in ("claim", "entity"):
        m["rel"] = rel_for(e); m["kg_status"] = "documented"; m["verification"] = e.get("status") if e["type"] == "claim" else "entity"
        m["basis"] = {"claims": [e["claim_id"]] if e.get("claim_id") else [], "source": e.get("source_id")}
    elif e["type"] == "classification":
        m["rel"] = "is_growth_form"; m["kg_status"] = "derived"; m["verification"] = e.get("status"); m["basis"] = {"rule": "M29", "evidence": e.get("evidence", {}), "weak": e.get("weak", [])}
    elif e["type"] == "relation":
        r = next((x for x in REL["relations"] if f"rel:{x['id']}" == e["id"]), {})
        m["kg_status"] = "candidate" if e.get("source_type") == "model" else ("derived" if str(e.get("context", "")).startswith("derived") else "documented")
        m["rel"] = e.get("relation"); m["verification"] = e.get("status"); m["basis"] = {"source": e.get("source_id"), "derived_from": e.get("derived_from") or [], "supporting_claims": e.get("supporting_claims") or [], "verify_against": r.get("verify_against") or [], "note": r.get("note")}
    elif e["type"] == "parent":
        m["rel"] = "narrower_than"; m["kg_status"] = "documented"; m["basis"] = {"source": "ontology.json"}
    elif e["type"] == "cultivar_of":
        m["rel"] = "cultivar_of"; m["kg_status"] = "documented"; m["basis"] = {"source": "claims with `cultivar`"}
    edges.append(m)
E_IDS = {e["id"] for e in edges}
def add(e):
    if e["id"] in E_IDS: raise SystemExit(f"duplicate edge id {e['id']}")
    E_IDS.add(e["id"]); edges.append(e); return e

# hierarchy: concept → group concept (already as 'parent' for v5 concepts) · concept → facet · facet → category · category → axis
for o in ONT["nodes"]:
    hp = o.get("hierarchy_parent")
    if not hp or hp == o.get("parent"): continue
    add({"id": f"hier:{o['id']}", "type": "hierarchy", "rel": "part_of", "source": o["id"], "target": hp, "kg_status": "documented", "live": True, "basis": {"source": "ontology.json (XYZ architecture, M31)"}})
for o in ONT["nodes"]:
    if o.get("parent") and f"parent:{o['id']}" not in E_IDS:
        add({"id": f"parent:{o['id']}", "type": "parent", "rel": "narrower_than", "source": o["id"], "target": o["parent"], "kg_status": "documented", "live": True, "basis": {"source": "ontology.json"}})
# taxonomy: plant → genus → family (entity records)
for pid, p in PLANTS.items():
    e = p["entity"]; gen = f"genus:{e['scientific_name'].split()[0].lower()}"; fam = f"family:{(e.get('family') or '').lower()}"
    if gen in N: add({"id": f"taxon:{pid}:genus", "type": "taxonomy", "rel": "in_genus", "source": f"plant:{pid}", "target": gen, "kg_status": "documented", "verification": "entity", "live": True, "basis": {"source": f"plants/{pid}.json entity.scientific_name"}, "text": f"{e['scientific_name']} belongs to the genus {clabel(gen)}."})
    if fam in N and gen in N and f"taxon:{gen}:family" not in E_IDS: add({"id": f"taxon:{gen}:family", "type": "taxonomy", "rel": "in_family", "source": gen, "target": fam, "kg_status": "documented", "verification": "entity", "live": True, "basis": {"source": f"plants/{pid}.json entity.family"}, "text": f"{clabel(gen)} is in the family {clabel(fam)}."})
# ontology concept relations (literature)
for r in ONT["relations"]:
    add({"id": f"ont:{r['id']}", "type": "concept", "rel": r["type"], "source": r["from"], "target": r["to"], "kg_status": r["status"], "live": True, "to_confirm": r.get("to_confirm", False), "strength": r.get("strength"), "alternatives": r.get("alternatives"), "rule": r.get("rule"), "note": r.get("note"), "basis": {"source": r["source"]},
         "text": {"requires_trait": f"{clabel(r['from'])} {'needs' if r.get('strength') == 'required' else 'prefers'} {' or '.join(clabel(a) for a in r.get('alternatives', [r['to']]))}.", "maps_to": f"KPU use ‘{clabel(r['from'])}’ names the design concept {clabel(r['to'])}.", "typically_formed_by": f"The {clabel(r['from']).lower()} is typically formed by plants of the form {clabel(r['to'])}.", "corresponds_to": f"The {clabel(r['from']).lower()} corresponds to the height band ‘{clabel(r['to'])}’."}[r["type"]]})

# height bands (KG-R2): every live quantitative height claim → the bands its range intersects
live_claim = lambda e: e["type"] in ("claim", "entity") and e.get("live") and e.get("target")
bands = [o for o in ONT["nodes"] if o["facet"] == "height_band"]
by_claim = defaultdict(list)
for e in edges:
    if e["type"] == "claim" and e.get("claim_id"): by_claim[e["claim_id"]].append(e)
for cid, es in by_claim.items():
    e0 = es[0]
    if not e0.get("live") or e0["field"] not in ("mature_height", "local_mature_size") or not e0.get("numbers"): continue
    iv = interval(e0["numbers"])
    if not iv: continue
    for b in bands:
        lo, hi = b.get("min_m", 0), b.get("max_m", 1e9)
        if iv[1] >= lo and iv[0] < hi:
            add({"id": f"band:{cid}:{b['id'].split(':')[1]}", "type": "height_band", "rel": "in_height_band", "source": e0["plant"], "plant": e0["plant"], "target": b["id"], "facet": "height_band", "kg_status": "derived", "verification": e0.get("status"), "live": True, "claim_id": cid, "source_id": e0["source_id"], "source_type": e0["source_type"], "conditions": e0.get("conditions") or [], "place": e0.get("place"), "cultivar": e0.get("cultivar"), "numbers": e0["numbers"], "status": e0.get("status"), "field": e0["field"],
                 "basis": {"rule": "KG-R2", "claims": [cid], "interval_m": list(iv), "band_m": [lo, None if hi == 1e9 else hi]}, "text": f"{plant_label(e0['plant'])} reaches {b['label'].lower()} by {e0.get('text')}"})

# ---------------------------------------------------------------- vertical layers (KG-R5): growth form that forms the layer AND a height band the layer corresponds to
formed_by = defaultdict(set); corr = defaultdict(set)
for r in ONT["relations"]:
    if r["type"] == "typically_formed_by": formed_by[r["from"]].add(r["to"])
    if r["type"] == "corresponds_to": corr[r["from"]].add(r["to"])
for pid in plant_ids:
    gf = next((e for e in edges if e["type"] == "classification" and e["source"] == pid), None)
    band_edges = [e for e in edges if e["type"] == "height_band" and e["source"] == pid]
    for layer in formed_by:
        if not gf or gf["target"] not in formed_by[layer]: continue
        hits = [e for e in band_edges if e["target"] in corr.get(layer, set())]
        if not hits: continue
        add({"id": f"layer:{pid}:{layer.split(':')[1]}", "type": "layer", "rel": "occupies_layer", "source": pid, "plant": pid, "target": layer, "facet": "layer", "kg_status": "derived", "verification": gf.get("status"), "live": True, "conditions": [c for e in hits for c in (e.get("conditions") or [])], "basis": {"rule": "KG-R5", "growth_form": gf["target"], "growth_form_status": gf.get("status"), "bands": sorted({e["target"] for e in hits}), "claims": sorted({e["claim_id"] for e in hits})},
             "text": f"{plant_label(pid)} can occupy the {clabel(layer).lower()}: it is read as {clabel(gf['target']).lower()} ({gf.get('status')}) and its height claims reach {', '.join(sorted({clabel(e['target']).lower() for e in hits}))} (KG-R5)."})

# ---------------------------------------------------------------- design edges (KG-R1 use mapping · KG-R4 requirement check)
plant_edges = defaultdict(list)
for e in edges:
    if e.get("live") and e.get("target") and e["type"] in ("claim", "entity", "classification", "height_band", "layer"): plant_edges[e["source"]].append(e)
maps = defaultdict(list)
for r in ONT["relations"]:
    if r["type"] == "maps_to": maps[r["to"]].append(r["from"])
reqs = defaultdict(list)
for r in ONT["relations"]:
    if r["type"] == "requires_trait": reqs[r["from"]].append(r)
Z = [o["id"] for o in ONT["nodes"] if o["dimension"] == "design" and o["facet"] != "height_band"]
facet_of = lambda cid: O[cid]["facet"] if cid in O else None
design_edges = []
for pid in plant_ids:
    mine = plant_edges[pid]
    facets_here = {e.get("facet") for e in mine}
    for z in Z:
        # KG-R1: a sourced claim on a KPU use that names this concept
        via = [e for e in mine if e["type"] == "claim" and e["target"] in maps.get(z, [])]
        # KG-R4: the concept's requirements against the plant's live edges
        checks = []
        for r in reqs.get(z, []):
            alts = r.get("alternatives") or [r["to"]]; fam = {d for a in alts for d in descendants(a)}
            hits = [e for e in mine if e["target"] in fam]
            facets = {facet_of(a) for a in alts}
            if hits: result = "met"
            elif facets & facets_here and facets <= SINGLE_FACETS: result = "unmet"
            else: result = "unknown"
            checks.append({"relation": f"ont:{r['id']}", "strength": r.get("strength", "required"), "alternatives": alts, "result": result, "evidence": [{"edge": e["id"], "claim": e.get("claim_id"), "target": e["target"], "verification": e.get("verification"), "conditions": e.get("conditions") or [], "cultivar": e.get("cultivar"), "source_id": e.get("source_id")} for e in hits], "contrary": [{"edge": e["id"], "claim": e.get("claim_id"), "target": e["target"], "source_id": e.get("source_id")} for e in mine if result == "unmet" and e.get("facet") in facets][:6], "to_confirm": r.get("to_confirm", False), "source": r["source"]})
        required = [c for c in checks if c["strength"] == "required"]; preferred = [c for c in checks if c["strength"] != "required"]
        pm = sum(1 for c in preferred if c["result"] == "met")
        if not checks: verdict = "no requirements recorded"
        elif required: verdict = "supported by traits" if all(c["result"] == "met" for c in required) else ("contradicted by traits" if any(c["result"] == "unmet" for c in required) else "evidence missing")
        else: verdict = f"preferences {pm} of {len(preferred)} met" + (" (weak support)" if pm else "")
        if not via and not checks: continue
        if via: status = "derived"
        elif verdict == "supported by traits" or (not required and pm): status = "candidate"
        else: status = "unknown"
        vers = {e.get("status") for e in via}
        missing = [c for c in checks if c["result"] != "met" and c["strength"] == "required"]
        conds = [c for e in via for c in (e.get("conditions") or [])]
        txt = (f"{plant_label(pid)} is listed for ‘{', '.join(sorted({clabel(e['target']) for e in via}))}’ by {', '.join(sorted({e['source_id'] for e in via}))}, which names {clabel(z)} (KG-R1)" if via else f"No source lists {plant_label(pid)} for {clabel(z)}") + (f"; trait check: {verdict}" + (f" — missing {', '.join(' or '.join(clabel(a) for a in c['alternatives']) for c in missing)}" if missing else "") + "." if checks else ".")
        design_edges.append({"id": f"design:{pid}:{z}", "type": "design", "rel": "suited_for", "source": pid, "plant": pid, "target": z, "facet": facet_of(z), "kg_status": status, "verification": ("verified" if "verified" in vers else "unverified") if via else "none", "live": True, "verdict": verdict, "via_uses": sorted({e["target"] for e in via}), "use_claims": sorted({e["claim_id"] for e in via}), "use_sources": sorted({e["source_id"] for e in via}), "conditions": conds, "requirements": checks, "missing": [{"alternatives": c["alternatives"], "strength": c["strength"], "result": c["result"]} for c in checks if c["result"] != "met"],
                             "basis": {"rule": "KG-R1 + KG-R4" if via and checks else ("KG-R1" if via else "KG-R4"), "claims": sorted({e["claim_id"] for e in via} | {ev["claim"] for c in checks for ev in c["evidence"] if ev.get("claim")})}, "text": txt})
for e in design_edges: add(e)

# ---------------------------------------------------------------- used flags, gaps, conflicts
targets_live = defaultdict(set)
for e in edges:
    if e.get("live") and e.get("target") and e["type"] in ("claim", "entity", "classification", "height_band", "layer") or (e["type"] == "design" and e["kg_status"] in ("derived", "candidate")):
        targets_live[e["target"]].add(e.get("plant") or e["source"])
for n in nodes:
    if n["type"] in ("concept",):
        fam = descendants(n["id"]); ps = set().union(*(targets_live.get(d, set()) for d in fam))
        n["used"] = bool(ps); n["n_plants"] = len(ps)
gaps = {"gate_facet_missing": [g for g in DIAG["gaps"] if g["kind"] == "gate_facet_missing"], "shared_concepts_no_relation": [g for g in DIAG["gaps"] if g["kind"] == "shared_concepts_no_relation"], "single_source_links": next((g for g in DIAG["gaps"] if g["kind"] == "single_source_links"), {}).get("count", 0),
        "design_unknown": [{"plant": e["plant"], "concept": e["target"], "missing": e["missing"], "text": e["text"]} for e in design_edges if e["kg_status"] == "unknown" and e["verdict"] == "evidence missing"],
        "design_contradicted": [{"plant": e["plant"], "concept": e["target"], "missing": e["missing"], "text": e["text"]} for e in design_edges if e["verdict"] == "contradicted by traits"],
        "design_concepts_without_plants": [{"concept": z, "label": clabel(z), "text": f"No plant in the store is linked to ‘{clabel(z)}’ by any source or rule."} for z in Z if not any(e["target"] == z and e["kg_status"] in ("derived", "candidate") for e in design_edges) and not any(e["type"] == "layer" and e["target"] == z for e in edges)],
        "relations_to_confirm": [r["id"] for r in ONT["relations"] if r.get("to_confirm")], "model_placeholders": [e["id"] for e in edges if e["type"] == "relation" and e["kg_status"] == "candidate"]}
conflicts = {"disagreement": DIAG["disagreement"], "variation": DIAG["variation"], "design_use_vs_traits": [{"plant": e["plant"], "concept": e["target"], "text": e["text"]} for e in design_edges if e["kg_status"] == "derived" and e["verdict"] == "contradicted by traits"]}

# ---------------------------------------------------------------- knowledge areas (ontology-defined) · per-plant summary · plant pairs
AREAS = ONT["xyz"].get("knowledge_areas", {})
AREA_OF_CAT = {c: a for a, d in AREAS.items() for c in d["categories"]}
area_of = lambda cid: AREA_OF_CAT.get((O.get(cid) or {}).get("category")) or ("classification" if (O.get(cid) or {}).get("dimension") in ("taxonomy", "classification") else "evidence" if (O.get(cid) or {}).get("facet") in ("place", "age") else None)
for n in nodes:
    if n["type"] == "concept": n["area"] = area_of(n["id"]); n["plants"] = sorted(targets_live.get(n["id"], set()) | {p for d in descendants(n["id"]) for p in targets_live.get(d, set())})
knowledge_edges = [e for e in edges if e.get("live") and e.get("target") and (e["type"] in ("claim", "entity", "classification", "height_band", "layer", "taxonomy") or (e["type"] == "design" and e["kg_status"] in ("derived", "candidate")))]
plant_areas = {}
for pid in plant_ids:
    mine = [e for e in knowledge_edges if (e.get("plant") or e["source"]) == pid]
    summary = {}
    for e in mine:
        a = area_of(e["target"]) or "evidence"; d = summary.setdefault(a, {"concepts": set(), "edges": 0, "verified": 0, "derived": 0, "candidate": 0})
        d["concepts"].add(e["target"]); d["edges"] += 1; d["verified"] += e.get("verification") == "verified"; d["derived"] += e.get("kg_status") == "derived"; d["candidate"] += e.get("kg_status") == "candidate"
    srcs = {e["source_id"] for e in mine if e.get("source_id") and e["type"] in ("claim",)}; places = {e["place"] for e in mine if e.get("place")}
    summary["evidence"] = {"concepts": places, "edges": len(srcs), "verified": 0, "derived": 0, "candidate": 0, "sources": sorted(srcs)}
    rels = [e for e in edges if e["type"] == "relation" and pid in (e["source"], e["target"])]
    summary["relations"] = {"concepts": {e["target"] if e["source"] == pid else e["source"] for e in rels}, "edges": len(rels), "verified": sum(1 for e in rels if e.get("verification") == "verified"), "derived": sum(1 for e in rels if e["kg_status"] == "derived"), "candidate": sum(1 for e in rels if e["kg_status"] == "candidate")}
    plant_areas[pid] = {a: {**d, "concepts": sorted(d["concepts"])} for a, d in summary.items()}
plant_pairs = []
for a, b in combinations(plant_ids, 2):
    ta = {e["target"]: e for e in knowledge_edges if (e.get("plant") or e["source"]) == a}; tb = {e["target"]: e for e in knowledge_edges if (e.get("plant") or e["source"]) == b}
    shared = sorted(set(ta) & set(tb)); by_area = defaultdict(list)
    for c in shared: by_area[area_of(c) or "evidence"].append(c)
    direct = [{"id": e["id"], "rel": e["rel"], "kg_status": e["kg_status"], "verification": e.get("verification"), "direction": e.get("direction"), "source_id": e.get("source_id"), "text": e.get("text")} for e in edges if e["type"] == "relation" and {e["source"], e["target"]} == {a, b}]
    sourced = [d for d in direct if d["kg_status"] != "candidate"]
    txt = f"{plant_label(a)} and {plant_label(b)} share {len(shared)} knowledge nodes" + (f" ({', '.join(f'{len(v)} {AREAS.get(k, {}).get('label', k).lower()}' for k, v in sorted(by_area.items(), key=lambda kv: -len(kv[1])))})" if shared else "") + "; " + (f"{len(sourced)} sourced relation{'s' if len(sourced) != 1 else ''} link them ({', '.join(d['rel'] for d in sourced)})" if sourced else "no sourced relation links them") + (f"; {len(direct) - len(sourced)} model placeholder{'s' if len(direct) - len(sourced) != 1 else ''} await evidence" if len(direct) > len(sourced) else "") + " — shared attributes are not a planting recommendation."
    plant_pairs.append({"plants": [a, b], "shared": shared, "shared_by_area": dict(by_area), "n_shared": len(shared), "direct_relations": direct, "n_sourced_relations": len(sourced), "text": txt})
plant_pairs.sort(key=lambda p: (-p["n_sourced_relations"], -p["n_shared"]))

# ---------------------------------------------------------------- claim index for the evidence trace
claims = {}
for pid, p in PLANTS.items():
    for c in p["claims"]:
        claims[c["id"]] = {k: c.get(k) for k in ("id", "plant", "field", "value", "value_kind", "value_label", "text", "source_id", "source_type", "context", "confidence", "status", "recorded_at", "recorded_by", "claim_kind", "accessed", "source_url", "citation", "note", "concepts", "conditions", "place", "time", "cultivar", "practitioner_meta", "derived_from", "retired_by", "retired_reason", "verify_against", "media") if k in c}
for r in REL["relations"]: claims[r["id"]] = {k: r.get(k) for k in r if k not in ("plant_a", "plant_b")} | {"plant_a": r["plant_a"], "plant_b": r["plant_b"], "kind": "relation"}

counts = {"nodes": len(nodes), "edges": len(edges), "concepts": sum(1 for n in nodes if n["type"] == "concept"), "concepts_in_use": sum(1 for n in nodes if n["type"] == "concept" and n.get("used")), "architecture_nodes": sum(1 for n in nodes if n["type"] in ("axis", "category", "facet")), "plants": len(plant_ids), "claims": len([c for c in claims.values() if c.get("kind") != "relation"]),
          "by_type": dict(sorted(defaultdict(int, {t: sum(1 for e in edges if e["type"] == t) for t in {e["type"] for e in edges}}).items())), "by_status": {s: sum(1 for e in edges if e.get("kg_status") == s) for s in ("documented", "derived", "candidate", "unknown")}, "design_edges": {s: sum(1 for e in design_edges if e["kg_status"] == s) for s in ("derived", "candidate", "unknown")}}
kg = {"generated": TODAY, "generated_by": "tools/build_kg.py", "ontology_version": ONT["$ontology_version"], "schema_version": SCHEMA["$schema_version"], "counts": counts, "xyz": ONT["xyz"], "dimensions": ONT["dimensions"], "gate_facets": GRAPH["gate_facets"], "growth_forms": GRAPH["growth_forms"],
      "rules": {"KG-R1": "a KPU landscape-use label that names a design concept maps to it (ontology maps_to); a plant with a sourced claim on that use is derived suited to the concept, with the claim as evidence", "KG-R2": "a quantitative height claim places the plant in every height band its range intersects; conditions, cultivar and place travel with the edge", "KG-R3": "a vertical layer corresponds to the height bands its plants occupy (to confirm)", "KG-R5": "a plant occupies a vertical layer when its growth form typically forms that layer and a height band the layer corresponds to is reached by one of its height claims; conditions travel with the edge", "KG-R4": "requires_trait relations checked against the plant's live edges: met / unmet (single-valued facet with non-matching claims) / unknown (no claim); all required met → candidate, never promoted; any unmet → contradicted; else evidence missing", "M29": "growth form read from the sources, never inferred from 'Broadleaf evergreen'"},
      "relation_vocabulary": {"part_of": "hierarchy: concept → facet → category → axis", "narrower_than": "concept → group concept", "in_genus / in_family": "taxonomy from the entity record", "is_growth_form": "classification (M29)", "grows_in": "plant → environmental condition (claim)", "has_morphology": "plant → height / spread / form / habit / texture / colour (claim)", "has_temporal_trait": "plant → growth rate / phenology / seasonality / leaf retention (claim)", "has_ecological_value": "plant → ecology / origin / invasive / toxicity / maintenance (claim)", "resists / susceptible_to": "plant → stress, browsing, pest (claim)", "used_for": "plant → KPU landscape use (claim)", "classified_as / has_origin": "entity record", "in_height_band": "plant → Robinson height band (KG-R2)", "occupies_layer": "plant → vertical layer (KG-R5)", "requires_trait / maps_to / typically_formed_by / corresponds_to": "concept → concept (literature)", "suited_for": "plant → design concept (KG-R1 derived · KG-R4 candidate / unknown)", "companion / co_listed / competes / layered_under / …": "plant → plant (relations.json)"},
      "knowledge_areas": AREAS, "plant_areas": plant_areas, "plant_pairs": plant_pairs, "nodes": nodes, "edges": edges, "claims": claims, "gaps": gaps, "conflicts": conflicts}
with open(os.path.join(ROOT, "brain", "data", "kg.json"), "w", encoding="utf-8") as f: json.dump(kg, f, ensure_ascii=False, indent=1)
print(f"kg.json: {counts}")
for pp in plant_pairs: print("  pair:", pp["text"])
for e in design_edges: print(f"  design [{e['kg_status']:9}] {e['text']}")
print(f"  gaps: {len(gaps['design_unknown'])} design unknown · {len(gaps['design_contradicted'])} contradicted · {len(gaps['design_concepts_without_plants'])} design concepts without plants · {len(gaps['relations_to_confirm'])} relations to confirm · {gaps['single_source_links']} single-source links")
