# Walkthrough — Knowledge Brain v3 in five minutes

Open <https://kaiyankay.github.io/planting-db/brain/> (or serve the planting-db root locally and open `/brain/`). Every step below was run in the built-in browser on 2026-10-30 at 1280 × 820; screenshots are in `screenshots/v3/`.

**0:00 — the system** (`01-system-the-database-as-a-section.jpg`). One space, read top to bottom: Foundations (10 survey questions · 9 principles · 19 decisions), Rules & methods (10 rules · 27 methods, 13 to confirm), Schema × plants (27 fields in 4 tiers × 3 plants = 81 cells holding 165 claims), Sources (12 of 15 with claims · 6 respondents), and the Construction chain on the right. Every few seconds one real thread lights up and is captioned at the bottom: *Oregon State → Acer palmatum · soil type → compare field → R1*. The panel keeps four readings apart: coverage 57/81 cells, validation (offline), verification 25/154, construction T1–T7.

**0:40 — Schema** (`02-schema-layer-fields-by-tier.jpg`). Fields appear as rows grouped by what they do at retrieval: gate (7) filter, compare (10) rank, extended (10) hold what databases lack. Each row shows its KPU vocabulary chip and how many of the three plants have a sourced claim; the panel quotes the tier descriptions and the survey basis.

**1:10 — a rule** (`03-rule-R1-governs-37-cells.jpg`). Click **R1**. Violet dashed lines run to 37 cells where two or more sources are kept side by side, and solid lines to survey c3 and method M15 that cite it. Every link in the panel names its basis: *derived · P-rule-predicate: 4 claims from 4 sources, kept side by side* or *recorded · methods.md: mentions R1*.

**1:40 — why the schema looks like this** (`04-survey-c1-motivated-gate-fields.jpg`). Foundations → **c1 · must-pass vs compared fields**. Lines run to the seven gate fields and several compare fields, each with the `schema.json field.survey` string quoted: *c1 must_pass 3/5*. This is the recorded design basis, not a reconstruction.

**2:10 — where claims come from** (`05-sources-layer-by-type-and-licence.jpg`, `06-source-oregon-state-provenance.jpg`). Sources are grouped by type and ordered local → global; hollow tiles are listed but contribute nothing yet (KPU: link only; NATS; Grow Green). Click **Oregon State**: 36 cyan lines, 23 claims (`source_id = osu`, recorded) and the cells it was planned to fill (`fill_from`, recorded).

**2:50 — one cell** (`07-cell-salal-mature-height-sources-and-rules.jpg`). Plants → *Gaultheria shallon* · `mature height`. The panel lists five sourced claims (RHS 1–1.5 m; Oregon State ≤ 0.6 m full sun poor soil and 1.2–3 m shade good soil; E-Flora to 1.5 m; USDA 1.8 m) and the retired placeholder. Lines go down to the five sources and up to R1 (kept side by side), R3 (the placeholder) and R10 (its retirement). Click a claim for its raw record, parsed context and the step that produced it (*T5 assisted extraction*, from `recorded_by`).

**3:30 — how it was built** (`08-foundations-survey-decisions-principles.jpg`, `09-construction-steps-live-counts.jpg`, `10-step-extraction-routes-and-tools.jpg`). Construction: seven steps with live numbers — decisions (10 survey questions, 19 decisions, 9 principles), collection (12 sources with claims, 3 without), extraction (124 T5 · 17 T1 · 7 T4 · 6 iNat · 10 placeholders · 1 derived), normalisation (67 quantitative · 88 categorical · 10 qualitative), validation (runs outside the browser), verification (25 verified · 129 unverified · 0 disputed), updates (11 retired · 2 edited). Click **Extraction** to see the tasks and tools behind the routes.

**4:10 — Grow** (`11-grow-candidate-what-changed.jpg`). Grow → *salal in my North Van garden stays under 60 cm in full sun*, observed on site, North Vancouver. A magenta square appears in the Salal · mature height cell; "What changed" reads: joined the gate field beside 5 sourced claims; `overlaps across conditions` E-Flora and Oregon State's full-sun reading, `below, under a different condition` the rest; states a condition no source had stated for this cell alone; status candidate, L2, not citable, never written to the db.

**4:40 — Ask** (`12-ask-roof-garden-rules-in-play.jpg`, `13-ask-salal-candidate-recalled-not-cited.jpg`). Ask → *shade-tolerant evergreen perennial for a north-facing roof garden, accessible*: 3 plants pass the gates, 14 cells and 4 sources light up, R7 / R5 / R6 / R2 light in the rules row, the panel names the rules in play and the sources used, the drawer gives the ranked list with the rank key under each line. Then *how tall does salal get in full sun*: only Salal lights; the candidate is listed as recalled, flagged, never cited (Δ line).

## What you cannot see yet

- Validation results: `tools/validate.py` is not run in the browser; the step is marked offline.
- A verification history: the repository records `status` and `recorded_by`, not who verified what and when.
- The survey responses: T4 is blocked on the export; survey claims (7) came from a manual export and respondents are anonymous records.
- Anything beyond three plants: the matrix adds a column per plant in `synonyms.json in_db`.
