# Handoff 2026-11-22: robot visible in the app

## Where things stand

- **Fabio has seen Eyebot in the Desktop band above the prompt and likes him** ("it looks awesome"). He loads in every chat from this repo's `eyebot/` (see the previous handoff, step 1). Edit `eyebot/` here directly.
- v0.1.0: validate passes, tests 4/4.
- Fabio confirmed: full band width, mouse watching and the happy hop all work in the app. `CELL_PX = 8` is fine.
- Touch reactions added 2026-11-22 (boop and petting, `design/robot.md` § Touch). Not yet eye-tested in the app.
- After an edit to `eyebot/`, Fabio types `/reload-plugins` in the chat to see it (confirmed). No new chat needed.

## Next

1. Boop and petting: Fabio says they feel great.
2. **Milestone 2 moods: built 2026-11-22, not yet seen in the app.** Get Fabio's eye-test after `/reload-plugins`: does a mood change flicker, does he jump along the band, are the faces readable? Tune `MOOD_RULES` in `robot.ts` and the timings in `register.tsx`.
3. Then milestone 3: the ping timer with a toast and a speech bubble.
4. Ideas not built: wake him when you type (`prompt.edit`/`prompt.change`), skip the wiggle on mood changes, an angry face.

## Paste-ready resume prompt

```
Continue the Eyebot project in C:\AI\Mpi\Plugins\Code-Companion. Read docs/README.md and docs/handoffs/2026-11-22-robot-visible.md first. Eyebot shows in the app with touch reactions and moods; get Fabio's eye-test of the moods, then milestone 3.
```
