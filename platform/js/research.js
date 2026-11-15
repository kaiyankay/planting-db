// Knowledge · Research — why practitioner knowledge is collected, what the survey asks, what it has changed in the structure of the
// database, what the current release records, misses and holds in conflict, and how an observation becomes a reviewed record.
// Every figure is counted here, in the browser, from the published snapshot (brain/data/explorer.json). Nothing is read from the
// survey's database; no response, respondent mapping or summary of answers appears; nothing a visitor does here changes a record.
import * as PI from './platform.js';
import { tag } from './plantcard.js';
import * as T from './trace.js';

const $ = s => document.querySelector(s); const esc = PI.esc;
const plural = (n, w, ws = w + 's') => `${n} ${n === 1 ? w : ws}`;
const KIND_WORD = { attribute: ['attribute', 'attributes'], selection_reason: ['reason for choosing a plant', 'reasons for choosing a plant'], observation: ['observation', 'observations'], warning: ['warning', 'warnings'] };
const kindWord = (key, n) => (KIND_WORD[key] || [T.human(key), T.human(key)])[n === 1 ? 0 : 1];
const KIND_CLS = { attribute: 'v', selection_reason: 's', observation: 'p', warning: 'c' };

(async function boot() {
  try {
    const d = await PI.loadSnapshot(); PI.mountTop($('#top'), { active: 'knowledge', section: 'research', snapshot: d }); $('#foot').innerHTML = PI.footHtml(d);
    $('#app').innerHTML = html(d); window.research = { d };
    const cap = $('#rs-cap'), say = ev => { const t = ev.target.closest('.rs-grid td [title]'); if (t && cap) cap.textContent = t.title; }; $('.rs-grid')?.addEventListener('mouseover', say); $('.rs-grid')?.addEventListener('focusin', say);
    if (location.hash.length > 1) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch (e) { $('#app').innerHTML = `<p class="pi-loading">Could not load the knowledge snapshot: ${esc(e.message)}</p>`; console.error(e); }
})();

function html(d) {
  const st = d.stats; const claims = Object.values(d.claims); const SP = new Map(d.species.map(s => [s.id, s])); const FN = new Map(d.functions.map(f => [f.id, f]));
  const pract = claims.filter(c => c.source_type === 'practitioner'), pub = claims.filter(c => c.source_type !== 'practitioner');
  const practSources = new Set(pract.map(c => c.source_id)).size; const practPlants = new Set(pract.map(c => c.plant)).size;
  const kinds = list => { const n = {}; for (const c of list) n[c.claim_kind || 'attribute'] = (n[c.claim_kind || 'attribute'] || 0) + 1; return Object.entries(n).sort((a, b) => b[1] - a[1]); };
  const kindRow = (label, list) => { const k = kinds(list); return `<div class="rs-kind"><p><b>${list.length}</b> ${label}</p><span class="pi-split">${k.map(([key, n]) => `<i class="${KIND_CLS[key] || 'n'}" style="flex:${n}" title="${n} ${esc(kindWord(key, n))}"></i>`).join('')}</span><p class="pi-key">${k.map(([key, n]) => `<span><i class="${KIND_CLS[key] || 'n'}"></i>${n} ${esc(kindWord(key, n))}</span>`).join('')}</p></div>`; };
  const coListed = d.relations.filter(r => r.live && r.type === 'co_listed').length; const withMeta = pract.filter(c => c.practitioner_meta).length; const gates = d.facets.filter(f => f.gate);
  const cells = st.attribute_cells + st.cells_not_recorded; const AT = new Map(d.attributes.map(a => [`${a.species}|${a.facet}`, a]));
  const groups = d.groups.map(g => ({ g, facets: d.facets.filter(f => f.group === g.id) }));
  const grid = `<div class="rs-grid-w"><table class="rs-grid" aria-label="Coverage of ${d.facets.length} fields for ${d.species.length} species"><thead><tr><th></th>${groups.map(x => `<th colspan="${x.facets.length}">${esc(x.g.label)}</th>`).join('')}</tr></thead><tbody>${d.species.map(s => `<tr><th><a href="${esc(PI.links.profile(s.id))}"><i>${esc(s.scientific_name)}</i></a></th>${groups.map(x => x.facets.map((f, i) => { const a = AT.get(`${s.id}|${f.id}`); const cls = !a ? 'no' : a.disagreement.length ? 'dis' : 'rec'; const t = `${s.scientific_name} · ${f.label}: ${!a ? 'not recorded' : `${plural(a.n_claims, 'claim')} from ${plural(a.n_sources, 'source')}${a.disagreement.length ? ', sources disagree' : ''}`}`; return `<td class="${i === 0 ? 'g ' : ''}">${a ? `<a class="${cls}" href="${esc(PI.links.explorer(s.id, { kind: 'attr', id: a.id }, 'table'))}" title="${esc(t)}" aria-label="${esc(t)}"></a>` : `<span class="${cls}" title="${esc(t)}"></span>`}</td>`; }).join('')).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="pi-key"><span><i class="v"></i>recorded</span><span><i class="p"></i>recorded, sources disagree</span><span><i class="n"></i>not recorded</span><span class="rs-key-n">one square per field; a recorded square opens its claims</span></p><p class="rs-cap" id="rs-cap" aria-live="polite">Point at a square to read its species and field.</p>`;
  const thin = d.facets.filter(f => f.n_species < d.species.length).sort((a, b) => a.n_species - b.n_species).slice(0, 5);
  const L = st.links_by_status; const lk = l => `<a href="${esc(PI.links.explorer(l.species, { kind: 'link', id: l.id }, 'matrix'))}"><i>${esc(SP.get(l.species).scientific_name)}</i> → ${esc(FN.get(l.function).label)}</a>`;
  const conf = d.function_links.filter(l => l.conflict);
  return `<div class="pi-doc rs">
  <header class="pi-mast">
    <div><h1>Knowledge from <em>practice</em></h1>
      <p class="pi-lede">Plant databases say what a plant is. People who design and grow plantings in Metro Vancouver know why they choose it, and what happens next. This research collects that knowledge with care and shows how it enters the record.</p>
      <div class="pi-cta"><a class="pi-btn primary" href="${PI.SURVEY_URL}" rel="noopener">Take the survey</a><span>Short, anonymous, works on a phone. It opens as a separate site.</span></div></div>
    <p class="pi-prov"><b>${esc(PI.snapshotLine(d))}</b><br>this page counts the published release only<br>it does not change when a survey response arrives</p>
  </header>
  <nav class="pi-toc" aria-label="Sections"><a href="#why">Why practitioners</a><a href="#survey">The survey</a><a href="#structure">What it changes</a><a href="#state">Recorded, missing, conflicting</a><a href="#path">From an observation to a release</a><a href="#contribute">Contribute</a></nav>

  <section class="pi-sec" id="why"><h2>Why practitioner knowledge</h2><p class="pi-sec-l">The two kinds of source record different things.</p>
    <div><p>A published database tells you a mature height or a hardiness zone. It rarely tells you why a designer reaches for a plant, or how it behaved in a real garden here. Those are the things a planting decision turns on, and they live with practitioners.</p>
    <div class="rs-kinds">${kindRow('claims from published databases and open data', pub)}${kindRow(`claims from ${practSources} of the ${Object.values(d.sources).filter(x => x.type === 'practitioner').length} anonymous respondents cited in this release, about ${practPlants} of ${st.species} species`, pract)}</div>
    <p>The practitioner claims are few. They are kept apart from published data, with an anonymous source id, and they are the only records of their kind in the release.</p></div></section>

  <section class="pi-sec" id="survey"><h2>What the survey asks</h2><p class="pi-sec-l">Fifteen questions for designers, horticulturists, students and gardeners.</p>
    <div><ul class="pi-list">
      <li><b>How you choose plants today.</b> Which conditions a plant must pass, and which you only compare.</li>
      <li><b>What you cannot find out.</b> The facts you look for and do not trust, or never find.</li>
      <li><b>How you would ask.</b> The words you would type into a plant database.</li>
      <li><b>What makes you trust a note.</b> What you need to know about who observed something, and where.</li>
      <li><b>Which plants you would consider.</b> A short list for a Metro Vancouver site, and why each is on it.</li>
    </ul>
    <p class="pi-led-n">The survey is its own application with its own protected database. Responses, the key that links a response to an anonymous source id, sign-in and reviewers’ notes stay there; this site never reads them. A summary of the answers has not been approved for publication, so none is shown.</p></div></section>

  <section class="pi-sec" id="structure"><h2>What it changes</h2><p class="pi-sec-l">Answers do not only add records. They have shaped how records are stored and how the Studio reads them.</p>
    <dl class="kn-limits">
      <div><dt>A reason is its own kind of claim</dt><dd>What a respondent said about choosing a plant is stored as a selection reason, an observation or a warning, never as a plant attribute. ${pract.length} such claims are in this release.</dd></div>
      <div><dt>Who observed it travels with the claim</dt><dd>${withMeta} practitioner claims carry the observer’s background, how complete the observation is, and whether it may be cited. A reader can weigh the note; a reviewer can ask for more.</dd></div>
      <div><dt>Listed together is not compatible</dt><dd>Plants a respondent named for the same site are recorded as “co-listed”: ${coListed} records. The <a href="${PI.links.explorer(null, null, 'compare')}">comparison</a> keeps them apart from any statement about how two plants behave together.</dd></div>
      <div><dt>Must-pass fields became gates</dt><dd>${gates.length} of ${d.facets.length} fields are marked as gate fields in the release, following the survey’s question on conditions a plant must pass: ${gates.map(f => esc(f.label.toLowerCase())).join(', ')}. Claims in those fields are queued first for the source check.</dd></div>
      <div><dt>Names outside the database wait</dt><dd>A plant a respondent names that the database does not hold is kept as a candidate for a later release. It is not turned into a claim.</dd></div>
    </dl></section>

  <section class="pi-sec" id="state"><h2>Recorded, missing, conflicting</h2><p class="pi-sec-l">The state of this release. A gap is a missing record, never a statement about the plant.</p>
    <div><dl class="pi-stat rs-stat">
      <div><dd>${st.attribute_cells}<small> / ${cells}</small></dd><dt>fields recorded across ${st.species} species</dt></div>
      <div><dd>${st.cells_with_disagreement}</dd><dt>fields where sources disagree, every value kept</dt></div>
      <div><dd>${st.claims_by_status.verified || 0}<small> / ${st.claims}</small></dd><dt>claims verified by a person</dt></div>
    </dl>
    ${grid}
    <p>Least recorded: ${thin.map(f => `${esc(f.label.toLowerCase())} (${f.n_species} of ${st.species})`).join(', ')}.</p>
    <h3 class="pi-h3">Plants and spatial functions</h3>
    <p>Of ${st.function_links} possible links between a species and a spatial function, ${L.derived || 0} are ${tag('derived')} from a use a source records, ${L.candidate || 0} are ${tag('candidate')} links inferred from traits, and <span class="rs-nw">${L.unknown || 0} have ${tag('unknown', 'no link')}</span>: ${st.unknown_by_verdict?.['contradicted by traits'] || 0} because a recorded trait is outside what the function needs, ${st.unknown_by_verdict?.['evidence missing'] || 0} because a needed claim is missing.</p>
    <span class="pi-split rs-links"><i class="v" style="flex:${L.derived || 0}"></i><i class="p" style="flex:${L.candidate || 0}"></i><i class="n" style="flex:${L.unknown || 0}"></i></span>
    ${conf.length ? `<p>${plural(conf.length, 'link')} ${conf.length === 1 ? 'is' : 'are'} in conflict: a source records the use and a recorded trait contradicts it. Both are kept and shown. ${conf.map(lk).join(' · ')}</p>` : ''}
    ${st.relations_with_missing_claims?.length ? `<p class="pi-led-n">Open correction: ${plural(st.relations_with_missing_claims.length, 'plant-to-plant record')} cites a claim that is not in the database. It is flagged in the release and listed for correction.</p>` : ''}
    <p class="kn-go"><a href="${PI.links.explorer(null, null, 'matrix')}">Every link and gap in the function matrix</a><a href="${PI.links.explorer(null, null, 'table')}">Every field in the attribute table</a></p></div></section>

  <section class="pi-sec" id="path"><h2>From an observation to a release</h2><p class="pi-sec-l">A response never becomes a verified record by itself. A person decides at three of six steps.</p>
    <ol class="pi-steps">
      <li><b>A response is stored</b><span>In the survey’s own database. Nothing else happens automatically.</span><span>${T.who('person')}</span></li>
      <li><b>A researcher reads it</b><span>Plant names are matched to species by hand. Names outside the database are kept as candidates.</span><span>${T.who('person')}</span></li>
      <li><b>Statements become unreviewed claims</b><span>Written with an anonymous source id, their context, and wording kept apart from published sources.</span><span>${T.who('rule')} ${T.who('person')}</span></li>
      <li><b>Review</b><span>A reviewer checks each claim against what was said or published and marks it verified, or leaves it unverified. An AI reading of the source sits beside it as an aid.</span><span>${T.who('person')} ${T.who('ai')}</span></li>
      <li><b>The graph is rebuilt and tested</b><span>Written rules derive growth forms, height bands and function links from the claims. The test suites must pass.</span><span>${T.who('rule')}</span></li>
      <li><b>A dated release is published</b><span>One snapshot file. The Library, the Explorer and the Studio read that same file, so a change reaches all three together.</span><span>${T.who('person')}</span></li>
    </ol></section>

  <section class="pi-sec" id="contribute"><h2>Contribute</h2><p class="pi-sec-l">Two ways to add to the record.</p>
    <div><ul class="pi-list">
      <li><b><a href="${PI.SURVEY_URL}" rel="noopener">Take the survey</a></b> Share how you work with plants. Short, anonymous, works on a phone.</li>
      <li><b><a href="${PI.REPO_URL}/issues" rel="noopener">Report an error in a record</a></b> On the project repository, with the claim id shown beside the record.</li>
    </ul>
    <p>The database is versioned, not live. This release is dated <b>${esc(d.generated)}</b> (schema ${esc(d.schema_version)}, ontology ${esc(d.ontology_version)}), and the Garden Studio records the release a design was made with, so a planting can always be traced to the knowledge it used.</p>
    <p class="kn-go"><a href="${PI.links.knowledge()}">See one decision traced to its sources</a><a href="${PI.links.method()}">Method and limits</a></p></div></section>
  </div>`;
}
