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
        test(f"{label} · A3 site stage shows stated / inferred / unknown cards with the unknowns listed", A["read"]["after_describe"]["stage"] == "site" and A["read"]["site_cards"] >= 3 and A["read"]["unknown_rows"] >= 3, f"cards {A['read']['site_cards']} · unknown rows {A['read']['unknown_rows']}")
        test(f"{label} · A4 after W × H the bed is suggested (not measured) with an Accept button", A["after_size"]["beds"] == ["ai-suggested"] and A["after_size"]["accept_button"], json.dumps(A["after_size"]["beds"]))
        test(f"{label} · A5 intent stage: 7 goals with effect notes, inert goals labelled, candidates listed, generate enabled", A["intent"]["stage"] == "intent" and A["intent"]["value_rows"] == 7 and A["intent"]["effect_notes_unimplemented"] >= 2 and A["intent"]["candidates"] > 0 and A["intent"]["generate_enabled"], json.dumps(A["intent"]))
        test(f"{label} · A6 generate → garden stage owns the viewport; one 2D symbol per plant; legend chips per species; real ids", A["garden"]["stage"] == "garden" and A["garden"]["in_garden"] and A["garden"]["symbols_2d"] == A["garden"]["plants"] > 0 and A["garden"]["legend_chips"] == A["garden"]["species"] and A["garden"]["ids_ok"], json.dumps({k: A["garden"][k] for k in ("plants", "species", "symbols_2d", "legend_chips")}))
        # B — rich prompt
        d = B["read"]["dims"]; test(f"{label} · B1 dimensions captured once (6 × 4 m), tree north inferred with canopy assumed, open centre inferred, bed suggested", d and abs(d["w"] - 6) < 1e-6 and abs(d["h"] - 4) < 1e-6 and any(f["kind"] == "existing-tree" and f["status"] == "inferred" and f["radius"] is None for f in B["read"]["features"]) and any(f["kind"] == "no-plant-zone" and f["status"] == "inferred" for f in B["read"]["features"]) and B["read"]["beds"] == ["ai-suggested"], json.dumps(B["read"]["features"]))
        test(f"{label} · B2 inferred items shown as suggestions on the site stage (inferred card has rows)", B["read"]["inferred_rows"] >= 3, f"inferred rows {B['read']['inferred_rows']}")
        test(f"{label} · B3 brief: Screen along an edge, open centre and tree as hard constraints", any(f.startswith("z:screen@") for f in B["intent"]["functions"]) and "keep-open" in B["intent"]["hard"] and "keep-tree" in B["intent"]["hard"], json.dumps(B["intent"]))
        test(f"{label} · B4 garden: every plant inside the accepted bed; no cost, no ecology score; unknown gates reported", B["garden"]["inside_bed"] and B["garden"]["cost"] is None and B["garden"]["ecology_score"] is None and B["garden"]["unknown_gates"] >= 0, json.dumps({k: B["garden"][k] for k in ("plants", "unknown_gates")}))
        test(f"{label} · B5 plan, presentation and 3D draw the same plant count from one version", B["garden"]["symbols_plan"] == B["present"]["symbols"] == B["garden"]["plants"] and B["three"].get("plants") == B["garden"]["plants"], f"plan {B['garden']['symbols_plan']} · present {B['present']['symbols']} · 3D {B['three']}")
        # C — conversational spatial edit
        test(f"{label} · C1 lasso: the region is highlighted with its plant count and a revision card, nothing changed yet", C["selected"]["revision_card"] and C["selected"]["inside"] > 0 and "Selected region" in C["selected"]["card_text"], json.dumps(C["selected"]))
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
