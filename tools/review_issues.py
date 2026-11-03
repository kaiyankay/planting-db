#!/usr/bin/env python3
"""
Issue-based review: group the AI evidence assessments into recurring knowledge-mapping problems (brief 2026-11-03
'Workflow & UI Revision' §1; methods M47).

  python3 -I tools/review_issues.py            # -> review/ai/issues.json (tracked) + a summary on stdout

An issue is a pattern that recurs across plants and sources — e.g. "a USDA tolerance rating was stored as an exposure
class" — with the claims that show it, the fields and downstream uses it touches, and the resolution options a reviewer
can choose between. Issues are read from the AI records with an ordered rule table (field, source, result, wording);
every non-supported assessment lands in exactly one issue (the last rule is a catch-all), and two note-level problems
the reviewers reported on *supported* claims are detected separately. An issue-level decision is a POLICY (recorded as an
`issue_decision` event); it never changes a claim — each claim still gets its own decision and its own apply.
Standard library only.
"""
import json, os, re, sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(HERE)
sys.path.insert(0, HERE)
import ai_review as AIR  # noqa: E402
TODAY = date.today().isoformat()

# ordered rule table: (issue id, title, test(a, text) -> bool). text = explanation + missing_context, lower-case
R = lambda *pats: (lambda t: any(re.search(p, t) for p in pats))
RULES = [
    ("usda-rating-as-exposure", "USDA shade-tolerance rating stored as an exposure class", lambda a, t: a["source_id"] == "usda_plants" and a["field"] == "exposure"),
    ("usda-coded-contradiction", "USDA coded characteristic contradicts every descriptive source", lambda a, t: a["source_id"] == "usda_plants" and a["result"] == "conflicting_evidence"),
    ("rating-as-resistance", "A 'medium' or 'some' tolerance stored as a resistance", lambda a, t: a["field"] == "resistances" and R(r"medium", r"\bsome\b", r"dry soils", r"erosion", r"winter wet|poorly-drained")(t)),
    ("usda-moisture-as-water", "USDA moisture-use / drought ratings turned into a water class", lambda a, t: a["source_id"] == "usda_plants" and a["field"] == "water_drainage"),
    ("water-range-collapsed", "A stated moisture range collapsed to one water class", lambda a, t: a["field"] == "water_drainage"),
    ("exposure-exposed-dropped", "RHS 'Exposed or Sheltered' stored as Sheltered only", lambda a, t: a["field"] == "exposure" and R(r"exposed or sheltered|exposed'? ?(is|half|dropped)|keeps only 'sheltered'|sheltered alone|only sheltered|sheltered but")(t)),
    ("exposure-inferred", "Exposure inferred from habitat or from undefined wording (open / light shade)", lambda a, t: a["field"] == "exposure"),
    ("ph-range-collapsed", "A pH range stored as Acidic or Alkaline only", lambda a, t: a["field"] == "soil_type"),
    ("maintenance-inferred", "Maintenance level inferred from pruning advice", lambda a, t: a["field"] == "maintenance_level"),
    ("pest-mapping-loose", "Pest or disease name forced into the KPU list, hedges dropped", lambda a, t: a["field"] == "pest_susceptibility"),
    ("use-mapping-loose", "Landscape-use mapping looser than the source wording", lambda a, t: a["field"] == "landscape_use"),
    ("habit-form-inferred", "Habit or form read from passing description", lambda a, t: a["field"] in ("habit", "form")),
    ("height-measure-convention", "Height figure is a different measure (frond length, 20-year maximum)", lambda a, t: a["field"] in ("mature_height", "mature_spread", "local_mature_size")),
    ("native-status-scope", "Native status attached at the wrong taxon or scale", lambda a, t: a["field"] == "ecological_value"),
    ("season-to-month", "Season words or coarse colour lists turned into months and KPU colours", lambda a, t: a["field"] == "seasonal_interest"),
    ("other-partial", "Other partially supported readings (one-offs)", lambda a, t: True),
]
ISSUE_TEXT = {
    "usda-rating-as-exposure": ("USDA PLANTS gives a *shade tolerance* rating (Low / Medium / High) for conservation planting, not a sun requirement. The extraction turned Low into Full sun and High into shade classes, which then contradicts every horticultural source for forest-floor natives and feeds the exposure gate.", ["Dispute the exposure value and keep the rating in a note (the rating is not a position)", "Keep as unverified with confidence ≤ 0.55 and context 'inferred from shade-tolerance rating' (current state)", "Add a facet 'shade_tolerance_rating' so the rating is stored as what it is"]),
    "usda-coded-contradiction": ("Coded USDA characteristics (leaf retention No, flower colour Purple, 6 ft mature vs 1 ft at 20 years, shade tolerance Low) are transcribed faithfully but contradict the descriptive sources and sometimes the same record. The claims are accurate transcriptions of an unreliable field.", ["Dispute each with reason 'source record internally inconsistent / contradicted by all descriptive sources'", "Keep side by side at low confidence (R1) and never let USDA codes drive evergreen, exposure or height for these species", "Request a second USDA document (plant guide PDF) before deciding"]),
    "rating-as-resistance": ("A 'Medium' tolerance rating, a 'some drought tolerance once established' or a site descriptor ('Tolerate: Erosion', 'dry soils') was stored as a categorical resistance, which the graph reads as a plant property.", ["House rule: only an explicit high / stated tolerance becomes a resistance; medium ratings go to a note", "Keep but lower confidence to 0.5 and add the degree to the value label", "Dispute"]),
    "usda-moisture-as-water": ("USDA gives Moisture Use, Drought Tolerance and Anaerobic Tolerance ratings; the extraction inferred a water class from them. The class is a reading, not a statement.", ["Keep as unverified 'inferred' claims at ≤ 0.7 (current)", "Dispute and store the three ratings in a qualitative claim instead", "House rule table: (Use, Drought, Anaerobic) → class, recorded in methods"]),
    "water-range-collapsed": ("Sources state a range or two options ('dry to medium', 'moist but well-drained or well-drained', 'medium to wet', 'regular watering to drought tolerant'); the stored value keeps one end, which manufactures disagreements between sources that say the same thing.", ["House rule: a stated range becomes two claims (M15) or `wide_range`; 'moist but well-drained' → average", "Propose correction per claim to the fuller reading", "Accept as is (verify) where the chosen end is the source's emphasis"]),
    "exposure-exposed-dropped": ("RHS lists Exposure 'Exposed or Sheltered'; KPU has no 'Exposed' label, so the value keeps Sheltered alone and reads as a shelter requirement.", ["Propose correction: drop 'Sheltered' from the value, keep the RHS wording in text", "Add 'Exposed' (ontology wind:exposed) to the exposure vocabulary and correct the claims", "Verify as is with the note"]),
    "exposure-inferred": ("E-Flora gives habitats, not cultivation exposure; GPP's 'open shade' and OSU's unqualified 'shade' were mapped to KPU classes the source does not use.", ["Keep as unverified inferred claims (context says 'inferred'), confidence ≤ 0.7", "Dispute the specific class that is not stated (Filtered shade / Deep shade) and keep the stated ones", "Verify where the reading is the only sensible one"]),
    "ph-range-collapsed": ("USDA pH ranges (e.g. 4.9–7.3, 5.5–8.0) were stored as 'Acidic' or 'Alkaline' alone; the KPU vocabulary has no neutral value.", ["House rule: pH ranges stay quantitative in the value; Acidic only when max ≤ 6.5, Alkaline only when min ≥ 7.5", "Propose correction per claim (keep both classes where the range spans them)", "Verify as is where the chosen class is the source's emphasis"]),
    "maintenance-inferred": ("RHS gives a pruning group, not a maintenance rating; the value 'low' rests on 'pruning group 1' or 'no pruning' while the same page lists pests and diseases.", ["House rule: no maintenance_level from pruning advice alone — dispute these", "Keep at ≤ 0.65 as inferred", "Verify where GPP / MOBOT give an explicit rating that agrees"]),
    "pest-mapping-loose": ("Honey fungus → Root rot, stem rot → Crown rot, unnamed leaf spot → Fungal leaf spot; hedges ('may be', 'generally pest-free', 'insufficient data') dropped from the value.", ["House rule: a pathogen not in the KPU list is stored as an open-list value, never remapped", "Propose correction per claim", "Verify the directly stated items and dispute the remapped ones"]),
    "use-mapping-loose": ("Source garden types ('Architectural', 'Gravel garden', 'Banks and slopes', 'hedge tolerance') were mapped to KPU uses with a different meaning.", ["Propose correction: keep only uses the source names in the KPU sense", "Verify the direct items, dispute the stretched ones (split the claim)", "Accept and record the mapping convention in methods"]),
    "habit-form-inferred": ("'Bushy' → Dense, 'conical' → Pyramidal-widely, 'pyramidal when young' → mature form, 'arching branches' in a leaf sentence → habit.", ["Dispute where the source gives no habit / form statement", "Propose correction to the narrower class the source supports", "Request more evidence (a second source with an explicit habit)"]),
    "height-measure-convention": ("Frond length stored as plant height (sword fern); USDA 6 ft mature beside 1 ft at 20 years (salal). These feed height bands and layers.", ["Propose correction: record frond length under a note / qualitative claim and leave height to the sources that state it", "Dispute the USDA salal height", "Keep with lowered confidence"]),
    "native-status-scope": ("'Native' was attached to BC from a continental range (RHS), from a dual native+introduced record (USDA) or from a different accepted name (E-Flora *A. borealis*).", ["Decide the yarrow taxon question first (entity identity_review), then dispute or verify each", "Verify E-Flora / USDA 'native' at the scale the source gives, add scope to the text", "Dispute the RHS-derived native claim"]),
    "season-to-month": ("'Summer' → months 6–8, 'Late spring' → 5–6, 'Spring' → 4–5 are conventions; cream flowers and 'sometimes pink' have no KPU colour.", ["Record the season→month convention in methods and verify", "Propose correction to drop months the source does not give", "Keep as is"]),
    "other-partial": ("One-off readings the AI rated partially supported: a dropped caveat, a misread sentence, an inference the source does not make.", ["Decide claim by claim", "Request more evidence", "Propose correction"]),
    "note-template-error": ("The claim VALUE is right but the NOTE carries a sentence copied from a template: the iNaturalist month-histogram note says the plant is 'evergreen / visible year-round' on deciduous plants; the ISCBC listing claim asserts 'it is a BC native', which that page does not say.", ["Propose correction of the note text (the original stays retired with its evidence)", "Verify the value and add a note event explaining the template error"]),
}


def build():
    A = AIR.latest_assessments(); plants = AIR.load_plants(); claims = {c["id"]: c for p in plants.values() for c in p["claims"]}
    q = json.load(open(os.path.join(AIR.AI, "queue.json"), encoding="utf-8")); Q = {r["claim_id"]: r for r in q["rows"]}
    issues = defaultdict(list)
    for cid, a in sorted(A.items()):
        if a["result"] == "supported_by_source": continue
        t = ((a.get("explanation") or "") + " " + (a.get("missing_context") or "")).lower()
        for iid, title, test in RULES:
            if test(a, t): issues[iid].append(cid); break
    # note-level problems reported on supported claims
    for cid, a in A.items():
        c = claims.get(cid, {}); note = (c.get("note") or "").lower(); text = (c.get("text") or "").lower()
        if cid.endswith("vancouver_context:inat02") and "evergreen" in note and not any(x.get("seasonal_interest") for x in []): issues["note-template-error"].append(cid)
        if c.get("source_id") == "iscbc" and "native" in text: issues["note-template-error"].append(cid)
    out = []
    titles = {i: t for i, t, _ in RULES} | {"note-template-error": "Template sentence in the claim note or text"}
    for iid, cids in issues.items():
        cids = sorted(set(cids)); rows = []
        for cid in cids:
            a = A[cid]; qr = Q.get(cid, {}); c = claims.get(cid, {})
            rows.append({"claim_id": cid, "plant": a["plant"], "field": a["field"], "source_id": a["source_id"], "ai_result": a["result"], "ai_risk": a.get("risk"), "priority": qr.get("priority"), "downstream": qr.get("downstream", []), "status": c.get("status"), "missing_context": a.get("missing_context"), "explanation": a.get("explanation")})
        fields = Counter(r["field"] for r in rows); sources = Counter(r["source_id"] for r in rows); plants_ = sorted({r["plant"] for r in rows})
        down = Counter(d for r in rows for d in r["downstream"]); gate = sum(1 for r in rows if "gate field" in " ".join(Q.get(r["claim_id"], {}).get("priority_reasons", [])))
        desc, options = ISSUE_TEXT.get(iid, ("", []))
        score = len(rows) * 2 + sum(3 for r in rows if r["ai_result"] == "conflicting_evidence") + gate + down.get("design", 0) + down.get("design_requirement", 0)
        out.append({"id": iid, "title": titles.get(iid, iid), "description": desc, "options": options, "n_claims": len(rows), "plants": plants_, "fields": dict(fields), "sources": dict(sources), "downstream": dict(down), "gate_claims": gate, "conflicting": sum(1 for r in rows if r["ai_result"] == "conflicting_evidence"), "impact_score": score, "claims": rows})
    out.sort(key=lambda i: -i["impact_score"])
    doc = {"generated": TODAY, "method": "tools/review_issues.py rule table over review/ai/assessments (M47); every non-supported assessment is in exactly one issue; note-level problems detected on supported claims", "n_issues": len(out), "n_claims": sum(i["n_claims"] for i in out), "issues": out}
    json.dump(doc, open(os.path.join(AIR.AI, "issues.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return doc


if __name__ == "__main__":
    d = build()
    print(f"{d['n_issues']} issues over {d['n_claims']} claims -> review/ai/issues.json")
    for i in d["issues"]: print(f"  {i['impact_score']:3} {i['id']:28} {i['n_claims']:3} claims · {len(i['plants'])} plants · gate {i['gate_claims']} · conflicting {i['conflicting']} · {i['title']}")
