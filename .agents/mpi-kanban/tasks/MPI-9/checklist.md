# MPI-9 checklist

Done as the bug step of MPI-7's plan (on the current code, before Phase 1).

- [x] Moment found (Fabio 2026-11-22, screenshot): any redraw while he is away from home (mid-cookie, during Claude's tool calls or another session's messages) shows the old drawing on top and the new one at home under it, for the 0.9 s swap
- [x] Fix: a new drawing keeps him hidden 0.75 s, then fades in over 0.15 s (`FADE_IN` in `draw/constants.ts`), so one robot at a time
- [x] golden re-recorded (intended), check 0, tests 22/22 (one raw-CSS test updated to .75s), validate passes
- [ ] Fabio's look in the app: no two robots; watch for a blink with no robot after a redraw
- [ ] Known, not fixed: a redraw during a cookie game ends the game (the new frame knows nothing of the click)
- [ ] Fabio 2026-11-22 (reloaded chat): cookie during a redraw, then a fast return home and a little ghosting at the end. Wants him to stay where he ate and idle there (with MPI-6).
- [ ] Fabio 2026-11-22 (reloaded chat): sending a message with the mouse entering him: ghost + teleport about 100 px right. A redraw while he is away from home still jumps him home, and the fade overlap still shows two.
- [x] Fix 2 (Fabio's pick, 2026-11-22): `FADE_IN` .9s (no overlap); hover sensor (`band/sensor.ts`, a `Client` squeezed by the band's hover) holds every redraw and prop drop while his mouse is over the band, 3 s grace after it leaves (`NEAR_GRACE_MS`)
- [x] Checks: check 0, tests 26/26 (4 new; muting the sensor fails the end-to-end one), golden re-recorded (only FADE_IN differs), validate passes
- [ ] Fabio's look after /reload-plugins: redraw log shows `near on`/`near off` as the mouse goes over and off him; cookie while Claude works: no jump home while the mouse stays; no two robots; note any blink
- [ ] Remove the `near` log lines with the rest of the redraw log (MPI-3)
- [x] Sensor seen working in Desktop (2026-11-22, log r72q): `near on`/`near off` as the mouse came and went; the held redraw landed 3.0 s after `near off`
- [ ] Fabio 2026-11-22: cookie, let him finish, click on him while he rolls home: he teleports home. Not a redraw (none in the log). In-frame: the click focuses a touch strip (`.p`, inside `.bot`), the cookie strip loses focus, the `homeA/B/C` roll animation (`draw/cookies/eating.ts`) is dropped mid-way, and Chromium snaps instead of transitioning from an animated value. Fabio's pick: a click on him mid-game is another cookie.
- [x] Built: `.c:focus~.bot .p{pointer-events:none}` + centre strip `c0`; frame lab hit test: in a game his body hits the next layer's strip, outside a game `.p`
- [x] Fabio: "flickering a lot" while Claude worked: `FADE_IN` .9s blinked him out on every redraw; back to .75s
- [ ] Fabio's look: no flicker while Claude works; click on him mid-roll = another cookie, no teleport; no two robots
- [x] Fabio 2026-11-22 (after reload): no ghosting, being sick works.
- [ ] **Fabio's decision 2026-11-22:** a click ON him must always do the same thing, a boop/pet, also while he eats or rolls home. A cookie only ever comes from clicking an empty spot. So undo "click on him mid-game = cookie" (`.c:focus~.bot .p{pointer-events:none}`), and solve the snap home it causes another way. The in-a-row ladder (sick) stays.
- [ ] **Fabio 2026-11-22: cookies fail while Claude is thinking or running tools.** Sometimes he reaches the cookie and goes straight back to where he was; other times he never reaches it and is teleported back. So the hover hold does not cover a cookie game during Claude's work (teleporting is back; card stays open).
- [ ] **Parked by Fabio 2026-11-22:** no animation or behaviour fixes until the MPI-7 refactor is done. Pick this up after it, in the new structure (cookies as a behaviour + feature).
