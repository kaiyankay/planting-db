// Knowledge · Method — who or what decides at each step, in one place: the eight kinds of statement the platform keeps apart, what
// is AI here and what is not, the written rules (read from the snapshot and from the Studio's engine), and the limits.
// The counts are read from the published snapshot; the rule tables are the engine's own exported constants.
import * as PI from './platform.js';
import { tag } from './plantcard.js';
import * as T from './trace.js';

const $ = s => document.querySelector(s); const esc = PI.esc;

(async function boot() {
  try {
    const [d, eng] = await Promise.all([PI.loadSnapshot(), T.loadEngine().catch(() => null)]);
    PI.mountTop($('#top'), { active: 'knowledge', section: 'method', snapshot: d }); $('#foot').innerHTML = PI.footHtml(d);
    $('#app').innerHTML = html(d, eng?.E || null);
    if (location.hash.length > 1) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch (e) { $('#app').innerHTML = `<p class="pi-loading">Could not load the knowledge snapshot: ${esc(e.message)}</p>`; console.error(e); }
})();

function html(d, E) {
  const st = d.stats; const L = PI.links; const chk = st.claims_by_check;
  const example = {
    source: 'A line on a plant database page; a sentence in a survey response.', claim: `One of the ${st.claims} claims, each with its own id.`, verification: `${st.claims_by_status.verified || 0} of ${st.claims} claims are verified so far.`,
    ai: `${chk.supported_by_source || 0} supported, ${chk.partially_supported || 0} partially, ${chk.conflicting_evidence || 0} conflicting, ${chk.not_assessed || 0} not assessed.`, rule: `${st.links_by_status.derived || 0} function links derived from a recorded use, ${st.links_by_status.candidate || 0} inferred from traits.`,
    site: 'An outline and its size; light, water and soil; what a bed is for.', engine: 'Which species pass a bed’s checks, each with its reason; where every plant stands.', evaluation: 'Met, uncertain or not met, with the reason and the stretch it concerns.',
  };
  const kinds = Object.entries(T.KIND).map(([k, v]) => `<div class="pi-led"><dt>${esc(v.label)}</dt><dd><p>${esc(v.says)}</p><p class="pi-led-n">${esc(example[k])}</p></dd><dd class="pi-led-p">${T.who(v.who)}</dd></div>`).join('');
  const kg = Object.entries(d.rules).map(([id, text]) => `<tr><td><b>${esc(id)}</b></td><td>${esc(text)}</td></tr>`).join('');
  const R = E?.ARRANGEMENT_RULES || {}; const order = { claim: 0, geometry: 1, heuristic: 2 };
  const eng = Object.entries(R).sort((a, b) => order[a[1].source] - order[b[1].source]).map(([k, r]) => `<tr><td>${esc(k.replace(/_/g, ' '))}</td><td>${r.value} ${esc(r.unit)}</td><td>${T.res(r.source)}</td></tr>`).join('');
  const nH = Object.values(R).filter(r => r.source === 'heuristic').length;
  const sup = E?.FUNCTION_SUPPORT || {}; const arranged = d.functions.filter(f => sup[f.id]?.arranged).map(f => f.label), recorded = d.functions.filter(f => !sup[f.id]?.arranged).map(f => f.label);
  return `<div class="pi-doc">
  <header class="pi-mast">
    <div><h1>Who or what <em>decides</em></h1>
      <p class="pi-lede">One versioned body of plant knowledge, read by every tool on this platform. At each step from a source to a planted bed, something different decides: a source, a person, a written rule, an AI assessment, the planting engine, or you.</p></div>
    <p class="pi-prov"><b>${esc(PI.snapshotLine(d))}</b><br>${T.who('source')} ${T.who('record')} ${T.who('person')} ${T.who('ai')}<br>${T.who('rule')} ${T.who('you')} ${T.who('estimate')}</p>
  </header>
  <nav class="pi-toc" aria-label="Sections"><a href="#kinds">Eight kinds of statement</a><a href="#ai">What is AI, and what is not</a><a href="#rules">The rules</a><a href="#limits">Limits</a><a href="#reference">Reference</a></nav>

  <section class="pi-sec" id="kinds"><h2>Eight kinds of statement</h2><p class="pi-sec-l">Kept apart on every page, in this order, with these words.</p>
    <div><dl class="pi-ledger" style="margin-top:0">${kinds}</dl>
    <p class="kn-go"><a href="${L.knowledge()}">See all eight on one real decision</a></p></div></section>

  <section class="pi-sec" id="ai"><h2>What is AI here, and what is not</h2><p class="pi-sec-l">The word is used only where a model did the work.</p>
    <ul class="pi-list">
      <li>${T.who('ai')} <b>The source assessment.</b> An AI assistant read each source against its claim and recorded whether the source supports it. The result sits beside every claim as an assessment. It never changes a claim’s status and is never called verification.</li>
      <li><span class="pi-who ai">AI, not in this build</span> <b>Reading your description.</b> The Studio can use a language model to read a site description when one is connected. None is connected to this public preview: it says “offline rules” and means it.</li>
      <li>${T.who('rule')} <b>Everything that places or judges a plant.</b> The knowledge-graph rules, the site gates, the bed proposal, the planting engine and the evaluation are deterministic and written down. The same input gives the same garden.</li>
      <li>${T.who('record')} <b>Every fact about a plant.</b> Names, sizes, requirements, functions and sources are retrieved from the claims. Where a size is needed for drawing, one claimed range is chosen by a stated rule and labelled a proxy.</li>
      <li>${T.who('person')} <b>Verification.</b> Only a reviewer who opened the source can mark a claim verified.</li>
      <li>${T.who('you')} <b>The design.</b> The outline, the beds, the function of each bed, the species you want considered and the arrangement you keep are your decisions. A species you ask for is still checked; one that fails is not planted.</li>
      <li><span class="pi-who">illustration</span> <b>The plant illustrations.</b> The Plant Library’s illustrations are AI-generated editorial artwork. They are not botanical plates and not evidence; no fact is read from them.</li>
    </ul></section>

  <section class="pi-sec" id="rules"><h2>The rules</h2><p class="pi-sec-l">Everything between a claim and a planted row is written down.</p>
    <div><p>A species is linked to a spatial function in one of two ways: a source records a use the ontology maps to the function (${tag('derived')}), or every trait the function requires is met by recorded claims (${tag('candidate')}, never promoted). Anything else is ${tag('unknown')} and is listed as a gap, not drawn.</p>
    <details class="pi-more-d" open><summary>Knowledge-graph rules in this release</summary><table class="pi-table"><tbody>${kg}</tbody></table></details>
    ${eng ? `<p style="margin-top:22px">The planting engine arranges ${esc(arranged.join(' and '))}. ${esc(recorded.join(', '))} are recorded and explorable but have no arrangement rule yet. Of the ${Object.keys(R).length} numbers the engine uses, ${nH} are heuristics: chosen by the implementer, backed by no source, and named wherever they decide something.</p>
    <details class="pi-more-d"><summary>Every number the planting engine uses</summary><table class="pi-table"><thead><tr><th>Rule</th><th>Value</th><th>From</th></tr></thead><tbody>${eng}</tbody></table></details>` : ''}</div></section>

  <section class="pi-sec" id="limits"><h2>Limits</h2><p class="pi-sec-l">What this research prototype does not do.</p>
    <ul class="pi-list">
      <li><b>${st.species} species.</b> Enough to test the method, not to design a real planting. A bed often has a single species that qualifies for its function.</li>
      <li><b>Most claims are unverified.</b> ${st.claims_by_status.unverified || 0} of ${st.claims} have not been checked by a person yet. Unverified is not wrong; it is unchecked.</li>
      <li><b>Sizes are proxies.</b> Crowns and heights are drawn from claimed mature ranges. Quantities are counts on a model, not a procurement list.</li>
      <li><b>A recorded trait is not a performance.</b> A claimed mature height does not prove a privacy screen in a particular garden; shared growing conditions do not prove two plants are companions.</li>
      <li><b>No performance scores.</b> Nothing here measures biodiversity, pollinator value, cost or long-term success.</li>
      <li><b>Not a live AI system.</b> The public preview reads a description with offline rules.</li>
    </ul></section>

  <section class="pi-sec" id="reference"><h2>A reference we studied</h2><p class="pi-sec-l">And what we did not take from it.</p>
    <div><p>The way this platform joins a curated plant list, a generative arrangement and plant details was studied from <a href="https://pollinator.art/about/how-it-works" rel="noopener">Pollinator Pathmaker</a>: a palette curated by people feeds an algorithm, the visitor makes a few choices, and the generated garden leads back to each plant. None of its artwork, text, code or algorithm is used here, and this project makes no claim about pollinators.</p>
    <p class="kn-go"><a href="${L.research()}">Research and contribution</a><a href="${PI.REPO_URL}" rel="noopener">Repository, methods and data</a></p></div></section>
  </div>`;
}
