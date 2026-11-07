# Design workspace tests — 2026-11-07

`tools/design_tests.py` against http://127.0.0.1:8768 (headless Chrome). **50/50 pass.**

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
| T·C6 "move the taller plants away from the tree" → move_away with a resolved feature | pass | {"type":"move_away","filter":"taller","feature_id":"tree-98w11","phrase":"tree","resolved":true} |
| T·C7 overclaim classified | pass |  |
| T·D1 every plant object has a stable id, a species from the database, a position inside the accepted bed | pass | 37 plants |
| T·D2 no plant inside the no-plant zone, none under the locked tree | pass |  |
| T·D3 unique ids; schedule counts equal plant objects by species | pass | arctostaphylos-uva-ursi×23 achillea-millefolium×5 gaultheria-shallon×4 vaccinium-ovatum×4 polystichum-munitum×1 |
| T·D4 the screen zone exists on the north edge and its row is made of species linked to Screen | pass | 4 screen plants |
| T·D5 operators are real and named on groups; proxies carry claim ids | pass | along_edge:4 stagger:4 fill_drift:29 repeat_accent:5 |
| T·D6 no tree placed in a 6 × 4 bed (claimed spreads exceed it) and the reason is recorded | pass | acer-palmatum,cercidiphyllum-japonicum,cornus-nuttallii |
| T·D7 validation: no geometry errors | pass |  |
| T·D8 evaluation has no invented cost or ecology score | pass |  |
| T·D9 deterministic: same seed → same ids, species and positions | pass | 37 vs 37 |
| T·D10 a different seed changes positions (jitter) but not the rule-driven assemblage | pass | 39 plants vs 37 |
| T·D11 density is a real parameter: 0.7 → fewer plants, same operators | pass | 19 < 37 |
| T·E1 scoped edit removes only plants inside the resolved region | pass | removed 4 of 17 targets |
| T·E2 nothing outside the scope moved or changed | pass | outside changed: 0 |
| T·E3 screen-row plants inside the scope kept (preserve privacy as an intent); privacy not guaranteed | pass | 2 screen-row plants kept untouched to preserve the screen (an intent; screening performance is not quantified) |
| T·E4 preview is not committed; apply makes a new version with the parent link; schedule reconciles | pass |  |
| T·E5 undo restores the previous version byte-equal; redo returns | pass |  |
| T·E6 move_away: only plants with a known height ≥ 1 m move; unknown heights are never invented | pass | 0 moved · move taller plants away from old tree: 0 moved, 5 could not be moved within the bed |
| T·E7 a refused request leaves the design identical | pass |  |
| T·E8 direct move: one object changed, same ids, schedule unchanged | pass |  |
| T·E9 direct delete: one fewer object, schedule recomputed from objects | pass |  |
| T·E10 species swap resolves common names, re-checks the gate and the proxy | pass | "salal → kinnikinnick": one of the species names was not recognised |
| T·F1 vague request: no boundary, scale unknown, no plant quantities possible | pass |  |
| T·F2 side region: "right" is the eastern third of the bed | pass |  |
| J1 vague description: intent read, no geometry invented, blockers listed | pass | values ['privacy', 'maintenance_low', 'ecology', 'openness'] · unknown ['site dimensions / scale', 'light', 'soil type and drainage', 'ecological performance — the database records some ecological-value claims (pollinator, bird food …) but no pollinator-interaction data; no score is possible'] |
| J2 6 × 4 m site: boundary, tree marker (inferred, canopy assumed), suggested open zone and bed | pass | [{"id": "tree-9fa26", "kind": "existing-tree", "status": "inferred"}, {"id": "open-9fa27", "kind": "no-plant-zone", "status": "inferred"}] |
| J3 bed accepted by the user | pass |  |
| J4 brief: Screen on the north edge; light stated | pass | [{"function": "z:screen", "where": "north-edge", "basis": "privacy \u2192 Screen (blocks a view); Scrim would only filter it", "evidence": "privacy"}, {"function": "z:scrim", "where": "north-edge", "basis": "openness + privacy \u2192 Scrim as the alternative to check", "evidence": "openness", "alternative": true}, {"function": "z:ground_cover", "where": "bed-interior", "basis": "low maintenance \u2192 carpeting ground layer reduces open soil (design heuristic, not a database claim)", "evidence": |
| J5 generated: plant objects with ids, schedule reconciles, operators named, no geometry error | pass | 37 plants · ['along_edge', 'stagger', 'fill_drift', 'repeat_accent'] · edge [{'zone': 'zone-screen-north-edge', 'label': 'Screen along the north edge', 'edge_length_m': 5.4, 'screen_row_cover_m': 2.28, 'continuity': 0.42, 'note': 'row cover = sum of proxy diameters over edge length — a geometric proxy for continuity, not a measured screening effect'}] |
| J7 lasso + language: scoped command (selection, reduce_density, preserve screen), preview diff, nothing outside moved | pass | targets 19 · removed 5 |
| J8 applied: new version with fewer plants = removed ids | pass | 32 plants, 5 removed |
| J9/10 undo returns to the generated version; redo returns to the edit | pass | undo 37 · redo 32 |
| J11 text-only reference 'move the taller plants away from the tree' resolved to a typed move_away command | pass | {"diff": {"added": [], "removed": [], "changed": ["plant-006"], "unchanged": ["plant-001", "plant-002", "plant-003", "plant-007", "plant-008", "plant-009", "plant-010", "plant-011", "plant-012", "plant-013", "plant-014", "plant-015", "plant-016", "plant-018", "plant-019", "plant-020", "plant-021", " |
| J12 export: SVG plant count = model = schedule total | pass | {"name": "12 export", "files": ["model.json", "plan.svg", "schedule.csv", "assumptions.md"], "svg_plants": 32, "model_plants": 32, "csv_total": 32} |
| S1 design server reachable; designs saved to designs/ | pass | llm: ANTHROPIC_API_KEY not set — offline rule parser in use · designs ['demo-backyard', 'proj-9fa20'] |
| S2 saved project: versions chain by parent id; current version's schedule equals its plant objects | pass | demo-backyard: 3 versions · current v-9fa2l · 32 plants |
| S3 saved project: every plant inside its bed polygon (file, not UI) | pass |  |
