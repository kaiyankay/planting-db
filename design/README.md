# design/ — Planting Intelligence · Design Workspace (Phase 2)

**Local:** `python3 -I tools/design_server.py` → <http://127.0.0.1:8768/design/> (projects are saved as files in `designs/`) · any static server on the repository root also works (`python3 -m http.server 8766` → `/design/`, saving falls back to the browser's localStorage) · **GitHub Pages (after a push):** <https://kaiyankay.github.io/planting-db/design/>. Phase 1 (`brain/explorer/`) and the earlier previews are untouched.

Brief 2026-11-07 (*Planting Intelligence — Phase 2 Agent Handoff*, `docs/07`). A **conversational + spatial workspace**: the user describes a site and what they want in plain words; the workspace separates stated facts from assumptions and unknowns, fills a typed **Site / Bed model** on a live canvas (draw, type W × H, trace a photo or sketch, note an address), turns the words into an **editable brief** (values · hard constraints · spatial functions from the database's Z vocabulary), **generates** plant objects with real species ids, positions in metres, groups and a schedule from the ten-plant database (`brain/data/explorer.json`, M49), and then keeps language as the control: **circle a region and say "too dense here, keep privacy"** → a typed command → a scoped preview (changed ids, count delta, nothing outside the scope moves) → Apply / Undo. 2D plan, 3D isometric proxy, schedule, versions and exports are projections of the one model. Nothing here is a plant fact: every species, value, size proxy, function link, status, verification and AI check comes from the Phase 1 projection and is cited.

## Run

```bash
cd planting-db
python3 -I tools/design_server.py --port 8768      # serves the root + /api (designs/ files; live model only with ANTHROPIC_API_KEY + anthropic SDK)
python3 -I tools/design_tests.py                   # headless Chrome: engine/model/interpreter tests + the 12-step journey + the saved file -> eval/design-tests-<date>.md
```

Open <http://127.0.0.1:8768/design/>. `?journey=1&fresh=1` runs the demonstration journey (the **Demo journey** button runs it step by step with pauses); `&stop=N` stops after step N; `&sel=plant-001` opens a plant's evidence; `&tab=versions|assumptions|model`. `?data=<path>` points at another knowledge projection.

Files: `index.html` (layout, styles) · `js/model.js` (Project → Site · beds · features · conditions · inputs → Brief → DesignVersion[]; undo/redo; diff; persistence) · `js/geom.js` (metres: polygons, inset, edge facing, side regions, hex lattice, seeded noise) · `js/knowledge.js` (adapter over explorer.json: size proxies with their claim, gates against site conditions, function support, evidence cards) · `js/intent.js` (**offline interpreter**: every rule listed; descriptions → facts/values/functions/unknowns; utterances → typed spatial-edit requests with scope resolution) · `js/engine.js` (assemblage with reasons, zones, placement operators, validation, evaluation, scoped edits, direct edits) · `js/render.js` (2D SVG, 3D isometric proxy, schedule, evidence, versions, evaluation) · `js/app.js` (the workspace, exports, the journey) · `tests.html` + `js/tests.js` (invariants) · `../tools/design_server.py` · `../tools/design_tests.py` · screenshots `../brain/screenshots/design/`.

## Functionality matrix (what really runs)

| capability | status | how |
|---|---|---|
| natural-language intake → site facts, values, functions, constraints, unknowns | **implemented (offline rules)** | `intent.js` rule parser; every match carries the quoted text; no dimension, soil, light or cost is ever invented |
| live language model interpretation | **implemented, not exercised** | `tools/design_server.py /api/interpret` calls the Claude API (`claude-opus-5-5`, structured JSON) only when `ANTHROPIC_API_KEY` and the `anthropic` package exist; the masthead says which mode runs; no key on this machine |
| typed Site / Bed model with provenance, precision, known / stated / assumed / inferred / unknown | **implemented** | `model.js`; every condition = value · status · source; beds have status (`ai-suggested` → `user-accepted`), features are locked objects |
| manual drawing: site boundary, bed, no-plant zone, tree; W × H quick site; scale calibration | **implemented** | canvas tools; calibrate = two points + a real length rescales the geometry; scale status is shown and gates "measured" claims |
| photo / sketch input | **assisted (manual)** | image shown as an overlay to trace over, with opacity and width; **no automatic recognition** — labelled as such |
| address input | **reference only** | stored with `lookup_performed: false`; nothing inferred; labelled |
| AI-suggested bed / tree / open-zone from language | **implemented as candidates** | a bed inset from the boundary, a tree marker on the named side (canopy assumed), an open zone in the middle — all `ai-suggested` / `inferred`, editable, never silently measured |
| knowledge retrieval and gates | **implemented** | `knowledge.js` over explorer.json: light / water / soil → pass · conditional · fail · unknown · not recorded, each with claim ids; unknown never passes; maintenance, ecology, origin, invasive shown |
| spatial functions (Screen · Scrim · Canopy · Ground Cover · Barrier) | **implemented** | the Phase 1 link cells: status (derived / candidate / unknown) · conflict · verification kept apart; privacy → Screen (Scrim as the alternative) |
| placement operators | **implemented** | `along_edge` (row inside the chosen edges, spacing from the spread proxy) · `stagger` (offset second row, taller first) · `fill_drift` (hex lattice + seeded jitter, species by a noise field → drifts) · `repeat_accent` (every 4th ground position toward the open side) · `avoid_obstacle` / `keep_open` filters; density is a real parameter |
| lasso / text-only reference + language edit → scoped preview → Apply / Undo | **implemented** | `interpretEdit` + `previewEdit`: reduce / increase density, remove / swap species, move away from a feature; "here/this" → the drawn selection, "right side" → the eastern third of the bed, else the whole bed (said so); preserve screen keeps screen-row plants; nothing outside the scope moves (asserted) |
| direct manipulation | **implemented (modest)** | drag a plant, Delete, Add tool; each is a version through the same checks |
| 2D / 3D from the same model | **implemented** | SVG plan (scale bar and north only when grounded) · isometric proxy with claim-proxy heights, unknown heights drawn flat and dashed |
| schedule · versions · evaluation · exports | **implemented** | schedule counted from the objects; versions chain by parent with diff; evaluation reports only measurable things (area, counts, edge-row cover, open-zone intrusion, gate counts) and says cost / ecology are not computed; exports: model JSON, plan SVG (ids on every circle), schedule CSV, assumptions MD |
| persistence | **implemented** | localStorage always; `designs/<id>.json` through the design server |
| economic / ecological scores, pollinator optimisation, compatibility | **not computed, by design** | no prices, no interaction data; ecological-value claims are listed per species instead |
| automatic image recognition, geocoding, site measurement | **not implemented** | labelled fallbacks above |

## Operators (design rationale, each a real geometric rule)

- **along_edge** — for each bed edge facing the requested side (outward normal within 50° of the compass direction; "boundary" = edges facing away from the site centroid), a line inset by the lead species' proxy radius; positions every 0.75 × claimed mature spread (planting spacing: canopies meet and overlap at maturity, recorded as an assumption); two screen species alternate.
- **stagger** — a second row 1.6 radii further in, shifted half a spacing, where the bed is deep enough; the lower screen species takes it (layer by height: taller at the edge).
- **fill_drift** — a hexagonal lattice over the bed at 0.65 × the mean claimed spread of the ground species, seeded jitter 0.35, species assigned by a smooth value-noise field (drifts rather than a checkerboard); points inside no-plant zones, under tree canopies (0.6 × radius) or too close to the edge are dropped.
- **repeat_accent** — every 4th ground position nearest the open zone (or the front edge) becomes the accent species (recorded ecological value or interest).
- **Local edits** act only on objects inside the resolved scope: reduce density removes the most crowded first (seeded tie-break) and never a screen-row plant when privacy is to be preserved; increase density adds lattice points where spacing allows; move away pushes plants of known height radially until clear or reports that it cannot; a refused request (fill the open zone with trees) leaves the design identical.

## What is never done

No plant fact is written in the interface. No dimension, light, soil, cost or ecological performance is invented: unknown stays unknown and a gate on an unknown condition reads *unknown*, never *pass*. AI assessments are shown beside human verification, never merged. Shared traits and survey co-listing never become compatibility. No object outside the user's scope changes in a local edit. Phase 1 and the canonical plant files are untouched.
