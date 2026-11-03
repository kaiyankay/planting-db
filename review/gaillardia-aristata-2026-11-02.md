# Review: *Gaillardia aristata* — 49 unverified claims on 21 fields · 2026-11-02

Grouped by field; every live claim on the field is shown (verified ones too) so values can be compared side by side. Tick the id to keep as verified, strike it to reject. Then:

```bash
python3 -I tools/verify_claims.py plants/gaillardia-aristata.json --by Kay <ids…>     # or --source rhs
```

Values are structured only; `text` was written from the value, never copied. *mapping* flags where a source term was forced into the KPU vocabulary.
KPU (tier C) is linked from the entity only; none of its values are stored, even where its page shows a figure that disagrees with the sources below (D2).

## Sources in this review

- **E-Flora BC: Electronic Atlas of the Flora of British Columbia** (`eflora`, tier B, checked 2026-10-29): Home page (linnet.geog.ubc.ca/biodiversity/eflora/, 2026-10-29): 'All content on E-Flora BC is covered by Canadian Copyright Law.' Photographs: 'adherence to copyright law is the responsibility of the photographer' — 'Co…
- **iNaturalist observations** (`inat`, tier B, checked 2026-10-29): Site terms page (inaturalist.org/pages/terms) could not be read on 2026-10-29: Cloudflare bot check blocked both WebFetch and the built-in browser. Recorded instead: (1) api.inaturalist.org swagger info.description — pub…
- **Invasive Species Council of BC** (`iscbc`, tier B, checked 2026-10-29): No terms of use. Footer: '© 2023 Invasive Species Council of BC. All rights reserved.' Only a privacy policy PDF is linked (Policy 304, Feb 2019).
- **Missouri Botanical Garden Plant Finder** (`mobot`, tier B, checked 2026-10-29): Conditions of Use (missouribotanicalgarden.org/conditions): texts/images copyrighted; 'may not be used for any commercial purpose without permission'; 'may not be re-published in print or electronic form without permissi…
- **Royal Horticultural Society — Plants (plant profiles)** (`rhs`, tier B, checked 2026-10-29): No site-wide terms page found (2026-10-29); rhs.org.uk/terms-and-conditions redirects to ChatBotanist terms. Section-specific terms (VLE, heritage catalogue) state RHS owns copyright in site content and bar copying excep…
- **USDA PLANTS Database** (`usda_plants`, tier A, checked 2026-10-29): USDA Policies and Links (usda.gov/about-usda/policies-and-links, 2026-10-29): 'Most information presented on the USDA Web site is considered public domain information. Public domain information may be freely distributed …

## gate

### hardiness_zone

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:hardiness_zone:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 3, "max": 8, "unit": "USDA"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `gaillardia-aristata:hardiness_zone:rhs01` | Royal Horticultural Society | {"rating": "H4", "unit": "RHS", "approx_min_c": -10, "approx_max_c": -5} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `gaillardia-aristata:hardiness_zone:usdaplants01` | USDA PLANTS Database | {"min_temperature_f": -33, "min_temperature_c": -36, "unit": "minimum temperature (°F),… | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | a temperature characteristic, not a zone rating; not converted to any zone scale |

- `gaillardia-aristata:hardiness_zone:mobot01` — Missouri Botanical Garden lists Gaillardia aristata for USDA zones 3 to 8.
- `gaillardia-aristata:hardiness_zone:rhs01` — RHS rates Gaillardia aristata hardiness H4 (hardy through most of the UK, about -10 to -5 °C).
- `gaillardia-aristata:hardiness_zone:usdaplants01` — USDA PLANTS gives a minimum temperature of -33 °F (about -36 °C) and at least 100 frost-free days.

### invasive_status

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:invasive_status:iscbc01` | Invasive Species Council of BC | "invasive:not_listed" | 0.9 | BC; ISCBC online species profiles |  |

- `gaillardia-aristata:invasive_status:iscbc01` — Gaillardia aristata is not among the 114 species profiles on the Invasive Species Council of BC 'Find an Invasive Species' list (checked 2026-11-02); it is a BC native.

### water_drainage

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:water_drainage:mobot01` | Missouri Botanical Garden Plant Finder | "water:dry" | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'dry to medium' → dry; 'average' would also fit |
| [ ] `gaillardia-aristata:water_drainage:rhs01` | Royal Horticultural Society | "water:dry" | 0.7 | species; RHS plant profile, UK growing conditions | RHS gives drainage ('well-drained'), not a water regime; with 'drought resistance: yes' mapped to dry — loose; 'average' would also fit |
| [ ] `gaillardia-aristata:water_drainage:usdaplants01` | USDA PLANTS Database | "water:average" | 0.65 | USDA PLANTS characteristics, US-wide conservation plant data | 'Moisture Use: Medium' → average — loose |

- `gaillardia-aristata:water_drainage:mobot01` — Missouri Botanical Garden rates water needs dry to medium.
- `gaillardia-aristata:water_drainage:rhs01` — RHS: well-drained soil; drought resistant.
- `gaillardia-aristata:water_drainage:usdaplants01` — USDA PLANTS rates moisture use medium and drought tolerance medium; no anaerobic (waterlogging) tolerance.

### mature_height

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:mature_height:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"min": 0.2, "max": 0.7, "unit": "m"} | 0.85 | BC; E-Flora BC atlas page |  |
| [ ] `gaillardia-aristata:mature_height:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 0.3, "max": 0.91, "unit": "m", "raw": "1.00 to 3.00 feet"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `gaillardia-aristata:mature_height:rhs01` | Royal Horticultural Society | {"min": 0.5, "max": 1, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `gaillardia-aristata:mature_height:usdaplants01` | USDA PLANTS Database | {"height_m": 0.61, "unit": "m", "raw": "2.0 ft mature"} | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `gaillardia-aristata:mature_height:eflora01` — E-Flora BC: perennial from a slender taproot, stems 20–70 cm tall.
- `gaillardia-aristata:mature_height:mobot01` — Missouri Botanical Garden gives Gaillardia aristata a height of 1–3 ft (0.3–0.9 m).
- `gaillardia-aristata:mature_height:rhs01` — RHS gives Gaillardia aristata an ultimate height of 0.5–1 m (profile text: clumps to about 75 cm).
- `gaillardia-aristata:mature_height:usdaplants01` — USDA PLANTS gives a mature height of 2 ft (0.6 m).

### mature_spread

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:mature_spread:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 0.3, "max": 0.61, "unit": "m", "raw": "1.00 to 2.00 feet"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `gaillardia-aristata:mature_spread:rhs01` | Royal Horticultural Society | {"min": 0.5, "max": 1, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `gaillardia-aristata:mature_spread:mobot01` — Missouri Botanical Garden gives Gaillardia aristata a spread of 1–2 ft (0.3–0.6 m).
- `gaillardia-aristata:mature_spread:rhs01` — RHS gives Gaillardia aristata an ultimate spread of 0.5–1 m.

### maintenance_level

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:maintenance_level:mobot01` | Missouri Botanical Garden Plant Finder | "maintenance:low" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `gaillardia-aristata:maintenance_level:rhs01` | Royal Horticultural Society | "maintenance:medium" | 0.65 | species; RHS plant profile, UK growing conditions | inferred from the pruning/cultivation advice (deadheading, cutting back, possible staking) → medium — loose; no explicit RHS rating |

- `gaillardia-aristata:maintenance_level:mobot01` — Missouri Botanical Garden rates maintenance low; deadheading optional, cutting back in summer may renew bloom.
- `gaillardia-aristata:maintenance_level:rhs01` — RHS: deadhead regularly and cut back after flowering; may need staking.

### ecological_value

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:ecological_value:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["origin:native"] | 0.9 | BC; E-Flora BC atlas page | native status is province-wide; for the Vancouver region E-Flora treats the species as introduced — see vancouver_context eflora01 |
| [ ] `gaillardia-aristata:ecological_value:mobot01` | Missouri Botanical Garden Plant Finder | ["origin:native", "ecology:pollinator", "ecology:bird_food"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `gaillardia-aristata:ecological_value:usdaplants01` | USDA PLANTS Database | ["origin:native"] | 0.8 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `gaillardia-aristata:ecological_value:eflora01` — E-Flora BC lists Gaillardia aristata as native to BC (provincial list Yellow, rank S5 (2019)); common in south-central and south-eastern BC but introduced in south-western BC (lower Fraser Valley).
- `gaillardia-aristata:ecological_value:mobot01` — Missouri Botanical Garden: native to western North America (North Dakota to Colorado, west to California and British Columbia), mainly dry meadows, prairies, grasslands and foothills; flowers attract butterflies and other insect pollinators; seed heads attract birds.
- `gaillardia-aristata:ecological_value:usdaplants01` — USDA PLANTS: native in Canada and the lower 48 states.

## compare

### exposure

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:exposure:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["exposure:full_sun"] | 0.7 | BC; E-Flora BC atlas page; inferred from habitat classes, not a cultiv | exposure read off habitat classes |
| [ ] `gaillardia-aristata:exposure:mobot01` | Missouri Botanical Garden Plant Finder | ["exposure:full_sun"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `gaillardia-aristata:exposure:rhs01` | Royal Horticultural Society | ["exposure:full_sun", "exposure:sheltered"] | 0.85 | species; RHS plant profile, UK growing conditions | KPU has no 'Exposed' value; 'exposed or sheltered' → Sheltered kept only as the available label |
| [ ] `gaillardia-aristata:exposure:usdaplants01` | USDA PLANTS Database | ["exposure:part_sun_part_shade", "exposure:filtered_shade"] | 0.55 | USDA PLANTS characteristics, US-wide conservation plant data | 'Shade Tolerance: High' → tolerates part to filtered shade — loose; contradicts RHS and MOBOT (full sun) and the open dry-grassland habitat  |

- `gaillardia-aristata:exposure:eflora01` — E-Flora BC habitat records are dry grasslands and shrublands, open steppe and sand bars.
- `gaillardia-aristata:exposure:mobot01` — Missouri Botanical Garden: full sun.
- `gaillardia-aristata:exposure:rhs01` — RHS: full sun; south- or west-facing; exposed or sheltered sites.
- `gaillardia-aristata:exposure:usdaplants01` — USDA PLANTS rates shade tolerance high.

### seasonal_interest

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r03 | {"note": "long blooming"} | 0.8 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| [ ] `gaillardia-aristata:seasonal_interest:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"flower_colour": ["Yellow"], "evergreen": false} | 0.85 | BC; E-Flora BC atlas page | no flowering months given by E-Flora itself (the 'Spring' bloom period shown is the USDA characteristic) |
| [ ] `gaillardia-aristata:seasonal_interest:inat03` | iNaturalist observations | {"flowering_months": [11, 12], "annotated_n": 46, "share_threshold": 0.1} | 0.5 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | month included when >= 10% of annotated observations; annotations are volunteer-made |
| [ ] `gaillardia-aristata:seasonal_interest:inat04` | iNaturalist observations | {"fruiting_months": [11, 12], "annotated_n": 21, "share_threshold": 0.1} | 0.5 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | month included when >= 10% of annotated observations; annotations are volunteer-made |
| [ ] `gaillardia-aristata:seasonal_interest:mobot01` | Missouri Botanical Garden Plant Finder | {"flowering_months": [5, 6, 7, 8, 9, 10], "flower_colour": ["Yellow"], "foliage_colour"… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'May to October' → months 5–10; disk colour (brownish-purple) not added to flower_colour because the ray colour dominates; 'gray-green' → Gr |
| [ ] `gaillardia-aristata:seasonal_interest:rhs01` | Royal Horticultural Society | {"flowering_months": [7, 8, 9], "flower_colour": ["Orange", "Red", "Yellow"], "foliage_… | 0.85 | species; RHS plant profile, UK growing conditions | 'mid-summer to early autumn' → months 7–9; 'orangey-red and yellow' → Orange, Red, Yellow; 'greyish-green' → Green (no grey-green in kpu_col |
| [ ] `gaillardia-aristata:seasonal_interest:usdaplants01` | USDA PLANTS Database | {"flowering_months": [4, 5], "flower_colour": ["Yellow"], "foliage_colour": ["Green"], … | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | 'Bloom Period: Spring' → months 4–5 (approximate); earlier and shorter than RHS (Jul–Sep) and MOBOT (May–Oct) |

- `gaillardia-aristata:seasonal_interest:eflora01` — E-Flora BC: heads with 6–16 (commonly 13) yellow ray flowers around brownish-purple disk flowers; herbaceous perennial.
- `gaillardia-aristata:seasonal_interest:inat03` — iNaturalist phenology annotations in Greater Vancouver (n=46) put flowering mainly in months 11, 12.
- `gaillardia-aristata:seasonal_interest:inat04` — iNaturalist phenology annotations in Greater Vancouver (n=21) put fruiting mainly in months 11, 12.
- `gaillardia-aristata:seasonal_interest:mobot01` — Missouri Botanical Garden: showy daisy-type flower heads May to October with yellow ray florets (sometimes purple-based) around a brownish-purple disk; grey-green lance-shaped leaves; herbaceous.
- `gaillardia-aristata:seasonal_interest:rhs01` — RHS: deciduous herbaceous perennial; large daisy-like orange-red and yellow flower heads from mid-summer to early autumn; greyish-green lance-shaped leaves.
- `gaillardia-aristata:seasonal_interest:usdaplants01` — USDA PLANTS: conspicuous yellow flowers in spring, green foliage, inconspicuous brown seed summer to fall, no fall colour, leaves not retained.

### texture

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:texture:usdaplants01` | USDA PLANTS Database | "texture:coarse" | 0.65 | USDA PLANTS characteristics, US-wide conservation plant data | recorded as given |

- `gaillardia-aristata:texture:usdaplants01` — USDA PLANTS rates foliage texture coarse.

### habit

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:habit:rhs01` | Royal Horticultural Society | "habit:dense" | 0.75 | species; RHS plant profile, UK growing conditions | 'bushy, clump forming' → Dense — loose; KPU has no 'Clumping' value |
| [ ] `gaillardia-aristata:habit:usdaplants01` | USDA PLANTS Database | "habit:upright" | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | 'Erect' → Upright; 'Bunch' (clumping) has no KPU habit value |

- `gaillardia-aristata:habit:rhs01` — RHS: bushy, clump-forming habit.
- `gaillardia-aristata:habit:usdaplants01` — USDA PLANTS: shape and orientation erect; growth form bunch.

### soil_type

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:soil_type:mobot01` | Missouri Botanical Garden Plant Finder | ["soil:well_drained"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'organically rich' not mapped to Humus rich because the plant tolerates poor dry soil equally |
| [ ] `gaillardia-aristata:soil_type:rhs01` | Royal Horticultural Society | ["soil:well_drained"] | 0.8 | species; RHS plant profile, UK growing conditions | chalk/loam/sand have no KPU class; pH any, so neither Acidic nor Alkaline is mapped |
| [ ] `gaillardia-aristata:soil_type:usdaplants01` | USDA PLANTS Database | ["soil:well_drained"] | 0.65 | USDA PLANTS characteristics, US-wide conservation plant data | coarse/medium soils with no waterlogging tolerance → Well-drained (loose); pH spans acid to mildly alkaline so neither Acidic nor Alkaline i |

- `gaillardia-aristata:soil_type:mobot01` — Missouri Botanical Garden: average, dry to medium, well-drained soil; prefers organically rich soil that drains well; tolerates dry soil; poor in overly moist heavy clay.
- `gaillardia-aristata:soil_type:rhs01` — RHS: well-drained chalk, loam or sand; acid, neutral or alkaline; moderately fertile.
- `gaillardia-aristata:soil_type:usdaplants01` — USDA PLANTS: adapted to coarse and medium textured soils, not fine; pH 5.5–7.9; low fertility requirement; no anaerobic tolerance.

### growth_rate

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:growth_rate:usdaplants01` | USDA PLANTS Database | "growth_rate:moderate" | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `gaillardia-aristata:growth_rate:usdaplants01` — USDA PLANTS rates growth rate moderate.

### landscape_use

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:landscape_use:mobot01` | Missouri Botanical Garden Plant Finder | ["use:perennial_border", "use:rock_garden", "use:cut_flower_or_foliage", "use:container… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'Naturalize' → Wild flower garden; 'cottage gardens' has no KPU class; 'Good Cut' → Cut flower or foliage |
| [ ] `gaillardia-aristata:landscape_use:rhs01` | Royal Horticultural Society | ["use:perennial_border", "use:cut_flower_or_foliage", "use:small_garden_space"] | 0.8 | species; RHS plant profile, UK growing conditions | 'flower borders and beds' → Perennial border; 'city and courtyard' → Small garden/space; 'coastal' and 'cottage and informal' have no KPU cl |

- `gaillardia-aristata:landscape_use:mobot01` — Missouri Botanical Garden: perennial border fronts, rock gardens, cottage gardens, cutting gardens and containers; suggested use naturalize; attracts butterflies and birds.
- `gaillardia-aristata:landscape_use:rhs01` — RHS suggests flower borders and beds, cut flowers, city and courtyard gardens, cottage and informal gardens and coastal gardens.

### pest_susceptibility

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:pest_susceptibility:mobot01` | Missouri Botanical Garden Plant Finder | ["pest:root_rot", "pest:mildew", "pest:fungal_leaf_spot"] | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'powdery mildew' → Mildew; aster yellows (a phytoplasma disease) has no KPU class and is not mapped |
| [ ] `gaillardia-aristata:pest_susceptibility:rhs01` | Royal Horticultural Society | ["pest:slugs_or_snails", "pest:mildew"] | 0.8 | species; RHS plant profile, UK growing conditions | 'downy mildews' → Mildew |

- `gaillardia-aristata:pest_susceptibility:mobot01` — Missouri Botanical Garden: root rot in poorly drained soil, especially with prolonged heavy summer rain; species plants generally susceptible to powdery mildew, aster yellows and fungal leaf spots.
- `gaillardia-aristata:pest_susceptibility:rhs01` — RHS: may be susceptible to slugs and snails and to downy mildews.

### resistances

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:resistances:mobot01` | Missouri Botanical Garden Plant Finder | ["stress:drought", "stress:drought"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'dry soil' is outside the starter resistances list (open list, M11) |
| [ ] `gaillardia-aristata:resistances:rhs01` | Royal Horticultural Society | ["stress:drought"] | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `gaillardia-aristata:resistances:usdaplants01` | USDA PLANTS Database | ["stress:drought"] | 0.6 | USDA PLANTS characteristics, US-wide conservation plant data | 'Drought Tolerance: Medium' — borderline; recorded at low confidence |

- `gaillardia-aristata:resistances:mobot01` — Missouri Botanical Garden lists Gaillardia aristata as tolerating drought and dry soil.
- `gaillardia-aristata:resistances:rhs01` — RHS lists Gaillardia aristata as drought resistant.
- `gaillardia-aristata:resistances:usdaplants01` — USDA PLANTS rates drought tolerance medium.

## extended

### time_to_intended_size

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:time_to_intended_size:rhs01` | Royal Horticultural Society | {"min": 2, "max": 5, "unit": "years", "measure": "time to ultimate height"} | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `gaillardia-aristata:time_to_intended_size:rhs01` — RHS gives Gaillardia aristata 2–5 years to reach its ultimate height.

### long_term_performance

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:long_term_performance:mobot01` | Missouri Botanical Garden Plant Finder | {"drainage": "root rot in poorly drained soil, particularly during long periods of heav… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | relevant to Vancouver clay soils and winter wet; MOBOT does not call the species itself short-lived (it says that of the G. × grandiflora hy |

- `gaillardia-aristata:long_term_performance:mobot01` — Missouri Botanical Garden warns of root rot in poorly drained soil under prolonged heavy rain and poor performance in wet heavy clay.

### behaviour_with_others

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:behaviour_with_others:usdaplants01` | USDA PLANTS Database | {"growth_form": "bunch", "vegetative_spread_rate": "none", "seed_spread_rate": "slow", … | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data | 'Lifespan: Moderate' bears on the common claim that blanketflowers are short-lived; MOBOT applies 'short lived' only to the G. × grandiflora |

- `gaillardia-aristata:behaviour_with_others:usdaplants01` — USDA PLANTS: bunch-forming with no vegetative spread and a slow seed spread rate; moderate lifespan; not allelopathic.

### toxicity

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:toxicity:usdaplants01` | USDA PLANTS Database | {"usda_rating": "none", "humans": "unknown", "pets": "unknown"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | M17: USDA 'Toxicity' is a livestock / conservation-planting rating; humans and pets stay unknown |

- `gaillardia-aristata:toxicity:usdaplants01` — USDA PLANTS lists toxicity as none.

### vancouver_context

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `gaillardia-aristata:vancouver_context:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"habitat": ["dry grassland", "dry shrubland", "lowland", "steppe", "lower montane", "m… | 0.9 | BC; E-Flora BC atlas page | BEC zone list from the atlas station records; no CWH or CDF stations, so the species is interior-only as a native and Vancouver plantings ar |
| [ ] `gaillardia-aristata:vancouver_context:inat01` | iNaturalist observations | {"licensed_verifiable_observations": 249, "research_grade": 77, "all_licences": 313, "y… | 0.6 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | presence evidence; observation counts reflect observer effort as much as abundance |
| [ ] `gaillardia-aristata:vancouver_context:inat02` | iNaturalist observations | {"observations_by_month": {"1": 5, "2": 0, "3": 0, "4": 2, "5": 23, "6": 42, "7": 48, "… | 0.55 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | observer effort, not plant activity — the plant is evergreen/visible year-round; use for 'when people notice it', not phenology |

- `gaillardia-aristata:vancouver_context:eflora01` — E-Flora BC: an interior dry-grassland and shrubland species of the lowland, steppe and lower montane zones (modal zone IDF, also BG and PP), 250–1968 m; common in south-central and south-eastern BC; in the lower Fraser Valley it is introduced, not native.
- `gaillardia-aristata:vancouver_context:inat01` — iNaturalist holds 249 openly licensed verifiable observations of this plant in Greater Vancouver (77 research grade), recorded 2013–2026.
- `gaillardia-aristata:vancouver_context:inat02` — Monthly spread of 249 Greater Vancouver observations: most in 7, 6, 9 (month numbers).
