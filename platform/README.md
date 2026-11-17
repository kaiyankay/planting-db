# platform/ — the layer that makes the applications one product

Methods M65, M66, M67 · design system `DESIGN.md` · tests `tools/platform_tests.py` · build `tools/build_platform.py`.

Three destinations: **Design** (the Garden Studio, `design/`) · **Plants** (`plants/`) · **Knowledge** (`knowledge/`, with the
Explorer in `brain/explorer/` and the Neural view in `brain/`).

| | |
|---|---|
| `js/platform.js` | routes for both layouts, species ids, the cross-module links, the read-only look at the Studio's saved project, the list of species to consider, the platform bar and the Knowledge sub-navigation |
| `js/plantcard.js` | Plant Card, compact card, Plant Profile — rendered from the knowledge snapshot |
| `js/library.js` · `plants/` | the Plant Library (atlas and profiles, `#species=<slug>`) |
| `js/trace.js` | the Decision Trace (M67): the case of one bed (`caseOf` over objects the caller holds, `buildCase` over a saved project), the selection decision and its eight outcome words (`decide`, `OUTCOME`), the compact explanation (`why`, `whyHtml`), the eight kinds of statement, the plan and edge drawings. Reads the Studio's engine; holds no planting rule |
| `js/overview.js` · `knowledge/` | Knowledge · Overview: the full trace in five steps (`#fn=<function id>`, `#species=<slug>`, `&bed=<id>`, `&case=mine&bed=<id>&plant=<object id>`) |
| `js/about.js` · `css/about.css` · `about/` | About (V4): Project (`about/`), How it works (`about/how-it-works/`, the engine followed on `designs/demo-a.json`), Research & Method (`about/method/`, the seven steps with one claim carried through, coverage, kinds of statement, graph rules), Contribute & Future (`about/contribute/`), the type specimen (`about/typography/`). One module, the page named by `<body data-about>`; every figure is counted from the snapshot, every engine number is the engine's own constant |
| `css/platform.css` | `--pi-*` tokens (DESIGN.md), the bar, tags, the compact card, the ledger, and the pages above |
| `data/artwork.json` · `art/` | one illustration per species: AI-generated editorial artwork, not evidence; no plant fact |
| `data/images.json` · `img/` | one reference photograph per species with author, licence and source; no plant fact |

The other modules load this layer: `design/index.html` + `design/js/app.js` (bar, considered species in Compose with the
outcome words, "Why this plant here?" in Compose and Grow from `trace.js`, profile and trace links, the saved view, the
`?open=compose` link, the `?script=trace` replay of the three journeys), `brain/explorer/` (bar, plant card in the species
inspector, the link into the trace), `brain/index.html` + `brain/js/app5.js` (bar, plant card, `#species=<slug>`).

The Knowledge overview imports the Studio's own `design/js/knowledge.js`, `engine.js` and `geom.js` and reads
`designs/demo-a.json` (the Studio's recorded demonstration garden). It never writes a project.

Run: serve the repository root (`python3 -m http.server 8766`) and open `/design/`, `/platform/plants/`,
`/platform/knowledge/`, `/brain/explorer/`, `/brain/`. Build the published layout: `python3 -I tools/build_platform.py platform-preview`.

Nothing here writes to the knowledge base. A new plant, claim, illustration or photograph enters through the canonical files
and the pipeline; a photograph needs its entry in `data/images.json` (the build refuses one without author, licence and
source), an illustration its entry in `data/artwork.json` (the build refuses one that is not declared AI-generated or that
carries lettering).
