// Neural Knowledge Brain — ontology preview (v6.1, brief 2026-11-02 "Visual Simplification & Redesign").
// The same data (brain/data/kg.json, ontology.json, plants/*.json) and the same graph engine (js/kg.js), drawn as a
// minimal 3D neural network: spheres, thin lines, a label on every visible node, and progressive disclosure —
//   level 0   the three knowledge axes X · Y · Z with their categories, the three plants, the evidence region
//   click     a category opens its facets; a facet its concepts in use; a concept or a plant its cross-dimensional links;
//             a line opens the evidence trace (relation type, status, claims, sources, conditions, verification)
//   back      Esc or ← Back collapses the last step; Overview returns to level 0; the background only deselects
// Nothing is drawn that is not an edge of kg.json; unexplored knowledge is hidden, not removed.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { loadAll } from './kg.js';
import { index as indexGraph, conceptsInText, classesFor, candidateEdges } from '../../js/graph.js';
import { diagnose, fmtNum, interval } from '../../js/diagnosis.js';
import { TYPE_COLOUR } from '../../js/model.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const LS_KEY = 'brain.candidates.v6';
const STEP = 520;
const AX = {
  'axis:x': { key: 'x', label: 'X · Identity & Classification', colour: '#f6d365', anchor: [0, 215, -110] },
  'axis:y': { key: 'y', label: 'Y · Traits & Performance', colour: '#7cc4ff', anchor: [-300, -55, 100] },
  'axis:z': { key: 'z', label: 'Z · Planting Design Knowledge', colour: '#6ff2b0', anchor: [300, -55, 100] },
  evidence: { key: 'e', label: 'Evidence · Sources & Places', colour: '#ff9e6b', anchor: [0, -265, -60] },
};
const ST = { documented: '#ffffff', derived: '#c9b8ff', candidate: '#ffd27a', unknown: '#ff6b6b', observation: TYPE_COLOUR.candidate, conflict: '#ff6b6b' };
const S = { K: null, G: null, Graph: null, reg: new Map(), nodes: [], links: [], visible: new Set(), expanded: new Set(), history: [], act: new Map(), actL: new Map(), alive: false, labels: [], selected: null, candidates: [], diag: null, edgeLink: new Map() };
const ALL = () => [...S.reg.values()];

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
const rnd = (s, i) => hash(`${s}#${i}`);
const norm = v => { const L = Math.hypot(...v) || 1; return v.map(x => x / L); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ------------------------------------------------------------------ boot
(async function boot() {
  try {
    S.K = await loadAll(); const K = S.K;
    S.G = indexGraph(K.kg, K.db.diagnosis, K.db.ontology);
    S.candidates = loadCandidates(); for (const c of S.candidates) K.addCandidateEdges(candidateEdges(S.G, c), candToClaim(c));
    S.diag = S.candidates.length ? runDiag() : K.db.diagnosis;
    buildRegistry(); initHost(); overview(false); initUi();
    $('#loading').classList.add('gone');
  } catch (e) { $('#err').textContent = `could not load: ${e.message}\n\nserve the planting-db root:  python3 -m http.server 8766  → http://localhost:8766/brain/ontology-preview/`; console.error(e); }
})();
function runDiag() { const K = S.K; return diagnose(S.G.O, K.edges, id => K.label(id), K.kg.gate_facets, K.db.sources); }
const colourOfNode = n => n.kind === 'plant' || n.kind === 'cultivar' ? TYPE_COLOUR.plant : n.kind === 'source' ? (TYPE_COLOUR[n.n.source_type] || '#8892a8') : (AX[n.region] || AX.evidence).colour;
const plantsLinked = cid => { const fam = new Set(S.K.descendants(cid)); return new Set(S.K.edges.filter(e => e.live !== false && fam.has(e.target) && ['claim', 'entity', 'classification', 'height_band', 'layer', 'candidate', 'design'].includes(e.type) && !(e.type === 'design' && e.kg_status === 'unknown')).map(e => e.plant || e.source)); };

// ------------------------------------------------------------------ registry: every kg node once, with its layout parent and children
function buildRegistry() {
  const K = S.K; const reg = S.reg; reg.clear();
  const used = new Set(); for (const e of K.edges) { if (e.live !== false && e.target && ['claim', 'entity', 'classification', 'height_band', 'layer', 'candidate', 'taxonomy'].includes(e.type) || (e.type === 'design' && ['derived', 'candidate'].includes(e.kg_status))) used.add(e.target); if (e.place && e.live !== false && ['claim', 'candidate'].includes(e.type)) used.add(e.place); }
  for (const c of K.kg.nodes) if (c.type === 'concept' && !used.has(c.id) && K.descendants(c.id).some(d => used.has(d))) used.add(c.id);
  const put = n => { const o = reg.get(n.id); if (o) { n.x = o.x; n.y = o.y; n.z = o.z; n.tgt = o.tgt; } reg.set(n.id, n); return n; };
  for (const [id, a] of Object.entries(AX)) if (id !== 'evidence') put({ id, kind: 'axis', n: K.N.get(id), region: id, parent: null, size: 11, used: true, level: 0 });
  put({ id: 'region:evidence', kind: 'axis', n: { id: 'region:evidence', label: 'Evidence · Sources & Places', definition: 'The sources, respondents and places behind every claim; the cross-dimensional evidence layer.' }, region: 'evidence', parent: null, size: 9, used: true, level: 0 });
  for (const c of K.kg.nodes.filter(n => n.type === 'category')) put({ id: c.id, kind: 'cat', n: c, region: c.axis || 'evidence', parent: c.axis || 'region:evidence', size: c.axis ? 6.5 : 5, used: !c.cross_layer || c.id === 'cross:place', level: 1 });
  for (const f of K.kg.nodes.filter(n => n.type === 'facet')) { const inUse = K.kg.nodes.some(n => n.type === 'concept' && n.facet === f.facet_key && used.has(n.id)); put({ id: f.id, kind: 'facet', n: f, region: reg.get(f.category)?.region || 'evidence', parent: f.category, size: 4.4, used: inUse, level: 2 }); }
  for (const c of K.kg.nodes.filter(n => n.type === 'concept')) { const isUsed = used.has(c.id); const k = isUsed ? plantsLinked(c.id).size : 0; const par = c.hierarchy_parent; put({ id: c.id, kind: 'concept', n: c, region: reg.get(c.category)?.region || (c.dimension === 'taxonomy' ? 'axis:x' : 'evidence'), parent: par, size: (c.dimension === 'design' ? 3.6 : 3) + 0.4 * k, used: isUsed, k, design: c.dimension === 'design', level: 3 }); }
  K.plants.forEach((p, i) => put({ id: p.id, kind: 'plant', n: p, region: 'centre', parent: null, size: 8, used: true, level: 0, idx: i }));
  for (const cv of K.kg.nodes.filter(n => n.type === 'cultivar')) put({ id: cv.id, kind: 'cultivar', n: cv, region: 'centre', parent: cv.plant, size: 2.6, used: true, level: 1 });
  for (const s of K.kg.nodes.filter(n => (n.type === 'source' || n.type === 'practitioner') && !n.parent)) { const has = K.edges.some(e => e.live !== false && e.source_id === s.id.split(':')[1]); put({ id: s.id, kind: 'source', n: s, region: 'evidence', parent: 'region:evidence', size: has ? 4 : 2.5, used: has, level: 1 }); }
  if (S.candidates.length) put({ id: 'source:candidate', kind: 'source', n: { id: 'source:candidate', label: 'you (candidate)', source_type: 'candidate' }, region: 'evidence', parent: 'region:evidence', size: 4, used: true, level: 1 });
  for (const n of reg.values()) n.children = [];
  for (const n of reg.values()) if (n.parent && reg.has(n.parent)) reg.get(n.parent).children.push(n);
  for (const n of reg.values()) n.children.sort((a, b) => (a.n.order ?? 99) - (b.n.order ?? 99) || (b.k || 0) - (a.k || 0) || String(a.n.label).localeCompare(String(b.n.label)));
}
const ancestors = id => { const out = []; let n = S.reg.get(id); while (n && n.parent) { out.push(n.parent); n = S.reg.get(n.parent); } return out; };

// ------------------------------------------------------------------ layout: deterministic rings around the parent, outward from the centre
function ring(center, out, n, r, seed) {
  const up = Math.abs(out[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]; const u = norm(cross(out, up)); const v = norm(cross(out, u)); const pts = [];
  const two = n > 9; const n1 = two ? Math.ceil(n / 2) : n;
  for (let i = 0; i < n; i++) { const inner = two && i < n1; const m = two ? (inner ? n1 : n - n1) : n; const j = two && !inner ? i - n1 : i; const R = inner ? r * 0.55 : r; const th = (j / m) * Math.PI * 2 + rnd(seed, 1) * 0.7 + (inner ? 0 : Math.PI / m); const w = (rnd(`${seed}:${i}`, 2) - 0.5) * r * 0.25; pts.push([center[0] + u[0] * Math.cos(th) * R + v[0] * Math.sin(th) * R + out[0] * w, center[1] + u[1] * Math.cos(th) * R + v[1] * Math.sin(th) * R + out[1] * w, center[2] + u[2] * Math.cos(th) * R + v[2] * Math.sin(th) * R + out[2] * w]); }
  return pts;
}
function layout() {
  const vis = id => S.visible.has(id); const R = S.reg;
  for (const [id, a] of Object.entries(AX)) { const n = R.get(id === 'evidence' ? 'region:evidence' : id); n.tgt = a.anchor.slice(); }
  for (const p of ALL().filter(n => n.kind === 'plant')) { const a = p.idx / 3 * Math.PI * 2 + 0.9; p.tgt = [Math.cos(a) * 95, [18, -14, 2][p.idx % 3], Math.sin(a) * 95]; }
  const place = parent => {
    const kids = parent.children.filter(k => vis(k.id)); if (!kids.length) return;
    const P = parent.tgt; const out = parent.kind === 'plant' ? norm([P[0], P[1] + 40, P[2]]) : norm(P);
    const n = kids.length; const spec = parent.kind === 'axis' ? [150, 24] : parent.kind === 'cat' ? [Math.max(80, 20 * n), 24] : parent.kind === 'facet' ? [Math.max(48, 9.5 * n), 18] : parent.kind === 'plant' ? [34, 0] : [30, 12];
    const r = parent.id === 'region:evidence' ? Math.max(90, 14 * n) : spec[0]; const d = spec[1];
    const pts = ring([P[0] + out[0] * d, P[1] + out[1] * d, P[2] + out[2] * d], out, n, r, parent.id);
    kids.forEach((k, i) => { k.tgt = pts[i]; if (!Number.isFinite(k.x)) { k.x = P[0]; k.y = P[1]; k.z = P[2]; } place(k); });
  };
  for (const n of ALL()) if (!n.parent && vis(n.id)) { if (!Number.isFinite(n.x)) { n.x = n.tgt[0]; n.y = n.tgt[1]; n.z = n.tgt[2]; } place(n); }
}

// ------------------------------------------------------------------ visibility: what is shown is what has been explored
function rebuild() {
  const K = S.K; const vis = S.visible; const nodes = ALL().filter(n => vis.has(n.id)); const links = []; const map = new Map(); S.edgeLink = new Map();
  layout();
  const bundle = (key, kind, a, b, e, extra = {}) => { if (!vis.has(a) || !vis.has(b) || a === b) return; if (!map.has(key)) { const l = { id: key, kind, source: a, target: b, edges: [], ...extra }; map.set(key, l); links.push(l); } const l = map.get(key); l.edges.push(e); S.edgeLink.set(e.id, l); };
  for (const n of nodes) if (n.parent && vis.has(n.parent)) links.push({ id: `h:${n.id}`, kind: 'hier', source: n.id, target: n.parent, edges: [], status: 'documented' });
  for (const e of K.edges) {
    if (e.type === 'claim' || e.type === 'entity' || e.type === 'candidate') { if (e.live === false || !e.target) continue; bundle(`${e.plant}→${e.target}`, 'pc', e.plant, e.target, e); if (e.place) bundle(`${e.plant}→${e.place}`, 'pp', e.plant, e.place, e); bundle(`source:${e.source_id}→${e.plant}`, 'sp', `source:${e.source_id}`, e.plant, e); }
    else if (e.type === 'classification') bundle(e.id, 'gf', e.source, e.target, e, { status: 'derived' });
    else if (e.type === 'taxonomy') bundle(e.id, 'tax', e.source, e.target, e, { status: 'documented' });
    else if (e.type === 'height_band') bundle(`${e.plant}→${e.target}`, 'band', e.plant, e.target, e, { status: 'derived' });
    else if (e.type === 'layer') bundle(e.id, 'layer', e.source, e.target, e, { status: 'derived' });
    else if (e.type === 'design') { if (e.kg_status === 'unknown') continue; bundle(e.id, 'design', e.source, e.target, e, { status: e.kg_status }); }
    else if (e.type === 'concept') bundle(e.id, 'cc', e.source, e.target, e, { status: e.kg_status, rel: e.rel });
    else if (e.type === 'relation') { if (!e.live && e.kg_status !== 'candidate') continue; if (e.kg_status === 'candidate' && !S.expanded.has(e.source) && !S.expanded.has(e.target)) continue; bundle(e.id, 'rel', e.source, e.target, e, { status: e.kg_status }); }
  }
  for (const l of links) { l.source = S.reg.get(l.source); l.target = S.reg.get(l.target); }
  S.nodes = nodes; S.links = links;
  S.Graph.graphData({ nodes, links });
  rebuildLabels(); renderStats(); renderCrumb();
}
function show(ids) { let changed = false; for (const id of ids) { if (!S.reg.has(id)) continue; for (const a of [id, ...ancestors(id)]) if (!S.visible.has(a)) { S.visible.add(a); changed = true; } } return changed; }
function hideSubtree(id) { const n = S.reg.get(id); if (!n) return; for (const k of n.children) { if (S.visible.has(k.id)) { S.visible.delete(k.id); hideSubtree(k.id); } } S.expanded.delete(id); }
function snapshot() { S.history.push({ visible: new Set(S.visible), expanded: new Set(S.expanded), selected: S.selected?.id || null }); if (S.history.length > 60) S.history.shift(); }
function overview(animate = true) {
  S.visible = new Set(); S.expanded = new Set(); S.history = []; S.selected = null; clearAct(); closeCard();
  show(['axis:x', 'axis:y', 'axis:z', 'region:evidence', ...ALL().filter(n => n.kind === 'cat' && n.used && n.region !== 'evidence').map(n => n.id), ...ALL().filter(n => n.kind === 'plant').map(n => n.id)]);
  rebuild(); const asp = window.innerWidth / window.innerHeight; const D = 900 * Math.max(1, 1.45 / asp); S.Graph.cameraPosition({ x: 0, y: D * 0.12, z: D }, { x: 0, y: -10, z: 0 }, animate ? 1200 : 0);
}
function back() { const h = S.history.pop(); if (!h) { overview(); return; } S.visible = h.visible; S.expanded = h.expanded; clearAct(); rebuild(); const n = h.selected && S.reg.get(h.selected); if (n && S.visible.has(n.id)) { S.selected = n; openCard(cardFor(n)); focusOn(n); } else closeCard(); renderCrumb(); }

// what a click reveals (progressive disclosure), by kind — only nodes joined to it by a kg.json edge
function revealFor(n) {
  const K = S.K; const out = new Set();
  if (n.kind === 'axis' || n.kind === 'cat') { for (const k of n.children) if (k.used) out.add(k.id); }
  else if (n.kind === 'facet') { for (const k of n.children) if (k.used) { out.add(k.id); for (const g of k.children) if (g.used) out.add(g.id); } }
  else if (n.kind === 'concept') {
    for (const k of n.children) if (k.used) out.add(k.id);
    for (const e of K.edges) {
      if (e.type === 'concept' && (e.source === n.id || e.target === n.id || (e.alternatives || []).includes(n.id))) { out.add(e.source); out.add(e.target); for (const a of e.alternatives || []) if (e.source === n.id) out.add(a); }
      if (e.type === 'design' && e.target === n.id && e.kg_status !== 'unknown') out.add(e.source);
      if ((e.type === 'layer' || e.type === 'height_band' || e.type === 'classification' || e.type === 'taxonomy') && (e.target === n.id || e.source === n.id)) { out.add(e.source); out.add(e.target); }
    }
    for (const p of plantsLinked(n.id)) out.add(p);
  }
  else if (n.kind === 'plant') { for (const e of K.edgesFrom(n.id)) if (['classification', 'taxonomy', 'layer', 'cultivar_of'].includes(e.type) || (e.type === 'design' && e.kg_status !== 'unknown')) out.add(e.target); for (const k of n.children) out.add(k.id); for (const e of K.edgesTo(n.id)) if (e.type === 'cultivar_of') out.add(e.source); }
  else if (n.kind === 'source') { for (const e of K.edges) if (e.source_id === n.id.split(':')[1] && e.live !== false && e.plant) out.add(e.plant); }
  out.delete(n.id); return [...out];
}
function expandNode(n) {
  const already = S.expanded.has(n.id);
  snapshot();
  if (already && (n.kind === 'axis' || n.kind === 'cat' || n.kind === 'facet')) { hideSubtree(n.id); if (n.kind !== 'axis') { } rebuild(); return []; }
  const ids = revealFor(n); const fresh = ids.filter(id => !S.visible.has(id) && !ancestors(id).some(a => !S.visible.has(a) && !ids.includes(a)));
  show(ids); S.expanded.add(n.id); rebuild();
  return ids;
}

// ------------------------------------------------------------------ host: spheres, thin lines, soft light
function initHost() {
  const Graph = new ForceGraph3D($('#graph'), { controlType: 'orbit' }).backgroundColor('#04060f').showNavInfo(false)
    .nodeThreeObject(nodeObject).nodeThreeObjectExtend(false).nodeLabel(() => '')
    .linkThreeObject(linkObject).linkThreeObjectExtend(false).linkPositionUpdate(linkPositionUpdate)
    .enableNodeDrag(false).cooldownTicks(0).warmupTicks(0)
    .onNodeClick(n => { S.swallow = true; select(n); })
    .onNodeHover(n => { document.body.style.cursor = n ? 'pointer' : ''; hover(n); })
    .onLinkClick(l => { S.swallow = true; selectLink(l); })
    .onBackgroundClick(() => { if (S.swallow) { S.swallow = false; return; } deselect(); });
  const sc = Graph.scene(); sc.fog = new THREE.FogExp2(0x04060f, 0.0007);
  sc.add(new THREE.HemisphereLight(0xdfe8ff, 0x101424, 0.9)); const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(300, 500, 400); sc.add(dl);
  Graph.postProcessingComposer().addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.22, 0.45, 0.82));
  const ctl = Graph.controls(); ctl.autoRotate = false; ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.minDistance = 60; ctl.maxDistance = 2000;
  S.Graph = Graph; S.tex = glowTexture(); S.geo = new THREE.SphereGeometry(1, 28, 20);
  (function loop() { frame(); requestAnimationFrame(loop); })();
}
function glowTexture() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64); grd.addColorStop(0, 'rgba(255,255,255,0.55)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.14)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
function nodeObject(n) {
  const col = new THREE.Color(colourOfNode(n)); const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.85), emissive: col, emissiveIntensity: n.used ? (n.kind === 'axis' || n.kind === 'cat' ? 0.28 : 0.4) : 0.12, roughness: 0.5, metalness: 0.05 });
  const mesh = new THREE.Mesh(S.geo, mat); mesh.scale.setScalar(n.size); g.add(mesh);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: S.tex, color: col, transparent: true, opacity: n.used ? 0.32 : 0.12, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(n.size * 2.4); g.add(halo);
  n.__obj = { group: g, mesh, mat, halo, baseE: mat.emissiveIntensity, baseH: halo.material.opacity }; return g;
}
const SEG = 14;
function linkStyle(l) {
  switch (l.kind) {
    case 'hier': return { col: '#8f9bb8', a: 0.22 };
    case 'pc': { const cand = l.edges.every(e => e.type === 'candidate'); const ver = l.edges.some(e => e.status === 'verified'); return { col: cand ? ST.observation : ver ? '#ffffff' : (AX[l.target.region] || AX.evidence).colour, a: cand ? 0.85 : 0.42 }; }
    case 'pp': return { col: AX.evidence.colour, a: 0.25 };
    case 'sp': return { col: TYPE_COLOUR[l.edges[0].source_type] || '#8892a8', a: 0.3 };
    case 'gf': case 'tax': return { col: AX['axis:x'].colour, a: 0.55 };
    case 'band': case 'layer': return { col: ST.derived, a: 0.45 };
    case 'design': return { col: ST[l.status] || '#888', a: 0.55 };
    case 'cc': return { col: l.rel === 'maps_to' ? ST.derived : AX['axis:z'].colour, a: 0.5 };
    case 'rel': return { col: l.status === 'candidate' ? ST.candidate : '#ffffff', a: 0.35 };
    default: return { col: '#8892a8', a: 0.3 };
  }
}
function linkObject(l) {
  const st = linkStyle(l); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEG * 3), 3)); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(SEG * 3), 3));
  const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: st.a, depthWrite: false });
  const line = new THREE.Line(geo, mat); l.__obj = { line, mat, base: st.a, col: new THREE.Color(st.col), pts: geo.attributes.position.array, cols: geo.attributes.color.array }; paintLink(l, 1); return line;
}
function paintLink(l, f) { const o = l.__obj; if (!o) return; const c = o.col, cols = o.cols; for (let i = 0; i < SEG; i++) { const k = typeof f === 'function' ? f(i / (SEG - 1)) : f; const w = Math.max(0, k - 1) * 0.5; cols[i * 3] = Math.min(1, c.r * k + w); cols[i * 3 + 1] = Math.min(1, c.g * k + w); cols[i * 3 + 2] = Math.min(1, c.b * k + w); } o.line.geometry.attributes.color.needsUpdate = true; }
function linkPositionUpdate(obj, { start, end }, l) {
  const o = l.__obj; if (!o) return false; const p = o.pts; const grow = l.born ? Math.min(1, (performance.now() - l.born) / 1200) : 1;
  for (let i = 0; i < SEG; i++) { const t = Math.min(grow, i / (SEG - 1)); p[i * 3] = start.x + (end.x - start.x) * t; p[i * 3 + 1] = start.y + (end.y - start.y) * t; p[i * 3 + 2] = start.z + (end.z - start.z) * t; }
  o.line.geometry.attributes.position.needsUpdate = true; if (grow >= 1 && l.born && performance.now() - l.born > 1400) delete l.born; return true;
}

// ------------------------------------------------------------------ activation: a short signal along the links just revealed, then rest
function actOf(n, now) { const t0 = S.act.get(n.id); if (t0 === undefined) return 0; const p = (now - t0) / 360; return p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p); }
function pulse(seeds, hops, allow, keep = false) {
  const now = performance.now(); if (!keep) { S.act.clear(); S.actL.clear(); }
  const adj = new Map(); for (const l of S.links) { const a = l.source.id, b = l.target.id; if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []); adj.get(a).push({ l, v: b, dir: 1 }); adj.get(b).push({ l, v: a, dir: -1 }); }
  let frontier = []; const seen = new Map(); for (const s of seeds) if (S.reg.has(s) && S.visible.has(s)) { S.act.set(s, now); seen.set(s, 0); frontier.push(s); }
  for (let h = 0; h < hops && frontier.length; h++) { const next = []; for (const u of frontier) for (const { l, v, dir } of adj.get(u) || []) { if (seen.has(v) && seen.get(v) <= h) continue; if (allow && !allow(S.reg.get(u), l, S.reg.get(v), h)) continue; const jit = rnd(l.id, 11) * 140; if (!S.actL.has(l.id)) S.actL.set(l.id, { t0: now + h * STEP + jit, dir }); if (!seen.has(v)) { seen.set(v, h + 1); S.act.set(v, now + (h + 1) * STEP + jit); next.push(v); } } frontier = next; }
  S.alive = S.act.size > 0; S.aliveUntil = now + (hops + 2) * STEP + 1400; renderState();
}
function pulseWaves(waves) {
  const now = performance.now(); S.act.clear(); S.actL.clear();
  waves.forEach((w, i) => { for (const id of w.nodes) if (S.visible.has(id) && !S.act.has(id)) S.act.set(id, now + i * STEP + rnd(id, 13) * 100); for (const e of w.edges) { const l = S.edgeLink.get(e.id) || S.links.find(x => x.id === e.id); if (!l) continue; if (!S.actL.has(l.id)) { const srcLit = S.act.has(l.source.id); S.actL.set(l.id, { t0: now + Math.max(0, i - 1) * STEP + rnd(l.id, 11) * 140, dir: srcLit ? 1 : -1 }); } for (const id of [l.source.id, l.target.id]) if (!S.act.has(id)) S.act.set(id, now + i * STEP + 200); } });
  S.alive = S.act.size > 0; S.aliveUntil = now + (waves.length + 1) * STEP + 1400; renderState();
}
function clearAct() { S.act.clear(); S.actL.clear(); S.alive = false; renderState(); }
// reveal the nodes of a traversal wave by wave, then send the signal along them
function revealWaves(waves, seedId) {
  snapshot(); const ids = waves.flatMap(w => w.nodes).concat(waves.flatMap(w => w.edges.flatMap(e => [e.source, e.target, e.plant].filter(Boolean))));
  show(ids); for (const w of waves) for (const id of w.nodes) if (S.reg.get(id)?.kind !== 'concept') S.expanded.add(id);
  rebuild(); pulseWaves(waves); const seed = S.reg.get(seedId); if (seed && S.visible.has(seed.id)) { S.selected = seed; focusOn(seed, 640); } renderCrumb();
}

// ------------------------------------------------------------------ per frame: tween to the layout target, glow on activation, labels
const _v = new THREE.Vector3();
function frame() {
  const now = performance.now(); const cam = S.Graph.camera(); const w = window.innerWidth, h = window.innerHeight;
  for (const n of S.nodes) { if (!n.tgt) continue; n.x += (n.tgt[0] - n.x) * 0.12; n.y += (n.tgt[1] - n.y) * 0.12; n.z += (n.tgt[2] - n.z) * 0.12; }
  if (S.alive && now > S.aliveUntil) { S.alive = false; renderState(); }
  const alive = S.alive;
  for (const n of S.nodes) { const o = n.__obj; if (!o) continue; const a = alive ? actOf(n, now) : 0; const sel = S.selected?.id === n.id ? 1 : 0; o.mat.emissiveIntensity = o.baseE + 0.7 * a + 0.35 * sel; o.halo.material.opacity = o.baseH + 0.45 * a + 0.3 * sel; const sc = n.size * (1 + 0.18 * a + 0.1 * sel); o.mesh.scale.setScalar(sc); o.halo.scale.setScalar(sc * 2.4); }
  for (const l of S.links) { const o = l.__obj; if (!o) continue; const A = alive && S.actL.get(l.id); if (A) { const p = (now - A.t0) / 650; paintLink(l, u => { const d = (A.dir > 0 ? u : 1 - u) - p; if (p < 0) return 1; const win = Math.exp(-(d * 6) * (d * 6)); return (p > 1.2 ? 1.5 : d < 0 ? 1.4 : 1) + 1.6 * win; }); o.mat.opacity = Math.min(1, o.base * 1.8 + 0.2); } else { const sel = S.selected && (l.source.id === S.selected.id || l.target.id === S.selected.id); paintLink(l, sel ? 1.5 : 1); o.mat.opacity = sel ? Math.min(1, o.base * 1.6 + 0.15) : o.base; } }
  // every visible node keeps its label; labels nudge apart vertically
  for (const L of S.labels) { const n = L.n; if (!Number.isFinite(n.x)) { L.el.classList.add('hidden'); continue; } _v.set(n.x, n.y - n.size - 3, n.z); _v.project(cam); if (_v.z > 1) { L.el.classList.add('hidden'); continue; } const dist = cam.position.distanceTo(new THREE.Vector3(n.x, n.y, n.z)); L.el.classList.remove('hidden'); L.el.classList.toggle('far', dist > 900 && n.kind === 'concept'); L.el.classList.toggle('sel', S.selected?.id === n.id); L.sx = (_v.x + 1) / 2 * w; L.sy = (1 - _v.y) / 2 * h; L.d = dist; L.el.style.left = `${L.sx}px`; L.el.style.top = `${L.sy}px`; L.shown = true; }
  const placed = []; for (const L of S.labels.filter(x => x.shown).sort((a, b) => a.d - b.d)) { const wpx = L.el.offsetWidth || 60, hpx = L.el.offsetHeight || 14; let y = L.sy; for (let k = 0; k < 6; k++) { const hit = placed.find(p => Math.abs(p.x - L.sx) < (p.w + wpx) / 2 + 6 && y < p.y + p.h + 2 && y + hpx + 2 > p.y); if (!hit) break; y = hit.y + hit.h + 3; } if (y !== L.sy) L.el.style.top = `${y}px`; placed.push({ x: L.sx, y, w: wpx, h: hpx }); L.shown = false; }
}
function rebuildLabels() {
  for (const L of S.labels) L.el.remove(); S.labels = []; const K = S.K;
  const add = (n, html, cls) => { const el = document.createElement('div'); el.className = `lbl ${cls}`; el.innerHTML = html; el.addEventListener('click', e => { e.stopPropagation(); select(n); }); $('#labels').appendChild(el); S.labels.push({ n, el }); };
  for (const n of S.nodes) {
    const sub = n.kind === 'axis' ? (n.id === 'region:evidence' ? `${ALL().filter(x => x.kind === 'source' && x.used).length} sources` : `${ALL().filter(x => x.kind === 'concept' && x.region === n.id && x.used).length} concepts in use`) : n.kind === 'cat' ? `${ALL().filter(x => x.kind === 'concept' && x.n.category === n.id && x.used).length}` : n.kind === 'facet' ? `${n.children.filter(c => c.used).length}` : n.kind === 'plant' ? esc((n.n.common || [])[0] || '') : n.kind === 'concept' && n.k > 1 ? `${n.k}` : '';
    add(n, `${esc(n.n.label.length > 34 && n.kind === 'source' ? n.n.label.slice(0, 32) + '…' : n.n.label)}${sub ? `<small>${sub}</small>` : ''}`, `${n.kind} ${AX[n.region]?.key || (n.kind === 'plant' ? 'p' : 'e')}${S.expanded.has(n.id) ? ' open' : ''}${n.design ? ' design' : ''}`);
  }
}

// ------------------------------------------------------------------ hover, state line, breadcrumb
const tip = $('#tip');
function hover(n) { if (!n) { tip.style.display = 'none'; return; } const K = S.K; const o = n.n; let html = `<b>${esc(o.label)}</b>`; if (n.kind === 'concept') html += `<div class="meta">${n.k ? `${n.k} plant${n.k === 1 ? '' : 's'}` : 'dormant'}${o.to_confirm ? ' · to confirm' : ''} · click to open its links</div>`; else if (n.kind === 'axis' || n.kind === 'cat' || n.kind === 'facet') html += `<div class="meta">${S.expanded.has(n.id) ? 'click to close' : 'click to open'}</div>`; else if (n.kind === 'plant') html += `<div class="meta">${K.plantEvidenceEdges(n.id).length} evidence links · click to open</div>`; tip.innerHTML = html; tip.style.display = 'block'; }
document.addEventListener('pointermove', e => { if (tip.style.display !== 'none') { tip.style.left = `${Math.min(window.innerWidth - 300, e.clientX + 14)}px`; tip.style.top = `${e.clientY + 14}px`; } });
function renderState() { const el = $('#state'); if (S.alive) { const n = [...S.act.keys()].length, l = [...S.actL.keys()].length; el.textContent = `signal: ${n} nodes · ${l} links`; } else el.textContent = S.candidates.length ? `${S.candidates.length} candidate observation${S.candidates.length === 1 ? '' : 's'} this session` : ''; }
function renderStats() { const c = S.K.kg.counts; $('#stats').textContent = `${S.nodes.length} of ${S.reg.size} nodes shown · ${S.links.length} links · ${c.claims} claims · documented ${c.by_status.documented} · derived ${c.by_status.derived} · candidate ${c.by_status.candidate} · unknown ${c.by_status.unknown}`; }
function renderCrumb() {
  const el = $('#crumb'); const sel = S.selected; const path = sel ? [sel.id, ...ancestors(sel.id)].reverse() : [];
  el.innerHTML = `<button id="btn-over" ${S.history.length || sel ? '' : 'disabled'}>Overview</button><button id="btn-back" ${S.history.length ? '' : 'disabled'}>← Back</button>` + (path.length ? `<span class="path">${path.map((id, i) => `<span class="link" data-id="${esc(id)}">${esc(S.K.label(id))}</span>`).join('<i>›</i>')}</span>` : '<span class="path faint">click a sphere to open it</span>');
  $('#btn-over').addEventListener('click', () => overview()); $('#btn-back').addEventListener('click', back); bind(el);
}

// ------------------------------------------------------------------ selection
const card = $('#card'), CB = $('#card-body');
function openCard(html) { CB.innerHTML = html; card.classList.add('open'); bind(CB); card.scrollTop = 0; }
function closeCard() { card.classList.remove('open'); CB.innerHTML = ''; }
function deselect() { S.selected = null; closeCard(); clearAct(); rebuildLabels(); renderCrumb(); }
function clearAll() { deselect(); }
function focusOn(n, dist) { if (!n || !n.tgt) return; const cam = S.Graph.camera(); const ctl = S.Graph.controls(); const d = new THREE.Vector3().subVectors(cam.position, ctl.target).normalize(); const D = dist || (n.kind === 'axis' ? 720 : n.kind === 'cat' ? 600 : n.kind === 'facet' ? 520 : n.kind === 'plant' ? 560 : 480); const t = n.tgt; S.Graph.cameraPosition({ x: t[0] + d.x * D, y: t[1] + d.y * D, z: t[2] + d.z * D }, { x: t[0], y: t[1], z: t[2] }, 1100); }
const cardFor = n => n.kind === 'concept' ? (n.design ? cardDesign(n) : cardConcept(n)) : n.kind === 'plant' ? cardPlant(n) : n.kind === 'source' ? cardSource(n) : n.kind === 'cultivar' ? cardPlant(S.reg.get(n.n.plant)) : cardStructure(n);
function select(n) {
  if (!n) return; if (typeof n === 'string') n = S.reg.get(n); if (!n) return;
  if (n.kind === 'link') { selectLink(n.link); return; }
  const revealed = expandNode(n); S.selected = n;
  if (!S.visible.has(n.id)) { show([n.id]); rebuild(); }
  pulse([n.id], 1, (u, l, v) => revealed.includes(v.id) || l.kind !== 'hier' || v.id === n.parent);
  openCard(cardFor(n)); focusOn(n); rebuildLabels(); renderCrumb();
}
function revealAndSelect(id) { if (!S.visible.has(id)) { snapshot(); show([id]); rebuild(); } select(S.reg.get(id)); }
function selectLink(l) {
  if (!l) return; snapshot();
  const sids = new Set(l.edges.map(e => e.source_id).filter(Boolean)); for (const e of l.edges) if (e.type === 'design') { for (const s of e.use_sources || []) sids.add(s); for (const r of e.requirements || []) for (const ev of r.evidence || []) if (ev.source_id) sids.add(ev.source_id); }
  const srcs = [...sids].map(s => `source:${s}`).filter(s => S.reg.has(s)); show([l.source.id, l.target.id, ...srcs]); rebuild();
  const L = S.links.find(x => x.id === l.id) || l; const now = performance.now(); S.act.clear(); S.actL.clear(); S.act.set(L.source.id, now); S.act.set(L.target.id, now + STEP); S.actL.set(L.id, { t0: now, dir: 1 });
  for (const s of srcs) { const sl = S.links.find(x => x.kind === 'sp' && x.source.id === s && (x.target.id === L.source.id || x.target.id === L.target.id)); if (sl) { S.actL.set(sl.id, { t0: now + STEP, dir: 1 }); S.act.set(s, now + 2 * STEP); } }
  S.alive = true; S.aliveUntil = now + 4 * STEP; S.selected = null; renderState(); openCard(cardLink(L)); renderCrumb();
}
function selectEdge(edgeId) { const l = S.edgeLink.get(edgeId); if (l) { selectLink(l); return; } const e = S.K.edges.find(x => x.id === edgeId); if (!e) return; snapshot(); show([e.source, e.target].filter(Boolean)); rebuild(); const l2 = S.edgeLink.get(edgeId); if (l2) selectLink(l2); }
function bind(root) {
  root.querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); revealAndSelect(el.dataset.id); }));
  root.querySelectorAll('[data-edge]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); selectEdge(el.dataset.edge); }));
  root.querySelectorAll('[data-claim]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); const ed = S.K.edges.find(x => x.claim_id === el.dataset.claim && x.target); if (ed) selectEdge(ed.id); }));
  root.querySelectorAll('[data-path]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); runPath(el.dataset.path, el.dataset.arg, el.dataset.arg2); }));
}

const dot = c => `<i class="dot" style="background:${c}"></i>`;
const stTag = s => `<span class="tag ${esc(s)}">${esc(s)}</span>`;
const regionDot = n => dot((AX[n.region] || AX.evidence).colour);
const crumb = id => S.K.hierarchyPath(id).reverse().map(x => `<span class="link" data-id="${esc(x)}">${esc(S.K.label(x))}</span>`).join(' › ');
const edgeVal = e => e.value_label != null ? (Array.isArray(e.value_label) ? e.value_label.join(', ') : e.value_label) : e.numbers ? fmtNum(e.numbers) : S.K.label(e.target);
function evidenceRow(e, withPlant = false) { const K = S.K; const conds = (e.conditions || []).map(c => K.label(c.concept_id)).join(', '); const c = e.claim_id ? K.claimOf(e.claim_id) : null; return `<div class="row" ${e.claim_id ? `data-claim="${esc(e.claim_id)}"` : ''}><i class="st ${esc(e.status || e.verification)}" style="--c:${TYPE_COLOUR[e.source_type] || TYPE_COLOUR.plant}"></i><div>${withPlant ? `<em>${esc(K.label(e.plant))}</em> · ` : ''}<span class="val">${esc(edgeVal(e))}</span>${e.spanned ? ' <span class="faint">(range spans this class)</span>' : ''}${e.cultivar ? ` <span class="muted">‘${esc(e.cultivar)}’</span>` : ''}<br><span class="meta">${esc(K.srcLabel(e.source_id))} · ${esc(e.status || e.verification)}${conds ? ' · under ' + esc(conds) : ''}${e.place ? ' · ' + esc(K.label(e.place)) + (K.PLACE_VAN.has(e.place) ? ' ✓ local' : '') : ''}${c?.source_url ? ` · <a href="${esc(c.source_url)}" target="_blank" rel="noopener">source</a>` : ''}</span></div></div>`; }
const chip = (id, extra = '') => { const n = ALL().find(x => x.id === id); if (!n) return ''; const k = n.kind === 'concept' ? plantsLinked(id).size : 0; return `<span class="chip ${n.used === false ? 'dim' : ''}${S.visible.has(id) ? ' on' : ''}" data-id="${esc(id)}" style="--c:${colourOfNode(n)}">${esc(S.K.label(id))}${k ? `<small>${k}</small>` : ''}${extra}</span>`; };
function cardStructure(n) {
  const K = S.K; const o = n.n; const kids = n.kind === 'axis' ? ALL().filter(x => x.kind === 'cat' && x.region === n.id) : n.kind === 'cat' ? ALL().filter(x => x.kind === 'facet' && x.n.category === n.id) : ALL().filter(x => x.kind === 'concept' && x.n.hierarchy_parent === n.id);
  const used = kids.filter(k => k.used); const dormant = kids.filter(k => !k.used);
  const srcs = n.id === 'region:evidence' ? ALL().filter(x => x.kind === 'source' && x.used) : [];
  return `<h2>${regionDot(n)} ${esc(o.label)}</h2><div class="kicker">${n.kind === 'axis' ? 'knowledge axis' : n.kind === 'cat' ? `category · ${o.cross_layer ? 'cross-dimensional layer' : crumb(n.id)}` : `facet · ${crumb(n.id)}`}</div><p class="lead">${esc(o.definition || '')}</p>${o.source_of_term ? `<p class="muted small">source: ${esc(o.source_of_term)}</p>` : ''}
  ${used.length ? `<h3>${n.kind === 'axis' ? 'categories' : n.kind === 'cat' ? 'facets in use' : 'concepts with evidence'} <span class="faint">${used.length}</span></h3><div class="chips">${used.map(k => chip(k.id, k.kind === 'concept' ? '' : `<small>${ALL().filter(x => x.kind === 'concept' && (k.kind === 'facet' ? x.n.hierarchy_parent === k.id || x.n.facet === k.n.facet_key : x.n.category === k.id) && x.used).length}</small>`)).join('')}</div>` : ''}
  ${srcs.length ? `<h3>sources</h3><div class="chips">${srcs.map(s => chip(s.id)).join('')}</div>` : ''}
  ${dormant.length ? `<details><summary>dormant vocabulary · ${dormant.length}</summary><div class="chips">${dormant.slice(0, 60).map(k => chip(k.id)).join('')}</div></details>` : ''}
  <p class="muted small">Click the sphere again to close what it opened; chips open one item.</p>`;
}
function cardConcept(n) {
  const K = S.K; const o = n.n; const fam = new Set(K.descendants(n.id)); const es = K.edges.filter(e => e.live !== false && fam.has(e.target) && ['claim', 'entity', 'candidate', 'classification', 'height_band', 'layer'].includes(e.type)); const ps = [...new Set(es.map(e => e.plant || e.source))]; const srcs = [...new Set(es.map(e => e.source_id).filter(Boolean))];
  const cc = K.edges.filter(e => e.type === 'concept' && (e.target === n.id || (e.alternatives || []).includes(n.id) || e.source === n.id));
  return `<h2>${regionDot(n)} ${esc(o.label)}</h2><div class="kicker">${crumb(n.id)}</div><p class="lead">${esc(o.definition)}</p>${o.aliases?.length ? `<p class="muted small">also: ${esc(o.aliases.join(' · '))}</p>` : ''}<p class="muted small">term source: ${esc(o.source_of_term || '')}</p>
  ${ps.length ? `<h3>${ps.length} plant${ps.length === 1 ? '' : 's'} · ${es.length} links · ${srcs.length} sources</h3>${ps.map(p => `<div class="row" data-id="${p}"><i class="st verified" style="--c:${TYPE_COLOUR.plant}"></i><div><em class="val">${esc(K.label(p))}</em><br><span class="meta">${es.filter(e => (e.plant || e.source) === p).length} links · ${es.filter(e => (e.plant || e.source) === p && e.status === 'verified').length} verified · ${es.filter(e => (e.plant || e.source) === p && e.kg_status === 'derived').length} derived</span></div></div>`).join('')}<details><summary>the claims and their sources</summary>${ps.map(p => `<div class="muted small" style="margin-top:6px"><em>${esc(K.label(p))}</em></div>${es.filter(e => (e.plant || e.source) === p && e.type !== 'classification').map(e => evidenceRow(e)).join('')}`).join('')}</details>` : '<p class="muted">Dormant: in the vocabulary, no claim links it to a plant yet. An observation can wake it.</p>'}
  ${cc.length ? `<h3>cross-dimensional relations</h3>${cc.map(e => `<div class="row" data-edge="${esc(e.id)}"><i class="st ${esc(e.kg_status)}" style="--c:${ST[e.kg_status]}"></i><div><span class="val">${esc(e.text)}</span><br><span class="meta">${esc(e.rel)} · ${esc(e.kg_status)}${e.to_confirm ? ' · to confirm' : ''}</span></div></div>`).join('')}` : ''}`;
}
function cardDesign(n) {
  const K = S.K; const o = n.n; const b = K.pathB(n.id);
  return `<h2>${regionDot(n)} ${esc(o.label)}</h2><div class="kicker">${crumb(n.id)}${o.to_confirm ? ' · <span class="warn">term to confirm</span>' : ''}</div><p class="lead">${esc(o.definition)}</p><p class="muted small">source: ${esc(o.source_of_term || '')}</p>
  <h3>what it needs from a plant</h3>${b.requirements.map(r => `<div class="row" data-edge="${esc(r.id)}"><i class="st documented" style="--c:${AX['axis:y'].colour}"></i><div><span class="val">${esc(r.strength)}: ${(r.alternatives || [r.target]).map(a => chip(a)).join(' or ')}</span><br><span class="meta">${esc(r.basis?.source || '')}${r.to_confirm ? ' · to confirm' : ''}</span></div></div>`).join('') || '<p class="muted">no requirement recorded</p>'}
  ${b.uses.length ? `<p class="muted small">KPU uses that name it (KG-R1): ${b.uses.map(u => chip(u.source)).join(' ')}</p>` : ''}
  <h3>plants</h3>${b.plants.map(p => `<div class="row" data-edge="${esc(p.edge.id)}"><i class="st ${esc(p.kg_status)}" style="--c:${ST[p.kg_status]}"></i><div><em class="val">${esc(K.label(p.plant))}</em> ${stTag(p.kg_status)} <span class="meta">${esc(p.verdict)}</span>${p.liveVerdict ? `<br><span class="cand">with this session's observation: ${esc(p.liveVerdict)} — still candidate</span>` : ''}<br><span class="meta">${esc(p.edge.text)}</span></div></div>`).join('') || '<p class="warn">No plant is linked to this concept by any source or rule.</p>'}
  <p><button data-path="B" data-arg="${esc(n.id)}">run as path B</button> <button data-path="D" data-arg="${esc(n.id)}">show the gaps (path D)</button></p>`;
}
function cardPlant(n) {
  const K = S.K; const es = K.plantEvidenceEdges(n.id); const d = S.diag.plants[n.id]; const gf = K.edges.find(e => e.type === 'classification' && e.source === n.id); const tax = K.edgesFrom(n.id, ['in_genus']); const design = K.edgesFrom(n.id, null, ['design']).filter(e => e.kg_status !== 'unknown'); const unknown = K.edgesFrom(n.id, null, ['design']).filter(e => e.kg_status === 'unknown');
  const byC = {}; for (const e of es) { const c = K.N.get(e.target)?.category; if (!c) continue; (byC[c] = byC[c] || new Map()).set(e.target, (byC[c].get(e.target) || 0) + 1); }
  const vars = S.diag.variation.filter(x => x.plant === n.id), dis = S.diag.disagreement.filter(x => x.plant === n.id);
  const order = ['cat:taxonomy', 'cat:growth_form_cat', 'cat:environment', 'cat:morphology', 'cat:temporal', 'cat:ecological', 'cat:landscape_use', 'cat:vertical_structure', 'cat:space_making', 'cat:composition', 'cat:planting_role', 'cross:place', 'cross:time'];
  return `<h2><em>${esc(n.n.label)}</em></h2><div class="kicker">${esc((n.n.common || []).join(' · '))} · ${esc((n.n.origin_status || '').replace(/_/g, ' '))}</div>
  ${tax.map(t => `<div class="row" data-edge="${esc(t.id)}">${dot(AX['axis:x'].colour)}<div><span class="val">${esc(t.text)}</span> ${stTag('documented')}</div></div>`).join('')}
  ${gf ? `<div class="row" data-edge="${esc(gf.id)}">${dot(AX['axis:x'].colour)}<div><span class="val">${esc(K.label(gf.target))}</span> ${stTag(gf.verification)} <span class="tag derived">derived</span><br><span class="meta">${esc(gf.text)}</span></div></div>` : ''}
  <p class="lead">${esc(d?.text || '')}</p>
  ${vars.length || dis.length ? `<p class="muted small">${vars.map(x => `↔ ${esc(x.text)}`).join('<br>')}${vars.length && dis.length ? '<br>' : ''}${dis.slice(0, 3).map(x => `≠ ${esc(x.text)}`).join('<br>')}${dis.length > 3 ? `<br>… ${dis.length - 3} more disagreements` : ''}</p>` : ''}
  <h3>${dot(AX['axis:z'].colour)} design knowledge</h3>${design.map(e => `<div class="row" data-edge="${esc(e.id)}"><i class="st ${esc(e.kg_status)}" style="--c:${ST[e.kg_status]}"></i><div><span class="val">${esc(K.label(e.target))}</span> ${stTag(e.kg_status)} <span class="meta">${esc(e.verdict || '')}</span></div></div>`).join('') || '<p class="muted small">no design link</p>'}${unknown.length ? `<p class="muted small">unknown: ${unknown.map(e => chip(e.target)).join(' ')}</p>` : ''}
  ${order.filter(c => byC[c]).map(c => `<h3>${dot((AX[K.N.get(c)?.axis] || AX.evidence).colour)} ${esc(K.label(c))} <span class="faint">${byC[c].size}</span></h3><div class="chips">${[...byC[c].entries()].sort((a, b) => b[1] - a[1]).map(([id, k]) => chip(id, `<small>${k}</small>`)).join('')}</div>`).join('')}
  <p><button data-path="C" data-arg="${esc(n.id)}" data-arg2="height_class">height: how the claims vary (path C)</button></p>`;
}
function cardSource(n) { const K = S.K; const sid = n.id.split(':')[1]; const es = K.edges.filter(e => e.live !== false && e.target && e.source_id === sid && ['claim', 'entity', 'candidate'].includes(e.type)); const rec = K.db.sources[sid] || {}; const byP = {}; for (const e of es) (byP[e.plant] = byP[e.plant] || []).push(e); return `<h2>${esc(n.n.label)}</h2><div class="kicker">${esc(n.n.source_type || '')}${n.n.geo ? ' · ' + esc(n.n.geo) : ''}${n.n.licence_tier ? ' · licence tier ' + esc(n.n.licence_tier) : ''} · ${es.length} claims</div>${rec.role_in_db ? `<p class="muted small">${esc(rec.role_in_db)}</p>` : ''}${rec.url ? `<p class="small"><a href="${esc(rec.url)}" target="_blank" rel="noopener">${esc(rec.url.replace(/^https?:\/\//, ''))}</a></p>` : ''}${Object.entries(byP).map(([p, ees]) => `<h3><em>${esc(K.label(p))}</em> · ${ees.length}</h3><div class="chips">${[...new Set(ees.map(e => e.target))].map(cid => chip(cid)).join('')}</div>`).join('')}`; }
function cardLink(l) {   // the evidence trace: relation type, status, claims, sources, conditions, verification, rule / literature
  const K = S.K; const es = l.edges; const e0 = es[0]; const src = K.label(l.source.id), tgt = K.label(l.target.id);
  const head = `<h2><em>${esc(src)}</em> → ${esc(tgt)}</h2><div class="kicker">${esc(e0.rel || l.kind)} · ${es.length === 1 ? stTag(e0.kg_status || l.status) : `${es.length} edges`}${e0.to_confirm ? ' · <span class="warn">to confirm</span>' : ''}</div>`;
  if (l.kind === 'pc' || l.kind === 'pp' || l.kind === 'sp') return `${head}<p class="muted small">${esc(K.N.get(l.target.id)?.definition || '')}</p><h3>${es.length} claim${es.length === 1 ? '' : 's'} make this fibre</h3>${es.map(e => evidenceRow(e)).join('')}<p class="muted small">Status words: verified (a reviewer accepted it) · unverified (sourced, not yet reviewed) · candidate (this session's observation; never cited).</p>`;
  if (l.kind === 'design') { const e = e0; const live = K.checkRequirements(e.plant, e.target); return `${head}<p class="lead">${esc(e.text)}</p>${live.verdict !== e.verdict ? `<p class="cand">with this session's observation the check reads: ${esc(live.verdict)} — still candidate, never promoted.</p>` : ''}<p class="muted small">rule: ${esc(e.basis?.rule || '')}</p>${e.use_claims?.length ? `<h3>use evidence (KG-R1)</h3>${e.use_claims.map(c => { const cl = K.claimOf(c); return cl ? `<div class="row" data-claim="${esc(c)}"><i class="st ${esc(cl.status)}" style="--c:${TYPE_COLOUR[cl.source_type]}"></i><div><span class="val">${esc(K.attribute(cl))}</span><br><span class="meta">${esc(cl.status)} · ${esc(K.conds(cl))}${K.citable(cl) ? '' : ' · L0, withheld from answers'}</span></div></div>` : ''; }).join('')}` : ''}<h3>requirement check (KG-R4)</h3>${live.checks.map(c => `<div class="row"><i class="st ${c.result === 'met' ? 'documented' : c.result === 'unmet' ? 'unknown' : 'candidate'}" style="--c:${c.result === 'met' ? ST.documented : c.result === 'unmet' ? ST.unknown : ST.candidate}"></i><div><span class="val">${esc(c.strength)}: ${c.alternatives.map(a => chip(a)).join(' or ')} — <b>${esc(c.result)}</b>${c.candidate ? ' <span class="cand">(by your candidate only)</span>' : ''}</span>${c.evidence.length ? c.evidence.map(ev => `<div class="meta">← ${esc(K.label(ev.target))} · ${esc(K.srcLabel(ev.source_id || 'entity'))} · ${esc(ev.verification || ev.status || '')}${(ev.conditions || []).length ? ' · under ' + esc(ev.conditions.map(x => K.label(x.concept_id)).join(', ')) : ''}${ev.cultivar ? ` · ‘${esc(ev.cultivar)}’` : ''}</div>`).join('') : `<div class="meta">${c.result === 'unknown' ? 'no sourced claim on this facet' : 'claims exist on the facet, none matches'} · ${esc(c.source || '')}</div>`}</div></div>`).join('')}`; }
  if (l.kind === 'cc') return `${head}<p class="lead">${esc(e0.text)}</p><p class="muted small">${esc(e0.basis?.source || '')}${e0.rule ? `<br>rule: ${esc(e0.rule)}` : ''}${e0.note ? `<br>${esc(e0.note)}` : ''}</p>${e0.alternatives ? `<div class="chips">${e0.alternatives.map(a => chip(a)).join('')}</div>` : ''}`;
  if (l.kind === 'band') return `${head}<p class="muted small">rule KG-R2: a height claim places the plant in every band its range intersects.</p>${es.map(e => evidenceRow(e)).join('')}`;
  if (l.kind === 'layer') return `${head}<p class="lead">${esc(e0.text)}</p><p class="muted small">growth form ${esc(K.label(e0.basis.growth_form))} (${esc(e0.basis.growth_form_status)}) · bands ${esc(e0.basis.bands.map(K.label).join(', '))} · claims ${esc(e0.basis.claims.join(', '))}</p>`;
  if (l.kind === 'gf') return `${head}<p class="lead">${esc(e0.text)}</p><p class="muted small">${Object.entries(e0.basis?.evidence || {}).map(([s, ev]) => `${esc(s)}: ${esc(ev)}`).join('<br>')}${e0.basis?.weak?.length ? `<br><span class="warn">${esc(e0.basis.weak.join(', '))}: a use mention only</span>` : ''}</p>`;
  if (l.kind === 'rel') { const c = K.claimOf(e0.id.replace(/^rel:/, '')); return `${head}<p class="lead">${esc(e0.text)}</p><p class="muted small">${esc(e0.source_id)} · ${esc(e0.verification)}${e0.basis?.verify_against?.length ? ` · verify against ${esc(e0.basis.verify_against.join(', '))}` : ''}${e0.basis?.note ? `<br>${esc(e0.basis.note)}` : ''}</p>${e0.basis?.supporting_claims?.length ? `<h3>supporting claims</h3>${e0.basis.supporting_claims.map(cid => { const cl = K.claimOf(cid); return cl ? `<div class="row" data-claim="${esc(cid)}"><i class="st ${esc(cl.status)}" style="--c:${TYPE_COLOUR[cl.source_type]}"></i><div><span class="val">${esc(K.attribute(cl))}</span></div></div>` : ''; }).join('')}` : ''}${c?.derived_from?.length ? `<p class="muted small">derived from ${esc(c.derived_from.join(', '))}</p>` : ''}`; }
  return `${head}<p class="lead">${esc(e0.text || `${src} is part of ${tgt} in the ontology.`)}</p><p class="muted small">${esc(e0.basis?.source || '')}</p>`;
}

// ------------------------------------------------------------------ the four paths (engine traversals, lit wave by wave)

function runPath(which, arg, arg2) {
  const K = S.K; $('#paths').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.path === which));
  const r = which === 'A' ? K.pathA(arg || 'growth_form:shrub') : which === 'B' ? K.pathB(arg || 'spatial:screen') : which === 'C' ? K.pathC(arg || 'plant:gaultheria-shallon', arg2 || 'height_class') : K.pathD(arg || 'spatial:scrim');
  revealWaves(r.waves, r.seed);
  const trail = `<div class="trail">${r.waves.map((w, i) => `<span class="w" style="animation-delay:${i * STEP}ms">${String(i + 1).padStart(2, '0')} ${esc(w.step)} <small>${w.nodes.length}</small></span>`).join('')}</div>`;
  let body = '';
  if (which === 'A') body = `<p class="lead">Hierarchy: ${crumb(r.seed)}</p>${r.classification.map(e => `<div class="row" data-edge="${esc(e.id)}"><i class="st ${esc(e.verification)}" style="--c:${AX['axis:x'].colour}"></i><div><em class="val">${esc(K.label(e.source))}</em> ${stTag(e.verification)} ${stTag('derived')}<br><span class="meta">${esc(e.text)}</span></div></div>`).join('')}${Object.entries(r.attributes).map(([p, cats]) => `<h3><em>${esc(K.label(p))}</em> · attributes by category</h3>${Object.entries(cats).map(([c, es]) => `<div class="small"><b>${esc(K.label(c))}</b> <span class="faint">${new Set(es.map(e => e.target)).size} concepts · ${new Set(es.map(e => e.claim_id)).size} claims</span><div class="chips">${[...new Set(es.map(e => e.target))].slice(0, 10).map(id => chip(id)).join('')}</div></div>`).join('')}<details><summary>evidence in R5 order · ${r.evidence[p].length} claims</summary>${r.evidence[p].slice(0, 20).map(c => `<div class="r" data-claim="${esc(c.id)}">${esc(K.attribute(c))}<div class="why">${esc(c.field.replace(/_/g, ' '))} · ${esc(c.status)} · ${esc(K.conds(c))}${K.citable(c) ? '' : ' · L0 withheld'}</div></div>`).join('')}</details>`).join('')}`;
  else if (which === 'B') body = `<p class="lead">${esc(r.node.definition)}</p><p class="muted small">${esc(r.node.source_of_term)}${r.node.to_confirm ? ' · <span class="warn">term to confirm</span>' : ''}</p><h3>required traits</h3>${r.requirements.map(q => `<div class="row" data-edge="${esc(q.id)}"><i class="st documented" style="--c:${AX['axis:y'].colour}"></i><div><span class="val">${esc(q.strength)}: ${(q.alternatives || [q.target]).map(a => chip(a)).join(' or ')}</span><br><span class="meta">${esc(q.basis?.source || '')}${q.to_confirm ? ' · to confirm' : ''}</span></div></div>`).join('')}${r.uses.length ? `<p class="muted small">KPU uses that name it: ${r.uses.map(u => chip(u.source)).join(' ')}</p>` : ''}<h3>relevant plants</h3>${r.plants.map(p => `<div class="row" data-edge="${esc(p.edge.id)}"><i class="st ${esc(p.kg_status)}" style="--c:${ST[p.kg_status]}"></i><div><em class="val">${esc(K.label(p.plant))}</em> ${stTag(p.kg_status)} <span class="meta">${esc(p.verdict)}</span><br><span class="meta">${esc(p.edge.text)}</span>${p.checks.filter(c => c.evidence.length).map(c => `<div class="meta">· ${esc(c.alternatives.map(K.label).join(' or '))}: ${c.evidence.slice(0, 3).map(ev => `${esc(K.srcLabel(ev.source_id || 'entity'))}${(ev.conditions || []).length ? ' (under ' + esc(ev.conditions.map(x => K.label(x.concept_id).toLowerCase()).join(', ')) + ')' : ''}`).join(', ')}${c.evidence.length > 3 ? ` +${c.evidence.length - 3}` : ''}</div>`).join('')}${p.missing.length ? `<div class="meta warn">missing: ${esc(p.missing.map(m => m.alternatives.map(K.label).join(' or ') + ` (${m.result})`).join('; '))}</div>` : ''}</div></div>`).join('') || '<p class="warn">no plant linked</p>'}`;
  else if (which === 'C') body = `<p class="lead">${r.claims.length} live claims from ${new Set(r.claims.map(c => c.source_id)).size} sources · ${esc(r.reading)}</p>${r.groups.map(g => `<h3>${esc(g.cultivar)} · ${esc(g.conditions)}</h3>${g.claims.map(c => `<div class="r" data-claim="${esc(c.id)}">${esc(K.attribute(c))}<div class="why">${esc((c.concepts || []).filter(x => K.N.get(x)?.facet === r.facet).map(K.label).join(', '))} · ${c.place ? esc(K.label(c.place)) : '—'}${K.PLACE_VAN.has(c.place) ? ' ✓ local' : ''}</div></div>`).join('')}`).join('')}${r.variation.map(v => `<p class="small">↔ ${esc(v.text)}</p>`).join('')}${r.disagreement.map(d => `<p class="small">≠ ${esc(d.text)}</p>`).join('')}`;
  else body = `<p class="lead">${esc(r.node.definition)}</p>${r.node.to_confirm ? '<p class="warn small">The term itself is from the brief and not yet found in the literature — to confirm.</p>' : ''}<h3>required knowledge</h3>${r.requirements.map(q => `<div class="row" data-edge="${esc(q.id)}"><i class="st documented" style="--c:${AX['axis:y'].colour}"></i><div><span class="val">${esc(q.strength)}: ${(q.alternatives || [q.target]).map(a => chip(a)).join(' or ')}</span><br><span class="meta">${esc(q.basis?.source || '')}${q.to_confirm ? ' · to confirm' : ''}</span></div></div>`).join('')}<h3>existing evidence</h3>${r.plants.map(p => `<div class="row" data-edge="${esc(p.edge.id)}"><i class="st ${esc(p.kg_status)}" style="--c:${ST[p.kg_status]}"></i><div><em class="val">${esc(K.label(p.plant))}</em> ${stTag(p.kg_status)} <span class="meta">${esc(p.verdict)} · met: ${esc(p.checks.filter(c => c.result === 'met').map(c => c.alternatives.map(K.label).join(' or ')).join('; ') || 'none')}</span></div></div>`).join('')}<h3 class="warn">missing relationships · ${r.missing.length}</h3>${r.missing.map(m => `<div class="r"><em>${esc(K.label(m.plant))}</em> needs ${esc(m.requirement)} <span class="faint">(${esc(m.strength)})</span>: <b>${esc(m.result)}</b><div class="why">${esc(m.why)}</div></div>`).join('')}${r.noPlant ? '<p class="warn small">No source links any plant to this concept; every link shown is a rule-based candidate or unknown.</p>' : ''}${r.toConfirm.length ? `<p class="muted small">${r.toConfirm.length} literature relation(s) await page-level confirmation.</p>` : ''}`;
  openCard(`<h2>Path ${which} · ${esc(r.title.split(': ')[0])}</h2><div class="kicker">${esc(r.title.split(': ').slice(1).join(': '))} · a traversal of kg.json, lit wave by wave</div>${trail}${body}`);
}

// ------------------------------------------------------------------ gaps & conflicts

function runQuery(q) {
  if (!q.trim()) return; const K = S.K; const r = K.ask(q); $('#paths').querySelectorAll('button').forEach(b => b.classList.remove('on'));
  revealWaves(r.waves, Object.keys(r.recognised.plants)[0] || Object.keys(r.recognised.concepts)[0]);
  const rec = r.recognised; const byC = {}; for (const c of Object.keys(rec.concepts)) { const n = K.N.get(c); const cat = n.category || n.id; (byC[cat] = byC[cat] || []).push(c); }
  openCard(`<h2>“${esc(q)}”</h2><div class="kicker">graph retrieval · recognise → traverse → claims (R5) → attribution (R6)</div>
  <h3><span class="step">01</span> recognised</h3>${Object.keys(rec.plants).length ? `<p class="small">plants: ${Object.keys(rec.plants).map(p => `<em class="link" data-id="${esc(p)}">${esc(K.label(p))}</em>`).join(', ')}</p>` : ''}${Object.entries(byC).map(([cat, ids]) => `<div class="muted small">${esc(K.label(cat))}</div><div class="chips">${ids.map(id => chip(id, `<small>${esc(rec.concepts[id])}</small>`)).join('')}</div>`).join('') || '<p class="muted">no concept matched by alias</p>'}
  <h3><span class="step">02</span> graph steps</h3><p class="small muted">${r.steps.map(esc).join('<br>') || 'none'}</p>
  <h3><span class="step">03</span> plants reached</h3>${r.answer.map(a => `<div class="row" data-id="${esc(a.plant)}"><i class="st verified" style="--c:${TYPE_COLOUR.plant}"></i><div><em class="val">${esc(K.label(a.plant))}</em><br><span class="meta">${a.why.map(h => `${esc(h.kind)} ${esc(K.label(h.id))} [${esc(h.status)}${h.n > 1 ? ` ×${h.n}` : ''}]`).join(' · ')} · ${a.n} claims${a.withheld ? ` · ${a.withheld} L0 withheld` : ''}</span></div></div>`).join('') || '<p class="warn">no plant reached — honest empty answer</p>'}
  ${r.design.map(b => `<h3><span class="step">Z</span> ${esc(K.label(b.seed))}</h3>${b.plants.map(p => `<div class="row" data-edge="${esc(p.edge.id)}"><i class="st ${esc(p.kg_status)}" style="--c:${ST[p.kg_status]}"></i><div><em class="val">${esc(K.label(p.plant))}</em> ${stTag(p.kg_status)} <span class="meta">${esc(p.verdict)}</span></div></div>`).join('')}`).join('')}
  ${r.unknown.length ? `<h3 class="warn">unknown · not asserted by any source</h3>${r.unknown.map(u => `<p class="meta">${esc(u)}</p>`).join('')}` : ''}
  <details><summary>claims in answer order (R5) · attribution (R6)</summary>${r.answer.flatMap(a => a.claims.map(c => `<div class="r" data-claim="${esc(c.id)}">${esc(K.attribute(c))}<div class="why">${esc(c.field.replace(/_/g, ' '))} · ${esc(c.status)} · ${esc(K.conds(c))} · ${c.place ? esc(K.label(c.place)) : '—'}</div></div>`)).join('') || '<p class="warn">No sourced claim reached.</p>'}</details>
  <details><summary>the context block an LLM would receive</summary><pre>${esc(K.contextBlock(r))}</pre></details>`);
}

// ------------------------------------------------------------------ Grow: an observation becomes candidate fibres; the requirement check re-runs with it, still candidate

const FIELD_WORDS = { mature_height: ['height', 'tall', 'high', ' cm', 'stays under', 'stays below', 'reaches', 'metre', 'meter', ' m ', 'ft'], mature_spread: ['spread', 'wide', 'width', 'across'], exposure: ['full sun', 'part shade', 'shade', 'shady', 'sunny', 'north-facing', 'exposure', 'aspect'], water_drainage: ['wet', 'dry soil', 'drainage', 'drought', 'moist', 'waterlogged', 'soggy', 'irrigat'], hardiness_zone: ['frost', 'hardy', 'winter kill', 'zone', 'cold snap', 'froze'], maintenance_level: ['maintenance', 'pruning', 'prune', 'easy care', 'low care', 'fuss'], growth_rate: ['fast', 'slow', 'growth rate', 'grows quickly', 'vigorous', 'per year'], habit: ['dense', 'open habit', 'twiggy', 'upright', 'spreading', 'arching'], landscape_use: ['hedge', 'screen', 'ground cover', 'container', 'roof', 'planter'], toxicity: ['toxic', 'poison', 'dog', 'cat ', 'pets', 'ate'], seasonal_interest: ['flower', 'bloom', 'fall colour', 'fall color', 'berries', 'fruit', 'autumn', 'evergreen', 'leaves turn'], ecological_value: ['bees', 'pollinator', 'birds', 'wildlife', 'hummingbird', 'habitat'], resistances: ['tolerates', 'tolerant', 'resistant', 'unbothered', 'deer', 'rabbit'] };
function detect(text, fieldOverride = null) {   // the field chosen in the form wins over the keyword guess; one observation → one field
  const G = S.G, K = S.K; const t = ` ${text.toLowerCase()} `; const rec = K.recognise(text); const pid = Object.keys(rec.plants)[0]?.split(':')[1] || null;
  const scores = Object.entries(FIELD_WORDS).map(([f, ws]) => [f, ws.filter(w => t.includes(w)).length]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]); const field = fieldOverride || scores[0]?.[0] || null;
  const num = ['mature_height', 'mature_spread', 'local_mature_size'].includes(field) ? t.match(/(\d+(?:\.\d+)?)\s*(cm|m|metres?|meters?|ft|feet)\b/) : null; let value = null, value_kind = 'qualitative';
  if (num) { let x = parseFloat(num[1]); const u = num[2]; if (u === 'cm') x /= 100; else if (u === 'ft' || u === 'feet') x *= 0.3048; x = Math.round(x * 100) / 100; const before = t.slice(0, num.index); value = /(under|below|less than|at most|no more than|max)\s*$/.test(before) ? { max: x, unit: 'm' } : /(over|above|more than|at least|min)\s*$/.test(before) ? { min: x, unit: 'm' } : { height_m: x, unit: 'm' }; value_kind = 'quantitative'; }
  const found = conceptsInText(G, text); const byFacet = {}; for (const id of found.keys()) { const o = G.O.get(id); if (!o || o.facet === 'growth_form' || o.level !== 'concept' || o.dimension === 'design') continue; (byFacet[o.facet] = byFacet[o.facet] || []).push(id); }
  const facets = (G.facetFields && Object.entries(G.facetFields).filter(([, flds]) => flds.some(x => x.split('.')[0] === field)).map(([f]) => f).filter(f => f !== 'growth_form')) || [];
  let concepts = [], conditions = [];
  if (value && (field === 'mature_height' || field === 'local_mature_size')) { const iv = interval(value); concepts = classesFor(G, 'height_class', iv[0], iv[1]); } else if (value && field === 'mature_spread') { const iv = interval(value); concepts = classesFor(G, 'spread_class', iv[0], iv[1]); }
  for (const [f, ids] of Object.entries(byFacet)) { if (['place', 'season', 'month', 'age', 'taxon_family', 'taxon_genus'].includes(f)) continue; if (facets.includes(f) && !concepts.length) concepts.push(...ids); else if (f === 'exposure' || f === 'soil' || f === 'water') conditions.push(...ids.map(id => ({ facet: f, concept_id: id }))); else if (!facets.length) concepts.push(...ids); }
  if (!value && !concepts.length && field && facets.length && byFacet[facets[0]]) concepts = byFacet[facets[0]];
  const place = (byFacet.place || [])[0] || null; const time = [...(byFacet.season || []), ...(byFacet.month || []), ...(byFacet.age || [])];
  return { pid, field, value, value_kind, concepts: [...new Set(concepts)], conditions, place, time, value_label: value ? null : (concepts.length ? concepts.map(c => K.label(c)) : null) };
}
function loadCandidates() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } }
function saveCandidates() { try { localStorage.setItem(LS_KEY, JSON.stringify(S.candidates)); } catch { /* ignore */ } }
function candToClaim(c) { return { ...c, status: 'candidate', source_id: 'candidate', source_type: 'candidate', confidence: null }; }
function addCandidate(text, pid, field, basis, location) {
  const K = S.K, G = S.G; const d = detect(text, field); const locHits = location ? K.recognise(location).concepts : {}; const place = Object.keys(locHits).find(id => id.startsWith('place:')) || d.place || (location ? 'place:vancouver' : null);
  const n = S.candidates.filter(c => c.plant === pid && c.field === field).length + 1; const before = S.diag;
  const c = { id: `candidate:${pid}:${field}:${String(n).padStart(2, '0')}`, plant: pid, field, value_kind: d.value_kind, value: d.value || { note: text.trim() }, value_label: d.value_label, text: text.trim(), context: ['candidate (this session)', location, d.conditions.map(x => K.label(x.concept_id).toLowerCase()).join(', ')].filter(Boolean).join('; '), concepts: d.concepts, conditions: d.conditions, place, time: d.time, cultivar: null, recorded_at: new Date().toISOString().slice(0, 10), recorded_by: 'user (browser session)', practitioner_meta: { basis: basis || null, location: location || null, site_conditions: d.conditions.map(x => K.label(x.concept_id)).join(', ') || null, observer_background: 'this session (unverified user input)', completeness: basis && location ? 'L2' : basis ? 'L1' : 'L0', citable: false } };
  S.candidates.push(c); saveCandidates(); K.addCandidateEdges(candidateEdges(G, c), candToClaim(c)); S.diag = runDiag();
  const oldLinks = new Set(S.links.map(l => l.id)); buildRegistry(); snapshot(); const P = `plant:${pid}`; show([P, ...d.concepts, ...d.conditions.map(x => x.concept_id), 'source:candidate', ...(place ? [place] : [])]); rebuild(); const born = performance.now();
  for (const l of S.links) if (!oldLinks.has(l.id) || (l.kind === 'pc' && l.edges.some(e => e.claim_id === c.id))) l.born = born;
  const after = S.diag; const items = [];
  items.push(`<em>${esc(K.label(P))}</em> grows ${d.concepts.length ? `${d.concepts.length} candidate synapse${d.concepts.length === 1 ? '' : 's'} to ${d.concepts.map(K.label).join(', ')}` : 'a candidate note with no concept — add a value, a condition or a place to connect it'}${d.conditions.length ? ` under ${d.conditions.map(x => K.label(x.concept_id).toLowerCase()).join(', ')}` : ''}${place ? ` at ${K.label(place)}` : ''}.`);
  // which design requirement checks change with this candidate — they move to 'met by candidate only', never to documented
  for (const z of K.kg.nodes.filter(x => x.dimension === 'design' && x.facet !== 'height_band').map(x => x.id)) { const live = K.checkRequirements(P, z); const built = K.edges.find(e => e.type === 'design' && e.plant === P && e.target === z); if (live.onlyCandidate && built && live.verdict !== built.verdict) items.push(`${K.label(z)}: the requirement check now reads “${esc(live.verdict)}” — only because of your candidate; the link stays <span class="cand">candidate</span>, it does not become verified.`); }
  const newHubs = after.hubs.filter(h => !before.hubs.some(b => b.concept === h.concept)); if (newHubs.length) items.push(`New hub: ${newHubs.map(h => h.label).join(', ')} now link${newHubs.length === 1 ? 's' : ''} two plants (one synapse is yours, unverified).`);
  for (const x of after.variation.filter(x => x.candidate && !before.variation.some(b => b.plant === x.plant && b.facet === x.facet))) items.push(`A variation appears: ${esc(x.text)}`);
  for (const x of after.disagreement.filter(x => x.candidate)) items.push(`Your reading disagrees with ${esc(K.srcLabel(x.sources.find(s => s !== 'candidate')))}: ${esc(x.text)}`);
  items.push(`Status: candidate (magenta), completeness ${c.practitioner_meta.completeness}, never citable, this browser only (localStorage ‘${LS_KEY}’). Nothing is written to the database.`);
  setTimeout(() => { pulse([P], 1, (u, l) => l.born !== undefined || (l.kind === 'pc' && l.edges.some(e => e.claim_id === c.id)) || (l.kind === 'sp' && l.source.id === 'source:candidate')); }, 1500);
  S.selected = S.reg.get(P); focusOn(S.reg.get(P)); renderCrumb();
  openCard(`${growForm()}<div class="changed"><h3>What grew</h3><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul><p><button data-id="${P}">show the plant</button></p></div>`); wireGrow(); renderStats();
}
function resetCandidates() { S.candidates = []; saveCandidates(); S.K.removeCandidates(); S.diag = S.K.db.diagnosis; buildRegistry(); S.visible.delete('source:candidate'); rebuild(); deselect(); openCard(growForm()); wireGrow(); }
function growForm() { return `<h2>Add an observation</h2><div class="kicker">parsed into plant + concepts + conditions + place · grows a <span class="cand">candidate</span> fibre · this browser only · never verified here</div>
  <textarea id="add-text" placeholder="e.g. evergreen huckleberry in my North Van garden is dense and reaches 2 m in part shade"></textarea><div class="meta" id="add-detected" style="margin:4px 0"></div>
  <div class="grid2"><div><label>plant</label><select id="add-plant">${S.K.plants.map(p => `<option value="${p.id.split(':')[1]}">${esc(p.label)}</option>`).join('')}</select></div><div><label>field</label><select id="add-field">${Object.keys(FIELD_WORDS).map(f => `<option value="${f}">${f.replace(/_/g, ' ')}</option>`).join('')}</select></div><div><label>basis</label><select id="add-basis"><option value="">(none given)</option><option value="observed">observed on site</option><option value="project">my own project</option><option value="read">read somewhere</option><option value="mixed">mixed</option></select></div><div><label>location</label><input id="add-location" placeholder="e.g. North Vancouver"></div></div>
  <div style="display:flex;gap:8px"><button id="add-go" class="primary">Grow as candidate</button><button id="add-reset">Reset session</button></div>
  ${S.candidates.length ? `<h3>grown this session</h3>${S.candidates.map(c => `<div class="row" data-id="plant:${esc(c.plant)}"><i class="st candidate" style="--c:${TYPE_COLOUR.candidate}"></i><div><em class="val">${esc(S.K.label(`plant:${c.plant}`))}</em> · ${esc(c.field.replace(/_/g, ' '))} · ${esc(c.value_label ? [].concat(c.value_label).join(', ') : fmtNum(c.value))}</div></div>`).join('')}` : ''}`; }
function wireGrow() {
  const ta = $('#add-text'), ps = $('#add-plant'), fs = $('#add-field'); if (!ta) return;
  ta.addEventListener('input', () => { const d = detect(ta.value); if (d.pid) ps.value = d.pid; if (d.field) fs.value = d.field; fs.dataset.auto = '1'; $('#add-detected').innerHTML = `plant: ${esc(d.pid || '?')} · field: ${esc(d.field || '?')} · concepts: ${d.concepts.map(c => esc(S.K.label(c))).join(', ') || '—'}${d.conditions.length ? ' · conditions: ' + d.conditions.map(x => esc(S.K.label(x.concept_id))).join(', ') : ''}${d.place ? ' · place: ' + esc(S.K.label(d.place)) : ''}`; });
  fs.addEventListener('change', () => { const d = detect(ta.value, fs.value); $('#add-detected').innerHTML = `plant: ${esc(ps.value)} · field: ${esc(fs.value)} · concepts: ${d.concepts.map(c => esc(S.K.label(c))).join(', ') || '—'}${d.conditions.length ? ' · conditions: ' + d.conditions.map(x => esc(S.K.label(x.concept_id))).join(', ') : ''}`; });
  $('#add-go').addEventListener('click', () => { const t = ta.value.trim(); if (!t) return; addCandidate(t, ps.value, fs.value, $('#add-basis').value, $('#add-location').value.trim()); });
  $('#add-reset').addEventListener('click', resetCandidates);
}

// ------------------------------------------------------------------ UI

// ------------------------------------------------------------------ UI
function initUi() {
  $('#ask-run').addEventListener('click', () => runQuery($('#ask-input').value)); $('#ask-input').addEventListener('keydown', e => { if (e.key === 'Enter') runQuery($('#ask-input').value); });
  $('#btn-grow').addEventListener('click', () => { openCard(growForm()); wireGrow(); });
  $('#card-close').addEventListener('click', deselect);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (document.activeElement && document.activeElement.tagName === 'INPUT') document.activeElement.blur(); else back(); } });
  $('#paths').innerHTML = [['A', 'Classification', 'growth form → shrub → plants → attributes → evidence'], ['B', 'Design knowledge', 'screen → required traits → plants → conditions'], ['C', 'Knowledge variation', 'salal → height → conditions → claims → sources'], ['D', 'Knowledge gaps', 'scrim → required knowledge → evidence → missing']].map(([k, t, d]) => `<button data-path="${k}" title="${esc(d)}"><b>${k}</b> ${esc(t)}</button>`).join('');
  $('#paths').querySelectorAll('button').forEach(b => b.addEventListener('click', () => runPath(b.dataset.path)));
  $('#legend').innerHTML = `<span><i style="background:${AX['axis:x'].colour}"></i>X</span><span><i style="background:${AX['axis:y'].colour}"></i>Y</span><span><i style="background:${AX['axis:z'].colour}"></i>Z</span><span><i style="background:${TYPE_COLOUR.plant}"></i>plant</span><span><i style="background:${AX.evidence.colour}"></i>evidence</span><span><i class="ln" style="background:#fff"></i>claim (verified white)</span><span><i class="ln" style="background:${ST.derived}"></i>derived</span><span><i class="ln" style="background:${ST.candidate}"></i>candidate</span><span><i class="ln" style="background:${ST.observation}"></i>observation</span>`;
}
window.brain = { S, select, selectLink, back, overview, pulse, revealWaves, clearAll, runQuery, runPath, addCandidate, resetCandidates, detect, AX };
