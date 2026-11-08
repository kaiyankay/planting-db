# Design workspace tests — 2026-11-08

`tools/design_tests.py` against http://127.0.0.1:8768 (headless Chrome). **89/89 pass.**

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
| T·C6 "move the taller plants away from the tree" → move_away with a resolved feature | pass | {"type":"move_away","filter":"taller","feature_id":"tree-63ex1","phrase":"tree","resolved":true} |
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
| J1 vague description: intent read, no geometry invented, blockers listed | pass | values ['privacy', 'maintenance_low', 'ecology', 'openness'] · unknown ['site dimensions / scale', 'light', 'soil type and drainage', 'ecological performance — the database records some ecological-value claims (pollinator, bird food …) but no pollinator-interaction data; no score is possible'] |
| J2 6 × 4 m site: boundary, tree marker (inferred, canopy assumed), suggested open zone and a multi-bed layout proposal (≥ 2 suggested beds, open centre kept) | pass | [["North bed", 5.4, ["z:screen"]], ["East bed", 2.48, ["z:ground_cover"]], ["West bed", 2.48, ["z:ground_cover"]], ["Tree island", 2.56, ["z:ground_cover"]]] |
| J3 layout accepted by the user: every suggested bed confirmed | pass | ["user-accepted", "user-accepted", "user-accepted", "user-accepted"] |
| J4 brief: Screen on the north edge; light stated | pass | [{"function": "z:screen", "where": "north-edge", "basis": "privacy \u2192 Screen (blocks a view); Scrim would only filter it", "evidence": "privacy"}, {"function": "z:scrim", "where": "north-edge", "basis": "openness + privacy \u2192 Scrim as the alternative to check", "evidence": "openness", "alternative": true}, {"function": "z:ground_cover", "where": "bed-interior", "basis": "low maintenance \u2192 carpeting ground layer reduces open soil (design heuristic, not a database claim)", "evidence": |
| J5 generated: plant objects with ids, schedule reconciles, operators named, no geometry error | pass | 40 plants · ['along_edge', 'fill_drift', 'repeat_accent'] · edge [{'zone': 'zone-screen-north-edge-bed-1', 'bed_id': 'bed-1', 'label': 'Screen along the north edge (North bed)', 'edge_length_m': 6, 'screen_row_cover_m': 3.54, 'continuity': 0.59, 'note': 'row cover = sum of proxy diameters over edge length — a geometric proxy for continuity, not a measured screening effect'}] |
| J5b 2D plan draws one symbol group per plant object | pass | 40 symbols for 40 plants |
| J5c every bed of the layout is planted in the one version (multi-bed engine) | pass | [["North bed", 13], ["East bed", 19], ["West bed", 6], ["Tree island", 2]] |
| J6 3D garden (three.js) holds one object per plant of the same version | pass | garden {'plants': 40, 'meshes': 531} · model 40 |
| J7 lasso + language: scoped command (selection, reduce_density, preserve screen), preview diff, nothing outside moved | pass | targets 25 · removed 6 |
| J8 applied: new version with fewer plants = removed ids | pass | 34 plants, 6 removed |
| J8b 3D garden re-synced after apply: plant count = applied version | pass | garden {'plants': 34, 'meshes': 465} · model 34 |
| J9/10 undo returns to the generated version; redo returns to the edit | pass | undo 40 · redo 34 |
| J11 text-only reference 'move the taller plants away from the tree' resolved to a typed move_away command | pass | {"diff": {"added": [], "removed": [], "changed": [], "unchanged": ["plant-001", "plant-002", "plant-003", "plant-004", "plant-005", "plant-006", "plant-007", "plant-008", "plant-009", "plant-010", "plant-011", "plant-012", "plant-013", "plant-014", "plant-015", "plant-016", "plant-017", "plant-018", |
| J12 export: SVG plant count = model = schedule total | pass | {"name": "12 export", "stage": "garden", "files": ["model.json", "plan.svg", "schedule.csv", "assumptions.md"], "svg_plants": 34, "model_plants": 34, "csv_total": 34, "garden": {"plants": 34, "meshes": 465}} |
| S1 design server reachable; designs saved to designs/ | pass | llm: ANTHROPIC_API_KEY not set — offline rule parser in use · designs ['demo-a', 'demo-b', 'demo-backyard', 'proj-13x0', 'proj-166r0', 'proj-1geo0', 'proj-1jj10', 'proj-1jmy0', 'proj-1jmy1', 'proj-1q4x0', 'proj-1s4w0', 'proj-1xeh0', 'proj-206b0', 'proj-228p0', 'proj-26ut0', 'proj-2cr30', 'proj-2gg20', 'proj-2nza0', 'proj-2wbf0', 'proj-2yk20', 'proj-3anl0', 'proj-3cg30', 'proj-3gl70', 'proj-3j5b0', 'proj-3lq80', 'proj-3qff0', 'proj-4o3i0', 'proj-4py80', 'proj-4pym1', 'proj-53be0', 'proj-5akn0', ' |
| S2 saved project: versions chain by parent id; current version's schedule equals its plant objects | pass | demo-backyard: 3 versions · current v-68rcl · 34 plants |
| S3 saved project: every plant inside its bed polygon (file, not UI) | pass |  |
