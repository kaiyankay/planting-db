# Review: *Gaultheria shallon* — 43 unverified claims on 19 fields · 2026-10-29

Grouped by field; every live claim on the field is shown (verified ones too) so values can be compared side by side. Tick the id to keep as verified, strike it to reject. Then:

```bash
python3 -I tools/verify_claims.py plants/gaultheria-shallon.json --by Kay <ids…>     # or --source rhs
```

Values are structured only; `text` was written from the value, never copied. *mapping* flags where a source term was forced into the KPU vocabulary.
KPU (tier C) is linked from the entity only; none of its values are stored, even where its page shows a figure that disagrees with the sources below (D2).

## Sources in this review

- **E-Flora BC: Electronic Atlas of the Flora of British Columbia** (`eflora`, tier B, checked 2026-10-29): Home page (linnet.geog.ubc.ca/biodiversity/eflora/, 2026-10-29): 'All content on E-Flora BC is covered by Canadian Copyright Law.' Photographs: 'adherence to copyright law is the responsibility of the photographer' — 'Co…
- **iNaturalist observations** (`inat`, tier B (provisional — Kay to open the terms page in a normal browser and confirm), checked 2026-10-29): Site terms page (inaturalist.org/pages/terms) could not be read on 2026-10-29: Cloudflare bot check blocked both WebFetch and the built-in browser. Recorded instead: (1) api.inaturalist.org swagger info.description — pub…
- **Invasive Species Council of BC** (`iscbc`, tier B, checked 2026-10-29): No terms of use. Footer: '© 2023 Invasive Species Council of BC. All rights reserved.' Only a privacy policy PDF is linked (Policy 304, Feb 2019).
- **Oregon State University Landscape Plants** (`osu`, tier B, checked 2026-10-29): No terms of use published. Footer: 'Copyright ©2026 Oregon State University'; oregonstate.edu/copyright is a DMCA notice page only. Site is a Dept. of Horticulture teaching resource with a references page.
- **Royal Horticultural Society — Plants (plant profiles)** (`rhs`, tier B, checked 2026-10-29): No site-wide terms page found (2026-10-29); rhs.org.uk/terms-and-conditions redirects to ChatBotanist terms. Section-specific terms (VLE, heritage catalogue) state RHS owns copyright in site content and bar copying excep…
- **USDA PLANTS Database** (`usda_plants`, tier A, checked 2026-10-29): USDA Policies and Links (usda.gov/about-usda/policies-and-links, 2026-10-29): 'Most information presented on the USDA Web site is considered public domain information. Public domain information may be freely distributed …

## gate

### hardiness_zone

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:hardiness_zone:osu01` | Oregon State University Landscape Plants | {"usda_min": 6, "unit": "USDA"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `gaultheria-shallon:hardiness_zone:rhs01` | Royal Horticultural Society | {"rating": "H5", "unit": "RHS", "approx_min_c": -15, "approx_max_c": -10} | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `gaultheria-shallon:hardiness_zone:osu01` — Oregon State University: hardy to USDA zone 6.
- `gaultheria-shallon:hardiness_zone:rhs01` — RHS rates Gaultheria shallon hardiness H5 (cold winter, about -15 to -10 °C).

### invasive_status

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:invasive_status:iscbc01` | Invasive Species Council of BC | "not_listed" | 0.9 | BC; ISCBC online species profiles |  |

- `gaultheria-shallon:invasive_status:iscbc01` — Gaultheria shallon is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.

### water_drainage

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:water_drainage:rhs01` | Royal Horticultural Society | "average" | 0.75 | species; RHS plant profile, UK growing conditions | → average |
| [ ] `gaultheria-shallon:water_drainage:usdaplants01` | USDA PLANTS Database | "moist" | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `gaultheria-shallon:water_drainage:rhs01` — RHS: moist but well-drained to well-drained.
- `gaultheria-shallon:water_drainage:usdaplants01` — USDA PLANTS: moisture use high, drought tolerance low.

### mature_height

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:mature_height:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"typical_max_m": 1.5, "occasional_max_m": 3, "unit": "m"} | 0.85 | BC; E-Flora BC atlas page |  |
| [ ] `gaultheria-shallon:mature_height:osu01` | Oregon State University Landscape Plants | {"max": 0.6, "unit": "m", "raw": "under 2 ft"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley;  | same source gives 1.2–3 m in shade on good soil — site-dependent height, two claims kept (R1) |
| [ ] `gaultheria-shallon:mature_height:osu02` | Oregon State University Landscape Plants | {"min": 1.2, "max": 3, "unit": "m", "raw": "4–10 ft"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley;  | OSU: spread nearly equal to height (no separate spread figure — folded in here because mature_spread takes numbers or bins only) |
| [ ] `gaultheria-shallon:mature_height:rhs01` | Royal Horticultural Society | {"min": 1, "max": 1.5, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `gaultheria-shallon:mature_height:usdaplants01` | USDA PLANTS Database | {"height_m": 1.8, "unit": "m", "raw": "6 ft mature; 1 ft maximum at 20 years"} | 0.6 | USDA PLANTS characteristics, US-wide conservation plant data | the 20-year figure contradicts the mature figure; recorded as given, low confidence |

- `gaultheria-shallon:mature_height:eflora01` — E-Flora BC: creeping to erect shrub, typically to 1.5 m, occasionally 3 m.
- `gaultheria-shallon:mature_height:osu01` — Oregon State University: under 2 ft (0.6 m) in full sun on poor soil.
- `gaultheria-shallon:mature_height:osu02` — Oregon State University: 4–10 ft (1.2–3 m) in shade on good soil.
- `gaultheria-shallon:mature_height:rhs01` — RHS gives Gaultheria shallon an ultimate height of 1–1.5 m.
- `gaultheria-shallon:mature_height:usdaplants01` — USDA PLANTS gives a mature height of 6 ft (1.8 m), while listing only 1 ft at 20 years.

### mature_spread

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:mature_spread:rhs01` | Royal Horticultural Society | {"min": 0.5, "max": 1, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions | per plant; the species suckers into colonies (see behaviour_with_others) |

- `gaultheria-shallon:mature_spread:rhs01` — RHS gives Gaultheria shallon an ultimate spread of 0.5–1 m.

### ecological_value

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:ecological_value:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["native"] | 0.9 | BC; E-Flora BC atlas page |  |
| [ ] `gaultheria-shallon:ecological_value:osu01` | Oregon State University Landscape Plants | ["native", "bird_food"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `gaultheria-shallon:ecological_value:usdaplants01` | USDA PLANTS Database | ["native"] | 0.8 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `gaultheria-shallon:ecological_value:eflora01` — E-Flora BC lists Gaultheria shallon as native to BC (provincial list Yellow, rank S5, secure).
- `gaultheria-shallon:ecological_value:osu01` — Oregon State University: native to western North America (Alaska to California); fruit taken by birds.
- `gaultheria-shallon:ecological_value:usdaplants01` — USDA PLANTS: native in Alaska, Canada and the lower 48 states.

## compare

### exposure

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:exposure:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["Filtered shade", "Deep shade", "Part sun/part shade"] | 0.7 | BC; E-Flora BC atlas page; inferred from habitat classes, not a cultiv | exposure read off habitat classes |
| [ ] `gaultheria-shallon:exposure:osu01` | Oregon State University Landscape Plants | ["Full sun", "Part sun/part shade"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `gaultheria-shallon:exposure:rhs01` | Royal Horticultural Society | ["Deep shade", "Part sun/part shade", "Sheltered"] | 0.85 | species; RHS plant profile, UK growing conditions | KPU has no 'Exposed' value; RHS 'full shade' → Deep shade |
| [ ] `gaultheria-shallon:exposure:usdaplants01` | USDA PLANTS Database | ["Full sun"] | 0.55 | USDA PLANTS characteristics, US-wide conservation plant data | 'Shade Tolerance: Low' contradicts RHS, OSU and E-Flora (shade); kept side by side at low confidence |

- `gaultheria-shallon:exposure:eflora01` — E-Flora BC habitat records include shaded understory and open-canopy coniferous forest.
- `gaultheria-shallon:exposure:osu01` — Oregon State University: sun or part shade.
- `gaultheria-shallon:exposure:rhs01` — RHS: full or partial shade; exposed or sheltered sites; any aspect.
- `gaultheria-shallon:exposure:usdaplants01` — USDA PLANTS rates shade tolerance low.

### seasonal_interest

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r03 | {"evergreen": true} | 0.7 | Metro Vancouver (survey d1 'why') |  |
| [ ] `gaultheria-shallon:seasonal_interest:inat03` | iNaturalist observations | {"flowering_months": [5, 6, 7], "annotated_n": 129, "share_threshold": 0.1} | 0.5 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | month included when >= 10% of annotated observations; annotations are volunteer-made |
| [ ] `gaultheria-shallon:seasonal_interest:inat04` | iNaturalist observations | {"fruiting_months": [7, 8, 9], "annotated_n": 96, "share_threshold": 0.1} | 0.5 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | month included when >= 10% of annotated observations; annotations are volunteer-made |
| [ ] `gaultheria-shallon:seasonal_interest:osu01` | Oregon State University Landscape Plants | {"flower_colour": ["White", "Pink"], "flowering_months": [5, 6], "foliage_colour": ["Gr… | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley | 'late spring' → months 5–6 |
| [ ] `gaultheria-shallon:seasonal_interest:rhs01` | Royal Horticultural Society | {"flower_colour": ["Pink", "White"], "flowering_months": [6], "foliage_colour": ["Green… | 0.85 | species; RHS plant profile, UK growing conditions | 'early summer' → month 6 |
| [ ] `gaultheria-shallon:seasonal_interest:usdaplants01` | USDA PLANTS Database | {"flower_colour": ["White"], "flowering_months": [4, 5], "foliage_colour": ["Green"], "… | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data | 'Mid Spring' → months 4–5 |

- `gaultheria-shallon:seasonal_interest:inat03` — iNaturalist phenology annotations in Greater Vancouver (n=129) put flowering mainly in months 5, 6, 7.
- `gaultheria-shallon:seasonal_interest:inat04` — iNaturalist phenology annotations in Greater Vancouver (n=96) put fruiting mainly in months 7, 8, 9.
- `gaultheria-shallon:seasonal_interest:osu01` — Oregon State University: evergreen glossy leaves; white or pinkish urn flowers in late spring; black edible fruit in summer.
- `gaultheria-shallon:seasonal_interest:rhs01` — RHS: evergreen; light pink and white flowers in early summer; dark purple fruit ripening late summer.
- `gaultheria-shallon:seasonal_interest:usdaplants01` — USDA PLANTS: conspicuous white flowers mid spring, abundant purple fruit summer to fall, leaves retained.

### habit

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:habit:osu01` | Oregon State University Landscape Plants | "Dense" | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `gaultheria-shallon:habit:rhs01` | Royal Horticultural Society | "Spreading" | 0.8 | species; RHS plant profile, UK growing conditions | 'Suckering' → Spreading |

- `gaultheria-shallon:habit:osu01` — Oregon State University: dense, erect-branched shrub.
- `gaultheria-shallon:habit:rhs01` — RHS: suckering habit.

### soil_type

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:soil_type:osu01` | Oregon State University Landscape Plants | ["Acidic"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `gaultheria-shallon:soil_type:rhs01` | Royal Horticultural Society | ["Well-drained"] | 0.8 | species; RHS plant profile, UK growing conditions | clay/loam/sand have no KPU class; acid-or-neutral not mapped to Acidic |
| [ ] `gaultheria-shallon:soil_type:usdaplants01` | USDA PLANTS Database | ["Acidic"] | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `gaultheria-shallon:soil_type:osu01` — Oregon State University: acid soil.
- `gaultheria-shallon:soil_type:rhs01` — RHS: well-drained clay, loam or sand; acid or neutral.
- `gaultheria-shallon:soil_type:usdaplants01` — USDA PLANTS: pH 5.5–7.0, adapted to coarse, medium and fine soils.

### growth_rate

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:growth_rate:usdaplants01` | USDA PLANTS Database | "fast" | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | disagrees with the common 'slow to establish' experience; kept (R1) |

- `gaultheria-shallon:growth_rate:usdaplants01` — USDA PLANTS rates growth rate rapid.

### landscape_use

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r03 | ["Ground cover"] | 0.7 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| [ ] `gaultheria-shallon:landscape_use:osu01` | Oregon State University Landscape Plants | ["Cut flower or foliage"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `gaultheria-shallon:landscape_use:rhs01` | Royal Horticultural Society | ["Rock garden", "Container planting", "Erosion control", "Cut flower or foliage", "Mixe… | 0.8 | species; RHS plant profile, UK growing conditions | 'banks and slopes' → Erosion control; 'edible fruit' → Urban agriculture |
| [ ] `gaultheria-shallon:landscape_use:usdaplants01` | USDA PLANTS Database | ["Sheared hedge"] | 0.6 | USDA PLANTS characteristics, US-wide conservation plant data | 'Hedge Tolerance: High' → Sheared hedge, loose |

- `gaultheria-shallon:landscape_use:osu01` — Oregon State University: foliage sold in the florist trade as 'lemon leaves'.
- `gaultheria-shallon:landscape_use:rhs01` — RHS suggests cottage, gravel and rock gardens, city gardens, containers, banks and slopes, cut foliage, borders and edible fruit.
- `gaultheria-shallon:landscape_use:usdaplants01` — USDA PLANTS rates hedge tolerance high.

### pest_susceptibility

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:pest_susceptibility:rhs01` | Royal Horticultural Society | ["Root rot"] | 0.6 | species; RHS plant profile, UK growing conditions | honey fungus (Armillaria) mapped to Root rot — loose |

- `gaultheria-shallon:pest_susceptibility:rhs01` — RHS: may be susceptible to honey fungus.

### resistances

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:resistances:rhs01` | Royal Horticultural Society | ["pests"] | 0.8 | species; RHS plant profile, UK growing conditions |  |

- `gaultheria-shallon:resistances:rhs01` — RHS: generally pest-free.

## extended

### time_to_intended_size

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:time_to_intended_size:rhs01` | Royal Horticultural Society | {"min": 5, "max": 10, "unit": "years", "measure": "time to ultimate height"} | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `gaultheria-shallon:time_to_intended_size:rhs01` — RHS gives Gaultheria shallon 5–10 years to reach its ultimate height.

### long_term_performance

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:long_term_performance:osu01` | Oregon State University Landscape Plants | {"frost_sensitivity": "high", "transplanting": "difficult"} | 0.65 | species; Oregon State University Landscape Plants, Willamette Valley | 'frost sensitivity: high' is surprising for a zone-6 native; kept as stated, low confidence |

- `gaultheria-shallon:long_term_performance:osu01` — Oregon State University flags high frost sensitivity and difficult transplanting.

### behaviour_with_others

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:behaviour_with_others:osu01` | Oregon State University Landscape Plants | {"spread": "forms thickets", "companions": ["Rhododendron", "ferns"], "transplanting": … | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `gaultheria-shallon:behaviour_with_others:rhs01` | Royal Horticultural Society | {"spread": "suckering; spreads by underground stems"} | 0.8 | species; RHS plant profile, UK growing conditions |  |
| [ ] `gaultheria-shallon:behaviour_with_others:usdaplants01` | USDA PLANTS Database | {"growth_form": "rhizomatous", "resprout": true, "coppice": true, "fire_tolerance": "hi… | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `gaultheria-shallon:behaviour_with_others:osu01` — Oregon State University: forms thickets; listed companions are rhododendrons and ferns; difficult to transplant.
- `gaultheria-shallon:behaviour_with_others:rhs01` — RHS records a suckering habit: the plant spreads by underground stems into colonies.
- `gaultheria-shallon:behaviour_with_others:usdaplants01` — USDA PLANTS: rhizomatous growth form, resprouts and coppices, high fire tolerance.

### toxicity

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:toxicity:usdaplants01` | USDA PLANTS Database | {"humans": "none"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | humans/livestock characteristic; pets stay unknown (D1) |

- `gaultheria-shallon:toxicity:usdaplants01` — USDA PLANTS lists toxicity as none.

### vancouver_context

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaultheria-shallon:vancouver_context:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"habitat": ["forest", "bog", "dry to wet", "lowland", "montane", "coastal", "open-cano… | 0.9 | BC; E-Flora BC atlas page |  |
| [ ] `gaultheria-shallon:vancouver_context:inat01` | iNaturalist observations | {"licensed_verifiable_observations": 5382, "research_grade": 5214, "all_licences": 6807… | 0.6 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | presence evidence; observation counts reflect observer effort as much as abundance |
| [ ] `gaultheria-shallon:vancouver_context:inat02` | iNaturalist observations | {"observations_by_month": {"1": 356, "2": 250, "3": 479, "4": 1009, "5": 469, "6": 477,… | 0.55 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | observer effort, not plant activity — the plant is evergreen/visible year-round; use for 'when people notice it', not phenology |

- `gaultheria-shallon:vancouver_context:eflora01` — E-Flora BC: common in western BC from dry to wet forest, bog, cutover and shaded understory at low to montane elevations, mostly in the Coastal Western Hemlock zone.
- `gaultheria-shallon:vancouver_context:inat01` — iNaturalist holds 5382 openly licensed verifiable observations of this plant in Greater Vancouver (5214 research grade), recorded 1998–2026.
- `gaultheria-shallon:vancouver_context:inat02` — Monthly spread of 5382 Greater Vancouver observations: most in 4, 9, 3 (month numbers).
