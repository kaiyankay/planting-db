#!/usr/bin/env python3
"""
T1 (part 2): City of Vancouver "Public trees" -> claims for one plant.

Reads the local snapshot written by tools/cov_trees_fetch.py:
    data/cov_trees/snapshot.json
    data/cov_trees/<genus>_<species>.csv
and writes <plant-id>.cov_claims.json (list of claims following schema.json),
all source_id "cov_trees", source_type "municipal", status "verified".

Usage:
    python3 -I tools/cov_trees_to_claims.py acer-palmatum ACER PALMATUM [--merge]

--merge  appends the claims to plants/<plant-id>.json through tools/merge_claims.py
         (validates first; retires model placeholders on the same fields) and sets
         entity.in_vancouver_street_tree_list if it is still null.

Licence: Open Government Licence – Vancouver (data), so values are stored directly.

Method parameters (see methods.md M1–M4; also sources.json cov_trees.methods):
  - CULTIVAR_MIN_N      a cultivar label with >= this many records gets its own claim
                        group, context "cultivar:'Name'; CoV public trees ...". Smaller
                        labels stay inside the species-level claims and are listed in
                        their note. Unlabelled trees are their own class "(unrecorded)".
  - ESTABLISHED_DBH_CM  trees WITHOUT a planting date: DBH >= this = "established (proxy)".
                        Threshold is written into value and context; confidence 0.65.
  - trees WITH date_planted go into age cohorts instead (confidence 0.75); the two are
                        never combined. (The 2026-10-26 snapshot has no date_planted.)
  - height_m is a banded class (15/25/35/45/55 ft midpoints), not a measurement.
"""
import csv, json, os, statistics, sys
from collections import Counter
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data", "cov_trees")
TODAY = date.today().isoformat()
ESTABLISHED_DBH_CM = 20      # methods.md M2
CULTIVAR_MIN_N = 50          # methods.md M3
ESTABLISHED_MIN_N = 20       # methods.md M2: no established-proxy claim on fewer trees
CONF = {"presence": 0.95, "count": 0.9, "labels": 0.85, "areas": 0.9,
        "height_class": 0.70, "dbh": 0.8, "established_proxy": 0.60, "age_cohort": 0.75}   # methods.md M1, M1a (D4: height-based -0.05)


def num(x):
    try:
        v = float(x)
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None


def q(vals, p):
    vals = sorted(vals)
    if not vals:
        return None
    k = (len(vals) - 1) * p
    lo, hi = int(k), min(int(k) + 1, len(vals) - 1)
    return round(vals[lo] + (vals[hi] - vals[lo]) * (k - lo), 1)


def band_share(heights):
    """share of records sitting on the 15/25/35/45/55 ft class midpoints"""
    grid = {4.6, 7.6, 10.7, 13.7, 16.8}
    return round(sum(1 for h in heights if h in grid) / len(heights), 2) if heights else 0


class Claims:
    def __init__(self, plant, snapshot):
        self.plant, self.snap, self.out, self.n = plant, snapshot, [], {}

    def add(self, field, value, value_kind, text, context, confidence, kind="attribute", **extra):
        self.n[field] = self.n.get(field, 0) + 1
        c = {
            "id": f"{self.plant}:{field}:cov{self.n[field]:02d}",
            "plant": self.plant, "field": field,
            "value": value, "value_kind": value_kind, "text": text,
            "source_id": "cov_trees", "source_type": "municipal",
            "context": context, "confidence": confidence, "status": "verified",
            "recorded_at": TODAY, "recorded_by": "cov_trees_to_claims.py",
            "claim_kind": kind,
            "accessed": self.snap["fetched_at"][:10],
            "source_snapshot": self.snap["data_processed"][:10],
        }
        c.update(extra)
        self.out.append(c)
        return c


def build(plant_id, genus, species):
    snap = json.load(open(os.path.join(DATA, "snapshot.json"), encoding="utf-8"))
    path = os.path.join(DATA, f"{genus.lower()}_{species.lower()}.csv")
    if not os.path.exists(path):
        sys.exit(f"{path} missing — run tools/cov_trees_fetch.py --genus {genus} --species {species} first")
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        sys.exit(f"no rows for {genus} {species}")

    name = f"{genus.title()} {species.lower()}"
    n = len(rows)
    has_dates = "date_planted" in snap["fields"]
    snap_date = snap["data_processed"][:10]
    base_ctx = f"CoV public trees, snapshot {snap_date}; street (boulevard) and park trees only, private trees excluded"
    ctx = "City of Vancouver public tree inventory, data snapshot " + snap_date + "; street (boulevard) and park trees only, private trees excluded"
    C = Claims(plant_id, snap)

    def cv_label(r):
        return (r.get("cultivar_name") or "").strip().upper() or "NONE"

    cultivars = Counter(cv_label(r) for r in rows)
    labelled = {k: v for k, v in cultivars.items() if k != "NONE"}
    big = {k: v for k, v in labelled.items() if v >= CULTIVAR_MIN_N}
    small = {k: v for k, v in labelled.items() if v < CULTIVAR_MIN_N}
    areas = Counter((r.get("local_area") or "").strip() for r in rows if (r.get("local_area") or "").strip())

    # presence ------------------------------------------------------------
    C.add("in_vancouver_street_tree_list", True, "categorical",
          f"{name} is in the City of Vancouver public tree inventory ({n} trees, snapshot {snap_date}).",
          ctx, CONF["presence"])

    # counts and labels -----------------------------------------------------
    C.add("vancouver_context", {"public_trees_count": n, "cultivar_labels_recorded": len(labelled), "unlabelled": cultivars.get("NONE", 0)},
          "quantitative",
          f"The City of Vancouver inventory lists {n} public {name} trees; {cultivars.get('NONE', 0)} carry no cultivar label "
          f"and the rest are spread over {len(labelled)} cultivar names.",
          ctx, CONF["count"])
    top = sorted(labelled.items(), key=lambda kv: -kv[1])[:5]
    if top:
        C.add("vancouver_context", {"cultivar_counts": dict(sorted(labelled.items(), key=lambda kv: -kv[1])), "cultivar_group_threshold_n": CULTIVAR_MIN_N}, "quantitative",
              f"Most frequent cultivar labels for public {name} in Vancouver: " + "; ".join(f"'{k.title()}' ({v})" for k, v in top) + ".",
              ctx, CONF["labels"],
              note=f"labels as recorded by Parks staff; 'NONE' means not recorded, not the straight species. Labels with n >= {CULTIVAR_MIN_N} have their own size claims (context cultivar:'Name'): " + ", ".join(f"'{k.title()}' ({v})" for k, v in sorted(big.items(), key=lambda kv: -kv[1])) + ".")
    if areas:
        top_a = areas.most_common(5)
        C.add("vancouver_context", {"local_area_counts": dict(areas.most_common()), "areas_present": len(areas)}, "quantitative",
              f"Public {name} occur in {len(areas)} of Vancouver's local areas; most in " + ", ".join(f"{k} ({v})" for k, v in top_a) + ".",
              ctx, CONF["areas"])

    # size claims for one subset of rows -------------------------------------------
    def size_claims(subset, label, group_ctx, extra_note=""):
        heights = [h for h in (num(r.get("height_m")) for r in subset) if h]
        dbhs = [d for d in (num(r.get("diameter_cm")) for r in subset) if d]
        undated = subset if not has_dates else [r for r in subset if not (r.get("date_planted") or "").strip()]
        est_h = [h for h, d in ((num(r.get("height_m")), num(r.get("diameter_cm"))) for r in undated) if h and d and d >= ESTABLISHED_DBH_CM]
        if heights:
            share = band_share(heights)
            v = {"n": len(heights), "p10": q(heights, .1), "median": q(heights, .5), "p90": q(heights, .9), "max": max(heights),
                 "unit": "m", "measure": "height class midpoint", "classes_ft": [15, 25, 35, 45, 55]}
            C.add("local_mature_size", v, "quantitative",
                  f"Height class midpoints of {len(heights)} public {label} in Vancouver (15/25/35 ft classes, all ages mixed): "
                  f"median class {v['median']} m, 10th–90th percentile classes {v['p10']}–{v['p90']} m, highest class {v['max']} m.",
                  group_ctx + "; height_m is a banded class (15/25/35/45/55 ft midpoints), not a measurement", CONF["height_class"],
                  note=(f"{int(share*100)}% of records sit on the class grid; treat as a class, not a figure. "
                        f"{'No planting dates in this snapshot, so ages are unknown. ' if not has_dates else ''}"
                        f"max is a single record and may be mis-keyed." + extra_note))
        if est_h and len(est_h) < ESTABLISHED_MIN_N:
            C.out[-1]["note"] += f" Only {len(est_h)} trees reach the established threshold (DBH >= {ESTABLISHED_DBH_CM} cm), below the n >= {ESTABLISHED_MIN_N} needed for a separate established-proxy claim."
        if est_h and len(est_h) >= ESTABLISHED_MIN_N:
            v = {"n": len(est_h), "median": q(est_h, .5), "p90": q(est_h, .9), "max": max(est_h), "unit": "m",
                 "subset": f"established (DBH >= {ESTABLISHED_DBH_CM} cm, proxy)", "threshold_dbh_cm": ESTABLISHED_DBH_CM,
                 "measure": "height class midpoint"}
            C.add("local_mature_size", v, "quantitative",
                  f"Among the {len(est_h)} public {label} in Vancouver counted as established (DBH >= {ESTABLISHED_DBH_CM} cm, proxy), "
                  f"the median height class midpoint is {v['median']} m and the 90th percentile class {v['p90']} m.",
                  group_ctx + f"; established (DBH >= {ESTABLISHED_DBH_CM} cm, proxy) — trees without a planting date, see methods.md M2", CONF["established_proxy"],
                  note="proxy, not a measurement of age: confidence below age-cohort claims. Closest this source gets to 'real mature size under local conditions' (survey c2)." + extra_note)
        if dbhs:
            v = {"n": len(dbhs), "median": q(dbhs, .5), "p90": q(dbhs, .9), "max": max(dbhs), "unit": "cm DBH"}
            C.add("local_mature_size", v, "quantitative",
                  f"Trunk diameters (DBH) of {len(dbhs)} public {label} in Vancouver: median {v['median']} cm, 90th percentile {v['p90']} cm, largest {v['max']} cm.",
                  group_ctx, CONF["dbh"], note="max is a single record and may be mis-keyed." + extra_note)

        # age cohorts: only trees WITH a planting date (never mixed with the proxy)
        if has_dates:
            snap_year = int(snap_date[:4])
            cohorts = {}
            for r in subset:
                dp = (r.get("date_planted") or "").strip()
                if len(dp) >= 4 and dp[:4].isdigit():
                    age = snap_year - int(dp[:4])
                    band = "0-10 yrs" if age < 10 else "10-20 yrs" if age < 20 else "20-30 yrs" if age < 30 else "30+ yrs"
                    h = num(r.get("height_m"))
                    if h:
                        cohorts.setdefault(band, []).append(h)
            for band in ["0-10 yrs", "10-20 yrs", "20-30 yrs", "30+ yrs"]:
                hs = cohorts.get(band)
                if hs:
                    v = {"age_band": band, "n": len(hs), "median": q(hs, .5), "p90": q(hs, .9), "unit": "m", "measure": "height class midpoint"}
                    C.add("time_to_intended_size", v, "quantitative",
                          f"Public {label} planted {band} ago in Vancouver (n={len(hs)}): median height class {v['median']} m, 90th percentile {v['p90']} m.",
                          group_ctx + "; trees with a recorded planting date only", CONF["age_cohort"],
                          note="growth under street/park conditions, not garden conditions." + extra_note)

    # species level: all trees ---------------------------------------------------
    small_note = ""
    if small:
        small_note = (f" Cultivar labels below the n >= {CULTIVAR_MIN_N} threshold are included here and not reported separately: "
                      + ", ".join(f"'{k.title()}' ({v})" for k, v in sorted(small.items(), key=lambda kv: -kv[1])) + ".")
    size_claims(rows, name, ctx, small_note)

    # cultivar groups (n >= threshold) and the unrecorded class -----------------
    for cv, cnt in sorted(big.items(), key=lambda kv: -kv[1]):
        subset = [r for r in rows if cv_label(r) == cv]
        size_claims(subset, f"{name} '{cv.title()}'", f"cultivar:'{cv.title()}'; {base_ctx}")
    unrec = [r for r in rows if cv_label(r) == "NONE"]
    if len(unrec) >= CULTIVAR_MIN_N:
        size_claims(unrec, f"{name} (cultivar unrecorded)", f"cultivar:(unrecorded); {base_ctx}",
                    " 'Unrecorded' means no label in the inventory, not the straight species; never merged into a cultivar group."
                    " interpretation (not data): the unrecorded class is larger and thicker than the labelled groups, consistent with older plantings"
                    " that pre-date cultivar labelling; its 10.7 m established-class median is high for this species and may include mislabelled maples.")

    if not has_dates:
        print("note: no date_planted in snapshot — no time_to_intended_size claim emitted", file=sys.stderr)

    entity_updates = {"in_vancouver_street_tree_list": True}
    return C.out, entity_updates


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 3:
        sys.exit(__doc__)
    plant_id, genus, species = args
    claims, entity_updates = build(plant_id, genus, species)
    outpath = os.path.join(ROOT, f"{plant_id}.cov_claims.json")
    with open(outpath, "w", encoding="utf-8") as f:
        json.dump({"plant": plant_id, "entity_updates": entity_updates, "claims": claims}, f, indent=2, ensure_ascii=False)
    print(f"{len(claims)} claims -> {outpath}")
    for c in claims:
        print(f" - [{c['field']}] {c['text']}")
    if "--merge" in sys.argv:
        sys.path.insert(0, HERE)
        from merge_claims import merge_claims
        res = merge_claims(os.path.join(ROOT, "plants", f"{plant_id}.json"), claims, entity_updates=entity_updates)
        for k, v in res.items():
            if v and k != "written":
                print(f"{k}: {v}")
        print("written:", res["written"])
        if res["written"]:
            os.remove(outpath)
        sys.exit(1 if res["errors"] else 0)


if __name__ == "__main__":
    main()
