# Review: *Cornus nuttallii* — 58 unverified claims on 22 fields · 2026-11-02

Grouped by field; every live claim on the field is shown (verified ones too) so values can be compared side by side. Tick the id to keep as verified, strike it to reject. Then:

```bash
python3 -I tools/verify_claims.py plants/cornus-nuttallii.json --by Kay <ids…>     # or --source rhs
```

Values are structured only; `text` was written from the value, never copied. *mapping* flags where a source term was forced into the KPU vocabulary.
KPU (tier C) is linked from the entity only; none of its values are stored, even where its page shows a figure that disagrees with the sources below (D2).

## Sources in this review

- **E-Flora BC: Electronic Atlas of the Flora of British Columbia** (`eflora`, tier B, checked 2026-10-29): Home page (linnet.geog.ubc.ca/biodiversity/eflora/, 2026-10-29): 'All content on E-Flora BC is covered by Canadian Copyright Law.' Photographs: 'adherence to copyright law is the responsibility of the photographer' — 'Co…
- **iNaturalist observations** (`inat`, tier B, checked 2026-10-29): Site terms page (inaturalist.org/pages/terms) could not be read on 2026-10-29: Cloudflare bot check blocked both WebFetch and the built-in browser. Recorded instead: (1) api.inaturalist.org swagger info.description — pub…
- **Invasive Species Council of BC** (`iscbc`, tier B, checked 2026-10-29): No terms of use. Footer: '© 2023 Invasive Species Council of BC. All rights reserved.' Only a privacy policy PDF is linked (Policy 304, Feb 2019).
- **Missouri Botanical Garden Plant Finder** (`mobot`, tier B, checked 2026-10-29): Conditions of Use (missouribotanicalgarden.org/conditions): texts/images copyrighted; 'may not be used for any commercial purpose without permission'; 'may not be re-published in print or electronic form without permissi…
- **Oregon State University Landscape Plants** (`osu`, tier B, checked 2026-10-29): No terms of use published. Footer: 'Copyright ©2026 Oregon State University'; oregonstate.edu/copyright is a DMCA notice page only. Site is a Dept. of Horticulture teaching resource with a references page.
- **Royal Horticultural Society — Plants (plant profiles)** (`rhs`, tier B, checked 2026-10-29): No site-wide terms page found (2026-10-29); rhs.org.uk/terms-and-conditions redirects to ChatBotanist terms. Section-specific terms (VLE, heritage catalogue) state RHS owns copyright in site content and bar copying excep…
- **USDA PLANTS Database** (`usda_plants`, tier A, checked 2026-10-29): USDA Policies and Links (usda.gov/about-usda/policies-and-links, 2026-10-29): 'Most information presented on the USDA Web site is considered public domain information. Public domain information may be freely distributed …

## gate

### hardiness_zone

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:hardiness_zone:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 7, "max": 9, "unit": "USDA"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cornus-nuttallii:hardiness_zone:osu01` | Oregon State University Landscape Plants | {"usda_min": 7, "unit": "USDA"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cornus-nuttallii:hardiness_zone:rhs01` | Royal Horticultural Society | {"rating": "H5", "unit": "RHS", "approx_min_c": -15, "approx_max_c": -10} | 0.85 | species; RHS plant profile, UK growing conditions | RHS H-scale, not a Canadian or USDA zone; °C band is the RHS definition of H5, not from the plant page |

- `cornus-nuttallii:hardiness_zone:mobot01` — Missouri Botanical Garden lists Cornus nuttallii for USDA zones 7 to 9.
- `cornus-nuttallii:hardiness_zone:osu01` — Oregon State University: hardy to USDA zone 7.
- `cornus-nuttallii:hardiness_zone:rhs01` — RHS rates Cornus nuttallii hardiness H5 (hardy in most of the UK even in severe winters, about -15 to -10 °C).

### invasive_status

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:invasive_status:iscbc01` | Invasive Species Council of BC | "invasive:not_listed" | 0.9 | BC; ISCBC online species profiles only | BC Weed Control Act schedules and the Field Guide to Noxious Weeds were not checked page by page |

- `cornus-nuttallii:invasive_status:iscbc01` — Cornus nuttallii is not among the 68 plant profiles on the Invasive Species Council of BC 'Find an Invasive Species' list (checked 2026-11-02); no Cornus species is listed. It is a BC native.

### water_drainage

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:water_drainage:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | "water:average" | 0.7 | BC; E-Flora BC atlas page; inferred from BEC indicator data | SMR average 3 ('fresh') → average; inferred from habitat indicator data, not a cultivation rating |
| [ ] `cornus-nuttallii:water_drainage:mobot01` | Missouri Botanical Garden Plant Finder | "water:average" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cornus-nuttallii:water_drainage:rhs01` | Royal Horticultural Society | "water:average" | 0.75 | species; RHS plant profile, UK growing conditions | 'moist but well-drained or well-drained' → average (as in the gaultheria template); 'moist' would also be defensible |
| [ ] `cornus-nuttallii:water_drainage:usdaplants01` | USDA PLANTS Database | "water:average" | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | medium moisture use → average; low drought and low anaerobic tolerance bracket it away from dry and wet |

- `cornus-nuttallii:water_drainage:eflora01` — E-Flora BC: moderately dry to fresh soils; soil moisture regime 0–7 with an average of 3; water-shedding sites.
- `cornus-nuttallii:water_drainage:mobot01` — Missouri Botanical Garden rates water needs as medium; average, medium-moisture, well-drained soils.
- `cornus-nuttallii:water_drainage:rhs01` — RHS: moist but well-drained or well-drained.
- `cornus-nuttallii:water_drainage:usdaplants01` — USDA PLANTS: moisture use medium, drought tolerance low, anaerobic tolerance low.

### mature_height

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:mature_height:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"max": 20, "unit": "m"} | 0.85 | BC; E-Flora BC atlas page | E-Flora's 20 m ceiling is a wild-stand maximum; horticultural sources give 8–12 m |
| [ ] `cornus-nuttallii:mature_height:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 4.6, "max": 12.2, "unit": "m", "raw": "15–40 ft, infrequently to 70 ft"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cornus-nuttallii:mature_height:osu01` | Oregon State University Landscape Plants | {"min": 9, "max": 12, "unit": "m", "raw": "30–40 ft"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley | OSU gives no width figure |
| [ ] `cornus-nuttallii:mature_height:rhs01` | Royal Horticultural Society | {"min": 8, "max": 12, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `cornus-nuttallii:mature_height:usdaplants01` | USDA PLANTS Database | {"height_m": 15.2, "unit": "m", "raw": "50 ft mature; 12 ft maximum at 20 years"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | 50 ft is above the horticultural ceilings (RHS 12 m, OSU 12 m, MOBOT 40 ft) and nearer E-Flora's wild 20 m; kept as given |

- `cornus-nuttallii:mature_height:eflora01` — E-Flora BC: small, irregularly branched deciduous tree up to 20 m tall.
- `cornus-nuttallii:mature_height:mobot01` — Missouri Botanical Garden gives Cornus nuttallii a height of 15–40 ft (4.6–12.2 m), infrequently to 70 ft.
- `cornus-nuttallii:mature_height:osu01` — Oregon State University gives Cornus nuttallii a height of 30–40 ft (9–12 m).
- `cornus-nuttallii:mature_height:rhs01` — RHS gives Cornus nuttallii an ultimate height of 8–12 m.
- `cornus-nuttallii:mature_height:usdaplants01` — USDA PLANTS gives a mature height of 50 ft (15.2 m), with a maximum of 12 ft at 20 years.

### mature_spread

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:mature_spread:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 3.0, "max": 7.6, "unit": "m", "raw": "10–25 ft"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cornus-nuttallii:mature_spread:rhs01` | Royal Horticultural Society | {"min": 4, "max": 8, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `cornus-nuttallii:mature_spread:mobot01` — Missouri Botanical Garden gives Cornus nuttallii a spread of 10–25 ft (3–7.6 m).
- `cornus-nuttallii:mature_spread:rhs01` — RHS gives Cornus nuttallii an ultimate spread of 4–8 m.

### maintenance_level

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:maintenance_level:mobot01` | Missouri Botanical Garden Plant Finder | "maintenance:medium" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | contrasts with RHS 'minimal pruning' → low; MOBOT's rating likely reflects the disease load when stressed (R1, both kept) |
| [ ] `cornus-nuttallii:maintenance_level:rhs01` | Royal Horticultural Society | "maintenance:low" | 0.75 | species; RHS plant profile, UK growing conditions | 'minimal pruning' → low; RHS gives no explicit maintenance rating |

- `cornus-nuttallii:maintenance_level:mobot01` — Missouri Botanical Garden rates maintenance as medium.
- `cornus-nuttallii:maintenance_level:rhs01` — RHS: pruning group 1, best with minimal pruning.

### ecological_value

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:ecological_value:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["origin:native"] | 0.9 | BC; E-Flora BC atlas page |  |
| [ ] `cornus-nuttallii:ecological_value:mobot01` | Missouri Botanical Garden Plant Finder | ["origin:native"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | MOBOT 'Attracts: Birds, Butterflies' recorded under landscape_use, not as bird_food/pollinator, because the profile does not state the plant |
| [ ] `cornus-nuttallii:ecological_value:osu01` | Oregon State University Landscape Plants | ["origin:native"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cornus-nuttallii:ecological_value:usdaplants01` | USDA PLANTS Database | ["origin:native"] | 0.8 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `cornus-nuttallii:ecological_value:eflora01` — E-Flora BC lists Cornus nuttallii as native to BC (provincial list Yellow, rank S5 (2019), secure; COSEWIC not listed).
- `cornus-nuttallii:ecological_value:mobot01` — Missouri Botanical Garden: native to coastal regions west of the Cascades from southern British Columbia to southern California, with a disjunct population in northern Idaho.
- `cornus-nuttallii:ecological_value:osu01` — Oregon State University: native to Oregon; range along the Pacific coast from just beyond Vancouver Island, BC, to southern California, with a disjunct population in north-central Idaho.
- `cornus-nuttallii:ecological_value:usdaplants01` — USDA PLANTS: native in Canada and the lower 48 states.

## compare

### exposure

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:exposure:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["exposure:part_sun_part_shade", "exposure:filtered_shade"] | 0.7 | BC; E-Flora BC atlas page; inferred from habitat classes, not a cultiv | exposure read off habitat classes; young-seral and disturbed communities suggest it also takes open sites |
| [ ] `cornus-nuttallii:exposure:mobot01` | Missouri Botanical Garden Plant Finder | ["exposure:full_sun", "exposure:part_sun_part_shade"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cornus-nuttallii:exposure:osu01` | Oregon State University Landscape Plants | ["exposure:part_sun_part_shade"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cornus-nuttallii:exposure:rhs01` | Royal Horticultural Society | ["exposure:full_sun", "exposure:part_sun_part_shade", "exposure:sheltered"] | 0.85 | species; RHS plant profile, UK growing conditions | KPU has no 'Exposed' value; 'exposed or sheltered' → Sheltered only (as in the gaultheria/acer templates) |
| [ ] `cornus-nuttallii:exposure:usdaplants01` | USDA PLANTS Database | ["exposure:full_sun"] | 0.55 | USDA PLANTS characteristics, US-wide conservation plant data | 'Shade Tolerance: Low' contradicts OSU (part shade), MOBOT (prefers part shade) and E-Flora (forest shrub layer); kept side by side at low c |

- `cornus-nuttallii:exposure:eflora01` — E-Flora BC habitat records place the species in the shrub layer of mixed and coniferous forests, on water-shedding slopes and in disturbed, young-seral communities.
- `cornus-nuttallii:exposure:mobot01` — Missouri Botanical Garden: full sun to part shade; prefers part shade with cool, mulched roots.
- `cornus-nuttallii:exposure:osu01` — Oregon State University: part shade; bark damaged by hot sun.
- `cornus-nuttallii:exposure:rhs01` — RHS: full sun or partial shade; south- or west-facing aspect; exposed or sheltered sites.
- `cornus-nuttallii:exposure:usdaplants01` — USDA PLANTS rates shade tolerance low.

### seasonal_interest

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r01 | {"note": "flowers"} | 0.7 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| [ ] `cornus-nuttallii:seasonal_interest:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"flower_colour": ["White", "Pink"], "flowering_months": [4, 5], "fall_colour": "red", … | 0.85 | BC; E-Flora BC atlas page | 'mid-spring' → months 4–5; second fall flowering not added to flowering_months; flower_colour = bracts ('pink-tinged' → Pink) |
| [ ] `cornus-nuttallii:seasonal_interest:inat03` | iNaturalist observations | {"flowering_months": [4, 5], "annotated_n": 29, "share_threshold": 0.1} | 0.5 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | month included when >= 10% of annotated observations; annotations are volunteer-made |
| [ ] `cornus-nuttallii:seasonal_interest:mobot01` | Missouri Botanical Garden Plant Finder | {"flower_colour": ["White"], "flowering_months": [4, 5, 6], "foliage_colour": ["Green"]… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'April to June' → months 4–6; flower_colour = the showy bracts; true flowers purple-green |
| [ ] `cornus-nuttallii:seasonal_interest:osu01` | Oregon State University Landscape Plants | {"flower_colour": ["White"], "flowering_months": [4, 5], "fruit": "orange to bright red… | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley | 'spring' → months 4–5; occasional second bloom in fall not added to flowering_months; bracts rarely pink — White only; OSU states no fall le |
| [ ] `cornus-nuttallii:seasonal_interest:rhs01` | Royal Horticultural Society | {"flower_colour": ["White"], "flowering_months": [5, 6], "foliage_colour": ["Green"], "… | 0.85 | species; RHS plant profile, UK growing conditions | 'late spring' → months 5–6; flower_colour = the showy bracts (RHS season table: spring flower White); the true flowers are purple-green; fal |
| [ ] `cornus-nuttallii:seasonal_interest:usdaplants01` | USDA PLANTS Database | {"flower_colour": ["Green"], "flowering_months": [4, 5], "foliage_colour": ["Green"], "… | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data | 'Mid Spring' → months 4–5; USDA 'Flower Color: Green' describes the true flowers, not the white bracts — do not merge with the White of othe |

- `cornus-nuttallii:seasonal_interest:eflora01` — E-Flora BC: deciduous; 4–7 showy white or pink-tinged bracts around tiny greenish-white flowers in mid-spring, often flowering again in fall; leaves turn red in fall; bright red drupes summer to fall.
- `cornus-nuttallii:seasonal_interest:inat03` — iNaturalist phenology annotations in Greater Vancouver (n=29) put flowering mainly in months 4, 5.
- `cornus-nuttallii:seasonal_interest:mobot01` — Missouri Botanical Garden: bloom April to June, showy white bracts (six) around tiny purple-green flowers; dark green leaves with good yellow-orange-red fall colour; showy bright red or orange fruit.
- `cornus-nuttallii:seasonal_interest:osu01` — Oregon State University: deciduous; 4–8 showy white (rarely pink) bracts 5–8 cm long around 30–40 small dull green or purple flowers in spring, occasionally again in fall; orange to bright red fruit clusters in fall.
- `cornus-nuttallii:seasonal_interest:rhs01` — RHS: deciduous; mid-green leaves sometimes turning red in autumn (season table: autumn foliage purple and red); late-spring heads of small purple-green flowers surrounded by 4–6 white or pink-tinged bracts; spherical orange-red fruit in autumn.
- `cornus-nuttallii:seasonal_interest:usdaplants01` — USDA PLANTS: green conspicuous flowers in mid spring, green foliage, conspicuous fall colour, abundant red fruit summer to fall, leaves not retained.

### texture

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:texture:usdaplants01` | USDA PLANTS Database | "texture:medium" | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `cornus-nuttallii:texture:usdaplants01` — USDA PLANTS rates foliage texture medium.

### form

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:form:rhs01` | Royal Horticultural Society | "form:pyramidal_widely" | 0.7 | species; RHS plant profile, UK growing conditions | 'conical' → Pyramidal - widely; the RHS habit label 'Columnar upright' would map to form Columnar instead — loose, two possible readings, co |

- `cornus-nuttallii:form:rhs01` — RHS describes a conical deciduous tree; the habit label is 'columnar upright'.

### habit

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:habit:mobot01` | Missouri Botanical Garden Plant Finder | "habit:horizontal" | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'horizontal tiered branching' → Horizontal; crown 'rounded to conical' not mapped to form because it spans two KPU form values |
| [ ] `cornus-nuttallii:habit:osu01` | Oregon State University Landscape Plants | "habit:upright" | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cornus-nuttallii:habit:rhs01` | Royal Horticultural Society | "habit:upright" | 0.8 | species; RHS plant profile, UK growing conditions | RHS 'Columnar upright' → Upright (KPU habit has no 'Columnar'; columnar is a KPU form value, see form:rhs01) |
| [ ] `cornus-nuttallii:habit:usdaplants01` | USDA PLANTS Database | "habit:upright" | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | 'Erect' → Upright |

- `cornus-nuttallii:habit:mobot01` — Missouri Botanical Garden: horizontal tiered branching; rounded to conical crown.
- `cornus-nuttallii:habit:osu01` — Oregon State University: upright (excurrent) tree.
- `cornus-nuttallii:habit:rhs01` — RHS habit: columnar upright.
- `cornus-nuttallii:habit:usdaplants01` — USDA PLANTS: erect shape and orientation; multiple-stem growth form.

### soil_type

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:soil_type:mobot01` | Missouri Botanical Garden Plant Finder | ["soil:acidic", "soil:humus_rich", "soil:well_drained"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cornus-nuttallii:soil_type:osu01` | Oregon State University Landscape Plants | ["soil:well_drained", "soil:acidic", "soil:humus_rich"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cornus-nuttallii:soil_type:rhs01` | Royal Horticultural Society | ["soil:well_drained", "soil:humus_rich"] | 0.8 | species; RHS plant profile, UK growing conditions | loam/sand have no KPU class; 'acid or neutral' not mapped to Acidic because neutral is included; Humus rich taken from the cultivation note, |
| [ ] `cornus-nuttallii:soil_type:usdaplants01` | USDA PLANTS Database | ["soil:acidic"] | 0.65 | USDA PLANTS characteristics, US-wide conservation plant data | pH range reaches neutral; Acidic chosen because of the 4.9 floor and zero CaCO3 tolerance — loose; 'not adapted to coarse soils' not mappabl |

- `cornus-nuttallii:soil_type:mobot01` — Missouri Botanical Garden: average well-drained soil; prefers moist, organically rich, acidic soil.
- `cornus-nuttallii:soil_type:osu01` — Oregon State University: well-drained, acidic soil high in organic matter.
- `cornus-nuttallii:soil_type:rhs01` — RHS: loam or sand; moist but well-drained or well-drained; acid or neutral pH; cultivation note asks for fertile, humus-rich soil.
- `cornus-nuttallii:soil_type:usdaplants01` — USDA PLANTS: pH 4.9–7.3, adapted to fine and medium textured soils but not coarse, no CaCO3 tolerance.

### growth_rate

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:growth_rate:usdaplants01` | USDA PLANTS Database | "growth_rate:moderate" | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data | sits oddly beside the 12 ft at 20 years figure from the same source |

- `cornus-nuttallii:growth_rate:usdaplants01` — USDA PLANTS rates growth rate moderate.

### landscape_use

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:landscape_use:mobot01` | Missouri Botanical Garden Plant Finder | ["use:specimen_plant", "use:group_or_mass_planting", "use:woodland_margin", "use:native… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'woodland garden' → Woodland margin; 'small grouping' → Group or mass planting |

- `cornus-nuttallii:landscape_use:mobot01` — Missouri Botanical Garden uses: specimen or small grouping near homes, patios and lawns; woodland, bird and native plant gardens; attracts birds and butterflies.

### pest_susceptibility

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:pest_susceptibility:mobot01` | Missouri Botanical Garden Plant Finder | ["pest:anthracnose", "pest:fungal_leaf_spot", "pest:canker_or_sap_rot", "pest:root_rot"… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | borers have no KPU pseudo-value; 'crown canker' → Canker or sap rot; 'leaf and twig blight' → Blight or needle cast; susceptibility conditio |
| [ ] `cornus-nuttallii:pest_susceptibility:rhs01` | Royal Horticultural Society | ["pest:scale_insects", "pest:anthracnose", "pest:root_rot"] | 0.8 | species; RHS plant profile, UK growing conditions | horse chestnut scale → Scale insects; cornus anthracnose → Anthracnose; honey fungus (Armillaria) → Root rot — loose |

- `cornus-nuttallii:pest_susceptibility:mobot01` — Missouri Botanical Garden: when stressed, susceptible to many diseases, most seriously dogwood anthracnose; also leaf spot, crown canker, root rot, leaf and twig blight; stressed trees vulnerable to borers; leaf miner and scale less serious.
- `cornus-nuttallii:pest_susceptibility:rhs01` — RHS: generally pest-free but may be susceptible to horse chestnut scale; may be susceptible to cornus anthracnose and honey fungus.

### resistances

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:resistances:mobot01` | Missouri Botanical Garden Plant Finder | ["browsing:deer", "stress:clay_soil", "stress:black_walnut"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | from the 'Tolerate' line; 'clay soil' and 'black walnut' are outside the starter resistances list (open list, M11) |
| [ ] `cornus-nuttallii:resistances:mobot02` | Missouri Botanical Garden Plant Finder | ["stress:drought"] | 0.65 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'some drought tolerance' once established — weak statement, confidence lowered; USDA rates drought tolerance low |
| [ ] `cornus-nuttallii:resistances:rhs01` | Royal Horticultural Society | ["pest:pest"] | 0.8 | species; RHS plant profile, UK growing conditions |  |

- `cornus-nuttallii:resistances:mobot01` — Missouri Botanical Garden lists Cornus nuttallii as tolerating deer, clay soil and black walnut.
- `cornus-nuttallii:resistances:mobot02` — Missouri Botanical Garden: established plants have some drought tolerance.
- `cornus-nuttallii:resistances:rhs01` — RHS: generally pest-free.

## extended

### time_to_intended_size

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:time_to_intended_size:rhs01` | Royal Horticultural Society | {"min": 10, "max": 20, "unit": "years", "measure": "time to ultimate height"} | 0.85 | species; RHS plant profile, UK growing conditions | RHS profile labels this 'Time to Maturity'; recorded under the project's standard measure 'time to ultimate height' (survey c2 gap) |
| [ ] `cornus-nuttallii:time_to_intended_size:usdaplants01` | USDA PLANTS Database | {"years": 20, "height_m": 3.7, "unit": "m at 20 years", "raw": "Height at 20 Years, Max… | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | a direct, if coarse, answer to survey c2 'time to reach intended size'; implies slow early growth although USDA rates growth rate moderate |

- `cornus-nuttallii:time_to_intended_size:rhs01` — RHS gives Cornus nuttallii 10–20 years to reach its ultimate height.
- `cornus-nuttallii:time_to_intended_size:usdaplants01` — USDA PLANTS gives a maximum height of 12 ft (3.7 m) at 20 years.

### long_term_performance

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:long_term_performance:mobot01` | Missouri Botanical Garden Plant Finder | {"regional_performance": "performs well in the western US; does not prosper in the east… | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cornus-nuttallii:long_term_performance:osu01` | Oregon State University Landscape Plants | {"garden_performance": "often does not do well in garden conditions", "stress_sensitivi… | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | OSU page does not mention anthracnose (checked by text search 2026-11-02); anthracnose is sourced from RHS and MOBOT |

- `cornus-nuttallii:long_term_performance:mobot01` — Missouri Botanical Garden: performs well in the western US but does not prosper in the eastern US; disease problems follow stress.
- `cornus-nuttallii:long_term_performance:osu01` — Oregon State University flags that the species often does poorly in garden conditions, is sensitive to many stresses, and suffers bark damage in hot sun.

### behaviour_with_others

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:behaviour_with_others:usdaplants01` | USDA PLANTS Database | {"growth_form": "multiple stem", "resprout": true, "coppice": false, "allelopath": fals… | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `cornus-nuttallii:behaviour_with_others:usdaplants01` — USDA PLANTS: multiple-stem growth form, resprouts but does not coppice, not allelopathic, no vegetative spread, moderate seed spread with high seedling vigour, long lifespan, medium fire tolerance.

### toxicity

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-nuttallii:toxicity:usdaplants01` | USDA PLANTS Database | {"usda_rating": "none", "humans": "unknown", "pets": "unknown"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | USDA 'Toxicity' is a livestock / conservation-planting rating (M17); humans and pets stay unknown |

- `cornus-nuttallii:toxicity:usdaplants01` — USDA PLANTS lists toxicity as none.

### vancouver_context

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | City of Vancouver Public Trees | {"public_trees_count": 620, "cultivar_labels_recorded": 2, "unlabelled": 608} | 0.9 | City of Vancouver public tree inventory, data snapshot 2026-11-02; str |  |
| ✅ verified | City of Vancouver Public Trees | {"cultivar_counts": {"GOLDSPOT": 11, "CORIGO GIANT": 1}, "cultivar_group_threshold_n": 50} | 0.85 | City of Vancouver public tree inventory, data snapshot 2026-11-02; str | labels as recorded by Parks staff; 'NONE' means not recorded, not the straight species. Labels with n >= 50 have their own size claims (cont |
| ✅ verified | City of Vancouver Public Trees | {"local_area_counts": {"Killarney": 92, "Riley Park": 66, "West Point Grey": 56, "Shaug… | 0.9 | City of Vancouver public tree inventory, data snapshot 2026-11-02; str |  |
| ✅ verified | survey-r07 | {"note": "commonly planted and good aesthetic values"} | 0.8 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| [ ] `cornus-nuttallii:vancouver_context:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"habitat": ["mesic forest", "lowland", "montane", "shrub layer of mixed and coniferous… | 0.9 | BC; E-Flora BC atlas page |  |
| [ ] `cornus-nuttallii:vancouver_context:inat01` | iNaturalist observations | {"licensed_verifiable_observations": 386, "research_grade": 252, "all_licences": 509, "… | 0.6 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | presence evidence; observation counts reflect observer effort as much as abundance |
| [ ] `cornus-nuttallii:vancouver_context:inat02` | iNaturalist observations | {"observations_by_month": {"1": 4, "2": 0, "3": 3, "4": 143, "5": 111, "6": 35, "7": 16… | 0.55 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | observer effort, not plant activity — the plant is evergreen/visible year-round; use for 'when people notice it', not phenology |

- `cornus-nuttallii:vancouver_context:eflora01` — E-Flora BC: in BC confined to the southwest corner (mainland and Vancouver Island); mesic lowland to montane forests, shrub layer of mixed and coniferous stands, disturbed sites and water-shedding colluvial slopes on nitrogen-rich soils, mostly in the Coastal Western Hemlock and Coastal Douglas-fir zones, 0–833 m (mean 194 m); BC's floral emblem since 1956.
- `cornus-nuttallii:vancouver_context:inat01` — iNaturalist holds 386 openly licensed verifiable observations of this plant in Greater Vancouver (252 research grade), recorded 2009–2026.
- `cornus-nuttallii:vancouver_context:inat02` — Monthly spread of 386 Greater Vancouver observations: most in 4, 5, 9 (month numbers).
