# Handoff 2026-11-23: review fixes under way (MPI-17)

Replaces `2026-11-22-ghost-hunt-fixed.md` as the current handoff. Everything that one asked for was done long ago (ghosts fixed and seen clean, the redraw log removed, the cookie game checked live).

## Where things stand

- **Muki works and is seen live** in Claude Desktop: wandering with a home spot, moods from Claude's work, prop visits, heat from the context window, attention (lonely, mad, tantrum), boops, pets, the cookie game, the paper pile, the celebration, the Remote Control headset. Cards MPI-1 to MPI-15 are done (MPI-6 rejected).
- **Settled with Fabio (2026-11-22):** no chat, no model or network calls, no credits used; Desktop only (no terminal, no VS Code). Name: Muki; project, plugin and private repo `muki-pet` (github.com/MadPonyInteractive/muki-pet, branch `master`).
- **MPI-17, the codebase review's fixes** (card plan: `.agents/mpi-kanban/tasks/MPI-17/plan.md`, six phases):
  - Phase 1 (three bugs: band render safety net, heat per chat, curious ends on the asked tool) and Phase 2 (golden covers the pile and headset; the headset goes through the brain) are done, committed in 4a1a1d5. Not seen live yet.
  - Phase 3 (docs that mislead) is the one in progress: this handoff is its first step.
  - Then Phase 4 (licence, manifest, icon, fresh-clone checks, CI, reduced motion), Phase 5 (small tidying), Phase 6 (the README with pictures).
- **MPI-16** (skins as data files) is an idea in `todo`.

## Checks (all four before claiming done)

- `npm run check` (TypeScript, from the repo root; `npm install` once).
- `node tools/golden.mjs`: identical, 3,648 drawings.
- `claude plugin test ./muki-pet` (54 pass) and `claude plugin validate ./muki-pet` (passes; one warning, no icon). Use the app's own binary, the `claude` on PATH is older: `$LOCALAPPDATA/Claude-Data/claude_pzs8sxrjxfjjc/claude-code/2.1.330/9424831ad51c/claude.exe`.

## Next

1. Finish Phase 3 per the card's plan, then Phases 4 to 6 in order.
2. Fabio, when convenient: `/reload-plugins` in a chat and watch him for a while (Phases 1 and 2 changed the headset's redraws and per-chat heat).

## Gotchas

- The mpi-kanban guard hook blocks heredocs in Bash: write scripts to the scratchpad and run them by path.
- A redraw caused by play makes him jump: see `architecture/how-it-works.md` § No redraw from play.

## Paste-ready resume prompt

```
Continue MPI-17 in C:\AI\Mpi\Plugins\Code-Companion. Read docs/README.md, docs/handoffs/2026-11-23-review-fixes.md and .agents/mpi-kanban/tasks/MPI-17/plan.md first.
```
