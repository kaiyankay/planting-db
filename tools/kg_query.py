#!/usr/bin/env python3
"""
Graph-based retrieval prototype over brain/data/kg.json (brief 2026-11-02 §04, methods M33).

  User query → entity / concept recognition → graph traversal → relevant claims & evidence → LLM context block

  python3 -I tools/kg_query.py --ask "evergreen screen for a shady North Vancouver garden"
  python3 -I tools/kg_query.py --path A growth_form:shrub          # Classification: growth form → plants → traits → evidence
  python3 -I tools/kg_query.py --path B spatial:screen             # Design: concept → required traits → plants → conditions
  python3 -I tools/kg_query.py --path C gaultheria-shallon height_class   # Variation: plant → facet → claims → conditions → sources
  python3 -I tools/kg_query.py --path D spatial:scrim              # Gaps: concept → required knowledge → evidence → missing
  python3 -I tools/kg_query.py --all                               # the four prototype paths -> eval/kg-paths-<date>.md

Every answer is built from kg.json edges only: no keyword similarity, no hard-coded results. Claims are ordered by R5
(source type → geo → completeness → confidence); L0 practitioner claims are withheld (R2); candidate and unknown links are
labelled as such and never presented as fact. brain/ontology-preview/js/kg.js is the same engine in the browser.
Standard library only. Reads only.
"""
import json, os, re, sys
from collections import defaultdict
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
KG, SYN, SCHEMA, SRCF = J("brain/data/kg.json"), J("synonyms.json"), J("schema.json"), J("sources.json")
SOURCES = {s["id"]: s for s in SRCF["sources"]}
N = {n["id"]: n for n in KG["nodes"]}
E = KG["edges"]; CLAIMS = KG["claims"]
OUT = defaultdict(list); IN = defaultdict(list)
for e in E: OUT[e["source"]].append(e); IN[e["target"]].append(e) if e.get("target") else None
SRC_PRIORITY = {s: i for i, s in enumerate(SCHEMA["claim"]["fields"]["source_type"]["priority_order"])}
GEO = {"vancouver": 0, "bc": 1, "pnw": 2, "north_america": 3, "global": 4}
label = lambda i: N[i]["label"] if i in N else i
SHORT = {"rhs": "RHS", "mobot": "Missouri BG", "gpp": "Great Plant Picks", "osu": "Oregon State", "eflora": "E-Flora BC", "usda_plants": "USDA PLANTS", "cov_trees": "City of Vancouver trees", "inat": "iNaturalist", "iscbc": "ISC BC", "model": "model placeholder", "entity": "entity record"}
src = lambda s: SHORT.get(s) or (f"survey respondent {s.split('-r')[-1]}" if str(s).startswith("survey-") else (SOURCES.get(s, {}).get("name") or s).split(" — ")[0].split(" (")[0])
PLACE_VAN = {"place:vancouver", "place:city_of_vancouver", "place:north_vancouver"}


# ---------------------------------------------------------------- recognition
ALIAS = defaultdict(list)
for n in KG["nodes"]:
    if n["type"] in ("concept", "facet", "category", "axis"):
        for a in [n["label"], *n.get("aliases", [])]:
            if a and len(a) >= 3: ALIAS[a.lower()].append(n["id"])
PLANT_NAMES = {e["id"]: [e["scientific"], *e.get("names", []), *e.get("synonyms_scientific", [])] for e in SYN["entries"] if e.get("in_db")}


def recognise(text):
    """plants by synonym, concepts by label / alias (specific beats group), facets by name"""
    t = f" {text.lower()} "; plants, concepts = {}, {}
    for pid, names in PLANT_NAMES.items():
        for nm in names:
            if nm.lower() in t: plants[f"plant:{pid}"] = nm; break
    for a, ids in ALIAS.items():
        if re.search(r"(?<![a-z一-鿿])" + re.escape(a) + r"(?![a-z一-鿿])", t):
            for i in ids: concepts[i] = a
    for i in list(concepts):
        p = N[i].get("parent")
        if p in concepts and N[i]["type"] == "concept": concepts.pop(p, None)
    return {"plants": plants, "concepts": concepts}


# ---------------------------------------------------------------- ranking (R5) and attribution (R6)
def rank_key(c):
    s = SOURCES.get(c.get("source_id"), {}); meta = c.get("practitioner_meta") or {}
    comp = 1.5 if c.get("source_type") != "practitioner" else {"L3": 0, "L2": 1, "L1": 2, "L0": 3}.get(meta.get("completeness"), 3)
    return (SRC_PRIORITY.get(c.get("source_type"), 9), GEO.get(s.get("geo_specificity"), 9), comp, -(c.get("confidence") or 0))

def attribute(c):
    s = SOURCES.get(c.get("source_id"), {})
    if c.get("source_type") == "practitioner":
        meta = c.get("practitioner_meta") or {}; basis = {"project": "in their own project", "observed": "from site observation", "read": "from reading", "mixed": "from mixed experience"}.get(meta.get("basis"), "")
        return f"A {s.get('observer_background', 'survey respondent')} noted {basis}: “{c['text']}”"
    return f"{src(c['source_id'])}{'' if c.get('status') == 'verified' else ' [' + str(c.get('status')) + ']'}: {c['text']}"

def conds(c): return ", ".join(label(x["concept_id"]).lower() for x in (c.get("conditions") or [])) or "no condition stated"
def citable(c): return not (c.get("source_type") == "practitioner" and (c.get("practitioner_meta") or {}).get("citable") is False)
def live_claim(cid): c = CLAIMS.get(cid); return c and c.get("status") != "retired" and c.get("source_type") != "model"


# ---------------------------------------------------------------- traversal primitives
def edges_from(node, rels=None, types=None): return [e for e in OUT.get(node, []) if (rels is None or e.get("rel") in rels) and (types is None or e["type"] in types)]
def edges_to(node, rels=None, types=None): return [e for e in IN.get(node, []) if (rels is None or e.get("rel") in rels) and (types is None or e["type"] in types)]
def descendants(cid):
    out = [cid]
    for i in range(len(out)):
        for e in IN.get(out[i], []):
            if e["type"] == "parent" and e["source"] not in out: out.append(e["source"])
    return out
def plant_claim_edges(pid, facet=None, concepts=None):
    fam = set(concepts or []) and {d for c in concepts for d in descendants(c)}
    return [e for e in OUT.get(pid, []) if e["type"] in ("claim", "entity") and e.get("live") and e.get("target") and (facet is None or e.get("facet") == facet) and (not fam or e["target"] in fam)]
def claims_of(edges):
    seen, out = set(), []
    for e in edges:
        cid = e.get("claim_id")
        if cid and cid not in seen and live_claim(cid): seen.add(cid); out.append(CLAIMS[cid])
    return sorted(out, key=rank_key)
def hierarchy_path(cid):
    out = [cid]
    while N.get(out[-1], {}).get("hierarchy_parent"): out.append(N[out[-1]]["hierarchy_parent"])
    return out


def walk(seeds, steps):
    """generic traversal: steps = [(name, fn)] where fn(frontier_nodes) -> list of edges; returns the waves with nodes + edges"""
    waves = [{"step": "seed", "nodes": list(seeds), "edges": []}]; frontier = list(seeds)
    for name, fn in steps:
        es = fn(frontier); nodes = []
        for e in es:
            for v in (e["source"], e.get("target")):
                if v and v not in frontier and v not in nodes: nodes.append(v)
        waves.append({"step": name, "nodes": nodes, "edges": es}); frontier = nodes
    return waves


# ---------------------------------------------------------------- the four prototype paths (all from kg.json)
def path_A(gf="growth_form:shrub"):
    """Classification: Growth Form → Shrub → Plant → Attributes → Evidence"""
    cls = edges_to(gf, types=["classification"]); plants = [e["source"] for e in cls]
    attrs = {p: defaultdict(list) for p in plants}
    for p in plants:
        for e in plant_claim_edges(p): attrs[p][N[e["target"]].get("category") or "cross:place"].append(e)
    return {"path": "A", "title": f"Classification: {label(gf)}", "hierarchy": hierarchy_path(gf)[::-1], "classification": [{"plant": e["source"], "label": label(e["source"]), "status": e.get("verification"), "evidence": e.get("basis", {}).get("evidence"), "weak": e.get("basis", {}).get("weak"), "text": e.get("text")} for e in cls],
            "attributes": {p: {cat: {"n_edges": len(es), "concepts": sorted({e["target"] for e in es}, key=label), "claims": [c["id"] for c in claims_of(es)]} for cat, es in a.items()} for p, a in attrs.items()},
            "evidence": {p: [{"id": c["id"], "field": c["field"], "attribution": attribute(c), "status": c.get("status"), "conditions": conds(c), "place": label(c.get("place")) if c.get("place") else None, "source": c["source_id"], "withheld": not citable(c)} for c in claims_of([e for es in a.values() for e in es])[:40]] for p, a in attrs.items()}}


def path_B(z="spatial:screen"):
    """Design: Planting Structure / Screening → Required Traits → Relevant Plants → Conditions"""
    reqs = edges_from(z, rels=["requires_trait"]); design = edges_to(z, types=["design"]); uses = [e["source"] for e in edges_to(z, rels=["maps_to"])]
    plants = []
    for d in sorted(design, key=lambda d: {"derived": 0, "candidate": 1, "unknown": 2}[d["kg_status"]]):
        ev = []
        for r in d.get("requirements", []):
            for x in r["evidence"]:
                c = CLAIMS.get(x.get("claim")) if x.get("claim") else None
                ev.append({"requirement": " or ".join(label(a) for a in r["alternatives"]), "result": r["result"], "strength": r["strength"], "concept": label(x["target"]), "claim": x.get("claim"), "attribution": attribute(c) if c else f"{label(x['target'])} (entity / classification: {x.get('verification')})", "conditions": conds(c) if c else "none", "cultivar": x.get("cultivar"), "source": x.get("source_id"), "verification": x.get("verification")})
        use_claims = [CLAIMS[c] for c in d.get("use_claims", []) if c in CLAIMS]
        plants.append({"plant": d["plant"], "label": label(d["plant"]), "kg_status": d["kg_status"], "verdict": d["verdict"], "text": d["text"], "via_uses": [label(u) for u in d.get("via_uses", [])], "use_evidence": [{"claim": c["id"], "attribution": attribute(c), "status": c.get("status"), "conditions": conds(c), "withheld": not citable(c)} for c in use_claims], "requirements": [{"requirement": " or ".join(label(a) for a in r["alternatives"]), "strength": r["strength"], "result": r["result"], "to_confirm": r["to_confirm"], "source": r["source"]} for r in d.get("requirements", [])], "trait_evidence": ev, "missing": [" or ".join(label(a) for a in m["alternatives"]) + f" ({m['strength']}, {m['result']})" for m in d.get("missing", [])]})
    return {"path": "B", "title": f"Design knowledge: {label(z)}", "hierarchy": hierarchy_path(z)[::-1], "definition": N[z]["definition"], "source_of_term": N[z].get("source_of_term"), "to_confirm": N[z].get("to_confirm", False),
            "required_traits": [{"concepts": [label(a) for a in (r.get("alternatives") or [r["target"]])], "strength": r.get("strength"), "source": r["basis"]["source"], "to_confirm": r.get("to_confirm"), "note": r.get("note")} for r in reqs], "kpu_uses_that_name_it": [label(u) for u in uses], "plants": plants}


def path_C(pid="plant:gaultheria-shallon", facet="height_class"):
    """Variation: plant → facet → growing conditions → different claims → sources"""
    if not pid.startswith("plant:"): pid = f"plant:{pid}"
    es = plant_claim_edges(pid, facet=facet); cs = claims_of(es)
    groups = defaultdict(list)
    for c in cs: groups[(c.get("cultivar") or "species", conds(c))].append(c)
    diag = [d for d in KG["conflicts"]["disagreement"] if d["plant"] == pid and d["facet"] == facet]; var = [v for v in KG["conflicts"]["variation"] if v["plant"] == pid and v["facet"] == facet]
    return {"path": "C", "title": f"Knowledge variation: {label(pid)} · {facet.replace('_', ' ')}", "n_claims": len(cs), "n_sources": len({c["source_id"] for c in cs}),
            "groups": [{"cultivar": k[0], "conditions": k[1], "claims": [{"id": c["id"], "value": c.get("value_label") or c.get("value"), "attribution": attribute(c), "status": c.get("status"), "place": label(c.get("place")) if c.get("place") else None, "local": c.get("place") in PLACE_VAN, "source": c["source_id"], "concepts": [label(x) for x in c.get("concepts", []) if N.get(x, {}).get("facet") == facet]} for c in v]} for k, v in groups.items()],
            "variation": var, "disagreement": diag, "reading": ("values differ with stated conditions: " + "; ".join(v["text"] for v in var)) if var else ("sources disagree under the same (unstated) conditions" if diag else "no variation or disagreement detected")}


def path_D(z="spatial:scrim"):
    """Gaps: Design Concept → Required Knowledge → Existing Evidence → Missing Relationships"""
    b = path_B(z); gaps = KG["gaps"]
    missing = []
    for p in b["plants"]:
        for r in p["requirements"]:
            if r["result"] != "met": missing.append({"plant": p["label"], "requirement": r["requirement"], "strength": r["strength"], "result": r["result"], "why": "no sourced claim on this facet" if r["result"] == "unknown" else "sourced claims exist on the facet but none matches"})
    no_plant = [g for g in gaps["design_concepts_without_plants"] if g["concept"] == z]
    to_confirm = [e["id"] for e in edges_from(z, rels=["requires_trait"]) if e.get("to_confirm")]
    return {"path": "D", "title": f"Knowledge gaps: {label(z)}", "definition": N[z]["definition"], "term_to_confirm": N[z].get("to_confirm", False), "required_knowledge": b["required_traits"], "kpu_uses_that_name_it": b["kpu_uses_that_name_it"], "existing_evidence": [{"plant": p["label"], "kg_status": p["kg_status"], "verdict": p["verdict"], "met": [r["requirement"] for r in p["requirements"] if r["result"] == "met"], "via_uses": p["via_uses"]} for p in b["plants"]],
            "missing_relationships": missing, "no_plant_linked": bool(no_plant), "relations_to_confirm": to_confirm, "reading": ("No source links any plant to this concept; every link shown is a rule-based candidate or unknown. " if no_plant else "") + f"{len(missing)} requirement(s) lack evidence or are contradicted; {len(to_confirm)} literature relation(s) await page-level confirmation."}


# ---------------------------------------------------------------- free-text ask: recognise → traverse → claims → context block
def ask(text, k=12):
    rec = recognise(text); plants = list(rec["plants"]); concepts = list(rec["concepts"]); steps = []
    design = [c for c in concepts if N[c].get("dimension") == "design"]; gfs = [c for c in concepts if N[c].get("facet") == "growth_form"]
    traits = [c for c in concepts if N[c]["type"] == "concept" and N[c].get("dimension") not in ("design", "architecture")]
    plant_hits = defaultdict(list); unknown = []; design_blocks = []
    for z in design:   # design concept → plants by design edges (status carried)
        b = path_B(z); design_blocks.append(b); steps.append(f"{label(z)} → requires {len(b['required_traits'])} traits → {len(b['plants'])} plant links (derived / candidate / unknown)")
        for p in b["plants"]:
            if p["kg_status"] in ("derived", "candidate"): plant_hits[p["plant"]].append(("design", z, p["kg_status"], p["verdict"]))
            else: unknown.append(f"{p['label']} ↔ {label(z)}: {p['verdict']}")
    for g in gfs:
        for e in edges_to(g, types=["classification"]): plant_hits[e["source"]].append(("growth_form", g, "derived", e.get("verification"))); steps.append(f"{label(g)} → {label(e['source'])} ({e.get('verification')})")
    for c in traits:   # trait concept → plants whose claims reach it (or its children); a place → plants with claims recorded there
        fam = set(descendants(c)); hit = False; is_place = N[c].get("facet") == "place"
        for e in E:
            if e["type"] in ("claim", "entity") and e.get("live") and (e.get("place") if is_place else e.get("target")) in fam:
                h = ("place" if is_place else "trait", c, "documented", e.get("verification"))
                if h not in plant_hits[e["source"]]: plant_hits[e["source"]].append(h)
                hit = True
        steps.append(f"{label(c)} → {('plants with claims recorded there' if is_place else 'plants with claims') if hit else 'no plant linked (dormant concept)'}")
    for p in plants: plant_hits.setdefault(p, []).append(("named", p, "documented", "entity"))
    # gather claims: for each hit plant, the claims on the asked concepts (or all, if only the plant was named)
    answer = []
    for pid, hits in plant_hits.items():
        want = [h[1] for h in hits if h[0] == "trait"]
        es = plant_claim_edges(pid, concepts=want) if want else plant_claim_edges(pid)
        cs = claims_of(es); cited = [c for c in cs if citable(c)]; withheld = [c for c in cs if not citable(c)]
        answer.append({"plant": pid, "label": label(pid), "why": hits, "claims": cited[:k], "withheld": len(withheld), "n_claims": len(cs)})
    answer.sort(key=lambda a: (-sum(1 for h in a["why"] if h[2] in ("documented", "derived")), -len(a["claims"])))
    return {"query": text, "recognised": rec, "steps": steps, "answer": answer, "design": design_blocks, "unknown": unknown}


def context_block(r):
    """the text an LLM would receive: attributed claims with status, conditions and place; unknowns stated"""
    o = [f"Query: {r['query']}", f"Recognised: plants {list(r['recognised']['plants'].values()) or '—'} · concepts {[label(c) for c in r['recognised']['concepts']] or '—'}", "Graph steps: " + ("; ".join(r["steps"]) or "none"), ""]
    for a in r["answer"]:
        o.append(f"## {a['label']}  (why: {', '.join(f'{h[0]} {label(h[1])} [{h[2]}/{h[3]}]' for h in a['why'])})")
        for c in a["claims"]: o.append(f"- {attribute(c)}  — {c['field'].replace('_', ' ')}; status {c.get('status')}; conditions: {conds(c)}; place: {label(c['place']) if c.get('place') else '—'}; id {c['id']}")
        if a["withheld"]: o.append(f"- ({a['withheld']} L0 practitioner note(s) withheld, R2)")
        o.append("")
    for b in r["design"]:
        o.append(f"## Design concept: {b['title'].split(': ')[1]} — {b['definition']}  [{b['source_of_term']}]")
        for t in b["required_traits"]: o.append(f"- {t['strength']}: {' or '.join(t['concepts'])}  ({t['source']}){' — to confirm' if t.get('to_confirm') else ''}")
        for p in b["plants"]: o.append(f"- {p['label']}: {p['kg_status'].upper()} — {p['text']}")
        o.append("")
    if r["unknown"]: o.append("Unknown / not asserted by any source:"); o.extend(f"- {u}" for u in r["unknown"])
    return "\n".join(o)


def md_path(res):
    o = [f"## Path {res['path']} — {res['title']}", ""]
    if res["path"] == "A":
        o.append("Hierarchy: " + " → ".join(label(x) for x in res["hierarchy"]))
        for c in res["classification"]: o.append(f"- **{c['label']}** — {c['status']}: {c['text']}" + (f" (weak: {', '.join(c['weak'])})" if c.get("weak") else ""))
        for p, cats in res["attributes"].items():
            o.append(f"\n*{label(p)}* — attributes by category:")
            for cat, a in cats.items(): o.append(f"- {label(cat)}: {len(a['concepts'])} concepts, {len(a['claims'])} claims — {', '.join(label(x) for x in a['concepts'][:8])}{'…' if len(a['concepts']) > 8 else ''}")
            o.append(f"  evidence (R5 order, first 6): " + " | ".join(f"{e['attribution'][:90]}… [{e['status']}; {e['conditions']}]" for e in res["evidence"][p][:6]))
    elif res["path"] == "B":
        o.append(f"{res['definition']}  \nSource of term: {res['source_of_term']}{' — **term to confirm**' if res['to_confirm'] else ''}  \nHierarchy: " + " → ".join(label(x) for x in res["hierarchy"]))
        o.append("\nRequired traits:"); o.extend(f"- {t['strength']}: {' or '.join(t['concepts'])} — {t['source']}{' (to confirm)' if t.get('to_confirm') else ''}" for t in res["required_traits"])
        o.append(f"\nKPU uses that name it: {', '.join(res['kpu_uses_that_name_it']) or 'none'}")
        for p in res["plants"]:
            o.append(f"\n### {p['label']} — **{p['kg_status']}** · {p['verdict']}\n{p['text']}")
            for u in p["use_evidence"]: o.append(f"- use evidence: {u['attribution']} [{u['status']}; {u['conditions']}]{' (L0, withheld from answers)' if u['withheld'] else ''}")
            for r in p["requirements"]: o.append(f"- {r['strength']} {r['requirement']}: **{r['result']}**")
            for e in p["trait_evidence"]: o.append(f"  - {e['concept']} ← {e['attribution'][:110]} [{e['verification']}; conditions: {e['conditions']}{'; ' + e['cultivar'] if e.get('cultivar') else ''}]")
    elif res["path"] == "C":
        o.append(f"{res['n_claims']} live claims from {res['n_sources']} sources. Reading: {res['reading']}")
        for g in res["groups"]:
            o.append(f"\n**{g['cultivar']} · {g['conditions']}**")
            for c in g["claims"]: o.append(f"- {c['attribution']} — classes {', '.join(c['concepts'])}; place {c['place']}{' ✓ local' if c['local'] else ''}; `{c['id']}`")
        for v in res["variation"]: o.append(f"\n↔ {v['text']}")
        for d in res["disagreement"]: o.append(f"\n≠ {d['text']}")
    elif res["path"] == "D":
        o.append(f"{res['definition']}{'  — **term to confirm**' if res['term_to_confirm'] else ''}\n\nRequired knowledge:"); o.extend(f"- {t['strength']}: {' or '.join(t['concepts'])} — {t['source']}" for t in res["required_knowledge"])
        o.append("\nExisting evidence:"); o.extend(f"- {e['plant']}: {e['kg_status']} · {e['verdict']}; met: {', '.join(e['met']) or 'none'}; via uses: {', '.join(e['via_uses']) or 'none'}" for e in res["existing_evidence"])
        o.append("\nMissing relationships:"); o.extend(f"- {m['plant']} needs {m['requirement']} ({m['strength']}): {m['result']} — {m['why']}" for m in res["missing_relationships"])
        o.append(f"\nRelations to confirm: {', '.join(res['relations_to_confirm']) or 'none'}  \n{res['reading']}")
    return "\n".join(o) + "\n"


if __name__ == "__main__":
    a = sys.argv[1:]
    if "--all" in a:
        out = [f"# Graph retrieval prototype — the four exploration paths · {date.today().isoformat()}", "", "Generated by `python3 -I tools/kg_query.py --all` from brain/data/kg.json. Nothing here is hand-written: every line is a traversal result. Status words: documented (a source says it) · derived (a named rule from documented statements) · candidate (inferred, never promoted) · unknown (no evidence).", ""]
        for res in (path_A("growth_form:shrub"), path_B("spatial:screen"), path_C("plant:gaultheria-shallon", "height_class"), path_D("spatial:scrim"), path_D("spatial:screen")): out.append(md_path(res))
        q = "evergreen shade-tolerant screen for a north-facing Vancouver garden"; out.append(f"## Ask — `{q}`\n\n```\n{context_block(ask(q))}\n```\n")
        p = os.path.join(ROOT, "eval", f"kg-paths-{date.today().isoformat()}.md"); open(p, "w", encoding="utf-8").write("\n".join(out)); print("->", p)
    elif "--path" in a:
        i = a.index("--path"); which = a[i + 1].upper(); args = a[i + 2:]
        res = {"A": path_A, "B": path_B, "C": path_C, "D": path_D}[which](*args); print(md_path(res)) if "--json" not in a else print(json.dumps(res, ensure_ascii=False, indent=1))
    elif "--ask" in a:
        r = ask(a[a.index("--ask") + 1]); print(json.dumps(r, ensure_ascii=False, indent=1, default=str) if "--json" in a else context_block(r))
    else: print(__doc__)
