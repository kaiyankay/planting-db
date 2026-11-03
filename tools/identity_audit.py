#!/usr/bin/env python3
"""
Botanical identity audit for every plant entity (brief 2026-11-02 'Verification Workbench' §03B; methods M45).

  python3 -I tools/identity_audit.py            # fix what is mechanically wrong, record the four identity questions, write eval/identity-audit-<date>.md
  python3 -I tools/identity_audit.py --dry-run

Mechanical fixes (safe, reversible, logged):
  - `synonyms_scientific` holds names only: author strings stripped, "misapplied" / "auct." names and non-names (source keys) removed, duplicates
    collapsed, the accepted name itself removed; the raw list is kept in entity.identity_review.synonyms_raw
Judgement (kept apart, never merged — status confirmed | disputed | to_confirm):
  - taxonomic_identity   what the plant is (accepted name, nomenclature disputes)
  - geographic_origin    where it is native (entity.origin_status vs the sources on file)
  - botanical_growth_form  how it grows (M29/M29a reading from graph.json growth_forms)
  - design_function      what designers use it for (survey roles, KPU uses) — a role, never a life form
The judgement table JUDGEMENTS is the researcher's reading of the claims and entity notes on file; `disputed` rows are left
for human review and listed in the report. Standard library only.
"""
import json, os, re, sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get("PLANTING_DB_ROOT") or os.path.dirname(HERE)
DRY = "--dry-run" in sys.argv; TODAY = date.today().isoformat()
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
GF = J("brain/data/graph.json")["growth_forms"] if os.path.exists(os.path.join(ROOT, "brain", "data", "graph.json")) else {}
NAME_RE = re.compile(r"^([A-Z][a-z]+(?: ×)?\s+[a-z\-]+(?:\s+(?:subsp\.|ssp\.|var\.|f\.)\s+[a-z\-]+)?)")

JUDGEMENTS = {
    "acer-palmatum": {"taxonomic_identity": ("confirmed", "Acer palmatum Thunb.; all sources agree; cultivar claims carry the cultivar in context"), "geographic_origin": ("confirmed", "non-native (Japan, Korea, China); no source disputes"), "design_function": ("confirmed", "specimen / accent / small shade tree (MOBOT, RHS uses; survey 'amenity space')")},
    "cercidiphyllum-japonicum": {"taxonomic_identity": ("confirmed", "Cercidiphyllum japonicum Siebold & Zucc.; USDA symbol CEJA2 (CEJA is Centaurea jacea — caught during extraction)"), "geographic_origin": ("confirmed", "non-native (Japan, China); USDA 'introduced' for the lower 48"), "design_function": ("confirmed", "shade / specimen tree, street tree (2,647 in the Vancouver inventory)")},
    "cornus-nuttallii": {"taxonomic_identity": ("confirmed", "Cornus nuttallii Audubon ex Torr. & A. Gray; synonym Benthamidia nuttallii; the hybrid 'Eddie's White Wonder' (× C. florida) is a different taxon and was not used"), "geographic_origin": ("confirmed", "native to BC west of the Cascades (E-Flora Yellow S5; USDA native CAN/L48; BC floral emblem)"), "design_function": ("confirmed", "specimen flowering tree; respondents 'flowers', 'commonly planted'")},
    "cornus-sericea": {"taxonomic_identity": ("confirmed", "Cornus sericea L. accepted; C. stolonifera Michx. and Swida sericea are synonyms (USDA, E-Flora, RHS); subspecies sericea / stolonifera recognised by USDA — species-level claims only, except the 'Baileyi' GPP claims (cultivar in context)"), "geographic_origin": ("confirmed", "native throughout BC incl. CWH / CDF at sea level (E-Flora Yellow S5)"), "design_function": ("confirmed", "winter-stem shrub for mass planting, screens and wet ground (RHS, MOBOT); respondent 'colorful bark'")},
    "arctostaphylos-uva-ursi": {"taxonomic_identity": ("confirmed", "Arctostaphylos uva-ursi (L.) Spreng.; infraspecific names (var. adenotricha, var. coactilis) and Arctous / Uva-ursi combinations are synonyms; 'Vancouver Jade' claims carry the cultivar"), "geographic_origin": ("to_confirm", "native throughout BC (E-Flora Yellow S5) but modal zone IDF with 92 of 5,666 BEC plots in CWH; native at the coast on bluffs and dry sites — origin_status native_bc_west_of_cascades kept, coastal frequency to confirm"), "design_function": ("confirmed", "ground cover is the DESIGN role (both respondents typed 'groundcover'; KPU use 'Ground cover' from MOBOT, OSU, RHS); the botanical form is a prostrate evergreen shrub — the two are kept apart (kpu_plant_type Broadleaf evergreen; 'Ground cover' as a KPU plant type is a role label and is not used)")},
    "polystichum-munitum": {"taxonomic_identity": ("confirmed", "Polystichum munitum (Kaulf.) C. Presl; synonym Aspidium munitum; var. incisoserratum recognised (E-Flora, USDA)"), "geographic_origin": ("confirmed", "native to coastal BC (E-Flora Yellow S5; USDA native)"), "design_function": ("confirmed", "ground layer / filler / massed ground cover (GPP, RHS); respondents typed shrub, groundcover and perennial — roles, kept raw")},
    "achillea-millefolium": {"taxonomic_identity": ("disputed", "E-Flora BC treats Achillea millefolium sensu stricto as exotic (SNA) and the native coastal yarrow as Achillea borealis var. borealis (syn. A. millefolium var. borealis); RHS, MOBOT and USDA use A. millefolium in the broad sense. Which taxon a Vancouver planting means is a human decision; claims record each source's wording"), "geographic_origin": ("disputed", "native (A. borealis var. borealis, E-Flora Yellow S5; USDA native AND introduced for Canada) vs exotic (A. millefolium s.s., E-Flora). origin_status native_bc_west_of_cascades kept provisionally"), "design_function": ("confirmed", "ground cover / wildflower / pollinator perennial (MOBOT, RHS; respondents 'groundcover')")},
    "gaillardia-aristata": {"taxonomic_identity": ("confirmed", "Gaillardia aristata Pursh; the garden hybrid G. × grandiflora is a different taxon and was not used"), "geographic_origin": ("disputed", "native to BC's interior (E-Flora Yellow S5; IDF / PP / BG stations, none in CWH or CDF) and INTRODUCED in the lower Fraser Valley (E-Flora); USDA / MOBOT 'native' at continental scale. origin_status native_north_america kept; 'native' as a Vancouver selection reason is not supported by the BC source"), "design_function": ("confirmed", "perennial border / wildflower garden (RHS, MOBOT); respondent 'long blooming flower'")},
    "gaultheria-shallon": {"taxonomic_identity": ("confirmed", "Gaultheria shallon Pursh; no synonyms in the sources on file"), "geographic_origin": ("confirmed", "native to coastal BC (E-Flora Yellow S5; USDA native)"), "design_function": ("confirmed", "evergreen ground cover / mass planting / informal hedge (OSU, USDA; respondent 'evergreen ground cover' typed as shrub)")},
    "vaccinium-ovatum": {"taxonomic_identity": ("confirmed", "Vaccinium ovatum Pursh; var. saporosum recognised"), "geographic_origin": ("confirmed", "native to coastal BC (E-Flora Yellow S5; USDA native)"), "design_function": ("confirmed", "evergreen hedge / screen / boxwood substitute (GPP; respondent's project note)")},
}


def clean_synonyms(e):
    raw = list(e.get("synonyms_scientific") or []); out = []
    for s in raw:
        s0 = str(s).strip()
        if not s0 or "misapplied" in s0 or "auct." in s0: continue
        m = NAME_RE.match(s0)
        if not m: continue
        name = m.group(1)
        if name == e["scientific_name"] or name in out: continue
        out.append(name)
    return raw, out


rows = []; disputed = []
for f in sorted(os.listdir(os.path.join(ROOT, "plants"))):
    if not f.endswith(".json"): continue
    path = os.path.join(ROOT, "plants", f); p = J(os.path.join("plants", f)); e = p["entity"]; pid = e["id"]
    raw, clean = clean_synonyms(e)
    gf = GF.get(pid, {}); form_status = "confirmed" if gf.get("status") == "supported" else "to_confirm"
    form_note = f"read as {gf.get('form')} from {', '.join(gf.get('evidence', {}).keys())} ({gf.get('status')}; M29a)" if gf else "no growth-form vote"
    if pid == "vaccinium-ovatum": form_note += " — only RHS's 'mixed shrub border' use (weak) and the survey role say shrub; GPP / OSU pages describe a shrub but their claims on file carry no form word; a reviewer can confirm from the source"
    jd = JUDGEMENTS.get(pid, {})
    rev = {"audited": TODAY, "method": "tools/identity_audit.py (M45): sources on file + entity notes; disputed = left for human judgement",
           "taxonomic_identity": {"status": jd.get("taxonomic_identity", ("to_confirm", ""))[0], "note": jd.get("taxonomic_identity", ("", ""))[1]},
           "geographic_origin": {"status": jd.get("geographic_origin", ("to_confirm", ""))[0], "note": jd.get("geographic_origin", ("", ""))[1], "origin_status_on_entity": e.get("origin_status")},
           "botanical_growth_form": {"status": form_status, "note": form_note, "kpu_plant_type": e.get("kpu_plant_type")},
           "design_function": {"status": jd.get("design_function", ("to_confirm", ""))[0], "note": jd.get("design_function", ("", ""))[1], "respondent_roles_as_typed": e.get("respondent_roles", [])},
           "synonyms_raw": raw if raw != clean else None}
    changed = raw != clean
    if changed: e["synonyms_scientific"] = clean
    e["identity_review"] = rev
    if not DRY:
        json.dump(p, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2); open(path, "a").write("\n")
    rows.append((pid, e["scientific_name"], rev, changed, len(raw), len(clean)))
    for k in ("taxonomic_identity", "geographic_origin", "botanical_growth_form", "design_function"):
        if rev[k]["status"] != "confirmed": disputed.append((pid, k, rev[k]["status"], rev[k]["note"]))

o = [f"# Botanical identity audit · {TODAY}", "", "Generated by `python3 -I tools/identity_audit.py`. Four questions per plant, kept apart (brief 2026-11-02 §03B): taxonomic identity · geographic origin · botanical growth form (M29a reading) · design function. Mechanical fix: `synonyms_scientific` reduced to names (authors stripped, misapplied names and source keys removed; raw list kept in `identity_review.synonyms_raw`). Anything `disputed` or `to_confirm` is a human decision.", "",
     "| plant | identity | origin (entity) | growth form | design function | synonyms raw → clean |", "|---|---|---|---|---|---|"]
for pid, sci, rev, changed, nr, nc in rows:
    o.append(f"| *{sci}* | {rev['taxonomic_identity']['status']} | {rev['geographic_origin']['status']} ({rev['geographic_origin']['origin_status_on_entity']}) | {rev['botanical_growth_form']['status']} ({rev['botanical_growth_form']['note'].split(' from ')[0].replace('read as ', '')}) | {rev['design_function']['status']} | {nr} → {nc}{' (fixed)' if changed else ''} |")
o += ["", "## Open questions (human judgement)", ""]
for pid, k, st, note in disputed: o.append(f"- **{pid} · {k.replace('_', ' ')}** — {st}: {note}")
o += ["", "## Notes per plant", ""]
for pid, sci, rev, *_ in rows:
    o.append(f"### {sci}")
    for k in ("taxonomic_identity", "geographic_origin", "botanical_growth_form", "design_function"): o.append(f"- {k.replace('_', ' ')}: **{rev[k]['status']}** — {rev[k]['note']}")
    o.append("")
path = os.path.join(ROOT, "eval", f"identity-audit-{TODAY}.md")
if not DRY: open(path, "w", encoding="utf-8").write("\n".join(o))
print(f"identity audit: {len(rows)} plants · {sum(1 for r in rows if r[3])} synonym lists fixed · {len(disputed)} open questions -> {os.path.relpath(path, ROOT)}")
for d in disputed: print("  ", d[0], d[1], d[2])
