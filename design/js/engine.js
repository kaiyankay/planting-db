// Spatial design engine (Level 3: Plant Arrangement): deterministic, in metres, over the model and the knowledge adapter. It
// never invents a plant fact — species come from the adapter with their gate result, function status and size proxy — and it
// never places a plant outside a bed, inside a hole or a no-plant zone, or under a locked tree. It runs per planting bed and
// composes one DesignVersion from any number of beds (plant ids continue across beds; every object carries its bed_id).
// Operators (each a real geometric rule, named on the group it makes):
//   along_edge      a row on the inside of chosen bed edges, spacing from the species' spread proxy (massing overlap 15 %)
//   stagger         a second, offset row behind the first where the bed is deep enough (layer_by_height: the first row is the taller)
//   fill_drift      a jittered hexagonal lattice over the remaining area, species assigned by a low-frequency noise field → drifts
//   repeat_accent   every n-th fill position toward the open side becomes an accent plant (repetition)
//   avoid_obstacle / keep_open   filters applied to every operator
// Local edits (reduce / increase density, remove / swap species, move away) act only on the plants inside the resolved scope and
// never move the rest. Geometry updates regenerate only the beds whose outline changed and keep every other bed's plants, user
// edits included. Everything carries the seed, the operator and its parameters so a version can be regenerated.
import * as G from './geom.js';
import { effectiveConditions, nextPlantId, clonePlants, diff as versionDiff, schedule, bedShape, bedFingerprint } from './model.js';

const FN_LABEL = { 'z:screen': 'Screen', 'z:scrim': 'Scrim', 'z:ceiling_canopy': 'Ceiling / Canopy', 'z:ground_cover': 'Ground Cover', 'z:barrier': 'Barrier' };
const STATUS_RANK = { documented: 0, derived: 1, candidate: 2, unknown: 3 };
const GATE_RANK = { pass: 0, conditional: 1, unknown: 2, fail: 9 };
const bedOf = (project, id) => project.site.beds.find(b => b.id === id) || null;
const bedAt = (project, p) => project.site.beds.find(b => b.status !== 'rejected' && G.pointInShape(p, bedShape(b))) || null;

// ---------------------------------------------------------------- obstacles and placement checks
export function obstaclesFor(project) {
  const out = [];
  for (const f of project.site.features) {
    if (f.kind === 'existing-tree') out.push({ id: f.id, kind: 'tree', centre: f.position_m, radius: f.radius_m ?? 1.5, radius_status: f.radius_m != null ? f.radius_status || 'user-stated' : 'assumed 1.5 m — canopy not stated', label: f.label || 'existing tree' });
    else if (f.polygon) out.push({ id: f.id, kind: f.kind, polygon: f.polygon, label: f.label || f.kind });
  }
  return out;
}
export function placeable(p, r, bed, obstacles, site) {
  if (!bed) return { ok: false, why: 'no bed' };
  const shape = bedShape(bed);
  if (!G.pointInShape(p, shape)) return { ok: false, why: (bed.holes || []).some(h => G.pointInPolygon(p, h)) ? 'inside a hole of the bed' : 'outside the bed' };
  if (G.distToShapeEdge(p, shape) < r * 0.5) return { ok: false, why: 'too close to the bed edge' };
  if (site?.boundary && !G.pointInPolygon(p, site.boundary)) return { ok: false, why: 'outside the site' };
  for (const o of obstacles) {
    if (o.kind === 'tree' && G.dist(p, o.centre) < o.radius * 0.6 + r * 0.5) return { ok: false, why: `under the canopy of ${o.label}` };
    if (o.polygon && G.pointInPolygon(p, o.polygon)) return { ok: false, why: `inside the no-plant zone ${o.label}` };
  }
  return { ok: true };
}
const wantedFunctions = (project, bed) => (bed?.functions?.length ? bed.functions : project.brief.functions.filter(f => !f.alternative));

// ---------------------------------------------------------------- candidate assemblage per bed (reasons kept)
export function assemble(project, K, bed) {
  const conds = effectiveConditions(project, bed.id); const prefs = { maintenance_low: !!project.brief.values.maintenance_low };
  const wanted = wantedFunctions(project, bed).map(f => f.function);
  const rows = K.species.map(s => { const gate = K.gate(s.id, conds, prefs); const proxy = K.proxy(s.id, conds.light?.value); const fns = Object.fromEntries(K.d.functions.map(f => [f.id, K.functionSupport(s.id, f.id)])); return { id: s.id, name: s.scientific_name, form: s.growth_form_label, gate, proxy, fns, evergreen: K.evergreen(s.id), interest: K.interest(s.id), ecology: gate.ecology, why: [], excluded: null }; });
  const B = G.bbox(bed.polygon); const narrow = bed.min_width_m != null ? bed.min_width_m : Math.min(B.w, B.h);
  for (const r of rows) {
    if (r.gate.overall === 'fail') r.excluded = `fails a site gate: ${['light', 'water', 'soil'].filter(k => r.gate[k].result === 'fail').map(k => r.gate[k].detail).join('; ')}`;
    else if (r.form === 'Tree' && 2 * r.proxy.radius_m > Math.min(B.w, B.h)) r.excluded = `a tree whose claimed mature spread (${r.proxy.spread.min}–${r.proxy.spread.max} m, ${r.proxy.spread.claim}) exceeds the bed (${G.round(B.w, 1)} × ${G.round(B.h, 1)} m)`;
    else if (r.form !== 'Tree' && 2 * r.proxy.radius_m > narrow * 1.6 && narrow < 1.2) r.excluded = `claimed mature spread ${r.proxy.spread.min}–${r.proxy.spread.max} m is wider than this ${narrow} m bed allows`;
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
  { const list = pool.filter(r => r.fns['z:ground_cover']?.drawn && !used.has(r.id)).sort((a, b) => rank(a, 'z:ground_cover') - rank(b, 'z:ground_cover'));
    take('ground', list, 2, r => `Ground Cover: ${r.fns['z:ground_cover'].status}${r.fns['z:ground_cover'].use_labels.length ? ` — recorded use: ${r.fns['z:ground_cover'].use_labels.join(', ')} (${r.fns['z:ground_cover'].use_sources.join(', ')})` : ' — inferred from traits (KG-R4)'}; gate ${r.gate.overall}`); }
  if (project.brief.values.ecology || project.brief.values.seasonal_interest) {
    const list = pool.filter(r => !used.has(r.id) && r.form !== 'Tree' && r.proxy.radius_m <= 0.6 && (r.ecology.result === 'documented' || r.interest)).sort((a, b) => GATE_RANK[a.gate.overall] - GATE_RANK[b.gate.overall] || (b.ecology.result === 'documented') - (a.ecology.result === 'documented'));
    take('accent', list, 1, r => `accent: ${r.ecology.result === 'documented' ? `ecological value recorded — ${r.ecology.detail}` : ''}${r.interest ? `${r.ecology.result === 'documented' ? '; ' : ''}interest recorded — ${r.interest.join(', ')}` : ''}; gate ${r.gate.overall}`);
  }
  if (wanted.includes('z:ceiling_canopy')) { const list = pool.filter(r => r.fns['z:ceiling_canopy']?.drawn && !used.has(r.id)).sort((a, b) => rank(a, 'z:ceiling_canopy') - rank(b, 'z:ceiling_canopy')); take('canopy', list, 1, r => `Ceiling / Canopy: ${r.fns['z:ceiling_canopy'].status}; gate ${r.gate.overall}`); }
  const notes = [];
  if (wanted.includes('z:screen') && !picks.screen.length) notes.push(`${bed.name}: no species in the database is linked to Screen and passes the site gates — the screened edge stays unplanted`);
  if (rows.some(r => r.form === 'Tree' && r.excluded?.startsWith('a tree'))) notes.push(`${bed.name}: no new tree placed — ${rows.filter(r => r.form === 'Tree' && r.excluded?.startsWith('a tree')).map(r => r.name).join(', ')} exceed the bed at claimed mature spread`);
  return { rows, picks, notes, conditions: conds, prefs, wanted };
}

// ---------------------------------------------------------------- zones from the bed's functions (or the brief's) and its geometry
export function zonesFor(project, bed) {
  const north = project.site.orientation.north_angle_degrees || 0; const zones = []; const site = project.site.boundary; const sc = site ? G.centroid(site) : G.centroid(bed.polygon);
  const onBoundary = e => !site || G.distToBoundary([(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2], site) < 0.15;
  for (const f of wantedFunctions(project, bed)) {
    if (!['z:screen', 'z:scrim'].includes(f.function) || f.alternative) continue;
    let edges;
    if (/-edge$/.test(f.where)) { edges = G.edgesFacing(bed.polygon, G.DIRECTIONS[f.where.replace('-edge', '')] ?? 0, north, 50); const ob = edges.filter(onBoundary); if (ob.length) edges = ob; }
    else { const Q = G.ccw(bed.polygon); edges = Q.map((p, i) => ({ i, a: p, b: Q[(i + 1) % Q.length], n: G.outwardNormal(Q, i) })).filter(e => { const m = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2]; return (m[0] - sc[0]) * e.n[0] + (m[1] - sc[1]) * e.n[1] > 0; }); const ob = edges.filter(onBoundary); if (ob.length) edges = ob; }
    if (!edges.length) continue;
    zones.push({ id: `zone-${f.function.split(':')[1]}-${f.where}-${bed.id}`, bed_id: bed.id, kind: 'edge', function: f.function, label: `${FN_LABEL[f.function]} along the ${f.where.replace('-', ' ')} (${bed.name})`, edges: edges.map(e => ({ a: e.a, b: e.b, n: e.n })), priority: 1, basis: f.basis });
  }
  for (const feat of project.site.features) if (feat.kind === 'no-plant-zone' && feat.polygon) zones.push({ id: `zone-open-${feat.id}-${bed.id}`, bed_id: bed.id, kind: 'open', label: feat.label || 'open (no-plant) zone', polygon: feat.polygon, priority: 1 });
  zones.push({ id: `zone-fill-${bed.id}`, bed_id: bed.id, kind: 'fill', label: `ground layer (${bed.name})`, polygon: bed.polygon, priority: 2 });
  return zones;
}

// ---------------------------------------------------------------- generation (one bed → plants; many beds → one version)
function generateBed(project, K, bed, seed, params, nid, existing) {
  const density = params.density ?? 1; const rand = G.rng(seed + hashId(bed.id)); const noise = G.valueNoise(seed + 7 + hashId(bed.id), params.drift_cell ?? 1.4);
  const SPACING = { screen: params.spacing_screen ?? 0.75, ground: params.spacing_ground ?? 0.65 };
  const obstacles = obstaclesFor(project); const asm = assemble(project, K, bed); const zones = zonesFor(project, bed);
  const plants = [], groups = [], unresolved = []; const shape = bedShape(bed);
  const ok = (p, r) => placeable(G.roundPt(p), r, bed, obstacles, project.site).ok;   // checked on the rounded point the object will carry
  const clear = (p, r) => plants.every(q => G.dist(p, q.position_m) >= (r + q.proxy_radius_m) * 0.6) && existing.every(q => G.dist(p, q.position_m) >= (r + q.proxy_radius_m) * 0.6);
  const mk = (species, p, role, group, zone) => ({ id: nid(), species_id: species.id, bed_id: bed.id, position_m: G.roundPt(p), proxy_radius_m: species.proxy.radius_m, proxy_source: { claim: species.proxy.spread.claim, range_m: [species.proxy.spread.min, species.proxy.spread.max], status: species.proxy.radius_status, note: species.proxy.spread.note }, height_m: species.proxy.height_m, height_source: { claim: species.proxy.height.claim, range_m: [species.proxy.height.min, species.proxy.height.max], status: species.proxy.height_status }, role, group_id: group, zone_id: zone, locked: false, origin: 'generated' });
  for (const z of zones.filter(z => z.kind === 'edge')) {
    const sp = asm.picks.screen; if (!sp.length) { unresolved.push(`${z.label}: no eligible species — left unplanted`); continue; }
    const g1 = { id: `group-${bed.id}-${groups.length + 1}`, bed_id: bed.id, zone_id: z.id, role: 'screen', operator: 'along_edge', params: { spacing: `${SPACING.screen} × claimed mature spread`, inset: 'proxy radius', species: sp.map(s => s.id), alternate: sp.length > 1 }, plant_ids: [] };
    const g2 = { id: `group-${bed.id}-${groups.length + 2}`, bed_id: bed.id, zone_id: z.id, role: 'screen-layer', operator: 'stagger', params: { offset: '1.6 × radius inward', species: [sp[sp.length - 1].id] }, plant_ids: [] };
    z.edges.forEach(e => {
      const lead = sp[0]; const r = lead.proxy.radius_m; const spacing = 2 * r * SPACING.screen / density;
      const a = [e.a[0] - e.n[0] * r, e.a[1] - e.n[1] * r], b = [e.b[0] - e.n[0] * r, e.b[1] - e.n[1] * r];
      G.alongSegment(a, b, spacing, r * 0.9).forEach((p, i) => { const s = sp.length > 1 ? sp[i % 2 === 0 ? 0 : 1] : lead; if (ok(p, s.proxy.radius_m) && clear(p, s.proxy.radius_m)) { const o = mk(s, p, 'screen', g1.id, z.id); plants.push(o); g1.plant_ids.push(o.id); } });
      const back = sp[sp.length - 1]; const r2 = back.proxy.radius_m; const off = r + r2 * 1.6;
      const a2 = [e.a[0] - e.n[0] * off, e.a[1] - e.n[1] * off], b2 = [e.b[0] - e.n[0] * off, e.b[1] - e.n[1] * off];
      const mid = [(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2]; const depthOk = G.pointInShape(mid, shape) && G.distToShapeEdge(mid, shape) >= r2 * 0.9;
      if (depthOk && params.stagger !== false) G.alongSegment(a2, b2, spacing, r * 0.9 + spacing / 2).forEach(p => { if (ok(p, r2) && clear(p, r2)) { const o = mk(back, p, 'screen-layer', g2.id, z.id); plants.push(o); g2.plant_ids.push(o.id); } });
    });
    if (g1.plant_ids.length) groups.push(g1); if (g2.plant_ids.length) groups.push(g2);
  }
  const gp = asm.picks.ground;
  if (gp.length) {
    const B = G.bbox(bed.polygon); const rg = gp.reduce((a, s) => a + s.proxy.radius_m, 0) / gp.length; const spacing = 2 * rg * SPACING.ground / density;
    const g = { id: `group-${bed.id}-${groups.length + 1}`, bed_id: bed.id, zone_id: `zone-fill-${bed.id}`, role: 'ground', operator: 'fill_drift', params: { lattice: 'hexagonal', spacing_m: G.round(spacing), spacing_rule: `${SPACING.ground} × the mean claimed mature spread of the ground species`, jitter: 0.35, species: gp.map(s => s.id), drift_field: 'value noise', seed }, plant_ids: [] };
    const rmin = Math.min(...gp.map(s => s.proxy.radius_m)) * 0.6;
    const pts = G.hexGrid(B, spacing, 0.35, rand).filter(p => G.pointInShape(p, shape) && G.distToShapeEdge(p, shape) >= rmin);
    const thr = gp.length > 1 ? 0.5 : 2;
    for (const p of pts) { const s = gp.length > 1 && noise(p[0], p[1]) > thr ? gp[1] : gp[0]; if (ok(p, s.proxy.radius_m) && clear(p, s.proxy.radius_m)) { const o = mk(s, p, 'ground', g.id, g.zone_id); plants.push(o); g.plant_ids.push(o.id); } }
    if (g.plant_ids.length) groups.push(g);
  } else unresolved.push(`${bed.name}: no ground-cover species passes the site gates — the bed interior stays unplanted`);
  const ac = asm.picks.accent[0];
  if (ac && plants.some(p => p.role === 'ground')) {
    const open = zones.find(z => z.kind === 'open'); const ref = open ? G.centroid(open.polygon) : [G.bbox(bed.polygon).minx + G.bbox(bed.polygon).w / 2, G.bbox(bed.polygon).miny];
    const ground = plants.filter(p => p.role === 'ground').sort((a, b) => G.dist(a.position_m, ref) - G.dist(b.position_m, ref));
    const g = { id: `group-${bed.id}-${groups.length + 1}`, bed_id: bed.id, zone_id: `zone-fill-${bed.id}`, role: 'accent', operator: 'repeat_accent', params: { every: 4, toward: open ? 'the open zone' : 'the front edge', species: [ac.id] }, plant_ids: [] };
    ground.filter((_, i) => i % 4 === 1).slice(0, Math.max(2, Math.floor(ground.length / 5))).forEach(p => { p.species_id = ac.id; p.role = 'accent'; p.proxy_radius_m = ac.proxy.radius_m; p.proxy_source = { claim: ac.proxy.spread.claim, range_m: [ac.proxy.spread.min, ac.proxy.spread.max], status: ac.proxy.radius_status, note: ac.proxy.spread.note }; p.height_m = ac.proxy.height_m; p.height_source = { claim: ac.proxy.height.claim, range_m: [ac.proxy.height.min, ac.proxy.height.max], status: ac.proxy.height_status }; p.group_id = g.id; g.plant_ids.push(p.id); });
    if (g.plant_ids.length) groups.push(g);
  }
  if (!plants.length && bed.area_m2 > 0) unresolved.push(`${bed.name}: no plant fitted (${bed.area_m2} m², narrowest ${bed.min_width_m ?? '?'} m)`);
  return { plants, groups, zones, asm, unresolved, obstacles };
}
function hashId(s) { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 1000; }
const asList = x => Array.isArray(x) ? x : [x];
export function generate(project, K, bedIds, seed = 42, params = {}) {
  const ids = asList(bedIds); const beds = ids.map(id => bedOf(project, id)).filter(Boolean); if (!beds.length) throw new Error('no bed');
  let n = params.id_start ?? project.plant_seq; const nid = () => `plant-${String(++n).padStart(3, '0')}`;
  const plants = [], groups = [], zones = [], assumptions = [], unresolved = []; const assemblages = {}; const obstacles = obstaclesFor(project);
  for (const bed of beds) { const r = generateBed(project, K, bed, seed, params, nid, plants); plants.push(...r.plants); groups.push(...r.groups); zones.push(...r.zones); unresolved.push(...r.unresolved); assemblages[bed.id] = { picks: Object.fromEntries(Object.entries(r.asm.picks).map(([k, v]) => [k, v.map(x => ({ id: x.id, why: x.why, gate: x.gate.overall, proxy_radius_m: x.proxy.radius_m }))])), excluded: r.asm.rows.filter(x => x.excluded).map(x => ({ id: x.id, reason: x.excluded })), not_used: r.asm.rows.filter(x => !x.excluded && !x.role).map(x => ({ id: x.id, reason: 'eligible but not needed by any zone' })), wanted: r.asm.wanted, notes: r.asm.notes }; assumptions.push(...r.asm.notes); for (const u of bed.under_canopy || []) assumptions.push(`${bed.name}: ${u.m2} m² under ${u.label} — shade planting there is conditional (light under the canopy not recorded)`); }
  for (const o of obstacles) if (o.kind === 'tree' && /assumed/.test(o.radius_status)) assumptions.push(`${o.label}: canopy radius ${o.radius} m is ${o.radius_status}`);
  assumptions.push(`plant sizes are proxies: half the claimed mature spread (one claim chosen per species, alternatives counted) — not measured plants; planting spacing is ${params.spacing_screen ?? 0.75} × (screen rows) and ${params.spacing_ground ?? 0.65} × (ground layer) the claimed mature spread, so canopies meet and overlap at maturity by design`);
  if (project.site.scale.status !== 'user-calibrated' && project.site.scale.status !== 'user-stated') assumptions.push('scale is not calibrated: positions are conceptual, quantities are not for procurement');
  unresolved.push(...project.brief.unknowns.map(u => `unknown: ${u}`));
  project.plant_seq = Math.max(project.plant_seq, n);
  const merged = { picks: { screen: [], ground: [], accent: [], canopy: [] }, excluded: [], not_used: [] }; for (const a of Object.values(assemblages)) { for (const k of Object.keys(merged.picks)) for (const x of a.picks[k]) if (!merged.picks[k].some(y => y.id === x.id)) merged.picks[k].push(x); for (const e of a.excluded) if (!merged.excluded.some(y => y.id === e.id)) merged.excluded.push(e); }
  merged.not_used = K.species.filter(s => !Object.values(merged.picks).flat().some(x => x.id === s.id) && !merged.excluded.some(e => e.id === s.id)).map(s => ({ id: s.id, reason: 'eligible but not needed by any zone' }));
  const version = { label: params.label || `generated (seed ${seed})`, seed, bed_id: beds[0].id, bed_ids: beds.map(b => b.id), bed_fps: Object.fromEntries(beds.map(b => [b.id, bedFingerprint(b)])), generator: { operators: [...new Set(groups.map(g => g.operator))], density: params.density ?? 1, params: { ...params, id_start: params.id_start ?? (n - plants.length) } }, knowledge_snapshot: K.snapshot, geometry_precision: project.site.scale.status === 'unknown' ? 'conceptual' : `approximate (${project.site.scale.status})`, plant_objects: plants, groups, zones, assemblage: merged, assemblages, assumptions, unresolved, edit_event: null };
  version.schedule = schedule(version); version.validation = validate(version, project); version.evaluation = evaluate(version, project, K);
  return version;
}

// ---------------------------------------------------------------- validation (geometry) and evaluation (measurable only)
export function validate(version, project) {
  const obstacles = obstaclesFor(project); const issues = [];
  for (const p of version.plant_objects) { const bed = bedOf(project, p.bed_id); if (!bed) { issues.push({ plant_id: p.id, severity: 'error', text: `its bed ${p.bed_id} no longer exists` }); continue; } const r = placeable(p.position_m, p.proxy_radius_m, bed, obstacles, project.site); if (!r.ok) issues.push({ plant_id: p.id, severity: 'error', text: r.why }); }
  const P = version.plant_objects;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const d = G.dist(P[i].position_m, P[j].position_m), s = P[i].proxy_radius_m + P[j].proxy_radius_m; if (d < s * 0.5) issues.push({ plant_id: P[i].id, other: P[j].id, severity: 'warning', text: `crowded: ${G.round(d)} m apart for proxy radii ${P[i].proxy_radius_m} + ${P[j].proxy_radius_m} m` }); }
  return { ok: !issues.some(i => i.severity === 'error'), issues };
}
export function evaluate(version, project, K) {
  const beds = (version.bed_ids || [version.bed_id]).map(id => bedOf(project, id)).filter(Boolean); const P = version.plant_objects;
  const byRole = {}; for (const p of P) byRole[p.role] = (byRole[p.role] || 0) + 1;
  const edge = version.zones.filter(z => z.kind === 'edge').map(z => { const L = z.edges.reduce((s, e) => s + G.dist(e.a, e.b), 0); const cover = P.filter(p => p.zone_id === z.id && p.role === 'screen').reduce((s, p) => s + 2 * p.proxy_radius_m, 0); return { zone: z.id, bed_id: z.bed_id, label: z.label, edge_length_m: G.round(L), screen_row_cover_m: G.round(cover), continuity: L ? Math.min(1, G.round(cover / L)) : 0, note: 'row cover = sum of proxy diameters over edge length — a geometric proxy for continuity, not a measured screening effect' }; });
  const open = project.site.features.filter(f => f.kind === 'no-plant-zone' && f.polygon).map(f => ({ id: f.id, area_m2: G.round(G.area(f.polygon)), plants_inside: P.filter(p => G.pointInPolygon(p.position_m, f.polygon)).length }));
  const gates = {}; const evidence = { pass: 0, conditional: 0, unknown: 0 };
  for (const p of P) { const k = `${p.species_id}|${p.bed_id}`; if (!gates[k]) gates[k] = K.gate(p.species_id, effectiveConditions(project, p.bed_id), { maintenance_low: !!project.brief.values.maintenance_low }).overall; if (evidence[gates[k]] != null) evidence[gates[k]]++; }
  const perBed = beds.map(b => ({ bed_id: b.id, name: b.name, area_m2: b.area_m2, plants: P.filter(p => p.bed_id === b.id).length, species: new Set(P.filter(p => p.bed_id === b.id).map(p => p.species_id)).size, functions: (b.functions || []).map(f => f.function) }));
  return { bed_area_m2: G.round(beds.reduce((s, b) => s + (b.area_m2 || 0), 0)), beds: perBed, plant_count: P.length, species_count: new Set(P.map(p => p.species_id)).size, by_role: byRole, edge_zones: edge, open_zones: open, evidence_gates: evidence, cost: null, cost_note: 'no prices in the database — not computed', ecology_score: null, ecology_note: 'no pollinator-interaction data — no score; ecological-value claims are listed per species instead', unknown_conditions: Object.entries(project.site.conditions).filter(([, c]) => c.status === 'unknown').map(([k]) => k) };
}

// ---------------------------------------------------------------- local edits: preview = a new version, uncommitted, with its diff
export function previewEdit(project, K, version, cmd) {
  const obstacles = obstaclesFor(project); const plants = clonePlants(version);
  const scopePoly = cmd.scope.polygon || project.site.boundary || (bedOf(project, version.bed_id)?.polygon); const inScope = p => (!scopePoly || G.pointInPolygon(p.position_m, scopePoly)) && !p.locked;
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
      const r = ground[0].proxy_radius_m; const B = G.bbox(scopePoly || project.site.boundary); const spacing = 2 * r * 0.9 * (1 - op.amount.value); const want = Math.max(1, Math.ceil(targets.length * op.amount.value)); let added = 0;
      for (const p0 of G.hexGrid(B, spacing, 0.3, rand)) { const p = G.roundPt(p0); if (added >= want) break; if (scopePoly && !G.pointInPolygon(p, scopePoly)) continue; const bed = bedAt(project, p); if (!bed || !placeable(p, r, bed, obstacles, project.site).ok) continue; if (next.some(q => !removedIds.has(q.id) && G.dist(p, q.position_m) < (r + q.proxy_radius_m) * 0.85)) continue; const tpl = plants.find(q => q.species_id === sp.id); const o = { id: nextPlantId(project), species_id: sp.id, bed_id: bed.id, position_m: G.roundPt(p), proxy_radius_m: r, proxy_source: { ...(tpl?.proxy_source || { status: 'proxy' }) }, height_m: tpl?.height_m ?? null, height_source: tpl?.height_source || { status: 'unknown' }, role: 'ground', group_id: 'edit', zone_id: `zone-fill-${bed.id}`, locked: false, origin: 'edit:increase_density' }; next.push(o); addedIds.push(o.id); added++; }
      notes.push(`increase density by ${Math.round(op.amount.value * 100)} %: ${added} ${sp.scientific_name} added inside the scope where spacing allows`);
    } else if (op.type === 'remove_species') {
      if (!op.species_id) { refused.push(`"${op.phrase}" does not match a species in this design`); continue; } const hit = targets.filter(p => p.species_id === op.species_id && !removedIds.has(p.id)); hit.forEach(p => removedIds.add(p.id)); notes.push(`remove ${K.name(op.species_id)}: ${hit.length} plant${hit.length === 1 ? '' : 's'} inside the scope`);
    } else if (op.type === 'swap_species') {
      if (!op.from_species_id || !op.to_species_id) { refused.push(`"${op.phrase}": one of the species names was not recognised`); continue; } const to = K.sp(op.to_species_id); const conds = effectiveConditions(project, targets[0]?.bed_id || version.bed_id); const proxy = K.proxy(to.id, conds.light?.value); const gate = K.gate(to.id, conds); if (gate.overall === 'fail') { refused.push(`${to.scientific_name} fails a site gate (${['light', 'water', 'soil'].filter(k => gate[k].result === 'fail').map(k => gate[k].detail).join('; ')}) — not swapped in`); continue; }
      let n = 0; for (const p of targets) if (p.species_id === op.from_species_id && !removedIds.has(p.id)) { p.species_id = to.id; p.proxy_radius_m = proxy.radius_m; p.proxy_source = { claim: proxy.spread.claim, range_m: [proxy.spread.min, proxy.spread.max], status: proxy.radius_status, note: proxy.spread.note }; p.height_m = proxy.height_m; p.height_source = { claim: proxy.height.claim, range_m: [proxy.height.min, proxy.height.max], status: proxy.height_status }; p.origin = 'edit:swap'; n++; }
      notes.push(`swap ${K.name(op.from_species_id)} → ${to.scientific_name}: ${n} plants; gate ${gate.overall}; proxy radius ${proxy.radius_m} m`);
    } else if (op.type === 'move_away') {
      const feat = project.site.features.find(f => f.id === op.feature_id); if (!feat) { refused.push(`"${op.phrase}" does not match a site feature (tree, path, open zone)`); continue; }
      const ref = feat.position_m || G.centroid(feat.polygon); const fr = feat.radius_m ?? (feat.polygon ? 0 : 1.5);
      const pick = targets.filter(p => !removedIds.has(p.id)).filter(p => op.filter === 'taller' ? p.height_m != null && p.height_m >= 1 : op.filter === 'lower' ? p.height_m != null && p.height_m < 1 : op.filter === 'all' ? true : p.species_id === op.filter);
      const skipped = targets.filter(p => op.filter === 'taller' && p.height_m == null); if (skipped.length) notes.push(`${skipped.length} plant${skipped.length === 1 ? '' : 's'} with unknown height not moved (height is not invented)`);
      let moved = 0, stuck = 0;
      for (const p of pick) { const bed = bedOf(project, p.bed_id); const d0 = feat.polygon ? G.distToBoundary(p.position_m, feat.polygon) : G.dist(p.position_m, ref); const want = fr + p.proxy_radius_m + 0.5; if (d0 >= want) continue; const dx = p.position_m[0] - ref[0], dy = p.position_m[1] - ref[1], l = Math.hypot(dx, dy) || 1; let placed = false; for (let step = 0.25; step <= 3; step += 0.25) { const q = G.roundPt([p.position_m[0] + dx / l * step, p.position_m[1] + dy / l * step]); const dq = feat.polygon ? G.distToBoundary(q, feat.polygon) : G.dist(q, ref); if (dq >= want && placeable(q, p.proxy_radius_m, bed, obstacles, project.site).ok && next.every(o => o.id === p.id || removedIds.has(o.id) || G.dist(q, o.position_m) >= (p.proxy_radius_m + o.proxy_radius_m) * 0.8)) { p.position_m = G.roundPt(q); p.origin = 'edit:move_away'; placed = true; break; } } if (placed) moved++; else stuck++; }
      notes.push(`move ${op.filter} plants away from ${feat.label || feat.kind}: ${moved} moved${stuck ? `, ${stuck} could not be moved within the bed` : ''}`);
    } else if (op.type === 'fill_with_tall') refused.push('filling an open zone with tall plants would break the keep-open constraint — refused; remove the no-plant zone first if that is intended');
  }
  next = next.filter(p => !removedIds.has(p.id));
  const v = { label: `edit: ${cmd.utterance.slice(0, 60)}`, seed: version.seed, bed_id: version.bed_id, bed_ids: version.bed_ids, bed_fps: version.bed_fps, generator: version.generator, knowledge_snapshot: version.knowledge_snapshot, geometry_precision: version.geometry_precision, plant_objects: next, groups: version.groups.map(g => ({ ...g, plant_ids: g.plant_ids.filter(id => !removedIds.has(id)) })), zones: version.zones, assemblage: version.assemblage, assemblages: version.assemblages, assumptions: version.assumptions, unresolved: version.unresolved, edit_event: { kind: 'spatial_edit', command: cmd, target_ids: targets.map(p => p.id), removed_ids: [...removedIds], added_ids: addedIds, notes, refused } };
  v.schedule = schedule(v); v.validation = validate(v, project); v.evaluation = evaluate(v, project, K);
  const d = versionDiff(version, v);
  const outside = version.plant_objects.filter(p => !inScope(p)); const outsideChanged = outside.filter(p => { const q = v.plant_objects.find(x => x.id === p.id); return !q || q.position_m[0] !== p.position_m[0] || q.position_m[1] !== p.position_m[1] || q.species_id !== p.species_id; });
  return { version: v, diff: d, targets: targets.map(p => p.id), notes, refused, untouched_outside_scope: outsideChanged.length === 0, outside_changed: outsideChanged.map(p => p.id), privacy_guarantee: false, screen_continuity: { before: version.evaluation?.edge_zones || [], after: v.evaluation.edge_zones } };
}

// ---------------------------------------------------------------- direct manipulation (same model, same checks)
export function directEdit(project, K, version, action) {
  const obstacles = obstaclesFor(project); const plants = clonePlants(version); const notes = [];
  if (action.kind === 'move') { const p = plants.find(p => p.id === action.id); if (!p) return null; if (p.locked) return { refused: 'locked object' }; const target = bedAt(project, action.to) || bedOf(project, p.bed_id); const chk = placeable(action.to, p.proxy_radius_m, target, obstacles, project.site); p.position_m = G.roundPt(action.to); if (target && target.id !== p.bed_id && chk.ok) { notes.push(`${p.id} moved from ${p.bed_id} to ${target.id}`); p.bed_id = target.id; } p.origin = 'user-moved'; notes.push(chk.ok ? `${p.id} moved to ${p.position_m.join(', ')} m` : `${p.id} moved to ${p.position_m.join(', ')} m — warning: ${chk.why}`); }
  if (action.kind === 'delete') { const i = plants.findIndex(p => p.id === action.id); if (i < 0) return null; if (plants[i].locked) return { refused: 'locked object' }; notes.push(`${plants[i].id} (${K.name(plants[i].species_id)}) deleted`); plants.splice(i, 1); }
  if (action.kind === 'add') { const bed = bedAt(project, action.at); if (!bed) return { refused: 'outside every planting bed — add plants inside a bed' }; const sp = K.sp(action.species_id); const proxy = K.proxy(sp.id, effectiveConditions(project, bed.id).light?.value); const chk = placeable(action.at, proxy.radius_m, bed, obstacles, project.site); const o = { id: nextPlantId(project), species_id: sp.id, bed_id: bed.id, position_m: G.roundPt(action.at), proxy_radius_m: proxy.radius_m, proxy_source: { claim: proxy.spread.claim, range_m: [proxy.spread.min, proxy.spread.max], status: proxy.radius_status, note: proxy.spread.note }, height_m: proxy.height_m, height_source: { claim: proxy.height.claim, range_m: [proxy.height.min, proxy.height.max], status: proxy.height_status }, role: action.role || 'user-added', group_id: 'user', zone_id: null, locked: false, origin: 'user-added' }; plants.push(o); notes.push(chk.ok ? `${o.id} ${sp.scientific_name} added in ${bed.name}` : `${o.id} ${sp.scientific_name} added — warning: ${chk.why}`); }
  const v = { ...version, id: undefined, created: undefined, parent_version_id: undefined, label: `direct edit: ${action.kind}`, plant_objects: plants, groups: version.groups.map(g => ({ ...g, plant_ids: g.plant_ids.filter(id => plants.some(p => p.id === id)) })), edit_event: { kind: `direct:${action.kind}`, action, notes } };
  v.schedule = schedule(v); v.validation = validate(v, project); v.evaluation = evaluate(v, project, K);
  return { version: v, diff: versionDiff(version, v), notes };
}
export function regenerateSame(project, K, version) { return generate(project, K, version.bed_ids || version.bed_id, version.seed, { ...version.generator.params, id_start: version.generator.params?.id_start ?? 0, label: version.label }); }

// ---------------------------------------------------------------- geometry updates: what changed since the version, and a partial regeneration
export function geometryImpact(project, version) {
  if (!version) return null; const fps = version.bed_fps || { [version.bed_id]: null }; const now = Object.fromEntries(project.site.beds.filter(b => b.status !== 'rejected').map(b => [b.id, bedFingerprint(b)]));
  const changed = Object.keys(fps).filter(id => now[id] && now[id] !== fps[id]), removed = Object.keys(fps).filter(id => !now[id]), added = Object.keys(now).filter(id => !fps[id]);
  const obstacles = obstaclesFor(project); const invalid = version.plant_objects.filter(p => { const b = bedOf(project, p.bed_id); return !b || b.status === 'rejected' || !placeable(p.position_m, p.proxy_radius_m, b, obstacles, project.site).ok; });
  return { changed, removed, added, stale: changed.length + removed.length + added.length > 0, invalid_plants: invalid.map(p => p.id), untouched: Object.keys(fps).filter(id => now[id] && now[id] === fps[id]), user_edited_in_changed: version.plant_objects.filter(p => (changed.includes(p.bed_id) || removed.includes(p.bed_id)) && /^user|^edit/.test(p.origin || '')).map(p => p.id) };
}
/** regenerate only the given beds; every other bed's plants (user edits included) stay exactly as they are; user-placed plants in a
 *  changed bed are kept when they are still valid there. */
export function regenerateBeds(project, K, version, bedIds, params = {}) {
  const ids = asList(bedIds); const keepBeds = new Set((version.bed_ids || [version.bed_id]).filter(id => !ids.includes(id) && bedOf(project, id) && bedOf(project, id).status !== 'rejected'));
  const obstacles = obstaclesFor(project); const kept = clonePlants(version).filter(p => keepBeds.has(p.bed_id)); const keptUser = [];
  for (const p of version.plant_objects) if (ids.includes(p.bed_id) && /^user|^edit/.test(p.origin || '')) { const b = bedOf(project, p.bed_id); if (b && placeable(p.position_m, p.proxy_radius_m, b, obstacles, project.site).ok) keptUser.push({ ...p, position_m: [...p.position_m] }); }
  const liveIds = ids.filter(id => bedOf(project, id) && bedOf(project, id).status !== 'rejected'); const allIds = [...keepBeds, ...liveIds]; const seed = params.seed ?? version.seed;
  const fresh = liveIds.length ? generate(project, K, liveIds, seed, { ...version.generator.params, ...params, id_start: project.plant_seq, label: undefined }) : null;
  const plants = [...kept, ...keptUser]; const fresh2 = fresh ? fresh.plant_objects.filter(p => !keptUser.some(u => G.dist(u.position_m, p.position_m) < (u.proxy_radius_m + p.proxy_radius_m) * 0.6)) : [];
  plants.push(...fresh2);
  const v = { label: `geometry update: ${liveIds.map(id => bedOf(project, id)?.name || id).join(', ') || 'beds removed'}`, seed, bed_id: allIds[0] || version.bed_id, bed_ids: allIds, bed_fps: Object.fromEntries(allIds.map(id => [id, bedFingerprint(bedOf(project, id))])), generator: { ...version.generator, operators: [...new Set([...version.generator.operators, ...(fresh?.generator.operators || [])])] }, knowledge_snapshot: K.snapshot, geometry_precision: project.site.scale.status === 'unknown' ? 'conceptual' : `approximate (${project.site.scale.status})`, plant_objects: plants, groups: [...version.groups.filter(g => keepBeds.has(g.bed_id)).map(g => ({ ...g, plant_ids: g.plant_ids.filter(id => plants.some(p => p.id === id)) })), ...(fresh?.groups || []).map(g => ({ ...g, plant_ids: g.plant_ids.filter(id => plants.some(p => p.id === id)) }))], zones: [...version.zones.filter(z => keepBeds.has(z.bed_id)), ...(fresh?.zones || [])], assemblage: fresh ? fresh.assemblage : version.assemblage, assemblages: { ...Object.fromEntries(Object.entries(version.assemblages || {}).filter(([k]) => keepBeds.has(k))), ...(fresh?.assemblages || {}) }, assumptions: fresh ? fresh.assumptions : version.assumptions, unresolved: fresh ? fresh.unresolved : version.unresolved, edit_event: { kind: 'geometry_update', regenerated_beds: liveIds, kept_beds: [...keepBeds], removed_beds: ids.filter(id => !liveIds.includes(id)), kept_user_plants: keptUser.map(p => p.id), notes: [`${kept.length} plants in ${keepBeds.size} unchanged bed${keepBeds.size === 1 ? '' : 's'} kept exactly`, keptUser.length ? `${keptUser.length} user-placed plants kept in the changed bed${liveIds.length === 1 ? '' : 's'}` : null, fresh ? `${fresh2.length} plants regenerated for ${liveIds.map(id => bedOf(project, id)?.name).join(', ')}` : null].filter(Boolean) } };
  v.schedule = schedule(v); v.validation = validate(v, project); v.evaluation = evaluate(v, project, K);
  return { version: v, diff: versionDiff(version, v), targets: version.plant_objects.filter(p => !keepBeds.has(p.bed_id)).map(p => p.id), notes: v.edit_event.notes, refused: [], untouched_outside_scope: true, outside_changed: [], privacy_guarantee: false, screen_continuity: { before: version.evaluation?.edge_zones || [], after: v.evaluation.edge_zones } };
}
