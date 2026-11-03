# Workbench workflow walkthrough · 2026-11-03

Run against a second server started on the test-root copy (`PLANTING_DB_ROOT=tests/review/out/2026-11-03 tools/review_server.py --port 8768`), so the real event log and plant files were not written. The calls are the ones the page makes; outputs are the server's responses.

| step | call | result |
|---|---|---|
| overview | `GET /api/overview` | entries: conflicts 25 groups / 75 claims · issues 17 / 122 claims · sample 40 · all 532 (two claims already applied by the test suite on this copy) |
| issue policy | `POST /api/issue_decision` (water-range-collapsed, option "House rule: a stated range becomes two claims (M15) or wide_range…") | event `rev:5b15f2a0…` recorded; **no claim changed** |
| claim before | `GET /api/claim?id=acer-palmatum:water_drainage:gpp01` | status unverified · AI partially supported · awaiting human |
| bulk verify | `POST /api/verify_all` | **404** — no such endpoint |
| claim decision | `POST /api/decision` (verify, reviewer walkthrough-test, reason given) | event `rev:4aed768d…`; status **still unverified**; human state verify_pending_apply |
| preview | `POST /api/apply/preview` | ok; would change review_events, status, verification_scope, verified_at, verified_by; then validate → event → pipeline |
| apply | `POST /api/apply` | ok; new status verified; pipeline rebuilt the test root's graph (1.6 s) |
| claim after | `GET /api/claim` | verified · scope content · events: human_decision → decision_applied → kg_rebuilt |
| second apply | `POST /api/apply` (same event) | refused: stale fingerprint (the claim changed since the decision) |
| issue progress | `GET /api/issue?id=water-range-collapsed` | decided 2 of 15 (one by the test suite, one here); policy shown |
| real root | `ls review/events/`, grep plants/ | no event file, no walkthrough reviewer in any plant file |

Reading: an issue policy is a note; a claim moves only through its own decision and an explicit apply that passes validation; the same decision cannot be applied twice; the graph is rebuilt from the files, never edited.
