#!/usr/bin/env python3
"""
T1 (part 1): fetch City of Vancouver "Public trees" for one genus/species
via the OpenDataSoft Explore API v2.1, and write:

  data/cov_trees/snapshot.json             catalog metadata (data_processed etc.)
  data/cov_trees/<genus>_all.csv           full genus export (reuse for later species)
  data/cov_trees/<genus>_<species>.csv     species subset
  data/cov_trees/<genus>_facets.json       species x cultivar counts within the genus
  data/cov_trees/genus_facets.json         genus counts over the whole dataset
  data/cov_trees/<genus>_<species>_summary.json
                                           distribution stats the claims step reads

No API key, no third-party deps (urllib + csv + json + statistics only).
Claims generation (cov_trees_to_claims) is a separate step that needs schema.json.

Usage:
  python3 -I tools/cov_trees_fetch.py --genus ACER --species PALMATUM
"""
import argparse, csv, io, json, os, statistics, sys, urllib.parse, urllib.request
from datetime import datetime, timezone

BASE = "https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/public-trees"
LICENCE_ID = "OGL-Vancouver"  # Open Government Licence - Vancouver


def get(url, params=None, timeout=120):
    if params:
        url = url + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "planting-db/0.1 (ARCH540 UBC)"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def get_json(url, params=None):
    return json.loads(get(url, params).decode("utf-8"))


def fetch_snapshot():
    d = get_json(BASE)
    m = d.get("metas", {}).get("default", {})
    return {
        "dataset_id": d.get("dataset_id"),
        "title": m.get("title"),
        "publisher": m.get("publisher"),
        "licence": m.get("license"),
        "licence_url": m.get("license_url"),
        "licence_id": LICENCE_ID,
        "data_processed": m.get("data_processed"),
        "modified": m.get("modified"),
        "records_count": m.get("records_count"),
        "fields": [f["name"] for f in d.get("fields", [])],
        "api": BASE,
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


def export_csv(where):
    raw = get(BASE + "/exports/csv", {"where": where, "delimiter": ",", "use_labels": "false"})
    return raw.decode("utf-8-sig")  # strip BOM


def group_counts(where, group_by, limit=100):
    out = []
    offset = 0
    while True:
        d = get_json(BASE + "/records", {
            "where": where, "group_by": group_by,
            "select": "count(*) as n", "order_by": "n desc",
            "limit": limit, "offset": offset,
        })
        rows = d.get("results", [])
        out.extend(rows)
        if len(rows) < limit:
            break
        offset += limit
        if offset >= 10000:  # API caps offset+limit at 10000
            break
    return out


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def q(vals, p):
    if not vals:
        return None
    s = sorted(vals)
    k = (len(s) - 1) * p
    f = int(k)
    c = min(f + 1, len(s) - 1)
    return round(s[f] + (s[c] - s[f]) * (k - f), 2)


def dist(vals):
    vals = [v for v in vals if v is not None]
    if not vals:
        return {"n": 0}
    return {
        "n": len(vals),
        "min": min(vals), "p10": q(vals, .10), "p25": q(vals, .25),
        "median": round(statistics.median(vals), 2), "mean": round(statistics.fmean(vals), 2),
        "p75": q(vals, .75), "p90": q(vals, .90), "p95": q(vals, .95), "max": max(vals),
    }


def summarise(rows, snapshot, genus, species):
    cultivars, areas = {}, {}
    heights, diams = [], []
    by_cultivar = {}
    for r in rows:
        cv = (r.get("cultivar_name") or "NONE").strip() or "NONE"
        cultivars[cv] = cultivars.get(cv, 0) + 1
        la = (r.get("local_area") or "").strip() or "(blank)"
        areas[la] = areas.get(la, 0) + 1
        h, d = num(r.get("height_m")), num(r.get("diameter_cm"))
        heights.append(h); diams.append(d)
        bc = by_cultivar.setdefault(cv, {"h": [], "d": []})
        bc["h"].append(h); bc["d"].append(d)

    # "established" trees: diameter >= 20 cm. Rough proxy for maturity since
    # the current snapshot has no date_planted; threshold is a choice, revisit.
    est_h = [h for h, d in zip(heights, diams) if h is not None and d is not None and d >= 20]

    return {
        "genus": genus, "species": species,
        "n_records": len(rows),
        "snapshot": {k: snapshot[k] for k in ("data_processed", "modified", "records_count", "licence", "licence_id", "fetched_at")},
        "fields_present": snapshot["fields"],
        "date_planted_available": "date_planted" in snapshot["fields"],
        "height_m": dist(heights),
        "diameter_cm": dist(diams),
        "height_m_where_diameter_ge_20cm": dist(est_h),
        "cultivars": dict(sorted(cultivars.items(), key=lambda kv: -kv[1])),
        "cultivar_stats": {cv: {"n": len(v["h"]), "height_m": dist(v["h"]), "diameter_cm": dist(v["d"])}
                           for cv, v in sorted(by_cultivar.items(), key=lambda kv: -len(kv[1]["h"]))
                           if len(v["h"]) >= 10},
        "local_area": dict(sorted(areas.items(), key=lambda kv: -kv[1])),
        "notes": [
            "height_m and diameter_cm are as recorded at last inventory update; measurement date per tree is not published in this snapshot.",
            "The snapshot has no date_planted field, so time_to_intended_size cannot be derived from CoV data alone.",
            "cultivar_name 'NONE' means not recorded, not necessarily the straight species.",
            "height_m is banded, not measured: ~97% of values sit on 4.6/7.6/10.7/13.7/16.8 m, i.e. 15/25/35/45/55 ft class midpoints. Treat as a height class; quote p90 as 'mostly <= 10.7 m class' rather than a precise figure.",
        ],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--genus", required=True)
    ap.add_argument("--species", required=True)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "cov_trees"))
    ap.add_argument("--skip-genus-export", action="store_true", help="reuse existing <genus>_all.csv")
    a = ap.parse_args()
    genus, species = a.genus.upper(), a.species.upper()
    os.makedirs(a.out, exist_ok=True)

    snap = fetch_snapshot()
    with open(os.path.join(a.out, "snapshot.json"), "w") as f:
        json.dump(snap, f, indent=2)
    print(f"snapshot: data_processed={snap['data_processed']} records={snap['records_count']} fields={snap['fields']}")
    if "date_planted" not in snap["fields"]:
        print("WARNING: no date_planted field in this snapshot", file=sys.stderr)

    genus_csv = os.path.join(a.out, f"{genus.lower()}_all.csv")
    if a.skip_genus_export and os.path.exists(genus_csv):
        text = open(genus_csv, encoding="utf-8-sig").read()
        print(f"reusing {genus_csv}")
    else:
        text = export_csv(f'genus_name="{genus}"')
        with open(genus_csv, "w", encoding="utf-8") as f:
            f.write(text)
    genus_rows = list(csv.DictReader(io.StringIO(text)))
    print(f"{genus}: {len(genus_rows)} records -> {genus_csv}")

    sp_rows = [r for r in genus_rows if (r.get("species_name") or "").upper() == species]
    sp_csv = os.path.join(a.out, f"{genus.lower()}_{species.lower()}.csv")
    with open(sp_csv, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=genus_rows[0].keys() if genus_rows else [])
        w.writeheader(); w.writerows(sp_rows)
    print(f"{genus} {species}: {len(sp_rows)} records -> {sp_csv}")

    facets = {
        "genus": genus, "snapshot_data_processed": snap["data_processed"],
        "species": group_counts(f'genus_name="{genus}"', "species_name"),
        "species_cultivar": group_counts(f'genus_name="{genus}"', "species_name,cultivar_name"),
    }
    with open(os.path.join(a.out, f"{genus.lower()}_facets.json"), "w") as f:
        json.dump(facets, f, indent=2)
    print(f"{genus} facets: {len(facets['species'])} species, {len(facets['species_cultivar'])} species x cultivar")

    gf = {"snapshot_data_processed": snap["data_processed"], "genus": group_counts("1=1", "genus_name")}
    with open(os.path.join(a.out, "genus_facets.json"), "w") as f:
        json.dump(gf, f, indent=2)
    print(f"dataset: {len(gf['genus'])} genera")

    summ = summarise(sp_rows, snap, genus, species)
    with open(os.path.join(a.out, f"{genus.lower()}_{species.lower()}_summary.json"), "w") as f:
        json.dump(summ, f, indent=2)
    print(json.dumps({k: summ[k] for k in ("n_records", "height_m", "diameter_cm", "height_m_where_diameter_ge_20cm")}, indent=1))
    print("top cultivars:", list(summ["cultivars"].items())[:8])


if __name__ == "__main__":
    main()
