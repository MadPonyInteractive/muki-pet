# MPI-9 checklist

Done as the bug step of MPI-7's plan (on the current code, before Phase 1).

- [x] Moment found (Fabio 2026-11-22, screenshot): any redraw while he is away from home (mid-cookie, during Claude's tool calls or another session's messages) shows the old drawing on top and the new one at home under it, for the 0.9 s swap
- [x] Fix: a new drawing keeps him hidden 0.75 s, then fades in over 0.15 s (`FADE_IN` in `draw/constants.ts`), so one robot at a time
- [x] golden re-recorded (intended), check 0, tests 22/22 (one raw-CSS test updated to .75s), validate passes
- [ ] Fabio's look in the app: no two robots; watch for a blink with no robot after a redraw
- [ ] Known, not fixed: a redraw during a cookie game ends the game (the new frame knows nothing of the click)
