# Complete journey UX — Imagine → Shape → Compose → Grow (2026-11-14)

Branch `design/studio-ux-complete`, cut from `design/studio-integration` (dffbf57). Interface and workflow only: the database,
the knowledge graph, the spatial engine and the planting algorithm are unchanged. Methods: M63. Not merged into `main`; the
live-LLM branch is not part of it.

Preview: https://kaiyankay.github.io/planting-db/studio-preview/ — a self-contained static folder on `main`
(`tools/build_preview.py`). The production site at `/design/` is untouched.

## What changed

**Imagine.** The hero is as it was. The composer now takes four optional sources together: words, an address, dimensions,
a photo or sketch. Each opens inside the composer; what was added sits under the text as a chip, and nothing leaves the page
until *Start designing*. The address is searched with OpenStreetMap Nominatim only when *Find* is pressed; the user picks one
of the places found, which confirms it. If the service cannot be reached or finds nothing, the typed address can be kept as an
unverified reference. The native browser prompt is gone.

**Shape.** The mode bar says where the model stands: Concept → Scaled model → Planting beds. The location is shown as
context and opens a panel that says what a location is and is not. *What the model knows* lists location, outline, size,
existing trees and growing conditions with a status each. An address without a size opens an empty plan that asks for the
size on the canvas. The way forward is *Confirm model*, with one line saying what it confirms.

**Compose.** Beds are listed first; the mode bar names the bed being designed and the order Spatial function → Plant
selection → Arrangement. Each selected plant lists why it is there, check by check. Requirements are given as met,
uncertain, not met, or estimate. A list says what can still be changed before generating.

**Grow.** Same shell as Shape and Compose: stepper, mode bar with Plan / Presentation / 3D, tool rail, inspector, command
bar, status bar. The site sits at the same place on screen as in Compose. The inspector shows the garden (what it achieves,
its plants, how to change it), the selected plant, or a pending change. Schedule, checks and versions open as panels.

## Scenarios (replayed through the page's own controls: `?script=ux&…`)

| | input | result |
|---|---|---|
| A | description with 6 × 4 m | Shape opens on a scaled model with beds proposed; Confirm model → Compose → Generate → Grow |
| B | description without a size | an editable sketch; a size given later keeps the tree where it was and proposes beds |
| C | address + size + description | location confirmed and shown in Shape; outline and size from the user; conditions unknown |
| D | address only | Shape opens on an empty plan with the location; nothing is drawn; the size is asked for |

Screenshots: `brain/screenshots/journey-ux/` (1440 × 900).

## Checks

`design_tests.py` 199 / 199, `spatial_tests.py` 156 / 156, `ux_tests.py` 41 / 41 after three expectations were updated to the
new behaviour (W1 the condition lens, W10 beds confirmed by *Confirm model*, G2 the plant rows). No new suite was written.

## Not available or incomplete

- A location gives a map position only. No parcel outline, no aerial image, no climate, soil or sun data is fetched.
- A photo or sketch is still only laid under the plan to trace by hand; nothing in it is recognised.
- Language is read by the offline rules on the preview; the live model of the Phase 3 branch is not included.
- No tool yet draws a true no-plant zone (building, paving); Canopy, Scrim and Barrier are recorded, not planted.
- Desktop first (1440 × 900 and 1280 × 800). Narrow screens only wrap; they were not designed.
- The lookup depends on a public service: it can be slow, rate-limited or unreachable, and then offers the unverified reference.

## To confirm

- *Confirm model* accepts the suggested beds on the way to Compose (before, they were accepted at Generate).
- Grow opens in Presentation rather than Plan.
- Metro Vancouver is tested by the geocoder's region name or an approximate box (49.0–49.58° N, 123.45–122.4° W).
