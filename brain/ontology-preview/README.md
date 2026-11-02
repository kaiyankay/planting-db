# brain/ontology-preview — Neural Knowledge Brain (XYZ ontology)

**Live:** <https://kaiyankay.github.io/planting-db/brain/ontology-preview/> · v5 stays at <https://kaiyankay.github.io/planting-db/brain/> unchanged.

Briefs 2026-11-02 ("Knowledge Graph Reconstruction", then "Visual Simplification & Redesign"). The claim store drawn as a **minimal 3D neural network**: spheres, thin lines, a label on every visible node, and **progressive disclosure** — the network opens one level at a time from the three knowledge axes. The structure is the ontology (`ontology.json` 0.2.0, XYZ), the lines are the semantic graph (`brain/data/kg.json`, built by `tools/build_kg.py`), every path and answer is a traversal run by `js/kg.js` (the browser port of `tools/kg_query.py`). Nothing is hard-coded; unexplored knowledge is hidden, not removed.

## Run

```bash
cd planting-db && python3 -m http.server 8766          # serve the planting-db root (launch.json entry "brain")
```

then <http://localhost:8766/brain/ontology-preview/>. Rebuild the data after any change to plants, ontology or relations:

```bash
python3 -I tools/build_ontology.py && python3 -I tools/build_graph.py && python3 -I tools/build_kg.py && python3 -I tools/validate.py
```

Files: `index.html` · `js/app6.js` (registry, layout, spheres and lines, disclosure, activation, cards, paths, ask, growth) · `js/kg.js` (loader + graph engine) · shared `../js/graph.js`, `../js/diagnosis.js`, `../js/model.js` · screenshots in `../screenshots/ontology-preview/` (`v6.0/` holds the first, denser drawing).

## What you see (methods M33a)

| level | shown | how to open the next |
|---|---|---|
| 0 · overview | the three axes **X · Identity & Classification**, **Y · Traits & Performance**, **Z · Planting Design Knowledge** with their categories in use, the three plants at the centre, the Evidence region below — 18 spheres | click a category |
| 1 · category | its facets in use (e.g. Environmental Conditions → Light, Soil, Water, Hardiness …) | click a facet |
| 2 · facet | its concepts in use, with group children (Shade → Filtered shade, Deep shade); dormant vocabulary stays hidden (listed in the card) | click a concept |
| 3 · concept | the plants its claims reach (one line per plant, white when a claim is verified), and every **cross-dimensional relation** it takes part in: a Y trait opens the Z concepts that require it; a Z concept opens its required traits (Y), the KPU uses that name it, the plants derived / candidate for it; a growth form opens the layers it forms. Revealed nodes bring their facet and category with them, so the hierarchy stays readable | click a line |
| line | the **evidence trace**: relation type, status (documented · derived · candidate · unknown), the claims that make it with attribution, verification, stated conditions and place, the rule or literature source; for a design link the full requirement check. The sources behind the claims appear in the Evidence region | |
| plant | genus, growth form, cultivars, vertical layers and design links; its trait concepts are chips in the card, one click each | |

Colours: X gold · Y blue · Z green · plants cream · evidence orange. Lines: hierarchy grey · claims in the region colour (white when verified) · derived lavender · candidate amber · observation magenta. Status words are on every card.

## Interaction

- **Click a sphere** to open it; click it again to close what it opened. The signal runs once from the sphere along the lines just revealed, then rests.
- **← Back / Esc** restores the previous state; **Overview** returns to level 0; clicking the background only deselects. The breadcrumb under the title names where you are.
- **Paths A–D** (bottom-left) reveal a traversal wave by wave: A `growth_form:shrub` → plants → attributes → evidence; B `spatial:screen` → required traits → plants → conditions; C salal → height claims → conditions → sources; D `spatial:scrim` → required knowledge → evidence → missing. Cards offer "run as path B / D" and "how the claims vary (path C)" for other seeds.
- **Ask** (top-right): graph retrieval — recognise plants and concepts by alias, traverse, claims in R5 order with R6 attribution, L0 withheld; the nodes it reaches are revealed and lit; the context block an LLM would receive is behind a fold.
- **+ Observation**: a sentence becomes a candidate claim (plant, field chosen in the form, concepts, conditions, place); a magenta line grows from the plant; the requirement check re-runs with it and says "met by your candidate only" — the link **stays candidate**. Session only, `localStorage` key `brain.candidates.v6`; nothing is written to the database.

## Why a line exists (and why some do not)

- A plant is linked to a trait, condition or use only by a claim. Group concepts inherit their children's claims and say so.
- A plant is linked to a design concept only by rule KG-R1 (a sourced KPU use that names the concept) or KG-R4 (every required trait met by a claim). Shrubs are not linked to Screen for being shrubs; shared habitat does not make companions (`relations.json` holds the plant–plant relations; its model placeholders are drawn, as candidates, only while a plant is open).
- Height bands and layers come from the plant's own height claims (KG-R2) and growth form (KG-R5); the claim's conditions travel with the line.
- The literature relations name their book and chapter; page-level wording is **to confirm** (22 relations). *Scrim* is from the brief and flagged.

## Limits

- Three plants: Z is sparse by construction; Scrim, Drift and Scatter are reached by no plant and say so.
- *Vaccinium ovatum* ↔ Screen reads "contradicted" because its one habit claim says *Upright* while GPP's use text says it "shears into a dense formal hedge" — a gap the brain shows rather than hides.
- Labels nudge apart vertically only; a facet with many concepts (Landscape Use, 17) is dense at close range.
- No force simulation: positions are rings around the parent, so a deep exploration can place a Y concept and a Z concept far apart with a long line between them — the line is the relation.
