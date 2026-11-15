// Knowledge — the overview. One question: what knowledge supports the design decisions this tool makes? It is answered on one real
// example, followed in five steps from a source to a planted row:
//
//   1 Sources              where the knowledge comes from
//   2 Claims & attributes  how a statement is stored and reviewed
//   3 Relationships        how traits relate to a spatial function and to other species
//   4 Knowledge access     how the Garden Studio reads these records for a bed
//   5 Design evaluation    what the engine can and cannot establish
//
// The example is not written here. The species, sources, claims, checks and links are read from the published snapshot; the bed is a
// project the Studio saved (the recorded demonstration garden, or this browser's own design); the candidate checks and the
// evaluation are computed on this page by the Studio's engine (trace.js). Change the snapshot or the design and the page changes.
//   #species=<slug>                 follow another species into the same bed
//   #species=<slug>&case=mine&bed=<id>   the same, in a bed of the visitor's own design
import * as PI from './platform.js';
import * as PC from './plantcard.js';
import * as T from './trace.js';

const $ = s => document.querySelector(s); const esc = PI.esc; const tag = PC.tag; const human = T.human;
const plural = (n, w, ws = w + 's') => `${n} ${n === 1 ? w : ws}`;
const S = { d: null, imgs: null, K: null, E: null, ref: null, mine: null, cases: {}, c: null, sp: null };
const FN = T.FN;

(async function boot() {
  try {
    const [d, imgs, eng, ref] = await Promise.all([PI.loadSnapshot(), PI.loadImages(), T.loadEngine(), PI.loadReference().catch(() => null)]);
    Object.assign(S, { d, imgs, K: new eng.Knowledge(d), E: eng.E, ref, mine: PI.savedProject() });
    PI.mountTop($('#top'), { active: 'knowledge', section: 'overview', snapshot: d }); $('#foot').innerHTML = PI.footHtml(d);
    window.addEventListener('hashchange', () => render(false)); document.addEventListener('click', onClick); document.addEventListener('submit', onSearch);
    window.knowledge = { S, T, render };
    render(false);
  } catch (e) { $('#app').innerHTML = `<p class="pi-loading">Could not load the knowledge snapshot: ${esc(e.message)}</p>`; console.error(e); }
})();

// ---------------------------------------------------------------- state: which bed, which species
function resolve() {
  const p = new URLSearchParams(location.hash.slice(1)); const d = S.d;
  const mineBeds = S.mine ? T.tracedBeds(S.mine, S.K, S.E) : []; let c = null;
  if (p.get('case') === 'mine' && mineBeds.length) c = T.buildCase(S.mine, S.K, S.E, p.get('bed'), 'mine');
  if (!c && S.ref) c = T.buildCase(S.ref, S.K, S.E, null, 'reference');
  if (!c && mineBeds.length) c = T.buildCase(S.mine, S.K, S.E, null, 'mine');
  const want = p.get('species') && PC.species(d, p.get('species')); const firstLinked = d.function_links.find(l => l.function === FN && l.drawn)?.species;
  S.c = c; S.mineBeds = mineBeds; S.sp = want || PC.species(d, c?.lead || firstLinked || d.species[0].id); S.followed = !!want;
}
const hashFor = (slug, c = S.c, bedId = null) => { const p = new URLSearchParams(); if (slug) p.set('species', slug); if ((bedId || c?.origin === 'mine')) { p.set('case', 'mine'); p.set('bed', bedId || c.bed.id); } return `#${p}`; };

function render(scroll = true) {
  resolve(); const d = S.d, sp = S.sp; const fn = d.functions.find(f => f.id === FN); const link = d.function_links.find(l => l.species === sp.id && l.function === FN);
  document.title = `Knowledge · Planting Intelligence`;
  $('#app').innerHTML = `<div class="pi-doc kn">${mast(d)}${caseHtml(sp, fn, link)}
    <nav class="pi-toc kn-toc" aria-label="The five steps"><a href="#" data-goto="kn-sources"><b>1</b> Sources</a><a href="#" data-goto="kn-claims"><b>2</b> Claims &amp; attributes</a><a href="#" data-goto="kn-relations"><b>3</b> Relationships</a><a href="#" data-goto="kn-access"><b>4</b> Knowledge access</a><a href="#" data-goto="kn-evaluation"><b>5</b> Design evaluation</a><a href="#" data-goto="kn-explore" class="kn-toc-x">Explore the records</a></nav>
    ${sources(sp, fn, link)}${claims(sp, fn, link)}${relations(sp, fn, link)}${access(sp, fn, link)}${evaluation(sp, fn, link)}${explore(sp, fn)}</div>`;
  if (scroll) $('#kn-case')?.scrollIntoView({ block: 'start' });
}
function onClick(ev) {
  const g = ev.target.closest('[data-goto]'); if (g) { ev.preventDefault(); const el = document.getElementById(g.dataset.goto); if (el) { el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); el.focus?.({ preventScroll: true }); } return; }
  const s = ev.target.closest('[data-follow]'); if (s) { ev.preventDefault(); const y = scrollY; history.replaceState(null, '', s.getAttribute('href')); render(false); scrollTo({ top: y }); document.querySelector(`[data-follow][aria-pressed="true"]`)?.focus({ preventScroll: true }); }
}
function onSearch(ev) {
  const f = ev.target.closest('#kn-search'); if (!f) return; ev.preventDefault(); const q = f.q.value.trim().toLowerCase(); if (q.length < 2) return; const d = S.d;
  const hit = d.species.find(s => [s.scientific_name, ...(s.common_names || [])].some(n => n.toLowerCase().includes(q))); if (hit) { location.href = PI.links.explorer(hit.id); return; }
  const f2 = d.functions.find(x => [x.label, ...(x.aliases || [])].some(n => n.toLowerCase().includes(q))); if (f2) { location.href = PI.links.explorerFocus('function', f2.id); return; }
  const co = d.concepts.find(x => !x.no_plant_reaches && x.label.toLowerCase().includes(q)); if (co) { location.href = PI.links.explorerFocus('concept', co.id); return; }
  $('#kn-search-n').textContent = `Nothing in this snapshot is called “${f.q.value.trim()}”. Try a plant name, a spatial function or a trait.`;
}

// ---------------------------------------------------------------- masthead and the case
function mast(d) {
  const st = d.stats;
  return `<header class="pi-mast">
    <div><h1>What a design <em>rests on</em></h1>
      <p class="pi-lede">Planting Intelligence does not conjure a garden. Every plant it places goes back to a named source, a recorded claim and a written rule, and every result comes with what is still unknown. This page follows one real decision the whole way.</p>
      <div class="pi-cta"><a class="pi-btn primary" href="#" data-goto="kn-case">Follow one decision</a><a class="pi-btn" href="${PI.links.explorer()}">Explore the records yourself</a></div></div>
    <p class="pi-prov"><b>${esc(PI.snapshotLine(d))}</b><br>${st.sources} sources · ${st.claims} claims · ${st.claims_by_status.verified || 0} verified by a person<br>${st.links_drawn} of ${st.function_links} plant-to-function links drawn · ${st.links_by_status.unknown || 0} listed as unknown</p>
  </header>`;
}
const statusWord = { 'not met': 'not met', 'uncertain': 'uncertain', 'met on claimed sizes': 'met on claimed sizes' };
function caseHtml(sp, fn, link) {
  const c = S.c, d = S.d; if (!c) return `<section class="kn-case" id="kn-case" tabindex="-1"><p class="pi-none">No saved design with a ${esc(fn.label)} bed could be loaded, so the steps below show the records only.</p></section>`;
  const p = c.project; const B = p.site.boundary; const w = B ? Math.max(...B.map(q => q[0])) - Math.min(...B.map(q => q[0])) : null, h = B ? Math.max(...B.map(q => q[1])) - Math.min(...B.map(q => q[1])) : null;
  const ev = c.evaluation; const planted = [...new Set(c.row.map(o => o.species_id))]; const inRow = planted.includes(sp.id); const cand = c.asm.candidates.screen.find(x => x.id === sp.id);
  const names = planted.map(id => `<i>${esc(PC.species(d, id).scientific_name)}</i>`).join(' and ');
  const where = c.origin === 'mine' ? `your design <b>${esc(p.name)}</b>` : `the Studio’s recorded demonstration garden`;
  const head = !c.version ? `No arrangement could be computed for <b>${esc(c.bed.name)}</b>. The checks below are what Compose would show.`
    : c.row.length ? `${c.dry ? `<b>${esc(c.bed.name)}</b> has not been generated yet. In the engine’s dry run, the preview Compose shows, ${plural(c.row.length, 'plant')} of ${names} stand as its ${esc(fn.label)}` : `${plural(c.row.length, 'plant')} of ${names} stand as the ${esc(fn.label)} of <b>${esc(c.bed.name)}</b>`}. The engine’s own evaluation of that row: ${T.res(ev.status)}.`
      : `No ${esc(fn.label)} plant stands in <b>${esc(c.bed.name)}</b>${c.dry ? ' in the engine’s dry run' : ''}: no species passed the bed’s checks.`;
  const why = cand?.reasons.filter(r => cand.checks[r.split(':')[0]]?.result === 'fails')[0] || cand?.reasons[0];
  const about = !cand || inRow ? '' : `<p class="kn-case-sp"><i>${esc(sp.scientific_name)}</i> is not ${c.row.length ? 'in that row' : 'planted here'}: for this bed the engine’s result is ${T.res(cand.fit)}${why ? `, ${esc(why)}` : ''}.</p>`;
  const others = S.mineBeds.length && S.ref ? `<p class="kn-case-sw">${c.origin === 'mine' ? `<a href="${hashFor(sp.slug, { origin: 'reference' })}" data-follow>Use the demonstration garden instead</a>` : `<a href="${hashFor(sp.slug, null, S.mineBeds[0].id)}" data-follow>Trace this in your own design: ${esc(S.mine.name)} · ${esc(S.mineBeds[0].name)}</a>`}${c.origin === 'mine' && c.beds.length > 1 ? c.beds.filter(b => b.id !== c.bed.id).map(b => ` · <a href="${hashFor(sp.slug, null, b.id)}" data-follow>${esc(b.name)}</a>`).join('') : ''}</p>` : '';
  return `<section class="kn-case" id="kn-case" tabindex="-1">
    <div class="kn-case-d">${T.planSvg(c, { species: sp.id })}<p class="kn-key"><span><i class="k-bed"></i>the bed</span><span><i class="k-crown"></i>mature crown, from a claimed spread</span><span><i class="k-edge"></i>screened edge</span>${ev?.gaps?.length ? '<span><i class="k-gap"></i>not covered</span>' : ''}<span><i class="k-tree"></i>existing tree, canopy assumed</span></p></div>
    <div class="kn-case-t"><h2>The decision being followed</h2>
      <p class="kn-case-l">${head}</p>${about}
      <p class="kn-case-m">${w ? `A ${w} × ${h} m site in ` : ''}${where}${c.said ? `, described in one sentence: “${esc(c.said)}”` : ''}${c.version && !c.dry ? `. Recorded ${esc((c.version.created || '').slice(0, 10))}; checked and measured again on this page from the current snapshot${c.recorded ? (c.same ? ', with the same result.' : ', and the result differs from the recorded one: the page shows the new one.') : '.'}` : c.dry ? `. Computed on this page with the Studio’s default seed (${T.DRY_SEED}); nothing is saved to your design.` : '.'}</p>${others}
      <div class="kn-follow"><span class="kn-follow-l">Follow a species into this bed</span>${d.species.map(s => { const cd = c.asm.candidates.screen.find(x => x.id === s.id); const on = s.id === sp.id; return `<a class="pi-chip" role="button" aria-pressed="${on}" href="${hashFor(s.slug)}" data-follow title="${esc(s.common_names[0] || '')}: ${planted.includes(s.id) ? 'planted in this row' : cd ? `engine result ${cd.fit}` : 'not checked'}"><i>${esc(s.scientific_name)}</i>${planted.includes(s.id) ? '<small>planted</small>' : ''}</a>`; }).join('')}</div>
    </div></section>
    <p class="kn-kinds">Eight kinds of statement appear below and are never merged: ${Object.values(T.KIND).map(k => `<span title="${esc(k.says)}">${esc(k.label.toLowerCase())}</span>`).join(' · ')}. <a href="${PI.links.method()}#kinds">What each one means</a></p>`;
}

// ---------------------------------------------------------------- 1 Sources
const sec = (id, n, title, lede, body) => `<section class="pi-sec kn-step" id="${id}" tabindex="-1"><h2><span class="kn-n">${n}</span>${title}</h2><p class="pi-sec-l">${lede}</p><div>${body}</div></section>`;
const more = (label, body, open = false) => `<details class="pi-more-d"${open ? ' open' : ''}><summary>${label}</summary>${body}</details>`;
function useClaims(link) { return (link?.use_claims || []).map(id => S.d.claims[id]).filter(Boolean); }
function sources(sp, fn, link) {
  const d = S.d; const cl = useClaims(link); const byType = {}; for (const s of Object.values(d.sources)) byType[s.type] = (byType[s.type] || 0) + 1;
  const nOf = sid => Object.values(d.claims).filter(c => c.source_id === sid).length; const pract = Object.values(d.sources).filter(s => s.type === 'practitioner');
  const rows = cl.length ? cl.map(c => { const so = d.sources[c.source_id] || {}; const chk = d.evidence_checks[c.id]; const survey = so.type === 'practitioner';
    const body = survey ? `<p>A practitioner answered the project survey. The response itself stays in the survey’s protected database; what is published is the project’s paraphrase of it, in step 2.</p>`
      : chk?.excerpt ? `<blockquote>${esc(chk.excerpt)}</blockquote><p class="pi-led-n">Where on the page: ${esc(chk.locator || 'not recorded')}. The excerpt was recorded when the source was read for the check in step 2.</p>` : `<p>The source page is cited; no excerpt of it is recorded.</p>`;
    return T.row('source', body, `<span>${T.sourceLink(d, c.source_id)}</span><span>${esc(T.SOURCE_TYPE[so.type] || human(so.type || ''))}${so.publisher && !survey ? ` · ${esc(so.publisher)}` : ''}</span>${so.licence_tier ? `<span>licence tier ${esc(so.licence_tier)}</span>` : ''}`); }).join('')
    : T.row('source', `<p><b>No source states that <i>${esc(sp.scientific_name)}</i> can be used as a ${esc(fn.label)}.</b> ${link?.status === 'candidate' ? 'The link in step 3 is an inference from recorded traits.' : 'Whatever the database says about this pair comes from the trait check in step 3.'}</p>`, '<span>an explicit unknown</span>');
  const all = `<table class="pi-table"><thead><tr><th>Source</th><th>Kind</th><th>Publisher</th><th class="n">Claims</th></tr></thead><tbody>${Object.values(d.sources).filter(s => s.type !== 'practitioner').map(s => ({ s, n: nOf(s.id) })).sort((a, b) => b.n - a.n).map(({ s, n }) => `<tr><td>${s.url ? `<a href="${esc(s.url)}" rel="noopener">${esc(s.label.split(' — ')[0])}</a>` : esc(s.label)}</td><td>${esc(T.SOURCE_TYPE[s.type] || s.type)}</td><td>${esc(s.publisher || '')}</td><td class="n">${n}</td></tr>`).join('')}<tr><td>Practitioner survey</td><td>${plural(pract.length, 'anonymous respondent')}</td><td>${esc(pract[0]?.publisher || '')}</td><td class="n">${pract.reduce((a, s) => a + nOf(s.id), 0)}</td></tr></tbody></table>`;
  return sec('kn-sources', 1, 'Sources', 'Where the knowledge comes from.',
    `<p>Knowledge enters as statements from named sources. This release cites ${d.stats.sources}: ${[['database', 'published plant database'], ['municipal', 'municipal open-data set'], ['practitioner', 'anonymous practitioner response']].filter(([k]) => byType[k]).map(([k, w]) => plural(byType[k], w)).join(', ')}${byType.model ? `, and ${plural(byType.model, 'model placeholder')} that is never counted as evidence` : ''}.</p>
    <dl class="pi-ledger">${rows}</dl>
    ${more(`All ${d.stats.sources} sources of this release`, all)}<p class="kn-go"><a href="${PI.links.research()}">How practitioner knowledge is collected</a></p>`);
}

// ---------------------------------------------------------------- 2 Claims & attributes
function claimRows(c) {
  const d = S.d; const chk = d.evidence_checks[c.id]; const survey = T.isSurvey(d, c.source_id); const vals = T.valueLabels(d, c);
  const ver = c.status === 'verified' ? `<p>${tag('verified')} A reviewer checked this claim against ${survey ? 'the response' : 'its source'}.</p>` : `<p>${tag('unverified')} No person has checked this claim against its source yet. Unverified is not wrong; it is unchecked.</p>`;
  const ai = chk ? `<p>${tag(chk.result, T.AI_WORD[chk.result] || human(chk.result))} ${esc(chk.explanation || '')}</p>${chk.missing_context ? `<p class="pi-led-n">Missing context: ${esc(chk.missing_context)}</p>` : ''}` : `<p>${tag('not_assessed', 'not assessed')} ${c.status === 'verified' ? 'Claims a person had already verified were not sent to the assistant.' : 'No assessment is on record for this claim.'}</p>`;
  return T.row('claim', `<p>${esc(c.text)}</p><p class="pi-led-n">${esc(human(c.field))} = ${vals.map(esc).join(' · ')}${c.conditions?.length ? ` · when ${c.conditions.map(x => esc(x.label)).join(', ')}` : ''}${c.cultivar ? ` · cv. ${esc(c.cultivar)}` : ''}</p>${more('The record as stored', `<pre class="pi-json">${esc(JSON.stringify(c, null, 1))}</pre>`)}`,
      `<span class="id">${esc(c.id)}</span><span>${T.sourceLink(d, c.source_id)}${c.place_label ? ` · ${esc(c.place_label)}` : ''}</span><span>recorded ${esc(c.recorded_at || '')} · confidence ${esc(c.confidence)}</span>`)
    + T.row('verification', ver, '')
    + T.row('ai', ai, chk ? `<span>${esc(human(chk.method || ''))} · ${esc((chk.reviewed_at || '').slice(0, 10))}</span><span>never changes the claim</span>` : '');
}
function claims(sp, fn, link) {
  const d = S.d, st = d.stats; const cl = useClaims(link); const chk = st.claims_by_check; const v = st.claims_by_status.verified || 0;
  const bar = parts => `<span class="pi-split">${parts.filter(p => p[1]).map(([cls, n]) => `<i class="${cls}" style="flex:${n}"></i>`).join('')}</span>`;
  const body = cl.length ? `<dl class="pi-ledger">${cl.map(claimRows).join('')}</dl>` : `<dl class="pi-ledger">${T.row('claim', `<p><b>There is no claim that <i>${esc(sp.scientific_name)}</i> is used as a ${esc(fn.label)}.</b> Its ${sp.claims.live} claims record other things: size, habit, light, soil. Step 3 shows which of them the function check reads.</p>`, '<span>an explicit unknown</span>')}</dl>`;
  return sec('kn-claims', 2, 'Claims &amp; attributes', 'How a statement is stored and reviewed.',
    `<p>A statement becomes a claim: one plant, one field, one value, kept with its source, place, conditions and a confidence. Two separate checks follow. A person verifies it against the source. Independently, an AI assistant has read each source and recorded whether it supports the claim, as a starting point for reviewers.</p>
    ${body}
    <div class="kn-figs"><div><p><b>${v}</b> of ${st.claims} claims verified by a person</p>${bar([['v', v], ['u', st.claims - v]])}<p class="pi-key"><span><i class="v"></i>verified</span><span><i class="u"></i>unverified</span></p></div>
      <div><p><b>${chk.supported_by_source || 0}</b> of ${st.claims} found supported by the AI source assessment</p>${bar([['s', chk.supported_by_source], ['p', chk.partially_supported], ['c', chk.conflicting_evidence], ['n', chk.not_assessed]])}<p class="pi-key"><span><i class="s"></i>supported ${chk.supported_by_source || 0}</span><span><i class="p"></i>partially ${chk.partially_supported || 0}</span><span><i class="c"></i>conflicting ${chk.conflicting_evidence || 0}</span><span><i class="n"></i>not assessed ${chk.not_assessed || 0}</span></p></div></div>
    <p>Claims are plain JSON, one file per species. The same records fill a GIS-style attribute table: one cell per plant and field, every distinct value kept beside its claims, nothing averaged. <i>${esc(sp.scientific_name)}</i> has ${sp.claims.live} live claims in ${d.attributes.filter(a => a.species === sp.id).length} of ${d.facets.length} fields.</p>
    <p class="kn-go"><a href="${PI.links.explorer(sp.id, null, 'table')}">Open its row in the attribute table</a><a href="${PI.links.profile(sp.id)}">Read its plant profile</a></p>`);
}

// ---------------------------------------------------------------- 3 Relationships
function partner(sp) {   // the species to compare with: one planted in the same bed, else one with a direct record
  const d = S.d, c = S.c; const inBed = c ? [...new Set(c.plants.map(o => o.species_id))].filter(id => id !== sp.id) : [];
  const withRecord = d.pairs.filter(p => (p.a === sp.id || p.b === sp.id) && p.direct_relations.length).map(p => p.a === sp.id ? p.b : p.a);
  const id = inBed.find(x => withRecord.includes(x)) || inBed[0] || withRecord[0] || d.species.find(s => s.id !== sp.id).id;
  return { other: PC.species(d, id), sameBed: !!c && inBed.includes(id) && c.plants.some(o => o.species_id === sp.id) };
}
function relations(sp, fn, link) {
  const d = S.d; const SP = new Map(d.species.map(s => [s.id, s]));
  const reqs = (link?.requirements || []).map(r => `<tr><td>${esc(r.strength)}</td><td>${r.alternative_labels.map(esc).join(' <span class="or">or</span> ')}${r.to_confirm ? ' <span class="pi-led-n">(requirement to confirm)</span>' : ''}</td><td>${T.res(r.result)}${r.evidence?.length ? ` <span class="pi-led-n">${plural(new Set(r.evidence.map(e => e.claim)).size, 'claim')}: ${[...new Set(r.evidence.map(e => e.target_label))].map(esc).join(', ')}${r.evidence.some(e => e.conditions?.length) ? ', some under stated conditions' : ''}</span>` : ''}${r.contrary?.length ? ` <span class="pi-led-n">recorded instead: ${r.contrary.map(x => `${esc(x.target_label)} (${esc(T.sourceName(d, x.source_id))})`).join(', ')}</span>` : ''}${!r.evidence?.length && !r.contrary?.length ? ' <span class="pi-led-n">nothing recorded</span>' : ''}</td></tr>`).join('');
  let say;
  if (!link) say = '<p>No record.</p>';
  else if (link.status === 'derived') say = `<p>${tag('derived')}${tag(link.verification === 'none' ? 'none' : link.verification, link.verification === 'none' ? 'no claim to verify' : link.verification)}${link.conflict ? tag('conflict', 'a trait claim contradicts it') : ''} A source records the use <b>${esc(link.via_use_labels.join(', '))}</b>, and the ontology maps that use to ${esc(fn.label)}. The link is no stronger than the claim under it${link.verification === 'verified' ? ': a person verified a use claim' : ': no person has verified it'}.</p>`;
  else if (link.status === 'candidate') say = `<p>${tag('candidate')} No source states this use. Every trait ${esc(fn.label)} requires is met by recorded claims, so the link is an inference. It is never promoted until a source records the use.</p>`;
  else say = `<p>${tag('unknown')} No link is drawn. ${link.verdict === 'contradicted by traits' ? `A recorded claim places the plant outside a trait ${esc(fn.label)} requires.` : `The database has no claim on a trait ${esc(fn.label)} requires. Not known is not the same as unsuitable.`}</p>`;
  const rule = (link?.rules || []).map(r => d.rules[r] ? `<p class="pi-led-n"><b>${esc(r)}</b> ${esc(d.rules[r])}</p>` : '').join('');
  const col = d.function_links.filter(l => l.function === FN).sort((a, b) => ({ derived: 0, documented: 0, candidate: 1, unknown: 2 }[a.status] - { derived: 0, documented: 0, candidate: 1, unknown: 2 }[b.status]));
  const colHtml = `<table class="pi-table"><thead><tr><th>Species</th><th>Link</th><th>Basis</th></tr></thead><tbody>${col.map(l => `<tr${l.species === sp.id ? ' class="on"' : ''}><td><a href="${hashFor(SP.get(l.species).slug)}" data-follow><i>${esc(SP.get(l.species).scientific_name)}</i></a></td><td>${tag(l.status)}${l.conflict ? tag('conflict') : ''}</td><td>${l.drawn ? (l.via_use_labels?.length ? `recorded use: ${esc(l.via_use_labels.join(', '))}` : 'inferred from recorded traits') : esc(l.verdict || 'unknown')}</td></tr>`).join('')}</tbody></table>`;
  // species A and species B: four things kept apart
  const { other, sameBed } = partner(sp); const pair = d.pairs.find(p => (p.a === sp.id && p.b === other.id) || (p.b === sp.id && p.a === other.id));
  const rels = (pair?.direct_relations || []).map(id => d.relations.find(r => r.id === id)).filter(Boolean); const sharedF = (pair?.attributes || []).filter(r => r.shared.length);
  const combos = pair?.complementarity?.combinations || []; const fnName = id => d.functions.find(f => f.id === id)?.label || id; const swap = pair && pair.a !== sp.id;
  const bio = rels.filter(r => ['companion', 'competes', 'facilitates', 'co_occurs_with'].includes(r.type));
  const ab = `<h3 class="pi-h3">Between two species, four different things</h3><p>${sameBed ? `In this bed <i>${esc(sp.scientific_name)}</i> stands with <i>${esc(other.scientific_name)}</i>.` : `Take <i>${esc(sp.scientific_name)}</i> and <i>${esc(other.scientific_name)}</i>.`} What the knowledge base holds about the two together is four separate things, and only the first is a record of the pair.</p>
    <dl class="pi-ledger kn-ab">
      <div class="pi-led"><dt>Recorded relationship</dt><dd>${rels.length ? rels.map(r => `<p>${tag(r.kg_status)}${r.placeholder ? tag('candidate', 'model placeholder') : tag(r.status)} <b>${esc(human(r.type))}</b> ${esc(r.text || '')}</p>`).join('') : '<p><b>None recorded.</b> An honest absence, not evidence that the two are incompatible.</p>'}</dd><dd class="pi-led-p">${rels.length ? rels.map(r => `<span>${esc(T.sourceName(d, r.source_id))}</span>`).join('') : '<span>an explicit unknown</span>'}</dd></div>
      <div class="pi-led"><dt>Shared attributes</dt><dd><p>${plural(sharedF.length, 'field')} with a value in common${sharedF.length ? `, such as ${sharedF.slice(0, 3).map(r => `${esc(r.label)}: ${esc(r.shared.map(x => r.labels[x]).slice(0, 2).join(', '))}`).join('; ')}` : ''}. A computable overlap. Sharing growing conditions does not make two plants companions.</p></dd><dd class="pi-led-p">${T.who('record')}<span>computed from each plant’s own claims</span></dd></div>
      <div class="pi-led"><dt>Inferred spatial complementarity</dt><dd><p>${combos.length ? `${combos.slice(0, 3).map(x => `${esc(fnName(swap ? x.b_function : x.a_function))} + ${esc(fnName(swap ? x.a_function : x.b_function))}`).join(', ')}${combos.length > 3 ? ` and ${combos.length - 3} more` : ''}: the two plants’ function links allow these roles side by side. A layering hypothesis for a designer to test on site.` : 'The two plants’ function links allow no distinct pair of roles.'}</p></dd><dd class="pi-led-p">${T.who('rule')}<span>from the function links, not from the pair</span></dd></div>
      <div class="pi-led"><dt>Biological association</dt><dd><p>${bio.length ? `Only what is recorded above, with its status. ${bio.some(r => r.placeholder) ? 'A model placeholder is a question to check against a source, not evidence.' : ''}` : '<b>Not supported by any record.</b> Nothing here says these two grow well together, compete, or help each other. The platform does not infer it.'}</p></dd><dd class="pi-led-p"><span>${bio.length ? 'see the record' : 'an explicit unknown'}</span></dd></div>
    </dl>
    <p class="kn-go"><a href="${PI.links.compare(sp.id, other.id)}">Compare the two side by side</a></p>`;
  return sec('kn-relations', 3, 'Relationships', 'How traits relate to a spatial function, and species to each other.',
    `<p>${esc(fn.label)} is not a plant attribute. It is a role a planting plays: ${esc(fn.definition.charAt(0).toLowerCase() + fn.definition.slice(1))} The knowledge graph links a species to it only by a written rule, and checks the traits the role needs against the plant’s claims.</p>
    <dl class="pi-ledger">${T.row('rule', `${say}${rule}`, `<span class="id">${esc(link?.id || '')}</span>`)}</dl>
    ${reqs ? `<table class="pi-table kn-req"><thead><tr><th></th><th>${esc(fn.label)} needs</th><th>Recorded for <i>${esc(sp.scientific_name)}</i></th></tr></thead><tbody>${reqs}</tbody></table><p class="pi-led-n">The requirements come from the planting-design literature (${esc((fn.source_of_term || '').split(',').slice(0, 2).join(','))}), not from a plant source. A met trait is a recorded attribute; it is not yet a screen in a garden.</p>` : ''}
    ${more(`All ${col.length} species against ${esc(fn.label)}: ${fn.n_linked} linked, ${fn.n_unknown} unknown`, colHtml)}
    <p class="kn-go kn-views"><span>The same records in three views</span><a href="${PI.links.explorerFocus('function', FN, { view: 'graph', inspect: link ? { kind: 'link', id: link.id } : null })}">Graph</a><a href="${PI.links.explorerFocus('function', FN, { view: 'matrix', inspect: link ? { kind: 'link', id: link.id } : null })}">Function matrix</a><a href="${PI.links.explorerFocus('function', FN, { view: 'table' })}">Attribute table</a></p>
    ${ab}`);
}

// ---------------------------------------------------------------- 4 Knowledge access
const STATUS_WORD = { 'user-stated': 'stated', 'user-drawn': 'drawn', 'user-calibrated': 'calibrated', 'user-accepted': 'accepted as proposed', 'user-edited': 'edited by you', assumed: 'assumed', inferred: 'estimated from words', unknown: 'unknown', 'ai-suggested': 'suggested, not accepted' };
function access(sp, fn, link) {
  const d = S.d, c = S.c; if (!c) return sec('kn-access', 4, 'Knowledge access', 'How the Garden Studio reads these records for a bed.', `<p>The Studio keeps no plant data of its own: for every bed it asks the snapshot about each species. No saved design is available to show it on.</p>`);
  const p = c.project, bed = c.bed, asm = c.asm; const r = asm.rows.find(x => x.id === sp.id); const cand = asm.candidates.screen.find(x => x.id === sp.id); const req = asm.requirement;
  const cond = k => { const v = asm.conditions[k]; return v && v.value && v.status !== 'unknown' ? `${esc(human(v.value))} <span class="pi-led-n">${esc(STATUS_WORD[v.status] || v.status)}</span>` : '<span class="pi-none">unknown</span>'; };
  const bfn = (bed.functions || []).find(f => f.function === FN) || p.brief.functions.find(f => f.function === FN && !f.alternative);
  const site = `<dl class="kn-site"><div><dt>Outline</dt><dd>${p.site.boundary ? `${esc(STATUS_WORD[p.site.boundary_status] || p.site.boundary_status || 'drawn')}` : 'not drawn'}</dd></div><div><dt>${esc(bed.name)}</dt><dd>${bed.area_m2} m² · ${esc(STATUS_WORD[bed.status] || bed.status)}</dd></div><div><dt>Light</dt><dd>${cond('light')}</dd></div><div><dt>Water</dt><dd>${cond('water')}</dd></div><div><dt>Soil</dt><dd>${cond('soil_type')}</dd></div><div><dt>Target height</dt><dd>${req?.target_height_m ?? '?'} m <span class="pi-led-n">${esc(/heuristic/.test(req?.target_basis || '') ? 'not stated: the engine’s default' : req?.target_basis || '')}</span></dd></div><div><dt>Year-round cover</dt><dd>${req?.year_round ? 'required' : `<span class="pi-led-n">${esc(/not stated/.test(req?.year_round_basis || '') ? 'not stated: reported, not required' : req?.year_round_basis || '')}</span>`}</dd></div></dl>`;
  const read = p.brief.provenance === 'offline-parser' || !p.brief.provenance ? 'offline rules' : esc(p.brief.provenance);
  const gate = r ? ['light', 'water', 'soil'].map(k => `<tr><td>${k}</td><td>${T.res(r.gate[k].result)}</td><td>${esc(r.gate[k].detail)}</td></tr>`).join('') : '';
  const order = { meets: 0, uncertain: 1, fails: 2 }; const planted = new Set(c.row.map(o => o.species_id)); const col = k => x => x.checks[k] ? T.res(x.checks[k].result) : '<span class="pi-none">—</span>';
  const cands = asm.candidates.screen.slice().sort((a, b) => (planted.has(b.id) - planted.has(a.id)) || order[a.fit] - order[b.fit] || a.name.localeCompare(b.name));
  const why = x => { const f = Object.entries(x.checks).find(([, v]) => v.result === 'fails') || Object.entries(x.checks).find(([, v]) => v.result === 'uncertain'); if (!f) return 'every check passes'; const k = f[0].replace('_', ' '); return f[1].detail.toLowerCase().startsWith(k) ? f[1].detail : `${k}: ${f[1].detail}`; };
  const tableOf = list => `<table class="pi-table kn-cand"><thead><tr><th>Species</th><th>Evidence</th><th>Site</th><th>Height</th><th>Row fits</th><th>Result</th></tr></thead><tbody>${list.map(x => `<tr${x.id === sp.id ? ' class="on"' : ''}><td><a href="${hashFor(PC.species(d, x.id).slug)}" data-follow><i>${esc(x.name)}</i></a>${planted.has(x.id) ? ' <span class="kn-planted">planted</span>' : ''}<span class="pi-led-n">${esc(why(x))}</span></td><td>${col('evidence')(x)}</td><td>${col('site')(x)}</td><td>${col('height')(x)}</td><td>${x.checks.form?.result === 'fails' ? T.res('fails') : col('geometry')(x)}</td><td><b>${T.res(x.fit)}</b></td></tr>`).join('')}</tbody></table>`;
  const shown = cands.filter(x => x.fit !== 'fails' || x.id === sp.id || planted.has(x.id)), rest = cands.filter(x => !shown.includes(x));   // the species that stand a chance, and the one being followed; the rest one click away
  const table = `${shown.length ? tableOf(shown) : ''}${rest.length ? more(`${shown.length ? `The other ${rest.length}` : `All ${rest.length}`} species fail a check for this bed, each with its reason`, tableOf(rest), !shown.length) : ''}`;
  return sec('kn-access', 4, 'Knowledge access', 'How the Garden Studio reads these records for a bed.',
    `<p>The Studio keeps no plant data of its own. For every bed it asks the snapshot three things about each species: does it pass the site’s light, water and soil; what supports it for the bed’s function; how large does it get. What it asks <em>against</em> is yours: the site you stated.</p>
    <dl class="pi-ledger">
      ${T.row('site', `${c.said ? `<blockquote>${esc(c.said)}</blockquote>` : ''}<p class="kn-read">${T.who('rule')} Read by ${read}, a listed set of patterns, not by a language model${bfn?.basis ? `: ${esc(bfn.basis)}` : ''}.</p>${site}`, `<span>${c.origin === 'mine' ? esc(p.name) : 'the demonstration garden'}</span><span>what was not stated stays unknown</span>`)}
      ${r ? T.row('engine', `<p>What the Studio read from the snapshot for <i>${esc(sp.scientific_name)}</i> in this bed:</p><table class="pi-table kn-gate"><tbody>${gate}<tr><td>function</td><td>${cand ? T.res(cand.checks.evidence.result) : ''}</td><td>${esc(cand?.checks.evidence.detail || '')}</td></tr><tr><td>size</td><td><span class="pi-res estimate">proxy</span></td><td>crown ${r.proxy.radius_m * 2} m across${r.proxy.spread.claim ? `, from the claimed spread ${r.proxy.spread.min}–${r.proxy.spread.max} m` : ', spread not recorded'}${r.proxy.height.claim ? `; height ${r.proxy.height.min}–${r.proxy.height.max} m claimed` : '; height not recorded'}. One claimed range chosen by a stated rule, never a measurement.</td></tr></tbody></table>`, `${r.proxy.spread.claim ? `<span class="id">${esc(r.proxy.spread.claim)}</span>` : ''}${r.proxy.height.claim ? `<span class="id">${esc(r.proxy.height.claim)}</span>` : ''}`) : ''}
    </dl>
    <h3 class="pi-h3">Every species, checked for this bed</h3>
    <p>The engine checked all ${cands.length} species against ${esc(bed.name)}, on this page, just now: ${cands.filter(x => x.fit !== 'fails').length} can be used, ${cands.filter(x => x.fit === 'fails').length} cannot. A species that fails one check is not planted, whoever asks for it. One that is uncertain may be planted and is reported as uncertain.</p>
    ${table}
    <p class="kn-go">${c.origin === 'mine' ? `<a href="${PI.links.compose(bed.id, sp.id)}">Open ${esc(bed.name)} in Compose</a>` : `<a href="${PI.links.design()}">Describe a site of your own</a>`}<a href="${PI.links.profile(sp.id)}#sec-studio">How the Studio draws this plant</a></p>`);
}

// ---------------------------------------------------------------- 5 Design evaluation
function evaluation(sp, fn, link) {
  const c = S.c, d = S.d; const title = 'Design evaluation', lede = 'What the engine can establish, and what it cannot.';
  if (!c) return sec('kn-evaluation', 5, title, lede, `<p>No saved design is available to evaluate.</p>`);
  const ev = c.evaluation, pl = c.plan, v = c.version; const R = S.E.ARRANGEMENT_RULES; const used = ['screen_spacing', 'row_end_margin', 'edge_tolerance', 'neighbour_clearance', 'tree_keepout', 'screen_target_height'].filter(k => R[k]);
  if (!v || !ev) return sec('kn-evaluation', 5, title, lede, `<p>No arrangement has been generated for ${esc(c.bed.name)} yet, so there is nothing to evaluate. ${c.origin === 'mine' ? `<a href="${PI.links.compose(c.bed.id, sp.id)}">Open it in Compose</a>` : ''}</p>`);
  const lead = pl ? PC.species(d, pl.lead.species_id) : null;
  const out = pl ? `<p>${pl.rows === 1 ? 'One row' : `${pl.rows} rows`} along the screened edge of ${pl.edge_length_m} m${lead ? `, planted with <i>${esc(lead.scientific_name)}</i>` : ''}: ${pl.expected[0] + pl.expected[1]} positions at ${pl.step_m} m, <b>${pl.placed[0] + pl.placed[1]} placed</b>${pl.shortfall ? `. ${esc(pl.shortfall.charAt(0).toUpperCase() + pl.shortfall.slice(1))}` : ''}.</p><p class="pi-led-n">Spacing: ${esc(pl.spacing_rule)}. The factor is the engine’s own ${esc(pl.spacing_source)}: the database holds no spacing claim. ${esc(pl.reason.charAt(0).toUpperCase() + pl.reason.slice(1))}.</p>` : `<p>No row was placed for this bed.</p>`;
  const chk = ev.checks; const line = (name, r, text) => `<tr><td>${name}</td><td>${T.res(r)}</td><td>${text}</td></tr>`;
  const rows = line('Continuity', chk.continuity, `${ev.covered_m} m of ${ev.edge_length_m} m lies under a mature crown${ev.gaps.length ? `; ${plural(ev.gaps.length, 'gap')} of ${ev.gap_total_m} m` : ''}`)
    + line(`Height ${ev.target_height_m} m`, chk.target_height, `reached for certain on ${ev.cover_at_target_certain_m} m, possibly on ${ev.cover_at_target_possible_m} m, if the plants reach the top of their claimed ranges${/heuristic/.test(ev.target_basis) ? '. The target itself is a default; none was stated' : ''}`)
    + line('Year-round cover', chk.year_round, ev.year_round_required ? `evergreen on ${ev.cover_evergreen_m} m` : `not asked for; evergreen on ${ev.cover_evergreen_m} m`)
    + line('Evidence', chk.evidence, ev.species.map(s => `${esc(PC.species(d, s.species_id).scientific_name)}: link ${esc(s.link_status)}${s.conflict ? ', in conflict' : ''}, ${s.link_verified ? 'verified' : 'not verified by a person'}`).join('; '));
  const bad = ev.status === 'not met', unc = ev.status === 'uncertain';
  const verdict = `<div class="kn-verdict ${bad ? 'bad' : unc ? 'unc' : 'ok'}"><p class="kn-verdict-s">${esc(fn.label)}: ${esc(ev.status)}</p><ul>${ev.reasons.map(r => `<li>${esc(r.text.charAt(0).toUpperCase() + r.text.slice(1))}.</li>`).join('') || '<li>Every check the engine can make is met on claimed sizes.</li>'}</ul></div>`;
  const inRow = c.row.some(o => o.species_id === sp.id); const cand = c.asm.candidates.screen.find(x => x.id === sp.id);
  const note = !inRow && cand ? `<p><i>${esc(sp.scientific_name)}</i> is not part of this row (${T.res(cand.fit)} for this bed), so the evaluation below is of the plants that were placed.</p>` : '';
  const limits = [
    ['Whether it screens', 'The engine projects mature crowns onto the edge. It does not measure opacity, and it reports this itself: not a measured or verified screening performance.'],
    ['How it grows', 'Sizes are claimed mature ranges. Establishment, growth rate on this site and pruning are not modelled.'],
    ['Whether the site suits it', (() => { const u = ['light', 'water', 'soil_type'].filter(k => { const x = c.asm.conditions[k]; return !x || !x.value || x.status === 'unknown'; }); const list = u.map(k => k.replace('_type', '')); const words = list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0]; return u.length ? `${words.charAt(0).toUpperCase() + words.slice(1)} ${u.length === 1 ? 'was' : 'were'} not stated for this site, so no site gate can pass: every candidate is uncertain at best.` : 'The stated light, water and soil are checked against recorded requirements; microclimate is not.'; })()],
    ['How the plants behave together', 'No record, no assessment. Shared conditions are never read as compatibility.'],
    ['Cost and ecological performance', (t => t.charAt(0).toUpperCase() + t.slice(1))(`${esc(v.evaluation?.cost_note || 'no prices in the database')}; ${esc(v.evaluation?.ecology_note || 'no ecological score')}.`)],
  ];
  return sec('kn-evaluation', 5, title, lede,
    `<p>The engine arranges the species that passed, then measures its own result on the model. It reports geometry and claimed sizes. A recorded mature height is not proof that the plant will make a privacy screen in this garden, and the page says so.</p>${note}
    <dl class="pi-ledger">
      ${T.row('engine', `${out}${T.edgeStrip(c)}<p class="kn-key"><span><i class="k-crown"></i>mature crown</span><span><i class="k-miss"></i>position dropped</span><span><i class="k-gap"></i>edge not covered</span></p>`, `<span>${c.dry ? 'dry run on this page' : esc(v.label || '')} · seed ${esc(v.seed)}</span><span>${esc((v.generator?.operators || []).join(', '))}</span><span>${c.dry ? 'not saved to the design' : 'same input, same garden'}</span>`)}
      ${T.row('evaluation', `${verdict}<table class="pi-table kn-eval"><tbody>${rows}</tbody></table><p class="pi-led-n">${esc(ev.note)}</p>`, `<span>measured on the model</span><span>${c.dry ? 'computed here, on the dry run' : c.same ? 'recomputed here: same result' : c.recorded ? 'recomputed here: differs from the recorded result' : 'computed here'}</span>`)}
    </dl>
    <h3 class="pi-h3">What this cannot establish</h3>
    <dl class="kn-limits">${limits.map(([k, t]) => `<div><dt>${k}</dt><dd>${t}</dd></div>`).join('')}</dl>
    ${more(`${used.length} numbers behind this row, and where each comes from`, `<table class="pi-table"><thead><tr><th>Rule</th><th>Value</th><th>From</th></tr></thead><tbody><tr><td>size proxy</td><td>${R.size_proxy.value} ${esc(R.size_proxy.unit)}</td><td>${T.res(R.size_proxy.source)}</td></tr>${used.map(k => `<tr><td>${esc(k.replace(/_/g, ' '))}</td><td>${R[k].value} ${esc(R[k].unit)}</td><td>${T.res(R[k].source)}</td></tr>`).join('')}</tbody></table><p class="pi-led-n">A heuristic is a number the implementer chose. No source or claim backs it, and it is named wherever it decides something.</p>`)}
    <p class="kn-go">${c.origin === 'mine' ? `<a class="pi-btn primary" href="${PI.links.compose(c.bed.id, sp.id)}">Open ${esc(c.bed.name)} in Compose</a>` : `<a class="pi-btn primary" href="${PI.links.design()}">Design a garden of your own</a>`}<a href="${PI.links.method()}">Who or what decides at each step</a></p>`);
}

// ---------------------------------------------------------------- ways into the records
function explore(sp, fn) {
  const d = S.d; const L = PI.links;
  return `<section class="pi-sec kn-step" id="kn-explore" tabindex="-1"><h2>Explore the records</h2><p class="pi-sec-l">The graph, the matrix and the table are three views of the same records, not three databases.</p><div>
    <form id="kn-search" class="kn-search" role="search"><label for="kn-q">Search a plant, a spatial function or a trait</label><div><input id="kn-q" name="q" type="search" autocomplete="off" spellcheck="false" placeholder="${esc([sp.common_names[0], fn.label, fn.requirements[fn.requirements.length - 1]?.alternative_labels[0]].filter(Boolean).map(x => x.toLowerCase()).join(', '))}…"><button class="pi-btn primary" type="submit">Open</button></div><p id="kn-search-n" class="pi-led-n" aria-live="polite"></p></form>
    <h3 class="pi-h3">Start from a spatial function</h3>
    <ul class="kn-fns">${d.functions.map(f => `<li><a href="${L.explorerFocus('function', f.id)}"><b>${esc(f.label)}</b><span>${esc(f.definition)}</span><small>${f.n_linked} linked · ${f.n_unknown} unknown</small></a></li>`).join('')}</ul>
    <h3 class="pi-h3">Or choose a view</h3>
    <ul class="pi-list kn-views-l">
      <li><a href="${L.explorer(null, null, 'graph')}"><b>Relationship graph</b></a> One plant, function or trait at the centre; you open its relationships one layer at a time.</li>
      <li><a href="${L.explorer(null, null, 'matrix')}"><b>Spatial function matrix</b></a> ${d.species.length} species by ${d.functions.length} functions. Every cell opens its evidence; a blank is a gap, not a verdict.</li>
      <li><a href="${L.explorer(null, null, 'table')}"><b>Attribute table</b></a> A GIS-style table of ${d.facets.length} fields per species, with every value and where sources disagree.</li>
      <li><a href="${L.explorer(null, null, 'compare')}"><b>Compare A and B</b></a> Two species: shared attributes, recorded relationships, spatial complementarity and unknowns, kept apart.</li>
      <li><a href="${L.neural()}"><b>Neural view</b></a> The same claims as one immersive three-dimensional network.</li>
    </ul>
    <p class="kn-go"><a href="${L.research()}">Research and contribution</a><a href="${L.method()}">Method and limits</a><a href="${L.library()}">Plant Library</a></p></div></section>`;
}
