# Handoff 2026-11-22: swap, coin game, heat and touch fix built

## Where things stand

- Steps 1 to 6 of `2026-11-22-coin-game-plan.md` are built in `eyebot/hooks/` (details in `log/2026-11-22.md` § Third chat, how it works in `architecture/how-it-works.md`, looks in `design/robot.md`).
- Checks: `claude plugin validate ./eyebot` passes (warnings: no README, no author); `claude plugin test ./eyebot` 9/9. Run them with the app's own binary: `%LOCALAPPDATA%/Claude-Data/claude_pzs8sxrjxfjjc/claude-code/2.1.321/d020ce1b5d30/claude.exe` (the `claude` on PATH is an older 2.1.309).
- Checked in the frame lab: coin dash, pickup, joy and return; heat level 3; face slide timing; touch reset; coin waking him. **Not yet seen in the Desktop app.**

## First thing next chat

Ask Fabio how it looked after `/reload-plugins`:
1. ~~Does a mood change still flicker?~~ **No: Fabio confirmed no flicker after `/reload-plugins` (2026-11-22).** Still worth asking whether he jumps along the band on a change.
2. ~~Does the coin game feel right?~~ **Yes: Fabio, live in Desktop, 2026-11-22: "Coin game feels right".**
3. Does heat show at the right level (compare with the context bar)?

## Since this handoff was written (same day)

- Motion rewritten around a **home spot** (no more clock guessing; see `log/2026-11-22.md`, last entries). Props move his home. Heat now reddens his whole body, no cheeks. Coins still return him to the spot he left (the coin game can't move home: the hook doesn't see clicks).
- Ask Fabio: does a swap still ghost or jump? It should now only when he's out on a trip at that moment.

## Next features (Fabio's, not designed yet)

- **Props for Claude's work: built 2026-11-22** (Fabio chose both: moods stay, and props pop up for him to inspect). See `design/robot.md` § Props. Not yet seen in the app: ask how they look and whether 12 s between props is right. The redraw log in `register.tsx` is still in; remove it once flicker is settled.

- **Needs attention (new, 2026-11-22):** with no attention he gets sad, or throws a temper tantrum. Open: what counts as attention, how long until sad, and what a tantrum looks like. Constraint: the hook can't see hovers, boops or coin clicks inside the frame (no script, no events out). Things the hook *can* see: turns (`turn.start`), typing (`prompt.change`, untested). Ways to see the mouse: a `Client` module laid over the band (has `onPointer`, can post to the hook; see `research/mods-api.md`), or a `Button` around the Svg (unknown whether it keeps hover working). Check those first.
- **Mad:** too many boops in a row, or being woken from sleep, makes him mad; mad = dodges your hand and rolls away. Counting boops has the same constraint as above.
- Optional: merge passing moods into the next lasting one (a "focused" frame that opens with 2.5 s of alert) to halve swaps per turn.

## Paste-ready resume prompt

```
Continue the Eyebot project in C:\AI\Mpi\Plugins\Code-Companion. Read docs/README.md and docs/handoffs/2026-11-22-coin-game-built.md first. The coin game, swap, heat and touch fix are built; ask me how they looked after /reload-plugins, then design the "needs attention" feature with me.
```
