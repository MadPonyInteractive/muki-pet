# Muki (project and plugin: muki-pet)

**Start every chat by reading `docs/README.md` and the newest file in `docs/handoffs/`.** Record findings, attempts (including failures) and decisions in `docs/` as you go, so nothing is lost between chats. The mod's code is in `muki-pet/`; `node tools/preview.mjs <folder>` previews the robot without the app.

Task board: `.agents/mpi-kanban/board.json`. Project profile: `.agents/mpi-kanban/project-profile.md` (Mpi-Kanban).

## Critical Rules Snapshot

- Edit the mod in `muki-pet/` only; never a `~/.claude/dev-mods/` copy.
- `robotSvg()` stays pure, and motion lives in CSS keyframes: never animate through `ui.render` redraws or place him with the hook's clock.
- Every new drawing starts him at his home spot, so a redraw while he's out on a trip makes him jump. Never add a redraw (a brain mood, a timer) triggered by the user's play (pet, boop, cookie): his reaction to play goes in the drawing's CSS. See `docs/architecture/how-it-works.md` § No redraw from play.
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
- He draws as one interactive `Svg` in the `AbovePrompt` band, in Claude Desktop only (the terminal takes only still images, so his CSS motion can't work there).
- Mod features are new and change between versions: generate and read the types for the installed Claude Code version before coding (see the "get the types for your build" section of the mods docs), and run `claude plugin validate` and `claude plugin test`.
- Dev loop: `muki-pet/` loads in every chat through `CLAUDE_CODE_PLUGIN_DIRS`; after an edit, type `/reload-plugins` in the chat. Checks and details: `docs/architecture/how-it-works.md` § Dev workflow.

## Mood mapping

The moods and their faces are defined in `muki-pet/hooks/character/moods.ts`; what triggers them is in `docs/architecture/how-it-works.md` § Moods.

| Event | Mood |
| --- | --- |
| `turn.start` | alert (eyes wide) |
| `prompt.submit` with a short "it worked" from you (also mid-turn) | celebrate (fireworks) |
| tool running (`tool.call`) | focused (slight top lid) |
| `turn.complete` success | happy |
| tool failure / error | sad |
| permission prompt / waiting for user | curious, eyes looking at the prompt |
| long idle | sleepy, then asleep |
| no play with him for a while | lonely, then mad, then a tantrum (a pet or a cookie ends it) |

## Milestones

1. Robot renders in the band above the prompt in Desktop: rolls around, head lag, idle blink, looks at the mouse.
2. Moods driven by turn and tool events.
3. ~~Ping timer with a toast and a small speech bubble.~~ Dropped 2026-11-23 (Fabio): he doesn't talk.
4. ~~Chat via an Input in the pane, with the personality prompt.~~ Dropped 2026-11-22 (Fabio): he doesn't talk, and he uses no credits (no model or network calls); keep it that way.
5. Skins and personalities as data files, a settings panel, README, and tests. (Skins: a good idea, not started.)
6. ~~Terminal fallback (Raster) and VS Code check.~~ Dropped 2026-11-22 (Fabio): the terminal only takes still images, so his CSS motion can't work there; he stays a Desktop mod.

## Open questions for the user

- ~~Chat model for the companion~~ Settled 2026-11-22: no chat (milestone 4 dropped).
- ~~Floating always-on-top overlay later (separate helper window), or stay in-pane?~~ Settled 2026-11-22: he stays a mod in the band.
- ~~Name for the character and the project.~~ Settled 2026-11-22: the robot is Muki (Fabio's first guinea pig); project, repo and plugin are `muki-pet` (github.com/MadPonyInteractive/muki-pet, private).
