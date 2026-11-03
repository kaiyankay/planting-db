# Planting Intelligence — Local Planting Knowledge Database (prototype v0.2 · 10 plants)

ARCH 540 Assignment 2 · UBC MLA · schema 0.4.3 (concept ids, ontology.json 0.2.0) · 2026-11-03 · **verification workbench** (`review/README.md`, `reports/verification-workbench-2026-11-03.md`) · **ten plants** (3 from 2026-10-29 + 7 survey-nominated plants added 2026-11-02 through the seven-step method — `reports/methodology-report-2026-11-02.md`)

**XYZ Knowledge Graph (live, 2026-11-03):** <https://kaiyankay.github.io/planting-db/brain/xyz-preview/> — three exploration entrances (Classification · Plant Knowledge · Spatial Functions) into a progressively revealed 3D network over `brain/data/xyz.json`, the projection `tools/build_xyz.py` writes from `kg.json`; evidence trace on every line, status and verification kept apart, unknown design links listed as gaps and never drawn, three demonstration paths found in the data · notes in `brain/xyz-preview/README.md`, report in `reports/xyz-graph-2026-11-03.md`, tests `tools/xyz_tests.py`

**Planting Knowledge Network (live, 2026-11-02):** <https://kaiyankay.github.io/planting-db/brain/ontology-preview/> — the semantic graph (`brain/data/kg.json`) as a plant-centred 3D network of spheres and lines: growth forms → plants → knowledge areas → shared knowledge nodes and direct relations, evidence trace on every line, graph retrieval, candidate growth; data-driven, so new plants appear after `tools/pipeline.py` · notes in `brain/ontology-preview/README.md`, report in `reports/kg-architecture-2026-11-02.md`

**Knowledge Brain v5 (live):** <https://kaiyankay.github.io/planting-db/brain/> — the store as one 3D neural network (signals along real links) · [v4](https://kaiyankay.github.io/planting-db/brain/v4/) · [v3](https://kaiyankay.github.io/planting-db/brain/v3/) · [v2](https://kaiyankay.github.io/planting-db/brain/v2/) · [v1](https://kaiyankay.github.io/planting-db/brain/v1/) · code and notes in `brain/`

```
planting-db/
├── README.md
├── principles.md      design principles + trust model (from survey f1/f2/c3)
├── methods.md         log of method parameters (confidence baselines, thresholds, conventions)
├── schema.json        entity, field tiers (gate/compare/extended/custom), claim structure,
│                      practitioner metadata + completeness levels, relation types, rules, KPU vocab
├── sources.json       external sources (tiered, with geo specificity + licence) and
│                      anonymous practitioner records survey-r01…r06
├── synonyms.json      name lookup for all 17 survey candidates (3 in db)
├── intent_map.json    plain-language terms (survey e1/e2) → fields/values
├── relations.json     pairwise facts between the 3 plants
├── plants/            ten plant files: acer-palmatum · vaccinium-ovatum · gaultheria-shallon · cercidiphyllum-japonicum · cornus-nuttallii
│                      cornus-sericea · arctostaphylos-uva-ursi · polystichum-munitum · achillea-millefolium · gaillardia-aristata
├── data/survey/       de-identified researcher mapping of survey reasons / notes to fields (T4)
├── ontology.json      0.2.0 — XYZ architecture: axis / category / facet nodes, 340 concepts (incl. taxonomy, 23 design concepts with
│                      literature sources), 53 typed concept relations — tools/build_ontology.py (methods M31)
├── tools/
│   ├── build_ontology.py        schema vocab + intents -> ontology.json
│   ├── migrate_0_4.py           claims -> concept ids, concepts, conditions, place, time (reports/migration-0.4.md)
│   ├── build_graph.py           graph.json + diagnosis.json for brain/ (v5 scope)
│   ├── build_kg.py              kg.json — the semantic graph: typed, statused, evidenced edges + gaps/conflicts (M32)
│   ├── kg_query.py              graph retrieval prototype: recognise → traverse → claims → LLM context; --all writes eval/kg-paths-<date>.md
│   ├── survey_to_claims.py      T4 survey ingestion: anonymous respondents, claims, co_listed relations, verbatim eval queries (M35–M37)
│   ├── merge_t5.py              land an assisted extraction file (inputs/t5/) with entity refs, companions and a review list
│   ├── inat_fetch.py            iNaturalist aggregate pull (counts, month histograms; no ids / users / photos) -> data/inat/
│   ├── derive_relations.py      rule REL-R1: E-Flora habitat co-occurrence -> derived relations (M38)
│   ├── kg_tests.py              Tests A–F on kg.json -> eval/kg-tests-<date>.md
│   ├── coverage_report.py       coverage, sources, verification, conflicts -> eval/coverage-<date>.md
│   ├── validate.py              schema validator (T3) — run before committing any plant file
│   ├── merge_claims.py          append claims, retire model placeholders, regenerate this table (T2)
│   ├── cov_trees_fetch.py       City of Vancouver public-trees API -> data/cov_trees/ (T1)
│   ├── cov_trees_to_claims.py   data/cov_trees/ -> claims, --merge to land them (T1)
│   ├── verify_claims.py         human verification of T5 claims; retires model placeholders
│   ├── review_list.py           writes review/<plant>-<date>.md for Kay
│   ├── build_viz.py             T7 entry view -> viz/index.html (all plants)
│   ├── build_coverage.py        T7 coverage matrix -> viz/coverage.html
│   ├── inat_to_claims.py        iNaturalist aggregates -> claims
│   └── retrieve.py              T6 retrieval prototype (--eval, BM25 stand-in)
├── brain/                 Neural Brain v5 (index.html, js/app5.js), brain/ontology-preview/ (js/app6.js, js/kg.js) over brain/data/{graph,diagnosis,kg}.json, brain/xyz-preview/ (js/app.js, js/xyz.js) over brain/data/xyz.json
├── reports/               methodology-report · survey-integration · knowledge-graph · validation (all 2026-11-02, the 10-plant expansion) · kg-architecture-2026-11-02.md · migration-0.4.md
├── data/
│   └── cov_trees/               snapshot.json, <genus>_all.csv, <genus>_<species>.csv, facets, summary
├── inputs/
│   ├── survey/                  dated survey exports (T4 input)
│   └── t5/                      raw T5 extractions (audit trail)
├── review/                      verification checklists per plant (by field)
├── eval/                        T6 test queries + results
└── viz/                         built HTML views (open from disk): index.html, coverage.html
```

```bash
python3 -I tools/validate.py
python3 -I tools/survey_to_claims.py  # T4: newest inputs/survey/responses-*.csv (private) -> respondents, claims, relations
python3 -I tools/merge_t5.py inputs/t5/<plant>-<date>.json   # T5 step 4
python3 -I tools/derive_relations.py  # REL-R1
python3 -I tools/pipeline.py          # rebuild everything after any data change: ontology → graph → kg → validate
python3 -I tools/ai_review.py --queue --fetch --checks --status   # AI evidence review stages (M42); --assess needs ANTHROPIC_API_KEY
python3 -I tools/review_server.py     # Review Workbench on http://127.0.0.1:8767/ (local only); events -> review/events/ (private)
python3 -I tools/review_tests.py      # workbench tests A–I on a copy of the database -> eval/review-tests-<date>.md
python3 -I tools/kg_tests.py          # Tests A–F -> eval/kg-tests-<date>.md
python3 -I tools/coverage_report.py   # -> eval/coverage-<date>.md
python3 -I tools/scale_test.py        # synthetic plants through the same pipeline (Test F) -> eval/scale-test-<date>.md
python3 -I tools/kg_query.py --ask "evergreen screen for a shady North Vancouver garden"
python3 -I tools/cov_trees_fetch.py --genus ACER --species PALMATUM
python3 -I tools/cov_trees_to_claims.py acer-palmatum ACER PALMATUM --merge
```

## Status

<!-- status:begin (generated by tools/merge_claims.py, 2026-11-02) -->
| | practitioner claims | database / literature / municipal (verified/total) | model placeholders active | retired | unverified total |
|---|---|---|---|---|---|
| *Acer palmatum* | 3 (L0 3) | 17/63 | 0 | 4 | 45 |
| *Achillea millefolium* | 6 (L0 2, L1 4) | 0/53 | 0 | 0 | 53 |
| *Arctostaphylos uva-ursi* | 1 (L0 1) | 0/71 | 0 | 0 | 71 |
| *Cercidiphyllum japonicum* | 3 (L0 1, L2 2) | 10/60 | 0 | 0 | 50 |
| *Cornus nuttallii* | 2 (L0 2) | 10/68 | 0 | 0 | 58 |
| *Cornus sericea* | 2 (L0 2) | 0/65 | 0 | 0 | 65 |
| *Gaillardia aristata* | 1 (L0 1) | 0/49 | 0 | 0 | 49 |
| *Gaultheria shallon* | 5 (L0 3, L1 2) | 0/43 | 0 | 4 | 43 |
| *Polystichum munitum* | 5 (L0 4, L1 1) | 0/59 | 0 | 0 | 59 |
| *Vaccinium ovatum* | 4 (L0 2, L1 2) | 0/41 | 0 | 3 | 41 |
| relations | 15 (L0 15) | 0/16 | 3 | 1 | 19 |
<!-- status:end -->

Every `source_type: model` claim is a placeholder: `status: unverified`, confidence ≤ 0.5,
with `verify_against` naming the sources that should replace it.

## Next steps

1. Kay's review in the workbench: the 40-claim sample (`review/ai/sample-2026-11-03.json`), then the high-risk AI assessments; decisions apply to the database only through the preview → apply step (`reports/verification-workbench-2026-11-03.md` §10).
2. Confirm methods M29a, M35–M41; decide the entity origin questions (yarrow, blanketflower) noted on the entities.
3. Pojar & MacKinnon pages for habitat and the Gaultheria–Vaccinium relation; a tier-B toxicity source; Grow Green / NATS licences.
4. Next survey round: ask d2 for location and site conditions (f1); new intent words → `intent_map.json`.
5. Eleventh plant through the same commands (HANDOFF T9).

## Known data issues

- Survey responses submitted before 2026-10-29 lost the spaces in d2 text (form bug, fixed in the survey app); wording restored by hand in `data/survey/mapping-<date>.json`, raw text kept on the claims.
- *Acer palmatum* City of Vancouver claims are on the 2026-10-26 inventory snapshot; the two new trees on 2026-11-02 (M41).
- Respondent roles are kept raw (`respondent_roles`); KPU type is the normalised field.
