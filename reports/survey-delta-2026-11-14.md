# Survey delta — export of 2026-11-14 (14 → 15 responses)

Incremental import run on 2026-11-13 from the private export `responses-2026-11-14.csv`, branch `survey/increment-2026-11-14`. Anonymous throughout: respondents appear only as `survey-rNN`; response ids, timestamps and durations stay in `inputs/survey/` (gitignored). Method: methods.md M54. **Everything marked "draft" below is the coding agent's and awaits Kay's approval; nothing has been pushed or merged.**

## 1 · What changed

| | before | after | delta |
|---|---|---|---|
| survey responses | 14 | 15 | +1 (`survey-r15`) |
| plants in the database | 10 | 10 | 0 |
| claims (all plants) | 614 | 615 | +1 — `cercidiphyllum-japonicum:vancouver_context:sv03` |
| relations | 41 | 41 | 0 (the new list holds one in-DB plant, so no co-listing pair) |
| raw name keys in d1 lists | 45 | 50 | +5 |
| synonyms entries | 39 | 42 | +3 out-of-DB candidates, `taxon_review: pending` |
| eval queries | 19 (14 e2 + 5 c4) | 20 (15 e2 + 5 c4) | +1 (`e2-r15`) |
| candidate evidence queue | — | 39 entries (33 d1 reasons, 6 d2 notes) | new file |

Per species: *Cercidiphyllum japonicum* 3 → 4 survey claims (L0 1 → 2), survey mentions 2 → 3. The other nine plant files are unchanged.

### The five names `survey-r15` typed

| as typed | role | outcome |
|---|---|---|
| `Cercidiphyllum japonicum` | Tree | in the database — one `selection_reason` claim (L0, not citable, `verification_scope: statement`): a personal aesthetic reason about the leaves. Not a leaf trait, not Screen evidence. |
| `Stewartia pseudocamellia` | Tree | already an out-of-DB candidate (`stewartia-pseudocamellia`, first typed by another respondent with a different spelling). Second mention; resolves through the entry's scientific name, so no new entity and no synonyms edit. |
| `Amelanchier alnifolia 'Autumn Brilliance'` | Tree | new candidate `amelanchier-autumn-brilliance`, species **unresolved** (see §3). |
| `Miscanthus sinensis 'Gracillimus'` | Perennial or grass | new candidate `miscanthus-sinensis`; carries the one d2 note of this response (below). |
| `Ribes sanguinem` | Shrub | new candidate `ribes-sanguineum` — a probable reading of the typed spelling, not confirmed. |

### The practitioner note that would have been lost

`cand:survey-r15:d2` in `data/survey/candidate_evidence.json` — on Miscanthus sinensis 'Gracillimus', basis **mixed**, location / site conditions / plant age / maintenance **not recorded**, completeness L1, not citable. In short: the respondent uses it often for size, form and seed heads, has noticed large plants flop, especially after heavy rain, and says it needs division every few years. Stored verbatim as an attributed anecdote; it is not a general characteristic of the cultivar and is not a claim.

The same gap had silently dropped five d2 notes from the 14-response set (`survey-r01`, `r04`, `r11`, `r12`, `r14`, each on an out-of-DB plant). They are now in the queue too, unreviewed. One (`r04`) had lost its spaces to the old form bug and is restored in the addendum mapping with the raw export text kept.

### Workflow answer (not ingested as data)

`survey-r15` describes plant choices that keep changing with the season, with what recently built projects (their own and others') show to work or not, and with the colours and character of the building. This informs the **user workflow and evidence-provenance** side of the tool (repeat what was seen to work; a local project as a trust signal). It is not a screening rule and is stored nowhere in the tracked data; the wording is paraphrased here on purpose.

### Aggregate signals (exploratory, n = 15, not representative)

| answer | 14 responses | 15 responses |
|---|---|---|
| conflicting sources: keep both values and note the range | 7 | 8 |
| missing knowledge: how a plant behaves alongside other plants | 6 | 7 |
| trust metadata wanted: site conditions | 9 | 10 |
| AI trust criterion: it shows its sources | 7 | 8 |

Counted from the two exports. Candidate keys: the importer derives 50 keys from the CSV; the app's `plant_candidates` export also has 50 — 46 identical, 4 differ only in quote / full-stop normalisation (same names, not extra species).

## 2 · How the five hazards were handled

1. **Private idempotence map.** The local map was present and verified before import: 14/14 mapped response ids are in the new export, in pseudonym order by submission time, exactly one response unknown. The importer now refuses to write when the map is absent, disagrees with `sources.json`, or does not belong to the export, and accepts `--expect-new N`. A backup of the map was taken outside the repository before the run.
2. **Candidate notes skipped.** New de-identified queue `data/survey/candidate_evidence.json`; no species file is created from a mention.
3. **Mapping was the 14-response version.** `data/survey/mapping-2026-11-14.json` is an addendum (draft); the importer merges all mapping files, so the reviewed 2026-11-03 mapping is unchanged and nothing fell back to an unmapped default.
4. **`status: verified` on self-reported reasons.** Not redesigned. Schema 0.4.3 already separates this with `verification_scope` (M44); the importer now writes `verification_scope: statement` on new survey claims, and the new claim's note says what it is not. Queue entries are `status: unreviewed`, never `verified`.
5. **Privacy.** The new respondent's two-role combination is unique in the sample, so the tracked record keeps one role and a `privacy_note` (confidence unchanged at the 0.8 cap). No free-text workflow answer is tracked. Tracked-file scan for response ids and timestamps: clean (see §4).

One further defect found and fixed: the new export starts with a UTF-8 BOM, which made the importer fail on the first column; it now reads `utf-8-sig`.

## 3 · Decisions for review (Kay)

1. **Public record of `survey-r15`** — one of two self-reported roles withheld. Approve, or publish both.
2. **Direct quotations** — the Katsura selection reason and the Miscanthus note are stored verbatim (as for all earlier respondents), and the e2 search is verbatim in `eval/queries.json`. The Miscanthus note says the respondent uses the plant in their own designs. Approve verbatim, or ask for paraphrase.
3. **Katsura selection reason → field `vancouver_context`**, value marked "personal aesthetic preference" (follows the `survey-r07` aesthetic-reason precedent). Alternative: keep it out of the plant file and only in the queue.
4. **Amelanchier** — typed with the species *alnifolia* and the cultivar 'Autumn Brilliance'; that cultivar is usually listed under *A. × grandiflora*. Which plant is meant is not decided; id `amelanchier-autumn-brilliance` is a placeholder.
5. **Ribes sanguinem → *Ribes sanguineum*** — probable reading only.
6. **Miscanthus** — species-level id with the cultivar kept in the name as typed (the *Lavandula* 'Hidcote' precedent); cultivar identity unchecked.
7. **Queue scope** — besides the 5 entries of `survey-r15`, the queue holds 29 out-of-DB d1 reasons and 5 d2 notes from the 14-response set. Approve, or restrict to `survey-r15`.
8. **`r04` restored text** — "No idea but so pretty" from the letters of the raw export.
9. Intent words from the new e2 search (courtyard, calming colour palette, naturalistic character, butterflies, "grow well together") are not added to `intent_map.json`; hand mapping as before.

## 4 · Tests actually run (2026-11-13)

| check | result |
|---|---|
| `survey_to_claims.py --dry-run --expect-new 1` (before import) | 14 known, **1 new: survey-r15** |
| `survey_to_claims.py --expect-new 1` (import) | 1 respondent, 1 claim added, 0 errors, 0 warnings, 0 new relations |
| `survey_to_claims.py --dry-run --expect-new 0` (after import) | 15 known, **0 new**; queue 0 new |
| `survey_import_tests.py` (new; synthetic export + map) | **8/8** — absent map refused, foreign map refused, `--expect-new` mismatch refused, dry run writes nothing, import adds one record only, second run byte-identical, no id/timestamp leak, out-of-DB note kept |
| `validate.py` | exit 0 — 0 errors, 0 warnings |
| `pipeline.py` | all steps ok |
| `kg_tests.py` | A **WARN**, B–F PASS — the same A warning as the 2026-11-03 run (growth form of *Vaccinium ovatum* to confirm); not caused by this import |
| `explorer_tests.py` | 23/23 (file tests; the `--browser` tests were not run) |
| regression, no report kept: `xyz_tests.py`, `design_tests.py`, `spatial_tests.py`, `review_tests.py` | all pass / 89/89 / 87/87 / A–K PASS |
| privacy scan of the staged diff and all tracked files (response ids, timestamps of the 15 rows) | no match |

Not run: browser-based tests; `ux_tests.py`. No file under `design/` was edited; the three demo designs rewritten by the design tests were restored from git.

Side effect to know about: `README.md`'s generated status table was regenerated, which also refreshed the *relations* row (stale since 2026-11-02; it now reflects the relations withdrawn on 2026-11-03 — no relation changed in this import).

## 5 · Rollback

Nothing is pushed. To discard everything: `git checkout main && git branch -D survey/increment-2026-11-14`, then restore `inputs/survey/respondent_map.json` to its 14-respondent state (remove the `survey-r15` entry, or copy the backup back). After a merge: `git revert <commit>` and the same map step — the map must always list exactly the respondents in `sources.json`, or the importer's preflight will stop the next run.
