#!/usr/bin/env python3
"""
Tests for the integrated platform (M65): builds the preview folder with tools/build_platform.py, then checks it — statically,
and in headless Chrome through one browser profile, so that pages loaded one after another share saved state as they do for a user.

  python3 -m http.server 8766                              # any static server on the repository root
  python3 -I tools/platform_tests.py [--url http://localhost:8766] [--keep]     -> eval/platform-tests-<date>.md, exit 1 on any failure

  A  one snapshot      the build's projections come from one pipeline run; one explorer.json; no built file points outside the folder
  B  identities        the same ten species ids in the snapshot, plants/*.json, the graph, the photograph manifest
  C  no copied facts   the platform layer and the photograph manifest hold no plant fact (no species name in code, no fact keys)
  D  Plant Library     every species: a profile with its name, ten sections, 27 attribute rows, five function rows, photograph
                       credit, a link into the Explorer focused on it
  E  Explorer, Neural  every species: the Explorer focused from the Library's link shows the shared plant card with the way back;
                       the Neural view carries the platform bar and reads the same snapshot date
  F  journey           Studio (script=platform): considered species are checked per bed; an arrangement is chosen; the garden is
                       generated; a planted object is selected → Library: "Back to Grow", planted and considered are said →
                       Explorer: the same way back → Studio again: same stage, view, selected plant, arrangement, version
  G  no bypass         a considered species that fails a bed's checks is not planted, also when a bed's mix is forced to name it
  H  no design         in a fresh browser the Library offers to start a design and fabricates no bed

Standard library only; nothing is written except the report (and the temporary build, removed unless --keep).
"""
import html, json, os, re, shutil, subprocess, sys, tempfile
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = (sys.argv[sys.argv.index("--url") + 1] if "--url" in sys.argv else "http://localhost:8766").rstrip("/")
CHROME = next((c for c in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"] if os.path.exists(c)), None)
TODAY = date.today().isoformat(); DIR = "_platform_test"; OUT = os.path.join(ROOT, DIR); BASE = f"{URL}/{DIR}"
J = os.path.join; results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), str(detail)[:500])); return bool(ok)


def chrome(profile, path, budget=9000):
    r = subprocess.run([CHROME, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-first-run", "--hide-scrollbars", f"--user-data-dir={profile}", "--window-size=1440,900", f"--virtual-time-budget={budget}", "--dump-dom", BASE + path], capture_output=True, text=True, timeout=300)
    return r.stdout


text = lambda s: html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()
def first(dom, pattern): m = re.search(pattern, dom, re.S); return m.group(1) if m else None


# ---------------------------------------------------------------- build
b = subprocess.run([sys.executable, "-I", J(ROOT, "tools", "build_platform.py"), OUT], capture_output=True, text=True)
check("A1 build: the projections come from one pipeline run and the build completes", b.returncode == 0, (b.stdout + b.stderr).strip())
if b.returncode != 0: print(b.stdout, b.stderr); sys.exit(1)
ex = json.load(open(J(OUT, "data", "explorer.json"), encoding="utf-8")); slugs = sorted(s["slug"] for s in ex["species"])
found = [J(d, f) for d, _, fs in os.walk(OUT) for f in fs if f == "explorer.json"]
check("A2 one explorer.json in the build", len(found) == 1, [os.path.relpath(f, OUT) for f in found])
bad = []
for d, _, fs in os.walk(OUT):
    for f in fs:
        if not f.endswith((".html", ".js", ".css")) or "vendor" in d: continue
        rel = os.path.relpath(J(d, f), OUT); depth = rel.count(os.sep); s = open(J(d, f), encoding="utf-8").read()
        for m in re.finditer(r"""(?:href|src)=["'](\.\.?/[^"'#?]+)|(?:from|import\()\s*["'](\.\.?/[^"']+)["']|fetch\(\s*[`"'](\.\.?/[^`"'$]+)""", s):
            ref = next(g for g in m.groups() if g)
            if ref.endswith("/") or "${" in ref: continue
            tgt = os.path.normpath(J(os.path.dirname(rel), ref))
            if tgt.startswith("..") or not os.path.exists(J(OUT, tgt)):
                if f.endswith(".js") and not ref.endswith((".js", ".json", ".css")): continue   # a string in a message, not a load
                if f.endswith(".js") and re.search(r"/(tests|classic)\.html$|brain/|design/", ref): continue
                bad.append(f"{rel} → {ref}")
check("A3 every relative file a built page or module loads is inside the build", not bad, bad[:8])
st = ex["stats"]["inputs"]; gr = json.load(open(J(OUT, "data", "graph.json"), encoding="utf-8"))
check("A4 explorer, graph and kg share one generation date", ex["generated"] == gr["generated"] == st["kg_generated"], f"{ex['generated']} {gr['generated']} {st['kg_generated']}")

# ---------------------------------------------------------------- identities, no copied facts
man = json.load(open(J(OUT, "platform", "data", "images.json"), encoding="utf-8"))
gp = sorted(n["id"].replace("plant:", "") for n in gr["nodes"] if n.get("type") == "plant"); db = sorted(f[:-5] for f in os.listdir(J(OUT, "data", "db", "plants")))
check("B1 the same species in the snapshot, the graph and the canonical plant files", slugs == gp == db, f"{len(slugs)} / {len(gp)} / {len(db)}")
check("B2 every photograph belongs to a species of the snapshot and carries author, licence and source", set(man["images"]) <= set(slugs) and all(im.get("author") and im.get("licence") and im.get("source_url", "").startswith("https://commons.wikimedia.org/") for im in man["images"].values()), sorted(set(slugs) - set(man["images"])) or "all ten have a photograph")
check("B3 photograph licences are CC0, public domain, CC BY or CC BY-SA", all(re.match(r"^(CC0|Public domain|CC BY(-SA)? \d)", im["licence"]) for im in man["images"].values()), sorted({im["licence"] for im in man["images"].values()}))
allowed = {"file", "card", "width", "height", "title", "author", "licence", "licence_url", "source_url", "caption_at_source"}
check("C1 the photograph manifest holds presentation fields only", all(set(im) <= allowed for im in man["images"].values()), sorted({k for im in man["images"].values() for k in im} - allowed))
names = [s["scientific_name"] for s in ex["species"]] + [c for s in ex["species"] for c in s["common_names"][:1]]; leak = []
for f in sorted(os.listdir(J(ROOT, "platform", "js"))) + ["../css/platform.css"]:
    s = open(J(ROOT, "platform", "js", f), encoding="utf-8").read()
    leak += [f"{f}: {n}" for n in names if n in s]
check("C2 no species name is written in the platform layer's code", not leak, leak[:6])

if not CHROME:
    check("browser checks", False, "Chrome not found")
else:
    P = tempfile.mkdtemp(prefix="pi-platform-"); P2 = tempfile.mkdtemp(prefix="pi-fresh-")
    try:
        # ------------------------------------------------------------ H: no design in this browser
        dom = chrome(P2, "/plants/#species=gaultheria-shallon")
        box = text(first(dom, r'<div class="pi-consider"[^>]*>(.*?)</div>'))
        check("H1 without a design the Library offers to start one and names no bed", "Start a design" in box and "No design is in progress" in box and not re.search(r"bed-\d|North bed|East bed|West bed", dom), box[:200])
        check("H2 without a design no way-back chip is shown", 'class="pi-return"' not in dom)

        # ------------------------------------------------------------ D: ten profiles
        okD, det = True, []
        for s in ex["species"]:
            dom = chrome(P2, f"/plants/#species={s['slug']}", 7000)
            h1 = text(first(dom, r'<header class="pi-hero">.*?<h1>(.*?)</h1>')); secs = len(re.findall(r'<section class="pi-sec"', dom)); facts = len(re.findall(r'<div class="pi-fact[ "]', dom)); fns = len(re.findall(r'<div class="pi-fn (?:drawn|gap)"', dom))
            cells = sum(1 for a in ex["attributes"] if a["species"] == s["id"]); rec = len(re.findall(r'<div class="pi-fact">', dom)); rels = any(r["live"] and s["id"] in (r["a"], r["b"]) for r in ex["relations"])
            ok = h1 == s["scientific_name"] and secs == (10 if rels else 9) and facts == len(ex["facets"]) and rec == cells and fns == 5 and "via Wikimedia Commons" in dom and f'fi=plant%3A{s["slug"]}' in dom
            okD &= ok; det.append(f"{s['slug']}: {h1!r} sections {secs} rows {facts} recorded {rec}/{cells} functions {fns}{'' if ok else '  ✗'}")
        check(f"D1 {len(ex['species'])} profiles: name, sections, {len(ex['facets'])} attribute rows with the recorded ones matching the snapshot, 5 function rows, photo credit, Explorer link", okD, " | ".join(det))
        dom = chrome(P2, "/plants/")
        check("D2 the atlas shows one card per species, each linking to its profile", len(re.findall(r'<article class="pi-card"', dom)) == len(slugs) and all(f'#species={x}"' in dom for x in slugs))

        # ------------------------------------------------------------ E: Explorer and Neural
        okE, det = True, []
        for s in ex["species"]:
            dom = chrome(P2, f"/explore/#fk=species&fi=plant%3A{s['slug']}", 7000)
            ok = f'data-pi-mini="{s["slug"]}"' in dom and f'plants/#species={s["slug"]}' in dom and 'aria-current="page">Explore</a>' in dom
            okE &= ok; det.append(f"{s['slug']}{'' if ok else '  ✗'}")
        check("E1 the Explorer, opened on each species, shows the shared plant card with the link to its profile and the platform bar", okE, " ".join(det))
        dom = chrome(P2, "/explore/neural/#species=gaultheria-shallon", 20000)
        check("E2 the Neural view carries the platform bar and names the same snapshot date", 'class="pi-top pi-dark"' in dom and f"knowledge {ex['generated']}" in dom and "could not load" not in text(first(dom, r'<div id="err">(.*?)</div>') or ""), text(first(dom, r'<div id="stats">(.*?)</div>') or "")[:160])

        # ------------------------------------------------------------ F, G: the journey, one browser profile
        dom = chrome(P, "/?script=platform&consider=gaultheria-shallon,acer-palmatum,polystichum-munitum&select=gaultheria-shallon", 20000)
        raw = first(dom, r'<pre id="script-out"[^>]*>(.*?)</pre>'); out = json.loads(html.unescape(raw)) if raw else {}; k = out.get("platform", {})
        check("F1 the Studio replay ran to the end", bool(k) and not out.get("error"), (out.get("error") or "")[:300])
        if k:
            rows = [r for bed in k["beds"].values() for r in bed["considered"]]
            check("F2 Compose shows every considered species in every bed with that bed's check and a link to its profile", all(len(bed["considered"]) == 3 for bed in k["beds"].values()) and all(r["profile"] and "#species=" in r["profile"] and r["text"] for r in rows), f"{len(rows)} rows in {len(k['beds'])} beds")
            g = k["grow"]; planted = dict((a, n) for a, n in g["schedule"])
            check("F3 a real arrangement was chosen and Grow holds exactly the previewed plants", k["arrangement"]["stored_on_bed"] == {"pattern": "patches"} and g["stage"] == "garden" and g["preview_match"]["identical"] and g["plants"] == g["preview_match"]["compared"], f"{g['plants']} plants, {g['preview_match']}")
            check("F4 a planted object of the considered species is selected and its card links to the Library profile", g["selected"]["species"] == "plant:gaultheria-shallon" and g["card_species"] == "Gaultheria shallon" and "#species=gaultheria-shallon" in (g["profile_link"] or ""), g["selected"])
            acer = [r for r in rows if r["species"] == "plant:acer-palmatum"]
            check("G1 a species that fails a bed's checks is marked not planted, with the reason, and cannot be added", all(r["state"] == "fails" and not r["can_add"] and len(r["text"]) > 20 for r in acer) and "plant:acer-palmatum" not in planted, acer[0]["text"] if acer else "no row")
            check("G2 a considered species that qualifies can be added through the bed's own mix control, and is not added for the user", any(r["can_add"] for r in rows if r["species"] == "plant:polystichum-munitum") and "plant:polystichum-munitum" not in planted, [r["verdict"] for r in rows if r["species"] == "plant:polystichum-munitum"])
            f = k.get("forced") or {}
            check("G3 forcing a species that fails in every bed into two beds' mixes plants none of it, changes nothing else, and the beds are left as they were", f.get("mixes_named") == ["plant:acer-palmatum"] and f.get("planted_of_forced") == 0 and f.get("restored") is True and f.get("plants") == g["plants"], f)
            # the Library, in the same browser
            dom = chrome(P, "/plants/#species=gaultheria-shallon")
            chip = text(first(dom, r'<a class="pi-return"[^>]*>(.*?)</a>')); box = text(first(dom, r'<div class="pi-consider"[^>]*>(.*?)</div>')); mine = text(first(dom, r'<p class="pi-studio-d">(.*?)</p>'))
            check("F5 the Library knows the design: a way back to Grow, the species said to be considered and planted", chip == "Back to Grow" and "Being considered for your design" in box and "is planted" in mine, f"{chip!r} · {box[:90]!r} · {mine[:80]!r}")
            dom = chrome(P, "/explore/#fk=species&fi=plant%3Agaultheria-shallon")
            check("F6 the Explorer offers the same way back", text(first(dom, r'<a class="pi-return"[^>]*>(.*?)</a>')) == "Back to Grow")
            # and the Studio again, with no parameter: the saved design at the place it was left
            dom = chrome(P, "/", 12000)
            stage = first(dom, r'<body[^>]*data-stage="([a-z]+)"'); card = first(dom, r'(<div id="plantcard"[^>]*>.*?</div>\s*<div id="grow-overview")') or ""; mode = first(dom, r'<button[^>]*data-mode="(\w+)"[^>]*class="[^"]*\bon\b') or first(dom, r'<button[^>]*class="[^"]*\bon\b[^"]*"[^>]*data-mode="(\w+)"')
            check("F7 back in Design: Grow, the same view, the same plant selected", stage == "garden" and 'hidden=""' not in card[:60] and g["selected"]["id"] in card and "Gaultheria shallon" in text(card) and mode == g["mode"], f"stage {stage} · mode {mode} · card has {g['selected']['id']}: {g['selected']['id'] in card}")
            check("F8 the garden is the one that was generated", f"{g['plants']} plants" in text(dom), first(text(dom), r"(\d+ plants · \d+ species · \d+ beds)"))
    finally:
        shutil.rmtree(P, ignore_errors=True); shutil.rmtree(P2, ignore_errors=True)

if "--keep" not in sys.argv: shutil.rmtree(OUT, ignore_errors=True)
for f in ("platform-journey.json",):   # the design server, when it is the target, writes the replay's project: never keep it
    if os.path.exists(J(ROOT, "designs", f)): os.remove(J(ROOT, "designs", f))
passed = sum(1 for _, ok, _ in results if ok)
os.makedirs(J(ROOT, "eval"), exist_ok=True)
with open(J(ROOT, "eval", f"platform-tests-{TODAY}.md"), "w", encoding="utf-8") as fh:
    fh.write(f"# Platform tests — {TODAY}\n\n`python3 -I tools/platform_tests.py --url {URL}` · build of the working tree · knowledge snapshot {ex['generated']} · **{passed} / {len(results)} passed**\n\n| | check | detail |\n|---|---|---|\n")
    for name, ok, detail in results: fh.write(f"| {'ok' if ok else '**FAIL**'} | {name} | {str(detail).replace('|', '¦').replace(chr(10), ' ')} |\n")
for name, ok, detail in results: print(("[ok]  " if ok else "[FAIL]"), name, "" if ok else f"— {detail}")
print(f"{passed} / {len(results)} passed → eval/platform-tests-{TODAY}.md")
sys.exit(0 if passed == len(results) else 1)
