# Platform V4 — system redesign and implementation (2026-11-15)

Brief: `AGENT_MASTER_PROMPT_V4.md`, `VISUAL_BRIEF_V4.pdf`, `TYPOGRAPHY_PREVIEW.html` (Kay, 2026-11-15). Method entry: M68.

| | |
|---|---|
| Branch | `feature/platform-v4-system-redesign` (from `feature/platform-integration` @ `65fd289`) |
| Preview | https://kaiyankay.github.io/planting-db/platform-v4-preview/ |
| V3 preview (unchanged, for comparison) | https://kaiyankay.github.io/planting-db/platform-preview/ |
| Not touched | `main`'s `/design/`, `/studio-preview/`, `/platform-preview/`; no merge into `main` |
| Knowledge | snapshot 2026-11-13, schema 0.4.3, 10 species, 501 claims — unchanged |

No plant record, claim, rule, gate, spacing factor or evaluation changed. No engine parameter was added.

## What changed, by surface

**Navigation and type (all pages).** Design · Plants · Knowledge · About. Bricolage Grotesque for headings, DM Sans for text
(scientific names in its italic), DM Mono for ids and provenance, as shared tokens. Specimen: `/about/typography/`.

**Design · Imagine.** The first viewport holds the bar, the headline, one instruction line, the composer with Address /
Dimensions / Photo or sketch, Start designing, two quiet secondary actions and the unchanged swaying hero. The stage stepper,
the statistics line, the caption and the "offline rules" tag left the landing; the stepper appears once the workflow starts,
and "read by offline rules" sits in each command bar.

**Design · Shape / Compose / Grow.**
- Panels are docked beside the plan instead of floating over it.
- Compose reads Function → Eligible plants → Arrangement; the Screen verdict is stated once in the inspector.
- Each bed opens on an **Objective panel**: Value → Function → Parameters → Metric → Unresolved. Privacy → Screen has target
  height, year-round and rows; Ground continuity → Ground Cover has pattern (grain, spacing, variation in step 3). Every
  control re-runs the engine and a note says what changed, or "Same result" and why.
- Ground Cover reads "estimate N %" only. Recorded-only functions (Scrim, Canopy, Barrier) get one line: no control, plant
  or figure.
- Grow's plant card answers Why selected / Why here / Does it work?, with the five steps in a disclosure and a link to the
  full trace.
- Uncertain candidates read "eligible (checks pending)". The eight outcome enums are unchanged.

**Preview versus generated (the V3 defect).** A generated version stores a fingerprint of its inputs; a preview is named by
the fingerprint of its inputs. Compose's link carries `pv=<fingerprint>`, Grow's `v=<version id>`, and the Decision Trace
reads exactly that case and says which. If a link's fingerprint no longer matches the saved design the page says "This
preview has changed" and shows the current preview.

**Plants.** One plate ground for all ten illustrations (CSS only, no image edited), equal cards, name search. The profile's
first viewport is plate, names, six quick attributes and actions; then four tabs — Design relevance, Growth & conditions,
Evidence & sources, Unknown & conflicting. A row is a summary that opens to its claims; ranges are listed per source and
never averaged.

**Knowledge.** The Explorer is the landing, opening on the Table. `Table | Matrix | Network` share one focus, one plant
filter and browser history. The Network without a focus is an X · Y · Z overview (plants, spatial functions, the 11 traits
functions require) drawing recorded lines only. Trace is an action that appears with a species in context. The Decision
Trace page keeps all its content under a compact head with a way back to the Explorer.

**About.** Project (the figures that left the hero), How it works (the engine re-run in the browser on the reference garden;
the rule table is rendered from the engine's own tables), Research & Method (the seven canonical steps, one claim carried
through), Contribute & Future (survey link, Contribution → Release path, now / recorded-only / research-direction table).

## Routes

| Address (preview) | Page | V1–V3 address that now redirects here |
|---|---|---|
| `/` | Design | |
| `/plants/` | Plants | |
| `/knowledge/` | Explorer | `/explore/`; `/knowledge/#species=…` is forwarded to the trace |
| `/knowledge/trace/` | Decision Trace | |
| `/knowledge/neural/` | 3D network | `/explore/neural/` |
| `/about/` · `/about/how-it-works/` · `/about/method/` · `/about/contribute/` | About | `/how-it-works/`, `/knowledge/method/`, `/knowledge/research/`, `/contribute/` |
| `/about/typography/` | Type specimen | |

## Tests

Run against the working tree served by `python3 -I tools/design_server.py` (port 8769 in this session), commit `da12c20`.

| Command | V3 baseline (`65fd289`) | V4 |
|---|---|---|
| `python3 -I tools/platform_tests.py --url http://127.0.0.1:8769` | 53 / 53 | 54 / 54 |
| `python3 -I tools/design_tests.py --url http://127.0.0.1:8769` | 199 / 199 | 199 / 199 |
| `python3 -I tools/spatial_tests.py --url http://127.0.0.1:8769` | 156 / 156 | 156 / 156 |
| `python3 -I tools/ux_tests.py --url http://127.0.0.1:8769` | 41 / 41 | 73 / 73 |
| `EXPLORER_URL=http://127.0.0.1:8769/brain/explorer/ python3 -I tools/explorer_tests.py --browser` | not validly baselined (see below) | 40 / 40 |

- The platform suite's checks were largely rewritten for V4 (navigation N1–N2, Explorer E1–E4, About AB1–AB8, profiles D1–D2,
  preview consistency J8–J11), so 54 is not 53 plus one.
- The explorer suite's browser checks were not baselined on V3: that run pointed at a port not serving the V3 copy.
- No failing checks. Not covered by a test: the Network's hover lighting; profile Back/Forward between tabs; phone widths
  for Plants and About.

## Walkthroughs

All on the 6 × 4 m demonstration garden: `<preview>/index.html?script=v4&fresh=1&stop=<key>`.

| Case | Stop keys | What it shows |
|---|---|---|
| Screen | `screen0` → `screenA` | Target height 1.8 m → 3 m. Checks and evaluation detail change; the plant objects do not, and the note says so. Covered edge 4.27 of 6 m, not met. |
| Ground Cover | `ground0` → `groundB` | Pattern changed: 19 → 26 plant objects, estimate 52 % → 81 %. No pass mark. |
| Exclusion / unknown | `cond` (`&light=shade` for the other case) | Light stated as full sun: *Gaultheria shallon* fails the height check, the Screen row drops to 0; water, soil and drainage stay unknown. |
| Recorded only | `recorded` | Scrim added to a bed: one line, no plants, no figure. |
| Preview consistency | `grow` → `stale` | A bed changed after generation: Compose shows `p-…` "differs from version 1", and its trace link reads that preview. |

## Screenshots

`brain/screenshots/platform-v4/`, each as `-1440x900.png` and `-1280x800.png`, captured in headless Chrome from the built
preview.

`00-before-v3-imagine` · `00-before-v3-compose` · `01-imagine` · `02-shape` · `03-compose-screen` ·
`03b-compose-screen-target-changed` · `04-compose-ground-cover` · `04b-compose-ground-cover-pattern-changed` ·
`04c-shape-condition-changed` · `05-grow-2d` · `06-grow-3d` · `07-preview-not-regenerated` · `08-library` ·
`09-profile-top` · `10-profile-evidence` · `11-knowledge-table` · `12-knowledge-matrix` · `13-knowledge-network` ·
`14-trace` · `15-about-method` · `16-about-how-it-works` · `17-about-contribute` · `18-about-project` ·
`19-typography-specimen`

## Known limitations

- **Two rows of Screen are never exercised.** The control is wired but disabled in the demonstration bed with the engine's
  reason (0.9 m deep, a second row needs 1.33 m).
- **Target height and year-round change checks, not plants, in the demonstration.** The note says so; a case where they
  change the planted row is not in the replay.
- **Typed changes get no "What changed" note.** Only the panel controls, arrangement options and condition selects do.
- **Versions from a manual edit or a partial regeneration carry no fingerprint**, so the Trace cannot say whether inputs
  changed after them.
- **Shape's direct manipulation is as in V3** (drag, accept / reject, undo); it was not redesigned.
- **At 1280 with a panel docked, the command bar is hidden** until the panel closes.
- **Network at 1280 with the inspector open:** the legend wraps to two rows and the longest attribute label is truncated.
- **The 3D network keeps its dark HUD**; only its bar and naming were aligned.
- **"Multimodal" (step 7) is not realised in the data:** the schema's media slot is empty, and the page says so.
- **Left out of About because it could not be verified:** survey question and response counts, survey findings, iNaturalist
  as a source of this release.
- **Light gate looks lenient:** stating shade or full sun passes the light check for all ten species in the open beds.
  Observed, not changed.
- Below 1280: no horizontal overflow in the UX suite's phone checks for the Studio; Plants, Knowledge and About were not
  reviewed at phone width.

## Review checklist

1. Imagine at 1440 × 900 and 1280 × 800: only the invitation; hero plants sway as before.
2. Start the example; the stepper appears; nothing overlaps the bar.
3. Compose, North bed: change the target height; read the change note.
4. Compose, East bed: change the pattern; the plan and the estimate change together.
5. Change a bed after generating; the preview line and the trace link name the same `p-…`.
6. Plants: ten plates on one ground; open a profile, open one height row.
7. Knowledge: focus a species in the Table, switch to Matrix and Network, press Back.
8. About · Research & Method: seven steps, names and order.

## Decisions for Kay

Agent proposals, none of them a human decision yet:

- The wording "eligible (checks pending)" / "provisionally eligible", "Privacy → Screen", "Ground continuity → Ground Cover".
- Table as Knowledge's default view; a focus-only link still opens the Network.
- Common name leading on plant cards and profiles (V3 led with the scientific name).
- The reference photograph moved from the profile's first viewport into Evidence & sources.
- The can / cannot lists on About · Project and the future directions on Contribute & Future.
- Whether V4 should replace `platform-preview/`, and merging the branch.
