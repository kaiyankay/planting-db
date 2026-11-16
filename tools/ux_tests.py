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
        args = [CHROME, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-first-run", "--hide-scrollbars", f"--user-data-dir={td}", f"--window-size={size[0]},{size[1]}", f"--virtual-time-budget={budget}"]
        if shot: args.append(f"--screenshot={shot}")
        else: args.append("--dump-dom")
        r = subprocess.run(args + [URL + path], capture_output=True, text=True, timeout=240)
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
        test(f"{lab} · S1 the description becomes an editable site model, read by offline rules and said so: outline, suggested beds, a tree at an estimated position, objectives traced to beds; conditions stay unknown", s["stage"] == "site" and s["boundary"] and s["scale"] == "user-stated" and len(s["beds"]) >= 2 and all(b["status"] == "ai-suggested" for b in s["beds"]) and any(t["status"] == "inferred" for t in s["tree"]) and s["provenance"] == "offline-parser" and "offline rules" in (s["interp"] or "") and len(s["objectives"]) >= len(s["beds"]) and {"light", "water", "soil_type"} <= set(s["conditions_unknown"]), json.dumps({"beds": s["beds"], "interp": s["interp"], "unknown": s["conditions_unknown"]}))
        A = k["A"]; st = A["start"]
        test(f"{lab} · O1 Compose is one sequence Function → Eligible plants → Arrangement; the Screen objective has value, function, parameters, metric, unresolved; the verdict is stated once in the inspector; the plan shows a preview", st["seq"] == ["Function", "Eligible plants", "Arrangement"] and [x.split(" ")[0] for x in st["steps"]] == ["Function", "Eligible", "Arrangement"] and st["objective"]["rows"] == ["value", "function", "parameters", "metric", "unresolved"] and st["objective"]["controls"] >= 3 and st["objective"]["status"] == st["engine"]["screen"]["status"] and st["page"]["verdict_statements"] == 1 and st["page"]["read"]["kind"] == "preview" and st["page"]["plan_symbols"] == st["engine"]["objects"], json.dumps({"seq": st["seq"], "steps": st["steps"], "objective": st["objective"], "page": st["page"]}))
        def moved(x): return x["changed"]["eligibility"] or x["changed"]["mix"] or x["changed"]["plant_objects"] or x["changed"]["evaluation"] or x["before"]["checks"] != x["after"]["checks"] or x["before"]["gate"] != x["after"]["gate"]
        def honest(x): return x["note"] is not None and x["note"]["same"] == (not moved(x)) and (("objects" in x["note"]["kinds"]) == x["changed"]["plant_objects"]) and x["objective"]["status"] == (x["after"]["screen"] or {}).get("status", x["objective"]["status"]) and x["page"]["plan_symbols"] == x["after"]["objects"] and x["page"]["read"]["fp"] == x["after"]["fp"] and x["changed"]["fingerprint"]
        lo, hi = A["height_low"], A["height_high"]
        test(f"{lab} · O2 Screen target height typed in the Objective panel re-runs the engine: the requirement, the height checks and the evaluation follow; the note says exactly what moved (or that nothing did); plan, metric and preview name agree", lo["after"]["requirement"] == {"target_height_m": 1, "target_basis": "stated in Compose", "year_round": False} and hi["after"]["requirement"]["target_height_m"] == 3 and honest(lo) and honest(hi) and "height 1 m" in lo["objective"]["metric"] and "height 3 m" in hi["objective"]["metric"] and lo["after"]["screen"]["checks"]["target_height"] != hi["after"]["screen"]["checks"]["target_height"], json.dumps({"low": [lo["changed"], lo["note"]["kinds"], lo["after"]["screen"]], "high": [hi["changed"], hi["note"]["kinds"], hi["after"]["screen"]]}))
        yr = A["year_round"]
        test(f"{lab} · O3 requiring year-round screening adds the engine's leaf-retention check to every candidate and to the evaluation; the note reports it", yr["after"]["requirement"]["year_round"] is True and all("year_round" in c for c in yr["after"]["checks"].values()) and not any("year_round" in c for c in yr["before"]["checks"].values()) and honest(yr) and "check" in yr["note"]["kinds"] and A["year_round_off"]["after"]["requirement"]["year_round"] is False and honest(A["year_round_off"]), json.dumps([yr["changed"], yr["note"]["kinds"], yr["after"]["screen"]]))
        r = A["rows"]
        test(f"{lab} · O4 row arrangement: a second row is generated by the engine where the bed is deep enough; where it is not, the control is disabled and gives the engine's reason", (r.get("disabled") and r.get("offered") and "bed depth" in (r.get("why") or "")) or (r.get("after", {}).get("rows") == 2 and r["changed"]["plant_objects"] and honest(r)), json.dumps({x: r.get(x) for x in ("disabled", "why", "changed")}))
        B = k["B"]; pt = B["pattern"]; gm = (pt["objective"]["metric"] or "").replace("no pass mark", "")
        test(f"{lab} · G1 Ground Cover pattern changed in the Objective panel: other plant objects from the engine, the estimate re-measured, stored on the bed; an estimate, never a pass or a fail", pt["changed"]["plant_objects"] and pt["before"]["pattern"] != pt["after"]["pattern"] and B["stored_on_bed"].get("pattern") == pt["after"]["pattern"] and pt["objective"]["status"] == "estimate" and f"{round(pt['after']['ground']['share'] * 100)} %" in pt["objective"]["metric"] and not re.search(r"\b(not met|met|pass(es|ed)?|fail(s|ed)?)\b", gm) and "objects" in pt["note"]["kinds"] and pt["page"]["plan_symbols"] == pt["after"]["objects"] and B["start"]["objective"]["rows"] == ["value", "function", "parameters", "metric", "unresolved"], json.dumps([pt["changed"], pt["note"]["kinds"], pt["after"]["ground"], pt["objective"]["metric"]]))
        C = k["C"]
        test(f"{lab} · C1 a site condition stated in Shape re-runs every candidate's site check; the note lists what changed and what is still unknown", C["light"]["status"] == "user-stated" and C["note"] is not None and (not C["note"]["same"]) == bool(C["site_checks_changed"] or C["plant_objects_changed"] or C["mix_changed"]) and ("objects" in C["note"]["kinds"]) == bool(C["plant_objects_changed"]) and "light" not in C["still_unknown"] and {"water", "soil_type"} <= set(C["still_unknown"]) and "water" in (C["note"]["unknown"] or ""), json.dumps({"changed_beds": C["note"]["beds"], "kinds": C["note"]["kinds"], "unknown": C["note"]["unknown"]}))
        R = k["R"]
        test(f"{lab} · R1 a recorded-only function (Scrim) gets no control, no plant and no figure, and says so", "z:scrim" in R["functions"] and R["objective"] and R["objective"]["status"] == "recorded only" and R["objective"]["controls"] == 0 and R["objective"]["figures"] == 0 and R["zones_for_it"] == 0 and R["roles_in_bed"] == ["ground"] and R["removed"], json.dumps(R))
        V = k["V"]; g = V["grow"]; c = V["compose"]
        test(f"{lab} · V1 Grow reads a generated version: the plant card answers Why selected / Why here / Does it work?, keeps the five steps one click away, and its link to the full trace carries the version id; one set of plant objects", g["why"]["ref"] == f"version:{V['version']['id']}" and f"v={V['version']['id']}" in g["why"]["href"] and g["why"]["three"] == ["why-selected", "why-here", "does-it-work"] and g["why"]["five_available"] == 5 and not g["why"]["five_open"] and g["bar"] == "version" and g["bar_version"] == V["version"]["id"] and g["schedule_total"] == V["version"]["objects"] and V["version"]["same_as_preview"] and g["overview_hidden"] and g["canvas"]["w"] >= 0.6 * g["canvas"]["of"], json.dumps(g))
        test(f"{lab} · V2 a bed changed after generating and not regenerated: Compose names the preview by its fingerprint, says it differs from the version, and the explanation and its link to the full trace carry that same fingerprint, never the stale version", c["before"]["same"] is True and c["read"] == {"kind": "preview", "fp": c["fp"], "same": "false"} and c["fp"] != c["version_input_fp"] and c["why"]["ref"] == f"preview:{c['fp']}" and f"pv={c['fp']}" in c["why"]["href"] and "v=" + c["version_still"] not in c["why"]["href"] and c["preview_differs_from_version"] and "differs from version" in (c["why"]["read"] or ""), json.dumps({x: c[x] for x in ("fp", "version_input_fp", "read", "why")}))
        test(f"{lab} · V3 the evidence panel is docked beside the plan, never over it", c["panel"]["open"] and not c["panel"]["covers_plan"], json.dumps(c["panel"]))
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
