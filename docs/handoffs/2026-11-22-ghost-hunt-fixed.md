# Handoff 2026-11-22: ghost hunt, cause found, three fixes (not seen live)

## Where things stand

- **Cause found** (`log/2026-11-22.md` § Ghost hunt, `research/mods-api.md` § How Desktop really draws): the hook drops every old drawing on time (redraw logs), and Desktop's morph removes it. The ghosts come from **opening a chat**: Desktop rebuilds the band and first draws the chat's last drawing as brand-new frames, so it restarts (a finished prop visit replays its trip toward the new home), and the hook's first renders (always 784 px, then 792 px) kept that stale frame on top for another 0.9 s.
- **Fixed in `register.tsx` / `robot.ts`:** a width change replaces the drawing with no old one on top; after every visit the band switches to the plain drawing at the new home; visit lead-in 1.5 s (was 1). Tests 14/14, validate passes.
- **Not seen live.** Fabio needs `/reload-plugins` in each open chat (or open a fresh one), then: open chats, send a message, let a task finish, let a prop come.
- `DEBUG_LOG` (temporary redraw log in `register.tsx`) is still in, for this check.
- Known, by design: sending a message while he's out on a trip (neutral or happy mood) can still show two robots for 0.9 s.

## Next

1. Fabio's eye-test. If a ghost remains, ask which of the moments it was and read the newest `%TEMP%/claude/eyebot-debug.log.*` around that time.
2. If clean: remove `DEBUG_LOG` (card MPI-3), then the cookie game live check (MPI-2).

## Paste-ready resume prompt

```
Continue the Eyebot project in C:\AI\Mpi\Plugins\Code-Companion. Read docs/README.md and docs/handoffs/2026-11-22-ghost-hunt-fixed.md first. I reloaded and checked the ghost fixes: <what I saw>.
```
