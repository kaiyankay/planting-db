# Review: *Cercidiphyllum japonicum* — 50 unverified claims on 18 fields · 2026-11-02

Grouped by field; every live claim on the field is shown (verified ones too) so values can be compared side by side. Tick the id to keep as verified, strike it to reject. Then:

```bash
python3 -I tools/verify_claims.py plants/cercidiphyllum-japonicum.json --by Kay <ids…>     # or --source rhs
```

Values are structured only; `text` was written from the value, never copied. *mapping* flags where a source term was forced into the KPU vocabulary.
KPU (tier C) is linked from the entity only; none of its values are stored, even where its page shows a figure that disagrees with the sources below (D2).

## Sources in this review

- **Great Plant Picks** (`gpp`, tier B, checked 2026-10-29): No terms page. Footer (greatplantpicks.org, 2026-10-29): 'Text and photos ©2025 Great Plant Picks/Elisabeth Carey Miller Garden except where otherwise noted'. GPP describes itself as 'the primary educational program of t…
- **iNaturalist observations** (`inat`, tier B, checked 2026-10-29): Site terms page (inaturalist.org/pages/terms) could not be read on 2026-10-29: Cloudflare bot check blocked both WebFetch and the built-in browser. Recorded instead: (1) api.inaturalist.org swagger info.description — pub…
- **Invasive Species Council of BC** (`iscbc`, tier B, checked 2026-10-29): No terms of use. Footer: '© 2023 Invasive Species Council of BC. All rights reserved.' Only a privacy policy PDF is linked (Policy 304, Feb 2019).
- **Missouri Botanical Garden Plant Finder** (`mobot`, tier B, checked 2026-10-29): Conditions of Use (missouribotanicalgarden.org/conditions): texts/images copyrighted; 'may not be used for any commercial purpose without permission'; 'may not be re-published in print or electronic form without permissi…
- **Oregon State University Landscape Plants** (`osu`, tier B, checked 2026-10-29): No terms of use published. Footer: 'Copyright ©2026 Oregon State University'; oregonstate.edu/copyright is a DMCA notice page only. Site is a Dept. of Horticulture teaching resource with a references page.
- **Royal Horticultural Society — Plants (plant profiles)** (`rhs`, tier B, checked 2026-10-29): No site-wide terms page found (2026-10-29); rhs.org.uk/terms-and-conditions redirects to ChatBotanist terms. Section-specific terms (VLE, heritage catalogue) state RHS owns copyright in site content and bar copying excep…

## gate

### hardiness_zone

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:hardiness_zone:gpp01` | Great Plant Picks | {"min": 4, "max": 8, "unit": "USDA"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `cercidiphyllum-japonicum:hardiness_zone:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 4, "max": 8, "unit": "USDA"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cercidiphyllum-japonicum:hardiness_zone:osu01` | Oregon State University Landscape Plants | {"usda_min": 4, "unit": "USDA"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cercidiphyllum-japonicum:hardiness_zone:rhs01` | Royal Horticultural Society | {"rating": "H5", "unit": "RHS", "approx_min_c": -15, "approx_max_c": -10} | 0.85 | species; RHS plant profile, UK growing conditions | RHS H-scale, not a Canadian or USDA zone; °C band is the RHS definition of H5, not from the plant page |

- `cercidiphyllum-japonicum:hardiness_zone:gpp01` — Great Plant Picks lists Cercidiphyllum japonicum for USDA zones 4 to 8.
- `cercidiphyllum-japonicum:hardiness_zone:mobot01` — Missouri Botanical Garden lists Cercidiphyllum japonicum for USDA zones 4 to 8.
- `cercidiphyllum-japonicum:hardiness_zone:osu01` — Oregon State University: hardy to USDA zone 4.
- `cercidiphyllum-japonicum:hardiness_zone:rhs01` — RHS rates Cercidiphyllum japonicum hardiness H5 (hardy in most of the UK even in severe winters, about -15 to -10 °C).

### invasive_status

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:invasive_status:iscbc01` | Invasive Species Council of BC | "invasive:not_listed" | 0.9 | BC; ISCBC online species profiles only | BC Weed Control Act schedules and the Field Guide to Noxious Weeds were not checked page by page |

- `cercidiphyllum-japonicum:invasive_status:iscbc01` — Cercidiphyllum japonicum is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-11-02); site searches for 'katsura' and 'Cercidiphyllum' return nothing.

### water_drainage

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:water_drainage:gpp01` | Great Plant Picks | "water:average" | 0.75 | species; Great Plant Picks, maritime Pacific Northwest | 'regular watering' mapped to average |
| [ ] `cercidiphyllum-japonicum:water_drainage:mobot01` | Missouri Botanical Garden Plant Finder | "water:average" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cercidiphyllum-japonicum:water_drainage:osu01` | Oregon State University Landscape Plants | "water:moist" | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | 'moist well-drained' + 'needs supplemental watering' → moist; 'average' also defensible |
| [ ] `cercidiphyllum-japonicum:water_drainage:rhs01` | Royal Horticultural Society | "water:moist" | 0.75 | species; RHS plant profile, UK growing conditions | mapping 'moist but well-drained or well-drained' → moist; 'average' would also be defensible |

- `cercidiphyllum-japonicum:water_drainage:gpp01` — Great Plant Picks: regular watering; appreciates summer watering in dry spells, especially in full sun or poor soils.
- `cercidiphyllum-japonicum:water_drainage:mobot01` — Missouri Botanical Garden rates water needs as medium; little drought tolerance, particularly when young.
- `cercidiphyllum-japonicum:water_drainage:osu01` — Oregon State University: grows best in moist, well-drained soil and needs supplemental watering.
- `cercidiphyllum-japonicum:water_drainage:rhs01` — RHS: moist but well-drained or well-drained.

### mature_height

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:mature_height:gpp01` | Great Plant Picks | {"height_m": 18.29, "unit": "m", "raw": "60 ft"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `cercidiphyllum-japonicum:mature_height:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 12.2, "max": 18.3, "unit": "m", "raw": "40–60 ft in cultivation; 100 ft or more… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cercidiphyllum-japonicum:mature_height:osu01` | Oregon State University Landscape Plants | {"min": 12, "max": 18, "occasional_max_m": 30, "unit": "m", "raw": "40-60(100) ft [12-1… | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cercidiphyllum-japonicum:mature_height:rhs01` | Royal Horticultural Society | {"min": 12, "unit": "m", "raw": "higher than 12 metres"} | 0.85 | species; RHS plant profile, UK growing conditions | RHS top size band is open-ended ('higher than 12 metres'); no upper figure given |

- `cercidiphyllum-japonicum:mature_height:gpp01` — Great Plant Picks gives a mature height of 60 ft (18.3 m).
- `cercidiphyllum-japonicum:mature_height:mobot01` — Missouri Botanical Garden gives a height of 40–60 ft (12.2–18.3 m) in cultivation, 100 ft or more in the wild.
- `cercidiphyllum-japonicum:mature_height:osu01` — Oregon State University gives a height of 40–60 ft (12–18 m), occasionally 100 ft (30 m).
- `cercidiphyllum-japonicum:mature_height:rhs01` — RHS gives Cercidiphyllum japonicum an ultimate height of more than 12 m.

### mature_spread

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:mature_spread:gpp01` | Great Plant Picks | {"spread_m": 15.24, "unit": "m", "raw": "50 ft"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `cercidiphyllum-japonicum:mature_spread:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 7.6, "max": 18.3, "unit": "m", "raw": "25–60 ft"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cercidiphyllum-japonicum:mature_spread:rhs01` | Royal Horticultural Society | {"min": 8, "unit": "m", "raw": "wider than 8 metres"} | 0.85 | species; RHS plant profile, UK growing conditions | RHS top spread band is open-ended ('wider than 8 metres'); no upper figure given |

- `cercidiphyllum-japonicum:mature_spread:gpp01` — Great Plant Picks gives a mature width of 50 ft (15.2 m).
- `cercidiphyllum-japonicum:mature_spread:mobot01` — Missouri Botanical Garden gives a spread of 25–60 ft (7.6–18.3 m).
- `cercidiphyllum-japonicum:mature_spread:rhs01` — RHS gives Cercidiphyllum japonicum an ultimate spread of more than 8 m.

### maintenance_level

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:maintenance_level:mobot01` | Missouri Botanical Garden Plant Finder | "maintenance:low" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cercidiphyllum-japonicum:maintenance_level:rhs01` | Royal Horticultural Society | "maintenance:low" | 0.75 | species; RHS plant profile, UK growing conditions | pruning group 1 → low maintenance is a loose mapping; RHS gives no explicit maintenance rating |

- `cercidiphyllum-japonicum:maintenance_level:mobot01` — Missouri Botanical Garden rates maintenance as low.
- `cercidiphyllum-japonicum:maintenance_level:rhs01` — RHS places the species in pruning group 1 (minimal pruning).

## compare

### exposure

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:exposure:gpp01` | Great Plant Picks | ["exposure:full_sun", "exposure:part_sun_part_shade", "exposure:filtered_shade"] | 0.8 | species; Great Plant Picks, maritime Pacific Northwest | GPP 'light shade' (4–6 h sun) → Part sun/part shade; 'open shade' (bright, no direct sun) → Filtered shade, loose |
| [ ] `cercidiphyllum-japonicum:exposure:mobot01` | Missouri Botanical Garden Plant Finder | ["exposure:full_sun", "exposure:part_sun_part_shade", "exposure:sheltered"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'protected from strong winds and hot afternoon sun' → Sheltered |
| [ ] `cercidiphyllum-japonicum:exposure:osu01` | Oregon State University Landscape Plants | ["exposure:full_sun", "exposure:part_sun_part_shade"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `cercidiphyllum-japonicum:exposure:rhs01` | Royal Horticultural Society | ["exposure:full_sun", "exposure:part_sun_part_shade", "exposure:sheltered"] | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `cercidiphyllum-japonicum:exposure:gpp01` — Great Plant Picks: full sun or light to open shade; protection from hot afternoon sun where summers are hot.
- `cercidiphyllum-japonicum:exposure:mobot01` — Missouri Botanical Garden: full sun to part shade; best sited with protection from strong winds and hot afternoon sun.
- `cercidiphyllum-japonicum:exposure:osu01` — Oregon State University: sun, but probably best in light shade.
- `cercidiphyllum-japonicum:exposure:rhs01` — RHS: full sun or partial shade, any aspect, sheltered position.

### seasonal_interest

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:seasonal_interest:gpp01` | Great Plant Picks | {"foliage_colour": ["Green"], "fall_colour": "bright butter-yellow with orange and apri… | 0.85 | species; Great Plant Picks, maritime Pacific Northwest | 'blue-green' → Green; spring flush reddish-purple kept in text only; autumn leaf scent has no key in the value shape |
| [ ] `cercidiphyllum-japonicum:seasonal_interest:mobot01` | Missouri Botanical Garden Plant Finder | {"flowering_months": [3, 4], "flower_colour": ["Green", "Red"], "foliage_colour": ["Gre… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'March to April' → months 3–4; bloom 'green to reddish-green' → Green, Red (red = male trees, green = female trees); spring flush reddish pu |
| [ ] `cercidiphyllum-japonicum:seasonal_interest:osu01` | Oregon State University Landscape Plants | {"foliage_colour": ["Green"], "fall_colour": "soft apricot-orange, not spectacular in C… | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley | 'bluish-green' → Green; flower colour and months not given, so no flower_colour / flowering_months; spring flush purplish tan kept in text |
| [ ] `cercidiphyllum-japonicum:seasonal_interest:rhs01` | Royal Horticultural Society | {"foliage_colour": ["Bronze"], "fall_colour": "yellow, orange and pink", "fruit": "inco… | 0.85 | species; RHS plant profile, UK growing conditions | foliage_colour records only the young-leaf tint RHS gives (bronze); mature summer colour not stated by RHS. Flower colour not given, so no f |

- `cercidiphyllum-japonicum:seasonal_interest:gpp01` — Great Plant Picks: new leaves reddish-purple, blue-green through summer, butter-yellow with orange and apricot in autumn; fallen leaves scented of strawberries and cotton candy; seasonal interest listed as autumn foliage colour.
- `cercidiphyllum-japonicum:seasonal_interest:mobot01` — Missouri Botanical Garden: insignificant flowers March–April before the leaves, red on male and green on female trees; leaves emerge reddish purple, medium green with a bluish tinge in summer, gold, orange and red in autumn; fallen leaves scented; greenish pods on females.
- `cercidiphyllum-japonicum:seasonal_interest:osu01` — Oregon State University: leaves purplish tan when unfolding then bluish-green; apricot-orange fall colour that is not spectacular in Corvallis; male flowers in spring before the leaves, female flowers as leaves expand, neither showy; small narrow pods.
- `cercidiphyllum-japonicum:seasonal_interest:rhs01` — RHS: leaves bronze-tinted when young, turning yellow, orange and pink in autumn and smelling of burnt sugar; flowers and fruit inconspicuous; deciduous.

### form

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:form:mobot01` | Missouri Botanical Garden Plant Finder | "form:round" | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'rounded habit' in prose → Round; not a structured field on the Plant Finder page |
| [ ] `cercidiphyllum-japonicum:form:osu01` | Oregon State University Landscape Plants | "form:pyramidal_widely" | 0.7 | species, young trees; Oregon State University Landscape Plants, Willam | OSU says only 'pyramidal when young'; narrow vs. wide not stated — 'Pyramidal - widely' chosen as the looser fit, 'Pyramidal - narrowly' equ |

- `cercidiphyllum-japonicum:form:mobot01` — Missouri Botanical Garden describes a dense, rounded habit, single- or multi-trunked.
- `cercidiphyllum-japonicum:form:osu01` — Oregon State University describes the tree as pyramidal when young.

### habit

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:habit:mobot01` | Missouri Botanical Garden Plant Finder | "habit:dense" | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'dense' in prose → Dense; not a structured field on the Plant Finder page |
| [ ] `cercidiphyllum-japonicum:habit:osu01` | Oregon State University Landscape Plants | "habit:arching" | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | 'arching branches' → Arching; habit read from the leaf description, not a structured field |

- `cercidiphyllum-japonicum:habit:mobot01` — Missouri Botanical Garden describes a dense, rounded habit.
- `cercidiphyllum-japonicum:habit:osu01` — Oregon State University: leaves neatly paired along arching branches.

### soil_type

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:soil_type:gpp01` | Great Plant Picks | ["soil:humus_rich", "soil:well_drained"] | 0.85 | species; Great Plant Picks, maritime Pacific Northwest | 'rich' → Humus rich |
| [ ] `cercidiphyllum-japonicum:soil_type:mobot01` | Missouri Botanical Garden Plant Finder | ["soil:humus_rich", "soil:well_drained"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'rich' → Humus rich |
| [ ] `cercidiphyllum-japonicum:soil_type:osu01` | Oregon State University Landscape Plants | ["soil:well_drained"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley | 'pH adaptable' so 'Acidic' not mapped even though acid soils are said to improve fall colour |
| [ ] `cercidiphyllum-japonicum:soil_type:rhs01` | Royal Horticultural Society | ["soil:well_drained"] | 0.8 | species; RHS plant profile, UK growing conditions | RHS soil classes (clay/sand/loam) have no KPU equivalent — only 'Well-drained' mapped; pH 'acid or neutral' not mapped to 'Acidic' because n |

- `cercidiphyllum-japonicum:soil_type:gpp01` — Great Plant Picks: grows best in rich, well-drained soil.
- `cercidiphyllum-japonicum:soil_type:mobot01` — Missouri Botanical Garden: best in rich, moist, well-drained soils.
- `cercidiphyllum-japonicum:soil_type:osu01` — Oregon State University: moist, well-drained soil, pH adaptable, supposedly better fall colour on acid soils.
- `cercidiphyllum-japonicum:soil_type:rhs01` — RHS: clay, sand or loam; moist but well-drained or well-drained; acid or neutral pH.

### landscape_use

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r06 | ["use:fragrance"] | 0.8 | survey d2 note (observed); respondent's own backyard (municipality not | scented foliage → KPU use Fragrance |
| [ ] `cercidiphyllum-japonicum:landscape_use:gpp01` | Great Plant Picks | ["use:fall_interest"] | 0.8 | species; Great Plant Picks, maritime Pacific Northwest | GPP has no explicit uses line; 'autumn foliage color' → Fall interest |
| [ ] `cercidiphyllum-japonicum:landscape_use:mobot01` | Missouri Botanical Garden Plant Finder | ["use:shade_tree", "use:specimen_plant", "use:street_boulevard_tree"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cercidiphyllum-japonicum:landscape_use:rhs01` | Royal Horticultural Society | ["use:specimen_plant", "use:woodland_margin"] | 0.7 | species; RHS plant profile, UK growing conditions | 'Architectural' → Specimen plant and 'woodland setting' → Woodland margin are both loose mappings into the KPU list |

- `cercidiphyllum-japonicum:landscape_use:gpp01` — Great Plant Picks lists seasonal interest as autumn foliage colour and describes it as an easy tree to garden under.
- `cercidiphyllum-japonicum:landscape_use:mobot01` — Missouri Botanical Garden: shade tree; small specimen shade tree or street tree.
- `cercidiphyllum-japonicum:landscape_use:rhs01` — RHS suggests an architectural planting role and notes the tree is best grown in a woodland setting.

### pest_susceptibility

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:pest_susceptibility:mobot01` | Missouri Botanical Garden Plant Finder | ["pest:leaf_scorch"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con |  |
| [ ] `cercidiphyllum-japonicum:pest_susceptibility:osu01` | Oregon State University Landscape Plants | ["pest:abiotic_disorder"] | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | bark splitting, sun scald and frost-deformed leaves → 'Abiotic disorder' (loose); no insect or disease listed |
| [ ] `cercidiphyllum-japonicum:pest_susceptibility:rhs01` | Royal Horticultural Society | ["pest:abiotic_disorder"] | 0.7 | species; RHS plant profile, UK growing conditions | late-frost leaf damage → 'Abiotic disorder' (loose); honey fungus has no KPU pseudo-value and is not mapped (same treatment as acer-palmatum |

- `cercidiphyllum-japonicum:pest_susceptibility:mobot01` — Missouri Botanical Garden: no serious insect or disease problems; foliage may scorch in hot, dry or windy conditions.
- `cercidiphyllum-japonicum:pest_susceptibility:osu01` — Oregon State University: bark splitting and sun scald may occur; deformed young leaves in spring attributed to night frosts.
- `cercidiphyllum-japonicum:pest_susceptibility:rhs01` — RHS: may be susceptible to honey fungus; young leaves may be damaged by late frosts.

### resistances

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:resistances:gpp01` | Great Plant Picks | ["browsing:deer"] | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `cercidiphyllum-japonicum:resistances:mobot01` | Missouri Botanical Garden Plant Finder | ["stress:clay_soil"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | 'clay soil' is outside the starter resistances list (open list, reported as a note by the validator) |
| [ ] `cercidiphyllum-japonicum:resistances:rhs01` | Royal Horticultural Society | ["pest:pest"] | 0.8 | species; RHS plant profile, UK growing conditions | 'generally pest-free' recorded positively as a pest resistance (D7); honey fungus susceptibility is a separate claim |

- `cercidiphyllum-japonicum:resistances:gpp01` — Great Plant Picks lists the species as resistant to deer.
- `cercidiphyllum-japonicum:resistances:mobot01` — Missouri Botanical Garden 'Tolerate' line: clay soil.
- `cercidiphyllum-japonicum:resistances:rhs01` — RHS lists Cercidiphyllum japonicum as generally pest-free.

## extended

### time_to_intended_size

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:time_to_intended_size:gpp01` | Great Plant Picks | {"years": 10, "height_m": 7.62, "spread_m": 4.57, "unit": "m at 10 years"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest | 10-year size is a direct answer to survey c2 'time to reach intended size' |
| [ ] `cercidiphyllum-japonicum:time_to_intended_size:rhs01` | Royal Horticultural Society | {"min": 20, "max": 50, "unit": "years", "measure": "time to ultimate height"} | 0.85 | species; RHS plant profile, UK growing conditions | the one source with an explicit time-to-size figure (survey c2 gap) |

- `cercidiphyllum-japonicum:time_to_intended_size:gpp01` — Great Plant Picks gives a 10-year size of 25 ft tall by 15 ft wide (7.6 × 4.6 m).
- `cercidiphyllum-japonicum:time_to_intended_size:rhs01` — RHS gives 20–50 years to reach ultimate height.

### long_term_performance

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:long_term_performance:gpp01` | Great Plant Picks | {"observation": "needs regular summer watering during dry spells, especially in full su… | 0.8 | species; Great Plant Picks, maritime Pacific Northwest | PNW source; directly relevant to Vancouver summer drought |
| [ ] `cercidiphyllum-japonicum:long_term_performance:mobot01` | Missouri Botanical Garden Plant Finder | {"observation": "little drought tolerance, particularly when young; foliage scorches in… | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis growing con | relevant to Vancouver summer drought and exposed sites |
| [ ] `cercidiphyllum-japonicum:long_term_performance:osu01` | Oregon State University Landscape Plants | {"observation": "fall colour not spectacular in Corvallis; deformed young leaves for a … | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | campus observation in a PNW climate close to Vancouver's; contrasts with the 'brilliant' fall colour claimed by GPP and MOBOT |

- `cercidiphyllum-japonicum:long_term_performance:gpp01` — Great Plant Picks: regular summer watering in dry spells is needed, more so in full sun or poor soils; best colour and growth in full sun to light shade.
- `cercidiphyllum-japonicum:long_term_performance:mobot01` — Missouri Botanical Garden: little drought tolerance especially when young, leaf scorch in hot, dry or windy sites; an understory tree in the wild.
- `cercidiphyllum-japonicum:long_term_performance:osu01` — Oregon State University, Corvallis observations: fall colour underwhelming, young leaves deformed by spring frosts, bark splitting and sun scald possible.

### behaviour_with_others

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `cercidiphyllum-japonicum:behaviour_with_others:gpp01` | Great Plant Picks | {"root_behaviour": "not aggressive", "underplanting": "easy to garden under"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest | no companion species named; pointer for the relations layer (underplanting-friendly canopy) |

- `cercidiphyllum-japonicum:behaviour_with_others:gpp01` — Great Plant Picks: roots are not aggressive and the tree is easy to garden under.

### vancouver_context

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | City of Vancouver Public Trees | {"public_trees_count": 2647, "cultivar_labels_recorded": 3, "unlabelled": 2611} | 0.9 | City of Vancouver public tree inventory, data snapshot 2026-11-02; str |  |
| ✅ verified | City of Vancouver Public Trees | {"cultivar_counts": {"RED FOX": 30, "PENDULA": 5, "MORIOKA WEEPING": 1}, "cultivar_grou… | 0.85 | City of Vancouver public tree inventory, data snapshot 2026-11-02; str | labels as recorded by Parks staff; 'NONE' means not recorded, not the straight species. Labels with n >= 50 have their own size claims (cont |
| ✅ verified | City of Vancouver Public Trees | {"local_area_counts": {"Hastings-Sunrise": 306, "Oakridge": 221, "Renfrew-Collingwood":… | 0.9 | City of Vancouver public tree inventory, data snapshot 2026-11-02; str |  |
| ✅ verified | survey-r06 | {"growing_in": "respondent's backyard", "observation": "leaf has a sweet smell"} | 0.85 | survey d2 note (observed); respondent's own backyard (municipality not |  |
| ✅ verified | survey-r07 | {"note": "commonly planted, proved to be suitable, also having its own feature"} | 0.8 | Metro Vancouver, hypothetical plant list (survey d1) | a designer's local-suitability judgement, not a measurement |
| [ ] `cercidiphyllum-japonicum:vancouver_context:inat01` | iNaturalist observations | {"licensed_verifiable_observations": 8, "research_grade": 2, "all_licences": 9, "years"… | 0.6 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | presence evidence; observation counts reflect observer effort as much as abundance |

- `cercidiphyllum-japonicum:vancouver_context:inat01` — iNaturalist holds 8 openly licensed verifiable observations of this plant in Greater Vancouver (2 research grade), recorded 2021–2026.
