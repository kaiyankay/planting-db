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
        r = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-first-run", f"--user-data-dir={td}", "--window-size=1440,900", f"--virtual-time-budget={budget}", "--dump-dom", URL + path], capture_output=True, text=True, timeout=180)
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
        s2 = st.get("02", {}); test("J2 6 × 4 m site: boundary, tree marker (inferred, canopy assumed), suggested open zone and bed", s2.get("boundary") and any(f["kind"] == "existing-tree" for f in s2.get("features", [])) and any(f["kind"] == "no-plant-zone" for f in s2.get("features", [])) and s2.get("beds") and s2["beds"][0]["status"] == "ai-suggested", json.dumps(s2.get("features")))
        s3 = st.get("03", {}); test("J3 bed accepted by the user", s3.get("bed", {}).get("status") == "user-accepted")
        s4 = st.get("04", {}); test("J4 brief: Screen on the north edge; light stated", any(f["function"] == "z:screen" and f["where"] == "north-edge" for f in s4.get("functions", [])) and s4.get("light", {}).get("status") == "user-stated", json.dumps(s4.get("functions")))
        s5 = st.get("05", {}); n5 = s5.get("plants", 0); test("J5 generated: plant objects with ids, schedule reconciles, operators named, no geometry error", n5 > 5 and sum(r["count"] for r in s5.get("schedule", [])) == n5 and s5.get("validation_ok") and s5.get("operators"), f"{n5} plants · {s5.get('operators')} · edge {s5.get('edge')}")
        s7 = st.get("07", {}); test("J7 lasso + language: scoped command (selection, reduce_density, preserve screen), preview diff, nothing outside moved", s7.get("command", {}).get("scope") == "selection" and "reduce_density" in s7["command"]["ops"] and "z:screen" in s7["command"]["preserve"] and s7.get("diff", {}).get("removed") and s7.get("untouched_outside_scope") is True, f"targets {len(s7.get('targets') or [])} · removed {len(s7.get('diff', {}).get('removed') or [])}")
        s8 = st.get("08", {}); test("J8 applied: new version with fewer plants = removed ids", s8.get("plants") == n5 - len(s8.get("removed", [])) and s8.get("version"), f"{s8.get('plants')} plants, {len(s8.get('removed', []))} removed")
        s9, s10 = st.get("09", {}), st.get("10", {}); test("J9/10 undo returns to the generated version; redo returns to the edit", s9.get("plants") == n5 and s9.get("version", s9.get("current")) and s10.get("plants") == s8.get("plants"), f"undo {s9.get('plants')} · redo {s10.get('plants')}")
        s11 = st.get("11", {}); test("J11 text-only reference 'move the taller plants away from the tree' resolved to a typed move_away command", s11.get("command", {}).get("ops") == ["move_away"], json.dumps({"diff": s11.get("diff"), "notes": s11.get("notes")})[:300])
        s12 = st.get("12", {}); test("J12 export: SVG plant count = model = schedule total", s12.get("svg_plants") == s12.get("model_plants") == s12.get("csv_total") and s12.get("svg_plants"), json.dumps(s12))
    else:
        test("J0 journey ran", False, "no #journey-out in the DOM")
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
