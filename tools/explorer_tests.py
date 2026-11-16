#!/usr/bin/env python3
"""
Tests on the Explorer projection (brain/data/explorer.json from tools/build_explorer.py) against its inputs (kg.json, xyz.json,
relations.json, plants/*.json) and on the interface files (brain/explorer/).

  python3 -I tools/explorer_tests.py            -> eval/explorer-tests-<date>.md, exit 1 on any failure
  python3 -I tools/explorer_tests.py --browser  -> also drives the page in headless Chrome (if found) through the two acceptance paths

  A  counts         ten species with their stable ids = plants/*.json; the five functions of the brief; exactly species × functions link
                    cells; every attribute cell names a species and a facet of the projection; no duplicate ids
  B  integrity      every id a record references (species, function, facet, concept, claim, relation, link, edge) exists
  C  evidence trace every drawn link resolves to a use claim (derived) or to a KG-R4 requirement check with met evidence (candidate);
                    every attribute value names its claims or an entity record; every claim cited is live (not retired) unless the
                    record is itself history; sources of every claim are in the source index
  D  status apart   status, verification and AI evidence check are separate fields; verified only when a cited claim is verified;
                    candidate links never verified; no link status stronger than the strongest live kg design edge (nothing promoted);
                    unknown links are never drawn and carry a verdict and a requirement check
  E  matrix         50 cells = the 21 xyz suited_for lines + the 29 xyz gaps, same status and conflict flag per cell
  F  relations      every relations.json record is in the projection once with its status; retired records are not live, never drawn,
                    keep their retired_reason; live records = xyz plant_relation records; placeholders flagged
  G  pairs          45 unordered pairs; direct relation ids = live records of the pair; shared concepts ⊆ kg plant_pairs shared;
                    complementarity combinations only from drawn links of each plant, never a same-function pair, labelled hypothesis;
                    no pair field asserts compatibility
  H  table          attribute cells = the xyz plant → concept lines (node facets) + the plant attributes (attribute facets); every
                    distinct value kept (count of values per cell = distinct concepts); disagreement flags = kg conflicts of that cell
  I  interface      the interface files name no plant, concept or function id from the database
  J  stats          the statistics block matches the file
  K  browser        (--browser) headless Chrome. V4: Knowledge opens on the table (no start screen) with the Table | Matrix | Network
                    switch; the Network without a focus is the X · Y · Z overview (every species, function and required trait, only
                    recorded lines); Screen focus → the function and its linked species only, the layers add required traits and
                    the species without a link; the same focus in the matrix (column) and the table (required columns, sort); cell
                    → evidence claims and the trace link; a species focus grows by knowledge group and by relation records; A/B
                    pair → four sections, direct records (or the honest absence); V1 links (tab=compare, fk=pair, ik/ii) still land
                    where they did; one focus is shared by the three views and Back / Forward restore view, focus and filter; the
                    Trace action appears with a species in context and names an arranged function
Standard library only; nothing is written except the report.
"""
import glob, json, os, re, subprocess, sys, tempfile
from collections import Counter, defaultdict
from datetime import date

ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
X, KG, XYZ, REL = J("brain/data/explorer.json"), J("brain/data/kg.json"), J("brain/data/xyz.json"), J("relations.json")
KN = {n["id"]: n for n in KG["nodes"]}; KE = {e["id"]: e for e in KG["edges"]}; KC = KG["claims"]
XN = {n["id"]: n for n in XYZ["nodes"]}; XE = {e["id"]: e for e in XYZ["edges"]}
SP = {s["id"]: s for s in X["species"]}; FN = {f["id"]: f for f in X["functions"]}; FA = {f["id"]: f for f in X["facets"]}; CO = {c["id"]: c for c in X["concepts"]}
LK = {l["id"]: l for l in X["function_links"]}; AT = {a["id"]: a for a in X["attributes"]}; CL = {e["id"]: e for e in X["concept_links"]}; RE = {r["id"]: r for r in X["relations"]}
CLAIMS = X["claims"]
TODAY = date.today().isoformat()
results = []


def test(name, ok, detail=""):
    results.append((name, bool(ok), str(detail)[:400])); return bool(ok)


def live(e): return e.get("live", True) is not False and e.get("verification") != "retired" and e.get("status") != "retired"


# A counts
plant_files = sorted(os.path.basename(f)[:-5] for f in glob.glob(os.path.join(ROOT, "plants/*.json")))
test("A1 ten species, ids = plants/*.json", len(SP) == 10 and sorted(s["slug"] for s in SP.values()) == plant_files and all(s["id"] == f"plant:{s['slug']}" for s in SP.values()), f"{len(SP)} · {plant_files}")
test("A2 the five spatial functions", sorted(f["label"] for f in FN.values()) == ["Barrier", "Ceiling / Canopy", "Ground Cover", "Screen", "Scrim"], str([f["label"] for f in FN.values()]))
test("A3 exactly species × functions link cells, one per pair", len(LK) == len(SP) * len(FN) and len({(l["species"], l["function"]) for l in LK.values()}) == len(LK) and all(l["species"] in SP and l["function"] in FN for l in LK.values()), f"{len(LK)} cells")
test("A4 attribute cells name a species and a facet; one per (species, facet)", all(a["species"] in SP and a["facet"] in FA for a in AT.values()) and len({(a["species"], a["facet"]) for a in AT.values()}) == len(AT), f"{len(AT)} cells · {len(FA)} facets")
ids = [s["id"] for s in SP.values()] + list(FN) + list(FA) + list(CO) + list(LK) + list(AT) + list(CL) + list(RE) + [p["id"] for p in X["pairs"]]
test("A5 ids unique across collections", len(ids) == len(set(ids)), f"{len(ids)} ids")

# B integrity
bad = []
for l in LK.values():
    for c in l.get("use_claims", []):
        if c not in CLAIMS: bad.append((l["id"], c, "use claim"))
    for r in l.get("requirements", []):
        for x in r.get("evidence", []) + r.get("contrary", []):
            if x.get("claim") and x["claim"] not in CLAIMS: bad.append((l["id"], x["claim"], "requirement claim"))
        for a in r.get("alternatives", []):
            if a not in KN: bad.append((l["id"], a, "alternative concept"))
    for u in l.get("underlying", []):
        if u not in KE: bad.append((l["id"], u, "kg edge"))
    if l.get("xyz_edge") and l["xyz_edge"] not in XE: bad.append((l["id"], l["xyz_edge"], "xyz edge"))
for a in AT.values():
    for v in a["values"]:
        for c in v["claims"]:
            if c not in CLAIMS: bad.append((a["id"], c, "value claim"))
        if v["concept"] not in KN: bad.append((a["id"], v["concept"], "concept"))
    for e in a["underlying"]["xyz_edges"]:
        if e not in XE: bad.append((a["id"], e, "xyz edge"))
for e in CL.values():
    if e["species"] not in SP or e["concept"] not in CO: bad.append((e["id"], "", "ends"))
    for c in e["claims"]:
        if c not in CLAIMS: bad.append((e["id"], c, "claim"))
for r in RE.values():
    if not r.get("outside_db") and (r["a"] not in SP or r["b"] not in SP): bad.append((r["id"], "", "plant"))
    for c in r.get("derived_from", []) + r.get("supporting_claims", []):
        if c not in CLAIMS and c not in r.get("missing_claims", []): bad.append((r["id"], c, "claim"))
        if c in r.get("missing_claims", []) and c in KC: bad.append((r["id"], c, "flagged missing but exists"))
for p in X["pairs"]:
    if p["a"] not in SP or p["b"] not in SP: bad.append((p["id"], "", "plants"))
    for rid in p["direct_relations"] + p["retired_relations"]:
        if rid not in RE: bad.append((p["id"], rid, "relation"))
    for c in p["shared_concepts"]:
        if c not in CO: bad.append((p["id"], c, "shared concept"))
    for x in p["complementarity"]["combinations"]:
        if x["a_link"] not in LK or x["b_link"] not in LK: bad.append((p["id"], x, "combo link"))
for c in CLAIMS.values():
    if c["source_id"] not in X["sources"]: bad.append((c["id"], c["source_id"], "source"))
for f in FN.values():
    for r in f["requirements"]:
        if r["id"] not in KE: bad.append((f["id"], r["id"], "requirement relation"))
test("B1 every referenced id exists (dangling claim references in relations.json are flagged `missing_claims`, never invented)", not bad, "; ".join(map(str, bad[:6])) or f"flagged: {X['stats'].get('relations_with_missing_claims')}")

# C evidence trace
bad = []
for l in LK.values():
    if not l["drawn"]: continue
    if l["status"] == "derived" and not l["use_claims"]: bad.append((l["id"], "derived without a use claim"))
    if l["status"] == "candidate" and (l["use_claims"] or not all(r["result"] == "met" for r in l["requirements"] if r["strength"] == "required") or not any(r["evidence"] for r in l["requirements"])): bad.append((l["id"], "candidate without a full met requirement check"))
    for c in l["use_claims"]:
        if CLAIMS[c]["status"] == "retired": bad.append((l["id"], c, "retired use claim"))
    if l["evidence_kind"] != ("use_claim" if l["use_claims"] else "trait_inference"): bad.append((l["id"], "evidence_kind"))
test("C1 drawn links resolve to a use claim (derived) or a met requirement check (candidate)", not bad, "; ".join(map(str, bad[:5])))
bad = []
for a in AT.values():
    for v in a["values"]:
        if not v["claims"] and not v["entity"]: bad.append((a["id"], v["label"], "no claim, not entity"))
        for c in v["claims"]:
            if CLAIMS[c]["status"] == "retired": bad.append((a["id"], c, "retired claim on a live value"))
test("C2 every attribute value names live claims or an entity record", not bad, "; ".join(map(str, bad[:5])))
bad = [(e["id"], c) for e in CL.values() for c in e["claims"] if CLAIMS[c]["status"] == "retired"]
test("C3 concept links cite live claims only", not bad, str(bad[:5]))
ai = X["evidence_checks"]
test("C4 AI evidence checks are keyed by claim id and every check result is in the vocabulary", all(k in KC for k in ai) and all(v["result"] in X["vocab"]["evidence_check"] for v in ai.values()) and all(c["evidence_check"] in X["vocab"]["evidence_check"] for c in CLAIMS.values()), f"{len(ai)} checks")

# D status apart
bad = []
for l in LK.values():
    ver_claims = [c for c in l.get("use_claims", []) if CLAIMS[c]["status"] == "verified"]
    if (l["verification"] == "verified") != bool(ver_claims): bad.append((l["id"], l["verification"], "verification not from claims"))
    if l["status"] == "candidate" and l["verification"] != "none": bad.append((l["id"], "candidate verified"))
    if not l["drawn"] and (l["status"] != "unknown" or not l.get("verdict") or l["verdict"] not in X["vocab"]["unknown_verdict"] or "requirements" not in l): bad.append((l["id"], "unknown without verdict / check"))
    if l["drawn"] and l["status"] == "unknown": bad.append((l["id"], "unknown drawn"))
    kg_best = min((KE[u]["kg_status"] for u in l["underlying"] if u in KE and live(KE[u])), key=lambda s: {"documented": 0, "derived": 1, "candidate": 2, "unknown": 3}[s], default="unknown")
    if l["status"] != kg_best: bad.append((l["id"], l["status"], kg_best, "status differs from the strongest live kg design edge"))
    if l["drawn"] and l["conflict"] != any("contradicted" in (KE[u].get("verdict") or "") for u in l["underlying"] if u in KE): bad.append((l["id"], "conflict flag"))
    if not l["drawn"] and l["conflict"]: bad.append((l["id"], "unknown cell flagged as conflict (a verdict, not a conflict)"))
test("D1 link verification from verified use claims only; candidates never verified; status = strongest kg edge; unknown never drawn", not bad, "; ".join(map(str, bad[:5])))
bad = []
for a in AT.values():
    ver = any(CLAIMS[c]["status"] == "verified" for v in a["values"] for c in v["claims"])
    if (a["verification"] == "verified") != ver: bad.append((a["id"], a["verification"]))
    for v in a["values"]:
        if (v["verification"] == "verified") != any(CLAIMS[c]["status"] == "verified" for c in v["claims"]): bad.append((a["id"], v["label"], "value verification"))
test("D2 attribute verification from verified claims only", not bad, str(bad[:5]))
test("D3 claim statuses unchanged from kg.json (nothing promoted)", all(CLAIMS[c]["status"] == KC[c]["status"] for c in CLAIMS if c in KC) and all(c in KC for c in CLAIMS), f"{len(CLAIMS)} claims")
test("D4 three vocabularies kept apart on the file", set(X["vocab"]["status"]) == {"documented", "derived", "candidate", "unknown"} and set(X["vocab"]["verification"]) >= {"verified", "unverified", "none"} and "supported_by_source" in X["vocab"]["evidence_check"])

# E matrix = xyz suited_for + gaps
drawn = {(e["source"], e["target"]): e for e in XYZ["edges"] if e["rel"] == "suited_for"}
gaps = {(g["plant"], n["id"]): g for n in XYZ["nodes"] if n["kind"] == "function" for g in n.get("gaps", [])}
bad = []
for l in LK.values():
    k = (l["species"], l["function"])
    if l["drawn"]:
        e = drawn.get(k)
        if not e: bad.append((l["id"], "drawn but no xyz line")); continue
        if e["status"] != l["status"] or bool(e.get("conflict")) != l["conflict"] or e["verification"]["label"] != l["verification"]: bad.append((l["id"], "status / conflict / verification differ from xyz"))
        if sorted(e["basis"]["claims"]) != sorted(l["use_claims"]): bad.append((l["id"], "use claims differ"))
    else:
        if k in drawn: bad.append((l["id"], "xyz draws it")); continue
        if k not in gaps: bad.append((l["id"], "not an xyz gap")); continue
        if gaps[k]["verdict"] != l["verdict"]: bad.append((l["id"], "verdict differs"))
test("E1 50 cells = 21 xyz suited_for lines + 29 xyz gaps, same status, conflict, verification and verdict", not bad and sum(1 for l in LK.values() if l["drawn"]) == len(drawn) and sum(1 for l in LK.values() if not l["drawn"]) == len(gaps), f"{sum(1 for l in LK.values() if l['drawn'])} drawn · {sum(1 for l in LK.values() if not l['drawn'])} unknown; " + "; ".join(map(str, bad[:4])))
test("E2 every function has ≥ 1 linked species and its requirements carry literature", all(f["n_linked"] >= 1 and f["requirements"] and all(r.get("literature") for r in f["requirements"]) for f in FN.values()), str({f["label"]: f["n_linked"] for f in FN.values()}))

# F relations
src = {r["id"]: r for r in REL["relations"]}
bad = []
for rid, r in src.items():
    p = RE.get(rid)
    if not p: bad.append((rid, "missing")); continue
    if p["status"] != r["status"] or p["type"] != r["relation_type"] or p["live"] != (r["status"] != "retired"): bad.append((rid, "status / type / live"))
    if r["status"] == "retired" and (p["live"] or p["xyz_edge"] or not (p.get("retired_reason") or p.get("retired_by"))): bad.append((rid, "retired record live, drawn or without reason"))
    if p["placeholder"] != (r.get("source_type") == "model"): bad.append((rid, "placeholder flag"))
xyz_rel = {rr["id"] for e in XYZ["edges"] if e["type"] == "plant_relation" for rr in e["records"]}
test("F1 every relations.json record projected once with its status; retired = history, never drawn; placeholders flagged", not bad and len(RE) == len(src) and {f"rel:{r['id']}" for r in RE.values() if r["live"]} == xyz_rel, f"{len(RE)} records · {sum(1 for r in RE.values() if r['live'])} live · {sum(1 for r in RE.values() if not r['live'])} retired; " + "; ".join(map(str, bad[:4])))
test("F2 no live relation was derived from shared attributes alone (M43: REL-R1 companions stay retired)", not [r for r in RE.values() if r["live"] and r.get("rule") == "REL-R1"] and all(not r["live"] for r in RE.values() if r.get("rule") == "REL-R1"), f"{sum(1 for r in RE.values() if r.get('rule') == 'REL-R1')} REL-R1 records, all retired")

# G pairs
kgp = {tuple(sorted(p["plants"])): p for p in KG["plant_pairs"]}
bad = []
for p in X["pairs"]:
    k = tuple(sorted((p["a"], p["b"])))
    want = sorted(r["id"] for r in RE.values() if r["live"] and {r["a"], r["b"]} == set(k))
    if sorted(p["direct_relations"]) != want: bad.append((p["id"], "direct relations"))
    want_ret = sorted(r["id"] for r in RE.values() if not r["live"] and {r["a"], r["b"]} == set(k))
    if sorted(p["retired_relations"]) != want_ret: bad.append((p["id"], "retired relations"))
    if k in kgp and not set(p["shared_concepts"]) <= set(kgp[k]["shared"]): bad.append((p["id"], "shared concepts not from kg"))
    la = {l["function"] for l in LK.values() if l["species"] == p["a"] and l["drawn"]}; lb = {l["function"] for l in LK.values() if l["species"] == p["b"] and l["drawn"]}
    for x in p["complementarity"]["combinations"]:
        if x["a_function"] == x["b_function"] or x["a_function"] not in la or x["b_function"] not in lb: bad.append((p["id"], x["a_function"], x["b_function"], "combo not from drawn links"))
    if len(p["complementarity"]["combinations"]) != len(la) * len(lb) - len(la & lb): bad.append((p["id"], "combo count"))
    if "hypothesis" not in p["complementarity"]["note"] or "compatib" not in p["complementarity"]["note"]: bad.append((p["id"], "note"))
    if any(k2 in json.dumps(p) for k2 in ("compatible", "recommended", "suitable_pair")): bad.append((p["id"], "asserts compatibility"))
test("G1 45 pairs: direct / retired ids = relations.json; shared ⊆ kg; combinations only from drawn links, never same function, labelled hypothesis", len(X["pairs"]) == 45 and not bad, f"{len(X['pairs'])} pairs · {sum(1 for p in X['pairs'] if p['direct_relations'])} with a live record; " + "; ".join(map(str, bad[:4])))

# H table
node_lines = defaultdict(set)
for e in XYZ["edges"]:
    if e["rel"] in ("grows_in", "has_trait"): node_lines[(e["source"], e["facet"])].add(e["target"])
bad = []
for (pid, f), concepts in node_lines.items():
    a = AT.get(f"attr:{pid}:{f}")
    if not a: bad.append((pid, f, "node facet cell missing")); continue
    if {v["concept"] for v in a["values"]} != concepts: bad.append((pid, f, "values ≠ xyz concepts"))
for pid in SP:
    for gid, fs in (XN[pid].get("attributes") or {}).items():
        if gid == "z": continue
        for f, rows in fs.items():
            a = AT.get(f"attr:{pid}:{f}")
            if not a: bad.append((pid, f, "attribute facet cell missing")); continue
            if {v["concept"] for v in a["values"]} != {r["concept"] for r in rows["values"]}: bad.append((pid, f, "attribute values ≠ xyz plant attributes"))
dis = {(d["plant"], d["facet"]) for d in KG["conflicts"]["disagreement"]}
for a in AT.values():
    if bool(a["disagreement"]) != ((a["species"], a["facet"]) in dis): bad.append((a["id"], "disagreement flag"))
    if a["n_values"] != len(a["values"]) or a["n_values"] != len({v["concept"] for v in a["values"]}): bad.append((a["id"], "n_values"))
test("H1 attribute cells = xyz plant → concept lines + plant attributes; every distinct value kept; disagreement = kg conflicts", not bad, "; ".join(map(str, bad[:5])))
nr = len(SP) * len(FA) - len(AT)
test("H2 not-recorded cells are absent from the file (the interface says 'not recorded'; nothing is written for them)", nr == X["stats"]["cells_not_recorded"] and nr > 0, f"{nr} not recorded")

# I interface
ui = "".join(open(p, encoding="utf-8").read() for p in glob.glob(os.path.join(ROOT, "brain/explorer/*.html")) + glob.glob(os.path.join(ROOT, "brain/explorer/js/*.js")))
names = [s["id"] for s in SP.values()] + [s["slug"] for s in SP.values()] + [s["scientific_name"] for s in SP.values()] + list(FN) + [c for c in CO if ":" in c]
hits = [n for n in names if n in ui]
test("I1 the interface names no plant, function or concept id", not hits, str(hits[:8]))

# J stats
st = X["stats"]
test("J1 statistics match the file", st["species"] == len(SP) and st["functions"] == len(FN) and st["function_links"] == len(LK) and st["attribute_cells"] == len(AT) and st["relations"] == len(RE) and st["pairs"] == len(X["pairs"]) and st["claims"] == len(CLAIMS) and st["links_drawn"] == sum(1 for l in LK.values() if l["drawn"]) and st["links_by_status"] == dict(Counter(l["status"] for l in LK.values())) and st["relations_live"] == sum(1 for r in RE.values() if r["live"]), json.dumps({k: st[k] for k in ("species", "functions", "function_links", "attribute_cells", "relations", "pairs", "claims")}))

# K browser (optional)
browser_log = []
if "--browser" in sys.argv:
    chrome = next((c for c in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"] if os.path.exists(c)), None)
    base = os.environ.get("EXPLORER_URL") or "http://localhost:8766/brain/explorer/"
    if not chrome:
        test("K0 headless Chrome found", False, "no Chrome binary; skipped")
    else:
        def dom(hash_, query=""):
            with tempfile.TemporaryDirectory() as td:
                r = subprocess.run([chrome, "--headless=new", "--disable-gpu", "--no-first-run", f"--user-data-dir={td}", "--window-size=1440,900", "--virtual-time-budget=6000", "--dump-dom", base + query + hash_], capture_output=True, text=True, timeout=90)
                return r.stdout
        def replay(steps, hash_=""):
            m = re.search(r'<script type="application/json" id="replay-out">(.*?)</script>', dom(hash_, "?replay=" + steps), re.S)
            return json.loads(m.group(1)) if m else []
        def pick(id_, fn, link="plant:gaultheria-shallon"): return f"#fk=function&fi={id_}&ik=link&ii=link:{link}>{id_}"
        def graph(d):
            cls = re.findall(r'class="node species[^"]*"', d); ng = sum(1 for c in cls if 'ghost' in c)
            return {"species": len(cls) - ng, "ghost_species": ng, "functions": len(re.findall(r'class="node function', d)), "concepts": len(re.findall(r'class="node concept', d))}
        FOCUS = "z:screen"; linked = [l for l in LK.values() if l["function"] == FOCUS and l["drawn"]]; unknown = [l for l in LK.values() if l["function"] == FOCUS and not l["drawn"]]
        try:
            d = dom("")
            sw = re.findall(r'<button data-view="(\w+)" aria-pressed="(true|false)"', re.search(r'<div id="views"[^>]*>(.*?)</div>', d, re.S).group(1))
            rows = re.findall(r'<tr class="[^"]*"><th data-focus="species=([^"]+)">', re.search(r'<table class="attr">(.*?)</table>', d, re.S).group(1) if 'class="attr"' in d else "")
            test("K0 no focus, no view named: Knowledge opens on the table with a row for every species (no start screen); the switch is Table | Matrix | Network with Table pressed; no other view is in the page", sw == [("table", "true"), ("matrix", "false"), ("graph", "false")] and sorted(rows) == sorted(SP) and 'id="start"' not in d and 'id="search0"' not in d and 'class="node' not in d and 'class="matrix"' not in d and 'id="inspector" aria-label="Evidence" hidden' in d, f"switch {sw} · rows {len(rows)}")
            d = dom("#v=graph"); g = graph(d); req = {a for f in FN.values() for r in f["requirements"] for a in r["alternatives"] if a in CO and not CO[a].get("no_plant_reaches")}
            n_link = len(re.findall(r'<path class="edge suited_for [^"]*" data-ei', d)); n_req = len(re.findall(r'<path class="edge requires_trait [^"]*" data-ei', d)); lat = re.findall(r'<path class="edge (?:has_trait|grows_in) ([^"]*)" data-ei', d)
            n_reqrec = sum(1 for f in FN.values() for r in f["requirements"] for a in r["alternatives"] if a in req)
            test("K0b the Network without a focus is the X · Y · Z overview: every species, every function, the traits the functions require; one line per drawn function link and per requirement, the plants' claim lines to those traits kept latent; no line for a missing link; the three axes are named and the recorded-only functions marked", g == {"species": len(SP), "ghost_species": 0, "functions": len(FN), "concepts": len(req)} and n_link == sum(1 for l in LK.values() if l["drawn"]) and n_req == n_reqrec and len(lat) == sum(1 for e in CL.values() if e["concept"] in req) and all("latent" in c for c in lat) and all(f'<tspan class="ax">{ax}</tspan>' in d for ax in "XYZ") and len(re.findall(r'class="node function[^"]* rec ', d)) == len(re.findall(r'<text class="subl"[^>]*>recorded only</text>', d)) > 0, f"{g} · links {n_link} · requirements {n_req}/{n_reqrec} · latent {len(lat)}")
            d = dom(f"#fk=function&fi={FOCUS}"); g = graph(d)
            test("K1 Screen focus: the graph shows the function and its linked species only; the layers are offered, none is on; the inspector holds the function record", g == {"species": len(linked), "ghost_species": 0, "functions": 1, "concepts": 0} and len(re.findall(r'class="layer[^"]*" data-layer="(?:traits|gaps)" aria-pressed="false"', d)) == 2 and "Requires" in d and 'class="matrix"' not in d and 'class="attr"' not in d, str(g))
            d = dom(f"#fk=function&fi={FOCUS}&x=traits,gaps"); g = graph(d)
            test("K1b layers added on purpose: required traits and the species without a link (ghosts, no line)", g["species"] == len(linked) and g["ghost_species"] == len(unknown) and g["concepts"] >= 3 and len(re.findall(r'data-layer="(?:traits|gaps)" aria-pressed="true"', d)) == 2, str(g))
            d = dom(f"#fk=function&fi={FOCUS}&v=matrix")
            col = re.search(r'<th class="focus"[^>]*>([^<]+)<', d)
            test("K1c the same focus in the matrix: its column is marked, one cell per species, and no other view is in the page", col and col.group(1) == FN[FOCUS]["label"] and len(re.findall(r'<td class="[^"]*" data-inspect="link=', d)) == len(LK) and 'class="node' not in d and 'class="attr"' not in d, f"column {col and col.group(1)}")
            d = dom(f"#fk=function&fi={FOCUS}&v=table")
            first = re.search(r'<table class="attr">.*?<tbody><tr class="([^"]*)"><th[^>]*><i class="sci">([^<]+)</i>', d, re.S); req = re.findall(r'<th class="req[^"]*"[^>]*>([^<]+)', d)
            test("K1d the same focus in the table: the columns the function requires are marked and a linked species comes first", len(req) == len(FN[FOCUS]["required_facets"]) and first and "linked" in first.group(1) and 'class="node' not in d, f"required columns {req} · first row {first and first.group(2)}")
            d = dom(pick(FOCUS, None))
            test("K2 link → evidence: inspector shows the use claim, the rule and the requirement check; the graph line is selected; the trace into a design is offered", "Use claims" in d and "KG-R1" in d and "Requirement check" in d and 'class="edge' in d and " sel" in d and "Sheared hedge" in d and "Trace this into a design" in d and "#species=gaultheria-shallon" in d and re.search(r'<a class="trace" id="trace" href="[^"]*trace/#species=gaultheria-shallon"', d), f"{len(d)} bytes")
            d = dom(f"#fk=function&fi={FOCUS}&ik=link&ii=link:plant:achillea-millefolium>{FOCUS}")
            test("K3 unknown cell → honest 'not established': verdict, missing requirements, contrary claims", "No link is drawn" in d and "contradicted" in d and "contrary" in d, "")
            d = dom("#a=plant:vaccinium-ovatum&b=plant:gaultheria-shallon&tab=compare")
            secs = re.findall(r'<section class="csec" data-sec="([a-z_]+)"', d)
            test("K4 A/B compare (V1 link, tab=compare): the four sections in order; the pair's two live direct records and the retired history are listed", secs == list(X["vocab"]["pair_sections"]) and "2 live · 2 retired" in d and "co listed" in d and 'class="node' not in d, str(secs))
            d = dom("#a=plant:acer-palmatum&b=plant:achillea-millefolium&v=compare")
            test("K5 A/B compare with no record: the absence is stated, not filled; nothing biological is inferred", "None recorded" in d and "honest absence" in d and "Nothing biological is inferred" in d, "")
            d = dom("#fk=pair&a=plant:vaccinium-ovatum&b=plant:gaultheria-shallon&tab=compare")
            test("K6 pair in the graph (V1 link): both species, a typed relation line, no line from shared traits alone", 'class="edge co_listed' in d and len(re.findall(r'class="node species', d)) == 2, "")
            sp = "plant:gaultheria-shallon"; grp = {g: len({e["concept"] for e in X["concept_links"] if e["species"] == sp and e["group"] == g}) for g in {e["group"] for e in X["concept_links"] if e["species"] == sp}}; gid = sorted(grp)[0]
            mine = [l for l in LK.values() if l["species"] == sp]; others = {r["b"] if r["a"] == sp else r["a"] for r in RE.values() if r["live"] and sp in (r["a"], r["b"])} & set(SP)
            g0 = graph(dom(f"#fk=species&fi={sp}")); g1 = graph(dom(f"#fk=species&fi={sp}&x={gid},relations,gaps"))
            test("K7 species focus: its linked functions only; one knowledge group, the relation records and the functions without a link are added on request", g0 == {"species": 1, "ghost_species": 0, "functions": sum(1 for l in mine if l["drawn"]), "concepts": 0} and g1["concepts"] == grp[gid] and g1["species"] == 1 + len(others) and g1["functions"] == len(mine), f"default {g0} · expanded {g1} · group {gid} has {grp[gid]} concepts")
            a = next(a for a in AT.values() if a["species"] == sp and a["disagreement"])
            d = dom(f"#fk=species&fi={sp}&ik=attr&ii={a['id']}")
            test("K8 a V1 deep link to one attribute cell opens the graph with the cell's claims in the inspector and the way back to the species", "attribute cell" in d and "Sources disagree" in d and 'data-inspect=""' in d and 'class="claim"' in d, a["id"])
            # one focus, three views, and the browser's history (V4)
            sid = sp; steps = replay(f"focus:species={sid};view:matrix;view:graph;back;back;back;forward;q:zzz;back")
            st = {i: (x["view"], x["focus"], x["pressed"]) for i, x in enumerate(steps)}; F = f"species={sid}"
            test("K9 one focus is shared: focusing a species in the table keeps the table and marks its row; switching to the matrix and the Network keeps the focus, marks it there and names it in the toolbar", len(steps) == 10 and st[0] == ("table", None, "table") and st[1] == ("table", F, "table") and st[2] == ("matrix", F, "matrix") and st[3] == ("graph", F, "graph") and all(steps[i]["marked"] >= 1 and steps[i]["crumb"] == SP[sid]["scientific_name"] for i in (1, 2, 3)), str([st.get(i) for i in range(4)]))
            test("K10 Back and Forward restore the view and the focus step by step: Network → matrix → table with the focus → table without it → forward again; a filter is a step too", len(steps) == 10 and st[4] == ("matrix", F, "matrix") and st[5] == ("table", F, "table") and st[6] == ("table", None, "table") and st[7] == ("table", F, "table") and steps[8]["q"] == "zzz" and "q=zzz" in steps[8]["hash"] and steps[9]["q"] == "" and st[9] == ("table", F, "table"), str([st.get(i) for i in range(4, 10)]) + f" · q {[x['q'] for x in steps[8:]]}")
            arranged = [f for f in FN if any(l["function"] == f and l["drawn"] for l in LK.values())]
            tr = [x["trace"] for x in steps]
            d2 = dom(f"#fk=function&fi=z:scrim&v=matrix&ik=link&ii=link:plant:cercidiphyllum-japonicum>z:scrim")
            m = re.search(r'<a class="trace" id="trace" href="([^"]*)" title="([^"]*)"', d2)
            test("K11 the Trace action appears only with a species in context, opens the Decision Trace of that species, and for a function the engine does not arrange it says so and follows an arranged one", tr[0] is None and tr[6] is None and all(t and t.endswith(f"trace/#species={SP[sid]['slug']}") for t in (tr[1], tr[2], tr[3])) and m and "recorded only" in m.group(2) and "fn=" not in m.group(1) and "species=cercidiphyllum-japonicum" in m.group(1), f"{tr[:4]} · {m and m.group(1)}")
            d = dom("#species=gaultheria-shallon&fn=z%3Aground_cover")
            test("K12 a V3 trace address at the Knowledge address is sent on to the Decision Trace with its hash", 'class="pi-doc kn"' in d and 'data-species="gaultheria-shallon"' in d and 'data-fn="z:ground_cover"' in d and "Decision Trace" in d, f"{len(d)} bytes")
            browser_log.append(f"headless Chrome at {base}")
        except Exception as ex:
            test("K0 browser run", False, repr(ex))

# report
ok = sum(1 for _, p, _ in results if p); n = len(results)
lines = [f"# Explorer tests — {TODAY}", "", f"`tools/explorer_tests.py` on `brain/data/explorer.json` ({X['generated']}, {X['generated_by']}) against kg.json ({KG['generated']}), xyz.json ({XYZ['generated']}), relations.json ({REL['updated']}) and plants/*.json. **{ok}/{n} pass.**" + (f" Browser: {browser_log[0]}." if browser_log else " (no browser run; add `--browser`)"), "", "| test | result | detail |", "|---|---|---|"]
for name, p, d in results:
    lines.append(f"| {name} | {'pass' if p else '**FAIL**'} | {d.replace('|', '/')} |")
st = X["stats"]
lines += ["", "## Counts", "", f"- {st['species']} species · {st['facets']} facets · {st['attribute_cells']} attribute cells ({st['cells_not_recorded']} not recorded · {st['cells_with_disagreement']} with a source disagreement)", f"- {st['functions']} functions · {st['function_links']} link cells: {st['links_by_status']} · {st['links_drawn']} drawn · {st['links_conflict']} with a conflict · unknown by verdict {st['unknown_by_verdict']} · verification {st['links_by_verification']}", f"- {st['relations']} relation records: {st['relations_live']} live ({st['relations_by_type']}, {st['relations_placeholder_live']} model placeholders) · {st['relations_retired']} retired", f"- {st['pairs']} pairs · {st['pairs_with_direct']} with a live direct record · {st['pairs_with_complementarity']} with a complementarity hypothesis", f"- {st['claims']} claims cited ({st['claims_by_status']}) · AI evidence checks on {st['evidence_checks']} claims ({st['claims_by_check']}) · {st['sources']} sources"]
out = os.path.join(ROOT, f"eval/explorer-tests-{TODAY}.md")
with open(out, "w", encoding="utf-8") as f: f.write("\n".join(lines) + "\n")
print("\n".join(f"[{'ok' if p else 'FAIL'}] {name}" + (f"  — {d}" if not p and d else "") for name, p, d in results)); print(f"{ok}/{n} pass → {os.path.relpath(out, ROOT)}")
sys.exit(0 if ok == n else 1)
