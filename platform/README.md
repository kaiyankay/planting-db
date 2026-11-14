# platform/ — the layer that makes the applications one product

Methods M65 · design system `DESIGN.md` · tests `tools/platform_tests.py` · build `tools/build_platform.py`.

| | |
|---|---|
| `js/platform.js` | routes for both layouts, species ids, the cross-module links, the read-only look at the Studio's saved project, the list of species to consider, the platform bar |
| `js/plantcard.js` | Plant Card, compact card, Plant Profile — rendered from the knowledge snapshot |
| `js/library.js` · `plants/` | the Plant Library (atlas and profiles, `#species=<slug>`) |
| `js/contribute.js` · `contribute/` | survey link, what the release holds from practitioners, coverage, gaps, conflicts, how a release is made |
| `js/how.js` · `how-it-works/` | the path from a source to a planted bed, and who or what decides at each step |
| `css/platform.css` | `--pi-*` tokens (DESIGN.md), the bar, tags, the compact card, and the pages above |
| `data/images.json` · `img/` | one photograph per species with author, licence and source; no plant fact |

The other modules load this layer: `design/index.html` + `design/js/app.js` (bar, considered species in Compose, profile links in
Compose and Grow, the saved view), `brain/explorer/` (bar, plant card in the species inspector), `brain/index.html` + `brain/js/app5.js`
(bar, plant card, `#species=<slug>`).

Run: serve the repository root (`python3 -m http.server 8766`) and open `/design/`, `/platform/plants/`, `/brain/explorer/`,
`/brain/`, `/platform/contribute/`. Build the published layout: `python3 -I tools/build_platform.py platform-preview`.

Nothing here writes to the knowledge base. A new plant, claim or photograph enters through the canonical files and the pipeline;
a photograph additionally needs its entry in `data/images.json` (the build refuses one without author, licence and source).
