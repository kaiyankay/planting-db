# Proposals — schema changes not made tonight

2026-10-30. Both are written here instead of into `schema.json`, as the overnight brief asks. Neither changes any stored claim.

## (a) `disputed` as a status that the data can earn, not only a reviewer's verdict

**Today.** `schema.json claim.status` already lists `disputed`; the only way a claim gets there is `tools/verify_claims.py --reject` (a human decision with `dispute_reason`). Every T5 claim is `unverified`, whether it sits alone on its field or contradicts another source. The cosmos shows contradictions only because it draws every claim; the status does not.

**Proposal.** Keep `unverified` for "no reviewer has looked", and add a rule (R11) by which a claim is marked `disputed` *mechanically* when it conflicts with another sourced claim on the same plant, field and context class, with the pair recorded in a new optional claim field `disputes: [claim ids]`. A reviewer still resolves it (verify one, reject one, or keep both as a documented disagreement, which is what survey c3 wants). Rule, deliberately narrow:

1. same plant, same field, different `source_id`;
2. same context class — species vs the same cultivar; a claim whose context carries a growing condition (OSU's "full sun on poor soil" vs "shade on good soil", methods M15) is excluded, because two values under two conditions are not a dispute;
3. quantitative: the two intervals do not overlap (`{min,max}`, a single `height_m`, or `0..typical_max_m`); only on size fields (`mature_height`, `mature_spread`, `time_to_intended_size` when both values are sizes at the same age);
4. categorical: only on ordinal vocabularies where a disjoint pair is a contradiction — `exposure` (sun-only vs shade-only) and the single-value enums (`water_drainage`, `maintenance_level`, `invasive_status`, `growth_rate`). List fields where sources merely mention different items (`landscape_use`, `soil_type`, `ecological_value`, `resistances`) never dispute each other.

**Which claims would move today** (scan run 2026-10-30 over the 154 live claims; the raw scan that ignores rules 2 and 4 flags 30 pairs, most of them `landscape_use` lists, which is why those rules exist):

| plant | field | pair | values |
|---|---|---|---|
| *Acer palmatum* | mature_height | `…:mature_height:rhs02` ↔ `…:mature_height:gpp01` | 'Osakazuki' 2.5–4 m vs 6.1 m |
| *Acer palmatum* | mature_spread | `…:mature_spread:rhs02` ↔ `…:mature_spread:gpp01` | 'Osakazuki' 2.5–4 m vs 6.1 m |
| *Gaultheria shallon* | mature_height | `…:mature_height:rhs01` ↔ `…:mature_height:usdaplants01` | 1–1.5 m vs 1.8 m |
| *Gaultheria shallon* | mature_height | `…:mature_height:eflora01` ↔ `…:mature_height:usdaplants01` | to 1.5 m vs 1.8 m |
| *Gaultheria shallon* | exposure | `…:exposure:rhs01` ↔ `…:exposure:usdaplants01` | shade / part shade vs full sun only |
| *Gaultheria shallon* | exposure | `…:exposure:eflora01` ↔ `…:exposure:usdaplants01` | shade classes vs full sun only |
| *Vaccinium ovatum* | exposure | `…:exposure:01` (survey-r03) ↔ `…:exposure:usdaplants01` | part / filtered shade vs full sun only |
| *Vaccinium ovatum* | mature_height | `…:mature_height:rhs01` ↔ `…:mature_height:gpp01` | 1–1.5 m vs 2.4 m |
| *Vaccinium ovatum* | mature_height | `…:mature_height:rhs01` ↔ `…:mature_height:usdaplants01` | 1–1.5 m vs 2.4 m |
| *Vaccinium ovatum* | mature_height | `…:mature_height:osu01` ↔ `…:mature_height:gpp01` | 0.9–1.5 m vs 2.4 m |
| *Vaccinium ovatum* | mature_height | `…:mature_height:osu01` ↔ `…:mature_height:usdaplants01` | 0.9–1.5 m vs 2.4 m |
| *Vaccinium ovatum* | mature_spread | `…:mature_spread:rhs01` ↔ `…:mature_spread:gpp01` | 1–1.5 m vs 1.83 m |

That is 12 pairs over 17 distinct claims, all currently `unverified` except the survey claim (verified, L1). Excluded on purpose: OSU salal `osu01` ↔ `osu02` (two conditions, one source, M15); `gaultheria-shallon:mature_height:osu01` (≤ 0.6 m in full sun) against RHS / E-Flora / USDA (condition-bearing); every `landscape_use`, `soil_type` and `time_to_intended_size` pair the raw scan produced.

**Consequences to decide.** Does `disputed` rank below `unverified` in R5 (it is the same evidence, flagged)? — proposal: no change in rank, but R6 attribution adds "(disputed by <source>)". Does the brain colour it? — proposal: a red ring instead of the white one. Does a verified claim that is contradicted by an unverified one become disputed? — proposal: no; only `unverified` claims move, a verified claim gains the `disputes` list but keeps its status.

## (b) `grounding` for AI answer traces

**Why.** The retrieval preview can show *which* claims come back and in what order, but an eventual answer composed by a model needs to say, per sentence, which claim it rests on and how. Today a claim has `derived_from` (claim → claim provenance) but nothing points from an *answer* back into the store.

**Proposal.** A grounding object, stored with the answer (in `eval/` traces, later in a conversation log), never inside a claim:

```json
"grounding": [
  { "claim_id": "gaultheria-shallon:mature_height:osu01",
    "relation": "supports",
    "applicability": { "context_match": "partial", "note": "answer assumes full sun; claim is full sun on poor soil" } }
]
```

- `claim_id` — the claim the sentence rests on; `practitioner_meta.citable: false` claims may not appear (R2), model placeholders may not appear (R6), candidates may not appear.
- `relation` — enum `supports | contradicts | qualifies | background`: *supports* = the sentence states the claim's value; *contradicts* = the answer says the opposite and must say why; *qualifies* = the claim narrows the answer (a context condition, a confidence caveat); *background* = cited for orientation only.
- `applicability` — `context_match: full | partial | none` between the question's situation (site, exposure, cultivar) and the claim's `context`, with a one-line note; this is where "Vancouver" versus "UK growing conditions" would be recorded, and it is what R5's geographic step is implicitly doing.

Validator rules if adopted: every `grounding.claim_id` exists and is live; `relation` in the enum; a `contradicts` entry requires a note; an answer with zero `supports` entries is an "honest empty" answer and must say so.

Not proposed: putting grounding on claims themselves, or a free-text "reasoning" field — principle 3 says attribute to who, not why.
