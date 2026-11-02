# brain/ontology-preview — Neural Knowledge Brain (XYZ ontology preview)

**Live:** <https://kaiyankay.github.io/planting-db/brain/ontology-preview/> · v5 stays at <https://kaiyankay.github.io/planting-db/brain/> unchanged.

Brief 2026-11-02 ("Knowledge Graph Reconstruction"). The same claim store, drawn as one 3D neural network whose **structure is the ontology** (`ontology.json` 0.2.0, XYZ architecture) and whose **fibres are the semantic graph** (`brain/data/kg.json`, built by `tools/build_kg.py` from the claims, the entity records, `relations.json` and the literature relations in the ontology). Nothing is hard-coded: every neuron is a node of kg.json, every fibre an edge of kg.json, every path a traversal run by `js/kg.js` (the browser port of `tools/kg_query.py`).

## Run

```bash
cd planting-db && python3 -m http.server 8766          # serve the planting-db root (launch.json entry "brain")
```

then <http://localhost:8766/brain/ontology-preview/>. Rebuild the data after any change to plants, ontology or relations:

```bash
python3 -I tools/build_ontology.py && python3 -I tools/build_graph.py && python3 -I tools/build_kg.py && python3 -I tools/validate.py
```

Files: `index.html` · `js/app6.js` (scene, activation, cards, paths, gaps, growth; on the v5 engine `../js/app5.js`) · `js/kg.js` (loader + graph engine) · shared `../js/graph.js`, `../js/diagnosis.js`, `../js/model.js` · `screenshots/` in `../screenshots/ontology-preview/`.

## What is drawn (methods M33)

| element | drawn from | how |
|---|---|---|
| region | `axis:x` · `axis:y` · `axis:z` + the Evidence region | three lobes on a triangle (X above, Y left, Z right), plants at the centre, sources and places beneath; a faint particle field (neuropil) around each |
| category · facet | ontology nodes `cat:*`, `cross:*`, `facet:*` | categories ring their axis, facets ring their category; always labelled (facets when close or lit) |
| concept neuron | every ontology concept (340) | home point beside its facet (or its group concept); in use = bright, sized by the plants it reaches; dormant = small, dim, further out; design (Z) concepts carry a white core |
| plant · cultivar | `plants/*.json` | the largest somas at the centre; cultivars beside their plant |
| source | `sources.json` + respondents + the four design books | square-ringed glows in the Evidence region, coloured by source type |
| fibre `pc` | claim edges plant → concept, bundled per plant × concept, with a stem toward the concept's category | one **synapse per claim**: white verified · region colour unverified · magenta candidate |
| fibre `hier` | `part_of` / `narrower_than` | the skeleton: concept → facet → category → axis; dormant branches nearly invisible |
| fibre `tax` · `gf` | `in_genus` / `in_family` (entity record) · `is_growth_form` (M29) | gold, in X |
| fibre `band` · `layer` | `in_height_band` (KG-R2) · `occupies_layer` (KG-R5) | lavender = derived by a named rule |
| fibre `design` | `suited_for` (KG-R1 derived · KG-R4 candidate) | lavender when derived from a documented use, amber when inferred from traits; **unknown links are not drawn** except in Gaps mode (red) |
| fibre `cc` | `requires_trait` · `maps_to` · `typically_formed_by` · `corresponds_to` | the cross-dimensional relations Z → Y, use → Z, layer → X |
| fibre `sp` · `rel` | source → plant · plant → plant (`relations.json`) | faint; model-placeholder relations amber (candidate) |

Status is shown on every fibre and in every card: **documented** (a source or claim states it) · **derived** (a named rule from documented statements) · **candidate** (inferred or observed, never promoted) · **unknown** (required, no evidence). Verification (verified / unverified) is carried separately from the claim.

## Interaction

- **Regions (left rail)** · a click lights the hierarchy beneath the axis and, one hop further, the plants it reaches. Categories and facets drill in the same way; the camera moves to the node.
- **Concept** · lights its children, the plants whose claims reach it, their growth form, sources, and the design concepts those plants are linked to — so a condition in Y leads into Z. A design concept lights its required traits (Y), the KPU uses that name it, the plants linked to it and their evidence.
- **Plant** · everything it links: taxonomy, growth form, traits, uses, height bands, layers, design links, sources.
- **Fibre (evidence trace)** · the card shows relation type, status, the claims that make it (attribution R6, verification, stated conditions, place, source link), the rule or literature source, and for a design link the full requirement check: each required trait met / unmet / unknown with the evidence behind it.
- **Paths A–D (bottom-left)** · the four prototype explorations, each a traversal of the engine lit wave by wave (01 … 04 in the card): A `growth_form:shrub` → plants → attributes by category → evidence; B `spatial:screen` → required traits + KPU uses → plants (derived / candidate / unknown) → evidence & conditions; C salal → height claims → growing conditions → sources & places, with the variation / disagreement sentences; D `spatial:scrim` → required knowledge → existing evidence → missing relationships. Cards offer "run as path B / D" and "how the claims vary (path C)" for other seeds; `window.brain.runPath('B', 'spatial:barrier')` runs any.
- **Ask (top-right)** · graph retrieval, not keyword search: recognise plants and concepts by alias → traverse (design concept → requirements → plants; trait concept → plants with claims; place → claims recorded there) → claims in R5 order with R6 attribution, L0 withheld (R2) → the context block an LLM would receive (behind a fold). Unknown links are listed as unknown.
- **Gaps & conflicts** · lights the unknown and contradicted design links (red), the design concepts no plant reaches, gate facets without a claim, disagreements and condition-dependent variations; the card lists them with their reasons.
- **+ Observation** · a sentence becomes a candidate claim (plant, field chosen in the form, concepts, conditions, place); magenta fibres grow out of the plant; the diagnosis and the **requirement check re-run with it** — a design link whose check changes says so in the card ("met by your candidate only") and **stays candidate**. Session only, `localStorage` key `brain.candidates.v6`; nothing is written to the database.

## Why a link exists (and why some do not)

- A plant is linked to a trait, condition or use **only** by a claim (one synapse each). Group concepts (Shade) inherit their children's claims and say so ("via").
- A plant is linked to a design concept **only** by rule KG-R1 (a sourced KPU use that names the concept, e.g. GPP's *Screening* → Screen) or by rule KG-R4 (every required trait of the concept met by a claim). Shrubs are not linked to Screen for being shrubs; two plants sharing a habitat are not linked as companions (the relations layer is `relations.json`, and its model placeholders are drawn as candidates).
- Height bands and layers come from the plant's own height claims (KG-R2) and its growth form (KG-R5), with the claim's conditions carried along: salal reaches the shrub layer only under the OSU "shade, good soil" claim.
- The literature relations (`requires_trait` etc.) name their book and chapter; chapter titles were checked against the published tables of contents on 2026-11-02, page-level wording is marked **to confirm** (22 relations) until Kay checks the chapters. *Scrim* is a term from the brief not found under that name in Robinson and is flagged on the node.

## Limits

- Three plants: Z is sparse by construction; three design concepts (Scrim, Drift, Scatter) have no plant reaching them by any source or rule, and say so; Understory and Shrub layer are reached only by rule KG-R5.
- The requirement check is only as good as the claims: *Vaccinium ovatum* is "contradicted" for Screen because its one habit claim says *Upright*, while GPP's use text says it "shears into a dense formal hedge" — the text is in a use claim, not a habit claim. That is a knowledge gap the brain shows rather than hides.
- Labels: concept labels appear only when lit (capped at ~34 unless hubs or design concepts); facet labels when the camera is close; no label-layout beyond a vertical nudge.
- Bloom and additive glow are tuned for ~1280 × 820; pull the camera back on small screens.
