# Survey Integration Report · 2026-11-02

Source: the three exports of 2026-11-03 from the ARCH 540 survey app (`responses-2026-11-03.csv`, `survey-analysis-2026-11-03.json`, `plant_candidates-2026-11-03.json`; questions version 1; 14 responses, all selected, no filter). The three files correspond: the analysis and the candidate list are projections of the same 14 rows (checked by regenerating the candidate keys from the CSV: 45 raw-name keys; the app merges nothing — every `researcher_reviewed` block is empty, status `candidate`). None of the three files contains botanically checked data; every plant attribute below is a respondent's statement. The raw files are private (`inputs/survey/`, gitignored); the database holds anonymous respondent records (`survey-r01`…`r14`), de-identified mappings (`data/survey/mapping-2026-11-03.json`) and claims. **This is a small exploratory sample** — 14 people, mostly UBC MLA students and designers in their circle — not a picture of the profession.

## 1. Who answered and how they choose plants

| | n |
|---|---|
| MLA student | 8 |
| landscape designer / architect | 5 |
| related-field student | 6 |
| former professional gardener (other) | 1 |
| studio / professional / personal-garden / no experience | 9 / 7 / 6 / 3 |

Eleven of fourteen answered the project questions (b1–c1); three had no planting experience and answered only the knowledge and trust questions. Species are settled during design development (4) or when preparing the planting plan (3); for two it "keeps changing"; for one someone else decides. They look in online plant databases (8/11) and AI chat tools (7/11) first, then municipal lists (4), colleagues (3), web search (3), books (2), nurseries (2), software libraries (1), their own projects (2). The free-text accounts (b3) describe five selection logics: start from site and existing vegetation (r06: 70 % native after checking NATS Nursery and iNaturalist), start from a concept or atmosphere and ask an AI for a list that "works in Vancouver" (r08), start from a client or municipal palette (r07, r03), start from a focal tree and fill in (r04), or buy what is available (r10, r12). Several name the same check order the database uses: visual fit first, then "is it actually good for the site conditions" (r08); bloom season, texture, water, and "whether they support each other, provide habitat, attract pollinators" (r05); sun exposure by aspect and purpose — privacy hedge, foundation planting, low shrub for CPTED (r14).

## 2. Must-pass vs compared (c1, n = 11)

| attribute | must pass | compared | not considered |
|---|---|---|---|
| invasive / problematic status | **8** | 1 | 2 |
| hardiness | **6** | 3 | 2 |
| seasonal appearance | **6** | 3 | 2 |
| maintenance needs | **6** | 5 | 0 |
| light | 5 | 5 | 1 |
| mature spread | 5 | 3 | 3 |
| native / ecological value | 5 | 4 | 2 |
| water and drainage | 4 | 5 | 2 |
| mature height | 4 | 4 | 3 |
| time to reach intended size | 0 | 4 | 7 |

Against the 6-response basis of the schema (2026-10-30): invasive status rises to the clearest gate; maintenance is the only attribute nobody ignores; seasonal appearance moves from "compared" to a gate for half the respondents; time to size remains outside everyone's workflow although size under local conditions is a top "could not find" item. The schema's tiers hold (gate: hardiness, invasive, water, height, spread, maintenance, ecological; compare: light, seasonal, form, texture…); the one re-assessment is that `seasonal_interest` behaves like a gate for half the designers — it stays a compare field but the intent map treats "seasonal interest" words as ranking signals that every answer reports.

## 3. What they cannot find or trust (c2, n = 14) and what they do about conflicts (c3)

Local availability and cost 8 · conflicting information between sources 8 · long-term performance and maintenance 7 · real mature size under local conditions 6 · how it behaves alongside other plants 6 · how it looks at different ages and seasons 1. Nobody answered "I haven't looked". Specific things (c4): whether native fruiting plants are toxic to pets (r01); long-day / short-day flowering (r03); "how well it works with other plants I've chosen" (r07); colour variants and their climate suitability — little information on unpopular variants (r08); medicinal value and how to treat pests (r12).

When sources disagree: keep both values and note the range **7**, look for a local example or someone's local experience 4, go with the most-trusted source 3; nobody checks the original reference or takes the cautious value. This is exactly rule R1 (never merge; keep every value with its context) and rule R5's geography step; the 14-response sample confirms the 6-response decision.

## 4. Trust (f1, f2, n = 14)

A note is trusted when it gives site conditions 9, location 8, who wrote it and their experience 7, season observed 6, maintenance received 5, plant age 2 — the `practitioner_meta` field list, now with site conditions ahead of location. An AI suggestion is taken seriously when it shows its sources 7, a local project 5, first-hand experience 5, its reasoning 5; two would verify anyway. The source priority (practitioner > database > literature > municipal > model) stands; "shows its sources" is now the single most-named criterion, which is what every claim's `source_id`, URL and status provide.

**A form gap, not a schema gap:** the survey asks respondents for the *basis* of a note (observed / read / project / combination) but not for the location, site conditions or maintenance it received — the very details 9/14 say they need. Of the 11 d2 notes, none carries site conditions; one gives a location ("my backyard"). Every practitioner note is therefore L1 (citable with the caveat "location not recorded") except katsura (L2). Recommendation for the next survey round: ask d2 for location and site conditions explicitly.

## 5. Plant selection

45 distinct raw names were typed in d1 by 11 respondents (every list resolves: 16 keys are the ten database plants under different spellings, 29 are known candidates with `in_db: false` in `synonyms.json`). Mentions among the ten: Japanese maple 3 (two as "Japanese maple", one as "acer palmatum"), western sword fern 3 (as "Western Sword Fern", "Sword fern", "Polystichum munitum"), katsura 2, Pacific dogwood 2, kinnikinnick 2 ("Kinnikinnicks" / "Kinnikinnick"), yarrow 2 ("Achillea millefolium" / "Yarrow"), salal 2 ("Gaultheria shallon" / "Salal"), evergreen huckleberry 1, red osier dogwood 1, blanketflower 1. The first batch of ten was fixed by the brief; the survey supports it: the seven additions are the seven most-mentioned candidates outside the original three, and together the ten cover five growth forms (tree, shrub, prostrate shrub, fern, herbaceous perennial), native and non-native origin, and trees that are or are not in the city inventory. Candidates with a single mention that are not in the first ten (Douglas-fir, Garry oak, arbutus, dawn redwood, stewartia, ginkgo, Persian ironwood, Canada yew, lavender, sedum, hardy geranium, hellebore, cyclamen, deer fern, Dryopteris, strawberry, cattail, reed grass, mountain ash, flowering cherry, salmonberry, Nootka rose, Labrador tea, Pacific crabapple, white clover, woolly sunflower, harebell, honey locust) keep their respondent spelling and reason in `synonyms.json` / the private export and resolve to a stable id, so the next batch starts from the same keys.

**Roles as typed vs botanical form.** Sword fern was typed as *shrub*, *groundcover* and *perennial or grass* by three respondents; kinnikinnick and yarrow as *groundcover*; salal once as *shrub* with the reason "evergreen ground cover". The roles stay raw on the entity (R8); the growth form is read from sources (M29/M29a: fern, prostrate shrub, herbaceous perennial, shrub) and the design role *Ground cover* is a landscape-use claim. "Groundcover" is a design function here, not a life form — the brief's distinction is now visible in the data.

## 6. Practitioner knowledge that entered the database

32 practitioner claims from 9 respondents (r01, r03, r04, r05, r06, r07, r08, r10, r14), landed by `tools/survey_to_claims.py` through the researcher table `data/survey/mapping-2026-11-03.json`:

- **Selection reasons (d1 'why', 20 claims, L0, stored but never cited):** mapped to a field where the words name one (native → `ecological_value`; evergreen / fall colour / flowers / long blooming → `seasonal_interest`; "fills up space" → `landscape_use` Filler; "colorful bark" → `winter_interest`), otherwise kept as a Vancouver-context reason in the respondent's words ("good for amenity space"; "commonly planted, proved to be suitable").
- **Notes (d2, 5 claims + 4 derived, L1–L2, citable with caveat):** yarrow *spreads vigorously under certain conditions, use cautiously; large swathes can be beautiful* (mixed basis — a `warning` on `behaviour_with_others`, derived mass-planting use); sword fern *you can put this plant anywhere and it will survive* (read — `long_term_performance`); katsura *grows in my backyard and its leaf has a sweet smell* (observed, location given — L2; derived `landscape_use` Fragrance); salal *used in Pacific Northwest native-focused gardens, less seen in other private / commercial greenspace* (observed — context, derived Native planting); yarrow *native species that does well in this local climate* (observed). Spaces swallowed by the pre-fix form (M21) were restored by hand; the raw export text stays on the claim.
- **Confidence:** by role and experience (M35: 0.4 for a student with no experience … 0.8 for a practising designer with professional projects), +0.05 for a note with a basis.
- **Notes on plants outside the ten** (Labrador tea, honey locust, arbutus, cyclamen, Persian ironwood) stay in the private export; they are not lost, but there is no plant record to hold them.

## 7. Plant-to-plant relations from the survey

Fifteen `co_listed` relations: every pair of database plants named in the same d1 list, mutual, source = the respondent, L0, confidence 0.5, context naming the rest of the list. They are *direct* relations in the graph (kg status documented) and say only that one designer thinks of the two together; the text and note on each say so. Densest: r07's list (katsura, Douglas-fir, Pacific dogwood, salal, kinnikinnick → 6 pairs among the four in the database); kinnikinnick–katsura is listed by two respondents (r06, r07). Co-listing never promotes a pair to *companion*; the one source-named companion (sword fern with evergreen huckleberry, Great Plant Picks) and the twenty rule-derived habitat co-occurrences (E-Flora, REL-R1) are kept as separate relation records with their own status. r07's c4 answer — "usually it's how well it works with other plants that I've chosen" — is the knowledge the database still has least of.

## 8. Schema assessment and knowledge priorities — the gap matrix

| knowledge designers asked for | schema today | data for the ten plants | verdict |
|---|---|---|---|
| hardiness, light, water, height, spread (c1) | gate / compare fields, three hardiness scales | 2–6 sources per plant | expressed; conflicts kept |
| invasive status (c1, 8/11 must-pass) | gate `invasive_status` | ISCBC listing check for all ten | expressed; one source only (absence of listing) |
| maintenance (c1, nobody ignores) | gate `maintenance_level` | 1–2 sources; missing for salal | expressed; thin and often inferred from pruning advice |
| seasonal appearance (c1 6/11) | `seasonal_interest` object | every plant, 2–5 sources; iNaturalist phenology for 6 | expressed; no key for scent or stem colour |
| real mature size under local conditions (c2 6/14) | `local_mature_size` | City of Vancouver height classes for the 3 trees only | expressed; no local data for shrubs, ferns, perennials |
| long-term performance (c2 7/14) | `long_term_performance` | 1–3 notes per plant (MOBOT, GPP, USDA, survey) | expressed; practitioner notes are the intended source and there are five |
| behaviour alongside other plants (c2 6/14, c4) | `behaviour_with_others` + `relations.json` | 41 relations, 4 kinds | expressed; direct evidence is co-listing only |
| local availability and cost (c2 8/14) | `local_availability` slot | none | field exists; no licensed source |
| toxicity to pets, by part and organism (c4, e2) | `toxicity` {pets, humans, parts, usda_rating} | USDA rating only | field exists; no tier-B source (D1) |
| photoperiod (c4) | `photoperiod` | none | field exists; no source |
| appearance by age and season (c2 1/14) | `appearance_by_age_season` | none | field exists; low demand |
| climate-change adaptability / future climate (e2 r11) | — | — | **missing**; candidate extended field |
| successional role (e1 r11) | — | — | **missing**; relates to time to size |
| pest management / how to treat (c4 r12) | — | — | out of scope: management knowledge, not a plant attribute |
| cultivar variants and their climate fit (c4 r08) | claim `cultivar` | Japanese maple (4 groups), kinnikinnick 'Vancouver Jade', red osier 'Baileyi' | expressed; coverage thin |
| edible for humans (e1 r12) | ontology `fruit:edible` via `seasonal_interest.fruit` | salal, huckleberry | partial; candidate extended field |
| design concept entry ("fits my concept", "structural", "zen") | ontology Z (layers, spatial, composition, roles) | 33 derived + 42 candidate design links | expressed as rules; composition patterns reach no plant |
| site situation × function ("works well in xxx situation and provide xxx functions") | gate → rank route; `kg_query.py` | 19/19 verbatim queries answered with sources | expressed |

**Decision.** No schema restructuring. Two minimal, backward-compatible changes were made because the data needed them (basis `mixed`; `survey_respondents`). Two candidate extended fields are proposed, not added: `climate_adaptability` and `edible_for_humans` (no licensed source yet, so the fields would be empty). The intent map gained 10 mapped terms (drought resistant, non-invasive, structural, medicinal, aquatic, food producing, supports biodiversity, visually interesting, Japanese-garden atmosphere, privacy hedge / CPTED) and 9 unmapped items that name the gaps.

**Retrieval priorities that follow:** (1) gate on invasive status, hardiness, maintenance; (2) rank by seasonal interest and site match; (3) always show the source, the place a figure comes from, and whether a local record or a first-hand note exists; (4) say plainly when the answer is "no source" — toxicity, availability, photoperiod, climate adaptability.
