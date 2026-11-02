# Knowledge Graph Reconstruction — technical report · 2026-11-02

Brief: *Planting Intelligence — Knowledge Graph Reconstruction* (XYZ ontology, semantic graph, 3D Neural Knowledge Brain at `brain/ontology-preview/`). Branch `feature/xyz-ontology-brain`. Methods M31–M33. Nothing in `plants/*.json`, `relations.json` or the verification status of any claim was changed; the original Neural Brain v5 is untouched at `brain/`.

## 1. What changed

| layer | before | now |
|---|---|---|
| Ontology (`ontology.json`) | 0.1.0 · 312 concept nodes in 8 dimensions | **0.2.0 · 398 nodes**: 3 axis + 14 category + 39 facet nodes (the XYZ architecture as real nodes), 340 concepts — the 312 unchanged ids plus 5 taxon nodes (family, genus from the entity records) and 23 design (Z) concepts; every node has id · definition · parent (`hierarchy_parent`) · source · aliases; **53 typed concept relations** (`relations`) with source and status |
| Graph (`brain/data/graph.json`) | plant → concept claim edges, growth form, relations, diagnosis | unchanged in scope (v5 keeps working); **`brain/data/kg.json`** is the semantic graph: 431 nodes · 906 edges, every edge with `rel`, `kg_status` (documented · derived · candidate · unknown), `verification`, `basis` (claim ids / rule / literature source); full claim index; gaps and conflicts as data |
| Builder | `tools/build_graph.py` | + **`tools/build_kg.py`** (rules KG-R1 … KG-R5, named on every derived edge) |
| Validator | plants, relations | + ontology 0.2.0 (node fields, parents, relation types / endpoints / status / source, design concepts must cite a source) + kg.json (endpoints, status vocabulary, cited claims exist, a candidate design edge has every required trait met, design edges are never *documented*, model placeholders are candidates) — **6/6 reports OK, 0 errors, 0 warnings** |
| Retrieval | `tools/retrieve.py` (BM25 stand-in, R5 ranking) | + **`tools/kg_query.py`**: recognise → traverse → claims → LLM context block; the four paths A–D; `eval/kg-paths-2026-11-02.md` generated from the graph |
| Schema (`schema.json`) | 0.4.0 | 0.4.1: optional `media[]` on claims (image · photo · gis · plan · section · observation · document) for the multimodal layer; empty today; ontology note updated |
| Sources (`sources.json`) | 22 | + 4 literature sources (Robinson 2016, Rainer & West 2015, Oudolf & Kingsbury 2013, Mooney 2020), tier B: chapter titles cited, no passages |
| Brain | v5 `brain/` | + **`brain/ontology-preview/`** (`index.html`, `js/app6.js`, `js/kg.js`); redrawn the same day as a minimal sphere-and-line network with progressive disclosure (M33a); live at <https://kaiyankay.github.io/planting-db/brain/ontology-preview/> |

## 2. The XYZ architecture (ontology → XYZ mapping)

| axis | category | facets (existing → new) |
|---|---|---|
| **X** Plant Identity & Classification | Taxonomy | `taxon_family`, `taxon_genus` (new; species = plant records, cultivars from claims) |
| | Growth Form | `growth_form` (M29), `plant_type` (KPU) |
| **Y** Plant Traits & Performance | Environmental Conditions | `exposure` (Light), `soil`, `water`, `hardiness` ×3, `wind` |
| | Morphology | `height_class`, `spread_class`, `form`, `habit`, `texture`, `colour` |
| | Temporal Performance | `growth_rate`, `month` (phenology), `season`, `evergreen`, `interest`, `fruit`, `photoperiod` |
| | Ecological Performance | `ecology`, `origin`, `invasive`, `stress`, `browsing`, `pest`, `maintenance`, `toxicity` |
| **Z** Planting Design Knowledge | Vertical Structure | `layer` (Canopy · Understory · Shrub layer · Ground layer), `height_band` (Robinson's five bands) — new |
| | Space-making | `spatial` (Screen · Scrim · Barrier · Ceiling) — new |
| | Planting Composition | `composition` (Matrix · Drift · Grouping · Scatter · Layering) — new |
| | Planting Roles | `role` (Structural · Seasonal theme · Ground cover · Filler · Accent) — new |
| | Landscape Use (KPU) | `use` — the documented bridge into Z (`maps_to`, KG-R1) |
| cross-dimensional | Place · Time · Evidence & Sources · Media | `place`, `age`; sources / respondents; `media[]` slot |

The old `dimensions` (condition · trait · use · time · place · status · resistance · classification) are kept for v5 and the validator; `xyz` adds axes, cross layers, the relation types and the status vocabulary.

Sources for Z (chapter titles verified against the published tables of contents on 2026-11-02; page-level wording to confirm): Robinson, *The Planting Design Handbook* 3rd ed. — ch. 3 "Spatial Characteristics of Plants" (height bands: ground-level/carpeting, below knee, knee to eye level, above eye level, trees), ch. 4 "Creating Spaces with Plants" (degree, permeability and transparency of enclosure), ch. 7 "Emphasis and Accent", ch. 8 "Plant Assemblages" (forest structures, canopy structures, layers within layers, matrix planting), ch. 12 "Canopy and Seasonal Layers", "Accents", "Planting Patterns"; Rainer & West, *Planting in a Post-Wild World* — structural and framework, seasonal theme, ground cover, dynamic filler layers; Oudolf & Kingsbury, *Planting: A New Perspective* — matrix, primary, scatter plants, drifts vs blocks; Mooney, *Planting Design: Connecting People and Place* — ch. 5 "Space and Place", ch. 6 "The Elements of Design".

## 3. Relation vocabulary and rules

| relation | from → to | status | basis |
|---|---|---|---|
| `part_of`, `narrower_than` | concept → facet → category → axis; concept → group | documented | ontology |
| `in_genus`, `in_family` | plant → genus → family | documented | entity record |
| `is_growth_form` | plant → growth form | derived (supported / to confirm) | M29 |
| `grows_in` · `has_morphology` · `has_temporal_trait` · `has_ecological_value` · `resists` · `susceptible_to` · `used_for` · `classified_as` · `has_origin` | plant → concept, one per claim per concept | documented; verification = claim status | claim id, source |
| `in_height_band` | plant → height band | derived | **KG-R2** numeric bounds; conditions, cultivar, place carried |
| `occupies_layer` | plant → vertical layer | derived | **KG-R5** growth form forms the layer ∧ a height claim reaches a band the layer corresponds to |
| `requires_trait` (required / preferred, alternatives) · `maps_to` · `typically_formed_by` · `corresponds_to` | concept → concept | documented / derived (**KG-R1**, **KG-R3**) | literature source; `to_confirm` flag |
| `suited_for` | plant → design concept | **derived** (KG-R1: sourced KPU use names the concept) · **candidate** (KG-R4: every required trait met) · **unknown** (evidence missing or contradicted) | use claims; per-requirement check with evidence |
| `companion` · `co_listed` · `competes` · `layered_under` | plant → plant | documented · derived · candidate (model placeholders) | relations.json |

What is deliberately **not** linked: shrub ⇏ screen (growth form never implies a use); shared habitat ⇏ companion (co-occurrence stays a `derived` E-Flora relation with its context); keyword similarity is used nowhere for linking.

## 4. The four exploration paths (from `eval/kg-paths-2026-11-02.md`, all generated)

- **A Classification** — Shrub → *Gaultheria shallon* (supported: OSU, E-Flora, survey) and *Vaccinium ovatum* (to confirm: RHS use mention + survey) → attributes by category (environment, morphology, temporal, ecological, landscape use, place) → claims in R5 order with status and conditions.
- **B Design knowledge** — Screen → needs above-eye-level or tree height (Robinson ch. 3), dense habit (ch. 4, to confirm), prefers evergreen (ch. 4, to confirm); named by KPU *Screening*, *Sheared hedge*, *Hedge row* → *Acer palmatum* derived (MOBOT lists screen; habit unknown), *Gaultheria shallon* derived and supported by traits (USDA hedge tolerance; OSU dense; height above eye only under "shade, good soil"), *Vaccinium ovatum* derived but **contradicted by traits** (GPP and the survey list it for hedge/screen; its one habit claim says Upright, not Dense).
- **C Knowledge variation** — salal × height: 5 live claims from 4 sources; OSU gives ≤ 0.6 m in full sun on poor soil and 1.2–3 m in shade on good soil (variation with stated conditions); RHS, E-Flora and USDA give 1–1.5 m / to 1.5 m / 1.8 m with no condition stated; places UK, BC, North America, Willamette Valley; none from the Vancouver scale.
- **D Knowledge gaps** — Scrim: the term is from the brief (not found in Robinson under that name); requires above-eye height and an open/twiggy/arching habit (to confirm); no source links any plant; the trait check contradicts salal and huckleberry (habits Dense / Upright) and is unknown for the maple (no habit claim).

## 5. Knowledge gaps that remain (shown in the brain, never hidden)

1. **Literature at page level** — 22 `requires_trait` / `corresponds_to` relations and the height-band bounds (knee ≈ 0.5 m, eye ≈ 1.6 m) are readings of chapter headings; Kay to confirm against Robinson ch. 3–4, 8, Rainer & West and Oudolf & Kingsbury. The *Scrim* node is flagged `to_confirm`.
2. **Design concepts no plant reaches by any source or rule** — Scrim, Drift, Scatter (composition patterns are planting-plan knowledge; no claim type carries them yet). Understory and Shrub layer are reached only by rule KG-R5.
3. **Contradicted design links (11)** — mostly honest: a maple is not a ground cover or a matrix plant; a shrub is not a ceiling. The one that matters: *Vaccinium ovatum* ↔ Screen / Barrier contradicted because its single `habit` claim is *Upright* while GPP's use text says it "shears into a dense formal hedge" — the density sits in a use claim, not a habit claim. A second habit claim from GPP (or a practitioner) would resolve it; the brain's observation form shows exactly that mechanism (the check turns to "met by your candidate only", status stays candidate).
4. **Unknown links (2)** — *Acer palmatum* ↔ Scrim / Barrier: no habit claim at all for the maple.
5. **Gate facets without a claim** — *Acer palmatum* and *Vaccinium ovatum* on ecological value (pollinator / wildlife); *Gaultheria shallon* on maintenance level.
6. **Conflicts** — 14 disagreements (height, spread, water, exposure between sources under no stated condition) and 1 condition-dependent variation (salal height), unchanged from the 2026-10-31 diagnosis; 2 use-vs-trait conflicts (huckleberry for screen and barrier).
7. **Single-source links** — 98 plant–concept links rest on one source.
8. **Place** — no height, habit or use claim at the Vancouver scale for any of the three plants (the City of Vancouver tree inventory gives height classes for the maple only); practitioner claims are L0 and withheld from answers.
9. **Media** — the `media[]` slot exists; no image, GIS layer, plan or site observation is attached yet.
10. **Verification** — 129 T5 claims remain unverified (decision D5: Kay's unified review); every derived and candidate link inherits that status and says so.
11. **Multi-value habit** — KPU's habit facet is single-valued in the schema (`type: enum`); a plant that is both *dense* and *upright* cannot be recorded without two claims. Candidate schema change, not made.

## 6. How to extend

- New plant: add `plants/<id>.json`, run the three builders and the validator; taxonomy, height bands, layers and design links appear from its claims.
- New design knowledge: add a concept and its `requires_trait` relations in `tools/build_ontology.py` with the book and chapter; the validator refuses a design concept without a source.
- New evidence type: attach `media[]` to the claim it supports; the brain's evidence trace will list it (display not built yet).
- An LLM answer: `tools/kg_query.py --ask "…"` prints the context block (attributed claims with status, conditions, place; design concepts with their requirement checks; unknowns stated).

## 7. Verification of this delivery

`python3 -I tools/validate.py` → 6 reports OK. `python3 -I tools/kg_query.py --all` → `eval/kg-paths-2026-11-02.md`. Browser (Chromium, WebGL): home view, path B, evidence trace on *Vaccinium ovatum* → Screen, Gaps & conflicts, Ask, growth of a candidate habit claim and the re-run requirement check — screenshots in `brain/screenshots/ontology-preview/`. v5 at `brain/` loads unchanged (312 concept neurons · 117 in use · 590 synapses).
