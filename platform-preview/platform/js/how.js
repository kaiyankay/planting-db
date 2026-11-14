// How it works — the platform's method on one page: the path from a source to a planted bed, and at each step whether the
// work is done by a person, by recorded rules, by retrieval from the records, by an AI assessment, or by the user.
// The counts are read from the published snapshot; the steps describe the systems as they are in this build.
import * as PI from './platform.js';

const $ = s => document.querySelector(s); const esc = PI.esc;
const who = (cls, t) => `<span class="pi-who ${cls}">${t}</span>`;

(async function boot() {
  try {
    const d = await PI.loadSnapshot(); PI.mountTop($('#top'), { active: 'how', snapshot: d }); $('#foot').innerHTML = PI.footHtml(d);
    $('#app').innerHTML = html(d);
  } catch (e) { $('#app').innerHTML = `<p class="pi-loading">Could not load the knowledge snapshot: ${esc(e.message)}</p>`; console.error(e); }
})();

function html(d) {
  const st = d.stats; const L = PI.links; const salal = d.species.find(s => s.slug === 'gaultheria-shallon') || d.species[0];
  return `<div class="pi-doc">
  <header class="pi-mast">
    <div><h1>How it <em>works</em></h1>
      <p class="pi-lede">One versioned body of plant knowledge, read by four tools. This page follows a fact from its source to a plant in a bed, and says at every step who or what decides.</p></div>
    <p class="pi-prov"><b>${esc(PI.snapshotLine(d))}</b><br>${who('person', 'person')} ${who('rule', 'rule-based')} ${who('record', 'from records')} ${who('ai', 'AI-assessed')} ${who('you', 'you')}</p>
  </header>

  <section class="pi-sec" id="path"><h2>From a source to a planted bed</h2><p class="pi-sec-l">Eight steps. The first four build the knowledge; the last four use it.</p>
    <ol class="pi-steps">
      <li><b>Sources and survey</b><span>Published plant databases, municipal tree data, community observations and an anonymous practitioner survey. ${st.sources} sources are cited in this release.</span><span>${who('person', 'person')}</span></li>
      <li><b>Intake and review</b><span>Each statement becomes a claim with its source, context and stated conditions. A reviewer verifies it against the source. An assistant's reading of the source is recorded beside it as an aid. <a href="${L.contribute()}#path">Contribute</a></span><span>${who('person', 'person')} ${who('ai', 'AI-assessed')}</span></li>
      <li><b>Versioned database and knowledge graph</b><span>${st.claims} claims about ${st.species} species. Recorded rules derive growth forms, height bands and the links between plants and five spatial functions. Conflicting claims are all kept. <a href="${L.explorer()}">Explorer</a></span><span>${who('rule', 'rule-based')}</span></li>
      <li><b>Knowledge access</b><span>One snapshot file is published per release. The Library, the Explorer, the Neural view and the Studio read that same file, so they cannot disagree about a plant. <a href="${L.library()}">Plants</a></span><span>${who('record', 'from records')}</span></li>
      <li><b>Site and intent</b><span>You describe a site and what you want. In this public build your words are read by a listed set of offline rules, not by a language model. You confirm or redraw everything they propose. <a href="${L.design()}">Design</a></span><span>${who('rule', 'rule-based')} ${who('you', 'you')}</span></li>
      <li><b>Spatial functions and plant selection</b><span>You give each bed a function, such as Screen or Ground cover. Every species is checked against the bed's light, water and soil and against the function's requirements, using the recorded claims.</span><span>${who('you', 'you')} ${who('rule', 'rule-based')} ${who('record', 'from records')}</span></li>
      <li><b>Generative composition</b><span>A planting engine arranges the qualifying species: a row along a screened edge, drifts, rhythmic bands or patches over a bed. It is an algorithm with stated spacing rules and a seed. You choose among the arrangements it computes.</span><span>${who('rule', 'rule-based')} ${who('you', 'you')}</span></li>
      <li><b>Evaluation and evidence</b><span>The result is measured on the model: cover along an edge, ground under crowns, requirements met, uncertain or not met. Every placed plant opens the claims it rests on and its profile in the Library.</span><span>${who('rule', 'rule-based')} ${who('record', 'from records')}</span></li>
    </ol></section>

  <section class="pi-sec" id="ai"><h2>What is AI here, and what is not</h2><p class="pi-sec-l">The word is used only where a model actually did the work.</p>
    <ul class="pi-list">
      <li>${who('ai', 'AI-assessed')} <b>The source check.</b> An assistant read each source against its claim and recorded whether the source supports it. The result is shown on every claim as an assessment. It never changes a claim's status and is never called verification.</li>
      <li>${who('ai', 'AI, not in this build')} <b>Reading your description.</b> The Studio can use a language model to read a site description when one is connected. No model is connected to this public preview: it says “offline rules” and means it.</li>
      <li>${who('rule', 'rule-based')} <b>Everything that places or judges a plant.</b> The knowledge graph rules, the site gates, the bed proposal, the planting engine and the evaluation are deterministic and written down. The same input gives the same garden.</li>
      <li>${who('record', 'from records')} <b>Every fact about a plant.</b> Names, sizes, requirements, functions and sources are retrieved from the claims. Where a size is needed for drawing, one claimed range is chosen by a stated rule and labelled a proxy.</li>
      <li>${who('person', 'person')} <b>Verification.</b> Only a reviewer who opened the source can mark a claim verified. ${st.claims_by_status.verified || 0} of ${st.claims} are, so far.</li>
      <li>${who('you', 'you')} <b>The design.</b> The outline, the beds, the function of each bed, the species you want considered and the arrangement you keep are your decisions. A species you ask for is still checked; one that fails is not planted.</li>
    </ul></section>

  <section class="pi-sec" id="tools"><h2>Four ways in</h2><p class="pi-sec-l">The same plant has the same identity in all of them, so you can follow it across.</p>
    <ul class="pi-list">
      <li><b><a href="${L.design()}">Design</a></b> Imagine, Shape, Compose, Grow: from a description to a planted garden you can revise and export.</li>
      <li><b><a href="${L.library()}">Plants</a></b> The Plant Library: what is recorded about each species, what is unknown, and where it comes from. For example <a href="${L.profile(salal.id)}"><i>${esc(salal.scientific_name)}</i></a>.</li>
      <li><b><a href="${L.explorer()}">Explore</a></b> The relationship graph, the species by function matrix, the attribute table and the evidence behind every line, with a <a href="${L.neural()}">Neural view</a> of the same claims as one network.</li>
      <li><b><a href="${L.contribute()}">Contribute</a></b> The survey, the gaps and conflicts of the current release, and how a release is made.</li>
    </ul></section>

  <section class="pi-sec" id="limits"><h2>Limits to keep in mind</h2><p class="pi-sec-l">What this research prototype does not do.</p>
    <ul class="pi-list">
      <li><b>${st.species} species.</b> Enough to test the method, not to design a real planting. A bed often has a single species that qualifies for its function.</li>
      <li><b>Most claims are unverified.</b> ${st.claims_by_status.unverified || 0} of ${st.claims} have not been checked by a person yet. Unverified is not wrong; it is unchecked.</li>
      <li><b>Sizes are proxies.</b> Crowns and heights are drawn from claimed mature ranges. Quantities are counts on a model, not a procurement list.</li>
      <li><b>Two functions are arranged.</b> The engine places Screen and Ground cover. Canopy, Scrim and Barrier are recorded and explorable but have no arrangement rule yet.</li>
      <li><b>No performance scores.</b> Nothing here measures biodiversity, pollinator value or long-term success.</li>
    </ul></section>

  <section class="pi-sec" id="reference"><h2>A reference we studied</h2><p class="pi-sec-l">And what we did not take from it.</p>
    <div><p>The way this platform joins a curated plant list, a generative arrangement and plant details was studied from <a href="https://pollinator.art/about/how-it-works" rel="noopener">Pollinator Pathmaker</a>: a palette curated by people feeds an algorithm, the visitor makes a few choices, and the generated garden leads back to each plant. None of its artwork, text, code or algorithm is used here, and this project makes no claim about pollinators.</p></div></section>
  </div>`;
}
