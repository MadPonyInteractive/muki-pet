# MPI-12 Celebrate when Fabio confirms success

Fabio's idea (2026-11-22): when he confirms a task worked, he jumps around like crazy with fireworks behind him, then settles.

## Decided

- Detection is cheap and exact: no model calls. At `turn.start`, read the user's message and match a short confirmation: a bare "1" (his "looks right" answer to verify prompts), or short phrases like "works", "perfect", "looks good". Only short messages, so "it works, but..." does not count.
- After the MPI-7 refactor, no animation work before it (Fabio). Build it as a new behaviour (`brain/behaviours/`) with a passing `celebrate` mood in `character/moods.ts`, and fireworks as a drawing feature.
- Like every redraw, it waits while his mouse is over the band.

## First check

- Confirm in the generated types that `turn.start` carries the user's message text. If it doesn't, find which event does before designing further.
