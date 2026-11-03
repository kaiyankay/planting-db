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

`python3 -I tools/survey_to_claims.py` reads the newest dated CSV and the researcher mapping `data/survey/mapping-<date>.json` (tracked, de-identified), writes anonymous respondent records to `sources.json`, claims to `plants/*.json`, co-listing relations, synonyms, the verbatim query set — see methods.md M35–M37. Re-running on a newer export adds only new response ids.

What may leave this folder: roles, experience, the respondent's own words about a plant, and the anonymous id. What may not: response ids, timestamps, durations, anything that could identify a person.

Status 2026-11-02: export of 2026-11-03 (14 responses, questions version 1) ingested — 14 respondent records (r01–r06 pre-existing, r07–r14 new), 24 new claims, 14 new co-listing relations.
