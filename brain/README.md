# brain/ — Knowledge Brain v4

**Live:** <https://kaiyankay.github.io/planting-db/brain/> · archived for comparison: `/brain/v3/` (the database as a system), `/brain/v2/` (plant clusters and evidence lenses), `/brain/v1/`.

v4 is a **concept-centred knowledge graph**. Concepts are the nodes (306, from `ontology.json`: conditions, traits, uses, time, place, status, resistance); plants are one node type among several; **claims are the edges** that connect a plant to a concept with provenance (source, status, conditions, place, cultivar, numbers). Entry is by condition, use, place, time or source; plants are where a walk ends. The same concept ids drive the retrieval preview's gates, so brain and AI read one graph.

## Run

```bash
cd planting-db && python3 -m http.server 8766          # serve the planting-db root
```

then <http://localhost:8766/brain/>. The page reads `brain/data/graph.json` and `diagnosis.json` (built by `python3 -I tools/build_graph.py` after any change to claims or ontology), `ontology.json`, and the db files for the retrieval preview. No node, no build; three.js and 3d-force-graph are vendored.

Files: `index.html` · `js/app4.js` (views, panels, Grow, Ask) · `js/graph.js` (loader, indexes, candidate edges, alias matching) · `js/diagnosis.js` (the diagnosis rules, same as `tools/build_graph.py`) · `js/retrieve.js` (port of `tools/retrieve.py`, now resolving KPU labels to concept ids) · `js/data.js` · `js/model.js` · `screenshots/v4/` (11 captures, 2026-10-31).

## Opening view: the diagnosis, not the graph

The panel opens with one computed sentence per plant (how many concepts and facets it links, where sources disagree, what depends on conditions, which gate facets are missing), the hub concepts (linked to two or more plants), and four counts you can open: **depends on conditions**, **sources disagree**, **gaps**, **single voice**. Everything is computed from the files; nothing is hand-written.

## The space (why 2D)

A force layout in two dimensions, rendered in the same dark, glowing space as before (3d-force-graph with `numDimensions(2)`, pan and zoom only). Two dimensions because the thing to read is *which concepts sit between which plants*; depth adds nothing to that and makes labels unreadable. The glow stays because this is still a brain, not a diagram.

| element | drawn from | encoding |
|---|---|---|
| plant | `plants/*.json entity` | warm node with halo; italic label |
| concept | `ontology.json` | small node coloured by dimension (conditions blue, uses green, place orange, time yellow, traits violet, status mint, resistance pink), sized by the number of plants it links; labelled when it links ≥ 3 plants, or ≥ 2 when zoomed, or when focused |
| unused vocabulary | concepts no claim links yet | faint ring at the edge, grouped by dimension (“60 concepts · 18 in use”) — the knowledge base is bigger than the knowledge in it |
| claim edge | one line per plant → concept pair, aggregating that pair's claims | colour = dominant source type; brightness rises with verified share and claim count; dashed magenta = candidate only |
| group link | `parent` in the ontology (Shade ⊃ filtered, deep) | faint dashed; a group inherits its children's links |
| cultivar | `cultivar` lifted from context | small node tied to its plant |
| source | `sources.json` | square at the bottom, coloured by type; hollow when it contributes no claim yet |
| place / time | edge attributes | a place or time concept is linked to the plants whose claims were made there / then |

Focusing anything dims the rest to 8 %; the trail at the top says where you are; Esc or “Up” goes back.

## Entry points and moves

- **Dimension** (rail): facets and concepts of that dimension, with how many plants each links; unused ones greyed. The graph lights the dimension.
- **Concept**: definition (plain language), aliases (the words people typed in the survey), plants linked with every claim as evidence (value, source, status, conditions, place, cultivar; “via Deep shade” when inherited through a group), co-occurring concepts, siblings in the facet. “+ intersect with this” adds it to the active set.
- **Intersection**: up to three concepts; the panel shows the plants that satisfy all with evidence per concept, and the plants that fall away with what they lack. Evergreen ∩ Hedge or screen → *Gaultheria* and *Vaccinium* (both: survey co-listing and USDA / GPP hedge uses); *Acer* falls away on evergreen.
- **Plant**: its diagnosis sentence, “where the evidence pulls apart” (variations and disagreements, clickable), its concepts by dimension (verified ones outlined green, candidates magenta), relations.
- **Variation view**: for a plant × facet with variation, the values lie along the condition axis (sun → shade, then unstated) with source, status and place on each row. **Disagreement view**: the two claims faced against each other, then every claim on the facet.
- **Sources**: by type; a source shows the concepts it links per plant.

## Grow

An observation is parsed into plant + concepts + conditions + place + time (aliases from the ontology; numbers into KPU classes). It becomes candidate edges (dashed magenta), the diagnosis recomputes in the browser, and “What changed” states it in sentences: which edges were gained, whether a hub appeared, whether a variation gained a Vancouver data point, whether a disagreement gained a voice, whether a gate-facet gap is filled by a candidate (the AI still cannot gate on it). Session-only (`localStorage` `brain.candidates.v4`), always labelled candidate, never citable.

## Ask

A question activates concept nodes first, by alias (the same words the intent map holds), then the retriever runs (names → gates R7 → BM25 → R5 order → R6 attribution) and the edges it selects light up with their sources; L0 claims are withheld (R2), candidates are recalled but never cited. The banner stays: RETRIEVAL PREVIEW — NOT A FULL AI TRACE.

## v3 → v4

- **Object**: v3 drew the database system (schema × plants matrix, rules, sources, construction). v4 draws the knowledge: concepts and the plants they connect. The system view stays available at `/brain/v3/`.
- **Data**: a new ontology (`ontology.json`, M26) and schema 0.4.0 (`tools/migrate_0_4.py`, M27): categorical values are concept ids, ranges span classes, context becomes `conditions`, every claim has `place`, `time`, `cultivar`. The migration is a script with a report (0 unmapped); the validator checks ids; retrieval gates are unchanged (eval 8/8 identical to 10-29).
- **Diagnosis** (M28) replaces v2's `values differ`: variation vs disagreement are separate, defined rules; hubs, gaps and single voice are new.
- **Interaction**: entry by dimension instead of by plant; intersection; variation along a condition axis; group inheritance.
- **Kept**: candidate form and session storage, retrieval port, panel markup, dark aesthetic, projected HTML labels.

## Not done / limits

- The brief expected Evergreen ∩ Hedge → only *Vaccinium*; the data gives two plants (USDA lists salal as a sheared hedge). Shown as the data says.
- `use:hedge`, the exposure groups and `origin:native` are groups added for this ontology (source noted on each node); everything else is KPU verbatim or a schema enum.
- The ontology has 306 nodes, above the brief's 150–250, because the full KPU use and pest lists are kept.
- Disagreement on `water` flags adjacent ordinal values (average vs moist); the rule is documented and may be too strict.
- Label collisions are handled by a greedy nudge, not a layout algorithm; the centre of the home view is dense where many hubs link all three plants.
- Place and time are edge attributes, so they do not take part in the Python hub/variation rules; the brain treats them as inherited links for exploration.
- Candidate concepts come from an alias match and a keyword table; unusual sentences land as a bare note.
