#!/usr/bin/env python3
"""
Unified review checklist for a plant: unverified non-model claims grouped BY FIELD, with
every claim on that field (including already-verified ones) side by side in one table, so
disagreements are reviewed together.
  python3 -I tools/review_list.py acer-palmatum   -> review/acer-palmatum-<today>.md
Tick = keep as verified; cross = reject. Then: tools/verify_claims.py plants/<id>.json --by Kay <ids…>
"""
import json, os, sys
from datetime import date
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)

def short(v):
    s = json.dumps(v, ensure_ascii=False)
    return s if len(s) <= 90 else s[:87] + "…"

def main(pid):
    plant = json.load(open(os.path.join(ROOT, "plants", f"{pid}.json"), encoding="utf-8"))
    schema = json.load(open(os.path.join(ROOT, "schema.json"), encoding="utf-8"))
    S = {s["id"]: s for s in json.load(open(os.path.join(ROOT, "sources.json"), encoding="utf-8"))["sources"]}
    live = [c for c in plant["claims"] if c.get("status") != "retired" and c.get("source_type") != "model"]
    unv = [c for c in live if c.get("status") == "unverified"]
    used = sorted({c["source_id"] for c in unv})
    L = [f"# Review: *{plant['entity']['scientific_name']}* — {len(unv)} unverified claims on {len({c['field'] for c in unv})} fields · {date.today().isoformat()}", "",
         "Grouped by field; every live claim on the field is shown (verified ones too) so values can be compared side by side. Tick the id to keep as verified, strike it to reject. Then:", "",
         "```bash", f"python3 -I tools/verify_claims.py plants/{pid}.json --by Kay <ids…>     # or --source rhs", "```", "",
         "Values are structured only; `text` was written from the value, never copied. *mapping* flags where a source term was forced into the KPU vocabulary.",
         "KPU (tier C) is linked from the entity only; none of its values are stored, even where its page shows a figure that disagrees with the sources below (D2).", "",
         "## Sources in this review", ""]
    for sid in used:
        s = S.get(sid, {})
        L.append(f"- **{s.get('name', sid)}** (`{sid}`, tier {s.get('licence_tier', '?')}, checked {s.get('licence_checked', '?')}): {s.get('licence', '')[:220]}{'…' if len(s.get('licence', '')) > 220 else ''}")
    L.append("")
    for tier in ("gate", "compare", "extended"):
        fields = [f for f in schema["field_tiers"][tier]["fields"] if any(c["field"] == f for c in unv)]
        if not fields: continue
        L += [f"## {tier}", ""]
        for f in fields:
            cs = sorted([c for c in live if c["field"] == f], key=lambda c: (c.get("status") != "verified", c["source_type"], c["source_id"]))
            L += [f"### {f}", "", "| review | source | value | conf | context | mapping / note |", "|---|---|---|---|---|---|"]
            for c in cs:
                tick = "✅ verified" if c.get("status") == "verified" else f"[ ] `{c['id']}`"
                src = S.get(c["source_id"], {}).get("name", c["source_id"]).split(" — ")[0].split(" (")[0]
                L.append(f"| {tick} | {src} | {short(c['value'])} | {c.get('confidence', '')} | {c.get('context', '')[:70]} | {(c.get('note') or '')[:140]} |")
            L.append("")
            for c in cs:
                if c.get("status") == "unverified": L.append(f"- `{c['id']}` — {c['text']}")
            L.append("")
    out = os.path.join(ROOT, "review", f"{pid}-{date.today().isoformat()}.md")
    os.makedirs(os.path.dirname(out), exist_ok=True); open(out, "w", encoding="utf-8").write("\n".join(L))
    return out, len(unv)

if __name__ == "__main__":
    out, n = main(sys.argv[1]); print(n, "unverified ->", out)
