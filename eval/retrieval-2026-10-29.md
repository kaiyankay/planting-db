# T6 retrieval test · 2026-10-29

T6 test set = survey e2 (six 'one search you would actually type') + c4 (two 'one thing you could not find'). The verbatim strings live in the survey export (inputs/survey/, not on this machine on 2026-10-29); these are RECONSTRUCTED from the intent_map.json mappings and must be replaced by the verbatim text when T4 runs. status: proxy.

Store: 165 claims over 3 plants · semantic route = BM25 stand-in (no embedding model installed) · ranking R5 · answers R6
**8 / 8 queries answered with sources (or honestly empty where no source exists).**


## e2-r01 (proxy) — PASS

### `low maintenance plant with seasonal interest`

- names: none · intents: low maintenance → maintenance_level (gate), seasonal interest → seasonal_interest (compare)
- gates: **acer-palmatum** low maintenance=pass; **gaultheria-shallon** low maintenance=unknown; **vaccinium-ovatum** low maintenance=pass
- candidates after gates: acer-palmatum, gaultheria-shallon, vaccinium-ovatum
- recall: 30 claims by similarity; shown in R5 order (similarity ignored for order); 4 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Gaultheria shallon*
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=96) put fruiting mainly in months 7, 8, 9.  
  `gaultheria-shallon:seasonal_interest:inat04` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=129) put flowering mainly in months 5, 6, 7.  
  `gaultheria-shallon:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: common in western BC from dry to wet forest, bog, cutover and shaded understory at low to montane elevations, mostly in the Coastal Western Hemlock zone.  
  `gaultheria-shallon:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen glossy leaves; white or pinkish urn flowers in late spring; black edible fruit in summer.  
  `gaultheria-shallon:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: conspicuous white flowers mid spring, abundant purple fruit summer to fall, leaves retained.  
  `gaultheria-shallon:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS: moisture use high, drought tolerance low.  
  `gaultheria-shallon:water_drainage:usdaplants01` · water_drainage · ranked by database (priority 2) → geo north_america → confidence 0.7
- USDA PLANTS Database [unverified]: USDA PLANTS rates shade tolerance low.  
  `gaultheria-shallon:exposure:usdaplants01` · exposure · ranked by database (priority 2) → geo north_america → confidence 0.55
- Royal Horticultural Society [unverified]: RHS: evergreen; light pink and white flowers in early summer; dark purple fruit ripening late summer.  
  `gaultheria-shallon:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Royal Horticultural Society [unverified]: RHS rates Gaultheria shallon hardiness H5 (cold winter, about -15 to -10 °C).  
  `gaultheria-shallon:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85

*Vaccinium ovatum*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: frequent in south-west BC in dry to moist open forest at low to montane elevations, mostly in the Coastal Western Hemlock zone — the zone Vancouver sits in.  
  `vaccinium-ovatum:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Great Plant Picks [unverified]: Great Plant Picks: copper-bronze spring foliage maturing dark green; small white urn flowers in spring; blue-black berries by late summer.  
  `vaccinium-ovatum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks: informal groupings, natural low screen, shears into a dense formal hedge; a Pacific Northwest native.  
  `vaccinium-ovatum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen glossy dark green leaves on reddish stems; pale pink urn-shaped flowers in spring; edible fruit red then blue-black by late summer.  
  `vaccinium-ovatum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks: little pruning needed.  
  `vaccinium-ovatum:maintenance_level:gpp01` · maintenance_level · ranked by database (priority 2) → geo pnw → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS: white flowers in late spring, conspicuous purple fruit in summer, leaves retained.  
  `vaccinium-ovatum:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS rates shade tolerance low.  
  `vaccinium-ovatum:exposure:usdaplants01` · exposure · ranked by database (priority 2) → geo north_america → confidence 0.6
- USDA PLANTS Database [unverified]: USDA PLANTS rates drought tolerance medium and moisture use low.  
  `vaccinium-ovatum:resistances:usdaplants01` · resistances · ranked by database (priority 2) → geo north_america → confidence 0.6
- Royal Horticultural Society [unverified]: RHS: evergreen; pale pink urn-shaped flowers in spring; fruit red turning blue-black.  
  `vaccinium-ovatum:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Royal Horticultural Society [unverified]: RHS rates Vaccinium ovatum hardiness H4 (average UK winter, about -10 to -5 °C).  
  `vaccinium-ovatum:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks: one of the most brilliant red autumn colours among Japanese maples; green foliage in season.  
  `acer-palmatum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks: full sun or light to open shade; best autumn colour in full sun to open shade.  
  `acer-palmatum:exposure:gpp01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: small red to purple flowers with the new leaves; scarlet, orange or yellow fall colour; samaras ripen early fall.  
  `acer-palmatum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: small red flowers in spring; deciduous with good autumn colour.  
  `acer-palmatum:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Royal Horticultural Society [unverified]: RHS: 'Bloodgood' has deep red-purple foliage, small purple flowers and red autumn colour.  
  `acer-palmatum:seasonal_interest:rhs02` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance as low; pruning best kept to a minimum.  
  `acer-palmatum:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: reddish-purple flowers in April, insignificant; good fall colour in yellow, red-purple and bronze.  
  `acer-palmatum:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8


## e2-r02 (proxy) — PASS

### `plants for a house garden in Vancouver`

- names: none · intents: house garden → landscape_use (compare), my area → _source_geo (rank_boost)
- candidates after gates: acer-palmatum, gaultheria-shallon, vaccinium-ovatum
- recall: 39 claims by similarity; shown in R5 order (similarity ignored for order); 2 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Acer palmatum*
- iNaturalist observations [unverified]: iNaturalist holds 20 openly licensed verifiable observations of this plant in Greater Vancouver (6 research grade), recorded 2019–2026.  
  `acer-palmatum:vancouver_context:inat01` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.6
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden uses: specimen or accent, groups, sun-dappled understory, woodland garden margins, screen, bonsai.  
  `acer-palmatum:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates water needs as medium.  
  `acer-palmatum:water_drainage:mobot01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden lists Acer palmatum for USDA zones 5 to 8.  
  `acer-palmatum:hardiness_zone:mobot01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden lists Acer palmatum as tolerating rabbits and black walnut.  
  `acer-palmatum:resistances:mobot01` · resistances · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance as low; pruning best kept to a minimum.  
  `acer-palmatum:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden gives Acer palmatum a spread of 10–25 ft (3–7.6 m).  
  `acer-palmatum:mature_spread:mobot01` · mature_spread · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden gives Acer palmatum a height of 10–25 ft (3–7.6 m), infrequently to 40 ft.  
  `acer-palmatum:mature_height:mobot01` · mature_height · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: full sun to part shade, afternoon shade in hot regions, sited away from strong winds.  
  `acer-palmatum:exposure:mobot01` · exposure · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: reddish-purple flowers in April, insignificant; good fall colour in yellow, red-purple and bronze.  
  `acer-palmatum:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: moist, organically rich, slightly acidic, well-drained soil; grows well in sandy loam.  
  `acer-palmatum:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden lists aphids, scale, borers, bagworms, root weevils and mites; stem canker, leaf spots, fusarium, verticillium wilt, botrytis, anthracnose and root rots; late-frost damage and chlorosis on high-pH soils.  
  `acer-palmatum:pest_susceptibility:mobot01` · pest_susceptibility · ranked by database (priority 2) → geo global → confidence 0.8
- … 11 more

*Gaultheria shallon*
- iNaturalist observations [unverified]: iNaturalist holds 5382 openly licensed verifiable observations of this plant in Greater Vancouver (5214 research grade), recorded 1998–2026.  
  `gaultheria-shallon:vancouver_context:inat01` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.6
- iNaturalist observations [unverified]: Monthly spread of 5382 Greater Vancouver observations: most in 4, 9, 3 (month numbers).  
  `gaultheria-shallon:vancouver_context:inat02` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.55
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=96) put fruiting mainly in months 7, 8, 9.  
  `gaultheria-shallon:seasonal_interest:inat04` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=129) put flowering mainly in months 5, 6, 7.  
  `gaultheria-shallon:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- Oregon State University Landscape Plants [unverified]: Oregon State University: foliage sold in the florist trade as 'lemon leaves'.  
  `gaultheria-shallon:landscape_use:osu01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Alaska, Canada and the lower 48 states.  
  `gaultheria-shallon:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS rates hedge tolerance high.  
  `gaultheria-shallon:landscape_use:usdaplants01` · landscape_use · ranked by database (priority 2) → geo north_america → confidence 0.6
- Royal Horticultural Society [unverified]: RHS suggests cottage, gravel and rock gardens, city gardens, containers, banks and slopes, cut foliage, borders and edible fruit.  
  `gaultheria-shallon:landscape_use:rhs01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Vaccinium ovatum*
- iNaturalist observations [unverified]: iNaturalist holds 29 openly licensed verifiable observations of this plant in Greater Vancouver (24 research grade), recorded 2017–2026.  
  `vaccinium-ovatum:vancouver_context:inat01` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.6
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: frequent in south-west BC in dry to moist open forest at low to montane elevations, mostly in the Coastal Western Hemlock zone — the zone Vancouver sits in.  
  `vaccinium-ovatum:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Great Plant Picks [unverified]: Great Plant Picks: informal groupings, natural low screen, shears into a dense formal hedge; a Pacific Northwest native.  
  `vaccinium-ovatum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University notes use of the foliage in the florist industry.  
  `vaccinium-ovatum:landscape_use:osu01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `vaccinium-ovatum:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Royal Horticultural Society [unverified]: RHS suggests city and courtyard gardens, cottage gardens, patio containers, shrub borders and edible fruit.  
  `vaccinium-ovatum:landscape_use:rhs01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8


## e2-r03 (proxy) — PASS

### `native pollinator friendly plants`

- names: none · intents: pollinator friendly → ecological_value (gate), native → origin_status (gate)
- gates: **acer-palmatum** pollinator friendly=unknown, native=fail; **gaultheria-shallon** pollinator friendly=unknown, native=pass; **vaccinium-ovatum** pollinator friendly=unknown, native=pass
- candidates after gates: gaultheria-shallon, vaccinium-ovatum (excluded: acer-palmatum)
- recall: 23 claims by similarity; shown in R5 order (similarity ignored for order); 4 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Vaccinium ovatum*
- A MLA student and practising landscape designer; studio, professional and personal-garden experience noted in their own project (location not recorded): “Good native substitute for English boxwood that takes shade better.”  
  `vaccinium-ovatum:behaviour_with_others:01` · behaviour_with_others · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.75
- iNaturalist observations [unverified]: iNaturalist holds 29 openly licensed verifiable observations of this plant in Greater Vancouver (24 research grade), recorded 2017–2026.  
  `vaccinium-ovatum:vancouver_context:inat01` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.6
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Vaccinium ovatum as native to BC (provincial list Yellow, rank S5, secure).  
  `vaccinium-ovatum:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: frequent in south-west BC in dry to moist open forest at low to montane elevations, mostly in the Coastal Western Hemlock zone — the zone Vancouver sits in.  
  `vaccinium-ovatum:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC gives Vaccinium ovatum a height of 0.5–3 m.  
  `vaccinium-ovatum:mature_height:eflora01` · mature_height · ranked by database (priority 2) → geo bc → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks: informal groupings, natural low screen, shears into a dense formal hedge; a Pacific Northwest native.  
  `vaccinium-ovatum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.85
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `vaccinium-ovatum:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Invasive Species Council of BC [unverified]: Vaccinium ovatum is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `vaccinium-ovatum:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Gaultheria shallon*
- iNaturalist observations [unverified]: iNaturalist holds 5382 openly licensed verifiable observations of this plant in Greater Vancouver (5214 research grade), recorded 1998–2026.  
  `gaultheria-shallon:vancouver_context:inat01` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.6
- iNaturalist observations [unverified]: Monthly spread of 5382 Greater Vancouver observations: most in 4, 9, 3 (month numbers).  
  `gaultheria-shallon:vancouver_context:inat02` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.55
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=96) put fruiting mainly in months 7, 8, 9.  
  `gaultheria-shallon:seasonal_interest:inat04` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=129) put flowering mainly in months 5, 6, 7.  
  `gaultheria-shallon:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Gaultheria shallon as native to BC (provincial list Yellow, rank S5, secure).  
  `gaultheria-shallon:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: common in western BC from dry to wet forest, bog, cutover and shaded understory at low to montane elevations, mostly in the Coastal Western Hemlock zone.  
  `gaultheria-shallon:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: creeping to erect shrub, typically to 1.5 m, occasionally 3 m.  
  `gaultheria-shallon:mature_height:eflora01` · mature_height · ranked by database (priority 2) → geo bc → confidence 0.85
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC habitat records include shaded understory and open-canopy coniferous forest.  
  `gaultheria-shallon:exposure:eflora01` · exposure · ranked by database (priority 2) → geo bc → confidence 0.7
- Oregon State University Landscape Plants [unverified]: Oregon State University: native to western North America (Alaska to California); fruit taken by birds.  
  `gaultheria-shallon:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Alaska, Canada and the lower 48 states.  
  `gaultheria-shallon:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Invasive Species Council of BC [unverified]: Gaultheria shallon is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `gaultheria-shallon:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9


## e2-r04 (verbatim-ish) — PASS

> respondent could not imagine a search; expected result: no hits, graceful empty answer

### `Don't know`

- names: none · intents: none
- candidates after gates: acer-palmatum, gaultheria-shallon, vaccinium-ovatum
- recall: 0 claims by similarity; shown in R5 order (similarity ignored for order); 0 L0 practitioner claims withheld (R2)

**Answer:** no sourced claim matches. (Honest empty answer — the field may exist with no source yet.)


## e2-r05 (proxy) — PASS

### `hardy ground cover for my area`

- names: none · intents: hardy → hardiness_zone (gate), ground cover → landscape_use (gate), my area → _source_geo (rank_boost)
- gates: **acer-palmatum** hardy=pass, ground cover=unknown; **gaultheria-shallon** hardy=pass, ground cover=pass; **vaccinium-ovatum** hardy=pass, ground cover=unknown
- candidates after gates: acer-palmatum, gaultheria-shallon, vaccinium-ovatum
- recall: 37 claims by similarity; shown in R5 order (similarity ignored for order); 2 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Vaccinium ovatum*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: frequent in south-west BC in dry to moist open forest at low to montane elevations, mostly in the Coastal Western Hemlock zone — the zone Vancouver sits in.  
  `vaccinium-ovatum:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Great Plant Picks [unverified]: Great Plant Picks lists Vaccinium ovatum for USDA zones 7 to 9.  
  `vaccinium-ovatum:hardiness_zone:gpp01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks: informal groupings, natural low screen, shears into a dense formal hedge; a Pacific Northwest native.  
  `vaccinium-ovatum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 7.  
  `vaccinium-ovatum:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University notes use of the foliage in the florist industry.  
  `vaccinium-ovatum:landscape_use:osu01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `vaccinium-ovatum:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS rates drought tolerance medium and moisture use low.  
  `vaccinium-ovatum:resistances:usdaplants01` · resistances · ranked by database (priority 2) → geo north_america → confidence 0.6
- Royal Horticultural Society [unverified]: RHS rates Vaccinium ovatum hardiness H4 (average UK winter, about -10 to -5 °C).  
  `vaccinium-ovatum:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85
- Royal Horticultural Society [unverified]: RHS suggests city and courtyard gardens, cottage gardens, patio containers, shrub borders and edible fruit.  
  `vaccinium-ovatum:landscape_use:rhs01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Gaultheria shallon*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: common in western BC from dry to wet forest, bog, cutover and shaded understory at low to montane elevations, mostly in the Coastal Western Hemlock zone.  
  `gaultheria-shallon:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 6.  
  `gaultheria-shallon:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: foliage sold in the florist trade as 'lemon leaves'.  
  `gaultheria-shallon:landscape_use:osu01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Alaska, Canada and the lower 48 states.  
  `gaultheria-shallon:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: moisture use high, drought tolerance low.  
  `gaultheria-shallon:water_drainage:usdaplants01` · water_drainage · ranked by database (priority 2) → geo north_america → confidence 0.7
- USDA PLANTS Database [unverified]: USDA PLANTS rates hedge tolerance high.  
  `gaultheria-shallon:landscape_use:usdaplants01` · landscape_use · ranked by database (priority 2) → geo north_america → confidence 0.6
- Royal Horticultural Society [unverified]: RHS rates Gaultheria shallon hardiness H5 (cold winter, about -15 to -10 °C).  
  `gaultheria-shallon:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85
- Royal Horticultural Society [unverified]: RHS suggests cottage, gravel and rock gardens, city gardens, containers, banks and slopes, cut foliage, borders and edible fruit.  
  `gaultheria-shallon:landscape_use:rhs01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks lists 'Osakazuki' for USDA zones 6 to 8.  
  `acer-palmatum:hardiness_zone:gpp01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 5.  
  `acer-palmatum:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS rates Acer palmatum hardiness H6 (hardy through most of the UK, about -20 to -15 °C).  
  `acer-palmatum:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden lists Acer palmatum for USDA zones 5 to 8.  
  `acer-palmatum:hardiness_zone:mobot01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden uses: specimen or accent, groups, sun-dappled understory, woodland garden margins, screen, bonsai.  
  `acer-palmatum:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- City of Vancouver Public Trees: Public Acer palmatum occur in 22 of Vancouver's local areas; most in Riley Park (247), Kitsilano (216), Renfrew-Collingwood (176), Kensington-Cedar Cottage (133), Sunset (101).  
  `acer-palmatum:vancouver_context:cov03` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.9
- City of Vancouver Public Trees: Trunk diameters (DBH) of 1841 public Acer palmatum in Vancouver: median 17.8 cm, 90th percentile 45.7 cm, largest 160.0 cm.  
  `acer-palmatum:local_mature_size:cov03` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.8
- City of Vancouver Public Trees: Trunk diameters (DBH) of 88 public Acer palmatum 'Bloodgood' in Vancouver: median 7.6 cm, 90th percentile 15.2 cm, largest 26.0 cm.  
  `acer-palmatum:local_mature_size:cov08` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.8
- City of Vancouver Public Trees: Trunk diameters (DBH) of 407 public Acer palmatum 'Osakazuki' in Vancouver: median 11.4 cm, 90th percentile 25.0 cm, largest 160.0 cm.  
  `acer-palmatum:local_mature_size:cov06` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.8
- City of Vancouver Public Trees: Trunk diameters (DBH) of 1097 public Acer palmatum (cultivar unrecorded) in Vancouver: median 25.4 cm, 90th percentile 50.8 cm, largest 88.9 cm.  
  `acer-palmatum:local_mature_size:cov13` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.8
- City of Vancouver Public Trees: Trunk diameters (DBH) of 65 public Acer palmatum 'Koto No Ito' in Vancouver: median 7.6 cm, 90th percentile 12.7 cm, largest 78.7 cm.  
  `acer-palmatum:local_mature_size:cov10` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.8
- City of Vancouver Public Trees: Height class midpoints of 1848 public Acer palmatum in Vancouver (15/25/35 ft classes, all ages mixed): median class 7.6 m, 10th–90th percentile classes 4.6–10.7 m, highest class 29.0 m.  
  `acer-palmatum:local_mature_size:cov01` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.7
- … 6 more


## e2-r06 (proxy) — PASS

### `shade-tolerant evergreen perennial for a north-facing roof garden, accessible`

- names: none · intents: shade-tolerant → exposure (gate), evergreen → seasonal_interest.evergreen (gate), perennial → kpu_plant_type (gate), roof garden → landscape_use (gate), accessible → custom:accessibility (compare)
- gates: **acer-palmatum** shade-tolerant=pass, evergreen=unknown, perennial=pass, roof garden=unknown; **gaultheria-shallon** shade-tolerant=pass, evergreen=pass, perennial=pass, roof garden=pass; **vaccinium-ovatum** shade-tolerant=pass, evergreen=pass, perennial=pass, roof garden=pass
- candidates after gates: acer-palmatum, gaultheria-shallon, vaccinium-ovatum
- recall: 36 claims by similarity; shown in R5 order (similarity ignored for order); 4 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Vaccinium ovatum*
- A MLA student and practising landscape designer; studio, professional and personal-garden experience noted in their own project (location not recorded): “Good native substitute for English boxwood that takes shade better.”  
  `vaccinium-ovatum:behaviour_with_others:01` · behaviour_with_others · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.75
- A MLA student and practising landscape designer; studio, professional and personal-garden experience noted in their own project (location not recorded): “Vaccinium ovatum tolerates shade better than English boxwood, per a designer's project experience.”  
  `vaccinium-ovatum:exposure:01` · exposure · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.7
- Great Plant Picks [unverified]: Great Plant Picks: full sun to deep shade; flowering and fruiting may stop in deep shade.  
  `vaccinium-ovatum:exposure:gpp01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks: copper-bronze spring foliage maturing dark green; small white urn flowers in spring; blue-black berries by late summer.  
  `vaccinium-ovatum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks gives Vaccinium ovatum a 10-year size of 6 ft tall by 4 ft wide (1.8 × 1.2 m).  
  `vaccinium-ovatum:time_to_intended_size:gpp01` · time_to_intended_size · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen glossy dark green leaves on reddish stems; pale pink urn-shaped flowers in spring; edible fruit red then blue-black by late summer.  
  `vaccinium-ovatum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: sun to part shade.  
  `vaccinium-ovatum:exposure:osu01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks: drought tolerant once established.  
  `vaccinium-ovatum:resistances:gpp01` · resistances · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University notes use of the foliage in the florist industry.  
  `vaccinium-ovatum:landscape_use:osu01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks: regular watering to drought tolerant; occasional dry-weather watering improves flowering and fruit.  
  `vaccinium-ovatum:water_drainage:gpp01` · water_drainage · ranked by database (priority 2) → geo pnw → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS: white flowers in late spring, conspicuous purple fruit in summer, leaves retained.  
  `vaccinium-ovatum:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS rates shade tolerance low.  
  `vaccinium-ovatum:exposure:usdaplants01` · exposure · ranked by database (priority 2) → geo north_america → confidence 0.6
- … 3 more

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks: one of the most brilliant red autumn colours among Japanese maples; green foliage in season.  
  `acer-palmatum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks: full sun or light to open shade; best autumn colour in full sun to open shade.  
  `acer-palmatum:exposure:gpp01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: sun to part shade; needs wind protection.  
  `acer-palmatum:exposure:osu01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University notes seedlings are faster growing and more drought tolerant than grafted forms.  
  `acer-palmatum:long_term_performance:osu01` · long_term_performance · ranked by database (priority 2) → geo pnw → confidence 0.7
- Royal Horticultural Society [unverified]: RHS: full sun or partial shade, sheltered position (west-, east- or south-facing).  
  `acer-palmatum:exposure:rhs01` · exposure · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: full sun to part shade, afternoon shade in hot regions, sited away from strong winds.  
  `acer-palmatum:exposure:mobot01` · exposure · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden uses: specimen or accent, groups, sun-dappled understory, woodland garden margins, screen, bonsai.  
  `acer-palmatum:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: reddish-purple flowers in April, insignificant; good fall colour in yellow, red-purple and bronze.  
  `acer-palmatum:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: moist, organically rich, slightly acidic, well-drained soil; grows well in sandy loam.  
  `acer-palmatum:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden lists aphids, scale, borers, bagworms, root weevils and mites; stem canker, leaf spots, fusarium, verticillium wilt, botrytis, anthracnose and root rots; late-frost damage and chlorosis on high-pH soils.  
  `acer-palmatum:pest_susceptibility:mobot01` · pest_susceptibility · ranked by database (priority 2) → geo global → confidence 0.8

*Gaultheria shallon*
- Oregon State University Landscape Plants [unverified]: Oregon State University: native to western North America (Alaska to California); fruit taken by birds.  
  `gaultheria-shallon:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: sun or part shade.  
  `gaultheria-shallon:exposure:osu01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: 4–10 ft (1.2–3 m) in shade on good soil.  
  `gaultheria-shallon:mature_height:osu02` · mature_height · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen glossy leaves; white or pinkish urn flowers in late spring; black edible fruit in summer.  
  `gaultheria-shallon:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS rates hedge tolerance high.  
  `gaultheria-shallon:landscape_use:usdaplants01` · landscape_use · ranked by database (priority 2) → geo north_america → confidence 0.6
- USDA PLANTS Database [unverified]: USDA PLANTS rates shade tolerance low.  
  `gaultheria-shallon:exposure:usdaplants01` · exposure · ranked by database (priority 2) → geo north_america → confidence 0.55
- Royal Horticultural Society [unverified]: RHS: full or partial shade; exposed or sheltered sites; any aspect.  
  `gaultheria-shallon:exposure:rhs01` · exposure · ranked by database (priority 2) → geo global → confidence 0.85


## c4-r01 (proxy) — PASS

### `is Japanese maple toxic to pets`

- names: {'acer-palmatum': ['Japanese Maple', 'Japanese maple']} · intents: toxic to pets → toxicity.pets (gate)
- gates: **acer-palmatum** toxic to pets=unknown; **gaultheria-shallon** toxic to pets=unknown; **vaccinium-ovatum** toxic to pets=unknown
- candidates after gates: acer-palmatum
- recall: 34 claims by similarity; shown in R5 order (similarity ignored for order); 2 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks: one of the most brilliant red autumn colours among Japanese maples; green foliage in season.  
  `acer-palmatum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks lists 'Osakazuki' for USDA zones 6 to 8.  
  `acer-palmatum:hardiness_zone:gpp01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks gives 'Osakazuki' a mature spread of 20 ft (6.1 m).  
  `acer-palmatum:mature_spread:gpp01` · mature_spread · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks gives 'Osakazuki' a mature height of 20 ft (6.1 m).  
  `acer-palmatum:mature_height:gpp01` · mature_height · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks: best in rich well-drained soil, also does well in sandy soils and clay.  
  `acer-palmatum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: well-drained soil.  
  `acer-palmatum:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 5.  
  `acer-palmatum:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: sun to part shade; needs wind protection.  
  `acer-palmatum:exposure:osu01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks: 'Osakazuki' is very resistant to summer leaf-tip scorch.  
  `acer-palmatum:resistances:gpp01` · resistances · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University gives Acer palmatum a height of 15–25 ft (4.5–7.6 m).  
  `acer-palmatum:mature_height:osu01` · mature_height · ranked by database (priority 2) → geo pnw → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks: regular watering, especially in dry weather.  
  `acer-palmatum:water_drainage:gpp01` · water_drainage · ranked by database (priority 2) → geo pnw → confidence 0.75
- Great Plant Picks [unverified]: Great Plant Picks: quick growing and vigorous in youth, still only a small to medium tree.  
  `acer-palmatum:growth_rate:gpp01` · growth_rate · ranked by database (priority 2) → geo pnw → confidence 0.75
- … 20 more


## c4-r03 (verbatim-ish) — PASS

> field exists, no source yet — expected: honest 'no claim' answer

### `long day or short day plant`

- names: none · intents: none
- candidates after gates: acer-palmatum, gaultheria-shallon, vaccinium-ovatum
- recall: 3 claims by similarity; shown in R5 order (similarity ignored for order); 0 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Vaccinium ovatum*
- Oregon State University Landscape Plants [unverified]: Oregon State University: neat, erect, generally compact habit, sometimes with long erratic shoots.  
  `vaccinium-ovatum:habit:osu01` · habit · ranked by database (priority 2) → geo pnw → confidence 0.75

*Acer palmatum*
- Oregon State University Landscape Plants [unverified]: Oregon State University notes seedlings are faster growing and more drought tolerant than grafted forms.  
  `acer-palmatum:long_term_performance:osu01` · long_term_performance · ranked by database (priority 2) → geo pnw → confidence 0.7

*Gaultheria shallon*
- Oregon State University Landscape Plants [unverified]: Oregon State University flags high frost sensitivity and difficult transplanting.  
  `gaultheria-shallon:long_term_performance:osu01` · long_term_performance · ranked by database (priority 2) → geo pnw → confidence 0.65

