# T6 retrieval test · 2026-11-03

T6/graph test set = survey e2 ('one search you would actually type') and c4 ('one thing you could not find'), VERBATIM from responses-2026-11-03.csv via tools/survey_to_claims.py (replaces the 2026-10-29 proxies, methods M16). Ids are the anonymous respondent ids.

Store: 614 claims over 10 plants · semantic route = BM25 stand-in (no embedding model installed) · ranking R5 · answers R6
**19 / 19 queries answered with sources (or honestly empty where no source exists).**


## e2-r01 (verbatim) — PASS

### `Easy to grow, less maintenance and offer seasonal interest`

- names: none · intents: low maintenance → maintenance_level (gate), seasonal interest → seasonal_interest (compare)
- gates: **acer-palmatum** low maintenance=pass; **achillea-millefolium** low maintenance=pass; **arctostaphylos-uva-ursi** low maintenance=pass; **cercidiphyllum-japonicum** low maintenance=pass; **cornus-nuttallii** low maintenance=pass; **cornus-sericea** low maintenance=fail; **gaillardia-aristata** low maintenance=pass; **gaultheria-shallon** low maintenance=unknown; **polystichum-munitum** low maintenance=pass; **vaccinium-ovatum** low maintenance=pass
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum (excluded: cornus-sericea)
- recall: 39 claims by similarity; shown in R5 order (similarity ignored for order); 6 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Cornus nuttallii*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: deciduous; 4–7 showy white or pink-tinged bracts around tiny greenish-white flowers in mid-spring, often flowering again in fall; leaves turn red in fall; bright red drupes summer to fall.  
  `cornus-nuttallii:seasonal_interest:eflora01` · seasonal_interest · ranked by database (priority 2) → geo bc → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: deciduous; 4–8 showy white (rarely pink) bracts 5–8 cm long around 30–40 small dull green or purple flowers in spring, occasionally again in fall; orange to bright red fruit clusters in fall.  
  `cornus-nuttallii:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: green conspicuous flowers in mid spring, green foliage, conspicuous fall colour, abundant red fruit summer to fall, leaves not retained.  
  `cornus-nuttallii:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: bloom April to June, showy white bracts (six) around tiny purple-green flowers; dark green leaves with good yellow-orange-red fall colour; showy bright red or orange fruit.  
  `cornus-nuttallii:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance as medium.  
  `cornus-nuttallii:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8

*Gaillardia aristata*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: heads with 6–16 (commonly 13) yellow ray flowers around brownish-purple disk flowers; herbaceous perennial.  
  `gaillardia-aristata:seasonal_interest:eflora01` · seasonal_interest · ranked by database (priority 2) → geo bc → confidence 0.85
- USDA PLANTS Database [unverified]: USDA PLANTS: conspicuous yellow flowers in spring, green foliage, inconspicuous brown seed summer to fall, no fall colour, leaves not retained.  
  `gaillardia-aristata:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.7
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance low; deadheading optional, cutting back in summer may renew bloom.  
  `gaillardia-aristata:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8

*Cercidiphyllum japonicum*
- Great Plant Picks [unverified]: Great Plant Picks: new leaves reddish-purple, blue-green through summer, butter-yellow with orange and apricot in autumn; fallen leaves scented of strawberries and cotton candy; seasonal interest listed as autumn foliage colour.  
  `cercidiphyllum-japonicum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks lists seasonal interest as autumn foliage colour and describes it as an easy tree to garden under.  
  `cercidiphyllum-japonicum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: leaves purplish tan when unfolding then bluish-green; apricot-orange fall colour that is not spectacular in Corvallis; male flowers in spring before the leaves, female flowers as leaves expand, neither showy; small narrow pods.  
  `cercidiphyllum-japonicum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: leaves bronze-tinted when young, turning yellow, orange and pink in autumn and smelling of burnt sugar; flowers and fruit inconspicuous; deciduous.  
  `cercidiphyllum-japonicum:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance as low.  
  `cercidiphyllum-japonicum:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS places the species in pruning group 1 (minimal pruning).  
  `cercidiphyllum-japonicum:maintenance_level:rhs01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.75

*Vaccinium ovatum*
- Great Plant Picks [unverified]: Great Plant Picks: copper-bronze spring foliage maturing dark green; small white urn flowers in spring; blue-black berries by late summer.  
  `vaccinium-ovatum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen glossy dark green leaves on reddish stems; pale pink urn-shaped flowers in spring; edible fruit red then blue-black by late summer.  
  `vaccinium-ovatum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: white flowers in late spring, conspicuous purple fruit in summer, leaves retained.  
  `vaccinium-ovatum:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- Royal Horticultural Society [unverified]: RHS: evergreen; pale pink urn-shaped flowers in spring; fruit red turning blue-black.  
  `vaccinium-ovatum:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85

*Acer palmatum*
- Oregon State University Landscape Plants [unverified]: Oregon State University: small red to purple flowers with the new leaves; scarlet, orange or yellow fall colour; samaras ripen early fall.  
  `acer-palmatum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: small red flowers in spring; deciduous with good autumn colour.  
  `acer-palmatum:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Royal Horticultural Society [unverified]: RHS: 'Bloodgood' has deep red-purple foliage, small purple flowers and red autumn colour.  
  `acer-palmatum:seasonal_interest:rhs02` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: reddish-purple flowers in April, insignificant; good fall colour in yellow, red-purple and bronze.  
  `acer-palmatum:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance as low; pruning best kept to a minimum.  
  `acer-palmatum:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8

*Gaultheria shallon*
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen glossy leaves; white or pinkish urn flowers in late spring; black edible fruit in summer.  
  `gaultheria-shallon:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: conspicuous white flowers mid spring, abundant purple fruit summer to fall, leaves retained.  
  `gaultheria-shallon:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- Royal Horticultural Society [unverified]: RHS: evergreen; light pink and white flowers in early summer; dark purple fruit ripening late summer.  
  `gaultheria-shallon:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85

*Achillea millefolium*
- USDA PLANTS Database [unverified]: USDA PLANTS: conspicuous white flowers in early summer, inconspicuous brown persistent seed in summer, green foliage not retained, no fall colour.  
  `achillea-millefolium:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance medium.  
  `achillea-millefolium:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8

*Arctostaphylos uva-ursi*
- USDA PLANTS Database [unverified]: USDA PLANTS: conspicuous purple flowers in late spring, dark green leaves retained, conspicuous fall colour, red fruit summer to fall that persists.  
  `arctostaphylos-uva-ursi:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.7
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: white flowers with a pink tinge in April–May; dark green evergreen leaves turning bronze in winter; red fruit from late summer, often held through winter; year-round interest.  
  `arctostaphylos-uva-ursi:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance low; plants should not be fertilised.  
  `arctostaphylos-uva-ursi:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8

*Polystichum munitum*
- USDA PLANTS Database [unverified]: USDA PLANTS: dark green foliage; leaf retention recorded as no; fall conspicuous yes.  
  `polystichum-munitum:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.5
- Royal Horticultural Society [unverified]: RHS: easy to grow; pruning limited to removing dead or damaged fronds.  
  `polystichum-munitum:maintenance_level:rhs01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.75


## c4-r01 (verbatim) — PASS

> a 'could not find' question — an honest empty answer with a named gap is a pass

### `When some native plants produce fruits, we do not know if the plants are toxic to pets.`

- names: none · intents: native → origin_status (gate), toxic to pets → toxicity.pets (gate)
- gates: **acer-palmatum** native=fail, toxic to pets=unknown; **achillea-millefolium** native=pass, toxic to pets=unknown; **arctostaphylos-uva-ursi** native=pass, toxic to pets=unknown; **cercidiphyllum-japonicum** native=fail, toxic to pets=unknown; **cornus-nuttallii** native=pass, toxic to pets=unknown; **cornus-sericea** native=pass, toxic to pets=unknown; **gaillardia-aristata** native=fail, toxic to pets=unknown; **gaultheria-shallon** native=pass, toxic to pets=unknown; **polystichum-munitum** native=pass, toxic to pets=unknown; **vaccinium-ovatum** native=pass, toxic to pets=unknown
- candidates after gates: achillea-millefolium, arctostaphylos-uva-ursi, cornus-nuttallii, cornus-sericea, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum (excluded: acer-palmatum, cercidiphyllum-japonicum, gaillardia-aristata)
- recall: 36 claims by similarity; shown in R5 order (similarity ignored for order); 3 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Gaultheria shallon*
- A practising landscape designer; personal-garden, professional and studio planting experience noted from site observation (location not recorded): “usually it's used in a more pacific northwest native plants focused gardens, less seen in other types of private/commercial greenspace.”  
  `gaultheria-shallon:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.85
- A practising landscape designer; personal-garden, professional and studio planting experience noted from site observation (location not recorded): “Salal — derived from the respondent's note: usually it's used in a more pacific northwest native plants focused gardens, les…”  
  `gaultheria-shallon:landscape_use:sv03` · landscape_use · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Gaultheria shallon as native to BC (provincial list Yellow, rank S5, secure).  
  `gaultheria-shallon:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- USDA PLANTS Database [unverified]: USDA PLANTS gives a toxicity rating of 'None' for this species; the rating is a US conservation-planting characteristic and says nothing specific about pets or people.  
  `gaultheria-shallon:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7
- Invasive Species Council of BC [unverified]: Gaultheria shallon is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `gaultheria-shallon:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Achillea millefolium*
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Native species that does well in this local climate”  
  `achillea-millefolium:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Achillea millefolium: Native species that does well in this local climate”  
  `achillea-millefolium:ecological_value:sv03` · ecological_value · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.75
- A MLA student; studio and personal-garden planting experience noted from mixed experience (location not recorded): “Spreads vigorously under certain conditions so use cautiously. However, large swathes of yarrow can be beautiful.”  
  `achillea-millefolium:behaviour_with_others:sv02` · behaviour_with_others · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.7
- iNaturalist observations [unverified]: iNaturalist holds 2063 openly licensed verifiable observations of this plant in Greater Vancouver (1502 research grade), recorded 2012–2026.  
  `achillea-millefolium:vancouver_context:inat01` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.6
- iNaturalist observations [unverified]: Monthly spread of 2063 Greater Vancouver observations: most in 9, 10, 7 (month numbers).  
  `achillea-millefolium:vancouver_context:inat02` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.55
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=234) put flowering mainly in months 6, 7, 8, 9, 10, 11.  
  `achillea-millefolium:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC treats the native coastal yarrow as Achillea borealis var. borealis (synonym A. millefolium var. borealis): origin Native, provincial list Yellow, rank S5 (secure). The A. millefolium species page itself carries origin status Exotic (SNA), while its taxonomic note recognises four native ecogeographic varieties (alpicola, lanulosa, borealis, pacifica).  
  `achillea-millefolium:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.8
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC habitat records are open sites — bluffs, meadows, grasslands, rocky slopes and open forests.  
  `achillea-millefolium:exposure:eflora01` · exposure · ranked by database (priority 2) → geo bc → confidence 0.7
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: habitat mesic to dry; BEC plot soil moisture regime runs from very xeric to hydric with a mesic-to-dry average.  
  `achillea-millefolium:water_drainage:eflora01` · water_drainage · ranked by database (priority 2) → geo bc → confidence 0.65
- USDA PLANTS Database [unverified]: USDA PLANTS records Achillea millefolium as native in Alaska, Canada, the lower 48 states, Greenland and St Pierre et Miquelon, and as also introduced in Canada, the lower 48, Hawaii and St Pierre et Miquelon — native and introduced genotypes both present.  
  `achillea-millefolium:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS: conspicuous white flowers in early summer, inconspicuous brown persistent seed in summer, green foliage not retained, no fall colour.  
  `achillea-millefolium:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS gives a toxicity rating of 'Slight' for this species; the rating is a US conservation-planting characteristic and says nothing specific about pets or people.  
  `achillea-millefolium:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7
- … 4 more

*Vaccinium ovatum*
- A MLA student and practising landscape designer; studio, professional and personal-garden experience noted in their own project (location not recorded): “Good native substitute for English boxwood that takes shade better.”  
  `vaccinium-ovatum:behaviour_with_others:01` · behaviour_with_others · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.75
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Vaccinium ovatum as native to BC (provincial list Yellow, rank S5, secure).  
  `vaccinium-ovatum:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- USDA PLANTS Database [unverified]: USDA PLANTS gives a toxicity rating of 'None' for this species; the rating is a US conservation-planting characteristic and says nothing specific about pets or people.  
  `vaccinium-ovatum:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7
- Invasive Species Council of BC [unverified]: Vaccinium ovatum is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `vaccinium-ovatum:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Cornus nuttallii*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Cornus nuttallii as native to BC (provincial list Yellow, rank S5 (2019), secure; COSEWIC not listed).  
  `cornus-nuttallii:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: native to Oregon; range along the Pacific coast from just beyond Vancouver Island, BC, to southern California, with a disjunct population in north-central Idaho.  
  `cornus-nuttallii:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- Invasive Species Council of BC [unverified]: Cornus nuttallii is not among the 68 plant profiles on the Invasive Species Council of BC 'Find an Invasive Species' list (checked 2026-11-02); no Cornus species is listed. It is a BC native.  
  `cornus-nuttallii:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Polystichum munitum*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Polystichum munitum as native to BC (provincial list Yellow, rank S5, secure; COSEWIC not listed).  
  `polystichum-munitum:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: native from Alaska to California, east to western Montana; native to Oregon.  
  `polystichum-munitum:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- Invasive Species Council of BC [unverified]: Polystichum munitum is not among the plant profiles on the Invasive Species Council of BC list and returns no site-search result (checked 2026-11-02); it is a BC native.  
  `polystichum-munitum:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Cornus sericea*
- USDA PLANTS Database [unverified]: USDA PLANTS gives a toxicity rating of 'None'; the rating is a US conservation-planting characteristic and says nothing specific about pets or people.  
  `cornus-sericea:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7

*Arctostaphylos uva-ursi*
- Invasive Species Council of BC [unverified]: Arctostaphylos uva-ursi is not among the species profiles on the Invasive Species Council of BC site (checked 2026-11-02; the site search returns only an unrelated classroom-craft post); it is a BC native.  
  `arctostaphylos-uva-ursi:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9


## e2-r02 (verbatim) — PASS

### `House garden plants`

- names: none · intents: house garden → landscape_use (compare)
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 40 claims by similarity; shown in R5 order (similarity ignored for order); 0 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Cercidiphyllum japonicum*
- A MLA student and practising landscape designer; studio and professional experience noted from site observation: “It grows in my backyard and it’s leaf has a sweet smell”  
  `cercidiphyllum-japonicum:vancouver_context:sv01` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L2 → confidence 0.85
- A MLA student and practising landscape designer; studio and professional experience noted from site observation: “Katsura: It grows in my backyard and it’s leaf has a sweet smell”  
  `cercidiphyllum-japonicum:landscape_use:sv02` · landscape_use · ranked by practitioner (priority 1) → geo vancouver → completeness L2 → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks lists seasonal interest as autumn foliage colour and describes it as an easy tree to garden under.  
  `cercidiphyllum-japonicum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: shade tree; small specimen shade tree or street tree.  
  `cercidiphyllum-japonicum:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden 'Tolerate' line: clay soil.  
  `cercidiphyllum-japonicum:resistances:mobot01` · resistances · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance as low.  
  `cercidiphyllum-japonicum:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden lists Cercidiphyllum japonicum for USDA zones 4 to 8.  
  `cercidiphyllum-japonicum:hardiness_zone:mobot01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: best in rich, moist, well-drained soils.  
  `cercidiphyllum-japonicum:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden gives a spread of 25–60 ft (7.6–18.3 m).  
  `cercidiphyllum-japonicum:mature_spread:mobot01` · mature_spread · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates water needs as medium; little drought tolerance, particularly when young.  
  `cercidiphyllum-japonicum:water_drainage:mobot01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: full sun to part shade; best sited with protection from strong winds and hot afternoon sun.  
  `cercidiphyllum-japonicum:exposure:mobot01` · exposure · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: no serious insect or disease problems; foliage may scorch in hot, dry or windy conditions.  
  `cercidiphyllum-japonicum:pest_susceptibility:mobot01` · pest_susceptibility · ranked by database (priority 2) → geo global → confidence 0.8
- … 4 more

*Acer palmatum*
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

*Gaillardia aristata*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: perennial border fronts, rock gardens, cottage gardens, cutting gardens and containers; suggested use naturalize; attracts butterflies and birds.  
  `gaillardia-aristata:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: full sun.  
  `gaillardia-aristata:exposure:mobot01` · exposure · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden gives Gaillardia aristata a spread of 1–2 ft (0.3–0.6 m).  
  `gaillardia-aristata:mature_spread:mobot01` · mature_spread · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden gives Gaillardia aristata a height of 1–3 ft (0.3–0.9 m).  
  `gaillardia-aristata:mature_height:mobot01` · mature_height · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden lists Gaillardia aristata for USDA zones 3 to 8.  
  `gaillardia-aristata:hardiness_zone:mobot01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden lists Gaillardia aristata as tolerating drought and dry soil.  
  `gaillardia-aristata:resistances:mobot01` · resistances · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance low; deadheading optional, cutting back in summer may renew bloom.  
  `gaillardia-aristata:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates water needs dry to medium.  
  `gaillardia-aristata:water_drainage:mobot01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75

*Cornus nuttallii*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden uses: specimen or small grouping near homes, patios and lawns; woodland, bird and native plant gardens; attracts birds and butterflies.  
  `cornus-nuttallii:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance as medium.  
  `cornus-nuttallii:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: horizontal tiered branching; rounded to conical crown.  
  `cornus-nuttallii:habit:mobot01` · habit · ranked by database (priority 2) → geo global → confidence 0.75

*Achillea millefolium*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: naturalise in meadows, prairies, cottage, seaside and rock gardens; flowering ground cover or mown lawn substitute in sunny out-of-the-way areas; good fresh cut or dried flower; attracts butterflies; too weedy for borders.  
  `achillea-millefolium:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Arctostaphylos uva-ursi*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: moderate- to large-scale ground cover with year-round interest; erosion control on slopes; around shrubs, sunny border margins, naturalised areas, native plant gardens, herb gardens, draped over walls, rock gardens; attracts birds.  
  `arctostaphylos-uva-ursi:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Cornus sericea*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden suggests hedge and rain-garden use; massed or as a specimen, in shrub borders, naturalistic moist plantings, wet low spots and stream or pond edges for erosion control, and as a property-line screen; attracts birds and butterflies; winter interest and good fall colour.  
  `cornus-sericea:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.75


## e2-r03 (verbatim) — PASS

### `Pollinator plants that are native to Vancouver`

- names: none · intents: pollinator friendly → ecological_value (gate), native → origin_status (gate), my area → _source_geo (rank_boost)
- gates: **acer-palmatum** pollinator friendly=unknown, native=fail; **achillea-millefolium** pollinator friendly=pass, native=pass; **arctostaphylos-uva-ursi** pollinator friendly=unknown, native=pass; **cercidiphyllum-japonicum** pollinator friendly=unknown, native=fail; **cornus-nuttallii** pollinator friendly=unknown, native=pass; **cornus-sericea** pollinator friendly=pass, native=pass; **gaillardia-aristata** pollinator friendly=pass, native=fail; **gaultheria-shallon** pollinator friendly=unknown, native=pass; **polystichum-munitum** pollinator friendly=unknown, native=pass; **vaccinium-ovatum** pollinator friendly=unknown, native=pass
- candidates after gates: achillea-millefolium, arctostaphylos-uva-ursi, cornus-nuttallii, cornus-sericea, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum (excluded: acer-palmatum, cercidiphyllum-japonicum, gaillardia-aristata)
- recall: 33 claims by similarity; shown in R5 order (similarity ignored for order); 6 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Gaultheria shallon*
- A practising landscape designer; personal-garden, professional and studio planting experience noted from site observation (location not recorded): “usually it's used in a more pacific northwest native plants focused gardens, less seen in other types of private/commercial greenspace.”  
  `gaultheria-shallon:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.85
- A practising landscape designer; personal-garden, professional and studio planting experience noted from site observation (location not recorded): “Salal — derived from the respondent's note: usually it's used in a more pacific northwest native plants focused gardens, les…”  
  `gaultheria-shallon:landscape_use:sv03` · landscape_use · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Gaultheria shallon as native to BC (provincial list Yellow, rank S5, secure).  
  `gaultheria-shallon:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: native to western North America (Alaska to California); fruit taken by birds.  
  `gaultheria-shallon:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Alaska, Canada and the lower 48 states.  
  `gaultheria-shallon:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Invasive Species Council of BC [unverified]: Gaultheria shallon is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `gaultheria-shallon:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Achillea millefolium*
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Native species that does well in this local climate”  
  `achillea-millefolium:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Achillea millefolium: Native species that does well in this local climate”  
  `achillea-millefolium:ecological_value:sv03` · ecological_value · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.75
- iNaturalist observations [unverified]: iNaturalist holds 2063 openly licensed verifiable observations of this plant in Greater Vancouver (1502 research grade), recorded 2012–2026.  
  `achillea-millefolium:vancouver_context:inat01` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.6
- iNaturalist observations [unverified]: Monthly spread of 2063 Greater Vancouver observations: most in 9, 10, 7 (month numbers).  
  `achillea-millefolium:vancouver_context:inat02` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.55
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=234) put flowering mainly in months 6, 7, 8, 9, 10, 11.  
  `achillea-millefolium:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC treats the native coastal yarrow as Achillea borealis var. borealis (synonym A. millefolium var. borealis): origin Native, provincial list Yellow, rank S5 (secure). The A. millefolium species page itself carries origin status Exotic (SNA), while its taxonomic note recognises four native ecogeographic varieties (alpicola, lanulosa, borealis, pacifica).  
  `achillea-millefolium:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS records Achillea millefolium as native in Alaska, Canada, the lower 48 states, Greenland and St Pierre et Miquelon, and as also introduced in Canada, the lower 48, Hawaii and St Pierre et Miquelon — native and introduced genotypes both present.  
  `achillea-millefolium:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.75
- Royal Horticultural Society [unverified]: RHS lists Achillea millefolium as a Plant for Pollinators.  
  `achillea-millefolium:ecological_value:rhs01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: flowers attract butterflies and other insect pollinators.  
  `achillea-millefolium:ecological_value:mobot01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS suggests wildflower meadows, wildlife gardens, gravel gardens and cottage/informal gardens; listed as an RHS Plant for Pollinators.  
  `achillea-millefolium:landscape_use:rhs01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Invasive Species Council of BC [unverified]: Achillea millefolium is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-11-02); ISCBC's Grow Me Instead material instead names yarrow as a native, non-invasive alternative to tansy, field scabious and baby's-breath.  
  `achillea-millefolium:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Vaccinium ovatum*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Vaccinium ovatum as native to BC (provincial list Yellow, rank S5, secure).  
  `vaccinium-ovatum:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `vaccinium-ovatum:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Invasive Species Council of BC [unverified]: Vaccinium ovatum is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `vaccinium-ovatum:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Cornus nuttallii*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Cornus nuttallii as native to BC (provincial list Yellow, rank S5 (2019), secure; COSEWIC not listed).  
  `cornus-nuttallii:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: native to Oregon; range along the Pacific coast from just beyond Vancouver Island, BC, to southern California, with a disjunct population in north-central Idaho.  
  `cornus-nuttallii:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `cornus-nuttallii:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: native to coastal regions west of the Cascades from southern British Columbia to southern California, with a disjunct population in northern Idaho.  
  `cornus-nuttallii:ecological_value:mobot01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.8

*Polystichum munitum*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Polystichum munitum as native to BC (provincial list Yellow, rank S5, secure; COSEWIC not listed).  
  `polystichum-munitum:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: native from Alaska to California, east to western Montana; native to Oregon.  
  `polystichum-munitum:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Alaska, Canada and the lower 48 states.  
  `polystichum-munitum:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8


## c4-r03 (verbatim) — PASS

> a 'could not find' question — an honest empty answer with a named gap is a pass

### `If it was a long day or short day plant for flowering`

- names: none · intents: none
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 40 claims by similarity; shown in R5 order (similarity ignored for order); 2 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Polystichum munitum*
- A MLA student; former professional gardener; studio, personal-garden and professional planting experience noted from reading (location not recorded): “You can put this plant anywhere and it will survive!”  
  `polystichum-munitum:long_term_performance:sv04` · long_term_performance · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.85
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: commonly associated with vanilla-leaf, dull Oregon-grape and three-leaved foamflower; grows from a short stout rhizome.  
  `polystichum-munitum:behaviour_with_others:eflora01` · behaviour_with_others · ranked by database (priority 2) → geo bc → confidence 0.85
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: evergreen perennial from a short stout rhizome, leaves 20–150 cm long.  
  `polystichum-munitum:mature_height:eflora01` · mature_height · ranked by database (priority 2) → geo bc → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks: grows in full sun if watered regularly in summer.  
  `polystichum-munitum:exposure:gpp02` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: fronds 1–4 ft (0.3–1.2 m) long, stiffly erect from a dense crown.  
  `polystichum-munitum:mature_height:osu01` · mature_height · ranked by database (priority 2) → geo pnw → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS: rhizomatous with moderate vegetative spread, long-lived, no resprout or coppice ability, medium fire tolerance, not allelopathic.  
  `polystichum-munitum:behaviour_with_others:usdaplants01` · behaviour_with_others · ranked by database (priority 2) → geo north_america → confidence 0.75
- Royal Horticultural Society [unverified]: RHS advises protecting the crowns from excessive winter wet.  
  `polystichum-munitum:long_term_performance:rhs01` · long_term_performance · ranked by database (priority 2) → geo global → confidence 0.8

*Cornus nuttallii*
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=29) put flowering mainly in months 4, 5.  
  `cornus-nuttallii:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: deciduous; 4–7 showy white or pink-tinged bracts around tiny greenish-white flowers in mid-spring, often flowering again in fall; leaves turn red in fall; bright red drupes summer to fall.  
  `cornus-nuttallii:seasonal_interest:eflora01` · seasonal_interest · ranked by database (priority 2) → geo bc → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: deciduous; 4–8 showy white (rarely pink) bracts 5–8 cm long around 30–40 small dull green or purple flowers in spring, occasionally again in fall; orange to bright red fruit clusters in fall.  
  `cornus-nuttallii:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: upright (excurrent) tree.  
  `cornus-nuttallii:habit:osu01` · habit · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University flags that the species often does poorly in garden conditions, is sensitive to many stresses, and suffers bark damage in hot sun.  
  `cornus-nuttallii:long_term_performance:osu01` · long_term_performance · ranked by database (priority 2) → geo pnw → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `cornus-nuttallii:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: multiple-stem growth form, resprouts but does not coppice, not allelopathic, no vegetative spread, moderate seed spread with high seedling vigour, long lifespan, medium fire tolerance.  
  `cornus-nuttallii:behaviour_with_others:usdaplants01` · behaviour_with_others · ranked by database (priority 2) → geo north_america → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS rates foliage texture medium.  
  `cornus-nuttallii:texture:usdaplants01` · texture · ranked by database (priority 2) → geo north_america → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS rates growth rate moderate.  
  `cornus-nuttallii:growth_rate:usdaplants01` · growth_rate · ranked by database (priority 2) → geo north_america → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS lists toxicity as none.  
  `cornus-nuttallii:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7
- USDA PLANTS Database [unverified]: USDA PLANTS rates shade tolerance low.  
  `cornus-nuttallii:exposure:usdaplants01` · exposure · ranked by database (priority 2) → geo north_america → confidence 0.55
- Royal Horticultural Society [unverified]: RHS: generally pest-free.  
  `cornus-nuttallii:resistances:rhs01` · resistances · ranked by database (priority 2) → geo global → confidence 0.8
- … 3 more

*Vaccinium ovatum*
- Great Plant Picks [unverified]: Great Plant Picks: well-drained or sandy soil; tolerates clay if drainage is adequate.  
  `vaccinium-ovatum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks: full sun to deep shade; flowering and fruiting may stop in deep shade.  
  `vaccinium-ovatum:exposure:gpp01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: neat, erect, generally compact habit, sometimes with long erratic shoots.  
  `vaccinium-ovatum:habit:osu01` · habit · ranked by database (priority 2) → geo pnw → confidence 0.75
- Great Plant Picks [unverified]: Great Plant Picks: regular watering to drought tolerant; occasional dry-weather watering improves flowering and fruit.  
  `vaccinium-ovatum:water_drainage:gpp01` · water_drainage · ranked by database (priority 2) → geo pnw → confidence 0.75

*Cercidiphyllum japonicum*
- Great Plant Picks [unverified]: Great Plant Picks: regular summer watering in dry spells is needed, more so in full sun or poor soils; best colour and growth in full sun to light shade.  
  `cercidiphyllum-japonicum:long_term_performance:gpp01` · long_term_performance · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University, Corvallis observations: fall colour underwhelming, young leaves deformed by spring frosts, bark splitting and sun scald possible.  
  `cercidiphyllum-japonicum:long_term_performance:osu01` · long_term_performance · ranked by database (priority 2) → geo pnw → confidence 0.75
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: little drought tolerance especially when young, leaf scorch in hot, dry or windy sites; an understory tree in the wild.  
  `cercidiphyllum-japonicum:long_term_performance:mobot01` · long_term_performance · ranked by database (priority 2) → geo global → confidence 0.75

*Acer palmatum*
- Oregon State University Landscape Plants [unverified]: Oregon State University notes seedlings are faster growing and more drought tolerant than grafted forms.  
  `acer-palmatum:long_term_performance:osu01` · long_term_performance · ranked by database (priority 2) → geo pnw → confidence 0.7

*Gaultheria shallon*
- Oregon State University Landscape Plants [unverified]: Oregon State University flags high frost sensitivity and difficult transplanting.  
  `gaultheria-shallon:long_term_performance:osu01` · long_term_performance · ranked by database (priority 2) → geo pnw → confidence 0.65

*Arctostaphylos uva-ursi*
- USDA PLANTS Database [unverified]: USDA PLANTS: multi-stemmed, moderate vegetative spread but slow seed spread and low seedling vigour; does not resprout or coppice, low fire tolerance; flagged as a known allelopath; long-lived.  
  `arctostaphylos-uva-ursi:behaviour_with_others:usdaplants01` · behaviour_with_others · ranked by database (priority 2) → geo north_america → confidence 0.75

*Achillea millefolium*
- USDA PLANTS Database [unverified]: USDA PLANTS: moderate lifespan, low seedling vigour, minimum temperature -38 °F, 120 frost-free days, 8–60 in precipitation, roots to at least 8 in.  
  `achillea-millefolium:long_term_performance:usdaplants01` · long_term_performance · ranked by database (priority 2) → geo north_america → confidence 0.7
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: lean, well-drained sandy loam preferred; tolerates poor soil if drainage is good.  
  `achillea-millefolium:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden flags weak, flopping stems (worse in rich moist soil), a tangled look by late summer unless cut back, and a need for shelter from strong wind.  
  `achillea-millefolium:long_term_performance:mobot01` · long_term_performance · ranked by database (priority 2) → geo global → confidence 0.8

*Gaillardia aristata*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden warns of root rot in poorly drained soil under prolonged heavy rain and poor performance in wet heavy clay.  
  `gaillardia-aristata:long_term_performance:mobot01` · long_term_performance · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: deadhead regularly and cut back after flowering; may need staking.  
  `gaillardia-aristata:maintenance_level:rhs01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.65

*Cornus sericea*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance medium (optional annual removal of 20–25 % of the oldest stems, or coppicing every 2–3 years, for stem colour; sucker removal if spread is unwanted).  
  `cornus-sericea:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8


## e2-r04 (verbatim) — PASS

### `Don’t know`

- names: none · intents: none
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 0 claims by similarity; shown in R5 order (similarity ignored for order); 0 L0 practitioner claims withheld (R2)

**Answer:** no sourced claim matches. (Honest empty answer — the field may exist with no source yet.)


## e2-r05 (verbatim) — PASS

### `What are some hardy ground cover plants for *my area*`

- names: none · intents: hardy → hardiness_zone (gate), ground cover → landscape_use (gate), my area → _source_geo (rank_boost)
- gates: **acer-palmatum** hardy=pass, ground cover=unknown; **achillea-millefolium** hardy=pass, ground cover=pass; **arctostaphylos-uva-ursi** hardy=pass, ground cover=pass; **cercidiphyllum-japonicum** hardy=pass, ground cover=unknown; **cornus-nuttallii** hardy=pass, ground cover=unknown; **cornus-sericea** hardy=pass, ground cover=unknown; **gaillardia-aristata** hardy=pass, ground cover=unknown; **gaultheria-shallon** hardy=pass, ground cover=pass; **polystichum-munitum** hardy=pass, ground cover=pass; **vaccinium-ovatum** hardy=pass, ground cover=unknown
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 37 claims by similarity; shown in R5 order (similarity ignored for order); 2 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Cercidiphyllum japonicum*
- A MLA student and practising landscape designer; studio and professional experience noted from site observation: “Katsura: It grows in my backyard and it’s leaf has a sweet smell”  
  `cercidiphyllum-japonicum:landscape_use:sv02` · landscape_use · ranked by practitioner (priority 1) → geo vancouver → completeness L2 → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks lists Cercidiphyllum japonicum for USDA zones 4 to 8.  
  `cercidiphyllum-japonicum:hardiness_zone:gpp01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 4.  
  `cercidiphyllum-japonicum:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS rates Cercidiphyllum japonicum hardiness H5 (hardy in most of the UK even in severe winters, about -15 to -10 °C).  
  `cercidiphyllum-japonicum:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85

*Gaultheria shallon*
- A practising landscape designer; personal-garden, professional and studio planting experience noted from site observation (location not recorded): “Salal — derived from the respondent's note: usually it's used in a more pacific northwest native plants focused gardens, les…”  
  `gaultheria-shallon:landscape_use:sv03` · landscape_use · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 6.  
  `gaultheria-shallon:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS rates Gaultheria shallon hardiness H5 (cold winter, about -15 to -10 °C).  
  `gaultheria-shallon:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85

*Cornus sericea*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: common throughout BC on wet to mesic streamsides, lakesides, swamps and forests from lowland to montane; recorded in all major BGC zones including the Coastal Western Hemlock (465 plots) and Coastal Douglas-fir zones that cover Vancouver; modal zone SBS; tolerates fluctuating water tables and typifies alluvial floodplain forest.  
  `cornus-sericea:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 2.  
  `cornus-sericea:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS rates Cornus sericea hardiness H7 (very hardy, below about -20 °C).  
  `cornus-sericea:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85

*Gaillardia aristata*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: an interior dry-grassland and shrubland species of the lowland, steppe and lower montane zones (modal zone IDF, also BG and PP), 250–1968 m; common in south-central and south-eastern BC; in the lower Fraser Valley it is introduced, not native.  
  `gaillardia-aristata:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Royal Horticultural Society [unverified]: RHS rates Gaillardia aristata hardiness H4 (hardy through most of the UK, about -10 to -5 °C).  
  `gaillardia-aristata:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85

*Cornus nuttallii*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: in BC confined to the southwest corner (mainland and Vancouver Island); mesic lowland to montane forests, shrub layer of mixed and coniferous stands, disturbed sites and water-shedding colluvial slopes on nitrogen-rich soils, mostly in the Coastal Western Hemlock and Coastal Douglas-fir zones, 0–833 m (mean 194 m); BC's floral emblem since 1956.  
  `cornus-nuttallii:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 7.  
  `cornus-nuttallii:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS rates Cornus nuttallii hardiness H5 (hardy in most of the UK even in severe winters, about -15 to -10 °C).  
  `cornus-nuttallii:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85

*Arctostaphylos uva-ursi*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: common throughout BC in dry forests and exposed, often rocky sites from lowland to lower alpine; modal zone is Interior Douglas-fir (dry interior), with only 92 of 5,666 plots in the Coastal Western Hemlock zone that Vancouver sits in; mean soil moisture regime 2 (subxeric).  
  `arctostaphylos-uva-ursi:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University lists the plant as an evergreen ground cover.  
  `arctostaphylos-uva-ursi:landscape_use:osu01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: mat-forming evergreen ground cover whose branches root where they touch the soil.  
  `arctostaphylos-uva-ursi:form:osu01` · form · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 2 (varies).  
  `arctostaphylos-uva-ursi:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS wildlife table: food value moderate for large mammals and low–moderate for terrestrial birds; cover value moderate for small mammals and terrestrial birds.  
  `arctostaphylos-uva-ursi:ecological_value:usdaplants02` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.7
- Royal Horticultural Society [unverified]: RHS rates Arctostaphylos uva-ursi hardiness H7 (very hardy, below -20 °C).  
  `arctostaphylos-uva-ursi:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85
- Royal Horticultural Society [unverified]: RHS suggests 'Vancouver Jade' for patio containers, cottage and informal gardens, banks and slopes, ground cover and underplanting of roses and shrubs.  
  `arctostaphylos-uva-ursi:landscape_use:rhs02` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS suggests ground cover, gravel gardens and Mediterranean-climate plantings.  
  `arctostaphylos-uva-ursi:landscape_use:rhs01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: moderate- to large-scale ground cover with year-round interest; erosion control on slopes; around shrubs, sunny border margins, naturalised areas, native plant gardens, herb gardens, draped over walls, rock gardens; attracts birds.  
  `arctostaphylos-uva-ursi:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Polystichum munitum*
- Great Plant Picks [unverified]: Great Plant Picks: a specimen or massed as a tall groundcover; a Pacific Northwest native staple.  
  `polystichum-munitum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 4.  
  `polystichum-munitum:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks: optional cut-back to the ground in late winter; only every three years on poor or dry soil.  
  `polystichum-munitum:maintenance_level:gpp01` · maintenance_level · ranked by database (priority 2) → geo pnw → confidence 0.7
- Royal Horticultural Society [unverified]: RHS rates Polystichum munitum hardiness H7 (very hardy, below -20 °C).  
  `polystichum-munitum:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85

*Acer palmatum*
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 5.  
  `acer-palmatum:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS rates Acer palmatum hardiness H6 (hardy through most of the UK, about -20 to -15 °C).  
  `acer-palmatum:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85

*Vaccinium ovatum*
- Oregon State University Landscape Plants [unverified]: Oregon State University: hardy to USDA zone 7.  
  `vaccinium-ovatum:hardiness_zone:osu01` · hardiness_zone · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University notes use of the foliage in the florist industry.  
  `vaccinium-ovatum:landscape_use:osu01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS rates Vaccinium ovatum hardiness H4 (average UK winter, about -10 to -5 °C).  
  `vaccinium-ovatum:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85

*Achillea millefolium*
- Royal Horticultural Society [unverified]: RHS rates Achillea millefolium hardiness H7 (very hardy, below -20 °C).  
  `achillea-millefolium:hardiness_zone:rhs01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: naturalise in meadows, prairies, cottage, seaside and rock gardens; flowering ground cover or mown lawn substitute in sunny out-of-the-way areas; good fresh cut or dried flower; attracts butterflies; too weedy for borders.  
  `achillea-millefolium:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8


## e2-r06 (verbatim) — PASS

### `Help me select an evergreen perennial species that will be planted on the north-facing side of an accessible roof garden located on the 38th floor.`

- names: none · intents: shade-tolerant → exposure (gate), evergreen → seasonal_interest.evergreen (gate), perennial → kpu_plant_type (gate), roof garden → landscape_use (gate), accessible → custom:accessibility (compare), zen / Japanese garden → _design:composition (compare)
- gates: **acer-palmatum** shade-tolerant=pass, evergreen=unknown, perennial=pass, roof garden=unknown; **achillea-millefolium** shade-tolerant=pass, evergreen=unknown, perennial=pass, roof garden=unknown; **arctostaphylos-uva-ursi** shade-tolerant=pass, evergreen=pass, perennial=pass, roof garden=pass; **cercidiphyllum-japonicum** shade-tolerant=pass, evergreen=unknown, perennial=pass, roof garden=unknown; **cornus-nuttallii** shade-tolerant=pass, evergreen=unknown, perennial=pass, roof garden=unknown; **cornus-sericea** shade-tolerant=pass, evergreen=unknown, perennial=pass, roof garden=unknown; **gaillardia-aristata** shade-tolerant=pass, evergreen=unknown, perennial=pass, roof garden=pass; **gaultheria-shallon** shade-tolerant=pass, evergreen=pass, perennial=pass, roof garden=pass; **polystichum-munitum** shade-tolerant=pass, evergreen=pass, perennial=pass, roof garden=unknown; **vaccinium-ovatum** shade-tolerant=pass, evergreen=pass, perennial=pass, roof garden=pass
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 40 claims by similarity; shown in R5 order (similarity ignored for order); 0 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Polystichum munitum*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: evergreen perennial.  
  `polystichum-munitum:seasonal_interest:eflora01` · seasonal_interest · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen; leathery, shiny, dark green fronds.  
  `polystichum-munitum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: evergreen fern with dark green pinnate fronds; no flowers.  
  `polystichum-munitum:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Royal Horticultural Society [unverified]: RHS: full or partial shade; exposed or sheltered sites; north, east or west aspect.  
  `polystichum-munitum:exposure:rhs01` · exposure · ranked by database (priority 2) → geo global → confidence 0.85

*Vaccinium ovatum*
- Great Plant Picks [unverified]: Great Plant Picks: copper-bronze spring foliage maturing dark green; small white urn flowers in spring; blue-black berries by late summer.  
  `vaccinium-ovatum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks: full sun to deep shade; flowering and fruiting may stop in deep shade.  
  `vaccinium-ovatum:exposure:gpp01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks gives Vaccinium ovatum a 10-year size of 6 ft tall by 4 ft wide (1.8 × 1.2 m).  
  `vaccinium-ovatum:time_to_intended_size:gpp01` · time_to_intended_size · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen glossy dark green leaves on reddish stems; pale pink urn-shaped flowers in spring; edible fruit red then blue-black by late summer.  
  `vaccinium-ovatum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: sun to part shade.  
  `vaccinium-ovatum:exposure:osu01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS rates shade tolerance low.  
  `vaccinium-ovatum:exposure:usdaplants01` · exposure · ranked by database (priority 2) → geo north_america → confidence 0.6
- Royal Horticultural Society [unverified]: RHS: full sun or partial shade, sheltered.  
  `vaccinium-ovatum:exposure:rhs01` · exposure · ranked by database (priority 2) → geo global → confidence 0.85

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks: one of the most brilliant red autumn colours among Japanese maples; green foliage in season.  
  `acer-palmatum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: sun to part shade; needs wind protection.  
  `acer-palmatum:exposure:osu01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.8
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
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates water needs as medium.  
  `acer-palmatum:water_drainage:mobot01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden lists Acer palmatum for USDA zones 5 to 8.  
  `acer-palmatum:hardiness_zone:mobot01` · hardiness_zone · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden lists Acer palmatum as tolerating rabbits and black walnut.  
  `acer-palmatum:resistances:mobot01` · resistances · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates maintenance as low; pruning best kept to a minimum.  
  `acer-palmatum:maintenance_level:mobot01` · maintenance_level · ranked by database (priority 2) → geo global → confidence 0.8
- … 2 more

*Cercidiphyllum japonicum*
- Great Plant Picks [unverified]: Great Plant Picks lists seasonal interest as autumn foliage colour and describes it as an easy tree to garden under.  
  `cercidiphyllum-japonicum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: insignificant flowers March–April before the leaves, red on male and green on female trees; leaves emerge reddish purple, medium green with a bluish tinge in summer, gold, orange and red in autumn; fallen leaves scented; greenish pods on females.  
  `cercidiphyllum-japonicum:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: shade tree; small specimen shade tree or street tree.  
  `cercidiphyllum-japonicum:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: full sun to part shade; best sited with protection from strong winds and hot afternoon sun.  
  `cercidiphyllum-japonicum:exposure:mobot01` · exposure · ranked by database (priority 2) → geo global → confidence 0.8

*Gaillardia aristata*
- Royal Horticultural Society [unverified]: RHS: deciduous herbaceous perennial; large daisy-like orange-red and yellow flower heads from mid-summer to early autumn; greyish-green lance-shaped leaves.  
  `gaillardia-aristata:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: native to western North America (North Dakota to Colorado, west to California and British Columbia), mainly dry meadows, prairies, grasslands and foothills; flowers attract butterflies and other insect pollinators; seed heads attract birds.  
  `gaillardia-aristata:ecological_value:mobot01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: showy daisy-type flower heads May to October with yellow ray florets (sometimes purple-based) around a brownish-purple disk; grey-green lance-shaped leaves; herbaceous.  
  `gaillardia-aristata:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: perennial border fronts, rock gardens, cottage gardens, cutting gardens and containers; suggested use naturalize; attracts butterflies and birds.  
  `gaillardia-aristata:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Cornus nuttallii*
- Royal Horticultural Society [unverified]: RHS: full sun or partial shade; south- or west-facing aspect; exposed or sheltered sites.  
  `cornus-nuttallii:exposure:rhs01` · exposure · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: bloom April to June, showy white bracts (six) around tiny purple-green flowers; dark green leaves with good yellow-orange-red fall colour; showy bright red or orange fruit.  
  `cornus-nuttallii:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: full sun to part shade; prefers part shade with cool, mulched roots.  
  `cornus-nuttallii:exposure:mobot01` · exposure · ranked by database (priority 2) → geo global → confidence 0.8

*Arctostaphylos uva-ursi*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: white flowers with a pink tinge in April–May; dark green evergreen leaves turning bronze in winter; red fruit from late summer, often held through winter; year-round interest.  
  `arctostaphylos-uva-ursi:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: moderate- to large-scale ground cover with year-round interest; erosion control on slopes; around shrubs, sunny border margins, naturalised areas, native plant gardens, herb gardens, draped over walls, rock gardens; attracts birds.  
  `arctostaphylos-uva-ursi:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Achillea millefolium*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: showy white flower heads June to September over fern-like aromatic green foliage.  
  `achillea-millefolium:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: rhizomatous, spreading, upright to mat-forming perennial.  
  `achillea-millefolium:habit:mobot01` · habit · ranked by database (priority 2) → geo global → confidence 0.75


## e2-r07 (verbatim) — PASS

### `Provide a list of plants that works well in xxx situation and provide xxx functions.`

- names: none · intents: none
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 38 claims by similarity; shown in R5 order (similarity ignored for order); 10 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Gaultheria shallon*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Gaultheria shallon as native to BC (provincial list Yellow, rank S5, secure).  
  `gaultheria-shallon:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- Royal Horticultural Society [unverified]: RHS: well-drained clay, loam or sand; acid or neutral.  
  `gaultheria-shallon:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained to well-drained.  
  `gaultheria-shallon:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75
- Invasive Species Council of BC [unverified]: Gaultheria shallon is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `gaultheria-shallon:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Vaccinium ovatum*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Vaccinium ovatum as native to BC (provincial list Yellow, rank S5, secure).  
  `vaccinium-ovatum:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- Great Plant Picks [unverified]: Great Plant Picks: well-drained or sandy soil; tolerates clay if drainage is adequate.  
  `vaccinium-ovatum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Royal Horticultural Society [unverified]: RHS: acid, moist but well-drained loam or sand.  
  `vaccinium-ovatum:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained.  
  `vaccinium-ovatum:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75
- Invasive Species Council of BC [unverified]: Vaccinium ovatum is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `vaccinium-ovatum:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks: best in rich well-drained soil, also does well in sandy soils and clay.  
  `acer-palmatum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: well-drained soil.  
  `acer-palmatum:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: moist, organically rich, slightly acidic, well-drained soil; grows well in sandy loam.  
  `acer-palmatum:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained soil; chalk, clay, loam or sand; acid or neutral pH.  
  `acer-palmatum:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained.  
  `acer-palmatum:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75

*Cercidiphyllum japonicum*
- Great Plant Picks [unverified]: Great Plant Picks: grows best in rich, well-drained soil.  
  `cercidiphyllum-japonicum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: moist, well-drained soil, pH adaptable, supposedly better fall colour on acid soils.  
  `cercidiphyllum-japonicum:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: grows best in moist, well-drained soil and needs supplemental watering.  
  `cercidiphyllum-japonicum:water_drainage:osu01` · water_drainage · ranked by database (priority 2) → geo pnw → confidence 0.75
- Royal Horticultural Society [unverified]: RHS: clay, sand or loam; moist but well-drained or well-drained; acid or neutral pH.  
  `cercidiphyllum-japonicum:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: best in rich, moist, well-drained soils.  
  `cercidiphyllum-japonicum:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained or well-drained.  
  `cercidiphyllum-japonicum:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75
- Invasive Species Council of BC [unverified]: Cercidiphyllum japonicum is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-11-02); site searches for 'katsura' and 'Cercidiphyllum' return nothing.  
  `cercidiphyllum-japonicum:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Gaillardia aristata*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: average, dry to medium, well-drained soil; prefers organically rich soil that drains well; tolerates dry soil; poor in overly moist heavy clay.  
  `gaillardia-aristata:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: well-drained chalk, loam or sand; acid, neutral or alkaline; moderately fertile.  
  `gaillardia-aristata:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: well-drained soil; drought resistant.  
  `gaillardia-aristata:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.7

*Cornus nuttallii*
- Royal Horticultural Society [unverified]: RHS: loam or sand; moist but well-drained or well-drained; acid or neutral pH; cultivation note asks for fertile, humus-rich soil.  
  `cornus-nuttallii:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained or well-drained.  
  `cornus-nuttallii:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75

*Achillea millefolium*
- Royal Horticultural Society [unverified]: RHS: moist but well-drained to well-drained.  
  `achillea-millefolium:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75

*Arctostaphylos uva-ursi*
- Royal Horticultural Society [unverified]: RHS: moist but well-drained to well-drained.  
  `arctostaphylos-uva-ursi:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75


## c4-r07 (verbatim) — PASS

> a 'could not find' question — an honest empty answer with a named gap is a pass

### `usually it's how well it works with other plants that ive chose.`

- names: none · intents: none
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 37 claims by similarity; shown in R5 order (similarity ignored for order); 0 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Gaultheria shallon*
- A practising landscape designer; personal-garden, professional and studio planting experience noted from site observation (location not recorded): “usually it's used in a more pacific northwest native plants focused gardens, less seen in other types of private/commercial greenspace.”  
  `gaultheria-shallon:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.85
- A practising landscape designer; personal-garden, professional and studio planting experience noted from site observation (location not recorded): “Salal — derived from the respondent's note: usually it's used in a more pacific northwest native plants focused gardens, les…”  
  `gaultheria-shallon:landscape_use:sv03` · landscape_use · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: well-drained clay, loam or sand; acid or neutral.  
  `gaultheria-shallon:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained to well-drained.  
  `gaultheria-shallon:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75

*Achillea millefolium*
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Native species that does well in this local climate”  
  `achillea-millefolium:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Achillea millefolium: Native species that does well in this local climate”  
  `achillea-millefolium:ecological_value:sv03` · ecological_value · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.75
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: flowers attract butterflies and other insect pollinators.  
  `achillea-millefolium:ecological_value:mobot01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: well-drained chalk, clay, loam or sand; acid, neutral or alkaline.  
  `achillea-millefolium:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained to well-drained.  
  `achillea-millefolium:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks: best in rich well-drained soil, also does well in sandy soils and clay.  
  `acer-palmatum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: well-drained soil.  
  `acer-palmatum:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: moist, organically rich, slightly acidic, well-drained soil; grows well in sandy loam.  
  `acer-palmatum:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained soil; chalk, clay, loam or sand; acid or neutral pH.  
  `acer-palmatum:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained.  
  `acer-palmatum:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75

*Cercidiphyllum japonicum*
- Great Plant Picks [unverified]: Great Plant Picks: grows best in rich, well-drained soil.  
  `cercidiphyllum-japonicum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: moist, well-drained soil, pH adaptable, supposedly better fall colour on acid soils.  
  `cercidiphyllum-japonicum:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: grows best in moist, well-drained soil and needs supplemental watering.  
  `cercidiphyllum-japonicum:water_drainage:osu01` · water_drainage · ranked by database (priority 2) → geo pnw → confidence 0.75
- Royal Horticultural Society [unverified]: RHS: clay, sand or loam; moist but well-drained or well-drained; acid or neutral pH.  
  `cercidiphyllum-japonicum:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: best in rich, moist, well-drained soils.  
  `cercidiphyllum-japonicum:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained or well-drained.  
  `cercidiphyllum-japonicum:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75

*Vaccinium ovatum*
- Great Plant Picks [unverified]: Great Plant Picks: well-drained or sandy soil; tolerates clay if drainage is adequate.  
  `vaccinium-ovatum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Royal Horticultural Society [unverified]: RHS: acid, moist but well-drained loam or sand.  
  `vaccinium-ovatum:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained.  
  `vaccinium-ovatum:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75

*Polystichum munitum*
- Great Plant Picks [unverified]: Great Plant Picks: well-drained, humus-rich soil preferred; tolerates poorer soil once established.  
  `polystichum-munitum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Royal Horticultural Society [unverified]: RHS: moist but well-drained.  
  `polystichum-munitum:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75

*Cornus nuttallii*
- Oregon State University Landscape Plants [unverified]: Oregon State University: well-drained, acidic soil high in organic matter.  
  `cornus-nuttallii:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: loam or sand; moist but well-drained or well-drained; acid or neutral pH; cultivation note asks for fertile, humus-rich soil.  
  `cornus-nuttallii:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: average well-drained soil; prefers moist, organically rich, acidic soil.  
  `cornus-nuttallii:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden rates water needs as medium; average, medium-moisture, well-drained soils.  
  `cornus-nuttallii:water_drainage:mobot01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained or well-drained.  
  `cornus-nuttallii:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: performs well in the western US but does not prosper in the eastern US; disease problems follow stress.  
  `cornus-nuttallii:long_term_performance:mobot01` · long_term_performance · ranked by database (priority 2) → geo global → confidence 0.75

*Gaillardia aristata*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: native to western North America (North Dakota to Colorado, west to California and British Columbia), mainly dry meadows, prairies, grasslands and foothills; flowers attract butterflies and other insect pollinators; seed heads attract birds.  
  `gaillardia-aristata:ecological_value:mobot01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: average, dry to medium, well-drained soil; prefers organically rich soil that drains well; tolerates dry soil; poor in overly moist heavy clay.  
  `gaillardia-aristata:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: well-drained chalk, loam or sand; acid, neutral or alkaline; moderately fertile.  
  `gaillardia-aristata:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: well-drained soil; drought resistant.  
  `gaillardia-aristata:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.7

*Arctostaphylos uva-ursi*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: acidic, dry to medium, well-drained sandy or gritty soils; grows well in poor infertile soils.  
  `arctostaphylos-uva-ursi:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained to well-drained.  
  `arctostaphylos-uva-ursi:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75


## e2-r08 (verbatim) — PASS

### `Most visually interesting plants for vancouver’s climate.`

- names: none · intents: my area → _source_geo (rank_boost), visually interesting → seasonal_interest (compare)
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 40 claims by similarity; shown in R5 order (similarity ignored for order); 9 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Achillea millefolium*
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Native species that does well in this local climate”  
  `achillea-millefolium:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Achillea millefolium: Native species that does well in this local climate”  
  `achillea-millefolium:ecological_value:sv03` · ecological_value · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.75
- iNaturalist observations [unverified]: Monthly spread of 2063 Greater Vancouver observations: most in 9, 10, 7 (month numbers).  
  `achillea-millefolium:vancouver_context:inat02` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.55
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=234) put flowering mainly in months 6, 7, 8, 9, 10, 11.  
  `achillea-millefolium:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5

*Gaultheria shallon*
- iNaturalist observations [unverified]: Monthly spread of 5382 Greater Vancouver observations: most in 4, 9, 3 (month numbers).  
  `gaultheria-shallon:vancouver_context:inat02` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.55
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=96) put fruiting mainly in months 7, 8, 9.  
  `gaultheria-shallon:seasonal_interest:inat04` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=129) put flowering mainly in months 5, 6, 7.  
  `gaultheria-shallon:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5

*Gaillardia aristata*
- iNaturalist observations [unverified]: Monthly spread of 249 Greater Vancouver observations: most in 7, 6, 9 (month numbers).  
  `gaillardia-aristata:vancouver_context:inat02` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.55
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=21) put fruiting mainly in months 11, 12.  
  `gaillardia-aristata:seasonal_interest:inat04` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=46) put flowering mainly in months 11, 12.  
  `gaillardia-aristata:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: an interior dry-grassland and shrubland species of the lowland, steppe and lower montane zones (modal zone IDF, also BG and PP), 250–1968 m; common in south-central and south-eastern BC; in the lower Fraser Valley it is introduced, not native.  
  `gaillardia-aristata:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: showy daisy-type flower heads May to October with yellow ray florets (sometimes purple-based) around a brownish-purple disk; grey-green lance-shaped leaves; herbaceous.  
  `gaillardia-aristata:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8

*Cornus nuttallii*
- iNaturalist observations [unverified]: Monthly spread of 386 Greater Vancouver observations: most in 4, 5, 9 (month numbers).  
  `cornus-nuttallii:vancouver_context:inat02` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.55
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=29) put flowering mainly in months 4, 5.  
  `cornus-nuttallii:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: in BC confined to the southwest corner (mainland and Vancouver Island); mesic lowland to montane forests, shrub layer of mixed and coniferous stands, disturbed sites and water-shedding colluvial slopes on nitrogen-rich soils, mostly in the Coastal Western Hemlock and Coastal Douglas-fir zones, 0–833 m (mean 194 m); BC's floral emblem since 1956.  
  `cornus-nuttallii:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: bloom April to June, showy white bracts (six) around tiny purple-green flowers; dark green leaves with good yellow-orange-red fall colour; showy bright red or orange fruit.  
  `cornus-nuttallii:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- City of Vancouver Public Trees: Public Cornus nuttallii occur in 20 of Vancouver's local areas; most in Killarney (92), Riley Park (66), West Point Grey (56), Shaughnessy (49), Dunbar-Southlands (45).  
  `cornus-nuttallii:vancouver_context:cov03` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.9
- City of Vancouver Public Trees: Most frequent cultivar labels for public Cornus nuttallii in Vancouver: 'Goldspot' (11); 'Corigo Giant' (1).  
  `cornus-nuttallii:vancouver_context:cov02` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.85

*Polystichum munitum*
- iNaturalist observations [unverified]: Monthly spread of 8110 Greater Vancouver observations: most in 4, 9, 10 (month numbers).  
  `polystichum-munitum:vancouver_context:inat02` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.55

*Cercidiphyllum japonicum*
- Great Plant Picks [unverified]: Great Plant Picks: new leaves reddish-purple, blue-green through summer, butter-yellow with orange and apricot in autumn; fallen leaves scented of strawberries and cotton candy; seasonal interest listed as autumn foliage colour.  
  `cercidiphyllum-japonicum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: leaves purplish tan when unfolding then bluish-green; apricot-orange fall colour that is not spectacular in Corvallis; male flowers in spring before the leaves, female flowers as leaves expand, neither showy; small narrow pods.  
  `cercidiphyllum-japonicum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks lists seasonal interest as autumn foliage colour and describes it as an easy tree to garden under.  
  `cercidiphyllum-japonicum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- City of Vancouver Public Trees: Public Cercidiphyllum japonicum occur in 22 of Vancouver's local areas; most in Hastings-Sunrise (306), Oakridge (221), Renfrew-Collingwood (198), Kerrisdale (191), Dunbar-Southlands (168).  
  `cercidiphyllum-japonicum:vancouver_context:cov03` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.9
- City of Vancouver Public Trees: Most frequent cultivar labels for public Cercidiphyllum japonicum in Vancouver: 'Red Fox' (30); 'Pendula' (5); 'Morioka Weeping' (1).  
  `cercidiphyllum-japonicum:vancouver_context:cov02` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.85

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks: one of the most brilliant red autumn colours among Japanese maples; green foliage in season.  
  `acer-palmatum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: small red to purple flowers with the new leaves; scarlet, orange or yellow fall colour; samaras ripen early fall.  
  `acer-palmatum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: small red flowers in spring; deciduous with good autumn colour.  
  `acer-palmatum:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Royal Horticultural Society [unverified]: RHS: 'Bloodgood' has deep red-purple foliage, small purple flowers and red autumn colour.  
  `acer-palmatum:seasonal_interest:rhs02` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: reddish-purple flowers in April, insignificant; good fall colour in yellow, red-purple and bronze.  
  `acer-palmatum:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- City of Vancouver Public Trees: Public Acer palmatum occur in 22 of Vancouver's local areas; most in Riley Park (247), Kitsilano (216), Renfrew-Collingwood (176), Kensington-Cedar Cottage (133), Sunset (101).  
  `acer-palmatum:vancouver_context:cov03` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.9
- City of Vancouver Public Trees: Most frequent cultivar labels for public Acer palmatum in Vancouver: 'Osakazuki' (407); 'Bloodgood' (88); 'Koto No Ito' (65); 'Atropurpureum' (43); 'Harvest Orange' (25).  
  `acer-palmatum:vancouver_context:cov02` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.85


## c4-r08 (verbatim) — PASS

> a 'could not find' question — an honest empty answer with a named gap is a pass

### `Plant colour variations and if they are suitable for our climate. Some variants are not popular so there is little information about them.`

- names: none · intents: my area → _source_geo (rank_boost), visually interesting → seasonal_interest (compare)
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 40 claims by similarity; shown in R5 order (similarity ignored for order); 10 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Achillea millefolium*
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Native species that does well in this local climate”  
  `achillea-millefolium:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Achillea millefolium: Native species that does well in this local climate”  
  `achillea-millefolium:ecological_value:sv03` · ecological_value · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.75
- A MLA student; studio and personal-garden planting experience noted from mixed experience (location not recorded): “Spreads vigorously under certain conditions so use cautiously. However, large swathes of yarrow can be beautiful.”  
  `achillea-millefolium:behaviour_with_others:sv02` · behaviour_with_others · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.7
- USDA PLANTS Database [unverified]: USDA PLANTS: conspicuous white flowers in early summer, inconspicuous brown persistent seed in summer, green foliage not retained, no fall colour.  
  `achillea-millefolium:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: showy white flower heads June to September over fern-like aromatic green foliage.  
  `achillea-millefolium:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8

*Gaultheria shallon*
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=96) put fruiting mainly in months 7, 8, 9.  
  `gaultheria-shallon:seasonal_interest:inat04` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=129) put flowering mainly in months 5, 6, 7.  
  `gaultheria-shallon:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5

*Gaillardia aristata*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: an interior dry-grassland and shrubland species of the lowland, steppe and lower montane zones (modal zone IDF, also BG and PP), 250–1968 m; common in south-central and south-eastern BC; in the lower Fraser Valley it is introduced, not native.  
  `gaillardia-aristata:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- USDA PLANTS Database [unverified]: USDA PLANTS: conspicuous yellow flowers in spring, green foliage, inconspicuous brown seed summer to fall, no fall colour, leaves not retained.  
  `gaillardia-aristata:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.7
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: showy daisy-type flower heads May to October with yellow ray florets (sometimes purple-based) around a brownish-purple disk; grey-green lance-shaped leaves; herbaceous.  
  `gaillardia-aristata:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8

*Cornus nuttallii*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: deciduous; 4–7 showy white or pink-tinged bracts around tiny greenish-white flowers in mid-spring, often flowering again in fall; leaves turn red in fall; bright red drupes summer to fall.  
  `cornus-nuttallii:seasonal_interest:eflora01` · seasonal_interest · ranked by database (priority 2) → geo bc → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: deciduous; 4–8 showy white (rarely pink) bracts 5–8 cm long around 30–40 small dull green or purple flowers in spring, occasionally again in fall; orange to bright red fruit clusters in fall.  
  `cornus-nuttallii:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: green conspicuous flowers in mid spring, green foliage, conspicuous fall colour, abundant red fruit summer to fall, leaves not retained.  
  `cornus-nuttallii:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: bloom April to June, showy white bracts (six) around tiny purple-green flowers; dark green leaves with good yellow-orange-red fall colour; showy bright red or orange fruit.  
  `cornus-nuttallii:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8

*Cercidiphyllum japonicum*
- Great Plant Picks [unverified]: Great Plant Picks: new leaves reddish-purple, blue-green through summer, butter-yellow with orange and apricot in autumn; fallen leaves scented of strawberries and cotton candy; seasonal interest listed as autumn foliage colour.  
  `cercidiphyllum-japonicum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: leaves purplish tan when unfolding then bluish-green; apricot-orange fall colour that is not spectacular in Corvallis; male flowers in spring before the leaves, female flowers as leaves expand, neither showy; small narrow pods.  
  `cercidiphyllum-japonicum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks lists seasonal interest as autumn foliage colour and describes it as an easy tree to garden under.  
  `cercidiphyllum-japonicum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- Great Plant Picks [unverified]: Great Plant Picks: regular summer watering in dry spells is needed, more so in full sun or poor soils; best colour and growth in full sun to light shade.  
  `cercidiphyllum-japonicum:long_term_performance:gpp01` · long_term_performance · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: moist, well-drained soil, pH adaptable, supposedly better fall colour on acid soils.  
  `cercidiphyllum-japonicum:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University, Corvallis observations: fall colour underwhelming, young leaves deformed by spring frosts, bark splitting and sun scald possible.  
  `cercidiphyllum-japonicum:long_term_performance:osu01` · long_term_performance · ranked by database (priority 2) → geo pnw → confidence 0.75

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks: full sun or light to open shade; best autumn colour in full sun to open shade.  
  `acer-palmatum:exposure:gpp01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: small red to purple flowers with the new leaves; scarlet, orange or yellow fall colour; samaras ripen early fall.  
  `acer-palmatum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: small red flowers in spring; deciduous with good autumn colour.  
  `acer-palmatum:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Royal Horticultural Society [unverified]: RHS: 'Bloodgood' has deep red-purple foliage, small purple flowers and red autumn colour.  
  `acer-palmatum:seasonal_interest:rhs02` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: reddish-purple flowers in April, insignificant; good fall colour in yellow, red-purple and bronze.  
  `acer-palmatum:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8

*Arctostaphylos uva-ursi*
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen lustrous dark green leaves; white, pink-tinged urn-shaped flowers in nodding terminal clusters; bright red drupes about 6 mm, not always produced.  
  `arctostaphylos-uva-ursi:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: conspicuous purple flowers in late spring, dark green leaves retained, conspicuous fall colour, red fruit summer to fall that persists.  
  `arctostaphylos-uva-ursi:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.7

*Cornus sericea*
- USDA PLANTS Database [unverified]: USDA PLANTS: conspicuous white flowers in spring, conspicuous white fruit in summer, conspicuous fall colour, leaves not retained.  
  `cornus-sericea:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.7
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: showy white flowers May–June, white (sometimes bluish) drupes in summer, good red-to-orange fall colour, bright red winter stems.  
  `cornus-sericea:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden suggests hedge and rain-garden use; massed or as a specimen, in shrub borders, naturalistic moist plantings, wet low spots and stream or pond edges for erosion control, and as a property-line screen; attracts birds and butterflies; winter interest and good fall colour.  
  `cornus-sericea:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.75


## e2-r09 (verbatim) — PASS

### `I am designing a medicinal garden for Vancouver and there are currently [types of trees/plans] on site that I plan to keep. Create a list of plants that is native and would help attract pollinators.`

- names: none · intents: native → origin_status (gate), my area → _source_geo (rank_boost), medicinal → landscape_use (compare)
- gates: **acer-palmatum** native=fail; **achillea-millefolium** native=pass; **arctostaphylos-uva-ursi** native=pass; **cercidiphyllum-japonicum** native=fail; **cornus-nuttallii** native=pass; **cornus-sericea** native=pass; **gaillardia-aristata** native=fail; **gaultheria-shallon** native=pass; **polystichum-munitum** native=pass; **vaccinium-ovatum** native=pass
- candidates after gates: achillea-millefolium, arctostaphylos-uva-ursi, cornus-nuttallii, cornus-sericea, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum (excluded: acer-palmatum, cercidiphyllum-japonicum, gaillardia-aristata)
- recall: 34 claims by similarity; shown in R5 order (similarity ignored for order); 8 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Gaultheria shallon*
- A practising landscape designer; personal-garden, professional and studio planting experience noted from site observation (location not recorded): “usually it's used in a more pacific northwest native plants focused gardens, less seen in other types of private/commercial greenspace.”  
  `gaultheria-shallon:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.85
- A practising landscape designer; personal-garden, professional and studio planting experience noted from site observation (location not recorded): “Salal — derived from the respondent's note: usually it's used in a more pacific northwest native plants focused gardens, les…”  
  `gaultheria-shallon:landscape_use:sv03` · landscape_use · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Gaultheria shallon as native to BC (provincial list Yellow, rank S5, secure).  
  `gaultheria-shallon:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Alaska, Canada and the lower 48 states.  
  `gaultheria-shallon:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Invasive Species Council of BC [unverified]: Gaultheria shallon is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `gaultheria-shallon:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Achillea millefolium*
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Native species that does well in this local climate”  
  `achillea-millefolium:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Achillea millefolium: Native species that does well in this local climate”  
  `achillea-millefolium:ecological_value:sv03` · ecological_value · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.75
- iNaturalist observations [unverified]: iNaturalist holds 2063 openly licensed verifiable observations of this plant in Greater Vancouver (1502 research grade), recorded 2012–2026.  
  `achillea-millefolium:vancouver_context:inat01` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.6
- iNaturalist observations [unverified]: Monthly spread of 2063 Greater Vancouver observations: most in 9, 10, 7 (month numbers).  
  `achillea-millefolium:vancouver_context:inat02` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.55
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC treats the native coastal yarrow as Achillea borealis var. borealis (synonym A. millefolium var. borealis): origin Native, provincial list Yellow, rank S5 (secure). The A. millefolium species page itself carries origin status Exotic (SNA), while its taxonomic note recognises four native ecogeographic varieties (alpicola, lanulosa, borealis, pacifica).  
  `achillea-millefolium:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS records Achillea millefolium as native in Alaska, Canada, the lower 48 states, Greenland and St Pierre et Miquelon, and as also introduced in Canada, the lower 48, Hawaii and St Pierre et Miquelon — native and introduced genotypes both present.  
  `achillea-millefolium:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.75
- Royal Horticultural Society [unverified]: RHS lists Achillea millefolium as a Plant for Pollinators.  
  `achillea-millefolium:ecological_value:rhs01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: flowers attract butterflies and other insect pollinators.  
  `achillea-millefolium:ecological_value:mobot01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS suggests wildflower meadows, wildlife gardens, gravel gardens and cottage/informal gardens; listed as an RHS Plant for Pollinators.  
  `achillea-millefolium:landscape_use:rhs01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: naturalise in meadows, prairies, cottage, seaside and rock gardens; flowering ground cover or mown lawn substitute in sunny out-of-the-way areas; good fresh cut or dried flower; attracts butterflies; too weedy for borders.  
  `achillea-millefolium:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Invasive Species Council of BC [unverified]: Achillea millefolium is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-11-02); ISCBC's Grow Me Instead material instead names yarrow as a native, non-invasive alternative to tansy, field scabious and baby's-breath.  
  `achillea-millefolium:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Vaccinium ovatum*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Vaccinium ovatum as native to BC (provincial list Yellow, rank S5, secure).  
  `vaccinium-ovatum:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `vaccinium-ovatum:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Invasive Species Council of BC [unverified]: Vaccinium ovatum is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `vaccinium-ovatum:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Cornus nuttallii*
- Oregon State University Landscape Plants [unverified]: Oregon State University: native to Oregon; range along the Pacific coast from just beyond Vancouver Island, BC, to southern California, with a disjunct population in north-central Idaho.  
  `cornus-nuttallii:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `cornus-nuttallii:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden uses: specimen or small grouping near homes, patios and lawns; woodland, bird and native plant gardens; attracts birds and butterflies.  
  `cornus-nuttallii:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: native to coastal regions west of the Cascades from southern British Columbia to southern California, with a disjunct population in northern Idaho.  
  `cornus-nuttallii:ecological_value:mobot01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.8
- Invasive Species Council of BC [unverified]: Cornus nuttallii is not among the 68 plant profiles on the Invasive Species Council of BC 'Find an Invasive Species' list (checked 2026-11-02); no Cornus species is listed. It is a BC native.  
  `cornus-nuttallii:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Polystichum munitum*
- Oregon State University Landscape Plants [unverified]: Oregon State University: native from Alaska to California, east to western Montana; native to Oregon.  
  `polystichum-munitum:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- Invasive Species Council of BC [unverified]: Polystichum munitum is not among the plant profiles on the Invasive Species Council of BC list and returns no site-search result (checked 2026-11-02); it is a BC native.  
  `polystichum-munitum:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9


## e2-r10 (verbatim) — PASS

### `Find me a plant that fits with my concept`

- names: none · intents: none
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 4 claims by similarity; shown in R5 order (similarity ignored for order); 0 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Acer palmatum*
- Invasive Species Council of BC [unverified]: Acer palmatum is not among the 68 plant profiles on the Invasive Species Council of BC 'Find an Invasive Species' list (checked 2026-10-29); no Acer species is listed.  
  `acer-palmatum:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Gaillardia aristata*
- Invasive Species Council of BC [unverified]: Gaillardia aristata is not among the 114 species profiles on the Invasive Species Council of BC 'Find an Invasive Species' list (checked 2026-11-02); it is a BC native.  
  `gaillardia-aristata:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Achillea millefolium*
- Invasive Species Council of BC [unverified]: Achillea millefolium is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-11-02); ISCBC's Grow Me Instead material instead names yarrow as a native, non-invasive alternative to tansy, field scabious and baby's-breath.  
  `achillea-millefolium:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Cornus nuttallii*
- Invasive Species Council of BC [unverified]: Cornus nuttallii is not among the 68 plant profiles on the Invasive Species Council of BC 'Find an Invasive Species' list (checked 2026-11-02); no Cornus species is listed. It is a BC native.  
  `cornus-nuttallii:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9


## e2-r11 (verbatim) — PASS

### `I would like a tree that is climatically adaptable to the future Vancouver landscape, but can still be established in the current conditions.`

- names: none · intents: my area → _source_geo (rank_boost)
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 39 claims by similarity; shown in R5 order (similarity ignored for order); 1 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Cercidiphyllum japonicum*
- A MLA student and practising landscape designer; studio and professional experience noted from site observation: “Katsura: It grows in my backyard and it’s leaf has a sweet smell”  
  `cercidiphyllum-japonicum:landscape_use:sv02` · landscape_use · ranked by practitioner (priority 1) → geo vancouver → completeness L2 → confidence 0.8
- iNaturalist observations [unverified]: iNaturalist holds 8 openly licensed verifiable observations of this plant in Greater Vancouver (2 research grade), recorded 2021–2026.  
  `cercidiphyllum-japonicum:vancouver_context:inat01` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.6
- Oregon State University Landscape Plants [unverified]: Oregon State University: moist, well-drained soil, pH adaptable, supposedly better fall colour on acid soils.  
  `cercidiphyllum-japonicum:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: sun, but probably best in light shade.  
  `cercidiphyllum-japonicum:exposure:osu01` · exposure · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: clay, sand or loam; moist but well-drained or well-drained; acid or neutral pH.  
  `cercidiphyllum-japonicum:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: shade tree; small specimen shade tree or street tree.  
  `cercidiphyllum-japonicum:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained or well-drained.  
  `cercidiphyllum-japonicum:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75
- City of Vancouver Public Trees: Cercidiphyllum japonicum is in the City of Vancouver public tree inventory (2647 trees, snapshot 2026-11-02).  
  `cercidiphyllum-japonicum:in_vancouver_street_tree_list:cov01` · in_vancouver_street_tree_list · ranked by municipal (priority 4) → geo vancouver → confidence 0.95
- City of Vancouver Public Trees: Public Cercidiphyllum japonicum occur in 22 of Vancouver's local areas; most in Hastings-Sunrise (306), Oakridge (221), Renfrew-Collingwood (198), Kerrisdale (191), Dunbar-Southlands (168).  
  `cercidiphyllum-japonicum:vancouver_context:cov03` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.9
- City of Vancouver Public Trees: The City of Vancouver inventory lists 2647 public Cercidiphyllum japonicum trees; 2611 carry no cultivar label and the rest are spread over 3 cultivar names.  
  `cercidiphyllum-japonicum:vancouver_context:cov01` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.9
- City of Vancouver Public Trees: Most frequent cultivar labels for public Cercidiphyllum japonicum in Vancouver: 'Red Fox' (30); 'Pendula' (5); 'Morioka Weeping' (1).  
  `cercidiphyllum-japonicum:vancouver_context:cov02` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.85
- City of Vancouver Public Trees: Trunk diameters (DBH) of 2645 public Cercidiphyllum japonicum in Vancouver: median 15.2 cm, 90th percentile 40.6 cm, largest 480.1 cm.  
  `cercidiphyllum-japonicum:local_mature_size:cov03` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.8
- … 5 more

*Cornus nuttallii*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: in BC confined to the southwest corner (mainland and Vancouver Island); mesic lowland to montane forests, shrub layer of mixed and coniferous stands, disturbed sites and water-shedding colluvial slopes on nitrogen-rich soils, mostly in the Coastal Western Hemlock and Coastal Douglas-fir zones, 0–833 m (mean 194 m); BC's floral emblem since 1956.  
  `cornus-nuttallii:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- City of Vancouver Public Trees: Cornus nuttallii is in the City of Vancouver public tree inventory (620 trees, snapshot 2026-11-02).  
  `cornus-nuttallii:in_vancouver_street_tree_list:cov01` · in_vancouver_street_tree_list · ranked by municipal (priority 4) → geo vancouver → confidence 0.95
- City of Vancouver Public Trees: Public Cornus nuttallii occur in 20 of Vancouver's local areas; most in Killarney (92), Riley Park (66), West Point Grey (56), Shaughnessy (49), Dunbar-Southlands (45).  
  `cornus-nuttallii:vancouver_context:cov03` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.9
- City of Vancouver Public Trees: Most frequent cultivar labels for public Cornus nuttallii in Vancouver: 'Goldspot' (11); 'Corigo Giant' (1).  
  `cornus-nuttallii:vancouver_context:cov02` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.85
- City of Vancouver Public Trees: Trunk diameters (DBH) of 620 public Cornus nuttallii in Vancouver: median 30.5 cm, 90th percentile 68.6 cm, largest 251.5 cm.  
  `cornus-nuttallii:local_mature_size:cov03` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.8
- City of Vancouver Public Trees: Height class midpoints of 620 public Cornus nuttallii in Vancouver (15/25/35 ft classes, all ages mixed): median class 10.7 m, 10th–90th percentile classes 7.6–16.8 m, highest class 32.0 m.  
  `cornus-nuttallii:local_mature_size:cov01` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.7
- City of Vancouver Public Trees: Among the 480 public Cornus nuttallii in Vancouver counted as established (DBH >= 20 cm, proxy), the median height class midpoint is 10.7 m and the 90th percentile class 16.8 m.  
  `cornus-nuttallii:local_mature_size:cov02` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.6
- City of Vancouver Public Trees: Among the 472 public Cornus nuttallii (cultivar unrecorded) in Vancouver counted as established (DBH >= 20 cm, proxy), the median height class midpoint is 10.7 m and the 90th percentile class 16.8 m.  
  `cornus-nuttallii:local_mature_size:cov05` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.6

*Gaillardia aristata*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: an interior dry-grassland and shrubland species of the lowland, steppe and lower montane zones (modal zone IDF, also BG and PP), 250–1968 m; common in south-central and south-eastern BC; in the lower Fraser Valley it is introduced, not native.  
  `gaillardia-aristata:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks: quick growing and vigorous in youth, still only a small to medium tree.  
  `acer-palmatum:growth_rate:gpp01` · growth_rate · ranked by database (priority 2) → geo pnw → confidence 0.75
- City of Vancouver Public Trees: Acer palmatum is in the City of Vancouver public tree inventory (1848 trees, snapshot 2026-10-26).  
  `acer-palmatum:in_vancouver_street_tree_list:cov01` · in_vancouver_street_tree_list · ranked by municipal (priority 4) → geo vancouver → confidence 0.95
- City of Vancouver Public Trees: Public Acer palmatum occur in 22 of Vancouver's local areas; most in Riley Park (247), Kitsilano (216), Renfrew-Collingwood (176), Kensington-Cedar Cottage (133), Sunset (101).  
  `acer-palmatum:vancouver_context:cov03` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.9
- City of Vancouver Public Trees: The City of Vancouver inventory lists 1848 public Acer palmatum trees; 1103 carry no cultivar label and the rest are spread over 44 cultivar names.  
  `acer-palmatum:vancouver_context:cov01` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.9
- City of Vancouver Public Trees: Most frequent cultivar labels for public Acer palmatum in Vancouver: 'Osakazuki' (407); 'Bloodgood' (88); 'Koto No Ito' (65); 'Atropurpureum' (43); 'Harvest Orange' (25).  
  `acer-palmatum:vancouver_context:cov02` · vancouver_context · ranked by municipal (priority 4) → geo vancouver → confidence 0.85
- City of Vancouver Public Trees: Trunk diameters (DBH) of 1841 public Acer palmatum in Vancouver: median 17.8 cm, 90th percentile 45.7 cm, largest 160.0 cm.  
  `acer-palmatum:local_mature_size:cov03` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.8
- City of Vancouver Public Trees: Height class midpoints of 1848 public Acer palmatum in Vancouver (15/25/35 ft classes, all ages mixed): median class 7.6 m, 10th–90th percentile classes 4.6–10.7 m, highest class 29.0 m.  
  `acer-palmatum:local_mature_size:cov01` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.7
- City of Vancouver Public Trees: Among the 896 public Acer palmatum in Vancouver counted as established (DBH >= 20 cm, proxy), the median height class midpoint is 7.6 m and the 90th percentile class 13.7 m.  
  `acer-palmatum:local_mature_size:cov02` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.6
- City of Vancouver Public Trees: Among the 83 public Acer palmatum 'Osakazuki' in Vancouver counted as established (DBH >= 20 cm, proxy), the median height class midpoint is 7.6 m and the 90th percentile class 10.7 m.  
  `acer-palmatum:local_mature_size:cov05` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.6
- City of Vancouver Public Trees: Among the 747 public Acer palmatum (cultivar unrecorded) in Vancouver counted as established (DBH >= 20 cm, proxy), the median height class midpoint is 10.7 m and the 90th percentile class 13.7 m.  
  `acer-palmatum:local_mature_size:cov12` · local_mature_size · ranked by municipal (priority 4) → geo vancouver → confidence 0.6

*Arctostaphylos uva-ursi*
- Royal Horticultural Society [unverified]: RHS: 'Vancouver Jade' in acid, moist but well-drained clay, loam or sand.  
  `arctostaphylos-uva-ursi:soil_type:rhs02` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: 'Vancouver Jade' in moist but well-drained soil.  
  `arctostaphylos-uva-ursi:water_drainage:rhs02` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75


## e2-r12 (verbatim) — PASS

### `Which plants and what parts are poisonous and to what type of living being it is poisonous to`

- names: none · intents: toxic to pets → toxicity.pets (gate)
- gates: **acer-palmatum** toxic to pets=unknown; **achillea-millefolium** toxic to pets=unknown; **arctostaphylos-uva-ursi** toxic to pets=unknown; **cercidiphyllum-japonicum** toxic to pets=unknown; **cornus-nuttallii** toxic to pets=unknown; **cornus-sericea** toxic to pets=unknown; **gaillardia-aristata** toxic to pets=unknown; **gaultheria-shallon** toxic to pets=unknown; **polystichum-munitum** toxic to pets=unknown; **vaccinium-ovatum** toxic to pets=unknown
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 38 claims by similarity; shown in R5 order (similarity ignored for order); 0 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Cercidiphyllum japonicum*
- Great Plant Picks [unverified]: Great Plant Picks: grows best in rich, well-drained soil.  
  `cercidiphyllum-japonicum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: moist, well-drained soil, pH adaptable, supposedly better fall colour on acid soils.  
  `cercidiphyllum-japonicum:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: best in rich, moist, well-drained soils.  
  `cercidiphyllum-japonicum:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: clay, sand or loam; moist but well-drained or well-drained; acid or neutral pH.  
  `cercidiphyllum-japonicum:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks: best in rich well-drained soil, also does well in sandy soils and clay.  
  `acer-palmatum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: well-drained soil.  
  `acer-palmatum:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained soil; chalk, clay, loam or sand; acid or neutral pH.  
  `acer-palmatum:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: moist, organically rich, slightly acidic, well-drained soil; grows well in sandy loam.  
  `acer-palmatum:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8

*Vaccinium ovatum*
- Great Plant Picks [unverified]: Great Plant Picks: well-drained or sandy soil; tolerates clay if drainage is adequate.  
  `vaccinium-ovatum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- USDA PLANTS Database [unverified]: USDA PLANTS gives a toxicity rating of 'None' for this species; the rating is a US conservation-planting characteristic and says nothing specific about pets or people.  
  `vaccinium-ovatum:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7
- Royal Horticultural Society [unverified]: RHS: acid, moist but well-drained loam or sand.  
  `vaccinium-ovatum:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8

*Polystichum munitum*
- Great Plant Picks [unverified]: Great Plant Picks: well-drained, humus-rich soil preferred; tolerates poorer soil once established.  
  `polystichum-munitum:soil_type:gpp01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: rich soil with organic matter.  
  `polystichum-munitum:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS lists toxicity as none.  
  `polystichum-munitum:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7
- USDA PLANTS Database [unverified]: USDA PLANTS: pH 5.8–7.5, adapted to medium-textured soils only; CaCO3 tolerance medium, salinity tolerance none.  
  `polystichum-munitum:soil_type:usdaplants01` · soil_type · ranked by database (priority 2) → geo north_america → confidence 0.6
- Royal Horticultural Society [unverified]: RHS: moist but well-drained chalk, clay, loam or sand; acid, neutral or alkaline; cultivation note asks for fertile, humus-rich soil.  
  `polystichum-munitum:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8

*Gaultheria shallon*
- Oregon State University Landscape Plants [unverified]: Oregon State University: acid soil.  
  `gaultheria-shallon:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS gives a toxicity rating of 'None' for this species; the rating is a US conservation-planting characteristic and says nothing specific about pets or people.  
  `gaultheria-shallon:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7
- USDA PLANTS Database [unverified]: USDA PLANTS: pH 5.5–7.0, adapted to coarse, medium and fine soils.  
  `gaultheria-shallon:soil_type:usdaplants01` · soil_type · ranked by database (priority 2) → geo north_america → confidence 0.7
- Royal Horticultural Society [unverified]: RHS: well-drained clay, loam or sand; acid or neutral.  
  `gaultheria-shallon:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8

*Cornus nuttallii*
- Oregon State University Landscape Plants [unverified]: Oregon State University: well-drained, acidic soil high in organic matter.  
  `cornus-nuttallii:soil_type:osu01` · soil_type · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS lists toxicity as none.  
  `cornus-nuttallii:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7
- USDA PLANTS Database [unverified]: USDA PLANTS: pH 4.9–7.3, adapted to fine and medium textured soils but not coarse, no CaCO3 tolerance.  
  `cornus-nuttallii:soil_type:usdaplants01` · soil_type · ranked by database (priority 2) → geo north_america → confidence 0.65
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: average well-drained soil; prefers moist, organically rich, acidic soil.  
  `cornus-nuttallii:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: loam or sand; moist but well-drained or well-drained; acid or neutral pH; cultivation note asks for fertile, humus-rich soil.  
  `cornus-nuttallii:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8

*Achillea millefolium*
- USDA PLANTS Database [unverified]: USDA PLANTS gives a toxicity rating of 'Slight' for this species; the rating is a US conservation-planting characteristic and says nothing specific about pets or people.  
  `achillea-millefolium:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7
- USDA PLANTS Database [unverified]: USDA PLANTS: pH 6.0–8.0, calcium-carbonate tolerance medium, adapted to medium-textured soils only.  
  `achillea-millefolium:soil_type:usdaplants01` · soil_type · ranked by database (priority 2) → geo north_america → confidence 0.6
- Royal Horticultural Society [unverified]: RHS: well-drained chalk, clay, loam or sand; acid, neutral or alkaline.  
  `achillea-millefolium:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: lean, well-drained sandy loam preferred; tolerates poor soil if drainage is good.  
  `achillea-millefolium:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8

*Cornus sericea*
- USDA PLANTS Database [unverified]: USDA PLANTS gives a toxicity rating of 'None'; the rating is a US conservation-planting characteristic and says nothing specific about pets or people.  
  `cornus-sericea:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7

*Gaillardia aristata*
- USDA PLANTS Database [unverified]: USDA PLANTS lists toxicity as none.  
  `gaillardia-aristata:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7
- USDA PLANTS Database [unverified]: USDA PLANTS: adapted to coarse and medium textured soils, not fine; pH 5.5–7.9; low fertility requirement; no anaerobic tolerance.  
  `gaillardia-aristata:soil_type:usdaplants01` · soil_type · ranked by database (priority 2) → geo north_america → confidence 0.65
- Royal Horticultural Society [unverified]: RHS: well-drained chalk, loam or sand; acid, neutral or alkaline; moderately fertile.  
  `gaillardia-aristata:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: average, dry to medium, well-drained soil; prefers organically rich soil that drains well; tolerates dry soil; poor in overly moist heavy clay.  
  `gaillardia-aristata:soil_type:mobot01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: showy daisy-type flower heads May to October with yellow ray florets (sometimes purple-based) around a brownish-purple disk; grey-green lance-shaped leaves; herbaceous.  
  `gaillardia-aristata:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8

*Arctostaphylos uva-ursi*
- USDA PLANTS Database [unverified]: USDA PLANTS lists toxicity as none.  
  `arctostaphylos-uva-ursi:toxicity:usdaplants01` · toxicity · ranked by database (priority 2) → geo north_america → confidence 0.7
- Royal Horticultural Society [unverified]: RHS: 'Vancouver Jade' in acid, moist but well-drained clay, loam or sand.  
  `arctostaphylos-uva-ursi:soil_type:rhs02` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: well-drained clay, loam or sand; acid or neutral; cultivation summary asks for lime-free soil.  
  `arctostaphylos-uva-ursi:soil_type:rhs01` · soil_type · ranked by database (priority 2) → geo global → confidence 0.8


## c4-r12 (verbatim) — PASS

> a 'could not find' question — an honest empty answer with a named gap is a pass

### `Medicinal value, how to treat pests`

- names: none · intents: medicinal → landscape_use (compare)
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 38 claims by similarity; shown in R5 order (similarity ignored for order); 7 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Gaultheria shallon*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Gaultheria shallon as native to BC (provincial list Yellow, rank S5, secure).  
  `gaultheria-shallon:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: native to western North America (Alaska to California); fruit taken by birds.  
  `gaultheria-shallon:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- Oregon State University Landscape Plants [unverified]: Oregon State University: foliage sold in the florist trade as 'lemon leaves'.  
  `gaultheria-shallon:landscape_use:osu01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Alaska, Canada and the lower 48 states.  
  `gaultheria-shallon:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS rates hedge tolerance high.  
  `gaultheria-shallon:landscape_use:usdaplants01` · landscape_use · ranked by database (priority 2) → geo north_america → confidence 0.6

*Vaccinium ovatum*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Vaccinium ovatum as native to BC (provincial list Yellow, rank S5, secure).  
  `vaccinium-ovatum:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University notes use of the foliage in the florist industry.  
  `vaccinium-ovatum:landscape_use:osu01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `vaccinium-ovatum:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Royal Horticultural Society [unverified]: RHS lists vine weevil larvae and birds as pests; honey fungus (rare), powdery mildew, root rot and chlorosis as problems.  
  `vaccinium-ovatum:pest_susceptibility:rhs01` · pest_susceptibility · ranked by database (priority 2) → geo global → confidence 0.8

*Cornus nuttallii*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC lists Cornus nuttallii as native to BC (provincial list Yellow, rank S5 (2019), secure; COSEWIC not listed).  
  `cornus-nuttallii:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: native to Oregon; range along the Pacific coast from just beyond Vancouver Island, BC, to southern California, with a disjunct population in north-central Idaho.  
  `cornus-nuttallii:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `cornus-nuttallii:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: native to coastal regions west of the Cascades from southern British Columbia to southern California, with a disjunct population in northern Idaho.  
  `cornus-nuttallii:ecological_value:mobot01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden uses: specimen or small grouping near homes, patios and lawns; woodland, bird and native plant gardens; attracts birds and butterflies.  
  `cornus-nuttallii:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Cercidiphyllum japonicum*
- Great Plant Picks [unverified]: Great Plant Picks lists seasonal interest as autumn foliage colour and describes it as an easy tree to garden under.  
  `cercidiphyllum-japonicum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: shade tree; small specimen shade tree or street tree.  
  `cercidiphyllum-japonicum:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS suggests an architectural planting role and notes the tree is best grown in a woodland setting.  
  `cercidiphyllum-japonicum:landscape_use:rhs01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.7

*Polystichum munitum*
- Oregon State University Landscape Plants [unverified]: Oregon State University: native from Alaska to California, east to western Montana; native to Oregon.  
  `polystichum-munitum:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Alaska, Canada and the lower 48 states.  
  `polystichum-munitum:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8

*Arctostaphylos uva-ursi*
- Oregon State University Landscape Plants [unverified]: Oregon State University: native to Oregon; circumboreal, south to northern California and Virginia.  
  `arctostaphylos-uva-ursi:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS wildlife table: food value moderate for large mammals and low–moderate for terrestrial birds; cover value moderate for small mammals and terrestrial birds.  
  `arctostaphylos-uva-ursi:ecological_value:usdaplants02` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.7
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: native throughout northern North America (Alaska to Newfoundland, south through Canada); fruit eaten by bears, birds and small mammals; helps control soil erosion on slopes.  
  `arctostaphylos-uva-ursi:ecological_value:mobot01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.8

*Gaillardia aristata*
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `gaillardia-aristata:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: perennial border fronts, rock gardens, cottage gardens, cutting gardens and containers; suggested use naturalize; attracts butterflies and birds.  
  `gaillardia-aristata:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: native to western North America (North Dakota to Colorado, west to California and British Columbia), mainly dry meadows, prairies, grasslands and foothills; flowers attract butterflies and other insect pollinators; seed heads attract birds.  
  `gaillardia-aristata:ecological_value:mobot01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.8

*Acer palmatum*
- Royal Horticultural Society [unverified]: RHS lists acer gall mite, aphids, caterpillars and horse chestnut scale as pests; verticillium wilt, leaf scorch and honey fungus as diseases.  
  `acer-palmatum:pest_susceptibility:rhs01` · pest_susceptibility · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden uses: specimen or accent, groups, sun-dappled understory, woodland garden margins, screen, bonsai.  
  `acer-palmatum:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Achillea millefolium*
- Royal Horticultural Society [unverified]: RHS lists Achillea millefolium as a Plant for Pollinators.  
  `achillea-millefolium:ecological_value:rhs01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: flowers attract butterflies and other insect pollinators.  
  `achillea-millefolium:ecological_value:mobot01` · ecological_value · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: naturalise in meadows, prairies, cottage, seaside and rock gardens; flowering ground cover or mown lawn substitute in sunny out-of-the-way areas; good fresh cut or dried flower; attracts butterflies; too weedy for borders.  
  `achillea-millefolium:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Cornus sericea*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden suggests hedge and rain-garden use; massed or as a specimen, in shrub borders, naturalistic moist plantings, wet low spots and stream or pond edges for erosion control, and as a property-line screen; attracts birds and butterflies; winter interest and good fall colour.  
  `cornus-sericea:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.75


## e2-r13 (verbatim) — PASS

### `Native aquatic plants of Vancouver`

- names: none · intents: native → origin_status (gate), my area → _source_geo (rank_boost), aquatic → landscape_use (gate)
- gates: **acer-palmatum** native=fail, aquatic=unknown; **achillea-millefolium** native=pass, aquatic=unknown; **arctostaphylos-uva-ursi** native=pass, aquatic=unknown; **cercidiphyllum-japonicum** native=fail, aquatic=unknown; **cornus-nuttallii** native=pass, aquatic=unknown; **cornus-sericea** native=pass, aquatic=pass; **gaillardia-aristata** native=fail, aquatic=unknown; **gaultheria-shallon** native=pass, aquatic=unknown; **polystichum-munitum** native=pass, aquatic=unknown; **vaccinium-ovatum** native=pass, aquatic=unknown
- candidates after gates: achillea-millefolium, arctostaphylos-uva-ursi, cornus-nuttallii, cornus-sericea, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum (excluded: acer-palmatum, cercidiphyllum-japonicum, gaillardia-aristata)
- recall: 36 claims by similarity; shown in R5 order (similarity ignored for order); 8 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Gaultheria shallon*
- A practising landscape designer; personal-garden, professional and studio planting experience noted from site observation (location not recorded): “usually it's used in a more pacific northwest native plants focused gardens, less seen in other types of private/commercial greenspace.”  
  `gaultheria-shallon:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.85
- A practising landscape designer; personal-garden, professional and studio planting experience noted from site observation (location not recorded): “Salal — derived from the respondent's note: usually it's used in a more pacific northwest native plants focused gardens, les…”  
  `gaultheria-shallon:landscape_use:sv03` · landscape_use · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Alaska, Canada and the lower 48 states.  
  `gaultheria-shallon:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Invasive Species Council of BC [unverified]: Gaultheria shallon is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `gaultheria-shallon:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Achillea millefolium*
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Native species that does well in this local climate”  
  `achillea-millefolium:vancouver_context:sv02` · vancouver_context · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.8
- A MLA student; studio and professional planting experience noted from site observation (location not recorded): “Achillea millefolium: Native species that does well in this local climate”  
  `achillea-millefolium:ecological_value:sv03` · ecological_value · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.75
- A MLA student; studio and personal-garden planting experience noted from mixed experience (location not recorded): “Yarrow — derived from the respondent's note: Spreads vigorously under certain conditions so use cautiously. However, large sw…”  
  `achillea-millefolium:landscape_use:sv03` · landscape_use · ranked by practitioner (priority 1) → geo vancouver → completeness L1 → confidence 0.65
- iNaturalist observations [unverified]: iNaturalist holds 2063 openly licensed verifiable observations of this plant in Greater Vancouver (1502 research grade), recorded 2012–2026.  
  `achillea-millefolium:vancouver_context:inat01` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.6
- iNaturalist observations [unverified]: Monthly spread of 2063 Greater Vancouver observations: most in 9, 10, 7 (month numbers).  
  `achillea-millefolium:vancouver_context:inat02` · vancouver_context · ranked by database (priority 2) → geo vancouver → confidence 0.55
- iNaturalist observations [unverified]: iNaturalist phenology annotations in Greater Vancouver (n=234) put flowering mainly in months 6, 7, 8, 9, 10, 11.  
  `achillea-millefolium:seasonal_interest:inat03` · seasonal_interest · ranked by database (priority 2) → geo vancouver → confidence 0.5
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC treats the native coastal yarrow as Achillea borealis var. borealis (synonym A. millefolium var. borealis): origin Native, provincial list Yellow, rank S5 (secure). The A. millefolium species page itself carries origin status Exotic (SNA), while its taxonomic note recognises four native ecogeographic varieties (alpicola, lanulosa, borealis, pacifica).  
  `achillea-millefolium:ecological_value:eflora01` · ecological_value · ranked by database (priority 2) → geo bc → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS records Achillea millefolium as native in Alaska, Canada, the lower 48 states, Greenland and St Pierre et Miquelon, and as also introduced in Canada, the lower 48, Hawaii and St Pierre et Miquelon — native and introduced genotypes both present.  
  `achillea-millefolium:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.75
- USDA PLANTS Database [unverified]: USDA PLANTS: moisture use medium, drought tolerance medium, anaerobic tolerance none.  
  `achillea-millefolium:water_drainage:usdaplants01` · water_drainage · ranked by database (priority 2) → geo north_america → confidence 0.7
- Royal Horticultural Society [unverified]: RHS suggests wildflower meadows, wildlife gardens, gravel gardens and cottage/informal gardens; listed as an RHS Plant for Pollinators.  
  `achillea-millefolium:landscape_use:rhs01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: moist but well-drained to well-drained.  
  `achillea-millefolium:water_drainage:rhs01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.75
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: dry to medium water.  
  `achillea-millefolium:water_drainage:mobot01` · water_drainage · ranked by database (priority 2) → geo global → confidence 0.7
- … 1 more

*Cornus nuttallii*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: in BC confined to the southwest corner (mainland and Vancouver Island); mesic lowland to montane forests, shrub layer of mixed and coniferous stands, disturbed sites and water-shedding colluvial slopes on nitrogen-rich soils, mostly in the Coastal Western Hemlock and Coastal Douglas-fir zones, 0–833 m (mean 194 m); BC's floral emblem since 1956.  
  `cornus-nuttallii:vancouver_context:eflora01` · vancouver_context · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: native to Oregon; range along the Pacific coast from just beyond Vancouver Island, BC, to southern California, with a disjunct population in north-central Idaho.  
  `cornus-nuttallii:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `cornus-nuttallii:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden uses: specimen or small grouping near homes, patios and lawns; woodland, bird and native plant gardens; attracts birds and butterflies.  
  `cornus-nuttallii:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8
- Invasive Species Council of BC [unverified]: Cornus nuttallii is not among the 68 plant profiles on the Invasive Species Council of BC 'Find an Invasive Species' list (checked 2026-11-02); no Cornus species is listed. It is a BC native.  
  `cornus-nuttallii:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Vaccinium ovatum*
- Great Plant Picks [unverified]: Great Plant Picks: informal groupings, natural low screen, shears into a dense formal hedge; a Pacific Northwest native.  
  `vaccinium-ovatum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.85
- USDA PLANTS Database [unverified]: USDA PLANTS: native in Canada and the lower 48 states.  
  `vaccinium-ovatum:ecological_value:usdaplants01` · ecological_value · ranked by database (priority 2) → geo north_america → confidence 0.8
- Invasive Species Council of BC [unverified]: Vaccinium ovatum is not among the plant profiles on the Invasive Species Council of BC list (checked 2026-10-29); it is a BC native.  
  `vaccinium-ovatum:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9

*Polystichum munitum*
- Great Plant Picks [unverified]: Great Plant Picks: a specimen or massed as a tall groundcover; a Pacific Northwest native staple.  
  `polystichum-munitum:landscape_use:gpp01` · landscape_use · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: native from Alaska to California, east to western Montana; native to Oregon.  
  `polystichum-munitum:ecological_value:osu01` · ecological_value · ranked by database (priority 2) → geo pnw → confidence 0.8
- Invasive Species Council of BC [unverified]: Polystichum munitum is not among the plant profiles on the Invasive Species Council of BC list and returns no site-search result (checked 2026-11-02); it is a BC native.  
  `polystichum-munitum:invasive_status:iscbc01` · invasive_status · ranked by municipal (priority 4) → geo bc → confidence 0.9


## e2-r14 (verbatim) — PASS

### `evergreen`

- names: none · intents: evergreen → seasonal_interest.evergreen (gate), zen / Japanese garden → _design:composition (compare)
- gates: **acer-palmatum** evergreen=unknown; **achillea-millefolium** evergreen=unknown; **arctostaphylos-uva-ursi** evergreen=pass; **cercidiphyllum-japonicum** evergreen=unknown; **cornus-nuttallii** evergreen=unknown; **cornus-sericea** evergreen=unknown; **gaillardia-aristata** evergreen=unknown; **gaultheria-shallon** evergreen=pass; **polystichum-munitum** evergreen=pass; **vaccinium-ovatum** evergreen=pass
- candidates after gates: acer-palmatum, achillea-millefolium, arctostaphylos-uva-ursi, cercidiphyllum-japonicum, cornus-nuttallii, cornus-sericea, gaillardia-aristata, gaultheria-shallon, polystichum-munitum, vaccinium-ovatum
- recall: 40 claims by similarity; shown in R5 order (similarity ignored for order); 5 L0 practitioner claims withheld (R2)

**Answer (R6 — attributed):**

*Polystichum munitum*
- E-Flora BC: Electronic Atlas of the Flora of British Columbia [unverified]: E-Flora BC: evergreen perennial.  
  `polystichum-munitum:seasonal_interest:eflora01` · seasonal_interest · ranked by database (priority 2) → geo bc → confidence 0.9
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen; leathery, shiny, dark green fronds.  
  `polystichum-munitum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: evergreen fern with dark green pinnate fronds; no flowers.  
  `polystichum-munitum:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85

*Vaccinium ovatum*
- Great Plant Picks [unverified]: Great Plant Picks: copper-bronze spring foliage maturing dark green; small white urn flowers in spring; blue-black berries by late summer.  
  `vaccinium-ovatum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks gives Vaccinium ovatum a 10-year size of 6 ft tall by 4 ft wide (1.8 × 1.2 m).  
  `vaccinium-ovatum:time_to_intended_size:gpp01` · time_to_intended_size · ranked by database (priority 2) → geo pnw → confidence 0.85
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen glossy dark green leaves on reddish stems; pale pink urn-shaped flowers in spring; edible fruit red then blue-black by late summer.  
  `vaccinium-ovatum:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- USDA PLANTS Database [unverified]: USDA PLANTS: white flowers in late spring, conspicuous purple fruit in summer, leaves retained.  
  `vaccinium-ovatum:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- Royal Horticultural Society [unverified]: RHS: evergreen; pale pink urn-shaped flowers in spring; fruit red turning blue-black.  
  `vaccinium-ovatum:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85

*Acer palmatum*
- Great Plant Picks [unverified]: Great Plant Picks: one of the most brilliant red autumn colours among Japanese maples; green foliage in season.  
  `acer-palmatum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Great Plant Picks [unverified]: Great Plant Picks gives 'Osakazuki' a 10-year size of 15 ft tall by 12 ft wide (4.6 × 3.7 m).  
  `acer-palmatum:time_to_intended_size:gpp01` · time_to_intended_size · ranked by database (priority 2) → geo pnw → confidence 0.85
- Royal Horticultural Society [unverified]: RHS: small red flowers in spring; deciduous with good autumn colour.  
  `acer-palmatum:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Royal Horticultural Society [unverified]: RHS: 'Bloodgood' has deep red-purple foliage, small purple flowers and red autumn colour.  
  `acer-palmatum:seasonal_interest:rhs02` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: reddish-purple flowers in April, insignificant; good fall colour in yellow, red-purple and bronze.  
  `acer-palmatum:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
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
- … 2 more

*Cercidiphyllum japonicum*
- Great Plant Picks [unverified]: Great Plant Picks: new leaves reddish-purple, blue-green through summer, butter-yellow with orange and apricot in autumn; fallen leaves scented of strawberries and cotton candy; seasonal interest listed as autumn foliage colour.  
  `cercidiphyllum-japonicum:seasonal_interest:gpp01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: insignificant flowers March–April before the leaves, red on male and green on female trees; leaves emerge reddish purple, medium green with a bluish tinge in summer, gold, orange and red in autumn; fallen leaves scented; greenish pods on females.  
  `cercidiphyllum-japonicum:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8

*Gaultheria shallon*
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen glossy leaves; white or pinkish urn flowers in late spring; black edible fruit in summer.  
  `gaultheria-shallon:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: evergreen; light pink and white flowers in early summer; dark purple fruit ripening late summer.  
  `gaultheria-shallon:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85

*Arctostaphylos uva-ursi*
- Oregon State University Landscape Plants [unverified]: Oregon State University: evergreen lustrous dark green leaves; white, pink-tinged urn-shaped flowers in nodding terminal clusters; bright red drupes about 6 mm, not always produced.  
  `arctostaphylos-uva-ursi:seasonal_interest:osu01` · seasonal_interest · ranked by database (priority 2) → geo pnw → confidence 0.8
- Royal Horticultural Society [unverified]: RHS: evergreen; pale pink bell-shaped flowers in summer; bright scarlet fruit in autumn; oval mid-green leaves.  
  `arctostaphylos-uva-ursi:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: white flowers with a pink tinge in April–May; dark green evergreen leaves turning bronze in winter; red fruit from late summer, often held through winter; year-round interest.  
  `arctostaphylos-uva-ursi:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: moderate- to large-scale ground cover with year-round interest; erosion control on slopes; around shrubs, sunny border margins, naturalised areas, native plant gardens, herb gardens, draped over walls, rock gardens; attracts birds.  
  `arctostaphylos-uva-ursi:landscape_use:mobot01` · landscape_use · ranked by database (priority 2) → geo global → confidence 0.8

*Cornus nuttallii*
- USDA PLANTS Database [unverified]: USDA PLANTS: green conspicuous flowers in mid spring, green foliage, conspicuous fall colour, abundant red fruit summer to fall, leaves not retained.  
  `cornus-nuttallii:seasonal_interest:usdaplants01` · seasonal_interest · ranked by database (priority 2) → geo north_america → confidence 0.75
- Royal Horticultural Society [unverified]: RHS: deciduous; mid-green leaves sometimes turning red in autumn (season table: autumn foliage purple and red); late-spring heads of small purple-green flowers surrounded by 4–6 white or pink-tinged bracts; spherical orange-red fruit in autumn.  
  `cornus-nuttallii:seasonal_interest:rhs01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.85
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: bloom April to June, showy white bracts (six) around tiny purple-green flowers; dark green leaves with good yellow-orange-red fall colour; showy bright red or orange fruit.  
  `cornus-nuttallii:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8

*Gaillardia aristata*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: showy daisy-type flower heads May to October with yellow ray florets (sometimes purple-based) around a brownish-purple disk; grey-green lance-shaped leaves; herbaceous.  
  `gaillardia-aristata:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8

*Achillea millefolium*
- Missouri Botanical Garden Plant Finder [unverified]: Missouri Botanical Garden: showy white flower heads June to September over fern-like aromatic green foliage.  
  `achillea-millefolium:seasonal_interest:mobot01` · seasonal_interest · ranked by database (priority 2) → geo global → confidence 0.8

