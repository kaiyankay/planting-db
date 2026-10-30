#!/usr/bin/env python3
"""
T7 view 4 — coverage matrix: fields × plants, cell = number of independent sources
(distinct non-model, non-retired source_id). Hatched when any claim in the cell is still
unverified; a thin outline when the only claims are retired placeholders. Cells link to
viz/index.html?plant=<id>#<field>. This matrix is the entry point for the unified review.
  python3 -I tools/build_coverage.py   -> viz/coverage.html
"""
import json, os
from datetime import date
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
L = lambda n: json.load(open(os.path.join(ROOT, n), encoding="utf-8"))

def main():
    schema = L("schema.json"); pdir = os.path.join(ROOT, "plants")
    plants = [L(os.path.join("plants", f)) for f in sorted(os.listdir(pdir)) if f.endswith(".json")]
    rows = []; totals = {p["entity"]["id"]: {"src": set(), "unv": 0, "claims": 0} for p in plants}
    for tier in ("gate", "compare", "extended"):
        for fname in schema["field_tiers"][tier]["fields"]:
            cells = []
            for p in plants:
                pid = p["entity"]["id"]
                cs = [c for c in p["claims"] if c["field"] == fname]
                live = [c for c in cs if c.get("status") != "retired" and c.get("source_type") != "model"]
                srcs = {c["source_id"] for c in live}
                unv = sum(1 for c in live if c.get("status") == "unverified")
                ver = sum(1 for c in live if c.get("status") == "verified")
                cells.append({"n": len(srcs), "claims": len(live), "unverified": unv, "verified": ver, "retired_only": bool(cs) and not live, "sources": sorted(srcs)})
                totals[pid]["src"] |= srcs; totals[pid]["unv"] += unv; totals[pid]["claims"] += len(live)
            rows.append({"tier": tier, "field": fname, "cells": cells})
    mx = max((c["n"] for r in rows for c in r["cells"]), default=1)
    ids = [p["entity"]["id"] for p in plants]; names = [p["entity"]["scientific_name"] for p in plants]
    def cell(pid, r, c):
        if c["n"] == 0:
            cls = "c0 retired" if c["retired_only"] else "c0"
            return f'<td class="{cls}"><a href="index.html?plant={pid}#{r["field"]}" title="{"placeholder only (retired)" if c["retired_only"] else "no sourced claim"}">{"·" if c["retired_only"] else ""}</a></td>'
        lvl = min(4, 1 + int(3 * (c["n"] - 1) / max(mx - 1, 1)))
        hatch = " hatch" if c["unverified"] else ""
        tip = f'{c["n"]} source(s): {", ".join(c["sources"])} · {c["claims"]} claims · {c["unverified"]} unverified, {c["verified"]} verified'
        return f'<td class="c{lvl}{hatch}"><a href="index.html?plant={pid}#{r["field"]}" title="{tip}">{c["n"]}</a></td>'
    body = ""
    for tier in ("gate", "compare", "extended"):
        body += f'<tr class="tier"><th colspan="{len(ids)+1}">{tier}</th></tr>'
        for r in rows:
            if r["tier"] != tier: continue
            body += f'<tr><th>{r["field"].replace("_", " ")}</th>' + "".join(cell(pid, r, c) for pid, c in zip(ids, r["cells"])) + "</tr>"
    foot = "<tr class=\"tot\"><th>independent sources (all fields)</th>" + "".join(f"<td>{len(totals[pid]['src'])}</td>" for pid in ids) + "</tr>"
    foot += "<tr class=\"tot\"><th>claims live / unverified</th>" + "".join(f"<td>{totals[pid]['claims']} / {totals[pid]['unv']}</td>" for pid in ids) + "</tr>"
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Coverage matrix</title>
<style>
:root{{--bg:#f6f4ee;--panel:#fffdf8;--ink:#1d1b16;--muted:#6b665b;--line:#e2ddd1;--accent:#2f5d3a;--c1:#dfe9df;--c2:#b9d2bd;--c3:#8ab794;--c4:#4f8a5f;--hatch:rgba(0,0,0,.28)}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--bg:#171613;--panel:#1f1e1a;--ink:#ece8df;--muted:#a39d90;--line:#33312b;--accent:#7fb58a;--c1:#2a3a2d;--c2:#35503a;--c3:#4a7352;--c4:#6fa37a;--hatch:rgba(255,255,255,.3)}}}}
:root[data-theme="dark"]{{--bg:#171613;--panel:#1f1e1a;--ink:#ece8df;--muted:#a39d90;--line:#33312b;--accent:#7fb58a;--c1:#2a3a2d;--c2:#35503a;--c3:#4a7352;--c4:#6fa37a;--hatch:rgba(255,255,255,.3)}}
body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 -apple-system,"Segoe UI",Inter,Helvetica,Arial,sans-serif}}
.wrap{{max-width:980px;margin:0 auto;padding:28px 16px 60px}}
h1{{font:italic 400 34px/1.1 "Iowan Old Style","Palatino Linotype",Georgia,serif;margin:0 0 4px}} h1 small{{display:block;font:500 12px/1.3 -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;font-style:normal}}
p.lead{{color:var(--muted);max-width:720px;margin:0 0 18px}}
table{{border-collapse:separate;border-spacing:3px;width:100%;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px}}
th{{text-align:left;font-weight:500;font-size:13px;padding:4px 8px;color:var(--ink)}}
thead th{{font-style:italic;font-size:14px;vertical-align:bottom}}
tr.tier th{{font:600 11px/1 -apple-system,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding-top:14px}}
td{{width:120px;height:34px;border-radius:5px;text-align:center;font-weight:600;font-size:14px;position:relative;background:var(--c1)}}
td a{{display:block;line-height:34px;color:inherit;text-decoration:none}}
td.c0{{background:transparent;border:1px dashed var(--line);font-weight:400;color:var(--muted)}} td.c0.retired{{border-style:dotted}}
td.c1{{background:var(--c1)}} td.c2{{background:var(--c2)}} td.c3{{background:var(--c3);color:#fff}} td.c4{{background:var(--c4);color:#fff}}
td.hatch{{background-image:repeating-linear-gradient(45deg,transparent 0 6px,var(--hatch) 6px 8px)}}
tr.tot td{{background:transparent;font-weight:500;color:var(--muted);border-top:1px solid var(--line);border-radius:0}}
.legend{{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--muted);margin:12px 0 0}} .legend i{{display:inline-block;width:22px;height:14px;border-radius:3px;vertical-align:-2px;margin-right:5px}}
footer{{margin-top:30px;color:var(--muted);font-size:12px}}
</style></head><body><div class="wrap">
<h1><small>Planting Intelligence · coverage matrix</small>fields × plants</h1>
<p class="lead">Each cell counts independent sources behind a field (distinct non-model sources, retired claims excluded). Hatching means at least one claim there is still unverified — the review entry point. Click a cell to open the claims in the entry view.</p>
<table><thead><tr><th></th>{"".join(f"<th>{n}</th>" for n in names)}</tr></thead><tbody>{body}{foot}</tbody></table>
<div class="legend"><span><i style="background:var(--c1)"></i>1 source</span><span><i style="background:var(--c4)"></i>{mx} sources</span><span><i style="background:var(--c2);background-image:repeating-linear-gradient(45deg,transparent 0 6px,var(--hatch) 6px 8px)"></i>has unverified claims</span><span><i style="border:1px dashed var(--line)"></i>no sourced claim</span><span><i style="border:1px dotted var(--line)"></i>placeholder only (retired)</span></div>
<footer>Built {date.today().isoformat()} from plants/*.json · schema {schema["$schema_version"]} · <a href="index.html">entry view</a></footer>
</div></body></html>"""
    out = os.path.join(ROOT, "viz", "coverage.html"); open(out, "w", encoding="utf-8").write(html); return out

if __name__ == "__main__":
    print("->", main())
