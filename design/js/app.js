// Planting Intelligence · design journey (Phase 2 UX redesign, 2026-11-07). One model (model.js), one knowledge adapter over
// brain/data/explorer.json (knowledge.js), one interpreter (intent.js: offline rules; a live model through tools/design_server.py
// when configured), one engine (engine.js), the same 2D renderer (render.js) and 3D garden (garden3d.js) as the classic workspace.
// What changed is the interface: a document that scrolls Imagine → Site → Intent, then an immersive garden stage that takes the
// viewport; conversation, evidence and the schedule appear where they are needed. Every view reads the same state S and the same
// project; every change goes through the model, so plan, garden, schedule, exports and the saved file agree.
import * as M from './model.js';
import { loadKnowledge } from './knowledge.js';
import * as I from './intent.js';
import * as E from './engine.js';
import * as R from './render.js';
import * as G from './geom.js';
import { FORM_LABEL } from './plantforms.js';

const $ = s => document.querySelector(s); const $$ = s => [...document.querySelectorAll(s)]; const esc = R.esc;
const STAGES = ['welcome', 'site', 'intent', 'garden']; const STAGE_LABEL = { welcome: 'Imagine', site: 'Site', intent: 'Intent', garden: 'Garden' };
const S = { project: null, K: null, server: null, stage: 'welcome', mode: 'plan', pz: { x: 0, y: 0, k: 1 }, winter: false, tool: 'select', bedId: null, selection: null, scope: null, preview: null, pendingCmd: null, selectedPlant: null, selectedSpecies: null, evidenceOpen: false, draft: [], lasso: [], overlay: null, showZones: true, labels: false, drawer: null, composerOpen: false, T: null, drag: null, addSpecies: null, calib: [], seed: 42, density: 1, stagger: true, garden: null, gardenError: null, gardenLoading: null, inset: null };
const VAL = { privacy: 'Privacy', openness: 'Openness and light', ecology: 'Ecological value', maintenance_low: 'Low maintenance', seasonal_interest: 'Seasonal interest', shelter: 'Shelter and quiet', cost_awareness: 'Cost awareness' };
const VAL_EFFECT = {   // what each goal does in the engine today — shown next to the control so no slider pretends
  privacy: { on: 'a Screen row along the named edge (species linked to Screen, evergreen preferred)', off: null },
  openness: { on: 'open centre kept; Scrim listed as the alternative to Screen', off: null },
  ecology: { on: 'one accent species with a recorded ecological-value claim, repeated toward the open side', off: null },
  maintenance_low: { on: 'maintenance gate (recorded "low" passes); a carpeting ground layer', off: null },
  seasonal_interest: { on: 'accent species chosen for recorded interest; Winter view from leaf-retention claims', off: null },
  shelter: { on: null, off: 'recorded in the brief — no placement rule yet' },
  cost_awareness: { on: null, off: 'recorded — the database has no prices, nothing is computed' },
};
const LEVELS = ['not wanted', 'nice', 'important', 'must'];
const FN_SHORT = { 'z:screen': 'Screen', 'z:scrim': 'Scrim', 'z:ground_cover': 'Ground cover', 'z:ceiling_canopy': 'Canopy', 'z:barrier': 'Barrier' };
const EXAMPLE = "I have a small backyard with an old tree on the north side. I want privacy, low maintenance and some ecological value, but it should not feel closed in. The kids need the middle to play.";
const ICON = { photo: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>', draw: '<svg viewBox="0 0 24 24"><path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M13 8l3 3"/></svg>', size: '<svg viewBox="0 0 24 24"><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>', pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></svg>' };

// ------------------------------------------------------------------ boot
(async function boot() {
  try {
    S.K = await loadKnowledge(new URLSearchParams(location.search).get('data') || '../brain/data/explorer.json');
    S.server = await M.serverStatus();
    const q = new URLSearchParams(location.search); const saved = q.get('fresh') ? null : M.loadLocal();
    S.project = saved || M.newProject(); ensureUi(S.project); if (!S.project.knowledge_snapshot) S.project.knowledge_snapshot = S.K.snapshot;
    S.bedId = S.project.site.beds[0]?.id || null;
    initUi(); heroArt();
    window.pi = { S, M, E, I, R, G, update, say: handleSay, journey, runScript, setTool, setMode, setStage, generate, applyPreview, cancelPreview, undo, redo, exportAll, quickSite, acceptBed, gardenStats: () => S.garden ? S.garden.stats() : { error: S.gardenError || 'not started' } };
    if (q.get('mode')) S.mode = q.get('mode'); if (q.get('winter')) S.winter = true; if (q.get('names')) S.labels = true;
    let stage = q.get('stage') || (saved ? S.project.ui.stage : 'welcome'); if (stage === 'garden' && !cur()) stage = cur() ? 'garden' : (S.project.ui.unlocked.intent ? 'intent' : 'welcome');
    for (const st of STAGES) if (S.project.ui.unlocked[st]) unlock(st, false);
    setStage(stage, { scroll: false }); update(); $('#loading').classList.add('gone');
    if (q.get('journey')) { try { await journey({ fast: true }); } catch (e) { if (!/journey stopped/.test(e.message)) throw e; update(); if (S.stage !== 'garden') { if (q.get('solo')) { for (const st of ['welcome', 'site', 'intent', 'gate']) $(`#s-${st}`).hidden = st !== S.stage; renderCanvas(); } else $(`#s-${S.stage}`)?.scrollIntoView({ behavior: 'auto', block: 'start' }); } } }
    if (q.get('script')) await runScript(q.get('script'));
    if (q.get('sel')) { S.selectedPlant = q.get('sel'); update(); }
    if (q.get('drawer')) { S.drawer = q.get('drawer'); renderGarden(); }
    if (q.get('mode')) setMode(q.get('mode'));
    if (q.get('composer')) { S.composerOpen = true; renderGarden(); }
  } catch (e) { $('#err').textContent = `could not load: ${e.message}\n\nserve the planting-db root:  python3 -I tools/design_server.py  → http://127.0.0.1:8768/design/`; console.error(e); }
})();

const cur = () => M.currentVersion(S.project);
const bed = () => S.project.site.beds.find(b => b.id === S.bedId) || S.project.site.beds[0] || null;
function ensureUi(p) { p.ui = p.ui || {}; p.ui.unlocked = p.ui.unlocked || { welcome: true, site: false, intent: false, garden: false }; p.ui.stage = p.ui.stage || 'welcome'; p.ui.site_fp = p.ui.site_fp || null; }
const siteFp = () => JSON.stringify([S.project.site.boundary, S.project.site.beds.map(b => b.polygon), S.project.site.features.map(f => [f.kind, f.position_m, f.polygon, f.radius_m]), S.project.site.conditions]);
function persist() { S.project.ui.stage = S.stage; M.saveLocal(S.project); if (S.server?.server) M.saveServer(S.project).catch(() => { }); }
function refreshUnknowns() { const p = S.project; p.brief.unknowns = p.brief.unknowns.filter(u => !(/dimension|scale/.test(u) && p.site.scale.status !== 'unknown') && !(/^light$/.test(u) && p.site.conditions.light.value) && !(/^soil/.test(u) && p.site.conditions.soil_type.value && p.site.conditions.soil_drainage.value)); }
function update() { refreshUnknowns(); persist(); renderNav(); renderWelcome(); if (S.project.ui.unlocked.site) renderSite(); if (S.project.ui.unlocked.intent) renderIntent(); renderGate(); if (S.stage === 'garden') renderGarden(); else if (S.stage === 'site') renderCanvas(); }

// ------------------------------------------------------------------ stages
function unlock(stage, reveal = true) { S.project.ui.unlocked[stage] = true; const sec = $(`#s-${stage === 'garden' ? 'gate' : stage}`); if (sec && sec.hidden) { sec.hidden = false; if (reveal) { sec.classList.add('reveal'); setTimeout(() => sec.classList.remove('reveal'), 900); } } }
function setStage(stage, { scroll = true } = {}) {
  if (stage === 'garden' && !cur()) stage = 'intent';
  if (stage !== 'welcome') unlock(stage, scroll);
  const leaving = S.stage; S.stage = stage; document.body.dataset.stage = stage; S.project.ui.stage = stage;
  if (stage === 'garden') { document.body.classList.add('in-garden'); $('#stage').hidden = false; $('#stage').insertBefore($('#svg'), $('#gl').nextSibling); S.pz = { x: 0, y: 0, k: 1 }; renderGarden(); }
  else {
    if (leaving === 'garden') { document.body.classList.remove('in-garden'); $('#stage').hidden = true; if (S.garden) S.garden.setVisible(false); S.mode = 'plan'; S.selection = null; S.scope = null; }
    $('#site-canvas-body').appendChild($('#svg')); $('#svg').style.display = 'block';
    renderNav(); if (scroll) { const sec = $(`#s-${stage === 'garden' ? 'gate' : stage}`); requestAnimationFrame(() => sec.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })); }
    if (stage === 'site') requestAnimationFrame(renderCanvas);
  }
  persist(); renderNav();
}
function renderNav() {
  const u = S.project.ui.unlocked; const can = { welcome: true, site: u.site, intent: u.intent, garden: !!cur() };
  $('#stagenav').innerHTML = STAGES.map(st => `<li><button data-go="${st}" class="${S.stage === st ? 'on' : ''} ${can[st] && S.stage !== st ? 'done' : ''}" ${can[st] ? '' : 'disabled'} title="${can[st] ? STAGE_LABEL[st] : 'not reached yet'}"><span class="dot"></span><span class="label">${STAGE_LABEL[st]}</span></button></li>`).join('');
  const live = S.server?.llm?.available; $('#interp').textContent = live ? `live model: ${S.server.llm.model}` : 'offline rules'; $('#interp').className = `tag ${live ? 'live' : 'offline'}`; $('#interp').title = S.server?.llm?.reason || 'no language model is connected: an offline rule parser reads your words (every rule is listed in js/intent.js), so phrase site facts and goals plainly';
}

// ------------------------------------------------------------------ 1 · welcome
function heroArt() {
  const K = S.K; const W = 600, H = 640; const rand = G.rng(11);
  const sp = K.species.map(s => ({ id: s.id, f: R.form(K, s.id, null) })); const order = { tree: 0, shrub: 1, fern: 2, herb: 3, ground: 4 };
  sp.sort((a, b) => order[a.f.kind] - order[b.f.kind]);
  let h = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ten species drawn from their claims"><defs><radialGradient id="g0" cx="50%" cy="65%" r="60%"><stop offset="0" stop-color="#e9e3d3"/><stop offset="1" stop-color="#f7f3ea" stop-opacity="0"/></radialGradient></defs><ellipse cx="${W / 2}" cy="${H * .62}" rx="${W * .52}" ry="${H * .34}" fill="url(#g0)"/>`;
  const rows = { tree: H * .3, shrub: H * .55, fern: H * .67, herb: H * .75, ground: H * .82 }; const slots = {};
  sp.forEach((s, i) => { const k = s.f.kind; slots[k] = (slots[k] || 0) + 1; });
  const seen = {};
  for (const s of sp) {
    const k = s.f.kind; const n = slots[k]; seen[k] = (seen[k] || 0) + 1; const t = n === 1 ? .5 : (seen[k] - .5) / n;
    const x = W * (.1 + .8 * t) + (rand() - .5) * 40, y = rows[k] + (rand() - .5) * 30; const rpx = 24 + 44 * Math.sqrt(Math.max(.3, s.f.radius_m)); const sc = rpx;
    h += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="sway ${['a', 'b', 'c'][seen[k] % 3]}"><g transform="scale(${sc.toFixed(2)})">${R.symbol(s.f, s.id, 1, 'present', { k: sc })}</g></g></g>`;
  }
  h += '</svg>';
  $('#hero-art').innerHTML = h + `<figcaption>${K.species.length} species of the knowledge base, drawn from their recorded growth form, spread and colour claims</figcaption>`;
}
function renderWelcome() {
  const p = S.project; const K = S.K; const nClaims = Object.keys(K.claims).length;
  $('#kb-note').textContent = `${K.species.length} Metro Vancouver species · ${nClaims} sourced claims · nothing invented · words read by ${S.server?.llm?.available ? 'a live model' : 'offline rules'}`;
  $('#foot-kb').textContent = `knowledge projection ${K.snapshot.generated?.slice(0, 10) || ''}`;
  $('#welcome-inputs').innerHTML = `<button type="button" class="btn" data-input="photo" title="shown under the plan to trace by hand — no automatic recognition">${ICON.photo} Photo or sketch</button><button type="button" class="btn" data-input="draw" title="draw the site boundary on the canvas">${ICON.draw} Draw</button><button type="button" class="btn" data-input="size" title="type width × height in metres">${ICON.size} Dimensions</button><button type="button" class="btn" data-input="address" title="kept as a reference only — no map or site data service is connected">${ICON.pin} Address</button>`;
  const started = p.site.boundary || p.versions.length || p.conversation.some(m => m.role === 'user');
  const res = $('#resume'); res.hidden = !started || S.stage !== 'welcome';
  if (!res.hidden) res.innerHTML = `<div class="note ok row between wrap"><span><b>${esc(p.name)}</b> is in progress — ${cur() ? `${cur().plant_objects.length} plants in ${p.versions.length} version${p.versions.length === 1 ? '' : 's'}` : p.site.boundary ? 'site model started' : 'description read'}.</span><span class="row"><button class="btn small primary" data-resume="1">Continue</button><button class="btn small ghost" id="newproj2">Start over</button></span></div>`;
}

// ------------------------------------------------------------------ conversation → model (unchanged logic from the classic workspace)
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
  const d = I.interpretDescription(text); const p = S.project; const lines = [];
  for (const f of d.facts) {
    if (f.kind === 'dimensions') { M.setBoundary(p, G.polygonFromRect(f.w, f.h), 'user-stated'); M.setScale(p, 'user-stated', Math.max(f.w, f.h), `conversation: "${f.evidence}"`); lines.push(`site set to ${f.w} × ${f.h} m (stated, rectangle assumed)`); S.pz = { x: 0, y: 0, k: 1 }; }
    else if (f.kind === 'size_word') lines.push(`a ${f.value} site — dimensions still unknown`);
    else if (f.kind === 'condition') { M.setCondition(p, f.key, f.value, 'user-stated', `conversation: "${f.evidence}"`); lines.push(`${f.key.replace('_', ' ')}: ${f.value} (stated)`); }
    else if (f.kind === 'address') { M.addInput(p, { type: 'address', role: 'context-reference', text: f.text, lookup_performed: false, note: 'no geocoding or site-data service is connected: reference only' }); lines.push(`address kept as a reference only — nothing is inferred from it`); }
  }
  for (const f of d.facts) if (f.kind === 'existing-tree' || f.kind === 'no-plant-zone') { p.site.notes.push({ kind: f.kind, side: f.side, where: f.where, reason: f.reason, evidence: f.evidence, placed: false }); lines.push(f.kind === 'existing-tree' ? `an existing tree${f.side ? ` on the ${f.side}` : ''} — a marker will be placed (canopy size assumed) once the site has geometry; move or resize it` : `an open area (${f.reason}) — a no-plant zone will be suggested once the site has geometry`); }
  const b = p.brief; b.provenance = d.provenance; b.values = { ...b.values, ...d.values }; for (const f of d.functions) if (!b.functions.some(x => x.function === f.function && x.where === f.where)) b.functions.push(f); for (const h of d.hard_constraints) if (!b.hard_constraints.some(x => x.id === h.id)) b.hard_constraints.push(h); b.composition = [...new Set([...b.composition, ...d.composition])]; b.unknowns = [...new Set([...b.unknowns, ...d.unknowns])]; b.evidence.push(...d.evidence); b.updated = new Date().toISOString();
  if (Object.keys(d.values).length) lines.push(`goals: ${Object.keys(d.values).map(k => k.replace('_', ' ')).join(', ')}`); for (const f of d.functions) lines.push(`${f.function.replace('z:', '').replace('_', ' ')} → ${f.where.replace('-', ' ')} (${f.basis})${f.alternative ? ' — alternative to check' : ''}`);
  ensureSuggestions(); const ready = M.readiness(p);
  const summary = lines.map(l => `<li>${esc(l)}</li>`).join('') || '<li>no site fact or goal recognised by the rules — try plainer words (privacy, low maintenance, habitat, dimensions like 6 x 4 m, shady, clay)</li>';
  if (reply) M.say(S.project, 'ai', '', { html: `<b>Read from what you said</b><ul>${summary}</ul>${d.unknowns.length ? `<b>Unknown</b> (not assumed): ${esc(d.unknowns.join('; '))}.` : ''}${ready.blockers.length ? `<br><b>Before a measured design:</b> ${esc(ready.blockers.join('; '))}.` : '<br>Geometry and a bed are in place — set the intent, then generate.'}`, mode: `interpretation: ${d.provenance} (rules: ${d.evidence.map(e => e.rule).join(', ') || 'none matched'})` });
  unlock('site'); if (p.site.beds.length) unlock('intent');
  return { ...d, summary, readiness: ready };
}
function ensureSuggestions() {
  refreshUnknowns(); const p = S.project, site = p.site; if (!site.boundary) return; const B = G.bbox(site.boundary);
  for (const n of site.notes.filter(n => !n.placed)) {
    if (n.kind === 'existing-tree') { const side = n.side || 'north'; const pos = side === 'north' ? [B.minx + B.w * .25, B.maxy - 1] : side === 'south' ? [B.minx + B.w / 2, B.miny + 1] : side === 'east' || side === 'right' ? [B.maxx - 1, B.miny + B.h / 2] : side === 'west' || side === 'left' ? [B.minx + 1, B.miny + B.h / 2] : [B.minx + B.w / 2, B.miny + B.h / 2]; M.addFeature(p, { kind: 'existing-tree', position_m: G.roundPt(pos), radius_m: null, label: 'existing tree', source: `conversation: "${n.evidence}" — position inferred from "${side}" (a quarter of the way along that edge), canopy not stated`, status: 'inferred' }); n.placed = true; }
    if (n.kind === 'no-plant-zone') { if (site.features.some(f => f.kind === 'no-plant-zone')) { n.placed = true; continue; } const poly = [[B.minx + B.w * .3, B.miny + B.h * .15], [B.maxx - B.w * .3, B.miny + B.h * .15], [B.maxx - B.w * .3, B.miny + B.h * .55], [B.minx + B.w * .3, B.miny + B.h * .55]].map(G.roundPt); M.addFeature(p, { kind: 'no-plant-zone', polygon: poly, label: `open (${n.reason})`, source: `conversation: "${n.evidence}" — extent suggested, not stated`, status: 'inferred' }); n.placed = true; }
  }
  if (!site.beds.length) { const poly = G.inset(site.boundary, Math.min(.3, B.w / 10)).map(G.roundPt); M.addBed(p, poly, 'ai-suggested', 'Bed 1', 'suggested: the site inset by 0.3 m — accept, redraw or split it'); S.bedId = 'bed-1'; }
  unlock('intent');
}

// ------------------------------------------------------------------ edits (language → typed command → preview)
async function handleEdit(text, ctx) {
  const cmd = I.interpretEdit(text, ctx); const v = cur();
  if (cmd.conflicts.length || !cmd.operations.length) { M.say(S.project, 'ai', '', { html: `<b>No change made.</b> ${esc(cmd.conflicts.join(' ') || 'I could not read an operation (reduce / increase density, remove or swap a species, move plants away from a feature).')}${cmd.operations.length ? '' : ' The design stays as it is; you can also drag, delete or add plants directly.'}`, mode: `interpretation: ${cmd.provenance}` }); S.pendingCmd = null; S.preview = null; return { cmd, preview: null }; }
  if (!cmd.scope.polygon) cmd.scope.polygon = bed().polygon;
  const pv = E.previewEdit(S.project, S.K, v, cmd); S.pendingCmd = cmd; S.preview = pv; S.scope = { polygon: cmd.scope.polygon, basis: cmd.scope.basis };
  const d = pv.diff;
  M.say(S.project, 'ai', '', { html: `<b>Proposed change — preview, nothing applied yet.</b> Scope: ${esc(cmd.scope.kind)} (${esc(cmd.scope.basis)}), ${pv.targets.length} plant${pv.targets.length === 1 ? '' : 's'} inside. ${cmd.operations.map(o => `${esc(o.type.replace('_', ' '))}${o.amount ? ` ${Math.round(o.amount.value * 100)} %` : ''}${o.resolved === false ? ' (not resolved)' : ''}`).join('; ')}. Result ${d.count_before} → ${d.count_after} plants; ${pv.untouched_outside_scope ? 'nothing outside the scope changed' : `${pv.outside_changed.length} outside objects changed`}. Red = to be removed, in every view. Apply or cancel in the card.${cmd.preserve.some(p => p.value === 'z:screen') ? ' Privacy is kept as an intent (screen-row plants untouched); screening performance is not quantified.' : ''}`, mode: `interpretation: ${cmd.provenance} (rules: ${cmd.evidence.map(e => e.rule).join(', ')})` });
  return { cmd, preview: pv };
}
function applyPreview() { if (!S.preview) return null; const v = M.commitVersion(S.project, S.preview.version); M.say(S.project, 'sys', `applied as ${v.id}: ${v.plant_objects.length} plants (${v.edit_event.removed_ids.length} removed, ${v.edit_event.added_ids.length} added)`); S.preview = null; S.pendingCmd = null; S.scope = null; S.selection = null; update(); return v; }
function cancelPreview() { S.preview = null; S.pendingCmd = null; S.scope = null; M.say(S.project, 'sys', 'preview discarded — the design is unchanged'); update(); }
function undo() { if (M.undo(S.project)) { S.preview = null; S.pendingCmd = null; M.say(S.project, 'sys', `undo → ${cur().id} (${cur().plant_objects.length} plants)`); update(); } }
function redo() { if (M.redo(S.project)) { M.say(S.project, 'sys', `redo → ${cur().id} (${cur().plant_objects.length} plants)`); update(); } }
async function generate(opts = {}) {
  const b = bed(); const ready = M.readiness(S.project);
  if (!b) { M.say(S.project, 'ai', 'There is no planting bed yet: give the site dimensions or draw the boundary, then accept the suggested bed (or draw one).', { mode: 'engine' }); if (!opts.quiet) { setStage('site'); update(); } return null; }
  if (b.status === 'ai-suggested') { M.acceptBed(S.project, b.id); M.say(S.project, 'sys', `${b.name} accepted as drawn (it was a suggestion; redraw it any time)`); }
  const v = E.generate(S.project, S.K, b.id, opts.seed ?? S.seed, { density: opts.density ?? S.density, stagger: opts.stagger ?? S.stagger }); M.commitVersion(S.project, v); S.preview = null; S.pendingCmd = null; S.scope = null; S.selection = null; S.project.ui.site_fp = siteFp();
  const a = v.assemblage; const ev = v.evaluation;
  M.say(S.project, 'ai', '', { html: `<b>Design ${esc(v.id)}</b> — ${ev.plant_count} plant objects, ${ev.species_count} species, bed ${ev.bed_area_m2} m², seed ${v.seed}; operators ${esc(v.generator.operators.join(', '))}.<ul>${Object.entries(a.picks).filter(([, l]) => l.length).map(([role, l]) => `<li>${esc(role)}: ${l.map(p => `<i>${esc(S.K.name(p.id))}</i> (gate ${esc(p.gate)})`).join(', ')}</li>`).join('')}${a.excluded.length ? `<li>excluded: ${a.excluded.map(e => `<i>${esc(S.K.name(e.id))}</i>`).join(', ')} — reasons in Assumptions</li>` : ''}${ev.edge_zones.map(z => `<li>${esc(z.label)}: row cover ${z.screen_row_cover_m} m of ${z.edge_length_m} m (continuity ${z.continuity}, a geometric proxy)</li>`).join('')}${ev.evidence_gates.unknown ? `<li>${ev.evidence_gates.unknown} plants rest on an <b>unknown</b> site gate (conditions not stated)</li>` : ''}</ul>${ready.scale ? '' : '<b>Scale is not calibrated</b>: this is conceptual, not a measured plan. '}Circle an area and say what should change, or drag plants directly.`, mode: 'engine: deterministic placement over the knowledge adapter (no model text)' });
  unlock('garden'); if (!opts.quiet) setStage('garden'); update(); return v;
}

// ------------------------------------------------------------------ 2 · site
const COND = { light: ['full-sun', 'part-shade', 'shade'], soil_type: ['clay', 'sandy', 'loam', 'acidic', 'alkaline'], soil_drainage: ['well-drained', 'poorly-drained'], water: ['dry', 'average', 'moist', 'wet'], wind: ['exposed', 'sheltered'], irrigation: ['none', 'establishment-only', 'regular'] };
const condSel = (k, c) => `<select data-cond="${k}" aria-label="${k.replace('_', ' ')}"><option value="">unknown</option>${COND[k].map(o => `<option ${c.value === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
function renderSite() {
  const p = S.project, site = p.site, b = p.brief; const B = site.boundary ? G.bbox(site.boundary) : null;
  const stated = [], inferred = [], unknown = [];
  if (site.boundary) stated.push(`<div class="fact"><span class="k">site</span><span class="v">${G.round(B.w, 1)} × ${G.round(B.h, 1)} m · ${G.round(G.area(site.boundary), 1)} m² <span class="tag ${esc(site.boundary_status)}">${esc(site.boundary_status)}</span><span class="src">scale ${esc(site.scale.status)}${site.scale.source ? ` — ${esc(site.scale.source)}` : ''}</span></span></div>`);
  else unknown.push(`<div class="fact"><span class="k">dimensions</span><span class="v">not stated — type width × height, draw the boundary, or trace a photo and calibrate a known length<span class="src">no rectangle is assumed until you say so</span></span></div>`);
  for (const [k, c] of Object.entries(site.conditions)) { const row = `<div class="fact"><span class="k">${k.replace('_', ' ')}</span><span class="v">${condSel(k, c)} ${c.value ? `<span class="tag ${esc(c.status)}">${esc(c.status)}</span>` : ''}${c.source ? `<span class="src">${esc(c.source)}</span>` : ''}</span></div>`; (c.value ? (c.status === 'user-stated' ? stated : inferred) : unknown).push(row); }
  for (const f of site.features) { const row = `<div class="fact"><span class="k">${esc(f.label || f.kind)}</span><span class="v">${f.kind === 'existing-tree' ? `at ${f.position_m.join(', ')} m · canopy r <input class="num" type="number" step="0.25" min="0.25" value="${f.radius_m ?? ''}" placeholder="1.5?" data-treer="${esc(f.id)}" aria-label="canopy radius in metres"> m <span class="tag ${f.radius_m == null ? 'assumed' : 'user-stated'}">${f.radius_m == null ? 'canopy assumed 1.5 m' : 'canopy stated'}</span>` : `${G.round(G.area(f.polygon), 1)} m² <span class="tag ${esc(f.status || 'user-drawn')}">${esc(f.status || 'user-drawn')}</span>`} <button class="btn mini ghost" data-rmfeat="${esc(f.id)}" title="remove">remove</button>${f.source ? `<span class="src">${esc(f.source)}</span>` : ''}</span></div>`; (f.status === 'inferred' || f.status === 'assumed' ? inferred : stated).push(row); }
  for (const n of site.notes.filter(n => !n.placed)) inferred.push(`<div class="fact"><span class="k">${n.kind === 'existing-tree' ? 'existing tree' : 'open area'}</span><span class="v">read from "${esc(n.evidence)}"${n.side ? ` on the ${esc(n.side)}` : ''} — placed as a marker once the site has geometry</span></div>`);
  inferred.push(`<div class="fact"><span class="k">north</span><span class="v"><input class="num" type="number" id="northdeg" value="${site.orientation.north_angle_degrees}" step="15" aria-label="north angle in degrees">° from up <span class="tag ${site.orientation.basis?.startsWith('assumption') ? 'assumed' : 'user-stated'}">${site.orientation.basis?.startsWith('assumption') ? 'assumed up' : 'stated'}</span></span></div>`);
  if (Object.keys(b.values).length) stated.push(`<div class="fact"><span class="k">goals</span><span class="v">${Object.keys(b.values).map(k => `<span class="chip">${esc(VAL[k] || k)}</span>`).join('')}<span class="src">adjusted in the next step</span></span></div>`);
  for (const u of b.unknowns.filter(u => !/dimension|scale|^light$|^soil/.test(u))) unknown.push(`<div class="fact"><span class="k">note</span><span class="v">${esc(u)}</span></div>`);
  const inputs = p.inputs.length ? `<div class="card"><h3>Other inputs <span class="n">${p.inputs.length}</span></h3>${p.inputs.map(i => `<div class="fact"><span class="k">${esc(i.type)}</span><span class="v">${i.text ? `<span class="mono">${esc(i.text)}</span> ` : ''}${esc(i.name || '')}<span class="src">${esc(i.note || '')}</span></span></div>`).join('')}${S.overlay ? `<div class="fact"><span class="k">image</span><span class="v">opacity <input type="range" min="0" max="1" step="0.05" value="${S.overlay.opacity}" id="ovop" style="width:90px" aria-label="overlay opacity"> width <input class="num" type="number" step="0.5" value="${G.round(S.overlay.w, 1)}" id="ovw" aria-label="overlay width in metres"> m <button class="btn mini" data-act="overlay">${S.overlay.show ? 'hide' : 'show'}</button><span class="src">traced by hand — no automatic recognition</span></span></div>` : ''}</div>` : '';
  const lastAi = [...p.conversation].reverse().find(m => m.role === 'ai');
  $('#site-read').innerHTML = `<div class="card stated"><h3>Stated <span class="n">${stated.length}</span></h3>${stated.join('') || '<div class="small faint">nothing measured or stated yet</div>'}</div><div class="card inferred"><h3>Inferred or suggested — confirm or change <span class="n">${inferred.length}</span></h3>${inferred.join('')}</div><div class="card unknown"><h3>Unknown — not assumed <span class="n">${unknown.length}</span></h3>${unknown.join('') || '<div class="small faint">nothing left unknown</div>'}</div>${inputs}<div class="card"><h3>Add to the description</h3><form class="mini-composer" id="site-form"><textarea id="say1" placeholder="e.g. it is 6 x 4 m, part shade, clay soil; there is a patio on the south side…" aria-label="add to the site description"></textarea><button class="btn primary small" type="submit">Send</button></form>${lastAi ? `<div class="log"><div class="msg ai">${lastAi.html || esc(lastAi.text)}${lastAi.mode ? `<div class="m">${esc(lastAi.mode)}</div>` : ''}</div></div>` : ''}</div>`;
  // canvas chrome
  const T = [['select', 'Select', 'click a feature or a bed · ⌘ + wheel to zoom · right-drag to pan'], ['site', 'Site boundary', 'click the corners, Enter or double-click to close'], ['bed', 'Bed', 'click the corners of a planting bed, Enter to close'], ['tree', 'Tree', 'click to place an existing tree; set its canopy on the left'], ['open', 'Open area', 'click the corners of an area to keep free of plants, Enter to close'], ['calibrate', 'Calibrate', 'click two points, then type the real distance']];
  $('#site-tools').innerHTML = `<span class="kicker" style="margin-right:4px">draw</span>` + T.map(([id, l, t]) => `<button class="btn small ${S.tool === id ? 'on' : ''}" data-tool="${id}" title="${esc(t)}">${l}</button>`).join('') + `<span class="grow"></span>` + (site.boundary ? `<button class="btn small" data-act="fit" title="reset zoom">Fit</button>` : `<span class="row small"><label for="qw">W</label><input id="qw" class="num" type="number" value="6" step="0.5" min="1"><span>×</span><label for="qh">H</label><input id="qh" class="num" type="number" value="4" step="0.5" min="1"><span>m</span><button class="btn small primary" data-act="quicksite">Set the site</button></span>`) + `<button class="btn small" data-input="photo" title="shown under the plan to trace by hand">${ICON.photo} Photo</button><button class="btn small" data-input="address" title="reference only">${ICON.pin} Address</button>`;
  $('#site-hint').textContent = S.tool === 'select' || !T.some(t => t[0] === S.tool) ? (site.boundary ? 'Plan view, north up. Drag the tree marker or redraw the bed with the tools above.' : 'No geometry yet — set W × H, or draw the boundary.') : T.find(t => t[0] === S.tool)[2];
  $('#site-foot').innerHTML = `<span>${site.boundary ? `site ${G.round(B.w, 1)} × ${G.round(B.h, 1)} m` : 'no site geometry'}</span><span class="faint">·</span><span>${site.beds.length} bed${site.beds.length === 1 ? '' : 's'}</span><span class="faint">·</span><span>${site.features.length} feature${site.features.length === 1 ? '' : 's'}</span><span class="faint">·</span><span>scale <span class="tag ${esc(site.scale.status)}">${esc(site.scale.status)}</span></span><span class="grow"></span><span class="faint">Site boundary ≠ planting bed ≠ planting layout</span>`;
  const beds = site.beds.map(bd => `<div class="bedrow"><b style="font-weight:500;${S.bedId === bd.id ? 'color:var(--olive-deep)' : ''}" data-selbed="${esc(bd.id)}">${esc(bd.name)}</b><span>${bd.area_m2} m²</span><span class="tag ${esc(bd.status)}">${esc(bd.status === 'ai-suggested' ? 'suggested' : bd.status)}</span><span class="grow small faint">${esc(bd.source || '')}</span>${bd.status === 'ai-suggested' ? `<button class="btn small primary" data-acceptbed="${esc(bd.id)}">Accept this bed</button>` : ''}<button class="btn mini ghost" data-tool="bed" title="draw another bed">redraw</button><button class="btn mini ghost" data-rmbed="${esc(bd.id)}">remove</button></div>`).join('');
  $('#site-beds').innerHTML = `<h3>Planting beds <span class="n">${site.beds.length}</span></h3>${beds || `<div class="small muted">No planting bed yet. ${site.boundary ? 'Suggest one from the site, or draw it with the Bed tool.' : 'Set the site first; a bed is then suggested as the site inset by 0.3 m.'}</div>`}${site.boundary ? `<div class="row" style="margin-top:8px"><button class="btn small" data-act="bedfromsite">+ bed from the site</button><button class="btn small" data-tool="bed">Draw a bed</button></div>` : ''}`;
  const ok = site.beds.length > 0; $('#to-intent').disabled = false; $('#to-intent-why').textContent = ok ? (site.beds.some(x => x.status === 'ai-suggested') ? 'the suggested bed is accepted when you generate — or accept it now' : '') : 'you can set the intent now; generation needs a planting bed';
}
function quickSite(w, h) { M.setBoundary(S.project, G.polygonFromRect(w, h), 'user-stated'); M.setScale(S.project, 'user-stated', Math.max(w, h), 'width × height typed (rectangle)'); M.say(S.project, 'sys', `site set to ${w} × ${h} m (typed; a rectangle is assumed — redraw with the Site tool for another shape)`); ensureSuggestions(); S.pz = { x: 0, y: 0, k: 1 }; unlock('site'); update(); }
function acceptBed(id) { M.acceptBed(S.project, id); S.bedId = id; M.say(S.project, 'sys', `${id} accepted`); unlock('intent'); update(); }
function rescale(f, known) { const p = S.project.site; const sc = pt => [G.round(pt[0] * f), G.round(pt[1] * f)]; if (p.boundary) p.boundary = p.boundary.map(sc); for (const b of p.beds) { b.polygon = b.polygon.map(sc); b.area_m2 = G.round(G.area(b.polygon)); } for (const ft of p.features) { if (ft.position_m) ft.position_m = sc(ft.position_m); if (ft.polygon) ft.polygon = ft.polygon.map(sc); if (ft.radius_m != null) ft.radius_m = G.round(ft.radius_m * f); } if (S.overlay) { S.overlay.x *= f; S.overlay.y *= f; S.overlay.w *= f; S.overlay.h *= f; } for (const v of S.project.versions) for (const pl of v.plant_objects) pl.position_m = sc(pl.position_m); M.setScale(S.project, 'user-calibrated', known, `two points on the canvas = ${known} m`); M.say(S.project, 'sys', `calibrated: ×${G.round(f, 3)} — the site is now ${G.round(G.bbox(p.boundary || p.beds[0]?.polygon || [[0, 0], [1, 1]]).w, 1)} m wide; plant positions were scaled with the geometry (regenerate to re-space them)`); S.pz = { x: 0, y: 0, k: 1 }; }

// ------------------------------------------------------------------ 3 · intent
function renderIntent() {
  const p = S.project, b = p.brief; const bd = bed();
  const vals = Object.keys(VAL).map(k => { const lv = b.values[k] || 0; const ef = VAL_EFFECT[k]; return `<div class="vrow"><div><div class="l">${VAL[k]}</div><div class="effect ${ef.on ? '' : 'none'}">${lv ? (ef.on ? `→ ${esc(ef.on)}` : esc(ef.off)) : (ef.on ? esc(ef.on) : esc(ef.off))}</div></div><div class="seg" role="radiogroup" aria-label="${VAL[k]}">${LEVELS.map((l, i) => `<button role="radio" aria-checked="${lv === i}" class="${lv === i ? 'on' : ''}" data-value="${k}" data-level="${i}">${l}</button>`).join('')}</div></div>`; }).join('');
  const fns = b.functions.map((f, i) => `<div class="fn"><span class="sym">${esc(FN_SHORT[f.function]?.[0] || 'Z')}</span><span><b style="font-weight:500">${esc(FN_SHORT[f.function] || f.function)}</b> <span class="where">· ${esc(f.where.replace('-', ' '))}${f.alternative ? ' · alternative to check' : ''}</span><div class="small faint">${esc(f.basis)}</div></span><span class="grow"></span><button class="btn mini ghost" data-rmfn="${i}" title="remove">remove</button></div>`).join('') || '<div class="small faint">none yet — say "privacy along the fence" or add one below</div>';
  const addFn = `<div class="row wrap" style="margin-top:8px"><select id="addfn" aria-label="add a spatial function"><option value="">+ spatial function…</option>${S.K.d.functions.map(f => `<option value="${esc(f.id)}">${esc(f.label)}</option>`).join('')}</select><select id="addfnwhere" aria-label="where"><option value="north-edge">north edge</option><option value="south-edge">south edge</option><option value="east-edge">east edge</option><option value="west-edge">west edge</option><option value="boundary">outer boundary</option><option value="bed-interior">bed interior</option></select></div>`;
  const hard = b.hard_constraints.map(c => `<div class="fact"><span class="k">${esc(c.kind.replace('-', ' '))}</span><span class="v">${esc(c.text)}<span class="src">${esc(c.evidence)}</span></span></div>`).join('') || '<div class="small faint">none</div>';
  const unk = b.unknowns.map(u => `<div class="fact"><span class="k">unknown</span><span class="v">${esc(u)}</span></div>`).join('');
  $('#brief-left').innerHTML = `<div class="card"><h3>What matters <span class="n">${b.provenance ? esc(b.provenance) : 'nothing read yet'}</span></h3><div class="values">${vals}</div></div><div class="card" style="margin-top:14px"><h3>Spatial functions <span class="n">from the Z vocabulary</span></h3>${fns}${addFn}</div><div class="card" style="margin-top:14px"><h3>Must not change</h3>${hard}${unk ? `<h3 style="margin-top:12px">Unknown — not assumed</h3>${unk}` : ''}</div>`;
  const wantScreen = b.functions.some(f => ['z:screen', 'z:scrim'].includes(f.function) && !f.alternative); const accent = !!(b.values.ecology || b.values.seasonal_interest);
  const ops = [['along_edge', 'Row along an edge', 'screen species in a line inside the edge named by the brief; spacing from the claimed mature spread', wantScreen], ['stagger', 'Staggered second row', 'a second, offset row behind the first where the bed is deep enough; the taller species in front', wantScreen && S.stagger], ['fill_drift', 'Ground drifts', 'a jittered hexagonal lattice over the remaining bed; species by a low-frequency noise field', true], ['repeat_accent', 'Repeated accent', 'every fourth ground position toward the open side becomes the accent species', accent]];
  let cand = '';
  if (bd) { const a = E.assemble(p, S.K, bd); const chips = (l, role) => l.map(r => `<span class="chip click" data-species="${esc(r.id)}" title="${esc(r.why.join(' · '))}"><svg viewBox="-1.1 -1.1 2.2 2.2"><g>${R.symbol(R.form(S.K, r.id, p.site.conditions.light?.value), r.id, 1, 'present', { k: 8 })}</g></svg><i class="sci">${esc(r.name)}</i><small>${role} · gate ${esc(r.gate.overall)}</small></span>`).join(''); cand = `<div class="card" style="margin-top:14px"><h3>Candidates for ${esc(bd.name)} <span class="n">checked against the stated conditions</span></h3>${chips(a.picks.screen, 'screen')}${chips(a.picks.ground, 'ground')}${chips(a.picks.accent, 'accent')}${chips(a.picks.canopy, 'canopy')}${a.rows.filter(r => r.excluded).length ? `<details><summary>excluded (${a.rows.filter(r => r.excluded).length})</summary>${a.rows.filter(r => r.excluded).map(r => `<div class="why small"><i class="sci">${esc(r.name)}</i> — ${esc(r.excluded)}</div>`).join('')}</details>` : ''}<div class="small faint" style="margin-top:6px">Gates on unknown conditions read "unknown", never "pass". Click a species for its evidence after generating.</div></div>`; }
  const lastAi = [...p.conversation].reverse().find(m => m.role === 'ai');
  $('#brief-right').innerHTML = `<div class="card"><h3>How the garden will be composed <span class="n">operators the engine implements</span></h3><div class="ops">${ops.map(([id, l, t, on]) => `<div class="op ${on ? '' : 'off'}"><b>${l}</b>${t}${on ? '' : '<div class="faint" style="margin-top:3px">not used with this brief</div>'}</div>`).join('')}</div><div style="margin-top:10px"><div class="ctrl"><span>density</span><input type="range" min="0.6" max="1.4" step="0.1" value="${S.density}" id="density" aria-label="planting density"><span class="mono">${S.density}×</span></div><div class="ctrl"><span>second row</span><span class="seg"><button class="${S.stagger ? 'on' : ''}" data-stagger="1">on</button><button class="${S.stagger ? '' : 'on'}" data-stagger="0">off</button></span><span class="small faint">where the bed is deep enough</span></div><div class="ctrl"><span>seed</span><input class="num" type="number" id="seed" value="${S.seed}" aria-label="random seed"><span class="small faint">same seed, same garden</span></div></div><div class="small faint" style="margin-top:8px">Grouping, rhythm and edge response beyond these four operators are not implemented; the brief records them as composition notes only.</div></div>${cand}<div class="card" style="margin-top:14px"><h3>Change the brief in words</h3><form class="mini-composer" id="intent-form"><textarea id="say2" placeholder='e.g. "Ecology matters more than privacy", "privacy along the east edge", "it is shady"' aria-label="change the brief in words"></textarea><button class="btn primary small" type="submit">Send</button></form>${lastAi ? `<div class="log"><div class="msg ai">${lastAi.html || esc(lastAi.text)}${lastAi.mode ? `<div class="m">${esc(lastAi.mode)}</div>` : ''}</div></div>` : ''}</div>`;
  $('#generate').disabled = !bd; $('#generate').textContent = cur() ? 'Regenerate my garden' : 'Generate my garden'; $('#generate-why').innerHTML = bd ? (p.site.scale.status === 'unknown' ? 'scale is unknown — the result is conceptual, not measured' : '') : 'needs a planting bed — <a href="#s-site" data-stage-link="site">back to the site</a>';
}

// ------------------------------------------------------------------ 4 · the garden gate (document) and the garden stage (viewport)
function renderGate() {
  const v = cur(); const sec = $('#s-gate'); if (!v) { sec.hidden = true; return; } sec.hidden = false;
  $('#gate-lede').textContent = `${v.plant_objects.length} plants of ${v.schedule.length} species in ${esc(bed()?.name || 'the bed')} — version ${v.id}, ${S.project.versions.length} version${S.project.versions.length === 1 ? '' : 's'} so far. Open the garden to explore it in plan, presentation and 3D, and to refine it.`;
  const svg = planSvg(S.project, v).replace(/ width="[\d.]+" height="[\d.]+"/, ' preserveAspectRatio="xMidYMid meet"'); $('#gate-thumb').innerHTML = svg + '<div class="over"></div>';
}
const TOOLS_G = [['select', 'Select · lasso', 'click a plant for its evidence · drag a plant to move it · drag on empty ground to circle a region · wheel to zoom · right-drag or Space-drag to pan'], ['add', 'Add plant', 'pick a species, then click inside the bed']];
function setTool(t) { S.tool = t; S.draft = []; S.calib = []; if (S.stage === 'garden') renderGarden(); else update(); }
function setMode(m) { S.mode = m; if (S.stage === 'garden') renderGarden(); }
function renderGarden() {
  const p = S.project, v = cur(); if (!v || S.stage !== 'garden') return; const shown = S.preview ? S.preview.version : v;
  $('#gtop').innerHTML = `<a class="wordmark" href="#s-welcome" data-stage-link="welcome" title="back to the start (the project is kept)">Planting Intelligence</a><span class="crumbs"><button class="btn ghost small" data-stage-link="site">← Site</button><button class="btn ghost small" data-stage-link="intent">← Intent</button></span><span class="vlabel">${esc(v.label)} · ${shown.plant_objects.length} plants · ${M.schedule(shown).length} species · ${p.versions.length} version${p.versions.length === 1 ? '' : 's'}${S.preview ? ' · preview' : ''}</span><span class="right"><button class="btn ghost small" id="undo" ${v.parent_version_id ? '' : 'disabled'} title="undo (⌘Z)">Undo</button><button class="btn ghost small" id="redo" ${p.redo.length ? '' : 'disabled'} title="redo (⇧⌘Z)">Redo</button><button class="btn small" id="export" title="model JSON · plan SVG · schedule CSV · assumptions MD — same ids and counts in all">Export</button></span>`;
  $('#gtools').innerHTML = (S.mode === 'garden' ? `<button class="btn" data-mode="plan" title="direct editing needs the plan">Edit in plan</button>` : TOOLS_G.map(([id, l, t]) => `<button class="btn ${S.tool === id ? 'on' : ''}" data-tool="${id}" title="${esc(t)}">${l}</button>`).join('') + (S.tool === 'add' ? `<div class="sep"></div><div style="max-width:240px;padding:4px 6px">${S.K.species.map(s => `<span class="chip click ${S.addSpecies === s.id ? 'on' : ''}" data-addsp="${esc(s.id)}"><svg viewBox="-1.1 -1.1 2.2 2.2"><g>${R.symbol(R.form(S.K, s.id, p.site.conditions.light?.value), s.id, 1, 'present', { k: 7 })}</g></svg><i class="sci">${esc(s.scientific_name)}</i></span>`).join('')}<div class="tiny faint" style="margin-top:4px">${S.addSpecies ? 'now click inside the bed' : 'pick a species'}</div></div>` : '') + `<div class="sep"></div><button class="btn ${S.showZones ? 'on' : ''}" data-act="zones" title="the spatial zones the brief produced (plan only)">Zones</button>`);
  $('#viewbar').innerHTML = [['plan', 'Plan', 'technical plan: outlines, labels, zones, grid'], ['present', 'Presentation', 'botanical symbols from the same objects'], ['garden', '3D garden', 'three.js: rotate, zoom, pan; click a plant']].map(([id, l, t]) => `<button class="btn" data-mode="${id}" class="${S.mode === id ? 'on' : ''}" title="${t}"></button>`.replace('class="btn" data-mode', `class="btn ${S.mode === id ? 'on' : ''}" data-mode`).replace('class="on"', '').replace('</button>', `${l}</button>`)).join('') + `<span class="sep"></span><button class="btn ${S.labels ? 'on' : ''}" data-act="labels" title="plant names">Names</button><button class="btn ${S.winter ? 'on' : ''}" data-act="winter" title="deciduous plants (from leaf-retention claims) shown bare — not a seasonal simulation">Winter</button>${S.mode === 'garden' ? `<button class="btn" data-act="frame" title="frame the site">Frame</button>` : `<button class="btn" data-act="fit" title="reset zoom">Fit</button>`}`;
  $('#legend').innerHTML = [...new Set(shown.plant_objects.map(o => o.species_id))].map(s => { const f = R.form(S.K, s, p.site.conditions.light?.value); const n = shown.plant_objects.filter(o => o.species_id === s).length; return `<span class="chip click ${S.selectedSpecies === s && S.evidenceOpen ? 'on' : ''}" data-species="${esc(s)}" title="${esc(S.K.common(s))} · ${esc(FORM_LABEL[f.kind] || f.kind)} — click for the evidence"><svg viewBox="-1.1 -1.1 2.2 2.2"><g>${R.symbol(f, s, 1, 'present', { k: 8 })}</g></svg><i class="sci">${esc(S.K.name(s))}</i><small>×${n}</small></span>`; }).join('');
  $('#cfoot').textContent = `${p.site.scale.status === 'unknown' ? 'scale unknown — conceptual' : `scale ${p.site.scale.status}`}${S.mode === 'garden' ? ' · 3D: stylised proxies, heights from claims or nominal' : S.mode === 'present' ? ' · presentation: symbols from the objects, silhouettes illustrative' : ''}`;
  // banner: stale site, or preview state
  const stale = p.ui.site_fp && p.ui.site_fp !== siteFp(); const ban = $('#banner');
  if (S.preview) { ban.hidden = false; ban.innerHTML = `<span><b>Preview.</b> Red = to be removed, green ring = added, in every view.</span><button class="btn small primary" data-act="apply">Apply</button><button class="btn small" data-act="cancel">Cancel</button>`; }
  else if (stale) { ban.hidden = false; ban.innerHTML = `<span>The site or its conditions changed after this design was generated.</span><button class="btn small primary" data-act="regenerate">Regenerate</button><button class="btn small ghost" data-act="dismiss-stale">Keep as is</button>`; }
  else ban.hidden = true;
  // composer
  const gc = $('#gcomposer'); gc.classList.toggle('closed', !S.composerOpen); document.body.classList.toggle('composer-open', S.composerOpen);
  const hint = S.preview ? 'a preview is waiting — apply or cancel it first' : S.selection ? `selection: ${G.round(G.area(S.selection.polygon), 1)} m², ${v.plant_objects.filter(o => G.pointInPolygon(o.position_m, S.selection.polygon)).length} plants — say what should change here` : 'say what should change — circle an area first to narrow it';
  const log = p.conversation.slice(-8).map(m => `<div class="msg ${m.role}">${m.html || esc(m.text)}${m.mode ? `<div class="m">${esc(m.mode)}</div>` : ''}</div>`).join('');
  gc.innerHTML = `<div class="pill" data-act="toggle-composer" role="button" tabindex="0" aria-expanded="${S.composerOpen}"><span class="ic">✎</span><span class="hint">${S.composerOpen ? 'Conversation' : esc(hint)}</span><span class="x">${S.composerOpen ? '▾' : '▴'}</span></div><div class="sheet"><div class="glog" id="glog">${log}</div><form id="gform"><textarea id="say3" placeholder="e.g. the right side feels too crowded · replace salal with kinnikinnick here · move the taller plants away from the tree" aria-label="say what should change"></textarea><div class="foot"><button class="btn small primary" type="submit">Send</button><span class="hint">${esc(hint)}</span></div></form></div>`;
  if (S.composerOpen) { const gl = $('#glog'); gl.scrollTop = gl.scrollHeight; }
  // revision card
  const rev = $('#revision'); const showRev = !!(S.preview || S.selection);
  rev.hidden = !showRev;
  if (showRev) {
    if (S.preview) { const pv = S.preview, d = pv.diff, cmd = S.pendingCmd; rev.innerHTML = `<h3>Proposed change</h3><div class="small muted">“${esc(cmd.utterance)}”</div><div class="diff"><span>scope: ${esc(cmd.scope.kind)}</span><span>${pv.targets.length} inside</span><span class="rm">−${d.removed.length}</span><span class="add">+${d.added.length}</span><span class="chg">~${d.changed.length}</span><span>→ ${d.count_after} plants</span></div>${cmd.operations.filter(o => o.amount).map((o, i) => `<div class="ctrl"><span>amount</span><input type="range" min="0.05" max="0.8" step="0.05" value="${o.amount.value}" data-amount="${i}" aria-label="amount"><span class="mono">${Math.round(o.amount.value * 100)} %</span></div><div class="tiny faint">${esc(o.amount.basis)}</div>`).join('')}<ul>${pv.notes.map(n => `<li>${esc(n)}</li>`).join('')}${pv.refused.map(n => `<li class="warn">${esc(n)}</li>`).join('')}${pv.untouched_outside_scope ? '<li>nothing outside the scope moved</li>' : `<li class="warn">${pv.outside_changed.length} outside objects changed</li>`}${pv.screen_continuity.after.map((z, i) => `<li>${esc(z.label)}: continuity ${pv.screen_continuity.before[i]?.continuity ?? '—'} → ${z.continuity} (geometric proxy; privacy not guaranteed)</li>`).join('')}</ul><div class="btns"><button class="btn primary" data-act="apply">Apply</button><button class="btn" data-act="cancel">Cancel</button></div>`; }
    else { const n = v.plant_objects.filter(o => G.pointInPolygon(o.position_m, S.selection.polygon)).length; rev.innerHTML = `<h3>Selected region</h3><div class="small muted">${G.round(G.area(S.selection.polygon), 1)} m² · ${n} plant${n === 1 ? '' : 's'} inside · ${esc(S.selection.source)}</div><p class="small" style="margin:8px 0 0">Say what should change here — <i>too dense here, but keep the privacy</i> · <i>remove the ferns here</i> · <i>fill this in</i>. Nothing outside the region will move.</p><div class="btns"><button class="btn small primary" data-act="open-composer">Describe the change</button><button class="btn small" data-act="clear-selection">Clear</button></div>`; }
  }
  renderPlantCard(); renderEvidence(); renderDrawer(); document.body.classList.toggle('right-open', !!S.drawer);
  renderCanvas();
}
function renderPlantCard() {
  const card = $('#plantcard'); const v = S.preview ? S.preview.version : cur(); const p = S.selectedPlant && v ? v.plant_objects.find(x => x.id === S.selectedPlant) || cur()?.plant_objects.find(x => x.id === S.selectedPlant) : null;
  if (!p || S.stage !== 'garden') { card.hidden = true; return; }
  const f = R.form(S.K, p.species_id, S.project.site.conditions.light?.value); const fnId = p.role === 'screen' || p.role === 'screen-layer' ? 'z:screen' : 'z:ground_cover'; const fs = S.K.functionSupport(p.species_id, fnId);
  card.classList.toggle('below', !$('#revision').hidden);
  card.innerHTML = `<div class="head"><svg viewBox="-1.15 -1.15 2.3 2.3"><g>${R.symbol(f, p.species_id, 1, 'present', { k: 20 })}</g></svg><div class="grow"><h3><i class="sci">${esc(S.K.name(p.species_id))}</i></h3><div class="faint small">${esc(S.K.common(p.species_id))} · ${esc(f.growth_form)} · <span class="mono">${esc(p.id)} · ${esc(p.role)}</span></div></div><button class="btn mini ghost x" data-act="closecard" aria-label="close">✕</button></div><div class="small" style="margin-top:8px">crown r ${p.proxy_radius_m} m · ${p.height_m != null ? `height ≈ ${p.height_m} m` : 'height unknown (drawn nominal)'} · ${f.evergreen === true ? 'evergreen' : f.evergreen === false ? 'deciduous' : 'leaf retention ' + (f.evergreen === 'mixed' ? 'mixed claims' : 'not recorded')} · at ${p.position_m.join(', ')} m</div><div class="small" style="margin-top:6px">${fnId === 'z:screen' ? 'Screen' : 'Ground Cover'}: <span class="tag ${esc(fs.status)}">${esc(fs.status)}</span>${fs.conflict ? '<span class="tag conflict">conflict</span>' : ''} <span class="tag ${esc(fs.verification || 'none')}">${esc(fs.verification || 'none')}</span></div><div class="small faint" style="margin-top:6px">${esc(f.basis.illustrative)}</div><div class="row" style="margin-top:10px"><button class="btn small" data-act="evidence">Full evidence</button>${S.mode !== 'garden' ? '<button class="btn small" data-act="focus3d">See in 3D</button>' : ''}<button class="btn small danger" data-act="delsel">Delete</button></div>`;
  card.hidden = false;
}
function renderEvidence() {
  const el = $('#evidence'); if (!S.evidenceOpen || S.stage !== 'garden') { el.hidden = true; return; }
  const v = cur(); const pl = S.selectedPlant && v ? ((S.preview?.version.plant_objects || v.plant_objects).find(x => x.id === S.selectedPlant) || v.plant_objects.find(x => x.id === S.selectedPlant)) : null; const sid = pl ? pl.species_id : S.selectedSpecies;
  if (!sid) { el.hidden = true; return; }
  el.innerHTML = `<button class="btn mini ghost x" data-act="close-evidence" aria-label="close">✕</button>${pl ? `<div class="small faint">${esc(pl.id)} · position ${pl.position_m.join(', ')} m · ${esc(pl.origin)} · group ${esc(pl.group_id)} · zone ${esc(pl.zone_id || '—')}</div>` : ''}${R.evidenceHtml(sid, S.K, S.project, pl)}`; el.hidden = false;
}
function renderDrawer() {
  const v = cur(); const shown = S.preview ? S.preview.version : v; const tab = $('#drawer-tab'); const dr = $('#drawer');
  tab.innerHTML = `<button class="btn small" data-act="toggle-drawer" aria-expanded="${!!S.drawer}">${S.drawer ? 'Close' : `Plants ${shown.plant_objects.length} · versions ${S.project.versions.length} · assumptions`}</button>`;
  dr.hidden = !S.drawer; if (!S.drawer) return;
  const tabs = [['schedule', `Plant schedule (${M.schedule(shown).length})`], ['versions', `Versions (${S.project.versions.length})`], ['assumptions', 'Evaluation · assumptions'], ['model', 'Model JSON']];
  const body = S.drawer === 'schedule' ? (S.preview ? '<div class="note">preview schedule — becomes real on Apply</div>' : '') + R.scheduleHtml(shown ? { ...shown, schedule: M.schedule(shown) } : null, S.K, S.project) : S.drawer === 'versions' ? R.versionsHtml(S.project, S.K, M.diff) : S.drawer === 'assumptions' ? R.assumptionsHtml(shown, S.project) : `<pre class="mono" style="white-space:pre-wrap;margin:0">${esc(JSON.stringify({ site: S.project.site, brief: S.project.brief, current_version: v ? { id: v.id, parent: v.parent_version_id, seed: v.seed, plants: v.plant_objects.length, schedule: v.schedule } : null }, null, 1).slice(0, 6000))}</pre>`;
  dr.innerHTML = `<div class="head">${tabs.map(([id, l]) => `<button class="btn ${S.drawer === id ? 'on' : ''}" data-drawer="${id}">${l}</button>`).join('')}<span class="grow"></span><span class="small faint">${esc(v.id)} · ${esc(v.geometry_precision)}</span><button class="btn mini ghost" data-act="toggle-drawer" aria-label="close the drawer">✕</button></div><div class="body">${body}</div>`;
}

// ------------------------------------------------------------------ the canvas (one SVG, two homes)
function renderCanvas() {
  const svg = $('#svg'); const v = cur();
  if (S.stage === 'garden' && S.mode === 'garden') {
    svg.style.display = 'none'; $('#gl').style.display = 'block';
    if (!S.garden && !S.gardenError) { if (!S.gardenLoading) { S.gardenLoading = import('./garden3d.js').then(({ Garden }) => { S.garden = new Garden($('#gl'), { K: S.K, onSelect: id => { S.selectedPlant = id; renderPlantCard(); renderEvidence(); if (S.garden) S.garden.sync(S.project, cur(), S); }, onHover: (id, e) => hoverTip(id, e) }); S.garden.sync(S.project, cur(), S); }).catch(e => { S.gardenError = e.message; renderCanvas(); }); } }
    else if (S.garden) { S.garden.setVisible(true); S.garden.sync(S.project, v, S); }
    if (S.gardenError) $('#gl').innerHTML = `<div class="note warn" style="margin:120px auto;max-width:520px">The 3D garden could not start: ${esc(S.gardenError)}. WebGL is needed; the plan and presentation stay fully usable.</div>`;
    return;
  }
  svg.style.display = 'block'; $('#gl').style.display = 'none'; if (S.garden) S.garden.setVisible(false);
  svg.className.baseVal = `tool-${S.tool}`;
  if (S.stage === 'garden') { const right = !$('#revision').hidden || !$('#plantcard').hidden || !$('#evidence').hidden; S.inset = { l: 150, r: right ? 400 : 70, t: 104, b: S.drawer ? Math.round(innerHeight * .46) : 150 }; if (innerWidth < 760) S.inset = { l: 16, r: 16, t: 110, b: right || S.drawer ? Math.round(innerHeight * .5) : 110 }; }
  else S.inset = { l: 28, r: 28, t: 44, b: 44 };
  if (S.stage !== 'garden') { S.mode = 'plan'; }
  S.T = R.render2D(svg, S.project, v, S, S.K);
}
function hoverTip(id, e) { const tip = $('#tip'); if (!id) { tip.style.display = 'none'; return; } const v = S.preview ? S.preview.version : cur(); const p = v?.plant_objects.find(p => p.id === id); if (!p) return; tip.innerHTML = `<i>${esc(S.K.name(p.species_id))}</i><div class="m">${esc(p.id)} · ${esc(p.role)} · r ${p.proxy_radius_m} m · ${p.height_m != null ? `h ≈ ${p.height_m} m` : 'height unknown (nominal)'} · click for evidence</div>`; tip.style.display = 'block'; tip.style.left = `${e.clientX + 14}px`; tip.style.top = `${e.clientY + 12}px`; }
function initCanvas() {
  const svg = $('#svg'); const tip = $('#tip'); const mpos = ev => { const r = svg.getBoundingClientRect(); return S.T ? S.T.toM([ev.clientX - r.left, ev.clientY - r.top]) : null; }; let space = false;
  svg.addEventListener('mousemove', ev => { const t = ev.target.closest('[data-tip]'); if (t && !S.drag) { tip.innerHTML = t.dataset.tip; tip.style.display = 'block'; tip.style.left = `${ev.clientX + 14}px`; tip.style.top = `${ev.clientY + 12}px`; } else tip.style.display = 'none'; });
  svg.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  svg.addEventListener('contextmenu', ev => ev.preventDefault());
  // wheel: in the garden stage the canvas owns the wheel (zoom); in the document it only zooms with ⌘ / Ctrl (pinch), so the page keeps scrolling
  svg.addEventListener('wheel', ev => { if (S.stage !== 'garden' && !(ev.ctrlKey || ev.metaKey)) return; ev.preventDefault(); const r = svg.getBoundingClientRect(); const mx = ev.clientX - r.left, my = ev.clientY - r.top; const k0 = S.pz.k, k1 = Math.max(.35, Math.min(8, k0 * Math.exp(-ev.deltaY * .0015))); S.pz = { x: mx - (mx - S.pz.x) * k1 / k0, y: my - (my - S.pz.y) * k1 / k0, k: k1 }; renderCanvas(); }, { passive: false });
  svg.addEventListener('pointerdown', ev => {
    const m = mpos(ev); if (!m) return;
    if (ev.button === 2 || ev.button === 1 || space) { S.drag = { pan: true, x: ev.clientX, y: ev.clientY, px: S.pz.x, py: S.pz.y }; svg.classList.add('panning'); svg.setPointerCapture(ev.pointerId); return; }
    if (S.tool === 'select') {
      const pl = ev.target.closest('[data-plant]');
      if (pl && cur() && !S.preview && S.stage === 'garden') { const p = cur().plant_objects.find(p => p.id === pl.dataset.plant); if (p && !p.locked) { S.drag = { id: p.id, start: m, from: [...p.position_m], moved: false }; svg.setPointerCapture(ev.pointerId); } S.selectedPlant = pl.dataset.plant; renderPlantCard(); renderEvidence(); renderCanvas(); return; }
      if (pl) { S.selectedPlant = pl.dataset.plant; renderPlantCard(); renderEvidence(); renderCanvas(); return; }
      const bd = ev.target.closest('[data-bed]'); if (bd) { S.bedId = bd.dataset.bed; S.selectedPlant = null; update(); return; }
      if (S.stage !== 'garden' || !cur()) return;   // lasso only means something over a design
      S.lasso = [m]; S.drag = { lasso: true }; svg.setPointerCapture(ev.pointerId); return;
    }
    if (S.tool === 'site' || S.tool === 'bed' || S.tool === 'open') { S.draft.push(G.roundPt(m)); renderCanvas(); return; }
    if (S.tool === 'tree') { const id = M.addFeature(S.project, { kind: 'existing-tree', position_m: G.roundPt(m), radius_m: null, label: 'existing tree', source: 'placed on the canvas', status: 'user-drawn' }); M.say(S.project, 'sys', `existing tree ${id} placed at ${G.roundPt(m).join(', ')} m — canopy radius assumed 1.5 m until you set it`); setTool('select'); return; }
    if (S.tool === 'calibrate') { S.calib.push(m); if (S.calib.length === 2) { const d = G.dist(S.calib[0], S.calib[1]); const real = parseFloat(prompt(`Real distance between the two points (the drawing measures ${G.round(d)} m now)?`, G.round(d))); if (real > 0 && d > 0) rescale(real / d, real); S.calib = []; setTool('select'); update(); } return; }
    if (S.tool === 'add') { if (!S.addSpecies) { M.say(S.project, 'sys', 'pick a species first'); renderGarden(); return; } const v = cur(); if (!v) return; const r = E.directEdit(S.project, S.K, v, { kind: 'add', species_id: S.addSpecies, at: m }); if (r?.version) { M.commitVersion(S.project, r.version); M.say(S.project, 'sys', r.notes.join('; ')); update(); } return; }
  });
  svg.addEventListener('pointermove', ev => { if (!S.drag) return; if (S.drag.pan) { S.pz.x = S.drag.px + ev.clientX - S.drag.x; S.pz.y = S.drag.py + ev.clientY - S.drag.y; renderCanvas(); return; } const m = mpos(ev); if (!m) return; if (S.drag.lasso) { if (G.dist(m, S.lasso[S.lasso.length - 1]) > 0.06 / S.pz.k) { S.lasso.push(m); renderCanvas(); } return; } S.drag.moved = true; const v = cur(); const p = v.plant_objects.find(p => p.id === S.drag.id); p.position_m = m; renderCanvas(); });
  svg.addEventListener('pointerup', ev => {
    if (!S.drag) return; const d = S.drag; S.drag = null; svg.classList.remove('panning');
    if (d.pan) return;
    if (d.lasso) { const poly = S.lasso; S.lasso = []; if (poly.length > 4 && G.area(poly) > 0.1) { S.selection = { id: `lasso-${S.project.versions.length}-${Date.now().toString(36).slice(-4)}`, polygon: poly.map(G.roundPt), source: 'drawn on the canvas' }; S.scope = null; S.preview = null; S.selectedPlant = null; S.composerOpen = true; setTimeout(() => $('#say3')?.focus(), 50); } else { S.selection = null; S.selectedPlant = null; } renderGarden(); return; }
    const v = cur(); const p = v.plant_objects.find(p => p.id === d.id); const to = [...p.position_m]; p.position_m = d.from;
    if (d.moved && G.dist(to, d.from) > 0.05) { const r = E.directEdit(S.project, S.K, v, { kind: 'move', id: d.id, to }); if (r?.version) { M.commitVersion(S.project, r.version); M.say(S.project, 'sys', r.notes.join('; ')); } }
    update();
  });
  svg.addEventListener('dblclick', () => closeDraft());
  document.addEventListener('keydown', ev => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(ev.target.tagName)) return;
    if (ev.code === 'Space' && S.stage === 'garden') { space = true; ev.preventDefault(); }
    if (ev.key === 'Enter' && S.draft.length) closeDraft();
    if (ev.key === 'Escape') { if (S.evidenceOpen) { S.evidenceOpen = false; renderGarden(); return; } S.draft = []; S.calib = []; if (S.preview) cancelPreview(); else if (S.selection || S.selectedPlant) { S.selection = null; S.selectedPlant = null; update(); } else if (S.drawer) { S.drawer = null; renderGarden(); } else if (S.composerOpen) { S.composerOpen = false; renderGarden(); } }
    if (S.stage !== 'garden') return;
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && S.selectedPlant && cur()) { const r = E.directEdit(S.project, S.K, cur(), { kind: 'delete', id: S.selectedPlant }); if (r?.version) { M.commitVersion(S.project, r.version); M.say(S.project, 'sys', r.notes.join('; ')); S.selectedPlant = null; update(); } }
    if ((ev.metaKey || ev.ctrlKey) && ev.key === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); }
    if (ev.key === '1') setMode('plan'); if (ev.key === '2') setMode('present'); if (ev.key === '3') setMode('garden');
  });
  document.addEventListener('keyup', ev => { if (ev.code === 'Space') space = false; });
  new ResizeObserver(() => { if (S.stage === 'site' || S.stage === 'garden') renderCanvas(); }).observe($('#site-canvas-body'));
  new ResizeObserver(() => { if (S.stage === 'garden') renderCanvas(); }).observe($('#stage'));
}
function closeDraft() {
  if (S.draft.length < 3) return; const poly = S.draft.slice(); S.draft = [];
  if (S.tool === 'site') { M.setBoundary(S.project, poly, 'user-drawn'); if (S.project.site.scale.status === 'unknown') M.setScale(S.project, 'user-drawn', null, 'drawn on the canvas at the canvas scale — calibrate to make it measured'); M.say(S.project, 'sys', `site boundary drawn: ${G.round(G.area(poly), 1)} m² at the canvas scale (${S.project.site.scale.status}) — calibrate a known length to make it measured`); ensureSuggestions(); }
  else if (S.tool === 'bed') { const id = M.addBed(S.project, poly, 'user-drawn', null, 'drawn on the canvas'); S.bedId = id; M.say(S.project, 'sys', `${id} drawn: ${G.round(G.area(poly), 1)} m²`); unlock('intent'); }
  else if (S.tool === 'open') { M.addFeature(S.project, { kind: 'no-plant-zone', polygon: poly, label: 'open (no-plant)', source: 'drawn on the canvas', status: 'user-drawn' }); M.say(S.project, 'sys', `no-plant zone drawn: ${G.round(G.area(poly), 1)} m²`); }
  S.tool = 'select'; update();
}

// ------------------------------------------------------------------ export (unchanged)
function download(name, text, type = 'application/json') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
export function exportBundle() {
  const p = S.project, v = cur(); const base = (p.name || 'design').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const json = JSON.stringify({ exported: new Date().toISOString(), schema: p.schema, knowledge_snapshot: p.knowledge_snapshot, site: p.site, brief: p.brief, current_version_id: p.current_version_id, versions: p.versions, inputs: p.inputs }, null, 1);
  const svg = v ? planSvg(p, v) : null;
  const csv = v ? 'species_id,scientific_name,count,roles,proxy_radius_m,proxy_claim,site_gate\n' + v.schedule.map(r => { const pl = v.plant_objects.find(x => x.species_id === r.species_id); const g = S.K.gate(r.species_id, p.site.conditions, { maintenance_low: !!p.brief.values.maintenance_low }).overall; return [r.species_id, S.K.name(r.species_id), r.count, r.roles.join('|'), pl.proxy_radius_m, pl.proxy_source?.claim || '', g].map(x => `"${String(x).replace(/"/g, '""')}"`).join(','); }).join('\n') + `\n"total","",${v.plant_objects.length},"","","",""\n` : null;
  const md = v ? `# ${p.name} — design ${v.id}\n\nExported ${new Date().toISOString()} · knowledge snapshot ${p.knowledge_snapshot?.generated} (${p.knowledge_snapshot?.method}) · geometry ${v.geometry_precision} · ${v.plant_objects.length} plant objects, ${v.schedule.length} species · seed ${v.seed} · operators ${v.generator.operators.join(', ')}\n\n## Site\n- boundary: ${p.site.boundary ? `${p.site.boundary_status}, ${G.round(G.area(p.site.boundary), 1)} m²` : 'none'}; scale: ${p.site.scale.status}${p.site.scale.known_length_m ? ` (${p.site.scale.known_length_m} m)` : ''}\n- conditions: ${Object.entries(p.site.conditions).map(([k, c]) => `${k} = ${c.value ?? 'unknown'} (${c.status})`).join('; ')}\n- features: ${p.site.features.map(f => `${f.label || f.kind} (${f.status || 'drawn'})`).join('; ') || 'none'}\n- beds: ${p.site.beds.map(b => `${b.name} ${b.area_m2} m² (${b.status})`).join('; ')}\n\n## Brief\n- values: ${Object.entries(p.brief.values).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}\n- functions: ${p.brief.functions.map(f => `${f.function} @ ${f.where}`).join('; ') || 'none'}\n- hard constraints: ${p.brief.hard_constraints.map(c => c.text).join('; ')}\n- unknown: ${p.brief.unknowns.join('; ') || 'none'}\n\n## Assumptions\n${v.assumptions.map(a => `- ${a}`).join('\n')}\n- drawings: silhouettes, stems and shading in the presentation plan and the 3D garden are illustrative proxies; growth form, crown radius, height, leaf retention and colour words come from the claims\n\n## Unresolved\n${v.unresolved.map(a => `- ${a}`).join('\n') || '- none'}\n\n## Evaluation (measured on the model only)\n- bed area ${v.evaluation.bed_area_m2} m²; plants ${v.evaluation.plant_count}; species ${v.evaluation.species_count}\n${v.evaluation.edge_zones.map(z => `- ${z.label}: row cover ${z.screen_row_cover_m} / ${z.edge_length_m} m, continuity ${z.continuity} (geometric proxy)`).join('\n')}\n- cost: ${v.evaluation.cost_note}\n- ecology: ${v.evaluation.ecology_note}\n\n## Schedule\n${v.schedule.map(r => `- ${S.K.name(r.species_id)} × ${r.count} (${r.roles.join(', ')})`).join('\n')}\n\n## Versions\n${p.versions.map(x => `- ${x.id} ← ${x.parent_version_id || 'root'}: ${x.label} (${x.plant_objects.length} plants)`).join('\n')}\n` : null;
  return { base, json, svg, csv, md };
}
function exportAll() { const b = exportBundle(); download(`${b.base}-model.json`, b.json); if (b.svg) download(`${b.base}-plan.svg`, b.svg, 'image/svg+xml'); if (b.csv) download(`${b.base}-schedule.csv`, b.csv, 'text/csv'); if (b.md) download(`${b.base}-assumptions.md`, b.md, 'text/markdown'); M.say(S.project, 'sys', `exported ${b.svg ? '4 files: model JSON, plan SVG, schedule CSV, assumptions MD' : 'model JSON (no design yet)'} — same object ids and counts in all of them`); update(); }
export function planSvg(p, v) {
  const pts = [...(p.site.boundary || []), ...p.site.beds.flatMap(b => b.polygon)]; const B = G.bbox(pts); const k = 60, pad = 40; const W = B.w * k + 2 * pad, H = B.h * k + 2 * pad; const P = ([x, y]) => [pad + (x - B.minx) * k, H - pad - (y - B.miny) * k]; const poly = ps => ps.map(q => P(q).join(',')).join(' '); const light = p.site.conditions.light?.value;
  let h = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Helvetica, Arial, sans-serif" font-size="10"><rect width="100%" height="100%" fill="#fdfbf7"/><!-- ${esc(p.name)} · ${esc(v.id)} · exported ${new Date().toISOString()} · 1 m = ${k} px · ${esc(v.geometry_precision)} -->`;
  if (p.site.boundary) h += `<polygon points="${poly(p.site.boundary)}" fill="none" stroke="#5f5a52" stroke-dasharray="6 3"/>`;
  for (const b of p.site.beds) h += `<polygon points="${poly(b.polygon)}" fill="rgba(95,127,98,.08)" stroke="#5f7f62" data-bed="${esc(b.id)}"/>`;
  for (const f of p.site.features) h += f.polygon ? `<polygon points="${poly(f.polygon)}" fill="rgba(42,39,35,.05)" stroke="#9a948a" stroke-dasharray="3 3" data-feature="${esc(f.id)}"/>` : `<circle cx="${P(f.position_m)[0]}" cy="${P(f.position_m)[1]}" r="${(f.radius_m ?? 1.5) * k}" fill="rgba(68,96,74,.12)" stroke="#44604a" stroke-dasharray="2 3" data-feature="${esc(f.id)}"/>`;
  for (const pl of v.plant_objects) { const c = P(pl.position_m); const f = R.form(S.K, pl.species_id, light); h += `<g id="${esc(pl.id)}" data-species="${esc(pl.species_id)}" data-x="${pl.position_m[0]}" data-y="${pl.position_m[1]}" data-r="${pl.proxy_radius_m}" transform="translate(${c[0]} ${c[1]}) scale(${k})">${R.symbol(f, pl.id, pl.proxy_radius_m, 'plan', { k })}</g>`; }
  h += `<line x1="${pad}" y1="${H - 14}" x2="${pad + k}" y2="${H - 14}" stroke="#2a2723" stroke-width="2"/><text x="${pad}" y="${H - 18}">1 m (${esc(p.site.scale.status)})</text><text x="${W - pad}" y="${pad - 14}" text-anchor="end">N ↑</text>`;
  h += `<text x="${pad}" y="${pad - 14}" font-size="11">${esc(p.name)} · ${esc(v.id)} · ${v.plant_objects.length} plants · ${v.schedule.map(r => `${S.K.name(r.species_id)} ×${r.count}`).join(', ')}</text></svg>`; return h;
}

// ------------------------------------------------------------------ ui wiring
function newProject() { if (!confirm('Start a new project? The current one stays saved on the server (if running) but the local copy is replaced.')) return; M.clearLocal(); S.project = M.newProject(); ensureUi(S.project); S.project.knowledge_snapshot = S.K.snapshot; Object.assign(S, { bedId: null, selection: null, scope: null, preview: null, pendingCmd: null, selectedPlant: null, selectedSpecies: null, evidenceOpen: false, overlay: null, drawer: null, composerOpen: false, pz: { x: 0, y: 0, k: 1 } }); if (S.garden) S.garden.framed = false; for (const st of ['site', 'intent', 'gate']) $(`#s-${st}`).hidden = true; setStage('welcome'); update(); }
function addInput(kind) {
  if (kind === 'photo') $('#imgfile').click();
  else if (kind === 'address') { const a = prompt('Address (kept as a reference only — no map or site-data service is connected):'); if (a) { M.addInput(S.project, { type: 'address', role: 'context-reference', text: a, lookup_performed: false, note: 'no geocoding or site-data service is connected: reference only' }); M.say(S.project, 'sys', `address noted: "${a}" — reference only; nothing is inferred from it`); unlock('site'); if (S.stage === 'welcome') setStage('site'); update(); } }
  else if (kind === 'draw') { unlock('site'); setStage('site'); setTool('site'); update(); setTimeout(() => $('#site-canvas-body').scrollIntoView({ block: 'center' }), 400); }
  else if (kind === 'size') { unlock('site'); setStage('site'); update(); setTimeout(() => $('#qw')?.focus(), 500); }
}
function initUi() {
  $('#welcome-form').addEventListener('submit', async ev => { ev.preventDefault(); const t = $('#say0').value.trim(); if (!t) { unlock('site'); setStage('site'); update(); return; } $('#say0').value = ''; unlock('site'); await handleSay(t, { silent: true }); setStage('site'); update(); });
  $('#say0').addEventListener('keydown', ev => { if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); $('#welcome-form').requestSubmit(); } });
  $('#example').onclick = () => { $('#say0').value = EXAMPLE; $('#say0').focus(); };
  $('#newproj').onclick = newProject;
  $('#to-intent').onclick = () => { unlock('intent'); setStage('intent'); update(); };
  $('#generate').onclick = () => generate();
  $('#open-garden').onclick = () => setStage('garden'); $('#regen-gate').onclick = () => generate(); $('#gate-thumb').onclick = () => setStage('garden');
  $('#imgfile').addEventListener('change', ev => { const f = ev.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { const B = S.project.site.boundary ? G.bbox(S.project.site.boundary) : { minx: 0, miny: 0, w: 8 }; const w = B.w || 8; S.overlay = { src: rd.result, x: B.minx, y: B.miny, w, h: w * img.height / img.width, opacity: .5, show: true }; M.addInput(S.project, { type: 'image', role: 'visual-reference', name: f.name, geometry_precision: 'unknown', note: 'shown under the plan for tracing; automatic recognition is not implemented — draw beds and features over it, then calibrate a known length' }); M.say(S.project, 'sys', `image "${f.name}" added as a reference overlay (${img.width}×${img.height} px). No automatic interpretation: trace the boundary, beds and features with the tools, then Calibrate two points of known distance.`); unlock('site'); if (S.stage === 'welcome') setStage('site'); update(); }; img.src = rd.result; }; rd.readAsDataURL(f); ev.target.value = ''; });
  addEventListener('scroll', () => $('#top').classList.toggle('scrolled', scrollY > 8), { passive: true });
  document.body.addEventListener('submit', async ev => {
    if (ev.target.id === 'site-form' || ev.target.id === 'intent-form' || ev.target.id === 'gform') { ev.preventDefault(); const ta = ev.target.querySelector('textarea'); const t = ta.value; ta.value = ''; await handleSay(t); if (S.stage === 'garden') { S.composerOpen = !(S.preview && innerWidth < 760); renderGarden(); } }
  });
  document.body.addEventListener('keydown', ev => { if (ev.target.tagName === 'TEXTAREA' && ev.target.id !== 'say0' && ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); ev.target.form?.requestSubmit(); } });
  document.body.addEventListener('click', ev => {
    const t = ev.target.closest('[data-go],[data-stage-link],[data-input],[data-resume],[data-tool],[data-act],[data-mode],[data-drawer],[data-acceptbed],[data-rmbed],[data-selbed],[data-rmfeat],[data-addsp],[data-rmfn],[data-species],[data-version],[data-value],[data-stagger],#newproj2,#undo,#redo,#export'); if (!t) return;
    if (t.dataset.go || t.dataset.stageLink) { ev.preventDefault(); const st = t.dataset.go || t.dataset.stageLink; if (st === 'garden' && !cur()) return; setStage(st); update(); }
    else if (t.dataset.input) addInput(t.dataset.input);
    else if (t.dataset.resume) { setStage(cur() ? 'garden' : S.project.ui.unlocked.intent ? 'intent' : 'site'); update(); }
    else if (t.id === 'newproj2') newProject();
    else if (t.dataset.tool) setTool(t.dataset.tool);
    else if (t.dataset.mode) setMode(t.dataset.mode);
    else if (t.dataset.act) act(t.dataset.act, t);
    else if (t.dataset.drawer) { S.drawer = t.dataset.drawer; S.composerOpen = false; renderGarden(); }
    else if (t.dataset.acceptbed) acceptBed(t.dataset.acceptbed);
    else if (t.dataset.rmbed) { S.project.site.beds = S.project.site.beds.filter(b => b.id !== t.dataset.rmbed); S.bedId = S.project.site.beds[0]?.id || null; update(); }
    else if (t.dataset.selbed) { S.bedId = t.dataset.selbed; update(); }
    else if (t.dataset.rmfeat) { S.project.site.features = S.project.site.features.filter(f => f.id !== t.dataset.rmfeat); update(); }
    else if (t.dataset.addsp) { S.addSpecies = t.dataset.addsp; if (S.mode === 'garden') S.mode = 'plan'; S.tool = 'add'; renderGarden(); }
    else if (t.dataset.rmfn) { S.project.brief.functions.splice(+t.dataset.rmfn, 1); update(); }
    else if (t.dataset.species) { S.selectedSpecies = t.dataset.species; S.selectedPlant = null; if (S.stage === 'garden') { S.evidenceOpen = true; renderGarden(); } }
    else if (t.dataset.version) { S.project.current_version_id = t.dataset.version; S.project.redo = []; S.preview = null; update(); }
    else if (t.dataset.value) { const k = t.dataset.value, lv = +t.dataset.level; if (lv) S.project.brief.values[k] = lv; else delete S.project.brief.values[k]; S.project.brief.provenance = 'user-edited'; syncFunctionsFromValues(); update(); }
    else if (t.dataset.stagger !== undefined) { S.stagger = t.dataset.stagger === '1'; renderIntent(); }
    else if (t.id === 'undo') undo(); else if (t.id === 'redo') redo(); else if (t.id === 'export') exportAll();
  });
  document.body.addEventListener('keydown', ev => { const t = ev.target.closest('[data-act="toggle-composer"]'); if (t && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); act('toggle-composer'); } });
  document.body.addEventListener('change', ev => {
    const t = ev.target;
    if (t.id === 'addfn' && t.value) { S.project.brief.functions.push({ function: t.value, where: $('#addfnwhere').value, basis: 'added by the user', evidence: 'brief editor' }); update(); }
    else if (t.dataset.cond) { const k = t.dataset.cond; if (t.value) M.setCondition(S.project, k, t.value, 'user-stated', 'site panel'); else M.setCondition(S.project, k, null, 'unknown', null); update(); }
    else if (t.dataset.treer) { const f = S.project.site.features.find(f => f.id === t.dataset.treer); f.radius_m = t.value ? +t.value : null; f.radius_status = t.value ? 'user-stated' : null; update(); }
    else if (t.id === 'northdeg') { S.project.site.orientation = { north_angle_degrees: +t.value, basis: 'user-stated' }; update(); }
    else if (t.id === 'seed') S.seed = +t.value; else if (t.id === 'density') { S.density = +t.value; renderIntent(); }
    else if (t.dataset.amount !== undefined) { S.pendingCmd.operations.filter(o => o.amount)[+t.dataset.amount].amount = { kind: 'relative', value: +t.value, basis: 'adjusted by the user' }; S.preview = E.previewEdit(S.project, S.K, cur(), S.pendingCmd); renderGarden(); }
    else if (t.id === 'ovop') { S.overlay.opacity = +t.value; renderCanvas(); } else if (t.id === 'ovw') { const w = +t.value; S.overlay.h *= w / S.overlay.w; S.overlay.w = w; renderCanvas(); }
  });
  initCanvas();
}
function syncFunctionsFromValues() {   // a value changed by hand: keep the brief's functions consistent with it (same rules as the interpreter)
  const b = S.project.brief; const has = (fn) => b.functions.some(f => f.function === fn && !f.alternative);
  if (b.values.privacy && !has('z:screen')) b.functions.push({ function: 'z:screen', where: 'boundary', basis: 'privacy → Screen (blocks a view); set the edge below', evidence: 'brief editor' });
  if (!b.values.privacy) b.functions = b.functions.filter(f => !(f.function === 'z:screen' && f.evidence === 'brief editor') && !(f.function === 'z:scrim' && f.alternative));
  if ((b.values.ecology || b.values.maintenance_low) && !has('z:ground_cover')) b.functions.push({ function: 'z:ground_cover', where: 'bed-interior', basis: b.values.maintenance_low ? 'low maintenance → carpeting ground layer (design heuristic)' : 'habitat value → layered ground cover (design heuristic)', evidence: 'brief editor' });
}
function act(a) {
  if (a === 'apply') applyPreview(); else if (a === 'cancel') cancelPreview();
  else if (a === 'regenerate') generate(); else if (a === 'dismiss-stale') { S.project.ui.site_fp = siteFp(); renderGarden(); }
  else if (a === 'zones') { S.showZones = !S.showZones; renderGarden(); } else if (a === 'labels') { S.labels = !S.labels; renderGarden(); } else if (a === 'winter') { S.winter = !S.winter; renderGarden(); } else if (a === 'fit') { S.pz = { x: 0, y: 0, k: 1 }; renderCanvas(); } else if (a === 'frame') { if (S.garden) S.garden.frame(S.project); } else if (a === 'overlay') { S.overlay.show = !S.overlay.show; update(); }
  else if (a === 'quicksite') quickSite(+$('#qw').value || 6, +$('#qh').value || 4);
  else if (a === 'bedfromsite') { const B = G.bbox(S.project.site.boundary); const id = M.addBed(S.project, G.inset(S.project.site.boundary, Math.min(.3, B.w / 10)).map(G.roundPt), 'ai-suggested', null, 'suggested: the site inset by 0.3 m'); S.bedId = id; unlock('intent'); update(); }
  else if (a === 'delsel') { const r = E.directEdit(S.project, S.K, cur(), { kind: 'delete', id: S.selectedPlant }); if (r?.version) { M.commitVersion(S.project, r.version); M.say(S.project, 'sys', r.notes.join('; ')); S.selectedPlant = null; update(); } }
  else if (a === 'closecard') { S.selectedPlant = null; S.evidenceOpen = false; renderGarden(); }
  else if (a === 'evidence') { S.evidenceOpen = true; renderGarden(); } else if (a === 'close-evidence') { S.evidenceOpen = false; renderGarden(); }
  else if (a === 'focus3d') { setMode('garden'); setTimeout(() => S.garden?.focus(S.selectedPlant), 400); }
  else if (a === 'toggle-composer') { S.composerOpen = !S.composerOpen; if (S.composerOpen) S.drawer = null; renderGarden(); if (S.composerOpen) $('#say3')?.focus(); }
  else if (a === 'open-composer') { S.composerOpen = true; S.drawer = null; renderGarden(); $('#say3')?.focus(); }
  else if (a === 'clear-selection') { S.selection = null; renderGarden(); }
  else if (a === 'toggle-drawer') { S.drawer = S.drawer ? null : 'schedule'; if (S.drawer) S.composerOpen = false; renderGarden(); }
}

// ------------------------------------------------------------------ the demonstration journey (also the browser test path) and the acceptance scripts
const sleep = ms => new Promise(r => setTimeout(r, ms));
function resetProject(name, id) { M.clearLocal(); S.project = M.newProject(name); ensureUi(S.project); if (id) S.project.id = id; S.project.knowledge_snapshot = S.K.snapshot; Object.assign(S, { bedId: null, selection: null, scope: null, preview: null, pendingCmd: null, selectedPlant: null, selectedSpecies: null, evidenceOpen: false, overlay: null, drawer: null, composerOpen: false, mode: 'plan', pz: { x: 0, y: 0, k: 1 }, seed: 42, density: 1, stagger: true }); if (S.garden) S.garden.framed = false; for (const st of ['site', 'intent', 'gate']) $(`#s-${st}`).hidden = true; setStage('welcome', { scroll: false }); update(); }
async function journey({ fast = false, stop = null } = {}) {
  stop = stop ?? (new URLSearchParams(location.search).get('stop') ? +new URLSearchParams(location.search).get('stop') : null);
  const wait = ms => fast ? Promise.resolve() : sleep(ms); const out = { steps: [] }; const step = (name, data) => { out.steps.push({ name, stage: S.stage, ...data }); if (stop && out.steps.length >= stop) throw new Error('journey stopped at ' + name); };
  resetProject('Demo backyard', 'demo-backyard');
  const d1 = await handleSay(EXAMPLE); setStage('site', { scroll: !fast }); update(); step('01 vague description', { readiness: d1.readiness, values: d1.values, unknowns: d1.unknowns, boundary: !!S.project.site.boundary }); await wait(900);
  quickSite(6, 4); step('02 site 6 x 4 m (typed; illustrative)', { boundary: S.project.site.boundary, features: S.project.site.features.map(f => ({ id: f.id, kind: f.kind, status: f.status })), beds: S.project.site.beds.map(b => ({ id: b.id, status: b.status })) }); await wait(900);
  acceptBed('bed-1'); step('03 bed accepted', { bed: S.project.site.beds[0] }); await wait(600);
  setStage('intent', { scroll: !fast }); await handleSay('Privacy along the north edge; keep the middle open; it is part shade.'); step('04 brief refined', { functions: S.project.brief.functions, light: S.project.site.conditions.light }); await wait(900);
  const v1 = await generate({ seed: 42 }); await new Promise(r => setTimeout(r, 60)); step('05 generated', { version: v1.id, plants: v1.plant_objects.length, schedule: v1.schedule, operators: v1.generator.operators, validation_ok: v1.validation.ok, edge: v1.evaluation.edge_zones, symbols_2d: document.querySelectorAll('#svg g.plant').length, in_garden: document.body.classList.contains('in-garden') }); await wait(1200);
  setMode('present'); await wait(1200); setMode('garden'); await new Promise(r => setTimeout(r, fast ? 600 : 1600)); if (S.gardenLoading) { await S.gardenLoading; await new Promise(r => setTimeout(r, 100)); } step('06 3d garden', { garden: S.garden ? S.garden.stats() : { error: S.gardenError || 'not started' }, model_plants: cur().plant_objects.length }); setMode('plan'); update();
  const B = G.bbox(S.project.site.beds[0].polygon); S.selection = { id: 'lasso-demo', polygon: [[B.maxx - B.w * .36, B.miny - .1], [B.maxx + .1, B.miny - .1], [B.maxx + .1, B.maxy + .1], [B.maxx - B.w * .36, B.maxy + .1]], source: 'demo: drawn selection over the right side' }; S.composerOpen = true; update(); await wait(700);
  const e = await handleSay('Too dense here, but keep the privacy.'); step('07 lasso + "too dense here, keep privacy"', { command: e.cmd, diff: e.preview?.diff, targets: e.preview?.targets, untouched_outside_scope: e.preview?.untouched_outside_scope, revision_card: !$('#revision').hidden }); await wait(1400);
  const v2 = applyPreview(); if (S.garden) S.garden.sync(S.project, v2, S); step('08 applied', { version: v2.id, plants: v2.plant_objects.length, removed: v2.edit_event.removed_ids, garden: S.garden ? S.garden.stats() : null }); await wait(900);
  undo(); step('09 undo', { current: cur().id, plants: cur().plant_objects.length }); await wait(700); redo(); step('10 redo', { current: cur().id, plants: cur().plant_objects.length }); await wait(700);
  const e2 = await handleSay('Move the taller plants away from the tree.'); step('11 text-only reference', { command: e2.cmd, diff: e2.preview?.diff, notes: e2.preview?.notes, refused: e2.preview?.refused }); if (e2.preview) { applyPreview(); } await wait(700);
  const bundle = exportBundle(); step('12 export', { files: ['model.json', 'plan.svg', 'schedule.csv', 'assumptions.md'], svg_plants: (bundle.svg.match(/<g id="plant-/g) || []).length, model_plants: cur().plant_objects.length, csv_total: cur().plant_objects.length, garden: S.garden ? S.garden.stats() : null });
  out.project = S.project; window.pi.journeyResult = out; const el = document.getElementById('journey-out') || document.createElement('pre'); el.id = 'journey-out'; el.hidden = true; el.textContent = JSON.stringify({ steps: out.steps.map(s => ({ ...s, command: s.command ? { scope: s.command.scope.kind, ops: s.command.operations.map(o => o.type), preserve: s.command.preserve.map(p => p.value) } : undefined })) }); document.body.appendChild(el);
  M.say(S.project, 'sys', 'demonstration journey complete — every step above changed the model; export or keep editing'); update(); return out;
}
// UX acceptance scripts (references/UX_ACCEPTANCE.md): A vague beginner · B rich prompt · C conversational spatial edit · D viewport. Each records
// what the user would see (stage, visible sections, counts) and what the model holds; tools/ux_tests.py reads #script-out.
async function runScript(which) {
  const out = {}; try { await runScriptBody(which, out); } catch (e) { out.error = `${e.message}\n${e.stack}`; console.error(e); }
  const el = document.getElementById('script-out') || document.createElement('pre'); el.id = 'script-out'; el.hidden = true; el.textContent = JSON.stringify(out); document.body.appendChild(el); window.pi.scriptResult = out; return out;
}
async function runScriptBody(which, out) { const vis = () => ({ stage: S.stage, in_garden: document.body.classList.contains('in-garden'), sections: ['welcome', 'site', 'intent', 'gate'].filter(s => !$(`#s-${s}`).hidden), nav_enabled: $$('#stagenav button').filter(b => !b.disabled).map(b => b.dataset.go), revision_card: !$('#revision').hidden, composer_open: S.composerOpen, overflow_x: document.documentElement.scrollWidth - innerWidth, inner_width: innerWidth });
  const all = which === 'all';
  if (all || which === 'A') {
    resetProject('Script A'); const s = { before: vis() }; const d = await handleSay('I want an ecological backyard with low maintenance.', { silent: true }); setStage('site', { scroll: false }); update();
    s.read = { values: d.values, unknowns: d.unknowns, boundary: !!S.project.site.boundary, plants: 0, after_describe: vis(), site_cards: $$('#site-read .card').length, stated_rows: $$('#site-read .card.stated .fact').length, unknown_rows: $$('#site-read .card.unknown .fact').length, generate_disabled: $('#generate')?.disabled ?? null };
    quickSite(5, 4); s.after_size = { ...vis(), beds: S.project.site.beds.map(b => b.status), accept_button: !!$('[data-acceptbed]') };
    acceptBed('bed-1'); setStage('intent', { scroll: false }); update(); s.intent = { ...vis(), value_rows: $$('#brief-left .vrow').length, fn_rows: $$('#brief-left .fn').length, candidates: $$('#brief-right [data-species]').length, generate_enabled: !$('#generate').disabled, effect_notes_unimplemented: $$('#brief-left .effect.none').length };
    const v = await generate({ seed: 3 }); s.garden = { ...vis(), plants: v.plant_objects.length, species: v.schedule.length, symbols_2d: $$('#svg g.plant').length, legend_chips: $$('#legend .chip').length, ids_ok: v.plant_objects.every(o => /^plant-\d{3}$/.test(o.id) && S.K.sp(o.species_id)) }; out.A = s;
  }
  if (all || which === 'B' || which === 'C') {
    resetProject('Script B', 'script-b'); const s = {}; const d = await handleSay('I have a 6 x 4 m backyard in Vancouver, a large existing tree on the north side, privacy along the fence, ecological value, and an open centre for children.', { silent: true }); setStage('site', { scroll: false }); update();
    s.read = { dims: S.project.site.boundary ? G.bbox(S.project.site.boundary) : null, values: d.values, features: S.project.site.features.map(f => ({ kind: f.kind, status: f.status, radius: f.radius_m })), beds: S.project.site.beds.map(b => b.status), inferred_rows: $$('#site-read .card.inferred .fact').length, ...vis(), unknown_rows: $$('#site-read .card.unknown .fact').length };
    acceptBed('bed-1'); setStage('intent', { scroll: false }); update(); s.intent = { functions: S.project.brief.functions.map(f => `${f.function}@${f.where}`), hard: S.project.brief.hard_constraints.map(c => c.id), ...vis() };
    const v = await generate({ seed: 42 }); await new Promise(r => setTimeout(r, 60)); s.garden = { ...vis(), plants: v.plant_objects.length, inside_bed: v.plant_objects.every(o => G.pointInPolygon(o.position_m, S.project.site.beds[0].polygon)), symbols_plan: $$('#svg g.plant').length, cost: v.evaluation.cost, ecology_score: v.evaluation.ecology_score, unknown_gates: v.evaluation.evidence_gates.unknown };
    setMode('present'); await new Promise(r => setTimeout(r, 60)); s.present = { symbols: $$('#svg g.plant').length, mode: S.mode }; setMode('garden'); await new Promise(r => setTimeout(r, 700)); if (S.gardenLoading) { await S.gardenLoading; await new Promise(r => setTimeout(r, 100)); } s.three = S.garden ? S.garden.stats() : { error: S.gardenError }; setMode('plan'); update(); out.B = s;
    if (all || which === 'C') {
      const c = {}; const B = G.bbox(S.project.site.beds[0].polygon); S.selection = { id: 'lasso-c', polygon: [[B.maxx - B.w * .4, B.miny - .1], [B.maxx + .1, B.miny - .1], [B.maxx + .1, B.maxy + .1], [B.maxx - B.w * .4, B.maxy + .1]], source: 'script' }; renderGarden(); c.selected = { ...vis(), inside: v.plant_objects.filter(o => G.pointInPolygon(o.position_m, S.selection.polygon)).length, card_text: $('#revision').textContent.slice(0, 80) };
      const e = await handleSay('Too dense here, but keep privacy.'); c.preview = { ...vis(), scope: e.cmd.scope.kind, ops: e.cmd.operations.map(o => o.type), preserve: e.cmd.preserve.map(p => p.value), removed: e.preview?.diff.removed.length, targets: e.preview?.targets.length, outside_untouched: e.preview?.untouched_outside_scope, removed_in_scope: e.preview ? e.preview.diff.removed.every(id => G.pointInPolygon(v.plant_objects.find(o => o.id === id).position_m, S.selection.polygon)) : null, screen_kept: e.preview ? e.preview.version.plant_objects.filter(o => o.role === 'screen').length === v.plant_objects.filter(o => o.role === 'screen').length : null, privacy_guarantee: e.preview?.privacy_guarantee, removed_drawn_red: $$('#svg .plant.removed').length, banner: !$('#banner').hidden, composer_covers_scope: false };
      const before = JSON.stringify(v.plant_objects); const v2 = applyPreview(); c.applied = { version: v2.id, plants: v2.plant_objects.length, symbols: $$('#svg g.plant').length, schedule_total: v2.schedule.reduce((s, r) => s + r.count, 0), versions: S.project.versions.length };
      undo(); c.undo = { current: cur().id, byte_equal: JSON.stringify(cur().plant_objects) === before, symbols: $$('#svg g.plant').length }; redo(); c.redo = { current: cur().id, plants: cur().plant_objects.length };
      setStage('site', { scroll: false }); update(); c.back_to_site = { ...vis(), versions_kept: S.project.versions.length, boundary_kept: !!S.project.site.boundary }; setStage('garden', { scroll: false }); update(); c.back_to_garden = { ...vis(), plants: cur().plant_objects.length }; out.C = c;
    }
  }
}
