# review/ — knowledge verification records

One verification workflow, several stages, each with its own record (brief 2026-11-02 'Verification Workbench'; methods M42–M46).

```
review/
├── <plant>-<date>.md             Markdown checklists (2026-10-29, 2026-11-02): the pre-workbench review lists, kept for history
├── ai/                           AI-assisted evidence review (tools/ai_review.py)
│   ├── queue.json                every unverified claim with priority, downstream use, conflicts, fingerprint   (tracked)
│   ├── fetch_log.json            per source URL: status, method, cache path                                  (tracked)
│   ├── checks.json               programmatic checks per claim                                              (tracked)
│   ├── assessments/*.jsonl       AI evidence assessments, one JSON per line, model + method on every record  (tracked)
│   ├── issues.json               recurring knowledge-mapping issues grouped from the assessments (M47)          (tracked)
│   ├── sample-<date>.json        stratified human-review sample (targets, not results)                        (tracked)
│   └── cache/                    fetched page text — PRIVATE, gitignored (tier-B sources forbid copying)
├── events/
│   └── review_events.jsonl       human decisions and applies — PRIVATE, gitignored (reviewer ids, reasons)
├── exports/review-summary-<date>.json   de-identified export for dashboards and presentation (tools/review_export.py)   (tracked)
├── web/index.html                the Review Workbench page (served by tools/review_server.py on 127.0.0.1:8767)
└── screenshots/                  workbench screenshots
```

**Storage, backup, public scope.** Human review lives only in `review/events/review_events.jsonl` on this machine (append-only; back it up by copying the file; it is never committed). What may be published: the AI assessments (they cite public sources and name no person), the de-identified export (reviewer ids → `reviewer-N`, reasons kept unless an event is marked `private`), the dashboard and evaluation reports. What may not: the events file, the page cache, anything under `inputs/survey/`.

**Run.** `python3 -I tools/review_server.py` then open http://127.0.0.1:8767/ (or the `review` entry in `.claude/launch.json`). The server binds the loopback address only, holds no tokens or keys, and writes only through `tools/review_store.py` (events) and `tools/review_apply.py` (controlled write-back). GitHub Pages cannot host it: the page needs the local API and must never be able to change the repository from a browser.

**Workflow.** `ai_review.py --queue --fetch --checks` (program checks) → AI assessment (`--assess` with an API key, or agent-read) → `review_issues.py` (group recurring problems) → workbench: **Overview** → Evidence conflicts · Knowledge issues (record a policy once, then the claims one by one) · Evaluation sample · All claims → for each claim read Claim → Source evidence → AI assessment → record a decision (verify · dispute · request evidence · defer · propose correction; reasons required for dispute and correction) → preview → apply (fingerprint check, validation, revert on error, event, pipeline) → `review_export.py`, `review_eval.py` for the dashboard and the AI-vs-human comparison. Tests: `python3 -I tools/review_tests.py` (A–I on a copy of the database).
