# brain/ — Neural Brain v5

> **2026-11-02:** the ontology preview — the XYZ ontology and the semantic graph (`data/kg.json`) as one neural network, with evidence trace, the four exploration paths, gaps & conflicts and growth — lives in [`ontology-preview/`](./ontology-preview/) (live: <https://kaiyankay.github.io/planting-db/brain/ontology-preview/>). v5 below is unchanged.

**Live:** <https://kaiyankay.github.io/planting-db/brain/> · archived for comparison: `/brain/v4/` (regions and bundled claim ribbons, 2D), `/brain/v3/` (the database as a system), `/brain/v2/` (plant clusters and evidence lenses), `/brain/v1/`.

v5 shows the **same store** (brain/data/graph.json + diagnosis.json from `tools/build_graph.py`, `ontology.json`, the plant files, the retrieval port and rules R1–R10) as **one living network** instead of a chart. Nothing in the database, the survey logic, the retrieval rules or the evidence trail changed; only the way it is seen and touched.

## Run

```bash
cd planting-db && python3 -m http.server 8766          # serve the planting-db root
```

then <http://localhost:8766/brain/>. Files: `index.html` · `js/app5.js` (scene, activation, growth, cards) · `js/graph.js` · `js/diagnosis.js` · `js/retrieve.js` · `js/data.js` · `js/model.js` · `screenshots/v5/`.

## What is drawn (M30)

| element | drawn from | how |
|---|---|---|
| neuron | every concept of `ontology.json` (312) | a soft additive glow; in-use concepts bright and sized by the plants they link (hubs larger); dormant vocabulary small and dim, placed further out in its cluster |
| plant | `plants/*.json entity` | the largest somas, near the centre, with a white core |
| growth form | `growth_form` facet | gold somas at the centre (Classification); empty classes small and dim |
| source | `sources.json` + survey respondents | square-ringed glow in the Evidence cluster |
| fibre | plant → concept claim links | a curved branch: all claims from one plant into one cluster share a stem toward that cluster, then twig out to each concept (the same bundling v4 used, now in 3D); growth-form, parent, cultivar and source → plant links are thinner fibres |
| synapse | one per claim (590) | a bouton riding its fibre: **white = verified**, **cluster colour = unverified sourced**, **magenta = candidate** |
| cluster | Classification (centre) · Conditions · Traits · Uses · Evidence & place · Time · Status · Resistance | each has an anchor on a sphere; every node has a home near its anchor and the force layout only relaxes it; a faint particle field (neuropil) sits around every cluster and along the paths |

The scene is 3D with orbit, slow auto-rotation until you touch it, fog for depth and bloom for the glow. Labels are kept to plants, growth forms in use and cluster names; concept and source labels appear only while they are lit.

## Activation

A click or a question does not filter the graph; it **sends a signal**. The seed neurons light first; the signal then travels hop by hop along real links (one hop per ≈ 0.5 s, with a small jitter per fibre), lighting each fibre as a bright window moving from one end to the other and each synapse as the window passes. Everything else dims to a tenth. The rules per seed:

- **concept** → its children, for a group such as Shade → the plants its claims reach → their growth form and the sources of those claims;
- **plant** → every concept, source, cultivar and growth form it links → the parents of those concepts;
- **growth form** → its plants → only the concepts all of them share, and their sources;
- **source** → its plants → only the concepts that source claims;
- **cluster** (bottom-left chips or the floating cluster name) → every in-use neuron of the cluster → the plants;
- **question** (top-right): wave 1 the concepts named by alias; wave 2 the plants that pass the gates (R7); wave 3 the evidence the retriever ranks (R5), fibre by fibre; wave 4 its sources. L0 claims are withheld (R2) and candidates are recalled but never cited.

The state line under the title counts what is lit; Esc or the background clears it and the rotation resumes.

## Growth

“+ Observation” opens the only form. The sentence is parsed into plant, field, concepts, conditions, place and time (the same parser as v4); the candidate claim becomes **new fibres that grow out of the plant** over about a second, their magenta synapses appear as the fibre reaches them, and the plant then fires along them so the new path is seen. The card says *what grew*: which synapses, whether a hub appeared, whether a variation gained a Vancouver data point, whether a disagreement gained a voice, and the status line (candidate, completeness, never citable, this browser only — `localStorage` key `brain.candidates.v5`). Candidate, unverified and verified are told apart by colour on every synapse and fibre.

## Interaction

By default the network is the whole screen: a title line, the Ask input, the “+ Observation” button, the cluster chips and a one-line legend. Nothing else until you click. A click opens one compact card (bottom-right) with a sentence first and the evidence behind a fold: for a concept the definition, the plants it reaches with *direct vs inherited*, *verified* and *from the Vancouver scale* counts, then the claims with their sources and stated conditions; for a plant its growth form and status, its diagnosis sentence, the variations and disagreements, and its concepts by cluster; for a fibre the claims that make it; for a source its plants and concepts. Chips and rows in the card are clickable and send the next signal.

## v4 → v5

- Kept: data files, the ontology and the classification layer (M29), `graph.js`, `diagnosis.js`, `retrieve.js`, the candidate parser and the “what changed” sentences, the four acceptance walks of the salal scene (they run as signals now).
- New: 3D scene, cluster anchors with a home force, branch-shaped fibres, synapses per claim, neuropil, signal propagation, growth animation, the card-only interface.
- Gone from the default view: the rail, the persistent panel, the diagnosis counts (still in each plant's card), the 2D regions.

## Limits

- Bloom and additive glow make a lit plant very bright; readability is tuned at 1280 × 820 and may need the camera pulled back on small screens.
- Labels during a wide activation (a plant lights 60 concepts) are capped: only hubs and the seed keep names when more than 28 neurons are lit.
- The signal walks the links the store has; where a claim has no concept (a bare candidate note) nothing lights, by design.
- No label-layout algorithm beyond a vertical nudge.
