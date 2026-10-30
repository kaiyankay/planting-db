#!/usr/bin/env python3
"""
T2: merge new claims into a plant file.

  python3 -I tools/merge_claims.py plants/acer-palmatum.json new_claims.json [--dry-run]

Importable:
  from merge_claims import merge_claims
  result = merge_claims("plants/acer-palmatum.json", claims, entity_updates={...}, dry_run=False)

Rules (HANDOFF T2, schema R10)
  - append claims; ids stay unique. If an incoming id is taken: an identical claim
    (same field, source_id, context, value) is skipped as a duplicate (idempotent re-runs);
    otherwise the id is re-allocated to the next free number for that field,
    keeping any alphabetic suffix prefix (cov01 -> cov02, 03 -> 04, m1 -> m2).
  - as soon as ANY non-model claim exists on a field (verified or not — D6, M10),
    unverified model claims on that field become status=retired,
    retired_by=<that claim id>, retired_at=<today>. Nothing is deleted.
  - existing non-model claims are never modified (checked by snapshot).
  - entity_updates: only fills entity fields that are currently null.
  - the whole plant is validated (tools/validate.py) before anything is written;
    on errors nothing is written and the errors are returned.
  - README.md status table is regenerated after a successful write.
"""
import copy, json, os, re, sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from validate import load_db, validate_plant, load_json  # noqa: E402

ID_RE = re.compile(r"^(?P<plant>[a-z0-9-]+):(?P<field>[a-z_]+):(?P<prefix>[a-z]*)(?P<num>\d+)$")


def _same(a, b):
    """duplicate = same field, source, context AND value (context matters: cultivar claims may share values)"""
    return a.get("field") == b.get("field") and a.get("source_id") == b.get("source_id") \
        and a.get("context") == b.get("context") \
        and json.dumps(a.get("value"), sort_keys=True) == json.dumps(b.get("value"), sort_keys=True)


def _next_id(existing_ids, plant_id, field, prefix):
    n = 0
    pat = re.compile(rf"^{re.escape(plant_id)}:{re.escape(field)}:{re.escape(prefix)}(\d+)$")
    for i in existing_ids:
        m = pat.match(i)
        if m:
            n = max(n, int(m.group(1)))
    width = 2 if prefix != "m" else 1
    return f"{plant_id}:{field}:{prefix}{n + 1:0{width}d}"


def retire_placeholders(plant, today=None):
    """R10 as of D6: an unverified model placeholder is retired as soon as any claim with
    source_type != model exists on the same field (verified or not). retired_by = the
    earliest such claim in file order. Idempotent. Returns a log list."""
    today = today or date.today().isoformat()
    out = []
    first_real = {}
    for c in plant["claims"]:
        if c.get("source_type") != "model" and c.get("status") != "retired":
            first_real.setdefault(c["field"], c["id"])
    for e in plant["claims"]:
        if e.get("source_type") == "model" and e.get("status") == "unverified" and e["field"] in first_real:
            e["status"] = "retired"; e["retired_by"] = first_real[e["field"]]; e["retired_at"] = today
            out.append(f"{e['id']} by {first_real[e['field']]}")
    return out


def merge_claims(plant_path, new_claims, entity_updates=None, dry_run=False, today=None):
    today = today or date.today().isoformat()
    schema, sources = load_db(ROOT)
    plant = load_json(plant_path)
    plant_id = plant["entity"]["id"]
    before_non_model = {c["id"]: copy.deepcopy(c) for c in plant["claims"] if c.get("source_type") != "model"}
    ids = {c["id"] for c in plant["claims"]}
    log = {"added": [], "skipped_duplicate": [], "reallocated": [], "retired": [], "entity_updated": [], "errors": [], "warnings": []}

    for raw in new_claims:
        c = copy.deepcopy(raw)
        if c.get("plant") != plant_id:
            log["errors"].append(f"{c.get('id')}: plant {c.get('plant')!r} != {plant_id}")
            continue
        dup = next((e for e in plant["claims"] if _same(e, c)), None)
        if dup:
            log["skipped_duplicate"].append(f"{c.get('id')} == {dup['id']}")
            continue
        m = ID_RE.match(c.get("id", ""))
        if not m or m.group("field") != c.get("field"):
            log["errors"].append(f"{c.get('id')}: malformed id")
            continue
        if c["id"] in ids:
            new_id = _next_id(ids, plant_id, c["field"], m.group("prefix"))
            log["reallocated"].append(f"{c['id']} -> {new_id}")
            c["id"] = new_id
        c.setdefault("recorded_at", today)
        c.setdefault("status", "unverified")
        plant["claims"].append(c)
        ids.add(c["id"])
        log["added"].append(c["id"])

    # R10 (D6 / M10): any non-model claim on a field retires that field's model placeholders
    log["retired"] += retire_placeholders(plant, today)

    for k, v in (entity_updates or {}).items():
        if plant["entity"].get(k) is None:
            plant["entity"][k] = v
            log["entity_updated"].append(f"{k} = {v!r}")
        elif plant["entity"][k] != v:
            log["warnings"].append(f"entity.{k} already {plant['entity'][k]!r}, not overwritten with {v!r}")

    # never modify existing non-model claims
    for cid, snap in before_non_model.items():
        cur = next(c for c in plant["claims"] if c["id"] == cid)
        if cur != snap:
            log["errors"].append(f"{cid}: existing non-model claim would be modified — refused")

    rep = validate_plant(plant, schema, sources, os.path.relpath(plant_path, ROOT))
    log["errors"] += rep.errors
    log["warnings"] += rep.warnings
    if log["errors"]:
        log["written"] = False
        return log

    changed = bool(log["added"] or log["retired"] or log["entity_updated"])
    if not changed:
        log["written"] = False
        log["warnings"].append("nothing to merge — file left untouched")
        return log
    if not dry_run:
        with open(plant_path, "w", encoding="utf-8") as f:
            json.dump(plant, f, indent=2, ensure_ascii=False)
            f.write("\n")
        regenerate_readme()
    log["written"] = not dry_run
    return log


# ---------------------------------------------------------------- README status table
def status_row(name, claims):
    def n(pred):
        return sum(1 for c in claims if pred(c))
    prac = [c for c in claims if c.get("source_type") == "practitioner"]
    levels = {}
    for c in prac:
        lv = (c.get("practitioner_meta") or {}).get("completeness", "?")
        levels[lv] = levels.get(lv, 0) + 1
    lv_txt = ", ".join(f"{k} {v}" for k, v in sorted(levels.items())) if levels else ""
    sourced = n(lambda c: c.get("source_type") in ("database", "literature", "municipal"))
    sourced_v = n(lambda c: c.get("source_type") in ("database", "literature", "municipal") and c.get("status") == "verified")
    return (f"| {name} | {len(prac)}{' (' + lv_txt + ')' if lv_txt else ''} | "
            f"{sourced_v}/{sourced} | "
            f"{n(lambda c: c.get('source_type') == 'model' and c.get('status') == 'unverified')} | "
            f"{n(lambda c: c.get('status') == 'retired')} | "
            f"{n(lambda c: c.get('status') == 'unverified')} |")


def build_status_table():
    rows = ["| | practitioner claims | database / literature / municipal (verified/total) | model placeholders active | retired | unverified total |",
            "|---|---|---|---|---|---|"]
    pdir = os.path.join(ROOT, "plants")
    for f in sorted(os.listdir(pdir)):
        if f.endswith(".json"):
            p = load_json(os.path.join(pdir, f))
            rows.append(status_row(f"*{p['entity']['scientific_name']}*", p["claims"]))
    rels = load_json(os.path.join(ROOT, "relations.json"))["relations"]
    rows.append(status_row("relations", rels))
    return "\n".join(rows)


def regenerate_readme():
    path = os.path.join(ROOT, "README.md")
    s = open(path, encoding="utf-8").read()
    table = build_status_table()
    stamp = f"<!-- status:begin (generated by tools/merge_claims.py, {date.today().isoformat()}) -->\n{table}\n<!-- status:end -->"
    if "<!-- status:begin" in s:
        s = re.sub(r"<!-- status:begin.*?<!-- status:end -->", lambda _: stamp, s, flags=re.S)
    else:
        # first run: replace the hand-written table under "## Status"
        s = re.sub(r"(## Status\n\n)(\|.*?\n)(?=\n)", lambda m: m.group(1) + stamp + "\n", s, count=1, flags=re.S)
    with open(path, "w", encoding="utf-8") as f:
        f.write(s)


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 2:
        sys.exit(__doc__)
    res = merge_claims(args[0], load_json(args[1]), dry_run="--dry-run" in sys.argv)
    for k, v in res.items():
        if v and k != "written":
            print(f"{k}:")
            for x in (v if isinstance(v, list) else [v]):
                print("  -", x)
    print("written:", res["written"])
    sys.exit(1 if res["errors"] else 0)
