// Planting Intelligence · platform layer (2026-11-14, V2). One small module every public surface loads: the Garden Studio (design/),
// the Plant Library (platform/plants/) and Knowledge — its overview (platform/knowledge/), the Explorer (brain/explorer/), the Neural
// view (brain/), Research and Method (platform/knowledge/research/ · method/). It holds what the modules have to agree on and nothing else:
//
//   routes     where each module lives, as absolute URLs resolved from this file — never from a query string or a referrer
//   ids        a species is `plant:<slug>` inside the knowledge snapshot and `<slug>` in a URL; functions keep their `z:` ids and
//              claims their `<slug>:<field>:<n>` ids. Nothing else identifies a record.
//   links      the cross-module navigation contract (below)
//   design     a read-only look at the Studio's saved project, so another module can say what the user will return to
//   considered species the user asked the Studio to check for their design — a preference, never a planting decision
//   top bar    Design · Plants · Knowledge, the same on every page; inside Knowledge: Overview · Explore · Research · Method
//
// Navigation contract
//   Plant profile      <plants>#species=<slug>
//   Explorer, focused  <explore>#fk=species&fi=plant:<slug>            (the Explorer's own URL state; add ik/ii for one record,
//                                                                         v=graph|matrix|table|compare for the working view)
//   Neural, focused    <neural>#species=<slug>
//   Evidence trace     <knowledge>#species=<slug>[&case=mine&bed=<bed id>]   (one species followed from its source to a Screen bed:
//                                                                         the reference garden, or a bed of the user's own design)
//   A bed in Compose   <design>?open=compose&bed=<bed id>[&species=<slug>]   (ids are checked against the saved project; an unknown
//                                                                         id is ignored and the project opens where it was left)
//   Back to a design   <design>                                         (the Studio reopens its saved project at the stage, bed,
//                                                                         view and selection it was left in: project.ui.view)
// A return path is therefore always the platform's own Design route. No module accepts a URL to go back to.
//
// No plant fact is written here. Everything about a plant is read from the published snapshot (routes.snapshot).

const LAYOUT = 'preview';   // tools/build_platform.py writes 'preview' into the published copy
const ROOT = new URL('../../', import.meta.url);   // the folder that holds every module, in both layouts
const PATHS = {
  repo: { design: 'design/', plants: 'platform/plants/', knowledge: 'platform/knowledge/', explore: 'brain/explorer/', neural: 'brain/', research: 'platform/knowledge/research/', method: 'platform/knowledge/method/', snapshot: 'brain/data/explorer.json', images: 'platform/data/images.json', img: 'platform/img/', artwork: 'platform/data/artwork.json', art: 'platform/art/', reference: 'designs/demo-a.json' },
  preview: { design: '', plants: 'plants/', knowledge: 'knowledge/', explore: 'explore/', neural: 'explore/neural/', research: 'knowledge/research/', method: 'knowledge/method/', snapshot: 'data/explorer.json', images: 'platform/data/images.json', img: 'platform/img/', artwork: 'platform/data/artwork.json', art: 'platform/art/', reference: 'data/designs/demo-a.json' },
}[LAYOUT];
export const routes = Object.fromEntries(Object.entries(PATHS).map(([k, v]) => [k, new URL(v, ROOT).href]));
export const SURVEY_URL = 'https://kaiyankay.github.io/planting-survey/';
export const REPO_URL = 'https://github.com/kaiyankay/planting-db';
/** the spatial function the evidence trace follows into a design (the Knowledge overview's worked example) */
export const TRACE_FUNCTION = 'z:screen';

export const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
export const slugOf = id => String(id || '').replace(/^plant:/, '');
export const speciesId = slug => `plant:${slugOf(slug)}`;

export const links = {
  design: () => routes.design,
  library: () => routes.plants,
  profile: id => `${routes.plants}#species=${encodeURIComponent(slugOf(id))}`,
  explorer: (id, inspect, view) => { if (!id) return view ? `${routes.explore}#v=${view}` : routes.explore; const p = new URLSearchParams({ fk: 'species', fi: speciesId(id) }); if (inspect) { p.set('ik', inspect.kind); p.set('ii', inspect.id); } if (view) p.set('v', view); return `${routes.explore}#${p}`; },
  /** the Explorer focused on any record kind it knows (species · function · concept), in one of its views */
  explorerFocus: (kind, id, { inspect = null, view = null } = {}) => { const p = new URLSearchParams({ fk: kind, fi: id }); if (inspect) { p.set('ik', inspect.kind); p.set('ii', inspect.id); } if (view) p.set('v', view); return `${routes.explore}#${p}`; },
  compare: (a, b) => `${routes.explore}#${new URLSearchParams({ a: speciesId(a), b: speciesId(b), v: 'compare' })}`,
  neural: id => id ? `${routes.neural}#species=${encodeURIComponent(slugOf(id))}` : routes.neural,
  knowledge: () => routes.knowledge,
  /** the evidence-to-design trace of one species; with a bed id, in the user's own design */
  trace: (id, bedId) => { const p = new URLSearchParams(); if (id) p.set('species', slugOf(id)); if (bedId) { p.set('case', 'mine'); p.set('bed', bedId); } const h = p.toString(); return h ? `${routes.knowledge}#${h}` : routes.knowledge; },
  /** a bed of the saved design, opened in Compose (optionally with one species' evidence) */
  compose: (bedId, id) => { const p = new URLSearchParams({ open: 'compose', bed: bedId }); if (id) p.set('species', slugOf(id)); return `${routes.design}?${p}`; },
  research: () => routes.research,
  method: () => routes.method,
  contribute: () => `${routes.research}#contribute`,   // V1 names, kept for the modules that still call them
  how: () => routes.method,
};

// ---------------------------------------------------------------- the Studio's saved project, read only
// design/js/model.js names its browser-storage key after the folder the Studio is served from; the same rule is applied to the
// Design route here, so every module looks at the project the Studio in this copy of the platform would open.
const designDir = () => new URL(routes.design).pathname.split('/').filter(Boolean).filter(x => !/\.html?$/.test(x)).pop() || 'design';
export const projectKey = () => { const d = designDir(); return d === 'design' ? 'pi.design.project.v1' : `pi.${d}.project.v1`; };
const STAGE_LABEL = { welcome: 'Imagine', site: 'Shape', intent: 'Compose', garden: 'Grow' };
/** what the user would return to in Design, or null when no design has been started in this browser */
export function activeDesign() {
  try {
    const p = JSON.parse(localStorage.getItem(projectKey()) || 'null'); if (!p || !p.ui?.unlocked?.site) return null;
    const stage = p.ui.stage && p.ui.stage !== 'welcome' ? p.ui.stage : (p.current_version_id ? 'garden' : p.ui.unlocked.intent ? 'intent' : 'site');
    const v = (p.versions || []).find(x => x.id === p.current_version_id) || null; const view = p.ui.view || {};
    const beds = (p.site?.beds || []).filter(b => b.status !== 'rejected'); const bed = stage === 'intent' && !view.composeNone ? beds.find(b => b.id === view.bedId) : null;
    const plant = stage === 'garden' && v && view.selectedPlant ? v.plant_objects.find(o => o.id === view.selectedPlant) : null;
    return { name: p.name, stage, stage_label: STAGE_LABEL[stage], bed: bed ? { id: bed.id, name: bed.name } : null, plant: plant ? { id: plant.id, species_id: plant.species_id } : null, beds: beds.length, plants: v ? v.plant_objects.length : 0, planted_species: v ? [...new Set(v.plant_objects.map(o => o.species_id))] : [] };
  } catch { return null; }
}
/** the Studio's saved project itself, parsed — for the evidence trace, which runs the planting engine on it. Never written back. */
export function savedProject() { try { const p = JSON.parse(localStorage.getItem(projectKey()) || 'null'); return p && p.site ? p : null; } catch { return null; } }
export function returnLabel(d = activeDesign()) { return d ? `Back to ${d.stage_label}${d.bed ? ` · ${d.bed.name}` : ''}` : null; }

// ---------------------------------------------------------------- species to consider in a design
// Kept beside the project, not inside a bed: the Library never chooses a bed. The Studio reads the list in Compose and shows each
// species with the engine's own check for the selected bed; only a species that qualifies there can be added to that bed's mix.
const consideredKey = () => projectKey().replace('.project.', '.considered.');
function readConsidered() { try { const l = JSON.parse(localStorage.getItem(consideredKey()) || '[]'); return Array.isArray(l) ? l.filter(x => x && typeof x.species_id === 'string') : []; } catch { return []; } }
export const considered = {
  list: () => readConsidered(),
  ids: () => readConsidered().map(x => x.species_id),
  has: id => readConsidered().some(x => x.species_id === speciesId(id)),
  add(id) { const l = readConsidered(); if (!l.some(x => x.species_id === speciesId(id))) l.push({ species_id: speciesId(id), added: new Date().toISOString(), from: 'plant-library' }); try { localStorage.setItem(consideredKey(), JSON.stringify(l)); } catch { } return l; },
  remove(id) { const l = readConsidered().filter(x => x.species_id !== speciesId(id)); try { localStorage.setItem(consideredKey(), JSON.stringify(l)); } catch { } return l; },
  clear() { try { localStorage.removeItem(consideredKey()); } catch { } },
};

// ---------------------------------------------------------------- the published snapshot
let snapshotP = null;
export function loadSnapshot() { return snapshotP || (snapshotP = fetch(routes.snapshot, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(`${routes.snapshot}: HTTP ${r.status}`); return r.json(); })); }
export const snapshotLine = d => `knowledge snapshot ${d.generated} · schema ${d.schema_version} · ${d.stats.species} species · ${d.stats.claims} claims, ${d.stats.claims_by_status.verified || 0} verified`;
let imagesP = null;
/** presentation assets of a species, never plant facts: `images` — one credited reference photograph (platform/data/images.json);
 *  `art` — one editorial illustration (platform/data/artwork.json), AI-generated and labelled so wherever it is shown */
export function loadImages() {
  const get = url => fetch(url, { cache: 'no-cache' }).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  return imagesP || (imagesP = Promise.all([get(routes.images), get(routes.artwork)]).then(([ph, art]) => ({ ...ph, images: ph.images || {}, art: art.images || {}, art_about: art.about || '' })));
}
export const imageUrl = file => new URL(file, routes.img).href;
export const artUrl = file => new URL(file, routes.art).href;
/** the Studio's recorded demonstration garden (designs/demo-a.json): a project the Studio itself saved, used as the reference case */
let referenceP = null;
export function loadReference() { return referenceP || (referenceP = fetch(routes.reference, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(`${routes.reference}: HTTP ${r.status}`); return r.json(); })); }

// ---------------------------------------------------------------- top bar
const NAV = [['design', 'Design', 'The Garden Studio: imagine, shape, compose and grow a planting'], ['plants', 'Plants', 'The Plant Library: ten species and what is recorded about them'], ['knowledge', 'Knowledge', 'The evidence behind the designs: sources, claims, relationships, research and method']];
const KNOW = [['overview', 'Overview', 'knowledge', 'From a source to a design decision, on one real example'], ['explore', 'Explore', 'explore', 'Graph, matrix, table and comparison over the same records'], ['research', 'Research', 'research', 'The practitioner survey, what is recorded and missing, how to contribute'], ['method', 'Method', 'method', 'Who or what decides, the rules, and the limits']];
export function navHtml(active) { return `<nav class="pi-nav" aria-label="Planting Intelligence">${NAV.map(([k, l, t]) => `<a href="${routes[k]}" title="${esc(t)}"${k === active ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`; }
/** the second level, shown on every Knowledge page: one body of knowledge, four ways to read it */
export function knowledgeNav(section) { return `<nav class="pi-subnav" aria-label="Knowledge">${KNOW.map(([k, l, r, t]) => `<a href="${routes[r]}" title="${esc(t)}"${k === section ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`; }
export function exploreSwitch(mode) { return `<div class="pi-switch" role="group" aria-label="Two ways to see the records"><a href="${routes.explore}"${mode === 'explorer' ? ' aria-current="true"' : ''} title="graph, spatial function matrix, attribute table and comparison, with the evidence behind every line">Explorer</a><a href="${routes.neural}"${mode === 'neural' ? ' aria-current="true"' : ''} title="the same claims as one three-dimensional network">Neural view</a></div>`; }
export function returnChip() { const d = activeDesign(); if (!d) return ''; return `<a class="pi-return" href="${routes.design}" title="${esc(d.name)} — reopens where you left it"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 3.5 5 8l4.5 4.5"/></svg>${esc(returnLabel(d))}</a>`; }
/** the bar of every page except the Studio (which keeps its own #top and takes navHtml into it). `section` names the Knowledge
 *  page (overview · explore · research · method) and brings the second level with it; `sub` is a module's own addition. */
export function mountTop(el, { active, section = null, sub = '', snapshot = null, tone = 'light' } = {}) {
  el.classList.add('pi-top'); if (tone === 'dark') el.classList.add('pi-dark');
  el.innerHTML = `<a class="pi-wordmark" href="${routes.design}">Planting Intelligence</a>${navHtml(active)}<div class="pi-sub">${active === 'knowledge' ? knowledgeNav(section) : ''}${sub}</div><div class="pi-right">${returnChip()}${snapshot ? `<span class="pi-snap" title="${esc(snapshotLine(snapshot))} — every page of the platform reads this one file">knowledge ${esc(snapshot.generated)}</span>` : ''}</div>`;
  return el;
}
export function footHtml(d) { return `<footer class="pi-foot"><span>Planting Intelligence · ARCH 540, UBC</span><a href="${routes.knowledge}">Knowledge</a><a href="${routes.research}">Research</a><a href="${routes.method}">Method</a><a href="${REPO_URL}" rel="noopener">Source and data</a>${d ? `<span class="pi-mono">${esc(snapshotLine(d))}</span>` : ''}</footer>`; }
