#!/usr/bin/env python3
"""
T7 view 1 — entry view. All plants in one self-contained file with a switcher; claims
grouped by tier and field, every value with its source chip, confidence, context and
status; several claims on one field sit side by side; model placeholders greyed;
retired claims collapsed; KPU link only.

  python3 -I tools/build_viz.py                 -> viz/index.html   (all plants, switcher; ?plant=<id>#<field> deep links)
  python3 -I tools/build_viz.py acer-palmatum   -> viz/acer-palmatum.html (one plant)

Plant JSON, sources.json and schema field tiers are inlined at build time, so the page
opens from disk with no server and no network.
"""
import json, os, sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)

TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
:root{
  --bg:#f6f4ee; --panel:#fffdf8; --ink:#1d1b16; --muted:#6b665b; --line:#e2ddd1; --line-strong:#c9c2b2;
  --accent:#2f5d3a; --accent-ink:#ffffff;
  --practitioner:#8a3b12; --database:#2f5d3a; --literature:#4a3f8f; --municipal:#1f5f7a; --model:#8c877c;
  --verified:#2f5d3a; --unverified:#9a6b00; --disputed:#9b1c1c; --retired:#8c877c;
  --gate:#1f5f7a; --compare:#4a3f8f; --extended:#8a3b12;
  --mono:"SF Mono",Menlo,Consolas,monospace; --sans:-apple-system,"Segoe UI",Inter,Helvetica,Arial,sans-serif; --serif:"Iowan Old Style","Palatino Linotype",Georgia,serif;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --bg:#171613; --panel:#1f1e1a; --ink:#ece8df; --muted:#a39d90; --line:#33312b; --line-strong:#4a4740;
  --accent:#7fb58a; --accent-ink:#0f1a12; --database:#7fb58a; --practitioner:#e08a5a; --literature:#a89cf0; --municipal:#7cb6cf; --model:#7d786e;
  --verified:#7fb58a; --unverified:#e0b454; --disputed:#ef7676; --retired:#7d786e; --gate:#7cb6cf; --compare:#a89cf0; --extended:#e08a5a;
}}
:root[data-theme="dark"]{
  --bg:#171613; --panel:#1f1e1a; --ink:#ece8df; --muted:#a39d90; --line:#33312b; --line-strong:#4a4740;
  --accent:#7fb58a; --accent-ink:#0f1a12; --database:#7fb58a; --practitioner:#e08a5a; --literature:#a89cf0; --municipal:#7cb6cf; --model:#7d786e;
  --verified:#7fb58a; --unverified:#e0b454; --disputed:#ef7676; --retired:#7d786e; --gate:#7cb6cf; --compare:#a89cf0; --extended:#e08a5a;
}
*{box-sizing:border-box} html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 var(--sans)}
a{color:var(--accent)}
.wrap{max-width:1180px;margin:0 auto;padding:28px 16px 80px}
header{display:flex;flex-wrap:wrap;gap:18px 32px;align-items:flex-end;border-bottom:1px solid var(--line-strong);padding-bottom:18px;margin-bottom:10px}
h1{font:italic 400 40px/1.05 var(--serif);margin:0;letter-spacing:-.01em}
h1 small{display:block;font:500 13px/1.3 var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;font-style:normal}
.meta{display:flex;flex-wrap:wrap;gap:6px 10px;color:var(--muted);font-size:13px}
.meta b{color:var(--ink);font-weight:600}
.kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:18px 0 6px}
.kpi div{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 12px}
.kpi .n{font:600 26px/1 var(--serif);display:block;margin-bottom:4px}
.kpi .l{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:var(--muted);margin:14px 0 4px}
.legend span::before{content:"";display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px;background:var(--c)}
.toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0 22px;font-size:13px}
.toolbar label{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:999px;padding:4px 10px;background:var(--panel);cursor:pointer}
.toolbar input{margin:0}
h2.tier{font:500 13px/1 var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--tier);margin:34px 0 4px;display:flex;align-items:center;gap:10px}
h2.tier::after{content:"";flex:1;height:1px;background:var(--line)}
.tier-desc{color:var(--muted);font-size:13px;margin:0 0 14px;max-width:760px}
.field{display:grid;grid-template-columns:200px 1fr;gap:14px;border-top:1px solid var(--line);padding:14px 0}
.field.empty{opacity:.7}
.fname{font-weight:600;font-size:14px}
.fname .k{display:block;color:var(--muted);font-weight:400;font-size:12px;margin-top:3px}
.fname .cnt{display:inline-block;margin-top:6px;font-size:11px;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:1px 7px}
.claims{display:flex;flex-wrap:wrap;gap:10px}
.claim{flex:1 1 260px;max-width:460px;background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--src);border-radius:8px;padding:10px 12px;position:relative}
.claim.model{opacity:.55;border-style:dashed}
.claim.retired{opacity:.4;flex:0 1 220px;font-size:12px}
.claim.disputed{border-color:var(--disputed)}
.val{font:500 17px/1.25 var(--serif);margin:0 0 6px;word-break:break-word}
.val .chips{display:flex;flex-wrap:wrap;gap:4px;font:13px var(--sans)}
.val .chips span{border:1px solid var(--line-strong);border-radius:5px;padding:1px 7px}
.val .kv{font:13px var(--sans);display:grid;grid-template-columns:auto 1fr;gap:1px 10px}
.val .kv b{font-weight:500;color:var(--muted)}
.text{font-size:13px;color:var(--ink);margin:0 0 8px}
.row{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
.src{display:inline-flex;align-items:center;gap:5px;color:var(--src);font-weight:600}
.src::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--src)}
.geo{border:1px solid var(--line);border-radius:999px;padding:0 7px}
.conf{display:inline-flex;align-items:center;gap:5px}
.conf i{display:inline-block;width:56px;height:6px;border-radius:3px;background:var(--line);position:relative;overflow:hidden}
.conf i::after{content:"";position:absolute;inset:0;width:var(--w);background:var(--src)}
.st{font-weight:600;color:var(--st);text-transform:uppercase;letter-spacing:.05em;font-size:10.5px}
.ctx{font-size:12px;color:var(--muted);margin-top:6px;font-style:italic}
.cv{position:absolute;top:8px;right:10px;font:600 11px var(--sans);color:var(--src);background:var(--bg);border:1px solid var(--line);border-radius:5px;padding:1px 6px}
details.more{margin-top:6px;font-size:12px;color:var(--muted)}
details.more summary{cursor:pointer;list-style:none;color:var(--accent)}
details.more summary::-webkit-details-marker{display:none}
.meta-list{margin:6px 0 0;padding:0;list-style:none;display:grid;grid-template-columns:auto 1fr;gap:2px 10px}
.meta-list b{font-weight:500}
.none{color:var(--muted);font-size:13px;font-style:italic;padding:6px 0}
.hidden{display:none !important}
footer{margin-top:50px;color:var(--muted);font-size:12px;border-top:1px solid var(--line);padding-top:12px}
@media (max-width:720px){.field{grid-template-columns:1fr;gap:8px} h1{font-size:30px} .claim{max-width:none}}
</style>
</head>
<body>
<div class="wrap" id="app"></div>
<script id="data" type="application/json">__DATA__</script>
<script>
const D = JSON.parse(document.getElementById('data').textContent);
const S = Object.fromEntries(D.sources.map(s => [s.id, s]));
const PLANT_IDS = Object.keys(D.plants);
const params = new URLSearchParams(location.search);
let current = PLANT_IDS.includes(params.get('plant')) ? params.get('plant') : PLANT_IDS[0];
let E, C, PCUR;
const TIERS = ['gate','compare','extended'];
const SRC_LABEL = {practitioner:'practitioner', database:'database', literature:'literature', municipal:'municipal', model:'model'};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = n => Number.isInteger(n) ? n : (Math.round(n*100)/100);

function renderValue(v, field){
  if (v === true) return '<p class="val">yes</p>';
  if (v === false) return '<p class="val">no</p>';
  if (typeof v === 'string' || typeof v === 'number') return `<p class="val">${esc(v)}</p>`;
  if (Array.isArray(v)) return `<p class="val"><span class="chips">${v.map(x => `<span>${esc(x)}</span>`).join('')}</span></p>`;
  if (v && typeof v === 'object'){
    if ('min' in v && 'max' in v) return `<p class="val">${fmt(v.min)}–${fmt(v.max)} ${esc(v.unit||'')}${v.measure? ` <span style="font:12px var(--sans);color:var(--muted)">${esc(v.measure)}</span>`:''}</p>`;
    const keys = Object.keys(v).filter(k => !['unit','measure','raw','subset','threshold_dbh_cm'].includes(k));
    const dist = ['n','p10','p25','median','mean','p75','p90','p95','max','min'].filter(k => k in v);
    if (dist.length >= 3){
      const parts = ['median','p10','p90','max'].filter(k => k in v).map(k => `${k} ${fmt(v[k])}`);
      return `<p class="val">${parts.join(' · ')} ${esc(v.unit||'')}<span style="display:block;font:12px var(--sans);color:var(--muted)">n = ${v.n}${v.subset? ' · '+esc(v.subset):''}${v.measure? ' · '+esc(v.measure):''}</span></p>`;
    }
    const rows = keys.map(k => {
      let x = v[k];
      if (x && typeof x === 'object' && !Array.isArray(x)){ const top = Object.entries(x).slice(0,6); x = top.map(([a,b]) => `${a} ${b}`).join(', ') + (Object.keys(x).length>6? ' …':''); }
      else if (Array.isArray(x)) x = x.join(', ');
      else if (x === true) x = 'yes'; else if (x === false) x = 'no'; else if (x == null) x = '—';
      return `<b>${esc(k.replace(/_/g,' '))}</b><span>${esc(x)}</span>`;
    });
    return `<p class="val"><span class="kv">${rows.join('')}</span>${v.unit? `<span style="font:12px var(--sans);color:var(--muted)">${esc(v.unit)}</span>`:''}</p>`;
  }
  return `<p class="val">${esc(JSON.stringify(v))}</p>`;
}

function claimCard(c){
  const src = S[c.source_id] || {name:c.source_id};
  const type = c.source_type;
  const st = c.status || 'unverified';
  const cls = ['claim', type==='model'?'model':'', st==='retired'?'retired':'', st==='disputed'?'disputed':''].join(' ');
  const cv = (c.context||'').match(/cultivar:\s*'?([^;']+)'?/);
  const cvTag = cv ? `<span class="cv">${esc(cv[1].replace(/[()]/g,''))}</span>` : '';
  const meta = c.practitioner_meta;
  const extra = [];
  if (meta){
    extra.push(`<b>completeness</b><span>${esc(meta.completeness||'?')}${meta.citable===false?' · not citable':''}${meta.caveat?' · '+esc(meta.caveat):''}</span>`);
    if (meta.basis) extra.push(`<b>basis</b><span>${esc(meta.basis)}</span>`);
    if (meta.observer_background) extra.push(`<b>who</b><span>${esc(meta.observer_background)}</span>`);
    if (meta.location) extra.push(`<b>location</b><span>${esc(meta.location)}</span>`);
  }
  if (c.note) extra.push(`<b>note</b><span>${esc(c.note)}</span>`);
  if (c.verify_against) extra.push(`<b>verify against</b><span>${esc(c.verify_against.join(', '))}</span>`);
  if (c.retired_by) extra.push(`<b>retired by</b><span>${esc(c.retired_by)}</span>`);
  if (c.derived_from) extra.push(`<b>derived from</b><span>${esc(c.derived_from)}</span>`);
  if (c.source_url) extra.push(`<b>source</b><span><a href="${esc(c.source_url)}" target="_blank" rel="noopener">${esc(c.source_url.replace(/^https?:\/\//,'').slice(0,60))}…</a></span>`);
  if (c.citation) extra.push(`<b>cite</b><span>${esc(c.citation)}</span>`);
  extra.push(`<b>id</b><span style="font-family:var(--mono);font-size:11px">${esc(c.id)}</span>`);
  return `<article class="${cls}" style="--src:var(--${type});--st:var(--${st})" data-status="${st}" data-type="${type}" data-source="${esc(c.source_id)}">
    ${cvTag}
    ${st==='retired' ? `<p class="text" style="margin:0">${esc(c.text)}</p>` : renderValue(c.value, c.field) + `<p class="text">${esc(c.text)}</p>`}
    <div class="row">
      <span class="src">${esc(src.name ? src.name.split(' — ')[0].split(' (')[0] : c.source_id)}</span>
      <span class="geo">${esc(src.geo_specificity||'?')}</span>
      <span class="conf"><i style="--w:${Math.round((c.confidence||0)*100)}%"></i>${(c.confidence||0).toFixed(2)}</span>
      <span class="st">${esc(st)}</span>
      <span>${esc(SRC_LABEL[type]||type)}</span>
    </div>
    <p class="ctx">${esc(c.context||'')}</p>
    ${extra.length ? `<details class="more"><summary>details</summary><ul class="meta-list">${extra.map(x=>`<li style="display:contents">${x}</li>`).join('')}</ul></details>`:''}
  </article>`;
}

function build(){
  PCUR = D.plants[current]; E = PCUR.entity; C = PCUR.claims;
  const byField = {};
  for (const c of C) (byField[c.field] = byField[c.field] || []).push(c);
  const order = {practitioner:0, database:1, literature:2, municipal:3, model:4};
  const geoOrder = {vancouver:0, bc:1, pnw:2, north_america:3, global:4};
  const sortClaims = (a,b) => {
    const ra = a.status==='retired', rb = b.status==='retired'; if (ra!==rb) return ra?1:-1;
    const t = (order[a.source_type]??9) - (order[b.source_type]??9); if (t) return t;
    const g = (geoOrder[(S[a.source_id]||{}).geo_specificity]??9) - (geoOrder[(S[b.source_id]||{}).geo_specificity]??9); if (g) return g;
    return (b.confidence||0) - (a.confidence||0);
  };
  const srcIds = new Set(C.filter(c=>c.source_type!=='model').map(c=>c.source_id));
  const nFields = Object.values(D.tiers).reduce((n,t)=>n+Object.keys(t.fields).length,0);
  const filled = Object.keys(byField).filter(f => byField[f].some(c=>c.source_type!=='model' && c.status!=='retired')).length;
  const disagreements = Object.values(byField).filter(cs => new Set(cs.filter(c=>c.source_type!=='model'&&c.status!=='retired').map(c=>JSON.stringify(c.value))).size > 1).length;
  const refs = Object.entries(E.external_refs||{}).map(([k,v]) => v ? `<a href="${esc(v)}" target="_blank" rel="noopener">${k.toUpperCase()}</a>` : `<span style="color:var(--muted)">${k.toUpperCase()}: not linked</span>`);

  const switcher = PLANT_IDS.length > 1 ? `<select id="plant-switch" style="font:inherit;font-size:14px;padding:4px 8px;border:1px solid var(--line-strong);border-radius:6px;background:var(--panel);color:var(--ink)">${PLANT_IDS.map(id => `<option value="${id}" ${id===current?'selected':''}>${esc(D.plants[id].entity.scientific_name)}</option>`).join('')}</select>` : '';
  let h = `<header>
    <h1><small>Planting Intelligence · entry view ${switcher}</small>${esc(E.scientific_name)}</h1>
    <div class="meta">
      <span><b>${esc((E.common_names?.en||[]).join(', '))}</b>${E.common_names?.zh? ' · '+esc(E.common_names.zh.join(' / ')):''}</span>
      <span>${esc(E.family||'')}</span><span>${esc(E.kpu_plant_type||'')}</span><span>${esc((E.origin_status||'').replace(/_/g,' '))}</span>
      <span>CoV public trees: <b>${E.in_vancouver_street_tree_list===true?'yes':E.in_vancouver_street_tree_list===false?'no':'unknown'}</b></span>
      <span>${refs.join(' · ')} <span style="color:var(--muted)">(KPU: link only, never imported)</span></span>
    </div>
  </header>
  <div class="kpi">
    <div><span class="n">${C.length}</span><span class="l">claims</span></div>
    <div><span class="n">${srcIds.size}</span><span class="l">independent sources</span></div>
    <div><span class="n">${filled}<span style="font-size:14px;color:var(--muted)"> / ${nFields}</span></span><span class="l">fields with a sourced claim</span></div>
    <div><span class="n">${disagreements}</span><span class="l">fields with differing values</span></div>
    <div><span class="n">${C.filter(c=>c.status==='unverified'&&c.source_type!=='model').length}</span><span class="l">awaiting human verification</span></div>
    <div><span class="n">${C.filter(c=>c.source_type==='model'&&c.status==='unverified').length}</span><span class="l">model placeholders active</span></div>
  </div>
  <div class="legend">
    <span style="--c:var(--practitioner)">practitioner</span><span style="--c:var(--database)">database</span><span style="--c:var(--literature)">literature</span><span style="--c:var(--municipal)">municipal</span><span style="--c:var(--model)">model placeholder</span>
    <span style="margin-left:auto">order within a field: source type → geographic specificity → confidence (rule R5)</span>
  </div>
  <div class="toolbar">
    <label><input type="checkbox" id="f-model" checked> show model placeholders</label>
    <label><input type="checkbox" id="f-retired"> show retired</label>
    <label><input type="checkbox" id="f-unverified" checked> show unverified</label>
    <label><input type="checkbox" id="f-empty" checked> show empty fields</label>
    <label>source <select id="f-source"><option value="">all</option>${[...srcIds].map(s=>`<option value="${esc(s)}">${esc((S[s]||{}).name||s)}</option>`).join('')}</select></label>
  </div>`;

  for (const tier of TIERS){
    const t = D.tiers[tier];
    h += `<h2 class="tier" style="--tier:var(--${tier})">${tier}</h2><p class="tier-desc">${esc(t.description||'')}</p>`;
    for (const [fname, fdef] of Object.entries(t.fields)){
      const cs = (byField[fname]||[]).slice().sort(sortClaims);
      const n = cs.filter(c=>c.status!=='retired').length;
      h += `<section class="field ${cs.length?'':'empty'}" data-field="${esc(fname)}">
        <div class="fname">${esc(fname.replace(/_/g,' '))}<span class="k">${esc((fdef.value_kinds||[]).join(' · '))}${fdef.unit?' · '+esc(fdef.unit):''}</span>${cs.length?`<span class="cnt">${n} claim${n===1?'':'s'}</span>`:''}</div>
        <div class="claims">${cs.length ? cs.map(claimCard).join('') : `<p class="none">no claim yet${fdef.fill_from? ' · fill from '+esc(fdef.fill_from.join(', ')):''}</p>`}</div>
      </section>`;
    }
  }
  const custom = (PCUR.custom||[]);
  h += `<h2 class="tier" style="--tier:var(--muted)">custom</h2><p class="tier-desc">${custom.length? '' : 'no custom tags'}</p>`;
  h += `<footer>Built ${esc(D.built)} from plants/${esc(E.id)}.json · sources.json · schema ${esc(D.schema_version)}. Every value is a claim with a source; nothing is merged or averaged (rule R1).</footer>`;
  document.getElementById('app').innerHTML = h;

  const apply = () => {
    const m = document.getElementById('f-model').checked, r = document.getElementById('f-retired').checked, u = document.getElementById('f-unverified').checked, e = document.getElementById('f-empty').checked, s = document.getElementById('f-source').value;
    document.querySelectorAll('.claim').forEach(el => {
      const hide = (!m && el.dataset.type==='model') || (!r && el.dataset.status==='retired') || (!u && el.dataset.status==='unverified' && el.dataset.type!=='model') || (s && el.dataset.source!==s);
      el.classList.toggle('hidden', hide);
    });
    document.querySelectorAll('.field').forEach(f => {
      const vis = f.querySelectorAll('.claim:not(.hidden)').length;
      f.classList.toggle('hidden', vis===0 && (!e || s));
    });
  };
  document.querySelectorAll('.toolbar input, .toolbar select').forEach(x => x.addEventListener('change', apply));
  apply();
  const sw = document.getElementById('plant-switch');
  if (sw) sw.addEventListener('change', e => { current = e.target.value; history.replaceState(null, '', `?plant=${current}`); build(); });
  const target = location.hash && document.querySelector(`.field[data-field="${CSS.escape(location.hash.slice(1))}"]`);
  if (target) { target.scrollIntoView({block:'start'}); target.style.outline = '2px solid var(--accent)'; }
}
build();
</script>
</body>
</html>
"""

def build(plant_ids=None):
    pdir = os.path.join(ROOT, "plants")
    ids = plant_ids or sorted(f[:-5] for f in os.listdir(pdir) if f.endswith(".json"))
    plants = {pid: json.load(open(os.path.join(pdir, f"{pid}.json"), encoding="utf-8")) for pid in ids}
    sources = json.load(open(os.path.join(ROOT, "sources.json"), encoding="utf-8"))["sources"]
    schema = json.load(open(os.path.join(ROOT, "schema.json"), encoding="utf-8"))
    tiers = {k: {"description": v.get("description", ""), "fields": v.get("fields", {})} for k, v in schema["field_tiers"].items() if k != "custom"}
    data = {"plants": plants, "sources": sources, "tiers": tiers, "schema_version": schema["$schema_version"], "built": date.today().isoformat()}
    title = f"{plants[ids[0]]['entity']['scientific_name']} — entry view" if len(ids) == 1 else "Planting Intelligence — entry view"
    html = TEMPLATE.replace("__TITLE__", title).replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
    out = os.path.join(ROOT, "viz", f"{ids[0]}.html" if len(ids) == 1 else "index.html")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    return out

if __name__ == "__main__":
    print("->", build(sys.argv[1:2] or None))
