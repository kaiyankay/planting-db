# Seven-Step Methodology Report — 10-Plant Knowledge Database · 2026-11-02

Brief: *Planting Intelligence — 10-Plant Knowledge Database Expansion* (ARCH 540, UBC MLA). This report records, step by step, what the repository already implemented before this phase, what was done in this phase, the inputs and processing of each step, its outputs, and what remains. Companion reports: `survey-integration-2026-11-02.md` (survey), `eval/coverage-2026-11-02.md` (coverage and quality, generated), `knowledge-graph-2026-11-02.md` (relations and graph), `validation-2026-11-02.md` (tests and retrieval). Method parameters decided in this phase are logged in `methods.md` M29a and M35–M41, all marked *to confirm*.

## 0. Audit of the repository against the seven steps (done first)

| step | existing implementation (before 2026-11-02) | status found | work added in this phase |
|---|---|---|---|
| 01 Local data extraction | `tools/cov_trees_fetch.py` + `cov_trees_to_claims.py` (City of Vancouver public trees, M1–M4, M6); iNaturalist aggregate layer (`inat_to_claims.py`, M13) but the pull itself was done by hand | partial: tools for one tree; no re-usable iNaturalist puller; no coverage inventory | `tools/inat_fetch.py`; CoV fetch for two genera; local-data inventory (§1) |
| 02 Integration & structured claims | `schema.json` 0.4.1, claim store `plants/*.json`, `sources.json`, `synonyms.json`, `merge_claims.py`, `migrate_0_4.py` (ontology annotation as a one-off migration) | partial: annotation not part of the landing path; survey ingester (T4) never written; three plants | 7 plant files; `survey_to_claims.py` (T4); `merge_t5.py`; annotation on landing (M39); schema 0.4.2 |
| 03 Validation & verification | `validate.py` (schema, ontology, kg), `verify_claims.py`, `review_list.py`, diagnosis of disagreement / variation (M28); D5 (nothing verified before Kay's review) | implemented; review queue existed for 3 plants | validation run on every landing; 7 new review checklists; conflict records regenerated; idempotence fixed |
| 04 Survey analysis & requirements | principles and schema tiers derived from the 6-response survey (c1/c2/c3/f1/f2); `intent_map.json` seeded; `eval/queries.json` proxies | partial: 14 responses never analysed; T4 blocked | full analysis of the 14-response export; gap matrix; intent map extended; verbatim query set |
| 05 Professional enrichment | T5 protocol (M8) and licence tiers (HANDOFF §4); extractions for 3 plants, all unverified | implemented for 3 plants | 7 assisted extractions (384 claims) through the same protocol and the same source set |
| 06 Design knowledge | ontology 0.2.0 Z dimension (23 design concepts, 53 literature relations, M31); KG rules KG-R1…R5 (M32); `relations.json` with 1 survey + 1 derived + 3 model relations | implemented as rules; relation layer almost empty | 15 survey co-listings, 1 documented companion, 20 rule-derived co-occurrences (REL-R1, M38); plant-pair generation fixed to ignore retired relations |
| 07 Knowledge graph | `pipeline.py` (ontology → graph → kg → validate), `kg_query.py`, Knowledge Brain reading `kg.json` only, `scale_test.py` | implemented | run on ten real plants; `kg_tests.py` (Tests A–F); growth-form rule corrected (M29a) |

Nothing in the research method was changed to fit the code; where the code did not follow the method (annotation outside the landing path, retired relations counted as links, growth form outvoted by weak mentions) the code was changed.

## Step 01 — Local Data Extraction

**Existing.** City of Vancouver *Public trees* ingestion for *Acer palmatum* (snapshot 2026-10-26, 1,848 trees); iNaturalist aggregate counts for the three plants (pull 2026-10-29).

**New work.** (a) `tools/cov_trees_fetch.py` run for *Cercidiphyllum* and *Cornus* (the catalogue snapshot had moved to 2026-11-02, 184,152 records); (b) `tools/cov_trees_to_claims.py --merge` for katsura and Pacific dogwood; (c) `tools/inat_fetch.py` written and run for all ten plants (place 27530, verifiable, CC0/CC-BY/CC-BY-NC; counts and month histograms only, never ids, users, coordinates or photos); (d) `inat_to_claims.py` now reads the newest pull.

**Inputs.** Open Government Licence – Vancouver (tier A); iNaturalist API (tier B, aggregate only, M13).

**Processing and verification.** CoV claims are `verified` (open data stored as published; M1/M1a confidences; height is a banded class, M4; established proxy DBH ≥ 20 cm, M2). iNaturalist claims are `unverified` at ≤ 0.6 confidence (community identifications).

**Output — Local Data Inventory & Coverage.**

| plant | CoV public trees (snapshot) | iNaturalist Greater Vancouver (licensed verifiable / research grade; pull 2026-11-03 UTC) | local claims |
|---|---|---|---|
| *Acer palmatum* | 1,848 (2026-10-26); cultivar groups Osakazuki, Bloodgood, Koto No Ito, (unrecorded) | 20 / 6 | 18 |
| *Cercidiphyllum japonicum* | 2,647 (2026-11-02); 2,611 unlabelled; 'Red Fox' 30 (below the n ≥ 50 group threshold) | 8 / 2 | 11 |
| *Cornus nuttallii* | 620 (2026-11-02); 'Goldspot' 11 | 386 / 252; 29 flowering annotations | 13 |
| *Cornus sericea* | not in the tree inventory | 2,100 / 1,388; flowering 39, fruiting 68 annotations | 4 |
| *Arctostaphylos uva-ursi* | not in the tree inventory | 495 / 432; flowering 33, fruiting 36 | 4 |
| *Polystichum munitum* | not in the tree inventory | 8,110 / 7,816 (the most-recorded of the ten) | 2 |
| *Achillea millefolium* | not in the tree inventory | 2,063 / 1,502; flowering 234 | 3 |
| *Gaillardia aristata* | not in the tree inventory | 249 / 77; flowering 46, fruiting 21 | 4 |
| *Gaultheria shallon* | not in the tree inventory | 5,382 / 5,214 (2026-10-29 pull kept) | 2 |
| *Vaccinium ovatum* | not in the tree inventory | 29 / 24 (2026-10-29 pull kept) | 1 |

Dataset limitations, recorded in `sources.json` and on every claim: the tree inventory covers street and park trees only, so seven of the ten plants cannot appear in it (absence says nothing about whether they grow in Vancouver — recorded on the entity flag, never as a claim); `height_m` is a class midpoint, not a measurement; the snapshot carries no planting date, so no time-to-size claim can be derived; iNaturalist counts reflect observer effort as much as abundance, and phenology annotations are volunteer-made (threshold n ≥ 20, M13). No local record was invented for any plant.

**Remaining.** *Acer palmatum* stays on the 2026-10-26 snapshot (M6 asks Kay before refreshing); the Grow Green Guide and NATS Nursery (named by respondents) are still "licence to check" and were not used.

## Step 02 — Data Integration & Structured Claims

**Existing.** The claim schema (one plant × one field × one value × one source × one context × confidence), field tiers, KPU vocabularies, ontology ids (0.4.0), `merge_claims.py` (duplicate check, id allocation, R10 retirement, README table).

**New work.** Seven entity records written by hand from the accepted scientific name, synonyms, family, KPU plant type and origin (facts confirmed or corrected by the Step 05 extractions and recorded in `entity.notes` where sources disagree — see yarrow and blanketflower); `tools/merge_t5.py` lands an extraction file (claims through `merge_claims`, external references, synonyms, named companions, review checklist); `tools/survey_to_claims.py` lands the survey; annotation (ontology ids, `value_label`, concepts, conditions, place, time, cultivar) now runs inside `merge_claims` before the duplicate check (M39), so every landing path produces the same shape and re-runs are no-ops (verified: a second run of every merge adds 0 claims). Schema 0.4.2 adds `basis: mixed` and `entity.survey_respondents` (M36). Name normalisation: `synonyms.json` now resolves every name typed in the 14 responses (45 raw-name keys → 16 in-database, 29 known candidates, 0 unresolved); respondent spellings are kept as names.

**Inputs.** `inputs/t5/<plant>-2026-11-02.json` (7 files, audit trail of the extraction), `inputs/survey/responses-2026-11-03.csv` (private), `data/survey/mapping-2026-11-03.json` (public, de-identified).

**Output — Structured Plant Claims with Provenance.** 614 claims in all (603 live, 11 retired model placeholders from 2026-10-30): 524 database, 47 municipal, 32 practitioner. Units are normalised (ft → m with the raw figure kept; USDA, RHS and Canadian hardiness never converted, each its own facet); contexts carry species vs cultivar, the source's region and any stated growing condition; multi-value fields keep every source side by side (R1) — e.g. *Cornus nuttallii* height: RHS 8–12 m, OSU 9–12 m, MOBOT 4.6–12.2 m, USDA 15.2 m (and 3.7 m at 20 years), E-Flora to 20 m, City of Vancouver median height class 10.7 m.

**Remaining.** `habit` is single-valued (a plant that is both dense and upright needs two claims — schema candidate, not made); `seasonal_interest` has no key for foliage scent or stem colour beyond `winter_interest` (katsura's autumn scent and red osier's red stems sit in notes / winter_interest).

## Step 03 — Data Validation & Verification

**Existing.** `validate.py` (required fields, ids, vocab, ontology ids, sources, practitioner metadata and completeness, model caps, derivation direction, relations, ontology relations, kg edges); `review_list.py` / `verify_claims.py`; diagnosis rules (M28).

**New work.** Validation ran at every landing (merges are refused on any error — four extraction files were refused until the open-list stress values had ontology nodes, M40); the final run reports 13/13 OK, 0 errors, 0 warnings, 1 note. Seven review checklists written (`review/<plant>-2026-11-02.md`, grouped by field with every live claim side by side). Conflict records regenerated: 67 disagreements, 1 condition-dependent variation, 5 use-vs-trait contradictions (`brain/data/diagnosis.json`, `kg.json conflicts`).

**The five statuses are kept apart.** Schema-valid = passes `validate.py` (all 614). Source-backed = has a `source_id` other than `model` (603 live claims). Verified = 69 (CoV open-data claims and the respondents' own words; D5: no literature claim is verified by the coding agent). Unverified = 534, in the review queue. Candidate = model placeholders (11, all retired) and the brain's in-browser observations (never written to the store). Nothing moved between these columns automatically.

**Licensing.** Only the sources whose licence Kay tiered on 2026-10-29/30 were used (RHS, MOBOT, GPP, OSU, E-Flora, USDA PLANTS, ISCBC, CoV, iNaturalist); KPU and ASPCA stayed link-only; Grow Green, NATS, Pojar untouched. Structured values only; `text` written from the value.

**Output.** `eval/kg-tests-2026-11-02.md` (Test E), `eval/coverage-2026-11-02.md`, `review/*-2026-11-02.md`.

**Remaining.** 534 unverified claims await Kay's unified review; PROPOSALS (a) (`disputed` earned mechanically) still not applied, so disagreement is visible in the diagnosis but not in claim status.

## Step 04 — Survey Analysis & Knowledge Requirements

Full report: `survey-integration-2026-11-02.md`. In short: 14 responses (8 MLA students, 5 practising designers, 6 related-field students, 3 with no planting experience; 11 answered the project questions). Must-pass attributes: invasive status (8/11), hardiness, seasonal appearance, maintenance (6 each); nobody must-passes time to size, yet "real mature size under local conditions" is what 6/14 could not find. Hardest to find: availability and cost (8), conflicting sources (8), long-term performance (7), behaviour with other plants (6). Conflict handling: keep both values (7/14), find a local example (4), trust one source (3), nobody takes the cautious value. Trust in a note: site conditions (9), location (8), author (7). Trust in an AI suggestion: shows sources (7), local project (5), first-hand (5), reasoning (5). The schema already expresses the gate / compare / extended split; the gaps are climate-change adaptability, successional role, toxicity by organism and part, pest management, cultivar-level coverage, availability — recorded in `intent_map.json unmapped_from_survey`, not added to the schema (no source for them yet).

## Step 05 — Professional Plant Knowledge Enrichment

**Existing.** Extractions for three plants (RHS, MOBOT, GPP, OSU, E-Flora, USDA, ISCBC), 129 claims unverified.

**New work.** Seven assisted extractions (one agent per plant, structured values only, every forced vocabulary mapping noted with lowered confidence, every claim with URL and access date) — 384 claims: katsura 49, Pacific dogwood 55, red osier dogwood 61, kinnikinnick 67, sword fern 57, yarrow 50, blanketflower 45. Priorities from Step 04 drove the field list: hardiness, water, height / spread, maintenance, seasonal performance, ecological value, invasive status (gate), time to size (RHS "time to ultimate height" for every plant that has an RHS page; USDA 20-year heights), behaviour with others and long-term performance (notes from MOBOT / GPP / USDA), local context (E-Flora habitat, BGC zones, elevation, BC distribution).

**Findings that matter for Vancouver.** E-Flora treats *Achillea millefolium* sensu stricto as exotic and the native coastal yarrow as *A. borealis*; *Gaillardia aristata* is native to BC's interior and *introduced* in the lower Fraser Valley (no CWH / CDF stations); kinnikinnick's modal zone is the interior IDF (92 of 5,666 plots in CWH); katsura's autumn colour is a highlight for GPP and MOBOT but "not spectacular" for OSU in Corvallis; all three tree sources stress summer watering for young katsura; USDA's shade-tolerance ratings contradict every horticultural source for the forest-floor natives (sword fern, salal, Pacific dogwood) — kept side by side at low confidence.

**Output.** Expanded database (coverage per field × plant in `eval/coverage-2026-11-02.md`): every plant has 19–24 of 27 fields with ≥ 1 source and 11–16 with ≥ 2 independent sources; gate fields missing: ecological value for the two non-natives (no source states a function), maintenance for salal.

**Remaining.** Not available: MOBOT has no page for sword fern or salal; GPP none for Pacific dogwood, kinnikinnick, yarrow, blanketflower (species), red osier (species; 'Baileyi' used with cultivar context); OSU none for yarrow, blanketflower; Pojar & MacKinnon still awaits pages; no tier-B toxicity source (D1); no availability / cost source.

## Step 06 — Planting Design Knowledge Integration

**Existing.** Z-dimension concepts with book and chapter (Robinson; Rainer & West; Oudolf & Kingsbury; Mooney), `requires_trait` / `maps_to` / `typically_formed_by` / `corresponds_to` relations, rules KG-R1…R5.

**New work.** No new design concept was needed; the ten plants exercise the existing ones: 33 *derived* design links (a sourced KPU use names the concept), 42 *candidate* (every required trait met by claims), 47 *unknown* or contradicted — never promoted. Vertical layers by KG-R5: canopy (katsura, Pacific dogwood, Japanese maple), understorey (the same three, by height band), shrub layer (red osier, kinnikinnick, salal, huckleberry), ground layer (yarrow, blanketflower, sword fern, kinnikinnick, salal). Plant-to-plant relations now distinguish four kinds: survey co-listing (documented, practitioner, co-mention only), source-named companion (documented, GPP: sword fern with evergreen huckleberry), habitat co-occurrence (derived, REL-R1, E-Flora), model placeholders (candidate, 3, awaiting evidence). The brief's warnings hold by construction: shrub does not imply screen (Screen requires above-eye height and a dense habit — red osier derived and supported, huckleberry still contradicted by its single "Upright" habit claim); shared conditions do not make companions (a pair's text says so).

**Output.** `relations.json` (41 relations, 1 retired), `knowledge-graph-2026-11-02.md`.

**Remaining.** 22 literature relations and the height-band bounds still to confirm at page level by Kay; *Scrim*, *Drift*, *Scatter* reach no plant (composition patterns are planting-plan knowledge the claim store does not carry); the relation type `companion` is used for co-occurrence because the enum has no `co_occurs` (M38, to confirm).

## Step 07 — Multimodal Knowledge Graph Construction

**Existing.** `pipeline.py`, `build_kg.py`, `kg_query.py`, Knowledge Brain.

**New work.** The pipeline ran unchanged on the ten plants: 463 nodes, 2,000 edges (1,696 documented · 211 derived · 46 candidate · 47 unknown), 614 claims indexed, 45 plant pairs (19–52 shared nodes each; 28 pairs with a sourced direct relation). Two pipeline faults exposed by real data were fixed in the rules, not the data: retired relations were counted as direct links in plant pairs (build_kg), and the growth-form vote let a weak "mixed shrub border" mention plus a respondent's typed role read the sword fern as a shrub (M29a: strong statements decide, weak mentions and survey roles only break ties). `tools/kg_tests.py` runs Tests A–F (`eval/kg-tests-2026-11-02.md`: A warn — huckleberry's form still "to confirm"; B–F pass). The Knowledge Brain shows the ten plants with no interface change (screenshots `brain/screenshots/ontology-preview/10-plants/`). Media: the `media[]` slot is still empty.

**Output.** `brain/data/kg.json`, `eval/kg-paths-2026-11-02.md` (regenerated on ten plants), `eval/kg-tests-2026-11-02.md`, `eval/scale-test-2026-11-02.md` (10 real + 1 / 10 / 50 / 100 synthetic).

**Remaining.** Plant pairs are quadratic (sparsify beyond ~100 plants); the brain's 3D interface was not redesigned (out of scope).

## How the database is built, in one paragraph (for the presentation)

A plant enters as an entity record (accepted name, synonyms, family, KPU type, origin). Local open data (City of Vancouver trees, iNaturalist aggregates) lands first as verified or low-confidence claims with their snapshot date. The survey lands next: each respondent becomes an anonymous source with a confidence from their role and experience; their reasons and notes become claims in their own words, and plants named together become co-listing relations. Professional sources are read one plant × one source at a time; only structured values are taken, each as a claim with URL, access date, context and a confidence lowered wherever a term had to be forced into the KPU vocabulary. Every claim is annotated with ontology ids, stated conditions, place and time on landing, validated, and left *unverified* until Kay ticks it. Rules — named on every edge — then derive growth form, height bands, vertical layers, design-concept suitability and habitat co-occurrence from those claims. The graph builder turns the claim store and the ontology into `kg.json`; the brain, the graph retrieval and the tests read only that file, so the eleventh plant needs the same five commands and no code.
