#!/usr/bin/env python3
"""
Explorer projection (brief 2026-11-07 'Plant Knowledge Explorer — Phase 1', methods M49).

  python3 -I tools/pipeline.py            # ontology → graph → kg → xyz → explorer → validate
  python3 -I tools/build_explorer.py      # alone: brain/data/explorer.json from kg.json + xyz.json + relations.json + sources.json

A relational projection of the canonical data for brain/explorer/ — the linked Graph · Spatial Function Matrix · Attribute Table ·
A/B inspector.  Nothing is stored twice as truth: every record names the kg.json / xyz.json ids and the claims it stands for, and the
interface reads this file and nothing else about the plants.  The file is rebuilt by the pipeline, so updating a plant file never
means editing frontend data.

Logical collections (the 'GIS attribute table' is a view, not the storage):
  species            the ten plants: identity from the entity records (plants/*.json via kg.json plant nodes), taxonomy, claim counts
  facets             the attribute columns: every ontology facet the claims reach, with its knowledge group and policy (from build_xyz)
  attributes         one cell per (species, facet) that has at least one live claim or entity record: EVERY distinct value kept with
                     its claims, sources, conditions, cultivar, verification — never one 'best' value; `disagreement` flags a kg.json
                     disagreement on that cell; a (species, facet) with no cell is 'not recorded' (the interface says so; nothing is
                     written for it)
  functions          the five spatial functions of this phase (xyz z_functions) with their literature requirements
  function_links     EXACTLY species × functions cells.  status documented · derived · candidate · unknown (kg vocabulary, build_xyz
                     aggregation: strongest live design edge); `conflict` (a recorded trait contradicts a requirement) and
                     `verification` (verified only if a live use claim is verified) kept apart from status; unknown cells carry
                     their verdict ('evidence missing' vs 'contradicted by traits') and the full requirement check so a blank is
                     never read as unsuitable.  Drawn in the graph only when status is derived or candidate (as xyz does).
  relations          every relations.json record incl. retired ones (retired = history, never a live edge), typed, with its source
  pairs              the 45 unordered species pairs: shared concepts by area (kg plant_pairs), live direct relation ids, retired ids,
                     and the spatial-complementarity candidates (distinct function combinations the two plants' live links allow) —
                     labelled as design hypotheses, never as compatibility evidence
  concept_links      the plant → concept lines of xyz (grows_in · has_trait) so the graph can show WHY a plant meets a requirement
  claims, sources, rules, evidence_checks   the evidence layer: claims copied from xyz (plus any retired claim a record names),
                     AI source assessments (review/ai/assessments, an assessment — never a verification) keyed by claim id
Standard library only; nothing in plants/, relations.json, review/, kg.json or xyz.json is written.
"""
import glob, json, os, sys
from collections import Counter, defaultdict
from datetime import date

ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
KG, X, REL, SRC = J("brain/data/kg.json"), J("brain/data/xyz.json"), J("relations.json"), J("sources.json")
KN = {n["id"]: n for n in KG["nodes"]}
KE = {e["id"]: e for e in KG["edges"]}
XN = {n["id"]: n for n in X["nodes"]}
XE = {e["id"]: e for e in X["edges"]}
CLAIMS = dict(X["claims"])            # the claims the projection cites (copied, not re-derived)
KCLAIMS = KG["claims"]
SOURCES = {s["id"]: s for s in SRC["sources"]}
TODAY = date.today().isoformat()
OUT = os.path.join(ROOT, "brain/data/explorer.json")
STATUS_RANK = {"documented": 0, "derived": 1, "candidate": 2, "unknown": 3}

VOCAB = {
    "status": {   # what kind of knowledge a link is (kg.json vocabulary, unchanged)
        "documented": "a source states it (a claim or a relation record)",
        "derived": "produced by a recorded rule over recorded claims (KG-R1 use → function, KG-R2 height → band, M29 growth form)",
        "candidate": "inferred from traits by KG-R4, or a model placeholder — never promoted to documented",
        "unknown": "no evidence to judge, or a recorded trait contradicts a requirement — listed as a gap, never drawn as a link",
    },
    "verification": {   # whether a human verified the statement — independent of status
        "verified": "at least one live supporting claim or record was verified by a human (open data, survey)",
        "unverified": "supporting claims exist but no human has verified them",
        "none": "no supporting claim: the link is an inference (KG-R4) or an entity record",
        "entity": "read from the plant's entity record (identity_review), not from a sourced claim",
        "literature": "a literature statement about a concept (requirement), not about a plant",
    },
    "evidence_check": {   # the AI source assessment layer (review/ai) — an assessment, never a verification
        "supported_by_source": "the AI reviewer found the statement on the source page",
        "partially_supported": "the AI reviewer found part of it, or a different wording / unit / scope",
        "conflicting_evidence": "the AI reviewer found the source says otherwise",
        "not_assessed": "no AI assessment on record (verified claims were not queued)",
    },
    "unknown_verdict": {
        "evidence missing": "no claim on a required trait — the database does not know; not a suitability verdict",
        "contradicted by traits": "a recorded claim places the plant outside a required trait — evidence against, under the stated conditions, cultivar and source",
    },
    "pair_sections": {
        "shared_attributes": "concepts both plants reach through their own claims — a computable overlap, not companion-planting evidence",
        "direct_relations": "records in relations.json for this pair — the only direct plant-to-plant knowledge; retired records are history",
        "spatial_complementarity": "distinct spatial functions the two plants' live links allow — a design hypothesis pending site, spacing and biological checks",
        "evidence_unknowns": "sources behind the above, and what the database does not know about the pair",
    },
}


# ---------------------------------------------------------------- helpers
def src_record(sid):
    s = SOURCES.get(sid)
    if not s:
        return X["sources"].get(sid) or {"id": sid, "label": sid, "type": None}
    parent = SOURCES.get(s.get("parent")) if s.get("parent") else None
    return {"id": sid, "label": s.get("name") or (f"{parent['name']} respondent {sid.split('-r')[-1]}" if parent else sid), "type": s.get("type"), "url": s.get("url") or (parent or {}).get("url"),
            "licence_tier": s.get("licence_tier") or (parent or {}).get("licence_tier"), "geo": s.get("geo_specificity"), "publisher": s.get("publisher") or (parent or {}).get("publisher"), "observer_background": s.get("observer_background")}


def claim_record(cid):
    """copy a claim into the index from kg.json when xyz did not cite it (e.g. a retired claim a relation names)."""
    if cid in CLAIMS:
        return CLAIMS[cid]
    c = KCLAIMS.get(cid)
    if not c:
        return None
    keep = ("id", "plant", "field", "value", "value_kind", "text", "source_id", "source_type", "context", "confidence", "status", "recorded_at", "claim_kind", "conditions", "place", "time", "cultivar", "retired_by", "retired_at")
    r = {k: c.get(k) for k in keep if c.get(k) is not None or k in ("id", "plant", "field", "status")}
    r["conditions"] = [{"facet": x.get("facet"), "concept": x.get("concept_id"), "label": KN.get(x.get("concept_id"), {}).get("label", x.get("concept_id"))} for x in (c.get("conditions") or [])]
    r["place_label"] = KN.get(c.get("place"), {}).get("label") if c.get("place") else None
    CLAIMS[cid] = r
    return r


def live(e):
    return e.get("live", True) is not False and e.get("verification") != "retired" and e.get("status") != "retired"


plants_slug = {n["id"]: n["id"].split(":", 1)[1] for n in X["nodes"] if n["kind"] == "plant"}
SPECIES_IDS = sorted(plants_slug)

# ---------------------------------------------------------------- species (identity from entity records)
species = []
for pid in SPECIES_IDS:
    n = XN[pid]; k = KN[pid]
    slug = plants_slug[pid]
    st = Counter(c["status"] for c in KCLAIMS.values() if c.get("plant") == slug)
    gf = XN.get(n.get("growth_form"))
    gfe = XE.get(f"is_growth_form:{pid}>{n.get('growth_form')}")
    genus = [e for e in X["edges"] if e["rel"] == "in_genus" and e["source"] == pid]
    family = [e for e in X["edges"] if e["rel"] == "in_family" and e["source"] == (genus[0]["target"] if genus else None)]
    cultivars = sorted({XN[e["source"]].get("cultivar") for e in X["edges"] if e["rel"] == "cultivar_of" and e["target"] == pid} - {None})
    species.append({"id": pid, "slug": slug, "scientific_name": n["label"], "common_names": n.get("common", []), "family": n.get("family"), "genus": XN[genus[0]["target"]]["label"] if genus else None,
                    "kpu_plant_type": n.get("plant_type"), "origin_status": n.get("origin_status"), "growth_form": n.get("growth_form"), "growth_form_label": gf["label"] if gf else None,
                    "growth_form_status": n.get("growth_form_status"), "growth_form_rule": "M29", "growth_form_edge": gfe["id"] if gfe else None, "growth_form_evidence": (gfe or {}).get("basis", {}).get("evidence", {}),
                    "cultivars_in_claims": cultivars, "file": n.get("file"), "underlying": {"kg": pid, "xyz": pid},
                    "claims": {"live": st.get("verified", 0) + st.get("unverified", 0), "verified": st.get("verified", 0), "unverified": st.get("unverified", 0), "retired": st.get("retired", 0)}})
SP = {s["id"]: s for s in species}

# ---------------------------------------------------------------- facets (the attribute columns) and attribute cells
groups = {g["id"]: g for g in X["y_groups"]}
facets = []
facet_seen = set()


def facet_label(f):
    return KN.get(f"facet:{f}", {}).get("label", f)


for f, pol in X["y_facets"].items():
    facets.append({"id": f, "label": facet_label(f), "group": pol["group"], "group_label": groups[pol["group"]]["label"], "order": groups[pol["group"]]["order"], "policy": pol["policy"],
                   "definition": KN.get(f"facet:{f}", {}).get("definition"), "gate": f in set(KG.get("gate_facets", []))})
    facet_seen.add(f)
FACET = {f["id"]: f for f in facets}

# disagreements recorded by build_kg (plant × facet)
disagree = defaultdict(list)
for d in KG.get("conflicts", {}).get("disagreement", []):
    disagree[(d["plant"], d["facet"])].append({"claims": d.get("claims", []), "sources": d.get("sources", []), "conditions": d.get("conditions", []), "text": d.get("text")})
variation = defaultdict(list)
for d in KG.get("conflicts", {}).get("variation", []):
    variation[(d["plant"], d["facet"])].append({"claims": d.get("claims", []), "text": d.get("text")})

cells = {}
# (a) node facets: the xyz plant → concept lines (one per concept, claims aggregated)
for e in X["edges"]:
    if e["rel"] not in ("grows_in", "has_trait"):
        continue
    pid, cid, f = e["source"], e["target"], e["facet"]
    if f not in FACET:
        continue
    cell = cells.setdefault((pid, f), {"species": pid, "facet": f, "values": [], "claims": set(), "sources": set(), "edges": [], "entity": False, "rule": None})
    c = XN[cid]
    cell["values"].append({"concept": cid, "label": c["label"], "status": e["status"], "verification": e["verification"]["label"], "n_verified": e["verification"].get("verified", 0), "n_unverified": e["verification"].get("unverified", 0),
                           "claims": e["basis"]["claims"], "sources": e["basis"]["sources"], "entity": e["basis"].get("entity", False), "rule": e["basis"].get("rule"),
                           "conditions": sorted({x["label"] for x in e.get("conditions", []) if x.get("label")}), "cultivars": e.get("cultivars", []), "edge": e["id"], "numbers": None})
    cell["claims"].update(e["basis"]["claims"]); cell["sources"].update(e["basis"]["sources"]); cell["edges"].append(e["id"])
    if e["basis"].get("entity"): cell["entity"] = True
    if e["basis"].get("rule"): cell["rule"] = e["basis"]["rule"]
# (b) attribute facets: kept on the xyz plant node (numbers, zones, months …) — one value row per (concept, claim)
for pid in SPECIES_IDS:
    for gid, fs in (XN[pid].get("attributes") or {}).items():
        if gid == "z":
            continue
        for f, a in fs.items():
            if f not in FACET:
                continue
            cell = cells.setdefault((pid, f), {"species": pid, "facet": f, "values": [], "claims": set(), "sources": set(), "edges": [], "entity": False, "rule": None})
            by = {}
            for v in a["values"]:
                key = v["concept"]
                r = by.setdefault(key, {"concept": key, "label": v["label"], "status": "derived" if v.get("rule") else "documented", "verification": "unverified", "n_verified": 0, "n_unverified": 0, "claims": [], "sources": [], "entity": False, "rule": v.get("rule"), "conditions": [], "cultivars": [], "edge": None, "numbers": []})
                if v.get("claim") and v["claim"] not in r["claims"]: r["claims"].append(v["claim"])
                if v.get("source_id") and v["source_id"] not in r["sources"]: r["sources"].append(v["source_id"])
                if v.get("status") == "verified": r["n_verified"] += 1
                elif v.get("claim"): r["n_unverified"] += 1
                for cnd in v.get("conditions") or []:
                    if cnd not in r["conditions"]: r["conditions"].append(cnd)
                if v.get("cultivar") and v["cultivar"] not in r["cultivars"]: r["cultivars"].append(v["cultivar"])
                if v.get("numbers") and v["numbers"] not in r["numbers"]: r["numbers"].append(v["numbers"])
            for r in by.values():
                r["verification"] = "verified" if r["n_verified"] else ("unverified" if r["n_unverified"] else "none")
                cell["values"].append(r); cell["claims"].update(r["claims"]); cell["sources"].update(r["sources"])
                if r["rule"]: cell["rule"] = r["rule"]

attributes = []
for (pid, f), cell in sorted(cells.items()):
    vals = cell["values"]
    vers = "verified" if any(v["verification"] == "verified" for v in vals) else ("unverified" if any(v["verification"] == "unverified" for v in vals) else ("entity" if cell["entity"] else "none"))
    dis = disagree.get((pid, f), []); var = variation.get((pid, f), [])
    attributes.append({"id": f"attr:{pid}:{f}", "species": pid, "facet": f, "group": FACET[f]["group"], "n_values": len(vals), "n_claims": len(cell["claims"]), "n_sources": len(cell["sources"]),
                       "verification": vers, "status": min((v["status"] for v in vals), key=lambda s: STATUS_RANK[s]), "rule": cell["rule"], "entity": cell["entity"],
                       "disagreement": [{"claims": d["claims"], "sources": d["sources"], "conditions": d["conditions"], "text": d["text"]} for d in dis], "variation": [{"claims": d["claims"], "text": d["text"]} for d in var],
                       "values": sorted(vals, key=lambda v: (-len(v["claims"]), v["label"])), "claims": sorted(cell["claims"]), "sources": sorted(cell["sources"]), "underlying": {"xyz_edges": cell["edges"]}})
ATTR = {(a["species"], a["facet"]): a for a in attributes}
facets_in_use = {a["facet"] for a in attributes}
facets = [f for f in facets if f["id"] in facets_in_use]
FACET_ORDER = list(X["y_facets"].keys())   # the facet → group table of build_xyz, in its own order
facets.sort(key=lambda f: (f["order"], f["policy"] != "node", FACET_ORDER.index(f["id"])))
for f in facets:
    f["n_species"] = sum(1 for a in attributes if a["facet"] == f["id"])

# ---------------------------------------------------------------- functions (Z) and their requirements
functions = []
req_by_fn = defaultdict(dict)
for e in X["edges"]:
    if e["rel"] != "requires_trait":
        continue
    r = req_by_fn[e["source"]].setdefault(e["requirement"], {"id": e["requirement"], "strength": e["strength"], "alternatives": e["alternatives"] or [e["target"]], "alternative_labels": [], "to_confirm": e["to_confirm"], "literature": e["basis"].get("literature"), "note": e["basis"].get("note"), "text": e["basis"].get("text"), "facets": [], "lines": []})
    r["lines"].append(e["id"])
for z in X["z_functions"]:
    n = XN[z["id"]]
    reqs = []
    for rid, r in req_by_fn[z["id"]].items():
        r["alternative_labels"] = [KN.get(a, {}).get("label", a) for a in r["alternatives"]]
        r["facets"] = sorted({KN[a]["facet"] for a in r["alternatives"] if a in KN})
        reqs.append(r)
    # requirements that have no drawn line because no plant reaches any alternative (kept in the ontology): take them from kg
    for ke in KG["edges"]:
        if ke["type"] == "concept" and ke["rel"] == "requires_trait" and ke["source"] in z["underlying"] and ke["id"] not in req_by_fn[z["id"]]:
            alts = ke.get("alternatives") or [ke["target"]]
            reqs.append({"id": ke["id"], "strength": ke.get("strength"), "alternatives": alts, "alternative_labels": [KN.get(a, {}).get("label", a) for a in alts], "to_confirm": bool(ke.get("to_confirm")), "literature": (ke.get("basis") or {}).get("source"), "note": ke.get("note"), "text": ke.get("text"), "facets": sorted({KN[a]["facet"] for a in alts if a in KN}), "lines": [], "no_plant_reaches": True})
    reqs.sort(key=lambda r: (r["strength"] != "required", r["id"]))
    functions.append({"id": z["id"], "label": z["label"], "definition": z["definition"], "underlying": z["underlying"], "underlying_labels": n.get("underlying_labels", []), "source_of_term": n.get("source_of_term"), "aliases": n.get("aliases", []),
                      "requirements": reqs, "required_facets": sorted({f for r in reqs for f in r["facets"]}), "n_linked": n.get("n_plants", 0), "n_by_status": n.get("n_by_status", {}), "n_unknown": n.get("n_unknown", 0)})
FN = {f["id"]: f for f in functions}

# ---------------------------------------------------------------- function links: exactly species × functions
function_links = []
drawn = {(e["source"], e["target"]): e for e in X["edges"] if e["rel"] == "suited_for"}
gaps = {(g["plant"], f["id"]): g for f in X["nodes"] if f["kind"] == "function" for g in f.get("gaps", [])}
for pid in SPECIES_IDS:
    for fn in functions:
        key = (pid, fn["id"])
        base = {"id": f"link:{pid}>{fn['id']}", "species": pid, "function": fn["id"]}
        if key in drawn:
            e = drawn[key]; d = e["design"]
            for c in d["use_claims"]: claim_record(c)
            function_links.append({**base, "status": e["status"], "drawn": True, "conflict": bool(e.get("conflict")), "verification": e["verification"]["label"], "n_verified": e["verification"].get("verified", 0), "n_unverified": e["verification"].get("unverified", 0), "verification_note": e["verification"].get("note"),
                                   "evidence_kind": "use_claim" if d["use_claims"] else "trait_inference", "rule": e["basis"]["rule"], "rules": e["basis"].get("rules", []), "verdicts": d["verdicts"], "via_uses": d["via_uses"], "via_use_labels": d["via_use_labels"], "use_claims": d["use_claims"], "use_sources": d["use_sources"],
                                   "requirements": d["requirements"], "xyz_edge": e["id"], "underlying": e["underlying"]})
        elif key in gaps:
            g = gaps[key]
            function_links.append({**base, "status": "unknown", "drawn": False, "conflict": False, "verification": "none", "n_verified": 0, "n_unverified": 0, "verification_note": "no link to verify",
                                   "evidence_kind": "none", "rule": "KG-R4", "rules": ["KG-R4"], "verdict": g["verdict"], "missing": g["missing"], "requirements": g["requirements"], "xyz_edge": None, "underlying": g["underlying"]})
        else:   # no design edge at all (cannot happen while build_kg checks every plant × concept; kept honest)
            function_links.append({**base, "status": "unknown", "drawn": False, "conflict": False, "verification": "none", "n_verified": 0, "n_unverified": 0, "verification_note": "no design edge in kg.json", "evidence_kind": "none", "rule": None, "rules": [], "verdict": "no rule check recorded", "missing": [], "requirements": [], "xyz_edge": None, "underlying": []})
for l in function_links:
    for r in l.get("requirements", []):
        for x in r.get("evidence", []) + r.get("contrary", []):
            if x.get("claim"): claim_record(x["claim"])
LINK = {(l["species"], l["function"]): l for l in function_links}

# ---------------------------------------------------------------- concept links (why a plant meets a requirement): the xyz plant → concept lines
concept_links = []
for e in X["edges"]:
    if e["rel"] in ("grows_in", "has_trait"):
        concept_links.append({"id": e["id"], "species": e["source"], "concept": e["target"], "concept_label": XN[e["target"]]["label"], "facet": e["facet"], "facet_label": XN[e["target"]].get("facet_label"), "group": XN[e["target"]].get("group"), "rel": e["rel"], "status": e["status"], "verification": e["verification"]["label"], "n_verified": e["verification"].get("verified", 0), "n_unverified": e["verification"].get("unverified", 0),
                              "claims": e["basis"]["claims"], "sources": e["basis"]["sources"], "rule": e["basis"].get("rule"), "entity": e["basis"].get("entity", False), "conditions": sorted({x["label"] for x in e.get("conditions", []) if x.get("label")}), "cultivars": e.get("cultivars", []), "underlying": e["underlying"]})
concepts = {}
for e in concept_links:
    c = XN[e["concept"]]
    concepts.setdefault(e["concept"], {"id": c["id"], "label": c["label"], "facet": c["facet"], "facet_label": c.get("facet_label"), "group": c.get("group"), "definition": c.get("definition"), "n_species": c.get("n_plants", 0), "species": c.get("plants", []),
                                      "required_by": sorted({fn["id"] for fn in functions for r in fn["requirements"] if c["id"] in r["alternatives"]})})
for fn in functions:   # alternatives no plant reaches, so the inspector can name them
    for r in fn["requirements"]:
        for a in r["alternatives"]:
            if a not in concepts and a in KN:
                concepts[a] = {"id": a, "label": KN[a]["label"], "facet": KN[a]["facet"], "facet_label": facet_label(KN[a]["facet"]), "group": None, "definition": KN[a].get("definition"), "n_species": 0, "species": [], "required_by": [fn["id"]], "no_plant_reaches": True}

# ---------------------------------------------------------------- relations: every relations.json record, retired included as history
relations = []
for r in REL["relations"]:
    a, b = f"plant:{r['plant_a']}", f"plant:{r['plant_b']}"
    kge = KE.get(f"rel:{r['id']}")
    rec = {"id": r["id"], "a": a, "b": b, "type": r["relation_type"], "direction": r.get("direction"), "status": r["status"], "kg_status": (kge or {}).get("kg_status") or ("documented" if r.get("source_type") != "model" else "candidate"),
           "live": r["status"] != "retired", "placeholder": r.get("source_type") == "model", "source_id": r.get("source_id"), "source_type": r.get("source_type"), "text": r.get("text"), "context": r.get("context"), "confidence": r.get("confidence"),
           "recorded_at": r.get("recorded_at"), "recorded_by": r.get("recorded_by"), "rule": r.get("rule"), "note": r.get("note"), "derived_from": r.get("derived_from", []), "supporting_claims": r.get("supporting_claims", []), "verify_against": r.get("verify_against", []),
           "verification_scope": r.get("verification_scope"), "retired_at": r.get("retired_at"), "retired_by": r.get("retired_by"), "retired_reason": r.get("retired_reason"), "citation": r.get("citation"), "kg_edge": (kge or {}).get("id"), "xyz_edge": None}
    if a not in SP or b not in SP:
        rec["outside_db"] = True
    rec["missing_claims"] = [c for c in rec["derived_from"] + rec["supporting_claims"] if claim_record(c) is None]   # a dangling reference in relations.json: reported, never invented
    relations.append(rec)
for e in X["edges"]:
    if e["type"] == "plant_relation":
        for rr in e["records"]:
            for rec in relations:
                if f"rel:{rec['id']}" == rr["id"]: rec["xyz_edge"] = e["id"]
RELS_BY_PAIR = defaultdict(list)
for rec in relations:
    RELS_BY_PAIR[tuple(sorted((rec["a"], rec["b"])))].append(rec["id"])

# ---------------------------------------------------------------- pairs: shared concepts (kg), direct records, complementarity hypotheses
LAYER_OF = {"z:ceiling_canopy": "overhead", "z:screen": "above eye", "z:scrim": "above eye", "z:barrier": "knee and above", "z:ground_cover": "ground"}
pairs = []
kg_pairs = {tuple(sorted(p["plants"])): p for p in KG["plant_pairs"]}
for i, a in enumerate(SPECIES_IDS):
    for b in SPECIES_IDS[i + 1:]:
        kp = kg_pairs.get((a, b), {"shared": [], "shared_by_area": {}, "n_shared": 0, "direct_relations": [], "text": ""})
        shared = [c for c in kp["shared"] if c in concepts]           # only concepts the explorer shows (node facets); the rest are attribute facets
        shared_attr = [c for c in kp["shared"] if c not in concepts and c in KN and KN[c]["facet"] in FACET]   # shared attribute-facet concepts (zones, classes…)
        shared_other = [c for c in kp["shared"] if c not in concepts and c not in shared_attr]              # design concepts outside Z etc.
        # attribute overlap / difference per facet, from the cells (what the Attribute Table shows)
        by_facet = []
        for f in facets:
            ca, cb = ATTR.get((a, f["id"])), ATTR.get((b, f["id"]))
            if not ca and not cb: continue
            va = {v["concept"] for v in ca["values"]} if ca else set(); vb = {v["concept"] for v in cb["values"]} if cb else set()
            by_facet.append({"facet": f["id"], "label": f["label"], "group": f["group"], "shared": sorted(va & vb), "only_a": sorted(va - vb), "only_b": sorted(vb - va), "a_recorded": bool(ca), "b_recorded": bool(cb),
                             "labels": {c: KN.get(c, {}).get("label", c) for c in (va | vb)}, "a_disagreement": bool(ca and ca["disagreement"]), "b_disagreement": bool(cb and cb["disagreement"])})
        rids = RELS_BY_PAIR.get((a, b), [])
        live_r = [r for r in rids if next(x for x in relations if x["id"] == r)["live"]]
        retired_r = [r for r in rids if r not in live_r]
        la = [l for l in function_links if l["species"] == a and l["drawn"]]; lb = [l for l in function_links if l["species"] == b and l["drawn"]]
        combos = []
        for x in la:
            for y in lb:
                if x["function"] == y["function"]: continue
                combos.append({"a_function": x["function"], "b_function": y["function"], "a_status": x["status"], "b_status": y["status"], "a_conflict": x["conflict"], "b_conflict": y["conflict"], "a_verification": x["verification"], "b_verification": y["verification"],
                               "layers": [LAYER_OF[x["function"]], LAYER_OF[y["function"]]], "different_layer": LAYER_OF[x["function"]] != LAYER_OF[y["function"]], "a_link": x["id"], "b_link": y["id"]})
        same = sorted({x["function"] for x in la} & {y["function"] for y in lb})
        unknown_a = [l["function"] for l in function_links if l["species"] == a and not l["drawn"]]; unknown_b = [l["function"] for l in function_links if l["species"] == b and not l["drawn"]]
        pairs.append({"id": f"pair:{plants_slug[a]}:{plants_slug[b]}", "a": a, "b": b, "shared_concepts": shared, "shared_attribute_concepts": shared_attr, "shared_other_concepts": shared_other, "shared_by_area": kp.get("shared_by_area", {}), "n_shared": kp.get("n_shared", 0),
                      "attributes": by_facet, "direct_relations": live_r, "retired_relations": retired_r, "kg_direct": [d["id"] for d in kp.get("direct_relations", [])],
                      "complementarity": {"combinations": combos, "same_function": same, "a_functions": [l["function"] for l in la], "b_functions": [l["function"] for l in lb], "a_unknown": unknown_a, "b_unknown": unknown_b,
                                          "note": "distinct spatial functions the two plants' live links allow — a layering / arrangement hypothesis to test on site; it says nothing about biological compatibility"},
                      "kg_text": kp.get("text", "")})

# ---------------------------------------------------------------- evidence checks (AI assessments; review/ai) — an assessment layer, never verification
evidence_checks = {}
for f in sorted(glob.glob(os.path.join(ROOT, "review/ai/assessments/*.jsonl"))):
    with open(f, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line: continue
            r = json.loads(line)
            evidence_checks[r["claim_id"]] = {"result": r.get("result"), "locator": r.get("locator"), "excerpt": r.get("evidence_excerpt"), "explanation": r.get("explanation"), "missing_context": r.get("missing_context"), "conflicting_claims": r.get("conflicting_claims", []),
                                              "conflict_reading": r.get("conflict_reading"), "risk": r.get("risk"), "method": "agent-read" if str(r.get("method", "")).startswith("agent-read") else r.get("method"), "reviewed_at": r.get("reviewed_at"), "review_id": r.get("review_id"), "fingerprint": r.get("fingerprint")}
for cid, c in CLAIMS.items():
    c["evidence_check"] = evidence_checks.get(cid, {}).get("result") or ("not_assessed")

# ---------------------------------------------------------------- sources and rules
sources_used = set()
for c in CLAIMS.values(): sources_used.add(c["source_id"])
for r in relations:
    if r.get("source_id"): sources_used.add(r["source_id"])
sources = {sid: src_record(sid) for sid in sorted(sources_used)}
rules = dict(X["rules"])
rules["M49"] = "the Explorer projection: species, attribute cells, five functions with requirements, exactly species × functions link cells, every relation record (retired = history), 45 pairs with shared concepts, direct records and complementarity hypotheses; status, verification and AI evidence check are three separate fields on every record; nothing is promoted, nothing unknown is drawn"

# ---------------------------------------------------------------- stats
stats = {
    "species": len(species), "facets": len(facets), "attribute_cells": len(attributes), "cells_not_recorded": len(species) * len(facets) - len(attributes), "cells_with_disagreement": sum(1 for a in attributes if a["disagreement"]),
    "functions": len(functions), "function_links": len(function_links), "links_by_status": dict(Counter(l["status"] for l in function_links)), "links_drawn": sum(1 for l in function_links if l["drawn"]), "links_conflict": sum(1 for l in function_links if l["conflict"]),
    "links_by_verification": dict(Counter(l["verification"] for l in function_links)), "unknown_by_verdict": dict(Counter(l.get("verdict") for l in function_links if not l["drawn"])),
    "relations": len(relations), "relations_live": sum(1 for r in relations if r["live"]), "relations_with_missing_claims": [r["id"] for r in relations if r["missing_claims"]], "relations_retired": sum(1 for r in relations if not r["live"]), "relations_by_type": dict(Counter(r["type"] for r in relations if r["live"])), "relations_placeholder_live": sum(1 for r in relations if r["live"] and r["placeholder"]),
    "pairs": len(pairs), "pairs_with_direct": sum(1 for p in pairs if p["direct_relations"]), "pairs_with_complementarity": sum(1 for p in pairs if p["complementarity"]["combinations"]),
    "concept_links": len(concept_links), "concepts": len(concepts), "claims": len(CLAIMS), "claims_by_status": dict(Counter(c["status"] for c in CLAIMS.values())), "evidence_checks": len(evidence_checks), "claims_by_check": dict(Counter(c["evidence_check"] for c in CLAIMS.values())), "sources": len(sources),
    "inputs": {"kg_generated": KG.get("generated"), "xyz_generated": X.get("generated"), "relations_updated": REL.get("updated"), "schema_version": X.get("schema_version"), "ontology_version": X.get("ontology_version")},
}

out = {"generated": TODAY, "generated_by": "tools/build_explorer.py", "method": "M49", "inputs": ["brain/data/kg.json", "brain/data/xyz.json", "relations.json", "sources.json", "review/ai/assessments/*.jsonl"], "schema_version": X.get("schema_version"), "ontology_version": X.get("ontology_version"),
       "vocab": VOCAB, "groups": sorted(groups.values(), key=lambda g: g["order"]), "species": species, "facets": facets, "attributes": attributes, "functions": functions, "function_links": function_links, "concepts": sorted(concepts.values(), key=lambda c: (c.get("group") or "zz", c["facet"], c["label"])), "concept_links": concept_links,
       "relations": relations, "pairs": pairs, "claims": CLAIMS, "evidence_checks": evidence_checks, "sources": sources, "rules": rules, "stats": stats}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=None, separators=(",", ":"))
print(f"explorer.json: {stats['species']} species · {stats['facets']} facets · {stats['attribute_cells']} attribute cells ({stats['cells_not_recorded']} not recorded) · {stats['functions']} functions · {stats['function_links']} link cells ({stats['links_by_status']}, {stats['links_drawn']} drawn, {stats['links_conflict']} conflict) · {stats['relations']} relations ({stats['relations_live']} live) · {stats['pairs']} pairs · {stats['claims']} claims · {stats['evidence_checks']} evidence checks → {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT) // 1024} KB)")
