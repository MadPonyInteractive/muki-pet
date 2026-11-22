---
schema: mpi-kanban/project-knowledge-index/v1
profile: .agents/mpi-kanban/project-profile.md
last_refresh: 2026-11-22
---

# Project Knowledge Index

## How To Use

Match the topic closest to the current task. Read the listed files first. If no
topic matches, run a bounded search for the task's key terms and say what was
read. Ask the user for a pointer only if that search finds nothing.

## Topics

### Robot look, motion and games

- **Read first:** `docs/design/robot.md`, `prototype/face.html`
- **Rules:** `.agents/rules/project.md`
- **Memory:** none
- **Notes:** coin game, cookie game, props and heat are all described in `robot.md`.

### Drawing and redraws (Svg, swaps, ghosting)

- **Read first:** `docs/architecture/how-it-works.md`, `muki-pet/hooks/draw/index.ts`, `muki-pet/hooks/band/render.tsx`, `muki-pet/hooks/register.tsx`
- **Rules:** `.agents/rules/project.md`
- **Memory:** `~/.claude/projects/C--AI-Mpi-Plugins-Code-Companion/memory/MEMORY.md`
- **Notes:** iframe kept only when source, alt, width and height are identical.

### Mods API and Desktop behaviour

- **Read first:** `docs/research/mods-api.md`
- **Memory:** `~/.claude/memory/tools/claude-code-mods.md`
- **Notes:** Desktop renderer code is readable in `ion-dist.asar` (see research doc).

### Dev loop, preview and checks

- **Read first:** `docs/architecture/how-it-works.md` § Dev workflow, `tools/preview.mjs`, `tools/frame-lab.html`
- **Memory:** `~/.claude/memory/tools/claude-browser-pane.md`
- **Notes:** use the app's claude.exe for validate/test (path in the current handoff).

### History and where we left off

- **Read first:** `docs/README.md`, newest `docs/handoffs/*.md`, `docs/log/`
- **Memory:** none

## Cross-cutting

- `CLAUDE.md`
- `README.md`
- `.agents/rules/behaviour.md`, `.agents/rules/project.md`

## Topic Gaps

- No topic yet for chat, ping timer, skins/personalities, or the terminal fallback (milestones 3 to 6 in `CLAUDE.md`); add them when that work starts.
