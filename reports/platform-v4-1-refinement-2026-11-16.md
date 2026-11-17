# Platform V4.1 — focused refinement (2026-11-16)

Brief: Kay's `AGENT_PROMPT_V4_1.md` and `VISUAL_DIRECTION.html`. Branch `feature/platform-v4-1-refinement`, cut from
`feature/platform-v4-system-redesign` at `e7555e1`. Not merged. Method entry: `methods.md` M69.

**No plant record, claim, rule, gate, operator, spacing factor or evaluation changed. No engine parameter was added.**

## Where it is

| | |
|---|---|
| Preview | `https://kaiyankay.github.io/planting-db/platform-v4-1-preview/` (a new folder; `/design/`, `/studio-preview/`, `/platform-preview/`, `/platform-v4-preview/` untouched) |
| Screenshots | `brain/screenshots/platform-v4-1/`, every name at 1440×900 and 1280×800 |
| Audits | `eval/v4-1-p0-numbers-2026-11-16.md`, `eval/v4-1-light-gate-audit-2026-11-16.md`, `eval/v4-1-knowledge-graph-choice-2026-11-16.md` |

## Commits

| Commit | Goal | Main paths |
|---|---|---|
| `fc1ffd1` | P0 audits | `eval/v4-1-p0-numbers-…`, `eval/v4-1-light-gate-audit-…` |
| `4288f4f` | Design: Compose hierarchy, Shape modes, version identity, double-row demo, 3D proxies | `design/js/app.js`, `design/js/model.js`, `design/js/garden3d.js`, `design/css/v4.css`, `platform/js/trace.js`, `tools/ux_tests.py` |
| `82d2a68` | Plants: cards, reference photo, quick facts | `platform/js/plantcard.js`, `platform/js/library.js`, `platform/css/platform.css` |
| `865a863` | Knowledge: Network-first explorer | `brain/explorer/js/app.js`, `brain/explorer/js/model.js`, `brain/explorer/index.html`, `tools/explorer_tests.py` |
| `1aa01e2` | About: computed How-it-works figure | `platform/js/about.js`, `platform/css/about.css` |
| `a88eefe` | Brand-type trial | `platform/fonts/`, `platform/css/type-trial.css`, `platform/js/typetrial.js`, `platform/about/type-trial/`, `platform/js/platform.js`, `tools/build_platform.py` |

## P0 audits

1. **Screen 4.27 m vs 4.39 m: two cases, not a bug.** Same engine, seed 42, snapshot 2026-11-13 and row plan (10 positions, 7
   planted). The Studio walkthrough (`script-v4`) has the tree at [1, 3]; About's Demo A (`designs/demo-a.json`, version `v-1144d`)
   has it at [1.5, 3] and a user-edited north bed, so a different three positions are dropped. Nothing was forced to agree. Compose
   now names its case (design id, preview fingerprint) in the objective's details; About names Demo A, its version, seed and
   snapshot under the figure and says it is not the Studio's guided example.
2. **Light gate: no logic error, nothing changed.** A species passes a stated light when any one claim records a matching label,
   and site `shade` accepts Deep shade, Filtered shade and Part sun/part shade. All ten species have a Part sun/part shade claim
   and a Full sun claim, so all ten pass. Missing claims are not treated as a pass, and the control does reach the gate. The audit
   lists all 48 exposure claims (47 unverified, one human-verified) and the thin passes, e.g. blanketflower passing shade on one
   claim against three sources that record full sun only.
3. **Version identity: one bug fixed.** A manual plant edit inherited its parent's input fingerprint and read as an untouched
   generated version. Every committed version now carries `objects_fp`; a typed edit, manual edit or partial regeneration is marked
   `derived` and carries no `input_fp`. Older files are read through their `edit_event`; nothing is rewritten.

## What changed

**Design.** Compose reads objective → result, then the wired controls, then what changed; basis, rule, case and fingerprint are
behind one disclosure. "Ground continuity" is now "Ground coverage". At 1280×800 the command bar stays beside a docked panel. A
change typed in the command bar gets a change note. Shape has two modes: choose a layout, then edit beds. Grow's three answers
show one sentence first. 3D shrubs take their footprint from the plan's crown circle and are labelled as proxies.

**New working demo — `?script=v41&fresh=1&stop=…`** (`shallow | choose | edit | proposed | deeper | single | double | panel | grow |
typed | manual`). `shallow` is the 6×4 m garden where the double row is disabled with the engine's reason (needs 1.33 m, has
0.9 m). The rest is an 8×6 m garden whose north bed a typed command deepens from 1.2 to 2.3 m. The engine then gives 9 plant
objects for a single row and 15 for a staggered double row, 6 of them inner-row plants in new positions. Changing the target
height on this bed moves no plant, and the panel says so.

**Plants.** Cards: illustration, common name, scientific name. Growth form and origin are in the hover/focus reveal, the new
Origin filter and the profile. `?card=3` adds a one-word growth form for comparison. The profile's first screen has "View
reference photo" (all ten species have a credited photo): photographer, licence, source, and a line that no claim is read from
it. Quick facts show a stated span with "sources differ" where sources disagree.

**Knowledge.** Opens on the Network. Focus keeps the three columns in place and docks an Inspector; Expand takes an edge class
and one or two hops; a line opens its relation, rule, claims, sources, human verification and AI check; Compare is opened from
a plant. A missing link is a dashed ring on the node with its reason, never a line. Line classes differ by stroke pattern as
well as colour. The state is in the URL and V1–V4 links still land.

| Edge class in the snapshot | Records |
|---|---|
| Recorded use | 12, of which 4 in conflict |
| Inferred by trait | 9 |
| Requirement | 17 lines to 11 traits |
| Source claim lines | 361 |
| Plant-to-plant records | 19 |

Journeys (append to the Knowledge address as `?replay=`; salal is `plant:gaultheria-shallon`):
- A `focus:function=z:screen;only;inspect:link=link:<salal>>z:screen`
- B `focus:species=<salal>;e:req;view:matrix;view:table;back;back`
- C `focus:species=<salal>;cmp:<other species id>;view:matrix;view:table;view:graph`

**About.** How it works opens with one figure computed in the browser on Demo A, in four views
(`?view=site|eligibility|arrangement|evaluation`, `&pattern=drifts|rhythm|patches`). Every count, metre and status is read from
`engine.js` / `trace.js` at load. The seven method steps, the survey entry and the release path are unchanged.

**Brand-type trial.** The supplied file's family name is `nct127`, Regular, weight class 500, 465 glyphs (Latin, Latin-1, Latin
Extended-A), kerning, no italic. Of the characters the site sets large it lacks only `→`, which falls back to Bricolage
Grotesque. It ships as a 17 KB WOFF2 whose outlines and metrics were compared glyph by glyph with the TTF. The file has no
designer, copyright or licence fields and its embedding flag reads "Preview & Print"; both are left as made, and the font is
used on Kay's stated authorship and permission. Variants: `?type=a` wordmark, `?type=b` wordmark + Imagine headline, `?type=c`
wordmark + main page titles; `?type=v4` leaves the trial. Without the parameter no page loads the font. Comparison page:
`about/type-trial/`. Agent reading: B.

## Tests

| Suite | V4 | V4.1 |
|---|---|---|
| platform | 54/54 | 61/61 |
| design | 199/199 | 199/199 |
| spatial | 156/156 | 156/156 |
| ux | 73/73 | 102/102 |
| explorer (with browser checks) | 40/40 | 51/51 |

Reports: `eval/*-tests-2026-11-16.md`. The suites were run one after another against the working tree before the commits above.

## Known limits

- The 3D view of the `?script=v41` garden could not be captured headless after the proxy was tuned; the 3D screenshot is of the
  `?script=v4` garden, where the same proxy renders.
- Partial regeneration through Grow's "update the planting" card has no browser test of the new `derived` mark.
- The Trace page's case line (`platform/js/overview.js`) does not yet show the `derived` mark.
- The double-row case exists only as a replay; there is no saved `designs/` file for it.
- Shape's direct manipulation (drag, undo, accept/reject) is otherwise as in V4.
- Knowledge at about 430 px: the Network works by pan and zoom but labels clip. With plant records on at two hops the picture is
  dense. The pair graph still uses the old force layout. The 3D view's switch still lists the views in the V4 order.
- Knowledge hover, pan and zoom were checked by scripted replay and screenshots, not by hand.
- About at 390 px was not verified (the headless capture was clipped). How it works switches only the ground-layer pattern of
  one bed; the evaluation view always shows the saved version.
- Plants: Size is the span of what sources state, including cultivar-scoped claims, so it can look wide. The hover reveal is not
  available on touch; origin is reached through the filter or the profile.
- Type trial: variant C was checked on About, Plants and Knowledge titles; panel and card headings were deliberately left in
  Bricolage Grotesque.
- Step 7 of the method still has an empty media slot, as in V4.

## For Kay to decide

Agent proposals, none of them applied as decisions:

- Type variant A, B or C (agent reading: B), or none.
- Network as Knowledge's default; the expansion threshold of 24; recorded use drawn solid; the Table's two default groups.
- Two-line plant card or `?card=3`; whether the Origin filter row stays; the stated-span wording for Size.
- The label "Ground coverage"; hiding objectives while a layout is being chosen; the 3D shrub silhouette.
- Light gate: whether `shade` should keep accepting Part sun/part shade (narrowing fails 2 species; Deep shade only fails 7);
  whether a pass on one source against several should read as conditional.
- Shape says the Screen band is "deep enough for a row and a staggered second row" but proposes 0.9 or 1.2 m against the
  engine's 1.33 m: raise the band or reword the sentence.
- How it works: the view names, and "As saved" against a fresh engine run as the default arrangement.
- Whether V4.1 replaces the V4 preview, and merging.
