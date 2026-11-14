# Generative composition — demonstration record (2026-11-14)

Replay `?script=compose` of `design/index.html`, through the page's own controls. Sentence: “I have a 6 × 4 m backyard with a tree in the northwest corner. I want privacy along the north edge and an open centre.” · seed 42.
Beds: North bed (screen), East bed (ground_cover), West bed (ground_cover), Tree island (ground_cover). Features: existing tree, open (open centre).

## A · East bed: the ground-layer options are different plant objects

| option | plants | species | spacing (m) | under crowns (estimate) | other beds unchanged |
|---|---|---|---|---|---|
| Naturalistic drifts | 19 | 19 Arctostaphylos uva-ursi | 0.34 | 52 % | yes |
| Rhythmic rows | 26 | 24 Arctostaphylos uva-ursi, 2 Gaultheria shallon | Arctostaphylos uva-ursi 0.2 · Gaultheria shallon 0.49 | 81 % | yes |
| Clustered patches | 16 | 13 Arctostaphylos uva-ursi, 3 Gaultheria shallon | Arctostaphylos uva-ursi 0.2 · Gaultheria shallon 0.49 | 67 % | yes |

3 of 3 options are distinct sets of plant objects (species, role, position). Species that qualify for the ground layer here: Arctostaphylos uva-ursi, Gaultheria shallon, Polystichum munitum, Achillea millefolium, Gaillardia aristata.
Held over the plan without choosing: Rhythmic rows — 26 symbols drawn, stored composition None.
Chosen: **Clustered patches** → stored on the bed as `{"pattern": "patches"}`; 16 plants in the preview; other beds same as before: True.

How each option sets the plants out:
- Naturalistic drifts: a jittered lattice (0.35 × spacing); the species follow a drift field with cells of 1.4 m (heuristic)
- Rhythmic rows: 4 bands of 0.78 m across the bed's long side (2 × the mean spacing, fitted to the bed — heuristic), the 2 species in turn; inside a band a square grid at 0.65 × that species' claimed mature spread, no jitter
- Clustered patches: 2 patches of radius 0.59 m (1.7 × the mean spacing) with at least 0.38 m of open ground between them (heuristics); one species per patch, taken in turn, at 0.65 × its own claimed mature spread

Controls on this bed: density — changes the plants; grain — changes the plants; variation — changes the plants.

## B · North bed: the screen row, what fits and what does not

- **Single row** (chosen): 7 plants (7 Gaultheria shallon), 0.57 m apart; 7 of 10 placed, 4.27 of 6 m of the edge covered — **not met**.
- **Staggered double row** — does not fit here: A second row needs 1.33 m of bed depth behind the edge; this bed has 0.9 m. Deepen the bed in Shape to make room for it.

| spacing | plants | m apart | edge covered (m) | status |
|---|---|---|---|---|
| Open | 5 | 0.71 | 3.76 | not met |
| Standard | 7 | 0.57 | 4.27 | not met |
| Close | 8 | 0.46 | 4.1 | not met |

Limit: What no option changes: 3 positions of the row cannot be planted — they fall in the ground kept free around the existing tree (0.6 × its canopy). The tree’s position or canopy, or the bed, would have to change.
Mix: Only Gaultheria shallon qualifies for the screen row in this bed, so there is no mix to choose.

## C · Compose → Grow: version v-5gja8

| bed | arrangement | plants in the preview | plants generated | identical (species, role, position) | same as the engine's default |
|---|---|---|---|---|---|
| North bed | single row | 7 | 7 | yes | yes |
| East bed | clustered patches | 16 | 16 | yes | no |
| West bed | naturalistic drifts | 4 | 4 | yes | yes |
| Tree island | naturalistic drifts | 4 | 4 | yes | yes |

Kept on the version itself: `preview_match` = 31 plant objects compared, identical: **True** (bed, species, role and position of every plant object, Compose preview against this version).
Grow drew 31 plant symbols for 31 plant objects; the schedule totals 31 (Arctostaphylos uva-ursi × 16; Gaultheria shallon × 15). Validation: True; every plant inside its bed: True.
Ground evaluation of the version: East bed — patches, 16 plants, 67 % under crowns; West bed — drifts, 4 plants, 69 % under crowns; Tree island — drifts, 4 plants, 46 % under crowns.
Screen evaluation: not met, 4.27 of 6 m.

First plant objects of the chosen bed (each one is also in the preview):
- `plant-008` Arctostaphylos uva-ursi · ground · [5.35, 0.2] m · in the preview: True
- `plant-009` Arctostaphylos uva-ursi · ground · [5.53, 0.2] m · in the preview: True
- `plant-010` Arctostaphylos uva-ursi · ground · [5.72, 0.21] m · in the preview: True
- `plant-011` Arctostaphylos uva-ursi · ground · [5.43, 0.38] m · in the preview: True
- `plant-012` Arctostaphylos uva-ursi · ground · [5.63, 0.38] m · in the preview: True

## Back to Compose: East bed → Rhythmic rows (version v-5hb2b, parent v-5gja8)

| bed | plants before → after | same plants as the previous version |
|---|---|---|
| North bed | 7 → 7 | yes |
| East bed | 16 → 26 | no — re-arranged |
| West bed | 4 → 4 | yes |
| Tree island | 4 → 4 | yes |

Identical to the preview again: **True** (41 plant objects). Versions in the project: 2.

Cover and continuity are geometric estimates on claimed mature sizes. Nothing here measures pollinators, biodiversity or performance.
