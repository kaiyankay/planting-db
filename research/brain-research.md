# Brain research — mechanism log (Track A)

2026-10-30. Only what was actually run tonight, and only what `brain/` reuses. No concept table, no alternatives.

Environment: the Claude desktop app's built-in browser (Chromium 152, WebGL2 via ANGLE/Metal on an Intel Iris 650). `node` is not installed on this machine, so no `npm`; the demo is plain ES modules served by `python3 -m http.server`.

## Run

### 1. 3d-force-graph — click-to-focus · RUN
https://vasturiano.github.io/3d-force-graph/example/click-to-focus/ (source: `example/click-to-focus/index.html`)

- What it does: on `onNodeClick`, computes a camera position at a fixed distance from the node along the ray from the origin and calls `Graph.cameraPosition(newPos, node, 3000)`; the library tweens position and look-at.
- Seen: the Les Misérables graph loads; clicking a node flies the camera in over 3 s.
- Reused in `brain/js/app.js → flyTo()`, changed in two ways: the approach direction is the current line of sight (camera → node), not the origin → node ray, so the view does not swing around the cosmos on every click; and the tween is a `requestAnimationFrame` loop that re-reads the node's live position each frame, because our graph re-heats on every expand and the node keeps drifting for a second or two after the click (the first version aimed at a stale position and missed).
- Holds at our scale: yes; ~80 nodes at rest, ~170 with several fields open.

### 2. 3d-force-graph — expandable-nodes · RUN
https://vasturiano.github.io/3d-force-graph/example/expandable-nodes/

- What it does: keeps the full tree in memory with `collapsed` flags, and on each click rebuilds the visible subgraph (`getPrunedTree`) and passes it to `Graph.graphData()`. Node objects are reused, so positions persist.
- Seen: a 300-node random tree starts as one red root; clicking expands children (green = leaf, red = collapsed, yellow = open).
- Reused in `visibleGraph()`: plants and fields are always visible; a field's claims and their sources appear only while the field is in `S.expanded`. Two additions: new points are spawned at their parent's position (`spawnAt`) so they visibly emerge from the field instead of flying in from the origin; and source nodes are shared across plants, so opening fields on two plants that cite RHS makes RHS a bridge between the clusters.
- Holds at our scale: yes. The pruned-tree approach is O(n) per click and n < 400.

### 3. 3d-force-graph — bloom-effect · RUN
https://vasturiano.github.io/3d-force-graph/example/bloom-effect/

- What it does: `import { UnrealBloomPass } from 'https://esm.sh/three/examples/jsm/postprocessing/UnrealBloomPass.js'`, `Graph.postProcessingComposer().addPass(bloomPass)` with strength 4, radius 1, threshold 0.
- Seen: the whole graph becomes one white glowing mass at those settings (screenshot taken during the run).
- Reused with strength 0.5, radius 0.4, threshold 0.38, so only bright (active) knowledge blooms and dimmed knowledge (opacity 0.07) stays below the threshold. The UMD bundle of 3d-force-graph contains its own copy of three.js; UnrealBloomPass is loaded from a second, vendored ESM copy of the same revision (r186). three.js warns "Multiple instances of Three.js being imported" — the official example has the same setup and it renders correctly. esm.sh was returning "no space left on device" errors tonight, so the pass and its three files are vendored from jsDelivr instead (`brain/vendor/three/`).
- Holds at our scale: yes; one full-screen pass, no visible frame cost at 1280×820.

### 4. 3d-force-graph — dynamic · RUN
https://vasturiano.github.io/3d-force-graph/example/dynamic/

- What it does: every second reads `Graph.graphData()`, appends a node and a link, and sets the data back; clicking a node removes it. The layout re-heats and absorbs the change.
- Seen: nodes accrete one per second from a single root.
- Reused for C2 (`addCandidate`): the candidate claim and a "you (candidate)" source node are appended to the model, the field re-expanded, and `graphData` re-set. Arrival is shown by growing the sphere from 2 % scale over 900 ms and by `Graph.emitParticle(link)` five times on the three links of the new path (plant → field → candidate → you); `emitParticle` is the library's own single-particle mechanism, listed in the README next to `linkDirectionalParticles`.
- Holds at our scale: yes.

### 5. 3d-force-graph README (API table) · READ, not an example
Used for: `nodeThreeObject` (own sphere + canvas-sprite label per node), `linkThreeObject` + `linkPositionUpdate` (own `THREE.Line` per link so opacity, dashes and curvature are under our control; `LineDashedMaterial` for model placeholders), `linkDirectionalParticles` / `linkDirectionalParticleColor` (evidence flow on a question), `onLinkClick` (relations), `d3Force('link').distance/strength`, `d3Force('charge')`, `warmupTicks`, `d3AlphaDecay`, `cooldownTime`, `onEngineStop`, `controls().target`.
Not used: `zoomToFit` — it fits the bounding sphere of a 3D-spread layout and leaves it tiny, so `fitNodes()` fits the centroid with depth-aware padding instead.

## Not run

- Cosmograph (https://cosmograph.app/) and cosmos.gl (https://github.com/cosmosgl/graph): not run. 3d-force-graph did not block, and the brief says not to switch unless it does. Their GPU layout is built for 10⁵–10⁶ points; with ~165 claims there is nothing for it to solve.
- 3d-force-graph "directional-links-particles", "custom-node-shape", "text-nodes" examples: not run; the API table was enough.
