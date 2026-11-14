# Explorer tests — 2026-11-14

`tools/explorer_tests.py` on `brain/data/explorer.json` (2026-11-13, tools/build_explorer.py) against kg.json (2026-11-13), xyz.json (2026-11-13), relations.json (2026-11-02) and plants/*.json. **23/23 pass.** (no browser run; add `--browser`)

| test | result | detail |
|---|---|---|
| A1 ten species, ids = plants/*.json | pass | 10 · ['acer-palmatum', 'achillea-millefolium', 'arctostaphylos-uva-ursi', 'cercidiphyllum-japonicum', 'cornus-nuttallii', 'cornus-sericea', 'gaillardia-aristata', 'gaultheria-shallon', 'polystichum-munitum', 'vaccinium-ovatum'] |
| A2 the five spatial functions | pass | ['Ceiling / Canopy', 'Ground Cover', 'Screen', 'Scrim', 'Barrier'] |
| A3 exactly species × functions link cells, one per pair | pass | 50 cells |
| A4 attribute cells name a species and a facet; one per (species, facet) | pass | 230 cells · 27 facets |
| A5 ids unique across collections | pass | 876 ids |
| B1 every referenced id exists (dangling claim references in relations.json are flagged `missing_claims`, never invented) | pass | flagged: ['rel:gaultheria-shallon:vaccinium-ovatum:m2'] |
| C1 drawn links resolve to a use claim (derived) or a met requirement check (candidate) | pass |  |
| C2 every attribute value names live claims or an entity record | pass |  |
| C3 concept links cite live claims only | pass | [] |
| C4 AI evidence checks are keyed by claim id and every check result is in the vocabulary | pass | 534 checks |
| D1 link verification from verified use claims only; candidates never verified; status = strongest kg edge; unknown never drawn | pass |  |
| D2 attribute verification from verified claims only | pass | [] |
| D3 claim statuses unchanged from kg.json (nothing promoted) | pass | 501 claims |
| D4 three vocabularies kept apart on the file | pass |  |
| E1 50 cells = 21 xyz suited_for lines + 29 xyz gaps, same status, conflict, verification and verdict | pass | 21 drawn · 29 unknown;  |
| E2 every function has ≥ 1 linked species and its requirements carry literature | pass | {'Ceiling / Canopy': 3, 'Ground Cover': 6, 'Screen': 5, 'Scrim': 1, 'Barrier': 6} |
| F1 every relations.json record projected once with its status; retired = history, never drawn; placeholders flagged | pass | 41 records · 19 live · 22 retired;  |
| F2 no live relation was derived from shared attributes alone (M43: REL-R1 companions stay retired) | pass | 20 REL-R1 records, all retired |
| G1 45 pairs: direct / retired ids = relations.json; shared ⊆ kg; combinations only from drawn links, never same function, labelled hypothesis | pass | 45 pairs · 17 with a live record;  |
| H1 attribute cells = xyz plant → concept lines + plant attributes; every distinct value kept; disagreement = kg conflicts | pass |  |
| H2 not-recorded cells are absent from the file (the interface says 'not recorded'; nothing is written for them) | pass | 40 not recorded |
| I1 the interface names no plant, function or concept id | pass | [] |
| J1 statistics match the file | pass | {"species": 10, "functions": 5, "function_links": 50, "attribute_cells": 230, "relations": 41, "pairs": 45, "claims": 501} |

## Counts

- 10 species · 27 facets · 230 attribute cells (40 not recorded · 27 with a source disagreement)
- 5 functions · 50 link cells: {'candidate': 9, 'unknown': 29, 'derived': 12} · 21 drawn · 4 with a conflict · unknown by verdict {'contradicted by traits': 26, 'evidence missing': 3} · verification {'none': 38, 'unverified': 9, 'verified': 3}
- 41 relation records: 19 live ({'co_listed': 15, 'competes': 1, 'layered_under': 2, 'companion': 1}, 3 model placeholders) · 22 retired
- 45 pairs · 17 with a live direct record · 44 with a complementarity hypothesis
- 501 claims cited ({'unverified': 463, 'verified': 38}) · AI evidence checks on 534 claims ({'partially_supported': 99, 'supported_by_source': 359, 'not_assessed': 38, 'conflicting_evidence': 5}) · 17 sources
