// Shape · Terrain: the panel, the three views of one elevation grid (Plan with contours · Heightmap · Terrain 3D), the brush, the
// heightmap upload and the preview → Apply step. Everything drawn here reads terrain.js; nothing here computes a height of its own.
// A change is first a DRAFT (S.terrainDraft): the views show it, the panel says what the planting engine would do with it (the engine is
// run on a copy of the project), and only Apply writes it to project.site.terrain. Undo and Reset act on the terrain alone.
import * as TR from './terrain.js';
import * as G from './geom.js';

let X = null;   /* { S, M, E, update, renderShape, renderCanvas, dryRun, beds, cur, esc } — set once by the app */
export function install(ctx) { X = ctx; const S = X.S; S.shapeView = S.shapeView || 'plan'; S.terrainDraft = null; S.terrainBrush = null; S.brushRadius = 1; S.brushAmount = 0.2; S.t3dExag = 1; S.t3dSlope = false; S.terrainUpload = null; wireBrush(); wireInputs(); }
const $ = s => document.querySelector(s);
export const site = () => X.S.project.site;
export const applied = () => site().terrain || null;
/** the terrain the views draw: the draft while one is open, otherwise the applied one */
export const shown = () => X.S.terrainDraft || applied();
const ready = () => !!site().boundary && site().scale.status !== 'unknown';
const pct = v => `${Math.round(v * 100)} %`;

// ---------------------------------------------------------------- what the engine would do with the draft
/** the planting engine run on the project as it is and on a copy that carries the draft terrain: counts, refused positions, Screen */
export function impact() {
  const S = X.S; const list = X.beds(); if (!S.terrainDraft || !list.length) return null; const key = `${TR.fingerprint(S.terrainDraft)}|${TR.fingerprint(applied())}|${X.dryKey?.() || ''}`; if (S.terrainImpact?.key === key) return S.terrainImpact.v;
  const run = terrain => { const p2 = { ...S.project, site: { ...S.project.site, terrain }, plant_seq: 0 }; try { return X.E.generate(p2, S.K, list.map(b => b.id), S.seed, { density: S.density, stagger: S.stagger, id_start: 0 }); } catch (e) { console.warn('terrain impact failed', e); return null; } };
  const a = run(applied()), b = run(S.terrainDraft); if (!a || !b) return null; const sig = (v, id) => v.plant_objects.filter(o => o.bed_id === id).map(o => `${o.species_id}|${o.role}|${o.position_m[0]}|${o.position_m[1]}`).sort().join(';');
  const beds = list.map(bd => { const na = a.plant_objects.filter(o => o.bed_id === bd.id).length, nb = b.plant_objects.filter(o => o.bed_id === bd.id).length; const ex = (b.terrain?.excluded || []).filter(x => x.bed_id === bd.id).length; const ea = a.evaluation.edge_zones.find(z => z.bed_id === bd.id), eb = b.evaluation.edge_zones.find(z => z.bed_id === bd.id); const tb = b.evaluation.terrain?.beds.find(x => x.bed_id === bd.id); return { bed_id: bd.id, name: bd.name, before: na, after: nb, same_positions: sig(a, bd.id) === sig(b, bd.id), excluded: ex, screen: ea && eb ? { before: `${ea.covered_m} of ${ea.edge_length_m} m, ${ea.status}`, after: `${eb.covered_m} of ${eb.edge_length_m} m, ${eb.status}`, changed: ea.covered_m !== eb.covered_m || ea.status !== eb.status } : null, max_slope_pct: tb?.max_slope_pct ?? null, steep_m2: tb?.steep_m2 ?? 0 }; });
  const changed = beds.some(x => !x.same_positions); const gate = TR.gateOf(S.terrainDraft); const metres = TR.hasMetres(S.terrainDraft);
  const why = changed ? `${beds.filter(x => !x.same_positions).map(x => x.name).join(', ')}: ${beds.reduce((s, x) => s + x.excluded, 0)} wanted position${beds.reduce((s, x) => s + x.excluded, 0) === 1 ? '' : 's'} fall on ground steeper than ${gate.max_slope_pct} % and are left unplanted`
    : !metres ? 'no position changes: the terrain has relative heights only, so there is no slope to read'
      : !gate.enabled ? 'no position changes: the slope gate is off, so slope limits nothing. Plants keep their x and y and take the ground height under them'
        : `no position changes: no bed has ground steeper than ${gate.max_slope_pct} % (steepest in a bed: ${Math.max(0, ...beds.map(x => x.max_slope_pct || 0))} %)`;
  const v = { before: a.plant_objects.length, after: b.plant_objects.length, excluded: b.terrain?.excluded || [], beds, changed, why, gate, metres }; S.terrainImpact = { key, v }; return v;
}

// ---------------------------------------------------------------- the panel
const seg = (name, opts, cur, attr) => `<span class="seg t-seg" role="group" aria-label="${name}">${opts.map(([id, label, title]) => `<button class="${String(cur) === String(id) ? 'on' : ''}" ${attr}="${id}" aria-pressed="${String(cur) === String(id)}" ${title ? `title="${X.esc(title)}"` : ''}>${label}</button>`).join('')}</span>`;
export function panelHtml() {
  const S = X.S, esc = X.esc; const t = shown(); const d = TR.describe(t); const draft = !!S.terrainDraft; const an = TR.analyse({ ...site(), terrain: t }); const gate = TR.gateOf(t); const hist = (site().terrain_history || []).length;
  let h = `<h3 class="t-h">Terrain <span class="t-chip ${esc(d.tone)}" data-terrain-status="${esc(TR.hasGrid(t) ? t.status : 'unknown')}">${esc(d.label)}</span>${draft ? '<span class="t-chip draft">preview — not applied</span>' : ''}</h3><p class="t-lede">${esc(d.text)}</p>`;
  if (!ready()) return h + `<p class="t-note">A terrain is laid over the site outline in metres. ${site().boundary ? 'Set the scale first (Calibrate, or say the size).' : 'Give the site size or draw its outline first.'} Until then the elevation stays unknown.</p>`;
  // ---- the pending change comes first: what it would do, and Apply / Discard
  if (draft) { const im = impact(); h += `<div class="t-pending" data-terrain-pending><h4>If you apply this terrain</h4>${im ? `<p data-impact-changed="${im.changed}"><b>${im.before} → ${im.after} plants</b> in the Compose preview${im.excluded.length ? ` · <b>${im.excluded.length}</b> position${im.excluded.length === 1 ? '' : 's'} left unplanted` : ''}.</p><p class="t-note" data-impact-why>${esc(im.why)}.</p><ul>${im.beds.filter(b => !b.same_positions || b.steep_m2 > 0 || b.screen?.changed).map(b => `<li><b>${esc(b.name)}</b>: ${b.before} → ${b.after} plants${b.excluded ? `, ${b.excluded} refused by slope` : ''}${b.screen?.changed ? `; Screen ${esc(b.screen.before)} → ${esc(b.screen.after)}` : ''}${b.max_slope_pct != null ? ` <span class="faint">(steepest ${b.max_slope_pct} %)</span>` : ''}</li>`).join('')}</ul>` : '<p class="t-note">No planting bed yet: the terrain will be read when beds exist.</p>'}<p class="t-note">The outline, the tree, the beds and any design already generated stay as they are. A generated design is marked as older than the site until you regenerate it.</p><div class="btns"><button class="btn primary small" data-act="terrain-apply">Apply terrain</button><button class="btn small" data-act="terrain-discard">Discard</button></div></div>`; }
  if (TR.hasGrid(t)) h += `<details class="t-src"><summary>Source and assumptions</summary><dl><dt>Source</dt><dd>${esc(t.provenance.source || '—')}</dd><dt>Method</dt><dd>${esc(t.provenance.method || '—')}</dd><dt>Status</dt><dd>${esc(t.status)}${t.provenance.confirmed_by_user ? ' · confirmed by you' : ''}</dd><dt>Grid</dt><dd>${t.grid.cols} × ${t.grid.rows} nodes over ${t.extent_m[0]} × ${t.extent_m[1]} m</dd></dl><ul>${(t.provenance.assumptions || []).map(a => `<li>${esc(a)}</li>`).join('')}${(t.provenance.edits || []).slice(-3).map(a => `<li class="faint">${esc(a)}</li>`).join('')}</ul></details>`;
  // ---- start from
  const form = t?.provenance?.form; const fp = t?.provenance?.form_params || {};
  h += `<div class="t-sec"><h4>Start from a form <span>conceptual — every number is an assumption you can edit</span></h4><div class="t-forms">${Object.entries(TR.FORMS).map(([id, F]) => `<button class="t-form ${form === id && t.source_type === 'procedural-demo' ? 'on' : ''}" data-terrain-form="${id}" title="${esc(F.text)}">${formIcon(id)}<span>${F.label}</span></button>`).join('')}</div>`;
  if (form === 'gentle-slope' && t.source_type === 'procedural-demo') h += `<div class="t-row"><span>Falls toward</span>${seg('falls toward', [['north', 'N'], ['east', 'E'], ['south', 'S'], ['west', 'W']], fp.falls_toward, 'data-terrain-fall')}</div>`;
  h += `<div class="t-row"><button class="btn small" data-act="terrain-upload" title="a grayscale image: black = low, white = high">Upload a heightmap…</button><span class="t-hint">PNG, grayscale: black low, white high</span></div>`;
  const up = S.terrainUpload; if (up) h += `<div class="t-upload ${esc(up.classification.use)}" data-upload="${esc(up.classification.use)}"><b>${esc(up.name)}</b> · ${up.stats.width} × ${up.stats.height} px · <span data-analysed="false">not analysed</span><p>${esc(up.classification.text)}</p>${up.classification.use === 'needs-confirmation' ? '<div class="btns"><button class="btn primary small" data-act="terrain-upload-confirm">It is a heightmap — use it</button><button class="btn small" data-act="terrain-upload-dismiss">Keep as reference only</button></div>' : '<div class="btns"><button class="btn small" data-act="terrain-upload-dismiss">OK</button></div>'}</div>`;
  h += '</div>';
  if (TR.hasGrid(t)) {
    // ---- elevation range
    const r = t.elevation_range_m; h += `<div class="t-sec"><h4>Elevation range <span>${r ? 'what black and white stand for, in metres' : 'not set: heights are relative only'}</span></h4><div class="t-row t-range"><label>low <input type="number" step="0.05" id="t-zmin" value="${r ? r[0] : 0}" aria-label="lowest elevation in metres"> m</label><label>high <input type="number" step="0.05" id="t-zmax" value="${r ? r[1] : ''}" placeholder="?" aria-label="highest elevation in metres"> m</label><button class="btn small" data-act="terrain-range">Set</button></div></div>`;
    // ---- edit
    h += `<div class="t-sec"><h4>Edit by hand <span>${S.shapeView === 'height' ? 'drag on the heightmap' : 'open the Heightmap view to draw'}</span></h4><div class="t-row"><span>Brush</span>${seg('brush', [['', 'Off'], ['raise', 'Raise'], ['lower', 'Lower']], S.terrainBrush || '', 'data-terrain-brush')}</div><div class="t-row"><span>Size</span>${seg('brush radius', [[0.5, '0.5 m'], [1, '1 m'], [1.5, '1.5 m']], S.brushRadius, 'data-terrain-radius')}</div><div class="t-row"><span>Step</span>${seg('brush step', TR.hasMetres(t) ? [[0.1, '0.1 m'], [0.2, '0.2 m'], [0.5, '0.5 m']] : [[0.1, '10 %'], [0.2, '20 %'], [0.5, '50 %']], S.brushAmount, 'data-terrain-amount')}</div></div>`;
    // ---- analysis
    h += `<div class="t-sec" data-terrain-analysis><h4>Read from the grid <span>recomputed, never typed in</span></h4>`;
    if (!an.has_metres) h += `<p class="t-note">${esc(an.text)}</p>`;
    else h += `<dl class="t-facts"><dt>Relief</dt><dd data-fact="relief">${an.relief_m} m</dd><dt>Slope</dt><dd data-fact="slope">mean ${an.slope.mean_pct} % · steepest ${an.slope.max_pct} %</dd><dt>General fall</dt><dd>${an.general_fall ? `${an.general_fall.pct} % toward the ${an.general_fall.toward}` : 'none'}</dd><dt>Over ${gate.max_slope_pct} %</dt><dd data-fact="steep">${an.slope.steep_m2} m² of the site (${pct(an.slope.steep_share || 0)})</dd><dt>Low spots</dt><dd data-fact="low">${an.low_spots.length ? `${an.low_spots.length} potential — ${an.low_spots.slice(0, 2).map(l => `${l.position_m.join(', ')} m`).join('; ')}` : 'none found'}</dd></dl><p class="t-note">Slope is rise ÷ run between grid nodes, in per cent (100 % = 45°). ${an.low_spots.length ? 'A low spot is a shape of the ground. Whether water stands there depends on soil and drainage, which are not recorded — nothing wet is assumed.' : 'Sun exposure, drainage and soil moisture are not derived from the terrain.'}</p>`;
    h += '</div>';
    // ---- gate
    h += `<div class="t-sec" data-terrain-gate="${gate.enabled}"><h4>Planting limit on slope <span class="t-heur">design heuristic</span></h4><div class="t-row"><span>Gate</span>${seg('slope gate', [['off', 'Off'], ['on', 'On']], gate.enabled ? 'on' : 'off', 'data-terrain-gate-set')}${seg('slope limit', TR.SLOPE_OPTIONS.map(v => [v, `${v} %`, `about 1 : ${G.round(100 / v, 1)}`]), gate.max_slope_pct, 'data-terrain-limit')}</div><p class="t-note">${an.has_metres ? `When on, no plant is placed where the ground is steeper than ${gate.max_slope_pct} % (about 1 : ${G.round(100 / gate.max_slope_pct, 1)}). This is a working limit set here — not a slope tolerance recorded for any plant. The database holds no such claim.` : 'Needs an elevation range: without metres there is no slope to compare.'}</p></div>`;
    h += `<details class="t-src"><summary>3D display</summary><div class="t-row"><span>Vertical</span>${seg('vertical exaggeration', [[1, '× 1'], [2, '× 2'], [4, '× 4']], S.t3dExag, 'data-terrain-exag')}</div><div class="t-row"><span>Tint</span>${seg('tint', [['h', 'Height'], ['s', 'Slope']], S.t3dSlope ? 's' : 'h', 'data-terrain-tint')}</div><p class="t-note">Exaggeration changes the Terrain 3D drawing only. Slope, the gate and plant heights always use the true grid.</p></details>`;
  }
  // ---- history
  if (!draft) h += `<div class="t-row t-hist"><button class="btn small" data-act="terrain-undo" ${hist ? '' : 'disabled'}>Undo terrain</button><button class="btn small" data-act="terrain-reset" ${TR.hasGrid(applied()) ? '' : 'disabled'}>Reset to unknown</button></div>`;
  return h;
}
const formIcon = id => ({ flat: '<svg viewBox="0 0 40 20"><path d="M3 14h34"/></svg>', 'gentle-slope': '<svg viewBox="0 0 40 20"><path d="M3 16L37 6"/></svg>', berm: '<svg viewBox="0 0 40 20"><path d="M3 16c8 0 10-10 17-10s9 10 17 10"/></svg>', swale: '<svg viewBox="0 0 40 20"><path d="M3 6c8 0 10 9 17 9s9-9 17-9"/></svg>' }[id] || '');
/** the view switch and the one-line status on the Shape canvas */
export function barHtml() {
  const S = X.S; const t = shown(); const d = TR.describe(t); const g = TR.hasGrid(t);
  return `<span class="seg t-views" role="group" aria-label="Site views">${[['plan', 'Plan'], ['height', 'Heightmap'], ['t3d', 'Terrain 3D']].map(([id, l]) => `<button class="${S.shapeView === id ? 'on' : ''}" data-terrain-view="${id}" aria-pressed="${S.shapeView === id}">${l}</button>`).join('')}</span><button class="t-status ${X.esc(d.tone)} ${S.wsPanel === 'terrain' ? 'on' : ''}" data-act="panel-terrain" data-elevation="${g ? X.esc(t.status) : 'unknown'}" title="${X.esc(d.text)}">${X.esc(d.label)}${g && TR.hasMetres(t) ? ` · relief ${TR.reliefOf(t)} m` : ''}${S.terrainDraft ? ' · preview' : ''}</button>`;
}

// ---------------------------------------------------------------- 2D: contours, heightmap cells, steep ground, low spots, refused positions
/** appended to the plan SVG after render2D (T = its metre → pixel transform). `mode`: 'plan' (contours only) or 'height' (the grid as grey cells). */
export function overlaySvg(T, t, { mode = 'plan', excluded = [], boundary = null, beds = [], uid = 'tr' } = {}) {
  if (!TR.hasGrid(t)) return ''; const P = T.toPx; const esc = X.esc; let h = `<g class="terrain-ov ${mode}" data-terrain-fp="${TR.fingerprint(t)}" pointer-events="none">`; const { cols, rows, values } = t.grid; const metres = TR.hasMetres(t); const gate = TR.gateOf(t);
  const X0 = i => t.origin_m[0] + t.extent_m[0] * i / (cols - 1), Y0 = j => t.origin_m[1] + t.extent_m[1] * j / (rows - 1);
  if (mode === 'height') { let cells = ''; for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) { const v = (values[j * cols + i] + values[j * cols + i + 1] + values[(j + 1) * cols + i] + values[(j + 1) * cols + i + 1]) / 4; const a = P([X0(i), Y0(j + 1)]), b = P([X0(i + 1), Y0(j)]); const g = Math.round(28 + v * 215); cells += `<rect x="${a[0].toFixed(1)}" y="${a[1].toFixed(1)}" width="${(b[0] - a[0] + .6).toFixed(1)}" height="${(b[1] - a[1] + .6).toFixed(1)}" fill="rgb(${g},${g},${g})"/>`; } h += `<g class="hm-cells" data-cells="${(cols - 1) * (rows - 1)}">${cells}</g>`;
    for (const b of beds) h += `<path class="hm-bed" d="M${b.polygon.map(p => P(p).join(' ')).join('L')}Z"/>`; if (boundary) h += `<path class="hm-site" d="M${boundary.map(p => P(p).join(' ')).join('L')}Z"/>`; }
  if (metres && (gate.enabled || mode === 'height')) { let st = ''; let n = 0; for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) { const s = TR.slopeAt(t, (X0(i) + X0(i + 1)) / 2, (Y0(j) + Y0(j + 1)) / 2).pct; if (s <= gate.max_slope_pct) continue; n++; const a = P([X0(i), Y0(j + 1)]), b = P([X0(i + 1), Y0(j)]); st += `<rect x="${a[0].toFixed(1)}" y="${a[1].toFixed(1)}" width="${(b[0] - a[0] + .6).toFixed(1)}" height="${(b[1] - a[1] + .6).toFixed(1)}"/>`; } if (n) h += `<g class="steep ${gate.enabled ? 'gated' : ''}" data-steep-cells="${n}"><title>ground steeper than ${gate.max_slope_pct} % — ${gate.enabled ? 'not planted (slope gate, a design heuristic)' : 'slope gate off'}</title>${st}</g>`; }
  const segs = TR.contours(t); const line = s => { const a = P(s.a), b = P(s.b); return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`; };
  h += `<path class="contour" data-contours="${segs.length}" d="${segs.filter(s => !s.index).map(line).join('')}"/><path class="contour index" d="${segs.filter(s => s.index).map(line).join('')}"/>`;
  if (metres) { const seen = new Set(); for (const s of segs) { if (seen.has(s.level)) continue; const m = [(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2]; if (boundary && !G.pointInPolygon(m, boundary)) continue; if (!s.index && seen.size % 2) { seen.add(s.level); continue; } seen.add(s.level); const q = P(m); h += `<text class="contour-l" x="${q[0].toFixed(1)}" y="${(q[1] - 2).toFixed(1)}">${s.level} m</text>`; } }
  if (metres) for (const l of TR.lowSpots(t)) { const q = P(l.position_m); h += `<g class="lowspot" data-lowspot><circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="7"/><text x="${(q[0] + 11).toFixed(1)}" y="${(q[1] + 4).toFixed(1)}">potential low spot</text></g>`; }
  for (const e of excluded) { const q = P(e.position_m); h += `<g class="steep-x" data-excluded="${esc(e.bed_id)}"><title>not planted: ${e.slope_pct} % here, limit ${e.limit_pct} % (slope gate, a design heuristic) — wanted for the ${esc(e.wanted_for)}</title><path d="M${(q[0] - 4).toFixed(1)} ${(q[1] - 4).toFixed(1)}l8 8m0 -8l-8 8"/></g>`; }
  return h + '</g>';
}
/** called by the app after every canvas render: adds the terrain layer to the plan, or shows the Shape 3D view instead of it */
export function afterCanvas() {
  const S = X.S; const svg = $('#svg'); const gl = $('#site-gl'); const bar = $('#terrain-bar'); const onSite = S.stage === 'site' && !!site().boundary; if (bar) { bar.hidden = !onSite; if (onSite) bar.innerHTML = barHtml(); }
  const t3d = onSite && S.shapeView === 't3d'; if (gl) gl.hidden = !t3d;
  if (t3d) { svg.style.display = 'none'; show3D(); return; } if (S.siteGarden) S.siteGarden.setVisible(false);
  if (S.stage === 'garden' && S.mode === 'garden') return; const t = S.stage === 'site' ? shown() : applied(); if (!TR.hasGrid(t) || !S.T || !site().boundary) { svg.classList.remove('hm'); return; }
  const mode = onSite && S.shapeView === 'height' ? 'height' : 'plan'; svg.classList.toggle('hm', mode === 'height'); if (S.stage === 'garden' && S.mode === 'algo') return;
  const v = S.stage === 'garden' ? X.cur() : S.stage === 'site' && S.terrainDraft ? null : X.dryRun(); const excluded = S.stage === 'site' && S.terrainDraft ? (impact()?.excluded || []) : (v?.terrain?.excluded || []);
  svg.insertAdjacentHTML('beforeend', overlaySvg(S.T, t, { mode, excluded, boundary: site().boundary, beds: X.beds() }));
  if (mode === 'height' && S.terrainBrush) svg.insertAdjacentHTML('beforeend', `<circle id="t-brush" class="t-brush ${S.terrainBrush}" r="${(S.brushRadius * S.T.k).toFixed(1)}" cx="-999" cy="-999" pointer-events="none"/>`);
}
function show3D() {
  const S = X.S; const el = $('#site-gl'); const proj = { ...S.project, site: { ...S.project.site, terrain: shown() } }; const view = { ...S, preview: null, selectedPlant: null, labelScope: 'off' };
  if (S.siteGarden) { S.siteGarden.setVisible(true); S.siteGarden.sync(proj, null, view); return; }
  if (S.siteGardenLoading || S.siteGardenError) { if (S.siteGardenError) el.innerHTML = `<div class="note warn" style="margin:120px auto;max-width:520px">The 3D terrain could not start: ${X.esc(S.siteGardenError)}. WebGL is needed; the plan and the heightmap show the same grid.</div>`; return; }
  S.siteGardenLoading = import('./garden3d.js').then(({ Garden }) => { S.siteGarden = new Garden(el, { K: S.K, onSelect: () => { }, onHover: () => { } }); if (X.S.stage === 'site' && X.S.shapeView === 't3d') show3D(); else S.siteGarden.setVisible(false); }).catch(e => { S.siteGardenError = e.message; for (const o of document.querySelectorAll('#site-canvas-body > .g3-note, #site-canvas-body > .g3-callout, .site-canvas > .g3-note, .site-canvas > .g3-callout')) if (!S.garden || (o !== S.garden.note && o !== S.garden.callout)) o.remove();   /* a renderer that could not start leaves nothing behind */ show3D(); });
}

// ---------------------------------------------------------------- actions (every change of the ground goes to the draft)
const base = () => shown();
function setDraft(t, note = null) { const S = X.S; S.terrainDraft = t; S.terrainImpact = null; S.terrainNote = note; if (t && S.wsPanel !== 'terrain') S.wsPanel = 'terrain'; X.renderShape(); X.renderCanvas(); }
export function setForm(form, params = {}) { if (!ready()) return null; const prev = base(); const t = TR.conceptual(site(), form, params); if (prev?.gate) t.gate = { ...prev.gate }; setDraft(t); return t; }
export function setRange(lo, hi) { const t = base(); if (!TR.hasGrid(t)) return null; const n = TR.setRange(t, Number.isFinite(lo) && Number.isFinite(hi) && hi >= lo ? [lo, hi] : null); setDraft(n); return n; }
export function setGate(patch) { const t = base(); if (!TR.hasGrid(t)) return null; const n = TR.setGate(t, patch); setDraft(n); return n; }
export function brushAt(p, dir = X.S.terrainBrush, render = true) { const S = X.S; const t = base(); if (!TR.hasGrid(t) || !dir) return null; const n = TR.brush(t, p, S.brushRadius, (dir === 'lower' ? -1 : 1) * S.brushAmount); S.terrainDraft = n; S.terrainImpact = null; if (render) { X.renderShape(); X.renderCanvas(); } return n; }
export function apply() { const S = X.S; const t = S.terrainDraft; if (!t) return null; const im = impact(); const before = applied(); TR.commit(site(), t, 'terrain applied'); S.terrainDraft = null; S.terrainImpact = null; const d = TR.describe(t);
  X.M.say(S.project, 'sys', `Terrain applied: ${d.label.toLowerCase()} — ${d.text} ${im ? `Compose preview ${im.before} → ${im.after} plants. ${im.why}.` : ''} ${TR.hasGrid(before) ? '' : 'The elevation was unknown before.'}`.trim()); X.update(); return t; }
export function discard() { setDraft(null); }
export function undo() { const s = TR.undo(site()); X.S.terrainDraft = null; X.S.terrainImpact = null; if (s) X.M.say(X.S.project, 'sys', `Terrain: undone (${s.label}). ${TR.describe(applied()).label}.`); X.update(); return s; }
export function reset() { TR.reset(site()); X.S.terrainDraft = null; X.S.terrainImpact = null; X.S.shapeView = X.S.shapeView === 'plan' ? 'plan' : X.S.shapeView; X.M.say(X.S.project, 'sys', 'Terrain reset: elevation unknown. Planting is arranged as it was without a terrain.'); X.update(); }
/** an uploaded picture: measured (pixels only), classified, and held until the user says what it is. Never read as terrain on its own. */
export function offerImage(img, name) { const S = X.S; const stats = TR.imageStats(img); const classification = TR.classifyImage(stats); S.terrainUpload = { img, name, stats, classification }; S.wsPanel = 'terrain';
  X.M.addInput(S.project, { type: 'image', role: 'terrain-reference', name, analysed: false, note: classification.use === 'needs-confirmation' ? 'grayscale picture offered as a heightmap; not used until confirmed' : 'kept as a reference only; not analysed, no elevation read from it' }); X.renderShape(); return S.terrainUpload; }
export function confirmImage() { const S = X.S; const up = S.terrainUpload; if (!up || up.classification.use !== 'needs-confirmation') return null; const prev = base(); const r = TR.fromImage(site(), up.img, { confirmed: true, range: TR.hasMetres(prev) && TR.reliefOf(prev) > 0 ? prev.elevation_range_m : null, name: up.name }); S.terrainUpload = null; if (r.terrain && prev?.gate) r.terrain.gate = { ...prev.gate }; setDraft(r.terrain); return r.terrain; }
/** a synthetic picture for the replayable demonstrations: 'ramp' and 'mound' are grayscale heightmaps, 'photo' has colour */
export function testImage(kind, w = 96, h = 60) { const data = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4; let r, g, b; if (kind === 'photo') { r = 60 + 150 * x / w; g = 120 + 80 * Math.sin(y / 6); b = 40 + 100 * y / h; } else { const v = kind === 'mound' ? 255 * Math.exp(-(((x - w * .3) / (w * .16)) ** 2 + ((y - h * .25) / (h * .22)) ** 2)) : 255 * (1 - y / (h - 1)); r = g = b = v; } data[k] = r; data[k + 1] = g; data[k + 2] = b; data[k + 3] = 255; } return { data, width: w, height: h }; }

export function act(a, t) {
  const S = X.S;
  if (a === 'panel-terrain') { S.wsPanel = S.wsPanel === 'terrain' ? null : 'terrain'; X.renderShape(); X.renderCanvas(); return true; }
  if (a === 'terrain-apply') { apply(); return true; } if (a === 'terrain-discard') { discard(); return true; } if (a === 'terrain-undo') { undo(); return true; } if (a === 'terrain-reset') { reset(); return true; }
  if (a === 'terrain-range') { setRange(parseFloat($('#t-zmin')?.value), parseFloat($('#t-zmax')?.value)); return true; }
  if (a === 'terrain-upload') { $('#hmfile')?.click(); return true; } if (a === 'terrain-upload-confirm') { confirmImage(); return true; } if (a === 'terrain-upload-dismiss') { S.terrainUpload = null; X.renderShape(); return true; }
  return false;
}
function wireInputs() {
  document.body.addEventListener('click', ev => {
    const S = X.S; const b = ev.target.closest('[data-terrain-view],[data-terrain-form],[data-terrain-fall],[data-terrain-brush],[data-terrain-radius],[data-terrain-amount],[data-terrain-gate-set],[data-terrain-limit],[data-terrain-exag],[data-terrain-tint]'); if (!b) return; const d = b.dataset;
    if (d.terrainView) { S.shapeView = d.terrainView; if (S.shapeView !== 'height') S.terrainBrush = null; X.renderShape(); X.renderCanvas(); }
    else if (d.terrainForm) setForm(d.terrainForm);
    else if (d.terrainFall) setForm('gentle-slope', { falls_toward: d.terrainFall });
    else if ('terrainBrush' in d) { S.terrainBrush = d.terrainBrush || null; if (S.terrainBrush) S.shapeView = 'height'; X.renderShape(); X.renderCanvas(); }
    else if (d.terrainRadius) { S.brushRadius = +d.terrainRadius; X.renderShape(); X.renderCanvas(); } else if (d.terrainAmount) { S.brushAmount = +d.terrainAmount; X.renderShape(); }
    else if (d.terrainGateSet) setGate({ enabled: d.terrainGateSet === 'on' }); else if (d.terrainLimit) setGate({ max_slope_pct: +d.terrainLimit });
    else if (d.terrainExag) { S.t3dExag = +d.terrainExag; X.renderShape(); X.renderCanvas(); } else if (d.terrainTint) { S.t3dSlope = d.terrainTint === 's'; X.renderShape(); X.renderCanvas(); }
  });
  const f = $('#hmfile'); if (f) f.addEventListener('change', () => { const file = f.files?.[0]; f.value = ''; if (!file) return; const url = URL.createObjectURL(file); const im = new Image(); im.onload = () => { const k = Math.min(1, 512 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(im.width * k)); c.height = Math.max(2, Math.round(im.height * k)); const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, c.width, c.height); const d = g.getImageData(0, 0, c.width, c.height); URL.revokeObjectURL(url); offerImage({ data: d.data, width: c.width, height: c.height }, file.name); }; im.onerror = () => { URL.revokeObjectURL(url); X.S.terrainUpload = { name: file.name, stats: { width: 0, height: 0 }, classification: { use: 'reference-only', analysed: false, text: 'This file could not be read as a picture.' } }; X.renderShape(); }; im.src = url; });
}
/** the brush: active only in Shape · Heightmap with Raise or Lower chosen. It takes the pointer before the plan's own tools. */
function wireBrush() {
  const svg = $('#svg'); if (!svg) return; let down = false, last = null; const on = () => X.S.stage === 'site' && X.S.shapeView === 'height' && !!X.S.terrainBrush && TR.hasGrid(shown()) && !!X.S.T;
  const at = e => { const r = svg.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  svg.addEventListener('pointerdown', e => { if (!on() || e.button !== 0) return; e.stopPropagation(); e.preventDefault(); down = true; const m = X.S.T.toM(at(e)); last = m; brushAt(m, X.S.terrainBrush, false); X.renderCanvas(); svg.setPointerCapture?.(e.pointerId); }, true);
  svg.addEventListener('pointermove', e => { if (!on()) return; const px = at(e); const c = $('#t-brush'); if (c) { c.setAttribute('cx', px[0]); c.setAttribute('cy', px[1]); } if (!down) return; e.stopPropagation(); const m = X.S.T.toM(px); if (G.dist(m, last) < X.S.brushRadius / 3) return; last = m; brushAt(m, X.S.terrainBrush, false); X.renderCanvas(); const c2 = $('#t-brush'); if (c2) { c2.setAttribute('cx', px[0]); c2.setAttribute('cy', px[1]); } }, true);
  const up = e => { if (!down) return; down = false; e.stopPropagation(); X.renderShape(); X.renderCanvas(); }; svg.addEventListener('pointerup', up, true); svg.addEventListener('pointercancel', up, true);
  svg.addEventListener('click', e => { if (on()) e.stopPropagation(); }, true);
}
