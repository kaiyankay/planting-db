# brain/explorer — Plant Knowledge Explorer (Phase 1)

**Local:** serve the repository root and open <http://localhost:8766/brain/explorer/> · **Live (after push):** <https://kaiyankay.github.io/planting-db/brain/explorer/> · the earlier interfaces stay unchanged at `brain/` (v5), `brain/ontology-preview/` and `brain/xyz-preview/`.

Brief 2026-11-07 ("Plant Knowledge Explorer — Phase 1", after the desk crit). One workspace, one selection state, four linked views over the **same ten-plant database**: a **Relationship graph**, a **Spatial function matrix** (10 species × 5 functions), a GIS-style **Attribute table** and an **Inspector** that shows the evidence behind any line or cell and compares two plants (A / B) in four separate sections. Nothing about the plants is written in the interface: it reads `brain/data/explorer.json`, the relational projection `tools/build_explorer.py` writes from `kg.json`, `xyz.json`, `relations.json`, `sources.json` and the AI assessments (methods M49).

## Run

```bash
cd planting-db && python3 -m http.server 8766          # serve the repository root (launch.json entry "brain")
python3 -I tools/pipeline.py                            # after any data change: ontology → graph → kg → xyz → explorer → validate
python3 -I tools/explorer_tests.py [--browser]          # Tests A–J on the projection (K drives headless Chrome) -> eval/explorer-tests-<date>.md
```

then <http://localhost:8766/brain/explorer/>. `?data=<path>` points the page at another projection file. The URL hash carries the state (`fk`/`fi` focus, `a`/`b` plants, `ik`/`ii` inspected record, `tab`), so any view can be shared or screenshotted.

Files: `index.html` (layout, styles) · `js/model.js` (loader, indexes, graph neighbourhoods by record kind, search) · `js/app.js` (state, URL, the four renderers, inspector, A/B comparison) · no library, SVG graph with a deterministic force layout · screenshots in `../screenshots/explorer/`.

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

## The four views and the linked state

- **Graph** — overview: the ten species, the five functions and the 21 drawn links (the matrix as a graph). Focus a **function**: the species linked to it (solid olive = derived from a recorded use, dashed amber = candidate inferred by KG-R4, rust = a conflict), the traits it requires (dotted) and the species → trait claim lines that satisfy them; species whose link is **unknown** stand in a bottom row as hollow ghosts with **no edge**. Focus a **species**: its functions, its concepts clustered by knowledge group, its live `relations.json` records (violet, typed). Focus a **concept**: the species that reach it and the functions requiring it. **Pair**: A and B, the concepts both reach, their functions, the typed record between them. Click a node → focus; click a line → its evidence; drag / wheel.
- **Matrix** — rows species, columns the five functions; a cell reads *use* (derived, KG-R1) · *traits* (candidate, KG-R4) · *contradicted* · *no evidence*, with *conflict* and *✓n* verified use claims. Column header → focus the function; row header → focus the species; cell → the evidence (use claims with their AI check, rule text, requirement check with met / unmet / unknown and the contrary claims). Blank is never read as unsuitable.
- **Attribute table** — identity columns, then one column per facet grouped by knowledge group (toggle groups, filter species, sort by a column). A cell lists every distinct value with its claim count (`·c` = stated conditions), ✓ when a value is verified, ⚠ when sources disagree, *by condition* when a variation is recorded; *not recorded* is written where no claim exists. With a function focused, the columns it requires are marked and the linked species sort first. Cell → every claim behind every value.
- **Inspector · Compare A / B** — four sections kept apart: **1 Shared attributes** (facet by facet: shared concept, A-only, B-only, not recorded, ⚠ disagreement — "a computable overlap, not companion-planting evidence"), **2 Direct recorded relationships** (live `relations.json` records, or *None recorded — an honest absence*; retired records folded as history), **3 Potential spatial complementarity** (distinct function combinations from the two plants' live links, labelled layering / arrangement *hypotheses*; shared functions named as alternatives, not complements), **4 Evidence and unknowns** (claims, sources, AI checks, unknown functions, facets not recorded, disagreements, no human decisions in this projection).

One state drives everything: selecting **Screen** focuses the graph, marks the matrix column, marks the table's required columns and sorts the linked species first; clicking a matrix cell opens its evidence and lights the same line in the graph; setting A and B fills the comparison and rings the two species wherever they appear.

## What is never done here

No value is averaged or picked as 'best'. No plant-to-plant line is drawn from shared traits (M43). No unknown function link is drawn. No candidate is promoted; no claim status changes; the AI assessment is shown beside, never instead of, verification. Retired relations are listed as history and never become live. The interface files name no plant, concept or function id (Test I).

## Tests (`tools/explorer_tests.py`)

A counts · B integrity · C evidence trace · D status / verification / AI check kept apart, nothing promoted, unknown never drawn · E matrix = xyz suited_for lines + gaps · F relations (retired = history) · G pairs (direct ids, shared ⊆ kg, hypotheses only from drawn links) · H table = xyz lines + plant attributes, every value kept, disagreement = kg conflicts · I interface names no id · J stats · K (`--browser`) headless Chrome through the two acceptance paths. 23 checks, 29 with the browser; report in `eval/explorer-tests-<date>.md`.
