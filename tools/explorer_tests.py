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
  K  browser        (--browser) headless Chrome. V4.1: Knowledge opens on the Network (no start screen) with the Network | Matrix |
                    Table switch; without a focus it is the X · Y · Z overview (every species, function and required trait, only
                    recorded lines, claim lines latent); nodes and lines take the keyboard; the table opens on the groups that
                    hold a required attribute and every attribute stays reachable; a focus is explored in place — lit, context,
                    gaps marked on nodes, Only linked; V4 layer links (x=) still land; the same focus in the matrix (column) and
                    the table (required columns, sort); line → evidence claims, verification apart from the AI check, profile
                    and trace; A/B pair → four sections, direct records (or the honest absence); V1 links (tab=compare,
                    fk=pair, ik/ii) still land; Back / Forward restore view, focus, expansion and filter; the Trace action
                    appears with a species in context; journeys A (Screen → linked species → salal–Screen line → claim → source
                    → profile / trace), B (salal → required traits → Matrix → Table → Back) and C (compare → Matrix / Table →
                    Network, no invented plant-to-plant line); the safe threshold; ids the snapshot no longer holds; the
                    requirement record; line classes told by stroke pattern and by word
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
        def cls_nodes(d, kind, word):
            return sum(1 for c in re.findall(rf'class="node {kind}([^"]*)"', d) if f" {word} " in c + " ")
        def lit(d): return {k: cls_nodes(d, k, "lit") for k in ("species", "function", "concept")}
        REQ = {a for f in FN.values() for r in f["requirements"] for a in r["alternatives"] if a in CO and not CO[a].get("no_plant_reaches")}
        SALAL = "plant:gaultheria-shallon"
        try:
            d = dom("")
            sw = re.findall(r'<button data-view="(\w+)" aria-pressed="(true|false)"', re.search(r'<div id="views"[^>]*>(.*?)</div>', d, re.S).group(1))
            g = graph(d); req = REQ
            test("K0 V4.1: no focus, no view named: Knowledge opens on the Network (no start screen); the switch is Network | Matrix | Table with Network pressed; no other view is in the page and the Inspector is closed", sw == [("graph", "true"), ("matrix", "false"), ("table", "false")] and g["species"] == len(SP) and 'id="start"' not in d and 'class="attr"' not in d and 'class="matrix"' not in d and 'id="inspector" aria-label="Inspector" hidden' in d, f"switch {sw} · {g}")
            n_link = len(re.findall(r'<path class="edge suited_for [^"]*" data-ei', d)); n_req = len(re.findall(r'<path class="edge requires_trait [^"]*" data-ei', d)); lat = re.findall(r'<path class="edge (?:has_trait|grows_in) ([^"]*)" data-ei', d)
            n_reqrec = sum(1 for f in FN.values() for r in f["requirements"] for a in r["alternatives"] if a in req)
            test("K0b the Network without a focus is the X · Y · Z overview: every species, every function, the traits the functions require; one line per drawn function link and per requirement, the plants' claim lines to those traits kept latent (no claim explosion); no line for a missing link; the three axes are named and the recorded-only functions marked", g == {"species": len(SP), "ghost_species": 0, "functions": len(FN), "concepts": len(req)} and n_link == sum(1 for l in LK.values() if l["drawn"]) and n_req == n_reqrec and len(lat) == sum(1 for e in CL.values() if e["concept"] in req) and all("latent" in c for c in lat) and all(f'<tspan class="ax">{ax}</tspan>' in d for ax in "XYZ") and len(re.findall(r'class="node function[^"]* rec ', d)) == len(re.findall(r'<text class="subl"[^>]*>recorded only</text>', d)) > 0, f"{g} · links {n_link} · requirements {n_req}/{n_reqrec} · latent {len(lat)}")
            nodes_kb = len(re.findall(r'<g class="node [^"]*" tabindex="0" role="button" aria-label="', d)); hits = len(re.findall(r'class="edge hit"[^>]*tabindex="0" role="button" aria-label="[^"]*Open its evidence"', d))
            test("K0c keyboard: every node and every drawn line of the overview is a focusable button with a name (Enter opens it); the search field is in the bar", nodes_kb == len(SP) + len(FN) + len(req) and hits == n_link + n_req and 'id="search"' in d, f"{nodes_kb} nodes · {hits} lines")
            d = dom("#v=table"); rows = re.findall(r'<tr class="[^"]*"><th data-focus="species=([^"]+)">', re.search(r'<table class="attr">(.*?)</table>', d, re.S).group(1) if 'class="attr"' in d else "")
            rq = {x for f in FN.values() for x in f["required_facets"]}; g0 = {f["group"] for f in X["facets"] if f["id"] in rq}; ncol = len(re.findall(r'data-act="tsort"', d)); nbox = len(re.findall(r'data-act="tg"', d))
            test("K0d the table is one click away (v=table): a row for every species; it opens on the knowledge groups that hold an attribute a function requires, and every group — so all the attributes — stays reachable by its checkbox", sorted(rows) == sorted(SP) and ncol == sum(1 for f in X["facets"] if f["group"] in g0) and nbox == len(X["groups"]) and 'class="node' not in d, f"{ncol} of {len(X['facets'])} columns · {nbox} groups")
            d = dom("#v=table&g=" + ",".join(g["id"] for g in X["groups"]))
            test("K0e every attribute of the snapshot is a column when all groups are ticked (g=…)", len(re.findall(r'data-act="tsort"', d)) == len(X["facets"]), "")
            d = dom(f"#fk=function&fi={FOCUS}"); L = lit(d); reqS = {a for r in FN[FOCUS]["requirements"] for a in r["alternatives"]} & REQ
            test("K1 Screen focus, in place: the function, its linked species and the traits it requires are lit; the other nodes stay in their columns as context; the Expand classes, depth, Only linked, Collapse and Reset are offered; the Inspector holds the function with its linked / missing / conflict counts", L == {"species": len(linked), "function": 1, "concept": len(reqS)} and cls_nodes(d, "species", "ctx") == len(SP) - len(linked) and len(re.findall(r'class="layer[^"]*" data-layer="(?:use|inferred|req)" aria-pressed="true"', d)) == 3 and len(re.findall(r'data-layer="(?:met|gaps)" aria-pressed="false"', d)) == 2 and all(f'data-act="{a}"' in d for a in ("hops", "only", "collapse", "reset")) and "Requires" in d and 'class="summ"' in d and "contradicted" in d and 'class="matrix"' not in d and 'class="attr"' not in d, str(L))
            d = dom(f"#fk=function&fi={FOCUS}&x=traits,gaps"); L = lit(d)
            test("K1b a V4 link with layers (x=traits,gaps) still lands: the species without a link are marked as gaps on their nodes — no line is drawn to them — and the linked species' claim lines to the required traits are lit", L["species"] == len(linked) and cls_nodes(d, "species", "gap") == len(unknown) and len(re.findall(r'data-cls="met"', d)) >= 3 and not re.search(r'class="edge [^"]*"[^>]*data-cls="(?:use|inferred)"[^>]*></path><path class="edge hit"[^>]*(?:' + "|".join(re.escape(SP[l["species"]]["scientific_name"]) for l in unknown) + r') to', d) and len(re.findall(r'data-layer="(?:met|gaps)" aria-pressed="true"', d)) == 2, f"{L} · gaps {cls_nodes(d, 'species', 'gap')}")
            d = dom(f"#fk=function&fi={FOCUS}&only=1")
            test("K1c Only linked takes what the walk did not reach out of the picture", cls_nodes(d, "species", "ctx") == 0 and cls_nodes(d, "function", "ctx") == 0 and lit(d)["species"] == len(linked), str(lit(d)))
            d = dom(f"#fk=function&fi={FOCUS}&v=matrix")
            col = re.search(r'<th class="focus"[^>]*>([^<]+)<', d)
            test("K1d the same focus in the matrix: its column is marked, one cell per species, and no other view is in the page", col and col.group(1) == FN[FOCUS]["label"] and len(re.findall(r'<td class="[^"]*" data-inspect="link=', d)) == len(LK) and 'class="node' not in d and 'class="attr"' not in d, f"column {col and col.group(1)}")
            d = dom(f"#fk=function&fi={FOCUS}&v=table")
            first = re.search(r'<table class="attr">.*?<tbody><tr class="([^"]*)"><th[^>]*><i class="sci">([^<]+)</i>', d, re.S); req = re.findall(r'<th class="req[^"]*"[^>]*>([^<]+)', d)
            test("K1e the same focus in the table: the columns the function requires are marked and a linked species comes first", len(req) == len(FN[FOCUS]["required_facets"]) and first and "linked" in first.group(1) and 'class="node' not in d, f"required columns {req} · first row {first and first.group(2)}")
            d = dom(pick(FOCUS, None))
            test("K2 link → evidence: inspector shows the use claim, the rule and the requirement check; the graph line is selected; the trace into a design is offered", "Use claims" in d and "KG-R1" in d and "Requirement check" in d and 'class="edge' in d and " sel" in d and "Sheared hedge" in d and "Trace this into a design" in d and "Human verification" in d and "AI source check" in d and "never a verification" in d and "Plant Profile" in d and "recorded use, mapped to the function by the ontology" in d and "#species=gaultheria-shallon" in d and re.search(r'<a class="trace" id="trace" href="[^"]*trace/#species=gaultheria-shallon"', d), f"{len(d)} bytes")
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
            d0 = dom(f"#fk=species&fi={sp}"); d1 = dom(f"#fk=species&fi={sp}&x={gid},relations,gaps"); g0 = lit(d0); g1 = lit(d1)
            test("K7 species focus: its linked functions are lit; one knowledge group and the plant-to-plant records are added on request, and the functions without a link are marked as gaps", g0 == {"species": 1, "function": sum(1 for l in mine if l["drawn"]), "concept": 0} and g1["concept"] == grp[gid] and g1["species"] == 1 + len(others) and cls_nodes(d1, "function", "gap") == sum(1 for l in mine if not l["drawn"]) and len(re.findall(r'class="edge [^"]*relation[^"]*" data-ei', d1)) == sum(1 for r in RE.values() if r["live"] and sp in (r["a"], r["b"]) and r["a"] in SP and r["b"] in SP), f"default {g0} · expanded {g1} · group {gid} has {grp[gid]} concepts")
            a = next(a for a in AT.values() if a["species"] == sp and a["disagreement"])
            d = dom(f"#fk=species&fi={sp}&ik=attr&ii={a['id']}")
            test("K8 a V1 deep link to one attribute cell opens the graph with the cell's claims in the inspector and the way back to the species", "attribute cell" in d and "Sources disagree" in d and 'data-inspect=""' in d and 'class="claim"' in d, a["id"])
            # one focus, three views, and the browser's history (V4)
            sid = sp; steps = replay(f"focus:species={sid};view:matrix;view:table;back;back;back;forward;q:zzz;back")
            st = {i: (x["view"], x["focus"], x["pressed"]) for i, x in enumerate(steps)}; F = f"species={sid}"
            test("K9 one focus is shared: focusing a species in the Network marks it there; switching to the matrix and the table keeps the focus, marks its row and names it in the toolbar", len(steps) == 10 and st[0] == ("graph", None, "graph") and st[1] == ("graph", F, "graph") and st[2] == ("matrix", F, "matrix") and st[3] == ("table", F, "table") and all(steps[i]["marked"] >= 1 and steps[i]["crumb"] == SP[sid]["scientific_name"] for i in (1, 2, 3)), str([st.get(i) for i in range(4)]))
            test("K10 Back and Forward restore the view and the focus step by step: table → matrix → Network with the focus → Network without it → forward again; a filter is a step too", len(steps) == 10 and st[4] == ("matrix", F, "matrix") and st[5] == ("graph", F, "graph") and st[6] == ("graph", None, "graph") and st[7] == ("graph", F, "graph") and steps[8]["q"] == "zzz" and "q=zzz" in steps[8]["hash"] and steps[9]["q"] == "" and st[9] == ("graph", F, "graph"), str([st.get(i) for i in range(4, 10)]) + f" · q {[x['q'] for x in steps[8:]]}")
            arranged = [f for f in FN if any(l["function"] == f and l["drawn"] for l in LK.values())]
            tr = [x["trace"] for x in steps]
            d2 = dom(f"#fk=function&fi=z:scrim&v=matrix&ik=link&ii=link:plant:cercidiphyllum-japonicum>z:scrim")
            m = re.search(r'<a class="trace" id="trace" href="([^"]*)" title="([^"]*)"', d2)
            test("K11 the Trace action appears only with a species in context, opens the Decision Trace of that species, and for a function the engine does not arrange it says so and follows an arranged one", tr[0] is None and tr[6] is None and all(t and t.endswith(f"trace/#species={SP[sid]['slug']}") for t in (tr[1], tr[2], tr[3])) and m and "recorded only" in m.group(2) and "fn=" not in m.group(1) and "species=cercidiphyllum-japonicum" in m.group(1), f"{tr[:4]} · {m and m.group(1)}")
            d = dom("#species=gaultheria-shallon&fn=z%3Aground_cover")
            test("K12 a V3 trace address at the Knowledge address is sent on to the Decision Trace with its hash", 'class="pi-doc kn"' in d and 'data-species="gaultheria-shallon"' in d and 'data-fn="z:ground_cover"' in d and "Decision Trace" in d, f"{len(d)} bytes")
            # V4.1: the three journeys, on the real ten plants
            lk = f"link:{SALAL}>{FOCUS}"; J = replay(f"focus:function={FOCUS};only;inspect:link={lk}")
            okA = len(J) == 4 and sorted(x for x in J[1]["lit"] if x in SP) == sorted(l["species"] for l in linked) and J[1]["ctx"] > 0 and J[2]["ctx"] == 0 and J[2]["only"] and J[3]["inspect"] == f"link={lk}" and SP[SALAL]["scientific_name"] in (J[3]["insp"] or "") and "recorded use" in (J[3]["kind"] or "") and J[3]["claims"] >= len(LK[lk]["use_claims"]) >= 1 and any("plants/" in h and "gaultheria-shallon" in h for h in J[3]["links"]) and any("trace/" in h and "gaultheria-shallon" in h for h in J[3]["links"])
            dA = dom(f"#fk=function&fi={FOCUS}&only=1&ik=link&ii={lk}"); cid = LK[lk]["use_claims"][0]; src = X["claims"][cid]["source_id"]
            okA = okA and cid in dA and (X["sources"].get(src, {}).get("label") or src) in dA and f'pi-tag {X["claims"][cid]["status"]}' in dA and "Human verification" in dA and "an assessment, not a verification" in dA
            test("K13 journey A: click Screen → only its linked species remain → the salal — Screen line → the actual use claim with its source, its human verification and the AI check apart → the Plant Profile and the Design Trace are one click away", okA, f"lit {len(J[1]['lit']) if len(J) > 1 else '—'} · ctx {[x['ctx'] for x in J]} · inspector {J[3]['insp'] if len(J) > 3 else '—'} · claim {cid}")
            mineF = [l["function"] for l in LK.values() if l["species"] == SALAL and l["drawn"]]; reqB = {a for f in mineF for r in FN[f]["requirements"] for a in r["alternatives"]} & REQ
            J = replay(f"focus:species={SALAL};e:req;view:matrix;view:table;back;back")
            okB = len(J) == 7 and J[2]["hops"] == 2 and "req" in J[2]["e"] and sorted(x for x in J[2]["lit"] if x in CO) == sorted(reqB) and sorted(x for x in J[2]["lit"] if x in FN) == sorted(mineF) and [x for x in J[2]["lit"] if x in SP] == [SALAL] and J[3]["view"] == "matrix" and J[3]["marked"] >= 1 and J[4]["view"] == "table" and J[4]["marked"] >= 1 and all(x["focus"] == f"species={SALAL}" and x["hops"] == 2 and "req" in x["e"] for x in J[2:]) and J[5]["view"] == "matrix" and J[6]["view"] == "graph" and J[6]["lit"] == J[2]["lit"] and "h=2" in J[6]["hash"]
            test("K14 journey B: click salal → expand its required traits (the traits its linked functions require, two hops; no other plant is reached through a shared function) → Matrix → Table → Back, Back: the focus and the expansion are not lost", okB, f"required traits {len(reqB)} · steps {[(x['view'], x['hops'], len(x['lit'])) for x in J]}")
            other = next(s for s in sorted(SP) if s != SALAL and not any(r["live"] and {r["a"], r["b"]} == {SALAL, s} for r in RE.values()))
            J = replay(f"focus:species={SALAL};cmp:{other};view:matrix;view:table;view:graph")
            dC = dom(f"#a={SALAL}&b={other}&v=compare")
            okC = len(J) == 6 and J[2]["view"] == "compare" and (J[2]["a"], J[2]["b"]) == (SALAL, other) and J[2]["secs"] == list(X["vocab"]["pair_sections"]) and J[3]["cmp"] == 2 and J[4]["cmp"] == 2 and J[5]["view"] == "graph" and J[5]["rel"] == 0 and (J[5]["a"], J[5]["b"]) == (SALAL, other) and "None recorded" in dC and "Unknown: nothing recorded" in dC and "In conflict: records that disagree" in dC and "function evidence" in dC and "Nothing biological is inferred" in dC and 'class="node' not in dC
            test("K15 journey C: compare salal with another species from the Network → shared attributes, function evidence, the unknown and the conflicting kept apart → the pair is marked in the Matrix and the Table → back in the Network no line joins the two plants (none is recorded)", okC, f"with {other} · {[(x['view'], x['cmp'], x['rel']) for x in J]}")
            d = dom(f"#fk=species&fi={SALAL}&e=use,inferred,claims"); nall = len({e["concept"] for e in CL.values() if e["species"] == SALAL}); warn = re.search(r'<div id="gwarn"[^>]*>(.*?)</div>', d, re.S)
            test("K16 a safe threshold: an expansion that would bring more attributes than the Network keeps legible is not applied silently — its count is shown with the groups to narrow it to", nall > 24 and lit(d)["concept"] == 0 and warn and f"Too many attributes ({nall})" in warn.group(1) and "not expanded" in warn.group(1) and "nothing is hidden" in warn.group(1) and len(re.findall(r'data-layer="y:', warn.group(1))) >= 2, f"{nall} claim-line attributes")
            d = dom("#fk=species&fi=plant:not-in-this-snapshot&ik=link&ii=link:nope")
            test("K17 a link that names records the snapshot no longer holds degrades to the overview and says so", graph(d)["species"] == len(SP) and "not in the current snapshot" in d and 'id="err"></div>' in d, "")
            rid = next(f"{r['id']}>{a}" for r in FN[FOCUS]["requirements"] for a in r["alternatives"] if a in REQ)
            d = dom(f"#fk=function&fi={FOCUS}&ik=req&ii={rid}")
            test("K18 a requirement line opens its own record: the function, the trait, the literature the ontology cites, and the plants with a claim on the trait", "spatial function → attribute · requirement" in d and "Robinson" in d and "not a plant claim" in d and " sel" in d, rid)
            css = open(os.path.join(ROOT, "brain/explorer/index.html"), encoding="utf-8").read()
            test("K19 line classes differ by stroke pattern as well as colour (recorded use solid, inferred dashed, conflict dash-dot, requirement dotted), and a lit line carries its class in words", "#svg .edge.derived { stroke-dasharray: none" in css and "#svg .edge.candidate { stroke-dasharray: 5 4" in css and "#svg .edge.conflict { stroke-dasharray: 9 3 2 3" in css and re.search(r'<text class="elabel[^"]*"[^>]*>recorded use</text>', dA) and re.search(r'<text class="elabel[^"]*"[^>]*>inferred</text>', dom(f"#fk=function&fi={FOCUS}")), "")
            # ---------------------------------------------------------------- V4.2: one action, one focus — measured in the page, not read from class names alone
            YARROW = "plant:achillea-millefolium"; KATSURA = "plant:cercidiphyllum-japonicum"
            G0 = {f["group"] for f in X["facets"] if f["id"] in {x for fn in FN.values() for x in fn["required_facets"]}}
            J = replay(f"focus:function={FOCUS};reset")
            k0 = J[0]["key"] if J else []
            test("K20 the overview is calm: its legend names only the three or four line types drawn (no latent claim line), requirement lines are the second layer; a focus keeps its one-hop records at full strength and fades every other node to 15–30 % and every other line below 10 %; Reset restores the overview", len(J) == 3 and 3 <= len(k0) <= 4 and not any("claim line" in x for x in k0) and "#svg:not(.foc):not(.hl) .edge.requires_trait:not(.hit) { stroke-opacity: .38" in css and J[1]["op"]["lit"] == 1 and 0.15 <= J[1]["op"]["ctx"] <= 0.3 and J[1]["op"]["ectx"] <= 0.1 and J[1]["op"]["elit"] == 1 and J[1]["ctx"] > 0 and J[2]["focus"] is None and J[2]["ctx"] == 0 and J[2]["op"]["ctx"] is None, f"legend {k0} · focus opacities {J[1]['op'] if len(J) > 1 else '—'}")
            J = replay(f"focus:function={FOCUS};inspect:link={lk};focus:species={SALAL};back")
            okA2 = len(J) == 5 and sorted(J[2]["ends"]) == sorted([SALAL, FOCUS]) and (J[2]["selw"] or 0) >= 3 and J[2]["standing"] == ["Relation", "Source claim", "Human verification", "AI source check"] and J[2]["adv"] and J[4]["focus"] == f"function={FOCUS}" and J[4]["inspect"] == f"link={lk}" and sorted(J[4]["ends"]) == sorted([SALAL, FOCUS])
            okA2 = okA2 and '<details class="more"><summary>See source &amp; rule</summary>' in dA and dA.index('class="keyclaim"') < dA.index('See source &amp; rule') < dA.index("Use claims") and 'data-view="matrix"' not in dA.split('id="ibody"')[1]
            test("K21 journey A, the line: the inspected salal — Screen line is the thickest, both its ends are marked; the Inspector's first screen is relation → meaning → where the evidence stands (relation, source claim, human verification, AI source check as four separate rows) → the claim that carries it → Plant Profile and the trace; rules, every claim and the ids sit under “See source & rule”, the raw record under Advanced; leaving for the plant and pressing Back returns to the function with the line still inspected", okA2, f"ends {J[2]['ends'] if len(J) > 2 else '—'} · width {J[2]['selw'] if len(J) > 2 else '—'} · rows {J[2]['standing'] if len(J) > 2 else '—'} · after Back {(J[4]['focus'], J[4]['inspect']) if len(J) > 4 else '—'}")
            byg = {g["id"]: len({e["concept"] for e in CL.values() if e["species"] == SALAL and e["group"] == g["id"]}) for g in X["groups"]}; gsmall = next(g for g, n in sorted(byg.items(), key=lambda kv: kv[1]) if 0 < n <= 24)
            J = replay(f"focus:species={SALAL};e:{gsmall};only;e:claims;hops:2;e:{gsmall}")
            okD = len(J) == 7 and J[2]["fresh"] == byg[gsmall] and sum(1 for x in J[2]["lit"] if x in CO) == byg[gsmall] and J[3]["fresh"] == 0 and J[4]["blocked"].startswith("Too many attributes") and len(J[4]["suggest"]) >= 2 and sum(1 for x in J[4]["lit"] if x in CO) == 0 and J[5]["blocked"].startswith("Too many attributes") and J[6]["blocked"] == "" and sum(1 for x in J[6]["lit"] if x in CO) >= byg[gsmall] and "claims" not in J[6]["e"]
            test("K22 journey D, expansion: a claim group added around salal brings exactly its attributes, marked as new once (and no longer after the next step); all claim lines at two hops would pass the safe number, so nothing is added, the count is said and the groups to narrow to are highlighted; choosing one group gives a readable Network with nothing silently missing", okD, f"group {gsmall} ({byg[gsmall]}) · new {[x['fresh'] for x in J]} · blocked {[x['blocked'][:24] for x in J]} · suggested {J[4]['suggest'] if len(J) > 4 else '—'}")
            nconf = sum(1 for l in LK.values() if l["conflict"]); ylk = f"link:{YARROW}>z:ground_cover"; direct = any(r["live"] and {r["a"], r["b"]} == {YARROW, KATSURA} for r in RE.values())
            J = replay(f"view:matrix;ab:a={YARROW};ab:b={KATSURA};inspect:link={ylk};mf:conflict;view:table;view:graph;back;back")
            okM = len(J) == 10 and J[1]["mquiet"] == 0 and J[3]["mrows"] == 2 and J[3]["mquiet"] == (len(SP) - 2) * len(FN) and 0.4 <= J[3]["mq"] <= 0.65 and "Compare selected" in J[3]["mcmp"] and ("No direct record" in J[3]["mcmp"]) == (not direct) and "not a relation" in J[3]["mcmp"] and J[4]["msel"] == f"link={ylk}" and J[4]["mcol"] == len(SP) and J[4]["mquiet"] == (len(SP) - 2) * (len(FN) - 1) and J[5]["moff"] == len(LK) - nconf and "mf=conflict" in J[5]["hash"]
            okM = okM and J[6]["view"] == "table" and J[6]["cmp"] == 2 and J[7]["view"] == "graph" and sorted(J[7]["ab"]) == sorted([YARROW, KATSURA]) and (direct or J[7]["rel"] == 0) and J[7]["inspect"] == f"link={ylk}" and J[8]["view"] == "table" and J[9]["view"] == "matrix" and (J[9]["a"], J[9]["b"]) == (YARROW, KATSURA) and J[9]["msel"] == f"link={ylk}" and J[9]["mf"] == "conflict"
            dM = dom(f"#v=matrix&a={YARROW}&b={KATSURA}"); nrec = len(re.findall(r'<span class="rec"', dM))
            test("K23 the matrix compares: yarrow and katsura set as A and B keep their two rows at full strength, every other cell steps back to about half (still a button); a summary beside it gives both across the five functions in words, says that no direct record joins them and that a shared function is not a relation, and offers “Compare selected”; an inspected cell marks its column; the Conflicts filter fades the rest; Table and Network carry the same A, B and cell, and Back, Back returns to the matrix with all of it", okM and nrec == sum(1 for f in FN if f not in ("z:screen", "z:ground_cover")) and len(re.findall(r'<td class="[^"]*" data-inspect="link=[^"]*" data-r="\d+" data-c="\d+" tabindex="-?\d" role="button" aria-label="[^"]+" title="(?:Recorded use|Inferred from traits|No link)', dM)) == len(LK), f"quiet {[x['mquiet'] for x in J]} · opacity {J[3]['mq'] if len(J) > 3 else '—'} · off {J[5]['moff'] if len(J) > 5 else '—'} of {len(LK)} · views {[x['view'] for x in J]}")
            LIGHT = f"attr:{SALAL}:exposure"; env = "y:environment"; nenv = sum(1 for f in X["facets"] if f["group"] == env); ndef = sum(1 for f in X["facets"] if f["group"] in G0)
            J = replay(f"focus:species={SALAL};e:{env};inspect:attr={LIGHT};view:table;view:matrix;back;tg:{env}")
            okB2 = len(J) == 8 and sum(1 for x in J[2]["lit"] if x in CO) == byg[env] and J[3]["inspect"] == f"attr={LIGHT}" and J[3]["vrows"] == AT[LIGHT]["n_values"] and J[3]["standing"] == ["Source", "Scope", "Human verification", "AI source check"] and J[3]["adv"] and J[4]["view"] == "table" and J[4]["tsel"] == f"attr={LIGHT}" and J[4]["selrow"] == 1 and J[4]["colon"] == len(SP) and J[4]["tcols"] == ndef + 1 and J[4]["sticky"] == "sticky" and 36 <= J[4]["rowh"] <= 44 and all(re.match(r"^\+\d+ values?$", m) for m in J[4]["more"]) and J[5]["view"] == "matrix" and J[5]["inspect"] == f"attr={LIGHT}" and J[6]["view"] == "table" and J[6]["tsel"] == f"attr={LIGHT}" and J[6]["focus"] == f"species={SALAL}" and env in J[6]["e"] and J[7]["tcols"] == ndef + nenv
            dT = dom(f"#v=table&ik=attr&ii={LIGHT}")
            okB2 = okB2 and "Sources disagree" in dT and 'class="pi-tag conflict">sources differ' in dT and '<details class="adv"><summary>Advanced: raw record (JSON)</summary>' in dT and "the structured database record" in dT.lower() and dT.index('class="vrow"') < dT.index("See the claims and sources") < dT.index("Advanced: raw record")
            test("K24 journey B, a source comparison: salal → the Environment claim group → its light cell → the Record Inspector lists each distinct value with its source, its scope, the human verification and the AI check as separate rows and says the sources differ → Table: the same cell is selected, its row and its column are marked, the species column is pinned, rows are 36–44 px, further values are counted in words → Matrix → Back: the same plant, cell and expanded group; the raw record is JSON only under Advanced, closed", okB2, f"values {J[3]['vrows'] if len(J) > 3 else '—'} · table {(J[4]['tsel'], J[4]['selrow'], J[4]['colon'], J[4]['tcols'], J[4]['rowh'], J[4]['more']) if len(J) > 4 else '—'} · back {(J[6]['view'], J[6]['tsel']) if len(J) > 6 else '—'}")
            J = replay("view:table;cell:tablewrap=0,1;key:ArrowRight;key:ArrowDown;key:Enter;key:Escape;key:End")
            okK = len(J) == 8 and J[2]["active"] == "0,1" and J[3]["active"] == "0,2" and J[4]["active"] == "1,2" and J[5]["active"] == "1,2" and (J[5]["inspect"] or "").split("=")[0] in ("attr", "nr") and J[5]["insp"] and J[6]["inspect"] is None and J[6]["insp"] is None and J[7]["active"] == f"1,{ndef + 1}"
            test("K25 the table takes the keyboard like a grid: one cell is in the tab order, arrows move across and down, Enter opens the cell's record and the cell keeps the keyboard, Escape closes the Inspector, End jumps to the last column", okK, f"active {[x['active'] for x in J]} · inspect {[x['inspect'] for x in J]}")
            nrid = next(f"{s}~{f['id']}" for s in sorted(SP) for f in X["facets"] if f["group"] in G0 and f"attr:{s}:{f['id']}" not in AT)
            dN = dom(f"#v=table&ik=nr&ii={nrid}"); allg = ",".join(g["id"] for g in X["groups"]); hide = X["facets"][0]["id"]; dH = dom(f"#v=table&g={allg}&hc={hide}&ts={X['facets'][1]['id']}")
            vis_dis = sum(1 for a in AT.values() if a["disagreement"] and FA[a["facet"]]["group"] in G0)
            test("K26 states are told apart and columns are a choice: a cell without a record opens as “not recorded” (not a lack of the trait, not a contradiction) with the plants that do have one; cells whose sources differ say so in words; every one of the attributes is in the Columns panel, a hidden column (hc=) and a sort (ts=) come back from the address", 'class="pi-tag unknown">not recorded' in dN and "does not mean the plant lacks the trait" in dN and 'class="nr' in dN and " sel" in dN and len(re.findall(r'<span class="dis" title="Sources record different values', dom("#v=table"))) == vis_dis and len(re.findall(r'data-act="tc"', dH)) == len(X["facets"]) and len(re.findall(r'data-act="tsort"', dH)) == len(X["facets"]) - 1 and re.search(r'<th class="[^"]*sorted[^"]*" data-act="tsort" data-id="' + re.escape(X["facets"][1]["id"]) + '" aria-sort="descending"', dH), f"{nrid} · {vis_dis} cells with differing sources · hidden {hide}")
            J = replay(f"focus:species={YARROW};cmp:{KATSURA};view:matrix;view:table;back;forward;view:graph;focus:none=")
            dC2 = dom(f"#a={YARROW}&b={KATSURA}&v=compare")
            okC2 = len(J) == 9 and J[2]["view"] == "compare" and J[2]["secs"] == list(X["vocab"]["pair_sections"]) and J[3]["cmp"] == 2 and J[3]["mrows"] == 2 and J[4]["cmp"] == 2 and J[5]["view"] == "matrix" and J[6]["view"] == "table" and all((x["a"], x["b"]) == (YARROW, KATSURA) for x in J[2:]) and J[7]["view"] == "graph" and J[8]["focus"] is None and sorted(J[8]["ab"]) == sorted([YARROW, KATSURA]) and (direct or J[8]["rel"] == 0) and (J[8]["abdim"] or 1) <= 0.3 and ("None recorded" in dC2) == (not direct) and "hypothesis" in dC2
            test("K27 journey C, yarrow and katsura: compared from the Network in four separate parts (shared attributes, direct records, complementarity as a hypothesis, unknown and conflicting) → the two rows in the Matrix → in the Table → Back and Forward keep A and B → in the Network the two plants are marked by shape (a ring, a dashed square), what neither reaches steps back, and no line joins them because none is recorded", okC2 and "#svg .bmark" in css and "stroke-dasharray: 3.5 2.5" in css, f"{[(x['view'], x['cmp']) for x in J]} · marked {J[8]['ab'] if len(J) > 8 else '—'} · dim {J[8]['abdim'] if len(J) > 8 else '—'}")
            test("K28 the Inspector is docked beside the view and, from 1100 px down, slides over it; it always has its close button and Escape (K25), so it is never a trap", "@media (max-width: 1100px) { #main { flex-direction: row; } #inspector { position: fixed;" in css and 'id="iclose" data-act="close-insp"' in css and "@media (max-width: 1320px) { #inspector { width: 340px; } }" in css, "")
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
