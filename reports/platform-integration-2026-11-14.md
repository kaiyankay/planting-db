# Platform Integration V1 — 2026-11-14

Branch `feature/platform-integration` (from `feature/generative-composition`) · methods M65 · preview
<https://kaiyankay.github.io/planting-db/platform-preview/> · tests `eval/platform-tests-2026-11-14.md`.

## What exists

| Destination | Preview path | Source | State |
|---|---|---|---|
| Design | `/` | `design/` | the studio (Imagine → Shape → Compose → Grow) with the platform navigation in its bar; Imagine's hero, art and composer unchanged |
| Plants | `/plants/` | `platform/plants/`, `platform/js/library.js`, `plantcard.js` | new: atlas of ten species, one profile each |
| Explore | `/explore/` · `/explore/neural/` | `brain/explorer/` · `brain/index.html` | reused; platform bar, palette tokens, shared plant card |
| Contribute | `/contribute/` | `platform/contribute/` | new: survey link, what the release holds, coverage, gaps, conflicts, release process |
| How it works | `/how-it-works/` | `platform/how-it-works/` | new, secondary: eight steps, who decides at each, what is AI and what is not |

One knowledge snapshot (`data/explorer.json`, generated 2026-11-13, schema 0.4.3, 10 species, 501 claims) is read by all of
them; the Neural view reads `graph.json`, `diagnosis.json` and the canonical files of the same pipeline run. The build stops if
the dates or the species differ.

## Cross-module connections (all ten species, same rules)

- **Library → Explorer / Neural**: "Open in the Knowledge Explorer" focuses the species; every attribute row and function row
  of a profile opens that record's claims in the Explorer.
- **Explorer → Library**: the species inspector carries the shared plant card and the species name links to the profile.
  A click on a species node focuses it in the graph (the Explorer's own behaviour); the profile is one click further.
- **Compose → Library**: the evidence panel of a species carries the plant card; "From the Plant Library" rows link to profiles.
- **Grow → Library**: the plant card of a selected plant has "Plant profile"; its evidence sheet carries the plant card.
- **Library → Design**: "Consider for my design" puts the species on a list beside the project. Compose shows it per bed with
  the engine's own check. It is planted only if it qualifies there and the user adds it to that bed's mix.
- **Back**: the bar of every other page shows "Back to Compose · East bed" / "Back to Grow" while a design is in progress.
  The Studio reopens at the stage, bed, step, view and selected plant it was left in (`project.ui.view`).

## Acceptance journey (Gaultheria shallon)

Driven with real clicks in the built preview, then replayed by `tools/platform_tests.py` (F1–F8, G1–G3):

1. Plant Library → the Salal card → its profile (10 sections, 27 attribute rows, 5 function rows, photograph with credit).
2. "Keep it on my list" (no design yet: the page offers "Start a design" and names no bed).
3. "Open in the Knowledge Explorer" → graph focused on Salal, 42 nodes; Screen row → the use claim, rule KG-R1, verification
   and AI check shown apart.
4. Design → a 6 × 4 m backyard described → Confirm model → Compose → East bed.
5. Plant selection: Salal "in the mix" with the bed's checks; Arrangement: Clustered patches chosen → Generate: 31 plants,
   preview = Grow for all 31.
6. Grow: a planted Salal (plant-022) selected → "Plant profile" → the Library says the species is planted and being
   considered, with "Back to Grow".
7. Back to Grow: stage, Presentation view, plant-022 selected, the patches arrangement and the version are as they were left.

Second check: *Acer palmatum* considered from the Library → every bed reads "not planted" with the reason (a tree: no
tree-placement rule; the row does not fit a 0.9 m deep bed; no ground-cover link), there is no add control, the regenerated
garden holds none, and forcing it into two beds' mixes still plants none.

## Tests

- `tools/platform_tests.py`: 26 / 26.
- Existing suites after the change: see the commit message and `eval/*-2026-11-14.md`.

## Limits

- Ten species; the Library is as thin as the database. Seven attributes are recorded for fewer than nine species.
- Photographs are from Wikimedia Commons under CC BY / CC BY-SA, identified by their uploaders; nobody on this project has
  verified the identifications. Several were taken outside British Columbia.
- The Explorer and the Neural view were not redesigned: they carry the platform bar, palette and plant card, but their dense
  panes and small type remain, and neither is usable on a phone. The Neural view's own wording ("neurons", "synapses") differs
  from the rest.
- A click on a species node in the Explorer focuses it rather than leaving for the Library.
- The way back restores stage, bed, step, panel, view mode and selected plant. It does not restore pan and zoom, an open
  lasso, or an unapplied preview.
- "Considered" is a per-browser list; it is not shared between devices and is not part of a design until Compose adds the
  species to a bed.
- Contribute shows no survey findings beyond counts of what the public release already contains.
- No language model runs in the preview; the live reader stays on its own branch.
- The preview is desktop-first. The new pages reflow down to a phone; the workspace stages do not (as before).
