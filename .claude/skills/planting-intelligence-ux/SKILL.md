---
name: planting-intelligence-ux
description: Use when reviewing, designing, implementing, testing, or polishing the Planting Intelligence Phase 2 web experience. Preserve the LLM-centered multimodal site-to-planting workflow and integrate Phase 1 evidence. Prioritize progressive scrolling/onboarding, a delightful garden stage, and scoped conversational+direct editing over dashboards or one-shot garden generators.
---

# Planting Intelligence — Product-specific UX Skill

## Why this exists

The Planting Intelligence project has been implemented in phases. Its existing site/bed model, ten-species knowledge projection, evidence status, spatial engine, 2D plan, Three.js garden, and scoped editing are real foundations. Earlier revisions repeatedly optimized components or rendering without fixing the overall *journey*. This skill prevents that drift.

**Read `references/PRODUCT_CONTEXT.md`, `references/SPATIAL_PROPOSAL.md` and `references/UX_ACCEPTANCE.md` before any UI/UX changes.** Also inspect the current source and screenshots. Never assume the demo is equivalent to a tested live-LLM experience.

## Product thesis

**Planting Intelligence is an LLM-centered, knowledge-grounded planting design environment that turns natural language and mixed site inputs into editable spatial proposals.** It is neither a conventional chatbot dashboard, nor a fixed-parameter generator, nor a Pollinator Pathmaker clone.

Pollinator Pathmaker (https://pollinator.art/pathmaker) is a benchmark for clear, inviting, playful parametric interaction, rich garden visualization, transitions into the garden, and actionable plan/instructions. **Do not reproduce its proprietary graphics, code, or its predetermined algorithmic objective.** Our primary distinction: conversational, multimodal understanding and iterative spatial editing.

## User experience architecture

Design the *experience*, not merely individual panels. The **first three pages are a naturally scrollable, progressive experience** (not wizard forms); after generating, transition into an **immersive garden/editor stage**, where wheel events belong to the canvas/3D and do not accidentally scroll the document. Users can navigate back without losing project state. The four pages (nav labels Imagine · Shape · Compose · Grow; stage ids `welcome` · `site` · `intent` · `garden`):

1. **Page 1 — Describe** (the Imagine hero; **frozen** since 2026-11-07: composition, typography, palette, plant illustration, sway animation, language field and the photo / draw / dimensions / address entries stay as they are). The user describes the site and the wish. Only the data handling and navigation after submit may change.
2. **Page 2 — Shape your space.** The AI turns the words into a **Site Model** (boundary, scale, orientation, existing trees with estimated positions labelled as such, open areas, buildings / paths, conditions; stated / inferred / unknown kept apart in a contextual inspector, not a permanent wall) and, when a measured boundary exists, into **Planting Bed Proposals** on an interactive canvas: plantable area = site − excluded areas − clearances; beds by named spatial operations (edge band · island · ribbon · infill · modular) with a reasoning line per operation; one recommended layout plus materially different alternatives ("more open centre", "more planting area", modular / ribbon). Suggested beds (dashed, caramel) and confirmed beds (solid, olive) look different. The user can select a bed, drag its corners, add / delete corners, move it, draw a bed, draw an open area, drag the tree, accept / reject each bed or the whole layout, compare alternatives, undo and reset, and ask in words ("make the north planting bed wider") — which locates the bed, previews before / after geometry with its conflicts and applies only on Apply. Without dimensions the page shows the conceptual moves and asks the one question that unblocks it; it never invents a size. See `references/SPATIAL_PROPOSAL.md`.
3. **Page 3 — Compose the planting.** The brief (values with their engine effect named, inert ones labelled), site-wide spatial functions, per-bed functions and per-bed species candidates checked against the site gates, hard constraints, unknowns, the four composition operators and their parameters. Do not force Grid/Organic as the only patterns; inert controls are forbidden.
4. **Page 4 — Grow.** The garden is the hero: plan, presentation and 3D are alternate representations of the *same* DesignVersion over *all* confirmed beds (ids continue across beds, every object carries its bed). Language-only, lasso + language and direct edits locate a scope, preview, Apply / Cancel / Undo, keep outside-of-scope objects untouched, and update 2D / 3D / schedule / exports together. When a bed's outline changed after generation, the stage offers **Preview updated design → Apply / Keep current version**: changed beds are replanted, unchanged beds' plants are byte-equal, the previous version stays viewable; nothing is regenerated silently.

The user can skip a page when the input already supplies its facts (a sentence with dimensions lands on Shape with beds proposed). A one-bed backyard must stay effortless; a multi-bed site moves between site-wide and bed-specific views. Confirmation is required when geometry or site assumptions materially affect output.

## Interaction principles

- **Conversation is the primary conceptual control, not a permanent giant chat column.** Keep a discoverable composer available in the design stage (floating or collapsible) without covering drawing tools.
- **Progressive disclosure:** one decision/question per viewing moment. Unneeded settings and evidence stay contextual; preserve deep professional inspection when requested.
- **The canvas is a spatial object:** click, draw, lasso, zoom, drag and selection matter. Avoid page-scroll hijacking. Ensure keyboard navigation, focus states and reduced-motion behavior.
- **User values are not decoration.** If changing an important preference has no implemented effect, reveal the limitation; never pretend the landscape changed based on a slider that the engine ignores.
- **No fabricated certainty:** `known / stated / inferred / assumed / unknown`; `verification_scope`; AI check; rule-derived Z links; and site-specific suitability are distinct. Guard source provenance throughout. Suggested ≠ confirmed; an estimated tree position says so; ground under a canopy is conditional, not excluded; the access edge is an assumption until stated.
- **Language is the interpreter, geometry is the engine:** a sentence about a bed becomes a typed request (which bed · which operation · how much) that `design/js/spatial.js` turns into validated before / after polygons; a model never returns coordinates that are taken as a bed, and a drawn or spoken change never alters only the explanatory text.
- **Scoped editing everywhere:** plant edits touch only the resolved scope; bed edits touch only the located bed (others byte-identical); geometry updates replant only the changed beds.
- **Design spatially before dressing the outputs.** Avoid polished but rigid hedge row + fill-drift + repeated accents on every project; report the generator's actual composition limits.
- **No framework rewrite merely for aesthetics:** current code uses vanilla JS, SVG, Three.js, JSON and GitHub Pages. Preserve working generation, editing, evidence, versioning, exports and tests.

## Design direction

Emphasize a friendly editorial botanical atmosphere, restrained typography, legible contrasts, calm light background, rich-but-grounded plant graphics, meaningful motion and visual rhythm. No generic SaaS dashboard, gratuitous glassmorphism, giant permanent chat rail, dense always-open condition panels or faux-autonomous AI explanations. Pollinator Pathmaker is a **quality reference**, not an asset source or a workflow specification.

## Required workflow before coding

1. Inspect `design/index.html`, `design/js/app.js`, `model.js`, `spatial.js`, `clip.js`, `engine.js`, `render.js`, `garden3d.js`, `intent.js`, `knowledge.js`; inspect `brain/explorer/` and real existing screenshot directories (`brain/screenshots/spatial/` for the four pages and the three demos); identify which states are implemented. Capture the Imagine page before any change and verify afterwards that `#s-welcome`'s DOM hashes identical to `brain/screenshots/spatial/00-home-before-welcome-dom.html` and that a reduced-motion pixel diff of the page below the nav bar is 0.
2. Run the existing demo journey and capture the current experience (desktop 1440×900 and mobile viewport). State the **3 biggest user-journey failures** rather than a list of CSS issues.
3. Produce a *screen/state map* and concise textual wireframe of Welcome → Site → Intent → Garden → Revise. Document what is visible, hidden, editable, and which action changes state. No heavy proposal-only cycle: implement after brief plan.
4. Build incrementally, preserving the Design Model and feature behavior. Use UI/UX skill(s) for taste, but this product skill wins on behavior and requirements.
5. Run real browser tests and capture actual screens of all states, including a selection/edit before/after and a bed-geometry before/after. Regression: `python3 -I tools/design_tests.py`, `tools/ux_tests.py`, `tools/spatial_tests.py` (engine invariants A–J, the demonstration journey, the UX scripts A–D and the three spatial demos A/B/C) must pass; `sh tools/shots.sh` reproduces the screenshots. Compare readability, focus, scroll behavior, interaction clarity, and provenance before declaring success.
6. Deliver: deployed/local URL, source diffs, five real screenshots, a repeatable journey, regression tests, known limitations, and what remains visually/interactionally rough.

## Never do

- Never present a five-page wizard where all inputs are required.
- Never treat an AI-suggested rectangle, tree or planting bed as measured data.
- Never claim live language understanding on GitHub Pages when only offline regex parsing is active.
- Never replace the garden with unrelated generated imagery; 2D/3D/plant schedule must share plant IDs and coordinates.
- Never have a drawn selection change only the explanatory text rather than the spatial model.
- Never propose a planting bed as "the site inset by a margin" or any other fixed default: beds come from the spatial operations over the plantable area, with reasons, validation and alternatives; without dimensions, propose in words and ask.
- Never take coordinates from a language model as a bed; never let a bed edit touch other beds; never regenerate plants silently after a geometry change; never treat a suggested bed, an estimated tree position or an assumed access edge as confirmed.
- Never change the Imagine page's look to match a later page.
- Never silently copy Pollinator Pathmaker's assets, UI or copyrighted illustrations.
- Never finalize using only mockups; the deliverable must be a functioning browser experience.
