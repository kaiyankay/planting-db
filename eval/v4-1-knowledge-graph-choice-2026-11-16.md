# Knowledge Network (V4.1): own SVG or a graph library

Date 2026-11-16. Decision by the agent; to confirm by Kay.

**Decision: stay on the existing vanilla SVG explorer (`brain/explorer/js/`).** No dependency was added.

## What the Network has to do

- Draw about 26 to 60 nodes: 10 species, 5 spatial functions, 11 required traits, and at most 24 further attribute values (the safe threshold in `model.js`).
- Draw at most a few hundred lines; a typical focus shows 5 to 40.
- Keep every node in a fixed, meaningful place: three columns, X plants · Z functions · Y attributes. The position is part of the argument (a plant is linked to a function, which requires traits), not the output of a layout solver.
- Share one state with the Matrix and the Table (focus, edge classes, hops, compare pair, filter) through the URL hash and browser history.
- Open an Inspector from any node or line, and take the keyboard.

## Options compared

| | Own SVG (kept) | Cytoscape.js | React Flow |
|---|---|---|---|
| Fits a static GitHub Pages site with no build step | yes, already there | yes, one script (~360 KB min, vendored or CDN) | no: needs React and a bundler; the repo has no Node toolchain |
| Fixed three-column layout | 12 lines of code | possible (`preset` layout), the library's layouts go unused | possible, custom nodes |
| Line classes told by dash pattern and a word on the line | CSS on `<path>`, already done | style sheet in its own dialect; canvas renderer, so no CSS tokens and no DOM text halo | SVG edges, custom edge components |
| Keyboard and screen-reader access to nodes and lines | native: each is a focusable `role="button"` element with a label | canvas: needs a parallel hidden DOM | DOM nodes are focusable; edges need work |
| Headless tests read the result | `--dump-dom` shows every node, class and label; 59 checks rely on it | canvas content is invisible to the DOM dump; tests would need a JS probe | DOM, but only after a React render |
| Shared state with Matrix and Table | same module, same `S` | adapter between its own element state and `S` | would pull the other views into React or need a bridge |
| Graph algorithms (BFS, neighbourhoods) | 15 lines in `model.js` (`walk`) | built in | none |
| Pan and zoom | 10 lines, already there | built in, better on touch | built in |
| Scales past a few hundred nodes | no | yes | moderately |

## Why not a library now

1. The graph is small and its layout is fixed by meaning. The strength of Cytoscape.js (layout solvers, thousands of elements, graph algorithms) is not needed for 10 plants; the one algorithm used is a typed breadth-first walk with a project-specific rule (never return to the focus's own kind through a shared node).
2. Accessibility and testability come for free from DOM SVG and would have to be rebuilt over a canvas.
3. React Flow is an editor toolkit. Knowledge is an evidence explorer: no node is created or wired by the reader. It would also bring the first build step into a repository that has none.
4. All ids, statuses and source links already come from one snapshot through `model.js`; a library would add a second element model to keep in step.

## When to revisit

- The snapshot grows past roughly 60 species, so the X column no longer fits and a real layout (or virtualised columns) is needed.
- Free exploration beyond two hops is wanted, where a force or layered layout earns its place.
- Touch gestures become a requirement.

At that point Cytoscape.js is the candidate (no build step, `preset` layout can reproduce the columns); React Flow is not, unless the platform moves to React for other reasons.
