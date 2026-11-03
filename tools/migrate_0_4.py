#!/usr/bin/env python3
"""
Migrate claims to schema 0.4.0: connect every claim to the ontology (brief 2026-10-31, Part 2).

  python3 -I tools/migrate_0_4.py --dry-run     # report only
  python3 -I tools/migrate_0_4.py               # rewrite plants/*.json, schema.json, reports/migration-0.4.md

Per claim (nothing deleted, every original kept):
  1. categorical list / scalar values -> ontology ids; the original label(s) stay in `value_label`
  2. quantitative values -> `concepts`: the ordinal classes the numbers span (height / spread / hardiness / age)
  3. context string -> `conditions: [{facet, concept_id}]` where a growing condition is stated; `cultivar` lifted out
  4. `place`: from the claim's own context if more specific, else the source's geo_specificity
  5. `time`: months, seasons, age bands where present
Everything is mechanical and idempotent (re-running changes nothing). Unmapped values are listed in the report, never dropped.
Standard library only.
"""
import json, os, re, sys
from collections import Counter, defaultdict
from datetime import date

ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
ONT = J("ontology.json"); SCHEMA = J("schema.json"); SOURCES = {s["id"]: s for s in J("sources.json")["sources"]}
NODES = {n["id"]: n for n in ONT["nodes"]}
DRY = "--dry-run" in sys.argv
TODAY = date.today().isoformat()

# label / alias index, facet-scoped
BY_LABEL = defaultdict(dict)   # facet -> lower label/alias -> id
for n in ONT["nodes"]:
    BY_LABEL[n["facet"]][n["label"].lower()] = n["id"]
    for a in n.get("aliases", []):
        BY_LABEL[n["facet"]].setdefault(a.lower(), n["id"])
ORD = lambda facet: sorted([n for n in ONT["nodes"] if n["facet"] == facet], key=lambda n: n["order"])

def lookup(facet, label):
    if label is None: return None
    return BY_LABEL[facet].get(str(label).strip().lower())

def lookup_any(facets, label):
    for f in facets:
        i = lookup(f, label)
        if i: return i
    return None

def classes_for(facet, lo, hi):
    """ordinal classes whose [min_m, max_m) overlaps [lo, hi]"""
    out = []
    for n in ORD(facet):
        a, b = n.get("min_m", 0), n.get("max_m")
        if b is None: b = float("inf")
        if hi >= a and lo < b: out.append(n["id"])
    return out

# field -> (facet(s), kind)
CAT_FIELDS = {"exposure": ["exposure"], "soil_type": ["soil"], "water_drainage": ["water"], "growth_rate": ["growth_rate"], "habit": ["habit"], "texture": ["texture"], "form": ["form"],
              "landscape_use": ["use"], "ecological_value": ["ecology", "origin"], "resistances": ["stress", "browsing", "pest"], "pest_susceptibility": ["pest", "stress"],
              "maintenance_level": ["maintenance"], "invasive_status": ["invasive"], "photoperiod": ["photoperiod"]}
ENUM_ID_FIELDS = {"water_drainage": "water", "maintenance_level": "maintenance", "invasive_status": "invasive", "photoperiod": "photoperiod", "growth_rate": "growth_rate"}
PLACE_PATTERNS = [(r"UK growing conditions|\bUK\b", "place:uk"), (r"Willamette Valley", "place:willamette_valley"), (r"maritime Pacific Northwest", "place:pnw"), (r"St\.? Louis", "place:st_louis"), (r"US-wide|United States", "place:north_america"),
                  (r"North Van", "place:north_vancouver"), (r"backyard|own garden|own project", "place:vancouver"), (r"City of Vancouver|CoV public trees", "place:city_of_vancouver"), (r"Greater Vancouver|Metro Vancouver|Vancouver", "place:vancouver"), (r"\bBC\b|E-Flora|ISCBC", "place:bc"), (r"\bPNW\b|Pacific Northwest", "place:pnw")]
GEO_PLACE = {"vancouver": "place:vancouver", "bc": "place:bc", "pnw": "place:pnw", "north_america": "place:north_america", "global": "place:global"}
COND_PATTERNS = [(r"full sun", "exposure", "exposure:full_sun"), (r"part(?:ial)? shade|part sun", "exposure", "exposure:part_sun_part_shade"), (r"filtered shade", "exposure", "exposure:filtered_shade"), (r"deep shade|full shade", "exposure", "exposure:deep_shade"), (r"\bshade\b", "exposure", "exposure:shade"),
                 (r"poor soil|thin soil|gravel", "soil", "soil:rocky_or_gravelly_or_dry"), (r"good soil|rich soil", "soil", "soil:humus_rich"), (r"once established|established \(DBH", "age", "age:established"), (r"in youth", "age", "age:young"), (r"at 20 years", "age", "age:mature")]
NOTE_RE = re.compile(r"difference|noted|derived|inferred|absence|list absence", re.I)

report = {"fields": defaultdict(lambda: Counter()), "unmapped": [], "new_nodes_needed": [], "conditions": Counter(), "places": Counter(), "times": Counter(), "cultivars": Counter(), "claims": 0}

def record(field, kind): report["fields"][field][kind] += 1

def to_ids(field, value, cid):
    """categorical list/scalar -> ids (list or scalar), with report"""
    facets = CAT_FIELDS[field]
    scalar = not isinstance(value, list)
    vals = [value] if scalar else list(value)
    ids = []
    for v in vals:
        if isinstance(v, str) and v in NODES: ids.append(v); record(field, "already_id"); continue
        i = lookup_any(facets, v)
        if i is None and field == "ecological_value" and v == "native": i = "origin:native"
        if i is None:   # enum keys are ids with the facet prefix (bird_food -> ecology:bird_food)
            for fct in facets:
                if f"{fct}:{v}" in NODES: i = f"{fct}:{v}"; break
        if i is None:
            report["unmapped"].append((cid, field, v)); record(field, "unmapped"); ids.append(v)
        else:
            ids.append(i); record(field, "mapped")
    return ids[0] if scalar else ids

def concepts_quant(field, v, cid):
    out = []
    if not isinstance(v, dict): return out
    if field in ("mature_height", "local_mature_size", "time_to_intended_size") and (v.get("unit") == "m" or field == "mature_height"):
        lo, hi = None, None
        if "min" in v and "max" in v and field != "local_mature_size": lo, hi = v["min"], v["max"]
        elif "max" in v and "min" not in v and field != "local_mature_size": lo, hi = 0, v["max"]
        elif "height_m" in v: lo = hi = v["height_m"]
        elif "typical_max_m" in v: lo, hi = 0, v["typical_max_m"]
        elif "median" in v and v.get("unit") == "m": lo, hi = v.get("p10", v["median"]), v.get("p90", v["median"])
        if lo is not None: out += classes_for("height_class", lo, hi); record(field, "spanned_height_classes")
        if "spread_m" in v: out += classes_for("spread_class", v["spread_m"], v["spread_m"]); record(field, "spanned_spread_classes")
    if field == "mature_spread":
        lo, hi = (v["min"], v["max"]) if "min" in v and "max" in v else (v["spread_m"], v["spread_m"]) if "spread_m" in v else (None, None)
        if lo is not None: out += classes_for("spread_class", lo, hi); record(field, "spanned_spread_classes")
    if field == "hardiness_zone":
        if v.get("unit") == "USDA":
            lo = v.get("min", v.get("usda_min")); hi = v.get("max", 11 if "usda_min" in v else lo)
            if lo is not None: out += [f"hardiness_usda:z{z}" for z in range(int(lo), int(hi) + 1) if f"hardiness_usda:z{z}" in NODES]; record(field, "spanned_usda_zones")
        elif v.get("rating") and f"hardiness_rhs:{v['rating']}" in NODES: out.append(f"hardiness_rhs:{v['rating']}"); record(field, "mapped")
        elif v.get("unit") == "Canadian" and "min" in v: out += [n["id"] for n in ORD("hardiness") if v["min"] <= n["order"] <= v.get("max", 12)]; record(field, "spanned_canadian_zones")
    if field == "time_to_intended_size" and "years" in v:
        y = v["years"]; band = "age:young" if y <= 5 else "age:establishing" if y <= 10 else "age:established" if y <= 20 else "age:mature"
        out.append(band); record(field, "age_band")
    return out

def concepts_object(field, v, cid):
    """object-shaped categorical / qualitative values: pull concepts out, keep the object"""
    out, times = [], []
    if not isinstance(v, dict): return out, times
    if field == "seasonal_interest":
        if v.get("evergreen") is True: out.append("evergreen:yes"); record(field, "evergreen")
        if v.get("evergreen") is False: out.append("evergreen:no"); record(field, "evergreen")
        if v.get("fall_colour"): out.append("interest:fall_colour"); record(field, "fall_colour")
        if v.get("winter_interest"): out.append("interest:winter_interest"); record(field, "winter_interest")
        for key in ("flower_colour", "foliage_colour"):
            cols = v.get(key)
            if isinstance(cols, str): cols = [c.strip() for c in re.split(r"[,/]| to ", cols) if c.strip()]
            for c in cols or []:
                i = lookup("colour", c)
                if i: out.append(i); record(field, f"{key}_colour")
                elif isinstance(c, str) and c: report["unmapped"].append((cid, f"{field}.{key}", c)); record(field, "unmapped")
        for key in ("flowering_months", "fruiting_months"):
            for m in v.get(key) or []:
                if f"month:{m}" in NODES: times.append(f"month:{m}"); record(field, "months")
        if isinstance(v.get("fruit"), str):
            out.append("fruit:edible" if "edible" in v["fruit"].lower() and "not edible" not in v["fruit"].lower() else "fruit:showy"); record(field, "fruit")
    if field == "toxicity":
        for key in ("pets", "humans"):
            t = v.get(key)
            if t and f"toxicity:{t}" in NODES: out.append(f"toxicity:{t}"); record(field, key)
    return out, times

def conditions_from(ctx, c):
    conds = []
    segs = [s.strip() for s in (ctx or "").split(";")]
    for seg in segs:
        if NOTE_RE.search(seg): continue
        for pat, facet, cid in COND_PATTERNS:
            if re.search(pat, seg, re.I) and not any(x["concept_id"] == cid for x in conds):
                # a specific exposure beats the group
                if cid == "exposure:shade" and any(x["facet"] == "exposure" for x in conds): continue
                conds.append({"facet": facet, "concept_id": cid})
    pm = c.get("practitioner_meta") or {}
    if pm.get("site_conditions"):
        for pat, facet, cid in COND_PATTERNS:
            if re.search(pat, pm["site_conditions"], re.I) and not any(x["concept_id"] == cid for x in conds): conds.append({"facet": facet, "concept_id": cid})
    return conds

def place_for(c):
    ctx = c.get("context") or ""; pm = c.get("practitioner_meta") or {}
    for pat, pid in PLACE_PATTERNS:
        if re.search(pat, (pm.get("location") or "") + " " + ctx): return pid
    geo = (SOURCES.get(c["source_id"]) or {}).get("geo_specificity")
    return GEO_PLACE.get(geo, "place:global")

def cultivar_for(ctx):
    m = re.search(r"cultivar:\s*'([^']+)'|cultivar:\s*\(([^)]+)\)", ctx or "")
    return (m.group(1) or f"({m.group(2)})") if m else None

def migrate_claim(c):
    report["claims"] += 1
    field, vk, v = c["field"], c.get("value_kind"), c.get("value")
    concepts, times = [], []
    if vk == "categorical" and field in CAT_FIELDS and (isinstance(v, (list, str))):
        label = c.get("value_label", v)
        ids = to_ids(field, label if "value_label" in c else v, c["id"])
        c["value_label"] = label; c["value"] = ids
        concepts += ids if isinstance(ids, list) else [ids]
    elif isinstance(v, dict):
        if vk == "quantitative": concepts += concepts_quant(field, v, c["id"])
        o, t = concepts_object(field, v, c["id"]); concepts += o; times += t
        if vk == "categorical" and field not in ("seasonal_interest", "toxicity", "hardiness_zone"): record(field, "object_kept")
    elif vk == "qualitative":
        record(field, "qualitative_no_concept")
    elif vk == "categorical" and isinstance(v, bool):
        record(field, "boolean_kept")
    else:
        record(field, "other_kept")
    conds = conditions_from(c.get("context"), c)
    for x in conds:
        if x["facet"] == "age": times.append(x["concept_id"]); report["times"][x["concept_id"]] += 1
        else: report["conditions"][x["concept_id"]] += 1
    place = place_for(c); report["places"][place] += 1
    cultivar = cultivar_for(c.get("context"))
    if cultivar: report["cultivars"][cultivar] += 1
    pm = c.get("practitioner_meta") or {}
    if pm.get("season_observed"):
        s = lookup("season", pm["season_observed"]) or lookup("month", pm["season_observed"])
        if s: times.append(s)
    # write (idempotent: lists deduplicated and ordered)
    c["concepts"] = sorted(set([x for x in concepts if x in NODES]), key=lambda i: (NODES[i]["dimension"], NODES[i]["facet"], NODES[i].get("order", 0), i))
    c["conditions"] = [x for x in conds if x["facet"] != "age"]
    c["place"] = place
    c["time"] = sorted(set(times), key=lambda i: (NODES[i]["facet"], NODES[i].get("order", 0)))
    c["cultivar"] = cultivar
    not_in = [x for x in concepts if x not in NODES]
    for x in not_in: report["new_nodes_needed"].append((c["id"], field, x))
    return c

def migrate_plant(path):
    p = J(path)
    for c in p["claims"]: migrate_claim(c)
    if not DRY:
        with open(os.path.join(ROOT, path), "w", encoding="utf-8") as f: json.dump(p, f, ensure_ascii=False, indent=2); f.write("\n")
    return p

def update_schema():
    s = SCHEMA
    s["$schema_version"] = "0.4.0"; s["updated"] = TODAY
    f = s["claim"]["fields"]
    f["value"]["note"] = "typed per field definition; ranges as {min, max, unit}. From 0.4.0 categorical list / scalar values are ontology ids (ontology.json); the original label stays in value_label. Object-shaped values keep their shape and expose concepts in `concepts`."
    f["value_label"] = {"type": "any", "note": "0.4.0: the original categorical label(s) before mapping to ontology ids; display uses this"}
    f["concepts"] = {"type": "string[]", "ref": "ontology.json nodes[].id", "note": "0.4.0: every concept this claim links the plant to — the categorical ids, the ordinal classes a range spans (quantitative claims keep their numbers; classes are graph hooks), colours / evergreen / fruit read from object values"}
    f["conditions"] = {"type": "object[]", "shape": {"facet": "string", "concept_id": "ontology id"}, "note": "0.4.0: growing conditions stated in `context` (exposure, soil); the original context string is kept"}
    f["place"] = {"type": "string", "ref": "ontology.json place:*", "note": "0.4.0: from the claim's own context when more specific, else the source's geo_specificity"}
    f["time"] = {"type": "string[]", "ref": "ontology.json month:* season:* age:*", "note": "0.4.0: phenology months, age bands, season observed"}
    f["cultivar"] = {"type": "string|null", "note": "0.4.0: lifted from context `cultivar:'…'`; `(unrecorded)` for inventory records without a label"}
    s["ontology"] = {"file": "ontology.json", "version": ONT["$ontology_version"], "note": "concept nodes; claims are the edges that connect a plant to a concept with provenance (brief 2026-10-31)"}
    if not DRY:
        with open(os.path.join(ROOT, "schema.json"), "w", encoding="utf-8") as fh: json.dump(s, fh, ensure_ascii=False, indent=2); fh.write("\n")

def write_report(plants):
    L = []
    L.append(f"# Migration to schema 0.4.0 — {TODAY}{' (dry run)' if DRY else ''}\n")
    L.append(f"Script: `tools/migrate_0_4.py`. Ontology: `ontology.json` v{ONT['$ontology_version']} ({len(NODES)} nodes). Claims processed: {report['claims']} across {len(plants)} plants. Nothing deleted; every original value kept (`value_label`, `context`).\n")
    L.append("## Per field\n\n| field | outcome | n |\n|---|---|---|")
    for field in sorted(report["fields"]):
        for kind, n in sorted(report["fields"][field].items()): L.append(f"| {field} | {kind} | {n} |")
    tot_mapped = sum(c.get("mapped", 0) + c.get("already_id", 0) for c in report["fields"].values()); tot_un = len(report["unmapped"])
    L.append(f"\nCategorical labels mapped to ontology ids: **{tot_mapped}**. Unmapped: **{tot_un}** (listed below, left as plain strings in `value`, visible to the validator as errors until a node is added or the value is corrected). New nodes needed by the mapper itself: **{len(report['new_nodes_needed'])}**.\n")
    L.append("## Unmapped values (knowledge-base gaps, kept visible)\n")
    L += [f"- `{cid}` · {field} · `{v}`" for cid, field, v in report["unmapped"]] or ["- none"]
    if report["new_nodes_needed"]: L.append("\n## Concept ids produced but missing from the ontology\n"); L += [f"- `{cid}` · {field} · `{x}`" for cid, field, x in report["new_nodes_needed"]]
    L.append("\n## Conditions parsed from context\n"); L += [f"- `{k}` · {v} claims" for k, v in report["conditions"].most_common()] or ["- none"]
    L.append("\n## Time concepts\n"); L += [f"- `{k}` · {v}" for k, v in report["times"].most_common()] or ["- none"]
    L.append("\n## Place per claim\n"); L += [f"- `{k}` · {v}" for k, v in report["places"].most_common()]
    L.append("\n## Cultivars lifted from context\n"); L += [f"- {k} · {v}" for k, v in report["cultivars"].most_common()]
    L.append("\n## Not mapped by design\n- Qualitative claims (free text: `long_term_performance`, `behaviour_with_others`, `vancouver_context` prose) carry no `value` concept; they keep place / time / conditions only.\n- `local_mature_size` in cm DBH (trunk diameter) has no ordinal class in the ontology; the numbers stay as they are.\n- Hardiness is not converted between Canadian, USDA and RHS scales (schema note); each scale is its own facet.\n- The USDA 'maximum at 20 years' figure is inside `raw` text and is not read.\n")
    txt = "\n".join(L) + "\n"
    if not DRY:
        os.makedirs(os.path.join(ROOT, "reports"), exist_ok=True)
        with open(os.path.join(ROOT, "reports", "migration-0.4.md"), "w", encoding="utf-8") as f: f.write(txt)
    return txt

def annotate(claims):
    """0.4.x annotation for a list of new claims (importable; used by tools/merge_t5.py and tools/survey_to_claims.py):
    value ids + value_label, concepts, conditions, place, time, cultivar. Returns (claims, unmapped list). Idempotent."""
    before = len(report["unmapped"])
    for c in claims: migrate_claim(c)
    return claims, report["unmapped"][before:]


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if a.endswith(".json")]
    if only:   # annotate chosen plant files in place; schema.json and the migration report are left alone (2026-11-02, 10-plant expansion)
        for f in only:
            p = migrate_plant(os.path.relpath(os.path.abspath(f), ROOT)); print(f"{f}: {len(p['claims'])} claims annotated")
        for cid, field, v in report["unmapped"]: print(f"  unmapped: {cid} · {field} · {v!r}")
        sys.exit(1 if report["unmapped"] else 0)
    plants = [migrate_plant(os.path.join("plants", f)) for f in sorted(os.listdir(os.path.join(ROOT, "plants"))) if f.endswith(".json")]
    update_schema()
    txt = write_report(plants)
    print(txt if DRY else txt.split("## Per field")[0] + f"→ wrote plants/*.json, schema.json 0.4.0, reports/migration-0.4.md · unmapped {len(report['unmapped'])} · new nodes needed {len(report['new_nodes_needed'])}")
