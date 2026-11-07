// Spatial design engine: deterministic, in metres, over the model and the knowledge adapter. It never invents a plant fact —
// species come from the adapter with their gate result, function status and size proxy — and it never places a plant outside an
// accepted bed, inside a no-plant zone or under a locked tree. Operators (each a real geometric rule, named on the group it makes):
//   along_edge      a row on the inside of chosen bed edges, spacing from the species' spread proxy (massing overlap 15 %)
//   stagger         a second, offset row behind the first where the bed is deep enough (layer_by_height: the first row is the taller)
//   fill_drift      a jittered hexagonal lattice over the remaining area, species assigned by a low-frequency noise field → drifts
//   repeat_accent   every n-th fill position toward the open side becomes an accent plant (repetition)
//   avoid_obstacle / keep_open   filters applied to every operator
// Local edits (reduce / increase density, remove / swap species, move away) act only on the plants inside the resolved scope and
// never move the rest. Everything carries the seed, the operator and its parameters so a version can be regenerated.
import * as G from './geom.js';
import { effectiveConditions, nextPlantId, clonePlants, diff as versionDiff, schedule } from './model.js';

const FN_LABEL = { 'z:screen': 'Screen', 'z:scrim': 'Scrim', 'z:ceiling_canopy': 'Ceiling / Canopy', 'z:ground_cover': 'Ground Cover', 'z:barrier': 'Barrier' };
const STATUS_RANK = { documented: 0, derived: 1, candidate: 2, unknown: 3 };
const GATE_RANK = { pass: 0, conditional: 1, unknown: 2, fail: 9 };

// ---------------------------------------------------------------- obstacles and placement checks
export function obstaclesFor(project, bed) {
  const out = [];
  for (const f of project.site.features) {
    if (f.kind === 'existing-tree') out.push({ id: f.id, kind: 'tree', centre: f.position_m, radius: f.radius_m ?? 1.5, radius_status: f.radius_m != null ? f.radius_status || 'user-stated' : 'assumed 1.5 m — canopy not stated', label: f.label || 'existing tree' });
    else if (f.polygon) out.push({ id: f.id, kind: f.kind, polygon: f.polygon, label: f.label || f.kind });
  }
  return out;
}
export function placeable(p, r, bed, obstacles, site) {
  if (!G.pointInPolygon(p, bed.polygon)) return { ok: false, why: 'outside the bed' };
  if (G.distToBoundary(p, bed.polygon) < r * 0.5) return { ok: false, why: 'too close to the bed edge' };
  if (site?.boundary && !G.pointInPolygon(p, site.boundary)) return { ok: false, why: 'outside the site' };
  for (const o of obstacles) {
    if (o.kind === 'tree' && G.dist(p, o.centre) < o.radius * 0.6 + r * 0.5) return { ok: false, why: `under the canopy of ${o.label}` };
    if (o.polygon && G.pointInPolygon(p, o.polygon)) return { ok: false, why: `inside the no-plant zone ${o.label}` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------- candidate assemblage (reasons kept)
export function assemble(project, K, bed) {
  const conds = effectiveConditions(project, bed.id); const prefs = { maintenance_low: !!project.brief.values.maintenance_low };
  const wanted = project.brief.functions.map(f => f.function);
  const rows = K.species.map(s => { const gate = K.gate(s.id, conds, prefs); const proxy = K.proxy(s.id, conds.light?.value); const fns = Object.fromEntries(K.d.functions.map(f => [f.id, K.functionSupport(s.id, f.id)])); return { id: s.id, name: s.scientific_name, form: s.growth_form_label, gate, proxy, fns, evergreen: K.evergreen(s.id), interest: K.interest(s.id), ecology: gate.ecology, why: [], excluded: null }; });
  const B = G.bbox(bed.polygon);
  for (const r of rows) {
    if (r.gate.overall === 'fail') r.excluded = `fails a site gate: ${['light', 'water', 'soil'].filter(k => r.gate[k].result === 'fail').map(k => r.gate[k].detail).join('; ')}`;
    else if (r.form === 'Tree' && 2 * r.proxy.radius_m > Math.min(B.w, B.h)) r.excluded = `a tree whose claimed mature spread (${r.proxy.spread.min}–${r.proxy.spread.max} m, ${r.proxy.spread.claim}) exceeds the bed (${G.round(B.w, 1)} × ${G.round(B.h, 1)} m)`;
  }
  const pool = rows.filter(r => !r.excluded);
  const rank = (r, fn) => (STATUS_RANK[r.fns[fn]?.status] ?? 3) * 10 + (r.fns[fn]?.conflict ? 4 : 0) + GATE_RANK[r.gate.overall] * 2 + (r.evergreen?.includes('Evergreen') ? 0 : 1);
  const picks = { screen: [], ground: [], accent: [], canopy: [] };
  const used = new Set();
  const take = (role, list, n, why) => { for (const r of list.slice(0, n)) { if (used.has(r.id)) continue; used.add(r.id); r.role = role; r.why.push(why(r)); picks[role].push(r); } };
  if (wanted.includes('z:screen') || wanted.includes('z:scrim')) {
    const fn = wanted.includes('z:screen') ? 'z:screen' : 'z:scrim';
    const list = pool.filter(r => r.fns[fn]?.drawn && r.form !== 'Tree').sort((a, b) => rank(a, fn) - rank(b, fn));
    take('screen', list, 2, r => `${FN_LABEL[fn]}: ${r.fns[fn].status}${r.fns[fn].conflict ? ' with a conflict (a trait claim contradicts the use)' : ''}${r.fns[fn].use_labels.length ? ` — recorded use: ${r.fns[fn].use_labels.join(', ')} (${r.fns[fn].use_sources.join(', ')})` : ' — inferred from traits (KG-R4), no source states the use'}; gate ${r.gate.overall}${r.evergreen?.includes('Evergreen') ? '; evergreen (holds the screen in winter — design heuristic)' : ''}`);
  }
  if (wanted.includes('z:ground_cover') || true) {
    const list = pool.filter(r => r.fns['z:ground_cover']?.drawn && !used.has(r.id)).sort((a, b) => rank(a, 'z:ground_cover') - rank(b, 'z:ground_cover'));
    take('ground', list, 2, r => `Ground Cover: ${r.fns['z:ground_cover'].status}${r.fns['z:ground_cover'].use_labels.length ? ` — recorded use: ${r.fns['z:ground_cover'].use_labels.join(', ')} (${r.fns['z:ground_cover'].use_sources.join(', ')})` : ' — inferred from traits (KG-R4)'}; gate ${r.gate.overall}`);
  }
  if (project.brief.values.ecology || project.brief.values.seasonal_interest) {
    const list = pool.filter(r => !used.has(r.id) && r.form !== 'Tree' && r.proxy.radius_m <= 0.6 && (r.ecology.result === 'documented' || r.interest)).sort((a, b) => GATE_RANK[a.gate.overall] - GATE_RANK[b.gate.overall] || (b.ecology.result === 'documented') - (a.ecology.result === 'documented'));
    take('accent', list, 1, r => `accent: ${r.ecology.result === 'documented' ? `ecological value recorded — ${r.ecology.detail}` : ''}${r.interest ? `${r.ecology.result === 'documented' ? '; ' : ''}interest recorded — ${r.interest.join(', ')}` : ''}; gate ${r.gate.overall}`);
  }
  if (wanted.includes('z:ceiling_canopy')) { const list = pool.filter(r => r.fns['z:ceiling_canopy']?.drawn && !used.has(r.id)).sort((a, b) => rank(a, 'z:ceiling_canopy') - rank(b, 'z:ceiling_canopy')); take('canopy', list, 1, r => `Ceiling / Canopy: ${r.fns['z:ceiling_canopy'].status}; gate ${r.gate.overall}`); }
  const notes = [];
  if ((wanted.includes('z:screen')) && !picks.screen.length) notes.push('no species in the database is linked to Screen and passes the site gates — the screened edge stays unplanted');
  if (rows.some(r => r.form === 'Tree' && r.excluded?.startsWith('a tree'))) notes.push(`no new tree placed: ${rows.filter(r => r.form === 'Tree' && r.excluded?.startsWith('a tree')).map(r => r.name).join(', ')} exceed the bed at claimed mature spread`);
  return { rows, picks, notes, conditions: conds, prefs };
}

// ---------------------------------------------------------------- zones from the brief and the bed geometry
export function zonesFor(project, bed) {
  const north = project.site.orientation.north_angle_degrees || 0; const zones = []; const site = project.site.boundary; const sc = site ? G.centroid(site) : G.centroid(bed.polygon);
  for (const f of project.brief.functions) {
    if (!['z:screen', 'z:scrim'].includes(f.function) || f.alternative) continue;
    let edges;
    if (/-edge$/.test(f.where)) edges = G.edgesFacing(bed.polygon, G.DIRECTIONS[f.where.replace('-edge', '')] ?? 0, north, 50);
    else { const Q = G.ccw(bed.polygon); edges = Q.map((p, i) => ({ i, a: p, b: Q[(i + 1) % Q.length], n: G.outwardNormal(Q, i) })).filter(e => { const m = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2]; return (m[0] - sc[0]) * e.n[0] + (m[1] - sc[1]) * e.n[1] > 0; }); }
    if (!edges.length) continue;
    zones.push({ id: `zone-${f.function.split(':')[1]}-${f.where}`, kind: 'edge', function: f.function, label: `${FN_LABEL[f.function]} along the ${f.where.replace('-', ' ')}`, edges: edges.map(e => ({ a: e.a, b: e.b, n: e.n })), priority: 1, basis: f.basis });
  }
  for (const feat of project.site.features) if (feat.kind === 'no-plant-zone' && feat.polygon) zones.push({ id: `zone-open-${feat.id}`, kind: 'open', label: feat.label || 'open (no-plant) zone', polygon: feat.polygon, priority: 1 });
  zones.push({ id: 'zone-fill', kind: 'fill', label: 'ground layer (remaining bed area)', polygon: bed.polygon, priority: 2 });
  return zones;
}

// ---------------------------------------------------------------- generation
export function generate(project, K, bedId, seed = 42, params = {}) {
  const bed = project.site.beds.find(b => b.id === bedId); if (!bed) throw new Error('no bed');
  const density = params.density ?? 1; const rand = G.rng(seed); const noise = G.valueNoise(seed + 7, params.drift_cell ?? 1.4);
  const SPACING = { screen: params.spacing_screen ?? 0.75, ground: params.spacing_ground ?? 0.65 };   // planting spacing as a fraction of the claimed mature spread (design assumption: canopies meet and overlap at maturity)
  const obstacles = obstaclesFor(project, bed); const asm = assemble(project, K, bed); const zones = zonesFor(project, bed);
  const plants = [], groups = [], assumptions = [], unresolved = [];
  let n = params.id_start ?? project.plant_seq; const nid = () => `plant-${String(++n).padStart(3, '0')}`;   // stable ids; regeneration with the same id_start reproduces them
  const ok = (p, r) => placeable(p, r, bed, obstacles, project.site).ok;
  const clear = (p, r) => plants.every(q => G.dist(p, q.position_m) >= (r + q.proxy_radius_m) * 0.6);
  const mk = (species, p, role, group, zone) => ({ id: nid(), species_id: species.id, bed_id: bed.id, position_m: G.roundPt(p), proxy_radius_m: species.proxy.radius_m, proxy_source: { claim: species.proxy.spread.claim, range_m: [species.proxy.spread.min, species.proxy.spread.max], status: species.proxy.radius_status, note: species.proxy.spread.note }, height_m: species.proxy.height_m, height_source: { claim: species.proxy.height.claim, range_m: [species.proxy.height.min, species.proxy.height.max], status: species.proxy.height_status }, role, group_id: group, zone_id: zone, locked: false, origin: 'generated' });
  // 1 · screen row(s) along each edge zone — along_edge + stagger, taller species first (layer_by_height)
  for (const z of zones.filter(z => z.kind === 'edge')) {
    const sp = asm.picks.screen; if (!sp.length) { unresolved.push(`${z.label}: no eligible species — left unplanted`); continue; }
    const g1 = { id: `group-${groups.length + 1}`, bed_id: bed.id, zone_id: z.id, role: 'screen', operator: 'along_edge', params: { spacing: `${SPACING.screen} × claimed mature spread`, inset: 'proxy radius', species: sp.map(s => s.id), alternate: sp.length > 1 }, plant_ids: [] };
    const g2 = { id: `group-${groups.length + 2}`, bed_id: bed.id, zone_id: z.id, role: 'screen-layer', operator: 'stagger', params: { offset: '1.6 × radius inward', species: [sp[sp.length - 1].id] }, plant_ids: [] };
    z.edges.forEach((e, ei) => {
      const lead = sp[0]; const r = lead.proxy.radius_m; const spacing = 2 * r * SPACING.screen / density;
      const a = [e.a[0] - e.n[0] * r, e.a[1] - e.n[1] * r], b = [e.b[0] - e.n[0] * r, e.b[1] - e.n[1] * r];
      G.alongSegment(a, b, spacing, r * 0.9).forEach((p, i) => { const s = sp.length > 1 ? sp[i % 2 === 0 ? 0 : 1] : lead; if (ok(p, s.proxy.radius_m) && clear(p, s.proxy.radius_m)) { const o = mk(s, p, 'screen', g1.id, z.id); plants.push(o); g1.plant_ids.push(o.id); } });
      // stagger a second row where the bed is deep enough (≥ 3.5 radii)
      const back = sp[sp.length - 1]; const r2 = back.proxy.radius_m; const off = r + r2 * 1.6;
      const a2 = [e.a[0] - e.n[0] * off, e.a[1] - e.n[1] * off], b2 = [e.b[0] - e.n[0] * off, e.b[1] - e.n[1] * off];
      const depthOk = G.pointInPolygon([(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2], G.inset(bed.polygon, r2 * 0.9));
      if (depthOk && params.stagger !== false) G.alongSegment(a2, b2, spacing, r * 0.9 + spacing / 2).forEach(p => { if (ok(p, r2) && clear(p, r2)) { const o = mk(back, p, 'screen-layer', g2.id, z.id); plants.push(o); g2.plant_ids.push(o.id); } });
    });
    if (g1.plant_ids.length) groups.push(g1); if (g2.plant_ids.length) groups.push(g2);
  }
  // 2 · ground drifts — fill_drift (hex lattice + seeded jitter, species by noise field)
  const gp = asm.picks.ground;
  if (gp.length) {
    const B = G.bbox(bed.polygon); const rg = gp.reduce((a, s) => a + s.proxy.radius_m, 0) / gp.length; const spacing = 2 * rg * SPACING.ground / density;
    const g = { id: `group-${groups.length + 1}`, bed_id: bed.id, zone_id: 'zone-fill', role: 'ground', operator: 'fill_drift', params: { lattice: 'hexagonal', spacing_m: G.round(spacing), spacing_rule: `${SPACING.ground} × the mean claimed mature spread of the ground species`, jitter: 0.35, species: gp.map(s => s.id), drift_field: 'value noise', seed }, plant_ids: [] };
    const pts = G.hexGrid(B, spacing, 0.35, rand).filter(p => G.pointInPolygon(p, G.inset(bed.polygon, Math.min(...gp.map(s => s.proxy.radius_m)) * 0.6)));
    const thr = gp.length > 1 ? 0.5 : 2;
    for (const p of pts) { const s = gp.length > 1 && noise(p[0], p[1]) > thr ? gp[1] : gp[0]; if (ok(p, s.proxy.radius_m) && clear(p, s.proxy.radius_m)) { const o = mk(s, p, 'ground', g.id, 'zone-fill'); plants.push(o); g.plant_ids.push(o.id); } }
    if (g.plant_ids.length) groups.push(g);
  } else unresolved.push('no ground-cover species passes the site gates — the bed interior stays unplanted');
  // 3 · accents — repeat_accent: every 4th ground plant nearest the open / front side becomes the accent species
  const ac = asm.picks.accent[0];
  if (ac && plants.some(p => p.role === 'ground')) {
    const open = zones.find(z => z.kind === 'open'); const ref = open ? G.centroid(open.polygon) : [G.bbox(bed.polygon).minx + G.bbox(bed.polygon).w / 2, G.bbox(bed.polygon).miny];
    const ground = plants.filter(p => p.role === 'ground').sort((a, b) => G.dist(a.position_m, ref) - G.dist(b.position_m, ref));
    const g = { id: `group-${groups.length + 1}`, bed_id: bed.id, zone_id: 'zone-fill', role: 'accent', operator: 'repeat_accent', params: { every: 4, toward: open ? 'the open zone' : 'the front edge', species: [ac.id] }, plant_ids: [] };
    ground.filter((_, i) => i % 4 === 1).slice(0, Math.max(2, Math.floor(ground.length / 5))).forEach(p => { p.species_id = ac.id; p.role = 'accent'; p.proxy_radius_m = ac.proxy.radius_m; p.proxy_source = { claim: ac.proxy.spread.claim, range_m: [ac.proxy.spread.min, ac.proxy.spread.max], status: ac.proxy.radius_status, note: ac.proxy.spread.note }; p.height_m = ac.proxy.height_m; p.height_source = { claim: ac.proxy.height.claim, range_m: [ac.proxy.height.min, ac.proxy.height.max], status: ac.proxy.height_status }; p.group_id = g.id; g.plant_ids.push(p.id); });
    if (g.plant_ids.length) groups.push(g);
  }
  for (const o of obstacles) if (o.kind === 'tree' && /assumed/.test(o.radius_status)) assumptions.push(`${o.label}: canopy radius ${o.radius} m is ${o.radius_status}`);
  assumptions.push(`plant sizes are proxies: half the claimed mature spread (one claim chosen per species, alternatives counted) — not measured plants; planting spacing is ${SPACING.screen} × (screen rows) and ${SPACING.ground} × (ground layer) the claimed mature spread, so canopies meet and overlap at maturity by design`);
  if (project.site.scale.status !== 'user-calibrated' && project.site.scale.status !== 'user-stated') assumptions.push('scale is not calibrated: positions are conceptual, quantities are not for procurement');
  assumptions.push(...asm.notes); unresolved.push(...project.brief.unknowns.map(u => `unknown: ${u}`));
  project.plant_seq = Math.max(project.plant_seq, n);
  const version = { label: params.label || `generated (seed ${seed})`, seed, bed_id: bed.id, generator: { operators: groups.map(g => g.operator), density, params: { ...params, id_start: params.id_start ?? (n - plants.length) } }, knowledge_snapshot: K.snapshot, geometry_precision: project.site.scale.status === 'unknown' ? 'conceptual' : 'approximate (user-calibrated)', plant_objects: plants, groups, zones, assemblage: { picks: Object.fromEntries(Object.entries(asm.picks).map(([k, v]) => [k, v.map(r => ({ id: r.id, why: r.why, gate: r.gate.overall, proxy_radius_m: r.proxy.radius_m }))])), excluded: asm.rows.filter(r => r.excluded).map(r => ({ id: r.id, reason: r.excluded })), not_used: asm.rows.filter(r => !r.excluded && !r.role).map(r => ({ id: r.id, reason: 'eligible but not needed by any zone' })) }, assumptions, unresolved, edit_event: null };
  version.schedule = schedule(version); version.validation = validate(version, project); version.evaluation = evaluate(version, project, K);
  return version;
}

// ---------------------------------------------------------------- validation (geometry) and evaluation (measurable only)
export function validate(version, project) {
  const bed = project.site.beds.find(b => b.id === version.bed_id); const obstacles = obstaclesFor(project, bed); const issues = [];
  for (const p of version.plant_objects) { const r = placeable(p.position_m, p.proxy_radius_m, bed, obstacles, project.site); if (!r.ok) issues.push({ plant_id: p.id, severity: 'error', text: r.why }); }
  const P = version.plant_objects;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const d = G.dist(P[i].position_m, P[j].position_m), s = P[i].proxy_radius_m + P[j].proxy_radius_m; if (d < s * 0.5) issues.push({ plant_id: P[i].id, other: P[j].id, severity: 'warning', text: `crowded: ${G.round(d)} m apart for proxy radii ${P[i].proxy_radius_m} + ${P[j].proxy_radius_m} m` }); }
  return { ok: !issues.some(i => i.severity === 'error'), issues };
}
export function evaluate(version, project, K) {
  const bed = project.site.beds.find(b => b.id === version.bed_id); const P = version.plant_objects; const conds = effectiveConditions(project, bed.id);
  const byRole = {}; for (const p of P) byRole[p.role] = (byRole[p.role] || 0) + 1;
  const edge = version.zones.filter(z => z.kind === 'edge').map(z => { const L = z.edges.reduce((s, e) => s + G.dist(e.a, e.b), 0); const cover = P.filter(p => p.zone_id === z.id && p.role === 'screen').reduce((s, p) => s + 2 * p.proxy_radius_m, 0); return { zone: z.id, label: z.label, edge_length_m: G.round(L), screen_row_cover_m: G.round(cover), continuity: L ? Math.min(1, G.round(cover / L)) : 0, note: 'row cover = sum of proxy diameters over edge length — a geometric proxy for continuity, not a measured screening effect' }; });
  const open = project.site.features.filter(f => f.kind === 'no-plant-zone' && f.polygon).map(f => ({ id: f.id, area_m2: G.round(G.area(f.polygon)), plants_inside: P.filter(p => G.pointInPolygon(p.position_m, f.polygon)).length }));
  const gates = {}; for (const s of new Set(P.map(p => p.species_id))) gates[s] = K.gate(s, conds, { maintenance_low: !!project.brief.values.maintenance_low }).overall;
  const evidence = { pass: P.filter(p => gates[p.species_id] === 'pass').length, conditional: P.filter(p => gates[p.species_id] === 'conditional').length, unknown: P.filter(p => gates[p.species_id] === 'unknown').length };
  return { bed_area_m2: G.round(G.area(bed.polygon)), plant_count: P.length, species_count: new Set(P.map(p => p.species_id)).size, by_role: byRole, edge_zones: edge, open_zones: open, evidence_gates: evidence, cost: null, cost_note: 'no prices in the database — not computed', ecology_score: null, ecology_note: 'no pollinator-interaction data — no score; ecological-value claims are listed per species instead', unknown_conditions: Object.entries(conds).filter(([, c]) => c.status === 'unknown').map(([k]) => k) };
}

// ---------------------------------------------------------------- local edits: preview = a new version, uncommitted, with its diff
export function previewEdit(project, K, version, cmd) {
  const bed = project.site.beds.find(b => b.id === version.bed_id); const obstacles = obstaclesFor(project, bed); const plants = clonePlants(version);
  const scopePoly = cmd.scope.polygon || bed.polygon; const inScope = p => G.pointInPolygon(p.position_m, scopePoly) && !p.locked;
  const targets = plants.filter(inScope); const notes = [], refused = [];
  const preserveScreen = cmd.preserve.some(p => p.type === 'spatial_function' && p.value === 'z:screen');
  const rand = G.rng((version.seed || 1) * 31 + project.versions.length);
  let next = plants; const removedIds = new Set(); const addedIds = [];
  for (const op of cmd.operations) {
    if (op.type === 'reduce_density') {
      let pool = targets.filter(p => !removedIds.has(p.id)); if (preserveScreen) { const kept = pool.filter(p => p.role === 'screen'); pool = pool.filter(p => p.role !== 'screen'); if (kept.length) notes.push(`${kept.length} screen-row plant${kept.length === 1 ? '' : 's'} kept untouched to preserve the screen (an intent; screening performance is not quantified)`); }
      const n = Math.ceil(pool.length * op.amount.value); const crowd = p => pool.filter(q => q !== p && G.dist(p.position_m, q.position_m) < (p.proxy_radius_m + q.proxy_radius_m) * 1.2).length;
      const order = pool.map(p => ({ p, c: crowd(p), r: rand() })).sort((a, b) => b.c - a.c || a.r - b.r).slice(0, n);
      for (const { p } of order) removedIds.add(p.id); notes.push(`reduce density by ${Math.round(op.amount.value * 100)} % (${op.amount.basis}): ${n} of ${pool.length} eligible plants removed, the most crowded first; nothing outside the scope moves`);
    } else if (op.type === 'increase_density') {
      const ground = version.assemblage?.picks?.ground || []; const sp = ground[0] ? K.sp(ground[0].id) : null; if (!sp) { refused.push('no ground-cover species in this design to add'); continue; }
      const r = ground[0].proxy_radius_m; const B = G.bbox(scopePoly); const spacing = 2 * r * 0.9 * (1 - op.amount.value); const want = Math.max(1, Math.ceil(targets.length * op.amount.value)); let added = 0;
      for (const p of G.hexGrid(B, spacing, 0.3, rand)) { if (added >= want) break; if (!G.pointInPolygon(p, scopePoly) || !placeable(p, r, bed, obstacles, project.site).ok) continue; if (next.some(q => !removedIds.has(q.id) && G.dist(p, q.position_m) < (r + q.proxy_radius_m) * 0.85)) continue; const o = { id: nextPlantId(project), species_id: sp.id, bed_id: bed.id, position_m: G.roundPt(p), proxy_radius_m: r, proxy_source: { ...(plants.find(q => q.species_id === sp.id)?.proxy_source || { status: 'proxy' }) }, height_m: plants.find(q => q.species_id === sp.id)?.height_m ?? null, height_source: plants.find(q => q.species_id === sp.id)?.height_source || { status: 'unknown' }, role: 'ground', group_id: 'edit', zone_id: 'zone-fill', locked: false, origin: 'edit:increase_density' }; next.push(o); addedIds.push(o.id); added++; }
      notes.push(`increase density by ${Math.round(op.amount.value * 100)} %: ${added} ${sp.scientific_name} added inside the scope where spacing allows`);
    } else if (op.type === 'remove_species') {
      if (!op.species_id) { refused.push(`"${op.phrase}" does not match a species in this design`); continue; } const hit = targets.filter(p => p.species_id === op.species_id && !removedIds.has(p.id)); hit.forEach(p => removedIds.add(p.id)); notes.push(`remove ${K.name(op.species_id)}: ${hit.length} plant${hit.length === 1 ? '' : 's'} inside the scope`);
    } else if (op.type === 'swap_species') {
      if (!op.from_species_id || !op.to_species_id) { refused.push(`"${op.phrase}": one of the species names was not recognised`); continue; } const to = K.sp(op.to_species_id); const proxy = K.proxy(to.id, effectiveConditions(project, bed.id).light?.value); const gate = K.gate(to.id, effectiveConditions(project, bed.id)); if (gate.overall === 'fail') { refused.push(`${to.scientific_name} fails a site gate (${['light', 'water', 'soil'].filter(k => gate[k].result === 'fail').map(k => gate[k].detail).join('; ')}) — not swapped in`); continue; }
      let n = 0; for (const p of targets) if (p.species_id === op.from_species_id && !removedIds.has(p.id)) { p.species_id = to.id; p.proxy_radius_m = proxy.radius_m; p.proxy_source = { claim: proxy.spread.claim, range_m: [proxy.spread.min, proxy.spread.max], status: proxy.radius_status, note: proxy.spread.note }; p.height_m = proxy.height_m; p.height_source = { claim: proxy.height.claim, range_m: [proxy.height.min, proxy.height.max], status: proxy.height_status }; p.origin = 'edit:swap'; n++; }
      notes.push(`swap ${K.name(op.from_species_id)} → ${to.scientific_name}: ${n} plants; gate ${gate.overall}; proxy radius ${proxy.radius_m} m`);
    } else if (op.type === 'move_away') {
      const feat = project.site.features.find(f => f.id === op.feature_id); if (!feat) { refused.push(`"${op.phrase}" does not match a site feature (tree, path, open zone)`); continue; }
      const ref = feat.position_m || G.centroid(feat.polygon); const fr = feat.radius_m ?? (feat.polygon ? 0 : 1.5);
      const pick = targets.filter(p => !removedIds.has(p.id)).filter(p => op.filter === 'taller' ? p.height_m != null && p.height_m >= 1 : op.filter === 'lower' ? p.height_m != null && p.height_m < 1 : op.filter === 'all' ? true : p.species_id === op.filter);
      const skipped = targets.filter(p => op.filter === 'taller' && p.height_m == null); if (skipped.length) notes.push(`${skipped.length} plant${skipped.length === 1 ? '' : 's'} with unknown height not moved (height is not invented)`);
      let moved = 0, stuck = 0;
      for (const p of pick) { const d0 = feat.polygon ? G.distToBoundary(p.position_m, feat.polygon) : G.dist(p.position_m, ref); const want = fr + p.proxy_radius_m + 0.5; if (d0 >= want) continue; const dx = p.position_m[0] - ref[0], dy = p.position_m[1] - ref[1], l = Math.hypot(dx, dy) || 1; let placed = false; for (let step = 0.25; step <= 3; step += 0.25) { const q = [p.position_m[0] + dx / l * step, p.position_m[1] + dy / l * step]; const dq = feat.polygon ? G.distToBoundary(q, feat.polygon) : G.dist(q, ref); if (dq >= want && placeable(q, p.proxy_radius_m, bed, obstacles, project.site).ok && next.every(o => o.id === p.id || removedIds.has(o.id) || G.dist(q, o.position_m) >= (p.proxy_radius_m + o.proxy_radius_m) * 0.8)) { p.position_m = G.roundPt(q); p.origin = 'edit:move_away'; placed = true; break; } } if (placed) moved++; else stuck++; }
      notes.push(`move ${op.filter} plants away from ${feat.label || feat.kind}: ${moved} moved${stuck ? `, ${stuck} could not be moved within the bed` : ''}`);
    } else if (op.type === 'fill_with_tall') refused.push('filling an open zone with tall plants would break the keep-open constraint — refused; remove the no-plant zone first if that is intended');
  }
  next = next.filter(p => !removedIds.has(p.id));
  const v = { label: `edit: ${cmd.utterance.slice(0, 60)}`, seed: version.seed, bed_id: version.bed_id, generator: version.generator, knowledge_snapshot: version.knowledge_snapshot, geometry_precision: version.geometry_precision, plant_objects: next, groups: version.groups.map(g => ({ ...g, plant_ids: g.plant_ids.filter(id => !removedIds.has(id)) })), zones: version.zones, assemblage: version.assemblage, assumptions: version.assumptions, unresolved: version.unresolved, edit_event: { kind: 'spatial_edit', command: cmd, target_ids: targets.map(p => p.id), removed_ids: [...removedIds], added_ids: addedIds, notes, refused } };
  v.schedule = schedule(v); v.validation = validate(v, project); v.evaluation = evaluate(v, project, K);
  const d = versionDiff(version, v);
  const outside = version.plant_objects.filter(p => !inScope(p)); const outsideChanged = outside.filter(p => { const q = v.plant_objects.find(x => x.id === p.id); return !q || q.position_m[0] !== p.position_m[0] || q.position_m[1] !== p.position_m[1] || q.species_id !== p.species_id; });
  return { version: v, diff: d, targets: targets.map(p => p.id), notes, refused, untouched_outside_scope: outsideChanged.length === 0, outside_changed: outsideChanged.map(p => p.id), privacy_guarantee: false, screen_continuity: { before: version.evaluation?.edge_zones || [], after: v.evaluation.edge_zones } };
}

// ---------------------------------------------------------------- direct manipulation (same model, same checks)
export function directEdit(project, K, version, action) {
  const bed = project.site.beds.find(b => b.id === version.bed_id); const obstacles = obstaclesFor(project, bed); const plants = clonePlants(version); const notes = [];
  if (action.kind === 'move') { const p = plants.find(p => p.id === action.id); if (!p) return null; if (p.locked) return { refused: 'locked object' }; const chk = placeable(action.to, p.proxy_radius_m, bed, obstacles, project.site); p.position_m = G.roundPt(action.to); p.origin = 'user-moved'; notes.push(chk.ok ? `${p.id} moved to ${p.position_m.join(', ')} m` : `${p.id} moved to ${p.position_m.join(', ')} m — warning: ${chk.why}`); }
  if (action.kind === 'delete') { const i = plants.findIndex(p => p.id === action.id); if (i < 0) return null; if (plants[i].locked) return { refused: 'locked object' }; notes.push(`${plants[i].id} (${K.name(plants[i].species_id)}) deleted`); plants.splice(i, 1); }
  if (action.kind === 'add') { const sp = K.sp(action.species_id); const proxy = K.proxy(sp.id, effectiveConditions(project, bed.id).light?.value); const chk = placeable(action.at, proxy.radius_m, bed, obstacles, project.site); const o = { id: nextPlantId(project), species_id: sp.id, bed_id: bed.id, position_m: G.roundPt(action.at), proxy_radius_m: proxy.radius_m, proxy_source: { claim: proxy.spread.claim, range_m: [proxy.spread.min, proxy.spread.max], status: proxy.radius_status, note: proxy.spread.note }, height_m: proxy.height_m, height_source: { claim: proxy.height.claim, range_m: [proxy.height.min, proxy.height.max], status: proxy.height_status }, role: action.role || 'user-added', group_id: 'user', zone_id: null, locked: false, origin: 'user-added' }; plants.push(o); notes.push(chk.ok ? `${o.id} ${sp.scientific_name} added` : `${o.id} ${sp.scientific_name} added — warning: ${chk.why}`); }
  const v = { ...version, id: undefined, created: undefined, parent_version_id: undefined, label: `direct edit: ${action.kind}`, plant_objects: plants, groups: version.groups.map(g => ({ ...g, plant_ids: g.plant_ids.filter(id => plants.some(p => p.id === id)) })), edit_event: { kind: `direct:${action.kind}`, action, notes } };
  v.schedule = schedule(v); v.validation = validate(v, project); v.evaluation = evaluate(v, project, K);
  return { version: v, diff: versionDiff(version, v), notes };
}
export function regenerateSame(project, K, version) { return generate(project, K, version.bed_id, version.seed, { ...version.generator.params, id_start: version.generator.params?.id_start ?? 0, label: version.label }); }
