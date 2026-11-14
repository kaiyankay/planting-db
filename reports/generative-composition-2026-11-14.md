# Generative planting composition (2026-11-14)

Branch `feature/generative-composition`, cut from `design/studio-ux-complete`. Methods: M64. Not merged into `main`.
Preview: https://kaiyankay.github.io/planting-db/studio-preview/ (rebuilt from this branch; `/design/` untouched).

## What a user can now do in Compose

Select a bed, open step 3 *Arrangement*, and compare arrangement options that the planting engine computes for that bed:

- **Ground layer** — Naturalistic drifts · Rhythmic rows · Clustered patches. Each is a different operator on the same free ground
  with the same species rules and clearances.
- **Screen row** — Single row · Staggered double row. An option that cannot stand is listed with the reason.
- **Adjust** — Spacing (open / standard / close), Grain (bold / medium / fine), Variation (another roll of the same rules).
  A control that changes nothing in this bed says so.
- **Plant mix** (step 2) — add or take out species, only among those that qualify for the function in this bed.

Hovering an option holds it over the plan; clicking chooses it. Generate then plants exactly that, and Grow says so.

## The 6 × 4 m demonstration (`?script=compose`, record in `eval/composition-record-2026-11-14.md`)

| | result |
|---|---|
| A · East bed, ground cover | drifts 19 plants / 52 % under crowns · rhythmic rows 26 / 81 % · patches 16 in 2 patches / 67 % — three distinct sets of plant objects |
| B · North bed, screen | single row: 7 of 10 placed, 4.27 of 6 m covered, not met · staggered double row does not fit (needs 1.33 m of depth, bed has 0.9 m) · open / standard / close spacing: 5 / 7 / 8 plants, none closes the gap |
| C · Compose → Grow | patches chosen for East bed → generated version identical to the preview for all 31 plant objects (bed, species, role, position); the other three beds identical to the engine's default |
| back to Compose | rhythmic rows for East bed → new version, East bed re-arranged, the other beds' plant objects unchanged, again identical to the preview |

Screenshots: `brain/screenshots/generative-composition/`.

## How it is built

- `bed.composition` holds what differs from the default; the engine reads it in `assemble` (mix) and `generateBed` (rows, pattern,
  grain, density, variation). A bed without one is planted exactly as before.
- An option in Compose is `E.generate` run with that bed's composition changed and nothing stored — no separate preview system.
- Every generation compares the committed version with the Compose preview and keeps the result on the version (`preview_match`).
- Suites unchanged and passing: design 199, spatial 156, ux 41. `tools/composition_record.py` writes the demonstration record.

## Limits (also said in the interface)

- Ten species: five qualify for ground cover in the demo, one for a 1.8 m screen, so the screen has no mix.
- No option closes the gap in the screen row: three positions fall in the ground kept free around the existing tree.
- Drifts set all species on one lattice at their mean spread; species of very different size crowd each other out there.
  Rhythmic rows and patches give each species its own spacing, so their plant counts are higher for small-crowned species.
- Band length, patch radius and patch gap are heuristics of the implementer, declared as such; they are composition choices,
  not horticultural rules.
- Changing one bed can move stems at the edge of a neighbouring bed (the engine keeps a clearance across bed lines, in bed
  order). It did not happen in the demo; when it does, the message says so.
- No pollinator, biodiversity or performance figure exists. Cover and continuity are geometric estimates on claimed mature sizes.
- Canopy, Scrim and Barrier remain recorded only: no arrangement is generated for them.

## To confirm

- The three pattern names and their grain values (band 4 / 2 / 1 × spacing; patch radius 2.4 / 1.7 / 1.15 × spacing; gap 1.1 ×).
- Per-species spacing inside bands and patches (0.65 × that species' spread) against the mean spacing drifts use.
- Spacing steps 0.8 / 1 / 1.25; the mix limited to 3 ground species and 2 screen species.
- Compose's three steps as an accordion with Arrangement open by default.
