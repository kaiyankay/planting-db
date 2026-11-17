# V4.1 · Light-gate audit (2026-11-16)

Branch `feature/platform-v4-1-refinement`. Scope: `AGENT_PROMPT_V4_1.md` §6, second item. Read-only audit: **no code, data or claim was changed.**
Snapshot: `brain/data/explorer.json` (generated 2026-11-13, schema 0.4.3). Gate: `design/js/knowledge.js` `gate()` lines 105–124, vocabulary map line 7, `SHADIER` line 16; bed conditions: `design/js/engine.js` `bedConditions()` line 148.
Method: the gate was replicated over the snapshot in Python, then the real engine (`E.bedConditions`, `E.assemble`, `K.gate`) was run in headless Chrome on `designs/demo-a.json` for each light setting. Both agree on every cell.

## Finding

V4's observation is reproduced: in the three open beds of the reference garden, a stated light of full sun, part shade or shade gives **light: pass for all ten species**; in the Tree island (100 % under the tree's canopy) it gives **conditional for all ten**; with light unknown it gives **unknown for all ten**.

The control does reach the gate (cause d is ruled out), and no species lacks an exposure cell (cause c is ruled out — a missing cell would read `not recorded`, never pass). The result follows from two rules as written, applied to the claims as recorded:

1. **Any-claim, any-source match (b).** The gate reads the union of every label any live claim records for the species and passes if one label matches. It does not count sources, weigh disagreement, read the AI check, or separate cultivar- or variety-scoped claims. One claim is enough.
2. **Site "shade" accepts part shade (a).** The Studio offers three values. The map is:
   `full-sun → Full sun` · `part-shade → Part sun/part shade, Filtered shade` · `shade → Deep shade, Filtered shade, Part sun/part shade`.
   All ten species have at least one claim recording *Part sun/part shade*, so all ten pass "shade". Only three record *Deep shade* (salal, sword fern, evergreen huckleberry).

All ten also have at least one claim recording *Full sun*, so all ten pass full sun under rule 1.

Whether these two rules are right is a horticultural and method judgement, not a code defect; nothing was changed. See "For Kay to decide".

## Matrix — result · claims that produce it

Claim ids are `<species-slug>:exposure:<id>`. Open bed, light stated by the user. ("assumed"/"inferred" light gives `conditional` in place of `pass`; unknown light gives `unknown`.)

| species | full-sun | part-shade | shade | any stated light, bed ≥ 50 % under a canopy |
|---|---|---|---|---|
| *Acer palmatum* | pass · gpp01, mobot01, osu01, rhs01 | pass · gpp01, mobot01, osu01, rhs01 | pass · gpp01, mobot01, osu01, rhs01 | conditional |
| *Achillea millefolium* | pass · eflora01, mobot01, rhs01, usdaplants01 | pass · eflora01, usdaplants01 | pass · eflora01, usdaplants01 | conditional |
| *Arctostaphylos uva-ursi* | pass · eflora01, mobot01, osu01, rhs01, usdaplants01 | pass · eflora01, mobot01, osu01, rhs01, usdaplants01 | pass · eflora01, mobot01, osu01, rhs01, usdaplants01 | conditional |
| *Cercidiphyllum japonicum* | pass · gpp01, mobot01, osu01, rhs01 | pass · gpp01, mobot01, osu01, rhs01 | pass · gpp01, mobot01, osu01, rhs01 | conditional |
| *Cornus nuttallii* | pass · mobot01, rhs01, usdaplants01 | pass · eflora01, mobot01, osu01, rhs01 | pass · eflora01, mobot01, osu01, rhs01 | conditional |
| *Cornus sericea* | pass · eflora01, gpp01, mobot01, osu01, rhs01 | pass · eflora01, gpp01, mobot01, osu01, rhs01, usdaplants01 | pass · eflora01, gpp01, mobot01, osu01, rhs01, usdaplants01 | conditional |
| *Gaillardia aristata* | pass · eflora01, mobot01, rhs01 | pass · usdaplants01 | pass · usdaplants01 | conditional |
| *Gaultheria shallon* | pass · osu01, usdaplants01 | pass · eflora01, osu01, rhs01 | pass · eflora01, osu01, rhs01 | conditional |
| *Polystichum munitum* | pass · gpp02, osu02, usdaplants01 | pass · eflora01, gpp01, osu01, rhs01 | pass · eflora01, gpp01, osu01, rhs01 | conditional |
| *Vaccinium ovatum* | pass · gpp01, osu01, rhs01, usdaplants01 | pass · 01, gpp01, osu01, rhs01 | pass · 01, gpp01, osu01, rhs01 | conditional |

Engine run on the reference garden (`designs/demo-a.json`, four beds):

| site light | North, East, West bed (open) | Tree island (canopy share 1.0) |
|---|---|---|
| unknown | unknown × 10 | unknown × 10 |
| full-sun, stated | pass × 10 | conditional × 10 |
| part-shade, stated | pass × 10 | conditional × 10 |
| shade, stated | pass × 10 | conditional × 10 |
| shade, assumed | conditional × 10 | conditional × 10 |

In the reference garden water and soil are unknown, so the overall site gate stays `unknown` (never `pass`) in the open beds whatever the light. The 3–4 species excluded per bed are excluded for other reasons (no gate reads `fail`), not by light.

## Where the passes are thin

These are observations from the records, not corrections.

- **Gaillardia aristata, part-shade and shade:** one claim, `usdaplants01` ("shade tolerance high", AI check: partially supported). The other three sources record full sun only.
- **Achillea millefolium and Arctostaphylos uva-ursi, shade:** pass only through *Part sun/part shade*; neither records filtered or deep shade.
- **Polystichum munitum, full sun:** `osu02` is about var. *imbricans*; `gpp02` is "full sun only if soil kept moist" (label matched because it contains "Full sun"; its condition is not read by the gate); `usdaplants01` carries the AI check `conflicting_evidence`. Three other sources record shade.
- **Gaultheria shallon, full sun:** `osu01` and `usdaplants01` (two of four sources).
- **Acer palmatum, filtered shade:** only `gpp01`, which is scoped to cultivar 'Osakazuki'.
- Verification: 47 of the 48 exposure claims are unverified; `vaccinium-ovatum:exposure:01` (survey) is the one human-verified claim.

## What other readings would give (arithmetic only, not proposals to adopt)

Counts are sources recording each label. The last three columns show the result under a different rule, to make the size of the choice visible.

| species | sources | Full sun | Part sun/part shade | Filtered shade | Deep shade | shade = Deep or Filtered | shade = Deep only | full-sun needs > half of sources |
|---|---|---|---|---|---|---|---|---|
| *Acer palmatum* | 4 | 4 | 4 | 1 | 0 | pass | **fail** | pass |
| *Achillea millefolium* | 4 | 4 | 2 | 0 | 0 | **fail** | **fail** | pass |
| *Arctostaphylos uva-ursi* | 5 | 5 | 5 | 0 | 0 | **fail** | **fail** | pass |
| *Cercidiphyllum japonicum* | 4 | 4 | 4 | 1 | 0 | pass | **fail** | pass |
| *Cornus nuttallii* | 5 | 3 | 4 | 1 | 0 | pass | **fail** | pass |
| *Cornus sericea* | 6 | 5 | 6 | 3 | 0 | pass | **fail** | pass |
| *Gaillardia aristata* | 4 | 3 | 1 | 1 | 0 | pass | **fail** | pass |
| *Gaultheria shallon* | 4 | 2 | 3 | 1 | 2 | pass | pass | **fail** |
| *Polystichum munitum* | 5 | 2 | 4 | 2 | 3 | pass | pass | **fail** |
| *Vaccinium ovatum* | 5 | 4 | 4 | 2 | 1 | pass | pass | pass |

## Two smaller things noticed

- **The canopy "one step shadier" check cannot discriminate between part-shade and shade.** `SHADIER` moves part-shade → shade, but the shade map already contains the part-shade labels, so every species that passes part-shade also "tolerates the shadier case". The outcome is still `conditional` (never pass), so no result is wrong today, but the step only has an effect from full-sun. It would start to matter if the shade map were narrowed.
- **Design test A4 cannot fail.** `design/js/tests.js` line 12 ("gate fail when the plant records no matching light", *Gaillardia* in shade) accepts `fail || pass`. It was presumably written when *Gaillardia* failed shade; the USDA claim now makes it pass. Left as is: tightening it needs the decision below.

## Per-species trace: source → claim → recorded values

Human status and AI check are separate fields; the gate reads neither.

**Acer palmatum** (`acer-palmatum:exposure:…`, cell verification: unverified)

| claim | source | recorded values | human status | AI check (separate) | scope | source text as recorded |
|---|---|---|---|---|---|---|
| `gpp01` | gpp | full_sun, part_sun_part_shade, filtered_shade | unverified | partially_supported | cultivar Osakazuki | Great Plant Picks: full sun or light to open shade; best autumn colour in full sun to open shade. |
| `mobot01` | mobot | full_sun, part_sun_part_shade, sheltered | unverified | supported_by_source | species | Missouri Botanical Garden: full sun to part shade, afternoon shade in hot regions, sited away from strong winds. |
| `osu01` | osu | full_sun, part_sun_part_shade, sheltered | unverified | supported_by_source | species | Oregon State University: sun to part shade; needs wind protection. |
| `rhs01` | rhs | full_sun, part_sun_part_shade, sheltered | unverified | supported_by_source | species | RHS: full sun or partial shade, sheltered position (west-, east- or south-facing). |

**Achillea millefolium** (`achillea-millefolium:exposure:…`, cell verification: unverified)

| claim | source | recorded values | human status | AI check (separate) | scope | source text as recorded |
|---|---|---|---|---|---|---|
| `eflora01` | eflora | full_sun, part_sun_part_shade | unverified | partially_supported | species | E-Flora BC habitat records are open sites — bluffs, meadows, grasslands, rocky slopes and open forests. |
| `mobot01` | mobot | full_sun | unverified | supported_by_source | species | Missouri Botanical Garden: full sun. |
| `rhs01` | rhs | full_sun, sheltered | unverified | partially_supported | species | RHS: full sun; exposed or sheltered sites; any aspect. |
| `usdaplants01` | usda_plants | full_sun, part_sun_part_shade | unverified | partially_supported | species | USDA PLANTS rates shade tolerance medium. |

**Arctostaphylos uva-ursi** (`arctostaphylos-uva-ursi:exposure:…`, cell verification: unverified)

| claim | source | recorded values | human status | AI check (separate) | scope | source text as recorded |
|---|---|---|---|---|---|---|
| `eflora01` | eflora | full_sun, part_sun_part_shade | unverified | partially_supported | species | E-Flora BC habitat records are exposed, often rocky sites and dry, open-canopy forest. |
| `mobot01` | mobot | full_sun, part_sun_part_shade | unverified | supported_by_source | species | Missouri Botanical Garden: full sun to part shade; tolerates light shade; likes exposed open sites. |
| `osu01` | osu | full_sun, part_sun_part_shade | unverified | supported_by_source | species | Oregon State University: sun or partial shade. |
| `rhs01` | rhs | full_sun, part_sun_part_shade, sheltered | unverified | partially_supported | species | RHS: full sun or partial shade; exposed or sheltered sites; south-, east- or west-facing. |
| `usdaplants01` | usda_plants | full_sun, part_sun_part_shade | unverified | partially_supported | species | USDA PLANTS rates shade tolerance medium. |

**Cercidiphyllum japonicum** (`cercidiphyllum-japonicum:exposure:…`, cell verification: unverified)

| claim | source | recorded values | human status | AI check (separate) | scope | source text as recorded |
|---|---|---|---|---|---|---|
| `gpp01` | gpp | full_sun, part_sun_part_shade, filtered_shade | unverified | partially_supported | species | Great Plant Picks: full sun or light to open shade; protection from hot afternoon sun where summers are hot. |
| `mobot01` | mobot | full_sun, part_sun_part_shade, sheltered | unverified | supported_by_source | species | Missouri Botanical Garden: full sun to part shade; best sited with protection from strong winds and hot afternoon sun. |
| `osu01` | osu | full_sun, part_sun_part_shade | unverified | supported_by_source | species | Oregon State University: sun, but probably best in light shade. |
| `rhs01` | rhs | full_sun, part_sun_part_shade, sheltered | unverified | supported_by_source | species | RHS: full sun or partial shade, any aspect, sheltered position. |

**Cornus nuttallii** (`cornus-nuttallii:exposure:…`, cell verification: unverified)

| claim | source | recorded values | human status | AI check (separate) | scope | source text as recorded |
|---|---|---|---|---|---|---|
| `eflora01` | eflora | part_sun_part_shade, filtered_shade | unverified | partially_supported | species | E-Flora BC habitat records place the species in the shrub layer of mixed and coniferous forests, on water-shedding slopes and in disturbed, young-seral communities. |
| `mobot01` | mobot | full_sun, part_sun_part_shade | unverified | supported_by_source | species | Missouri Botanical Garden: full sun to part shade; prefers part shade with cool, mulched roots. |
| `osu01` | osu | part_sun_part_shade | unverified | supported_by_source | species | Oregon State University: part shade; bark damaged by hot sun. |
| `rhs01` | rhs | full_sun, part_sun_part_shade, sheltered | unverified | partially_supported | species | RHS: full sun or partial shade; south- or west-facing aspect; exposed or sheltered sites. |
| `usdaplants01` | usda_plants | full_sun | unverified | partially_supported | species | USDA PLANTS rates shade tolerance low. |

**Cornus sericea** (`cornus-sericea:exposure:…`, cell verification: unverified)

| claim | source | recorded values | human status | AI check (separate) | scope | source text as recorded |
|---|---|---|---|---|---|---|
| `eflora01` | eflora | full_sun, part_sun_part_shade, filtered_shade | unverified | partially_supported | species | E-Flora BC habitat records span open streamsides, swamps and clearings as well as forest; the ecology note calls it shade-tolerant to shade-intolerant. |
| `gpp01` | gpp | full_sun, part_sun_part_shade, filtered_shade | unverified | supported_by_source | cultivar Baileyi | Great Plant Picks: full sun or light to dappled shade; a sunnier site gives brighter winter stems. |
| `mobot01` | mobot | full_sun, part_sun_part_shade | unverified | supported_by_source | species | Missouri Botanical Garden: full sun to part shade. |
| `osu01` | osu | full_sun, part_sun_part_shade | unverified | supported_by_source | species | Oregon State University: sun to part shade. |
| `rhs01` | rhs | full_sun, part_sun_part_shade, sheltered | unverified | supported_by_source | species | RHS: full sun or partial shade; exposed or sheltered sites; any aspect. |
| `usdaplants01` | usda_plants | part_sun_part_shade, filtered_shade | unverified | partially_supported | species | USDA PLANTS rates shade tolerance high. |

**Gaillardia aristata** (`gaillardia-aristata:exposure:…`, cell verification: unverified)

| claim | source | recorded values | human status | AI check (separate) | scope | source text as recorded |
|---|---|---|---|---|---|---|
| `eflora01` | eflora | full_sun | unverified | partially_supported | species | E-Flora BC habitat records are dry grasslands and shrublands, open steppe and sand bars. |
| `mobot01` | mobot | full_sun | unverified | supported_by_source | species | Missouri Botanical Garden: full sun. |
| `rhs01` | rhs | full_sun, sheltered | unverified | partially_supported | species | RHS: full sun; south- or west-facing; exposed or sheltered sites. |
| `usdaplants01` | usda_plants | part_sun_part_shade, filtered_shade | unverified | partially_supported | species | USDA PLANTS rates shade tolerance high. |

**Gaultheria shallon** (`gaultheria-shallon:exposure:…`, cell verification: unverified)

| claim | source | recorded values | human status | AI check (separate) | scope | source text as recorded |
|---|---|---|---|---|---|---|
| `eflora01` | eflora | filtered_shade, deep_shade, part_sun_part_shade | unverified | partially_supported | species | E-Flora BC habitat records include shaded understory and open-canopy coniferous forest. |
| `osu01` | osu | full_sun, part_sun_part_shade | unverified | supported_by_source | species | Oregon State University: sun or part shade. |
| `rhs01` | rhs | deep_shade, part_sun_part_shade, sheltered | unverified | supported_by_source | species | RHS: full or partial shade; exposed or sheltered sites; any aspect. |
| `usdaplants01` | usda_plants | full_sun | unverified | partially_supported | species | USDA PLANTS rates shade tolerance low. |

**Polystichum munitum** (`polystichum-munitum:exposure:…`, cell verification: unverified)

| claim | source | recorded values | human status | AI check (separate) | scope | source text as recorded |
|---|---|---|---|---|---|---|
| `eflora01` | eflora | filtered_shade, part_sun_part_shade | unverified | partially_supported | species | E-Flora BC habitat is moist to mesic forest. |
| `gpp01` | gpp | part_sun_part_shade, filtered_shade, deep_shade | unverified | supported_by_source | species | Great Plant Picks: light to deep shade is best. |
| `gpp02` | gpp | full_sun_only_if_soil_kept_moist | unverified | supported_by_source | species | Great Plant Picks: grows in full sun if watered regularly in summer. |
| `osu01` | osu | part_sun_part_shade, deep_shade | unverified | partially_supported | species | Oregon State University: part shade to shade. |
| `osu02` | osu | full_sun | unverified | supported_by_source | species | Oregon State University: the compact sun form, var. imbricans, prefers full sun. |
| `rhs01` | rhs | deep_shade, part_sun_part_shade, sheltered | unverified | partially_supported | species | RHS: full or partial shade; exposed or sheltered sites; north, east or west aspect. |
| `usdaplants01` | usda_plants | full_sun | unverified | conflicting_evidence | species | USDA PLANTS rates shade tolerance low. |

**Vaccinium ovatum** (`vaccinium-ovatum:exposure:…`, cell verification: verified)

| claim | source | recorded values | human status | AI check (separate) | scope | source text as recorded |
|---|---|---|---|---|---|---|
| `01` | survey-r03 | part_sun_part_shade, filtered_shade | verified | not_assessed | species | Vaccinium ovatum tolerates shade better than English boxwood, per a designer's project experience. |
| `gpp01` | gpp | full_sun, part_sun_part_shade, filtered_shade, deep_shade | unverified | supported_by_source | species | Great Plant Picks: full sun to deep shade; flowering and fruiting may stop in deep shade. |
| `osu01` | osu | full_sun, part_sun_part_shade | unverified | supported_by_source | species | Oregon State University: sun to part shade. |
| `rhs01` | rhs | full_sun, part_sun_part_shade, sheltered | unverified | supported_by_source | species | RHS: full sun or partial shade, sheltered. |
| `usdaplants01` | usda_plants | full_sun | unverified | partially_supported | species | USDA PLANTS rates shade tolerance low. |

## For Kay to decide (agent proposals, none applied)

1. Should site "shade" keep accepting *Part sun/part shade*, or mean *Deep shade* / *Filtered shade* only? This changes 2 or 7 of 10 species (table above).
2. Should a pass that rests on one source against several, on a cultivar- or variety-scoped claim, or on a claim with a stated condition be shown as `conditional` rather than `pass`?
3. Independently of 1 and 2, the interface could say what the pass means: "at least one source records this light" with the count of sources for and against, instead of a bare pass. This is a wording change, not a rule change.
4. If 1 is narrowed, the canopy step and test A4 should be revisited together.
