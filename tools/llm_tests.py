#!/usr/bin/env python3
"""
Contract tests for the live language-model path (methods M62): tools/llm_interpret.py, tools/design_server.py, design/js/live.js.

  .venv/bin/python tools/llm_tests.py            (the Python that has the anthropic package; Google Chrome for the page tests)

What runs
  U  unit      the schema as sent, the validator, the grounding and business rules — no network
  C  contract  the real anthropic SDK inside the design server, talking to tools/mock_anthropic.py (a MOCK endpoint, not a
               language model): the request it sends, every failure path, what reaches the browser, what is never served
  B  browser   the page in headless Chrome, replay ?script=llm: four sentences and one run Imagine → Shape → Compose → Grow, once
               through the mock endpoint and once with the offline rules; both must end in the same site model and engine
  L  live      only when a real credential is present (ANTHROPIC_API_KEY in the environment or in .env): the same replay through
               the real model. Without a credential this block is reported as NOT RUN — never as passed.

Writes eval/llm-tests-<date>.md and eval/llm-compare-<date>.{json,md}.
"""
import html, json, os, re, subprocess, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import llm_interpret as L   # noqa: E402

CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PY = sys.executable
P_MOCK, P_SRV, P_NOKEY, P_STATIC, P_LIVE = 8790, 8791, 8792, 8794, 8795
DATE = time.strftime("%Y-%m-%d")
results = []
SENTINEL = "FAKE-KEY-sentinel-0123456789-not-a-real-key"


def test(name, cond, detail=""):
    results.append((name, bool(cond), detail)); print(f"[{'ok' if cond else 'FAIL'}] {name}" + (f"  — {detail}" if detail and not cond else ""))


def http(port, path, body=None, timeout=90):
    req = urllib.request.Request(f"http://127.0.0.1:{port}{path}", data=None if body is None else json.dumps(body).encode(), headers={"content-type": "application/json"}, method="GET" if body is None else "POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r: raw = r.read().decode(); return r.status, raw
    except urllib.error.HTTPError as e: return e.code, e.read().decode()


def start(cmd, env, port, path="/api/status"):
    p = subprocess.Popen(cmd, cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}{path}", timeout=1); return p
        except urllib.error.HTTPError: return p
        except Exception: time.sleep(0.25)
    p.terminate(); raise RuntimeError(f"nothing answered on port {port}")


def page(port, query, budget=40000):
    out = subprocess.run([CH, "--headless=new", "--disable-gpu", "--window-size=1440,900", f"--virtual-time-budget={budget}", "--dump-dom", f"http://127.0.0.1:{port}/design/index.html?{query}"], capture_output=True, text=True, timeout=240).stdout
    m = re.search(r'<pre id="script-out"[^>]*>(.*?)</pre>', out, re.S)
    if not m: return {"error": "no #script-out"}
    try: return json.loads(html.unescape(m.group(1)))
    except Exception as ex: return {"error": repr(ex)}


def clean_env(**extra):
    env = {k: v for k, v in os.environ.items() if not k.startswith(("ANTHROPIC_", "PI_LLM_"))}; env.update(extra); return env


FX = {f["id"]: f for f in json.load(open(os.path.join(ROOT, "tools", "fixtures", "llm_mock.json"), encoding="utf-8"))["fixtures"]}
DEMO = FX["demoA"]["utterance"]

# ------------------------------------------------------------------ U unit
w = L.wire_schema(); ws = json.dumps(w)


def objects(s, out):
    if isinstance(s, dict):
        if s.get("type") == "object": out.append(s)
        for v in s.values(): objects(v, out)
    elif isinstance(s, list):
        for v in s: objects(v, out)
    return out


objs = objects(w, [])
test("U1 the schema sent to the API uses only what structured outputs accept: no numeric or length constraints, every object closed, every property required, 7 unions",
     not any(f'"{k}"' in ws for k in L._UNSUPPORTED) and all(o.get("additionalProperties") is False and sorted(o["required"]) == sorted(o["properties"]) for o in objs) and ws.count('"anyOf"') <= 16, f"{len(objs)} objects, {ws.count('anyOf')} unions")
good = json.loads(json.dumps(FX["demoA"]["response"]))


def rejected(mut):
    o = json.loads(json.dumps(good)); mut(o)
    try: L.check(o, DEMO); return False
    except ValueError: return True


test("U2 the validator rejects what the schema has no place for: a polygon, an unknown kind, a function outside the knowledge graph, a goal level of 7, a missing key",
     rejected(lambda o: o["description"].__setitem__("boundary_polygon", [[0, 0]])) and rejected(lambda o: o.__setitem__("kind", "site_plan")) and rejected(lambda o: o["description"]["functions"][0].__setitem__("function", "z:hedge"))
     and rejected(lambda o: o["description"]["values"][0].__setitem__("level", 7)) and rejected(lambda o: o["description"].pop("trees")) and rejected(lambda o: o["description"]["trees"][0].__setitem__("position_m", [1, 3])))
res, val = L.check(good, DEMO); d = res["description"]
test("U3 a grounded reading becomes the offline parser's shapes: dimensions, a tree with its corner, an open area, goals, a Screen on the named edge", [f["kind"] for f in d["facts"]] == ["dimensions", "existing-tree", "no-plant-zone"] and d["facts"][1].get("corner") == "northwest" and d["values"] == {"privacy": 2, "openness": 2} and d["functions"][0]["where"] == "north-edge" and val["dropped"] == 0, json.dumps(val["rows"])[:300])


def run(mut, text=DEMO):
    o = json.loads(json.dumps(good)); mut(o); return L.check(o, text)


r1, v1 = run(lambda o: (o["description"].__setitem__("dimensions", {"w": 12, "h": 9, "unit": "m", "evidence": "6 × 4 m"}), o["description"]["conditions"].append({"key": "soil_type", "value": "clay", "evidence": "heavy clay"}), o["description"]["trees"].append({"side": "east", "corner": "none", "evidence": "a second tree"})))
test("U4 invented facts are dropped with the reason: a size the person did not type, a soil they did not mention, a second tree", not any(f["kind"] == "dimensions" for f in r1["description"]["facts"]) and not any(f["kind"] == "condition" for f in r1["description"]["facts"]) and sum(f["kind"] == "existing-tree" for f in r1["description"]["facts"]) == 1 and v1["dropped"] == 3, json.dumps([x for x in v1["rows"] if x["result"] == "dropped"]))
r2, v2 = run(lambda o: (o["description"]["functions"][0].__setitem__("where", "east-edge"), o["description"]["trees"][0].update({"side": "south", "corner": "none"})))
test("U5 a compass side the person never named is not kept: the Screen's edge is left unset and asked for, the tree waits unplaced", r2["description"]["functions"][0]["where"] == "edge-unset" and r2["description"]["facts"][1]["side"] is None and v2["changed"] == 2 and any("which edge" in u for u in r2["description"]["unknowns"]))
r3, v3 = run(lambda o: o["description"]["functions"][0].update({"target_height_m": 2.5}))
r4, _ = run(lambda o: o["description"]["functions"][0].update({"target_height_m": 2, "evidence": "privacy"}), DEMO + " The screen should be 2 m high.")
test("U6 a screen height is taken only when the person typed the number", "target_height_m" not in r3["description"]["functions"][0] and r4["description"]["functions"][0].get("target_height_m") == 2)
ft = "The yard is 20 by 30 feet."
r5, _ = L.check({"kind": "description", "reading": "", "bed_edit": None, "edit": None, "description": {**good["description"], "dimensions": {"w": 20, "h": 30, "unit": "ft", "evidence": "20 by 30 feet"}, "trees": [], "open_areas": [], "values": [], "functions": [], "hard_constraints": [], "relations": []}}, ft)
test("U7 feet are converted by the workspace, not by the model: 20 by 30 feet → 6.1 × 9.14 m", r5["description"]["facts"][0]["w"] == 6.1 and r5["description"]["facts"][0]["h"] == 9.14, json.dumps(r5["description"]["facts"]))
r6, v6 = run(lambda o: o["description"]["conditions"].append({"key": "light", "value": "clay", "evidence": "privacy"}))
test("U8 a condition value outside the site model's vocabulary for that condition is dropped", not any(f["kind"] == "condition" for f in r6["description"]["facts"]) and v6["dropped"] == 1)
bd, vb = L.check(FX["D"]["response"], FX["D"]["utterance"]); req = bd["bed_edit"]["request"]
test("U9 a bed edit is a typed request — which bed, which operation, how much (“half a metre” → 0.5) — with no coordinate anywhere", req == {"op": "resize", "target": {"side": "north", "tree": False, "name": None}, "direction": "deeper", "amount_m": 0.5, "amount_basis": req["amount_basis"]} and "half a metre" in req["amount_basis"] and len(bd["bed_edit"]["preserve"]) == 2 and not re.search(r"polygon|position|\[\[", json.dumps(bd)), json.dumps(req))
bx = json.loads(json.dumps(FX["D"]["response"])); bx["bed_edit"].update({"amount_m": 3.0, "amount_word": "none"}); bd2, _ = L.check(bx, FX["D"]["utterance"])
bx["bed_edit"].update({"op": "add", "add_side": "east"}); bd3, vb3 = L.check(bx, FX["D"]["utterance"])
test("U10 an amount the person did not give falls back to the labelled default; a new bed on a side they did not name is not created", bd2["bed_edit"]["request"]["amount_m"] == 0.5 and "default" in bd2["bed_edit"]["request"]["amount_basis"] and bd3["kind"] == "none" and vb3["dropped"] >= 1, json.dumps(bd2["bed_edit"]["request"]))
ed, ve = L.check(FX["F"]["response"], FX["F"]["utterance"])
test("U11 a planting edit is typed operations and what to keep; species are left as the person's words for the workspace to resolve", ed["edit"]["operations"][0]["type"] == "reduce_density" and ed["edit"]["operations"][0]["amount"]["value"] == 0.15 and ed["edit"]["preserve"][0]["value"] == "z:screen")
sp = L.system_prompt(); names = [s["scientific_name"] for s in json.load(open(os.path.join(ROOT, "brain", "data", "explorer.json"), encoding="utf-8"))["species"]]
test("U12 the instructions carry the knowledge graph's five functions with their definitions and no plant of the knowledge base: the model is given vocabulary, not plant facts", all(f["id"] in sp and f["definition"][:40] in sp for f in L.kg_functions()) and len(L.kg_functions()) == 5 and not any(n in sp for n in names), f"{len(sp)} chars")
old = dict(os.environ)
for k in list(os.environ):
    if k.startswith(("ANTHROPIC_", "PI_LLM_")): del os.environ[k]
st_none = L.status(); os.environ["ANTHROPIC_API_KEY"] = SENTINEL; st_key = L.status(); os.environ["PI_LLM_MOCK_URL"] = "http://127.0.0.1:1"; st_mock = L.status()
os.environ.clear(); os.environ.update(old)
test("U13 status says what is true: no credential → offline; a credential → live, without the key in the answer; the mock endpoint → mock, never live", st_none["mode"] == "offline" and not st_none["available"] and st_key["mode"] == "live" and SENTINEL not in json.dumps(st_key) and st_mock["mode"] == "mock", json.dumps([st_none["mode"], st_key["mode"], st_mock["mode"]]))

# ------------------------------------------------------------------ C contract: the real SDK against the mock endpoint
procs = []
try:
    import anthropic  # noqa: F401
    HAVE_SDK = True
except ImportError:
    HAVE_SDK = False
test("C0 the anthropic SDK is installed in the Python running these tests", HAVE_SDK, "run with .venv/bin/python (python3 -m venv .venv && .venv/bin/pip install anthropic)")
cmp_out = {"date": DATE, "note": "offline = the rule parser (real). mock = HAND-WRITTEN answers through the real SDK path (tools/fixtures/llm_mock.json) — not a language model. live = the real model, only when a credential was present.", "modes": {}}
try:
    if HAVE_SDK:
        procs.append(start([PY, "tools/mock_anthropic.py", "--port", str(P_MOCK)], clean_env(), P_MOCK, "/_requests"))
        procs.append(start([PY, "-I", "tools/design_server.py", "--port", str(P_SRV)], clean_env(PI_LLM_MOCK_URL=f"http://127.0.0.1:{P_MOCK}", ANTHROPIC_API_KEY=SENTINEL), P_SRV))
        procs.append(start([PY, "-I", "tools/design_server.py", "--port", str(P_NOKEY)], clean_env(), P_NOKEY))
        ask = lambda text, port=P_SRV: json.loads(http(port, "/api/interpret", {"text": text, "context": {"stage": "welcome"}})[1])
        code, raw = http(P_SRV, "/api/status"); st = json.loads(raw)
        test("C1 /api/status reports the mock endpoint as mock, and the server's key is not in the answer", st["llm"]["mode"] == "mock" and st["llm"]["available"] and SENTINEL not in raw)
        a = ask(DEMO)
        test("C2 a sentence goes browser-side API → design server → anthropic SDK → endpoint and comes back checked: mode mock, schema valid, 9 items accepted", a.get("mode") == "mock" and a["validation"]["schema"] == "valid" and a["validation"]["accepted"] == 9 and a["result"]["kind"] == "description" and SENTINEL not in json.dumps(a), json.dumps(a)[:300])
        seen = json.loads(http(P_MOCK, "/_requests")[1]); rq = seen[-1]; b = rq["body"]
        test("C3 the request the SDK sends meets the documented contract: bare model id, structured-output schema, effort, no sampling parameters, no prefill, refusal fallback requested with its beta header",
             rq["contract_errors"] == [] and b["model"] == "claude-opus-5-5" and b["max_tokens"] == 16000 and b["output_config"]["format"]["type"] == "json_schema" and b["output_config"]["effort"] == "medium" and b.get("fallbacks") == "default" and "server-side-fallback-2026-07-01" in (rq["beta"] or "") and rq["has_key_header"]
             and not any(k in b for k in ("temperature", "top_p", "top_k", "thinking")) and "data, not instructions" in b["messages"][0]["content"], json.dumps({k: b.get(k) for k in ("model", "max_tokens", "fallbacks")}))
        fails = {m: ask(f"{DEMO} [[mock:{m}]]") for m in ("500", "429", "invalid-json", "schema-violation", "refusal", "max-tokens", "geometry", "plant-fact")}
        test("C4 every failure is an offline answer with its reason, never an error page and never a half-used reading: server error, rate limit, broken JSON, an unknown kind, a refusal, a cut-off answer, a polygon in the answer, a function that is not in the knowledge graph",
             all(v.get("mode") == "offline" and v.get("reason") and "result" not in v for v in fails.values()) and "schema" in fails["geometry"]["reason"] and "schema" in fails["plant-fact"]["reason"] and "declined" in fails["refusal"]["reason"] and "500" in fails["500"]["reason"], json.dumps({k: v.get("reason", "")[:70] for k, v in fails.items()}))
        ug = ask(f"{DEMO} [[mock:ungrounded]]"); facts = ug["result"]["description"]["facts"]
        test("C5 an answer with things the person did not say is used without them: the invented 12 × 9 m, the clay soil and the second tree are dropped and listed", ug["mode"] == "mock" and not any(f["kind"] == "dimensions" for f in facts) and not any(f["kind"] == "condition" for f in facts) and sum(f["kind"] == "existing-tree" for f in facts) == 1 and ug["validation"]["dropped"] == 3, json.dumps([x["item"] for x in ug["validation"]["rows"] if x["result"] == "dropped"]))
        n0 = len(json.loads(http(P_MOCK, "/_requests")[1])); nf = ask(f"{DEMO} [[mock:no-fallback-beta]]"); after = json.loads(http(P_MOCK, "/_requests")[1])[n0:]
        test("C6 where the refusal-fallback beta is not offered, the same request is sent once more without it and the reading is used", nf.get("mode") == "mock" and len(after) == 2 and "fallbacks" in after[0]["body"] and "fallbacks" not in after[1]["body"], f"{len(after)} requests")
        cc = ask(FX["C"]["utterance"]); fn = cc["result"]["description"]["functions"]
        test("C7 a plausible inference is still corrected: “the house behind us” names no compass side, so the Screen's edge stays unset and is asked for", all(f["where"] == "edge-unset" for f in fn) and cc["validation"]["changed"] == 2 and any("which edge" in u for u in cc["result"]["description"]["unknowns"]), json.dumps(fn)[:200])
        nk = ask(DEMO, P_NOKEY)
        test("C8 a server without a credential answers offline and says why", nk.get("mode") == "offline" and "credential" in nk.get("reason", ""), json.dumps(nk))
        served = {p: http(P_SRV, p)[0] for p in ("/.gitignore", "/.git/HEAD", "/.venv/pyvenv.cfg", "/.env", "/design/index.html")}
        test("C9 files whose name starts with a dot are never served (.env, .git, .venv); the page is", all(served[p] == 404 for p in served if p != "/design/index.html") and served["/design/index.html"] == 200, json.dumps(served))
        nn = ask("Hello there.")
        test("C10 a sentence with nothing to read comes back as kind none", nn.get("mode") == "mock" and nn["result"]["kind"] == "none")

        # -------------------------------------------------------------- B browser
        mock = page(P_SRV, "fresh=1&script=llm").get("llm"); off = page(P_SRV, "fresh=1&script=llm&interp=offline").get("llm")
        if mock and off:
            cmp_out["modes"]["mock"] = mock; cmp_out["modes"]["offline"] = off
            cm, co = mock["cases"], off["cases"]; rm, ro = mock["run"], off["run"]
            test("B1 the page says who read each sentence: through the mock endpoint every reading is labelled MOCK (never Live LLM); with ?interp=offline every reading is by the rules",
                 mock["server_llm"]["mode"] == "mock" and all(c["reader"] == "mock" and "MOCK" in c["tag"] and "Live" not in c["tag"] and "MOCK" in (c["provenance"] or "") for c in cm.values()) and all(c["reader"] == "offline" and c["tag"] == "Offline rules" for c in co.values()), json.dumps([[c["reader"], c["tag"]] for c in cm.values()]))
            A = cm["A"]["model"]
            test("B2 case A through the model path: 6 × 4 m, the tree in the northwest corner (placed as an estimate by the workspace at 1, 3), an open centre, a Screen on the north edge, the relationships recorded — and four beds from the spatial engine",
                 A["size"] == [6, 4] and A["features"][0] == {"kind": "existing-tree", "status": "inferred", "at": [1, 3]} and "screen@north-edge" in A["functions"] and len(A["relations"]) == 3 and len(A["beds"]) == 4 and "keep-tree" in A["hard"], json.dumps(A)[:300])
            Bm = cm["B"]["model"]
            test("B3 case B: nothing is invented — no size, a sketch, the tree waits unplaced, in both readers", all(m_["size"] is None and m_["sketch"] == "active" and not m_["features"] and m_["notes"][0]["placed"] is False for m_ in (Bm, co["B"]["model"])), json.dumps(Bm)[:200])
            Cm = cm["C"]["model"]
            test("B4 case C: privacy, openness and partial shade together — Screen with its edge unset plus the Scrim alternative, light part-shade — the same brief from both readers", Cm["functions"] == ["screen@edge-unset", "scrim@edge-unset (alternative)"] and Cm["conditions"] == {"light": "part-shade"} and co["C"]["model"]["functions"] == Cm["functions"] and co["C"]["model"]["conditions"] == Cm["conditions"], json.dumps(Cm["functions"]))
            Dm = cm["D"]
            test("B5 case D: the bed edit is previewed and applied by the spatial engine — the north bed grows, the open centre is unchanged and no bed enters it, the tree bed is unchanged",
                 Dm["kind"] == "bed_edit_request" and Dm["preview"]["ok"] and Dm["preview"]["changes"][0]["after_m2"] > Dm["preview"]["changes"][0]["before_m2"] and Dm["open_area_unchanged"] and Dm["bed_area_inside_open_m2"] == 0 and Dm["tree_bed_unchanged"], json.dumps(Dm["preview"]))
            test("B6 one run Imagine → Shape → Compose → Grow with every sentence read through the model path: site condition and screen requirement arrive in the model, the garden is generated and valid",
                 rm["imagine"]["stage"] == "site" and rm["shape_words"]["light"] == "part-shade" and "screen@north-edge · 2 m · year-round" in rm["compose_words"]["functions"] and rm["grow"]["stage"] == "garden" and rm["grow"]["plants"] > 0 and rm["grow"]["valid"] and rm["grow"]["inside_beds"] and rm["grow"]["same_as_compose_preview"] and mock["readers"] == ["mock"] * 4, json.dumps(rm["grow"])[:300])
            kn = rm["knowledge"]; kc = mock["knowledge_calls"]
            test("B7 the plants come from the knowledge adapter and the planting engine, not from the reader: the adapter is called (gates, function evidence, heights, leaf retention), candidates carry claim ids and fits, the requirement read from words (2 m, year-round) is what the selection used",
                 all(kc.get(m_, 0) > 0 for m_ in ("gate", "functionEvidence", "heightAgainst", "yearRound")) and kn["requirement"]["target_height_m"] == 2 and kn["requirement"]["year_round"] is True and any(c["claims"] for c in kn["screen_candidates"]) and all(c["fit"] in ("meets", "uncertain", "fails") for c in kn["screen_candidates"]) and len(kn["screen_candidates"]) == 10 and kn["conditions_read"]["light"] == "part-shade", json.dumps(kc))
            test("B8 nothing is presented as verified: every evaluation says verified_performance false, unknown conditions stay listed, the Screen's verdict is the engine's", all(z["verified_performance"] is False for z in rm["grow"]["screen"]) and all(g["verified_performance"] is False for g in rm["grow"]["ground"]) and "soil_type" in rm["grow"]["unknown_conditions"] and kn["verdict"] in ("not met", "uncertain", "met on claimed sizes"))
            test("B9 both readers end in the same site model and the same planting engine: the same run read by the rules gives the same garden (plants, species, evaluation)", ro["grow"]["plants"] == rm["grow"]["plants"] and ro["grow"]["species"] == rm["grow"]["species"] and ro["grow"]["screen"] == rm["grow"]["screen"] and ro["compose_words"]["functions"] == rm["compose_words"]["functions"], f"{rm['grow']['plants']} / {ro['grow']['plants']} plants")
            test("B10 a planting edit in words reaches the engine's preview from the model path too: reduce density, the Screen kept", rm["grow_words"]["kind"] == "spatial_edit_request" and rm["grow_words"]["operations"] == ["reduce_density 0.15"] and "z:screen" in rm["grow_words"]["preserve"] and rm["grow_words"]["preview_targets"] > 0)
            test("B11 where the rules fall short (real results): the rules miss the tree called “an old maple” in A and read the bed edit of D as a description, so no bed changes", not any(f["kind"] == "existing-tree" for f in co["A"]["model"]["features"]) and co["D"]["kind"] == "description" and co["D"]["preview"] is None, json.dumps([co["A"]["model"]["features"], co["D"]["kind"]]))
        else:
            test("B0 the replay ran in both modes", False, json.dumps([bool(mock), bool(off)]))
        fb = page(P_SRV, "fresh=1&script=llmfail").get("llmfail")
        test("B12 when the model path fails mid-use the page carries on with the rules and says so: the site is still built, the top bar reads “Offline rules · live model not used”, the reason is kept", bool(fb) and fb["reader"] == "offline" and "not used" in fb["tag"] and fb["size"] == [6, 4] and "500" in (fb["reason"] or "") and "offline rules" in (fb["mode_line"] or ""), json.dumps(fb))
        procs.append(start([sys.executable, "-m", "http.server", str(P_STATIC), "--bind", "127.0.0.1"], clean_env(), P_STATIC, "/design/index.html"))
        stat = page(P_STATIC, "fresh=1&script=llm&stop=cases")
        test("B13 on a static host (no API, as on GitHub Pages) the page reads with the rules and does not ask for a model", "stopped at cases" in (stat.get("error") or ""), json.dumps(stat)[:200])

        # -------------------------------------------------------------- L live (only with a real credential)
        L.load_dotenv(); real = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")
        if real:
            procs.append(start([PY, "-I", "tools/design_server.py", "--port", str(P_LIVE)], {k: v for k, v in os.environ.items() if k != "PI_LLM_MOCK_URL"}, P_LIVE))
            live = page(P_LIVE, "fresh=1&script=llm", 240000).get("llm")
            if live:
                cmp_out["modes"]["live"] = live; lc = live["cases"]
                test("L1 the real model read the four sentences and the run, and every reading passed the checks or fell back with a reason", all(c["reader"] in ("live", "offline") for c in lc.values()) and any(c["reader"] == "live" for c in lc.values()), json.dumps([[c["reader"], c["reason"]] for c in lc.values()]))
                test("L2 the run reached Grow through the real model", live["run"]["grow"]["plants"] > 0 and live["run"]["grow"]["valid"])
            else: test("L0 the live replay ran", False)
        else:
            print("[not run] L live — no model credential on this machine: the real model has NOT been exercised")
finally:
    for p in procs:
        try: p.terminate()
        except Exception: pass
    for f in os.listdir(os.path.join(ROOT, "designs")):   # the projects the replays saved
        if re.fullmatch(r"llm-(a|b|c|d|run|fail)\.json", f): os.remove(os.path.join(ROOT, "designs", f))

# ------------------------------------------------------------------ write the records
ok = sum(1 for _, c, _ in results if c); live_ran = "live" in cmp_out["modes"]
os.makedirs(os.path.join(ROOT, "eval"), exist_ok=True)
with open(os.path.join(ROOT, "eval", f"llm-tests-{DATE}.md"), "w", encoding="utf-8") as f:
    f.write(f"# Live language-model path — contract tests ({DATE})\n\n{ok}/{len(results)} pass. Real model: **{'exercised' if live_ran else 'NOT exercised — no credential on this machine; block L not run'}**.\n"
            "The C and B blocks use the real anthropic SDK against `tools/mock_anthropic.py`, a mock endpoint with hand-written answers: they test the code path and the checks, not a model's understanding.\n\n")
    for name, c, detail in results: f.write(f"- [{'x' if c else ' '}] {name}{'' if c or not detail else f' — `{detail[:300]}`'}\n")
json.dump(cmp_out, open(os.path.join(ROOT, "eval", f"llm-compare-{DATE}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def brief_line(c):
    m = c.get("model") or {}; parts = []; said_tree = bool(re.search(r"\b(tree|maple)\b", c.get("utterance", ""), re.I))
    parts.append(f"size {m.get('size') and '×'.join(str(x) for x in m['size']) or '— (sketch)'}")
    trees = [f for f in m.get("features", []) if f["kind"] == "existing-tree"]; waiting = [n for n in m.get("notes", []) if n["kind"] == "existing-tree" and not n["placed"]]
    if trees or waiting or said_tree: parts.append("tree " + (f"at {trees[0]['at']} (estimate, placed by the workspace)" if trees else "waits unplaced" if waiting else "**not read**"))
    if any(f["kind"] == "no-plant-zone" for f in m.get("features", [])): parts.append("open centre")
    if m.get("conditions"): parts.append("conditions " + ", ".join(f"{k} {v}" for k, v in m["conditions"].items()))
    parts.append("functions " + ("; ".join(m.get("functions", [])) or "none"))
    parts.append(f"beds {len(m.get('beds', []))}")
    if m.get("relations"): parts.append(f"relations {len(m['relations'])}")
    return " · ".join(parts)


with open(os.path.join(ROOT, "eval", f"llm-compare-{DATE}.md"), "w", encoding="utf-8") as f:
    f.write(f"# Offline rules and the model path on four sentences ({DATE})\n\n"
            "Same page, same site model, same spatial engine, knowledge adapter and planting engine; only the reader of the words differs.\n\n"
            "- **offline** — the rule parser (`design/js/intent.js`). Real results.\n"
            "- **mock** — HAND-WRITTEN answers (`tools/fixtures/llm_mock.json`) sent through the real SDK path and the checks. Not a language model: this column shows what the pipeline does with an answer of that shape, not what a model understands.\n"
            f"- **live** — the real model. {'Run on this machine.' if live_ran else '**Not run: no model credential on this machine.** Run `.venv/bin/python tools/llm_tests.py` with ANTHROPIC_API_KEY set to fill this column.'}\n\n")
    for cid in "ABCD":
        f.write(f"## {cid} — {FX[cid]['label']}\n\n> {FX[cid]['utterance']}\n\n| reader | read by | result in the site model and brief |\n|---|---|---|\n")
        for mode in ("offline", "mock", "live"):
            c = (cmp_out["modes"].get(mode) or {}).get("cases", {}).get(cid)
            if not c: f.write(f"| {mode} | not run | — |\n"); continue
            if cid == "D":
                line = f"bed edit: {json.dumps(c['request'])} → {c['preview']['changes'][0]['bed']} {c['preview']['changes'][0]['before_m2']} → {c['preview']['changes'][0]['after_m2']} m²; open centre unchanged: {c['open_area_unchanged']}; tree bed unchanged: {c['tree_bed_unchanged']}; engine notes: {'; '.join(c['preview']['conflicts']) or 'none'}" if c.get("preview") else f"read as a **{c['kind']}** — no bed changed (north bed still {next((b['area'] for b in c['beds_after'] if b['name'] == 'North bed'), '?')} m²)"
            else: line = brief_line(c)
            chk = c.get("checks"); who = c["reader"] + (f" · {c['llm']}" if c.get("llm") else "") + (f" · fell back: {c['reason']}" if c.get("reason") and mode != "offline" else "")
            if chk: who += f" · {chk['accepted']} accepted, {chk['changed']} changed, {chk['dropped']} dropped"
            f.write(f"| {mode} | {who} | {line} |\n")
        f.write("\n")
print(f"{ok}/{len(results)} pass → eval/llm-tests-{DATE}.md · eval/llm-compare-{DATE}.md" + ("" if live_ran else " · real model NOT exercised (no credential)"))
sys.exit(0 if ok == len(results) else 1)
