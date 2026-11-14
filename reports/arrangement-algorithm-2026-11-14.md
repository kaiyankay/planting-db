# Knowledge-based planting arrangement — rules and their sources (round 2, M56)

Branch `design/round2-arrangement`, on top of the round-1 integration. No page structure, workflow, plant or knowledge-graph change. Code: `design/js/knowledge.js` (what the data says about a plant), `design/js/engine.js` (selection, arrangement, evaluation). Everything below runs in the existing Compose → Grow path and on Demo A.

Three kinds of source are used and named on every parameter (`engine.js ARRANGEMENT_RULES`, also returned as `version.evaluation.rules`):

- **claim** — read from the ten-plant database; the claim id travels with the result.
- **geometry** — follows from the shapes; no judgement in it.
- **heuristic** — chosen by the implementer. The database holds **no spacing claim at all**, so every spacing factor is a heuristic and is labelled as one.

## 1 · Plant selection

Every species gets a class per function — **meets · uncertain · fails** — from separate checks; the class is the worst check (`fails` if any check fails, `meets` only if all meet). `fails` is never planted. `uncertain` may be planted and is carried into the evaluation as uncertain. A second species joins a screen row only when it is in the same class as the first.

### Screen

| check | rule | source |
|---|---|---|
| evidence | function link drawn, `derived` / `documented`, no conflict → meets · link is a `candidate` (inferred from traits) or a trait claim contradicts the use → **uncertain** · no link → fails | knowledge graph link (`function_links`: status, conflict, verification) |
| form | a tree → fails (the row operators arrange shrubs and perennials; there is no tree-placement rule) | limitation of the existing operators |
| site | light / water / soil gates: fail → fails · pass → meets · conditional / unknown → uncertain | claims (round 1 gates) |
| target height | every claimed height range of the species is read (species-level ranges; cultivar ranges only when there are no others). No range reaches the target → fails · the range used for the plan starts at or above it and no range stays below → meets · otherwise → uncertain · no height recorded → uncertain (missing data) | claims (`mature_height` ranges, claim ids listed) |
| year-round (only when required) | recorded Evergreen only → meets · Deciduous only → fails · both, or nothing → uncertain | claims (leaf retention) |
| geometry | the bed depth behind the screened edge must hold a row: depth ≥ crown radius × (1.0 + 0.5) | crown radius from a claim; 0.5 edge tolerance is a heuristic |

**Requirement.** Target height and year-round live on the Screen function. A height that was not stated falls back to **1.8 m, a labelled heuristic** ("standing eye level"); a year-round requirement that was not stated is **not assumed** — winter cover is reported, not required. Both can be said in words ("screen 2 m high, all year"); the Compose page shows what is in force and where it came from.

**Verified vs. recorded.** Each check carries `verified` from the claims behind it. A candidate whose link has a conflict, is only a candidate, or rests on unverified claims is never reported as verified; the evaluation always carries `verified_performance: false` and says how many species rest on unverified claims. Of the 501 live claims 38 are verified, so today every result is "on recorded claims".

### Ground Cover

Evidence (as above, for the Ground Cover link), site gates, and fit (claimed spread against the bed). No height criterion is applied — none is recorded as a requirement.

## 2 · Arrangement

Operators are the existing ones: `along_edge`, `stagger`, `fill_drift` (and `repeat_accent`, unchanged).

### Screen row (`rowPlan`, per screened edge)

| quantity | rule | source |
|---|---|---|
| crown radius | 0.5 × claimed mature spread (one claimed range per species) | claim |
| stems from the edge | 1.0 × own crown radius (the mature crown touches the edge) | geometry |
| single row feasible | bed depth ≥ largest crown radius × 1.5 | heuristic (0.5 tolerance) |
| second, staggered row feasible | bed depth ≥ largest crown radius + inner crown radius × (1.6 + 0.9) | heuristic |
| spacing | 0.75 × claimed mature spread (mean of the two spreads when two species alternate) ÷ density | **heuristic** |
| count | ⌊(edge − 2 × 0.9 × lead radius) ÷ spacing⌋ + 1, spread evenly; an odd number when two species alternate, so both ends are the lead species | geometry on the heuristic spacing |
| second row | midway between first-row plants, one fewer | geometry |
| every position | still checked against holes, no-plant zones, existing trunks (0.6 × canopy radius) and neighbours (0.6 × sum of radii) | heuristics |

The plan (depth, spacing, expected and placed counts, the reason for one row / two rows / none) is stored on the zone and the group. A position dropped by an obstacle is reported as a shortfall.

Fixed while doing this: a row alternating two species was spaced by the first species only, so the larger species pushed its neighbours out (9 planted where 17 were computed); each plant now stands its own radius inside the edge and the spacing uses both crowns.

### Ground layer (`fill_drift`)

| quantity | rule | source |
|---|---|---|
| plantable area | bed (holes out) − no-plant zones − 0.6 × canopy radius around existing trunks, on a 0.1 m grid | geometry + heuristic keep-out |
| area for the ground layer | plantable area − mature crowns of the screen rows | geometry |
| spacing | 0.65 × mean claimed mature spread of the ground species ÷ density | **heuristic** |
| lattice estimate | area ÷ one hexagonal cell (spacing² × √3 ⁄ 2) | geometry |
| positions | hexagonal lattice with 0.35 × spacing seeded jitter; species by a noise field | heuristic |

The placed count is below the lattice estimate because stems keep their distance from the bed edge and from each other after the jitter; both numbers are reported.

## 3 · Evaluation

### Screen (`evaluateScreen`, per edge)

Each screen plant's mature crown is projected on the screened edge as an interval; the **union** of the intervals is the covered length (an overlap counts once), and what is left are the gaps, each with its position and length (stretches under 5 cm are not reported — heuristic). The same union is taken three more times: for plants whose claimed height range **certainly** reaches the target (range starts at or above it), **possibly** reaches it (range ends at or above it), and for species recorded as evergreen only.

| check | met | uncertain | not met |
|---|---|---|---|
| continuity | no gap | — | any gap, or no plant |
| target height | certain cover = covered length | possible cover = covered length | part of the row cannot reach it |
| year-round (if required) | evergreen cover = covered length | — | otherwise |
| evidence | all links supported | a conflict or a candidate link | — |

Status: `not met` if any check is not met; else `uncertain` if any is uncertain; else `met on claimed sizes`. Never "verified".

### Ground Cover (`evaluateGround`, per bed)

Share of the plantable area lying under a mature ground-layer crown, each sample point counted once. Labelled a geometric estimate at claimed mature spread — not the cover a planting reaches, not weed suppression.

### Findings

`evaluation.findings` lists every missing-data, conflict, uncertain and unmet item with its reason and place, including "no species could be used" with the failing check of each linked species.

## 4 · What the tests show (2026-11-14)

`tools/design_tests.py` 159/159 (V1–V24 engine, G1–G8 on Demo A in the page), `spatial_tests.py` 141/141, `ux_tests.py` 41/41, `validate.py` 0 errors, survey importer 8/8.

| asked | result |
|---|---|
| change the target height | candidates still usable: 1.0 m and 1.8 m → *Cornus sericea*, *Gaultheria shallon*, *Vaccinium ovatum*; 3.5 m → *Cornus sericea* only; 7 m → none. Each loss cites the height claims (V3, V4, G3). |
| require year-round | *Cornus sericea* (deciduous) drops out; the two evergreen shrubs stay (V5, V17, G4). |
| change the bed depth | 0.5 m → nothing fits, edge left empty with the depth each species needs; 0.8 m → one row of *Gaultheria* only (17 plants on 10 m); 1.0 m → one mixed row (13); 3.0 m → two rows (13 + 12) (V7, V8). Demo A north bed 0.9 → 2.6 m: 1 → 2 rows, 7 → 9 plants (G5). |
| change size data | doubling the claimed spread of the lead species: radius 0.38 → 0.75 m, spacing 0.76 → 1.03 m, row 12 → 9, same claim id on the plants with the new range (V19). Capping all heights at 1.2 m: no species for a 1.8 m screen, each rejection cites its claim (V20). Removing a height record: uncertain, never meets (V21). |
| nothing suitable | empty edge, no forced planting, reasons listed (V7, V20, V22, G6). |
| no double counting | 10 m edge: union 10 m while the diameters sum to 28 m; counting every plant twice changes nothing; removing plants opens a located gap (V14, V15). |

On Demo A itself the evaluation reports a real gap: the existing tree's keep-out drops positions from the north row, leaving 1.6 m of the 6 m edge uncovered — status `not met`, with the gap's position.

## 5 · Limits

- Every spacing factor, tolerance and the 1.8 m default are heuristics; none has a professional source yet.
- Opacity, porosity, growth rate and time to reach the target height are not modelled; "covered" means a mature crown projects there.
- A target height is checked against claimed mature ranges, not against a plant's height at planting or in a given year.
- Trees are not arranged; Scrim, Canopy and Barrier remain recorded only (round 1).
- Low-maintenance preference and goal priority levels still do not affect selection.
