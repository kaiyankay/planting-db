# brain/ — Neural Cosmos v2

A living knowledge environment over the Planting Intelligence claim store. Three plants, each carrying six domains of knowledge; a domain unfolds into its fields; a field opens as an evidence *lens* laid out by what its values are. Everything drawn is a record in `plants/*.json`, `sources.json`, `relations.json` or `schema.json`, or something you typed this session. Nothing is written back.

v1 (October 30, first build) is kept unchanged at `v1/` for comparison — open `/brain/v1/`. Its own notes are `v1/README-v1.md` and `v1/WALKTHROUGH-v1.md`.

## Run

No build, no node. Serve the **planting-db root** (the page reads `../plants/*.json` etc.) and open `/brain/`:

```bash
cd planting-db && python3 -m http.server 8766
```

then <http://localhost:8766/brain/>. In the Claude desktop app the `brain` entry in `.claude/launch.json` does the same. Opening `index.html` from the file system does not work (ES modules and `fetch` need http). Everything is vendored (`vendor/3d-force-graph.min.js` 1.80.1 with three r186 inside; `vendor/three/` 0.186.0 ESM + `UnrealBloomPass`), so it runs offline. The console warns "Multiple instances of Three.js" — expected.

Files: `index.html` (layout, styles, import map) · `js/data.js` (loader; which plants exist comes from `synonyms.json in_db`) · `js/knowledge.js` (domains, context parsing, field status, suggestions, AI-use index) · `js/lens.js` (the five stage builders) · `js/retrieve.js` (port of `tools/retrieve.py`, unchanged from v1) · `js/model.js` (colours and value summaries, kept from v1) · `js/app.js` (cosmos, camera, view state, panels, Grow, Ask) · `screenshots/v2/` (13 real captures, 2026-10-30).

## Why v2

v1 drew the storage tree — plant → field → claim → source — as spheres, so every click descended one level and read the next layer of records. v2 organises the space by three processes instead:

- **Explore** — three information scales. The cosmos shows plants × knowledge domains (M22) with coverage, verification and tension in the glyph itself. A domain unfolds into its fields, each with a status word (M24). A field opens as a lens built for its value type: numeric ranges on a shared ruler with one *lane* per stated growing condition or cultivar (M23); vocabulary lists as a source × value spectrum; everything else as a note stack. A source can be the centre instead: one source across the three plants and six domains.
- **Grow** — an observation becomes a candidate that enters the lens of its field in the lane its stated condition puts it in, with a "what changed" list: which domain and field it joined, whether it opened a new condition lane or shares one, how it relates to every existing reading (`agrees`, `overlaps across conditions`, `below, under a different condition`…), whether it is the first Vancouver-scale reading, and that it is never citable. Candidates stay in this browser's `localStorage` (`brain.candidates.v1`, shared with v1).
- **Reveal** — any reading shows source → claim → context & applicability (cultivar / condition / region parsed from the context string) → status and confidence → related evidence with relation words → **AI use**: whether the retrieval preview cites it in the 8 test queries (computed live by running the ported retriever over `eval/queries.json`). "Ask" lights the plants and domains a question activates and opens any cited claim in its lens. The banner still says RETRIEVAL PREVIEW — NOT A FULL AI TRACE.

## Reading the cosmos

| element | drawn from | encoding |
|---|---|---|
| plant (warm sphere, halo) | `entity` | label = scientific name · sourced / verified counts |
| domain glyph | the schema fields of one domain (M22) | **arc length** = share of fields with a sourced claim · **inner glow** = share of those claims verified · **colour** = source type supplying most claims · **amber arc** = a field whose values vary with stated conditions · **red arc** = a field whose values differ under the same stated condition · magenta dot = a candidate lives here |
| spoke | plant → domain | faint; carries particles while a question is lit |
| curved plant–plant line | `relations.json` | colour = source type · bright = verified · dashed grey = model placeholder |
| field glyph (domain unfolded) | one field | size = sourced claims · glow = verified share · dashed ring = gap · amber / red arcs as above · status word under the name |
| ruler lens | numeric field | one bar per reading from min to max on a shared axis; a point for single values; `≤` bars for upper bounds; p10–p90 with a white median tick for City of Vancouver distributions; lanes headed by the stated condition (amber), cultivar (violet) or "condition not stated" |
| spectrum lens | list field | columns = vocabulary values in KPU order, rows = sources; a lit cell where the source lists that value; footer counts per value |
| note stack | object / text fields | one card per reading |
| source lens | one source | columns = plants, rows = domains, dots = fields it speaks to |
| reading state | `status` | solid = verified · hollow = unverified · dashed = retired placeholder (hidden by default, toggle in the panel) · magenta = candidate |

Colour key: practitioner `#ffa94d` · database `#5ad1ff` · municipal `#6ff2b0` · literature `#b48cff` · model `#6d7384` · candidate `#ff5fb4`. Labels are HTML projected onto the scene, so they stay crisp and clickable; the trail at the top shows where you are and takes you back; "Continue" in the panel lists next steps derived from the data (a condition split → the exposure field; cultivar lanes → the Vancouver measurements; the same field on another plant; a source to follow; a gap you could fill).

## The first case: *Gaultheria shallon* → mature height

Cosmos → *Gaultheria shallon* → Size & growth → `mature height`. The lens shows three lanes: **condition not stated** (E-Flora BC to 1.5 m occasionally 3, USDA PLANTS 1.8 m, RHS 1–1.5 m), **full sun, poor soil** (Oregon State ≤ 0.6 m) and **shade, good soil** (Oregon State 1.2–3 m). The panel sentence says the same in words and separates the two things going on: across lanes the values follow the stated condition (not a contradiction); within the "no condition" lane RHS and USDA do not overlap (a disagreement for a reviewer). Click Oregon State's ≤ 0.6 m: its row stays lit, the rest fade, and the panel shows the source, the raw context, status `unverified · awaits a reviewer (D5)`, and relation words to each sibling. "Continue" offers the `exposure` field (4 sources, where USDA's lone "Full sun" cell is the outlier on the ordinal vocabulary), the same question for *Vaccinium ovatum*, and following Oregon State through the store.

Nothing about this is hard-coded for Salal: the same lanes appear for *Acer palmatum* `mature height` (species / 'Bloodgood' / 'Osakazuki', where Great Plant Picks' 6.1 m point sits against RHS's 2.5–4 m bar) and for `local mature size` (City of Vancouver distributions per cultivar, with the established-tree subset as a second bar).

## Grow and Ask with the lens

"Add observation" → *salal in my North Van garden stays under 60 cm in full sun* → basis "observed on site", location "North Vancouver". The candidate enters `mature height` as a magenta ≤ 0.6 m bar in a new **full sun** lane (no source had stated "full sun" alone; Oregon State's lane is "full sun, poor soil"). The "What changed" block lists the lane, the relation to each reading (`overlaps across conditions` E-Flora and Oregon State's full-sun value, `below, under a different condition` the rest), that it is the first Vancouver-scale reading on the field, and that it is flagged, completeness L2, never citable. "Ask with it" runs *how tall does salal get in full sun*: the candidate is recalled, listed as unverified user input, and never cited (Δ line).

"Ask" runs `js/retrieve.js` (names → gates → BM25 recall → R5 order → R6 attribution; L0 practitioner claims withheld). In the cosmos the activated plants and domains stay bright and the rest recede; clicking an answer opens the claim in its lens with the cited readings lit. The eight query buttons are still proxy wordings until T4.

## What was kept, replaced, not done

**Kept from v1**: the db loader and read-only rule; the retriever port (unchanged); candidate detection, `practitioner_meta` completeness, localStorage; 3d-force-graph as renderer and controls; `UnrealBloomPass`; FogExp2; the camera fly (now `cameraPosition` to fitted points); source-type colours; the banner.

**Replaced**: the storage-tree node model (`model.js buildModel`) → `knowledge.js` (domains, lanes, status flags); force layout → deterministic positions (plants on a triangle, domains on a tilted ring), no drift; sphere-per-claim → lenses built per value type as three.js stages inside the same scene; canvas sprite labels → projected HTML labels; side-panel-per-node → panels that write a sentence about the evidence first; nothing → trail, "Continue" suggestions, AI-use index, "What changed".

**Not done / limits**: lenses are 2-D stages placed in the 3-D space (readability won over volumetric layout); the condition parser is a word list on the context string, so an unusual context may land in "condition not stated" — the raw context is always shown; the candidate field detector is still a keyword table (override in the form); the spectrum's "differ" rule follows PROPOSALS (a) and only applies to the five ordinal vocabularies; particles on relation arcs are not drawn (own curved lines); no label collision handling beyond lane spacing, so long source names can touch the plant glow when a drawer is open; no touch tuning; the "source network" of T7 is the source lens, not a separate mode; test queries are proxy text until T4.

## Mechanisms borrowed (see `../research/brain-research.md`)

click-to-focus → fitted `cameraPosition` on each view change; expandable-nodes → the stage key per view (a domain unfolds, a field opens; nothing is pre-expanded); bloom-effect → `UnrealBloomPass` at 0.45 / 0.4 / 0.4 on `postProcessingComposer()`; dynamic → `graphData` re-set + `nodeThreeObject` rebuild when a candidate arrives; README API → own node and link objects, `linkDirectionalParticles` on activated spokes.
