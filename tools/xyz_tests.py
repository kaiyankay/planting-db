#!/usr/bin/env python3
"""
Tests on the XYZ projection (brain/data/xyz.json from tools/build_xyz.py) against the underlying graph (brain/data/kg.json).

  python3 -I tools/xyz_tests.py            -> eval/xyz-tests-<date>.md, exit 1 on any failure

  A  structure      ids unique, edge ends exist, 3 entrances · growth forms with plants only · 4 knowledge groups · the 5 spatial
                    functions of the brief, every concept sphere reached by ≥ 1 plant, no attribute facet drawn as a sphere
  B  provenance     every plant → concept line stands for live kg.json claim edges of the same pair; every claim exists and is
                    not retired; verified only when a supporting claim is verified (nothing promoted)
  C  design links   every suited_for line is a kg.json design edge with status derived or candidate; unknown ones are listed
                    as gaps and never drawn; status = strongest underlying
  D  requirements   every requires_trait line is an ontology requires_trait relation of the function's concept(s)
  E  plant pairs    every plant-to-plant line is a non-retired relations.json record with its own type (never related_to)
  F  no duplicates  one line per (source, target, relation)
  G  paths          three demonstration paths, one per entrance, every step a real drawn edge between consecutive nodes,
                    no unknown status, every evidence claim in the index
  H  cross-dimension  X → plant → Y ← Z and Z → Y ← plant → X are reachable through drawn edges
  I  interface      the interface files name no plant, genus, family or concept id from the database
  J  counts         the statistics block matches the file
Standard library only; nothing is written except the report.
"""
import json, os, re, sys
from collections import Counter, defaultdict
from datetime import date

ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
X, KG = J("brain/data/xyz.json"), J("brain/data/kg.json")
KN = {n["id"]: n for n in KG["nodes"]}; KE = {e["id"]: e for e in KG["edges"]}; KC = KG["claims"]
N = {n["id"]: n for n in X["nodes"]}; E = {e["id"]: e for e in X["edges"]}
TODAY = date.today().isoformat()
results = []


def test(name, ok, detail=""):
    results.append((name, bool(ok), detail)); return bool(ok)


def live(e): return e.get("live", True) is not False and e.get("verification") != "retired" and e.get("status") != "retired"


# A structure
ids = [n["id"] for n in X["nodes"]]
test("A1 node ids unique", len(ids) == len(set(ids)))
test("A2 edge ends exist, no self loops", all(e["source"] in N and e["target"] in N and e["source"] != e["target"] for e in X["edges"]))
kinds = Counter(n["kind"] for n in X["nodes"])
test("A3 three entrances", kinds["entrance"] == 3, str(kinds))
gfs = [n for n in X["nodes"] if n["kind"] == "growth_form"]
test("A4 growth forms shown have plants; forms without plants hidden", all(n["n_plants"] >= 1 for n in gfs) and all(KN[g]["id"] not in N for g in KN if g.startswith("growth_form:") and not [e for e in KG["edges"] if e["type"] == "classification" and e["target"] == g]), f"{[n['label'] for n in gfs]} · hidden {X['stats']['hidden_growth_forms']}")
test("A5 four knowledge groups", kinds["y_group"] == 4, str([n["label"] for n in X["nodes"] if n["kind"] == "y_group"]))
fl = sorted(n["label"] for n in X["nodes"] if n["kind"] == "function")
test("A6 the five spatial functions", fl == ["Barrier", "Ceiling / Canopy", "Ground Cover", "Screen", "Scrim"], str(fl))
concepts = [n for n in X["nodes"] if n["kind"] == "concept"]
test("A7 every concept sphere reached by ≥ 1 plant", all(n["n_plants"] >= 1 and n["plants"] for n in concepts), f"{len(concepts)} concepts")
attr = {f for f, v in X["y_facets"].items() if v["policy"] == "attribute"}
test("A8 attribute facets are not spheres", not [n for n in concepts if n["facet"] in attr], str(sorted(attr)))
test("A9 Ground cover is a Z function, not a growth form; Groundcover plant type not a classification node", "Ground Cover" in fl and not [n for n in gfs if "ground" in n["label"].lower()] and not [n for n in X["nodes"] if n["id"].startswith("plant_type:")])

# B provenance
bad = []
for e in X["edges"]:
    if e["rel"] not in ("grows_in", "has_trait"): continue
    for u in e["underlying"]:
        k = KE.get(u)
        if not k or not live(k) or k["source"] != e["source"] or k["target"] != e["target"]: bad.append((e["id"], u, "underlying missing / dead / other pair"))
    for c in e["basis"]["claims"]:
        if c not in KC or KC[c]["status"] == "retired": bad.append((e["id"], c, "claim missing or retired"))
    ver = any(KC[c]["status"] == "verified" for c in e["basis"]["claims"] if c in KC)
    if (e["verification"]["label"] == "verified") != ver: bad.append((e["id"], e["verification"], "verification not from claims"))
    if e["n_claims"] != len(set(e["basis"]["claims"])): bad.append((e["id"], e["n_claims"], "n_claims"))
    if not e["basis"]["claims"] and not e["basis"].get("entity"): bad.append((e["id"], "", "no claim and not an entity record"))
test("B1 plant → concept lines stand for live claim edges of the same pair; claims exist; verification from claims", not bad, "; ".join(map(str, bad[:5])))
n_claim_edges = sum(1 for e in X["edges"] if e["rel"] in ("grows_in", "has_trait"))
test("B2 every live kg claim edge on a node facet is covered", all(any(k in e["underlying"] for e in X["edges"] if e["rel"] in ("grows_in", "has_trait")) for k, ke in KE.items() if ke["type"] in ("claim", "height_band", "entity") and live(ke) and ke.get("facet") in {f for f, v in X["y_facets"].items() if v["policy"] == "node"} and ke["source"].startswith("plant:")), f"{n_claim_edges} lines")

# C design links
Z_OF = {u: z["id"] for z in X["z_functions"] for u in z["underlying"]}
rank = {"documented": 0, "derived": 1, "candidate": 2, "unknown": 3}
bad = []; pairs = defaultdict(list)
for k in KG["edges"]:
    if k["type"] == "design" and k["target"] in Z_OF and live(k): pairs[(k["plant"], Z_OF[k["target"]])].append(k)
drawn = {(e["source"], e["target"]): e for e in X["edges"] if e["rel"] == "suited_for"}
gaps = {(g["plant"], n["id"]) for n in X["nodes"] if n["kind"] == "function" for g in n.get("gaps", [])}
for (p, z), ks in pairs.items():
    best = min(rank[k["kg_status"]] for k in ks)
    if best <= 2:
        e = drawn.get((p, z))
        if not e: bad.append((p, z, "derived/candidate pair not drawn")); continue
        if rank[e["status"]] != best: bad.append((p, z, "status not the strongest underlying"))
        if set(e["underlying"]) != {k["id"] for k in ks}: bad.append((p, z, "underlying mismatch"))
        if e["verification"]["label"] == "verified" and not any(KC.get(c, {}).get("status") == "verified" for c in e["basis"]["claims"]): bad.append((p, z, "verified without a verified use claim"))
    else:
        if (p, z) in drawn: bad.append((p, z, "unknown pair drawn"))
        if (p, z) not in gaps: bad.append((p, z, "unknown pair not listed as a gap"))
test("C1 suited_for lines = derived/candidate design edges; unknown = gaps, never drawn", not bad, "; ".join(map(str, bad[:5])))
test("C2 drawn + gaps = every (plant, function) pair with a design edge", len(drawn) + len(gaps) == len(pairs) and not (set(drawn) & gaps), f"{len(drawn)} drawn · {len(gaps)} gaps · {len(pairs)} pairs")
test("C3 a contradicted documented use keeps its line and carries the conflict flag", all(e["conflict"] == any("contradicted" in k.get("verdict", "") for k in pairs[(e["source"], e["target"])]) for e in drawn.values()))

# D requirements
bad = []
for e in X["edges"]:
    if e["rel"] != "requires_trait": continue
    k = KE.get(e["requirement"])
    if not k or k["rel"] != "requires_trait" or Z_OF.get(k["source"]) != e["source"]: bad.append((e["id"], "not an ontology requires_trait of this function")); continue
    if e["target"] not in (k.get("alternatives") or [k["target"]]): bad.append((e["id"], "target not among the alternatives"))
    if e["source"] in Z_OF: bad.append((e["id"], "source is an ontology id"))
test("D1 requires_trait lines are ontology relations of the function", not bad, "; ".join(map(str, bad[:5])))
reqs = [k for k in KG["edges"] if k["type"] == "concept" and k["rel"] == "requires_trait" and k["source"] in Z_OF]
test("D2 every requirement of the five functions has at least one line (an alternative in use)", all(any(e["requirement"] == k["id"] for e in X["edges"] if e["rel"] == "requires_trait") for k in reqs), f"{len(reqs)} requirements")

# E plant pairs
rel_lines = [e for e in X["edges"] if e["type"] == "plant_relation"]
kg_rel = [k for k in KG["edges"] if k["type"] == "relation" and k.get("status") != "retired" and k.get("verification") != "retired"]
test("E1 plant-to-plant lines = non-retired relations.json records, typed, one line per pair and type", sum(len(e["underlying"]) for e in rel_lines) == len(kg_rel) and {u for e in rel_lines for u in e["underlying"]} == {k["id"] for k in kg_rel} and all(all(KE[u]["rel"] == e["rel"] for u in e["underlying"]) and e["rel"] != "related_to" for e in rel_lines), f"{len(rel_lines)} lines · {len(kg_rel)} records · {Counter(e['rel'] for e in rel_lines)}")
test("E2 model placeholders are candidates, flagged", all(e["status"] == "candidate" and e["placeholder"] for e in rel_lines if e["source_type"] == "model"))
test("E3 no plant pair line from shared concepts alone", not [e for e in rel_lines if not e["underlying"]])

# F duplicates
keys = Counter((e["source"], e["target"], e["rel"], e.get("requirement")) for e in X["edges"] if e["type"] != "navigation")
test("F1 one line per (source, target, relation)", not [k for k, v in keys.items() if v > 1], str([k for k, v in keys.items() if v > 1][:3]))

# G paths
adj = defaultdict(list)
for e in X["edges"]:
    adj[e["source"]].append(e); adj[e["target"]].append(e)
bad = []
for p in X["paths"]:
    if p["start"] not in ("x", "y", "z"): bad.append((p["id"], "start"))
    for s in p["steps"]:
        e = E.get(s["edge"])
        if not e: bad.append((p["id"], s["edge"], "edge missing")); continue
        if {e["source"], e["target"]} - set(p["nodes"]): bad.append((p["id"], s["edge"], "edge leaves the path"))
        if e["status"] == "unknown": bad.append((p["id"], s["edge"], "unknown status"))
    for c in p["evidence_claims"]:
        if c not in X["claims"] or c not in KC: bad.append((p["id"], c, "claim missing"))
    if not p["evidence_claims"]: bad.append((p["id"], "no evidence claims"))
test("G1 three real paths, one per entrance, every step a drawn edge with evidence", len(X["paths"]) == 3 and {p["start"] for p in X["paths"]} == {"x", "y", "z"} and not bad, "; ".join(map(str, bad[:5])))

# H cross-dimension reachability through drawn semantic edges
def kind(i): return N[i]["kind"]
xyz = []
for e1 in X["edges"]:
    if e1["rel"] != "is_growth_form": continue
    p = e1["source"]
    for e2 in adj[p]:
        if e2["rel"] not in ("grows_in", "has_trait"): continue
        for e3 in adj[e2["target"]]:
            if e3["rel"] == "requires_trait" and any(e4["rel"] == "suited_for" and e4["source"] == p and e4["target"] == e3["source"] for e4 in adj[p]): xyz.append((e1["target"], p, e2["target"], e3["source"]))
test("H1 X → plant → Y ← Z paths exist (plant suited to the function that requires the trait)", len(xyz) > 0, f"{len(xyz)} four-node paths; e.g. {xyz[0] if xyz else ''}")
test("H2 every function reachable from Y and from X", all(any(t[3] == f["id"] for t in xyz) for f in X["nodes"] if f["kind"] == "function"), str(sorted({t[3] for t in xyz})))

# I interface files name nothing from the database
names = set()
for n in KG["nodes"]:
    if n["type"] in ("plant", "cultivar") or n["id"].startswith(("genus:", "family:")): names.add(n["label"].split(" ")[0] if n["type"] == "plant" else n["label"])
    if n["type"] == "concept": names.add(n["id"])
src = "".join(open(os.path.join(ROOT, "brain/xyz-preview", f), encoding="utf-8").read() for f in ("index.html", "js/app.js", "js/xyz.js"))
hits = sorted(x for x in names if len(x) > 3 and re.search(r"\b" + re.escape(x) + r"\b", src))
test("I1 interface files name no plant, taxon or concept id", not hits, str(hits[:8]))

# J counts
st = X["stats"]["projection"]
test("J1 statistics match the file", st["nodes"] == len(X["nodes"]) and st["edges"] == len(X["edges"]) and X["stats"]["initial"]["nodes"] == sum(1 for n in X["nodes"] if n.get("initial")) and X["stats"]["underlying"]["nodes"] == KG["counts"]["nodes"] and X["stats"]["underlying"]["edges"] == KG["counts"]["edges"])

# report
ok = all(r[1] for r in results)
lines = [f"# XYZ projection tests — {TODAY}", "", f"`tools/xyz_tests.py` on `brain/data/xyz.json` (generated {X['generated']}) against `brain/data/kg.json` (generated {KG.get('generated')}). **{sum(1 for r in results if r[1])} / {len(results)} pass.**", "",
         "| test | result | detail |", "|---|---|---|"] + [f"| {n} | {'pass' if o else '**FAIL**'} | {d.replace('|', '/')} |" for n, o, d in results]
u, p, i = X["stats"]["underlying"], X["stats"]["projection"], X["stats"]["initial"]
lines += ["", "## Counts", "", "| level | nodes | edges | note |", "|---|---|---|---|",
          f"| underlying graph (kg.json) | {u['nodes']} | {u['edges']} | {u['claims']} claims; edges by status {u['by_status']} |",
          f"| XYZ projection (xyz.json) | {p['nodes']} | {p['edges']} | {p['semantic_edges']} semantic + {p['edges'] - p['semantic_edges']} navigation; nodes {p['nodes_by_kind']}; relations {p['edges_by_rel']}; status {p['edges_by_status']}; verification {p['edges_by_verification']}; {p['z_gaps']} Z gaps listed, not drawn |",
          f"| initial view | {i['nodes']} | {i['edges']} | three entrances, {kinds['growth_form']} growth forms, 4 knowledge groups, 5 spatial functions |", "",
          "## Demonstration paths (found in the data)", ""]
for pth in X["paths"]:
    lines.append(f"**{pth['title']}** ({pth['start'].upper()}): " + " → ".join(pth["labels"]))
    for s in pth["steps"]:
        lines.append(f"- `{s['rel']}` {N[s['from']]['label']} → {N[s['to']]['label']} — {s['status']}{' · ' + s['verification'] if s['verification'] else ''}{' · ' + s['rule'] if s['rule'] else ''}{' · claims ' + ', '.join(s['claims']) if s['claims'] else ''}{' · ' + s['literature'] if s['literature'] else ''}")
    lines.append(f"- sources: {', '.join(X['sources'][s]['label'] if s in X['sources'] else s for s in pth['evidence_sources'])}")
    lines.append("")
out = os.path.join(ROOT, f"eval/xyz-tests-{TODAY}.md")
open(out, "w", encoding="utf-8").write("\n".join(lines) + "\n")
print("\n".join(f"[{'ok' if o else 'FAIL'}] {n}{' — ' + d if d and not o else ''}" for n, o, d in results)); print(f"{'all pass' if ok else 'FAILURES'} -> {out}")
sys.exit(0 if ok else 1)
