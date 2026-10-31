# Migration to schema 0.4.0 — 2026-10-31

Script: `tools/migrate_0_4.py`. Ontology: `ontology.json` v0.1.0 (306 nodes). Claims processed: 165 across 3 plants. Nothing deleted; every original value kept (`value_label`, `context`).

## Per field

| field | outcome | n |
|---|---|---|
| ecological_value | mapped | 15 |
| exposure | mapped | 39 |
| growth_rate | mapped | 3 |
| habit | mapped | 3 |
| hardiness_zone | mapped | 3 |
| hardiness_zone | spanned_usda_zones | 7 |
| in_vancouver_street_tree_list | boolean_kept | 1 |
| invasive_status | mapped | 3 |
| landscape_use | mapped | 25 |
| local_mature_size | spanned_height_classes | 8 |
| maintenance_level | mapped | 2 |
| mature_height | spanned_height_classes | 19 |
| mature_spread | spanned_spread_classes | 8 |
| pest_susceptibility | mapped | 20 |
| resistances | mapped | 6 |
| seasonal_interest | evergreen | 14 |
| seasonal_interest | fall_colour | 6 |
| seasonal_interest | flower_colour_colour | 14 |
| seasonal_interest | foliage_colour_colour | 12 |
| seasonal_interest | fruit | 7 |
| seasonal_interest | months | 14 |
| soil_type | mapped | 16 |
| texture | mapped | 1 |
| time_to_intended_size | age_band | 3 |
| toxicity | humans | 2 |
| toxicity | pets | 3 |
| water_drainage | mapped | 7 |

Categorical labels mapped to ontology ids: **143**. Unmapped: **0** (listed below, left as plain strings in `value`, visible to the validator as errors until a node is added or the value is corrected). New nodes needed by the mapper itself: **0**.

## Unmapped values (knowledge-base gaps, kept visible)

- none

## Conditions parsed from context

- `exposure:full_sun` · 1 claims
- `soil:rocky_or_gravelly_or_dry` · 1 claims
- `exposure:shade` · 1 claims
- `soil:humus_rich` · 1 claims

## Time concepts

- `age:established` · 4
- `age:young` · 1

## Place per claim

- `place:uk` · 38
- `place:pnw` · 23
- `place:willamette_valley` · 23
- `place:north_america` · 18
- `place:city_of_vancouver` · 17
- `place:vancouver` · 14
- `place:global` · 11
- `place:st_louis` · 11
- `place:bc` · 10

## Cultivars lifted from context

- Osakazuki · 16
- Bloodgood · 6
- (unrecorded) · 3
- Koto No Ito · 2

## Not mapped by design
- Qualitative claims (free text: `long_term_performance`, `behaviour_with_others`, `vancouver_context` prose) carry no `value` concept; they keep place / time / conditions only.
- `local_mature_size` in cm DBH (trunk diameter) has no ordinal class in the ontology; the numbers stay as they are.
- Hardiness is not converted between Canadian, USDA and RHS scales (schema note); each scale is its own facet.
- The USDA 'maximum at 20 years' figure is inside `raw` text and is not read.

