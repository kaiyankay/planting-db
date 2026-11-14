#!/usr/bin/env python3
"""
Importer idempotence and privacy tests for tools/survey_to_claims.py (M54).

  python3 -I tools/survey_import_tests.py

Runs on a throw-away copy of the repository with a SYNTHETIC export and a SYNTHETIC private map (no real response
is read, so the test works on a fresh clone): N tracked respondents + 1 new response.

  A  private map absent                 -> preflight stops, no tracked file changes
  B  private map from another export    -> preflight stops, no tracked file changes
  C  --expect-new mismatch              -> preflight stops, no tracked file changes
  D  dry run on a verified map          -> reports exactly 1 new respondent, writes nothing
  E  import                             -> exactly one new record (next pseudonym), earlier records untouched,
                                           no duplicated respondent or claim id
  F  second run                         -> 0 new, every tracked file byte-identical
  G  privacy                            -> no response id or timestamp of the export in any written tracked file
  H  candidate evidence                 -> the out-of-DB d2 note is kept in the queue, unreviewed, no plant file created
Standard library only.
"""
import csv, hashlib, json, os, shutil, subprocess, sys, tempfile, uuid

HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(HERE)
TRACKED = ["sources.json", "synonyms.json", "relations.json", "README.md", os.path.join("eval", "queries.json"), os.path.join("data", "survey", "candidate_evidence.json")]
results = []
def rec(k, ok, msg): results.append(ok); print(f"[{'PASS' if ok else 'FAIL'}] {k}  {msg}")

tmp = tempfile.mkdtemp(prefix="survey-import-test-"); root = os.path.join(tmp, "db")
os.makedirs(root)
for d in ("tools", "plants", "data"): shutil.copytree(os.path.join(REPO, d), os.path.join(root, d), ignore=shutil.ignore_patterns("__pycache__"))
for f in os.listdir(REPO):
    if f.endswith(".json") or f == "README.md": shutil.copy(os.path.join(REPO, f), os.path.join(root, f))
os.makedirs(os.path.join(root, "eval")); shutil.copy(os.path.join(REPO, "eval", "queries.json"), os.path.join(root, "eval", "queries.json"))
sdir = os.path.join(root, "inputs", "survey"); os.makedirs(sdir)

src = json.load(open(os.path.join(root, "sources.json"), encoding="utf-8"))
known = sorted(s["id"] for s in src["sources"] if s.get("parent") == "survey"); N = len(known)
COLS = ["id", "submitted_at", "duration_seconds", "questions_version", "a1", "a2", "c4"] + [f"d1_{i}_{k}" for i in range(1, 6) for k in ("name", "role", "why")] + ["d2_plant", "d2", "d2_basis", "e1", "e2"]
def row(n, **kw): return {c: "" for c in COLS} | {"id": str(uuid.uuid4()), "submitted_at": f"2020-01-{n:02d}T00:00:00+00:00", "duration_seconds": "60", "questions_version": "1", "a1": "MLA student", "a2": "Studio or academic projects"} | kw
rows = [row(i + 1) for i in range(N)]
NEW_NOTE = "Synthetic test note: flops after heavy rain."
rows.append(row(N + 1, a1="Landscape designer or landscape architect", a2="Professional projects", d1_1_name="Zzz testplant", d1_1_role="Perennial or grass", d1_1_why="synthetic reason", d2_plant="Zzz testplant", d2=NEW_NOTE, d2_basis="A combination of these", e2="synthetic search"))
with open(os.path.join(sdir, "responses-2099-01-01.csv"), "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=COLS); w.writeheader(); w.writerows(rows)
good_map = {"note": "synthetic", "respondents": {p: {"response_id": rows[i]["id"], "submitted_at": rows[i]["submitted_at"]} for i, p in enumerate(known)}}
mpath = os.path.join(sdir, "respondent_map.json")
def set_map(m):
    if m is None:
        if os.path.exists(mpath): os.remove(mpath)
    else: json.dump(m, open(mpath, "w", encoding="utf-8"))

def digest():
    h = {}
    for dp, _, fs in os.walk(root):
        if os.sep + "inputs" in dp or "__pycache__" in dp: continue
        for f in fs: h[os.path.relpath(os.path.join(dp, f), root)] = hashlib.sha256(open(os.path.join(dp, f), "rb").read()).hexdigest()
    return h
def run(*args):
    env = {k: v for k, v in os.environ.items() if k != "PLANTING_DB_ROOT"}
    return subprocess.run([sys.executable, "-I", os.path.join(root, "tools", "survey_to_claims.py"), *args], capture_output=True, text=True, env=env)
base = digest()

set_map(None); r = run()
rec("A", r.returncode != 0 and "PREFLIGHT FAILED" in r.stderr and digest() == base and not os.path.exists(mpath), "absent private map refused, nothing written")
set_map({"note": "x", "respondents": {p: {"response_id": str(uuid.uuid4()), "submitted_at": "x"} for p in known}}); r = run()
rec("B", r.returncode != 0 and "missing from" in r.stderr and digest() == base, "map from another export refused, nothing written")
set_map(good_map); r = run("--expect-new", "0")
rec("C", r.returncode != 0 and "--expect-new" in r.stderr and digest() == base, "--expect-new mismatch refused, nothing written")
r = run("--dry-run", "--expect-new", "1"); new_id = f"survey-r{N + 1:02d}"
rec("D", r.returncode == 0 and f"{N} respondents known before · 1 new: {new_id}" in r.stdout and digest() == base, f"dry run: {r.stdout.splitlines()[0] if r.stdout else r.stderr[:200]}")
r = run("--expect-new", "1")
after = json.load(open(os.path.join(root, "sources.json"), encoding="utf-8"))
ids = [s["id"] for s in after["sources"]]; before_recs = {s["id"]: s for s in src["sources"] if s.get("parent") == "survey"}
claim_ids = [c["id"] for f in os.listdir(os.path.join(root, "plants")) for c in json.load(open(os.path.join(root, "plants", f), encoding="utf-8"))["claims"]]
rec("E", r.returncode == 0 and len(ids) == len(set(ids)) and sorted(i for i in ids if i.startswith("survey-r")) == known + [new_id] and all(s == before_recs[s["id"]] for s in after["sources"] if s["id"] in before_recs) and len(claim_ids) == len(set(claim_ids)),
    f"import added {new_id} only; {N} earlier records unchanged; {len(claim_ids)} claim ids unique")
d1 = digest(); r = run("--expect-new", "0")
changed = sorted(k for k in d1 if digest().get(k) != d1[k])
rec("F", r.returncode == 0 and "0 new" in r.stdout and not changed, f"second run: 0 new, tracked files byte-identical{'' if not changed else ' — CHANGED: ' + ', '.join(changed)}")
leaks = []
needles = [x for rw in rows for x in (rw["id"], rw["submitted_at"])]
for dp, _, fs in os.walk(root):
    if os.sep + "inputs" in dp or "__pycache__" in dp: continue
    for f in fs:
        txt = open(os.path.join(dp, f), encoding="utf-8", errors="ignore").read()
        if any(n in txt for n in needles): leaks.append(f)
rec("G", not leaks, f"no response id or timestamp outside inputs/ ({len(needles)} needles){'' if not leaks else ' — LEAK: ' + ', '.join(leaks)}")
q = json.load(open(os.path.join(root, "data", "survey", "candidate_evidence.json"), encoding="utf-8"))
note = [e for e in q["entries"] if e["id"] == f"cand:{new_id}:d2"]
rec("H", len(note) == 1 and note[0]["text"] == NEW_NOTE and note[0]["status"] == "unreviewed" and note[0]["basis"] == "mixed" and note[0]["citable"] is False and note[0]["candidate_id"] is None and set(os.listdir(os.path.join(root, "plants"))) == set(os.listdir(os.path.join(REPO, "plants"))),
    "out-of-DB d2 note kept in the queue (unreviewed, basis mixed, not citable); no plant file created")
shutil.rmtree(tmp, ignore_errors=True)
print(f"\n{sum(results)}/{len(results)} passed"); sys.exit(0 if all(results) else 1)
