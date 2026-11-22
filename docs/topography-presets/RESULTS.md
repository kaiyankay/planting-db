# Topography + Planting Systems — results

2026-11-21 · branch `feature/topography-presets` (from `main` d577104) · not merged, not published · the public site is untouched.
Brief: *Planting Intelligence — Topography + Planting System Presets* (2026-11-21). Architecture note: [ARCHITECTURE.md](ARCHITECTURE.md).
All figures below are recorded by the page itself during the replay `design/index.html?script=topo&fresh=1` and stored in
[demo-data.json](demo-data.json); the checks are in `eval/topo-tests-2026-11-21.md`.

Demo site (one sentence, typed on Imagine):
*"8 × 5 m backyard; north fence; an existing tree on the east; mainly partial shade; privacy wanted; low maintenance after establishment."*
→ 8 × 5 m site model, tree at 7, 2.5 m (position estimated, crown assumed 1.5 m), light part-shade (stated), four suggested beds:
North bed (Screen + Ground Cover), East bed, West bed, Tree island (Ground Cover). Knowledge snapshot 2026-11-13, seed 42.

## The acceptance question

**When I change the terrain, what changes in the planting design, and why?**
The ground gets a height and a slope at every point (one grid → contours, heightmap, 3D surface, the height under each plant). Whether
plants *move* depends on one switch the page names a design heuristic: the planting limit on slope. With it off, nothing moves — and the
page says so. With it on, the engine refuses every position on ground over the limit, shows each one, and the measures follow: on the demo
site a hand-made mound in the North bed takes 14 positions, the bed goes from 19 to 13 plants, and the Screen falls from 8 of 8 m
(uncertain) to 5.1 of 8 m (not met) with one gap. Beds away from the mound keep every plant. Nothing is said about water, sun or species
tolerance, because nothing is known about them.

**When I change the planting system, what changes in the spatial composition, and why?**
The roles change, and with them the species, the operators and the measures. On the same North bed, same snapshot, same seed:
no system = a row and a ground fill (19 plants); Layered Screening = structure row + lower ground layer + accents (19 plants, 4 species,
1.15 m between layers); Woodland Edge = no row at all, one shrub at the crown edge and an open ground layer (125 plants, Screen 0 of 8 m,
not met — the system sets groups, not a row). Each role is filled only by species whose records meet its requirements; a role nobody can
play stays empty with the reason.

**Can it explain both without inventing evidence?**
Every plant object opens a six-step chain: site conditions → ground → spatial function → system role → species checks with claim ids →
placement rule; each step is tagged stated / claims / design heuristic / unknown. Matrix Planting and the "spring ephemerals" layer are
shown as *insufficient evidence* rather than filled.

## Status against the brief

| item | status | note |
|---|---|---|
| §2 code audit + ARCHITECTURE.md | done | [ARCHITECTURE.md](ARCHITECTURE.md) |
| §3 terrain data model with status / source / provenance, xy→z | done | `design/js/terrain.js`; `sampleZ` is the only xy→z function |
| §3 no terrain → "Elevation unknown"; flat 3D plane labelled a display assumption | done | A2, B18 |
| §3 conceptual forms flat / gentle slope / berm / swale | done | each lists its assumed numbers |
| §3 grayscale heightmap upload, z range, relative heights without a range | done | upload reads pixels only; file dialog not driven in the replay (a synthetic image goes through the same code) |
| §3 ordinary photo is not a heightmap; "not analysed" | done | colour → reference only, cannot be confirmed; grayscale → needs the user's confirmation (pixels cannot tell a heightmap from a B/W photo) |
| §3 DEM / GeoTIFF | interface only | `terrain.fromDem()` (the only path to `measured`); no importer, no UI |
| §3 Plan / Heightmap / Terrain 3D from one grid | done | same fingerprint in all three (A8, A9) |
| §3 height range, light editing, Apply / Undo / Reset, source + assumptions | done | brush (raise / lower, 3 sizes, 3 steps); no control-point editor |
| §3 plants and existing tree stand on the ground in 3D; x/y, beds, ids unchanged | done | A22, T11 |
| §3 slope (rise/run, % and degrees) and aspect from the grid | done | aspect is reported, not used |
| §3 slope plantability constraint as a labelled heuristic, adjustable | done | 20 / 25 / 33 / 50 %; default 33 % |
| §3 potential low spot, no wetness asserted | done | geometry only (T10); none occurs in the demo terrain |
| §3 terrain change → visible change or an explanation of no change | done | A10, A13, A16–A19 |
| §4 preset schema: context, roles, eligibility, arrangement, parameters, measures, provenance | done | `design/js/presets.js`, schema `planting-system/0.1`; no species id in the file (Y1) |
| §4 Layered Screening | done | structure + ground at the foot + accent |
| §4 Woodland Edge / under-tree layering | done | existing canopy (site) + under-crown ground + crown-edge shrubs + open ground + ephemerals (no evidence) |
| §4 Matrix-based as candidate | done as "unsupported" | `insufficient species/role evidence`; not selectable |
| §4 Compose: recommendation, comparison cards, role profile, key parameters, advanced folded, before/after | done | one-line strip by default, opens to the comparison (keeps the objective in the first view) |
| §4 existing Screen / Ground Cover controls and trace keep working | done | 258 + 235 + 218 earlier checks pass |
| §5 Demo A, Demo B, replayable | done | `?script=topo` (+ `&stop=<key>`) |
| §5 "Why this plant here?" site → role → claim → rule | done | chain under the existing trace in Grow |
| §5 Plan · Algorithm · Presentation · 3D · schedule · trace on one version | done | B17 |
| §7 preview URL | **not published** | needs Kay's go-ahead (publishing goes into the public repository); local commands below |

## Key algorithms and heuristics

| what | rule | kind |
|---|---|---|
| height at a point | bilinear between the four grid nodes; `z = zMin + v·(zMax − zMin)`; null without an elevation range | geometry |
| slope | central difference one cell wide (one-sided at the grid edge); `% = 100·√(dz/dx² + dz/dy²)` | geometry |
| contours | marching squares on the same nodes; interval = the "nice" step giving ≤ 10 lines | geometry |
| low spot | interior node ≥ 2 cm below all eight neighbours | geometry + threshold |
| **slope planting limit** | `placeable()` refuses a position where slope > limit (default 33 %, ≈ 1 : 3) | **design heuristic**, off by default |
| plantable ground | bed − no-plant zones − 0.6 × crown radius at trunks − ground over the slope limit | geometry + heuristics |
| heightmap check | colour share > 2 % of sampled pixels → not a heightmap; grayscale → ask | pixel statistics, no recognition |
| role qualification | each layer's `requires` list answered by `knowledge.js` (function link, gates, claimed height, leaf retention, light labels, growth form, recorded interest) | claims |
| "lower than / taller than" a layer | claimed mature heights compared (the height used for the plan, and the full claimed range for *uncertain*) | claims |
| shade under a crown | species must record a tolerance of the light one step shadier than the stated site light | claim-based rule of the preset |
| crown-edge band, shrub group size, accent ratio, ground mix size | 1.2 m · 3 · 1 in 4 · 2 | **design heuristics**, adjustable in Compose |
| zones under a tree | distance from the trunk vs the crown radius (stated, or assumed 1.5 m) | geometry on an assumption |
| suggestion | Screen edge → Layered Screening; crown reaches the bed → Woodland Edge; else none | rule, shown as "not a decision" |

## Demo A — terrain (before → after)

| step | result |
|---|---|
| no terrain | elevation `unknown`; `sampleZ` = null; 0 contours; preview 64 plants (N 19 · E 16 · W 14 · island 15); Screen 8 of 8 m, uncertain |
| colour picture offered | `reference-only`, shown "not analysed", no confirm button, no terrain; `fromImage(…, confirmed)` still returns none |
| grayscale picture offered | `needs-confirmation`; after confirming: conceptual, `imported-grayscale`, range null → relative heights, no metres, no slope; "no position changes: the terrain has relative heights only". Discarded. |
| Gentle slope (preview → Apply) | conceptual, 0–0.25 m, "an assumed 5 % fall"; z north 0.25 / centre 0.125 / south 0 m; slope 5 % toward south; 128 contour segments in Plan = Heightmap (640 cells) = 3D mesh (y 0–0.25, same fingerprint `t-i0vg1w`) |
| …planting | 64 → 64, same positions; every plant now carries `ground {z, slope 5 %, aspect south}`; reason given: gate off |
| brush at 2, 4.4 m (2 stamps, 1 m, +0.5 m) | draft z 0.22 → 1.148 m; local slope 5 → 104.75 %; applied terrain still 0.22 m until Apply; 3D mesh at that point 1.148 m; far ground unchanged |
| …applied, gate off | 64 → 64, same positions, although the North bed now has slopes up to 114 % — "the slope gate is off, so slope limits nothing" |
| gate thresholds on that ground | 20 %: 16 refused · 25 %: 15 · 33 %: 14 · 50 %: 12 |
| gate on the 5 % slope (below threshold) | 0 refused, positions identical to no terrain |
| gate 33 % (preview → Apply) | 64 → 58 plants; 14 positions refused, all in the North bed, each marked × on the plan; North bed 19 → 13; Screen 8 of 8 m (uncertain) → 5.1 of 8 m (not met), 1 gap; East, West, island: every position unchanged; outline, tree, beds identical |
| Generate | version = preview (58 objects); `version.terrain` (fingerprint, gate, 14 refused); schedule 58 = plan 58 = 3D 58; every plant's 3D height = `sampleZ` (max 1.159 m); North bed mean slope 27.9 %, 2.68 m² over the limit |
| Reset terrain afterwards | generated version untouched; preview back to the no-terrain planting; Undo restores the ground |

## Demo B — planting systems (same site, snapshot 2026-11-13, seed 42, elevation unknown)

North bed (8 × 1.2 m, Screen on the north edge + Ground Cover):

| | No system | Layered Screening (suggested) | Woodland Edge |
|---|---|---|---|
| layers | screen row · ground | structure 9 · ground at the foot 8 · accent 2 | canopy (existing) · under-crown ground 0 · crown-edge shrubs 1 · open ground 124 · ephemerals — |
| species | *G. shallon*, *V. ovatum* / *A. uva-ursi* | *G. shallon* + *V. ovatum* / *A. uva-ursi* (+ *P. munitum*, qualifies, no room) / *A. millefolium* | *V. ovatum* / *A. uva-ursi* + *A. millefolium* |
| operators | along_edge, fill_drift | along_edge, fill_drift, repeat_accent | cluster_at_canopy_edge, fill_drift |
| plants | 19 | 19 | 125 |
| Screen | 8 of 8 m, uncertain | 8 of 8 m, uncertain | **0 of 8 m, not met** — "no row is set" |
| ground under crowns | 7 % | 7 % | 70 % |
| system measures | — | 1.15 m between layers · 2 accents · roles 2/2 + 1/1 | 18 % of under-crown ground covered · 1 shrub group · roles 2/2 + 2/3 |

Parameter: accent ratio 1 in 4 → none: 2 accents → 0, ground 8 → 10; recorded as a before/after.

Tree island (4.43 m², 78 % under the assumed crown, Ground Cover):

| | No system | Woodland Edge (suggested) | Layered Screening |
|---|---|---|---|
| result | 15 plants: *A. uva-ursi* + *G. shallon* in drifts, 62 % ground under crowns | 11 plants: under-crown ground *G. shallon* 2 · crown-edge shrubs *V. ovatum* 2 · open ground *A. uva-ursi* + *A. millefolium* 7; 37 % of the under-crown ground covered; 67 % of ground plants evergreen | does not apply: no Screen function, no Screen edge |

Who qualifies under the crown, from the records: *Achillea* and *Arctostaphylos* refused ("no tolerance of shade recorded") and used beyond the
crown instead; *Gaillardia* refused (recorded Deciduous); *Cornus nuttallii* refused (a tree wider than the bed); *Gaultheria*, *Polystichum*
qualify, uncertain (light under the crown is a range; *Polystichum* records both Evergreen and Deciduous). Shrub layer: *Cornus sericea*
refused (a 1.27 m crown cannot stand in the band), *Gaultheria* refused (not taller than the ground layer — it is the ground layer),
*Vaccinium ovatum* qualifies. Spring ephemerals: **empty — the database has no phenology facet.** Matrix Planting: **insufficient
species/role evidence — no longevity facet, no grass or sedge**; listed, not selectable.

Generated with both systems: 60 objects = schedule = Plan = Algorithm = Presentation = 3D; equal to the Compose preview.

Both together (mound + 33 % gate + both systems): 54 plants, 14 refused; North bed keeps its three layers (6 · 5 · 2); Screen 5.1 of 8 m,
not met; a structure plant's chain reads "stands at 0.23 m on a 5.05 % slope falling south … slope gate 33 %: 5.05 % passes — a design
heuristic, not a tolerance of this species".

## Screenshots (1440 × 900, headless Chrome, `tools/topo_shots.sh`)

`docs/topography-presets/screenshots/`

- A01 elevation unknown · A02 photo not analysed · A03 grayscale needs confirmation · A04 slope preview · A05 plan with contours ·
  A06 heightmap · A07 terrain 3D · A08 brushed mound (heightmap, preview) · A09 mound in 3D · A10 gate preview with refused positions ·
  A11 gate applied · A12 Compose on the terrain · A13 Grow plan · A14 Grow 3D
- B00 system strip (default) · B01 North bed, no system · B02 Layered Screening · B03 Woodland Edge on the same bed ·
  B04 Tree island, no system · B05 Woodland Edge · B06 Grow plan · B07 the "why" chain · B08 Algorithm · B09 Presentation · B10 3D
- AB1 Compose with terrain and systems · AB2 Grow plan. (AB3, the 3D view of the combined case, comes out blank in headless
  software GL at the end of the long replay; it was checked in a real browser — 54 plants on the mound, the gap in the row visible —
  and its data is test AB1. Open `?script=topo&fresh=1&stop=ab-grow-3d` to see it.)

## Tests (2026-11-21, headless Chrome, design server)

| suite | result | file |
|---|---|---|
| topography + systems (34 unit lines T1–T20, Y1–Y14 · Demo A 23 · Demo B 20 · both 1 · 3 run checks) | **81 / 81** | `eval/topo-tests-2026-11-21.md` |
| engine tests page (166 earlier + 34 new) | 200 / 200 | `design/tests.html` |
| design workspace | 258 / 258 | `eval/design-tests-2026-11-21.md` |
| spatial proposal | 235 / 235 | `eval/spatial-tests-2026-11-21.md` |
| UX (1440×900, 1280×800, 1024×768) | 218 / 218 | `eval/ux-tests-2026-11-21.md` |
| platform (builds the static site from this branch, then checks it) | 67 / 67 | `eval/platform-tests-2026-11-21.md` |

Two things the suites caught and that were fixed: slope was understated on the outer half-cell of the grid (now one-sided there); the
planting-system section first stood above the objective and pushed its result and controls out of the first view at 1024 × 768 — it is
now a one-line strip that opens.

## Run it

```bash
python3 -I tools/design_server.py --port 8768
```
```bash
open "http://127.0.0.1:8768/design/index.html?fresh=1&script=topo"
```
```bash
python3 -I tools/topo_tests.py
```
```bash
sh tools/topo_shots.sh
```

Stops for the replay (`&stop=`): `a-unknown a-photo a-gray a-slope-preview a-slope-plan a-heightmap a-slope-3d a-edit-preview a-edit-3d
a-gate-preview a-gate-applied a-compose a-grow-plan a-grow-3d b-strip b-north-none b-north-layered b-north-woodland b-island-none
b-island-woodland b-grow-plan b-grow-why b-grow-algo b-grow-present b-grow-3d ab-compose ab-grow-plan ab-grow-3d`.
By hand: Shape → rail **Terrain**; Compose → select a bed → **Planting system · compare**; Grow → click a plant → **Trace**.

## Partly done / not done

- Heightmap upload through the real file dialog was not exercised automatically (the replay feeds a synthetic image to the same functions).
- No height control points (brush only); no DEM importer; no address or photo analysis.
- The slope gate is the only way terrain changes placement. Slope does not change species choice, spacing, or the Screen's height.
- Woodland Edge covers little of the under-crown ground on the demo island (37 %): two species with different crown sizes share one drift lattice. Patches or rhythm give more; the default was not tuned to look better.
- On the North bed the under-crown layer of Woodland Edge is chosen but places nothing (0.2 m² of the bed lies under the crown) — shown as such.
- Aspect, low spots: reported only. Typed edits ("make it steeper") are not understood by the offline parser.
- The platform's full trace page (`platform/js/trace.js`) still explains Screen and Ground Cover only; system roles are explained by the new chain in Grow.

## Decisions for the designer (Kay)

1. **Slope limit**: is 33 % (1 : 3) the right default, and should it stay one number — or differ by layer (ground cover on steeper ground than shrubs)? Any source you want cited would replace "heuristic".
2. **Should slope ever select species?** *Arctostaphylos uva-ursi* records "erosion control" as ecological value. Using that on slopes would be a new rule from an existing claim; it is not done.
3. **Screen on a mound**: should a row standing on higher ground count toward the target height? Today it does not.
4. **Layered Screening vs "no system"**: the system adds the accent layer and the height rule; the row and fill are the engine's earlier default. Is that the layering you mean, or do you want a distinct mid layer (the ten species give no clear mid-height candidate)?
5. **Woodland Edge on a bed that also wants a Screen**: now it reports Screen not met. Alternative: refuse the system there, or combine row + crown-edge groups.
6. **Role vocabulary**: "clumping / clonal spreading" (slide p. 34) is not used because the database records habit words only. Add a spreading-mode facet to the database, or accept habit "Spreading" as a proxy?
7. **Under-crown light**: read as "stated light … one step shadier". Do you want the tree's own density (species, evergreen or not) recorded to sharpen it?
8. **Crown-edge band 1.2 m, group of three, accent 1 in 4**: confirm or change the defaults.
9. **Matrix Planting**: which facets would you add first to make it possible — longevity, graminoid species, bloom period?
10. **Preview**: publish this branch as a separate preview (as earlier rounds did), and where?
