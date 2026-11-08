# Design Journey — complete UI/UX redesign of the Phase 2 workspace (2026-11-07 → 08)

Brief: *Planting Intelligence — Complete UI/UX Redesign & Implementation* (2026-11-07). Delivered in `design/`: the Phase 2 workspace is no longer a one-screen dashboard but a **journey** — a document that scrolls *Imagine → Understand your site → Explore the design intent*, then an immersive **Garden** stage that takes the viewport, with language, lasso and direct edits as the refinement loop. The model, the offline interpreter, the spatial engine, the knowledge adapter, the 2D renderers and the three.js garden are **unchanged**; only the interface layer was rebuilt. The previous workspace is kept as `design/classic.html` for comparison.

- **Local:** `python3 -I tools/design_server.py` → <http://127.0.0.1:8768/design/> · **GitHub Pages:** <https://kaiyankay.github.io/planting-db/design/> (classic: `…/design/classic.html`).
- **Tests:** `tools/design_tests.py` **53/53** (unchanged suite, run against the new page) · `tools/ux_tests.py` **41/41** (acceptance scripts A–D, desktop 1440 × 900 and a narrow window) · `tools/ux_browser_journey.sh` (agent-browser, real clicks and typing in Chrome at 1440 × 900 and 390 × 844) — reports in `eval/design-tests-2026-11-07.md`, `eval/ux-tests-2026-11-07.md`; screenshots `brain/screenshots/design-journey/`.

## 1. Skills and tools used, and when

| step | tool | what it did |
|---|---|---|
| before anything | **planting-intelligence-ux** (Kay's ZIP → `.claude/skills/planting-intelligence-ux/`; `SKILL.md`, `PRODUCT_CONTEXT.md`, `UX_ACCEPTANCE.md` read in full) | fixed the thesis (LLM-first, multimodal site understanding, scoped editing), the five stages and their visibility rules, the "never do" list and the acceptance scripts A–D |
| A · audit | **Impeccable 4.8.0** (`.claude/skills/impeccable/`, manual copy — this Mac has no Node; `impeccable context` and `impeccable detect --json` run through the shipped launcher), `critique`, `onboard`, `layout`, `craft-floor` playbooks | heuristic scoring and cognitive-load checklist of the old page (§2); the detector found 0 mechanical findings on it — the problems were journey problems |
| A · audit | **built-in browser pane** at 1440 × 900 and phone emulation; **agent-browser 0.41.2** (darwin-x64 release binary, system Chrome 156) | real screens of the old page (`brain/screenshots/design-journey/00-before-*.jpg`) |
| research | browser pane on <https://pollinator.art/pathmaker> | walked Toolbox → Your garden → Your soil → Light → Empathy (sliders) → Create → generated garden → tip tour → plan toggle → Planting instructions (§3) |
| B · architecture | project skill + Impeccable `onboard` / `layout` | the screen / state map and wireframe (§4) |
| C · implementation | — | `design/index.html`, `design/css/journey.css`, `design/js/app.js`; `render.js` gained one line (the drawn-selection outline) |
| D · refinement | Impeccable `craft-floor` checks | contrast of secondary text raised from 3.4:1 to 4.8:1; plant id moved under the name (no eyebrow above a heading); offset + blurred shadows; focus rings; reduced-motion; one authored motion (the hero sway); detector run on the new page: 0 findings |
| E · validation | agent-browser (real clicks) + headless Chrome (`tools/ux_tests.py`) + the browser pane | §6 |
| F · final review | project skill `UX_ACCEPTANCE.md` re-read; Impeccable critique re-scored (§7); `tools/design_tests.py` rerun | §7, §8 |

## 2. Audit of the old page — the three biggest journey failures

Scored with the Impeccable critique guide (Nielsen 0–4): visibility 3 · real world 2 · control 3 · consistency 3 · error prevention 2 · recognition 1 · flexibility 3 · minimalist 1 · recovery 3 · help 1 → **22/40 (low Acceptable)**; cognitive-load checklist 6 of 8 failed. The mechanical detector found nothing, which is the point: the page was tidy and still wrong.

1. **No beginning.** The first screen was the whole workspace: a 348 px conversation column with seven zero-valued sliders and a function picker, a 360 px context rail with six "unknown" selects, seven drawing tools, a view bar, a schedule drawer — and an empty canvas reading "no site geometry yet". The composer, the one thing a newcomer needed, was the smallest element, bottom-left. Nothing said what the product was or what to do first.
2. **Site understanding and intent were never staged.** After a description, the stated / inferred / unknown split lived in one chat bubble; the suggested tree, open zone and bed were drawn but their acceptance sat in a collapsed rail section; the brief was a slider block under the chat. There was no moment to confirm the site model and no moment to read and correct the brief before generating; "Generate" was a rail button or a typed word.
3. **The garden never became the subject.** Even after generation the plan sat between two 350 px panels under a tool strip, with legend, footer, view bar and drawer stacked below; 3D was a mode of the same framed window. At 390 px the tool strip overlapped the conversation header, a "Set site" button floated over the panel and the right rail was unreachable. `body { overflow: hidden }` meant there was no document to return to.

## 3. Pollinator Pathmaker — what was learned, what was not taken

Walked in the browser (desktop 1440 × 900): the landing is one floating "Toolbox" card over an empty graph-paper world with a single *Get started*; each step is one card with one question (*Your garden* location + width/length sliders · *Your soil* type + pH · *Light* sun + exposure · *Empathy* intro · species / pattern / flight-path sliders), *Back* / *Next*, and the site grows on the page as you answer; *Create my artwork* shows a progress card, then the garden fills the page with the chrome reduced to a thin bottom bar (3D / aerial / plan toggle · frame · names · season play + timeline) and two text buttons (*Planting instructions*, *Create new artwork*); a five-step anchored tip card teaches exploration (rotate, switch view, names, pollinator vision, seasons), dismissable; instructions sit behind a terms dialog.

Borrowed as principles: one decision per moment; the site visible and growing while you answer; the garden as the page after generation with a thin bottom bar; names on demand; a plan ↔ garden toggle in one place. Not borrowed: the wizard-only flow (ours is language-first and skippable), its artwork, models, algorithm, pollinator objective, copy or layout.

## 4. Screen / state map

| state | what the user sees | what they do | shown | hidden | → next | ← back | kept |
|---|---|---|---|---|---|---|---|
| **1 Imagine** (`#s-welcome`) | wordmark + stage nav (Imagine active, others locked), headline *Imagine your garden.*, one paragraph, the composer (large textarea + Photo / Draw / Dimensions / Address + *Start designing*), *Try the example*, a drift of the ten species drawn from their own claims, a resume card when a project exists | type; or pick an entrance | the interpreter mode ("words read by offline rules") | every panel, slider, tool, condition | *Start designing* → words interpreted → Site unlocks and scrolls into view | — | project |
| **2 Site** (`#s-site`) | left: *Stated* / *Inferred or suggested — confirm or change* / *Unknown — not assumed* cards (conditions as selects, tree canopy input, north, inputs, "add to the description" composer with the last reading); right: the plan canvas with Draw tools (Select · Site boundary · Bed · Tree · Open area · Calibrate), W × H *Set the site* until geometry exists, Fit, Photo, Address; the *Planting beds* card with *Accept this bed* | state or draw geometry, correct conditions, accept / redraw the bed | the plan, the provenance of every fact | schedule, species, evidence, values | *Continue to the design intent* (always enabled; the note says generation needs a bed) | nav *Imagine* | site, notes, inputs |
| **3 Intent** (`#s-intent`) | left: *What matters* (7 goals, each with a 4-level control and the engine effect — or "recorded only — no placement rule yet"), *Spatial functions* (Z vocabulary, where), *Must not change*, *Unknown — not assumed*; right: *How the garden will be composed* (the four operators, on/off for this brief, density · second row · seed, the honesty note), *Candidates for Bed 1* (gate-checked picks and exclusions), "change the brief in words" composer | adjust levels, add / remove functions, change density, write | engine effects per goal | the full evidence, the plan | *Generate my garden* (disabled without a bed, with a link back) | nav *Site* | brief |
| **4 Garden** (`#stage`, fixed) | the plan (or presentation, or 3D) filling the viewport; top bar: wordmark, *← Site*, *← Intent*, version label, Undo, Redo, Export; left: Select · lasso, Add plant (species picker), Zones; bottom: species legend chips, view bar (Plan · Presentation · 3D garden · Names · Winter · Fit / Frame), the composer pill (bottom-left), the drawer tab *Plants n · versions k · assumptions* (bottom-right) | explore (wheel = zoom, right-drag / Space-drag = pan, orbit in 3D), click a plant → card → *Full evidence* sheet, click a legend chip → species evidence, open the drawer (schedule · versions · evaluation · model) | the design and its provenance on demand | site conditions, values, tools not relevant to the view | lasso / language / direct edit → state 5 | *← Site* / *← Intent* close the stage; the document shows a *Your garden* section with a thumbnail and *Open the garden* | everything |
| **5 Revise** (inside 4) | a drawn region highlighted with its plant count and a *Selected region* card; after a command: *Preview* banner (Apply · Cancel), red removals / green additions / target rings in every view, a *Proposed change* card (scope, diff, amount slider, notes, continuity proxy); direct drag / Delete / Add make versions at once; a stale-site banner offers *Regenerate* when the site changed after the design | say what should change, adjust the amount, Apply / Cancel, ⌘Z / ⇧⌘Z | only the change | the brief | Apply → version | Cancel / Esc | versions chain |

Document scroll owns the wheel in states 1–3 (⌘ / Ctrl + wheel zooms the plan); the canvas owns it in state 4. Stages unlock as data arrives (description → Site; geometry or a bed → Intent; a version → Garden) and stay reachable in the nav. The whole project (site, brief, versions, conversation, stage, unlocked stages) is saved in localStorage and, when the design server runs, in `designs/<id>.json`; reloading resumes the stage.

## 5. What was implemented (files)

| file | change |
|---|---|
| `design/index.html` | new: the document (nav, four sections, footer) and the fixed garden stage; Fraunces via Google Fonts with a serif fallback (the page works without the font) |
| `design/css/journey.css` | new: tokens (warm ivory · deep olive · sage · caramel), type scale, buttons, tags, cards, the stage sections, the garden chrome, phone rules, reduced motion |
| `design/js/app.js` | new interface layer (the stage machine, the three document stages, the garden chrome, the canvas in two homes, the composer, revision card, plant card, evidence sheet, drawer, export, the demonstration journey, the acceptance scripts); `handleSay`, `applyDescription`, `ensureSuggestions`, `handleEdit`, `generate`, undo / redo, the canvas pointer handlers, `exportBundle` / `planSvg` carried over from the classic app |
| `design/js/render.js` | one addition: the drawn selection is outlined and its plants ringed before a command exists |
| `design/classic.html`, `design/js/app-classic.js` | the previous workspace, renamed, untouched otherwise |
| `tools/ux_tests.py` | new: acceptance scripts A–D in headless Chrome at two sizes + stage screenshots (`--shots`, `--only-shots`) |
| `tools/ux_browser_journey.sh` | new: the real-click journey with agent-browser (desktop + phone), screenshots per state |
| `tools/design_tests.py`, engine, model, interpreter, knowledge adapter, 3D garden, data | unchanged |
| `.claude/skills/planting-intelligence-ux/`, `.claude/skills/impeccable/` | installed skills (Impeccable's engine binary is not tracked) |
| `design/README.md`, `HANDOFF.md`, `README.md`, `methods.md` (M52), `.gitignore` | documentation |

### Functional, assisted, or future-only (every interactive element)

| element | status |
|---|---|
| language field (all four composers) | **functional** — offline rule parser (`js/intent.js`, every rule listed); the live model path in `tools/design_server.py` exists but has not been exercised (no key); the page says "words read by offline rules" on the welcome line and in the nav |
| Photo or sketch | **assisted / manual** — an overlay to trace over (opacity, width); no recognition; labelled so in the Inputs card and the system message |
| Draw | **functional** — site boundary, bed, open area, tree, calibrate |
| Dimensions (W × H) | **functional** — a stated rectangle; scale `user-stated` |
| Address | **reference only** — stored, nothing inferred; labelled |
| stated / inferred / unknown cards, condition selects, canopy radius, north | **functional** |
| Accept this bed · + bed from the site · Draw a bed · remove | **functional** |
| goal levels (7 × 4) | **functional for privacy, openness, ecology, low maintenance, seasonal interest** (each row names its effect); **recorded only** for shelter and cost awareness (said on the row) |
| spatial functions add / remove | **functional** (zones follow) |
| density slider, second row on/off, seed | **functional** engine parameters |
| candidates card | **functional** (the engine's assemblage on the current brief and conditions) |
| Generate / Regenerate | **functional** |
| Plan · Presentation · 3D · Names · Winter · Zones · Fit / Frame | **functional** (Winter = leaf-retention claims, not a season) |
| plant card, Full evidence, legend chip → species evidence, See in 3D, Delete | **functional** |
| drawer: schedule · versions (click to make current) · evaluation · model JSON | **functional** |
| lasso + language, side word + language, amount slider, Apply / Cancel, Undo / Redo | **functional** (reduce / increase density, remove / swap species, move away from a feature; "layering" is not an implemented operation and the interpreter says *no change made* for requests it cannot read) |
| drag a plant, Add plant | **functional** |
| Export (model JSON · plan SVG · schedule CSV · assumptions MD) | **functional** |
| stale-site banner → Regenerate / Keep as is | **functional** |
| Classic workspace link | **functional** (the old page) |

## 6. Browser validation

**agent-browser 0.41.2, real Chrome, real clicks** (`tools/ux_browser_journey.sh`, output in the transcript): desktop 1440 × 900 — *Try the example* → *Start designing* → stage `site`, overflow 0 → *Set the site* → *Accept this bed* → *Continue* → stage `intent` → *Generate my garden* → stage `garden`, in-garden, 37 plants = 37 symbols → Presentation → 3D garden → *Edit in plan* → lasso over the right third (pointer events) → selection, 19 inside → "Too dense here, but keep the privacy." → preview (37 → 32 symbols, 5 red) → *Apply* → version 2, 32 plants → ⌘Z → 37 → ⇧⌘Z → 32 → drawer → close → *← Site* → stage `site`, versions kept → *Open the garden* → in-garden, 32 plants; then phone 390 × 844 (CDP viewport): the same path through generation and the lasso preview. Screenshots `brain/screenshots/design-journey/01…07-*-desktop.jpg` and `*-phone.jpg`.

**Headless Chrome acceptance** (`tools/ux_tests.py`): **41/41** — A vague beginner (values read, nothing invented, site cards, suggested bed, intent with inert goals labelled, garden with real ids), B rich prompt (6 × 4 m once, tree north inferred with canopy assumed, open centre inferred, Screen + constraints, every plant inside the bed, no cost / ecology score, plan = presentation = 3D counts), C conversational edit (selection scope, screen row kept, removals only inside, outside untouched, privacy not guaranteed, red before Apply, apply / undo byte-equal / redo, back to Site and back without loss), D viewports (no horizontal overflow at every stage, progressive unlocking). Note: headless Chrome cannot make a window narrower than about 500 px, so the suite's "phone" row is a narrow-window run; the true 390 px checks (no element wider than the viewport at every stage) were made with agent-browser's CDP viewport and are in the journey script.

**Built-in browser pane** (interactive, during development): every click path above was also driven by hand at 1440 × 900, including the plant card → evidence sheet, the drawer tabs, Add plant → species chip → click in the bed (version 3, 39 plants, top bar and plan in sync), Escape paths, and the gate section. Bugs found and fixed this way: the body's `data-stage` attribute swallowing every click; the stage's SVG rule positioning the legend icons; `[hidden]` losing to `display: flex`; a reveal animation that never ran under virtual time; the site hint crashing on garden-only tools; the drawer with no way to close it once open.

**Regression** (`tools/design_tests.py --url …`): **53/53** on the new page — adapter, model, interpreter, generation, local edits, the 12-step journey (now also recording the stage at each step: 01 site · 04 intent · 05 garden with the viewport owned · 07 revision card), the saved file.

## 7. Before / after

Same model, same data (`designs/demo-backyard.json`, seed 42, 37 plants).

| moment | before (`brain/screenshots/design-journey/00-before-*.jpg`, from `design-visual/`) | after |
|---|---|---|
| first screen | the whole dashboard: chat column + sliders, rail with six unknown selects, seven tools, empty canvas | *Imagine your garden.* — one field, four entrances, one button (`01-welcome-desktop.jpg`) |
| site understanding | one chat bubble; acceptance in a collapsed rail section | stated / inferred / unknown cards beside the plan; *Accept this bed* (`02-site-desktop.jpg`, `02b-site-geometry-desktop.jpg`) |
| intent | seven sliders under the chat, no effect stated | goals with their engine effect, inert ones labelled; operators; candidates (`03-intent-desktop.jpg`) |
| garden | the plan framed between two panels | the plan / presentation / 3D as the page (`04-garden-plan-desktop.jpg`, `04b-…-presentation`, `04c-…-3d`) |
| revision | preview in the rail's Revision section | region highlighted → *Proposed change* card + banner, red removals in every view, Apply / Cancel (`05a`, `05b`, `05c`) |
| phone | overlapping tool strip, unreachable rail | single column; garden chrome as bottom sheets (`*-phone.jpg`) |

Impeccable critique re-scored on the new page: visibility 4 · real world 3 · control 4 · consistency 3 · error prevention 3 · recognition 3 · flexibility 3 · minimalist 3 · recovery 3 · help 3 → **32/40 (Good)**; cognitive-load checklist 1 failure (the Intent stage still shows 28 level buttons at once — a deliberate choice: the brief must be editable in place).

## 8. Not done, not supported, still rough

- **Live language model**: the server endpoint exists and is wired, but has never run here (no key, no SDK). The page never claims otherwise.
- **Photo / sketch recognition, geocoding, site measurement**: not implemented; photo = manual tracing, address = reference, dimensions = what you state or calibrate.
- **Layering / grouping / rhythm edits**: the interpreter reads reduce / increase density, remove / swap species, move away; "make this more layered" yields *No change made* with the list of readable operations, not a random edit.
- **Values with no engine effect** (shelter, cost awareness) are kept in the brief and labelled "recorded only".
- **Multi-bed sites**: the model supports several beds and the Site stage lists them; the journey was validated with one bed; bed-level conditions are edited only through the model, not the Site cards.
- **Fonts**: Fraunces loads from Google Fonts; the built-in browser pane blocked that request, so the pane screenshots show the serif fallback; GitHub Pages loads it.
- **Rough edges**: the Intent stage is long on a phone; the 3D garden has no touch-specific hints; the gate thumbnail clips the plan's title line; the hero drift is a fixed composition (data-driven species, hand-tuned layout).
- **To confirm by Kay (M52)**: the goal → effect wording; showing candidate species before generation; keeping the plants visible on the site canvas once a design exists.
