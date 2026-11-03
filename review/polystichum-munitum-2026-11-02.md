# Review: *Polystichum munitum* — 59 unverified claims on 21 fields · 2026-11-02

Grouped by field; every live claim on the field is shown (verified ones too) so values can be compared side by side. Tick the id to keep as verified, strike it to reject. Then:

```bash
python3 -I tools/verify_claims.py plants/polystichum-munitum.json --by Kay <ids…>     # or --source rhs
```

Values are structured only; `text` was written from the value, never copied. *mapping* flags where a source term was forced into the KPU vocabulary.
KPU (tier C) is linked from the entity only; none of its values are stored, even where its page shows a figure that disagrees with the sources below (D2).

## Sources in this review

- **E-Flora BC: Electronic Atlas of the Flora of British Columbia** (`eflora`, tier B, checked 2026-10-29): Home page (linnet.geog.ubc.ca/biodiversity/eflora/, 2026-10-29): 'All content on E-Flora BC is covered by Canadian Copyright Law.' Photographs: 'adherence to copyright law is the responsibility of the photographer' — 'Co…
- **Great Plant Picks** (`gpp`, tier B, checked 2026-10-29): No terms page. Footer (greatplantpicks.org, 2026-10-29): 'Text and photos ©2025 Great Plant Picks/Elisabeth Carey Miller Garden except where otherwise noted'. GPP describes itself as 'the primary educational program of t…
- **iNaturalist observations** (`inat`, tier B, checked 2026-10-29): Site terms page (inaturalist.org/pages/terms) could not be read on 2026-10-29: Cloudflare bot check blocked both WebFetch and the built-in browser. Recorded instead: (1) api.inaturalist.org swagger info.description — pub…
- **Invasive Species Council of BC** (`iscbc`, tier B, checked 2026-10-29): No terms of use. Footer: '© 2023 Invasive Species Council of BC. All rights reserved.' Only a privacy policy PDF is linked (Policy 304, Feb 2019).
- **Oregon State University Landscape Plants** (`osu`, tier B, checked 2026-10-29): No terms of use published. Footer: 'Copyright ©2026 Oregon State University'; oregonstate.edu/copyright is a DMCA notice page only. Site is a Dept. of Horticulture teaching resource with a references page.
- **Royal Horticultural Society — Plants (plant profiles)** (`rhs`, tier B, checked 2026-10-29): No site-wide terms page found (2026-10-29); rhs.org.uk/terms-and-conditions redirects to ChatBotanist terms. Section-specific terms (VLE, heritage catalogue) state RHS owns copyright in site content and bar copying excep…
- **USDA PLANTS Database** (`usda_plants`, tier A, checked 2026-10-29): USDA Policies and Links (usda.gov/about-usda/policies-and-links, 2026-10-29): 'Most information presented on the USDA Web site is considered public domain information. Public domain information may be freely distributed …

## gate

### hardiness_zone

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:hardiness_zone:gpp01` | Great Plant Picks | {"min": 6, "max": 8, "unit": "USDA"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `polystichum-munitum:hardiness_zone:osu01` | Oregon State University Landscape Plants | {"usda_min": 4, "unit": "USDA"} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `polystichum-munitum:hardiness_zone:rhs01` | Royal Horticultural Society | {"rating": "H7", "unit": "RHS", "approx_max_c": -20} | 0.85 | species; RHS plant profile, UK growing conditions | page read 2026-11-02 shows H7, not the H6 anticipated in the task brief |

- `polystichum-munitum:hardiness_zone:gpp01` — Great Plant Picks lists Polystichum munitum for USDA zones 6 to 8.
- `polystichum-munitum:hardiness_zone:osu01` — Oregon State University: hardy to USDA zone 4.
- `polystichum-munitum:hardiness_zone:rhs01` — RHS rates Polystichum munitum hardiness H7 (very hardy, below -20 °C).

### invasive_status

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:invasive_status:iscbc01` | Invasive Species Council of BC | "invasive:not_listed" | 0.9 | BC; ISCBC online species profiles |  |

- `polystichum-munitum:invasive_status:iscbc01` — Polystichum munitum is not among the plant profiles on the Invasive Species Council of BC list and returns no site-search result (checked 2026-11-02); it is a BC native.

### water_drainage

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:water_drainage:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | "water:average" | 0.7 | BC; E-Flora BC atlas page; inferred from habitat and soil moisture reg | mesic → average |
| [ ] `polystichum-munitum:water_drainage:gpp01` | Great Plant Picks | "water:wide_range" | 0.8 | species; Great Plant Picks, maritime Pacific Northwest | 'from wet to dry' → wide_range |
| [ ] `polystichum-munitum:water_drainage:osu01` | Oregon State University Landscape Plants | "water:moist" | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | 'ample water' → moist |
| [ ] `polystichum-munitum:water_drainage:rhs01` | Royal Horticultural Society | "water:average" | 0.75 | species; RHS plant profile, UK growing conditions | 'moist but well-drained' → average |
| [ ] `polystichum-munitum:water_drainage:usdaplants01` | USDA PLANTS Database | "water:moist" | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | drought tolerance low contradicts GPP 'drought tolerant in shade once established' |

- `polystichum-munitum:water_drainage:eflora01` — E-Flora BC: moist to mesic forests; average soil moisture regime 4 (mesic).
- `polystichum-munitum:water_drainage:gpp01` — Great Plant Picks: tolerates wet to dry sites; water occasionally in dry periods.
- `polystichum-munitum:water_drainage:osu01` — Oregon State University: ample water.
- `polystichum-munitum:water_drainage:rhs01` — RHS: moist but well-drained.
- `polystichum-munitum:water_drainage:usdaplants01` — USDA PLANTS: moisture use high, drought tolerance low, anaerobic tolerance low.

### mature_height

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:mature_height:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"min": 0.2, "max": 1.5, "unit": "m", "raw": "leaves 20–150 cm long"} | 0.8 | BC; E-Flora BC atlas page | leaf length, not a stated plant height — loose |
| [ ] `polystichum-munitum:mature_height:gpp01` | Great Plant Picks | {"height_m": 1.2, "unit": "m", "raw": "4 ft"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest | mature height from the GPP search results table; the profile page gives only the 10-year size |
| [ ] `polystichum-munitum:mature_height:osu01` | Oregon State University Landscape Plants | {"min": 0.3, "max": 1.2, "unit": "m", "raw": "fronds 1–4 ft"} | 0.75 | species; Oregon State University Landscape Plants, Willamette Valley | OSU gives frond length, not a plant height; used as height because the fronds are stiffly erect — loose |
| [ ] `polystichum-munitum:mature_height:rhs01` | Royal Horticultural Society | {"min": 1, "max": 1.5, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `polystichum-munitum:mature_height:usdaplants01` | USDA PLANTS Database | {"height_m": 1.07, "unit": "m", "raw": "3.5 ft mature"} | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data | no 20-year height is listed for this species |

- `polystichum-munitum:mature_height:eflora01` — E-Flora BC: evergreen perennial from a short stout rhizome, leaves 20–150 cm long.
- `polystichum-munitum:mature_height:gpp01` — Great Plant Picks gives Polystichum munitum a mature height of 4 ft (1.2 m).
- `polystichum-munitum:mature_height:osu01` — Oregon State University: fronds 1–4 ft (0.3–1.2 m) long, stiffly erect from a dense crown.
- `polystichum-munitum:mature_height:rhs01` — RHS gives Polystichum munitum an ultimate height of 1–1.5 m.
- `polystichum-munitum:mature_height:usdaplants01` — USDA PLANTS gives a mature height of 3.5 ft (1.1 m).

### mature_spread

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:mature_spread:rhs01` | Royal Horticultural Society | {"min": 1, "max": 1.5, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `polystichum-munitum:mature_spread:rhs01` — RHS gives Polystichum munitum an ultimate spread of 1–1.5 m.

### maintenance_level

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:maintenance_level:gpp01` | Great Plant Picks | "maintenance:low" | 0.7 | species; Great Plant Picks, maritime Pacific Northwest | single optional annual cut-back → low |
| [ ] `polystichum-munitum:maintenance_level:rhs01` | Royal Horticultural Society | "maintenance:low" | 0.75 | species; RHS plant profile, UK growing conditions | 'easy to grow' + minimal pruning → low |

- `polystichum-munitum:maintenance_level:gpp01` — Great Plant Picks: optional cut-back to the ground in late winter; only every three years on poor or dry soil.
- `polystichum-munitum:maintenance_level:rhs01` — RHS: easy to grow; pruning limited to removing dead or damaged fronds.

### ecological_value

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r08 | ["origin:native"] | 0.65 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| ✅ verified | survey-r10 | ["origin:native"] | 0.8 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| [ ] `polystichum-munitum:ecological_value:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["origin:native"] | 0.9 | BC; E-Flora BC atlas page |  |
| [ ] `polystichum-munitum:ecological_value:gpp01` | Great Plant Picks | ["origin:native"] | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `polystichum-munitum:ecological_value:osu01` | Oregon State University Landscape Plants | ["origin:native"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `polystichum-munitum:ecological_value:rhs01` | Royal Horticultural Society | ["origin:native"] | 0.8 | species; RHS plant profile, UK growing conditions | range statement, not a BC-specific native status |
| [ ] `polystichum-munitum:ecological_value:usdaplants01` | USDA PLANTS Database | ["origin:native"] | 0.8 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `polystichum-munitum:ecological_value:eflora01` — E-Flora BC lists Polystichum munitum as native to BC (provincial list Yellow, rank S5, secure; COSEWIC not listed).
- `polystichum-munitum:ecological_value:gpp01` — Great Plant Picks describes Polystichum munitum as one of the most useful native ferns of the Pacific Northwest.
- `polystichum-munitum:ecological_value:osu01` — Oregon State University: native from Alaska to California, east to western Montana; native to Oregon.
- `polystichum-munitum:ecological_value:rhs01` — RHS: plant range western North America; not native to Great Britain or Ireland.
- `polystichum-munitum:ecological_value:usdaplants01` — USDA PLANTS: native in Alaska, Canada and the lower 48 states.

## compare

### exposure

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:exposure:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["exposure:filtered_shade", "exposure:part_sun_part_shade"] | 0.7 | BC; E-Flora BC atlas page; inferred from habitat classes, not a cultiv | exposure read off habitat (forest understory) |
| [ ] `polystichum-munitum:exposure:gpp01` | Great Plant Picks | ["exposure:part_sun_part_shade", "exposure:filtered_shade", "exposure:deep_shade"] | 0.85 | species; Great Plant Picks, maritime Pacific Northwest | GPP 'light shade' → Part sun/part shade, 'dappled/open shade' → Filtered shade |
| [ ] `polystichum-munitum:exposure:gpp02` | Great Plant Picks | ["exposure:full_sun_only_if_soil_kept_moist"] | 0.8 | species; Great Plant Picks, maritime Pacific Northwest; full sun with  | second condition from the same source (M15) |
| [ ] `polystichum-munitum:exposure:osu01` | Oregon State University Landscape Plants | ["exposure:part_sun_part_shade", "exposure:deep_shade"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley | 'shade' → Deep shade |
| [ ] `polystichum-munitum:exposure:osu02` | Oregon State University Landscape Plants | ["exposure:full_sun"] | 0.75 | var. imbricans (compact sun form); Oregon State University Landscape P | variety-level condition, separate claim (M15) |
| [ ] `polystichum-munitum:exposure:rhs01` | Royal Horticultural Society | ["exposure:deep_shade", "exposure:part_sun_part_shade", "exposure:sheltered"] | 0.85 | species; RHS plant profile, UK growing conditions | KPU has no 'Exposed' value; RHS 'full shade' → Deep shade |
| [ ] `polystichum-munitum:exposure:usdaplants01` | USDA PLANTS Database | ["exposure:full_sun"] | 0.5 | USDA PLANTS characteristics, US-wide conservation plant data | 'Shade Tolerance: Low' contradicts RHS, GPP, OSU and E-Flora (shade plant); kept side by side at low confidence (R1) |

- `polystichum-munitum:exposure:eflora01` — E-Flora BC habitat is moist to mesic forest.
- `polystichum-munitum:exposure:gpp01` — Great Plant Picks: light to deep shade is best.
- `polystichum-munitum:exposure:gpp02` — Great Plant Picks: grows in full sun if watered regularly in summer.
- `polystichum-munitum:exposure:osu01` — Oregon State University: part shade to shade.
- `polystichum-munitum:exposure:osu02` — Oregon State University: the compact sun form, var. imbricans, prefers full sun.
- `polystichum-munitum:exposure:rhs01` — RHS: full or partial shade; exposed or sheltered sites; north, east or west aspect.
- `polystichum-munitum:exposure:usdaplants01` — USDA PLANTS rates shade tolerance low.

### seasonal_interest

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r10 | {"evergreen": true} | 0.8 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| [ ] `polystichum-munitum:seasonal_interest:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"evergreen": true} | 0.9 | BC; E-Flora BC atlas page |  |
| [ ] `polystichum-munitum:seasonal_interest:gpp01` | Great Plant Picks | {"evergreen": true} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `polystichum-munitum:seasonal_interest:osu01` | Oregon State University Landscape Plants | {"foliage_colour": ["Green"], "evergreen": true} | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `polystichum-munitum:seasonal_interest:rhs01` | Royal Horticultural Society | {"foliage_colour": ["Green"], "evergreen": true} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `polystichum-munitum:seasonal_interest:usdaplants01` | USDA PLANTS Database | {"foliage_colour": ["Green"], "evergreen": false} | 0.5 | USDA PLANTS characteristics, US-wide conservation plant data | 'Leaf Retention: No' contradicts RHS, GPP, OSU and E-Flora (evergreen); recorded as given at low confidence. USDA 'Flower Color: Brown / Flo |

- `polystichum-munitum:seasonal_interest:eflora01` — E-Flora BC: evergreen perennial.
- `polystichum-munitum:seasonal_interest:gpp01` — Great Plant Picks: evergreen; no flowers.
- `polystichum-munitum:seasonal_interest:osu01` — Oregon State University: evergreen; leathery, shiny, dark green fronds.
- `polystichum-munitum:seasonal_interest:rhs01` — RHS: evergreen fern with dark green pinnate fronds; no flowers.
- `polystichum-munitum:seasonal_interest:usdaplants01` — USDA PLANTS: dark green foliage; leaf retention recorded as no; fall conspicuous yes.

### texture

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:texture:osu01` | Oregon State University Landscape Plants | "texture:medium" | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `polystichum-munitum:texture:usdaplants01` | USDA PLANTS Database | "texture:medium" | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `polystichum-munitum:texture:osu01` — Oregon State University: medium texture.
- `polystichum-munitum:texture:usdaplants01` — USDA PLANTS: foliage texture medium.

### form

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:form:gpp01` | Great Plant Picks | "form:mounded" | 0.8 | species; Great Plant Picks, maritime Pacific Northwest |  |

- `polystichum-munitum:form:gpp01` — Great Plant Picks: forms a shapely, arching mound.

### habit

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:habit:gpp01` | Great Plant Picks | "habit:arching" | 0.8 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `polystichum-munitum:habit:osu01` | Oregon State University Landscape Plants | "habit:stiffly_upright" | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `polystichum-munitum:habit:rhs01` | Royal Horticultural Society | "habit:dense" | 0.75 | species; RHS plant profile, UK growing conditions | 'Bushy' has no KPU label → Dense, loose |

- `polystichum-munitum:habit:gpp01` — Great Plant Picks: arching fronds.
- `polystichum-munitum:habit:osu01` — Oregon State University: stiffly erect fronds from a dense crown.
- `polystichum-munitum:habit:rhs01` — RHS: bushy habit, forming a large clump of erect fronds.

### soil_type

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:soil_type:gpp01` | Great Plant Picks | ["soil:well_drained", "soil:humus_rich"] | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `polystichum-munitum:soil_type:osu01` | Oregon State University Landscape Plants | ["soil:humus_rich"] | 0.8 | species; Oregon State University Landscape Plants, Willamette Valley |  |
| [ ] `polystichum-munitum:soil_type:rhs01` | Royal Horticultural Society | ["soil:well_drained", "soil:humus_rich"] | 0.8 | species; RHS plant profile, UK growing conditions | chalk/clay/loam/sand have no KPU class; acid-or-alkaline-or-neutral not mapped; 'Humus rich' taken from the cultivation note |
| [ ] `polystichum-munitum:soil_type:usdaplants01` | USDA PLANTS Database | ["soil:acidic"] | 0.6 | USDA PLANTS characteristics, US-wide conservation plant data | pH range spans acid to mildly alkaline — Acidic is a loose mapping of the lower bound |

- `polystichum-munitum:soil_type:gpp01` — Great Plant Picks: well-drained, humus-rich soil preferred; tolerates poorer soil once established.
- `polystichum-munitum:soil_type:osu01` — Oregon State University: rich soil with organic matter.
- `polystichum-munitum:soil_type:rhs01` — RHS: moist but well-drained chalk, clay, loam or sand; acid, neutral or alkaline; cultivation note asks for fertile, humus-rich soil.
- `polystichum-munitum:soil_type:usdaplants01` — USDA PLANTS: pH 5.8–7.5, adapted to medium-textured soils only; CaCO3 tolerance medium, salinity tolerance none.

### growth_rate

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:growth_rate:usdaplants01` | USDA PLANTS Database | "growth_rate:moderate" | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `polystichum-munitum:growth_rate:usdaplants01` — USDA PLANTS rates growth rate moderate.

### landscape_use

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r10 | ["use:filler"] | 0.8 | Metro Vancouver, hypothetical plant list (survey d1) | 'fills up space' read as the KPU use Filler; could also be Ground cover |
| [ ] `polystichum-munitum:landscape_use:gpp01` | Great Plant Picks | ["use:specimen_plant", "use:group_or_mass_planting", "use:ground_cover", "use:native_pl… | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `polystichum-munitum:landscape_use:rhs01` | Royal Horticultural Society | ["use:perennial_border", "use:mixed_shrub_border"] | 0.75 | species; RHS plant profile, UK growing conditions | 'flower borders and beds' → Perennial border; 'underplanting of roses and shrubs' → Mixed shrub border (loose); 'cottage and informal garden |

- `polystichum-munitum:landscape_use:gpp01` — Great Plant Picks: a specimen or massed as a tall groundcover; a Pacific Northwest native staple.
- `polystichum-munitum:landscape_use:rhs01` — RHS suggests cottage and informal gardens, flower borders and beds, and underplanting of roses and shrubs.

### resistances

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:resistances:gpp01` | Great Plant Picks | ["stress:drought"] | 0.85 | species; Great Plant Picks, maritime Pacific Northwest; in shade, once |  |
| [ ] `polystichum-munitum:resistances:rhs01` | Royal Horticultural Society | ["pest:pest", "pest:disease"] | 0.8 | species; RHS plant profile, UK growing conditions |  |

- `polystichum-munitum:resistances:gpp01` — Great Plant Picks: drought tolerant in shade once established, including dry shade under Douglas fir and western red cedar.
- `polystichum-munitum:resistances:rhs01` — RHS: generally pest-free outdoors and generally disease-free.

## extended

### time_to_intended_size

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:time_to_intended_size:gpp01` | Great Plant Picks | {"years": 10, "height_m": 0.91, "spread_m": 0.91, "unit": "m at 10 years"} | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `polystichum-munitum:time_to_intended_size:rhs01` | Royal Horticultural Society | {"min": 2, "max": 5, "unit": "years", "measure": "time to ultimate height"} | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `polystichum-munitum:time_to_intended_size:gpp01` — Great Plant Picks gives Polystichum munitum a 10-year size of 3 ft tall by 3 ft wide (0.9 × 0.9 m).
- `polystichum-munitum:time_to_intended_size:rhs01` — RHS gives Polystichum munitum 2–5 years to reach its ultimate height.

### long_term_performance

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r10 | {"resilience": "survives anywhere it is put"} | 0.85 | survey d2 note (read); location not recorded |  |
| [ ] `polystichum-munitum:long_term_performance:rhs01` | Royal Horticultural Society | {"winter_wet": "protect crowns from excessive winter wet"} | 0.8 | species; RHS plant profile, UK growing conditions |  |

- `polystichum-munitum:long_term_performance:rhs01` — RHS advises protecting the crowns from excessive winter wet.

### behaviour_with_others

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:behaviour_with_others:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"growth_form": "short, stout rhizome", "associated_species": ["Achlys triphylla", "Mah… | 0.85 | BC; E-Flora BC atlas page |  |
| [ ] `polystichum-munitum:behaviour_with_others:gpp01` | Great Plant Picks | {"tolerates": "dry shade under dense Douglas fir and western red cedar", "companions": … | 0.85 | species; Great Plant Picks, maritime Pacific Northwest |  |
| [ ] `polystichum-munitum:behaviour_with_others:usdaplants01` | USDA PLANTS Database | {"growth_form": "rhizomatous", "vegetative_spread_rate": "moderate", "lifespan": "long"… | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `polystichum-munitum:behaviour_with_others:eflora01` — E-Flora BC: commonly associated with vanilla-leaf, dull Oregon-grape and three-leaved foamflower; grows from a short stout rhizome.
- `polystichum-munitum:behaviour_with_others:gpp01` — Great Plant Picks: tolerates dry shade under Douglas fir and western red cedar; listed combinations include false Solomon's seal, spring vetchling, European wild ginger, rhododendrons, western trillium, Hosta 'Fragrant Blue', Arisaema sikokianum, evergreen huckleberry and Pulmonaria longifolia ssp. cevennensis.
- `polystichum-munitum:behaviour_with_others:usdaplants01` — USDA PLANTS: rhizomatous with moderate vegetative spread, long-lived, no resprout or coppice ability, medium fire tolerance, not allelopathic.

### toxicity

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:toxicity:usdaplants01` | USDA PLANTS Database | {"usda_rating": "none", "humans": "unknown", "pets": "unknown"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | livestock/conservation-planting characteristic, not a human or pet assessment (M17) |

- `polystichum-munitum:toxicity:usdaplants01` — USDA PLANTS lists toxicity as none.

### vancouver_context

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `polystichum-munitum:vancouver_context:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"habitat": ["moist to mesic forests", "lowland", "montane", "water-receiving and collu… | 0.9 | BC; E-Flora BC atlas page |  |
| [ ] `polystichum-munitum:vancouver_context:inat01` | iNaturalist observations | {"licensed_verifiable_observations": 8110, "research_grade": 7816, "all_licences": 1030… | 0.6 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | presence evidence; observation counts reflect observer effort as much as abundance |
| [ ] `polystichum-munitum:vancouver_context:inat02` | iNaturalist observations | {"observations_by_month": {"1": 544, "2": 391, "3": 732, "4": 1516, "5": 789, "6": 580,… | 0.55 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | observer effort, not plant activity — the plant is evergreen/visible year-round; use for 'when people notice it', not phenology |

- `polystichum-munitum:vancouver_context:eflora01` — E-Flora BC: common in coastal BC in moist to mesic lowland and montane forests, overwhelmingly in the Coastal Western Hemlock zone, on mesic, nutrient-medium, nitrogen-rich sites.
- `polystichum-munitum:vancouver_context:inat01` — iNaturalist holds 8110 openly licensed verifiable observations of this plant in Greater Vancouver (7816 research grade), recorded 1997–2026.
- `polystichum-munitum:vancouver_context:inat02` — Monthly spread of 8110 Greater Vancouver observations: most in 4, 9, 10 (month numbers).
