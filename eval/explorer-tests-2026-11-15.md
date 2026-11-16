# Explorer tests — 2026-11-15

`tools/explorer_tests.py` on `brain/data/explorer.json` (2026-11-13, tools/build_explorer.py) against kg.json (2026-11-13), xyz.json (2026-11-13), relations.json (2026-11-02) and plants/*.json. **40/40 pass.** Browser: headless Chrome at http://127.0.0.1:8769/brain/explorer/.

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
| K0 no focus, no view named: Knowledge opens on the table with a row for every species (no start screen); the switch is Table | Matrix | Network with Table pressed; no other view is in the page | pass | switch [('table', 'true'), ('matrix', 'false'), ('graph', 'false')] · rows 10 |
| K0b the Network without a focus is the X · Y · Z overview: every species, every function, the traits the functions require; one line per drawn function link and per requirement, the plants' claim lines to those traits kept latent; no line for a missing link; the three axes are named and the recorded-only functions marked | pass | {'species': 10, 'ghost_species': 0, 'functions': 5, 'concepts': 11} · links 21 · requirements 17/17 · latent 43 |
| K1 Screen focus: the graph shows the function and its linked species only; the layers are offered, none is on; the inspector holds the function record | pass | {'species': 5, 'ghost_species': 0, 'functions': 1, 'concepts': 0} |
| K1b layers added on purpose: required traits and the species without a link (ghosts, no line) | pass | {'species': 5, 'ghost_species': 5, 'functions': 1, 'concepts': 4} |
| K1c the same focus in the matrix: its column is marked, one cell per species, and no other view is in the page | pass | column Screen |
| K1d the same focus in the table: the columns the function requires are marked and a linked species comes first | pass | required columns ['Height bands', 'Habit', 'Leaf retention'] · first row Acer palmatum |
| K2 link → evidence: inspector shows the use claim, the rule and the requirement check; the graph line is selected; the trace into a design is offered | pass | 61292 bytes |
| K3 unknown cell → honest 'not established': verdict, missing requirements, contrary claims | pass |  |
| K4 A/B compare (V1 link, tab=compare): the four sections in order; the pair's two live direct records and the retired history are listed | pass | ['shared_attributes', 'direct_relations', 'spatial_complementarity', 'evidence_unknowns'] |
| K5 A/B compare with no record: the absence is stated, not filled; nothing biological is inferred | pass |  |
| K6 pair in the graph (V1 link): both species, a typed relation line, no line from shared traits alone | pass |  |
| K7 species focus: its linked functions only; one knowledge group, the relation records and the functions without a link are added on request | pass | default {'species': 1, 'ghost_species': 0, 'functions': 3, 'concepts': 0} · expanded {'species': 7, 'ghost_species': 0, 'functions': 5, 'concepts': 13} · group y:environment has 13 concepts |
| K8 a V1 deep link to one attribute cell opens the graph with the cell's claims in the inspector and the way back to the species | pass | attr:plant:gaultheria-shallon:exposure |
| K9 one focus is shared: focusing a species in the table keeps the table and marks its row; switching to the matrix and the Network keeps the focus, marks it there and names it in the toolbar | pass | [('table', None, 'table'), ('table', 'species=plant:gaultheria-shallon', 'table'), ('matrix', 'species=plant:gaultheria-shallon', 'matrix'), ('graph', 'species=plant:gaultheria-shallon', 'graph')] |
| K10 Back and Forward restore the view and the focus step by step: Network → matrix → table with the focus → table without it → forward again; a filter is a step too | pass | [('matrix', 'species=plant:gaultheria-shallon', 'matrix'), ('table', 'species=plant:gaultheria-shallon', 'table'), ('table', None, 'table'), ('table', 'species=plant:gaultheria-shallon', 'table'), ('table', 'species=plant:gaultheria-shallon', 'table'), ('table', 'species=plant:gaultheria-shallon', 'table')] · q ['zzz', ''] |
| K11 the Trace action appears only with a species in context, opens the Decision Trace of that species, and for a function the engine does not arrange it says so and follows an arranged one | pass | [None, 'http://127.0.0.1:8769/platform/knowledge/trace/#species=gaultheria-shallon', 'http://127.0.0.1:8769/platform/knowledge/trace/#species=gaultheria-shallon', 'http://127.0.0.1:8769/platform/knowledge/trace/#species=gaultheria-shallon'] · http://127.0.0.1:8769/platform/knowledge/trace/#species=cercidiphyllum-japonicum |
| K12 a V3 trace address at the Knowledge address is sent on to the Decision Trace with its hash | pass | 54580 bytes |

## Counts

- 10 species · 27 facets · 230 attribute cells (40 not recorded · 27 with a source disagreement)
- 5 functions · 50 link cells: {'candidate': 9, 'unknown': 29, 'derived': 12} · 21 drawn · 4 with a conflict · unknown by verdict {'contradicted by traits': 26, 'evidence missing': 3} · verification {'none': 38, 'unverified': 9, 'verified': 3}
- 41 relation records: 19 live ({'co_listed': 15, 'competes': 1, 'layered_under': 2, 'companion': 1}, 3 model placeholders) · 22 retired
- 45 pairs · 17 with a live direct record · 44 with a complementarity hypothesis
- 501 claims cited ({'unverified': 463, 'verified': 38}) · AI evidence checks on 534 claims ({'partially_supported': 99, 'supported_by_source': 359, 'not_assessed': 38, 'conflicting_evidence': 5}) · 17 sources
