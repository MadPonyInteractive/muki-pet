# MPI-7 validation

## Parallel Batch (2026-11-22)

Run by the orchestrator on the real tree after both workers finished:

- `npm run check`: exit 0.
- `node tools/golden.mjs`: identical, 2,934 drawings, widest 91,206 characters (limit 131,072).
- `claude plugin test ./eyebot` (app claude 2.1.321): 33 pass, 0 fail (26 before + 4 brain + 3 classes; 32 after Phase 2 dropped one register test).
- `claude plugin validate ./eyebot`: passed with warnings ("No digest: it names surface modules", same as before).
- `grep "from '../draw" eyebot/hooks/brain`: empty. `draw/parts/` imports nothing from `draw/features/` (only the `SlotName` type from `draw/feature.ts`).

Brain equivalence: a scratchpad replay of 3,000 seeded random traces x 300 steps (837,736 steps, every event kind, all 5 timers) through the old and new machine with one timer scheduler: identical state after every step and identical effect sets. Effect order differs in ~11% of steps (independent timer start/cancel pairs); redraw is always last.

Golden re-record: the drawing split moved top-level CSS rules. Against a fresh `git archive HEAD` export, 990 drawings (6 widths, all moods x from-moods, heat 0-3, visits): markup outside `<style>` identical, sorted CSS rules identical (so no keyframe percentage changed). Flipped rule pairs with the same subject, same specificity and a shared non-important property: only `.vq text`/`.zz text` and `.rbs path`/`.sw path`; a nesting scan shows those groups never contain each other, so the cascade is unchanged. Timeline helper: no rounding diffs.

## Phase 2

- "Add a mood" recipe: a scratch copy with one entry added to `character/moods.ts` only renders `grumpy` with root class `m-grumpy` and its face rule.
- Mood recipe type-check: `tsc -p` on that copy exits 0.
- `register.test.tsx` rewritten to read the root class through `moodClass`/`heatLevel`/`propClass`/`K` (no class strings typed). 15 old tests -> 14; the home-loop test (parsed `@keyframes mv`) dropped, golden covers it. Passes reversed, shuffled, each alone, and the file run twice. Renaming `K.bot`, `K.visiting`, `moodClass`, `propClass`, `heatLevel` in a copy breaks no register test (only the two registry checks in `classes.test.ts`, by design). Isolation is empirical (the test host reloads the mod per test); `band/` module state is not injectable.
- Orchestrator re-run after Phase 2: `npm run check` 0; golden identical (2,934, widest 91,206); plugin test 32/32; validate passes.
- Fabio's eye-test after `/reload-plugins`: "1, looks the same" (2026-11-22).
