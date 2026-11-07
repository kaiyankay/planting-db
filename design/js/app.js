// Planting Intelligence · Design Workspace (Phase 2, brief 2026-11-07). One model (model.js), one knowledge adapter over
// brain/data/explorer.json (knowledge.js), one interpreter (intent.js: offline rules; a live model through tools/design_server.py
// when configured), one engine (engine.js). The conversation, the canvas, the context rail and the bottom views all read the same
// state S and the same project; every change goes through the model, so 2D, 3D, schedule, exports and the saved file agree.
import * as M from './model.js';
import { loadKnowledge } from './knowledge.js';
import * as I from './intent.js';
import * as E from './engine.js';
import * as R from './render.js';
import * as G from './geom.js';

const $ = s => document.querySelector(s); const esc = R.esc;
const S = { project: null, K: null, server: null, view: '2d', tool: 'select', bedId: null, selection: null, scope: null, preview: null, pendingCmd: null, selectedPlant: null, selectedSpecies: null, draft: [], lasso: [], overlay: null, showZones: true, labels: true, tab: 'schedule', open: new Set(['site']), T: null, drag: null, addSpecies: null, calib: [], interp: 'offline', seed: 42, density: 1 };

// ------------------------------------------------------------------ boot
(async function boot() {
  try {
    S.K = await loadKnowledge(new URLSearchParams(location.search).get('data') || '../brain/data/explorer.json');
    S.server = await M.serverStatus();
    const saved = new URLSearchParams(location.search).get('fresh') ? null : M.loadLocal();
    S.project = saved || M.newProject(); if (!S.project.knowledge_snapshot) S.project.knowledge_snapshot = S.K.snapshot;
    S.bedId = S.project.site.beds[0]?.id || null;
    initUi(); if (!saved) M.say(S.project, 'ai', 'Tell me about the site and what you want from it — in your own words. I will separate what you stated from what I assume and what stays unknown, and the canvas will fill in as geometry becomes known. You can also set a width × height above the canvas, draw the boundary, add a photo or sketch to trace over, or note an address (reference only).', { mode: 'system' });
    window.pi = { S, M, E, I, R, G, update, say: handleSay, journey, setTool, generate, applyPreview, cancelPreview, undo, redo, exportAll, quickSite, acceptBed, loadDemoProject };
    update(); $('#loading').classList.add('gone');
    const q = new URLSearchParams(location.search);
    if (q.get('journey')) { try { await journey({ fast: true }); } catch (e) { if (!/journey stopped/.test(e.message)) throw e; update(); } }
    if (q.get('sel')) { S.selectedPlant = q.get('sel'); S.open.add('evidence'); S.tab = q.get('tab') || S.tab; update(); }
    if (q.get('tab')) { S.tab = q.get('tab'); renderBottom(); }
  } catch (e) { $('#err').textContent = `could not load: ${e.message}\n\nserve the planting-db root:  python3 -I tools/design_server.py  → http://127.0.0.1:8768/design/`; console.error(e); }
})();

const cur = () => M.currentVersion(S.project);
const bed = () => S.project.site.beds.find(b => b.id === S.bedId) || S.project.site.beds[0] || null;
function persist() { M.saveLocal(S.project); $('#savestate').textContent = 'saved locally'; if (S.server?.server) M.saveServer(S.project).then(r => { if (r) $('#savestate').textContent = `saved · ${r.saved}`; }); }
function update() { refreshUnknowns(); persist(); renderTop(); renderChat(); renderBrief(); renderCanvas(); renderRail(); renderBottom(); }

// ------------------------------------------------------------------ top bar
function renderTop() {
  const p = S.project; $('#pname').value = p.name; const v = cur();
  $('#crumbs').textContent = `${p.site.boundary ? 'Site' : 'Site (no geometry)'} / ${bed() ? bed().name : 'no bed'} / ${v ? v.label : 'no design'}${S.preview ? ' / preview' : ''}`;
  $('#undo').disabled = !(v && v.parent_version_id); $('#redo').disabled = !p.redo.length;
  $('#view2d').classList.toggle('on', S.view === '2d'); $('#view3d').classList.toggle('on', S.view === '3d');
  const live = S.server?.llm?.available; $('#interp').textContent = live ? `interpreter: live model (${S.server.llm.model})` : 'interpreter: offline rules'; $('#interp').className = `tag ${live ? 'live' : 'offline'}`; $('#interp').title = S.server?.llm?.reason || 'no design server: offline rule parser (every rule listed in js/intent.js)';
}

// ------------------------------------------------------------------ conversation
function renderChat() {
  const log = $('#chatlog'); log.innerHTML = S.project.conversation.map(m => `<div class="msg ${m.role}">${m.html || esc(m.text)}${m.mode ? `<div class="m">${esc(m.mode)}</div>` : ''}</div>`).join(''); log.scrollTop = log.scrollHeight;
  const v = cur(); $('#chathint').textContent = v ? (S.selection ? 'selection active — say what should change here' : 'say what should change, or circle an area first') : (S.project.site.boundary ? 'add goals, conditions, or say "generate"' : 'start with a description');
}
async function handleSay(text, { silent = false } = {}) {
  text = text.trim(); if (!text) return null;
  M.say(S.project, 'user', text);
  const ctx = { hasDesign: !!cur(), selection: S.selection, bedId: bed()?.id, bedPolygon: bed()?.polygon, hasOpenZone: S.project.site.features.some(f => f.kind === 'no-plant-zone'), resolveSpecies: phrase => resolveSpecies(phrase), resolveFeature: phrase => resolveFeature(phrase) };
  let kind = I.classify(text, ctx); if (/^\s*(generate|make (?:a|the) design|design it|lay it out)\b/i.test(text)) kind = 'generate';
  let result = null;
  if (kind === 'generate') { result = await generate(); }
  else if (kind === 'edit') result = await handleEdit(text, ctx);
  else if (kind === 'overclaim') { const d = applyDescription(text); M.say(S.project, 'ai', '', { html: `<b>I cannot guarantee that.</b> The database has no pollinator-interaction data, no prices and no site measurements, so no ecological ranking, cost or guarantee can be computed. What it can do: list species with recorded ecological-value claims and check them against the site gates you state. I have kept the goals I could read:<ul>${d.summary}</ul>`, mode: `interpretation: ${d.provenance} · rule "overclaim"` }); result = d; }
  else result = applyDescription(text, true);
  if (!silent) update(); return result;
}
function resolveSpecies(phrase) { const p = phrase.toLowerCase().trim(); return S.K.species.find(s => p.includes(s.scientific_name.toLowerCase()) || s.scientific_name.toLowerCase().includes(p) || (s.common_names || []).some(c => p.includes(c.toLowerCase()) || c.toLowerCase().includes(p)) || p.split(' ').some(w => w.length > 4 && s.scientific_name.toLowerCase().includes(w))) || null; }
function resolveFeature(phrase) { const p = phrase.toLowerCase(); return S.project.site.features.find(f => (f.label || '').toLowerCase().includes(p) || p.includes((f.label || '').toLowerCase()) || (/tree/.test(p) && f.kind === 'existing-tree') || (/path|open|lawn|play|patio|centre|center|middle/.test(p) && f.kind === 'no-plant-zone')) || null; }

function applyDescription(text, reply = false) {
  const d = I.interpretDescription(text); const p = S.project; const site = p.site; const lines = [];
  for (const f of d.facts) {
    if (f.kind === 'dimensions') { M.setBoundary(p, G.polygonFromRect(f.w, f.h), 'user-stated'); M.setScale(p, 'user-stated', Math.max(f.w, f.h), `conversation: "${f.evidence}"`); lines.push(`site set to ${f.w} × ${f.h} m (stated, rectangle assumed)`); }
    else if (f.kind === 'size_word') lines.push(`a ${f.value} site — dimensions still unknown`);
    else if (f.kind === 'condition') { M.setCondition(p, f.key, f.value, 'user-stated', `conversation: "${f.evidence}"`); lines.push(`${f.key.replace('_', ' ')}: ${f.value} (stated)`); }
    else if (f.kind === 'address') { M.addInput(p, { type: 'address', role: 'context-reference', text: f.text, lookup_performed: false, note: 'no geocoding or site-data service is connected: reference only' }); lines.push(`address kept as a reference only — nothing is inferred from it`); }
  }
  // geometry-dependent facts: placed when a boundary exists (now or later, see ensureSuggestions)
  for (const f of d.facts) if (f.kind === 'existing-tree' || f.kind === 'no-plant-zone') { p.site.notes.push({ kind: f.kind, side: f.side, where: f.where, reason: f.reason, evidence: f.evidence, placed: false }); lines.push(f.kind === 'existing-tree' ? `an existing tree${f.side ? ` on the ${f.side}` : ''} — I will place a marker (canopy size assumed) once the site has geometry; move or resize it` : `an open area (${f.reason}) — I will suggest a no-plant zone once the site has geometry`); }
  const b = p.brief; b.provenance = d.provenance; b.values = { ...b.values, ...d.values }; for (const f of d.functions) if (!b.functions.some(x => x.function === f.function && x.where === f.where)) b.functions.push(f); for (const h of d.hard_constraints) if (!b.hard_constraints.some(x => x.id === h.id)) b.hard_constraints.push(h); b.composition = [...new Set([...b.composition, ...d.composition])]; b.unknowns = [...new Set([...b.unknowns.filter(u => !(d.facts.some(f => f.kind === 'dimensions') && /dimension/.test(u)) && !(d.facts.some(f => f.kind === 'condition' && f.key === 'light') && /^light/.test(u))), ...d.unknowns])]; b.evidence.push(...d.evidence); b.updated = new Date().toISOString();
  if (Object.keys(d.values).length) lines.push(`goals: ${Object.keys(d.values).map(k => k.replace('_', ' ')).join(', ')}`); for (const f of d.functions) lines.push(`${f.function.replace('z:', '').replace('_', ' ')} → ${f.where.replace('-', ' ')} (${f.basis})${f.alternative ? ' — alternative to check' : ''}`);
  ensureSuggestions(); const ready = M.readiness(p);
  const summary = lines.map(l => `<li>${esc(l)}</li>`).join('') || '<li>no site fact or goal recognised by the rules — try plainer words (privacy, low maintenance, habitat, dimensions like 6 x 4 m, shady, clay)</li>';
  if (reply) M.say(S.project, 'ai', '', { html: `<b>Read from what you said</b><ul>${summary}</ul>${d.unknowns.length ? `<b>Unknown</b> (not assumed): ${esc(d.unknowns.join('; '))}.` : ''}${ready.blockers.length ? `<br><b>Before a measured design:</b> ${esc(ready.blockers.join('; '))}.` : '<br>Geometry and a bed are in place — say <i>generate</i>, or add goals and conditions first.'}`, mode: `interpretation: ${d.provenance} (rules: ${d.evidence.map(e => e.rule).join(', ') || 'none matched'})` });
  return { ...d, summary, readiness: ready };
}
// candidate geometry from language (always labelled, always editable): a bed inset from the boundary, a tree marker, an open zone
function refreshUnknowns() { const p = S.project; p.brief.unknowns = p.brief.unknowns.filter(u => !(/dimension|scale/.test(u) && p.site.scale.status !== 'unknown') && !(/^light$/.test(u) && p.site.conditions.light.value) && !(/^soil/.test(u) && p.site.conditions.soil_type.value && p.site.conditions.soil_drainage.value)); }
function ensureSuggestions() {
  refreshUnknowns(); const p = S.project, site = p.site; if (!site.boundary) return; const B = G.bbox(site.boundary);
  for (const n of site.notes.filter(n => !n.placed)) {
    if (n.kind === 'existing-tree') { const side = n.side || 'north'; const pos = side === 'north' ? [B.minx + B.w * .25, B.maxy - 1] : side === 'south' ? [B.minx + B.w / 2, B.miny + 1] : side === 'east' || side === 'right' ? [B.maxx - 1, B.miny + B.h / 2] : side === 'west' || side === 'left' ? [B.minx + 1, B.miny + B.h / 2] : [B.minx + B.w / 2, B.miny + B.h / 2]; M.addFeature(p, { kind: 'existing-tree', position_m: G.roundPt(pos), radius_m: null, label: 'existing tree', source: `conversation: "${n.evidence}" — position inferred from "${side}" (a quarter of the way along that edge), canopy not stated`, status: 'inferred' }); n.placed = true; }
    if (n.kind === 'no-plant-zone') { if (site.features.some(f => f.kind === 'no-plant-zone')) { n.placed = true; continue; } const poly = [[B.minx + B.w * .3, B.miny + B.h * .15], [B.maxx - B.w * .3, B.miny + B.h * .15], [B.maxx - B.w * .3, B.miny + B.h * .55], [B.minx + B.w * .3, B.miny + B.h * .55]].map(G.roundPt); M.addFeature(p, { kind: 'no-plant-zone', polygon: poly, label: `open (${n.reason})`, source: `conversation: "${n.evidence}" — extent suggested, not stated`, status: 'inferred' }); n.placed = true; }
  }
  if (!site.beds.length) { const poly = G.inset(site.boundary, Math.min(.3, B.w / 10)).map(G.roundPt); M.addBed(p, poly, 'ai-suggested', 'Bed 1', 'suggested: the site inset by 0.3 m — accept, redraw or split it'); S.bedId = 'bed-1'; }
}

// ------------------------------------------------------------------ edits (language → typed command → preview)
async function handleEdit(text, ctx) {
  const cmd = I.interpretEdit(text, ctx); const v = cur();
  if (cmd.conflicts.length || !cmd.operations.length) { M.say(S.project, 'ai', '', { html: `<b>No change made.</b> ${esc(cmd.conflicts.join(' ') || 'I could not read an operation (reduce / increase density, remove or swap a species, move plants away from a feature).')}${cmd.operations.length ? '' : ' The design stays as it is; you can also drag, delete or add plants directly.'}`, mode: `interpretation: ${cmd.provenance}` }); S.pendingCmd = null; S.preview = null; return { cmd, preview: null }; }
  if (!cmd.scope.polygon) cmd.scope.polygon = bed().polygon;
  const pv = E.previewEdit(S.project, S.K, v, cmd); S.pendingCmd = cmd; S.preview = pv; S.scope = { polygon: cmd.scope.polygon, basis: cmd.scope.basis }; S.tab = 'schedule'; S.open.add('revision');
  const d = pv.diff;
  M.say(S.project, 'ai', '', { html: `<b>Proposed change (preview — nothing applied yet)</b><ul><li>scope: ${esc(cmd.scope.kind)} — ${esc(cmd.scope.basis)}; ${pv.targets.length} plant${pv.targets.length === 1 ? '' : 's'} inside</li>${cmd.operations.map(o => `<li>${esc(o.type.replace('_', ' '))}${o.amount ? ` ${Math.round(o.amount.value * 100)} %` : ''}${o.phrase ? ` — "${esc(o.phrase)}"` : ''}${o.resolved === false ? ' <span class="warn">(not resolved)</span>' : ''}</li>`).join('')}${cmd.preserve.filter(p => p.evidence !== 'always').map(p => `<li>preserve: ${esc(p.value.replace('z:', ''))} — "${esc(p.evidence)}"</li>`).join('')}<li>result: ${d.count_before} → ${d.count_after} plants (−${d.removed.length} +${d.added.length} ~${d.changed.length}); ${pv.untouched_outside_scope ? 'nothing outside the scope changed' : `<span class="warn">${pv.outside_changed.length} outside objects changed</span>`}</li>${pv.notes.map(n => `<li class="small">${esc(n)}</li>`).join('')}${pv.refused.map(n => `<li class="warn small">${esc(n)}</li>`).join('')}</ul>Review it on the canvas, then <b>Apply</b> or <b>Cancel</b> in the Revision panel.${cmd.preserve.some(p => p.value === 'z:screen') ? ' Privacy is kept as an intent (screen-row plants untouched); screening performance is not quantified.' : ''}`, mode: `interpretation: ${cmd.provenance} (rules: ${cmd.evidence.map(e => e.rule).join(', ')})` });
  return { cmd, preview: pv };
}
function applyPreview() { if (!S.preview) return null; const v = M.commitVersion(S.project, S.preview.version); M.say(S.project, 'sys', `applied as ${v.id}: ${v.plant_objects.length} plants (${v.edit_event.removed_ids.length} removed, ${v.edit_event.added_ids.length} added)`); S.preview = null; S.pendingCmd = null; S.scope = null; S.selection = null; update(); return v; }
function cancelPreview() { S.preview = null; S.pendingCmd = null; S.scope = null; M.say(S.project, 'sys', 'preview discarded — the design is unchanged'); update(); }
function undo() { if (M.undo(S.project)) { S.preview = null; S.pendingCmd = null; M.say(S.project, 'sys', `undo → ${cur().id} (${cur().plant_objects.length} plants)`); update(); } }
function redo() { if (M.redo(S.project)) { M.say(S.project, 'sys', `redo → ${cur().id} (${cur().plant_objects.length} plants)`); update(); } }
async function generate(opts = {}) {
  const b = bed(); const ready = M.readiness(S.project);
  if (!b) { M.say(S.project, 'ai', 'There is no planting bed yet: draw one (Bed tool), accept the suggested one, or give the site dimensions first.', { mode: 'engine' }); return null; }
  if (b.status === 'ai-suggested') { M.acceptBed(S.project, b.id); M.say(S.project, 'sys', `${b.name} accepted as drawn (it was a suggestion; redraw it any time)`); }
  const v = E.generate(S.project, S.K, b.id, opts.seed ?? S.seed, { density: opts.density ?? S.density, stagger: opts.stagger ?? true }); M.commitVersion(S.project, v); S.preview = null; S.pendingCmd = null; S.scope = null; S.tab = 'schedule'; S.open.add('design');
  const a = v.assemblage; const ev = v.evaluation;
  M.say(S.project, 'ai', '', { html: `<b>Design ${esc(v.id)}</b> — ${ev.plant_count} plant objects, ${ev.species_count} species, bed ${ev.bed_area_m2} m², seed ${v.seed}; operators ${esc(v.generator.operators.join(', '))}.<ul>${Object.entries(a.picks).filter(([, l]) => l.length).map(([role, l]) => `<li>${esc(role)}: ${l.map(p => `<i>${esc(S.K.name(p.id))}</i> (gate ${esc(p.gate)})`).join(', ')}</li>`).join('')}${a.excluded.length ? `<li>excluded: ${a.excluded.map(e => `<i>${esc(S.K.name(e.id))}</i>`).join(', ')} — reasons in the Design panel</li>` : ''}${ev.edge_zones.map(z => `<li>${esc(z.label)}: row cover ${z.screen_row_cover_m} m of ${z.edge_length_m} m (continuity ${z.continuity}, a geometric proxy)</li>`).join('')}${ev.evidence_gates.unknown ? `<li>${ev.evidence_gates.unknown} plants rest on an <b>unknown</b> site gate (conditions not stated)</li>` : ''}</ul>${ready.scale ? '' : '<b>Scale is not calibrated</b>: this is conceptual, not a measured plan. '}Circle an area and say what should change, or drag plants directly.`, mode: 'engine: deterministic placement over the knowledge adapter (no model text)' });
  update(); return v;
}

// ------------------------------------------------------------------ brief (editable intent)
function renderBrief() {
  const b = S.project.brief; const VAL = { privacy: 'privacy', maintenance_low: 'low maintenance', ecology: 'ecological value', openness: 'openness / light', seasonal_interest: 'seasonal interest', shelter: 'shelter / quiet', cost_awareness: 'cost awareness' };
  let h = `<h3>Design intent <span class="faint">(editable · ${b.provenance ? esc(b.provenance) : 'nothing read yet'})</span></h3>`;
  h += Object.entries(VAL).map(([k, l]) => `<div class="vrow"><span>${l}${k === 'cost_awareness' ? ' <span class="faint">(no prices in the data)</span>' : ''}</span><input type="range" min="0" max="3" value="${b.values[k] || 0}" data-value="${k}" title="0 = not wanted · 3 = must"></div>`).join('');
  h += `<h3>Spatial functions</h3>${b.functions.map((f, i) => `<span class="chip">${esc(f.function.replace('z:', '').replace('_', ' '))} · ${esc(f.where.replace('-', ' '))}${f.alternative ? ' (alt)' : ''} <button class="mini" data-rmfn="${i}" title="remove">×</button></span>`).join('') || '<span class="faint small">none yet</span>'} <select id="addfn" class="mini"><option value="">+ function…</option>${S.K.d.functions.map(f => `<option value="${esc(f.id)}">${esc(f.label)}</option>`).join('')}</select> <select id="addfnwhere" class="mini"><option value="north-edge">north edge</option><option value="south-edge">south edge</option><option value="east-edge">east edge</option><option value="west-edge">west edge</option><option value="boundary">outer boundary</option><option value="bed-interior">bed interior</option></select>`;
  h += `<h3>Hard constraints</h3>${b.hard_constraints.map(c => `<div class="small">• ${esc(c.text)} <span class="faint mono">${esc(c.evidence)}</span></div>`).join('') || '<span class="faint small">none</span>'}`;
  if (b.unknowns.length) h += `<h3>Unknown — not assumed</h3>${b.unknowns.map(u => `<div class="small faint">• ${esc(u)}</div>`).join('')}`;
  $('#brief').innerHTML = h;
}

// ------------------------------------------------------------------ canvas
const TOOLS = [['select', 'Select / lasso', 'click a plant for its evidence · drag a plant to move it · drag on empty ground to circle a region'], ['site', 'Site boundary', 'click the corners, Enter or double-click to close'], ['bed', 'Bed', 'click the corners of a planting bed, Enter to close'], ['tree', 'Tree', 'click to place an existing tree (locked); set its canopy in the rail'], ['open', 'No-plant zone', 'click the corners of an open area, Enter to close'], ['calibrate', 'Calibrate', 'click two points, then type the real distance'], ['add', 'Add plant', 'pick a species in the rail, then click inside the bed']];
function setTool(t) { S.tool = t; S.draft = []; S.calib = []; renderCanvas(); }
function renderCanvas() {
  const svg = $('#svg'); svg.className.baseVal = `tool-${S.tool}`; const v = cur();
  $('#tools').innerHTML = TOOLS.map(([id, label, tip]) => `<button class="${S.tool === id ? 'on' : ''}" data-tool="${id}" title="${esc(tip)}">${label}</button>`).join('') + `<span class="sep"></span><button data-act="zones" class="${S.showZones ? 'on' : ''}" title="show the spatial zones of the design">Zones</button><button data-act="labels" class="${S.labels ? 'on' : ''}">Labels</button>${S.overlay ? `<button data-act="overlay" class="${S.overlay.show ? 'on' : ''}" title="reference image (traced by hand; no automatic interpretation)">Image</button>` : ''}`;
  $('#quick').innerHTML = S.project.site.boundary ? `<span class="faint">site ${G.round(G.bbox(S.project.site.boundary).w, 1)} × ${G.round(G.bbox(S.project.site.boundary).h, 1)} m · scale <span class="tag ${esc(S.project.site.scale.status)}">${esc(S.project.site.scale.status)}</span></span><button class="mini" data-act="bedfromsite" title="a bed inset 0.3 m from the boundary (suggested, editable)">+ bed from site</button>` : `<span>W</span><input id="qw" class="num" type="number" value="6" step="0.5" min="1"><span>× H</span><input id="qh" class="num" type="number" value="4" step="0.5" min="1"><span>m</span><button class="mini primary" data-act="quicksite">Set site</button>`;
  if (S.view === '3d') { R.render3D(svg, S.project, v, S, S.K); S.T = null; } else S.T = R.render2D(svg, S.project, v, S, S.K);
  $('#csub').textContent = S.view === '3d' ? 'isometric proxy · same model' : (S.tool === 'select' ? (S.selection ? `selection ${S.selection.id} active` : S.preview ? 'preview shown — Apply or Cancel in the rail' : 'plan · north up') : TOOLS.find(t => t[0] === S.tool)[2]);
  $('#legend').innerHTML = v ? [...new Set(v.plant_objects.map(p => p.species_id))].map(s => `<span><i style="background:${R.colourOf(S.K, s)}"></i>${esc(S.K.name(s).split(' ').map((w, i) => i ? w.slice(0, 4) + '.' : w).join(' '))}</span>`).join('') : '';
  $('#cfoot').innerHTML = `<span><b>${S.project.site.beds.length}</b> bed${S.project.site.beds.length === 1 ? '' : 's'} · <b>${S.project.site.features.length}</b> features${v ? ` · <b>${v.plant_objects.length}</b> plants` : ''}</span><span class="sp"></span><span>${S.project.site.scale.status === 'unknown' ? 'scale unknown — conceptual' : esc(S.project.site.scale.status)}</span>`;
}
function initCanvas() {
  const svg = $('#svg'); const tip = $('#tip'); const mpos = ev => { const r = svg.getBoundingClientRect(); return S.T ? S.T.toM([ev.clientX - r.left, ev.clientY - r.top]) : null; };
  svg.addEventListener('mousemove', ev => { const t = ev.target.closest('[data-tip]'); if (t && !S.drag) { tip.innerHTML = t.dataset.tip; tip.style.display = 'block'; tip.style.left = `${ev.clientX + 14}px`; tip.style.top = `${ev.clientY + 12}px`; } else tip.style.display = 'none'; });
  svg.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  svg.addEventListener('pointerdown', ev => {
    if (S.view === '3d') { const pl = ev.target.closest('[data-plant]'); if (pl) { S.selectedPlant = pl.dataset.plant; S.open.add('evidence'); update(); } return; }
    const m = mpos(ev); if (!m) return;
    if (S.tool === 'select') {
      const pl = ev.target.closest('[data-plant]'); if (pl && cur() && !S.preview) { const p = cur().plant_objects.find(p => p.id === pl.dataset.plant); if (p && !p.locked) { S.drag = { id: p.id, start: m, from: [...p.position_m], moved: false }; svg.setPointerCapture(ev.pointerId); } S.selectedPlant = pl.dataset.plant; S.open.add('evidence'); renderRail(); return; }
      const bd = ev.target.closest('[data-bed]'); if (bd) { S.bedId = bd.dataset.bed; S.selectedPlant = null; update(); return; }
      S.lasso = [m]; S.drag = { lasso: true }; svg.setPointerCapture(ev.pointerId); return;
    }
    if (S.tool === 'site' || S.tool === 'bed' || S.tool === 'open') { S.draft.push(G.roundPt(m)); renderCanvas(); return; }
    if (S.tool === 'tree') { const id = M.addFeature(S.project, { kind: 'existing-tree', position_m: G.roundPt(m), radius_m: null, label: 'existing tree', source: 'canvas click', status: 'user-drawn' }); M.say(S.project, 'sys', `existing tree ${id} placed at ${G.roundPt(m).join(', ')} m — canopy radius assumed 1.5 m until you set it`); S.open.add('site'); update(); return; }
    if (S.tool === 'calibrate') { S.calib.push(m); if (S.calib.length === 2) { const d = G.dist(S.calib[0], S.calib[1]); const real = parseFloat(prompt(`Real distance between the two points (the drawing measures ${G.round(d)} m now)?`, G.round(d))); if (real > 0 && d > 0) rescale(real / d, real); S.calib = []; setTool('select'); } return; }
    if (S.tool === 'add') { if (!S.addSpecies) { M.say(S.project, 'sys', 'pick a species in the Design panel first'); update(); return; } const v = cur(); if (!v) { M.say(S.project, 'sys', 'generate a design first, then add plants'); update(); return; } const r = E.directEdit(S.project, S.K, v, { kind: 'add', species_id: S.addSpecies, at: m }); if (r?.version) { M.commitVersion(S.project, r.version); M.say(S.project, 'sys', r.notes.join('; ')); update(); } return; }
  });
  svg.addEventListener('pointermove', ev => { if (!S.drag) return; const m = mpos(ev); if (!m) return; if (S.drag.lasso) { if (G.dist(m, S.lasso[S.lasso.length - 1]) > 0.08) { S.lasso.push(m); renderCanvas(); } return; } S.drag.moved = true; const v = cur(); const p = v.plant_objects.find(p => p.id === S.drag.id); p.position_m = m; renderCanvas(); });
  svg.addEventListener('pointerup', ev => {
    if (!S.drag) return; const d = S.drag; S.drag = null;
    if (d.lasso) { const poly = S.lasso; S.lasso = []; if (poly.length > 4 && G.area(poly) > 0.1) { S.selection = { id: `lasso-${S.project.versions.length}-${Date.now().toString(36).slice(-4)}`, polygon: poly.map(G.roundPt), source: 'drawn on the canvas' }; S.scope = null; S.preview = null; const n = cur() ? cur().plant_objects.filter(p => G.pointInPolygon(p.position_m, poly)).length : 0; M.say(S.project, 'sys', `selection ${S.selection.id}: ${G.round(G.area(poly), 1)} m², ${n} plant${n === 1 ? '' : 's'} inside — say what should change here (e.g. "too dense here, keep privacy")`); S.open.add('revision'); } else { S.selection = null; S.selectedPlant = null; } update(); return; }
    const v = cur(); const p = v.plant_objects.find(p => p.id === d.id); const to = [...p.position_m]; p.position_m = d.from;
    if (d.moved && G.dist(to, d.from) > 0.05) { const r = E.directEdit(S.project, S.K, v, { kind: 'move', id: d.id, to }); if (r?.version) { M.commitVersion(S.project, r.version); M.say(S.project, 'sys', r.notes.join('; ')); } }
    update();
  });
  svg.addEventListener('dblclick', () => closeDraft());
  document.addEventListener('keydown', ev => { if (['INPUT', 'TEXTAREA', 'SELECT'].includes(ev.target.tagName)) return; if (ev.key === 'Enter') closeDraft(); if (ev.key === 'Escape') { S.draft = []; S.selection = null; S.selectedPlant = null; S.calib = []; if (S.preview) cancelPreview(); else update(); } if ((ev.key === 'Delete' || ev.key === 'Backspace') && S.selectedPlant && cur()) { const r = E.directEdit(S.project, S.K, cur(), { kind: 'delete', id: S.selectedPlant }); if (r?.version) { M.commitVersion(S.project, r.version); M.say(S.project, 'sys', r.notes.join('; ')); S.selectedPlant = null; update(); } } if ((ev.metaKey || ev.ctrlKey) && ev.key === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); } });
  new ResizeObserver(() => renderCanvas()).observe($('#canvas .body'));
}
function closeDraft() {
  if (S.draft.length < 3) return; const poly = S.draft.slice(); S.draft = [];
  if (S.tool === 'site') { M.setBoundary(S.project, poly, 'user-drawn'); if (S.project.site.scale.status === 'unknown') M.setScale(S.project, 'user-drawn', null, 'drawn on the canvas at the canvas scale — calibrate to make it measured'); M.say(S.project, 'sys', `site boundary drawn: ${G.round(G.area(poly), 1)} m² at the canvas scale (${S.project.site.scale.status}) — calibrate a known length to make it measured`); ensureSuggestions(); }
  else if (S.tool === 'bed') { const id = M.addBed(S.project, poly, 'user-drawn', null, 'drawn on the canvas'); S.bedId = id; M.say(S.project, 'sys', `${id} drawn: ${G.round(G.area(poly), 1)} m²`); }
  else if (S.tool === 'open') { M.addFeature(S.project, { kind: 'no-plant-zone', polygon: poly, label: 'open (no-plant)', source: 'drawn on the canvas', status: 'user-drawn' }); M.say(S.project, 'sys', `no-plant zone drawn: ${G.round(G.area(poly), 1)} m²`); }
  setTool('select'); update();
}
function rescale(f, known) { const p = S.project.site; const sc = pt => [G.round(pt[0] * f), G.round(pt[1] * f)]; if (p.boundary) p.boundary = p.boundary.map(sc); for (const b of p.beds) { b.polygon = b.polygon.map(sc); b.area_m2 = G.round(G.area(b.polygon)); } for (const ft of p.features) { if (ft.position_m) ft.position_m = sc(ft.position_m); if (ft.polygon) ft.polygon = ft.polygon.map(sc); if (ft.radius_m != null) ft.radius_m = G.round(ft.radius_m * f); } if (S.overlay) { S.overlay.x *= f; S.overlay.y *= f; S.overlay.w *= f; S.overlay.h *= f; } for (const v of S.project.versions) for (const pl of v.plant_objects) pl.position_m = sc(pl.position_m); M.setScale(S.project, 'user-calibrated', known, `two points on the canvas = ${known} m`); M.say(S.project, 'sys', `calibrated: ×${G.round(f, 3)} — the site is now ${G.round(G.bbox(p.boundary || p.beds[0]?.polygon || [[0, 0], [1, 1]]).w, 1)} m wide; plant positions were scaled with the geometry (regenerate to re-space them)`); }
function quickSite(w, h) { M.setBoundary(S.project, G.polygonFromRect(w, h), 'user-stated'); M.setScale(S.project, 'user-stated', Math.max(w, h), 'width × height typed above the canvas (rectangle)'); M.say(S.project, 'sys', `site set to ${w} × ${h} m (typed; a rectangle is assumed — redraw with the Site tool for another shape)`); ensureSuggestions(); update(); }
function acceptBed(id) { M.acceptBed(S.project, id); S.bedId = id; M.say(S.project, 'sys', `${id} accepted`); update(); }

// ------------------------------------------------------------------ context rail
function sec(id, title, n, body) { return `<div class="sec ${S.open.has(id) ? 'open' : ''}" data-sec="${id}"><div class="h">${title}<span class="n">${esc(n)}</span></div><div class="c">${body}</div></div>`; }
function renderRail() {
  const p = S.project, site = p.site, v = cur(); const COND = { light: ['full-sun', 'part-shade', 'shade'], soil_type: ['clay', 'sandy', 'loam', 'acidic', 'alkaline'], soil_drainage: ['well-drained', 'poorly-drained'], water: ['dry', 'average', 'moist', 'wet'], wind: ['exposed', 'sheltered'], irrigation: ['none', 'establishment-only', 'regular'] };
  let siteH = `<div class="field"><label>geometry</label><div class="v">${site.boundary ? `<span class="tag ${esc(site.boundary_status)}">${esc(site.boundary_status)}</span> ${G.round(G.area(site.boundary), 1)} m²` : '<span class="tag unknown">none</span>'}</div></div><div class="field"><label>scale</label><div class="v"><span class="tag ${esc(site.scale.status)}">${esc(site.scale.status)}</span> <span class="small faint">${esc(site.scale.source || '')}</span></div></div><div class="field"><label>north</label><div class="v"><input class="num" type="number" id="northdeg" value="${site.orientation.north_angle_degrees}" step="15">° <span class="small faint">${esc(site.orientation.basis)}</span></div></div>`;
  siteH += `<div class="kicker" style="margin:8px 0 3px">conditions (value · status)</div>` + Object.entries(site.conditions).map(([k, c]) => `<div class="field"><label>${k.replace('_', ' ')}</label><div class="v"><select data-cond="${k}"><option value="">unknown</option>${COND[k].map(o => `<option ${c.value === o ? 'selected' : ''}>${o}</option>`).join('')}</select><select data-condstatus="${k}" ${c.value ? '' : 'disabled'}><option ${c.status === 'user-stated' ? 'selected' : ''}>user-stated</option><option ${c.status === 'assumed' ? 'selected' : ''}>assumed</option><option ${c.status === 'inferred' ? 'selected' : ''}>inferred</option></select></div></div>`).join('');
  siteH += `<div class="kicker" style="margin:8px 0 3px">features</div>` + (site.features.map(f => `<div class="field"><label>${esc(f.label || f.kind)}</label><div class="v">${f.kind === 'existing-tree' ? `r <input class="num" type="number" step="0.25" min="0.25" value="${f.radius_m ?? ''}" placeholder="1.5?" data-treer="${esc(f.id)}"> m <span class="tag ${f.radius_m == null ? 'assumed' : 'user-stated'}">${f.radius_m == null ? 'canopy assumed' : 'canopy stated'}</span>` : `${G.round(G.area(f.polygon), 1)} m² <span class="tag ${esc(f.status || 'user-drawn')}">${esc(f.status || 'user-drawn')}</span>`} <button class="mini danger" data-rmfeat="${esc(f.id)}">×</button></div></div>`).join('') || '<span class="faint small">none — tree and open-zone tools above the canvas</span>');
  siteH += `<div class="kicker" style="margin:8px 0 3px">inputs</div>` + (p.inputs.map(i => `<div class="small">• ${esc(i.type)} · ${esc(i.role)} — ${esc(i.note || '')}${i.text ? ` <span class="mono">${esc(i.text)}</span>` : ''}</div>`).join('') || '<span class="faint small">conversation only</span>') + (S.overlay ? `<div class="field"><label>image overlay</label><div class="v">opacity <input type="range" min="0" max="1" step="0.05" value="${S.overlay.opacity}" id="ovop" style="width:70px"> width <input class="num" type="number" step="0.5" value="${G.round(S.overlay.w, 1)}" id="ovw"> m <span class="small faint">manual: no automatic recognition</span></div></div>` : '');
  let bedH = site.beds.map(b => `<div class="field"><label><span class="link" data-selbed="${esc(b.id)}" style="cursor:pointer;${S.bedId === b.id ? 'color:var(--olive-deep);font-weight:500' : ''}">${esc(b.name)}</span></label><div class="v">${b.area_m2} m² <span class="tag ${esc(b.status)}">${esc(b.status)}</span>${b.status === 'ai-suggested' ? ` <button class="mini primary" data-acceptbed="${esc(b.id)}">accept</button>` : ''} <button class="mini danger" data-rmbed="${esc(b.id)}">×</button></div></div>${b.source ? `<div class="small faint" style="margin:-2px 0 4px">${esc(b.source)}</div>` : ''}`).join('') || '<span class="faint small">no bed — draw one, or set the site and use "+ bed from site"</span>';
  bedH += `<p class="small faint">Site Boundary ≠ Planting Bed ≠ Planting Layout. Site-wide goals apply to every bed; a bed's own conditions override the site's in the rail above when you select it.</p>`;
  let designH = `<div class="row wrap"><button class="primary" data-act="generate" ${bed() ? '' : 'disabled'}>${v ? 'Regenerate' : 'Generate'} for ${esc(bed()?.name || '—')}</button><span class="small">seed <input class="num" type="number" id="seed" value="${S.seed}"></span><span class="small">density <input type="range" min="0.6" max="1.4" step="0.1" value="${S.density}" id="density" style="width:70px"> ${S.density}</span></div>`;
  if (v) designH += `<div class="kicker" style="margin:8px 0 3px">assemblage — why these species</div>${R.assemblageHtml(v, S.K)}<div class="kicker" style="margin:8px 0 3px">add a plant (Add tool, then click)</div><div class="row wrap">${S.K.species.map(s => `<span class="chip click ${S.addSpecies === s.id ? 'on' : ''}" data-addsp="${esc(s.id)}" style="${S.addSpecies === s.id ? 'border-color:var(--olive)' : ''}"><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${R.colourOf(S.K, s.id)}"></i><i class="sci">${esc(s.scientific_name)}</i></span>`).join('')}</div>`;
  else designH += `<p class="small muted">Generation needs an accepted bed. It then: checks every species against the stated site conditions (unknown stays unknown), takes the spatial functions from the brief, builds zones on the bed geometry, and places plant objects with named operators. Nothing outside the database is used.</p>`;
  let revH = '';
  if (S.preview) { const pv = S.preview, d = pv.diff; revH += `<div class="preview"><h4>Preview: ${esc(S.pendingCmd.utterance)}</h4><div class="small">scope ${esc(S.pendingCmd.scope.kind)} · ${pv.targets.length} targets · −${d.removed.length} +${d.added.length} ~${d.changed.length} → ${d.count_after} plants${pv.untouched_outside_scope ? '' : ' · <span class="warn">outside objects changed</span>'}</div>${S.pendingCmd.operations.filter(o => o.amount).map((o, i) => `<div class="small row" style="margin-top:4px">amount <input type="range" min="0.05" max="0.8" step="0.05" value="${o.amount.value}" data-amount="${i}" style="width:90px"> ${Math.round(o.amount.value * 100)} % <span class="faint">(${esc(o.amount.basis)})</span></div>`).join('')}${pv.screen_continuity.after.map((z, i) => `<div class="small">${esc(z.label)}: continuity ${pv.screen_continuity.before[i]?.continuity ?? '—'} → ${z.continuity} (geometric proxy; privacy not guaranteed)</div>`).join('')}<div class="small muted">${pv.notes.map(esc).join(' · ')}</div>${pv.refused.length ? `<div class="small warn">${pv.refused.map(esc).join(' · ')}</div>` : ''}<div class="btns"><button class="primary" data-act="apply">Apply</button><button data-act="cancel">Cancel</button></div></div>`; }
  else revH += `<p class="small muted">${S.selection ? `Selection <b>${esc(S.selection.id)}</b> (${G.round(G.area(S.selection.polygon), 1)} m²) is active: say what should change here. ` : 'Circle a region on the canvas (drag on empty ground), or name a side ("the right side is too dense").'}Direct edits: drag a plant, select + Delete, Add tool. Every edit is a new version; Undo walks back.</p>`;
  if (v?.edit_event) revH += `<div class="small"><b>last event</b> ${esc(v.edit_event.kind)}${v.edit_event.notes ? ` — ${esc(v.edit_event.notes.join('; '))}` : ''}</div>`;
  const evH = S.selectedPlant && v ? (() => { const pl = (S.preview?.version.plant_objects || v.plant_objects).find(p => p.id === S.selectedPlant) || v.plant_objects.find(p => p.id === S.selectedPlant); return pl ? `<div class="small faint">position ${pl.position_m.join(', ')} m · ${esc(pl.origin)} · group ${esc(pl.group_id)} · zone ${esc(pl.zone_id || '—')} <button class="mini danger" data-act="delsel">delete</button></div>` + R.evidenceHtml(pl.species_id, S.K, p, pl) : '<span class="faint">plant not in this version</span>'; })() : S.selectedSpecies ? R.evidenceHtml(S.selectedSpecies, S.K, p) : '<span class="faint small">click a plant on the canvas or a species in the schedule</span>';
  $('#railbody').innerHTML = sec('site', 'Site', site.boundary ? `${Object.values(site.conditions).filter(c => c.value).length}/6 conditions` : 'no geometry', siteH) + sec('beds', 'Planting beds', `${site.beds.length}`, bedH) + sec('design', 'Design', v ? `${v.plant_objects.length} plants` : 'none', designH) + sec('revision', 'Revision', S.preview ? 'preview' : S.selection ? 'selection' : '', revH) + sec('evidence', 'Evidence', S.selectedPlant || '', evH);
  $('#rsub').textContent = S.preview ? 'revision' : S.selectedPlant ? 'evidence' : v ? 'design' : site.boundary ? 'site' : 'start';
}

// ------------------------------------------------------------------ bottom
function renderBottom() {
  const v = cur(); const tabs = [['schedule', 'Schedule'], ['versions', `Versions (${S.project.versions.length})`], ['assumptions', 'Evaluation · assumptions'], ['model', 'Model JSON']];
  $('#btabs').innerHTML = tabs.map(([id, l]) => `<button data-tab="${id}" class="${S.tab === id ? 'on' : ''}">${l}</button>`).join('');
  const shown = S.preview ? S.preview.version : v;
  $('#bbody').innerHTML = S.tab === 'schedule' ? (S.preview ? '<div class="note">preview schedule — becomes real on Apply</div>' : '') + R.scheduleHtml(shown ? { ...shown, schedule: M.schedule(shown) } : null, S.K, S.project) : S.tab === 'versions' ? R.versionsHtml(S.project, S.K, M.diff) : S.tab === 'assumptions' ? R.assumptionsHtml(shown, S.project) : `<pre class="mono" style="white-space:pre-wrap;margin:0">${esc(JSON.stringify({ site: S.project.site, brief: S.project.brief, current_version: v ? { id: v.id, parent: v.parent_version_id, seed: v.seed, plants: v.plant_objects.length, schedule: v.schedule } : null }, null, 1).slice(0, 6000))}</pre>`;
  $('#bsub').textContent = v ? `${v.id} · ${v.plant_objects.length} plants · ${S.project.versions.length} versions` : '';
}

// ------------------------------------------------------------------ export
function download(name, text, type = 'application/json') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
export function exportBundle() {
  const p = S.project, v = cur(); const base = (p.name || 'design').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const json = JSON.stringify({ exported: new Date().toISOString(), schema: p.schema, knowledge_snapshot: p.knowledge_snapshot, site: p.site, brief: p.brief, current_version_id: p.current_version_id, versions: p.versions, inputs: p.inputs }, null, 1);
  const svg = v ? planSvg(p, v) : null;
  const csv = v ? 'species_id,scientific_name,count,roles,proxy_radius_m,proxy_claim,site_gate\n' + v.schedule.map(r => { const pl = v.plant_objects.find(x => x.species_id === r.species_id); const g = S.K.gate(r.species_id, p.site.conditions, { maintenance_low: !!p.brief.values.maintenance_low }).overall; return [r.species_id, S.K.name(r.species_id), r.count, r.roles.join('|'), pl.proxy_radius_m, pl.proxy_source?.claim || '', g].map(x => `"${String(x).replace(/"/g, '""')}"`).join(','); }).join('\n') + `\n"total","",${v.plant_objects.length},"","","",""\n` : null;
  const md = v ? `# ${p.name} — design ${v.id}\n\nExported ${new Date().toISOString()} · knowledge snapshot ${p.knowledge_snapshot?.generated} (${p.knowledge_snapshot?.method}) · geometry ${v.geometry_precision} · ${v.plant_objects.length} plant objects, ${v.schedule.length} species · seed ${v.seed} · operators ${v.generator.operators.join(', ')}\n\n## Site\n- boundary: ${p.site.boundary ? `${p.site.boundary_status}, ${G.round(G.area(p.site.boundary), 1)} m²` : 'none'}; scale: ${p.site.scale.status}${p.site.scale.known_length_m ? ` (${p.site.scale.known_length_m} m)` : ''}\n- conditions: ${Object.entries(p.site.conditions).map(([k, c]) => `${k} = ${c.value ?? 'unknown'} (${c.status})`).join('; ')}\n- features: ${p.site.features.map(f => `${f.label || f.kind} (${f.status || 'drawn'})`).join('; ') || 'none'}\n- beds: ${p.site.beds.map(b => `${b.name} ${b.area_m2} m² (${b.status})`).join('; ')}\n\n## Brief\n- values: ${Object.entries(p.brief.values).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}\n- functions: ${p.brief.functions.map(f => `${f.function} @ ${f.where}`).join('; ') || 'none'}\n- hard constraints: ${p.brief.hard_constraints.map(c => c.text).join('; ')}\n- unknown: ${p.brief.unknowns.join('; ') || 'none'}\n\n## Assumptions\n${v.assumptions.map(a => `- ${a}`).join('\n')}\n\n## Unresolved\n${v.unresolved.map(a => `- ${a}`).join('\n') || '- none'}\n\n## Evaluation (measured on the model only)\n- bed area ${v.evaluation.bed_area_m2} m²; plants ${v.evaluation.plant_count}; species ${v.evaluation.species_count}\n${v.evaluation.edge_zones.map(z => `- ${z.label}: row cover ${z.screen_row_cover_m} / ${z.edge_length_m} m, continuity ${z.continuity} (geometric proxy)`).join('\n')}\n- cost: ${v.evaluation.cost_note}\n- ecology: ${v.evaluation.ecology_note}\n\n## Schedule\n${v.schedule.map(r => `- ${S.K.name(r.species_id)} × ${r.count} (${r.roles.join(', ')})`).join('\n')}\n\n## Versions\n${p.versions.map(x => `- ${x.id} ← ${x.parent_version_id || 'root'}: ${x.label} (${x.plant_objects.length} plants)`).join('\n')}\n` : null;
  return { base, json, svg, csv, md };
}
function exportAll() { const b = exportBundle(); download(`${b.base}-model.json`, b.json); if (b.svg) download(`${b.base}-plan.svg`, b.svg, 'image/svg+xml'); if (b.csv) download(`${b.base}-schedule.csv`, b.csv, 'text/csv'); if (b.md) download(`${b.base}-assumptions.md`, b.md, 'text/markdown'); M.say(S.project, 'sys', `exported ${b.svg ? '4 files: model JSON, plan SVG, schedule CSV, assumptions MD' : 'model JSON (no design yet)'} — same object ids and counts in all of them`); update(); }
export function planSvg(p, v) {
  const pts = [...(p.site.boundary || []), ...p.site.beds.flatMap(b => b.polygon)]; const B = G.bbox(pts); const k = 60, pad = 40; const W = B.w * k + 2 * pad, H = B.h * k + 2 * pad; const P = ([x, y]) => [pad + (x - B.minx) * k, H - pad - (y - B.miny) * k]; const poly = ps => ps.map(q => P(q).join(',')).join(' ');
  let h = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Helvetica, Arial, sans-serif" font-size="10"><rect width="100%" height="100%" fill="#fdfbf7"/><!-- ${esc(p.name)} · ${esc(v.id)} · exported ${new Date().toISOString()} · 1 m = ${k} px · ${esc(v.geometry_precision)} -->`;
  if (p.site.boundary) h += `<polygon points="${poly(p.site.boundary)}" fill="none" stroke="#5f5a52" stroke-dasharray="6 3"/>`;
  for (const b of p.site.beds) h += `<polygon points="${poly(b.polygon)}" fill="rgba(95,127,98,.08)" stroke="#5f7f62" data-bed="${esc(b.id)}"/>`;
  for (const f of p.site.features) h += f.polygon ? `<polygon points="${poly(f.polygon)}" fill="rgba(42,39,35,.05)" stroke="#9a948a" stroke-dasharray="3 3" data-feature="${esc(f.id)}"/>` : `<circle cx="${P(f.position_m)[0]}" cy="${P(f.position_m)[1]}" r="${(f.radius_m ?? 1.5) * k}" fill="rgba(68,96,74,.12)" stroke="#44604a" stroke-dasharray="2 3" data-feature="${esc(f.id)}"/>`;
  for (const pl of v.plant_objects) { const c = P(pl.position_m); h += `<circle id="${esc(pl.id)}" data-species="${esc(pl.species_id)}" data-x="${pl.position_m[0]}" data-y="${pl.position_m[1]}" cx="${c[0]}" cy="${c[1]}" r="${pl.proxy_radius_m * k}" fill="${R.colourOf(S.K, pl.species_id)}" fill-opacity=".7" stroke="${R.colourOf(S.K, pl.species_id)}"/>`; }
  h += `<line x1="${pad}" y1="${H - 14}" x2="${pad + k}" y2="${H - 14}" stroke="#2a2723" stroke-width="2"/><text x="${pad}" y="${H - 18}">1 m (${esc(p.site.scale.status)})</text><text x="${W - pad}" y="${pad - 14}" text-anchor="end">N ↑</text>`;
  h += `<text x="${pad}" y="${pad - 14}" font-size="11">${esc(p.name)} · ${esc(v.id)} · ${v.plant_objects.length} plants · ${v.schedule.map(r => `${S.K.name(r.species_id)} ×${r.count}`).join(', ')}</text></svg>`; return h;
}

// ------------------------------------------------------------------ ui wiring
function initUi() {
  $('#chatform').addEventListener('submit', async ev => { ev.preventDefault(); const t = $('#say').value; $('#say').value = ''; await handleSay(t); });
  $('#say').addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); $('#chatform').requestSubmit(); } });
  $('#imgfile').addEventListener('change', ev => { const f = ev.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { const B = S.project.site.boundary ? G.bbox(S.project.site.boundary) : { minx: 0, miny: 0, w: 8 }; const w = B.w || 8; S.overlay = { src: rd.result, x: B.minx, y: B.miny, w, h: w * img.height / img.width, opacity: .5, show: true }; M.addInput(S.project, { type: 'image', role: 'visual-reference', name: f.name, geometry_precision: 'unknown', note: 'shown under the plan for tracing; automatic recognition is not implemented — draw beds and features over it, then calibrate a known length' }); M.say(S.project, 'sys', `image "${f.name}" added as a reference overlay (${img.width}×${img.height} px). No automatic interpretation: trace the boundary, beds and features with the tools, then Calibrate two points of known distance.`); update(); }; img.src = rd.result; }; rd.readAsDataURL(f); ev.target.value = ''; });
  $('#addr').onclick = () => { const a = prompt('Address (kept as a reference only — no lookup service is connected):'); if (a) { M.addInput(S.project, { type: 'address', role: 'context-reference', text: a, lookup_performed: false, note: 'no geocoding or site-data service is connected: reference only' }); M.say(S.project, 'sys', `address noted: "${a}" — reference only; nothing is inferred from it`); update(); } };
  $('#demo').onclick = () => journey({ fast: false }).catch(e => console.warn(e.message));
  $('#pname').addEventListener('change', () => { S.project.name = $('#pname').value; update(); });
  $('#newproj').onclick = () => { if (!confirm('Start a new project? The current one stays saved on the server (if running) but the local copy is replaced.')) return; M.clearLocal(); S.project = M.newProject(); S.project.knowledge_snapshot = S.K.snapshot; Object.assign(S, { bedId: null, selection: null, scope: null, preview: null, pendingCmd: null, selectedPlant: null, overlay: null }); M.say(S.project, 'ai', 'New project. Describe the site and what you want from it.', { mode: 'system' }); update(); };
  $('#undo').onclick = undo; $('#redo').onclick = redo; $('#view2d').onclick = () => { S.view = '2d'; update(); }; $('#view3d').onclick = () => { S.view = '3d'; update(); }; $('#export').onclick = exportAll;
  document.body.addEventListener('click', ev => {
    const t = ev.target.closest('[data-tool],[data-act],[data-sec],[data-tab],[data-acceptbed],[data-rmbed],[data-selbed],[data-rmfeat],[data-addsp],[data-rmfn],[data-species],[data-version]'); if (!t) return;
    if (t.dataset.tool) setTool(t.dataset.tool);
    else if (t.dataset.act) act(t.dataset.act, t);
    else if (t.dataset.sec !== undefined && ev.target.closest('.h')) { const id = t.dataset.sec; S.open.has(id) ? S.open.delete(id) : S.open.add(id); renderRail(); }
    else if (t.dataset.tab) { S.tab = t.dataset.tab; renderBottom(); }
    else if (t.dataset.acceptbed) acceptBed(t.dataset.acceptbed);
    else if (t.dataset.rmbed) { S.project.site.beds = S.project.site.beds.filter(b => b.id !== t.dataset.rmbed); S.bedId = S.project.site.beds[0]?.id || null; update(); }
    else if (t.dataset.selbed) { S.bedId = t.dataset.selbed; update(); }
    else if (t.dataset.rmfeat) { S.project.site.features = S.project.site.features.filter(f => f.id !== t.dataset.rmfeat); update(); }
    else if (t.dataset.addsp) { S.addSpecies = t.dataset.addsp; setTool('add'); renderRail(); }
    else if (t.dataset.rmfn) { S.project.brief.functions.splice(+t.dataset.rmfn, 1); update(); }
    else if (t.dataset.species) { S.selectedSpecies = t.dataset.species; S.selectedPlant = null; S.open.add('evidence'); renderRail(); }
    else if (t.dataset.version) { S.project.current_version_id = t.dataset.version; S.project.redo = []; S.preview = null; update(); }
  });
  document.body.addEventListener('change', ev => {
    const t = ev.target;
    if (t.dataset.value) { S.project.brief.values[t.dataset.value] = +t.value; if (!+t.value) delete S.project.brief.values[t.dataset.value]; S.project.brief.provenance = 'user-edited'; update(); }
    else if (t.id === 'addfn' && t.value) { S.project.brief.functions.push({ function: t.value, where: $('#addfnwhere').value, basis: 'added by the user', evidence: 'brief editor' }); update(); }
    else if (t.dataset.cond) { const k = t.dataset.cond; if (t.value) M.setCondition(S.project, k, t.value, 'user-stated', 'rail'); else M.setCondition(S.project, k, null, 'unknown', null); update(); }
    else if (t.dataset.condstatus) { S.project.site.conditions[t.dataset.condstatus].status = t.value; update(); }
    else if (t.dataset.treer) { const f = S.project.site.features.find(f => f.id === t.dataset.treer); f.radius_m = t.value ? +t.value : null; f.radius_status = t.value ? 'user-stated' : null; update(); }
    else if (t.id === 'northdeg') { S.project.site.orientation = { north_angle_degrees: +t.value, basis: 'user-stated' }; update(); }
    else if (t.id === 'seed') S.seed = +t.value; else if (t.id === 'density') { S.density = +t.value; renderRail(); }
    else if (t.dataset.amount !== undefined) { S.pendingCmd.operations.filter(o => o.amount)[+t.dataset.amount].amount = { kind: 'relative', value: +t.value, basis: 'adjusted by the user' }; S.preview = E.previewEdit(S.project, S.K, cur(), S.pendingCmd); update(); }
    else if (t.id === 'ovop') { S.overlay.opacity = +t.value; renderCanvas(); } else if (t.id === 'ovw') { const w = +t.value; S.overlay.h *= w / S.overlay.w; S.overlay.w = w; renderCanvas(); }
  });
  initCanvas();
}
function act(a, t) {
  if (a === 'generate') generate(); else if (a === 'apply') applyPreview(); else if (a === 'cancel') cancelPreview();
  else if (a === 'zones') { S.showZones = !S.showZones; renderCanvas(); } else if (a === 'labels') { S.labels = !S.labels; renderCanvas(); } else if (a === 'overlay') { S.overlay.show = !S.overlay.show; renderCanvas(); }
  else if (a === 'quicksite') quickSite(+$('#qw').value || 6, +$('#qh').value || 4);
  else if (a === 'bedfromsite') { const B = G.bbox(S.project.site.boundary); const id = M.addBed(S.project, G.inset(S.project.site.boundary, Math.min(.3, B.w / 10)).map(G.roundPt), 'ai-suggested', null, 'suggested: the site inset by 0.3 m'); S.bedId = id; update(); }
  else if (a === 'delsel') { const r = E.directEdit(S.project, S.K, cur(), { kind: 'delete', id: S.selectedPlant }); if (r?.version) { M.commitVersion(S.project, r.version); M.say(S.project, 'sys', r.notes.join('; ')); S.selectedPlant = null; update(); } }
}

// ------------------------------------------------------------------ the demonstration journey (also the browser test path)
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function journey({ fast = false, stop = null } = {}) {
  stop = stop ?? (new URLSearchParams(location.search).get('stop') ? +new URLSearchParams(location.search).get('stop') : null);
  const wait = ms => fast ? Promise.resolve() : sleep(ms); const out = { steps: [] }; const step = (name, data) => { out.steps.push({ name, ...data }); if (stop && out.steps.length >= stop) throw new Error('journey stopped at ' + name); };
  M.clearLocal(); S.project = M.newProject('Demo backyard'); S.project.id = 'demo-backyard'; S.project.knowledge_snapshot = S.K.snapshot; Object.assign(S, { bedId: null, selection: null, scope: null, preview: null, pendingCmd: null, selectedPlant: null, overlay: null, view: '2d', seed: 42, density: 1 }); update();
  const d1 = await handleSay('I have a small backyard with an old tree on the north side. I want privacy, low maintenance and some ecological value, but it should not feel closed in. The kids need the middle to play.'); step('01 vague description', { readiness: d1.readiness, values: d1.values, unknowns: d1.unknowns, boundary: !!S.project.site.boundary }); await wait(900);
  quickSite(6, 4); step('02 site 6 x 4 m (typed; illustrative)', { boundary: S.project.site.boundary, features: S.project.site.features.map(f => ({ id: f.id, kind: f.kind, status: f.status })), beds: S.project.site.beds.map(b => ({ id: b.id, status: b.status })) }); await wait(900);
  acceptBed('bed-1'); step('03 bed accepted', { bed: S.project.site.beds[0] }); await wait(600);
  await handleSay('Privacy along the north edge; keep the middle open; it is part shade.'); step('04 brief refined', { functions: S.project.brief.functions, light: S.project.site.conditions.light }); await wait(900);
  const v1 = await generate({ seed: 42 }); step('05 generated', { version: v1.id, plants: v1.plant_objects.length, schedule: v1.schedule, operators: v1.generator.operators, validation_ok: v1.validation.ok, edge: v1.evaluation.edge_zones }); await wait(1200);
  S.view = '3d'; update(); step('06 3d proxy', { same_ids: true }); await wait(900); S.view = '2d'; update();
  const B = G.bbox(S.project.site.beds[0].polygon); S.selection = { id: 'lasso-demo', polygon: [[B.maxx - B.w * .36, B.miny - .1], [B.maxx + .1, B.miny - .1], [B.maxx + .1, B.maxy + .1], [B.maxx - B.w * .36, B.maxy + .1]], source: 'demo: drawn selection over the right side' }; update(); await wait(700);
  const e = await handleSay('Too dense here, but keep the privacy.'); step('07 lasso + "too dense here, keep privacy"', { command: e.cmd, diff: e.preview?.diff, targets: e.preview?.targets, untouched_outside_scope: e.preview?.untouched_outside_scope }); await wait(1400);
  const v2 = applyPreview(); step('08 applied', { version: v2.id, plants: v2.plant_objects.length, removed: v2.edit_event.removed_ids }); await wait(900);
  undo(); step('09 undo', { current: cur().id, plants: cur().plant_objects.length }); await wait(700); redo(); step('10 redo', { current: cur().id, plants: cur().plant_objects.length }); await wait(700);
  const e2 = await handleSay('Move the taller plants away from the tree.'); step('11 text-only reference', { command: e2.cmd, diff: e2.preview?.diff, notes: e2.preview?.notes, refused: e2.preview?.refused }); if (e2.preview) { applyPreview(); } await wait(700);
  const bundle = exportBundle(); step('12 export', { files: ['model.json', 'plan.svg', 'schedule.csv', 'assumptions.md'], svg_plants: (bundle.svg.match(/<circle id="plant-/g) || []).length, model_plants: cur().plant_objects.length, csv_total: cur().plant_objects.length });
  out.project = S.project; window.pi.journeyResult = out; const el = document.createElement('pre'); el.id = 'journey-out'; el.hidden = true; el.textContent = JSON.stringify({ steps: out.steps.map(s => ({ ...s, command: s.command ? { scope: s.command.scope.kind, ops: s.command.operations.map(o => o.type), preserve: s.command.preserve.map(p => p.value) } : undefined })) }); document.body.appendChild(el);
  M.say(S.project, 'sys', 'demonstration journey complete — every step above changed the model; export or keep editing'); update(); return out;
}
async function loadDemoProject(id) { const p = await M.loadServer(id); if (p) { S.project = p; S.bedId = p.site.beds[0]?.id || null; update(); } }
