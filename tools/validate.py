#!/usr/bin/env python3
"""
T3: light validator for planting-db. Standard library only.

  python3 -I tools/validate.py                 # all plants + relations
  python3 -I tools/validate.py plants/x.json   # one file
  python3 -I tools/validate.py --quiet         # exit code only

Also importable:  from validate import load_db, validate_plant, validate_relations

Checks (claims)
  - required fields present (schema.claim.required, incl. value_kind)
  - id is <plant>:<field>:<nn> and matches plant / field; ids unique
  - field exists in a field tier
  - value_kind in enum and allowed for that field (field.value_kinds)
  - categorical values are in the field's vocab / values (list or scalar; object shapes checked per key)
  - quantitative ranges have min <= max and a unit
  - source_id exists in sources.json and source_type matches the source's type
  - practitioner claims carry practitioner_meta; completeness matches basis/location; L0 never citable
  - model claims: source_id == model, confidence <= 0.5, status unverified | retired
  - derived_from points at an existing claim; categorical -> qualitative derivation forbidden (rule R9)
  - retired claims name retired_by; verified model claims flagged
  - status / claim_kind enums, confidence 0..1, recorded_at ISO date
Checks (entity): kpu_plant_type, origin_status in vocab.
Checks (relations): source, type, direction, model cap, plant ids exist.
"""
import json, os, re, sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLANTS_DIR = os.path.join(ROOT, "plants")

ID_RE = re.compile(r"^([a-z0-9-]+):([a-z_]+):([a-z]*\d+)$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


# ---------------------------------------------------------------- loading
def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_db(root=ROOT):
    schema = load_json(os.path.join(root, "schema.json"))
    sources = load_json(os.path.join(root, "sources.json"))
    return schema, {s["id"]: s for s in sources["sources"]}


def field_defs(schema):
    """field name -> (tier, definition)"""
    out = {}
    for tier, t in schema["field_tiers"].items():
        for name, d in t.get("fields", {}).items():
            out[name] = (tier, d)
    return out


def allowed_values(fdef, schema):
    if "vocab" in fdef:
        return set(schema["vocab"][fdef["vocab"]])
    if "values" in fdef:
        return set(fdef["values"])
    return None


# ---------------------------------------------------------------- helpers
class Report:
    def __init__(self, label):
        self.label = label
        self.errors, self.warnings, self.notes = [], [], []

    def note(self, cid, msg):
        self.notes.append(f"{cid}: {msg}")

    def err(self, cid, msg):
        self.errors.append(f"{cid}: {msg}")

    def warn(self, cid, msg):
        self.warnings.append(f"{cid}: {msg}")

    @property
    def ok(self):
        return not self.errors


def expected_completeness(meta):
    """Derive L0–L3 from practitioner_meta content (schema.practitioner_meta.completeness_levels)."""
    if not meta or not meta.get("basis"):
        return "L0"
    if not meta.get("location"):
        return "L1"
    extras = sum(1 for k in ("site_conditions", "maintenance_received", "season_observed", "plant_age_years") if meta.get(k) not in (None, "", []))
    return "L3" if extras >= 2 else "L2"


def check_categorical(cid, field, fdef, value, schema, rep):
    vocab = allowed_values(fdef, schema)
    if isinstance(value, bool):
        if fdef.get("type") != "boolean":
            rep.err(cid, f"{field}: boolean value on non-boolean field")
        return
    if isinstance(value, dict):
        # object-shaped fields: check keys we know the vocab of
        shape = fdef.get("shape", {})
        for k, v in value.items():
            spec = shape.get(k)
            if k not in shape:
                rep.warn(cid, f"{field}.{k}: key not in field shape {sorted(shape)}")
                continue
            if isinstance(spec, str) and spec.startswith("kpu_"):
                alts = spec.split("|")                       # e.g. "kpu_colour[]|string"
                voc = set(schema["vocab"][alts[0].rstrip("[]")])
                vals = v if isinstance(v, list) else [v]
                bad = [x for x in vals if x not in voc]
                if bad and not ("string" in alts and isinstance(v, str)):
                    rep.err(cid, f"{field}.{k}: {bad} not in {alts[0]}")
            elif isinstance(spec, str) and spec.startswith("enum["):
                voc = {x.strip() for x in spec[5:-1].split(",")}
                if v not in voc:
                    rep.err(cid, f"{field}.{k}: {v!r} not in {sorted(voc)}")
        return
    if vocab is None:
        rep.warn(cid, f"{field}: categorical but field has no vocab to check against")
        return
    vals = value if isinstance(value, list) else [value]
    bad = [v for v in vals if v not in vocab]
    if bad and schema["vocab"].get(f"{fdef.get('vocab')}_open") is True:
        rep.note(cid, f"{field}: {bad} outside the open starter list (allowed, M11)")
    elif bad:
        rep.err(cid, f"{field}: {bad} not in allowed values")
    if field == "pest_susceptibility" and any(str(v).startswith("(") for v in vals):
        rep.err(cid, "pest_susceptibility holds a '(… tolerant/resistant)' pseudo-value — record it under resistances (schema 0.3.0)")
    if fdef.get("type") in ("enum",) and isinstance(value, list) and len(value) > 1:
        rep.warn(cid, f"{field}: single-enum field holds {len(value)} values")


def check_quantitative(cid, field, value, rep):
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return
    if not isinstance(value, dict):
        rep.err(cid, f"{field}: quantitative value must be a number or an object, got {type(value).__name__}")
        return
    def numbers(obj, depth=0):
        for v in obj.values():
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                yield v
            elif isinstance(v, dict) and depth < 1:   # one nested level, e.g. {cultivar_counts: {...}}
                yield from numbers(v, depth + 1)
    if "min" in value and "max" in value:            # a range: {min, max, unit}
        lo, hi = value["min"], value["max"]
        if lo is None or hi is None or lo > hi:
            rep.err(cid, f"{field}: bad range min={lo} max={hi}")
        if not value.get("unit"):
            rep.err(cid, f"{field}: range has no unit")
    else:                                           # a distribution / count object
        if not any(True for _ in numbers(value)):
            rep.err(cid, f"{field}: quantitative object holds no numbers")
        if "unit" not in value and any(k in value for k in ("median", "p90", "max", "mean", "n")):
            rep.warn(cid, f"{field}: distribution without unit")


# ---------------------------------------------------------------- validators
def validate_claims(claims, plant_id, schema, sources, rep, known_ids=None):
    cs = schema["claim"]
    required = cs["required"]
    vk_values = set(cs["fields"]["value_kind"]["values"])
    st_values = set(cs["fields"]["status"]["values"])
    src_types = set(cs["fields"]["source_type"]["values"])
    kinds = set(cs["fields"]["claim_kind"]["values"])
    cap = cs["fields"]["confidence"]["caps"]
    fdefs = field_defs(schema)
    by_id = {c.get("id"): c for c in claims}
    all_ids = set(by_id) | set(known_ids or [])

    seen = set()
    for c in claims:
        cid = c.get("id", "<no id>")
        if cid in seen:
            rep.err(cid, "duplicate id")
        seen.add(cid)

        for k in required:
            if k not in c:
                rep.err(cid, f"missing required field '{k}'")
        m = ID_RE.match(cid)
        if not m:
            rep.err(cid, "id not of form <plant>:<field>:<nn>")
        else:
            if m.group(1) != plant_id or c.get("plant") != plant_id:
                rep.err(cid, f"plant mismatch (file is {plant_id})")
            if m.group(2) != c.get("field"):
                rep.err(cid, f"id field '{m.group(2)}' != claim field '{c.get('field')}'")

        field = c.get("field")
        fdef = None
        if field not in fdefs:
            rep.err(cid, f"field '{field}' not in any tier")
        else:
            _, fdef = fdefs[field]

        vk = c.get("value_kind")
        if vk not in vk_values:
            rep.err(cid, f"value_kind {vk!r} not in {sorted(vk_values)}")
        elif fdef is not None:
            if vk not in fdef.get("value_kinds", list(vk_values)):
                rep.err(cid, f"value_kind {vk} not allowed for {field} ({fdef.get('value_kinds')})")
            if vk == "categorical":
                check_categorical(cid, field, fdef, c.get("value"), schema, rep)
            elif vk == "quantitative":
                check_quantitative(cid, field, c.get("value"), rep)

        if not isinstance(c.get("text"), str) or not c.get("text", "").strip():
            rep.err(cid, "text is empty")

        sid, stype = c.get("source_id"), c.get("source_type")
        if stype not in src_types:
            rep.err(cid, f"source_type {stype!r} invalid")
        if sid not in sources:
            rep.err(cid, f"source_id {sid!r} not in sources.json")
        elif sources[sid].get("type") != stype:
            rep.err(cid, f"source_type {stype} != sources.json type {sources[sid].get('type')} for {sid}")

        conf = c.get("confidence")
        if not isinstance(conf, (int, float)) or not 0 <= conf <= 1:
            rep.err(cid, f"confidence {conf!r} not in [0,1]")
        status = c.get("status", cs["fields"]["status"]["default"])
        if status not in st_values:
            rep.err(cid, f"status {status!r} invalid")
        if c.get("claim_kind") is not None and c["claim_kind"] not in kinds:
            rep.err(cid, f"claim_kind {c['claim_kind']!r} invalid")
        if not DATE_RE.match(str(c.get("recorded_at", ""))):
            rep.err(cid, f"recorded_at {c.get('recorded_at')!r} not YYYY-MM-DD")

        # model placeholders
        if stype == "model":
            if sid != "model":
                rep.err(cid, "model claim must have source_id 'model'")
            if isinstance(conf, (int, float)) and conf > cap["model"]:
                rep.err(cid, f"model confidence {conf} > cap {cap['model']}")
            if status == "verified":
                rep.err(cid, "model claim cannot be verified — replace it with a sourced claim")
            if status == "unverified" and not c.get("verify_against"):
                rep.warn(cid, "model placeholder without verify_against")
            for v in c.get("verify_against", []) or []:
                if v not in sources and v != "practitioner":
                    rep.warn(cid, f"verify_against '{v}' not a source id")

        # practitioner metadata
        if stype == "practitioner":
            meta = c.get("practitioner_meta")
            if not isinstance(meta, dict):
                rep.err(cid, "practitioner claim without practitioner_meta")
            else:
                basis = meta.get("basis")
                if basis is not None and basis not in schema["practitioner_meta"]["fields"]["basis"]["values"]:
                    rep.err(cid, f"basis {basis!r} invalid")
                exp = expected_completeness(meta)
                got = meta.get("completeness")
                if got is None:
                    rep.err(cid, f"practitioner_meta.completeness missing (expected {exp})")
                elif got != exp:
                    rep.err(cid, f"completeness {got} but metadata implies {exp}")
                citable = meta.get("citable")
                if exp == "L0" and citable:
                    rep.err(cid, "L0 claim marked citable (rule R2)")
                if exp != "L0" and citable is False:
                    rep.warn(cid, f"{exp} claim marked not citable")
                if exp == "L1" and not meta.get("caveat"):
                    rep.warn(cid, "L1 claim should carry caveat 'location not recorded'")
                if sid in sources and sources[sid].get("observer_background") and meta.get("observer_background") != sources[sid]["observer_background"]:
                    rep.warn(cid, "observer_background differs from sources.json record")

        # derivation (rule R9)
        d = c.get("derived_from")
        if d:
            if d not in all_ids:
                rep.err(cid, f"derived_from '{d}' not found")
            else:
                parent = by_id.get(d)
                if parent and parent.get("value_kind") == "categorical" and vk == "qualitative":
                    rep.err(cid, "categorical -> qualitative derivation is not allowed (rule R9)")
                if parent and parent.get("source_id") != sid:
                    rep.warn(cid, "derived claim cites a different source than its parent")

        if status == "retired" and not (c.get("retired_by") or c.get("retired_reason")):
            rep.warn(cid, "retired without retired_by or retired_reason")
        if c.get("retired_by") and c["retired_by"] not in all_ids:
            rep.err(cid, f"retired_by '{c['retired_by']}' not found")


def validate_entity(entity, schema, rep):
    e = schema["entity"]["fields"]
    eid = entity.get("id", "<entity>")
    if not entity.get("scientific_name"):
        rep.err(eid, "entity.scientific_name missing")
    pt = entity.get("kpu_plant_type")
    if pt is not None and pt not in schema["vocab"][e["kpu_plant_type"]["vocab"]]:
        rep.err(eid, f"kpu_plant_type {pt!r} not in KPU vocab")
    os_ = entity.get("origin_status")
    if os_ is not None and os_ not in e["origin_status"]["values"]:
        rep.err(eid, f"origin_status {os_!r} invalid")
    v = entity.get("in_vancouver_street_tree_list")
    if v not in (True, False, None):
        rep.err(eid, "in_vancouver_street_tree_list must be boolean or null")


def validate_plant(plant, schema, sources, label=None):
    rep = Report(label or plant.get("entity", {}).get("id", "?"))
    entity = plant.get("entity", {})
    validate_entity(entity, schema, rep)
    validate_claims(plant.get("claims", []), entity.get("id"), schema, sources, rep)
    return rep


def validate_relations(rels, schema, sources, plant_ids):
    rep = Report("relations")
    rs = schema["relation"]["fields"]
    seen = set()
    for r in rels.get("relations", []):
        rid = r.get("id", "<no id>")
        if rid in seen:
            rep.err(rid, "duplicate id")
        seen.add(rid)
        for k in ("plant_a", "plant_b"):
            if r.get(k) not in plant_ids:
                rep.err(rid, f"{k} '{r.get(k)}' not a plant in db")
        if r.get("relation_type") not in rs["relation_type"]["values"]:
            rep.err(rid, f"relation_type {r.get('relation_type')!r} invalid")
        if r.get("direction") not in rs["direction"]["values"]:
            rep.err(rid, f"direction {r.get('direction')!r} invalid")
        sid, stype = r.get("source_id"), r.get("source_type")
        if sid not in sources:
            rep.err(rid, f"source_id {sid!r} not in sources.json")
        elif sources[sid].get("type") != stype:
            rep.err(rid, f"source_type {stype} != sources.json type for {sid}")
        if stype == "model" and (r.get("confidence", 1) > 0.5 or r.get("status") == "verified"):
            rep.err(rid, "model relation over cap or verified")
        if stype == "practitioner":
            meta = r.get("practitioner_meta")
            if not isinstance(meta, dict):
                rep.err(rid, "practitioner relation without practitioner_meta")
            elif meta.get("completeness") != expected_completeness(meta):
                rep.err(rid, f"completeness {meta.get('completeness')} but metadata implies {expected_completeness(meta)}")
        if not r.get("text"):
            rep.err(rid, "text empty")
    return rep


# ---------------------------------------------------------------- cli
def run(paths=None, quiet=False):
    schema, sources = load_db()
    reports = []
    if paths:
        files = [os.path.abspath(p) for p in paths]
    else:
        files = sorted(os.path.join(PLANTS_DIR, f) for f in os.listdir(PLANTS_DIR) if f.endswith(".json"))
    plant_ids = set()
    for f in files:
        plant = load_json(f)
        plant_ids.add(plant.get("entity", {}).get("id"))
        reports.append(validate_plant(plant, schema, sources, os.path.relpath(f, ROOT)))
    if not paths:
        all_ids = {load_json(f)["entity"]["id"] for f in files}
        reports.append(validate_relations(load_json(os.path.join(ROOT, "relations.json")), schema, sources, all_ids))

    ok = True
    for r in reports:
        ok &= r.ok
        if quiet:
            continue
        print(f"[{'OK ' if r.ok else 'ERR'}] {r.label}: {len(r.errors)} errors, {len(r.warnings)} warnings, {len(r.notes)} notes")
        for e in r.errors:
            print("   E", e)
        for w in r.warnings:
            print("   w", w)
    return 0 if ok else 1


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    sys.exit(run(args or None, quiet="--quiet" in sys.argv))
