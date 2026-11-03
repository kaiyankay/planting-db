# AI-Assisted Knowledge Verification & Human Review Workbench — report · 2026-11-03

Brief: *Planting Intelligence — AI-Assisted Knowledge Verification & Human Review Workbench* (baseline commit `b642766`). This phase adds a continuous knowledge-quality mechanism across Steps 02–07 of the seven-step method; the method itself is unchanged. New methods M42–M46 (`methods.md`); tests `eval/review-tests-2026-11-03.md`; AI coverage `eval/review-dashboard-2026-11-03.md`; evaluation `eval/review-eval-2026-11-03.md`; identity audit `eval/identity-audit-2026-11-02.md`.

## 1. How the AI reviews (deliverable A)

`tools/ai_review.py` runs in four re-runnable stages. **Queue:** every live unverified non-model claim (534) with a priority from its downstream use (gate field, design-suitability check, height band / layer, derived relation, disagreement, condition variation, forced mapping, low confidence) and a content fingerprint, so a later edit to the claim makes any earlier assessment *stale*. **Fetch:** each of the 62 distinct source URLs once, text cached privately; three evidence routes where the public page is not the evidence (USDA → PLANTS API profile + characteristics; iNaturalist → the API count with the same filters; Missouri Botanical Garden → the plantfinder host — still unreachable by script on this machine). **Checks (programmatic):** HTTP status, taxon name on the page, the claim's numbers on the page, source registered, downstream use. **Assess:** one record per claim with result (`supported_by_source · partially_supported · not_supported · conflicting_evidence · source_unavailable · insufficient_evidence`), locator, excerpt ≤ 25 words, explanation, missing context, conflicting claims and a reading of the conflict, taxonomy and geography checks, risk, model, method, timestamp.

**What actually ran.** The API path (`--assess`, plain HTTPS to the Anthropic messages endpoint) was built but **not run**: no API key exists on this machine. The 534 assessments on file were produced by ten Claude Code agents (one per plant, model `claude-fable-5-1`, method `agent-read`), each reading every source page once (cache text for RHS, OSU, E-Flora, USDA, ISCBC; the built-in browser or a strict-TLS fetch for Missouri Botanical Garden and Great Plant Picks, whose pages the program fetch cannot read; live API calls for iNaturalist) and judging every claim of that plant against the page. This is a genuine evidence review (read from the source, not from memory), but it is **not independent**: the extractions of 2026-10-29 / 11-02 came from the same model family. It is an assessment layer for the human, never a verification.

**Coverage (no double counting).**

| | n |
|---|---|
| unverified claims in the queue | 534 |
| source checked by AI (page or API read, claim compared) | 534 |
| … program checks only | 0 |
| … source unavailable to the AI | 0 (71 were unavailable to the *program* fetch — MOBOT; read in the browser) |
| awaiting AI review | 0 |
| awaiting human review | 534 |
| human reviewed | 0 |

**AI results:** supported by source 427 · partially supported 102 · conflicting evidence 5 · not supported 0. Risk: high 59, medium 87, low 388. Taxonomy: same taxon 527, unclear 7 (ISCBC absence checks; the yarrow native-taxon page).

**What the AI found (patterns, consistent across all ten plants).** No numeric, unit or month-mapping error was found in 534 claims. The recurring weakness is *descriptive or rated language firmed into a single vocabulary category with a condition dropped*: "dry to medium" → dry, "moist but well-drained or well-drained" → moist, USDA "Shade Tolerance: Low" → full sun, "Drought Tolerance: Medium" → a drought resistance, pH ranges collapsed to Acidic or Alkaline, "Exposed or Sheltered" kept as Sheltered, pruning advice → a maintenance level, "Bushy" → Dense, frond length stored as plant height (sword fern, two high-priority claims). The five `conflicting_evidence` records are all USDA coded characteristics contradicting every descriptive source (sword fern leaf retention and shade; kinnikinnick flower colour; salal's 6 ft mature vs 1 ft at 20 years) and the yarrow native-status split (E-Flora attaches "native" to *Achillea borealis*, not to *A. millefolium*). Most "conflicts" in the diagnosis dissolve into convention differences once both sources are read (UK 10–20-year maximum vs PNW mature size; drainage class vs moisture-use rating); a few are real (USDA shade ratings for forest-floor natives). Two claim-note errors were found that the extraction carried into every plant: the iNaturalist month-histogram note says "evergreen / visible year-round" for deciduous plants, and the ISCBC claim text asserts "it is a BC native", which that page does not say.

## 2. How the human reviews (deliverable B)

`tools/review_server.py` serves `review/web/index.html` on 127.0.0.1:8767 (loopback only, no tokens). Three columns: **queue** (search by plant / id / field / text; filters by source, AI result, human state, priority; sort by impact, conflicts, date, plant; progress per plant), **claim & evidence** (plant, field, value and ids, text, context, place / time / cultivar / conditions, status and scope, practitioner metadata, the source with link, tier and access date, the program checks, the AI assessment with locator, excerpt, missing context, taxonomy and geography readings, *every* source on the same field side by side with conflict markers — never merged — the claim's downstream use in the graph, and the review timeline), **human review** (reviewer identifier; Verify · Dispute · Request more evidence · Defer / needs expert · Propose correction; reason, notes, correction fields, a "locally applicable" flag; the AI review id the decision answers). There is no bulk-verify control. Screenshots: `review/screenshots/`.

## 3. Review records and the update mechanism (deliverable C)

Three operations, three records. (1) **AI assessment** — `review/ai/assessments/*.jsonl`, never touches a claim. (2) **Human decision** — an append-only event in `review/events/review_events.jsonl` (private, gitignored): event id, claim id, fingerprint, reviewer, timestamp, previous status, decision, reason, notes, the AI review id, the event it replaces. Changing a decision appends a new event; nothing is overwritten. (3) **Database mutation** — `tools/review_apply.py`: preview first; apply only when the fingerprint still matches (a stale decision is refused with a reason), only for mutating decisions, then `validate.py` on the plant file (revert on any error), then a `decision_applied` event, then `tools/pipeline.py` and a `kg_rebuilt` event. Verify sets `status: verified`, `verification_scope` (`content`, or `statement` for survey claims), `verified_by / at`, `review_events`, and retires model placeholders (R10). Dispute sets `disputed` with the reason. A correction retires the original (kept, with `retired_reason`) and lands a new unverified claim with `corrects` through `merge_claims` (annotation, validation). `kg.json` is never edited by hand. `tools/review_export.py` writes the de-identified summary and dashboard; `tools/review_store.py` holds the stats, which put every claim in exactly one human state.

## 4. Knowledge-quality corrections (deliverable D)

- **Relation semantics.** The 21 REL-R1 `companion` relations (shared E-Flora habitat, written 2026-11-02 incl. the hand-derived one of 2026-10-29) are retired with a reason and kept. Habitat classes and BEC zones are now ontology concepts (`habitat:*`, `bgc_zone:*`, M43) attached to every E-Flora context claim, so two plants sharing a habitat are connected Plant → concept ← Plant — 23 pairs share such a node — and never by a direct edge. Direct relations are now: 15 survey co-listings, 1 source-named companion (GPP), 3 model candidates; a `co_occurs_with` type exists for explicit source statements (none recorded yet). Test I confirms no live relation is derived from shared habitat and that retired relations do not surface as links.
- **Identity audit (M45).** Four questions per plant kept apart in `entity.identity_review`: taxonomic identity, geographic origin, botanical growth form (M29a vote), design function. Fixed mechanically: yarrow's synonym list held source keys; four lists held authority strings and duplicates (raw lists kept). Left for human judgement (disputed / to confirm): yarrow identity and origin (E-Flora's *A. borealis* split), blanketflower origin (introduced in the Lower Mainland), kinnikinnick's coastal frequency, huckleberry's growth form — the AI review found all three horticultural sources explicitly call huckleberry a shrub, so a reviewer can confirm it from the source.
- **Verification semantics (M44).** `verification_scope` on verified claims: every survey claim is `statement` (the respondent's words are recorded accurately; the botany is not verified), City of Vancouver claims are `content`. Four layers are defined in the schema and expressed by separate records: statement recorded · evidence checked · claim verified · locally applicable.

## 5. AI vs human evaluation (deliverable E)

`tools/review_eval.py` compares the AI result with the human decision for every claim that has both (agreement rule in the tool) and classifies error types from the reasons. **Human decisions on record: 0** — none were invented. A stratified sample of 40 claims (`review/ai/sample-2026-11-03.json`: all 10 plants, 8 sources, priorities 13 high / 10 medium / 17 low, AI results 24 supported / 15 partial / 1 conflicting, preferring non-"supported" claims so disagreement is testable) is the target for Kay's first pass. The mechanism was exercised with synthetic events on a copy of the database (Test D: a human dispute against an AI "supported" result is recorded with its reason, the AI record stays unchanged, both events remain). With 40 decisions the figures will say something about these 40 claims and nothing about the other 494.

## 6. Regression (deliverable F)

After the corrections: validator 13/13 OK; `kg_tests.py` A warn (huckleberry growth form) B–F pass; retrieval 19/19 verbatim queries; pipeline 0.9 s; coverage unchanged (614 claims, 603 live). Graph after the relation migration: 19 live relations (15 co-listed, 1 companion, 3 candidates), 22 retired, 23 plant pairs sharing habitat / zone nodes.

## 7. Tests A–I (`tools/review_tests.py`, run on a copy under `tests/review/out/`)

A persistence — event written and read back after reload · B traceability — AI record → claim, source URL, locator, fingerprint; human event → AI review id · C boundaries — 427 AI "supported" results, every claim still unverified; apply refuses a non-mutating decision · D disagreement — dispute against an AI result recorded with reason, AI record unchanged, replaced decision kept · E safe update — dispute applied; stale fingerprint refused; invalid correction refused and file byte-identical; valid verify applied with scope and review event; validator exit 0 · F history — two decisions and the apply all present, append-only · G graph — pipeline on the test root, `kg.json` claim index shows verified / disputed · H privacy — event log, page cache and raw survey files ignored; server loopback-only; no token strings in the page; no private path tracked; none of the 14 real response ids in any tracked file · I semantics — no live habitat-derived relation; retired relations not shown as links; survey claims scope `statement`. **All nine pass** (first run found two faults in the test harness itself — the pipeline ignored the test-root variable, and a multi-path git call — fixed).

## 8. Methods under review (M29a, M35–M41)

| method | kind of confirmation needed | status |
|---|---|---|
| M29a growth-form vote weighting | technical: reproduces the known form of all 10 plants (9 supported, 1 to confirm); rule, not fact | **testable, confirmed on the ten**; keep |
| M35 respondent confidence rule | human research judgement (reproduces Kay's six hand values; the extension to new roles is a choice) | **needs Kay** |
| M36 basis `mixed` | external evidence: the survey form offers the option | confirmed by the form; keep |
| M37 survey ingestion (fallback field, co-listing as L0, privacy map) | mixed: privacy and idempotence are testable (Test H, re-run adds 0); the field mapping table is judgement | mechanics confirmed; **mapping table needs Kay** |
| M38 habitat relation inference | **contested — withdrawn** (M43): shared habitat is an indirect connection | superseded |
| M39 annotation before duplicate check | technical: re-runs add 0 claims | confirmed |
| M40 open-list stress nodes (clay soil, wet soil, erosion) | external evidence: MOBOT states them; "erosion" as a *stress* is a judgement | nodes confirmed; **'erosion' naming needs Kay** |
| M41 snapshots (new trees on 2026-11-02, Acer on 10-26; proxy DBH ≥ 20 cm for large trees) | human judgement (M6 says ask) | **needs Kay** |

Nothing above was approved by the AI; the table says what kind of confirmation each needs.

## 9. Git history and privacy

Six early survey response ids (random UUIDs, not personal data by themselves) sit in `sources.json` from commit `1f4a039` (2026-10-30) to `b642766` (2026-11-02), and in the old `viz/acer-palmatum.html` and `viz/index.html`; they are absent from the current tree. The eight later ids never entered git. Emails in history are the git author and a public KPU contact address. Remediation, **not done** (needs approval): rewrite history with `git filter-repo` (replace-text on the 6 ids), force-push, and ask GitHub support to clear cached views; or accept the exposure as opaque identifiers and rotate the survey app's ids. The private map and the raw export are gitignored; Test H checks every commit's working tree would stay clean.

## 10. What still needs a human (priority order)

1. Review the 40-claim sample in the workbench, then the 59 high-risk AI assessments (filter AI risk / priority high).
2. Decide the five `conflicting_evidence` claims and the USDA coded characteristics for forest-floor natives (shade, leaf retention, drought) — keep side by side or dispute.
3. Entity decisions: yarrow identity / origin, blanketflower origin, kinnikinnick coastal status, huckleberry growth form.
4. Methods M35, M37 (mapping table), M40 ('erosion'), M41; confirm M42's priority weights and M46's decision vocabulary.
5. A house rule for "moist but well-drained" (average vs moist) — it drives most water-field "conflicts".
6. Git history rewrite: yes or no.
7. The two template errors in claim notes (iNaturalist "evergreen" sentence; ISCBC "BC native" clause) — correct through the workbench's propose-correction path so the originals stay.
