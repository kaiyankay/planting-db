# Review: *Acer palmatum* — 45 unverified claims on 16 fields · 2026-10-29

Grouped by field; every live claim on the field is shown (verified ones too) so values can be compared side by side. Tick the id to keep as verified, strike it to reject. Then:

```bash
python3 -I tools/verify_claims.py plants/acer-palmatum.json --by Kay <ids…>     # or --source rhs
```

Values are structured only; `text` was written from the value, never copied. *mapping* flags where a source term was forced into the KPU vocabulary.
KPU (tier C) is linked from the entity only; none of its values are stored, even where its page shows a figure that disagrees with the sources below (D2).

## Sources in this review

- **Great Plant Picks** (`gpp`, tier B, checked 2026-10-29): No terms page. Footer (greatplantpicks.org, 2026-10-29): 'Text and photos ©2025 Great Plant Picks/Elisabeth Carey Miller Garden except where otherwise noted'. GPP describes itself as 'the primary educational program of t…
- **iNaturalist observations** (`inat`, tier B (provisional — Kay to open the terms page in a normal browser and confirm), checked 2026-10-29): Site terms page (inaturalist.org/pages/terms) could not be read on 2026-10-29: Cloudflare bot check blocked both WebFetch and the built-in browser. Recorded instead: (1) api.inaturalist.org swagger info.description — pub…
- **Invasive Species Council of BC** (`iscbc`, tier B, checked 2026-10-29): No terms of use. Footer: '© 2023 Invasive Species Council of BC. All rights reserved.' Only a privacy policy PDF is linked (Policy 304, Feb 2019).
- **Missouri Botanical Garden Plant Finder** (`mobot`, tier B, checked 2026-10-29): Conditions of Use (missouribotanicalgarden.org/conditions): texts/images copyrighted; 'may not be used for any commercial purpose without permission'; 'may not be re-published in print or electronic form without permissi…
- **Oregon State University Landscape Plants** (`osu`, tier B, checked 2026-10-29): No terms of use published. Footer: 'Copyright ©2026 Oregon State University'; oregonstate.edu/copyright is a DMCA notice page only. Site is a Dept. of Horticulture teaching resource with a references page.
- **Royal Horticultural Society — Plants (plant profiles)** (`rhs`, tier B, checked 2026-10-29): No site-wide terms page found (2026-10-29); rhs.org.uk/terms-and-conditions redirects to ChatBotanist terms. Section-specific terms (VLE, heritage catalogue) state RHS owns copyright in site content and bar copying excep…

## gate

### hardiness_zone

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:hardiness_zone:gpp01` | Great Plant Picks | {"min": 6, "max": 8, "unit": "USDA"} | 0.85 | cultivar:'Osakazuki'; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `acer-palmatum:hardiness_zone:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 5, "max": 8, "unit": "USDA"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `acer-palmatum:hardiness_zone:osu01` | Oregon State University Landscape Plants | {"usda_min": 5, "unit": "USDA"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `acer-palmatum:hardiness_zone:rhs01` | Royal Horticultural Society | {"rating": "H6", "unit": "RHS", "approx_min_c": -20, "approx_max_c": -15} | 0.85 | species; RHS plant profile, UK growing conditions | RHS H-scale, not a Canadian or USDA zone; °C band is the RHS definition of H6, not from the plant page |

- `acer-palmatum:hardiness_zone:gpp01` — Great Plant Picks lists 'Osakazuki' for USDA zones 6 to 8.
- `acer-palmatum:hardiness_zone:mobot01` — Missouri Botanical Garden lists Acer palmatum for USDA zones 5 to 8.
- `acer-palmatum:hardiness_zone:osu01` — Oregon State University: hardy to USDA zone 5.
- `acer-palmatum:hardiness_zone:rhs01` — RHS rates Acer palmatum hardiness H6 (hardy through most of the UK, about -20 to -15 °C).

### invasive_status

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:invasive_status:iscbc01` | Invasive Species Council of BC | "not_listed" | 0.9 | BC; ISCBC online species profiles only | BC Weed Control Act schedules and the Field Guide to Noxious Weeds were not checked page by page |

- `acer-palmatum:invasive_status:iscbc01` — Acer palmatum is not among the 68 plant profiles on the Invasive Species Council of BC 'Find an Invasive Species' list (checked 2026-10-29); no Acer species is listed.

### water_drainage

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:water_drainage:gpp01` | Great Plant Picks | "average" | 0.75 | cultivar:'Osakazuki'; Great Plant Picks, maritime Pacific Northwest | 'regular watering' mapped to average |
| [ ] `acer-palmatum:water_drainage:mobot01` | Missouri Botanical Garden Plant Finder | "average" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `acer-palmatum:water_drainage:rhs01` | Royal Horticultural Society | "moist" | 0.75 | species; RHS plant profile, UK growing conditions | mapping 'moist but well-drained' → moist; 'average' would also be defensible |

- `acer-palmatum:water_drainage:gpp01` — Great Plant Picks: regular watering, especially in dry weather.
- `acer-palmatum:water_drainage:mobot01` — Missouri Botanical Garden rates water needs as medium.
- `acer-palmatum:water_drainage:rhs01` — RHS: moist but well-drained.

### mature_height

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:mature_height:gpp01` | Great Plant Picks | {"height_m": 6.1, "unit": "m", "raw": "20 ft"} | 0.85 | cultivar:'Osakazuki'; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `acer-palmatum:mature_height:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 3.0, "max": 7.6, "unit": "m", "raw": "10–25 ft, infrequently to 40 ft"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `acer-palmatum:mature_height:osu01` | Oregon State University Landscape Plants | {"min": 4.5, "max": 7.6, "unit": "m", "raw": "15–25 ft"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `acer-palmatum:mature_height:rhs01` | Royal Horticultural Society | {"min": 4, "max": 8, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `acer-palmatum:mature_height:rhs02` | Royal Horticultural Society | {"min": 2.5, "max": 4, "unit": "m"} | 0.85 | cultivar:'Osakazuki'; RHS plant profile, UK growing conditions |  |
| [ ] `acer-palmatum:mature_height:rhs03` | Royal Horticultural Society | {"min": 2.5, "max": 4, "unit": "m"} | 0.85 | cultivar:'Bloodgood'; RHS plant profile, UK growing conditions |  |

- `acer-palmatum:mature_height:gpp01` — Great Plant Picks gives 'Osakazuki' a mature height of 20 ft (6.1 m).
- `acer-palmatum:mature_height:mobot01` — Missouri Botanical Garden gives Acer palmatum a height of 10–25 ft (3–7.6 m), infrequently to 40 ft.
- `acer-palmatum:mature_height:osu01` — Oregon State University gives Acer palmatum a height of 15–25 ft (4.5–7.6 m).
- `acer-palmatum:mature_height:rhs01` — RHS gives Acer palmatum an ultimate height of 4–8 m.
- `acer-palmatum:mature_height:rhs02` — RHS gives Acer palmatum 'Osakazuki' an ultimate height of 2.5–4 m.
- `acer-palmatum:mature_height:rhs03` — RHS gives Acer palmatum 'Bloodgood' an ultimate height of 2.5–4 m.

### mature_spread

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:mature_spread:gpp01` | Great Plant Picks | {"spread_m": 6.1, "unit": "m", "raw": "20 ft"} | 0.85 | cultivar:'Osakazuki'; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `acer-palmatum:mature_spread:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 3.0, "max": 7.6, "unit": "m", "raw": "10–25 ft"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `acer-palmatum:mature_spread:rhs01` | Royal Horticultural Society | {"min": 4, "max": 8, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `acer-palmatum:mature_spread:rhs02` | Royal Horticultural Society | {"min": 2.5, "max": 4, "unit": "m"} | 0.85 | cultivar:'Osakazuki'; RHS plant profile, UK growing conditions |  |
| [ ] `acer-palmatum:mature_spread:rhs03` | Royal Horticultural Society | {"min": 2.5, "max": 4, "unit": "m"} | 0.85 | cultivar:'Bloodgood'; RHS plant profile, UK growing conditions |  |

- `acer-palmatum:mature_spread:gpp01` — Great Plant Picks gives 'Osakazuki' a mature spread of 20 ft (6.1 m).
- `acer-palmatum:mature_spread:mobot01` — Missouri Botanical Garden gives Acer palmatum a spread of 10–25 ft (3–7.6 m).
- `acer-palmatum:mature_spread:rhs01` — RHS gives Acer palmatum an ultimate spread of 4–8 m.
- `acer-palmatum:mature_spread:rhs02` — RHS gives Acer palmatum 'Osakazuki' an ultimate spread of 2.5–4 m.
- `acer-palmatum:mature_spread:rhs03` — RHS gives Acer palmatum 'Bloodgood' an ultimate spread of 2.5–4 m.

### maintenance_level

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:maintenance_level:mobot01` | Missouri Botanical Garden Plant Finder | "low" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |

- `acer-palmatum:maintenance_level:mobot01` — Missouri Botanical Garden rates maintenance as low; pruning best kept to a minimum.

## compare

### exposure

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:exposure:gpp01` | Great Plant Picks | ["Full sun", "Part sun/part shade", "Filtered shade"] | 0.85 | cultivar:'Osakazuki'; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `acer-palmatum:exposure:mobot01` | Missouri Botanical Garden Plant Finder | ["Full sun", "Part sun/part shade", "Sheltered"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `acer-palmatum:exposure:osu01` | Oregon State University Landscape Plants | ["Full sun", "Part sun/part shade", "Sheltered"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `acer-palmatum:exposure:rhs01` | Royal Horticultural Society | ["Full sun", "Part sun/part shade", "Sheltered"] | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `acer-palmatum:exposure:gpp01` — Great Plant Picks: full sun or light to open shade; best autumn colour in full sun to open shade.
- `acer-palmatum:exposure:mobot01` — Missouri Botanical Garden: full sun to part shade, afternoon shade in hot regions, sited away from strong winds.
- `acer-palmatum:exposure:osu01` — Oregon State University: sun to part shade; needs wind protection.
- `acer-palmatum:exposure:rhs01` — RHS: full sun or partial shade, sheltered position (west-, east- or south-facing).

### seasonal_interest

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r01 | {"note": "seasonal interest"} | 0.6 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| ✅ verified | survey-r04 | {"fall_colour": true} | 0.6 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| [ ] `acer-palmatum:seasonal_interest:gpp01` | Great Plant Picks | {"fall_colour": "brilliant red, orange-red undertone", "evergreen": false, "foliage_col… | 0.85 | cultivar:'Osakazuki'; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `acer-palmatum:seasonal_interest:mobot01` | Missouri Botanical Garden Plant Finder | {"flower_colour": ["Purple"], "flowering_months": [4], "fall_colour": true, "evergreen"… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'reddish-purple' mapped to Purple |
| [ ] `acer-palmatum:seasonal_interest:osu01` | Oregon State University Landscape Plants | {"flower_colour": ["Red", "Purple"], "fall_colour": true, "evergreen": false} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `acer-palmatum:seasonal_interest:rhs01` | Royal Horticultural Society | {"flower_colour": ["Red"], "fall_colour": true, "evergreen": false} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `acer-palmatum:seasonal_interest:rhs02` | Royal Horticultural Society | {"flower_colour": ["Purple"], "fall_colour": true, "evergreen": false, "foliage_colour"… | 0.85 | cultivar:'Bloodgood'; RHS plant profile | schema 0.3.0: foliage_colour added (deep red-purple all season → Dark-red, Purple); autumn colour red |

- `acer-palmatum:seasonal_interest:gpp01` — Great Plant Picks: one of the most brilliant red autumn colours among Japanese maples; green foliage in season.
- `acer-palmatum:seasonal_interest:mobot01` — Missouri Botanical Garden: reddish-purple flowers in April, insignificant; good fall colour in yellow, red-purple and bronze.
- `acer-palmatum:seasonal_interest:osu01` — Oregon State University: small red to purple flowers with the new leaves; scarlet, orange or yellow fall colour; samaras ripen early fall.
- `acer-palmatum:seasonal_interest:rhs01` — RHS: small red flowers in spring; deciduous with good autumn colour.
- `acer-palmatum:seasonal_interest:rhs02` — RHS: 'Bloodgood' has deep red-purple foliage, small purple flowers and red autumn colour.

### soil_type

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:soil_type:gpp01` | Great Plant Picks | ["Humus rich", "Well-drained"] | 0.85 | cultivar:'Osakazuki'; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `acer-palmatum:soil_type:mobot01` | Missouri Botanical Garden Plant Finder | ["Acidic", "Humus rich", "Well-drained"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `acer-palmatum:soil_type:osu01` | Oregon State University Landscape Plants | ["Well-drained"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `acer-palmatum:soil_type:rhs01` | Royal Horticultural Society | ["Well-drained"] | 0.8 | species; RHS plant profile, UK growing conditions | RHS soil classes (chalk/clay/loam/sand) have no KPU equivalent — only 'Well-drained' mapped; pH 'acid or neutral' not mapped to 'Acidic' bec |

- `acer-palmatum:soil_type:gpp01` — Great Plant Picks: best in rich well-drained soil, also does well in sandy soils and clay.
- `acer-palmatum:soil_type:mobot01` — Missouri Botanical Garden: moist, organically rich, slightly acidic, well-drained soil; grows well in sandy loam.
- `acer-palmatum:soil_type:osu01` — Oregon State University: well-drained soil.
- `acer-palmatum:soil_type:rhs01` — RHS: moist but well-drained soil; chalk, clay, loam or sand; acid or neutral pH.

### growth_rate

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:growth_rate:gpp01` | Great Plant Picks | "fast" | 0.75 | cultivar:'Osakazuki'; Great Plant Picks, maritime Pacific Northwest; i | GPP says fast in youth; RHS cultivar profile implies slow (10–20 yr to 2.5–4 m) — keep both |

- `acer-palmatum:growth_rate:gpp01` — Great Plant Picks: quick growing and vigorous in youth, still only a small to medium tree.

### landscape_use

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:landscape_use:mobot01` | Missouri Botanical Garden Plant Finder | ["Specimen plant", "Group or mass planting", "Woodland margin", "Screening", "Accent pl… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |

- `acer-palmatum:landscape_use:mobot01` — Missouri Botanical Garden uses: specimen or accent, groups, sun-dappled understory, woodland garden margins, screen, bonsai.

### pest_susceptibility

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:pest_susceptibility:mobot01` | Missouri Botanical Garden Plant Finder | ["Aphids", "Scale insects", "Mites", "Canker or sap rot", "Fungal leaf spot", "Wilt", "… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | borers, bagworms, root weevils, botrytis and frost damage have no KPU pseudo-value |
| [ ] `acer-palmatum:pest_susceptibility:rhs01` | Royal Horticultural Society | ["Galls", "Aphids", "Caterpillar or cutworm", "Scale insects", "Wilt", "Leaf scorch"] | 0.85 | species; RHS plant profile, UK growing conditions | honey fungus has no KPU pseudo-value; not mapped |

- `acer-palmatum:pest_susceptibility:mobot01` — Missouri Botanical Garden lists aphids, scale, borers, bagworms, root weevils and mites; stem canker, leaf spots, fusarium, verticillium wilt, botrytis, anthracnose and root rots; late-frost damage and chlorosis on high-pH soils.
- `acer-palmatum:pest_susceptibility:rhs01` — RHS lists acer gall mite, aphids, caterpillars and horse chestnut scale as pests; verticillium wilt, leaf scorch and honey fungus as diseases.

### resistances

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:resistances:gpp01` | Great Plant Picks | ["leaf scorch"] | 0.8 | cultivar:'Osakazuki'; Great Plant Picks, maritime Pacific Northwest | migrated 2026-10-29 from pest_susceptibility:gpp01 (schema 0.3.0, D7): resistances are recorded positively, never as a negated susceptibilit |
| [ ] `acer-palmatum:resistances:mobot01` | Missouri Botanical Garden Plant Finder | ["rabbit", "black walnut"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | added 2026-10-29 after D7 created the resistances field; from the 'Tolerate' line of the profile |

- `acer-palmatum:resistances:gpp01` — Great Plant Picks: 'Osakazuki' is very resistant to summer leaf-tip scorch.
- `acer-palmatum:resistances:mobot01` — Missouri Botanical Garden lists Acer palmatum as tolerating rabbits and black walnut.

## extended

### time_to_intended_size

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:time_to_intended_size:gpp01` | Great Plant Picks | {"years": 10, "height_m": 4.57, "spread_m": 3.66, "unit": "m at 10 years"} | 0.85 | cultivar:'Osakazuki'; Great Plant Picks, maritime Pacific Northwest | 10-year size is a direct answer to survey c2 'time to reach intended size' |
| [ ] `acer-palmatum:time_to_intended_size:rhs01` | Royal Horticultural Society | {"min": 10, "max": 20, "unit": "years", "measure": "time to ultimate height"} | 0.85 | species; RHS plant profile, UK growing conditions | the one source with an explicit time-to-size figure (survey c2 gap) |
| [ ] `acer-palmatum:time_to_intended_size:rhs02` | Royal Horticultural Society | {"min": 10, "max": 20, "unit": "years", "measure": "time to ultimate height"} | 0.85 | cultivar:'Osakazuki'; RHS plant profile, UK growing conditions |  |
| [ ] `acer-palmatum:time_to_intended_size:rhs03` | Royal Horticultural Society | {"min": 10, "max": 20, "unit": "years", "measure": "time to ultimate height"} | 0.85 | cultivar:'Bloodgood'; RHS plant profile, UK growing conditions |  |

- `acer-palmatum:time_to_intended_size:gpp01` — Great Plant Picks gives 'Osakazuki' a 10-year size of 15 ft tall by 12 ft wide (4.6 × 3.7 m).
- `acer-palmatum:time_to_intended_size:rhs01` — RHS gives Acer palmatum 10–20 years to reach its ultimate height.
- `acer-palmatum:time_to_intended_size:rhs02` — RHS gives Acer palmatum 'Osakazuki' 10–20 years to reach its ultimate height.
- `acer-palmatum:time_to_intended_size:rhs03` — RHS gives Acer palmatum 'Bloodgood' 10–20 years to reach its ultimate height.

### long_term_performance

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `acer-palmatum:long_term_performance:osu01` | Oregon State University Landscape Plants | {"observation": "seedling-grown trees faster growing and more drought tolerant than gra… | 0.7 | species; Oregon State University Landscape Plants, Willamette Valley | relevant to Vancouver summer drought; grafted named cultivars are what nurseries sell |

- `acer-palmatum:long_term_performance:osu01` — Oregon State University notes seedlings are faster growing and more drought tolerant than grafted forms.

### vancouver_context

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | City of Vancouver Public Trees | {"public_trees_count": 1848, "cultivar_labels_recorded": 44, "unlabelled": 1103} | 0.9 | City of Vancouver public tree inventory, data snapshot 2026-10-26; str |  |
| ✅ verified | City of Vancouver Public Trees | {"cultivar_counts": {"OSAKAZUKI": 407, "BLOODGOOD": 88, "KOTO NO ITO": 65, "ATROPURPURE… | 0.85 | City of Vancouver public tree inventory, data snapshot 2026-10-26; str | labels as recorded by Parks staff; 'NONE' means not recorded, not the straight species. Labels with n >= 50 have their own size claims (cont |
| ✅ verified | City of Vancouver Public Trees | {"local_area_counts": {"Riley Park": 247, "Kitsilano": 216, "Renfrew-Collingwood": 176,… | 0.9 | City of Vancouver public tree inventory, data snapshot 2026-10-26; str |  |
| [ ] `acer-palmatum:vancouver_context:inat01` | iNaturalist observations | {"licensed_verifiable_observations": 20, "research_grade": 6, "all_licences": 24, "year… | 0.6 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | presence evidence; observation counts reflect observer effort as much as abundance |

- `acer-palmatum:vancouver_context:inat01` — iNaturalist holds 20 openly licensed verifiable observations of this plant in Greater Vancouver (6 research grade), recorded 2019–2026.
