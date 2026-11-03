# Review: *Achillea millefolium* — 53 unverified claims on 21 fields · 2026-11-02

Grouped by field; every live claim on the field is shown (verified ones too) so values can be compared side by side. Tick the id to keep as verified, strike it to reject. Then:

```bash
python3 -I tools/verify_claims.py plants/achillea-millefolium.json --by Kay <ids…>     # or --source rhs
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
| [ ] `achillea-millefolium:hardiness_zone:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 3, "max": 9, "unit": "USDA"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  |  |
| [ ] `achillea-millefolium:hardiness_zone:rhs01` | Royal Horticultural Society | {"rating": "H7", "unit": "RHS", "approx_max_c": -20} | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `achillea-millefolium:hardiness_zone:mobot01` — Missouri Botanical Garden lists Achillea millefolium for USDA zones 3 to 9.
- `achillea-millefolium:hardiness_zone:rhs01` — RHS rates Achillea millefolium hardiness H7 (very hardy, below -20 °C).

### invasive_status

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:invasive_status:iscbc01` | Invasive Species Council of BC | "invasive:not_listed" | 0.9 | BC; ISCBC online species profiles |  |

- `achillea-millefolium:invasive_status:iscbc01` — Achillea millefolium is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-11-02); ISCBC's Grow Me Instead material instead names yarrow as a native, non-invasive alternative to tansy, field scabious and baby's-breath.

### water_drainage

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:water_drainage:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | "water:wide_range" | 0.65 | BC; E-Flora BC atlas page; inferred from habitat and BEC soil-moisture | SMR 0–8 (avg 3) → wide_range; a garden-watering value should come from the horticultural sources |
| [ ] `achillea-millefolium:water_drainage:mobot01` | Missouri Botanical Garden Plant Finder | "water:average" | 0.7 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  | 'dry to medium' spans dry–average; recorded as average with drought/dry-soil tolerance under resistances — Kay may prefer 'dry' |
| [ ] `achillea-millefolium:water_drainage:rhs01` | Royal Horticultural Society | "water:average" | 0.75 | species; RHS plant profile, UK growing conditions | → average; RHS also lists the species under 'Plants for Wet & Dry Conditions' |
| [ ] `achillea-millefolium:water_drainage:usdaplants01` | USDA PLANTS Database | "water:average" | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `achillea-millefolium:water_drainage:eflora01` — E-Flora BC: habitat mesic to dry; BEC plot soil moisture regime runs from very xeric to hydric with a mesic-to-dry average.
- `achillea-millefolium:water_drainage:mobot01` — Missouri Botanical Garden: dry to medium water.
- `achillea-millefolium:water_drainage:rhs01` — RHS: moist but well-drained to well-drained.
- `achillea-millefolium:water_drainage:usdaplants01` — USDA PLANTS: moisture use medium, drought tolerance medium, anaerobic tolerance none.

### mature_height

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:mature_height:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"min": 0.1, "max": 1.0, "unit": "m", "raw": "10–100 cm"} | 0.85 | BC; E-Flora BC atlas page | height varies strongly by ecogeographic form; low-elevation coastal plants near Vancouver fall under var. pacifica (30–100 cm) or var. borea |
| [ ] `achillea-millefolium:mature_height:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 0.6, "max": 0.9, "unit": "m", "raw": "2–3 ft"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  |  |
| [ ] `achillea-millefolium:mature_height:rhs01` | Royal Horticultural Society | {"min": 0.5, "max": 1, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `achillea-millefolium:mature_height:usdaplants01` | USDA PLANTS Database | {"height_m": 0.9, "unit": "m", "raw": "3 ft"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | no 'height at 20 years' characteristic for this species |

- `achillea-millefolium:mature_height:eflora01` — E-Flora BC (Illustrated Flora of BC): erect slender stems 10–100 cm tall; the coastal forms are keyed at 10–40 cm (var. borealis) and 30–100 cm (var. pacifica).
- `achillea-millefolium:mature_height:mobot01` — Missouri Botanical Garden gives a height of 2–3 ft (0.6–0.9 m).
- `achillea-millefolium:mature_height:rhs01` — RHS gives Achillea millefolium an ultimate height of 0.5–1 m.
- `achillea-millefolium:mature_height:usdaplants01` — USDA PLANTS gives a mature height of 3 ft (0.9 m).

### mature_spread

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:mature_spread:mobot01` | Missouri Botanical Garden Plant Finder | {"min": 0.6, "max": 0.9, "unit": "m", "raw": "2–3 ft"} | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  | per clump; the species colonises by rhizomes and self-seeding (see behaviour_with_others) |
| [ ] `achillea-millefolium:mature_spread:rhs01` | Royal Horticultural Society | {"min": 0.1, "max": 0.5, "unit": "m"} | 0.85 | species; RHS plant profile, UK growing conditions | per plant; the species runs by rhizomes into patches (see behaviour_with_others) |

- `achillea-millefolium:mature_spread:mobot01` — Missouri Botanical Garden gives a spread of 2–3 ft (0.6–0.9 m).
- `achillea-millefolium:mature_spread:rhs01` — RHS gives Achillea millefolium an ultimate spread of 0.1–0.5 m.

### maintenance_level

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:maintenance_level:mobot01` | Missouri Botanical Garden Plant Finder | "maintenance:medium" | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  |  |
| [ ] `achillea-millefolium:maintenance_level:rhs01` | Royal Horticultural Society | "maintenance:low" | 0.75 | species; RHS plant profile, UK growing conditions | 'no pruning required' → low; RHS gives no maintenance rating as such |

- `achillea-millefolium:maintenance_level:mobot01` — Missouri Botanical Garden rates maintenance medium.
- `achillea-millefolium:maintenance_level:rhs01` — RHS: no pruning required.

### ecological_value

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r05 | ["origin:native"] | 0.75 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| ✅ verified | survey-r05 | ["origin:native"] | 0.75 | survey d2 note (observed); location not recorded; derived from achille |  |
| [ ] `achillea-millefolium:ecological_value:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["origin:native"] | 0.8 | BC; E-Flora BC atlas — native yarrow genotypes keyed under Achillea bo | native and introduced genotypes both occur in BC and E-Flora splits them by name: A. millefolium (species page) = Exotic / SNA; A. borealis  |
| [ ] `achillea-millefolium:ecological_value:mobot01` | Missouri Botanical Garden Plant Finder | ["ecology:pollinator"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  |  |
| [ ] `achillea-millefolium:ecological_value:rhs01` | Royal Horticultural Society | ["ecology:pollinator"] | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `achillea-millefolium:ecological_value:usdaplants01` | USDA PLANTS Database | ["origin:native"] | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data | USDA lists both N and I for CAN and L48; recorded as native with the dual status in the text |

- `achillea-millefolium:ecological_value:eflora01` — E-Flora BC treats the native coastal yarrow as Achillea borealis var. borealis (synonym A. millefolium var. borealis): origin Native, provincial list Yellow, rank S5 (secure). The A. millefolium species page itself carries origin status Exotic (SNA), while its taxonomic note recognises four native ecogeographic varieties (alpicola, lanulosa, borealis, pacifica).
- `achillea-millefolium:ecological_value:mobot01` — Missouri Botanical Garden: flowers attract butterflies and other insect pollinators.
- `achillea-millefolium:ecological_value:rhs01` — RHS lists Achillea millefolium as a Plant for Pollinators.
- `achillea-millefolium:ecological_value:usdaplants01` — USDA PLANTS records Achillea millefolium as native in Alaska, Canada, the lower 48 states, Greenland and St Pierre et Miquelon, and as also introduced in Canada, the lower 48, Hawaii and St Pierre et Miquelon — native and introduced genotypes both present.

## compare

### exposure

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:exposure:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | ["exposure:full_sun", "exposure:part_sun_part_shade"] | 0.7 | BC; E-Flora BC atlas page; inferred from habitat classes, not a cultiv | exposure read off habitat classes |
| [ ] `achillea-millefolium:exposure:mobot01` | Missouri Botanical Garden Plant Finder | ["exposure:full_sun"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  |  |
| [ ] `achillea-millefolium:exposure:rhs01` | Royal Horticultural Society | ["exposure:full_sun", "exposure:sheltered"] | 0.85 | species; RHS plant profile, UK growing conditions | KPU has no 'Exposed' value; 'Sheltered' kept because RHS lists both |
| [ ] `achillea-millefolium:exposure:usdaplants01` | USDA PLANTS Database | ["exposure:full_sun", "exposure:part_sun_part_shade"] | 0.65 | USDA PLANTS characteristics, US-wide conservation plant data | 'Shade Tolerance: Medium' → full sun to part shade, loose |

- `achillea-millefolium:exposure:eflora01` — E-Flora BC habitat records are open sites — bluffs, meadows, grasslands, rocky slopes and open forests.
- `achillea-millefolium:exposure:mobot01` — Missouri Botanical Garden: full sun.
- `achillea-millefolium:exposure:rhs01` — RHS: full sun; exposed or sheltered sites; any aspect.
- `achillea-millefolium:exposure:usdaplants01` — USDA PLANTS rates shade tolerance medium.

### seasonal_interest

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r08 | {"note": "pretty flowers, many flowers"} | 0.65 | Metro Vancouver, hypothetical plant list (survey d1) |  |
| [ ] `achillea-millefolium:seasonal_interest:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"flower_colour": ["White", "Pink", "Red"], "winter_interest": "has been observed flowe… | 0.85 | BC; E-Flora BC atlas page | 'reddish' → Red; bloom period on the page is USDA data and is recorded under the USDA claim instead |
| [ ] `achillea-millefolium:seasonal_interest:inat03` | iNaturalist observations | {"flowering_months": [6, 7, 8, 9, 10, 11], "annotated_n": 234, "share_threshold": 0.1} | 0.5 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | month included when >= 10% of annotated observations; annotations are volunteer-made |
| [ ] `achillea-millefolium:seasonal_interest:mobot01` | Missouri Botanical Garden Plant Finder | {"flower_colour": ["White"], "flowering_months": [6, 7, 8, 9], "foliage_colour": ["Gree… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  | 'June to September' → months 6–9; 'medium green' → Green |
| [ ] `achillea-millefolium:seasonal_interest:rhs01` | Royal Horticultural Society | {"flower_colour": ["White", "Pink"], "flowering_months": [6, 7, 8], "evergreen": false} | 0.8 | species; RHS plant profile, UK growing conditions | 'summer' → months 6–8; 'cream' has no kpu_colour value; season-by-season table not rendered, foliage colour not recorded |
| [ ] `achillea-millefolium:seasonal_interest:usdaplants01` | USDA PLANTS Database | {"flower_colour": ["White"], "flowering_months": [6], "foliage_colour": ["Green"], "fru… | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data | 'Early Summer' → month 6; 'Leaf Retention: No' → evergreen false |

- `achillea-millefolium:seasonal_interest:eflora01` — E-Flora BC (Illustrated Flora of BC): ray flowers white, sometimes pink or reddish, disk flowers cream; December flowering observed in the Fraser Delta.
- `achillea-millefolium:seasonal_interest:inat03` — iNaturalist phenology annotations in Greater Vancouver (n=234) put flowering mainly in months 6, 7, 8, 9, 10, 11.
- `achillea-millefolium:seasonal_interest:mobot01` — Missouri Botanical Garden: showy white flower heads June to September over fern-like aromatic green foliage.
- `achillea-millefolium:seasonal_interest:rhs01` — RHS: deciduous herbaceous perennial; small white, cream or pink flowers in summer.
- `achillea-millefolium:seasonal_interest:usdaplants01` — USDA PLANTS: conspicuous white flowers in early summer, inconspicuous brown persistent seed in summer, green foliage not retained, no fall colour.

### texture

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:texture:usdaplants01` | USDA PLANTS Database | "texture:fine" | 0.8 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `achillea-millefolium:texture:usdaplants01` — USDA PLANTS: foliage texture fine.

### habit

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:habit:mobot01` | Missouri Botanical Garden Plant Finder | "habit:spreading" | 0.75 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  | 'upright to mat-forming' — Spreading chosen over Upright |
| [ ] `achillea-millefolium:habit:rhs01` | Royal Horticultural Society | "habit:spreading" | 0.85 | species; RHS plant profile, UK growing conditions | 'Spreading branched' → Spreading |
| [ ] `achillea-millefolium:habit:usdaplants01` | USDA PLANTS Database | "habit:upright" | 0.75 | USDA PLANTS characteristics, US-wide conservation plant data | 'Erect' → Upright |

- `achillea-millefolium:habit:mobot01` — Missouri Botanical Garden: rhizomatous, spreading, upright to mat-forming perennial.
- `achillea-millefolium:habit:rhs01` — RHS: spreading, branched habit.
- `achillea-millefolium:habit:usdaplants01` — USDA PLANTS: shape and orientation erect.

### soil_type

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:soil_type:mobot01` | Missouri Botanical Garden Plant Finder | ["soil:well_drained"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  | 'sandy loam' has no KPU class |
| [ ] `achillea-millefolium:soil_type:rhs01` | Royal Horticultural Society | ["soil:well_drained"] | 0.8 | species; RHS plant profile, UK growing conditions | chalk/clay/loam/sand have no KPU class; 'acid or alkaline or neutral' (any pH) not mapped to Acidic/Alkaline |
| [ ] `achillea-millefolium:soil_type:usdaplants01` | USDA PLANTS Database | ["soil:alkaline"] | 0.6 | USDA PLANTS characteristics, US-wide conservation plant data | pH 6–8 is neutral to mildly alkaline; vocab has no 'neutral', so Alkaline is a loose fit — low confidence |

- `achillea-millefolium:soil_type:mobot01` — Missouri Botanical Garden: lean, well-drained sandy loam preferred; tolerates poor soil if drainage is good.
- `achillea-millefolium:soil_type:rhs01` — RHS: well-drained chalk, clay, loam or sand; acid, neutral or alkaline.
- `achillea-millefolium:soil_type:usdaplants01` — USDA PLANTS: pH 6.0–8.0, calcium-carbonate tolerance medium, adapted to medium-textured soils only.

### growth_rate

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:growth_rate:usdaplants01` | USDA PLANTS Database | "growth_rate:moderate" | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `achillea-millefolium:growth_rate:usdaplants01` — USDA PLANTS rates growth rate moderate.

### landscape_use

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r08 | ["use:group_or_mass_planting"] | 0.65 | survey d2 note (mixed); location not recorded; derived from achillea-m | 'large swathes' read as mass planting |
| [ ] `achillea-millefolium:landscape_use:mobot01` | Missouri Botanical Garden Plant Finder | ["use:wild_flower_garden", "use:rock_garden", "use:ground_cover", "use:cut_flower_or_fo… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  | 'meadows, prairies, naturalized areas' → Wild flower garden; 'flowering ground cover or lawn' → Ground cover; cottage and seaside gardens ha |
| [ ] `achillea-millefolium:landscape_use:rhs01` | Royal Horticultural Society | ["use:wild_flower_garden", "use:rock_garden", "use:attract_beneficial_insects"] | 0.8 | species; RHS plant profile, UK growing conditions | 'wildflower meadow' → Wild flower garden; 'gravel garden' → Rock garden (loose); 'wildlife gardens' + Plants for Pollinators → Attract benef |

- `achillea-millefolium:landscape_use:mobot01` — Missouri Botanical Garden: naturalise in meadows, prairies, cottage, seaside and rock gardens; flowering ground cover or mown lawn substitute in sunny out-of-the-way areas; good fresh cut or dried flower; attracts butterflies; too weedy for borders.
- `achillea-millefolium:landscape_use:rhs01` — RHS suggests wildflower meadows, wildlife gardens, gravel gardens and cottage/informal gardens; listed as an RHS Plant for Pollinators.

### pest_susceptibility

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:pest_susceptibility:mobot01` | Missouri Botanical Garden Plant Finder | ["pest:mildew", "pest:rust", "pest:crown_rot"] | 0.7 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  | 'stem rot' has no KPU value; mapped to Crown rot — loose |
| [ ] `achillea-millefolium:pest_susceptibility:rhs01` | Royal Horticultural Society | ["pest:aphids", "pest:mildew"] | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `achillea-millefolium:pest_susceptibility:mobot01` — Missouri Botanical Garden: occasional powdery mildew, rust and stem rot.
- `achillea-millefolium:pest_susceptibility:rhs01` — RHS: may be affected by aphids and powdery mildews.

### resistances

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:resistances:mobot01` | Missouri Botanical Garden Plant Finder | ["browsing:deer", "stress:drought", "stress:urban_pollution"] | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  | 'Dry Soil' folded into drought; 'Urban Conditions' kept as an open value (close to 'urban pollution' in the resistances list) |
| [ ] `achillea-millefolium:resistances:rhs01` | Royal Horticultural Society | ["stress:drought"] | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `achillea-millefolium:resistances:usdaplants01` | USDA PLANTS Database | ["stress:drought"] | 0.6 | USDA PLANTS characteristics, US-wide conservation plant data | 'Drought Tolerance: Medium' — borderline; recorded at low confidence; not salt tolerant |

- `achillea-millefolium:resistances:mobot01` — Missouri Botanical Garden lists tolerance of deer, drought, dry soil and urban conditions.
- `achillea-millefolium:resistances:rhs01` — RHS marks Achillea millefolium as drought resistant.
- `achillea-millefolium:resistances:usdaplants01` — USDA PLANTS rates drought tolerance medium; salinity tolerance low.

## extended

### time_to_intended_size

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:time_to_intended_size:rhs01` | Royal Horticultural Society | {"min": 2, "max": 5, "unit": "years", "measure": "time to ultimate height"} | 0.85 | species; RHS plant profile, UK growing conditions |  |

- `achillea-millefolium:time_to_intended_size:rhs01` — RHS gives Achillea millefolium 2–5 years to reach its ultimate height.

### long_term_performance

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:long_term_performance:mobot01` | Missouri Botanical Garden Plant Finder | {"stems": "weak, lodge easily; flop in hot humid weather or rich moist soil; wind and h… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  |  |
| [ ] `achillea-millefolium:long_term_performance:usdaplants01` | USDA PLANTS Database | {"lifespan": "moderate", "seedling_vigor": "low", "temperature_minimum_f": -38, "frost_… | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data |  |

- `achillea-millefolium:long_term_performance:mobot01` — Missouri Botanical Garden flags weak, flopping stems (worse in rich moist soil), a tangled look by late summer unless cut back, and a need for shelter from strong wind.
- `achillea-millefolium:long_term_performance:usdaplants01` — USDA PLANTS: moderate lifespan, low seedling vigour, minimum temperature -38 °F, 120 frost-free days, 8–60 in precipitation, roots to at least 8 in.

### behaviour_with_others

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r08 | {"spread": "vigorous under certain conditions", "advice": "use cautiously", "upside": "… | 0.7 | survey d2 note (mixed); location not recorded |  |
| [ ] `achillea-millefolium:behaviour_with_others:mobot01` | Missouri Botanical Garden Plant Finder | {"spread": "aggressive; rhizomes and self-seeding; naturalises into large colonies if u… | 0.8 | species; Missouri Botanical Garden Plant Finder, St. Louis (USDA zone  |  |
| [ ] `achillea-millefolium:behaviour_with_others:rhs01` | Royal Horticultural Society | {"spread": "spreads readily by rhizomes; can colonise fine lawns"} | 0.85 | species; RHS plant profile, UK growing conditions |  |
| [ ] `achillea-millefolium:behaviour_with_others:usdaplants01` | USDA PLANTS Database | {"growth_form": "rhizomatous", "vegetative_spread_rate": "slow", "seed_spread_rate": "s… | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | 'slow' spread rates disagree with RHS ('spreads readily') and MOBOT ('aggressive'); kept side by side (R1) |

- `achillea-millefolium:behaviour_with_others:mobot01` — Missouri Botanical Garden: spreads aggressively by rhizomes and self-seeding and can form substantial colonies; divide every 2–3 years.
- `achillea-millefolium:behaviour_with_others:rhs01` — RHS warns that the species spreads readily and is unwelcome in fine lawns; propagated by seed or spring division.
- `achillea-millefolium:behaviour_with_others:usdaplants01` — USDA PLANTS: rhizomatous growth form with slow vegetative and seed spread rates, high fire tolerance, not allelopathic.

### toxicity

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| [ ] `achillea-millefolium:toxicity:usdaplants01` | USDA PLANTS Database | {"usda_rating": "slight", "humans": "unknown", "pets": "unknown"} | 0.7 | USDA PLANTS characteristics, US-wide conservation plant data | USDA 'Toxicity' characteristic is a livestock / conservation rating (None / Slight / Moderate / Severe); humans and pets stay unknown until  |

- `achillea-millefolium:toxicity:usdaplants01` — USDA PLANTS gives a toxicity rating of 'Slight' for this species; the rating is a US conservation-planting characteristic and says nothing specific about pets or people.

### vancouver_context

| review | source | value | conf | context | mapping / note |
|---|---|---|---|---|---|
| ✅ verified | survey-r05 | {"performance": "does well in the local climate", "origin_note": "native species"} | 0.8 | survey d2 note (observed); location not recorded |  |
| [ ] `achillea-millefolium:vancouver_context:eflora01` | E-Flora BC: Electronic Atlas of the Flora of British Columbia | {"habitat": ["coastal bluffs", "meadows", "grasslands", "rocky slopes", "open forests",… | 0.9 | BC; E-Flora BC atlas page |  |
| [ ] `achillea-millefolium:vancouver_context:inat01` | iNaturalist observations | {"licensed_verifiable_observations": 2063, "research_grade": 1502, "all_licences": 2630… | 0.6 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | presence evidence; observation counts reflect observer effort as much as abundance |
| [ ] `achillea-millefolium:vancouver_context:inat02` | iNaturalist observations | {"observations_by_month": {"1": 45, "2": 25, "3": 44, "4": 187, "5": 159, "6": 268, "7"… | 0.55 | Greater Vancouver, BC (iNaturalist place 27530); iNaturalist verifiabl | observer effort, not plant activity — the plant is evergreen/visible year-round; use for 'when people notice it', not phenology |

- `achillea-millefolium:vancouver_context:eflora01` — E-Flora BC: common throughout BC on mesic to dry coastal bluffs, meadows, grasslands, rocky slopes and open forests in every vegetation zone, from sea level to 2854 m (BEC plots: modal zone IDF, CDF and CWH both recorded); observed flowering in the Fraser Delta in December.
- `achillea-millefolium:vancouver_context:inat01` — iNaturalist holds 2063 openly licensed verifiable observations of this plant in Greater Vancouver (1502 research grade), recorded 2012–2026.
- `achillea-millefolium:vancouver_context:inat02` — Monthly spread of 2063 Greater Vancouver observations: most in 9, 10, 7 (month numbers).
