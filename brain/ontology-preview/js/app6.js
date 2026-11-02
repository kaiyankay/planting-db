// Neural Knowledge Brain — ontology preview (v6, brief 2026-11-02). The XYZ ontology, the semantic graph and its evidence
// drawn as one 3D neural network, on the v5 engine (brain/js/app5.js: additive neurons, branch fibres, synapses, signal
// propagation, growth). What is new is what the network *is*:
//   regions   X Plant Identity & Classification · Y Traits & Performance · Z Planting Design Knowledge — three lobes; plants at
//             the centre; Evidence (sources, places) beneath. Inside a lobe: category → facet → concept, from ontology.json.
//   fibres    only real kg.json edges: claim links (plant → concept, one synapse per claim), hierarchy (part_of), taxonomy,
//             classification, height bands and layers (derived), design links (derived · candidate), concept relations
//             (requires_trait, maps_to, typically_formed_by, corresponds_to), source → plant, plant → plant relations.
//   signal    a click or a question walks the real links; the four prototype paths are traversals of the kg engine (js/kg.js,
//             the same rules as tools/kg_query.py), lit wave by wave.
//   evidence  click a fibre: relation type, status (documented · derived · candidate · unknown), claims, sources, conditions,
//             verification, rule or literature source.
//   gaps      unknown and contradicted design links, dormant design concepts, gate gaps, disagreements and variations.
//   growth    an observation grows candidate fibres; the requirement check re-runs with it, and stays candidate.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { loadAll } from './kg.js';
import { index as indexGraph, conceptsInText, classesFor, candidateEdges } from '../../js/graph.js';
import { diagnose, fmtNum, interval } from '../../js/diagnosis.js';
import { TYPE_COLOUR } from '../../js/model.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const LS_KEY = 'brain.candidates.v6';
const STEP = 560;
const AX = {   // the three lobes + the evidence region
  'axis:x': { key: 'x', label: 'X · Identity & Classification', colour: '#f6d365', anchor: [0, 250, -140] },
  'axis:y': { key: 'y', label: 'Y · Traits & Performance', colour: '#7cc4ff', anchor: [-340, -50, 120] },
  'axis:z': { key: 'z', label: 'Z · Planting Design Knowledge', colour: '#6ff2b0', anchor: [340, -50, 120] },
  evidence: { key: 'e', label: 'Evidence · Sources & Places', colour: '#ff9e6b', anchor: [0, -300, -80] },
};
const ST = { documented: '#ffffff', derived: '#c9b8ff', candidate: '#ffd27a', unknown: '#ff6b6b', observation: TYPE_COLOUR.candidate, conflict: '#ff6b6b' };
const S = { K: null, G: null, Graph: null, nodes: [], links: [], syn: [], labels: [], act: new Map(), actL: new Map(), alive: false, dirty: 2, centroid: {}, candidates: [], diag: null, mode: null, edgeLink: new Map(), selected: null, open: new Set() };

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
const rnd = (s, i) => hash(`${s}#${i}`);
function dir3(s) { const u = rnd(s, 1) * 2 - 1, t = rnd(s, 2) * Math.PI * 2; const r = Math.sqrt(Math.max(0, 1 - u * u)); return [r * Math.cos(t), u, r * Math.sin(t)]; }
const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

// ------------------------------------------------------------------ boot
(async function boot() {
  try {
    S.K = await loadAll(); const K = S.K;
    S.G = indexGraph(K.kg, K.db.diagnosis, K.db.ontology);
    S.candidates = loadCandidates(); for (const c of S.candidates) K.addCandidateEdges(candidateEdges(S.G, c), candToClaim(c));
    S.diag = S.candidates.length ? runDiag() : K.db.diagnosis;
    initHost(); buildGraph(); initUi();
    $('#loading').classList.add('gone');
  } catch (e) { $('#err').textContent = `could not load: ${e.message}\n\nserve the planting-db root:  python3 -m http.server 8766  → http://localhost:8766/brain/ontology-preview/`; console.error(e); }
})();
function runDiag() { const K = S.K; return diagnose(S.G.O, K.edges, id => K.label(id), K.kg.gate_facets, K.db.sources); }
const regionOf = n => n.axis ? n.axis : (n.type === 'plant' || n.type === 'cultivar') ? 'centre' : (n.type === 'source' || n.type === 'practitioner' || n.category === 'cross:place') ? 'evidence' : (n.category === 'cross:time' ? 'axis:y' : 'axis:x');
const colourOfNode = n => n.kind === 'plant' || n.kind === 'cultivar' ? TYPE_COLOUR.plant : n.kind === 'source' ? (TYPE_COLOUR[n.n.source_type] || '#8892a8') : (AX[n.region] || AX.evidence).colour;

// ------------------------------------------------------------------ graph data: hierarchy decides the home of every neuron
function buildGraph() {
  const K = S.K; const prev = new Map(S.nodes.map(n => [n.id, n])); const nodes = []; const links = []; const byId = new Map(); const linkMap = new Map();
  const keep = n => { const o = prev.get(n.id); if (o) { n.x = o.x; n.y = o.y; n.z = o.z; n.vx = n.vy = n.vz = 0; } else { n.x = n.tgt[0] + (rnd(n.id, 7) - 0.5) * 16; n.y = n.tgt[1] + (rnd(n.id, 8) - 0.5) * 16; n.z = n.tgt[2] + (rnd(n.id, 9) - 0.5) * 16; } nodes.push(n); byId.set(n.id, n); return n; };
  const used = new Set(); for (const e of K.edges) { if (e.live !== false && e.target && ['claim', 'entity', 'classification', 'height_band', 'layer', 'candidate', 'taxonomy'].includes(e.type) || (e.type === 'design' && ['derived', 'candidate'].includes(e.kg_status))) used.add(e.target); if (e.place && e.live !== false && ['claim', 'candidate'].includes(e.type)) used.add(e.place); }
  for (const c of K.kg.nodes) if (c.type === 'concept' && !used.has(c.id) && K.descendants(c.id).some(d => used.has(d))) used.add(c.id);
  // axes
  for (const [id, a] of Object.entries(AX)) if (id !== 'evidence') keep({ id, kind: 'axis', n: K.N.get(id), region: id, tgt: a.anchor, size: 46, base: 0.5, used: true });
  keep({ id: 'region:evidence', kind: 'axis', n: { id: 'region:evidence', label: 'Evidence · Sources & Places', definition: 'The sources, respondents and places behind every claim; the cross-dimensional evidence layer.' }, region: 'evidence', tgt: AX.evidence.anchor, size: 36, base: 0.4, used: true });
  // categories around their axis (a ring tilted toward the centre), facets around their category, concepts around their facet
  const cats = K.kg.nodes.filter(n => n.type === 'category');
  for (const ax of ['axis:x', 'axis:y', 'axis:z']) {
    const mine = cats.filter(c => c.axis === ax).sort((a, b) => (a.order ?? 9) - (b.order ?? 9)); const A = AX[ax].anchor; const toC = [-A[0], -A[1] * 0.3, -A[2]]; const L = Math.hypot(...toC) || 1; const u = toC.map(v => v / L);
    const side = [u[2], 0, -u[0]]; const up = [0, 1, 0];
    mine.forEach((c, i) => { const th = (i / mine.length) * Math.PI * 2 + 0.4; const R = 120; const p = add3(add3(add3(A, side, Math.cos(th) * R), up, Math.sin(th) * R * 0.7), u, 30); keep({ id: c.id, kind: 'cat', n: c, region: ax, tgt: p, size: 24, base: 0.55, used: true }); });
  }
  for (const c of cats.filter(c => !c.axis)) { const i = ['cross:place', 'cross:time', 'cross:evidence', 'cross:media'].indexOf(c.id); const A = AX.evidence.anchor; keep({ id: c.id, kind: 'cat', n: c, region: 'evidence', tgt: [A[0] + Math.cos(i * 1.57) * 110, A[1] + 10, A[2] + Math.sin(i * 1.57) * 110], size: 16, base: 0.4, used: c.id === 'cross:place' || c.id === 'cross:evidence' }); }
  for (const f of K.kg.nodes.filter(n => n.type === 'facet')) { const cat = byId.get(f.category); if (!cat) continue; const sib = K.kg.nodes.filter(n => n.type === 'facet' && n.category === f.category); const i = sib.findIndex(x => x.id === f.id); const d = dir3(f.id); const R = 54 + 8 * (i % 3); const inUse = K.kg.nodes.some(n => n.type === 'concept' && n.facet === f.facet_key && used.has(n.id)); keep({ id: f.id, kind: 'facet', n: f, region: cat.region, tgt: add3(cat.tgt, d, R), size: inUse ? 13 : 8, base: inUse ? 0.5 : 0.22, used: inUse }); }
  const concepts = K.kg.nodes.filter(n => n.type === 'concept');
  const plantsOf = cid => { const fam = new Set(K.descendants(cid)); return new Set(K.edges.filter(e => e.live !== false && fam.has(e.target) && ['claim', 'entity', 'classification', 'height_band', 'layer', 'candidate', 'design'].includes(e.type) && !(e.type === 'design' && e.kg_status === 'unknown')).map(e => e.plant || e.source)); };
  const placesOf = cid => new Set(K.edges.filter(e => e.place === cid && e.live !== false).map(e => e.plant));
  const place = (c, depth = 0) => { if (byId.has(c.id)) return byId.get(c.id); const hp = c.hierarchy_parent; const par = hp && (byId.get(hp) || (K.N.get(hp)?.type === 'concept' ? place(K.N.get(hp), depth + 1) : null)); const anchor = par ? par.tgt : (AX[regionOf(c)] || AX.evidence).anchor; const isUsed = used.has(c.id); const k = isUsed ? (c.facet === 'place' ? placesOf(c.id).size : plantsOf(c.id).size) : 0; const d = dir3(c.id); const R = par && par.kind === 'concept' ? 14 + rnd(c.id, 4) * 10 : (isUsed ? 20 + rnd(c.id, 4) * 22 : 44 + rnd(c.id, 4) * 40); return keep({ id: c.id, kind: 'concept', n: c, region: par ? par.region : regionOf(c), tgt: add3(anchor, d, R), size: isUsed ? 6.5 + 2.6 * k : 2.8, base: isUsed ? 0.9 : 0.22, used: isUsed, k, design: c.dimension === 'design' }); };
  for (const c of concepts) place(c);
  // plants at the centre, cultivars beside them, sources in the evidence region
  K.plants.forEach((p, i) => { const a = i / K.plants.length * Math.PI * 2 + 0.9; keep({ id: p.id, kind: 'plant', n: p, region: 'centre', tgt: [Math.cos(a) * 100, (rnd(p.id, 3) - 0.5) * 70, Math.sin(a) * 100], size: 28, base: 0.95, used: true }); });
  for (const cv of K.kg.nodes.filter(n => n.type === 'cultivar')) { const p = byId.get(cv.plant); keep({ id: cv.id, kind: 'cultivar', n: cv, region: 'centre', tgt: add3(p.tgt, dir3(cv.id), 28), size: 4, base: 0.5, used: true }); links.push({ id: `cv:${cv.id}`, kind: 'cv', source: cv.id, target: cv.plant, edges: [], status: 'documented' }); }
  for (const s of K.kg.nodes.filter(n => (n.type === 'source' || n.type === 'practitioner') && !n.parent)) { const has = K.edges.some(e => e.live !== false && (e.source_id === s.id.split(':')[1])); const A = AX.evidence.anchor; keep({ id: s.id, kind: 'source', n: s, region: 'evidence', tgt: add3(A, dir3(s.id), has ? 60 + rnd(s.id, 4) * 50 : 120 + rnd(s.id, 4) * 60), size: has ? 9 : 4.5, base: has ? 0.75 : 0.2, used: has }); }
  if (S.candidates.length) keep({ id: 'source:candidate', kind: 'source', n: { id: 'source:candidate', label: 'you (candidate)', source_type: 'candidate' }, region: 'evidence', tgt: add3(AX.evidence.anchor, dir3('cand'), 50), size: 9, base: 0.8, used: true });
  // links from the kg edges — every fibre is a real edge (or a bundle of real claim edges)
  const bundle = (key, kind, src, tgt, e, extra = {}) => { if (!byId.has(src) || !byId.has(tgt)) return null; if (!linkMap.has(key)) { const l = { id: key, kind, source: src, target: tgt, edges: [], ...extra }; linkMap.set(key, l); links.push(l); } const l = linkMap.get(key); l.edges.push(e); S.edgeLink.set(e.id, l); return l; };
  S.edgeLink = new Map();
  for (const e of K.edges) {
    if (e.type === 'claim' || e.type === 'entity' || e.type === 'candidate') { if (e.live === false || !e.target) continue; bundle(`${e.plant}→${e.target}`, 'pc', e.plant, e.target, e); if (e.place && byId.has(e.place)) bundle(`${e.plant}→${e.place}`, 'pp', e.plant, e.place, e); if (byId.has(`source:${e.source_id}`)) bundle(`source:${e.source_id}→${e.plant}`, 'sp', `source:${e.source_id}`, e.plant, e); }
    else if (e.type === 'classification') bundle(e.id, 'gf', e.source, e.target, e, { status: 'derived' });
    else if (e.type === 'taxonomy') bundle(e.id, 'tax', e.source, e.target, e, { status: 'documented' });
    else if (e.type === 'height_band') bundle(`${e.plant}→${e.target}`, 'band', e.plant, e.target, e, { status: 'derived' });
    else if (e.type === 'layer') bundle(e.id, 'layer', e.source, e.target, e, { status: 'derived' });
    else if (e.type === 'design') bundle(e.id, 'design', e.source, e.target, e, { status: e.kg_status, hidden: e.kg_status === 'unknown' });
    else if (e.type === 'concept') bundle(e.id, 'cc', e.source, e.target, e, { status: e.kg_status, rel: e.rel });
    else if (e.type === 'hierarchy' || e.type === 'parent') { const faint = !(byId.get(e.source)?.used); bundle(e.id, 'hier', e.source, e.target, e, { status: 'documented', faint }); }
    else if (e.type === 'relation') { if (!e.live && e.kg_status !== 'candidate') continue; bundle(e.id, 'rel', e.source, e.target, e, { status: e.kg_status }); }
  }
  // synapses: one bouton per claim on its plant → concept fibre
  const syn = [];
  for (const l of links) if (l.kind === 'pc') for (const e of l.edges) syn.push({ link: l, t: 0.3 + rnd(e.id, 5) * 0.5, off: dir3(e.id).map(v => v * 4), e, colour: new THREE.Color(e.status === 'verified' ? '#ffffff' : e.type === 'candidate' ? TYPE_COLOUR.candidate : e.source_type === 'entity' ? TYPE_COLOUR.plant : (AX[byId.get(l.target).region] || AX.evidence).colour) });
  S.nodes = nodes; S.links = links; S.syn = syn;
  S.Graph.graphData({ nodes, links });
  S.Graph.d3Force('link').distance(l => ({ pc: 150, pp: 160, gf: 110, tax: 60, band: 150, layer: 150, design: 170, cc: 120, hier: 30, sp: 180, rel: 160, cv: 26 }[l.kind])).strength(l => ({ pc: 0.012, pp: 0.004, gf: 0.03, tax: 0.1, band: 0.01, layer: 0.01, design: 0.01, cc: 0.004, hier: 0.12, sp: 0.004, rel: 0, cv: 0.4 }[l.kind]));
  S.Graph.d3Force('charge').strength(n => n.kind === 'plant' ? -500 : n.kind === 'axis' ? -300 : n.kind === 'cat' ? -140 : n.kind === 'facet' ? -40 : n.kind === 'concept' ? (n.used ? -16 : -5) : n.kind === 'source' ? -24 : -8).distanceMax(220);
  buildSynapses(); rebuildLabels(); renderStats(); renderChips();
}

// ------------------------------------------------------------------ host
function initHost() {
  const Graph = new ForceGraph3D($('#graph'), { controlType: 'orbit' }).backgroundColor('#01020a').showNavInfo(false)
    .nodeThreeObject(nodeObject).nodeThreeObjectExtend(false).nodeLabel(() => '')
    .linkThreeObject(linkObject).linkThreeObjectExtend(false).linkPositionUpdate(linkPositionUpdate)
    .enableNodeDrag(false).warmupTicks(140).cooldownTime(9000).d3AlphaDecay(0.02).d3VelocityDecay(0.3)
    .onNodeClick(n => { S.swallow = true; select(n); })
    .onNodeHover(n => { document.body.style.cursor = n ? 'pointer' : ''; if (n) showTip(n); else hideTip(); })
    .onLinkClick(l => { S.swallow = true; if (!l.hidden || S.mode === 'gaps') select({ kind: 'link', link: l }); })
    .onBackgroundClick(() => { if (S.swallow) { S.swallow = false; return; } clearAll(); });
  Graph.d3Force('home', homeForce());
  const sc = Graph.scene(); sc.fog = new THREE.FogExp2(0x01020a, 0.00095);
  Graph.postProcessingComposer().addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.25, 0.7, 0.12));
  Graph.cameraPosition({ x: 0, y: 120, z: 980 }, { x: 0, y: -10, z: 0 }, 0);
  const ctl = Graph.controls(); ctl.autoRotate = true; ctl.autoRotateSpeed = 0.2; ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.minDistance = 90; ctl.maxDistance = 1800;
  ctl.addEventListener('start', () => { ctl.autoRotate = false; });
  S.Graph = Graph; S.tex = glowTexture(); S.texRing = ringTexture();
  buildNeuropil();
  (function loop() { frame(); requestAnimationFrame(loop); })();
}
function homeForce() { let nodes = []; const f = alpha => { for (const n of nodes) { if (!n.tgt) continue; const k = alpha * ({ plant: 0.5, axis: 0.6, cat: 0.5, facet: 0.4, cultivar: 0.4 }[n.kind] ?? 0.3); n.vx += (n.tgt[0] - n.x) * k; n.vy += (n.tgt[1] - n.y) * k; n.vz += (n.tgt[2] - n.z) * k; } }; f.initialize = ns => { nodes = ns; }; return f; }
function glowTexture() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64); grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.18, 'rgba(255,255,255,0.75)'); grd.addColorStop(0.5, 'rgba(255,255,255,0.16)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
function ringTexture() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 7; g.strokeRect(30, 30, 68, 68); const grd = g.createRadialGradient(64, 64, 10, 64, 64, 64); grd.addColorStop(0, 'rgba(255,255,255,0.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
function mat(col, a, tex) { const m = new THREE.SpriteMaterial({ map: tex || S.tex, color: new THREE.Color(col), transparent: true, opacity: a, depthWrite: false, blending: THREE.AdditiveBlending }); m.userData.base = a; return m; }
function nodeObject(n) {
  const g = new THREE.Group(); const col = colourOfNode(n);
  const halo = new THREE.Sprite(mat(col, n.base, n.kind === 'source' ? S.texRing : S.tex)); halo.scale.set(n.size, n.size, 1); g.add(halo);
  if (n.kind === 'plant') { const core = new THREE.Sprite(mat('#ffffff', 0.9)); core.scale.set(9, 9, 1); g.add(core); }
  if (n.kind === 'axis') { const core = new THREE.Sprite(mat('#ffffff', 0.35)); core.scale.set(10, 10, 1); g.add(core); }
  if (n.kind === 'cat') { const core = new THREE.Sprite(mat('#ffffff', 0.5)); core.scale.set(5, 5, 1); g.add(core); }
  if (n.kind === 'concept' && n.design && n.used) { const core = new THREE.Sprite(mat('#ffffff', 0.6)); core.scale.set(3.5, 3.5, 1); g.add(core); }
  n.__obj = { group: g, halo, mats: [...g.children].map(c => c.material) }; return g;
}
const CURVE_N = 18;
function linkBase(l) {
  const t = S.nodes.find(n => n.id === (l.target.id || l.target)); const reg = t ? (AX[t.region] || AX.evidence).colour : '#8892a8';
  switch (l.kind) {
    case 'pc': { const c = new THREE.Color(reg).lerp(new THREE.Color('#ffffff'), 0.25); const ver = l.edges.filter(e => e.status === 'verified').length / l.edges.length; const cand = l.edges.every(e => e.type === 'candidate'); return { col: cand ? new THREE.Color(ST.observation) : c, a: cand ? 0.6 : 0.14 + 0.3 * ver + 0.03 * Math.min(l.edges.length, 4) }; }
    case 'pp': return { col: new THREE.Color(AX.evidence.colour), a: 0.05 };
    case 'gf': return { col: new THREE.Color(AX['axis:x'].colour), a: 0.5 };
    case 'tax': return { col: new THREE.Color(AX['axis:x'].colour), a: 0.3 };
    case 'band': case 'layer': return { col: new THREE.Color(ST.derived), a: 0.16 };
    case 'design': return { col: new THREE.Color(ST[l.status] || '#888'), a: l.status === 'derived' ? 0.3 : l.status === 'candidate' ? 0.2 : 0.0 };
    case 'cc': return { col: new THREE.Color(l.rel === 'maps_to' ? ST.derived : AX['axis:z'].colour), a: 0.14 };
    case 'hier': return { col: new THREE.Color('#aab4cc'), a: l.faint ? 0.012 : 0.06 };
    case 'sp': { const st = l.edges[0].source_type; return { col: new THREE.Color(TYPE_COLOUR[st] || '#8892a8'), a: 0.06 }; }
    case 'rel': return { col: new THREE.Color(l.status === 'candidate' ? ST.candidate : '#ffffff'), a: l.status === 'candidate' ? 0.08 : 0.2 };
    default: return { col: new THREE.Color(TYPE_COLOUR.plant), a: 0.2 };
  }
}
function linkObject(l) {
  const st = linkBase(l);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CURVE_N * 3), 3)); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(CURVE_N * 3), 3));
  const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: st.a, depthWrite: false, blending: THREE.AdditiveBlending });
  const line = new THREE.Line(geo, m); l.__obj = { line, mat: m, base: st.a, col: st.col, pts: geo.attributes.position.array, cols: geo.attributes.color.array }; paintLink(l, 1); return line;
}
function paintLink(l, f) { const o = l.__obj; if (!o) return; const c = o.col, cols = o.cols; for (let i = 0; i < CURVE_N; i++) { const u = i / (CURVE_N - 1); const k = typeof f === 'function' ? f(u) : f; const w = Math.max(0, k - 1) * 0.6; cols[i * 3] = Math.min(1, c.r * k + w); cols[i * 3 + 1] = Math.min(1, c.g * k + w); cols[i * 3 + 2] = Math.min(1, c.b * k + w); } o.line.geometry.attributes.color.needsUpdate = true; }
function linkPositionUpdate(obj, { start, end }, l) {
  const o = l.__obj; if (!o) return false; const p = o.pts; const tgt = l.target; const len = Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z) || 1; const w = dir3(l.id); let pts;
  const C = (l.kind === 'pc' || l.kind === 'band' || l.kind === 'layer' || l.kind === 'design') && tgt.n?.category && S.centroid[tgt.n.category];
  if (C) {   // a branch: shared stem from the plant toward the target's category, then the twig to the concept
    const G = { x: C.x + (start.x - C.x) * 0.5, y: C.y + (start.y - C.y) * 0.5, z: C.z + (start.z - C.z) * 0.5 }; const wob = len * 0.1;
    const M1 = { x: (start.x + G.x) / 2 + w[0] * wob * 0.5, y: (start.y + G.y) / 2 + w[1] * wob * 0.5, z: (start.z + G.z) / 2 + w[2] * wob * 0.5 }; const M2 = { x: G.x + (G.x - start.x) * 0.25 + w[0] * wob, y: G.y + (G.y - start.y) * 0.25 + w[1] * wob, z: G.z + (G.z - start.z) * 0.25 + w[2] * wob };
    pts = i => { const u = i / (CURVE_N - 1); if (u < 0.45) { const t = u / 0.45, v = 1 - t; return [v * v * start.x + 2 * v * t * M1.x + t * t * G.x, v * v * start.y + 2 * v * t * M1.y + t * t * G.y, v * v * start.z + 2 * v * t * M1.z + t * t * G.z]; } const t = (u - 0.45) / 0.55, v = 1 - t; return [v * v * G.x + 2 * v * t * M2.x + t * t * end.x, v * v * G.y + 2 * v * t * M2.y + t * t * end.y, v * v * G.z + 2 * v * t * M2.z + t * t * end.z]; };
  } else { const wob = len * (l.kind === 'hier' ? 0.04 : 0.16); const M = { x: (start.x + end.x) / 2 + w[0] * wob, y: (start.y + end.y) / 2 + w[1] * wob, z: (start.z + end.z) / 2 + w[2] * wob }; pts = i => { const t = i / (CURVE_N - 1), v = 1 - t; return [v * v * start.x + 2 * v * t * M.x + t * t * end.x, v * v * start.y + 2 * v * t * M.y + t * t * end.y, v * v * start.z + 2 * v * t * M.z + t * t * end.z]; }; }
  const grow = l.born ? Math.min(1, (performance.now() - l.born) / 1400) : 1; let last = null;
  for (let i = 0; i < CURVE_N; i++) { const u = i / (CURVE_N - 1); let q; if (u <= grow || !last) { q = pts(i); last = q; } else q = last; p[i * 3] = q[0]; p[i * 3 + 1] = q[1]; p[i * 3 + 2] = q[2]; }
  o.line.geometry.attributes.position.needsUpdate = true; if (grow >= 1 && l.born && performance.now() - l.born > 1600) delete l.born; return true;
}
function buildSynapses() {
  if (S.synObj) { S.Graph.scene().remove(S.synObj); S.synObj.geometry.dispose(); }
  const n = S.syn.length; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const m = new THREE.PointsMaterial({ size: 8, map: S.tex, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  S.synObj = new THREE.Points(geo, m); S.Graph.scene().add(S.synObj);
}
function updateSynapses(now) {
  if (!S.synObj) return; const pos = S.synObj.geometry.attributes.position.array, col = S.synObj.geometry.attributes.color.array;
  S.syn.forEach((s, i) => { const o = s.link.__obj; if (!o) { pos[i * 3 + 1] = 1e5; return; } const f = s.t * (CURVE_N - 1); const a = Math.floor(f), b = Math.min(CURVE_N - 1, a + 1), r = f - a; const P = o.pts;
    pos[i * 3] = P[a * 3] * (1 - r) + P[b * 3] * r + s.off[0]; pos[i * 3 + 1] = P[a * 3 + 1] * (1 - r) + P[b * 3 + 1] * r + s.off[1]; pos[i * 3 + 2] = P[a * 3 + 2] * (1 - r) + P[b * 3 + 2] * r + s.off[2];
    let k = 0.5; const A = S.actL.get(s.link.id); if (A) { const p = (now - A.t0) / 700; const reached = A.dir > 0 ? p >= s.t : p >= 1 - s.t; k = reached ? 1.6 + 0.3 * Math.sin(now / 160 + i) : 0.12; } else if (S.alive) k = 0.06;
    if (s.e.type === 'candidate') k *= 1.2; col[i * 3] = Math.min(1, s.colour.r * k); col[i * 3 + 1] = Math.min(1, s.colour.g * k); col[i * 3 + 2] = Math.min(1, s.colour.b * k); });
  S.synObj.geometry.attributes.position.needsUpdate = true; S.synObj.geometry.attributes.color.needsUpdate = true;
}
function buildNeuropil() {
  const pts = [], cols = []; const push = (x, y, z, c, k) => { pts.push(x, y, z); cols.push(c.r * k, c.g * k, c.b * k); }; const gauss = (s, i) => (rnd(s, i) + rnd(s, i + 50) + rnd(s, i + 100) - 1.5) * 2;
  for (const [name, a] of Object.entries(AX)) { const col = new THREE.Color(a.colour); const sig = name === 'evidence' ? 70 : 120; for (let i = 0; i < 520; i++) { const s = `${name}:${i}`; push(a.anchor[0] + gauss(s, 1) * sig, a.anchor[1] + gauss(s, 2) * sig * 0.7, a.anchor[2] + gauss(s, 3) * sig, col, 0.14 + rnd(s, 4) * 0.16); } }
  for (const name of Object.keys(AX)) { const col = new THREE.Color(AX[name].colour); const a = AX[name].anchor; for (let i = 0; i < 160; i++) { const s = `path:${name}:${i}`; const t = rnd(s, 1); push(a[0] * t + gauss(s, 2) * 20, a[1] * t + gauss(s, 3) * 20, a[2] * t + gauss(s, 4) * 20, col, 0.07 + rnd(s, 5) * 0.1); } }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  S.neuropil = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2.8, map: S.tex, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); S.Graph.scene().add(S.neuropil);
}

// ------------------------------------------------------------------ activation
function actOf(n, now) { const t0 = S.act.get(n.id); if (t0 === undefined) return 0; const p = (now - t0) / 380; return p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p); }
function adjacency() { const adj = new Map(); for (const l of S.links) { if (l.hidden && S.mode !== 'gaps') continue; const a = l.source.id || l.source, b = l.target.id || l.target; if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []); adj.get(a).push({ l, v: b, dir: 1 }); adj.get(b).push({ l, v: a, dir: -1 }); } return adj; }
function pulse(seeds, hops, allow, keep = false) {
  const now = performance.now(); if (!keep) { S.act.clear(); S.actL.clear(); }
  const adj = adjacency(); const byId = new Map(S.nodes.map(n => [n.id, n])); let frontier = []; const seen = new Map();
  for (const s of seeds) if (byId.has(s)) { S.act.set(s, now); seen.set(s, 0); frontier.push(s); }
  for (let h = 0; h < hops && frontier.length; h++) { const next = []; for (const u of frontier) for (const { l, v, dir } of adj.get(u) || []) { if (seen.has(v) && seen.get(v) <= h) continue; if (allow && !allow(byId.get(u), l, byId.get(v), h)) continue; const jit = rnd(l.id, 11) * 160; if (!S.actL.has(l.id)) S.actL.set(l.id, { t0: now + h * STEP + jit, dir }); if (!seen.has(v)) { seen.set(v, h + 1); S.act.set(v, now + (h + 1) * STEP + jit); next.push(v); } } frontier = next; }
  S.alive = S.act.size > 0; S.dirty = 3; S.Graph.controls().autoRotate = false; renderState();
}
// light the waves an engine traversal returned: wave i's nodes at i·STEP, its edges (scene links) from (i−1)·STEP
function pulseWaves(waves) {
  const now = performance.now(); S.act.clear(); S.actL.clear(); const byId = new Map(S.nodes.map(n => [n.id, n]));
  waves.forEach((w, i) => { for (const id of w.nodes) if (byId.has(id) && !S.act.has(id)) S.act.set(id, now + i * STEP + rnd(id, 13) * 120); for (const e of w.edges) { const l = S.edgeLink.get(e.id) || S.links.find(x => x.id === e.id); if (!l) continue; if (!S.actL.has(l.id)) { const srcLit = S.act.has(l.source.id || l.source); S.actL.set(l.id, { t0: now + Math.max(0, i - 1) * STEP + rnd(l.id, 11) * 160, dir: srcLit ? 1 : -1 }); } for (const id of [l.source.id || l.source, l.target.id || l.target]) if (!S.act.has(id)) S.act.set(id, now + i * STEP + 200); } });
  S.alive = S.act.size > 0; S.dirty = 3; S.Graph.controls().autoRotate = false; renderState();
}
function clearAct() { S.act.clear(); S.actL.clear(); S.alive = false; S.dirty = 3; S.Graph.controls().autoRotate = true; renderState(); }
function lightFrom(n) {
  const K = S.K;
  if (n.kind === 'axis') pulse([n.id], 3, (u, l, v, h) => l.kind === 'hier' && (v.kind === 'cat' || v.kind === 'facet' || (v.kind === 'concept' && v.used)));
  else if (n.kind === 'cat') pulse([n.id], 3, (u, l, v, h) => (l.kind === 'hier' && h < 2 && (v.kind === 'facet' || (v.kind === 'concept' && v.used))) || (h >= 1 && ['pc', 'band', 'layer', 'design', 'gf', 'tax'].includes(l.kind) && v.kind === 'plant'));
  else if (n.kind === 'facet') pulse([n.id], 2, (u, l, v, h) => (l.kind === 'hier' && h === 0 && v.kind === 'concept' && v.used) || (h === 1 && ['pc', 'band', 'layer', 'design', 'gf', 'tax'].includes(l.kind) && v.kind === 'plant'));
  else if (n.kind === 'concept' && n.design) { const fam = new Set(K.descendants(n.id)); pulse([n.id], 3, (u, l, v, h) => h === 0 ? (l.kind === 'cc' || (l.kind === 'design' && !l.hidden) || l.kind === 'layer' || l.kind === 'band' || (l.kind === 'hier' && v.kind === 'concept')) : h === 1 ? ((l.kind === 'pc' && v.kind === 'plant') || (['design', 'layer', 'band'].includes(l.kind) && v.kind === 'plant') || (l.kind === 'cc' && u.kind === 'concept' && !u.design)) : (l.kind === 'sp' || l.kind === 'gf')); }
  else if (n.kind === 'concept') { const fam = new Set(K.descendants(n.id)); pulse([n.id], 3, (u, l, v, h) => l.kind === 'parent' || (l.kind === 'hier' && h === 0 && fam.has(v.id)) ? true : (l.kind === 'pc' || l.kind === 'band' || l.kind === 'gf' || l.kind === 'tax' || l.kind === 'layer') && (u.kind === 'concept' && fam.has(u.id)) && v.kind === 'plant' ? true : h >= 1 && u.kind === 'plant' && (l.kind === 'design' && !l.hidden || l.kind === 'sp' || l.kind === 'gf') ? true : h === 0 && l.kind === 'cc' && v.design ? true : false); }
  else if (n.kind === 'plant') pulse([n.id], 2, (u, l, v, h) => h === 0 ? (l.kind !== 'rel' && !l.hidden && l.kind !== 'hier') : l.kind === 'hier');
  else if (n.kind === 'source') pulse([n.id], 2, (u, l, v, h) => h === 0 ? l.kind === 'sp' : (l.kind === 'pc' && l.edges.some(e => e.source_id === n.id.split(':')[1])));
  else if (n.kind === 'cultivar') pulse([n.id], 1);
}

// ------------------------------------------------------------------ per frame
const _v = new THREE.Vector3();
function frame() {
  const now = performance.now(); const cam = S.Graph.camera(); const w = window.innerWidth, h = window.innerHeight;
  const acc = {}; for (const n of S.nodes) { if (!n.n?.category && n.kind !== 'cat') continue; const c = n.kind === 'cat' ? n.id : n.n.category; if (!c || !Number.isFinite(n.x) || (n.kind === 'concept' && !n.used)) continue; const a = acc[c] || (acc[c] = { x: 0, y: 0, z: 0, k: 0 }); a.x += n.x; a.y += n.y; a.z += n.z; a.k++; }
  for (const [c, a] of Object.entries(acc)) S.centroid[c] = { x: a.x / a.k, y: a.y / a.k, z: a.z / a.k, n: a.k };
  const alive = S.alive; const camDist = cam.position.length();
  for (const n of S.nodes) { const o = n.__obj; if (!o) continue; const a = actOf(n, now); const breathe = 1 + 0.05 * Math.sin(now / 900 + rnd(n.id, 6) * 6.3); const sc = n.size * breathe * (1 + 0.32 * a + (a >= 1 ? 0.06 * Math.sin(now / 220 + rnd(n.id, 6) * 6) : 0)); o.halo.scale.set(sc, sc, 1); const f = alive ? (0.1 + 0.9 * a) : 1; for (const m of o.mats) m.opacity = Math.min(1, m.userData.base * f * (a >= 1 ? 1.25 : 1)); }
  if (alive || S.dirty > 0) { for (const l of S.links) { const o = l.__obj; if (!o) continue; const A = S.actL.get(l.id); if (A) { const p = (now - A.t0) / 700; paintLink(l, u => { const d = (A.dir > 0 ? u : 1 - u) - p; if (p < 0) return 0.25; const win = Math.exp(-(d * 7) * (d * 7)); return (p > 1.25 ? 1.15 : (d < 0 ? 0.95 : 0.2)) + 1.3 * win; }); o.mat.opacity = Math.min(1, Math.max(o.base, 0.25) * 2.4); } else { paintLink(l, alive ? 0.12 : 1); o.mat.opacity = l.hidden ? (S.mode === 'gaps' ? 0.22 : 0) : o.base; } } if (S.dirty > 0) S.dirty--; }
  if (S.neuropil) S.neuropil.material.opacity = alive ? 0.26 : 0.66;
  updateSynapses(now);
  const litCount = alive ? [...S.act.keys()].filter(id => { const n = S.nodes.find(x => x.id === id); return n && (n.kind === 'concept' || n.kind === 'source'); }).length : 0;
  for (const L of S.labels) { const n = L.n; let show = true; if (!Number.isFinite(n.x)) { L.el.classList.add('hidden'); continue; } const a = actOf(n, now);
    if (n.kind === 'concept' || n.kind === 'source' || n.kind === 'cultivar') show = a > 0.6 && (litCount <= 34 || n.k >= 2 || n.design || n.kind === 'source' || S.selected?.id === n.id);
    else if (n.kind === 'facet') show = n.used && (camDist < 620 || a > 0.6 || S.open.has(n.n.category));
    L.el.classList.toggle('muted', alive && a < 0.6 && (n.kind === 'plant' || n.kind === 'axis' || n.kind === 'cat' || n.kind === 'facet'));
    if (!show) { L.el.classList.add('hidden'); continue; }
    _v.set(n.x, n.y - (n.size || 10) * 0.45 - 2, n.z); _v.project(cam); if (_v.z > 1) { L.el.classList.add('hidden'); continue; }
    L.el.classList.remove('hidden'); L.sx = (_v.x + 1) / 2 * w; L.sy = (1 - _v.y) / 2 * h; L.el.style.left = `${L.sx}px`; L.el.style.top = `${L.sy}px`; L.shown = true; }
  const placed = []; for (const L of S.labels.filter(x => x.shown && ['concept', 'source', 'cultivar', 'facet'].includes(x.n.kind)).sort((a, b) => a.sy - b.sy)) { const wpx = L.el.offsetWidth || 60; let y = L.sy; for (const p of placed) if (Math.abs(p.x - L.sx) < (p.w + wpx) / 2 + 4 && y < p.y + 13 && y > p.y - 13) y = p.y + 13; if (y !== L.sy) L.el.style.top = `${y}px`; placed.push({ x: L.sx, y, w: wpx }); }
  for (const L of S.labels) L.shown = false;
}
function rebuildLabels() {
  for (const L of S.labels) L.el.remove(); S.labels = []; const K = S.K;
  const add = (n, html, cls) => { const el = document.createElement('div'); el.className = `lbl ${cls}`; el.innerHTML = html; el.addEventListener('click', e => { e.stopPropagation(); select(n); }); $('#labels').appendChild(el); S.labels.push({ n, el }); };
  for (const n of S.nodes) {
    if (n.kind === 'axis') add(n, `${esc(n.n.label)}<small>${n.id === 'region:evidence' ? `${S.nodes.filter(x => x.kind === 'source' && x.used).length} sources in use` : `${S.nodes.filter(x => x.kind === 'cat' && x.region === n.id).length} categories · ${S.nodes.filter(x => x.kind === 'concept' && x.region === n.id && x.used).length} concepts in use`}</small>`, `axis ${AX[n.region]?.key || 'e'}`);
    else if (n.kind === 'cat') add(n, `${esc(n.n.label)}<small>${n.id === 'cross:evidence' ? `${S.nodes.filter(x => x.kind === 'source' && x.used).length} sources` : n.id === 'cross:media' ? 'schema slot · empty' : `${S.nodes.filter(x => x.kind === 'concept' && x.n.category === n.id && x.used).length}/${S.nodes.filter(x => x.kind === 'concept' && x.n.category === n.id).length}`}</small>`, 'cat');
    else if (n.kind === 'facet') add(n, esc(n.n.label), 'facet');
    else if (n.kind === 'plant') add(n, `${esc(n.n.label)}<small>${esc((n.n.common || [])[0] || '')}${n.n.growth_form ? ` · ${esc(K.label(n.n.growth_form).toLowerCase())}` : ''}</small>`, 'plant');
    else if (n.kind === 'concept') add(n, esc(n.n.label), `lit${n.design ? ' design' : ''}`);
    else if (n.kind === 'source') add(n, esc(n.n.label.length > 24 ? n.n.label.slice(0, 22) + '…' : n.n.label), 'lit source');
    else if (n.kind === 'cultivar') add(n, esc(n.n.label), 'lit');
  }
}

// ------------------------------------------------------------------ tooltip, state, chips
const tip = $('#tip');
function showTip(n) { const K = S.K; let html = '';
  if (n.kind === 'concept') { const o = n.n; const ps = plantsLinked(n.id); html = `<b>${esc(o.label)}</b> <span class="meta">${esc(K.label(o.category || ''))}</span><div class="meta">${ps.size ? `${ps.size} plant${ps.size === 1 ? '' : 's'}` : 'dormant: in the vocabulary, no claim yet'}${o.to_confirm ? ' · term to confirm' : ''}</div>`; }
  else if (n.kind === 'axis' || n.kind === 'cat' || n.kind === 'facet') html = `<b>${esc(n.n.label)}</b><div class="meta">${esc((n.n.definition || '').slice(0, 140))}</div>`;
  else if (n.kind === 'plant') html = `<b><em>${esc(n.n.label)}</em></b><div class="meta">${K.plantEvidenceEdges(n.id).length} evidence links</div>`;
  else if (n.kind === 'source') html = `<b>${esc(n.n.label)}</b><div class="meta">${esc(n.n.source_type || '')}${n.n.geo ? ' · ' + esc(n.n.geo) : ''}</div>`;
  else html = `<b>${esc(n.n.label)}</b>`;
  tip.innerHTML = html; tip.style.display = 'block'; }
function hideTip() { tip.style.display = 'none'; }
document.addEventListener('pointermove', e => { if (tip.style.display !== 'none') { tip.style.left = `${Math.min(window.innerWidth - 320, e.clientX + 14)}px`; tip.style.top = `${e.clientY + 14}px`; } });
const plantsLinked = cid => { const fam = new Set(S.K.descendants(cid)); return new Set(S.K.edges.filter(e => e.live !== false && fam.has(e.target) && ['claim', 'entity', 'classification', 'height_band', 'layer', 'candidate', 'design'].includes(e.type) && !(e.type === 'design' && e.kg_status === 'unknown')).map(e => e.plant || e.source)); };
function renderState() { const el = $('#state'); if (!S.alive) { el.innerHTML = S.candidates.length ? `<span class="cand">${S.candidates.length} candidate observation${S.candidates.length === 1 ? '' : 's'} grown this session</span>` : 'click a region, a concept or a plant · run a path · ask — the signal follows real relations only'; return; }
  const ids = [...S.act.keys()]; const kinds = {}; for (const id of ids) { const n = S.nodes.find(x => x.id === id); if (n) kinds[n.kind] = (kinds[n.kind] || 0) + 1; }
  const claims = [...S.actL.keys()].reduce((a, id) => { const l = S.links.find(x => x.id === id); return a + (l && l.kind === 'pc' ? l.edges.length : 0); }, 0);
  el.innerHTML = `lit: <b>${kinds.concept || 0}</b> concepts · <b>${kinds.plant || 0}</b> plants · <b>${claims}</b> claims on <b>${[...S.actL.keys()].length}</b> fibres · <b>${kinds.source || 0}</b> sources <span class="faint">· Esc clears</span>`; }
function renderStats() { const c = S.K.kg.counts; $('#stats').textContent = `${c.concepts} concepts (${S.nodes.filter(n => n.kind === 'concept' && n.used).length} in use) · ${c.architecture_nodes} architecture nodes · ${c.plants} plants · ${c.claims} claims · ${S.links.filter(l => !l.hidden).length} fibres · ${c.by_status.documented} documented · ${c.by_status.derived} derived · ${c.by_status.candidate} candidate · ${c.by_status.unknown} unknown`; renderState(); }
function renderChips() {
  $('#regions').innerHTML = Object.entries(AX).map(([id, a]) => `<button data-region="${id}"><i class="dot" style="background:${a.colour}"></i>${esc(a.label)}</button>`).join('') + `<button data-mode="gaps" class="warnb">Gaps & conflicts</button>`;
  $('#regions').querySelectorAll('[data-region]').forEach(b => b.addEventListener('click', () => select(S.nodes.find(n => n.id === (b.dataset.region === 'evidence' ? 'region:evidence' : b.dataset.region)))));
  $('#regions').querySelector('[data-mode="gaps"]').addEventListener('click', showGaps);
  $('#paths').innerHTML = [['A', 'Classification', 'growth form → shrub → plants → attributes → evidence'], ['B', 'Design knowledge', 'screen → required traits → plants → conditions'], ['C', 'Knowledge variation', 'salal → height → conditions → claims → sources'], ['D', 'Knowledge gaps', 'scrim → required knowledge → evidence → missing']].map(([k, t, d]) => `<button data-path="${k}" title="${esc(d)}"><b>${k}</b> ${esc(t)}</button>`).join('');
  $('#paths').querySelectorAll('button').forEach(b => b.addEventListener('click', () => runPath(b.dataset.path)));
}

// ------------------------------------------------------------------ selection and cards
const card = $('#card'), CB = $('#card-body');
function openCard(html) { CB.innerHTML = html; card.classList.add('open'); bind(CB); card.scrollTop = 0; }
function closeCard() { card.classList.remove('open'); CB.innerHTML = ''; S.selected = null; }
function clearAll() { closeCard(); clearAct(); S.mode = null; S.open.clear(); $('#regions').querySelectorAll('button').forEach(b => b.classList.remove('on')); $('#paths').querySelectorAll('button').forEach(b => b.classList.remove('on')); }
function focusOn(n, dist) { if (!n || !Number.isFinite(n.x)) return; const cam = S.Graph.camera(); const ctl = S.Graph.controls(); const d = new THREE.Vector3().subVectors(cam.position, ctl.target).normalize(); const D = dist || (n.kind === 'axis' ? 620 : n.kind === 'cat' ? 420 : n.kind === 'plant' ? 480 : 380); S.Graph.cameraPosition({ x: n.x + d.x * D, y: n.y + d.y * D, z: n.z + d.z * D }, { x: n.x, y: n.y, z: n.z }, 1400); }
function select(n) {
  if (!n) return; $('#regions').querySelectorAll('button').forEach(b => b.classList.remove('on')); $('#paths').querySelectorAll('button').forEach(b => b.classList.remove('on')); S.mode = null;
  if (n.kind === 'link') { const l = n.link; S.act.clear(); S.actL.clear(); const now = performance.now(); S.act.set(l.source.id, now); S.act.set(l.target.id, now + STEP); S.actL.set(l.id, { t0: now, dir: 1 }); S.alive = true; S.dirty = 3; renderState(); openCard(cardLink(l)); return; }
  S.selected = n; if (n.kind === 'cat') S.open.add(n.id); if (n.kind === 'facet') S.open.add(n.n.category); lightFrom(n); focusOn(n);
  openCard(n.kind === 'concept' ? (n.design ? cardDesign(n) : cardConcept(n)) : n.kind === 'plant' ? cardPlant(n) : n.kind === 'source' ? cardSource(n) : n.kind === 'cultivar' ? cardPlant(S.nodes.find(x => x.id === n.n.plant)) : cardStructure(n));
}
function bind(root) {
  root.querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); const n = S.nodes.find(x => x.id === el.dataset.id); if (n) select(n); }));
  root.querySelectorAll('[data-edge]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); const l = S.edgeLink.get(el.dataset.edge) || S.links.find(x => x.id === el.dataset.edge); if (l) select({ kind: 'link', link: l }); }));
  root.querySelectorAll('[data-claim]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); const ed = S.K.edges.find(x => x.claim_id === el.dataset.claim && x.target); const l = ed && S.edgeLink.get(ed.id); if (l) select({ kind: 'link', link: l }); }));
  root.querySelectorAll('[data-path]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); runPath(el.dataset.path, el.dataset.arg, el.dataset.arg2); }));
}
const dot = c => `<i class="dot" style="background:${c}"></i>`;
const stTag = s => `<span class="tag ${esc(s)}">${esc(s)}</span>`;
const regionDot = n => dot((AX[n.region] || AX.evidence).colour);
const crumb = id => S.K.hierarchyPath(id).reverse().map(x => `<span class="link" data-id="${esc(x)}">${esc(S.K.label(x))}</span>`).join(' › ');
const edgeVal = e => e.value_label != null ? (Array.isArray(e.value_label) ? e.value_label.join(', ') : e.value_label) : e.numbers ? fmtNum(e.numbers) : S.K.label(e.target);
function evidenceRow(e, withPlant = false) { const K = S.K; const conds = (e.conditions || []).map(c => K.label(c.concept_id)).join(', '); const c = e.claim_id ? K.claimOf(e.claim_id) : null; return `<div class="row" ${e.claim_id ? `data-claim="${esc(e.claim_id)}"` : ''}><i class="st ${esc(e.status || e.verification)}" style="--c:${TYPE_COLOUR[e.source_type] || TYPE_COLOUR.plant}"></i><div>${withPlant ? `<em>${esc(K.label(e.plant))}</em> · ` : ''}<span class="val">${esc(edgeVal(e))}</span>${e.spanned ? ' <span class="faint">(range spans this class)</span>' : ''}${e.cultivar ? ` <span class="muted">‘${esc(e.cultivar)}’</span>` : ''}<br><span class="meta">${esc(K.srcLabel(e.source_id))} · ${esc(e.status || e.verification)}${conds ? ' · under ' + esc(conds) : ''}${e.place ? ' · ' + esc(K.label(e.place)) + (K.PLACE_VAN.has(e.place) ? ' ✓ local' : '') : ''}${c?.source_url ? ` · <a href="${esc(c.source_url)}" target="_blank" rel="noopener">source</a>` : ''}</span></div></div>`; }
const chip = (id, extra = '') => { const n = S.nodes.find(x => x.id === id); if (!n) return ''; const k = n.kind === 'concept' ? plantsLinked(id).size : 0; return `<span class="chip ${n.used === false ? 'dim' : ''}" data-id="${esc(id)}" style="--c:${colourOfNode(n)}">${esc(S.K.label(id))}${k ? `<small>${k}</small>` : ''}${extra}</span>`; };
function cardStructure(n) {
  const K = S.K; const o = n.n; const kids = n.kind === 'axis' ? S.nodes.filter(x => x.kind === 'cat' && x.region === n.id) : n.kind === 'cat' ? S.nodes.filter(x => x.kind === 'facet' && x.n.category === n.id) : S.nodes.filter(x => x.kind === 'concept' && x.n.hierarchy_parent === n.id);
  const used = kids.filter(k => k.used); const dormant = kids.filter(k => !k.used);
  const srcs = n.id === 'region:evidence' ? S.nodes.filter(x => x.kind === 'source' && x.used) : [];
  return `<h2>${regionDot(n)} ${esc(o.label)}</h2><div class="kicker">${n.kind === 'axis' ? 'knowledge axis' : n.kind === 'cat' ? `category · ${o.cross_layer ? 'cross-dimensional layer' : crumb(n.id)}` : `facet · ${crumb(n.id)}`}</div><p class="lead">${esc(o.definition || '')}</p>${o.source_of_term ? `<p class="muted small">source: ${esc(o.source_of_term)}</p>` : ''}
  ${used.length ? `<h3>${n.kind === 'axis' ? 'categories' : n.kind === 'cat' ? 'facets in use' : 'concepts with evidence'} <span class="faint">${used.length}</span></h3><div class="chips">${used.map(k => chip(k.id, k.kind === 'concept' ? '' : `<small>${S.nodes.filter(x => x.kind === 'concept' && (k.kind === 'facet' ? x.n.hierarchy_parent === k.id || x.n.facet === k.n.facet_key : x.n.category === k.id) && x.used).length}</small>`)).join('')}</div>` : ''}
  ${srcs.length ? `<h3>sources</h3><div class="chips">${srcs.map(s => chip(s.id)).join('')}</div>` : ''}
  ${dormant.length ? `<details><summary>dormant vocabulary · ${dormant.length}</summary><div class="chips">${dormant.slice(0, 60).map(k => chip(k.id)).join('')}</div></details>` : ''}
  <p class="muted small">Lit: the hierarchy beneath this node and, one hop further, the plants it reaches through real claims.</p>`;
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
  const K = S.K; $('#paths').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.path === which)); $('#regions').querySelectorAll('button').forEach(b => b.classList.remove('on')); S.mode = null;
  const r = which === 'A' ? K.pathA(arg || 'growth_form:shrub') : which === 'B' ? K.pathB(arg || 'spatial:screen') : which === 'C' ? K.pathC(arg || 'plant:gaultheria-shallon', arg2 || 'height_class') : K.pathD(arg || 'spatial:scrim');
  if (which === 'D') S.mode = 'gaps';
  pulseWaves(r.waves); const seed = S.nodes.find(n => n.id === r.seed); focusOn(seed, 560);
  const trail = `<div class="trail">${r.waves.map((w, i) => `<span class="w" style="animation-delay:${i * STEP}ms">${String(i + 1).padStart(2, '0')} ${esc(w.step)} <small>${w.nodes.length}</small></span>`).join('')}</div>`;
  let body = '';
  if (which === 'A') body = `<p class="lead">Hierarchy: ${crumb(r.seed)}</p>${r.classification.map(e => `<div class="row" data-edge="${esc(e.id)}"><i class="st ${esc(e.verification)}" style="--c:${AX['axis:x'].colour}"></i><div><em class="val">${esc(K.label(e.source))}</em> ${stTag(e.verification)} ${stTag('derived')}<br><span class="meta">${esc(e.text)}</span></div></div>`).join('')}${Object.entries(r.attributes).map(([p, cats]) => `<h3><em>${esc(K.label(p))}</em> · attributes by category</h3>${Object.entries(cats).map(([c, es]) => `<div class="small"><b>${esc(K.label(c))}</b> <span class="faint">${new Set(es.map(e => e.target)).size} concepts · ${new Set(es.map(e => e.claim_id)).size} claims</span><div class="chips">${[...new Set(es.map(e => e.target))].slice(0, 10).map(id => chip(id)).join('')}</div></div>`).join('')}<details><summary>evidence in R5 order · ${r.evidence[p].length} claims</summary>${r.evidence[p].slice(0, 20).map(c => `<div class="r" data-claim="${esc(c.id)}">${esc(K.attribute(c))}<div class="why">${esc(c.field.replace(/_/g, ' '))} · ${esc(c.status)} · ${esc(K.conds(c))}${K.citable(c) ? '' : ' · L0 withheld'}</div></div>`).join('')}</details>`).join('')}`;
  else if (which === 'B') body = `<p class="lead">${esc(r.node.definition)}</p><p class="muted small">${esc(r.node.source_of_term)}${r.node.to_confirm ? ' · <span class="warn">term to confirm</span>' : ''}</p><h3>required traits</h3>${r.requirements.map(q => `<div class="row" data-edge="${esc(q.id)}"><i class="st documented" style="--c:${AX['axis:y'].colour}"></i><div><span class="val">${esc(q.strength)}: ${(q.alternatives || [q.target]).map(a => chip(a)).join(' or ')}</span><br><span class="meta">${esc(q.basis?.source || '')}${q.to_confirm ? ' · to confirm' : ''}</span></div></div>`).join('')}${r.uses.length ? `<p class="muted small">KPU uses that name it: ${r.uses.map(u => chip(u.source)).join(' ')}</p>` : ''}<h3>relevant plants</h3>${r.plants.map(p => `<div class="row" data-edge="${esc(p.edge.id)}"><i class="st ${esc(p.kg_status)}" style="--c:${ST[p.kg_status]}"></i><div><em class="val">${esc(K.label(p.plant))}</em> ${stTag(p.kg_status)} <span class="meta">${esc(p.verdict)}</span><br><span class="meta">${esc(p.edge.text)}</span>${p.checks.filter(c => c.evidence.length).map(c => `<div class="meta">· ${esc(c.alternatives.map(K.label).join(' or '))}: ${c.evidence.slice(0, 3).map(ev => `${esc(K.srcLabel(ev.source_id || 'entity'))}${(ev.conditions || []).length ? ' (under ' + esc(ev.conditions.map(x => K.label(x.concept_id).toLowerCase()).join(', ')) + ')' : ''}`).join(', ')}${c.evidence.length > 3 ? ` +${c.evidence.length - 3}` : ''}</div>`).join('')}${p.missing.length ? `<div class="meta warn">missing: ${esc(p.missing.map(m => m.alternatives.map(K.label).join(' or ') + ` (${m.result})`).join('; '))}</div>` : ''}</div></div>`).join('') || '<p class="warn">no plant linked</p>'}`;
  else if (which === 'C') body = `<p class="lead">${r.claims.length} live claims from ${new Set(r.claims.map(c => c.source_id)).size} sources · ${esc(r.reading)}</p>${r.groups.map(g => `<h3>${esc(g.cultivar)} · ${esc(g.conditions)}</h3>${g.claims.map(c => `<div class="r" data-claim="${esc(c.id)}">${esc(K.attribute(c))}<div class="why">${esc((c.concepts || []).filter(x => K.N.get(x)?.facet === r.facet).map(K.label).join(', '))} · ${c.place ? esc(K.label(c.place)) : '—'}${K.PLACE_VAN.has(c.place) ? ' ✓ local' : ''}</div></div>`).join('')}`).join('')}${r.variation.map(v => `<p class="small">↔ ${esc(v.text)}</p>`).join('')}${r.disagreement.map(d => `<p class="small">≠ ${esc(d.text)}</p>`).join('')}`;
  else body = `<p class="lead">${esc(r.node.definition)}</p>${r.node.to_confirm ? '<p class="warn small">The term itself is from the brief and not yet found in the literature — to confirm.</p>' : ''}<h3>required knowledge</h3>${r.requirements.map(q => `<div class="row" data-edge="${esc(q.id)}"><i class="st documented" style="--c:${AX['axis:y'].colour}"></i><div><span class="val">${esc(q.strength)}: ${(q.alternatives || [q.target]).map(a => chip(a)).join(' or ')}</span><br><span class="meta">${esc(q.basis?.source || '')}${q.to_confirm ? ' · to confirm' : ''}</span></div></div>`).join('')}<h3>existing evidence</h3>${r.plants.map(p => `<div class="row" data-edge="${esc(p.edge.id)}"><i class="st ${esc(p.kg_status)}" style="--c:${ST[p.kg_status]}"></i><div><em class="val">${esc(K.label(p.plant))}</em> ${stTag(p.kg_status)} <span class="meta">${esc(p.verdict)} · met: ${esc(p.checks.filter(c => c.result === 'met').map(c => c.alternatives.map(K.label).join(' or ')).join('; ') || 'none')}</span></div></div>`).join('')}<h3 class="warn">missing relationships · ${r.missing.length}</h3>${r.missing.map(m => `<div class="r"><em>${esc(K.label(m.plant))}</em> needs ${esc(m.requirement)} <span class="faint">(${esc(m.strength)})</span>: <b>${esc(m.result)}</b><div class="why">${esc(m.why)}</div></div>`).join('')}${r.noPlant ? '<p class="warn small">No source links any plant to this concept; every link shown is a rule-based candidate or unknown.</p>' : ''}${r.toConfirm.length ? `<p class="muted small">${r.toConfirm.length} literature relation(s) await page-level confirmation.</p>` : ''}`;
  openCard(`<h2>Path ${which} · ${esc(r.title.split(': ')[0])}</h2><div class="kicker">${esc(r.title.split(': ').slice(1).join(': '))} · a traversal of kg.json, lit wave by wave</div>${trail}${body}`);
}

// ------------------------------------------------------------------ gaps & conflicts
function showGaps() {
  const K = S.K; S.mode = 'gaps'; $('#regions').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.mode === 'gaps')); const g = K.kg.gaps, c = K.kg.conflicts;
  const unknownLinks = S.links.filter(l => l.kind === 'design' && l.hidden); const dis = S.diag.disagreement, vari = S.diag.variation;
  const now = performance.now(); S.act.clear(); S.actL.clear();
  for (const l of unknownLinks) { S.actL.set(l.id, { t0: now, dir: 1 }); S.act.set(l.source.id, now); S.act.set(l.target.id, now + STEP); }
  for (const d of [...dis, ...vari]) for (const cid of d.claims) { const e = K.edges.find(x => x.claim_id === cid && x.target && x.facet === d.facet); const l = e && S.edgeLink.get(e.id); if (l) { S.actL.set(l.id, { t0: now + STEP, dir: 1 }); S.act.set(l.source.id, now); S.act.set(l.target.id, now + 2 * STEP); } }
  for (const z of g.design_concepts_without_plants) S.act.set(z.concept, now + STEP);
  for (const gg of g.gate_facet_missing) { S.act.set(gg.plant, now); S.act.set(`facet:${gg.facet}`, now + STEP); }
  S.alive = true; S.dirty = 3; S.Graph.controls().autoRotate = false; renderState();
  openCard(`<h2>${dot(ST.unknown)} Knowledge gaps & conflicts</h2><div class="kicker">what is missing, unknown, contradicted or conditional — never shown as fact</div>
  <h3>design links without evidence · ${g.design_unknown.length + g.design_contradicted.length}</h3>${[...g.design_contradicted, ...g.design_unknown].map(x => `<div class="row" data-edge="design:${esc(x.plant)}:${esc(x.concept)}"><i class="st unknown" style="--c:${ST.unknown}"></i><div><em class="val">${esc(K.label(x.plant))}</em> ↔ ${esc(K.label(x.concept))}<br><span class="meta">${esc(x.text)}</span></div></div>`).join('')}
  <h3>design concepts no plant reaches · ${g.design_concepts_without_plants.length}</h3><div class="chips">${g.design_concepts_without_plants.map(x => chip(x.concept)).join('')}</div>
  <h3>gate facets without a claim · ${g.gate_facet_missing.length}</h3>${g.gate_facet_missing.map(x => `<div class="row" data-id="${esc(x.plant)}"><i class="st unknown" style="--c:${ST.unknown}"></i><div><span class="meta">${esc(x.text)}</span></div></div>`).join('')}
  <h3>sources disagree · ${dis.length}</h3>${dis.map(x => `<div class="row" data-claim="${esc(x.claims[0])}"><i class="st unknown" style="--c:${ST.conflict}"></i><div><span class="meta">≠ ${esc(x.text)}</span></div></div>`).join('')}
  <h3>values depend on conditions · ${vari.length}</h3>${vari.map(x => `<div class="row" data-claim="${esc(x.claims[0])}"><i class="st candidate" style="--c:${ST.candidate}"></i><div><span class="meta">↔ ${esc(x.text)}</span></div></div>`).join('')}
  <h3>shared concepts, no relation · ${g.shared_concepts_no_relation.length}</h3>${g.shared_concepts_no_relation.map(x => `<p class="meta">${esc(x.text)}</p>`).join('')}
  <p class="muted small">${g.single_source_links} plant–concept links rest on one source · ${g.relations_to_confirm.length} literature relations await page-level confirmation · ${g.model_placeholders.length} model placeholder relations remain candidates.</p>`);
}

// ------------------------------------------------------------------ Ask: graph retrieval (kg engine), lit wave by wave
function runQuery(q) {
  if (!q.trim()) return; const K = S.K; const r = K.ask(q); $('#regions').querySelectorAll('button').forEach(b => b.classList.remove('on')); $('#paths').querySelectorAll('button').forEach(b => b.classList.remove('on')); S.mode = null;
  pulseWaves(r.waves);
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
  const oldLinks = new Set(S.links.map(l => l.id)); buildGraph(); const P = `plant:${pid}`; const born = performance.now();
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
  focusOn(S.nodes.find(x => x.id === P));
  openCard(`${growForm()}<div class="changed"><h3>What grew</h3><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul><p><button data-id="${P}">show the plant</button></p></div>`); wireGrow(); renderStats();
}
function resetCandidates() { S.candidates = []; saveCandidates(); S.K.removeCandidates(); S.diag = S.K.db.diagnosis; buildGraph(); clearAll(); openCard(growForm()); wireGrow(); }
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
function initUi() {
  $('#ask-run').addEventListener('click', () => runQuery($('#ask-input').value)); $('#ask-input').addEventListener('keydown', e => { if (e.key === 'Enter') runQuery($('#ask-input').value); });
  $('#btn-grow').addEventListener('click', () => { openCard(growForm()); wireGrow(); });
  $('#card-close').addEventListener('click', clearAll);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') clearAll(); });
  $('#legend').innerHTML = `<span><i style="background:${TYPE_COLOUR.plant}"></i>plant</span><span><i style="background:#fff"></i>verified</span><span><i style="background:${AX['axis:y'].colour}"></i>unverified · region colour</span><span><i class="ln" style="background:${ST.derived}"></i>derived (rule)</span><span><i class="ln" style="background:${ST.candidate}"></i>candidate (inferred)</span><span><i style="background:${ST.observation}"></i>observation</span><span><i class="ln" style="background:${ST.unknown}"></i>unknown / conflict</span>`;
}
window.brain = { S, select, pulse, pulseWaves, clearAll, runQuery, runPath, showGaps, addCandidate, resetCandidates, detect, AX };
