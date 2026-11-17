# Conceptual site model — from the description to an editable sketch (2026-11-14, M58)

Branch `design/ux-page2-page3` (on top of the Page 2 / Page 3 workspace). Page 3, the knowledge graph and the planting algorithm are not changed.

## The gap that was closed

Before: a description without dimensions led to a Shape page with an empty canvas ("no site geometry yet"), a text list of suggested moves and a request for W × H. Nothing could be selected or corrected until a size was typed.

Now: the same description opens Shape on a **sketch of the site** that can be edited straight away. It is drawn from the words only, has no size, and says so.

## What the sketch is

`project.site.concept` (new module `design/js/concept.js`):

- its own **unitless frame** (100 wide; 3 : 2 until changed) — never metres. `site.boundary`, `site.features`, `site.beds` and `site.scale` stay empty until conversion, so nothing downstream can compute an area, a spacing or a plant count from it. Compose and Generate stay closed.
- objects: the **outline** (proportions suggested), **existing features** (trees), **open areas**, each with its spatial relation, plus **suggested planting areas** (bands and rings — a diagram, not beds: no width, no area).
- every part of every object carries where it comes from:

| status | meaning | example |
|---|---|---|
| user-stated | the user said it | "an old tree", "on the north side", "the middle" |
| inferred | read out of the words by a rule | the exact spot inside the north side; "at the back" read as north (the reading is shown) |
| suggested | put there so there is something to correct | the outline's proportions, an open area's extent, the planting areas |
| unknown | not said, not guessed | a tree whose position was never mentioned |
| user-placed / confirmed | moved, drawn or confirmed in the sketch | — |

A tree mentioned without a position is **not put on any side**: it waits beside the plan ("existing tree — position not stated, drag it onto the plan"). The same now holds on a sized site: the old default "north" is gone, and "left / right" no longer become east / west.

The sketch is drawn by the existing plan renderer through a view of the concept (`CM.viewProject`), with the scale left unknown — so there is no grid, no scale bar and no m² label — and a caption "Sketch from your words — not to scale, no sizes".

## Working in the sketch (Page 2)

- select and drag a tree or an open area; drag the outline's corner to change the proportions (everything keeps its relative place);
- say where a tree is with the side selector, confirm an estimate, remove an object;
- add a tree or an open area with the toolbar;
- see where planting could go, and switch those hints off;
- set the site conditions (the strip under the plan works as before);
- the evidence panel shows four groups: *You provided · Inferred from your words · Suggested by the sketch · Unknown, not guessed*;
- the panel states who drew it: "Drawn by the offline rule reader from your words — not an analysis of a photo, a map or an address."

**Start from scratch** (toolbar and panel, and the "draw" entrance on Page 1) clears the plan and arms the boundary tool; nothing read from the words is placed for the user afterwards (a mentioned tree waits beside the plan). "Use the sketch from my words instead" brings it back.

## From sketch to site geometry

Any of these converts the sketch (`CM.convert`, called from the existing `placeNotes` step):

- typing **W × H**;
- giving **only the longest side** — the other follows the sketch proportions and is labelled as a suggestion;
- stating dimensions in words;
- **drawing the real boundary** (the sketch steps aside while drawing and is mapped into the drawn outline's bounding box).

Each placed object lands at its relative position in metres. What the user placed or confirmed arrives as `user-drawn`; the rest as `inferred`; the source line says "placed by you in the sketch; scaled with the sketch to the stated size". Canopy size stays unstated. Objects that were never placed are not given a position. Then the existing `spatial.js` proposal runs and the usual layout options, beds, Compose and the planting algorithm follow unchanged.

## Interpreter boundary

The sketch is built from the fact structure of `interpretDescription` (now also carrying the word that was used for a side and whether "the middle" was said). A live model, if one is ever enabled through `tools/design_server.py`, must return the same structure and would feed the same builder; the panel names whichever interpreter produced the brief. No image, map or address analysis is performed or claimed, and no data service was added.

## Acceptance (browser, 1440 × 900; phone 390 × 844 checked for the sketch)

| case | result |
|---|---|
| A · vague language only | Shape opens on the sketch: outline, open area in the middle (stated), three planting hints; the tree is beside the plan, not on a side; no metres anywhere; Continue is disabled with the reason |
| B · dimensions and a tree side stated | a scaled 9 × 6 m model: tree estimated on the east side, Screen on the north bed, four beds proposed; no sketch involved |
| C · move the tree, then add a size | tree dragged onto the sketch and moved, proportions changed, open area confirmed; with 8 × 5 m the tree is at the same relative place (0.66, 3.95 m) and both objects are user-drawn; layout options appear; nothing lost |
| D · Start from scratch | blank canvas with the boundary tool armed; after drawing a boundary nothing is placed for the user; the sketch can be brought back |

The browser pane's drag tool does not emit pointer-move events, so drags were driven with real pointer events dispatched on the page; clicks, typing and form submission used the pane directly.

## Tests

`tools/design_tests.py` 183/183 (W1–W14 engine tests of the concept module, H1–H9 on the page via `?script=concept`), `tools/spatial_tests.py` 156/156, `tools/ux_tests.py` 41/41. One older assertion changed: the vague-input canvas is now expected to show the "not to scale" sketch with no site geometry, instead of the words "no site geometry".

## Files

- `design/js/concept.js` — new: the model, its edits, the planting hints, the renderer view, the conversion.
- `design/js/app.js` — description → sketch, placement without default sides, sketch panel and evidence, sketch tools and pointer handling, the tray, longest-side scaling, Start from scratch, `?script=concept`.
- `design/js/render.js` — sketch caption, tray, proportion handle, selection ring, no area labels in the sketch.
- `design/js/intent.js` — keeps the side word and whether "the middle" was said.
- `design/js/model.js` — `site.concept`, `site.scratch`.
- `design/css/workspace.css` — sketch styles.
- `design/js/tests.js`, `tools/design_tests.py`, `tools/spatial_tests.py` — tests.
- Screenshots: `brain/screenshots/concept-model/`.

## Limits

- The outline is always a rectangle in the sketch; another shape needs the boundary tool.
- Planting hints are a fixed diagram of the same intent the bed proposal reads; they are not a preview of the real beds.
- The offline rules read one tree and one open area per description; more can be added with the tools.
