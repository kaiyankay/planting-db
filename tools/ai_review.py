#!/usr/bin/env python3
"""
AI-assisted evidence review pipeline (brief 2026-11-02 'Verification Workbench' §02; methods M42).

  python3 -I tools/ai_review.py --queue                  # build review/ai/queue.json from plants/*.json + brain/data/kg.json
  python3 -I tools/ai_review.py --fetch [--retry]        # fetch every distinct source URL once -> review/ai/cache/ (gitignored) + fetch_log.json
  python3 -I tools/ai_review.py --checks                 # programmatic checks per claim -> review/ai/checks.json
  python3 -I tools/ai_review.py --assess [--limit N]     # LLM evidence assessment through the Anthropic API (needs ANTHROPIC_API_KEY)
  python3 -I tools/ai_review.py --status                 # coverage: source checked / program checks only / unavailable / awaiting AI / awaiting human

Stages are separate so each can be re-run, retried and audited. Nothing here changes a claim's status (verification is the
human's decision, tools/review_apply.py). Records:
  review/ai/queue.json              one row per unverified claim: priority score, downstream impact, conflicts, fingerprint
  review/ai/cache/<sha>.txt         fetched page text per URL (private use only — never committed; tier-B sources forbid copying)
  review/ai/fetch_log.json          per URL: http status, time, bytes, error, method
  review/ai/checks.json             per claim: url_status, name_on_page, numbers_on_page, source_registered, conflicts, impact
  review/ai/assessments/*.jsonl     AI assessment records (one JSON per line; schema below) — written by --assess (API) or by a
                                    Claude Code agent that read the source page (method 'agent-read'); both carry model + method
AI assessment record (every key present):
  {"review_id", "claim_id", "fingerprint", "plant", "field", "original_claim": {value, text, context}, "source_id", "source_url",
   "locator" (where on the page the evidence sits, or null), "evidence_excerpt" (<= 25 words of the source, or null),
   "result": supported_by_source | partially_supported | not_supported | conflicting_evidence | source_unavailable | insufficient_evidence,
   "explanation", "missing_context", "conflicting_claims": [ids], "taxonomy_check": same_taxon | genus_only | cultivar_mismatch | unclear,
   "geo_check", "risk": high | medium | low, "priority", "model", "method", "reviewed_at"}
Standard library only (urllib). The API call is a plain HTTPS POST so no SDK is needed.
"""
import hashlib, html, json, os, re, sys, time, urllib.request, urllib.error
from collections import Counter, defaultdict
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(HERE)
AI = os.path.join(ROOT, "review", "ai"); CACHE = os.path.join(AI, "cache"); ASSESS = os.path.join(AI, "assessments")
for d in (AI, CACHE, ASSESS): os.makedirs(d, exist_ok=True)
J = lambda p: json.load(open(p, encoding="utf-8"))
def W(p, o): json.dump(o, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
NOW = lambda: datetime.now(timezone.utc).isoformat(timespec="seconds")
RESULTS = ("supported_by_source", "partially_supported", "not_supported", "conflicting_evidence", "source_unavailable", "insufficient_evidence")


def fingerprint(c):
    """content fingerprint of a claim: what a reviewer looked at. Annotation fields (concepts, place…) are excluded on purpose."""
    core = {k: c.get(k) for k in ("id", "field", "value", "text", "source_id", "context", "status", "confidence")}
    return hashlib.sha256(json.dumps(core, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()[:16]


def load_plants():
    out = {}
    for f in sorted(os.listdir(os.path.join(ROOT, "plants"))):
        if f.endswith(".json"): p = J(os.path.join(ROOT, "plants", f)); out[p["entity"]["id"]] = p
    return out


# ---------------------------------------------------------------- queue
def build_queue():
    plants = load_plants(); kg = J(os.path.join(ROOT, "brain", "data", "kg.json")); schema = J(os.path.join(ROOT, "schema.json"))
    gate = set(schema["field_tiers"]["gate"]["fields"])
    use = defaultdict(set)
    for e in kg["edges"]:
        b = e.get("basis") or {}
        for cid in b.get("claims") or []: use[cid].add(e["type"])
        if e.get("claim_id"): use[e["claim_id"]].add(e["type"])
        for cid in b.get("derived_from") or []: use[cid].add("relation_derived")
        for r in e.get("requirements") or []:
            for ev in r.get("evidence") or []:
                if ev.get("claim"): use[ev["claim"]].add("design_requirement")
    dis = defaultdict(list)
    for d in kg["conflicts"]["disagreement"]:
        a, b = d["claims"]; dis[a].append(b); dis[b].append(a)
    var = defaultdict(list)
    for v in kg["conflicts"]["variation"]:
        for a in v["claims"]: var[a] += [x for x in v["claims"] if x != a]
    rows = []
    for pid, p in plants.items():
        for c in p["claims"]:
            if c.get("status") != "unverified" or c.get("source_type") == "model": continue
            u = use.get(c["id"], set()); score = 0; why = []
            if c["field"] in gate: score += 3; why.append("gate field")
            if "design_requirement" in u or "design" in u: score += 2; why.append("feeds a design-suitability check")
            if "layer" in u or "height_band" in u: score += 1; why.append("feeds height band / layer")
            if "relation_derived" in u: score += 2; why.append("basis of a derived relation")
            if c["id"] in dis: score += 2; why.append(f"disagrees with {len(dis[c['id']])} claim(s)")
            if c["id"] in var: score += 1; why.append("condition-dependent variation")
            if (c.get("note") or "").lower().find("loose") >= 0 or "mapping" in (c.get("note") or "").lower(): score += 1; why.append("forced vocabulary mapping noted")
            if c.get("confidence", 1) < 0.65: score += 1; why.append("low extraction confidence")
            rows.append({"claim_id": c["id"], "plant": pid, "field": c["field"], "source_id": c["source_id"], "source_url": c.get("source_url"), "value": c.get("value"), "value_label": c.get("value_label"), "text": c.get("text"), "context": c.get("context"), "confidence": c.get("confidence"), "note": c.get("note"), "cultivar": c.get("cultivar"), "place": c.get("place"),
                         "fingerprint": fingerprint(c), "priority": "high" if score >= 5 else "medium" if score >= 3 else "low", "priority_score": score, "priority_reasons": why, "downstream": sorted(u), "conflicting_claims": sorted(set(dis.get(c["id"], []) + var.get(c["id"], [])))})
    rows.sort(key=lambda r: (-r["priority_score"], r["plant"], r["field"], r["claim_id"]))
    q = {"generated": NOW(), "n": len(rows), "by_priority": dict(Counter(r["priority"] for r in rows)), "by_plant": dict(Counter(r["plant"] for r in rows)), "by_source": dict(Counter(r["source_id"] for r in rows)), "distinct_urls": len({r["source_url"] for r in rows if r["source_url"]}), "rows": rows}
    W(os.path.join(AI, "queue.json"), q)
    print(f"queue: {q['n']} unverified claims · {q['by_priority']} · {q['distinct_urls']} distinct URLs -> review/ai/queue.json")
    return q


# ---------------------------------------------------------------- fetch
def strip_html(s):
    s = re.sub(r"(?is)<(script|style|noscript).*?</\1>", " ", s); s = re.sub(r"(?s)<[^>]+>", " ", s); s = html.unescape(s)
    return re.sub(r"[ \t\r\f\v]+", " ", re.sub(r"\n\s*\n+", "\n", s)).strip()


def fetch_all(retry=False):
    q = J(os.path.join(AI, "queue.json")); logp = os.path.join(AI, "fetch_log.json"); log = J(logp) if os.path.exists(logp) else {}
    urls = sorted({r["source_url"] for r in q["rows"] if r["source_url"]})
    for u in urls:
        key = hashlib.sha256(u.encode()).hexdigest()[:20]; path = os.path.join(CACHE, key + ".txt")
        if u in log and log[u].get("status") == 200 and os.path.exists(path) and not retry: continue
        if u in log and log[u].get("status") != 200 and not retry and log[u].get("attempts", 1) >= 2: continue
        rec = log.get(u, {"attempts": 0}); rec["attempts"] = rec.get("attempts", 0) + 1; rec["fetched_at"] = NOW(); rec["method"] = "urllib GET"
        fetch_url = u
        # evidence routes (M42): the public page is a JS app or refuses scripts, so the evidence is read where the claim was taken from
        m_usda = re.search(r"plants\.usda\.gov/plant-profile/([A-Z0-9]+)", u)
        m_inat = re.search(r"inaturalist\.org/observations\?(.*)", u)
        if m_usda: fetch_url = f"https://plantsservices.sc.egov.usda.gov/api/PlantProfile?symbol={m_usda.group(1)}"; rec["method"] = "USDA PLANTS API (PlantProfile + PlantCharacteristics)"
        elif m_inat: fetch_url = f"https://api.inaturalist.org/v1/observations?{m_inat.group(1)}&per_page=0"; rec["method"] = "iNaturalist API count (same filters as the claim)"
        elif "missouribotanicalgarden.org/PlantFinder" in u: fetch_url = u.replace("https://www.missouribotanicalgarden.org", "https://plantfinder.mobot.org"); rec["method"] = "GET via plantfinder.mobot.org (same page; the www host fails certificate verification here)"
        rec["fetched_from"] = fetch_url
        try:
            req = urllib.request.Request(fetch_url, headers={"User-Agent": "planting-db review/0.1 (ARCH540 UBC; evidence check, one request per page)", "Accept": "text/html,application/json;q=0.9,*/*;q=0.8"})
            with urllib.request.urlopen(req, timeout=40) as r:
                raw = r.read(); rec["status"] = r.status; rec["bytes"] = len(raw); rec["content_type"] = r.headers.get("Content-Type")
            text = raw.decode("utf-8", "replace"); text = strip_html(text) if "html" in (rec["content_type"] or "") or text.lstrip().startswith("<") else text
            if m_usda:   # add the characteristics table (the values most claims cite)
                try:
                    pid_ = json.loads(raw.decode("utf-8", "replace")).get("Id")
                    if pid_:
                        with urllib.request.urlopen(urllib.request.Request(f"https://plantsservices.sc.egov.usda.gov/api/PlantCharacteristics/{pid_}", headers={"User-Agent": "planting-db review/0.1"}), timeout=40) as r2: ch = json.loads(r2.read().decode("utf-8", "replace"))
                        text += "\n\nCHARACTERISTICS\n" + "\n".join(f"{x.get('PlantCharacteristicName')}: {x.get('PlantCharacteristicValue')}" + (f" [cultivar {x.get('CultivarName')}]" if x.get("CultivarName") else "") for x in ch)
                        time.sleep(1.0)
                except Exception as e2: rec["characteristics_error"] = str(e2)[:120]
            if m_inat:
                try: text = "total_results: " + str(json.loads(raw.decode("utf-8", "replace")).get("total_results")) + "\n" + text[:2000]
                except Exception: pass
            open(path, "w", encoding="utf-8").write(text); rec["cache"] = os.path.relpath(path, ROOT); rec["chars"] = len(text); rec.pop("error", None)
        except urllib.error.HTTPError as e: rec["status"] = e.code; rec["error"] = f"HTTP {e.code}"
        except Exception as e: rec["status"] = None; rec["error"] = f"{type(e).__name__}: {str(e)[:160]}"
        log[u] = rec; W(logp, log); time.sleep(1.0)
        print(f"  {rec.get('status')} {u[:90]} {rec.get('error', '')}")
    ok = sum(1 for u in urls if log.get(u, {}).get("status") == 200)
    print(f"fetch: {ok}/{len(urls)} URLs cached (text only, gitignored) -> review/ai/fetch_log.json")


# ---------------------------------------------------------------- programmatic checks
NUM_RE = re.compile(r"\d+(?:\.\d+)?")
def numbers_in(v):
    out = set()
    def walk(x):
        if isinstance(x, bool): return
        if isinstance(x, (int, float)): out.add(x)
        elif isinstance(x, dict): [walk(y) for y in x.values()]
        elif isinstance(x, list): [walk(y) for y in x]
        elif isinstance(x, str): [out.add(float(n)) for n in NUM_RE.findall(x)]
    walk(v); return {n for n in out if n not in (0,)}


def run_checks():
    q = J(os.path.join(AI, "queue.json")); log = J(os.path.join(AI, "fetch_log.json")) if os.path.exists(os.path.join(AI, "fetch_log.json")) else {}
    sources = {s["id"]: s for s in J(os.path.join(ROOT, "sources.json"))["sources"]}; plants = load_plants()
    out = {}
    for r in q["rows"]:
        e = plants[r["plant"]]["entity"]; u = r["source_url"]; rec = log.get(u, {}); text = None
        if rec.get("status") == 200 and rec.get("cache") and os.path.exists(os.path.join(ROOT, rec["cache"])): text = open(os.path.join(ROOT, rec["cache"]), encoding="utf-8").read()
        low = (text or "").lower(); genus, species = e["scientific_name"].split()[:2]
        nums = numbers_in(r["value"]); found = {n for n in nums if re.search(rf"(?<![\d.]){n:g}(?![\d])", low)} if text else set()
        c = {"claim_id": r["claim_id"], "url_status": rec.get("status"), "url_error": rec.get("error"), "page_cached": bool(text), "source_registered": r["source_id"] in sources, "licence_tier": sources.get(r["source_id"], {}).get("licence_tier"),
             "name_on_page": {"scientific": bool(text) and e["scientific_name"].lower() in low, "genus": bool(text) and genus.lower() in low, "species_epithet": bool(text) and species.lower() in low, "synonym": bool(text) and any(s.lower() in low for s in e.get("synonyms_scientific", []))},
             "numbers_in_claim": sorted(nums), "numbers_on_page": sorted(found), "all_numbers_on_page": bool(nums) and found == nums, "conflicting_claims": r["conflicting_claims"], "downstream": r["downstream"], "priority": r["priority"], "checked_at": NOW()}
        c["program_result"] = ("source_unavailable" if not text else "taxon_not_on_page" if not (c["name_on_page"]["scientific"] or c["name_on_page"]["synonym"] or (c["name_on_page"]["genus"] and c["name_on_page"]["species_epithet"])) else "numbers_found" if nums and found == nums else "numbers_partly_found" if nums and found else "numbers_missing" if nums else "taxon_on_page")
        out[r["claim_id"]] = c
    W(os.path.join(AI, "checks.json"), {"generated": NOW(), "n": len(out), "summary": dict(Counter(c["program_result"] for c in out.values())), "checks": out})
    print(f"checks: {len(out)} claims · {dict(Counter(c['program_result'] for c in out.values()))} -> review/ai/checks.json")


# ---------------------------------------------------------------- LLM assessment (API path; not run without a key)
PROMPT = """You are checking one database claim against the text of its source page. Judge ONLY from the page text given; never from your own knowledge. Return strict JSON with keys: result (one of {results}), locator (where on the page the evidence sits, or null), evidence_excerpt (at most 25 words quoted from the page, or null), explanation (2-3 sentences), missing_context (conditions the claim omits, or null), taxonomy_check (same_taxon | genus_only | cultivar_mismatch | unclear), geo_check (one sentence on whether the page's region matches the claim's place/context), risk (high | medium | low).
Claim: plant {plant}; field {field}; value {value}; label {label}; text: {text}; context: {context}; cultivar: {cultivar}.
Source: {source_id} {url}
Page text (truncated):
{page}"""


def assess(limit=None, model=None):
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key: sys.exit("--assess needs ANTHROPIC_API_KEY (not set on this machine on 2026-11-02; assessments were produced by Claude Code agents reading the sources instead — method 'agent-read')")
    model = model or os.environ.get("REVIEW_MODEL", "claude-sonnet-5-5")
    q = J(os.path.join(AI, "queue.json")); log = J(os.path.join(AI, "fetch_log.json")); done = {r["claim_id"] for r in load_assessments()}
    outp = os.path.join(ASSESS, f"api-{datetime.now(timezone.utc).date().isoformat()}.jsonl"); n = 0
    for r in q["rows"]:
        if r["claim_id"] in done: continue
        if limit and n >= limit: break
        rec = log.get(r["source_url"], {}); page = open(os.path.join(ROOT, rec["cache"]), encoding="utf-8").read()[:24000] if rec.get("cache") and rec.get("status") == 200 else None
        base = {"review_id": f"air:{r['claim_id']}:{int(time.time())}", "claim_id": r["claim_id"], "fingerprint": r["fingerprint"], "plant": r["plant"], "field": r["field"], "original_claim": {"value": r["value"], "text": r["text"], "context": r["context"]}, "source_id": r["source_id"], "source_url": r["source_url"], "conflicting_claims": r["conflicting_claims"], "priority": r["priority"], "model": model, "method": "api (anthropic messages, page text from review/ai/cache)", "reviewed_at": NOW()}
        if page is None:
            rec_out = base | {"locator": None, "evidence_excerpt": None, "result": "source_unavailable", "explanation": f"page not fetched: {rec.get('error') or 'no cache'}", "missing_context": None, "taxonomy_check": "unclear", "geo_check": None, "risk": r["priority"]}
        else:
            body = {"model": model, "max_tokens": 600, "messages": [{"role": "user", "content": PROMPT.format(results=" | ".join(RESULTS), plant=r["plant"], field=r["field"], value=json.dumps(r["value"], ensure_ascii=False), label=r.get("value_label"), text=r["text"], context=r["context"], cultivar=r.get("cultivar"), source_id=r["source_id"], url=r["source_url"], page=page)}]}
            req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=json.dumps(body).encode(), headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as resp: data = json.loads(resp.read())
            txt = "".join(b.get("text", "") for b in data.get("content", [])); m = re.search(r"\{.*\}", txt, re.S)
            try: parsed = json.loads(m.group(0)) if m else {}
            except json.JSONDecodeError: parsed = {}
            rec_out = base | {"locator": parsed.get("locator"), "evidence_excerpt": parsed.get("evidence_excerpt"), "result": parsed.get("result") if parsed.get("result") in RESULTS else "insufficient_evidence", "explanation": parsed.get("explanation") or txt[:400], "missing_context": parsed.get("missing_context"), "taxonomy_check": parsed.get("taxonomy_check", "unclear"), "geo_check": parsed.get("geo_check"), "risk": parsed.get("risk", r["priority"]), "raw_usage": data.get("usage")}
        with open(outp, "a", encoding="utf-8") as f: f.write(json.dumps(rec_out, ensure_ascii=False) + "\n")
        n += 1; print(f"  {rec_out['result']:22} {r['claim_id']}")
    print(f"assess: {n} new assessments -> {os.path.relpath(outp, ROOT)}")


def load_assessments():
    out = []
    for f in sorted(os.listdir(ASSESS)):
        if f.endswith(".jsonl"):
            for line in open(os.path.join(ASSESS, f), encoding="utf-8"):
                line = line.strip()
                if line: out.append(json.loads(line))
    return out


def latest_assessments():
    """one per claim: the newest record whose fingerprint matches the queue is 'current'; older ones are history"""
    q = J(os.path.join(AI, "queue.json")); fp = {r["claim_id"]: r["fingerprint"] for r in q["rows"]}; best = {}
    for a in sorted(load_assessments(), key=lambda a: a.get("reviewed_at", "")):
        best[a["claim_id"]] = a | {"current": fp.get(a["claim_id"]) == a.get("fingerprint")}
    return best


# ---------------------------------------------------------------- status
def status():
    q = J(os.path.join(AI, "queue.json")); checks = J(os.path.join(AI, "checks.json"))["checks"] if os.path.exists(os.path.join(AI, "checks.json")) else {}
    A = latest_assessments(); evp = os.path.join(ROOT, "review", "events", "review_events.jsonl")
    human = set()
    if os.path.exists(evp):
        for line in open(evp, encoding="utf-8"):
            if line.strip():
                ev = json.loads(line)
                if ev.get("event") == "human_decision": human.add(ev["claim_id"])
    cats = Counter()
    for r in q["rows"]:
        cid = r["claim_id"]; a = A.get(cid); c = checks.get(cid, {})
        if a and a["result"] != "source_unavailable": cats["source checked by AI"] += 1
        elif a and a["result"] == "source_unavailable": cats["source unavailable (AI)"] += 1
        elif c.get("page_cached"): cats["program checks only"] += 1
        elif c: cats["source unavailable (program)"] += 1
        else: cats["awaiting AI review"] += 1
        cats["awaiting human review" if cid not in human else "human reviewed"] += 1
    res = Counter(a["result"] for a in A.values()); meth = Counter(a.get("method", "?").split(" ")[0] for a in A.values()); models = Counter(a.get("model") for a in A.values())
    print(f"queue {q['n']} unverified claims · {q['distinct_urls']} URLs"); [print(f"  {k:34} {v}") for k, v in sorted(cats.items())]
    print("AI results:", dict(res)); print("methods:", dict(meth), "models:", dict(models))
    return {"queue": q["n"], "coverage": dict(cats), "results": dict(res), "methods": dict(meth), "models": dict(models)}


if __name__ == "__main__":
    a = sys.argv[1:]
    if "--queue" in a: build_queue()
    if "--fetch" in a: fetch_all(retry="--retry" in a)
    if "--checks" in a: run_checks()
    if "--assess" in a: assess(limit=int(a[a.index("--limit") + 1]) if "--limit" in a else None)
    if "--status" in a or not a: status()
