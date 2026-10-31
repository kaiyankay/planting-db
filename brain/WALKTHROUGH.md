# Walkthrough — Knowledge Brain v4 as a graph walk

Open <https://kaiyankay.github.io/planting-db/brain/> (or serve the planting-db root and open `/brain/`). Everything below was run in the built-in browser on 2026-10-31 at 1280 × 820; screenshots are in `screenshots/v4/`.

**0:00 — the diagnosis** (`01-diagnosis-opening-view.jpg`). The panel says what the knowledge base says today: three sentences, one per plant — *Gaultheria shallon is linked to 53 concepts across 19 facets from 35 claims; sources disagree on exposure, water; height class depends on conditions; missing gate facets: maintenance.* Below: 44 hub concepts (3–5 m, Part sun/part shade, Full sun, Well-drained, USDA zones 7 and 8 all link three plants), then the counts: 1 depends on conditions, 14 sources disagree, 5 gaps, 93 single voice. Behind it the constellation: three warm plants, concepts between them coloured by dimension, the faint outer ring of vocabulary nothing links yet.

## 1 · Start from Conditions → Shade (`02-conditions-dimension.jpg`, `03-shade-links-three-plants.jpg`)

Rail → **Conditions**. Seven facets; the exposure chips show how many plants each links. Click **Shade**. Definition: *Sites with little or no direct sun…*; aliases *north-facing, shade-tolerant, 荫蔽*. **Plants linked · 3**: *Acer palmatum* via Filtered shade (Great Plant Picks, 'Osakazuki'), *Gaultheria shallon* via Deep and Filtered shade (RHS, E-Flora), *Vaccinium ovatum* via Filtered shade (survey respondent 03, verified, Metro Vancouver; Oregon State). In the graph only Shade, its two children and the three plants stay lit. Three plants attached to one condition, one a tree and two understorey shrubs: they could form one layered planting — the hub sentence says so, and the relations list says the only verified relation between them is a co-listing.

## 2 · Step to salal → height (`05-plant-salal-where-evidence-pulls-apart.jpg`, `06-variation-salal-height-by-condition.jpg`, `07-place-dimension.jpg`, `08-place-metro-vancouver-measured-claims.jpg`)

Click *Gaultheria shallon*. “Where the evidence pulls apart” lists **height class depends on conditions** and three disagreements (exposure ×2, water). Open the variation. The values lie along the condition axis: *full sun, rocky or gravelly or dry* → Oregon State ≤ 0.6 m; *shade, humus rich* → Oregon State 1.2–3 m; then, with no condition stated, E-Flora to 1.5 m, RHS 1–1.5 m, USDA 1.8 m. Two numbers from one source are now two conditions, not a contradiction. Each row carries its place: Willamette Valley, British Columbia, United Kingdom, North America — none from Vancouver. Rail → **Place** shows the places as nodes between the plants; **Metro Vancouver** lists what was measured or observed here: City of Vancouver inventory counts and sizes (verified), survey notes (verified), iNaturalist aggregates — for salal, no height.

## 3 · Add the observation (`10-grow-candidate-what-changed.jpg`)

Rail → **Grow**: *salal in my North Van garden stays under 60 cm in full sun*, basis observed on site, location North Vancouver. The parser shows plant, field, concepts (< 0.1 m … 0.4–0.7 m), condition Full sun, place North Vancouver. “Add as candidate”. **What changed**: *Gaultheria shallon gains 4 candidate edges to < 0.1m … 0.4 – 0.7m under full sun at North Vancouver. The existing variation on height class gains a Vancouver data point — the first one at the scale the database serves. Status: candidate, completeness L2, never citable, this browser only.* Open the variation again: your reading sits first on the axis, dashed magenta, beside Oregon State's full-sun value.

## 4 · Ask (`11-ask-concepts-then-edges.jpg`)

Rail → **Ask** → *evergreen shade-tolerant perennial for a north-facing roof garden*. Step 1 lights the concepts the words name — Deep shade (north-facing), Evergreen, the perennial plant types, Green roof technology — before any plant. Step 2: all three plants pass the gates. Step 3: 41 plant → concept edges from 31 ranked claims light up with their four sources; the candidate is recalled, flagged, never cited. The drawer has the ranked list with the rank key under each line.

## Also worth a look

- `04-intersection-evergreen-hedge.jpg` — Evergreen ∩ Hedge or screen: two plants satisfy both, *Acer* falls away on evergreen. The brief expected one; the data has USDA listing salal as a sheared hedge.
- `09-disagreement-acer-osakazuki-height.jpg` — Great Plant Picks 6.1 m faced against RHS 2.5–4 m for the same cultivar, with the City of Vancouver measurements for 'Osakazuki' (median 4.6 m) listed under them.

## What you cannot see yet

- A verified relation between the three plants beyond one co-listing; shared conditions are shown as hubs, never as companionship.
- Vancouver-scale evidence on salal height except your candidate.
- T4 survey verbatim queries (buttons are proxy text); any plant beyond the three.
