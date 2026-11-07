# Planting Intelligence · Design Workspace — Phase 2 report, 2026-11-07

Brief: *Planting Intelligence — Phase 2 Agent Handoff* (2026-11-07, `Planting_Intelligence_Phase2_Agent_Handoff/docs/07`). Delivered: `design/` (the conversational + spatial workspace), `tools/design_server.py` (local server, `designs/*.json` persistence, the live-model endpoint), `tools/design_tests.py` → `eval/design-tests-2026-11-07.md` (**50 / 50 pass**), the saved demonstration project `designs/demo-backyard.json`, ten real screenshots in `brain/screenshots/design/`, methods **M50**. Phase 1 (`brain/explorer/`), the earlier previews, `plants/`, `relations.json`, `review/` and `brain/data/*` are untouched; nothing was pushed.

## 1. Actual outputs first

**Local preview:** `python3 -I tools/design_server.py` → <http://127.0.0.1:8768/design/> (`?journey=1&fresh=1` replays the demonstration; the **Demo journey** button plays it with pauses). Any static server on the repository root also serves it (`/design/`), with localStorage persistence only.

**The demonstration journey, as executed by the app and recorded in `designs/demo-backyard.json`** (plant counts from the file):

| step | user action | what the model did (observable) | screenshot |
|---|---|---|---|
| 01 | *"I have a small backyard with an old tree on the north side. I want privacy, low maintenance and some ecological value, but it should not feel closed in. The kids need the middle to play."* | values privacy · low maintenance · ecology · openness (2/3 each); Screen on the boundary, Scrim as the alternative, Ground Cover; hard constraints *keep the centre open*, *preserve the tree*, *never outside beds*; **unknown: dimensions / scale, light, soil, ecological performance**; no geometry, no quantities; three blockers named | `01` |
| 02 | types **6 × 4 m** above the canvas | boundary (user-stated rectangle), scale *user-stated*; the tree marker placed a quarter along the north edge (**inferred**, canopy **assumed 1.5 m**), an open zone in the middle (**inferred**, 3.8 m²), Bed 1 = the site inset 0.3 m (**ai-suggested**) | `02` |
| 03 | accepts Bed 1 | status `user-accepted` (18.4 m²) | `02` |
| 04 | *"Privacy along the north edge; keep the middle open; it is part shade."* | Screen → north-edge; light = part-shade (**user-stated**) | `03` |
| 05 | generate (seed 42) | **37 plant objects, 5 species**: along_edge 3 (*Gaultheria shallon* · *Vaccinium ovatum*, Screen *derived*), stagger 3, fill_drift 31 (*Arctostaphylos uva-ursi* · *Polystichum munitum*, Ground Cover *derived*), repeat_accent 6 (*Achillea millefolium*, pollinator claim); excluded: the three trees (claimed mature spread exceeds the bed, claim ids cited); screen row cover 2.28 / 5.4 m (continuity 0.42, a geometric proxy); 0 plants in the open zone; **gates read unknown** (soil and water unknown) | `04`, `09` |
| 06 | 3D | the same 37 ids and positions as isometric proxies; heights from claims, unknown ones flat and dashed | `05` |
| 07 | lasso over the right side + *"Too dense here, but keep the privacy."* | typed command: scope **selection** ("here" → the drawn lasso), `reduce_density` 25 % (default candidate, adjustable), preserve `z:screen`; **19 targets, 2 screen-row plants kept, 5 of 17 eligible removed** (most crowded first); **nothing outside the scope moved** (asserted); privacy marked as an intent, not a guarantee | `06` |
| 08 | Apply | new version `v-…` (parent = the generated one), 37 → **32** plants; schedule recomputed | `07` |
| 09–10 | Undo · Redo | 37 → 32 again, byte-equal objects | `07` |
| 11 | *"Move the taller plants away from the tree."* (no lasso) | scope = whole bed (said so), `move_away` filter *taller* (known height ≥ 1 m), feature = the tree; **1 moved, 1 could not be moved within the bed**; plants with unknown height not moved | `08` |
| 12 | Export | model JSON · plan SVG (an id on every circle) · schedule CSV · assumptions MD — **32 = 32 = 32** plants | — |

Evaluation panel (`10`): measured things only — bed area, counts by role, edge-row cover, open-zone intrusion, gate counts; *cost: no prices in the database — not computed*; *ecology score: no pollinator-interaction data — no score*.

## 2. Actual AI behaviour vs simulated / fallbacks

| | status |
|---|---|
| language interpretation | **offline rule parser** (`design/js/intent.js`, every rule listed; provenance `offline-parser` on every interpretation, the matched text as evidence). The masthead and every AI message say so. |
| live language model | **implemented, not exercised**: `tools/design_server.py /api/interpret` (Claude API, `claude-opus-5-5`, structured JSON matching the same schemas) runs only with `ANTHROPIC_API_KEY` + the `anthropic` package; neither exists on this machine. No screenshot shows live-model output. |
| photo / sketch | **manual aid**: overlay to trace over, opacity and width controls; no recognition. |
| address | **reference only** (`lookup_performed: false`). |
| site geometry | typed W × H, drawn polygons, calibration — user-stated / user-drawn / user-calibrated; language-suggested tree, open zone and bed are `inferred` / `ai-suggested` candidates. |
| plant knowledge | the Phase 1 projection only (`brain/data/explorer.json`, 10 species, M49): gates, size proxies (one claim chosen deterministically, alternatives counted, conflicts flagged), function links with status · conflict · verification · AI check kept apart. |
| spatial engine | deterministic code (`design/js/engine.js`), seeded; no model text in any number. |
| cost · ecology · compatibility | not computed; stated as such in the evaluation and in the brief's unknowns. |

## 3. Tests (`tools/design_tests.py`, headless Chrome 156, 50 / 50)

- **T·A–F (36)** in `design/tests.html`: adapter (ids, size proxy cites its claim and follows the stated light condition, gates never pass on unknown, function support fields apart) · model (readiness blockers, locked features, accepted bed) · interpreter (description → values/functions/constraints/unknowns with no invented dimension; dimensions/light/soil read; "right side" → direction scope polygon; "here" → selection; contradictory request refused; "move the taller plants away from the tree" → typed command; overclaim classified) · generation (ids, species from the database, every object inside the bed, none in the open zone or under the tree, schedule = objects, Screen row from Screen-linked species, operators named, proxies cite claims, no tree in a 6 × 4 bed with the reason recorded, no geometry error, no invented scores, **deterministic with the same seed and id start**, another seed moves positions but not the assemblage, density 0.7 → fewer plants) · local edits (removals only inside the scope, nothing outside changed, screen-row plants kept, preview uncommitted then applied with the parent link, undo byte-equal and redo, move_away only known heights, refused request leaves the design identical, direct move and delete, species swap re-gated).
- **J1–J12 (11)**: the journey above, replayed headless and checked step by step (scoped command, untouched outside, export counts equal).
- **S1–S3 (3)**: the design server saves `designs/demo-backyard.json`; versions chain by parent id; the current version's schedule equals its objects; every saved plant lies inside its bed polygon (checked on the file, not the UI).
- Browser (1440 × 900, the built-in pane): the journey, the 3D view and the evidence card were also run by hand; no console error on the current files.

## 4. Files and commit

New: `design/{index.html, README.md, tests.html, js/{geom,model,knowledge,intent,engine,render,app,tests}.js}` · `tools/design_server.py` · `tools/design_tests.py` · `designs/demo-backyard.json` · `eval/design-tests-2026-11-07.md` · `brain/screenshots/design/01…10` · this report. Modified: `.claude/launch.json` (entry `design`), `.gitignore` (`designs/proj-*.json`), `methods.md` (M50), `HANDOFF.md`, `README.md`. No canonical file, Phase 1 file or pipeline output changed. Committed on `main` on 2026-11-07 (the commit that adds this report); **not pushed** — the GitHub Pages URL <https://kaiyankay.github.io/planting-db/design/> goes live only after Kay pushes.

The earlier React/Vite prototype (`kaiyankay/planting-intelligence`) was audited from a clone: its offline rule-parser / live-model split and its deterministic engine informed this design; it was not modified and could not be built here (no Node on this machine), which is why the workspace is dependency-free JavaScript in `planting-db`.

## 5. Unresolved evidence and limits

- **Site gates mostly read unknown**: with soil and water unstated every placed plant's overall gate is *unknown* (light passes). This is correct and visible; stating conditions in the rail changes the gates and the assemblage on regeneration.
- **Size proxies are thin and sometimes disputed**: one claimed range per species (median of the usable ranges; conditioned ranges follow the stated light, e.g. salal's height under shade); *Arctostaphylos* spread is 0.1–0.5 m (RHS) against 0.9–1.8 m (MOBOT) — the proxy takes the median and the card says sources disagree. Planting spacing (0.75 × / 0.65 × mature spread) is a design assumption, recorded on every version.
- **Screen continuity is a geometric proxy** (row cover / edge length), never a screening performance; "keep privacy" is an intent that keeps screen-row plants untouched.
- **Two of the Screen species carry a conflict** (*Vaccinium ovatum*, *Cornus sericea*: a use claim against a habit claim) — shown on the card and in the assemblage reasons; *Cornus sericea* is not chosen while salal and huckleberry rank higher (derived without conflict first).
- **No tree can be placed in the 6 × 4 m demo bed** at claimed mature spread (the three trees' spreads are cited) — the existing tree is the only canopy.
- **Ecology / cost**: ecological-value claims (pollinator, bird food, erosion control …) are listed per species; no score, no price, no pollinator-interaction data.
- **Interpreter coverage**: the offline rules read the demonstration sentences and the brief's adversarial cases (contradiction, overclaim, text-only "right side", "move the taller plants"); phrasing outside the listed rules yields "no rule matched" rather than a guess. A live model would widen coverage but has not been exercised.
- **Single bed is the tested path**; several beds are supported by the model (each bed generates on its own; site-wide values apply, bed conditions override) but the journey and tests cover one bed.
- **Known data issue carried over** from Phase 1: `relations.json` record `rel:gaultheria-shallon:vaccinium-ovatum:m2` names a missing claim (flagged in explorer.json, not fixed here).

## 6. Prioritised next work

1. Exercise the live-model path (`ANTHROPIC_API_KEY`, `pip install anthropic`) and compare its interpretations with the rule parser on the journey sentences; keep both labelled.
2. Multi-bed journey and tests (site values → bed overrides); bed splitting on the canvas.
3. Richer edit operators grounded in the data: swap by role ("more evergreen here"), spacing changes, layer requests ("a lower layer in front").
4. Drawn selections of edges (not only regions) and per-edge function requests from the canvas.
5. Claims the engine needs most: habit / density for Screen, Scrim and Barrier; verified practitioner relations; a tier-B toxicity source.
