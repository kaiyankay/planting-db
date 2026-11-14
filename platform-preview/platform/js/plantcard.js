// Plant Card and Plant Profile — the one presentation of a species, used by the Plant Library and, in its compact form, by the
// Knowledge Explorer and the Garden Studio (Compose, Grow). Every word about a plant is read from the published knowledge
// snapshot `d` (brain/data/explorer.json, tools/build_explorer.py): identity, attribute cells, function links, claims, evidence
// checks, sources. This file adds wording around those records and nothing else. The photograph and its credit come from
// platform/data/images.json, a presentation manifest that holds no plant fact.
//
// Three vocabularies are kept apart everywhere, with the words the snapshot uses:
//   status         documented · derived · candidate · unknown        how a line of knowledge came to exist
//   verification   verified · unverified                               whether a person checked the claim against its source
//   AI check       supported by source · partially supported · conflicting evidence · not assessed
//                                                                      an assistant's reading of the source — an assessment, not verification
import { esc, links, slugOf, speciesId, imageUrl } from './platform.js';

const IDX = new WeakMap();
function idx(d) {
  let x = IDX.get(d); if (x) return x;
  x = { SP: new Map(d.species.map(s => [s.id, s])), FA: new Map(d.facets.map(f => [f.id, f])), FN: new Map(d.functions.map(f => [f.id, f])), AT: new Map(d.attributes.map(a => [`${a.species}|${a.facet}`, a])), LK: new Map(d.function_links.map(l => [`${l.species}|${l.function}`, l])), claimsOf: new Map() };
  for (const c of Object.values(d.claims)) { const k = speciesId(c.plant); (x.claimsOf.get(k) || x.claimsOf.set(k, []).get(k)).push(c); }
  IDX.set(d, x); return x;
}
export const species = (d, id) => idx(d).SP.get(speciesId(id)) || null;
const human = s => String(s ?? '').replace(/_/g, ' ');
const plural = (n, w, ws = w + 's') => `${n} ${n === 1 ? w : ws}`;
export const tag = (cls, text = human(cls)) => `<span class="pi-tag ${esc(String(cls).replace(/\s+/g, '_'))}">${esc(text)}</span>`;
const AI_WORD = { supported_by_source: 'supported by source', partially_supported: 'partially supported', conflicting_evidence: 'conflicting evidence', not_assessed: 'not assessed' };
export const STUDIO_FUNCTIONS = ['z:screen', 'z:ground_cover'];   // the functions design/js/engine.js arranges today

/** the most specific recorded origin: the entity record when there is one */
function originLabel(d, s) { const c = idx(d).AT.get(`${s.id}|origin`); if (!c) return human(s.origin_status); const v = c.values.find(v => v.entity) || c.values[0]; return v ? v.label : human(s.origin_status); }
const cellValues = (d, s, facet) => { const c = idx(d).AT.get(`${s.id}|${facet}`); return c ? c.values.map(v => v.label) : null; };
const valueHtml = v => `<span class="pi-val">${esc(v.label)}${v.conditions?.length ? ` <small>in ${esc(v.conditions.join(', ').toLowerCase())}</small>` : ''}${v.cultivars?.length ? ` <small>cv. ${esc(v.cultivars.join(', '))}</small>` : ''}</span>`;
const sourceShort = (d, sid) => { const s = d.sources[sid]; if (!s) return sid; return s.type === 'practitioner' ? `Practitioner survey, ${sid.replace('survey-r', 'respondent ')}` : s.label.split(' — ')[0]; };

// ---------------------------------------------------------------- image
/** the photograph of a species, or the fallback: the plan symbol the Studio draws from recorded claims, labelled as such */
export function figureHtml(d, id, imgs, { size = 'card', symbol = null, credit = false } = {}) {
  const s = species(d, id); const im = imgs?.images?.[s.slug];
  if (im) {
    const cr = `Photo: ${esc(im.author)}, ${esc(im.licence)}, via Wikimedia Commons`;
    return `<figure class="pi-fig"><img src="${esc(imageUrl(size === 'card' ? im.card : im.file))}" alt="${esc(s.scientific_name)}${im.caption_at_source ? ` — ${esc(im.caption_at_source)}` : ''}" loading="lazy" width="${im.width}" height="${im.height}">${credit ? `<figcaption><a href="${esc(im.source_url)}" rel="noopener">${cr}</a><span>Identified as <i>${esc(s.scientific_name)}</i> on its Commons page; not verified by this project.</span></figcaption>` : ''}</figure>`;
  }
  return `<figure class="pi-fig pi-fig-symbol">${symbol ? `<svg viewBox="-1.25 -1.25 2.5 2.5" role="img" aria-label="plan symbol of ${esc(s.scientific_name)}"><g>${symbol}</g></svg>` : ''}<figcaption><span>No licensed photograph yet. This is the plan symbol the Garden Studio draws from the recorded growth form, spread and colour claims — not a botanical illustration.</span></figcaption></figure>`;
}

// ---------------------------------------------------------------- Plant Card (atlas)
export function cardHtml(d, id, imgs, { symbol = null, note = '' } = {}) {
  const s = species(d, id); const X = idx(d); const fns = d.functions.map(f => X.LK.get(`${s.id}|${f.id}`)).filter(l => l && l.drawn);
  return `<article class="pi-card" data-species="${esc(s.slug)}" data-form="${esc(s.growth_form_label)}" data-functions="${esc(fns.map(l => l.function).join(' '))}">
    <a class="pi-card-link" href="${esc(links.profile(s.id))}" aria-label="${esc(s.scientific_name)}, ${esc(s.common_names[0] || '')}: read the profile">
      ${figureHtml(d, id, imgs, { size: 'card', symbol })}
      <h3><i>${esc(s.scientific_name)}</i></h3>
      <p class="pi-card-common">${esc(s.common_names[0] || '')}</p>
      <p class="pi-card-meta">${esc(s.growth_form_label)} · ${esc(originLabel(d, s))}</p>
      ${note ? `<p class="pi-card-note">${note}</p>` : ''}
      <span class="pi-more">Read more<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M9 4.5 12.5 8 9 11.5"/></svg></span>
    </a></article>`;
}

// ---------------------------------------------------------------- compact card (Explorer inspector, Compose, Grow)
/** names + thumbnail + the two ways onward. `extra` is appended to the actions (a module's own button). */
export function miniHtml(d, id, imgs, { extra = '', here = null } = {}) {
  const s = species(d, id); if (!s) return ''; const im = imgs?.images?.[s.slug];
  return `<div class="pi-mini" data-pi-mini="${esc(s.slug)}">${im ? `<img src="${esc(imageUrl(im.card))}" alt="" loading="lazy" title="Photo: ${esc(im.author)}, ${esc(im.licence)}, via Wikimedia Commons">` : ''}<div class="pi-mini-b"><div class="pi-mini-n"><i>${esc(s.scientific_name)}</i><span>${esc(s.common_names[0] || '')} · ${esc(s.growth_form_label)}</span></div><div class="pi-mini-a">${here === 'profile' ? '' : `<a href="${esc(links.profile(s.id))}" data-pi-go="profile">Plant profile</a>`}${here === 'explorer' ? '' : `<a href="${esc(links.explorer(s.id))}" data-pi-go="explorer">Knowledge graph</a>`}${extra}</div></div></div>`;
}

// ---------------------------------------------------------------- Plant Profile
function factRow(d, s, f) {
  const c = idx(d).AT.get(`${s.id}|${f.id}`);
  if (!c) return `<div class="pi-fact missing"><dt>${esc(f.label)}</dt><dd><span class="pi-none">not recorded</span></dd><dd class="pi-fact-m"></dd></div>`;
  const size = f.id === 'height_class' || f.id === 'spread_class';
  let body;
  if (size) {   // the size facets are bins over claims that state ranges under different conditions: the claims themselves are shown
    const cl = c.claims.map(id => d.claims[id]).filter(Boolean); const show = cl.slice(0, 5);
    body = `<ul class="pi-claims">${show.map(x => `<li>${esc(x.text)} <span class="pi-src">${esc(sourceShort(d, x.source_id))}${x.cultivar ? ` · cv. ${esc(x.cultivar)}` : ''}</span></li>`).join('')}</ul>${cl.length > show.length ? `<span class="pi-fact-more">${cl.length - show.length} more claims in the Explorer</span>` : ''}`;
  } else body = c.values.map(valueHtml).join('<span class="pi-sep"> · </span>');
  const flags = `${c.disagreement.length ? tag('conflict', 'sources disagree') : ''}${c.variation.length ? tag('to_confirm', 'depends on conditions') : ''}`;
  return `<div class="pi-fact"><dt title="${esc(f.definition || '')}">${esc(f.label)}</dt><dd>${body}</dd><dd class="pi-fact-m"><a href="${esc(links.explorer(s.id, { kind: 'attr', id: c.id }))}" title="open the claims behind this field in the Knowledge Explorer">${plural(c.n_claims, 'claim')}, ${plural(c.n_sources, 'source')}</a>${tag(c.status)}${tag(c.verification)}${flags}</dd></div>`;
}
function functionRow(d, s, f) {
  const l = idx(d).LK.get(`${s.id}|${f.id}`); if (!l) return '';
  let why;
  if (l.drawn && l.via_use_labels?.length) why = `Recorded use: ${esc(l.via_use_labels.join(', '))} <span class="pi-src">${esc([...new Set(l.use_sources || [])].map(x => sourceShort(d, x)).join(', '))}</span>`;
  else if (l.drawn) why = `Inferred from recorded traits (rule ${esc(l.rule || 'KG-R4')}). No source states this use.`;
  else { const unmet = (l.requirements || []).filter(r => r.result !== 'met'); why = `${esc(l.verdict || 'not established')}${unmet.length ? ': ' + unmet.map(r => `needs ${esc(r.alternative_labels.join(' or '))}${r.contrary?.length ? `, recorded ${esc([...new Set(r.contrary.map(c => c.target_label))].join(', '))}` : ', nothing recorded'}`).join('; ') : ''}`; }
  const studio = STUDIO_FUNCTIONS.includes(f.id) ? (l.drawn ? 'The Garden Studio can arrange it for this function, bed by bed.' : 'The Garden Studio arranges this function, but not with this plant.') : 'Recorded only: the Garden Studio has no arrangement rule for this function yet.';
  return `<div class="pi-fn ${l.drawn ? 'drawn' : 'gap'}"><div class="pi-fn-h"><h4><a href="${esc(links.explorer(s.id, { kind: 'link', id: l.id }))}" title="${esc(f.definition)} — open the requirement check in the Knowledge Explorer">${esc(f.label)}</a></h4>${tag(l.status)}${l.drawn ? tag(l.verification === 'none' ? 'none' : l.verification, l.verification === 'none' ? 'no claim to verify' : l.verification) : ''}${l.conflict ? tag('conflict', 'a trait claim contradicts it') : ''}</div><p>${why}</p><p class="pi-fn-s">${studio}</p></div>`;
}

/** the full profile. ctx: { design, isConsidered, symbol, studio } — what the Library knows about the user's design and the Studio's drawing */
export function detailHtml(d, id, imgs, ctx = {}) {
  const s = species(d, id); if (!s) return ''; const X = idx(d);
  const cells = d.facets.map(f => X.AT.get(`${s.id}|${f.id}`));
  const missing = d.facets.filter((f, i) => !cells[i]); const disagree = cells.filter(c => c && c.disagreement.length); const vary = cells.filter(c => c && c.variation.length);
  const lks = d.functions.map(f => X.LK.get(`${s.id}|${f.id}`)).filter(Boolean); const unknown = lks.filter(l => !l.drawn), conflict = lks.filter(l => l.conflict);
  const cl = X.claimsOf.get(s.id) || []; const byCheck = {}; for (const c of cl) byCheck[c.evidence_check || 'not_assessed'] = (byCheck[c.evidence_check || 'not_assessed'] || 0) + 1;
  const bySource = new Map(); for (const c of cl) bySource.set(c.source_id, (bySource.get(c.source_id) || 0) + 1);
  const rels = (d.relations || []).filter(r => r.live && (r.a === s.id || r.b === s.id));
  const glance = [['Growth form', `${esc(s.growth_form_label)}`], ['Leaves', (cellValues(d, s, 'evergreen') || ['not recorded']).map(esc).join(' · ')], ['Light', (cellValues(d, s, 'exposure') || ['not recorded']).map(esc).join(' · ')], ['Water', (cellValues(d, s, 'water') || ['not recorded']).map(esc).join(' · ')], ['Soil', (cellValues(d, s, 'soil') || ['not recorded']).map(esc).join(' · ')], ['Origin', esc(originLabel(d, s))]];
  const group = gid => { const g = d.groups.find(x => x.id === gid); return `<section class="pi-sec" id="sec-${esc(gid.replace('y:', ''))}"><h2>${esc(GROUP_TITLE[gid] || g.label)}</h2><p class="pi-sec-l">${esc(g.definition)}</p><dl class="pi-facts">${d.facets.filter(f => f.group === gid).map(f => factRow(d, s, f)).join('')}</dl></section>`; };
  const des = ctx.design; const on = ctx.isConsidered;
  const consider = `<div class="pi-consider" data-consider-box>${des
    ? `<button class="pi-btn ${on ? 'on' : ''}" data-consider="${esc(s.slug)}" aria-pressed="${on ? 'true' : 'false'}">${on ? 'Being considered for your design' : 'Consider for my design'}</button><p>${on ? `<b>${esc(des.name)}</b> will show it in Compose with the check for each bed. <a href="${esc(links.design())}">${esc(ctx.returnLabel || 'Open the design')}</a>` : `Adds it to the candidates Compose checks for <b>${esc(des.name)}</b>. It is planted only where it passes the bed's site and function checks.`}</p>`
    : `<a class="pi-btn" href="${esc(links.design())}">Start a design</a><p>No design is in progress in this browser. ${on ? `This species is on your list and will be checked once a design has beds. <button class="pi-linkbtn" data-consider="${esc(s.slug)}">Take it off the list</button>` : `<button class="pi-linkbtn" data-consider="${esc(s.slug)}">Keep it on my list</button> and it will be checked, bed by bed, once a design has beds.`}</p>`}</div>`;

  return `<article class="pi-profile" data-species="${esc(s.slug)}">
  <header class="pi-hero">
    ${figureHtml(d, id, imgs, { size: 'full', symbol: ctx.symbol, credit: true })}
    <div class="pi-hero-t">
      <h1><i>${esc(s.scientific_name)}</i></h1>
      <p class="pi-names">${esc(s.common_names.join(' · '))}</p>
      <p class="pi-ident">${esc(s.family)} · ${esc(s.growth_form_label)} ${tag(s.growth_form_status === 'supported' ? 'derived' : 'to_confirm', s.growth_form_status === 'supported' ? `growth form supported, ${s.growth_form_rule}` : `growth form ${s.growth_form_status}`)}</p>
      <dl class="pi-glance">${glance.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <div class="pi-actions"><a class="pi-btn primary" href="${esc(links.explorer(s.id))}">Open in the Knowledge Explorer</a><a class="pi-btn" href="${esc(links.neural(s.id))}">Neural view</a></div>
      ${consider}
      <p class="pi-counts">${plural(s.claims.live, 'live claim')} from ${plural(bySource.size, 'source')} · ${s.claims.verified} verified by a person · ${plural(disagree.length, 'field')} where sources disagree · ${plural(missing.length, 'field')} not recorded</p>
    </div>
  </header>
  <nav class="pi-toc" aria-label="Sections of this profile"><a href="#sec-growth_form">Form</a><a href="#sec-environment">Environment</a><a href="#sec-functions">Spatial functions</a><a href="#sec-studio">In the Studio</a><a href="#sec-evidence">Evidence</a><a href="#sec-gaps">Unknown and conflicting</a><a href="#sec-sources">Sources</a></nav>

  ${group('y:growth_form')}
  ${group('y:environment')}
  ${group('y:seasonal_ecological')}
  ${group('y:maintenance_risk')}

  <section class="pi-sec" id="sec-functions"><h2>Spatial functions</h2><p class="pi-sec-l">What this plant can do in a planting, according to the records: a use a source states, or a use inferred from recorded traits. A link is evidence for a designer to weigh, not a suitability score.</p><div class="pi-fns">${d.functions.map(f => functionRow(d, s, f)).join('')}</div></section>

  <section class="pi-sec" id="sec-studio"><h2>In the Garden Studio</h2><p class="pi-sec-l">How the design engine reads this record when it draws and places the plant.</p><div class="pi-studio-w">${ctx.studio || ''}</div></section>

  <section class="pi-sec" id="sec-evidence"><h2>Knowledge and evidence status</h2>
    <p class="pi-sec-l">Three separate things are recorded for every claim, and none stands in for another.</p>
    <dl class="pi-ev">
      <div><dt>Claims</dt><dd><b>${s.claims.live}</b> live${s.claims.retired ? `, ${s.claims.retired} retired and kept as history` : ''}</dd></div>
      <div><dt>Verified by a person</dt><dd><b>${s.claims.verified}</b> ${tag('verified')} <b>${s.claims.unverified}</b> ${tag('unverified')}<span class="pi-ev-n">A reviewer opened the source and confirmed the claim. Unverified does not mean wrong; it means nobody has checked yet.</span></dd></div>
      <div><dt>AI source check</dt><dd>${Object.keys(AI_WORD).filter(k => byCheck[k]).map(k => `<b>${byCheck[k]}</b> ${tag(k, AI_WORD[k])}`).join(' ')}<span class="pi-ev-n">An assistant read each source against its claim. This is an assessment to help reviewers, never a verification.</span></dd></div>
      <div><dt>How lines came to exist</dt><dd>${tag('documented')} a source states it · ${tag('derived')} a recorded rule over claims · ${tag('candidate')} inferred, never promoted · ${tag('unknown')} listed as a gap</dd></div>
    </dl></section>

  <section class="pi-sec" id="sec-gaps"><h2>Unknown, conflicting and missing</h2>
    <p class="pi-sec-l">What the database cannot tell you about this plant yet.</p>
    <div class="pi-gaps">
      <div><h4>Not recorded <small>${missing.length}</small></h4>${missing.length ? `<p>${missing.map(f => esc(f.label)).join(' · ')}</p>` : '<p class="pi-none">every field has at least one claim</p>'}</div>
      <div><h4>Sources disagree <small>${disagree.reduce((n, c) => n + c.disagreement.length, 0)}</small></h4>${disagree.length ? `<ul>${disagree.flatMap(c => c.disagreement.map(x => `<li>${esc(x.text)} <a href="${esc(links.explorer(s.id, { kind: 'attr', id: c.id }))}">claims</a></li>`)).join('')}</ul>` : '<p class="pi-none">no disagreement recorded</p>'}</div>
      ${vary.length ? `<div><h4>Depends on conditions <small>${vary.reduce((n, c) => n + c.variation.length, 0)}</small></h4><ul>${vary.flatMap(c => c.variation.map(x => `<li>${esc(x.text)}</li>`)).join('')}</ul></div>` : ''}
      <div><h4>Spatial functions without a link <small>${unknown.length}</small></h4>${unknown.length ? `<p>${unknown.map(l => `${esc(X.FN.get(l.function).label)} <span class="pi-src">${esc(l.verdict || 'unknown')}</span>`).join(' · ')}</p>` : '<p class="pi-none">all five have a link</p>'}${conflict.length ? `<p>${conflict.map(l => `${esc(X.FN.get(l.function).label)}: a source records the use and a recorded trait contradicts it. Both are kept.`).join(' ')}</p>` : ''}</div>
    </div></section>

  ${rels.length ? `<section class="pi-sec" id="sec-relations"><h2>Recorded with other plants</h2><p class="pi-sec-l">Only pairings someone recorded. Sharing a trait never makes two plants companions.</p><ul class="pi-rels">${rels.map(r => { const o = r.a === s.id ? r.b : r.a; const os = X.SP.get(o); return os ? `<li>${esc(human(r.type))} <a href="${esc(links.profile(o))}"><i>${esc(os.scientific_name)}</i></a> ${tag(r.kg_status)}${r.placeholder ? tag('candidate', 'model placeholder') : ''} <span class="pi-src">${esc(sourceShort(d, r.source_id))}</span></li>` : ''; }).join('')}</ul></section>` : ''}

  <section class="pi-sec" id="sec-sources"><h2>Sources</h2><p class="pi-sec-l">Where the ${s.claims.live} claims come from. Facts are stored with credit; no source text or photograph is copied.</p>
    <ul class="pi-sources">${[...bySource.entries()].sort((a, b) => b[1] - a[1]).map(([sid, n]) => { const so = d.sources[sid] || { label: sid }; const pract = so.type === 'practitioner'; return `<li><span class="pi-so-n">${n}</span><span class="pi-so-l">${so.url && !pract ? `<a href="${esc(so.url)}" rel="noopener">${esc(so.label)}</a>` : esc(pract ? sourceShort(d, sid) : so.label)}<small>${esc(human(so.type || ''))}${so.publisher && !pract ? ` · ${esc(so.publisher)}` : ''}${pract ? ' · anonymous response to the project survey' : ''}${so.licence_tier ? ` · licence tier ${esc(so.licence_tier)}` : ''}</small></span></li>`; }).join('')}</ul></section>
  </article>`;
}
const GROUP_TITLE = { 'y:growth_form': 'Growth form and morphology', 'y:environment': 'Recorded environmental requirements', 'y:seasonal_ecological': 'Seasonal and ecological performance', 'y:maintenance_risk': 'Maintenance and risk' };
