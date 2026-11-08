#!/bin/sh
# Real-browser walk through the design journey with agent-browser (vercel-labs/agent-browser, Apache-2.0): real clicks and typing
# in Chrome, screenshots of every state. Used for the 2026-11-07 UX redesign acceptance (report reports/design-journey-2026-11-07.md).
#
#   AB=/path/to/agent-browser sh tools/ux_browser_journey.sh [base-url] [shots-dir]
#   defaults: base-url http://127.0.0.1:8768 · shots-dir brain/screenshots/design-journey
#
# agent-browser is not vendored (it is a ~17 MB native binary): install with `npm i -g agent-browser`, `brew install agent-browser`,
# or download the release binary for your platform from https://github.com/vercel-labs/agent-browser/releases and point AB at it.
set -eu
AB=${AB:-agent-browser}; BASE=${1:-http://127.0.0.1:8768}; OUT=${2:-brain/screenshots/design-journey}; mkdir -p "$OUT"
S="--session pi-journey"
say() { printf '\n== %s\n' "$*"; }
shot() { $AB $S screenshot "$OUT/$1.png" >/dev/null; printf '   shot %s\n' "$1"; }
# a lasso needs a multi-point drag; agent-browser's drag is straight, so the region is drawn with the same pointer events the
# canvas listens to (pointerdown · pointermove × n · pointerup) over the right third of the bed
LASSO='(async () => { const svg = document.querySelector("#svg"); const r = svg.getBoundingClientRect(); const T = pi.S.T; const B = pi.G.bbox(pi.S.project.site.beds[0].polygon); const path = [[B.maxx - B.w*.36, B.miny - .2],[B.maxx + .2, B.miny - .2],[B.maxx + .2, B.maxy + .2],[B.maxx - B.w*.36, B.maxy + .2],[B.maxx - B.w*.36, B.miny + .5]]; const px = m => { const [x,y] = T.toPx(m); return {clientX: r.left + x, clientY: r.top + y}; }; const ev = (type, m) => svg.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, pointerId: 1, pointerType: "mouse", button: 0, buttons: 1, isPrimary: true, ...px(m)})); svg.setPointerCapture = () => {}; ev("pointerdown", path[0]); for (let i = 0; i < path.length - 1; i++) for (let t = 0; t <= 1; t += .1) ev("pointermove", [path[i][0] + (path[i+1][0]-path[i][0])*t, path[i][1] + (path[i+1][1]-path[i][1])*t]); ev("pointerup", path[path.length-1]); await new Promise(r => setTimeout(r, 200)); return JSON.stringify({selection: pi.S.selection && pi.S.selection.id, inside: pi.S.project.versions.at(-1).plant_objects.filter(o => pi.G.pointInPolygon(o.position_m, pi.S.selection.polygon)).length}); })()'
STATE='JSON.stringify({stage: pi.S.stage, in_garden: document.body.classList.contains("in-garden"), versions: pi.S.project.versions.length, plants: pi.M.currentVersion(pi.S.project) ? pi.M.currentVersion(pi.S.project).plant_objects.length : 0, symbols: document.querySelectorAll("#svg g.plant").length, preview: !!pi.S.preview, overflow_x: document.documentElement.scrollWidth - innerWidth})'

say "1 · welcome (desktop 1440 × 900)"
$AB $S open "$BASE/design/?fresh=1" >/dev/null; $AB $S set viewport 1440 900 >/dev/null; $AB $S wait 1200 >/dev/null; shot 01-welcome-desktop
$AB $S find text "Try the example" click >/dev/null; $AB $S wait 300 >/dev/null
$AB $S find text "Start designing" click >/dev/null; $AB $S wait 1500 >/dev/null
say "2 · site"; $AB $S eval "$STATE"; shot 02-site-desktop
$AB $S find role button click --name "Set the site" >/dev/null; $AB $S wait 600 >/dev/null; shot 02b-site-geometry-desktop
$AB $S find text "Accept this bed" click >/dev/null; $AB $S wait 400 >/dev/null
$AB $S find text "Continue to the design intent" click >/dev/null; $AB $S wait 1500 >/dev/null
say "3 · intent"; $AB $S eval "$STATE"; shot 03-intent-desktop
$AB $S find text "Generate my garden" click >/dev/null; $AB $S wait 1500 >/dev/null
say "4 · garden (plan)"; $AB $S eval "$STATE"; shot 04-garden-plan-desktop
$AB $S find first "#viewbar [data-mode=present]" click >/dev/null; $AB $S wait 800 >/dev/null; shot 04b-garden-presentation-desktop
$AB $S find first "#viewbar [data-mode=garden]" click >/dev/null; $AB $S wait 3000 >/dev/null; shot 04c-garden-3d-desktop
$AB $S find first "#gtools [data-mode=plan]" click >/dev/null; $AB $S wait 800 >/dev/null
say "5 · revision: lasso + language"; $AB $S eval "$LASSO"; $AB $S wait 400 >/dev/null; shot 05a-revision-selected-desktop
$AB $S find first "#say3" fill "Too dense here, but keep the privacy." >/dev/null
$AB $S find last "#gform button" click >/dev/null; $AB $S wait 1200 >/dev/null
$AB $S eval "$STATE"; shot 05b-revision-preview-desktop
$AB $S find first "#banner [data-act=apply]" click >/dev/null; $AB $S wait 800 >/dev/null; $AB $S eval "$STATE"; shot 05c-revision-applied-desktop
$AB $S press "Meta+z" >/dev/null; $AB $S wait 600 >/dev/null; say "undo"; $AB $S eval "$STATE"
$AB $S press "Meta+Shift+z" >/dev/null; $AB $S wait 600 >/dev/null; say "redo"; $AB $S eval "$STATE"
$AB $S find first "#drawer-tab button" click >/dev/null; $AB $S wait 600 >/dev/null; shot 06-schedule-drawer-desktop
$AB $S find first "#drawer .head [data-act=toggle-drawer]" click >/dev/null; $AB $S wait 300 >/dev/null
$AB $S find first "#gtop [data-stage-link=site]" click >/dev/null; $AB $S wait 1200 >/dev/null; say "back to site"; $AB $S eval "$STATE"; shot 07-back-to-site-desktop
$AB $S find role button click --name "Open the garden" >/dev/null; $AB $S wait 1200 >/dev/null; say "back to garden"; $AB $S eval "$STATE"

say "8 · phone 390 × 844"
$AB $S set viewport 390 844 >/dev/null; $AB $S open "$BASE/design/?fresh=1" >/dev/null; $AB $S wait 1200 >/dev/null; shot 01-welcome-phone
$AB $S find text "Try the example" click >/dev/null; $AB $S find text "Start designing" click >/dev/null; $AB $S wait 1500 >/dev/null; $AB $S eval "$STATE"; shot 02-site-phone
$AB $S find role button click --name "Set the site" >/dev/null; $AB $S wait 500 >/dev/null; $AB $S find text "Accept this bed" click >/dev/null; $AB $S find text "Continue to the design intent" click >/dev/null; $AB $S wait 1500 >/dev/null; $AB $S eval "$STATE"; shot 03-intent-phone
$AB $S find text "Generate my garden" click >/dev/null; $AB $S wait 1500 >/dev/null; $AB $S eval "$STATE"; shot 04-garden-plan-phone
$AB $S find first "#viewbar [data-mode=garden]" click >/dev/null; $AB $S wait 3000 >/dev/null; shot 04c-garden-3d-phone
$AB $S find first "#gtools [data-mode=plan]" click >/dev/null; $AB $S wait 600 >/dev/null; $AB $S eval "$LASSO"; $AB $S wait 400 >/dev/null; shot 05a-revision-selected-phone
$AB $S find first "#say3" fill "Too dense here, but keep the privacy." >/dev/null; $AB $S find last "#gform button" click >/dev/null; $AB $S wait 1200 >/dev/null; $AB $S eval "$STATE"; shot 05b-revision-preview-phone
$AB $S close >/dev/null
say "done → $OUT"
