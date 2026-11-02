# brain/ontology-preview — Planting Knowledge Network

**Live:** <https://kaiyankay.github.io/planting-db/brain/ontology-preview/> · v5 stays at <https://kaiyankay.github.io/planting-db/brain/> unchanged.

Briefs 2026-11-02 ("Knowledge Graph Reconstruction" → "Visual Simplification" → "Scalable Knowledge Network Revision"). A **plant-centred, relationship-driven, data-driven** interface over the semantic graph `brain/data/kg.json`: a simple 3D network of spheres and thin lines that opens from the plants and shows how they connect through shared knowledge and through recorded relations. Nothing about the plants, the growth forms or the knowledge areas is written in the interface; it is all read from kg.json, which `tools/build_kg.py` builds from the claims, the entity records, `relations.json` and the ontology.

## Run

```bash
cd planting-db && python3 -m http.server 8766          # serve the planting-db root (launch.json entry "brain")
python3 -I tools/pipeline.py                            # rebuild after any data change: ontology → graph → kg → validate
```

then <http://localhost:8766/brain/ontology-preview/>. Another database root with the same layout: `?db=../../tests/scale/out/db-100` (roots written by `tools/scale_test.py`).

Files: `index.html` · `js/app6.js` (registry, force layout, spheres and lines, disclosure, cards, paths, ask, growth) · `js/kg.js` (loader + graph engine, the browser port of `tools/kg_query.py`) · shared `../js/graph.js`, `../js/diagnosis.js`, `../js/model.js` · screenshots in `../screenshots/ontology-preview/`.

## How the network opens (methods M34)

| click | shows | from |
|---|---|---|
| **overview** | the growth forms (Tree, Shrub, Graminoid, Herbaceous perennial, Fern, Vine — dormant ones small, "no plant yet") and the plants read as each form | `growth_form` concepts; classification edges (M29) |
| **growth form** | its plants, lit | classification edges |
| **plant** | one ring per non-empty **knowledge area**: Classification · Environmental Conditions · Morphology & Growth · Ecological Performance · Planting Design Functions · Plant-to-Plant Relationships · Evidence & Sources (a ring is a grouping of the plant's edges, not knowledge) | `ontology.json knowledge_areas`, `kg.json plant_areas` |
| **area ring** | the knowledge nodes behind it, grouped by facet in the card; the plant's claim lines leave from the open ring (white when a claim is verified, area colour when unverified, lavender derived, amber candidate) | claim / entity / classification / height-band / layer / design edges |
| **knowledge node** | every plant linked to it (an **indirect connection**: two plants reach the same node), its group children and the concept relations it takes part in (a trait → the design concepts that require it; a design concept → its required traits, the KPU uses that name it, the plants derived or candidate for it) | plant lists on concept nodes; `requires_trait` · `maps_to` · `typically_formed_by` · `corresponds_to` |
| **Plant-to-Plant ring** | the other plants with a direct relation; the card lists every other plant with the number of shared knowledge nodes by area and its direct relations with status | `kg.json plant_pairs`, `relations.json` |
| **pair card → an area** | the shared knowledge nodes of that area, lit between the two plants | `plant_pairs.shared_by_area` |
| **line** | the evidence trace: relation type, status (documented · derived · candidate · unknown), the claims with attribution, verification, stated conditions, place and source link, the rule or literature source; for a design link the full requirement check. The sources behind the claims appear in the network | kg.json edges and claim index |

Shared attributes are an indirect connection, never a planting recommendation: the card says so, and only `relations.json` makes a direct line between plants (model placeholders drawn amber as candidates, only while a plant is open).

## Interaction

- Click a sphere to open it; click it again to close what it opened. The signal runs once along the links just revealed, then rests; the rest of the network dims while something is in focus.
- **← Back / Esc** restores the previous state (60 steps); **Overview** returns to the growth forms; the background only deselects. The trail under the title shows the last clicks.
- **Ask**: graph retrieval — recognise plants and knowledge nodes by alias, traverse, claims in R5 order with R6 attribution, L0 withheld; reveals and lights what it reaches; the LLM context block is behind a fold.
- **Paths A–D**: the prototype explorations (seeds chosen from the data: first growth form in use, Screen, the first plant with a condition-dependent variation, Scrim), revealed wave by wave.
- **+ Observation**: a sentence becomes a candidate claim; a magenta line grows from the plant; the design requirement check re-runs with it and says "met by your candidate only" — the link stays candidate. Session only, nothing written.

## Scalability (Tests B and C, `eval/scale-test-<date>.md`)

- Layout is force-directed from the drawn links only; positions persist across clicks; the simulation cools and stops.
- The overview holds growth forms + plants (100 plants = 106 spheres). Labels: always on growth forms, plants (until more than 60, then only the focused ones), open rings and hubs; everything outside the focus set dims.
- `kg.js` fetches `kg.json` (and the ontology, schema, sources, synonyms, intent map) once — no per-plant requests.
- `tools/scale_test.py` writes roots with 1, 10, 50 and 100 **synthetic** plants (obviously synthetic names and sources, never in `plants/`), runs the unchanged pipeline on them and reports counts, timings, growth-form detection, pairs and gaps. With `?db=` the interface opens such a root as it would the real one.
- Known cost: `plant_pairs` is quadratic (5,253 pairs at 103 plants, 17.5 MB); beyond ~100 plants write it sparsely (pairs with ≥ k shared nodes or a direct relation) or as its own file.

## Limits

- Three real plants: the Planting Design Functions area is thin by construction; concepts no plant reaches stay hidden until a plant reaches them.
- *Vaccinium ovatum* ↔ Screen reads "contradicted by traits" (its one habit claim says Upright; GPP's "dense formal hedge" sits in a use claim) — shown, not hidden.
- Labels nudge apart vertically only; an open area with many nodes (Planting Design Functions, 23 for salal) is dense until the camera comes closer.
