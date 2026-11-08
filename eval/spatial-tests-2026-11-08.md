# Spatial proposal tests — 2026-11-08

`tools/spatial_tests.py` against http://127.0.0.1:8768 (headless Chrome, SwiftShader WebGL). **87/87 pass.**

| test | result | detail |
|---|---|---|
| T·A1 ten species from the projection, stable ids | pass | acer-palmatum,achillea-millefolium,arctostaphylos-uva-ursi,cercidiphyllum-japonicum,cornus-nuttallii,cornus-sericea,gaillardia-aristata,gaultheria-shallon,polystichum-munitum,vaccinium-ovatum |
| T·A2 size proxy names its claim and range; height follows the stated light condition | pass | r 0.38 (gaultheria-shallon:mature_spread:rhs01) · h 1.25 (gaultheria-shallon:mature_height:rhs01, Shade/Humus rich) |
| T·A3 gate: stated light → pass with claims; unknown water/soil → unknown, never pass | pass | {"light":"pass","water":"unknown","overall":"unknown"} |
| T·A4 gate fail when the plant records no matching light | pass | site shade (user-stated) — plant records Filtered shade, Part sun/part shade |
| T·A5 function support keeps status, conflict and verification apart | pass | {"status":"derived","drawn":true,"conflict":true,"verification":"unverified","verdict":"contradicted by traits","use_lab |
| T·B1 empty project: no geometry, scale unknown, blockers listed | pass | no site geometry yet — draw a boundary or state the dimensions / scale unknown — measured spacing and quantities are blocked until a length is stated or calibrated / no planting bed yet — draw one or accept a suggestion |
| T·B2 site model: boundary, calibrated scale, two locked features, one accepted bed | pass | {"site_boundary":true,"scale":true,"beds":1,"accepted_beds":1,"unknown_conditions":["soil_type","soil_drainage","water","wind","irrigation"],"measured_placement":true,"blockers":[]} |
| T·C1 description → values, functions, hard constraints, unknowns; no dimensions invented | pass | privacy,maintenance_low,ecology,openness · z:screen@north-edge,z:scrim@north-edge,z:ground_cover@bed-interior · unknown: site dimensions / scale; light; soil type and drainage; ecological performance — the database records some ecological-value claims (pollinator, bird food …) but no pollinator-interaction data; no score is possible |
| T·C2 dimensions, light and soil read as stated facts | pass | dimensions:6,condition:shade,condition:clay |
| T·C3 text-only "right side" → direction scope with a polygon; reduce_density + preserve screen | pass | "right side" read relative to the plan as drawn (north up); the region is the outer third of the bed on that side · amount 0.25 |
| T·C4 "here" with a drawn selection → selection scope | pass | "here" → the drawn selection |
| T·C5 contradictory request is refused, not silently applied | pass | filling the open zone with tall plants contradicts the open-space constraint; no change is made without an explicit override |
| T·C6 "move the taller plants away from the tree" → move_away with a resolved feature | pass | {"type":"move_away","filter":"taller","feature_id":"tree-57aa1","phrase":"tree","resolved":true} |
| T·C7 overclaim classified | pass |  |
| T·D1 every plant object has a stable id, a species from the database, a position inside the accepted bed | pass | 36 plants |
| T·D2 no plant inside the no-plant zone, none under the locked tree | pass |  |
| T·D3 unique ids; schedule counts equal plant objects by species | pass | arctostaphylos-uva-ursi×22 achillea-millefolium×5 gaultheria-shallon×4 vaccinium-ovatum×4 polystichum-munitum×1 |
| T·D4 the screen zone exists on the north edge and its row is made of species linked to Screen | pass | 4 screen plants |
| T·D5 operators are real and named on groups; proxies carry claim ids | pass | along_edge:4 stagger:4 fill_drift:28 repeat_accent:5 |
| T·D6 no tree placed in a 6 × 4 bed (claimed spreads exceed it) and the reason is recorded | pass | acer-palmatum,cercidiphyllum-japonicum,cornus-nuttallii |
| T·D7 validation: no geometry errors | pass |  |
| T·D8 evaluation has no invented cost or ecology score | pass |  |
| T·D9 deterministic: same seed → same ids, species and positions | pass | 36 vs 36 |
| T·D10 a different seed changes positions (jitter) but not the rule-driven assemblage | pass | 26 plants vs 36 |
| T·D11 density is a real parameter: 0.7 → fewer plants, same operators | pass | 22 < 36 |
| T·E1 scoped edit removes only plants inside the resolved region | pass | removed 3 of 12 targets |
| T·E2 nothing outside the scope moved or changed | pass | outside changed: 0 |
| T·E3 screen-row plants inside the scope kept (preserve privacy as an intent); privacy not guaranteed | pass | 2 screen-row plants kept untouched to preserve the screen (an intent; screening performance is not quantified) |
| T·E4 preview is not committed; apply makes a new version with the parent link; schedule reconciles | pass |  |
| T·E5 undo restores the previous version byte-equal; redo returns | pass |  |
| T·E6 move_away: only plants with a known height ≥ 1 m move; unknown heights are never invented | pass | 1 moved · move taller plants away from old tree: 1 moved, 4 could not be moved within the bed |
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
| T·I1 one version over all beds: every bed has plants, every plant inside its own bed (holes honoured), none in the open area | pass | North bed 13, East bed 19, West bed 6, Tree island 2 |
| T·I2 the screen row sits in the north band only; the ground layer in every bed | pass |  |
| T·I3 ids unique across beds; schedule lists the beds per species; validation passes | pass | arctostaphylos-uva-ursi 24 [3] · achillea-millefolium 8 [4] · gaultheria-shallon 7 [3] · vaccinium-ovatum 1 [1] |
| T·I4 deterministic across beds (same seed → same objects) | pass |  |
| T·I5 a bed with a hole: area excludes the hole, no plant inside it | pass | 220 plants |
| T·J1 "make the north planting bed wider" → resize request: side north, direction wider, default 0.5 m flagged as a candidate | pass | {"op":"resize","target":{"side":"north","tree":false,"name":null},"direction":"wider","amount_m":0.5,"amount_basis":"default 0.5 m — adjust before applying"} |
| T·J2 delete / add / open-area / tree-island requests are read with their side, width and metres | pass | [{"op":"delete","target":{"side":"east","tree":false,"name":null}},{"op":"add","side":"west","width_m":0.6,"function":"z:ground_cover"},{"op":"open_resize","direction":"bigger","amount_m":0.4},{"op":"resize","target":{"side":null,"tree":true,"name":null},"direction":"wider","amount_m":0.3,"amount_basis":"from \"0.3 m\""}] |
| T·J3 classify: a bed edit is routed to the spatial engine, a plant edit stays with the planting engine | pass |  |
| T·J4 preview locates the north bed, grows it inward only (boundary edge kept), reports the clip against neighbours and the tree | pass | 5.4 → 6.51 m² · bed |
| T·J5 design impact names the affected plants and the untouched beds | pass | {"beds":[{"bed_id":"bed-1","plants":13,"outside_after":0,"removed_bed":false}],"plants_affected":13,"plants_outside_after":0,"untouched_beds":["bed-2","bed-3","bed-4"]} |
| T·J6 after apply: only the north bed is stale; the other beds are untouched and recognised as such | pass | {"changed":["bed-1"],"removed":[],"added":[],"stale":true,"invalid_plants":[],"untouched":["bed-2","bed-3","bed-4"],"user_edited_in_changed":[]} |
| T·J7 partial regeneration: plants of unchanged beds kept byte-equal, the north bed replanted inside its new outline, version valid | pass | −13 +11 = 27 unchanged |
| T·J8 user-moved plants in the changed bed survive a partial regeneration when still valid | pass | 4 kept |
| T·J9 site undo restores the previous bed geometry | pass |  |
| T·J10 "remove the east bed" previews a removal (not applied) of the bed to the east | pass | East bed |
| T·J11 an unlocatable bed is refused with the list of beds, nothing changes | pass | which bed? North bed, East bed, West bed, Tree island |
| A1 site model from one sentence: 6 × 4 m stated; tree inferred with its position labelled as estimated and canopy assumed; open centre inferred | pass | {"tree": {"status": "inferred", "position": [1.5, 3], "radius": null, "estimated_label": true}, "open": {"status": "inferred", "area_m2": 3.8}} |
| A2 spatial proposal: recommended layout A with ≥ 2 beds, all candidates valid, plantable = site − open area | pass | [{"id": "A", "label": "Recommended", "beds": 4, "planting_m2": 12.93, "open_m2": 7.23, "valid": true, "strategies": ["edge", "edge", "island"]}, {"id": "B", "label": "More open centre", "beds": 2, "planting_m2": 8.12, "open_m2": 12.04, "valid": true, "strategies": ["edge", "island"]}, {"id": "C", "label": "More planting area", "beds": 4, "planting_m2": 15.47, "open_m2": 4.69, "valid": true, "strategies": ["edge", "island", "infill"]}] |
| A3 a Screen band on the north edge; the open centre is kept free of beds; not one inset rectangle | pass | [["North bed", 5.4, ["z:screen"]], ["East bed", 2.48, ["z:ground_cover"]], ["West bed", 2.48, ["z:ground_cover"]], ["Tree island", 2.56, ["z:ground_cover"]]] |
| A4 the Shape panel shows the alternatives, the reasoning, a row per bed and an Accept action | pass | {"panel_cands": 3, "explanation_lines": 4, "bed_rows": 4, "accept_button": true} |
| A5 accept → every bed confirmed; Compose lists a card per bed with candidates | pass | {"stage": "intent", "in_garden": false, "sections": ["welcome", "site", "intent"], "nav_enabled": ["welcome", "site", "intent"], "revision_card": false, "composer_open": false, "overflow_x": 0, "inner_width": 1440, "bed_cards": 4, "candidates": 14, "functions": ["z:screen@north-edge", "z:scrim@north-edge", "z:ground_cover@bed-interior"]} |
| A6 Grow: every bed planted, every plant inside its bed, none in the open area, plan symbols = plants = schedule, 3D = plants | pass | {"per_bed": [["North bed", 13], ["East bed", 19], ["West bed", 6], ["Tree island", 2]], "three": {"plants": 40, "meshes": 532}} |
| B1 vague input: values read, no boundary, scale unknown, no bed polygon; proposal is conceptual with its moves and the size question | pass | {"values": {"maintenance_low": 2, "ecology": 2}, "questions": ["How big is the site? Type width \u00d7 height in metres, draw the boundary, or trace a photo and calibrate a known length.", "Should any part stay open (seating, play, a path), and is there an edge that needs screening?"]} |
| B2 the Shape panel asks the key question and lists the conceptual moves; the canvas states that there is no geometry | pass | {"q": "How big is the site? Type width \u00d7 height in metres, draw the boundary, or trace a photo and calibrate a known length.", "moves": 1} |
| B3 after W × H (5 × 4): beds proposed in metres, valid, with alternatives | pass | [["North bed", 5], ["East bed", 3], ["West bed", 3], ["A", "Recommended"], ["B", "Modular beds"], ["C", "More planting area"]] |
| C1 'Make the north planting bed wider.' → the north bed located; before / after areas; conflicts checked (tree, open area, boundary, other beds); preview card and ghost drawn; impact on the current design stated | pass | {"changes": [{"name": "North bed", "before_m2": 5.4, "after_m2": 6.51, "min_width_m": 1.39}], "conflicts": ["bed"], "impact": {"beds": [{"bed_id": "bed-1", "plants": 13, "outside_after": 0, "removed_bed": false}], "plants_affected": 13, "plants_outside_after": 0, "untouched_beds": ["bed-2", "bed-3", "bed-4"]}} |
| C2 Apply: only the north bed changed (status edited); the other beds are byte-identical; site history grew | pass | {"applied": {"changes": ["North bed"], "added": [], "removed": []}, "north_changed": true, "others_unchanged": true, "north_area": 6.51, "status": "user-edited", "history": 3} |
| C3 Compose shows the updated area for the north bed and candidates per bed | pass | {"bed_cards": 4, "north_card_area": "6.51", "candidates": 14} |
| C4 Grow: the banner names the changed bed and the unaffected beds; nothing was regenerated silently | pass | The planting areas changed (North bed): 0 plants now outside a bed; 3 other beds unaffected.Preview updated designKeep c |
| C5 partial regeneration preview: removals drawn red, plants of unchanged beds byte-equal, additions inside the new outline | pass | {"removed": 13, "added": 11, "unchanged": 27, "kept_exact": true} |
| C6 Apply: new version with the old one as parent and still viewable; per-bed counts; plan symbols = schedule = 3D; export consistent | pass | {"per_bed": [["East bed", 19], ["West bed", 6], ["Tree island", 2], ["North bed", 11]], "export": {"svg_plants": 38, "csv_total": 38, "model_plants": 38, "md_has_beds": true}} |
