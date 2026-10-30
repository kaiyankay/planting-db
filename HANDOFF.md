# Planting Intelligence DB — Handoff for coding agent

State as of 2026-10-30 (T1–T3 done; T5 extracted for all 3 plants, 129 claims awaiting Kay's unified review (D5); T6 prototype; T7 views 1 and 4; `brain/` playable cosmos built overnight 2026-10-30 → 31 (v1) redesigned as v2 (explore / grow / reveal, methods M22–M24) and again as v3 (a visualisation of the database system from a graph projection of the files, methods M25, `brain/MAPPING.md`), live at https://kaiyankay.github.io/planting-db/brain/; T4 still blocked on the survey export). Read this, then `principles.md`, then `schema.json`, then `methods.md`. Everything else is data.

## 1. What this is

A local planting knowledge database for Vancouver, built for ARCH 540 (UBC MLA). The AI is **not trained** on it; it retrieves from it (RAG). The unit of knowledge is a **claim**: one plant × one field × one value × one source × one context × confidence. A field may hold many claims that disagree; they are never merged. Every claim carries a source. The ranking of retrieved claims follows a trust model derived from a user survey (first-hand experience > sources > local > reasoning).

Prototype scope: **3 plants**, as complete as possible — *Acer palmatum* (locked), *Vaccinium ovatum*, *Gaultheria shallon*. The goal is to show the organisation / extraction / retrieval / extension mechanisms work, not to cover many plants.

## 2. Files and status

```
planting-db/
├── HANDOFF.md            this file
├── README.md             overview + status table
├── principles.md         10 design principles incl. trust model (survey f1/f2/c3)   DONE
├── methods.md            log of every method parameter (confidence baselines, thresholds) — add an entry whenever one is decided
├── schema.json           entity, field tiers, claim (incl. value_kind), practitioner_meta, relation, rules R1–R10, KPU vocab   DONE (0.2.0)
├── sources.json          13 external sources + survey + 6 anonymous respondents   licences partly verified (see §4); cov_trees verified + snapshot recorded
├── synonyms.json         17 survey candidates → canonical ids   DONE
├── intent_map.json       plain-language terms (survey e1/e2) → fields   seeded
├── relations.json        5 pairwise relations (1 survey, 4 model placeholders)
├── plants/
│   ├── acer-palmatum.json      2 survey claims (L0) + 3 model placeholders + cov_trees claims (species + cultivar groups, verified)
│   ├── vaccinium-ovatum.json   4 survey claims (one L1 citable) + 3 model placeholders (retired) + rhs/osu/gpp/eflora/usda/iscbc/inat claims (unverified)
│   └── gaultheria-shallon.json 2 survey claims (L0) + 4 model placeholders (retired) + rhs/osu/eflora/usda/iscbc/inat claims (unverified)
├── tools/
│   ├── validate.py             T3 validator (stdlib only); `python3 -I tools/validate.py`   DONE, 16 negative tests pass
│   ├── merge_claims.py         T2 merge + retire + README table   DONE
│   ├── cov_trees_fetch.py      T1 API fetch → data/cov_trees/   DONE
│   ├── cov_trees_to_claims.py  T1 data/cov_trees/ → claims, `--merge`   DONE, run on 2026-10-26 snapshot
│   ├── verify_claims.py        T5 human step: mark claims verified / disputed; retires model placeholders (R10)
│   ├── review_list.py          T5: writes review/<plant>-<date>.md checklist of unverified claims
│   ├── build_viz.py            T7 view 1: viz/index.html, all plants with switcher
│   ├── build_coverage.py       T7 view 4: viz/coverage.html, fields × plants
│   ├── inat_to_claims.py       iNaturalist aggregate counts → claims (M13)
│   └── retrieve.py             T6: three routes, R5 ranking, R6 answers; --eval runs eval/queries.json
├── data/
│   └── cov_trees/              snapshot.json, acer_all.csv (41,969), acer_palmatum.csv (1,848), facets, summary
├── inputs/
│   ├── survey/                 dated survey exports go here (T4 input) — empty on 2026-10-29
│   └── t5/                     raw T5 extractions per plant × date, before merge (audit trail)
├── review/                     unified review checklists, one per plant, grouped by field
├── eval/                       T6 test queries + results
├── data/inat/                  iNaturalist aggregate pulls + licence texts
├── viz/                        built HTML views (T7)
├── brain/                      Knowledge Brain v3 — the database as a system (index.html, js/projection.js, js/app3.js, MAPPING.md, README, WALKTHROUGH, screenshots/v3); v2 in brain/v2/, v1 in brain/v1/
├── research/brain-research.md  mechanism log for the demo
├── PROPOSALS.md                schema proposals not applied: disputed rule, grounding
└── report-2026-10-31.md        overnight report
```

Inputs: survey `responses-*.csv`, `survey-analysis-*.json`, `plant_candidates-*.json` exported from the survey app at kaiyankay.github.io/planting-survey go in `inputs/survey/`. Not present on this machine as of 2026-10-29.

## 3. Decisions already made (do not re-open without asking)

| Decision | Why |
|---|---|
| Claim-level storage, multi-value per field, no merging | survey c3: users want to see disagreement, not a resolved value |
| Gate / compare / extended / custom field tiers | survey c1 (must-pass vs compared) and c2 (what people can't find) |
| Practitioner metadata = survey f1 list; completeness L0–L3 | f1 says what a note needs before it is trusted |
| Source priority practitioner > database > literature > municipal > model | survey f2 |
| Ranking: source type → geo specificity → completeness → confidence; vector similarity only for recall | principles §4 |
| Field names and allowed values follow KPU's search facets | interoperability with the tool users already know |
| **KPU data is NOT imported** — link only | KPU copyright page forbids incorporating its data/text into other databases |
| Model-generated values allowed only as placeholders: `source_type: model`, confidence ≤ 0.5, `status: unverified`, `verify_against: [...]` | principle §2 |
| Respondent-typed names/roles kept raw; normalisation lives in synonyms.json | principle §8 |
| 3 plants, deep, before more | principle §10 |
| Cultivar-level claims from CoV when a label has n ≥ 50; `(unrecorded)` is its own class; species-level claims always kept | methods.md M3 |
| "Established" = DBH ≥ 20 cm *proxy* for trees without planting date, confidence 0.65; dated trees go to age cohorts, never mixed | methods.md M2 |
| Method parameters are logged in `methods.md`, one entry each, never silently changed | review 2026-10-29 |
| ASPCA is tier C (link only); toxicity empty until a tier-B source is found | D1, methods M12 |
| KPU values never enter the db, not even as a note in a claim | D2 |
| Model placeholders retire as soon as any non-model claim lands on the field | D6, R10, methods M10 |
| Schema 0.3.0: `seasonal_interest.foliage_colour`, new `resistances` field; pest_susceptibility holds susceptibilities only | D7, methods M11 |
| Review of T5 output is deferred until all 3 plants are built; nothing is verified before that | D5 |
| Scope stays at 3 plants; other survey candidates stay `in_db: false` | D8 |

## 4. Source licence tiers (verified 2026-10-30 unless marked)

**A. Open — import as data**
- `cov_trees` City of Vancouver *Public trees*: Open Government Licence – Vancouver. 184,217 records in the 2026-10-26 snapshot; fields `asset_id, address, common_name, genus_name, species_name, cultivar_name, height_m, diameter_cm, local_area, geom`. **No `date_planted` in this snapshot** (earlier releases had it), and `height_m` is a banded class (15/25/35/45/55 ft midpoints), not a measurement. This is the **local measured base**.
- USDA PLANTS: not copyrighted, free for any use (US-centric; use for native status / basic traits).
- Kew POWO: per-dataset licence, mostly CC-BY (names, native range).
- iNaturalist / GBIF: per-record CC licences (local presence, phenology photos).

**B. Cite facts, never copy text**
- `mobot` Missouri Botanical Garden Plant Finder: publishes a citation format; no prohibition found.
- `eflora` E-Flora BC: copyrighted text/photos, recommended citation given → facts with citation only.
- `gpp` Great Plant Picks: only image/logo terms found; educational programme → facts with credit. (optional: email to confirm)
- `rhs` RHS: no site-wide terms page; section terms = personal non-commercial; facts with citation. Checked 2026-10-29. Gives *time to ultimate height* — unique.
- `osu`: © OSU, no terms published. `iscbc`: © only. Checked 2026-10-29, tier B.
- `aspca`: terms prohibit copying/storing any material and automated access (checked 2026-10-29). **Tier C (D1): link only; its one claim is retired.**
- `pojar`: book; not yet touched.

**C. Do not import**
- `kpu`: explicit prohibition. Store `external_refs.kpu` URL only. Optional: email plant.app@kpu.ca requesting academic permission.

## 5. Build tasks, in priority order

### T1 — CoV public-trees ingestion (replaces manual CSV download) — DONE 2026-10-29

Result: claims on `in_vancouver_street_tree_list`, `vancouver_context` (3) and `local_mature_size` (species level + one group per cultivar with n ≥ 50 + the `(unrecorded)` class, 3 claims each; methods.md M2–M4). No `time_to_intended_size` claim: the snapshot has no planting dates. Re-run `cov_trees_fetch.py` when a new snapshot appears and check whether `date_planted` is back; the script already emits age cohorts when it is.

Use the OpenDataSoft Explore API v2.1 on `opendata.vancouver.ca`, dataset id `public-trees`. Either:
- `GET /api/explore/v2.1/catalog/datasets/public-trees/exports/csv?refine=genus_name:ACER` (full genus, one call), or
- `GET /api/explore/v2.1/catalog/datasets/public-trees/records?where=genus_name="ACER" and species_name="PALMATUM"&limit=100&offset=N` (paginate; max limit 100).
No API key needed for public datasets. Record `data_processed` / snapshot date from the catalog metadata into every claim's `context`.
Then run the logic in `tools/cov_trees_to_claims.py` (port it into the pipeline; it is standalone now) and merge the output into `plants/acer-palmatum.json` via T2. Expected output: ~6–8 claims on `vancouver_context`, `local_mature_size`, `time_to_intended_size`, `in_vancouver_street_tree_list`.
Also fetch and store the genus-level facet counts so later maples reuse the download.

### T2 — Claim merge utility — DONE
`merge_claims(plant_file, new_claims)`:
- append claims; ids must be unique (`<plant>:<field>:<nn>` — allocate next nn per field, or keep a source-specific suffix like `cov01`)
- when a `verified` claim lands on a field that only had `model` claims, set those model claims to `status: retired` (keep them; do not delete — history matters)
- never modify an existing non-model claim
- validate against schema (T3) before writing
- re-generate `README.md` status table

### T3 — Schema validator + `value_kind` — DONE
- Add to `schema.json` claim fields: `value_kind: quantitative | categorical | qualitative`. quantitative = numbers/ranges (filter + range display); categorical = KPU vocab enums (exact match); qualitative = free text (semantic only). Back-fill on all existing claims.
- Write a light validator (no heavy deps): required claim fields present, `field` exists in a tier, enum values in vocab, `source_id` exists in sources.json, `practitioner_meta.basis` present when `source_type == practitioner` (else completeness L0), model claims capped at 0.5.
- Derivation rule: qualitative → categorical is allowed with `derived_from`; the reverse is not.

### T4 — Survey ingestion
Input: newest dated set in `inputs/survey/` (`responses-*.csv`, `survey-analysis-*.json`, `plant_candidates-*.json`); new exports are dropped there and the ingester re-run (methods.md M7).
`responses.csv` → (a) anonymous practitioner records in `sources.json` (roles, experience, baseline confidence; **no names, no emails**), (b) claims from d1 `why` (claim_kind `selection_reason`, L0) and d2 notes (claim_kind `observation`/`warning`, basis from `d2_basis`), (c) new intent words from e1/e2 appended to `intent_map.json` as `unmapped` for review.
Known bug: the survey export strips spaces from d2 text — fix in the survey app's export, not here.
Idempotent: re-running on a new export adds only new response_ids.

### T5 — Tier-B source extraction (assisted, not automatic) — Acer palmatum DONE 2026-10-29, awaiting verification

Protocol in methods.md M8. Vaccinium ovatum and Gaultheria shallon extracted 2026-10-29 (inputs/t5/); MOBOT has no entry for either, GPP none for salal, Pojar awaiting pages. Acer palmatum: 44 claims from rhs / mobot / gpp / osu / iscbc / aspca in `inputs/t5/acer-palmatum-2026-10-29.json`, merged as unverified; checklist `review/acer-palmatum-2026-10-29.md`. E-Flora and Pojar skipped (non-native). Next: Vaccinium ovatum and Gaultheria shallon from eflora, pojar (Kay photographs pages), gpp, inat.

For each plant × source in `fill_plan`: fetch the page, have an LLM extract **structured values only** into claims (no sentences copied; `text` is regenerated from value + source), `status: unverified`, then a human marks `verified`. Record `accessed` date and URL per claim. Skip `kpu` entirely. Check and record licence text in `sources.json` the first time each source is touched.

### T6 — Retrieval prototype — prototype built 2026-10-29 (`tools/retrieve.py`, BM25 stand-in; eval/retrieval-2026-10-29.md, test set is proxy until T4 — methods M16)
Three routes over the claim store: (1) structured filter on gate fields; (2) semantic search over `claim.text` (any small embedding model); (3) synonym/keyword lookup for names. Rank by principles §4, not by similarity. Answer format per rule R6 (attribute to who said it). Test set = the six survey e2 queries + the two c4 questions; a query "passes" if it is answered with sources.

### T7 — Visualisation (4 views, from the JSON directly) — views 1 and 4 built 2026-10-29: `tools/build_viz.py` → `viz/index.html` (all plants, switcher, deep links); `tools/build_coverage.py` → `viz/coverage.html` (fields × plants, hatched = unverified; review entry point). Views 2 and 3 (source network, layering) not started.
1. Entry view: one plant, claims grouped by field, source chip + confidence per value, disagreements side by side, model placeholders greyed, KPU link.
2. Source network: plant – field – source nodes.
3. Layering / relations: the 3 plants vertically, relation edges typed.
4. Coverage matrix: fields × plants, cell = number of independent sources (shows what knowledge is easy vs scarce).

## 6. Definition of done — per plant

- [ ] every gate field ≥ 2 independent sources; height / spread / exposure / water ≥ 3
- [ ] at least one real disagreement preserved (two claims, same field, different values, different sources)
- [ ] at least one Vancouver-context claim (cov_trees for trees; iNaturalist / practitioner for shrubs)
- [ ] at least one extended-field claim with content (toxicity, behaviour_with_others, local_mature_size)
- [ ] all survey practitioner claims for this plant ingested with metadata
- [ ] zero `model` claims with `status: unverified`
- [ ] passes validator

## 7. Open questions for the user

- ~~Cultivar scope for *Acer palmatum*~~ decided 2026-10-29: see methods.md M3.
- Email KPU for academic permission? (template available on request)
- Wind tolerance, edible-for-humans, photoperiod: surfaced by survey, not in schema tiers yet — promote to `extended` now or wait for recurrence?
