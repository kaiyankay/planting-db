#!/usr/bin/env python3
"""
Tests for topography and planting systems (brief 2026-11-21). Two parts, both in headless Chrome:

  U  unit tests     the T (terrain.js) and Y (presets.js + engine) lines of design/tests.html
  A  Demo A         design/index.html?script=topo — terrain: unknown → picture check → conceptual slope → edited ground →
                    slope gate → generated design standing on the ground (design/js/toposcript.js records every step)
  B  Demo B         the same replay — planting systems on the same site, same knowledge snapshot, same seed
  AB both together

  python3 -I tools/design_server.py --port 8768     # in another shell
  python3 -I tools/topo_tests.py [--url http://127.0.0.1:8768]
      -> eval/topo-tests-<date>.md  and  docs/topography-presets/demo-data.json (the recorded before/after data); exit 1 on any failure

Every check reads what the page recorded from its own model, engine and DOM; nothing is recomputed here except simple comparisons.
Standard library only. The replay rewrites designs/demo-topo.json when the design server is the target (delete it before committing).
"""
import json, os, re, subprocess, sys, tempfile
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[sys.argv.index("--url") + 1] if "--url" in sys.argv else "http://127.0.0.1:8768"
CHROME = next((c for c in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"] if os.path.exists(c)), None)
TODAY = date.today().isoformat()
results = []


def test(name, ok, detail=""):
    results.append((name, bool(ok), str(detail)[:600])); return bool(ok)


def dom(path, budget=9000):
    with tempfile.TemporaryDirectory() as td:
        r = subprocess.run([CHROME, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-first-run", f"--user-data-dir={td}", "--window-size=1440,900", f"--virtual-time-budget={budget}", "--dump-dom", URL + path], capture_output=True, text=True, timeout=600)
        return r.stdout


def unesc(s):
    return s.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"').replace("&#39;", "'").replace("&amp;", "&")


if not CHROME:
    test("U0 headless Chrome found", False, "no Chrome binary")
else:
    d = dom("/design/tests.html", 20000)
    m = re.search(r'<pre id="out"[^>]*>(.*?)</pre>', d, re.S)
    lines = unesc(m.group(1) if m else "").splitlines()
    head = lines[0] if lines else ""
    test("U0 design/tests.html: every engine test passes (the earlier suites included)", bool(re.match(r"(\d+)/\1 pass", head)), head)
    seen = 0
    for ln in lines:
        mm = re.match(r"\[(ok|FAIL)\] ([TY]\d+) (.*?)(?: — (.*))?$", ln)
        if mm: seen += 1; test(f"U·{mm.group(2)} {mm.group(3)}", mm.group(1) == "ok", mm.group(4) or "")
    test("U1 the terrain (T) and planting-system (Y) unit tests ran", seen >= 34, f"{seen} lines")

    d = dom("/design/index.html?script=topo&fresh=1", 90000)
    m = re.search(r'<pre id="script-out"[^>]*>(.*?)</pre>', d, re.S)
    try: R = json.loads(unesc(m.group(1))) if m else {}
    except Exception as ex: R = {"error": f"unreadable script output: {ex}"}
    K = R.get("topo") or {}
    test("R0 the replay ran to the end without an error", K.get("done") is True and not R.get("error"), (R.get("error") or "")[:400] or f"{len(K.get('stops', []))} stops")
    A, B, AB = K.get("A") or {}, K.get("B") or {}, K.get("AB") or {}
    if K.get("done"):
        os.makedirs(os.path.join(ROOT, "docs/topography-presets"), exist_ok=True)
        with open(os.path.join(ROOT, "docs/topography-presets/demo-data.json"), "w", encoding="utf-8") as f: json.dump({"recorded": TODAY, "by": "tools/topo_tests.py ← design/js/toposcript.js (?script=topo)", **K}, f, indent=1, ensure_ascii=False)

        # ---------------------------------------------------------------- Demo A
        s, u = A["site"], A["unknown"]
        test("A1 Imagine → Shape: the sentence gives an editable 8 × 5 m site model with the tree and four suggested beds", s["stage"] == "site" and s["size_m"] == [8, 5] and s["scale"] == "user-stated" and len(s["tree"]) == 1 and len(s["beds"]) == 4 and s["light"]["value"] == "part-shade", f"{[b['name'] for b in s['beds']]}")
        test("A2 without a terrain the elevation is UNKNOWN: no grid, no height, no contour, and the page says so", u["terrain"] is None and u["bar"] == "unknown" and u["sampleZ"] is None and u["contours_drawn"] == 0 and "unknown" in u["bar_text"].lower(), u["analyse"])
        p = A["photo"]
        test("A3 an ordinary (colour) picture is kept as a reference and shown as 'not analysed'; it cannot become a terrain, even if confirmed", p["use"] == "reference-only" and p["analysed"] is False and p["says_not_analysed"] == "not analysed" and p["confirm_button"] is False and p["terrain_after"] is False and p["refused"] is True, f"colour share {p['colour_share']}")
        g = A["gray"]
        test("A4 a grayscale picture is not used until the user confirms it is a heightmap", g["use"] == "needs-confirmation" and g["analysed"] is False and g["confirm_button"] and g["terrain_before_confirm"] is False and g["unconfirmed"] is True)
        gd = g["draft"]
        test("A5 a confirmed heightmap without an elevation range has RELATIVE heights only: conceptual, no metres, no slope — and it changes no plant", gd["status"] == "conceptual" and gd["source_type"] == "imported-grayscale" and gd["range"] is None and gd["has_metres"] is False and gd["sampleZ"] is None and gd["norm_high"] > 0.9 and gd["norm_low"] < 0.1 and gd["relative_note"] and "relative heights only" in gd["impact_why"] and g["discarded"], gd["impact_why"])
        sl = A["slope"]
        test("A6 a conceptual form is a DRAFT first (preview, nothing applied), labelled conceptual with its assumption", sl["draft"]["status"] == "conceptual" and sl["applied_before_apply"] is False and sl["preview_contours"] > 0 and any("assumed" in a for a in sl["draft"]["assumptions"]), sl["draft"]["assumptions"][0])
        test("A7 applied: xy → z answers in metres on the same site (north 0.25 m, centre 0.125 m, south 0 m); slope 5 % toward the south", sl["z"] == {"north": 0.25, "centre": 0.125, "south": 0} and abs(sl["slope_centre"]["pct"] - 5) < 0.05 and sl["analyse"]["fall"]["toward"] == "south" and sl["applied"]["bar"] == "conceptual", json.dumps(sl["z"]))
        hm, t3 = sl["heightmap"], sl["t3d"]
        test("A8 one grid, three views: the plan's contours, the heightmap cells and the 3D surface carry the same grid fingerprint", sl["plan_fp"] == sl["applied"]["fp"] == hm["fp"] and hm["cells"] == hm["expect_cells"] and hm["contours"] == sl["preview_contours"], f"{hm['cells']} cells · {hm['contours']} contour segments · {sl['plan_fp']}")
        test("A9 Terrain 3D: the mesh is built from that grid (same fingerprint, same heights, the same contour segments)", t3.get("mesh") is True and t3["same_grid_as_plan"] and t3["y_range"] == t3["expect_y_range"] and t3["z_at_north"] == t3["expect_z_at_north"] and t3["contours"] == hm["contours"], json.dumps(t3)[:300])
        test("A10 a terrain with the gate off moves no plant: same positions as without a terrain, each plant now with its ground height; outline, tree and beds untouched", sl["same_positions_as_no_terrain"] and sl["dry"]["plants"] == u["dry"]["plants"] and sl["fixed_unchanged"] and all(o["ground"] and o["ground"]["slope_pct"] == 5 for o in sl["plant_ground"]) and sl["impact"]["changed"] is False and "gate is off" in sl["impact"]["why"], sl["impact"]["why"])
        e = A["edit"]
        test("A11 editing a region: sampleZ and the local slope change in the draft at once; the applied terrain does not until Apply; far ground stays", e["z_after_draft"] > e["z_before"] + 0.5 and e["slope_after_pct"] > e["slope_before_pct"] * 3 and e["applied_z_while_draft"] == e["z_before"] and e["far_point_unchanged"] and e["plan_fp_is_draft"] and e["draft_source"] == "user-drawn-heightmap" and e["applied_z"] == e["z_after_draft"], f"z {e['z_before']} → {e['z_after_draft']} m · slope {e['slope_before_pct']} → {e['slope_after_pct']} %")
        test("A12 the 3D mesh follows the same edit (the mesh height at the edited point equals sampleZ of the draft)", e.get("t3d", {}).get("key_is_draft") and e["t3d"]["z_at"] == e["t3d"]["expect"], json.dumps(e.get("t3d")))
        test("A13 steep ground alone changes nothing while the gate is off — and the reason is given", e["gate_off"]["same_positions_as_no_terrain"] and e["gate_off"]["steepest_in_north_bed"] > 33 and e["impact"]["changed"] is False and "gate is off" in e["impact"]["why"], f"steepest in the North bed {e['gate_off']['steepest_in_north_bed']} %")
        gt = A["gate"]; th = gt["thresholds"]; pv = gt["preview"]; ap = gt["applied"]
        test("A14 the slope gate is a labelled heuristic with an adjustable threshold; a stricter limit never refuses fewer positions", pv["heuristic_label"] and pv["says_not_species"] and th["20"]["excluded"] >= th["25"]["excluded"] >= th["33"]["excluded"] >= th["50"]["excluded"] and th["20"]["excluded"] > th["50"]["excluded"], json.dumps(th))
        test("A15 below the threshold the gate changes nothing (5 % ground, 33 % limit)", gt["below_threshold"]["excluded"] == 0 and gt["below_threshold"]["same_positions_as_no_terrain"] and gt["below_threshold"]["max_slope_pct"] < 33, json.dumps(gt["below_threshold"]))
        test("A16 turning the gate on is previewed first: the engine's before → after, the refused positions marked on the plan, nothing applied yet", pv["draft"] and pv["applied_gate_still_off"] and pv["impact"]["changed"] and pv["impact"]["after"] < pv["impact"]["before"] and pv["impact"]["excluded"] > 0 and pv["marks_on_plan"] == pv["impact"]["excluded"] and pv["steep_cells_on_plan"] > 0, f"{pv['impact']['before']} → {pv['impact']['after']} plants · {pv['impact']['excluded']} refused · {pv['impact']['why']}")
        test("A17 applied, threshold reached: fewer plants, every refused position is over the limit, no placed plant is, and the Screen's continuity drops", ap["dry"]["plants"] == pv["impact"]["after"] and ap["dry"]["excluded"] == pv["impact"]["excluded"] and ap["every_excluded_over_limit"] and ap["no_plant_over_limit"] and ap["dry"]["valid"] and ap["dry"]["screen"][0]["covered_m"] < u["dry"]["screen"][0]["covered_m"] and ap["dry"]["screen"][0]["gaps"] > 0, f"Screen {u['dry']['screen'][0]['covered_m']} → {ap['dry']['screen'][0]['covered_m']} m ({ap['dry']['screen'][0]['status']})")
        test("A18 nothing else moved: outline, tree and beds are identical; the beds away from the edit keep every plant position", ap["fixed_unchanged"] and ap["other_beds_same"])
        test("A19 the change is explained in the version's own records: unresolved, findings and assumptions name the slope gate as a design heuristic", any("design heuristic" in x for x in ap["unresolved"]) and any("Slope gate" in x and "not a species tolerance" in x for x in ap["findings"]) and any("slope gate on at 33 %" in x for x in ap["assumptions"]), ap["unresolved"][0] if ap["unresolved"] else "")
        gr = A["grow"]
        test("A20 Grow: the generated version equals the Compose preview and carries the terrain it was made on; every plant has the ground height of sampleZ", gr["same_as_preview"] is True and gr["terrain"]["status"] == "conceptual" and gr["terrain"]["gate"]["enabled"] and gr["terrain"]["excluded"] == ap["dry"]["excluded"] and gr["every_plant_has_ground"] and gr["ground_matches_sampleZ"] and gr["plants"] == ap["dry"]["plants"], f"{gr['plants']} plants · version {gr['version']}")
        test("A21 Grow views agree: schedule = plant objects = plants on the plan; the refused positions stay marked; the inspector names the terrain", gr["schedule_sum"] == gr["plants"] == gr["plan_plants"] and gr["marks_on_plan"] == gr["terrain"]["excluded"] and gr["grow_terrain_panel"] == "conceptual")
        g3 = gr["g3"]
        test("A22 Grow 3D: the same plant objects stand on the surface (each plant's height = the grid's height at its x, y)", g3.get("mesh") is True and g3["plants"] == gr["plants"] and g3["plants_on_ground"] and g3["same_grid"] and g3["max_plant_y"] > 0.5, json.dumps(g3))
        test("A23 a later change of the ground never rewrites a generated version; Reset returns the preview to the no-terrain planting; Undo restores the ground", A["after_reset"]["version_untouched"] and A["after_reset"]["dry_back_to_no_terrain"] and A["after_reset"]["elevation"] == "Elevation unknown" and A["after_undo"]["fp_restored"])

        # ---------------------------------------------------------------- Demo B
        n, i = B["north"], B["island"]
        test("B1 same site, same knowledge snapshot, same seed; terrain set aside (elevation unknown)", B["seed"] == 42 and bool(B["snapshot"]) and B["terrain"] == "Elevation unknown", f"snapshot {B['snapshot']} · seed {B['seed']}")
        test("B2 the suggestion is a rule's proposal, shown as such, and nothing is set until chosen", n["recommended"] == "layered-screen" and n["basis"] == "rule" and n["confirmed"] is False and n["shown_now"] == "none" and n["shown_suggested"] == "layered-screen" and "not a decision" in n["rec_text"] and n["cards"]["none"]["chosen"] and n["cards"]["layered-screen"]["suggested"], n["rec_text"])
        test("B3 presets hold no species list; Matrix Planting is in the catalogue but cannot be chosen: 'insufficient species/role evidence', with the missing facet named", B["no_species_ids_in_presets"] and B["matrix"]["selectable"] is False and B["matrix"]["coverage"]["verdict"] == "insufficient species/role evidence" and B["matrix"]["card"]["level"] == "unavailable" and B["matrix"]["card"]["clickable"] is False and "longevity" in B["matrix"]["card"]["why"], B["matrix"]["card"]["why"][:200])
        st = B["strip"]
        test("B2b progressive disclosure: the Planting system is one line by default (current system + the suggestion); the comparison opens on a click", st["closed_by_default"] and st["cards_rendered"] == 0 and "suggested: Layered Screening" in st["text"] and st["opened_by_click"], st["text"])
        L, W, N0 = n["layered"], n["woodland"], n["none"]
        test("B4 Layered Screening on the North bed: three roles, each filled by its own species; the change from 'no system' is stated in roles", [x["status"] for x in L["layers"]] == ["filled"] * 3 and all(x["plants"] > 0 for x in L["layers"]) and L["roles"].get("seasonal-accent", 0) > 0 and "repeat_accent" in L["operators"] and L["sig"] != N0["sig"] and L["change"]["from"] == "No system" and any("roles after" in x for x in L["change"]["lines"]), " · ".join(L["change"]["lines"]))
        test("B5 Woodland Edge on the SAME bed gives a different composition: other layers, other species, other operators — and the Screen is reported not met, with the reason", W["sig"] != L["sig"] and set(W["roles"]) != set(L["roles"]) and W["species"] != L["species"] and W["operators"] != L["operators"] and W["screen"]["status"] == "not met" and L["screen"]["covered_m"] > 0 and W["screen"]["covered_m"] == 0 and any("not a row" in x for x in W["change"]["lines"]) and any("no row is set" in x for x in W["unresolved_notes"]), " · ".join(W["change"]["lines"])[:400])
        test("B6 measures differ with the system, not only words: ground under crowns, Screen continuity, role fulfilment", L["metrics"]["screen_continuity"]["value"] == 1 and W["ground_share"] != L["ground_share"] and "canopy_ground" in W["metrics"] and "layer_separation" in L["metrics"] and L["metrics"]["layer_separation"]["value"] > 0, f"Layered: Screen {L['screen']['covered_m']} m, ground {L['ground_share']} · Woodland: Screen {W['screen']['covered_m']} m, ground {W['ground_share']}")
        test("B7 a parameter is an instruction to the engine: accent ratio 'none' removes the accents and the change is recorded; choosing the system again restores the same plants", n["param"]["changed"] and "seasonal-accent" not in n["param"]["after_roles"] and n["param"]["before_roles"].get("seasonal-accent", 0) > 0 and n["back_to_layered_same"], json.dumps(n["param"]["after_roles"]))
        IW = i["woodland"]
        test("B8 Tree island: Woodland Edge is suggested from the crown reaching the bed; Layered Screening is shown as not applicable, with what is missing", i["recommended"] == "woodland-edge" and "crown" in i["why"] and i["cards"]["layered-screen"]["level"] == "not" and i["cards"]["layered-screen"]["clickable"] is False and "Screen" in i["cards"]["layered-screen"]["why"], i["cards"]["layered-screen"]["why"])
        byr = {x["role"]: x for x in IW["layers"]}
        test("B9 Woodland Edge roles: the existing tree is the canopy (not planted, no new tree); under-crown ground, crown-edge shrubs and open ground are filled by different species", byr["existing-canopy"]["status"] == "provided by the site" and IW["existing_tree_planted"] is False and IW["new_trees"] == 0 and all(byr[r]["plants"] > 0 for r in ["winter-ground", "understory-shrub", "open-ground"]) and len({tuple(byr[r]["species"]) for r in ["winter-ground", "understory-shrub", "open-ground"]}) == 3, {r: byr[r]["plants"] for r in byr})
        test("B10 a layer without evidence is left unresolved and shown — 'insufficient evidence', nothing substituted", byr["spring-ephemeral"]["status"] == "empty" and byr["spring-ephemeral"]["plants"] == 0 and "insufficient evidence" in byr["spring-ephemeral"]["gap"] and "phenology" in (IW["shown_gap"] or "") and "spring-ephemeral" in IW["unresolved"], byr["spring-ephemeral"]["gap"])
        wg = IW["candidates"]["winter-ground"]
        test("B11 species qualify per role from their records: some are refused for the under-crown layer (with the reason) and one of them serves beyond the crown", any(c["fit"] == "fails" and "shade" in (c["why"] or "") for c in wg) and any(c["id"] in byr["open-ground"]["species"] for c in wg if c["fit"] == "fails"), "; ".join(f"{c['id'].split(':')[1]}: {c['fit']}" for c in wg))
        test("B12 the shrub-group parameter changes the placement", i["param"]["changed"], json.dumps(i["param"]))
        G = B["grow"]; ch = G["chains"]; cons = G["consistency"]
        test("B13 Generate = the Compose preview; the version names the system of each bed; every plant of those beds carries its layer; the version validates", G["same_as_preview"] is True and sorted(G["systems"].values()) == ["layered-screen", "woodland-edge"] and G["every_plant_in_system_bed_has_layer"] and G["validation_ok"], json.dumps(G["layers_count"]))
        full = ["site", "terrain", "function", "system", "species", "placement"]
        test("B14 'Why this plant here?' — for a plant of each layer the chain runs site → ground → function → system role → species claims → placement rule", all(ch[k] and ch[k]["steps"] == full and ch[k]["claims"] > 0 and ch[k]["claims_exist"] and ch[k]["species_checks"] >= 3 and ch[k]["placement"].startswith("operator ") and len(ch[k]["placement"]) > 25 for k in ["structure", "ground_matrix", "accent", "winter_ground", "understory", "open_ground"]), " | ".join(f"{k}: {ch[k]['species'].split(':')[1]} · {ch[k]['claims']} claims" for k in ch if ch[k]))
        test("B15 the chain names its sources (stated · claims · heuristic · unknown) and says when there is no system", ch["structure"]["sources"]["species"] == "claim" and ch["structure"]["sources"]["system"] == "heuristic" and ch["structure"]["sources"]["terrain"] == "unknown" and "Layered Screening" in ch["structure"]["system_line"] and "Woodland Edge" in ch["understory"]["system_line"] and ch["no_system_bed"]["sources"]["system"] == "none" and "no planting system chosen" in ch["no_system_bed"]["system_line"], ch["understory"]["system_line"])
        test("B16 the chain is on the page for the selected plant, with all six steps", G["why_dom"]["system"] == "woodland-edge" and G["why_dom"]["steps"] == full and bool(G["why_dom"]["layer"]), json.dumps(G["why_dom"]))
        test("B17 one DesignVersion in every view: schedule = objects = Plan = Algorithm = Presentation = 3D", cons["schedule_sum"] == G["plants"] == cons["plan_plants"] == cons["algo_plants"] == cons["present_plants"] == cons["g3_plants"], json.dumps({k: v for k, v in cons.items() if k.endswith("plants") or k == "schedule_sum"}))
        test("B18 Grow shows the systems and — with no terrain — says the 3D ground is a flat display assumption", cons["grow_systems_panel"] == 2 and cons["grow_terrain_panel"] == "unknown" and "flat display plane" in (cons["g3_note"] or ""), cons["g3_note"])
        test("B19 unresolved roles reach the evaluation's findings", any("Spring ephemerals" in x for x in G["findings"]), "; ".join(G["findings"])[:300])

        # ---------------------------------------------------------------- both
        test("AB1 terrain and systems together: the edited ground with the gate on, under Layered Screening and Woodland Edge — the layers are kept, positions on steep ground are refused", AB["terrain_restored"] and AB["excluded"] > 0 and sorted(AB["systems"].values()) == ["layered-screen", "woodland-edge"] and AB["screen"][0]["status"] == "not met" and any("slope gate 33 %" in x for x in AB["chain_terrain_line"]) and AB["version"]["terrain"] and AB["version"]["same_as_preview"] is True, f"{AB['plants']} plants · {AB['excluded']} refused · {AB['north_layers']}")

ok = sum(1 for _, p, _ in results if p); n = len(results)
lines = [f"# Topography + planting systems — tests {TODAY}", "", f"`tools/topo_tests.py` against {URL} (headless Chrome, 1440 × 900). **{ok}/{n} pass.**", "", "U = unit tests of `design/tests.html` (T terrain · Y planting systems) · A = Demo A (terrain) · B = Demo B (planting systems) · AB = both. The replay is `design/index.html?script=topo&fresh=1`; its recorded data is `docs/topography-presets/demo-data.json`.", "", "| test | result | detail |", "|---|---|---|"] + [f"| {a} | {'pass' if p else '**FAIL**'} | {d.replace('|', '/')} |" for a, p, d in results]
out = os.path.join(ROOT, f"eval/topo-tests-{TODAY}.md")
with open(out, "w", encoding="utf-8") as f: f.write("\n".join(lines) + "\n")
print("\n".join(f"[{'ok' if p else 'FAIL'}] {a}" + (f"  — {d}" if not p and d else "") for a, p, d in results)); print(f"{ok}/{n} pass → {os.path.relpath(out, ROOT)}")
sys.exit(0 if ok == n else 1)
