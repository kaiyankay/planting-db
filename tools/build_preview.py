#!/usr/bin/env python3
"""
Build a self-contained copy of the design studio for a static preview path on GitHub Pages (2026-11-14).

  python3 -I tools/build_preview.py [out-dir]        default out-dir: ./studio-preview

GitHub Pages serves the `main` branch, and the production site lives at /design/. A UX iteration that is not merged yet is
published beside it as /studio-preview/: this script copies design/ (page, styles, scripts, the vendored polygon library),
the knowledge projection (brain/data/explorer.json) and the three.js files the 3D garden imports into one folder and rewrites
the three paths that pointed outside design/. Nothing in the folder depends on any other path of the repository except two
footer links (the Plant Knowledge Explorer and the classic workspace, both on the production site).

The preview keeps its own saved project in the browser (js/model.js picks the storage key from the folder name), so it never
opens or overwrites a project saved by the production site on the same origin. No server is involved: language is read by the
offline rules, exactly as on the production site.

Standard library only.
"""
import os, shutil, subprocess, sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, "studio-preview")
J = os.path.join


def git(*a):
    try: return subprocess.run(["git", "-C", ROOT, *a], capture_output=True, text=True).stdout.strip()
    except Exception: return ""


def rewrite(path, pairs):
    s = open(path, encoding="utf-8").read()
    for old, new in pairs:
        if s.count(old) != 1: sys.exit(f"build_preview: expected exactly one “{old[:60]}” in {os.path.relpath(path, OUT)}, found {s.count(old)}")
        s = s.replace(old, new)
    open(path, "w", encoding="utf-8").write(s)


if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(OUT)
shutil.copy2(J(ROOT, "design", "index.html"), J(OUT, "index.html"))
shutil.copytree(J(ROOT, "design", "css"), J(OUT, "css"))
shutil.copytree(J(ROOT, "design", "js"), J(OUT, "js"), ignore=shutil.ignore_patterns("app-classic.js", "tests.js"))
shutil.copytree(J(ROOT, "design", "vendor"), J(OUT, "vendor"))
os.makedirs(J(OUT, "data")); shutil.copy2(J(ROOT, "brain", "data", "explorer.json"), J(OUT, "data", "explorer.json"))
T = J(ROOT, "brain", "vendor", "three"); os.makedirs(J(OUT, "vendor", "three", "examples", "jsm", "controls"))
for f in ["three.module.js", "three.core.js", "VERSION"]:
    if os.path.exists(J(T, f)): shutil.copy2(J(T, f), J(OUT, "vendor", "three", f))
shutil.copy2(J(T, "examples", "jsm", "controls", "OrbitControls.js"), J(OUT, "vendor", "three", "examples", "jsm", "controls", "OrbitControls.js"))
for f in os.listdir(T):
    if f.upper().startswith("LICENSE"): shutil.copy2(J(T, f), J(OUT, "vendor", "three", f))

commit = git("rev-parse", "--short", "HEAD") or "unknown"; branch = git("rev-parse", "--abbrev-ref", "HEAD") or "unknown"
dirty = "+local changes" if git("status", "--porcelain", "--", "design", "brain/data/explorer.json") else ""
stamp = f"{branch} @ {commit}{dirty} · built {date.today().isoformat()}"
rewrite(J(OUT, "index.html"), [
    ('"three": "../brain/vendor/three/three.module.js", "three/addons/": "../brain/vendor/three/examples/jsm/"', '"three": "./vendor/three/three.module.js", "three/addons/": "./vendor/three/examples/jsm/"'),
    ('<a href="./classic.html">Classic workspace</a><a href="./tests.html">Engine tests</a>', f'<a href="../design/">Production site</a><span>Studio preview · {stamp}</span>'),
    ('<title>Planting Intelligence — imagine your garden</title>', '<title>Planting Intelligence — studio preview</title>\n<meta name="robots" content="noindex">'),
])
rewrite(J(OUT, "js", "app.js"), [("'../brain/data/explorer.json'", "'./data/explorer.json'")])
open(J(OUT, "README.md"), "w", encoding="utf-8").write(f"""# Studio preview

A self-contained static build of the design studio, published for review beside the production site.

- built from `{stamp}` by `tools/build_preview.py`
- production site: `/design/` (unchanged by this folder)
- everything the page loads is inside this folder: `index.html`, `css/`, `js/`, `vendor/` (polygon-clipping, three.js), `data/explorer.json`
- no server: language is read by the offline rules; the address lookup calls OpenStreetMap Nominatim from the browser
- the preview saves its project under its own browser-storage key, apart from the production site's

Do not edit files here by hand: change `design/` on the development branch and rebuild.
""")
n = sum(len(fs) for _, _, fs in os.walk(OUT)); size = sum(os.path.getsize(J(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
print(f"{os.path.relpath(OUT, ROOT) if OUT.startswith(ROOT) else OUT}: {n} files, {size / 1e6:.1f} MB — {stamp}")
