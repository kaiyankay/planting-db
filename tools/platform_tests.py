#!/usr/bin/env python3
"""
Tests for the integrated platform (M65, V2 M66): builds the preview folder with tools/build_platform.py, then checks it — statically,
and in headless Chrome through one browser profile, so that pages loaded one after another share saved state as they do for a user.

  python3 -m http.server 8766                              # any static server on the repository root
  python3 -I tools/platform_tests.py [--url http://localhost:8766] [--keep]     -> eval/platform-tests-<date>.md, exit 1 on any failure

  A  one snapshot      the build's projections come from one pipeline run; one explorer.json; no built file points outside the folder
  B  identities        the same ten species ids in the snapshot, plants/*.json, the graph, the photograph and illustration manifests
  C  no copied facts   the platform layer and the two image manifests hold no plant fact (no species name in code, no fact keys)
  D  Plant Library     every species: a profile with its name in HTML over its illustration (said to be AI-generated), ten sections,
                       27 attribute rows, five function rows, the credited reference photograph, links into the Explorer and the trace
  E  Explorer, Neural  every species: the Explorer focused from the Library's link shows the shared plant card with the way back;
                       the Neural view carries the platform bar and reads the same snapshot date
  N  navigation        Design · Plants · Knowledge · About on every page; a second level only inside About; the V1
                       addresses /contribute/ and /how-it-works/ arrive in Research and Method
  T  decision trace    the universal trace (V3): the functions it follows are exactly the engine's arranged ones; Ground Cover is traced
                       with the engine's pattern, plant objects and estimate, no pass mark invented; every species' outcome equals what
                       the recorded picks and plant objects give; a recorded-only function shows no selection, arrangement or verdict
  J  journeys          from an actual design (Studio replay ?script=trace): A a Screen plant in Grow → compact explanation → full trace of
                       the same version and object → back with the state kept; B Ground Cover: two engine arrangements, generate, trace,
                       change the pattern, generate, the trace follows the new version; C considered species: distinct outcomes that
                       agree between Compose, the full trace and the engine
  K  evidence trace    the Knowledge overview: five steps on the Studio's recorded demonstration garden; the species, plant count and
                       verdict are the recorded design's; the source excerpt, claim, verification, AI assessment and link are the
                       snapshot's; the per-species results equal the engine's recorded ones (recomputed on the page); every species
                       can be followed; a species with no Screen link is shown as an explicit unknown
  AB about             the four About pages; figures equal the snapshot; the seven method steps by name and order; the coverage grid has
                       species × fields squares; the worked examples are the reference garden's; no respondent id, no private field
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
    return r.stdout.replace('<wbr>', '')   # record ids carry optional line-break points; the checks compare the ids themselves


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
art = json.load(open(J(OUT, "platform", "data", "artwork.json"), encoding="utf-8"))
check("B4 every illustration belongs to a species of the snapshot, exists in the build, and the manifest says it is AI-generated artwork", set(art["images"]) <= set(slugs) and all(os.path.exists(J(OUT, "platform", "art", im["file"])) for im in art["images"].values()) and "AI-generated" in art["kind"] and "not evidence" in art["about"], sorted(set(slugs) - set(art["images"])) or f"all {len(slugs)} have an illustration")
check("C3 the illustration manifest holds a file, its size and the lettering flag only, and no illustration carries lettering", all(set(im) <= {"file", "width", "height", "lettering"} and im.get("lettering") is False for im in art["images"].values()), sorted({k for im in art["images"].values() for k in im}))
names = [s["scientific_name"] for s in ex["species"]] + [c for s in ex["species"] for c in s["common_names"][:1]]; leak = []
for f in sorted(os.listdir(J(ROOT, "platform", "js"))) + ["../css/platform.css"]:
    s = open(J(ROOT, "platform", "js", f), encoding="utf-8").read()
    leak += [f"{f}: {n}" for n in names if n in s]
check("C2 no species name is written in the platform layer's code", not leak, leak[:6])
# V4.1 brand-type trial: opt-in only. The font ships as WOFF2, no page loads it by default, and the trial never touches text or record type.
_wf = J(OUT, "platform", "fonts", "nct127-Regular.woff2"); _tc = open(J(OUT, "platform", "css", "type-trial.css"), encoding="utf-8").read()
check("TY1 the trial typeface ships as one WOFF2 file inside the build", os.path.exists(_wf) and open(_wf, "rb").read(4) == b"wOF2", _wf)
_users = sorted(os.path.relpath(J(d, f), OUT) for d, _, fs in os.walk(OUT) for f in fs if f.endswith((".html", ".css")) and "nct127" in open(J(d, f), encoding="utf-8", errors="ignore").read())
check("TY2 one stylesheet names the brand typeface (type-trial.css); no page hard-codes it", _users == ["platform/css/type-trial.css"], _users)
check("TY3 the trial changes display type only: it sets no text or record family, and forbids synthesised weights and styles", not re.search(r"--(pi-)?(sans|mono|display)\s*:", _tc) and "font-synthesis: none" in _tc and "font-weight: 100 900" in _tc)
_pj = open(J(OUT, "platform", "js", "platform.js"), encoding="utf-8").read()
check("TY4 the V4.2 type system is the default, ?type=v4|a|c is a tab-only choice (sessionStorage), the comparison switch mounts only on a page opened with ?type=, and the comparison page is in the build", "TYPE_DEFAULT = 'v4'" in _pj and "sessionStorage.removeItem('pi.type')" in _pj and "if (asked === null || framed" in _pj and os.path.exists(J(OUT, "about", "type-trial", "index.html")))
check("TY5 no page puts the knowledge-snapshot date in the top bar", 'class="pi-snap"' not in _pj)

LINK = {(l["species"], l["function"]): l for l in ex["function_links"]}; SLUG = {s["slug"]: s["id"] for s in ex["species"]}
def page_rows(dom):
    """species id -> (outcome, fit) as the trace page prints them in its per-species tables"""
    return {SLUG[a]: (b, c) for a, b, c in re.findall(r'<tr[^>]*data-species="([\w-]+)" data-outcome="(\w+)" data-fit="(\w*)"', dom)}
def expected(v, bed_id, fn):
    """the outcome of every species for a bed and a function, from a recorded version alone: its picks, its candidates' checks, its plant objects"""
    role = {"z:screen": "screen", "z:ground_cover": "ground"}[fn]; a = v["assemblages"][bed_id]; objs = [o for o in v["plant_objects"] if o["bed_id"] == bed_id]
    in_role = (lambda o: o["role"].startswith("screen")) if role == "screen" else (lambda o: o["role"] == "ground")
    picks = {r: [x["id"] for x in a["picks"].get(r, [])] for r in ("screen", "ground", "accent")}; cands = {c["id"]: c for c in a["candidates"].get(role, [])}; out = {}
    for sp in ex["species"]:
        sid = sp["id"]; c = cands.get(sid)
        if fn not in a["wanted"]: out[sid] = "not_asked"
        elif sid in picks[role]: out[sid] = "planted" if any(o["species_id"] == sid and in_role(o) for o in objs) else "not_placed"
        elif not c: out[sid] = "other_role" if any(sid in picks[r] for r in picks if r != role) else "unknown"
        elif c["fit"] != "fails": out[sid] = "eligible"
        elif c["checks"]["evidence"]["result"] == "fails" and LINK[(sid, fn)].get("verdict") == "evidence missing": out[sid] = "unknown"
        else: out[sid] = "excluded"
    return out


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
            h1 = text(first(dom, r'<header class="pi-hero">.*?<h1>(.*?)</h1>')); secs = len(re.findall(r'<section class="pi-sec"', dom)); facts = len(re.findall(r'<(?:details|div) class="pi-fact[ "]', dom)); fns = len(re.findall(r'<details class="pi-fn (?:drawn|gap)"', dom))
            cells = sum(1 for a in ex["attributes"] if a["species"] == s["id"]); rec = len(re.findall(r'<details class="pi-fact"', dom)); rels = any(r["live"] and s["id"] in (r["a"], r["b"]) for r in ex["relations"])
            hero = first(dom, r'<header class="pi-hero">(.*?)</header>') or ""; plate = first(hero, r'<figure class="pi-fig pi-art">(.*?)</figure>') or ""
            cited = {c for a in ex["attributes"] if a["species"] == s["id"] for c in a["claims"]}; shown = set(re.findall(r'data-claim="([^"]+)"', dom)); tabs = re.findall(r'<a role="tab" id="tabbtn-(\w+)"', dom)
            ok = h1 == s["common_names"][0] and secs == (12 if rels else 11) and facts == len(ex["facets"]) and rec == cells and fns == 5 and "via Wikimedia Commons" in dom and f'fi=plant%3A{s["slug"]}' in dom
            ok = ok and f'platform/art/{s["slug"]}.webp' in plate and "AI-generated" in text(plate) and "Reference photograph" in (first(dom, r'<div class="pi-panel" id="tab-evidence"(.*?)<div class="pi-panel" id="tab-unknown"') or "") and s["scientific_name"] in text(first(hero, r'<p class="pi-names">(.*?)</p>') or "") and f'knowledge/trace/#species={s["slug"]}' in dom
            # V4.1: the credited photograph is one click from the first viewport (a button beside the plate, a dialog with photographer,
            # licence and source); quick facts name a disagreement and link to the per-source row instead of merging it
            im = man["images"][s["slug"]]; btn = first(hero, r'(<button type="button" class="pi-refbtn" data-refphoto.*?</button>)') or ""; dlg = first(dom, r'<dialog class="pi-refdlg" data-refdialog[^>]*>(.*?)</dialog>') or ""; glance = first(hero, r'<dl class="pi-glance">(.*?)</dl>') or ""
            dis = [a["facet"] for a in ex["attributes"] if a["species"] == s["id"] and a["facet"] in ("exposure", "water", "soil") and a["disagreement"]]
            ok = ok and "View reference photo" in text(btn) and im["author"] in text(btn) and all(html.escape(im[k], quote=True) in dlg for k in ("author", "licence", "source_url")) and "no claim on this page is read from it" in text(dlg) and "not verified by this project" in text(dlg)
            ok = ok and [text(x) for x in re.findall(r"<dt>(.*?)</dt>", glance)] == ["Growth form", "Size", "Spatial function", "Light", "Water", "Soil"] and all(f'data-differ="{f}"' in glance and f"&amp;tab=growth&amp;open={f}" in glance for f in dis) and not any(f'data-differ="{f}"' in glance for f in ("exposure", "water", "soil") if f not in dis) and 'data-differ="origin"' in hero
            ok = ok and tabs == ["design", "growth", "evidence", "unknown"] and {html.unescape(x) for x in shown} >= cited and len(re.findall(r'<div class="pi-panel" id="tab-\w+"[^>]* hidden', dom)) == 3
            okD &= ok; det.append(f"{s['slug']}: {h1!r} sections {secs} rows {facts} recorded {rec}/{cells} functions {fns}{'' if ok else '  ✗'}")
        check(f"D1 {len(ex['species'])} profiles: names in HTML, illustration plate said to be AI-generated, a View reference photo button in the first viewport opening a dialog with photographer, licence and source, six quick facts that link every disagreeing site field to its per-source row, four tabs (one open), reference photograph with credit under Evidence, {len(ex['facets'])} attribute rows matching the snapshot with every cited claim on the page, 5 function rows, Explorer and trace links", okD, " | ".join(det))
        dom = chrome(P2, "/plants/"); cards = re.findall(r'<article class="pi-card".*?</article>', dom, re.S)
        check("D2 the atlas shows one card per species: its illustration on the shared plate, then the common and scientific name set in HTML, linking to its profile", len(cards) == len(slugs) and all(f'#species={x}"' in dom for x in slugs) and all(any(f'platform/art/{s["slug"]}.webp' in c and f'<h3>{html.escape(s["common_names"][0], quote=False)}</h3>' in c and f'<p class="pi-card-sci"><i>{s["scientific_name"]}</i></p>' in c and '<span class="pi-plate">' in c for c in cards) for s in ex["species"]) and "AI-generated editorial artwork" in text(first(dom, r'<p class="lib-art">(.*?)</p>') or ""))
        # V4.1: a quiet card — two lines, no caption sentence, no "Read more"; growth form and origin stay reachable (reveal, filter, profile)
        lines = lambda c: len(re.findall(r"<(?:h3|p)[ >]", c.split("</span></span>")[-1])); OL = {s["id"]: next((v["label"] for a in ex["attributes"] if a["species"] == s["id"] and a["facet"] == "origin" for v in a["values"] if v.get("entity")), None) for s in ex["species"]}
        check("D3 an atlas card prints two lines (common name, scientific name) and nothing else: no caption sentence, no Read more; the recorded growth form and origin are in the hover/focus reveal and the link's label, never shortened to a badge",
              len(cards) == len(slugs) and all(lines(c) == 2 and "pi-card-meta" not in c and "Read more" not in c and "pi-card-form" not in c for c in cards) and all(any(f'data-species="{s["slug"]}"' in c and f'<span class="pi-card-reveal" aria-hidden="true">{html.escape(s["growth_form_label"])} · ' in c and (not OL[s["id"]] or html.escape(OL[s["id"]]) in first(c, r'<span class="pi-card-reveal"[^>]*>(.*?)</span>')) for c in cards) for s in ex["species"]), f"lines {sorted({lines(c) for c in cards})}")
        nat = sorted({s["origin_status"] for s in ex["species"]}); chips = re.findall(r'<a class="pi-chip" role="button" data-origin="([\w-]+)" aria-pressed="(true|false)"[^>]*>(.*?)</a>', dom); o0 = nat[0]; dom_o = chrome(P2, f"/plants/#origin={o0}"); shown_o = re.findall(r'<article class="pi-card[^"]*" data-species="([\w-]+)"', dom_o)
        check("D4 origin is a filter of the atlas: one chip per recorded origin status with its species count; choosing one shows exactly those species", sorted(c[0] for c in chips) == nat and all(text(c[2]).endswith(str(sum(1 for s in ex["species"] if s["origin_status"] == c[0]))) for c in chips) and sorted(shown_o) == sorted(s["slug"] for s in ex["species"] if s["origin_status"] == o0), f"{[c[0] for c in chips]} · {o0}: {len(shown_o)} shown")
        dom3 = chrome(P2, "/plants/?card=3"); cards3 = re.findall(r'<article class="pi-card three".*?</article>', dom3, re.S)
        check("D5 the ?card=3 comparison adds one growth-form word, the last word of the recorded growth-form label, and nothing else", len(cards3) == len(slugs) and all(any(f'data-species="{s["slug"]}"' in c and f'<p class="pi-card-form">{s["growth_form_label"].split()[-1].capitalize()}</p>' in c and lines(c) == 3 for c in cards3) for s in ex["species"]))

        # ------------------------------------------------------------ E: Knowledge — the Explorer (Table | Matrix | Network), the 3D network, the V1–V3 addresses
        okE, det = True, []
        for s in ex["species"]:
            dom = chrome(P2, f"/knowledge/#fk=species&fi=plant%3A{s['slug']}", 7000)
            ok = f'data-pi-mini="{s["slug"]}"' in dom and f'plants/#species={s["slug"]}' in dom and 'aria-current="page">Knowledge</a>' in dom and 'class="pi-subnav"' not in dom and re.search(rf'<a class="trace" id="trace" href="[^"]*knowledge/trace/#species={s["slug"]}"', dom) is not None
            okE &= ok; det.append(f"{s['slug']}{'' if ok else '  ✗'}")
        check("E1 Knowledge, opened on each species, shows the shared plant card with the link to its profile, the platform bar without a second level, and the Trace action for that species", okE, " ".join(det))
        dom = chrome(P2, "/knowledge/neural/#species=gaultheria-shallon", 20000); sw = first(dom, r'<div class="pi-switch"[^>]*>(.*?)</div>') or ""
        check("E2 the 3D network carries the platform bar (no snapshot date in it since V4.3), and its switch leads back to the Table, the Matrix and the Network with the species in focus", 'class="pi-top pi-dark"' in dom and 'class="pi-snap"' not in dom and "could not load" not in text(first(dom, r'<div id="err">(.*?)</div>') or "") and re.findall(r">([^<]+)</a>", sw) == ["Table", "Matrix", "Network", "3D"] and sw.count("fi=plant%3Agaultheria-shallon") == 3 and all(f"v={v}" in sw for v in ("table", "matrix", "graph")), text(first(dom, r'<div id="stats">(.*?)</div>') or "")[:160])
        dom = chrome(P2, "/knowledge/", 7000); sw = re.findall(r'<button data-view="(\w+)" aria-pressed="(true|false)"', first(dom, r'<div id="views"[^>]*>(.*?)</div>') or "")
        check("E3 Knowledge opens on the Explorer, not on an essay (V4.1): the Network | Matrix | Table switch with the Network of every species on screen", sw == [("graph", "true"), ("matrix", "false"), ("table", "false")] and len(re.findall(r'<g class="node species', dom)) == len(ex["species"]) and 'class="pi-mast"' not in dom, str(sw))
        old = {"/explore/#fk=function&fi=z%3Ascreen&v=matrix": ('class="matrix ', "/knowledge/"), "/knowledge/#species=gaultheria-shallon": ('class="pi-doc kn"', "/knowledge/trace/"), "/explore/neural/#species=gaultheria-shallon": ('class="pi-top pi-dark"', "/knowledge/neural/")}; okO, det = True, []
        for path, (mark, to) in old.items():
            dom = chrome(P2, path, 16000); ok = mark in dom; okO &= ok; det.append(f"{path} → {to}{'' if ok else '  ✗'}")
        check("E4 the V1–V3 addresses still arrive with their hash: /explore/ at the Explorer, a trace hash at /knowledge/ at the Decision Trace, /explore/neural/ at the 3D network", okO, " ".join(det))

        # ------------------------------------------------------------ N: navigation
        pages = {"/plants/": "Plants", "/knowledge/": "Knowledge", "/knowledge/trace/": "Knowledge", "/about/": "About"}; okN, det = True, []
        for path, dest in pages.items():
            dom = chrome(P2, path, 7000); nav = first(dom, r'<nav class="pi-nav"[^>]*>(.*?)</nav>') or ""; sub = first(dom, r'<nav class="pi-subnav"[^>]*>(.*?)</nav>') or ""
            ok = re.findall(r">([^<]+)</a>", nav) == ["Design", "Plants", "Knowledge", "About"] and f'aria-current="page">{dest}</a>' in nav and (bool(sub) == (dest == "About"))
            okN = okN and ok; det.append(f"{path}:{'ok' if ok else 'FAIL'}")
        check("N1 Design · Plants · Knowledge · About on every page, the current one marked; a second level only inside About", okN, " ".join(det))
        old = {"/contribute/": "contribute", "/how-it-works/": "how", "/knowledge/research/": "method", "/knowledge/method/": "method"}; got = {k: first(chrome(P2, k, 9000), r'<body[^>]*data-about="([a-z]+)"') for k in old}
        check("N2 the V1–V3 addresses of Contribute, How it works, Research and Method arrive on the About pages", got == old, got)

        # ------------------------------------------------------------ AB: About (Project · How it works · Research & Method · Contribute & Future)
        STEPS = ["Local Data Extraction", "Data Integration & Structured Claims", "Data Validation & Verification", "Survey Analysis & Knowledge Requirements", "Professional Plant Knowledge Enrichment", "Planting Design Knowledge Integration", "Multimodal Knowledge Graph Construction"]
        ABOUT = {"/about/": "Project", "/about/how-it-works/": "How it works", "/about/method/": "Research & Method", "/about/contribute/": "Contribute & Future", "/about/data/": "Sources & data"}; AD = {k: chrome(P2, k, 12000) for k in ABOUT}; stt = ex["stats"]
        main = lambda dom: first(dom, r"<main[^>]*>(.*?)</main>") or ""; okA, det = True, []
        for path, cur in ABOUT.items():
            dom = AD[path]; nav = first(dom, r'<nav class="pi-nav"[^>]*>(.*?)</nav>') or ""; sub = first(dom, r'<nav class="pi-subnav"[^>]*>(.*?)</nav>') or ""
            ok = [text(x) for x in re.findall(r">([^<]+)</a>", nav)] == ["Design", "Plants", "Knowledge", "About"] and 'aria-current="page">About</a>' in nav and [text(x) for x in re.findall(r">([^<]+)</a>", sub)] == list(ABOUT.values()) and text(first(sub, r'aria-current="page">([^<]+)</a>') or "") == cur and bool(first(main(dom), r"<h1>(.*?)</h1>")) and 'class="pi-loading"' not in main(dom)
            okA &= ok; det.append(f"{path}{'' if ok else '  ✗'}")
        check("AB1 the five About pages (V4.2 adds Sources & data) render with Design · Plants · Knowledge · About and the About sub-navigation, the current page marked", okA, " ".join(det))
        dom = AD["/about/data/"]; figs = [text(x) for x in re.findall(r"<dd>(.*?)</dd>", first(dom, r'<dl class="ab-figs"[^>]*>(.*?)</dl>') or "")]
        check("AB2 Sources & data (V4.2: moved from Project): the figures of the release are the snapshot's (species, claims, verified, fields in disagreement)", figs == [str(stt["species"]), str(stt["claims"]), f"{stt['claims_by_status'].get('verified', 0)} / {stt['claims']}", f"{stt['cells_with_disagreement']} / {stt['attribute_cells']}"], figs)
        dom = AD["/about/method/"]; names = [text(re.sub(r'<span class="sr">.*?</span>', "", x)) for x in re.findall(r'<li class="ab-step[^"]*" id="step-\d">.*?<h3>(.*?)</h3>', dom, re.S)]
        check("AB3 Research & Method: the seven steps, with their canonical names in order, and no eighth", names == STEPS, names)
        sq = re.findall(r'<(?:a|span) class="(rec|dis|no)"', first(AD["/about/data/"], r'<table class="ab-grid"[^>]*>(.*?)</table>') or "")
        check("AB4 Sources & data (V4.2: moved from Research & Method): the coverage grid has one square per species and field, and its counts are the snapshot's", len(sq) == len(ex["species"]) * len(ex["facets"]) and sq.count("rec") + sq.count("dis") == stt["attribute_cells"] and sq.count("dis") == stt["cells_with_disagreement"] and sq.count("no") == stt["cells_not_recorded"], f"{len(sq)} squares: {sq.count('rec')} recorded, {sq.count('dis')} in disagreement, {sq.count('no')} not recorded")
        led = re.findall(r'<div class="pi-led"><dt>(.*?)</dt>', first(dom, r'<section class="ab-sec[^"]*" id="kinds">(.*?)</section>') or ""); sal = LINK[("plant:gaultheria-shallon", "z:screen")]; scl = sal["use_claims"][0]
        check("AB5 Research & Method: the eight kinds of statement, every knowledge-graph rule of the release, the pipeline named apart from the method, and the walkthrough item is the snapshot's own claim with its status and AI assessment", len(led) == 8 and all(f"<b>{r}</b>" in dom for r in ex["rules"] if not re.match(r"M4\d$", r)) and "tools/pipeline.py" in dom and html.escape(scl, quote=False) in dom and f'class="pi-tag {ex["claims"][scl]["status"]}"' in dom and f'class="pi-tag {ex["evidence_checks"][scl]["result"]}"' in dom, led)
        dom = AD["/about/how-it-works/"]; refp = json.load(open(J(OUT, "data", "designs", "demo-a.json"), encoding="utf-8")); refv = next((v for v in refp["versions"] if v["id"] == refp["current_version_id"]), None); rz = refv["evaluation"]["edge_zones"][0] if refv else {"status": "?", "covered_m": "?", "edge_length_m": "?"}; body = text(main(dom))
        pats = re.findall(r'name="st-pattern" value="([a-z_]+)"', chrome(P2, "/about/how-it-works/?view=arrangement", 12000)); alt = next((k for k in pats if k != "saved"), None); run = chrome(P2, f"/about/how-it-works/?view=arrangement&pattern={alt}", 12000) if alt else ""; evd = chrome(P2, "/about/how-it-works/?view=evaluation", 12000); evb = text(first(evd, r'<div class="ab-stage-b"[^>]*>(.*?)</div>\s*<div class="ab-case">') or "")
        check("AB6 How it works: one computed figure in four views (tabs, state in the address); the case line names the reference garden, its version and seed; the Screen verdict and covered length are the reference garden's own; a pattern re-runs the engine; heuristics are named; recorded-only functions carry no metric; Ground Cover is an estimate with no pass mark", re.findall(r'role="tab"[^>]*data-view="([a-z]+)"', dom) == ["site", "eligibility", "arrangement", "evaluation"] and 'class="kn-plan st-plan"' in dom and refv and refv["id"] in (first(dom, r'<div class="ab-case">(.*?)</div>') or "") and f"seed {refv['seed']}" in text(first(dom, r'<div class="ab-case">(.*?)</div>') or "") and f"Screen: {rz['status']}" in evb and f"{rz['covered_m']} of {rz['edge_length_m']} m covered" in evb and "no pass mark" in evb and not re.search(r"Ground Cover: (met|not met)", evb) and len(pats) >= 3 and "generated just now" in run and "saved:" in run and 'class="pi-res heuristic"' in dom and dom.count('class="pi-out recorded_only"') >= 3 and len(re.findall(r'class="ab-est">Ground Cover: an estimate, \d+ %', dom)) == len(pats) - 1 and "offline" in body.lower() and "continuity" not in text(first(dom, r'<div class="ab-case">(.*?)</div>') or "").lower(), f"views ok · patterns {pats} · Screen: {rz['status']} · {rz['covered_m']} of {rz['edge_length_m']} m")
        # V4.2: one read mode for all four views. Saved reads the stored version; a recomputed preview reads one engine run everywhere.
        pan = lambda dm: dict(re.findall(r'data-(read|pattern|objects|ground|covered)="([^"]*)"', first(dm, r'<div class="ab-pan"([^>]*)>') or "")); HW = "/about/how-it-works/"
        sv = {v: pan(chrome(P2, f"{HW}?view={v}", 12000)) for v in ("arrangement", "evaluation")}; rc = {v: pan(chrome(P2, f"{HW}?view={v}&mode=recomputed&pattern={alt}", 12000)) for v in ("site", "eligibility", "arrangement", "evaluation")} if alt else {}
        rcd = chrome(P2, f"{HW}?view=evaluation&mode=recomputed&pattern={alt}", 12000) if alt else ""; rcb = text(first(rcd, r'<div class="ab-stage-b"[^>]*>(.*?)</div>\s*<div class="ab-case">') or ""); legacy = pan(chrome(P2, f"{HW}?view=evaluation&pattern={alt}", 12000)) if alt else {}
        gsv = next((g for g in refv["evaluation"].get("ground_cover", []) if str(round(g["ground_cover_share"] * 100)) == sv["evaluation"].get("ground")), None) if refv else None
        check("AB9 How it works reads one case through all four views: As saved shows the stored version (its plant objects, covered length and ground estimate) in Arrangement and Evaluation alike; a Recomputed preview shows the same engine run in Site, Eligibility, Arrangement and Evaluation, so the Evaluation follows a pattern change; a V4.1 link that names only a pattern opens the recomputed case; As saved restores the saved result",
              bool(alt) and sv["arrangement"] == sv["evaluation"] and sv["evaluation"].get("read") == "saved" and sv["evaluation"].get("objects") == str(len(refv["plant_objects"])) and sv["evaluation"].get("covered") == str(rz["covered_m"]) and gsv is not None
              and len({json.dumps(x, sort_keys=True) for x in rc.values()}) == 1 and rc["evaluation"].get("read") == "recomputed" and rc["evaluation"].get("pattern") == alt and legacy == rc["evaluation"]
              and "Recomputed preview" in rcb and "no pass mark" in rcb and not re.search(r"Ground Cover: (met|not met)", rcb) and 'aria-pressed="true">Recomputed preview' in rcd and 'aria-pressed="true">As saved' in evd,
              f"saved {sv['evaluation']} · recomputed {rc.get('evaluation')}")
        # V4.2: the public pages say what a visitor needs; project housekeeping stays in the internal report
        INTERNAL = r"to confirm|awaiting|pending (?:user )?approval|agent proposal|\bM[4-7]\d\b|\bcommit\b|build hash|\b\d+ ?/ ?\d+ (?:tests )?pass"; pl = chrome(P2, "/plants/", 9000); pub = {**{k: text(main(v)) for k, v in AD.items()}, "/plants/": text(main(pl))}
        leak2 = {k: re.findall(INTERNAL, v, re.I)[:3] for k, v in pub.items()}; proj = AD["/about/"]; foot = text(first(pl, r'<footer class="pi-foot">(.*?)</footer>') or "")
        cvr = first(proj, r'(<svg class="fx fx-cover".*?</svg>)') or ""; clab = html.unescape(first(cvr, r'aria-label="([^"]*)"') or ""); salsp = next(x for x in ex["species"] if x["id"] == "plant:gaultheria-shallon"); nsal = sum(1 for o in refv["plant_objects"] if o["species_id"] == salsp["id"]) if refv else -1
        check("AB10 public pages carry no project housekeeping (pending decisions, method-log numbers, commits, test counts); Project opens on a thesis, two entries and one drawing from specimen to garden (V4.3) made of the snapshot's own records and the reference garden's own plant objects, with no statistic cards; an unverified record is drawn dashed; no footer repeats the snapshot statistics",
              not any(leak2.values()) and 'class="ab-figs"' not in proj and bool(cvr) and ">Try Design</a>" in proj and ">Explore Knowledge</a>" in proj and salsp["scientific_name"] in clab and f"{len(refv['plant_objects'])} plant objects, {nsal} of them" in clab and len(re.findall(r"<circle cx=", cvr)) >= len(refv["plant_objects"])
              and ('class="fx-rule open"' in cvr or all(a["verification"] == "verified" for a in ex["attributes"] if a["species"] == salsp["id"])) and "✓" not in cvr and "<image" in cvr and "not evidence" in text(proj)
              and "schema" not in foot.lower() and "claims" not in foot.lower() and "Sources &amp; data" in (first(pl, r'<footer class="pi-foot">(.*?)</footer>') or ""), {k: v for k, v in leak2.items() if v} or clab[:160])
        md = AD["/about/method/"]; figs7 = re.findall(r'<figure class="ab-fx" data-fig="(\d)">(<svg class="fx fx-\d".*?</svg>)<figcaption>(.*?)</figcaption>', md, re.S); flab = {n: html.unescape(first(sv_, r'aria-label="([^"]*)"') or "") for n, sv_, _ in figs7}
        seven = [text(x) for x in re.findall(r"<span>(.*?)</span></a>", first(md, r'<ol class="ab-seven"[^>]*>(.*?)</ol>') or "")]; nder = stt["links_by_status"].get("derived", 0); npr = sum(1 for c in ex["claims"].values() if c["source_type"] == "practitioner"); ngate = sum(1 for f in ex["facets"] if f["gate"])
        check("AB11 Research & Method (V4.3): the seven steps by name and in order, and one figure per step drawn from the snapshot — each with a text alternative and a caption; the followed claim's own status (an unverified claim is drawn dashed, never ticked); figure 4 shows survey counts only; figure 7 carries the snapshot's own counts and leaves missing links undrawn; value → function → engine → evaluation is a table",
              seven == STEPS and [n for n, _, _ in figs7] == list("1234567") and all(len(flab[n]) > 60 for n in flab) and all(text(c) for _, _, c in figs7) and f'data-claim="{html.escape(scl, quote=True)}"' in md
              and ex["claims"][scl]["status"].replace("_", " ") in flab.get("2", "") and (ex["claims"][scl]["status"] == "verified" or 'class="fx-rule open"' in figs7[1][1]) and not any("✓" in sv_ for _, sv_, _ in figs7)
              and f"{npr} practitioner statements" in flab.get("4", "") and f"{ngate} of {len(ex['facets'])} fields" in flab.get("4", "") and f"{stt['species']} plants" in flab.get("7", "") and f"{nder} links from a recorded use" in flab.get("7", "") and f"{stt['links_by_status'].get('unknown', 0)} possible links are missing" in flab.get("7", "")
              and len(re.findall(r'class="fx-ln (?:on|open)"', figs7[6][1])) == stt["links_drawn"] and 'class="pi-table ab-vfe"' in md, {n: flab[n][:70] for n in flab})
        tray = first(pl, r'(<div class="lib-tray"[^>]*>)') or ""; two = chrome(P2, f"/plants/#form={ex['species'][0]['growth_form_label'].replace(' ', '%20')}&origin={ex['species'][0]['origin_status']}", 9000); on = re.findall(r'<a class="lib-on"[^>]*><small>(.*?)</small>', two); shown2 = re.findall(r'<article class="pi-card[^"]*" data-species="([\w-]+)"', two)
        check("D6 the atlas leads with the plants (V4.2): a search and one Filters button; the three filter groups sit in a tray that is closed until asked for; two filters chosen in different groups both hold, show as removable chips with Clear all, and select exactly the species that meet both; no statistics block under the cards",
              'id="lib-fbtn"' in pl and "hidden" in tray and len(re.findall(r'<div class="lib-fg">', pl)) == 3 and 'class="lib-prov"' not in pl and 'class="lib-active"' not in pl and on == ["Growth form", "Origin"] and ">Clear all</a>" in two
              and sorted(shown2) == sorted(x["slug"] for x in ex["species"] if x["growth_form_label"] == ex["species"][0]["growth_form_label"] and x["origin_status"] == ex["species"][0]["origin_status"]), f"chips {on} · {len(shown2)} shown")
        dom = AD["/about/contribute/"]; body = main(dom); path = [text(x) for x in re.findall(r"<h3>(.*?)</h3>", first(dom, r'<ol class="ab-path">(.*?)</ol>') or "")]
        check("AB7 Contribute & Future: the survey is linked; the path is Contribution → Candidate → Review → Structured claim → Validation → Release; future directions carry no control", "kaiyankay.github.io/planting-survey/" in body and [x.lower() for x in path] == ["contribution", "candidate", "review", "structured claim", "validation", "release"] and "has not been approved for publication" in body and not re.search(r"<(button|input|select)\b", body), path)
        leaks = {k: re.findall(r"survey-r\d+|respondent \d+|[\w.]+@[\w.]+|supabase|respondent_map", main(v), re.I)[:3] for k, v in AD.items()}
        check("AB8 no About page shows a respondent id, an e-mail address or a private survey field", not any(leaks.values()), {k: v for k, v in leaks.items() if v})

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
            dom = chrome(P, "/knowledge/#fk=species&fi=plant%3Agaultheria-shallon")
            check("F6 the Explorer offers the same way back", text(first(dom, r'<a class="pi-return"[^>]*>(.*?)</a>')) == "Back to Grow")
            # and the Studio again, with no parameter: the saved design at the place it was left
            dom = chrome(P, "/", 12000)
            stage = first(dom, r'<body[^>]*data-stage="([a-z]+)"'); card = first(dom, r'(<div id="plantcard"[^>]*>.{0,9000})') or ""; mode = first(dom, r'<button[^>]*data-mode="(\w+)"[^>]*class="[^"]*\bon\b') or first(dom, r'<button[^>]*class="[^"]*\bon\b[^"]*"[^>]*data-mode="(\w+)"')
            check("F7 back in Design: Grow, the same view, the same plant selected", stage == "garden" and 'hidden=""' not in card[:60] and g["selected"]["id"] in card and "Gaultheria shallon" in text(card) and mode == g["mode"], f"stage {stage} · mode {mode} · card has {g['selected']['id']}: {g['selected']['id'] in card}")
            check("F8 the garden is the one that was generated", f"{g['plants']} plants" in text(dom), first(text(dom), r"(\d+ plants · \d+ species · \d+ beds)"))
            # Knowledge, in the same browser: the trace offers the visitor's own design, and leads into one of its beds in Compose
            dom = chrome(P, "/knowledge/trace/#species=gaultheria-shallon")
            own = first(dom, r'<p class="kn-case-sw"><a href="([^"]+)"'); bed_id = first(html.unescape(own or ""), r"bed=([\w-]+)")
            check("K7 with a design in this browser the overview offers to trace it in a bed of that design", bool(bed_id) and "Platform journey" in text(first(dom, r'<p class="kn-case-sw">(.*?)</p>') or ""), own)
            # V4.2 · G1: the reference garden's current version is derived (a partial regeneration): the Trace says so first, by name,
            # with the version it came from and what changed, never as "generated"; ids sit one level down
            _rp = json.load(open(J(ROOT, "designs", "demo-a.json"), encoding="utf-8")); _rv = next(v for v in _rp["versions"] if v["id"] == _rp["current_version_id"]); _ek = (_rv.get("edit_event") or {}).get("kind", "")
            _how = (_rv.get("derived") or {}).get("how") or {"spatial_edit": "typed edit", "geometry_update": "partial regeneration"}.get(_ek) or ("manual edit" if _ek.startswith("direct:") else ("edit" if _ek else ""))
            _par = next((k + 1 for k, v in enumerate(_rp["versions"]) if v["id"] == ((_rv.get("derived") or {}).get("from_version_id") or _rv.get("parent_version_id"))), None); _rd = first(dom, r'(<div class="kn-case-read.*?</div>)') or ""; _vis = text(first(_rd, r'^(.*?)<details') or "")
            check("G1 a derived version is named on the first line of the Trace: how it was made, the version it came from, what changed; never called generated; ids one level down", bool(_how) and f'data-case-derived="{_how}"' in _rd and f"Reading version {len(_rp['versions']) and [v['id'] for v in _rp['versions']].index(_rv['id']) + 1}" in _vis and _how in _vis and (not _par or f"of version {_par}" in _vis) and re.search(r"\d+ → \d+ plants", _vis) is not None and "Reading generated version" not in _vis and _rv["id"] not in _vis and _rv["id"] in text(first(_rd, r'<details class="kn-case-ids">(.*?)</details>') or ""), _vis[:260] or "no case line")
            if bed_id:
                dom = chrome(P, f"/knowledge/trace/#species=gaultheria-shallon&case=mine&bed={bed_id}"); case = text(first(dom, r'<section class="kn-case"[^>]*>(.*?)</section>') or "")
                go = first(dom, r'href="([^"]*\?open=compose[^"]*)"') or ""
                check("K8 traced in the visitor's design: the bed is theirs, and the way on is that bed in Compose", "your design Platform journey" in case and f"bed={bed_id}" in html.unescape(go) and "species=gaultheria-shallon" in html.unescape(go), case[:160])
                dom = chrome(P, f"/?open=compose&bed={bed_id}&species=gaultheria-shallon&fn=z%3Ascreen", 12000); stage = first(dom, r'<body[^>]*data-stage="([a-z]+)"'); evp = first(dom, r'(<div id="cws-evidence".{0,12000})') or ""
                check("K9 the link opens Compose on that bed with the species' compact explanation and record, which lead back to the full trace", stage == "intent" and 'data-pi-mini="gaultheria-shallon"' in evp and 'data-why-species="gaultheria-shallon"' in evp and 'class="pi-why-go"' in evp and f"bed={bed_id}" in html.unescape(evp), f"stage {stage} · evidence panel {len(evp)} chars")
        # ------------------------------------------------------------ J: three journeys that start from an actual design (the Studio's own replay ?script=trace)
        P3 = tempfile.mkdtemp(prefix="pi-trace-"); SEC = lambda dom, i: text(first(dom, rf'<section class="(?:pi-sec kn-step|kn-case)" id="{i}"[^>]*>(.*?)</section>') or "")
        def replay(stop):
            dom = chrome(P3, f"/?script=trace&stop={stop}", 45000); raw = first(dom, r'<pre id="script-out"[^>]*>(.*?)</pre>'); o = json.loads(html.unescape(raw)) if raw else {}; return o.get("trace") or {}, o.get("error")
        page = lambda href: chrome(P3, "/knowledge/trace/" + href[href.index("#"):], 9000)
        t, err = replay("a"); A = t.get("A") or {}
        if check("J1 Screen, from Grow: a planted object of the Screen row offers 'Why this plant here?'; its five lines carry the engine's outcome, row plan and verdict, and the garden is the one Compose previewed", bool(A) and A.get("action_offered") and A["why"]["outcome"] == "planted" and set(A["why"]["lines"]) == {"asked", "knowledge", "selection", "arrangement", "result"} and A["engine"]["status"] in A["why"]["lines"]["result"] and f"{A['engine']['placed']} placed" in A["why"]["lines"]["arrangement"] and A["preview_match"]["identical"], err or (A.get("why") or {}).get("lines")):
            dom = page(A["why"]["href"]); case = SEC(dom, "kn-case"); evr = SEC(dom, "kn-evaluation")
            check("J2 the full trace opened from that plant is of the same design version, bed and plant object: outcome planted, the engine's verdict re-measured with the same result", 'data-case="mine"' in dom and f'data-bed="{A["bed"]}"' in dom and 'data-fn="z:screen"' in dom and A["plant"] in case and A["version"] in case and 'class="kn-case-sp" data-outcome="planted"' in dom and f"Screen: {A['engine']['status']}" in evr and "recomputed here: same result" in evr and f"{A['engine']['covered_m']} m of {A['engine']['edge_length_m']} m" in evr, case[:200])
            dom = chrome(P3, "/", 12000); stage = first(dom, r'<body[^>]*data-stage="([a-z]+)"'); card = first(dom, r'(<div id="plantcard"[^>]*>.{0,9000})') or ""
            check("J3 back in Design: the same stage, the same plant selected, the explanation still open", stage == "garden" and A["plant"] in card and "data-whybox" in card and 'hidden=""' not in card[:60], f"stage {stage} · card {len(card)} chars")
        t, err = replay("b1"); B1 = t.get("B1") or {}; dom1 = page(B1["why"]["href"]) if B1 else ""
        t, err2 = replay("b2"); B2 = t.get("B2") or {}; Bx = t.get("B") or {}; dom2 = page(B2["why"]["href"]) if B2 else ""
        def ground_ok(B, dom):
            case = SEC(dom, "kn-case"); evr = SEC(dom, "kn-evaluation"); e = B["engine"]
            return 'data-case="mine"' in dom and 'data-fn="z:ground_cover"' in dom and f'data-bed="{B["bed"]}"' in dom and B["plant"] in case and B["version"] in case and e["pattern_label"].lower() in case and f"{round(e['ground_cover_share'] * 100)} %" in case and f"{e['placed']} placed" in evr and e["pattern_label"] in evr and "recomputed here: same result" in evr and "sets no threshold" in evr
        if check("J4 Ground Cover, in Compose: the arrangement options of one bed are different sets of plant objects from the engine, and the chosen one is generated exactly as previewed, twice", bool(B1) and bool(B2) and B1.get("distinct_options", 0) >= 2 and B1["preview_equals_version"] and B2["preview_equals_version"] and B1["preview_match"]["identical"] and B2["preview_match"]["identical"] and Bx.get("different_versions") and Bx.get("different_patterns") and Bx.get("why_names_its_pattern"), err or err2 or {k: (B.get("chosen"), B.get("version")) for k, B in (("B1", B1), ("B2", B2))}):
            check("J5 the trace of a ground plant describes the current version: after the pattern is changed and the garden generated again, it shows the new version, pattern, plant count and estimate, not the earlier ones", ground_ok(B1, dom1) and ground_ok(B2, dom2) and B1["version"] != B2["version"] and B1["version"] not in SEC(dom2, "kn-case") and B1["engine"]["pattern_label"].lower() not in SEC(dom2, "kn-case"), f"{B1['engine']['pattern_label']} {B1['version']} {round(B1['engine']['ground_cover_share'] * 100)} % → {B2['engine']['pattern_label']} {B2['version']} {round(B2['engine']['ground_cover_share'] * 100)} %")
        t, err = replay("c"); C = t.get("C") or {}; rows = C.get("rows") or []; WORDS = {"planted", "selected, not placed", "eligible, not selected", "eligible (checks pending), not selected", "excluded by a check", "evidence unknown", "planted for another function", "not asked of this bed"}   # V4: an eligible species with an open check is worded as provisional; the outcome (the enum) is unchanged
        outs = {r["species"]: r["outcomes"][0]["outcome"] for r in rows if r.get("outcomes")}; wn = C.get("why_not") or {}
        if check("J6 considered species, in Compose: each has its own outcome in the platform's words; an excluded one can not be added and says why, an eligible one can; the outcome agrees with the engine's own check", len(rows) >= 2 and "excluded" in outs.values() and any(o in ("eligible", "planted", "not_placed") for o in outs.values()) and all(set(x["text"].split(". ")[0:1]) and r["word"].split(" · ")[0] in WORDS for r in rows for x in r["outcomes"][:1]) and all((outs[r["species"]] == "excluded") == (r["engine"]["fit"] == "fails") for r in rows if r["engine"].get("fit")) and all(r["can_add"] == (outs[r["species"]] == "eligible") for r in rows) and wn.get("outcome") == "excluded" and "Why not" in wn.get("title", "") and "result" not in wn.get("lines", {"result": 1}), err or {k.replace("plant:", ""): v for k, v in outs.items()}):
            okj, det = True, []
            for r in rows:
                slug = r["species"].replace("plant:", ""); dom = chrome(P3, f"/knowledge/trace/#fn=z%3Aground_cover&species={slug}&case=mine&bed={C['bed_id']}", 9000); got = first(dom, r'class="kn-case-sp" data-outcome="(\w+)"'); ok = got == outs[r["species"]] and 'data-case="mine"' in dom and f'data-bed="{C["bed_id"]}"' in dom
                okj &= ok; det.append(f"{slug}: {got}{'' if ok else '  ✗ Compose says ' + outs[r['species']]}")
            check("J7 the full trace gives each of those species the same outcome as Compose, in the same bed of the same design", okj, " · ".join(det))
        # V4 · what is being read. The Studio's replay ?script=v4 generates a design, then changes one bed and does NOT regenerate.
        # Grow's explanation names the generated version (v=<id>), Compose's names the preview by the fingerprint of its inputs (pv=<fp>);
        # the trace page must read exactly what the link names, and say so when the design has changed since the link was made.
        dom = chrome(P3, "/?script=v4&stop=stale", 60000); raw = first(dom, r'<pre id="script-out"[^>]*>(.*?)</pre>'); o4 = json.loads(html.unescape(raw)) if raw else {}; V = (o4.get("v4") or {}).get("V") or {}; cz = V.get("compose") or {}; gz = V.get("grow") or {}
        if check("J8 a bed changed after generating and not regenerated: Compose's explanation and its link name the preview by its fingerprint (not the stale version); Grow's name the generated version", bool(cz) and cz["why"]["ref"] == f"preview:{cz['fp']}" and f"pv={cz['fp']}" in cz["why"]["href"] and cz["fp"] != cz["version_input_fp"] and cz["preview_differs_from_version"] and gz["why"]["ref"] == f"version:{V['version']['id']}" and f"v={V['version']['id']}" in gz["why"]["href"], (o4.get("error") or json.dumps({"compose": cz.get("why"), "grow": gz.get("why")}))[:400]):
            rd = lambda dom: (first(dom, r'data-case-read="(\w+)"'), first(dom, r'data-case-ref="([^"]+)"'), first(dom, r'data-case-changed="(\w+)"'))
            dom = page(cz["why"]["href"]); case = SEC(dom, "kn-case"); n_prev = cz["preview_objects_in_bed"]; n_ver = cz["version_objects_in_bed"]
            check("J9 the full trace opened from Compose reads the same preview: the same fingerprint, said to be a preview that differs from the generated version, with the preview's plants and not the version's", rd(dom) == ("preview", cz["fp"], "false") and "Reading a preview" in case and "differs from generated version" in case and 'data-case="mine"' in dom and f'data-bed="{cz["bed_id"]}"' in dom and (n_prev == n_ver or (f"{n_prev} " in case or f"{n_prev} " in SEC(dom, "kn-arrangement"))), f"{rd(dom)} · {case[:200]}")
            stale = cz["why"]["href"].replace(f"pv={cz['fp']}", "pv=p-0stale0"); dom = page(stale)
            check("J10 a link made from a preview that has since changed says so in the first lines of the case, and shows the preview as it is now instead of stale content", rd(dom) == ("preview", cz["fp"], "true") and "This preview has changed" in SEC(dom, "kn-case"), f"{rd(dom)}")
            dom = page(gz["why"]["href"]); case = SEC(dom, "kn-case")
            check("J11 the full trace opened from Grow reads the generated version named in the link, and says the design was edited after it was generated", rd(dom)[0] == "version" and rd(dom)[1] == V["version"]["id"] and f"Reading generated version {V['version']['n']}" in case and gz["plant"] in case and first(dom, r'data-case-inputs-changed="(\w+)"') == "true", f"{rd(dom)} · {case[:200]}")
        shutil.rmtree(P3, ignore_errors=True)
    finally:
        shutil.rmtree(P, ignore_errors=True); shutil.rmtree(P2, ignore_errors=True)

if "--keep" not in sys.argv: shutil.rmtree(OUT, ignore_errors=True)
for f in ("platform-journey.json", "script-trace.json", "script-v4.json"):   # the design server, when it is the target, writes the replay's project: never keep it
    if os.path.exists(J(ROOT, "designs", f)): os.remove(J(ROOT, "designs", f))
passed = sum(1 for _, ok, _ in results if ok)
os.makedirs(J(ROOT, "eval"), exist_ok=True)
with open(J(ROOT, "eval", f"platform-tests-{TODAY}.md"), "w", encoding="utf-8") as fh:
    fh.write(f"# Platform tests — {TODAY}\n\n`python3 -I tools/platform_tests.py --url {URL}` · build of the working tree · knowledge snapshot {ex['generated']} · **{passed} / {len(results)} passed**\n\n| | check | detail |\n|---|---|---|\n")
    for name, ok, detail in results: fh.write(f"| {'ok' if ok else '**FAIL**'} | {name} | {str(detail).replace('|', '¦').replace(chr(10), ' ')} |\n")
for name, ok, detail in results: print(("[ok]  " if ok else "[FAIL]"), name, "" if ok else f"— {detail}")
print(f"{passed} / {len(results)} passed → eval/platform-tests-{TODAY}.md")
sys.exit(0 if passed == len(results) else 1)
