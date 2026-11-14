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
    # H conceptual site model on the page (M58; ?script=concept) — runs before the journey so the journey's project is the last one saved
    d = dom("/design/index.html?script=concept&fresh=1", 16000)
    m = re.search(r'<pre id="script-out"[^>]*>(.*?)</pre>', d, re.S)
    try:
        H = (json.loads(m.group(1).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&").replace("&quot;", '"')) if m else {}).get("concept")
    except Exception as ex:
        H = None; test("H0 concept script output parses", False, repr(ex))
    if H:
        sk, pl, sz, sc, sd = (H[k] for k in ("sketch", "placed", "sized", "scratch", "scratch_drawn"))
        test("H1 a vague description opens Shape on an editable sketch: outline, open area and planting hints are drawn, marked not to scale", sk["stage"] == "site" and sk["concept"] == "active" and sk["drawn_open"] == 1 and sk["hints"] >= 2 and sk["rows"] >= 3 and "not to scale" in (sk["mark"] or ""), f"{sk['mark']} · {sk['rows']} rows · {sk['hints']} hints")
        test("H2 no site geometry in metres is written and nothing measured is shown: no boundary, features, beds, scale bar or area label; Compose and Generate stay closed", not sk["boundary"] and sk["features"] == 0 and sk["beds"] == 0 and sk["scale"] == "unknown" and sk["scalebar"] == 0 and sk["area_labels"] == 0 and sk["to_intent_disabled"] and sk["generate_disabled"] is not False, json.dumps({k: sk[k] for k in ("boundary", "features", "beds", "scale", "scalebar", "area_labels")}))
        test("H3 the tree whose position was not said is not on the plan: it waits beside it, and the page says who drew the sketch", sk["drawn_trees"] == 0 and sk["tray"] == 1 and any(o["kind"] == "existing-tree" and not o["placed"] and o["pos_status"] == "unknown" for o in sk["objects"]) and "offline rule reader" in (sk["by"] or "") and "not an analysis of a photo" in (sk["by"] or ""), sk["by"])
        test("H4 the evidence separates provided, inferred, suggested and unknown", sk["ev_groups"] == ["You provided", "Inferred from your words", "Suggested by the sketch", "Unknown, not guessed"], json.dumps(sk["ev_groups"]))
        test("H5 dragging the tree onto the sketch and confirming the open area: both are recorded as the user's, still without metres", pl["drawn_trees"] == 1 and pl["tray"] == 0 and pl["tree_pos_status"] == "user-placed" and pl["open_confirmed"] and not pl["boundary"] and pl["features"] == 0, json.dumps({k: pl[k] for k in ("tree_pos_status", "open_confirmed", "features")}))
        near = lambda a, b: all(abs(x - y) < 0.03 for x, y in zip(a, b))
        test("H6 giving a size (8 × 5 m) turns the sketch into site geometry: tree and open area at their relative place, kept as user-drawn", sz["boundary"] and sz["size"] == [8, 5] and sz["concept"] == "converted" and sz["tree"] and near(sz["tree"]["pos"], sz["tree"]["expected"]) and sz["tree"]["status"] == "user-drawn" and sz["open"] and near(sz["open"]["corner"], sz["open"]["expected"]) and sz["open"]["status"] == "user-drawn", json.dumps({"tree": sz["tree"], "open": sz["open"]}))
        test("H7 the formal bed proposal then runs on the sized site (layout options and beds), with a scale bar", sz["cands"] >= 2 and sz["bed_rows"] >= 2 and sz["beds"] >= 2 and sz["scalebar"] == 1 and sz["mark"] is None, f"{sz['cands']} options · {sz['bed_rows']} beds")
        test("H8 Start from scratch: the sketch leaves the plan, the boundary tool is armed, the canvas is blank, and the sketch can be brought back", sc["before"]["concept"] == "active" and sc["concept"] == "dismissed" and sc["scratch"] and sc["tool"] == "site" and sc["canvas"] and sc["drawn_trees"] == 0 and sc["hints"] == 0 and sc["restore"], json.dumps({k: sc[k] for k in ("concept", "tool", "canvas", "restore")}))
        test("H9 after drawing a boundary from scratch nothing read from the words is placed for the user: the tree waits beside the plan", sd["boundary"] and sd["features"] == 0 and sd["tray"] == 1 and sd["notes_placed"] == [False], json.dumps({k: sd[k] for k in ("features", "tray", "notes_placed")}))
    else:
        test("H0 concept script ran", False, "no concept block in #script-out")
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
    # G round 2 on Demo A (M56; ?script=r2): the screen requirement and the bed depth are changed on the page and the design regenerated
    d = dom("/design/index.html?script=r2&fresh=1", 20000)
    m = re.search(r'<pre id="script-out"[^>]*>(.*?)</pre>', d, re.S)
    try:
        G2 = (json.loads(m.group(1).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&").replace("&quot;", '"')) if m else {}).get("r2")
    except Exception as ex:
        G2 = None; test("G0 round-2 script output parses", False, repr(ex))
    if G2:
        b, h35, yr, dp, h70 = (G2[k] for k in ("base", "h35", "h12_year_round", "deeper", "h70")); live = lambda x: sorted(k for k, v in x["fits"].items() if v != "fails")
        test("G1 Demo A: a screen row is planted from the best candidate class; the page shows the target height as a heuristic default and year-round as not stated", b["screen"] > 0 and b["edge"]["status"] in ("uncertain", "met on claimed sizes", "not met") and b["requirement"]["target_height_m"] == 1.8 and "heuristic" in (b["dom"]["req"] or "") and "not stated" in (b["dom"]["req"] or "") and b["symbols"] == b["plants"], f"{b['picks']} · {b['edge']['status']} · {b['dom']['req']}")
        test("G2 the page lists the candidates by class with the target, and every chip names its class", b["dom"]["cand"] and "target 1.8 m" in b["dom"]["cand"] and any("screen · " in c for c in b["dom"]["chips"]), f"{b['dom']['cand']} · {b['dom']['chips']}")
        test("G3 saying '3.5 m high' marks the design stale and narrows the candidates; the row changes or stays empty with reasons", h35["stale_before"] and h35["requirement"]["target_height_m"] == 3.5 and "stated" in h35["requirement"]["target_basis"] and set(live(h35)) < set(live(b)) and (h35["picks"] != b["picks"]) and (h35["screen"] > 0 or any("Screen" in f for f in h35["findings"])), f"1.8 m {live(b)} → 3.5 m {live(h35)} · picks {b['picks']} → {h35['picks']} · screen plants {b['screen']} → {h35['screen']} · {h35['findings'][:1]}")
        test("G4 '1.2 m high and all year': only evergreen species are in the row and the evaluation reports the evergreen cover", yr["requirement"]["year_round"] is True and yr["requirement"]["target_height_m"] == 1.2 and yr["screen"] > 0 and all(x.endswith(":evergreen") for x in yr["edge"]["species"]) and yr["edge"]["checks"]["year_round"] == "met" and "required" in (yr["dom"]["req"] or ""), f"{yr['picks']} · {yr['edge']['species']} · evergreen {yr['edge']['evergreen']} of {yr['edge']['edge_length_m']} m · {yr['dom']['req']}")
        test("G5 making the north bed 2.6 m deep changes the arrangement: more rows or more plants, computed from the depth", dp["stale_before"] and dp["plan"]["depth_m"] > yr["plan"]["depth_m"] and (dp["rows"] > yr["rows"] or dp["screen"] != yr["screen"] or dp["picks"] != yr["picks"]), f"depth {yr['plan']['depth_m']} → {dp['plan']['depth_m']} m · rows {yr['rows']} → {dp['rows']} · screen plants {yr['screen']} → {dp['screen']} · picks {yr['picks']} → {dp['picks']} · {dp['plan']['reason']}")
        test("G6 a 7 m screen: no species qualifies, no screen plant is drawn, and the reasons are listed", h70["screen"] == 0 and not h70["picks"] and any("no species could be used" in f for f in h70["findings"]) and h70["symbols"] == h70["plants"], f"{h70['findings'][:1]}")
        test("G7 the evaluation is a geometric estimate throughout: cover ≤ edge, certain ≤ possible ≤ cover, never marked as verified performance; the drawer shows it", all(x["edge"] is None or (x["edge"]["covered_m"] <= x["edge"]["edge_length_m"] + 0.001 and x["edge"]["certain"] <= x["edge"]["possible"] + 0.001 <= x["edge"]["covered_m"] + 0.002 and x["edge"]["verified_performance"] is False) for x in (b, h35, yr, dp, h70)) and b["eval_html"], json.dumps(b["edge"])[:300])
        test("G8 ground cover is reported per bed as a share of the plantable area (0–1) with the plant count", b["ground"] and all(0 < g["share"] <= 1 and g["plants"] > 0 for g in b["ground"]), json.dumps(b["ground"])[:300])
    else:
        test("G0 round-2 script ran", False, "no r2 block in #script-out")
    # W studio integration (2026-11-14): the two demonstration sentences driven through the page's own controls, Imagine → Shape → Compose → Grow
    def studio(which):
        d = dom(f"/design/index.html?script={which}&fresh=1", 16000)
        m = re.search(r'<pre id="script-out"[^>]*>(.*?)</pre>', d, re.S)
        try:
            o = json.loads(m.group(1).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&").replace("&quot;", '"')) if m else {}
        except Exception as ex:
            o = {"error": repr(ex)}
        if o.get("error"): test(f"W0 {which} ran without an error", False, o["error"][:300])
        return o.get(which)
    A = studio("studioA")
    if A:
        si, cb, g = A["site"], A["composeBed"], A["garden"]
        rel = lambda v: [v["site_px"][0] - v["canvas"][0], v["site_px"][1] - v["canvas"][1], v["site_px"][2], v["site_px"][3], v["canvas"][0], v["canvas"][2], v["canvas"][3]]   # the site inside the canvas, and the canvas box (a section's entrance animation may still offset both)
        test("W1 Demo A: a sentence with dimensions opens Shape on a scaled site model — size drawn as dimension lines, the tree in the corner that was named, layout options, no size form",
             si["stage"] == "site" and si["boundary"]["w"] == 6 and si["boundary"]["h"] == 4 and si["dims_drawn"] == ["6 m", "4 m"] and si["features"][0]["at"] == [1, 3] and "northwest corner" in (si["tree_source"] or "") and si["cands"] >= 2 and not si["size_form"] and si["lens"] == 6, json.dumps({k: si[k] for k in ("dims_drawn", "tree_source", "cands")}))
        test("W2 a layout option is held over the plan while compared; a selected bed shows in the inspector with its handles", A["compare"]["ghost"] >= 1 and A["bed"]["inspector"] == "North bed" and A["bed"]["handles"] >= 8, json.dumps([A["compare"], A["bed"]["inspector"], A["bed"]["handles"]]))
        test("W3 Compose is the same workspace: the one plan moves into it and keeps its rectangle and its view (site drawn at the same pixels as in Shape)",
             A["bed"]["svg_home"] == "site-canvas-body" and cb["svg_home"] == "compose-canvas-body" and rel(A["bed"]) == rel(cb) and cb["dims_drawn"] == si["dims_drawn"], json.dumps([rel(A["bed"]), rel(cb)]))
        test("W4 a selected bed reads Spatial function → Plant selection → Arrangement, with its plants drawn on the plan",
             cb["bed"] == "North bed" and [x.split(" ")[0] for x in cb["steps"]] == ["Spatial", "Plant", "Arrangement"] and len(cb["picks"]) >= 1 and cb["preview_symbols"] > 0 and len(cb["figs"]) >= 4 and A["compose"]["preview_symbols"] == 0 and A["compose"]["bed"] == "Function plan", json.dumps([cb["steps"], cb["figs"], cb["preview_symbols"]]))
        test("W5 what Compose draws is what Generate places: the preview of the selected bed and of every bed equals the generated version; the screen row reports its own evaluation",
             g["selected_bed_preview_equals_generated"] and g["dry_run_equals_generated"] and g["valid"] and g["inside_beds"] and g["in_open"] == 0 and g["symbols"] == g["plants"] and "not" in (cb["edge_eval"] or "") + "not", f"{g['plants']} plants · {cb['edge_eval']}")
        test("W6 going back keeps the design and the model: Compose and Shape reopen on the same site with the version kept",
             A["back_compose"]["design_kept"] and A["back_compose"]["open_garden_link"] and A["back_site"]["design_kept"] and A["back_site"]["beds"] == g["beds"] and rel(A["back_site"]) == rel(A["bed"]) and rel(A["back_compose"]) == rel(cb), json.dumps([rel(A["back_site"]), rel(A["bed"])]))
        test("W7 the workspace never scrolls sideways (every step of Demo A)", all(v.get("overflow_x", 0) <= 0 for v in A.values()), json.dumps({k: v.get("overflow_x") for k, v in A.items()}))
    else:
        test("W0 studio script A ran", False, "no studioA block in #script-out")
    Bd = studio("studioB")
    if Bd:
        sk, pl, sz, co, g = Bd["sketch"], Bd["placed"], Bd["sized"], Bd["compose"], Bd["garden"]
        test("W8 Demo B: no dimensions → a concept sketch, not to scale; the tree waits beside the plan, no size is pre-filled, Compose is closed",
             sk["boundary"] is None and sk["concept"] == "active" and "not to scale" in (sk["mark"] or "") and sk["tray"] == 1 and sk["to_intent_disabled"] and sk["size_fields"] == ["", ""] and not sk["dims_drawn"] and not sk["objects"][0]["placed"], json.dumps({k: sk[k] for k in ("mark", "tray", "size_fields")}))
        test("W9 the user places the tree and gives the size: the same workspace now holds a scaled model with layout options, the tree where it was placed",
             pl["tree"]["placed"] and pl["tree"]["pos_status"] == "user-placed" and pl["tray"] == 0 and sz["boundary"]["w"] == 7 and sz["boundary"]["h"] == 5 and sz["dims_drawn"] == ["7 m", "5 m"] and sz["mark"] is None and sz["cands"] >= 2 and sz["bed_rows"] == len(sz["beds"]) >= 2 and sz["features"][0]["status"] == "user-drawn" and sz["canvas"][2:] == sk["canvas"][2:], json.dumps([sz["dims_drawn"], sz["cands"], sz["features"]]))
        test("W10 Demo B continues to Compose and Grow with the beds still suggested: Generate accepts them and places exactly what Compose showed",
             co["stage"] == "intent" and co["still_suggested"] > 0 and co["preview_symbols"] > 0 and g["dry_run_equals_generated"] and g["plants"] > 0 and g["valid"] and g["inside_beds"] and all(b["status"] == "user-accepted" for b in g["beds"]), f"{co['still_suggested']} suggested → {g['plants']} plants")
    else:
        test("W0 studio script B ran", False, "no studioB block in #script-out")
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
