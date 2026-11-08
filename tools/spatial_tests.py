#!/usr/bin/env python3
"""
Spatial proposal tests (brief 2026-11-08 'Phase 2 Spatial Intelligence & Planting Bed Generation'): runs design/tests.html
(engine invariants incl. the new G clip · H spatial proposals · I multi-bed generation · J bed revision groups) and the three demo
scripts of design/index.html (?script=demoA|demoB|demoC&fresh=1 → #script-out) in headless Chrome, then checks what the page
recorded about the Shape → Compose → Grow flow.

  python3 -I tools/design_server.py --port 8768     # in another shell (or any static server on the repository root)
  python3 -I tools/spatial_tests.py [--url http://127.0.0.1:8768]   -> eval/spatial-tests-<date>.md, exit 1 on any failure

  T  engine tests   every [ok]/[FAIL] line of tests.html
  A  Demo A         "6 × 4 m backyard, tree north, privacy along the fence, ecological value, open centre for children" →
                    site model (tree position estimated and labelled), ≥ 2 suggested beds, Screen band on the north edge,
                    open centre kept, three alternatives, accept → Compose (per-bed candidates) → Grow (every plant inside
                    its bed, none in the open area, plan = schedule = 3D)
  B  Demo B         "I want a low-maintenance ecological garden." → no geometry invented, conceptual moves + the question;
                    after W × H the beds appear in metres
  C  Demo C         after A: "Make the north planting bed wider." → the north bed located, before / after geometry,
                    conflicts checked, preview card + ghost on the canvas → Apply → other beds unchanged → Compose updated →
                    Grow banner → partial regeneration preview (unchanged beds byte-equal) → Apply → schedule / export / 3D
                    consistent, previous version still viewable
Standard library only; nothing is written except the report.
"""
import json, os, re, subprocess, sys, tempfile, html
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[sys.argv.index("--url") + 1] if "--url" in sys.argv else "http://127.0.0.1:8768"
CHROME = next((c for c in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"] if os.path.exists(c)), None)
TODAY = date.today().isoformat()
results = []


def test(name, ok, detail=""):
    results.append((name, bool(ok), str(detail)[:500])); return bool(ok)


def dom(path, budget=16000):
    with tempfile.TemporaryDirectory() as td:
        r = subprocess.run([CHROME, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-first-run", f"--user-data-dir={td}", "--window-size=1440,900", f"--virtual-time-budget={budget}", "--dump-dom", URL + path], capture_output=True, text=True, timeout=240)
        return r.stdout


def block(d, el_id):
    m = re.search(rf'<pre id="{el_id}"[^>]*>(.*?)</pre>', d, re.S)
    return json.loads(html.unescape(m.group(1))) if m else None


if not CHROME:
    test("T0 headless Chrome found", False, "no Chrome binary")
else:
    d = dom("/design/tests.html", 12000)
    m = re.search(r'<pre id="out"[^>]*>(.*?)</pre>', d, re.S)
    lines = html.unescape(m.group(1)).splitlines() if m else []
    for ln in lines:
        mm = re.match(r"\[(ok|FAIL)\] (\S+) (.*?)(?: — (.*))?$", ln)
        if mm: test(f"T·{mm.group(2)} {mm.group(3)}", mm.group(1) == "ok", mm.group(4) or "")
    if not lines: test("T0 tests.html produced output", False, d[:300])
    out = block(dom("/design/index.html?script=demos&fresh=1"), "script-out") or {}
    if out.get("error"): test("D0 demo scripts ran without error", False, out["error"][:400])
    A, B, C = out.get("demoA", {}), out.get("demoB", {}), out.get("demoC", {})
    if A:
        sh = A["shape"]; pr = sh["proposal"]
        test("A1 site model from one sentence: 6 × 4 m stated; tree inferred with its position labelled as estimated and canopy assumed; open centre inferred", sh["dims"]["w"] == 6 and sh["dims"]["h"] == 4 and sh["tree"]["status"] == "inferred" and sh["tree"]["estimated_label"] and sh["tree"]["radius"] is None and sh["open_area"]["status"] == "inferred", json.dumps({"tree": sh["tree"], "open": sh["open_area"]}))
        test("A2 spatial proposal: recommended layout A with ≥ 2 beds, all candidates valid, plantable = site − open area", pr["recommended"] == "A" and pr["candidates"][0]["beds"] >= 2 and all(c["valid"] for c in pr["candidates"]) and abs(pr["plantable_m2"] - 20.16) < 0.01, json.dumps(pr["candidates"]))
        test("A3 a Screen band on the north edge; the open centre is kept free of beds; not one inset rectangle", sh["screen_bed_north"] and sh["open_centre_kept"] and len(sh["beds"]) >= 2 and all(b["status"] == "ai-suggested" for b in sh["beds"]), json.dumps([(b["name"], b["area_m2"], b["functions"]) for b in sh["beds"]]))
        test("A4 the Shape panel shows the alternatives, the reasoning, a row per bed and an Accept action", sh["panel_cands"] >= 2 and sh["explanation_lines"] >= 2 and sh["bed_rows"] == len(sh["beds"]) and sh["accept_button"] and sh["stage"] == "site" and sh["overflow_x"] <= 0, json.dumps({k: sh[k] for k in ("panel_cands", "explanation_lines", "bed_rows", "accept_button")}))
        test("A5 accept → every bed confirmed; Compose lists a card per bed with candidates", all(s == "user-accepted" for s in A["accepted"]["beds"]) and A["intent"]["bed_cards"] == len(sh["beds"]) and A["intent"]["candidates"] > 0, json.dumps(A["intent"]))
        g = A["garden"]; test("A6 Grow: every bed planted, every plant inside its bed, none in the open area, plan symbols = plants = schedule, 3D = plants", g["beds"] == len(sh["beds"]) and all(b["plants"] > 0 for b in g["per_bed"]) and g["inside_beds"] and g["in_open"] == 0 and g["valid"] and g["symbols_plan"] == g["plants"] == g["schedule_total"] and A["three"].get("plants") == g["plants"], json.dumps({"per_bed": [(b["name"], b["plants"]) for b in g["per_bed"]], "three": A["three"]}))
    else:
        test("A0 demo A ran", False, json.dumps(out)[:300])
    if B:
        sh = B["shape"]; pr = sh["proposal"]
        test("B1 vague input: values read, no boundary, scale unknown, no bed polygon; proposal is conceptual with its moves and the size question", sh["values"].get("ecology") and sh["values"].get("maintenance_low") and not sh["boundary"] and sh["scale"] == "unknown" and sh["beds"] == 0 and pr["conceptual"] and pr["candidates"] == [] and any("how big" in q.lower() for q in pr["questions"]), json.dumps({"values": sh["values"], "questions": pr["questions"]}))
        test("B2 the Shape panel asks the key question and lists the conceptual moves; the canvas states that there is no geometry", sh["concept_panel"] and "How big" in (sh["question_text"] or "") and sh["moves"] >= 1 and "no site geometry" in sh["canvas_text"], json.dumps({"q": sh["question_text"], "moves": sh["moves"]}))
        sz = B["sized"]; test("B3 after W × H (5 × 4): beds proposed in metres, valid, with alternatives", sz["boundary"] and len(sz["beds"]) >= 1 and all(c["valid"] for c in sz["proposal"]["candidates"]) and sz["bed_rows"] == len(sz["beds"]) and len(sz["proposal"]["candidates"]) >= 2, json.dumps([(b["name"], b["area_m2"]) for b in sz["beds"]] + [[c["id"], c["label"]] for c in sz["proposal"]["candidates"]]))
    else:
        test("B0 demo B ran", False, "")
    if C:
        pv = C["preview"]; test("C1 'Make the north planting bed wider.' → the north bed located; before / after areas; conflicts checked (tree, open area, boundary, other beds); preview card and ghost drawn; impact on the current design stated", pv["ok"] and pv["located"] == "North bed" and pv["changes"][0]["after_m2"] > pv["changes"][0]["before_m2"] and pv["tree_checked"] and pv["preview_card"] and pv["ghost_drawn"] >= 1 and pv["impact"]["plants_affected"] > 0 and pv["stage"] == "site", json.dumps({"changes": pv["changes"], "conflicts": pv["conflicts"], "impact": pv["impact"]}))
        ap = C["applied"]; test("C2 Apply: only the north bed changed (status edited); the other beds are byte-identical; site history grew", ap["north_changed"] and ap["others_unchanged"] and ap["status"] == "user-edited" and ap["history"] >= 1, json.dumps(ap))
        it = C["intent"]; test("C3 Compose shows the updated area for the north bed and candidates per bed", it["bed_cards"] >= 2 and it["north_card_area"] == str(ap["north_area"]) and it["candidates"] > 0, json.dumps(it))
        gb = C["garden_banner"]; test("C4 Grow: the banner names the changed bed and the unaffected beds; nothing was regenerated silently", gb["banner"] and "planting areas changed" in gb["text"] and gb["impact"]["changed"] and len(gb["impact"]["untouched"]) >= 2, gb["text"])
        gp = C["geom_preview"]; test("C5 partial regeneration preview: removals drawn red, plants of unchanged beds byte-equal, additions inside the new outline", gp["preview"] and gp["removed"] > 0 and gp["red_drawn"] == gp["removed"] and gp["kept_exact"] and gp["unchanged"] > 0, json.dumps({k: gp[k] for k in ("removed", "added", "unchanged", "kept_exact")}))
        ad = C["applied_design"]; test("C6 Apply: new version with the old one as parent and still viewable; per-bed counts; plan symbols = schedule = 3D; export consistent", ad["parent"] and ad["old_version_viewable"] and ad["versions"] == 2 and ad["inside_beds"] and ad["valid"] and ad["symbols_plan"] == ad["plants"] == ad["schedule_total"] and C["three"].get("plants") == ad["plants"] and C["export"]["svg_plants"] == C["export"]["csv_total"] == C["export"]["model_plants"] == ad["plants"] and C["export"]["md_has_beds"], json.dumps({"per_bed": [(b["name"], b["plants"]) for b in ad["per_bed"]], "export": C["export"]}))
    else:
        test("C0 demo C ran", False, "")

ok = sum(1 for _, p, _ in results if p); n = len(results)
lines = [f"# Spatial proposal tests — {TODAY}", "", f"`tools/spatial_tests.py` against {URL} (headless Chrome, SwiftShader WebGL). **{ok}/{n} pass.**", "", "| test | result | detail |", "|---|---|---|"] + [f"| {a} | {'pass' if p else '**FAIL**'} | {d.replace('|', '/')} |" for a, p, d in results]
out_path = os.path.join(ROOT, f"eval/spatial-tests-{TODAY}.md")
with open(out_path, "w", encoding="utf-8") as f: f.write("\n".join(lines) + "\n")
print("\n".join(f"[{'ok' if p else 'FAIL'}] {a}" + (f"  — {d}" if not p and d else "") for a, p, d in results)); print(f"{ok}/{n} pass → {os.path.relpath(out_path, ROOT)}")
sys.exit(0 if ok == n else 1)
