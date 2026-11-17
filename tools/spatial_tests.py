#!/usr/bin/env python3
"""
Spatial proposal tests (brief 2026-11-08 'Phase 2 Spatial Intelligence & Planting Bed Generation'): runs design/tests.html
(engine invariants incl. the new G clip · H spatial proposals · I multi-bed generation · J bed revision groups) and the three demo
scripts of design/index.html (?script=demoA|demoB|demoC&fresh=1 → #script-out) in headless Chrome, then checks what the page
recorded about the Shape → Compose → Grow flow.

  python3 -I tools/design_server.py --port 8768     # in another shell (or any static server on the repository root)
  python3 -I tools/spatial_tests.py [--url http://127.0.0.1:8768]   -> eval/spatial-tests-<date>.md, exit 1 on any failure

  T  engine tests   every [ok]/[FAIL] line of tests.html
  A  Demo A         "6 × 4 m backyard, tree north, privacy along the north fence, ecological value, open centre for children" →
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
        test("B2 the Shape panel asks the key question and lists the conceptual moves; the canvas shows a sketch marked as not to scale, and no site geometry in metres exists", sh["concept_panel"] and "How big" in (sh["question_text"] or "") and sh["moves"] >= 1 and "not to scale" in sh["canvas_text"] and sh["boundary"] is False and sh["beds"] == 0 and sh["scale"] == "unknown", json.dumps({"q": sh["question_text"], "moves": sh["moves"]}))
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

# ---------------------------------------------------------------- V4.2 · an irregular site (design/js/boundary.js, ?script=v42shape)
#  X  the site outline is real project geometry: a sketch outline is shaped without any metre, area or count appearing, and arrives in
#     metres with the same corners once a size is said; on a measured site a corner is trimmed, two corners make an L, a keep-out sits
#     in the inner corner; beds in the way are previewed, never clipped silently; refused outlines say why; undo restores; the engine
#     plants inside the irregular outline; the saved file reads back identical; a later trim marks the arrangement as made for an older outline.
if CHROME:
    X = (block(dom("/design/index.html?script=v42shape&fresh=1", 40000), "script-out") or {})
    if X.get("error") or "v42shape" not in X: test("X0 the irregular-site replay ran without error", False, (X.get("error") or "no record")[:400])
    else:
        k = X["v42shape"]; a = k["sketch"]; b = k["metric"]; js = json.dumps
        test("X1 a sketch outline is shaped as a sketch: a notch adds two corners to the unitless outline, no boundary in metres exists, and neither the editor nor the inspector shows a length or an area",
             a["concept"] and a["began"] and a["corners1"] == a["corners0"] + 2 and a["still_concept"] and a["boundary_after"] is None and len(a["frame"].get("outline") or []) == a["corners1"] and not a["metric_text_while_editing"] and not a["metric_text_in_sketch"] and a["versions"] == 0, js({x: a[x] for x in ("corners0", "corners1", "still_concept", "metric_text_while_editing", "metric_text_in_sketch")}))
        m = a["metric"]; test("X2 a stated size turns the shaped sketch into metres with the same corners: the outline fills 8 × 6 m, encloses less than the rectangle, the tree is inside it and every proposed bed lies inside it",
             a["same_topology"] and m["corners"] == a["corners1"] and abs(m["bbox"]["w"] - 8) < .02 and abs(m["bbox"]["h"] - 6) < .02 and 0 < m["area_m2"] < 48 and m["tree_inside"] and len(m["beds"]) >= 2 and all(x["inside"] for x in m["beds"]), js({"corners": m["corners"], "area": m["area_m2"], "status": m["status"], "beds": len(m["beds"])}))
        r = b["rect"]; t = b["trim"]; rv = b["review"]
        test("X3 trimming a corner makes a five-cornered working outline with its handles on the plan, and the first Apply only opens a review: the beds in the way are named with their area before and after, and the project is untouched",
             len(r["boundary"]) == 4 and t["corners"] == 5 and t["page"]["handles"] == 5 and rv["opened"] and not rv["applied"] and rv["boundary_unchanged"] and rv["beds_unchanged"] and len(rv["impact"]["beds"]) >= 1 and all(x["confirmed"] and x["after_m2"] < x["before_m2"] for x in rv["impact"]["beds"]) and rv["impact"]["lost_m2"] > 0, js(rv["impact"]))
        test("X4 Keep editing and Cancel change nothing: the outline and every bed are as they were", b["kept_editing"]["session"] and not b["kept_editing"]["review"] and b["kept_editing"]["boundary_unchanged"] and not b["cancelled"]["session"] and b["cancelled"]["boundary_unchanged"] and b["cancelled"]["beds_unchanged"], js([b["kept_editing"], b["cancelled"]]))
        pg = b["pentagon"]; test("X5 applying after the review writes the pentagon to the project (user-drawn), clips the beds to it, and records one undo step",
             pg["applied"] and pg["corners"] == 5 and pg["area_m2"] < r["area_m2"] and pg["status"] == "user-drawn" and all(x["inside"] for x in pg["beds"]) and pg["history"] >= 1, js({"area": [r["area_m2"], pg["area_m2"]], "beds": [(x["name"], x["area_m2"], x["status"]) for x in pg["beds"]]}))
        l = b["lshape"]; test("X6 two added corners and a dragged one make an L: a concave outline of more corners and less area, every bed still inside it; the session's Undo and Redo step through the same edits",
             l["applied"] and l["corners"] == pg["corners"] + 2 and l["area_m2"] < pg["area_m2"] and l["concave"] >= 1 and all(x["inside"] for x in l["beds"]) and b["session_undo"]["corners"] < b["l_edit"]["corners"] and b["session_undo"]["redo_available"] == 2 and b["session_redo"]["same"], js({"corners": l["corners"], "area": l["area_m2"], "undo": b["session_undo"], "redo": b["session_redo"]}))
        ko = b["keepout"]; test("X7 a keep-out in the inner corner lies inside the outline and the beds stay inside the outline", len(ko["zone"]) >= 1 and all(z["inside"] for z in ko["zone"]) and all(x["inside"] for x in ko["beds"]), js(ko["zone"]))
        rf = b["refused"]; test("X8 outlines that cannot be a site are refused with a reason a person can act on — one that crosses itself, one with two corners, one with no area, one that would leave the existing tree outside — a third corner cannot be deleted, and the project is unchanged",
             not rf["crossing"]["ok"] and any("cross" in x for x in rf["crossing"]["reasons"]) and rf["crossing"]["apply_disabled"] and rf["crossing"]["alert"] and not rf["two_corners"]["ok"] and "3 corners" in rf["two_corners"]["reasons"][0] and not rf["zero_area"]["ok"] and rf["zero_area"]["reasons"] and rf["cannot_delete_below_three"] and rf["unchanged"] and not rf["tree_outside"]["ok"] and "tree" in rf["tree_outside"]["reasons"][0] and rf["tree_outside"]["boundary_unchanged"], js({x: rf[x] for x in ("crossing", "two_corners", "zero_area", "tree_outside")}))
        test("X9 the Shape page's own Undo takes an applied outline back with the beds it clipped, and applying it again gives the same outline", b["site_undo"]["boundary_back_to_pentagon"] and b["site_redo"]["applied"] and b["site_redo"]["same"], js([b["site_undo"], b["site_redo"]]))
        g = b["generated"]; test("X10 the engine plants the irregular site: every plant object stands inside the outline and inside its own bed, none in the keep-out", bool(g) and g["plants"] > 0 and g["all_inside_outline"] and g["all_in_their_bed"] and g["in_keep_out"] == 0 and not g["stale"], js({x: g[x] for x in ("plants", "all_inside_outline", "all_in_their_bed", "in_keep_out")} if g else {}))
        test("X11 the design read back from its exported text and from browser storage has the identical outline, beds, zones and plant positions", b["reload"]["export_identical"] and b["reload"]["local_identical"] and b["reload"]["corners"] == l["corners"], js(b["reload"]))
        st = b["stale"]; test("X12 a further trim after generating does not touch the plants: the version is kept, the review names the planting, and Grow says the arrangement was made for other ground",
             st["applied"] and st["version_kept"] and st["review_named_planting"] and (st["geometry_stale"] or st["plants_outside_outline"] >= 0) and bool(st["banner"]), js(st))
        dp = k.get("depth") or {}; en = dp.get("engine") or {}; of = dp.get("offered") or {}
        test("X14 Screen depth is computed, not promised: the band's basis no longer says a second row fits; where the engine's row plan says it does not, Compose gives the depth that plan needs for this bed and offers a preview of a deeper bed — taking the offer opens a preview in Shape and changes nothing until applied",
             bool(dp) and not dp["promises_second_row"] and "one row" in dp["basis"] and dp["double_disabled"] is True and en.get("feasible") is False and dp["need_m"] == en.get("needs_depth_m") and abs(dp["by_m"] - (en["needs_depth_m"] - en["depth_m"])) < 0.1001 and str(en["needs_depth_m"]) in (dp["offer"] or "") and of.get("stage") == "site" and of.get("preview") and of.get("bed_unchanged") and of["change"] and of["change"][0]["after_m2"] > of["change"][0]["before_m2"], js({"basis": dp.get("basis"), "engine": en, "offer": dp.get("offer"), "offered": of}))
        # ---- V4.3 P0
        ins = l.get("inspector") or {}; cu = ins.get("current") or {}
        test("X15 after the outline is cut to an L the Shape inspector prints the areas of the outline as it is now (site, plantable, beds) and names the earlier proposal's figure only as such",
             bool(ins) and f'{cu.get("plantable_m2")} m² plantable' in ins["text"] and f'{cu.get("site_m2")} m² site' in ins["text"] and f'{cu.get("bed_m2")} m² in' in ins["text"] and (not ins["stale"] or ins["proposal_plantable_m2"] == cu.get("plantable_m2") or (str(ins["proposal_plantable_m2"]) not in ins["text"] and "earlier outline" in (ins["was"] or ""))), js(ins))
        sc = (g or {}).get("screen") or []
        test("X16 on the trimmed outline the Screen bed is planted along its straight north stretch; the short chamfered stretch that is too shallow is left open and said so; no plant fails validation",
             len(sc) == 1 and sc[0]["placed"] > 0 and sc[0]["errors"] == 0 and 0 < sc[0]["covered_m"] < sc[0]["edge_length_m"] and any(x["rows"] == 0 and x["placed"][0] == 0 for x in sc[0]["stretches"]) and any(x["rows"] >= 1 and x["placed"][0] > 0 for x in sc[0]["stretches"]) and any("stretch" in u for u in sc[0]["said"]), js(sc))
        v43 = k.get("v43") or {}; sn = v43.get("snap") or {}; rm = v43.get("remove") or {}
        test("X17 corners snap to 5 cm by default and the editor offers a switch: with it off the same drag lands to the millimetre",
             sn.get("offered") and sn.get("on_by_default") and abs(sn["on"][0] * 20 - round(sn["on"][0] * 20)) < 1e-6 and abs(sn["off"][0] * 20 - round(sn["off"][0] * 20)) > 1e-3, js(sn))
        test("X18 an outline that would leave a bed too small does not remove it in passing: the review names the bed with its area and the minimum, Apply is disabled and commit is refused until the user ticks the removal; then it applies, and Undo brings the bed back",
             rm.get("review_first") and rm.get("refused_without_tick") and rm.get("east") in (rm.get("named") or []) and rm.get("apply_disabled") and rm.get("beds_unchanged") and "would be removed" in (rm.get("warning") or "") and "smallest bed" in (rm.get("warning") or "") and rm.get("applied") and rm.get("bed_gone") and rm.get("undo_restores"), js(rm))
        lt = k.get("light") or {}; vals = [o["value"] for o in lt.get("options", [])]
        fl = lt.get("filtered") or {}; dpz = lt.get("deep") or {}; vg = lt.get("vague") or {}
        test("X19 the Site page offers filtered shade and deep shade beside full sun, part shade and the vague word; the chosen word is stored as stated",
             vals == ["", "full-sun", "part-shade", "filtered-shade", "deep-shade", "shade"] and (lt.get("stored") or {}).get("value") == "filtered-shade" and (lt.get("stored") or {}).get("status") == "user-stated", js(lt.get("options")))
        test("X20 the kinds stay apart: a precise word excludes only where no such light is recorded (mismatch), the vague word excludes nothing and reads site-vague, and Compose prints a short reason beside every selected plant whose light is conditional",
             set(fl.get("excluded", [])) == {"achillea-millefolium", "arctostaphylos-uva-ursi"} and len(dpz.get("excluded", [])) == 7 and vg.get("excluded") == [] and any("site-vague" in v for v in vg.get("light", {}).values()) and all(v.endswith("mismatch") for kx, v in fl.get("light", {}).items() if kx in fl["excluded"])
             and all(any(w["kind"] == pk["kind"] for w in vg["why"]) for pk in vg.get("picks", []) if pk["light"] == "conditional") and (len(vg.get("why", [])) > 0 or not any(pk["light"] == "conditional" for pk in vg.get("picks", []))), js({"filtered": fl.get("excluded"), "deep": dpz.get("excluded"), "vague_why": vg.get("why"), "vague_picks": vg.get("picks")}))
        test("X13 the page never scrolls sideways during the replay", k["overflow_x"] <= 0, js(k["inner"]))

ok = sum(1 for _, p, _ in results if p); n = len(results)
lines = [f"# Spatial proposal tests — {TODAY}", "", f"`tools/spatial_tests.py` against {URL} (headless Chrome, SwiftShader WebGL). **{ok}/{n} pass.**", "", "| test | result | detail |", "|---|---|---|"] + [f"| {a} | {'pass' if p else '**FAIL**'} | {d.replace('|', '/')} |" for a, p, d in results]
out_path = os.path.join(ROOT, f"eval/spatial-tests-{TODAY}.md")
with open(out_path, "w", encoding="utf-8") as f: f.write("\n".join(lines) + "\n")
print("\n".join(f"[{'ok' if p else 'FAIL'}] {a}" + (f"  — {d}" if not p and d else "") for a, p, d in results)); print(f"{ok}/{n} pass → {os.path.relpath(out_path, ROOT)}")
sys.exit(0 if ok == n else 1)
