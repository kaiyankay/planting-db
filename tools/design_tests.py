#!/usr/bin/env python3
"""
Tests for the design workspace (brief 2026-11-07 'Phase 2'): runs design/tests.html (engine / model / interpreter invariants, in
JavaScript) and the scripted demonstration journey of design/index.html (?journey=1&fresh=1) in headless Chrome, then checks the
journey's recorded steps and the saved design file.

  python3 -I tools/design_server.py --port 8768     # in another shell (or any static server on the repository root)
  python3 -I tools/design_tests.py [--url http://127.0.0.1:8768]   -> eval/design-tests-<date>.md, exit 1 on any failure

  T  engine tests   every [ok]/[FAIL] line of tests.html (A adapter · B model · C interpreter · D generation · E local edits · F scale)
  J  journey        12 steps: vague text → no geometry invented; 6 × 4 m site with tree, open zone, suggested bed; brief; generate
                    (real ids, inside bed, schedule = objects); 3D same ids; lasso + "too dense here, keep privacy" → scoped
                    preview, nothing outside moved; apply; undo; redo; text-only "move the taller plants away from the tree";
                    export (SVG plant count = model = CSV)
  S  saved file     designs/<id>.json written by the server during the journey (when the design server is the target) and its
                    versions reconcile with the journey
Standard library only; nothing is written except the report.
"""
import json, os, re, subprocess, sys, tempfile
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[sys.argv.index("--url") + 1] if "--url" in sys.argv else "http://127.0.0.1:8768"
CHROME = next((c for c in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"] if os.path.exists(c)), None)
TODAY = date.today().isoformat()
results = []


def _inside(p, poly):
    x, y = p; inside = False; n = len(poly)
    for i in range(n):
        xi, yi = poly[i]; xj, yj = poly[(i - 1) % n]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi: inside = not inside
    return inside


def test(name, ok, detail=""):
    results.append((name, bool(ok), str(detail)[:500])); return bool(ok)


def dom(path, budget=9000):
    with tempfile.TemporaryDirectory() as td:
        r = subprocess.run([CHROME, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-first-run", f"--user-data-dir={td}", "--window-size=1440,900", f"--virtual-time-budget={budget}", "--dump-dom", URL + path], capture_output=True, text=True, timeout=180)
        return r.stdout


if not CHROME:
    test("T0 headless Chrome found", False, "no Chrome binary");
else:
    # T engine tests
    d = dom("/design/tests.html")
    m = re.search(r'<pre id="out"[^>]*>(.*?)</pre>', d, re.S)
    lines = (m.group(1) if m else "").replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&").splitlines()
    for ln in lines:
        mm = re.match(r"\[(ok|FAIL)\] (\S+) (.*?)(?: — (.*))?$", ln)
        if mm: test(f"T·{mm.group(2)} {mm.group(3)}", mm.group(1) == "ok", mm.group(4) or "")
    if not lines: test("T0 tests.html produced output", False, d[:300])
    # J journey
    d = dom("/design/index.html?journey=1&fresh=1", 14000)
    m = re.search(r'<pre id="journey-out"[^>]*>(.*?)</pre>', d, re.S)
    try:
        J = json.loads(m.group(1).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&").replace("&quot;", '"')) if m else None
    except Exception as ex:
        J = None; test("J0 journey output parses", False, repr(ex))
    if J:
        st = {s["name"][:2]: s for s in J["steps"]}
        s1 = st.get("01", {}); test("J1 vague description: intent read, no geometry invented, blockers listed", s1.get("boundary") is False and s1.get("readiness", {}).get("blockers") and "privacy" in (s1.get("values") or {}), f"values {list((s1.get('values') or {}).keys())} · unknown {s1.get('unknowns')}")
        s2 = st.get("02", {}); test("J2 6 × 4 m site: boundary, tree marker (inferred, canopy assumed), suggested open zone and a multi-bed layout proposal (≥ 2 suggested beds, open centre kept)", s2.get("boundary") and any(f["kind"] == "existing-tree" for f in s2.get("features", [])) and any(f["kind"] == "no-plant-zone" for f in s2.get("features", [])) and len(s2.get("beds", [])) >= 2 and all(b["status"] == "ai-suggested" for b in s2["beds"]) and (s2.get("proposal") or {}).get("recommended") == "A" and all(c["valid"] for c in s2["proposal"]["candidates"]), json.dumps([(b["name"], b["area_m2"], b["functions"]) for b in s2.get("beds", [])]))
        s3 = st.get("03", {}); test("J3 layout accepted by the user: every suggested bed confirmed", s3.get("beds") and all(b["status"] == "user-accepted" for b in s3["beds"]), json.dumps([b["status"] for b in s3.get("beds", [])]))
        s4 = st.get("04", {}); test("J4 brief: Screen on the north edge; light stated", any(f["function"] == "z:screen" and f["where"] == "north-edge" for f in s4.get("functions", [])) and s4.get("light", {}).get("status") == "user-stated", json.dumps(s4.get("functions")))
        s5 = st.get("05", {}); n5 = s5.get("plants", 0); test("J5 generated: plant objects with ids, schedule reconciles, operators named, no geometry error", n5 > 5 and sum(r["count"] for r in s5.get("schedule", [])) == n5 and s5.get("validation_ok") and s5.get("operators"), f"{n5} plants · {s5.get('operators')} · edge {s5.get('edge')}")
        test("J5b 2D plan draws one symbol group per plant object", s5.get("symbols_2d") == n5, f"{s5.get('symbols_2d')} symbols for {n5} plants")
        test("J5c every bed of the layout is planted in the one version (multi-bed engine)", len(s5.get("per_bed", [])) >= 2 and all(b["plants"] > 0 for b in s5["per_bed"]) and sum(b["plants"] for b in s5["per_bed"]) == n5, json.dumps([(b["name"], b["plants"]) for b in s5.get("per_bed", [])]))
        s6 = st.get("06", {}); g6 = s6.get("garden") or {}; test("J6 3D garden (three.js) holds one object per plant of the same version", g6.get("plants") == s6.get("model_plants") and g6.get("plants", 0) > 0, f"garden {g6} · model {s6.get('model_plants')}")
        s7 = st.get("07", {}); test("J7 lasso + language: scoped command (selection, reduce_density, preserve screen), preview diff, nothing outside moved", s7.get("command", {}).get("scope") == "selection" and "reduce_density" in s7["command"]["ops"] and "z:screen" in s7["command"]["preserve"] and s7.get("diff", {}).get("removed") and s7.get("untouched_outside_scope") is True, f"targets {len(s7.get('targets') or [])} · removed {len(s7.get('diff', {}).get('removed') or [])}")
        s8 = st.get("08", {}); test("J8 applied: new version with fewer plants = removed ids", s8.get("plants") == n5 - len(s8.get("removed", [])) and s8.get("version"), f"{s8.get('plants')} plants, {len(s8.get('removed', []))} removed")
        g8 = s8.get("garden") or {}; test("J8b 3D garden re-synced after apply: plant count = applied version", g8.get("plants") == s8.get("plants"), f"garden {g8} · model {s8.get('plants')}")
        s9, s10 = st.get("09", {}), st.get("10", {}); test("J9/10 undo returns to the generated version; redo returns to the edit", s9.get("plants") == n5 and s9.get("version", s9.get("current")) and s10.get("plants") == s8.get("plants"), f"undo {s9.get('plants')} · redo {s10.get('plants')}")
        s11 = st.get("11", {}); test("J11 text-only reference 'move the taller plants away from the tree' resolved to a typed move_away command", s11.get("command", {}).get("ops") == ["move_away"], json.dumps({"diff": s11.get("diff"), "notes": s11.get("notes")})[:300])
        s12 = st.get("12", {}); test("J12 export: SVG plant count = model = schedule total", s12.get("svg_plants") == s12.get("model_plants") == s12.get("csv_total") and s12.get("svg_plants"), json.dumps(s12))
    else:
        test("J0 journey ran", False, "no #journey-out in the DOM")
    # F site-wide function edits on the Compose page reach the beds and the planting (M55; ?script=fn replays real clicks)
    d = dom("/design/index.html?script=fn&fresh=1", 14000)
    m = re.search(r'<pre id="script-out"[^>]*>(.*?)</pre>', d, re.S)
    try:
        F = (json.loads(m.group(1).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&").replace("&quot;", '"')) if m else {}).get("fn")
    except Exception as ex:
        F = None; test("F0 function script output parses", False, repr(ex))
    if F:
        has = lambda beds, fn: [n for n, fs in beds.items() if any(x.startswith(fn + "@") for x in fs)]
        test("F1 Site page: every condition keeps its selector; wind and irrigation say they are recorded only, clay says it cannot be assessed", F.get("condition_selects") == 6 and {"wind", "irrigation", "soil_type"} <= set(F.get("unused", [])), json.dumps(F.get("unused")))
        st0 = F["start"]; test("F2 start: the north bed carries Screen and the first design plants a screen row", has(st0["beds"], "z:screen") and F["v1"]["screen"] > 0, json.dumps(st0["beds"]))
        rm = F["removed"]; test("F3 removing the site-wide Screen removes it from the beds that carried it and marks the design stale", not any(x.startswith("z:screen@") for x in rm["brief"]) and not has(rm["beds"], "z:screen") and rm["stale"], json.dumps(rm["beds"]))
        test("F4 the regenerated design has no screen row (the planting follows the change)", F["v2"]["screen"] == 0 and F["v2"]["plants"] != F["v1"]["plants"], f"v1 {F['v1']['plants']} plants / {F['v1']['screen']} screen -> v2 {F['v2']['plants']} / {F['v2']['screen']}")
        ad = F["added"]; sb = has(ad["beds"], "z:screen"); test("F5 adding a site-wide Screen on the east edge adds it only to the bed that lies along that edge, and marks the design stale", "z:screen@east-edge" in ad["brief"] and ad["stale"] and len(sb) == 1 and "East" in sb[0], json.dumps(ad["beds"]))
        test("F6 the screen row is planted in that bed and nowhere else", F["v3"]["screen"] > 0 and F["v3"]["screen_beds"] == sb, f"beds with Screen {sb} · screen plants {F['v3']['screen']} in {F['v3']['screen_beds']}")
        br = F["barrier"]; test("F7 Barrier can be recorded but is labelled not fully supported: site-wide row, bed notes and the option text", "z:barrier" in br["unsupported_notes"] and br["bed_notes"] > 0 and any("Barrier" in o and "recorded only" in o for o in br["option_labels"]) and has(br["beds"], "z:barrier"), json.dumps({k: br[k] for k in ("unsupported_notes", "bed_notes")}))
        test("F8 recording Barrier changes no plant and is reported as unresolved", F["v4"]["same_as_v3"] and F["v4"]["unresolved"], json.dumps(F["v4"])[:300])
    else:
        test("F0 function script ran", False, "no fn block in #script-out")
    # S saved file (only when the design server is the target)
    try:
        import urllib.request
        st = json.load(urllib.request.urlopen(URL + "/api/status", timeout=5))
        ids = st.get("designs", [])
        test("S1 design server reachable; designs saved to designs/", st.get("server") and ids is not None, f"llm: {st.get('llm', {}).get('reason')} · designs {ids}")
        if ids:
            latest = max(ids, key=lambda i: os.path.getmtime(os.path.join(ROOT, "designs", i + ".json")))
            P = json.load(open(os.path.join(ROOT, "designs", latest + ".json"), encoding="utf-8"))
            vs = P.get("versions", []); cur = next((v for v in vs if v["id"] == P.get("current_version_id")), None)
            test("S2 saved project: versions chain by parent id; current version's schedule equals its plant objects", vs and cur and all(v.get("parent_version_id") is None or any(x["id"] == v["parent_version_id"] for x in vs) for v in vs) and sum(r["count"] for r in cur["schedule"]) == len(cur["plant_objects"]), f"{latest}: {len(vs)} versions · current {cur and cur['id']} · {cur and len(cur['plant_objects'])} plants")
            test("S3 saved project: every plant inside its bed polygon (file, not UI)", cur and all(_inside(o["position_m"], next(b for b in P["site"]["beds"] if b["id"] == o["bed_id"])["polygon"]) for o in cur["plant_objects"]))
    except Exception as ex:
        test("S0 server check", False, f"{ex} (run tools/design_server.py for the S tests)")


ok = sum(1 for _, p, _ in results if p); n = len(results)
lines = [f"# Design workspace tests — {TODAY}", "", f"`tools/design_tests.py` against {URL} (headless Chrome). **{ok}/{n} pass.**", "", "| test | result | detail |", "|---|---|---|"] + [f"| {a} | {'pass' if p else '**FAIL**'} | {d.replace('|', '/')} |" for a, p, d in results]
out = os.path.join(ROOT, f"eval/design-tests-{TODAY}.md")
with open(out, "w", encoding="utf-8") as f: f.write("\n".join(lines) + "\n")
print("\n".join(f"[{'ok' if p else 'FAIL'}] {a}" + (f"  — {d}" if not p and d else "") for a, p, d in results)); print(f"{ok}/{n} pass → {os.path.relpath(out, ROOT)}")
sys.exit(0 if ok == n else 1)
