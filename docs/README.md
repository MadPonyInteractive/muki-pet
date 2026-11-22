# Eyebot docs

What we know, what we tried, and where we left off, kept so nothing is lost between chats.
Read this index first, then the latest file in `handoffs/`.

| Folder | What goes there |
| --- | --- |
| [design/](design/) | How Eyebot looks and behaves: body, face, motion, mouse reactions. Product decisions. |
| [architecture/](architecture/) | How the mod is built: files, how the drawing works, dev workflow. |
| [research/](research/) | Facts learned about the Claude Code mods API and the Desktop app, with proof. |
| [log/](log/) | Dated record of what was tried and what happened, wins and failures. One file per day. |
| [handoffs/](handoffs/) | Where a chat stopped and what the next one should do first. Newest is current. |

## Current files

- [design/robot.md](design/robot.md): body, colours, motion, mouse reactions
- [architecture/how-it-works.md](architecture/how-it-works.md): the mod, the SVG, the dev loop
- [research/mods-api.md](research/mods-api.md): what the mods API can and can't do for us
- [log/2026-11-21.md](log/2026-11-21.md): day one
- [log/2026-11-22.md](log/2026-11-22.md): first time seen in the app
- [handoffs/2026-11-22-ghost-hunt-fixed.md](handoffs/2026-11-22-ghost-hunt-fixed.md): **current handoff** (ghost cause found: a chat opened again replays its last drawing; three fixes, not seen live)
- [handoffs/2026-11-22-ghost-hunt-cookies-built.md](handoffs/2026-11-22-ghost-hunt-cookies-built.md): previous (cookie game built; redraw logs added)
- [handoffs/2026-11-22-home-spot-cookies.md](handoffs/2026-11-22-home-spot-cookies.md): previous (home spot, props, heat)
- [handoffs/2026-11-22-coin-game-built.md](handoffs/2026-11-22-coin-game-built.md): previous (swap, coin game, heat and touch fix)
- [handoffs/2026-11-22-coin-game-plan.md](handoffs/2026-11-22-coin-game-plan.md): previous (the build plan, done)
- [handoffs/2026-11-22-moods-built.md](handoffs/2026-11-22-moods-built.md): previous (moods built)
- `tools/frame-lab.html`: draws an SVG exactly as Desktop does (same sanitizer, CSP, sandbox) for testing in the browser pane; `tools/frame-lab-ladder-test.svg` is the cookie-counting proof
- [handoffs/2026-11-22-robot-visible.md](handoffs/2026-11-22-robot-visible.md): previous (done)
- [handoffs/2026-11-22-robot-not-visible.md](handoffs/2026-11-22-robot-not-visible.md): older (done)

## Rules for these docs

- Write findings down the same day, in the right folder. A failed attempt is worth recording: say what was tried and why it failed.
- `log/` is append-only history. `design/`, `architecture/`, `research/` are kept current (edit them when something changes).
- Date everything as YYYY-MM-DD.
