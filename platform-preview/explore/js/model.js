// Explorer model — loads brain/data/explorer.json (tools/build_explorer.py) and answers the questions the four views ask.
// Nothing about the plants, the facets or the functions is written here: ids, labels, statuses and evidence all come from the file.
// Graph neighbourhoods are keyed on record kind (species · function · concept · pair), never on an id.

export async function load(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return new Model(await r.json());
}

export class Model {
  constructor(d) {
    this.d = d;
    this.species = d.species; this.SP = new Map(d.species.map(s => [s.id, s]));
    this.functions = d.functions; this.FN = new Map(d.functions.map(f => [f.id, f]));
    this.facets = d.facets; this.FA = new Map(d.facets.map(f => [f.id, f]));
    this.groups = d.groups; this.GR = new Map(d.groups.map(g => [g.id, g]));
    this.concepts = d.concepts; this.CO = new Map(d.concepts.map(c => [c.id, c]));
    this.links = d.function_links; this.LK = new Map(d.function_links.map(l => [l.id, l])); this.linkAt = new Map(d.function_links.map(l => [`${l.species}|${l.function}`, l]));
    this.attrs = d.attributes; this.AT = new Map(d.attributes.map(a => [a.id, a])); this.attrAt = new Map(d.attributes.map(a => [`${a.species}|${a.facet}`, a]));
    this.clinks = d.concept_links; this.CL = new Map(d.concept_links.map(e => [e.id, e]));
    this.relations = d.relations; this.RE = new Map(d.relations.map(r => [r.id, r]));
    this.pairs = d.pairs; this.PA = new Map(); for (const p of d.pairs) { this.PA.set(`${p.a}|${p.b}`, p); this.PA.set(`${p.b}|${p.a}`, p); }
    this.claims = d.claims; this.checks = d.evidence_checks; this.sources = d.sources; this.rules = d.rules; this.vocab = d.vocab; this.stats = d.stats;
    this.clinksOf = new Map(); for (const e of d.concept_links) { push(this.clinksOf, e.species, e); push(this.clinksOf, e.concept, e); }
    this.searchIndex = [
      ...d.species.map(s => ({ id: s.id, kind: 'species', label: s.scientific_name, sub: (s.common_names || []).join(' · '), text: [s.scientific_name, ...(s.common_names || []), s.family, s.genus].join(' ').toLowerCase() })),
      ...d.functions.map(f => ({ id: f.id, kind: 'function', label: f.label, sub: 'spatial function', text: [f.label, ...(f.aliases || [])].join(' ').toLowerCase() })),
      ...d.concepts.filter(c => !c.no_plant_reaches).map(c => ({ id: c.id, kind: 'concept', label: c.label, sub: `${c.facet_label || c.facet} · ${c.n_species} species`, text: [c.label, c.facet_label || ''].join(' ').toLowerCase() })),
    ];
  }
  sp(id) { return this.SP.get(id); } fn(id) { return this.FN.get(id); } co(id) { return this.CO.get(id); }
  link(spId, fnId) { return this.linkAt.get(`${spId}|${fnId}`); }
  attr(spId, facet) { return this.attrAt.get(`${spId}|${facet}`); }
  pair(a, b) { return this.PA.get(`${a}|${b}`); }
  claim(id) { return this.claims[id]; }
  source(id) { return this.sources[id] || { id, label: id }; }
  linksOf(spId) { return this.links.filter(l => l.species === spId); }
  linksTo(fnId) { return this.links.filter(l => l.function === fnId); }
  relationsOf(spId, live = true) { return this.relations.filter(r => (r.a === spId || r.b === spId) && (!live || r.live)); }
  relationsBetween(a, b, live = true) { return this.relations.filter(r => ((r.a === a && r.b === b) || (r.a === b && r.b === a)) && (!live || r.live)); }
  name(id) { return this.SP.get(id)?.scientific_name || this.FN.get(id)?.label || this.CO.get(id)?.label || id; }
  kindOf(id) { return this.SP.has(id) ? 'species' : this.FN.has(id) ? 'function' : this.CO.has(id) ? 'concept' : null; }

  search(q) {
    q = q.trim().toLowerCase(); if (q.length < 2) return [];
    const words = q.split(/\s+/);
    const order = { species: 0, function: 1, concept: 2 };
    return this.searchIndex.filter(x => words.every(w => x.text.includes(w))).sort((a, b) => (a.label.toLowerCase().startsWith(q) ? 0 : 1) - (b.label.toLowerCase().startsWith(q) ? 0 : 1) || order[a.kind] - order[b.kind] || a.label.localeCompare(b.label)).slice(0, 12);
  }

  // ------------------------------------------------------------------ what the graph draws for a focus: real records only, unknown as ghosts
  // Every edge is a record of the projection: a function link (drawn only when derived or candidate), a concept link (plant → concept
  // claim line), a requirement (function → concept, literature) or a live relation record.  A ghost is a species whose link to the
  // focused function is unknown — shown without any edge.
  graphFor(focus, a, b) {
    const nodes = new Map(), edges = [];
    const N = (id, kind, extra = {}) => { if (!nodes.has(id)) nodes.set(id, { id, kind, label: this.name(id), ...extra }); return nodes.get(id); };
    const E = (e) => edges.push(e);
    const linkEdge = l => ({ id: l.id, kind: 'link', rel: 'suited_for', source: l.species, target: l.function, status: l.status, conflict: l.conflict, verification: l.verification, ref: l });
    const clEdge = e => ({ id: e.id, kind: 'concept_link', rel: e.rel, source: e.species, target: e.concept, status: e.status, verification: e.verification, ref: e });
    const reqEdge = (f, r, alt) => ({ id: `${r.id}>${alt}`, kind: 'requirement', rel: 'requires_trait', source: f.id, target: alt, status: 'documented', verification: 'literature', strength: r.strength, ref: r, fn: f.id });
    const relEdge = r => ({ id: r.id, kind: 'relation', rel: r.type, source: r.a, target: r.b, status: r.kg_status, verification: r.status, placeholder: r.placeholder, ref: r });
    if (!focus) {   // overview: the ten species, the five functions, every drawn link — the matrix as a graph
      for (const f of this.functions) N(f.id, 'function');
      for (const s of this.species) N(s.id, 'species');
      for (const l of this.links) if (l.drawn) E(linkEdge(l));
      return { nodes: [...nodes.values()], edges, center: null };
    }
    if (focus.kind === 'function') {
      const f = this.fn(focus.id); N(f.id, 'function', { focus: true });
      const linked = this.linksTo(f.id).filter(l => l.drawn); const linkedIds = new Set(linked.map(l => l.species));
      for (const l of linked) { N(l.species, 'species'); E(linkEdge(l)); }
      const alts = new Set();
      for (const r of f.requirements) for (const alt of r.alternatives) { const c = this.co(alt); if (c && !c.no_plant_reaches) { alts.add(alt); N(alt, 'concept', { strength: r.strength }); E(reqEdge(f, r, alt)); } }
      for (const alt of alts) for (const e of this.clinksOf.get(alt) || []) if (linkedIds.has(e.species)) E(clEdge(e));
      for (const l of this.linksTo(f.id)) if (!l.drawn) N(l.species, 'species', { ghost: true, verdict: l.verdict, link: l.id });
      return { nodes: [...nodes.values()], edges, center: f.id };
    }
    if (focus.kind === 'species') {
      const s = this.sp(focus.id); N(s.id, 'species', { focus: true });
      for (const l of this.linksOf(s.id)) { if (l.drawn) { N(l.function, 'function'); E(linkEdge(l)); } else N(l.function, 'function', { ghost: true, verdict: l.verdict, link: l.id }); }
      for (const e of this.clinksOf.get(s.id) || []) { N(e.concept, 'concept', { group: e.group }); E(clEdge(e)); }
      for (const r of this.relationsOf(s.id)) { const o = r.a === s.id ? r.b : r.a; if (this.SP.has(o)) { N(o, 'species'); E(relEdge(r)); } }
      return { nodes: [...nodes.values()], edges, center: s.id };
    }
    if (focus.kind === 'concept') {
      const c = this.co(focus.id); N(c.id, 'concept', { focus: true });
      for (const e of this.clinksOf.get(c.id) || []) { N(e.species, 'species'); E(clEdge(e)); }
      for (const fid of c.required_by || []) { const f = this.fn(fid); N(fid, 'function'); const r = f.requirements.find(r => r.alternatives.includes(c.id)); if (r) E(reqEdge(f, r, c.id)); }
      return { nodes: [...nodes.values()], edges, center: c.id };
    }
    if (focus.kind === 'pair' && a && b) {
      const p = this.pair(a, b); N(a, 'species', { focus: true }); N(b, 'species', { focus: true });
      for (const cid of p?.shared_concepts || []) { N(cid, 'concept'); for (const e of this.clinksOf.get(cid) || []) if (e.species === a || e.species === b) E(clEdge(e)); }
      for (const id of [a, b]) for (const l of this.linksOf(id)) if (l.drawn) { N(l.function, 'function'); E(linkEdge(l)); }
      for (const r of this.relationsBetween(a, b)) E(relEdge(r));
      return { nodes: [...nodes.values()], edges, center: null, pair: [a, b] };
    }
    return { nodes: [], edges: [], center: null };
  }
}
function push(m, k, v) { if (!m.has(k)) m.set(k, []); m.get(k).push(v); }
