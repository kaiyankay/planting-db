# Walkthrough — five minutes in the Neural Cosmos

Start: `cd planting-db && python3 -m http.server 8766`, open <http://localhost:8766/brain/>, wait ~5 s for the layout to settle and the camera to pull back. Every step below was run in the built-in browser on 2026-10-30; screenshots are in `screenshots/`.

**0:00 — arrive.** Three clusters in a dark space (`01-overview-three-clusters.jpg`). Notice: each plant has a different ring of satellites. *Acer palmatum* has the brightest points (the green, verified City of Vancouver claims); the two shrubs are mostly dim blue (database claims, none verified yet — decision D5). Faint dashed rings are empty gate or extended fields. The stats line at top-left comes from the files: 165 claims, 154 live, 25 verified, 12 sources, 6 relations.

**0:30 — fly.** Drag to orbit, wheel to zoom. Click *Acer palmatum* (`02-plant-acer-palmatum-focus.jpg`). The other two clusters recede; the panel lists its 24 fields with claim counts, verified share and "values differ" where sources disagree, then the 6 empty ones with the sources that were meant to fill them. Notice `ecological value · no sourced claim` and `toxicity` with only a retired ASPCA record — two of the gaps the brief asks you to find.

## Discovery (C1) — 1:00

**1:00 — open `mature height` on *Acer palmatum*** (`03-field-acer-mature-height-disagreement.jpg`). Six claims open around the field, each labelled with its value and context: species ranges from MOBOT, RHS and OSU, then 'Osakazuki' 2.5–4 m (RHS) next to 'Osakazuki' 6.1 m (GPP), and 'Bloodgood' 2.5–4 m. The grey wire sphere is the retired model placeholder. Notice the panel line "Quantitative values across sources span 2.5–8 m. They are kept side by side, never merged." Click the GPP point, then the RHS 'Osakazuki' point: same cultivar, same field, 2 m apart, both unverified, both confidence 0.85 — the ranking does not resolve this; a reviewer must.

**1:45 — the local measurement.** Click `local mature size` on the same plant: the Vancouver inventory's height-class midpoints and trunk diameters per cultivar (verified, green). Notice that the city's 'Osakazuki' median height class is 4.6 m — between the two literature values.

**2:15 — salal shade.** Click the background to clear, click *Gaultheria shallon*, open `exposure` (`04-claim-usda-shade-tolerance-low.jpg` after clicking the USDA point). Four sources: three say shade, USDA PLANTS says `Full sun` only (its "Shade Tolerance: Low"). Notice the confidence 0.55 and the note explaining that it was kept side by side rather than dropped.

**2:45 — the two shrubs.** Zoom out; between *Vaccinium* and *Gaultheria* run three curved links. Click the solid orange one (`05-relation-survey-co-listed.jpg`): the only verified relation in the store is one respondent listing them together — completeness L0, not citable. Click the blue one: E-Flora habitat overlap, unverified, derived from two `vancouver_context` claims (links in the panel). The dashed grey one is the `competes` placeholder with its four supporting claims. Notice: shared habitat is sourced; the direct design relation is still one person's list.

## Growth (C2) — 3:15

**3:15 — add an observation.** "Add observation" → type `salal in my North Van garden stays under 60 cm in full sun`. Notice the detector line: plant *gaultheria-shallon*, field `mature_height`, value `{max: 0.6, unit: m}`, exposure `Full sun`. Choose basis "observed on site", location "North Vancouver", click "Add as candidate" (`06-candidate-arrived-salal-height.jpg`).

**3:45 — watch it arrive.** A magenta point grows out of the `mature height` field, a "you (candidate)" source appears, particles run plant → field → candidate → you. The panel shows it as a claim with `practitioner_meta` completeness L2 and `citable: false`, and under "Against existing claims": `within` OSU's full-sun value (≤ 0.6 m), `below` OSU's shade value (1.2–3 m), `below` RHS, E-Flora and USDA. The sun/shade pair that was one source's two contexts is now the thing your observation sits between. Reload the page: the candidate is still there (this browser only). "Reset session" removes it.

## Question (C3) — 4:15

**4:15 — ask.** "Ask" → click the button *shade-tolerant evergreen perennial for a north-facing roof garden, accessible* (`07-retrieval-preview-roof-garden-query.jpg`). Notice the banner RETRIEVAL PREVIEW — NOT A FULL AI TRACE. The drawer shows: five intents recognised (shade-tolerant → exposure, evergreen → seasonal_interest.evergreen, perennial → kpu_plant_type, roof garden → landscape_use, accessible → custom); the gate table per plant (*Acer*: evergreen unknown, roof garden unknown; both shrubs pass everything); 36 claims recalled by BM25; answer order by R5 with the rank key printed under each line — a practitioner claim from survey-r03 ranks first because practitioner > database and Vancouver > PNW, before any higher-confidence database claim; 4 L0 claims withheld. In the cosmos the three clusters stay lit, the cited fields open, and particles flow along the cited paths.

**4:45 — the Δ.** Type `how tall does salal get in full sun` and Run (`08-retrieval-preview-salal-with-candidate-delta.jpg`). Only *Gaultheria* lights up (name route). At the bottom of the result: "Candidates recalled (unverified user input)" lists your observation, and the Δ line says it was recalled, flagged, never cited, ranked after every sourced claim. Click "Clear lights", then "Reset view".

## Steps you cannot experience yet (marked, not skipped)

- The query buttons carry *proxy* wordings reconstructed from `intent_map.json`; the verbatim survey sentences arrive with T4 (export blocked: see `report-2026-10-31.md`).
- No model composes an answer; what you see is retrieval order and attribution strings, which is why the banner says preview.
- The two shrubs' `local mature size` and *Acer*'s `ecological value` / `toxicity` stay empty rings; filling them is review and sourcing work, not a demo feature.
- Review itself (marking verified / disputed) is not in the demo by design; the dim rings remind you that 129 claims are waiting in `review/`.
