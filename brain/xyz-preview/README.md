# brain/xyz-preview — XYZ Knowledge Graph

**Live:** <https://kaiyankay.github.io/planting-db/brain/xyz-preview/> · the earlier interfaces stay unchanged at `brain/` (v5) and `brain/ontology-preview/`.

Brief 2026-11-03 ("XYZ Knowledge Graph Reconstruction"). A 3D network of spheres and fine lines on a warm white ground that opens from three **exploration entrances** — not coordinate axes, not three separate graphs — and reveals, click by click, the real connections of one node at a time. Every line opens its evidence trace. Nothing about the plants is written in the interface: it reads `brain/data/xyz.json`, the projection `tools/build_xyz.py` writes from the semantic graph `brain/data/kg.json` (methods M48).

## Run

```bash
cd planting-db && python3 -m http.server 8766          # serve the repository root (launch.json entry "brain")
python3 -I tools/pipeline.py                            # after any data change: ontology → graph → kg → xyz → validate
python3 -I tools/xyz_tests.py                           # Tests A–J on the projection -> eval/xyz-tests-<date>.md
```

then <http://localhost:8766/brain/xyz-preview/>. `?data=<path>` points the interface at another projection file.

Files: `index.html` · `js/app.js` (3D graph, disclosure, focus, cards, paths, search) · `js/xyz.js` (loader, adjacency, disclosure rules by node kind, search) · vendored `../vendor/3d-force-graph.min.js` (1.80.1, MIT) and `../vendor/three/` (0.186, MIT) · screenshots in `../screenshots/xyz-preview/`.

## The three entrances

| | nodes | what connects them | where it comes from |
|---|---|---|---|
| **X · Plant Classification** | the botanical growth forms that have plants (Tree · Shrub · Herbaceous perennial · Fern); Graminoid and Vine are hidden until a plant arrives | `is_growth_form` plant → form (M29, derived; *supported* / *to confirm*) · genus, family and cultivars as secondary taxonomy nodes, opened on demand from a plant | classification edges, taxonomy edges, cultivar nodes of kg.json |
| **Y · Plant Knowledge** | four browsing groups — Environment · Growth & Form · Seasonal & Ecological Performance · Maintenance & Risk — over the 104 knowledge concepts the claims reach (Part sun/part shade, Moist, Evergreen, Dense, Tall shrub planting …). Groups are navigation, not plant attributes | `grows_in` (environment) and `has_trait` plant → concept: one line per pair, the claims behind it aggregated; height bands by rule KG-R2 (derived) | claim, height-band and entity edges of kg.json; the facet → group policy table in `build_xyz.py` |
| **Z · Spatial Functions** | five concepts this phase: Ceiling / Canopy · Ground Cover · Screen · Scrim · Barrier (each stands for the ontology concepts named in `z_functions`; Ceiling / Canopy = `spatial:ceiling` + `layer:canopy`, Ground Cover = `role:ground_cover` + `layer:ground`) | `requires_trait` Z → Y (one line per alternative concept in use; required / preferred; literature source; *to confirm* where flagged) · `suited_for` plant → Z only when **derived** (a source records a use the ontology maps to the concept, KG-R1) or **candidate** (every required trait met by recorded claims, KG-R4). **Unknown** links are never drawn: each Z node lists them as gaps with the missing or contradicted requirement | design edges and `requires_trait` relations of kg.json |

Numbers, ranges, zones, months and KPU landscape uses stay **attributes** of the plant and evidence of the lines (plant card → "attributes kept on the plant"); they do not become spheres. Roles, compositions and layers outside the five functions stay in the underlying graph (plant card → "design evidence outside the five Z functions").

## Status and verification, kept apart

Every line carries `status` — **documented** (a source states it) · **derived** (a recorded rule over recorded claims: M29, KG-R1, KG-R2) · **candidate** (KG-R4 inference or a model placeholder — never promoted) · **unknown** (listed, not drawn) — and, separately, `verification`: **verified** only when at least one live supporting claim is verified (the counts are shown), else **unverified**; entity records read *entity*, literature relations *literature*. Nothing in the projection changes a claim's status. A documented use that a recorded trait contradicts (e.g. *Cornus sericea* → Screen: MOBOT lists screening, the habit claim is not dense) keeps its line and carries a **conflict** tag — shown, not resolved.

Plants that share a concept are connected only **indirectly** (Plant → concept ← Plant); the card says so. Direct plant-to-plant lines come from `relations.json` only, typed (`co_listed` · `companion` · `competes` · `layered_under`), one line per pair and type with every record as evidence; model placeholders are candidates, drawn dashed only when a plant card asks for them.

## Interaction

- **Click a sphere**: it opens its direct connections (by kind — a growth form its plants; a plant its concepts, functions and recorded relations; a group its concepts; a function its required traits and the plants linked to it; a concept its plants and the functions that require it). Click it again to fold what it opened. Lines among visible nodes are drawn as the induced subgraph, so a plant revealed from *Screen* shows its line to a visible trait at once; lines nobody opened stay faint.
- **Click a line**: the evidence trace — relation, status, verification, rule text, every claim with source (name, link, licence tier, place), context, stated conditions, cultivar, confidence and claim status; for `suited_for` the use claims and the full requirement check; for `requires_trait` the literature; for plant relations every record.
- **Search** (`/`) by scientific or common name, concept, alias; **Back** (Esc) restores the previous state (80 steps); **Reset** returns to the 16 initial nodes; **Fit** frames everything; drag to rotate, wheel to zoom. The focused node and its neighbourhood stay lit, the rest dims; the trail under the title records the clicks.
- **Three demonstration paths** (bottom left), found in the data by `build_xyz.py` — one from each entrance — run step by step with camera moves and end with their evidence list. No edge was written for them.

## Counts (2026-11-03)

| level | nodes | edges |
|---|---|---|
| underlying graph `kg.json` | 490 | 2,114 |
| XYZ projection `xyz.json` | 153 (3 entrances · 4 growth forms · 10 plants · 4 groups · 104 concepts · 5 functions · 9 genera · 6 families · 8 cultivars) | 572 (455 semantic + 117 navigation) |
| initial view | 16 | 13 |

Semantic lines: 361 plant → concept, 10 is_growth_form, 18 requires_trait, 21 suited_for (derived 11 · candidate 10; 29 unknown pairs listed as gaps), 27 taxonomy, 18 plant-to-plant. Status 393 documented · 50 derived · 12 candidate; verification 34 verified · 347 unverified · 37 entity · 18 literature · 9 supported · 1 to confirm · 9 none.

## Scaling

A new plant appears after `tools/pipeline.py` with no interface change; a growth form with its first plant appears as an X node; concepts appear when a claim reaches them. The projection grows roughly linearly with plants (one line per plant × concept pair), and only the opened neighbourhood takes part in the layout, so 50–100 plants stay explorable; the growth form → plants step would then want paging in the card.
