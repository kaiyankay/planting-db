# Review: *Cornus sericea* — 65 unverified claims on 20 fields · 2026-11-02

Grouped by field; every live claim on the field is shown (verified ones too) so values can be compared side by side. Tick the id to keep as verified, strike it to reject. Then:

```bash
python3 -I tools/verify_claims.py plants/cornus-sericea.json --by Kay <ids…>     # or --source rhs
```

Values are structured only; `text` was written from the value, never copied. *mapping* flags where a source term was forced into the KPU vocabulary.
KPU (tier C) is linked from the entity only; none of its values are stored, even where its page shows a figure that disagrees with the sources below (D2).

## Sources in this review

- **E-Flora BC: Electronic Atlas of the Flora of British Columbia** (`eflora`, tier B, checked 2026-10-29): Home page (linnet.geog.ubc.ca/biodiversity/eflora/, 2026-10-29): 'All content on E-Flora BC is covered by Canadian Copyright Law.' Photographs: 'adherence to copyright law is the responsibility of the photographer' — 'Co…
- **Great Plant Picks** (`gpp`, tier B, checked 2026-10-29): No terms page. Footer (greatplantpicks.org, 2026-10-29): 'Text and photos ©2025 Great Plant Picks/Elisabeth Carey Miller Garden except where otherwise noted'. GPP describes itself as 'the primary educational program of t…
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
| [ ] `cornus-sericea:hardiness_zone:gpp01` | Great Plant Picks | {"min": 3, "max": 8, "unit": "USDA"} | 0.85 | cultivar:'Baileyi'; Great Plant Picks, maritime Pacific Northwest | GPP has no species-level entry for Cornus sericea; this is the cultivar 'Baileyi' page (sizes are for the cultivar) |
| [ ] `cornus-sericea:hardiness_zone:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 3, "max": 7, "unit": "USDA"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cornus-sericea:hardiness_zone:osu01` | Oregon State University Landscape Plants | {"usda_min": 2, "unit": "USDA"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cornus-sericea:hardiness_zone:rhs01` | Royal Horticultural Society | {"rating": "H7", "unit": "RHS", "approx_max_c": -20} | 0.85 | species; RHS plant profile, UK growing conditions | RHS H-scale; H7 is the top of the scale (< -20 °C); not converted to Canadian or USDA zones |

- `cornus-sericea:hardiness_zone:gpp01` — Great Plant Picks lists Cornus sericea 'Baileyi' for USDA zones 3 to 8.
- `cornus-sericea:hardiness_zone:mobot01` — Missouri Botanical Garden lists Cornus sericea for USDA zones 3 to 7.
- `cornus-sericea:hardiness_zone:osu01` — Oregon State University: hardy to USDA zone 2.
- `cornus-sericea:hardiness_zone:rhs01` — RHS rates Cornus sericea hardiness H7 (very hardy, below about -20 °C).

### invasive_status

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:invasive_status:iscbc01` | Invasive Species Council of BC | "invasive:not_listed" | 0.9 | BC; ISCBC online species profiles only |  |

- `cornus-sericea:invasive_status:iscbc01` — Cornus sericea is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-11-02); it is a BC native.

### water_drainage

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:water_drainage:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | "water:wet" | 0.75 | BC; E-Flora BC atlas page; habitat moisture, not a cultivation rating | 'wet to mesic' → wet; station soil-moisture regime spans 0–8 with mean 4 (mesic), so mesic sites are also occupied |
| [ ] `cornus-sericea:water_drainage:gpp01` | Great Plant Picks | "water:wide_range" | 0.8 | cultivar:'Baileyi'; Great Plant Picks, maritime Pacific Northwest | 'damp or dry' and 'well-drained to wet locations' → wide_range; GPP has no species-level entry for Cornus sericea; this is the cultivar 'Bai |
| [ ] `cornus-sericea:water_drainage:mobot01` | Missouri Botanical Garden Plant Finder | "water:moist" | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'medium to wet' → moist; wet/boggy tolerance recorded under resistances |
| [ ] `cornus-sericea:water_drainage:osu01` | Oregon State University Landscape Plants | "water:moist" | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | 'moist, well-drained' → moist |
| [ ] `cornus-sericea:water_drainage:rhs01` | Royal Horticultural Society | "water:moist" | 0.75 | species; RHS plant profile, UK growing conditions | 'moist but well-drained or poorly-drained' → moist; the poorly-drained tolerance is also recorded under resistances |
| [ ] `cornus-sericea:water_drainage:usdaplants01` | USDA PLANTS Database | "water:moist" | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data; characte | high anaerobic tolerance (saturated soils) noted; recorded as moist rather than wet |

- `cornus-sericea:water_drainage:eflora01` — E-Flora BC: wet to mesic streamsides, lakesides and swamps on very moist to wet soils; tolerates fluctuating groundwater tables.
- `cornus-sericea:water_drainage:gpp01` — Great Plant Picks: regular watering in well-drained, clay or sandy soils; tolerates damp or dry soils and winter-wet / summer-dry sites.
- `cornus-sericea:water_drainage:mobot01` — Missouri Botanical Garden: water medium to wet; best in consistently moist soil; tolerates swampy or boggy conditions.
- `cornus-sericea:water_drainage:osu01` — Oregon State University: best in moist, well-drained soil; adapts to many soil types.
- `cornus-sericea:water_drainage:rhs01` — RHS: moist but well-drained or poorly-drained.
- `cornus-sericea:water_drainage:usdaplants01` — USDA PLANTS: moisture use high, drought tolerance low, anaerobic tolerance high.

### mature_height

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:mature_height:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"min": 1, "max": 6, "unit": "m"} | 0.85 | BC; E-Flora BC atlas page |  |
| [ ] `cornus-sericea:mature_height:gpp01` | Great Plant Picks | {"height_m": 4.27, "unit": "m", "raw": "14 ft"} | 0.85 | cultivar:'Baileyi'; Great Plant Picks, maritime Pacific Northwest | GPP has no species-level entry for Cornus sericea; this is the cultivar 'Baileyi' page (sizes are for the cultivar) |
| [ ] `cornus-sericea:mature_height:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 1.8, "max": 2.7, "unit": "m", "raw": "6–9 ft"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cornus-sericea:mature_height:osu01` | Oregon State University Landscape Plants | {"min": 2, "max": 3, "unit": "m", "raw": "7–10 ft or more"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cornus-sericea:mature_height:rhs01` | Royal Horticultural Society | {"min": 1.5, "max": 2.5, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `cornus-sericea:mature_height:usdaplants01` | USDA PLANTS Database | {"height_m": 3.7, "unit": "m", "raw": "12 ft mature; 12 ft maximum at 20 years"} | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data; characte |  |

- `cornus-sericea:mature_height:eflora01` — E-Flora BC gives Cornus sericea a height of 1–6 m.
- `cornus-sericea:mature_height:gpp01` — Great Plant Picks gives Cornus sericea 'Baileyi' a mature height of 14 ft (4.3 m).
- `cornus-sericea:mature_height:mobot01` — Missouri Botanical Garden gives Cornus sericea a height of 6–9 ft (1.8–2.7 m).
- `cornus-sericea:mature_height:osu01` — Oregon State University gives Cornus sericea a height of 7–10 ft (2–3 m) or more.
- `cornus-sericea:mature_height:rhs01` — RHS gives Cornus sericea an ultimate height of 1.5–2.5 m.
- `cornus-sericea:mature_height:usdaplants01` — USDA PLANTS gives a mature height of 12 ft (3.7 m), reached within 20 years.

### mature_spread

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:mature_spread:gpp01` | Great Plant Picks | {"spread_m": 4.88, "unit": "m", "raw": "16 ft"} | 0.85 | cultivar:'Baileyi'; Great Plant Picks, maritime Pacific Northwest | GPP has no species-level entry for Cornus sericea; this is the cultivar 'Baileyi' page (sizes are for the cultivar) |
| [ ] `cornus-sericea:mature_spread:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 2.1, "max": 3, "unit": "m", "raw": "7–10 ft"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | per plant; suckers into thickets if not controlled (see behaviour_with_others) |
| [ ] `cornus-sericea:mature_spread:rhs01` | Royal Horticultural Society | {"min": 2.5, "max": 4, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions | per plant; the species suckers into colonies (see behaviour_with_others) |

- `cornus-sericea:mature_spread:gpp01` — Great Plant Picks gives Cornus sericea 'Baileyi' a mature spread of 16 ft (4.9 m).
- `cornus-sericea:mature_spread:mobot01` — Missouri Botanical Garden gives Cornus sericea a spread of 7–10 ft (2.1–3 m), slightly larger than its height.
- `cornus-sericea:mature_spread:rhs01` — RHS gives Cornus sericea an ultimate spread of 2.5–4 m.

### maintenance_level

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:maintenance_level:mobot01` | Missouri Botanical Garden Plant Finder | "maintenance:medium" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |

- `cornus-sericea:maintenance_level:mobot01` — Missouri Botanical Garden rates maintenance medium (optional annual removal of 20–25 % of the oldest stems, or coppicing every 2–3 years, for stem colour; sucker removal if spread is unwanted).

### ecological_value

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r10 | ["origin:native"] | 0.8 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| [ ] `cornus-sericea:ecological_value:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["origin:native"] | 0.9 | BC; E-Flora BC atlas page |  |
| [ ] `cornus-sericea:ecological_value:gpp01` | Great Plant Picks | ["ecology:bird_food", "ecology:pollinator"] | 0.85 | cultivar:'Baileyi'; Great Plant Picks, maritime Pacific Northwest | 'bees, butterflies' → pollinator; GPP has no species-level entry for Cornus sericea; this is the cultivar 'Baileyi' page (sizes are for the  |
| [ ] `cornus-sericea:ecological_value:mobot01` | Missouri Botanical Garden Plant Finder | ["origin:native", "ecology:bird_food", "ecology:pollinator", "ecology:erosion_control"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'attracts butterflies' → pollinator |
| [ ] `cornus-sericea:ecological_value:osu01` | Oregon State University Landscape Plants | ["origin:native"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cornus-sericea:ecological_value:rhs01` | Royal Horticultural Society | ["ecology:pollinator"] | 0.8 | species; RHS plant profile, UK growing conditions | RHS Plants for Pollinators designation → pollinator |
| [ ] `cornus-sericea:ecological_value:usdaplants01` | USDA PLANTS Database | ["origin:native"] | 0.8 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `cornus-sericea:ecological_value:eflora01` — E-Flora BC lists Cornus sericea as native to BC (provincial list Yellow, rank S5 2019, secure; COSEWIC not listed).
- `cornus-sericea:ecological_value:gpp01` — Great Plant Picks: fruit attractive to birds; wildlife associations bees and butterflies.
- `cornus-sericea:ecological_value:mobot01` — Missouri Botanical Garden: native to much of North America (wet swampy areas, wetland margins, lakes and rivers); fruit attractive to birds; flowers attract butterflies; spreading roots help combat soil erosion.
- `cornus-sericea:ecological_value:osu01` — Oregon State University: native to Oregon and to northern North America south to Virginia, southern California and Chihuahua.
- `cornus-sericea:ecological_value:rhs01` — RHS lists Cornus sericea under Plants for Pollinators.
- `cornus-sericea:ecological_value:usdaplants01` — USDA PLANTS: native in Alaska, Canada, the lower 48 states and St Pierre and Miquelon.

## compare

### exposure

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:exposure:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["exposure:full_sun", "exposure:part_sun_part_shade", "exposure:filtered_shade"] | 0.7 | BC; E-Flora BC atlas page; inferred from habitat classes, not a cultiv | exposure read off habitat classes and the 'shade-tolerant/intolerant' ecology wording |
| [ ] `cornus-sericea:exposure:gpp01` | Great Plant Picks | ["exposure:full_sun", "exposure:part_sun_part_shade", "exposure:filtered_shade"] | 0.85 | cultivar:'Baileyi'; Great Plant Picks, maritime Pacific Northwest | 'light to dappled shade' → Part sun/part shade + Filtered shade; GPP has no species-level entry for Cornus sericea; this is the cultivar 'Ba |
| [ ] `cornus-sericea:exposure:mobot01` | Missouri Botanical Garden Plant Finder | ["exposure:full_sun", "exposure:part_sun_part_shade"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cornus-sericea:exposure:osu01` | Oregon State University Landscape Plants | ["exposure:full_sun", "exposure:part_sun_part_shade"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cornus-sericea:exposure:rhs01` | Royal Horticultural Society | ["exposure:full_sun", "exposure:part_sun_part_shade", "exposure:sheltered"] | 0.85 | species; RHS plant profile, UK growing conditions | KPU has no 'Exposed' value |
| [ ] `cornus-sericea:exposure:usdaplants01` | USDA PLANTS Database | ["exposure:part_sun_part_shade", "exposure:filtered_shade"] | 0.65 | USDA PLANTS characteristics, US-wide conservation plant data; characte | 'Shade Tolerance: High' mapped to part and filtered shade — loose; other sources give sun to part shade |

- `cornus-sericea:exposure:eflora01` — E-Flora BC habitat records span open streamsides, swamps and clearings as well as forest; the ecology note calls it shade-tolerant to shade-intolerant.
- `cornus-sericea:exposure:gpp01` — Great Plant Picks: full sun or light to dappled shade; a sunnier site gives brighter winter stems.
- `cornus-sericea:exposure:mobot01` — Missouri Botanical Garden: full sun to part shade.
- `cornus-sericea:exposure:osu01` — Oregon State University: sun to part shade.
- `cornus-sericea:exposure:rhs01` — RHS: full sun or partial shade; exposed or sheltered sites; any aspect.
- `cornus-sericea:exposure:usdaplants01` — USDA PLANTS rates shade tolerance high.

### seasonal_interest

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r10 | {"winter_interest": "colourful bark"} | 0.8 | Metro Vancouver, hypothetical plant list (survey d1) | 'colorful bark' read as winter interest (stem colour shows after leaf fall) |
| [ ] `cornus-sericea:seasonal_interest:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"flower_colour": ["White"], "foliage_colour": ["Green"], "fall_colour": "reddish", "fr… | 0.85 | BC; E-Flora BC atlas page | 'white to greenish-white' → White; no flowering season given |
| [ ] `cornus-sericea:seasonal_interest:gpp01` | Great Plant Picks | {"flowering_months": [5, 6], "flower_colour": ["White"], "foliage_colour": ["Green"], "… | 0.85 | cultivar:'Baileyi'; Great Plant Picks, maritime Pacific Northwest | 'late spring' → months 5–6; GPP has no species-level entry for Cornus sericea; this is the cultivar 'Baileyi' page (sizes are for the cultiv |
| [ ] `cornus-sericea:seasonal_interest:inat03` | iNaturalist observations | {"flowering_months": [5, 7, 8], "annotated_n": 39, "share_threshold": 0.1} | 0.5 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | month included when >= 10% of annotated observations; annotations are volunteer-made |
| [ ] `cornus-sericea:seasonal_interest:inat04` | iNaturalist observations | {"fruiting_months": [7, 8, 9], "annotated_n": 68, "share_threshold": 0.1} | 0.5 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | month included when >= 10% of annotated observations; annotations are volunteer-made |
| [ ] `cornus-sericea:seasonal_interest:mobot01` | Missouri Botanical Garden Plant Finder | {"flowering_months": [5, 6], "flower_colour": ["White"], "foliage_colour": ["Green"], "… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'May to June' → months 5–6 |
| [ ] `cornus-sericea:seasonal_interest:osu01` | Oregon State University Landscape Plants | {"flowering_months": [5, 6], "flower_colour": ["White"], "foliage_colour": ["Green"], "… | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley | 'late spring to early summer' → months 5–6; 'dull white' → White |
| [ ] `cornus-sericea:seasonal_interest:rhs01` | Royal Horticultural Society | {"flower_colour": ["White"], "foliage_colour": ["Green"], "fall_colour": "red", "fruit"… | 0.85 | species; RHS plant profile, UK growing conditions | 'creamy white' → White; flower and fruit seasons not stated on the page, so no flowering_months |
| [ ] `cornus-sericea:seasonal_interest:usdaplants01` | USDA PLANTS Database | {"flowering_months": [4, 5], "flower_colour": ["White"], "foliage_colour": ["Green"], "… | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data; characte | 'Spring' → months 4–5 (loose) |

- `cornus-sericea:seasonal_interest:eflora01` — E-Flora BC: deciduous; white to greenish-white flowers in flat-topped clusters 2–4 cm wide; white (sometimes blue-tinged) drupes; leaves turn reddish in autumn; young branches bright reddish to reddish-purple.
- `cornus-sericea:seasonal_interest:gpp01` — Great Plant Picks: deciduous; white flower clusters in late spring; white berries late summer to early fall; autumn foliage colour; bright red winter stems.
- `cornus-sericea:seasonal_interest:inat03` — iNaturalist phenology annotations in Greater Vancouver (n=39) put flowering mainly in months 5, 7, 8.
- `cornus-sericea:seasonal_interest:inat04` — iNaturalist phenology annotations in Greater Vancouver (n=68) put fruiting mainly in months 7, 8, 9.
- `cornus-sericea:seasonal_interest:mobot01` — Missouri Botanical Garden: showy white flowers May–June, white (sometimes bluish) drupes in summer, good red-to-orange fall colour, bright red winter stems.
- `cornus-sericea:seasonal_interest:osu01` — Oregon State University: deciduous; small dull-white flowers in flat clusters late spring to early summer; white globose fruit; leaves reddish to purplish in fall; bright to dark red stems, most attractive in winter.
- `cornus-sericea:seasonal_interest:rhs01` — RHS: deciduous; mid-green leaves with grey undersides turning red in autumn; creamy-white flowers in corymbs; white berries; deep to bright red winter stems.
- `cornus-sericea:seasonal_interest:usdaplants01` — USDA PLANTS: conspicuous white flowers in spring, conspicuous white fruit in summer, conspicuous fall colour, leaves not retained.

### texture

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:texture:usdaplants01` | USDA PLANTS Database | "texture:coarse" | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data; characte |  |

- `cornus-sericea:texture:usdaplants01` — USDA PLANTS rates foliage texture coarse.

### habit

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:habit:osu01` | Oregon State University Landscape Plants | "habit:spreading" | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | 'spreading habit with upright stems' → Spreading |
| [ ] `cornus-sericea:habit:rhs01` | Royal Horticultural Society | "habit:spreading" | 0.8 | species; RHS plant profile, UK growing conditions | 'Suckering' → Spreading |

- `cornus-sericea:habit:osu01` — Oregon State University: spreading habit with upright, slender stems; multi-stemmed.
- `cornus-sericea:habit:rhs01` — RHS: suckering habit.

### soil_type

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:soil_type:rhs01` | Royal Horticultural Society | ["soil:acidic", "soil:alkaline"] | 0.75 | species; RHS plant profile, UK growing conditions | chalk/clay/loam/sand have no KPU class; 'acid or alkaline or neutral' recorded as both Acidic and Alkaline (tolerates either) — loose |
| [ ] `cornus-sericea:soil_type:usdaplants01` | USDA PLANTS Database | ["soil:acidic"] | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data; characte | pH floor 4.8 → Acidic; 'CaCO3 Tolerance: None' so not Alkaline |

- `cornus-sericea:soil_type:rhs01` — RHS: chalk, clay, loam or sand; acid, alkaline or neutral pH.
- `cornus-sericea:soil_type:usdaplants01` — USDA PLANTS: pH 4.8–7.5, adapted to coarse, medium and fine soils, no CaCO3 tolerance.

### growth_rate

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:growth_rate:usdaplants01` | USDA PLANTS Database | "growth_rate:moderate" | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data; characte |  |

- `cornus-sericea:growth_rate:usdaplants01` — USDA PLANTS rates growth rate moderate.

### landscape_use

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:landscape_use:mobot01` | Missouri Botanical Garden Plant Finder | ["use:hedge_row", "use:waterside_planting", "use:group_or_mass_planting", "use:specimen… | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'Rain Garden' → Waterside planting (loose); 'property line screen' → Screening; 'Hedge' → Hedge row |
| [ ] `cornus-sericea:landscape_use:rhs01` | Royal Horticultural Society | ["use:erosion_control", "use:mixed_shrub_border", "use:winter_interest"] | 0.8 | species; RHS plant profile, UK growing conditions | 'banks and slopes' → Erosion control; 'flower borders and beds' → Mixed shrub border; 'cottage and informal garden' has no KPU value; Winter |

- `cornus-sericea:landscape_use:mobot01` — Missouri Botanical Garden suggests hedge and rain-garden use; massed or as a specimen, in shrub borders, naturalistic moist plantings, wet low spots and stream or pond edges for erosion control, and as a property-line screen; attracts birds and butterflies; winter interest and good fall colour.
- `cornus-sericea:landscape_use:rhs01` — RHS suggests cottage and informal gardens, banks and slopes, and flower borders and beds; winter stem colour is the main feature.

### pest_susceptibility

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:pest_susceptibility:mobot01` | Missouri Botanical Garden Plant Finder | ["pest:blight_or_needle_cast", "pest:canker_or_sap_rot", "pest:fungal_leaf_spot", "pest… | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'leaf spots' → Fungal leaf spot (assumed fungal); bagworms → Caterpillar or cutworm (loose); canker stress is flagged for hot humid climates |
| [ ] `cornus-sericea:pest_susceptibility:rhs01` | Royal Horticultural Society | ["pest:scale_insects", "pest:anthracnose", "pest:root_rot"] | 0.7 | species; RHS plant profile, UK growing conditions | honey fungus (Armillaria) mapped to Root rot — loose; 'generally pest-free' not stored as a resistance because specific susceptibilities are |

- `cornus-sericea:pest_susceptibility:mobot01` — Missouri Botanical Garden: susceptible to leaf and twig blights, canker and leaf spots; scale, leaf miners and bagworms are occasional insect pests.
- `cornus-sericea:pest_susceptibility:rhs01` — RHS: generally pest-free but may be susceptible to horse chestnut scale; diseases: cornus anthracnose and honey fungus.

### resistances

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:resistances:gpp01` | Great Plant Picks | ["stress:winter_wet", "stress:drought"] | 0.8 | cultivar:'Baileyi'; Great Plant Picks, maritime Pacific Northwest; reg | 'dry soils' → drought (loose; GPP still advises summer watering on non-wet sites); GPP has no species-level entry for Cornus sericea; this i |
| [ ] `cornus-sericea:resistances:mobot01` | Missouri Botanical Garden Plant Finder | ["browsing:deer", "stress:erosion", "stress:clay_soil", "stress:wet_soil"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'erosion', 'clay soil' and 'wet soil' are outside the starter resistances list (open list, M11); note the USDA browse-palatability rating th |
| [ ] `cornus-sericea:resistances:rhs01` | Royal Horticultural Society | ["stress:winter_wet"] | 0.75 | species; RHS plant profile, UK growing conditions | 'poorly-drained' → winter wet (loose) |

- `cornus-sericea:resistances:gpp01` — Great Plant Picks: tolerates damp or dry soils and the winter-wet, summer-dry combination.
- `cornus-sericea:resistances:mobot01` — Missouri Botanical Garden 'Tolerate' line: deer, erosion, clay soil, wet soil.
- `cornus-sericea:resistances:rhs01` — RHS lists poorly-drained soil among the moisture conditions the species accepts.

## extended

### time_to_intended_size

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:time_to_intended_size:gpp01` | Great Plant Picks | {"years": 10, "height_m": 3.05, "spread_m": 3.05, "unit": "m at 10 years"} | 0.85 | cultivar:'Baileyi'; Great Plant Picks, maritime Pacific Northwest | GPP has no species-level entry for Cornus sericea; this is the cultivar 'Baileyi' page (sizes are for the cultivar) |
| [ ] `cornus-sericea:time_to_intended_size:rhs01` | Royal Horticultural Society | {"min": 5, "max": 10, "unit": "years", "measure": "time to ultimate height"} | 0.85 | species; RHS plant profile, UK growing conditions | the one source with an explicit time-to-size figure (survey c2 gap) |
| [ ] `cornus-sericea:time_to_intended_size:usdaplants01` | USDA PLANTS Database | {"years": 20, "height_m": 3.7, "unit": "m at 20 years"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data; characte |  |

- `cornus-sericea:time_to_intended_size:gpp01` — Great Plant Picks gives Cornus sericea 'Baileyi' a 10-year size of 10 ft tall by 10 ft wide (3.05 × 3.05 m).
- `cornus-sericea:time_to_intended_size:rhs01` — RHS gives Cornus sericea 5–10 years to reach its ultimate height.
- `cornus-sericea:time_to_intended_size:usdaplants01` — USDA PLANTS: maximum height at 20 years 12 ft (3.7 m).

### behaviour_with_others

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:behaviour_with_others:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"spread": "layering of prostrate stems that act like stolons", "regeneration": "regene… | 0.85 | BC; E-Flora BC atlas page |  |
| [ ] `cornus-sericea:behaviour_with_others:mobot01` | Missouri Botanical Garden Plant Finder | {"spread": "upright-spreading, suckering; forms thickets in naturalistic plantings", "c… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cornus-sericea:behaviour_with_others:rhs01` | Royal Horticultural Society | {"spread": "suckering; spreads into colonies"} | 0.8 | species; RHS plant profile, UK growing conditions |  |
| [ ] `cornus-sericea:behaviour_with_others:usdaplants01` | USDA PLANTS Database | {"growth_form": "multiple stem", "resprout": true, "coppice_potential": false, "vegetat… | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data; characte | 'Palatable Browse Animal: High' disagrees with the Missouri Botanical Garden 'Tolerate: Deer' line — kept side by side (R1) |

- `cornus-sericea:behaviour_with_others:eflora01` — E-Flora BC: spreads by layering of prostrate stems and regenerates abundantly in clearings, where it can hinder regeneration of shade-intolerant conifers.
- `cornus-sericea:behaviour_with_others:mobot01` — Missouri Botanical Garden: an upright-spreading suckering shrub that forms thickets where allowed; root suckers are removed where colonial spread is unwanted; recommended in combination with evergreens or contrasting-stem dogwoods.
- `cornus-sericea:behaviour_with_others:rhs01` — RHS records a suckering habit: the shrub spreads outward by suckers, and annual pruning (group 7) is used to keep it compact.
- `cornus-sericea:behaviour_with_others:usdaplants01` — USDA PLANTS: multiple-stemmed, resprouts after cutting but is not rated for coppice, moderate vegetative spread, slow seed spread, low fire tolerance, high palatability to browsing animals.

### toxicity

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:toxicity:usdaplants01` | USDA PLANTS Database | {"usda_rating": "none", "humans": "unknown", "pets": "unknown"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data; characte | M17 shape: usda_rating only; humans and pets stay unknown until a tier-B toxicology source is recorded |

- `cornus-sericea:toxicity:usdaplants01` — USDA PLANTS gives a toxicity rating of 'None'; the rating is a US conservation-planting characteristic and says nothing specific about pets or people.

### vancouver_context

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cornus-sericea:vancouver_context:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"habitat": ["streamside", "lakeside", "swamp", "forest", "wet to mesic", "lowland", "s… | 0.9 | BC; E-Flora BC atlas page | BGC zone list and site statistics from the atlas station records; ecological indicator values apply to coastal locations |
| [ ] `cornus-sericea:vancouver_context:inat01` | iNaturalist observations | {"licensed_verifiable_observations": 2100, "research_grade": 1388, "all_licences": 2768… | 0.6 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | presence evidence; observation counts reflect observer effort as much as abundance |
| [ ] `cornus-sericea:vancouver_context:inat02` | iNaturalist observations | {"observations_by_month": {"1": 39, "2": 50, "3": 63, "4": 326, "5": 409, "6": 199, "7"… | 0.55 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | observer effort, not plant activity — the plant is evergreen/visible year-round; use for 'when people notice it', not phenology |

- `cornus-sericea:vancouver_context:eflora01` — E-Flora BC: common throughout BC on wet to mesic streamsides, lakesides, swamps and forests from lowland to montane; recorded in all major BGC zones including the Coastal Western Hemlock (465 plots) and Coastal Douglas-fir zones that cover Vancouver; modal zone SBS; tolerates fluctuating water tables and typifies alluvial floodplain forest.
- `cornus-sericea:vancouver_context:inat01` — iNaturalist holds 2100 openly licensed verifiable observations of this plant in Greater Vancouver (1388 research grade), recorded 2007–2026.
- `cornus-sericea:vancouver_context:inat02` — Monthly spread of 2100 Greater Vancouver observations: most in 5, 4, 9 (month numbers).
