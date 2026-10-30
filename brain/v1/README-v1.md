# brain/ — Neural Cosmos

A playable, read-only view of the Planting Intelligence claim store: three plants as three knowledge clusters, fields around each plant, claims and sources one click deeper. Everything drawn is a record in `plants/*.json`, `sources.json`, `relations.json` or `schema.json`, or something you typed this session. Nothing is written back.

## Run

No build, no node. Serve the **planting-db root** (the page reads `../plants/*.json` etc.) and open `/brain/`:

```bash
cd planting-db && python3 -m http.server 8766
```

then open <http://localhost:8766/brain/>. (In the Claude desktop app the `brain` entry in `.claude/launch.json` does the same.) Opening `index.html` from the file system does **not** work: ES modules and `fetch` need http.

Everything is vendored, so it runs offline: `vendor/3d-force-graph.min.js` (1.80.1, UMD, includes three.js r186) and `vendor/three/` (three 0.186.0 ESM + `UnrealBloomPass` and its three dependencies). The console warns "Multiple instances of Three.js being imported" — expected, see the research log.

Files: `index.html` (layout, styles, import map) · `js/data.js` (loader; which plants exist comes from `synonyms.json in_db`) · `js/model.js` (claims → nodes/links, value summaries) · `js/retrieve.js` (port of `tools/retrieve.py`) · `js/app.js` (cosmos, panels, candidates, retrieval lights) · `screenshots/`.

## What you see — visual encodings (all data-driven)

| element | drawn from | encoding |
|---|---|---|
| plant sphere (warm white, halo) | `plants/<id>.json entity` | one per plant; label = scientific name |
| field point | every schema field with ≥ 1 claim; gate and extended fields are drawn even when empty | **size** = number of sourced live claims · **brightness** = share of those claims with `status: verified` · **colour** = source type of the claim ranked first on that field by rule R5 |
| dashed faint ring | gate / extended field with no sourced claim (retired placeholders only, or nothing) | a gap; the panel lists the sources the fill_plan intended |
| claim point (visible when its field is open) | one per claim, including retired | **colour** = `source_type` · **size** = confidence · verified = solid sphere · unverified = small solid core inside a wire shell ("ringed") · retired / model = dim wire sphere · candidate = magenta |
| source point (visible when any of its claims is open) | `sources.json` | **colour** = type · **size** = number of claims it supports; shared between plants, so a source becomes a bridge between clusters |
| plant → field line | | faint warm |
| field → claim → source lines | | claim's source-type colour; dashed for model placeholders |
| curved plant–plant line | `relations.json` | colour = `source_type`; solid bright = verified; dashed grey = model placeholder; several relations on one pair curve apart (click each) |
| flowing particles | only during a question | the evidence path of claims the retrieval preview would cite |
| bloom | | only bright (active) knowledge glows; dimmed knowledge is below the bloom threshold |

Colour key: practitioner `#ffa94d` · database `#5ad1ff` · municipal `#6ff2b0` · literature `#b48cff` · model `#6d7384` · candidate `#ff5fb4`. The legend only lists the source types that actually occur in the store (tonight: practitioner, database, municipal — every T5 source is typed `database` in the claims, so `literature` is absent).

Click a plant → focus; click a field → open / close its claims (camera moves in, unrelated knowledge recedes to 7 % opacity); click a claim → full record in the panel (value JSON, context, source, licence tier, practitioner metadata, derivation, retirement, note) and its sibling claims on the same field; click a source → everything it says across the three plants, with a button to light all of it; click a curved link → the relation. Background click clears the focus. Every panel row carries the claim id.

## Which action leads to each C1 discovery

Nothing is pre-highlighted; these are reachable by exploring.

- **Salal shade tolerance (USDA "Low" vs the others)** — click *Gaultheria shallon* → the `exposure` field (bright blue, 4 sources). Four claims open around it: E-Flora (filtered / deep / part shade), RHS (deep shade, part shade), OSU (sun or part shade) and USDA PLANTS with only `Full sun`. Click the USDA point: its note says *Shade Tolerance: Low* contradicts RHS, OSU and E-Flora and was kept side by side at confidence 0.55. (The practitioner shade note in the store is on *Vaccinium ovatum*: open its `exposure` field for the survey-r03 claim derived from the designer's boxwood comparison.)
- ***Acer palmatum* `mature_height`** — click *Acer palmatum* → `mature_height` (a gate field; the panel says "values differ"). Six sourced claims plus one retired model placeholder: species ranges 3–7.6 m (MOBOT), 4–8 m (RHS), 4.5–7.6 m (OSU); 'Osakazuki' 2.5–4 m (RHS) against 6.1 m (GPP); 'Bloodgood' 2.5–4 m (RHS). The panel's span line reads "2.5–8 m across sources, kept side by side". The Vancouver measurements are next door: open `local_mature_size` for the CoV height-class midpoints and DBH per cultivar.
- **Gaps** — click *Acer palmatum*: the field list shows `ecological value · gate · no sourced claim` and `toxicity` as a dashed ring whose only claim is the retired ASPCA record (tier C, decision D1). Click *Vaccinium ovatum* or *Gaultheria shallon*: `local mature size` is a dashed ring — no CoV record exists for shrubs. Each gap row names the fill_plan sources that were meant to fill it.
- **The two shrubs** — look between the *Vaccinium* and *Gaultheria* clusters: three curved links. The solid orange one is the only verified relation (survey-r03 co-listed them, completeness L0, not citable). The blue one is E-Flora habitat overlap, unverified and derived from two `vancouver_context` claims (click it: `derived from` links to both). The dashed grey one is the `competes` model placeholder, still unverified, with four supporting claims listed.

## C2 — growth (candidates)

"Add observation" → type a sentence. The detector guesses the plant (synonyms.json names), the field (keyword table in `app.js FIELD_WORDS`), a numeric value (`60 cm` → `{max: 0.6, unit: m}` because of "under") and exposure words; you can override plant and field. Basis and location feed `practitioner_meta` the same way survey notes do (L0 / L1 / L2 completeness; always `citable: false`). The candidate becomes a magenta claim point that grows out of its field, linked to a "you (candidate)" source, with particles running plant → field → candidate → you. Its panel compares it with every sourced claim on the field: `within` / `below` / `above` / `overlaps` for ranges, `consistent` / `differs` for category lists, `closes a gap` when the field was empty. Candidates persist in this browser's `localStorage` only (`brain.candidates.v1`); "Reset session" clears them. No review workflow, nothing reaches the db.

Example that hits the OSU pair: *"salal in my North Van garden stays under 60 cm in full sun"* → `within` OSU's full-sun value (≤ 0.6 m) and `below` OSU's shade value (1.2–3 m), RHS, E-Flora and USDA.

## C3 — retrieval preview

"Ask" → the eight test queries from `eval/queries.json` (six e2, two c4; all still *proxy* text until T4 delivers the verbatim strings) or free text. `js/retrieve.js` is a line-for-line port of `tools/retrieve.py`: route 1 names, route 2 intent_map terms → gate checks per plant (pass / fail / unknown, M16a), route 3 BM25 over claim text (stand-in for an embedding model, M16); ranking strictly R5 (source type → geography → practitioner completeness → confidence), BM25 score decides recall only; attribution strings follow R6; L0 practitioner claims are listed as withheld (R2). The drawer prints the recognised routes, the gate table, the ranked claims with the rank key behind each one, and the withheld set. In the cosmos the candidate plants stay bright, excluded plants recede, the fields and sources of the ranked claims open, and particles flow along the paths of the claims that would be cited.

Differences from the Python: candidates from C2 are part of the BM25 corpus, so after adding one the same question shows a **Δ** line and a "Candidates recalled" group — flagged as unverified user input, never cited, ranked after every sourced claim.

The banner says **RETRIEVAL PREVIEW — NOT A FULL AI TRACE**. No model composes an answer here.

## Mechanisms borrowed (see `research/brain-research.md`)

| mechanism | from | where |
|---|---|---|
| camera fly-to on click | 3d-force-graph *click-to-focus* | `flyTo()` — adapted to approach along the line of sight and to track the moving node |
| collapsed tree, rebuilt visible subgraph on click | *expandable-nodes* | `visibleGraph()` / `S.expanded`, plus `spawnAt()` so children emerge from the parent |
| UnrealBloomPass on `postProcessingComposer()` | *bloom-effect* | `initGraph()`, strength 0.5 / radius 0.4 / threshold 0.38 |
| `graphData` re-set at runtime, `emitParticle` | *dynamic* + README | `addCandidate()` |
| own node / link objects, particles, forces | README API table | `nodeObject()`, `linkObject()`, `linkPositionUpdate()`, `applyFocus()` |

## Done / not done

Done: three clusters, fly / click / focus / expand / collapse; detail panels for plant, field, claim, source, relation; C1 discoveries reachable as above; C2 growth cycle with comparison and session persistence; C3 retrieval preview with Δ; bloom, fog depth, dimming, flowing evidence paths; screenshots in `screenshots/`.

Not done / known limits: labels overlap when many fields are open (no label collision handling); the detector for candidates is a keyword table, not a model — it will mis-field unusual sentences, override by hand; relation links do not carry particles (own curved line objects); the test-query buttons are proxy wordings until T4; retrieval is BM25, so a question with no shared words returns nothing (the Python has the same limit); no touch-screen tuning; there is no "source network" or "layering" view as separate modes — both are reachable inside this one space (click a source; look at the plant–plant links).
