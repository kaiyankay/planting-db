# Survey inputs (T4) — PRIVATE

Everything in this folder except this README is gitignored: the raw exports carry response ids and timestamps, and the private map links the anonymous ids used in the database to them.

```
inputs/survey/
├── responses-YYYY-MM-DD.csv              raw export (survey app, scripts/export.ts)
├── survey-analysis-YYYY-MM-DD.json       aggregate export
├── plant_candidates-YYYY-MM-DD.json      candidate export (the 2026-11-03 set was checked against the CSV and not kept locally;
│                                         tools/survey_to_claims.py derives the same keys into plant_candidates-derived-<date>.json)
├── respondent_map.json                   survey-rNN -> response_id, submitted_at   (written by the ingester; NEVER copy into tracked files)
└── plant_candidates-derived-<date>.json  correspondence check with the app's candidate export
```

`python3 -I tools/survey_to_claims.py` reads the newest dated CSV and every researcher mapping `data/survey/mapping-<date>.json` (tracked, de-identified; later files are addenda), writes anonymous respondent records to `sources.json`, claims to `plants/*.json`, co-listing relations, synonyms, the verbatim query set, and the candidate evidence queue `data/survey/candidate_evidence.json` (statements about plants not in the database) — see methods.md M35–M37, M54. Re-running on a newer export adds only new response ids.

What may leave this folder: roles, experience, the respondent's own words about a plant, and the anonymous id. What may not: response ids, timestamps, durations, anything that could identify a person.

Status 2026-11-02: export of 2026-11-03 (14 responses, questions version 1) ingested — 14 respondent records (r01–r06 pre-existing, r07–r14 new), 24 new claims, 14 new co-listing relations.

**Incremental import (M54).** Always: `--dry-run --expect-new <n>` first, then the same without `--dry-run`, then `--dry-run --expect-new 0`. The importer stops before writing if `respondent_map.json` is absent or does not match `sources.json` and the export — on a fresh clone the map does not exist, so copy it from the private machine first; never let the importer start again from `survey-r01`. Keep a backup of the map outside the repository.

Status 2026-11-13: export of 2026-11-14 (15 responses) ingested — 1 new respondent record (r15), 1 new claim (selection reason), 0 new relations, 3 new out-of-DB candidates, candidate evidence queue created (39 entries, 6 d2 notes).
