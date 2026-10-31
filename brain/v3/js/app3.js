// Knowledge Brain v3 — a visualisation of the database system: foundations → rules → schema × plants → sources,
// with construction steps on the side. Everything drawn comes from the projection (js/projection.js) built from the
// repository files at load. Read-only. Candidates live in this browser's localStorage only.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { loadDb, loadDocs } from './data.js';
import { buildProjection, LINK_TYPES, PROJECTION_RULES, geoLabel } from './projection.js';
import { makeRetriever } from './retrieve.js';
import { TYPE_COLOUR, summariseValue } from './model.js';
import { isLive, isSourced, parseContext, relate, GEO_RANK } from './knowledge.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const LS_KEY = 'brain.candidates.v1';
const PANEL_W = 372 + 32;
const COL = { tile: '#aeb8d0', plant: '#fff1c2', rule: '#b48cff', method: '#8f7bd9', decision: '#d9b8ff', principle: '#e3d2ff', survey: '#ffd27a', step: '#9fd3ff', gap: '#3a4160', verified: '#6ff2b0', candidate: '#ff5fb4', differ: '#ff8c6b', cond: '#e8c37a' };
const LAYER_Y = {}; // filled by layout

const S = { db: null, docs: null, G: null, Graph: null, retr: null, candidates: [], objs: new Map(), labels: [], lines: null, view: { mode: 'system' }, history: [], lit: null, activation: null, lastResult: null, pdown: null, swallow: false, steps: [] };

// ------------------------------------------------------------------ boot
(async function boot() {
  try {
    [S.db, S.docs] = await Promise.all([loadDb(), loadDocs()]);
    S.candidates = loadCandidates();
    S.retr = makeRetriever(S.db, () => S.candidates);
    S.G = buildProjection(S.db, S.docs, S.candidates);
    S.steps = buildSteps();
    initHost(); buildScene(); initUi();
    go({ mode: 'system' }, true);
    $('#loading').classList.add('gone');
    startAmbient();
  } catch (e) { $('#err').textContent = `could not load the db: ${e.message}\n\nserve from the planting-db root:  python3 -m http.server 8766  → http://localhost:8766/brain/`; console.error(e); }
})();

// ------------------------------------------------------------------ construction steps (computed from claim fields; the step list is the brief's, the numbers are live)
function buildSteps() {
  const G = S.G; const N = [...G.nodes.values()]; const claims = N.filter(n => n.kind === 'claim' && n.status !== 'candidate').map(n => n.claim);
  const srcWith = new Set(claims.filter(isSourced).map(c => c.source_id));
  const srcNodes = N.filter(n => n.kind === 'source' && n.sid !== 'candidate' && n.sid !== 'survey' && !n.parent);
  const st = S.G.stats;
  return [
    { id: 'step:decide', label: 'Survey-informed decisions', count: `${N.filter(n => n.kind === 'survey').length} survey questions · ${st.decisions} decisions · ${st.principles} principles`, items: N.filter(n => ['survey', 'decision', 'principle'].includes(n.kind)).map(n => n.id), basis: 'schema.json design_basis · HANDOFF.md decisions · principles.md', status: 'done' },
    { id: 'step:collect', label: 'Source collection & licence check', count: `${srcWith.size} sources with claims · ${srcNodes.length - srcWith.size} listed, no claim yet · licence tiers A/B/C`, items: srcNodes.map(n => n.id), basis: 'sources.json (type, geo, licence text, tier)', status: 'done' },
    { id: 'step:extract', label: 'Extraction', count: Object.entries(st.routes).map(([k, v]) => `${v} ${k.replace('stage:', '').replace('tool:', '')}`).join(' · '), items: N.filter(n => n.kind === 'stage' || n.kind === 'tool').map(n => n.id), basis: 'claim.recorded_by · T1 script · T5 assisted (structured values only) · survey export · placeholders', status: 'partial' },
    { id: 'step:normalise', label: 'Normalisation', count: `value_kind: ${['quantitative', 'categorical', 'qualitative'].map(k => `${claims.filter(c => c.value_kind === k).length} ${k}`).join(' · ')} · ${claims.filter(c => c.derived_from).length} derived (R9) · ${N.filter(n => n.kind === 'vocab').length} KPU vocabularies`, items: ['struct:value_kind', ...N.filter(n => n.kind === 'vocab').map(n => n.id), 'rule:R9', 'file:synonyms.json'], basis: 'schema.json vocab · claim.value_kind · claim.derived_from', status: 'done' },
    { id: 'step:validate', label: 'Schema validation', count: `${claims.length} claims · tools/validate.py runs outside the browser (last run: see README)`, items: ['tool:validate.py', 'stage:T3', 'struct:claim'], basis: 'tools/validate.py — not re-run here, so no live result is claimed', status: 'offline' },
    { id: 'step:verify', label: 'Human verification', count: `${st.verified} verified · ${st.unverified} unverified (review deferred, D5) · 0 disputed`, items: ['struct:status', 'tool:verify_claims.py', 'tool:review_list.py', 'decision:D5'].filter(id => G.nodes.has(id)), basis: 'claim.status · review/ checklists · decision D5', status: 'partial' },
    { id: 'step:retire', label: 'Updates & retirement', count: `${st.retired} placeholders retired (R10) · ${claims.filter(c => c.edited).length} claims edited · methods superseded: M1a, M10`, items: ['rule:R10', 'tool:merge_claims.py', 'struct:status', ...N.filter(n => n.kind === 'method' && /M1a|M10$/.test(n.mid)).map(n => n.id)].filter(id => G.nodes.has(id)), basis: 'claim.retired_by · claim.edited · methods.md', status: 'done' },
  ];
}

// ------------------------------------------------------------------ three host (3d-force-graph as renderer/controls/bloom; no graph nodes of its own)
function initHost() {
  const Graph = new ForceGraph3D($('#graph'), { controlType: 'orbit' }).backgroundColor('#02030a').showNavInfo(false).enableNodeDrag(false).graphData({ nodes: [], links: [] });
  Graph.scene().fog = new THREE.FogExp2(0x02030a, 0.0011);
  Graph.postProcessingComposer().addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.4, 0.45));
  Graph.cameraPosition({ x: 0, y: 40, z: 320 }, { x: 0, y: 0, z: 0 }, 0);
  S.Graph = Graph;
  const el = Graph.renderer().domElement;
  el.addEventListener('pointerdown', e => { S.pdown = [e.clientX, e.clientY]; });
  el.addEventListener('pointerup', e => { if (!S.pdown) return; const [x, y] = S.pdown; S.pdown = null; if (Math.hypot(e.clientX - x, e.clientY - y) > 4) return; const id = pick(e); if (id) act(id); else if (S.view.mode !== 'system') up(); });
  el.addEventListener('pointermove', e => { const id = pick(e); document.body.style.cursor = id ? 'pointer' : ''; if (id) showTip(id, e); else hideTip(); });
  window.addEventListener('resize', () => moveCamera(400));
  (function loop() { frame(); requestAnimationFrame(loop); })();
}

// ------------------------------------------------------------------ primitives
function rrect(w, h, r = 0.5) { const s = new THREE.Shape(); const x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return new THREE.ShapeGeometry(s, 4); }
function tile(w, h, colour, alpha, opts = {}) {
  const g = new THREE.Group(); const mats = [];
  const geo = rrect(w, h, opts.r ?? 0.6);
  const fill = new THREE.MeshBasicMaterial({ color: new THREE.Color(colour), transparent: true, opacity: opts.hollow ? alpha * 0.12 : alpha, depthWrite: false, side: THREE.DoubleSide }); mats.push(fill);
  g.add(new THREE.Mesh(geo, fill));
  if (opts.hollow || opts.outline) {
    const edges = new THREE.EdgesGeometry(geo);
    const lm = opts.dashed ? new THREE.LineDashedMaterial({ color: new THREE.Color(colour), transparent: true, opacity: Math.min(1, alpha + 0.15), dashSize: 0.8, gapSize: 0.6 }) : new THREE.LineBasicMaterial({ color: new THREE.Color(colour), transparent: true, opacity: Math.min(1, alpha + 0.2) });
    const ls = new THREE.LineSegments(edges, lm); if (opts.dashed) ls.computeLineDistances(); g.add(ls); mats.push(lm);
  }
  for (const m of mats) m.userData.base = m.opacity;
  g.userData.mats = mats; return g;
}
function addObj(id, group, pos, w, h) { group.position.copy(pos); group.userData.id = id; group.traverse(o => { o.userData.id = id; }); S.world.add(group); S.objs.set(id, { group, pos: pos.clone(), w, h, mats: collectMats(group) }); return group; }
function collectMats(g) { const m = []; g.traverse(o => { if (o.userData.mats) m.push(...o.userData.mats); }); return m; }
function label(id, pos, html, cls, opts = {}) { const el = document.createElement('div'); el.className = `lbl ${cls}`; el.innerHTML = html; el.dataset.id = id; if (opts.maxw) el.style.maxWidth = opts.maxw + 'px'; el.addEventListener('click', e => { e.stopPropagation(); const k = e.target.closest('[data-id]'); act(k ? k.dataset.id : id); }); $('#labels').appendChild(el); const L = { id, pos, el, cls, show: opts.show || 'always', near: opts.near, layer: opts.layer || null }; S.labels.push(L); return L; }
// which layer a node's label belongs to (shown when that layer is open, or when the node is in the focus set)
const LABEL_LAYER = { survey: 'foundations', decision: 'foundations', principle: 'foundations', rule: 'rules', method: 'rules', struct: 'rules', file: 'rules', field: 'schema', vocab: 'schema', relation: 'plants', source: 'sources', stage: 'construction', tool: 'construction' };

// ------------------------------------------------------------------ scene layout
function buildScene() {
  const G = S.G; S.world = new THREE.Group(); S.Graph.scene().add(S.world);
  S.lines = new THREE.Group(); S.Graph.scene().add(S.lines);
  const N = G.plantIds.length; const CW = 30, ROW = 3.0, TIER_GAP = 5;
  const X = i => (i - (N - 1) / 2) * CW;
  const leftEdge = X(0) - CW / 2, rightEdge = X(N - 1) + CW / 2;
  // rows
  const rows = []; let y = 0; let lastTier = null;
  for (const f of G.fieldList) { if (lastTier && f.tier !== lastTier) y -= TIER_GAP; rows.push({ ...f, y }); y -= ROW; lastTier = f.tier; }
  const H = -y; const yTop = H / 2; for (const r of rows) r.y += yTop;
  S.layout = { X, CW, ROW, leftEdge, rightEdge, yTop, yBot: -yTop, rows, W: rightEdge - leftEdge };
  LAYER_Y.matrix = 0; LAYER_Y.plants = yTop + 7; LAYER_Y.rules = yTop + 24; LAYER_Y.methods = yTop + 32; LAYER_Y.decisions = yTop + 44; LAYER_Y.principles = yTop + 58; LAYER_Y.survey = yTop + 70; LAYER_Y.sources = -yTop - 13;

  // layer titles (always visible, counts live)
  const st = G.stats;
  const Wr0 = Math.max((rightEdge - leftEdge) + 60, 90);
  const title = (id, yy, text, sub) => label(id, new THREE.Vector3(-Wr0 / 2 - 16, yy, 0), `${text}<small>${sub}</small>`, 'layer r', { show: 'always' });
  title('layer:foundations', LAYER_Y.survey, 'Foundations', `${[...G.nodes.values()].filter(n => n.kind === 'survey').length} survey questions · ${st.principles} principles · ${st.decisions} decisions`);
  title('layer:rules', LAYER_Y.rules, 'Rules & methods', `${st.rules} rules · ${st.methods} methods (${st.methodsToConfirm} to confirm)`);
  title('layer:schema', yTop - 2, 'Schema × plants', `${st.fields} fields in ${st.tiers} tiers · ${st.plants} plants · ${st.claims} claims`);
  title('layer:sources', LAYER_Y.sources, 'Sources', `${st.sourcesWithClaims} of ${st.sources} with claims · ${st.respondents} respondents`);

  // tiers & fields (schema rows)
  let tierStart = {};
  for (const r of rows) { if (!(r.tier in tierStart)) tierStart[r.tier] = r.y; }
  for (const [t, ty] of Object.entries(tierStart)) {
    const T = G.nodes.get(`tier:${t}`); const rowsT = rows.filter(r => r.tier === t); const y0 = rowsT[0].y + ROW / 2, y1 = rowsT[rowsT.length - 1].y - ROW / 2;
    const bracket = new THREE.Group(); const lm = new THREE.LineBasicMaterial({ color: new THREE.Color(COL.tile), transparent: true, opacity: 0.35 }); lm.userData.base = 0.35;
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, y0, 0), new THREE.Vector3(0, y1, 0)]); bracket.add(new THREE.Line(geo, lm)); bracket.userData.mats = [lm];
    addObj(`tier:${t}`, bracket, new THREE.Vector3(leftEdge - 30, 0, 0), 2, y0 - y1);
    label(`tier:${t}`, new THREE.Vector3(leftEdge - 31.5, (y0 + y1) / 2, 0), `${esc(t)}<small>${rowsT.length} fields · ${G.stats.byTier[t] ? `${G.stats.byTier[t].covered}/${G.stats.byTier[t].cells} cells sourced` : ''}</small>`, 'tier r', { show: 'always' });
  }
  for (const r of rows) {
    const F = G.nodes.get(`field:${r.field}`);
    const anchor = new THREE.Group(); anchor.userData.mats = []; addObj(F.id, anchor, new THREE.Vector3(leftEdge - 3, r.y, 0), 0.1, ROW);
    const cov = G.plantIds.filter(pid => G.cells.get(`cell:${pid}:${r.field}`).sourced.length).length;
    label(F.id, new THREE.Vector3(leftEdge - 2.2, r.y, 0), `${esc(F.label)}${F.def.vocab ? ` <i class="chip">${esc(F.def.vocab.replace(/^kpu_/, 'KPU '))}</i>` : ''}<small>${cov}/${N}</small>`, 'field r', { show: 'near', near: 190 });
    // vocab chip object (positions for links)
    if (F.def.vocab && !S.objs.has(`vocab:${F.def.vocab}`)) { const g = tile(5, 1.6, COL.tile, 0.25, { hollow: true }); addObj(`vocab:${F.def.vocab}`, g, new THREE.Vector3(leftEdge - 50, r.y, 0), 5, 1.6); label(`vocab:${F.def.vocab}`, new THREE.Vector3(leftEdge - 53, r.y, 0), `${esc(G.nodes.get(`vocab:${F.def.vocab}`).label)}<small>${G.nodes.get(`vocab:${F.def.vocab}`).values.length} values</small>`, 'vocab r', { show: 'focus' }); }
  }
  // plants and cells
  G.plantIds.forEach((pid, i) => {
    const P = G.nodes.get(`plant:${pid}`); const x = X(i);
    const g = tile(CW - 3, 4.2, COL.plant, 0.85); addObj(P.id, g, new THREE.Vector3(x, LAYER_Y.plants, 0), CW - 3, 4.2);
    const cs = [...G.cells.values()].filter(c => c.pid === pid);
    label(P.id, new THREE.Vector3(x, LAYER_Y.plants + 4.2, 0), `<em>${esc(P.label)}</em><small>${cs.reduce((a, c) => a + c.sourced.length, 0)} claims · ${cs.reduce((a, c) => a + c.verified.length, 0)} verified · ${cs.filter(c => c.sourced.length).length}/${cs.length} fields</small>`, 'plant c', { show: 'always' });
    for (const r of rows) {
      const cell = G.cells.get(`cell:${pid}:${r.field}`); const col = cellColour(cell); const g2 = new THREE.Group();
      const w = CW - 3.2, h = ROW - 0.8;
      if (!cell.sourced.length) { g2.add(tile(w, h, cell.cands.length ? COL.candidate : COL.gap, cell.planned.length ? 0.55 : 0.35, { hollow: true, dashed: true })); }
      else {
        g2.add(tile(w, h, col, 0.22 + 0.1 * Math.min(cell.sourced.length, 4)));
        const share = cell.verified.length / cell.sourced.length; if (share > 0) { const v = tile(w * share, h, col, 0.95, { r: 0.4 }); v.position.x = -w / 2 + (w * share) / 2; g2.add(v); }
        const out = tile(w, h, col, 0.5, { hollow: true }); out.children[0].material.opacity = 0; out.children[0].material.userData.base = 0; g2.add(out);
      }
      const diff = G.adj.get(cell.id) && [...G.links.filter(l => l.type === 'knowledge' && cell.claims.some(c => l.source === `claim:${c.id}`))]; const flags = diff || [];
      if (flags.some(l => l.cls === 'differ')) { const d = tile(0.9, 0.9, COL.differ, 1, { r: 0.45 }); d.position.set(-w / 2 + 0.9, h / 2 - 0.7, 0.05); g2.add(d); }
      else if (flags.some(l => l.cls === 'cond')) { const d = tile(0.9, 0.9, COL.cond, 1, { r: 0.45 }); d.position.set(-w / 2 + 0.9, h / 2 - 0.7, 0.05); g2.add(d); }
      if (cell.cands.length) { const d = tile(1.1, 1.1, COL.candidate, 1, { r: 0.3 }); d.position.set(w / 2 - 1, 0, 0.06); g2.add(d); }
      g2.userData.mats = collectMats(g2); addObj(cell.id, g2, new THREE.Vector3(x, r.y, 0), w, h);
      for (const c of cell.claims) S.objs.set(`claim:${c.id}`, S.objs.get(cell.id));   // claims share their cell's position
    }
  });
  // relations: arcs above plant headers
  const rels = [...G.nodes.values()].filter(n => n.kind === 'relation'); const pairIdx = {};
  for (const R of rels) {
    const a = G.plantIds.indexOf(R.rel.plant_a), b = G.plantIds.indexOf(R.rel.plant_b); if (a < 0 || b < 0) continue;
    const key = [a, b].sort().join('-'); const k = (pairIdx[key] = (pairIdx[key] ?? -1) + 1);
    const p0 = new THREE.Vector3(X(a), LAYER_Y.plants + 2.3, 0), p1 = new THREE.Vector3(X(b), LAYER_Y.plants + 2.3, 0); const mid = p0.clone().add(p1).multiplyScalar(0.5); mid.y += 6 + k * 3.2; mid.z += 2;
    const colour = TYPE_COLOUR[R.type] || '#888'; const alpha = R.status === 'verified' ? 0.95 : R.type === 'model' ? 0.3 : 0.6;
    const pts = new THREE.QuadraticBezierCurve3(p0, mid, p1).getPoints(28); const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = R.type === 'model' ? new THREE.LineDashedMaterial({ color: new THREE.Color(colour), transparent: true, opacity: alpha, dashSize: 1.2, gapSize: 0.9 }) : new THREE.LineBasicMaterial({ color: new THREE.Color(colour), transparent: true, opacity: alpha });
    mat.userData.base = alpha; const line = new THREE.Line(geo, mat); if (R.type === 'model') line.computeLineDistances(); const g = new THREE.Group(); g.add(line); g.userData.mats = [mat];
    addObj(R.id, g, new THREE.Vector3(0, 0, 0), 1, 1); S.objs.get(R.id).pos.copy(mid); S.objs.get(R.id).hitLine = line;
    label(R.id, mid.clone().add(new THREE.Vector3(0, 0.9, 0)), `${esc(R.label)}<small>${esc(R.status)}${R.type === 'model' ? ' · placeholder' : ''}</small>`, 'rel c', { show: 'near', near: 150 });
  }
  // rules row
  const rules = [...G.nodes.values()].filter(n => n.kind === 'rule'); const Wr = Math.max(S.layout.W + 60, rules.length * 9);
  rules.forEach((R, i) => { const x = -Wr / 2 + (i + 0.5) * (Wr / rules.length); const g = tile(7.6, 3.2, COL.rule, 0.5, { outline: true }); addObj(R.id, g, new THREE.Vector3(x, LAYER_Y.rules, 0), 7.6, 3.2); label(R.id, new THREE.Vector3(x, LAYER_Y.rules, 0.1), `<b>${esc(R.rid)}</b><small>${esc(shortRule(R.text))}</small>`, 'rule c', { show: 'always', maxw: 120 }); });
  // methods (small, behind)
  const methods = [...G.nodes.values()].filter(n => n.kind === 'method'); const perRow = Math.ceil(methods.length / 2);
  methods.forEach((M, i) => { const row = Math.floor(i / perRow), j = i % perRow; const x = -Wr / 2 + (j + 0.5) * (Wr / perRow); const yy = LAYER_Y.methods + (row ? 0 : 3.2); const g = tile(4.6, 1.9, COL.method, M.toConfirm ? 0.35 : 0.55, { hollow: M.toConfirm, dashed: M.toConfirm }); addObj(M.id, g, new THREE.Vector3(x, yy, -8), 4.6, 1.9); label(M.id, new THREE.Vector3(x, yy, -8), `${esc(M.mid)}${M.confirmed ? ' ✓' : M.toConfirm ? ' ?' : ''}`, 'method c', { show: 'near', near: 120 }); });
  // decisions, principles, survey
  const rowOf = (kind, yy, colour, w, h, cls, near, text) => { const items = [...G.nodes.values()].filter(n => n.kind === kind); const Wd = Math.max(S.layout.W + 60, items.length * (w + 1.5)); const stagger = items.length > 12; items.forEach((n, i) => { const x = -Wd / 2 + (i + 0.5) * (Wd / items.length); const y2 = yy + (stagger && i % 2 ? -4.6 : 0); const g = tile(w, h, colour, 0.45, { outline: true }); addObj(n.id, g, new THREE.Vector3(x, y2, 0), w, h); label(n.id, new THREE.Vector3(x, y2, 0.1), text(n), cls, { show: 'near', near, maxw: stagger ? 96 : 120 }); }); };
  rowOf('decision', LAYER_Y.decisions, COL.decision, 7.2, 2.6, 'decision c', 160, n => `<b>${esc(n.did || 'decision')}</b><small>${esc(n.label.slice(0, 34))}${n.label.length > 34 ? '…' : ''}</small>`);
  rowOf('principle', LAYER_Y.principles, COL.principle, 7.2, 2.6, 'principle c', 160, n => `<b>§${n.num}</b><small>${esc(n.label.replace(/^§\d+\s*/, '').slice(0, 44))}</small>`);
  rowOf('survey', LAYER_Y.survey, COL.survey, 6.2, 2.4, 'survey c', 160, n => `<b>${esc(n.code)}</b><small>${esc(n.label.replace(/^\w\d · /, '').slice(0, 40))}</small>`);
  // structs & files: a small column left of the rules
  const structs = [...G.nodes.values()].filter(n => n.kind === 'struct' || n.kind === 'file');
  structs.forEach((n, i) => { const x = -Wr / 2 - 22; const yy = LAYER_Y.rules + 10 - i * 3.4; const g = tile(9, 2.6, COL.tile, 0.3, { hollow: true }); addObj(n.id, g, new THREE.Vector3(x, yy, 0), 9, 2.6); label(n.id, new THREE.Vector3(x, yy, 0.1), `${esc(n.label.split(' · ')[0].slice(0, 34))}`, 'struct c', { show: 'near', near: 140, maxw: 120 }); });
  // sources: grouped by type
  const TYPE_ORDER = ['practitioner', 'municipal', 'database', 'literature', 'model'];
  const srcs = [...G.nodes.values()].filter(n => n.kind === 'source' && n.sid !== 'candidate' && !n.parent).sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || (GEO_RANK[a.geo] ?? 9) - (GEO_RANK[b.geo] ?? 9));
  const Ws = Math.max(S.layout.W + 60, srcs.length * 16); let sx = -Ws / 2; const groupGap = 4; let lastType = null;
  const slot = Ws / srcs.length;
  const groupX = {}; 
  srcs.forEach((n, i) => { if (lastType && n.type !== lastType) sx += groupGap; lastType = n.type; const x = sx + slot / 2; sx += slot; (groupX[n.type] = groupX[n.type] || []).push(x); const yy = LAYER_Y.sources - (i % 2 ? 5.2 : 0); const has = S.G.adj.get(n.id)?.some(l => l.type === 'provenance' && l.label === 'source of'); const g = tile(9.2, 3, TYPE_COLOUR[n.type] || '#888', has ? 0.8 : 0.3, { hollow: !has, outline: true }); addObj(n.id, g, new THREE.Vector3(x, yy, 0), 9.2, 3); label(n.id, new THREE.Vector3(x, yy + (i % 2 ? -2.6 : 2.6), 0.1), `${esc(n.label)}<small>${esc(n.type)} · ${esc(geoLabel(n.geo))}${n.tier ? ' · tier ' + esc(n.tier) : ''}${has ? '' : ' · no claim yet'}</small>`, 'source c', { show: 'near', near: 200, maxw: 84 }); });
  for (const [t, xs] of Object.entries(groupX)) label(`group:${t}`, new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, LAYER_Y.sources - 8.6, 0), `${esc(t)}<small>${xs.length}</small>`, 'srcgroup c', { show: 'always' });
  // respondents under the survey parent
  const resp = [...G.nodes.values()].filter(n => n.kind === 'source' && n.parent === 'survey'); const sp = S.objs.get('source:survey');
  if (sp) resp.forEach((n, i) => { const x = sp.pos.x - (resp.length - 1) * 1.6 / 2 + i * 1.6; const g = tile(1.3, 1.3, TYPE_COLOUR.practitioner, 0.8, { r: 0.3 }); addObj(n.id, g, new THREE.Vector3(x, sp.pos.y + 2.6, 0), 1.3, 1.3); });
  // candidate source tile when candidates exist
  if (S.candidates.length) { const g = tile(9.2, 3, COL.candidate, 0.9, { outline: true }); const x = Ws / 2 + 8; addObj('source:candidate', g, new THREE.Vector3(x, LAYER_Y.sources, 0), 9.2, 3); label('source:candidate', new THREE.Vector3(x, LAYER_Y.sources - 2.4, 0.1), `you (candidate)<small>${S.candidates.length} this session · never cited</small>`, 'source c', { show: 'always' }); }
  // construction steps: a chain on the right
  const sxr = rightEdge + 30; const stepTop = yTop + 2, stepBot = LAYER_Y.sources + 4; const n = S.steps.length;
  S.steps.forEach((s, i) => { const yy = stepBot + (stepTop - stepBot) * (i / (n - 1)); const colour = s.status === 'done' ? COL.step : s.status === 'offline' ? COL.tile : COL.cond; const g = tile(10, 3.2, colour, s.status === 'done' ? 0.6 : 0.35, { hollow: s.status !== 'done', dashed: s.status === 'offline' }); addObj(s.id, g, new THREE.Vector3(sxr, yy, 0), 10, 3.2); label(s.id, new THREE.Vector3(sxr + 6, yy, 0.1), `${esc(s.label)}<small>${esc(s.status === 'offline' ? 'runs outside the browser' : s.status)}</small>`, 'step l', { show: 'always', maxw: 200 }); if (i < n - 1) { const y2 = stepBot + (stepTop - stepBot) * ((i + 1) / (n - 1)); const lm = new THREE.LineBasicMaterial({ color: new THREE.Color(COL.step), transparent: true, opacity: 0.3 }); lm.userData.base = 0.3; const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sxr, yy + 1.6, 0), new THREE.Vector3(sxr, y2 - 1.6, 0)]); const ln = new THREE.Line(geo, lm); const gg = new THREE.Group(); gg.add(ln); gg.userData.mats = [lm]; addObj(`chain:${i}`, gg, new THREE.Vector3(0, 0, 0), 1, 1); } });
  label('layer:construction', new THREE.Vector3(sxr, stepTop + 5, 0), `Construction<small>T1–T7: ${G.stats.stages.map(([t, s]) => `${t} ${s}`).join(' · ')}</small>`, 'layer c', { show: 'always', maxw: 260 });
  // stage & tool nodes: positions near the extraction step (for links)
  const ex = S.objs.get('step:extract'); const stages = [...G.nodes.values()].filter(n => n.kind === 'stage'); const tools = [...G.nodes.values()].filter(n => n.kind === 'tool');
  stages.forEach((n, i) => { const x = sxr + 18 + (i % 4) * 6.4, yy = ex.pos.y + 12 - Math.floor(i / 4) * 3.2; const g = tile(4.6, 2, n.status === 'done' ? COL.step : n.status === 'blocked' ? COL.differ : COL.cond, 0.6, { hollow: n.status !== 'done' }); addObj(n.id, g, new THREE.Vector3(x, yy, 0), 4.6, 2); label(n.id, new THREE.Vector3(x, yy, 0.1), `${esc(n.tid)}`, 'stage c', { show: 'near', near: 130 }); });
  tools.forEach((n, i) => { const x = sxr + 18 + (i % 3) * 9, yy = ex.pos.y - 1 - Math.floor(i / 3) * 3; const g = tile(8, 1.8, COL.tile, 0.35, { hollow: true }); addObj(n.id, g, new THREE.Vector3(x, yy, 0), 8, 1.8); label(n.id, new THREE.Vector3(x, yy, 0.1), `${esc(n.tool.replace('.py', ''))}`, 'tool c', { show: 'near', near: 110 }); });
}
function cellColour(cell) { if (!cell.sourced.length) return COL.gap; const t = {}; for (const c of cell.sourced) t[c.source_type] = (t[c.source_type] || 0) + 1; return TYPE_COLOUR[Object.entries(t).sort((a, b) => b[1] - a[1])[0][0]] || COL.tile; }
function shortRule(t) { const s = t.split(/[.;:]/)[0]; return s.length > 44 ? s.slice(0, 42) + '…' : s; }

// ------------------------------------------------------------------ per-frame: labels, dimming, lines alpha
const _v = new THREE.Vector3();
function frame() {
  const cam = S.Graph.camera(); const w = window.innerWidth, h = window.innerHeight; const camPos = cam.position;
  const mode = S.view.mode; const openLayer = mode === 'layer' ? S.view.layer : null;
  for (const L of S.labels) {
    const p = L.pos; _v.copy(p); const dist = camPos.distanceTo(_v);
    const kind = L.id.split(':')[0]; const lay = LABEL_LAYER[kind] || null;
    let show;
    if (L.show === 'always') show = true;
    else if (S.visible) show = S.visible.has(L.id);
    else show = mode === 'system' ? false : (openLayer && lay === openLayer);
    if (lay === 'schema' && kind === 'field' && (openLayer === 'plants' || openLayer === 'schema')) show = true;
    if (kind === 'field' && mode === 'system' && dist < 150) show = true;
    if (S.lit) show = S.lit.has(L.id) || L.show === 'always';
    if (!show) { L.el.classList.add('hidden'); continue; }
    _v.project(cam); if (_v.z > 1) { L.el.classList.add('hidden'); continue; }
    L.el.classList.remove('hidden'); L.el.style.left = `${(_v.x + 1) / 2 * w}px`; L.el.style.top = `${(1 - _v.y) / 2 * h}px`;
    const f = dimFactor(L.id); L.el.classList.toggle('muted', f < 0.5); L.el.classList.toggle('lit', !!(S.lit && S.lit.has(L.id))); L.el.classList.toggle('here', S.view.mode === 'focus' && S.view.id === L.id);
  }
}
function dimFactor(id) {
  if (S.lit) return S.lit.has(id) ? 1 : 0.08;
  if (S.visible) return S.visible.has(id) ? 1 : 0.1;
  return 1;
}
function applyDim() {
  for (const [id, o] of S.objs) { if (id.startsWith('claim:')) continue; const f = dimFactor(id); for (const m of o.mats) m.opacity = (m.userData.base ?? m.opacity) * f; }
}

// ------------------------------------------------------------------ picking & tooltip
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
function pick(e) {
  const el = S.Graph.renderer().domElement; const r = el.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, S.Graph.camera()); ray.params.Line.threshold = 1.2;
  const hits = ray.intersectObjects(S.world.children, true);
  for (const hit of hits) { let o = hit.object; while (o && !o.userData.id) o = o.parent; if (o && o.userData.id && !o.userData.id.startsWith('chain:') && dimFactor(o.userData.id) > 0.3) return o.userData.id; }
  return null;
}
const tip = $('#tip');
function showTip(id, e) { const n = S.G.nodes.get(id) || S.steps.find(s => s.id === id); if (!n) return hideTip(); tip.innerHTML = tipHtml(n); tip.style.display = 'block'; tip.style.left = `${Math.min(window.innerWidth - 340, e.clientX + 14)}px`; tip.style.top = `${e.clientY + 14}px`; }
function hideTip() { tip.style.display = 'none'; }
function tipHtml(n) {
  if (n.kind === 'cell') return `<b>${esc(n.label)}</b><div class="meta">${n.sourced.length ? `${n.sourced.length} claims from ${new Set(n.sourced.map(c => c.source_id)).size} sources · ${n.verified.length} verified` : n.planned.length ? `no sourced claim · planned: ${esc(n.planned.join(', '))}` : 'no sourced claim · nothing planned'}${n.retired.length ? ` · ${n.retired.length} retired` : ''}${n.cands.length ? ` · ${n.cands.length} candidate` : ''}</div>`;
  if (n.kind === 'rule') return `<b>${esc(n.rid)}</b> ${esc(n.text.slice(0, 160))}…<div class="meta">${(S.G.adj.get(n.id) || []).length} connections</div>`;
  if (n.kind === 'source') return `<b>${esc(n.label)}</b><div class="meta">${esc(n.type)} · ${esc(geoLabel(n.geo))}${n.tier ? ' · licence tier ' + esc(n.tier) : ''} · ${(S.G.adj.get(n.id) || []).filter(l => l.label === 'source of').length} claims</div>`;
  if (n.items) return `<b>${esc(n.label)}</b><div class="meta">${esc(n.count)}</div>`;
  return `<b>${esc(n.label)}</b>${n.text ? `<div class="meta">${esc(String(n.text).slice(0, 140))}</div>` : ''}`;
}

// ------------------------------------------------------------------ views
const LAYER_IDS = {
  foundations: n => ['survey', 'decision', 'principle'].includes(n.kind),
  rules: n => ['rule', 'method', 'struct', 'file'].includes(n.kind),
  schema: n => ['tier', 'field', 'vocab', 'cell', 'plant', 'relation'].includes(n.kind),
  plants: n => ['plant', 'cell', 'relation', 'field', 'tier'].includes(n.kind),
  sources: n => n.kind === 'source',
  construction: n => ['stage', 'tool'].includes(n.kind),
};
function go(view, silent = false) {
  if (!silent) S.history.push(S.view);
  S.view = view; S.lit = null; S.links = null;
  clearLines();
  if (view.mode === 'system') { S.visible = null; }
  else if (view.mode === 'layer') { const ids = new Set([...S.G.nodes.values()].filter(LAYER_IDS[view.layer]).map(n => n.id)); if (view.layer === 'construction') for (const s of S.steps) ids.add(s.id); S.visible = ids; }
  else if (view.mode === 'focus') focusNode(view.id);
  applyDim(); moveCamera(1200); renderTrail(); renderPanel(); document.body.className = `mode-${view.mode}`;
  document.querySelectorAll('#rail button').forEach(b => b.classList.toggle('on', (view.mode === 'system' && b.dataset.layer === 'system') || (view.mode === 'layer' && b.dataset.layer === view.layer)));
}
function up() { const v = S.view; if (v.mode === 'focus') { const back = S.history.pop(); go(back && back.mode !== 'focus' ? back : { mode: 'system' }, true); } else if (v.mode === 'layer') go({ mode: 'system' }); }
function act(id) {
  if (id.startsWith('layer:')) { const l = id.split(':')[1]; return go({ mode: 'layer', layer: l === 'foundations' ? 'foundations' : l }); }
  if (S.G.nodes.has(id) || S.steps.some(s => s.id === id)) go({ mode: 'focus', id });
}

// focus: the node, its neighbours and the typed links between them
function focusNode(id) {
  const G = S.G; const step = S.steps.find(s => s.id === id);
  let ids = new Set([id]); let links = [];
  if (step) { for (const i of step.items) ids.add(i); links = step.items.map(t => ({ id: `s-${t}`, type: 'provenance', source: id, target: t, basis: 'derived', evidence: step.basis, label: 'includes' })); }
  else {
    const n = G.nodes.get(id);
    links = (G.adj.get(id) || []).slice();
    // claims live in cells: a cell's focus includes its claims' links; a claim's focus includes its cell
    if (n.kind === 'cell') for (const c of n.claims) links.push(...(G.adj.get(`claim:${c.id}`) || []));
    if (n.kind === 'claim') links.push(...(G.adj.get(n.cell) || []).filter(l => l.type !== 'structural' || l.target === id));
    if (n.kind === 'field') for (const pid of G.plantIds) { const cid = `cell:${pid}:${n.field}`; for (const l of G.adj.get(cid) || []) if (l.type !== 'structural') links.push(l); }
    if (n.kind === 'plant') for (const c of G.cells.values()) if (c.pid === n.pid) for (const l of G.adj.get(c.id) || []) if (l.type === 'provenance' && l.label === 'source of' || l.type === 'rule') links.push(l);
    if (n.kind === 'source') for (const l of links.slice()) if (l.label === 'source of' && l.target.startsWith('claim:')) { const cn = G.nodes.get(l.target); if (cn) ids.add(cn.cell); }
    const seen = new Set(); links = links.filter(l => !seen.has(l.id) && seen.add(l.id));
    for (const l of links) { ids.add(l.source); ids.add(l.target); const a = G.nodes.get(l.source), b = G.nodes.get(l.target); if (a && a.kind === 'claim') ids.add(a.cell); if (b && b.kind === 'claim') ids.add(b.cell); if (a && a.kind === 'cell') { ids.add(`plant:${a.pid}`); ids.add(`field:${a.field}`); } if (b && b.kind === 'cell') { ids.add(`plant:${b.pid}`); ids.add(`field:${b.field}`); } }
    if (n.kind === 'cell' || n.kind === 'claim') { const cell = n.kind === 'cell' ? n : G.nodes.get(n.cell); ids.add(`plant:${cell.pid}`); ids.add(`field:${cell.field}`); ids.add(`tier:${cell.tier}`); }
  }
  S.visible = ids; S.links = links; drawLinks(links, id);
}
function posOf(id) { const o = S.objs.get(id); return o ? o.pos : null; }
function clearLines() { while (S.lines.children.length) { const c = S.lines.children.pop(); c.geometry?.dispose?.(); } for (const L of S.labels.filter(l => l.cls.includes('linklbl'))) L.el.remove(); S.labels = S.labels.filter(l => !l.cls.includes('linklbl')); }
function drawLinks(links, centre) {
  const drawn = new Map(); // key by endpoint pair to avoid stacking identical lines
  for (const l of links) {
    const a = posOf(l.source), b = posOf(l.target); if (!a || !b || a.equals(b)) continue;
    const key = `${l.source}|${l.target}|${l.type}`; if (drawn.has(key)) { drawn.get(key).n++; continue; }
    const colour = LINK_TYPES[l.type].colour; const alpha = l.basis === 'recorded' ? 0.85 : 0.6;
    const mid = a.clone().add(b).multiplyScalar(0.5); mid.z += Math.min(18, a.distanceTo(b) * 0.12);
    const pts = new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(20); const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = l.basis === 'recorded' ? new THREE.LineBasicMaterial({ color: new THREE.Color(colour), transparent: true, opacity: alpha }) : new THREE.LineDashedMaterial({ color: new THREE.Color(colour), transparent: true, opacity: alpha, dashSize: l.basis === 'candidate' ? 0.5 : 1.2, gapSize: l.basis === 'candidate' ? 0.6 : 0.8 });
    const line = new THREE.Line(geo, mat); if (mat.isLineDashedMaterial) line.computeLineDistances(); S.lines.add(line);
    drawn.set(key, { l, mid: pts[10], n: 1 });
  }
  if (drawn.size <= 16) for (const { l, mid, n } of drawn.values()) label(`${l.source}→${l.target}`, mid, `${esc(l.label || l.type)}${n > 1 ? ` ×${n}` : ''}<small>${esc(l.basis)}</small>`, `linklbl c ${l.type}`, { show: 'always' });
}

// ------------------------------------------------------------------ camera
function usable() { const drawer = document.querySelector('.drawer.open'); const left = drawer ? drawer.getBoundingClientRect().right + 16 : 168; const right = window.innerWidth - PANEL_W; return { w: Math.max(260, right - left) / window.innerWidth, h: Math.max(300, window.innerHeight - 170) / window.innerHeight, dx: (left + right) / 2 - window.innerWidth / 2 }; }
function fitBox(min, max, ms) {
  const cam = S.Graph.camera(); const U = usable(); const fov = THREE.MathUtils.degToRad(cam.fov); const aspect = window.innerWidth / window.innerHeight;
  const w = Math.max(20, max.x - min.x), h = Math.max(14, max.y - min.y); const centre = min.clone().add(max).multiplyScalar(0.5);
  const d = Math.max((w / U.w) / (2 * Math.tan(fov / 2) * aspect), (h / U.h) / (2 * Math.tan(fov / 2))) * 1.08 + 8;
  const hV = 2 * d * Math.tan(fov / 2); const upp = hV / window.innerHeight;
  const look = centre.clone(); look.x += -U.dx * upp; look.y += -10 * upp;
  const dir = new THREE.Vector3(0, 0.22, 1).normalize();
  const pos = look.clone().add(dir.multiplyScalar(d));
  S.Graph.cameraPosition({ x: pos.x, y: pos.y, z: pos.z }, { x: look.x, y: look.y, z: look.z }, ms);
}
function bboxOf(ids) { const min = new THREE.Vector3(Infinity, Infinity, Infinity), max = new THREE.Vector3(-Infinity, -Infinity, -Infinity); let n = 0; for (const id of ids) { const o = S.objs.get(id); if (!o) continue; n++; min.x = Math.min(min.x, o.pos.x - o.w / 2); max.x = Math.max(max.x, o.pos.x + o.w / 2); min.y = Math.min(min.y, o.pos.y - o.h / 2); max.y = Math.max(max.y, o.pos.y + o.h / 2); min.z = Math.min(min.z, o.pos.z); max.z = Math.max(max.z, o.pos.z); } return n ? [min, max] : null; }
function moveCamera(ms) {
  const v = S.view; const L = S.layout; const pad = 10;
  if (v.mode === 'system') { const all = bboxOf([...S.objs.keys()]); if (all) fitBox(all[0].clone().add(new THREE.Vector3(-62, -8, 0)), all[1].clone().add(new THREE.Vector3(14, 10, 0)), ms); return; }
  let ids = v.mode === 'layer' ? [...S.visible] : [...S.visible];
  if (v.mode === 'layer' && (v.layer === 'schema' || v.layer === 'plants')) ids = ids.filter(id => !id.startsWith('relation:') || true);
  let box = bboxOf(ids); if (!box) return;
  if (v.mode === 'layer' && v.layer !== 'construction') { box[0].x -= (v.layer === 'schema' || v.layer === 'plants') ? 60 : 12; }
  if (v.mode === 'focus') { box[0].x -= pad; box[1].x += pad; box[0].y -= pad; box[1].y += pad; const span = box[1].clone().sub(box[0]); if (span.x < 60 && span.y < 40) { box[0].x -= 20; box[1].x += 20; box[0].y -= 12; box[1].y += 12; } }
  fitBox(box[0], box[1], ms);
}

// ------------------------------------------------------------------ trail & rail & panel
function renderTrail() {
  const v = S.view; const crumbs = [{ label: 'System', go: { mode: 'system' } }];
  if (v.mode === 'layer') crumbs.push({ label: v.layer[0].toUpperCase() + v.layer.slice(1), go: v });
  if (v.mode === 'focus') { const prev = S.history[S.history.length - 1]; if (prev && prev.mode === 'layer') crumbs.push({ label: prev.layer[0].toUpperCase() + prev.layer.slice(1), go: prev }); const n = S.G.nodes.get(v.id) || S.steps.find(s => s.id === v.id); crumbs.push({ label: n.kind === 'cell' ? `${S.G.nodes.get(`plant:${n.pid}`).label} · ${n.field.replace(/_/g, ' ')}` : n.kind === 'claim' ? `${n.claim.source_id} · ${n.field.replace(/_/g, ' ')}` : n.label, go: v }); }
  $('#trail').innerHTML = crumbs.map((c, i) => `${i ? '<span class="sep">›</span>' : ''}<button data-go='${esc(JSON.stringify(c.go))}' class="${i === crumbs.length - 1 ? 'here' : ''}">${esc(c.label)}</button>`).join('');
  bind($('#trail'));
}
function bind(root) { root.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); go(JSON.parse(el.dataset.go)); })); root.querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); act(el.dataset.id); })); }
const P = $('#panel-body');
const basisTag = b => `<span class="tag ${esc(b)}">${esc(b)}</span>`;
const typeDot = t => `<i class="tdot" style="background:${LINK_TYPES[t].colour}"></i>`;
const stTag = s => `<span class="tag ${esc(s)}">${esc(s)}</span>`;
function nodeName(id) { const n = S.G.nodes.get(id) || S.steps.find(s => s.id === id); if (!n) return id; if (n.kind === 'cell') return `${S.G.nodes.get(`plant:${n.pid}`).label} · ${n.field.replace(/_/g, ' ')}`; if (n.kind === 'claim') return `${summariseValue(n.claim)} · ${S.G.nodes.get(`source:${n.claim.source_id}`)?.label || n.claim.source_id} · ${n.field.replace(/_/g, ' ')}`; return n.label; }
function connectionsHtml(links, selfId) {
  const byType = {}; for (const l of links) (byType[l.type] = byType[l.type] || []).push(l);
  return Object.entries(byType).map(([t, ls]) => `<h3>${typeDot(t)} ${esc(LINK_TYPES[t].label)} · ${ls.length}</h3><p class="muted small">${esc(LINK_TYPES[t].about)}</p>${ls.slice(0, 40).map(l => { const other = l.source === selfId ? l.target : l.source; const dir = l.source === selfId ? '→' : '←'; return `<div class="row" data-id="${esc(other)}"><span class="dir">${dir}</span><div><span class="val">${esc(nodeName(other))}</span> ${l.label ? `<span class="muted">${esc(l.label)}</span>` : ''} ${basisTag(l.basis)}<br><span class="meta">${esc(l.evidence)}${l.rule ? ` · ${esc(l.rule)}` : ''}</span></div></div>`; }).join('')}${ls.length > 40 ? `<p class="muted">… ${ls.length - 40} more</p>` : ''}`).join('');
}
function renderPanel() {
  const v = S.view; const G = S.G; const st = G.stats;
  if (v.mode === 'system') {
    P.innerHTML = `<h2>Knowledge Brain</h2><div class="kicker">the database as a system · everything below is computed from the files at load</div>
    <p class="lead">Read it top to bottom: what the survey and principles decided (<b>foundations</b>), the <b>rules and methods</b> that follow, the <b>schema</b> whose fields cross the <b>plants</b> to hold every claim, and the <b>sources</b> those claims come from. The <b>construction</b> chain on the right is how a source becomes a claim.</p>
    <h3>Four readings, kept apart</h3>
    <table><tr><th>coverage</th><td>${st.cellsCovered} of ${st.cells} plant × field cells have a sourced claim · ${st.cellsGap} empty (${st.cellsPlanned} with a planned source)</td></tr>
    <tr><th>validation</th><td>schema conformance is checked by <code>tools/validate.py</code> outside the browser; not re-run here</td></tr>
    <tr><th>verification</th><td>${st.verified} of ${st.live} live claims verified by a person · ${st.unverified} await review (D5) · ${st.retired} placeholders retired</td></tr>
    <tr><th>construction</th><td>${st.stages.map(([t, s]) => `${t} <span class="tag ${s === 'done' ? 'verified' : s === 'blocked' ? 'retired' : 'unverified'}">${s}</span>`).join(' ')}</td></tr></table>
    <h3>By tier</h3>${Object.entries(st.byTier).map(([t, b]) => `<div class="row" data-id="tier:${t}"><span class="dir"></span><div><span class="val">${esc(t)}</span> <span class="meta">${b.covered}/${b.cells} cells sourced · ${b.verified} with a verified claim</span><div class="bar"><i style="width:${100 * b.covered / b.cells}%"></i><i class="v" style="width:${100 * b.verified / b.cells}%"></i></div></div></div>`).join('')}
    <h3>Enter from</h3>
    ${[['schema', 'Schema', `${st.fields} fields · which plants and claims each one holds`], ['plants', 'Plants', `${st.plants} entities · ${st.relations} relations (${st.relationsVerified} verified)`], ['sources', 'Sources', `${st.sources} sources · ${st.sourcesWithClaims} contribute claims`], ['rules', 'Rules', `${st.rules} rules · ${st.methods} methods · what each governs`], ['construction', 'Construction', `T1–T7 and the tools · how claims were made`], ['foundations', 'Foundations', `survey questions → decisions → principles`]].map(([l, t, d]) => `<div class="row" data-go='${esc(JSON.stringify({ mode: 'layer', layer: l }))}'><span class="dir">›</span><div><span class="val">${t}</span><br><span class="meta">${esc(d)}</span></div></div>`).join('')}
    <h3>Connections in this graph</h3><p class="muted">${st.links} links: ${Object.entries(st.linksByType).map(([t, n]) => `${typeDot(t)} ${n} ${t}`).join(' · ')}.<br>${st.linksByBasis.recorded} recorded in a file · ${st.linksByBasis.derived} derived by a named rule · ${st.linksByBasis.candidate} from this session.</p>
    <p><span class="toggle" data-how>how this graph is built</span></p><div class="how" style="display:none">${PROJECTION_RULES.map(r => `<p><b>${esc(r.id)}</b> ${esc(r.text)}</p>`).join('')}</div>`;
  } else if (v.mode === 'layer') P.innerHTML = layerHtml(v.layer);
  else P.innerHTML = focusHtml(v.id);
  bind(P); P.querySelectorAll('[data-how]').forEach(el => el.addEventListener('click', () => { const d = el.parentElement.nextElementSibling; d.style.display = d.style.display === 'none' ? 'block' : 'none'; })); P.querySelectorAll('[data-raw]').forEach(el => el.addEventListener('click', () => { const pre = el.nextElementSibling; pre.style.display = pre.style.display === 'none' ? 'block' : 'none'; })); P.scrollTop = 0;
}
function layerHtml(layer) {
  const G = S.G; const st = G.stats; const N = [...G.nodes.values()];
  if (layer === 'schema') return `<h2>Schema</h2><div class="kicker">schema.json ${esc(S.db.schema['$schema_version'])} · ${st.fields} fields in ${st.tiers} tiers · updated ${esc(S.db.schema.updated)}</div>
    <p class="lead">Fields are grouped by what they do at retrieval, not by topic: <b>gate</b> fields filter first, <b>compare</b> fields rank, <b>extended</b> fields hold what existing databases lack, <b>custom</b> is open. The grouping came from survey c1 and c2 (design_basis).</p>
    ${G.TIER_ORDER.filter(t => G.nodes.has(`tier:${t}`)).map(t => { const T = G.nodes.get(`tier:${t}`); const fs = G.fieldList.filter(f => f.tier === t); return `<h3 data-id="tier:${t}" style="cursor:pointer">${esc(t)} · ${fs.length}</h3><p class="muted small">${esc(T.text)}</p>${fs.map(f => { const cov = G.plantIds.filter(pid => G.cells.get(`cell:${pid}:${f.field}`).sourced.length).length; const ver = G.plantIds.filter(pid => G.cells.get(`cell:${pid}:${f.field}`).verified.length).length; return `<div class="row" data-id="field:${esc(f.field)}"><span class="dir"></span><div><span class="val">${esc(f.field.replace(/_/g, ' '))}</span> <span class="meta">${esc(f.def.type || '')}${f.def.vocab ? ' · ' + esc(f.def.vocab) : ''} · ${cov}/${G.plantIds.length} plants sourced${ver ? ` · ${ver} verified` : ''}</span></div></div>`; }).join('')}`; }).join('')}
    <h3>Claim record</h3><p class="muted">${esc(Object.keys(S.db.schema.claim.fields).join(' · '))}</p><div class="row" data-id="struct:practitioner_meta"><span class="dir">›</span><div><span class="val">practitioner metadata</span> <span class="meta">completeness L0–L3, from survey f1</span></div></div><div class="row" data-id="struct:source_priority"><span class="dir">›</span><div><span class="val">source priority</span> <span class="meta">${esc(G.nodes.get('struct:source_priority').text)}</span></div></div>`;
  if (layer === 'plants') return `<h2>Plants</h2><div class="kicker">${st.plants} entities · ${st.claims} claims · ${st.relations} relations</div>
    ${G.plantIds.map(pid => { const Pn = G.nodes.get(`plant:${pid}`); const cs = [...G.cells.values()].filter(c => c.pid === pid); const e = Pn.entity; return `<div class="row" data-id="plant:${pid}"><span class="dir">›</span><div><em class="val">${esc(e.scientific_name)}</em> <span class="muted">${esc((e.common_names?.en || [])[0] || '')}</span><br><span class="meta">${esc(e.kpu_plant_type || '')} · ${esc((e.origin_status || '').replace(/_/g, ' '))} · ${cs.reduce((a, c) => a + c.sourced.length, 0)} claims · ${cs.reduce((a, c) => a + c.verified.length, 0)} verified · ${cs.filter(c => c.sourced.length).length}/${cs.length} fields</span></div></div>`; }).join('')}
    <h3>Relations</h3>${N.filter(n => n.kind === 'relation').map(R => `<div class="row" data-id="${esc(R.id)}"><span class="dir"></span><div><span class="val">${esc(R.label)}</span> <em>${esc(G.nodes.get(`plant:${R.rel.plant_a}`).label)}</em> ↔ <em>${esc(G.nodes.get(`plant:${R.rel.plant_b}`).label)}</em> ${stTag(R.status)}<br><span class="meta">${esc(G.nodes.get(`source:${R.rel.source_id}`)?.label || R.rel.source_id)}${R.type === 'model' ? ' · placeholder' : ''}${R.rel.supporting_claims?.length ? ` · ${R.rel.supporting_claims.length} supporting claims` : ''}</span></div></div>`).join('')}
    <p class="muted small">Only one relation is verified: a practitioner's co-listing (completeness L0, stored but never cited). Shared habitat in E-Flora is derived from two context claims and does not establish companionship.</p>
    <p class="muted small">${S.db.synonyms.entries.length - st.plants} more survey candidates are named in synonyms.json with <code>in_db: false</code> (decision D8).</p>`;
  if (layer === 'sources') { const srcs = N.filter(n => n.kind === 'source' && n.sid !== 'candidate' && !n.parent); const byType = {}; for (const s of srcs) (byType[s.type] = byType[s.type] || []).push(s); return `<h2>Sources</h2><div class="kicker">sources.json · ${srcs.length} sources · ${st.respondents} anonymous respondents</div>
    <p class="lead">Priority at retrieval is by type (${esc(G.nodes.get('struct:source_priority').text)}), then by how local the source is. Licence tier decides what may be stored: A import values, B facts with citation and no copied text, C link only.</p>
    ${Object.entries(byType).map(([t, ss]) => `<h3><i class="tdot" style="background:${TYPE_COLOUR[t]}"></i> ${esc(t)} · ${ss.length}</h3>${ss.map(s => { const n = (G.adj.get(s.id) || []).filter(l => l.label === 'source of').length; const planned = (G.adj.get(s.id) || []).filter(l => l.label === 'planned to fill').length; return `<div class="row ${n ? '' : 'dim'}" data-id="${esc(s.id)}"><span class="dir"></span><div><span class="val">${esc(s.label)}</span> <span class="meta">${esc(geoLabel(s.geo))}${s.tier ? ' · tier ' + esc(s.tier) : ''} · ${n ? `${n} claims` : 'no claim yet'}${planned ? ` · planned for ${planned} fields` : ''}${s.rec.role_in_db ? ' · ' + esc(s.rec.role_in_db.split(';')[0].slice(0, 60)) : ''}</span></div></div>`; }).join('')}`).join('')}`; }
  if (layer === 'rules') return `<h2>Rules & methods</h2><div class="kicker">schema.json rules R1–R10 · methods.md M1–M24 · ${st.methodsToConfirm} to confirm</div>
    <p class="lead">Rules are what the data must obey; methods are the parameters and conventions used to produce it, logged one entry each and never silently changed. Rule → data links are derived by one predicate per rule, named on each link.</p>
    ${N.filter(n => n.kind === 'rule').map(R => `<div class="row" data-id="${esc(R.id)}"><span class="dir"></span><div><span class="val">${esc(R.rid)}</span> ${esc(R.text.slice(0, 120))}${R.text.length > 120 ? '…' : ''}<br><span class="meta">${(G.adj.get(R.id) || []).length} connections</span></div></div>`).join('')}
    <h3>Methods</h3>${N.filter(n => n.kind === 'method').map(M => `<div class="row ${M.toConfirm ? 'dim' : ''}" data-id="${esc(M.id)}"><span class="dir"></span><div><span class="val">${esc(M.mid)}</span> ${esc(M.title.slice(0, 70))} ${M.toConfirm ? '<span class="tag unverified">to confirm</span>' : M.confirmed ? '<span class="tag verified">confirmed</span>' : ''}</div></div>`).join('')}`;
  if (layer === 'foundations') return `<h2>Foundations</h2><div class="kicker">survey → decisions → principles · ARCH 540 user survey, n = 6</div>
    <p class="lead">The structure was not invented first and justified later: field tiers follow survey c1/c2, practitioner metadata follows f1, source priority follows f2, the no-merge rule follows c3. Each tile links to the structures that cite it.</p>
    <h3>Survey questions</h3>${N.filter(n => n.kind === 'survey').sort((a, b) => a.code.localeCompare(b.code)).map(n => `<div class="row" data-id="${esc(n.id)}"><span class="dir"></span><div><span class="val">${esc(n.label)}</span><br><span class="meta">${(G.adj.get(n.id) || []).length} structures or decisions cite it</span></div></div>`).join('')}
    <h3>Decisions (HANDOFF)</h3>${N.filter(n => n.kind === 'decision').map(n => `<div class="row" data-id="${esc(n.id)}"><span class="dir"></span><div><span class="val">${esc(n.did || '')}</span> ${esc(n.label.slice(0, 90))}<br><span class="meta">why: ${esc(n.why.slice(0, 90))}</span></div></div>`).join('')}
    <h3>Principles</h3>${N.filter(n => n.kind === 'principle').map(n => `<div class="row" data-id="${esc(n.id)}"><span class="dir"></span><div><span class="val">${esc(n.label)}</span></div></div>`).join('')}`;
  if (layer === 'construction') return `<h2>Construction</h2><div class="kicker">how a source becomes a claim · all counts live from claim fields</div>
    <p class="lead">Seven steps, read bottom to top on the right of the space. Steps marked done have real artefacts in the repo; validation runs outside the browser and is not claimed here; verification is deferred by decision D5.</p>
    ${S.steps.map(s => `<div class="row" data-id="${esc(s.id)}"><span class="dir"></span><div><span class="val">${esc(s.label)}</span> <span class="tag ${s.status === 'done' ? 'verified' : s.status === 'offline' ? 'retired' : 'unverified'}">${esc(s.status)}</span><br><span class="meta">${esc(s.count)}</span></div></div>`).join('')}
    <h3>Tasks T1–T7 (HANDOFF)</h3>${N.filter(n => n.kind === 'stage').map(n => `<div class="row" data-id="${esc(n.id)}"><span class="dir"></span><div><span class="val">${esc(n.tid)}</span> ${esc(n.heading.split(' — ')[0])} <span class="tag ${n.status === 'done' ? 'verified' : n.status === 'blocked' ? 'retired' : 'unverified'}">${esc(n.status)}</span><br><span class="meta">${esc(n.heading.slice(0, 120))}</span></div></div>`).join('')}
    <h3>Tools</h3>${N.filter(n => n.kind === 'tool').map(n => `<div class="row" data-id="${esc(n.id)}"><span class="dir"></span><div><span class="val">${esc(n.label)}</span><br><span class="meta">${esc(n.text)}</span></div></div>`).join('')}`;
  return '';
}
function focusHtml(id) {
  const G = S.G; const step = S.steps.find(s => s.id === id); const links = S.links || [];
  if (step) return `<h2>${esc(step.label)}</h2><div class="kicker">construction step · ${esc(step.status === 'offline' ? 'runs outside the browser' : step.status)}</div><p class="lead">${esc(step.count)}</p><p class="muted small">basis: ${esc(step.basis)}</p>${connectionsHtml(links, id)}`;
  const n = G.nodes.get(id); if (!n) return '';
  let head = `<h2>${esc(n.kind === 'cell' ? n.field.replace(/_/g, ' ') : n.kind === 'claim' ? summariseValue(n.claim) : n.label)}</h2><div class="kicker">${esc(n.kind)} · ${esc(n.file || '')}${n.ref ? ' · ' + esc(n.ref) : ''}</div>`;
  let body = '';
  if (n.kind === 'cell') {
    body = `<p class="lead"><em>${esc(G.nodes.get(`plant:${n.pid}`).label)}</em> · ${esc(n.tier)} field · ${n.sourced.length ? `${n.sourced.length} sourced claims from ${new Set(n.sourced.map(c => c.source_id)).size} sources · ${n.verified.length} verified` : `no sourced claim${n.planned.length ? ` · planned: ${esc(n.planned.join(', '))}` : ''}`}${n.retired.length ? ` · ${n.retired.length} retired placeholder` : ''}${n.cands.length ? ` · <span style="color:var(--candidate)">${n.cands.length} candidate</span>` : ''}</p>
    ${n.claims.length ? `<h3>Claims</h3>${n.claims.map(c => claimRow(c, n)).join('')}` : ''}`;
  } else if (n.kind === 'claim') {
    const c = n.claim; const cell = G.nodes.get(n.cell); const p = cell.parsed.get(c.id); const s = S.db.sources[c.source_id] || {};
    body = `<div class="kicker">${stTag(n.status)}<span class="tag" style="color:${TYPE_COLOUR[c.source_type]}">${esc(c.source_type)}</span></div>
    <p>${esc(c.text || '')}</p>${c.note ? `<p class="muted">${esc(c.note)}</p>` : ''}
    <table><tr><th>plant · field</th><td><span data-id="${esc(n.cell)}" style="cursor:pointer"><em>${esc(G.nodes.get(`plant:${c.plant}`).label)}</em> · ${esc(c.field.replace(/_/g, ' '))}</span></td></tr>
    <tr><th>source</th><td><span data-id="source:${esc(c.source_id)}" style="cursor:pointer">${esc(G.nodes.get(`source:${c.source_id}`)?.label || c.source_id)}</span>${s.geo_specificity ? ` · ${esc(geoLabel(s.geo_specificity))}` : ''}${s.licence_tier ? ` · tier ${esc(s.licence_tier)}` : ''}</td></tr>
    <tr><th>context</th><td>${p.cultivar ? `cultivar ‘${esc(p.cultivar)}’ · ` : 'species · '}${p.condition ? esc(p.condition) : '<span class="faint">condition not stated</span>'}${p.region ? ' · ' + esc(p.region) : ''}<br><span class="meta">${esc(c.context || '')}</span></td></tr>
    <tr><th>value</th><td>${esc(summariseValue(c))} <span class="meta">${esc(c.value_kind || '')}</span></td></tr>
    <tr><th>status</th><td>${stTag(n.status)} confidence ${c.confidence ?? '—'}${c.recorded_at ? ` · recorded ${esc(c.recorded_at)}` : ''}${c.recorded_by ? ` by ${esc(c.recorded_by)}` : ''}</td></tr>
    ${c.practitioner_meta ? `<tr><th>practitioner</th><td class="muted">basis ${esc(c.practitioner_meta.basis || '—')} · completeness ${esc(c.practitioner_meta.completeness || '—')} · citable ${c.practitioner_meta.citable === false ? 'no' : 'yes'}</td></tr>` : ''}
    <tr><th>id</th><td class="id">${esc(c.id)}</td></tr></table>
    <p><span class="toggle" data-raw>raw record</span></p><pre style="display:none">${esc(JSON.stringify(c, null, 2))}</pre>`;
  } else if (n.kind === 'rule') body = `<p class="lead">${esc(n.text)}</p><p class="muted small">Links below are derived by the predicate named on each (P-rule-predicate); citations from methods and decisions are recorded mentions.</p>`;
  else if (n.kind === 'method') body = `<p class="lead">${esc(n.title)}</p><p>${esc(n.text)}</p>${n.toConfirm ? '<p class="warn">marked “to confirm” — a parameter chosen by the coding agent, awaiting Kay.</p>' : ''}`;
  else if (n.kind === 'decision') body = `<p class="lead">${esc(n.label)}</p><p class="muted">why: ${esc(n.why)}</p>`;
  else if (n.kind === 'principle' || n.kind === 'survey' || n.kind === 'struct' || n.kind === 'file' || n.kind === 'stage' || n.kind === 'tool' || n.kind === 'tier') body = `<p class="lead">${esc(n.heading || n.text || '')}</p>${n.kind === 'stage' ? `<p>${stTag(n.status)}</p>` : ''}${n.kind === 'struct' && n.data ? `<p><span class="toggle" data-raw>schema excerpt</span></p><pre style="display:none">${esc(JSON.stringify(n.data, null, 2).slice(0, 3000))}</pre>` : ''}`;
  else if (n.kind === 'vocab') body = `<p class="lead">${n.values.length} values${n.open ? ' · open list (M11)' : ' · closed list borrowed from KPU'}</p><p class="muted">${esc(n.values.join(' · '))}</p>`;
  else if (n.kind === 'field') { const d = n.def; const cov = G.plantIds.map(pid => G.cells.get(`cell:${pid}:${n.field}`)); body = `<p class="lead">${esc(n.tier)} field · type ${esc(d.type || '')}${d.unit ? ' · unit ' + esc(d.unit) : ''}${d.vocab ? ' · vocabulary ' + esc(d.vocab) : ''} · ${cov.filter(c => c.sourced.length).length} of ${cov.length} plants have a sourced claim</p>${d.survey ? `<p class="muted">survey basis: ${esc(d.survey)}</p>` : ''}${d.note ? `<p class="muted">${esc(d.note)}</p>` : ''}${d.fill_from ? `<p class="muted">planned sources: ${esc(d.fill_from.join(', '))}</p>` : ''}<h3>Per plant</h3>${cov.map(c => `<div class="row" data-id="${esc(c.id)}"><span class="dir"></span><div><em class="val">${esc(G.nodes.get(`plant:${c.pid}`).label)}</em> <span class="meta">${c.sourced.length ? `${c.sourced.length} claims · ${c.verified.length} verified` : 'gap'}${c.cands.length ? ' · candidate' : ''}</span></div></div>`).join('')}`; }
  else if (n.kind === 'plant') { const e = n.entity; const cs = [...G.cells.values()].filter(c => c.pid === n.pid); body = `<div class="kicker">${esc((e.common_names?.en || []).join(' · '))} · ${esc(e.family || '')} · ${esc(e.kpu_plant_type || '')} · ${esc((e.origin_status || '').replace(/_/g, ' '))}</div><p class="lead">${cs.reduce((a, c) => a + c.sourced.length, 0)} sourced claims · ${cs.reduce((a, c) => a + c.verified.length, 0)} verified · ${cs.filter(c => c.sourced.length).length} of ${cs.length} fields have a source</p>${e.survey_mentions ? `<p class="muted">survey mentions: ${esc(JSON.stringify(e.survey_mentions))}</p>` : ''}<p class="muted">raw roles ${esc(JSON.stringify(e.respondent_roles || []))} · raw names ${esc(JSON.stringify(e.raw_names || []))} (R8)</p>`; }
  else if (n.kind === 'source') { const r = n.rec; body = `<div class="kicker"><span class="tag" style="color:${TYPE_COLOUR[n.type]}">${esc(n.type)}</span>${esc(geoLabel(n.geo))}${n.tier ? ' · licence tier ' + esc(n.tier) : ''}${r.baseline_confidence !== undefined ? ' · baseline confidence ' + r.baseline_confidence : ''}</div>${r.name ? `<p class="lead">${esc(r.name)}${r.publisher ? ` <span class="muted">· ${esc(r.publisher)}</span>` : ''}</p>` : ''}${r.role_in_db ? `<p class="muted">${esc(r.role_in_db)}</p>` : ''}${r.observer_background ? `<p class="muted">${esc(r.observer_background)}</p>` : ''}${r.licence ? `<p class="muted small">licence: ${esc(r.licence.slice(0, 260))}${r.licence_note ? ' — ' + esc(r.licence_note) : ''}</p>` : ''}${r.url ? `<p><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url.replace(/^https?:\/\//, ''))}</a></p>` : ''}`; }
  else if (n.kind === 'relation') { const r = n.rel; body = `<div class="kicker">${stTag(r.status)}<span class="tag" style="color:${TYPE_COLOUR[r.source_type]}">${esc(r.source_type)}</span></div><p>${esc(r.text || '')}</p>${r.note ? `<p class="muted">${esc(r.note)}</p>` : ''}<p class="muted">context: ${esc(r.context || '')} · confidence ${r.confidence ?? '—'}${r.practitioner_meta ? ` · completeness ${esc(r.practitioner_meta.completeness)} · citable ${r.practitioner_meta.citable === false ? 'no' : 'yes'}` : ''}</p>`; }
  return head + body + connectionsHtml(links, id);
}
function claimRow(c, cell) { const p = cell.parsed.get(c.id); const st = c.source_type === 'candidate' ? 'candidate' : !isLive(c) ? 'retired' : c.status; return `<div class="row" data-id="claim:${esc(c.id)}"><i class="st ${st}" style="--c:${TYPE_COLOUR[c.source_type] || '#888'}"></i><div><span class="val">${esc(summariseValue(c))}</span> <span class="muted">${p.laneLabel !== 'condition not stated' ? esc(p.laneLabel) : ''}</span><br><span class="meta">${esc(S.G.nodes.get(`source:${c.source_id}`)?.label || c.source_id)}${p.region ? ' · ' + esc(p.region) : ''} · ${esc(st)}</span></div></div>`; }

// ------------------------------------------------------------------ ambient: one real provenance thread at a time (system view only)
let ambientTimer = null;
function startAmbient() { ambientTimer = setInterval(() => { if (S.view.mode !== 'system' || document.hidden) return; thread(); }, 5200); setTimeout(thread, 1200); }
function thread() {
  const G = S.G; const claims = [...G.nodes.values()].filter(n => n.kind === 'claim' && n.status !== 'candidate' && isSourced(n.claim)); if (!claims.length) return;
  const n = claims[Math.floor(Math.random() * claims.length)]; const cell = G.nodes.get(n.cell);
  const path = [`source:${n.claim.source_id}`, n.cell, `field:${cell.field}`]; const rules = (G.adj.get(n.id) || []).concat(G.adj.get(n.cell) || []).filter(l => l.type === 'rule').map(l => l.source).filter(id => id.startsWith('rule:')); if (rules.length) path.push(rules[0]);
  const pts = path.map(posOf).filter(Boolean); if (pts.length < 2) return;
  const group = new THREE.Group();
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const mid = a.clone().add(b).multiplyScalar(0.5); mid.z += 14; const g = new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(24)); const m = new THREE.LineBasicMaterial({ color: new THREE.Color(i === 0 ? LINK_TYPES.provenance.colour : i === 1 ? LINK_TYPES.structural.colour : LINK_TYPES.rule.colour), transparent: true, opacity: 0 }); group.add(new THREE.Line(g, m)); }
  S.Graph.scene().add(group);
  const cap = $('#thread'); cap.innerHTML = `${esc(G.nodes.get(path[0]).label)} <span>→</span> <em>${esc(G.nodes.get(`plant:${cell.pid}`).label)}</em> · ${esc(cell.field.replace(/_/g, ' '))} <span>→</span> ${esc(cell.tier)} field${rules.length ? ` <span>→</span> ${esc(rules[0].split(':')[1])}` : ''} <small>${esc(summariseValue(n.claim))} · ${esc(n.status)}</small>`; cap.classList.add('on');
  const t0 = performance.now();
  (function anim() { const k = (performance.now() - t0) / 4200; const a = k < 0.15 ? k / 0.15 : k > 0.75 ? Math.max(0, 1 - (k - 0.75) / 0.25) : 1; group.children.forEach(l => { l.material.opacity = 0.8 * a; }); if (k < 1 && S.view.mode === 'system') requestAnimationFrame(anim); else { S.Graph.scene().remove(group); cap.classList.remove('on'); } })();
}

// ------------------------------------------------------------------ Grow (candidates) — isolated, this browser only
const FIELD_WORDS = { mature_height: ['height', 'tall', 'high', ' cm', 'stays under', 'stays below', 'reaches', 'metre', 'meter', ' m ', 'ft'], mature_spread: ['spread', 'wide', 'width', 'across'], exposure: ['full sun', 'part shade', 'shade', 'shady', 'sunny', 'north-facing', 'exposure', 'aspect'], water_drainage: ['wet', 'dry soil', 'drainage', 'drought', 'moist', 'waterlogged', 'soggy', 'irrigat'], hardiness_zone: ['frost', 'hardy', 'winter kill', 'zone', 'cold snap', 'froze'], maintenance_level: ['maintenance', 'pruning', 'prune', 'easy care', 'low care', 'fuss'], growth_rate: ['fast', 'slow', 'growth rate', 'grows quickly', 'vigorous', 'per year'], behaviour_with_others: ['spreads into', 'overrun', 'smother', 'competes', 'under the', 'companion', 'next to', 'crowd', 'sucker', 'runner', 'neighbour'], toxicity: ['toxic', 'poison', 'dog', 'cat ', 'pets', 'ate'], local_mature_size: ['in vancouver', 'street tree', 'actual size', 'ended up', 'after 20 years', 'old specimen', 'planted in'], time_to_intended_size: ['years to', 'took', 'reached', 'after 5 years', 'after 10 years', 'years old'], seasonal_interest: ['flower', 'bloom', 'fall colour', 'fall color', 'berries', 'fruit', 'autumn', 'evergreen', 'leaves turn'], ecological_value: ['bees', 'pollinator', 'birds', 'wildlife', 'hummingbird', 'habitat'], pest_susceptibility: ['aphid', 'scale insect', 'mildew', 'disease', 'pest', 'leaf spot', 'verticillium', 'anthracnose'], resistances: ['tolerates', 'tolerant', 'resistant', 'unbothered', 'deer', 'rabbit'], long_term_performance: ['declined', 'died', 'still thriving', 'after years', 'long term', 'longevity', 'survived'], vancouver_context: ['vancouver', 'north van', 'burnaby', 'richmond', 'surrey', 'lower mainland'] };
const EXPOSURE_WORDS = [['Full sun', ['full sun']], ['Part sun/part shade', ['part shade', 'part sun', 'partial shade', 'half shade']], ['Filtered shade', ['filtered shade', 'dappled', 'light shade']], ['Deep shade', ['deep shade', 'full shade', 'heavy shade']]];
const SOIL_WORDS = [['poor soil', ['poor soil', 'thin soil', 'gravel', 'sandy']], ['good soil', ['good soil', 'rich soil', 'deep soil', 'compost']]];
function detect(text) {
  const t = ' ' + text.toLowerCase() + ' '; const names = S.retr.nameHits(text); const pid = Object.keys(names)[0] || null;
  const scores = Object.entries(FIELD_WORDS).map(([f, ws]) => [f, ws.filter(w => t.includes(w)).length]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]); const field = scores[0]?.[0] || null;
  const num = t.match(/(\d+(?:\.\d+)?)\s*(cm|m|metres?|meters?|ft|feet)\b/); let value = null, value_kind = 'qualitative';
  if (num) { let x = parseFloat(num[1]); const u = num[2]; if (u === 'cm') x /= 100; else if (u === 'ft' || u === 'feet') x *= 0.3048; x = Math.round(x * 100) / 100; const before = t.slice(0, num.index); value = /(under|below|less than|at most|no more than|max)\s*$/.test(before) ? { max: x, unit: 'm' } : /(over|above|more than|at least|min)\s*$/.test(before) ? { min: x, unit: 'm' } : { height_m: x, unit: 'm' }; value_kind = 'quantitative'; }
  const exposure = EXPOSURE_WORDS.filter(([, ws]) => ws.some(w => t.includes(w))).map(([k]) => k); const soil = SOIL_WORDS.filter(([, ws]) => ws.some(w => t.includes(w))).map(([k]) => k);
  if (!value && field === 'exposure' && exposure.length) { value = exposure; value_kind = 'categorical'; } if (!value) value = { note: text.trim() };
  return { pid, field, value, value_kind, exposure, soil };
}
function loadCandidates() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } }
function saveCandidates() { try { localStorage.setItem(LS_KEY, JSON.stringify(S.candidates)); } catch { /* ignore */ } }
function addCandidate(text, pid, field, basis, location) {
  const d = detect(text); const cellBefore = S.G.cells.get(`cell:${pid}:${field}`); const before = { n: cellBefore.sourced.length, planned: cellBefore.planned.slice(), hadLocal: cellBefore.sourced.some(c => /vancouver|bc/.test((S.db.sources[c.source_id] || {}).geo_specificity || '')) };
  const n = S.candidates.filter(c => c.plant === pid && c.field === field).length + 1; const conds = [...d.exposure, ...d.soil].map(x => x.toLowerCase());
  const c = { id: `candidate:${pid}:${field}:${String(n).padStart(2, '0')}`, plant: pid, field, value_kind: d.value_kind, value: d.value, text: text.trim(), source_id: 'candidate', source_type: 'candidate', context: ['candidate (this session)', location, conds.join(', ')].filter(Boolean).join('; '), confidence: null, status: 'candidate', recorded_at: new Date().toISOString().slice(0, 10), recorded_by: 'user (browser session)', practitioner_meta: { basis: basis || null, location: location || null, site_conditions: conds.length ? conds.join(', ') : null, observer_background: 'this session (unverified user input)', completeness: basis && location ? 'L2' : basis ? 'L1' : 'L0', citable: false } };
  S.candidates.push(c); saveCandidates(); rebuild();
  const cell = S.G.cells.get(`cell:${pid}:${field}`); const p = cell.parsed.get(c.id);
  const rels = cell.sourced.map(x => ({ x, r: relate(c, x, p, cell.parsed.get(x.id)) })).filter(z => z.r.cls !== 'na');
  const items = [`Joined <em>${esc(S.G.nodes.get(`plant:${pid}`).label)}</em> · <b>${esc(field.replace(/_/g, ' '))}</b> (${esc(cell.tier)} field)${before.n ? ` beside ${before.n} sourced claim${before.n === 1 ? '' : 's'}` : ` — a cell with no sourced claim${before.planned.length ? ` (planned: ${esc(before.planned.join(', '))})` : ''}; it would fill the gap only once sourced and verified`}.`];
  if (rels.length) items.push(`Compared with existing readings: ${rels.map(z => `<span class="rel ${z.r.cls}">${esc(z.r.kind)}</span> ${esc(S.G.nodes.get(`source:${z.x.source_id}`)?.label || z.x.source_id)}`).join(' · ')}.`);
  if (p.condition) items.push(`States a growing condition (<b>${esc(p.condition)}</b>) — ${cell.sourced.some(x => cell.parsed.get(x.id).condition === p.condition) ? 'a condition another source also states' : 'a condition no source had stated for this cell'}.`);
  if (!before.hadLocal && p.region && /vancouver|bc/i.test(p.region)) items.push(`First reading on this cell from the Vancouver scale.`);
  items.push(`Status <b>candidate</b>: unverified user input, completeness ${esc(c.practitioner_meta.completeness)}, citable: false. It sits in this browser only, is never written to the db, never changes a status word, and is listed as a candidate if a question recalls it.`);
  $('#changed').innerHTML = `<div class="changed"><h4>What changed</h4><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul><p><button data-id="claim:${esc(c.id)}">show it</button> <button id="ask-again">ask with it</button></p></div>`; bind($('#changed'));
  $('#ask-again')?.addEventListener('click', () => { openDrawer('ask'); const q = `how tall does ${S.G.nodes.get(`plant:${pid}`).entity.common_names?.en?.[0] || pid} get in ${(conds[0] || 'full sun')}`; $('#ask-input').value = q; runQuery(q); });
  renderCandList(); go({ mode: 'focus', id: `claim:${c.id}` });
  return c;
}
function rebuild() {
  S.G = buildProjection(S.db, S.docs, S.candidates); S.steps = buildSteps();
  for (const L of S.labels) L.el.remove(); S.labels = []; S.Graph.scene().remove(S.world); S.objs = new Map(); clearLines(); buildScene(); applyDim(); renderStats();
}
function resetCandidates() { S.candidates = []; saveCandidates(); rebuild(); $('#changed').innerHTML = ''; renderCandList(); go({ mode: 'system' }); }
function renderCandList() { const ul = $('#cand-list'); ul.innerHTML = S.candidates.map(c => `<li><span style="color:var(--candidate)">■</span> <em>${esc(S.G.nodes.get(`plant:${c.plant}`).label)}</em> · ${esc(c.field.replace(/_/g, ' '))} · ${esc(summariseValue(c))} <button data-id="claim:${esc(c.id)}">open</button></li>`).join('') || '<li class="muted" style="border:0">no candidates yet</li>'; bind(ul); }

// ------------------------------------------------------------------ Ask: retrieval preview lights the claims, sources and rules it uses
function runQuery(q) {
  if (!q.trim()) return; const r = S.retr.run(q); S.lastResult = r; const G = S.G;
  const lit = new Set(['tool:retrieve.py', 'stage:T6', 'rule:R5', 'rule:R6', 'rule:R7', 'struct:source_priority', 'file:intent_map.json']); if (r.withheld.length) lit.add('rule:R2');
  for (const c of [...r.ranked.slice(0, 20), ...r.withheld, ...r.candidateHits]) { lit.add(`claim:${c.id}`); lit.add(`cell:${c.plant}:${c.field}`); lit.add(`source:${c.source_id}`); lit.add(`plant:${c.plant}`); lit.add(`field:${c.field}`); }
  for (const pid of r.candidates) lit.add(`plant:${pid}`);
  S.history.push(S.view); S.view = { mode: 'ask' }; S.visible = null; S.lit = lit; clearLines(); applyDim(); $('#ask-label').classList.add('on');
  const all = bboxOf([...lit]); if (all) fitBox(all[0].clone().add(new THREE.Vector3(-30, -8, 0)), all[1].clone().add(new THREE.Vector3(6, 6, 0)), 1200);
  renderTrail(); $('#trail').innerHTML += `<span class="sep">›</span><button class="here">question</button>`;
  renderAskResult(r);
  const cells = new Set(r.ranked.slice(0, 20).map(c => `cell:${c.plant}:${c.field}`)); const srcs = new Set(r.ranked.slice(0, 20).map(c => c.source_id));
  P.innerHTML = `<h2>What a question activates</h2><div class="kicker">retrieval preview · not a full AI trace · “${esc(q)}”</div>
    <p class="lead">${r.candidates.length} plant${r.candidates.length === 1 ? '' : 's'} pass the gates; ${cells.size} plant × field cells and ${srcs.size} sources light up; ${r.ranked.length} claims are put in answer order. The rules doing the work are lit in the rules row.</p>
    <h3>Rules in play</h3>${[['rule:R7', 'gate fields filter before anything semantic'], ['rule:R5', 'order: source type → geography → completeness → confidence'], ['rule:R6', 'attribute to the source or person, not the reasoning'], ...(r.withheld.length ? [['rule:R2', `${r.withheld.length} L0 practitioner claim${r.withheld.length === 1 ? '' : 's'} withheld`]] : [])].map(([id, t]) => `<div class="row" data-id="${id}"><span class="dir">›</span><div><span class="val">${esc(id.split(':')[1])}</span> <span class="meta">${esc(t)}</span></div></div>`).join('')}
    <h3>Sources used</h3>${[...srcs].map(sid => `<div class="row" data-id="source:${esc(sid)}"><span class="dir">›</span><div><span class="val">${esc(S.G.nodes.get(`source:${sid}`)?.label || sid)}</span> <span class="meta">${r.ranked.filter(c => c.source_id === sid).length} claims in the answer</span></div></div>`).join('')}
    <p class="muted small">The ranked list, gates and attribution strings are in the Ask drawer. Click any claim there to open it here.</p>`; bind(P);
}
function clearAsk() { S.lit = null; $('#ask-label').classList.remove('on'); $('#ask-result').innerHTML = ''; go({ mode: 'system' }); }
function renderAskResult(r) {
  const el = $('#ask-result'); const plants = S.db.plants; const gateRows = Object.entries(r.gates).filter(([, g]) => Object.keys(g).length);
  el.innerHTML = `<h3>What the question activates</h3><div class="muted">${r.candidates.length} plant${r.candidates.length === 1 ? '' : 's'} after gates · ${new Set(r.ranked.slice(0, 20).map(c => c.source_id)).size} sources · rules in play: R7 (gates), R5 (order), R6 (attribution)${r.withheld.length ? ', R2 (withheld)' : ''} · click a claim to open it</div>
    <h3>Routes</h3><div class="muted">names: ${Object.keys(r.names).length ? Object.entries(r.names).map(([k, v]) => `<em>${esc(k)}</em> (${esc(v.join(', '))})`).join(', ') : 'none'} · intents: ${r.intents.length ? r.intents.map(i => `${esc(i.term)} → ${esc(i.field)} <span class="why">${esc(i.mode)}</span>`).join(', ') : 'none'}</div>
    ${gateRows.length ? `<h3>Gates (R7)</h3><table>${gateRows.map(([pid, g]) => `<tr><th><em>${esc(plants[pid].entity.scientific_name)}</em></th><td>${Object.entries(g).map(([t, v]) => `<span class="tag ${esc(v)}">${esc(t)}: ${esc(v)}</span>`).join(' ')}</td></tr>`).join('')}</table>` : ''}
    <div class="muted" style="margin-top:6px">${r.excluded.length ? `excluded: ${r.excluded.join(', ')} · ` : ''}recall ${r.recall_n} claims by BM25 (similarity decides recall only) · ${r.withheld.length} L0 practitioner claim${r.withheld.length === 1 ? '' : 's'} withheld (R2)</div>
    <h3>Answer order (R5) · attribution (R6)</h3>
    ${r.ranked.length ? r.ranked.slice(0, 14).map((c, i) => `<div class="r" data-id="claim:${esc(c.id)}"><span class="rank">${i + 1}.</span> ${esc(S.retr.attribute(c))}<div class="why">${esc(c.field.replace(/_/g, ' '))} · ${esc(S.retr.why(c))}</div></div>`).join('') + (r.ranked.length > 14 ? `<div class="muted">… ${r.ranked.length - 14} more</div>` : '') : '<p class="warn">No sourced claim matches — honest empty answer.</p>'}
    ${r.withheld.length ? `<h3>Withheld (L0, not citable)</h3>${r.withheld.map(c => `<div class="r" data-id="claim:${esc(c.id)}"><span class="muted">${esc(c.text)}</span><div class="why">stored, never cited (R2)</div></div>`).join('')}` : ''}
    ${r.candidateHits.length ? `<h3>Candidates recalled (unverified user input)</h3>${r.candidateHits.map(c => `<div class="r cand" data-id="claim:${esc(c.id)}">${esc(c.text)}<div class="why">flagged, not cited</div></div>`).join('')}` : ''}
    ${S.candidates.length ? `<p class="${r.candidateHits.length ? 'cand' : 'muted'}">Δ with your candidates: ${r.candidateHits.length ? `${r.candidateHits.length} recalled — shown as unverified user input, never cited, ranked after every sourced claim.` : 'none recalled for this question.'}</p>` : ''}`;
  bind(el);
}

// ------------------------------------------------------------------ UI
function openDrawer(id) { for (const d of document.querySelectorAll('.drawer')) d.classList.toggle('open', d.id === id && !d.classList.contains('open')); document.querySelectorAll('#rail button[data-drawer]').forEach(b => b.classList.toggle('on', document.getElementById(b.dataset.drawer).classList.contains('open'))); moveCamera(500); }
function renderStats() { const st = S.G.stats; $('#stats').textContent = `${st.plants} plants · ${st.fields} fields · ${st.claims} claims (${st.live} live · ${st.verified} verified · ${st.retired} retired) · ${st.sources} sources · ${st.relations} relations · ${st.rules} rules · ${st.methods} methods · ${st.links} connections${S.candidates.length ? ` · ${S.candidates.length} candidate${S.candidates.length === 1 ? '' : 's'} this session` : ''}`; }
function initUi() {
  renderStats();
  document.querySelectorAll('#rail button[data-layer]').forEach(b => b.addEventListener('click', () => { const l = b.dataset.layer; if (S.lit) { S.lit = null; $('#ask-label').classList.remove('on'); } go(l === 'system' ? { mode: 'system' } : { mode: 'layer', layer: l }); }));
  document.querySelectorAll('#rail button[data-drawer]').forEach(b => b.addEventListener('click', () => openDrawer(b.dataset.drawer)));
  $('#btn-up').addEventListener('click', () => { if (S.lit) clearAsk(); else up(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const d = document.querySelector('.drawer.open'); if (d) { d.classList.remove('open'); document.querySelectorAll('#rail button[data-drawer]').forEach(b => b.classList.remove('on')); moveCamera(400); } else if (S.lit) clearAsk(); else up(); } });
  $('#legend').innerHTML = Object.entries(LINK_TYPES).map(([t, v]) => `<span><i class="tdot" style="background:${v.colour}"></i>${esc(v.label)}</span>`).join('') + `<span class="sep">|</span><span><i class="ln solid"></i>recorded</span><span><i class="ln dashed"></i>derived</span><span><i class="ln dotted"></i>candidate</span><span class="sep">|</span><span><i class="sw" style="background:${COL.gap};opacity:.5"></i>gap</span><span><i class="sw" style="background:${TYPE_COLOUR.database};opacity:.4"></i>sourced</span><span><i class="sw" style="background:${TYPE_COLOUR.database}"></i>verified share</span><span><i class="sw" style="background:${COL.cond}"></i>varies with conditions</span><span><i class="sw" style="background:${COL.differ}"></i>values differ</span>`;
  const qb = $('#qbtns'); for (const q of S.db.queries.queries) { const b = document.createElement('button'); b.innerHTML = `${esc(q.query)} <small>${esc(q.id)}${q.status === 'proxy' ? ' · proxy' : ''}</small>`; b.addEventListener('click', () => { $('#ask-input').value = q.query; runQuery(q.query); }); qb.appendChild(b); }
  $('#ask-run').addEventListener('click', () => runQuery($('#ask-input').value)); $('#ask-input').addEventListener('keydown', e => { if (e.key === 'Enter') runQuery($('#ask-input').value); }); $('#ask-clear').addEventListener('click', clearAsk);
  const ps = $('#add-plant'); for (const pid of S.db.plantIds) { const o = document.createElement('option'); o.value = pid; o.textContent = S.db.plants[pid].entity.scientific_name; ps.appendChild(o); }
  const fs = $('#add-field'); for (const f of S.G.fieldList) { const o = document.createElement('option'); o.value = f.field; o.textContent = `${f.field.replace(/_/g, ' ')} (${f.tier})`; fs.appendChild(o); }
  $('#add-text').addEventListener('input', () => { const d = detect($('#add-text').value); if (d.pid) ps.value = d.pid; if (d.field) fs.value = d.field; $('#add-detected').textContent = `detected → plant: ${d.pid || '?'} · field: ${d.field || '?'} · value: ${JSON.stringify(d.value)}${d.exposure.length ? ' · exposure: ' + d.exposure.join(', ') : ''}${d.soil.length ? ' · soil: ' + d.soil.join(', ') : ''}`; });
  $('#add-go').addEventListener('click', () => { const t = $('#add-text').value.trim(); if (!t) return; addCandidate(t, ps.value, fs.value, $('#add-basis').value, $('#add-location').value.trim()); });
  $('#add-reset').addEventListener('click', resetCandidates);
  renderCandList();
}

window.brain = { S, go, act, up, addCandidate, resetCandidates, runQuery, clearAsk, G: () => S.G };
