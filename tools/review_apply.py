#!/usr/bin/env python3
"""
Controlled write-back of human review decisions to plants/*.json (brief 2026-11-02 'Verification Workbench' §05; M46).

  python3 -I tools/review_apply.py --preview <event_id>          # what would change (no write)
  python3 -I tools/review_apply.py --apply <event_id> --by Kay   # apply: fingerprint check → change → validate → (revert on error) → event → pipeline
  python3 -I tools/review_apply.py --pending                      # decisions not yet applied

Three operations are kept apart: the AI assessment (review/ai/), the human decision (review/events/, a human_decision event)
and the database mutation (this tool). An AI result never changes a claim; a human decision changes nothing until it is
applied here; the apply is refused when the claim changed since the decision (fingerprint), when the decision kind does
not mutate (request_evidence, defer) or when the validator reports an error after the change (the file is reverted).
Mutations:
  verify              status verified, verification_scope content (statement for survey claims), verified_by / verified_at,
                      review_events += event id; model placeholders on the field retire (R10, tools/merge_claims.retire_placeholders)
  dispute             status disputed, disputed_by / disputed_at, dispute_reason, review_events += event id
  propose_correction  the original claim: status retired, retired_reason "corrected by <new id> (event …)", review_events;
                      a NEW claim with the corrected value/text (same source, context unless the proposal changes it),
                      corrects: <original id>, status unverified, recorded_by the reviewer — landed through merge_claims
                      (annotation, validation). The original evidence is never overwritten.
No generated file is edited by hand; tools/pipeline.py is run after a successful apply.
"""
import copy, json, os, subprocess, sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(HERE)
sys.path.insert(0, HERE)
import review_store as RS  # noqa: E402
from validate import load_db, validate_plant, load_json  # noqa: E402
from merge_claims import merge_claims, retire_placeholders, regenerate_readme  # noqa: E402

MUTATING = {"verify", "dispute", "propose_correction"}


def find_claim(claim_id):
    pid = claim_id.split(":")[0]; path = os.path.join(ROOT, "plants", f"{pid}.json"); plant = load_json(path)
    c = next((c for c in plant["claims"] if c["id"] == claim_id), None)
    return path, plant, c


def event_by_id(event_id):
    return next((e for e in RS.events() if e["event_id"] == event_id), None)


def pending():
    s = RS.stats(); return [cid for cid, st in s["state"].items() if st.endswith("_pending_apply")]


def plan(event_id):
    """compute the change without writing; returns {ok, reason, before, after, new_claim}"""
    ev = event_by_id(event_id)
    if not ev or ev["kind"] != "human_decision": return {"ok": False, "reason": "no such human_decision event"}
    d = ev["payload"]["decision"]
    if d not in MUTATING: return {"ok": False, "reason": f"decision '{d}' records a review state but does not change the claim"}
    path, plant, c = find_claim(ev["claim_id"])
    if c is None: return {"ok": False, "reason": "claim not found"}
    if RS.fingerprint(c) != ev["fingerprint"]: return {"ok": False, "reason": f"stale: the claim changed since the decision (fingerprint {RS.fingerprint(c)} ≠ {ev['fingerprint']}); review it again"}
    if ev.get("applied"): return {"ok": False, "reason": "already applied"}
    if any(a["payload"].get("decision_event") == event_id for a in RS.applied(ev["claim_id"])): return {"ok": False, "reason": "already applied"}
    if c.get("source_type") == "model": return {"ok": False, "reason": "model placeholders are never verified or corrected; they retire when a sourced claim lands (R10)"}
    before = copy.deepcopy(c); after = copy.deepcopy(c); today = date.today().isoformat(); new_claim = None
    after.setdefault("review_events", []); after["review_events"] = after["review_events"] + [event_id]
    if d == "verify":
        after["status"] = "verified"; after["verified_by"] = ev["reviewer"]; after["verified_at"] = today
        after["verification_scope"] = "statement" if str(c.get("source_id", "")).startswith("survey") else "content"
        if ev["payload"].get("locally_applicable") is not None: after["locally_applicable"] = bool(ev["payload"]["locally_applicable"])
    elif d == "dispute":
        after["status"] = "disputed"; after["disputed_by"] = ev["reviewer"]; after["disputed_at"] = today; after["dispute_reason"] = ev["payload"]["reason"]
    elif d == "propose_correction":
        corr = ev["payload"]["correction"] or {}
        new_claim = {k: copy.deepcopy(v) for k, v in c.items() if k not in ("id", "status", "verified_by", "verified_at", "disputed_by", "disputed_at", "dispute_reason", "review_events", "retired_by", "retired_at", "retired_reason", "concepts", "conditions", "place", "time", "cultivar", "value_label", "verification_scope", "locally_applicable")}
        for k in ("field", "value", "value_kind", "text", "context", "confidence", "note"):
            if corr.get(k) is not None: new_claim[k] = corr[k]
        if corr.get("value_label") is not None: new_claim["value_label"] = corr["value_label"]
        new_claim["id"] = f"{c['plant']}:{new_claim['field']}:c01"; new_claim["status"] = "unverified"; new_claim["corrects"] = c["id"]; new_claim["recorded_at"] = today; new_claim["recorded_by"] = f"{ev['reviewer']} (review correction, event {event_id})"; new_claim["review_events"] = [event_id]
        after["status"] = "retired"; after["retired_at"] = today; after["retired_reason"] = f"corrected by a reviewer (event {event_id}): {ev['payload']['reason']}"
    return {"ok": True, "event": ev, "path": path, "decision": d, "before": before, "after": after, "new_claim": new_claim}


def preview(event_id):
    p = plan(event_id)
    if not p["ok"]: return p
    diff = {k: {"before": p["before"].get(k), "after": p["after"].get(k)} for k in sorted(set(p["before"]) | set(p["after"])) if p["before"].get(k) != p["after"].get(k)}
    return {"ok": True, "decision": p["decision"], "claim_id": p["event"]["claim_id"], "file": os.path.relpath(p["path"], ROOT), "changes": diff, "new_claim": p["new_claim"], "then": ["validate.py on the plant file (revert on any error)", "append decision_applied event", "tools/pipeline.py (ontology → graph → kg → validate)"]}


def apply(event_id, by, run_pipeline=True):
    p = plan(event_id)
    if not p["ok"]:
        RS.append({"kind": "apply_failed", "claim_id": (event_by_id(event_id) or {}).get("claim_id"), "reviewer": by, "payload": {"decision_event": event_id, "reason": p["reason"]}}); return p
    ev, path, after, new_claim = p["event"], p["path"], p["after"], p["new_claim"]
    snapshot = open(path, encoding="utf-8").read(); plant = load_json(path)
    for i, c in enumerate(plant["claims"]):
        if c["id"] == ev["claim_id"]: plant["claims"][i] = after
    retired = retire_placeholders(plant) if p["decision"] == "verify" else []
    schema, sources = load_db(ROOT); rep = validate_plant(plant, schema, sources, os.path.relpath(path, ROOT))
    if rep.errors:
        RS.append({"kind": "apply_failed", "claim_id": ev["claim_id"], "reviewer": by, "payload": {"decision_event": event_id, "reason": "validation errors; nothing written", "errors": rep.errors[:10]}})
        return {"ok": False, "reason": "validation failed; nothing written", "errors": rep.errors}
    with open(path, "w", encoding="utf-8") as f: json.dump(plant, f, ensure_ascii=False, indent=2); f.write("\n")
    merged = None
    if new_claim:
        merged = merge_claims(path, [new_claim])
        if merged["errors"]:
            open(path, "w", encoding="utf-8").write(snapshot)   # revert the whole apply
            RS.append({"kind": "apply_failed", "claim_id": ev["claim_id"], "reviewer": by, "payload": {"decision_event": event_id, "reason": "corrected claim failed validation; original file restored", "errors": merged["errors"][:10]}})
            return {"ok": False, "reason": "corrected claim failed validation; reverted", "errors": merged["errors"]}
    regenerate_readme()
    rec = RS.append({"kind": "decision_applied", "claim_id": ev["claim_id"], "plant": ev.get("plant"), "fingerprint_before": ev["fingerprint"], "fingerprint_after": RS.fingerprint(after), "reviewer": by, "previous_status": p["before"].get("status"), "new_status": after.get("status"), "payload": {"decision_event": event_id, "decision": p["decision"], "changed_keys": sorted(k for k in set(p["before"]) | set(after) if p["before"].get(k) != after.get(k)), "new_claim": (merged or {}).get("added"), "placeholders_retired": retired, "validation": "ok"}})
    pipe = None
    if run_pipeline:
        r = subprocess.run([sys.executable, "-I", os.path.join(HERE, "pipeline.py"), "--quiet"], capture_output=True, text=True, env=dict(os.environ, PLANTING_DB_ROOT=ROOT))
        pipe = {"ok": r.returncode == 0, "summary": (r.stdout.strip().splitlines() or [""])[-1][:200]}
        RS.append({"kind": "kg_rebuilt", "claim_id": ev["claim_id"], "reviewer": by, "payload": {"applied_event": rec["event_id"], "pipeline": pipe}})
    return {"ok": True, "applied_event": rec["event_id"], "new_status": after.get("status"), "new_claim": (merged or {}).get("added"), "placeholders_retired": retired, "pipeline": pipe}


if __name__ == "__main__":
    a = sys.argv[1:]
    if "--pending" in a: print(json.dumps(pending(), indent=1))
    elif "--preview" in a: print(json.dumps(preview(a[a.index("--preview") + 1]), ensure_ascii=False, indent=1))
    elif "--apply" in a: print(json.dumps(apply(a[a.index("--apply") + 1], a[a.index("--by") + 1] if "--by" in a else "user"), ensure_ascii=False, indent=1))
    else: print(__doc__)
