# Design Workspace — visual and interaction upgrade, 2026-11-07 (technical and test report)

Brief: *Planting Intelligence — Phase 2 视觉与交互升级* (2026-11-07). Delivered in `design/` on top of the Phase 2 workspace: a canvas-first layout with folding panels, an expressive 2D planting plan in two modes (technical plan · presentation), an interactive three.js 3D garden, synchronised with the lasso + language editing, Undo/Redo, evidence and exports that already existed. The spatial algorithm, the knowledge adapter, the site gates, the canonical plant data and the Phase 1 Explorer are unchanged. Tests `tools/design_tests.py` **53 / 53** (`eval/design-tests-2026-11-07.md`); screenshots `brain/screenshots/design-visual/01…10`.

## 1. Preview

- Local: `python3 -I tools/design_server.py` → <http://127.0.0.1:8768/design/> (`?journey=1&fresh=1` replays the demonstration; `&stop=N`, `&mode=plan|present|garden`, `&sel=plant-003`, `&panels=closed` set a state).
- GitHub Pages (after push): <https://kaiyankay.github.io/planting-db/design/>.
- Keys: **1 / 2 / 3** switch Plan / Presentation / 3D garden; wheel = zoom, right-drag or Space-drag = pan (2D); orbit / wheel / right-drag in 3D; click any plant in any view for its card and evidence.

## 2. What was studied, what was used

**Pollinator Pathmaker** (pollinator.art/pathmaker, how-it-works; walked through in the browser to the generated garden): the garden fills the page over a graph-paper ground; the toolbox is a floating card; after generation, painted plant sprites with distinct silhouettes form drifts in an isometric 3D scene; a bottom bar holds 3D / plan toggles, a season timeline, a "click on a plant to learn about it" hint, "plant names" toggle, and the Planting Instructions. Borrowed as interaction ideas: full-page garden, floating folding panels, click-a-plant → info card, names toggle, plan ↔ garden toggle in one bar, graph-paper ground. Not borrowed: its painted plant artwork, models, code, pollinator objective or step-wizard flow.

**Open-source projects evaluated** (licences checked; details in `design/README.md`):

| project | licence | decision | why |
|---|---|---|---|
| three.js r186 (`brain/vendor/three`, already vendored) | MIT | **used** for the 3D garden | mature, no build step, already in the repository |
| three.js `examples/jsm/controls/OrbitControls.js` 0.186.0 | MIT | **used** (vendored this round, `brain/vendor/three/examples/jsm/controls/`) | rotate / zoom / pan with damping; imports only from `three` |
| yomotsu/vegetation 0.1.0 | MIT | evaluated, **not used** | procedural, ESM, no assets — but only a conifer `FirTreeMesh`, grass and flowers; no shrub, fern or broadleaf generator and no crown-radius control; `dist/` not in the repo (build needed) |
| SkyeShark/SeedThree 0.1.0-alpha | MIT | evaluated, **not used** | a Vite app, not a library (`private: true`, no entry point); WebGPU-first; texture and audio assets with their own terms; three 0.184; alpha |
| svg.js 3.2.8 | MIT | evaluated, **not used** | an object API that would replace the existing string-built SVG for no gain; no pan/zoom in core |
| timmywil/panzoom 4.6.2 | MIT | evaluated, **not used** | would own the transform state and fight the existing plant-drag / lasso pointer handlers; a 40-line transform on one `<g>` does wheel-to-cursor zoom and drag pan with full control |

Plant geometry in 3D and the 2D symbols are therefore **own procedural proxies** (`design/js/plantforms.js`, `render.js`, `garden3d.js`): no external plant models, textures or artwork.

## 3. What was implemented

**Workspace (Output 1).** The stage is the page. Conversation (left) and Context (right) float over it and fold to edge tabs; the Schedule / Versions / Evaluation / Model drawer folds to a 50 px bar; a view bar at the bottom switches Plan · Presentation · 3D garden and toggles Names · Winter · Zones · Fit / Frame; a plant card appears on click in any view with crown radius, height status, leaf retention, the function status and a "full evidence" button. Natural language stays the primary control (the conversation panel, the demo journey and every edit are unchanged).

**2D plan (Output 2).** Two modes from the same plant objects: *Plan* — technical symbols per growth form (tree: canopy circle with radial branch lines; shrub: lobed outline; fern: radiating fronds; herbaceous: scalloped outline with flower marks; ground cover: dotted mat), labels, zones, scale bar, grid; *Presentation* — layered, lit silhouettes per growth form with accent dots from the species' colour claims, soil-toned beds, lawn, shadows, drifts reading as masses. Symbol detail is seeded by plant id (deterministic); position and crown radius are the model's. Wheel zoom to cursor, pan, Fit. The exported SVG now carries the plan symbols with the plant id, species id, position and radius on every group.

**3D garden (Output 3).** three.js scene built from the same DesignVersion: graph-paper ground, lawn (site boundary), raised soil beds, open zones, the existing tree, and one group per plant object — tree (trunk + stacked flat-shaded crowns, twigs in winter), shrub (clustered low-poly masses), fern (radiating fronds), herbaceous (mound + stems + flower heads), ground cover (low mats). Heights and crown radii come from the claim proxies; a plant with no height claim is drawn at a nominal height and translucent. Hemisphere + directional light with soft shadows, fog, OrbitControls (rotate / zoom / pan, damping), raycast hover and click → plant card + evidence; names as sprites; Winter mode greys deciduous plants from their leaf-retention claims (not a season simulation); preview removals as red wireframes, additions and selection as ground rings. 37 plants = 473 meshes; renders smoothly in Chrome on an integrated GPU and under headless SwiftShader.

**Synchronisation (Output 4 / D).** Lasso in 2D + "Too dense here, but keep the privacy." → typed command → scoped preview; the preview shows in Plan, Presentation and 3D at once (removed plants red in all three); Apply → new version → the 3D scene re-syncs from the model (test J8b asserts the garden's plant count equals the applied version); Undo / Redo, direct drag / delete / add, evidence, exports and the saved `designs/demo-backyard.json` are untouched. Planting-bed drawing, calibration, image overlay and address reference work as before, now with pan / zoom.

## 4. Before / after (same design, same data: `designs/demo-backyard.json`, seed 42)

| state | 2D presentation | 3D garden | plan |
|---|---|---|---|
| **before** — generated v1, 37 plants | `02-presentation-before.jpg` | `03-garden-3d-before.jpg` | `01-workspace-plan-before.jpg` |
| **preview** — lasso right side, "too dense here, keep privacy" (19 targets, 5 to remove, screen row kept, nothing outside moves) | — | `05-lasso-preview-garden.jpg` | `04-lasso-preview-plan.jpg` |
| **after** — applied v2, 32 plants | `06-presentation-after.jpg` | `07-garden-3d-after.jpg` | `08-plan-after-schedule.jpg` |
| plant card + evidence in 3D · winter (leaf retention) | — | `09-plant-card-evidence-3d.jpg` · `10-winter-leaf-retention-garden.jpg` | — |

All taken by headless Chrome (1600 × 1000, SwiftShader WebGL) from the running app; nothing is a mock-up.

## 5. Data-backed vs illustrative (per species, shown on every plant card under "what the drawing rests on")

| trait | source | used by |
|---|---|---|
| growth form (tree · shrub · fern · herbaceous) | M29 reading of the sources (status shown) | symbol family, 3D builder |
| crown radius | half the claimed mature spread (one claim chosen deterministically, alternatives counted, disagreement flagged) | symbol size, 3D crown, spacing |
| height | claimed height range (median; conditioned ranges follow the stated light) or **unknown → nominal, translucent** | 3D height, "taller" edits |
| leaf retention | `evergreen` claims | Winter mode |
| habit words (dense · open · upright …) | `habit` claims | denser / more open silhouette |
| colour words | `colour` claims (foliage / flower / fruit not distinguished in the data) | accent dots / flower heads |
| silhouette, lobes, frond count, stems, texture, shading, lighting | **illustrative proxy** | — |

No species-specific drawing exists in the code: every symbol is derived from these facets, so an eleventh plant draws itself after `tools/pipeline.py`.

## 6. Performance and compatibility

- 2D: one `<g>` per plant, string-built SVG; 37 plants re-render in < 10 ms on each state change; zoom is a transform on one group.
- 3D: ~13 meshes per plant (473 total at 37 plants); shared geometries per growth form would cut this further if hundreds of plants are needed; shadow map 2048². Tested in Chrome 156 (the desktop app's pane) and headless Chrome with SwiftShader; WebGL is required for the garden — without it the app shows a notice and the 2D modes stay fully usable (the page never depends on 3D).
- No build step, no new network dependency: the only addition is the vendored OrbitControls (40 KB).

## 7. Original functionality (regression)

`tools/design_tests.py` 53/53: the 36 engine / model / interpreter invariants, the 12-step journey (now also J5b: one 2D symbol per plant object; J6: the 3D garden holds one object per plant; J8b: 3D re-synced after Apply), and the saved-file checks. Phase 1 `tools/explorer_tests.py` and `tools/validate.py` unchanged and passing. Canonical data, `brain/explorer/`, the pipeline and the spatial engine were not modified.

## 8. Limits and next work

- The 3D proxies are stylised low-poly forms, deliberately not photoreal; a per-species look would need art assets or verified morphology data the database does not hold.
- The presentation plan draws canopies at the claimed mature size; at 15 % massing overlap the symbols overlap by design, which reads as mass but hides individual positions — the Plan mode keeps them legible.
- No seasons: Winter is the only data-backed state (leaf retention); flowering times are not in the projection.
- Next: shared / instanced geometry for large sites, a bed-splitting tool, touch pinch on the 2D plan, and the live-model interpreter once a key is available.
