// Planting Intelligence · platform layer (2026-11-14). One small module every public surface loads: the Garden Studio (design/),
// the Plant Library (platform/plants/), the Knowledge Explorer (brain/explorer/), the Neural view (brain/), Contribute and How it
// works. It holds what the modules have to agree on and nothing else:
//
//   routes     where each module lives, as absolute URLs resolved from this file — never from a query string or a referrer
//   ids        a species is `plant:<slug>` inside the knowledge snapshot and `<slug>` in a URL; functions keep their `z:` ids and
//              claims their `<slug>:<field>:<n>` ids. Nothing else identifies a record.
//   links      the cross-module navigation contract (below)
//   design     a read-only look at the Studio's saved project, so another module can say what the user will return to
//   considered species the user asked the Studio to check for their design — a preference, never a planting decision
//   top bar    Design · Plants · Explore · Contribute, the same on every page
//
// Navigation contract
//   Plant profile      <plants>#species=<slug>
//   Explorer, focused  <explore>#fk=species&fi=plant:<slug>            (the Explorer's own URL state; add ik/ii for one record)
//   Neural, focused    <neural>#species=<slug>
//   Back to a design   <design>                                         (the Studio reopens its saved project at the stage, bed,
//                                                                         view and selection it was left in: project.ui.view)
// A return path is therefore always the platform's own Design route. No module accepts a URL to go back to.
//
// No plant fact is written here. Everything about a plant is read from the published snapshot (routes.snapshot).

const LAYOUT = 'preview';   // tools/build_platform.py writes 'preview' into the published copy
const ROOT = new URL('../../', import.meta.url);   // the folder that holds every module, in both layouts
const PATHS = {
  repo: { design: 'design/', plants: 'platform/plants/', explore: 'brain/explorer/', neural: 'brain/', contribute: 'platform/contribute/', how: 'platform/how-it-works/', snapshot: 'brain/data/explorer.json', images: 'platform/data/images.json', img: 'platform/img/' },
  preview: { design: '', plants: 'plants/', explore: 'explore/', neural: 'explore/neural/', contribute: 'contribute/', how: 'how-it-works/', snapshot: 'data/explorer.json', images: 'platform/data/images.json', img: 'platform/img/' },
}[LAYOUT];
export const routes = Object.fromEntries(Object.entries(PATHS).map(([k, v]) => [k, new URL(v, ROOT).href]));
export const SURVEY_URL = 'https://kaiyankay.github.io/planting-survey/';
export const REPO_URL = 'https://github.com/kaiyankay/planting-db';

export const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
export const slugOf = id => String(id || '').replace(/^plant:/, '');
export const speciesId = slug => `plant:${slugOf(slug)}`;

export const links = {
  design: () => routes.design,
  library: () => routes.plants,
  profile: id => `${routes.plants}#species=${encodeURIComponent(slugOf(id))}`,
  explorer: (id, inspect) => { if (!id) return routes.explore; const p = new URLSearchParams({ fk: 'species', fi: speciesId(id) }); if (inspect) { p.set('ik', inspect.kind); p.set('ii', inspect.id); } return `${routes.explore}#${p}`; },
  neural: id => id ? `${routes.neural}#species=${encodeURIComponent(slugOf(id))}` : routes.neural,
  contribute: () => routes.contribute,
  how: () => routes.how,
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
/** photograph credits (platform/data/images.json): presentation assets, not plant facts */
export function loadImages() { return imagesP || (imagesP = fetch(routes.images, { cache: 'no-cache' }).then(r => r.ok ? r.json() : { images: {} }).catch(() => ({ images: {} }))); }
export const imageUrl = file => new URL(file, routes.img).href;

// ---------------------------------------------------------------- top bar
const NAV = [['design', 'Design', 'Imagine, shape, compose and grow a planting'], ['plants', 'Plants', 'The Plant Library: ten species and what is recorded about them'], ['explore', 'Explore', 'The knowledge graph, the function matrix and the evidence behind every line'], ['contribute', 'Contribute', 'The survey, what is still unknown, and how knowledge is reviewed and published']];
export function navHtml(active) { return `<nav class="pi-nav" aria-label="Planting Intelligence">${NAV.map(([k, l, t]) => `<a href="${routes[k]}" title="${esc(t)}"${k === active ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`; }
export function exploreSwitch(mode) { return `<div class="pi-switch" role="group" aria-label="Ways to explore the knowledge"><a href="${routes.explore}"${mode === 'explorer' ? ' aria-current="true"' : ''} title="graph, spatial function matrix, attribute table and evidence">Explorer</a><a href="${routes.neural}"${mode === 'neural' ? ' aria-current="true"' : ''} title="the same claims as one three-dimensional network">Neural view</a></div>`; }
export function returnChip() { const d = activeDesign(); if (!d) return ''; return `<a class="pi-return" href="${routes.design}" title="${esc(d.name)} — reopens where you left it"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 3.5 5 8l4.5 4.5"/></svg>${esc(returnLabel(d))}</a>`; }
/** the bar of every page except the Studio (which keeps its own #top and takes navHtml into it) */
export function mountTop(el, { active, sub = '', snapshot = null, tone = 'light' } = {}) {
  el.classList.add('pi-top'); if (tone === 'dark') el.classList.add('pi-dark');
  el.innerHTML = `<a class="pi-wordmark" href="${routes.design}">Planting Intelligence</a>${navHtml(active)}<div class="pi-sub">${sub}</div><div class="pi-right">${returnChip()}<a class="pi-quiet" href="${routes.how}"${active === 'how' ? ' aria-current="page"' : ''}>How it works</a>${snapshot ? `<span class="pi-snap" title="${esc(snapshotLine(snapshot))} — every page of the platform reads this one file">knowledge ${esc(snapshot.generated)}</span>` : ''}</div>`;
  return el;
}
export function footHtml(d) { return `<footer class="pi-foot"><span>Planting Intelligence · ARCH 540, UBC</span><a href="${routes.how}">How it works</a><a href="${routes.contribute}">Contribute</a><a href="${REPO_URL}" rel="noopener">Source and data</a>${d ? `<span class="pi-mono">${esc(snapshotLine(d))}</span>` : ''}</footer>`; }
