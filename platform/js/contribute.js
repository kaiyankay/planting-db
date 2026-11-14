// Contribute — the public face of how knowledge enters and develops: the survey (a separate, protected application), what the
// published snapshot already holds from practitioners, what is still missing or in conflict, and how a release is made.
// Every figure on the page is counted here, in the browser, from the published snapshot (brain/data/explorer.json). Nothing is
// read from the survey's database, and nothing a visitor does on this page changes the knowledge base.
import * as PI from './platform.js';
import { tag } from './plantcard.js';

const $ = s => document.querySelector(s); const esc = PI.esc;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

(async function boot() {
  try {
    const d = await PI.loadSnapshot(); PI.mountTop($('#top'), { active: 'contribute', snapshot: d }); $('#foot').innerHTML = PI.footHtml(d);
    $('#app').innerHTML = html(d); window.contribute = { d };
  } catch (e) { $('#app').innerHTML = `<p class="pi-loading">Could not load the knowledge snapshot: ${esc(e.message)}</p>`; console.error(e); }
})();

function html(d) {
  const st = d.stats; const claims = Object.values(d.claims); const SP = new Map(d.species.map(s => [s.id, s])); const FN = new Map(d.functions.map(f => [f.id, f]));
  const pract = claims.filter(c => c.source_type === 'practitioner'); const practSources = Object.values(d.sources).filter(s => s.type === 'practitioner').length; const practPlants = new Set(pract.map(c => c.plant)).size;
  const practRel = d.relations.filter(r => r.live && r.source_type === 'practitioner').length;
  const cells = st.attribute_cells + st.cells_not_recorded;
  const perSpecies = d.species.map(s => { const a = d.attributes.filter(x => x.species === s.id); const dis = a.filter(x => x.disagreement.length).length; return { s, rec: a.length, dis, miss: d.facets.length - a.length }; }).sort((a, b) => a.rec - b.rec);
  const thin = d.facets.filter(f => f.n_species < d.species.length).sort((a, b) => a.n_species - b.n_species).slice(0, 8);
  const cand = d.function_links.filter(l => l.status === 'candidate'); const conf = d.function_links.filter(l => l.conflict); const noev = d.function_links.filter(l => !l.drawn && l.verdict === 'evidence missing');
  const lk = l => `<a href="${esc(PI.links.explorer(l.species, { kind: 'link', id: l.id }))}"><i>${esc(SP.get(l.species).scientific_name)}</i> → ${esc(FN.get(l.function).label)}</a>`;
  const chk = st.claims_by_check;
  return `<div class="pi-doc">
  <header class="pi-mast">
    <div><h1>Knowledge, still <em>growing</em></h1>
      <p class="pi-lede">Planting Intelligence learns from people who work with plants in Metro Vancouver. A short anonymous survey is how their experience reaches the project, a review decides what is recorded, and a dated release is what the Plant Library, the Explorer and the Garden Studio all read.</p>
      <div class="pi-cta"><a class="pi-btn primary" href="${PI.SURVEY_URL}" rel="noopener">Take the survey</a><span>Short, anonymous, works on a phone. It opens as a separate site.</span></div></div>
    <p class="pi-prov"><b>${esc(PI.snapshotLine(d))}</b><br>this page counts the published release<br>it does not update when a survey response arrives</p>
  </header>

  <section class="pi-sec" id="survey"><h2>The survey</h2><p class="pi-sec-l">Fifteen questions for designers, horticulturists, students and gardeners.</p>
    <div><p>It asks how you choose plants today, what you cannot find out, how you would ask a plant database, what makes you trust someone else's notes, and which plants you would consider for a Metro Vancouver site.</p>
    <p>The survey is its own application with its own protected database. Responses, the private key that links a response to an anonymous source id, sign-in and reviewers' notes all stay there. This site never reads them.</p>
    <p><a href="${PI.SURVEY_URL}" rel="noopener">Open the survey</a> · Found an error in a plant record instead? <a href="${PI.REPO_URL}/issues" rel="noopener">Report it on the project repository.</a></p></div></section>

  <section class="pi-sec" id="path"><h2>From a response to a record</h2><p class="pi-sec-l">A submission is never a verified plant claim by itself. Six steps stand between the two, and a person decides at three of them.</p>
    <ol class="pi-steps">
      <li><b>A response is stored</b><span>In the survey's own database. Nothing else happens automatically.</span><span class="who">protected system</span></li>
      <li><b>A researcher exports and reads it</b><span>Plant names are matched to species by hand; names outside the database are kept as candidates for later, not as claims.</span><span class="who">decided by a person</span></li>
      <li><b>Statements become unreviewed evidence</b><span>What a respondent said about a plant is written as a claim with an anonymous source id (survey-r07), its context and its wording kept apart from published sources.</span><span class="who">script, then a person</span></li>
      <li><b>Review</b><span>A reviewer checks each claim against what was actually said or published and marks it verified, or leaves it unverified. An assistant's reading of the source is shown beside it as an aid and never counts as verification.</span><span class="who">decided by a person</span></li>
      <li><b>The graph is rebuilt and tested</b><span>Recorded rules derive growth forms, height bands and spatial function links from the claims; the test suites must pass.</span><span class="who">rule-based</span></li>
      <li><b>A dated release is published</b><span>One snapshot file, with its date and schema version. Every page of this platform reads that file, so a change reaches the Library, the Explorer and the Studio together.</span><span class="who">decided by a person</span></li>
    </ol></section>

  <section class="pi-sec" id="findings"><h2>What practitioners have added so far</h2><p class="pi-sec-l">Counted from the published release only. A summary of the answers themselves has not been approved for publication yet.</p>
    <div><dl class="pi-stat">
      <div><dd>${practSources}</dd><dt>anonymous respondents cited as sources</dt></div>
      <div><dd>${pract.length}</dd><dt>claims from their answers, about ${practPlants} of ${st.species} species</dt></div>
      <div><dd>${practRel}</dd><dt>pairings of plants that a respondent listed together</dt></div>
      <div><dd>${pract.filter(c => c.status === 'verified').length}<small> / ${pract.length}</small></dd><dt>checked against the response by a reviewer</dt></div>
    </dl>
    <p style="margin-top:16px">Most of these are reasons for choosing a plant (${pract.filter(c => c.claim_kind === 'selection_reason').length}) and observations from practice (${pract.filter(c => c.claim_kind === 'observation').length}): the kind of knowledge the published databases do not hold. You can see each one, with its anonymous source, under Sources on a <a href="${PI.links.library()}">plant profile</a>.</p></div></section>

  <section class="pi-sec" id="development"><h2>Knowledge under development</h2><p class="pi-sec-l">Coverage, gaps and conflicts of the current release. A gap is a missing record, never a statement about the plant.</p>
    <div>
    <dl class="pi-stat">
      <div><dd>${st.attribute_cells}<small> / ${cells}</small></dd><dt>fields recorded across ${st.species} species and ${d.facets.length} kinds of attribute</dt></div>
      <div><dd>${st.cells_not_recorded}</dd><dt>fields with no claim at all</dt></div>
      <div><dd>${st.cells_with_disagreement}</dd><dt>fields where sources disagree, both kept</dt></div>
      <div><dd>${st.claims_by_status.verified || 0}<small> / ${st.claims}</small></dd><dt>claims verified by a person (${pct(st.claims_by_status.verified || 0, st.claims)} %)</dt></div>
    </dl>
    <h3 class="pi-h3">Coverage by species</h3>
    <ul class="pi-bars">${perSpecies.map(x => `<li><a href="${esc(PI.links.profile(x.s.id))}"><i>${esc(x.s.scientific_name)}</i></a><span class="bar" title="${x.rec} of ${d.facets.length} fields recorded, ${x.dis} with disagreement"><i style="width:${pct(x.rec - x.dis, d.facets.length)}%"></i><i class="b2" style="width:${pct(x.dis, d.facets.length)}%"></i></span><span class="n">${x.rec} / ${d.facets.length}</span></li>`).join('')}</ul>
    <p class="pi-key"><span><i></i>recorded</span><span><i class="b2"></i>recorded, sources disagree</span><span><i class="b0"></i>not recorded</span></p>
    <h3 class="pi-h3">Least recorded attributes</h3>
    <ul class="pi-list">${thin.map(f => `<li><b>${esc(f.label)}</b> recorded for ${f.n_species} of ${st.species} species. ${esc(f.definition || '')}</li>`).join('')}</ul>
    <h3 class="pi-h3">Plant-to-function links</h3>
    <p>Of ${st.function_links} possible links between a species and a spatial function, ${st.links_by_status.derived || 0} are ${tag('derived')} from a use a source records, ${st.links_by_status.candidate || 0} are ${tag('candidate')} links inferred from traits, and ${st.links_by_status.unknown || 0} are ${tag('unknown')}: ${st.unknown_by_verdict['contradicted by traits'] || 0} contradicted by recorded traits, ${st.unknown_by_verdict['evidence missing'] || 0} with evidence missing.</p>
    <ul class="pi-list">
      <li><b>Candidate links, waiting for a source</b> ${cand.map(lk).join(' · ')}. Inferred by rule KG-R4 from recorded traits; none is promoted until a source states the use.</li>
      ${conf.length ? `<li><b>In conflict</b> ${conf.map(lk).join(' · ')}. A source records the use and a recorded trait contradicts it. Both are kept and shown.</li>` : ''}
      ${noev.length ? `<li><b>Evidence missing</b> ${noev.map(lk).join(' · ')}. Nothing recorded contradicts these; nothing supports them either.</li>` : ''}
      ${st.relations_with_missing_claims?.length ? `<li><b>Open correction</b> ${st.relations_with_missing_claims.length} plant-to-plant record cites a claim that is not in the database. It is flagged in the release and listed for correction in the canonical file.</li>` : ''}
    </ul>
    <h3 class="pi-h3">Checks on the claims</h3>
    <p>${tag('verified')} ${st.claims_by_status.verified || 0} · ${tag('unverified')} ${st.claims_by_status.unverified || 0}. Separately, an assistant read every source against its claim: ${tag('supported_by_source', 'supported by source')} ${chk.supported_by_source || 0} · ${tag('partially_supported', 'partially supported')} ${chk.partially_supported || 0} · ${tag('conflicting_evidence', 'conflicting evidence')} ${chk.conflicting_evidence || 0} · ${tag('not_assessed', 'not assessed')} ${chk.not_assessed || 0}. That reading is an AI assessment for reviewers to start from. It does not verify anything.</p>
    <p>Browse all of it in the <a href="${PI.links.explorer()}">Knowledge Explorer</a>: the matrix shows every link and every gap, the table every field.</p>
    </div></section>

  <section class="pi-sec" id="release"><h2>Curated releases</h2><p class="pi-sec-l">The database is versioned, not live.</p>
    <div><p>The canonical records are plain files in the project repository: one file of claims per species, the ontology, the plant-to-plant records and the list of sources with their licence terms. A pipeline builds the knowledge graph and the projections the interfaces read; a release is the commit that publishes them.</p>
    <p>This release is dated <b>${esc(d.generated)}</b> (schema ${esc(d.schema_version)}, ontology ${esc(d.ontology_version)}). The Garden Studio records the release a design was made with, so a planting can always be traced to the knowledge it used.</p>
    <p><a href="${PI.links.how()}">How the whole platform works</a> · <a href="${PI.REPO_URL}" rel="noopener">Repository, methods and data</a></p></div></section>
  </div>`;
}
