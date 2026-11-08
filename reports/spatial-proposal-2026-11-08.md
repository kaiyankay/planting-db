# Spatial Proposal & Planting Bed Generation — technical report (2026-11-08)

Brief: *Planting Intelligence — Phase 2 Spatial Intelligence & Planting Bed Generation*. Repository `kaiyankay/planting-db`; live after the push at https://kaiyankay.github.io/planting-db/design/ ; local `python3 -I tools/design_server.py` → http://127.0.0.1:8768/design/ .

## 1. What was built

The design journey now runs **Describe → Shape → Compose → Grow** over one model, with a new Level 2 between the site model and the planting engine:

| level | module | role |
|---|---|---|
| 1 · Site Model | `design/js/model.js`, `app.js` (interpreter → facts) | boundary · scale · orientation · trees (estimated positions labelled) · open areas · buildings / paths · conditions · notes · proposals · site history |
| 2 · Planting Bed Proposal | **`design/js/spatial.js`** over **`design/js/clip.js`** (new) | plantable area = site − excluded areas − clearances; beds by named operations (edge · island · ribbon · infill · modular); recommended layout + alternatives; validation; bed edits in words → before / after geometry; design impact |
| 3 · Plant Arrangement | `design/js/engine.js` (rewritten for many beds) | one DesignVersion over all confirmed beds, per-bed functions and candidates, holes honoured, partial regeneration after a geometry change |

The Shape page (`design/index.html` §2, `app.js` `renderShape`, `css/journey.css` appended block) is canvas-first: the proposal panel (A / B / C, reasoning, a row per bed with Accept / Reject, Accept this layout, Draw a bed, Undo, Reset to proposal, "How the beds were made" with operations · constraints · assumptions · validation), the "Tell me what should change" composer with its preview card (before → after m², narrowest width, conflicts, notes, impact on the current design, amount slider, Apply / Discard), and the stated / inferred / unknown inspector collapsed beneath. On the canvas: confirmed beds solid olive, suggested beds dashed caramel, open areas dotted, the plantable ground as a faint blue outline (toggle), the tree with "position estimated · canopy assumed" when read from words, bed labels with function and area; selecting a bed shows corner handles (drag), midpoint handles (drag to add a corner), double-click deletes a corner, dragging the bed moves it, dragging the tree moves it; a pending change draws dashed = before and solid = after. Compose shows site-wide functions plus a card per bed (its functions, editable; its species candidates checked against the site gates for that bed; under-canopy area as conditional). Grow generates every bed in one version, shows per-bed counts, and after a geometry change shows the banner *The planting areas changed (…) → Preview updated design / Keep current version*.

The Imagine page is unchanged: `#s-welcome` hashes identical to the baseline DOM (`brain/screenshots/spatial/00-home-before-welcome-dom.html`), the 29 welcome / hero / composer CSS rules are byte-identical, and a reduced-motion pixel diff of the old (git HEAD) and new page is **0 px below the nav bar** at 1440 × 900 and **0 px** at 390 × 844. The only pixels that differ are the three stage labels in the top bar (Site · Intent · Garden → Shape · Compose · Grow), which the brief's page names require.

## 2. Geometry engine

Evaluated in the browser (headless Chrome, `design/vendor/README.md`):

| library | result | decision |
|---|---|---|
| **polygon-clipping 0.15.7** (MIT; + splaytree 3.1.2 MIT, robust-predicates 3.0.2 Unlicense) | union / difference / intersection / xor in float metres; returns `[outer, hole…]`; cleans self-intersections; load 41 ms, five ops 8.6 ms | **adopted**, vendored as ES modules in `design/vendor/polygon-clipping/` (two bare imports rewritten to relative paths; nothing else changed) |
| clipper2-js 1.2.4 (Boost) | offset and booleans ran correctly, but integer coordinates (1 m = 1000 units), the opposite orientation sign to this workspace's rings, holes as separate paths, 190 kB | evaluated, **not adopted**: offsets are built from the booleans instead (`inset` = shape − union of edge capsules; `outset` = shape ∪ edge capsules), which is concave- and hole-safe and needs no second coordinate convention |
| @turf/turf 7.4.0 (MIT) | geographic operations in lon / lat with geodesic distances | **not adopted**: the model is a local planar metre system; x / y metres must never be passed as degrees |

`clip.js` adds `toMulti / fromMulti`, `inset / outset`, `edgeBand`, `minWidth` (bisection on inset, 2 cm resolution), `validRing` (≥ 3 points, non-zero area, union of itself is one piece with the same area), `containsShape`, `overlapArea`. The existing `geom.js` (ray-cast point test, bisector inset, hex lattice, noise, compass helpers) is untouched except for three additions (`pointInShape`, `areaShape`, `distToShapeEdge`); SVG, three.js and the Design Model are kept.

## 3. Spatial proposal engine (`spatial.js`)

- **Derived site**: excluded = no-plant zones (open areas) + buildings / paths / paved / structures with a 0.3 m clearance; trees are constraints with position status and canopy status; compass edges of the boundary from `edgesFacing`; access edge assumed south (stated via a site note) and kept free 0.9 m; questions when nothing is measured.
- **Operations** (composable, in order; earlier operations own the ground): `edge` (one band per side, clipped to the plantable area; the first side keeps the corner), `island` (canopy + pad, capped at 35 % of the shorter site side), `ribbon` (capsule between two anchors), `infill` (plantable − kept-out − access strip), `modular` (rectangular cells with 0.7 m paths). Each piece is named by its side or position, carries strategy, parameters, basis, functions, narrowest width, under-canopy overlap (conditional, not excluded) and notes; slivers (< 0.15 m²) and pieces too small (< 0.6 m²) or too narrow (< 0.5 m) are dropped and counted.
- **Candidates**: A (recommended) = screen bands on the named sides (1.2 m, 0.9 m on small sites) + borders framing an open centre (0.8 m) or a perimeter (1.0 m) + tree islands; B = "More open centre" (one-row screen, no borders) — or, without an open wish, "Modular beds" on a rectangular site / "Ribbon" on an irregular one; C = "More planting area" (wider screen, bigger islands, infill of everything but the open area and the access strip — the old "fill the site" default survives only as this explicit, explained alternative). An alternative is shown only if ≥ 12 % of the plantable area differs from A. Every candidate records beds, strategies, metrics (site, plantable, planted, open, share), reasoning summary, assumptions, source constraints, validation and status.
- **Validation** (`validateBeds`): invalid outline or hole, area outside the site, area inside an excluded feature or open area, overlap between beds (errors); below minimum width or area (warnings). Shown in the panel, exported in the model.
- **Conceptual proposal** when no boundary: the moves in words (ordered), the size question, the open / screening question; no polygon, no metres.
- **Bed edits**: `locateBed` (by id, name, "tree", or side — centroid heading from the site centre, named beds first; ambiguity reported), `bedEditPreview` for resize (grow = outset clipped by boundary / open areas / excluded features / other beds, each clip reported; shrink = inset with the boundary strip restored so edges on the fence stay), move, delete, add (band along a side), open-area resize (beds clipped by the larger open area, reported), split (0.6 m path); tree overlap growth reported as a conditional check; `designImpact` lists affected plants per bed and the untouched beds.

## 4. Interpreter and the live model

`intent.js` gained `RULES.bed_edits` (resize · verb-resize · delete · add · move · open-area resize · split; sides, "tree", metres or "a bit / much") and `interpretBedEdit`, and `classify` routes a bed sentence to the spatial engine even from the garden composer (a plant-edit sentence still goes to the planting engine). `tools/design_server.py` gained `BED_EDIT_SCHEMA` and the `bed_edit` kind for the live path, with the instruction that the model returns the typed request only and never coordinates.

**Actual state:** `ANTHROPIC_API_KEY` is not set and the `anthropic` package is not installed on this machine, so the live path was **not** exercised; every interpretation in this work ran on the offline rule parser and the interface says so (`offline rules` tag, "interpretation: offline-parser (rule …)" on every reply). No key is in the repository or the pages.

## 5. Planting engine changes (`engine.js`)

`generate(project, K, bedIds, seed, params)` runs `generateBed` per bed (a seed offset per bed so drifts differ), continues plant ids across beds, merges assemblages (per bed under `assemblages`, union under `assemblage`), records `bed_ids` and `bed_fps`; `placeable` honours holes and bed-edge distance on holes; `assemble` uses the bed's own functions first and excludes species whose claimed spread exceeds a narrow bed; `zonesFor` prefers edges that lie on the site boundary; `validate` / `evaluate` work per plant's bed and report per-bed counts; `previewEdit` / `directEdit` look up the bed per plant (adding a plant outside every bed is refused; moving into another bed re-assigns it); `geometryImpact` compares `bed_fps` with the current beds; `regenerateBeds` replants only the changed beds, keeps the other beds' plants byte-equal and user-placed plants in a changed bed where still valid, and returns an ordinary preview. Positions are rounded to 1 cm before the placement check (a latent issue: an object could previously land exactly on an exclusion edge).

## 6. Tests

| runner | result | what |
|---|---|---|
| `tools/spatial_tests.py` | **87 / 87** (`eval/spatial-tests-2026-11-08.md`) | engine invariants A–F (37, unchanged), **G** clip (7), **H** spatial proposals (12: 6 × 4 demo site, vague input, L-site with shed + path + tree, 12 × 3, 30 × 20, open area → infill with a hole, modular, validation), **I** multi-bed generation (5, incl. a bed with a hole), **J** bed revision + partial regeneration (11); Demo A (6), Demo B (3), Demo C (6) replayed in the page |
| `tools/design_tests.py` | **89 / 89** (`eval/design-tests-2026-11-08.md`) | the 12-step demonstration journey (now with the multi-bed layout: J2 ≥ 2 suggested beds, J3 layout accepted, J5c every bed planted) and the saved file |
| `tools/ux_tests.py` | **41 / 41** (`eval/ux-tests-2026-11-08.md`) | UX acceptance scripts A–D at desktop and phone widths |
| `sh tools/shots.sh` | 19 screenshots | `brain/screenshots/spatial/` |

Geometry validation results on the demo site (6 × 4 m, tree north, open centre): plantable 20.16 m² of 24; A = North bed 5.4 m² (Screen, 2.44 m² under the canopy as conditional), East bed 2.48 m², West bed 2.48 m², Tree island 2.56 m² — planted 12.93 m², open 7.23 m², all valid; B = 8.12 m² planted / 12.04 open; C = 15.47 / 4.69. Demo C: "Make the north planting bed wider." → North bed 5.4 → 6.51 m² (narrowest 1.39 m), 2.19 m² clipped against the neighbouring beds (reported), growth across the boundary clipped (noted); 13 plants affected, 3 beds untouched; partial regeneration −13 +11, 27 plants in unchanged beds byte-equal; export SVG = CSV = model = 38 plants.

## 7. Browser demos and screenshots

**Real browser** (the app's browser pane, Chrome, 1024 × 768; typed text and clicks, a few navigation steps by DOM click): `brain/screenshots/spatial/50–63-real-*.jpg`.

| # | state | what the model held |
|---|---|---|
| 50 | Demo A · Shape after typing the sentence on Imagine and submitting | 6 × 4 m; tree inferred (position estimated, canopy assumed); open centre inferred; 4 suggested beds (North bed 5.4 m² Screen, East 2.48, West 2.48, Tree island 2.56); candidates A / B / C |
| 51 | Demo A · after *Accept this layout* | all four beds `user-accepted`, drawn solid; site history 2 |
| 52 | Demo A · Compose | 4 bed cards, 14 candidate chips, Generate enabled |
| 53 | Demo A · Grow, plan | version with 40 plants: North 13 · East 19 · West 6 · Tree island 2; validation ok; 40 symbols |
| 54 | Demo A · Grow, 3D | three.js garden with 40 plant objects (531 meshes) over the four bed shapes |
| 55 | Demo C · "Make the north planting bed wider." typed on Shape — canvas | North bed located; 5.4 → 6.51 m²; dashed before / solid after; 1.89 m² clipped against the neighbouring beds (reported); growth across the boundary clipped (note); 13 plants affected, 3 beds untouched |
| 56 | Demo C · the preview card | the same numbers, the amount slider (0.5 m, "default — adjust before applying"), Apply / Discard |
| 57 | Demo C · after Apply (Shape) | North bed `user-edited` 6.51 m², the other beds unchanged, history 3 |
| 58 | Demo C · Grow banner | "The planting areas changed (North bed): 0 plants now outside a bed; 3 other beds unaffected." → Preview updated design / Keep current version |
| 59 | Demo C · update preview | −13 (red) +11 (green), 27 plants in 3 unchanged beds kept exactly; continuity 0.59 → 0.59 |
| 60 | Demo C · applied | version 2 (parent = version 1), 38 plants, North bed 11, validation ok, 38 symbols |
| 61 | Demo C · versions drawer | both versions listed; the old one can be made current |
| 62 | Demo B · Shape after "I want a low-maintenance ecological garden." | no boundary, no bed; the conceptual move and the size question |
| 63 | Demo B · after typing "It is 5 x 4 m." | North 5 m², East 3, West 3 suggested; A perimeter / B modular / C more planting |

**Headless Chrome, scripted replays** (`sh tools/shots.sh`; 1440 × 900 and 390 × 844): `00-home-before-*` and `01-home-after-*` (regression), `10–13` Demo A (Shape desktop + phone, Compose, Grow plan, Grow 3D), `20–21` Demo B (conceptual, then sized), `30–37` Demo C (preview, applied, Compose updated, Grow banner, update preview, updated plan, schedule drawer, updated 3D).

**Impeccable**: `impeccable context` (no PRODUCT.md / DESIGN.md in the project; proceeded as a scoped refinement of existing code) and `impeccable detect --json design/index.html` after the work: two findings, both inherited from the frozen Imagine design and outside this brief's scope (the Fraunces display face and the cream palette flagged as overused defaults). The Shape page keeps the existing tokens on purpose (the brief: continue the home's botanical / editorial / calm language; interaction logic first).

## 8. Known limitations

- The offline parser understands sides (north / south / east / west, left / right, back / front), "the tree island", "the open area" and metres; "the bed next to the shed" or a bed named by colour is not resolved (it is refused with the list of beds).
- Operations are composed by rules on the brief (privacy → edge band; open wish → borders; habitat → perimeter; tree → island; regular site → modular alternative; irregular → ribbon alternative); there is no search over layouts and no scoring; alternatives are the stated variants only.
- The access edge is an assumption (south) unless the user states it in a site note; the tree position read from words is an estimate (a quarter along the named edge, 1 m in) until dragged; the open centre read from words is a suggested 40 % × 40 % rectangle.
- Widening a band that already touches its neighbours is clipped by them (reported); the user must shrink or remove a neighbour first — no automatic negotiation between beds.
- Hand-reshaped beds are validated and warned about, but overlaps are not auto-resolved; `Undo` and `Reset to proposal` are the recovery.
- The photo overlay is still traced by hand; the address is still a reference; the live model is untested here.

## 9. Files changed / added

New: `design/js/clip.js`, `design/js/spatial.js`, `design/vendor/polygon-clipping/*`, `design/vendor/README.md`, `tools/spatial_tests.py`, `tools/shots.sh`, `.claude/skills/planting-intelligence-ux/references/SPATIAL_PROPOSAL.md`, `reports/spatial-proposal-2026-11-08.md`, `eval/spatial-tests-2026-11-08.md`, `brain/screenshots/spatial/*`. Changed: `design/index.html` (Shape section, Compose copy, generate disabled by default), `design/css/journey.css` (Shape block appended; one grid rule renamed; welcome rules untouched), `design/js/app.js` (Shape stage, bed editing, multi-bed Compose / Grow, demos), `model.js` (beds with holes · functions · strategy · confirmation, site history, helpers), `geom.js` (three helpers), `engine.js` (multi-bed, partial regeneration), `intent.js` (bed-edit rules), `render.js` (holes, ghosts, handles, plantable outline, labels), `garden3d.js` (holes), `tools/design_server.py` (bed_edit schema), `tools/design_tests.py`, `tools/ux_tests.py`, `.claude/skills/planting-intelligence-ux/SKILL.md` + `references/PRODUCT_CONTEXT.md` + `references/UX_ACCEPTANCE.md`, `methods.md` (M53), `HANDOFF.md`, `design/README.md`.

## 10. Preview and deployment

Local: `python3 -I tools/design_server.py --port 8768` → http://127.0.0.1:8768/design/ (the app's preview pane used port 8769 because 8768 was already serving). Static deployment: GitHub Pages from `main`, https://kaiyankay.github.io/planting-db/design/ (offline parser, localStorage persistence; the server-only parts — saved files and the live-model endpoint — are absent there and the page says so).
