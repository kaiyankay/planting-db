// Knowledge Brain v4 — a concept-centred knowledge graph. Concepts are nodes, plants are one node type among
// several, claims are the edges. Entry is by condition, use, place, time or source; plants are where a walk ends.
// Reads brain/data/graph.json + diagnosis.json (built by tools/build_graph.py), ontology.json and the db (for the
// retrieval preview). Writes nothing; candidates live in this browser only.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { loadDb } from './data.js';
import { loadGraph, classesFor, conceptsInText, candidateEdges } from './graph.js';
import { diagnose, srcLabel, fmtNum, interval } from './diagnosis.js';
import { makeRetriever } from './retrieve.js';
import { TYPE_COLOUR } from './model.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const LS_KEY = 'brain.candidates.v4';
const PANEL_W = 372 + 32;
const DIM = { condition: { label: 'Conditions', colour: '#7cc4ff' }, use: { label: 'Uses', colour: '#6ff2b0' }, place: { label: 'Place', colour: '#ff9e6b' }, time: { label: 'Time', colour: '#ffd27a' }, trait: { label: 'Traits', colour: '#c9b8ff' }, status: { label: 'Status', colour: '#b8ffea' }, resistance: { label: 'Resistance', colour: '#ff8ca8' } };
const ENTRY = ['condition', 'use', 'place', 'time', 'trait', 'status', 'resistance'];

const S = { db: null, G: null, Graph: null, retr: null, candidates: [], candEdges: [], diag: null, view: { mode: 'home' }, history: [], active: [], lit: null, labels: [], nodes: [], links: [], lastResult: null, pdown: null };

// ------------------------------------------------------------------ boot
(async function boot() {
  try {
    [S.db, S.G] = await Promise.all([loadDb(), loadGraph()]);
    S.candidates = loadCandidates(); S.candEdges = S.candidates.flatMap(c => candidateEdges(S.G, c));
    S.retr = makeRetriever(S.db, () => S.candidates.map(candToClaim));
    S.diag = S.candEdges.length ? runDiag() : S.G.diagnosis;
    initHost(); buildGraph(); initUi();
    go({ mode: 'home' }, true);
    $('#loading').classList.add('gone');
  } catch (e) { $('#err').textContent = `could not load: ${e.message}\n\nserve the planting-db root:  python3 -m http.server 8766  → http://localhost:8766/brain/\nand build the graph:  python3 -I tools/build_graph.py`; console.error(e); }
})();
const allEdges = () => [...S.G.graph.edges, ...S.candEdges];
function runDiag() { return diagnose(S.G.O, allEdges(), id => S.G.plantLabel(id), S.G.gateFacets, S.db.sources); }
function descendants(cid) { const out = [cid]; for (let i = 0; i < out.length; i++) for (const c of S.G.concepts) if (c.parent === out[i] && !out.includes(c.id)) out.push(c.id); return out; }
const isEvidence = e => (e.type === 'claim' || e.type === 'entity' || e.type === 'candidate') && e.live !== false;
// place and time are attributes of every edge, not targets: a place concept is "linked" to the plants whose claims were made there
function liveEdgesFor(cid) {
  const ids = new Set(descendants(cid)); const dim = S.G.O.get(cid)?.dimension;
  if (dim === 'place') { const seen = new Set(); return allEdges().filter(e => isEvidence(e) && e.place && ids.has(e.place) && !seen.has(e.claim_id || e.id) && seen.add(e.claim_id || e.id)).map(e => ({ ...e, via: e.place !== cid ? e.place : null, through: 'place' })); }
  if (dim === 'time') { const seen = new Set(); return allEdges().filter(e => isEvidence(e) && (e.time || []).some(t => ids.has(t)) && !seen.has(e.claim_id || e.id) && seen.add(e.claim_id || e.id)).map(e => ({ ...e, via: null, through: 'time' })); }
  return allEdges().filter(e => ids.has(e.target) && isEvidence(e)).map(e => e.target === cid ? e : { ...e, via: e.target });
}
function plantEdges(pid) { return allEdges().filter(e => e.plant === pid && (e.type === 'claim' || e.type === 'entity' || e.type === 'candidate') && e.live !== false && e.target); }
const linkedPlants = cid => new Set(liveEdgesFor(cid).map(e => e.plant));

// ------------------------------------------------------------------ graph data for the force layout
function buildGraph() {
  const G = S.G; const nodes = []; const links = []; const linkMap = new Map();
  for (const p of G.plants) nodes.push({ id: p.id, kind: 'plant', n: p });
  const linked = new Set(allEdges().filter(e => e.live !== false && (e.type === 'claim' || e.type === 'entity' || e.type === 'candidate')).flatMap(e => [e.target, e.place, ...(e.time || [])].filter(Boolean)));
  for (const c of G.concepts) if (!linked.has(c.id) && descendants(c.id).some(d => d !== c.id && linked.has(d))) linked.add(c.id);
  // concepts: linked ones float; unused vocabulary sits on an outer ring by dimension (the knowledge base is bigger than the knowledge in it)
  const ring = {}; for (const c of G.concepts) { if (!linked.has(c.id)) (ring[c.dimension] = ring[c.dimension] || []).push(c); }
  const dims = Object.keys(DIM); let start = 0; const total = Object.values(ring).reduce((a, v) => a + v.length, 0) + dims.length * 3;
  S.ringArcs = {};
  for (const d of dims) {
    const items = ring[d] || []; const span = (items.length + 3) / total * Math.PI * 2; const a0 = start; start += span;
    S.ringArcs[d] = [a0, a0 + span];
    items.forEach((c, i) => { const a = a0 + (i + 1.5) / (items.length + 3) * span; nodes.push({ id: c.id, kind: 'concept', n: c, used: false, fx: Math.cos(a) * 300, fy: Math.sin(a) * 300 }); });
  }
  for (const c of G.concepts) if (linked.has(c.id)) nodes.push({ id: c.id, kind: 'concept', n: c, used: true });
  for (const c of G.concepts) if (linked.has(c.id) && c.parent && linked.has(c.parent)) links.push({ id: `parent:${c.id}`, kind: 'parent', source: c.id, target: c.parent });
  for (const cv of G.graph.nodes.filter(n => n.type === 'cultivar')) { nodes.push({ id: cv.id, kind: 'cultivar', n: cv }); links.push({ id: cv.id, kind: 'cv', source: cv.id, target: cv.plant }); }
  const srcs = G.graph.nodes.filter(n => (n.type === 'source' || n.type === 'practitioner') && !n.parent); srcs.forEach((s, i) => nodes.push({ id: s.id, kind: 'source', n: s, fx: -((srcs.length - 1) / 2 - i) * 34, fy: -400 }));
  if (S.candEdges.length) nodes.push({ id: 'source:candidate', kind: 'source', n: { id: 'source:candidate', label: 'you (candidate)', source_type: 'candidate' }, fx: (srcs.length / 2 + 1) * 34, fy: -400 });
  for (const e of allEdges()) {
    if (!(e.type === 'claim' || e.type === 'entity' || e.type === 'candidate') || e.live === false) continue;
    const targets = []; if (e.target) targets.push(e.target); if (e.place) targets.push(e.place); for (const t of e.time || []) targets.push(t);
    for (const t of new Set(targets)) { const key = `${e.plant}→${t}`; if (!linkMap.has(key)) { const l = { id: key, kind: 'pc', source: e.plant, target: t, edges: [] }; linkMap.set(key, l); links.push(l); } linkMap.get(key).edges.push(e); }
  }
  const relPairs = new Map();
  for (const e of G.graph.edges.filter(x => x.type === 'relation')) { const key = [e.source, e.target].sort().join('|'); if (!relPairs.has(key)) { const l = { id: `rel:${key}`, kind: 'rel', source: e.source, target: e.target, rels: [] }; relPairs.set(key, l); links.push(l); } relPairs.get(key).rels.push(e); }
  // keep positions across rebuilds
  const prev = new Map(S.nodes.map(n => [n.id, n]));
  for (const n of nodes) { const o = prev.get(n.id); if (o) { n.x = o.x; n.y = o.y; n.vx = 0; n.vy = 0; } }
  S.nodes = nodes; S.links = links;
  S.Graph.graphData({ nodes, links });
  const link = S.Graph.d3Force('link'); if (link) link.distance(l => l.kind === 'pc' ? 34 : l.kind === 'rel' ? 150 : l.kind === 'parent' ? 18 : 14).strength(l => l.kind === 'pc' ? 0.5 : l.kind === 'rel' ? 0.05 : l.kind === 'parent' ? 0.7 : 1);
  const charge = S.Graph.d3Force('charge'); if (charge) charge.strength(n => n.kind === 'plant' ? -900 : n.kind === 'concept' ? (n.used ? -70 : -5) : n.kind === 'source' ? -10 : -30).distanceMax(400);
  rebuildLabels();
}

// ------------------------------------------------------------------ host
function initHost() {
  const Graph = new ForceGraph3D($('#graph'), { controlType: 'orbit' }).backgroundColor('#02030a').showNavInfo(false).numDimensions(2)
    .nodeThreeObject(nodeObject).nodeThreeObjectExtend(false).nodeLabel(() => '')
    .linkThreeObject(linkObject).linkThreeObjectExtend(false).linkPositionUpdate(linkPositionUpdate)
    .enableNodeDrag(false).warmupTicks(80).cooldownTime(6000).d3AlphaDecay(0.03).d3VelocityDecay(0.35)
    .onNodeClick(n => { S.swallow = true; if (n.kind === 'plant') go({ mode: 'plant', id: n.id }); else if (n.kind === 'concept') go({ mode: 'concept', id: n.id }); else if (n.kind === 'source') go({ mode: 'source', id: n.id }); else if (n.kind === 'cultivar') go({ mode: 'plant', id: n.n.plant }); })
    .onNodeHover(n => { document.body.style.cursor = n ? 'pointer' : ''; if (n) showTip(n); else hideTip(); })
    .onLinkClick(l => { S.swallow = true; if (l.kind === 'pc') go({ mode: 'link', plant: l.source.id || l.source, concept: l.target.id || l.target }); else if (l.kind === 'rel') go({ mode: 'relations', id: l.source.id || l.source }); })
    .onBackgroundClick(() => { if (S.swallow) { S.swallow = false; return; } up(); });
  Graph.controls().enableRotate = false;
  Graph.scene().fog = new THREE.FogExp2(0x02030a, 0.0009);
  Graph.postProcessingComposer().addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.5, 0.42));
  Graph.cameraPosition({ x: 0, y: 0, z: 760 }, { x: 0, y: 0, z: 0 }, 0);
  S.Graph = Graph;
  window.addEventListener('resize', () => moveCamera(400));
  (function loop() { frame(); requestAnimationFrame(loop); })();
}

// ------------------------------------------------------------------ visuals
function conceptRadius(n) { const k = linkedPlants(n.id).size; return n.used ? 1.9 + 1.1 * k : 0.7; }
function nodeObject(n) {
  const g = new THREE.Group(); const mats = [];
  const mat = (c, a, extra = {}) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(c), transparent: true, opacity: a, depthWrite: false, ...extra }); m.userData.base = a; mats.push(m); return m; };
  if (n.kind === 'plant') { g.add(new THREE.Mesh(new THREE.SphereGeometry(6.5, 28, 28), mat(TYPE_COLOUR.plant, 0.9))); g.add(new THREE.Mesh(new THREE.SphereGeometry(13, 24, 24), mat(TYPE_COLOUR.plant, 0.05, { side: THREE.BackSide }))); }
  else if (n.kind === 'concept') { const col = DIM[n.n.dimension]?.colour || '#aab'; const r = conceptRadius(n); g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), mat(col, n.used ? 0.85 : 0.22))); if (n.used && linkedPlants(n.id).size >= 2) g.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.9, 16, 16), mat(col, 0.06, { side: THREE.BackSide }))); }
  else if (n.kind === 'cultivar') g.add(new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 12), mat(TYPE_COLOUR.plant, 0.5)));
  else if (n.kind === 'source') { const col = TYPE_COLOUR[n.n.source_type] || '#8892a8'; const has = (S.G.bySource.get(n.id) || []).some(e => e.live !== false) || n.id === 'source:candidate'; g.add(new THREE.Mesh(new THREE.BoxGeometry(5, 5, 1), mat(col, has ? 0.8 : 0.25, { wireframe: !has }))); }
  n.__obj = { group: g, mats }; return g;
}
function linkStyle(l) {
  if (l.kind === 'cv') return { col: TYPE_COLOUR.plant, a: 0.18, dash: false };
  if (l.kind === 'parent') return { col: '#aab4cc', a: 0.14, dash: true };
  if (l.kind === 'rel') { const live = l.rels.some(r => r.live); return { col: TYPE_COLOUR[(l.rels.find(r => r.live) || l.rels[0]).source_type] || '#888', a: live ? 0.55 : 0.18, dash: !live }; }
  const es = l.edges; const cand = es.every(e => e.type === 'candidate'); const t = {}; for (const e of es) t[e.source_type] = (t[e.source_type] || 0) + 1;
  const top = Object.entries(t).sort((a, b) => b[1] - a[1])[0][0]; const ver = es.filter(e => e.status === 'verified').length / es.length;
  return { col: cand ? TYPE_COLOUR.candidate : (top === 'entity' ? TYPE_COLOUR.plant : TYPE_COLOUR[top] || '#888'), a: cand ? 0.7 : 0.16 + 0.5 * ver + 0.08 * Math.min(es.length, 3), dash: cand };
}
function linkObject(l) {
  const st = linkStyle(l); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const mat = st.dash ? new THREE.LineDashedMaterial({ color: new THREE.Color(st.col), transparent: true, opacity: st.a, dashSize: 2, gapSize: 1.6 }) : new THREE.LineBasicMaterial({ color: new THREE.Color(st.col), transparent: true, opacity: st.a });
  const line = new THREE.Line(geo, mat); l.__obj = { line, mat, base: st.a }; return line;
}
function linkPositionUpdate(obj, { start, end }, l) { const o = l.__obj; if (!o) return false; const p = o.line.geometry.attributes.position; p.setXYZ(0, start.x, start.y, start.z || 0); p.setXYZ(1, end.x, end.y, end.z || 0); p.needsUpdate = true; if (o.mat.isLineDashedMaterial) o.line.computeLineDistances(); return true; }

// ------------------------------------------------------------------ labels (HTML, projected)
function rebuildLabels() {
  for (const L of S.labels) L.el.remove(); S.labels = [];
  for (const n of S.nodes) {
    if (n.kind === 'plant') addLabel(n, `<em>${esc(n.n.label)}</em><small>${esc((n.n.common || [])[0] || '')}</small>`, 'plant');
    else if (n.kind === 'concept' && n.used) addLabel(n, `${esc(n.n.label)}`, `concept ${n.n.dimension}`);
    else if (n.kind === 'source') addLabel(n, `${esc(n.n.label.length > 22 ? n.n.label.slice(0, 20) + '…' : n.n.label)}`, 'source', { dy: 6 });
  }
  for (const [d, [a0, a1]] of Object.entries(S.ringArcs || {})) { const a = (a0 + a1) / 2; addLabel({ x: Math.cos(a) * 322, y: Math.sin(a) * 322, id: `ring:${d}` }, `${esc(DIM[d].label)}<small>${(S.G.concepts.filter(c => c.dimension === d).length)} concepts · ${S.G.concepts.filter(c => c.dimension === d && linkedPlants(c.id).size).length} in use</small>`, `ring`, { fixed: true, colour: DIM[d].colour }); }
}
function addLabel(n, html, cls, opts = {}) { const el = document.createElement('div'); el.className = `lbl ${cls}`; el.innerHTML = html; el.dataset.id = n.id; if (opts.colour) el.style.color = opts.colour; el.addEventListener('click', e => { e.stopPropagation(); if (n.id.startsWith('ring:')) go({ mode: 'dim', dim: n.id.split(':')[1] }); else act(n.id); }); $('#labels').appendChild(el); S.labels.push({ n, el, cls, dy: opts.dy || 0, fixed: opts.fixed }); }
const _v = new THREE.Vector3();
function frame() {
  const cam = S.Graph.camera(); const w = window.innerWidth, h = window.innerHeight; const zoom = cam.position.z;
  for (const L of S.labels) {
    const n = L.n; if (!Number.isFinite(n.x)) { L.el.classList.add('hidden'); continue; }
    const r = n.kind === 'plant' ? 8 : n.kind === 'concept' ? conceptRadius(n) + 0.5 : 4;
    _v.set(n.x, (n.y || 0) - r - 1.5 - L.dy, 0); _v.project(cam);
    const f = dimFactor(n.id);
    let show = true;
    if (n.kind === 'concept') { const k = linkedPlants(n.id).size; show = S.lit ? S.lit.has(n.id) : (k >= 3 || (k >= 2 && zoom < 520) || zoom < 330); }
    if (n.kind === 'source') show = S.lit ? S.lit.has(n.id) : (zoom < 520 || S.view.mode === 'sources');
    if (S.lit && !S.lit.has(n.id) && !L.fixed) show = false;
    if (!show || _v.z > 1) { L.el.classList.add('hidden'); continue; }
    L.el.classList.remove('hidden'); L.sx = (_v.x + 1) / 2 * w; L.sy = (1 - _v.y) / 2 * h; L.el.style.left = `${L.sx}px`; L.el.style.top = `${L.sy}px`;
    L.el.classList.toggle('muted', f < 0.5); L.el.classList.toggle('here', S.lit && S.lit.has(n.id) && (S.view.id === n.id || S.active.includes(n.id)));
    L.vis = true;
  }
  // collision: push overlapping concept labels down, greedily by y
  const vis = S.labels.filter(L => L.vis && !L.el.classList.contains('hidden') && L.n.kind === 'concept').sort((a, b) => a.sy - b.sy);
  for (const L of S.labels) L.vis = false;
  const placed = [];
  for (const L of vis) { const wpx = (L.el.offsetWidth || 60), hpx = 14; let y = L.sy; for (const p of placed) { if (Math.abs(p.x - L.sx) < (p.w + wpx) / 2 && y < p.y + hpx && y > p.y - hpx) y = p.y + hpx; } if (y !== L.sy) L.el.style.top = `${y}px`; placed.push({ x: L.sx, y, w: wpx }); }
}
function dimFactor(id) { if (!S.lit) return 1; return S.lit.has(id) ? 1 : 0.08; }
function applyDim() {
  for (const n of S.nodes) { const o = n.__obj; if (!o) continue; const f = dimFactor(n.id); for (const m of o.mats) m.opacity = m.userData.base * f; }
  for (const l of S.links) { const o = l.__obj; if (!o) continue; const a = (l.source.id || l.source), b = (l.target.id || l.target); const f = !S.lit ? 1 : (S.lit.has(a) && S.lit.has(b) ? 1.4 : (S.litLinks && S.litLinks.has(l.id) ? 1.4 : 0.06)); o.mat.opacity = Math.min(1, o.base * f); }
}

// ------------------------------------------------------------------ tooltip
const tip = $('#tip');
function showTip(n) { const G = S.G; let html = '';
  if (n.kind === 'concept') { const o = G.O.get(n.id); const k = linkedPlants(n.id); html = `<b>${esc(o.label)}</b> <span class="meta">${esc(o.facet.replace(/_/g, ' '))} · ${esc(o.dimension)}</span><div>${esc(o.definition)}</div><div class="meta">${k.size ? `${k.size} plant${k.size === 1 ? '' : 's'} linked` : 'in the vocabulary, no plant linked yet'}</div>`; }
  else if (n.kind === 'plant') { const d = S.diag.plants[n.id]; html = `<b><em>${esc(n.n.label)}</em></b><div class="meta">${esc(d ? d.text : '')}</div>`; }
  else if (n.kind === 'source') html = `<b>${esc(n.n.label)}</b><div class="meta">${esc(n.n.source_type || '')}${n.n.geo ? ' · ' + esc(n.n.geo) : ''}${n.n.licence_tier ? ' · tier ' + esc(n.n.licence_tier) : ''} · ${(S.G.bySource.get(n.id) || []).filter(e => e.live !== false).length} edges</div>`;
  else if (n.kind === 'cultivar') html = `<b>${esc(n.n.label)}</b>`;
  tip.innerHTML = html; tip.style.display = 'block'; }
function hideTip() { tip.style.display = 'none'; }
document.addEventListener('pointermove', e => { if (tip.style.display !== 'none') { tip.style.left = `${Math.min(window.innerWidth - 340, e.clientX + 14)}px`; tip.style.top = `${e.clientY + 14}px`; } });

// ------------------------------------------------------------------ views
function go(view, silent = false) {
  if (!silent) S.history.push(S.view);
  S.view = view; S.litLinks = null;
  const G = S.G;
  if (view.mode === 'home') { S.lit = null; }
  else if (view.mode === 'dim') { const set = new Set(S.nodes.filter(n => n.kind === 'concept' && n.n.dimension === view.dim && n.used).map(n => n.id)); for (const cid of [...set]) for (const p of linkedPlants(cid)) set.add(p); S.lit = set; }
  else if (view.mode === 'sources') { S.lit = new Set(S.nodes.filter(n => n.kind === 'source' || n.kind === 'plant').map(n => n.id)); }
  else if (view.mode === 'plants') { S.lit = new Set(S.nodes.filter(n => n.kind === 'plant' || n.kind === 'cultivar').map(n => n.id)); }
  else if (view.mode === 'concept') { const set = new Set([view.id, ...linkedPlants(view.id)]); const o = G.O.get(view.id); if (o?.parent) set.add(o.parent); for (const c of G.concepts) if (c.parent === view.id) set.add(c.id); S.lit = set; }
  else if (view.mode === 'set') { const sets = S.active.map(c => linkedPlants(c)); const inter = sets.length ? [...sets[0]].filter(p => sets.every(s => s.has(p))) : []; S.lit = new Set([...S.active, ...inter]); S.inter = inter; }
  else if (view.mode === 'plant') { const set = new Set([view.id]); for (const e of plantEdges(view.id)) { set.add(e.target); if (e.place) set.add(e.place); for (const t of e.time || []) set.add(t); } for (const n of S.nodes) if (n.kind === 'cultivar' && n.n.plant === view.id) set.add(n.id); S.lit = set; }
  else if (view.mode === 'source') { const set = new Set([view.id]); for (const e of (view.id === 'source:candidate' ? S.candEdges : (G.bySource.get(view.id) || []))) if (e.live !== false && e.target) { set.add(e.plant); set.add(e.target); } S.lit = set; }
  else if (view.mode === 'variation' || view.mode === 'disagreement') { const set = new Set([view.plant]); for (const e of plantEdges(view.plant)) if (e.facet === view.facet) set.add(e.target); S.lit = set; }
  else if (view.mode === 'link') { S.lit = new Set([view.plant, view.concept]); }
  else if (view.mode === 'relations') { S.lit = new Set(S.nodes.filter(n => n.kind === 'plant').map(n => n.id)); }
  else if (view.mode === 'list') { S.lit = null; }
  applyDim(); renderTrail(); renderPanel(); moveCamera(1100);
  document.querySelectorAll('#rail button[data-view]').forEach(b => b.classList.toggle('on', JSON.stringify(viewFor(b.dataset.view)) === JSON.stringify({ mode: view.mode, dim: view.dim })));
}
function viewFor(key) { return key === 'home' ? { mode: 'home' } : key === 'sources' ? { mode: 'sources' } : key === 'plants' ? { mode: 'plants' } : { mode: 'dim', dim: key }; }
function up() { const back = S.history.pop(); go(back || { mode: 'home' }, true); }
function act(id) {
  if (id.startsWith('plant:')) go({ mode: 'plant', id }); else if (id.startsWith('source:')) go({ mode: 'source', id }); else if (id.startsWith('cultivar:')) go({ mode: 'plant', id: S.G.N.get(id).plant }); else if (S.G.O.has(id)) go({ mode: 'concept', id });
}
function toggleActive(cid) { if (S.active.includes(cid)) S.active = S.active.filter(x => x !== cid); else { if (S.active.length >= 3) S.active.shift(); S.active.push(cid); } if (S.active.length) go({ mode: 'set' }); else go({ mode: 'home' }); }

// ------------------------------------------------------------------ camera (2D)
function usable() { const drawer = document.querySelector('.drawer.open'); const left = drawer ? drawer.getBoundingClientRect().right + 16 : 168; const right = window.innerWidth - PANEL_W; return { w: Math.max(260, right - left) / window.innerWidth, h: Math.max(300, window.innerHeight - 150) / window.innerHeight, dx: (left + right) / 2 - window.innerWidth / 2 }; }
function fitNodes(ids, ms, padding = 40) {
  const ns = S.nodes.filter(n => (!ids || ids.has(n.id)) && Number.isFinite(n.x)); if (!ns.length) return;
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity; for (const n of ns) { minx = Math.min(minx, n.x); maxx = Math.max(maxx, n.x); miny = Math.min(miny, n.y); maxy = Math.max(maxy, n.y); }
  const w = Math.max(80, maxx - minx + padding * 2), h = Math.max(60, maxy - miny + padding * 2); const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
  const cam = S.Graph.camera(); const U = usable(); const fov = THREE.MathUtils.degToRad(cam.fov); const aspect = window.innerWidth / window.innerHeight;
  const d = Math.max((w / U.w) / (2 * Math.tan(fov / 2) * aspect), (h / U.h) / (2 * Math.tan(fov / 2))) * 1.05;
  const upp = 2 * d * Math.tan(fov / 2) / window.innerHeight; const lx = cx - U.dx * upp, ly = cy - 6 * upp;
  S.Graph.cameraPosition({ x: lx, y: ly, z: d }, { x: lx, y: ly, z: 0 }, ms);
}
function moveCamera(ms) {
  const v = S.view;
  if (v.mode === 'home' || v.mode === 'list') { fitNodes(new Set(S.nodes.filter(n => n.kind !== 'source' && !(n.kind === 'concept' && !n.used)).map(n => n.id)), ms, 70); return; }
  if (v.mode === 'sources') { fitNodes(new Set(S.nodes.filter(n => n.kind === 'source' || n.kind === 'plant').map(n => n.id)), ms, 40); return; }
  if (S.lit) { const ids = new Set(S.lit); fitNodes(ids, ms, v.mode === 'concept' || v.mode === 'link' ? 50 : 36); }
}

// ------------------------------------------------------------------ trail & rail & panel
function renderTrail() {
  const v = S.view; const G = S.G; const crumbs = [{ label: 'Diagnosis', go: { mode: 'home' } }];
  const dimOf = id => G.O.get(id)?.dimension;
  if (v.mode === 'dim') crumbs.push({ label: DIM[v.dim].label, go: v });
  if (v.mode === 'concept') { const d = dimOf(v.id); if (d) crumbs.push({ label: DIM[d].label, go: { mode: 'dim', dim: d } }); crumbs.push({ label: G.label(v.id), go: v }); }
  if (v.mode === 'set') crumbs.push({ label: S.active.map(G.label).join(' ∩ '), go: v });
  if (v.mode === 'plant') crumbs.push({ label: 'Plants', go: { mode: 'plants' } }, { label: G.label(v.id), go: v, em: true });
  if (v.mode === 'plants') crumbs.push({ label: 'Plants', go: v });
  if (v.mode === 'sources') crumbs.push({ label: 'Sources', go: v });
  if (v.mode === 'source') crumbs.push({ label: 'Sources', go: { mode: 'sources' } }, { label: G.label(v.id) || v.id, go: v });
  if (v.mode === 'variation' || v.mode === 'disagreement') crumbs.push({ label: G.label(v.plant), go: { mode: 'plant', id: v.plant }, em: true }, { label: `${v.facet.replace(/_/g, ' ')} · ${v.mode}`, go: v });
  if (v.mode === 'link') crumbs.push({ label: G.label(v.plant), go: { mode: 'plant', id: v.plant }, em: true }, { label: G.label(v.concept), go: v });
  if (v.mode === 'list') crumbs.push({ label: v.kind.replace(/_/g, ' '), go: v });
  if (v.mode === 'relations') crumbs.push({ label: 'relations', go: v });
  if (v.mode === 'ask') crumbs.push({ label: 'question', go: v });
  $('#trail').innerHTML = crumbs.map((c, i) => `${i ? '<span class="sep">›</span>' : ''}<button data-go='${esc(JSON.stringify(c.go))}' class="${i === crumbs.length - 1 ? 'here' : ''}">${c.em ? '<em>' : ''}${esc(c.label)}${c.em ? '</em>' : ''}</button>`).join('');
  bind($('#trail'));
}
function bind(root) {
  root.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); go(JSON.parse(el.dataset.go)); }));
  root.querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); act(el.dataset.id); }));
  root.querySelectorAll('[data-active]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); toggleActive(el.dataset.active); }));
}
const P = $('#panel-body');
const stTag = s => `<span class="tag ${esc(s)}">${esc(s)}</span>`;
const dimDot = d => `<i class="dot" style="background:${DIM[d]?.colour || '#888'}"></i>`;
const edgeVal = e => e.value_label != null ? (Array.isArray(e.value_label) ? e.value_label.join(', ') : e.value_label) : e.numbers ? fmtNum(e.numbers) : (S.G.label(e.target));
function evidenceRow(e, opts = {}) {
  const G = S.G; const conds = (e.conditions || []).map(c => G.label(c.concept_id)).join(', ');
  return `<div class="row ev ${e.status}" ${e.claim_id ? `data-claim="${esc(e.claim_id)}"` : ''}><i class="st ${esc(e.status)}" style="--c:${TYPE_COLOUR[e.source_type] || TYPE_COLOUR.plant}"></i><div>${opts.plant ? `<em class="val">${esc(G.label(e.plant))}</em> · ` : ''}<span class="val">${esc(edgeVal(e))}</span>${e.through ? ` <span class="muted">· ${esc((e.field || '').replace(/_/g, ' '))}</span>` : ''}${e.via ? ` <span class="faint">via ${esc(G.label(e.via))}</span>` : ''}${e.spanned ? ' <span class="faint">(range spans this class)</span>' : ''}${e.cultivar ? ` <span class="muted">‘${esc(e.cultivar)}’</span>` : ''}<br><span class="meta">${esc(srcLabel(e.source_id, S.db.sources))}${e.source_type !== 'entity' ? ' · ' + esc(e.status) : ''}${conds ? ' · under ' + esc(conds) : ''}${e.place ? ' · ' + esc(G.label(e.place)) : ''}${e.time && e.time.length ? ' · ' + e.time.map(G.label).join(', ') : ''}</span></div></div>`;
}
function renderPanel() {
  const v = S.view; const G = S.G; const D = S.diag;
  let html = '';
  if (v.mode === 'home') {
    const c = D.counts;
    html = `<h2>What the knowledge base says today</h2><div class="kicker">${G.graph.counts.concepts} concepts · ${G.graph.counts.plants} plants · ${G.graph.counts.live_claim_edges} live claim edges${S.candEdges.length ? ` · <span class="cand">${S.candEdges.length} candidate edges</span>` : ''} · computed from the files</div>
    ${G.plants.map(p => `<div class="row" data-id="${p.id}"><i class="st verified" style="--c:${TYPE_COLOUR.plant}"></i><div><em class="val">${esc(p.label)}</em><br><span class="muted">${esc(D.plants[p.id]?.text || '')}</span></div></div>`).join('')}
    <h3>Hub concepts <span class="faint">linked to ≥ 2 plants</span></h3>
    <div class="chips">${D.hubs.slice(0, 14).map(h => `<span class="chip" data-id="${esc(h.concept)}" style="--c:${DIM[h.dimension]?.colour}">${esc(h.label)} <small>${h.plants.length}</small></span>`).join('')}${D.hubs.length > 14 ? `<span class="chip more" data-go='${esc(JSON.stringify({ mode: 'list', kind: 'hubs' }))}'>+${D.hubs.length - 14}</span>` : ''}</div>
    <h3>Diagnosis</h3>
    <div class="row" data-go='${esc(JSON.stringify({ mode: 'list', kind: 'variation' }))}'><span class="n cond">${c.variation}</span><div><span class="val">depends on conditions</span><br><span class="meta">same plant and facet, different stated conditions, different values</span></div></div>
    <div class="row" data-go='${esc(JSON.stringify({ mode: 'list', kind: 'disagreement' }))}'><span class="n differ">${c.disagreement}</span><div><span class="val">sources disagree</span><br><span class="meta">same conditions (or none stated), non-overlapping values</span></div></div>
    <div class="row" data-go='${esc(JSON.stringify({ mode: 'list', kind: 'gaps' }))}'><span class="n gap">${c.gaps_gate + c.gaps_no_relation}</span><div><span class="val">gaps</span><br><span class="meta">${c.gaps_gate} gate facets without a claim · ${c.gaps_no_relation} plant pairs with shared concepts but no relation · ${c.gaps_single_source} links on one source</span></div></div>
    <div class="row" data-go='${esc(JSON.stringify({ mode: 'list', kind: 'single_voice' }))}'><span class="n sv">${c.single_voice}</span><div><span class="val">single voice</span><br><span class="meta">concepts backed by one source type only</span></div></div>
    <h3>Enter by</h3><div class="chips">${ENTRY.map(d => `<span class="chip" data-go='${esc(JSON.stringify({ mode: 'dim', dim: d }))}' style="--c:${DIM[d].colour}">${DIM[d].label}</span>`).join('')}<span class="chip" data-go='${esc(JSON.stringify({ mode: 'sources' }))}'>Sources</span><span class="chip" data-go='${esc(JSON.stringify({ mode: 'plants' }))}'>Plants</span></div>
    <p class="muted small">Read the space: plants are the warm nodes; concepts are coloured by dimension and sized by how many plants they link; the faint outer ring is vocabulary no claim uses yet. Edges are claims (brighter = more verified). Candidate edges are dashed magenta.</p>`;
  } else if (v.mode === 'dim') {
    const d = v.dim; const facets = (G.dimensions[d] || []);
    html = `<h2>${dimDot(d)} ${esc(DIM[d].label)}</h2><div class="kicker">${facets.length} facets · ${G.concepts.filter(c => c.dimension === d).length} concepts · ${G.concepts.filter(c => c.dimension === d && linkedPlants(c.id).size).length} in use</div>
    ${facets.map(f => { const cs = G.facets.get(f) || []; return `<h3>${esc(f.replace(/_/g, ' '))} <span class="faint">${cs.filter(c => linkedPlants(c.id).size).length}/${cs.length}</span></h3><div class="chips">${cs.map(c => { const k = linkedPlants(c.id).size; return `<span class="chip ${k ? '' : 'unused'} ${S.active.includes(c.id) ? 'active' : ''}" data-id="${esc(c.id)}" style="--c:${DIM[d].colour}" title="${esc(G.O.get(c.id).definition)}">${esc(c.label)}${k ? ` <small>${k}</small>` : ''}</span>`; }).join('')}</div>`; }).join('')}`;
  } else if (v.mode === 'concept') {
    const o = G.O.get(v.id); const es = liveEdgesFor(v.id); const plants = [...new Set(es.map(e => e.plant))];
    const siblings = (G.facets.get(o.facet) || []).filter(c => c.id !== v.id); const co = new Map();
    for (const p of plants) for (const e of plantEdges(p)) if (e.target !== v.id) co.set(e.target, (co.get(e.target) || 0) + 1);
    const coTop = [...co.entries()].filter(([, n]) => n >= Math.max(2, plants.length)).sort((a, b) => b[1] - a[1]).slice(0, 12);
    html = `<h2>${dimDot(o.dimension)} ${esc(o.label)}</h2><div class="kicker">${esc(o.facet.replace(/_/g, ' '))} · ${esc(o.dimension)} · term from ${esc(o.source_of_term || '')}${o.parent ? ` · part of <span data-id="${esc(o.parent)}" class="link">${esc(G.label(o.parent))}</span>` : ''}</div>
    <p class="lead">${esc(o.definition)}</p>${o.aliases?.length ? `<p class="muted small">also: ${esc(o.aliases.join(' · '))}</p>` : ''}
    <p><button data-active="${esc(v.id)}">${S.active.includes(v.id) ? '− remove from intersection' : '+ intersect with this'}</button>${S.active.length ? ` <span class="muted small">active: ${S.active.map(G.label).join(' ∩ ')}</span>` : ''}</p>
    <h3>Plants linked · ${plants.length}</h3>
    ${plants.length ? plants.map(p => `<div class="plantblock"><div class="row" data-id="${p}"><i class="st verified" style="--c:${TYPE_COLOUR.plant}"></i><div><em class="val">${esc(G.label(p))}</em> <span class="meta">${es.filter(e => e.plant === p).length} claim${es.filter(e => e.plant === p).length === 1 ? '' : 's'}</span></div></div>${es.filter(e => e.plant === p).map(e => evidenceRow(e)).join('')}</div>`).join('') : '<p class="muted">No plant is linked to this concept yet — it is vocabulary waiting for evidence.</p>'}
    ${coTop.length ? `<h3>Co-occurring concepts</h3><div class="chips">${coTop.map(([cid, n]) => `<span class="chip" data-id="${esc(cid)}" style="--c:${DIM[G.O.get(cid).dimension].colour}">${esc(G.label(cid))} <small>${n}</small></span>`).join('')}</div>` : ''}
    ${siblings.length ? `<h3>Same facet</h3><div class="chips">${siblings.map(c => `<span class="chip ${linkedPlants(c.id).size ? '' : 'unused'}" data-id="${esc(c.id)}" style="--c:${DIM[o.dimension].colour}">${esc(c.label)}${linkedPlants(c.id).size ? ` <small>${linkedPlants(c.id).size}</small>` : ''}</span>`).join('')}</div>` : ''}`;
  } else if (v.mode === 'set') {
    const inter = S.inter || []; const all = new Set(S.active.flatMap(c => [...linkedPlants(c)])); const away = [...all].filter(p => !inter.includes(p));
    html = `<h2>${S.active.map(c => `${dimDot(G.O.get(c).dimension)} ${esc(G.label(c))}`).join(' <span class="faint">∩</span> ')}</h2><div class="kicker">intersection · ${inter.length} plant${inter.length === 1 ? '' : 's'} satisfy all${away.length ? ` · ${away.length} fall${away.length === 1 ? 's' : ''} away` : ''}</div>
    <p>${S.active.map(c => `<button data-active="${esc(c)}">− ${esc(G.label(c))}</button>`).join(' ')}</p>
    ${inter.map(p => `<div class="plantblock"><div class="row" data-id="${p}"><i class="st verified" style="--c:${TYPE_COLOUR.plant}"></i><div><em class="val">${esc(G.label(p))}</em></div></div>${S.active.map(c => `<div class="muted small" style="margin:4px 0 0 20px">${dimDot(G.O.get(c).dimension)} ${esc(G.label(c))}</div>${liveEdgesFor(c).filter(e => e.plant === p).map(e => evidenceRow(e)).join('')}`).join('')}</div>`).join('')}
    ${away.length ? `<h3>Falls away</h3>${away.map(p => `<div class="row dim" data-id="${p}"><i class="st retired" style="--c:${TYPE_COLOUR.plant}"></i><div><em class="val">${esc(G.label(p))}</em> <span class="meta">missing: ${S.active.filter(c => !linkedPlants(c).has(p)).map(G.label).join(', ')}</span></div></div>`).join('')}` : ''}
    <p class="muted small">Add a third concept from any concept page; the newest replaces the oldest beyond three.</p>`;
  } else if (v.mode === 'plant') {
    const n = G.N.get(v.id); const es = plantEdges(v.id); const d = D.plants[v.id]; const byDim = {};
    const addTo = (cid, e) => { const o = G.O.get(cid); if (!o) return; (byDim[o.dimension] = byDim[o.dimension] || new Map()); const m = byDim[o.dimension]; if (!m.has(cid)) m.set(cid, []); m.get(cid).push(e); };
    for (const e of es) { addTo(e.target, e); if (e.place) addTo(e.place, e); for (const t of e.time || []) addTo(t, e); }
    const vars = D.variation.filter(x => x.plant === v.id), dis = D.disagreement.filter(x => x.plant === v.id), rels = G.graph.edges.filter(e => e.type === 'relation' && (e.source === v.id || e.target === v.id));
    html = `<h2><em>${esc(n.label)}</em></h2><div class="kicker">${esc((n.common || []).join(' · '))} · ${esc(n.plant_type || '')} · ${esc((n.origin_status || '').replace(/_/g, ' '))}</div>
    <p class="lead">${esc(d?.text || '')}</p>
    ${vars.length || dis.length ? `<h3>Where the evidence pulls apart</h3>${vars.map(x => `<div class="row" data-go='${esc(JSON.stringify({ mode: 'variation', plant: v.id, facet: x.facet }))}'><span class="n cond">↔</span><div><span class="val">${esc(x.facet.replace(/_/g, ' '))} depends on conditions</span><br><span class="meta">${esc(x.text)}</span></div></div>`).join('')}${dis.map(x => `<div class="row" data-go='${esc(JSON.stringify({ mode: 'disagreement', plant: v.id, facet: x.facet, claims: x.claims }))}'><span class="n differ">≠</span><div><span class="val">${esc(x.facet.replace(/_/g, ' '))} · sources disagree</span><br><span class="meta">${esc(x.text)}</span></div></div>`).join('')}` : ''}
    ${ENTRY.filter(dm => byDim[dm]).map(dm => `<h3>${dimDot(dm)} ${esc(DIM[dm].label)}</h3><div class="chips">${[...byDim[dm].entries()].map(([cid, ees]) => `<span class="chip ${ees.some(e => e.status === 'verified') ? 'ver' : ''} ${ees.every(e => e.type === 'candidate') ? 'cand' : ''}" data-id="${esc(cid)}" style="--c:${DIM[dm].colour}">${esc(G.label(cid))} <small>${ees.length}</small></span>`).join('')}</div>`).join('')}
    ${rels.length ? `<h3>Relations</h3>${rels.map(r => `<div class="row ${r.live ? '' : 'dim'}"><i class="st ${r.status === 'verified' ? 'verified' : r.status === 'retired' ? 'retired' : 'unverified'}" style="--c:${TYPE_COLOUR[r.source_type]}"></i><div><span class="val">${esc((r.relation || '').replace(/_/g, ' '))}</span> → <em>${esc(G.label(r.source === v.id ? r.target : r.source))}</em><br><span class="meta">${esc(srcLabel(r.source_id, S.db.sources))} · ${esc(r.status)}${r.source_type === 'model' ? ' · placeholder' : ''}</span></div></div>`).join('')}` : ''}`;
  } else if (v.mode === 'variation' || v.mode === 'disagreement') {
    html = detailHtml(v);
  } else if (v.mode === 'link') {
    const es = allEdges().filter(e => e.plant === v.plant && e.target === v.concept && e.live !== false); const o = G.O.get(v.concept);
    html = `<h2><em>${esc(G.label(v.plant))}</em> → ${dimDot(o.dimension)} ${esc(o.label)}</h2><div class="kicker">${es.length} claim${es.length === 1 ? '' : 's'} make this link</div><p class="muted">${esc(o.definition)}</p>${es.map(e => evidenceRow(e)).join('')}`;
  } else if (v.mode === 'source') {
    const n = G.N.get(v.id) || { label: 'you (candidate)', source_type: 'candidate' }; const es = (v.id === 'source:candidate' ? S.candEdges : (G.bySource.get(v.id) || [])).filter(e => e.live !== false && e.target); const byP = {}; for (const e of es) (byP[e.plant] = byP[e.plant] || []).push(e);
    const rec = S.db.sources[v.id.split(':')[1]] || {};
    html = `<h2>${esc(n.label)}</h2><div class="kicker">${esc(n.source_type || '')}${n.geo ? ' · ' + esc(n.geo) : ''}${n.licence_tier ? ' · licence tier ' + esc(n.licence_tier) : ''} · ${es.length} edges</div>${rec.role_in_db ? `<p class="muted">${esc(rec.role_in_db)}</p>` : ''}${rec.url ? `<p><a href="${esc(rec.url)}" target="_blank" rel="noopener">${esc(rec.url.replace(/^https?:\/\//, ''))}</a></p>` : ''}
    ${Object.entries(byP).map(([p, ees]) => `<h3><em>${esc(G.label(p))}</em> · ${ees.length}</h3><div class="chips">${[...new Set(ees.map(e => e.target))].map(cid => `<span class="chip" data-id="${esc(cid)}" style="--c:${DIM[G.O.get(cid).dimension].colour}">${esc(G.label(cid))}</span>`).join('')}</div>`).join('')}`;
  } else if (v.mode === 'sources') {
    const srcs = G.graph.nodes.filter(n => (n.type === 'source' || n.type === 'practitioner') && !n.parent); const byT = {}; for (const s of srcs) (byT[s.source_type] = byT[s.source_type] || []).push(s);
    html = `<h2>Sources</h2><div class="kicker">${srcs.length} sources · priority ${esc(S.db.schema.claim.fields.source_type.priority_order.join(' > '))} · licence A import · B facts with citation · C link only</div>
    ${Object.entries(byT).map(([t, ss]) => `<h3><i class="dot" style="background:${TYPE_COLOUR[t]}"></i> ${esc(t)}</h3>${ss.map(s => { const n = (G.bySource.get(s.id) || []).filter(e => e.live !== false && e.target).length; return `<div class="row ${n ? '' : 'dim'}" data-id="${esc(s.id)}"><i class="st verified" style="--c:${TYPE_COLOUR[t]}"></i><div><span class="val">${esc(s.label)}</span> <span class="meta">${esc(s.geo || '')}${s.licence_tier ? ' · tier ' + esc(s.licence_tier) : ''} · ${n ? n + ' edges' : 'no claim yet'}</span></div></div>`; }).join('')}`).join('')}`;
  } else if (v.mode === 'plants') {
    html = `<h2>Plants</h2><div class="kicker">${G.plants.length} entities · where a walk ends, not where it starts</div>${G.plants.map(p => `<div class="row" data-id="${p.id}"><i class="st verified" style="--c:${TYPE_COLOUR.plant}"></i><div><em class="val">${esc(p.label)}</em> <span class="muted">${esc((p.common || [])[0] || '')}</span><br><span class="meta">${esc(D.plants[p.id]?.text || '')}</span></div></div>`).join('')}`;
  } else if (v.mode === 'list') {
    const k = v.kind;
    if (k === 'hubs') html = `<h2>Hub concepts</h2><div class="kicker">${D.hubs.length} concepts linked to two or more plants</div>${D.hubs.map(h => `<div class="row" data-id="${esc(h.concept)}">${dimDot(h.dimension)}<div><span class="val">${esc(h.label)}</span> <span class="meta">${h.plants.length} plants · ${h.n_edges} claims</span><br><span class="muted small">${esc(h.text)}</span></div></div>`).join('')}`;
    if (k === 'variation') html = `<h2>Depends on conditions</h2><div class="kicker">${D.variation.length} plant × facet${D.variation.length === 1 ? '' : 's'}</div>${D.variation.map(x => `<div class="row" data-go='${esc(JSON.stringify({ mode: 'variation', plant: x.plant, facet: x.facet }))}'><span class="n cond">↔</span><div><span class="val"><em>${esc(G.label(x.plant))}</em> · ${esc(x.facet.replace(/_/g, ' '))}</span>${x.candidate ? ' <span class="tag candidate">candidate</span>' : ''}<br><span class="muted small">${esc(x.text)}</span></div></div>`).join('') || '<p class="muted">none</p>'}`;
    if (k === 'disagreement') html = `<h2>Sources disagree</h2><div class="kicker">${D.disagreement.length} pairs</div>${D.disagreement.map(x => `<div class="row" data-go='${esc(JSON.stringify({ mode: 'disagreement', plant: x.plant, facet: x.facet, claims: x.claims }))}'><span class="n differ">≠</span><div><span class="val"><em>${esc(G.label(x.plant))}</em> · ${esc(x.facet.replace(/_/g, ' '))}</span>${x.candidate ? ' <span class="tag candidate">candidate</span>' : ''}<br><span class="muted small">${esc(x.text)}</span></div></div>`).join('')}`;
    if (k === 'gaps') html = `<h2>Gaps</h2><div class="kicker">computed · ${D.counts.gaps_gate} gate facets · ${D.counts.gaps_no_relation} unlinked pairs · ${D.counts.gaps_single_source} single-source links</div>${D.gaps.filter(g => g.kind !== 'single_source_links').map(g => `<div class="row" ${g.plant ? `data-id="${esc(g.plant)}"` : ''}><span class="n gap">○</span><div><span class="muted small">${esc(g.text)}</span>${g.shared ? `<div class="chips" style="margin-top:4px">${g.shared.slice(0, 10).map(cid => `<span class="chip" data-id="${esc(cid)}" style="--c:${DIM[G.O.get(cid).dimension].colour}">${esc(G.label(cid))}</span>`).join('')}</div>` : ''}</div></div>`).join('')}<h3>Single-source links · ${D.counts.gaps_single_source}</h3><p class="muted small">Each of these plant → concept links rests on one source. The first 40:</p>${(D.gaps.find(g => g.kind === 'single_source_links')?.items || []).slice(0, 40).map(i => `<div class="row" data-id="${esc(i.concept)}"><span class="n gap">1</span><div><em>${esc(G.label(i.plant))}</em> → ${esc(G.label(i.concept))} <span class="meta">${esc(srcLabel(i.source, S.db.sources))}</span></div></div>`).join('')}`;
    if (k === 'single_voice') html = `<h2>Single voice</h2><div class="kicker">${D.single_voice.length} concepts whose links all come from one source type</div>${D.single_voice.map(x => `<div class="row" data-id="${esc(x.concept)}"><span class="n sv">1</span><div><span class="val">${esc(x.label)}</span> <span class="meta">${esc(x.source_type)} only · ${x.plants.length} plant${x.plants.length === 1 ? '' : 's'}</span></div></div>`).join('')}`;
  } else if (v.mode === 'relations') {
    const rels = G.graph.edges.filter(e => e.type === 'relation');
    html = `<h2>Relations</h2><div class="kicker">${rels.length} recorded · ${rels.filter(r => r.status === 'verified').length} verified</div>${rels.map(r => `<div class="row ${r.live ? '' : 'dim'}"><i class="st ${r.status === 'verified' ? 'verified' : r.status === 'retired' ? 'retired' : 'unverified'}" style="--c:${TYPE_COLOUR[r.source_type]}"></i><div><span class="val">${esc((r.relation || '').replace(/_/g, ' '))}</span> <em>${esc(G.label(r.source))}</em> ↔ <em>${esc(G.label(r.target))}</em><br><span class="meta">${esc(srcLabel(r.source_id, S.db.sources))} · ${esc(r.status)}${r.source_type === 'model' ? ' · placeholder' : ''}</span></div></div>`).join('')}<p class="muted small">Only one relation is verified: a practitioner's co-listing, completeness L0. Shared concepts between plants are not relations.</p>`;
  } else if (v.mode === 'ask') { html = S.askPanel || ''; }
  P.innerHTML = html; bind(P); P.querySelectorAll('[data-claim]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); const c = el.dataset.claim; const ed = allEdges().find(x => x.claim_id === c); if (ed) go({ mode: 'link', plant: ed.plant, concept: ed.target }); })); P.scrollTop = 0;
}

// variation: values laid along the condition axis; disagreement: claims faced against each other
function detailHtml(v) {
  const G = S.G; const es = plantEdges(v.plant).filter(e => e.facet === v.facet); const claims = new Map();
  for (const e of es) if (e.claim_id && !claims.has(e.claim_id)) claims.set(e.claim_id, e);
  const order = id => { const o = G.O.get(id); return o ? (o.order ?? 50) : 50; };
  const condScore = e => { const ex = (e.conditions || []).map(c => c.concept_id).filter(c => c.startsWith('exposure:')); if (!ex.length) return null; const o = G.O.get(ex[0]); return o.order ?? (ex[0] === 'exposure:shade' ? 4.5 : ex[0] === 'exposure:sun' ? 1.5 : 3); };
  const isNum = v.facet === 'height_class' || v.facet === 'spread_class';
  const rows = [...claims.values()].sort((a, b) => ((condScore(a) ?? 99) - (condScore(b) ?? 99)) || a.claim_id.localeCompare(b.claim_id));
  let chart = '';
  if (isNum) {
    const ivs = rows.map(e => interval(e.numbers)); const vmax = Math.max(0.5, ...ivs.filter(Boolean).map(i => i[1])); const pct = x => `${(x / vmax * 100).toFixed(1)}%`;
    chart = `<div class="axis"><span class="axlabel">condition axis: sun → shade (stated) · then unstated</span>${rows.map((e, i) => { const iv = ivs[i]; const conds = (e.conditions || []).map(c => G.label(c.concept_id)).join(', '); return `<div class="vrow ${e.status}"><div class="vcond">${conds ? esc(conds) : '<span class="faint">condition not stated</span>'}${e.cultivar ? ` <span class="faint">‘${esc(e.cultivar)}’</span>` : ''}</div><div class="vbar">${iv ? `<i style="left:${pct(iv[0])};width:${pct(Math.max(iv[1] - iv[0], vmax * 0.012))};--c:${TYPE_COLOUR[e.source_type]}" class="${e.status}"></i>` : ''}<span class="vval">${esc(fmtNum(e.numbers))}</span></div><div class="vsrc">${esc(srcLabel(e.source_id, S.db.sources))}<small>${esc(e.status)} · ${esc(G.label(e.place))}</small></div></div>`; }).join('')}<div class="ticks">${[0, 0.25, 0.5, 0.75, 1].map(t => `<span style="left:${t * 100}%">${(t * vmax).toFixed(1)}</span>`).join('')}<span class="unit">m</span></div></div>`;
  } else {
    const vals = [...new Set(rows.flatMap(e => es.filter(x => x.claim_id === e.claim_id).map(x => x.target)))].sort((a, b) => order(a) - order(b));
    chart = `<div class="spectrum"><div class="shead"><span></span>${vals.map(c => `<span class="scol">${esc(G.label(c))}</span>`).join('')}</div>${rows.map(e => { const mine = new Set(es.filter(x => x.claim_id === e.claim_id).map(x => x.target)); return `<div class="srow"><span class="sname">${esc(srcLabel(e.source_id, S.db.sources))}<small>${esc(e.status)} · ${esc(G.label(e.place))}${(e.conditions || []).length ? ' · ' + e.conditions.map(c => esc(G.label(c.concept_id))).join(', ') : ''}</small></span>${vals.map(c => `<span class="scell"><i class="${mine.has(c) ? 'on ' + e.status : ''}" style="--c:${TYPE_COLOUR[e.source_type]}"></i></span>`).join('')}</div>`; }).join('')}</div>`;
  }
  const item = v.mode === 'variation' ? S.diag.variation.find(x => x.plant === v.plant && x.facet === v.facet) : S.diag.disagreement.find(x => x.plant === v.plant && x.facet === v.facet && (!v.claims || x.claims.join() === v.claims.join()));
  const faced = v.mode === 'disagreement' && item ? `<div class="face">${item.claims.map(cid => { const e = claims.get(cid) || allEdges().find(x => x.claim_id === cid); return e ? `<div class="side ${e.status}"><div class="val big">${esc(edgeVal(e))}</div><div class="meta">${esc(srcLabel(e.source_id, S.db.sources))} · ${esc(e.source_type)} · ${esc(G.label(e.place))}</div><div class="meta">${esc(e.status)} · confidence ${e.confidence ?? '—'}</div><div class="muted small">${esc(e.text || '')}</div></div>` : ''; }).join('<div class="vs">vs</div>')}</div>` : '';
  return `<h2><em>${esc(G.label(v.plant))}</em> · ${esc(v.facet.replace(/_/g, ' '))}</h2><div class="kicker">${v.mode === 'variation' ? 'depends on conditions' : 'sources disagree'} · ${rows.length} claims on this facet</div>
  <p class="lead">${esc(item?.text || '')}</p>${faced}${chart}
  <p class="muted small">${v.mode === 'variation' ? 'Different values under different stated conditions are variation, not contradiction. Values with no stated condition sit below the conditioned ones.' : 'Non-overlapping values under the same (or no stated) condition from different sources. Both stay in the store; a reviewer resolves it, not the ranking (R1).'}</p>`;
}

// ------------------------------------------------------------------ Grow
const FIELD_WORDS = { mature_height: ['height', 'tall', 'high', ' cm', 'stays under', 'stays below', 'reaches', 'metre', 'meter', ' m ', 'ft'], mature_spread: ['spread', 'wide', 'width', 'across'], exposure: ['full sun', 'part shade', 'shade', 'shady', 'sunny', 'north-facing', 'exposure', 'aspect'], water_drainage: ['wet', 'dry soil', 'drainage', 'drought', 'moist', 'waterlogged', 'soggy', 'irrigat'], hardiness_zone: ['frost', 'hardy', 'winter kill', 'zone', 'cold snap', 'froze'], maintenance_level: ['maintenance', 'pruning', 'prune', 'easy care', 'low care', 'fuss'], growth_rate: ['fast', 'slow', 'growth rate', 'grows quickly', 'vigorous', 'per year'], landscape_use: ['hedge', 'screen', 'ground cover', 'container', 'roof', 'planter'], toxicity: ['toxic', 'poison', 'dog', 'cat ', 'pets', 'ate'], seasonal_interest: ['flower', 'bloom', 'fall colour', 'fall color', 'berries', 'fruit', 'autumn', 'evergreen', 'leaves turn'], ecological_value: ['bees', 'pollinator', 'birds', 'wildlife', 'hummingbird', 'habitat'], resistances: ['tolerates', 'tolerant', 'resistant', 'unbothered', 'deer', 'rabbit'] };
function detect(text) {
  const G = S.G; const t = ` ${text.toLowerCase()} `; const names = S.retr.nameHits(text); const pid = Object.keys(names)[0] || null;
  const scores = Object.entries(FIELD_WORDS).map(([f, ws]) => [f, ws.filter(w => t.includes(w)).length]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]); const field = scores[0]?.[0] || null;
  const num = t.match(/(\d+(?:\.\d+)?)\s*(cm|m|metres?|meters?|ft|feet)\b/); let value = null, value_kind = 'qualitative';
  if (num) { let x = parseFloat(num[1]); const u = num[2]; if (u === 'cm') x /= 100; else if (u === 'ft' || u === 'feet') x *= 0.3048; x = Math.round(x * 100) / 100; const before = t.slice(0, num.index); value = /(under|below|less than|at most|no more than|max)\s*$/.test(before) ? { max: x, unit: 'm' } : /(over|above|more than|at least|min)\s*$/.test(before) ? { min: x, unit: 'm' } : { height_m: x, unit: 'm' }; value_kind = 'quantitative'; }
  const found = conceptsInText(G, text);
  const byFacet = {}; for (const id of found.keys()) { const f = G.O.get(id).facet; (byFacet[f] = byFacet[f] || []).push(id); }
  const facets = (G.facetFields && Object.entries(G.facetFields).filter(([, flds]) => flds.some(x => x.split('.')[0] === field)).map(([f]) => f)) || [];
  let concepts = [], conditions = [];
  if (value && (field === 'mature_height' || field === 'local_mature_size')) { const iv = interval(value); concepts = classesFor(G, 'height_class', iv[0], iv[1]); }
  else if (value && field === 'mature_spread') { const iv = interval(value); concepts = classesFor(G, 'spread_class', iv[0], iv[1]); }
  for (const [f, ids] of Object.entries(byFacet)) {
    if (f === 'place' || f === 'season' || f === 'month' || f === 'age') continue;
    if (facets.includes(f) && !concepts.length) concepts.push(...ids);
    else if (f === 'exposure' || f === 'soil' || f === 'water') conditions.push(...ids.map(id => ({ facet: f, concept_id: id })));
    else if (!facets.length) concepts.push(...ids);
  }
  if (!value && !concepts.length && field && facets.length && byFacet[facets[0]]) concepts = byFacet[facets[0]];
  const place = (byFacet.place || [])[0] || null; const time = [...(byFacet.season || []), ...(byFacet.month || []), ...(byFacet.age || [])];
  return { pid, field, value, value_kind, concepts: [...new Set(concepts)], conditions, place, time, value_label: value ? null : (concepts.length ? concepts.map(c => G.label(c)) : null) };
}
function loadCandidates() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } }
function saveCandidates() { try { localStorage.setItem(LS_KEY, JSON.stringify(S.candidates)); } catch { /* ignore */ } }
function candToClaim(c) { return { ...c, status: 'candidate', source_id: 'candidate', source_type: 'candidate', confidence: null }; }
function addCandidate(text, pid, field, basis, location) {
  const G = S.G; const d = detect(text); const locHits = location ? conceptsInText(G, location) : new Map(); const place = [...locHits.keys()].find(id => id.startsWith('place:')) || d.place || (location ? 'place:vancouver' : null);
  const n = S.candidates.filter(c => c.plant === pid && c.field === field).length + 1;
  const before = S.diag;
  const c = { id: `candidate:${pid}:${field}:${String(n).padStart(2, '0')}`, plant: pid, field, value_kind: d.value_kind, value: d.value || { note: text.trim() }, value_label: d.value_label, text: text.trim(), context: ['candidate (this session)', location, d.conditions.map(x => G.label(x.concept_id).toLowerCase()).join(', ')].filter(Boolean).join('; '), concepts: d.concepts, conditions: d.conditions, place, time: d.time, cultivar: null, recorded_at: new Date().toISOString().slice(0, 10), recorded_by: 'user (browser session)', practitioner_meta: { basis: basis || null, location: location || null, site_conditions: d.conditions.map(x => G.label(x.concept_id)).join(', ') || null, observer_background: 'this session (unverified user input)', completeness: basis && location ? 'L2' : basis ? 'L1' : 'L0', citable: false } };
  S.candidates.push(c); saveCandidates(); S.candEdges = S.candidates.flatMap(x => candidateEdges(G, x)); S.diag = runDiag(); buildGraph(); applyDim();
  const after = S.diag; const P = `plant:${pid}`; const items = [];
  const facetsOf = [...new Set(d.concepts.map(x => G.O.get(x).facet))];
  items.push(`<em>${esc(G.label(P))}</em> gains ${d.concepts.length ? `${d.concepts.length} candidate edge${d.concepts.length === 1 ? '' : 's'} to ${d.concepts.map(G.label).join(', ')}` : 'a candidate note with no concept — add a value, a condition or a place to connect it'}${d.conditions.length ? ` under ${d.conditions.map(x => G.label(x.concept_id).toLowerCase()).join(', ')}` : ''}${place ? ` at ${G.label(place)}` : ''}.`);
  const newHubs = after.hubs.filter(h => !before.hubs.some(b => b.concept === h.concept)); if (newHubs.length) items.push(`New hub: ${newHubs.map(h => h.label).join(', ')} now link${newHubs.length === 1 ? 's' : ''} two plants (one edge is yours, unverified).`);
  const newVar = after.variation.filter(x => x.candidate && !before.variation.some(b => b.plant === x.plant && b.facet === x.facet)); for (const x of newVar) items.push(`A variation appears: ${esc(x.text)}`);
  const sameVar = after.variation.filter(x => x.candidate && before.variation.some(b => b.plant === x.plant && b.facet === x.facet)); for (const x of sameVar) items.push(`The existing variation on ${esc(x.facet.replace(/_/g, ' '))} gains a ${place && place.includes('vancouver') ? 'Vancouver' : 'new'} data point${place && place.includes('vancouver') ? ' — the first one at the scale the database serves' : ''}.`);
  const newDis = after.disagreement.filter(x => x.candidate); for (const x of newDis) items.push(`Your reading disagrees with ${srcLabel(x.sources.find(s => s !== 'candidate'), S.db.sources)}: ${esc(x.text)}`);
  const gateBefore = before.gaps.filter(g => g.kind === 'gate_facet_missing' && g.plant === P).map(g => g.facet), gateAfter = after.gaps.filter(g => g.kind === 'gate_facet_missing' && g.plant === P).map(g => g.facet);
  for (const f of gateBefore.filter(f => !gateAfter.includes(f))) items.push(`The gate-facet gap ‘${f.replace(/_/g, ' ')}’ is filled by a candidate — the AI still cannot gate on it until a sourced claim arrives.`);
  if (facetsOf.length && !newVar.length && !sameVar.length && !newDis.length) { const siblings = plantEdges(P).filter(e => facetsOf.includes(e.facet) && e.type !== 'candidate'); if (siblings.length) items.push(`It sits beside ${new Set(siblings.map(e => e.source_id)).size} sourced reading${new Set(siblings.map(e => e.source_id)).size === 1 ? '' : 's'} on ${facetsOf.map(f => f.replace(/_/g, ' ')).join(', ')} without contradicting them.`); else items.push(`No sourced reading existed on ${facetsOf.map(f => f.replace(/_/g, ' ')).join(', ')} for this plant — your observation is the first voice there, flagged candidate.`); }
  items.push(`Status: candidate, completeness ${c.practitioner_meta.completeness}, never citable, this browser only.`);
  $('#changed').innerHTML = `<div class="changed"><h4>What changed</h4><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul><p><button data-id="${P}">show the plant</button> <button id="ask-again">ask with it</button></p></div>`; bind($('#changed'));
  $('#ask-again')?.addEventListener('click', () => { openDrawer('ask'); const q = `how tall does ${(G.N.get(P).common || [])[0] || G.label(P)} get in ${d.conditions.length ? G.label(d.conditions[0].concept_id).toLowerCase() : 'full sun'}`; $('#ask-input').value = q; runQuery(q); });
  renderCandList(); renderStats();
  if (d.concepts.length) go({ mode: 'link', plant: P, concept: d.concepts[d.concepts.length - 1] }); else go({ mode: 'plant', id: P });
}
function resetCandidates() { S.candidates = []; saveCandidates(); S.candEdges = []; S.diag = S.G.diagnosis; buildGraph(); applyDim(); $('#changed').innerHTML = ''; renderCandList(); renderStats(); go({ mode: 'home' }); }
function renderCandList() { const ul = $('#cand-list'); ul.innerHTML = S.candidates.map(c => `<li><span class="cand">■</span> <em>${esc(S.G.label(`plant:${c.plant}`))}</em> · ${esc(c.field.replace(/_/g, ' '))} · ${esc(c.value_label ? [].concat(c.value_label).join(', ') : fmtNum(c.value))} <button data-id="plant:${esc(c.plant)}">open</button></li>`).join('') || '<li class="muted" style="border:0">no candidates yet</li>'; bind(ul); }

// ------------------------------------------------------------------ Ask: concepts activate first, then the retriever's edges light
function runQuery(q) {
  if (!q.trim()) return; const G = S.G;
  const found = conceptsInText(G, q); const concepts = [...found.keys()].filter(id => G.O.has(id));
  S.history.push(S.view); S.view = { mode: 'ask' }; S.lit = new Set(concepts); S.litLinks = new Set(); applyDim(); renderTrail();
  for (const cid of concepts) for (const p of linkedPlants(cid)) { /* plants light in the second step */ }
  $('#ask-label').classList.add('on');
  S.askPanel = `<h2>What a question activates</h2><div class="kicker">retrieval preview · not a full AI trace · “${esc(q)}”</div><p class="lead">Step 1 — concepts: ${concepts.length ? concepts.map(c => `<span class="chip" data-id="${esc(c)}" style="--c:${DIM[G.O.get(c).dimension].colour}">${esc(G.label(c))} <small>${esc(found.get(c))}</small></span>`).join(' ') : 'no concept matched by alias'}.</p><p class="muted">Step 2 — the retriever runs (names → gates → BM25 → R5 order)…</p>`; renderPanel();
  moveCamera(700);
  setTimeout(() => {
    const r = S.retr.run(q); S.lastResult = r; const lit = new Set(concepts); const litLinks = new Set();
    for (const c of [...r.ranked.slice(0, 20), ...r.withheld, ...r.candidateHits]) { const edges = (G.byClaim.get(c.id) || []).concat(S.candEdges.filter(e => e.claim_id === c.id)); for (const e of edges) { lit.add(e.plant); if (e.target) { lit.add(e.target); litLinks.add(`${e.plant}→${e.target}`); } lit.add(`source:${e.source_id}`); } }
    for (const pid of r.candidates) lit.add(`plant:${pid}`);
    S.lit = lit; S.litLinks = litLinks; applyDim(); moveCamera(900);
    const srcs = [...new Set(r.ranked.slice(0, 20).map(c => c.source_id))];
    S.askPanel = `<h2>What a question activates</h2><div class="kicker">retrieval preview · not a full AI trace · “${esc(q)}”</div>
      <h3>1 · Concepts activated</h3><div class="chips">${concepts.length ? concepts.map(c => `<span class="chip" data-id="${esc(c)}" style="--c:${DIM[G.O.get(c).dimension].colour}">${esc(G.label(c))} <small>${esc(found.get(c))}</small></span>`).join('') : '<span class="muted">none by alias</span>'}</div>
      <h3>2 · Plants after gates (R7)</h3><p class="muted">${r.candidates.map(p => `<em>${esc(G.label(`plant:${p}`))}</em>`).join(', ') || 'none'}${r.excluded.length ? ` · excluded: ${r.excluded.join(', ')}` : ''}</p>
      <h3>3 · Edges the retriever selects</h3><p class="muted">${litLinks.size} plant → concept edges from ${r.ranked.length} ranked claims · ${srcs.length} sources · ${r.withheld.length} L0 withheld (R2)${r.candidateHits.length ? ` · <span class="cand">${r.candidateHits.length} candidate recalled, never cited</span>` : ''}</p>
      ${srcs.map(sid => `<div class="row" data-id="source:${esc(sid)}"><i class="st verified" style="--c:${TYPE_COLOUR[S.db.sources[sid]?.type] || '#888'}"></i><div><span class="val">${esc(srcLabel(sid, S.db.sources))}</span> <span class="meta">${r.ranked.filter(c => c.source_id === sid).length} claims in the answer</span></div></div>`).join('')}
      <p class="muted small">The ranked list with the rank key under each line is in the Ask drawer.</p>`; renderPanel();
    renderAskResult(r);
  }, 900);
}
function clearAsk() { S.lit = null; S.litLinks = null; $('#ask-label').classList.remove('on'); $('#ask-result').innerHTML = ''; go({ mode: 'home' }); }
function renderAskResult(r) {
  const el = $('#ask-result'); const plants = S.db.plants; const gateRows = Object.entries(r.gates).filter(([, g]) => Object.keys(g).length);
  el.innerHTML = `<h3>Routes</h3><div class="muted">names: ${Object.keys(r.names).length ? Object.entries(r.names).map(([k, v]) => `<em>${esc(k)}</em> (${esc(v.join(', '))})`).join(', ') : 'none'} · intents: ${r.intents.length ? r.intents.map(i => `${esc(i.term)} → ${esc(i.field)} <span class="why">${esc(i.mode)}</span>`).join(', ') : 'none'}</div>
    ${gateRows.length ? `<h3>Gates (R7)</h3><table>${gateRows.map(([pid, g]) => `<tr><th><em>${esc(plants[pid].entity.scientific_name)}</em></th><td>${Object.entries(g).map(([t, v]) => `<span class="tag ${esc(v)}">${esc(t)}: ${esc(v)}</span>`).join(' ')}</td></tr>`).join('')}</table>` : ''}
    <div class="muted" style="margin-top:6px">recall ${r.recall_n} claims by BM25 (similarity decides recall only) · ${r.withheld.length} L0 practitioner claim${r.withheld.length === 1 ? '' : 's'} withheld (R2)</div>
    <h3>Answer order (R5) · attribution (R6)</h3>
    ${r.ranked.length ? r.ranked.slice(0, 14).map((c, i) => `<div class="r" data-claim="${esc(c.id)}"><span class="rank">${i + 1}.</span> ${esc(S.retr.attribute(c))}<div class="why">${esc(c.field.replace(/_/g, ' '))} · ${esc(S.retr.why(c))}</div></div>`).join('') + (r.ranked.length > 14 ? `<div class="muted">… ${r.ranked.length - 14} more</div>` : '') : '<p class="warn">No sourced claim matches — honest empty answer.</p>'}
    ${r.withheld.length ? `<h3>Withheld (L0, not citable)</h3>${r.withheld.map(c => `<div class="r" data-claim="${esc(c.id)}"><span class="muted">${esc(c.text)}</span><div class="why">stored, never cited (R2)</div></div>`).join('')}` : ''}
    ${r.candidateHits.length ? `<h3>Candidates recalled (unverified user input)</h3>${r.candidateHits.map(c => `<div class="r cand" data-claim="${esc(c.id)}">${esc(c.text)}<div class="why">flagged, not cited</div></div>`).join('')}` : ''}
    ${S.candidates.length ? `<p class="${r.candidateHits.length ? 'cand' : 'muted'}">Δ with your candidates: ${r.candidateHits.length ? `${r.candidateHits.length} recalled — shown as unverified user input, never cited, ranked after every sourced claim.` : 'none recalled for this question.'}</p>` : ''}`;
  el.querySelectorAll('[data-claim]').forEach(x => x.addEventListener('click', () => { const ed = allEdges().find(e => e.claim_id === x.dataset.claim); if (ed) go({ mode: 'link', plant: ed.plant, concept: ed.target }); }));
}

// ------------------------------------------------------------------ UI
function openDrawer(id) { for (const d of document.querySelectorAll('.drawer')) d.classList.toggle('open', d.id === id && !d.classList.contains('open')); document.querySelectorAll('#rail button[data-drawer]').forEach(b => b.classList.toggle('on', document.getElementById(b.dataset.drawer).classList.contains('open'))); moveCamera(500); }
function renderStats() { const c = S.G.graph.counts; $('#stats').textContent = `${c.concepts} concepts · ${c.plants} plants · ${c.cultivars} cultivars · ${c.sources} sources · ${c.live_claim_edges} live claim edges · ${c.relation_edges} relations${S.candidates.length ? ` · ${S.candidates.length} candidate${S.candidates.length === 1 ? '' : 's'} this session` : ''}`; }
function initUi() {
  renderStats();
  document.querySelectorAll('#rail button[data-view]').forEach(b => b.addEventListener('click', () => { if (S.view.mode === 'ask') { S.lit = null; $('#ask-label').classList.remove('on'); } go(viewFor(b.dataset.view)); }));
  document.querySelectorAll('#rail button[data-drawer]').forEach(b => b.addEventListener('click', () => openDrawer(b.dataset.drawer)));
  $('#btn-up').addEventListener('click', () => { if (S.view.mode === 'ask') clearAsk(); else up(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const d = document.querySelector('.drawer.open'); if (d) { d.classList.remove('open'); document.querySelectorAll('#rail button[data-drawer]').forEach(b => b.classList.remove('on')); moveCamera(400); } else if (S.view.mode === 'ask') clearAsk(); else up(); } });
  $('#legend').innerHTML = ENTRY.map(d => `<span><i class="dot" style="background:${DIM[d].colour}"></i>${DIM[d].label}</span>`).join('') + `<span class="sep">|</span><span><i class="dot" style="background:${TYPE_COLOUR.plant}"></i>plant</span><span><i class="sq" style="background:${TYPE_COLOUR.database}"></i>source</span><span class="sep">|</span><span><i class="ln"></i>claim edge (brighter = more verified)</span><span><i class="ln dotted" style="border-color:${TYPE_COLOUR.candidate}"></i>candidate</span>`;
  const qb = $('#qbtns'); for (const q of S.db.queries.queries) { const b = document.createElement('button'); b.innerHTML = `${esc(q.query)} <small>${esc(q.id)}${q.status === 'proxy' ? ' · proxy' : ''}</small>`; b.addEventListener('click', () => { $('#ask-input').value = q.query; runQuery(q.query); }); qb.appendChild(b); }
  $('#ask-run').addEventListener('click', () => runQuery($('#ask-input').value)); $('#ask-input').addEventListener('keydown', e => { if (e.key === 'Enter') runQuery($('#ask-input').value); }); $('#ask-clear').addEventListener('click', clearAsk);
  const ps = $('#add-plant'); for (const p of S.G.plants) { const o = document.createElement('option'); o.value = p.id.split(':')[1]; o.textContent = p.label; ps.appendChild(o); }
  const fs = $('#add-field'); for (const f of Object.keys(FIELD_WORDS)) { const o = document.createElement('option'); o.value = f; o.textContent = f.replace(/_/g, ' '); fs.appendChild(o); }
  $('#add-text').addEventListener('input', () => { const d = detect($('#add-text').value); if (d.pid) ps.value = d.pid; if (d.field) fs.value = d.field; $('#add-detected').innerHTML = `plant: ${esc(d.pid || '?')} · field: ${esc(d.field || '?')} · concepts: ${d.concepts.map(c => esc(S.G.label(c))).join(', ') || '—'}${d.conditions.length ? ' · conditions: ' + d.conditions.map(x => esc(S.G.label(x.concept_id))).join(', ') : ''}${d.place ? ' · place: ' + esc(S.G.label(d.place)) : ''}${d.time.length ? ' · time: ' + d.time.map(x => esc(S.G.label(x))).join(', ') : ''}`; });
  $('#add-go').addEventListener('click', () => { const t = $('#add-text').value.trim(); if (!t) return; addCandidate(t, ps.value, fs.value, $('#add-basis').value, $('#add-location').value.trim()); });
  $('#add-reset').addEventListener('click', resetCandidates);
  renderCandList();
}
window.brain = { S, go, act, up, toggleActive, addCandidate, resetCandidates, runQuery, clearAsk, detect };
