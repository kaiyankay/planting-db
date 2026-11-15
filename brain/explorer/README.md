# brain/explorer — Knowledge Explorer

**Local:** serve the repository root and open <http://localhost:8766/brain/explorer/> · in the platform it is **Knowledge → Explore** (`/explore/` in the published layout) · the earlier interfaces stay unchanged at `brain/` (v5, the Neural view), `brain/ontology-preview/` and `brain/xyz-preview/`.

Brief 2026-11-07 ("Plant Knowledge Explorer — Phase 1", after the desk crit); reorganised 2026-11-14 for Platform V2 (progressive disclosure). One selection state and **one working view at a time** over the **same ten-plant database**: a **Relationship graph** that grows only by the layers the reader adds, a **Spatial function matrix** (10 species × 5 functions), a GIS-style **Attribute table** and an **A / B comparison** in four separate sections, with the **Evidence inspector** as a contextual panel beside whichever view is open. The default entry is a **start screen** — search, the five functions, the ten species, three questions — never the whole graph. Nothing about the plants is written in the interface: it reads `brain/data/explorer.json`, the relational projection `tools/build_explorer.py` writes from `kg.json`, `xyz.json`, `relations.json`, `sources.json` and the AI assessments (methods M49). Graph, matrix and table are views of that one file, not separate stores.

## Run

```bash
cd planting-db && python3 -m http.server 8766          # serve the repository root (launch.json entry "brain")
python3 -I tools/pipeline.py                            # after any data change: ontology → graph → kg → xyz → explorer → validate
python3 -I tools/explorer_tests.py [--browser]          # Tests A–J on the projection (K drives headless Chrome) -> eval/explorer-tests-<date>.md
```

then <http://localhost:8766/brain/explorer/>. `?data=<path>` points the page at another projection file. The URL hash carries the state, so any view can be shared or screenshotted:

| key | meaning |
|---|---|
| `fk`, `fi` | the focus: `species` · `function` · `concept` (`fi` = its id) or `pair` (with `a` and `b`) |
| `a`, `b` | the two species of the comparison |
| `ik`, `ii` | the inspected record: `link` · `attr` · `concept_link` · `relation` · `species` · `function` · `concept` |
| `v` | the working view: `graph` · `matrix` · `table` · `compare`. Without `v`, a focus opens the graph, `tab=compare` (the V1 inspector tab) opens the comparison, a lone `ik=attr` / `ik=link` opens the table / the matrix, and an empty hash opens the start screen — every V1 link lands where it did |
| `x` | layers added to the graph, comma-separated: `traits` · `gaps` · `relations` · `all` · a knowledge-group id (below) |

Files: `index.html` (layout, styles over the platform tokens of `platform/css/platform.css`) · `js/model.js` (loader, indexes, `graphFor(focus, a, b, x)` and `layersFor(focus)`, search) · `js/app.js` (state, URL, start screen, the four renderers, inspector) · no library, SVG graph placed by rule on rings around the focus (a small force layout only for a pair) · screenshots in `../screenshots/platform-v2/explorer-*.png` (V1: `../screenshots/explorer/`).

## The projection (`brain/data/explorer.json`)

Storage stays where it is (`plants/*.json`, `relations.json`, `ontology.json`); the "attribute table" is a **view**. Logical collections, every record naming the kg.json / xyz.json ids and claims it stands for:

| collection | what | count (2026-11-07) |
|---|---|---|
| `species` | identity from the entity records: names, family, genus, KPU type, origin, growth form (M29 vote + evidence), claim counts | 10 |
| `facets` | the attribute columns: every ontology facet the claims reach, with its knowledge group and policy (node / attribute, from `build_xyz`) | 27 |
| `attributes` | one cell per (species, facet) with ≥ 1 live claim or entity record; **every distinct value kept** with its claims, sources, conditions, cultivar, verification; `disagreement` = kg.json conflict on that cell; a missing cell = *not recorded* | 230 (40 not recorded, 27 with a disagreement) |
| `functions` | the five spatial functions (Ceiling / Canopy · Ground Cover · Screen · Scrim · Barrier) with their literature requirements (required / preferred, alternatives) | 5 |
| `function_links` | **exactly species × functions** cells: status · conflict · verification kept apart; use claims, rule, full requirement check; unknown cells carry their verdict (*evidence missing* vs *contradicted by traits*) | 50: derived 12 · candidate 9 · unknown 29 (26 contradicted, 3 missing) · 4 conflicts |
| `concept_links` | the plant → concept lines of xyz (why a plant meets a requirement) | 361 |
| `relations` | every `relations.json` record, retired ones as history (never live, never drawn), placeholders flagged, dangling claim references listed as `missing_claims` | 41 (19 live · 22 retired) |
| `pairs` | the 45 unordered pairs: shared concepts by area (kg `plant_pairs`), attribute overlap per facet, live and retired direct records, complementarity hypotheses (distinct functions the two plants' live links allow) | 45 (17 with a live record) |
| `claims` · `sources` · `rules` · `evidence_checks` | the evidence layer: claims copied from xyz (+ any a record names), the AI source assessments keyed by claim id | 501 claims · 17 sources · 534 checks |

**Three statements on every record, never merged:** `status` (documented · derived · candidate · unknown — what kind of knowledge a link is), `verification` (verified only when a human verified a supporting claim; 38 of 501 claims are), and the **AI evidence check** (supported / partially supported / conflicting — an assessment by the review pipeline, never a verification; 38 verified claims were not queued and read *not assessed*).

## Start, the four views, the inspector

- **Start** (no focus, no `v`) — the search (species, functions, the concepts a plant reaches; `/` focuses it), then three ways in: the five spatial functions with their definition and linked · unknown counts, the ten species, and three questions that open a view (where sources disagree → Table; which links are stated, inferred or unknown → Matrix; what two plants share and what is recorded between them → Compare). The full graph is one explicit link away, never the default.
- **Graph** — expanded on purpose. No focus: the five functions only (`x=all` adds every species and the 21 drawn links). A **function**: the function and the species linked to it (dashed olive = derived from a recorded use, dashed caramel = candidate inferred by KG-R4, rust = a conflict); *Required traits* (`traits`) adds the traits it requires and the linked species' claim lines to them, *Species without a link* (`gaps`) adds the unknown species as hollow ghosts in a row underneath, with **no edge**. A **species**: its linked functions; one toggle per knowledge group adds its trait concepts of that group (`x=<group id>`, or `traits` for all), *Plant-to-plant records* (`relations`) its live `relations.json` records (ink, typed), *Functions without a link* (`gaps`) the unknown functions as ghosts. A **concept**: the species that reach it and the functions requiring it. **Pair**: A and B, the concepts both reach, the functions of each and any direct record — a line joins the two plants only where a relation was recorded. Around a focus the nodes stand on rings placed by rule, so a selection always gives the same picture. Node → focus; line → evidence.
- **Matrix** — rows species, columns the five functions; a cell reads *use* (derived, KG-R1) · *traits* (candidate, KG-R4) · *contradicted* · *no evidence*, with *conflict* and *✓n* verified use claims; the legend stands under the table. Column header → focus the function; row header → focus the species; cell → the evidence. Blank is never read as unsuitable.
- **Table** — identity columns (toggle), then one column per facet grouped by knowledge group (toggle groups, filter species, sort by a column). A cell lists every distinct value with its claim count (`·c` = stated conditions), ✓ when a value is verified, *disagree n* when sources disagree, *by condition* when a variation is recorded; *not recorded* is written where no claim exists. With a function focused, the columns it requires are marked and the linked species sort first. Cell → every claim behind every value.
- **Compare A / B** — a primary view; four sections kept apart: **Shared attributes** (facet by facet: shared concept, A-only, B-only, not recorded, disagreement — "a computable overlap, not companion-planting evidence"), **Direct recorded relationships** (live `relations.json` records, or *None recorded — an honest absence*; retired records folded as history), **Potential spatial complementarity** (distinct function combinations from the two plants' live links, labelled layering / arrangement *hypotheses*; shared functions named as alternatives, not complements), **Evidence and unknowns** (claims, sources, AI checks, unknown functions, facets not recorded, disagreements, and whether anything is recorded about how the two plants behave with each other — nothing biological is inferred from the other three sections).
- **Evidence inspector** — a panel on the right, open when something is focused or inspected, closed with its button or `Esc` (a second `Esc` clears the focus). The name of the record first, then its kind, then status · verification · AI check as three separate statements: link (use claims with their AI check, rule text, requirement check with met / unmet / unknown and the contrary claims; for Screen a link *Trace this into a design* to the Knowledge overview), attribute cell, concept link, relation record, species (with the platform's shared plant card), function, concept.

One state drives everything: focusing **Screen** draws its graph, marks the matrix column, marks the table's required columns and sorts the linked species first — whichever of these is open, and switching the view keeps the selection; clicking a matrix cell opens its evidence, and the same line is selected when the graph is opened; setting A and B fills the comparison and rings the two species wherever they appear.

## What is never done here

No value is averaged or picked as 'best'. No plant-to-plant line is drawn from shared traits (M43). No unknown function link is drawn. No candidate is promoted; no claim status changes; the AI assessment is shown beside, never instead of, verification. Retired relations are listed as history and never become live. The interface files name no plant, concept or function id (Test I).

## Tests (`tools/explorer_tests.py`)

A counts · B integrity · C evidence trace · D status / verification / AI check kept apart, nothing promoted, unknown never drawn · E matrix = xyz suited_for lines + gaps · F relations (retired = history) · G pairs (direct ids, shared ⊆ kg, hypotheses only from drawn links) · H table = xyz lines + plant attributes, every value kept, disagreement = kg conflicts · I interface names no id · J stats · K (`--browser`) headless Chrome, one view at a time: the start screen without a graph, the default and the expanded function graph, the same focus in the matrix and in the table, evidence with the trace link, the honest unknown, the comparison (also through the V1 `tab=compare` link), the pair graph, a species growing by group and by relation records, a V1 deep link to one attribute cell. 23 checks, 35 with the browser; report in `eval/explorer-tests-<date>.md`.
