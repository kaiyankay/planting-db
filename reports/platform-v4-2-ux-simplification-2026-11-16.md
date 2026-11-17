# Platform V4.2 — UX simplification, interaction and evidence design (2026-11-16)

Internal report. Brief: Kay's V4.2 Implementation Kit. Method entry: `methods.md` M70.

## 1. Branch and commits

Branch `feature/platform-v4-2-ux-simplification`, cut from `feature/platform-v4-1-refinement` at `d322da1`. Not merged.

| Commit | Scope |
|---|---|
| `d964612` | Light check qualified; Trace names a derived version |
| `18efe7a` | Shape: outline editing, sketch → metres, clip preview, Screen depth offer |
| `de027a0` | Studio: stepper contract, 3D label scope, Grow inspector and Change menu, derived-version tests, `designs/demo-c.json` |
| `f5046ca` | Knowledge: focus dimming, marked expansion, matrix A/B, attribute table and record inspector |
| `8134a86` | Plants and About: filter tray, footer, Sources & data, How it works read modes, method cover |
| (docs) | This report, M70, test reports, screenshots; replay stops reset the page scroll |

Preview: `https://kaiyankay.github.io/planting-db/platform-v4-2-preview/` — `main` `ca88983`, 132 generated files in a new folder only.
`/design/`, `/studio-preview/`, `/platform-preview/`, `/platform-v4-preview/`, `/platform-v4-1-preview/` are untouched.

No plant record, claim, source, verification, rule file or snapshot changed (`brain/data/`, `plants/`, `sources.json`, `relations.json`, `ontology.json` have no diff).

## 2. Audit: existing capability → defect → files → tests

| Existing capability | Defect seen | Files touched | Regression tests |
|---|---|---|---|
| Stepper (rules spread over `journey.css` → `studio.css` → `v4.css`) | User screenshot: dots over labels ("1gine"). Not reproduced here on V4.1 at 1440×724, 1024, 820, 700 (headless and browser pane). Tests only read text, never boxes | `design/css/v42.css` (one contract), old rules deleted, `design/index.html` | ux: bounding boxes of every dot, label, neighbour at 1440, 1280, 1024, phone |
| Workspace layout | At 1024 px Compose/Grow fell to the stacked page, Generate ~7,900 px down | breakpoint 1080 → 1000 in the Studio stylesheets and three checks in `app.js` | ux: Compose reachability at 1280 and 1024 |
| `site.boundary` as a vertex ring, `clip.js` | No UI to edit it; sketch frame rectangular only | `design/js/boundary.js` (new), `concept.js`, `model.js`, `render.js`, `app.js` | spatial X1–X14 |
| Screen band text | Promised a staggered second row at 0.9 / 1.2 m; engine needs 1.33 m for salal | `spatial.js` (text only), offer in `boundary.js` | spatial X-section, ux |
| 3D `Names` | One sprite per plant: 77 overlapping labels | `garden3d.js`, `app.js` | ux: label counts per scope |
| Grow inspector, "Change it" | Results and edit links mixed; link list | `app.js`, `v42.css` | ux: inspector, menu, Escape |
| Derived versions | No browser test of typed / manual / partial; Trace headline silent | `app.js` replay, `platform/js/overview.js` | ux derived section; platform G1 |
| Light gate | Any one claim passes; `shade` accepts part shade; 30/30 pass | `design/js/knowledge.js`, one line in `engine.js` | engine page LG1–LG17, A3, A4 |
| Plants filters and footer | Three filter rows above the cards; statistics repeated | `library.js`, `plantcard.js`, `platform.css`, `platform.js` (`footHtml`) | platform D6, AB10 |
| Explorer state and SVG | Everything equally bright; table wide and unfocused | `brain/explorer/js/app.js`, `index.html` | explorer K20–K28 |
| About / How it works | Statistic cards lead; pattern switch showed a saved evaluation | `about.js`, `about.css`, `platform/about/data/` | platform AB9–AB11 |

CSS note: the stepper now lives only under `#top #stagenav` in `design/css/v42.css`, loaded last. Each step is a button with two non-shrinking flex items (a 22 px dot holding the number as text, and the whole label); no counter, pseudo-element or positioning over text. Compact mode (≤1240 px): only the current step is labelled; the others keep their names in `aria-label` and `title`.

## 3. What changed for the user

**Shape.** "Edit outline": drag corners, drag an edge dot to add one, delete (never below three), Trim corner, Notch corner, Undo/Redo inside the session, Cancel/Apply; keyboard nudge and a coordinate table. Works on a sketch without units (no length, area or count shown) and on a measured site; a sketch keeps its corners when a size is given. Refused with a reason: fewer than three corners, an outline that crosses or touches itself, almost no area, two corners on one spot, an existing tree left outside. If beds or zones are cut, a review lists each bed's area before and after; "Apply and clip" or "Keep editing". An existing planting is marked as made for the earlier outline.

**Screen depth.** Under a disabled "double", Compose shows the depth the engine's row plan needs for that bed and what a deeper bed would take (6 × 4 m garden: 1.33 m needed, 0.9 m present, bed 5.4 → 7.6 m²) with a preview; nothing is applied until the user applies it in Shape.

**Compose.** Order kept from V4.1; verdict no longer repeated in the status bar; fingerprint out of the read line. A link opens the 8 × 6 m double-row example (`?example=double-row&stage=intent`, `designs/demo-c.json`, written by the engine: seed 42, 51 plant objects).

**Grow.** Labels: Off / Hover / Selected (default) / Bed / Species; never one label per plant, no "all" mode. Inspector: one summary line, at most four evaluations, the plant card inside the inspector, folded sections for beds, plants, assumptions and sources. `Change…` menu: Edit this planting, Change the site, Say a change, Regenerate (shows what a new run would change, then confirms).

**Plants.** One line, search, `Filters` (tray, closed by default), one row of active chips. First row of cards inside 1440×900. One footer line with `Sources & data`. Profile size shows the smallest and largest stated value with their sources instead of a merged span.

**Knowledge.** Focus keeps one hop at full strength and drops other nodes to 26 % and other lines to 6 %. An expansion fades in and keeps a dashed ring until the next step. Past 24 attributes nothing is added and the groups to choose are highlighted. Line inspection: relation, source claim, human verification, AI source check as four rows; ids under "See source & rule"; raw record under "Advanced". Matrix: selected column and A/B rows strong, the rest 50 %; filters All / Linked / Conflicts / No link; pair summary. Table: pinned species column and header, 40 px rows, Columns panel (27 attributes by group), "+n values" in words, record inspector per cell, arrow keys.

**About.** Project opens with the thesis, two entries and one Knowledge → Design diagram. Figures, sources, verification, coverage and credits are on a new page, Sources & data. How it works: `As saved | Recomputed preview`; all four views read the same case (Clustered patches: 35 plant objects and East bed 67 % in both Arrangement and Evaluation; As saved: 38 and 52 %). Research & Method opens with a seven-step cover diagram carrying one real claim; an unverified claim is drawn dashed. Public pages carry no approvals, method numbers, commit ids or test figures.

**Trace.** The first line says when the version read is a partial regeneration, typed edit or manual edit, of which version, with a change summary; ids are under "Identifiers".

## 4. Light check: before and after

Open beds, light stated. Before: pass in all 30 cells. After: 19 pass, 11 conditional, 0 fail.

| Site light | Pass | Conditional |
|---|---|---|
| full sun | 9 | sword fern (variety-scoped claim, a conditioned claim, AI check conflicting) |
| part shade | 8 | yarrow, blanketflower (every supporting claim AI-partial) |
| shade | sword fern, evergreen huckleberry | the other 8 ("say which shade") |

Unknown, assumed and under-canopy rows are unchanged. No species is excluded by the new reading. A light result that is conditional on evidence alone cannot raise a species above one whose water or soil is unknown, so the reference garden generates the same 41 plants. Decision table and claim ids: `eval/v4-2-light-gate-2026-11-16.md`.

## 5. Replays

Studio (`/design/` in the repo, `/` in the preview):
- Stepper, Compose, Grow: `?script=v42&fresh=1&stop=shape|compose|grow|bed|plant|menu|regen`
- 3D labels: `?script=v42&fresh=1&g3=1&stop=labels&labels=off|hover|selected|bed|species`
- Outline: `?script=v42shape&fresh=1&stop=sketch|sketch-metric|rect|trim|review|pentagon|lshape|keepout|refused|generated|stale|depth|deepen`
- Single / double row: `?script=v41&fresh=1&stop=single|double`; saved example `?example=double-row&stage=intent`

Knowledge (`?replay=`; salal `plant:gaultheria-shallon`, yarrow `plant:achillea-millefolium`, katsura `plant:cercidiphyllum-japonicum`):
- A `focus:function=z:screen;inspect:link=link:<salal>>z:screen;focus:species=<salal>;back`
- B `focus:species=<salal>;e:y:environment;inspect:attr=attr:<salal>:exposure;view:table;view:matrix;back;tg:y:environment`
- C `focus:species=<yarrow>;cmp:<katsura>;view:matrix;view:table;back;forward;view:graph;focus:none=`
- D `focus:species=<salal>;e:y:maintenance_risk;only;e:claims;hops:2;e:y:maintenance_risk`

About: `about/how-it-works/?view=evaluation&mode=recomputed&pattern=patches` against `?view=evaluation`.

## 6. Tests

Run one after another on the integrated tree, before the commits; baseline re-run the same day on a V4.1 worktree.

| Suite | V4.1 (re-run) | V4.2 |
|---|---|---|
| platform | 61/61 | 66/66 |
| design | 199/199 | 216/216 |
| spatial | 156/156 | 187/187 |
| ux | 102/102 | 179/179 |
| explorer (browser) | 51/51 | 60/60 |

Reports: `eval/*-tests-2026-11-16-v4-2.md` (the V4.1 reports of the same date are kept). Three platform checks were adjusted to new markup (plant card inside the inspector; matrix class list); one V4 ux check (overview hidden while a plant is selected) was reversed on purpose.

## 7. Screenshots

`brain/screenshots/platform-v4-2/` at 1440×900, 1280×800, 1024×768; `before/` holds V4.1 at 1440, 1024, 390 where the headless browser could capture it. Kit screenshot → after: 01 → `03`–`08`; 02 → `02-stepper-shape`; 03 → `17`, `18`; 04 → `15`, `16`; 05 → `42`–`45`; 06 / 07 → `20`; 08 → `31`–`34`; 09 → `35`; 10 → `36`; 11 → `40`, `41`; 12 → `46`.

## 8. Not done, not verified, risks

- **Stepper cause unknown.** The overlap in the user's screenshot was not reproduced on V4.1. The rebuild removes every mechanism that could put a dot over a label, but the original cause in that browser session is not identified; it needs a look in the user's own Chrome on the V4.2 preview.
- **390 px.** Headless Chrome clamps the window near 500 px and returned blank Studio captures; phone width is covered by measurement checks and browser-pane checks of Plants, a profile and About only. Knowledge and the outline editor are unverified at phone width.
- **3D label screenshots** depend on a headless WebGL capture that came out offset before a scroll fix; behaviour is asserted on the DOM at 1440 only.
- **Outline editing:** no boundary holes (courtyards); no site-level Redo of an applied outline (Undo works); the deepen offer was run on the 6 × 4 m case only; not re-checked at 1024 after the workspace breakpoint moved.
- **Knowledge table:** no drag resize or reorder of columns (show/hide, groups, sort exist). Matrix arrow keys untested. The pair graph keeps the old force layout; the 3D view's switch keeps the V4 order. Journey A's Trace hand-off is checked as a link, not followed and returned from.
- **Grow:** the Change menu closes on Escape or outside click, not on browser Back; Plan and Presentation have no label scope. Compose's "in window" check allows 12 px at the bottom.
- **How it works:** no single/double Screen switch (Demo A's bed is too shallow; the reason is printed). Diagrams scroll sideways inside their frame below about 900 px.
- **Compose** shows "site gate conditional" on its chip; the reason is in the row detail. Evidence standing (verification and AI-check counts) is returned by the gate but not yet displayed.
- `designs/demo-a.json` still carries the old Screen band sentence in its recorded basis text.
- The top-bar snapshot chip ("knowledge 2026-11-13") still shows on wide screens.
- New project is not offered in the top bar below 760 px.

## 9. Human decisions (not shown on any public page)

Agent proposals; none is applied as a decision.

1. **Type.** A / B / C trial kept (`?type=`), default still the V4 system; B remains the candidate.
2. **Light check.** (a) Should `shade` exclude plants that record only Part sun/part shade (would exclude yarrow and kinnikinnick)? (b) Should a qualified match ever exclude (sword fern in full sun)? (c) Should AI "partially supported" stay a qualifier (alone it decides 2 of 11 conditional cells)? (d) Should the Site page offer filtered shade and deep shade (the gate already reads them; not added to the UI because it is new vocabulary)? (e) Same qualification for water and soil?
3. **Shape.** 5 cm snap; a clipped confirmed bed becomes "user-edited"; a bed left under the minimum size is removed (Undo restores); suggested beds are re-proposed rather than clipped; the tool name "Edit outline"; wording of the Screen band and the deepen offer.
4. **Studio.** Compact stepper from 1240 px; workspace layout from 1001 px; Selected as the default label scope; plant card below the summary; the four menu wordings; placement of the example link.
5. **Knowledge.** Dim levels (26 % nodes, 50 % matrix cells); Inspector overlay from 1100 px; whether "not recorded" cells open the Inspector; removing the view buttons from inside the Inspector; persisting the Columns choice; the 24-attribute guard.
6. **Pages.** Sources & data as a fifth About sub-page; "smallest stated / largest stated" for Size; showing "(provisional)" where the data says "(to confirm)"; whether the snapshot date leaves the top bar.
7. Whether V4.2 replaces earlier previews, and merging.
