#!/usr/bin/env python3
"""
Human Review Workbench — local server (brief 2026-11-02 'Verification Workbench' §04–§05; M46).

  python3 -I tools/review_server.py [--port 8767]       # http://127.0.0.1:8767/  (loopback only; no tokens, no cloud)

Serves review/web/index.html and a small JSON API over the repository files:
  GET  /api/overview                   dashboard counts (AI review and human review kept apart; no double counting)
  GET  /api/queue                      every claim that needs or has had human attention, with AI result, checks and human state
  GET  /api/claim?id=<claim id>        the claim, its entity, source, side-by-side claims on the same field, conflicts,
                                       programmatic checks, AI assessment (current + history), human events, downstream use
  POST /api/decision                   {claim_id, decision, reviewer, reason, notes, ai_review_id, correction, locally_applicable, replaces_event}
                                       → appends a human_decision event (review/events/review_events.jsonl, private)
  POST /api/apply/preview              {event_id} → the change the apply would make (nothing written)
  POST /api/apply                      {event_id, by} → fingerprint check → change → validate (revert on error) → event → pipeline
  GET  /api/history?id=<claim id>      the event timeline (only what actually happened)
  GET  /api/issues · /api/issue?id=    recurring knowledge-mapping issues (review/ai/issues.json, M47) with progress and policy
  GET  /api/conflicts                  evidence-conflict groups (plant × field) with every source side by side
  GET  /api/sample                     the human-evaluation sample with progress
  POST /api/issue_decision             {issue_id, option, reviewer, reason} → an issue-level POLICY event; changes no claim
Standard library only. Reads plants/*.json, review/ai/*, review/events/*; writes only through tools/review_store.py and
tools/review_apply.py. There is no bulk-verify endpoint on purpose.
"""
import json, os, sys, urllib.parse
from collections import Counter, defaultdict
from http.server import HTTPServer, BaseHTTPRequestHandler

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(HERE)
sys.path.insert(0, HERE)
import review_store as RS  # noqa: E402
import review_apply as RA  # noqa: E402
import ai_review as AIR  # noqa: E402

WEB = os.path.join(ROOT, "review", "web")
J = lambda p: json.load(open(p, encoding="utf-8")) if os.path.exists(p) else None


class Data:
    """fresh view of the files on every request (the files are small; no cache to go stale)"""
    def __init__(self):
        self.plants = {}
        for f in sorted(os.listdir(os.path.join(ROOT, "plants"))):
            if f.endswith(".json"): p = J(os.path.join(ROOT, "plants", f)); self.plants[p["entity"]["id"]] = p
        self.claims = {c["id"]: c for p in self.plants.values() for c in p["claims"]}
        self.sources = {s["id"]: s for s in J(os.path.join(ROOT, "sources.json"))["sources"]}
        q = J(os.path.join(AIR.AI, "queue.json")) or {"rows": []}; self.queue = {r["claim_id"]: r for r in q["rows"]}
        ch = J(os.path.join(AIR.AI, "checks.json")) or {"checks": {}}; self.checks = ch["checks"]
        self.ai_all = defaultdict(list)
        for a in AIR.load_assessments(): self.ai_all[a["claim_id"]].append(a)
        for v in self.ai_all.values(): v.sort(key=lambda a: a.get("reviewed_at", ""))
        self.kg = J(os.path.join(ROOT, "brain", "data", "kg.json"))
        self.events = defaultdict(list)
        for e in RS.events(): self.events[e["claim_id"]].append(e)
        self.hstate = RS.stats()["state"]

    def ai_current(self, cid):
        if not self.ai_all.get(cid): return None
        a = dict(self.ai_all[cid][-1]); a["current"] = a.get("fingerprint") == RS.fingerprint(self.claims[cid]) if cid in self.claims else False; return a

    def human_state(self, cid):
        return self.hstate.get(cid, "awaiting_human")

    def row(self, c):
        a = self.ai_current(c["id"]); q = self.queue.get(c["id"], {}); ch = self.checks.get(c["id"], {})
        return {"claim_id": c["id"], "plant": c["plant"], "plant_name": self.plants[c["plant"]]["entity"]["scientific_name"], "field": c["field"], "source_id": c["source_id"], "source_type": c["source_type"], "status": c.get("status"), "confidence": c.get("confidence"), "text": c.get("text"),
                "priority": q.get("priority", "—"), "priority_score": q.get("priority_score", 0), "downstream": q.get("downstream", []), "n_conflicts": len(q.get("conflicting_claims", [])), "ai_result": a["result"] if a else None, "ai_current": a["current"] if a else None, "ai_risk": a.get("risk") if a else None, "program_result": ch.get("program_result"), "human_state": self.human_state(c["id"]), "last_event": (self.events[c["id"]][-1]["at"] if self.events.get(c["id"]) else None), "recorded_at": c.get("recorded_at")}

    def rows(self):
        out = []
        for c in self.claims.values():
            if c.get("source_type") == "model": continue
            if c.get("status") in ("unverified", "disputed") or self.events.get(c["id"]) or c.get("review_events"): out.append(self.row(c))
        out.sort(key=lambda r: (-r["priority_score"], r["plant"], r["field"], r["claim_id"]))
        return out

    def overview(self):
        rows = self.rows(); all_claims = [c for c in self.claims.values() if c.get("source_type") != "model" and c.get("status") != "retired"]
        ai = Counter(r["ai_result"] or "awaiting_ai" for r in rows if r["status"] == "unverified")
        src_checked = sum(1 for r in rows if r["status"] == "unverified" and r["ai_result"] and r["ai_result"] != "source_unavailable")
        return {"total_live_claims": len(all_claims), "by_status": dict(Counter(c.get("status") for c in all_claims)), "in_queue": sum(1 for r in rows if r["status"] == "unverified"), "ai_reviewed": sum(1 for r in rows if r["status"] == "unverified" and r["ai_result"]), "source_checked_by_ai": src_checked, "ai_results": dict(ai), "program_checks": dict(Counter(r["program_result"] or "none" for r in rows if r["status"] == "unverified")),
                "human": {k: v for k, v in RS.stats().items() if k != "state"}, "human_reviewed_claims": sum(1 for r in rows if r["human_state"] != "awaiting_human"), "by_plant": {pid: {"queue": sum(1 for r in rows if r["plant"] == pid and r["status"] == "unverified"), "ai": sum(1 for r in rows if r["plant"] == pid and r["ai_result"]), "human": sum(1 for r in rows if r["plant"] == pid and r["human_state"] != "awaiting_human"), "verified": sum(1 for c in all_claims if c["plant"] == pid and c.get("status") == "verified"), "disputed": sum(1 for c in all_claims if c["plant"] == pid and c.get("status") == "disputed"), "name": self.plants[pid]["entity"]["scientific_name"]} for pid in self.plants},
                "by_source": dict(Counter(r["source_id"] for r in rows if r["status"] == "unverified")), "by_field": dict(Counter(r["field"] for r in rows if r["status"] == "unverified")), "priority": dict(Counter(r["priority"] for r in rows if r["status"] == "unverified")), "events": sum(len(v) for v in self.events.values())}

    # ---- issue-based review (M47), evidence conflicts, evaluation sample
    def issues(self):
        doc = J(os.path.join(AIR.AI, "issues.json")) or {"issues": []}; pol = defaultdict(list)
        for e in RS.issue_decisions(): pol[e["issue_id"]].append(e)
        out = []
        for i in doc["issues"]:
            rows = [dict(r, human_state=self.human_state(r["claim_id"]), status=(self.claims.get(r["claim_id"]) or {}).get("status")) for r in i["claims"]]
            dec = sum(1 for r in rows if r["human_state"] != "awaiting_human"); p = pol.get(i["id"], [])
            out.append(dict(i, claims=rows, decided=dec, open=i["n_claims"] - dec, policy=(p[-1] if p else None), policy_history=p, progress=round(dec / i["n_claims"], 2) if i["n_claims"] else 0))
        return out

    def conflicts(self):
        """groups of claims on one plant × field whose values are disjoint (diagnosis) or that the AI rated conflicting"""
        groups = {}
        for cid, r in self.queue.items():
            a = self.ai_current(cid); hard = a and a["result"] == "conflicting_evidence"
            if not (hard or (r.get("conflicting_claims") and r.get("priority") == "high")): continue
            key = (r["plant"], r["field"]); g = groups.setdefault(key, {"plant": r["plant"], "plant_name": self.plants[r["plant"]]["entity"]["scientific_name"], "field": r["field"], "members": set(), "ai_conflicting": 0, "priority": r.get("priority")})
            g["members"].add(cid); g["members"].update(x for x in r.get("conflicting_claims", []) if x in self.claims)
            if hard: g["ai_conflicting"] += 1
        out = []
        for g in groups.values():
            mem = []
            for cid in sorted(g["members"]):
                c = self.claims[cid]; a = self.ai_current(cid)
                mem.append({"claim_id": cid, "source_id": c["source_id"], "value": c.get("value_label") or c.get("value"), "text": c.get("text"), "context": c.get("context"), "status": c.get("status"), "ai_result": a["result"] if a else None, "ai_conflict_reading": a.get("conflict_reading") if a else None, "human_state": self.human_state(cid)})
            dec = sum(1 for m in mem if m["human_state"] != "awaiting_human")
            out.append({"id": f"{g['plant']}:{g['field']}", "plant": g["plant"], "plant_name": g["plant_name"], "field": g["field"], "n": len(mem), "ai_conflicting": g["ai_conflicting"], "decided": dec, "members": mem, "reading": next((m["ai_conflict_reading"] for m in mem if m["ai_conflict_reading"] and m["ai_conflict_reading"].lower() not in ("n.a.", "n/a")), None)})
        out.sort(key=lambda g: (-g["ai_conflicting"], -g["n"], g["plant"], g["field"]))
        return out

    def sample(self):
        files = sorted(f for f in os.listdir(AIR.AI) if f.startswith("sample-") and f.endswith(".json"))
        if not files: return {"n": 0, "claims": [], "note": "no sample file; run tools/review_eval.py --sample 40"}
        s = J(os.path.join(AIR.AI, files[-1]))
        for r in s["claims"]:
            r["human_state"] = self.human_state(r["claim_id"]); r["ai_result"] = (self.ai_current(r["claim_id"]) or {}).get("result"); r["text"] = (self.claims.get(r["claim_id"]) or {}).get("text"); r["plant_name"] = self.plants[r["plant"]]["entity"]["scientific_name"]
            ld = RS.latest_decision(r["claim_id"]); r["human_decision"] = ld["payload"]["decision"] if ld else None
        s["decided"] = sum(1 for r in s["claims"] if r["human_decision"]); s["file"] = files[-1]
        return s

    def overview2(self):
        o = self.overview(); iss = self.issues(); con = self.conflicts(); smp = self.sample()
        o["entries"] = {"conflicts": {"groups": len(con), "claims": sum(g["n"] for g in con), "ai_conflicting": sum(g["ai_conflicting"] for g in con), "decided": sum(g["decided"] for g in con)},
                        "issues": {"n": len(iss), "claims": sum(i["n_claims"] for i in iss), "decided": sum(i["decided"] for i in iss), "with_policy": sum(1 for i in iss if i["policy"])},
                        "sample": {"n": smp.get("n", 0), "decided": smp.get("decided", 0), "file": smp.get("file")}, "all": {"n": o["in_queue"]}}
        return o

    def claim(self, cid):
        c = self.claims.get(cid)
        if not c: return None
        p = self.plants[c["plant"]]; same = [x for x in p["claims"] if x["field"] == c["field"] and x.get("source_type") != "model" and x.get("status") != "retired"]
        q = self.queue.get(cid, {}); conf = q.get("conflicting_claims", [])
        kgn = {n["id"]: n for n in (self.kg or {"nodes": []})["nodes"]}
        downstream = []
        for e in (self.kg or {"edges": []})["edges"]:
            b = e.get("basis") or {}
            if cid in (b.get("claims") or []) or e.get("claim_id") == cid or cid in (b.get("derived_from") or []) or any(ev.get("claim") == cid for r in e.get("requirements") or [] for ev in r.get("evidence") or []):
                downstream.append({"type": e["type"], "rel": e.get("rel"), "target": e.get("target"), "target_label": kgn.get(e.get("target"), {}).get("label", e.get("target")), "kg_status": e.get("kg_status"), "text": (e.get("text") or "")[:160]})
        return {"claim": c, "entity": {k: p["entity"].get(k) for k in ("id", "scientific_name", "common_names", "family", "kpu_plant_type", "origin_status", "identity_review")}, "source": self.sources.get(c["source_id"]), "fingerprint": RS.fingerprint(c), "queue": q, "checks": self.checks.get(cid), "ai": self.ai_current(cid), "ai_history": self.ai_all.get(cid, []), "same_field": [{"id": x["id"], "source_id": x["source_id"], "status": x.get("status"), "value": x.get("value"), "value_label": x.get("value_label"), "text": x.get("text"), "context": x.get("context"), "confidence": x.get("confidence"), "conflict": x["id"] in conf, "ai_result": (self.ai_current(x["id"]) or {}).get("result")} for x in same], "events": self.events.get(cid, []), "human_state": self.human_state(cid), "downstream": downstream[:40], "pending_apply": [e["event_id"] for e in self.events.get(cid, []) if e["kind"] == "human_decision" and e["payload"]["decision"] in RA.MUTATING and not any(a["payload"].get("decision_event") == e["event_id"] for a in self.events.get(cid, []) if a["kind"] == "decision_applied")]}


class H(BaseHTTPRequestHandler):
    def _send(self, code, obj, ctype="application/json"):
        body = obj if isinstance(obj, bytes) else json.dumps(obj, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(code); self.send_header("Content-Type", ctype + ("; charset=utf-8" if "text" in ctype or "json" in ctype else "")); self.send_header("Content-Length", str(len(body))); self.send_header("Cache-Control", "no-store"); self.end_headers(); self.wfile.write(body)

    def _guard(self):
        if self.client_address[0] not in ("127.0.0.1", "::1"): self._send(403, {"error": "loopback only"}); return False
        return True

    def do_GET(self):
        if not self._guard(): return
        u = urllib.parse.urlparse(self.path); qs = urllib.parse.parse_qs(u.query); d = Data()
        if u.path == "/" or u.path == "/index.html": return self._send(200, open(os.path.join(WEB, "index.html"), "rb").read(), "text/html")
        if u.path == "/api/overview": return self._send(200, d.overview2())
        if u.path == "/api/issues": return self._send(200, {"issues": [{k: v for k, v in i.items() if k != "claims"} for i in d.issues()]})
        if u.path == "/api/issue":
            i = next((x for x in d.issues() if x["id"] == qs.get("id", [""])[0]), None); return self._send(200, i) if i else self._send(404, {"error": "no such issue"})
        if u.path == "/api/conflicts": return self._send(200, {"groups": d.conflicts()})
        if u.path == "/api/sample": return self._send(200, d.sample())
        if u.path == "/api/queue": return self._send(200, {"rows": d.rows(), "plants": {pid: p["entity"]["scientific_name"] for pid, p in d.plants.items()}})
        if u.path == "/api/claim":
            c = d.claim(qs.get("id", [""])[0]); return self._send(200, c) if c else self._send(404, {"error": "no such claim"})
        if u.path == "/api/history": return self._send(200, RS.history(qs.get("id", [""])[0]))
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        if not self._guard(): return
        n = int(self.headers.get("Content-Length") or 0); body = json.loads(self.rfile.read(n) or b"{}"); d = Data()
        try:
            if self.path == "/api/decision":
                c = d.claims.get(body.get("claim_id"))
                if not c: return self._send(404, {"error": "no such claim"})
                ev = RS.record_decision(c, body.get("decision"), body.get("reviewer"), body.get("reason"), ai_review_id=body.get("ai_review_id"), notes=body.get("notes"), correction=body.get("correction"), locally_applicable=body.get("locally_applicable"), replaces=body.get("replaces_event"))
                return self._send(200, {"ok": True, "event": ev})
            if self.path == "/api/issue_decision":
                ev = RS.record_issue_decision(body.get("issue_id"), body.get("option"), body.get("reviewer"), body.get("reason"), notes=body.get("notes")); return self._send(200, {"ok": True, "event": ev})
            if self.path == "/api/apply/preview": return self._send(200, RA.preview(body.get("event_id", "")))
            if self.path == "/api/apply":
                if not (body.get("by") or "").strip(): return self._send(400, {"error": "reviewer identifier required"})
                return self._send(200, RA.apply(body.get("event_id", ""), body["by"].strip()))
        except ValueError as e: return self._send(400, {"error": str(e)})
        return self._send(404, {"error": "not found"})

    def log_message(self, fmt, *args): sys.stderr.write("%s %s\n" % (self.log_date_time_string(), fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[sys.argv.index("--port") + 1]) if "--port" in sys.argv else int(os.environ.get("PORT") or 8767)
    print(f"Review Workbench on http://127.0.0.1:{port}/  (root {ROOT}; loopback only; events -> review/events/review_events.jsonl)")
    HTTPServer(("127.0.0.1", port), H).serve_forever()
