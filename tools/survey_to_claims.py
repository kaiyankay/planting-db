#!/usr/bin/env python3
"""
T4 — survey ingestion (HANDOFF §5 T4; methods M7, M21, M35–M37).

  python3 -I tools/survey_to_claims.py                # newest inputs/survey/responses-*.csv
  python3 -I tools/survey_to_claims.py --dry-run      # report only, write nothing

Reads the newest dated export in inputs/survey/ (gitignored: raw exports carry response ids and timestamps) plus the
researcher mapping data/survey/mapping-<date>.json (tracked, de-identified) and writes:

  sources.json          one anonymous practitioner record per response (survey-rNN: roles, experience, observer_background,
                        baseline_confidence by M35); NO response id, NO timestamp — those go to the private map
  inputs/survey/respondent_map.json   (gitignored) survey-rNN -> response_id, submitted_at: the idempotence key and the audit trail
  plants/<id>.json      entity raw_names / respondent_roles / survey_respondents / survey_mentions appended;
                        d1 'why' -> claims (claim_kind selection_reason, L0, never citable);
                        d2 note  -> claims (observation | warning, basis from d2_basis, L1/L2) + derived categorical claims
                        — all through tools/merge_claims.py (validation, annotation, README table)
  relations.json        co_listed relation per pair of in-db plants named in one d1 list (direct relation; evidence of
                        co-mention only, never of compatibility)
  synonyms.json         in_db flags; new candidate names from the mapping file
  eval/queries.json     the verbatim e2 searches and c4 questions (replaces the 2026-10-29 proxies, M16)
  intent_map.json       untouched (new intent words are listed in the run report for hand mapping)

Idempotent: a response already in the private map keeps its pseudonym; a plant × respondent already in
entity.survey_respondents is skipped; a relation with the same pair, type and source is skipped.
Standard library only.
"""
import csv, json, os, re, sys
from collections import defaultdict
from datetime import date
from itertools import combinations

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from merge_claims import merge_claims, regenerate_readme  # noqa: E402

DRY = "--dry-run" in sys.argv
TODAY = date.today().isoformat()
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
def W(p, obj):
    if DRY: return
    with open(os.path.join(ROOT, p), "w", encoding="utf-8") as f: json.dump(obj, f, ensure_ascii=False, indent=2); f.write("\n")

SURVEY_DIR = os.path.join(ROOT, "inputs", "survey")
exports = sorted(f for f in os.listdir(SURVEY_DIR) if re.match(r"responses-\d{4}-\d{2}-\d{2}\.csv$", f))
if not exports: sys.exit("no inputs/survey/responses-<date>.csv")
CSV = exports[-1]; EXPORT_DATE = CSV[10:20]
maps = sorted(f for f in os.listdir(os.path.join(ROOT, "data", "survey")) if f.startswith("mapping-"))
MAP = J(os.path.join("data", "survey", maps[-1]))
rows = list(csv.DictReader(open(os.path.join(SURVEY_DIR, CSV), newline="", encoding="utf-8")))
rows.sort(key=lambda r: r["submitted_at"])

# ---------------------------------------------------------------- respondents (M35 confidence rule) and the private map
ROLE_BASE = {"Landscape designer or landscape architect": 0.7, "MLA student": 0.6, "Instructor or researcher": 0.7, "Student in a related field": 0.4}
ROLE_SHORT = {"Landscape designer or landscape architect": "practising landscape designer", "MLA student": "MLA student", "Instructor or researcher": "instructor or researcher", "Student in a related field": "related-field student"}
EXP_SHORT = {"Studio or academic projects": "studio", "Professional projects": "professional", "Personal gardening": "personal-garden", "None yet": None}
BASIS = {"Observed in person": "observed", "Read or learned from another source": "read", "Used in my own project": "project", "A combination of these": "mixed"}

def split_multi(s): return [x.strip() for x in (s or "").split("|") if x.strip()]
def role_key(r): return "Student in a related field" if r.startswith("Student in a related field") else r

def confidence(roles, exp):
    base = max([ROLE_BASE.get(role_key(r), 0.5) for r in roles] or [0.5])
    if "Professional projects" in exp: base += 0.15
    if "Personal gardening" in exp: base += 0.05
    return round(min(base, 0.8), 2)

def background(roles, exp):
    rs = [ROLE_SHORT.get(role_key(r), r.replace("Other: ", "").lower()) for r in roles]
    rs = sorted(set(rs), key=rs.index)
    if "MLA student" in rs and "practising landscape designer" in rs: rs = ["MLA student and practising landscape designer"] + [x for x in rs if x not in ("MLA student", "practising landscape designer", "related-field student")]
    es = [EXP_SHORT.get(e, e) for e in exp if EXP_SHORT.get(e, e)]
    exp_txt = (", ".join(es[:-1]) + " and " + es[-1] if len(es) > 1 else es[0]) + " planting experience" if es else "no planting experience yet"
    return "; ".join(rs) + "; " + exp_txt

src = J("sources.json"); S = {s["id"]: s for s in src["sources"]}
priv_path = os.path.join(SURVEY_DIR, "respondent_map.json")
priv = json.load(open(priv_path, encoding="utf-8")) if os.path.exists(priv_path) else {"note": "PRIVATE — gitignored. Maps the anonymous ids used in sources.json to the survey response ids; never copy into tracked files.", "respondents": {}}
by_resp = {v["response_id"]: k for k, v in priv["respondents"].items()}
for s in src["sources"]:   # legacy: records that still carry the response id move it into the private map
    if s.get("parent") == "survey" and s.get("response_id"):
        by_resp.setdefault(s["response_id"], s["id"]); priv["respondents"].setdefault(s["id"], {"response_id": s["response_id"], "submitted_at": s.get("submitted_at")})
        s.pop("response_id", None); s.pop("submitted_at", None)
n_existing = len(by_resp); new_respondents = []
for r in rows:
    rid = r["id"]
    if rid in by_resp: continue
    pseudo = f"survey-r{len(by_resp) + 1:02d}"
    by_resp[rid] = pseudo; priv["respondents"][pseudo] = {"response_id": rid, "submitted_at": r["submitted_at"]}
    roles, exp = split_multi(r["a1"]), split_multi(r["a2"])
    rec = {"id": pseudo, "parent": "survey", "type": "practitioner", "roles": [re.sub(r" \(.*\)$", "", x) for x in roles], "experience": exp, "observer_background": background(roles, exp), "geo_specificity": "vancouver", "baseline_confidence": confidence(roles, exp)}
    if not any(r[f"d1_{i}_name"] for i in range(1, 6)): rec["note"] = "no plant list; e1/e2/c-section answers only"
    src["sources"].append(rec); S[pseudo] = rec; new_respondents.append(pseudo)
parent = S["survey"]; parent["responses_as_of"] = {"date": EXPORT_DATE, "n": len(rows)}; parent["privacy"] = "response ids and timestamps live only in inputs/survey/respondent_map.json (gitignored); respondent records here are roles + experience only (brief 2026-11-02 §02)"
parent["export_bug"] = "d2 / attached_note text submitted before 2026-10-29 lost its spaces (form bug fixed in planting-survey 00ee216); wording restored by hand in data/survey/mapping-<date>.json (M21)"

# ---------------------------------------------------------------- name resolution via synonyms.json
syn = J("synonyms.json"); NAME2ID = {}
for e in syn["entries"]:
    for n in [e["scientific"], *e.get("names", []), *e.get("synonyms_scientific", [])]: NAME2ID[n.lower().strip()] = e["id"]
IN_DB = {f[:-5] for f in os.listdir(os.path.join(ROOT, "plants")) if f.endswith(".json")}
for e in syn["entries"]: e["in_db"] = e["id"] in IN_DB
known_ids = {e["id"] for e in syn["entries"]}
for c in MAP["candidates_not_in_db"]["entries"]:
    if c["id"] not in known_ids:
        syn["entries"].append({k: v for k, v in c.items() if k != "note"} | {"in_db": c["id"] in IN_DB} | ({"note": c["note"]} if c.get("note") else {})); known_ids.add(c["id"])
        for n in [c["scientific"], *c["names"]]: NAME2ID.setdefault(n.lower().strip(), c["id"])
syn["updated"] = TODAY; syn["note"] = "Keyword route for retrieval. Every name a user or respondent might type → canonical plant id. Includes every survey candidate (14 responses, 2026-11-03 export) so later additions resolve to the same ids. Entries with in_db=false are candidates only; names are kept as respondents typed them."
def resolve(raw): return NAME2ID.get((raw or "").lower().strip())

# ---------------------------------------------------------------- claims from d1 / d2
PLANTS = {pid: J(os.path.join("plants", f"{pid}.json")) for pid in IN_DB}
log = {"respondents_new": new_respondents, "claims": [], "skipped": [], "relations": [], "unresolved": defaultdict(list), "unmapped_reasons": [], "intent_words": []}
meta_base = lambda pseudo: {"basis": None, "location": None, "maintenance_received": None, "observer_background": S[pseudo]["observer_background"], "site_conditions": None, "season_observed": None, "plant_age_years": None, "completeness": "L0", "citable": False}

def completeness(meta):
    if not meta.get("basis"): return "L0"
    if not meta.get("location"): return "L1"
    return "L3" if sum(1 for k in ("site_conditions", "maintenance_received", "season_observed", "plant_age_years") if meta.get(k)) >= 2 else "L2"

new_claims = defaultdict(list); entity_updates = defaultdict(lambda: {"raw_names": [], "respondent_roles": [], "survey_respondents": []})
for r in rows:
    pseudo = by_resp[r["id"]]; conf = S[pseudo]["baseline_confidence"]
    listed = [(r[f"d1_{i}_name"].strip(), r[f"d1_{i}_role"].strip(), r[f"d1_{i}_why"].strip()) for i in range(1, 6) if r[f"d1_{i}_name"].strip()]
    resolved = [(raw, role, why, resolve(raw)) for raw, role, why in listed]
    for raw, role, why, pid in resolved:
        if not pid: log["unresolved"][raw].append(pseudo); continue
        if pid not in PLANTS: continue
        e = PLANTS[pid]["entity"]
        if pseudo in e.get("survey_respondents", []) or any(c.get("source_id") == pseudo for c in PLANTS[pid]["claims"]):
            log["skipped"].append(f"{pid} × {pseudo} (already ingested)"); e.setdefault("survey_respondents", [])
            if pseudo not in e["survey_respondents"]: e["survey_respondents"].append(pseudo)
            continue
        u = entity_updates[pid]; u["raw_names"].append(raw); u["respondent_roles"].append(role.lower().replace("perennial or grass", "perennial_grass")); u["survey_respondents"].append(pseudo)
        ctx = "Metro Vancouver, hypothetical plant list (survey d1)"
        n = 0
        specs = MAP["d1"].get(f"{pseudo}|{raw}")
        if why and specs is None:
            specs = [{"field": "vancouver_context", "value_kind": "qualitative", "value": {"note": why}, "mapping_note": "selection reason not mapped to a field (fallback)"}]; log["unmapped_reasons"].append(f"{pseudo}|{raw}: {why}")
        for sp in specs or []:
            n += 1
            c = {"id": f"{pid}:{sp['field']}:sv{n:02d}", "plant": pid, "field": sp["field"], "value_kind": sp["value_kind"], "value": sp["value"], "text": f"{raw} — {why.rstrip('.')}." if why else f"{raw} listed without a reason.", "source_id": pseudo, "source_type": "practitioner", "context": ctx, "confidence": conf, "status": "verified", "recorded_at": TODAY, "recorded_by": f"tools/survey_to_claims.py ({CSV})", "claim_kind": "selection_reason", "practitioner_meta": meta_base(pseudo) | {"note": "d1 'why' answers carry no basis — stored as selection reasons, never cited as observations (R2)"}, "survey_question": "d1", "respondent_role_as_typed": role}
            if sp["value_kind"] == "categorical" and isinstance(sp["value"], list): c["value_label"] = list(sp["value"])
            if sp.get("mapping_note"): c["note"] = sp["mapping_note"]
            new_claims[pid].append(c)
        # d2 note on this plant
        if r["d2_plant"].strip() == raw and r["d2"].strip():
            key = f"{pseudo}|{raw}"; spec = MAP["d2"].get(key); basis = BASIS.get(r["d2_basis"].strip())
            text = MAP["restored_text"].get(key, r["d2"].strip())
            if spec is None:
                spec = {"field": "vancouver_context", "value_kind": "qualitative", "claim_kind": "observation", "value": {"note": text}, "location": None, "derived": []}; log["unmapped_reasons"].append(f"{key} (d2): {text}")
            meta = meta_base(pseudo) | {"basis": basis, "location": spec.get("location")}
            meta["completeness"] = completeness(meta); meta["citable"] = meta["completeness"] != "L0"
            if meta["completeness"] == "L1": meta["caveat"] = "location not recorded"
            if text != r["d2"].strip(): meta["raw_export_text"] = r["d2"].strip(); meta["note"] = "spaces restored by hand from the export (form bug, M21)"
            d2c = {"id": f"{pid}:{spec['field']}:sv{n + 1:02d}", "plant": pid, "field": spec["field"], "value_kind": spec["value_kind"], "value": spec["value"], "text": text, "source_id": pseudo, "source_type": "practitioner", "context": f"survey d2 note ({BASIS.get(r['d2_basis'].strip(), 'basis not given')}); " + (spec.get("location") or "location not recorded"), "confidence": round(min(conf + 0.05, 0.85), 2), "status": "verified", "recorded_at": TODAY, "recorded_by": f"tools/survey_to_claims.py ({CSV})", "claim_kind": spec.get("claim_kind", "observation"), "practitioner_meta": meta, "survey_question": "d2"}
            new_claims[pid].append(d2c); n += 1
            for dsp in spec.get("derived", []):
                n += 1
                dc = {"id": f"{pid}:{dsp['field']}:sv{n:02d}", "plant": pid, "field": dsp["field"], "value_kind": dsp["value_kind"], "value": dsp["value"], "text": f"{raw}: {text}" if len(text) < 90 else f"{raw} — derived from the respondent's note: {text[:80]}…", "source_id": pseudo, "source_type": "practitioner", "context": d2c["context"] + "; derived from " + d2c["id"], "confidence": round(conf, 2), "status": "verified", "recorded_at": TODAY, "recorded_by": "tools/survey_to_claims.py (derived, same source)", "claim_kind": spec.get("claim_kind", "observation"), "derived_from": d2c["id"], "practitioner_meta": {k: v for k, v in meta.items() if k not in ("raw_export_text", "note")}, "survey_question": "d2"}
                if dsp["value_kind"] == "categorical" and isinstance(dsp["value"], list): dc["value_label"] = list(dsp["value"])
                if dsp.get("mapping_note"): dc["note"] = dsp["mapping_note"]
                new_claims[pid].append(dc)
    # co-listing relations among in-db plants of this list
    in_db = [(raw, pid) for raw, role, why, pid in resolved if pid in PLANTS]
    others_all = [raw for raw, *_ in listed]
    for (ra, a), (rb, b) in combinations(in_db, 2):
        log["relations"].append({"a": a, "b": b, "source": pseudo, "others": [x for x in others_all if x not in (ra, rb)], "n_list": len(listed)})
    # intent words
    for q in ("e1", "e2", "c4"):
        if r[q].strip(): log["intent_words"].append((q, pseudo, r[q].strip()))

# ---------------------------------------------------------------- land claims and entity updates
claim_log = {}
if not DRY:   # the validator reads sources.json from disk: new respondent records must exist before their claims land
    W("sources.json", src); json.dump(priv, open(priv_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
for pid, cs in new_claims.items():
    res = merge_claims(os.path.join(ROOT, "plants", f"{pid}.json"), cs, dry_run=True)
    if res["errors"]: claim_log[pid] = res; continue
    if not DRY: res = merge_claims(os.path.join(ROOT, "plants", f"{pid}.json"), cs)
    claim_log[pid] = res
for pid, u in entity_updates.items():
    p = J(os.path.join("plants", f"{pid}.json")); e = p["entity"]
    e.setdefault("raw_names", []); e.setdefault("respondent_roles", []); e.setdefault("survey_respondents", [])
    for k in ("raw_names", "respondent_roles"): e[k] = e[k] + u[k]
    e["survey_respondents"] = e["survey_respondents"] + [x for x in u["survey_respondents"] if x not in e["survey_respondents"]]
    e["survey_mentions"] = len(e["survey_respondents"])
    W(os.path.join("plants", f"{pid}.json"), p)
for pid in PLANTS:   # seed survey_respondents on plants whose survey claims pre-date this tool
    p = J(os.path.join("plants", f"{pid}.json")); e = p["entity"]; before = list(e.get("survey_respondents", []))
    had = sorted({c["source_id"] for c in p["claims"] if str(c.get("source_id", "")).startswith("survey-")})
    e["survey_respondents"] = before + [x for x in had if x not in before]; e["survey_mentions"] = len(e["survey_respondents"])
    if e["survey_respondents"] != before or "survey_respondents" not in e: W(os.path.join("plants", f"{pid}.json"), p)

# ---------------------------------------------------------------- relations
rel = J("relations.json"); have = {(tuple(sorted((x["plant_a"], x["plant_b"]))), x["relation_type"], x["source_id"]) for x in rel["relations"]}
added_rel = []
for rl in log["relations"]:
    key = (tuple(sorted((rl["a"], rl["b"]))), "co_listed", rl["source"])
    if key in have: continue
    have.add(key); a, b = sorted((rl["a"], rl["b"]))
    n = sum(1 for x in rel["relations"] if {x["plant_a"], x["plant_b"]} == {a, b}) + 1
    la, lb = PLANTS[a]["entity"]["scientific_name"], PLANTS[b]["entity"]["scientific_name"]
    rel["relations"].append({"id": f"rel:{a}:{b}:{n:02d}", "plant_a": a, "plant_b": b, "relation_type": "co_listed", "direction": "mutual", "text": f"A {S[rl['source']]['observer_background'].split(';')[0]} listed {la} and {lb} together in a {rl['n_list']}-plant list for Metro Vancouver.", "source_id": rl["source"], "source_type": "practitioner", "context": "survey d1, same respondent list" + (f" (with {', '.join(rl['others'])})" if rl["others"] else ""), "confidence": 0.5, "status": "verified", "recorded_at": TODAY, "recorded_by": f"tools/survey_to_claims.py ({CSV})", "practitioner_meta": {"basis": None, "completeness": "L0", "citable": False, "observer_background": S[rl["source"]]["observer_background"]}, "note": "co-listing is weak evidence of compatibility — it records that a designer thinks of them together, nothing more (brief 2026-11-02 §02)"})
    added_rel.append(rel["relations"][-1]["id"])
rel["updated"] = TODAY
rel["note"] = "Pairwise facts live here, not inside plant files. Same claim rules apply (source, context, confidence, status). Model placeholders are retired when a sourced relation covers the same pair and type (R10/M10); the rest keep verify_against and list the sourced claims that bear on them (supporting_claims). co_listed relations are written by tools/survey_to_claims.py from survey d1 lists (direct relation, co-mention only)."

# ---------------------------------------------------------------- eval queries (verbatim, M16)
q = {"note": f"T6/graph test set = survey e2 ('one search you would actually type') and c4 ('one thing you could not find'), VERBATIM from {CSV} via tools/survey_to_claims.py (replaces the 2026-10-29 proxies, methods M16). Ids are the anonymous respondent ids.", "queries": []}
for r in rows:
    pseudo = by_resp[r["id"]]
    if r["e2"].strip(): q["queries"].append({"id": f"e2-{pseudo.split('-')[1]}", "status": "verbatim", "query": r["e2"].strip()})
    if r["c4"].strip(): q["queries"].append({"id": f"c4-{pseudo.split('-')[1]}", "status": "verbatim", "query": r["c4"].strip(), "note": "a 'could not find' question — an honest empty answer with a named gap is a pass"})

# ---------------------------------------------------------------- derived candidates (correspondence check with the app's plant_candidates export)
cand = defaultdict(lambda: {"raw_names": [], "mentions": 0, "roles": defaultdict(int), "respondents": []})
for r in rows:
    for i in range(1, 6):
        raw = r[f"d1_{i}_name"].strip()
        if raw:
            k = raw.lower(); cand[k]["raw_names"].append(raw); cand[k]["mentions"] += 1; cand[k]["roles"][r[f"d1_{i}_role"].strip().lower().replace("perennial or grass", "perennial_grass")] += 1; cand[k]["respondents"].append(by_resp[r["id"]])
derived = {"derived_from": CSV, "generated": TODAY, "n_keys": len(cand), "candidates": {k: {"raw_names": sorted(set(v["raw_names"])), "mentions": v["mentions"], "roles": dict(v["roles"]), "resolved_id": resolve(k), "in_db": resolve(k) in IN_DB} for k, v in sorted(cand.items())}}

if not DRY:
    W("sources.json", src); W("synonyms.json", syn); W("relations.json", rel); W(os.path.join("eval", "queries.json"), q)
    json.dump(priv, open(priv_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump(derived, open(os.path.join(SURVEY_DIR, f"plant_candidates-derived-{EXPORT_DATE}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    regenerate_readme()

# ---------------------------------------------------------------- report
print(f"{CSV}: {len(rows)} responses · {n_existing} respondents known before · {len(new_respondents)} new: {', '.join(new_respondents)}{' (dry run)' if DRY else ''}")
print(f"candidate name keys in d1: {len(cand)} ({sum(1 for v in derived['candidates'].values() if v['in_db'])} in db, {sum(1 for v in derived['candidates'].values() if v['resolved_id'] and not v['in_db'])} known candidates, {sum(1 for v in derived['candidates'].values() if not v['resolved_id'])} unresolved)")
for pid, res in claim_log.items(): print(f"  {pid}: added {len(res['added'])}, dup {len(res['skipped_duplicate'])}, errors {len(res['errors'])}, warnings {len(res['warnings'])}" + (" " + "; ".join(res["errors"][:4]) if res["errors"] else ""))
print(f"relations: {len(log['relations'])} co-listing pairs in lists, {len(added_rel)} new: {', '.join(added_rel)}")
if log["skipped"]: print("skipped (already ingested):", ", ".join(log["skipped"]))
if log["unresolved"]: print("unresolved raw names (no synonyms entry):", dict(log["unresolved"]))
if log["unmapped_reasons"]: print("fallback-mapped reasons:", log["unmapped_reasons"])
print("intent words (e1/e2/c4) for intent_map.json review:"); [print(f"  {qq} {p}: {t}") for qq, p, t in log["intent_words"]]
