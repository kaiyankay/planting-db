#!/usr/bin/env python3
"""
Run the whole graph pipeline on a database root (brief 2026-11-02, Scalable Knowledge Network):

  python3 -I tools/pipeline.py                 # this repository
  python3 -I tools/pipeline.py --root <dir>    # another root with the same layout (used by tools/scale_test.py)

Steps, in order, each a separate process so a failure stops the chain:
  build_ontology.py  (schema + plant entity records -> ontology.json: concepts, taxon nodes, design concepts, relations)
  build_graph.py     (claims -> brain/data/graph.json + diagnosis.json: claim edges, growth forms M29, diagnosis)
  build_kg.py        (-> brain/data/kg.json: typed, statused, evidenced edges; plant pairs; knowledge areas; gaps)
  validate.py        (plants, relations, ontology, kg.json)
Nothing else is needed to add a plant: drop plants/<id>.json (+ its sources in sources.json and its name in synonyms.json),
run this, and the interface reads the new graph.
"""
import os, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
root = os.path.abspath(sys.argv[sys.argv.index("--root") + 1]) if "--root" in sys.argv else os.path.dirname(HERE)
env = dict(os.environ, PLANTING_DB_ROOT=root)
t0 = time.time()
for step in ("build_ontology.py", "build_graph.py", "build_kg.py", "validate.py"):
    t = time.time()
    r = subprocess.run([sys.executable, "-I", os.path.join(HERE, step)] + (["--quiet"] if step == "validate.py" and "--quiet" in sys.argv else []), env=env, capture_output=True, text=True)
    first = (r.stdout.strip().splitlines() or [""])[0]
    print(f"[{'ok' if r.returncode == 0 else 'FAIL'}] {step:18} {time.time() - t:5.2f}s  {first[:110]}")
    if r.returncode != 0:
        print(r.stdout[-2000:]); print(r.stderr[-2000:]); sys.exit(r.returncode)
print(f"pipeline done in {time.time() - t0:.2f}s on {root}")
