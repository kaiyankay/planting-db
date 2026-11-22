// Planting systems (presets). A spatial function says WHAT the planting does on a bed (Screen, Ground Cover). A planting system
// says HOW the plant community is organised to do it: which functional layers it has, what a species must show to play each role,
// which arrangement operators set the layers out, which parameters the designer may turn, and what is measured afterwards.
//
// A preset is DATA plus rules — never a species list. No species id appears in this file. Each layer names requirements; every
// requirement is answered from the knowledge adapter (knowledge.js: claims, gates, function links) or from the geometry of the bed.
// A layer with no qualifying species stays empty and says why; nothing is substituted. The planting engine (engine.js) asks this
// file for the layer plan and then places the plants with its own operators — there is one engine, and this is not a second one.
//
// Method reference (structure only, no plant parameter is taken from it): D. Cortes, "Generative Planting at Scale" (lecture slides,
// 2024-10-07) — plants categorised in layers by functional role (p. 28–32), "substitute species, but maintain functional layers
// and roles" (p. 32), layer sets by typology incl. Matrix based and Under trees (p. 34), matrix base then long-lived perennials
// (p. 35–36). The slides give the vocabulary of roles; which species can play a role here is decided only by this database.

export const SCHEMA = 'planting-intelligence/planting-system/0.1';
const FIT_RANK = { meets: 0, uncertain: 1, fails: 9 };
export const fitOf = checks => { const rs = Object.values(checks).map(c => c.result); return rs.includes('fails') ? 'fails' : rs.every(r => r === 'meets') ? 'meets' : 'uncertain'; };
const SHADIER = { 'full-sun': 'part-shade', 'part-shade': 'shade', 'partial-shade': 'shade', shade: 'shade', 'filtered-shade': 'deep-shade', 'deep-shade': 'deep-shade' };
const REF = 'Cortes 2024, Generative Planting at Scale';

/** rule sources used below: claim = read from the database · geometry = follows from shapes · heuristic = a designer's working rule set by
 *  the implementer, adjustable, not from a source · method = the structure of the system follows the cited teaching material */
export const PRESETS = {
  'layered-screen': {
    id: 'layered-screen', version: '0.1', title: 'Layered Screening', short: 'a boundary screen with a lower layer at its foot',
    answers: 'A screen is built as a structure layer along the edge, a lower ground layer at its foot and, where a species qualifies, a seasonal accent — three roles with different heights, not one hedge.',
    intended_functions: ['z:screen', 'z:ground_cover'],
    applicable_context: { requires: [{ ctx: 'function', fn: 'z:screen', text: 'the bed has a Screen function' }, { ctx: 'edge', fn: 'z:screen', text: 'the Screen names an edge this bed has' }], caveats: [{ ctx: 'light_unknown', text: 'site light is not stated: every role is filled on an uncertain site check' }, { ctx: 'canopy', text: 'part of the bed lies under an existing canopy: light there is a range, and the row keeps clear of the trunk' }] },
    functional_layers: [
      { role: 'structural-screen', label: 'Structure layer', slot: 'screen', function: 'z:screen', required: true, max_species: 2, text: 'the row that screens: reaches the target height, evidenced for Screen, fits the bed depth', requires: [{ check: 'function', fn: 'z:screen' }] },
      { role: 'ground-matrix', label: 'Ground layer at the foot', slot: 'ground', function: 'z:ground_cover', required: true, max_species: 'matrix_species', text: 'covers the ground in front of the row and stays below it', requires: [{ check: 'function', fn: 'z:ground_cover' }, { check: 'lower_than', layer: 'structural-screen' }] },
      { role: 'seasonal-accent', label: 'Seasonal accent', slot: 'accent', function: null, required: false, max_species: 1, text: 'a small plant with recorded seasonal interest or ecological value, repeated through the ground layer', requires: [{ check: 'fits_bed' }, { check: 'site' }, { check: 'form', not: ['Tree'] }, { check: 'small', max_radius_m: 0.6 }, { check: 'interest_or_ecology' }, { check: 'lower_than', layer: 'structural-screen' }] },
    ],
    arrangement: { kind: 'edge-row-and-foot', implemented: true, operators: ['along_edge', 'stagger', 'fill_drift | fill_rhythm | fill_patch', 'repeat_accent'], text: 'the structure layer stands in a row on the screened edge (a second staggered row where the bed is deep enough); the ground layer fills what the row leaves free; every n-th ground position toward the open side becomes an accent' },
    tunable_parameters: {
      accent_every: { label: 'Accent ratio', kind: 'ratio', default: 4, options: [{ id: 0, label: 'None' }, { id: 6, label: '1 in 6' }, { id: 4, label: '1 in 4' }, { id: 3, label: '1 in 3' }], source: 'heuristic', text: 'how many ground positions one accent replaces' },
      matrix_species: { label: 'Ground layer mix', kind: 'count', default: 2, options: [{ id: 1, label: '1 species' }, { id: 2, label: '2 species' }, { id: 3, label: '3 species' }], source: 'heuristic', text: 'how many qualifying species share the ground layer' },
    },
    shared_parameters: ['rows', 'density', 'pattern', 'grain'],   /* the composition controls of engine.js COMPOSITION, unchanged */
    evaluation_metrics: [{ id: 'role_fulfilment', label: 'Roles filled' }, { id: 'screen_continuity', label: 'Screen continuity' }, { id: 'layer_separation', label: 'Height between layers' }, { id: 'ground_cover', label: 'Ground under crowns' }, { id: 'accents', label: 'Accents placed' }],
    rule_provenance: { structure: { source: 'method', ref: `${REF}, p. 28–32: spatial layers by functional role` }, qualification: { source: 'claim', text: 'function links, claimed heights, site gates and recorded interest of the knowledge base' }, numbers: { source: 'heuristic', text: 'accent ratio, mix size, and every spacing factor of the arrangement engine' }, limits: ['"lower than the structure layer" compares claimed mature heights, not measured plants', 'no claim in the database says two species grow well together: the layers are a spatial rule, not a recorded plant association'] },
  },
  'woodland-edge': {
    id: 'woodland-edge', version: '0.1', title: 'Woodland Edge', short: 'layers organised by an existing tree',
    answers: 'The existing tree is the top layer. Under its crown a shade-tolerant, winter-present ground layer; around the crown edge taller shrubs in loose groups; beyond it an open ground layer for the stated site light.',
    intended_functions: ['z:ground_cover'],
    applicable_context: { requires: [{ ctx: 'existing_tree', text: 'the site has an existing tree' }, { ctx: 'canopy_reach', text: 'its crown, or the band around the crown edge, reaches this bed' }], caveats: [{ ctx: 'canopy_assumed', text: 'the crown radius is assumed, not stated: the zones move with it' }, { ctx: 'tree_unrecorded', text: 'the tree\'s species, height and density of shade are not recorded' }, { ctx: 'wants_screen', text: 'this system sets no continuous row: a Screen wanted on this bed is reported as not met' }, { ctx: 'light_unknown', text: 'site light is not stated: shade under the crown cannot be read as a range from it' }] },
    functional_layers: [
      { role: 'existing-canopy', label: 'Canopy (existing tree)', slot: null, source: 'site', function: 'z:ceiling_canopy', required: true, text: 'the tree that is already there. It is a site feature, not a plant object: nothing is planted for this layer, and no new tree is placed' },
      { role: 'winter-ground', label: 'Ground layer under the crown', slot: 'ground_canopy', zone: 'under-canopy', function: 'z:ground_cover', required: true, max_species: 2, text: 'ground cover that keeps its leaves and tolerates the shadier light under the crown', requires: [{ check: 'function', fn: 'z:ground_cover' }, { check: 'shade_under_canopy' }, { check: 'evergreen' }] },
      { role: 'understory-shrub', label: 'Shrubs at the crown edge', slot: 'understory', zone: 'canopy-edge', function: null, required: false, max_species: 1, text: 'shrubs taller than the ground layer, tolerant of the shadier light, in loose groups around the crown edge', requires: [{ check: 'fits_bed' }, { check: 'site' }, { check: 'form', any: ['Shrub'] }, { check: 'shade_under_canopy' }, { check: 'taller_than', layer: 'winter-ground' }, { check: 'fits_zone', zone: 'canopy-edge' }] },
      { role: 'open-ground', label: 'Ground layer beyond the crown', slot: 'ground', zone: 'beyond-canopy', function: 'z:ground_cover', required: false, max_species: 2, text: 'ground cover for the site light as stated, outside the crown edge', requires: [{ check: 'function', fn: 'z:ground_cover' }] },
      { role: 'spring-ephemeral', label: 'Spring ephemerals', slot: null, function: null, required: false, max_species: 1, text: 'plants that flower and die back before the canopy closes', requires: [{ check: 'facet_label', facet: 'phenology', any: ['Spring ephemeral'] }] },
    ],
    arrangement: { kind: 'canopy-gradient', implemented: true, operators: ['zone_by_canopy', 'cluster_at_canopy_edge', 'fill_drift | fill_rhythm | fill_patch'], text: 'the bed is read by distance from the trunk: kept free close to it; ground layer under the crown; shrub groups in a band astride the crown edge; open ground layer beyond' },
    tunable_parameters: {
      edge_band_m: { label: 'Crown-edge band', kind: 'depth', default: 1.2, options: [{ id: 0.8, label: '0.8 m' }, { id: 1.2, label: '1.2 m' }, { id: 1.6, label: '1.6 m' }], source: 'heuristic', text: 'depth of the band astride the crown edge where the shrub groups may stand' },
      cluster_size: { label: 'Shrub group', kind: 'ratio', default: 3, options: [{ id: 0, label: 'None' }, { id: 1, label: 'Singles' }, { id: 3, label: 'Threes' }, { id: 5, label: 'Fives' }], source: 'heuristic', text: 'how many shrubs form one group' },
    },
    shared_parameters: ['density', 'pattern', 'grain'],
    evaluation_metrics: [{ id: 'role_fulfilment', label: 'Roles filled' }, { id: 'canopy_ground', label: 'Ground under the crown covered' }, { id: 'winter_presence', label: 'Winter-present ground plants' }, { id: 'understory', label: 'Shrub groups' }, { id: 'ground_cover', label: 'Ground under crowns' }],
    rule_provenance: { structure: { source: 'method', ref: `${REF}, p. 34: planting layers by functional roles, "Under trees"` }, qualification: { source: 'claim', text: 'recorded light labels (filtered / deep shade), leaf retention, growth form, function links, claimed heights' }, numbers: { source: 'heuristic', text: 'band depth, group size, the canopy keep-out (0.6 × crown radius) and every spacing factor' }, limits: ['the light under the crown is not measured: it is read as "the stated site light or one step shadier"', 'the slide\'s roles "clumping" and "clonal spreading" are not used: the database records habit words (spreading, dense, upright), not how a plant spreads', 'root competition and dry shade under a tree are not modelled'] },
  },
  matrix: {
    id: 'matrix', version: '0.1', title: 'Matrix Planting', short: 'a stable base with emergents through it',
    answers: 'A long-lived base of a few species covers the ground; emergent perennials rise through it; short-lived fillers close gaps in the first years.',
    intended_functions: ['z:ground_cover'],
    applicable_context: { requires: [{ ctx: 'function', fn: 'z:ground_cover', text: 'the bed has a Ground Cover function' }], caveats: [] },
    functional_layers: [
      { role: 'matrix-base', label: 'Long-lived matrix', slot: 'ground', function: 'z:ground_cover', required: true, max_species: 2, text: 'grasses or sedges that hold the ground for many years', requires: [{ check: 'form', any: ['Grass', 'Sedge', 'Rush', 'Graminoid'] }, { check: 'facet_label', facet: 'longevity', any: ['Long-lived'] }] },
      { role: 'emergent', label: 'Emergent perennials', slot: null, function: null, required: true, max_species: 3, text: 'taller, long-lived perennials standing through the matrix', requires: [{ check: 'form', any: ['Herbaceous perennial'] }, { check: 'facet_label', facet: 'longevity', any: ['Long-lived'] }, { check: 'taller_than', layer: 'matrix-base' }] },
      { role: 'dynamic-filler', label: 'Dynamic fillers', slot: null, function: null, required: false, max_species: 2, text: 'short-lived, self-seeding plants for the first years', requires: [{ check: 'facet_label', facet: 'longevity', any: ['Short-lived', 'Annual', 'Biennial'] }] },
    ],
    arrangement: { kind: 'matrix-and-emergents', implemented: false, operators: [], text: 'not implemented: no matrix operator exists, because no species qualifies for the base layer' },
    tunable_parameters: {}, shared_parameters: [],
    evaluation_metrics: [{ id: 'role_fulfilment', label: 'Roles filled' }],
    rule_provenance: { structure: { source: 'method', ref: `${REF}, p. 34–36: "Matrix based" — long lived matrix, emergent forbs, groundcovers, dynamic fillers` }, qualification: { source: 'claim', text: 'growth form and a longevity record — the database has neither a grass or sedge nor a longevity facet' }, numbers: { source: 'heuristic', text: 'none set' }, limits: ['kept in the catalogue to show what the knowledge base would need; it cannot be chosen'] },
  },
};
export const presetOf = id => PRESETS[id] || null;
export const presetList = () => Object.values(PRESETS);
/** the system a bed is planted with: null when none is chosen (the engine then arranges the bed's functions directly, as before) */
export function systemOf(bed) { const c = bed?.composition; const p = c?.system ? PRESETS[c.system] : null; if (!p || !p.arrangement.implemented) return null; return { id: p.id, preset: p, params: paramsOf(p, c.system_params) }; }
export function paramsOf(preset, given = {}) { const out = {}; for (const [k, d] of Object.entries(preset.tunable_parameters)) { const v = given?.[k]; out[k] = d.options.some(o => o.id === v) ? v : d.default; } return out; }

// ---------------------------------------------------------------- one requirement → one check { result, detail, source, claims }
const C = (result, detail, source = 'claim', claims = []) => ({ result, detail, source, claims });
/** ctx (built by the engine for one bed): K · conds · rows (species rows with gate, proxy, form, excluded) · fn(row, fnId) → the engine's own
 *  function checks · picked(layerRole) → rows already chosen for an earlier layer · light (site light word or null) */
export function check(req, r, ctx) {
  const K = ctx.K;
  switch (req.check) {
    case 'function': { const cs = ctx.fn(r, req.fn); return cs || { evidence: C('fails', `no ${req.fn.replace('z:', '').replace('_', ' ')} check for this bed`) }; }   /* a dict of checks: spread into the candidate */
    case 'site': return r.gate.overall === 'fail' ? C('fails', `fails a site gate: ${['light', 'water', 'soil'].filter(k => r.gate[k].result === 'fail').map(k => r.gate[k].detail).join('; ')}`, 'claim', ['light', 'water', 'soil'].flatMap(k => r.gate[k].claims || [])) : r.gate.overall === 'pass' ? C('meets', 'passes the light, water and soil gates') : C('uncertain', `site gates ${r.gate.overall}: ${['light', 'water', 'soil'].filter(k => r.gate[k].result !== 'pass').map(k => `${k} ${r.gate[k].result}`).join(', ')}`);
    case 'fits_bed': return r.excluded && !/site gate/.test(r.excluded) ? C('fails', r.excluded, 'geometry') : C('meets', `crown radius ${r.proxy.radius_m} m fits the bed`, 'geometry', r.proxy.spread.claim ? [r.proxy.spread.claim] : []);
    case 'form': { const f = r.form; if (req.any) return req.any.includes(f) ? C('meets', `growth form ${f}`, 'claim') : C('fails', `growth form ${f || 'not recorded'} — this role needs ${req.any.join(' or ')}`, 'claim'); return (req.not || []).includes(f) ? C('fails', `growth form ${f} — not used for this role`, 'claim') : C('meets', `growth form ${f || 'not recorded'}`, 'claim'); }
    case 'small': return r.proxy.radius_m <= req.max_radius_m ? C('meets', `crown radius ${r.proxy.radius_m} m (limit ${req.max_radius_m} m)`, 'heuristic', r.proxy.spread.claim ? [r.proxy.spread.claim] : []) : C('fails', `crown radius ${r.proxy.radius_m} m is over the ${req.max_radius_m} m this role allows (heuristic)`, 'heuristic');
    case 'interest_or_ecology': { const eco = r.ecology?.result === 'documented', int = !!r.interest; return eco || int ? C('meets', [eco ? `ecological value recorded: ${r.ecology.detail}` : null, int ? `interest recorded: ${r.interest.join(', ')}` : null].filter(Boolean).join('; '), 'claim', r.ecology?.claims || []) : C('fails', 'no seasonal interest and no ecological value recorded — not evidence of absence, but nothing to choose it by'); }
    case 'evergreen': { const y = K.yearRound(r.id); return C(y.result, y.result === 'meets' ? `${y.detail}: present in winter` : y.detail, 'claim', y.claims || []); }
    case 'shade_under_canopy': {
      const w = ctx.light; if (!w) return C('uncertain', 'site light is not stated: the shadier light under the crown cannot be named, so the plant\'s shade record cannot be compared');
      const shade = SHADIER[w] || w; const ev = K.lightEvidence(r.id, shade); const got = ev.readings.filter(x => x.state !== 'none'); const labels = [...new Set(got.flatMap(x => x.labels))]; const claims = [...new Set(got.flatMap(x => x.claims))];
      if (ev.state === 'not recorded') return C('uncertain', 'no light record for this plant');
      if (!got.length) return C('fails', `no tolerance of ${shade.replace('-', ' ')} recorded (site light ${w}, one step shadier under the crown)${ev.lighter.labels.length ? ` — records ${ev.lighter.labels.join(', ')} only` : ''}`, 'claim', ev.lighter.claims);
      return ev.state === 'supports' ? C('meets', `records ${labels.join(', ')} — fits ${w} and one step shadier`, 'claim', claims) : C('uncertain', `records ${labels.join(', ')}${ev.qualifiers.length ? `, with a qualifier: ${ev.qualifiers[0]}` : `, not every reading of “${shade}”`}`, 'claim', claims);
    }
    case 'lower_than': case 'taller_than': {
      const ref = ctx.picked(req.layer)[0]; const name = ctx.layerLabel(req.layer); if (!ref) return C('uncertain', `${name} has no species, so there is nothing to compare the height with`, 'geometry');
      const h = r.proxy.height_m, top = r.proxy.height_max_claimed_m ?? r.proxy.height?.max ?? h, low = r.proxy.height?.min ?? h; const rh = ref.proxy.height_m; if (h == null || rh == null) return C('uncertain', 'a mature height is not recorded for one of the two', 'claim');
      const cl = [r.proxy.height.claim, ref.proxy.height.claim].filter(Boolean); const mine = `claimed mature height ${r.proxy.height.min ?? '?'}–${r.proxy.height.max ?? '?'} m`; const theirs = `${name.toLowerCase()} (${K.name(ref.id)}, ${ref.proxy.height.min ?? '?'}–${ref.proxy.height.max ?? '?'} m)`;
      if (req.check === 'lower_than') return h >= rh ? C('fails', `${mine} is not below the ${theirs}`, 'claim', cl) : top >= rh ? C('uncertain', `${mine} is below the ${theirs} at the height used for the plan, but another claimed range reaches ${top} m`, 'claim', cl) : C('meets', `${mine} stays below the ${theirs}`, 'claim', cl);
      return h <= rh ? C('fails', `${mine} is not above the ${theirs}`, 'claim', cl) : low != null && low <= rh ? C('uncertain', `${mine} is above the ${theirs} at the height used for the plan, but the range starts below it`, 'claim', cl) : C('meets', `${mine} stands above the ${theirs}`, 'claim', cl);
    }
    case 'fits_zone': { const z = ctx.zoneFit?.(req.zone, r); return !z ? C('uncertain', 'the zone is not known here', 'geometry') : C(z.ok ? 'meets' : 'fails', z.detail, 'geometry', r.proxy.spread.claim ? [r.proxy.spread.claim] : []); }
    case 'facet_label': { const cell = K.cell(r.id, req.facet); const known = !!K.vocab?.[req.facet]; if (!cell) return C('fails', known ? `no ${req.facet} recorded for this plant` : `the database has no “${req.facet}” facet: this role cannot be evidenced for any species`, 'claim'); const hit = cell.values.filter(v => req.any.some(w => v.label.toLowerCase() === w.toLowerCase())); return hit.length ? C('meets', `records ${hit.map(v => v.label).join(', ')}`, 'claim', hit.flatMap(v => v.claims)) : C('fails', `records ${cell.values.map(v => v.label).join(', ')}, not ${req.any.join(' / ')}`, 'claim', cell.claims); }
  }
  return C('uncertain', `no rule for the requirement “${req.check}”`, 'heuristic');
}
/** every requirement of a layer for one species → { id, fit, checks, reasons } (the same shape as the engine's own candidates) */
export function qualify(layer, r, ctx) {
  const checks = {}; for (const req of layer.requires || []) { const c = check(req, r, ctx); if (req.check === 'function') { Object.assign(checks, c); if (c.evidence?.result === 'fails') break; } else checks[req.check === 'facet_label' ? req.facet : req.check] = c; }
  const fit = fitOf(checks); return { id: r.id, name: r.name, layer: layer.role, fit, checks, reasons: Object.entries(checks).filter(([, c]) => c.result !== 'meets').sort((x, y) => (y[1].result === 'fails') - (x[1].result === 'fails')).map(([k, c]) => `${k.replace(/_/g, ' ')}: ${c.detail}`), proxy_radius_m: r.proxy.radius_m };   /* what rules a species out is said first */
}
/** THE LAYER PLAN of one bed: for each layer, who qualifies, who is chosen, and — when nobody is — why. Layers are filled in order; a
 *  species chosen for one layer is not offered to a later one. `choose(layer, okRows)` lets the engine apply the user's own mix. */
export function plan(sys, ctx) {
  const preset = sys.preset; const picked = new Map(); const used = new Set(); const layers = [];
  const c2 = { ...ctx, picked: role => picked.get(role) || [], layerLabel: role => preset.functional_layers.find(l => l.role === role)?.label || role };
  for (const layer of preset.functional_layers) {
    const L = { role: layer.role, label: layer.label, slot: layer.slot, zone: layer.zone || null, function: layer.function, required: layer.required, text: layer.text, candidates: [], picks: [], status: null, gap: null };
    if (layer.source === 'site') { const s = ctx.siteLayer?.(layer) || null; L.status = s ? 'provided by the site' : 'unresolved'; L.provided = s; L.gap = s ? null : 'no existing tree reaches this bed'; layers.push(L); continue; }
    const max = typeof layer.max_species === 'string' ? sys.params[layer.max_species] : layer.max_species;
    const cands = ctx.rows.map(r => ({ r, c: qualify(layer, r, c2) })); L.candidates = cands.map(x => x.c);
    const ok = cands.filter(x => x.c.fit !== 'fails' && !used.has(x.r.id)).sort((a, b) => FIT_RANK[a.c.fit] - FIT_RANK[b.c.fit] || ctx.rank(a.r, layer.function) - ctx.rank(b.r, layer.function));
    const taken = cands.filter(x => x.c.fit !== 'fails' && used.has(x.r.id)).map(x => x.r.id);
    const chosen = (ctx.choose?.(layer, ok.map(x => x.r)) || ok.map(x => x.r)).slice(0, max);
    for (const r of chosen) { used.add(r.id); L.picks.push({ id: r.id, fit: cands.find(x => x.r === r).c.fit }); } picked.set(layer.role, chosen); L.eligible = ok.map(x => x.r.id);
    if (L.picks.length) L.status = 'filled';
    else { L.status = layer.required ? 'unresolved' : 'empty';
      const evidenced = L.candidates.filter(c => Object.values(c.checks)[0]?.result !== 'fails'); const facetGap = L.candidates.length && L.candidates.every(c => Object.values(c.checks).some(k => /database has no/.test(k.detail)));
      L.gap = facetGap ? `insufficient evidence: ${Object.values(L.candidates[0].checks).find(k => /database has no/.test(k.detail)).detail}` : taken.length && !evidenced.filter(c => c.fit !== 'fails' && !used.has(c.id)).length && L.candidates.some(c => c.fit !== 'fails') ? `the only qualifying species (${taken.map(id => ctx.K.name(id)).join(', ')}) already plays another role in this bed` : `no species qualifies: ${evidenced.slice(0, 4).map(c => `${c.name} — ${c.reasons.filter(x => c.checks[x.split(':')[0].replace(/ /g, '_')]?.result === 'fails').join('; ') || c.reasons[0]}`).join(' · ') || 'no species meets the first requirement of the role'}`; }
    layers.push(L);
  }
  const planted = layers.filter(l => l.slot); const need = layers.filter(l => l.required);
  return { preset: preset.id, version: preset.version, title: preset.title, params: sys.params, layers, picked, role_fulfilment: { required: need.length, required_filled: need.filter(l => l.status === 'filled' || l.status === 'provided by the site').length, optional: layers.length - need.length, optional_filled: layers.filter(l => !l.required && l.status === 'filled').length }, unresolved: layers.filter(l => l.status === 'unresolved' || (l.status === 'empty' && l.gap)).map(l => ({ role: l.role, label: l.label, required: l.required, why: l.gap })), planted_layers: planted.map(l => l.role) };
}

// ---------------------------------------------------------------- does a system apply to a bed, and which one is suggested
/** bedCtx: { wanted: [fn], edges: { fn: n }, canopy: { trees: n, reach_m2, under_share, assumed, any }, light_known } */
export function applicability(preset, b) {
  const test = c => c.ctx === 'function' ? b.wanted.includes(c.fn) : c.ctx === 'edge' ? (b.edges?.[c.fn] || 0) > 0 : c.ctx === 'existing_tree' ? b.canopy.trees > 0 : c.ctx === 'canopy_reach' ? b.canopy.reach_m2 > 0 : c.ctx === 'light_unknown' ? !b.light_known : c.ctx === 'canopy' ? b.canopy.under_share > 0 : c.ctx === 'canopy_assumed' ? b.canopy.reach_m2 > 0 && b.canopy.assumed : c.ctx === 'tree_unrecorded' ? b.canopy.reach_m2 > 0 : c.ctx === 'wants_screen' ? b.wanted.includes('z:screen') : false;
  const req = preset.applicable_context.requires.map(c => ({ text: c.text, met: test(c) })); const caveats = preset.applicable_context.caveats.filter(test).map(c => c.text);
  const level = !preset.arrangement.implemented ? 'unavailable' : req.every(r => r.met) ? 'applies' : 'not';
  return { preset: preset.id, level, requires: req, caveats, missing: req.filter(r => !r.met).map(r => r.text) };
}
/** which species of the whole database could play each role at all (site-free): shows whether a preset is supported by the knowledge base */
export function coverage(preset, K) {
  const blank = { K, light: null, fn: (r, fn) => { const e = K.functionEvidence(r.id, fn); return { evidence: { result: e.result === 'supported' ? 'meets' : e.result === 'none' ? 'fails' : 'uncertain', detail: e.detail } }; }, picked: () => [], layerLabel: x => x };
  const rows = K.species.map(s => ({ id: s.id, name: s.scientific_name, form: s.growth_form_label, gate: { overall: 'unknown', light: {}, water: {}, soil: {} }, proxy: K.proxy(s.id), ecology: { result: K.cell(s.id, 'ecology') ? 'documented' : 'not recorded', detail: '' }, interest: K.interest(s.id), excluded: null }));
  const layers = preset.functional_layers.map(l => { if (l.source === 'site') return { role: l.role, label: l.label, required: l.required, source: 'site', species: [], gap: null };
    const hard = (l.requires || []).filter(q => ['function', 'form', 'facet_label', 'evergreen', 'interest_or_ecology'].includes(q.check)); const sp = []; let gap = null;
    for (const r of rows) { const cs = hard.map(q => { const c = check(q, r, blank); return q.check === 'function' ? c.evidence : c; }); if (cs.every(c => c.result !== 'fails')) sp.push(r.id); else if (!gap) { const f = cs.find(c => /database has no/.test(c.detail)); if (f) gap = f.detail; } }
    return { role: l.role, label: l.label, required: l.required, species: sp, gap: sp.length ? null : gap || `no species of the ${rows.length} meets ${hard.map(q => q.check === 'form' ? `form ${(q.any || []).join(' / ')}` : q.check === 'facet_label' ? `${q.facet}: ${q.any.join(' / ')}` : q.check === 'function' ? q.fn.replace('z:', '') : q.check).join(' + ')}` }; });
  const missing = layers.filter(l => l.required && l.source !== 'site' && !l.species.length);
  return { preset: preset.id, layers, supported: !missing.length, verdict: missing.length ? 'insufficient species/role evidence' : 'supported by the knowledge base', missing: missing.map(l => ({ role: l.role, label: l.label, why: l.gap })) };
}
/** the suggestion for one bed — a rule's proposal, never a decision: the first implemented system whose context applies, in this order of
 *  specificity: a bed with a Screen edge → Layered Screening; a bed an existing crown reaches → Woodland Edge. Otherwise none. */
export function recommend(b, K) {
  const all = presetList().map(p => ({ preset: p, app: applicability(p, b), cov: coverage(p, K) }));
  const order = ['layered-screen', 'woodland-edge']; const hit = order.map(id => all.find(x => x.preset.id === id)).find(x => x.app.level === 'applies' && x.cov.supported) || null;
  const why = !hit ? 'no system is suggested: neither a Screen edge nor an existing crown organises this bed — its function is arranged directly' : hit.preset.id === 'layered-screen' ? 'this bed has a Screen on one of its edges: a row needs a lower layer at its foot' : `an existing crown reaches this bed (${Math.round(b.canopy.under_share * 100)} % of it lies under the crown): the light changes with distance from the trunk`;
  return { suggested: hit?.preset.id || null, basis: 'rule', confirmed: false, why, options: all };
}

// ---------------------------------------------------------------- "why this plant here": the chain from the site to the position
/** site conditions → terrain → function → system role → species evidence → placement rule, for one plant object of one version. Every
 *  step says where it comes from: stated · assumed · claim · heuristic · geometry. Reads the version's own records; judges nothing. */
export function chain(project, K, version, plant) {
  const bed = project.site.beds.find(b => b.id === plant.bed_id); const asm = version.assemblages?.[plant.bed_id] || {}; const sysRec = asm.system || null; const steps = [];
  const conds = { ...project.site.conditions, ...(bed?.conditions_overrides || {}) }; const cw = k => conds[k]?.value ? `${String(conds[k].value).replace('-', ' ')} (${conds[k].status})` : 'unknown';
  steps.push({ step: 'site', title: 'Site conditions', source: conds.light?.status === 'unknown' || !conds.light?.value ? 'unknown' : /assumed|inferred/.test(conds.light.status) ? 'assumed' : 'stated', lines: [`${bed?.name || plant.bed_id}: light ${cw('light')} · water ${cw('water')} · soil ${cw('soil_type')} · drainage ${cw('soil_drainage')}`, ...(asm.notes || []).filter(n => /under .*canopy|under existing/i.test(n)).slice(0, 1)] });
  const tv = version.terrain; if (tv && tv.status !== 'unknown') { const g = plant.ground; steps.push({ step: 'terrain', title: 'Ground', source: tv.status === 'measured' ? 'measured' : 'assumed', lines: [g ? `stands at ${g.z_m} m on a ${g.slope_pct} % slope${g.aspect !== 'level' ? ` falling ${g.aspect}` : ''} (${tv.status} terrain, ${tv.source_type})` : 'the terrain has relative heights only: no ground height or slope for this plant', tv.gate?.enabled ? (g ? `slope gate ${tv.gate.max_slope_pct} %: ${g.slope_pct} % passes — a design heuristic, not a tolerance of this species` : null) : 'slope gate off: the slope did not limit where this plant may stand'].filter(Boolean) }); }
  else steps.push({ step: 'terrain', title: 'Ground', source: 'unknown', lines: ['elevation unknown: no slope was read and none limited this position'] });
  const fns = (asm.wanted || []).map(f => f.replace('z:', '').replace('_', ' ')); steps.push({ step: 'function', title: 'Spatial function', source: 'stated', lines: [fns.length ? `this bed is asked to: ${fns.join(' + ')}` : 'no spatial function on this bed'] });
  const L = sysRec?.layers?.find(l => l.role === plant.layer) || null;
  if (sysRec) steps.push({ step: 'system', title: 'Planting system', source: 'heuristic', lines: [`${sysRec.title} (preset ${sysRec.preset} v${sysRec.version}) — chosen for this bed in Compose`, L ? `role: ${L.label} — ${L.text}${L.required ? '' : ' (optional layer)'}` : `role: ${plant.role}`] });
  else steps.push({ step: 'system', title: 'Planting system', source: 'none', lines: ['no planting system chosen: the bed\'s functions are arranged directly by the engine\'s default rules', `role: ${plant.role}`] });
  const cand = L?.candidates?.find(c => c.id === plant.species_id) || (asm.candidates?.[plant.role === 'ground' ? 'ground' : 'screen'] || []).find(c => c.id === plant.species_id) || null;
  steps.push({ step: 'species', title: `Why ${K.name(plant.species_id)}`, source: 'claim', fit: cand?.fit || null, lines: cand ? Object.entries(cand.checks).map(([k, c]) => `${k.replace(/_/g, ' ')}: ${c.result} — ${c.detail}`) : ['placed by hand or by an edit: no qualification record'], claims: cand ? [...new Set(Object.values(cand.checks).flatMap(c => c.claims || []))].slice(0, 12) : [] });
  const g = (version.groups || []).find(x => x.id === plant.group_id); const P = g?.params || {};
  steps.push({ step: 'placement', title: 'Why here', source: 'heuristic', lines: g ? [`operator ${g.operator}${P.region ? ` in the ${P.region} zone` : ''}: ${P.pattern_rule || P.rule || (g.operator === 'repeat_accent' ? `every ${P.every}th position of the ground layer, counted from ${P.toward}, becomes an accent (ratio: heuristic)` : g.operator === 'stagger' ? `a second row set in the gaps of the first, ${P.offset}` : P.spacing ? `a row on the inside of the screened edge, stems ${P.inset || 'one crown radius'} in from it` : '')}`.trim(), P.spacing_rule ? `spacing ${P.spacing_m ?? ''} m — ${P.spacing_rule} (${P.spacing_source || 'heuristic'})` : P.spacing ? `spacing rule: ${P.spacing} (${P.spacing_source || 'heuristic'})` : null, `position ${plant.position_m.join(', ')} m; crown radius ${plant.proxy_radius_m} m from ${plant.proxy_source?.claim || 'an assumed size'}; clear of the bed edge, the tree keep-out, no-plant zones and its neighbours`].filter(Boolean) : [plant.origin && plant.origin !== 'generated' ? `placed by ${plant.origin}` : 'no placement group recorded'] });
  return { plant_id: plant.id, species_id: plant.species_id, bed_id: plant.bed_id, system: sysRec ? sysRec.preset : null, layer: plant.layer || null, steps };
}
