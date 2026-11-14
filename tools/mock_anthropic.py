#!/usr/bin/env python3
"""
A MOCK of the Claude Messages endpoint, for contract tests only (tools/llm_tests.py). It is not a language model and proves
nothing about what a real model reads. It exists so the real code path — the anthropic SDK inside tools/llm_interpret.py, the
design server, the browser — can be exercised end to end without a credential, and so the failure paths can be provoked.

  python3 tools/mock_anthropic.py [--port 8790]        then start the design server with PI_LLM_MOCK_URL=http://127.0.0.1:8790

POST /v1/messages   checks the request the SDK sent against the documented contract (model id, max_tokens, structured-output
                    schema without unsupported keywords, no sampling parameters, no prefill, no key in the body) and answers
                    with the hand-written fixture for the utterance (tools/fixtures/llm_mock.json), or — for an utterance that
                    carries a marker — with a failure:
                      [[mock:500]] [[mock:429]] [[mock:invalid-json]] [[mock:schema-violation]] [[mock:refusal]]
                      [[mock:max-tokens]] [[mock:geometry]] [[mock:ungrounded]] [[mock:plant-fact]] [[mock:no-fallback-beta]]
GET  /_requests     the request bodies and headers received so far (the key is replaced by its presence)
"""
import json, os, re, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[sys.argv.index("--port") + 1]) if "--port" in sys.argv else 8790
FIXTURES = json.load(open(os.path.join(ROOT, "tools", "fixtures", "llm_mock.json"), encoding="utf-8"))
SEEN = []
UNSUPPORTED = ("minimum", "maximum", "multipleOf", "minLength", "maxLength")
norm = lambda t: re.sub(r"\s+", " ", (t or "").replace("×", "x").lower()).strip()
NONE = {"kind": "none", "reading": "Nothing in this sentence that the workspace can use.", "description": None, "bed_edit": None, "edit": None}


def contract_errors(body, headers):
    """What the real API would reject, as far as this code path is concerned."""
    errs = []
    if not re.fullmatch(r"claude-[a-z]+-\d(?:-\d)?", body.get("model", "")): errs.append(f"model: {body.get('model')!r} is not a bare model id")
    if not isinstance(body.get("max_tokens"), int) or body["max_tokens"] < 1: errs.append("max_tokens: required")
    for k in ("temperature", "top_p", "top_k"):
        if k in body: errs.append(f"{k}: sampling parameters are rejected by this model")
    th = body.get("thinking")
    if th and th.get("type") in ("disabled", "enabled"): errs.append("thinking: only adaptive is accepted by this model")
    msgs = body.get("messages") or []
    if not msgs or msgs[-1].get("role") != "user": errs.append("messages: the last message must be the user's (no prefill)")
    fmt = (body.get("output_config") or {}).get("format") or {}
    if fmt.get("type") != "json_schema" or not isinstance(fmt.get("schema"), dict): errs.append("output_config.format: a json_schema is required")
    else:
        def walk(s, path):
            if isinstance(s, dict):
                for k in UNSUPPORTED:
                    if k in s: errs.append(f"schema {path}: {k} is not supported in structured outputs")
                if s.get("type") == "object":
                    if s.get("additionalProperties") is not False: errs.append(f"schema {path}: additionalProperties must be false")
                    if sorted(s.get("required", [])) != sorted(s.get("properties", {})): errs.append(f"schema {path}: every property is required in this schema")
                for k, v in s.items(): walk(v, f"{path}.{k}")
            elif isinstance(s, list):
                for i, v in enumerate(s): walk(v, f"{path}[{i}]")
        walk(fmt["schema"], "$")
    eff = (body.get("output_config") or {}).get("effort")
    if eff not in (None, "low", "medium", "high", "xhigh", "max"): errs.append(f"output_config.effort: {eff!r}")
    if "fallbacks" in body and "server-side-fallback-2026-07-01" not in (headers.get("anthropic-beta") or ""): errs.append("fallbacks: needs the server-side-fallback beta header")
    if not (headers.get("x-api-key") or headers.get("authorization")): errs.append("no credential header")
    if "sk-ant" in json.dumps(body): errs.append("a key appears in the request body")
    return errs


def answer(text):
    """-> (http status, body). The fixture for the utterance, or the failure its marker asks for."""
    m = re.search(r"\[\[mock:([a-z0-9-]+)\]\]", text); mark = m.group(1) if m else None
    msg = lambda payload, stop="end_turn": (200, {"id": "msg_mock_0001", "type": "message", "role": "assistant", "model": "claude-opus-5-5", "content": [{"type": "text", "text": payload if isinstance(payload, str) else json.dumps(payload)}], "stop_reason": stop, "stop_sequence": None, "usage": {"input_tokens": 1200, "output_tokens": 300}})
    err = lambda code, typ, m_: (code, {"type": "error", "error": {"type": typ, "message": m_}})
    if mark == "500": return err(500, "api_error", "mock: internal server error")
    if mark == "429": return err(429, "rate_limit_error", "mock: rate limited")
    if mark == "invalid-json": return msg('{"kind": "description", "reading": ')
    if mark == "refusal": return (200, {"id": "msg_mock_0002", "type": "message", "role": "assistant", "model": "claude-opus-5-5", "content": [], "stop_reason": "refusal", "stop_sequence": None, "stop_details": {"type": "refusal", "category": None, "explanation": "mock refusal"}, "usage": {"input_tokens": 1200, "output_tokens": 0}})
    if mark == "max-tokens": return msg('{"kind": "description"', "max_tokens")
    key = norm(re.sub(r"\[\[mock:[a-z0-9-]+\]\]", "", text))
    fx = next((f for f in FIXTURES["fixtures"] if norm(f["utterance"]) == key), None)
    out = json.loads(json.dumps(fx["response"])) if fx else dict(NONE)
    if mark == "schema-violation": out["kind"] = "site_plan"                                              # not one of the kinds
    if mark == "geometry" and out.get("description"): out["description"]["boundary_polygon"] = [[0, 0], [9, 0], [9, 9], [0, 9]]   # a key the schema does not have
    if mark == "plant-fact" and out.get("description"): out["description"]["functions"].append({"function": "z:hedge_of_yew", "where": "north-edge", "basis": "yew is evergreen and dense", "evidence": "privacy", "alternative": False, "target_height_m": None, "year_round": "yes"})
    if mark == "ungrounded" and out.get("description"):                                                   # things the person did not say
        d = out["description"]; d["dimensions"] = {"w": 12, "h": 9, "unit": "m", "evidence": "a 12 x 9 m garden"}
        d["conditions"].append({"key": "soil_type", "value": "clay", "evidence": "heavy clay soil"}); d["trees"].append({"side": "east", "corner": "none", "evidence": "a second tree by the east fence"})
    return msg(out)


class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _json(self, code, obj):
        body = json.dumps(obj).encode("utf-8"); self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(body))); self.send_header("request-id", "req_mock"); self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        if self.path == "/_requests": return self._json(200, SEEN)
        return self._json(404, {"type": "error", "error": {"type": "not_found_error", "message": "mock"}})

    def do_POST(self):
        if not self.path.split("?")[0].endswith("/v1/messages"): return self._json(404, {"type": "error", "error": {"type": "not_found_error", "message": "mock: only /v1/messages"}})
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}"); headers = {k.lower(): v for k, v in self.headers.items()}
        user = body.get("messages", [{}])[-1].get("content", ""); user = user if isinstance(user, str) else " ".join(b.get("text", "") for b in user if isinstance(b, dict))
        text = user.split("Utterance:\n", 1)[-1]
        errs = contract_errors(body, headers)
        SEEN.append({"path": self.path, "beta": headers.get("anthropic-beta"), "has_key_header": bool(headers.get("x-api-key") or headers.get("authorization")), "contract_errors": errs, "utterance": text,
                     "body": {k: (v if k != "system" else (v if isinstance(v, str) else json.dumps(v))[:20000]) for k, v in body.items()}})
        if errs: return self._json(400, {"type": "error", "error": {"type": "invalid_request_error", "message": "mock contract: " + "; ".join(errs[:4])}})
        if "[[mock:no-fallback-beta]]" in text and "fallbacks" in body: return self._json(400, {"type": "error", "error": {"type": "invalid_request_error", "message": "fallbacks: this parameter is not available"}})
        code, out = answer(text); return self._json(code, out)


if __name__ == "__main__":
    print(f"MOCK Claude endpoint on http://127.0.0.1:{PORT} — contract tests only, not a language model")
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
