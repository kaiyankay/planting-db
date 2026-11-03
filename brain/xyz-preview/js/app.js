// Planting Intelligence · XYZ Knowledge Graph (brief 2026-11-03).  A neural-looking 3D network over brain/data/xyz.json — the
// projection tools/build_xyz.py writes from the semantic graph kg.json.  Three entrances (Classification · Plant Knowledge ·
// Spatial Functions) open into growth forms, knowledge groups and spatial functions; every click reveals the real connections
// of one node; every line opens its evidence trace (claims, sources, context, verification, rule).  Nothing about the plants is
// written here: the file carries the nodes, the edges, the claims and the demonstration paths.
// Rendering: 3d-force-graph 1.80.1 (MIT, vendored) over three 0.186 (MIT, vendored); layout force-directed from the drawn links only.
import * as THREE from 'three';
import { load } from './xyz.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const C = { x: '#b8892b', y: '#4a7da5', z: '#9b5c86', plant: '#5f7f62', derived: '#8370b4', candidate: '#c6962f', unknown: '#b4553a', doc: '#8a8378', docVerified: '#5f5a52', nav: '#b5afa4', ink: '#2a2723', ink2: '#5f5a52' };
const HUB = { x: [-160, -30, 0], y: [0, 135, -40], z: [160, -30, 0] };
const DIM = 0.13;
const S = { M: null, Graph: null, visible: new Set(), revealedEdges: new Set(), expanded: new Set(), revealedBy: new Map(), selected: null, selectedEdge: null, pathFocus: null, history: [], trail: [], links: new Map(), mouse: { x: 0, y: 0 }, running: false };

// ------------------------------------------------------------------ boot
(async function boot() {
  try {
    const url = new URLSearchParams(location.search).get('data') || '../data/xyz.json';
    S.M = await load(url);
    initGraph(); initUi(); reset(false);
    window.xyz = { S, onNodeClick, selectNode, selectEdge, back, reset, fit, runPath, expand, collapse };   // for tests and the console
    $('#loading').classList.add('gone');
  } catch (e) { $('#err').textContent = explain(e); console.error(e); }
})();

function webglAvailable() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')); } catch { return false; } }
function explain(e) {
  if (/WebGL/i.test(e.message || '')) {
    return webglAvailable()
      ? `the browser could not create a WebGL context for the 3D view, although WebGL works in this browser.\nUsually there are too many 3D pages open (Chrome allows about 16 WebGL contexts): close other tabs with 3D graphs or maps, then reload.`
      : `WebGL is not available in this browser, so the 3D view cannot start.\nTurn on graphics acceleration (Chrome: Settings → System → "Use graphics acceleration" · Safari: it is on by default · Firefox: about:preferences → Performance), or open the page in another browser, then reload.`;
  }
  return `could not load: ${e.message}\n\nserve the planting-db root:  python3 -m http.server 8766  → http://localhost:8766/brain/xyz-preview/`;
}

// ------------------------------------------------------------------ colours, sizes, labels
const colourOf = n => n.kind === 'plant' ? C.plant : n.kind === 'concept' ? mix(C.y, '#ffffff', .22) : n.kind === 'cultivar' || n.kind === 'genus' || n.kind === 'family' ? mix(C.x, '#ffffff', .35) : n.kind === 'entrance' ? mix(C[n.dimension], '#ffffff', .3) : C[n.dimension] || C.doc;
function mix(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b); const h = v => Math.round(v).toString(16).padStart(2, '0'); return `#${h(r1 + (r2 - r1) * t)}${h(g1 + (g2 - g1) * t)}${h(b1 + (b2 - b1) * t)}`; }
const radiusOf = n => n.kind === 'entrance' ? 9 : n.kind === 'plant' ? 5.2 : n.kind === 'concept' ? 2.6 + Math.min(10, n.n_plants || 1) * 0.28 : n.kind === 'cultivar' ? 2 : n.kind === 'genus' || n.kind === 'family' ? 2.8 : 6.2;
const labelOf = n => n.kind === 'concept' && n.facet === 'height_band' ? n.label.replace(/\s*\(.*\)$/, '') : n.label;

function labelSprite(n) {
  const text = labelOf(n); const italic = n.kind === 'plant' || n.kind === 'cultivar' || n.kind === 'genus';
  const h = n.kind === 'entrance' ? 8.6 : n.kind === 'plant' ? 6.6 : n.kind === 'concept' || n.kind === 'cultivar' ? 5 : n.kind === 'genus' || n.kind === 'family' ? 5 : 6.4;
  const weight = n.kind === 'entrance' || n.kind === 'growth_form' || n.kind === 'y_group' || n.kind === 'function' ? 600 : 500;
  const px = 44, pad = 12, dpr = Math.min(2, window.devicePixelRatio || 1);
  const cv = document.createElement('canvas'); const ctx = cv.getContext('2d');
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${px}px -apple-system, "Helvetica Neue", "Segoe UI", Inter, Roboto, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2, hh = px + pad * 2;
  cv.width = w * dpr; cv.height = hh * dpr; ctx.scale(dpr, dpr);
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${px}px -apple-system, "Helvetica Neue", "Segoe UI", Inter, Roboto, sans-serif`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(245,242,235,.92)'; ctx.lineJoin = 'round'; ctx.strokeText(text, w / 2, hh / 2);
  ctx.fillStyle = n.kind === 'entrance' ? C[n.dimension] : n.kind === 'concept' ? C.ink2 : C.ink; ctx.fillText(text, w / 2, hh / 2);
  const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter; tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 1 }));
  sp.scale.set(h * w / hh, h, 1); return sp;
}
function nodeObject(n) {
  const g = new THREE.Group(); const r = radiusOf(n);
  const mat = new THREE.MeshStandardMaterial({ color: colourOf(n), roughness: .58, metalness: .04, transparent: true, opacity: 1 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), mat); g.add(mesh);
  let halo = null;
  if (n.kind !== 'concept' && n.kind !== 'cultivar' && n.kind !== 'genus' && n.kind !== 'family') { halo = new THREE.Mesh(new THREE.SphereGeometry(r * (n.kind === 'entrance' ? 2.1 : 1.7), 24, 16), new THREE.MeshBasicMaterial({ color: colourOf(n), transparent: true, opacity: n.kind === 'entrance' ? .07 : .09, depthWrite: false })); g.add(halo); }
  const label = labelSprite(n); label.position.set(0, r + label.scale.y * 0.5 + 1.4, 0); g.add(label);
  n.__obj = { group: g, mesh, mat, halo, label, r }; return g;
}
function linkMaterial(l) {
  const e = l.e; let m;
  if (e.type === 'navigation') m = new THREE.LineDashedMaterial({ color: C.nav, dashSize: 1.2, gapSize: 2.6, transparent: true, opacity: .4 });
  else if (e.status === 'candidate') m = new THREE.LineDashedMaterial({ color: C.candidate, dashSize: 3, gapSize: 2.2, transparent: true, opacity: .8 });
  else if (e.status === 'derived') m = new THREE.LineBasicMaterial({ color: C.derived, transparent: true, opacity: .55 });
  else m = new THREE.LineBasicMaterial({ color: e.verification?.label === 'verified' ? C.docVerified : C.doc, transparent: true, opacity: e.verification?.label === 'verified' ? .6 : .42 });
  l.__base = m.opacity; l.__mat = m; return m;
}

// ------------------------------------------------------------------ the graph
function initGraph() {
  const el = $('#graph');
  const Graph = ForceGraph3D({ controlType: 'orbit', rendererConfig: { antialias: true, alpha: false, failIfMajorPerformanceCaveat: false, powerPreference: 'default' } })(el)
    .backgroundColor('#f5f2eb').showNavInfo(false).enableNodeDrag(false)
    .nodeThreeObject(nodeObject).nodeThreeObjectExtend(false)
    .linkWidth(0).linkMaterial(linkMaterial).linkOpacity(1)
    .linkPositionUpdate((obj, { start, end }) => { const pos = obj?.geometry?.attributes?.position; if (!pos) return false; const a = pos.array; a[0] = start.x; a[1] = start.y; a[2] = start.z; a[3] = end.x; a[4] = end.y; a[5] = end.z; pos.needsUpdate = true; obj.geometry.computeBoundingSphere(); if (obj.material.isLineDashedMaterial) obj.computeLineDistances(); return true; })
    .onNodeClick(n => onNodeClick(n.id)).onLinkClick(l => selectEdge(l.e.id, true))
    .onNodeHover(n => hoverNode(n)).onLinkHover(l => hoverLink(l))
    .onBackgroundClick(() => { if (S.selected || S.selectedEdge || S.pathFocus) { S.selected = null; S.selectedEdge = null; S.pathFocus = null; closeCard(); applyFocus(); } })
    .d3VelocityDecay(.32).cooldownTime(3500).warmupTicks(0);
  Graph.d3Force('charge').strength(-95).distanceMax(320);
  Graph.d3Force('link').distance(l => l.e.type === 'navigation' ? (l.e.rel === 'entrance_of' ? 72 : 44) : l.e.rel === 'suited_for' ? 96 : l.e.rel === 'requires_trait' ? 88 : l.e.type === 'taxonomy' ? 34 : l.e.type === 'plant_relation' ? 80 : 62).strength(l => l.e.type === 'navigation' ? .45 : .25);
  const scene = Graph.scene();
  scene.add(new THREE.HemisphereLight(0xfff8ee, 0xd8cfc2, 1.15)); const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(160, 260, 220); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xe6eefa, .5); fill.position.set(-220, -80, -160); scene.add(fill);
  Graph.cameraPosition({ x: 0, y: 60, z: 440 }, { x: 0, y: 0, z: 0 }, 0);
  el.addEventListener('mousemove', ev => { S.mouse.x = ev.clientX; S.mouse.y = ev.clientY; const t = $('#tip'); if (t.style.display === 'block') { t.style.left = `${ev.clientX + 14}px`; t.style.top = `${ev.clientY + 12}px`; } });
  window.addEventListener('resize', () => Graph.width(innerWidth).height(innerHeight));
  S.Graph = Graph;
  for (const [d, p] of Object.entries(HUB)) { const n = S.M.node(S.M.entrance[d]); if (n) { n.x = n.fx = p[0]; n.y = n.fy = p[1]; n.z = n.fz = p[2]; } }
}
function linkObj(e) { let l = S.links.get(e.id); if (!l) { l = { id: e.id, source: e.source, target: e.target, e }; S.links.set(e.id, l); } return l; }
function placeNear(n, anchorId) {
  if (n.x !== undefined && n.__placed) return;
  const a = anchorId && S.M.node(anchorId); const base = a && a.x !== undefined ? a : { x: 0, y: 0, z: 0 };
  const sp = a ? (a.kind === 'entrance' ? 48 : 34) : 60; const r = () => (Math.random() - .5) * 2 * sp;
  n.x = base.x + r(); n.y = base.y + r() * .8; n.z = base.z + r(); n.vx = n.vy = n.vz = 0; n.__placed = true;
}
function updateGraph() {
  const M = S.M; const nodes = [...S.visible].map(id => M.node(id)).filter(Boolean);
  const links = M.inducedEdges(S.visible, S.revealedEdges).map(linkObj);
  S.Graph.graphData({ nodes, links });
  applyFocus(); renderStats(); renderTrail();
}
function applyFocus() {
  const M = S.M; let fn = null, fe = null;
  if (S.pathFocus) { fn = new Set(S.pathFocus.nodes); fe = new Set(S.pathFocus.edges); }
  else if (S.selectedEdge) { const e = M.edge(S.selectedEdge); fn = new Set([e.source, e.target]); fe = new Set([e.id]); }
  else if (S.selected) { const nb = M.neighbourhood(S.selected, S.visible); fn = nb.nodes; fe = nb.edges; const n = M.node(S.selected); if (n.kind === 'entrance' || n.kind === 'y_group') for (const e of M.edgesOf(S.selected, e => e.type === 'navigation')) { if (S.visible.has(e.target)) { fn.add(e.target); fe.add(e.id); } } }
  for (const id of S.visible) { const n = M.node(id); const o = n.__obj; if (!o) continue; const lit = !fn || fn.has(id); const sel = id === S.selected; o.mat.opacity = lit ? 1 : DIM; o.label.material.opacity = lit ? 1 : .08; if (o.halo) o.halo.material.opacity = sel ? .2 : (lit ? (n.kind === 'entrance' ? .07 : .09) : .02); o.mesh.scale.setScalar(sel ? 1.25 : 1); }
  for (const l of S.links.values()) { if (!l.__mat) continue; const lit = !fe || fe.has(l.e.id); const sel = l.e.id === S.selectedEdge || (fe && fe.has(l.e.id) && (S.selectedEdge || S.pathFocus)); const anchored = l.e.type === 'navigation' || S.expanded.has(l.e.source) || S.expanded.has(l.e.target) || S.revealedEdges.has(l.e.id) || l.e.source === S.selected || l.e.target === S.selected; l.__mat.opacity = lit ? Math.min(1, l.__base * (sel ? 1.8 : (fn ? 1.5 : 1)) * (anchored ? 1 : .45)) : l.__base * .16; }
}
function hideTip() { const t = $('#tip'); t.style.display = 'none'; t.dataset.link = ''; }
function hoverNode(n) { $('#graph').style.cursor = n ? 'pointer' : ''; const t = $('#tip'); if (!S.mouse.x) return; if (!n) { if (!t.dataset.link) t.style.display = 'none'; return; } t.dataset.link = ''; t.innerHTML = `${n.kind === 'plant' ? `<i>${esc(n.label)}</i>` : esc(n.label)}<div class="m">${esc(kindLabel(n))}${n.n_plants != null && n.kind !== 'plant' ? ` · ${n.n_plants} plant${n.n_plants === 1 ? '' : 's'}` : ''}${n.kind === 'plant' ? ` · ${n.n_claims} claims` : ''}</div>`; t.style.display = 'block'; t.style.left = `${S.mouse.x + 14}px`; t.style.top = `${S.mouse.y + 12}px`; }
function hoverLink(l) { $('#graph').style.cursor = l ? 'pointer' : ''; const t = $('#tip'); if (!S.mouse.x) return; if (!l) { t.dataset.link = ''; t.style.display = 'none'; return; } const e = l.e; t.dataset.link = '1'; t.innerHTML = `${esc(S.M.node(e.source).label)} <span class="m">${esc(relLabel(e))}</span> ${esc(S.M.node(e.target).label)}<div class="m">${esc(e.status)}${e.verification ? ` · ${esc(e.verification.label)}` : ''}${e.n_claims ? ` · ${e.n_claims} claim${e.n_claims === 1 ? '' : 's'}` : ''}</div>`; t.style.display = 'block'; t.style.left = `${S.mouse.x + 14}px`; t.style.top = `${S.mouse.y + 12}px`; }
function aimAt(target, dist, ms, cardOpen = true) {
  // keep the current viewing direction; when the card is open, look a little to the right so the target sits in the free area
  const cam = S.Graph.camera(); const cp = S.Graph.cameraPosition();
  const dir = new THREE.Vector3(cp.x - target.x, cp.y - target.y, cp.z - target.z); if (dir.length() < 1) dir.set(0, .3, 1); dir.normalize().multiplyScalar(dist);
  const t = new THREE.Vector3(target.x, target.y, target.z);
  if (cardOpen && innerWidth > 900) { const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion); const half = dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect; t.add(right.multiplyScalar(half * 400 / innerWidth)); }
  S.Graph.cameraPosition({ x: t.x + dir.x, y: t.y + dir.y, z: t.z + dir.z }, { x: t.x, y: t.y, z: t.z }, ms);
}
function focusCamera(id, ms = 900) {
  const n = S.M.node(id); if (!n || n.x === undefined) return;
  const k = S.M.neighbourhood(id, S.visible).nodes.size;
  aimAt(n, Math.min(360, Math.max(170, 120 + k * 7)), ms, $('#card').classList.contains('open'));
}

// ------------------------------------------------------------------ state changes
function snapshot() { S.history.push({ visible: [...S.visible], revealedEdges: [...S.revealedEdges], expanded: [...S.expanded], revealedBy: [...S.revealedBy], selected: S.selected, selectedEdge: S.selectedEdge, pathFocus: S.pathFocus, trail: [...S.trail], cam: S.Graph.cameraPosition() }); if (S.history.length > 80) S.history.shift(); $('#back').disabled = false; }
function reveal(ids, anchorId, by) { for (const id of ids) { if (!S.M.node(id) || S.visible.has(id)) continue; placeNear(S.M.node(id), anchorId || S.M.anchorOf(id)); S.visible.add(id); if (by) S.revealedBy.set(id, by); } }
function revealWayIn(id) { const way = S.M.wayIn(id).reverse(); for (const a of way) reveal([a], S.M.anchorOf(a), null); reveal([id], S.M.anchorOf(id), null); }
function expand(id, opts) { const x = S.M.expansion(id, opts); reveal(x.nodes, id, id); for (const e of x.edges) S.revealedEdges.add(e); S.expanded.add(id); }
function collapse(id) {
  const keep = new Set([...S.M.initial, S.selected].filter(Boolean));
  const gone = [...S.visible].filter(n => S.revealedBy.get(n) === id && !keep.has(n) && !S.expanded.has(n));
  for (const n of gone) { S.visible.delete(n); S.revealedBy.delete(n); }
  S.expanded.delete(id);
}
function onNodeClick(id) {
  if (S.running) return;
  hideTip(); snapshot(); S.pathFocus = null; S.selectedEdge = null;
  const n = S.M.node(id);
  if (S.selected === id && S.expanded.has(id)) { collapse(id); S.selected = id; }
  else { expand(id); S.selected = id; if (!S.trail.length || S.trail[S.trail.length - 1] !== id) S.trail.push(id); }
  updateGraph(); showNode(id); focusCamera(id);
}
function selectNode(id, { expandIt = false, focus = true } = {}) { S.pathFocus = null; S.selectedEdge = null; revealWayIn(id); if (expandIt) expand(id); S.selected = id; if (!S.trail.length || S.trail[S.trail.length - 1] !== id) S.trail.push(id); updateGraph(); showNode(id); if (focus) focusCamera(id); }
function selectEdge(id, fromClick = false) {
  const e = S.M.edge(id); if (!e) return; hideTip(); if (!fromClick) snapshot();
  S.pathFocus = null; S.selected = null; revealWayIn(e.source); revealWayIn(e.target); S.revealedEdges.add(id); S.selectedEdge = id;
  updateGraph(); showEdge(id);
  const a = S.M.node(e.source), b = S.M.node(e.target); if (a.x !== undefined && b.x !== undefined) aimAt({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }, Math.max(170, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * 1.6), 800);
}
function back() {
  const h = S.history.pop(); if (!h) return;
  S.visible = new Set(h.visible); S.revealedEdges = new Set(h.revealedEdges); S.expanded = new Set(h.expanded); S.revealedBy = new Map(h.revealedBy); S.selected = h.selected; S.selectedEdge = h.selectedEdge; S.pathFocus = h.pathFocus; S.trail = h.trail;
  updateGraph(); if (S.selectedEdge) showEdge(S.selectedEdge); else if (S.selected) showNode(S.selected); else closeCard();
  S.Graph.cameraPosition(h.cam, undefined, 700); $('#back').disabled = !S.history.length;
}
function reset(remember = true) {
  if (remember) snapshot(); hideTip();
  S.visible = new Set(); S.revealedEdges = new Set(); S.expanded = new Set(); S.revealedBy = new Map(); S.selected = null; S.selectedEdge = null; S.pathFocus = null; S.trail = [];
  const M = S.M;
  for (const id of M.initial) { const n = M.node(id); if (n.kind === 'entrance') { S.visible.add(id); continue; } }
  for (const d of ['x', 'y', 'z']) { const kids = M.initial.filter(id => M.node(id).kind !== 'entrance' && M.node(id).dimension === d); const h = HUB[d]; kids.forEach((id, i) => { const n = M.node(id); const a = (i / kids.length) * Math.PI * 2 + (d === 'y' ? .4 : d === 'x' ? 2.2 : -0.6); const R = 62; n.x = h[0] + Math.cos(a) * R * (d === 'y' ? 1.15 : .75); n.y = h[1] + (d === 'y' ? Math.sin(a) * R * .55 : Math.sin(a) * R); n.z = h[2] + (d === 'y' ? Math.sin(a * 1.7) * 30 : Math.cos(a * 1.3) * 30); n.vx = n.vy = n.vz = 0; n.__placed = true; S.visible.add(id); }); }
  updateGraph(); closeCard(); S.Graph.cameraPosition({ x: 0, y: 60, z: 440 }, { x: 0, y: 0, z: 0 }, remember ? 900 : 0);
}
function fit() { S.Graph.zoomToFit(800, 60); }

// ------------------------------------------------------------------ demonstration paths (from the data, run step by step)
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function runPath(p) {
  if (S.running) return; S.running = true; snapshot();
  reset(false); await sleep(500);
  const M = S.M; const seen = [];
  for (let i = 0; i < p.nodes.length; i++) {
    const id = p.nodes[i]; revealWayIn(id);
    for (const eid of p.edges) { const e = M.edge(eid); if (e && (e.source === id || e.target === id) && (seen.includes(e.source) || seen.includes(e.target) || e.source === id && seen.includes(e.target))) S.revealedEdges.add(eid); }
    seen.push(id); S.pathFocus = { nodes: seen.slice(), edges: p.edges.filter(eid => { const e = M.edge(eid); return seen.includes(e.source) && seen.includes(e.target); }) };
    S.selected = id; S.trail = seen.slice(); updateGraph(); showPath(p, i); focusCamera(id, 1000); await sleep(1250);
  }
  S.selected = null; S.pathFocus = { nodes: p.nodes.slice(), edges: p.edges.slice() }; updateGraph(); showPath(p, p.nodes.length); fit(); S.running = false;
}

// ------------------------------------------------------------------ ui
function initUi() {
  const M = S.M;
  $('#entr').innerHTML = ['x', 'y', 'z'].map(d => { const n = M.node(M.entrance[d]); return `<button class="ent ${d}" data-id="${esc(n.id)}" title="${esc(n.definition)}"><b>${d.toUpperCase()}</b>${esc(n.short)}</button>`; }).join('');
  $('#entr').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) onNodeClick(b.dataset.id); });
  $('#controls').innerHTML = `<button id="back" disabled>← Back</button><button id="reset">Reset</button><button id="fit">Fit</button><span class="sep"></span>` + M.paths.map(p => `<button class="path ${p.start}" data-path="${esc(p.id)}" title="${esc(p.labels.join(' → '))}"><b>${p.start.toUpperCase()}</b>${esc(p.title)}</button>`).join('');
  $('#back').onclick = back; $('#reset').onclick = () => reset(true); $('#fit').onclick = fit;
  $('#controls').addEventListener('click', ev => { const b = ev.target.closest('button.path'); if (b) runPath(M.paths.find(p => p.id === b.dataset.path)); });
  $('#legend').innerHTML = `<span><i style="background:${C.x}"></i>classification</span><span><i style="background:${C.plant}"></i>plant</span><span><i style="background:${C.y}"></i>knowledge</span><span><i style="background:${C.z}"></i>spatial function</span><span><i class="ln" style="border-color:${C.doc}"></i>documented</span><span><i class="ln" style="border-color:${C.derived}"></i>derived</span><span><i class="ln dash" style="border-color:${C.candidate}"></i>candidate</span><span><i class="ln dot" style="border-color:${C.nav}"></i>navigation</span>`;
  $('#card .close').onclick = () => { closeCard(); S.selected = null; S.selectedEdge = null; S.pathFocus = null; applyFocus(); };
  $('#cardbody').addEventListener('click', ev => { const t = ev.target.closest('[data-node],[data-edge],[data-act]'); if (!t) return; ev.preventDefault(); if (t.dataset.node) { snapshot(); selectNode(t.dataset.node, { expandIt: true }); } else if (t.dataset.edge) selectEdge(t.dataset.edge); else if (t.dataset.act) act(t.dataset.act, t.dataset.id); });
  const inp = $('#search'), res = $('#results'); let hi = -1, cur = [];
  const show = () => { res.innerHTML = cur.map((n, i) => `<div class="${i === hi ? 'hi' : ''}" data-i="${i}"><span>${n.kind === 'plant' ? `<i>${esc(n.label)}</i>` : esc(n.label)}${n.kind === 'plant' && n.common?.length ? ` <span style="color:var(--ink-3)">· ${esc(n.common[0])}</span>` : ''}</span><small>${esc(kindLabel(n))}</small></div>`).join(''); res.classList.toggle('open', cur.length > 0); };
  const go = i => { const n = cur[i]; if (!n) return; inp.value = ''; cur = []; show(); snapshot(); selectNode(n.id, { expandIt: true }); };
  inp.addEventListener('input', () => { cur = M.search(inp.value); hi = cur.length ? 0 : -1; show(); });
  inp.addEventListener('keydown', ev => { if (ev.key === 'ArrowDown') { hi = Math.min(cur.length - 1, hi + 1); show(); ev.preventDefault(); } else if (ev.key === 'ArrowUp') { hi = Math.max(0, hi - 1); show(); ev.preventDefault(); } else if (ev.key === 'Enter') { go(hi); } else if (ev.key === 'Escape') { inp.value = ''; cur = []; show(); inp.blur(); } });
  inp.addEventListener('blur', () => setTimeout(() => { cur = []; show(); }, 150));
  res.addEventListener('mousedown', ev => { const d = ev.target.closest('[data-i]'); if (d) { ev.preventDefault(); go(+d.dataset.i); } });
  document.addEventListener('keydown', ev => { if (ev.target.tagName === 'INPUT') return; if (ev.key === 'Escape') back(); if (ev.key === '/' ) { inp.focus(); ev.preventDefault(); } });
  $('#trail').addEventListener('click', ev => { const t = ev.target.closest('[data-node]'); if (t) { snapshot(); selectNode(t.dataset.node, { expandIt: false }); } });
}
function act(a, id) {
  if (a === 'expand') { snapshot(); expand(id); S.selected = id; updateGraph(); showNode(id); }
  else if (a === 'collapse') { snapshot(); collapse(id); updateGraph(); showNode(id); }
  else if (a === 'taxonomy') { snapshot(); expand(id, { taxonomy: true }); S.selected = id; updateGraph(); showNode(id); }
  else if (a === 'placeholders') { snapshot(); expand(id, { placeholders: true }); S.selected = id; updateGraph(); showNode(id); }
  else if (a === 'focus') focusCamera(id);
  else if (a === 'path') { const p = S.M.paths.find(p => p.id === id); if (p) runPath(p); }
}
function renderStats() { const st = S.M.stats; const vis = S.visible.size; const ve = S.M.inducedEdges(S.visible, S.revealedEdges).length; $('#stats').innerHTML = `underlying graph ${st.underlying.nodes} nodes · ${st.underlying.edges} edges &nbsp;→&nbsp; projection ${st.projection.nodes} · ${st.projection.edges} &nbsp;→&nbsp; <b style="color:var(--ink-2)">visible ${vis} · ${ve}</b>`; }
function renderTrail() { const t = S.trail.slice(-7); $('#trail').innerHTML = t.length ? t.map((id, i) => { const n = S.M.node(id); return `${i ? '<i>›</i>' : ''}<span class="t ${i === t.length - 1 ? 'cur' : ''}" data-node="${esc(id)}">${n.kind === 'plant' ? `<i class="sci">${esc(n.label)}</i>` : esc(labelOf(n))}</span>`; }).join('') : '<span class="faint" style="color:var(--ink-3)">click a sphere to open its connections · click a line for its evidence</span>'; }
function closeCard() { $('#card').classList.remove('open'); }
function openCard(html) { $('#cardbody').innerHTML = html; $('#card').classList.add('open'); $('#card').scrollTop = 0; }

// ------------------------------------------------------------------ cards
const kindLabel = n => ({ entrance: 'entrance', growth_form: 'growth form · X', plant: 'plant', y_group: 'knowledge group · Y', concept: `${n.facet_label || 'concept'} · Y`, function: 'spatial function · Z', genus: 'genus', family: 'family', cultivar: 'cultivar' }[n.kind] || n.kind);
const relLabel = e => ({ is_growth_form: 'is growth form', grows_in: 'grows in', has_trait: 'has trait', requires_trait: 'requires trait', suited_for: 'suited for', in_genus: 'in genus', in_family: 'in family', cultivar_of: 'cultivar of', co_listed: 'co-listed', companion: 'companion', competes: 'competes with', layered_under: 'layered under', co_occurs_with: 'co-occurs with', entrance_of: 'entrance', groups: 'groups' }[e.rel] || e.rel.replace(/_/g, ' '));
const tag = (s, extra = '') => s ? `<span class="tag ${esc(String(s).replace(/\s+/g, ''))}">${esc(s)}${extra}</span>` : '';
const vtag = v => v ? tag(v.label, v.verified || v.unverified ? ` ${v.verified ? `${v.verified}✓` : ''}${v.unverified ? `${v.verified ? ' ' : ''}${v.unverified}·` : ''}` : '') : '';
const nodeChip = (id, extra = '', st = '') => { const n = S.M.node(id); if (!n) return ''; return `<span class="chip" data-node="${esc(id)}">${st ? `<i class="st ${esc(st)}"></i>` : ''}${n.kind === 'plant' ? `<i class="sci">${esc(n.label)}</i>` : esc(labelOf(n))}${extra}</span>`; };
const edgeChip = (e, labelId, extra = '') => { const n = S.M.node(labelId); if (e.basis?.entity) extra = '<small>entity</small>'; return `<span class="chip" data-edge="${esc(e.id)}"><i class="st ${esc(e.status)}"></i>${n.kind === 'plant' ? `<i class="sci">${esc(n.label)}</i>` : esc(labelOf(n))}${e.verification?.label === 'verified' ? '<small>✓</small>' : ''}${extra}</span>`; };
const human = s => String(s ?? '').replace(/_/g, ' ');
function sourceLine(sid) { const s = S.M.source(sid); const name = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>` : esc(s.label); return `${name}${s.type ? ` · ${esc(s.type)}` : ''}${s.licence_tier ? ` · tier ${esc(s.licence_tier)}` : ''}${s.geo ? ` · ${esc(s.geo)}` : ''}`; }
function claimHtml(cid) {
  const c = S.M.claim(cid); if (!c) return `<div class="claim"><div class="meta">${esc(cid)} — not in the projection's claim index</div></div>`;
  const cond = c.conditions?.length ? ` · <b>when</b> ${c.conditions.map(x => esc(x.label)).join(', ')}` : '';
  const pm = c.practitioner_meta; const who = pm?.observer_background ? `<br><b>observer</b> ${esc(pm.observer_background)}${pm.completeness ? ` · ${esc(pm.completeness)}` : ''}${pm.citable === false ? ' · not citable' : ''}` : '';
  return `<div class="claim"><div class="txt">${esc(c.text)}</div><div class="meta"><b>source</b> ${sourceLine(c.source_id)} · ${esc(c.source_type)}${c.place_label ? ` · <b>place</b> ${esc(c.place_label)}` : ''}${cond}${c.cultivar ? ` · <b>cv.</b> ${esc(c.cultivar)}` : ''} · <b>conf</b> ${esc(c.confidence)} · ${tag(c.status)}${c.context ? `<br><b>context</b> ${esc(c.context)}` : ''}${who}<br><span class="faint">${esc(c.id)} · ${esc(c.field)} · ${esc(c.recorded_at)}</span></div></div>`;
}
function ruleHtml(rule) { if (!rule) return ''; return rule.split(' · ').map(r => S.M.rules[r] ? `<div class="note"><b>${esc(r)}</b> — ${esc(S.M.rules[r])}</div>` : '').join(''); }

function showNode(id) {
  const M = S.M, n = M.node(id); if (!n) return;
  const sw = `<i class="sw" style="background:${colourOf(n)}"></i>`;
  let h = `<div class="kicker">${sw}${esc(kindLabel(n))}${n.dimension ? ` · ${esc(M.node(M.entrance[n.dimension])?.label || '')}` : ''}</div>`;
  const exp = S.expanded.has(id);
  const btns = () => `<div class="btns">${exp ? `<button data-act="collapse" data-id="${esc(id)}">Collapse</button>` : `<button data-act="expand" data-id="${esc(id)}">Expand connections</button>`}<button data-act="focus" data-id="${esc(id)}">Focus</button>${n.kind === 'plant' && n.degree?.taxonomy ? `<button data-act="taxonomy" data-id="${esc(id)}">Taxonomy</button>` : ''}${n.kind === 'plant' && M.edgesOf(id, e => e.placeholder).length ? `<button data-act="placeholders" data-id="${esc(id)}">Model placeholders (${M.edgesOf(id, e => e.placeholder).length})</button>` : ''}</div>`;
  if (n.kind === 'plant') {
    const gf = M.node(n.growth_form); const gfe = M.edgesOf(id, e => e.rel === 'is_growth_form')[0];
    h += `<h2><i class="sci">${esc(n.label)}</i><small>${esc((n.common || []).slice(0, 4).join(' · '))}</small></h2>`;
    h += `<p class="def">${gf ? `<span class="link" data-edge="${esc(gfe?.id)}">${esc(gf.label)}</span> (${esc(gfe?.verification?.label || '')})` : ''} · ${esc(n.plant_type)} · ${esc(human(n.origin_status))} · family ${esc(n.family)} · ${n.n_claims} claims</p>`;
    const suited = M.edgesOf(id, e => e.rel === 'suited_for');
    const gaps = M.data.nodes.filter(f => f.kind === 'function').flatMap(f => (f.gaps || []).filter(g => g.plant === id).map(g => ({ f, g })));
    h += `<h3>Spatial functions <small>${suited.length} linked · ${gaps.length} unknown</small></h3>`;
    h += suited.map(e => `<div class="row" data-edge="${esc(e.id)}"><i class="st ${esc(e.status)}"></i><div class="b">${esc(M.node(e.target).label)} ${tag(e.status)} ${vtag(e.verification)}${e.conflict ? ` ${tag('conflict')}` : ''}<div class="meta">${e.design.via_use_labels.length ? `via use: ${esc(e.design.via_use_labels.join(', '))} (${esc(e.design.use_sources.join(', '))})` : 'inferred from traits (KG-R4), no source states this use'}${e.conflict ? ' · a recorded trait contradicts a requirement' : ''}</div></div></div>`).join('');
    h += gaps.map(({ f, g }) => `<div class="gap"><b>${esc(f.label)}</b> — ${esc(g.verdict)}: ${g.missing.map(m => `${esc(m.strength)} ${esc(m.alternative_labels.join(' or '))} <span class="mono">${esc(m.result)}</span>`).join('; ')}</div>`).join('');
    for (const g of M.data.y_groups) {
      const es = M.edgesOf(id, e => (e.rel === 'grows_in' || e.rel === 'has_trait') && M.node(e.target).group === g.id);
      const attrs = n.attributes?.[g.id] || {};
      if (!es.length && !Object.keys(attrs).length) continue;
      h += `<h3>${esc(g.label)} <small>${es.length} concepts</small></h3><div class="chips">${es.sort((a, b) => M.node(a.target).facet.localeCompare(M.node(b.target).facet) || b.n_claims - a.n_claims).map(e => edgeChip(e, e.target, `<small>${e.n_claims}</small>`)).join('')}</div>`;
      const al = Object.values(attrs).map(a => { const by = new Map(); for (const v of a.values) { const k = v.label; if (!by.has(k)) by.set(k, new Set()); by.get(k).add(v.source_id); } return `<div class="attr"><b>${esc(a.label)}</b> ${[...by].map(([k, s]) => `${esc(k)} <span class="faint mono">${esc([...s].join(', '))}</span>`).join(' · ')}</div>`; }).join('');
      if (al) h += `<details><summary>attributes kept on the plant (${Object.keys(attrs).length} facets — numbers, zones and ranges are not spheres)</summary>${al}</details>`;
    }
    const za = n.attributes?.z || {};
    if (Object.keys(za).length) h += `<details><summary>design evidence outside the five Z functions (KPU uses · roles · compositions)</summary>${Object.values(za).map(a => { const by = new Map(); for (const v of a.values) { if (!by.has(v.label)) by.set(v.label, new Set()); by.get(v.label).add(v.source_id || v.status); } return `<div class="attr"><b>${esc(a.label)}</b> ${[...by].map(([k, s]) => `${esc(k)} <span class="faint mono">${esc([...s].join(', '))}</span>`).join(' · ')}</div>`; }).join('')}</details>`;
    const rels = M.edgesOf(id, e => e.type === 'plant_relation');
    h += `<h3>Plant-to-plant relations <small>${rels.length}</small></h3>` + (rels.length ? rels.map(e => `<div class="row" data-edge="${esc(e.id)}"><i class="st ${esc(e.status)}"></i><div class="b">${esc(relLabel(e))} <i class="sci">${esc(M.node(M.other(e, id)).label)}</i> ${tag(e.status)} ${vtag(e.verification)}<div class="meta">${esc(e.basis.sources.map(s => S.M.source(s).label).join(' · '))}${e.records.length > 1 ? ` · ${e.records.length} records` : ''}${e.placeholder ? ' · model placeholder, shown on demand' : ''}</div></div></div>`).join('') : '<p class="muted small">none recorded in relations.json</p>');
    h += `<div class="note">Plants sharing a knowledge concept are connected only through that concept (Plant → concept ← Plant). A shared trait is never read as a companion relation.</div>`;
  } else if (n.kind === 'concept') {
    h += `<h2>${esc(n.label)}<small>${esc(n.facet_label)} · ${esc(M.node(n.group)?.label || '')}${n.parent_label ? ` · narrower than ${esc(n.parent_label)}` : ''}</small></h2>`;
    if (n.definition) h += `<p class="def">${esc(n.definition)}</p>`;
    if (n.min_m != null) h += `<p class="small muted">height band ${n.min_m}–${n.max_m ?? '∞'} m (Robinson bands; bounds to confirm). A plant is placed here by rule KG-R2 when a sourced height range intersects the band.</p>`;
    if (n.aliases?.length) h += `<p class="small faint">also: ${esc(n.aliases.join(', '))}</p>`;
    const es = M.edgesOf(id, e => e.rel === 'grows_in' || e.rel === 'has_trait');
    h += `<h3>Plants <small>${es.length}</small></h3><div class="chips">${es.map(e => edgeChip(e, e.source, `<small>${e.n_claims}</small>`)).join('')}</div>`;
    const req = M.edgesOf(id, e => e.rel === 'requires_trait');
    if (req.length) h += `<h3>Required by spatial functions</h3><div class="chips">${req.map(e => edgeChip(e, e.source, `<small>${esc(e.strength)}</small>`)).join('')}</div>`;
    h += `<div class="note">An indirect connection: plants listed here reach the same concept, which says nothing about planting them together.</div>`;
    if (n.source_of_term) h += `<p class="small faint">term: ${esc(n.source_of_term)}</p>`;
  } else if (n.kind === 'function') {
    h += `<h2>${esc(n.label)}<small>stands for ${esc(n.underlying_labels.join(' + '))} in the ontology</small></h2><p class="def">${esc(n.definition)}</p>`;
    const req = M.edgesOf(id, e => e.rel === 'requires_trait'); const byReq = new Map(); for (const e of req) { if (!byReq.has(e.requirement)) byReq.set(e.requirement, []); byReq.get(e.requirement).push(e); }
    h += `<h3>Requires <small>literature · ${byReq.size} requirements</small></h3>` + [...byReq.values()].map(es => { const p = es.find(e => e.primary) || es[0]; return `<div class="row" data-edge="${esc(p.id)}"><i class="st documented"></i><div class="b">${esc(p.strength)}: ${es.map(e => esc(labelOf(M.node(e.target)))).join(' <span class="faint">or</span> ')}${p.to_confirm ? ` ${tag('to confirm')}` : ''}<div class="meta">${esc(p.basis.literature || '')}</div></div></div>`; }).join('');
    const suited = M.edgesOf(id, e => e.rel === 'suited_for');
    h += `<h3>Plants linked <small>${suited.length}</small></h3>` + suited.sort((a, b) => a.status.localeCompare(b.status)).map(e => `<div class="row" data-edge="${esc(e.id)}"><i class="st ${esc(e.status)}"></i><div class="b"><i class="sci">${esc(M.node(e.source).label)}</i> ${tag(e.status)} ${vtag(e.verification)}${e.conflict ? ` ${tag('conflict')}` : ''}<div class="meta">${e.design.via_use_labels.length ? `use: ${esc(e.design.via_use_labels.join(', '))} (${esc(e.design.use_sources.join(', '))})` : 'all required traits met (KG-R4); no source states this use'} · ${esc(Object.values(e.design.verdicts).join(' / '))}</div></div></div>`).join('');
    h += `<h3>Unknown <small>${(n.gaps || []).length} plants · not drawn</small></h3>` + (n.gaps || []).map(g => `<div class="gap"><i class="sci">${esc(g.plant_label)}</i> — ${esc(g.verdict)}: ${g.missing.map(m => `${esc(m.strength)} ${esc(m.alternative_labels.join(' or '))} <span class="mono">${esc(m.result)}</span>`).join('; ') || 'no requirement recorded'}</div>`).join('');
    if (n.source_of_term) h += `<p class="small faint">term: ${esc(n.source_of_term)}</p>`;
  } else if (n.kind === 'growth_form') {
    h += `<h2>${esc(n.label)}<small>botanical growth form · ${n.n_plants} plants</small></h2><p class="def">${esc(n.definition)}</p>`;
    h += `<h3>Plants</h3><div class="chips">${n.plants.map(p => { const e = M.edgesOf(p, e => e.rel === 'is_growth_form')[0]; return edgeChip(e, p, e.verification?.label === 'to confirm' ? '<small>to confirm</small>' : ''); }).join('')}</div>`;
    if (M.stats.hidden_growth_forms?.length) h += `<p class="small faint">forms with no plant in the database are not shown: ${esc(M.stats.hidden_growth_forms.join(', '))}.</p>`;
    h += `<div class="note">The growth form is read from the sources (M29); it is a classification, not a design role — Ground cover is a spatial function (Z), not a growth form.</div>`;
  } else if (n.kind === 'y_group') {
    h += `<h2>${esc(n.label)}<small>knowledge group · navigation, not a plant attribute</small></h2><p class="def">${esc(n.definition)}</p>`;
    const cs = M.edgesOf(id, e => e.rel === 'groups').map(e => M.node(e.target)); const byF = new Map(); for (const c of cs) { if (!byF.has(c.facet)) byF.set(c.facet, []); byF.get(c.facet).push(c); }
    for (const [f, list] of byF) h += `<h3>${esc(list[0].facet_label)} <small>${list.length}</small></h3><div class="chips">${list.sort((a, b) => b.n_plants - a.n_plants).map(c => nodeChip(c.id, `<small>${c.n_plants}</small>`)).join('')}</div>`;
    const attrF = n.facets.filter(f => !n.node_facets.includes(f)); if (attrF.length) h += `<p class="small faint">kept as plant attributes, not spheres: ${esc(attrF.map(f => M.data.nodes.find(x => x.facet === f)?.facet_label || f).join(', '))}.</p>`;
  } else if (n.kind === 'entrance') {
    h += `<h2>${esc(n.label)}</h2><p class="def">${esc(n.definition)}</p>`;
    h += `<h3>Open</h3><div class="chips">${M.edgesOf(id, e => e.type === 'navigation').map(e => nodeChip(e.target, `<small>${M.node(e.target).n_plants ?? ''}</small>`)).join('')}</div>`;
    const p = M.paths.find(p => p.start === n.dimension); if (p) h += `<p class="small"><span class="link" data-act="path" data-id="${esc(p.id)}">▸ run the demonstration path ${esc(p.labels.join(' → '))}</span></p>`;
  } else {
    h += `<h2>${n.kind === 'family' ? esc(n.label) : `<i class="sci">${esc(n.label)}</i>`}<small>${esc(kindLabel(n))}</small></h2>`;
    h += `<div class="chips">${M.edgesOf(id, e => e.type === 'taxonomy').map(e => edgeChip(e, M.other(e, id))).join('')}</div>`;
  }
  openCard(h + btns());
}
function showEdge(id) {
  const M = S.M, e = M.edge(id); if (!e) return; const a = M.node(e.source), b = M.node(e.target);
  const nm = n => n.kind === 'plant' || n.kind === 'cultivar' || n.kind === 'genus' ? `<i class="sci">${esc(n.label)}</i>` : esc(n.label);
  let h = `<div class="kicker">${esc(e.type === 'navigation' ? 'navigation' : e.type === 'taxonomy' ? 'taxonomy' : e.type === 'plant_relation' ? 'plant-to-plant relation' : 'knowledge relation')} · ${esc(e.rel)}</div>`;
  h += `<h2><span class="link" data-node="${esc(a.id)}">${nm(a)}</span> <span class="faint">${esc(relLabel(e))}</span> <span class="link" data-node="${esc(b.id)}">${nm(b)}</span></h2>`;
  h += `<p class="chips">${tag(e.status)} ${vtag(e.verification)}${e.conflict ? tag('conflict') : ''}${e.n_claims ? `<span class="tag">${e.n_claims} claim${e.n_claims === 1 ? '' : 's'}</span>` : ''}${e.strength ? tag(e.strength) : ''}${e.to_confirm ? tag('to confirm') : ''}</p>`;
  if (e.verification?.note) h += `<p class="small muted">${esc(e.verification.note)}</p>`;
  if (e.type === 'navigation') h += `<p class="def">A navigation link of the interface: it groups knowledge for browsing and carries no claim.</p>`;
  if (e.rel === 'requires_trait') h += `<p class="def">${esc(e.basis.text || '')}</p><p class="small muted">${esc(e.strength)}${e.alternatives?.length > 1 ? ` — any of: ${esc(e.alternatives.map(x => M.node(x)?.label || x).join(', '))}` : ''}${e.basis.note ? `<br>${esc(e.basis.note)}` : ''}</p><p class="small"><b>literature</b> ${esc(e.basis.literature || '')}</p>`;
  if (e.rel === 'suited_for') {
    const d = e.design;
    h += d.via_use_labels.length ? `<p class="def">A source records the use <b>${esc(d.via_use_labels.join(', '))}</b>, which the ontology maps to ${esc(b.label)} (KG-R1).</p>` : `<p class="def">No source states this use; every required trait is met by recorded claims (KG-R4), so the link is a <b>candidate</b> — never promoted.</p>`;
    if (e.conflict) h += `<p class="warn small">A recorded trait contradicts a requirement of ${esc(b.label)}: the documented use and the trait claims disagree — shown, not resolved.</p>`;
    h += ruleHtml(e.basis.rule);
    if (d.use_claims.length) h += `<h3>Use claims <small>${d.use_claims.length}</small></h3>` + d.use_claims.map(claimHtml).join('');
    const reqs = d.requirements; if (reqs.length) h += `<h3>Requirement check <small>${esc(Object.values(d.verdicts).join(' / '))}</small></h3>` + reqs.map(r => `<div class="req"><div>${esc(r.strength)} ${esc(r.alternative_labels.join(' or '))}${r.to_confirm ? ' <span class="faint">(to confirm)</span>' : ''}</div><div class="r ${esc(r.result)}">${esc(r.result)}</div>${r.evidence.length ? `<div class="alt">${r.evidence.map(x => `${esc(x.target_label)}${x.claim ? ` — <span class="mono">${esc(x.claim)}</span> ${esc(x.verification || '')}` : ` — ${esc(x.source_id)}`}${x.cultivar ? ` cv. ${esc(x.cultivar)}` : ''}${x.conditions?.length ? ` when ${esc(x.conditions.map(c => M.node(c.concept_id)?.label || c.concept_id || c).join(', '))}` : ''}`).join('<br>')}</div>` : ''}${r.contrary.length ? `<div class="alt warn">contrary: ${r.contrary.map(x => `${esc(x.target_label)} (${esc(x.source_id)})`).join(', ')}</div>` : ''}</div>`).join('');
    const evc = [...new Set(reqs.flatMap(r => r.evidence.map(x => x.claim).filter(Boolean)))]; if (evc.length) h += `<details><summary>trait claims behind the check (${evc.length})</summary>${evc.map(claimHtml).join('')}</details>`;
  }
  if (e.rel === 'is_growth_form') { h += ruleHtml('M29'); h += `<h3>Evidence</h3>` + Object.entries(e.basis.evidence || {}).map(([s, v]) => `<div class="attr"><b>${esc(s)}</b> ${esc(v)}${e.basis.weak?.includes(s.split(' ')[0]) ? ' <span class="faint">(weak mention)</span>' : ''}</div>`).join(''); if (e.basis.claims.length) h += `<details><summary>claims named (${e.basis.claims.length})</summary>${e.basis.claims.map(claimHtml).join('')}</details>`; }
  if (e.rel === 'grows_in' || e.rel === 'has_trait') {
    if (e.basis.rule) h += ruleHtml(e.basis.rule);
    if (e.basis.entity) h += `<p class="def">Recorded in the plant's entity record (identity_review), not in a sourced claim.</p>`;
    if (e.conditions?.length) h += `<p class="small muted">stated conditions: ${esc([...new Set(e.conditions.map(c => c.label))].join(', '))}</p>`;
    if (e.cultivars?.length) h += `<p class="small muted">cultivar-level claims: ${esc(e.cultivars.join(', '))}</p>`;
    h += `<h3>Claims <small>${e.basis.claims.length} · ${e.basis.sources.length} sources</small></h3>` + e.basis.claims.map(claimHtml).join('');
  }
  if (e.type === 'plant_relation') {
    h += `<p class="def">${e.records.length} record${e.records.length === 1 ? '' : 's'} in relations.json for this pair and relation type — one line, every record below.</p>`;
    h += e.records.map(r => `<div class="claim"><div class="txt">${esc(r.text || '')}</div><div class="meta">${tag(r.status)} ${tag(r.verification)} · <b>source</b> ${sourceLine(r.source_id || '')} · ${esc(r.source_type)} · conf ${esc(r.confidence)}${r.direction ? ` · ${esc(r.direction)}` : ''}${r.context ? `<br><b>context</b> ${esc(r.context)}` : ''}${r.placeholder ? `<br><span class="warn">a model placeholder: a candidate to be verified against ${esc((r.verify_against || []).join(', ') || 'a source')}; it is not evidence</span>` : ''}${r.note ? `<br>${esc(r.note)}` : ''}${r.supporting_claims.length ? `<br><b>supporting claims</b> ${esc(r.supporting_claims.join(', '))}` : ''}<br><span class="faint">${esc(r.id)}</span></div></div>`).join('');
    if (e.basis.claims.length) h += `<details><summary>supporting claims (${e.basis.claims.length})</summary>${e.basis.claims.map(claimHtml).join('')}</details>`;
  }
  if (e.type === 'taxonomy') h += `<p class="def">From the entity record of the plant file (${esc(e.verification?.note || '')}).</p>`;
  h += `<p class="small faint mono" style="margin-top:10px">underlying: ${esc(e.underlying.slice(0, 6).join(' · '))}${e.underlying.length > 6 ? ` · +${e.underlying.length - 6}` : ''}</p>`;
  openCard(h);
}
function showPath(p, step) {
  const M = S.M;
  let h = `<div class="kicker">demonstration path · from ${esc(M.node(M.entrance[p.start]).label)}</div><h2>${esc(p.labels.join(' → '))}<small>found in the data by tools/build_xyz.py; no edge was written for the demonstration</small></h2>`;
  h += `<div class="steps">` + p.steps.map((s, i) => { const e = M.edge(s.edge); const lit = i < step; return `<div class="step" data-edge="${esc(s.edge)}" style="opacity:${lit ? 1 : .35}"><div class="n">${i + 1}</div><div class="b">${esc(labelOf(M.node(s.from)))} <span class="rel">${esc(relLabel(e))}</span> ${esc(labelOf(M.node(s.to)))}<div class="rel">${tag(s.status)} ${s.verification ? tag(s.verification) : ''}${s.rule ? ` ${esc(s.rule)}` : ''}${s.claims.length ? ` · ${s.claims.length} claim${s.claims.length === 1 ? '' : 's'}` : ''}${s.sources.length ? ` · ${esc(s.sources.join(', '))}` : ''}${s.literature ? ` · ${esc(s.literature.slice(0, 60))}…` : ''}</div></div></div>`; }).join('') + `</div>`;
  if (step >= p.nodes.length) { h += `<h3>Evidence <small>${p.evidence_claims.length} claims · ${p.evidence_sources.length} sources</small></h3><p class="small muted">${p.evidence_sources.map(sourceLine).join('<br>')}</p><details open><summary>claims</summary>${p.evidence_claims.map(claimHtml).join('')}</details>`; }
  openCard(h);
}
