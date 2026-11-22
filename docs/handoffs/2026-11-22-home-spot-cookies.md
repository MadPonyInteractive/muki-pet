# Handoff 2026-11-22: home spot, props, heat; next the cookie game

## Where things stand

- Built and seen by Fabio in the Desktop app this day: double-buffered swaps (no flicker between moods), coin game ("feels right"), heat, touch reset, prop visits, curious face during visits.
- **Motion now runs around a home spot** (`design/robot.md` § Motion, `architecture/how-it-works.md` § Moods, Continuity). Every drawing starts him resting at home, so swaps no longer depend on the hook guessing his place in time. Fabio: "I don't think there's any more ghosting".
- **One ghost seen right after `/reload-plugins`** (new robot in the centre, old one elsewhere, then they merged). Likely cause: the reload wiped the mod's memory, so a prop-moved home went back to the centre while the pre-reload drawing still had the old home. Fix in place, **not yet seen live**: home is saved with `$.store` (key `home`) and read at the first draw. Ask Fabio whether it still happens after a reload. If it also happens without a reload, the next suspect is a swap while he's out on a trip (at most 220 px); then consider shorter trips or longer rests.
- **Later the same chat (after Fabio's report: a prop came in, he teleported, then ghosted in place with only his head moving; and at 40% no visible heat):** (1) every new drawing played start-up motion under the old one still on top (the release wiggle, mood hops, the visit's head turn), so parts outside the old robot's outline showed twice. Fixed: the wiggle is now a release-only spring transition, mood hops wait 1 s, and a visit waits 1 s (`LEAD` in `robot.ts`) before anything moves. (2) Trips cut to 20 to 80 px, so a swap while he's out jumps him at most that far. (3) Heat levels moved to 15/25/35% with stronger reds, and the level is read on every redraw like the context bar does (saved in `$.store` for after a reload). Tests 12/12. **None of these seen live yet:** ask Fabio first.
- Heat: whole body reddens by level (no cheeks). Fabio's context was high at the end of this chat ("it's getting too red, poor fellow"), which is why this handoff exists.
- The temporary redraw log is removed.
- Checks: `claude plugin validate ./eyebot` passes (warnings: no README, no author); `claude plugin test ./eyebot` 12/12. Use the app's own binary: `%LOCALAPPDATA%/Claude-Data/claude_pzs8sxrjxfjjc/claude-code/2.1.321/d020ce1b5d30/claude.exe` (the `claude` on PATH is 2.1.309).
- Frame lab tip: when the browser pane is hidden, animations freeze and `:focus` doesn't match; seek animations by script (`getAnimations()`, `currentTime`) and swap `:focus` for a class in the frame's `<svg> <style>` (see `research/mods-api.md` § Unknowns). For Fabio, galleries made with `robotSvg` and sent as an HTML file work well; loop them with CSS (`animation-iteration-count: infinite`), since a page reload doesn't work in the side panel.

## Next: the cookie game (Fabio's idea, 2026-11-22)

> Instead of a coin, give him a cookie. If he eats too many cookies in a row (more than five), he throws up. Maybe a rainbow throw-up, with a little mouth. "See what you can come up with."

Plan sketch:

1. **Cookie instead of coin:** swap the `#cn` coin def for a cookie (round, light brown, darker chips; no spin, maybe a little bob). Eating instead of collecting: at pickup the cookie shrinks in bites (two or three bite marks, crumbs falling), his eyes go "^ ^", a chewing wiggle on the head.
2. **A mouth:** he has none yet (eyes only). Add a small mouth shape on the screen that is hidden normally and shows for chewing and for the throw-up. Keep the "screen face" style: drawn in the eye colour.
3. **Throw up after more than five in a row:** a rainbow arc out of the little mouth (stripes in a few colours, drawn as a growing path or a stretched band), green-ish face or wobbly eyes, then he's sad or dizzy for a bit.
4. **The hard part: counting.** The frame has no script and the hook doesn't see clicks, so "five in a row" must be counted in CSS. Ideas to test in the frame lab:
   - **A ladder of strip layers:** strip layer k is only clickable (`pointer-events`) while a strip in layer k-1 has focus, so each click during a running sequence moves focus one layer up. Layer 6 plays the throw-up. "In a row" = each click before the previous cookie's sequence ends. Size: the strips are most of the SVG; six full copies won't fit under 131,072 characters, so upper layers need fewer, wider strips (e.g. 12 per side), or one shared set with `:has()` checks.
   - **`:has()` on the root** to read which layer is focused (`svg:has(.L3:focus) ...`), so one rule set can drive the face.
   - **Hook-side counting** would need clicks to reach the hook (a `Client` pointer sensor, unproven), and every redraw is a swap.
   Pick the ladder if it works in the lab.
5. The same counting trick answers the open "mad after too many boops" question.

## Other open items (unchanged)

- **Needs attention** (sad or a tantrum when ignored) and **mad** (too many boops, woken from sleep): not designed. Both need some way to count or notice touches; see the counting ideas above.
- Coins still send him back to the spot he left (the coin game can't move his home: the hook doesn't see clicks).

## Paste-ready resume prompt

```
Continue the Eyebot project in C:\AI\Mpi\Plugins\Code-Companion. Read docs/README.md and docs/handoffs/2026-11-22-home-spot-cookies.md first. First ask me whether he still ghosts or jumps (at mood changes, props, and after /reload-plugins) and whether the heat looks right. Then build the cookie game from the handoff: cookie instead of coin, a little mouth, and a rainbow throw-up after more than five cookies in a row (work out the CSS counting in the frame lab first).
```
