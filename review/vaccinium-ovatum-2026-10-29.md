# Review: *Vaccinium ovatum* — 41 unverified claims on 19 fields · 2026-10-29

Grouped by field; every live claim on the field is shown (verified ones too) so values can be compared side by side. Tick the id to keep as verified, strike it to reject. Then:

```bash
python3 -I tools/verify_claims.py plants/vaccinium-ovatum.json --by Kay <ids…>     # or --source rhs
```

Values are structured only; `text` was written from the value, never copied. *mapping* flags where a source term was forced into the KPU vocabulary.
KPU (tier C) is linked from the entity only; none of its values are stored, even where its page shows a figure that disagrees with the sources below (D2).

## Sources in this review

- **E-Flora BC: Electronic Atlas of the Flora of British Columbia** (`eflora`, tier B, checked 2026-10-29): Home page (linnet.geog.ubc.ca/biodiversity/eflora/, 2026-10-29): 'All content on E-Flora BC is covered by Canadian Copyright Law.' Photographs: 'adherence to copyright law is the responsibility of the photographer' — 'Co…
- **Great Plant Picks** (`gpp`, tier B, checked 2026-10-29): No terms page. Footer (greatplantpicks.org, 2026-10-29): 'Text and photos ©2025 Great Plant Picks/Elisabeth Carey Miller Garden except where otherwise noted'. GPP describes itself as 'the primary educational program of t…
- **iNaturalist observations** (`inat`, tier B (provisional — Kay to open the terms page in a normal browser and confirm), checked 2026-10-29): Site terms page (inaturalist.org/pages/terms) could not be read on 2026-10-29: Cloudflare bot check blocked both WebFetch and the built-in browser. Recorded instead: (1) api.inaturalist.org swagger info.description — pub…
- **Invasive Species Council of BC** (`iscbc`, tier B, checked 2026-10-29): No terms of use. Footer: '© 2023 Invasive Species Council of BC. All rights reserved.' Only a privacy policy PDF is linked (Policy 304, Feb 2019).
- **Oregon State University Landscape Plants** (`osu`, tier B, checked 2026-10-29): No terms of use published. Footer: 'Copyright ©2026 Oregon State University'; oregonstate.edu/copyright is a DMCA notice page only. Site is a Dept. of Horticulture teaching resource with a references page.
- **Royal Horticultural Society — Plants (plant profiles)** (`rhs`, tier B, checked 2026-10-29): No site-wide terms page found (2026-10-29); rhs.org.uk/terms-and-conditions redirects to ChatBotanist terms. Section-specific terms (VLE, heritage catalogue) state RHS owns copyright in site content and bar copying excep…
- **USDA PLANTS Database** (`usda_plants`, tier A, checked 2026-10-29): USDA Policies and Links (usda.gov/about-usda/policies-and-links, 2026-10-29): 'Most information presented on the USDA Web site is considered public domain information. Public domain information may be freely distributed …

## gate

### hardiness_zone

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:hardiness_zone:gpp01` | Great Plant Picks | {"min": 7, "max": 9, "unit": "USDA"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `vaccinium-ovatum:hardiness_zone:osu01` | Oregon State University Landscape Plants | {"usda_min": 7, "unit": "USDA"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `vaccinium-ovatum:hardiness_zone:rhs01` | Royal Horticultural Society | {"rating": "H4", "unit": "RHS", "approx_min_c": -10, "approx_max_c": -5} | 0.85 | species; RHS plant profile, UK growing conditions | RHS H-scale; °C band is the RHS definition of H4 |

- `vaccinium-ovatum:hardiness_zone:gpp01` — Great Plant Picks lists Vaccinium ovatum for USDA zones 7 to 9.
- `vaccinium-ovatum:hardiness_zone:osu01` — Oregon State University: hardy to USDA zone 7.
- `vaccinium-ovatum:hardiness_zone:rhs01` — RHS rates Vaccinium ovatum hardiness H4 (average UK winter, about -10 to -5 °C).

### invasive_status

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:invasive_status:iscbc01` | Invasive Species Council of BC | "not_listed" | 0.9 | BC; ISCBC online species profiles |  |

- `vaccinium-ovatum:invasive_status:iscbc01` — Vaccinium ovatum is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.

### water_drainage

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:water_drainage:gpp01` | Great Plant Picks | "average" | 0.75 | species; Great Plant Picks, maritime Pacific Northwest | 'regular watering to drought tolerant' → average; drought tolerance recorded under resistances |
| [ ] `vaccinium-ovatum:water_drainage:rhs01` | Royal Horticultural Society | "moist" | 0.75 | species; RHS plant profile, UK growing conditions | 'moist but well-drained' → moist |

- `vaccinium-ovatum:water_drainage:gpp01` — Great Plant Picks: regular watering to drought tolerant; occasional dry-weather watering improves flowering and fruit.
- `vaccinium-ovatum:water_drainage:rhs01` — RHS: moist but well-drained.

### mature_height

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:mature_height:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"min": 0.5, "max": 3, "unit": "m"} | 0.85 | BC; E-Flora BC atlas page |  |
| [ ] `vaccinium-ovatum:mature_height:gpp01` | Great Plant Picks | {"height_m": 2.44, "unit": "m", "raw": "8 ft"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `vaccinium-ovatum:mature_height:osu01` | Oregon State University Landscape Plants | {"min": 0.9, "max": 1.5, "unit": "m", "raw": "3–5 (8) ft"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `vaccinium-ovatum:mature_height:rhs01` | Royal Horticultural Society | {"min": 1, "max": 1.5, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `vaccinium-ovatum:mature_height:usdaplants01` | USDA PLANTS Database | {"height_m": 2.4, "unit": "m", "raw": "8 ft mature; 8 ft maximum at 20 years"} | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `vaccinium-ovatum:mature_height:eflora01` — E-Flora BC gives Vaccinium ovatum a height of 0.5–3 m.
- `vaccinium-ovatum:mature_height:gpp01` — Great Plant Picks gives Vaccinium ovatum a mature height of 8 ft (2.4 m).
- `vaccinium-ovatum:mature_height:osu01` — Oregon State University gives Vaccinium ovatum a height of 3–5 ft (0.9–1.5 m), occasionally 8 ft (2.4 m).
- `vaccinium-ovatum:mature_height:rhs01` — RHS gives Vaccinium ovatum an ultimate height of 1–1.5 m.
- `vaccinium-ovatum:mature_height:usdaplants01` — USDA PLANTS gives a mature height of 8 ft (2.4 m), reached within 20 years.

### mature_spread

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:mature_spread:gpp01` | Great Plant Picks | {"spread_m": 1.83, "unit": "m", "raw": "6 ft"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `vaccinium-ovatum:mature_spread:rhs01` | Royal Horticultural Society | {"min": 1, "max": 1.5, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `vaccinium-ovatum:mature_spread:gpp01` — Great Plant Picks gives Vaccinium ovatum a mature spread of 6 ft (1.8 m).
- `vaccinium-ovatum:mature_spread:rhs01` — RHS gives Vaccinium ovatum an ultimate spread of 1–1.5 m.

### maintenance_level

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:maintenance_level:gpp01` | Great Plant Picks | "low" | 0.75 | species; Great Plant Picks, maritime Pacific Northwest | 'little pruning needed' → low |

- `vaccinium-ovatum:maintenance_level:gpp01` — Great Plant Picks: little pruning needed.

### ecological_value

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:ecological_value:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["native"] | 0.9 | BC; E-Flora BC atlas page |  |
| [ ] `vaccinium-ovatum:ecological_value:usdaplants01` | USDA PLANTS Database | ["native"] | 0.8 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `vaccinium-ovatum:ecological_value:eflora01` — E-Flora BC lists Vaccinium ovatum as native to BC (provincial list Yellow, rank S5, secure).
- `vaccinium-ovatum:ecological_value:usdaplants01` — USDA PLANTS: native in Canada and the lower 48 states.

## compare

### exposure

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r03 | ["Part sun/part shade", "Filtered shade"] | 0.7 | designer's own project (survey d2); derived from behaviour_with_others |  |
| [ ] `vaccinium-ovatum:exposure:gpp01` | Great Plant Picks | ["Full sun", "Part sun/part shade", "Filtered shade", "Deep shade"] | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `vaccinium-ovatum:exposure:osu01` | Oregon State University Landscape Plants | ["Full sun", "Part sun/part shade"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `vaccinium-ovatum:exposure:rhs01` | Royal Horticultural Society | ["Full sun", "Part sun/part shade", "Sheltered"] | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `vaccinium-ovatum:exposure:usdaplants01` | USDA PLANTS Database | ["Full sun"] | 0.6 | USDA PLANTS characteristics, US-wide conservation plant data | 'Shade Tolerance: Low' mapped to Full sun; disagrees with GPP (deep shade) and the designer's note — kept side by side (R1) |

- `vaccinium-ovatum:exposure:gpp01` — Great Plant Picks: full sun to deep shade; flowering and fruiting may stop in deep shade.
- `vaccinium-ovatum:exposure:osu01` — Oregon State University: sun to part shade.
- `vaccinium-ovatum:exposure:rhs01` — RHS: full sun or partial shade, sheltered.
- `vaccinium-ovatum:exposure:usdaplants01` — USDA PLANTS rates shade tolerance low.

### seasonal_interest

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r03 | {"evergreen": true} | 0.7 | Metro Vancouver (survey d1 'why') |  |
| [ ] `vaccinium-ovatum:seasonal_interest:gpp01` | Great Plant Picks | {"flower_colour": ["White"], "foliage_colour": ["Bronze", "Green"], "fruit": "blue-blac… | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `vaccinium-ovatum:seasonal_interest:osu01` | Oregon State University Landscape Plants | {"flower_colour": ["Pink"], "foliage_colour": ["Green"], "fruit": "red at first, blue-b… | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `vaccinium-ovatum:seasonal_interest:rhs01` | Royal Horticultural Society | {"flower_colour": ["Pink"], "foliage_colour": ["Green"], "fall_colour": false, "fruit":… | 0.85 | species; RHS plant profile, UK growing conditions | 'pale pink' → Pink; spring not mapped to months |
| [ ] `vaccinium-ovatum:seasonal_interest:usdaplants01` | USDA PLANTS Database | {"flower_colour": ["White"], "flowering_months": [5, 6], "foliage_colour": ["Green"], "… | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data | 'Late Spring' → months 5–6 |

- `vaccinium-ovatum:seasonal_interest:gpp01` — Great Plant Picks: copper-bronze spring foliage maturing dark green; small white urn flowers in spring; blue-black berries by late summer.
- `vaccinium-ovatum:seasonal_interest:osu01` — Oregon State University: evergreen glossy dark green leaves on reddish stems; pale pink urn-shaped flowers in spring; edible fruit red then blue-black by late summer.
- `vaccinium-ovatum:seasonal_interest:rhs01` — RHS: evergreen; pale pink urn-shaped flowers in spring; fruit red turning blue-black.
- `vaccinium-ovatum:seasonal_interest:usdaplants01` — USDA PLANTS: white flowers in late spring, conspicuous purple fruit in summer, leaves retained.

### texture

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:texture:gpp01` | Great Plant Picks | "Fine" | 0.8 | species; Great Plant Picks, maritime Pacific Northwest |  |

- `vaccinium-ovatum:texture:gpp01` — Great Plant Picks describes the small leaves as giving a fine texture.

### habit

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:habit:osu01` | Oregon State University Landscape Plants | "Upright" | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | 'erect, compact' → Upright |

- `vaccinium-ovatum:habit:osu01` — Oregon State University: neat, erect, generally compact habit, sometimes with long erratic shoots.

### soil_type

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:soil_type:gpp01` | Great Plant Picks | ["Well-drained"] | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `vaccinium-ovatum:soil_type:rhs01` | Royal Horticultural Society | ["Acidic", "Well-drained"] | 0.8 | species; RHS plant profile, UK growing conditions | loam/sand have no KPU class |

- `vaccinium-ovatum:soil_type:gpp01` — Great Plant Picks: well-drained or sandy soil; tolerates clay if drainage is adequate.
- `vaccinium-ovatum:soil_type:rhs01` — RHS: acid, moist but well-drained loam or sand.

### growth_rate

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:growth_rate:usdaplants01` | USDA PLANTS Database | "slow" | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `vaccinium-ovatum:growth_rate:usdaplants01` — USDA PLANTS rates growth rate slow.

### landscape_use

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r03 | ["Hedge row"] | 0.7 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| [ ] `vaccinium-ovatum:landscape_use:gpp01` | Great Plant Picks | ["Group or mass planting", "Screening", "Sheared hedge", "Native planting"] | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `vaccinium-ovatum:landscape_use:osu01` | Oregon State University Landscape Plants | ["Cut flower or foliage"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `vaccinium-ovatum:landscape_use:rhs01` | Royal Horticultural Society | ["Container planting", "Small garden/space", "Mixed shrub border", "Urban agriculture"] | 0.8 | species; RHS plant profile, UK growing conditions | RHS garden types mapped to KPU uses; 'edible fruit' → Urban agriculture |

- `vaccinium-ovatum:landscape_use:gpp01` — Great Plant Picks: informal groupings, natural low screen, shears into a dense formal hedge; a Pacific Northwest native.
- `vaccinium-ovatum:landscape_use:osu01` — Oregon State University notes use of the foliage in the florist industry.
- `vaccinium-ovatum:landscape_use:rhs01` — RHS suggests city and courtyard gardens, cottage gardens, patio containers, shrub borders and edible fruit.

### pest_susceptibility

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:pest_susceptibility:rhs01` | Royal Horticultural Society | ["Beetles or weevils", "Mildew", "Root rot", "Abiotic disorder"] | 0.8 | species; RHS plant profile, UK growing conditions | birds, honey fungus have no KPU value; chlorosis → Abiotic disorder |

- `vaccinium-ovatum:pest_susceptibility:rhs01` — RHS lists vine weevil larvae and birds as pests; honey fungus (rare), powdery mildew, root rot and chlorosis as problems.

### resistances

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:resistances:gpp01` | Great Plant Picks | ["drought"] | 0.8 | species; Great Plant Picks, maritime Pacific Northwest; once establish |  |
| [ ] `vaccinium-ovatum:resistances:usdaplants01` | USDA PLANTS Database | ["drought"] | 0.6 | USDA PLANTS characteristics, US-wide conservation plant data | 'Drought Tolerance: Medium' — borderline; recorded at low confidence |

- `vaccinium-ovatum:resistances:gpp01` — Great Plant Picks: drought tolerant once established.
- `vaccinium-ovatum:resistances:usdaplants01` — USDA PLANTS rates drought tolerance medium and moisture use low.

## extended

### time_to_intended_size

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:time_to_intended_size:gpp01` | Great Plant Picks | {"years": 10, "height_m": 1.83, "spread_m": 1.22, "unit": "m at 10 years"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `vaccinium-ovatum:time_to_intended_size:rhs01` | Royal Horticultural Society | {"min": 10, "max": 20, "unit": "years", "measure": "time to ultimate height"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `vaccinium-ovatum:time_to_intended_size:usdaplants01` | USDA PLANTS Database | {"years": 20, "height_m": 2.4, "unit": "m at 20 years"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `vaccinium-ovatum:time_to_intended_size:gpp01` — Great Plant Picks gives Vaccinium ovatum a 10-year size of 6 ft tall by 4 ft wide (1.8 × 1.2 m).
- `vaccinium-ovatum:time_to_intended_size:rhs01` — RHS gives Vaccinium ovatum 10–20 years to reach its ultimate height.
- `vaccinium-ovatum:time_to_intended_size:usdaplants01` — USDA PLANTS: maximum height at 20 years 8 ft (2.4 m).

### toxicity

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:toxicity:usdaplants01` | USDA PLANTS Database | {"humans": "none"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | USDA 'Toxicity' characteristic covers humans/livestock, not pets specifically; pets stay unknown (D1) |

- `vaccinium-ovatum:toxicity:usdaplants01` — USDA PLANTS lists toxicity as none.

### vancouver_context

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `vaccinium-ovatum:vancouver_context:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"habitat": ["open forest", "lowland", "montane", "dry to moist", "coastal"], "bgc_zone… | 0.9 | BC; E-Flora BC atlas page | BGC zone list from the atlas station records |
| [ ] `vaccinium-ovatum:vancouver_context:inat01` | iNaturalist observations | {"licensed_verifiable_observations": 29, "research_grade": 24, "all_licences": 33, "yea… | 0.6 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | presence evidence; observation counts reflect observer effort as much as abundance |

- `vaccinium-ovatum:vancouver_context:eflora01` — E-Flora BC: frequent in south-west BC in dry to moist open forest at low to montane elevations, mostly in the Coastal Western Hemlock zone — the zone Vancouver sits in.
- `vaccinium-ovatum:vancouver_context:inat01` — iNaturalist holds 29 openly licensed verifiable observations of this plant in Greater Vancouver (24 research grade), recorded 2017–2026.
