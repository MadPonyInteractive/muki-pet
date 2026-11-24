# Handoff 2026-11-24: play survives Claude's work (MPI-21), waiting on Fabio's live test

Replaces `2026-11-23-review-fixes.md` as the current handoff (MPI-17 and MPI-20 are done).

## Where things stand

- **The problem (Fabio):** while Claude works, play with Muki got cut: cookie counts reset (30 cookies, never sick), he snapped home, a prop trip ignored a pet, some flicker.
- **Cause:** Desktop blurs his frame on every band update (`research/mods-api.md`), ending every `:focus` state. Nothing in CSS survives it, and the "themes" update (backdrops, shaders) does not change it.
- **Done, committed (9412c55, 76d88e8), not pushed, not seen live:**
  - Hold waits `PLAY_GRACE_MS` (25 s) after play before his own redraws.
  - Prop and pile trips pause under the mouse.
  - A lost focus at the cookie: .4 s pause, then a 2.4 s roll home (`BACK`).
  - Outside the repo: `~/.claude/mods/context-bar` redraws only when a shown number moves.
- **Fabio's call (2026-11-24):** keep the cookie game as it is; a seventh cookie now and then is fine. Priority: he doesn't run away from the cookie and doesn't flicker.
- **Still possible:** a blur mid-roll-home makes him jump the rest of the way (Chromium starts no transition from an animated value).

## Next

1. Fabio tests as he works (he reloaded plugins 2026-11-24) and reports back.
2. If good: push, raise the version to 0.1.1 with a CHANGELOG entry, tag and release (all public: Fabio's go). Close MPI-21.
3. If not: start from his report; the log `log/2026-11-24.md` has every test and number.

## Paste-ready resume prompt

```
Continue MPI-21 in C:\AI\Mpi\Plugins\Code-Companion. Read docs/README.md and docs/handoffs/2026-11-24-play-vs-work.md first. Fabio's live test result: <his words>
```
