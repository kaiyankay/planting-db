---
name: Planting Intelligence
description: A plant knowledge and design platform — a botanical design studio, a plant atlas and the knowledge both rest on, as one product.
colors:
  ivory: "#f7f3ea"
  ivory-2: "#efe9db"
  paper: "#fffdf8"
  paper-2: "#f3eee3"
  olive-deep: "#3b5538"
  olive: "#5b7a57"
  olive-soft: "#dfe6d7"
  sage: "#8c9c82"
  sage-soft: "#e6ebe0"
  caramel: "#b7894d"
  caramel-ink: "#8a5f1c"
  caramel-soft: "#f1e3cb"
  rust: "#b04f36"
  rust-soft: "#f2dcd4"
  ink: "#27241f"
  ink-2: "#5c5648"
  ink-3: "#716b5c"
  on-olive: "#ffffff"
  desk: "#f1ecdf"
  plate: "#fdf5ee"
  line: "rgba(39,36,31,.12)"
  line-2: "rgba(39,36,31,.26)"
  night: "#01020a"
  night-glass: "rgba(5,8,20,.78)"
  night-line: "rgba(190,205,255,.12)"
  night-ink: "#d3d9e8"
  night-ink-2: "#9aa3b8"
  night-ink-3: "#6b7388"
  night-warm: "#f4ead0"
  night-warm-soft: "rgba(255,241,194,.16)"
  night-warm-line: "rgba(244,234,208,.5)"
typography:
  display:
    fontFamily: "Bricolage Grotesque, DM Sans, -apple-system, Helvetica Neue, sans-serif"
    fontSize: "clamp(52px, 7.2vw, 100px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque, DM Sans, -apple-system, Helvetica Neue, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, -apple-system, Helvetica Neue, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  ui:
    fontFamily: "DM Sans, -apple-system, Helvetica Neue, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "DM Sans, -apple-system, Helvetica Neue, Segoe UI, Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.06em"
  provenance:
    fontFamily: "DM Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "11.5px"
    fontWeight: 400
  action:
    fontFamily: "DM Sans, -apple-system, Helvetica Neue, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  plan-label:
    fontFamily: "DM Sans, -apple-system, Helvetica Neue, Segoe UI, Roboto, sans-serif"
    fontSize: "10px"
    fontWeight: 400
  page-title:
    fontFamily: "Bricolage Grotesque, DM Sans, -apple-system, Helvetica Neue, sans-serif"
    fontSize: "clamp(46px, 5.8vw, 84px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.025em"
  species-title:
    fontFamily: "Bricolage Grotesque, DM Sans, -apple-system, Helvetica Neue, sans-serif"
    fontSize: "clamp(40px, 4.7vw, 68px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  section-title:
    fontFamily: "Bricolage Grotesque, DM Sans, -apple-system, Helvetica Neue, sans-serif"
    fontSize: "27px"
    fontWeight: 400
    lineHeight: 1.12
  card-title:
    fontFamily: "Bricolage Grotesque, DM Sans, -apple-system, Helvetica Neue, sans-serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.15
  lede:
    fontFamily: "DM Sans, -apple-system, Helvetica Neue, Segoe UI, Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  mark: "2px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  card: "10px"
  lg: "14px"
  composer: "18px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.olive-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "12px 18px"
  button-primary-hover:
    backgroundColor: "{colors.olive}"
  button-quiet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "7px 12px"
  tool:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    size: "56px"
  tool-active:
    backgroundColor: "{colors.olive-deep}"
    textColor: "{colors.paper}"
  tag-provenance:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.provenance}"
    rounded: "{rounded.xs}"
    padding: "1px 7px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "16px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.action}"
    padding: "0 12px"
  nav-link-current:
    textColor: "{colors.ink}"
  plant-figure:
    backgroundColor: "{colors.plate}"
    rounded: "{rounded.mark}"
  ledger-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "15px 0 16px"
  subnav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
    typography: "{typography.ui}"
    padding: "0 10px"
  subnav-link-current:
    textColor: "{colors.ink}"
  plant-card-compact:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.card}"
    padding: "8px"
---

## Overview

Planting Intelligence is a botanical design studio: warm paper, olive ink, one caramel accent. The home page (Imagine) is the
brand — a large Bricolage headline, a single composer, and plant symbols drawn from the knowledge base that sway slowly. Every
later page keeps that paper and that ink, but changes register: Shape and Compose are a desktop drawing workspace (the plan is
the page; tools, layers and an inspector sit around it), and Grow is the same workspace with the garden as its subject.

Imagine tells the story. Shape models the site. Compose assigns spatial functions and plants. Grow shows the result. They
share one site drawing, one navigation and one set of controls; they do not share a layout.

Since V4 (2026-11-15) the studio is one of four destinations of a platform: **Design · Plants · Knowledge · About** — use the knowledge, read it, explore it, understand it. A visitor can
enter through any of them. The same paper, ink, type and vocabulary run through all, and each keeps the layout its work needs:

| Destination | Register | Layout |
|---|---|---|
| Design | the studio above | hero, then the fixed drawing workspace |
| Plants | a botanical atlas | editorial: a large Bricolage title, a five-column grid of illustration plates, long reading profiles |
| Knowledge · Overview | an account with its evidence open | one real decision followed in five numbered steps; title-left, content-right sections; every statement in the ledger |
| Knowledge · Explore | inquiry | a search-first start, then ONE working view (graph, matrix, table or comparison) with the evidence inspector beside it; the Neural view keeps its night sky |
| Knowledge · Research, Method | a plain account | the same sections as a plant profile, with a few figures and one coverage grid |

What makes it one product is not a shared page template but five shared things: the platform bar, the tags, the plant card,
the ledger, and the fact that every page reads one knowledge snapshot and says which.

**Knowledge answers one question: what does a design rest on?** Its pages never show the size of the database as an
achievement. They show how one conclusion was reached, and where it stops being known.

## Colors

- **Ivory `#f7f3ea`** is the page, **desk `#f1ecdf`** the surface under the plan; **paper `#fffdf8`** is anything you can write or draw on (the site sheet, panels, inputs).
- **Olive deep `#3b5538`** is the only filled accent: the primary action, the active tool, confirmed planting.
- **Caramel `#b7894d`** means *not settled yet*: suggested beds, estimates, the one thing waiting for the user. Text on a
  light ground uses the darker caramel ink `#8a5f1c`.
- **Ink `#27241f` / `#5c5648` / `#716b5c`** carry text and stated site lines. Rust is reserved for removal and errors.
- Never add a second accent, a gradient or a tinted panel to separate sections; use a hairline (`line`) or space.

## Typography

Since V4 (2026-11-15) three families, loaded from Google Fonts (OFL) with `display=swap`, defined once as tokens
(`--pi-display / --pi-sans / --pi-mono` in `platform/css/platform.css`, `--display / --sans / --mono` in the Studio's `journey.css`):

- **Bricolage Grotesque** (500–700, tight tracking) speaks: the home headline, page and section titles, the name of the selected
  object, the wordmark. Never for controls, labels or data. It has no italic — never slant it.
- **DM Sans** (400–600) works: everything operable and readable. 15–17 px reading text, 13–14 px controls and secondary text;
  no paragraph under 12 px. **Scientific names are DM Sans italic** at the size of the text around them — readable, never an
  ornate display line.
- **DM Mono** (400–500) records: claim ids, provenance, status tags, metrics, small table heads. If it is in mono, it is a fact
  about where something came from. Never for everyday text.
- Scale tokens: `--pi-t-hero · page · section · card · lede · body · ui · small · mono`; spacing `--pi-s-*` (4 px scale), radii
  `--pi-r-*`, panel widths `--pi-rail-w`, `--pi-inspector-w`, reading width `--pi-read-w`. The specimen is About · typography.

## Layout

- Home: one viewport, headline and composer left, plant figure right. The composer takes words, a location, a size and an image
  together; a source opens inside the composer under a hairline, and what was added sits under the text as a chip.
- Workspace (Shape, Compose, Grow; ≥ 1081 px): fixed viewport, no page scroll. A 48 px mode bar, a 64 px tool rail, the canvas,
  a 340 px inspector, a 48 px status bar holding the state of the model and the single way forward. Panels scroll inside
  themselves. The canvas keeps the same rectangle and the same view in both modes, so the site never moves when the mode does.
- Floating elements on the canvas are few and docked: the command bar (bottom centre), zoom (bottom right), layout options
  (top left), an on-demand panel (left). Nothing floats over the middle of the plan.
- Spacing is a 4 px scale; inside panels 8 / 12 / 16, between panel sections 20 with a hairline.

## Elevation & Depth

Two levels only. Flat: rails, inspector and status bar are separated by hairlines. Raised (`0 6px 20px rgba(39,36,31,.08)`):
things that float over the canvas — the site sheet itself, the command bar, an open panel, a pending change.

## Shapes

Pills for actions, 8 px for inputs and tools, 14 px for floating panels, square corners for anything drawn on the plan.
Object handles on the plan are small white squares with an ink edge; mid-edge handles are smaller circles.

## Components

- **Platform bar** (every page, 52 px): the wordmark, then Design · Plants · Knowledge as plain text links. The current one
  is ink with a 2 px olive line on the bar's lower edge; nothing is filled. To the right: the way back to a design in progress
  (an olive-edged pill, "Back to Compose · East bed", shown only when there is one) and the date of the knowledge snapshot in
  mono. In the Neural view the bar takes the night tokens and nothing else changes.
- **Knowledge sub-navigation** (Knowledge pages only, in the same bar after a hairline): Overview · Explore · Research ·
  Method, 13 px, ink-3; the current one is ink with a 1 px ink line. Quieter than the destinations and never a second bar on
  desktop; under 900 px it takes its own 42 px row on reading pages.
- **Stage stepper** (Design only, in the same bar): Imagine · Shape · Compose · Grow, numbered; reached stages are clickable,
  the current one is a paper pill. Platform navigation is text; stages are numbered pills. Never draw one as the other.
- **Explore switch**: Explorer | Neural view, a small paper-on-paper-2 segmented pair after the sub-navigation, on those two
  pages only. The Explorer's own views (Graph · Matrix · Table · Compare) are switched in its toolbar, one at a time.
- **Tool rail**: icon + 10.5 px label; the active tool is olive; panels opened from the rail are marked the same way.
- **Inspector**: shows only what is selected. Kind (small caps) → name (Bricolage) → provenance tags → fields → "why" →
  actions. With nothing selected it shows the model itself.
- **Layers**: a list of what is on the plan; each row selects its object, each group has a visibility toggle.
- **Command bar**: one line, "say what should change"; the last reading opens above it.
- **Status bar**: state of the model on the left, legend in the middle, one primary action on the right, and beside it one
  line that says what that action does ("Confirms the 6 × 4 m outline and 4 beds as drawn").
- **Mode bar**: the page name, then where the work stands: Shape shows Concept → Scaled model → Planting beds, Compose the
  bed being designed and Spatial function → Plant selection → Arrangement, Grow the version and the three views.
- **Source chip** (home) and **location chip** (Shape): a solid olive edge for a confirmed map position, a dotted ink edge
  for a reference that was only typed. A location never carries more than its place.
- **Arrangement options** (Compose, step 3): one row per option — a strip of the bed with the plant objects of that engine
  run, the count by species, the engine's own figures. Hover holds it over the plan (the hint turns caramel: not chosen yet);
  the chosen one carries an ink edge and an olive foot, like a chosen layout in Shape. Shape's options are bed outlines,
  these are plants: never draw one as the other. An option that cannot stand is a dashed row with its reason, no drawing.
  Controls sit under the options, small; a control that changes nothing in this bed says so in caramel.
- **Steps** of a bed in Compose are an accordion: one open, the others a one-line summary.
- **Requirements**: one row per requirement with its status as a word — met, uncertain, not met, or *estimate* where the
  engine measures without a pass mark. The page never turns an estimate into a verdict.
- **Illustration plate**: the botanical illustration of a species on its own ivory (`plate`), 640 : 691, never cropped
  (`object-fit: contain`), square corners. The artwork carries no lettering: the scientific name is set under it in DM Sans
  italic and the common name in medium-weight sans, both read from the snapshot. The illustrations are AI-generated editorial
  artwork and every surface that shows one at reading size says so; they are never evidence and no fact is read from them.
- **Plant card** (Plants): the plate, the common name in Bricolage, the scientific name in DM Sans italic under it, growth form and
  origin in small ink, "Read more" with an arrow. No box, no border, no shadow: the plate is the card. A species without an
  illustration shows its photograph, and without either the studio's plan symbol, said to be a symbol.
- **Compact plant card** (Explorer inspector, Compose and Grow evidence, Neural card): the plate as a thumbnail, scientific
  name, one line, and the ways onward as text links (Plant profile · Evidence · Trace this decision). It is the only bordered
  card the platform adds.
- **Reference photograph** (profile only, under the plate): a 96 px thumbnail, the label "Reference photograph", author,
  licence and source in mono, and the sentence that its identification is the source's, not the project's. The photograph is
  the factual reference; the plate is the face.
- **Plant profile**: plate left with its note and the reference photograph; name, identity, six at-a-glance fields and the actions right.
  Below, sections with the title in the left column (Bricolage 27 px) and rows separated by hairlines in the right column.
  A row is: field name · what is recorded · where it comes from (claims, sources, tags). A field nobody recorded stays in
  the list, in ink-3, as "not recorded".
- **Tags** are the same on every surface, in mono: *status* documented (solid olive edge) · derived (dashed olive) · candidate
  (dashed caramel) · unknown (dotted); *verification* verified (olive-soft fill) · unverified (caramel-soft fill); *AI check*
  supported by source · partially supported · conflicting evidence · not assessed, always worded as an assessment; *conflict*
  rust-soft. Who does a step is tagged the same way: person · rule-based · from records · AI-assessed · you.
- **Ledger** (Knowledge, Method): the one layout for evidence. A row is three columns over a hairline: the *kind of statement*
  (small caps label, 148 px) · the statement itself · where it comes from (mono, 204 px, opened by a who-tag). Eight kinds are
  kept apart, always in this order and with these words: source statement · structured claim · human verification · AI source
  assessment · rule-derived relationship · your site information · engine output · evaluation. A source's own words are a
  quotation in sans at 17 px, never in the display face. Two kinds never share a row, and a row never borrows another kind's tag.
  Where nothing is recorded the row stays and says so in bold ("No source states …"), marked "an explicit unknown".
- **Decision chain** (Knowledge · Overview, directly under the masthead, inside the first viewport at 1440 × 900 and
  1280 × 800): the decision as five linked nodes in one row, divided by hairlines with a drawn arrow on each divider —
  Source → Claim → Function → Selection → Arrangement & result. A node is a small-caps step name with its Bricolage number,
  one 600-weight line with the record's own value ("landscape use = sheared hedge"), and one ink-2 line with its standing
  ("unverified · AI: partially supported", "Screen: not met"). Every value is read from the snapshot and the engine; an
  absence is a node too ("No source states this use"). Each node jumps to its step. Never a row of stat tiles: no figure
  without the record it belongs to.
- **Decision Trace** (V3): one explanation of one decision — a species, a spatial function, a bed — in two sizes. *Full*, on
  Knowledge · Overview: the five steps (Sources → Claims → Function → Selection → Arrangement & result), each in the ledger;
  the step list under the bar is drawn as a chain with arrows, because the order is the argument, and marks the step being
  read (ink, 600, its number in olive). The claim id of step 2 is repeated in mono in the provenance column of steps 3, 4
  and 5 ("rests on …"): one visible token carried through. *Compact*, in the Studio's
  inspector ("Why this plant here?"): a Bricolage question, then five hairline rows — Asked · Knowledge · Selection ·
  Arrangement · Result — and one text link to the full trace. Both are rendered by `platform/js/trace.js` from the engine's
  own records; neither is ever a modal or a separate dashboard.
- **What is being followed** (Overview): three rows of chips under the decision — Function, Bed, Species — each with one
  small-caps label. A function the engine does not arrange carries "recorded only" in mono inside its chip, and its trace
  stops at step 3 in words: no selection table, no drawing, no verdict.
- **Outcome words**: what became of a species in a bed, always one of: *planted* (olive) · *selected, not placed* (caramel
  ink) · *eligible, not selected* (ink) · *excluded by a check* (rust) · *evidence unknown* (caramel ink) · *planted for
  another function* (ink) · *recorded only* · *not asked of this bed* (ink-3). Set as 600-weight words like the result words,
  the same in Library, Knowledge, Compose and Grow. Never collapsed into "not suitable" or "not planted".
- **Estimate verdict** (Ground Cover): the Bricolage line reads "Ground Cover: an estimate, 52 %" in caramel ink, never in
  olive or rust: the engine sets no pass mark, so the page shows none.
- **Who-tags** (mono, the same shape as the status tags): named source (solid olive edge) · anonymous respondent (paper-2
  fill) · from records (olive-soft fill) · person (paper-2 fill) · AI-assessed (dashed caramel) · rule-based (olive edge) ·
  you (ink edge) · estimate (dotted caramel). A row that records an absence ("No source states …", "not assessed",
  "unverified") carries no who-tag: nobody made it.
- **No link** is never printed as the bare word "unknown": a missing function link says which kind — "no link: contradicted
  by a recorded trait" or "no link: evidence missing" — in the tag, in counts and in the matrix. "Supported" belongs to the
  AI source assessment only; the engine's evidence check reads meets / uncertain / fails like its other checks.
- **Result words**: meets / met / pass / supported in olive, uncertain / conditional / unknown / proxy / heuristic in caramel
  ink, fails / not met / unmet in rust, set as 600-weight words inside tables. A result is a word, never a coloured dot.
- **Verdict** (Knowledge step 5, as in Compose): the function and the engine's status as one Bricolage line in the status
  colour ("Screen: not met"), the reasons as a list under it, then the four checks as a table. Never softened, never hidden
  in a disclosure.
- **Evidence drawings**: the site plan and the screened edge unrolled, drawn with the site drawing's conventions below (heavy
  ink edge = Screen, rust dashes = not covered, caramel dashes = assumed canopy, a dashed rust ring = a dropped position). They
  are drawn from the saved design's plant objects and the engine's evaluation, never illustrated.
- **Disclosure**: a text button in olive with a drawn chevron ("All 17 sources of this release", "The record as stored").
  What it opens is a compact table or the stored JSON. The default view of every section stands without opening anything.
- **Compact table**: hairlines only, small-caps column heads, 13.5 px; the followed species' row sits on paper.
- **Split bar and coverage grid** (Knowledge, Research): proportions as one 8 px bar with a worded legend; coverage as one
  17 px square per species and field (olive recorded · caramel recorded with disagreement · outlined not recorded), each
  recorded square a link to its claims. These two are the only charts; no pies, rings or sparklines.
- **Explorer workspace**: fixed viewport. A toolbar (search, the four views), one working view, and the evidence inspector as
  a contextual right panel that appears with a focus or a selected record. With nothing selected the Explorer shows a start
  screen: search first, then the five functions, the species, and three questions that open a view. In the graph a focus
  shows its first ring only; further relationships are added one layer at a time by named toggles with counts.
- **Considered species** (Compose, step 2, "From the Plant Library"): one row per species the user asked for, with the
  bed's own check as a word (in the mix · qualifies · not planted) and the reason in a sentence. Only a qualifying species
  gets the dashed "+ Add to this bed" control every other qualifying species has.

### The site drawing

The plan is drawn like a landscape drawing, and its conventions are the interface:

| Mark | Meaning |
|---|---|
| solid line | stated or confirmed by the user |
| dashed caramel line | suggested or estimated, not accepted yet |
| dotted line | assumed until stated |
| light diagonal hatch | a true no-plant zone: planting is ruled out by the site itself (a building, paving, a path and its clearance). Never used for anything else |
| quiet tint, ink outline, "kept open at your request" | open space the user asked to keep. Plants could grow there; beds stay out because the user said so |
| plain sheet, dotted olive outline | plantable ground that has no bed yet |
| olive wash | a confirmed planting bed |
| heavy edge + diagonal hatch | Screen along that edge |
| stipple | Ground Cover |
| dashed empty outline | a function that is recorded but not arranged yet |
| dimension lines, scale bar | only when the site has a stated or calibrated size |

Nothing is drawn that the model does not hold: no terrain, no buildings, no shadows that imply sun data.

**A verdict is said, not only drawn.** Plant symbols on the plan look like a result. When the engine's own evaluation of a function is `not met` or `uncertain`, the plan and the inspector say so in words at the same size as the bed's name: a rust verdict block opens the bed's inspector (status, plants placed of those expected, what is uncertain), a rust tag sits on the bed and rust dashes mark the gaps on the screened edge. Rust is reserved for this; caramel dashes mean uncertain. A position that was estimated from words is written "about …, a default estimate, not measured" until the user moves it.

## V4 additions (2026-11-15)

- **Platform bar**: wordmark, then **Design · Plants · Knowledge · About** and nothing else in the first level. A second level
  exists only inside About (Project · How it works · Research & Method · Contribute & Future). Knowledge has no sub-pages: its
  views are switched inside the Explorer.
- **Imagine**: one invitation. The first viewport holds the bar, the headline (second line in olive, never slanted), one
  instruction line, the composer with its three inputs, the primary action, two quiet secondary actions and the hero plants.
  No stage stepper, no database figures, no captions. The figures live on About · Project.
- **Stage stepper**: appears in the bar only once the user is past Imagine.
- **Objective panel** (Compose, per bed; listed against beds in Shape once a layout is in use). V4.1 order, three layers:
  (1) objective and the engine's current result, (2) the controls the engine reads, with the reason in place when one is
  disabled, then the change note; (3) one disclosure, "N unresolved · basis, rule, what is read", holding Unresolved, Value,
  Function, the engine rule with each number's source, and the case (design id, preview fingerprint). Nothing in layer 3 is
  open by default. At 1280 × 800 header, result, target height and rows sit in the panel's first view.
- **Shape inspector**: two modes, never mixed. *Choose a layout* shows the options, how the others differ from the one shown
  and one action ("Use this layout"). *Edit beds and conditions* appears once a layout is in use; "Choose another layout"
  goes back.
- **Versions**: a generated version is named by its input fingerprint; a version changed afterwards says how ("typed edit",
  "manual edit", "partial regeneration") in Grow's bar, in the change note and in the trace, and has no input fingerprint.
- **3D shrubs**: tiers of near-round lobes whose footprint is the plan's crown circle and whose top is the claimed height;
  labelled as proxies in the footer.
  Only Privacy → Screen and Ground coverage → Ground Cover (V4.1: renamed from "Ground continuity"; the figure is an under-crown estimate, not connectivity) have one. Every control is an existing engine parameter and
  re-runs the engine; a **change note** says what changed in the engine's own before/after records, or "Same result" with
  the reason. Ground Cover reads "estimate N %" and never a verdict. A recorded-only function gets one line and no control.
- **Preview line**: a dashed caramel box with a mono fingerprint (`p-…`) — "not generated yet" or "differs from version N".
  A generated version carries `v-…`. Compose, Grow and the Decision Trace always name which one they read; a link whose
  fingerprint no longer matches says "This preview has changed".
- **Docked panels**: an on-demand panel sits beside the plan, never over it.
- **Why this plant here?** (Grow, Compose): three rows — Why selected · Why here · Does it work? — then a disclosure with the
  five steps and a link to the full trace.
- **Eligibility wording**: "eligible (checks pending)" / "provisionally eligible" wherever a check is uncertain. The eight
  outcome enums are unchanged, grouped as selection result versus function support.
- **Illustration plate**: one ground (`--pi-plate`) for all ten illustrations, same inset and baseline, by CSS only.
- **Plant profile**: plate, common name, scientific name, six quick attributes and the actions in the first viewport; then four
  tabs — Design relevance · Growth & conditions · Evidence & sources · Unknown & conflicting. A row is a summary that opens
  to its claims; ranges are listed per source and never averaged.
- **Explorer**: `Table | Matrix | Network` in the toolbar over one focus and one URL state; Compare and 3D network are
  secondary actions; Trace appears when a species is in context. The Network without a focus is an X · Y · Z overview
  (plants · spatial functions · the traits functions require) drawing recorded lines only.
- **About**: reading pages; the seven method steps keep their canonical names and order.

## Do's and Don'ts

- Do keep the plan as the largest thing on screen; panels serve it.
- Do show evidence where it is needed (the selected bed, the selected plant) and keep the full record one click away.
- Do say "offline rules" wherever language is read without a model; never call it AI.
- Do keep `meets / uncertain / fails`, `stated / inferred / assumed / unknown` exactly as words and as line styles.
- Don't nest cards, add stat tiles, or put a tinted box around every group.
- Don't animate for decoration: the hero plants sway; the workspace only fades between modes (≤ 220 ms) and respects
  reduced motion.
- Don't restyle the Imagine hero to match the workspace.
- Do put a plant fact on a page only by reading it from the knowledge snapshot; illustrations and photographs with their
  credits are the presentation assets kept beside it (`platform/data/artwork.json`, `platform/data/images.json`).
- Do say where a number comes from: the snapshot date sits in the bar of every page and in each page's masthead.
- Do show one primary working view at a time in the Explorer, and open relationships deliberately.
- Do let a recorded attribute stay an attribute: a claimed mature height is never worded as a working screen, and shared
  growing conditions are never worded as companionship.
- Don't give Plants or the Knowledge pages stat tiles with icons, tinted cards or a second accent. Figures are set in
  Bricolage over a hairline, in a row, with their label in small ink.
- Don't put a small-caps label above a heading. A section's number sits inside its heading, in ink-3, and only where the
  order is itself information (the five steps).
- Don't call anything AI that a rule or a person did. "AI-assessed" is reserved for the source check, "AI-generated" for the
  illustrations. The platform is not presented as a live language-model system.
- Don't letter an image. Names are HTML.
