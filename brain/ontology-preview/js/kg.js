// Knowledge-graph engine for the ontology preview (brief 2026-11-02). Loads brain/data/kg.json + the db files and runs the
// same traversals as tools/kg_query.py: recognition → traversal over typed edges → claims & evidence → waves the scene can
// light hop by hop. No keyword similarity, no hard-coded results. Candidate edges from the Grow form are appended to
// KG.edges (type 'candidate') and take part in traversal and in the requirement check, always labelled candidate.
// the database root: this repository by default; `?db=<path>` points the interface at another root with the same layout
// (tools/scale_test.py writes such roots under tests/scale/out/), so nothing about the plants is known to the interface
const ROOT = new URLSearchParams(location.search).get('db') || '../..';
async function getJson(p) { const r = await fetch(p, { cache: 'no-store' }); if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`); return r.json(); }

export async function loadAll() {
  const [kg, ontology, diagnosis, schema, sourcesFile, synonyms, intent, queries] = await Promise.all([
    getJson(`${ROOT}/brain/data/kg.json`), getJson(`${ROOT}/ontology.json`), getJson(`${ROOT}/brain/data/diagnosis.json`), getJson(`${ROOT}/schema.json`), getJson(`${ROOT}/sources.json`), getJson(`${ROOT}/synonyms.json`), getJson(`${ROOT}/intent_map.json`), getJson(`${ROOT}/eval/queries.json`)]);
  const plants = {};   // the plant files are not fetched: every claim the interface needs is in kg.json's claim index (one request, however many plants)
  const sources = {}; for (const s of sourcesFile.sources) sources[s.id] = s;
  return makeKG({ kg, ontology, diagnosis, schema, sources, synonyms, intent, queries, plants });
}

const SHORT = { rhs: 'RHS', mobot: 'Missouri BG', gpp: 'Great Plant Picks', osu: 'Oregon State', eflora: 'E-Flora BC', usda_plants: 'USDA PLANTS', cov_trees: 'City of Vancouver trees', inat: 'iNaturalist', iscbc: 'ISC BC', kpu: 'KPU', model: 'model placeholder', candidate: 'you (candidate)', entity: 'entity record', classification: 'classification (M29)' };
const GEO = { vancouver: 0, bc: 1, pnw: 2, north_america: 3, global: 4 };
const PLACE_VAN = new Set(['place:vancouver', 'place:city_of_vancouver', 'place:north_vancouver']);
const SINGLE_FACETS = new Set(['habit', 'form', 'growth_rate', 'evergreen', 'growth_form', 'height_band', 'texture', 'maintenance', 'water', 'invasive']);

export function makeKG(db) {
  const { kg, ontology, sources, synonyms, schema } = db;
  const N = new Map(kg.nodes.map(n => [n.id, n]));
  const O = new Map(ontology.nodes.map(n => [n.id, n]));
  const CLAIMS = kg.claims;
  const edges = kg.edges.slice();
  const OUT = new Map(), IN = new Map();
  const push = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };
  function reindex() { OUT.clear(); IN.clear(); for (const e of edges) { push(OUT, e.source, e); if (e.target) push(IN, e.target, e); } }
  reindex();
  const SRC_PRIORITY = {}; schema.claim.fields.source_type.priority_order.forEach((s, i) => { SRC_PRIORITY[s] = i; });
  const label = id => N.get(id)?.label || O.get(id)?.label || id;
  const srcLabel = s => SHORT[s] || (String(s).startsWith('survey-') ? `survey respondent ${String(s).split('-r').pop()}` : ((sources[s] || {}).name || s || '').split(' — ')[0].split(' (')[0]);
  const plants = kg.nodes.filter(n => n.type === 'plant');
  // recognition tables
  const ALIAS = new Map();
  for (const n of kg.nodes) if (['concept', 'facet', 'category', 'axis'].includes(n.type)) for (const a of [n.label, ...(n.aliases || [])]) { if (!a || a.length < 3) continue; const k = a.toLowerCase(); if (!ALIAS.has(k)) ALIAS.set(k, []); ALIAS.get(k).push(n.id); }
  const PLANT_NAMES = {}; for (const e of synonyms.entries) if (e.in_db) PLANT_NAMES[`plant:${e.id}`] = [e.scientific, ...(e.names || []), ...(e.synonyms_scientific || [])];

  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function recognise(text) {
    const t = ` ${text.toLowerCase()} `; const plantsHit = {}, concepts = {};
    for (const [pid, names] of Object.entries(PLANT_NAMES)) for (const nm of names) if (t.includes(nm.toLowerCase())) { plantsHit[pid] = nm; break; }
    for (const [a, ids] of ALIAS) if (new RegExp(`(?<![a-z\\u4e00-\\u9fff])${esc(a)}(?![a-z\\u4e00-\\u9fff])`).test(t)) for (const i of ids) concepts[i] = a;
    for (const i of Object.keys(concepts)) { const p = N.get(i)?.parent; if (p && concepts[p] && N.get(i).type === 'concept') delete concepts[p]; }
    return { plants: plantsHit, concepts };
  }
  const rankKey = c => { const s = sources[c.source_id] || {}; const meta = c.practitioner_meta || {}; const comp = c.source_type !== 'practitioner' ? 1.5 : ({ L3: 0, L2: 1, L1: 2, L0: 3 }[meta.completeness] ?? 3); return [SRC_PRIORITY[c.source_type] ?? 9, GEO[s.geo_specificity] ?? 9, comp, -(c.confidence || 0)]; };
  const cmp = (a, b) => { const ka = rankKey(a), kb = rankKey(b); for (let i = 0; i < 4; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]; return 0; };
  const attribute = c => { const s = sources[c.source_id] || {}; if (c.source_type === 'candidate') return `Candidate (your observation, this session): “${c.text}”`; if (c.source_type === 'practitioner') { const meta = c.practitioner_meta || {}; const basis = { project: 'in their own project', observed: 'from site observation', read: 'from reading', mixed: 'from mixed experience' }[meta.basis] || ''; return `A ${s.observer_background || 'survey respondent'} noted ${basis}: “${c.text}”`; } return `${srcLabel(c.source_id)}${c.status === 'verified' ? '' : ` [${c.status}]`}: ${c.text}`; };
  const conds = c => (c.conditions || []).map(x => label(x.concept_id).toLowerCase()).join(', ') || 'no condition stated';
  const citable = c => !(c.source_type === 'practitioner' && (c.practitioner_meta || {}).citable === false);
  const liveClaim = cid => { const c = CLAIMS[cid] || db.candidateClaims?.[cid]; return c && c.status !== 'retired' && c.source_type !== 'model'; };
  const claimOf = cid => CLAIMS[cid] || db.candidateClaims?.[cid];

  const edgesFrom = (node, rels, types) => (OUT.get(node) || []).filter(e => (!rels || rels.includes(e.rel)) && (!types || types.includes(e.type)));
  const edgesTo = (node, rels, types) => (IN.get(node) || []).filter(e => (!rels || rels.includes(e.rel)) && (!types || types.includes(e.type)));
  function descendants(cid) { const out = [cid]; for (let i = 0; i < out.length; i++) for (const e of IN.get(out[i]) || []) if (e.type === 'parent' && !out.includes(e.source)) out.push(e.source); return out; }
  function hierarchyPath(cid) { const out = [cid]; while (N.get(out[out.length - 1])?.hierarchy_parent) out.push(N.get(out[out.length - 1]).hierarchy_parent); return out; }
  const isEvidence = e => ['claim', 'entity', 'candidate'].includes(e.type) && e.live !== false && e.target;
  const plantClaimEdges = (pid, facet, concepts) => { const fam = concepts && concepts.length ? new Set(concepts.flatMap(descendants)) : null; return (OUT.get(pid) || []).filter(e => isEvidence(e) && (!facet || e.facet === facet) && (!fam || fam.has(e.target))); };
  const claimsOf = es => { const seen = new Set(), out = []; for (const e of es) { const cid = e.claim_id; if (cid && !seen.has(cid) && liveClaim(cid)) { seen.add(cid); out.push(claimOf(cid)); } } return out.sort(cmp); };
  const plantEvidenceEdges = pid => (OUT.get(pid) || []).filter(e => e.live !== false && e.target && ['claim', 'entity', 'classification', 'height_band', 'layer', 'candidate'].includes(e.type));

  // KG-R4 in the browser: the same check as tools/build_kg.py, over the current edges (candidates included, labelled)
  function checkRequirements(pid, z) {
    const mine = plantEvidenceEdges(pid); const facetsHere = new Set(mine.map(e => e.facet));
    const reqs = edgesFrom(z, ['requires_trait']); const checks = [];
    for (const r of reqs) {
      const alts = r.alternatives || [r.target]; const fam = new Set(alts.flatMap(descendants)); const hits = mine.filter(e => fam.has(e.target));
      const facets = new Set(alts.map(a => O.get(a)?.facet)); const result = hits.length ? 'met' : ([...facets].some(f => facetsHere.has(f)) && [...facets].every(f => SINGLE_FACETS.has(f)) ? 'unmet' : 'unknown');
      checks.push({ relation: r.id, strength: r.strength || 'required', alternatives: alts, result, evidence: hits, candidate: hits.some(e => e.type === 'candidate') && !hits.some(e => e.type !== 'candidate'), to_confirm: r.to_confirm, source: r.basis?.source });
    }
    const required = checks.filter(c => c.strength === 'required'), preferred = checks.filter(c => c.strength !== 'required'); const pm = preferred.filter(c => c.result === 'met').length;
    const verdict = !checks.length ? 'no requirements recorded' : required.length ? (required.every(c => c.result === 'met') ? 'supported by traits' : required.some(c => c.result === 'unmet') ? 'contradicted by traits' : 'evidence missing') : `preferences ${pm} of ${preferred.length} met${pm ? ' (weak support)' : ''}`;
    return { checks, verdict, onlyCandidate: checks.some(c => c.candidate) };
  }

  // ---- the four prototype paths: each returns narrative data + waves [{step, nodes, edges}] for the scene
  const firstGrowthForm = () => (kg.nodes.find(n => n.facet === 'growth_form' && n.used) || {}).id || 'growth_form:shrub';
  const firstPlant = () => (plants[0] || {}).id;
  const firstDesign = (pref) => (N.has(pref) ? pref : (kg.nodes.find(n => n.dimension === 'design' && n.facet !== 'height_band') || {}).id);
  function pathA(gf) { gf = gf || firstGrowthForm();
    const cls = edgesTo(gf, null, ['classification']); const ps = cls.map(e => e.source); const waves = [{ step: 'growth form', nodes: [gf], edges: [] }, { step: 'plants', nodes: ps, edges: cls }];
    const attrs = {}; const w3 = { step: 'attributes', nodes: [], edges: [] }; const w4 = { step: 'evidence', nodes: [], edges: [] };
    for (const p of ps) { attrs[p] = {}; for (const e of plantClaimEdges(p)) { const cat = N.get(e.target)?.category || 'cross:place'; (attrs[p][cat] = attrs[p][cat] || []).push(e); w3.edges.push(e); if (!w3.nodes.includes(e.target)) w3.nodes.push(e.target); const s = `source:${e.source_id}`; if (N.has(s) && !w4.nodes.includes(s)) w4.nodes.push(s); } }
    waves.push(w3, w4);
    return { path: 'A', title: `Classification: ${label(gf)}`, seed: gf, hierarchy: hierarchyPath(gf).reverse(), classification: cls, attributes: attrs, evidence: Object.fromEntries(ps.map(p => [p, claimsOf(Object.values(attrs[p]).flat())])), waves };
  }
  function pathB(z) { z = firstDesign(z || 'spatial:screen');
    const reqs = edgesFrom(z, ['requires_trait']); const design = edgesTo(z, null, ['design']).slice().sort((a, b) => ({ derived: 0, candidate: 1, unknown: 2 }[a.kg_status] - { derived: 0, candidate: 1, unknown: 2 }[b.kg_status])); const uses = edgesTo(z, ['maps_to']);
    const traitNodes = [...new Set(reqs.flatMap(r => r.alternatives || [r.target]))];
    const waves = [{ step: 'design concept', nodes: [z], edges: [] }, { step: 'required traits', nodes: [...traitNodes, ...uses.map(u => u.source)], edges: [...reqs, ...uses] }];
    const w3 = { step: 'plants', nodes: [], edges: [] }, w4 = { step: 'evidence & conditions', nodes: [], edges: [] };
    const plantsOut = [];
    for (const d of design) {
      const live = checkRequirements(d.plant, z); w3.nodes.push(d.plant); w3.edges.push(d);
      for (const c of live.checks) for (const e of c.evidence) { w4.edges.push(e); for (const cd of e.conditions || []) if (!w4.nodes.includes(cd.concept_id)) w4.nodes.push(cd.concept_id); const s = `source:${e.source_id}`; if (N.has(s) && !w4.nodes.includes(s)) w4.nodes.push(s); }
      for (const cid of d.use_claims || []) for (const e of (OUT.get(d.plant) || []).filter(x => x.claim_id === cid)) { w4.edges.push(e); const s = `source:${e.source_id}`; if (N.has(s) && !w4.nodes.includes(s)) w4.nodes.push(s); }
      plantsOut.push({ edge: d, plant: d.plant, kg_status: d.kg_status, verdict: live.verdict, liveVerdict: live.verdict !== d.verdict ? live.verdict : null, onlyCandidate: live.onlyCandidate, checks: live.checks, useClaims: (d.use_claims || []).map(claimOf).filter(Boolean), missing: live.checks.filter(c => c.result !== 'met') });
    }
    waves.push(w3, w4);
    return { path: 'B', title: `Design knowledge: ${label(z)}`, seed: z, node: N.get(z), hierarchy: hierarchyPath(z).reverse(), requirements: reqs, uses, plants: plantsOut, waves };
  }
  function pathC(pid, facet = 'height_class') { pid = pid || (db.diagnosis.variation[0] || {}).plant || firstPlant();
    const es = plantClaimEdges(pid, facet); const cs = claimsOf(es); const groups = new Map();
    for (const c of cs) { const k = `${c.cultivar || 'species'}|${conds(c)}`; if (!groups.has(k)) groups.set(k, { cultivar: c.cultivar || 'species', conditions: conds(c), claims: [] }); groups.get(k).claims.push(c); }
    const condNodes = [...new Set(cs.flatMap(c => (c.conditions || []).map(x => x.concept_id)))]; const srcs = [...new Set(cs.map(c => `source:${c.source_id}`))].filter(s => N.has(s)); const places = [...new Set(cs.map(c => c.place).filter(Boolean))];
    const waves = [{ step: 'plant', nodes: [pid], edges: [] }, { step: facet.replace(/_/g, ' '), nodes: [...new Set(es.map(e => e.target))], edges: es }, { step: 'growing conditions', nodes: condNodes, edges: [] }, { step: 'sources & places', nodes: [...srcs, ...places], edges: [] }];
    const diag = db.diagnosis.disagreement.filter(d => d.plant === pid && d.facet === facet), vari = db.diagnosis.variation.filter(v => v.plant === pid && v.facet === facet);
    return { path: 'C', title: `Knowledge variation: ${label(pid)} · ${facet.replace(/_/g, ' ')}`, seed: pid, facet, claims: cs, groups: [...groups.values()], variation: vari, disagreement: diag, reading: vari.length ? 'values differ with stated conditions' : diag.length ? 'sources disagree under the same (unstated) conditions' : 'no variation or disagreement detected', waves };
  }
  function pathD(z) { z = firstDesign(z || 'spatial:scrim');
    const b = pathB(z); const missing = [];
    for (const p of b.plants) for (const c of p.checks) if (c.result !== 'met') missing.push({ plant: p.plant, requirement: c.alternatives.map(label).join(' or '), strength: c.strength, result: c.result, why: c.result === 'unknown' ? 'no sourced claim on this facet' : 'sourced claims exist on the facet but none matches' });
    const noPlant = !b.plants.some(p => ['derived', 'candidate'].includes(p.kg_status)); const toConfirm = b.requirements.filter(r => r.to_confirm);
    const waves = [b.waves[0], b.waves[1], { step: 'existing evidence', nodes: b.plants.filter(p => p.kg_status !== 'unknown').map(p => p.plant), edges: b.plants.filter(p => p.kg_status !== 'unknown').map(p => p.edge) }, { step: 'missing', nodes: [...new Set(missing.map(m => m.plant))], edges: b.plants.filter(p => p.kg_status === 'unknown' || p.missing.length).map(p => p.edge) }];
    return { path: 'D', title: `Knowledge gaps: ${label(z)}`, seed: z, node: N.get(z), requirements: b.requirements, uses: b.uses, plants: b.plants, missing, noPlant, toConfirm, waves };
  }

  // ---- free-text ask: recognise → traverse → claims (R5) → context. Returns waves too.
  function ask(text, k = 12) {
    const rec = recognise(text); const concepts = Object.keys(rec.concepts); const named = Object.keys(rec.plants);
    const design = concepts.filter(c => N.get(c)?.dimension === 'design'), gfs = concepts.filter(c => N.get(c)?.facet === 'growth_form'), traits = concepts.filter(c => N.get(c)?.type === 'concept' && !['design', 'architecture'].includes(N.get(c)?.dimension));
    const hits = new Map(); const steps = []; const unknown = []; const designBlocks = []; const w1 = { step: 'concepts named', nodes: concepts.slice(), edges: [] }, w2 = { step: 'plants reached', nodes: [], edges: [] }, w3 = { step: 'claims & sources', nodes: [], edges: [] };
    const hit = (p, h, e) => { if (!hits.has(p)) hits.set(p, []); const hs = hits.get(p); const prev = hs.find(x => x.kind === h.kind && x.id === h.id); if (prev) { prev.n = (prev.n || 1) + 1; if (h.detail === 'verified') prev.detail = 'verified'; } else hs.push({ ...h, n: 1 }); if (!w2.nodes.includes(p)) w2.nodes.push(p); if (e) w2.edges.push(e); };
    for (const z of design) { const b = pathB(z); designBlocks.push(b); steps.push(`${label(z)} → requires ${b.requirements.length} traits → ${b.plants.length} plant links`); for (const p of b.plants) { if (['derived', 'candidate'].includes(p.kg_status)) hit(p.plant, { kind: 'design', id: z, status: p.kg_status, detail: p.verdict }, p.edge); else unknown.push(`${label(p.plant)} ↔ ${label(z)}: ${p.verdict}`); } w1.edges.push(...b.requirements); }
    for (const g of gfs) for (const e of edgesTo(g, null, ['classification'])) { hit(e.source, { kind: 'growth form', id: g, status: 'derived', detail: e.verification }, e); steps.push(`${label(g)} → ${label(e.source)} (${e.verification})`); }
    for (const c of traits) { const fam = new Set(descendants(c)); let any = false; const isPlace = N.get(c)?.facet === 'place'; for (const e of edges) if (isEvidence(e) && (isPlace ? fam.has(e.place) : fam.has(e.target))) { hit(e.source, { kind: isPlace ? 'place' : 'trait', id: c, status: 'documented', detail: e.verification }, e); any = true; } steps.push(`${label(c)} → ${any ? (isPlace ? 'plants with claims recorded there' : 'plants with claims') : 'no plant linked (dormant concept)'}`); }
    for (const p of named) hit(p, { kind: 'named', id: p, status: 'documented', detail: 'entity' });
    const answer = [];
    for (const [pid, why] of hits) { const want = why.filter(h => h.kind === 'trait').map(h => h.id); const placeWant = why.filter(h => h.kind === 'place').map(h => h.id); let es = want.length ? plantClaimEdges(pid, null, want) : plantClaimEdges(pid); if (placeWant.length) { const pf = new Set(placeWant.flatMap(descendants)); const local = es.filter(e => pf.has(e.place)); if (local.length) es = want.length ? es : local; } const cs = claimsOf(es); const cited = cs.filter(citable), withheld = cs.filter(c => !citable(c)); for (const c of cited.slice(0, k)) for (const e of es.filter(x => x.claim_id === c.id)) { w3.edges.push(e); const s = `source:${e.source_id}`; if (N.has(s) && !w3.nodes.includes(s)) w3.nodes.push(s); } answer.push({ plant: pid, why, claims: cited.slice(0, k), withheld: withheld.length, n: cs.length }); }
    answer.sort((a, b) => b.why.filter(h => h.status !== 'candidate').length - a.why.filter(h => h.status !== 'candidate').length || b.claims.length - a.claims.length);
    return { query: text, recognised: rec, steps, answer, design: designBlocks, unknown, waves: [w1, w2, w3] };
  }
  function contextBlock(r) {
    const o = [`Query: ${r.query}`, `Recognised: plants ${Object.values(r.recognised.plants).join(', ') || '—'} · concepts ${Object.keys(r.recognised.concepts).map(label).join(', ') || '—'}`, `Graph steps: ${r.steps.join('; ') || 'none'}`, ''];
    for (const a of r.answer) { o.push(`## ${label(a.plant)}  (why: ${a.why.map(h => `${h.kind} ${label(h.id)} [${h.status}/${h.detail}${h.n > 1 ? ` ×${h.n}` : ''}]`).join(', ')})`); for (const c of a.claims) o.push(`- ${attribute(c)} — ${c.field.replace(/_/g, ' ')}; status ${c.status}; conditions: ${conds(c)}; place: ${c.place ? label(c.place) : '—'}; id ${c.id}`); if (a.withheld) o.push(`- (${a.withheld} L0 practitioner note(s) withheld, R2)`); o.push(''); }
    for (const b of r.design) { o.push(`## Design concept: ${label(b.seed)} — ${b.node.definition}  [${b.node.source_of_term}]`); for (const t of b.requirements) o.push(`- ${t.strength}: ${(t.alternatives || [t.target]).map(label).join(' or ')}  (${t.basis?.source})${t.to_confirm ? ' — to confirm' : ''}`); for (const p of b.plants) o.push(`- ${label(p.plant)}: ${p.kg_status.toUpperCase()} — ${p.edge.text}${p.liveVerdict ? ` (with this session's candidates: ${p.liveVerdict}, still candidate)` : ''}`); o.push(''); }
    if (r.unknown.length) { o.push('Unknown / not asserted by any source:'); for (const u of r.unknown) o.push(`- ${u}`); }
    return o.join('\n');
  }

  // ---- candidates (Grow): claim edges in the kg shape, appended live
  function addCandidateEdges(es, claim) { db.candidateClaims = db.candidateClaims || {}; db.candidateClaims[claim.id] = claim; for (const e of es) { const cat = N.get(e.target)?.category; edges.push({ ...e, rel: { 'cat:environment': 'grows_in', 'cat:morphology': 'has_morphology', 'cat:temporal': 'has_temporal_trait', 'cat:ecological': 'has_ecological_value', 'cat:landscape_use': 'used_for' }[cat] || 'has_trait', kg_status: 'candidate', verification: 'candidate', basis: { claims: [claim.id], source: 'candidate' } }); } reindex(); }
  function removeCandidates() { for (let i = edges.length - 1; i >= 0; i--) if (edges[i].type === 'candidate') edges.splice(i, 1); db.candidateClaims = {}; reindex(); }

  const areas = kg.knowledge_areas || {}; const areaOfConcept = cid => N.get(cid)?.area || null; const plantAreas = pid => kg.plant_areas?.[pid] || {}; const pairsOf = pid => (kg.plant_pairs || []).filter(p => p.plants.includes(pid));
  return { db, kg, N, O, CLAIMS, edges, OUT, IN, plants, label, areas, areaOfConcept, plantAreas, pairsOf, firstGrowthForm, firstPlant, srcLabel, recognise, rankKey, cmp, attribute, conds, citable, claimOf, liveClaim, edgesFrom, edgesTo, descendants, hierarchyPath, isEvidence, plantClaimEdges, plantEvidenceEdges, claimsOf, checkRequirements, pathA, pathB, pathC, pathD, ask, contextBlock, addCandidateEdges, removeCandidates, reindex, PLACE_VAN, SINGLE_FACETS };
}
