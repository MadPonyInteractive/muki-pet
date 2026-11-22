# MPI-12 Celebrate when Fabio confirms success

Compact plan. Brief: `brief.md`.

## Steps

1. `character/confirm.ts`: `isConfirmation(text)`, pure, with tests. Short messages only (a bare "1", "works", "perfect", "looks good", ...); "it works, but..." does not count.
2. `celebrate` passing mood in `character/moods.ts`: happy face, a cheerful side-to-side jumping loop.
3. `brain/behaviours/celebrate.ts`: on `turnStart` with `confirmed`, shows `celebrate` above the usual alert/focused (priority above reaction, below a question waiting for you), timer `celebrate.end`; restarts its time on `released` like the reaction does.
4. `draw/features/celebrate.ts`: bursts behind him while the mood is `celebrate`.
5. Wiring (waits for the headset card, MPI-15, to commit these files): `register.tsx` passes `confirmed` on `turnStart`; `features/index.ts` lists fireworks; `classes.ts` gets the new class names; `golden.json` re-recorded if needed.

Ownership: see files.json

## Verification

**Verify mode:** user-ux

- `npm run check`, `claude plugin test ./muki-pet`, `node tools/golden.mjs`.
- Preview with `node tools/preview.mjs` in celebrate mood.
- Live: Fabio answers "1" to a prompt and sees the party.

## Plan Drift

- 2026-11-22: The drawing feature is `draw/features/celebrate.ts` (fireworks plus the `party`/`cheer` keyframes), and its CSS is only in celebrate drawings, so every other drawing stays byte-identical. Brain tests are in `brain/behaviours/celebrate.test.ts`, because `machine.test.ts` is held by the "pleased" mood session. The headset committed first, so the wiring was done here.

## Completed

- All five steps. Type-check clean, 49/49 tests pass, plugin validate passes with the same warnings as before. Golden: 0 of the existing drawings changed. At close-out it was re-recorded from a tree holding only MPI-12's changes, which added 168 new drawings, all of the celebrate mood (48/48 tests passed in that tree). The peer's "pleased" mood was dropped before close.

## Current State

- Done. Fabio saw it live and said "1" (2026-11-22). The "Character emotion persistence after interaction" session adds the celebrate bullet to `docs/architecture/how-it-works.md` in its own commit, and re-records `tools/golden.json` after its CSS change.
