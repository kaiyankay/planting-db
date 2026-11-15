# Platform tests — 2026-11-14

`python3 -I tools/platform_tests.py --url http://localhost:8766` · build of the working tree · knowledge snapshot 2026-11-13 · **42 / 42 passed**

| | check | detail |
|---|---|---|
| ok | A1 build: the projections come from one pipeline run and the build completes | _platform_test: 114 files, 15.3 MB — feature/platform-integration @ 2d7cf62+local changes · built 2026-11-14 · knowledge 2026-11-13 |
| ok | A2 one explorer.json in the build | ['data/explorer.json'] |
| ok | A3 every relative file a built page or module loads is inside the build | [] |
| ok | A4 explorer, graph and kg share one generation date | 2026-11-13 2026-11-13 2026-11-13 |
| ok | B1 the same species in the snapshot, the graph and the canonical plant files | 10 / 10 / 10 |
| ok | B2 every photograph belongs to a species of the snapshot and carries author, licence and source | all ten have a photograph |
| ok | B3 photograph licences are CC0, public domain, CC BY or CC BY-SA | ['CC BY 2.0', 'CC BY 2.5', 'CC BY 4.0', 'CC BY-SA 2.0', 'CC BY-SA 4.0'] |
| ok | C1 the photograph manifest holds presentation fields only | [] |
| ok | B4 every illustration belongs to a species of the snapshot, exists in the build, and the manifest says it is AI-generated artwork | all 10 have an illustration |
| ok | C3 the illustration manifest holds a file, its size and the lettering flag only, and no illustration carries lettering | ['file', 'height', 'lettering', 'width'] |
| ok | C2 no species name is written in the platform layer's code | [] |
| ok | H1 without a design the Library offers to start one and names no bed | Start a designNo design is in progress in this browser. Keep it on my list and it will be checked, bed by bed, once a design has beds. |
| ok | H2 without a design no way-back chip is shown |  |
| ok | D1 10 profiles: name in HTML, illustration plate said to be AI-generated, reference photograph with credit, sections, 27 attribute rows matching the snapshot, 5 function rows, Explorer and trace links | acer-palmatum: 'Acer palmatum' sections 10 rows 27 recorded 19/19 functions 5 ¦ achillea-millefolium: 'Achillea millefolium' sections 10 rows 27 recorded 25/25 functions 5 ¦ arctostaphylos-uva-ursi: 'Arctostaphylos uva-ursi' sections 10 rows 27 recorded 24/24 functions 5 ¦ cercidiphyllum-japonicum: 'Cercidiphyllum japonicum' sections 10 rows 27 recorded 21/21 functions 5 ¦ cornus-nuttallii: 'Cornus nuttallii' sections 10 rows 27 recorded 26/26 functions 5 ¦ cornus-sericea: 'Cornus sericea' secti |
| ok | D2 the atlas shows one card per species: its illustration, then the scientific and common name set in HTML, linking to its profile |  |
| ok | E1 the Explorer, opened on each species, shows the shared plant card with the link to its profile and the platform bar | acer-palmatum achillea-millefolium arctostaphylos-uva-ursi cercidiphyllum-japonicum cornus-nuttallii cornus-sericea gaillardia-aristata gaultheria-shallon polystichum-munitum vaccinium-ovatum |
| ok | E2 the Neural view carries the platform bar and names the same snapshot date | 340 concept neurons · 204 in use · 10 plants · 35 sources · 2314 synapses (claims) · 866 fibres |
| ok | N1 Design · Plants · Knowledge on every page; Overview · Explore · Research · Method inside Knowledge, the current one marked | /plants/ /knowledge/ /explore/ /knowledge/research/ /knowledge/method/ |
| ok | N2 the V1 addresses arrive in Research and Method | 'Knowledge from practice' · 'Who or what decides' |
| ok | K1 the overview follows one decision in five steps, on the recorded demonstration garden | 6 mN ↑the bedmature crown, from a claimed spreadscreened edgenot coveredexisting tree, canopy assumed     The decision being followed       7 plants of Gaultheria shallon stand as the Screen of North  |
| ok | K2 source excerpt, claim text and id, human verification and AI assessment of the traced link are the snapshot's own records | gaultheria-shallon:landscape_use:usdaplants01 |
| ok | K3 the eight kinds of statement are separate rows: source, claim, verification, AI assessment, rule, site, engine, evaluation | ['source', 'claim', 'verification', 'ai', 'rule', 'site', 'engine', 'engine', 'evaluation'] |
| ok | K4 every species is checked for the bed on the page, and the results equal the ones the Studio recorded | 10 species, identical |
| ok | K5 the evaluation is the engine's: the recorded verdict, re-measured on the page with the same result, and said not to be a verified performance | 5Design evaluationWhat the engine can establish, and what it cannot.The engine arranges the species that passed, then measures its own result on the model. It r |
| ok | K6 every species can be followed; one without a recorded use is shown as an explicit unknown, never with an invented source | acer-palmatum achillea-millefolium arctostaphylos-uva-ursi cercidiphyllum-japonicum cornus-nuttallii cornus-sericea gaillardia-aristata gaultheria-shallon polystichum-munitum vaccinium-ovatum |
| ok | R1 Research: the coverage grid has one square per species and field, and its counts are the snapshot's | 270 squares: 203 recorded, 27 in disagreement, 40 not recorded |
| ok | R2 Research links the survey and shows no respondent id, e-mail address, response text or private field |  |
| ok | R3 Method names the eight kinds of statement, every knowledge-graph rule of the release and the engine's heuristics | ['Source statement', 'Structured claim', 'Human verification', 'AI source assessment', 'Rule-derived relationship', 'Your site information', 'Engine output', 'Evaluation'] |
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
| ok | K7 with a design in this browser the overview offers to trace it in a bed of that design | #species=gaultheria-shallon&amp;case=mine&amp;bed=bed-1 |
| ok | K8 traced in the visitor's design: the bed is theirs, and the way on is that bed in Compose | 6 mN ↑the bedmature crown, from a claimed spreadscreened edgenot coveredexisting tree, canopy assumed     The decision being followed       7 plants of Gaulther |
| ok | K9 the link opens Compose on that bed with the species' evidence, which leads back to the trace | stage intent · evidence panel 899 chars |
