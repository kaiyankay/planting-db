# Survey inputs (T4)

Drop the three exports from the survey app (kaiyankay.github.io/planting-survey, `scripts/export.ts`) here, dated:

```
inputs/survey/
├── responses-YYYY-MM-DD.csv
├── survey-analysis-YYYY-MM-DD.json
└── plant_candidates-YYYY-MM-DD.json
```

T4 (`tools/survey_to_claims.py`, not yet written) reads the newest dated set. Re-running on a newer export adds only new `response_id`s. Raw exports contain emails — this folder is input only; nothing in it is copied into the db except anonymised respondent records (roles, experience) and claim text.

Status 2026-10-29: no exports present on this machine. The 2026-10-30 set referenced in HANDOFF.md still has to be placed here.
