---
name: planting-intelligence-ux
description: Use when reviewing, designing, implementing, testing, or polishing the Planting Intelligence Phase 2 web experience. Preserve the LLM-centered multimodal site-to-planting workflow and integrate Phase 1 evidence. Prioritize progressive scrolling/onboarding, a delightful garden stage, and scoped conversational+direct editing over dashboards or one-shot garden generators.
---

# Planting Intelligence — Product-specific UX Skill

## Why this exists

The Planting Intelligence project has been implemented in phases. Its existing site/bed model, ten-species knowledge projection, evidence status, spatial engine, 2D plan, Three.js garden, and scoped editing are real foundations. Earlier revisions repeatedly optimized components or rendering without fixing the overall *journey*. This skill prevents that drift.

**Read `references/PRODUCT_CONTEXT.md` and `references/UX_ACCEPTANCE.md` before any UI/UX changes.** Also inspect the current source and screenshots. Never assume the demo is equivalent to a tested live-LLM experience.

## Product thesis

**Planting Intelligence is an LLM-centered, knowledge-grounded planting design environment that turns natural language and mixed site inputs into editable spatial proposals.** It is neither a conventional chatbot dashboard, nor a fixed-parameter generator, nor a Pollinator Pathmaker clone.

Pollinator Pathmaker (https://pollinator.art/pathmaker) is a benchmark for clear, inviting, playful parametric interaction, rich garden visualization, transitions into the garden, and actionable plan/instructions. **Do not reproduce its proprietary graphics, code, or its predetermined algorithmic objective.** Our primary distinction: conversational, multimodal understanding and iterative spatial editing.

## User experience architecture

Design the *experience*, not merely individual panels. The **first three stages are a naturally scrollable, progressive experience** (not five mandatory wizard forms); after generating, transition into an **immersive garden/editor stage**, where wheel events belong to the canvas/3D and do not accidentally scroll the document. Users can navigate back without losing project state.

1. **Welcome / Imagine your garden** — inspiring landing moment; language field is the primary CTA; photo/sketch/draw/address are complementary, combinable inputs. Don't initially expose a three-column dashboard, seven sliders, or source records.
2. **Understand the site** — show what the AI knows, infers, and cannot know; reveal editable Site Canvas; handle typed/drawn geometry, user-confirmed Planting Beds, existing features, inaccessible zones and condition bar only when relevant. Photo overlay ≠ AI image recognition; address reference ≠ geospatial analysis. Distinguish Site boundary, plantable Bed polygons, and layout.
3. **Interpret the intent** — translate language to an editable design brief: hard constraints vs preferences, site-level vs bed-level goals, privacy vs openness, ecology, economy, maintenance, spatial functions. Do not force Grid/Organic as the only patterns. Composition operations and values must be grounded in actual engine capabilities; inert UI controls are forbidden.
4. **Generate / Explore** — the garden becomes the hero. Plan, presentation and 3D are alternate representations of the *same* DesignVersion and plant IDs. Botanical richness is welcome but don't hide assumptions, data gaps, or geometric performance problems. Show details, species, reasons and sources on demand, not as a permanently open wall of text.
5. **Refine / Export** — language-only (“right side too crowded”), lasso + language (“here, more layers, keep privacy”), and direct move/add/delete must locate a scope, preview actual changes, Apply/Cancel, Undo, update 2D/3D/schedule together, and leave outside-of-scope objects untouched when requested. Export consistent design data.

The user can skip an intermediate step when input already supplies its facts. A one-bed backyard should be effortless, while a multi-bed site can move between site-wide and bed-specific views. Confirmation is required when geometry or site assumptions materially affect output.

## Interaction principles

- **Conversation is the primary conceptual control, not a permanent giant chat column.** Keep a discoverable composer available in the design stage (floating or collapsible) without covering drawing tools.
- **Progressive disclosure:** one decision/question per viewing moment. Unneeded settings and evidence stay contextual; preserve deep professional inspection when requested.
- **The canvas is a spatial object:** click, draw, lasso, zoom, drag and selection matter. Avoid page-scroll hijacking. Ensure keyboard navigation, focus states and reduced-motion behavior.
- **User values are not decoration.** If changing an important preference has no implemented effect, reveal the limitation; never pretend the landscape changed based on a slider that the engine ignores.
- **No fabricated certainty:** `known / stated / inferred / assumed / unknown`; `verification_scope`; AI check; rule-derived Z links; and site-specific suitability are distinct. Guard source provenance throughout.
- **Design spatially before dressing the outputs.** Avoid polished but rigid hedge row + fill-drift + repeated accents on every project; report the generator's actual composition limits.
- **No framework rewrite merely for aesthetics:** current code uses vanilla JS, SVG, Three.js, JSON and GitHub Pages. Preserve working generation, editing, evidence, versioning, exports and tests.

## Design direction

Emphasize a friendly editorial botanical atmosphere, restrained typography, legible contrasts, calm light background, rich-but-grounded plant graphics, meaningful motion and visual rhythm. No generic SaaS dashboard, gratuitous glassmorphism, giant permanent chat rail, dense always-open condition panels or faux-autonomous AI explanations. Pollinator Pathmaker is a **quality reference**, not an asset source or a workflow specification.

## Required workflow before coding

1. Inspect `design/index.html`, `design/js/app.js`, `model.js`, `engine.js`, `render.js`, `garden3d.js`, `intent.js`, `knowledge.js`; inspect `brain/explorer/` and real existing screenshot directories; identify which states are implemented.
2. Run the existing demo journey and capture the current experience (desktop 1440×900 and mobile viewport). State the **3 biggest user-journey failures** rather than a list of CSS issues.
3. Produce a *screen/state map* and concise textual wireframe of Welcome → Site → Intent → Garden → Revise. Document what is visible, hidden, editable, and which action changes state. No heavy proposal-only cycle: implement after brief plan.
4. Build incrementally, preserving the Design Model and feature behavior. Use UI/UX skill(s) for taste, but this product skill wins on behavior and requirements.
5. Run real browser tests and capture actual screens of all five states, including a selection/edit before/after. Compare readability, focus, scroll behavior, interaction clarity, and provenance before declaring success.
6. Deliver: deployed/local URL, source diffs, five real screenshots, a repeatable journey, regression tests, known limitations, and what remains visually/interactionally rough.

## Never do

- Never present a five-page wizard where all inputs are required.
- Never treat an AI-suggested rectangle, tree or planting bed as measured data.
- Never claim live language understanding on GitHub Pages when only offline regex parsing is active.
- Never replace the garden with unrelated generated imagery; 2D/3D/plant schedule must share plant IDs and coordinates.
- Never have a drawn selection change only the explanatory text rather than the spatial model.
- Never silently copy Pollinator Pathmaker's assets, UI or copyrighted illustrations.
- Never finalize using only mockups; the deliverable must be a functioning browser experience.
