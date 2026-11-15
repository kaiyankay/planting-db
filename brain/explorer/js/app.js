// Planting Intelligence · Knowledge Explorer (Phase 1 brief 2026-11-07; reorganised for Platform V2, 2026-11-14).
// One selection state, ONE working view at a time — Relationship graph · Spatial function matrix · Attribute table · A/B comparison —
// and the Evidence inspector as a contextual panel beside it. The default entry is a start screen (search, the functions, the species,
// three questions), never the whole graph; the graph grows only by the layers the reader adds. Every view reads the same projection
// (brain/data/explorer.json, tools/build_explorer.py) and the same state S; a click anywhere changes S and what is on screen is
// re-rendered from it. Nothing about the plants is written here. The state lives in the URL hash, so a view can be shared:
//   fk, fi      the focus: species · function · concept (fi = its id) or pair (with a and b)
//   a, b        the two species of the comparison
//   ik, ii      the inspected record: link · attr · concept_link · relation · species · function · concept
//   v           the working view: graph | matrix | table | compare.  Without v, a focus opens the graph, `tab=compare` (the old inspector
//               tab) opens the comparison, and nothing at all opens the start screen — so every V1 link still lands where it did.
//   x           layers added to the graph, comma-separated: traits · gaps · relations · all · a knowledge-group id (model.js graphFor)
import { load } from './model.js';
import * as PI from '../../../platform/js/platform.js';   // platform bar, cross-module links
import * as PC from '../../../platform/js/plantcard.js';   // the shared plant card

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const human = s => String(s ?? '').replace(/_/g, ' ');
const plural = (n, w, ws = w + 's') => `${n} ${n === 1 ? w : ws}`;
const ic = d => `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true">${d}</svg>`;
const IC = {
  graph: ic('<circle cx="4" cy="4.5" r="1.7"/><circle cx="12" cy="6" r="1.7"/><circle cx="6.5" cy="12" r="1.7"/><path d="M5.7 4.8 10.3 5.7M4.5 6.2l1.4 4.2M10.9 7.3 7.7 10.8"/>'),
  matrix: ic('<rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M2.5 6.2h11M2.5 9.8h11M6.2 2.5v11M9.8 2.5v11"/>'),
  table: ic('<rect x="2.5" y="3" width="11" height="10" rx="1"/><path d="M2.5 6.3h11M6.5 6.3V13"/>'),
  compare: ic('<rect x="2.5" y="3" width="4.4" height="10" rx="1"/><rect x="9.1" y="3" width="4.4" height="10" rx="1"/>'),
  plus: ic('<path d="M8 3.5v9M3.5 8h9"/>'), check: ic('<path d="m3.5 8.5 3 3 6-7"/>'), x: ic('<path d="m4 4 8 8M12 4l-8 8"/>'),
  swap: ic('<path d="M3 5.5h9.5M10 3l2.5 2.5L10 8M13 10.5H3.5M6 8 3.5 10.5 6 13"/>'),
  search: ic('<circle cx="7" cy="7" r="4.3"/><path d="m10.3 10.3 3.2 3.2"/>'),
};
const VIEWS = [['graph', 'Graph', 'Relationships around one focus, expanded on purpose'], ['matrix', 'Matrix', 'Every species against the spatial functions'], ['table', 'Table', 'Every attribute of every species, and what is not recorded'], ['compare', 'Compare', 'Two plants: shared attributes, recorded relations, complementarity, unknowns']];
const VIEW_IDS = VIEWS.map(v => v[0]);
const LAYER_KEYS = new Set(['traits', 'gaps', 'relations', 'all']);
const KIND_WORD = { species: 'Species', function: 'Spatial function', concept: 'Concept', pair: 'Pair' };
const S = { M: null, focus: null, a: null, b: null, inspect: null, view: null, x: new Set(), inspClosed: false, q: '', sort: null, groups: new Set(), identity: true, pan: { x: 0, y: 0, k: 1 }, layout: null, layoutKey: '', imgs: null };

// ------------------------------------------------------------------ boot
(async function boot() {
  try {
    const url = new URLSearchParams(location.search).get('data') || '../data/explorer.json';
    S.M = await load(url);
    S.groups = new Set(S.M.groups.map(g => g.id));
    PI.mountTop($('#pitop'), { active: 'knowledge', section: 'explore', sub: PI.exploreSwitch('explorer'), snapshot: S.M.d }); PI.loadImages().then(i => { S.imgs = i; renderInspector(); });
    readHash(); initUi(); update();
    window.addEventListener('hashchange', () => { readHash(); update(); });
    window.explorer = { S, M: S.M, update, setFocus, setInspect, setAB, setView, toggleLayer, act, renderTable, graphFor: () => S.M.graphFor(S.focus, S.a, S.b, S.x) };   // for tests and the console
    $('#loading').classList.add('gone');
  } catch (e) { $('#err').textContent = `could not load: ${e.message}\n\nserve the planting-db root:  python3 -m http.server 8766  → http://localhost:8766/brain/explorer/`; console.error(e); }
})();

// ------------------------------------------------------------------ state ↔ url
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1)); const M = S.M;
  const fk = p.get('fk'), fi = p.get('fi');
  S.focus = fk === 'pair' ? { kind: 'pair' } : fk && fi && M.kindOf(fi) === fk ? { kind: fk, id: fi } : null;
  S.a = M.SP.has(p.get('a')) ? p.get('a') : null; S.b = M.SP.has(p.get('b')) ? p.get('b') : null;
  if (S.focus?.kind === 'pair' && !(S.a && S.b)) S.focus = null;
  const ik = p.get('ik'), ii = p.get('ii');
  S.inspect = ik && ii && inspectable(ik, ii) ? { kind: ik, id: ii } : null;
  S.x = new Set((p.get('x') || '').split(',').filter(k => LAYER_KEYS.has(k) || M.GR.has(k)));
  const v = p.get('v');
  S.view = VIEW_IDS.includes(v) ? v : S.focus ? 'graph' : p.get('tab') === 'compare' ? 'compare' : S.inspect ? viewForRecord(S.inspect) : null;
  S.inspClosed = false;
}
/** a record named in the URL without a focus or a view: the view it belongs to (a graph record brings its own focus) */
function viewForRecord(i) {
  const M = S.M; if (i.kind === 'attr') return 'table'; if (i.kind === 'link') return 'matrix';
  if (i.kind === 'concept_link') S.focus = { kind: 'species', id: M.CL.get(i.id).species }; else if (i.kind === 'relation') S.focus = { kind: 'species', id: M.RE.get(i.id).a }; else S.focus = { kind: i.kind, id: i.id };
  if (i.kind === 'relation') S.x.add('relations'); if (i.kind === 'concept_link') S.x.add(M.CL.get(i.id).group);
  return 'graph';
}
function writeHash() {
  const p = new URLSearchParams();
  if (S.focus) { p.set('fk', S.focus.kind); if (S.focus.id) p.set('fi', S.focus.id); }
  if (S.a) p.set('a', S.a); if (S.b) p.set('b', S.b);
  if (S.inspect) { p.set('ik', S.inspect.kind); p.set('ii', S.inspect.id); }
  if (S.view && !(S.view === 'graph' && S.focus)) p.set('v', S.view);   // a focus alone opens the graph, as every V1 link does
  if (S.x.size) p.set('x', [...S.x].join(','));
  const h = p.toString() ? '#' + p.toString() : location.pathname + location.search; if ((location.hash || location.pathname + location.search) !== h) history.replaceState(null, '', h);
}
function inspectable(kind, id) { const M = S.M; return kind === 'link' ? M.LK.has(id) : kind === 'attr' ? M.AT.has(id) : kind === 'concept_link' ? M.CL.has(id) : kind === 'relation' ? M.RE.has(id) : kind === 'species' ? M.SP.has(id) : kind === 'function' ? M.FN.has(id) : kind === 'concept' ? M.CO.has(id) : false; }
/** focus a record. From the start screen and from the comparison the graph opens; in the matrix and the table the view stays and marks it. */
function setFocus(kind, id) { S.focus = kind ? { kind, id } : null; if (kind !== 'pair') S.inspect = null; S.x = new Set(); S.inspClosed = false; if (kind && (kind === 'pair' || S.view === null || S.view === 'compare')) S.view = 'graph'; update(); }
function setInspect(kind, id) { S.inspect = kind ? { kind, id } : null; S.inspClosed = false; update(); }
function setView(v) { S.view = VIEW_IDS.includes(v) ? v : null; if (S.view === 'compare' && !S.a && S.focus?.kind === 'species' && S.focus.id !== S.b) S.a = S.focus.id; S.inspClosed = false; update(); }
function toggleLayer(k) { if (S.x.has('traits') && S.M.GR.has(k)) { S.x.delete('traits'); for (const g of S.M.groups) if (g.id !== k) S.x.add(g.id); } else if (S.x.has(k)) S.x.delete(k); else S.x.add(k); update(); }   // `traits` on a species means every group: taking one group off leaves the others
function setAB(which, id) { if (which === 'a') { if (S.b === id) S.b = S.a; S.a = S.a === id ? null : id; } else { if (S.a === id) S.a = S.b; S.b = S.b === id ? null : id; } if (S.focus?.kind === 'pair' && !(S.a && S.b)) S.focus = null; update(); }
function pick(which, v) { if (which === 'a') { if (v && v === S.b) S.b = S.a; S.a = v; } else { if (v && v === S.a) S.a = S.b; S.b = v; } if (S.focus?.kind === 'pair' && !(S.a && S.b)) S.focus = null; update(); }
const inspectorOpen = () => S.view !== null && !S.inspClosed && !!(S.inspect || (S.focus && S.view !== 'compare'));
function update() {
  writeHash(); renderFrame();
  if (S.view === null) renderStart(); else if (S.view === 'graph') renderGraph(); else if (S.view === 'matrix') renderMatrix(); else if (S.view === 'table') renderTable(); else renderCompare();
  renderInspector();
}

// ------------------------------------------------------------------ ui wiring
function initUi() {
  $('#views').innerHTML = VIEWS.map(([k, l, t]) => `<button data-view="${k}" aria-pressed="false" title="${esc(t)}">${IC[k]}<span>${l}</span></button>`).join('');
  $('#howbody').innerHTML = howHtml();
  document.body.addEventListener('click', ev => {
    if (!ev.target.closest('#how')) $('#how').open = false;
    const t = ev.target.closest('[data-focus],[data-inspect],[data-ab],[data-view],[data-layer],[data-act]'); if (!t) return;
    if (t.tagName === 'A') ev.preventDefault();
    if (t.dataset.focus !== undefined) { const [k, ...rest] = t.dataset.focus.split('='); setFocus(k === 'none' || !k ? null : k, rest.join('=')); }
    else if (t.dataset.inspect !== undefined) { const [k, ...rest] = t.dataset.inspect.split('='); setInspect(k, rest.join('=')); }
    else if (t.dataset.ab) { ev.stopPropagation(); setAB(t.dataset.ab, t.dataset.id); }
    else if (t.dataset.view) setView(t.dataset.view);
    else if (t.dataset.layer) toggleLayer(t.dataset.layer);
    else if (t.dataset.act) act(t.dataset.act, t.dataset.id);
  });
  document.body.addEventListener('change', ev => { const t = ev.target.closest('[data-pick]'); if (t) pick(t.dataset.pick, t.value || null); });
  wireSearch($('#search'), $('#results'));
  document.addEventListener('keydown', ev => {
    const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(ev.target.tagName);
    if (ev.key === '/' && !typing) { (S.view === null ? $('#search0') : $('#search'))?.focus(); ev.preventDefault(); return; }
    if (ev.key !== 'Escape' || typing) return;
    if ($('#how').open) $('#how').open = false;
    else if (inspectorOpen()) act('close-insp');
    else if (S.focus) setFocus(null);
  });
  initGraphInteraction();
}
/** the same search on the start screen and in the toolbar: species, functions and the concepts a plant reaches; Enter focuses the hit */
function wireSearch(inp, res) {
  let hi = -1, cur = [];
  const show = () => { const q = inp.value.trim(); res.innerHTML = cur.length ? cur.map((n, i) => `<div class="${i === hi ? 'hi' : ''}" data-i="${i}"><span>${n.kind === 'species' ? `<i class="sci">${esc(n.label)}</i>` : esc(n.label)}${n.sub ? ` <span class="faint">· ${esc(n.sub)}</span>` : ''}</span><small>${esc(n.kind)}</small></div>`).join('') : q.length >= 2 ? `<div class="none">Nothing in this snapshot matches “${esc(q)}”. Try part of a plant name, a trait or a spatial function.</div>` : ''; res.classList.toggle('open', cur.length > 0 || q.length >= 2); };
  const go = i => { const n = cur[i]; if (!n) return; inp.value = ''; cur = []; show(); inp.blur(); setFocus(n.kind, n.id); };
  inp.addEventListener('input', () => { cur = S.M.search(inp.value); hi = cur.length ? 0 : -1; show(); });
  inp.addEventListener('keydown', ev => { if (ev.key === 'ArrowDown') { hi = Math.min(cur.length - 1, hi + 1); show(); ev.preventDefault(); } else if (ev.key === 'ArrowUp') { hi = Math.max(0, hi - 1); show(); ev.preventDefault(); } else if (ev.key === 'Enter') go(hi); else if (ev.key === 'Escape') { inp.value = ''; cur = []; show(); inp.blur(); } });
  inp.addEventListener('blur', () => setTimeout(() => { cur = []; res.classList.remove('open'); }, 150));
  res.addEventListener('mousedown', ev => { const d = ev.target.closest('[data-i]'); if (d) { ev.preventDefault(); go(+d.dataset.i); } });
}
function act(a, id) {
  if (a === 'home') { S.focus = null; S.inspect = null; S.view = null; S.x = new Set(); update(); }
  else if (a === 'everything') { S.focus = null; S.inspect = null; S.view = 'graph'; S.x = new Set(['all']); update(); }
  else if (a === 'swap') { [S.a, S.b] = [S.b, S.a]; update(); }
  else if (a === 'pair') { if (S.a && S.b) setFocus('pair'); }
  else if (a === 'pick-a' || a === 'pick-b') pick(a.slice(-1), $(`#sel-${a.slice(-1)}`)?.value || null);
  else if (a === 'clear-ab') { S.a = S.b = null; if (S.focus?.kind === 'pair') S.focus = null; update(); }
  else if (a === 'tq') { S.q = $('#tq').value; renderTable(); }
  else if (a === 'tg') { const g = id; if (S.groups.has(g)) S.groups.delete(g); else S.groups.add(g); if (S.view === 'compare') renderCompare(); else renderTable(); }
  else if (a === 'tident') { S.identity = !S.identity; renderTable(); }
  else if (a === 'tsort') { S.sort = S.sort === id ? null : id; renderTable(); }
  else if (a === 'fit') { S.pan = { x: 0, y: 0, k: 1 }; applyView(); }
  else if (a === 'close-insp') { S.inspect = null; S.inspClosed = true; update(); }
  else if (a === 'open-insp') { S.inspClosed = false; update(); }
}

// ------------------------------------------------------------------ frame: which pane is on screen, the toolbar, what is focused
function renderFrame() {
  const M = S.M; const start = S.view === null;
  $('#bar').hidden = start; $('#start').hidden = !start; $('#stage').hidden = start;
  for (const k of VIEW_IDS) $(`#v-${k}`).hidden = S.view !== k;
  document.querySelectorAll('#views button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
  const f = S.focus; const nm = id => `<i class="sci">${esc(M.name(id))}</i>`; let h = '';
  if (f && f.kind !== 'pair') h += `<span class="c">${KIND_WORD[f.kind]} <b data-act="open-insp" title="Show its record">${f.kind === 'species' ? nm(f.id) : esc(M.name(f.id))}</b><button class="x" data-focus="none" aria-label="Clear the focus" title="Clear the focus">${IC.x}</button></span>`;
  if (S.a || S.b) h += `<span class="c">${S.a ? `${tag('A')}${nm(S.a)}` : ''}${S.b ? ` ${tag('B')}${nm(S.b)}` : ''}${S.a && S.b && S.view !== 'compare' ? ` <span class="link" data-view="compare">Compare</span>` : ''}<button class="x" data-act="clear-ab" aria-label="Clear A and B" title="Clear A and B">${IC.x}</button></span>`;
  $('#crumb').innerHTML = h;
  document.title = `${f && f.kind !== 'pair' ? M.name(f.id) + ' · ' : ''}Explore · Knowledge · Planting Intelligence`;
}
function renderStart() {
  const el = $('#start'); if (el.dataset.built) return; el.dataset.built = '1';
  const M = S.M, st = M.stats; const by = st.links_by_status;
  el.innerHTML = `<div class="start">
    <h1>Explore the <em>records</em></h1>
    <p class="lede">Search a plant, a trait or a spatial function, or start from one of the lists. One view is open at a time, and the claims, sources and rules behind whatever you select appear beside it.</p>
    <div class="searchbox">${IC.search}<input id="search0" type="search" placeholder="Search a plant, a trait, a spatial function" aria-label="Search a plant, a trait or a spatial function" autocomplete="off" spellcheck="false"><kbd>/</kbd><div class="results" id="results0"></div></div>
    <p class="prov">${st.species} species · ${st.functions} spatial functions · ${st.claims} claims from ${st.sources} sources, ${st.claims_by_status.verified || 0} verified by a person · snapshot ${esc(M.d.generated)}</p>
    <div class="ways">
      <div class="f"><h2>Start from a spatial function</h2>${M.functions.map(f => `<a class="srow" href="#" data-focus="function=${esc(f.id)}"><b>${esc(f.label)}</b><span>${esc(f.definition)}</span><small>${f.n_linked} linked · ${f.n_unknown} unknown</small></a>`).join('')}</div>
      <div class="p"><h2>or from a plant</h2>${M.species.map(s => `<a class="prow" href="#" data-focus="species=${esc(s.id)}"><i>${esc(s.scientific_name)}</i><span>${esc((s.common_names || [])[0] || '')}</span></a>`).join('')}</div>
      <div class="q"><h2>or from a question</h2>
        <a class="srow wide" href="#" data-view="table"><b>Where do the sources disagree, and what has nobody recorded?</b><small>Table · ${st.cells_with_disagreement} fields in disagreement · ${st.cells_not_recorded} not recorded</small></a>
        <a class="srow wide" href="#" data-view="matrix"><b>Which links to a function rest on a recorded use, and which are only inferred or unknown?</b><small>Matrix · ${by.derived || 0} from a use · ${by.candidate || 0} inferred · ${by.unknown || 0} unknown</small></a>
        <a class="srow wide" href="#" data-view="compare"><b>What do two plants share, and what is actually recorded between them?</b><small>Compare · ${st.pairs} pairs · ${st.pairs_with_direct} with a direct record</small></a>
      </div>
    </div>
    <p class="every">The graph opens with one focus and grows only when you add to it. To see all ${st.links_drawn} drawn links at once, <a href="#" data-act="everything">open the full graph</a>.</p>
  </div>`;
  wireSearch($('#search0'), $('#results0'));
}
function howHtml() {
  const M = S.M, v = M.vocab.status;
  return `<h3>Lines in the graph</h3><div class="lg"><p><i></i><b>documented</b> ${esc(v.documented)}</p><p><i class="derived"></i><b>derived</b> ${esc(v.derived)}</p><p><i class="candidate"></i><b>candidate</b> ${esc(v.candidate)}</p><p><i class="unknown"></i><b>unknown</b> ${esc(v.unknown)}</p><p><i class="rel"></i><b>plant-to-plant record</b> only what relations.json holds; sharing a trait never draws a line between two plants</p><p><i class="trait"></i><b>trait line</b> a claim about the plant reaches a concept</p></div>
    <h3>Three separate statements on every record</h3><p><b>Status</b> ${tag('documented')} ${tag('derived')} ${tag('candidate')} ${tag('unknown')} what kind of knowledge a line is.</p><p><b>Verification</b> ${tag('verified')} ${tag('unverified')} ${tag('none')} whether a person verified a supporting claim. ${M.stats.claims_by_status.verified || 0} of ${M.stats.claims} claims are verified; a ✓ in the matrix or the table marks one.</p><p><b>AI source check</b> ${tag('supported_by_source')} ${tag('partially_supported')} ${tag('conflicting_evidence')} an assessment by the review pipeline, shown apart. It never verifies anything.</p>
    <h3>What is never done here</h3><p>No value is averaged or picked as best: a field shows every claim. No unknown link is drawn: it is a gap with its requirement check. Retired plant-to-plant records are listed as history. Nothing is promoted, and exploring changes no record.</p>
    <h3>Working with it</h3><p>Click a name or a node to focus it, a line or a cell for its evidence. The graph grows only by the layers you add. Switching the view keeps the selection. <b>/</b> search · <b>Esc</b> close the evidence, then clear the focus.</p>
    <h3>Data</h3><p class="mono">brain/data/explorer.json · ${esc(M.d.generated)} · ${esc(M.d.generated_by)} · ${esc(M.d.method)}<br>inputs: ${esc(M.d.inputs.join(', '))}</p>`;
}

// ------------------------------------------------------------------ graph (SVG, deterministic force layout around the focus)
const R_OF = n => n.focus ? 15 : n.kind === 'function' ? 11 : n.kind === 'species' ? 8.5 : 4.6;
/** where each node stands. Around a focus the graph is drawn as rings — the focus in the middle, what it is linked to on the inner
 *  ring, what was added on the outer one — placed by rule, so the same selection always gives the same picture. Without a single
 *  focus (the full graph, a pair) a small force layout spreads the nodes. Records without a link stand in a row underneath, unconnected. */
function layout(g, W, H) {
  const nodes = g.nodes.map(n => ({ ...n })); const byId = new Map(nodes.map(n => [n.id, n]));
  const ghosts = nodes.filter(n => n.ghost), real = nodes.filter(n => !n.ghost);
  const strip = ghosts.length ? 96 : 0; const cx = W / 2, cy = (H - strip) / 2 + 8, RX = Math.max(120, Math.min(W * 0.42, W / 2 - 104)), RY = Math.max(90, (H - strip) * 0.37), R = (RX + RY) / 2;
  ghosts.forEach((nd, i) => { nd.x = 70 + (W - 140) * ((i + .5) / ghosts.length); nd.y = H - 46; nd.fixed = true; });
  const centre = g.center ? byId.get(g.center) : null;
  if (centre) {
    centre.x = cx; centre.y = cy; const has = k => real.some(n => n.kind === k && !n.focus);
    const ring = centre.kind === 'function' ? { species: has('concept') ? .58 : .8, concept: 1 } : centre.kind === 'species' ? { function: has('concept') || has('species') ? .46 : .72, species: has('concept') ? .74 : .9, concept: 1 } : { species: has('function') ? .62 : .8, function: 1 };
    const start = { function: -Math.PI / 2, species: centre.kind === 'species' ? Math.PI / 5 : -Math.PI / 2 + .45, concept: -Math.PI / 2 + .2 };
    for (const k of ['function', 'species', 'concept']) {
      const ks = real.filter(n => n.kind === k && !n.focus).sort((a, b) => k === 'concept' ? String(a.group || '').localeCompare(String(b.group || '')) || a.label.localeCompare(b.label) : 0); const n = ks.length;   // concepts stand grouped by knowledge group
      ks.forEach((nd, i) => { const a = start[k] + (i / Math.max(1, n)) * Math.PI * 2; const r = ring[k] * (k === 'concept' && n > 12 && i % 2 ? .84 : 1); nd.x = cx + Math.cos(a) * RX * r; nd.y = cy + Math.sin(a) * RY * r; });
    }
    return { nodes, byId };
  }
  const ringOf = n => n.kind === 'function' ? (g.seed ? .55 : .42) : 1;
  for (const k of ['function', 'species', 'concept']) {
    const ks = real.filter(n => n.kind === k && !n.focus).sort((a, b) => k === 'concept' ? String(a.group || '').localeCompare(String(b.group || '')) || a.label.localeCompare(b.label) : 0); const n = ks.length;
    ks.forEach((nd, i) => { const a = (i / Math.max(1, n)) * Math.PI * 2 + (k === 'species' ? .3 : k === 'concept' ? .9 : -Math.PI / 2); const r = ringOf(nd); nd.x = cx + Math.cos(a) * RX * r; nd.y = cy + Math.sin(a) * RY * r; nd.vx = nd.vy = 0; });
  }
  if (g.pair) { const [a, b] = g.pair; for (const id of [a, b]) { const n = byId.get(id); n.y = cy; n.fixed = true; n.vx = n.vy = 0; } byId.get(a).x = cx - RX * .5; byId.get(b).x = cx + RX * .5; }
  if (!g.pair) return { nodes, byId };   // the functions alone, or every species around them: two rings, placed by rule
  const edges = g.edges.filter(e => byId.has(e.source) && byId.has(e.target)).map(e => ({ s: byId.get(e.source), t: byId.get(e.target), rel: e.rel }));
  const rest = e => e.rel === 'suited_for' ? R * .8 : e.rel === 'requires_trait' ? R * .6 : e.rel === 'has_trait' || e.rel === 'grows_in' ? R * .55 : R * .75;
  const N = real.length;
  for (let it = 0; it < 260; it++) {
    const alpha = 1 - it / 260, k = .9 * alpha + .05;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const a = real[i], b = real[j]; let dx = b.x - a.x, dy = b.y - a.y; let d2 = dx * dx + dy * dy; if (d2 < 1) { dx = (i - j) * .1 + .1; dy = .1; d2 = .02; }
      const d = Math.sqrt(d2); const min = R_OF(a) + R_OF(b) + (a.kind === 'concept' && b.kind === 'concept' ? 28 : 38);
      const f = (d < min ? (min - d) * .22 : 0) + 380 * k / d2;
      const fx = dx / d * f, fy = dy / d * f; if (!a.fixed) { a.vx -= fx; a.vy -= fy; } if (!b.fixed) { b.vx += fx; b.vy += fy; }
    }
    for (const e of edges) { if (e.s.fixed && e.t.fixed) continue; let dx = e.t.x - e.s.x, dy = e.t.y - e.s.y; const d = Math.max(1, Math.hypot(dx, dy)); const f = (d - rest(e)) * .018 * (e.rel === 'suited_for' ? 1.4 : 1); const fx = dx / d * f, fy = dy / d * f; if (!e.s.fixed) { e.s.vx += fx; e.s.vy += fy; } if (!e.t.fixed) { e.t.vx -= fx; e.t.vy -= fy; } }
    for (const n of real) {
      if (n.fixed) continue;
      const dx = n.x - cx, dy = n.y - cy, dn = Math.max(.01, Math.hypot(dx / RX, dy / RY)), tr = ringOf(n); const f = (tr - dn) * R * .02;   // soft elliptical ring: keeps the concentric reading
      n.vx += dx / (dn * RX) * f * (RX / R); n.vy += dy / (dn * RY) * f * (RY / R);
      n.vx *= .6; n.vy *= .6; n.x += n.vx; n.y += n.vy;
      n.x = Math.max(60, Math.min(W - 60, n.x)); n.y = Math.max(36, Math.min(H - strip - 40, n.y));
    }
  }
  return { nodes, byId };
}
function initGraphInteraction() {
  const svg = $('#svg'); let drag = null;
  svg.addEventListener('mousedown', ev => { if (ev.target.closest('.node, .edge')) return; drag = { x: ev.clientX, y: ev.clientY, vx: S.pan.x, vy: S.pan.y }; svg.classList.add('dragging'); });
  window.addEventListener('mousemove', ev => { if (!drag) return; S.pan.x = drag.vx + (ev.clientX - drag.x); S.pan.y = drag.vy + (ev.clientY - drag.y); applyView(); });
  window.addEventListener('mouseup', () => { drag = null; svg.classList.remove('dragging'); });
  svg.addEventListener('wheel', ev => { ev.preventDefault(); const r = svg.getBoundingClientRect(); const mx = ev.clientX - r.left, my = ev.clientY - r.top; const k0 = S.pan.k, k1 = Math.max(.4, Math.min(3, k0 * (ev.deltaY < 0 ? 1.12 : .89))); S.pan.x = mx - (mx - S.pan.x) * k1 / k0; S.pan.y = my - (my - S.pan.y) * k1 / k0; S.pan.k = k1; applyView(); }, { passive: false });
  const tip = $('#tip');
  svg.addEventListener('mousemove', ev => { const t = ev.target.closest('[data-tip]'); if (!t) { tip.style.display = 'none'; return; } tip.innerHTML = t.dataset.tip; tip.style.display = 'block'; tip.style.left = `${Math.min(ev.clientX + 14, innerWidth - 340)}px`; tip.style.top = `${ev.clientY + 12}px`; });
  svg.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  new ResizeObserver(() => { if (S.view === 'graph') drawGraph(); }).observe($('#gbody'));
}
function applyView() { const g = $('#svg g.view'); if (g) g.setAttribute('transform', `translate(${S.pan.x},${S.pan.y}) scale(${S.pan.k})`); }
function renderGraph() {
  const M = S.M, f = S.focus; const g = M.graphFor(f, S.a, S.b, S.x); const layers = M.layersFor(f);
  const real = g.nodes.filter(n => !n.ghost).length, ghosts = g.nodes.length - real;
  const title = !f ? 'Relationship graph' : f.kind === 'pair' ? `<i class="sci">${esc(M.name(S.a))}</i> and <i class="sci">${esc(M.name(S.b))}</i>` : f.kind === 'species' ? `<i class="sci">${esc(M.name(f.id))}</i>` : esc(M.name(f.id));
  const sub = !f && g.seed ? `${M.functions.length} spatial functions` : f?.kind === 'pair' ? 'what both reach, the functions of each, direct records' : `${plural(real, 'node')} · ${plural(g.edges.length, 'line')}${ghosts ? ` · ${ghosts} without a link` : ''}`;
  const on = l => S.x.has(l.key) || (!!l.traits && S.x.has('traits'));
  const btn = l => `<button class="layer" data-layer="${esc(l.key)}" aria-pressed="${on(l)}" ${l.n ? '' : 'disabled title="nothing recorded to add"'}>${on(l) ? IC.check : IC.plus}${esc(l.label)}<small>${l.n}</small></button>`;
  const traits = layers.filter(l => l.traits), other = layers.filter(l => !l.traits);
  $('#ghead').innerHTML = `<h2>${title}</h2><span class="sub" id="gsub">${esc(sub)}</span>${layers.length ? `<div class="layers ${layers.length > 3 ? 'many' : ''}" role="group" aria-label="Add to the graph">${traits.length ? `<span class="lab">Add traits</span>${traits.map(btn).join('')}<span class="gap"></span>` : `<span class="lab">Add</span>`}${other.map(btn).join('')}</div>` : ''}<div class="right"><button data-act="fit" title="Reset pan and zoom">Fit</button></div>`;
  $('#gnote').textContent = f?.kind === 'pair' ? `Small circles are the ${g.nodes.filter(n => n.kind === 'concept').length} concepts both plants reach; hover one for its name. A line joins the two plants only where a relation was recorded.` : !f && g.seed ? 'Click a function to see the species linked to it. Nothing else is drawn until you ask for it.' : f && !g.edges.length && !ghosts ? `Nothing is linked to ${M.name(f.id)} in the default view. Add a layer above to see what is recorded.` : 'Click a node to focus it, a line for its evidence. Drag to pan, scroll to zoom.';
  drawGraph(g);
}
function drawGraph(g = S.M.graphFor(S.focus, S.a, S.b, S.x)) {
  const M = S.M, svg = $('#svg'); const box = $('#gbody').getBoundingClientRect(); const W = Math.max(300, box.width), H = Math.max(240, box.height);
  const key = `${S.focus?.kind}|${S.focus?.id}|${S.a}|${S.b}|${[...S.x].sort().join(',')}|${Math.round(W)}x${Math.round(H)}`;
  if (S.layoutKey !== key) { S.layout = layout(g, W, H); S.layoutKey = key; S.pan = { x: 0, y: 0, k: 1 }; }
  const L = S.layout; const sel = S.inspect;
  const edgeSel = e => sel && ((sel.kind === 'link' && e.kind === 'link' && sel.id === e.id) || (sel.kind === 'concept_link' && e.kind === 'concept_link' && sel.id === e.id) || (sel.kind === 'relation' && e.kind === 'relation' && sel.id === e.id));
  const inspectOf = e => e.kind === 'link' ? `link=${e.id}` : e.kind === 'concept_link' ? `concept_link=${e.id}` : e.kind === 'relation' ? `relation=${e.id}` : e.kind === 'requirement' ? `function=${e.fn}` : '';
  const edgeTip = e => { const a = M.name(e.source), b = M.name(e.target); return `${esc(a)} <span class="m">${esc(human(e.rel))}</span> ${esc(b)}<div class="m">${esc(e.status)}${e.conflict ? ' · conflict' : ''} · ${esc(e.verification)}${e.strength ? ` · ${esc(e.strength)}` : ''}${e.placeholder ? ' · model placeholder' : ''} — click for evidence</div>`; };
  let h = `<g class="view" transform="translate(${S.pan.x},${S.pan.y}) scale(${S.pan.k})">`;
  for (const e of g.edges) {
    const a = L.byId.get(e.source), b = L.byId.get(e.target); if (!a || !b) continue;
    const cls = `edge ${esc(e.rel)} ${esc(e.status)} ${e.kind === 'relation' ? 'relation' : ''} ${e.conflict ? 'conflict' : ''} ${edgeSel(e) ? 'sel' : ''} ${sel && !edgeSel(e) && sel.kind !== 'species' && sel.kind !== 'function' && sel.kind !== 'concept' ? 'dim' : ''}`;
    h += `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line><line class="edge hit" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" data-inspect="${esc(inspectOf(e))}" data-tip="${esc(edgeTip(e))}"></line>`;
    if (e.kind === 'relation') h += `<text class="elabel" x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - 3}" text-anchor="middle">${esc(human(e.rel))}${e.placeholder ? ' (placeholder)' : ''}</text>`;
  }
  for (const n of L.nodes) {
    const r = R_OF(n); const cls = `node ${n.kind} ${n.focus ? 'focus' : ''} ${n.ghost ? 'ghost' : ''} ${S.a === n.id ? 'a' : ''} ${S.b === n.id ? 'b' : ''}`;
    const dense = L.nodes.length > 28 && n.kind === 'concept'; const mute = dense && !!g.pair;   // a pair's many shared concepts are named on hover
    const label = mute ? '' : n.kind === 'species' ? `<text x="${n.x}" y="${n.y + r + 14}" text-anchor="middle" font-size="12.5" font-style="italic">${esc(n.label)}</text>` : `<text x="${n.x}" y="${n.y + r + (dense ? 10 : n.kind === 'function' ? 14 : 12)}" text-anchor="middle" font-size="${n.kind === 'function' ? 12.5 : dense ? 9.5 : 11}">${esc(dense && n.label.length > 26 ? n.label.slice(0, 24) + '…' : n.label)}</text>`;
    const tipText = n.kind === 'species' ? `<i>${esc(n.label)}</i><div class="m">species · ${(M.sp(n.id).common_names || [])[0] ? esc(M.sp(n.id).common_names[0]) + ' · ' : ''}${M.sp(n.id).claims.live} live claims${n.ghost ? ` · ${esc(n.verdict)} for the focused function — no link drawn` : ''}</div>` : n.kind === 'function' ? `${esc(n.label)}<div class="m">spatial function · ${M.fn(n.id).n_linked} linked · ${M.fn(n.id).n_unknown} unknown${n.ghost ? ` · ${esc(n.verdict)} for the focused species — no link drawn` : ''}</div>` : `${esc(n.label)}<div class="m">${esc(M.co(n.id)?.facet_label || 'concept')} · ${M.co(n.id)?.n_species ?? 0} species</div>`;
    const ab = S.a === n.id ? `<text x="${n.x + r + 3}" y="${n.y - r - 2}" font-size="9.5" font-weight="700" style="fill:var(--olive-deep)">A</text>` : S.b === n.id ? `<text x="${n.x + r + 3}" y="${n.y - r - 2}" font-size="9.5" font-weight="700" style="fill:var(--amber-ink)">B</text>` : '';
    h += `<g class="${cls}" ${n.ghost ? `data-inspect="link=${esc(n.link)}"` : `data-focus="${n.kind}=${esc(n.id)}"`} data-tip="${esc(tipText)}"><circle cx="${n.x}" cy="${n.y}" r="${r}"></circle>${label}${ab}</g>`;
  }
  if (L.nodes.some(n => n.ghost)) h += `<text class="elabel" x="${W / 2}" y="${H - 80}" text-anchor="middle">no link drawn to ${esc(M.name(S.focus.id))} — click one for its requirement check</text>`;
  h += `</g>`;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = h;
}

// ------------------------------------------------------------------ matrix
const cellWord = l => l.status === 'derived' ? 'use' : l.status === 'candidate' ? 'traits' : l.status === 'documented' ? 'stated' : l.verdict === 'contradicted by traits' ? 'contradicted' : 'no evidence';
function renderMatrix() {
  const M = S.M; const ff = S.focus?.kind === 'function' ? S.focus.id : null, fs = S.focus?.kind === 'species' ? S.focus.id : null;
  $('#mhead').innerHTML = `<h2>Spatial function matrix</h2><span class="sub">${M.species.length} species × ${M.functions.length} functions. A cell opens its evidence; it is not a suitability score, and a blank is not “unsuitable”.</span>`;
  let h = `<table class="matrix"><thead><tr><th>species</th>${M.functions.map(f => `<th class="${ff === f.id ? 'focus' : ''}" data-focus="function=${esc(f.id)}" title="${esc(f.definition)}">${esc(f.label)}<small>${f.n_linked} linked · ${f.n_unknown} unknown</small></th>`).join('')}</tr></thead><tbody>`;
  for (const s of M.species) {
    const linked = ff && M.link(s.id, ff).drawn;
    h += `<tr class="${fs === s.id ? 'focus' : ''} ${linked ? 'linked' : ''}"><th data-focus="species=${esc(s.id)}"><i class="sci">${esc(s.scientific_name)}</i><span class="cn">${esc((s.common_names || [])[0] || '')}</span>${S.a === s.id ? ` ${tag('A')}` : ''}${S.b === s.id ? ` ${tag('B')}` : ''}</th>`;
    for (const f of M.functions) {
      const l = M.link(s.id, f.id); const selc = S.inspect?.kind === 'link' && S.inspect.id === l.id;
      h += `<td class="${ff === f.id || fs === s.id ? 'focus' : ''} ${selc ? 'sel' : ''}" data-inspect="link=${esc(l.id)}" title="${esc(cellTitle(l))}"><span class="cell ${esc(l.status)} ${l.conflict ? 'conflict' : ''} ${l.verdict === 'contradicted by traits' ? 'contradicted' : ''}">${esc(cellWord(l))}${l.conflict ? ' · conflict' : ''}${l.verification === 'verified' ? ` <span class="v">✓${l.n_verified}</span>` : ''}</span></td>`;
    }
    h += `</tr>`;
  }
  h += `</tbody></table>`;
  h += `<div id="mlegend"><p><b>use</b> derived: a source records a use the ontology maps to the function (KG-R1).</p><p><b>traits</b> candidate: every required trait is met by claims, but no source states the use (KG-R4).</p><p><b>contradicted</b> unknown: a recorded trait lies outside a requirement.</p><p><b>no evidence</b> unknown: no claim on a required trait.</p><p><b>conflict</b> a documented use and a trait claim disagree; both are kept.</p><p><b>✓n</b> n use claims verified by a person. Status and verification are separate.</p></div>`;
  $('#mbody').innerHTML = h;
}
function cellTitle(l) { const M = S.M; return `${M.name(l.species)} → ${M.name(l.function)}: ${l.status}${l.conflict ? ' · conflict' : ''}${l.verdict ? ` · ${l.verdict}` : ''} · ${l.verification}${l.via_use_labels?.length ? ` · use: ${l.via_use_labels.join(', ')}` : ''} — click for the evidence`; }

// ------------------------------------------------------------------ attribute table
function renderTable() {
  const M = S.M; const ff = S.focus?.kind === 'function' ? M.fn(S.focus.id) : null, fs = S.focus?.kind === 'species' ? S.focus.id : null;
  const req = new Set(ff ? ff.required_facets : []);
  if (!$('#tq')) { $('#tcontrols').innerHTML = `<h2>Attribute table</h2><input id="tq" type="search" placeholder="Filter species" aria-label="Filter species" style="width:160px"><label title="growth form, family, origin, plant type and claim counts"><input type="checkbox" ${S.identity ? 'checked' : ''} data-act="tident">Identity</label>` + M.groups.map(g => `<label><input type="checkbox" ${S.groups.has(g.id) ? 'checked' : ''} data-act="tg" data-id="${esc(g.id)}">${esc(g.label)}</label>`).join('') + `<span class="sub" id="thint"></span>`; $('#tq').addEventListener('input', () => { S.q = $('#tq').value; renderTable(); }); }
  $('#thint').textContent = `${M.facets.filter(f => S.groups.has(f.group)).length} of ${M.facets.length} attributes shown; the table scrolls sideways. ` + (ff ? `Columns ${ff.label} requires are marked; linked species come first.` : 'A cell opens its claims; a column header sorts by the number of values.');
  const cols = M.facets.filter(f => S.groups.has(f.group));
  const q = S.q.trim().toLowerCase();
  let rows = M.species.filter(s => !q || [s.scientific_name, ...(s.common_names || []), s.family].join(' ').toLowerCase().includes(q));
  const rank = { derived: 0, documented: 0, candidate: 1, unknown: 2 };
  if (ff) rows = rows.slice().sort((a, b) => { const la = M.link(a.id, ff.id), lb = M.link(b.id, ff.id); return rank[la.status] - rank[lb.status] || (la.verdict === 'evidence missing') - (lb.verdict === 'evidence missing') || a.scientific_name.localeCompare(b.scientific_name); });
  if (S.sort) rows = rows.slice().sort((a, b) => (M.attr(b.id, S.sort)?.n_values || 0) - (M.attr(a.id, S.sort)?.n_values || 0));
  const groupsRow = []; let last = null;
  for (const f of cols) { if (f.group !== last) { groupsRow.push({ g: f.group, n: 1 }); last = f.group; } else groupsRow[groupsRow.length - 1].n++; }
  let h = `<table class="attr"><thead><tr class="groups"><th colspan="1"></th>${S.identity ? '<th colspan="5">identity</th>' : ''}${groupsRow.map(x => `<th colspan="${x.n}">${esc(M.GR.get(x.g).label)}</th>`).join('')}</tr><tr class="cols"><th>Species</th>${S.identity ? '<th>Growth form (M29)</th><th>Family</th><th>Origin</th><th>KPU type</th><th>Claims live · ✓ · retired</th>' : ''}${cols.map(f => `<th class="${req.has(f.id) ? 'req' : ''} ${S.sort === f.id ? 'sorted' : ''}" data-act="tsort" data-id="${esc(f.id)}" title="${esc(f.definition || f.label)} · ${f.policy === 'node' ? 'concept facet' : 'numeric / categorical attribute'} · ${f.gate ? 'gate field (survey c1)' : 'compare field'}">${esc(f.label)}${f.gate ? ' <span class="g">gate</span>' : ''}</th>`).join('')}</tr></thead><tbody>`;
  for (const s of rows) {
    const l = ff ? M.link(s.id, ff.id) : null;
    h += `<tr class="${fs === s.id ? 'focus' : ''} ${l ? (l.drawn ? 'linked' : 'unknown-fn') : ''}"><th data-focus="species=${esc(s.id)}"><i class="sci">${esc(s.scientific_name)}</i>${S.a === s.id ? ` ${tag('A')}` : ''}${S.b === s.id ? ` ${tag('B')}` : ''}${l ? `<span class="st">${esc(cellWord(l))}${l.conflict ? ' · conflict' : ''}</span>` : ''}</th>`;
    if (S.identity) h += `<td class="ident" data-inspect="species=${esc(s.id)}">${esc(s.growth_form_label || '—')} <small class="faint">${esc(s.growth_form_status || '')}</small></td><td class="ident">${esc(s.family || '—')}</td><td class="ident">${esc(human(s.origin_status) || '—')}</td><td class="ident">${esc(s.kpu_plant_type || '—')}</td><td class="ident mono">${s.claims.live} · ${s.claims.verified} · ${s.claims.retired}</td>`;
    for (const f of cols) {
      const a = M.attr(s.id, f.id); const selc = S.inspect?.kind === 'attr' && S.inspect.id === a?.id;
      if (!a) { h += `<td class="nr ${req.has(f.id) ? 'req' : ''}">not recorded</td>`; continue; }
      const vals = a.values.slice(0, 3).map(v => `<span class="v">${esc(v.label)}<small> ${v.claims.length || (v.entity ? 'e' : '')}${v.conditions.length ? '·c' : ''}</small></span>`).join('') + (a.values.length > 3 ? `<span class="v faint">+${a.values.length - 3}</span>` : '');
      h += `<td class="${req.has(f.id) ? 'req' : ''} ${selc ? 'sel' : ''}" data-inspect="attr=${esc(a.id)}" title="${esc(a.values.map(v => v.label).join(' · '))} — ${a.n_values} values · ${a.n_claims} claims · ${a.n_sources} sources · ${esc(a.verification)}${a.disagreement.length ? ' · sources disagree' : ''}">${vals}${a.verification === 'verified' ? ` <span class="ver">✓</span>` : ''}${a.disagreement.length ? ` <span class="dis">disagree ${a.disagreement.length}</span>` : ''}${a.variation.length ? ` <span class="dis cond">by condition</span>` : ''}</td>`;
    }
    h += `</tr>`;
  }
  h += `</tbody></table>`;
  $('#tablewrap').innerHTML = h;
}

// ------------------------------------------------------------------ evidence inspector (the contextual panel)
const tag = (s, extra = '') => s ? `<span class="pi-tag ${esc(String(s).replace(/\s+/g, '_'))}">${esc(human(s))}${extra}</span>` : '';
/** the name of the selected record first, then what kind of record it is, then its facts — never a label above the title */
const head = (title, kind = '', facts = '') => `<h2 class="title">${title}</h2>${kind ? `<p class="kind">${kind}</p>` : ''}${facts ? `<p class="facts">${facts}</p>` : ''}`;
function sourceLine(sid) { const s = S.M.source(sid); const name = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>` : esc(s.label); return `${name}${s.type ? ` · ${esc(s.type)}` : ''}${s.licence_tier ? ` · tier ${esc(s.licence_tier)}` : ''}${s.geo ? ` · ${esc(s.geo)}` : ''}`; }
function claimHtml(cid) {
  const M = S.M, c = M.claim(cid); if (!c) return `<div class="claim"><div class="meta">${esc(cid)} — not in the projection's claim index</div></div>`;
  const chk = M.checks[cid];
  const cond = c.conditions?.length ? ` · <b>when</b> ${c.conditions.map(x => esc(x.label)).join(', ')}` : '';
  const pm = c.practitioner_meta; const who = pm?.observer_background ? `<br><b>observer</b> ${esc(pm.observer_background)}${pm.completeness ? ` · ${esc(pm.completeness)}` : ''}${pm.citable === false ? ' · not citable' : ''}` : '';
  return `<div class="claim"><div class="txt">${esc(c.text)}</div><div class="meta"><b>source</b> ${sourceLine(c.source_id)} · ${esc(c.source_type)}${c.place_label ? ` · <b>place</b> ${esc(c.place_label)}` : ''}${cond}${c.cultivar ? ` · <b>cv.</b> ${esc(c.cultivar)}` : ''} · <b>conf</b> ${esc(c.confidence)}${c.context ? `<br><b>context</b> ${esc(c.context)}` : ''}${who}<br>${tag(c.status)} ${tag(c.evidence_check, ' <span style="opacity:.7">AI</span>')}${c.status === 'retired' ? ` retired${c.retired_by ? ` by ${esc(c.retired_by)}` : ''}` : ''}<br><span class="faint">${esc(c.id)} · ${esc(c.field)} · ${esc(c.recorded_at || '')}</span></div>${chk ? `<details class="ai"><summary>AI source check: ${esc(human(chk.result))} (${esc(chk.method)}, ${esc((chk.reviewed_at || '').slice(0, 10))}) — an assessment, not a verification</summary><div class="small muted"><b>locator</b> ${esc(chk.locator || '—')}<br><b>excerpt</b> ${esc(chk.excerpt || '—')}<br><b>reading</b> ${esc(chk.explanation || '')}${chk.missing_context ? `<br><b>missing context</b> ${esc(chk.missing_context)}` : ''}${chk.conflicting_claims?.length ? `<br><b>conflicting claims</b> ${chk.conflicting_claims.map(x => `<span class="mono">${esc(x)}</span>`).join(', ')}${chk.conflict_reading ? ` — ${esc(chk.conflict_reading)}` : ''}` : ''}</div></details>` : ''}</div>`;
}
function ruleHtml(rules) { if (!rules) return ''; return (Array.isArray(rules) ? rules : String(rules).split(' · ')).map(r => S.M.rules[r] ? `<p class="note"><b>${esc(r)}</b> ${esc(S.M.rules[r])}</p>` : '').join(''); }
function reqHtml(reqs, verdicts) {
  const M = S.M; if (!reqs?.length) return '<p class="faint small">no requirement recorded for this concept</p>';
  return `<h3>Requirement check ${verdicts ? `<small>${esc(Object.values(verdicts).join(' / '))}</small>` : ''}</h3>` + reqs.map(r => `<div class="reqrow"><div>${esc(r.strength)} ${r.alternative_labels.map((l, i) => `<span class="link" data-focus="concept=${esc(r.alternatives[i])}">${esc(l)}</span>`).join(' <span class="faint">or</span> ')}${r.to_confirm ? ' <span class="faint">(to confirm)</span>' : ''}${r.concept_label ? ` <span class="faint">· ${esc(r.concept_label)}</span>` : ''}</div><div class="r ${esc(r.result)}">${esc(r.result)}</div>${r.evidence?.length ? `<div class="alt">${r.evidence.map(x => `${esc(x.target_label)}${x.claim ? ` — <span class="mono">${esc(x.claim)}</span> ${tag(x.verification)}` : ` — ${esc(x.source_id)}`}${x.cultivar ? ` cv. ${esc(x.cultivar)}` : ''}${x.conditions?.length ? ` when ${esc(x.conditions.map(c => c.label || c.concept_id || c).join(', '))}` : ''}`).join('<br>')}</div>` : ''}${r.contrary?.length ? `<div class="alt warn">contrary: ${r.contrary.map(x => `${esc(x.target_label)} (${esc(x.source_id)}${x.claim ? `, <span class="mono">${esc(x.claim)}</span>` : ''})`).join(', ')}</div>` : ''}${r.source ? `<div class="alt faint">${esc(r.source)}</div>` : ''}</div>`).join('');
}
function renderInspector() {
  const M = S.M; if (!M) return; const open = inspectorOpen(); $('#inspector').hidden = !open; if (!open) return;
  const f = S.focus; $('#isub').innerHTML = S.inspect && f && f.kind !== 'pair' && !(S.inspect.kind === f.kind && S.inspect.id === f.id) ? `<span class="link" data-inspect="" title="Back to the record of the focus">${f.kind === 'species' ? `<i class="sci">${esc(M.name(f.id))}</i>` : esc(M.name(f.id))}</span>` : '';
  $('#ibody').innerHTML = evidenceHtml(); $('#ibody').scrollTop = 0;
}
function evidenceHtml() {
  const M = S.M, i = S.inspect;
  if (!i) {
    if (S.focus?.kind === 'function') return functionHtml(M.fn(S.focus.id));
    if (S.focus?.kind === 'species') return speciesHtml(M.sp(S.focus.id));
    if (S.focus?.kind === 'concept') return conceptHtml(M.co(S.focus.id));
    if (S.focus?.kind === 'pair') return pairHtml();
    return '';
  }
  if (i.kind === 'link') return linkHtml(M.LK.get(i.id));
  if (i.kind === 'attr') return attrHtml(M.AT.get(i.id));
  if (i.kind === 'concept_link') return conceptLinkHtml(M.CL.get(i.id));
  if (i.kind === 'relation') return relationHtml(M.RE.get(i.id), true);
  if (i.kind === 'species') return speciesHtml(M.sp(i.id));
  if (i.kind === 'function') return functionHtml(M.fn(i.id));
  if (i.kind === 'concept') return conceptHtml(M.co(i.id));
  return '';
}
const spLink = id => `<span class="link" data-focus="species=${esc(id)}"><i class="sci">${esc(S.M.name(id))}</i></span>`;
const fnLink = id => `<span class="link" data-focus="function=${esc(id)}">${esc(S.M.name(id))}</span>`;
function pairHtml() {
  const M = S.M; const p = M.pair(S.a, S.b);
  let h = head(`${spLink(S.a)} <span class="arrow">and</span> ${spLink(S.b)}`, 'two species in the graph', `${p.n_shared} shared knowledge nodes · ${plural(p.direct_relations.length, 'live direct record')} · ${p.retired_relations.length} retired`);
  h += `<p>The graph shows the concepts both plants reach, the functions each is linked to, and any direct record between them. A line joins the two plants only where a relation was recorded.</p><p class="go"><span class="link" data-view="compare">Open the comparison</span></p>`;
  h += `<h3>Direct records <small>${p.direct_relations.length} live</small></h3>` + (p.direct_relations.length ? p.direct_relations.map(id => { const r = M.RE.get(id); return `<div class="row" data-inspect="relation=${esc(id)}"><div class="b">${esc(human(r.type))} ${tag(r.kg_status)} ${tag(r.status)}${r.placeholder ? ` ${tag('model placeholder')}` : ''}<div class="meta">${esc(M.source(r.source_id).label)}</div></div></div>`; }).join('') : '<p class="small"><b>None recorded.</b> An honest absence, not evidence of incompatibility.</p>');
  return h;
}
function linkHtml(l) {
  const M = S.M; const s = M.sp(l.species), f = M.fn(l.function);
  let h = head(`${spLink(s.id)} <span class="arrow">→</span> ${fnLink(f.id)}`, `species → spatial function · ${esc(l.evidence_kind === 'use_claim' ? 'recorded use' : l.evidence_kind === 'trait_inference' ? 'trait inference' : 'no link')}`, `${tag(l.status)} ${tag(l.verification, l.n_verified || l.n_unverified ? ` ${l.n_verified ? `${l.n_verified}✓` : ''}${l.n_unverified ? ` ${l.n_unverified}·` : ''}` : '')} ${l.conflict ? tag('conflict') : ''} ${l.verdict ? tag(l.verdict) : ''}`);
  if (l.status === 'derived' && l.use_claims.length) h += `<p>A source records the use <b>${esc(l.via_use_labels.join(', '))}</b> (${esc(l.use_sources.join(', '))}), which the ontology maps to ${esc(f.label)} — rule KG-R1. ${l.verification === 'verified' ? 'A human verified a use claim.' : 'No human has verified the use claim yet.'}</p>`;
  else if (l.status === 'candidate') h += `<p>No source states this use. Every <b>required</b> trait of ${esc(f.label)} is met by recorded claims (KG-R4), so the link is a <b>candidate</b> — an inference, never promoted, nothing to verify until a source records the use.</p>`;
  else if (l.status === 'unknown') h += `<p>No link is drawn. ${l.verdict === 'contradicted by traits' ? `A recorded claim places <i class="sci">${esc(s.scientific_name)}</i> outside a requirement of ${esc(f.label)} — evidence against, under the conditions, cultivar and source stated below.` : `The database has no claim on a trait ${esc(f.label)} requires — not known, which is not the same as unsuitable.`} <span class="muted">No source lists the plant for this function either.</span></p>`;
  if (l.conflict) h += `<p class="warn small">Conflict: the documented use and a trait claim disagree — shown, not resolved. The use claim stays; the requirement check below names the contrary claim.</p>`;
  if (l.verification_note) h += `<p class="small faint">${esc(l.verification_note)}</p>`;
  if (l.function === PI.TRACE_FUNCTION) h += `<p class="go"><a href="${esc(PI.links.trace(l.species))}" title="Follow this plant from its source to a bed in a design, with the engine's own evaluation">Trace this into a design</a></p>`;
  h += ruleHtml(l.rules);
  if (l.use_claims?.length) h += `<h3>Use claims <small>${l.use_claims.length}</small></h3>` + l.use_claims.map(claimHtml).join('');
  if (l.missing?.length) h += `<h3>Missing or contradicted</h3>` + l.missing.map(m => `<div class="reqrow"><div>${esc(m.strength)} ${esc(m.alternative_labels.join(' or '))}</div><div class="r ${esc(m.result)}">${esc(m.result)}</div></div>`).join('');
  h += reqHtml(l.requirements, l.verdicts);
  const evc = [...new Set((l.requirements || []).flatMap(r => [...r.evidence.map(x => x.claim), ...r.contrary.map(x => x.claim)]).filter(Boolean))];
  if (evc.length) h += `<details><summary>trait claims behind the check (${evc.length})</summary>${evc.map(claimHtml).join('')}</details>`;
  h += `<p class="small faint mono" style="margin-top:10px">${esc(l.id)} · kg: ${esc((l.underlying || []).join(' · '))}${l.xyz_edge ? ` · xyz: ${esc(l.xyz_edge)}` : ''}</p>`;
  return h;
}
function attrHtml(a) {
  const M = S.M; const s = M.sp(a.species), f = M.FA.get(a.facet);
  let h = head(`${spLink(s.id)} <span class="arrow">·</span> ${esc(f.label)}`, `attribute cell · ${esc(M.GR.get(a.group).label)}${f.gate ? ' · gate field' : ''}`, `${plural(a.n_values, 'value')} · ${plural(a.n_claims, 'claim')} · ${plural(a.n_sources, 'source')} ${tag(a.status)} ${tag(a.verification)}`);
  if (a.disagreement.length) h += a.disagreement.map(d => `<p class="warn small"><b>Sources disagree.</b> ${esc(d.text)}</p>`).join('');
  if (a.variation.length) h += a.variation.map(d => `<p class="small cond"><b>Varies by condition.</b> ${esc(d.text)}</p>`).join('');
  h += `<p class="small muted">Every distinct value is kept with its own claims (rule R1); nothing is averaged or chosen.</p>`;
  if (a.rule) h += ruleHtml(a.rule);
  for (const v of a.values) {
    h += `<h3>${esc(v.label)} <small>${v.claims.length ? plural(v.claims.length, 'claim') : v.entity ? 'entity record' : ''}${v.conditions.length ? ` · when ${esc(v.conditions.join(', '))}` : ''}${v.cultivars.length ? ` · cv. ${esc(v.cultivars.join(', '))}` : ''} ${tag(v.status)} ${tag(v.verification)}</small>${M.CO.has(v.concept) ? ` <small><span class="link" data-focus="concept=${esc(v.concept)}">concept</span></small>` : ''}</h3>`;
    if (v.numbers?.length) h += `<p class="small mono muted">${v.numbers.map(n => esc(JSON.stringify(n))).join(' · ')}</p>`;
    h += v.claims.map(claimHtml).join('') || (v.entity ? `<p class="small muted">Read from the plant's entity record (identity_review), not from a sourced claim.</p>` : '');
  }
  h += `<p class="small faint mono" style="margin-top:10px">${esc(a.id)}${a.underlying.xyz_edges.length ? ` · xyz: ${esc(a.underlying.xyz_edges.join(' · '))}` : ''}</p>`;
  return h;
}
function conceptLinkHtml(e) {
  const M = S.M; const s = M.sp(e.species), c = M.co(e.concept);
  let h = head(`${spLink(s.id)} <span class="arrow">${esc(human(e.rel))}</span> <span class="link" data-focus="concept=${esc(c.id)}">${esc(c.label)}</span>`, `species → concept · ${esc(c.facet_label || c.facet)}`, `${tag(e.status)} ${tag(e.verification, e.n_verified || e.n_unverified ? ` ${e.n_verified ? `${e.n_verified}✓` : ''}${e.n_unverified ? ` ${e.n_unverified}·` : ''}` : '')}`);
  if (e.rule) h += ruleHtml(e.rule);
  if (e.entity) h += `<p class="small muted">Recorded in the plant's entity record, not in a sourced claim.</p>`;
  if (e.conditions.length) h += `<p class="small muted">stated conditions: ${esc(e.conditions.join(', '))}</p>`;
  if (e.cultivars.length) h += `<p class="small muted">cultivar-level claims: ${esc(e.cultivars.join(', '))}</p>`;
  h += `<h3>Claims <small>${e.claims.length} · ${plural(e.sources.length, 'source')}</small></h3>` + (e.claims.map(claimHtml).join('') || '<p class="faint small">none (entity record)</p>');
  const a = M.attr(s.id, c.facet); if (a) h += `<p class="small"><span class="link" data-inspect="attr=${esc(a.id)}">every value of ${esc(c.facet_label || c.facet)} for this plant (${a.n_values})</span></p>`;
  h += `<p class="small faint mono" style="margin-top:10px">${esc(e.id)} · kg: ${esc(e.underlying.slice(0, 6).join(' · '))}${e.underlying.length > 6 ? ` · +${e.underlying.length - 6}` : ''}</p>`;
  return h;
}
function relationHtml(r, full = false) {
  const M = S.M;
  let h = full ? head(`${spLink(r.a)} <span class="arrow">${esc(human(r.type))}${r.direction ? ` (${esc(r.direction)})` : ''}</span> ${spLink(r.b)}`, 'plant-to-plant record · relations.json', `${tag(r.kg_status)} ${tag(r.status)} ${r.placeholder ? tag('model placeholder') : ''}`) : '';
  h += `<div class="claim"><div class="txt">${esc(r.text || '')}</div><div class="meta"><b>source</b> ${sourceLine(r.source_id || '')} · ${esc(r.source_type)} · conf ${esc(r.confidence)}${r.context ? `<br><b>context</b> ${esc(r.context)}` : ''}${r.rule ? `<br><b>rule</b> ${esc(r.rule)}` : ''}${r.note ? `<br>${esc(r.note)}` : ''}${r.placeholder && r.live ? `<br><span class="warn">a model placeholder: a candidate to be verified against ${esc((r.verify_against || []).join(', ') || 'a source')}; it is not evidence</span>` : ''}${!r.live ? `<br><span class="warn">retired ${esc(r.retired_at || '')}${r.retired_by ? ` by ${esc(r.retired_by)}` : ''}${r.retired_reason ? ` — ${esc(r.retired_reason)}` : ''} · history, never drawn</span>` : ''}${r.derived_from?.length ? `<br><b>derived from</b> ${r.derived_from.map(x => `<span class="mono">${esc(x)}</span>`).join(', ')}` : ''}${r.supporting_claims?.length ? `<br><b>supporting claims</b> ${r.supporting_claims.map(x => `<span class="mono">${esc(x)}</span>`).join(', ')}` : ''}${r.citation ? `<br><b>citation</b> ${esc(r.citation)}` : ''}<br><span class="faint">${esc(r.id)} · ${esc(r.recorded_at || '')}${r.recorded_by ? ` · ${esc(r.recorded_by)}` : ''}</span></div></div>`;
  if (full) { const cl = [...(r.derived_from || []), ...(r.supporting_claims || [])].filter(c => M.claim(c)); if (cl.length) h += `<details><summary>claims named (${cl.length})</summary>${cl.map(claimHtml).join('')}</details>`; h += `<p class="note">Direct plant-to-plant knowledge comes only from records like this one. Co-listing in a survey means a designer thought of the two together — not that they are compatible. Shared traits connect plants only through the trait.</p>`; }
  return h;
}
function speciesHtml(s) {
  const M = S.M; const links = M.linksOf(s.id); const rels = M.relationsOf(s.id), retired = M.relationsOf(s.id, false).filter(r => !r.live);
  let h = head(`<a class="sp" href="${esc(PI.links.profile(s.id))}" title="open the Plant Profile in the Plant Library"><i class="sci">${esc(s.scientific_name)}</i></a>`, `species · ${esc(s.growth_form_label || '')} ${esc(s.growth_form_status || '')}`, `${esc((s.common_names || []).join(' · '))} · ${esc(s.family)} · ${esc(human(s.origin_status))} · ${esc(s.kpu_plant_type)} · ${s.claims.live} live claims (${s.claims.verified} verified, ${s.claims.retired} retired)`);
  h += PC.miniHtml(M.d, s.id, S.imgs, { here: 'explorer', extra: `<a href="${esc(PI.links.neural(s.id))}">Neural view</a>` });
  h += `<p class="small">Compare: <span class="link" data-ab="a" data-id="${esc(s.id)}">${S.a === s.id ? 'A ✓' : 'set as A'}</span> · <span class="link" data-ab="b" data-id="${esc(s.id)}">${S.b === s.id ? 'B ✓' : 'set as B'}</span>${S.a && S.b ? ` · <span class="link" data-view="compare">open the comparison</span>` : ''}</p>`;
  h += `<h3>Spatial functions <small>${links.filter(l => l.drawn).length} linked · ${links.filter(l => !l.drawn).length} unknown</small></h3>` + links.map(l => `<div class="row" data-inspect="link=${esc(l.id)}"><div class="b">${esc(M.name(l.function))} ${tag(l.status)} ${tag(l.verification)} ${l.conflict ? tag('conflict') : ''}<div class="meta">${l.drawn ? (l.via_use_labels.length ? `use: ${esc(l.via_use_labels.join(', '))} (${esc(l.use_sources.join(', '))})` : 'inferred from traits (KG-R4), no source states this use') : esc(l.verdict)}</div></div></div>`).join('');
  h += `<h3>Growth form <small>M29</small></h3><p class="small">${esc(s.growth_form_label || 'unknown')} (${esc(s.growth_form_status || '')}) — read from the sources: ${Object.entries(s.growth_form_evidence || {}).map(([k, v]) => `<b>${esc(k)}</b> ${esc(v)}`).join(' · ') || 'no evidence listed'}</p>`;
  h += `<h3>Plant-to-plant records <small>${rels.length} live · ${retired.length} retired</small></h3>` + (rels.length ? rels.map(r => `<div class="row" data-inspect="relation=${esc(r.id)}"><div class="b">${esc(human(r.type))} <i class="sci">${esc(M.name(r.a === s.id ? r.b : r.a))}</i> ${tag(r.kg_status)} ${tag(r.status)}${r.placeholder ? ` ${tag('model placeholder')}` : ''}<div class="meta">${esc(M.source(r.source_id).label)}</div></div></div>`).join('') : '<p class="faint small">none live in relations.json</p>');
  if (retired.length) h += `<details><summary>retired records (${retired.length}) — history, not evidence</summary>${retired.map(r => `<div class="row" data-inspect="relation=${esc(r.id)}"><div class="b">${esc(human(r.type))} <i class="sci">${esc(M.name(r.a === s.id ? r.b : r.a))}</i> ${tag('retired')}<div class="meta">${esc(r.retired_reason || r.note || '')}</div></div></div>`).join('')}</details>`;
  const cells = M.attrs.filter(a => a.species === s.id); const nr = M.facets.filter(f => !M.attr(s.id, f.id));
  h += `<h3>Attributes <small>${cells.length} facets recorded · ${nr.length} not recorded · ${cells.filter(a => a.disagreement.length).length} with disagreement</small></h3><p class="small">${cells.map(a => `<span class="chip" data-inspect="attr=${esc(a.id)}">${esc(M.FA.get(a.facet).label)}<small>${a.n_values}</small>${a.disagreement.length ? '<small class="warn">disagree</small>' : ''}${a.verification === 'verified' ? '<small style="color:var(--olive-deep)">✓</small>' : ''}</span>`).join('')}</p>`;
  if (nr.length) h += `<p class="small faint">not recorded: ${esc(nr.map(f => f.label).join(', '))}</p>`;
  h += `<p class="note">Plants sharing a concept are connected only through that concept. A shared trait is never read as a companion relation; a function link is never a planting verdict.</p><p class="small faint mono">${esc(s.file)} · ${esc(s.id)}</p>`;
  return h;
}
function functionHtml(f) {
  const M = S.M; const links = M.linksTo(f.id);
  let h = head(esc(f.label), `spatial function · stands for ${esc(f.underlying_labels.join(' + '))}`, esc(f.definition));
  h += `<h3>Requires <small>literature · ${f.requirements.length}</small></h3>` + f.requirements.map(r => `<div class="row static"><div class="b">${esc(r.strength)}: ${r.alternative_labels.map((l, i) => M.CO.has(r.alternatives[i]) && !M.co(r.alternatives[i]).no_plant_reaches ? `<span class="link" data-focus="concept=${esc(r.alternatives[i])}">${esc(l)}</span>` : `<span class="muted">${esc(l)}</span>`).join(' <span class="faint">or</span> ')}${r.to_confirm ? ` ${tag('to confirm')}` : ''}${r.no_plant_reaches ? ' <span class="faint small">(no plant reaches any alternative)</span>' : ''}<div class="meta">${esc(r.literature || '')}${r.note ? ` — ${esc(r.note)}` : ''}</div></div></div>`).join('');
  const order = { derived: 0, documented: 0, candidate: 1, unknown: 2 };
  h += `<h3>Species <small>${links.filter(l => l.drawn).length} linked · ${links.filter(l => !l.drawn).length} unknown (never drawn)</small></h3>` + links.slice().sort((a, b) => order[a.status] - order[b.status] || M.name(a.species).localeCompare(M.name(b.species))).map(l => `<div class="row" data-inspect="link=${esc(l.id)}"><div class="b"><i class="sci">${esc(M.name(l.species))}</i> ${tag(l.status)} ${tag(l.verification)} ${l.conflict ? tag('conflict') : ''}<div class="meta">${l.drawn ? (l.via_use_labels.length ? `use: ${esc(l.via_use_labels.join(', '))} (${esc(l.use_sources.join(', '))})` : 'all required traits met (KG-R4); no source states this use') + ' · ' + esc(Object.values(l.verdicts || {}).join(' / ')) : `${esc(l.verdict)}: ${(l.missing || []).map(m => `${esc(m.strength)} ${esc(m.alternative_labels.join(' or '))} ${esc(m.result)}`).join('; ')}`}</div></div></div>`).join('');
  h += `<p class="small faint">term: ${esc(f.source_of_term || '')}</p><p class="note">A function is a potential spatial role, not a plant attribute: the link depends on several traits, planting configuration and context. Blank is not unsuitable; ‘contradicted’ names the claim that contradicts.</p>`;
  return h;
}
function conceptHtml(c) {
  const M = S.M; const es = M.clinksOf.get(c.id) || [];
  let h = head(esc(c.label), `concept · ${esc(c.facet_label || c.facet)} · ${esc(M.GR.get(c.group)?.label || '')}`, esc(c.definition || ''));
  h += `<h3>Species <small>${es.length}</small></h3>` + es.map(e => `<div class="row" data-inspect="concept_link=${esc(e.id)}"><div class="b"><i class="sci">${esc(M.name(e.species))}</i> ${tag(e.status)} ${tag(e.verification)}<div class="meta">${plural(e.claims.length, 'claim')} · ${esc(e.sources.join(', '))}${e.conditions.length ? ` · when ${esc(e.conditions.join(', '))}` : ''}</div></div></div>`).join('');
  if (c.required_by?.length) h += `<h3>Required by</h3><p>${c.required_by.map(fid => `<span class="chip" data-focus="function=${esc(fid)}">${esc(M.name(fid))}</span>`).join('')}</p>`;
  h += `<p class="note">An indirect connection: the plants listed reach the same concept, which says nothing about planting them together.</p>`;
  return h;
}

// ------------------------------------------------------------------ A / B comparison: four sections, never conflated
function renderCompare() {
  const M = S.M;
  const opts = sel => `<option value="">choose a species</option>` + M.species.map(s => `<option value="${esc(s.id)}" ${sel === s.id ? 'selected' : ''}>${esc(s.scientific_name)}</option>`).join('');
  $('#chead').innerHTML = `<h2>Compare two plants</h2><label>${tag('A')}<select id="sel-a" data-pick="a" aria-label="Plant A">${opts(S.a)}</select></label><label>${tag('B')}<select id="sel-b" data-pick="b" aria-label="Plant B">${opts(S.b)}</select></label><button data-act="swap" ${S.a && S.b ? '' : 'disabled'} title="Swap A and B" aria-label="Swap A and B" style="padding:6px 8px">${IC.swap}</button><div class="right"><button data-act="pair" ${S.a && S.b ? '' : 'disabled'} title="Show the two plants, what both reach and any direct record as a graph" style="display:inline-flex;gap:6px;align-items:center">${IC.graph}Show the pair in the graph</button></div>`;
  $('#cbody').innerHTML = compareHtml(); $('#cbody').scrollTop = 0;
}
function compareHtml() {
  const M = S.M; const V = M.vocab.pair_sections;
  if (!(S.a && S.b)) return `<div class="empty"><h2>Two plants, four separate questions</h2><p>Choose ${S.a || S.b ? 'the second species' : 'two species'} above. The comparison never merges these into one verdict about planting the two together:</p><dl><div><dt>Shared attributes</dt><dd>${esc(V.shared_attributes)}</dd></div><div><dt>Direct recorded relationships</dt><dd>${esc(V.direct_relations)}</dd></div><div><dt>Potential spatial complementarity</dt><dd>${esc(V.spatial_complementarity)}</dd></div><div><dt>Evidence and unknowns</dt><dd>${esc(V.evidence_unknowns)}</dd></div></dl></div>`;
  const a = M.sp(S.a), b = M.sp(S.b), p = M.pair(S.a, S.b); const swap = p.a !== S.a;   // the projection stores the pair once; A/B may be the other way round
  const A = { id: S.a, only: swap ? 'only_b' : 'only_a', rec: swap ? 'b_recorded' : 'a_recorded', dis: swap ? 'b_disagreement' : 'a_disagreement', fn: swap ? 'b_function' : 'a_function', st: swap ? 'b_status' : 'a_status', cf: swap ? 'b_conflict' : 'a_conflict', fns: swap ? 'b_functions' : 'a_functions', unk: swap ? 'b_unknown' : 'a_unknown' };
  const B = { id: S.b, only: swap ? 'only_a' : 'only_b', rec: swap ? 'a_recorded' : 'b_recorded', dis: swap ? 'a_disagreement' : 'b_disagreement', fn: swap ? 'a_function' : 'b_function', st: swap ? 'a_status' : 'b_status', cf: swap ? 'a_conflict' : 'b_conflict', fns: swap ? 'a_functions' : 'b_functions', unk: swap ? 'a_unknown' : 'b_unknown' };
  let h = `<div class="cmp-h"><h2>${tag('A')} ${spLink(a.id)} <span class="amp">and</span> ${tag('B')} ${spLink(b.id)}</h2><p>${esc(a.growth_form_label)} · ${esc(b.growth_form_label)} — ${p.n_shared} shared knowledge nodes in kg.json · ${plural(p.direct_relations.length, 'live direct record')} · ${p.retired_relations.length} retired</p></div><div class="cmp-grid"><div>`;
  // shared attributes
  const rows = p.attributes.filter(r => S.groups.has(r.group));
  const nShared = rows.filter(r => r.shared.length).length, nDiff = rows.filter(r => r.only_a.length || r.only_b.length).length, nOne = rows.filter(r => !(r.a_recorded && r.b_recorded)).length;
  h += `<section class="csec" data-sec="shared_attributes"><h3>Shared attributes <small>${nShared} facets with a shared value · ${nDiff} with differing values · ${nOne} recorded for one plant only</small></h3><p class="small muted">${esc(V.shared_attributes)}</p>`;
  h += `<table class="cmp"><tr><th>facet</th><th>A</th><th>B</th></tr>` + rows.map(r => { const cell = (side, only) => !r[side.rec] ? `<td class="nr">not recorded</td>` : `<td>${r.shared.map(c => `<span class="v shared">${esc(r.labels[c])}</span>`).join('')}${r[only].map(c => `<span class="v">${esc(r.labels[c])}</span>`).join('')}${r[side.dis] ? ' <span class="warn mono">disagree</span>' : ''}</td>`; const ca = M.attr(a.id, r.facet), cb = M.attr(b.id, r.facet); return `<tr class="f"><td title="${esc(M.GR.get(r.group).label)}">${esc(r.label)}${ca ? ` <span class="link mono" data-inspect="attr=${esc(ca.id)}" title="the claims behind A's value">A</span>` : ''}${cb ? ` <span class="link mono" data-inspect="attr=${esc(cb.id)}" title="the claims behind B's value">B</span>` : ''}</td>${cell(A, A.only)}${cell(B, B.only)}</tr>`; }).join('') + `</table><p class="small faint">Bold olive = the same concept reached by both plants' claims. The knowledge groups shown follow the attribute table's checkboxes.</p></section></div><div>`;
  // direct relations
  h += `<section class="csec" data-sec="direct_relations"><h3>Direct recorded relationships <small>${p.direct_relations.length} live · ${p.retired_relations.length} retired</small></h3><p class="small muted">${esc(V.direct_relations)}</p>`;
  h += p.direct_relations.length ? p.direct_relations.map(id => { const r = M.RE.get(id); return `<div class="row" data-inspect="relation=${esc(id)}"><div class="b">${esc(human(r.type))} ${r.direction ? `<span class="faint">(${esc(r.direction)})</span>` : ''} ${tag(r.kg_status)} ${tag(r.status)} ${r.placeholder ? tag('model placeholder') : ''}<div class="meta">${esc(M.source(r.source_id).label)} · ${esc((r.text || '').slice(0, 140))}${(r.text || '').length > 140 ? '…' : ''}</div></div></div>`; }).join('') : `<p class="small"><b>None recorded.</b> relations.json holds no live record for this pair — an honest absence, not evidence of incompatibility.</p>`;
  if (p.retired_relations.length) h += `<details><summary>retired records (${p.retired_relations.length}) — history, not evidence</summary>${p.retired_relations.map(id => { const r = M.RE.get(id); return `<div class="row" data-inspect="relation=${esc(id)}"><div class="b">${esc(human(r.type))} ${tag('retired')} <span class="faint small">${esc(r.source_id)}</span><div class="meta">${esc(r.retired_reason || r.note || '')}</div></div></div>`; }).join('')}</details>`;
  h += `</section>`;
  // spatial complementarity
  const c = p.complementarity; const combos = c.combinations.slice().sort((x, y) => (y.different_layer - x.different_layer) || (x.a_function + x.b_function).localeCompare(y.a_function + y.b_function));
  h += `<section class="csec" data-sec="spatial_complementarity"><h3>Potential spatial complementarity <small>${plural(combos.length, 'combination')} · ${plural(c.same_function.length, 'shared function')}</small></h3><p class="small muted">${esc(V.spatial_complementarity)}</p>`;
  const fnChips = side => c[side.fns].length ? c[side.fns].map(fid => { const l = M.link(side.id, fid); return `<span class="chip" data-inspect="link=${esc(l.id)}">${esc(M.name(fid))}<small>${esc(l.status)}${l.conflict ? ' · conflict' : ''}</small></span>`; }).join('') : '<span class="faint">no function linked</span>';
  h += `<p class="small">${tag('A')} ${fnChips(A)}<br>${tag('B')} ${fnChips(B)}</p>`;
  h += combos.length ? combos.map(x => `<div class="combo"><span class="fn a">A · ${esc(M.name(x[A.fn]))}</span><span class="plus">with</span><span class="fn b">B · ${esc(M.name(x[B.fn]))}</span><span class="small faint">${x.different_layer ? 'different layers — a layering hypothesis' : 'same layer — an arrangement hypothesis'}${x[A.st] === 'candidate' || x[B.st] === 'candidate' ? ' · rests on a candidate link' : ''}${x[A.cf] || x[B.cf] ? ' · a link carries a conflict' : ''}</span></div>`).join('') : `<p class="small faint">No distinct function combination: the plants' live links allow no layering hypothesis.</p>`;
  if (c.same_function.length) h += `<p class="small muted">Both are linked to ${esc(c.same_function.map(f => M.name(f)).join(', '))} — alternatives for the same role, not a complement.</p>`;
  h += `<p class="note">${esc(c.note)}. Site, spacing and the plants' behaviour with each other are not in these links.</p></section>`;
  // evidence / unknowns
  const claimsOf = id => Object.values(M.claims).filter(x => x.plant === M.sp(id).slug && x.status !== 'retired');
  const ca = claimsOf(a.id), cb = claimsOf(b.id); const srcs = id => [...new Set(claimsOf(id).map(x => x.source_id))];
  const nrA = M.facets.filter(f => !M.attr(a.id, f.id)).map(f => f.label), nrB = M.facets.filter(f => !M.attr(b.id, f.id)).map(f => f.label);
  const chk = cl => { const n = {}; for (const x of cl) n[x.evidence_check] = (n[x.evidence_check] || 0) + 1; return Object.entries(n).map(([k, v]) => `${esc(human(k))} ${v}`).join(' · '); };
  const behaviour = M.relationsBetween(a.id, b.id).some(r => r.type === 'competes' || r.type === 'companion' || r.type === 'co_occurs_with');
  h += `<section class="csec" data-sec="evidence_unknowns"><h3>Evidence and unknowns</h3><p class="small muted">${esc(V.evidence_unknowns)}</p>`;
  h += `<table class="cmp"><tr><th></th><th>A</th><th>B</th></tr><tr><td>claims cited here</td><td>${ca.length} (${ca.filter(x => x.status === 'verified').length} verified)</td><td>${cb.length} (${cb.filter(x => x.status === 'verified').length} verified)</td></tr><tr><td>sources</td><td class="small">${srcs(a.id).map(sourceLine).join('<br>')}</td><td class="small">${srcs(b.id).map(sourceLine).join('<br>')}</td></tr><tr><td>AI evidence checks</td><td class="small">${chk(ca)}</td><td class="small">${chk(cb)}</td></tr><tr><td>functions unknown</td><td class="small">${c[A.unk].map(f => M.name(f)).join(', ') || '—'}</td><td class="small">${c[B.unk].map(f => M.name(f)).join(', ') || '—'}</td></tr><tr><td>facets not recorded</td><td class="small">${esc(nrA.join(', ') || '—')}</td><td class="small">${esc(nrB.join(', ') || '—')}</td></tr><tr><td>attribute disagreements</td><td class="small">${M.attrs.filter(x => x.species === a.id && x.disagreement.length).map(x => `<span class="link" data-inspect="attr=${esc(x.id)}">${esc(M.FA.get(x.facet).label)}</span>`).join(', ') || '—'}</td><td class="small">${M.attrs.filter(x => x.species === b.id && x.disagreement.length).map(x => `<span class="link" data-inspect="attr=${esc(x.id)}">${esc(M.FA.get(x.facet).label)}</span>`).join(', ') || '—'}</td></tr></table>`;
  h += `<p class="small"><b>How the two plants behave with each other:</b> ${behaviour ? 'see the direct record above — the only place such a statement can come from' : 'no record. Nothing biological is inferred from shared attributes or from complementary functions'}.</p><p class="small faint">Human review decisions on these claims: none recorded in this projection (the Review Workbench keeps them privately; nothing is verified by the AI).</p></section></div></div>`;
  return h;
}
