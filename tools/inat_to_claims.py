#!/usr/bin/env python3
"""
iNaturalist aggregate counts -> claims (methods M13). Reads data/inat/<file>.json written
by the pull script (aggregate only). Emits, per plant:
  vancouver_context  licensed verifiable observation count (+ research grade, year span)   conf 0.60
  vancouver_context  observations by month (observer effort, NOT plant activity)            conf 0.55, only if n >= MIN_MONTHS_N
  seasonal_interest  flowering_months / fruiting months from phenology annotations          conf 0.50, only if annotated n >= MIN_PHENOLOGY_N
Usage: python3 -I tools/inat_to_claims.py <plant-id> [--merge]
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data", "inat", "greater_vancouver_2026-10-29.json")
MIN_PHENOLOGY_N = 20      # M13 (to confirm)
MIN_MONTHS_N = 100        # M13 (to confirm)
MONTH_SHARE = 0.10        # a month counts as a flowering/fruiting month at >= 10 % of annotated observations
CONF = {"count": 0.60, "effort": 0.55, "phenology": 0.50}
URL = "https://www.inaturalist.org/observations?place_id={place}&taxon_id={taxon}&verifiable=true&license=cc0,cc-by,cc-by-nc"

def build(pid):
    d = json.load(open(DATA, encoding="utf-8")); p = d["plants"][pid]
    date = d["fetched_at"][:10]
    url = URL.format(place=d["place_id"], taxon=p["taxon_id"])
    ctx = f"{d['place_name']}; iNaturalist verifiable observations licensed CC0/CC-BY/CC-BY-NC, pulled {date}"
    n = 0; out = []
    def add(field, value, kind, text, conf, context, note=None):
        nonlocal n; n += 1
        c = {"id": f"{pid}:{field}:inat{n:02d}", "plant": pid, "field": field, "value": value, "value_kind": kind, "text": text,
             "source_id": "inat", "source_type": "database", "context": context, "confidence": conf, "status": "unverified",
             "recorded_at": date, "recorded_by": "inat_to_claims.py", "claim_kind": "attribute", "accessed": date, "source_url": url,
             "attribution": "iNaturalist community observations, CC0/CC-BY/CC-BY-NC, via api.inaturalist.org"}
        if note: c["note"] = note
        out.append(c)
    yrs = sorted(int(y[:4]) for y, v in p["by_year"].items() if v)
    add("vancouver_context", {"licensed_verifiable_observations": p["licensed_verifiable"], "research_grade": p["licensed_research_grade"], "all_licences": p["all_verifiable_any_licence"], "years": [yrs[0], yrs[-1]] if yrs else None},
        "quantitative", f"iNaturalist holds {p['licensed_verifiable']} openly licensed verifiable observations of this plant in Greater Vancouver ({p['licensed_research_grade']} research grade), recorded {yrs[0]}–{yrs[-1]}." if yrs else f"iNaturalist holds {p['licensed_verifiable']} openly licensed verifiable observations of this plant in Greater Vancouver.",
        CONF["count"], ctx, note="presence evidence; observation counts reflect observer effort as much as abundance")
    if p["licensed_verifiable"] >= MIN_MONTHS_N:
        add("vancouver_context", {"observations_by_month": p["by_month"], "n": p["licensed_verifiable"], "unit": "observations"}, "quantitative",
            f"Monthly spread of {p['licensed_verifiable']} Greater Vancouver observations: most in " + ", ".join(f"{m}" for m, _ in sorted(p["by_month"].items(), key=lambda kv: -kv[1])[:3]) + " (month numbers).",
            CONF["effort"], ctx, note="observer effort, not plant activity — the plant is evergreen/visible year-round; use for 'when people notice it', not phenology")
    for key, label, slot in [("flowering_annotated_by_month", "flowering", "flowering_months"), ("fruiting_annotated_by_month", "fruiting", "fruiting_months")]:
        hist = p[key]; tot = sum(hist.values())
        if tot >= MIN_PHENOLOGY_N:
            months = [int(m) for m, v in hist.items() if v / tot >= MONTH_SHARE]
            add("seasonal_interest", {slot: months, "annotated_n": tot, "share_threshold": MONTH_SHARE}, "quantitative",
                f"iNaturalist phenology annotations in Greater Vancouver (n={tot}) put {label} mainly in months {', '.join(map(str, months))}.",
                CONF["phenology"], ctx + "; community Plant Phenology annotations", note=f"month included when >= {int(MONTH_SHARE*100)}% of annotated observations; annotations are volunteer-made")
    return out

if __name__ == "__main__":
    pid = sys.argv[1]; claims = build(pid)
    for c in claims: print(" -", c["id"], "|", c["text"][:110])
    if "--merge" in sys.argv:
        sys.path.insert(0, HERE); from merge_claims import merge_claims
        r = merge_claims(os.path.join(ROOT, "plants", f"{pid}.json"), claims)
        print({k: v for k, v in r.items() if v})
        sys.exit(1 if r["errors"] else 0)
