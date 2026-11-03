// XYZ projection model — loads brain/data/xyz.json (tools/build_xyz.py) and answers the graph questions the interface asks.
// Nothing about the plants, the concepts or the functions is written here: the entrances, the growth forms with plants, the four
// knowledge groups, the five spatial functions and every relation come from the file.  Disclosure rules (what a click reveals)
// are keyed on node *kind*, never on an id.

export async function load(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return new Model(await r.json());
}

const SEMANTIC = new Set(['semantic', 'plant_relation', 'taxonomy']);

export class Model {
  constructor(data) {
    this.data = data;
    this.N = new Map(data.nodes.map(n => [n.id, n]));
    this.E = new Map(data.edges.map(e => [e.id, e]));
    this.adj = new Map();          // node id -> every edge touching it (navigation included)
    for (const e of data.edges) { this._adj(e.source).push(e); this._adj(e.target).push(e); }
    this.claims = data.claims; this.sources = data.sources; this.rules = data.rules; this.paths = data.paths; this.stats = data.stats;
    this.initial = data.nodes.filter(n => n.initial).map(n => n.id);
    this.entrance = Object.fromEntries(data.nodes.filter(n => n.kind === 'entrance').map(n => [n.dimension, n.id]));
    this.searchIndex = data.nodes.filter(n => n.kind !== 'entrance').map(n => ({ id: n.id, text: [n.label, ...(n.common || []), ...(n.aliases || []), n.facet_label || '', n.kind].join(' ').toLowerCase() }));
  }
  _adj(id) { if (!this.adj.has(id)) this.adj.set(id, []); return this.adj.get(id); }
  node(id) { return this.N.get(id); }
  edge(id) { return this.E.get(id); }
  edgesOf(id, pred = () => true) { return (this.adj.get(id) || []).filter(pred); }
  other(e, id) { return e.source === id ? e.target : e.source; }
  claim(id) { return this.claims[id]; }
  source(id) { return this.sources[id] || { id, label: id }; }

  // the hub a node hangs from (for layout and for revealing the way in): entrance for X/Y/Z nodes, group for a concept,
  // growth form for a plant, plant for a cultivar, genus for a family …
  anchorOf(id) {
    const n = this.N.get(id); if (!n) return null;
    if (n.kind === 'entrance') return null;
    if (n.kind === 'growth_form' || n.kind === 'y_group' || n.kind === 'function') return this.entrance[n.dimension];
    if (n.kind === 'concept') return n.group;
    if (n.kind === 'plant') return n.growth_form || this.entrance.x;
    if (n.kind === 'cultivar') return n.plant;
    if (n.kind === 'genus') { const e = this.edgesOf(id, e => e.rel === 'in_genus')[0]; return e ? e.source : this.entrance.x; }
    if (n.kind === 'family') { const e = this.edgesOf(id, e => e.rel === 'in_family')[0]; return e ? e.source : this.entrance.x; }
    return null;
  }
  // every ancestor up to an entrance, nearest first
  wayIn(id) { const out = []; let a = this.anchorOf(id); while (a && !out.includes(a)) { out.push(a); a = this.anchorOf(a); } return out; }

  // what one click on a node reveals: its direct connections in the projection, by kind.  Taxonomy from a plant and model
  // placeholder relations are on demand (the plant card offers them) so a plant's first expansion stays readable.
  expansion(id, { taxonomy = false, placeholders = false } = {}) {
    const n = this.N.get(id); if (!n) return { nodes: [], edges: [] };
    const nodes = new Set(), edges = new Set();
    const take = e => { edges.add(e.id); nodes.add(this.other(e, id)); };
    for (const e of this.adj.get(id) || []) {
      if (e.type === 'navigation') { if (n.kind === 'entrance' || n.kind === 'y_group' || (n.kind === 'concept' && e.target === id)) take(e); continue; }
      if (e.type === 'taxonomy') { if (n.kind === 'plant' && !taxonomy) continue; take(e); continue; }
      if (e.type === 'plant_relation') { if (e.placeholder && !placeholders) continue; take(e); continue; }
      take(e);   // semantic: is_growth_form · grows_in · has_trait · requires_trait · suited_for
    }
    nodes.delete(id);
    return { nodes: [...nodes], edges: [...edges] };
  }
  // edges drawn among a set of visible nodes: the induced subgraph (so a plant revealed from Screen shows its line to a visible
  // trait at once); placeholders and taxonomy only when they were revealed on purpose
  inducedEdges(visible, revealedEdges) {
    const out = [];
    for (const e of this.data.edges) {
      if (!visible.has(e.source) || !visible.has(e.target)) continue;
      if (e.type === 'navigation' && e.rel === 'groups') { out.push(e); continue; }
      if (e.type === 'navigation') { out.push(e); continue; }
      if ((e.placeholder || e.type === 'taxonomy') && !revealedEdges.has(e.id)) continue;
      out.push(e);
    }
    return out;
  }
  search(q) {
    q = q.trim().toLowerCase(); if (q.length < 2) return [];
    const words = q.split(/\s+/);
    return this.searchIndex.filter(x => words.every(w => x.text.includes(w))).map(x => this.N.get(x.id))
      .sort((a, b) => (a.label.toLowerCase().startsWith(q) ? 0 : 1) - (b.label.toLowerCase().startsWith(q) ? 0 : 1) || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.label.localeCompare(b.label)).slice(0, 12);
  }
  // the semantic neighbourhood of a node among the visible nodes (for focus and dimming)
  neighbourhood(id, visible) {
    const nodes = new Set([id]), edges = new Set();
    for (const e of this.adj.get(id) || []) { if (!SEMANTIC.has(e.type)) continue; const o = this.other(e, id); if (visible.has(o)) { nodes.add(o); edges.add(e.id); } }
    return { nodes, edges };
  }
}
const KIND_ORDER = ['plant', 'function', 'growth_form', 'y_group', 'concept', 'genus', 'family', 'cultivar'];
