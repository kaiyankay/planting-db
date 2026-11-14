# Studio integration: Imagine → Shape → Compose → Grow as one desktop product (2026-11-14, M60)

Branch `design/studio-integration`, cut from `design/ux-page2-page3` (93e41f8). Not merged to `main`; the live demo is unchanged.
Desktop web, checked at 1440 × 900 and 1280 × 800. Interface, drawing and wiring only: the survey, the database, the knowledge
graph, the knowledge adapter, the planting algorithm, `concept.js`, DesignVersion and the Grow stage's functions are unchanged
(the three exceptions are listed under *Not interface*).

## What is different

**One workspace, two modes.** Shape and Compose are now the same fixed-viewport shell — mode bar, tool rail, canvas, inspector,
status bar — and the plan is one SVG element that moves between them. It keeps its rectangle and its view, so the site sits at
the same pixels in both modes (tested). Only the tools around it change, with a 220 ms fade.

**The plan is a site drawing.** A paper sheet on a desk with a 1 m grid inside the boundary; overall dimension lines and a
graphic scale bar when the site has a stated or calibrated size (never on the sketch); a compass that says when north is
assumed; the existing tree as canopy + trunk, dotted when its canopy is assumed; a light hatch on the ground where beds may not
go (whatever the plantable area leaves: access, clearances, open areas); suggested beds dashed in caramel, confirmed beds solid
in olive; narrow beds carry their label along their length; selection is an ink outline with square corner handles.

**Shape.** Opens on what Page 1 gave it: a scaled model when the sentence had dimensions, the editable sketch when it had none,
a blank plan after *Start from scratch*. The inspector shows the selected object only; with nothing selected on a scaled site it
shows the suggested layout (three options as thumbnails — hover holds one over the plan, click takes it). Layers lists what is
on the plan, each row selects its object, and each group has a visibility toggle (features, beds, plantable ground, labels and
dimensions, current planting). The six conditions sit in the mode bar as a lens (value, or "—" when not stated; an olive icon
means the plant gates read it) and open as a panel. The long guidance line is gone; one hint pill remains.

**Compose.** No longer a long page. The same plan is read by spatial function: diagonal hatch and a heavy edge for Screen,
stipple for Ground Cover, a dashed empty outline for the three functions that are recorded only. Click a bed and the inspector
reads it as a chain — **1 Spatial function** (what it is for, why, change it; the conditions that apply) → **2 Plant
selection** (the species that will be used with `meets / uncertain / fails`, the gate, and how many are placed; candidates,
failures and exclusions folded underneath) → **3 Arrangement** (rows, plants placed *of* expected, spacing, edge, depth, the
engine's own evaluation of the row). The selected bed is drawn with the plants the engine will place there. Goals, site-wide
functions and planting rules are three panels on the rail; clicking a species opens its evidence record beside the plan.

**What Compose draws is what Generate places.** The arrangement is not an illustration: Compose runs the planting engine
(`E.generate`, same seed, density and rows) without committing a version, and draws and quotes that result. Tested: the dry run
equals the generated version plant for plant, in Demo A and in Demo B. Changing a bed's function, a goal, the density or the
second row re-runs it. The earlier inspector quoted the row arithmetic alone ("10 plants"); the engine drops positions under an
obstacle, so the real row had 7 — the page now shows "7 of 10" and why.

**One navigation.** A numbered stepper (Imagine · Shape · Compose · Grow) on every page including the garden stage; reached
stages stay clickable, the design and the model are kept when going back, and the selected bed stays selected across modes.

**Page 1** is untouched: the `#s-welcome` markup is byte-identical and, with reduced motion, the page below the top bar is
pixel-identical to the previous branch (the only differing pixels are the stepper's 3 px shadow at the bar's edge).

## Before / after

| | before (93e41f8) | after |
|---|---|---|
| Shape, sketch | `before-shape-concept.png` | `02-shape-concept.png`, `03-shape-concept-placed.png` |
| Shape, scaled + proposal | `before-shape-proposal.png` | `04-shape-scaled.png`, `05-shape-proposal.png`, `06-…compare-layout`, `07-…bed-selected` |
| Compose | `before-compose.png` (a 2 100 px page: plan, bed card, three brief columns) | `08-compose-function-plan.png`, `09-compose-bed-arrangement.png` (one screen) |
| Grow | crumbs "← Shape ← Compose" | `10-grow.png` (same stepper) |

All in `brain/screenshots/studio/` at 1440 × 900 (`1280x800/` holds the same set at that size). Reproduce with
`sh tools/studio_shots.sh` while the design server runs.

## The two demonstrations (real model, real engine; replayed through the page's own controls)

`?script=studioA` and `?script=studioB` type the sentence into Page 1 and then click what a user would click.

**Demo A** — "I have a 6 × 4 m backyard with a tree in the northwest corner. I want privacy along the north edge and an open
centre." → Shape opens on a 6 × 4 m model (dimension lines 6 m / 4 m), the tree at 1, 3 m ("position estimated from northwest
corner, 1 m in from both edges", canopy assumed), an open centre (extent suggested), three layout options; the recommended one
has four beds: North 5.4 m² Screen, East 2.48, West 2.48 and Tree island 2.1 m² Ground Cover → Compose: North bed, *Gaultheria
shallon* (screen · uncertain · gate unknown), one row, 7 of 10 plants at 0.57 m, the row's evaluation "not met" with its gap
→ Generate: 34 plants, 2 species, every plant inside its bed, none in the open centre → back to Compose and Shape with the
version kept.

**Demo B** — "I have a small backyard with an old tree. I want it to feel open with some ecological value." → Shape opens on
the sketch (not to scale, no size pre-filled, Compose closed), the tree waits beside the plan because no position was said →
the tree is dragged onto the plan, 7 × 5 is typed → the same workspace holds a 7 × 5 m model with three options and four
suggested beds → Compose (beds still suggested): North bed, ground cover + accent, 29 plants → Generate accepts the beds as
drawn: 89 plants, 3 species.

## Browser checks

- `tools/design_tests.py` **193/193** (183 existing + 10 new: W1–W10 cover both demos, the shared canvas, the dry-run equality,
  back-navigation) · `tools/spatial_tests.py` **156/156** · `tools/ux_tests.py` **41/41**.
- 1440 × 900 and 1280 × 800: no page scroll in Shape or Compose, no horizontal overflow at any step, panels scroll inside
  themselves; at 1280 the inspector narrows to 320 px and the conditions lens shows only what is set.
- Live in the browser pane: wheel zoom to the cursor and the zoom read-out, `F` to fit, Esc to deselect; in Compose, adding
  Ground Cover to the North bed took the preview from 7 to 13 plants, density 1.3 changed rows and counts, clicking empty ground
  returned to the function plan, a species name opened its evidence.
- Impeccable: `document` → `DESIGN.md` (tokens and rules extracted from Page 1, extended for the workspace); `layout`,
  `distill`, `polish` applied as above; `critique` / `audit` done on the rendered pages and with the detector — its 48 findings
  were token-level (undocumented white, 10 px radius, 14 px actions), now recorded in `DESIGN.md`; the two brand findings
  (warm paper, Fraunces) are the frozen Page 1 identity and were kept.

## References

Patterns only, no code: openPlan3D (MIT) — inspector that shows the selection, white square handles, layers with eye toggles,
zoom read-out and fit key, status bar. garden-planner has no licence, so nothing but conventions was taken — fixed paint order
(ground → beds → features → labels), muted site marks against saturated plant symbols, north arrow and scale bar on the canvas.

## Not interface (three small changes outside the page layer)

1. `js/intent.js`: "in the northwest corner" was read as "north". The rule now keeps the corner; on a sized site the tree is
   placed 1 m in from both edges and labelled as an estimate. In a sketch without size `concept.js` (untouched) still reads it
   as the north side and says so.
2. `js/clip.js`: polygon-clipping can throw "Unable to complete output ring" on nearly coincident points — it did for a tree
   dropped at 1.95, 3.4 m on a 7 × 5 m site, leaving Shape half-updated. The same operation is now retried on the same geometry
   snapped to 1 mm, 0.1 mm, 2 mm; a failure of all four leaves the previous layout and says so.
3. `js/app.js` `ensureProposal`: a geometry failure is reported in words instead of stopping the render.

## Files

`DESIGN.md` (new) · `design/index.html` · `design/css/studio.css` (new) · `design/js/app.js` · `design/js/render.js` ·
`design/js/intent.js` · `design/js/clip.js` · `tools/design_tests.py` · `tools/studio_shots.sh` (new) · `methods.md` (M60) ·
`design/README.md` · `.claude/skills/planting-intelligence-ux/SKILL.md` · this report · `brain/screenshots/studio/`.

## Not done, or rough

- **Phone and tablet.** Below 1081 px both pages fall back to a stacked flow that only passes the overflow tests.
- **CSS debt.** Three layers (`journey.css` → `workspace.css` → `studio.css`); rules for the removed long Compose page
  (`.compose-main`, `#svg3`, `.bedtabs`) are still in `workspace.css`. A consolidation pass is due before more is added.
- **Layers** toggle groups, not single objects; no locking or reordering.
- **Compose preview plants** are not clickable (the bed under them is); evidence opens from the species names.
- **No snapping, marquee, minimap or floating action bar** — seen in the references, not built.
- **Grow** got the stepper only; its plan still uses the older drawing conventions.
- **Hint pill** sits over the top of the plan and can cross a canopy or the dimension line.
- **Language** is read by the offline rules everywhere (the page says so); no live model was exercised.
- To confirm: the hatch reading ("no beds here"), the default of showing the first bed selected in Compose, the corner rule
  (1 m in from both edges), and whether the dry-run preview should also be offered for all beds at once.
