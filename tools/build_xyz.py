#!/usr/bin/env python3
"""
XYZ projection of the semantic knowledge graph (brief 2026-11-03 'XYZ Knowledge Graph Reconstruction', methods M48).

  python3 -I tools/build_kg.py       # first: brain/data/kg.json (the underlying graph, untouched here)
  python3 -I tools/build_xyz.py      # then:  brain/data/xyz.json (the reduced, explorable projection read by brain/xyz-preview/)

The projection deletes nothing: every visible node and edge names the kg.json ids it stands for (`underlying`), and the claims
and sources behind every edge are copied into `xyz.json` so the interface can show the evidence trace without loading kg.json.

Three exploration entrances (knowledge domains, not coordinate axes)
  X  Plant Classification   the botanical growth forms that have plants (Tree · Shrub · Herbaceous perennial · Fern on 2026-11-03;
                            a form with no plant is not shown).  Genus · family · cultivar are secondary taxonomy nodes.
  Y  Plant Knowledge        four browsing groups (Environment · Growth & Form · Seasonal & Ecological Performance · Maintenance & Risk)
                            over the knowledge concepts the claims actually reach.  Groups are navigation, not plant attributes.
                            Numeric classes (height / spread classes, hardiness zones, BEC zones, months …) stay attributes of the
                            plant and evidence of the edge; they do not become spheres (policy table Y_FACETS below).
  Z  Spatial Functions      five concepts this phase: Ceiling / Canopy · Ground Cover · Screen · Scrim · Barrier, each standing for the
                            ontology concepts named in Z_FUNCTIONS (e.g. Ceiling / Canopy = spatial:ceiling + layer:canopy).
                            Roles, compositions and KPU landscape uses stay in the underlying graph (uses are evidence of suited_for).

Visible relations (one line per semantic pair; the claims behind it are aggregated on the edge)
  is_growth_form   plant → X          M29 (derived; verification supported / to confirm)
  grows_in         plant → Y concept  environment claims (documented)
  has_trait        plant → Y concept  trait claims (documented) · height bands via KG-R2 (derived) · entity origin (documented)
  requires_trait   Z → Y (or X)       ontology literature relations, one line per alternative concept in use
  suited_for       plant → Z          kg.json design edges: derived (KG-R1 use mapping) · candidate (KG-R4 all required traits met);
                                      unknown ones are not drawn — they are listed on the Z node as gaps (evidence missing / contradicted)
  taxonomy         plant → genus → family · cultivar → plant (documented, entity record), expanded on demand
  plant → plant    relations.json live relations only (co_listed · companion · competes · layered_under …), typed, never 'related_to'
  navigation       entrance → X/Y/Z node · Y group → concept   (dotted; not knowledge)

Status (kg_status) and verification are separate on every edge: documented · derived · candidate · unknown; verified when at least one
live supporting claim is verified, else unverified (entity records read 'entity'); counts are kept.  Nothing is promoted here.
Standard library only; nothing in plants/, relations.json, ontology.json or kg.json is written.
"""
import json, os, sys
from collections import defaultdict, Counter
from datetime import date

ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
KG, ONT, SRC = J("brain/data/kg.json"), J("ontology.json"), J("sources.json")
N = {n["id"]: n for n in KG["nodes"]}
E = KG["edges"]
CLAIMS = KG["claims"]
SOURCES = {s["id"]: s for s in SRC["sources"]}
TODAY = date.today().isoformat()
OUT = os.path.join(ROOT, "brain/data/xyz.json")

# ---------------------------------------------------------------- the projection policy (the only editorial content of this file)
DIMENSIONS = {
    "x": {"id": "x", "label": "Plant Classification", "short": "Classification", "definition": "What the plant is: its botanical growth form, then genus, family and cultivars.", "underlying": ["axis:x"]},
    "y": {"id": "y", "label": "Plant Knowledge", "short": "Knowledge", "definition": "What the sources say about each plant: the conditions it grows in and the traits it shows, in four browsing groups.", "underlying": ["axis:y"]},
    "z": {"id": "z", "label": "Spatial Functions", "short": "Spatial", "definition": "What a planting does in space: five functions from the planting-design literature, linked to plants only by a recorded use or by a rule over recorded traits.", "underlying": ["axis:z"]},
}
# Y browsing groups: facet → group.  'node' facets become spheres; 'attribute' facets stay on the plant (and as edge evidence).
Y_GROUPS = [
    {"id": "y:environment", "label": "Environment", "definition": "Light, soil, water, habitat and hardiness the plant needs or tolerates.", "order": 1},
    {"id": "y:growth_form", "label": "Growth & Form", "definition": "Height band, habit, form, texture and growth rate — how big and what shape the plant becomes.", "order": 2},
    {"id": "y:seasonal_ecological", "label": "Seasonal & Ecological Performance", "definition": "Leaf retention, colour, seasonal interest, fruit, wildlife value and origin.", "order": 3},
    {"id": "y:maintenance_risk", "label": "Maintenance & Risk", "definition": "Maintenance level, stress and browsing resistance, pests, diseases and toxicity.", "order": 4},
]
Y_FACETS = {   # facet: (group, policy)
    "exposure": ("y:environment", "node"), "soil": ("y:environment", "node"), "water": ("y:environment", "node"), "habitat": ("y:environment", "node"), "wind": ("y:environment", "node"),
    "hardiness": ("y:environment", "attribute"), "hardiness_usda": ("y:environment", "attribute"), "hardiness_rhs": ("y:environment", "attribute"), "bgc_zone": ("y:environment", "attribute"),
    "height_band": ("y:growth_form", "node"), "habit": ("y:growth_form", "node"), "form": ("y:growth_form", "node"), "texture": ("y:growth_form", "node"), "growth_rate": ("y:growth_form", "node"),
    "height_class": ("y:growth_form", "attribute"), "spread_class": ("y:growth_form", "attribute"), "age": ("y:growth_form", "attribute"),
    "evergreen": ("y:seasonal_ecological", "node"), "interest": ("y:seasonal_ecological", "node"), "fruit": ("y:seasonal_ecological", "node"), "colour": ("y:seasonal_ecological", "node"),
    "ecology": ("y:seasonal_ecological", "node"), "origin": ("y:seasonal_ecological", "node"), "invasive": ("y:seasonal_ecological", "node"),
    "season": ("y:seasonal_ecological", "attribute"), "month": ("y:seasonal_ecological", "attribute"), "photoperiod": ("y:seasonal_ecological", "attribute"),
    "maintenance": ("y:maintenance_risk", "node"), "stress": ("y:maintenance_risk", "node"), "browsing": ("y:maintenance_risk", "node"), "pest": ("y:maintenance_risk", "node"),
    "toxicity": ("y:maintenance_risk", "attribute"),
}
Z_FUNCTIONS = [   # the five spatial functions of this phase, and the ontology concepts each stands for (first = primary)
    {"id": "z:ceiling_canopy", "label": "Ceiling / Canopy", "underlying": ["spatial:ceiling", "layer:canopy"], "definition": "Shade provision: a planting whose crowns form an overhead plane (Robinson's ceiling; the canopy layer). Not to be read as shade tolerance, which is an Environment concept."},
    {"id": "z:ground_cover", "label": "Ground Cover", "underlying": ["role:ground_cover", "layer:ground"], "definition": "A planting that carpets the ground plane (the ground layer; Robinson's ground-cover role)."},
    {"id": "z:screen", "label": "Screen", "underlying": ["spatial:screen"], "definition": "A planting that blocks a view, above eye level and dense."},
    {"id": "z:scrim", "label": "Scrim", "underlying": ["spatial:scrim"], "definition": "A planting that filters a view without blocking it: above eye level, open or twiggy (term to confirm)."},
    {"id": "z:barrier", "label": "Barrier", "underlying": ["spatial:barrier"], "definition": "A planting that stops movement: dense, knee height or above."},
]
GROWTH_FORM_ORDER = ["growth_form:tree", "growth_form:shrub", "growth_form:herbaceous_perennial", "growth_form:fern", "growth_form:graminoid", "growth_form:vine"]
STATUS_RANK = {"documented": 0, "derived": 1, "candidate": 2, "unknown": 3}
RULE_TEXT = dict(KG.get("rules", {}))
RULE_TEXT["M48"] = "the XYZ projection: visible edges aggregate the live kg.json edges between the same pair; status is the strongest underlying status, verification is verified only if a live supporting claim is verified; unknown design links are listed as gaps, never drawn"

# ---------------------------------------------------------------- helpers
def src_record(sid):
    s = SOURCES.get(sid)
    if not s:
        return {"id": sid, "label": sid, "type": None}
    parent = SOURCES.get(s.get("parent")) if s.get("parent") else None
    return {"id": sid, "label": s.get("name") or (f"{parent['name']} respondent {sid.split('-r')[-1]}" if parent else sid), "type": s.get("type"), "url": s.get("url") or (parent or {}).get("url"),
            "licence_tier": s.get("licence_tier") or (parent or {}).get("licence_tier"), "geo": s.get("geo_specificity"), "publisher": s.get("publisher") or (parent or {}).get("publisher"), "observer_background": s.get("observer_background")}


def claim_record(cid):
    c = CLAIMS.get(cid)
    if not c:
        return None
    keep = ("id", "plant", "field", "value", "value_kind", "text", "source_id", "source_type", "context", "confidence", "status", "recorded_at", "claim_kind", "conditions", "place", "time", "cultivar")
    r = {k: c.get(k) for k in keep}
    pm = c.get("practitioner_meta") or {}
    if pm:
        r["practitioner_meta"] = {k: pm.get(k) for k in ("basis", "completeness", "citable", "observer_background", "location", "season_observed") if pm.get(k) is not None}
    r["conditions"] = [{"facet": x.get("facet"), "concept": x.get("concept_id"), "label": N.get(x.get("concept_id"), {}).get("label", x.get("concept_id"))} for x in (c.get("conditions") or [])]
    r["place_label"] = N.get(c.get("place"), {}).get("label") if c.get("place") else None
    return r


def verification_of(claim_ids, entity=False):
    """verified only if at least one live supporting claim is verified (never promoted); counts kept."""
    st = Counter(CLAIMS[c]["status"] for c in claim_ids if c in CLAIMS)
    if entity and not claim_ids:
        return {"label": "entity", "verified": 0, "unverified": 0, "note": "entity record (identity_review), not a sourced claim"}
    if st.get("verified"):
        return {"label": "verified", "verified": st["verified"], "unverified": st.get("unverified", 0)}
    if st.get("unverified") or st.get("supported"):
        return {"label": "unverified", "verified": 0, "unverified": st.get("unverified", 0) + st.get("supported", 0)}
    return {"label": "none", "verified": 0, "unverified": 0}


def live(e):
    return e.get("live", True) is not False and e.get("verification") != "retired" and e.get("status") != "retired"


def facet_label(facet):
    return N.get(f"facet:{facet}", {}).get("label", facet)


# ---------------------------------------------------------------- nodes
nodes, edges = [], []
node_ids = set()
claims_used, sources_used = set(), set()


def add_node(n):
    assert n["id"] not in node_ids, n["id"]
    node_ids.add(n["id"]); nodes.append(n); return n


def add_edge(e):
    e.setdefault("underlying", [])
    for c in e.get("basis", {}).get("claims", []):
        claims_used.add(c)
    for s in e.get("basis", {}).get("sources", []):
        sources_used.add(s)
    edges.append(e); return e


for d in DIMENSIONS.values():
    add_node({"id": d["id"], "kind": "entrance", "dimension": d["id"], "label": d["label"], "short": d["short"], "definition": d["definition"], "underlying": d["underlying"], "initial": True})

# X: growth forms with plants
plants = [n for n in KG["nodes"] if n["type"] == "plant"]
gf_plants = defaultdict(list)
class_edges = {}
for e in E:
    if e["type"] == "classification":
        gf_plants[e["target"]].append(e["source"]); class_edges[e["source"]] = e
x_nodes = []
for gid in GROWTH_FORM_ORDER:
    g = N.get(gid)
    if not g or not gf_plants.get(gid):
        continue   # a form with no plant data is not shown (brief §2)
    x_nodes.append(add_node({"id": gid, "kind": "growth_form", "dimension": "x", "label": g["label"], "definition": g["definition"], "aliases": g.get("aliases", []), "n_plants": len(gf_plants[gid]), "plants": sorted(gf_plants[gid]), "underlying": [gid], "source_of_term": g.get("source_of_term"), "initial": True}))
    add_edge({"id": f"nav:x>{gid}", "type": "navigation", "rel": "entrance_of", "source": "x", "target": gid, "status": "navigation", "initial": True})
hidden_forms = [N[g]["label"] for g in GROWTH_FORM_ORDER if g in N and not gf_plants.get(g)]

# Y groups
for g in Y_GROUPS:
    add_node({"id": g["id"], "kind": "y_group", "dimension": "y", "label": g["label"], "definition": g["definition"], "order": g["order"], "facets": [f for f, (gg, p) in Y_FACETS.items() if gg == g["id"]], "node_facets": [f for f, (gg, p) in Y_FACETS.items() if gg == g["id"] and p == "node"], "initial": True})
    add_edge({"id": f"nav:y>{g['id']}", "type": "navigation", "rel": "entrance_of", "source": "y", "target": g["id"], "status": "navigation", "initial": True})

# Z functions
for z in Z_FUNCTIONS:
    prim = N[z["underlying"][0]]
    add_node({"id": z["id"], "kind": "function", "dimension": "z", "label": z["label"], "definition": z["definition"], "underlying": z["underlying"], "underlying_labels": [N[u]["label"] for u in z["underlying"]],
              "source_of_term": prim.get("source_of_term"), "aliases": sum((N[u].get("aliases", []) for u in z["underlying"]), []), "initial": True})
    add_edge({"id": f"nav:z>{z['id']}", "type": "navigation", "rel": "entrance_of", "source": "z", "target": z["id"], "status": "navigation", "initial": True})
Z_OF = {u: z["id"] for z in Z_FUNCTIONS for u in z["underlying"]}

# plants (with attributes from the 'attribute' facets and from the entity record)
plant_attr = defaultdict(lambda: defaultdict(list))
for p in sorted(plants, key=lambda p: p["label"]):
    gf = p.get("growth_form")
    add_node({"id": p["id"], "kind": "plant", "dimension": "x", "label": p["label"], "common": p.get("common", []), "family": p.get("family"), "plant_type": p.get("plant_type"), "origin_status": p.get("origin_status"), "growth_form": gf, "growth_form_status": p.get("growth_form_status"), "file": p.get("file"), "underlying": [p["id"]], "attributes": {}})

# Y concepts in use (node facets) — collected while aggregating the plant → concept edges
agg = defaultdict(lambda: {"claims": [], "edges": [], "rels": set(), "status": set(), "facet": None, "fields": set()})
for e in E:
    if e["type"] not in ("claim", "height_band", "entity") or not live(e):
        continue
    facet = e.get("facet")
    if facet not in Y_FACETS:
        continue
    plant, concept = e["source"], e["target"]
    if not plant.startswith("plant:") or concept not in N:
        continue
    group, policy = Y_FACETS[facet]
    cl = e.get("claim_id")
    if policy == "attribute":
        a = plant_attr[plant][facet]
        a.append({"concept": concept, "label": N[concept]["label"], "claim": cl, "source_id": e.get("source_id"), "status": e.get("verification") or e.get("status"), "conditions": [N.get(c.get("concept_id"), {}).get("label", c.get("concept_id")) for c in (e.get("conditions") or [])], "cultivar": e.get("cultivar"), "numbers": e.get("numbers"), "rule": "KG-R2" if e["type"] == "height_band" else None})
        if cl: claims_used.add(cl)
        continue
    key = (plant, concept)
    a = agg[key]; a["facet"] = facet; a["edges"].append(e["id"]); a["fields"].add(e.get("field") or "entity")
    if cl: a["claims"].append(cl)
    a["rels"].add("grows_in" if group == "y:environment" else "has_trait")
    a["status"].add("derived" if e["type"] == "height_band" else "documented")
    a.setdefault("rule", None)
    if e["type"] == "height_band": a["rule"] = "KG-R2"
    if e["type"] == "entity": a["entity"] = True
    a.setdefault("conditions", []); a["conditions"].extend([{"facet": c.get("facet"), "concept": c.get("concept_id"), "label": N.get(c.get("concept_id"), {}).get("label", c.get("concept_id")), "claim": cl} for c in (e.get("conditions") or [])])
    a.setdefault("cultivars", set())
    if e.get("cultivar"): a["cultivars"].add(e["cultivar"])

concept_plants = defaultdict(set)
for (plant, concept), a in agg.items():
    concept_plants[concept].add(plant)
for concept in sorted(concept_plants, key=lambda c: (Y_GROUPS.index(next(g for g in Y_GROUPS if g["id"] == Y_FACETS[N[c]["facet"]][0])), N[c]["facet"], N[c].get("order") or 99, N[c]["label"])):
    c = N[concept]; group = Y_FACETS[c["facet"]][0]
    add_node({"id": concept, "kind": "concept", "dimension": "y", "group": group, "facet": c["facet"], "facet_label": facet_label(c["facet"]), "label": c["label"], "definition": c.get("definition"), "aliases": c.get("aliases", []), "parent": c.get("parent"), "parent_label": N.get(c.get("parent"), {}).get("label") if c.get("parent") else None,
              "n_plants": len(concept_plants[concept]), "plants": sorted(concept_plants[concept]), "underlying": [concept], "source_of_term": c.get("source_of_term"), "min_m": c.get("min_m"), "max_m": c.get("max_m")})
    add_edge({"id": f"nav:{group}>{concept}", "type": "navigation", "rel": "groups", "source": group, "target": concept, "status": "navigation"})

for (plant, concept), a in sorted(agg.items()):
    status = min(a["status"], key=lambda s: STATUS_RANK[s])
    rel = "grows_in" if "grows_in" in a["rels"] else "has_trait"
    srcs = sorted({CLAIMS[c]["source_id"] for c in a["claims"] if c in CLAIMS})
    add_edge({"id": f"{rel}:{plant}>{concept}", "type": "semantic", "rel": rel, "source": plant, "target": concept, "facet": a["facet"], "status": status, "verification": verification_of(a["claims"], entity=a.get("entity", False)),
              "basis": {"claims": sorted(set(a["claims"])), "sources": srcs, "rule": a.get("rule"), "fields": sorted(a["fields"]), "entity": a.get("entity", False)}, "conditions": a.get("conditions", []), "cultivars": sorted(a.get("cultivars", [])), "underlying": sorted(a["edges"]), "n_claims": len(set(a["claims"]))})

# plant → X (is_growth_form)
for p in plants:
    e = class_edges.get(p["id"])
    if not e or e["target"] not in node_ids:
        continue
    basis = e.get("basis", {})
    ev = basis.get("evidence", {})
    claim_ids = sorted({v for v in ev.values() if isinstance(v, str) and v in CLAIMS})
    add_edge({"id": f"is_growth_form:{p['id']}>{e['target']}", "type": "semantic", "rel": "is_growth_form", "source": p["id"], "target": e["target"], "status": "derived", "verification": {"label": e.get("verification") or "to confirm", "verified": 0, "unverified": 0, "note": "M29 reading of the sources: supported = strong statements agree; to confirm = Kay's call"},
              "basis": {"claims": claim_ids, "sources": sorted({CLAIMS[c]["source_id"] for c in claim_ids}), "rule": "M29", "evidence": ev, "weak": basis.get("weak", [])}, "underlying": [e["id"]], "n_claims": len(claim_ids)})

# Z → Y / X (requires_trait), one line per alternative concept that exists in the projection
req_edges = [e for e in E if e["type"] == "concept" and e["rel"] == "requires_trait" and e["source"] in Z_OF]
for e in req_edges:
    zid = Z_OF[e["source"]]
    for alt in e.get("alternatives") or [e["target"]]:
        if alt not in node_ids:
            continue   # an alternative no plant reaches (e.g. habit:twiggy) is kept in the ontology, not drawn
        add_edge({"id": f"requires_trait:{zid}>{alt}:{e['id']}", "type": "semantic", "rel": "requires_trait", "source": zid, "target": alt, "status": "documented", "strength": e.get("strength"), "requirement": e["id"], "primary": alt == e["target"], "alternatives": e.get("alternatives"), "to_confirm": bool(e.get("to_confirm")),
                  "verification": {"label": "literature", "verified": 0, "unverified": 0, "note": "a literature statement about the concept, to confirm" if e.get("to_confirm") else "a literature statement about the concept"},
                  "basis": {"claims": [], "sources": [], "literature": e.get("basis", {}).get("source") or e.get("source_of_term") or (e.get("basis") or {}).get("literature"), "note": e.get("note"), "text": e.get("text")}, "underlying": [e["id"]]})

# plant → Z (suited_for): aggregate the design edges of every underlying concept; unknown = gap on the node
design = defaultdict(list)
for e in E:
    if e["type"] == "design" and e["target"] in Z_OF and live(e):
        design[(e["plant"], Z_OF[e["target"]])].append(e)
gaps = defaultdict(list)
for (plant, zid), es in sorted(design.items()):
    best = min(es, key=lambda e: STATUS_RANK[e["kg_status"]])
    status = best["kg_status"]
    use_claims = sorted({c for e in es for c in e.get("use_claims", [])})
    reqs = []
    for e in es:
        for r in e.get("requirements", []):
            reqs.append({"concept": e["target"], "concept_label": N[e["target"]]["label"], "relation": r["relation"], "strength": r["strength"], "alternatives": r["alternatives"], "alternative_labels": [N.get(a, {}).get("label", a) for a in r["alternatives"]], "result": r["result"],
                         "evidence": [{"claim": x.get("claim"), "target": x.get("target"), "target_label": N.get(x.get("target"), {}).get("label"), "verification": x.get("verification"), "conditions": x.get("conditions"), "cultivar": x.get("cultivar"), "source_id": x.get("source_id")} for x in r.get("evidence", [])],
                         "contrary": [{"claim": x.get("claim"), "target": x.get("target"), "target_label": N.get(x.get("target"), {}).get("label"), "source_id": x.get("source_id")} for x in r.get("contrary", [])], "to_confirm": r.get("to_confirm"), "source": r.get("source")})
            for x in r.get("evidence", []):
                if x.get("claim"): claims_used.add(x["claim"])
            for x in r.get("contrary", []):
                if x.get("claim"): claims_used.add(x["claim"])
    contradicted = any("contradicted" in (e.get("verdict") or "") for e in es)
    rec = {"plant": plant, "function": zid, "status": status, "verdicts": {e["target"]: e["verdict"] for e in es}, "via_uses": sorted({u for e in es for u in e.get("via_uses", [])}), "via_use_labels": sorted({N[u]["label"] for e in es for u in e.get("via_uses", []) if u in N}),
           "use_claims": use_claims, "use_sources": sorted({s for e in es for s in e.get("use_sources", [])}), "requirements": reqs, "contradicted": contradicted, "underlying": sorted(e["id"] for e in es)}
    if status in ("derived", "candidate"):
        ver = verification_of(use_claims) if use_claims else {"label": "none", "verified": 0, "unverified": 0, "note": "inferred from traits by KG-R4; no source states this use"}
        rules = sorted({"KG-R1" if e["kg_status"] == "derived" else "KG-R4" for e in es if e["kg_status"] in ("derived", "candidate")})
        add_edge({"id": f"suited_for:{plant}>{zid}", "type": "semantic", "rel": "suited_for", "source": plant, "target": zid, "status": status, "verification": ver, "basis": {"claims": use_claims, "sources": rec["use_sources"], "rule": " · ".join(rules), "rules": rules}, "design": rec, "conflict": contradicted, "underlying": rec["underlying"], "n_claims": len(use_claims)})
    else:
        missing = [{"strength": m["strength"], "result": m["result"], "alternatives": m["alternatives"], "alternative_labels": [N.get(a, {}).get("label", a) for a in m["alternatives"]]} for e in es for m in e.get("missing", [])]
        gaps[zid].append({"plant": plant, "plant_label": N[plant]["label"], "status": "unknown", "verdict": " / ".join(sorted({e["verdict"] for e in es})), "missing": missing, "underlying": rec["underlying"], "requirements": reqs})
for n in nodes:
    if n["kind"] == "function":
        n["gaps"] = sorted(gaps.get(n["id"], []), key=lambda g: g["plant_label"])
        linked = [e for e in edges if e["rel"] == "suited_for" and e["target"] == n["id"]]
        n["plants"] = sorted({e["source"] for e in linked}); n["n_plants"] = len(n["plants"])
        n["n_by_status"] = dict(Counter(e["status"] for e in linked)); n["n_unknown"] = len(n["gaps"])

# taxonomy (on demand): plant → genus → family; cultivar → plant
for e in E:
    if e["type"] == "taxonomy":
        for nid in (e["source"], e["target"]):
            if nid not in node_ids and nid in N:
                k = "genus" if nid.startswith("genus:") else "family"
                add_node({"id": nid, "kind": k, "dimension": "x", "label": N[nid]["label"], "definition": N[nid].get("definition"), "underlying": [nid], "secondary": True})
        add_edge({"id": f"{e['rel']}:{e['source']}>{e['target']}", "type": "taxonomy", "rel": e["rel"], "source": e["source"], "target": e["target"], "status": "documented", "verification": {"label": "entity", "verified": 0, "unverified": 0, "note": "entity record"}, "basis": {"claims": [], "sources": [], "entity": True}, "underlying": [e["id"]]})
    elif e["type"] == "cultivar_of":
        cv = N[e["source"]]
        add_node({"id": cv["id"], "kind": "cultivar", "dimension": "x", "label": cv["label"], "cultivar": cv.get("cultivar"), "plant": cv.get("plant"), "underlying": [cv["id"]], "secondary": True})
        add_edge({"id": f"cultivar_of:{e['source']}>{e['target']}", "type": "taxonomy", "rel": "cultivar_of", "source": e["source"], "target": e["target"], "status": "documented", "verification": {"label": "entity", "verified": 0, "unverified": 0, "note": "named in claims (`cultivar`)"}, "basis": {"claims": [], "sources": [], "entity": True}, "underlying": [e["id"]]})
for n in nodes:
    if n["kind"] in ("genus", "family"):
        n["plants"] = sorted({e["source"] for e in edges if e["rel"] == "in_genus" and e["target"] == n["id"]}) if n["kind"] == "genus" else sorted({p for g in [e["source"] for e in edges if e["rel"] == "in_family" and e["target"] == n["id"]] for p in [e["source"] for e in edges if e["rel"] == "in_genus" and e["target"] == g]})
        n["n_plants"] = len(n["plants"])

# plant → plant: relations.json records only (retired ones excluded), typed, one line per (pair, relation type) with every record as evidence
rel_groups = defaultdict(list)
for e in E:
    if e["type"] != "relation" or e.get("status") == "retired" or e.get("verification") == "retired":
        continue   # model placeholders are kept as candidates (relations.json records), drawn dashed and only while a plant is open
    rel_groups[(tuple(sorted((e["source"], e["target"]))), e["rel"])].append(e)
for (pair, rel), es in sorted(rel_groups.items()):
    best = min(es, key=lambda e: STATUS_RANK[e["kg_status"]])
    sc = sorted({c for e in es for c in (e.get("supporting_claims") or [])})
    for c in sc: claims_used.add(c)
    srcs = sorted({e["source_id"] for e in es if e.get("source_id")})
    for sid in srcs: sources_used.add(sid)
    n_ver = sum(1 for e in es if e.get("verification") == "verified")
    records = [{"id": e["id"], "relation": e["rel"], "from": e["source"], "to": e["target"], "direction": e.get("direction"), "status": e["kg_status"], "verification": e.get("verification"), "text": e.get("text"), "context": e.get("context"), "confidence": e.get("confidence"), "source_id": e.get("source_id"), "source_type": e.get("source_type"), "placeholder": e.get("source_type") == "model", "rule": e.get("basis", {}).get("rule"), "note": e.get("basis", {}).get("note"), "verify_against": e.get("basis", {}).get("verify_against"), "supporting_claims": e.get("supporting_claims") or []} for e in es]
    add_edge({"id": f"{rel}:{best['source']}>{best['target']}", "type": "plant_relation", "rel": rel, "source": best["source"], "target": best["target"], "status": best["kg_status"], "direction": best.get("direction"),
              "verification": {"label": "verified" if n_ver else (best.get("verification") or "unverified"), "verified": n_ver, "unverified": len(es) - n_ver},
              "basis": {"claims": sc, "sources": srcs, "rule": best.get("basis", {}).get("rule"), "note": best.get("basis", {}).get("note"), "verify_against": best.get("basis", {}).get("verify_against"), "records": len(es)}, "records": records,
              "text": best.get("text"), "context": best.get("context"), "confidence": best.get("confidence"), "source_type": best.get("source_type"), "placeholder": all(e.get("source_type") == "model" for e in es), "underlying": sorted(e["id"] for e in es), "n_claims": len(es)})

# plant attributes (not spheres): numeric classes, zones, KPU uses, months, toxicity, other design concepts outside this phase's Z
PA = {n["id"]: n for n in nodes if n["kind"] == "plant"}
for pid, facets in plant_attr.items():
    for facet, rows in facets.items():
        group = Y_FACETS[facet][0]
        PA[pid]["attributes"].setdefault(group, {})[facet] = {"label": facet_label(facet), "values": rows}
for e in E:
    if e["type"] == "claim" and live(e) and e.get("facet") == "use" and e["source"] in PA:
        PA[e["source"]]["attributes"].setdefault("z", {}).setdefault("use", {"label": "Landscape use (KPU vocabulary)", "values": []})["values"].append({"concept": e["target"], "label": N[e["target"]]["label"], "claim": e.get("claim_id"), "source_id": e.get("source_id"), "status": e.get("verification")})
        if e.get("claim_id"): claims_used.add(e["claim_id"])
    if e["type"] == "design" and live(e) and e["target"] not in Z_OF and e["plant"] in PA and e["kg_status"] in ("derived", "candidate"):
        PA[e["plant"]]["attributes"].setdefault("z", {}).setdefault("other_design", {"label": "Other design concepts (roles · compositions · layers — not Z nodes this phase)", "values": []})["values"].append({"concept": e["target"], "label": N[e["target"]]["label"], "status": e["kg_status"], "verdict": e.get("verdict")})
for p in PA.values():
    inc = [e for e in edges if e["type"] in ("semantic", "plant_relation", "taxonomy") and p["id"] in (e["source"], e["target"])]
    p["degree"] = {"concepts": sum(1 for e in inc if e["rel"] in ("grows_in", "has_trait")), "functions": sum(1 for e in inc if e["rel"] == "suited_for"), "relations": sum(1 for e in inc if e["type"] == "plant_relation"), "taxonomy": sum(1 for e in inc if e["type"] == "taxonomy")}
    p["n_claims"] = sum(1 for c in CLAIMS.values() if c.get("plant") == p["id"].split(":", 1)[1] and c["status"] != "retired")

# ---------------------------------------------------------------- demonstration paths, found in the projection (never written by hand)
EDGE_BY = defaultdict(list)
for e in edges:
    if e["type"] in ("semantic", "plant_relation"):
        EDGE_BY[e["source"]].append(e); EDGE_BY[e["target"]].append(e)
NODE = {n["id"]: n for n in nodes}
EDGE = {e["id"]: e for e in edges}


def between(a, b, rel=None):
    return [e for e in EDGE_BY[a] if {e["source"], e["target"]} == {a, b} and (rel is None or e["rel"] == rel)]


def weight(e):
    """prefer documented and verified evidence; candidate links are allowed but cost more; a use contradicted by traits costs more
    still; unknown never (not drawn)."""
    return STATUS_RANK[e["status"]] * 2 + (0 if e["verification"]["label"] in ("verified", "entity", "literature", "supported") else 1) + (3 if e.get("conflict") else 0) + (1 if "evidence missing" in (e.get("design") or {}).get("verdicts", {}).values() else 0)


USED = {"plants": set(), "functions": set(), "concepts": set()}


def novelty(p=None, z=None, c=None):
    return (2 if p in USED["plants"] else 0) + (2 if z in USED["functions"] else 0) + (1 if c in USED["concepts"] else 0)


def remember(p=None, z=None, c=None):
    if p: USED["plants"].add(p)
    if z: USED["functions"].add(z)
    if c: USED["concepts"].add(c)


def find_paths():
    out = []
    # X → plant → Y concept ← required by → Z : a classification entrance ending at a spatial function through a trait the function requires
    best = None
    for x in x_nodes:
        for p in x["plants"]:
            for e1 in [e for e in EDGE_BY[p] if e["rel"] in ("grows_in", "has_trait")]:
                c = e1["target"]
                for e2 in [e for e in EDGE_BY[c] if e["rel"] == "requires_trait"]:
                    z = e2["source"]
                    for e3 in between(p, z, "suited_for"):
                        w = weight(e1) + weight(e3) + (0 if e2.get("strength") == "required" else 1) + (1 if e2.get("to_confirm") else 0) + novelty(p, z, c)
                        cand = (w, [x["id"], p, c, z], [between(p, x["id"], "is_growth_form")[0]["id"], e1["id"], e2["id"], e3["id"]])
                        if best is None or cand[0] < best[0]: best = cand
    if best:
        out.append({"id": "path-x", "start": "x", "title": "From Classification", "nodes": best[1], "edges": best[2]}); remember(best[1][1], best[1][3], best[1][2])
    # Z → required Y concept ← plant → X : a spatial function back to the growth form of a plant that is suited to it and shows the required trait
    best = None
    for z in [n for n in nodes if n["kind"] == "function"]:
        for e2 in [e for e in EDGE_BY[z["id"]] if e["rel"] == "requires_trait" and e.get("strength") == "required"]:
            c = e2["target"]
            for e1 in [e for e in EDGE_BY[c] if e["rel"] in ("grows_in", "has_trait")]:
                p = e1["source"]
                for e3 in between(p, z["id"], "suited_for"):
                    ex = between(p, NODE[p]["growth_form"], "is_growth_form")
                    if not ex: continue
                    w = weight(e1) + weight(e3) + (1 if e2.get("to_confirm") else 0) + (0 if e3["status"] == "derived" else 1) + novelty(p, z["id"], c)
                    cand = (w, [z["id"], c, p, NODE[p]["growth_form"]], [e2["id"], e1["id"], e3["id"], ex[0]["id"]])
                    if best is None or cand[0] < best[0]: best = cand
    if best:
        out.append({"id": "path-z", "start": "z", "title": "From Spatial Function", "nodes": best[1], "edges": best[2]}); remember(best[1][2], best[1][0], best[1][1])
    # Y → concept ← two plants (indirect) → Z : a knowledge concept shared by two plants, one of which is suited to a function that requires it
    best = None
    for c in [n for n in nodes if n["kind"] == "concept" and n["n_plants"] >= 2]:
        req = [e for e in EDGE_BY[c["id"]] if e["rel"] == "requires_trait"]
        for e1 in [e for e in EDGE_BY[c["id"]] if e["rel"] in ("grows_in", "has_trait")]:
            p = e1["source"]
            others = [e for e in EDGE_BY[c["id"]] if e["rel"] in ("grows_in", "has_trait") and e["source"] != p]
            if not others: continue
            o = min(others, key=weight)
            for e2 in req:
                z = e2["source"]
                for e3 in between(p, z, "suited_for"):
                    w = weight(e1) + weight(o) + weight(e3) + (0 if e2.get("strength") == "required" else 1) + (0 if e1["verification"]["label"] == "verified" else 1) + novelty(p, z, c["id"])
                    cand = (w, [c["group"], c["id"], p, o["source"], z], [f"nav:{c['group']}>{c['id']}", e1["id"], o["id"], e3["id"], e2["id"]])
                    if best is None or cand[0] < best[0]: best = cand
    if best:
        out.append({"id": "path-y", "start": "y", "title": "From Plant Knowledge", "nodes": best[1], "edges": best[2]}); remember(best[1][2], best[1][4], best[1][1])
    for p in out:
        p["labels"] = [NODE[n]["label"] for n in p["nodes"]]
        p["steps"] = []
        for eid in p["edges"]:
            e = EDGE[eid]
            p["steps"].append({"edge": eid, "rel": e["rel"], "from": e["source"], "to": e["target"], "status": e["status"], "verification": (e.get("verification") or {}).get("label"), "claims": e.get("basis", {}).get("claims", []), "sources": e.get("basis", {}).get("sources", []), "rule": e.get("basis", {}).get("rule"), "literature": e.get("basis", {}).get("literature")})
        p["evidence_claims"] = sorted({c for s in p["steps"] for c in s["claims"]})
        p["evidence_sources"] = sorted({s for st in p["steps"] for s in st["sources"]} | {CLAIMS[c]["source_id"] for c in p["evidence_claims"] if c in CLAIMS})
    return out


paths = find_paths()

# ---------------------------------------------------------------- claims and sources referenced, statistics, write
claims = {c: claim_record(c) for c in sorted(claims_used) if c in CLAIMS}
for c in claims.values():
    sources_used.add(c["source_id"])
sources = {s: src_record(s) for s in sorted(sources_used)}
sem = [e for e in edges if e["type"] != "navigation"]
stats = {
    "underlying": {"nodes": KG["counts"]["nodes"], "edges": KG["counts"]["edges"], "by_type": KG["counts"]["by_type"], "by_status": KG["counts"]["by_status"], "claims": KG["counts"]["claims"], "generated": KG.get("generated")},
    "projection": {"nodes": len(nodes), "edges": len(edges), "nodes_by_kind": dict(Counter(n["kind"] for n in nodes)), "edges_by_type": dict(Counter(e["type"] for e in edges)), "edges_by_rel": dict(Counter(e["rel"] for e in edges)),
                   "edges_by_status": dict(Counter(e["status"] for e in sem)), "edges_by_verification": dict(Counter((e.get("verification") or {}).get("label") for e in sem)), "semantic_edges": len(sem), "claims_referenced": len(claims), "sources_referenced": len(sources), "z_gaps": sum(len(n.get("gaps", [])) for n in nodes if n["kind"] == "function")},
    "initial": {"nodes": sum(1 for n in nodes if n.get("initial")), "edges": sum(1 for e in edges if e.get("initial"))},
    "hidden_growth_forms": hidden_forms,
    "attribute_facets": sorted(f for f, (g, p) in Y_FACETS.items() if p == "attribute"),
}
out = {"generated": TODAY, "generated_by": "tools/build_xyz.py", "kg_generated": KG.get("generated"), "ontology_version": KG.get("ontology_version"), "schema_version": KG.get("schema_version"), "method": "M48",
       "dimensions": DIMENSIONS, "y_groups": Y_GROUPS, "y_facets": {f: {"group": g, "policy": p} for f, (g, p) in Y_FACETS.items()}, "z_functions": Z_FUNCTIONS, "status_vocabulary": {"documented": "a source states it", "derived": "produced by a recorded rule from recorded claims", "candidate": "inferred (KG-R4) or a model placeholder — never promoted", "unknown": "no evidence to judge; listed as a gap, never drawn"},
       "rules": RULE_TEXT, "nodes": nodes, "edges": edges, "claims": claims, "sources": sources, "paths": paths, "stats": stats}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=0)
print(f"xyz.json: {len(nodes)} nodes · {len(edges)} edges ({len(sem)} semantic) · initial {stats['initial']['nodes']} / {stats['initial']['edges']} · {len(claims)} claims · {len(sources)} sources · {len(paths)} paths · {stats['projection']['z_gaps']} Z gaps")
print("  nodes:", stats["projection"]["nodes_by_kind"]); print("  rels: ", stats["projection"]["edges_by_rel"]); print("  status:", stats["projection"]["edges_by_status"]); print("  verification:", stats["projection"]["edges_by_verification"])
for p in paths:
    print(f"  {p['id']}: " + " → ".join(p["labels"]) + f"  [{', '.join(s['status'] for s in p['steps'])}]")
