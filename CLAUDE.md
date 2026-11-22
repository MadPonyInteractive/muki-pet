# Eyebot (working name)

**Start every chat by reading `docs/README.md` and the newest file in `docs/handoffs/`.** Record findings, attempts (including failures) and decisions in `docs/` as you go, so nothing is lost between chats. The mod's code is in `eyebot/`; `node tools/preview.mjs <folder>` previews the robot without the app.

Task board: `.agents/mpi-kanban/board.json`. Project profile: `.agents/mpi-kanban/project-profile.md` (Mpi-Kanban).

## Critical Rules Snapshot

- Edit the mod in `eyebot/` only; never a `~/.claude/dev-mods/` copy.
- `robotSvg()` stays pure, and motion lives in CSS keyframes: never animate through `ui.render` redraws or place him with the hook's clock.
- Every hook calls `next(e)` and returns its result untouched, inside `try`.
- Original character: no Emo / Wall-E look, no Claude branding or mascot; label it "unofficial".

A Claude Code mod: a little robot companion whose whole character is a screen face with two big expressive eyes. He reacts to what Claude Code is doing, pings the user now and then, and can chat. Think "robot pet", not "assistant".

## Design decisions (already made with the user)

- Home = his own band above the chat input (`AbovePrompt`), not a side pane (decided 2026-11-21). He has a body: two wheels, a small chassis, a thin neck and the screen head. He rolls left and right along the band; his head lags behind on a spring when he speeds up or stops. Sometimes he watches the mouse, otherwise he wanders. Smooth animation matters.
- Face = a dark rounded screen with two eyes drawn as vector shapes (SVG), not sprites. Eyes morph smoothly between moods by changing size, corner radius, and lids (top lid slides down for angry/sleepy/sad, bottom lid rises for happy). See `prototype/face.html` for the working sketch.
- Eyes blink at random intervals and drift or follow the cursor.
- Original character and name. Do not copy Emo (Living.AI) or Wall-E designs, and do not use Claude branding or the Claude mascot. Label the project "unofficial".
- Personality: playful, a bit mischievous, pet-like (robot dog energy). The user wants emotional-support company and laughs, not an assistant.
- Open source on GitHub, MIT licence, small clear core, characters and moods as plain data files so others can contribute skins and personalities.

## Target

A Claude Code mod (plugin with a hooks module that can draw in the interface). Docs: https://code.claude.com/docs/en/plugins/mods/reference

- Files: `.claude-plugin/plugin.json`, `hooks/hooks.json` (`modules` array with one path), and the hooks module exporting `register(on, options)`.
- Draw the face in a `Pane` (docked) or `AbovePrompt` (band). The `Svg` element works in Desktop and VS Code. In the terminal, use `Raster` or `Image` instead.
- Mod features are new and change between versions: generate and read the types for the installed Claude Code version before coding (see the "get the types for your build" section of the mods docs), and run `claude plugin validate` and `claude plugin test`.
- Dev loop: `claude --plugin-dir ./eyebot` reloads on save.

## Mood mapping (first pass)

| Event | Mood |
| --- | --- |
| `turn.start` | alert (eyes wide) |
| tool running (`tool.call`) | focused (slight top lid) |
| `turn.complete` success | happy |
| tool failure / error | sad |
| permission prompt / waiting for user | curious, eyes looking at the prompt |
| long idle | sleepy, then asleep |
| ping timer (`$.clock.every`) | surprised or playful, then a toast or speech bubble |

Optional later: classify the tone of Claude's last reply with `$.model.classify` and pick a mood from it.

## Milestones

1. Robot renders in the band above the prompt in Desktop: rolls around, head lag, idle blink, looks at the mouse.
2. Moods driven by turn and tool events.
3. Ping timer with a toast and a small speech bubble.
4. Chat via an Input in the pane, with the personality prompt.
5. Skins and personalities as data files, a settings panel, README, and tests.
6. Terminal fallback (Raster) and VS Code check.

## Open questions for the user

- Chat model for the companion: use the Claude Code session's model, or a separate small/local one (the user has an RTX 4060)?
- Floating always-on-top overlay later (separate helper window), or stay in-pane?
- Name for the character and the project.
