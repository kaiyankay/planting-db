// Neural Cosmos — playable view of the Planting Intelligence claim store.
// Read-only: loads the db over HTTP, never writes. Candidates (C2) live in this browser's localStorage only.
// Mechanisms borrowed (see README): click-to-focus (camera), expandable-nodes (pruned tree), bloom-effect
// (UnrealBloomPass on postProcessingComposer), dynamic (graphData re-set at runtime, emitParticle).
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { loadDb, fieldDef } from './data.js';
import { buildModel, TYPE_COLOUR, summariseValue, shortContext } from './model.js';
import { makeRetriever } from './retrieve.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const LS_KEY = 'brain.candidates.v1';

const S = {
  db: null, model: null, Graph: null, retr: null,
  expanded: new Set(), candidates: [], focus: null, flow: new Set(),
  selected: null, fitted: false, lastResult: null,
};

// ------------------------------------------------------------------ boot
(async function boot() {
  try {
    S.db = await loadDb();
    S.candidates = loadCandidates();
    S.retr = makeRetriever(S.db, () => S.candidates);
    rebuildModel();
    initGraph();
    initUi();
    renderLegend();
    renderOverview();
    $('#loading').classList.add('gone');
  } catch (e) {
    $('#err').textContent = `could not load the db: ${e.message}\n\nserve from the planting-db root:  python3 -m http.server 8766  → http://localhost:8766/brain/`;
    console.error(e);
  }
})();

function rebuildModel() {
  // keep positions of nodes that already exist
  const prev = S.model ? S.model.nodes : new Map();
  S.model = buildModel(S.db, S.candidates);
  for (const [id, n] of S.model.nodes) {
    const o = prev.get(id);
    if (o) { n.x = o.x; n.y = o.y; n.z = o.z; n.vx = o.vx; n.vy = o.vy; n.vz = o.vz; n.fx = o.fx; n.fy = o.fy; n.fz = o.fz; }
  }
  if (S.selected) S.selected = S.model.nodes.get(S.selected.id) || null;
}

// ------------------------------------------------------------------ visibility (expandable-nodes mechanism)
function visibleGraph() {
  const { nodes, links } = S.model;
  const vis = new Set();
  for (const n of nodes.values()) if (n.kind === 'plant' || n.kind === 'field') vis.add(n.id);
  for (const fid of S.expanded) {
    const fn = nodes.get(fid); if (!fn) { S.expanded.delete(fid); continue; }
    for (const c of fn.claims) { vis.add(`claim:${c.id}`); vis.add(`source:${c.source_id}`); }
  }
  const vn = [];
  for (const id of vis) {
    const n = nodes.get(id); if (!n) continue;
    if (n.x === undefined) spawnAt(n);
    vn.push(n);
  }
  const vl = links.filter(l => vis.has(l.sid) && vis.has(l.tid));
  return { nodes: vn, links: vl };
}

function spawnAt(n) {
  // new points emerge from their parent, not from the origin
  let p = null;
  if (n.kind === 'claim') p = n.fieldNode;
  else if (n.kind === 'field') p = n.plant;
  else if (n.kind === 'source') { for (const c of n.claims) { const cn = S.model.nodes.get(`claim:${c.id}`); const fn = S.model.nodes.get(`field:${c.plant}:${c.field}`); p = (cn && cn.x !== undefined) ? cn : (fn && fn.x !== undefined) ? fn : null; if (p) break; } }
  const j = () => (Math.random() - 0.5) * 6;
  if (p && p.x !== undefined) { n.x = p.x + j(); n.y = p.y + j(); n.z = p.z + j(); }
}

function refreshGraph() {
  S.Graph.graphData(visibleGraph());
  applyFocus();
}

// ------------------------------------------------------------------ visual encodings
const hexRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };

function colourOf(n) {
  if (n.kind === 'plant') return TYPE_COLOUR.plant;
  if (n.kind === 'field') return n.gap ? TYPE_COLOUR.gap : (TYPE_COLOUR[n.topType] || TYPE_COLOUR.gap);
  if (n.kind === 'claim') return TYPE_COLOUR[n.claim.source_type] || '#888';
  if (n.kind === 'source') return TYPE_COLOUR[n.type] || '#888';
  return '#888';
}
function radiusOf(n) {
  if (n.kind === 'plant') return 6.5;
  if (n.kind === 'field') return n.gap ? 1.3 : 1.5 + 0.55 * Math.sqrt(n.sourced.length + 0.5 * (n.live.length - n.sourced.length));
  if (n.kind === 'claim') return n.claim.source_type === 'candidate' ? 1.5 : 0.9 + 0.9 * (n.claim.confidence || 0.4);
  if (n.kind === 'source') return 1.6 + 0.35 * Math.sqrt(n.claims.length);
  return 1;
}
function baseOpacity(n) {
  if (n.kind === 'plant') return 0.8;
  if (n.kind === 'field') return n.gap ? 0.5 : 0.5 + 0.5 * n.verifiedShare;
  if (n.kind === 'claim') { const c = n.claim; if (!n.live) return 0.4; if (c.source_type === 'candidate') return 1; return c.status === 'verified' ? 1 : 0.85; }
  if (n.kind === 'source') return 0.9;
  return 1;
}
function wireOf(n) {
  if (n.kind === 'field') return n.gap;
  if (n.kind === 'claim') return !n.live;          // retired / model placeholders drawn dashed-wire
  return false;
}
function labelOf(n) {
  if (n.kind === 'plant') return n.label;
  if (n.kind === 'field') return n.label;
  if (n.kind === 'claim') return n.ctx ? `${n.label} · ${n.ctx}` : n.label;
  if (n.kind === 'source') return n.label;
  return '';
}
const LABEL_H = { plant: 4.2, field: 2.0, claim: 1.7, source: 2.3 };

function makeLabel(text, colour, h) {
  const font = 44, pad = 10;
  const cv = document.createElement('canvas'); const cx = cv.getContext('2d');
  cx.font = `500 ${font}px -apple-system, "Helvetica Neue", Roboto, sans-serif`;
  const w = Math.ceil(cx.measureText(text).width) + pad * 2;
  cv.width = w; cv.height = font + pad * 2;
  cx.font = `500 ${font}px -apple-system, "Helvetica Neue", Roboto, sans-serif`;
  cx.textBaseline = 'middle'; cx.fillStyle = colour; cx.fillText(text, pad, cv.height / 2);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(h * cv.width / cv.height, h, 1);
  return sp;
}

function nodeObject(n) {
  const g = new THREE.Group();
  const r = radiusOf(n); const col = colourOf(n); const wire = wireOf(n);
  const seg = n.kind === 'plant' ? 28 : 14;
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: baseOpacity(n), wireframe: wire });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  g.add(mesh);
  const parts = { group: g, mesh, mat, shell: null, label: null };
  // unverified sourced claims: solid core + wire shell ("ringed")
  if (n.kind === 'claim' && n.live && n.claim.status !== 'verified' && n.claim.source_type !== 'candidate') {
    mesh.scale.setScalar(0.62);
    const sm = new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: 0.35, wireframe: true });
    parts.shell = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), sm); g.add(parts.shell);
  }
  if (n.kind === 'plant') {
    // soft halo: a larger back-facing sphere at low opacity (one object per plant, carries no data beyond "this is a plant")
    const hm = new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: 0.045, side: THREE.BackSide });
    parts.halo = new THREE.Mesh(new THREE.SphereGeometry(r * 2.1, 24, 24), hm); g.add(parts.halo);
  }
  const text = labelOf(n);
  if (text) {
    const lc = n.kind === 'plant' ? '#f4ead0' : n.kind === 'claim' ? '#aeb6c8' : '#c3cadb';
    parts.label = makeLabel(text, lc, LABEL_H[n.kind] || 2); parts.label.position.set(0, r + (LABEL_H[n.kind] || 2) * 0.75, 0); g.add(parts.label);
  }
  n.__obj = parts;
  return g;
}

// ------------------------------------------------------------------ links: own Line objects so opacity, dashes and curves are under control
function linkStyle(l) {
  let col, a, dash = false, width = 1;
  switch (l.kind) {
    case 'pf': col = TYPE_COLOUR.plant; a = 0.16; break;
    case 'fc': col = TYPE_COLOUR[l.claim.source_type] || '#888'; a = l.claim.status === 'retired' ? 0.18 : 0.5; dash = l.claim.source_type === 'model'; break;
    case 'cs': col = TYPE_COLOUR[l.claim.source_type] || '#888'; a = 0.3; dash = l.claim.source_type === 'model'; break;
    case 'rel': col = TYPE_COLOUR[l.type] || '#888'; a = l.relation.status === 'verified' ? 0.95 : (l.type === 'model' ? 0.32 : 0.75); dash = l.type === 'model'; break;
    default: col = '#888'; a = 0.3;
  }
  return { col, a, dash };
}
function linkObject(l) {
  const st = linkStyle(l);
  const pts = l.kind === 'rel' ? 24 : 2;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts * 3), 3));
  const mat = st.dash
    ? new THREE.LineDashedMaterial({ color: new THREE.Color(st.col), transparent: true, opacity: st.a, dashSize: 2.2, gapSize: 1.6 })
    : new THREE.LineBasicMaterial({ color: new THREE.Color(st.col), transparent: true, opacity: st.a });
  const line = new THREE.Line(geo, mat);
  l.__obj = { line, mat, base: st.a, pts };
  return line;
}
function linkPositionUpdate(obj, { start, end }, l) {
  const o = l.__obj; if (!o) return false;
  const pos = o.line.geometry.attributes.position;
  if (o.pts === 2) {
    pos.setXYZ(0, start.x, start.y, start.z); pos.setXYZ(1, end.x, end.y, end.z);
  } else {
    // curved relation link: bezier bent perpendicular to the segment; several relations on one pair spread by l.curve
    const s = new THREE.Vector3(start.x, start.y, start.z), e = new THREE.Vector3(end.x, end.y, end.z);
    const mid = s.clone().add(e).multiplyScalar(0.5); const d = e.clone().sub(s); const len = d.length() || 1;
    const perp = new THREE.Vector3(0, 1, 0).cross(d).normalize(); if (perp.lengthSq() < 1e-6) perp.set(1, 0, 0);
    const ctrl = mid.add(perp.multiplyScalar(len * l.curve));
    const curve = new THREE.QuadraticBezierCurve3(s, ctrl, e);
    curve.getPoints(o.pts - 1).forEach((p, i) => pos.setXYZ(i, p.x, p.y, p.z));
  }
  pos.needsUpdate = true;
  if (o.mat.isLineDashedMaterial) o.line.computeLineDistances();
  return true;
}

// ------------------------------------------------------------------ focus / dim (click-to-focus mechanism, extended to a neighbourhood)
function applyFocus() {
  const { nodes, links } = S.Graph.graphData();
  for (const n of nodes) {
    const o = n.__obj; if (!o) continue;
    const active = !S.focus || S.focus.nodes.has(n.id);
    const k = active ? 1 : 0.07;
    o.mat.opacity = baseOpacity(n) * k;
    if (o.shell) o.shell.material.opacity = 0.35 * k;
    if (o.halo) o.halo.material.opacity = 0.045 * k;
    if (o.label) { o.label.material.opacity = active ? 1 : 0.06; }
  }
  for (const l of links) {
    const o = l.__obj; if (!o) continue;
    const active = !S.focus || S.focus.links.has(l.id);
    o.mat.opacity = o.base * (active ? 1 : 0.05) * (S.flow.has(l.id) ? 1.8 : 1);
  }
  S.Graph.linkDirectionalParticles(l => S.flow.has(l.id) ? 4 : 0);
}

function setFocus(nodeIds, linkIds) {
  S.focus = nodeIds ? { nodes: new Set(nodeIds), links: new Set(linkIds || []) } : null;
  applyFocus();
}
function clearFocus() { S.focus = null; S.flow = new Set(); applyFocus(); }

function neighbourhood(n) {
  // nodes/links that light up when n is clicked
  const { links } = S.model; const N = new Set([n.id]); const L = new Set();
  const incident = links.filter(l => l.sid === n.id || l.tid === n.id);
  if (n.kind === 'plant') {
    for (const l of incident) { L.add(l.id); N.add(l.sid); N.add(l.tid); }
  } else if (n.kind === 'field') {
    N.add(n.plant.id); L.add(`pf:${n.id}`);
    for (const c of n.claims) { N.add(`claim:${c.id}`); N.add(`source:${c.source_id}`); L.add(`fc:claim:${c.id}`); L.add(`cs:claim:${c.id}`); }
  } else if (n.kind === 'claim') {
    const fn = n.fieldNode; N.add(fn.id); N.add(fn.plant.id); N.add(`source:${n.claim.source_id}`);
    L.add(`pf:${fn.id}`); L.add(`fc:${n.id}`); L.add(`cs:${n.id}`);
    for (const c of fn.claims) N.add(`claim:${c.id}`);     // siblings stay visible so disagreement is readable
  } else if (n.kind === 'source') {
    for (const c of n.claims) { N.add(`claim:${c.id}`); N.add(`field:${c.plant}:${c.field}`); N.add(`plant:${c.plant}`); L.add(`cs:claim:${c.id}`); L.add(`fc:claim:${c.id}`); L.add(`pf:field:${c.plant}:${c.field}`); }
  }
  return { N, L };
}

function fitNodes(pred = () => true, ms = 1200, pad = 2.2) {
  const fin = n => Number.isFinite(n.x) && Number.isFinite(n.y) && Number.isFinite(n.z);
  const ns = S.Graph.graphData().nodes.filter(n => fin(n) && pred(n)); if (!ns.length) return;
  const c = new THREE.Vector3(); ns.forEach(n => c.add(new THREE.Vector3(n.x, n.y, n.z))); c.divideScalar(ns.length);
  const R = Math.max(12, ...ns.map(n => Math.hypot(n.x - c.x, n.y - c.y, n.z - c.z)));
  const cam = S.Graph.cameraPosition(); const dir = new THREE.Vector3(cam.x - c.x, cam.y - c.y, cam.z - c.z);
  if (dir.lengthSq() < 1) dir.set(0.25, 0.18, 1);
  dir.normalize().multiplyScalar(R * pad + 30);
  flyToken++;
  S.Graph.cameraPosition({ x: c.x + dir.x, y: c.y + dir.y, z: c.z + dir.z }, { x: c.x, y: c.y, z: c.z }, ms);
}

let flyToken = 0;
function flyTo(n, distance, ms = 1400) {
  // adapted from the click-to-focus example: approach along the current line of sight instead of radially from the
  // origin, and track the node's live position while the layout is still settling (nodes drift after a re-heat)
  const G = S.Graph; const token = ++flyToken;
  const cam0 = G.cameraPosition(); const look0 = G.controls().target.clone();
  const start = new THREE.Vector3(cam0.x, cam0.y, cam0.z); const t0 = performance.now();
  (function step() {
    if (token !== flyToken) return;
    const k = Math.min(1, (performance.now() - t0) / ms); const e = 1 - Math.pow(1 - k, 3);
    if (![n.x, n.y, n.z].every(Number.isFinite)) { requestAnimationFrame(step); return; }
    const target = new THREE.Vector3(n.x, n.y, n.z);
    const dir = start.clone().sub(target); if (dir.lengthSq() < 1e-3) dir.set(0, 0, 1); dir.normalize().multiplyScalar(distance);
    const dest = target.clone().add(dir);
    const pos = start.clone().lerp(dest, e); const look = look0.clone().lerp(target, e);
    G.cameraPosition({ x: pos.x, y: pos.y, z: pos.z }, { x: look.x, y: look.y, z: look.z }, 0);
    if (k < 1) requestAnimationFrame(step);
  })();
}

// ------------------------------------------------------------------ graph init
function initGraph() {
  const Graph = new ForceGraph3D($('#graph'))
    .backgroundColor('#02030a')
    .showNavInfo(false)
    .nodeThreeObject(nodeObject)
    .nodeThreeObjectExtend(false)
    .nodeLabel(tooltip)
    .linkThreeObject(linkObject)
    .linkThreeObjectExtend(false)
    .linkPositionUpdate(linkPositionUpdate)
    .linkDirectionalParticles(0)
    .linkDirectionalParticleWidth(1.1)
    .linkDirectionalParticleSpeed(0.007)
    .linkDirectionalParticleColor(l => linkStyle(l).col)
    .onNodeClick(onNodeClick)
    .onLinkClick(onLinkClick)
    .onBackgroundClick(() => { clearFocus(); S.selected = null; renderOverview(); })
    .onNodeHover(n => { $('#graph').style.cursor = n ? 'pointer' : null; })
    .d3VelocityDecay(0.4)
    .d3AlphaDecay(0.05)
    .warmupTicks(60)
    .cooldownTime(5000)
    .onEngineStop(() => { if (!S.fitted) { S.fitted = true; fitNodes(() => true, 1200, 2.4); } });

  Graph.d3Force('link')
    .distance(l => ({ pf: 26, fc: 9, cs: 28, rel: 230 }[l.kind] || 20))
    .strength(l => ({ pf: 1, fc: 1, cs: 0.2, rel: 0.06 }[l.kind] || 0.5));
  Graph.d3Force('charge').strength(n => ({ plant: -900, field: -40, claim: -14, source: -90 }[n.kind] || -30)).distanceMax(320);

  // bloom (bloom-effect example), tuned down so dimmed knowledge stays dark
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.4, 0.38);
  Graph.postProcessingComposer().addPass(bloom);
  Graph.scene().fog = new THREE.FogExp2(0x02030a, 0.0022);

  S.Graph = Graph;
  Graph.cameraPosition({ x: 0, y: 0, z: 420 });
  Graph.graphData(visibleGraph());
  window.addEventListener('resize', () => bloom.setSize(innerWidth, innerHeight));
}

function tooltip(n) {
  if (n.kind === 'plant') return `<b><em>${esc(n.label)}</em></b><br>${esc((n.entity.common_names?.en || []).join(', '))}<div class="t-id">${n.fields.length} fields drawn · ${n.claims.length} claims</div>`;
  if (n.kind === 'field') return `<b>${esc(n.label)}</b> <span class="t-id">${n.tier}</span><br>${n.gap ? 'no sourced claim yet' : `${n.sourced.length} sourced claim${n.sourced.length === 1 ? '' : 's'} · ${n.nSources} source${n.nSources === 1 ? '' : 's'} · ${Math.round(n.verifiedShare * 100)}% verified`}${n.disagreement ? '<br><span style="color:#e8c37a">values differ between sources</span>' : ''}<div class="t-id">click to ${S.expanded.has(n.id) ? 'collapse' : 'open'}</div>`;
  if (n.kind === 'claim') { const c = n.claim; return `<b>${esc(summariseValue(c))}</b> <span class="t-id">${esc(c.source_id)} · ${esc(c.status)} · ${c.confidence ?? '—'}</span><br>${esc(c.text)}<div class="t-id">${esc(c.id)}</div>`; }
  if (n.kind === 'source') return `<b>${esc(n.source.name || n.sid)}</b><br><span class="t-id">${esc(n.type)} · ${esc(n.source.geo_specificity || '')} · tier ${esc(n.tier || '—')} · ${n.claims.length} claims</span>`;
  return '';
}

function onNodeClick(n) {
  S.selected = n;
  if (n.kind === 'plant') {
    const { N, L } = neighbourhood(n); setFocus(N, L); flyTo(n, 75); renderPlant(n);
  } else if (n.kind === 'field') {
    if (S.expanded.has(n.id)) { S.expanded.delete(n.id); } else { S.expanded.add(n.id); }
    refreshGraph();
    const { N, L } = neighbourhood(n); setFocus(N, L); flyTo(n, S.expanded.has(n.id) ? 55 : 70); renderField(n);
  } else if (n.kind === 'claim') {
    const { N, L } = neighbourhood(n); setFocus(N, L); flyTo(n, 38); renderClaim(n);
  } else if (n.kind === 'source') {
    const { N, L } = neighbourhood(n); setFocus(N, L); flyTo(n, 60); renderSource(n);
  }
}
function onLinkClick(l) {
  if (l.kind === 'rel') { setFocus([l.sid, l.tid], [l.id]); renderRelation(l); }
  else if (l.claim) { const cn = S.model.nodes.get(`claim:${l.claim.id}`); if (cn) onNodeClick(cn); }
}

function openField(fid, fly = true) {
  const fn = S.model.nodes.get(fid); if (!fn) return;
  if (!S.expanded.has(fid)) { S.expanded.add(fid); refreshGraph(); }
  const { N, L } = neighbourhood(fn); setFocus(N, L); if (fly) flyTo(fn, 55); renderField(fn);
}
function selectClaim(cid) {
  const cn = S.model.nodes.get(`claim:${cid}`); if (!cn) return;
  if (!S.expanded.has(cn.fieldNode.id)) { S.expanded.add(cn.fieldNode.id); refreshGraph(); }
  onNodeClick(cn);
}

// ------------------------------------------------------------------ panels
const P = $('#panel-body');
const typeTag = t => `<span class="tag" style="color:${TYPE_COLOUR[t] || '#888'}">${esc(t)}</span>`;
const statusTag = s => `<span class="tag ${esc(s)}">${esc(s)}</span>`;
const dot = (c, cls = '') => `<i class="${cls}" style="background:${c};color:${c}"></i>`;
function srcName(sid) { const s = S.db.sources[sid]; return s ? (s.name || sid).split(' — ')[0] : sid; }

function renderOverview() {
  const { nodes } = S.model; const db = S.db;
  const claims = Object.values(db.plants).flatMap(p => p.claims);
  const live = claims.filter(c => c.status !== 'retired' && c.source_type !== 'model');
  const ver = live.filter(c => c.status === 'verified').length;
  const srcs = new Set(live.map(c => c.source_id)).size;
  const fields = [...nodes.values()].filter(n => n.kind === 'field');
  const gaps = fields.filter(n => n.gap).length;
  $('#stats').textContent = `${db.plantIds.length} plants · ${claims.length} claims (${live.length} live, ${ver} verified) · ${srcs} sources · ${db.relations.relations.length} relations · ${S.candidates.length} candidate${S.candidates.length === 1 ? '' : 's'} this session`;
  P.innerHTML = `
    <div class="kicker">overview · nothing is drawn that is not in plants/*.json, sources.json, relations.json or typed by you</div>
    <h2>Three knowledge clusters</h2>
    <p class="muted">Each plant is surrounded by its fields. A field's size is its claim count; its brightness is the share of those claims a human has verified; its colour is the source type ranked first for it (rule R5). Faint dashed rings are gate or extended fields with no sourced claim yet.</p>
    <h3>How to move</h3>
    <p class="muted">Drag to orbit, wheel to zoom, right-drag to pan. Click a plant to focus it. Click a field to open its claims and the sources behind them; click again to close. Click a claim to read it in full. Click a source to see everything it says across the three plants. Click a curved plant–plant link to read the relation.</p>
    <h3>Right now</h3>
    <table>
      <tr><th>fields drawn</th><td>${fields.length} (${gaps} without a sourced claim)</td></tr>
      <tr><th>fields open</th><td>${S.expanded.size}</td></tr>
      <tr><th>verified</th><td>${ver} of ${live.length} live claims — review is deferred (decision D5), so most literature claims are still ringed</td></tr>
      <tr><th>candidates</th><td>${S.candidates.length} (this browser only)</td></tr>
    </table>
    <h3>Plants</h3>
    ${db.plantIds.map(pid => { const n = nodes.get(`plant:${pid}`); return `<div class="claim-row" data-node="${n.id}">${dot(TYPE_COLOUR.plant)}<div><span class="val"><em>${esc(n.label)}</em></span> <span class="meta">${n.fields.filter(f => !f.gap).length} sourced fields · ${n.claims.length} claims</span></div></div>`; }).join('')}
  `;
  bindPanel();
}

function renderPlant(n) {
  const e = n.entity; const rels = S.db.relations.relations.filter(r => r.plant_a === n.pid || r.plant_b === n.pid);
  const gaps = n.fields.filter(f => f.gap);
  const refs = Object.entries(e.external_refs || {}).filter(([, u]) => u);
  P.innerHTML = `
    <div class="kicker">plant · ${esc(e.id)}</div>
    <h2><em>${esc(e.scientific_name)}</em></h2>
    <p class="muted">${esc((e.common_names?.en || []).join(', '))}${e.common_names?.zh?.length ? ' · ' + esc(e.common_names.zh.join(' / ')) : ''}</p>
    <table>
      <tr><th>family</th><td>${esc(e.family || '—')}</td></tr>
      <tr><th>type</th><td>${esc(e.kpu_plant_type || '—')}</td></tr>
      <tr><th>origin</th><td>${esc(e.origin_status || '—')}</td></tr>
      <tr><th>street-tree list</th><td>${e.in_vancouver_street_tree_list === null ? '—' : e.in_vancouver_street_tree_list ? 'yes (CoV)' : 'no'}</td></tr>
      <tr><th>as typed by respondents</th><td>${esc((e.raw_names || []).join(', '))} <span class="faint">(${esc((e.respondent_roles || []).join(', '))})</span></td></tr>
    </table>
    ${e.prototype_role ? `<p class="faint">${esc(e.prototype_role)}</p>` : ''}
    <h3>Fields (${n.fields.filter(f => !f.gap).length} sourced · ${gaps.length} empty)</h3>
    ${n.fields.map(f => `<div class="claim-row ${f.gap ? 'dim' : ''}" data-node="${f.id}">${dot(colourOf(f), f.gap ? 'wire' : '')}<div><span class="val">${esc(f.label)}</span> <span class="meta">${f.tier}${f.gap ? ' · no sourced claim' : ` · ${f.sourced.length} claims · ${f.nSources} src · ${Math.round(f.verifiedShare * 100)}% verified`}${f.disagreement ? ' · <span style="color:#e8c37a">values differ</span>' : ''}${f.live.length > f.sourced.length ? ` · <span style="color:${TYPE_COLOUR.candidate}">+${f.live.length - f.sourced.length} candidate</span>` : ''}</span></div></div>`).join('')}
    ${gaps.length ? `<p class="gap">Empty fields are drawn as dashed rings. Planned sources (fill_plan): ${gaps.map(f => `<b>${esc(f.label)}</b> ← ${esc(((n.fill_plan?.[f.tier] || {})[f.field] || []).join(', ') || '—')}`).join('; ')}.</p>` : ''}
    <h3>Relations (${rels.length})</h3>
    ${rels.map(r => `<div class="claim-row ${r.status === 'retired' ? 'dim' : ''}" data-rel="${esc(r.id)}">${dot(TYPE_COLOUR[r.source_type] || '#888', r.source_type === 'model' ? 'wire' : '')}<div><span class="val">${esc(r.relation_type)}</span> with <em>${esc(r.plant_a === n.pid ? r.plant_b : r.plant_a)}</em> <span class="meta">${esc(r.source_id)} · ${esc(r.status)} · ${r.confidence}</span></div></div>`).join('') || '<p class="faint">none</p>'}
    <h3>Source pages (links only)</h3>
    <p>${refs.map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(k)}</a>`).join(' · ') || '—'}</p>
  `;
  bindPanel();
}

function claimRow(c, extra = '') {
  const live = c.status !== 'retired' && c.source_type !== 'model';
  const cls = !live ? 'wire' : (c.status === 'verified' || c.source_type === 'candidate') ? '' : 'shell';
  return `<div class="claim-row ${live ? '' : 'dim'}" data-claim="${esc(c.id)}">${dot(TYPE_COLOUR[c.source_type] || '#888', cls)}<div>
    <span class="val">${esc(summariseValue(c))}</span> ${c.context && shortContext(c.context) ? `<span class="muted">${esc(shortContext(c.context))}</span>` : ''}<br>
    <span class="meta">${esc(c.source_id)} · ${esc(c.source_type)} · ${esc(c.status)} · conf ${c.confidence ?? '—'}${c.value_kind ? ' · ' + esc(c.value_kind) : ''}</span>${extra}
  </div></div>`;
}

function renderField(n) {
  const def = fieldDef(S.db.schema, n.field) || {};
  const sorted = [...n.sourced].sort((a, b) => cmpR5(a, b));
  const cands = n.live.filter(c => c.source_type === 'candidate');
  const dead = n.claims.filter(c => !(c.status !== 'retired' && c.source_type !== 'model'));
  const q = sorted.filter(c => c.value_kind === 'quantitative').map(c => interval(c.value)).filter(Boolean);
  let span = '';
  if (q.length >= 2) { const lo = Math.min(...q.map(i => i[0])), hi = Math.max(...q.map(i => i[1])); span = `<p class="muted">Quantitative values across sources span <b style="color:#eef1f8">${fmt(lo)}–${fmt(hi)} ${esc(q[0][2] || '')}</b>. They are kept side by side, never merged (principle 1).</p>`; }
  P.innerHTML = `
    <div class="kicker">field · <em>${esc(n.plant.label)}</em> · tier ${esc(n.tier)}</div>
    <h2>${esc(n.label)}</h2>
    <p class="muted">${esc(def.survey || '')}${def.note ? ' · ' + esc(def.note) : ''}</p>
    ${n.gap ? `<p class="gap"><b>No sourced claim yet.</b> ${dead.length ? `${dead.length} retired placeholder${dead.length === 1 ? '' : 's'} below show what was guessed.` : ''} Planned sources: ${esc((((n.plant.fill_plan || {})[n.tier] || {})[n.field] || []).join(', ') || '—')}.</p>` : `<p class="muted">${n.sourced.length} sourced claim${n.sourced.length === 1 ? '' : 's'} from ${n.nSources} source${n.nSources === 1 ? '' : 's'} · ${Math.round(n.verifiedShare * 100)}% verified · listed in R5 order (source type → geography → completeness → confidence)</p>`}
    ${span}
    ${sorted.map(c => claimRow(c)).join('')}
    ${cands.length ? `<h3>Candidates (this session)</h3>${cands.map(c => claimRow(c, compareHtml(c, n))).join('')}` : ''}
    ${dead.length ? `<h3>Retired / placeholders</h3>${dead.map(c => claimRow(c)).join('')}` : ''}
    <p style="margin-top:12px"><button data-close="${n.id}">${S.expanded.has(n.id) ? 'Close this field' : 'Open this field'}</button></p>
  `;
  bindPanel();
}

function renderClaim(n) {
  const c = n.claim; const s = S.db.sources[c.source_id] || {};
  const others = n.fieldNode.sourced.filter(o => o.id !== c.id).sort(cmpR5);
  const meta = c.practitioner_meta;
  P.innerHTML = `
    <div class="kicker">claim · <em>${esc(n.fieldNode.plant.label)}</em> · ${esc(n.field)}</div>
    <h2>${esc(summariseValue(c))}</h2>
    <p>${typeTag(c.source_type)}${statusTag(c.status)}<span class="tag">conf ${c.confidence ?? '—'}</span><span class="tag">${esc(c.value_kind || '')}</span></p>
    <p>${esc(c.text)}</p>
    <div class="id">${esc(c.id)}</div>
    <h3>Value</h3><pre>${esc(JSON.stringify(c.value, null, 1))}</pre>
    <h3>Context</h3><p>${esc(c.context || '—')}</p>
    <h3>Source</h3>
    <table>
      <tr><th>id</th><td><a href="#" data-node="source:${esc(c.source_id)}">${esc(c.source_id)}</a> — ${esc(s.name || (c.source_type === 'candidate' ? 'you, this session' : ''))}</td></tr>
      <tr><th>type / geo</th><td>${esc(c.source_type)} · ${esc(s.geo_specificity || (c.source_type === 'candidate' ? 'this session' : '—'))}</td></tr>
      <tr><th>licence tier</th><td>${esc(s.licence_tier || '—')}${s.licence_note ? ` <span class="faint">${esc(s.licence_note)}</span>` : ''}</td></tr>
      ${c.source_url ? `<tr><th>page</th><td>${[].concat(c.source_url).map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\//, '').slice(0, 48))}…</a>`).join('<br>')}</td></tr>` : ''}
      <tr><th>recorded</th><td>${esc(c.recorded_at || '—')}${c.recorded_by ? ' by ' + esc(c.recorded_by) : ''}${c.accessed ? ' · accessed ' + esc(c.accessed) : ''}</td></tr>
      ${c.derived_from ? `<tr><th>derived from</th><td>${[].concat(c.derived_from).map(d => `<a href="#" data-claim="${esc(d)}">${esc(d)}</a>`).join('<br>')}</td></tr>` : ''}
      ${c.retired_by ? `<tr><th>retired by</th><td><a href="#" data-claim="${esc(c.retired_by)}">${esc(c.retired_by)}</a>${c.retired_at ? ' · ' + esc(c.retired_at) : ''}</td></tr>` : ''}
      ${c.retired_reason ? `<tr><th>retired reason</th><td>${esc(c.retired_reason)}</td></tr>` : ''}
      ${c.verify_against ? `<tr><th>verify against</th><td>${esc(c.verify_against.join(', '))}</td></tr>` : ''}
      ${c.migrated_from ? `<tr><th>migrated from</th><td>${esc(c.migrated_from)}</td></tr>` : ''}
    </table>
    ${meta ? `<h3>Practitioner metadata (survey f1)</h3><table>${['basis', 'location', 'maintenance_received', 'site_conditions', 'season_observed', 'plant_age_years', 'observer_background', 'completeness', 'citable'].map(k => `<tr><th>${esc(k.replace(/_/g, ' '))}</th><td>${meta[k] === null || meta[k] === undefined ? '<span class="faint">—</span>' : esc(String(meta[k]))}</td></tr>`).join('')}</table>${meta.citable === false ? `<p class="warn muted">citable: false (${esc(meta.completeness)}) — stored, never cited in an answer (rule R2${c.source_type === 'candidate' ? '; candidates are never citable' : ''}).</p>` : ''}` : ''}
    ${c.note ? `<h3>Note</h3><p class="muted">${esc(c.note)}</p>` : ''}
    ${c.source_type === 'candidate' ? `<h3>Against existing claims</h3>${compareHtml(c, n.fieldNode, true)}` : ''}
    <h3>Other claims on this field (${others.length})</h3>
    ${others.map(o => claimRow(o)).join('') || '<p class="faint">none — this is the only sourced value</p>'}
  `;
  bindPanel();
}

function renderSource(n) {
  const s = n.source; const byPlant = {};
  for (const c of n.claims) (byPlant[c.plant] = byPlant[c.plant] || []).push(c);
  P.innerHTML = `
    <div class="kicker">source · ${esc(n.sid)}</div>
    <h2>${esc(s.name || n.label)}</h2>
    <p>${typeTag(n.type)}<span class="tag">${esc(s.geo_specificity || '—')}</span><span class="tag">tier ${esc(s.licence_tier || '—')}</span><span class="tag">baseline ${s.baseline_confidence ?? '—'}</span></p>
    ${s.publisher ? `<p class="muted">${esc(s.publisher)}</p>` : ''}
    ${s.observer_background ? `<p class="muted">${esc(s.observer_background)}</p>` : ''}
    ${s.licence_note ? `<p class="faint">${esc(s.licence_note)}</p>` : ''}
    ${s.role_in_db ? `<p class="faint">${esc(s.role_in_db)}</p>` : ''}
    ${s.url ? `<p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></p>` : ''}
    <p><button data-light-source="${esc(n.sid)}">Light every claim from this source</button></p>
    ${Object.entries(byPlant).map(([pid, cs]) => `<h3><em>${esc(S.db.plants[pid].entity.scientific_name)}</em> · ${cs.length}</h3>${cs.map(c => claimRow(c)).join('')}`).join('')}
  `;
  bindPanel();
}

function renderRelation(l) {
  const r = l.relation; const pair = S.db.relations.relations.filter(x => x.id !== r.id && [x.plant_a, x.plant_b].sort().join() === [r.plant_a, r.plant_b].sort().join());
  P.innerHTML = `
    <div class="kicker">relation · ${esc(r.id)}</div>
    <h2>${esc(r.relation_type)} <span class="muted">(${esc(r.direction)})</span></h2>
    <p>${typeTag(r.source_type)}${statusTag(r.status)}<span class="tag">conf ${r.confidence}</span></p>
    <p><em>${esc(r.plant_a)}</em> → <em>${esc(r.plant_b)}</em></p>
    <p>${esc(r.text)}</p>
    <h3>Context</h3><p class="muted">${esc(r.context || '—')}</p>
    <table>
      <tr><th>source</th><td><a href="#" data-node="source:${esc(r.source_id)}">${esc(r.source_id)}</a></td></tr>
      <tr><th>recorded</th><td>${esc(r.recorded_at || '—')}${r.recorded_by ? ' by ' + esc(r.recorded_by) : ''}</td></tr>
      ${r.derived_from ? `<tr><th>derived from</th><td>${r.derived_from.map(d => `<a href="#" data-claim="${esc(d)}">${esc(d)}</a>`).join('<br>')}</td></tr>` : ''}
      ${r.supporting_claims ? `<tr><th>supporting claims</th><td>${r.supporting_claims.map(d => `<a href="#" data-claim="${esc(d)}">${esc(d)}</a>`).join('<br>')}</td></tr>` : ''}
      ${r.verify_against ? `<tr><th>verify against</th><td>${esc(r.verify_against.join(', '))}</td></tr>` : ''}
      ${r.retired_by ? `<tr><th>retired by</th><td>${esc(r.retired_by)}</td></tr>` : ''}
    </table>
    ${r.practitioner_meta ? `<p class="faint">practitioner completeness ${esc(r.practitioner_meta.completeness)} · citable ${esc(String(r.practitioner_meta.citable))}</p>` : ''}
    ${r.note ? `<h3>Note</h3><p class="muted">${esc(r.note)}</p>` : ''}
    <h3>Other relations on this pair (${pair.length})</h3>
    ${pair.map(x => `<div class="claim-row ${x.status === 'retired' ? 'dim' : ''}" data-rel="${esc(x.id)}">${dot(TYPE_COLOUR[x.source_type] || '#888', x.source_type === 'model' ? 'wire' : '')}<div><span class="val">${esc(x.relation_type)}</span> <span class="meta">${esc(x.source_id)} · ${esc(x.status)} · ${x.confidence}</span></div></div>`).join('') || '<p class="faint">none</p>'}
  `;
  bindPanel();
}

function bindPanel(root = P) {
  root.querySelectorAll('[data-node]').forEach(el => el.addEventListener('click', ev => { ev.preventDefault(); const n = S.model.nodes.get(el.dataset.node); if (!n) return; if (n.kind === 'source' && !S.Graph.graphData().nodes.includes(n)) { for (const c of n.claims) S.expanded.add(`field:${c.plant}:${c.field}`); refreshGraph(); } onNodeClick(n); }));
  root.querySelectorAll('[data-claim]').forEach(el => el.addEventListener('click', ev => { ev.preventDefault(); selectClaim(el.dataset.claim); }));
  root.querySelectorAll('[data-rel]').forEach(el => el.addEventListener('click', () => { const l = S.model.links.find(x => x.kind === 'rel' && x.relation.id === el.dataset.rel); if (l) onLinkClick(l); }));
  root.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => { const n = S.model.nodes.get(el.dataset.close); if (n) onNodeClick(n); }));
  root.querySelectorAll('[data-light-source]').forEach(el => el.addEventListener('click', () => lightSource(el.dataset.lightSource)));
}

function lightSource(sid) {
  const sn = S.model.nodes.get(`source:${sid}`); if (!sn) return;
  for (const c of sn.claims) S.expanded.add(`field:${c.plant}:${c.field}`);
  refreshGraph();
  const { N, L } = neighbourhood(sn); setFocus(N, L); fitNodes(n => N.has(n.id), 1000, 2.0); renderSource(sn);
}

// ------------------------------------------------------------------ helpers: ranking, intervals, comparison
function cmpR5(a, b) { const ka = S.retr.rankKey(a), kb = S.retr.rankKey(b); for (let i = 0; i < 4; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]; return 0; }
const fmt = x => Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
function interval(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const u = v.unit || 'm';
  if (v.min !== undefined && v.max !== undefined) return [v.min, v.max, u];
  if (v.max !== undefined) return [0, v.max, u];
  if (v.min !== undefined) return [v.min, v.min, u];
  if (v.height_m !== undefined) return [v.height_m, v.height_m, 'm'];
  if (v.spread_m !== undefined) return [v.spread_m, v.spread_m, 'm'];
  if (v.typical_max_m !== undefined) return [0, v.typical_max_m, 'm'];
  if (v.median !== undefined && v.unit === 'm') return [v.p10 ?? v.median, v.p90 ?? v.median, 'm'];
  return null;
}
function compareOne(cand, c) {
  const a = interval(cand.value), b = interval(c.value);
  if (a && b && a[2] === b[2]) {
    if (a[0] >= b[0] && a[1] <= b[1]) return ['within', `inside ${fmt(b[0])}–${fmt(b[1])}`];
    if (a[1] < b[0]) return ['below', `below ${fmt(b[0])}–${fmt(b[1])}`];
    if (a[0] > b[1]) return ['above', `above ${fmt(b[0])}–${fmt(b[1])}`];
    return ['overlaps', `overlaps ${fmt(b[0])}–${fmt(b[1])}`];
  }
  if (Array.isArray(cand.value) && Array.isArray(c.value)) {
    const inter = cand.value.filter(x => c.value.includes(x));
    return inter.length ? ['consistent', `shares ${inter.join(', ')}`] : ['differs', `no shared value`];
  }
  return ['na', 'not comparable (different value kinds)'];
}
function compareHtml(cand, fn, full = false) {
  const rows = fn.sourced.sort(cmpR5).map(c => { const [k, t] = compareOne(cand, c); return { c, k, t }; });
  if (!rows.length) return `<div class="cmp consistent">closes a gap — no sourced claim on this field yet</div>`;
  if (!full) return `<div>${rows.map(r => `<span class="cmp ${r.k}">${r.k}</span> <span class="meta">${esc(r.c.source_id)}${shortContext(r.c.context) ? ' ' + esc(shortContext(r.c.context)) : ''}</span>`).join(' · ')}</div>`;
  return rows.map(r => `<div class="claim-row" data-claim="${esc(r.c.id)}">${dot(TYPE_COLOUR[r.c.source_type])}<div><span class="cmp ${r.k}">${r.k}</span> <span class="val">${esc(summariseValue(r.c))}</span> <span class="muted">${esc(shortContext(r.c.context))}</span><br><span class="meta">${esc(r.c.source_id)} · ${esc(r.t)}</span></div></div>`).join('');
}

// ------------------------------------------------------------------ C2: candidates
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
  if (!value && field === 'exposure' && exposure.length) { value = exposure; value_kind = 'categorical'; }
  if (!value) value = { note: text.trim() };
  return { pid, field, value, value_kind, exposure, names };
}

function loadCandidates() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } }
function saveCandidates() { try { localStorage.setItem(LS_KEY, JSON.stringify(S.candidates)); } catch { /* private window etc. */ } }

function addCandidate(text, pid, field, basis, location) {
  const d = detect(text);
  const n = S.candidates.filter(c => c.plant === pid && c.field === field).length + 1;
  const meta = { basis: basis || null, location: location || null, maintenance_received: null, site_conditions: d.exposure.length ? d.exposure.join(', ') : null, season_observed: null, plant_age_years: null, observer_background: 'this session (unverified user input)', completeness: basis && location ? 'L2' : basis ? 'L1' : 'L0', citable: false };
  const ctxBits = ['candidate (this session)']; if (location) ctxBits.push(location); if (d.exposure.length) ctxBits.push(d.exposure.join(', '));
  const c = {
    id: `candidate:${pid}:${field}:${String(n).padStart(2, '0')}`, plant: pid, field, value_kind: d.value_kind, value: d.value,
    text: text.trim(), source_id: 'candidate', source_type: 'candidate', context: ctxBits.join('; '), confidence: null, status: 'candidate',
    recorded_at: new Date().toISOString().slice(0, 10), recorded_by: 'user (browser session)', practitioner_meta: meta,
  };
  S.candidates.push(c); saveCandidates();
  rebuildModel();
  const fid = `field:${pid}:${field}`; S.expanded.add(fid);
  refreshGraph();
  const cn = S.model.nodes.get(`claim:${c.id}`); const fn = S.model.nodes.get(fid);
  // arrival: grow from nothing beside its field, then particles run plant → field → candidate → you
  if (cn && cn.__obj) { cn.__obj.group.scale.setScalar(0.02); const t0 = performance.now(); (function grow() { const k = Math.min(1, (performance.now() - t0) / 900); const e = 1 - Math.pow(1 - k, 3); cn.__obj.group.scale.setScalar(0.02 + 0.98 * e); if (k < 1) requestAnimationFrame(grow); })(); }
  const burst = S.Graph.graphData().links.filter(l => l.id === `fc:claim:${c.id}` || l.id === `cs:claim:${c.id}` || l.id === `pf:${fid}`);
  for (let i = 0; i < 5; i++) setTimeout(() => burst.forEach(l => S.Graph.emitParticle(l)), 120 * i);
  const { N, L } = neighbourhood(fn); setFocus(N, L); if (cn) { flyTo(cn, 60); S.selected = cn; renderClaim(cn); }
  renderCandList(); renderStats();
  return c;
}

function resetCandidates() {
  S.candidates = []; saveCandidates(); rebuildModel(); refreshGraph(); renderCandList(); renderStats(); clearFocus(); renderOverview();
}
function renderStats() { const t = $('#stats').textContent.replace(/\d+ candidates? this session/, `${S.candidates.length} candidate${S.candidates.length === 1 ? '' : 's'} this session`); $('#stats').textContent = t; }
function renderCandList() {
  const ul = $('#cand-list');
  ul.innerHTML = S.candidates.map((c, i) => `<li><span style="color:${TYPE_COLOUR.candidate}">●</span> <a href="#" data-claim="${esc(c.id)}">${esc(c.plant)} · ${esc(c.field)}</a> — ${esc(c.text.slice(0, 60))}${c.text.length > 60 ? '…' : ''} <button data-rm="${i}">remove</button></li>`).join('') || '<li class="faint" style="border:0">no candidates yet</li>';
  bindPanel(ul);
  ul.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { S.candidates.splice(+b.dataset.rm, 1); saveCandidates(); rebuildModel(); refreshGraph(); renderCandList(); renderStats(); renderOverview(); }));
}

// ------------------------------------------------------------------ C3: retrieval preview
function runQuery(q) {
  if (!q.trim()) return;
  const r = S.retr.run(q); S.lastResult = r;
  // light the evidence path: candidate plants, the fields and sources of ranked claims; flow on cited paths only
  const top = r.ranked.slice(0, 14); const N = new Set(); const L = new Set();
  for (const pid of r.candidates) N.add(`plant:${pid}`);
  for (const c of [...top, ...r.withheld, ...r.candidateHits]) { S.expanded.add(`field:${c.plant}:${c.field}`); }
  refreshGraph();
  S.flow = new Set();
  for (const c of [...top, ...r.withheld, ...r.candidateHits]) {
    const fid = `field:${c.plant}:${c.field}`; N.add(fid); N.add(`claim:${c.id}`); N.add(`source:${c.source_id}`); N.add(`plant:${c.plant}`);
    L.add(`pf:${fid}`); L.add(`fc:claim:${c.id}`); L.add(`cs:claim:${c.id}`);
    if (top.includes(c)) { S.flow.add(`pf:${fid}`); S.flow.add(`fc:claim:${c.id}`); S.flow.add(`cs:claim:${c.id}`); }
  }
  setFocus(N, L);
  $('#ask-label').classList.add('on');
  if (N.size > 3) setTimeout(() => fitNodes(n => N.has(n.id), 1200, 2.0), 80);
  renderAskResult(r);
}

function renderAskResult(r) {
  const el = $('#ask-result'); const plants = S.db.plants;
  const gateRows = Object.entries(r.gates).filter(([, g]) => Object.keys(g).length);
  const candNote = S.candidates.length ? (r.candidateHits.length ? `<p class="cand">Δ with your candidates: ${r.candidateHits.length} candidate claim${r.candidateHits.length === 1 ? '' : 's'} recalled — shown as unverified user input, never cited, ranked after every sourced claim.</p>` : `<p class="muted">Δ with your candidates: none recalled for this question.</p>`) : '';
  el.innerHTML = `
    <h3>Routes</h3>
    <div class="muted">names: ${Object.keys(r.names).length ? Object.entries(r.names).map(([k, v]) => `<em>${esc(k)}</em> (${esc(v.join(', '))})`).join(', ') : 'none'} · intents: ${r.intents.length ? r.intents.map(i => `${esc(i.term)} → ${esc(i.field)} <span class="why">${esc(i.mode)}</span>`).join(', ') : 'none'}</div>
    ${gateRows.length ? `<h3>Gates (structured route)</h3><table>${gateRows.map(([pid, g]) => `<tr><th><em>${esc(plants[pid].entity.scientific_name)}</em></th><td>${Object.entries(g).map(([t, v]) => `<span class="tag ${v === 'pass' ? 'verified' : v === 'fail' ? 'retired' : 'unverified'}">${esc(t)}: ${esc(v)}</span>`).join(' ')}</td></tr>`).join('')}</table>` : ''}
    <div class="muted" style="margin-top:6px">candidates after gates: ${r.candidates.map(p => `<em>${esc(p)}</em>`).join(', ') || 'none'}${r.excluded.length ? ` · excluded: ${r.excluded.join(', ')}` : ''} · recall ${r.recall_n} claims by BM25 (similarity decides recall only) · ${r.withheld.length} L0 practitioner claim${r.withheld.length === 1 ? '' : 's'} withheld (R2)</div>
    <h3>Answer order (R5) · attribution (R6)</h3>
    ${r.ranked.length ? r.ranked.slice(0, 14).map((c, i) => `<div class="r" data-claim="${esc(c.id)}"><span class="rank">${i + 1}.</span> ${esc(S.retr.attribute(c))}<div class="why">${esc(c.id)} · ${esc(c.field)} · ${esc(S.retr.why(c))}</div></div>`).join('') + (r.ranked.length > 14 ? `<div class="muted">… ${r.ranked.length - 14} more</div>` : '') : '<p class="warn">No sourced claim matches — honest empty answer; the field may exist with no source yet.</p>'}
    ${r.withheld.length ? `<h3>Withheld (L0, not citable)</h3>${r.withheld.map(c => `<div class="r" data-claim="${esc(c.id)}"><span class="muted">${esc(c.text)}</span><div class="why">${esc(c.id)} · stored, never cited (R2)</div></div>`).join('')}` : ''}
    ${r.candidateHits.length ? `<h3>Candidates recalled (unverified user input)</h3>${r.candidateHits.map(c => `<div class="r cand" data-claim="${esc(c.id)}">${esc(c.text)}<div class="why">${esc(c.id)} · flagged, not cited</div></div>`).join('')}` : ''}
    ${candNote}
  `;
  bindPanel(el);
}

function renderLegend() {
  const types = new Set(); for (const p of Object.values(S.db.plants)) for (const c of p.claims) types.add(c.source_type);
  for (const r of S.db.relations.relations) types.add(r.source_type);
  const order = S.db.schema.claim.fields.source_type.priority_order.filter(t => types.has(t) && t !== 'model');
  $('#legend-types').innerHTML = order.map(t => `<i style="background:${TYPE_COLOUR[t]}"></i> ${t}`).join(' &nbsp;') + ` <span class="sub">· source types present in the store (${order.length} of ${S.db.schema.claim.fields.source_type.values.length - 1} in the schema)</span>`;
}

// ------------------------------------------------------------------ UI wiring
function initUi() {
  const drawers = { ask: $('#ask'), add: $('#add') };
  const toggle = k => { for (const [n, d] of Object.entries(drawers)) d.classList.toggle('open', n === k && !d.classList.contains('open')); $('#btn-ask').classList.toggle('on', drawers.ask.classList.contains('open')); $('#btn-add').classList.toggle('on', drawers.add.classList.contains('open')); };
  $('#btn-ask').addEventListener('click', () => toggle('ask'));
  $('#btn-add').addEventListener('click', () => toggle('add'));
  $('#btn-reset').addEventListener('click', () => { S.expanded.clear(); S.selected = null; S.flow = new Set(); refreshGraph(); clearFocus(); $('#ask-label').classList.remove('on'); fitNodes(() => true, 1200, 2.4); renderOverview(); });

  // ask
  const Q = S.db.queries.queries;
  $('#ask-store').textContent = `${Object.values(S.db.plants).reduce((a, p) => a + p.claims.length, 0)} claims`;
  $('#qbtns').innerHTML = Q.map(q => `<button data-q="${esc(q.query)}" title="${esc(q.note || '')}">${esc(q.query)} <small>${esc(q.id)} · ${esc(q.status)}</small></button>`).join('');
  $('#qbtns').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { $('#ask-input').value = b.dataset.q; runQuery(b.dataset.q); }));
  $('#ask-run').addEventListener('click', () => runQuery($('#ask-input').value));
  $('#ask-input').addEventListener('keydown', e => { if (e.key === 'Enter') runQuery($('#ask-input').value); });
  $('#ask-clear').addEventListener('click', () => { S.flow = new Set(); clearFocus(); $('#ask-label').classList.remove('on'); $('#ask-result').innerHTML = ''; });

  // add
  const ps = $('#add-plant'); ps.innerHTML = S.db.plantIds.map(id => `<option value="${id}">${esc(S.db.plants[id].entity.scientific_name)}</option>`).join('');
  const fs = $('#add-field'); const tiers = S.db.schema.field_tiers;
  fs.innerHTML = Object.entries(tiers).flatMap(([t, v]) => Object.keys(v.fields || {}).map(f => `<option value="${f}">${f.replace(/_/g, ' ')} (${t})</option>`)).join('');
  const update = () => { const d = detect($('#add-text').value); if (d.pid) ps.value = d.pid; if (d.field) fs.value = d.field; $('#add-detected').textContent = `detected → plant: ${d.pid || '?'} · field: ${d.field || '?'} · value: ${JSON.stringify(d.value)}${d.exposure.length ? ' · exposure: ' + d.exposure.join(', ') : ''}`; };
  $('#add-text').addEventListener('input', update);
  $('#add-go').addEventListener('click', () => { const t = $('#add-text').value.trim(); if (!t) return; addCandidate(t, ps.value, fs.value, $('#add-basis').value, $('#add-location').value.trim()); $('#add-text').value = ''; $('#add-detected').textContent = ''; });
  $('#add-reset').addEventListener('click', resetCandidates);
  renderCandList();
}

// expose for debugging / screenshots
function selectRelation(id) { const l = S.model.links.find(x => x.kind === 'rel' && x.relation.id === id); if (l) onLinkClick(l); }
function selectPlant(pid) { const n = S.model.nodes.get(`plant:${pid}`); if (n) onNodeClick(n); }
window.brain = { S, openField, selectClaim, selectRelation, selectPlant, runQuery, addCandidate, resetCandidates, lightSource, fitNodes };
