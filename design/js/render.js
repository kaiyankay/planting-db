// Renderers: 2D plan (SVG, metres → pixels, north up) · 3D isometric proxy (same objects, same ids, heights labelled as proxies) ·
// schedule · evidence card · versions. They read the model and a view state; they never change either.
import * as G from './geom.js';
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
export const PALETTE = ['#5f7f62', '#8a9a80', '#b8892b', '#7c6ea8', '#4a7da5', '#c2653f', '#6b8e7f', '#a07e5a', '#9b5c86', '#6f8f3e'];
export function colourOf(K, speciesId) { const i = K.species.findIndex(s => s.id === speciesId); return PALETTE[(i < 0 ? 9 : i) % PALETTE.length]; }

// ---------------------------------------------------------------- 2D plan
export function fit2D(project, W, H, pad = 36) {
  const pts = [...(project.site.boundary || []), ...project.site.beds.flatMap(b => b.polygon), ...project.site.features.flatMap(f => f.polygon || (f.position_m ? [f.position_m] : []))];
  const B = pts.length ? G.bbox(pts) : { minx: 0, miny: 0, maxx: 8, maxy: 6, w: 8, h: 6 };
  const w = Math.max(B.w, 2), h = Math.max(B.h, 2); const k = Math.min((W - 2 * pad) / w, (H - 2 * pad) / h);
  const ox = (W - w * k) / 2 - B.minx * k, oy = (H + h * k) / 2 + B.miny * k;   // y flipped: north up
  return { k, toPx: ([x, y]) => [ox + x * k, oy - y * k], toM: ([px, py]) => [(px - ox) / k, (oy - py) / k], B };
}
export function render2D(svg, project, version, S, K) {
  const W = svg.clientWidth || 800, H = svg.clientHeight || 500; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const T = fit2D(project, W, H); const P = T.toPx; const site = project.site; const poly = pts => pts.map(p => P(p).join(',')).join(' ');
  let h = '';
  // grid (1 m when scaled)
  if (site.scale.status !== 'unknown' && T.k > 12) { for (let x = Math.floor(T.B.minx) - 1; x <= T.B.maxx + 1; x++) { const [px] = P([x, 0]); h += `<line class="grid" x1="${px}" y1="0" x2="${px}" y2="${H}"/>`; } for (let y = Math.floor(T.B.miny) - 1; y <= T.B.maxy + 1; y++) { const [, py] = P([0, y]); h += `<line class="grid" x1="0" y1="${py}" x2="${W}" y2="${py}"/>`; } }
  if (S.overlay?.src && S.overlay.show) { const [x0, y0] = P([S.overlay.x, S.overlay.y + S.overlay.h]); h += `<image class="overlay" href="${esc(S.overlay.src)}" x="${x0}" y="${y0}" width="${S.overlay.w * T.k}" height="${S.overlay.h * T.k}" preserveAspectRatio="none" style="opacity:${S.overlay.opacity ?? .5}"/>`; }
  if (site.boundary) h += `<polygon class="site" points="${poly(site.boundary)}"/>`;
  for (const b of site.beds) h += `<polygon class="bed ${b.status === 'ai-suggested' ? 'suggested' : ''} ${S.bedId === b.id ? 'active' : ''}" points="${poly(b.polygon)}" data-bed="${esc(b.id)}"/><text x="${P(G.centroid(b.polygon))[0]}" y="${P([0, G.bbox(b.polygon).maxy])[1] + 12}" font-size="10" fill="var(--olive-deep)" text-anchor="middle">${esc(b.name)}${b.status === 'ai-suggested' ? ' · suggested' : ''}</text>`;
  for (const f of site.features) {
    if (f.kind === 'existing-tree') { const c = P(f.position_m); const r = (f.radius_m ?? 1.5) * T.k; h += `<circle class="tree" cx="${c[0]}" cy="${c[1]}" r="${r}" data-feat="${esc(f.id)}"/><circle class="tree-centre" cx="${c[0]}" cy="${c[1]}" r="3"/><text x="${c[0]}" y="${c[1] - r - 3}" font-size="9.5" text-anchor="middle" fill="var(--olive-deep)">${esc(f.label || 'existing tree')}${f.radius_m == null ? ' · canopy assumed' : ''}</text>`; }
    else if (f.polygon) { const c = P(G.centroid(f.polygon)); h += `<polygon class="open" points="${poly(f.polygon)}" data-feat="${esc(f.id)}"/><text x="${c[0]}" y="${c[1]}" font-size="9.5" text-anchor="middle" fill="var(--ink-3)">${esc(f.label || f.kind)}</text>`; }
  }
  if (version && S.showZones) for (const z of version.zones) { if (z.kind === 'edge') for (const e of z.edges) { const a = P(e.a), b = P(e.b); h += `<line class="zone" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`; } const lab = z.kind === 'edge' ? P([(z.edges[0].a[0] + z.edges[0].b[0]) / 2 - z.edges[0].n[0] * .4, (z.edges[0].a[1] + z.edges[0].b[1]) / 2 - z.edges[0].n[1] * .4]) : null; if (lab) h += `<text class="zone-label" x="${lab[0]}" y="${lab[1]}" text-anchor="middle">${esc(z.label)}</text>`; }
  if (S.scope?.polygon) h += `<polygon class="scope" points="${poly(S.scope.polygon)}"/>`;
  if (S.lasso?.length > 1) h += `<polygon class="lasso" points="${poly(S.lasso)}"/>`;
  if (S.draft?.length) { h += `<polyline class="draft" points="${poly(S.draft)}" fill="none"/>`; for (const p of S.draft) { const c = P(p); h += `<circle cx="${c[0]}" cy="${c[1]}" r="3" fill="var(--olive)"/>`; } }
  if (version) {
    const pv = S.preview; const removed = new Set(pv?.diff.removed || []), added = new Set(pv?.diff.added || []), changed = new Set(pv?.diff.changed || []), targets = new Set(pv?.targets || []);
    const shown = pv ? pv.version.plant_objects : version.plant_objects; const base = new Map(version.plant_objects.map(p => [p.id, p]));
    if (pv) for (const id of removed) { const p = base.get(id); const c = P(p.position_m); h += `<circle class="plant removed" cx="${c[0]}" cy="${c[1]}" r="${Math.max(3, p.proxy_radius_m * T.k)}" data-plant="${esc(p.id)}"/>`; }
    for (const p of shown.slice().sort((a, b) => b.proxy_radius_m - a.proxy_radius_m)) {
      const c = P(p.position_m); const r = Math.max(3, p.proxy_radius_m * T.k); const col = colourOf(K, p.species_id);
      const cls = ['plant', S.selectedPlant === p.id ? 'sel' : '', p.locked ? 'locked' : '', added.has(p.id) ? 'added' : changed.has(p.id) ? 'changed' : targets.has(p.id) ? 'target' : ''].join(' ');
      h += `<circle class="${cls}" cx="${c[0]}" cy="${c[1]}" r="${r}" fill="${col}" stroke="${col}" data-plant="${esc(p.id)}" data-tip="${esc(`<i>${K.name(p.species_id)}</i><div class=m>${p.id} · ${p.role} · r ${p.proxy_radius_m} m (${p.proxy_source?.status || ''})${p.height_m != null ? ` · h ≈ ${p.height_m} m` : ' · height unknown'} · drag to move · click for evidence</div>`)}"/>`;
      if (T.k * p.proxy_radius_m > 9 && S.labels) h += `<text class="plant-label" x="${c[0]}" y="${c[1] + 3}" text-anchor="middle">${esc(K.name(p.species_id).split(' ').map((w, i) => i ? w.slice(0, 3) : w[0]).join('. '))}</text>`;
      if (changed.has(p.id)) { const q = base.get(p.id); if (q) { const c0 = P(q.position_m); h += `<line x1="${c0[0]}" y1="${c0[1]}" x2="${c[0]}" y2="${c[1]}" stroke="var(--violet)" stroke-width="1.2" stroke-dasharray="3 2"/>`; } }
    }
  }
  // scale bar + north only when grounded
  if (site.scale.status !== 'unknown') { const L = T.k >= 60 ? 1 : T.k >= 25 ? 2 : 5; const x0 = 14, y0 = H - 18; h += `<line class="scalebar" x1="${x0}" y1="${y0}" x2="${x0 + L * T.k}" y2="${y0}"/><text x="${x0}" y="${y0 - 5}" font-size="10" fill="var(--ink-2)">${L} m · ${esc(site.scale.status)}</text>`; }
  const na = (site.orientation.north_angle_degrees || 0) * Math.PI / 180; const nx = W - 26, ny = 30; h += `<g transform="translate(${nx},${ny}) rotate(${site.orientation.north_angle_degrees || 0})"><polygon class="north" points="0,-12 5,6 0,2 -5,6"/></g><text x="${nx}" y="${ny + 20}" font-size="9.5" text-anchor="middle" fill="var(--ink-3)">N${site.orientation.basis?.startsWith('assumption') ? ' (assumed up)' : ''}</text>`;
  if (!site.boundary && !site.beds.length) h += `<text x="${W / 2}" y="${H / 2 - 8}" font-size="13" text-anchor="middle" fill="var(--ink-3)">no site geometry yet</text><text x="${W / 2}" y="${H / 2 + 10}" font-size="11" text-anchor="middle" fill="var(--ink-3)">describe dimensions in the conversation, set W × H above, or draw the boundary with the Site tool</text>`;
  svg.innerHTML = h; return T;
}

// ---------------------------------------------------------------- 3D isometric proxy of the same model
export function render3D(svg, project, version, S, K) {
  const W = svg.clientWidth || 800, H = svg.clientHeight || 500; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const site = project.site; const pts = [...(site.boundary || []), ...site.beds.flatMap(b => b.polygon)]; const B = pts.length ? G.bbox(pts) : { minx: 0, miny: 0, maxx: 8, maxy: 6, w: 8, h: 6 };
  const iso = ([x, y], z = 0) => [(x - B.minx) - (y - B.miny), ((x - B.minx) + (y - B.miny)) * 0.5 - z * 0.9];
  const all = [iso([B.minx, B.miny]), iso([B.maxx, B.miny]), iso([B.maxx, B.maxy]), iso([B.minx, B.maxy]), iso([B.minx, B.maxy], 4)];
  const ib = G.bbox(all); const k = Math.min((W - 60) / Math.max(ib.w, 1), (H - 60) / Math.max(ib.h, 1)); const ox = (W - ib.w * k) / 2 - ib.minx * k, oy = (H - ib.h * k) / 2 - ib.miny * k;
  const P = (p, z = 0) => { const [u, v] = iso(p, z); return [ox + u * k, oy + v * k]; }; const poly = (pts, z = 0) => pts.map(p => P(p, z).join(',')).join(' ');
  let h = '';
  if (site.boundary) h += `<polygon class="iso-site" points="${poly(site.boundary)}"/>`;
  for (const b of site.beds) h += `<polygon class="iso-bed" points="${poly(b.polygon)}"/>`;
  for (const f of site.features) if (f.polygon) h += `<polygon class="iso-open" points="${poly(f.polygon)}"/>`;
  const items = [];
  for (const f of site.features) if (f.kind === 'existing-tree') items.push({ kind: 'tree', p: f.position_m, r: f.radius_m ?? 1.5, hgt: f.height_m ?? 5, id: f.id, label: f.label || 'existing tree', assumed: f.radius_m == null });
  const shown = S.preview ? S.preview.version.plant_objects : (version?.plant_objects || []); const removed = new Set(S.preview?.diff.removed || []), added = new Set(S.preview?.diff.added || []);
  for (const p of shown) items.push({ kind: 'plant', p: p.position_m, r: p.proxy_radius_m, hgt: p.height_m, id: p.id, species: p.species_id, sel: S.selectedPlant === p.id, added: added.has(p.id) });
  if (S.preview && version) for (const id of removed) { const p = version.plant_objects.find(q => q.id === id); items.push({ kind: 'removed', p: p.position_m, r: p.proxy_radius_m, hgt: p.height_m, id }); }
  items.sort((a, b) => (a.p[0] + a.p[1]) - (b.p[0] + b.p[1]));
  for (const it of items) {
    const base = P(it.p); const rx = it.r * k, ry = it.r * k * 0.5; const hz = it.hgt != null ? it.hgt : 0.4; const top = P(it.p, hz);
    if (it.kind === 'tree') { h += `<line class="iso-stem" x1="${base[0]}" y1="${base[1]}" x2="${top[0]}" y2="${top[1]}"/><ellipse class="iso-tree ${it.assumed ? 'iso-unknown' : ''}" cx="${top[0]}" cy="${top[1]}" rx="${rx}" ry="${ry * 1.4}"/><text x="${top[0]}" y="${top[1] - ry * 1.4 - 4}" font-size="9.5" text-anchor="middle" fill="var(--olive-deep)">${esc(it.label)} · size ${it.assumed ? 'assumed' : 'stated'}</text>`; continue; }
    const col = it.kind === 'removed' ? 'var(--rust)' : colourOf(K, it.species); const unknown = it.hgt == null;
    h += `<ellipse cx="${base[0]}" cy="${base[1]}" rx="${rx}" ry="${ry}" fill="rgba(42,39,35,.08)" stroke="none"/>`;
    if (!unknown) h += `<line class="iso-stem" x1="${base[0]}" y1="${base[1]}" x2="${top[0]}" y2="${top[1]}" ${it.kind === 'removed' ? 'stroke-dasharray="3 2"' : ''}/>`;
    h += `<ellipse class="iso-plant plant ${unknown ? 'iso-unknown' : ''} ${it.sel ? 'sel' : ''} ${it.added ? 'added' : ''} ${it.kind === 'removed' ? 'removed' : ''}" cx="${top[0]}" cy="${top[1] - (unknown ? 0 : ry * .6)}" rx="${rx}" ry="${unknown ? ry : ry * 1.3}" fill="${col}" stroke="${col}" data-plant="${esc(it.id)}" data-tip="${esc(`<i>${K.name(it.species || '')}</i><div class=m>${it.id} · ${unknown ? 'height unknown — drawn flat' : `height proxy ${it.hgt} m`} · radius proxy ${it.r} m</div>`)}"/>`;
  }
  h += `<text x="14" y="${H - 14}" font-size="10.5" fill="var(--ink-3)">isometric proxy · same object ids and positions as the plan · heights are claim proxies or unknown (flat, dashed) · not a rendering of real plants</text>`;
  svg.innerHTML = h; return { toM: null, k };
}

// ---------------------------------------------------------------- schedule, evidence, versions, assumptions (HTML)
export function scheduleHtml(version, K, project) {
  if (!version) return '<p class="faint">no design yet</p>';
  const rows = version.schedule || [];
  return `<table class="t"><tr><th>species</th><th>n</th><th>roles</th><th>proxy radius · source</th><th>site gate</th><th>function status</th></tr>${rows.map(r => { const p = version.plant_objects.find(p => p.species_id === r.species_id); const ev = K.evidence(r.species_id, project.site.conditions, { maintenance_low: !!project.brief.values.maintenance_low }); const fn = ev.functions.filter(f => f.drawn).map(f => `${f.label}: ${f.status}${f.conflict ? ' · conflict' : ''}`).join(' · ') || 'no function link'; return `<tr class="click" data-species="${esc(r.species_id)}"><td><i class="sci">${esc(K.name(r.species_id))}</i> <span class="faint">${esc(K.common(r.species_id))}</span></td><td>${r.count}</td><td>${esc(r.roles.join(', '))}</td><td>${p.proxy_radius_m} m <span class="mono faint">${esc(p.proxy_source?.claim || p.proxy_source?.status || '')}</span></td><td><span class="tag ${esc(ev.gate.overall)}">${esc(ev.gate.overall)}</span></td><td class="small">${esc(fn)}</td></tr>`; }).join('')}<tr><td><b>total</b></td><td><b>${version.plant_objects.length}</b></td><td colspan="4" class="faint small">${rows.length} species · counted from the plant objects (never stored separately) · ${esc(version.geometry_precision)}${version.geometry_precision === 'conceptual' ? ' — not for procurement' : ' — approximate, not for procurement'}</td></tr></table>`;
}
export function evidenceHtml(speciesId, K, project, plant = null) {
  const ev = K.evidence(speciesId, project.site.conditions, { maintenance_low: !!project.brief.values.maintenance_low }); const s = ev.species;
  let h = `<div class="kicker">evidence · ${plant ? esc(plant.id) + ' · ' + esc(plant.role) : 'species'}</div><h3 style="font-size:14px"><i class="sci">${esc(s.scientific_name)}</i> <span class="faint small">${esc((s.common_names || []).join(' · '))}</span></h3><p class="small muted">${esc(s.growth_form_label || '')} (${esc(s.growth_form_status || '')}) · ${esc(s.family || '')} · ${esc(String(s.origin_status || '').replace(/_/g, ' '))} · ${s.claims.live} live claims, ${s.claims.verified} human-verified · <a href="${esc(ev.explorer)}" target="_blank" rel="noopener">open in the Explorer</a></p>`;
  h += `<h4 class="kicker" style="margin-top:8px">site gates</h4>` + ['light', 'water', 'soil', 'maintenance', 'invasive'].map(k => `<div class="why"><b>${k}</b> <span class="tag ${esc(ev.gate[k].result.replace(' ', '_'))}">${esc(ev.gate[k].result)}</span> <span class="muted">${esc(ev.gate[k].detail)}</span>${ev.gate[k].claims.length ? `<details><summary>${ev.gate[k].claims.length} claim${ev.gate[k].claims.length === 1 ? '' : 's'}</summary>${ev.gate[k].claims.slice(0, 6).map(c => claimHtml(K.claimLine(c))).join('')}</details>` : ''}</div>`).join('');
  h += `<div class="why"><b>ecological value</b> <span class="tag ${esc(ev.gate.ecology.result.replace(' ', '_'))}">${esc(ev.gate.ecology.result)}</span> <span class="muted">${esc(ev.gate.ecology.detail)}</span>${ev.gate.ecology.claims.length ? `<details><summary>${ev.gate.ecology.claims.length} claims</summary>${ev.gate.ecology.claims.map(c => claimHtml(K.claimLine(c))).join('')}</details>` : ''}</div>`;
  h += `<h4 class="kicker" style="margin-top:8px">size proxy</h4><div class="why">radius ${ev.proxy.radius_m} m — ${esc(ev.proxy.radius_status)}${ev.proxy.spread.claim ? `: <span class="mono">${esc(ev.proxy.spread.claim)}</span> (${ev.proxy.spread.min}–${ev.proxy.spread.max} m, ${esc(ev.proxy.spread.note)}${ev.proxy.spread.alternatives ? `, ${ev.proxy.spread.alternatives} other range${ev.proxy.spread.alternatives === 1 ? '' : 's'}` : ''}${ev.proxy.spread.disagreement ? ', sources disagree' : ''})` : ''}<br>height ${ev.proxy.height_m != null ? `≈ ${ev.proxy.height_m} m — ${esc(ev.proxy.height.note)} <span class="mono">${esc(ev.proxy.height.claim)}</span>` : 'unknown'}${ev.proxy.height.conditions?.length ? ` <span class="faint">(stated for ${esc(ev.proxy.height.conditions.join(', '))})</span>` : ''}</div>`;
  h += `<h4 class="kicker" style="margin-top:8px">spatial functions (status · verification · conflict kept apart)</h4>` + ev.functions.map(f => `<div class="why"><b>${esc(f.label)}</b> <span class="tag ${esc(f.status)}">${esc(f.status)}</span> ${f.conflict ? '<span class="tag conflict">conflict</span>' : ''} <span class="tag ${esc(f.verification || 'none')}">${esc(f.verification || 'none')}</span><div class="m">${f.drawn ? (f.use_labels.length ? `recorded use: ${esc(f.use_labels.join(', '))} (${esc(f.use_sources.join(', '))})` : 'inferred from traits by KG-R4; no source states the use') : esc(f.verdict)}</div>${f.use_claims?.length ? `<details><summary>use claims</summary>${f.use_claims.map(c => claimHtml(K.claimLine(c))).join('')}</details>` : ''}</div>`).join('');
  if (ev.evergreen) h += `<p class="small muted">leaf retention: ${esc(ev.evergreen.join(' / '))}${ev.interest ? ` · interest: ${esc(ev.interest.join(', '))}` : ''}</p>`;
  h += `<div class="note">Shared traits never imply companion planting; a function link is never a planting verdict. Human verification and the AI source check are shown separately on every claim.</div>`;
  return h;
}
export function claimHtml(c) { return `<div class="claim">${esc(c.text)}<div class="m">${c.source_url ? `<a href="${esc(c.source_url)}" target="_blank" rel="noopener">${esc(c.source)}</a>` : esc(c.source)} · <span class="tag ${esc(c.status)}">${esc(c.status)}</span> <span class="tag ${esc(c.check)}">AI: ${esc(String(c.check).replace(/_/g, ' '))}</span>${c.conditions?.length ? ` · when ${esc(c.conditions.join(', '))}` : ''}${c.cultivar ? ` · cv. ${esc(c.cultivar)}` : ''}<br><span class="faint">${esc(c.id)}${c.context ? ` · ${esc(c.context)}` : ''}</span></div></div>`; }
export function versionsHtml(project, K, diffFn) {
  if (!project.versions.length) return '<p class="faint">no versions yet</p>';
  const cur = project.current_version_id;
  return `<table class="t"><tr><th></th><th>version</th><th>plants</th><th>species</th><th>vs parent</th><th>event</th></tr>${project.versions.slice().reverse().map(v => { const par = project.versions.find(x => x.id === v.parent_version_id); const d = diffFn(par, v); return `<tr class="click ${v.id === cur ? 'sel' : ''}" data-version="${esc(v.id)}"><td>${v.id === cur ? '●' : ''}</td><td>${esc(v.label)} <span class="mono faint">${esc(v.id)} · seed ${v.seed}</span></td><td>${v.plant_objects.length}</td><td>${(v.schedule || []).length}</td><td class="small">${par ? `+${d.added.length} −${d.removed.length} ~${d.changed.length}` : 'root'}</td><td class="small">${esc(v.edit_event ? (v.edit_event.kind === 'spatial_edit' ? `"${v.edit_event.command.utterance}"` : v.edit_event.kind) : `generated: ${(v.generator?.operators || []).join(', ')}`)}</td></tr>`; }).join('')}</table><p class="faint small">click a version to make it current (its branch becomes the redo-free present); Undo walks back along parents</p>`;
}
export function assumptionsHtml(version, project) {
  if (!version) return '<p class="faint">no design yet</p>';
  const ev = version.evaluation; let h = `<div class="cmp"><div><h4 class="kicker">measured on the model</h4><table class="t"><tr><td>bed area</td><td>${ev.bed_area_m2} m²</td></tr><tr><td>plants · species</td><td>${ev.plant_count} · ${ev.species_count}</td></tr><tr><td>by role</td><td>${esc(Object.entries(ev.by_role).map(([k, v]) => `${k} ${v}`).join(' · '))}</td></tr>${ev.edge_zones.map(z => `<tr><td>${esc(z.label)}</td><td>edge ${z.edge_length_m} m · screen row cover ${z.screen_row_cover_m} m · continuity ${z.continuity}</td></tr>`).join('')}${ev.open_zones.map(z => `<tr><td>open zone ${esc(z.id)}</td><td>${z.area_m2} m² · ${z.plants_inside} plants inside</td></tr>`).join('')}<tr><td>site gates of placed plants</td><td>pass ${ev.evidence_gates.pass} · conditional ${ev.evidence_gates.conditional} · unknown ${ev.evidence_gates.unknown}</td></tr><tr><td>cost</td><td class="faint">${esc(ev.cost_note)}</td></tr><tr><td>ecology score</td><td class="faint">${esc(ev.ecology_note)}</td></tr></table></div><div><h4 class="kicker">assumptions</h4><ul class="small">${version.assumptions.map(a => `<li>${esc(a)}</li>`).join('')}</ul><h4 class="kicker">unresolved / unknown</h4><ul class="small">${version.unresolved.map(a => `<li>${esc(a)}</li>`).join('') || '<li class="faint">none recorded</li>'}${ev.unknown_conditions.length ? `<li>site conditions unknown: ${esc(ev.unknown_conditions.join(', '))} — gates on them read "unknown", never "pass"</li>` : ''}</ul>${version.validation.issues.length ? `<h4 class="kicker">geometry checks</h4><ul class="small">${version.validation.issues.slice(0, 12).map(i => `<li><span class="tag ${esc(i.severity)}">${esc(i.severity)}</span> ${esc(i.plant_id)}: ${esc(i.text)}</li>`).join('')}${version.validation.issues.length > 12 ? `<li class="faint">+${version.validation.issues.length - 12} more</li>` : ''}</ul>` : '<p class="small ok">geometry checks: no errors</p>'}</div></div>`;
  return h;
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
