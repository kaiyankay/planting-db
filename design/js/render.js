// Renderers: 2D plan (SVG, metres → pixels, north up, pan + zoom on one <g>) in two modes — `plan` (technical: outlines, labels,
// grid) and `present` (botanical symbols: layered silhouettes per growth form, shading, drifts) — plus the schedule, evidence,
// versions and evaluation HTML. Every symbol is generated from a plant object's position, proxy radius and species form recipe
// (plantforms.js); the silhouette detail is illustrative, the position and radius are the model's. They never change the model.
import * as G from './geom.js';
import { formOf, seeded, PALETTE } from './plantforms.js';
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
export const COLOURS = ['#5f7f62', '#8a9a80', '#b8892b', '#7c6ea8', '#4a7da5', '#c2653f', '#6b8e7f', '#a07e5a', '#9b5c86', '#6f8f3e'];
export function colourOf(K, speciesId) { const i = K.species.findIndex(s => s.id === speciesId); return COLOURS[(i < 0 ? 9 : i) % COLOURS.length]; }
const formCache = new Map(); export function form(K, sid, light) { const k = `${sid}|${light || ''}`; if (!formCache.has(k)) formCache.set(k, formOf(K, sid, light)); return formCache.get(k); }

// ---------------------------------------------------------------- 2D fit + pan/zoom
export function fit2D(project, W, H, inset = { l: 40, r: 40, t: 40, b: 40 }) {
  const pts = [...(project.site.boundary || []), ...project.site.beds.flatMap(b => b.polygon), ...project.site.features.flatMap(f => f.polygon || (f.position_m ? [f.position_m] : []))];
  const B = pts.length ? G.bbox(pts) : { minx: 0, miny: 0, maxx: 8, maxy: 6, w: 8, h: 6 };
  const aw = Math.max(200, W - inset.l - inset.r), ah = Math.max(160, H - inset.t - inset.b);   // the visible stage between the floating panels
  const w = Math.max(B.w, 2), h = Math.max(B.h, 2); const k = Math.min(aw / w, ah / h);
  const ox = inset.l + (aw - w * k) / 2 - B.minx * k, oy = inset.t + (ah + h * k) / 2 + B.miny * k;
  return { k, ox, oy, B, toPx: ([x, y]) => [ox + x * k, oy - y * k], toM: ([px, py]) => [(px - ox) / k, (oy - py) / k] };
}
// ---------------------------------------------------------------- symbols (metres, centred at 0,0; scaled by the caller)
function pathOf(pts) { return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('') + 'Z'; }
function lobed(rand, r, lobes, amp) { const n = lobes * 6; const pts = []; for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI; const rr = r * (1 + amp * Math.sin(a * lobes + rand() * .6) * (0.6 + 0.4 * rand())); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return pts; }
function scalloped(rand, r, n, amp) { const pts = []; const seg = 10; for (let i = 0; i < n; i++) { const a0 = i / n * 2 * Math.PI, a1 = (i + 1) / n * 2 * Math.PI; for (let j = 0; j < seg; j++) { const t = j / seg; const a = a0 + (a1 - a0) * t; const rr = r * (1 - amp + amp * Math.sin(Math.PI * t) * (0.85 + 0.3 * rand())); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } } return pts; }
export function symbol(f, id, r, mode, opts = {}) {
  // returns inner SVG for a plant at origin, in metre units (the caller wraps it in a transform with the pixel scale)
  const rand = seeded(id); const fill = f.foliage, acc = f.accent; const winter = opts.winter && f.evergreen === false; const fol = winter ? PALETTE.deciduousWinter : fill;
  const sw = 0.02 / (opts.k || 1) * 40;   // stroke width ≈ 0.8 px at any zoom (k = px per metre)
  let h = '';
  if (mode === 'plan') {
    if (f.kind === 'tree') h += `<circle r="${r}" fill="none" stroke="${fill}" stroke-width="${sw * 1.4}"/><circle r="${r * .97}" fill="none" stroke="${fill}" stroke-width="${sw * .6}" stroke-dasharray="${r * .25} ${r * .12}"/>` + Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 2 * Math.PI + .3; return `<line x1="0" y1="0" x2="${(Math.cos(a) * r * .92).toFixed(2)}" y2="${(Math.sin(a) * r * .92).toFixed(2)}" stroke="${fill}" stroke-width="${sw * .7}"/>`; }).join('') + `<circle r="${Math.max(.04, r * .08)}" fill="${fill}"/>`;
    else if (f.kind === 'shrub') h += `<path d="${pathOf(lobed(rand, r, 7, .12))}" fill="none" stroke="${fill}" stroke-width="${sw * 1.3}"/><circle r="${Math.max(.03, r * .08)}" fill="${fill}"/>`;
    else if (f.kind === 'fern') h += Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 2 * Math.PI + rand() * .3; const l = r * (0.85 + rand() * .15); const c = [Math.cos(a + .35) * l * .55, Math.sin(a + .35) * l * .55]; return `<path d="M0 0 Q${c[0].toFixed(2)} ${c[1].toFixed(2)} ${(Math.cos(a) * l).toFixed(2)} ${(Math.sin(a) * l).toFixed(2)}" fill="none" stroke="${fill}" stroke-width="${sw * 1.1}"/>`; }).join('') + `<circle r="${Math.max(.03, r * .1)}" fill="${fill}"/>`;
    else if (f.kind === 'herb') h += `<path d="${pathOf(scalloped(rand, r, 9, .18))}" fill="none" stroke="${fill}" stroke-width="${sw}"/>` + (acc ? Array.from({ length: 5 }, () => { const a = rand() * 2 * Math.PI, d = rand() * r * .6; return `<circle cx="${(Math.cos(a) * d).toFixed(2)}" cy="${(Math.sin(a) * d).toFixed(2)}" r="${(r * .12).toFixed(2)}" fill="none" stroke="${acc}" stroke-width="${sw * .8}"/>`; }).join('') : `<circle r="${Math.max(.03, r * .1)}" fill="${fill}"/>`);
    else h += `<circle r="${r}" fill="none" stroke="${fill}" stroke-width="${sw}" stroke-dasharray="${r * .18} ${r * .12}"/><circle r="${Math.max(.03, r * .1)}" fill="${fill}"/>`;
    return h;
  }
  // presentation mode: filled, layered, lit from the north-west
  const shade = (c, t) => mixHex(c, '#1f2a1c', t), light = (c, t) => mixHex(c, '#ffffff', t);
  if (f.kind === 'tree') {
    h += `<circle cx="${r * .08}" cy="${r * .1}" r="${r}" fill="rgba(30,40,25,.18)"/>`;
    h += `<path d="${pathOf(lobed(rand, r, 9, .07))}" fill="${shade(fol, .22)}"/><path d="${pathOf(lobed(rand, r * .82, 7, .09))}" fill="${fol}" transform="translate(${-r * .06} ${-r * .06})"/><path d="${pathOf(lobed(rand, r * .5, 6, .12))}" fill="${light(fol, .18)}" transform="translate(${-r * .14} ${-r * .14})"/>`;
    h += Array.from({ length: 6 }, (_, i) => { const a = i / 6 * 2 * Math.PI + .4; return `<line x1="0" y1="0" x2="${(Math.cos(a) * r * .7).toFixed(2)}" y2="${(Math.sin(a) * r * .7).toFixed(2)}" stroke="${shade(fol, .45)}" stroke-width="${sw * .9}" opacity=".55"/>`; }).join('') + `<circle r="${Math.max(.05, r * .07)}" fill="${shade(fol, .6)}"/>`;
    if (acc && !winter) h += Array.from({ length: 14 }, () => { const a = rand() * 2 * Math.PI, d = Math.sqrt(rand()) * r * .85; return `<circle cx="${(Math.cos(a) * d).toFixed(2)}" cy="${(Math.sin(a) * d).toFixed(2)}" r="${(r * .06).toFixed(2)}" fill="${acc}" opacity=".8"/>`; }).join('');
  } else if (f.kind === 'shrub') {
    h += `<circle cx="${r * .07}" cy="${r * .08}" r="${r * .96}" fill="rgba(30,40,25,.16)"/>`;
    const n = f.density > 1 ? 7 : 5; for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI, d = r * .42; const cx = Math.cos(a) * d, cy = Math.sin(a) * d; h += `<path d="${pathOf(lobed(rand, r * .62, 5, .14))}" fill="${i % 2 ? fol : shade(fol, .14)}" transform="translate(${cx.toFixed(2)} ${cy.toFixed(2)})"/>`; }
    h += `<path d="${pathOf(lobed(rand, r * .5, 5, .16))}" fill="${light(fol, .2)}" transform="translate(${-r * .12} ${-r * .12})"/>`;
    if (acc && !winter) h += Array.from({ length: 10 }, () => { const a = rand() * 2 * Math.PI, d = Math.sqrt(rand()) * r * .8; return `<circle cx="${(Math.cos(a) * d).toFixed(2)}" cy="${(Math.sin(a) * d).toFixed(2)}" r="${(r * .07).toFixed(2)}" fill="${acc}" opacity=".85"/>`; }).join('');
  } else if (f.kind === 'fern') {
    h += `<circle r="${r * .9}" fill="rgba(30,40,25,.12)" cx="${r * .05}" cy="${r * .06}"/>`;
    const n = 12; for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI + rand() * .25; const l = r * (0.8 + rand() * .22); const w = r * .16; const tip = [Math.cos(a) * l, Math.sin(a) * l], c1 = [Math.cos(a + .5) * l * .45, Math.sin(a + .5) * l * .45], c2 = [Math.cos(a - .5) * l * .45, Math.sin(a - .5) * l * .45]; h += `<path d="M0 0 Q${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${tip[0].toFixed(2)} ${tip[1].toFixed(2)} Q${c2[0].toFixed(2)} ${c2[1].toFixed(2)} 0 0Z" fill="${i % 3 ? fol : shade(fol, .2)}" stroke="${shade(fol, .35)}" stroke-width="${sw * .5}"/>`; void w; }
    h += `<circle r="${Math.max(.03, r * .12)}" fill="${shade(fol, .5)}"/>`;
  } else if (f.kind === 'herb') {
    h += `<path d="${pathOf(scalloped(rand, r, 10, .2))}" fill="${fol}" opacity=".9"/><path d="${pathOf(scalloped(rand, r * .62, 8, .22))}" fill="${light(fol, .22)}" transform="translate(${-r * .08} ${-r * .08})"/>`;
    const n = acc ? 9 : 0; for (let i = 0; i < n; i++) { const a = rand() * 2 * Math.PI, d = Math.sqrt(rand()) * r * .75; h += `<circle cx="${(Math.cos(a) * d).toFixed(2)}" cy="${(Math.sin(a) * d).toFixed(2)}" r="${(r * .13).toFixed(2)}" fill="${acc}" stroke="${light(acc, .4)}" stroke-width="${sw * .4}"/>`; }
    if (!acc) h += Array.from({ length: 6 }, () => { const a = rand() * 2 * Math.PI, d = Math.sqrt(rand()) * r * .7; return `<circle cx="${(Math.cos(a) * d).toFixed(2)}" cy="${(Math.sin(a) * d).toFixed(2)}" r="${(r * .08).toFixed(2)}" fill="${shade(fol, .3)}"/>`; }).join('');
  } else {   // ground-cover mat
    h += `<path d="${pathOf(lobed(rand, r, 6, .16))}" fill="${fol}" opacity=".85"/><path d="${pathOf(lobed(rand, r * .55, 5, .2))}" fill="${light(fol, .16)}" transform="translate(${-r * .1} ${-r * .1})"/>`;
    h += Array.from({ length: 7 }, () => { const a = rand() * 2 * Math.PI, d = Math.sqrt(rand()) * r * .8; return `<circle cx="${(Math.cos(a) * d).toFixed(2)}" cy="${(Math.sin(a) * d).toFixed(2)}" r="${(r * .07).toFixed(2)}" fill="${acc && !winter ? acc : shade(fol, .3)}" opacity=".8"/>`; }).join('');
  }
  return h;
}
export function mixHex(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b); const h = v => Math.round(v).toString(16).padStart(2, '0'); return `#${h(r1 + (r2 - r1) * t)}${h(g1 + (g2 - g1) * t)}${h(b1 + (b2 - b1) * t)}`; }

// ---------------------------------------------------------------- 2D plan
export function render2D(svg, project, version, S, K) {
  const W = svg.clientWidth || 800, H = svg.clientHeight || 500; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const base = fit2D(project, W, H, S.inset || { l: 40, r: 40, t: 40, b: 40 }); const pz = S.pz || { x: 0, y: 0, k: 1 }; const k = base.k * pz.k; const mode = S.mode === 'present' ? 'present' : 'plan';
  const T = { k, toPx: m => { const [x, y] = base.toPx(m); return [x * pz.k + pz.x, y * pz.k + pz.y]; }, toM: ([px, py]) => base.toM([(px - pz.x) / pz.k, (py - pz.y) / pz.k]), B: base.B };
  const site = project.site; const P = T.toPx; const poly = pts => pts.map(p => P(p).join(',')).join(' '); const light = site.conditions.light?.value;
  let h = `<defs><pattern id="paper" width="${k}" height="${k}" patternUnits="userSpaceOnUse" x="${pz.x + base.ox * pz.k}" y="${pz.y + base.oy * pz.k}"><path d="M ${k} 0 L 0 0 0 ${k}" fill="none" stroke="rgba(42,39,35,.07)" stroke-width="1"/></pattern><filter id="soft"><feGaussianBlur stdDeviation="1.2"/></filter></defs>`;
  if (site.scale.status !== 'unknown' && k > 10) h += `<rect width="${W}" height="${H}" fill="url(#paper)"/>`;
  h += `<g class="view">`;
  if (S.overlay?.src && S.overlay.show) { const [x0, y0] = P([S.overlay.x, S.overlay.y + S.overlay.h]); h += `<image class="overlay" href="${esc(S.overlay.src)}" x="${x0}" y="${y0}" width="${S.overlay.w * k}" height="${S.overlay.h * k}" preserveAspectRatio="none" style="opacity:${S.overlay.opacity ?? .5}"/>`; }
  if (site.boundary) h += `<polygon class="site ${mode}" points="${poly(site.boundary)}"/>`;
  for (const b of site.beds) h += `<polygon class="bed ${mode} ${b.status === 'ai-suggested' ? 'suggested' : ''} ${S.bedId === b.id ? 'active' : ''}" points="${poly(b.polygon)}" data-bed="${esc(b.id)}"/>${mode === 'plan' || S.labels ? `<text x="${P(G.centroid(b.polygon))[0]}" y="${P([0, G.bbox(b.polygon).maxy])[1] + 12}" font-size="10" fill="var(--olive-deep)" text-anchor="middle">${esc(b.name)}${b.status === 'ai-suggested' ? ' · suggested' : ''}</text>` : ''}`;
  for (const f of site.features) {
    if (f.kind === 'existing-tree') { const c = P(f.position_m); const r = (f.radius_m ?? 1.5) * k; h += mode === 'present' ? `<g transform="translate(${c[0]} ${c[1]}) scale(${k})">${symbol({ kind: 'tree', foliage: '#4a6a4c', accent: null, density: 1, evergreen: null }, f.id, f.radius_m ?? 1.5, 'present', { k, winter: S.winter })}</g>` : `<circle class="tree" cx="${c[0]}" cy="${c[1]}" r="${r}" data-feat="${esc(f.id)}"/><circle class="tree-centre" cx="${c[0]}" cy="${c[1]}" r="3"/>`; if (mode === 'plan' || S.labels) h += `<text x="${c[0]}" y="${c[1] - r - 3}" font-size="9.5" text-anchor="middle" fill="var(--olive-deep)">${esc(f.label || 'existing tree')}${f.radius_m == null ? ' · canopy assumed' : ''}</text>`; }
    else if (f.polygon) { const c = P(G.centroid(f.polygon)); h += `<polygon class="open ${mode}" points="${poly(f.polygon)}" data-feat="${esc(f.id)}"/>${mode === 'plan' || S.labels ? `<text x="${c[0]}" y="${c[1]}" font-size="9.5" text-anchor="middle" fill="var(--ink-3)">${esc(f.label || f.kind)}</text>` : ''}`; }
  }
  if (version && S.showZones && mode === 'plan') for (const z of version.zones) { if (z.kind === 'edge') { for (const e of z.edges) { const a = P(e.a), b = P(e.b); h += `<line class="zone" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`; } const lab = P([(z.edges[0].a[0] + z.edges[0].b[0]) / 2 - z.edges[0].n[0] * .4, (z.edges[0].a[1] + z.edges[0].b[1]) / 2 - z.edges[0].n[1] * .4]); h += `<text class="zone-label" x="${lab[0]}" y="${lab[1]}" text-anchor="middle">${esc(z.label)}</text>`; } }
  if (S.scope?.polygon) h += `<polygon class="scope" points="${poly(S.scope.polygon)}"/>`;
  else if (S.selection?.polygon) h += `<polygon class="scope selection" points="${poly(S.selection.polygon)}"/>`;   // a drawn region waiting for a command
  if (S.lasso?.length > 1) h += `<polygon class="lasso" points="${poly(S.lasso)}"/>`;
  if (S.draft?.length) { h += `<polyline class="draft" points="${poly(S.draft)}" fill="none"/>`; for (const p of S.draft) { const c = P(p); h += `<circle cx="${c[0]}" cy="${c[1]}" r="3" fill="var(--olive)"/>`; } }
  if (version) {
    const pv = S.preview; const removed = new Set(pv?.diff.removed || []), added = new Set(pv?.diff.added || []), changed = new Set(pv?.diff.changed || []), targets = new Set(pv?.targets || (S.selection?.polygon ? version.plant_objects.filter(p => G.pointInPolygon(p.position_m, S.selection.polygon)).map(p => p.id) : []));
    const shown = pv ? pv.version.plant_objects : version.plant_objects; const base0 = new Map(version.plant_objects.map(p => [p.id, p]));
    const order = shown.slice().sort((a, b) => (b.proxy_radius_m - a.proxy_radius_m) || (a.position_m[1] - b.position_m[1]));
    for (const p of order) {
      const c = P(p.position_m); const r = p.proxy_radius_m; const f = form(K, p.species_id, light);
      const cls = ['plant', S.selectedPlant === p.id ? 'sel' : '', added.has(p.id) ? 'added' : changed.has(p.id) ? 'changed' : targets.has(p.id) ? 'target' : '', p.locked ? 'locked' : ''].join(' ');
      const tipText = `<i>${K.name(p.species_id)}</i><div class=m>${p.id} · ${p.role} · r ${p.proxy_radius_m} m${p.height_m != null ? ` · h ≈ ${p.height_m} m` : ' · height unknown'} · drag to move · click for evidence</div>`;
      h += `<g class="${cls}" data-plant="${esc(p.id)}" data-tip="${esc(tipText)}" transform="translate(${c[0].toFixed(1)} ${c[1].toFixed(1)})"><g transform="scale(${k})">${symbol(f, p.id, r, mode, { k, winter: S.winter })}</g><circle class="hit" r="${Math.max(6, r * k)}" fill="transparent"/>${S.selectedPlant === p.id || targets.has(p.id) || added.has(p.id) || changed.has(p.id) ? `<circle class="ring" r="${r * k + 3}"/>` : ''}</g>`;
      if (changed.has(p.id)) { const q = base0.get(p.id); if (q) { const c0 = P(q.position_m); h += `<line x1="${c0[0]}" y1="${c0[1]}" x2="${c[0]}" y2="${c[1]}" stroke="var(--violet)" stroke-width="1.2" stroke-dasharray="3 2"/>`; } }
      if (S.labels && r * k > 11) h += `<text class="plant-label" x="${c[0]}" y="${c[1] + (mode === 'present' ? r * k + 9 : 3)}" text-anchor="middle">${esc(K.name(p.species_id).split(' ').map((w, i) => i ? w.slice(0, 3) : w[0]).join('. '))}</text>`;
    }
    if (pv) for (const id of removed) { const p = base0.get(id); const c = P(p.position_m); h += `<circle class="plant removed" cx="${c[0]}" cy="${c[1]}" r="${Math.max(4, p.proxy_radius_m * k)}" data-plant="${esc(p.id)}"/>`; }
  }
  h += `</g>`;
  if (site.scale.status !== 'unknown') { const L = k >= 60 ? 1 : k >= 25 ? 2 : 5; const x0 = 14, y0 = H - 18; h += `<line class="scalebar" x1="${x0}" y1="${y0}" x2="${x0 + L * k}" y2="${y0}"/><text x="${x0}" y="${y0 - 5}" font-size="10" fill="var(--ink-2)">${L} m · ${esc(site.scale.status)}</text>`; }
  const nx = W - 26, ny = 30; h += `<g transform="translate(${nx},${ny}) rotate(${site.orientation.north_angle_degrees || 0})"><polygon class="north" points="0,-12 5,6 0,2 -5,6"/></g><text x="${nx}" y="${ny + 20}" font-size="9.5" text-anchor="middle" fill="var(--ink-3)">N${site.orientation.basis?.startsWith('assumption') ? ' (assumed up)' : ''}</text>`;
  if (!site.boundary && !site.beds.length) h += `<text x="${W / 2}" y="${H / 2 - 8}" font-size="13" text-anchor="middle" fill="var(--ink-3)">no site geometry yet</text><text x="${W / 2}" y="${H / 2 + 10}" font-size="11" text-anchor="middle" fill="var(--ink-3)">describe dimensions in the conversation, set W × H, or draw the boundary with the Site tool</text>`;
  svg.innerHTML = h; return T;
}

// ---------------------------------------------------------------- schedule, evidence, versions, assumptions (HTML)
export function scheduleHtml(version, K, project) {
  if (!version) return '<p class="faint">no design yet</p>';
  const rows = version.schedule || []; const light = project.site.conditions.light?.value;
  return `<table class="t"><tr><th></th><th>species</th><th>n</th><th>roles</th><th>form · size proxy</th><th>site gate</th><th>function status</th></tr>${rows.map(r => { const p = version.plant_objects.find(p => p.species_id === r.species_id); const ev = K.evidence(r.species_id, project.site.conditions, { maintenance_low: !!project.brief.values.maintenance_low }); const f = form(K, r.species_id, light); const fn = ev.functions.filter(x => x.drawn).map(x => `${x.label}: ${x.status}${x.conflict ? ' · conflict' : ''}`).join(' · ') || 'no function link'; return `<tr class="click" data-species="${esc(r.species_id)}"><td><svg width="26" height="26" viewBox="-1.1 -1.1 2.2 2.2"><g>${symbol(f, r.species_id, 1, 'present', { k: 12 })}</g></svg></td><td><i class="sci">${esc(K.name(r.species_id))}</i> <span class="faint">${esc(K.common(r.species_id))}</span></td><td>${r.count}</td><td>${esc(r.roles.join(', '))}</td><td>${esc(f.growth_form)} · r ${p.proxy_radius_m} m${p.height_m != null ? ` · h ${p.height_m} m` : ''} <span class="mono faint">${esc(p.proxy_source?.claim || p.proxy_source?.status || '')}</span></td><td><span class="tag ${esc(ev.gate.overall)}">${esc(ev.gate.overall)}</span></td><td class="small">${esc(fn)}</td></tr>`; }).join('')}<tr><td></td><td><b>total</b></td><td><b>${version.plant_objects.length}</b></td><td colspan="4" class="faint small">${rows.length} species · counted from the plant objects · ${esc(version.geometry_precision)} — not for procurement</td></tr></table>`;
}
export function evidenceHtml(speciesId, K, project, plant = null) {
  const ev = K.evidence(speciesId, project.site.conditions, { maintenance_low: !!project.brief.values.maintenance_low }); const s = ev.species; const f = form(K, speciesId, project.site.conditions.light?.value);
  let h = `<div class="row"><svg width="54" height="54" viewBox="-1.15 -1.15 2.3 2.3"><g>${symbol(f, speciesId, 1, 'present', { k: 24 })}</g></svg><div class="grow"><div class="kicker">evidence · ${plant ? esc(plant.id) + ' · ' + esc(plant.role) : 'species'}</div><h3 style="font-size:14px"><i class="sci">${esc(s.scientific_name)}</i></h3><div class="faint small">${esc((s.common_names || []).join(' · '))}</div></div></div><p class="small muted">${esc(s.growth_form_label || '')} (${esc(s.growth_form_status || '')}) · ${esc(s.family || '')} · ${esc(String(s.origin_status || '').replace(/_/g, ' '))} · ${s.claims.live} live claims, ${s.claims.verified} human-verified · <a href="${esc(ev.explorer)}" target="_blank" rel="noopener">open in the Explorer</a></p>`;
  h += `<h4 class="kicker" style="margin-top:8px">what the drawing rests on</h4><div class="why small">${Object.entries(f.basis).map(([k, v]) => `<div><b>${esc(k.replace('_', ' '))}</b> — ${esc(v)}</div>`).join('')}</div>`;
  h += `<h4 class="kicker" style="margin-top:8px">site gates</h4>` + ['light', 'water', 'soil', 'maintenance', 'invasive'].map(k => `<div class="why"><b>${k}</b> <span class="tag ${esc(ev.gate[k].result.replace(' ', '_'))}">${esc(ev.gate[k].result)}</span> <span class="muted">${esc(ev.gate[k].detail)}</span>${ev.gate[k].claims.length ? `<details><summary>${ev.gate[k].claims.length} claim${ev.gate[k].claims.length === 1 ? '' : 's'}</summary>${ev.gate[k].claims.slice(0, 6).map(c => claimHtml(K.claimLine(c))).join('')}</details>` : ''}</div>`).join('');
  h += `<div class="why"><b>ecological value</b> <span class="tag ${esc(ev.gate.ecology.result.replace(' ', '_'))}">${esc(ev.gate.ecology.result)}</span> <span class="muted">${esc(ev.gate.ecology.detail)}</span>${ev.gate.ecology.claims.length ? `<details><summary>${ev.gate.ecology.claims.length} claims</summary>${ev.gate.ecology.claims.map(c => claimHtml(K.claimLine(c))).join('')}</details>` : ''}</div>`;
  h += `<h4 class="kicker" style="margin-top:8px">size proxy</h4><div class="why">radius ${ev.proxy.radius_m} m — ${esc(ev.proxy.radius_status)}${ev.proxy.spread.claim ? `: <span class="mono">${esc(ev.proxy.spread.claim)}</span> (${ev.proxy.spread.min}–${ev.proxy.spread.max} m, ${esc(ev.proxy.spread.note)}${ev.proxy.spread.alternatives ? `, ${ev.proxy.spread.alternatives} other range${ev.proxy.spread.alternatives === 1 ? '' : 's'}` : ''}${ev.proxy.spread.disagreement ? ', sources disagree' : ''})` : ''}<br>height ${ev.proxy.height_m != null ? `≈ ${ev.proxy.height_m} m — ${esc(ev.proxy.height.note)} <span class="mono">${esc(ev.proxy.height.claim)}</span>` : 'unknown'}${ev.proxy.height.conditions?.length ? ` <span class="faint">(stated for ${esc(ev.proxy.height.conditions.join(', '))})</span>` : ''}</div>`;
  h += `<h4 class="kicker" style="margin-top:8px">spatial functions (status · verification · conflict kept apart)</h4>` + ev.functions.map(x => `<div class="why"><b>${esc(x.label)}</b> <span class="tag ${esc(x.status)}">${esc(x.status)}</span> ${x.conflict ? '<span class="tag conflict">conflict</span>' : ''} <span class="tag ${esc(x.verification || 'none')}">${esc(x.verification || 'none')}</span><div class="m">${x.drawn ? (x.use_labels.length ? `recorded use: ${esc(x.use_labels.join(', '))} (${esc(x.use_sources.join(', '))})` : 'inferred from traits by KG-R4; no source states the use') : esc(x.verdict)}</div>${x.use_claims?.length ? `<details><summary>use claims</summary>${x.use_claims.map(c => claimHtml(K.claimLine(c))).join('')}</details>` : ''}</div>`).join('');
  h += `<div class="note">Shared traits never imply companion planting; a function link is never a planting verdict. Human verification and the AI source check are shown separately on every claim.</div>`;
  return h;
}
export function claimHtml(c) { return `<div class="claim">${esc(c.text)}<div class="m">${c.source_url ? `<a href="${esc(c.source_url)}" target="_blank" rel="noopener">${esc(c.source)}</a>` : esc(c.source)} · <span class="tag ${esc(c.status)}">${esc(c.status)}</span> <span class="tag ${esc(c.check)}">AI: ${esc(String(c.check).replace(/_/g, ' '))}</span>${c.conditions?.length ? ` · when ${esc(c.conditions.join(', '))}` : ''}${c.cultivar ? ` · cv. ${esc(c.cultivar)}` : ''}<br><span class="faint">${esc(c.id)}${c.context ? ` · ${esc(c.context)}` : ''}</span></div></div>`; }
export function versionsHtml(project, K, diffFn) {
  if (!project.versions.length) return '<p class="faint">no versions yet</p>';
  const cur = project.current_version_id;
  return `<table class="t"><tr><th></th><th>version</th><th>plants</th><th>species</th><th>vs parent</th><th>event</th></tr>${project.versions.slice().reverse().map(v => { const par = project.versions.find(x => x.id === v.parent_version_id); const d = diffFn(par, v); return `<tr class="click ${v.id === cur ? 'sel' : ''}" data-version="${esc(v.id)}"><td>${v.id === cur ? '●' : ''}</td><td>${esc(v.label)} <span class="mono faint">${esc(v.id)} · seed ${v.seed}</span></td><td>${v.plant_objects.length}</td><td>${(v.schedule || []).length}</td><td class="small">${par ? `+${d.added.length} −${d.removed.length} ~${d.changed.length}` : 'root'}</td><td class="small">${esc(v.edit_event ? (v.edit_event.kind === 'spatial_edit' ? `"${v.edit_event.command.utterance}"` : v.edit_event.kind) : `generated: ${(v.generator?.operators || []).join(', ')}`)}</td></tr>`; }).join('')}</table><p class="faint small">click a version to make it current; Undo walks back along parents</p>`;
}
export function assumptionsHtml(version, project) {
  if (!version) return '<p class="faint">no design yet</p>';
  const ev = version.evaluation; return `<div class="cmp"><div><h4 class="kicker">measured on the model</h4><table class="t"><tr><td>bed area</td><td>${ev.bed_area_m2} m²</td></tr><tr><td>plants · species</td><td>${ev.plant_count} · ${ev.species_count}</td></tr><tr><td>by role</td><td>${esc(Object.entries(ev.by_role).map(([k, v]) => `${k} ${v}`).join(' · '))}</td></tr>${ev.edge_zones.map(z => `<tr><td>${esc(z.label)}</td><td>edge ${z.edge_length_m} m · screen row cover ${z.screen_row_cover_m} m · continuity ${z.continuity}</td></tr>`).join('')}${ev.open_zones.map(z => `<tr><td>open zone ${esc(z.id)}</td><td>${z.area_m2} m² · ${z.plants_inside} plants inside</td></tr>`).join('')}<tr><td>site gates of placed plants</td><td>pass ${ev.evidence_gates.pass} · conditional ${ev.evidence_gates.conditional} · unknown ${ev.evidence_gates.unknown}</td></tr><tr><td>cost</td><td class="faint">${esc(ev.cost_note)}</td></tr><tr><td>ecology score</td><td class="faint">${esc(ev.ecology_note)}</td></tr></table></div><div><h4 class="kicker">assumptions</h4><ul class="small">${version.assumptions.map(a => `<li>${esc(a)}</li>`).join('')}<li>drawings: silhouettes, lobes, stems and shading in the 2D presentation mode and the 3D garden are illustrative proxies; growth form, crown radius, height, leaf retention and colour words come from the claims (see a plant's evidence card)</li></ul><h4 class="kicker">unresolved / unknown</h4><ul class="small">${version.unresolved.map(a => `<li>${esc(a)}</li>`).join('') || '<li class="faint">none recorded</li>'}${ev.unknown_conditions.length ? `<li>site conditions unknown: ${esc(ev.unknown_conditions.join(', '))} — gates on them read "unknown", never "pass"</li>` : ''}</ul>${version.validation.issues.length ? `<h4 class="kicker">geometry checks</h4><ul class="small">${version.validation.issues.slice(0, 12).map(i => `<li><span class="tag ${esc(i.severity)}">${esc(i.severity)}</span> ${esc(i.plant_id)}: ${esc(i.text)}</li>`).join('')}${version.validation.issues.length > 12 ? `<li class="faint">+${version.validation.issues.length - 12} more</li>` : ''}</ul>` : '<p class="small ok">geometry checks: no errors</p>'}</div></div>`;
}
export function assemblageHtml(version, K) {
  if (!version?.assemblage) return '';
  const a = version.assemblage; let h = '';
  for (const [role, list] of Object.entries(a.picks)) if (list.length) h += `<div class="why"><b>${esc(role)}</b>${list.map(p => `<div><i class="sci">${esc(K.name(p.id))}</i> <span class="tag ${esc(p.gate)}">gate ${esc(p.gate)}</span> r ${p.proxy_radius_m} m<div class="m">${esc(p.why.join(' · '))}</div></div>`).join('')}</div>`;
  if (a.excluded.length) h += `<details><summary>excluded (${a.excluded.length})</summary>${a.excluded.map(e => `<div class="why small"><i class="sci">${esc(K.name(e.id))}</i> — ${esc(e.reason)}</div>`).join('')}</details>`;
  if (a.not_used.length) h += `<details><summary>eligible, not used (${a.not_used.length})</summary>${a.not_used.map(e => `<div class="why small"><i class="sci">${esc(K.name(e.id))}</i> — ${esc(e.reason)}</div>`).join('')}</details>`;
  return h;
}
export { esc };
