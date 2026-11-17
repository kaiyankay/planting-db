# Platform V4.3 — visual intelligence and design representation (2026-11-17)

Internal report. Brief: Kay's V4.3 message of 2026-11-17. Method entry: `methods.md` M71. Not for a public page.

## 1. Branch, commits, preview

Branch `feature/platform-v4-3-visual-intelligence`, cut from `feature/platform-v4-2-ux-simplification` at `9e412f0`. Not merged.
Preview: `https://kaiyankay.github.io/planting-db/platform-v4-3-preview/` — a new generated folder on `main`; `/design/`,
`/studio-preview/`, `/platform-preview/`, `/platform-v4-preview/`, `/platform-v4-1-preview/`, `/platform-v4-2-preview/` are not touched.

No plant record, claim, source, verification, rule file or snapshot changed.

Commits (see `git log`): P0 engine and Shape fixes · Algorithm view · plant forms and specimen sheet · Knowledge marks ·
About and Research figures · type default, top bar, build · report and screenshots.

## 2. References studied (principles only; nothing copied)

- **Pollinator Pathmaker** (tool opened in a browser, a 10 × 10 m garden generated): the canvas is the whole subject on a pale ruled
  ground that runs past the garden; one small panel of three sliders; painted plants standing on the grid in 3D; almost no chrome.
  Its planting-plan sheet sits behind a terms-and-conditions agreement that was not accepted, so the plan view itself was **not seen**;
  the How-it-works page's plan figure and prose were read.
- **Kumu, Linkurious, QGIS, ArcGIS Experience Builder table widget, Observable Plot (read from the repository's docs; the site
  returned 429), D3 scale/shape, Datawrapper**: shared-scale range marks, one lane per statement, explicit ordinal domains with a
  separate "unknown", a uniform missing mark, fade-not-hide for path emphasis, name-only captions, a count badge for undisplayed
  relations, selection linking between table and picture, legend with text for every state.
- **daisyginsberg.com / Dezeen**: not opened in this round; the About figures follow the pacing seen on Pathmaker's How-it-works
  (image-led figures, short captions).
- SpeedTree, L-3D, three.js examples: not opened; the forms follow general principles (silhouette, branching order, leaf-mass
  clustering) with the existing three.js.

## 3. P0 audit (detail: `eval/v4-3-p0-audit-2026-11-17.md`)

| Item | Finding | Fix |
|---|---|---|
| 2.1 stale area | Bug. The Shape inspector printed the area stored on the layout proposal | Site, plantable and bed area are computed from the current outline (L-shape: 40.9 m² site · 33.9 m² plantable · 14.6 m² in 3 beds); an earlier outline's figure appears only on a line that names it so |
| 2.2 Screen 0 / 8.2 m | Bug. The trimmed corner adds a 1.7 m chamfer to the north edge that tapers to 0.25 m; `assemble()` took the shallowest stretch as the bed depth, so every Screen species failed | Depth is read per stretch: 7 Screen plants, 6.91 of 8.2 m covered, 31 plants instead of 24, no validation errors. The chamfer stays unplanted with the reason stated; the Screen still reads "not met" on continuity |
| 2.3 accent vs validation | Bug, reproduced on the audit mix (yarrow + kinnikinnick ground, seed 42). Accent positions were ground positions checked with the ground plant's radius | An accent keeps a position only if `placeable()` passes with its own radius: 16 kept, 2 refused, 0 validation errors |
| 2.4 light | V4.2 logic kept | Site conditions offer Filtered shade and Deep shade; fail / not enough evidence / conditional are worded apart; Compose shows a short reason beside a conditional; evidence standing under the light row of the Trace |

Existing gardens are unchanged (reference garden 41 plants; demo-a 41/38; demo-backyard 38/33/33).
Section 07: "Snap corners to 5 cm" switch, on by default; a bed an outline edit would leave under the minimum is named with its area,
and Apply stays disabled until the removal is ticked.

## 4. Algorithm view

Grow: `Plan | Algorithm | Presentation | 3D`, one version, one set of plant objects, one site model (`design/js/algoview.js`, a pure
function of project and version). Layers, one at a time: Species · Pattern · Crown cover · Gaps; guides off by default. Every mark
carries its plant object's id; a click selects the object, bed or gap in the existing inspector; the view is in the URL hash.
Crown cover uses the engine's own sample grid and its share equals the evaluation's; Gaps draws the evaluation's gaps as reported.
Species colours are fixed per species id (identity colours, not botanical), checked on all 45 pairs for colour-vision deficiency.

Replay: `?script=v43algo&fresh=1&stop=single|double|four-plan|four-algo|four-present|four-3d|patches|rhythm|lshape|gapcase`
(`&layer=species|pattern|crowns|gaps`, `&guides=1`, `&g3=1` for the 3D stop). Screenshots `algo-01` … `algo-15`.

## 5. Plant forms and 3D

`design/js/botanical.js`: one merged mesh per plant, seeded from the object id, sized from the object's height and crown radius,
shaped by recorded words (growth form, habit, texture, leaf retention, colour words). Tree (tiered / pyramidal / dome), shrub
(fanning, upright, mound), mat, herb (flat clusters or ray heads), fern. Softer light, grained ground, a 1.7 m scale figure, a lower
default camera, a one-line note that forms are illustrative and not a growth simulation. Labels scope unchanged.
Specimen sheet: `design/specimens.html` (preview: `/specimens.html`), the V4.2 proxy beside the new form for all ten species at one
scale; linked from nowhere in the interface. `?proxy=v42` on the Studio draws the old proxies.

## 6. Knowledge

Network: inspected line strongest, the focus's other records at 30 %, the rest under 10 %; words only on the inspected line;
a `+n` badge counts records not in the picture. Matrix: one legend, five marks (recorded use, inferred, conflict, no link ·
contradicted, no link · evidence missing). Table: visual sheet with a `Marks | Text` switch; renderers in
`brain/explorer/js/cells.js` — growth form, height and spread (one lane per source on a shared log scale, nothing averaged), flower
colour and flowering months (read from the seasonal claims), light, leaf retention, evidence, and one "not recorded" mark.

## 7. About and Research

`platform/js/figures.js`: the Project cover is one drawing on one ground line (salal illustration → nine of its record fields → its
function links and listed companions → the demo plan's 38 plant objects → an elevation of the same objects). Research & Method keeps
the seven names and order; each step has one figure from that step's real material. No map (the repository holds no coordinates);
the survey figure is counts of the published practitioner claims only — no private file was read.

## 8. Type and interface details

Variant B (wordmark and the Imagine headline in nct127) is the default of this preview; `?type=v4|a|c` compares, the switch mounts
only on a page opened with `?type=`. The snapshot date is out of the top bar; the preview footer no longer prints branch and commit.
Stepper measured at the CSS widths that 80 / 90 / 110 / 125 % zoom give a 1440 window (1800, 1600, 1309, 1152).

## 9. Tests

See §9 table in the hand-off message and `eval/*-tests-2026-11-17.md`; all five suites were run after the last code change.

## 10. Not done, not verified, risks

- Real-GPU appearance and frame rate of the 3D forms; picking on ferns and herbs; headless captures only.
- Zoom was measured as equivalent CSS widths in headless Chrome, not by zooming a real Chrome window.
- 390 px: not verified for the new views. Algorithm view below 1000 px unchecked.
- Knowledge sheet scrolls sideways inside its frame at 1280 for the last two visual columns; 1024 not looked at.
- Research figures below 1100 px (stacked) not looked at.
- Pathmaker's plan sheet, daisyginsberg.com, Dezeen, SpeedTree, L-3D were not viewed.
- A tapering bed stretch is planted all-or-nothing; a refused accent position is dropped, not moved.
- Colour words do not separate flower, leaf and fruit; red-osier stems are neutral because no red is recorded.
- No Studio dark mode.

## 11. Human decisions (not shown on any public page)

1. **Type**: B is this preview's default as asked; final choice of A / B / C remains open.
2. **Light**: the precise words now exclude — Filtered shade fails yarrow and kinnikinnick; Deep shade fails seven species
   (Japanese maple, yarrow, kinnikinnick, katsura, Pacific dogwood, red-osier dogwood, blanketflower). "Shade, not sure which"
   excludes nothing. Is that the wanted consequence of offering the two words?
3. **Engine**: plant the deep-enough part of a tapering stretch? Does a chamfer within 50° of north belong to the north edge?
   Move a refused accent instead of dropping it?
4. **Algorithm view**: the ten identity colours; layer names; keys 1–4; a bed click opens the bed's results; crown cover drawn on
   the Screen bed too.
5. **3D**: word-to-shape conventions (Horizontal → tiered, Fine → flat cluster …); the scale figure in the garden; whether the
   specimen sheet is linked anywhere.
6. **Knowledge**: log scale for sizes; the swatch table; the two claim-derived columns; six default columns; dim levels;
   the header word "Height gate".
7. **About**: salal as the one followed species; the AI illustration inside the cover (labelled not evidence); place grouping in
   figure 1; "must-pass" wording in figure 4.
8. Merging, and whether V4.3 replaces earlier previews.
