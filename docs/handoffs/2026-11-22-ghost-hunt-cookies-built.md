# Handoff 2026-11-22: cookie game built; ghosting is bad again

Fabio will start the next chat after setting up the MPI Kanban skills in this repo (`mpi-init`). Once that is done, this handoff is the work to pick up.

## Where things stand

- **Ghosting is the top problem.** Fabio, live, end of this chat: "a lot of ghosting": every time he opens a chat, when a task completes, and right after a prop pickup. Sometimes the old robot keeps moving, then rolls to where the new one stands and they "become one". That last picture means **the old drawing is not removed after its 0.9 s** (or a second frame survives somewhere), not only the trip problem.
- Already ruled out: two copies of the mod. `claude plugin list` shows `eyebot@inline` once (an old `~/.claude/dev-mods/<session>/eyebot` copy exists but only loads in its own session).
- Changed this chat against ghosting (helps only the trip case): no trips in the work moods (alert, focused, curious, sad, asleep), and every drawing opens with 8 to 11 s at home. Fabio's last report may or may not have had this code (a chat only picks it up when opened after the edit, or after `/reload-plugins`).
- **A temporary redraw log is in `register.tsx`** (`DEBUG_LOG`): each chat writes its own file `C:/Users/Fabio/AppData/Local/Temp/claude/eyebot-debug.log.<4-letter id>` with every swap (width, columns, isWorking) and every "drop old", plus the two slots (length and root class), the timer and mood/heat/home. **Nothing has been logged yet**: chats need `/reload-plugins` (or a fresh open) to run it.
- **Cookie game built, not seen live** (`design/robot.md` § Cookie game, `architecture/how-it-works.md` § Cookie game): cookie with bite marks and crumbs, a little chewing mouth, "^ ^"; the 6th cookie in a row makes him sick (green eyes, rainbow from his mouth into a puddle, dizzy, then home). Counting is the six-layer strip ladder, proven in `tools/frame-lab-ladder-test.svg`. Mood face is put aside during a cookie run (Fabio's "mixed emotions" report).
- Heat: Fabio said "he's red at 15%". Level 1 starts at 15% by design (reddish-brown). Ask whether level 1 is too strong or should start later; he was going to check it over 30%.
- Checks: tests 12/12, `claude plugin validate ./eyebot` passes (use the app's binary: `%LOCALAPPDATA%/Claude-Data/claude_pzs8sxrjxfjjc/claude-code/2.1.321/d020ce1b5d30/claude.exe`). Widest band 78K characters.
- Note: `register.tsx` and `robot.ts` have CRLF line endings; a Python edit that writes `'\n'` into a JS string can turn into a real line break (happened once this chat).

## Next

1. **Ghost hunt first.** Ask Fabio to `/reload-plugins` in the chat(s) he uses, then reproduce: open a chat, send a message, let a task complete, let a prop come. Then read the log files and look for:
   - a swap with no "drop old" about 0.9 s later (the timer never fires, or is restarted again and again: `swapIn` replaces the under-slot and restarts `dropOldAfter` on every change during a swap, so a stream of changes can keep the old drawing on top);
   - width or column changes on chat open (a new drawing at a different width puts home elsewhere);
   - several ids for one chat (the module loaded twice).
   If the log shows clean swaps and drops while Fabio still sees two robots, the cause is on Desktop's side (the morph keeping an old iframe when a slot Box goes from absolute back into the flow): check `ion-dist.asar` (`research/mods-api.md` § How Desktop really draws an interactive Svg).
2. Then the cookie game live: does the count feel right (clicks while he's still eating or resting count as "in a row"; about 5.5 s after he's home it resets), the rainbow, and watch for a jump when clicking while he rolls home (unknown from the lab: switching animation sets may start the dash from the last cookie spot).
3. Remove `DEBUG_LOG` from `register.tsx` once the ghost is understood.

## Other open items (unchanged)

- **Needs attention** and **mad after too many boops**: the strip ladder can count touches the same way now.
- Cookies still send him back to the spot he left (the hook doesn't see clicks).

## Paste-ready resume prompt

```
Continue the Eyebot project in C:\AI\Mpi\Plugins\Code-Companion. Read docs/README.md and docs/handoffs/2026-11-22-ghost-hunt-cookies-built.md first. The ghosting is bad: start with the ghost hunt from the handoff (ask me to /reload-plugins and reproduce, then read the redraw logs in %TEMP%\claude\eyebot-debug.log.*). Then I'll check the cookie game live.
```
