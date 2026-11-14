#!/usr/bin/env python3
"""
Build the integrated platform as one self-contained static folder for GitHub Pages (2026-11-14, M65).

  python3 -I tools/build_platform.py [out-dir]        default out-dir: ./platform-preview

GitHub Pages serves `main`; the platform is developed on a branch. This script copies every public module from the working tree
into one folder, in the layout the platform ships with, and rewrites the paths that differ from the repository layout:

  <out>/                    Design      the Garden Studio (design/)               Imagine → Shape → Compose → Grow
  <out>/plants/             Plants      the Plant Library (platform/plants/)
  <out>/explore/            Explore     the Knowledge Explorer (brain/explorer/)
  <out>/explore/neural/     Explore     the Neural view (brain/index.html + brain/js/)
  <out>/contribute/         Contribute  (platform/contribute/)
  <out>/how-it-works/                   (platform/how-it-works/)
  <out>/platform/           the platform layer: css, js, photograph credits and photographs
  <out>/data/               ONE knowledge snapshot for all of the above, copied from this working tree:
                              explorer.json                          Studio · Library · Explorer · Contribute · How it works
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

if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(OUT)

# ---------------------------------------------------------------- Design (the Studio is the platform's front door)
copy("design/index.html", "index.html")
tree("design/css", "css"); tree("design/js", "js", shutil.ignore_patterns("app-classic.js", "tests.js")); tree("design/vendor", "vendor")
tree("brain/vendor/three", "vendor/three"); copy("brain/vendor/3d-force-graph.min.js", "vendor/3d-force-graph.min.js")

commit = git("rev-parse", "--short", "HEAD") or "unknown"; branch = git("rev-parse", "--abbrev-ref", "HEAD") or "unknown"
dirty = "+local changes" if git("status", "--porcelain", "--", "design", "platform", "brain/explorer", "brain/js", "brain/index.html", "brain/data", "plants", "ontology.json", "relations.json", "sources.json") else ""
stamp = f"{branch} @ {commit}{dirty} · built {date.today().isoformat()} · knowledge {ex['generated']}"
NOINDEX = '\n<meta name="robots" content="noindex">'
rewrite("index.html", [
    ('"three": "../brain/vendor/three/three.module.js", "three/addons/": "../brain/vendor/three/examples/jsm/"', '"three": "./vendor/three/three.module.js", "three/addons/": "./vendor/three/examples/jsm/"'),
    ('href="../platform/css/platform.css"', 'href="./platform/css/platform.css"'),
    ('<a href="./classic.html">Classic workspace</a><a href="./tests.html">Engine tests</a>', f'<span>Platform preview · {stamp}</span>'),
    ('<title>Planting Intelligence — imagine your garden</title>', '<title>Planting Intelligence — platform preview</title>' + NOINDEX),
])
rewrite("js/app.js", [("'../brain/data/explorer.json'", "'./data/explorer.json'"), ("'../../platform/js/platform.js'", "'../platform/js/platform.js'"), ("'../../platform/js/plantcard.js'", "'../platform/js/plantcard.js'")])

# ---------------------------------------------------------------- the platform layer and its pages
tree("platform/css", "platform/css"); tree("platform/js", "platform/js"); tree("platform/data", "platform/data"); tree("platform/img", "platform/img")
rewrite("platform/js/platform.js", [("const LAYOUT = 'repo';", "const LAYOUT = 'preview';")])
for page, script in (("plants", "library.js"), ("contribute", "contribute.js"), ("how-it-works", "how.js")):
    copy(f"platform/{page}/index.html", f"{page}/index.html")
    rewrite(f"{page}/index.html", [('href="../css/platform.css"', 'href="../platform/css/platform.css"'), (f'src="../js/{script}"', f'src="../platform/js/{script}"'), ('<link rel="icon" href="data:,">', '<link rel="icon" href="data:,">' + NOINDEX)])

# ---------------------------------------------------------------- Explore: the Knowledge Explorer and the Neural view
copy("brain/explorer/index.html", "explore/index.html"); tree("brain/explorer/js", "explore/js")
rewrite("explore/index.html", [('href="../../platform/css/platform.css"', 'href="../platform/css/platform.css"'), ('<link rel="icon" href="data:,">', '<link rel="icon" href="data:,">' + NOINDEX)])
rewrite("explore/js/app.js", [("'../../../platform/js/platform.js'", "'../../platform/js/platform.js'"), ("'../../../platform/js/plantcard.js'", "'../../platform/js/plantcard.js'")])
copy("brain/index.html", "explore/neural/index.html"); tree("brain/js", "explore/neural/js", shutil.ignore_patterns("app.js", "app3.js", "app4.js"))
rewrite("explore/neural/index.html", [
    ('"three": "./vendor/three/three.module.js", "three/addons/": "./vendor/three/examples/jsm/"', '"three": "../../vendor/three/three.module.js", "three/addons/": "../../vendor/three/examples/jsm/"'),
    ('src="./vendor/3d-force-graph.min.js"', 'src="../../vendor/3d-force-graph.min.js"'),
    ('href="../platform/css/platform.css"', 'href="../../platform/css/platform.css"'),
    ('<link rel="icon" href="data:,">', '<link rel="icon" href="data:,">' + NOINDEX),
])
rewrite("explore/neural/js/app5.js", [("'../../platform/js/platform.js'", "'../../../platform/js/platform.js'"), ("'../../platform/js/plantcard.js'", "'../../../platform/js/plantcard.js'")])
rewrite("explore/neural/js/graph.js", [("const HERE = '.';", "const HERE = '../..';"), ("const ROOT = '..';", "const ROOT = '../../data/db';")])
rewrite("explore/neural/js/data.js", [("const ROOT = '..';", "const ROOT = '../../data/db';")])

# ---------------------------------------------------------------- the one knowledge snapshot
for f in ("explorer.json", "graph.json", "diagnosis.json"): copy(f"brain/data/{f}", f"data/{f}")
for f in ("ontology.json", "schema.json", "sources.json", "synonyms.json", "intent_map.json", "relations.json", "eval/queries.json"): copy(f, f"data/db/{f}")
for s in slugs: copy(f"plants/{s}.json", f"data/db/plants/{s}.json")

open(J(OUT, "README.md"), "w", encoding="utf-8").write(f"""# Platform preview

Planting Intelligence as one platform: Design · Plants · Explore · Contribute, built for review beside the production site.

- built from `{stamp}` by `tools/build_platform.py`
- one knowledge snapshot for every module: `data/explorer.json` (generated {ex['generated']}, schema {ex['schema_version']}, {len(slugs)} species, {ex['stats']['claims']} claims), with `data/graph.json`, `data/diagnosis.json` and the canonical files in `data/db/` from the same pipeline run
- `/` Garden Studio · `/plants/` Plant Library · `/explore/` Knowledge Explorer · `/explore/neural/` Neural view · `/contribute/` · `/how-it-works/`
- photographs: `platform/img/`, credited in `platform/data/images.json` (Wikimedia Commons, CC BY / CC BY-SA / CC0)
- the survey is a separate application and is only linked
- `/design/` and `/studio-preview/` are not touched by this folder; the preview saves its project under its own browser-storage key

Do not edit files here by hand: change the sources on the development branch and rebuild.
""")
n = sum(len(fs) for _, _, fs in os.walk(OUT)); size = sum(os.path.getsize(J(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
print(f"{os.path.relpath(OUT, ROOT) if OUT.startswith(ROOT) else OUT}: {n} files, {size / 1e6:.1f} MB — {stamp}")
