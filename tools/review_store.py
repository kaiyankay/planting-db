#!/usr/bin/env python3
"""
Review event store — the persistent, append-only record of human review (brief 2026-11-02 'Verification Workbench' §05; M46).

File: review/events/review_events.jsonl   (PRIVATE: gitignored; holds reviewer identifiers and reasons)
Every line is one event. Events are never edited or deleted; a changed decision is a new event that names the one it replaces.
Event kinds:
  human_decision     decision: verify | dispute | request_evidence | defer | propose_correction  (+ reason, reviewer, ai_review_id, locally_applicable, correction)
  decision_applied   the controlled write-back succeeded (what changed, validation result, pipeline result)
  apply_failed       the write-back was refused (stale fingerprint, validation errors) — nothing changed
  kg_rebuilt         tools/pipeline.py ran after an applied decision
  note               free-text note on a claim
Each event: event_id, claim_id, fingerprint (claim content at the time), reviewer, at (UTC), previous_status, kind, payload…
Importable: append(event) · events(claim_id=None) · latest_decision(claim_id) · history(claim_id) · stats()
"""
import hashlib, json, os, sys
from collections import Counter, defaultdict
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(HERE)
sys.path.insert(0, HERE)
EVENTS_DIR = os.path.join(ROOT, "review", "events"); EVENTS = os.path.join(EVENTS_DIR, "review_events.jsonl")
DECISIONS = ("verify", "dispute", "request_evidence", "defer", "propose_correction")
NOW = lambda: datetime.now(timezone.utc).isoformat(timespec="seconds")


def fingerprint(c):
    core = {k: c.get(k) for k in ("id", "field", "value", "text", "source_id", "context", "status", "confidence")}
    return hashlib.sha256(json.dumps(core, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()[:16]


def events(claim_id=None):
    if not os.path.exists(EVENTS): return []
    out = []
    for line in open(EVENTS, encoding="utf-8"):
        line = line.strip()
        if not line: continue
        ev = json.loads(line)
        if claim_id is None or ev.get("claim_id") == claim_id: out.append(ev)
    return out


def append(ev):
    os.makedirs(EVENTS_DIR, exist_ok=True)
    ev = dict(ev); ev.setdefault("at", NOW())
    ev.setdefault("event_id", "rev:" + hashlib.sha256((ev["at"] + ev.get("claim_id", "") + ev.get("kind", "") + json.dumps(ev.get("payload", {}), sort_keys=True, ensure_ascii=False)).encode()).hexdigest()[:12])
    with open(EVENTS, "a", encoding="utf-8") as f: f.write(json.dumps(ev, ensure_ascii=False) + "\n")
    return ev


def record_decision(claim, decision, reviewer, reason, ai_review_id=None, notes=None, correction=None, locally_applicable=None, replaces=None):
    if decision not in DECISIONS: raise ValueError(f"decision must be one of {DECISIONS}")
    if decision in ("dispute", "propose_correction") and not (reason or "").strip(): raise ValueError("dispute and propose_correction need a reason")
    if decision == "propose_correction" and not correction: raise ValueError("propose_correction needs a correction proposal {field?, value, text, note}")
    if not (reviewer or "").strip(): raise ValueError("reviewer identifier required")
    return append({"kind": "human_decision", "claim_id": claim["id"], "plant": claim.get("plant"), "fingerprint": fingerprint(claim), "reviewer": reviewer.strip(), "previous_status": claim.get("status"), "payload": {"decision": decision, "reason": reason, "notes": notes, "ai_review_id": ai_review_id, "correction": correction, "locally_applicable": locally_applicable, "replaces_event": replaces}})


def latest_decision(claim_id):
    ds = [e for e in events(claim_id) if e["kind"] == "human_decision"]
    return ds[-1] if ds else None


def applied(claim_id):
    return [e for e in events(claim_id) if e["kind"] == "decision_applied"]


def history(claim_id):
    """the event timeline for one claim: only what actually happened (import, AI review, decisions, applies, rebuilds)"""
    return sorted(events(claim_id), key=lambda e: e["at"])


def stats(queue_ids=None):
    """counts that never double-count: a claim is in exactly one human-review state (its latest decision, or applied)"""
    by_claim = defaultdict(list)
    for e in events(): by_claim[e["claim_id"]].append(e)
    state = {}
    for cid, evs in by_claim.items():
        dec = [e for e in evs if e["kind"] == "human_decision"]; app = [e for e in evs if e["kind"] == "decision_applied"]
        if not dec: continue
        last = dec[-1]["payload"]["decision"]
        last_applied = app and app[-1]["payload"].get("decision_event") == dec[-1]["event_id"]
        state[cid] = (last + ("_applied" if last_applied else "_pending_apply")) if last in ("verify", "dispute", "propose_correction") else last
    c = Counter(state.values())
    return {"claims_with_human_decision": len(state), "by_state": dict(c), "reviewers": sorted({e["reviewer"] for e in events() if e.get("reviewer")}), "events": sum(len(v) for v in by_claim.values()), "state": state}


if __name__ == "__main__":
    s = stats(); print(json.dumps({k: v for k, v in s.items() if k != "state"}, indent=1))
