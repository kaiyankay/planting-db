# UX acceptance scripts — MUST run in real browser

## Case A — Vague beginner

Input: “I want an ecological backyard with low maintenance.”
- The first screen is an inviting entry and natural-language field.
- System reflects values; no invented geometry or precise plant quantities.
- Continue naturally to Site, offering drawing, photo overlay and dimensions; user sees what is unknown.
- After site + bed acceptance, move into readable design brief, then garden. Screens adapt to available data; no mandatory redundant forms.

## Case B — Rich initial prompt

Input: “I have a 6 × 4 m backyard in Vancouver, a large existing tree on the north side, privacy along the fence, ecological value, and an open centre for children.”
- Capture dimensions and wants once. Display existing tree/open-zone as **suggestions** with uncertainty labels.
- User can correct proposed Site Model and accept bed.
- Garden generation displays actual species IDs, positions, quantity, sources, unresolved site gates. No fake site measurements or costs.
- Plan / Presentation / 3D share the same plant IDs/coordinates.

## Case C — Conversational spatial edit

From the generated garden select a region and say “Too dense here, but keep privacy.”
- Highlight exactly the selected region and its targeted objects.
- Show a scoped, reversible preview and change summary BEFORE Apply.
- Outside-of-scope items remain in place. Privacy is a design intent and not automatically guaranteed.
- Apply updates Plan, Presentation, 3D, schedule, version and export. Undo restores the prior exact design state.
- The editable composer is discoverable and does not cover the selected region.

## Case D — Viewport / scrolling / accessibility

At desktop 1440×900 and mobile 390×844:
- Page-level reading flow is naturally scrollable in the first three stages; no forced wheel-capture or unexpected fixed clipping.
- Garden stage prioritizes available space; drawers do not obscure critical edits.
- Users can move between stages; project state persists; keyboard focus and back navigation are coherent.
- Test keyboard and accessible labels, contrast, reduced-motion; no invisible tappable text.

## Core regression checks

- Every plant visual maps to an actual model plant ID, with the correct species and position.
- Drawing a Site/Bed and calibrating scale changes model state and behaves consistently.
- Stage transitions preserve unsaved/conversational state.
- Site data and phase-1 Knowledge Explorer references are read, not hardcoded into UI copy.
- Values with no algorithmic effect are labelled as unimplemented; sliders must not be falsely presented as optimizers.
- All source-based facts and caveats are preserved in evidence inspection.
- Existing deterministic tests still pass; new e2e checks cover stage transitions and the three journeys.

## Deliverable contract

Supply real screenshots per phase (Welcome, Site, Intent, Garden, Revision), screenshots of the open and collapsed contextual tools, browser test report with viewport, and side-by-side before/after of the same DesignVersion. Include a short statement listing each interactive element: functional, assisted/manual, or future-only. A visual-only mockup does not pass.
