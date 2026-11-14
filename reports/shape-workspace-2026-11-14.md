# Shape as a fixed-viewport, canvas-first workspace (2026-11-14, M59)

Branch `design/ux-page2-page3`, not merged to main. Desktop web only (checked at 1440 × 900). `concept.js`, the sketch-to-site conversion rules, the planting algorithm, Page 1, Page 3 and Grow are unchanged; the only non-CSS changes are the Page 2 skeleton, its renderer and the interface connections listed below.

## What changed

Page 2 was a long page: a canvas, then a conditions strip, a four-column evidence block and a tall side column to scroll through. It is now one screen that does not scroll, organised the way a drawing program is:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Shape · Concept site model · Not to scale            (one line of guidance) │
├──────┬───────────────────────────────────────────────────┬─────────────────┤
│ tool │                                                   │ Inspector       │
│ rail │                   the plan                        │  what is        │
│      │                                                   │  selected       │
│      │   [panel on demand]                               ├─────────────────┤
│      │                         [say what should change]  │ Layers          │
│      │                                      [− Fit +]    │  site · beds    │
├──────┴───────────────────────────────────────────────────┴─────────────────┤
│ state of the model · line legend                       Confirm model →     │
└────────────────────────────────────────────────────────────────────────────┘
```

1. **The canvas takes the space** (1006 × 728 px of 1440 × 900). The wheel zooms to the cursor without a modifier key, right-drag or Space-drag pans, and − / Fit / + sit in the corner. Selecting, dragging, corner and mid-edge handles, the sketch's proportion handle and the docked change preview work as before.
2. **Tools, layers and the inspector surround it.** A tool rail on the left (Select, Boundary, Bed, Open area, Tree, Calibrate — or the sketch tools while there is no size — then Conditions, Evidence, Photo, Plantable, Undo). The inspector and layers on the right. A status bar below with the state of the model and *Confirm model*.
3. **Properties appear only for what is selected.** Clicking an object on the plan or in Layers shows that object: its status tags, how it was read ("From your words: …; the exact spot is an estimate") or why it is there (a bed's reasoning and notes), where the fact comes from, and the actions that apply (confirm, choose a side, canopy radius, accept / reject, remove). With nothing selected the inspector shows the model itself. Esc clears the selection.
4. **Site conditions are a tool panel.** The Conditions button (rail or Layers) opens the six conditions over the canvas; each still says whether the plant gates read it. Layers shows "n of 6 set".
5. **One workspace for all three states.** The concept sketch, the scaled site model and the bed proposal use the same canvas, rail, inspector and status bar; giving the sketch a size changes the model in place (header "Concept site model · Not to scale" → "Site model · 8 × 5 m · scale user-stated"), and the layout options and beds appear in Layers.
6. **Evidence on demand.** The four groups (provided · inferred · suggested / assumed · unknown) are no longer open by default: Layers shows the counts, and the Evidence button opens the full record. Nothing was removed from it.
7. **No size is pre-filled.** The width and depth fields are empty ("width", "depth"); *Set size* with a missing value asks for both instead of assuming 6 × 4 m.

Also: the command field ("say what should change") is a bar at the bottom of the canvas with the last reading one click above it; the sketch is described in the status bar as "Sketch from your words · offline rules · editable" rather than as an AI sketch, because no model is connected.

## Interface connections (not layout)

- `S.sel` — the selection (bed, feature, site, or a sketch object); set from the canvas and from Layers.
- `S.wsPanel` — which on-demand panel is open.
- the top bar's height is measured into `--nav-h` so the workspace sits exactly under it.
- a tree's centre dot is now part of the tree's click target (a click on the exact centre used to select nothing).
- the wheel handler zooms without a modifier on this page at desktop width.
- `quicksite` requires both values.

## Checked in the browser at 1440 × 900

Page 1 description → Shape opens with the page locked (no scroll) and the sketch on the canvas, size fields empty, panels closed → click the tree: inspector shows it, Layers highlights it → Conditions panel: light set to part-shade, "1 of 6 set" → Evidence panel on demand → Esc → type 8 and 5, Set size: same workspace now shows the scaled model and four proposed beds → click the north bed: inspector shows why it is there, Accept / Reject, eight handles on the plan → wheel zooms the plan, the page does not move → hovering a layout option holds it over the plan → Confirm model goes to Compose (page scroll restored) and the Shape tab returns to the locked workspace.

## Tests

`tools/design_tests.py` 183/183 · `tools/spatial_tests.py` 156/156 · `tools/ux_tests.py` 41/41. Two replay steps were adjusted to the new structure (select an object before confirming it; deselect before typing the size).

## Screenshots

`brain/screenshots/workspace/` — before (sketch, scaled) and after: the concept sketch, an object selected, the Conditions panel, Evidence on demand, the scaled model with beds, a bed selected and zoomed, the docked change preview.

## Not done

- Phone and tablet: below 1080 px the page falls back to a simple stacked flow; it was not tuned in this pass.
- Dragging in the browser pane's own drag tool emits no pointer-move events, so drags were verified with pointer events dispatched on the page.
- Layers has no visibility toggles; it is a navigable list of what is on the plan.
