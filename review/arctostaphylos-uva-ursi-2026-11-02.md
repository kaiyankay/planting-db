# Review: *Arctostaphylos uva-ursi* — 71 unverified claims on 20 fields · 2026-11-02

Grouped by field; every live claim on the field is shown (verified ones too) so values can be compared side by side. Tick the id to keep as verified, strike it to reject. Then:

```bash
python3 -I tools/verify_claims.py plants/arctostaphylos-uva-ursi.json --by Kay <ids…>     # or --source rhs
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
| [ ] `arctostaphylos-uva-ursi:hardiness_zone:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 2, "max": 7, "unit": "USDA"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `arctostaphylos-uva-ursi:hardiness_zone:osu01` | Oregon State University Landscape Plants | {"usda_min": 2, "unit": "USDA"} | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | OSU adds '(varies)' |
| [ ] `arctostaphylos-uva-ursi:hardiness_zone:rhs01` | Royal Horticultural Society | {"rating": "H7", "unit": "RHS", "approx_max_c": -20} | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `arctostaphylos-uva-ursi:hardiness_zone:mobot01` — Missouri Botanical Garden lists Arctostaphylos uva-ursi for USDA zones 2 to 7, best in 2–6 (7).
- `arctostaphylos-uva-ursi:hardiness_zone:osu01` — Oregon State University: hardy to USDA zone 2 (varies).
- `arctostaphylos-uva-ursi:hardiness_zone:rhs01` — RHS rates Arctostaphylos uva-ursi hardiness H7 (very hardy, below -20 °C).

### invasive_status

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:invasive_status:iscbc01` | Invasive Species Council of BC | "invasive:not_listed" | 0.9 | BC; ISCBC online species profiles |  |

- `arctostaphylos-uva-ursi:invasive_status:iscbc01` — Arctostaphylos uva-ursi is not among the species profiles on the Invasive Species Council of BC site (checked 2026-11-02; the site search returns only an unrelated classroom-craft post); it is a BC native.

### water_drainage

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:water_drainage:mobot01` | Missouri Botanical Garden Plant Finder | "water:dry" | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'dry to medium' → dry; 'average' would also fit |
| [ ] `arctostaphylos-uva-ursi:water_drainage:rhs01` | Royal Horticultural Society | "water:average" | 0.75 | species; RHS plant profile, UK growing conditions | → average |
| [ ] `arctostaphylos-uva-ursi:water_drainage:rhs02` | Royal Horticultural Society | "water:moist" | 0.75 | cultivar: 'Vancouver Jade'; RHS plant profile, UK growing conditions | 'moist but well-drained' → moist (M8 discount) |
| [ ] `arctostaphylos-uva-ursi:water_drainage:usdaplants01` | USDA PLANTS Database | "water:dry" | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `arctostaphylos-uva-ursi:water_drainage:mobot01` — Missouri Botanical Garden rates water needs dry to medium.
- `arctostaphylos-uva-ursi:water_drainage:rhs01` — RHS: moist but well-drained to well-drained.
- `arctostaphylos-uva-ursi:water_drainage:rhs02` — RHS: 'Vancouver Jade' in moist but well-drained soil.
- `arctostaphylos-uva-ursi:water_drainage:usdaplants01` — USDA PLANTS: moisture use low, drought tolerance high, no anaerobic (waterlogging) tolerance.

### mature_height

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:mature_height:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"min": 0.05, "max": 0.15, "unit": "m"} | 0.85 | BC; E-Flora BC atlas page |  |
| [ ] `arctostaphylos-uva-ursi:mature_height:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 0.15, "max": 0.3, "unit": "m", "raw": "0.50 to 1.00 feet"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `arctostaphylos-uva-ursi:mature_height:osu01` | Oregon State University Landscape Plants | {"min": 0.15, "max": 0.3, "unit": "m", "raw": "6-12+ inches (15-30 cm)"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `arctostaphylos-uva-ursi:mature_height:osu02` | Oregon State University Landscape Plants | {"max": 0.15, "unit": "m", "raw": "up to 15 cm"} | 0.8 | cultivar: 'Vancouver Jade'; Oregon State University Landscape Plants,  |  |
| [ ] `arctostaphylos-uva-ursi:mature_height:rhs01` | Royal Horticultural Society | {"min": 0.1, "max": 0.5, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `arctostaphylos-uva-ursi:mature_height:rhs02` | Royal Horticultural Society | {"min": 0.1, "max": 0.5, "unit": "m"} | 0.8 | cultivar: 'Vancouver Jade'; RHS plant profile, UK growing conditions | RHS size band (0.1–0.5 m) is coarser than the description's 15 cm |
| [ ] `arctostaphylos-uva-ursi:mature_height:usdaplants01` | USDA PLANTS Database | {"height_m": 0.15, "unit": "m", "raw": "0.5 ft"} | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `arctostaphylos-uva-ursi:mature_height:eflora01` — E-Flora BC: prostrate shrub whose stems ascend at the tips to 5–15 cm.
- `arctostaphylos-uva-ursi:mature_height:mobot01` — Missouri Botanical Garden gives Arctostaphylos uva-ursi a height of 0.5–1 ft (0.15–0.3 m).
- `arctostaphylos-uva-ursi:mature_height:osu01` — Oregon State University gives Arctostaphylos uva-ursi a height of 6–12+ in (15–30 cm).
- `arctostaphylos-uva-ursi:mature_height:osu02` — Oregon State University gives 'Vancouver Jade' a height of up to 15 cm, less widely spreading than 'Massachusetts'.
- `arctostaphylos-uva-ursi:mature_height:rhs01` — RHS gives Arctostaphylos uva-ursi an ultimate height of 0.1–0.5 m.
- `arctostaphylos-uva-ursi:mature_height:rhs02` — RHS gives Arctostaphylos uva-ursi 'Vancouver Jade' an ultimate height of 0.1–0.5 m, described as a low arching shrub to about 15 cm.
- `arctostaphylos-uva-ursi:mature_height:usdaplants01` — USDA PLANTS gives a mature height of 0.5 ft (0.15 m).

### mature_spread

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:mature_spread:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 0.91, "max": 1.83, "unit": "m", "raw": "3.00 to 6.00 feet, or more over time"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `arctostaphylos-uva-ursi:mature_spread:rhs01` | Royal Horticultural Society | {"min": 0.1, "max": 0.5, "unit": "m"} | 0.8 | species; RHS plant profile, UK growing conditions | RHS size band is per plant; much narrower than MOBOT (3–6 ft) and E-Flora (mats several metres wide) — RHS bands are coarse |

- `arctostaphylos-uva-ursi:mature_spread:mobot01` — Missouri Botanical Garden gives Arctostaphylos uva-ursi a spread of 3–6 ft (0.9–1.8 m) or more over time.
- `arctostaphylos-uva-ursi:mature_spread:rhs01` — RHS gives Arctostaphylos uva-ursi an ultimate spread of 0.1–0.5 m.

### maintenance_level

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:maintenance_level:mobot01` | Missouri Botanical Garden Plant Finder | "maintenance:low" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `arctostaphylos-uva-ursi:maintenance_level:rhs01` | Royal Horticultural Society | "maintenance:low" | 0.75 | species; RHS plant profile, UK growing conditions | 'pruning group 1' → low |

- `arctostaphylos-uva-ursi:maintenance_level:mobot01` — Missouri Botanical Garden rates maintenance low; plants should not be fertilised.
- `arctostaphylos-uva-ursi:maintenance_level:rhs01` — RHS: pruning group 1 (no routine pruning); generally pest-free.

### ecological_value

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r07 | ["origin:native"] | 0.8 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| [ ] `arctostaphylos-uva-ursi:ecological_value:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["origin:native"] | 0.9 | BC; E-Flora BC atlas page |  |
| [ ] `arctostaphylos-uva-ursi:ecological_value:mobot01` | Missouri Botanical Garden Plant Finder | ["origin:native", "ecology:bird_food", "ecology:erosion_control"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `arctostaphylos-uva-ursi:ecological_value:osu01` | Oregon State University Landscape Plants | ["origin:native"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `arctostaphylos-uva-ursi:ecological_value:usdaplants01` | USDA PLANTS Database | ["origin:native"] | 0.8 | USDA PLANTS characteristics, US-wide conservation plant data |  |
| [ ] `arctostaphylos-uva-ursi:ecological_value:usdaplants02` | USDA PLANTS Database | ["ecology:bird_food", "ecology:wildlife_cover"] | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | compiled from Martin et al. 1951 and Quinlan & Cuccarese 2004 (Alaska) as cited by USDA; ratings are low–moderate, not high |

- `arctostaphylos-uva-ursi:ecological_value:eflora01` — E-Flora BC lists Arctostaphylos uva-ursi as native to BC (provincial list Yellow, rank S5 secure, 2019).
- `arctostaphylos-uva-ursi:ecological_value:mobot01` — Missouri Botanical Garden: native throughout northern North America (Alaska to Newfoundland, south through Canada); fruit eaten by bears, birds and small mammals; helps control soil erosion on slopes.
- `arctostaphylos-uva-ursi:ecological_value:osu01` — Oregon State University: native to Oregon; circumboreal, south to northern California and Virginia.
- `arctostaphylos-uva-ursi:ecological_value:usdaplants01` — USDA PLANTS: native in Alaska, Canada, the lower 48 states, Greenland and St Pierre & Miquelon.
- `arctostaphylos-uva-ursi:ecological_value:usdaplants02` — USDA PLANTS wildlife table: food value moderate for large mammals and low–moderate for terrestrial birds; cover value moderate for small mammals and terrestrial birds.

## compare

### exposure

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:exposure:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["exposure:full_sun", "exposure:part_sun_part_shade"] | 0.7 | BC; E-Flora BC atlas page; inferred from habitat classes, not a cultiv | exposure read off habitat classes |
| [ ] `arctostaphylos-uva-ursi:exposure:mobot01` | Missouri Botanical Garden Plant Finder | ["exposure:full_sun", "exposure:part_sun_part_shade"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | KPU has no 'Exposed' value |
| [ ] `arctostaphylos-uva-ursi:exposure:osu01` | Oregon State University Landscape Plants | ["exposure:full_sun", "exposure:part_sun_part_shade"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `arctostaphylos-uva-ursi:exposure:rhs01` | Royal Horticultural Society | ["exposure:full_sun", "exposure:part_sun_part_shade", "exposure:sheltered"] | 0.85 | species; RHS plant profile, UK growing conditions | KPU has no 'Exposed' value |
| [ ] `arctostaphylos-uva-ursi:exposure:usdaplants01` | USDA PLANTS Database | ["exposure:full_sun", "exposure:part_sun_part_shade"] | 0.65 | USDA PLANTS characteristics, US-wide conservation plant data | 'Shade Tolerance: Medium' → sun to part shade, loose |

- `arctostaphylos-uva-ursi:exposure:eflora01` — E-Flora BC habitat records are exposed, often rocky sites and dry, open-canopy forest.
- `arctostaphylos-uva-ursi:exposure:mobot01` — Missouri Botanical Garden: full sun to part shade; tolerates light shade; likes exposed open sites.
- `arctostaphylos-uva-ursi:exposure:osu01` — Oregon State University: sun or partial shade.
- `arctostaphylos-uva-ursi:exposure:rhs01` — RHS: full sun or partial shade; exposed or sheltered sites; south-, east- or west-facing.
- `arctostaphylos-uva-ursi:exposure:usdaplants01` — USDA PLANTS rates shade tolerance medium.

### seasonal_interest

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:seasonal_interest:inat03` | iNaturalist observations | {"flowering_months": [4, 5, 6], "annotated_n": 33, "share_threshold": 0.1} | 0.5 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | month included when >= 10% of annotated observations; annotations are volunteer-made |
| [ ] `arctostaphylos-uva-ursi:seasonal_interest:inat04` | iNaturalist observations | {"fruiting_months": [8, 9, 10], "annotated_n": 36, "share_threshold": 0.1} | 0.5 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | month included when >= 10% of annotated observations; annotations are volunteer-made |
| [ ] `arctostaphylos-uva-ursi:seasonal_interest:mobot01` | Missouri Botanical Garden Plant Finder | {"flowering_months": [4, 5], "flower_colour": ["White", "Pink"], "foliage_colour": ["Gr… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'white with a pink tinge' → White, Pink; winter bronze foliage recorded under foliage_colour and winter_interest |
| [ ] `arctostaphylos-uva-ursi:seasonal_interest:osu01` | Oregon State University Landscape Plants | {"flower_colour": ["White", "Pink"], "foliage_colour": ["Green"], "fruit": "bright red … | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley | 'white-tinged pink' → White, Pink; bloom timing not stated |
| [ ] `arctostaphylos-uva-ursi:seasonal_interest:osu02` | Oregon State University Landscape Plants | {"foliage_colour": ["Green", "Bronze"], "winter_interest": true, "evergreen": true} | 0.8 | cultivar: 'Vancouver Jade'; Oregon State University Landscape Plants,  | 'red-bronze' → Bronze |
| [ ] `arctostaphylos-uva-ursi:seasonal_interest:rhs01` | Royal Horticultural Society | {"flower_colour": ["Pink"], "foliage_colour": ["Green"], "fruit": "bright scarlet, autu… | 0.85 | species; RHS plant profile, UK growing conditions | 'pale pink' → Pink; 'mid-green' → Green; summer flowering not mapped to months |
| [ ] `arctostaphylos-uva-ursi:seasonal_interest:rhs02` | Royal Horticultural Society | {"flower_colour": ["Pink"], "foliage_colour": ["Green", "Red"], "fruit": "red berries, … | 0.8 | cultivar: 'Vancouver Jade'; RHS plant profile, UK growing conditions | red-flushed new growth → Red added to foliage_colour; summer flowering not mapped to months |
| [ ] `arctostaphylos-uva-ursi:seasonal_interest:usdaplants01` | USDA PLANTS Database | {"flower_colour": ["Purple"], "flowering_months": [5, 6], "foliage_colour": ["Green"], … | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | 'Late Spring' → months 5–6; 'Dark Green' → Green; USDA 'Purple' flower colour contradicts RHS/OSU/E-Flora/MOBOT (pink-white) |

- `arctostaphylos-uva-ursi:seasonal_interest:inat03` — iNaturalist phenology annotations in Greater Vancouver (n=33) put flowering mainly in months 4, 5, 6.
- `arctostaphylos-uva-ursi:seasonal_interest:inat04` — iNaturalist phenology annotations in Greater Vancouver (n=36) put fruiting mainly in months 8, 9, 10.
- `arctostaphylos-uva-ursi:seasonal_interest:mobot01` — Missouri Botanical Garden: white flowers with a pink tinge in April–May; dark green evergreen leaves turning bronze in winter; red fruit from late summer, often held through winter; year-round interest.
- `arctostaphylos-uva-ursi:seasonal_interest:osu01` — Oregon State University: evergreen lustrous dark green leaves; white, pink-tinged urn-shaped flowers in nodding terminal clusters; bright red drupes about 6 mm, not always produced.
- `arctostaphylos-uva-ursi:seasonal_interest:osu02` — Oregon State University: 'Vancouver Jade' has glossy green leaves that turn red-bronze in winter.
- `arctostaphylos-uva-ursi:seasonal_interest:rhs01` — RHS: evergreen; pale pink bell-shaped flowers in summer; bright scarlet fruit in autumn; oval mid-green leaves.
- `arctostaphylos-uva-ursi:seasonal_interest:rhs02` — RHS: 'Vancouver Jade' is evergreen with red-flushed new shoots, small pink flowers in summer and red berries in autumn.
- `arctostaphylos-uva-ursi:seasonal_interest:usdaplants01` — USDA PLANTS: conspicuous purple flowers in late spring, dark green leaves retained, conspicuous fall colour, red fruit summer to fall that persists.

### texture

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:texture:usdaplants01` | USDA PLANTS Database | "texture:coarse" | 0.65 | USDA PLANTS characteristics, US-wide conservation plant data | recorded as given; the leaves are small (1–3 cm), so Kay may wish to check against KPU's rating |

- `arctostaphylos-uva-ursi:texture:usdaplants01` — USDA PLANTS rates foliage texture coarse.

### form

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:form:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | "form:creeping_mat_like" | 0.85 | BC; E-Flora BC atlas page |  |
| [ ] `arctostaphylos-uva-ursi:form:mobot01` | Missouri Botanical Garden Plant Finder | "form:creeping_mat_like" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `arctostaphylos-uva-ursi:form:osu01` | Oregon State University Landscape Plants | "form:creeping_mat_like" | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `arctostaphylos-uva-ursi:form:usdaplants01` | USDA PLANTS Database | "form:creeping_mat_like" | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data | 'Prostrate' → Creeping / Mat-like |

- `arctostaphylos-uva-ursi:form:eflora01` — E-Flora BC: evergreen prostrate shrub with trailing, rooting stems, sometimes forming mats several metres wide.
- `arctostaphylos-uva-ursi:form:mobot01` — Missouri Botanical Garden: creeping, prostrate, woody evergreen shrub.
- `arctostaphylos-uva-ursi:form:osu01` — Oregon State University: mat-forming evergreen ground cover whose branches root where they touch the soil.
- `arctostaphylos-uva-ursi:form:usdaplants01` — USDA PLANTS: shape and orientation prostrate; growth habit shrub / subshrub.

### soil_type

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:soil_type:mobot01` | Missouri Botanical Garden Plant Finder | ["soil:acidic", "soil:well_drained", "soil:rocky_or_gravelly_or_dry"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'sandy or gritty, poor infertile' → Rocky or gravelly or dry |
| [ ] `arctostaphylos-uva-ursi:soil_type:osu01` | Oregon State University Landscape Plants | ["soil:acidic", "soil:rocky_or_gravelly_or_dry"] | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | 'poor, sandy, infertile' → Rocky or gravelly or dry (loose); limestone tolerance not mapped to Alkaline |
| [ ] `arctostaphylos-uva-ursi:soil_type:rhs01` | Royal Horticultural Society | ["soil:well_drained"] | 0.8 | species; RHS plant profile, UK growing conditions | clay/loam/sand have no KPU class; 'acid or neutral' not mapped to Acidic (template convention), although the cultivation note says lime-free |
| [ ] `arctostaphylos-uva-ursi:soil_type:rhs02` | Royal Horticultural Society | ["soil:acidic", "soil:well_drained"] | 0.8 | cultivar: 'Vancouver Jade'; RHS plant profile, UK growing conditions | pH 'Acid' → Acidic; clay/loam/sand have no KPU class |
| [ ] `arctostaphylos-uva-ursi:soil_type:usdaplants01` | USDA PLANTS Database | ["soil:well_drained"] | 0.65 | USDA PLANTS characteristics, US-wide conservation plant data | pH range spans acid to mildly alkaline so neither Acidic nor Alkaline is mapped; coarse/medium soils with no waterlogging tolerance → Well-d |

- `arctostaphylos-uva-ursi:soil_type:mobot01` — Missouri Botanical Garden: acidic, dry to medium, well-drained sandy or gritty soils; grows well in poor infertile soils.
- `arctostaphylos-uva-ursi:soil_type:osu01` — Oregon State University: prefers poor, sandy, infertile, acidic soils; reported to grow well on limestone rock.
- `arctostaphylos-uva-ursi:soil_type:rhs01` — RHS: well-drained clay, loam or sand; acid or neutral; cultivation summary asks for lime-free soil.
- `arctostaphylos-uva-ursi:soil_type:rhs02` — RHS: 'Vancouver Jade' in acid, moist but well-drained clay, loam or sand.
- `arctostaphylos-uva-ursi:soil_type:usdaplants01` — USDA PLANTS: pH 5.5–8.0; adapted to coarse and medium but not fine-textured soils; no anaerobic tolerance; low fertility requirement; medium CaCO3 tolerance.

### growth_rate

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:growth_rate:mobot01` | Missouri Botanical Garden Plant Finder | "growth_rate:slow" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `arctostaphylos-uva-ursi:growth_rate:usdaplants01` | USDA PLANTS Database | "growth_rate:moderate" | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | MOBOT says slow-growing; both kept (R1) |

- `arctostaphylos-uva-ursi:growth_rate:mobot01` — Missouri Botanical Garden describes the plant as slow-growing.
- `arctostaphylos-uva-ursi:growth_rate:usdaplants01` — USDA PLANTS rates growth rate moderate.

### landscape_use

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:landscape_use:mobot01` | Missouri Botanical Garden Plant Finder | ["use:ground_cover", "use:group_or_mass_planting", "use:erosion_control", "use:attract_… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'moderate to large scale ground cover' → Ground cover + Group or mass planting; 'naturalized areas' and 'drape over a wall' have no exact KP |
| [ ] `arctostaphylos-uva-ursi:landscape_use:osu01` | Oregon State University Landscape Plants | ["use:ground_cover"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `arctostaphylos-uva-ursi:landscape_use:rhs01` | Royal Horticultural Society | ["use:ground_cover", "use:rock_garden"] | 0.8 | species; RHS plant profile, UK growing conditions | 'gravel garden' → Rock garden (loose); 'Mediterranean climate plants' has no KPU value |
| [ ] `arctostaphylos-uva-ursi:landscape_use:rhs02` | Royal Horticultural Society | ["use:container_planting", "use:ground_cover"] | 0.8 | cultivar: 'Vancouver Jade'; RHS plant profile, UK growing conditions | 'banks and slopes', 'cottage and informal garden' and 'underplanting' have no exact KPU value |

- `arctostaphylos-uva-ursi:landscape_use:mobot01` — Missouri Botanical Garden: moderate- to large-scale ground cover with year-round interest; erosion control on slopes; around shrubs, sunny border margins, naturalised areas, native plant gardens, herb gardens, draped over walls, rock gardens; attracts birds.
- `arctostaphylos-uva-ursi:landscape_use:osu01` — Oregon State University lists the plant as an evergreen ground cover.
- `arctostaphylos-uva-ursi:landscape_use:rhs01` — RHS suggests ground cover, gravel gardens and Mediterranean-climate plantings.
- `arctostaphylos-uva-ursi:landscape_use:rhs02` — RHS suggests 'Vancouver Jade' for patio containers, cottage and informal gardens, banks and slopes, ground cover and underplanting of roses and shrubs.

### pest_susceptibility

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:pest_susceptibility:mobot01` | Missouri Botanical Garden Plant Finder | ["pest:root_rot", "pest:mildew", "pest:galls", "pest:fungal_leaf_spot", "pest:rust"] | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | conditional susceptibilities only; 'black mildew' → Mildew, 'leaf gall' → Galls |
| [ ] `arctostaphylos-uva-ursi:pest_susceptibility:rhs01` | Royal Horticultural Society | ["pest:fungal_leaf_spot"] | 0.75 | species; RHS plant profile, UK growing conditions | 'leaf spot' (pathogen unspecified) → Fungal leaf spot |

- `arctostaphylos-uva-ursi:pest_susceptibility:mobot01` — Missouri Botanical Garden: no serious insect or disease problems; on poorly drained sites or in hotter climates than preferred it becomes more susceptible to root rot, black mildew, leaf gall, leaf spot and rust.
- `arctostaphylos-uva-ursi:pest_susceptibility:rhs01` — RHS: generally pest-free; may be susceptible to leaf spot.

### resistances

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:resistances:mobot01` | Missouri Botanical Garden Plant Finder | ["stress:drought"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `arctostaphylos-uva-ursi:resistances:mobot02` | Missouri Botanical Garden Plant Finder | ["stress:erosion"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | from the 'Tolerate' line of the profile; 'erosion' is outside the resistances starter list (open list) |
| [ ] `arctostaphylos-uva-ursi:resistances:osu01` | Oregon State University Landscape Plants | ["stress:salt"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `arctostaphylos-uva-ursi:resistances:rhs01` | Royal Horticultural Society | ["stress:drought"] | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `arctostaphylos-uva-ursi:resistances:usdaplants01` | USDA PLANTS Database | ["stress:drought"] | 0.8 | USDA PLANTS characteristics, US-wide conservation plant data |  |
| [ ] `arctostaphylos-uva-ursi:resistances:usdaplants02` | USDA PLANTS Database | ["stress:salt"] | 0.6 | USDA PLANTS characteristics, US-wide conservation plant data | 'Salinity Tolerance: Medium' — borderline; recorded at low confidence; OSU says good salt tolerance |

- `arctostaphylos-uva-ursi:resistances:mobot01` — Missouri Botanical Garden: drought tolerant once established.
- `arctostaphylos-uva-ursi:resistances:mobot02` — Missouri Botanical Garden lists Arctostaphylos uva-ursi as tolerating erosion.
- `arctostaphylos-uva-ursi:resistances:osu01` — Oregon State University: good salt tolerance.
- `arctostaphylos-uva-ursi:resistances:rhs01` — RHS flags the plant as drought resistant.
- `arctostaphylos-uva-ursi:resistances:usdaplants01` — USDA PLANTS rates drought tolerance high and moisture use low.
- `arctostaphylos-uva-ursi:resistances:usdaplants02` — USDA PLANTS rates salinity tolerance medium.

## extended

### time_to_intended_size

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:time_to_intended_size:rhs01` | Royal Horticultural Society | {"min": 2, "max": 5, "unit": "years", "measure": "time to ultimate height"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `arctostaphylos-uva-ursi:time_to_intended_size:rhs02` | Royal Horticultural Society | {"min": 2, "max": 5, "unit": "years", "measure": "time to ultimate height"} | 0.85 | cultivar: 'Vancouver Jade'; RHS plant profile, UK growing conditions |  |

- `arctostaphylos-uva-ursi:time_to_intended_size:rhs01` — RHS gives Arctostaphylos uva-ursi 2–5 years to reach its ultimate height.
- `arctostaphylos-uva-ursi:time_to_intended_size:rhs02` — RHS gives 'Vancouver Jade' 2–5 years to reach its ultimate height.

### behaviour_with_others

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:behaviour_with_others:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"spread": "trailing stems root along their length; mats sometimes several metres wide"… | 0.85 | BC; E-Flora BC atlas page | mat width is qualitative, so it is kept here rather than in mature_spread |
| [ ] `arctostaphylos-uva-ursi:behaviour_with_others:mobot01` | Missouri Botanical Garden Plant Finder | {"spread": "spreads over time by flexible branches rooting at the nodes, to 3–6 ft wide… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `arctostaphylos-uva-ursi:behaviour_with_others:osu01` | Oregon State University Landscape Plants | {"spread": "mat-forming; branches root where they touch the soil", "transplanting": "di… | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `arctostaphylos-uva-ursi:behaviour_with_others:usdaplants01` | USDA PLANTS Database | {"growth_form": "multiple stem", "vegetative_spread_rate": "moderate", "seed_spread_rat… | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `arctostaphylos-uva-ursi:behaviour_with_others:eflora01` — E-Flora BC: trailing, rooting stems form mats to several metres across; deep-rooting on dry sites.
- `arctostaphylos-uva-ursi:behaviour_with_others:mobot01` — Missouri Botanical Garden: spreads by branches rooting at the nodes to 3–6 ft or more; established plants do not tolerate root disturbance and are hard to divide or transplant.
- `arctostaphylos-uva-ursi:behaviour_with_others:osu01` — Oregon State University: mat-forming, rooting along the branches; difficult to transplant.
- `arctostaphylos-uva-ursi:behaviour_with_others:usdaplants01` — USDA PLANTS: multi-stemmed, moderate vegetative spread but slow seed spread and low seedling vigour; does not resprout or coppice, low fire tolerance; flagged as a known allelopath; long-lived.

### toxicity

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:toxicity:usdaplants01` | USDA PLANTS Database | {"usda_rating": "none", "humans": "unknown", "pets": "unknown"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | M17: USDA 'Toxicity' is a livestock / conservation-planting rating; humans and pets stay unknown. RHS carries a separate 'potentially harmfu |

- `arctostaphylos-uva-ursi:toxicity:usdaplants01` — USDA PLANTS lists toxicity as none.

### vancouver_context

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `arctostaphylos-uva-ursi:vancouver_context:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"habitat": ["dry forest", "exposed sites", "rocky", "shallow soils", "rock outcrops", … | 0.9 | BC; E-Flora BC atlas page | BEC zone list from the atlas station records; the plant is primarily an interior / dry-site species in BC, so Vancouver fit rests on free-dr |
| [ ] `arctostaphylos-uva-ursi:vancouver_context:inat01` | iNaturalist observations | {"licensed_verifiable_observations": 495, "research_grade": 432, "all_licences": 613, "… | 0.6 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | presence evidence; observation counts reflect observer effort as much as abundance |
| [ ] `arctostaphylos-uva-ursi:vancouver_context:inat02` | iNaturalist observations | {"observations_by_month": {"1": 42, "2": 23, "3": 49, "4": 99, "5": 33, "6": 45, "7": 3… | 0.55 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | observer effort, not plant activity — the plant is evergreen/visible year-round; use for 'when people notice it', not phenology |

- `arctostaphylos-uva-ursi:vancouver_context:eflora01` — E-Flora BC: common throughout BC in dry forests and exposed, often rocky sites from lowland to lower alpine; modal zone is Interior Douglas-fir (dry interior), with only 92 of 5,666 plots in the Coastal Western Hemlock zone that Vancouver sits in; mean soil moisture regime 2 (subxeric).
- `arctostaphylos-uva-ursi:vancouver_context:inat01` — iNaturalist holds 495 openly licensed verifiable observations of this plant in Greater Vancouver (432 research grade), recorded 2015–2026.
- `arctostaphylos-uva-ursi:vancouver_context:inat02` — Monthly spread of 495 Greater Vancouver observations: most in 4, 10, 3 (month numbers).
