# Spatial proposal tests — 2026-11-14

`tools/spatial_tests.py` against http://127.0.0.1:8768 (headless Chrome, SwiftShader WebGL). **156/156 pass.**

| test | result | detail |
|---|---|---|
| T·A1 ten species from the projection, stable ids | pass | acer-palmatum,achillea-millefolium,arctostaphylos-uva-ursi,cercidiphyllum-japonicum,cornus-nuttallii,cornus-sericea,gaillardia-aristata,gaultheria-shallon,polystichum-munitum,vaccinium-ovatum |
| T·A2 size proxy names its claim and range; height follows the stated light condition | pass | r 0.38 (gaultheria-shallon:mature_spread:rhs01) · h 1.25 (gaultheria-shallon:mature_height:rhs01, Shade/Humus rich) |
| T·A3 gate: stated light → pass with claims; unknown water/soil → unknown, never pass | pass | {"light":"pass","water":"unknown","overall":"unknown"} |
| T·A4 gate fail when the plant records no matching light | pass | site shade (user-stated) — plant records Filtered shade, Part sun/part shade |
| T·A5 function support keeps status, conflict and verification apart | pass | {"status":"derived","drawn":true,"conflict":true,"verification":"unverified","verdict":"contradicted by traits","use_lab |
| T·B1 empty project: no geometry, scale unknown, blockers listed | pass | no site geometry yet — draw a boundary or state the dimensions / scale unknown — measured spacing and quantities are blocked until a length is stated or calibrated / no planting bed yet — draw one or accept a suggestion |
| T·B2 site model: boundary, calibrated scale, two locked features, one accepted bed | pass | {"site_boundary":true,"scale":true,"beds":1,"accepted_beds":1,"unknown_conditions":["soil_type","soil_drainage","water","wind","irrigation"],"measured_placement":true,"blockers":[]} |
| T·C1 description → values, functions, hard constraints, unknowns; no dimensions invented | pass | privacy,maintenance_low,ecology,openness · z:screen@edge-unset,z:scrim@edge-unset,z:ground_cover@bed-interior · unknown: which edge to screen — "middle" names no compass side; choose the edge (north / south / east / west); site dimensions / scale; light; soil type and drainage; ecological performance — the database records some ecological-value claims (pollinator, bird food …) but no pollinator-interaction data; no score is possible |
| T·C2 dimensions, light and soil read as stated facts | pass | dimensions:6,condition:shade,condition:clay |
| T·C3 text-only "right side" → direction scope with a polygon; reduce_density + preserve screen | pass | "right side" read relative to the plan as drawn (north up); the region is the outer third of the bed on that side · amount 0.25 |
| T·C4 "here" with a drawn selection → selection scope | pass | "here" → the drawn selection |
| T·C5 contradictory request is refused, not silently applied | pass | filling the open zone with tall plants contradicts the open-space constraint; no change is made without an explicit override |
| T·C6 "move the taller plants away from the tree" → move_away with a resolved feature | pass | {"type":"move_away","filter":"taller","feature_id":"tree-6acv1","phrase":"tree","resolved":true} |
| T·C7 overclaim classified | pass |  |
| T·D1 every plant object has a stable id, a species from the database, a position inside the accepted bed | pass | 31 plants |
| T·D2 no plant inside the no-plant zone, none under the locked tree | pass |  |
| T·D3 unique ids; schedule counts equal plant objects by species | pass | arctostaphylos-uva-ursi×19 vaccinium-ovatum×5 achillea-millefolium×4 gaultheria-shallon×2 polystichum-munitum×1 |
| T·D4 the screen zone exists on the north edge and its row is made of species linked to Screen | pass | 4 screen plants |
| T·D5 operators are real and named on groups; proxies carry claim ids | pass | along_edge:4 stagger:3 fill_drift:24 repeat_accent:4 |
| T·D6 no tree placed in a 6 × 4 bed (claimed spreads exceed it) and the reason is recorded | pass | acer-palmatum,cercidiphyllum-japonicum,cornus-nuttallii |
| T·D7 validation: no geometry errors | pass |  |
| T·D8 evaluation has no invented cost or ecology score | pass |  |
| T·D9 deterministic: same seed → same ids, species and positions | pass | 31 vs 31 |
| T·D10 a different seed changes positions (jitter) but not the rule-driven assemblage | pass | 27 plants vs 31 |
| T·D11 density is a real parameter: 0.7 → fewer plants, same operators | pass | 21 < 31 |
| T·E1 scoped edit removes only plants inside the resolved region | pass | removed 2 of 10 targets |
| T·E2 nothing outside the scope moved or changed | pass | outside changed: 0 |
| T·E3 screen-row plants inside the scope kept (preserve privacy as an intent); privacy not guaranteed | pass | 2 screen-row plants kept untouched to preserve the screen (an intent; screening performance is not quantified) |
| T·E4 preview is not committed; apply makes a new version with the parent link; schedule reconciles | pass |  |
| T·E5 undo restores the previous version byte-equal; redo returns | pass |  |
| T·E6 move_away: only plants with a known height ≥ 1 m move; unknown heights are never invented | pass | 0 moved · move taller plants away from old tree: 0 moved, 4 could not be moved within the bed |
| T·E7 a refused request leaves the design identical | pass |  |
| T·E8 direct move: one object changed, same ids, schedule unchanged | pass |  |
| T·E9 direct delete: one fewer object, schedule recomputed from objects | pass |  |
| T·E10 species swap resolves common names, re-checks the gate and the proxy | pass | "salal → kinnikinnick": one of the species names was not recognised |
| T·F1 vague request: no boundary, scale unknown, no plant quantities possible | pass |  |
| T·F2 side region: "right" is the eastern third of the bed | pass |  |
| T·G1 site − inner rectangle = one polygon with one hole; area = 24 − 3 | pass | [[4,1,21]] |
| T·G2 a path across the site splits it into two pieces of 10 m² | pass | [10,10] |
| T·G3 inset 0.5 m of 6 × 4 = 5 × 3 (15 m²), concave-safe construction | pass | [15] |
| T·G4 inset of an L-shape stays one valid piece smaller than the original | pass | [44.06] |
| T·G5 minWidth: 6 × 4 → 4 m; a 6 × 0.8 band → 0.8 m | pass |  |
| T·G6 a self-intersecting outline is rejected; a square is valid | pass | zero area |
| T·G7 pointInShape honours holes | pass |  |
| T·H1 plantable = site − open area (24 − 3.84 = 20.16 m²); the tree is a constraint, not an exclusion | pass | 20.16 m² |
| T·H2 recommended layout: ≥ 2 beds, a Screen band on the north edge, the open centre untouched, every bed valid | pass | North bed 5.4, East bed 2.48, West bed 2.48, Tree island 2.57 |
| T·H3 the layout is not the old inset-rectangle default (planted share < 90 % of plantable; centre open) | pass | {"site_m2":24,"plantable_m2":20.16,"planting_m2":12.93,"open_m2":7.23,"planting_share":0.64,"beds":4} |
| T·H4 alternatives differ materially (more open / more planting) and come from the same site model | pass | A 12.93 · B 8.12 · C 15.47 |
| T·H5 every bed carries strategy, reasoning, functions and a validation; tree overlap is recorded as conditional, not removed | pass | North bed 2.44 m² under canopy, West bed 0.82 m² under canopy, Tree island 2.56 m² under canopy |
| T·H6 no dimensions → conceptual proposal: no bed polygon, the question that unblocks it, the moves it would make | pass | edge |
| T·H7 irregular L-site with a shed, a path and a tree: beds avoid shed + path (with clearance), stay inside, do not overlap; several beds | pass | 46.36 of 60 m² · A:6 B:3 C:4 |
| T·H8 a long thin site (12 × 3): beds valid, screen band reduced for the small depth, no bed narrower than 0.5 m | pass | North bed w0.89, East bed w0.98, West bed w0.98 |
| T·H9 a large site (30 × 20): proposal valid with an open centre and a screen on the east | pass | {"site_m2":600,"plantable_m2":600,"planting_m2":62.4,"open_m2":537.6,"planting_share":0.1,"beds":3} |
| T·H10 an open area inside the site: the infill alternative yields a bed with a hole (or ring pieces) and none overlaps the patio | pass | Centre bed 28.8 holes=1 |
| T·H11 regular site without an open wish: a modular (rectilinear) alternative with ≥ 2 rectangular beds separated by paths | pass | A edge 3 · B modular 4 · C infill 1 |
| T·H12 validation catches beds outside the site, inside the open area and overlapping each other | pass | 6 m² outside the site boundary; 1.68 m² inside open (children) (open area); overlaps y by 2 m²; 0.08 m² inside open (children) (open area) |
| T·I1 one version over all beds: every bed has plants, every plant inside its own bed (holes honoured), none in the open area | pass | North bed 14, East bed 19, West bed 6, Tree island 2 |
| T·I2 screen rows only in the bed that carries Screen (the named north edge); the ground layer only in beds that carry Ground Cover | pass |  |
| T·I3 ids unique across beds; schedule lists the beds per species; validation passes | pass | arctostaphylos-uva-ursi 22 [3] · gaultheria-shallon 11 [3] · achillea-millefolium 8 [4] |
| T·I4 deterministic across beds (same seed → same objects) | pass |  |
| T·I5 a bed with a hole: area excludes the hole, no plant inside it | pass | 220 plants |
| T·J1 "make the north planting bed wider" → resize request: side north, direction wider, default 0.5 m flagged as a candidate | pass | {"op":"resize","target":{"side":"north","tree":false,"name":null},"direction":"wider","amount_m":0.5,"amount_basis":"default 0.5 m — adjust before applying"} |
| T·J2 delete / add / open-area / tree-island requests are read with their side, width and metres | pass | [{"op":"delete","target":{"side":"east","tree":false,"name":null}},{"op":"add","side":"west","width_m":0.6,"function":"z:ground_cover"},{"op":"open_resize","direction":"bigger","amount_m":0.4},{"op":"resize","target":{"side":null,"tree":true,"name":null},"direction":"wider","amount_m":0.3,"amount_basis":"from \"0.3 m\""}] |
| T·J3 classify: a bed edit is routed to the spatial engine, a plant edit stays with the planting engine | pass |  |
| T·J4 preview locates the north bed, grows it inward only (boundary edge kept), reports the clip against neighbours and the tree | pass | 5.4 → 6.51 m² · bed |
| T·J5 design impact names the affected plants and the untouched beds | pass | {"beds":[{"bed_id":"bed-1","plants":14,"outside_after":0,"removed_bed":false}],"plants_affected":14,"plants_outside_after":0,"untouched_beds":["bed-2","bed-3","bed-4"]} |
| T·J6 after apply: only the north bed is stale; the other beds are untouched and recognised as such | pass | {"changed":["bed-1"],"removed":[],"added":[],"stale":true,"invalid_plants":[],"untouched":["bed-2","bed-3","bed-4"],"user_edited_in_changed":[]} |
| T·J7 partial regeneration: plants of unchanged beds kept byte-equal, the north bed replanted inside its new outline, version valid | pass | −14 +11 = 27 unchanged |
| T·J8 user-moved plants in the changed bed survive a partial regeneration when still valid | pass | 7 kept |
| T·J9 site undo restores the previous bed geometry | pass |  |
| T·J10 "remove the east bed" previews a removal (not applied) of the bed to the east | pass | East bed |
| T·J11 an unlocatable bed is refused with the list of beds, nothing changes | pass | which bed? North bed, East bed, West bed, Tree island |
| T·R1 soil the database cannot express (clay, loam) → unknown for every species, never fail | pass | clay unknown · loam unknown |
| T·R2 sandy: the species that records it passes; species silent on texture are unknown, not fail | pass | ["unknown","unknown","pass","unknown","unknown","unknown","unknown","unknown","unknown","unknown"] |
| T·R3 acidic: pass only with a recorded Acidic label; fail only with a recorded opposite pH; silent on pH → unknown | pass | pass,fail,pass,unknown,pass,pass,unknown,pass,pass,pass |
| T·R4 "well-drained" is stored as soil_drainage and the gate reads it (was written to a key nothing read) | pass | soil_drainage=well-drained · ["pass","pass","pass","pass","pass","unknown","pass","pass","pass","pass"] |
| T·R5 poorly drained: no species records it → unknown, not a fail | pass | ["unknown"] |
| T·R6 two soil conditions are reported separately and an unassessed one keeps the gate at unknown | pass | soil type clay (user-stated) — no plant in the database records this soil texture: not assessed, not a fail; drainage well-drained (user-stated) — plant records Well-drained |
| T·R7 condition use is declared: wind / irrigation recorded only; clay recorded but not assessable; light gated | pass |  |
| T·R8 a bed mostly under a canopy: light is flagged as under canopy, its value stays the stated one (not turned into shade) | pass | share 1 · old oak |
| T·R9 under the canopy no species passes the light gate outright (conditional or unknown, with the reason); in the open bed the same species pass | pass | under conditional · open pass |
| T·R10 site light unknown → still unknown under the canopy (no shade assumed) | pass |  |
| T·R11 a light stated for the bed itself overrides the canopy inference | pass |  |
| T·R12 the assemblage of the tree bed says the light is a range and marks its candidates conditional at best | pass | Tree island: 100 % under old oak (canopy radius 2.5 m, user-stated) — light is checked as a range from full-sun to one step shadier; candidates are conditional at best (heuristic: a bed counts as "under the canopy" when at least 50 % of its area lies under existing tree crowns (threshold not from a source)) / Tree island: no new tree placed — Acer palmatum, Cercidiphyllum japonicum, Cornus nuttallii exceed the bed at claimed mature spread |
| T·R13 "right" / "left" set no compass edge: Screen is recorded with its edge unset and the edge is listed as unknown | pass | edge-unset · which edge to screen — "right side" names no compass side; choose the edge (north / south / east / west) |
| T·R14 a direction that belongs to the tree does not become the screened edge | pass | edge-unset |
| T·R14b the same holds inside one sentence (tree north, "privacy along the fence" → edge unset, not north) | pass | edge-unset |
| T·R15 a compass side in the privacy clause still sets the edge | pass | north-edge · west-edge |
| T·R16 "back" is read as north with the plan-up assumption stated | pass |  |
| T·R17 an unknown direction on a function places no row (it used to fall back to north) and says so | pass | North bed: Screen is wanted along "right edge" but this bed has no edge there — no row is placed (set the edge on the bed) / North bed: no plant fitted (9.6 m², narrowest ? m) |
| T·R18 a Screen-only bed gets screen rows and no ground layer (Ground Cover is no longer added unasked) | pass | screen · 9 plants |
| T·R19 a Ground-Cover-only bed gets a ground layer and no screen row | pass | ground · 74 plants |
| T·R20 changing a bed's functions changes its species, roles and count, and marks the version stale | pass | screen-only 9 [screen] · ground-only 74 [ground] · both 24 [ground+screen] |
| T·R21 a bed with no function (and none site-wide) stays empty, with the reason | pass | North bed: left empty — no spatial function set |
| T·R22 Scrim, Canopy and Barrier are declared not arranged and place nothing; each is reported on the version | pass | z:scrim: 0 · z:ceiling_canopy: 0 · z:barrier: 0 |
| T·R23 an unsupported function beside a supported one changes nothing in the planting and is listed | pass |  |
| T·R24 when the gates exclude species the engine plants only what passes and never falls back to an excluded one | pass | 7 excluded · 14 plants [ground] · gates unknown · Screen along the north edge (North bed): no eligible species — left unplanted. North bed: no species meets the Screen requirement (target 1.8 m) — the screened edge stays unplanted (Acer palmatum — form: a tree — the row operators arrange shrubs and perennials; there is no tree-placement rule; site: fails a site gate: site wet (user-stated) — plant records only average, moist; geometry: the row does not fit: crown radius 2.65 m (acer-palmatum:mat |
| T·R26 "privacy along the fence" (no side): the proposal has no screen band on any edge in any alternative, and says the edge awaits a choice | pass | 8 beds · privacy was asked for but no edge was named: no screen band is proposed and no screen is planted until you choose the edge (Compose → Site-wide spatial functions) |
| T·R27 the design plants no screen row for it and reports the pending choice | pass | Screen: wanted, but the edge has not been chosen — nothing is planted for it; choose the edge on the Compose page |
| T·R28 a hand-drawn bed that follows the site-wide list is not screened either | pass |  |
| T·R29 the two 50 % thresholds are declared as heuristics | pass |  |
| T·R25 site-wide function → bed matching: a north band matches north-edge, boundary and bed-interior, not south-edge | pass |  |
| T·V1 every species is classed for Screen (meets · uncertain · fails) with a reason for anything short of "meets"; the default target height is a labelled heuristic | pass | {"acer-palmatum":"fails","achillea-millefolium":"fails","arctostaphylos-uva-ursi":"fails","cercidiphyllum-japonicum":"fails","cornus-nuttallii":"fails","cornus-sericea":"uncertain","gaillardia-aristata":"fails","gaultheria-shallon":"uncertain","polystichum-munitum":"fails","vaccinium-ovatum":"uncertain"} |
| T·V2 a species with no Screen link, and a tree, never qualify; a link with a conflict or a candidate link is "uncertain" at best and never counted as verified | pass | acer-palmatum:fails cercidiphyllum-japonicum:fails cornus-sericea:uncertain(conflict) gaultheria-shallon:uncertain vaccinium-ovatum:uncertain(conflict) |
| T·V3 raising the target height narrows the candidates: 1.0 m ⊇ 1.8 m ⊇ 3.5 m ⊇ 7 m, and each loss is explained by a height claim | pass | 1.0 m [cornus-sericea,gaultheria-shallon,vaccinium-ovatum] · 1.8 m [cornus-sericea,gaultheria-shallon,vaccinium-ovatum] · 3.5 m [cornus-sericea] · 7 m [] |
| T·V4 one species against three targets: meets → uncertain → fails, each with its claim ids | pass | Gaultheria shallon at 1.0 / 1.8 / 3.5 m: uncertain → uncertain → fails · 2 of 4 claimed height ranges reach 1.8 m; the range used for the plan is 1.2–3 m (gaultheria-shallon:mature_height:rhs01); 2 claimed ranges stay below it |
| T·V4b where height ranges are stated for the bed light, selection reads only those, and the evaluation reads the same ones: an "uncertain" height in selection is "uncertain" (not "not met") in the evaluation | pass | shade ranges 1–1.5, 1.2–3, 1.2–3 m → selection uncertain · evaluation uncertain (possible 10 of 10 m) |
| T·V5 a year-round requirement removes the deciduous candidates and keeps the evergreen ones; without it leaf retention is not a criterion | pass | not required [cornus-sericea,gaultheria-shallon,vaccinium-ovatum] · year-round [gaultheria-shallon,vaccinium-ovatum] · removed [cornus-sericea] |
| T·V6 the species planted are the best class available, and a second species joins the row only when it is as good as the first | pass | gaultheria-shallon,vaccinium-ovatum (uncertain) |
| T·V7 bed depth 0.5 m: no row fits, nothing is planted and the reason names the depth each candidate needs | pass | Screen along the north edge (North bed): no eligible species — left unplanted. North bed: no species meets the Screen requirement (target 1.8 m) — the screened edge stays unplanted (Acer palmatum — form: a tree — the row operators arrange shrubs and perennials; there is no tree-placement rule; geome |
| T·V8 bed depth changes the species, the rows and the count: 0.8 m → one row of the only species that fits; 1.0 m → one row, the staggered row computed as not feasible; 3.0 m → two rows | pass | 0.8 m: gaultheria-shallon, rows 1 (17+0) · 1.0 m: gaultheria-shallon+vaccinium-ovatum, rows 1 (13+0), two rows need 2.21 m · 3.0 m: rows 2 (13+12) |
| T·V9 the row plan is arithmetic on the bed and the crown radius: spacing = 0.75 × claimed spread, placed ≤ expected, and the spacing rule is labelled a heuristic | pass | gaultheria-shallon r 0.38 m (gaultheria-shallon:mature_spread:rhs01) → spacing 0.76 m · expected 13,0 placed 13,0 on 10 m |
| T·V10 a shorter edge gives proportionally fewer plants at the same spacing | pass | 10 m edge 13 · 5 m edge 5 |
| T·V11 ground cover: the count follows the plantable area at a spacing derived from the claimed spread (double the area → about double the plants) | pass | 12 m²: expected 117, placed 79 · 24 m²: expected 234, placed 148 · spacing 0.34 m (0.65 × the mean claimed mature spread of the ground species (0.53 m)) |
| T·V12 obstacles reduce the plantable area and the count: an existing tree (trunk keep-out) and a no-plant zone | pass | open bed 24 m² / 148 · with tree 19.52 m² / 109 · with open zone 16 m² / 91 |
| T·V13 ground-cover figure is a geometric estimate: a share between 0 and 1, each point counted once, labelled as not actual cover | pass | shares 0.66 · 0.74 · 0.71 · 0.76 |
| T·V14 screen cover is the union of the crown projections on the edge: never more than the edge, less than the sum of diameters, and unchanged when every plant is counted twice | pass | edge 10 m · union 10 m · sum of diameters 28 m · doubled plants 10 m |
| T·V15 removing the plants between 3 m and 6 m opens one gap there; it is located, measured and the screen is reported as not met with the reason | pass | gap 4.46–6.7 m (2.24 m) · 2.24 m of 10 m is not covered by a mature crown (1 gap: 4.46–6.7 m) |
| T·V16 the target height is checked on the claimed height ranges: certain cover ≤ possible cover ≤ covered length, and the verdict is never "verified" | pass | target 1.0 m: uncertain (certain 5.24 / possible 10 of 10 m) · target 1.8 m: uncertain (certain 0 / possible 10 of 10 m) · uncertain,conflict |
| T·V17 with a year-round requirement the evaluation reports the evergreen cover and only evergreen species are in the row | pass | evergreen cover 10 of 10 m · gaultheria-shallon:evergreen vaccinium-ovatum:evergreen |
| T·V18 a row of a species whose Screen link has a conflict is evaluated as uncertain, with the conflict named | pass | Vaccinium ovatum: a trait claim contradicts its Screen use — the function link is not settled |
| T·V19 doubling the claimed spread of the lead species doubles its crown radius and spacing and lowers the count; the plant objects still cite the same claim, with the new range | pass | gaultheria-shallon gaultheria-shallon:mature_spread:rhs01: range 0.5,1 → 1,2 m · radius 0.38 → 0.75 m · spacing 0.76 → 1.03 m · row 13 → 9 |
| T·V20 capping every claimed height at 1.2 m leaves no species for a 1.8 m screen: the edge stays empty and each rejection cites the height claim | pass | Screen along the north edge (North bed): no eligible species — left unplanted. North bed: no species meets the Screen requirement (target 1.8 m) — the screened edge stays unplanted (Acer palmatum — form: a tree — the row operators arrange shrubs and perennials |
| T·V21 a species with no recorded height is "uncertain" for missing data, never "meets" | pass |  |
| T·V22 a 7 m screen: no species qualifies, the bed stays empty, and the version says why for each linked species | pass | no species could be used: Acer palmatum — form: a tree — the row operators arrange shrubs and perennials; there is no tree-placement rule; geometry: the row does not fit: crown radius 2.65 m (acer-palmatum:mature_spread:rhs01) needs 3.97 m of bed depth, the be |
| T·V23 every arrangement parameter declares its source; both spacing factors and the default target height are heuristics, the crown radius comes from a claim | pass | 11 heuristic · 2 geometry · 1 claim |
| T·V24 words set the requirement ("2 m high", "all year"); when nothing is said none is invented | pass | {"target_height_m":2,"target_basis":"stated: \"2 m high\"","year_round":true,"year_round_basis":"required"} |
| T·W1 a vague description gives a sketch with objects, and no site geometry: boundary, features, beds and scale stay empty | pass | existing-tree, open-area · sketch — unitless, not to scale |
| T·W2 a tree whose position was not said is recorded as existing, with no position | pass | it is not put on any side — {"text":null,"side":null,"status":"unknown"} |
| T·W3 "the middle" said → the open area is user-stated in the middle; its spot is inferred and its extent suggested | pass |  |
| T·W4 "on the north side" → relation user-stated, spot inferred in the upper part of the sketch | pass | [28,53.6] |
| T·W5 "at the back" is read as north with the reading stated; "left" names no compass side and leaves the tree unplaced | pass | "back" read as north (plan up) · "left" names no compass side |
| T·W6 an open area whose place was not said is drawn in the middle as a suggestion, not as something stated | pass |  |
| T·W7 suggested planting areas are outlines with a function and a reason | pass | no area, no width, no count — north edge, east edge, west edge, under the tree |
| T·W8 the view handed to the renderer keeps the scale unknown (no grid, no scale bar) and never touches the project | pass |  |
| T·W9 moving a tree marks it placed by the user; changing the outline proportions keeps every object at its relative place | pass | 0.200,0.746 → 0.200,0.746 |
| T·W10 saying which side a tree is on places it there as an estimate, to be confirmed | pass |  |
| T·W11 with a size, the sketch becomes site geometry: each object lands at its relative place in metres | pass | tree 1.6,3.73 · open [[2.4,1.1],[5.6,1.1],[5.6,3],[2.4,3]] |
| T·W12 what the user placed or confirmed arrives as user-drawn, with where it came from; the canopy stays unstated; the concept is closed | pass |  |
| T·W13 an object that was never placed is not given a position by the conversion; an unconfirmed one arrives as inferred | pass | 1 carried, 1 left unplaced |
| T·W14 start from scratch: the sketch is neither shown nor convertible | pass |  |
| A1 site model from one sentence: 6 × 4 m stated; tree inferred with its position labelled as estimated and canopy assumed; open centre inferred | pass | {"tree": {"status": "inferred", "position": [1.5, 3], "radius": null, "estimated_label": true}, "open": {"status": "inferred", "area_m2": 3.8}} |
| A2 spatial proposal: recommended layout A with ≥ 2 beds, all candidates valid, plantable = site − open area | pass | [{"id": "A", "label": "Recommended", "beds": 4, "planting_m2": 12.93, "open_m2": 7.23, "valid": true, "strategies": ["edge", "edge", "island"]}, {"id": "B", "label": "More open centre", "beds": 2, "planting_m2": 8.12, "open_m2": 12.04, "valid": true, "strategies": ["edge", "island"]}, {"id": "C", "label": "More planting area", "beds": 4, "planting_m2": 15.47, "open_m2": 4.69, "valid": true, "strategies": ["edge", "island", "infill"]}] |
| A3 a Screen band on the north edge; the open centre is kept free of beds; not one inset rectangle | pass | [["North bed", 5.4, ["z:screen", "z:ground_cover"]], ["East bed", 2.48, ["z:ground_cover"]], ["West bed", 2.48, ["z:ground_cover"]], ["Tree island", 2.56, ["z:ground_cover"]]] |
| A4 the Shape panel shows the alternatives, the reasoning, a row per bed and an Accept action | pass | {"panel_cands": 3, "explanation_lines": 4, "bed_rows": 4, "accept_button": true} |
| A5 accept → every bed confirmed; Compose lists a card per bed with candidates | pass | {"stage": "intent", "in_garden": false, "sections": ["welcome", "site", "intent"], "nav_enabled": ["welcome", "site", "intent"], "revision_card": false, "composer_open": false, "overflow_x": 0, "inner_width": 1440, "bed_cards": 4, "candidates": 14, "functions": ["z:screen@north-edge", "z:scrim@north-edge", "z:ground_cover@bed-interior"]} |
| A6 Grow: every bed planted, every plant inside its bed, none in the open area, plan symbols = plants = schedule, 3D = plants | pass | {"per_bed": [["North bed", 14], ["East bed", 19], ["West bed", 6], ["Tree island", 2]], "three": {"plants": 41, "meshes": 562}} |
| B1 vague input: values read, no boundary, scale unknown, no bed polygon; proposal is conceptual with its moves and the size question | pass | {"values": {"maintenance_low": 2, "ecology": 2}, "questions": ["How big is the site? Type width \u00d7 height in metres, draw the boundary, or trace a photo and calibrate a known length.", "Should any part stay open (seating, play, a path), and is there an edge that needs screening?"]} |
| B2 the Shape panel asks the key question and lists the conceptual moves; the canvas shows a sketch marked as not to scale, and no site geometry in metres exists | pass | {"q": "How big is the site? Type width \u00d7 height in metres, draw the boundary, or trace a photo and calibrate a known length.", "moves": 1} |
| B3 after W × H (5 × 4): beds proposed in metres, valid, with alternatives | pass | [["North bed", 5], ["East bed", 3], ["West bed", 3], ["A", "Recommended"], ["B", "Modular beds"], ["C", "More planting area"]] |
| C1 'Make the north planting bed wider.' → the north bed located; before / after areas; conflicts checked (tree, open area, boundary, other beds); preview card and ghost drawn; impact on the current design stated | pass | {"changes": [{"name": "North bed", "before_m2": 5.4, "after_m2": 6.51, "min_width_m": 1.39}], "conflicts": ["bed"], "impact": {"beds": [{"bed_id": "bed-1", "plants": 14, "outside_after": 0, "removed_bed": false}], "plants_affected": 14, "plants_outside_after": 0, "untouched_beds": ["bed-2", "bed-3", "bed-4"]}} |
| C2 Apply: only the north bed changed (status edited); the other beds are byte-identical; site history grew | pass | {"applied": {"changes": ["North bed"], "added": [], "removed": []}, "north_changed": true, "others_unchanged": true, "north_area": 6.51, "status": "user-edited", "history": 3} |
| C3 Compose shows the updated area for the north bed and candidates per bed | pass | {"bed_cards": 4, "north_card_area": "6.51", "candidates": 14} |
| C4 Grow: the banner names the changed bed and the unaffected beds; nothing was regenerated silently | pass | The planting areas changed (North bed): 0 plants now outside a bed; 3 other beds unaffected.Preview updated designKeep c |
| C5 partial regeneration preview: removals drawn red, plants of unchanged beds byte-equal, additions inside the new outline | pass | {"removed": 14, "added": 11, "unchanged": 27, "kept_exact": true} |
| C6 Apply: new version with the old one as parent and still viewable; per-bed counts; plan symbols = schedule = 3D; export consistent | pass | {"per_bed": [["East bed", 19], ["West bed", 6], ["Tree island", 2], ["North bed", 11]], "export": {"svg_plants": 38, "csv_total": 38, "model_plants": 38, "md_has_beds": true}} |
