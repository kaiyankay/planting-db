# Validation & Retrieval Results · 2026-11-02

## 1. Checks run

| check | command | result |
|---|---|---|
| schema / ontology / graph validator | `python3 -I tools/validate.py` | 13 reports OK: 10 plants, relations, ontology, kg.json — 0 errors, 0 warnings, 1 note (MOBOT "black walnut", open-list value) |
| build pipeline | `python3 -I tools/pipeline.py` | ontology 411 nodes · graph 1,313 edges · kg 2,000 edges · validate OK · 0.9 s |
| Test A classification | `python3 -I tools/kg_tests.py` | **WARN** — 10/10 taxonomy paths; growth form supported for 9, *Vaccinium ovatum* "to confirm" (RHS use mention + survey role only) |
| Test B shared knowledge | same | **PASS** — 45/45 pairs share ≥ 1 node reached by sourced claims on both sides (19–52 nodes per pair) |
| Test C direct vs indirect | same | **PASS** — 40 live direct relations with source and status; retired relation counted in pairs: 0; 17 pairs are indirect-only and shown as such |
| Test D design knowledge | same | **PASS** — 0 documented design edges (33 derived, 42 candidate, 47 unknown); 23/23 design concepts cite a book and chapter |
| Test E evidence & conflicts | same | **PASS** — 1,168 live claim edges, 0 without claim / source / verification, 0 from model or retired claims; 67 disagreements, 1 variation listed with claim ids |
| Test F extensibility | same (runs `scale_test.py --n 1`) + full series | **PASS** — 11-plant root built by the unchanged pipeline; series 1 / 10 / 50 / 100 synthetic plants in `eval/scale-test-2026-11-02.md` |
| retrieval, verbatim survey queries | `python3 -I tools/retrieve.py --eval` | 19/19 (14 e2 searches + 5 c4 questions) answered with sources or an honest empty answer; `eval/retrieval-2026-11-02.md` |
| graph retrieval paths | `python3 -I tools/kg_query.py --all` | paths A–D regenerated on ten plants; `eval/kg-paths-2026-11-02.md` |
| survey ingester idempotence | `python3 -I tools/survey_to_claims.py` ×2 | second run: 0 new respondents, 0 claims, 0 relations |
| merge idempotence | `tools/merge_t5.py` ×2 on every extraction | second run: 0 added (all duplicates) |
| Knowledge Brain | `http://localhost:8766/brain/ontology-preview/` | ten plants under six growth forms, 54 direct links, 614 claims; no console errors; no interface file edited (screenshots `brain/screenshots/ontology-preview/10-plants/`) |

## 2. Problems the real data exposed, and what was changed

| problem | where | fix |
|---|---|---|
| sword fern classified as a shrub: a weak "mixed shrub border" mention and a respondent's typed role outvoted the KPU type *Fern* | `tools/build_graph.py` growth-form vote (M29) | M29a: strong statements (KPU type, form words in morphology / size claims) decide; weak mentions and survey roles only break ties; "fronds", "perennial", "forb" added as form words |
| re-landing an extraction re-added 35 claims: annotation changed the value after the duplicate check | `tools/merge_claims.py` | annotate before the duplicate check (M39); duplicates removed; re-runs verified as no-ops |
| retired model relation counted as a direct link in plant pairs | `tools/build_kg.py` | retired relations excluded from pairs, per-plant relation counts and the placeholder list |
| four extraction files refused: MOBOT "Tolerate" values (clay soil, wet soil, erosion, urban conditions, dry soil) had no ontology node | `tools/build_ontology.py` | three new `stress:*` nodes and two aliases (M40); open list stays open, every stored value is a node |
| survey d2 basis "A combination of these" not in the schema enum | `schema.json` | basis `mixed`, 0.4.2 (M36) |
| six legacy respondent records carried survey response ids and timestamps in the public `sources.json`; a stale `viz/acer-palmatum.html` embedded them too | `sources.json`, `viz/` | stripped into the gitignored `inputs/survey/respondent_map.json`; stale view removed; sweep of tracked files clean |
| `eval/queries.json` were reconstructed proxies (M16) | `tools/survey_to_claims.py` | rewritten verbatim from the export |
| red osier dogwood excluded from habitat co-occurrence by a province-wide mean elevation | `tools/derive_relations.py` | criterion changed to minimum elevation ≤ 50 m (recorded at sea level), modal zone noted |

## 3. Remaining limitations

- Verification: 534 of 603 live claims are unverified (D5); every derived and candidate link inherits that.
- Single-source links: 341 plant–concept links rest on one source; the gate `ecological_value` has no claim for the two non-natives and `maintenance_level` none for salal.
- Local scale: measured local data exists for the three trees only; for the seven others the local layer is presence counts.
- Design concepts: 22 literature relations and the height-band bounds are readings of chapter headings; Drift and Scatter reach no plant; `habit` is single-valued.
- Relations: co-listing is the only direct survey evidence; REL-R1 co-occurrence uses the relation type `companion` for want of a `co_occurs` type.
- Sources: no tier-B toxicity, availability or photoperiod source; Pojar not read; Grow Green and NATS licences unchecked; *Acer palmatum* on the older inventory snapshot.
- Privacy: response ids remain in git history before this commit (sources.json 2026-10-30 → 2026-11-02); rewriting history is Kay's call.
- Retrieval: BM25 stand-in, no embedding model; the graph retrieval returns context blocks, not composed answers.

## 4. Items requiring human review (Kay)

1. Review checklists for the seven new plants: `review/achillea-millefolium-2026-11-02.md` (53), `arctostaphylos-uva-ursi` (71), `cercidiphyllum-japonicum` (50), `cornus-nuttallii` (58), `cornus-sericea` (65), `gaillardia-aristata` (49), `polystichum-munitum` (59) — plus the 129 from 2026-10-29. Weakest candidates named in each agent report are flagged in the claim notes (USDA shade / leaf-retention ratings, pH → soil mappings, inferred maintenance levels).
2. Entity decisions: *Achillea millefolium* origin (E-Flora: species exotic, native coastal taxon *A. borealis*); *Gaillardia aristata* (native interior, introduced in the Lower Mainland); *Arctostaphylos* KPU plant type (Broadleaf evergreen vs Ground cover); *Vaccinium ovatum* growth form.
3. Method parameters to confirm: M29a (vote weighting), M35 (respondent confidence rule), M36 (basis mixed), M37 (survey ingestion rules, incl. the fallback field for unmapped reasons), M38 (REL-R1 and its relation type), M39, M40 (erosion as a stress node), M41 (new snapshot for new plants only; proxy threshold for large trees).
4. `data/survey/mapping-2026-11-03.json`: the field chosen for each d1 reason and d2 note.
5. Model placeholders still candidate: salal competes with huckleberry; salal / huckleberry under Japanese maple.
6. The 22 literature relations and height-band bounds (unchanged from 2026-11-02 morning).
7. Decide on: refreshing *Acer palmatum* to the 2026-11-02 inventory snapshot (M6); rewriting git history for the response ids; emailing KPU for academic permission; a toxicity source; the next survey round asking for location and site conditions (f1).
