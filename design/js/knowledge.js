// Knowledge adapter over brain/data/explorer.json (tools/build_explorer.py, M49). Nothing about the plants is written here:
// species, attribute values, claims, function links, status · verification · AI check all come from the file. The adapter answers
// the engine's questions (size proxy with its claim, gate check against site conditions, function links, evidence for a plant)
// and labels every answer with where it came from and what is unknown.
export async function loadKnowledge(url) { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`); return new Knowledge(await r.json()); }

const LIGHT = { 'full-sun': ['Full sun'], 'part-shade': ['Part sun/part shade', 'Filtered shade'], 'partial-shade': ['Part sun/part shade', 'Filtered shade'], 'shade': ['Deep shade', 'Filtered shade', 'Part sun/part shade'] };
const WATER = { dry: ['dry', 'wide range'], average: ['average', 'wide range'], moist: ['moist', 'wide range'], wet: ['wet', 'wide range'] };
const SOIL = { 'well-drained': ['Well-drained'], 'poorly-drained': ['wet'], clay: ['Clay'], sandy: ['Sandy', 'Rocky or gravelly or dry'], acidic: ['Acidic'], alkaline: ['Alkaline'] };

export class Knowledge {
  constructor(d) {
    this.d = d; this.species = d.species; this.SP = new Map(d.species.map(s => [s.id, s])); this.bySlug = new Map(d.species.map(s => [s.slug, s]));
    this.FN = new Map(d.functions.map(f => [f.id, f])); this.attr = new Map(d.attributes.map(a => [`${a.species}|${a.facet}`, a]));
    this.link = new Map(d.function_links.map(l => [`${l.species}|${l.function}`, l])); this.claims = d.claims; this.checks = d.evidence_checks; this.sources = d.sources; this.rules = d.rules;
    this.snapshot = { generated: d.generated, generated_by: d.generated_by, method: d.method, inputs: d.stats.inputs };
  }
  sp(id) { return this.SP.get(id) || this.bySlug.get(id); }
  name(id) { return this.sp(id)?.scientific_name || id; }
  common(id) { return (this.sp(id)?.common_names || [])[0] || ''; }
  cell(id, facet) { return this.attr.get(`${this.sp(id)?.id}|${facet}`); }
  labels(id, facet) { const c = this.cell(id, facet); return c ? c.values.map(v => v.label) : null; }
  functionLink(id, fn) { return this.link.get(`${this.sp(id)?.id}|${fn}`); }
  claim(cid) { return this.claims[cid]; }

  // ---- size proxies: one claimed range chosen deterministically, every alternative counted; never a measured fact
  sizeProxy(id, kind /* 'spread_class' | 'height_class' */, light = null) {
    const c = this.cell(id, kind); if (!c) return { value_m: null, status: 'not recorded', claim: null, alternatives: 0, note: `${kind === 'spread_class' ? 'spread' : 'height'} not recorded in the database` };
    const seen = new Map();
    for (const v of c.values) for (const n of v.numbers || []) { if (n.min == null && n.max == null) continue; const key = v.claims[0] + '|' + (n.min ?? '') + '|' + (n.max ?? ''); if (!seen.has(key)) seen.set(key, { claim: v.claims[0], source: v.sources[0], min: n.min, max: n.max, conditions: v.conditions || [], cultivars: v.cultivars || [], verification: v.verification }); }
    let opts = [...seen.values()].filter(o => o.min != null && o.max != null);
    if (!opts.length) opts = [...seen.values()];
    if (!opts.length) return { value_m: null, status: 'no numeric range', claim: c.claims[0] || null, alternatives: 0, note: 'claims exist but carry no usable range' };
    const byCond = opts.filter(o => !o.conditions.length); const conditioned = opts.filter(o => o.conditions.length);
    let pick = null, note = '';
    if (light && conditioned.length) { const want = light === 'shade' || light === 'part-shade' || light === 'partial-shade' ? /shade/i : /sun/i; const m = conditioned.find(o => o.conditions.some(x => want.test(x))); if (m) { pick = m; note = `range stated for ${m.conditions.join(', ')} (site light: ${light})`; } }
    if (!pick) { const base = (byCond.length ? byCond : opts).filter(o => !o.cultivars.length); const pool = base.length ? base : (byCond.length ? byCond : opts); pool.sort((a, b) => mid(a) - mid(b)); pick = pool[Math.floor((pool.length - 1) / 2)]; note = pool.length > 1 ? `median of ${pool.length} claimed ranges` : 'one claimed range'; if (conditioned.length && !light) note += '; other ranges depend on conditions'; }
    const v = pick.min != null && pick.max != null ? (pick.min + pick.max) / 2 : (pick.max ?? pick.min);
    return { value_m: Math.round(v * 100) / 100, min: pick.min, max: pick.max, status: 'proxy from claim', claim: pick.claim, source: pick.source, verification: pick.verification, conditions: pick.conditions, alternatives: opts.length - 1, disagreement: c.disagreement.length > 0, note };
  }
  proxy(id, light = null) {
    const sp = this.sizeProxy(id, 'spread_class', light), ht = this.sizeProxy(id, 'height_class', light);
    return { radius_m: sp.value_m != null ? Math.max(.15, Math.round(sp.value_m / 2 * 100) / 100) : 0.3, radius_status: sp.value_m != null ? 'proxy: half the claimed mature spread' : 'assumed 0.3 m — spread not recorded', spread: sp, height_m: ht.value_m, height_status: ht.value_m != null ? 'proxy from a claimed height range' : 'unknown', height: ht };
  }

  // ---- gate check of one species against site conditions: pass / conditional / fail / unknown, each with the claims behind it
  gate(id, conditions, prefs = {}) {
    const out = {}; const sid = this.sp(id).id;
    const check = (facet, condKey, map, label) => {
      const c = conditions[condKey]; const cell = this.cell(sid, facet);
      if (!cell) { out[label] = { result: 'not recorded', detail: `${label} not recorded for this plant`, claims: [] }; return; }
      if (!c || !c.value || c.status === 'unknown') { out[label] = { result: 'unknown', detail: `site ${label} unknown — plant records ${cell.values.map(v => v.label).join(', ')}`, claims: cell.claims }; return; }
      const want = map[c.value] || [c.value]; const have = cell.values.map(v => v.label);
      const hit = cell.values.filter(v => want.some(w => v.label.toLowerCase().includes(w.toLowerCase())));
      out[label] = hit.length ? { result: c.status === 'assumed' || c.status === 'inferred' ? 'conditional' : 'pass', detail: `site ${c.value} (${c.status}) — plant records ${hit.map(v => v.label).join(', ')}`, claims: hit.flatMap(v => v.claims) } : { result: 'fail', detail: `site ${c.value} (${c.status}) — plant records only ${have.join(', ')}`, claims: cell.claims };
    };
    check('exposure', 'light', LIGHT, 'light'); check('water', 'water', WATER, 'water'); check('soil', 'soil_type', SOIL, 'soil');
    const m = this.cell(sid, 'maintenance'); out.maintenance = !m ? { result: 'not recorded', detail: 'maintenance level not recorded', claims: [] } : prefs.maintenance_low ? (m.values.some(v => /low/i.test(v.label)) ? { result: 'pass', detail: `recorded ${m.values.map(v => v.label).join(', ')}`, claims: m.claims } : { result: 'conditional', detail: `recorded ${m.values.map(v => v.label).join(', ')} — not low`, claims: m.claims }) : { result: 'pass', detail: `recorded ${m.values.map(v => v.label).join(', ')}`, claims: m.claims };
    const e = this.cell(sid, 'ecology'); out.ecology = e ? { result: 'documented', detail: e.values.map(v => v.label).join(', '), claims: e.claims } : { result: 'not recorded', detail: 'no ecological-value claim recorded — not evidence of absence', claims: [] };
    const o = this.cell(sid, 'origin'); out.origin = o ? { result: 'documented', detail: o.values.map(v => v.label).join(', '), claims: o.claims } : { result: 'not recorded', detail: 'origin not recorded', claims: [] };
    const i = this.cell(sid, 'invasive'); out.invasive = i ? { result: i.values.some(v => /not listed/i.test(v.label)) ? 'pass' : 'flag', detail: i.values.map(v => v.label).join(', '), claims: i.claims } : { result: 'not recorded', detail: 'invasive status not recorded', claims: [] };
    const hard = ['light', 'water', 'soil'].map(k => out[k].result);
    out.overall = hard.includes('fail') ? 'fail' : hard.includes('conditional') ? 'conditional' : hard.every(r => r === 'pass') ? 'pass' : 'unknown';
    return out;
  }
  // ---- what the database says about a plant for a function (status · conflict · verification kept apart)
  functionSupport(id, fn) { const l = this.functionLink(id, fn); if (!l) return { status: 'unknown', verdict: 'no cell' }; return { status: l.status, drawn: l.drawn, conflict: l.conflict, verification: l.verification, verdict: l.verdict || Object.values(l.verdicts || {}).join(' / '), use_labels: l.via_use_labels || [], use_sources: l.use_sources || [], use_claims: l.use_claims || [], rule: l.rule, id: l.id }; }
  evergreen(id) { const c = this.cell(id, 'evergreen'); return c ? c.values.map(v => v.label) : null; }
  interest(id) { const c = this.cell(id, 'interest'); return c ? c.values.map(v => v.label) : null; }
  growthForm(id) { return this.sp(id)?.growth_form_label; }
  // ---- evidence card for a plant object
  evidence(id, conditions, prefs = {}) { const s = this.sp(id); return { species: s, gate: this.gate(id, conditions, prefs), proxy: this.proxy(id, conditions?.light?.value), functions: this.d.functions.map(f => ({ function: f.id, label: f.label, ...this.functionSupport(id, f.id) })), evergreen: this.evergreen(id), interest: this.interest(id), claims: { live: s.claims.live, verified: s.claims.verified }, explorer: `../brain/explorer/#fk=species&fi=${encodeURIComponent(s.id)}` }; }
  claimLine(cid) { const c = this.claims[cid]; if (!c) return { id: cid, text: '(claim not in the projection)', status: 'unknown' }; const chk = this.checks[cid]; return { id: cid, text: c.text, source: this.sources[c.source_id]?.label || c.source_id, source_url: this.sources[c.source_id]?.url, status: c.status, check: chk?.result || 'not_assessed', context: c.context, conditions: (c.conditions || []).map(x => x.label), cultivar: c.cultivar }; }
}
const mid = o => o.min != null && o.max != null ? (o.min + o.max) / 2 : (o.max ?? o.min ?? 0);
