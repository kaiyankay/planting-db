#!/usr/bin/env python3
"""
Record of the generative-composition demonstration (methods M64): replays design/index.html?script=compose in headless Chrome —
the 6 × 4 m garden, driven through the page's own controls — and writes what the page reported.

  python3 -I tools/design_server.py --port 8768          (or any static server on the repository root)
  python3 -I tools/composition_record.py [--url http://127.0.0.1:8768]   -> eval/composition-record-<date>.json and .md

It is a record, not a test suite: it states what the engine placed for each arrangement option, which option was chosen, and
whether the version Grow holds equals the preview Compose showed, plant object for plant object. Exit 1 if it does not.
Standard library only.
"""
import html, json, os, re, subprocess, sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[sys.argv.index("--url") + 1] if "--url" in sys.argv else "http://127.0.0.1:8768"
CHROME = next((c for c in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"] if os.path.exists(c)), None)
if not CHROME: sys.exit("composition_record: no Chrome found")
PAGE = "/design/index.html" if "--page" not in sys.argv else sys.argv[sys.argv.index("--page") + 1]
dom = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--disk-cache-dir=/dev/null", "--window-size=1440,900", "--virtual-time-budget=20000", "--dump-dom", f"{URL}{PAGE}?fresh=1&script=compose"], capture_output=True, text=True, timeout=120).stdout
m = re.search(r'<pre id="script-out"[^>]*>(.*?)</pre>', dom, re.S)
if not m: sys.exit("composition_record: the page did not report (is the server running?)")
out = json.loads(html.unescape(m.group(1)))
if out.get("error"): sys.exit("composition_record: " + out["error"][:400])
c = out["compose"]; A, B, C, D = c["A"], c["B"], c["C"], c["again"]
day = date.today().isoformat(); base = os.path.join(ROOT, "eval", f"composition-record-{day}")
json.dump({"source": f"{URL}{PAGE}?fresh=1&script=compose", **c}, open(base + ".json", "w"), indent=1, ensure_ascii=False)

sp = lambda d: ", ".join(f"{n} {k}" for k, n in d.items()) or "—"
L = [f"# Generative composition — demonstration record ({day})", "",
     f"Replay `?script=compose` of `design/index.html`, through the page's own controls. Sentence: “{c['sentence']}” · seed {c['seed']}.",
     f"Beds: {', '.join(b['name'] + ' (' + ', '.join(f.replace('z:', '') for f in b['functions']) + ')' for b in c['beds'])}. Features: {', '.join(c['features'])}.", "",
     f"## A · {A['bed']}: the ground-layer options are different plant objects", "",
     "| option | plants | species | spacing (m) | under crowns (estimate) | other beds unchanged |", "|---|---|---|---|---|---|"]
for o in A["options"]:
    L.append(f"| {o['option']} | — | does not fit: {o['why']} | | | |" if o.get("applicable") is False else f"| {o['option']} | {o['plants']} | {sp(o['species'])} | {' · '.join(f'{k} {v}' for k, v in o['spacing_m'].items()) if isinstance(o['spacing_m'], dict) else o['spacing_m']} | {round(o['ground_cover_share'] * 100)} % | {'yes' if o['other_beds_unchanged'] else 'no'} |")
L += ["", f"{A['distinct_sets_of_plant_objects']} of {A['of']} options are distinct sets of plant objects (species, role, position). Species that qualify for the ground layer here: {', '.join(A['eligible_species'])}.",
      f"Held over the plan without choosing: {A['held_over_plan']['option']} — {A['held_over_plan']['symbols_on_plan']} symbols drawn, stored composition {A['held_over_plan']['stored_composition']}.",
      f"Chosen: **{A['chosen']['option']}** → stored on the bed as `{json.dumps(A['chosen']['stored_on_bed'])}`; {A['chosen']['preview_plants']} plants in the preview; other beds same as before: {A['chosen']['other_beds_same_as_before']}.", "",
      "How each option sets the plants out:"] + [f"- {o['option']}: {o['pattern_rule']}" for o in A["options"] if o.get("pattern_rule")] + ["",
      "Controls on this bed: " + "; ".join(f"{t['control']} — {'changes the plants' if t['effect_here'] else 'no effect here'}" for t in A["controls"]) + ".", "",
      f"## B · {B['bed']}: the screen row, what fits and what does not", ""]
for o in B["options"]:
    L.append(f"- **{o['option']}** — does not fit here: {o['why']}" if o.get("applicable") is False else f"- **{o['option']}**{' (chosen)' if o['chosen'] else ''}: {o['plants']} plants ({sp(o['species'])}), {o['spacing_m']} m apart; {o['screen']['placed']} of {o['screen']['expected']} placed, {o['screen']['covered_m']} of {o['screen']['edge_m']} m of the edge covered — **{o['screen']['status']}**.")
L += ["", "| spacing | plants | m apart | edge covered (m) | status |", "|---|---|---|---|---|"] + [f"| {x['spacing']} | {x['plants']} | {x['spacing_m']} | {x['covered_m']} | {x['status']} |" for x in B["spacing_options"]]
L += ["", f"Limit: {B['limit']}", f"Mix: {B['mix']}", "",
      f"## C · Compose → Grow: version {C['version']}", "",
      "| bed | arrangement | plants in the preview | plants generated | identical (species, role, position) | same as the engine's default |", "|---|---|---|---|---|---|"]
L += [f"| {b['bed']} | {b['arrangement']} | {b['preview_plants']} | {b['generated_plants']} | {'yes' if b['identical_species_role_position'] else '**no**'} | {'yes' if b['same_as_engine_default'] else 'no'} |" for b in C["per_bed"]]
pm = C["preview_match_on_version"]
L += ["", f"Kept on the version itself: `preview_match` = {pm['compared']} plant objects compared, identical: **{pm['identical']}** ({pm['what']}).",
      f"Grow drew {C['symbols_drawn_in_grow']} plant symbols for {C['plants']} plant objects; the schedule totals {C['schedule_total']} ({'; '.join(C['schedule'])}). Validation: {C['valid']}; every plant inside its bed: {C['every_plant_inside_its_bed']}.",
      "Ground evaluation of the version: " + "; ".join(f"{g['bed']} — {g['pattern']}, {g['plants']} plants, {round(g['ground_cover_share'] * 100)} % under crowns" for g in C["ground_evaluation"]) + ".",
      "Screen evaluation: " + "; ".join(f"{z['status']}, {z['covered_m']} of {z['edge_m']} m" for z in C["screen_evaluation"]) + ".", "",
      "First plant objects of the chosen bed (each one is also in the preview):"] + [f"- `{o['id']}` {o['species']} · {o['role']} · {o['position_m']} m · in the preview: {o['in_preview']}" for o in C["sample"]]
L += ["", f"## Back to Compose: {D['bed']} → {D['chosen']} (version {D['version']}, parent {D['parent']})", "",
      "| bed | plants before → after | same plants as the previous version |", "|---|---|---|"] + [f"| {b['bed']} | {b['plants'][0]} → {b['plants'][1]} | {'yes' if b['same_plants_as_previous_version'] else 'no — re-arranged'} |" for b in D["per_bed"]]
L += ["", f"Identical to the preview again: **{D['identical_to_preview']}** ({D['preview_match_on_version']['compared']} plant objects). Versions in the project: {D['versions']}.", "",
      "Cover and continuity are geometric estimates on claimed mature sizes. Nothing here measures pollinators, biodiversity or performance."]
open(base + ".md", "w").write("\n".join(L) + "\n")
ok = pm["identical"] and D["identical_to_preview"] and all(b["identical_species_role_position"] for b in C["per_bed"]) and A["distinct_sets_of_plant_objects"] >= 2
print(f"{os.path.relpath(base, ROOT)}.md — preview = Grow: {pm['identical']} ({pm['compared']} plant objects); ground options distinct: {A['distinct_sets_of_plant_objects']} of {A['of']}; second choice re-arranged only {', '.join(b['bed'] for b in D['per_bed'] if not b['same_plants_as_previous_version'])}")
sys.exit(0 if ok else 1)
