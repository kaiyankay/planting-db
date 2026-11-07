// Planting Intelligence · Plant Knowledge Explorer (brief 2026-11-07, Phase 1).  One workspace, one selection state, four views:
// Relationship graph · Spatial function matrix · Attribute table · Inspector (evidence trace, A/B comparison).  Every view reads the
// same projection (brain/data/explorer.json, tools/build_explorer.py) and the same state S; a click anywhere changes S and every
// view re-renders from it.  Nothing about the plants is written here.  The state lives in the URL hash, so a view can be shared.
import { load } from './model.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const human = s => String(s ?? '').replace(/_/g, ' ');
const S = { M: null, focus: null, a: null, b: null, inspect: null, tab: 'evidence', q: '', sort: null, groups: new Set(), view: { x: 0, y: 0, k: 1 }, layout: null, layoutKey: '' };

// ------------------------------------------------------------------ boot
(async function boot() {
  try {
    const url = new URLSearchParams(location.search).get('data') || '../data/explorer.json';
    S.M = await load(url);
    S.groups = new Set(S.M.groups.map(g => g.id));
    readHash(); initUi(); update();
    window.addEventListener('hashchange', () => { readHash(); update(); });
    window.explorer = { S, M: S.M, update, setFocus, setInspect, setAB, act, renderTable, graphFor: () => S.M.graphFor(S.focus, S.a, S.b) };   // for tests and the console
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
  S.tab = p.get('tab') === 'compare' ? 'compare' : 'evidence';
}
function writeHash() {
  const p = new URLSearchParams();
  if (S.focus) { p.set('fk', S.focus.kind); if (S.focus.id) p.set('fi', S.focus.id); }
  if (S.a) p.set('a', S.a); if (S.b) p.set('b', S.b);
  if (S.inspect) { p.set('ik', S.inspect.kind); p.set('ii', S.inspect.id); }
  if (S.tab !== 'evidence') p.set('tab', S.tab);
  const h = '#' + p.toString(); if (location.hash !== h) history.replaceState(null, '', h);
}
function inspectable(kind, id) { const M = S.M; return kind === 'link' ? M.LK.has(id) : kind === 'attr' ? M.AT.has(id) : kind === 'concept_link' ? M.CL.has(id) : kind === 'relation' ? M.RE.has(id) : kind === 'species' ? M.SP.has(id) : kind === 'function' ? M.FN.has(id) : kind === 'concept' ? M.CO.has(id) : false; }
function setFocus(kind, id) { S.focus = kind ? { kind, id } : null; if (kind !== 'pair') S.inspect = null; S.tab = kind === 'pair' ? 'compare' : 'evidence'; update(); }
function setInspect(kind, id) { S.inspect = kind ? { kind, id } : null; S.tab = 'evidence'; update(); }
function setAB(which, id) { if (which === 'a') { if (S.b === id) S.b = S.a; S.a = S.a === id ? null : id; } else { if (S.a === id) S.a = S.b; S.b = S.b === id ? null : id; } if (S.focus?.kind === 'pair' && !(S.a && S.b)) S.focus = null; if (S.a && S.b) S.tab = 'compare'; update(); }
function update() { writeHash(); renderTop(); renderRail(); renderGraph(); renderMatrix(); renderTable(); renderInspector(); }

// ------------------------------------------------------------------ ui wiring
function initUi() {
  const M = S.M;
  document.body.addEventListener('click', ev => {
    const t = ev.target.closest('[data-focus],[data-inspect],[data-ab],[data-tab],[data-act]'); if (!t) return;
    if (t.dataset.focus !== undefined) { ev.preventDefault(); const [k, ...rest] = t.dataset.focus.split('='); setFocus(k === 'none' ? null : k, rest.join('=')); }
    else if (t.dataset.inspect !== undefined) { ev.preventDefault(); const [k, ...rest] = t.dataset.inspect.split('='); setInspect(k, rest.join('=')); }
    else if (t.dataset.ab) { ev.preventDefault(); ev.stopPropagation(); setAB(t.dataset.ab, t.dataset.id); }
    else if (t.dataset.tab) { S.tab = t.dataset.tab; update(); }
    else if (t.dataset.act) act(t.dataset.act, t.dataset.id);
  });
  $('#gfit').onclick = () => { S.view = { x: 0, y: 0, k: 1 }; renderGraph(); };
  $('#greset').onclick = () => setFocus(null);
  const inp = $('#search'), res = $('#results'); let hi = -1, cur = [];
  const show = () => { res.innerHTML = cur.map((n, i) => `<div class="${i === hi ? 'hi' : ''}" data-i="${i}"><span>${n.kind === 'species' ? `<i class="sci">${esc(n.label)}</i>` : esc(n.label)}${n.sub ? ` <span class="faint">· ${esc(n.sub)}</span>` : ''}</span><small>${esc(n.kind)}</small></div>`).join(''); res.classList.toggle('open', cur.length > 0); };
  const go = i => { const n = cur[i]; if (!n) return; inp.value = ''; cur = []; show(); setFocus(n.kind, n.id); };
  inp.addEventListener('input', () => { cur = M.search(inp.value); hi = cur.length ? 0 : -1; show(); });
  inp.addEventListener('keydown', ev => { if (ev.key === 'ArrowDown') { hi = Math.min(cur.length - 1, hi + 1); show(); ev.preventDefault(); } else if (ev.key === 'ArrowUp') { hi = Math.max(0, hi - 1); show(); ev.preventDefault(); } else if (ev.key === 'Enter') go(hi); else if (ev.key === 'Escape') { inp.value = ''; cur = []; show(); inp.blur(); } });
  inp.addEventListener('blur', () => setTimeout(() => { cur = []; show(); }, 150));
  res.addEventListener('mousedown', ev => { const d = ev.target.closest('[data-i]'); if (d) { ev.preventDefault(); go(+d.dataset.i); } });
  document.addEventListener('keydown', ev => { if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return; if (ev.key === '/') { inp.focus(); ev.preventDefault(); } if (ev.key === 'Escape') { if (S.inspect) setInspect(null); else if (S.focus) setFocus(null); } });
  initGraphInteraction();
}
function act(a, id) {
  if (a === 'swap') { [S.a, S.b] = [S.b, S.a]; update(); }
  else if (a === 'pair') { if (S.a && S.b) setFocus('pair'); }
  else if (a === 'pick-a' || a === 'pick-b') { const v = $(`#sel-${a.slice(-1)}`).value || null; if (a === 'pick-a') { if (v && v === S.b) S.b = S.a; S.a = v; } else { if (v && v === S.a) S.a = S.b; S.b = v; } if (S.focus?.kind === 'pair' && !(S.a && S.b)) S.focus = null; update(); }
  else if (a === 'clear-ab') { S.a = S.b = null; if (S.focus?.kind === 'pair') S.focus = null; update(); }
  else if (a === 'tq') { S.q = $('#tq').value; renderTable(); }
  else if (a === 'tg') { const g = id; if (S.groups.has(g)) S.groups.delete(g); else S.groups.add(g); renderTable(); }
  else if (a === 'tsort') { S.sort = S.sort === id ? null : id; renderTable(); }
}

// ------------------------------------------------------------------ top bar and rail
function renderTop() {
  const M = S.M;
  $('#fns').innerHTML = M.functions.map(f => `<button data-focus="function=${esc(f.id)}" class="${S.focus?.kind === 'function' && S.focus.id === f.id ? 'on' : ''}" title="${esc(f.definition)}"><b>${esc(f.label)}</b><small>${f.n_linked}·${f.n_unknown}?</small></button>`).join('');
  const st = M.stats;
  $('#stats').innerHTML = `${st.species} species · ${st.functions} functions · ${st.function_links} link cells (${st.links_drawn} linked · ${st.links_by_status.unknown || 0} unknown) · ${st.attribute_cells} attribute cells<br>${st.relations_live}/${st.relations} relations live · ${st.claims} claims (${st.claims_by_status.verified || 0} verified) · projection ${esc(M.d.generated)} · M49`;
}
function renderRail() {
  const M = S.M; let h = '';
  h += `<div class="row ${!S.focus ? 'on' : ''}" data-focus="none"><i class="dot" style="background:var(--ink-3)"></i>Overview <span class="n">all</span></div>`;
  h += `<h3>Spatial functions · Z</h3>` + M.functions.map(f => `<div class="row fn ${S.focus?.kind === 'function' && S.focus.id === f.id ? 'on' : ''}" data-focus="function=${esc(f.id)}"><i class="dot"></i>${esc(f.label)}<span class="n" title="linked (derived + candidate) · unknown">${f.n_linked} · ${f.n_unknown}?</span></div>`).join('');
  h += `<h3>Species · X</h3>` + M.species.map(s => `<div class="row ${S.focus?.kind === 'species' && S.focus.id === s.id ? 'on' : ''}" data-focus="species=${esc(s.id)}"><i class="dot"></i><i class="sci" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc((s.common_names || []).join(' · '))}">${esc(s.scientific_name)}</i><span class="ab"><button class="mini a ${S.a === s.id ? 'on' : ''}" data-ab="a" data-id="${esc(s.id)}" title="set as plant A">A</button><button class="mini b ${S.b === s.id ? 'on' : ''}" data-ab="b" data-id="${esc(s.id)}" title="set as plant B">B</button></span></div>`).join('');
  h += `<div class="row ${S.focus?.kind === 'pair' ? 'on' : ''}" ${S.a && S.b ? 'data-act="pair"' : ''} style="margin-top:6px;${S.a && S.b ? '' : 'opacity:.5;cursor:default'}"><i class="dot" style="background:var(--violet)"></i>Pair A ↔ B in graph<span class="n">${S.a && S.b ? 'open' : 'pick A and B'}</span></div>`;
  h += `<div class="legend"><div><i></i>documented · a source states it</div><div><i class="derived"></i>derived · a recorded rule over claims</div><div><i class="candidate"></i>candidate · inferred (KG-R4), never promoted</div><div><i class="unknown"></i>unknown · listed as a gap, never drawn</div><div><i class="rel"></i>plant-to-plant record (relations.json)</div><div class="faint small" style="margin-top:4px">✓ = a human verified a supporting claim · AI checks are assessments, shown apart</div></div>`;
  $('#railbody').innerHTML = h;
}

// ------------------------------------------------------------------ graph (SVG, deterministic force layout around the focus)
const R_OF = n => n.focus ? 13 : n.kind === 'function' ? 10 : n.kind === 'species' ? 7.5 : 4.2;
function layout(g, W, H) {
  const nodes = g.nodes.map(n => ({ ...n })); const byId = new Map(nodes.map(n => [n.id, n]));
  const ghosts = nodes.filter(n => n.ghost), real = nodes.filter(n => !n.ghost);
  const cx = W / 2, cy = (H - (ghosts.length ? 70 : 0)) / 2 + 6, RX = W * 0.42, RY = (H - (ghosts.length ? 70 : 0)) * 0.38, R = (RX + RY) / 2;
  const ringOf = n => n.focus ? 0 : g.center ? (n.kind === 'species' ? .6 : 1) : (n.kind === 'function' ? .45 : 1);
  const kinds = ['function', 'species', 'concept'];
  for (const k of kinds) {
    const ks = real.filter(n => n.kind === k && !n.focus).sort((a, b) => k === 'concept' ? String(a.group || '').localeCompare(String(b.group || '')) || a.label.localeCompare(b.label) : 0); const n = ks.length;   // concepts cluster by knowledge group
    ks.forEach((nd, i) => { const a = (i / Math.max(1, n)) * Math.PI * 2 + (k === 'species' ? .3 : k === 'concept' ? .9 : -Math.PI / 2); const r = ringOf(nd); nd.x = cx + Math.cos(a) * RX * r; nd.y = cy + Math.sin(a) * RY * r; nd.vx = nd.vy = 0; });
  }
  for (const nd of real) if (nd.focus) { nd.x = cx; nd.y = cy; nd.fixed = true; }
  if (g.pair) { const [a, b] = g.pair; byId.get(a).x = cx - RX * .5; byId.get(b).x = cx + RX * .5; byId.get(a).y = byId.get(b).y = cy; }
  ghosts.forEach((nd, i) => { nd.x = 70 + (W - 140) * ((i + .5) / ghosts.length); nd.y = H - 28; nd.fixed = true; });
  const edges = g.edges.filter(e => byId.has(e.source) && byId.has(e.target)).map(e => ({ s: byId.get(e.source), t: byId.get(e.target), rel: e.rel }));
  const rest = e => e.rel === 'suited_for' ? R * .8 : e.rel === 'requires_trait' ? R * .6 : e.rel === 'has_trait' || e.rel === 'grows_in' ? R * .55 : R * .75;
  const N = real.length;
  for (let it = 0; it < 260; it++) {
    const alpha = 1 - it / 260, k = .9 * alpha + .05;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const a = real[i], b = real[j]; let dx = b.x - a.x, dy = b.y - a.y; let d2 = dx * dx + dy * dy; if (d2 < 1) { dx = (i - j) * .1 + .1; dy = .1; d2 = .02; }
      const d = Math.sqrt(d2); const min = R_OF(a) + R_OF(b) + (a.kind === 'concept' && b.kind === 'concept' ? 26 : 34);
      const f = (d < min ? (min - d) * .22 : 0) + 380 * k / d2;
      const fx = dx / d * f, fy = dy / d * f; if (!a.fixed) { a.vx -= fx; a.vy -= fy; } if (!b.fixed) { b.vx += fx; b.vy += fy; }
    }
    for (const e of edges) { if (e.s.fixed && e.t.fixed) continue; let dx = e.t.x - e.s.x, dy = e.t.y - e.s.y; const d = Math.max(1, Math.hypot(dx, dy)); const f = (d - rest(e)) * .018 * (e.rel === 'suited_for' ? 1.4 : 1); const fx = dx / d * f, fy = dy / d * f; if (!e.s.fixed) { e.s.vx += fx; e.s.vy += fy; } if (!e.t.fixed) { e.t.vx -= fx; e.t.vy -= fy; } }
    for (const n of real) {
      if (n.fixed) continue;
      const dx = n.x - cx, dy = n.y - cy, dn = Math.max(.01, Math.hypot(dx / RX, dy / RY)), tr = ringOf(n); const f = (tr - dn) * R * (g.center ? .035 : .02);   // soft elliptical ring: keeps the concentric reading
      n.vx += dx / (dn * RX) * f * (RX / R); n.vy += dy / (dn * RY) * f * (RY / R);
      n.vx *= .6; n.vy *= .6; n.x += n.vx; n.y += n.vy;
      n.x = Math.max(34, Math.min(W - 34, n.x)); n.y = Math.max(22, Math.min(H - (ghosts.length ? 92 : 26), n.y));
    }
  }
  return { nodes, byId };
}
function initGraphInteraction() {
  const svg = $('#svg'); let drag = null;
  svg.addEventListener('mousedown', ev => { if (ev.target.closest('.node, .edge')) return; drag = { x: ev.clientX, y: ev.clientY, vx: S.view.x, vy: S.view.y }; svg.classList.add('dragging'); });
  window.addEventListener('mousemove', ev => { if (!drag) return; S.view.x = drag.vx + (ev.clientX - drag.x); S.view.y = drag.vy + (ev.clientY - drag.y); applyView(); });
  window.addEventListener('mouseup', () => { drag = null; svg.classList.remove('dragging'); });
  svg.addEventListener('wheel', ev => { ev.preventDefault(); const r = svg.getBoundingClientRect(); const mx = ev.clientX - r.left, my = ev.clientY - r.top; const k0 = S.view.k, k1 = Math.max(.4, Math.min(3, k0 * (ev.deltaY < 0 ? 1.12 : .89))); S.view.x = mx - (mx - S.view.x) * k1 / k0; S.view.y = my - (my - S.view.y) * k1 / k0; S.view.k = k1; applyView(); }, { passive: false });
  const tip = $('#tip');
  svg.addEventListener('mousemove', ev => { const t = ev.target.closest('[data-tip]'); if (!t) { tip.style.display = 'none'; return; } tip.innerHTML = t.dataset.tip; tip.style.display = 'block'; tip.style.left = `${ev.clientX + 14}px`; tip.style.top = `${ev.clientY + 12}px`; });
  svg.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  new ResizeObserver(() => renderGraph()).observe($('#graph .body'));
}
function applyView() { const g = $('#svg g.view'); if (g) g.setAttribute('transform', `translate(${S.view.x},${S.view.y}) scale(${S.view.k})`); }
function renderGraph() {
  const M = S.M, svg = $('#svg'); const box = $('#graph .body').getBoundingClientRect(); const W = Math.max(300, box.width), H = Math.max(240, box.height);
  const g = M.graphFor(S.focus, S.a, S.b);
  const key = `${S.focus?.kind}|${S.focus?.id}|${S.a}|${S.b}|${Math.round(W)}x${Math.round(H)}`;
  if (S.layoutKey !== key) { S.layout = layout(g, W, H); S.layoutKey = key; S.view = { x: 0, y: 0, k: 1 }; }
  const L = S.layout; const sel = S.inspect;
  const edgeSel = e => sel && ((sel.kind === 'link' && e.kind === 'link' && sel.id === e.id) || (sel.kind === 'concept_link' && e.kind === 'concept_link' && sel.id === e.id) || (sel.kind === 'relation' && e.kind === 'relation' && sel.id === e.id));
  const inspectOf = e => e.kind === 'link' ? `link=${e.id}` : e.kind === 'concept_link' ? `concept_link=${e.id}` : e.kind === 'relation' ? `relation=${e.id}` : e.kind === 'requirement' ? `function=${e.fn}` : '';
  const edgeTip = e => { const a = M.name(e.source), b = M.name(e.target); return `${esc(a)} <span class="m">${esc(human(e.rel))}</span> ${esc(b)}<div class="m">${esc(e.status)}${e.conflict ? ' · conflict' : ''} · ${esc(e.verification)}${e.strength ? ` · ${esc(e.strength)}` : ''}${e.placeholder ? ' · model placeholder' : ''} — click for evidence</div>`; };
  let h = `<g class="view" transform="translate(${S.view.x},${S.view.y}) scale(${S.view.k})">`;
  for (const e of g.edges) {
    const a = L.byId.get(e.source), b = L.byId.get(e.target); if (!a || !b) continue;
    const cls = `edge ${esc(e.rel)} ${esc(e.status)} ${e.kind === 'relation' ? 'relation' : ''} ${e.conflict ? 'conflict' : ''} ${edgeSel(e) ? 'sel' : ''} ${sel && !edgeSel(e) && sel.kind !== 'species' && sel.kind !== 'function' && sel.kind !== 'concept' ? 'dim' : ''}`;
    h += `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line><line class="edge hit" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" data-inspect="${esc(inspectOf(e))}" data-tip="${esc(edgeTip(e))}"></line>`;
    if (e.kind === 'relation') h += `<text class="elabel" x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - 3}" text-anchor="middle">${esc(human(e.rel))}${e.placeholder ? ' (placeholder)' : ''}</text>`;
  }
  for (const n of L.nodes) {
    const r = R_OF(n); const cls = `node ${n.kind} ${n.focus ? 'focus' : ''} ${n.ghost ? 'ghost' : ''} ${S.a === n.id ? 'a' : ''} ${S.b === n.id ? 'b' : ''}`;
    const dense = L.nodes.length > 28 && n.kind === 'concept';
    const label = n.kind === 'species' ? `<text x="${n.x}" y="${n.y + r + 11}" text-anchor="middle" font-size="11" font-style="italic">${esc(n.label)}</text>` : `<text x="${n.x}" y="${n.y + r + (dense ? 9 : 11)}" text-anchor="middle" font-size="${n.kind === 'function' ? 11 : dense ? 9 : 10.5}">${esc(dense && n.label.length > 26 ? n.label.slice(0, 24) + '…' : n.label)}</text>`;
    const tipText = n.kind === 'species' ? `<i>${esc(n.label)}</i><div class="m">species · ${(M.sp(n.id).common_names || [])[0] ? esc(M.sp(n.id).common_names[0]) + ' · ' : ''}${M.sp(n.id).claims.live} live claims${n.ghost ? ` · ${esc(n.verdict)} for the focused function — no link drawn` : ''}</div>` : n.kind === 'function' ? `${esc(n.label)}<div class="m">spatial function · ${M.fn(n.id).n_linked} linked · ${M.fn(n.id).n_unknown} unknown${n.ghost ? ` · ${esc(n.verdict)} for the focused species — no link drawn` : ''}</div>` : `${esc(n.label)}<div class="m">${esc(M.co(n.id)?.facet_label || 'concept')} · ${M.co(n.id)?.n_species ?? 0} species</div>`;
    const ab = S.a === n.id ? `<text x="${n.x + r + 3}" y="${n.y - r - 2}" font-size="9" font-weight="700" fill="var(--olive)">A</text>` : S.b === n.id ? `<text x="${n.x + r + 3}" y="${n.y - r - 2}" font-size="9" font-weight="700" fill="var(--amber)">B</text>` : '';
    h += `<g class="${cls}" data-focus="${n.ghost ? '' : `${n.kind}=${esc(n.id)}`}" ${n.ghost ? `data-inspect="link=${esc(n.link)}"` : ''} data-tip="${esc(tipText)}"><circle cx="${n.x}" cy="${n.y}" r="${r}"></circle>${label}${ab}</g>`;
  }
  if (L.nodes.some(n => n.ghost)) h += `<text class="elabel" x="${W / 2}" y="${H - 62}" text-anchor="middle">unknown for ${esc(M.name(S.focus.id))} — no link drawn · click one for its requirement check</text>`;
  h += `</g>`;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = h;
  const f = S.focus;
  $('#gsub').textContent = !f ? `overview · ${g.nodes.length} nodes · ${g.edges.length} drawn links` : f.kind === 'pair' ? `pair · ${M.name(S.a)} ↔ ${M.name(S.b)} · shared concepts, functions, direct records` : `${f.kind} · ${M.name(f.id)} · ${g.nodes.filter(n => !n.ghost).length} nodes · ${g.edges.length} edges · ${g.nodes.filter(n => n.ghost).length} unknown`;
}

// ------------------------------------------------------------------ matrix
const cellWord = l => l.status === 'derived' ? 'use' : l.status === 'candidate' ? 'traits' : l.status === 'documented' ? 'stated' : l.verdict === 'contradicted by traits' ? 'contradicted' : 'no evidence';
function renderMatrix() {
  const M = S.M; const ff = S.focus?.kind === 'function' ? S.focus.id : null, fs = S.focus?.kind === 'species' ? S.focus.id : null;
  let h = `<table class="matrix"><thead><tr><th>species</th>${M.functions.map(f => `<th class="${ff === f.id ? 'focus' : ''}" data-focus="function=${esc(f.id)}" title="${esc(f.definition)}">${esc(f.label)}</th>`).join('')}</tr></thead><tbody>`;
  for (const s of M.species) {
    const linked = ff && M.link(s.id, ff).drawn;
    h += `<tr class="${fs === s.id ? 'focus' : ''} ${linked ? 'linked' : ''}"><th data-focus="species=${esc(s.id)}"><i class="sci">${esc(s.scientific_name)}</i>${S.a === s.id ? ' <span class="tag A">A</span>' : ''}${S.b === s.id ? ' <span class="tag B">B</span>' : ''}</th>`;
    for (const f of M.functions) {
      const l = M.link(s.id, f.id); const selc = S.inspect?.kind === 'link' && S.inspect.id === l.id;
      h += `<td class="${ff === f.id || fs === s.id ? 'focus' : ''} ${selc ? 'sel' : ''}" data-inspect="link=${esc(l.id)}" title="${esc(cellTitle(l))}"><span class="cell ${esc(l.status)} ${l.conflict ? 'conflict' : ''} ${l.verdict === 'contradicted by traits' ? 'contradicted' : ''}">${esc(cellWord(l))}${l.conflict ? ' · conflict' : ''}${l.verification === 'verified' ? ` <span class="v">✓${l.n_verified}</span>` : ''}</span></td>`;
    }
    h += `</tr>`;
  }
  h += `</tbody></table>`;
  h += `<div id="mlegend"><details><summary>legend · status ≠ verification · blank ≠ unsuitable</summary><b>use</b> = derived: a source records a use the ontology maps to the function (KG-R1) · <b>traits</b> = candidate: every required trait met by claims, no source states the use (KG-R4) · <b>contradicted</b> = unknown: a recorded trait is outside a requirement · <b>no evidence</b> = unknown: no claim on a required trait · <b>conflict</b> = a documented use and a trait claim disagree · <b>✓n</b> = n verified use claims.</details></div>`;
  $('#mbody').innerHTML = h;
}
function cellTitle(l) { const M = S.M; return `${M.name(l.species)} → ${M.name(l.function)}: ${l.status}${l.conflict ? ' · conflict' : ''}${l.verdict ? ` · ${l.verdict}` : ''} · ${l.verification}${l.via_use_labels?.length ? ` · use: ${l.via_use_labels.join(', ')}` : ''} — click for the evidence`; }

// ------------------------------------------------------------------ attribute table
function renderTable() {
  const M = S.M; const ff = S.focus?.kind === 'function' ? M.fn(S.focus.id) : null, fs = S.focus?.kind === 'species' ? S.focus.id : null;
  const req = new Set(ff ? ff.required_facets : []);
  if (!$('#tq')) { $('#tcontrols').innerHTML = `<input id="tq" placeholder="filter species…" style="width:150px">` + M.groups.map(g => `<label><input type="checkbox" ${S.groups.has(g.id) ? 'checked' : ''} data-act="tg" data-id="${esc(g.id)}">${esc(g.label)}</label>`).join('') + `<span class="faint small" id="thint"></span>`; $('#tq').addEventListener('input', () => { S.q = $('#tq').value; renderTable(); }); }
  $('#thint').textContent = ff ? `· columns ${ff.label} requires are marked · linked species first` : '· click a cell for its claims · a column header sorts';
  const cols = M.facets.filter(f => S.groups.has(f.group));
  const q = S.q.trim().toLowerCase();
  let rows = M.species.filter(s => !q || [s.scientific_name, ...(s.common_names || []), s.family].join(' ').toLowerCase().includes(q));
  const rank = { derived: 0, documented: 0, candidate: 1, unknown: 2 };
  if (ff) rows = rows.slice().sort((a, b) => { const la = M.link(a.id, ff.id), lb = M.link(b.id, ff.id); return rank[la.status] - rank[lb.status] || (la.verdict === 'evidence missing') - (lb.verdict === 'evidence missing') || a.scientific_name.localeCompare(b.scientific_name); });
  if (S.sort) rows = rows.slice().sort((a, b) => (M.attr(b.id, S.sort)?.n_values || 0) - (M.attr(a.id, S.sort)?.n_values || 0));
  const groupsRow = []; let last = null;
  for (const f of cols) { if (f.group !== last) { groupsRow.push({ g: f.group, n: 1 }); last = f.group; } else groupsRow[groupsRow.length - 1].n++; }
  let h = `<table class="attr"><thead><tr class="groups"><th colspan="1"></th><th colspan="5">identity</th>${groupsRow.map(x => `<th colspan="${x.n}">${esc(M.GR.get(x.g).label)}</th>`).join('')}</tr><tr class="cols"><th>species</th><th>growth form (M29)</th><th>family</th><th>origin</th><th>KPU type</th><th>claims live · ✓ · retired</th>${cols.map(f => `<th class="${req.has(f.id) ? 'req' : ''} ${S.sort === f.id ? 'sorted' : ''}" data-act="tsort" data-id="${esc(f.id)}" title="${esc(f.definition || f.label)} · ${f.policy === 'node' ? 'concept facet' : 'numeric / categorical attribute'} · ${f.gate ? 'gate field (survey c1)' : 'compare field'}">${esc(f.label)}${f.gate ? ' <span class="faint">gate</span>' : ''}</th>`).join('')}</tr></thead><tbody>`;
  for (const s of rows) {
    const l = ff ? M.link(s.id, ff.id) : null;
    h += `<tr class="${fs === s.id ? 'focus' : ''} ${l ? (l.drawn ? 'linked' : 'unknown-fn') : ''}"><th data-focus="species=${esc(s.id)}"><i class="sci">${esc(s.scientific_name)}</i>${S.a === s.id ? ' <span class="tag A">A</span>' : ''}${S.b === s.id ? ' <span class="tag B">B</span>' : ''}${l ? `<span class="st">${esc(cellWord(l))}${l.conflict ? ' · conflict' : ''}</span>` : ''}</th>`;
    h += `<td class="ident" data-inspect="species=${esc(s.id)}">${esc(s.growth_form_label || '—')} <small class="faint">${esc(s.growth_form_status || '')}</small></td><td class="ident">${esc(s.family || '—')}</td><td class="ident">${esc(human(s.origin_status) || '—')}</td><td class="ident">${esc(s.kpu_plant_type || '—')}</td><td class="ident mono">${s.claims.live} · ${s.claims.verified} · ${s.claims.retired}</td>`;
    for (const f of cols) {
      const a = M.attr(s.id, f.id); const selc = S.inspect?.kind === 'attr' && S.inspect.id === a?.id;
      if (!a) { h += `<td class="nr ${req.has(f.id) ? 'req' : ''}">not recorded</td>`; continue; }
      const vals = a.values.slice(0, 3).map(v => `<span class="v">${esc(v.label)}<small> ${v.claims.length || (v.entity ? 'e' : '')}${v.conditions.length ? '·c' : ''}</small></span>`).join('') + (a.values.length > 3 ? `<span class="v faint">+${a.values.length - 3}</span>` : '');
      h += `<td class="${req.has(f.id) ? 'req' : ''} ${selc ? 'sel' : ''}" data-inspect="attr=${esc(a.id)}" title="${esc(a.values.map(v => v.label).join(' · '))} — ${a.n_values} values · ${a.n_claims} claims · ${a.n_sources} sources · ${esc(a.verification)}${a.disagreement.length ? ' · sources disagree' : ''}">${vals}${a.verification === 'verified' ? ` <span class="ver">✓</span>` : ''}${a.disagreement.length ? ` <span class="dis">⚠ ${a.disagreement.length}</span>` : ''}${a.variation.length ? ` <span class="dis" style="color:#8a6a1f">by condition</span>` : ''}</td>`;
    }
    h += `</tr>`;
  }
  h += `</tbody></table>`;
  $('#tablewrap').innerHTML = h;
}

// ------------------------------------------------------------------ inspector
const tag = (s, extra = '') => s ? `<span class="tag ${esc(String(s).replace(/\s+/g, '_'))}">${esc(human(s))}${extra}</span>` : '';
function sourceLine(sid) { const s = S.M.source(sid); const name = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>` : esc(s.label); return `${name}${s.type ? ` · ${esc(s.type)}` : ''}${s.licence_tier ? ` · tier ${esc(s.licence_tier)}` : ''}${s.geo ? ` · ${esc(s.geo)}` : ''}`; }
function claimHtml(cid) {
  const M = S.M, c = M.claim(cid); if (!c) return `<div class="claim"><div class="meta">${esc(cid)} — not in the projection's claim index</div></div>`;
  const chk = M.checks[cid];
  const cond = c.conditions?.length ? ` · <b>when</b> ${c.conditions.map(x => esc(x.label)).join(', ')}` : '';
  const pm = c.practitioner_meta; const who = pm?.observer_background ? `<br><b>observer</b> ${esc(pm.observer_background)}${pm.completeness ? ` · ${esc(pm.completeness)}` : ''}${pm.citable === false ? ' · not citable' : ''}` : '';
  return `<div class="claim"><div class="txt">${esc(c.text)}</div><div class="meta"><b>source</b> ${sourceLine(c.source_id)} · ${esc(c.source_type)}${c.place_label ? ` · <b>place</b> ${esc(c.place_label)}` : ''}${cond}${c.cultivar ? ` · <b>cv.</b> ${esc(c.cultivar)}` : ''} · <b>conf</b> ${esc(c.confidence)}${c.context ? `<br><b>context</b> ${esc(c.context)}` : ''}${who}<br>${tag(c.status)} ${tag(c.evidence_check, ' <span style="opacity:.7">AI</span>')}${c.status === 'retired' ? ` retired${c.retired_by ? ` by ${esc(c.retired_by)}` : ''}` : ''}<br><span class="faint">${esc(c.id)} · ${esc(c.field)} · ${esc(c.recorded_at || '')}</span></div>${chk ? `<details class="ai"><summary>AI source check: ${esc(human(chk.result))} (${esc(chk.method)}, ${esc((chk.reviewed_at || '').slice(0, 10))}) — an assessment, not a verification</summary><div class="small muted"><b>locator</b> ${esc(chk.locator || '—')}<br><b>excerpt</b> ${esc(chk.excerpt || '—')}<br><b>reading</b> ${esc(chk.explanation || '')}${chk.missing_context ? `<br><b>missing context</b> ${esc(chk.missing_context)}` : ''}${chk.conflicting_claims?.length ? `<br><b>conflicting claims</b> ${chk.conflicting_claims.map(x => `<span class="mono">${esc(x)}</span>`).join(', ')}${chk.conflict_reading ? ` — ${esc(chk.conflict_reading)}` : ''}` : ''}</div></details>` : ''}</div>`;
}
function ruleHtml(rules) { if (!rules) return ''; return (Array.isArray(rules) ? rules : String(rules).split(' · ')).map(r => S.M.rules[r] ? `<div class="note"><b>${esc(r)}</b> — ${esc(S.M.rules[r])}</div>` : '').join(''); }
function reqHtml(reqs, verdicts) {
  const M = S.M; if (!reqs?.length) return '<p class="faint small">no requirement recorded for this concept</p>';
  return `<h3>Requirement check ${verdicts ? `<small>${esc(Object.values(verdicts).join(' / '))}</small>` : ''}</h3>` + reqs.map(r => `<div class="reqrow"><div>${esc(r.strength)} ${r.alternative_labels.map((l, i) => `<span class="link" data-focus="concept=${esc(r.alternatives[i])}">${esc(l)}</span>`).join(' <span class="faint">or</span> ')}${r.to_confirm ? ' <span class="faint">(to confirm)</span>' : ''}${r.concept_label ? ` <span class="faint">· ${esc(r.concept_label)}</span>` : ''}</div><div class="r ${esc(r.result)}">${esc(r.result)}</div>${r.evidence?.length ? `<div class="alt">${r.evidence.map(x => `${esc(x.target_label)}${x.claim ? ` — <span class="mono">${esc(x.claim)}</span> ${tag(x.verification)}` : ` — ${esc(x.source_id)}`}${x.cultivar ? ` cv. ${esc(x.cultivar)}` : ''}${x.conditions?.length ? ` when ${esc(x.conditions.map(c => c.label || c.concept_id || c).join(', '))}` : ''}`).join('<br>')}</div>` : ''}${r.contrary?.length ? `<div class="alt warn">contrary: ${r.contrary.map(x => `${esc(x.target_label)} (${esc(x.source_id)}${x.claim ? `, <span class="mono">${esc(x.claim)}</span>` : ''})`).join(', ')}</div>` : ''}${r.source ? `<div class="alt faint">${esc(r.source)}</div>` : ''}</div>`).join('');
}
function renderInspector() {
  const M = S.M;
  document.querySelectorAll('#inspector .tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
  $('#isub').textContent = S.tab === 'compare' ? (S.a && S.b ? `${M.name(S.a)} ↔ ${M.name(S.b)}` : 'pick A and B') : S.inspect ? S.inspect.kind.replace('_', ' ') : S.focus ? `${S.focus.kind}` : 'how to read';
  $('#ibody').innerHTML = S.tab === 'compare' ? compareHtml() : evidenceHtml();
  $('#ibody').scrollTop = 0;
}
function evidenceHtml() {
  const M = S.M, i = S.inspect;
  if (!i) {
    if (S.focus?.kind === 'function') return functionHtml(M.fn(S.focus.id));
    if (S.focus?.kind === 'species') return speciesHtml(M.sp(S.focus.id));
    if (S.focus?.kind === 'concept') return conceptHtml(M.co(S.focus.id));
    if (S.focus?.kind === 'pair') return `<div class="empty">The graph shows the pair. Open <span class="link" data-tab="compare">Compare A / B</span> for the four sections, or click a line for its evidence.</div>`;
    return `<div class="kicker">how to read</div><h2 class="title">One selection, four views</h2><p class="muted small">Pick a <b>spatial function</b> (top or left): the graph shows the species linked to it and the traits it requires, the matrix marks its column, the table marks the required columns and sorts the linked species first. Pick a <b>species</b>: its functions, traits and recorded relations. Click any <b>line or cell</b>: the claims, sources, rule and verification behind it. Set <b>A</b> and <b>B</b> on two species to compare them.</p>
      <h3>Three separate statements on every record</h3><p class="small"><b>status</b> ${tag('documented')} ${tag('derived')} ${tag('candidate')} ${tag('unknown')} — what kind of knowledge a link is.<br><b>verification</b> ${tag('verified')} ${tag('unverified')} ${tag('none')} — whether a human verified a supporting claim (${M.stats.claims_by_status.verified || 0} of ${M.stats.claims} claims are).<br><b>AI evidence check</b> ${tag('supported_by_source')} ${tag('partially_supported')} ${tag('conflicting_evidence')} — a source assessment by the review pipeline; it never verifies anything.</p>
      <h3>What is never done here</h3><p class="small muted">No value is averaged or picked as 'best'; a field shows every claim. No plant-to-plant line is drawn from shared traits — only relations.json records are drawn, and retired ones are listed as history. No unknown function link is drawn: it is a gap with its requirement check. Nothing is promoted; the projection changes no claim.</p>
      <h3>Data</h3><p class="small mono faint">brain/data/explorer.json · ${esc(M.d.generated)} · ${esc(M.d.generated_by)} · inputs: ${esc(M.d.inputs.join(', '))}</p>`;
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
function linkHtml(l) {
  const M = S.M; const s = M.sp(l.species), f = M.fn(l.function);
  let h = `<div class="kicker">species → spatial function · ${esc(l.evidence_kind === 'use_claim' ? 'recorded use' : l.evidence_kind === 'trait_inference' ? 'trait inference' : 'no link')}</div><h2 class="title">${spLink(s.id)} <span class="faint">→</span> ${fnLink(f.id)}<small>${tag(l.status)} ${tag(l.verification, l.n_verified || l.n_unverified ? ` ${l.n_verified ? `${l.n_verified}✓` : ''}${l.n_unverified ? ` ${l.n_unverified}·` : ''}` : '')} ${l.conflict ? tag('conflict') : ''} ${l.verdict ? tag(l.verdict) : ''}</small></h2>`;
  if (l.status === 'derived' && l.use_claims.length) h += `<p>A source records the use <b>${esc(l.via_use_labels.join(', '))}</b> (${esc(l.use_sources.join(', '))}), which the ontology maps to ${esc(f.label)} — rule KG-R1. ${l.verification === 'verified' ? 'A human verified a use claim.' : 'No human has verified the use claim yet.'}</p>`;
  else if (l.status === 'candidate') h += `<p>No source states this use. Every <b>required</b> trait of ${esc(f.label)} is met by recorded claims (KG-R4), so the link is a <b>candidate</b> — an inference, never promoted, nothing to verify until a source records the use.</p>`;
  else if (l.status === 'unknown') h += `<p>No link is drawn. ${l.verdict === 'contradicted by traits' ? `A recorded claim places <i class="sci">${esc(s.scientific_name)}</i> outside a requirement of ${esc(f.label)} — evidence against, under the conditions, cultivar and source stated below.` : `The database has no claim on a trait ${esc(f.label)} requires — not known, which is not the same as unsuitable.`} <span class="muted">No source lists the plant for this function either.</span></p>`;
  if (l.conflict) h += `<p class="warn small">Conflict: the documented use and a trait claim disagree — shown, not resolved. The use claim stays; the requirement check below names the contrary claim.</p>`;
  if (l.verification_note) h += `<p class="small faint">${esc(l.verification_note)}</p>`;
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
  let h = `<div class="kicker">attribute cell · ${esc(M.GR.get(a.group).label)}</div><h2 class="title">${spLink(s.id)} <span class="faint">·</span> ${esc(f.label)}<small>${a.n_values} value${a.n_values === 1 ? '' : 's'} · ${a.n_claims} claim${a.n_claims === 1 ? '' : 's'} · ${a.n_sources} source${a.n_sources === 1 ? '' : 's'} · ${tag(a.status)} ${tag(a.verification)}${f.gate ? ' · gate field' : ''}</small></h2>`;
  if (a.disagreement.length) h += a.disagreement.map(d => `<p class="warn small"><b>Sources disagree.</b> ${esc(d.text)}</p>`).join('');
  if (a.variation.length) h += a.variation.map(d => `<p class="small" style="color:#8a6a1f"><b>Varies by condition.</b> ${esc(d.text)}</p>`).join('');
  h += `<p class="small muted">Every distinct value is kept with its own claims (rule R1); nothing is averaged or chosen.</p>`;
  if (a.rule) h += ruleHtml(a.rule);
  for (const v of a.values) {
    h += `<h3>${esc(v.label)} <small>${v.claims.length ? `${v.claims.length} claim${v.claims.length === 1 ? '' : 's'}` : v.entity ? 'entity record' : ''}${v.conditions.length ? ` · when ${esc(v.conditions.join(', '))}` : ''}${v.cultivars.length ? ` · cv. ${esc(v.cultivars.join(', '))}` : ''} ${tag(v.status)} ${tag(v.verification)}</small>${M.CO.has(v.concept) ? ` <span class="link small" data-focus="concept=${esc(v.concept)}">concept</span>` : ''}</h3>`;
    if (v.numbers?.length) h += `<p class="small mono muted">${v.numbers.map(n => esc(JSON.stringify(n))).join(' · ')}</p>`;
    h += v.claims.map(claimHtml).join('') || (v.entity ? `<p class="small muted">Read from the plant's entity record (identity_review), not from a sourced claim.</p>` : '');
  }
  h += `<p class="small faint mono" style="margin-top:10px">${esc(a.id)}${a.underlying.xyz_edges.length ? ` · xyz: ${esc(a.underlying.xyz_edges.join(' · '))}` : ''}</p>`;
  return h;
}
function conceptLinkHtml(e) {
  const M = S.M; const s = M.sp(e.species), c = M.co(e.concept);
  let h = `<div class="kicker">species → concept · ${esc(human(e.rel))}</div><h2 class="title">${spLink(s.id)} <span class="faint">${esc(human(e.rel))}</span> <span class="link" data-focus="concept=${esc(c.id)}">${esc(c.label)}</span><small>${esc(c.facet_label || c.facet)} · ${tag(e.status)} ${tag(e.verification, e.n_verified || e.n_unverified ? ` ${e.n_verified ? `${e.n_verified}✓` : ''}${e.n_unverified ? ` ${e.n_unverified}·` : ''}` : '')}</small></h2>`;
  if (e.rule) h += ruleHtml(e.rule);
  if (e.entity) h += `<p class="small muted">Recorded in the plant's entity record, not in a sourced claim.</p>`;
  if (e.conditions.length) h += `<p class="small muted">stated conditions: ${esc(e.conditions.join(', '))}</p>`;
  if (e.cultivars.length) h += `<p class="small muted">cultivar-level claims: ${esc(e.cultivars.join(', '))}</p>`;
  h += `<h3>Claims <small>${e.claims.length} · ${e.sources.length} sources</small></h3>` + (e.claims.map(claimHtml).join('') || '<p class="faint small">none (entity record)</p>');
  const a = M.attr(s.id, c.facet); if (a) h += `<p class="small"><span class="link" data-inspect="attr=${esc(a.id)}">every value of ${esc(c.facet_label || c.facet)} for this plant (${a.n_values})</span></p>`;
  h += `<p class="small faint mono" style="margin-top:10px">${esc(e.id)} · kg: ${esc(e.underlying.slice(0, 6).join(' · '))}${e.underlying.length > 6 ? ` · +${e.underlying.length - 6}` : ''}</p>`;
  return h;
}
function relationHtml(r, full = false) {
  const M = S.M;
  let h = full ? `<div class="kicker">plant-to-plant record · relations.json</div><h2 class="title">${spLink(r.a)} <span class="faint">${esc(human(r.type))}${r.direction ? ` (${esc(r.direction)})` : ''}</span> ${spLink(r.b)}<small>${tag(r.kg_status)} ${tag(r.status)} ${r.placeholder ? tag('model placeholder') : ''}</small></h2>` : '';
  h += `<div class="claim"><div class="txt">${esc(r.text || '')}</div><div class="meta"><b>source</b> ${sourceLine(r.source_id || '')} · ${esc(r.source_type)} · conf ${esc(r.confidence)}${r.context ? `<br><b>context</b> ${esc(r.context)}` : ''}${r.rule ? `<br><b>rule</b> ${esc(r.rule)}` : ''}${r.note ? `<br>${esc(r.note)}` : ''}${r.placeholder && r.live ? `<br><span class="warn">a model placeholder: a candidate to be verified against ${esc((r.verify_against || []).join(', ') || 'a source')}; it is not evidence</span>` : ''}${!r.live ? `<br><span class="warn">retired ${esc(r.retired_at || '')}${r.retired_by ? ` by ${esc(r.retired_by)}` : ''}${r.retired_reason ? ` — ${esc(r.retired_reason)}` : ''} · history, never drawn</span>` : ''}${r.derived_from?.length ? `<br><b>derived from</b> ${r.derived_from.map(x => `<span class="mono">${esc(x)}</span>`).join(', ')}` : ''}${r.supporting_claims?.length ? `<br><b>supporting claims</b> ${r.supporting_claims.map(x => `<span class="mono">${esc(x)}</span>`).join(', ')}` : ''}${r.citation ? `<br><b>citation</b> ${esc(r.citation)}` : ''}<br><span class="faint">${esc(r.id)} · ${esc(r.recorded_at || '')}${r.recorded_by ? ` · ${esc(r.recorded_by)}` : ''}</span></div></div>`;
  if (full) { const cl = [...(r.derived_from || []), ...(r.supporting_claims || [])].filter(c => M.claim(c)); if (cl.length) h += `<details><summary>claims named (${cl.length})</summary>${cl.map(claimHtml).join('')}</details>`; h += `<div class="note">Direct plant-to-plant knowledge comes only from records like this one. Co-listing in a survey means a designer thought of the two together — not that they are compatible. Shared traits connect plants only through the trait.</div>`; }
  return h;
}
function speciesHtml(s) {
  const M = S.M; const links = M.linksOf(s.id); const rels = M.relationsOf(s.id), retired = M.relationsOf(s.id, false).filter(r => !r.live);
  let h = `<div class="kicker">species · ${esc(s.growth_form_label || '')} ${esc(s.growth_form_status || '')}</div><h2 class="title"><i class="sci">${esc(s.scientific_name)}</i><small>${esc((s.common_names || []).join(' · '))} · ${esc(s.family)} · ${esc(human(s.origin_status))} · ${esc(s.kpu_plant_type)} · ${s.claims.live} live claims (${s.claims.verified} verified, ${s.claims.retired} retired)</small></h2>`;
  h += `<p class="small"><span class="link" data-ab="a" data-id="${esc(s.id)}">${S.a === s.id ? 'A ✓' : 'set as A'}</span> · <span class="link" data-ab="b" data-id="${esc(s.id)}">${S.b === s.id ? 'B ✓' : 'set as B'}</span></p>`;
  h += `<h3>Spatial functions <small>${links.filter(l => l.drawn).length} linked · ${links.filter(l => !l.drawn).length} unknown</small></h3>` + links.map(l => `<div class="row" data-inspect="link=${esc(l.id)}"><div class="b">${esc(M.name(l.function))} ${tag(l.status)} ${tag(l.verification)} ${l.conflict ? tag('conflict') : ''}<div class="meta">${l.drawn ? (l.via_use_labels.length ? `use: ${esc(l.via_use_labels.join(', '))} (${esc(l.use_sources.join(', '))})` : 'inferred from traits (KG-R4), no source states this use') : esc(l.verdict)}</div></div></div>`).join('');
  h += `<h3>Growth form <small>M29</small></h3><p class="small">${esc(s.growth_form_label || 'unknown')} (${esc(s.growth_form_status || '')}) — read from the sources: ${Object.entries(s.growth_form_evidence || {}).map(([k, v]) => `<b>${esc(k)}</b> ${esc(v)}`).join(' · ') || 'no evidence listed'}</p>`;
  h += `<h3>Plant-to-plant records <small>${rels.length} live · ${retired.length} retired</small></h3>` + (rels.length ? rels.map(r => `<div class="row" data-inspect="relation=${esc(r.id)}"><div class="b">${esc(human(r.type))} <i class="sci">${esc(M.name(r.a === s.id ? r.b : r.a))}</i> ${tag(r.kg_status)} ${tag(r.status)}${r.placeholder ? ` ${tag('model placeholder')}` : ''}<div class="meta">${esc(M.source(r.source_id).label)}</div></div></div>`).join('') : '<p class="faint small">none live in relations.json</p>');
  if (retired.length) h += `<details><summary>retired records (${retired.length}) — history, not evidence</summary>${retired.map(r => `<div class="row" data-inspect="relation=${esc(r.id)}"><div class="b">${esc(human(r.type))} <i class="sci">${esc(M.name(r.a === s.id ? r.b : r.a))}</i> ${tag('retired')}<div class="meta">${esc(r.retired_reason || r.note || '')}</div></div></div>`).join('')}</details>`;
  const cells = M.attrs.filter(a => a.species === s.id); const nr = M.facets.filter(f => !M.attr(s.id, f.id));
  h += `<h3>Attributes <small>${cells.length} facets recorded · ${nr.length} not recorded · ${cells.filter(a => a.disagreement.length).length} with disagreement</small></h3><p class="small">${cells.map(a => `<span class="chip" data-inspect="attr=${esc(a.id)}">${esc(M.FA.get(a.facet).label)}<small>${a.n_values}</small>${a.disagreement.length ? '<small class="warn">⚠</small>' : ''}${a.verification === 'verified' ? '<small style="color:var(--olive-deep)">✓</small>' : ''}</span>`).join('')}</p>`;
  if (nr.length) h += `<p class="small faint">not recorded: ${esc(nr.map(f => f.label).join(', '))}</p>`;
  h += `<div class="note">Plants sharing a concept are connected only through that concept. A shared trait is never read as a companion relation; a function link is never a planting verdict.</div><p class="small faint mono">${esc(s.file)} · ${esc(s.id)}</p>`;
  return h;
}
function functionHtml(f) {
  const M = S.M; const links = M.linksTo(f.id);
  let h = `<div class="kicker">spatial function · Z · stands for ${esc(f.underlying_labels.join(' + '))}</div><h2 class="title">${esc(f.label)}<small>${esc(f.definition)}</small></h2>`;
  h += `<h3>Requires <small>literature · ${f.requirements.length}</small></h3>` + f.requirements.map(r => `<div class="row static"><div class="b">${esc(r.strength)}: ${r.alternative_labels.map((l, i) => M.CO.has(r.alternatives[i]) && !M.co(r.alternatives[i]).no_plant_reaches ? `<span class="link" data-focus="concept=${esc(r.alternatives[i])}">${esc(l)}</span>` : `<span class="muted">${esc(l)}</span>`).join(' <span class="faint">or</span> ')}${r.to_confirm ? ` ${tag('to confirm')}` : ''}${r.no_plant_reaches ? ' <span class="faint small">(no plant reaches any alternative)</span>' : ''}<div class="meta">${esc(r.literature || '')}${r.note ? ` — ${esc(r.note)}` : ''}</div></div></div>`).join('');
  const order = { derived: 0, documented: 0, candidate: 1, unknown: 2 };
  h += `<h3>Species <small>${links.filter(l => l.drawn).length} linked · ${links.filter(l => !l.drawn).length} unknown (never drawn)</small></h3>` + links.slice().sort((a, b) => order[a.status] - order[b.status] || M.name(a.species).localeCompare(M.name(b.species))).map(l => `<div class="row" data-inspect="link=${esc(l.id)}"><div class="b"><i class="sci">${esc(M.name(l.species))}</i> ${tag(l.status)} ${tag(l.verification)} ${l.conflict ? tag('conflict') : ''}<div class="meta">${l.drawn ? (l.via_use_labels.length ? `use: ${esc(l.via_use_labels.join(', '))} (${esc(l.use_sources.join(', '))})` : 'all required traits met (KG-R4); no source states this use') + ' · ' + esc(Object.values(l.verdicts || {}).join(' / ')) : `${esc(l.verdict)}: ${(l.missing || []).map(m => `${esc(m.strength)} ${esc(m.alternative_labels.join(' or '))} ${esc(m.result)}`).join('; ')}`}</div></div></div>`).join('');
  h += `<p class="small faint">term: ${esc(f.source_of_term || '')}</p><div class="note">A function is a potential spatial role, not a plant attribute: the link depends on several traits, planting configuration and context. Blank is not unsuitable; ‘contradicted’ names the claim that contradicts.</div>`;
  return h;
}
function conceptHtml(c) {
  const M = S.M; const es = M.clinksOf.get(c.id) || [];
  let h = `<div class="kicker">concept · ${esc(c.facet_label || c.facet)} · ${esc(M.GR.get(c.group)?.label || '')}</div><h2 class="title">${esc(c.label)}<small>${esc(c.definition || '')}</small></h2>`;
  h += `<h3>Species <small>${es.length}</small></h3>` + es.map(e => `<div class="row" data-inspect="concept_link=${esc(e.id)}"><div class="b"><i class="sci">${esc(M.name(e.species))}</i> ${tag(e.status)} ${tag(e.verification)}<div class="meta">${e.claims.length} claims · ${esc(e.sources.join(', '))}${e.conditions.length ? ` · when ${esc(e.conditions.join(', '))}` : ''}</div></div></div>`).join('');
  if (c.required_by?.length) h += `<h3>Required by</h3><p>${c.required_by.map(fid => `<span class="chip" data-focus="function=${esc(fid)}">${esc(M.name(fid))}</span>`).join('')}</p>`;
  h += `<div class="note">An indirect connection: the plants listed reach the same concept, which says nothing about planting them together.</div>`;
  return h;
}

// ------------------------------------------------------------------ A / B comparison: four sections, never conflated
function compareHtml() {
  const M = S.M;
  const opts = sel => `<option value="">—</option>` + M.species.map(s => `<option value="${esc(s.id)}" ${sel === s.id ? 'selected' : ''}>${esc(s.scientific_name)}</option>`).join('');
  let h = `<div id="abpick"><div><label>Plant A</label><select id="sel-a" onchange="window.explorer.act('pick-a')">${opts(S.a)}</select></div><div><label>Plant B</label><select id="sel-b" onchange="window.explorer.act('pick-b')">${opts(S.b)}</select></div><div><button data-act="swap" title="swap A and B">⇄</button> <button data-act="pair" ${S.a && S.b ? '' : 'disabled'} title="show the pair in the graph">graph</button></div></div>`;
  if (!(S.a && S.b)) return h + `<div class="empty">Choose two species (A and B above, or the A / B buttons beside each species). The comparison keeps four things apart: shared attributes, direct recorded relationships, spatial complementarity and evidence / unknowns.</div>`;
  const a = M.sp(S.a), b = M.sp(S.b), p = M.pair(S.a, S.b); const swap = p.a !== S.a;   // the projection stores the pair once; A/B may be the other way round
  const A = { id: S.a, only: swap ? 'only_b' : 'only_a', rec: swap ? 'b_recorded' : 'a_recorded', dis: swap ? 'b_disagreement' : 'a_disagreement', fn: swap ? 'b_function' : 'a_function', st: swap ? 'b_status' : 'a_status', cf: swap ? 'b_conflict' : 'a_conflict', fns: swap ? 'b_functions' : 'a_functions', unk: swap ? 'b_unknown' : 'a_unknown' };
  const B = { id: S.b, only: swap ? 'only_a' : 'only_b', rec: swap ? 'a_recorded' : 'b_recorded', dis: swap ? 'a_disagreement' : 'b_disagreement', fn: swap ? 'a_function' : 'b_function', st: swap ? 'a_status' : 'b_status', cf: swap ? 'a_conflict' : 'b_conflict', fns: swap ? 'a_functions' : 'b_functions', unk: swap ? 'a_unknown' : 'b_unknown' };
  h += `<h2 class="title"><span class="tag A">A</span> ${spLink(a.id)} <span class="faint">·</span> <span class="tag B">B</span> ${spLink(b.id)}<small>${esc(a.growth_form_label)} · ${esc(b.growth_form_label)} — ${p.n_shared} shared knowledge nodes in kg.json · ${p.direct_relations.length} live direct record${p.direct_relations.length === 1 ? '' : 's'} · ${p.retired_relations.length} retired</small></h2>`;
  // 1 shared attributes
  const rows = p.attributes.filter(r => S.groups.has(r.group));
  const nShared = rows.filter(r => r.shared.length).length, nDiff = rows.filter(r => r.only_a.length || r.only_b.length).length, nOne = rows.filter(r => !(r.a_recorded && r.b_recorded)).length;
  h += `<h3><span class="n">1</span> Shared attributes <small>${nShared} facets with a shared value · ${nDiff} with differing values · ${nOne} recorded for one plant only</small></h3><p class="small muted">${esc(M.vocab.pair_sections.shared_attributes)}</p>`;
  h += `<table class="cmp"><tr><th>facet</th><th>A</th><th>B</th></tr>` + rows.map(r => { const cell = (side, only) => !r[side.rec] ? `<td class="nr">not recorded</td>` : `<td>${r.shared.map(c => `<span class="v shared">${esc(r.labels[c])}</span>`).join('')}${r[only].map(c => `<span class="v">${esc(r.labels[c])}</span>`).join('')}${r[side.dis] ? ' <span class="dis warn mono">⚠</span>' : ''}</td>`; const ca = M.attr(a.id, r.facet), cb = M.attr(b.id, r.facet); return `<tr class="f"><td title="${esc(M.GR.get(r.group).label)}">${esc(r.label)}${ca ? ` <span class="link mono" data-inspect="attr=${esc(ca.id)}">A</span>` : ''}${cb ? ` <span class="link mono" data-inspect="attr=${esc(cb.id)}">B</span>` : ''}</td>${cell(A, A.only)}${cell(B, B.only)}</tr>`; }).join('') + `</table><p class="small faint">green = the same concept reached by both plants' claims; ⚠ = sources disagree for that plant; hidden groups follow the table's checkboxes.</p>`;
  // 2 direct relations
  h += `<h3><span class="n">2</span> Direct recorded relationships <small>${p.direct_relations.length} live · ${p.retired_relations.length} retired</small></h3><p class="small muted">${esc(M.vocab.pair_sections.direct_relations)}</p>`;
  h += p.direct_relations.length ? p.direct_relations.map(id => { const r = M.RE.get(id); return `<div class="row" data-inspect="relation=${esc(id)}"><div class="b">${esc(human(r.type))} ${r.direction ? `<span class="faint">(${esc(r.direction)})</span>` : ''} ${tag(r.kg_status)} ${tag(r.status)} ${r.placeholder ? tag('model placeholder') : ''}<div class="meta">${esc(M.source(r.source_id).label)} · ${esc((r.text || '').slice(0, 140))}${(r.text || '').length > 140 ? '…' : ''}</div></div></div>`; }).join('') : `<p class="small"><b>None recorded.</b> relations.json holds no live record for this pair — an honest absence, not evidence of incompatibility.</p>`;
  if (p.retired_relations.length) h += `<details><summary>retired records (${p.retired_relations.length}) — history, not evidence</summary>${p.retired_relations.map(id => { const r = M.RE.get(id); return `<div class="row" data-inspect="relation=${esc(id)}"><div class="b">${esc(human(r.type))} ${tag('retired')} <span class="faint small">${esc(r.source_id)}</span><div class="meta">${esc(r.retired_reason || r.note || '')}</div></div></div>`; }).join('')}</details>`;
  // 3 spatial complementarity
  const c = p.complementarity; const combos = c.combinations.slice().sort((x, y) => (y.different_layer - x.different_layer) || (x.a_function + x.b_function).localeCompare(y.a_function + y.b_function));
  h += `<h3><span class="n">3</span> Potential spatial complementarity <small>${combos.length} combination${combos.length === 1 ? '' : 's'} · ${c.same_function.length} shared function${c.same_function.length === 1 ? '' : 's'}</small></h3><p class="small muted">${esc(M.vocab.pair_sections.spatial_complementarity)}</p>`;
  h += `<p class="small"><span class="tag A">A</span> ${c[A.fns].length ? c[A.fns].map(fid => { const l = M.link(A.id, fid); return `<span class="chip" data-inspect="link=${esc(l.id)}">${esc(M.name(fid))}<small>${esc(l.status)}${l.conflict ? ' · conflict' : ''}</small></span>`; }).join('') : '<span class="faint">no function linked</span>'}<br><span class="tag B">B</span> ${c[B.fns].length ? c[B.fns].map(fid => { const l = M.link(B.id, fid); return `<span class="chip" data-inspect="link=${esc(l.id)}">${esc(M.name(fid))}<small>${esc(l.status)}${l.conflict ? ' · conflict' : ''}</small></span>`; }).join('') : '<span class="faint">no function linked</span>'}</p>`;
  h += combos.length ? combos.map(x => `<div class="combo"><span class="fn a">A · ${esc(M.name(x[A.fn]))}</span><span class="plus">+</span><span class="fn b">B · ${esc(M.name(x[B.fn]))}</span><span class="small faint">${x.different_layer ? 'different layers — a layering hypothesis' : 'same layer — an arrangement hypothesis'}${x[A.st] === 'candidate' || x[B.st] === 'candidate' ? ' · rests on a candidate link' : ''}${x[A.cf] || x[B.cf] ? ' · a link carries a conflict' : ''}</span></div>`).join('') : `<p class="small faint">No distinct function combination: the plants' live links allow no layering hypothesis.</p>`;
  if (c.same_function.length) h += `<p class="small muted">Both are linked to ${esc(c.same_function.map(f => M.name(f)).join(', '))} — alternatives for the same role, not a complement.</p>`;
  h += `<div class="note">${esc(c.note)}. Site, spacing and the plants' behaviour with each other are not in these links.</div>`;
  // 4 evidence / unknowns
  const claimsOf = id => Object.values(M.claims).filter(x => x.plant === M.sp(id).slug && x.status !== 'retired');
  const ca = claimsOf(a.id), cb = claimsOf(b.id); const srcs = id => [...new Set(claimsOf(id).map(x => x.source_id))];
  const nrA = M.facets.filter(f => !M.attr(a.id, f.id)).map(f => f.label), nrB = M.facets.filter(f => !M.attr(b.id, f.id)).map(f => f.label);
  const chk = cl => { const n = {}; for (const x of cl) n[x.evidence_check] = (n[x.evidence_check] || 0) + 1; return Object.entries(n).map(([k, v]) => `${esc(human(k))} ${v}`).join(' · '); };
  h += `<h3><span class="n">4</span> Evidence and unknowns</h3><p class="small muted">${esc(M.vocab.pair_sections.evidence_unknowns)}</p>`;
  h += `<table class="cmp"><tr><th></th><th>A</th><th>B</th></tr><tr><td>claims cited here</td><td>${ca.length} (${ca.filter(x => x.status === 'verified').length} verified)</td><td>${cb.length} (${cb.filter(x => x.status === 'verified').length} verified)</td></tr><tr><td>sources</td><td class="small">${srcs(a.id).map(sourceLine).join('<br>')}</td><td class="small">${srcs(b.id).map(sourceLine).join('<br>')}</td></tr><tr><td>AI evidence checks</td><td class="small">${chk(ca)}</td><td class="small">${chk(cb)}</td></tr><tr><td>functions unknown</td><td class="small">${c[A.unk].map(f => M.name(f)).join(', ') || '—'}</td><td class="small">${c[B.unk].map(f => M.name(f)).join(', ') || '—'}</td></tr><tr><td>facets not recorded</td><td class="small">${esc(nrA.join(', ') || '—')}</td><td class="small">${esc(nrB.join(', ') || '—')}</td></tr><tr><td>attribute disagreements</td><td class="small">${M.attrs.filter(x => x.species === a.id && x.disagreement.length).map(x => `<span class="link" data-inspect="attr=${esc(x.id)}">${esc(M.FA.get(x.facet).label)}</span>`).join(', ') || '—'}</td><td class="small">${M.attrs.filter(x => x.species === b.id && x.disagreement.length).map(x => `<span class="link" data-inspect="attr=${esc(x.id)}">${esc(M.FA.get(x.facet).label)}</span>`).join(', ') || '—'}</td></tr></table>`;
  h += `<p class="small faint">Human review decisions on these claims: none recorded in this projection (the Review Workbench keeps them privately; nothing is verified by the AI). Behaviour of the two plants with each other: ${M.relationsBetween(a.id, b.id).some(r => r.type === 'competes' || r.type === 'companion' || r.type === 'co_occurs_with') ? 'see the record above' : 'no record'}.</p>`;
  return h;
}
