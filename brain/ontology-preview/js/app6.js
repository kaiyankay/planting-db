// Neural Knowledge Brain — plant-centred knowledge network (v7, brief 2026-11-02 "Scalable Knowledge Network Revision").
// The same data (brain/data/kg.json from tools/build_kg.py, ontology.json, plants/*.json) and the same engine (js/kg.js),
// drawn as a simple network of spheres and lines that opens from the plants:
//   overview   growth forms (Tree, Shrub, Graminoid …) and the plants read as each form — nothing else
//   plant      opens its knowledge areas (Classification · Environmental Conditions · Morphology & Growth · Ecological
//              Performance · Planting Design Functions · Plant-to-Plant Relationships · Evidence & Sources — defined in
//              ontology.json `knowledge_areas`, not here); an area opens the knowledge nodes behind it
//   concept    opens every plant linked to it (an indirect connection between plants) and its own relations
//   line       the evidence trace: relation type, status, claims, sources, conditions, verification
// Layout is force-directed from the real links (no fixed regions); unexplored knowledge is hidden, not removed.
// Nothing here names a plant, a growth form or a category: all of it is read from kg.json, so a plant added to the
// database appears after `python3 -I tools/pipeline.py`.
import * as THREE from 'three';
import { loadAll } from './kg.js';
import { index as indexGraph, conceptsInText, classesFor, candidateEdges } from '../../js/graph.js';
import { diagnose, fmtNum, interval } from '../../js/diagnosis.js';
import { TYPE_COLOUR } from '../../js/model.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const LS_KEY = 'brain.candidates.v6';
const STEP = 520;
const AREA_COLOUR = { classification: '#f6d365', environment: '#7cc4ff', morphology_growth: '#c9b8ff', ecology: '#8fe3c0', design: '#6ff2b0', relations: '#ffd27a', evidence: '#ff9e6b' };
const ST = { documented: '#ffffff', derived: '#c9b8ff', candidate: '#ffd27a', unknown: '#ff6b6b', observation: TYPE_COLOUR.candidate, conflict: '#ff6b6b' };
const S = { dirty: 3, K: null, G: null, Graph: null, reg: new Map(), nodes: [], links: [], visible: new Set(), expanded: new Set(), history: [], trail: [], act: new Map(), actL: new Map(), alive: false, labels: [], selected: null, focus: null, candidates: [], diag: null, edgeLink: new Map() };
const ALL = () => [...S.reg.values()];
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
const rnd = (s, i) => hash(`${s}#${i}`);

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
const areaColour = a => AREA_COLOUR[a] || '#9aa6c2';
const colourOfNode = n => n.kind === 'plant' || n.kind === 'cultivar' ? TYPE_COLOUR.plant : n.kind === 'gf' ? AREA_COLOUR.classification : n.kind === 'source' ? (TYPE_COLOUR[n.n.source_type] || '#8892a8') : areaColour(n.area);
const plantsLinked = cid => new Set(S.reg.get(cid)?.n?.plants || []);
const isKnowledge = e => e.live !== false && e.target && (['claim', 'entity', 'classification', 'height_band', 'layer', 'taxonomy', 'candidate'].includes(e.type) || (e.type === 'design' && ['derived', 'candidate'].includes(e.kg_status)));
const plantOf = e => e.plant || e.source;

// ------------------------------------------------------------------ registry: growth forms, plants, cultivars, knowledge-area satellites, concepts, sources
function buildRegistry() {
  const K = S.K; const reg = S.reg; const prev = new Map(reg); reg.clear();
  const put = n => { const o = prev.get(n.id); if (o) { n.x = o.x; n.y = o.y; n.z = o.z; n.vx = n.vy = n.vz = 0; } reg.set(n.id, n); return n; };
  const AREAS = Object.entries(K.areas).sort((a, b) => (a[1].order || 9) - (b[1].order || 9));
  const used = new Set(); for (const e of K.edges) { if (isKnowledge(e)) used.add(e.target); if (e.place && e.live !== false && ['claim', 'candidate'].includes(e.type)) used.add(e.place); }
  for (const c of K.kg.nodes) if (c.type === 'concept' && !used.has(c.id) && K.descendants(c.id).some(d => used.has(d))) used.add(c.id);
  for (const g of K.kg.nodes.filter(n => n.facet === 'growth_form')) { const ps = K.edges.filter(e => e.type === 'classification' && e.target === g.id).map(e => e.source); put({ id: g.id, kind: 'gf', n: g, area: 'classification', plants: ps, used: ps.length > 0, size: ps.length ? 7 + Math.min(6, ps.length) * 0.8 : 4 }); }
  for (const p of K.plants) put({ id: p.id, kind: 'plant', n: p, size: 7.5, used: true, gf: p.growth_form || null });
  for (const cv of K.kg.nodes.filter(n => n.type === 'cultivar')) put({ id: cv.id, kind: 'cultivar', n: cv, parent: cv.plant, size: 2.4, used: true });
  for (const p of K.plants) for (const [a, d] of AREAS) { const pa = K.plantAreas(p.id)[a]; const pairs = a === 'relations' ? K.pairsOf(p.id).filter(x => x.n_shared || x.direct_relations.length) : []; const count = a === 'relations' ? pairs.length : a === 'evidence' ? (pa?.sources?.length || 0) + (pa?.concepts?.length || 0) : (pa?.concepts?.length || 0); if (!count) continue; put({ id: `sat:${p.id}:${a}`, kind: 'sat', n: { id: `sat:${p.id}:${a}`, label: d.label, definition: d.definition, area: a }, area: a, parent: p.id, plant: p.id, count, summary: pa, size: 3.2 + Math.min(count, 30) * 0.08, used: true }); }
  for (const c of K.kg.nodes.filter(n => n.type === 'concept' && n.facet !== 'growth_form')) { const isUsed = used.has(c.id); const k = (c.plants || []).length; put({ id: c.id, kind: 'concept', n: c, area: c.area || (c.facet === 'growth_form' ? 'classification' : 'evidence'), size: (c.dimension === 'design' ? 3.6 : 3) + 0.35 * k, used: isUsed, k, design: c.dimension === 'design' }); }
  for (const s of K.kg.nodes.filter(n => (n.type === 'source' || n.type === 'practitioner') && !n.parent)) { const has = K.edges.some(e => e.live !== false && e.source_id === s.id.split(':')[1]); put({ id: s.id, kind: 'source', n: s, area: 'evidence', size: has ? 3.8 : 2.4, used: has }); }
  if (S.candidates.length) put({ id: 'source:candidate', kind: 'source', n: { id: 'source:candidate', label: 'you (candidate)', source_type: 'candidate' }, area: 'evidence', size: 3.8, used: true });
  for (const n of reg.values()) n.children = [];
  for (const n of reg.values()) if (n.parent && reg.has(n.parent)) reg.get(n.parent).children.push(n);
}
const satOf = (pid, area) => S.reg.get(`sat:${pid}:${area}`);

// ------------------------------------------------------------------ visibility: what is shown is what has been explored
function rebuild(reheat = true) {
  const K = S.K; const vis = S.visible; const nodes = ALL().filter(n => vis.has(n.id)); const links = []; const map = new Map(); S.edgeLink = new Map();
  const end = (pid, area) => { const s = satOf(pid, area); return s && vis.has(s.id) ? s.id : pid; };   // a plant's line leaves from its area satellite when that is open
  const bundle = (key, kind, a, b, e, extra = {}) => { if (!vis.has(a) || !vis.has(b) || a === b) return; if (!map.has(key)) { const l = { id: key, kind, source: a, target: b, edges: [], ...extra }; map.set(key, l); links.push(l); } const l = map.get(key); l.edges.push(e); S.edgeLink.set(e.id, l); };
  for (const n of nodes) { if (n.kind === 'sat' && vis.has(n.parent)) links.push({ id: `h:${n.id}`, kind: 'sat', source: n.parent, target: n.id, edges: [], status: 'documented', area: n.area }); if (n.kind === 'cultivar' && vis.has(n.parent)) links.push({ id: `h:${n.id}`, kind: 'cv', source: n.id, target: n.parent, edges: [], status: 'documented' }); }
  for (const e of K.edges) {
    const t = e.target; if (!t) continue; const area = K.areaOfConcept(t) || 'evidence';
    if (e.type === 'claim' || e.type === 'entity' || e.type === 'candidate') { if (e.live === false) continue; bundle(`${e.plant}→${t}`, 'pc', end(e.plant, area), t, e, { area }); if (e.place) bundle(`${e.plant}→${e.place}`, 'pp', end(e.plant, 'evidence'), e.place, e, { area: 'evidence' }); bundle(`source:${e.source_id}→${e.plant}`, 'sp', `source:${e.source_id}`, end(e.plant, 'evidence'), e); }
    else if (e.type === 'classification') bundle(e.id, 'gf', e.source, t, e, { status: 'derived' });
    else if (e.type === 'taxonomy') bundle(e.id, 'tax', e.source.startsWith('plant:') ? end(e.source, 'classification') : e.source, t, e, { status: 'documented', area: 'classification' });
    else if (e.type === 'height_band') bundle(`${e.plant}→${t}`, 'band', end(e.plant, 'design'), t, e, { status: 'derived', area: 'design' });
    else if (e.type === 'layer') bundle(e.id, 'layer', end(e.source, 'design'), t, e, { status: 'derived', area: 'design' });
    else if (e.type === 'design') { if (e.kg_status === 'unknown') continue; bundle(e.id, 'design', end(e.source, 'design'), t, e, { status: e.kg_status, area: 'design' }); }
    else if (e.type === 'concept') bundle(e.id, 'cc', e.source, t, e, { status: e.kg_status, rel: e.rel });
    else if (e.type === 'parent') bundle(e.id, 'grp', e.source, t, e, { status: 'documented' });
    else if (e.type === 'relation') { if (!e.live && e.kg_status !== 'candidate') continue; if (e.kg_status === 'candidate' && !S.expanded.has(e.source) && !S.expanded.has(e.target)) continue; bundle(e.id, 'rel', end(e.source, 'relations'), end(e.target, 'relations'), e, { status: e.kg_status }); }
  }
  for (const l of links) { l.source = S.reg.get(l.source); l.target = S.reg.get(l.target); }
  S.nodes = nodes; S.links = links; S.dirty = 6;
  S.Graph.graphData({ nodes, links });
  if (reheat) S.Graph.d3ReheatSimulation();
  rebuildLabels(); renderStats(); renderCrumb();
}
function spawnAt(ids, origin) { const o = S.reg.get(origin); for (const id of ids) { const n = S.reg.get(id); if (!n || Number.isFinite(n.x)) continue; const d = [rnd(id, 1) - 0.5, rnd(id, 2) - 0.5, rnd(id, 3) - 0.5]; if (o && Number.isFinite(o.x)) { n.x = o.x + d[0] * 40; n.y = o.y + d[1] * 40; n.z = o.z + d[2] * 40; } else { n.x = d[0] * 300; n.y = d[1] * 300; n.z = d[2] * 300; } } }
function show(ids, origin) { let changed = false; for (const id of ids) { if (!S.reg.has(id) || S.visible.has(id)) continue; S.visible.add(id); changed = true; const n = S.reg.get(id); if (n.parent && !S.visible.has(n.parent)) { S.visible.add(n.parent); } } spawnAt(ids, origin); return changed; }
function hideSubtree(id) { const n = S.reg.get(id); if (!n) return; for (const k of n.children) if (S.visible.has(k.id)) { S.visible.delete(k.id); hideSubtree(k.id); } S.expanded.delete(id); }
function snapshot() { S.history.push({ visible: new Set(S.visible), expanded: new Set(S.expanded), selected: S.selected?.id || null, trail: S.trail.slice() }); if (S.history.length > 60) S.history.shift(); }
function overview(animate = true) {
  S.visible = new Set(); S.expanded = new Set(); S.history = []; S.trail = []; S.selected = null; S.focus = null; clearAct(); closeCard();
  for (const n of ALL()) if (n.kind === 'gf' || n.kind === 'plant') S.visible.add(n.id);
  spawnAt([...S.visible], null); rebuild();
  const n = S.nodes.length; const asp = window.innerWidth / window.innerHeight; const D = (420 + 26 * Math.sqrt(n) * 4) * Math.max(1, 1.4 / asp);
  S.Graph.cameraPosition({ x: 0, y: D * 0.15, z: D }, { x: 0, y: 0, z: 0 }, animate ? 1200 : 0);
}
function back() { const h = S.history.pop(); if (!h) { overview(); return; } S.visible = h.visible; S.expanded = h.expanded; S.trail = h.trail; clearAct(); rebuild(); const n = h.selected && S.reg.get(h.selected); if (n && S.visible.has(n.id)) { S.selected = n; S.focus = focusSet(n); openCard(cardFor(n)); } else { S.selected = null; S.focus = null; closeCard(); } renderCrumb(); }

// what a click reveals, by kind — only what a kg.json edge joins to it
function revealFor(n) {
  const K = S.K; const out = new Set();
  if (n.kind === 'gf') { for (const p of n.plants) out.add(p); }
  else if (n.kind === 'plant') { for (const k of n.children) out.add(k.id); }
  else if (n.kind === 'sat') {
    const pid = n.plant; const a = n.area;
    if (a === 'relations') { for (const e of K.edges) if (e.type === 'relation' && (e.source === pid || e.target === pid) && (e.live || e.kg_status === 'candidate')) out.add(e.source === pid ? e.target : e.source); }
    else if (a === 'evidence') { for (const s of n.summary?.sources || []) out.add(`source:${s}`); for (const c of n.summary?.concepts || []) out.add(c); }
    else for (const e of K.edges) if (isKnowledge(e) && plantOf(e) === pid && (K.areaOfConcept(e.target) || 'evidence') === a) out.add(e.target);
  }
  else if (n.kind === 'concept') {
    for (const p of n.n.plants || []) out.add(p);
    for (const e of K.edges) {
      if (e.type === 'concept' && (e.source === n.id || e.target === n.id || (e.alternatives || []).includes(n.id))) { out.add(e.source); out.add(e.target); for (const alt of e.alternatives || []) if (e.source === n.id) out.add(alt); }
      if (e.type === 'parent' && (e.source === n.id || e.target === n.id) && S.reg.get(e.source === n.id ? e.target : e.source)?.used) { out.add(e.source); out.add(e.target); }
      if ((e.type === 'layer' || e.type === 'classification') && (e.target === n.id)) out.add(e.source);
    }
  }
  else if (n.kind === 'source') { for (const e of K.edges) if (e.source_id === n.id.split(':')[1] && e.live !== false && e.plant) out.add(e.plant); }
  out.delete(n.id); return [...out].filter(id => S.reg.has(id));
}
function expandNode(n) {
  const already = S.expanded.has(n.id); snapshot();
  if (already && (n.kind === 'plant' || n.kind === 'sat')) { hideSubtree(n.id); if (n.kind === 'sat') for (const id of revealFor(n)) if (!stillNeeded(id, n.id)) S.visible.delete(id); rebuild(); return []; }
  const ids = revealFor(n); show(ids, n.id); S.expanded.add(n.id); rebuild(); return ids;
}
// a concept stays visible when another open satellite or an expanded node still reaches it
function stillNeeded(id, closing) { for (const x of S.expanded) { if (x === closing) continue; const m = S.reg.get(x); if (m && revealFor(m).includes(id)) return true; } return false; }
function focusSet(n) { const f = new Set([n.id]); for (const l of S.links) { const a = l.source.id, b = l.target.id; if (a === n.id) f.add(b); if (b === n.id) f.add(a); } if (n.parent) f.add(n.parent); return f; }
// the knowledge two plants share: reveal the shared concepts (and both plants' satellites for their areas)
function revealShared(a, b, area) {
  const K = S.K; const pair = K.pairsOf(a).find(p => p.plants.includes(b)); if (!pair) return; snapshot();
  const areas = area ? [area] : []; const shared = areas.flatMap(x => pair.shared_by_area[x] || []);
  const sats = []; for (const x of areas) for (const pid of [a, b]) { const s = satOf(pid, x); if (s) sats.push(s.id); }
  for (const pid of [a, b]) { const s = satOf(pid, 'relations'); if (s) { sats.push(s.id); S.expanded.add(s.id); } }
  show([a, b, ...sats], a); for (const s of sats) S.expanded.add(s); show(shared, a); rebuild();
  const now = performance.now(); S.act.clear(); S.actL.clear(); S.act.set(a, now); S.act.set(b, now);
  for (const c of shared) { S.act.set(c, now + STEP); for (const l of S.links) if (l.target.id === c && [a, b].includes(l.source.plant || l.source.id)) S.actL.set(l.id, { t0: now + rnd(l.id, 11) * 200, dir: 1 }); }
  for (const l of S.links) if (l.kind === 'rel' && [a, b].includes(l.source.plant || l.source.id) && [a, b].includes(l.target.plant || l.target.id)) S.actL.set(l.id, { t0: now, dir: 1 });
  S.alive = true; S.aliveUntil = now + 3 * STEP + 1400; S.selected = S.reg.get(a); S.focus = new Set([a, b, ...shared, ...sats]); S.trail.push(b); renderState();
  openCard(cardPair(pair, area)); renderCrumb(); rebuildLabels();
}

// ------------------------------------------------------------------ host: spheres, thin lines, a force layout that settles and stops
function initHost() {
  const Graph = new ForceGraph3D($('#graph'), { controlType: 'orbit' }).backgroundColor('#04060f').showNavInfo(false)
    .nodeThreeObject(nodeObject).nodeThreeObjectExtend(false).nodeLabel(() => '')
    .linkThreeObject(linkObject).linkThreeObjectExtend(false).linkPositionUpdate(linkPositionUpdate)
    .enableNodeDrag(false).cooldownTicks(160).warmupTicks(0).d3AlphaDecay(0.035).d3VelocityDecay(0.35)
    .onNodeClick(n => { S.swallow = true; select(n); })
    .onNodeHover(n => { document.body.style.cursor = n ? 'pointer' : ''; hover(n); })
    .onLinkClick(l => { S.swallow = true; selectLink(l); })
    .onBackgroundClick(() => { if (S.swallow) { S.swallow = false; return; } deselect(); });
  Graph.d3Force('link').distance(l => ({ gf: 120, sat: 48, cv: 26, pc: 62, pp: 70, sp: 80, tax: 50, band: 60, layer: 60, design: 70, cc: 70, grp: 36, rel: 150 }[l.kind] || 70)).strength(l => ({ gf: 0.5, sat: 0.9, cv: 0.9, pc: 0.25, pp: 0.1, sp: 0.15, tax: 0.5, band: 0.3, layer: 0.3, design: 0.3, cc: 0.2, grp: 0.6, rel: 0.05 }[l.kind] || 0.2));
  Graph.d3Force('charge').strength(n => n.kind === 'plant' ? -260 : n.kind === 'gf' ? -300 : n.kind === 'sat' ? -90 : n.kind === 'source' ? -60 : -45).distanceMax(400);
  const sc = Graph.scene(); sc.fog = new THREE.FogExp2(0x04060f, 0.0007);
  sc.add(new THREE.HemisphereLight(0xdfe8ff, 0x101424, 0.9)); const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(300, 500, 400); sc.add(dl);
  // no bloom pass: the soft halo sprite gives the glow at a fraction of the cost (a full-screen bloom halved the frame rate at 100 plants)
  const ctl = Graph.controls(); ctl.autoRotate = false; ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.minDistance = 60; ctl.maxDistance = 3000;
  S.Graph = Graph; S.tex = glowTexture(); S.geo = new THREE.SphereGeometry(1, 28, 20); S.ringGeo = new THREE.TorusGeometry(1, 0.12, 8, 36);
  (function loop() { frame(); requestAnimationFrame(loop); })();
}
function glowTexture() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64); grd.addColorStop(0, 'rgba(255,255,255,0.55)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.14)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
function nodeObject(n) {
  const col = new THREE.Color(colourOfNode(n)); const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(n.kind === 'sat' ? 0.55 : 0.85), emissive: col, emissiveIntensity: n.kind === 'sat' ? 0.18 : n.used ? 0.4 : 0.12, roughness: 0.5, metalness: 0.05, transparent: true, opacity: 1 });
  const mesh = new THREE.Mesh(n.kind === 'sat' ? S.ringGeo : S.geo, mat); mesh.scale.setScalar(n.size); g.add(mesh);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: S.tex, color: col, transparent: true, opacity: n.kind === 'sat' ? 0.14 : n.used ? 0.42 : 0.14, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(n.size * 2.6); g.add(halo);
  n.__obj = { group: g, mesh, mat, halo, baseE: mat.emissiveIntensity, baseH: halo.material.opacity }; return g;
}
const SEG = 14;
function linkStyle(l) {
  switch (l.kind) {
    case 'sat': return { col: areaColour(l.area), a: 0.3 };
    case 'cv': return { col: TYPE_COLOUR.plant, a: 0.3 };
    case 'pc': { const cand = l.edges.every(e => e.type === 'candidate'); const ver = l.edges.some(e => e.status === 'verified'); return { col: cand ? ST.observation : ver ? '#ffffff' : areaColour(l.area), a: cand ? 0.85 : 0.42 }; }
    case 'pp': return { col: AREA_COLOUR.evidence, a: 0.25 };
    case 'sp': return { col: TYPE_COLOUR[l.edges[0].source_type] || '#8892a8', a: 0.3 };
    case 'gf': return { col: AREA_COLOUR.classification, a: 0.5 };
    case 'tax': return { col: AREA_COLOUR.classification, a: 0.45 };
    case 'band': case 'layer': return { col: ST.derived, a: 0.45 };
    case 'design': return { col: ST[l.status] || '#888', a: 0.55 };
    case 'cc': return { col: l.rel === 'maps_to' ? ST.derived : AREA_COLOUR.design, a: 0.5 };
    case 'grp': return { col: '#8f9bb8', a: 0.25 };
    case 'rel': return { col: l.status === 'candidate' ? ST.candidate : '#ffffff', a: l.status === 'candidate' ? 0.3 : 0.5 };
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
function clearAct() { S.act.clear(); S.actL.clear(); S.alive = false; S.dirty = 3; renderState(); }
function revealWaves(waves, seedId) {
  snapshot(); const ids = waves.flatMap(w => w.nodes).concat(waves.flatMap(w => w.edges.flatMap(e => [e.source, e.target, e.plant].filter(Boolean)))).filter(id => S.reg.has(id));
  show(ids, seedId); rebuild(); pulseWaves(waves); const seed = S.reg.get(seedId); if (seed && S.visible.has(seed.id)) { S.selected = seed; S.focus = new Set(ids.concat([seedId])); S.trail.push(seedId); focusOn(seed); } renderCrumb();
}

// ------------------------------------------------------------------ per frame
const _v = new THREE.Vector3(); const _p = new THREE.Vector3();
function frame() {
  const now = performance.now(); const cam = S.Graph.camera(); const w = window.innerWidth, h = window.innerHeight;
  if (S.alive && now > S.aliveUntil) { S.alive = false; S.dirty = 3; renderState(); }
  const alive = S.alive; const focus = S.focus; const many = S.nodes.length > 45;
  for (const n of S.nodes) { const o = n.__obj; if (!o) continue; const a = alive ? actOf(n, now) : 0; const sel = S.selected?.id === n.id ? 1 : 0; const dim = focus && !focus.has(n.id) ? 0.35 : 1; o.mat.emissiveIntensity = (o.baseE + 0.7 * a + 0.35 * sel) * dim; o.mat.opacity = 0.45 + 0.55 * dim; o.halo.material.opacity = (o.baseH + 0.45 * a + 0.3 * sel) * dim; const sc = n.size * (1 + 0.18 * a + 0.1 * sel); o.mesh.scale.setScalar(sc); o.halo.scale.setScalar(sc * 2.6); }
  if (alive || S.dirty > 0) { if (!alive) S.dirty--; for (const l of S.links) { const o = l.__obj; if (!o) continue; const A = alive && S.actL.get(l.id); const inF = !focus || focus.has(l.source.id) || focus.has(l.target.id); if (A) { const p = (now - A.t0) / 650; paintLink(l, u => { const d = (A.dir > 0 ? u : 1 - u) - p; if (p < 0) return 1; const win = Math.exp(-(d * 6) * (d * 6)); return (p > 1.2 ? 1.5 : d < 0 ? 1.4 : 1) + 1.6 * win; }); o.mat.opacity = Math.min(1, o.base * 1.8 + 0.2); } else { const sel = S.selected && (l.source.id === S.selected.id || l.target.id === S.selected.id); paintLink(l, sel ? 1.5 : 1); o.mat.opacity = (sel ? Math.min(1, o.base * 1.6 + 0.15) : o.base) * (inF ? 1 : 0.3); } } }
  // labels: growth forms, plants and open rings always (plants only when focused once there are many); knowledge nodes when
  // few are shown, in focus, or hubs. Widths are measured once at rebuild, never per frame.
  const plantCount = S.plantCount || 0; const bigFocus = focus && focus.size > 40;
  for (const L of S.labels) { const n = L.n; if (!Number.isFinite(n.x)) { setCls(L, 'hidden', true); continue; } let showL = true;
    if (n.kind === 'concept' || n.kind === 'source' || n.kind === 'cultivar') showL = (!many || (focus && focus.has(n.id) && !bigFocus) || n.k >= 2 || S.selected?.id === n.id);
    else if (n.kind === 'plant' && plantCount > 60) showL = (focus && focus.has(n.id) && !bigFocus) || S.selected?.id === n.id || S.expanded.has(n.id);
    if (!showL) { setCls(L, 'hidden', true); continue; }
    _v.set(n.x, n.y - n.size - 3, n.z); _v.project(cam); if (_v.z > 1) { setCls(L, 'hidden', true); continue; }
    const dist = cam.position.distanceTo(_p.set(n.x, n.y, n.z)); setCls(L, 'hidden', false); setCls(L, 'far', dist > 900 && n.kind !== 'plant' && n.kind !== 'gf'); setCls(L, 'dim', !!focus && !focus.has(n.id)); setCls(L, 'sel', S.selected?.id === n.id);
    L.sx = (_v.x + 1) / 2 * w; L.sy = (1 - _v.y) / 2 * h; L.d = dist; L.shown = true; }
  const shown = S.labels.filter(x => x.shown);
  if (shown.length <= 90) { const placed = []; for (const L of shown.sort((a, b) => a.d - b.d)) { let y = L.sy; for (let k = 0; k < 6; k++) { const hit = placed.find(p => Math.abs(p.x - L.sx) < (p.w + L.w) / 2 + 6 && y < p.y + p.h + 2 && y + L.h + 2 > p.y); if (!hit) break; y = hit.y + hit.h + 3; } L.sy = y; placed.push({ x: L.sx, y, w: L.w, h: L.h }); } }
  for (const L of shown) { L.el.style.transform = `translate3d(${(L.sx - L.w / 2).toFixed(1)}px, ${L.sy.toFixed(1)}px, 0)`; L.shown = false; }
}
function setCls(L, c, on) { if (L.cls[c] !== on) { L.cls[c] = on; L.el.classList.toggle(c, on); } }
function rebuildLabels() {
  for (const L of S.labels) L.el.remove(); S.labels = []; const K = S.K;
  const add = (n, html, cls) => { const el = document.createElement('div'); el.className = `lbl ${cls}`; el.innerHTML = html; el.addEventListener('click', e => { e.stopPropagation(); select(n); }); $('#labels').appendChild(el); S.labels.push({ n, el }); };
  S.plantCount = S.nodes.filter(x => x.kind === 'plant').length;
  for (const n of S.nodes) {
    const sub = n.kind === 'gf' ? (n.plants.length ? `${n.plants.length} plant${n.plants.length === 1 ? '' : 's'}` : 'no plant yet') : n.kind === 'plant' ? esc((n.n.common || [])[0] || '') : n.kind === 'sat' ? `${n.count}` : n.kind === 'concept' && n.k > 1 ? `${n.k} plants` : '';
    add(n, `${esc(n.n.label.length > 34 && n.kind === 'source' ? n.n.label.slice(0, 32) + '…' : n.n.label)}${sub ? `<small>${sub}</small>` : ''}`, `${n.kind}${S.expanded.has(n.id) ? ' open' : ''}${n.design ? ' design' : ''}${n.used === false ? ' dormant' : ''}`);
    if (n.kind === 'sat' || n.kind === 'concept') S.labels[S.labels.length - 1].el.style.color = areaColour(n.area);
  }
  for (const L of S.labels) { L.w = L.el.offsetWidth || 60; L.h = L.el.offsetHeight || 14; L.cls = {}; }
}

// ------------------------------------------------------------------ hover, state line, trail
const tip = $('#tip');
function hover(n) { if (!n) { tip.style.display = 'none'; return; } const K = S.K; const o = n.n; let html = `<b>${esc(o.label)}</b>`; if (n.kind === 'concept') html += `<div class="meta">${n.k ? `${n.k} plant${n.k === 1 ? '' : 's'}` : 'dormant'}${o.to_confirm ? ' · to confirm' : ''} · click to open its links</div>`; else if (n.kind === 'sat') html += `<div class="meta">${esc(K.label(n.plant))} · ${n.count} · ${S.expanded.has(n.id) ? 'click to close' : 'click to open'}</div>`; else if (n.kind === 'plant') html += `<div class="meta">${K.plantEvidenceEdges(n.id).length} evidence links · ${S.expanded.has(n.id) ? 'click to close' : 'click to open'}</div>`; else if (n.kind === 'gf') html += `<div class="meta">${n.plants.length ? n.plants.slice(0, 8).map(K.label).join(', ') + (n.plants.length > 8 ? ` … ${n.plants.length - 8} more` : '') : 'no plant in the database is read as this form'}</div>`; tip.innerHTML = html; tip.style.display = 'block'; }
document.addEventListener('pointermove', e => { if (tip.style.display !== 'none') { tip.style.left = `${Math.min(window.innerWidth - 300, e.clientX + 14)}px`; tip.style.top = `${e.clientY + 14}px`; } });
function renderState() { const el = $('#state'); if (S.alive) { el.textContent = `signal: ${S.act.size} nodes · ${S.actL.size} links`; } else el.textContent = S.candidates.length ? `${S.candidates.length} candidate observation${S.candidates.length === 1 ? '' : 's'} this session` : ''; }
function renderStats() { const c = S.K.kg.counts; $('#stats').textContent = `${S.nodes.length} of ${ALL().filter(n => n.kind !== 'sat').length} nodes shown · ${S.links.length} links · ${c.plants} plants · ${c.claims} claims · documented ${c.by_status.documented} · derived ${c.by_status.derived} · candidate ${c.by_status.candidate} · unknown ${c.by_status.unknown}`; }
function renderCrumb() {
  const el = $('#crumb'); const trail = S.trail.slice(-5);
  el.innerHTML = `<button id="btn-over" ${S.history.length || S.selected ? '' : 'disabled'}>Overview</button><button id="btn-back" ${S.history.length ? '' : 'disabled'}>← Back</button>` + (trail.length ? `<span class="path">${trail.map(id => `<span class="link" data-id="${esc(id)}">${esc(S.reg.get(id)?.n?.label || id)}</span>`).join('<i>›</i>')}</span>` : '<span class="path faint">click a growth form or a plant to begin</span>');
  $('#btn-over').addEventListener('click', () => overview()); $('#btn-back').addEventListener('click', back); bind(el);
}

// ------------------------------------------------------------------ selection
const card = $('#card'), CB = $('#card-body');
function openCard(html) { CB.innerHTML = html; card.classList.add('open'); bind(CB); card.scrollTop = 0; }
function closeCard() { card.classList.remove('open'); CB.innerHTML = ''; }
function deselect() { S.selected = null; S.focus = null; S.dirty = 3; closeCard(); clearAct(); rebuildLabels(); renderCrumb(); }
function clearAll() { deselect(); }
function focusOn(n, dist) { if (!n || !Number.isFinite(n.x)) return; const cam = S.Graph.camera(); const ctl = S.Graph.controls(); const d = new THREE.Vector3().subVectors(cam.position, ctl.target).normalize(); const scale = Math.max(1, Math.sqrt(S.nodes.length / 30)); const D = (dist || (n.kind === 'gf' ? 520 : n.kind === 'plant' ? 420 : n.kind === 'sat' ? 340 : 320)) * scale; S.Graph.cameraPosition({ x: n.x + d.x * D, y: n.y + d.y * D, z: n.z + d.z * D }, { x: n.x, y: n.y, z: n.z }, 1100); }
const cardFor = n => n.kind === 'concept' ? (n.design ? cardDesign(n) : cardConcept(n)) : n.kind === 'plant' ? cardPlant(n) : n.kind === 'source' ? cardSource(n) : n.kind === 'cultivar' ? cardPlant(S.reg.get(n.n.plant)) : n.kind === 'sat' ? cardSat(n) : cardGf(n);
function select(n) {
  if (!n) return; if (typeof n === 'string') n = S.reg.get(n); if (!n) return;
  if (n.kind === 'link') { selectLink(n.link); return; }
  const revealed = expandNode(n); S.selected = n; if (!S.visible.has(n.id)) { show([n.id], n.parent); rebuild(); }
  if (S.trail[S.trail.length - 1] !== n.id) S.trail.push(n.id);
  S.focus = focusSet(n); for (const id of revealed) S.focus.add(id); S.dirty = 3;
  pulse([n.id], 1, (u, l, v) => revealed.includes(v.id) || v.id === n.parent || n.kind === 'gf' || n.kind === 'concept');
  openCard(cardFor(n)); setTimeout(() => focusOn(n), 350); rebuildLabels(); renderCrumb();
}
function revealAndSelect(id) { if (!S.reg.has(id)) return; if (!S.visible.has(id)) { snapshot(); show([id], S.selected?.id); rebuild(); } select(S.reg.get(id)); }
function selectLink(l) {
  if (!l) return; snapshot();
  const sids = new Set(l.edges.map(e => e.source_id).filter(Boolean)); for (const e of l.edges) if (e.type === 'design') { for (const s of e.use_sources || []) sids.add(s); for (const r of e.requirements || []) for (const ev of r.evidence || []) if (ev.source_id) sids.add(ev.source_id); }
  const srcs = [...sids].map(s => `source:${s}`).filter(s => S.reg.has(s)); show([l.source.id, l.target.id, ...srcs], l.source.id); rebuild();
  const L = S.links.find(x => x.id === l.id) || l; const now = performance.now(); S.act.clear(); S.actL.clear(); S.act.set(L.source.id, now); S.act.set(L.target.id, now + STEP); S.actL.set(L.id, { t0: now, dir: 1 });
  for (const s of srcs) { const sl = S.links.find(x => x.kind === 'sp' && x.source.id === s); if (sl) { S.actL.set(sl.id, { t0: now + STEP, dir: 1 }); S.act.set(s, now + 2 * STEP); } }
  S.alive = true; S.aliveUntil = now + 4 * STEP; S.selected = null; S.focus = new Set([L.source.id, L.target.id, ...srcs]); renderState(); openCard(cardLink(L)); renderCrumb();
}
function selectEdge(edgeId) { const l = S.edgeLink.get(edgeId); if (l) { selectLink(l); return; } const e = S.K.edges.find(x => x.id === edgeId); if (!e) return; snapshot(); show([e.source, e.target].filter(id => S.reg.has(id)), e.source); rebuild(); const l2 = S.edgeLink.get(edgeId); if (l2) selectLink(l2); }
function bind(root) {
  root.querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); revealAndSelect(el.dataset.id); }));
  root.querySelectorAll('[data-sat]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); const [pid, area] = el.dataset.sat.split('|'); const s = satOf(pid, area); if (s) { if (!S.visible.has(s.id)) { snapshot(); show([s.id], pid); rebuild(); } select(s); } }));
  root.querySelectorAll('[data-shared]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); const [a, b, area] = el.dataset.shared.split('|'); revealShared(a, b, area || undefined); }));
  root.querySelectorAll('[data-edge]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); selectEdge(el.dataset.edge); }));
  root.querySelectorAll('[data-claim]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); const ed = S.K.edges.find(x => x.claim_id === el.dataset.claim && x.target); if (ed) selectEdge(ed.id); }));
  root.querySelectorAll('[data-path]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); runPath(el.dataset.path, el.dataset.arg, el.dataset.arg2); }));
}

// ------------------------------------------------------------------ cards that are new in v7: growth form, plant (areas + related plants), satellite, pair
const dot = c => `<i class="dot" style="background:${c}"></i>`;
const stTag = s => `<span class="tag ${esc(s)}">${esc(s)}</span>`;
const regionDot = n => dot(colourOfNode(n));
const crumb = id => S.K.hierarchyPath(id).reverse().map(x => esc(S.K.label(x))).join(' › ');
const edgeVal = e => e.value_label != null ? (Array.isArray(e.value_label) ? e.value_label.join(', ') : e.value_label) : e.numbers ? fmtNum(e.numbers) : S.K.label(e.target);
const chip = (id, extra = '') => { const n = S.reg.get(id); if (!n) return `<span class="chip dim">${esc(S.K.label(id))}</span>`; const k = n.kind === 'concept' ? n.k : 0; return `<span class="chip ${n.used === false ? 'dim' : ''}${S.visible.has(id) ? ' on' : ''}" data-id="${esc(id)}" style="--c:${colourOfNode(n)}">${esc(S.K.label(id))}${k ? `<small>${k}</small>` : ''}${extra}</span>`; };
const satChip = (pid, area, extra = '') => { const s = satOf(pid, area); if (!s) return ''; return `<span class="chip${S.visible.has(s.id) ? ' on' : ''}" data-sat="${esc(pid)}|${esc(area)}" style="--c:${areaColour(area)}">${esc(s.n.label)}<small>${s.count}</small>${extra}</span>`; };
function cardGf(n) { const K = S.K; const o = n.n; return `<h2>${regionDot(n)} ${esc(o.label)}</h2><div class="kicker">growth form · read from the sources (M29), never from a KPU leaf-habit type</div><p class="lead">${esc(o.definition)}</p>${n.plants.length ? `<h3>plants</h3>${n.plants.map(p => { const e = K.edges.find(x => x.type === 'classification' && x.source === p); return `<div class="row" data-id="${esc(p)}"><i class="st verified" style="--c:${TYPE_COLOUR.plant}"></i><div><em class="val">${esc(K.label(p))}</em> ${e ? stTag(e.verification) : ''}<br><span class="meta">${esc(e?.text || '')}</span></div></div>`; }).join('')}` : '<p class="muted">No plant in the database is read as this form yet. It will appear here when one is added and the pipeline runs.</p>'}`; }
function cardPlant(n) {
  const K = S.K; const pid = n.id; const d = S.diag.plants[pid]; const gf = K.edges.find(e => e.type === 'classification' && e.source === pid); const tax = K.edgesFrom(pid, ['in_genus']); const areas = Object.entries(K.areas).sort((a, b) => (a[1].order || 9) - (b[1].order || 9));
  const pairs = K.pairsOf(pid).slice().sort((a, b) => b.n_sourced_relations - a.n_sourced_relations || b.n_shared - a.n_shared);
  const vars = S.diag.variation.filter(x => x.plant === pid), dis = S.diag.disagreement.filter(x => x.plant === pid);
  return `<h2><em>${esc(n.n.label)}</em></h2><div class="kicker">${esc((n.n.common || []).join(' · '))} · ${esc((n.n.origin_status || '').replace(/_/g, ' '))}</div>
  ${tax.map(t => `<p class="small" style="margin:2px 0">${esc(t.text)} ${stTag('documented')}</p>`).join('')}${gf ? `<p class="small" style="margin:2px 0"><span class="link" data-id="${esc(gf.target)}">${esc(K.label(gf.target))}</span> ${stTag(gf.verification)} ${stTag('derived')} <span class="meta">${esc(gf.text)}</span></p>` : '<p class="small warn">no growth form could be read from the sources</p>'}
  <h3>knowledge</h3><div class="chips">${areas.map(([a]) => satChip(pid, a)).join('')}</div>
  <p class="lead small" style="margin-top:8px">${esc(d?.text || '')}</p>
  ${vars.length || dis.length ? `<p class="muted small">${vars.map(x => `↔ ${esc(x.text)}`).join('<br>')}${vars.length && dis.length ? '<br>' : ''}${dis.slice(0, 2).map(x => `≠ ${esc(x.text)}`).join('<br>')}${dis.length > 2 ? `<br>… ${dis.length - 2} more disagreements` : ''}</p>` : ''}
  <h3>related plants</h3>${pairs.length ? pairs.slice(0, 12).map(p => { const other = p.plants.find(x => x !== pid); const direct = p.direct_relations; return `<div class="row" data-shared="${esc(pid)}|${esc(other)}"><i class="st ${direct.some(r => r.kg_status !== 'candidate') ? 'documented' : direct.length ? 'candidate' : 'derived'}" style="--c:${direct.some(r => r.kg_status !== 'candidate') ? ST.documented : direct.length ? ST.candidate : ST.derived}"></i><div><em class="val">${esc(K.label(other))}</em> <span class="meta">${p.n_shared} shared knowledge nodes${direct.length ? ' · ' + direct.map(r => `${esc(r.rel)} (${esc(r.kg_status)})`).join(', ') : ' · no direct relation recorded'}</span></div></div>`; }).join('') + '<p class="muted small">Shared knowledge is an indirect connection, not a planting recommendation. Direct relations come from relations.json only.</p>' : '<p class="muted small">no other plant in the database</p>'}`;
}
function cardSat(n) {
  const K = S.K; const pid = n.plant; const a = n.area; const pa = n.summary || {};
  let body = '';
  if (a === 'relations') { const pairs = K.pairsOf(pid).slice().sort((x, y) => y.n_sourced_relations - x.n_sourced_relations || y.n_shared - x.n_shared); body = pairs.map(p => { const other = p.plants.find(x => x !== pid); return `<div class="row" data-shared="${esc(pid)}|${esc(other)}"><i class="st derived" style="--c:${ST.derived}"></i><div><em class="val">${esc(K.label(other))}</em> <span class="meta">${p.n_shared} shared · ${Object.entries(p.shared_by_area).map(([k, v]) => `${v.length} ${esc((K.areas[k] || {}).label || k).toLowerCase()}`).join(', ')}</span>${p.direct_relations.map(r => `<div class="meta"><span class="link" data-edge="${esc(r.id)}">${esc(r.rel)}</span> · ${esc(r.kg_status)} · ${esc(K.srcLabel(r.source_id))}${r.kg_status === 'candidate' ? ' · model placeholder, awaiting evidence' : ''}</div>`).join('') || '<div class="meta">no direct relation recorded</div>'}</div></div>`; }).join('') + '<p class="muted small">Click a plant to see the knowledge the two share; shared attributes are never read as a planting recommendation.</p>'; }
  else if (a === 'evidence') body = `<div class="chips">${(pa.sources || []).map(s => chip(`source:${s}`)).join('')}</div>${(pa.concepts || []).length ? `<h3>places</h3><div class="chips">${pa.concepts.map(c => chip(c)).join('')}</div>` : ''}`;
  else { const es = K.edges.filter(e => isKnowledge(e) && plantOf(e) === pid && (K.areaOfConcept(e.target) || 'evidence') === a); const byC = new Map(); for (const e of es) { const c = e.target; if (!byC.has(c)) byC.set(c, { n: 0, ver: 0, st: new Set() }); const d = byC.get(c); d.n++; d.ver += e.verification === 'verified'; d.st.add(e.kg_status); } const groups = new Map(); for (const [c, d] of byC) { const f = K.N.get(c)?.facet || '?'; if (!groups.has(f)) groups.set(f, []); groups.get(f).push([c, d]); } body = [...groups].map(([f, cs]) => `<div class="small"><b class="muted">${esc(K.label(`facet:${f}`) === `facet:${f}` ? f.replace(/_/g, ' ') : K.label(`facet:${f}`))}</b><div class="chips">${cs.map(([c, d]) => chip(c, d.st.has('candidate') ? ' <small class="cand">candidate</small>' : d.st.has('derived') ? ' <small>derived</small>' : d.ver ? ' <small>✓</small>' : '')).join('')}</div></div>`).join(''); }
  return `<h2>${dot(areaColour(a))} ${esc(n.n.label)} <span class="muted">· <em>${esc(K.label(pid))}</em></span></h2><div class="kicker">${esc(n.n.definition || '')}</div>${body}`;
}
function cardPair(p, area) { const K = S.K; const [a, b] = p.plants; return `<h2><em>${esc(K.label(a))}</em> ↔ <em>${esc(K.label(b))}</em></h2><div class="kicker">plant-to-plant · ${p.n_shared} shared knowledge nodes · ${p.direct_relations.length} direct relation${p.direct_relations.length === 1 ? '' : 's'}</div><p class="lead small">${esc(p.text)}</p>${p.direct_relations.length ? `<h3>direct relations</h3>${p.direct_relations.map(r => `<div class="row" data-edge="${esc(r.id)}"><i class="st ${esc(r.kg_status)}" style="--c:${ST[r.kg_status]}"></i><div><span class="val">${esc(r.rel)}</span> ${stTag(r.kg_status)} <span class="meta">${esc(K.srcLabel(r.source_id))} · ${esc(r.verification || '')}</span><br><span class="meta">${esc(r.text || '')}</span></div></div>`).join('')}` : '<p class="muted small">No direct relation is recorded between these two plants.</p>'}<h3>shared knowledge · open one area</h3><div class="chips">${Object.entries(p.shared_by_area).sort((x, y) => y[1].length - x[1].length).map(([k, v]) => `<span class="chip${area === k ? ' on' : ''}" data-shared="${esc(a)}|${esc(b)}|${esc(k)}" style="--c:${areaColour(k)}">${esc((K.areas[k] || {}).label || k)}<small>${v.length}</small></span>`).join('')}</div>${area ? `<h3>${dot(areaColour(area))} ${esc((K.areas[area] || {}).label || area)} <span class="faint">${(p.shared_by_area[area] || []).length}</span></h3><div class="chips">${(p.shared_by_area[area] || []).map(c => chip(c)).join('')}</div>` : ''}<p class="muted small">Shared knowledge is an indirect connection through the same node, never a planting recommendation.</p>`; }

function evidenceRow(e, withPlant = false) { const K = S.K; const conds = (e.conditions || []).map(c => K.label(c.concept_id)).join(', '); const c = e.claim_id ? K.claimOf(e.claim_id) : null; return `<div class="row" ${e.claim_id ? `data-claim="${esc(e.claim_id)}"` : ''}><i class="st ${esc(e.status || e.verification)}" style="--c:${TYPE_COLOUR[e.source_type] || TYPE_COLOUR.plant}"></i><div>${withPlant ? `<em>${esc(K.label(e.plant))}</em> · ` : ''}<span class="val">${esc(edgeVal(e))}</span>${e.spanned ? ' <span class="faint">(range spans this class)</span>' : ''}${e.cultivar ? ` <span class="muted">‘${esc(e.cultivar)}’</span>` : ''}<br><span class="meta">${esc(K.srcLabel(e.source_id))} · ${esc(e.status || e.verification)}${conds ? ' · under ' + esc(conds) : ''}${e.place ? ' · ' + esc(K.label(e.place)) + (K.PLACE_VAN.has(e.place) ? ' ✓ local' : '') : ''}${c?.source_url ? ` · <a href="${esc(c.source_url)}" target="_blank" rel="noopener">source</a>` : ''}</span></div></div>`; }

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
  <h3>what it needs from a plant</h3>${b.requirements.map(r => `<div class="row" data-edge="${esc(r.id)}"><i class="st documented" style="--c:${AREA_COLOUR.environment}"></i><div><span class="val">${esc(r.strength)}: ${(r.alternatives || [r.target]).map(a => chip(a)).join(' or ')}</span><br><span class="meta">${esc(r.basis?.source || '')}${r.to_confirm ? ' · to confirm' : ''}</span></div></div>`).join('') || '<p class="muted">no requirement recorded</p>'}
  ${b.uses.length ? `<p class="muted small">KPU uses that name it (KG-R1): ${b.uses.map(u => chip(u.source)).join(' ')}</p>` : ''}
  <h3>plants</h3>${b.plants.map(p => `<div class="row" data-edge="${esc(p.edge.id)}"><i class="st ${esc(p.kg_status)}" style="--c:${ST[p.kg_status]}"></i><div><em class="val">${esc(K.label(p.plant))}</em> ${stTag(p.kg_status)} <span class="meta">${esc(p.verdict)}</span>${p.liveVerdict ? `<br><span class="cand">with this session's observation: ${esc(p.liveVerdict)} — still candidate</span>` : ''}<br><span class="meta">${esc(p.edge.text)}</span></div></div>`).join('') || '<p class="warn">No plant is linked to this concept by any source or rule.</p>'}
  <p><button data-path="B" data-arg="${esc(n.id)}">run as path B</button> <button data-path="D" data-arg="${esc(n.id)}">show the gaps (path D)</button></p>`;
}

function cardSource(n) { const K = S.K; const sid = n.id.split(':')[1]; const es = K.edges.filter(e => e.live !== false && e.target && e.source_id === sid && ['claim', 'entity', 'candidate'].includes(e.type)); const rec = K.db.sources[sid] || {}; const byP = {}; for (const e of es) (byP[e.plant] = byP[e.plant] || []).push(e); return `<h2>${esc(n.n.label)}</h2><div class="kicker">${esc(n.n.source_type || '')}${n.n.geo ? ' · ' + esc(n.n.geo) : ''}${n.n.licence_tier ? ' · licence tier ' + esc(n.n.licence_tier) : ''} · ${es.length} claims</div>${rec.role_in_db ? `<p class="muted small">${esc(rec.role_in_db)}</p>` : ''}${rec.url ? `<p class="small"><a href="${esc(rec.url)}" target="_blank" rel="noopener">${esc(rec.url.replace(/^https?:\/\//, ''))}</a></p>` : ''}${Object.entries(byP).map(([p, ees]) => `<h3><em>${esc(K.label(p))}</em> · ${ees.length}</h3><div class="chips">${[...new Set(ees.map(e => e.target))].map(cid => chip(cid)).join('')}</div>`).join('')}`; }
function cardLink(l) {   // the evidence trace: relation type, status, claims, sources, conditions, verification, rule / literature
  const K = S.K; const es = l.edges; const e0 = es[0]; const nl = id => { const r = S.reg.get(id); return r?.kind === 'sat' ? `${K.label(r.plant)} · ${r.n.label}` : K.label(id); }; const src = nl(l.source.id), tgt = nl(l.target.id);
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


function runPath(which, arg, arg2) {
  const K = S.K; $('#paths').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.path === which));
  const r = which === 'A' ? K.pathA(arg || 'growth_form:shrub') : which === 'B' ? K.pathB(arg || 'spatial:screen') : which === 'C' ? K.pathC(arg || 'plant:gaultheria-shallon', arg2 || 'height_class') : K.pathD(arg || 'spatial:scrim');
  revealWaves(r.waves, r.seed);
  const trail = `<div class="trail">${r.waves.map((w, i) => `<span class="w" style="animation-delay:${i * STEP}ms">${String(i + 1).padStart(2, '0')} ${esc(w.step)} <small>${w.nodes.length}</small></span>`).join('')}</div>`;
  let body = '';
  if (which === 'A') body = `<p class="lead">Hierarchy: ${crumb(r.seed)}</p>${r.classification.map(e => `<div class="row" data-edge="${esc(e.id)}"><i class="st ${esc(e.verification)}" style="--c:${AREA_COLOUR.classification}"></i><div><em class="val">${esc(K.label(e.source))}</em> ${stTag(e.verification)} ${stTag('derived')}<br><span class="meta">${esc(e.text)}</span></div></div>`).join('')}${Object.entries(r.attributes).map(([p, cats]) => `<h3><em>${esc(K.label(p))}</em> · attributes by category</h3>${Object.entries(cats).map(([c, es]) => `<div class="small"><b>${esc(K.label(c))}</b> <span class="faint">${new Set(es.map(e => e.target)).size} concepts · ${new Set(es.map(e => e.claim_id)).size} claims</span><div class="chips">${[...new Set(es.map(e => e.target))].slice(0, 10).map(id => chip(id)).join('')}</div></div>`).join('')}<details><summary>evidence in R5 order · ${r.evidence[p].length} claims</summary>${r.evidence[p].slice(0, 20).map(c => `<div class="r" data-claim="${esc(c.id)}">${esc(K.attribute(c))}<div class="why">${esc(c.field.replace(/_/g, ' '))} · ${esc(c.status)} · ${esc(K.conds(c))}${K.citable(c) ? '' : ' · L0 withheld'}</div></div>`).join('')}</details>`).join('')}`;
  else if (which === 'B') body = `<p class="lead">${esc(r.node.definition)}</p><p class="muted small">${esc(r.node.source_of_term)}${r.node.to_confirm ? ' · <span class="warn">term to confirm</span>' : ''}</p><h3>required traits</h3>${r.requirements.map(q => `<div class="row" data-edge="${esc(q.id)}"><i class="st documented" style="--c:${AREA_COLOUR.environment}"></i><div><span class="val">${esc(q.strength)}: ${(q.alternatives || [q.target]).map(a => chip(a)).join(' or ')}</span><br><span class="meta">${esc(q.basis?.source || '')}${q.to_confirm ? ' · to confirm' : ''}</span></div></div>`).join('')}${r.uses.length ? `<p class="muted small">KPU uses that name it: ${r.uses.map(u => chip(u.source)).join(' ')}</p>` : ''}<h3>relevant plants</h3>${r.plants.map(p => `<div class="row" data-edge="${esc(p.edge.id)}"><i class="st ${esc(p.kg_status)}" style="--c:${ST[p.kg_status]}"></i><div><em class="val">${esc(K.label(p.plant))}</em> ${stTag(p.kg_status)} <span class="meta">${esc(p.verdict)}</span><br><span class="meta">${esc(p.edge.text)}</span>${p.checks.filter(c => c.evidence.length).map(c => `<div class="meta">· ${esc(c.alternatives.map(K.label).join(' or '))}: ${c.evidence.slice(0, 3).map(ev => `${esc(K.srcLabel(ev.source_id || 'entity'))}${(ev.conditions || []).length ? ' (under ' + esc(ev.conditions.map(x => K.label(x.concept_id).toLowerCase()).join(', ')) + ')' : ''}`).join(', ')}${c.evidence.length > 3 ? ` +${c.evidence.length - 3}` : ''}</div>`).join('')}${p.missing.length ? `<div class="meta warn">missing: ${esc(p.missing.map(m => m.alternatives.map(K.label).join(' or ') + ` (${m.result})`).join('; '))}</div>` : ''}</div></div>`).join('') || '<p class="warn">no plant linked</p>'}`;
  else if (which === 'C') body = `<p class="lead">${r.claims.length} live claims from ${new Set(r.claims.map(c => c.source_id)).size} sources · ${esc(r.reading)}</p>${r.groups.map(g => `<h3>${esc(g.cultivar)} · ${esc(g.conditions)}</h3>${g.claims.map(c => `<div class="r" data-claim="${esc(c.id)}">${esc(K.attribute(c))}<div class="why">${esc((c.concepts || []).filter(x => K.N.get(x)?.facet === r.facet).map(K.label).join(', '))} · ${c.place ? esc(K.label(c.place)) : '—'}${K.PLACE_VAN.has(c.place) ? ' ✓ local' : ''}</div></div>`).join('')}`).join('')}${r.variation.map(v => `<p class="small">↔ ${esc(v.text)}</p>`).join('')}${r.disagreement.map(d => `<p class="small">≠ ${esc(d.text)}</p>`).join('')}`;
  else body = `<p class="lead">${esc(r.node.definition)}</p>${r.node.to_confirm ? '<p class="warn small">The term itself is from the brief and not yet found in the literature — to confirm.</p>' : ''}<h3>required knowledge</h3>${r.requirements.map(q => `<div class="row" data-edge="${esc(q.id)}"><i class="st documented" style="--c:${AREA_COLOUR.environment}"></i><div><span class="val">${esc(q.strength)}: ${(q.alternatives || [q.target]).map(a => chip(a)).join(' or ')}</span><br><span class="meta">${esc(q.basis?.source || '')}${q.to_confirm ? ' · to confirm' : ''}</span></div></div>`).join('')}<h3>existing evidence</h3>${r.plants.map(p => `<div class="row" data-edge="${esc(p.edge.id)}"><i class="st ${esc(p.kg_status)}" style="--c:${ST[p.kg_status]}"></i><div><em class="val">${esc(K.label(p.plant))}</em> ${stTag(p.kg_status)} <span class="meta">${esc(p.verdict)} · met: ${esc(p.checks.filter(c => c.result === 'met').map(c => c.alternatives.map(K.label).join(' or ')).join('; ') || 'none')}</span></div></div>`).join('')}<h3 class="warn">missing relationships · ${r.missing.length}</h3>${r.missing.map(m => `<div class="r"><em>${esc(K.label(m.plant))}</em> needs ${esc(m.requirement)} <span class="faint">(${esc(m.strength)})</span>: <b>${esc(m.result)}</b><div class="why">${esc(m.why)}</div></div>`).join('')}${r.noPlant ? '<p class="warn small">No source links any plant to this concept; every link shown is a rule-based candidate or unknown.</p>' : ''}${r.toConfirm.length ? `<p class="muted small">${r.toConfirm.length} literature relation(s) await page-level confirmation.</p>` : ''}`;
  openCard(`<h2>Path ${which} · ${esc(r.title.split(': ')[0])}</h2><div class="kicker">${esc(r.title.split(': ').slice(1).join(': '))} · a traversal of kg.json, lit wave by wave</div>${trail}${body}`);
}


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
function initUi() {
  $('#ask-run').addEventListener('click', () => runQuery($('#ask-input').value)); $('#ask-input').addEventListener('keydown', e => { if (e.key === 'Enter') runQuery($('#ask-input').value); });
  $('#btn-grow').addEventListener('click', () => { openCard(growForm()); wireGrow(); });
  $('#card-close').addEventListener('click', deselect);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (document.activeElement && document.activeElement.tagName === 'INPUT') document.activeElement.blur(); else back(); } });
  $('#paths').innerHTML = [['A', 'Classification', 'growth form → plants → attributes → evidence'], ['B', 'Design knowledge', 'design concept → required traits → plants → conditions'], ['C', 'Knowledge variation', 'plant → height → conditions → claims → sources'], ['D', 'Knowledge gaps', 'design concept → required knowledge → evidence → missing']].map(([k, t, d]) => `<button data-path="${k}" title="${esc(d)}"><b>${k}</b> ${esc(t)}</button>`).join('');
  $('#paths').querySelectorAll('button').forEach(b => b.addEventListener('click', () => runPath(b.dataset.path)));
  $('#legend').innerHTML = Object.entries(S.K.areas).sort((a, b) => (a[1].order || 9) - (b[1].order || 9)).map(([a, d]) => `<span><i style="background:${areaColour(a)}"></i>${esc(d.label)}</span>`).join('') + `<span><i style="background:${TYPE_COLOUR.plant}"></i>plant</span><span><i class="ln" style="background:#fff"></i>verified claim</span><span><i class="ln" style="background:${ST.derived}"></i>derived</span><span><i class="ln" style="background:${ST.candidate}"></i>candidate</span><span><i class="ln" style="background:${ST.observation}"></i>observation</span>`;
}
window.brain = { S, frame, rebuildLabels, select, selectLink, revealShared, back, overview, pulse, revealWaves, clearAll, runQuery, runPath, addCandidate, resetCandidates, detect };
