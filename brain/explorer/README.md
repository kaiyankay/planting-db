# brain/explorer — Knowledge Explorer

**Local:** serve the repository root and open <http://localhost:8766/brain/explorer/> · in the platform it is **Knowledge → Explore** (`/explore/` in the published layout) · the earlier interfaces stay unchanged at `brain/` (v5, the Neural view), `brain/ontology-preview/` and `brain/xyz-preview/`.

Brief 2026-11-07 ("Plant Knowledge Explorer — Phase 1", after the desk crit); reorganised 2026-11-14 for Platform V2 (progressive disclosure). One selection state and **one working view at a time** over the **same ten-plant database**: a **Relationship graph** that grows only by the layers the reader adds, a **Spatial function matrix** (10 species × 5 functions), a GIS-style **Attribute table** and an **A / B comparison** in four separate sections, with the **Evidence inspector** as a contextual panel beside whichever view is open. The default entry is a **start screen** — search, the five functions, the ten species, three questions — never the whole graph. Nothing about the plants is written in the interface: it reads `brain/data/explorer.json`, the relational projection `tools/build_explorer.py` writes from `kg.json`, `xyz.json`, `relations.json`, `sources.json` and the AI assessments (methods M49). Graph, matrix and table are views of that one file, not separate stores.

**V4 (2026-11-15).** This page is now the **Knowledge** destination itself (`/knowledge/` in the published layout; `/explore/` redirects). What changed, and overrides the sections below where they differ:
- No start screen. Without a focus or a `v`, Knowledge opens on the **Table**. The toolbar carries the switch **Table | Matrix | Network** (`v=table|matrix|graph`; `network` is read as `graph`); **Compare** is a secondary action (`v=compare`), not a tab; **3D network** links to `brain/` with the focused species.
- One focus (`fk`, `fi`) is shared by the three views; a focus alone in the URL still opens the Network (V1–V3 links). Switching the view, focusing and filtering are history steps: Back / Forward restore view, focus and the plant filter (`q`, shared by Table and Matrix).
- The **Network without a focus is the X · Y · Z overview** (`model.js graphFor(null)`): X the species with their growth form, Z the five spatial functions (the ones the Studio's engine does not arrange are marked *recorded only*), Y the trait concepts a function requires. Lines are records only: drawn function links (X–Z), requirements (Z–Y) and the plants' claim lines to those traits (X–Y), which stay latent until a node is pointed at or focused by keyboard; a missing link is never drawn. The former `all` layer and the functions-only seed are gone.
- **Trace** appears in the toolbar when a species is in context (the focus, or the species of the inspected record) and opens the Decision Trace (`PI.links.trace`) for the inspected / focused function when the engine arranges it, otherwise for Screen, saying so.
- `?replay=focus:species=<id>;view:matrix;back;forward;q:<text>` is a test hook: it performs the steps and writes what the page showed after each into `<script id="replay-out">` (`tools/explorer_tests.py` K9–K11).
- Type: Bricolage Grotesque for headings, DM Sans for everything else (scientific names in DM Sans italic), DM Mono for ids and provenance only.

## V4.3 (2026-11-17): the data is drawn

Nothing in the projection changed; the same records are shown with marks instead of words where a mark reads faster.

- **Network.** Three strengths: the inspected line (full opacity, 3.8 px), the other records of the focus (30 %), the rest (< 10 %).
  Words stand on the drawing only on the inspected line (its class) and on a conflicting line; every other line is named by the
  legend, its tooltip and its accessible name. A lit node carries `+n`: the number of its drawn function links, claim lines and
  live plant-to-plant records that are not in the picture, counted from the records. Focusing the node opens them.
- **Matrix.** One mark per state, with its words in a legend that is always on screen (`#mkey`): recorded use (filled dot),
  inferred (dashed ring), conflict (diamond beside the cell), no link · contradicted (quiet bar), no link · evidence missing
  (empty dotted box). Every cell carries `data-k` with the state of its record.
- **Table.** Opens as a visual sheet: Light, Height, Spread, Leaf retention, Flower colour, Flowering months, after Growth form
  and Evidence. `Marks | Text` (address `tm=text`) switches every cell back to its recorded words. The renderers are in
  `js/cells.js`, pure functions of the model and one record:

  | Cell | Read from | Drawn |
  |---|---|---|
  | Growth form | `species.growth_form_label` | a glyph for Tree, Shrub, Herbaceous perennial, Fern, with the word; the record's own status word when it is not `supported` |
  | Height, Spread | the claims of the `height_class` / `spread_class` cell | one lane per source on a logarithmic scale shared by the column (axis in the head): a bar per stated range, a tick per single figure, a tick with an open tail for "up to", a thin line with a median dot for a street-tree inventory (10th–90th percentile class); lighter for a cultivar, dashed under a condition. The words are the smallest and largest stated figure. The inventory's highest class is not drawn (it is in the Inspector) |
  | Flower colour | `value.flower_colour` of the plant's `seasonal_interest` claims | each colour word with a swatch (an explicit word → colour table; any other word stays a word) and the number of sources; dashed swatch when only a cultivar claim states it |
  | Flowering months | `value.flowering_months` of the same claims | twelve cells, one strip per statement, only the named months filled. A source that names a season in words has no strip |
  | Light | the `exposure` cell | four fixed places, full sun → deep shade; an unrecorded place is a dot; a dashed ring when a second statement gives full sun only under a condition; an arch for Sheltered |
  | Leaf retention | the `evergreen` cell | filled leaf evergreen, outlined leaf deciduous, both when both are recorded |
  | Evidence (plant) | `species.claims`, the plant's cells | live claims and how many a person verified, as a bar and `verified/live`; the number of cells whose sources differ |
  | Evidence (cell) | the cell | a check (a claim verified by a person), crossed equals (sources differ), a wave (varies by condition). An AI source check is never shown as verification |
  | not recorded | no record | one dashed mark with the words, in every column |

  Flower colour and Flowering months are views of recorded claims, not new records: a click opens the plant's Colour cell, whose
  Inspector lists each source's flower colour and months. The Inspector of a size cell lists every statement. CSV export writes
  the statements, never a merged value. The stored column preference moved to `pi.kn.table.v43`.

## V4.2 (2026-11-16): one action, one focus

Nothing in the data or the model changed; what changed is what the page shows at each step. Every visual state is written by the renderers from the one page state (`S` in `js/app.js`), never toggled on an element.

- **Overview.** Plant ↔ function lines lead; requirement lines are the second layer (38 % stroke). The legend lists only the line types drawn.
- **Focus.** One hop stays at full strength; every other node falls to 26 % and every other line to 6 %, and all of them stay clickable and in the tab order.
- **A line.** The inspected line is the thickest and its two ends are marked (`.node.end`). The Inspector's first screen is relation → meaning → *Where the evidence stands* (relation, source claim, human verification, AI source check as four rows) → the claim that carries it → Plant Profile / trace. Rules, all claims, the requirement check and the ids are under **See source & rule**; the stored record is under **Advanced: raw record (JSON)**, closed.
- **Expand.** What a step adds fades in (220 ms; off under `prefers-reduced-motion`) and keeps a dashed amber ring until the next step (`S.fresh`); plants and functions do not move. An expansion past `Model.SAFE` says “Too many attributes (n)”, adds nothing, and highlights the groups to choose from.
- **A and B.** A is a ring, B a dashed square (shape as well as tone). With both set and nothing focused, what neither plant reaches steps back. No line joins the two without a record in `relations.json`.
- **Matrix.** The selected column, the A / B rows and the inspected cell keep their strength; other cells fall to 50 % (30 % when a filter excludes them) and stay buttons. `All cells | Linked | Conflicts | No link` (`mf=`). Each row has A / B buttons; with both set, a summary beside the matrix gives the two plants across the five functions in words and offers **Compare selected**.
- **Table.** An attribute table: pinned species column and header, 40 px rows, read-only. A cell shows one or two values in full and `+n values` in words, plus `sources differ` / `by condition`. **Columns** lists every attribute by group (`g=`, `hc=`; kept in `localStorage` as `pi.kn.table`); **Only selected** (`to=1`); header click sorts (`ts=`); **Export CSV**. A click marks the row and the column and opens the Record Inspector: each distinct value with source, scope, human verification and AI check. A cell without a record opens as *not recorded* (`ik=nr&ii=<species>~<facet>`). Arrow keys move, Home / End jump, Enter opens, Escape closes.
- **Inspector.** 400 px, 340 px up to 1320 px wide; from 1100 px down it slides over the view and closes with its button or Escape.

Address, added: `mf` matrix filter · `hc` hidden table columns · `ts` table sort · `to=1` only selected rows · `ik=nr`. Everything from V1–V4.1 still lands.

Replay steps, added (`?replay=`): `mf:<k>` · `tg:<group>` · `tc:<facet>` · `tsort:<facet>` · `tonly` · `ab:a=<id>` / `ab:b=<id>` · `cell:<tablewrap|mbody>=<row>,<col>` · `key:<KeyboardEvent.key>` · `collapse` · `close-insp`. Each step also records measured values (opacities, the selected line's width, which cell holds the keyboard).

## V4.1 (2026-11-16): the Network as an evidence explorer

Knowledge now opens on the **Network**; Matrix and Table are projections of the same selection, one click away. This is a trial default in the V4.1 preview, to confirm by Kay. The sections below describe the V4 behaviour that still holds; where they differ, this section wins.

- **Overview.** X plants · Z spatial functions · Y the traits a function requires. Claim lines stay latent until a node is pointed at.
- **Focus.** Clicking a node keeps the three columns. What a record joins to the focus is lit; the rest steps back as context. The Inspector opens docked on the right with linked / missing / conflict counts and the next actions.
- **Expand.** The reader switches edge classes on around the focus (`model.js` `explore`, `walk`), one or two hops:

  | key | class | records in this snapshot |
  |---|---|---|
  | `use` | recorded use (function link, status derived) | 12 |
  | `inferred` | inferred by trait (function link, status candidate, KG-R4) | 9 |
  | `req` | requirement, function → trait (literature) | 17 lines to 11 traits |
  | `met`, a group id, `claims` | source claim lines, plant → attribute value: only to required traits, one knowledge group, or all | 361 |
  | `rel` | live plant-to-plant record (`relations.json`) | 19 |
  | `gaps` | not a line: marks the nodes with no link to the focus | n/a |

  A function link with status `documented` does not occur in this snapshot. Rules of the walk: it never returns to the focus's own kind through a shared node (two plants linked to one function are not thereby related; only `rel` joins plants); a requirement is read from the function to its trait; around a plant, the claim lines are its own.
- **Safe threshold.** `Model.SAFE = 24` attribute nodes. An expansion that would pass it is not applied: the count is shown with the knowledge groups to narrow it to.
- **Lines.** Recorded use solid, inferred dashed, conflict dash-dot, requirement dotted, claim line thin; a lit line carries its class in words. A missing link is a dashed ring on the node with its reason, never a line.
- **Line click.** A function link shows relation, rule, human verification and the AI source check apart, the claims with their sources, and links to the Plant Profile and the Design Trace. A requirement line (`ik=req`) shows the literature the ontology cites.
- **Compare.** `Compare with…` in a plant's Inspector. The pair stays marked in the Network (A / B), the Matrix and the Table. The comparison adds a function-evidence table and keeps *unknown* and *in conflict* apart.
- **Collapse / Reset.** Collapse returns to the first-order records of the focus; Reset to the overview.

URL hash (all optional; V1–V4 links still land):

```
v      graph (default) | matrix | table | compare
fk fi  focus kind and id          a b    the compared species
e      edge classes switched on (whole set; `none`; absent = default of the focus kind)
h      2 = two hops               only   1 = hide what the walk did not reach
ik ii  inspected record: link · attr · concept_link · relation · req · species · function · concept
q      species filter             g      knowledge groups shown in the table
x      V1–V4 layers (traits · gaps · relations · group id): read, added to the default
```

Test hook: `?replay=focus:<kind>=<id>;e:<class>;hops:2;only;inspect:<kind>=<id>;cmp:<species id>;view:<v>;back;forward;q:<text>;reset`. The three acceptance journeys are K13 (A), K14 (B) and K15 (C) in `tools/explorer_tests.py`. The choice of own SVG over a graph library is argued in `eval/v4-1-knowledge-graph-choice-2026-11-16.md`.

## Run

```bash
cd planting-db && python3 -m http.server 8766          # serve the repository root (launch.json entry "brain")
python3 -I tools/pipeline.py                            # after any data change: ontology → graph → kg → xyz → explorer → validate
python3 -I tools/explorer_tests.py [--browser]          # Tests A–J on the projection (K drives headless Chrome) -> eval/explorer-tests-<date>.md
```

then <http://localhost:8766/brain/explorer/>. `?data=<path>` points the page at another projection file. The URL hash carries the state, so any view can be shared or screenshotted:

| key | meaning |
|---|---|
| `fk`, `fi` | the focus: `species` · `function` · `concept` (`fi` = its id) or `pair` (with `a` and `b`) |
| `a`, `b` | the two species of the comparison |
| `ik`, `ii` | the inspected record: `link` · `attr` · `concept_link` · `relation` · `species` · `function` · `concept` |
| `v` | the working view: `graph` · `matrix` · `table` · `compare`. Without `v`, a focus opens the graph, `tab=compare` (the V1 inspector tab) opens the comparison, a lone `ik=attr` / `ik=link` opens the table / the matrix, and an empty hash opens the start screen — every V1 link lands where it did |
| `x` | layers added to the graph, comma-separated: `traits` · `gaps` · `relations` · `all` · a knowledge-group id (below) |

Files: `index.html` (layout, styles over the platform tokens of `platform/css/platform.css`) · `js/model.js` (loader, indexes, `graphFor(focus, a, b, x)` and `layersFor(focus)`, search) · `js/app.js` (state, URL, start screen, the four renderers, inspector) · no library, SVG graph placed by rule on rings around the focus (a small force layout only for a pair) · screenshots in `../screenshots/platform-v2/explorer-*.png` (V1: `../screenshots/explorer/`).

## The projection (`brain/data/explorer.json`)

Storage stays where it is (`plants/*.json`, `relations.json`, `ontology.json`); the "attribute table" is a **view**. Logical collections, every record naming the kg.json / xyz.json ids and claims it stands for:

| collection | what | count (2026-11-07) |
|---|---|---|
| `species` | identity from the entity records: names, family, genus, KPU type, origin, growth form (M29 vote + evidence), claim counts | 10 |
| `facets` | the attribute columns: every ontology facet the claims reach, with its knowledge group and policy (node / attribute, from `build_xyz`) | 27 |
| `attributes` | one cell per (species, facet) with ≥ 1 live claim or entity record; **every distinct value kept** with its claims, sources, conditions, cultivar, verification; `disagreement` = kg.json conflict on that cell; a missing cell = *not recorded* | 230 (40 not recorded, 27 with a disagreement) |
| `functions` | the five spatial functions (Ceiling / Canopy · Ground Cover · Screen · Scrim · Barrier) with their literature requirements (required / preferred, alternatives) | 5 |
| `function_links` | **exactly species × functions** cells: status · conflict · verification kept apart; use claims, rule, full requirement check; unknown cells carry their verdict (*evidence missing* vs *contradicted by traits*) | 50: derived 12 · candidate 9 · unknown 29 (26 contradicted, 3 missing) · 4 conflicts |
| `concept_links` | the plant → concept lines of xyz (why a plant meets a requirement) | 361 |
| `relations` | every `relations.json` record, retired ones as history (never live, never drawn), placeholders flagged, dangling claim references listed as `missing_claims` | 41 (19 live · 22 retired) |
| `pairs` | the 45 unordered pairs: shared concepts by area (kg `plant_pairs`), attribute overlap per facet, live and retired direct records, complementarity hypotheses (distinct functions the two plants' live links allow) | 45 (17 with a live record) |
| `claims` · `sources` · `rules` · `evidence_checks` | the evidence layer: claims copied from xyz (+ any a record names), the AI source assessments keyed by claim id | 501 claims · 17 sources · 534 checks |

**Three statements on every record, never merged:** `status` (documented · derived · candidate · unknown — what kind of knowledge a link is), `verification` (verified only when a human verified a supporting claim; 38 of 501 claims are), and the **AI evidence check** (supported / partially supported / conflicting — an assessment by the review pipeline, never a verification; 38 verified claims were not queued and read *not assessed*).

## Start, the four views, the inspector

- **Start** (no focus, no `v`) — the search (species, functions, the concepts a plant reaches; `/` focuses it), then three ways in: the five spatial functions with their definition and linked · unknown counts, the ten species, and three questions that open a view (where sources disagree → Table; which links are stated, inferred or unknown → Matrix; what two plants share and what is recorded between them → Compare). The full graph is one explicit link away, never the default.
- **Graph** — expanded on purpose. No focus: the five functions only (`x=all` adds every species and the 21 drawn links). A **function**: the function and the species linked to it (dashed olive = derived from a recorded use, dashed caramel = candidate inferred by KG-R4, rust = a conflict); *Required traits* (`traits`) adds the traits it requires and the linked species' claim lines to them, *Species without a link* (`gaps`) adds the unknown species as hollow ghosts in a row underneath, with **no edge**. A **species**: its linked functions; one toggle per knowledge group adds its trait concepts of that group (`x=<group id>`, or `traits` for all), *Plant-to-plant records* (`relations`) its live `relations.json` records (ink, typed), *Functions without a link* (`gaps`) the unknown functions as ghosts. A **concept**: the species that reach it and the functions requiring it. **Pair**: A and B, the concepts both reach, the functions of each and any direct record — a line joins the two plants only where a relation was recorded. Around a focus the nodes stand on rings placed by rule, so a selection always gives the same picture. Node → focus; line → evidence.
- **Matrix** — rows species, columns the five functions; a cell reads *use* (derived, KG-R1) · *traits* (candidate, KG-R4) · *contradicted* · *no evidence*, with *conflict* and *✓n* verified use claims; the legend stands under the table. Column header → focus the function; row header → focus the species; cell → the evidence. Blank is never read as unsuitable.
- **Table** — identity columns (toggle), then one column per facet grouped by knowledge group (toggle groups, filter species, sort by a column). A cell lists every distinct value with its claim count (`·c` = stated conditions), ✓ when a value is verified, *disagree n* when sources disagree, *by condition* when a variation is recorded; *not recorded* is written where no claim exists. With a function focused, the columns it requires are marked and the linked species sort first. Cell → every claim behind every value.
- **Compare A / B** — a primary view; four sections kept apart: **Shared attributes** (facet by facet: shared concept, A-only, B-only, not recorded, disagreement — "a computable overlap, not companion-planting evidence"), **Direct recorded relationships** (live `relations.json` records, or *None recorded — an honest absence*; retired records folded as history), **Potential spatial complementarity** (distinct function combinations from the two plants' live links, labelled layering / arrangement *hypotheses*; shared functions named as alternatives, not complements), **Evidence and unknowns** (claims, sources, AI checks, unknown functions, facets not recorded, disagreements, and whether anything is recorded about how the two plants behave with each other — nothing biological is inferred from the other three sections).
- **Evidence inspector** — a panel on the right, open when something is focused or inspected, closed with its button or `Esc` (a second `Esc` clears the focus). The name of the record first, then its kind, then status · verification · AI check as three separate statements: link (use claims with their AI check, rule text, requirement check with met / unmet / unknown and the contrary claims; for Screen a link *Trace this into a design* to the Knowledge overview), attribute cell, concept link, relation record, species (with the platform's shared plant card), function, concept.

One state drives everything: focusing **Screen** draws its graph, marks the matrix column, marks the table's required columns and sorts the linked species first — whichever of these is open, and switching the view keeps the selection; clicking a matrix cell opens its evidence, and the same line is selected when the graph is opened; setting A and B fills the comparison and rings the two species wherever they appear.

Refinements after the 2026-11-14 critique (V3): a focus or view change is a step in the browser history (Back returns to the previous
focus or view inside the Explorer; opening a record or a layer is not a step), a crumb before the focus leads back to the previous
focus, and the layers opened around a record are kept for when the focus returns to it. In the graph the focus is the darkest mark
with a ring, inner rings are turned into the gaps between the lines to the outer rings, a name stands on the far side of its node,
and a key on the canvas lists only the line styles that are drawn (conflict in rust included). Closing the evidence panel keeps the
drawing where it was and leaves a *Show evidence* button. A link's standing is said in words: *no link: contradicted by a recorded
trait* / *no link: evidence missing*, *unverified · 1 claim*, *no claim to verify*; counts read "N without a link". The matrix keeps
all five functions on screen beside the open panel at 1280 px (common name under the scientific name, sticky species column). The
table hides the identity columns by default, tints the focused row, and marks the row and column header of the selected cell. In
the comparison A is solid olive and B an ink outline: caramel stays the mark of candidate and unverified.

## What is never done here

No value is averaged or picked as 'best'. No plant-to-plant line is drawn from shared traits (M43). No unknown function link is drawn. No candidate is promoted; no claim status changes; the AI assessment is shown beside, never instead of, verification. Retired relations are listed as history and never become live. The interface files name no plant, concept or function id (Test I).

## Tests (`tools/explorer_tests.py`)

A counts · B integrity · C evidence trace · D status / verification / AI check kept apart, nothing promoted, unknown never drawn · E matrix = xyz suited_for lines + gaps · F relations (retired = history) · G pairs (direct ids, shared ⊆ kg, hypotheses only from drawn links) · H table = xyz lines + plant attributes, every value kept, disagreement = kg conflicts · I interface names no id · J stats · K (`--browser`) headless Chrome, one view at a time: the start screen without a graph, the default and the expanded function graph, the same focus in the matrix and in the table, evidence with the trace link, the honest unknown, the comparison (also through the V1 `tab=compare` link), the pair graph, a species growing by group and by relation records, a V1 deep link to one attribute cell. 23 checks, 35 with the browser; report in `eval/explorer-tests-<date>.md`.
