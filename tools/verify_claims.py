#!/usr/bin/env python3
"""
Human verification step (T5): mark claims verified after review.

  python3 -I tools/verify_claims.py plants/acer-palmatum.json ID [ID ...]
  python3 -I tools/verify_claims.py plants/acer-palmatum.json --source rhs          # all unverified claims from one source
  python3 -I tools/verify_claims.py plants/acer-palmatum.json --reject ID [ID ...]  # status -> disputed, with --reason "..."
  add --by "Kay" to record who verified (default: user)

On verify: status=verified, verified_by, verified_at; then rule R10 — unverified
model placeholders on the same field are retired (retired_by = this claim).
Model claims are never verified. Validates and regenerates the README table.
"""
import json, os, sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from validate import load_db, validate_plant, load_json  # noqa: E402
from merge_claims import regenerate_readme  # noqa: E402


def verify(plant_path, ids=(), source=None, reject=False, reason=None, by="user"):
    today = date.today().isoformat()
    schema, sources = load_db(ROOT)
    plant = load_json(plant_path)
    by_id = {c["id"]: c for c in plant["claims"]}
    targets = [c for c in plant["claims"] if c.get("source_id") == source and c.get("status") == "unverified"] if source \
        else [by_id[i] for i in ids if i in by_id]
    missing = [i for i in ids if i not in by_id]
    log = {"verified": [], "rejected": [], "retired": [], "skipped": [f"{i}: not found" for i in missing], "errors": []}
    for c in targets:
        if c.get("source_type") == "model":
            log["skipped"].append(f"{c['id']}: model claims cannot be verified"); continue
        if reject:
            c["status"] = "disputed"; c["disputed_by"] = by; c["disputed_at"] = today
            if reason: c["dispute_reason"] = reason
            log["rejected"].append(c["id"]); continue
        if c.get("status") == "verified":
            log["skipped"].append(f"{c['id']}: already verified"); continue
        c["status"] = "verified"; c["verified_by"] = by; c["verified_at"] = today
        log["verified"].append(c["id"])
        for e in plant["claims"]:
            if e.get("field") == c["field"] and e.get("source_type") == "model" and e.get("status") == "unverified":
                e["status"] = "retired"; e["retired_by"] = c["id"]; e["retired_at"] = today
                log["retired"].append(f"{e['id']} by {c['id']}")
    rep = validate_plant(plant, schema, sources, os.path.relpath(plant_path, ROOT))
    log["errors"] = rep.errors
    if rep.errors:
        return log
    with open(plant_path, "w", encoding="utf-8") as f:
        json.dump(plant, f, indent=2, ensure_ascii=False); f.write("\n")
    regenerate_readme()
    return log


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    path = a[0]; rest = a[1:]
    def opt(name):
        if name in rest:
            i = rest.index(name); v = rest[i + 1]; del rest[i:i + 2]; return v
    source = opt("--source"); by = opt("--by") or "user"; reason = opt("--reason")
    reject = "--reject" in rest
    ids = [x for x in rest if not x.startswith("--")]
    res = verify(path, ids, source, reject, reason, by)
    for k, v in res.items():
        if v: print(f"{k}: {v}")
    sys.exit(1 if res["errors"] else 0)
