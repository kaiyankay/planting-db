// Evidence-to-design trace (Platform V2, 2026-11-14). The Knowledge overview follows ONE species through the knowledge base into ONE
// planting bed. This module prepares that case and draws it. Nothing here is written by hand about a plant or a design:
//
//   knowledge   the published snapshot (brain/data/explorer.json): sources, claims, AI source checks, function links, pairs
//   the bed     a project the Garden Studio saved — the recorded demonstration garden (designs/demo-a.json) or the visitor's own
//               design from this browser — read only, cloned before use
//   the engine  the Studio's own modules (design/js/knowledge.js, engine.js), imported and run here: `assemble` re-checks every
//               species for the bed against the current snapshot, `evaluateScreen` re-measures the planted row
//
// Eight kinds of statement are kept apart on the page; KIND names them once so every surface uses the same words.
import * as PI from './platform.js';

const esc = PI.esc;
export const FN = PI.TRACE_FUNCTION;

export const KIND = {
  source: { label: 'Source statement', who: 'source', says: 'What a named source says, in its own words. Shown as a short excerpt with its place on the page; a survey response stays in the survey’s protected database.' },
  claim: { label: 'Structured claim', who: 'record', says: 'The statement as the database stores it: one plant, one field, one value, with source, place, conditions and confidence. Written in the project’s own words.' },
  verification: { label: 'Human verification', who: 'person', says: 'Whether a reviewer opened the source and confirmed the claim. Only a person can mark a claim verified. Unverified means unchecked, not wrong.' },
  ai: { label: 'AI source assessment', who: 'ai', says: 'An AI assistant read the source against the claim and recorded whether the source supports it. An aid for reviewers. It never changes a claim and is never called verification.' },
  rule: { label: 'Rule-derived relationship', who: 'rule', says: 'A link the knowledge graph draws by a written rule over the claims, such as a recorded use that maps to a spatial function. It carries the standing of the claims under it.' },
  site: { label: 'Your site information', who: 'you', says: 'What the designer states or draws: the outline, the beds, light, water, soil, what a bed is for. Anything not stated stays unknown; it is not assumed.' },
  engine: { label: 'Engine output', who: 'rule', says: 'What the planting engine computes for a bed: which species pass its checks, where the plants stand. A deterministic algorithm with stated spacing rules and a seed.' },
  evaluation: { label: 'Evaluation', who: 'estimate', says: 'The engine’s measurement of its own result on the model, from claimed sizes: met, uncertain, not met, or an estimate. Never a measured or verified performance.' },
};
const WHO = { source: 'named source', record: 'from records', person: 'person', ai: 'AI-assessed', rule: 'rule-based', you: 'you', estimate: 'estimate' };
export const who = k => `<span class="pi-who ${k}">${WHO[k]}</span>`;
/** one row of the ledger: the kind of statement · the statement · where it comes from */
export const row = (kind, body, prov = '') => `<div class="pi-led" data-kind="${kind}"><dt>${KIND[kind].label}</dt><dd>${body}</dd><dd class="pi-led-p">${who(KIND[kind].who)}${prov}</dd></div>`;
export const res = r => `<span class="pi-res ${esc(String(r).replace(/\s+/g, '_'))}">${esc(r)}</span>`;

// ---------------------------------------------------------------- the engine, borrowed from the Studio
let engineP = null;
export function loadEngine() {
  const mod = f => import(new URL(`js/${f}`, PI.routes.design).href);
  return engineP || (engineP = Promise.all([mod('knowledge.js'), mod('engine.js'), mod('geom.js')]).then(([KM, E, G]) => ({ Knowledge: KM.Knowledge, E, G })));
}

// ---------------------------------------------------------------- the case: one bed of one saved project
const clone = x => JSON.parse(JSON.stringify(x));
const liveBeds = p => (p?.site?.beds || []).filter(b => b.status !== 'rejected' && Array.isArray(b.polygon));
/** the beds of a project for which the traced function is wanted, as the engine itself reads it */
export function tracedBeds(project, K, E) {
  const out = []; for (const b of liveBeds(project)) { try { if (E.assemble(project, K, b).wanted.includes(FN)) out.push(b); } catch { /* a bed the engine cannot read is not a case */ } } return out;
}
/** everything the page says about the bed, computed now. `origin`: 'reference' (the recorded demonstration) | 'mine' (this browser's design).
 *  A design that was never generated has no version: the engine's dry run stands in for it (`dry`), the same computation Compose
 *  previews — every active bed, the Studio's default seed, nothing stored. */
export const DRY_SEED = 42;
export function buildCase(saved, K, E, bedId, origin) {
  const project = clone(saved); const beds = tracedBeds(project, K, E); const bed = beds.find(b => b.id === bedId) || beds[0]; if (!bed) return null;
  const asm = E.assemble(project, K, bed); let version = (project.versions || []).find(v => v.id === project.current_version_id) || null; let dry = false;
  if (!version) { try { version = E.generate(project, K, liveBeds(project).map(b => b.id), DRY_SEED, { id_start: 0 }); dry = true; } catch { version = null; } }
  const zone = version ? (version.zones || []).find(z => z.kind === 'edge' && z.bed_id === bed.id && z.function === FN) || null : null;
  const plants = version ? version.plant_objects.filter(p => p.bed_id === bed.id) : []; const row = plants.filter(p => zone && p.zone_id === zone.id && /^screen/.test(p.role));
  const recorded = version?.evaluation?.edge_zones?.find(e => e.zone === zone?.id) || null; let live = null;
  if (zone) { try { live = E.evaluateScreen(zone, version.plant_objects, K, project); } catch { live = null; } }
  const same = !!(recorded && live && recorded.status === live.status && recorded.covered_m === live.covered_m && JSON.stringify(recorded.checks) === JSON.stringify(live.checks));
  const said = (project.conversation || []).find(m => m.role === 'user' && m.text)?.text || null;
  return { origin, project, bed, beds, asm, version, dry, zone, plants, row, recorded, live, same, evaluation: live || recorded, said, plan: zone?.row_plans?.[0] || null, lead: zone?.row_plans?.[0]?.lead?.species_id || asm.picks.screen[0]?.id || null };
}

// ---------------------------------------------------------------- drawings (the site drawing's conventions, DESIGN.md)
const r2 = n => Math.round(n * 100) / 100;
/** the site in plan: outline, beds, the open area, existing trees, the screen row with its mature crowns, the screened edge and its gaps */
export function planSvg(c, { species = null } = {}) {
  const p = c.project; const B = p.site.boundary; if (!B) return '';
  const xs = B.map(q => q[0]), ys = B.map(q => q[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); const m = 0.55;
  const X = x => r2(x - x0 + m), Y = y => r2(y1 - y + m); const pts = poly => poly.map(q => `${X(q[0])},${Y(q[1])}`).join(' ');
  let h = `<polygon class="pl-site" points="${pts(B)}"/>`;
  for (const f of p.site.features || []) if (f.kind === 'no-plant-zone' && f.polygon) h += `<polygon class="pl-open" points="${pts(f.polygon)}"/>`;
  for (const b of liveBeds(p)) h += `<polygon class="pl-bed${b.id === c.bed.id ? ' on' : ''}" points="${pts(b.polygon)}"/>`;
  for (const f of p.site.features || []) if (f.kind === 'existing-tree' && f.position_m) h += `<circle class="pl-tree" cx="${X(f.position_m[0])}" cy="${Y(f.position_m[1])}" r="${f.radius_m ?? 1.5}"/><circle class="pl-trunk" cx="${X(f.position_m[0])}" cy="${Y(f.position_m[1])}" r=".09"/>`;
  for (const o of c.plants) if (!/^screen/.test(o.role)) h += `<circle class="pl-ground" cx="${X(o.position_m[0])}" cy="${Y(o.position_m[1])}" r="${o.proxy_radius_m}"/>`;
  for (const o of c.row) h += `<circle class="pl-crown${species && o.species_id !== species ? ' other' : ''}" cx="${X(o.position_m[0])}" cy="${Y(o.position_m[1])}" r="${o.proxy_radius_m}"/><circle class="pl-stem" cx="${X(o.position_m[0])}" cy="${Y(o.position_m[1])}" r=".05"/>`;
  if (c.zone) for (const [i, e] of c.zone.edges.entries()) {
    const len = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) || 1; const at = t => [e.a[0] + (e.b[0] - e.a[0]) * t / len, e.a[1] + (e.b[1] - e.a[1]) * t / len];
    h += `<line class="pl-edge" x1="${X(e.a[0])}" y1="${Y(e.a[1])}" x2="${X(e.b[0])}" y2="${Y(e.b[1])}"/>`;
    for (const g of (c.evaluation?.gaps || []).filter(g => g.edge === i)) { const a = at(g.from_m), b = at(g.to_m); h += `<line class="pl-gap-u" x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}"/><line class="pl-gap" x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}"/>`; }
  }
  const W = r2(x1 - x0 + 2 * m), H = r2(y1 - y0 + 2 * m);
  h += `<g class="pl-dim"><line x1="${X(x0)}" y1="${r2(H - .2)}" x2="${X(x1)}" y2="${r2(H - .2)}"/><text x="${r2(W / 2)}" y="${r2(H - .02)}" text-anchor="middle">${r2(x1 - x0)} m</text><text x="${r2(W - .12)}" y=".3" text-anchor="end">N ↑</text></g>`;
  return `<svg class="kn-plan" viewBox="0 0 ${W} ${H}" role="img" aria-label="Plan of the ${r2(x1 - x0)} by ${r2(y1 - y0)} metre site: ${esc(c.bed.name)} with ${c.row.length} screen plants along the screened edge${c.evaluation?.gaps?.length ? `, ${c.evaluation.gaps.length} gap${c.evaluation.gaps.length === 1 ? '' : 's'} marked` : ''}">${h}</svg>`;
}
/** the screened edge unrolled: every expected position, the mature crowns that cover it, and the uncovered stretches */
export function edgeStrip(c) {
  const z = c.zone, pl = c.plan, ev = c.evaluation; if (!z || !pl || !ev) return ''; const e = z.edges[pl.edge ?? 0]; const L = pl.edge_length_m; const len = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) || 1;
  const u = [(e.b[0] - e.a[0]) / len, (e.b[1] - e.a[1]) / len]; const tOf = o => (o.position_m[0] - e.a[0]) * u[0] + (o.position_m[1] - e.a[1]) * u[1];
  const placed = c.row.map(o => ({ t: tOf(o), r: o.proxy_radius_m })); const near = t => placed.some(q => Math.abs(q.t - t) < 0.06);
  const k = 100; const W = L * k, pad = 14;
  let h = `<line class="es-edge" x1="0" y1="52" x2="${W}" y2="52"/>`;
  for (const g of ev.gaps || []) h += `<line class="es-gap-u" x1="${g.from_m * k}" y1="52" x2="${g.to_m * k}" y2="52"/><line class="es-gap" x1="${g.from_m * k}" y1="52" x2="${g.to_m * k}" y2="52"/><text class="es-gt" x="${(g.from_m + g.to_m) / 2 * k}" y="74" text-anchor="middle">${g.length_m} m not covered</text>`;
  for (const t of pl.row1_t || []) if (!near(t)) h += `<circle class="es-miss" cx="${t * k}" cy="30" r="5"/>`;
  for (const q of placed) h += `<circle class="es-crown" cx="${q.t * k}" cy="30" r="${q.r * k}"/><circle class="es-stem" cx="${q.t * k}" cy="30" r="3"/>`;
  h += `<text class="es-t" x="0" y="74">0</text><text class="es-t" x="${W}" y="74" text-anchor="end">${L} m</text>`;
  return `<svg class="kn-strip" viewBox="${-pad} ${-pad - 6} ${W + 2 * pad} ${98 + pad}" role="img" aria-label="The screened edge, ${L} metres: ${placed.length} plants placed of ${pl.expected?.[0] ?? '?'} positions; ${ev.covered_m} metres covered by mature crowns">${h}</svg>`;
}

// ---------------------------------------------------------------- small readers over the snapshot
export const human = s => String(s ?? '').replace(/_/g, ' ');
export const AI_WORD = { supported_by_source: 'supported by source', partially_supported: 'partially supported', conflicting_evidence: 'conflicting evidence', not_assessed: 'not assessed' };
export const SOURCE_TYPE = { database: 'published plant database', municipal: 'municipal open data', practitioner: 'practitioner survey response', model: 'model placeholder, never evidence' };
export const isSurvey = (d, sid) => d.sources[sid]?.type === 'practitioner';
export const sourceName = (d, sid) => { const s = d.sources[sid]; if (!s) return sid; return s.type === 'practitioner' ? `Practitioner survey, ${sid.replace('survey-r', 'respondent ')}` : s.label.split(' — ')[0]; };
export const sourceLink = (d, sid) => { const s = d.sources[sid]; return s?.url && s.type !== 'practitioner' ? `<a href="${esc(s.url)}" rel="noopener">${esc(sourceName(d, sid))}</a>` : esc(sourceName(d, sid)); };
/** concept labels of a claim's value, read from the snapshot's concept index (an id without a concept keeps its own wording) */
export function valueLabels(d, c) { const CO = new Map(d.concepts.map(x => [x.id, x.label])); const v = Array.isArray(c.value) ? c.value : [c.value]; return v.map(x => typeof x === 'string' ? CO.get(x) || human(x.split(':').pop()) : JSON.stringify(x)); }
