# Platform tests — 2026-11-14

`python3 -I tools/platform_tests.py --url http://localhost:8766` · build of the working tree · knowledge snapshot 2026-11-13 · **26 / 26 passed**

| | check | detail |
|---|---|---|
| ok | A1 build: the projections come from one pipeline run and the build completes | _platform_test: 97 files, 14.3 MB — feature/platform-integration @ fa12a03+local changes · built 2026-11-14 · knowledge 2026-11-13 |
| ok | A2 one explorer.json in the build | ['data/explorer.json'] |
| ok | A3 every relative file a built page or module loads is inside the build | [] |
| ok | A4 explorer, graph and kg share one generation date | 2026-11-13 2026-11-13 2026-11-13 |
| ok | B1 the same species in the snapshot, the graph and the canonical plant files | 10 / 10 / 10 |
| ok | B2 every photograph belongs to a species of the snapshot and carries author, licence and source | all ten have a photograph |
| ok | B3 photograph licences are CC0, public domain, CC BY or CC BY-SA | ['CC BY 2.0', 'CC BY 2.5', 'CC BY 4.0', 'CC BY-SA 2.0', 'CC BY-SA 4.0'] |
| ok | C1 the photograph manifest holds presentation fields only | [] |
| ok | C2 no species name is written in the platform layer's code | [] |
| ok | H1 without a design the Library offers to start one and names no bed | Start a designNo design is in progress in this browser. Keep it on my list and it will be checked, bed by bed, once a design has beds. |
| ok | H2 without a design no way-back chip is shown |  |
| ok | D1 10 profiles: name, sections, 27 attribute rows with the recorded ones matching the snapshot, 5 function rows, photo credit, Explorer link | acer-palmatum: 'Acer palmatum' sections 10 rows 27 recorded 19/19 functions 5 ¦ achillea-millefolium: 'Achillea millefolium' sections 10 rows 27 recorded 25/25 functions 5 ¦ arctostaphylos-uva-ursi: 'Arctostaphylos uva-ursi' sections 10 rows 27 recorded 24/24 functions 5 ¦ cercidiphyllum-japonicum: 'Cercidiphyllum japonicum' sections 10 rows 27 recorded 21/21 functions 5 ¦ cornus-nuttallii: 'Cornus nuttallii' sections 10 rows 27 recorded 26/26 functions 5 ¦ cornus-sericea: 'Cornus sericea' secti |
| ok | D2 the atlas shows one card per species, each linking to its profile |  |
| ok | E1 the Explorer, opened on each species, shows the shared plant card with the link to its profile and the platform bar | acer-palmatum achillea-millefolium arctostaphylos-uva-ursi cercidiphyllum-japonicum cornus-nuttallii cornus-sericea gaillardia-aristata gaultheria-shallon polystichum-munitum vaccinium-ovatum |
| ok | E2 the Neural view carries the platform bar and names the same snapshot date | 340 concept neurons · 204 in use · 10 plants · 35 sources · 2314 synapses (claims) · 866 fibres |
| ok | F1 the Studio replay ran to the end |  |
| ok | F2 Compose shows every considered species in every bed with that bed's check and a link to its profile | 12 rows in 4 beds |
| ok | F3 a real arrangement was chosen and Grow holds exactly the previewed plants | 31 plants, {'compared': 31, 'preview_count': 31, 'identical': True, 'what': 'bed, species, role and position of every plant object, Compose preview against this version'} |
| ok | F4 a planted object of the considered species is selected and its card links to the Library profile | {'id': 'plant-021', 'species': 'plant:gaultheria-shallon', 'bed': 'bed-2'} |
| ok | G1 a species that fails a bed's checks is marked not planted, with the reason, and cannot be added | Screen: a tree — the row operators arrange shrubs and perennials; there is no tree-placement rule; the row does not fit: crown radius 2.65 m needs 3.97 m of bed depth, the bed has 0.9 m |
| ok | G2 a considered species that qualifies can be added through the bed's own mix control, and is not added for the user | ['not planted', 'qualifies · uncertain', 'qualifies · uncertain', 'qualifies · uncertain'] |
| ok | G3 forcing a species that fails in every bed into two beds' mixes plants none of it, changes nothing else, and the beds are left as they were | {'beds': ['East bed', 'North bed'], 'mixes_named': ['plant:acer-palmatum'], 'plants': 31, 'planted_of_forced': 0, 'species': ['plant:gaultheria-shallon', 'plant:arctostaphylos-uva-ursi'], 'restored': True} |
| ok | F5 the Library knows the design: a way back to Grow, the species said to be considered and planted | 'Back to Grow' · 'Being considered for your designPlatform journey will show it in Compose with the check fo' · 'In your design Platform journey this species is planted. Back to Grow' |
| ok | F6 the Explorer offers the same way back |  |
| ok | F7 back in Design: Grow, the same view, the same plant selected | stage garden · mode present · card has plant-021: True |
| ok | F8 the garden is the one that was generated | 131 plants · 2 species · 4 beds |
