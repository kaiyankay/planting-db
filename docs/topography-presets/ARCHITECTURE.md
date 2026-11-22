# Topography + Planting Systems — architecture note

2026-11-21 · branch `feature/topography-presets` · audit of the V4.3 source (`planting-db` main, d577104) and where the two new layers sit.
Source of truth is this repository; the public site (`planting-intelligence`) is a static build made by `tools/build_platform.py` and is not edited by hand.

## 1. How the design model flows today

```
Imagine (words) ──intent.js──▶ facts · values · functions · unknowns          (offline rules; a live model only behind design_server.py)
        │                         concept.js: a unitless sketch until a size is stated
        ▼
Shape   project.site = { boundary, scale, features[tree | no-plant-zone], beds[], conditions{value,status,source}, history }
        spatial.js proposes beds (edge band · island · infill) from the functions; boundary.js edits the outline
        ▼
Compose bed.functions[] (Screen / Ground Cover = arranged; Scrim, Canopy, Barrier = recorded only — FUNCTION_SUPPORT)
        bed.composition = the designer's choices for one bed (pattern, rows, grain, density, variation, mix)
        engine.assemble(bed):  knowledge.js gate(species, conditions) + functionEvidence + size proxy  →  candidates with reasons → picks
        engine.generate(beds): operators along_edge · stagger · fill_drift/rhythm/patch · repeat_accent → plant objects
        The inspector never draws an idea: every option is `dryRun()` / `altRun()` = the real engine on a copy.
        ▼
Grow    DesignVersion (immutable) = plant_objects[] + groups + zones + assemblages + evaluation + assumptions + unresolved
        one version → Plan · Algorithm · Presentation · 3D (garden3d.js) · schedule · export · Decision Trace (platform/js/trace.js)
        a version is named by the fingerprint of its inputs (trace.js inputFp); Undo moves a pointer, nothing is rewritten
```

Three things made the extension cheap: **one engine** behind every preview, **`bed.composition`** as the single place for per-bed design
choices (already part of the bed fingerprint), and **`placeable()`** as the single gate every placement, edit and validation passes.

## 2. Where terrain and presets live (one data source each, no second engine)

| new thing | lives in | read by |
|---|---|---|
| **Terrain** — one elevation grid | `project.site.terrain` (`design/js/terrain.js`): `status` unknown · conceptual · measured, `source_type`, `origin_m`/`extent_m` (the site bbox in the model's metres), `elevation_range_m` or null, `grid {cols, rows, values 0…1}`, `provenance {source, method, assumptions, confirmed_by_user}`, `gate {enabled, max_slope_pct}`; own undo stack `site.terrain_history` | `sampleZ(t,x,y)` is the only xy→z function. Slope, aspect, contours, low spots are **derived** each time (`slopeAt`, `contours`, `lowSpots`, `analyse`) and never stored. 2D contours/heightmap (`terrainui.js overlaySvg`), the 3D surface (`garden3d.js buildTerrain`) and the engine all call the same functions on the same grid. z is never written into an x/y pair. |
| **Slope gate** | `terrain.gate` | `engine.placeable()` — so generation, hand edits, typed edits and `validate()` share it; `freeArea()` removes steep ground from the plantable area the cover estimate uses |
| **Planting system** (preset) | rules: `design/js/presets.js` (`PRESETS`, schema `planting-system/0.1`); choice: `bed.composition.system` + `system_params` | `engine.assemble()` asks `presets.plan()` for the layer plan and fills its own `picks`; `engine.generateBed()` places the layers with its operators. `presets.js` places nothing. |
| per-version records | `version.terrain` (fingerprint, gate, refused positions), `version.systems`, `assemblages[bed].system` (layers, candidates with checks), `plant.ground {z_m, slope_pct, aspect}`, `plant.layer` / `plant.system`, `evaluation.terrain`, `evaluation.systems` | Grow inspector, the trace chain (`presets.chain`), tests |
| fingerprints | terrain fingerprint appended to `trace.inputFp`, the dry-run key and `siteFp` **only when a grid exists** | previews, "same as generated version", the stale-design banner |

A site without a terrain and a bed without a system produce byte-identical versions to V4.3 (tests T1, T11, Y14; the 166 earlier engine tests still pass).

New operators, documented where they are implemented (`engine.js generateBed`): `zone_by_canopy` (distance from an existing trunk: kept-free · under the crown · band astride the crown edge · beyond) and `cluster_at_canopy_edge` (shrub groups in that band). The ground fill of a zone is the existing fill operators with a region.

UI: `terrainui.js` (Shape: Terrain panel, `Plan | Heightmap | Terrain 3D`, brush, upload check, preview → Apply) and `systemui.js` (Compose: system cards from real engine runs; Grow: system / terrain read-outs and the "why" chain). `app.js` is touched at nine points (imports, install, `act`, rail button, panel, canvas hook, Compose section, Grow section, plant card).

## 3. What the evidence supports — and what it lacks

Ten species; facets recorded: exposure, water, soil, height/spread ranges, growth form, habit words, evergreen, interest, ecology, maintenance, origin, invasive; function links for five spatial functions (KG rules).

| role a system needs | can the database evidence it? |
|---|---|
| screen structure (reaches a height, linked to Screen) | yes — *Gaultheria shallon*, *Vaccinium ovatum* (uncertain: height ranges straddle 1.8 m); *Cornus sericea* by link but too wide for a 1.2 m bed |
| ground layer lower than the structure | yes — claimed heights compared (`lower_than`) |
| seasonal accent | partly — "interest" / "ecology" recorded for some species; no bloom months |
| shade-tolerant, winter-present ground under a crown | yes — light labels (Filtered / Deep shade) + leaf retention; *Polystichum* is "uncertain" (both Evergreen and Deciduous recorded) |
| shrub layer at a crown edge | yes — growth form Shrub + shade labels + height; one species fits a small bed |
| **clumping vs clonal spreading** (slide p. 34 "Under trees") | **no** — habit words exist (spreading, dense, upright) but not how a plant spreads; not used |
| **spring ephemerals / phenology / bloom sequence** (p. 32, 36) | **no** — no phenology facet; the layer is kept and reported `insufficient evidence` |
| **long-lived matrix, emergents, dynamic fillers** (p. 34–36) | **no** — no grass or sedge, no longevity facet → Matrix Planting is listed, `insufficient species/role evidence`, not selectable |
| species **associations** (who grows well with whom) | **no** — no such claim; a system here is a spatial rule set, said so in every evaluation |
| slope tolerance, erosion suitability per slope | **no** — hence the slope gate is a design heuristic, never a species filter |
| the existing tree's species, height, shade density | **no** — the canopy layer is "provided by the site", species not recorded |

Site information missing for terrain-driven decisions: drainage, soil moisture, catchment, sun path. So: a low spot is geometry only; aspect is reported, not turned into light.

## 4. Measured · claimed · assumed · heuristic

| kind | examples |
|---|---|
| **measured** | nothing yet. `status: 'measured'` is reachable only through `terrain.fromDem()` (an elevation grid supplied as such); no UI imports one in this round |
| **stated by the user** | site size, light word, the elevation range typed for a heightmap, "this picture is a heightmap" |
| **claimed (database)** | size ranges, light / water / soil labels, leaf retention, growth form, function links — every check carries claim ids |
| **conceptual** | Flat / Gentle slope / Berm / Swale forms; brushed ground; an uploaded heightmap (always conceptual, even confirmed) |
| **assumed** | tree crown radius 1.5 m when not stated; 5 % fall of the slope form; berm / swale dimensions; "the picture covers the site bbox, north up"; under a crown light = stated light … one step shadier |
| **heuristic (implementer's, adjustable, labelled in the UI and in the version)** | slope planting limit 33 % (`terrain.HEURISTICS`); crown-edge band 1.2 m, shrub group size, accent ratio (`presets.js tunable_parameters`); every spacing factor and clearance already in `engine.ARRANGEMENT_RULES`; canopy keep-out 0.6 × radius; low-spot threshold 2 cm; grid cell ≈ 0.25 m |
| **display only** | Terrain 3D vertical exaggeration; nominal 1 m relief for relative heights; the flat plane when elevation is unknown ("flat display assumption") |
| **method reference (structure, not parameters)** | Cortes, *Generative Planting at Scale* (2024): layers by functional role p. 28–32; "substitute species, keep layers and roles" p. 32; role sets incl. Matrix and Under trees p. 34–36; topo → slope / elevation as constraint layers p. 69–72; iterating topography p. 128–130 |

## 5. Minimum deliverable — and what is deliberately not done

Done in this round: terrain model + three synchronized views + edit / preview / Apply / Undo / Reset; heightmap upload with an honest check; slope and aspect from the grid; slope gate in placement and evaluation with refused positions shown; plants on the ground in 3D; two planting systems with different layers, qualification, operators, parameters and measures; a third shown as unsupported; before/after for every change; a six-step "why" chain; replayable Demo A/B; unit + replay tests.

Not done (by decision, listed so nobody assumes them):

- No DEM / GeoTIFF import, no address-to-elevation lookup, no reading of terrain from a photograph (the interface `fromDem` exists).
- No drainage, catchment, soil-moisture or rain-garden inference; no sun exposure from aspect; no cut-and-fill.
- Slope does not change species choice, spacing along the surface, or the Screen's height (a row on a berm is not credited with the berm).
- Beds are not reshaped by terrain; a terrain change never edits a generated version (it is marked stale).
- No new tree is placed (still no tree-placement rule); the existing tree is not planted, only read.
- No matrix operator, no succession or phenology, no plant-association data.
- No change to the knowledge database, the Imagine page, the visual language, or the public site.
