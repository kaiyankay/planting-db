# Spatial Proposal workflow — the four pages and the three levels (2026-11-08)

Read this before touching the Shape stage, the bed model, the planting engine's bed handling, or any UI that creates, shows or
edits planting beds. It records what was built on 2026-11-08 and the acceptance rules that keep later UI work from sliding back
to the old "one bed = the site inset by 0.3 m" default.

## The pages

| page | stage id | what the user does | what the system does |
|---|---|---|---|
| 1 · Describe (the Imagine hero, **frozen**) | `welcome` | describes the site and the wish in words; optional photo / draw / dimensions / address | reads site facts, values, functions, hard constraints (offline rules or the live model); nothing geometric is invented |
| 2 · Shape | `site` | sees the site model and the AI planting-bed proposal on one canvas; accepts, rejects, reshapes, adds, deletes beds; compares alternatives; says what should change | derives the plantable area, proposes beds by named spatial operations with reasons, validates every polygon, previews every change before Apply |
| 3 · Compose | `intent` | adjusts values, site-wide and per-bed spatial functions, density / second row / seed | checks every species against the site gates **per bed** and shows the candidates per bed |
| 4 · Grow | `garden` | generates, explores (plan · presentation · 3D), revises (lasso + words, direct edits), exports | one DesignVersion over all confirmed beds; partial regeneration when a bed's outline changes; schedule / SVG / CSV / MD from the same objects |

## The three levels (never confuse them)

1. **Site Model** (`project.site`): boundary · scale · orientation · features (existing trees with position + canopy, no-plant zones = open areas, buildings / paths / paved) · conditions · notes read from words but not yet placed · `proposals` · `history`. Every fact carries a status (`user-stated`, `user-drawn`, `user-edited`, `inferred`, `assumed`, `unknown`). A tree read from words is placed at an **estimated** position and labelled so on the canvas and in the inspector until the user drags it.
2. **Planting Bed Proposal** (`design/js/spatial.js` over `design/js/clip.js`): `plantable = site − excluded areas (open areas, buildings, paths + clearance)`; trees are constraints (overlap is recorded as "under canopy — conditional"), never automatic exclusions. Operations: `edge` (band inside chosen boundary edges), `island` (around a tree), `ribbon` (corridor), `infill` (plantable − kept-out areas − access strip), `modular` (rectangular cells with paths). They compose in order; earlier operations own the ground. One recommended candidate (A) plus alternatives that must differ by ≥ 12 % of the plantable area ("More open centre", "More planting area", "Modular", "Ribbon"); each candidate records bed polygons (+ holes), strategy and parameters per bed, source constraints, reasoning summary, assumptions, validation, status. Beds materialise in `project.site.beds` as `ai-suggested`; the user confirms (`user-accepted`), reshapes (`user-edited`), draws (`user-drawn`) or rejects (`rejected`, kept in the record).
3. **Plant Arrangement** (`design/js/engine.js`): runs per bed over the confirmed geometry (holes honoured), bed-level functions first, site-wide functions as the fallback; ids continue across beds, every object carries `bed_id`; one version carries `bed_ids` and `bed_fps` (a fingerprint per bed) so a later geometry change can be attributed to the beds it touched.

## Language → geometry

The interpreter (offline rules in `intent.js`, or the live model through `tools/design_server.py`) turns a sentence into a **typed request** — `{op: resize|delete|add|move|open_resize|split, target: {side|tree|name}, direction, amount_m, amount_basis}` — and nothing else. The spatial engine locates the bed (`locateBed`), computes before / after geometry (`bedEditPreview`), clips it against the site boundary, the open areas, the excluded features and the other beds, reports every clip and the tree overlap as a check, and states which plants of the current design are affected (`designImpact`). The user sees dashed = before and solid = after on the canvas and applies or discards. **A model never returns coordinates that are taken as a bed.**

## When geometry changes after a design exists

`E.geometryImpact(project, version)` names the changed / removed / added beds and the plants now outside a bed. The Grow stage shows a banner, never regenerates silently: **Preview updated design** runs `E.regenerateBeds` (changed beds only; plants of unchanged beds byte-equal; user-placed plants in a changed bed kept where still valid) as an ordinary preview (red removals, green additions) → **Apply** makes a new version with the old one as parent, or **Keep current version** acknowledges the difference. Versions remain viewable in the drawer.

## Acceptance rules (run `python3 -I tools/spatial_tests.py`; 87 checks on 2026-11-08)

- The Shape stage never shows a single bed that is the site inset by a margin as the default; the recommended layout comes from the operations above with a reasoning line per operation.
- No boundary → a **conceptual** proposal (the moves in words, the size question); no polygon, no metres, no bed row.
- Every proposed bed: inside the site, outside every open area and excluded feature, no overlap with another bed, narrowest width ≥ 0.5 m, area ≥ 0.6 m²; validation issues are shown, never hidden.
- Alternatives are real alternatives (≥ 12 % of the plantable area differs) or they are not shown.
- Confirmed beds never move by themselves: when the site or the intent changes, suggested beds follow the new proposal, confirmed beds stay and the panel offers *Recompute the layout*.
- Direct editing works on the geometry: corner drag, midpoint-to-corner, bed drag, corner delete, tree drag; every hand edit is validated and undoable (site history, ⌘Z on the Shape stage; *Reset to proposal*).
- A sentence about a bed changes the geometry (preview → Apply), never only the text beside it; the located bed is named back to the user; an unlocatable bed is refused with the list of beds.
- Compose and Grow read the same beds: a card and candidate list per bed; one version over all beds; the schedule, SVG, CSV, MD and 3D count the same objects; nothing is placed in a hole, an open area or outside a bed.
- A geometry change after generation is offered as a partial update with its impact stated; other beds' plants are untouched; the previous version stays viewable.
- The Imagine hero (markup of `#s-welcome`, its CSS rules, the sway animation) is frozen: the welcome section's DOM must hash identical to `brain/screenshots/spatial/00-home-before-welcome-dom.html` after any change.

## Honesty rules carried over

- Offline rules are offline rules (`#interp` tag); the live model path exists in the server but is only "live" with a key and is still only the interpreter.
- Suggested ≠ confirmed; estimated ≠ placed; conditional under a canopy ≠ excluded; the access edge is an assumption until stated.
- Shared traits never imply companion planting; a function link is never a planting verdict; no cost, no ecology score.
