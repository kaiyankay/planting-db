#!/usr/bin/env python3
"""
iNaturalist aggregate pull for the Greater Vancouver place (methods M13). Writes data/inat/greater_vancouver_<date>.json
in the same shape as the 2026-10-29 file so tools/inat_to_claims.py can read it.

  python3 -I tools/inat_fetch.py                       # every plant in plants/ with an iNat taxon id below
  python3 -I tools/inat_fetch.py cornus-sericea …      # chosen plants

Stored per plant: taxon id, licensed verifiable count, licensed research-grade count, count under any licence, month-of-year
histogram, Plant Phenology annotation histograms (term 12: flowering 13, fruiting 14), observations by year.
Never stored: observation ids, usernames, coordinates, photos. Filters: place 27530, verifiable=true,
license=cc0,cc-by,cc-by-nc (tier B, sources.json inat). One request per second (iNat API etiquette). urllib only.
"""
import json, os, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
API = "https://api.inaturalist.org/v1"
PLACE = 27530
PLACE_NAME = "Greater Vancouver, BC (iNaturalist place 27530)"
LICENCE = "cc0,cc-by,cc-by-nc"
# taxon ids looked up with /v1/taxa?q=<name>&rank=species on 2026-11-02 and checked against the scientific name
TAXA = {"acer-palmatum": 63512, "vaccinium-ovatum": 48349, "gaultheria-shallon": 48441, "cercidiphyllum-japonicum": 133356,
        "cornus-nuttallii": 76447, "cornus-sericea": 53387, "arctostaphylos-uva-ursi": 68049, "polystichum-munitum": 47751,
        "achillea-millefolium": 52821, "gaillardia-aristata": 77183}


def get(path, **params):
    url = f"{API}{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "planting-db/0.1 (ARCH540 UBC; aggregate counts only)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        out = json.loads(r.read().decode("utf-8"))
    time.sleep(1.0)
    return out


def months(h):
    m = (h.get("results") or {}).get("month_of_year") or {}
    return {str(i): int(m.get(str(i), 0)) for i in range(1, 13)}


def pull(pid, taxon):
    base = dict(place_id=PLACE, taxon_id=taxon, verifiable="true")
    lic = dict(base, license=LICENCE)
    name = get("/taxa/" + str(taxon))["results"][0]["name"]
    out = {"taxon_id": taxon, "taxon_name_checked": name,
           "licensed_verifiable": get("/observations", per_page=0, **lic)["total_results"],
           "licensed_research_grade": get("/observations", per_page=0, quality_grade="research", **lic)["total_results"],
           "all_verifiable_any_licence": get("/observations", per_page=0, **base)["total_results"],
           "by_month": months(get("/observations/histogram", date_field="observed", interval="month_of_year", **lic)),
           "flowering_annotated_by_month": months(get("/observations/histogram", date_field="observed", interval="month_of_year", term_id=12, term_value_id=13, **lic)),
           "fruiting_annotated_by_month": months(get("/observations/histogram", date_field="observed", interval="month_of_year", term_id=12, term_value_id=14, **lic)),
           "by_year": {k: int(v) for k, v in sorted(((get("/observations/histogram", date_field="observed", interval="year", **lic).get("results") or {}).get("year") or {}).items())}}
    return out


if __name__ == "__main__":
    want = [a for a in sys.argv[1:] if not a.startswith("--")] or [p[:-5] for p in sorted(os.listdir(os.path.join(ROOT, "plants"))) if p.endswith(".json")]
    fetched = datetime.now(timezone.utc).isoformat(timespec="seconds")
    d = {"fetched_at": fetched, "place_id": PLACE, "place_name": PLACE_NAME, "licence_filter": LICENCE, "note": "aggregate counts only; verifiable observations; no record ids, usernames or photos retained", "plants": {}}
    for pid in want:
        if pid not in TAXA:
            print(f"skip {pid}: no taxon id in TAXA (look it up with /v1/taxa and add it)", file=sys.stderr); continue
        d["plants"][pid] = pull(pid, TAXA[pid]); p = d["plants"][pid]
        print(f"{pid:28} taxon {p['taxon_id']} ({p['taxon_name_checked']}): {p['licensed_verifiable']} licensed verifiable, {p['licensed_research_grade']} research grade, {p['all_verifiable_any_licence']} any licence; flowering annotations {sum(p['flowering_annotated_by_month'].values())}, fruiting {sum(p['fruiting_annotated_by_month'].values())}")
    path = os.path.join(ROOT, "data", "inat", f"greater_vancouver_{fetched[:10]}.json")
    json.dump(d, open(path, "w", encoding="utf-8"), indent=2)
    print("->", path)
