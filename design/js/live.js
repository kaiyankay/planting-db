// live.js — the page's connection to the language model on the design server (POST /api/interpret; tools/llm_interpret.py).
// The server returns a reading that has already passed its schema and its grounding rules. This module turns that reading into
// exactly the structures the offline rule parser (intent.js) returns, completes it with the same rules, and resolves plant and
// feature names against the workspace. Nothing here draws, places or chooses: the caller hands the result to the same
// applyDescription / bedEditPreview / edit preview the offline reading goes through.
// On a static host (GitHub Pages) there is no server: ask() answers "offline" and the page uses its rules.
import * as I from './intent.js';
import { sideRegion } from './geom.js';

/** what the person currently sees, in words — context for references such as "that bed"; never coordinates */
export function contextOf(project, K, ui = {}) {
  const s = project.site; const B = s.boundary ? { w: Math.max(...s.boundary.map(p => p[0])) - Math.min(...s.boundary.map(p => p[0])), h: Math.max(...s.boundary.map(p => p[1])) - Math.min(...s.boundary.map(p => p[1])) } : null;
  return {
    stage: ui.stage, has_design: !!ui.hasDesign, selected_bed: ui.bedName || null, selection_drawn: !!ui.selection,
    site: { size_m: B ? [+B.w.toFixed(2), +B.h.toFixed(2)] : null, scale: s.scale.status, features: s.features.map(f => ({ kind: f.kind === 'no-plant-zone' ? 'open space' : f.kind, label: f.label || null, status: f.status })), conditions: Object.fromEntries(Object.entries(s.conditions).filter(([, c]) => c.value).map(([k, c]) => [k, c.value])) },
    beds: s.beds.filter(b => b.status !== 'rejected').map(b => ({ name: b.name, status: b.status, area_m2: b.area_m2, functions: (b.functions || []).map(f => `${f.function}@${f.where}`) })),
    brief: { goals: project.brief.values, functions: project.brief.functions.map(f => `${f.function}@${f.where}${f.alternative ? ' (alternative)' : ''}`), constraints: project.brief.hard_constraints.map(c => c.text) },
    species_names: K.species.map(sp => [sp.scientific_name, ...(sp.common_names || []).slice(0, 2)].join(' / ')),   // names only, to recognise a plant the person mentions — no trait, no claim
  };
}

/** POST the words; any failure (no server, no model, a timeout, a rejected answer) is an offline answer with its reason */
export async function ask(text, context, { timeoutMs = 70000 } = {}) {
  const ac = new AbortController(); const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch('/api/interpret', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, context }), signal: ac.signal, cache: 'no-store' });
    if (!r.ok) return { mode: 'offline', reason: `the design server answered ${r.status}` };
    const j = await r.json(); if (!j || !j.mode) return { mode: 'offline', reason: 'the design server sent no reading' };
    if (j.mode !== 'offline' && !(j.result && j.validation?.schema === 'valid')) return { mode: 'offline', reason: 'the reading did not carry a passed validation' };
    return j;
  } catch (ex) { return { mode: 'offline', reason: ex.name === 'AbortError' ? 'the language model did not answer in time' : 'no design server reachable (static page)' }; }
  finally { clearTimeout(timer); }
}
export const provenanceOf = j => j.mode === 'mock' ? 'MOCK model (contract test — not a language model)' : `live model (${j.model})`;

/** a description → the object intent.js interpretDescription() returns, completed by the same rules */
export function description(j, text) {
  const d = j.result.description; const facts = d.facts.map(f => ({ ...f })), values = { ...d.values }, evidence = [...d.evidence], unknowns = [...d.unknowns]; const functions = d.functions.map(f => ({ ...f })); const byRule = [];
  for (const f of functions) if (f.function === 'z:screen' && !f.alternative && !values.privacy) { values.privacy = 2; byRule.push('goal “privacy” from the Screen that was read'); }
  if (values.privacy && !functions.some(f => f.function === 'z:screen' && !f.alternative)) { functions.push({ function: 'z:screen', where: I.EDGE_UNSET, basis: 'privacy → Screen (blocks a view); Scrim would only filter it', evidence: 'privacy' }); unknowns.push('which edge to screen — no side was named; choose the edge (north / south / east / west): nothing is screened until then'); byRule.push('Screen with its edge unset, from the privacy goal'); }
  const scr = functions.find(f => f.function === 'z:screen' && !f.alternative);
  for (const f of functions) if (f.function === 'z:scrim' && scr && !f.alternative) { f.alternative = true; byRule.push('Scrim kept as the alternative to check beside the Screen'); }
  if (scr && values.openness && !functions.some(f => f.function === 'z:scrim')) { functions.push({ function: 'z:scrim', where: scr.where, basis: 'openness + privacy → Scrim as the alternative to check', evidence: 'openness', alternative: true }); byRule.push('Scrim as the alternative to check (openness + privacy)'); }
  if (!functions.some(f => f.function === 'z:ground_cover')) { const g = I.groundCoverFromValues(values); if (g) { functions.push(g); byRule.push('Ground Cover inside the beds (design heuristic from the goals)'); } }
  const done = I.completeBrief(facts, values);
  const hard = [...done.hard, ...d.hard_notes.map((h, i) => ({ id: `stated-${i + 1}`, kind: 'stated', text: h.text, evidence: h.evidence }))];
  return { provenance: provenanceOf(j), facts, values, functions, hard_constraints: hard, composition: done.composition, unknowns: [...new Set([...unknowns, ...done.unknowns])], evidence, text, relations: d.relations, reading: j.result.reading, by_rule: byRule };
}

/** a bed edit → the object intent.js interpretBedEdit() returns (a typed request; the spatial engine computes the shape) */
export function bedEdit(j, text, ctx = {}) {
  const b = j.result.bed_edit; if (!b) return null; const req = { ...b.request, ...(b.request.target ? { target: { ...b.request.target } } : {}) }; const notes = [];
  if (req.target && !req.target.side && !req.target.tree && !req.target.name) { if (ctx.bedId) { req.target.bed_id = ctx.bedId; notes.push('no bed named — the selected bed is assumed'); } else notes.push('no bed named — the only bed, or the closest match, will be used'); }
  for (const p of b.preserve) notes.push(`to keep: ${p.value} (“${p.evidence}”) — the spatial engine keeps beds out of open space and other beds in any case`);
  return { kind: 'bed_edit_request', utterance: text, provenance: provenanceOf(j), request: req, evidence: b.evidence, notes, preserve: b.preserve, confidence: 'interpretation_candidate', requires_preview: true };
}

/** a planting edit → the object intent.js interpretEdit() returns; species and features are resolved here, against the workspace */
export function edit(j, text, ctx) {
  const e = j.result.edit; const ops = []; const notes = [];
  for (const o of e.operations) {
    if (o.type === 'reduce_density' || o.type === 'increase_density') ops.push({ type: o.type, amount: o.amount });
    else if (o.type === 'remove_species') { const sp = ctx.resolveSpecies(o.species_phrase); ops.push({ type: 'remove_species', species_id: sp?.id || null, phrase: o.species_phrase, resolved: !!sp }); }
    else if (o.type === 'swap_species') { const a = ctx.resolveSpecies(o.species_phrase), b = ctx.resolveSpecies(o.to_species_phrase); ops.push({ type: 'swap_species', from_species_id: a?.id || null, to_species_id: b?.id || null, phrase: `${o.species_phrase} → ${o.to_species_phrase}`, resolved: !!(a && b) }); if (!b) notes.push(`“${o.to_species_phrase}” is not one of the species in the knowledge base — nothing is swapped in`); }
    else if (o.type === 'move_away') { const feat = ctx.resolveFeature(o.feature_phrase); ops.push({ type: 'move_away', filter: o.filter, feature_id: feat?.id || null, phrase: o.feature_phrase, resolved: !!feat }); }
    else if (o.type === 'fill_with_tall') ops.push({ type: 'fill_with_tall', phrase: o.evidence });
  }
  const preserve = [...e.preserve, { type: 'locked_objects', value: 'existing-tree', evidence: 'always' }];
  let scope;
  if (e.scope.kind === 'selection' && ctx.selection) scope = { kind: 'selection', selection_id: ctx.selection.id, polygon: ctx.selection.polygon, basis: 'the drawn selection' };
  else if (e.scope.kind === 'direction' && e.scope.side) scope = { kind: 'direction', side: e.scope.side, polygon: ctx.bedPolygon ? sideRegion(ctx.bedPolygon, e.scope.side, 1 / 3) : null, basis: `the ${e.scope.side} side, read relative to the plan as drawn (north up); the region is the outer third of the bed on that side` };
  else scope = { kind: 'bed', bed_id: ctx.bedId, polygon: ctx.bedPolygon, basis: ctx.selection ? 'a drawn selection is active, but the words name the whole bed' : 'no selection and no direction word — the whole current bed is assumed; draw a selection to narrow it' };
  const conflicts = []; if (ops.some(o => o.type === 'fill_with_tall') && (preserve.some(p => p.type === 'no_plant_zone') || ctx.hasOpenZone)) conflicts.push('filling the open zone with tall plants contradicts the open-space constraint; no change is made without an explicit override');
  if (ops.some(o => o.type === 'reduce_density') && ops.some(o => o.type === 'increase_density')) conflicts.push('both reduce and increase density were read — ambiguous');
  return { kind: 'spatial_edit_request', utterance: text, provenance: provenanceOf(j), scope, operations: ops, preserve, evidence: e.operations.map(o => ({ rule: `live:${o.type}`, text: o.evidence })), notes, conflicts, confidence: ops.length ? 'interpretation_candidate' : 'no_operation_recognised', requires_preview: true };
}

/** the validation record of one reading, as the short list shown under the reply */
export function recordHtml(j, esc) {
  const v = j.validation; if (!v?.rows) return '';
  const row = r => `<li class="vr ${esc(r.result)}"><b>${esc(r.result)}</b> ${esc(r.item)} <span class="faint">— ${esc(r.check)}${r.detail ? `: ${esc(r.detail)}` : ''}</span></li>`;
  return `<details class="vrec"><summary>Checked before use: ${v.accepted} accepted${v.changed ? ` · ${v.changed} changed` : ''}${v.dropped ? ` · ${v.dropped} dropped` : ''}</summary><ul>${v.rows.map(row).join('')}</ul><p class="faint">Schema ${esc(v.schema)}. The model reads language only: geometry is computed by the spatial engine, plants are chosen by the planting engine from the knowledge base.</p></details>`;
}
