# Database Visualization Mapping — what v3 draws, and from which file

2026-10-30. Written from the repository as it is, before building v3. Everything v3 shows is generated at load time by `brain/js/projection.js` from the files named below; nothing is written back. Where a connection is *derived* by a projection rule rather than recorded in a file, the rule is named here and in the app ("How this graph is built").

## 1. What actually exists

| layer | entities | file | structured? |
|---|---|---|---|
| Entities | 3 plants (`entity`: names, family, KPU type, origin status, survey mentions, external refs) | `plants/*.json`, `synonyms.json` (17 survey candidates, 3 `in_db`) | yes |
| Schema | 3 field tiers (gate 7 · compare 10 · extended 10) + open `custom` tier; each field: type, `value_kinds`, unit, `vocab` key, `survey` basis, `fill_from` sources | `schema.json field_tiers` | yes |
| Claim structure | 18 claim fields incl. `value_kind`, `source_type` priority order, `status` enum, `confidence` caps, `derived_from`, `retired_by`, `practitioner_meta` with completeness L0–L3 | `schema.json claim`, `practitioner_meta` | yes |
| Claims | 165 (154 live · 25 verified · 129 unverified · 11 retired placeholders); value, context string, source, confidence, status, `recorded_by`, `recorded_at` | `plants/*.json claims` | yes |
| Sources | 22 records (15 named sources + `survey` parent + 6 anonymous respondents): type, geo specificity, baseline confidence, licence tier A/B/C with the licence text checked | `sources.json` | yes |
| Relations | 6 pairwise relations with type, direction, status, `supporting_claims`, `derived_from` | `relations.json` | yes |
| Vocabularies | KPU facets for exposure, soil, texture, form, habit, colour, landscape use, pest; starter `resistances` list (open) | `schema.json vocab` | yes |
| Rules | R1–R10 with text | `schema.json rules` | yes (text only) |
| Design basis | which survey question motivated field tiers, practitioner metadata, source priority, the conflict rule, the vocabularies | `schema.json design_basis`, per-field `survey` strings | yes |
| Methods | M1–M24 (+ "confirmed" entries), each with parameters, who decided, date, some "to confirm" | `methods.md` | Markdown, regular format |
| Decisions | 13 rows "Decision \| Why", eight carry ids D1–D8; Why cites principles §, methods M, rules R, survey questions | `HANDOFF.md` §3 table | Markdown table |
| Principles | §1–§10 | `principles.md` | Markdown |
| Pipeline | T1–T7 with DONE / partial / blocked in the headings; 10 tools listed with their task | `HANDOFF.md` §T headings, `README.md` tree | Markdown |
| Retrieval | three routes, gates, R5 ranking, R6 attribution, 8 test queries (proxy) | `tools/retrieve.py`, `intent_map.json`, `eval/queries.json` | code + json |

Not in the repository, so not drawn: a verification history (who verified what, when) beyond `status` and `recorded_by`; validator run results (the validator runs outside the browser); the survey responses themselves (T4 export pending); any plant beyond the three.

## 2. Connections and where each comes from

**Structural** — recorded. tier → field (`field_tiers`); field → vocabulary (`vocab`); plant × field → cell → claims (`claim.plant`, `claim.field`); relation → the two plants.

**Provenance** — recorded unless marked. source → claim (`source_id`); claim → claim it was read from (`derived_from`); retired claim → the claim that retired it (`retired_by`); relation → `supporting_claims` / `derived_from` / `source_id`; field → sources planned to fill it (`fill_from`, per-plant `fill_plan`). *Derived*: claim → pipeline step and tool, read from `recorded_by` (`cov_trees_to_claims.py` → T1, `inat_to_claims.py` → M13, "T5 assisted extraction" → T5, `survey-export` → T4, "derived" → R9, bare `claude` + `source_type: model` → placeholder).

**Rule** — survey → structure is recorded (`design_basis`, per-field `survey`, `practitioner_meta.*.survey`). Decision → principle / method / rule / survey is recorded as a textual citation in the HANDOFF "Why" cell. Method → rule / decision / field / source / tool is a textual mention in `methods.md`. Rule → affected data is *derived* by one predicate per rule, shown with the predicate: R1 cells with claims from ≥2 sources; R2 practitioner claims at L0 (`citable: false`); R3 `source_type: model` claims; R4 every claim's `text`; R5/R6 the retrieval code and the source priority order; R7 the three tiers; R8 entities' raw roles and names + `synonyms.json`; R9 claims with `derived_from`; R10 retired claims with `retired_by` + `merge_claims.py`.

**Knowledge** — derived by comparison of real values: within a cell, two readings agree, overlap across stated conditions, or differ under the same condition (numeric intervals, or disjoint lists on ordinal vocabularies, as in PROPOSALS (a)); context is parsed into cultivar / condition / region (methods M23–M24).

**Evolution** — candidate only: a typed observation → its cell, its comparisons with existing readings, the gap it would fill; never written to the db, never verified, flagged in retrieval.

Recorded, derived and candidate connections are drawn differently (solid / dashed / dotted) and labelled with their basis.

## 3. What v3 draws

A single space read top to bottom like a section through the system: **Foundations** (survey questions, principles, decisions) → **Rules & methods** → **Schema** (tiers and fields as rows) crossing **Plants** (columns) in a knowledge matrix whose cells are the claims → **Sources** underneath, with the **construction steps** as a chain on the side connecting sources to claims. Relations arc between plant columns. Focusing any object (a rule, a source, a field, a plant, a cell, a step) brightens what it connects to and draws only those connections, typed; the camera frames them; the panel explains each connection and its basis. Entry rail: System · Schema · Plants · Sources · Rules · Construction · Grow · Ask. All counts are computed from the files at load.

Coverage (cells with a sourced claim), validation (schema conformance, run by `tools/validate.py` outside the browser), verification (`status: verified`) and construction progress (T1–T7) are shown as four separate readings, never as one completion figure.
