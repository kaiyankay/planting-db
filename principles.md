# Planting Intelligence — Database Principles

Version 0.1 · 2026-10-30 · ARCH 540, UBC MLA

This database does not give *facts about plants*. It gives *claims about plants that a designer can judge*. The difference is the whole project. Existing databases (KPU, Missouri, Great Plant Picks) each return one value per field; this one returns every value it knows, who said it, under what conditions, and how much to trust it.

The AI is not trained on this data. It retrieves from it (RAG). So the database must be built to be **retrieved precisely** and **cited cleanly**. Everything below follows from that.

---

## 1. The unit of knowledge is the claim

One plant, one field, one value, one source, one context. Not one row per plant.

- A claim is also the retrieval unit. Embeddings are built on its `text`, never on a whole plant record.
- A field may hold many claims. They are never merged, averaged or replaced by a "safe" value.
- Why: the survey (c3) split three ways on how to handle disagreement — trust a source, find a local example, keep both — and nobody chose "take the cautious value" or "defer to the authority". Users want to see the disagreement and decide. The database's job is to preserve it, not resolve it.

## 2. No source, no claim

Every value carries a `source_id`. Values the AI fills in while a field is empty are allowed but marked `source_type: model`, capped at confidence 0.5, `status: unverified`. They exist to be replaced.

## 3. The trust model comes from users, not from us

The survey asked three questions about trust. Their answers are the database's ranking and metadata rules.

**What makes an AI suggestion credible (f2, n=6)**
first-hand experience 4 · shows its sources 3 · shows a local project 2 · explains its reasoning 1

→ `source_type` priority: practitioner > database > literature > municipal > model.
→ Answers attribute to *who*, not to *why*. "A practising designer observed in a Vancouver project that *Vaccinium ovatum* takes shade better than boxwood" — not "because it is an understory species, I infer it is shade tolerant."

**What a note needs before you trust it (f1, n=6)**
location 3 · maintenance received 3 · who wrote it 3 · season 2 · site conditions 2 · plant age 1

→ These are the `practitioner_meta` fields, verbatim.
→ Completeness levels: L0 (no basis) stored only · L1 (basis) citable with caveat · L2 (basis + location) citable · L3 (+2 more) ranked up.

**What people do when sources disagree (c3)** → Principle 1.

Everything we call "trust" in this system is therefore traceable to a survey question. We did not decide what credible means; users did.

## 4. Ranking is by trust, recall is by similarity

Vector search decides *which* claims come back. It does not decide *which comes first*. Order is:

1. `source_type` priority
2. geographic specificity of the source (Vancouver > BC > PNW > North America > global)
3. practitioner completeness level
4. confidence

A Missouri value and a Great Plant Picks value for the same field are both returned; the PNW one is listed first because it is closer to the site.

## 5. Gate, then rank

Survey c1 separated attributes that *must pass* from attributes that are *compared*.

- **Gate fields** (hardiness, invasive status, water/drainage, height, spread, maintenance, ecological value) are hard filters, applied with structured queries before any semantic retrieval. A plant that fails a gate is never suggested, however well its description matches the prompt.
- **Compare fields** (light, seasonal interest, texture, form, soil, growth rate, use) are ranked semantically.
- **Extended fields** (time to size, local mature size, behaviour with others, toxicity, availability) are what existing databases lack and where practitioner claims are expected to dominate.

## 6. Three retrieval routes, each for what it is good at

- **Structured filter** — gate fields. Exact match. Never semantic.
- **Semantic search** — compare and extended fields, practitioner notes, user intent words ("low maintenance", "pollinator friendly", "north-facing roof"). The intent map (`intent_map.json`) translates these into field targets.
- **Keyword / synonym lookup** — names. Scientific, common, Chinese, misspellings (`synonyms.json`). Embeddings do not reliably know that 莎伦, salal and *Gaultheria shallon* are one plant; a table does.

## 7. Extensible without touching structure

Users add knowledge by adding claims, not by editing schema. Practitioner notes from the ongoing survey land as new claims with `source_type: practitioner`. Project-specific or personal labels go in `custom` tags, which are not validated. The schema itself changes only when a new *kind* of knowledge appears, not when a new plant or a new note does.

## 8. Respondent input stays raw

Plant names and roles as typed by respondents are kept (`raw_names`, `respondent_roles`). Normalisation happens in `synonyms.json` and `kpu_plant_type`, alongside — never by overwriting what the person wrote. A fern typed as "shrub" is data about how designers think, not an error to delete.

## 9. Controlled vocabularies are borrowed, not invented

Allowed values for gate and compare fields come from KPU's search facets. They are local, they are already familiar to the target users, and they are tested against a real collection. We add vocabulary only for fields KPU does not have.

## 10. Small and deep before wide

The prototype holds three plants, chosen so that the structure can be demonstrated end to end: a non-native tree with heavy cultivar ambiguity (*Acer palmatum*), a native shrub with a project-level practitioner note (*Vaccinium ovatum*), and a native shrub whose main story is how it behaves with neighbours (*Gaultheria shallon*). The last two are a real PNW understory pair, so the relations layer has content. Every field of every plant should hold at least one sourced claim; key fields should hold two sources that disagree. Adding plants is cheap once the pipeline runs; a thin schema is not fixable later.
