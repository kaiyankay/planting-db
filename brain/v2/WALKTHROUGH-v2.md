# Walkthrough — five minutes in the Neural Cosmos v2

Start: `cd planting-db && python3 -m http.server 8766`, open <http://localhost:8766/brain/>. Every step below was run in the built-in browser on 2026-10-30 at 1280 × 820; screenshots are in `screenshots/v2/`. v1 is at `/brain/v1/` if you want to compare.

**0:00 — arrive** (`01-cosmos-three-plants-six-domains.jpg`). Three plants, each ringed by six knowledge domains. Read a glyph: the arc says how many of the domain's fields have a source, the glow how much is verified, the colour who supplied most of it. *Acer palmatum*'s Size & growth and Ecology & local record glow green — City of Vancouver measurements, the only verified blocks of any size. Amber arcs: values that change with conditions. Red arcs: values that differ under the same stated condition. The panel offers the same three entries — a plant, a source, or a question — and "Continue" already points at the domains where sources pull apart.

**0:30 — a plant** (`02-plant-gaultheria-domains.jpg`). Click *Gaultheria shallon*. The other plants recede; its ring opens: Size & growth 5/8 fields, 10 claims, 0 % verified, one field where values differ plus one that varies with conditions; Site & climate 4/5 fields, two fields where values differ; Seasons & appearance 1/2 with a verified reading (survey respondent 03). "Where sources pull apart" lists `mature height` and `exposure`.

## Explore — 1:00

**1:00 — a domain unfolds** (`03-domain-size-growth-unfolded.jpg`). Click Size & growth. Eight fields fan out as glyphs with a status word under each: `mature height` *values differ + varies with conditions · 4 sources*; `habit` *several readings*; `mature spread`, `growth rate`, `time to intended size` *single source*; `texture`, `form`, `local mature size` dashed rings — gaps, with the sources the fill plan named. "Continue": open mature height.

**1:20 — the lens** (`04-lens-salal-mature-height-by-condition.jpg`). Click `mature height`. The space reorganises into a ruler in metres beside the plant's glow. Three lanes: **condition not stated** — E-Flora BC to 1.5 m (faint tail to the occasional 3 m), USDA PLANTS 1.8 m as a point, RHS 1–1.5 m; **full sun, poor soil** — Oregon State ≤ 0.6 m; **shade, good soil** — Oregon State 1.2–3 m. Every bar is hollow: nothing here is verified. Read the panel sentence: across conditions the values follow the stated growing condition, not a contradiction; within the "no condition" lane RHS and USDA do not overlap — a disagreement for a reviewer, not for the ranking. The retired model placeholder is hidden; one click shows it as a dashed bar.

**1:50 — one reading** (`05-claim-osu-full-sun-poor-soil.jpg`). Click Oregon State's ≤ 0.6 m bar (or its label). It stays lit, the rest fade. The panel: source (Oregon State, database, PNW, licence tier B, link), the claim text, context parsed into scope *species* · condition *full sun, poor soil* · region *Willamette Valley, OR* with the raw context under it, status `unverified · awaits a reviewer (D5); ranked, cited with [unverified]`, confidence 0.8, the claim id, and "Related evidence on this field" with a relation word per sibling: `overlaps across conditions` E-Flora, `below, under a different condition` for the 1.2–3 m shade reading. AI use: not cited in any of the 8 test queries.

**2:20 — follow the condition** (`06-lens-salal-exposure-spectrum.jpg`). "Continue" → *see how the 4 sources rate exposure*. A different lens for a different value type: columns are the KPU exposure vocabulary from Full sun to Sheltered, rows are sources. E-Flora, Oregon State and RHS light part shade; USDA PLANTS lights only Full sun. The footer: *USDA PLANTS shares no value with E-Flora BC, RHS* — on this ordinal vocabulary that is a disagreement (PROPOSALS (a) rule 4), which is why the field's word is *values differ*. Click the USDA cell for its note on "Shade Tolerance: Low".

**2:45 — the same mechanism elsewhere** (`07-lens-acer-mature-height-cultivars.jpg`, `08-lens-acer-local-mature-size-vancouver.jpg`). Trail → Cosmos → *Acer palmatum* → Size & growth → `mature height`: lanes are now species / 'Bloodgood' / 'Osakazuki', and Great Plant Picks' 6.1 m point sits against RHS's 2.5–4 m bar for the same cultivar. "Continue" → *compare with measured sizes per cultivar in Vancouver*: `local mature size` shows City of Vancouver distributions (p10–p90 bar, white median tick, n) per cultivar, all solid — verified — with the established-tree subset as a second bar. 'Osakazuki' measures a median 4.6 m in the city, between the two literature values.

**3:15 — a source as the centre** (`09-source-oregon-state-across-plants.jpg`). Click "Oregon State" in any panel. The space reorganises around the source: three plant columns, six domain rows, a dot per field it speaks to, 23 live claims, 0 verified. The chips are clickable — any field opens in its lens. (`10-relations-gaultheria.jpg`: the plant's five recorded relations, with the one verified co-listing — completeness L0, stored but never cited — against four placeholders.)

## Grow — 3:45

**3:45 — add an observation** (`11-grow-candidate-salal-full-sun-what-changed.jpg`). Back at *Gaultheria* → `mature height`, press "Add observation", type *salal in my North Van garden stays under 60 cm in full sun*, basis "observed on site", location "North Vancouver", "Add as candidate". A magenta ≤ 0.6 m bar grows into the ruler in a new **full sun** lane. "What changed": joined Size & growth → mature height beside 5 sourced readings; opened a new condition lane (no source had stated "full sun" alone); `overlaps across conditions` E-Flora and Oregon State's full-sun reading, `below, under a different condition` the rest; flagged — unverified user input, completeness L2, never citable, now in the retrieval corpus. The cosmos glyph for Size & growth gains a magenta dot; the plant label counts one candidate. Reload: it is still there (this browser only). "Reset session" removes it.

## Ask — 4:15

**4:15 — a question lights the space** (`12-ask-roof-garden-activation.jpg`). "Cosmos", then "Ask" → *shade-tolerant evergreen perennial for a north-facing roof garden, accessible*. Banner: RETRIEVAL PREVIEW — NOT A FULL AI TRACE. The drawer: 3 plants after gates, 9 knowledge domains lit, 31 claims in answer order; routes (five intents), the gate table, R5 order with the rank key under each line — a practitioner claim from survey respondent 03 ranks first. In the cosmos the activated domains stay bright and their spokes carry particles; everything else recedes.

**4:45 — the Δ** (`13-ask-salal-full-sun-candidate-delta.jpg`). Type *how tall does salal get in full sun*. Only *Gaultheria* lights (name route). At the bottom of the result: "Candidates recalled (unverified user input)" lists your observation, and the Δ line says it was recalled, flagged, never cited, ranked after every sourced claim. Click it: the lens opens with the candidate lit among the sourced readings.

## Steps you cannot experience yet

- The query buttons are proxy wordings until the survey export (T4) lands.
- No model composes an answer; what you see is retrieval order and attribution strings.
- The dashed rings stay dashed: filling `texture`, `form`, the shrubs' `local mature size` or the maple's `ecological value` is sourcing and review work.
- Review itself (marking verified / disputed) is not in the demo by design; every hollow bar is one of the 129 claims waiting in `review/`.
