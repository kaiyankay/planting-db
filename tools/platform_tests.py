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
  N  navigation        Design · Plants · Knowledge on every page; Overview · Explore · Research · Method inside Knowledge; the V1
                       addresses /contribute/ and /how-it-works/ arrive in Research and Method
  K  evidence trace    the Knowledge overview: five steps on the Studio's recorded demonstration garden; the species, plant count and
                       verdict are the recorded design's; the source excerpt, claim, verification, AI assessment and link are the
                       snapshot's; the per-species results equal the engine's recorded ones (recomputed on the page); every species
                       can be followed; a species with no Screen link is shown as an explicit unknown
  R  research, method  figures equal the snapshot; the coverage grid has species × fields squares; no respondent id, no private field
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
art = json.load(open(J(OUT, "platform", "data", "artwork.json"), encoding="utf-8"))
check("B4 every illustration belongs to a species of the snapshot, exists in the build, and the manifest says it is AI-generated artwork", set(art["images"]) <= set(slugs) and all(os.path.exists(J(OUT, "platform", "art", im["file"])) for im in art["images"].values()) and "AI-generated" in art["kind"] and "not evidence" in art["about"], sorted(set(slugs) - set(art["images"])) or f"all {len(slugs)} have an illustration")
check("C3 the illustration manifest holds a file, its size and the lettering flag only, and no illustration carries lettering", all(set(im) <= {"file", "width", "height", "lettering"} and im.get("lettering") is False for im in art["images"].values()), sorted({k for im in art["images"].values() for k in im}))
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
            hero = first(dom, r'<header class="pi-hero">(.*?)</header>') or ""; plate = first(hero, r'<figure class="pi-fig pi-art">(.*?)</figure>') or ""
            ok = h1 == s["scientific_name"] and secs == (10 if rels else 9) and facts == len(ex["facets"]) and rec == cells and fns == 5 and "via Wikimedia Commons" in dom and f'fi=plant%3A{s["slug"]}' in dom
            ok = ok and f'platform/art/{s["slug"]}.webp' in plate and "AI-generated" in text(plate) and "Reference photograph" in hero and s["common_names"][0] in text(first(hero, r'<p class="pi-names">(.*?)</p>') or "") and f'knowledge/#species={s["slug"]}' in dom
            okD &= ok; det.append(f"{s['slug']}: {h1!r} sections {secs} rows {facts} recorded {rec}/{cells} functions {fns}{'' if ok else '  ✗'}")
        check(f"D1 {len(ex['species'])} profiles: name in HTML, illustration plate said to be AI-generated, reference photograph with credit, sections, {len(ex['facets'])} attribute rows matching the snapshot, 5 function rows, Explorer and trace links", okD, " | ".join(det))
        dom = chrome(P2, "/plants/"); cards = re.findall(r'<article class="pi-card".*?</article>', dom, re.S)
        check("D2 the atlas shows one card per species: its illustration, then the scientific and common name set in HTML, linking to its profile", len(cards) == len(slugs) and all(f'#species={x}"' in dom for x in slugs) and all(any(f'platform/art/{s["slug"]}.webp' in c and f'<h3><i>{s["scientific_name"]}</i></h3>' in c and f'<p class="pi-card-common">{html.escape(s["common_names"][0], quote=False)}</p>' in c for c in cards) for s in ex["species"]) and "AI-generated editorial artwork" in text(first(dom, r'<p class="lib-art">(.*?)</p>') or ""))

        # ------------------------------------------------------------ E: Explorer and Neural
        okE, det = True, []
        for s in ex["species"]:
            dom = chrome(P2, f"/explore/#fk=species&fi=plant%3A{s['slug']}", 7000)
            ok = f'data-pi-mini="{s["slug"]}"' in dom and f'plants/#species={s["slug"]}' in dom and 'aria-current="page">Explore</a>' in dom and 'aria-current="page">Knowledge</a>' in dom
            okE &= ok; det.append(f"{s['slug']}{'' if ok else '  ✗'}")
        check("E1 the Explorer, opened on each species, shows the shared plant card with the link to its profile and the platform bar", okE, " ".join(det))
        dom = chrome(P2, "/explore/neural/#species=gaultheria-shallon", 20000)
        check("E2 the Neural view carries the platform bar and names the same snapshot date", 'class="pi-top pi-dark"' in dom and f"knowledge {ex['generated']}" in dom and "could not load" not in text(first(dom, r'<div id="err">(.*?)</div>') or ""), text(first(dom, r'<div id="stats">(.*?)</div>') or "")[:160])

        # ------------------------------------------------------------ N: navigation
        pages = {"/plants/": ("Plants", None), "/knowledge/": ("Knowledge", "Overview"), "/explore/": ("Knowledge", "Explore"), "/knowledge/research/": ("Knowledge", "Research"), "/knowledge/method/": ("Knowledge", "Method")}; okN, det = True, []
        for path, (dest, sec) in pages.items():
            dom = chrome(P2, path, 7000); nav = first(dom, r'<nav class="pi-nav"[^>]*>(.*?)</nav>') or ""; sub = first(dom, r'<nav class="pi-subnav"[^>]*>(.*?)</nav>') or ""
            ok = re.findall(r">([^<]+)</a>", nav) == ["Design", "Plants", "Knowledge"] and f'aria-current="page">{dest}</a>' in nav and ((sec is None and not sub) or (re.findall(r">([^<]+)</a>", sub) == ["Overview", "Explore", "Research", "Method"] and f'aria-current="page">{sec}</a>' in sub))
            okN &= ok; det.append(f"{path}{'' if ok else '  ✗'}")
        check("N1 Design · Plants · Knowledge on every page; Overview · Explore · Research · Method inside Knowledge, the current one marked", okN, " ".join(det))
        d1, d2 = chrome(P2, "/contribute/", 7000), chrome(P2, "/how-it-works/", 7000)
        check("N2 the V1 addresses arrive in Research and Method", 'class="pi-doc rs"' in d1 and 'id="kinds"' in d2, f"{text(first(d1, r'<h1>(.*?)</h1>') or '')!r} · {text(first(d2, r'<h1>(.*?)</h1>') or '')!r}")

        # ------------------------------------------------------------ K: the evidence trace on the recorded demonstration garden
        ref = json.load(open(J(OUT, "data", "designs", "demo-a.json"), encoding="utf-8")); rv = next(v for v in ref["versions"] if v["id"] == ref["current_version_id"])
        zone = next(z for z in rv["zones"] if z["kind"] == "edge" and z["function"] == "z:screen"); rev = next(e for e in rv["evaluation"]["edge_zones"] if e["zone"] == zone["id"]); rbed = next(b for b in ref["site"]["beds"] if b["id"] == zone["bed_id"])
        rrow = [o for o in rv["plant_objects"] if o.get("zone_id") == zone["id"] and o["role"].startswith("screen")]; lead = next(s for s in ex["species"] if s["id"] == rrow[0]["species_id"])
        link = next(l for l in ex["function_links"] if l["species"] == lead["id"] and l["function"] == "z:screen"); SPN = {s["scientific_name"]: s["id"] for s in ex["species"]}
        dom = chrome(P2, "/knowledge/", 9000); case = text(first(dom, r'<section class="kn-case"[^>]*>(.*?)</section>') or "")
        steps = [i for i in ("kn-sources", "kn-claims", "kn-relations", "kn-access", "kn-evaluation") if f'id="{i}"' in dom]
        check("K1 the overview follows one decision in five steps, on the recorded demonstration garden", len(steps) == 5 and f"{len(rrow)} plants of {lead['scientific_name']}" in case and rbed["name"] in case and f"evaluation of that row: {rev['status']}" in case and "recorded demonstration garden" in case and "your design" not in case, case[:200])
        okc, det = True, []
        for cid in link["use_claims"]:
            c = ex["claims"][cid]; ck = ex["evidence_checks"].get(cid) or {}; so = ex["sources"][c["source_id"]]
            ok = f'<span class="id">{cid}</span>' in dom and html.escape(c["text"], quote=False) in dom and f'class="pi-tag {c["status"]}"' in dom and (not ck.get("excerpt") or f'<blockquote>{html.escape(ck["excerpt"], quote=False)}</blockquote>' in dom) and (not ck.get("result") or f'class="pi-tag {ck["result"]}"' in dom) and (so["type"] == "practitioner" or html.escape(so["label"].split(" — ")[0], quote=False) in dom)
            okc &= ok; det.append(f"{cid}{'' if ok else '  ✗'}")
        check("K2 source excerpt, claim text and id, human verification and AI assessment of the traced link are the snapshot's own records", okc and bool(link["use_claims"]) and f'<span class="id">{html.escape(link["id"], quote=False)}</span>' in dom and f'class="pi-tag {link["status"]}"' in dom, " ".join(det))
        kinds = re.findall(r'<div class="pi-led" data-kind="(\w+)"', dom)
        check("K3 the eight kinds of statement are separate rows: source, claim, verification, AI assessment, rule, site, engine, evaluation", [k for k in ("source", "claim", "verification", "ai", "rule", "site", "engine", "evaluation") if k in kinds] == ["source", "claim", "verification", "ai", "rule", "site", "engine", "evaluation"] and kinds.index("verification") != kinds.index("ai"), kinds)
        tbl = " ".join(re.findall(r'<table class="pi-table kn-cand">(.*?)</table>', dom, re.S)); got = {SPN.get(text(n)): fit for n, fit in re.findall(r'<tr[^>]*><td><a [^>]*><i>(.*?)</i></a>.*?<b><span class="pi-res (\w+)">', tbl, re.S)}
        want = {c["id"]: c["fit"] for c in rv["assemblages"][rbed["id"]]["candidates"]["screen"]}
        check("K4 every species is checked for the bed on the page, and the results equal the ones the Studio recorded", got == want and len(got) == len(ex["species"]), {k.replace("plant:", ""): v for k, v in got.items() if want.get(k) != v} or f"{len(got)} species, identical")
        evr = text(first(dom, r'<section class="pi-sec kn-step" id="kn-evaluation"[^>]*>(.*?)</section>') or "")
        check("K5 the evaluation is the engine's: the recorded verdict, re-measured on the page with the same result, and said not to be a verified performance", f"Screen: {rev['status']}" in evr and "recomputed here: same result" in evr and "Not a measured or verified screening performance" in evr and f"{rev['covered_m']} m of {rev['edge_length_m']} m" in evr, evr[:160])
        okf, det = True, []
        for s in ex["species"]:
            dom = chrome(P2, f"/knowledge/#species={s['slug']}", 9000); l = next(x for x in ex["function_links"] if x["species"] == s["id"] and x["function"] == "z:screen"); src = text(first(dom, r'<section class="pi-sec kn-step" id="kn-sources"[^>]*>(.*?)</section>') or "")
            ok = len(re.findall(r'<section class="pi-sec kn-step"', dom)) == 6 and f'<span class="id">{html.escape(l["id"], quote=False)}</span>' in dom and f'aria-pressed="true" href="#species={s["slug"]}"' in dom and (("No source states that" in src) == (not l.get("use_claims"))) and "Could not load" not in dom
            okf &= ok; det.append(f"{s['slug']}{'' if ok else '  ✗'}")
        check("K6 every species can be followed; one without a recorded use is shown as an explicit unknown, never with an invented source", okf, " ".join(det))

        # ------------------------------------------------------------ R: Research and Method
        dom = chrome(P2, "/knowledge/research/", 7000); sq = re.findall(r'<(?:a|span) class="(rec|dis|no)"', first(dom, r'<table class="rs-grid"[^>]*>(.*?)</table>') or ""); stt = ex["stats"]
        check("R1 Research: the coverage grid has one square per species and field, and its counts are the snapshot's", len(sq) == len(ex["species"]) * len(ex["facets"]) and sq.count("rec") + sq.count("dis") == stt["attribute_cells"] and sq.count("dis") == stt["cells_with_disagreement"] and sq.count("no") == stt["cells_not_recorded"], f"{len(sq)} squares: {sq.count('rec')} recorded, {sq.count('dis')} in disagreement, {sq.count('no')} not recorded")
        body = first(dom, r"<main[^>]*>(.*?)</main>") or ""
        check("R2 Research links the survey and shows no respondent id, e-mail address, response text or private field", "kaiyankay.github.io/planting-survey/" in body and not re.search(r"survey-r\d|respondent \d|@|supabase|respondent_map", body, re.I) and "has not been approved for publication" in body)
        dom = chrome(P2, "/knowledge/method/", 9000); led = re.findall(r'<div class="pi-led"><dt>(.*?)</dt>', first(dom, r'<section class="pi-sec" id="kinds">(.*?)</section>') or "")
        check("R3 Method names the eight kinds of statement, every knowledge-graph rule of the release and the engine's heuristics", len(led) == 8 and all(f"<b>{r}</b>" in dom for r in ex["rules"]) and 'class="pi-res heuristic"' in dom and "offline rules" in dom, led)

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
            # Knowledge, in the same browser: the trace offers the visitor's own design, and leads into one of its beds in Compose
            dom = chrome(P, "/knowledge/#species=gaultheria-shallon")
            own = first(dom, r'<p class="kn-case-sw"><a href="([^"]+)"'); bed_id = first(html.unescape(own or ""), r"bed=([\w-]+)")
            check("K7 with a design in this browser the overview offers to trace it in a bed of that design", bool(bed_id) and "Platform journey" in text(first(dom, r'<p class="kn-case-sw">(.*?)</p>') or ""), own)
            if bed_id:
                dom = chrome(P, f"/knowledge/#species=gaultheria-shallon&case=mine&bed={bed_id}"); case = text(first(dom, r'<section class="kn-case"[^>]*>(.*?)</section>') or "")
                go = first(dom, r'href="([^"]*\?open=compose[^"]*)"') or ""
                check("K8 traced in the visitor's design: the bed is theirs, and the way on is that bed in Compose", "your design Platform journey" in case and f"bed={bed_id}" in html.unescape(go) and "species=gaultheria-shallon" in html.unescape(go), case[:160])
                dom = chrome(P, f"/?open=compose&bed={bed_id}&species=gaultheria-shallon", 12000); stage = first(dom, r'<body[^>]*data-stage="([a-z]+)"'); evp = first(dom, r'<div id="cws-evidence"[^>]*>(.*?)</div>\s*</div>') or first(dom, r'(<div id="cws-evidence".{0,1500})') or ""
                check("K9 the link opens Compose on that bed with the species' evidence, which leads back to the trace", stage == "intent" and 'data-pi-mini="gaultheria-shallon"' in evp and "Trace this decision" in evp and f"bed={bed_id}" in html.unescape(evp), f"stage {stage} · evidence panel {len(evp)} chars")
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
