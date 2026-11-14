---
name: Planting Intelligence
description: A botanical design studio — describe a site, shape it, compose the planting, grow the garden.
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
  line: "rgba(39,36,31,.12)"
  line-2: "rgba(39,36,31,.26)"
typography:
  display:
    fontFamily: "Fraunces, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(52px, 7.2vw, 100px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, Helvetica Neue, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  ui:
    fontFamily: "-apple-system, Helvetica Neue, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system, Helvetica Neue, Segoe UI, Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.06em"
  provenance:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "11.5px"
    fontWeight: 400
  action:
    fontFamily: "-apple-system, Helvetica Neue, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  plan-label:
    fontFamily: "-apple-system, Helvetica Neue, Segoe UI, Roboto, sans-serif"
    fontSize: "10px"
    fontWeight: 400
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
---

## Overview

Planting Intelligence is a botanical design studio: warm paper, olive ink, one caramel accent. The home page (Imagine) is the
brand — a large Fraunces headline, a single composer, and plant symbols drawn from the knowledge base that sway slowly. Every
later page keeps that paper and that ink, but changes register: Shape and Compose are a desktop drawing workspace (the plan is
the page; tools, layers and an inspector sit around it), and Grow is the same workspace with the garden as its subject.

Imagine tells the story. Shape models the site. Compose assigns spatial functions and plants. Grow shows the result. They
share one site drawing, one navigation and one set of controls; they do not share a layout.

## Colors

- **Ivory `#f7f3ea`** is the page, **desk `#f1ecdf`** the surface under the plan; **paper `#fffdf8`** is anything you can write or draw on (the site sheet, panels, inputs).
- **Olive deep `#3b5538`** is the only filled accent: the primary action, the active tool, confirmed planting.
- **Caramel `#b7894d`** means *not settled yet*: suggested beds, estimates, the one thing waiting for the user. Text on a
  light ground uses the darker caramel ink `#8a5f1c`.
- **Ink `#27241f` / `#5c5648` / `#716b5c`** carry text and stated site lines. Rust is reserved for removal and errors.
- Never add a second accent, a gradient or a tinted panel to separate sections; use a hairline (`line`) or space.

## Typography

- **Fraunces** is for the voice of the product: the home headline, a page's mode title, the name of the selected object.
  Never for controls, labels or data.
- **System sans** for everything operable: 13 px in panels, 14–15 px for buttons, 16 px for reading text.
- **Small caps labels** (11 px, 600, +0.06em, `ink-3`) name a panel section; one per group, never stacked.
- **Mono** is the voice of provenance: status tags, claim ids, "offline rules". If it is in mono, it is a fact about where
  something came from.

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

- **Stage stepper** (top bar): Imagine · Shape · Compose · Grow, numbered; reached stages are clickable, the current one is a
  paper pill. It is the only global navigation.
- **Tool rail**: icon + 10.5 px label; the active tool is olive; panels opened from the rail are marked the same way.
- **Inspector**: shows only what is selected. Kind (small caps) → name (Fraunces) → provenance tags → fields → "why" →
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

## Do's and Don'ts

- Do keep the plan as the largest thing on screen; panels serve it.
- Do show evidence where it is needed (the selected bed, the selected plant) and keep the full record one click away.
- Do say "offline rules" wherever language is read without a model; never call it AI.
- Do keep `meets / uncertain / fails`, `stated / inferred / assumed / unknown` exactly as words and as line styles.
- Don't nest cards, add stat tiles, or put a tinted box around every group.
- Don't animate for decoration: the hero plants sway; the workspace only fades between modes (≤ 220 ms) and respects
  reduced motion.
- Don't restyle the Imagine hero to match the workspace.
