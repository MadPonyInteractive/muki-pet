# Handoff 2026-11-22: robot built, not yet seen in the app

## Where things stand

- **Eyebot v0.1.0 is built** in `eyebot/`: a wheeled robot in the band above the prompt, with head lag, wandering, blinking, eyes that follow the mouse and a happy hop. It validates and passes 4/4 tests. In a browser preview everything moved as designed.
- **Nobody has seen him in the Claude app yet.**
- Fabio's usage-bar mod (`~/.claude/mods/context-bar`) was hiding him: it drew the shared band without `await next(e)`. **Fixed** (3 lines, 2026-11-21); it now stacks other mods above its bars. It still validates.
- Docs set up in `docs/`. Read `docs/README.md`, `research/mods-api.md` and `log/2026-11-21.md` for what was tried.

## How he gets loaded

He was first loaded from `~/.claude/dev-mods/7868e9e2-d445-4b7f-a93a-3f53c8ec45de/eyebot`, a folder that only that one chat loads. He now loads from this repo in every chat, like `context-bar` (step 1).

## First thing to do in the next chat

1. **Eyebot loads in every chat: DONE 2026-11-22.** Fabio said yes. `~/.claude/settings.json` → `env.CLAUDE_CODE_PLUGIN_DIRS` is now `~/.claude/mods/context-bar;C:/AI/Mpi/Plugins/Code-Companion/eyebot`, and `claude plugin list` shows `eyebot@inline  Status: loaded` from this repo's folder. **Edit `eyebot/` in this repo directly**; the old dev-mods copy is obsolete. Unknown: whether edits there hot-reload mid-chat or need a new chat (see `research/mods-api.md`).
2. **Ask Fabio for a screenshot** of the bottom of the chat. Claude can't screenshot the Claude app.
3. If he shows: check his size. The band width is `bodyColumns × 8 px` (a guess, in `eyebot/hooks/register.tsx`). If he only roams part of the band, or looks squashed or stretched, adjust `CELL_PX`.
4. If he still doesn't show, debug in this order:
   - Confirm the hook runs and on which surface: temporarily add `await $.fs.write('<scratch>/eyebot-debug.txt', JSON.stringify({ surface: e.surface, cols: e.props.bodyColumns, survey: e.props.hasSurvey, collapsed: e.props.isCollapsed }))` at the top of the hook.
   - Check the transcript for a dim `eyebot: ui.render ...` line (a refused tree).
   - Check that the band isn't collapsed (`[-]`, ctrl+x ctrl+a).
   - Try `isInteractive` off: an image instead of a frame. It animates but has no hover.

## After he shows (milestone 2)

Moods driven by events (`turn.start`, `tool.call`, `turn.complete`, errors, idle), using the mood table in `CLAUDE.md`. The band's `isWorking` prop is a free signal. Swapping the SVG source per mood restarts the frame, so check whether that flickers.

## Paste-ready resume prompt

```
Continue the Eyebot project in C:\AI\Mpi\Plugins\Code-Companion. Read docs/README.md and docs/handoffs/2026-11-22-robot-not-visible.md first. The robot mod is built and now loads in every chat, but has never been seen in the app; start at step 2 of the handoff.
```
