#!/usr/bin/env python3
"""
Build the integrated platform as one self-contained static folder for GitHub Pages (2026-11-14, M65; V2 layout M66).

  python3 -I tools/build_platform.py [out-dir]        default out-dir: ./platform-preview

  Publishing (2026-11-17): the public site is the repository kaiyankay/planting-intelligence. Build into a scratch folder,
  copy its contents over that repository's files (keep its README.md, package.json, package-lock.json, tools/, a2/,
  video.html; the build's README.md becomes BUILD.md) and push; https://kaiyankay.github.io/planting-intelligence/

GitHub Pages serves `main`; the platform is developed on a branch. This script copies every public module from the working tree
into one folder, in the layout the platform ships with, and rewrites the paths that differ from the repository layout:

  <out>/                    Design      the Garden Studio (design/)               Imagine → Shape → Compose → Grow
  <out>/plants/             Plants      the Plant Library (platform/plants/)
  <out>/knowledge/          Knowledge   the Explorer: table · matrix · network (brain/explorer/)
  <out>/knowledge/trace/    Knowledge   the Decision Trace: one decision from a source to a bed (platform/knowledge/trace/)
  <out>/knowledge/neural/   Knowledge   the 3D network (brain/index.html + brain/js/)
  <out>/about/              About       Project · how-it-works/ · method/ · contribute/ (platform/about/), typography/ specimen
  <out>/explore/ · <out>/explore/neural/ · <out>/knowledge/research/ · <out>/knowledge/method/ · <out>/contribute/ ·
  <out>/how-it-works/       the V1–V3 addresses, now redirects that carry the hash along
  <out>/platform/           the platform layer: css, js, illustrations, photograph credits and photographs
  <out>/data/               ONE knowledge snapshot for all of the above, copied from this working tree:
                              explorer.json                          Studio · Library · Knowledge (overview, Explorer, Research, Method)
                              designs/demo-a.json                    the Studio's recorded demonstration garden: the overview's reference case
                              graph.json · diagnosis.json            Neural view
                              db/ (plants/*.json, ontology.json, relations.json, sources.json, schema.json, synonyms.json,
                                   intent_map.json, eval/queries.json)   the canonical files the Neural view reads directly
  <out>/vendor/             polygon-clipping, three.js, 3d-force-graph

Nothing in the folder loads a file from outside it except the web font and, on request, the address lookup and the survey link.
The script refuses to build when the projections were not generated in the same pipeline run, so a preview can never mix an
older graph with a newer explorer projection. The Studio keeps its saved project under a key named after the folder
(design/js/model.js), so this preview never opens a project saved by /design/ or /studio-preview/ on the same origin.

Standard library only.
"""
import json, os, shutil, subprocess, sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, "platform-preview")
J = os.path.join


def git(*a):
    try: return subprocess.run(["git", "-C", ROOT, *a], capture_output=True, text=True).stdout.strip()
    except Exception: return ""


def rewrite(rel, pairs):
    path = J(OUT, rel); s = open(path, encoding="utf-8").read()
    for old, new, *n in pairs:
        want = n[0] if n else 1
        if s.count(old) != want: sys.exit(f"build_platform: expected {want} × “{old[:70]}” in {rel}, found {s.count(old)}")
        s = s.replace(old, new)
    open(path, "w", encoding="utf-8").write(s)


def copy(src, dst): os.makedirs(os.path.dirname(J(OUT, dst)), exist_ok=True); shutil.copy2(J(ROOT, src), J(OUT, dst))
def tree(src, dst, ignore=None): shutil.copytree(J(ROOT, src), J(OUT, dst), ignore=ignore)


# ---------------------------------------------------------------- one snapshot, or no build
load = lambda p: json.load(open(J(ROOT, p), encoding="utf-8"))
ex, graph, diag = load("brain/data/explorer.json"), load("brain/data/graph.json"), load("brain/data/diagnosis.json")
if not (ex["generated"] == graph["generated"] == diag["generated"] == ex["stats"]["inputs"]["kg_generated"]):
    sys.exit(f"build_platform: projections come from different pipeline runs (explorer {ex['generated']}, graph {graph['generated']}, diagnosis {diag['generated']}, kg {ex['stats']['inputs']['kg_generated']}) — run tools/pipeline.py first")
slugs = sorted(s["slug"] for s in ex["species"]); files = sorted(f[:-5] for f in os.listdir(J(ROOT, "plants")) if f.endswith(".json"))
graph_plants = sorted(n["id"].replace("plant:", "") for n in graph["nodes"] if n.get("type") == "plant")
if not (slugs == files == graph_plants): sys.exit(f"build_platform: the species differ between the projections and plants/*.json: explorer {slugs}, plants/ {files}, graph {graph_plants}")
images = load("platform/data/images.json")["images"]
for slug, im in images.items():
    if slug not in slugs: sys.exit(f"build_platform: photograph for an unknown species: {slug}")
    for k in ("file", "card", "author", "licence", "source_url"):
        if not im.get(k): sys.exit(f"build_platform: photograph of {slug} has no {k}")
    for f in (im["file"], im["card"]):
        if not os.path.exists(J(ROOT, "platform", "img", f)): sys.exit(f"build_platform: missing platform/img/{f}")
# illustrations: one per species or none; AI-generated and said so in the manifest; no lettering inside the image (names are set in HTML)
art = load("platform/data/artwork.json")
if "AI-generated" not in art.get("kind", ""): sys.exit("build_platform: platform/data/artwork.json must say that the illustrations are AI-generated")
for slug, im in art["images"].items():
    if slug not in slugs: sys.exit(f"build_platform: illustration for an unknown species: {slug}")
    if im.get("lettering"): sys.exit(f"build_platform: the illustration of {slug} carries lettering — use the artwork without the title")
    if not os.path.exists(J(ROOT, "platform", "art", im["file"])): sys.exit(f"build_platform: missing platform/art/{im['file']}")
if set(art["images"]) - set(images): sys.exit(f"build_platform: illustrated species without a credited reference photograph: {sorted(set(art['images']) - set(images))}")
# the reference case of the Knowledge overview: a project the Studio saved, with a planted and evaluated Screen row
ref = load("designs/demo-a.json"); refv = next((v for v in ref.get("versions", []) if v.get("id") == ref.get("current_version_id")), None)
if not refv or not any(z.get("kind") == "edge" and z.get("function") == "z:screen" for z in refv.get("zones", [])) or not refv.get("evaluation", {}).get("edge_zones"):
    sys.exit("build_platform: designs/demo-a.json holds no generated and evaluated Screen row — the Knowledge overview would have no case")
if ref.get("knowledge_snapshot", {}).get("generated") != ex["generated"]: print(f"build_platform: note — designs/demo-a.json was recorded with snapshot {ref.get('knowledge_snapshot', {}).get('generated')}, this build is {ex['generated']}; the overview re-checks it and says so")

if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(OUT)

# ---------------------------------------------------------------- Design (the Studio is the platform's front door)
copy("design/index.html", "index.html")
tree("design/css", "css"); tree("design/js", "js", shutil.ignore_patterns("app-classic.js", "tests.js")); tree("design/vendor", "vendor")
tree("brain/vendor/three", "vendor/three"); copy("brain/vendor/3d-force-graph.min.js", "vendor/3d-force-graph.min.js")

commit = git("rev-parse", "--short", "HEAD") or "unknown"; branch = git("rev-parse", "--abbrev-ref", "HEAD") or "unknown"
dirty = "+local changes" if git("status", "--porcelain", "--", "design", "designs/demo-a.json", "platform", "brain/explorer", "brain/js", "brain/index.html", "brain/data", "plants", "ontology.json", "relations.json", "sources.json") else ""
stamp = f"{branch} @ {commit}{dirty} · built {date.today().isoformat()} · knowledge {ex['generated']}"
# 2026-11-17: the V4.3 preview is the public version, so it is no longer hidden from search engines and reading tools
NOINDEX = ''
rewrite("index.html", [
    ('"three": "../brain/vendor/three/three.module.js", "three/addons/": "../brain/vendor/three/examples/jsm/"', '"three": "./vendor/three/three.module.js", "three/addons/": "./vendor/three/examples/jsm/"'),
    ('href="../platform/css/platform.css"', 'href="./platform/css/platform.css"'),
    ('<a href="./classic.html">Classic workspace</a><a href="./tests.html">Engine tests</a>', '<span>V4.3</span>'),
    ('<title>Planting Intelligence — imagine your garden</title>', '<title>Planting Intelligence — imagine your garden</title>' + NOINDEX),
])
copy("design/specimens.html", "specimens.html")   # V4.3: the ten plant forms beside the V4.2 proxies; linked from the internal report only
rewrite("specimens.html", [('"three": "../brain/vendor/three/three.module.js", "three/addons/": "../brain/vendor/three/examples/jsm/"', '"three": "./vendor/three/three.module.js", "three/addons/": "./vendor/three/examples/jsm/"'), ('href="../platform/css/platform.css"', 'href="./platform/css/platform.css"'), ('</title>', '</title>' + NOINDEX)])
rewrite("js/specimens.js", [("'../brain/data/explorer.json'", "'./data/explorer.json'")])
rewrite("js/app.js", [("'../brain/data/explorer.json'", "'./data/explorer.json'"), ("'../../platform/js/platform.js'", "'../platform/js/platform.js'"), ("'../../platform/js/plantcard.js'", "'../platform/js/plantcard.js'"), ("'../../platform/js/trace.js'", "'../platform/js/trace.js'")])

# ---------------------------------------------------------------- the platform layer and its pages
tree("platform/css", "platform/css"); tree("platform/js", "platform/js"); tree("platform/data", "platform/data"); tree("platform/img", "platform/img"); tree("platform/art", "platform/art")
tree("platform/fonts", "platform/fonts")   # V4.1 brand-type trial: Kay's own typeface, loaded only when a trial variant is on
rewrite("platform/js/platform.js", [("const LAYOUT = 'repo';", "const LAYOUT = 'preview';")])
ICON = ('<link rel="icon" href="data:,">', '<link rel="icon" href="data:,">' + NOINDEX)
copy("platform/plants/index.html", "plants/index.html")
rewrite("plants/index.html", [('href="../css/platform.css"', 'href="../platform/css/platform.css"'), ('src="../js/library.js"', 'src="../platform/js/library.js"'), ICON])
copy("platform/knowledge/trace/index.html", "knowledge/trace/index.html")   # same depth in both layouts: only the folder name changes
rewrite("knowledge/trace/index.html", [('href="../../css/platform.css"', 'href="../../platform/css/platform.css"'), ('src="../../js/overview.js"', 'src="../../platform/js/overview.js"'), ICON])
copy("platform/about/index.html", "about/index.html")
rewrite("about/index.html", [('href="../css/platform.css"', 'href="../platform/css/platform.css"'), ('href="../css/about.css"', 'href="../platform/css/about.css"'), ('src="../js/about.js"', 'src="../platform/js/about.js"'), ICON])
copy("platform/about/type-trial/index.html", "about/type-trial/index.html")
rewrite("about/type-trial/index.html", [('href="../../css/platform.css"', 'href="../../platform/css/platform.css"'), ('href="../../css/about.css"', 'href="../../platform/css/about.css"'), ('href="../../css/type-trial.css"', 'href="../../platform/css/type-trial.css"'),
                                         ('href="../../css/type-trial-page.css"', 'href="../../platform/css/type-trial-page.css"'), ('src="../../js/typetrial.js"', 'src="../../platform/js/typetrial.js"'), ICON])
for page in ("how-it-works", "method", "contribute", "data", "typography"):
    copy(f"platform/about/{page}/index.html", f"about/{page}/index.html")
    rewrite(f"about/{page}/index.html", [('href="../../css/platform.css"', 'href="../../platform/css/platform.css"'), ('href="../../css/about.css"', 'href="../../platform/css/about.css"'), ('src="../../js/about.js"', 'src="../../platform/js/about.js"'), ICON])


def redirect(rel, to, label):   # an address of V1–V3 that moved: the hash travels with it, so an old deep link still arrives
    os.makedirs(J(OUT, rel), exist_ok=True)
    open(J(OUT, rel, "index.html"), "w", encoding="utf-8").write(f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>{label} · Planting Intelligence</title><link rel="icon" href="data:,">{NOINDEX}
<link rel="canonical" href="{to}">
<script>location.replace("{to}" + location.hash);</script>
<noscript><meta http-equiv="refresh" content="0; url={to}"></noscript>
</head><body><p>This page moved. <a href="{to}">{label}</a></p></body></html>
''')


redirect("explore", "../knowledge/", "Knowledge")
redirect("explore/neural", "../../knowledge/neural/", "3D network")
redirect("knowledge/research", "../../about/method/", "Research & Method")
redirect("knowledge/method", "../../about/method/", "Research & Method")
redirect("contribute", "../about/contribute/", "Contribute & Future")
redirect("how-it-works", "../about/how-it-works/", "How it works")

# ---------------------------------------------------------------- Explore: the Knowledge Explorer and the Neural view
copy("brain/explorer/index.html", "knowledge/index.html"); tree("brain/explorer/js", "knowledge/js")
rewrite("knowledge/index.html", [('href="../../platform/css/platform.css"', 'href="../platform/css/platform.css"'), ('<link rel="icon" href="data:,">', '<link rel="icon" href="data:,">' + NOINDEX)])
rewrite("knowledge/js/app.js", [("'../../../platform/js/platform.js'", "'../../platform/js/platform.js'"), ("'../../../platform/js/plantcard.js'", "'../../platform/js/plantcard.js'")])
copy("brain/index.html", "knowledge/neural/index.html"); tree("brain/js", "knowledge/neural/js", shutil.ignore_patterns("app.js", "app3.js", "app4.js"))
rewrite("knowledge/neural/index.html", [
    ('"three": "./vendor/three/three.module.js", "three/addons/": "./vendor/three/examples/jsm/"', '"three": "../../vendor/three/three.module.js", "three/addons/": "../../vendor/three/examples/jsm/"'),
    ('src="./vendor/3d-force-graph.min.js"', 'src="../../vendor/3d-force-graph.min.js"'),
    ('href="../platform/css/platform.css"', 'href="../../platform/css/platform.css"'),
    ('<link rel="icon" href="data:,">', '<link rel="icon" href="data:,">' + NOINDEX),
])
rewrite("knowledge/neural/js/app5.js", [("'../../platform/js/platform.js'", "'../../../platform/js/platform.js'"), ("'../../platform/js/plantcard.js'", "'../../../platform/js/plantcard.js'")])
rewrite("knowledge/neural/js/graph.js", [("const HERE = '.';", "const HERE = '../..';"), ("const ROOT = '..';", "const ROOT = '../../data/db';")])
rewrite("knowledge/neural/js/data.js", [("const ROOT = '..';", "const ROOT = '../../data/db';")])

# ---------------------------------------------------------------- the one knowledge snapshot
for f in ("explorer.json", "graph.json", "diagnosis.json"): copy(f"brain/data/{f}", f"data/{f}")
copy("designs/demo-a.json", "data/designs/demo-a.json")
copy("designs/demo-c.json", "data/designs/demo-c.json")   # V4.2: the 8 × 6 m double-row example, written by the engine through ?script=v41&saveas=demo-c
for f in ("ontology.json", "schema.json", "sources.json", "synonyms.json", "intent_map.json", "relations.json", "eval/queries.json"): copy(f, f"data/db/{f}")
for s in slugs: copy(f"plants/{s}.json", f"data/db/plants/{s}.json")

open(J(OUT, "README.md"), "w", encoding="utf-8").write(f"""# Platform preview

Planting Intelligence as one platform: Design · Plants · Knowledge · About, built for review beside the production site.

- built from `{stamp}` by `tools/build_platform.py`
- one knowledge snapshot for every module: `data/explorer.json` (generated {ex['generated']}, schema {ex['schema_version']}, {len(slugs)} species, {ex['stats']['claims']} claims), with `data/graph.json`, `data/diagnosis.json` and the canonical files in `data/db/` from the same pipeline run
- `/` Garden Studio · `/plants/` Plant Library · `/knowledge/` Explorer (table · matrix · network) · `/knowledge/trace/` Decision Trace · `/knowledge/neural/` 3D network · `/about/` Project · `/about/how-it-works/` · `/about/method/` · `/about/contribute/` (the V1–V3 addresses `/explore/`, `/knowledge/research/`, `/knowledge/method/`, `/contribute/`, `/how-it-works/` redirect)
- the overview's reference case is `data/designs/demo-a.json`, a project the Studio saved; the page re-checks it with the engine against this snapshot
- illustrations: `platform/art/`, listed in `platform/data/artwork.json` — AI-generated editorial artwork, not evidence; names are set in HTML from the snapshot
- photographs: `platform/img/`, credited in `platform/data/images.json` (Wikimedia Commons, CC BY / CC BY-SA / CC0)
- the survey is a separate application and is only linked
- `/design/` and `/studio-preview/` are not touched by this folder; the preview saves its project under its own browser-storage key

Do not edit files here by hand: change the sources on the development branch and rebuild.
""")
n = sum(len(fs) for _, _, fs in os.walk(OUT)); size = sum(os.path.getsize(J(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
print(f"{os.path.relpath(OUT, ROOT) if OUT.startswith(ROOT) else OUT}: {n} files, {size / 1e6:.1f} MB — {stamp}")
