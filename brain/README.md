# brain/ — Knowledge Brain v3

**Live:** <https://kaiyankay.github.io/planting-db/brain/> · v2 at `/brain/v2/` · v1 at `/brain/v1/` · all served by GitHub Pages straight from this repository.

v3 visualises the **database as a system**, not a few plant records: what the survey and principles decided, the rules and methods that follow, the schema whose fields cross the plants to hold every claim, the sources those claims come from, and the construction steps that turned one into the other. Everything drawn is generated at load from the repository files by a graph projection layer (`js/projection.js`, documented in [`MAPPING.md`](MAPPING.md)). Nothing is written back; the validator is untouched.

## Run

```bash
cd planting-db && python3 -m http.server 8766
```

then <http://localhost:8766/brain/>. Serve the planting-db root: the page reads `../schema.json`, `../plants/*.json`, `../sources.json`, `../relations.json`, `../synonyms.json`, `../intent_map.json`, `../eval/queries.json` **and** `../methods.md`, `../principles.md`, `../HANDOFF.md`, `../README.md`. No build, no node; three.js and 3d-force-graph are vendored.

Files: `index.html` · `js/data.js` (JSON loader + `loadDocs()` for the Markdown) · `js/projection.js` (the graph) · `js/app3.js` (scene, views, panels, Grow, Ask) · `js/knowledge.js` (context parsing and value comparison, from v2) · `js/retrieve.js` (port of `tools/retrieve.py`) · `js/model.js` (colours, value summaries) · `MAPPING.md` · `screenshots/v3/` (14 captures, 2026-10-30).

## What you see

A single space read top to bottom like a section through the system:

| layer | drawn from | what the glyph says |
|---|---|---|
| **Foundations** | survey questions cited in `schema.json` (`survey`, `design_basis`) and the Markdown; HANDOFF decisions table; `principles.md` §1–§10 | tiles; focus one to see the structures and rules that cite it |
| **Rules & methods** | `schema.json rules` R1–R10; `methods.md` M1–M24 (dashed = to confirm, ✓ = confirmed) | focus a rule to see the data it governs, by a named predicate |
| **Schema × plants** | field tiers and fields (rows, with KPU vocabulary chips) × plant entities (columns); every plant × field is a **cell** | cell fill = a sourced claim exists, coloured by the dominant source type; **solid portion** = share verified; dashed outline = gap (brighter when a source is planned); red dot = values differ under the same stated condition; amber dot = values vary with conditions; magenta square = a candidate |
| relation arcs | `relations.json` between plant headers | bright = verified, dashed grey = model placeholder |
| **Sources** | `sources.json`, grouped practitioner / municipal / database / literature / model, local → global | solid = contributes claims; hollow = listed, planned, nothing yet; tier letter in the label |
| **Construction** (right) | seven steps with live counts from claim fields; T1–T7 from HANDOFF; tools from the README tree | done / partial / blocked / runs outside the browser |

Connections are drawn only when something is focused, coloured by type and styled by basis: **structural** (grey), **provenance** (cyan), **rule** (violet), **knowledge** (amber), **evolution** (magenta); solid = recorded in a file, dashed = derived by a named projection rule, dotted = candidate. The panel lists every connection with its evidence (file, field or predicate). In the System view one real provenance thread at a time lights up: source → cell → tier → rule, captioned.

Four readings are kept apart and never merged into one “completion”: **coverage** (cells with a sourced claim), **validation** (schema conformance by `tools/validate.py`, run outside the browser, not claimed live), **verification** (`status: verified`, deferred by D5) and **construction** (T1–T7).

## Entry points

Rail on the left: **System** (everything) · **Schema** (tiers, fields, which plants and claims each holds) · **Plants** (entities, cells, relations) · **Sources** (who contributes, licence tier, what is planned) · **Rules** (R1–R10, methods) · **Foundations** (survey → decisions → principles) · **Construction** (steps, tasks, tools) · **Grow** · **Ask**. Click any tile, label or cell to focus it; the trail at the top shows where you are; Esc or “Up” goes back; background click goes up.

Examples that work today: **R1** → 37 cells where several sources are kept side by side, plus the survey question c3 and method M15 that cite it. **Survey c1** → the gate fields it motivated, with the schema annotation quoted. **Oregon State** → 36 provenance links: 23 claims and the fields it was planned to fill. **Gaultheria shallon · mature height** → five sourced claims from four sources, the retired placeholder, the sources below and R1 / R3 / R10 above. **Extraction** → the four routes claims took, read from `recorded_by`, and the tools behind them.

## Grow and Ask

**Grow** turns a typed observation into a *candidate* claim inside the cell its plant and field name. "What changed" states the cell it joined, whether the cell was a gap, how it compares with each existing reading (`agrees`, `overlaps across conditions`, `below, under a different condition`…), whether its stated condition is new, and that it is unverified, not citable and never written to the db. Candidates live in this browser's `localStorage` (`brain.candidates.v1`, shared with v1/v2); "Reset session" removes them.

**Ask** runs the ported retriever and lights what a question activates: the plants that pass the gates, the cells and sources of the ranked claims, and the rules doing the work (R7 gates, R5 order, R6 attribution, R2 withheld). The banner says RETRIEVAL PREVIEW — NOT A FULL AI TRACE; no model composes an answer. Candidates are recalled and listed, never cited.

## v2 → v3: what changed

- **Object of the visualisation**: v2 explored knowledge from three plant clusters; v3 shows the database system, with the plants as three columns of one matrix.
- **Data model**: v2 built a plant → domain → field → lens model (`knowledge.js`); v3 adds `projection.js`, a typed graph of 426 nodes and ~1,340 links generated from JSON *and* the Markdown files (methods, decisions, principles, tasks), each link carrying its basis.
- **New content**: rules, methods, decisions, survey questions, construction steps, tools and vocabularies are now objects you can focus; rule → data, survey → structure and claim → step connections exist (recorded or derived by six documented rules).
- **Status**: coverage, validation, verification and construction progress are separate readings; verified share is drawn inside each cell rather than as a glow.
- **Interaction**: entry rail + trail + focus-and-dim instead of fly-through; progressive disclosure by mode (System shows layer titles, plants, tiers, rule ids and source groups only).
- **Kept from v2**: context parsing and value comparison (`knowledge.js`, M23–M24), retriever port, candidate detection and storage, projected HTML labels, bloom, 3d-force-graph as renderer. v2's evidence lenses (ruler by condition, spectrum) are not in v3; open v2 for them.
- **Removed**: the six knowledge domains (M22) as the organising unit; the plant clusters.

## Not done / limits

- Lenses for reading values by condition (v2) are not integrated; a cell focus lists its claims in the panel.
- Validation is reported as an offline step; the browser does not re-run the validator.
- The decisions table has 19 rows; only 6 carry ids (D1, D2, D5–D8). Unnumbered rows are shown as “decision” tiles — the rows exist, the ids do not.
- Rule → data links are derived predicates, one per rule, and so are the claim → step links from `recorded_by`; both are labelled derived and can be wrong where the text is unusual.
- Label collision is handled by mode and stagger, not by a layout algorithm; long names can still touch at narrow widths.
- No verification history exists in the repository, so none is shown.
