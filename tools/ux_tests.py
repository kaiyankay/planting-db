#!/usr/bin/env python3
"""
UX acceptance tests for the design journey (brief 2026-11-07 'Complete UI/UX Redesign'; .claude/skills/planting-intelligence-ux/
references/UX_ACCEPTANCE.md). Runs design/index.html in headless Chrome at desktop (1440 × 900) and phone (390 × 844) sizes and
reads what the page itself recorded while replaying the acceptance scripts (?script=all&fresh=1 → #script-out) and the demonstration
journey (?journey=1&fresh=1 → #journey-out), then checks the page geometry at each stage (no horizontal overflow, the primary
action present, the garden stage owning the viewport) and writes screenshots of the five states.

  python3 -I tools/design_server.py --port 8768     # in another shell (or any static server on the repository root)
  python3 -I tools/ux_tests.py [--url http://127.0.0.1:8768] [--shots brain/screenshots/design-journey]
                                                     -> eval/ux-tests-<date>.md, exit 1 on any failure

  A  vague beginner       "I want an ecological backyard with low maintenance." → values read, nothing invented, site stage with
                          stated / inferred / unknown cards, the suggested bed accepted, intent with inert goals labelled, garden
  B  rich prompt          6 × 4 m, tree north (inferred, canopy assumed), open centre (inferred), privacy → Screen; plan /
                          presentation / 3D share the plant ids; no cost, no ecology score
  C  conversational edit  lasso + "Too dense here, but keep privacy." → selection scope, screen row kept, red removals drawn,
                          nothing outside moved, apply / undo byte-equal, back to Site and back to the garden without loss
  D  viewports            desktop and phone: stages scroll as a document, no horizontal overflow, the garden stage is fixed and
                          its chrome fits; five screenshots per size
Standard library only; nothing is written except the report and the screenshots.
"""
import json, os, re, subprocess, sys, tempfile
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[sys.argv.index("--url") + 1] if "--url" in sys.argv else "http://127.0.0.1:8768"
SHOTS = sys.argv[sys.argv.index("--shots") + 1] if "--shots" in sys.argv else None
ONLY_SHOTS = "--only-shots" in sys.argv   # skip the assertions, just capture the five states
CHROME = next((c for c in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"] if os.path.exists(c)), None)
TODAY = date.today().isoformat()
results = []


def test(name, ok, detail=""):
    results.append((name, bool(ok), str(detail)[:400])); return bool(ok)


def chrome(path, size, budget=12000, shot=None):
    with tempfile.TemporaryDirectory() as td:
        args = [CHROME, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-first-run", "--use-mock-keychain", "--password-store=basic", "--hide-scrollbars", f"--user-data-dir={td}", f"--window-size={size[0]},{size[1]}", f"--virtual-time-budget={budget}"]
        if shot: args.append(f"--screenshot={shot}")
        else: args.append("--dump-dom")
        r = subprocess.run(args + [URL + path], capture_output=True, text=True, timeout=420)
        return r.stdout


def block(dom, el_id):
    m = re.search(rf'<pre id="{el_id}"[^>]*>(.*?)</pre>', dom, re.S)
    if not m: return None
    return json.loads(m.group(1).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&").replace("&quot;", '"'))


if not CHROME:
    test("0 headless Chrome found", False, "no Chrome binary")
else:
    for label, size in (("desktop 1440×900", (1440, 900)), ("phone 390×844", (390, 844))):
        if ONLY_SHOTS and SHOTS:
            os.makedirs(SHOTS, exist_ok=True); tag = "desktop" if size[0] > 800 else "phone"
            for name, path in (("01-welcome", "/design/?fresh=1"), ("02-site", "/design/?journey=1&fresh=1&stop=3&solo=1"), ("03-intent", "/design/?journey=1&fresh=1&stop=4&solo=1"), ("04-garden-plan", "/design/?journey=1&fresh=1&stop=5"), ("04b-garden-3d", "/design/?journey=1&fresh=1&stop=6"), ("05-revision-preview", "/design/?journey=1&fresh=1&stop=7")):
                chrome(path, size, 16000, os.path.join(SHOTS, f"{name}-{tag}.png"))
            continue
        dom = chrome("/design/index.html?script=all&fresh=1", size, 16000)
        out = block(dom, "script-out")
        if not out:
            test(f"{label} · scripts ran", False, dom[:200]); continue
        A, B, C = out.get("A", {}), out.get("B", {}), out.get("C", {})
        iw = A.get("before", {}).get("inner_width"); label = f"{label.split(' ')[0]} {iw}×{size[1]}" if iw and iw != size[0] else label   # headless Chrome clamps the window to ~500 px: the phone row reports its real width; the true 390 px run is tools/ux_browser_journey.sh
        # A — vague beginner
        test(f"{label} · A1 first screen is the welcome stage with the language field and nothing else unlocked", A["before"]["stage"] == "welcome" and A["before"]["sections"] == ["welcome"], json.dumps(A["before"]))
        test(f"{label} · A2 values reflected (ecology, low maintenance); no geometry, no plants invented", A["read"]["values"].get("ecology") and A["read"]["values"].get("maintenance_low") and not A["read"]["boundary"] and "site dimensions / scale" in A["read"]["unknowns"], json.dumps({"values": A["read"]["values"], "unknowns": A["read"]["unknowns"]}))
        test(f"{label} · A3 Shape stage: conceptual proposal (no geometry invented) and the inspector's stated / inferred / unknown cards with the unknowns listed", A["read"]["after_describe"]["stage"] == "site" and (A["read"].get("proposal") or {}).get("conceptual") is True and A["read"]["site_cards"] >= 3 and A["read"]["unknown_rows"] >= 3, f"cards {A['read']['site_cards']} · unknown rows {A['read']['unknown_rows']}")
        test(f"{label} · A4 after W × H a layout of suggested beds is proposed (not measured) with an Accept action", len(A["after_size"]["beds"]) >= 1 and all(b == "ai-suggested" for b in A["after_size"]["beds"]) and A["after_size"]["accept_button"] and (A["after_size"].get("proposal") or {}).get("recommended") == "A", json.dumps(A["after_size"]["beds"]))
        test(f"{label} · A5 intent stage: 7 goals with effect notes, inert goals labelled, candidates listed, generate enabled", A["intent"]["stage"] == "intent" and A["intent"]["value_rows"] == 7 and A["intent"]["effect_notes_unimplemented"] >= 2 and A["intent"]["candidates"] > 0 and A["intent"]["generate_enabled"], json.dumps(A["intent"]))
        test(f"{label} · A6 generate → garden stage owns the viewport; one 2D symbol per plant; legend chips per species; real ids; every plant in its bed", A["garden"]["stage"] == "garden" and A["garden"]["in_garden"] and A["garden"]["symbols_2d"] == A["garden"]["plants"] > 0 and A["garden"]["legend_chips"] == A["garden"]["species"] and A["garden"]["ids_ok"] and A["garden"]["inside_beds"], json.dumps({k: A["garden"][k] for k in ("plants", "species", "symbols_2d", "legend_chips", "beds")}))
        # B — rich prompt
        d = B["read"]["dims"]; test(f"{label} · B1 dimensions captured once (6 × 4 m), tree north inferred with canopy assumed, open centre inferred, bed suggested", d and abs(d["w"] - 6) < 1e-6 and abs(d["h"] - 4) < 1e-6 and any(f["kind"] == "existing-tree" and f["status"] == "inferred" and f["radius"] is None for f in B["read"]["features"]) and any(f["kind"] == "no-plant-zone" and f["status"] == "inferred" for f in B["read"]["features"]) and len(B["read"]["beds"]) >= 2 and all(b == "ai-suggested" for b in B["read"]["beds"]), json.dumps(B["read"]["features"]))
        test(f"{label} · B2 inferred items shown as suggestions on the site stage (inferred card has rows)", B["read"]["inferred_rows"] >= 3, f"inferred rows {B['read']['inferred_rows']}")
        test(f"{label} · B3 brief: Screen along an edge, open centre and tree as hard constraints", any(f.startswith("z:screen@") for f in B["intent"]["functions"]) and "keep-open" in B["intent"]["hard"] and "keep-tree" in B["intent"]["hard"], json.dumps(B["intent"]))
        test(f"{label} · B4 garden: every plant inside its own bed, none in the open centre, ≥ 2 beds planted; no cost, no ecology score; unknown gates reported", B["garden"]["inside_bed"] and B["garden"]["in_open"] == 0 and B["garden"]["beds"] >= 2 and B["garden"]["cost"] is None and B["garden"]["ecology_score"] is None and B["garden"]["unknown_gates"] >= 0, json.dumps({k: B["garden"][k] for k in ("plants", "unknown_gates")}))
        test(f"{label} · B5 plan, presentation and 3D draw the same plant count from one version", B["garden"]["symbols_plan"] == B["present"]["symbols"] == B["garden"]["plants"] and B["three"].get("plants") == B["garden"]["plants"], f"plan {B['garden']['symbols_plan']} · present {B['present']['symbols']} · 3D {B['three']}")
        # C — conversational spatial edit
        test(f"{label} · C1 lasso: the region is highlighted with its plant count and a revision card, nothing changed yet", C["selected"]["revision_card"] and C["selected"]["inside"] > 0 and "Circled area" in C["selected"]["card_text"], json.dumps(C["selected"]))
        test(f"{label} · C2 'too dense here, keep privacy' → selection scope, reduce_density, preserve screen; removals only inside; screen row kept; outside untouched; privacy not guaranteed", C["preview"]["scope"] == "selection" and "reduce_density" in C["preview"]["ops"] and "z:screen" in C["preview"]["preserve"] and C["preview"]["removed"] > 0 and C["preview"]["removed_in_scope"] and C["preview"]["screen_kept"] and C["preview"]["outside_untouched"] and C["preview"]["privacy_guarantee"] is False, json.dumps({k: C["preview"][k] for k in ("removed", "targets", "outside_untouched")}))
        test(f"{label} · C3 the preview is drawn before Apply (red removals on the plan, banner with Apply / Cancel)", C["preview"]["removed_drawn_red"] == C["preview"]["removed"] and C["preview"]["banner"], f"red {C['preview']['removed_drawn_red']} / removed {C['preview']['removed']}")
        test(f"{label} · C4 apply → new version, plan and schedule follow; undo restores byte-equal; redo returns", C["applied"]["plants"] == C["applied"]["symbols"] == C["applied"]["schedule_total"] and C["applied"]["versions"] == 2 and C["undo"]["byte_equal"] and C["undo"]["symbols"] == C["undo"]["symbols"] and C["redo"]["plants"] == C["applied"]["plants"], json.dumps({"applied": C["applied"]["plants"], "undo": C["undo"]["symbols"], "redo": C["redo"]["plants"]}))
        test(f"{label} · C5 back to Site keeps versions and geometry; back to the garden shows the same design", C["back_to_site"]["stage"] == "site" and not C["back_to_site"]["in_garden"] and C["back_to_site"]["versions_kept"] == 2 and C["back_to_site"]["boundary_kept"] and C["back_to_garden"]["in_garden"] and C["back_to_garden"]["plants"] == C["redo"]["plants"], json.dumps(C["back_to_site"]))
        # D — viewport
        for st in ("before", "after_describe"):
            v = A[st] if st == "before" else A["read"][st]
            test(f"{label} · D1 no horizontal overflow at the {v['stage']} stage", v["overflow_x"] <= 0, f"overflow {v['overflow_x']} px")
        test(f"{label} · D2 no horizontal overflow at the intent and garden stages", A["intent"]["overflow_x"] <= 0 and A["garden"]["overflow_x"] <= 0, f"{A['intent']['overflow_x']} / {A['garden']['overflow_x']}")
        test(f"{label} · D3 stage navigation unlocks progressively (welcome → +site → +intent → +garden)", A["before"]["nav_enabled"] == ["welcome"] and set(A["read"]["after_describe"]["nav_enabled"]) >= {"welcome", "site"} and "garden" not in A["intent"]["nav_enabled"] and "garden" in A["garden"]["nav_enabled"], json.dumps([A["before"]["nav_enabled"], A["intent"]["nav_enabled"], A["garden"]["nav_enabled"]]))
        # screenshots of the five states (deterministic stop points of the demonstration journey)
        if SHOTS:
            os.makedirs(SHOTS, exist_ok=True); tag = "desktop" if size[0] > 800 else "phone"
            for name, path in (("01-welcome", "/design/?fresh=1"), ("02-site", "/design/?journey=1&fresh=1&stop=3&solo=1"), ("03-intent", "/design/?journey=1&fresh=1&stop=4&solo=1"), ("04-garden-plan", "/design/?journey=1&fresh=1&stop=5"), ("04b-garden-3d", "/design/?journey=1&fresh=1&stop=6"), ("05-revision-preview", "/design/?journey=1&fresh=1&stop=7")):
                chrome(path, size, 16000, os.path.join(SHOTS, f"{name}-{tag}.png"))
    # ---------------------------------------------------------------- V4 (2026-11-15): the landing contract, the stepper, objectives with
    # real controls, what changed, recorded-only functions, and what an explanation reads (a preview or a generated version).
    # The page's own replay ?script=v4 drives its controls on the 6 × 4 m demonstration garden and records the engine beside the page.
    for size in (() if ONLY_SHOTS else ((1440, 900), (1280, 800))):
        lab = f"V4 {size[0]}×{size[1]}"; out = block(chrome("/design/index.html?script=v4&fresh=1", size, 45000), "script-out") or {}; k = out.get("v4") or {}
        if not test(f"{lab} · replay ran to the end", bool(k.get("V", {}).get("compose")) and not out.get("error"), (out.get("error") or "no output")[:300]): continue
        h = k["hero"]; rm = h["removed"]
        test(f"{lab} · H1 landing: only the four destinations in the bar; no stage tracker, no statistics, no caption, no 'offline rules' tag, no pop-up", h["bar"]["nav_links"] == ["Design", "Plants", "Knowledge", "About"] and not h["bar"]["stepper_shown"] and not any(rm.values()) and not h["popup"], json.dumps({"bar": h["bar"], "removed": rm}))
        test(f"{lab} · H2 landing: 'Imagine your garden.' in Bricolage Grotesque without a faux italic, one instruction sentence, the composer with Address / Dimensions / Photo-or-sketch, Start designing and two secondary actions", h["h1"] == "Imagine your garden." and h["h1_font"] == "Bricolage Grotesque" and h["em_style"] == "normal" and h["lede_sentences"] == 1 and h["textarea"] and h["inputs"] == ["address", "size", "photo"] and h["start"] == "Start designing" and h["secondary"] == ["Try the example", "Draw the site yourself"], json.dumps({x: h[x] for x in ("h1", "h1_font", "em_style", "lede", "inputs", "start", "secondary")}))
        test(f"{lab} · H3 landing: the hero plants are the snapshot's species with their sway; everything sits in the first viewport; no horizontal overflow", h["art"]["symbols"] == h["art"]["species"] > 0 and h["art"]["animation"] == "sway" and h["fold"]["after_bottom"] <= h["fold"]["viewport"] and h["bar"]["overflow_x"] <= 0 and not h["bar"]["collision"], json.dumps({"art": h["art"], "fold": h["fold"]}))
        bars = {"Shape": k["shape"]["bar"], "Compose": k["A"]["start"]["bar"], "Grow": k["V"]["grow"]["top"]}
        test(f"{lab} · H4 inside the workflow the stepper appears and collides with nothing: bar within the window, no horizontal overflow", all(b["stepper_shown"] and not b["collision"] and b["right_edge"] <= b["inner"][0] and b["overflow_x"] <= 0 and b["nav_links"] == ["Design", "Plants", "Knowledge", "About"] for b in bars.values()), json.dumps({n: [b["stepper_shown"], b["collision"], b["right_edge"], b["inner"][0], b["overflow_x"]] for n, b in bars.items()}))
        s = k["shape"]
        test(f"{lab} · S1 the description becomes an editable site model, read by offline rules and said so: outline, suggested beds, a tree at an estimated position, the inspector is in its choose-a-layout mode (V4.1: objectives are listed once a layout is in use); conditions stay unknown", s["stage"] == "site" and s["boundary"] and s["scale"] == "user-stated" and len(s["beds"]) >= 2 and all(b["status"] == "ai-suggested" for b in s["beds"]) and any(t["status"] == "inferred" for t in s["tree"]) and s["provenance"] == "offline-parser" and "offline rules" in (s["interp"] or "") and s.get("mode") == "choose" and len(s["objectives"]) == 0 and {"light", "water", "soil_type"} <= set(s["conditions_unknown"]), json.dumps({"beds": s["beds"], "interp": s["interp"], "unknown": s["conditions_unknown"]}))
        A = k["A"]; st = A["start"]
        test(f"{lab} · O1 Compose is one sequence Function → Eligible plants → Arrangement; the Screen objective opens on its result and its controls, with unresolved, value, function, rule and what is read one click away (V4.1); the verdict is stated once in the inspector; the plan shows a preview", st["seq"] == ["Function", "Eligible plants", "Arrangement"] and [x.split(" ")[0] for x in st["steps"]] == ["Function", "Eligible", "Arrangement"] and st["objective"]["rows"] == ["metric", "parameters", "unresolved", "value", "function", "rule", "case"] and st["objective"]["controls"] >= 3 and st["objective"]["status"] == st["engine"]["screen"]["status"] and st["page"]["verdict_statements"] == 1 and st["page"]["read"]["kind"] == "preview" and st["page"]["plan_symbols"] == st["engine"]["objects"], json.dumps({"seq": st["seq"], "steps": st["steps"], "objective": st["objective"], "page": st["page"]}))
        def moved(x): return x["changed"]["eligibility"] or x["changed"]["mix"] or x["changed"]["plant_objects"] or x["changed"]["evaluation"] or x["before"]["checks"] != x["after"]["checks"] or x["before"]["gate"] != x["after"]["gate"]
        def honest(x): return x["note"] is not None and x["note"]["same"] == (not moved(x)) and (("objects" in x["note"]["kinds"]) == x["changed"]["plant_objects"]) and x["objective"]["status"] == (x["after"]["screen"] or {}).get("status", x["objective"]["status"]) and x["page"]["plan_symbols"] == x["after"]["objects"] and x["page"]["read"]["fp"] == x["after"]["fp"] and x["changed"]["fingerprint"]
        lo, hi = A["height_low"], A["height_high"]
        test(f"{lab} · O2 Screen target height typed in the Objective panel re-runs the engine: the requirement, the height checks and the evaluation follow; the note says exactly what moved (or that nothing did); plan, metric and preview name agree", lo["after"]["requirement"] == {"target_height_m": 1, "target_basis": "stated in Compose", "year_round": False} and hi["after"]["requirement"]["target_height_m"] == 3 and honest(lo) and honest(hi) and "height 1 m" in lo["objective"]["metric"] and "height 3 m" in hi["objective"]["metric"] and lo["after"]["screen"]["checks"]["target_height"] != hi["after"]["screen"]["checks"]["target_height"], json.dumps({"low": [lo["changed"], lo["note"]["kinds"], lo["after"]["screen"]], "high": [hi["changed"], hi["note"]["kinds"], hi["after"]["screen"]]}))
        yr = A["year_round"]
        test(f"{lab} · O3 requiring year-round screening adds the engine's leaf-retention check to every candidate and to the evaluation; the note reports it", yr["after"]["requirement"]["year_round"] is True and all("year_round" in c for c in yr["after"]["checks"].values()) and not any("year_round" in c for c in yr["before"]["checks"].values()) and honest(yr) and "check" in yr["note"]["kinds"] and A["year_round_off"]["after"]["requirement"]["year_round"] is False and honest(A["year_round_off"]), json.dumps([yr["changed"], yr["note"]["kinds"], yr["after"]["screen"]]))
        r = A["rows"]
        test(f"{lab} · O4 row arrangement: a second row is generated by the engine where the bed is deep enough; where it is not, the control is disabled and gives the engine's reason", (r.get("disabled") and r.get("offered") and "bed depth" in (r.get("why") or "")) or (r.get("after", {}).get("rows") == 2 and r["changed"]["plant_objects"] and honest(r)), json.dumps({x: r.get(x) for x in ("disabled", "why", "changed")}))
        B = k["B"]; pt = B["pattern"]; gm = (pt["objective"]["metric"] or "").replace("no pass mark", "")
        test(f"{lab} · G1 Ground Cover pattern changed in the Objective panel: other plant objects from the engine, the estimate re-measured, stored on the bed; an estimate, never a pass or a fail", pt["changed"]["plant_objects"] and pt["before"]["pattern"] != pt["after"]["pattern"] and B["stored_on_bed"].get("pattern") == pt["after"]["pattern"] and pt["objective"]["status"] == "estimate" and f"{round(pt['after']['ground']['share'] * 100)} %" in pt["objective"]["metric"] and not re.search(r"\b(not met|met|pass(es|ed)?|fail(s|ed)?)\b", gm) and "objects" in pt["note"]["kinds"] and pt["page"]["plan_symbols"] == pt["after"]["objects"] and B["start"]["objective"]["rows"][:2] == ["metric", "parameters"] and {"value", "function", "rule", "case"} <= set(B["start"]["objective"]["rows"]), json.dumps([pt["changed"], pt["note"]["kinds"], pt["after"]["ground"], pt["objective"]["metric"]]))
        C = k["C"]
        test(f"{lab} · C1 a site condition stated in Shape re-runs every candidate's site check; the note lists what changed and what is still unknown", C["light"]["status"] == "user-stated" and C["note"] is not None and (not C["note"]["same"]) == bool(C["site_checks_changed"] or C["plant_objects_changed"] or C["mix_changed"]) and ("objects" in C["note"]["kinds"]) == bool(C["plant_objects_changed"]) and "light" not in C["still_unknown"] and {"water", "soil_type"} <= set(C["still_unknown"]) and "water" in (C["note"]["unknown"] or ""), json.dumps({"changed_beds": C["note"]["beds"], "kinds": C["note"]["kinds"], "unknown": C["note"]["unknown"]}))
        R = k["R"]
        test(f"{lab} · R1 a recorded-only function (Scrim) gets no control, no plant and no figure, and says so", "z:scrim" in R["functions"] and R["objective"] and R["objective"]["status"] == "recorded only" and R["objective"]["controls"] == 0 and R["objective"]["figures"] == 0 and R["zones_for_it"] == 0 and R["roles_in_bed"] == ["ground"] and R["removed"], json.dumps(R))
        V = k["V"]; g = V["grow"]; c = V["compose"]
        test(f"{lab} · V1 Grow reads a generated version: the plant card answers Why selected / Why here / Does it work?, keeps the five steps one click away, and its link to the full trace carries the version id; one set of plant objects (V4.2: the card sits inside the inspector, whose summary and Change… stay in view)", g["why"]["ref"] == f"version:{V['version']['id']}" and f"v={V['version']['id']}" in g["why"]["href"] and g["why"]["three"] == ["why-selected", "why-here", "does-it-work"] and g["why"]["five_available"] == 5 and not g["why"]["five_open"] and g["bar"] == "version" and g["bar_version"] == V["version"]["id"] and g["schedule_total"] == V["version"]["objects"] and V["version"]["same_as_preview"] and not g["overview_hidden"] and g["canvas"]["w"] >= 0.6 * g["canvas"]["of"], json.dumps(g))
        test(f"{lab} · V2 a bed changed after generating and not regenerated: Compose names the preview by its fingerprint, says it differs from the version, and the explanation and its link to the full trace carry that same fingerprint, never the stale version", c["before"]["same"] is True and c["read"] == {"kind": "preview", "fp": c["fp"], "same": "false"} and c["fp"] != c["version_input_fp"] and c["why"]["ref"] == f"preview:{c['fp']}" and f"pv={c['fp']}" in c["why"]["href"] and "v=" + c["version_still"] not in c["why"]["href"] and c["preview_differs_from_version"] and "differs from version" in (c["why"]["read"] or ""), json.dumps({x: c[x] for x in ("fp", "version_input_fp", "read", "why")}))
        test(f"{lab} · V3 the evidence panel is docked beside the plan, never over it", c["panel"]["open"] and not c["panel"]["covers_plan"], json.dumps(c["panel"]))

    # ---- V4.1 (2026-11-16): a Screen whose rows really differ, the objective's three layers, Shape's two modes, and versions that say
    # how they were made. ?script=v41 drives the page's own controls; every figure is the engine's.
    for size in (() if ONLY_SHOTS else ((1440, 900), (1280, 800))):
        lab = f"V4.1 {size[0]}×{size[1]}"; out = block(chrome("/design/index.html?script=v41&fresh=1", (size[0], size[1] + 87), 60000), "script-out") or {}; k = out.get("v41") or {}   # + 87: the headless window frame, so the viewport is exactly the size named
        if not test(f"{lab} · replay ran to the end", bool(k.get("legacy")) and not out.get("error"), (out.get("error") or "no output")[:300]): continue
        sh, pr, sg, db, df = k["shallow"], k["proposed"], k["single"], k["double"], k["differs"]
        test(f"{lab} · D0 the 6 × 4 m case stays as the explanation: the engine's row plan finds the bed too shallow for a second row, the control is offered, disabled, and gives the two depths", sh["plan"]["rows"] == 1 and not sh["plan"]["staggered_row"]["feasible"] and sh["page"]["double"]["disabled"] and str(sh["plan"]["staggered_row"]["needs_depth_m"]) in sh["page"]["double"]["why"] and str(sh["plan"]["depth_m"]) in sh["page"]["double"]["why"] and sh["case"]["id"] != pr["case"]["id"], json.dumps([sh["plan"], sh["page"]["double"]]))
        sm = k["shape_modes"]
        test(f"{lab} · S2 Shape has two modes: choosing a layout shows the options, how the others differ and one action, no objectives; once a layout is in use the inspector edits beds, lists the objectives and can go back", sm["choose"]["mode"] == "choose" and sm["choose"]["options"] >= 2 and sm["choose"]["diff_lines"] == sm["choose"]["options"] - 1 and sm["choose"]["primary"] == "Use this layout" and sm["choose"]["objectives"] == 0 and sm["edit"]["mode"] == "edit" and sm["edit"]["objectives"] >= 1 and sm["edit"]["back"] and all(x == "user-accepted" for x in sm["edit"]["statuses"]) and sm["edit"]["undo"], json.dumps(sm))
        e = k["edit"]
        test(f"{lab} · D1 the bed is made deeper in words through the spatial engine: a preview, then a user edit with its provenance and an undo step", e["preview_ok"] and e["changed"] and e["status"] == "user-edited" and "said:" in (e["source"] or "") and e["undo_available"] and pr["plan"]["depth_m"] < pr["plan"]["staggered_row"]["needs_depth_m"] <= k["deep_default"]["plan"]["depth_m"], json.dumps([e["changes"], pr["plan"]["depth_m"], k["deep_default"]["plan"]["depth_m"]]))
        test(f"{lab} · D2 single against staggered double on the same bed: two runs of the engine give different plant objects — one row, then two with an inner row in new positions — and the page shows each run's own count", df["plant_objects"] and df["rows"] == [1, 2] and df["count"][1] > df["count"][0] and df["inner_row_positions_new"] == db["roles"].get("screen-layer", 0) > 0 and sg["roles"].get("screen-layer", 0) == 0 and df["fingerprint"] and sg["page"]["plan_symbols"] == sg["all_objects_in_bed"] and db["page"]["plan_symbols"] == db["all_objects_in_bed"] and db["page"]["double"]["on"] and not db["page"]["double"]["disabled"], json.dumps(df))
        test(f"{lab} · D3 what changed leads with the plant objects and the Screen figures, before to after, and the result line carries the engine's count", sg["note"] and db["note"] and not db["note"]["same"] and db["note"]["first_kind"] == "objects" and f"{sg['objects']} → {db['objects']}" in db["note"]["text"] and f"{sum(db['plan']['placed'])} of {sum(db['plan']['expected'])}" in db["page"]["metric"] and db["page"]["status"] == db["screen"]["status"], json.dumps([db["note"], db["page"]["metric"]]))
        test(f"{lab} · D4 the generated version is the double-row preview, plant for plant", k["generated"]["rows"] == 2 and k["generated"]["preview_match"] is True and k["generated"]["same_as_double"], json.dumps({x: k["generated"][x] for x in ("rows", "preview_match", "same_as_double")}))
        pg = db["page"]
        test(f"{lab} · P1 the objective has three layers: result and controls open, everything else behind one disclosure; the case and the preview fingerprint are named there; header, result, target height and rows are inside the panel's first view", pg["inner"] == list(size) and pg["top_rows"] == ["metric", "parameters"] and not pg["details_open"] and pg["rows"][2:] and pg["case_id"] == pr["case"]["id"] and pg["read_fp"] == db["fp"] and pg["header_visible"] and pg["metric_visible"] and pg["height_visible"] and pg["rows_visible"], json.dumps(pg))
        test(f"{lab} · P2 the value is named Ground coverage (an under-crown estimate), not continuity; a height change that moves no plant says so", k["ground_label"] == "Ground coverage" and k["height"]["checks_note"] and not k["height"]["moved_plants"] and k["height"]["note"] is not None and "objects" not in k["height"]["note"]["kinds"], json.dumps(k["height"]))
        tc = k["typed_compose"]
        test(f"{lab} · P3 a change typed in Compose's command bar gets the same what-changed note as a control: the requirement moves, the Objective panel shows it, the note is titled with the words", tc["requirement"] == 1.2 and tc["objective_height"] == "1.2" and tc["note"] is not None and "You said" in (tc["note"]["title"] or "") and "objects" not in tc["note"]["kinds"], json.dumps(tc))
        g, t, m, lg = k["generated"], k["typed"], k["manual"], k["legacy"]
        test(f"{lab} · E1 a generated version is named by the fingerprint of its inputs; Compose reads it as the same as its preview", g["how"] is None and g["input_fp"] and g["ref"]["fp"] == g["input_fp"] and g["ref"]["derived"] is None and g["read_same"] and g["bar_how"] == "generated", json.dumps({x: g[x] for x in ("how", "input_fp", "ref", "bar")}))
        test(f"{lab} · E2 a typed edit makes a version that says so: no input fingerprint, its parent and its generated ancestor recorded, a what-changed note from the two versions' own records; Compose no longer calls it the same as the preview", k["typed_preview"] and t["how"] == "typed edit" and t["input_fp"] is None and t["derived"]["from_version_id"] == g["id"] and t["derived"]["base_input_fp"] == g["input_fp"] and t["ref"]["fp"] is None and t["ref"]["derived"]["how"] == "typed edit" and not t["read_same"] and "typed edit" in t["bar"] and t["note"] and t["note"]["version"] == t["id"] and t["note"]["how"] == "typed edit" and (t["note"]["same"] == (t["objects_fp"] == g["objects_fp"])) and "typed edit of version 1" in t["ref_line"], json.dumps({x: t[x] for x in ("how", "derived", "bar", "note", "ref_line")}))
        test(f"{lab} · E3 a manual edit likewise: marked, without an input fingerprint, descending from the same generated inputs, its note counting the plant removed; undo clears the note", m["how"] == "manual edit" and m["input_fp"] is None and m["derived"]["from_version_id"] == t["id"] and m["derived"]["base_version_id"] == g["id"] and m["objects"] == t["objects"] - 1 and m["objects_fp"] != t["objects_fp"] and "objects" in m["note"]["kinds"] and m["note"]["how"] == "manual edit" and m["ref"]["derived"]["how"] == "manual edit" and k["undo"]["id"] == t["id"] and k["undo"]["note_cleared"], json.dumps({x: m[x] for x in ("how", "derived", "bar", "note")}))
        test(f"{lab} · E4 a design saved before V4.1 stays readable: a manual edit that carried its parent's fingerprint is read by its edit record, never as an untouched generated version", lg["how"] == "manual edit" and lg["ref"]["fp"] is None and lg["ref"]["derived"]["how"] == "manual edit" and not lg["ref"]["inputs_changed"] and "manual edit" in lg["line"], json.dumps(lg))
        if size == (1280, 800):
            cb = k["cmdbar"]
            test(f"{lab} · L1 at 1280 × 800 with a panel docked the command bar stays on the canvas, beside the panel and inside the window", cb["panel_open"] and cb["bar_shown"] and cb["bar_left"] >= cb["panel_right"] - 1 and cb["bar_right"] <= cb["canvas_right"] + 1 and cb["bar_width"] >= 220, json.dumps(cb))
    # ---- V4.2 (2026-11-16): the stepper measured as boxes (the user's screenshot showed "1gine", "2ape": a numbered dot drawn over its label), Grow's
    # inspector and action menu, the 3D label scope, and derived versions read back, undone and returned to. ?script=v42 drives the page's own controls.
    for size in ((1440, 900), (1280, 800), (1024, 768)) if not ONLY_SHOTS else ():
        g3 = size == (1440, 900)
        lab = f"V4.2 {size[0]}×{size[1]}"; out = block(chrome(f"/design/index.html?script=v42&fresh=1{'&g3=1' if g3 else ''}", (size[0], size[1] + 87), 90000 if g3 else 45000), "script-out") or {}; k = out.get("v42") or {}
        if not k or out.get("error") or "regenerated" not in k:
            test(f"{lab} · the V4.2 script ran", False, str(out.get("error") or out)[:300]); continue
        test(f"{lab} · viewport is the named size", k["inner"] == [size[0], size[1]], k["inner"])
        w = k["welcome"]; test(f"{lab} · B1 Imagine carries no stepper", w["shown"] is False and not w["doc_overflow"], json.dumps({"shown": w["shown"]}))
        for st, name in (("site", "Shape"), ("intent", "Compose"), ("garden", "Grow")):
            b = k[st]; steps = b["steps"]; vis = [x for x in steps if x["label"]]
            test(f"{lab} · B2 {name}: no dot touches a label, no step touches its neighbour, the stepper clears the platform links and New project, nothing is sliced or clipped, the page does not scroll sideways",
                 b["shown"] and b["overlaps"] == [] and all(x["label_whole"] and x["dot_inside"] and x["dot_round"] and x["dot"] for x in steps) and b["in_window"] and b["new_project_in_window"] and b["bar_clips"] != "hidden" and not b["doc_overflow"],
                 json.dumps({"overlaps": b["overlaps"], "boxes": [[x["text"], x["dot"], x["label"]] for x in steps], "new_project": b["new_project"], "clips": b["bar_clips"]}))
            want = "compact" if size[0] <= 1240 else "full"
            test(f"{lab} · B3 {name}: the {want} mode — {'only the current step is labelled, the others keep their names for assistive technology' if want == 'compact' else 'four whole labels'}",
                 b["mode"] == want and ([x["text"] for x in vis] == ([name] if want == "compact" else ["Imagine", "Shape", "Compose", "Grow"])) and all(x["name"] and x["text"] in x["name"] for x in steps) and [x["dot_text"] for x in steps] == ["1", "2", "3", "4"],
                 json.dumps({"mode": b["mode"], "labels": [x["text"] for x in vis], "names": [x["name"] for x in steps]}))
            cur = [x for x in steps if x["state"] == "current"]; fut = [x for x in steps if x["state"] == "future"]; done = [x for x in steps if x["state"] == "done"]
            test(f"{lab} · B4 {name}: three states told apart — one current step (aria-current, filled dot), done steps, future steps (dashed dot, lighter); a keyboard focus ring is drawn",
                 b["current"] == [name] and len(cur) == 1 and cur[0]["aria_current"] == "step" and all(x["aria_current"] is None for x in steps if x["state"] != "current") and all(x["dot_border"] == "dashed" for x in fut) and all(x["dot_border"] == "solid" for x in cur + done)
                 and len({cur[0]["dot_bg"]} | {x["dot_bg"] for x in done} | {x["dot_bg"] for x in fut}) == (1 + (1 if done else 0) + (1 if fut else 0)) and all(x["colour"] != cur[0]["colour"] for x in fut) and b["focus_ring"] is True,
                 json.dumps({"current": b["current"], "states": [x["state"] for x in steps], "ring": b["focus_ring"], "dots": [x["dot_bg"] for x in steps]}))
        c = k["compose"]
        test(f"{lab} · D1 Compose: the objective opens on its result and its controls; the result, the controls, the command bar and Generate are inside the window; the canvas says it is a preview; the status bar repeats no verdict; no seed or fingerprint in view",
             c["rows"][:2] == ["metric", "parameters"] and c["metric_in_window"] and all(c["controls_in_window"]) and c["command_bar_in_window"] and c["generate_in_window"] and c["read"] == "preview" and "not generated" in c["hint"] and c["foot_verdicts_shown"] == 0 and c["leaks"] is None and not c["doc_overflow"], json.dumps(c))
        g = k["grow"]; s0 = g["site"]; e = s0["engine"]; ver = g["version"]
        unmet = [z for z in e["zones"] if z[1] != "met"]
        test(f"{lab} · G1 Grow says the design once: version and how it was made, then plants, species and beds; no seed, id or fingerprint in view; the old 'Change it' link list is gone",
             s0["kind"] == "Version 1 of 1 · generated" and s0["meta"] == f"{ver['objects']} plants · {ver['species']} species · {ver['beds']} beds" and s0["leaks"] is None and s0["change_list"] == 0 and s0["action_button"] and s0["in_window"], json.dumps({k2: s0[k2] for k2 in ("kind", "meta", "leaks", "change_list")}))
        test(f"{lab} · G2 nothing selected: at most four evaluations — every Screen that is not met or uncertain, the ground cover of all beds as one estimate with its range, and the site conditions the plants rest on; the rest is folded, not removed",
             s0["scope"] == "site" and len(s0["reqs"]) <= 4 and sum(1 for r in s0["reqs"] if "Screen" in r["text"]) == min(2, len(e["zones"])) and all(any(r["cls"] != "meets" and "Screen" in r["text"] for r in s0["reqs"]) for _ in unmet[:1])
             and (len(e["ground"]) < 2 or any(f"{min(x[1] for x in e['ground'])} to {max(x[1] for x in e['ground'])} %" in r["text"] and r["cls"] == "estimate" for r in s0["reqs"])) and (not e["unknown_gates"] or any(r["cls"] == "uncertain" and "not stated" in r["text"] for r in s0["reqs"]))
             and [f[0] for f in s0["folded"]] == ["beds", "plants", "assumptions"] and not any(f[1] for f in s0["folded"]), json.dumps({"reqs": s0["reqs"], "engine": e}))
        bd = g["bed"]
        test(f"{lab} · G3 one bed picked: the inspector is about that bed — its name, its plants and arrangement, its own function result first; what is uncertain stays in view",
             bd["scope"] == bd["id"] and bd["title"] == bd["name"] and bd["meta"].startswith(f"{bd['plants_in_bed']} plants") and all(bd["name"] in r["text"] or "not stated" in r["text"] for r in bd["reqs"]) and bd["reqs"] and bd["name"] in bd["reqs"][0]["text"]
             and bd["uncertain_rows"] >= (1 if e["unknown_gates"] else 0) + sum(1 for z in e["zones"] if z[0] == bd["id"] and z[1] == "uncertain"), json.dumps({"title": bd["title"], "meta": bd["meta"], "reqs": bd["reqs"]}))
        pl = g["plant"]
        test(f"{lab} · G4 a plant clicked: its name, then Why selected / Why here / Does it work in view; sizes, position and the object id one click deeper; sources and the profile offered",
             pl["card"] and pl["name"] == pl["expect"] and [r["key"] for r in pl["why_rows"]] == ["why-selected", "why-here", "does-it-work"] and all(r["shown"] for r in pl["why_rows"]) and pl["facts_open"] is False and not pl["id_in_view"] and pl["evidence_actions"] == 2, json.dumps(pl))
        m = k["menu"]; keep = m["before"]; same = lambda x: all(x[q] == keep[q] for q in ("stage", "mode", "plant", "bed", "version"))
        test(f"{lab} · M1 Change… is a small menu of four tasks; it opens with the focus on its first item; Escape or a click elsewhere closes it, gives the focus back and leaves the garden, its view and its selection as they were",
             m["opened"]["open"] and m["opened"]["items"] == ["chg-compose", "chg-site", "chg-words", "regen-ask"] and m["opened"]["expanded"] == "true" and m["opened"]["focus"] == "chg-compose" and m["opened"]["in_window"]
             and not m["escaped"]["open"] and m["escaped"]["focus"] == "chg-btn" and same(m["escaped"]) and not m["clicked_away"]["open"] and same(m["clicked_away"]), json.dumps({"opened": m["opened"], "escaped": m["escaped"]}))
        test(f"{lab} · M2 each task goes where it says: Edit this planting → Compose on the same bed, at its arrangement; Change the site → Shape; Say a change → the command bar, scoped to the bed's own plants; coming back, the version, the view, the bed and the selected plant are the same",
             m["compose"]["stage"] == "intent" and m["compose"]["bed"] == keep["bed"] and m["compose"]["step"] == 3 and same(m["compose"]["back"]) and m["site"]["stage"] == "site" and same(m["site"]["back"])
             and m["words"]["focus"] == "say3" and m["words"]["selection"] and m["words"]["selection"]["inside"] == m["words"]["selection"]["in_bed"] > 0 and same(m["words"]), json.dumps({"compose": m["compose"], "site": m["site"], "words": m["words"]}))
        rg = k["regenerated"]; rs = m["regen_same"]
        test(f"{lab} · M3 Regenerate asks first and says what a new run would change: nothing when the inputs are the same (cancelled: no version is made); from an edited version, how many plant objects differ and that the edits are not carried over; confirmed, a new generated version is added and every earlier one is kept",
             rs["shown"] and rs["same"] == "true" and rs["versions"] == 1 and not m["regen_cancel"]["confirm"] and m["regen_cancel"]["versions"] == 1 and same(m["regen_cancel"])
             and rg["said"]["shown"] and rg["said"]["same"] == "false" and (rg["said"]["gone"] + rg["said"]["add"]) > 0 and "not carried over" in rg["said"]["text"] and rg["versions_after"] == rg["versions_before"] + 1 and rg["kept"] and rg["how"] is None and rg["input_fp"] and rg["confirm_closed"] and rg["reload"]["id"] == rg["id"],
             json.dumps({"same": rs["text"], "derived": rg["said"], "after": [rg["versions_before"], rg["versions_after"], rg["how"]]}))
        d = k["derived"]; gen = d["generated"]
        def derived_ok(x, how, parent):
            return (x["how"] == how and x["input_fp"] is None and x["derived"] and x["derived"]["from_version_id"] == parent and x["derived"]["base_version_id"] == gen["id"] and how in x["bar"] and x["bar_how"] == how and how in x["kind"] and x["ref_derived"] and x["ref_derived"]["how"] == how
                    and x["reload"]["id"] == x["id"] and x["reload"]["how"] == how and x["reload"]["input_fp"] is None and x["reload"]["derived"] == x["derived"] and x["back"]["id"] == x["id"] and x["back"]["how"] == how and how in x["back"]["bar"])
        test(f"{lab} · V1 a generated version reads as generated, on the page and from storage", gen["how"] is None and gen["input_fp"] and gen["bar_how"] == "generated" and gen["reload"]["input_fp"] == gen["input_fp"] and gen["reload"]["how"] is None, json.dumps(gen)[:300])
        ty, mn, pa, ur = d["typed"], d["manual"], d["partial"], d["undo_redo"]
        test(f"{lab} · V2 a typed edit and a manual edit each make a version that says how it was made — in Grow's bar, in the inspector and in the trace line — with no input fingerprint; the mark survives a reload from storage and leaving Grow and coming back",
             ty["previewed"] and derived_ok(ty, "typed edit", gen["id"]) and derived_ok(mn, "manual edit", ty["id"]), json.dumps({"typed": [ty["bar"], ty["reload"]["how"], ty["back"]["how"]], "manual": [mn["bar"], mn["reload"]["how"], mn["back"]["how"]]}))
        test(f"{lab} · V3 undo returns to the typed edit (still marked, also in storage); redo returns to the manual edit",
             ur["undo"]["id"] == ty["id"] and ur["undo"]["how"] == "typed edit" and ur["undo_reload"]["id"] == ty["id"] and ur["undo_reload"]["how"] == "typed edit" and ur["redo"]["id"] == mn["id"] and ur["redo"]["how"] == "manual edit" and ur["redo_reload"]["id"] == mn["id"], json.dumps({"undo": ur["undo"]["bar"], "redo": ur["redo"]["bar"]}))
        test(f"{lab} · V4 partial regeneration in the browser: a bed is reshaped in Shape, Grow says the planting areas changed and keeps the old version until asked; the preview replants that bed only; applied, the version is marked partial regeneration, the other beds' plants are untouched; reload, undo, redo and leaving Grow keep the mark",
             pa["stale"]["bed_changed"] and pa["stale"]["applied"] and pa["stale"]["offered"] and pa["stale"]["still"]["id"] == mn["id"] and pa["preview"] and pa["preview"]["added"] > 0 and derived_ok(pa, "partial regeneration", mn["id"]) and pa["other_beds_untouched"] and not pa["banner_after"]
             and pa["undo"]["id"] == mn["id"] and pa["undo"]["how"] == "manual edit" and pa["redo"]["id"] == pa["id"] and pa["redo"]["how"] == "partial regeneration" and pa["redo_reload"]["how"] == "partial regeneration", json.dumps({"banner": pa["stale"]["banner"], "preview": pa["preview"], "bar": pa["bar"], "undo": pa["undo"]["bar"], "redo": pa["redo"]["bar"]}))
        if g3:
            L = k.get("labels") or {}
            if "scopes" not in L: test(f"{lab} · L the 3D view started", False, json.dumps(L)[:300])
            else:
                sc = L["scopes"]; n = L["plants"]
                test(f"{lab} · L1 the 3D view has a Labels scope (Off · Hover · Selected · Bed · Species), Selected by default; the Names toggle is gone", L["control"] == ["off", "hover", "selected", "bed", "species"] and L["default_scope"] == "selected" and not L["names_toggle"] and L["proxy_note"], json.dumps({q: L[q] for q in ("control", "default_scope", "names_toggle")}))
                test(f"{lab} · L2 in every scope: no name sprite on any plant, never more than one callout, one tooltip element and one legend; every one of the {n} plant objects is still drawn",
                     all(v["state"]["sprites"] == 0 and v["callouts"] <= 1 and v["callout_elements"] == 1 and v["tips"] == 1 and v["legends"] <= 1 and v["meshes"] == n and v["state"]["plants"] == n and v["name_elements"] <= 2 for v in sc.values()), json.dumps({q: [v["state"]["sprites"], v["callouts"], v["legends"], v["meshes"], v["name_elements"]] for q, v in sc.items()}))
                test(f"{lab} · L3 Off: nothing is named, not even under the pointer. Hover: one tooltip for the plant under the pointer, gone when the pointer leaves, no callout",
                     sc["off"]["callouts"] == 0 and not sc["off"]["tip_shown"] and sc["hover"]["callouts"] == 0 and sc["hover"]["tip_shown"] and sc["hover"]["tip_plant"] == sc["hover"]["under_pointer"] and not sc["hover"]["tip_after_leave"], json.dumps({q: [sc[q]["callouts"], sc[q]["tip_shown"], sc[q]["tip_plant"], sc[q]["under_pointer"]] for q in ("off", "hover")}))
                test(f"{lab} · L4 Selected: one callout on the clicked plant, with the name the inspector shows; Bed: its bed outlined and named once; Species: the other species faded (none removed) and the species named once",
                     sc["selected"]["callouts"] == 1 and sc["selected"]["inspector"] and sc["selected"]["inspector"] in (sc["selected"]["state"]["callout_text"] or "") and sc["selected"]["state"]["dimmed"] == 0
                     and sc["bed"]["state"]["bed_outline"] and (sc["bed"]["legend"] or {}).get("kind") == "bed" and sc["species"]["state"]["dimmed"] > 0 and sc["species"]["state"]["dimmed"] < n and (sc["species"]["legend"] or {}).get("kind") == "species" and not sc["selected"]["state"]["bed_outline"],
                     json.dumps({"selected": sc["selected"]["state"], "bed": sc["bed"]["legend"], "species": [sc["species"]["state"]["dimmed"], sc["species"]["legend"]]}))
                cm, ck = L["camera"], L["click"]
                test(f"{lab} · L5 turning the camera moves the same single callout with its plant and it rests when the camera rests; a click on another plant moves the callout and the inspector to that plant; the Plan view carries no callout",
                     cm["same_element"] and cm["moved"] and cm["steady_when_still"] and cm["still_one"] == 1 and ck["picked"] and ck["same"] and ck["callout_for"] == ck["selected"] and ck["callouts"] == 1 and ck["inspector"] == ck["expect"] and ck["expect"] in (ck["callout_text"] or "") and L["plan_view"]["callouts"] == 0 and not L["plan_view"]["control"], json.dumps({"camera": cm, "click": ck, "plan": L["plan_view"]}))
    if not ONLY_SHOTS:   # phone width: the stepper is compact, nothing overlaps, the page does not scroll sideways (headless Chrome clamps the window near 500 px; the real width is reported)
        out = block(chrome("/design/index.html?script=v42&fresh=1&stop=shape", (390, 844 + 87), 20000), "script-out") or {}; k = out.get("v42") or {}; b = k.get("site")
        if not b: test("V4.2 phone · the script reached Shape", False, str(out)[:300])
        else: test(f"V4.2 phone {k['inner'][0]}×{k['inner'][1]} · B5 the stepper is compact and whole: no overlap, inside the window, no sideways scroll", b["shown"] and b["mode"] == "compact" and b["overlaps"] == [] and b["in_window"] and not b["doc_overflow"] and all(x["dot_inside"] and x["label_whole"] for x in b["steps"]), json.dumps({"overlaps": b["overlaps"], "boxes": [[x["text"], x["dot"], x["label"]] for x in b["steps"]], "overflow": b["doc_overflow"]}))
    if not ONLY_SHOTS:   # the double-row case as a design the Studio saved (designs/demo-c.json, written by ?script=v41&saveas=demo-c through the design server)
        pth = os.path.join(ROOT, "designs", "demo-c.json")
        if not os.path.exists(pth): test("V4.2 · X1 the double-row example is a saved design", False, "designs/demo-c.json is missing")
        else:
            d = json.load(open(pth, encoding="utf-8")); v = next((x for x in d["versions"] if x["id"] == d["current_version_id"]), None) or {}
            rows = [z["row_plans"][0]["rows"] for z in v.get("zones", []) if z.get("kind") == "edge" and z.get("row_plans")]; objs = v.get("plant_objects", []); scr = [o for o in objs if o["role"].startswith("screen")]
            test("V4.2 · X1 the double-row example is a design the Studio saved: one generated version with its seed and input fingerprint, a staggered second row among its plant objects, its schedule counting exactly those objects",
                 d["id"] == "demo-c" and len(d["versions"]) == 1 and v.get("seed") is not None and v.get("input_fp") and not v.get("derived") and rows == [2] and any(o["role"] == "screen-layer" for o in scr) and sum(r["count"] for r in v.get("schedule", [])) == len(objs) and not d.get("ui", {}).get("example"),
                 json.dumps({"id": d["id"], "version": v.get("id"), "seed": v.get("seed"), "rows": rows, "objects": len(objs), "screen": len(scr)}))
            before = open(pth, "rb").read(); dom = chrome("/design/index.html?example=double-row&stage=intent", (1280, 887), 12000) or ""
            tag = re.search(r'<button[^>]*rows(?:&quot;|"):(?:&quot;|")double[^>]*>', dom); tag = tag.group(0) if tag else ""; in_compose = 'data-stage="intent"' in dom; same_file = open(pth, "rb").read() == before
            test("V4.2 · X2 ?example=double-row opens that design in Compose on its Screen bed, with both row choices offered and the double row chosen; the example file itself is not rewritten",
                 in_compose and tag and 'aria-checked="true"' in tag and "disabled" not in tag and f"{len(scr)} plants" in dom and same_file, f"in Compose {in_compose}; double-row control {tag[:160]}; file unchanged {same_file}")
            for f in ("proj-example-double-row.json",):
                if os.path.exists(os.path.join(ROOT, "designs", f)): os.remove(os.path.join(ROOT, "designs", f))
    # the demonstration journey (same 12 steps as tools/design_tests.py) records the stage at every step
    dom = None if ONLY_SHOTS else chrome("/design/index.html?journey=1&fresh=1", (1440, 900), 16000)
    J = block(dom, "journey-out") if dom else None
    if J:
        st = {s["name"][:2]: s for s in J["steps"]}
        test("J stages: description → site, brief → intent, generate → garden (in-garden), edits stay in the garden", st["01"]["stage"] == "site" and st["04"]["stage"] == "intent" and st["05"]["stage"] == "garden" and st["05"].get("in_garden") and st["07"]["stage"] == "garden" and st["07"].get("revision_card"), json.dumps({k: v["stage"] for k, v in st.items()}))
    elif not ONLY_SHOTS:
        test("J journey ran", False, "no #journey-out")

ok = sum(1 for _, p, _ in results if p); n = len(results)
lines = [f"# UX acceptance tests — {TODAY}", "", f"`tools/ux_tests.py` against {URL} (headless Chrome, SwiftShader WebGL). **{ok}/{n} pass.**", "", "| test | result | detail |", "|---|---|---|"] + [f"| {a} | {'pass' if p else '**FAIL**'} | {d.replace('|', '/')} |" for a, p, d in results]
out = os.path.join(ROOT, f"eval/ux-tests-{TODAY}.md")
with open(out, "w", encoding="utf-8") as f: f.write("\n".join(lines) + "\n")
print("\n".join(f"[{'ok' if p else 'FAIL'}] {a}" + (f"  — {d}" if not p and d else "") for a, p, d in results)); print(f"{ok}/{n} pass → {os.path.relpath(out, ROOT)}")
sys.exit(0 if ok == n else 1)
