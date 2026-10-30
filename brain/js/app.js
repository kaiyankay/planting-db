// Neural Cosmos v2 — a living knowledge environment over the Planting Intelligence claim store.
// Three scales: cosmos (plants × knowledge domains) → a domain unfolded into fields → an evidence lens per field.
// Read-only: loads the db over HTTP, never writes. Candidates live in this browser's localStorage only.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { loadDb } from './data.js';
import { TYPE_COLOUR, summariseValue } from './model.js';
import { makeRetriever } from './retrieve.js';
import { buildKnowledge, suggestions, buildUseIndex, parseContext, relate, numeric, fmt, isLive, isSourced, vocabOrder, domainOf, GEO_LABEL } from './knowledge.js';
import { buildRuler, buildSpectrum, buildNotes, buildFieldArc, buildSourceLens, buildRelations } from './lens.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const LS_KEY = 'brain.candidates.v1';
const PANEL_W = 372 + 32;

const S = {
  db: null, K: null, Graph: null, retr: null, use: null,
  candidates: [], view: { level: 'cosmos' }, history: [],
  nodes: [], links: [], stage: null, stageKey: null, stageAlpha: 1,
  lit: new Set(), litMode: null, flow: new Set(), activation: null, lastResult: null,
  labels: [], hover: null, swallowBg: false,
};

// ------------------------------------------------------------------ boot
(async function boot() {
  try {
    S.db = await loadDb();
    S.candidates = loadCandidates();
    S.retr = makeRetriever(S.db, () => S.candidates);
    rebuild();
    initGraph();
    initUi();
    renderLegend();
    go({ level: 'cosmos' }, true);
    $('#loading').classList.add('gone');
    setTimeout(() => $('#hint').classList.add('gone'), 9000);
  } catch (e) {
    $('#err').textContent = `could not load the db: ${e.message}\n\nserve from the planting-db root:  python3 -m http.server 8766  → http://localhost:8766/brain/`;
    console.error(e);
  }
})();

function rebuild() {
  S.K = buildKnowledge(S.db, S.candidates);
  S.use = buildUseIndex(S.retr, S.db.queries);
  layoutCosmos();
  renderStats();
}

// ------------------------------------------------------------------ cosmos layout: plants on a triangle, domains on a tilted ring around each plant (deterministic, no force drift)
function layoutCosmos() {
  const K = S.K; const pids = Object.keys(K.plants); const nodes = []; const links = [];
  const R = 98, r = 31;
  pids.forEach((pid, i) => {
    const a = Math.PI / 2 + i * (Math.PI * 2 / pids.length);
    const P = K.plants[pid];
    const px = Math.cos(a) * R, pz = Math.sin(a) * R * 0.85, py = [4, -3, 1][i % 3];
    const pn = { id: `plant:${pid}`, kind: 'plant', pid, P, x: px, y: py, z: pz, fx: px, fy: py, fz: pz };
    nodes.push(pn);
    P.domains.forEach((D, j) => {
      const b = a + Math.PI + (j / P.domains.length) * Math.PI * 2 + 0.4;
      const dx = px + Math.cos(b) * r, dz = pz + Math.sin(b) * r * 0.9, dy = py + Math.sin(b) * r * 0.25;
      nodes.push({ id: `domain:${D.key}`, kind: 'domain', pid, D, x: dx, y: dy, z: dz, fx: dx, fy: dy, fz: dz });
      links.push({ id: `spoke:${D.key}`, kind: 'spoke', source: `plant:${pid}`, target: `domain:${D.key}`, D });
    });
  });
  const pairIdx = {};
  for (const rel of K.relations) {
    const a = `plant:${rel.plant_a}`, b = `plant:${rel.plant_b}`; const key = [a, b].sort().join('|'); const idx = (pairIdx[key] = (pairIdx[key] ?? -1) + 1);
    links.push({ id: `rel:${rel.id}`, kind: 'rel', source: a, target: b, rel, curve: 0.18 + idx * 0.16, type: rel.source_type });
  }
  // keep three objects of unchanged nodes (positions are fixed anyway)
  S.nodes = nodes; S.links = links;
}

// ------------------------------------------------------------------ node & link objects
function nodeObject(n) {
  const g = new THREE.Group(); const mats = [];
  const mat = (c, a, extra = {}) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(c), transparent: true, opacity: a, depthWrite: false, ...extra }); mats.push(m); m.userData.base = a; return m; };
  if (n.kind === 'plant') {
    g.add(new THREE.Mesh(new THREE.SphereGeometry(4.2, 28, 28), mat(TYPE_COLOUR.plant, 0.72)));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(8.5, 24, 24), mat(TYPE_COLOUR.plant, 0.05, { side: THREE.BackSide })));
  } else {
    const D = n.D; const col = D.topType ? TYPE_COLOUR[D.topType] : TYPE_COLOUR.gap;
    const rad = 2.6 + 0.4 * Math.sqrt(D.nSourced);
    const face = new THREE.Group();
    face.add(new THREE.Mesh(new THREE.RingGeometry(rad - 0.45, rad, 48, 1), mat('#aeb8d0', 0.10, { side: THREE.DoubleSide })));
    if (D.coverage > 0) face.add(new THREE.Mesh(new THREE.RingGeometry(rad - 0.5, rad + 0.05, 48, 1, Math.PI / 2, Math.PI * 2 * D.coverage), mat(col, 0.95, { side: THREE.DoubleSide })));
    face.add(new THREE.Mesh(new THREE.CircleGeometry(rad - 1.1, 36), mat(col, 0.08 + 0.72 * D.verifiedShare)));
    if (D.tension) face.add(new THREE.Mesh(new THREE.RingGeometry(rad + 0.9, rad + 1.25, 36, 1, Math.PI * 1.15, Math.PI * 0.7), mat('#ff8c6b', 0.95, { side: THREE.DoubleSide })));
    if (D.conditional) face.add(new THREE.Mesh(new THREE.RingGeometry(rad + 0.9, rad + 1.25, 36, 1, Math.PI * 0.15, Math.PI * 0.7), mat('#e8c37a', 0.95, { side: THREE.DoubleSide })));
    if (D.hasCandidate) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), mat(TYPE_COLOUR.candidate, 1)); d.position.set(rad * 0.8, -rad * 0.8, 0.1); face.add(d); }
    g.add(face); g.userData.face = face;
  }
  n.__obj = { group: g, mats, factor: 1 };
  return g;
}
function linkObject(l) {
  const pts = l.kind === 'rel' ? 24 : 2;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts * 3), 3));
  let col, a, dash = false;
  if (l.kind === 'spoke') { col = l.D.topType ? TYPE_COLOUR[l.D.topType] : TYPE_COLOUR.gap; a = l.D.coverage ? 0.14 : 0.05; }
  else { col = TYPE_COLOUR[l.type] || '#888'; a = l.rel.status === 'verified' ? 0.9 : l.type === 'model' ? 0.28 : 0.6; dash = l.type === 'model'; }
  const mat = dash ? new THREE.LineDashedMaterial({ color: new THREE.Color(col), transparent: true, opacity: a, dashSize: 2.4, gapSize: 1.6 }) : new THREE.LineBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: a });
  const line = new THREE.Line(geo, mat); l.__obj = { line, mat, base: a, pts, factor: 1 }; return line;
}
function linkPositionUpdate(obj, { start, end }, l) {
  const o = l.__obj; if (!o) return false; const pos = o.line.geometry.attributes.position;
  if (o.pts === 2) { pos.setXYZ(0, start.x, start.y, start.z); pos.setXYZ(1, end.x, end.y, end.z); }
  else {
    const s = new THREE.Vector3(start.x, start.y, start.z), e = new THREE.Vector3(end.x, end.y, end.z);
    const mid = s.clone().add(e).multiplyScalar(0.5); const d = e.clone().sub(s); const len = d.length() || 1;
    const perp = new THREE.Vector3(0, 1, 0).cross(d).normalize(); if (perp.lengthSq() < 1e-6) perp.set(1, 0, 0);
    const ctrl = mid.add(perp.multiplyScalar(len * l.curve)).add(new THREE.Vector3(0, len * 0.08, 0));
    new THREE.QuadraticBezierCurve3(s, ctrl, e).getPoints(o.pts - 1).forEach((p, i) => pos.setXYZ(i, p.x, p.y, p.z));
  }
  pos.needsUpdate = true; if (o.mat.isLineDashedMaterial) o.line.computeLineDistances(); return true;
}

// ------------------------------------------------------------------ graph init
function initGraph() {
  const Graph = new ForceGraph3D($('#graph'), { controlType: 'orbit' })
    .backgroundColor('#02030a').showNavInfo(false)
    .nodeThreeObject(nodeObject).nodeThreeObjectExtend(false).nodeLabel(() => '')
    .linkThreeObject(linkObject).linkThreeObjectExtend(false).linkPositionUpdate(linkPositionUpdate)
    .linkDirectionalParticles(0).linkDirectionalParticleWidth(1.2).linkDirectionalParticleSpeed(0.006).linkDirectionalParticleColor(() => '#fff1c2')
    .enableNodeDrag(false)
    .warmupTicks(0).cooldownTicks(40)
    .onNodeClick(n => { S.swallowBg = true; if (n.kind === 'plant') go({ level: 'plant', pid: n.pid }); else go({ level: 'domain', pid: n.pid, did: n.D.id }); })
    .onNodeHover(n => { S.hoverNode = n; document.body.style.cursor = n ? 'pointer' : ''; if (n) showTip(n.kind === 'plant' ? `<em>${esc(n.P.entity.scientific_name)}</em><div class="meta">${n.P.nSourced} sourced claims · ${n.P.nVerified} verified</div>` : `${esc(n.D.label)}<div class="meta">${n.D.nCovered} of ${n.D.nFields} fields sourced · ${n.D.nSourced} claims · ${Math.round(n.D.verifiedShare * 100)}% verified${n.D.tension ? ` · ${n.D.tension} where values differ` : ''}${n.D.conditional ? ` · ${n.D.conditional} var${n.D.conditional === 1 ? 'ies' : 'y'} with conditions` : ''}</div>`); else if (!S.hoverStage) hideTip(); })
    .onLinkClick(l => { S.swallowBg = true; if (l.kind === 'rel') go({ level: 'relation', pid: l.rel.plant_a, relId: l.rel.id }); })
    .onBackgroundClick(() => { if (S.swallowBg) { S.swallowBg = false; return; } up(); });
  Graph.d3Force('charge', null); Graph.d3Force('link', null); Graph.d3Force('center', null);
  Graph.graphData({ nodes: S.nodes, links: S.links });
  Graph.scene().fog = new THREE.FogExp2(0x02030a, 0.0016);
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.4, 0.4);
  Graph.postProcessingComposer().addPass(bloom);
  Graph.cameraPosition({ x: 0, y: 230, z: 250 }, { x: 0, y: 0, z: 0 }, 0);
  S.Graph = Graph;
  const el = Graph.renderer().domElement;
  el.addEventListener('pointerdown', e => { S.pdown = [e.clientX, e.clientY]; });
  el.addEventListener('pointerup', e => { if (!S.pdown) return; const [x, y] = S.pdown; S.pdown = null; if (Math.hypot(e.clientX - x, e.clientY - y) > 4) return; const key = raycastStage(e); if (key) { S.swallowBg = true; act(key); } });
  el.addEventListener('pointermove', e => { const key = raycastStage(e); S.hoverStage = key; if (key) { document.body.style.cursor = 'pointer'; showTipForKey(key, e); } else if (!S.hoverNode) { hideTip(); document.body.style.cursor = ''; } });
  window.addEventListener('resize', () => { if (S.stage) fitStage(300); });
  (function loop() { frame(); requestAnimationFrame(loop); })();
}

// per-frame: billboard domain glyphs, project labels, apply stage alpha
function frame() {
  const G = S.Graph; if (!G) return; const cam = G.camera();
  for (const n of S.nodes) { const o = n.__obj; if (o && o.group.userData.face) o.group.userData.face.quaternion.copy(cam.quaternion); }
  if (S.stage) {
    const g = S.stage.group;
    if (S.stageAlpha < 1) { S.stageAlpha = Math.min(1, S.stageAlpha + 0.06); g.scale.setScalar(0.85 + 0.15 * S.stageAlpha); }
    g.traverse(o => { if (o.userData.mats) for (const m of o.userData.mats) { if (m.userData.base === undefined) m.userData.base = m.opacity; m.opacity = m.userData.base * S.stageAlpha * litFactor(o.userData.key); } });
  }
  projectLabels(cam);
}
function litFactor(key) {
  if (!S.lit.size || !key) return 1;
  if (!key.startsWith('claim:')) return 1;
  return S.lit.has(key) ? 1 : 0.22;
}

// ------------------------------------------------------------------ labels: HTML projected onto the scene
const labelsEl = $('#labels');
function clearLabels(scope) { S.labels = S.labels.filter(l => { if (l.scope === scope) { l.el.remove(); return false; } return true; }); }
function addLabel(scope, { pos, html, cls, key, maxw, hidden }) {
  const el = document.createElement('div'); el.className = cls; el.innerHTML = html; if (key) el.dataset.key = key; if (maxw) el.style.maxWidth = `${maxw * 7}px`;
  el.addEventListener('click', e => { const chip = e.target.closest('[data-key]'); const k = chip ? chip.dataset.key : key; if (k) { e.stopPropagation(); act(k); } });
  labelsEl.appendChild(el); const L = { scope, pos, el, key, hidden: !!hidden }; S.labels.push(L); return L;
}
const _v = new THREE.Vector3();
function projectLabels(cam) {
  const w = window.innerWidth, h = window.innerHeight;
  for (const L of S.labels) {
    if (L.hidden) { L.el.classList.add('hidden'); continue; }
    const p = typeof L.pos === 'function' ? L.pos() : L.pos;
    if (!p) { L.el.classList.add('hidden'); continue; }
    _v.copy(p); if (L.scope === 'stage' && S.stage) S.stage.group.localToWorld(_v);
    _v.project(cam);
    if (_v.z > 1 || _v.z < -1) { L.el.classList.add('hidden'); continue; }
    L.el.classList.remove('hidden');
    L.el.style.left = `${(_v.x + 1) / 2 * w}px`; L.el.style.top = `${(1 - _v.y) / 2 * h}px`;
    if (L.scope === 'stage' && L.key && L.key.startsWith('claim:')) { const lit = S.lit.size ? S.lit.has(L.key) : null; L.el.classList.toggle('lit', lit === true); L.el.classList.toggle('muted', lit === false); }
  }
}
function cosmosLabels() {
  clearLabels('cosmos');
  for (const n of S.nodes) {
    if (n.kind === 'plant') addLabel('cosmos', { pos: () => ({ x: n.x, y: n.y + 7.5, z: n.z }), html: `<em>${esc(n.P.entity.scientific_name)}</em><small>${n.P.nSourced} sourced claims · ${n.P.nVerified} verified${n.P.nCandidates ? ` · <span style="color:var(--candidate)">${n.P.nCandidates} candidate${n.P.nCandidates === 1 ? '' : 's'}</span>` : ''}</small>`, cls: 'lbl plant c', key: `plant:${n.pid}` });
    else { const D = n.D; const rad = 2.6 + 0.4 * Math.sqrt(D.nSourced); addLabel('cosmos', { pos: () => ({ x: n.x, y: n.y - rad - 1.2, z: n.z }), html: `${esc(D.label)}<small>${D.nCovered}/${D.nFields} fields · ${D.nSourced} claims</small>`, cls: 'lbl domain c', key: `domain:${D.key}` }); }
  }
}

// ------------------------------------------------------------------ view state machine
function go(view, silent = false) {
  const v = { ...view };
  if (v.level === 'claim') { const c = S.K.claims.get(v.claimId); if (!c) return; v.pid = c.plant; v.field = c.field; }
  if (v.level === 'field' || v.level === 'claim') v.did = domainOf(v.field);
  if (v.level === 'grow') { openDrawer('add'); prefillGrow(v.pid, v.field); return; }
  if (!silent && S.view) S.history.push(S.view);
  S.view = v; document.body.className = `lv-${v.level}`;
  if (v.level !== 'claim' && S.litMode === 'claim') { S.lit = new Set(); S.litMode = null; }
  updateStage(); applyDim(); moveCamera(); renderTrail(); renderPanel();
}
function up() {
  const v = S.view;
  if (v.level === 'claim') return go({ level: 'field', pid: v.pid, field: v.field });
  if (v.level === 'field') return go({ level: 'domain', pid: v.pid, did: v.did });
  if (v.level === 'domain') return go({ level: 'plant', pid: v.pid });
  if (v.level === 'relation') return go({ level: 'relations', pid: v.pid });
  if (v.level === 'relations' || v.level === 'plant') return go({ level: 'cosmos' });
  if (v.level === 'source') return go({ level: 'cosmos' });
  if (S.activation) { clearAsk(); }
}
function act(key) {
  const [kind, ...rest] = key.split(':'); const id = rest.join(':');
  if (kind === 'claim') go({ level: 'claim', claimId: id });
  else if (kind === 'field') { const [pid, field] = [id.split(':')[0], id.split(':').slice(1).join(':')]; go({ level: 'field', pid, field }); }
  else if (kind === 'plant') go({ level: 'plant', pid: id });
  else if (kind === 'domain') { const [pid, did] = id.split(':'); go({ level: 'domain', pid, did }); }
  else if (kind === 'source') go({ level: 'source', sid: id });
  else if (kind === 'relation') { const r = S.K.relations.find(x => x.id === id); if (r) go({ level: 'relation', pid: S.view.pid && (r.plant_a === S.view.pid || r.plant_b === S.view.pid) ? S.view.pid : r.plant_a, relId: id }); }
  else if (kind === 'relations') go({ level: 'relations', pid: id });
}

// ------------------------------------------------------------------ stage (lens) management
function stageKeyFor(v) {
  if (v.level === 'domain') return `fields:${v.pid}:${v.did}`;
  if (v.level === 'field' || v.level === 'claim') return `lens:${v.pid}:${v.field}`;
  if (v.level === 'source') return `source:${v.sid}`;
  if (v.level === 'relations' || v.level === 'relation') return `relations:${v.pid}`;
  return null;
}
function updateStage() {
  const v = S.view; const key = stageKeyFor(v);
  if (key !== S.stageKey) {
    if (S.stage) { S.Graph.scene().remove(S.stage.group); clearLabels('stage'); S.stage = null; }
    S.stageKey = key;
    if (key) {
      const K = S.K; let built = null; let anchor = null;
      const awayFromPlant = (dkey, pid, dist) => { const d = nodePos(dkey), p = nodePos(`plant:${pid}`); return d.clone().add(d.clone().sub(p).normalize().multiplyScalar(dist)); };
      if (v.level === 'domain') { const D = K.plants[v.pid].domains.find(d => d.id === v.did); built = buildFieldArc(D, K); anchor = awayFromPlant(`domain:${D.key}`, v.pid, 14); }
      else if (v.level === 'field' || v.level === 'claim') {
        const F = K.plants[v.pid].fields[v.field];
        built = F.lens === 'ruler' ? buildRuler(F, K, { showRetired: !!S.showRetired }) : F.lens === 'spectrum' ? buildSpectrum(F, K, S.db.schema, vocabOrder) : buildNotes(F, K);
        anchor = null; built.besidePlant = v.pid;
      }
      else if (v.level === 'source') { built = buildSourceLens(K.sources[v.sid], K); anchor = new THREE.Vector3(0, 0, 0); }
      else if (v.level === 'relations' || v.level === 'relation') { built = buildRelations(K.plants[v.pid], K); anchor = null; built.besidePlant = v.pid; }
      if (built) {
        const cam = S.Graph.camera();
        if (built.besidePlant) {
          const pp = nodePos(`plant:${built.besidePlant}`); const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
          const leftEdge = (built.cx || 0) - built.w / 2;            // local x of the content's left edge
          anchor = pp.clone().add(right.multiplyScalar(10 - leftEdge));
          built.fitW = built.w + 22; built.fitCx = (built.cx || 0) - 11;   // frame the plant glow too
        }
        built.group.position.copy(anchor); built.group.quaternion.copy(cam.quaternion);
        // face the camera as it is now, pulled a little toward it so the glyph behind stays visible as context
        const toCam = new THREE.Vector3().copy(cam.position).sub(anchor).normalize(); built.group.position.add(toCam.multiplyScalar(6));
        built.group.traverse(o => { if (o.userData.mats) for (const m of o.userData.mats) m.userData.base = m.opacity; });
        S.Graph.scene().add(built.group); S.stage = built; S.stageAlpha = 0.05;
        for (const L of built.labels) addLabel('stage', L);
      }
    }
  }
  // highlight within the stage
  if (v.level === 'claim') { S.lit = new Set([`claim:${v.claimId}`]); S.litMode = 'claim'; }
  else if (S.litMode === 'claim') { S.lit = new Set(); S.litMode = null; }
  if (v.level === 'relation' && S.stage) { S.lit = new Set(); }
}
function nodePos(id) { const n = S.nodes.find(x => x.id === id); return n ? new THREE.Vector3(n.x, n.y, n.z) : new THREE.Vector3(); }

// ------------------------------------------------------------------ dimming of the cosmos per view
function applyDim() {
  const v = S.view; const act = S.activation;
  for (const n of S.nodes) {
    let f = 1, lab = 'show';
    if (act) { f = act.nodes.has(n.id) ? 1 : 0.12; lab = act.nodes.has(n.id) ? 'show' : 'muted'; }
    if (v.level === 'plant' || v.level === 'relations' || v.level === 'relation') { if (n.pid !== v.pid) { f = Math.min(f, 0.12); lab = 'muted'; } if (v.level !== 'plant' && n.kind === 'domain') { f = 0.1; lab = 'hide'; } }
    else if (v.level === 'domain' || v.level === 'field' || v.level === 'claim') {
      if (n.pid !== v.pid) { f = 0.07; lab = 'hide'; }
      else if (n.kind === 'domain') { const mine = n.D.id === v.did; f = mine ? 0.3 : 0.05; lab = 'hide'; }
      else { f = v.level === 'domain' ? 0.6 : 0.55; lab = 'show'; }
    }
    else if (v.level === 'source') { const Ssrc = S.K.sources[v.sid]; if (n.kind === 'plant') { f = Ssrc.plants.has(n.pid) ? 0.5 : 0.1; lab = 'hide'; } else { f = 0.06; lab = 'hide'; } }
    const o = n.__obj; if (o) for (const m of o.mats) m.opacity = m.userData.base * f;
    const L = S.labels.find(l => l.scope === 'cosmos' && l.key === (n.kind === 'plant' ? `plant:${n.pid}` : `domain:${n.D.key}`));
    if (L) { L.hidden = lab === 'hide'; L.el.classList.toggle('muted', lab === 'muted'); }
  }
  for (const l of S.links) {
    let f = 1;
    if (act) f = act.links.has(l.id) ? 1.6 : 0.1;
    if (v.level !== 'cosmos') { const pidOf = l.kind === 'spoke' ? l.D.pid : null; if (l.kind === 'spoke') f = pidOf === v.pid ? (v.level === 'plant' ? 1 : 0.25) : 0.05; else f = (v.level === 'plant' || v.level === 'relations' || v.level === 'relation') ? ((l.rel.plant_a === v.pid || l.rel.plant_b === v.pid) ? 1 : 0.08) : 0.06; }
    if (v.level === 'relation' && l.kind === 'rel') f = l.rel.id === v.relId ? 1.6 : 0.12;
    const o = l.__obj; if (o) o.mat.opacity = Math.min(1, o.base * f);
  }
  S.Graph.linkDirectionalParticles(l => S.flow.has(l.id) ? 3 : 0);
}

// ------------------------------------------------------------------ camera
let camToken = 0;
function moveCamera() {
  const v = S.view; const G = S.Graph;
  if (v.level === 'cosmos') { fitPoint(new THREE.Vector3(0, 0, 0), 248, 172, 1400, true, new THREE.Vector3(0, 0.95, 1)); return; }
  if (v.level === 'plant') { const p = nodePos(`plant:${v.pid}`); fitPoint(p, 72, 58, 1300, true); return; }
  if (S.stage) fitStage(1300);
}
// the free area of the screen: between an open drawer (left) and the panel (right), under the header
function usable() {
  const drawer = document.querySelector('.drawer.open'); const left = drawer ? drawer.getBoundingClientRect().right + 16 : 20; const right = window.innerWidth - PANEL_W;
  return { left, right, w: Math.max(260, right - left) / window.innerWidth, h: Math.max(300, window.innerHeight - 180) / window.innerHeight, dx: (left + right) / 2 - window.innerWidth / 2 };
}
function fitStage(ms) {
  const st = S.stage; if (!st) return;
  const centre = st.group.localToWorld(new THREE.Vector3(st.fitCx ?? st.cx ?? 0, 0, 0)); const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(st.group.quaternion);
  const d = fitDistance(st.fitW ?? st.w, st.h); const cam = S.Graph.camera(); const U = usable();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(st.group.quaternion); const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(st.group.quaternion);
  const hV = 2 * d * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2); const upp = hV / window.innerHeight;
  const look = centre.clone().add(right.multiplyScalar(-U.dx * upp)).add(upv.multiplyScalar(-14 * upp));
  const pos = look.clone().add(normal.multiplyScalar(d));
  S.Graph.cameraPosition({ x: pos.x, y: pos.y, z: pos.z }, { x: look.x, y: look.y, z: look.z }, ms);
}
function fitDistance(w, h) {
  const cam = S.Graph.camera(); const fov = THREE.MathUtils.degToRad(cam.fov); const aspect = window.innerWidth / window.innerHeight; const U = usable();
  const dW = (w / U.w) / (2 * Math.tan(fov / 2) * aspect); const dH = (h / U.h) / (2 * Math.tan(fov / 2));
  return Math.max(dW, dH) * 1.06 + 4;
}
function fitPoint(centre, w, h, ms, offsetForPanel, fixedDir) {
  const cam = S.Graph.camera(); const d = fitDistance(w, h);
  let dir = fixedDir ? fixedDir.clone() : new THREE.Vector3().copy(cam.position).sub(centre); if (dir.lengthSq() < 1) dir.set(0, 0.3, 1); dir.normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
  const hV = 2 * d * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2); const upp = hV / window.innerHeight;
  const look = centre.clone(); if (offsetForPanel) look.add(right.multiplyScalar(-usable().dx * upp));
  const pos = look.clone().add(dir.multiplyScalar(d));
  S.Graph.cameraPosition({ x: pos.x, y: pos.y, z: pos.z }, { x: look.x, y: look.y, z: look.z }, ms);
}

// ------------------------------------------------------------------ raycast against the stage
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
function raycastStage(e) {
  if (!S.stage || !S.stage.hits.length) return null;
  const el = S.Graph.renderer().domElement; const r = el.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, S.Graph.camera()); ray.params.Line.threshold = 1.2;
  const hits = ray.intersectObjects(S.stage.hits, true);
  for (const h of hits) { let o = h.object; while (o && !o.userData.key) o = o.parent; if (o && o.userData.key) return o.userData.key; }
  return null;
}
const tip = $('#tip');
function showTip(html) { tip.innerHTML = html; tip.style.display = 'block'; }
function hideTip() { tip.style.display = 'none'; }
document.addEventListener('pointermove', e => { if (tip.style.display !== 'none') { tip.style.left = `${Math.min(window.innerWidth - 340, e.clientX + 14)}px`; tip.style.top = `${e.clientY + 14}px`; } });
function showTipForKey(key) {
  const [kind, ...rest] = key.split(':'); const id = rest.join(':');
  if (kind === 'claim') { const c = S.K.claims.get(id); if (!c) return; const p = parseContext(c, S.db.sources[c.source_id]); showTip(`<span class="val">${esc(summariseValue(c))}</span> · ${esc(S.K.sources[c.source_id]?.label || c.source_id)}<div class="meta">${esc(c.status)} · ${p.laneLabel !== 'condition not stated' ? esc(p.laneLabel) + ' · ' : ''}${esc(p.region || '')} · ${esc(c.id)}</div>`); }
  else if (kind === 'field') { const F = S.K.fieldIndex.get(id); if (F) showTip(`${esc(F.label)}<div class="meta">${F.sourced.length} sourced claims · ${esc(F.status)} · ${F.verified.length} verified</div>`); }
  else if (kind === 'relation') { const r = S.K.relations.find(x => x.id === id); if (r) showTip(`${esc(r.text || r.relation_type)}<div class="meta">${esc(r.source_id)} · ${esc(r.status)}</div>`); }
}

// ------------------------------------------------------------------ trail
function renderTrail() {
  const v = S.view; const K = S.K; const crumbs = [{ label: 'Cosmos', go: { level: 'cosmos' } }];
  if (v.pid && v.level !== 'source') crumbs.push({ label: K.plants[v.pid].entity.scientific_name, go: { level: 'plant', pid: v.pid }, em: true });
  if (v.did && (v.level === 'domain' || v.level === 'field' || v.level === 'claim')) crumbs.push({ label: K.plants[v.pid].domains.find(d => d.id === v.did).label, go: { level: 'domain', pid: v.pid, did: v.did } });
  if (v.field) crumbs.push({ label: v.field.replace(/_/g, ' '), go: { level: 'field', pid: v.pid, field: v.field } });
  if (v.level === 'claim') { const c = K.claims.get(v.claimId); crumbs.push({ label: K.sources[c.source_id]?.label || c.source_id, go: v }); }
  if (v.level === 'relations' || v.level === 'relation') crumbs.push({ label: 'relations', go: { level: 'relations', pid: v.pid } });
  if (v.level === 'relation') crumbs.push({ label: (K.relations.find(r => r.id === v.relId) || {}).relation_type || 'relation', go: v });
  if (v.level === 'source') crumbs.push({ label: K.sources[v.sid].label, go: v });
  $('#trail').innerHTML = crumbs.map((c, i) => `${i ? '<span class="sep">›</span>' : ''}<button data-go='${esc(JSON.stringify(c.go))}' class="${i === crumbs.length - 1 ? 'here' : ''}">${c.em ? '<em>' : ''}${esc(c.label)}${c.em ? '</em>' : ''}</button>`).join('');
  bind($('#trail'));
}
function bind(root) {
  root.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); go(JSON.parse(el.dataset.go)); }));
  root.querySelectorAll('[data-key]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); act(el.dataset.key); }));
  root.querySelectorAll('[data-src]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); go({ level: 'source', sid: el.dataset.src }); }));
}

// ------------------------------------------------------------------ panel
const P = $('#panel-body');
const stDot = (c) => { const st = c.source_type === 'candidate' ? 'candidate' : !isLive(c) ? 'retired' : c.status; return `<i class="st ${st}" style="--c:${TYPE_COLOUR[c.source_type] || '#888'}"></i>`; };
const statusWord = (s, F) => `<span class="status ${esc(s.replace(/ /g, '-'))}">${esc(s)}</span>${F && F.differ && F.conditional ? ` <span class="status varies-with-conditions">+ varies with conditions</span>` : ''}`;
const typeTag = t => `<span class="tag" style="color:${TYPE_COLOUR[t] || '#888'}">${esc(t)}</span>`;
const statusTag = s => `<span class="tag ${esc(s)}">${esc(s)}</span>`;
const srcMix = types => { const tot = Object.values(types).reduce((a, b) => a + b, 0) || 1; return `<div class="srcmix">${Object.entries(types).sort((a, b) => b[1] - a[1]).map(([t, n]) => `<i style="width:${100 * n / tot}%;background:${TYPE_COLOUR[t] || '#888'}" title="${esc(t)} ${n}"></i>`).join('')}</div>`; };
const claimRow = (c, F, extra = '', cls = '') => { const p = F.parsed.get(c.id) || parseContext(c, S.db.sources[c.source_id]); return `<div class="row ${cls}" data-key="claim:${esc(c.id)}">${stDot(c)}<div><span class="val">${esc(summariseValue(c))}</span> <span class="muted">${p.laneLabel !== 'condition not stated' ? esc(p.laneLabel) : ''}</span><br><span class="meta">${esc(S.K.sources[c.source_id]?.label || c.source_id)}${p.region ? ' · ' + esc(p.region) : ''} · ${esc(c.source_type === 'candidate' ? 'candidate' : !isLive(c) ? 'retired' : c.status)}${extra}</span></div></div>`; };
function nextHtml(view) {
  const sug = suggestions(S.K, view); if (!sug.length) return '';
  return `<h3>Continue</h3>${sug.map(s => `<div class="next ${s.go.level === 'grow' ? 'grow' : ''}" data-go='${esc(JSON.stringify(s.go))}'>${esc(s.text)}<div class="why">${esc(s.why)}</div></div>`).join('')}`;
}
function renderPanel() {
  const v = S.view; const K = S.K;
  if (v.level === 'cosmos') P.innerHTML = cosmosHtml();
  else if (v.level === 'plant') P.innerHTML = plantHtml(K.plants[v.pid]);
  else if (v.level === 'domain') P.innerHTML = domainHtml(K.plants[v.pid].domains.find(d => d.id === v.did));
  else if (v.level === 'field') P.innerHTML = fieldHtml(K.plants[v.pid].fields[v.field]);
  else if (v.level === 'claim') P.innerHTML = claimHtml(K.claims.get(v.claimId), K.plants[v.pid].fields[v.field]);
  else if (v.level === 'source') P.innerHTML = sourceHtml(K.sources[v.sid]);
  else if (v.level === 'relations') P.innerHTML = relationsHtml(K.plants[v.pid]);
  else if (v.level === 'relation') P.innerHTML = relationHtml(K.relations.find(r => r.id === v.relId));
  bind(P);
  P.querySelectorAll('[data-toggle-retired]').forEach(el => el.addEventListener('click', () => { S.showRetired = !S.showRetired; S.stageKey = null; updateStage(); fitStage(600); renderPanel(); }));
  P.querySelectorAll('[data-raw]').forEach(el => el.addEventListener('click', () => { const pre = el.nextElementSibling; pre.style.display = pre.style.display === 'none' ? 'block' : 'none'; }));
  P.scrollTop = 0;
}
function cosmosHtml() {
  const K = S.K; const plants = Object.values(K.plants);
  const total = plants.reduce((a, p) => a + p.nSourced, 0), ver = plants.reduce((a, p) => a + p.nVerified, 0);
  const srcs = Object.values(K.sources).filter(s => s.id !== 'candidate' && s.claims.some(isSourced)).sort((a, b) => b.claims.filter(isSourced).length - a.claims.filter(isSourced).length);
  return `<h2>Neural Cosmos</h2><div class="kicker">${total} sourced claims · ${ver} verified · ${plants.length} plants · ${K.domains.length} knowledge domains each</div>
  <p class="lead">Each plant carries six domains of knowledge. A domain's arc shows how many of its fields have a source, its glow how much is verified, its colour who supplied most of it. Amber marks values that change with site conditions; red, values that differ under the same stated condition.</p>
  <h3>Start from a plant</h3>
  ${plants.map(p => `<div class="row" data-go='${esc(JSON.stringify({ level: 'plant', pid: p.id }))}'><i class="st verified" style="--c:${TYPE_COLOUR.plant}"></i><div><em class="val">${esc(p.entity.scientific_name)}</em> <span class="muted">${esc((p.entity.common_names?.en || [])[0] || '')}</span><br><span class="meta">${p.nSourced} sourced · ${p.nVerified} verified · ${p.domains.filter(d => d.tension).length} domain${p.domains.filter(d => d.tension).length === 1 ? '' : 's'} with differing values · ${p.domains.filter(d => d.conditional).length} varying with conditions</span><div style="display:flex;gap:3px;margin-top:4px">${p.domains.map(d => `<div class="bar" style="flex:1" title="${esc(d.label)}"><i style="width:${d.coverage * 100}%;--c:${d.topType ? TYPE_COLOUR[d.topType] : TYPE_COLOUR.gap}"></i><i class="v" style="width:${d.coverage * d.verifiedShare * 100}%;--c:${d.topType ? TYPE_COLOUR[d.topType] : TYPE_COLOUR.gap}"></i></div>`).join('')}</div></div></div>`).join('')}
  <h3>Or from a source</h3>
  ${srcs.slice(0, 8).map(s => `<div class="row" data-src="${esc(s.id)}"><i class="st verified" style="--c:${TYPE_COLOUR[s.type]}"></i><div><span class="val">${esc(s.label)}</span> <span class="muted">${esc(s.type)}${s.geo ? ' · ' + esc(GEO_LABEL[s.geo] || s.geo) : ''}</span><br><span class="meta">${s.claims.filter(isSourced).length} claims on ${s.plants.size} plant${s.plants.size === 1 ? '' : 's'}${s.rec.licence_tier ? ' · licence tier ' + esc(s.rec.licence_tier) : ''}</span></div></div>`).join('')}
  <h3>Or ask</h3><p class="muted">“Ask” runs the retrieval preview and lights the knowledge a question would activate. “Add observation” grows a candidate into a field.</p>
  ${nextHtml({ level: 'cosmos' })}`;
}
function plantHtml(Pn) {
  const e = Pn.entity; const standout = [];
  for (const F of Object.values(Pn.fields)) { if (F.differ || F.conditional) standout.push(F); }
  const gaps = Object.values(Pn.fields).filter(F => F.status === 'gap' && (F.tier === 'gate' || F.planned.length));
  const local = Object.values(Pn.fields).filter(F => F.verified.length);
  const rels = S.K.relations.filter(r => r.plant_a === Pn.id || r.plant_b === Pn.id);
  return `<h2><em>${esc(e.scientific_name)}</em></h2><div class="kicker">${esc((e.common_names?.en || []).join(' · '))} · ${esc(e.kpu_plant_type || '')} · ${esc((e.origin_status || '').replace(/_/g, ' '))}</div>
  <p class="lead">${Pn.nSourced} sourced claims, ${Pn.nVerified} verified${Pn.nCandidates ? `, <span style="color:var(--candidate)">${Pn.nCandidates} candidate${Pn.nCandidates === 1 ? '' : 's'} this session</span>` : ''}.</p>
  <h3>Knowledge domains</h3>
  ${Pn.domains.map(d => `<div class="row" data-go='${esc(JSON.stringify({ level: 'domain', pid: Pn.id, did: d.id }))}'><i class="st ${d.nSourced ? 'verified' : 'gap'}" style="--c:${d.topType ? TYPE_COLOUR[d.topType] : TYPE_COLOUR.gap}"></i><div><span class="val">${esc(d.label)}</span> <span class="meta">${d.nCovered}/${d.nFields} fields · ${d.nSourced} claims · ${Math.round(d.verifiedShare * 100)}% verified</span><div class="bar"><i style="width:${d.coverage * 100}%;--c:${d.topType ? TYPE_COLOUR[d.topType] : TYPE_COLOUR.gap}"></i><i class="v" style="width:${d.coverage * d.verifiedShare * 100}%;--c:${d.topType ? TYPE_COLOUR[d.topType] : TYPE_COLOUR.gap}"></i></div>${d.tension ? `<span class="status values-differ">${d.tension} field${d.tension === 1 ? '' : 's'} where values differ</span> ` : ''}${d.conditional ? `<span class="status varies-with-conditions">${d.conditional} var${d.conditional === 1 ? 'ies' : 'y'} with conditions</span> ` : ''}${d.gaps ? `<span class="status gap">${d.gaps} gap${d.gaps === 1 ? '' : 's'}</span>` : ''}</div></div>`).join('')}
  ${standout.length ? `<h3>Where sources pull apart</h3>${standout.map(F => `<div class="row" data-key="field:${esc(F.key)}"><i class="st unverified" style="--c:${TYPE_COLOUR[F.topType] || '#888'}"></i><div><span class="val">${esc(F.label)}</span> ${statusWord(F.status, F)}<br><span class="meta">${F.nSources} sources · ${F.lanes.filter(l => l.kind !== 'none').map(l => l.label).join(', ') || 'no stated condition'}</span></div></div>`).join('')}` : ''}
  ${gaps.length ? `<h3>Gaps</h3>${gaps.map(F => `<div class="row" data-key="field:${esc(F.key)}"><i class="st gap"></i><div><span class="val">${esc(F.label)}</span> <span class="meta">${esc(F.tier)}${F.planned.length ? ' · planned: ' + esc(F.planned.join(', ')) : ''}${F.retired.length ? ' · ' + F.retired.length + ' retired placeholder' : ''}</span></div></div>`).join('')}` : ''}
  ${local.length ? `<h3>Verified evidence</h3>${local.map(F => `<div class="row" data-key="field:${esc(F.key)}"><i class="st verified" style="--c:${TYPE_COLOUR[F.verified[0].source_type]}"></i><div><span class="val">${esc(F.label)}</span> <span class="meta">${F.verified.length} verified · ${[...new Set(F.verified.map(c => S.K.sources[c.source_id]?.label))].join(', ')}</span></div></div>`).join('')}` : ''}
  ${rels.length ? `<h3>Relations</h3><div class="row" data-go='${esc(JSON.stringify({ level: 'relations', pid: Pn.id }))}'><i class="st verified" style="--c:${TYPE_COLOUR.practitioner}"></i><div><span class="val">${rels.length} recorded</span> <span class="meta">${rels.filter(r => r.status === 'verified').length} verified · ${rels.filter(r => r.source_type === 'model').length} model placeholders</span></div></div>` : ''}
  ${nextHtml(S.view)}`;
}
function domainHtml(D) {
  return `<h2>${esc(D.label)}</h2><div class="kicker"><em>${esc(S.K.plants[D.pid].entity.scientific_name)}</em> · ${D.nCovered} of ${D.nFields} fields sourced · ${D.nSourced} claims · ${D.nVerified} verified</div>
  ${D.nSourced ? srcMix(Object.values(D.fields).reduce((acc, F) => { for (const [t, n] of Object.entries(F.types)) acc[t] = (acc[t] || 0) + n; return acc; }, {})) : ''}
  <h3>Fields</h3>
  ${D.fields.map(F => `<div class="row ${F.status === 'gap' ? 'dim' : ''}" data-key="field:${esc(F.key)}"><i class="st ${F.status === 'gap' ? 'gap' : F.verifiedShare === 1 ? 'verified' : 'unverified'}" style="--c:${F.topType ? TYPE_COLOUR[F.topType] : TYPE_COLOUR.gap}"></i><div><span class="val">${esc(F.label)}</span> ${statusWord(F.status, F)}<br><span class="meta">${F.status === 'gap' ? (F.planned.length ? 'planned: ' + esc(F.planned.join(', ')) : 'no source planned') + (F.retired.length ? ' · ' + F.retired.length + ' retired placeholder' : '') : `${F.sourced.length} claim${F.sourced.length === 1 ? '' : 's'} · ${F.nSources} source${F.nSources === 1 ? '' : 's'} · ${F.verified.length} verified${F.candidates.length ? ` · <span style="color:var(--candidate)">${F.candidates.length} candidate</span>` : ''}`}</span></div></div>`).join('')}
  ${nextHtml(S.view)}`;
}
function laneRange(cs) { const ns = cs.map(numeric).filter(Boolean); if (!ns.length) return null; return [Math.min(...ns.map(n => n.lo)), Math.max(...ns.map(n => Math.max(n.hi, n.occasional || 0)))]; }
function fieldLead(F) {
  const K = S.K;
  if (F.status === 'gap') return `No sourced claim yet.${F.planned.length ? ` The fill plan names ${F.planned.join(', ')}.` : ''}${F.retired.length ? ` ${F.retired.length} model placeholder${F.retired.length === 1 ? ' was' : 's were'} retired.` : ''}`;
  if (F.lens === 'ruler') {
    const parts = [];
    for (const lane of F.lanes) {
      const cs = lane.claims.filter(c => c.source_type !== 'candidate'); if (!cs.length) continue;
      const r = laneRange(cs); if (!r) continue;
      const who = [...new Set(cs.map(c => K.sources[c.source_id]?.label || c.source_id))];
      const kinds = cs.map(numeric).filter(Boolean).map(n => n.kind);
      const rangeText = r[0] === r[1] ? `${fmt(r[0])} ${F.unit}` : (r[0] === 0 && kinds.every(k => k === 'max' || k === 'typical')) ? `up to ${fmt(r[1])} ${F.unit}` : `${fmt(r[0])}–${fmt(r[1])} ${F.unit}`;
      parts.push(lane.kind === 'none' ? `With no condition stated, ${who.length === 1 ? who[0] + ' gives' : who.length + ' sources give'} ${rangeText}` : lane.kind === 'cultivar' ? `For ${lane.label}, ${who.join(' and ')} give${who.length === 1 ? 's' : ''} ${rangeText}` : `Under ${lane.label}, ${who.join(' and ')} give${who.length === 1 ? 's' : ''} ${rangeText}`);
    }
    const tails = [];
    if (F.conditional) tails.push('Across conditions the values differ because the stated growing condition or cultivar differs — that is not a contradiction between sources.');
    if (F.differ) { const pr = F.differPairs[0]; tails.push(`Under the same stated condition, ${K.sources[pr[0].source_id]?.label} (${summariseValue(pr[0])}) and ${K.sources[pr[1].source_id]?.label} (${summariseValue(pr[1])}) do not overlap${F.differPairs.length > 1 ? `, and ${F.differPairs.length - 1} more pair${F.differPairs.length > 2 ? 's' : ''} like it` : ''} — a disagreement for a reviewer, not for the ranking.`); }
    if (!F.differ && !F.conditional && F.status === 'sources agree') tails.push('The ranges overlap.');
    return `${parts.join('. ')}. ${tails.join(' ')}`;
  }
  if (F.lens === 'spectrum') {
    const lists = F.sourced.filter(c => Array.isArray(c.value)); const counts = {}; for (const c of lists) for (const v of c.value) counts[v] = (counts[v] || 0) + 1;
    const common = Object.entries(counts).filter(([, n]) => n >= Math.max(2, lists.length - 1)).map(([v]) => v);
    const narrow = lists.filter(c => c.value.length === 1 && (counts[c.value[0]] || 0) <= lists.length / 2);
    let tail = '';
    if (F.differ && F.differPairs.length) tail = ` ${F.differPairs.slice(0, 2).map(([a, b]) => `${K.sources[a.source_id]?.label} (${a.value.join(', ')}) and ${K.sources[b.source_id]?.label} (${b.value.join(', ')}) share no value`).join('; ')} — on this ordinal vocabulary that is a disagreement.`;
    else if (F.outliers.length) tail = ` ${F.outliers.map(c => K.sources[c.source_id]?.label).join(', ')} share${F.outliers.length === 1 ? 's' : ''} no value with the others.`;
    else if (narrow.length) tail = ` ${narrow.map(c => `${K.sources[c.source_id]?.label} lists only ${c.value[0]}`).join('; ')}.`;
    return `${lists.length} source${lists.length === 1 ? '' : 's'} list ${Object.keys(counts).length} values.${common.length ? ` Most agree on ${common.join(', ')}.` : ''}${tail}`;
  }
  return `${F.sourced.length} reading${F.sourced.length === 1 ? '' : 's'} from ${F.nSources} source${F.nSources === 1 ? '' : 's'}; values are structured notes, laid out as a stack.`;
}
function aiUse(F) {
  const n = S.use.n; const cited = new Map();
  for (const c of F.sourced) for (const u of (S.use.cited.get(c.id) || [])) cited.set(u.qid, u);
  const withheld = F.sourced.filter(c => S.use.withheld.has(c.id)).length;
  return `<p class="muted">The retrieval preview cites claims from this field in <b>${cited.size} of ${n}</b> test queries${cited.size ? ` (${[...cited.keys()].join(', ')})` : ''}${withheld ? `; ${withheld} practitioner claim${withheld === 1 ? ' is' : 's are'} withheld as L0` : ''}. Test queries are proxy wordings until the survey export lands.</p>`;
}
function fieldHtml(F) {
  const K = S.K; const Pn = K.plants[F.pid];
  const ordered = []; for (const lane of F.lanes) for (const c of lane.claims) ordered.push(c);
  const sources = [...new Set(F.sourced.map(c => c.source_id))];
  return `<h2>${esc(F.label)}</h2><div class="kicker"><em>${esc(Pn.entity.scientific_name)}</em> · ${esc(K.plants[F.pid].domains.find(d => d.id === F.domain).label)} · ${esc(F.tier)} field · ${statusWord(F.status, F)}</div>
  <p class="lead">${esc(fieldLead(F))}</p>
  ${F.def && F.def.description ? `<p class="muted">${esc(F.def.description)}</p>` : ''}
  <h3>Readings</h3>
  ${ordered.length ? ordered.map(c => claimRow(c, F)).join('') : '<p class="muted">none</p>'}
  ${F.retired.length ? `<p class="muted"><span class="toggle" data-toggle-retired>${S.showRetired ? 'hide' : 'show'} ${F.retired.length} retired model placeholder${F.retired.length === 1 ? '' : 's'}</span></p>` : ''}
  ${sources.length ? `<h3>Where it comes from</h3>${sources.map(sid => { const s = K.sources[sid]; return `<div class="row" data-src="${esc(sid)}"><i class="st verified" style="--c:${TYPE_COLOUR[s.type]}"></i><div><span class="val">${esc(s.label)}</span> <span class="meta">${esc(s.type)}${s.geo ? ' · ' + esc(GEO_LABEL[s.geo] || s.geo) : ''}${s.rec.licence_tier ? ' · tier ' + esc(s.rec.licence_tier) : ''} · ${s.claims.filter(c => c.plant === F.pid && c.field === F.field).length} here, ${s.claims.filter(isSourced).length} in the store</span></div></div>`; }).join('')}` : ''}
  <h3>Verification</h3><p class="muted">${F.verified.length} of ${F.sourced.length} verified${F.sourced.length > F.verified.length ? ' · the rest await a reviewer (decision D5); unverified claims are shown hollow' : ''}${F.candidates.length ? ` · <span style="color:var(--candidate)">${F.candidates.length} candidate${F.candidates.length === 1 ? '' : 's'}, never citable</span>` : ''}.</p>
  <h3>AI use</h3>${aiUse(F)}
  ${nextHtml(S.view)}`;
}
function claimHtml(c, F) {
  const K = S.K; const s = S.db.sources[c.source_id] || {}; const Srec = K.sources[c.source_id]; const p = F.parsed.get(c.id) || parseContext(c, s);
  const sib = F.sourced.filter(x => x.id !== c.id);
  const rels = sib.map(x => ({ x, r: relate(c, x, p, F.parsed.get(x.id)) }));
  const uses = S.use.cited.get(c.id) || []; const wh = S.use.withheld.get(c.id) || [];
  const live = isLive(c); const st = c.source_type === 'candidate' ? 'candidate' : !live ? 'retired' : c.status;
  const meta = c.practitioner_meta;
  return `<h2>${esc(summariseValue(c))}</h2><div class="kicker">${esc(F.label)} · <em>${esc(K.plants[c.plant].entity.scientific_name)}</em> · ${statusTag(st)}${typeTag(c.source_type)}</div>
  <h3>Source</h3><div class="row" ${Srec && c.source_type !== 'candidate' ? `data-src="${esc(c.source_id)}"` : ''}><i class="st verified" style="--c:${TYPE_COLOUR[c.source_type]}"></i><div><span class="val">${esc(Srec?.label || c.source_id)}</span><br><span class="meta">${esc(c.source_type)}${s.geo_specificity ? ' · ' + esc(GEO_LABEL[s.geo_specificity] || s.geo_specificity) : ''}${s.licence_tier ? ' · licence tier ' + esc(s.licence_tier) : ''}${s.observer_background ? ' · ' + esc(s.observer_background) : ''}</span>${s.url ? `<br><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url.replace(/^https?:\/\//, '').slice(0, 48))}</a>` : ''}</div></div>
  <h3>Claim</h3><p>${esc(c.text || '')}</p>${c.note ? `<p class="muted">${esc(c.note)}</p>` : ''}
  <h3>Context &amp; applicability</h3><table>
  ${p.cultivar ? `<tr><th>cultivar</th><td>‘${esc(p.cultivar)}’</td></tr>` : '<tr><th>scope</th><td>species</td></tr>'}
  <tr><th>condition</th><td>${p.condition ? esc(p.condition) : '<span class="faint">not stated</span>'}</td></tr>
  <tr><th>region</th><td>${esc(p.region || '—')}${s.geo_specificity ? ` <span class="faint">(source geo: ${esc(s.geo_specificity)})</span>` : ''}</td></tr>
  ${p.subset ? `<tr><th>subset</th><td>${esc(p.subset)}</td></tr>` : ''}
  <tr><th>context</th><td class="muted">${esc(c.context || '')}</td></tr></table>
  <h3>Status</h3><table>
  <tr><th>status</th><td>${statusTag(st)}${c.source_type === 'candidate' ? '<span class="faint">this session only · citable: false</span>' : st === 'unverified' ? '<span class="faint">awaits a reviewer (D5); ranked, cited with [unverified]</span>' : st === 'retired' ? `<span class="faint">retired${c.retired_by ? ' by ' + esc(c.retired_by) : ''}${c.retired_at ? ' on ' + esc(c.retired_at) : ''}</span>` : ''}</td></tr>
  <tr><th>confidence</th><td>${c.confidence ?? '—'}</td></tr>
  ${c.recorded_at ? `<tr><th>recorded</th><td>${esc(c.recorded_at)}${c.recorded_by ? ' · ' + esc(c.recorded_by) : ''}</td></tr>` : ''}
  ${c.derived_from ? `<tr><th>derived from</th><td>${(Array.isArray(c.derived_from) ? c.derived_from : [c.derived_from]).map(d => `<span class="id" data-key="claim:${esc(d)}" style="cursor:pointer">${esc(d)}</span>`).join('<br>')}</td></tr>` : ''}
  ${meta ? `<tr><th>practitioner</th><td class="muted">basis ${esc(meta.basis || '—')} · location ${esc(meta.location || '—')} · completeness ${esc(meta.completeness || '—')} · citable ${meta.citable === false ? 'no' : 'yes'}</td></tr>` : ''}
  <tr><th>id</th><td class="id">${esc(c.id)}</td></tr></table>
  ${rels.length ? `<h3>Related evidence on this field</h3>${rels.map(({ x, r }) => claimRow(x, F, ` · <span class="rel ${r.cls}">${esc(r.kind)}</span>`)).join('')}` : ''}
  <h3>AI use</h3><p class="muted">${c.source_type === 'candidate' ? 'Candidates enter the recall corpus but are never cited; a question that recalls this one lists it as unverified user input.' : wh.length ? `Withheld from answers (L0, not citable) in ${wh.length} test quer${wh.length === 1 ? 'y' : 'ies'}: ${wh.map(u => u.qid).join(', ')}.` : uses.length ? `Cited by the retrieval preview in ${uses.length} of ${S.use.n} test queries: ${uses.map(u => `${u.qid} (rank ${u.rank})`).join(', ')}. ${st === 'unverified' ? 'Attributed with “[unverified]”.' : ''}` : `Not cited in any of the ${S.use.n} test queries${!live ? ' (retired claims are never retrieved)' : ''}.`}</p>
  <p><span class="toggle" data-raw>raw record</span></p><pre style="display:none">${esc(JSON.stringify(c, null, 2))}</pre>
  ${nextHtml(S.view)}`;
}
function sourceHtml(Ssrc) {
  const rec = Ssrc.rec; const K = S.K;
  const byPlant = Object.keys(K.plants).map(pid => ({ pid, cs: Ssrc.claims.filter(c => c.plant === pid && isLive(c)) })).filter(x => x.cs.length);
  return `<h2>${esc(Ssrc.label)}</h2><div class="kicker">${typeTag(Ssrc.type)}${Ssrc.geo ? esc(GEO_LABEL[Ssrc.geo] || Ssrc.geo) : ''}${rec.licence_tier ? ' · licence tier ' + esc(rec.licence_tier) : ''}</div>
  ${rec.name ? `<p class="lead">${esc(rec.name)}${rec.publisher ? ` <span class="muted">· ${esc(rec.publisher)}</span>` : ''}</p>` : ''}
  ${rec.role_in_db ? `<p class="muted">${esc(rec.role_in_db)}</p>` : ''}
  ${rec.observer_background ? `<p class="muted">${esc(rec.observer_background)}</p>` : ''}
  ${rec.url ? `<p><a href="${esc(rec.url)}" target="_blank" rel="noopener">${esc(rec.url.replace(/^https?:\/\//, ''))}</a></p>` : ''}
  <h3>Trust</h3><table><tr><th>type</th><td>${esc(Ssrc.type)} · R5 priority ${(S.retr.SRC_PRIORITY[Ssrc.type] ?? 8) + 1}</td></tr><tr><th>geography</th><td>${esc(GEO_LABEL[Ssrc.geo] || Ssrc.geo || '—')}</td></tr>${rec.baseline_confidence !== undefined ? `<tr><th>baseline confidence</th><td>${rec.baseline_confidence}</td></tr>` : ''}${rec.licence_tier ? `<tr><th>licence</th><td>tier ${esc(rec.licence_tier)}${rec.licence_note ? ` · <span class="muted">${esc(rec.licence_note)}</span>` : ''}</td></tr>` : ''}<tr><th>claims</th><td>${Ssrc.claims.filter(isLive).length} live · ${Ssrc.claims.filter(c => c.status === 'verified').length} verified</td></tr></table>
  ${byPlant.map(({ pid, cs }) => `<h3><em>${esc(K.plants[pid].entity.scientific_name)}</em> · ${cs.length}</h3>${cs.map(c => claimRow(c, K.plants[pid].fields[c.field], ` · ${esc(c.field.replace(/_/g, ' '))}`)).join('')}`).join('')}
  ${nextHtml(S.view)}`;
}
function relationsHtml(Pn) {
  const rels = S.K.relations.filter(r => r.plant_a === Pn.id || r.plant_b === Pn.id);
  return `<h2>Relations</h2><div class="kicker"><em>${esc(Pn.entity.scientific_name)}</em> · ${rels.length} recorded</div>
  ${rels.map(r => { const other = r.plant_a === Pn.id ? r.plant_b : r.plant_a; return `<div class="row" data-key="relation:${esc(r.id)}"><i class="st ${r.status === 'verified' ? 'verified' : r.status === 'retired' ? 'retired' : 'unverified'}" style="--c:${TYPE_COLOUR[r.source_type]}"></i><div><span class="val">${esc((r.relation_type || '').replace(/_/g, ' '))}</span> → <em>${esc(S.K.plants[other].entity.scientific_name)}</em><br><span class="meta">${esc(S.K.sources[r.source_id]?.label || r.source_id)} · ${esc(r.status)}${r.source_type === 'model' ? ' · model placeholder' : ''}</span></div></div>`; }).join('')}
  <p class="muted">Only one relation in the store is verified — a practitioner's co-listing with completeness L0, which means it is stored but never cited.</p>`;
}
function relationHtml(r) {
  const K = S.K;
  return `<h2>${esc((r.relation_type || '').replace(/_/g, ' '))}</h2><div class="kicker"><em>${esc(K.plants[r.plant_a].entity.scientific_name)}</em> ↔ <em>${esc(K.plants[r.plant_b].entity.scientific_name)}</em> · ${statusTag(r.status)}${typeTag(r.source_type)}</div>
  <p>${esc(r.text || '')}</p>${r.note ? `<p class="muted">${esc(r.note)}</p>` : ''}
  <table><tr><th>source</th><td ${r.source_type !== 'model' ? `data-src="${esc(r.source_id)}" style="cursor:pointer"` : ''}>${esc(K.sources[r.source_id]?.label || r.source_id)}</td></tr><tr><th>context</th><td class="muted">${esc(r.context || '')}</td></tr><tr><th>confidence</th><td>${r.confidence ?? '—'}</td></tr>${r.practitioner_meta ? `<tr><th>practitioner</th><td class="muted">completeness ${esc(r.practitioner_meta.completeness)} · citable ${r.practitioner_meta.citable === false ? 'no' : 'yes'}</td></tr>` : ''}<tr><th>id</th><td class="id">${esc(r.id)}</td></tr></table>
  ${r.supporting_claims && r.supporting_claims.length ? `<h3>Supporting claims</h3>${r.supporting_claims.map(id => { const c = K.claims.get(id); return c ? claimRow(c, K.plants[c.plant].fields[c.field], ` · ${esc(c.field.replace(/_/g, ' '))}`) : `<div class="row dim"><i class="st gap"></i><div class="id">${esc(id)}</div></div>`; }).join('')}` : ''}
  ${r.derived_from && r.derived_from.length ? `<h3>Derived from</h3>${r.derived_from.map(id => { const c = K.claims.get(id); return c ? claimRow(c, K.plants[c.plant].fields[c.field], ` · ${esc(c.field.replace(/_/g, ' '))}`) : `<div class="id">${esc(id)}</div>`; }).join('')}` : ''}`;
}

// ------------------------------------------------------------------ legend & stats
function renderLegend() {
  const types = new Set(); for (const p of Object.values(S.db.plants)) for (const c of p.claims) if (isSourced(c)) types.add(c.source_type);
  $('#legend').innerHTML = `
    <div class="row">${[...types].map(t => `<span><i style="background:${TYPE_COLOUR[t]}"></i> ${esc(t)}</span>`).join('')} <span><i style="background:${TYPE_COLOUR.candidate}"></i> candidate (yours, this session)</span></div>
    <div class="row"><span><i style="background:#c3cadb"></i> verified</span> <span><i class="hollow" style="color:#c3cadb"></i> unverified</span> <span><i class="dashed" style="color:${TYPE_COLOUR.model}"></i> retired placeholder</span> <span><i class="dashed" style="color:${TYPE_COLOUR.gap}"></i> gap</span> <span style="color:var(--cond)">◠ varies with conditions</span> <span style="color:var(--differ)">◠ values differ</span></div>`;
}
function renderStats() {
  const K = S.K; const plants = Object.values(K.plants);
  const all = plants.flatMap(p => p.claims.filter(c => c.source_type !== 'candidate'));
  $('#stats').textContent = `${all.length} claims · ${all.filter(isSourced).length} live · ${all.filter(c => c.status === 'verified').length} verified · ${Object.values(K.sources).filter(s => s.id !== 'candidate' && s.claims.some(isSourced)).length} sources · ${K.relations.length} relations · ${S.candidates.length} candidate${S.candidates.length === 1 ? '' : 's'} this session`;
}

// ------------------------------------------------------------------ Grow: candidates
const FIELD_WORDS = {
  mature_height: ['height', 'tall', 'high', ' cm', 'stays under', 'stays below', 'reaches', 'metre', 'meter', ' m ', 'ft'],
  mature_spread: ['spread', 'wide', 'width', 'across'],
  exposure: ['full sun', 'part shade', 'shade', 'shady', 'sunny', 'north-facing', 'exposure', 'aspect'],
  water_drainage: ['wet', 'dry soil', 'drainage', 'drought', 'moist', 'waterlogged', 'soggy', 'irrigat'],
  hardiness_zone: ['frost', 'hardy', 'winter kill', 'zone', 'cold snap', 'froze'],
  maintenance_level: ['maintenance', 'pruning', 'prune', 'easy care', 'low care', 'fuss'],
  growth_rate: ['fast', 'slow', 'growth rate', 'grows quickly', 'vigorous', 'per year'],
  behaviour_with_others: ['spreads into', 'overrun', 'smother', 'competes', 'under the', 'companion', 'next to', 'crowd', 'sucker', 'runner', 'neighbour'],
  toxicity: ['toxic', 'poison', 'dog', 'cat ', 'pets', 'ate'],
  local_mature_size: ['in vancouver', 'street tree', 'actual size', 'ended up', 'after 20 years', 'old specimen', 'planted in'],
  time_to_intended_size: ['years to', 'took', 'reached', 'after 5 years', 'after 10 years', 'years old'],
  seasonal_interest: ['flower', 'bloom', 'fall colour', 'fall color', 'berries', 'fruit', 'autumn', 'evergreen', 'leaves turn'],
  ecological_value: ['bees', 'pollinator', 'birds', 'wildlife', 'hummingbird', 'habitat'],
  pest_susceptibility: ['aphid', 'scale insect', 'mildew', 'disease', 'pest', 'leaf spot', 'verticillium', 'anthracnose'],
  resistances: ['tolerates', 'tolerant', 'resistant', 'unbothered', 'deer', 'rabbit'],
  long_term_performance: ['declined', 'died', 'still thriving', 'after years', 'long term', 'longevity', 'survived'],
  vancouver_context: ['vancouver', 'north van', 'burnaby', 'richmond', 'surrey', 'lower mainland'],
};
const EXPOSURE_WORDS = [['Full sun', ['full sun']], ['Part sun/part shade', ['part shade', 'part sun', 'partial shade', 'half shade']], ['Filtered shade', ['filtered shade', 'dappled', 'light shade']], ['Deep shade', ['deep shade', 'full shade', 'heavy shade']]];
const SOIL_WORDS = [['poor soil', ['poor soil', 'thin soil', 'gravel', 'sandy']], ['good soil', ['good soil', 'rich soil', 'deep soil', 'compost']]];
function detect(text) {
  const t = ' ' + text.toLowerCase() + ' ';
  const names = S.retr.nameHits(text); const pid = Object.keys(names)[0] || null;
  const scores = Object.entries(FIELD_WORDS).map(([f, ws]) => [f, ws.filter(w => t.includes(w)).length]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const field = scores[0]?.[0] || null;
  const num = t.match(/(\d+(?:\.\d+)?)\s*(cm|m|metres?|meters?|ft|feet)\b/);
  let value = null, value_kind = 'qualitative';
  if (num) {
    let x = parseFloat(num[1]); const u = num[2];
    if (u === 'cm') x = x / 100; else if (u === 'ft' || u === 'feet') x = x * 0.3048;
    x = Math.round(x * 100) / 100;
    const before = t.slice(0, num.index);
    if (/(under|below|less than|at most|no more than|max)\s*$/.test(before)) value = { max: x, unit: 'm' };
    else if (/(over|above|more than|at least|min)\s*$/.test(before)) value = { min: x, unit: 'm' };
    else value = { height_m: x, unit: 'm' };
    value_kind = 'quantitative';
  }
  const exposure = EXPOSURE_WORDS.filter(([, ws]) => ws.some(w => t.includes(w))).map(([k]) => k);
  const soil = SOIL_WORDS.filter(([, ws]) => ws.some(w => t.includes(w))).map(([k]) => k);
  if (!value && field === 'exposure' && exposure.length) { value = exposure; value_kind = 'categorical'; }
  if (!value) value = { note: text.trim() };
  return { pid, field, value, value_kind, exposure, soil, names };
}
function loadCandidates() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } }
function saveCandidates() { try { localStorage.setItem(LS_KEY, JSON.stringify(S.candidates)); } catch { /* private window etc. */ } }

function addCandidate(text, pid, field, basis, location) {
  const d = detect(text);
  const Fbefore = S.K.plants[pid].fields[field];
  const before = { status: Fbefore.status, lanes: Fbefore.lanes.map(l => l.key), hasLocal: Fbefore.hasLocal, n: Fbefore.sourced.length };
  const n = S.candidates.filter(c => c.plant === pid && c.field === field).length + 1;
  const conds = [...d.exposure, ...d.soil].map(x => x.toLowerCase());
  const meta = { basis: basis || null, location: location || null, maintenance_received: null, site_conditions: conds.length ? conds.join(', ') : null, season_observed: null, plant_age_years: null, observer_background: 'this session (unverified user input)', completeness: basis && location ? 'L2' : basis ? 'L1' : 'L0', citable: false };
  const ctxBits = ['candidate (this session)']; if (location) ctxBits.push(location); if (conds.length) ctxBits.push(conds.join(', '));
  const c = {
    id: `candidate:${pid}:${field}:${String(n).padStart(2, '0')}`, plant: pid, field, value_kind: d.value_kind, value: d.value,
    text: text.trim(), source_id: 'candidate', source_type: 'candidate', context: ctxBits.join('; '), confidence: null, status: 'candidate',
    recorded_at: new Date().toISOString().slice(0, 10), recorded_by: 'user (browser session)', practitioner_meta: meta,
  };
  S.candidates.push(c); saveCandidates();
  rebuild(); refreshCosmos();
  const F = S.K.plants[pid].fields[field];
  const changed = whatChanged(c, F, before);
  S.lastChange = changed;
  // the lens for this field is rebuilt with the candidate in its lane; the candidate's row grows in
  S.stageKey = null; go({ level: 'claim', claimId: c.id });
  growIn(`claim:${c.id}`);
  renderChanged(changed); renderCandList(); renderStats();
  return c;
}
function whatChanged(c, F, before) {
  const K = S.K; const D = K.plants[c.plant].domains.find(d => d.id === F.domain); const p = F.parsed.get(c.id);
  const lane = F.lanes.find(l => l.claims.includes(c)); const laneOthers = lane ? lane.claims.filter(x => x !== c && x.source_type !== 'candidate') : [];
  const items = [];
  items.push(`Joined <b>${esc(D.label)}</b> → <b>${esc(F.label)}</b> on <em>${esc(K.plants[c.plant].entity.scientific_name)}</em>${before.n ? ` beside ${before.n} sourced reading${before.n === 1 ? '' : 's'}` : ' — a field that had no sourced reading'}.`);
  if (lane && lane.kind !== 'none') items.push(laneOthers.length ? `Lands in the <b>${esc(lane.label)}</b> lane with ${laneOthers.map(x => esc(K.sources[x.source_id]?.label || x.source_id)).join(', ')} — your observation and theirs now describe the same condition.` : `Opens a new condition lane: <b>${esc(lane.label)}</b>. No source had stated this condition for this field.`);
  else if (lane && F.lanes.length > 1) items.push(`No growing condition detected, so it sits with the species figures; the field already splits by ${F.lanes.filter(l => l.kind !== 'none').map(l => l.label).join(' / ')} — add the condition to your sentence to place it.`);
  const rels = F.sourced.map(x => ({ x, r: relate(c, x, p, F.parsed.get(x.id)) })).filter(z => z.r.cls !== 'na');
  if (rels.length) items.push(`Against existing evidence: ${rels.map(z => `<span class="rel ${z.r.cls}">${esc(z.r.kind)}</span> ${esc(K.sources[z.x.source_id]?.label || z.x.source_id)}`).join(' · ')}.`);
  if (!before.hasLocal && p.region && /vancouver|bc/i.test(p.region)) items.push(`First reading on this field from the Vancouver scale — every sourced value here comes from ${[...new Set(F.sourced.map(x => F.parsed.get(x.id).region).filter(Boolean))].join(', ') || 'elsewhere'}.`);
  if (before.status !== F.status) items.push(`Field status would move from “${esc(before.status)}” to “${esc(F.status)}” if this were sourced — it is not; status words ignore candidates.`);
  items.push(`Flagged: unverified user input, completeness ${esc(c.practitioner_meta.completeness)}, never citable. It is now in the retrieval corpus, so a question that recalls it will list it as a candidate, after every sourced claim.`);
  return { items, c };
}
function renderChanged(ch) {
  const el = $('#changed'); if (!ch) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="changed"><h4>What changed</h4><ul style="margin:0;padding-left:16px">${ch.items.map(i => `<li>${i}</li>`).join('')}</ul><p style="margin:6px 0 0"><button data-key="claim:${esc(ch.c.id)}">show it in the lens</button> <button id="ask-again">ask with it</button></p></div>`;
  bind(el); const b = $('#ask-again'); if (b) b.addEventListener('click', () => { openDrawer('ask'); const q = `how tall does ${S.K.plants[ch.c.plant].entity.common_names?.en?.[0] || S.K.plants[ch.c.plant].entity.scientific_name} get in ${(ch.c.practitioner_meta.site_conditions || 'full sun').split(',')[0]}`; $('#ask-input').value = q; runQuery(q); });
}
function growIn(key) {
  if (!S.stage) return; const objs = []; S.stage.group.traverse(o => { if (o.userData.key === key && o.userData.mats) objs.push(o); });
  const t0 = performance.now();
  (function step() { const k = Math.min(1, (performance.now() - t0) / 1100); const e = 1 - Math.pow(1 - k, 3); for (const o of objs) o.scale.set(0.02 + 0.98 * e, 0.4 + 0.6 * e, 1); if (k < 1) requestAnimationFrame(step); })();
}
function refreshCosmos() {
  // keep node identity; rebuild domain glyphs (candidate marks, counts) and labels
  const byId = new Map(S.nodes.map(n => [n.id, n]));
  S.Graph.graphData({ nodes: S.nodes, links: S.links });
  S.Graph.nodeThreeObject(nodeObject);
  cosmosLabels(); applyDim();
}
function resetCandidates() { S.candidates = []; saveCandidates(); rebuild(); refreshCosmos(); S.stageKey = null; S.lastChange = null; renderChanged(null); renderCandList(); renderStats(); go({ level: 'cosmos' }); }
function renderCandList() {
  const ul = $('#cand-list'); ul.innerHTML = S.candidates.map(c => `<li><span style="color:var(--candidate)">●</span> <em>${esc(S.K.plants[c.plant].entity.scientific_name)}</em> · ${esc(c.field.replace(/_/g, ' '))} · ${esc(summariseValue(c))} <button data-key="claim:${esc(c.id)}">open</button></li>`).join('') || '<li class="muted" style="border:0">no candidates yet</li>';
  bind(ul);
}
function prefillGrow(pid, field) { if (pid) $('#add-plant').value = pid; if (field) $('#add-field').value = field; $('#add-text').focus(); }

// ------------------------------------------------------------------ Ask: retrieval preview lights the activated knowledge
function runQuery(q) {
  if (!q.trim()) return;
  const r = S.retr.run(q); S.lastResult = r;
  const top = r.ranked.slice(0, 14);
  const N = new Set(); const L = new Set(); S.flow = new Set(); const lit = new Set();
  for (const pid of r.candidates) N.add(`plant:${pid}`);
  for (const c of [...top, ...r.withheld, ...r.candidateHits]) {
    const dkey = `${c.plant}:${domainOf(c.field)}`; N.add(`plant:${c.plant}`); N.add(`domain:${dkey}`); L.add(`spoke:${dkey}`);
    if (top.includes(c)) { S.flow.add(`spoke:${dkey}`); lit.add(`claim:${c.id}`); }
  }
  S.activation = { nodes: N, links: L, claims: lit };
  S.lit = lit; S.litMode = 'ask';
  $('#ask-label').classList.add('on');
  if (S.view.level !== 'cosmos' && S.view.level !== 'field' && S.view.level !== 'claim') go({ level: 'cosmos' }); else { applyDim(); }
  renderAskResult(r);
}
function clearAsk() { S.activation = null; S.flow = new Set(); if (S.litMode === 'ask') { S.lit = new Set(); S.litMode = null; } $('#ask-label').classList.remove('on'); applyDim(); $('#ask-result').innerHTML = ''; }
function renderAskResult(r) {
  const el = $('#ask-result'); const plants = S.db.plants;
  const gateRows = Object.entries(r.gates).filter(([, g]) => Object.keys(g).length);
  const candNote = S.candidates.length ? (r.candidateHits.length ? `<p class="cand">Δ with your candidates: ${r.candidateHits.length} candidate claim${r.candidateHits.length === 1 ? '' : 's'} recalled — shown as unverified user input, never cited, ranked after every sourced claim.</p>` : `<p class="muted">Δ with your candidates: none recalled for this question.</p>`) : '';
  const doms = new Set([...r.ranked.slice(0, 14)].map(c => `${c.plant}:${domainOf(c.field)}`));
  el.innerHTML = `
    <h3>Activated</h3><div class="muted">${r.candidates.length} plant${r.candidates.length === 1 ? '' : 's'} after gates · ${doms.size} knowledge domain${doms.size === 1 ? '' : 's'} lit · ${r.ranked.length} claims in answer order · click a claim to open it in its lens</div>
    <h3>Routes</h3>
    <div class="muted">names: ${Object.keys(r.names).length ? Object.entries(r.names).map(([k, v]) => `<em>${esc(k)}</em> (${esc(v.join(', '))})`).join(', ') : 'none'} · intents: ${r.intents.length ? r.intents.map(i => `${esc(i.term)} → ${esc(i.field)} <span class="why">${esc(i.mode)}</span>`).join(', ') : 'none'}</div>
    ${gateRows.length ? `<h3>Gates (structured route)</h3><table style="width:100%;font-size:11.5px">${gateRows.map(([pid, g]) => `<tr><th style="text-align:left;color:var(--ink-dim);font-weight:500"><em>${esc(plants[pid].entity.scientific_name)}</em></th><td>${Object.entries(g).map(([t, v]) => `<span class="tag ${esc(v)}">${esc(t)}: ${esc(v)}</span>`).join(' ')}</td></tr>`).join('')}</table>` : ''}
    <div class="muted" style="margin-top:6px">${r.excluded.length ? `excluded: ${r.excluded.join(', ')} · ` : ''}recall ${r.recall_n} claims by BM25 (similarity decides recall only) · ${r.withheld.length} L0 practitioner claim${r.withheld.length === 1 ? '' : 's'} withheld (R2)</div>
    <h3>Answer order (R5) · attribution (R6)</h3>
    ${r.ranked.length ? r.ranked.slice(0, 14).map((c, i) => `<div class="r" data-key="claim:${esc(c.id)}"><span class="rank" style="font-family:var(--mono)">${i + 1}.</span> ${esc(S.retr.attribute(c))}<div class="why">${esc(c.field.replace(/_/g, ' '))} · ${esc(S.retr.why(c))}</div></div>`).join('') + (r.ranked.length > 14 ? `<div class="muted">… ${r.ranked.length - 14} more</div>` : '') : '<p class="warn">No sourced claim matches — honest empty answer; the field may exist with no source yet.</p>'}
    ${r.withheld.length ? `<h3>Withheld (L0, not citable)</h3>${r.withheld.map(c => `<div class="r" data-key="claim:${esc(c.id)}"><span class="muted">${esc(c.text)}</span><div class="why">stored, never cited (R2)</div></div>`).join('')}` : ''}
    ${r.candidateHits.length ? `<h3>Candidates recalled (unverified user input)</h3>${r.candidateHits.map(c => `<div class="r cand" data-key="claim:${esc(c.id)}">${esc(c.text)}<div class="why">flagged, not cited</div></div>`).join('')}` : ''}
    ${candNote}`;
  bind(el);
}

// ------------------------------------------------------------------ UI
function openDrawer(id) { for (const d of document.querySelectorAll('.drawer')) d.classList.toggle('open', d.id === id && !d.classList.contains('open')); $('#btn-ask').classList.toggle('on', $('#ask').classList.contains('open')); $('#btn-add').classList.toggle('on', $('#add').classList.contains('open')); moveCamera(); }
function initUi() {
  $('#btn-ask').addEventListener('click', () => openDrawer('ask'));
  $('#btn-add').addEventListener('click', () => openDrawer('add'));
  $('#btn-up').addEventListener('click', up);
  $('#btn-reset').addEventListener('click', () => { clearAsk(); go({ level: 'cosmos' }); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (document.querySelector('.drawer.open')) { document.querySelector('.drawer.open').classList.remove('open'); $('#btn-ask').classList.remove('on'); $('#btn-add').classList.remove('on'); } else up(); } });
  const qb = $('#qbtns');
  for (const q of S.db.queries.queries) { const b = document.createElement('button'); b.innerHTML = `${esc(q.query)} <small>${esc(q.id)}${q.status === 'proxy' ? ' · proxy' : ''}</small>`; b.addEventListener('click', () => { $('#ask-input').value = q.query; runQuery(q.query); }); qb.appendChild(b); }
  $('#ask-store').textContent = `${S.db.queries.queries.length} test queries (${S.db.queries.queries.filter(q => q.status === 'proxy').length} proxy)`;
  $('#ask-run').addEventListener('click', () => runQuery($('#ask-input').value));
  $('#ask-input').addEventListener('keydown', e => { if (e.key === 'Enter') runQuery($('#ask-input').value); });
  $('#ask-clear').addEventListener('click', clearAsk);
  const ps = $('#add-plant'); for (const pid of S.db.plantIds) { const o = document.createElement('option'); o.value = pid; o.textContent = S.db.plants[pid].entity.scientific_name; ps.appendChild(o); }
  const fs = $('#add-field'); for (const f of Object.keys(S.K.tiers)) { const o = document.createElement('option'); o.value = f; o.textContent = f.replace(/_/g, ' '); fs.appendChild(o); }
  $('#add-text').addEventListener('input', () => { const d = detect($('#add-text').value); if (d.pid) ps.value = d.pid; if (d.field) fs.value = d.field; $('#add-detected').textContent = `detected → plant: ${d.pid || '?'} · field: ${d.field || '?'} · value: ${JSON.stringify(d.value)}${d.exposure.length ? ' · exposure: ' + d.exposure.join(', ') : ''}${d.soil.length ? ' · soil: ' + d.soil.join(', ') : ''}`; });
  $('#add-go').addEventListener('click', () => { const t = $('#add-text').value.trim(); if (!t) return; addCandidate(t, ps.value, fs.value, $('#add-basis').value, $('#add-location').value.trim()); });
  $('#add-reset').addEventListener('click', resetCandidates);
  renderCandList(); cosmosLabels();
}

window.brain = { S, go, act, up, addCandidate, resetCandidates, runQuery, clearAsk, K: () => S.K };
