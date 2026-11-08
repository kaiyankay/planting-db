# Product context / research decisions (2026-11-07)

## The evolution and why it matters

- Original ARCH 540 Assignment 2: explore whether AI can participate in *planting design workflow*, not merely recommend plants. Midterm prototype processed intent, negotiated constraints and returned strategies.
- Instructor shifted focus to a Metro Vancouver-based plant knowledge foundation: ten species as extensible proof of concept; claim-level data, sources, verification, semantic knowledge.
- Early Knowledge Graph visualized X=identity/classification, Y=attributes, Z=spatial functions. Desk crit: XYZ structure too restrictive for small data, proposed GIS-style JSON attribute tables and explicit A↔B relations.
- Phase 1 solution: **linked Graph + Spatial Function Matrix + Attribute Table** on the same canonical records. Existing Explorer at https://kaiyankay.github.io/planting-db/brain/explorer/. Z functions include Screen, Scrim, Canopy/Ceiling, Ground Cover and Barrier. Shared traits and co-listing are not proof of compatibility. Data verification and visual clarity still need refinement.
- Desk crit also stressed a new design interface: recognize planting beds, incorporate a user's economic/ecological/spatial/maintenance values, and generate actual spatial planting proposals.
- Phase 2 solution in https://kaiyankay.github.io/planting-db/design/: site input, editable beds, design brief, deterministic 2D planting generation, SVG and Three.js views, language/selection revisions, versions and exports.
- Current weakness: the initial Phase 2 was a dense one-screen engineering dashboard. A later canvas-first visual pass created full-screen visuals and collapsible rails, but did not sufficiently rethink *how a novice begins and progresses*. UX needs progressive, guided, naturally scrolling stages, then immersive garden exploration.

## Explicitly agreed design principles

- Language-first and multimodal: typed words, hand drawing, uploaded photo/sketch/plan, and address; any combination; incomplete inputs accepted. A live LLM is an aspiration/conditional integration, not current reality unless tested.
- Interpret user input → a **common structured Site Model** with known / inferred / unknown, not four disconnected apps. Photo/plan scale can be uncertain. AI proposes planting beds; user verifies and edits.
- Site Level handles whole-site intention and multiple beds; Bed Level does local composition and conditions. One-bed small gardens must not be forced into complicated hierarchy.
- Spatial function (Z) is a design *interpretation* of plant traits under circumstances, not an intrinsic yes/no trait.
- User values matter, but value priorities, hard site constraints and placement parameters must not be conflated. Values should have an observable supported effect, or explicitly limited response.
- Grid/Organic were examples of possible algorithmically understandable operations; not a binary aesthetic choice. Relevant concepts: distribution, grouping, layering, edge response, density, repetition, rhythm, species mix.
- User edits continuously: speaking or selecting with lasso and saying “right side too dense, keep privacy”; narrow the scope; show preview; apply/undo; do not change unrelated planting.
- Pollinator Pathmaker provides a reference for beautifully staged interaction, 2D/3D visual storytelling and an algorithmic garden output, **not the design logic to clone**.

## Repositories / references

Primary: https://github.com/kaiyankay/planting-db
Phase 1: https://kaiyankay.github.io/planting-db/brain/explorer/
Phase 2: https://kaiyankay.github.io/planting-db/design/
Older prototype: https://github.com/kaiyankay/planting-intelligence
Visual reference: https://pollinator.art/pathmaker

## Phase 2 spatial proposal (2026-11-08)

The Shape page no longer defaults to one bed = the site inset by 0.3 m. `design/js/spatial.js` (over `design/js/clip.js`, polygon-clipping vendored) derives the plantable area, proposes beds by edge / island / ribbon / infill / modular operations with reasons, validates them, offers alternatives, previews bed edits spoken in words, and `design/js/engine.js` plants all confirmed beds in one version with partial regeneration after a geometry change. See `SPATIAL_PROPOSAL.md`.

## The actual current capability caveat

The public static app uses an offline rule parser for English utterances. A separate Python server exposes a conditional live LLM endpoint, but this path has not been demonstrated end-to-end. Uploaded images are currently overlaid for manual tracing, not reliably auto-segmented. Address is a saved reference only. Costs/ecology optimization cannot be declared without supporting data. Preserve these distinctions in all UI.

## Design stages with visibility rules

1. **Welcome**: beautiful garden-focused invite, one natural-language input, secondary mixed-input affordances. No site-condition bureaucracy.
2. **Shape**: the canvas with the site model and the proposed planting beds is the subject; the proposal panel (alternatives, reasoning, a row per bed with accept / reject), the change-in-words composer with its preview card, and the stated / inferred / unknown inspector collapsed beside it. Don't show schedule or dense species evidence.
3. **Compose**: readable brief, site-wide and per-bed spatial functions, per-bed candidates against the site gates; approachable value adjustment; advanced controls optional; review/confirm assumptions. No unexplained score promise.
4. **Grow**: full-view interactive 2D/PRESENTATION/3D over all confirmed beds; a geometry change after generation is offered as a partial update, never applied silently; plant inspection on click, contextual evidence. Controls collapse; persistent easy-to-access AI composer. Scrolling over interactive canvas zooms with clear affordance; scrolling the surrounding experience remains predictable.
5. **Revision**: select region/direct object + natural-language edit, highlight scope, changed plant ID preview, Apply/Cancel/Undo, sync views and schedule. Export honest assumptions and references.
