# Offline rules and the model path on four sentences (2026-11-14)

Same page, same site model, same spatial engine, knowledge adapter and planting engine; only the reader of the words differs.

- **offline** — the rule parser (`design/js/intent.js`). Real results.
- **mock** — HAND-WRITTEN answers (`tools/fixtures/llm_mock.json`) sent through the real SDK path and the checks. Not a language model: this column shows what the pipeline does with an answer of that shape, not what a model understands.
- **live** — the real model. **Not run: no model credential on this machine.** Run `.venv/bin/python tools/llm_tests.py` with ANTHROPIC_API_KEY set to fill this column.

## A — clear size, orientation, tree and privacy

> My backyard is 6 by 4 metres. There is an old maple in the northwest corner, and the neighbours' kitchen window looks in over the north fence, so I need privacy there. Keep the middle open.

| reader | read by | result in the site model and brief |
|---|---|---|
| offline | offline | size 6×4 · tree **not read** · open centre · functions screen@north-edge; scrim@north-edge (alternative) · beds 3 |
| mock | mock · claude-opus-5-5 · 10 accepted, 0 changed, 0 dropped | size 6×4 · tree at [1, 3] (estimate, placed by the workspace) · open centre · functions screen@north-edge; scrim@north-edge (alternative) · beds 4 · relations 3 |
| live | not run | — |

## B — vague: an existing tree, no position, no size

> I have a small backyard with an old tree. I want it to feel open with some ecological value.

| reader | read by | result in the site model and brief |
|---|---|---|
| offline | offline | size — (sketch) · tree waits unplaced · functions ground_cover@bed-interior · beds 0 |
| mock | mock · claude-opus-5-5 · 5 accepted, 0 changed, 0 dropped | size — (sketch) · tree waits unplaced · functions ground_cover@bed-interior · beds 0 |
| live | not run | — |

## C — several spatial requirements at once: privacy, openness, partial shade

> We need privacy from the house behind us but the garden should still feel open, and it only gets sun in the morning — mostly partial shade.

| reader | read by | result in the site model and brief |
|---|---|---|
| offline | offline | size — (sketch) · conditions light part-shade · functions screen@edge-unset; scrim@edge-unset (alternative) · beds 0 |
| mock | mock · claude-opus-5-5 · 8 accepted, 2 changed, 0 dropped | size — (sketch) · conditions light part-shade · functions screen@edge-unset; scrim@edge-unset (alternative) · beds 0 · relations 3 |
| live | not run | — |

## D — change one planting bed and keep the other spatial constraints

> Make the bed along the north fence half a metre deeper, but don't let it eat into the open centre and keep the tree bed as it is.

| reader | read by | result in the site model and brief |
|---|---|---|
| offline | offline | read as a **description** — no bed changed (north bed still 5.4 m²) |
| mock | mock · claude-opus-5-5 · 3 accepted, 0 changed, 0 dropped | bed edit: {"op": "resize", "target": {"side": "north", "tree": false, "name": null}, "direction": "deeper", "amount_m": 0.5, "amount_basis": "from the number in \"Make the bed along the north fence half a metre deeper\""} → North bed 5.4 → 6.76 m²; open centre unchanged: True; tree bed unchanged: True; engine notes: 1.64 m² would overlap another bed — kept out |
| live | not run | — |

