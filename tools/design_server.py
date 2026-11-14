#!/usr/bin/env python3
"""
Local server for the design workspace (brief 2026-11-07 'Phase 2'): serves the repository root (so /design/ and /brain/ work as on
GitHub Pages) and adds a small JSON API so the workspace can persist design projects as files in designs/ — real design data on disk,
not only in the browser's localStorage.

  python3 -I tools/design_server.py [--port 8768]      ->  http://127.0.0.1:8768/design/

API (loopback only):
  GET  /api/status                 {"server": true, "llm": {"available": bool, "model": …, "reason": …}, "designs": [ids]}
  GET  /api/designs                list of saved projects (id, name, updated)
  GET  /api/designs/<id>           the project JSON
  PUT  /api/designs/<id>           save the project JSON (body) -> designs/<id>.json
  POST /api/interpret              {"text": …, "context": …}
                                   -> {"mode": "live" | "mock", "model": …, "result": …, "validation": …} when a language model
                                      read the words and its answer passed the schema and the grounding rules, else
                                      {"mode": "offline", "reason": …} and the browser uses its rule parser (design/js/intent.js).
The language model lives in tools/llm_interpret.py (Claude API, structured JSON output): it interprets language and nothing else —
no geometry, no plant fact, no plant choice. The model credential stays in this process (environment or the git-ignored .env); it
is never sent to the browser and files whose name starts with a dot are not served.
Standard library only; the anthropic package is imported only when a call is made.
"""
import json, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import llm_interpret as LLM
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESIGNS = os.path.join(ROOT, "designs")
os.makedirs(DESIGNS, exist_ok=True)
PORT = int(sys.argv[sys.argv.index("--port") + 1]) if "--port" in sys.argv else 8768
SAFE = re.compile(r"^[A-Za-z0-9_-]{1,80}$")

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, fmt, *args):
        if "/api/" in str(args[0] if args else ""):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code); self.send_header("Content-Type", "application/json; charset=utf-8"); self.send_header("Content-Length", str(len(body))); self.send_header("Cache-Control", "no-store"); self.end_headers(); self.wfile.write(body)

    def _read(self):
        n = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(n) or b"{}")

    def do_GET(self):
        if self.path == "/api/status":
            return self._json(200, {"server": True, "root": ROOT, "designs_dir": "designs/", "llm": LLM.status(), "designs": sorted(f[:-5] for f in os.listdir(DESIGNS) if f.endswith(".json"))})
        if self.path == "/api/designs":
            out = []
            for f in sorted(os.listdir(DESIGNS)):
                if f.endswith(".json"):
                    try:
                        p = json.load(open(os.path.join(DESIGNS, f), encoding="utf-8")); out.append({"id": f[:-5], "name": p.get("name"), "updated": p.get("updated"), "versions": len(p.get("versions", []))})
                    except Exception as ex:
                        out.append({"id": f[:-5], "error": str(ex)})
            return self._json(200, out)
        if self.path.startswith("/api/designs/"):
            pid = unquote(self.path.split("/", 3)[3])
            if not SAFE.match(pid): return self._json(400, {"error": "bad id"})
            f = os.path.join(DESIGNS, pid + ".json")
            if not os.path.exists(f): return self._json(404, {"error": "not found"})
            return self._json(200, json.load(open(f, encoding="utf-8")))
        if self.path.startswith("/api/"): return self._json(404, {"error": "unknown"})
        if any(part.startswith(".") for part in unquote(self.path.split("?")[0]).split("/") if part): return self.send_error(404)   # .env, .git, .venv: never served
        return super().do_GET()

    def do_PUT(self):
        if self.path.startswith("/api/designs/"):
            pid = unquote(self.path.split("/", 3)[3])
            if not SAFE.match(pid): return self._json(400, {"error": "bad id"})
            p = self._read(); p["updated"] = time.strftime("%Y-%m-%dT%H:%M:%S")
            f = os.path.join(DESIGNS, pid + ".json")
            with open(f, "w", encoding="utf-8") as fh: json.dump(p, fh, ensure_ascii=False, indent=1)
            return self._json(200, {"saved": os.path.relpath(f, ROOT), "updated": p["updated"], "versions": len(p.get("versions", []))})
        return self._json(404, {"error": "unknown"})

    def do_POST(self):
        if self.path == "/api/interpret":
            try: body = self._read()
            except Exception: return self._json(400, {"error": "bad json"})
            return self._json(200, LLM.interpret(body.get("text", ""), body.get("context", {})))
        return self._json(404, {"error": "unknown"})


LLM.load_dotenv()

if __name__ == "__main__":
    print(f"design server on http://127.0.0.1:{PORT}/design/  (designs saved to {os.path.relpath(DESIGNS, ROOT)}/; llm: {LLM.status()['mode']} — {LLM.status()['reason']})")
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
