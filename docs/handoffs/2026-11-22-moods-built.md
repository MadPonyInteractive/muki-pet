# Handoff 2026-11-22: moods built, next the coin game

## Where things stand

- Eyebot v0.1.0 in `eyebot/` loads in every chat (from this repo, via `CLAUDE_CODE_PLUGIN_DIRS`). **After any edit, Fabio types `/reload-plugins`** in the chat; no new chat needed.
- Done and liked by Fabio: the robot in the band (full width), mouse watching, hover hop, **boop and petting** (pure CSS `:active`).
- **Milestone 2 moods: built.** 8 moods driven by turn, tool, permission and idle events (`design/robot.md` § Moods). Fabio saw the faces and said they "all look okay". He hadn't yet seen them change live in the app when this was written: ask whether the change flickers, or whether the robot jumps along the band.
- Checks: `claude plugin validate ./eyebot` passes, `claude plugin test ./eyebot` 6/6.
- How moods work (new drawing per mood, `animation-delay` so he carries on from the same spot, `@starting-style` so faces slide from the old mood): `architecture/how-it-works.md` § Moods.

## Next: the coin game (Fabio's idea, 2026-11-22)

> Click somewhere he isn't: a little coin (or something else) appears there, he races over really fast, collects it, and gets happy.

Hard part: the robot's frame has no scripts and doesn't send clicks to the mod, and his route is pre-made keyframes. Options to investigate, in order:

1. **CSS only, with `:focus`.** Give a row of fixed cells across the band (say 24 px wide) `tabindex="0"`. A click focuses one, and `:focus` stays after the button is let go, unlike `:active`. `.cellK:focus` shows the coin in cell K. First check that the frame's sanitizer keeps `tabindex` and that `:focus` works there. The hard bit: the dash. CSS doesn't know where he is when the click lands, so `.cellK:focus ~ g .mv{animation:none;transform:translateX(K)}` snaps instead of racing. Possible trick: a dash keyframe per cell, from "wherever" via a wrapper group. Needs thought.
2. **Tell the hook about the click, then redraw.** If the hook learns the click (and roughly where), it knows his position (loop time + the simulation in `robot.ts`) and can draw a new SVG: coin at x, a fast dash from his spot to it, a collect pop, then happy. Ways to get the click out: wrap the `Svg` in a `Button` (the Svg types say "presses that other plugins should observe go on an enclosing element"). It's unknown whether a Button gives a position or keeps hover working. Another way: a `Client` module (it has `onPointer` with positions and can post to the hook) laid over or beside the band. `Client` can't draw `Svg` itself; see `research/mods-api.md`.
3. Whatever wins: the coin can be any small pickup (coin, star, bolt, treat). He should sprint (fast wheels, head lag pushed hard), pop the coin with a sparkle, then do the happy mood.

## After that

- Milestone 3: the ping timer with a toast and a speech bubble.
- Ideas not built: wake him when Fabio types (`prompt.edit`/`prompt.change`), skip the wiggle on mood changes, an angry face.

## Paste-ready resume prompt

```
Continue the Eyebot project in C:\AI\Mpi\Plugins\Code-Companion. Read docs/README.md and docs/handoffs/2026-11-22-moods-built.md first. Moods are built; first ask how they looked live after /reload-plugins, then work out and build the coin game (click where he isn't, a coin appears, he races to collect it and gets happy).
```
