#!/usr/bin/env python3
"""
Build ontology.json — the concept nodes of the knowledge base (brief 2026-10-31, Part 1).

  python3 -I tools/build_ontology.py            # writes ontology.json, prints counts by dimension

Every node: id "<facet>:<slug>", dimension, facet, label, one-sentence definition, aliases (incl. the
intent words users typed in survey e1/e2), source_of_term, optional parent / order / bounds.
Labels borrowed from KPU are kept verbatim (interoperability). Definitions are written for this file
(methods M26); where a term has a published definition the source is named in source_of_term.
Standard library only. Nothing else is written.
"""
import json, os, re
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA = json.load(open(os.path.join(ROOT, "schema.json"), encoding="utf-8"))
INTENT = json.load(open(os.path.join(ROOT, "intent_map.json"), encoding="utf-8"))
V = SCHEMA["vocab"]
TODAY = date.today().isoformat()


def slug(label):
    s = label.lower().strip()
    s = s.replace("<", "lt").replace(">", "gt").replace("≥", "ge").replace("≤", "le")
    if re.search(r"\d\s*-\s*\d", s): s = re.sub(r"\s*-\s*", "-", s)      # numeric range: keep the hyphen
    else: s = s.replace("-", "_")
    s = re.sub(r"[^a-z0-9.\-]+", "_", s).strip("_")
    return s


NODES = []
SEEN = set()


def node(facet, dimension, label, definition, *, aliases=(), source="kpu", parent=None, order=None, id=None, **extra):
    nid = id or f"{facet}:{slug(label)}"
    if nid in SEEN:
        raise SystemExit(f"duplicate node id {nid}")
    SEEN.add(nid)
    n = {"id": nid, "dimension": dimension, "facet": facet, "label": label, "definition": definition,
         "aliases": sorted({a for a in aliases if a and a.lower() != label.lower()}), "source_of_term": source}
    if parent: n["parent"] = parent
    if order is not None: n["order"] = order
    n.update(extra)
    NODES.append(n)
    return nid


def bin_bounds(label, unit="m"):
    """'0.4 - 0.7m' -> (0.4, 0.7); '< 0.1m' -> (0, 0.1); '> 30m' -> (30, inf)"""
    t = label.replace(unit, "").strip()
    if t.startswith("<"): return 0.0, float(t[1:])
    if t.startswith(">"): return float(t[1:]), None
    lo, hi = [float(x) for x in re.split(r"\s*-\s*", t)]
    return lo, hi


# ============================================================ condition
# exposure (KPU verbatim) with three shallow groups
node("exposure", "condition", "Sun", "Sites that receive six or more hours of direct sun in summer.", aliases=["sunny", "full-sun sites", "open site"], source="ontology (group)", id="exposure:sun")
node("exposure", "condition", "Shade", "Sites with little or no direct sun: filtered light under a canopy or deep shade on the north side of buildings and under dense trees.", aliases=["shade-tolerant", "shady", "north-facing", "north side", "under canopy", "荫蔽", "耐阴"], source="ontology (group); intent_map 'shade-tolerant'", id="exposure:shade")
node("exposure", "condition", "Part shade", "Sites with roughly three to six hours of direct sun, or sun for only part of the day.", aliases=["semi-shade", "half shade", "半阴"], source="ontology (group)", id="exposure:part_shade")
EXPOSURE = {
    "Full sun": ("Six or more hours of direct sun in summer; no overhead canopy.", "exposure:sun", 1, ["full-sun", "sunny spot", "全日照"]),
    "Full sun only if soil kept moist": ("Takes full sun only where the soil does not dry out; in dry sun it scorches or stalls.", "exposure:sun", 2, []),
    "Part sun/part shade": ("Three to six hours of direct sun, or dappled light for much of the day.", "exposure:part_shade", 3, ["part shade", "part sun", "partial shade", "semi-shade"]),
    "Filtered shade": ("Light reaching the plant through a tree canopy or lattice all day; bright but never direct for long.", "exposure:shade", 4, ["dappled shade", "light shade", "under trees"]),
    "Deep shade": ("Less than about two hours of direct sun; under dense canopy or on the north side of buildings.", "exposure:shade", 5, ["full shade", "heavy shade", "dense shade", "north-facing"]),
    "Sheltered": ("A position protected from strong or cold wind, for example near a wall or inside a planting.", None, None, ["protected site", "wind-sheltered"]),
}
for lab, (d, par, o, al) in EXPOSURE.items():
    node("exposure", "condition", lab, d, aliases=al, parent=par, order=o)

# soil (KPU verbatim) + the two condition words the OSU contexts use
SOIL = {
    "Acidic": ("Soil with pH below about 6.5, typical of coastal BC under conifers.", ["acid soil", "ericaceous", "low pH"]),
    "Alkaline": ("Soil with pH above about 7.5, usually over limestone or where lime has been added.", ["chalky", "limy", "high pH"]),
    "Bog": ("Permanently wet, peaty, acidic ground with standing water close to the surface.", ["peat bog", "waterlogged peat"]),
    "Humus rich": ("Dark soil high in decomposed organic matter; holds moisture and nutrients well.", ["rich soil", "good soil", "woodland soil", "organic soil", "fertile"]),
    "Rocky or gravelly or dry": ("Thin, stony or sandy ground that drains fast and holds little water or nutrient.", ["poor soil", "thin soil", "gravel", "sandy", "stony", "dry soil"]),
    "Well-drained": ("Soil through which water passes freely, so roots are never left standing in water.", ["free-draining", "good drainage"]),
}
for lab, (d, al) in SOIL.items():
    node("soil", "condition", lab, d, aliases=al)

# water (schema enum)
WATER = {"dry": ("Little available soil moisture for long periods; relies on rain or drought tolerance.", 1, ["drought", "xeric", "dry site"]),
         "average": ("Ordinary garden moisture: rain plus occasional watering, neither dry nor wet for long.", 2, ["normal moisture", "mesic"]),
         "moist": ("Soil that stays damp but not waterlogged, such as a shaded bed or a slope base.", 3, ["damp", "evenly moist"]),
         "wet": ("Soil often saturated: pond margins, ditches, poorly drained low ground.", 4, ["waterlogged", "soggy", "pond edge"]),
         "wide_range": ("Tolerates anything from dry to wet once established.", 5, ["adaptable moisture", "any moisture"])}
for lab, (d, o, al) in WATER.items():
    node("water", "condition", lab.replace("_", " "), d, aliases=al, source="schema.json water_drainage", order=o, id=f"water:{lab}")

# hardiness: Canadian zones (KPU), USDA and RHS kept as separate facets — never converted silently (schema note)
for i, z in enumerate(V["kpu_hardiness"], 1):
    node("hardiness", "condition", z, f"Canadian plant hardiness {z} (planthardiness.gc.ca); Vancouver sits in 8a–8b, so a plant hardy to {z} {'is safe here' if i <= 8 else 'may need a mild microclimate here'}.", aliases=[f"Canadian {z.lower()}"], order=i, source="kpu (Canadian zones)")
for z in range(1, 12):
    node("hardiness_usda", "condition", f"USDA zone {z}", f"USDA cold-hardiness zone {z}; Vancouver is roughly USDA 8, so plants rated to zone {z} {'survive Vancouver winters' if z <= 8 else 'are marginal in Vancouver'}.", aliases=[f"zone {z} (USDA)"], order=z, source="USDA PLANTS / US sources", id=f"hardiness_usda:z{z}")
RHS_H = {"H1a": "heated glasshouse", "H1b": "heated glasshouse", "H1c": "heated glasshouse", "H2": "tender, to 1 °C", "H3": "half-hardy, to −5 °C", "H4": "hardy through most UK winters, to −10 °C", "H5": "hardy in cold winters, to −15 °C", "H6": "very hardy, to −20 °C", "H7": "hardiest, below −20 °C"}
for i, (h, d) in enumerate(RHS_H.items(), 1):
    node("hardiness_rhs", "condition", f"RHS {h}", f"Royal Horticultural Society hardiness rating {h}: {d}; H4 and above cover Vancouver's winter lows.", order=i, source="RHS", id=f"hardiness_rhs:{h}")
node("wind", "condition", "Exposed", "Open to strong or cold wind with no shelter from buildings or other plants.", aliases=["windy site", "exposed site"], source="RHS wording")

# ============================================================ classification: growth form (an organising layer above the KPU plant type, which mixes life form and leaf habit)
GF = [("tree", "Tree", "A woody plant usually with a single trunk, reaching well above head height at maturity.", ["trees", "small tree", "medium tree"]),
      ("shrub", "Shrub", "A woody plant branching from or near the ground, usually under 5 m; includes sub-shrubs and woody ground covers.", ["shrubs", "sub-shrub", "subshrub", "bush", "woody ground cover"]),
      ("graminoid", "Graminoid", "Grasses, sedges and rushes: narrow-leaved plants of the order Poales, including bamboo.", ["grass", "grasses", "sedge", "rush", "bamboo", "grass-like"]),
      ("herbaceous_perennial", "Herbaceous perennial", "A non-woody plant that dies back and returns each year.", ["perennial herb", "forb"]),
      ("fern", "Fern", "A spore-bearing plant with fronds, no flowers.", ["ferns"]),
      ("vine", "Vine or climber", "A plant that climbs or scrambles on a support rather than standing alone.", ["climber", "vine", "liana"])]
for i, (k, lab, d, al) in enumerate(GF, 1):
    node("growth_form", "classification", lab, d, aliases=al, order=i, source="ontology (organising layer, M29); words taken from source descriptions", id=f"growth_form:{k}")

# ============================================================ trait
node("evergreen", "trait", "Evergreen", "Keeps its leaves through winter, so it reads the same all year.", aliases=["year-round", "stays green", "常绿"], source="schema seasonal_interest.evergreen; intent_map 'evergreen'", id="evergreen:yes")
node("evergreen", "trait", "Deciduous", "Drops its leaves in autumn and stands bare in winter.", aliases=["loses leaves", "落叶"], source="schema seasonal_interest.evergreen=false", id="evergreen:no")
node("evergreen", "trait", "Semi-evergreen", "Keeps some leaves through a mild winter and drops them in a cold one.", source="kpu plant type", id="evergreen:semi")

for i, b in enumerate(V["kpu_height_bins"], 1):
    lo, hi = bin_bounds(b)
    node("height_class", "trait", b, f"Mature height class {b}: the plant's usual full height falls between {lo} m and {hi if hi is not None else 'over 30'} m.", order=i, source="kpu height bins", min_m=lo, max_m=hi)
for i, b in enumerate(V["kpu_spread_bins"], 1):
    lo, hi = bin_bounds(b)
    node("spread_class", "trait", b, f"Mature spread class {b}: the plant's usual full width falls between {lo} m and {hi if hi is not None else 'over 25'} m.", order=i, source="kpu spread bins", min_m=lo, max_m=hi)
for i, (g, d) in enumerate({"slow": "Adds little each year; takes many years to reach its mature size.", "moderate": "Reaches mature size in a normal span of years for its type.", "fast": "Gains height or spread quickly; may need room or restraint early."}.items(), 1):
    node("growth_rate", "trait", g, d, aliases={"slow": ["slow-growing"], "moderate": ["medium growth"], "fast": ["fast-growing", "vigorous", "quick"]}[g], order=i, source="schema growth_rate", id=f"growth_rate:{g}")
for c in V["kpu_colour"]:
    node("colour", "trait", c, f"{c} as a flower, foliage or fruit colour in the KPU colour list.", source="kpu colour")
for i, t in enumerate(V["kpu_texture"], 1):
    node("texture", "trait", t, f"Visual texture '{t}': how coarse or fine the leaves and branching read from a distance.", order=i, source="kpu texture")
FORM_D = {"Climbing": "Grows upward on a support rather than standing on its own.", "Columnar": "Much taller than wide, with near-vertical sides.", "Creeping / Mat-like": "Spreads along the ground, staying low.", "Irregular": "No regular outline; asymmetric or picturesque.", "Mounded": "A low, rounded dome wider than tall.", "Oval - horizontal": "An oval outline wider than it is tall.", "Oval - vertical": "An oval outline taller than it is wide.", "Pyramidal - narrowly": "A slim cone, narrow at the top.", "Pyramidal - widely": "A broad cone, wide at the base.", "Round": "About as tall as wide, with a rounded crown.", "Vase": "Narrow at the base and spreading at the top.", "Weeping": "Branches hang downward."}
for f, d in FORM_D.items():
    node("form", "trait", f, f"Overall form: {d}", source="kpu form")
HABIT_D = {"Arching": "Branches rise then bend over in arcs.", "Dense": "Closely branched with little open space.", "Epiphytic": "Grows on another plant without taking nourishment from it.", "Fastigiate": "Branches held close to the trunk, pointing up.", "Horizontal": "Branches held level, in layers.", "Irregular": "No consistent branching pattern.", "Open": "Widely spaced branches you can see through.", "Pendulous": "Branch tips hang down.", "Spreading": "Branches extend outward, wider than tall.", "Stiffly upright": "Rigid, vertical branches.", "Twiggy": "Many fine, short branches.", "Upright": "Grows mainly upward."}
for h, d in HABIT_D.items():
    node("habit", "trait", h, f"Branching habit: {d}", source="kpu habit")
PT_D = {"Annual (true)": "Completes its life in one season.", "Annual (grown as)": "A tender perennial treated as an annual here.", "Aquatic plant": "Lives in or on water.", "Bamboo": "A woody grass.", "Biennial": "Leaves in year one, flowers and dies in year two.", "Broadleaf evergreen": "A woody plant with broad leaves kept through winter.", "Conifer": "A cone-bearing, usually needle-leaved woody plant.", "Fern": "A spore-bearing plant with fronds.", "Ground cover": "A low plant used to carpet the ground.", "Herbaceous perennial": "Dies back to the ground each winter and returns.", "Invasive plant": "Listed as invasive in the region.", "Poales (grass-like)": "Grasses, sedges and rushes.", "Semi-evergreen": "Keeps part of its foliage through a mild winter.", "Shrub - deciduous": "A multi-stemmed woody plant that drops its leaves.", "Succulent or Cacti": "Stores water in thick leaves or stems.", "Tree - deciduous": "A single-trunked woody plant that drops its leaves.", "Vine - deciduous": "A climbing plant that drops its leaves.", "Vine or climber": "A plant that climbs or scrambles.", "Weed (horticultural)": "A plant usually unwanted in gardens."}
for p, d in PT_D.items():
    node("plant_type", "trait", p, f"KPU plant type '{p}': {d}", aliases=(["perennial", "comes back every year"] if p in ("Herbaceous perennial", "Broadleaf evergreen", "Shrub - deciduous", "Tree - deciduous", "Conifer", "Fern") else []), source="kpu plant type")
node("interest", "trait", "Fall colour", "Leaves turn a notable colour in autumn before dropping.", aliases=["fall color", "autumn colour", "autumn color"], source="schema seasonal_interest.fall_colour; intent_map 'seasonal interest'")
node("interest", "trait", "Winter interest", "Something to look at in winter: bark, berries, structure or evergreen leaves.", source="schema seasonal_interest.winter_interest; kpu use 'Winter interest'")
node("interest", "trait", "Seasonal interest", "A plant that changes visibly through the year rather than looking the same in every month.", aliases=["aesthetic", "pretty", "beautiful", "ornamental", "spring interest", "flowers"], source="intent_map 'seasonal interest' / 'aesthetic'")
node("fruit", "trait", "Edible fruit", "Produces fruit people can eat.", aliases=["edible", "food", "fruit you can eat", "berries you can eat"], source="claims seasonal_interest.fruit; intent_map 'edible'", id="fruit:edible")
node("fruit", "trait", "Showy fruit", "Produces fruit noticed for its colour or persistence rather than for eating.", aliases=["berries", "ornamental fruit"], source="claims seasonal_interest.fruit", id="fruit:showy")
for i, (m, d, al) in enumerate([("low", "Needs little pruning, feeding or clean-up once established.", ["low maintenance", "less maintenance", "easy to grow", "easy care", "low care"]), ("medium", "Needs some seasonal attention: shaping, feeding or leaf clean-up.", []), ("high", "Needs regular work to look its best or stay healthy.", ["high maintenance", "fussy"])], 1):
    node("maintenance", "trait", m, d, aliases=al, order=i, source="schema maintenance_level; intent_map 'low maintenance'", id=f"maintenance:{m}")
for i, (t, d) in enumerate([("none", "No part of the plant is recorded as toxic."), ("mild", "Can cause mild stomach upset or skin irritation."), ("moderate", "Can cause significant illness if eaten."), ("severe", "Can be life-threatening if eaten."), ("unknown", "No toxicity record was found in the sources checked.")], 1):
    node("toxicity", "trait", t, d, aliases=(["pet safe", "dog safe", "cat safe", "pet friendly", "non-toxic"] if t == "none" else ["poisonous", "toxic to pets"] if t in ("moderate", "severe") else []), order=i, source="schema toxicity; intent_map 'toxic to pets'", id=f"toxicity:{t}")
for p, d in {"long_day": "Flowers when days are long (late spring and summer).", "short_day": "Flowers when days are short (autumn, winter, early spring).", "day_neutral": "Flowering does not depend on day length."}.items():
    node("photoperiod", "trait", p.replace("_", " "), d, source="schema photoperiod (survey c4)", id=f"photoperiod:{p}")

# ============================================================ use (KPU landscape use, verbatim) + ecological functions
USE_D = {"Accent plant": "Placed to draw the eye at a doorway, corner or bed.", "Alpine": "Suited to rock gardens and troughs with sharp drainage.", "Aquatic - ponds": "Grows in or beside a pond.", "Arbors or trellis": "Trained over an arbor or up a trellis.", "Attract beneficial insects": "Flowers feed predatory or parasitic insects that control pests.", "Attract birds": "Fruit, seed or cover that brings birds.", "Attract butterflies": "Nectar or larval food for butterflies.", "Bedding plant": "Set out in quantity for seasonal colour.", "Container planting": "Grows well long-term in a pot or planter, including on roofs and balconies.", "Cut flower or foliage": "Stems cut for arrangements.", "Dried flower or fruit": "Flowers or fruit that keep when dried.", "Erosion control": "Roots hold soil on slopes and banks.", "Espalier": "Trained flat against a wall or wires.", "Fall interest": "At its best in autumn.", "Filler": "Fills gaps between feature plants.", "Floristry": "Grown for the florist trade.", "Forestry": "Grown for timber or forest planting.", "Fragrance": "Scented flowers or foliage.", "Golf green": "Turf for putting surfaces.", "Green roof technology": "Suited to shallow, exposed roof substrates; drought and wind tolerant.", "Green walls": "Grows in vertical planting systems.", "Ground cover": "Low and spreading, used to carpet soil and suppress weeds.", "Group or mass planting": "Best planted in numbers for effect.", "Hanging basket": "Trails from a suspended basket.", "Hedge row": "Planted in a line as an informal, unclipped hedge.", "Herb": "Used in cooking or for scent.", "Indoor plant": "Grown inside buildings.", "Lawn - sports field": "Turf grass for play.", "Medicinal plant": "Used in traditional or modern medicine.", "Mixed shrub border": "One of several shrubs in a mixed bed.", "Native planting": "Used in plantings of regionally native species.", "Perennial border": "Grown among herbaceous perennials.", "Reclamation": "Re-vegetates disturbed or degraded land.", "Rock garden": "Grows among rocks with sharp drainage.", "Screening": "Blocks a view or gives privacy.", "Security/barrier": "Thorny or dense enough to keep people out.", "Shade tree": "A tree planted for the shade it casts.", "Sheared hedge": "Takes regular clipping into a formal hedge.", "Small garden/space": "Fits a small residential garden or courtyard.", "Specimen plant": "Stands alone as a feature.", "Spring interest": "At its best in spring.", "Street (boulevard tree)": "Planted along streets between road and sidewalk.", "Summer interest": "At its best in summer.", "Tall background": "Forms the back layer of a planting.", "Topiary": "Clipped into shapes.", "Urban agriculture": "Grown for food in city settings.", "Waterside planting": "Grows at a stream or lake edge.", "Wetland - bogs": "Grows in wet, peaty ground.", "Wild flower garden": "Part of a meadow or wild-flower planting.", "Wildlife food": "Fruit, seed or foliage eaten by wildlife.", "Wind break": "Planted in a line to reduce wind.", "Winter interest": "At its best in winter.", "Woodland margin": "Grows at the edge of trees, in part shade."}
USE_AL = {"Ground cover": ["groundcover", "ground-cover", "carpet"], "Hedge row": ["hedge", "informal hedge"], "Sheared hedge": ["hedge", "formal hedge", "clipped hedge"], "Screening": ["screen", "privacy", "privacy screen"], "Small garden/space": ["house garden", "backyard", "home garden", "residential", "small garden"], "Green roof technology": ["roof garden", "rooftop", "green roof", "38th floor", "high-rise"], "Container planting": ["planter", "pot", "balcony"], "Attract birds": ["birds"], "Attract butterflies": ["butterflies"], "Attract beneficial insects": ["beneficial insects"], "Street (boulevard tree)": ["street tree", "boulevard tree"], "Native planting": ["native garden"], "Urban agriculture": ["food garden", "community garden"]}
node("use", "use", "Hedge or screen", "Planted in a line to divide, enclose or hide: an informal hedge row, a clipped hedge or a screen.", aliases=["hedge", "screen", "screening", "privacy"], source="ontology (group); intent_map 'hedge'", id="use:hedge")
for u in V["kpu_landscape_use"]:
    node("use", "use", u, f"Landscape use '{u}': {USE_D[u]}", aliases=USE_AL.get(u, []), source="kpu landscape use" + (" ; intent_map" if u in USE_AL else ""), parent=("use:hedge" if u in ("Hedge row", "Sheared hedge", "Screening") else None))
ECO = {"pollinator": ("Flowers feed bees and other pollinating insects.", ["pollinator friendly", "pollinator plants", "attracts pollinators", "bees"]), "bird_food": ("Fruit or seed eaten by birds.", ["bird food", "feeds birds"]), "wildlife_cover": ("Dense growth that shelters birds or small animals.", ["cover for wildlife", "shelter"]), "nitrogen_fixer": ("Roots host bacteria that add nitrogen to the soil.", ["nitrogen fixing"]), "erosion_control": ("Roots hold soil on slopes and banks.", ["holds soil"]), "habitat_structure": ("Adds a layer or structure other species live in.", ["habitat", "wildlife", "ecological value", "high ecological function"])}
for k, (d, al) in ECO.items():
    node("ecology", "use", k.replace("_", " "), d, aliases=al, source="schema ecological_value; intent_map", id=f"ecology:{k}")

# ============================================================ time
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
node("season", "time", "Spring", "March to May in Vancouver: leaf-out and most flowering.", aliases=["spring interest"], source="ontology", id="season:spring")
node("season", "time", "Summer", "June to August: growth, fruit set and the dry season.", source="ontology", id="season:summer")
node("season", "time", "Autumn", "September to November: fruit, fall colour, the rains return.", aliases=["fall", "autumn"], source="ontology", id="season:autumn")
node("season", "time", "Winter", "December to February: dormancy, evergreen structure, wet and mild.", aliases=["winter interest"], source="ontology", id="season:winter")
for i, m in enumerate(MONTHS, 1):
    season = "season:winter" if i in (12, 1, 2) else "season:spring" if i <= 5 else "season:summer" if i <= 8 else "season:autumn"
    node("month", "time", m, f"{m}, month {i}; used for flowering, fruiting and observation dates.", parent=season, order=i, source="claims seasonal_interest.*_months", id=f"month:{i}")
for i, (a, lab, d, al) in enumerate([("young", "Young plant", "In its first years after planting, before it reaches its character size (sources say 'in youth').", ["in youth", "juvenile", "newly planted"]), ("establishing", "Establishing", "Roughly five to ten years in: filling out, not yet full size.", ["after 5 years", "after 10 years"]), ("established", "Established", "Settled in and growing at full vigour; in the City of Vancouver inventory approximated by trunk diameter ≥ 20 cm (methods M2).", ["once established", "mature tree", "DBH ≥ 20 cm"]), ("mature", "Mature / 20+ years", "At or near its full size; USDA figures given 'at 20 years' map here.", ["at 20 years", "old specimen", "after 20 years"])], 1):
    node("age", "time", lab, d, aliases=al, order=i, source="claims context / time_to_intended_size / USDA", id=f"age:{a}")

# ============================================================ place
node("place", "place", "Global", "Sources or figures not tied to a region (for example RHS species profiles read as general).", source="sources.json geo_specificity", id="place:global")
node("place", "place", "United Kingdom", "UK growing conditions, the basis of RHS plant profiles: milder, wetter summers than Vancouver.", aliases=["UK", "RHS conditions"], parent="place:global", source="claims context 'UK growing conditions'", id="place:uk")
node("place", "place", "North America", "Continental sources such as USDA PLANTS, read as US-wide.", aliases=["US-wide", "United States", "USA"], parent="place:global", source="sources.json geo_specificity", id="place:north_america")
node("place", "place", "St. Louis, Missouri", "Missouri Botanical Garden's growing conditions: hot humid summers, cold winters.", aliases=["Missouri", "MOBOT conditions"], parent="place:north_america", source="claims context", id="place:st_louis")
node("place", "place", "Pacific Northwest", "Coastal Pacific Northwest from Oregon to BC: mild wet winters, dry summers.", aliases=["PNW", "maritime Pacific Northwest", "Cascadia"], parent="place:north_america", source="sources.json geo_specificity", id="place:pnw")
node("place", "place", "Willamette Valley, Oregon", "Oregon State University's reference region: similar climate to Vancouver, hotter summers.", aliases=["Oregon", "OSU conditions"], parent="place:pnw", source="claims context", id="place:willamette_valley")
node("place", "place", "British Columbia", "Province-level evidence such as E-Flora BC and ISCBC.", aliases=["BC", "western BC"], parent="place:pnw", source="sources.json geo_specificity", id="place:bc")
node("place", "place", "Metro Vancouver", "The region the database serves: City of Vancouver and its municipalities, Canadian hardiness 8a–8b.", aliases=["Vancouver", "Greater Vancouver", "Lower Mainland", "my area", "local", "here", "温哥华"], parent="place:bc", source="schema scope; sources.json; intent_map 'my area'", id="place:vancouver")
node("place", "place", "City of Vancouver", "The city itself, the area the public tree inventory covers.", aliases=["CoV", "city"], parent="place:vancouver", source="cov_trees", id="place:city_of_vancouver")
node("place", "place", "North Vancouver", "North Shore municipality: wetter and shadier than the city, used by practitioner observations.", aliases=["North Van", "North Shore"], parent="place:vancouver", source="brief salal scene", id="place:north_vancouver")

# ============================================================ status
node("origin", "status", "Native", "Occurs naturally in the region without having been introduced by people.", aliases=["native species", "indigenous", "原生"], source="schema ecological_value 'native'; intent_map 'native'", id="origin:native")
for k, (lab, d, al) in {"native_bc_west_of_cascades": ("Native to BC west of the Cascades", "Grows naturally in coastal BC, the Vancouver region included.", ["BC native", "native to Vancouver", "coastal native"]), "native_north_america": ("Native to North America", "Native to the continent but not to coastal BC.", ["North American native"]), "non_native": ("Non-native", "Introduced from elsewhere; not naturally occurring here.", ["exotic", "introduced"]), "invasive_bc": ("Invasive in BC", "Introduced and spreading in BC to the harm of native habitat.", ["invasive"])}.items():
    node("origin", "status", lab, d, aliases=al, parent=("origin:native" if k.startswith("native") else None), source="schema entity.origin_status", id=f"origin:{k}")
for i, (k, lab, d) in enumerate([("not_listed", "Not listed as invasive", "Does not appear on BC or ISCBC invasive lists."), ("watch", "On a watch list", "Flagged for monitoring; not regulated."), ("regulated_bc", "Regulated in BC", "Control required under BC regulation."), ("prohibited_bc", "Prohibited in BC", "Sale or planting prohibited in BC.")], 1):
    node("invasive", "status", lab, d, order=i, source="schema invasive_status (ISCBC)", id=f"invasive:{k}")

# ============================================================ resistance: stresses, browsing, pests (one axis; edges say resists / susceptible)
STRESS = {"drought": ("Dry spells without irrigation once established.", ["drought tolerant", "dry tolerant"]), "salt": ("Road salt spray or saline soil.", ["salt spray", "coastal salt"]), "wind": ("Strong or persistent wind.", ["windy"]), "winter wet": ("Saturated soil through the wet season.", ["wet winters", "waterlogging"]), "urban pollution": ("Exhaust, dust and compacted soil of streets.", ["pollution", "street conditions"]), "leaf scorch": ("Browning of leaf edges from sun, wind or drought.", ["scorch", "sunburn"]), "black walnut": ("Juglone, the chemical black walnut roots release, which kills many plants nearby.", ["juglone", "under walnut"])}
for k, (d, al) in STRESS.items():
    node("stress", "resistance", k, d, aliases=al, source="schema resistances starter list (M11)" + ("; MOBOT" if k == "black walnut" else ""), id=f"stress:{slug(k)}")
node("browsing", "resistance", "deer", "Browsing by deer, a common cause of damage in the North Shore and suburbs.", aliases=["deer resistant", "deer-proof"], source="schema resistances", id="browsing:deer")
node("browsing", "resistance", "rabbit", "Browsing by rabbits, mainly on young growth.", aliases=["rabbit resistant"], source="schema resistances", id="browsing:rabbit")
node("pest", "resistance", "pest", "Insect and mite pests in general.", aliases=["pest resistant"], source="schema resistances", id="pest:pest")
node("pest", "resistance", "disease", "Fungal, bacterial and viral diseases in general.", aliases=["disease resistant"], source="schema resistances", id="pest:disease")
PEST_D = {"Abiotic disorder": "Damage from non-living causes: weather, soil, chemicals.", "Adelgids": "Small sap-sucking insects on conifers.", "Anthracnose": "A fungal disease causing leaf and shoot blight, worse in wet springs.", "Aphids": "Small sap-sucking insects that cluster on new growth.", "Bacterial leaf spot": "Water-soaked spots on leaves from bacteria.", "Beetles or weevils": "Chewing beetles; root weevils notch leaves and eat roots.", "Blight or needle cast": "Fungal dieback of shoots or shedding of needles.", "Canker or sap rot": "Dead sunken bark patches, often oozing.", "Caterpillar or cutworm": "Larvae that chew leaves or cut stems.", "Crown rot": "Rot at the base of the plant, usually from wet soil.", "Dieback": "Progressive death of shoots from the tips.", "Fungal leaf spot": "Spots on leaves caused by fungi.", "Galls": "Abnormal swellings caused by insects or mites.", "Leaf miner insect": "Larvae that tunnel inside leaves.", "Leaf scorch": "Browning of leaf edges from sun, wind or drought.", "Mealybugs": "Woolly white sap-sucking insects.", "Mildew": "Powdery or downy fungal coating on leaves.", "Mites": "Tiny sap-sucking arachnids causing stippled leaves.", "Mold": "Grey or sooty fungal growth on leaves or flowers.", "Nematodes": "Microscopic worms attacking roots.", "Root rot": "Root decay from fungi in wet soil.", "Rust": "Orange fungal pustules on leaves.", "Scale insects": "Immobile sap-sucking insects under a waxy shell.", "Slugs or snails": "Molluscs that chew holes in leaves.", "Thrips": "Tiny insects that rasp leaves and flowers.", "Virus": "Viral infection causing mottling or distortion.", "Whitefly": "Small white sap-sucking flies.", "Wilt": "Vascular disease causing drooping and death of branches."}
for p in V["kpu_pest"]:
    if p.startswith("("):
        continue  # pseudo-values live under resistances (schema 0.3.0)
    node("pest", "resistance", p, f"Pest or disease '{p}': {PEST_D[p]}", source="kpu pest list")

# ============================================================ facet → claim field map (what feeds each facet) and dimension list
FACET_FIELDS = {
    "growth_form": ["entity.kpu_plant_type", "habit", "mature_height", "growth_rate", "landscape_use", "entity.respondent_roles"],
    "exposure": ["exposure"], "soil": ["soil_type"], "water": ["water_drainage"], "hardiness": ["hardiness_zone"], "hardiness_usda": ["hardiness_zone"], "hardiness_rhs": ["hardiness_zone"], "wind": ["exposure"],
    "evergreen": ["seasonal_interest.evergreen"], "height_class": ["mature_height", "local_mature_size", "time_to_intended_size"], "spread_class": ["mature_spread", "time_to_intended_size"], "growth_rate": ["growth_rate"],
    "colour": ["seasonal_interest.flower_colour", "seasonal_interest.foliage_colour"], "texture": ["texture"], "form": ["form"], "habit": ["habit"], "plant_type": ["entity.kpu_plant_type"],
    "interest": ["seasonal_interest.fall_colour", "seasonal_interest.winter_interest"], "fruit": ["seasonal_interest.fruit"], "maintenance": ["maintenance_level"], "toxicity": ["toxicity.pets", "toxicity.humans"], "photoperiod": ["photoperiod"],
    "use": ["landscape_use"], "ecology": ["ecological_value"],
    "season": ["seasonal_interest"], "month": ["seasonal_interest.flowering_months", "seasonal_interest.fruiting_months"], "age": ["context", "time_to_intended_size.years", "practitioner_meta.plant_age_years"],
    "place": ["context", "source.geo_specificity", "practitioner_meta.location"],
    "origin": ["entity.origin_status", "ecological_value"], "invasive": ["invasive_status"],
    "stress": ["resistances", "pest_susceptibility"], "browsing": ["resistances"], "pest": ["resistances", "pest_susceptibility"],
}
DIMENSIONS = {"classification": ["growth_form"], "condition": ["exposure", "soil", "water", "hardiness", "hardiness_usda", "hardiness_rhs", "wind"], "trait": ["evergreen", "height_class", "spread_class", "growth_rate", "colour", "texture", "form", "habit", "plant_type", "interest", "fruit", "maintenance", "toxicity", "photoperiod"], "use": ["use", "ecology"], "time": ["season", "month", "age"], "place": ["place"], "status": ["origin", "invasive"], "resistance": ["stress", "browsing", "pest"]}

# ============================================================ XYZ knowledge architecture (brief 2026-11-02, methods M31)
# Three axes of knowledge organisation (not coordinates, not separate databases): X identity & classification,
# Y traits & performance, Z planting-design knowledge. Place · Time · Evidence · Media cut across all three.
# Every existing node keeps its id, dimension and facet; it gains `axis`, `category` and `level`. New nodes:
# axis / category / facet nodes (the 大类 and 小类 of the architecture), taxon nodes read from the plant entity
# records, and the Z (design) concepts with their literature sources. Concept-level relations with a source and a
# status live in `relations` (requires_trait · maps_to · typically_formed_by · corresponds_to).
LIT = {   # literature sources for the Z dimension — also recorded in sources.json (type literature, tier B: cite facts, never copy text)
    "robinson": "Robinson, N. (2016) The Planting Design Handbook, 3rd ed., Routledge",
    "rainer_west": "Rainer, T. & West, C. (2015) Planting in a Post-Wild World, Timber Press",
    "oudolf_kingsbury": "Oudolf, P. & Kingsbury, N. (2013) Planting: A New Perspective, Timber Press",
    "mooney": "Mooney, P. (2020) Planting Design: Connecting People and Place, Routledge",
}
for n in NODES: n["level"] = "concept"

AXES = {
    "x": ("Plant Identity & Classification", "What a plant is: its taxonomic identity (family, genus, species, cultivar) and its growth form.", ["taxonomy", "growth_form_cat"]),
    "y": ("Plant Traits & Performance", "What a plant needs, how it is built, how it behaves over time and what it does ecologically.", ["environment", "morphology", "temporal", "ecological"]),
    "z": ("Planting Design Knowledge", "How plants are used in design: the vertical structure they build, the spaces they make, the way they are composed and the roles they play.", ["vertical_structure", "space_making", "composition", "planting_role", "landscape_use"]),
}
CATEGORIES = {   # id -> (axis, label, definition, facets, source)
    "taxonomy": ("x", "Taxonomy", "Botanical identity: family → genus → species → cultivar. Species are the plant records; cultivars are read from claims.", ["taxon_family", "taxon_genus"], "entity records (plants/*.json); names as accepted by the sources cited there"),
    "growth_form_cat": ("x", "Growth Form", "The life form a plant is read as (tree, shrub, graminoid, herbaceous perennial, fern, vine) and the KPU plant type that records it.", ["growth_form", "plant_type"], "ontology (M29); KPU plant type"),
    "environment": ("y", "Environmental Conditions", "The site conditions a plant needs or tolerates: light, soil, water, hardiness, wind.", ["exposure", "soil", "water", "hardiness", "hardiness_usda", "hardiness_rhs", "wind"], "KPU facets; RHS and USDA hardiness scales"),
    "morphology": ("y", "Morphology", "How a plant is built: height, spread, form, habit, texture, colour.", ["height_class", "spread_class", "form", "habit", "texture", "colour"], "KPU facets"),
    "temporal": ("y", "Temporal Performance", "How a plant performs through time: growth rate, phenology (months), seasonality, leaf retention, photoperiod.", ["growth_rate", "month", "season", "evergreen", "interest", "fruit", "photoperiod"], "schema fields; iNaturalist phenology"),
    "ecological": ("y", "Ecological Performance", "Habitat and ecological value, origin and invasive status, resistance to stress, browsing, pests and disease, plus management and risk (maintenance, toxicity).", ["ecology", "origin", "invasive", "stress", "browsing", "pest", "maintenance", "toxicity"], "schema gate fields; E-Flora BC, USDA PLANTS, ISC BC"),
    "vertical_structure": ("z", "Vertical Structure", "The layers a planting is built from, top to bottom, and the height bands planting design works with.", ["layer", "height_band"], LIT["robinson"] + " ch. 3 (height bands) and ch. 8 (forest structures, canopy structures)"),
    "space_making": ("z", "Space-making", "How planting encloses and shapes outdoor space: screens, scrims, barriers and ceilings; degree, permeability and transparency of enclosure.", ["spatial"], LIT["robinson"] + " ch. 4 'Creating Spaces with Plants'; " + LIT["mooney"] + " ch. 5 'Space and Place'"),
    "composition": ("z", "Planting Composition", "How individual plants are arranged into a planting: matrix, drift, group, scatter, layering.", ["composition"], LIT["oudolf_kingsbury"] + "; " + LIT["robinson"] + " ch. 8 'Matrix Planting', ch. 12 'Planting Patterns'"),
    "landscape_use": ("z", "Landscape Use (KPU)", "The documented use vocabulary: KPU's landscape-use facet as sources apply it to plants. The bridge from claims into the design concepts (maps_to, rule KG-R1); not a design theory in itself.", ["use"], "KPU landscape-use facet (plantdatabase.kpu.ca); intent_map 'hedge'"),
    "planting_role": ("z", "Planting Roles", "The job a plant does in a designed plant community: structural, seasonal theme, ground cover, filler, accent.", ["role"], LIT["rainer_west"] + " (design layers); " + LIT["robinson"] + " ch. 7 'Emphasis and Accent', ch. 12 'Accents'"),
}
CROSS = {"place": ("Place", "Where a claim holds or was observed: from the Vancouver scale outward.", ["place"]), "time": ("Time", "When a claim holds: the plant's age at observation and the season or month of the record.", ["age"]), "evidence": ("Evidence & Sources", "The claims, sources, conditions and verification status behind every link.", []), "media": ("Media", "Images, GIS layers, planting plans and site observations that can be attached to a claim (`media[]`, schema 0.5.0).", [])}
FACET_LABELS = {"taxon_family": "Family", "taxon_genus": "Genus", "growth_form": "Growth form", "plant_type": "Plant type (KPU)", "exposure": "Light", "soil": "Soil", "water": "Water", "hardiness": "Hardiness (Canadian zones)", "hardiness_usda": "Hardiness (USDA zones)", "hardiness_rhs": "Hardiness (RHS ratings)", "wind": "Wind exposure",
    "height_class": "Height", "spread_class": "Spread", "form": "Form", "habit": "Habit", "texture": "Texture", "colour": "Colour", "growth_rate": "Growth rate", "month": "Phenology (months)", "season": "Seasonality", "evergreen": "Leaf retention", "interest": "Seasonal interest", "fruit": "Fruit", "photoperiod": "Photoperiod",
    "use": "Landscape use (KPU)", "ecology": "Habitat & ecological value", "origin": "Origin status", "invasive": "Invasive status", "stress": "Stress tolerance", "browsing": "Browsing resistance", "pest": "Pests & diseases", "maintenance": "Maintenance", "toxicity": "Toxicity", "age": "Plant age", "place": "Place",
    "layer": "Vertical layers", "height_band": "Height bands", "spatial": "Spatial elements", "composition": "Composition patterns", "role": "Planting roles"}
FACET_DEFS = {"taxon_family": "The botanical family a plant belongs to, as recorded in its entity record.", "taxon_genus": "The genus, read from the scientific name.", "growth_form": "Organising life-form classes read from the sources (M29), never inferred from 'Broadleaf evergreen'.", "plant_type": "KPU's plant-type facet, which mixes life form and leaf habit; kept as a trait.",
    "exposure": "Light the site offers, KPU's exposure facet with three groups (sun, part shade, shade).", "soil": "Soil types a plant takes, KPU's soil facet.", "water": "Water and drainage regime the plant needs.", "hardiness": "Canadian plant hardiness zones (KPU).", "hardiness_usda": "USDA hardiness zones as given by US sources.", "hardiness_rhs": "RHS hardiness ratings H1–H7.", "wind": "Need for shelter from wind.",
    "height_class": "KPU mature-height classes; quantitative claims span the classes their range covers.", "spread_class": "KPU mature-spread classes.", "form": "Overall outline of the plant (KPU form facet).", "habit": "Branching and growth habit (KPU habit facet).", "texture": "Visual texture, fine to very coarse (KPU).", "colour": "Flower and foliage colours (KPU colour list).", "growth_rate": "Slow, moderate or fast growth.", "month": "Months of flowering or fruiting.", "season": "Season of interest.", "evergreen": "Whether leaves are held through winter.", "interest": "Seasonal interest features (fall colour, winter interest).", "fruit": "Fruit character (edible, showy).", "photoperiod": "Day-length response (survey c4; no source yet).",
    "use": "KPU landscape uses a source lists the plant for; the documented layer beneath the design concepts.", "ecology": "Ecological values a plant offers: native, pollinator, bird food, cover, erosion control, habitat structure.", "origin": "Native or non-native status for BC.", "invasive": "Invasive-species listing status in BC.", "stress": "Abiotic stresses tolerated (drought, salt, wind, winter wet…).", "browsing": "Resistance to deer and rabbit browsing.", "pest": "Pests and diseases, as susceptibility or as resistance.", "maintenance": "Maintenance level required.", "toxicity": "Toxicity to pets, humans or livestock.", "age": "Age bands of the plant at the time a value holds.", "place": "Geographic scale of the record.",
    "layer": "The vertical layers of a planting: canopy, understorey, shrub layer, ground layer.", "height_band": "Robinson's five planting-height bands, from carpeting plants to trees.", "spatial": "Spatial elements planting can make: screen, scrim, barrier, ceiling.", "composition": "Patterns for arranging plants: matrix, drift, group, scatter, layering.", "role": "Roles in a designed plant community: structural, seasonal theme, ground cover, filler, accent."}

def struct(nid, level, label, definition, *, parent=None, source="ontology (XYZ architecture, brief 2026-11-02; M31)", aliases=(), **extra):
    if nid in SEEN: raise SystemExit(f"duplicate node id {nid}")
    SEEN.add(nid)
    n = {"id": nid, "dimension": "architecture", "facet": level, "level": level, "label": label, "definition": definition, "aliases": sorted(set(aliases)), "source_of_term": source}
    if parent: n["parent"] = parent
    n.update(extra); NODES.append(n); return nid

for ax, (lab, d, cats) in AXES.items(): struct(f"axis:{ax}", "axis", lab, d, categories=[f"cat:{c}" for c in cats], order="xyz".index(ax) + 1, aliases=[ax.upper()])
for cid, (ax, lab, d, facets, src) in CATEGORIES.items(): struct(f"cat:{cid}", "category", lab, d, parent=f"axis:{ax}", facets=[f"facet:{f}" for f in facets], source=src, order=list(CATEGORIES).index(cid) + 1)
for cid, (lab, d, facets) in CROSS.items(): struct(f"cross:{cid}", "category", lab, d, facets=[f"facet:{f}" for f in facets], cross_layer=True, order=list(CROSS).index(cid) + 1)
FACET_PARENT = {f: f"cat:{c}" for c, (_, _, _, fs, _) in CATEGORIES.items() for f in fs}
FACET_PARENT.update({f: f"cross:{c}" for c, (_, _, fs) in CROSS.items() for f in fs})
for f, lab in FACET_LABELS.items(): struct(f"facet:{f}", "facet", lab, FACET_DEFS[f], parent=FACET_PARENT[f], facet_key=f, source="ontology (facet node; labels from the brief 2026-11-02 where it names them, else the schema field)")

# ---- X taxonomy nodes, read from the plant entity records
PLANTS_DIR = os.path.join(ROOT, "plants"); fams, gens = {}, {}
for fn in sorted(os.listdir(PLANTS_DIR)):
    if fn.endswith(".json"):
        e = json.load(open(os.path.join(PLANTS_DIR, fn), encoding="utf-8"))["entity"]
        fam = e.get("family"); gen = e["scientific_name"].split()[0]
        if fam: fams.setdefault(fam, []).append(e["id"])
        gens.setdefault(gen, {"family": fam, "plants": []})["plants"].append(e["id"])
for fam, ps in sorted(fams.items()): node("taxon_family", "taxonomy", fam, f"The plant family {fam}, as recorded in the entity records of {', '.join(ps)}.", source="entity.family (plants/*.json)", id=f"family:{fam.lower()}")
for gen, g in sorted(gens.items()): node("taxon_genus", "taxonomy", gen, f"The genus {gen}, read from the scientific name; family {g['family'] or 'unrecorded'}.", source="entity.scientific_name (plants/*.json)", parent=f"family:{g['family'].lower()}" if g["family"] else None, id=f"genus:{gen.lower()}")

# ---- Z design concepts. Definitions written for this file; the source names the book and chapter the term comes from
# (chapter titles verified against the published table of contents on 2026-11-02; page-level wording is 'to confirm').
R, RW, OK_, MO = LIT["robinson"], LIT["rainer_west"], LIT["oudolf_kingsbury"], LIT["mooney"]
node("layer", "design", "Canopy", "The uppermost layer: tree crowns that form the roof of a planting and shade everything beneath.", aliases=["tree canopy", "canopy layer", "overstorey", "overstory"], source=f"{R}, ch. 8 'Forest Structures' / 'Typical Canopy Structures as Models for Design' (tree canopy)", id="layer:canopy", order=1)
node("layer", "design", "Understory", "Small trees and large shrubs that grow beneath the canopy and above the shrub layer (Robinson's low tree canopy / sub-canopy).", aliases=["understorey", "sub-canopy", "low tree canopy", "subcanopy"], source=f"{R}, ch. 8 (two- and three-layer canopy structures: 'low tree canopy')", id="layer:understorey", order=2)
node("layer", "design", "Shrub layer", "Woody plants branching from near the ground that fill the space between the ground layer and the trees.", aliases=["shrub and sapling layer", "shrub stratum", "bush canopy"], source=f"{R}, ch. 8 ('shrub and sapling layer' in the canopy-structure types)", id="layer:shrub", order=3)
node("layer", "design", "Ground layer", "The lowest layer: herbaceous, carpeting and low woody plants that cover the soil.", aliases=["field layer", "herb layer", "ground cover layer", "groundcover layer"], source=f"{R}, ch. 8 ('herb layer' / ground cover principle) and ch. 3 'Ground-level Planting (Carpeting Plants)'", id="layer:ground", order=4)
BANDS = [("ground_level", "Ground-level planting (carpeting)", "Carpeting plants at ground level.", 0, 0.15), ("low", "Low planting (below knee)", "Shrubs and herbaceous plants below knee height.", 0.15, 0.5), ("medium", "Medium-height planting (knee to eye level)", "Planting between knee and eye level: a physical barrier that still allows views over it.", 0.5, 1.6), ("above_eye", "Tall shrub planting (above eye level)", "Planting above eye level: visual enclosure and screening.", 1.6, 6), ("tree", "Tree planting", "Trees: canopy, ceiling and shade above head height.", 4, None)]
for i, (sid, lab, d, lo, hi) in enumerate(BANDS):
    node("height_band", "design", lab, d + " Bounds are approximate readings of the heading names (knee ≈ 0.5 m, eye ≈ 1.6 m) — to confirm against the chapter text.", source=f"{R}, ch. 3 'Spatial Characteristics of Plants' (section headings)", id=f"height_band:{sid}", order=i + 1, min_m=lo, **({"max_m": hi} if hi is not None else {}))
node("spatial", "design", "Screen", "Planting that blocks a view: visual enclosure above eye level, opaque in the seasons it has to work.", aliases=["screening", "visual screen", "privacy screen", "privacy planting"], source=f"{R}, ch. 3 'Planting Above Eye Level (Tall Shrub Planting)' and ch. 4 'Permeability and Transparency of Enclosure'", id="spatial:screen", order=1)
node("spatial", "design", "Scrim", "A partly transparent screen: planting open enough to be seen through, which filters a view rather than blocking it. Term from the brief; not found under this name in Robinson, whose nearest heading is 'Permeability and Transparency of Enclosure' — to confirm.", aliases=["filtered screen", "veil", "see-through screen", "semi-transparent screen"], source=f"brief 2026-11-02; {R}, ch. 4 'Permeability and Transparency of Enclosure' (nearest documented concept)", id="spatial:scrim", order=2, to_confirm=True)
node("spatial", "design", "Barrier", "Planting that stops movement: a dense, continuous physical enclosure, with or without a visual screen.", aliases=["physical barrier", "security planting", "hedge barrier"], source=f"{R}, ch. 4 'Degree of Enclosure' (physical vs visual enclosure) and ch. 3 'Knee- to Eye-level Planting'", id="spatial:barrier", order=3)
node("spatial", "design", "Ceiling", "Tree crowns forming an overhead plane that encloses a space from above.", aliases=["canopy ceiling", "overhead plane", "shade canopy"], source=f"{R}, ch. 3 'Tree Planting' and ch. 4 'Degree of Enclosure'", id="spatial:ceiling", order=4)
node("composition", "design", "Matrix", "A continuous ground-covering planting of one or a few species into which structural and seasonal plants are set.", aliases=["matrix planting", "groundcover matrix"], source=f"{OK_} (matrix plants); {R}, ch. 8 'Matrix Planting'; {RW} (groundcover matrix layer)", id="composition:matrix", order=1)
node("composition", "design", "Drift", "An elongated, irregular group of one species that flows through a planting.", aliases=["drifts", "drift planting"], source=f"{OK_} (drifts, as against blocks)", id="composition:drift", order=2)
node("composition", "design", "Grouping", "Several plants of one kind set together as a block, group or mass.", aliases=["group", "block", "mass planting", "group planting", "block planting"], source=f"{OK_} (blocks); {R}, ch. 12 'Planting Patterns'; KPU 'Group or mass planting'", id="composition:group", order=3)
node("composition", "design", "Scatter", "Single plants distributed through a planting at random to give a natural feel.", aliases=["scatter plants", "scattered"], source=f"{OK_} (scatter plants)", id="composition:scatter", order=4)
node("composition", "design", "Layering", "Combining plants of different heights so that canopy, understorey, shrub and ground layers occupy the same ground.", aliases=["layered planting", "interplanting", "layers within layers", "vertical layering"], source=f"{R}, ch. 8 'Layers Within Layers' and ch. 12 'Canopy and Seasonal Layers'; {RW} (vertical layers of a designed plant community)", id="composition:layering", order=5)
node("role", "design", "Structural", "Long-lived plants that give a planting its year-round framework.", aliases=["structural plant", "framework plant", "structure planting", "structural and framework layer"], source=f"{RW} (structural and framework layer); {R} (structure planting)", id="role:structural", order=1)
node("role", "design", "Seasonal theme", "Plants that dominate the picture in one season and recede in others.", aliases=["seasonal theme layer", "seasonal plant", "seasonal layer"], source=f"{RW} (seasonal theme layer); {R}, ch. 12 'Canopy and Seasonal Layers'", id="role:seasonal", order=2)
node("role", "design", "Ground cover", "Low plants that cover the soil between and beneath the others; the layer that carries most of the diversity and ecological function.", aliases=["ground-cover layer", "groundcover role", "ground cover plant"], source=f"{RW} (ground cover layer); {R}, ch. 8 'Two Principles – Ground Cover and Diversity'", id="role:ground_cover", order=3)
node("role", "design", "Filler", "Short-lived or fast plants that fill gaps while the framework establishes.", aliases=["dynamic filler", "filler plant", "filler layer"], source=f"{RW} (dynamic filler layer); KPU 'Filler'", id="role:filler", order=4)
node("role", "design", "Accent", "A single plant placed for emphasis or focus: a specimen.", aliases=["specimen", "specimen plant", "accent plant", "focal plant", "emphasis"], source=f"{R}, ch. 7 'Emphasis and Accent' and ch. 12 'Accents'; KPU 'Specimen plant', 'Accent plant'", id="role:accent", order=5)

# ---- concept-level relations (typed, directed, sourced). status: documented = stated in the named source;
# derived = produced by a named rule from documented terms; to_confirm marks a reading of a source not yet checked at page level.
RELS = []
def rel(t, a, b, source, status="documented", **extra):
    RELS.append({"id": f"{t}:{a}>{b}", "type": t, "from": a, "to": b, "source": source, "status": status, **extra})
# vertical layers ↔ growth forms and height bands (Robinson names the layers by life form; bands by height)
for layer, forms in (("layer:canopy", ["growth_form:tree"]), ("layer:understorey", ["growth_form:tree"]), ("layer:shrub", ["growth_form:shrub"]), ("layer:ground", ["growth_form:herbaceous_perennial", "growth_form:fern", "growth_form:graminoid", "growth_form:shrub"])):
    for f in forms: rel("typically_formed_by", layer, f, f"{R}, ch. 8 (layers named by life form)", note="a life form says which layer a plant can occupy, not which role it plays" + ("; woody ground covers only" if (layer, f) == ("layer:ground", "growth_form:shrub") else ""))
for layer, bands in (("layer:ground", ["height_band:ground_level", "height_band:low"]), ("layer:shrub", ["height_band:medium", "height_band:above_eye"]), ("layer:understorey", ["height_band:above_eye", "height_band:tree"]), ("layer:canopy", ["height_band:tree"])):
    for b in bands: rel("corresponds_to", layer, b, f"{R}, ch. 3 height bands read against ch. 8 layers", status="derived", rule="KG-R3: a layer corresponds to the height bands its plants occupy", to_confirm=True)
# what a spatial element or role needs from a plant (Y traits). strength: required | preferred. alternatives: any one suffices.
def req(z, concepts, source, strength="required", note=None, to_confirm=False):
    rel("requires_trait", z, concepts[0], source, strength=strength, alternatives=concepts, note=note, to_confirm=to_confirm)
req("spatial:screen", ["height_band:above_eye", "height_band:tree"], f"{R}, ch. 3 'Planting Above Eye Level' (screening belongs to planting above eye level)", note="screening planting must rise above eye level")
req("spatial:screen", ["habit:dense"], f"{R}, ch. 4 'Permeability and Transparency of Enclosure'", note="a screen needs dense foliage; open habits give a scrim", to_confirm=True)
req("spatial:screen", ["evergreen:yes"], f"{R}, ch. 4 'Permeability and Transparency of Enclosure' (deciduous enclosure opens in winter)", strength="preferred", note="for a year-round screen", to_confirm=True)
req("spatial:scrim", ["height_band:above_eye", "height_band:tree"], f"brief 2026-11-02; {R}, ch. 3", to_confirm=True)
req("spatial:scrim", ["habit:open", "habit:twiggy", "habit:arching"], f"brief 2026-11-02; {R}, ch. 4 (transparency of enclosure)", note="open or airy habit lets the view through", to_confirm=True)
req("spatial:barrier", ["habit:dense"], f"{R}, ch. 4 'Degree of Enclosure' (physical enclosure)", note="continuous dense growth stops movement", to_confirm=True)
req("spatial:barrier", ["height_band:medium", "height_band:above_eye"], f"{R}, ch. 3 'Knee- to Eye-level Planting' (medium planting as a physical barrier)", to_confirm=True)
req("spatial:ceiling", ["growth_form:tree"], f"{R}, ch. 3 'Tree Planting'", note="only tree crowns make an overhead plane")
req("spatial:ceiling", ["height_band:tree"], f"{R}, ch. 3 'Tree Planting'")
req("role:ground_cover", ["height_band:ground_level", "height_band:low"], f"{RW} (ground cover layer); {R}, ch. 3 'Ground-level Planting (Carpeting Plants)'")
req("role:ground_cover", ["habit:spreading", "habit:dense", "form:creeping_mat_like", "form:mounded"], f"{RW} (ground cover layer: plants that cover the soil)", strength="preferred", to_confirm=True)
req("role:structural", ["growth_form:tree", "growth_form:shrub"], f"{RW} (structural and framework layer: long-lived, often woody)", strength="preferred", to_confirm=True)
req("role:structural", ["evergreen:yes", "interest:winter_interest"], f"{RW} (structural plants hold the picture year-round)", strength="preferred", to_confirm=True)
req("role:seasonal", ["interest:seasonal_interest", "interest:fall_colour", "fruit:showy", "colour:red", "colour:pink", "colour:white", "colour:purple", "colour:yellow", "colour:orange", "colour:blue"], f"{RW} (seasonal theme layer: visually dominant in one season)", note="any sourced seasonal-interest feature counts; the facet is open", to_confirm=True)
req("role:filler", ["growth_rate:fast"], f"{RW} (dynamic filler layer: quick, short-lived)", to_confirm=True)
req("role:accent", ["form:weeping", "form:vase", "form:columnar", "form:pyramidal_narrowly", "interest:seasonal_interest"], f"{R}, ch. 7 'Emphasis and Accent' (contrast of form or colour)", strength="preferred", to_confirm=True)
req("composition:matrix", ["height_band:ground_level", "height_band:low"], f"{OK_} (matrix plants: low, ground-covering); {R}, ch. 8 'Matrix Planting'", to_confirm=True)
req("composition:matrix", ["growth_form:graminoid", "growth_form:herbaceous_perennial", "growth_form:shrub"], f"{OK_} (often grasses; any ground-covering species)", strength="preferred", to_confirm=True)
req("composition:layering", ["layer:canopy", "layer:understorey", "layer:shrub", "layer:ground"], f"{R}, ch. 8 'Layers Within Layers'", note="layering combines plants of different layers; a single plant qualifies by occupying one layer", to_confirm=True)
# KPU landscape uses that name a design concept (term equivalence, rule KG-R1). Only uses whose KPU label is the design term
# or its direct synonym; 'Mixed shrub border', 'Woodland margin', 'Tall background' are left unmapped on purpose.
MAPS = [("use:screening", "spatial:screen"), ("use:sheared_hedge", "spatial:screen"), ("use:sheared_hedge", "spatial:barrier"), ("use:hedge_row", "spatial:screen"), ("use:hedge_row", "spatial:barrier"), ("use:security_barrier", "spatial:barrier"), ("use:shade_tree", "spatial:ceiling"), ("use:shade_tree", "layer:canopy"), ("use:street_boulevard_tree", "layer:canopy"), ("use:wind_break", "spatial:barrier"),
        ("use:ground_cover", "role:ground_cover"), ("use:ground_cover", "layer:ground"), ("use:group_or_mass_planting", "composition:group"), ("use:specimen_plant", "role:accent"), ("use:accent_plant", "role:accent"), ("use:filler", "role:filler"), ("use:spring_interest", "role:seasonal"), ("use:summer_interest", "role:seasonal"), ("use:fall_interest", "role:seasonal"), ("use:winter_interest", "role:seasonal")]
for u, z in MAPS:
    if u not in SEEN: raise SystemExit(f"maps_to: unknown use {u}")
    rel("maps_to", u, z, "KPU landscape-use label read as the design term it names", status="derived", rule="KG-R1: a KPU use label that names a design concept maps to it; a plant with a sourced claim on the use is *derived* suited to the concept, with the claim as evidence", note="hedges are linear screens and barriers; wind break is shelter, mapped to barrier (physical), not screen" if "hedge" in u or "wind" in u else None)
for r in RELS:
    for k in ("from", "to"):
        if r[k] not in SEEN: raise SystemExit(f"relation {r['id']}: unknown node {r[k]}")
    for a in r.get("alternatives") or []:
        if a not in SEEN: raise SystemExit(f"relation {r['id']}: unknown alternative {a}")
    r = {k: v for k, v in r.items() if v is not None}
RELS = [{k: v for k, v in r.items() if v is not None} for r in RELS]

# axis / category of every node (concepts via their facet), for the brain and the validator
FACET_CAT = {f: f"cat:{c}" for c, (_, _, _, fs, _) in CATEGORIES.items() for f in fs}; FACET_CAT.update({f: f"cross:{c}" for c, (_, _, fs) in CROSS.items() for f in fs})
CAT_AXIS = {f"cat:{c}": f"axis:{v[0]}" for c, v in CATEGORIES.items()}
for n in NODES:
    n.setdefault("level", "concept")
    if n["level"] == "concept":
        n["category"] = FACET_CAT.get(n["facet"]); n["axis"] = CAT_AXIS.get(n["category"])
        n["hierarchy_parent"] = n.get("parent") or f"facet:{n['facet']}"
    elif n["level"] == "facet": n["category"] = n["parent"]; n["axis"] = CAT_AXIS.get(n["parent"]); n["hierarchy_parent"] = n["parent"]
    elif n["level"] == "category": n["axis"] = n.get("parent"); n["hierarchy_parent"] = n.get("parent")
    else: n["hierarchy_parent"] = None
DIMENSIONS["taxonomy"] = ["taxon_family", "taxon_genus"]; DIMENSIONS["design"] = ["layer", "height_band", "spatial", "composition", "role"]; DIMENSIONS["architecture"] = ["axis", "category", "facet"]
FACET_FIELDS.update({"taxon_family": ["entity.family"], "taxon_genus": ["entity.scientific_name"], "layer": ["landscape_use (via maps_to)", "mature_height (via height bands)"], "height_band": ["mature_height", "local_mature_size"], "spatial": ["landscape_use (via maps_to)"], "composition": ["landscape_use (via maps_to)"], "role": ["landscape_use (via maps_to)"]})
XYZ = {"axes": {f"axis:{a}": {"label": v[0], "categories": [f"cat:{c}" for c in v[2]]} for a, v in AXES.items()}, "cross_layers": [f"cross:{c}" for c in CROSS], "relation_types": {"requires_trait": "design concept → trait it needs from a plant (strength required | preferred; alternatives: any one suffices); literature-sourced", "maps_to": "KPU landscape use → design concept it names (rule KG-R1)", "typically_formed_by": "vertical layer → growth form that forms it", "corresponds_to": "vertical layer → height band (rule KG-R3)"}, "status_vocabulary": {"documented": "stated in the named source or claim", "derived": "produced by a named rule from documented statements", "candidate": "inferred or observed, not asserted by any source; never promoted automatically", "unknown": "required by a concept but no evidence either way"}}

out = {
    "$ontology_version": "0.2.0", "updated": TODAY, "generated_by": "tools/build_ontology.py",
    "note": "Concept nodes of the Planting Intelligence knowledge base. Ids are facet:slug. KPU labels verbatim. Definitions written for this file (methods M26, to confirm); terms from other vocabularies name their source in source_of_term. Rebuild with python3 -I tools/build_ontology.py. 0.2.0 (2026-11-02, M31): XYZ architecture — axis / category / facet nodes, taxon nodes, design (Z) concepts with literature sources, and typed concept relations in `relations`.",
    "dimensions": DIMENSIONS, "facet_fields": FACET_FIELDS, "xyz": XYZ, "relations": RELS, "nodes": NODES,
}
with open(os.path.join(ROOT, "ontology.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
by = {}
for n in NODES: by[n["dimension"]] = by.get(n["dimension"], 0) + 1
print(f"ontology.json: {len(NODES)} nodes · " + " · ".join(f"{k} {v}" for k, v in by.items()) + f" · {len(RELS)} concept relations")
missing = [n["id"] for n in NODES if not n["definition"].strip()]
if missing: print("MISSING DEFINITIONS:", missing)
