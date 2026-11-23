---
schema: mpi-kanban/project-profile/v1
mode: mvp
mode_rationale: early single-developer mod on a changing API, meant to go public on GitHub; correctness over polish (user approved at init, 2026-11-22)
mode_source: user
setup_date: 2026-11-22
last_refresh: 2026-11-23
pack_version: 1.10.0
push_policy: ask
knowledge_index: .agents/mpi-kanban/project-knowledge-index.md
---

<!--
push_policy controls what `mpi-end-session` does after it commits:
  auto   push (default)
  ask    ask in one line, push on approval
  never  do not push; report the branch as unpushed
A rejected push retries once after `git fetch` + `git merge --ff-only`, then
reports. It never force-pushes and never rebases a shared tree.
-->


# Project Profile

## Project Summary

Muki is an unofficial, open-source (MIT) Claude Code mod: a
small robot pet whose face is a dark screen with two expressive eyes. He lives
in his own band above the chat input in Claude Desktop, rolls around, reacts to
what Claude Code is doing, and is there for company and laughs, not to assist.

## Architecture Summary

- The mod at `muki-pet/`: manifest `.claude-plugin/plugin.json`, `hooks/hooks.json`
  naming the hooks module `hooks/register.tsx` (wiring only: events go to the
  brain, the `AbovePrompt` band goes to `band/render.tsx`).
- `muki-pet/hooks/brain/`: pure state machine (`machine.ts`) and the runtime that
  owns its state, timers and `$.store` (`runtime.ts`).
- `muki-pet/hooks/band/`: draws the band, two-slot swap, drawing cache.
- `muki-pet/hooks/draw/`: pure `robotSvg(width, options)` (`draw/index.ts`)
  building the robot as one interactive `Svg`; motion is pre-simulated into CSS
  keyframes, mouse and click reactions are CSS strips.
- Tests: `hooks/register.test.tsx`, `hooks/brain/machine.test.ts`,
  `hooks/brain/behaviours/*.test.ts`, `hooks/character/confirm.test.ts`,
  `hooks/draw/classes.test.ts`, run by `claude plugin test`. Type-check: `muki-pet/tsconfig.json` extends the
  engine-written types in `muki-pet/.claude-plugin/types/` (git-ignored).
- `tools/`: `preview.mjs` (render without the app), `golden.mjs` +
  `golden.json` (drawings unchanged), `frame-lab.html` (draws an SVG the way
  Desktop does) and its proof SVGs.
- Root `package.json`: dev tools only (TypeScript); the mod has no dependencies.
- `prototype/face.html`: the first face sketch.

Detail: see `docs/architecture/how-it-works.md`.

## Conventions

- Mod code is edited in `muki-pet/` in this repo only; it loads in every chat
  from here via `CLAUDE_CODE_PLUGIN_DIRS`. See `.agents/rules/project.md`.
- Findings, failures and decisions go in `docs/` the same day; `docs/log/` is
  append-only. See `docs/README.md` § Rules for these docs.
- Every chat that stops mid-work leaves a dated file in `docs/handoffs/` and
  updates the list in `docs/README.md`.

## Important Commands

- `npm install` once, then `npm run check` - type-check the mod (TypeScript 7)
- `node tools/golden.mjs` - prove drawings unchanged (`--write` records a new reference)
- `claude plugin validate ./muki-pet` - validate the mod (use the app's claude.exe, path in the current handoff)
- `claude plugin test ./muki-pet` - run the mod's tests
- `node tools/preview.mjs <out-folder>` - write `robot.svg` + `index.html` to preview without the app
- `/reload-plugins` (typed in a chat) - pick up edits to `muki-pet/`
- `npm test` - all four checks in order (`tools/test-all.mjs`; set `CLAUDE` to the app's claude.exe)
- `npm run shots` - redraw the README pictures in `docs/images/` (headless Chrome); `npm run icon` - the plugin icon
- `claude plugin validate .` - validate the repo's marketplace (`.claude-plugin/marketplace.json`)

## Read First

- `CLAUDE.md`
- `docs/README.md`
- the newest file in `docs/handoffs/`
- `docs/architecture/how-it-works.md`

## Task Board Card Contract

`maturity` is a fixed enum. Never invent values and never copy a `status` or
intent word into it. Allowed values, by column:

| Column  | Allowed `maturity` |
| ------- | ------------------ |
| `todo`  | `idea`, `planned`, `research`, `needs-decision`, `blocked`, `deferred` |
| `doing` | `in-progress`, `validating` |
| `done`  | `complete`, `rejected` |

When to use `todo` values: `research` — needs investigation before planning;
`needs-decision` — understood but a user/product decision is outstanding;
`blocked` — ready but waiting on another card or an external dependency;
`deferred` — deliberately postponed, not being picked up in the current
stretch. For `done`: `rejected` — closed without being built, kept as a
record of the decision.

`status` is a separate field (e.g. `active`, `accepted`). Words like `active`,
`done`, `implementing`, and `implementation` are NOT maturity values. Words
like `Validated`, `validated`, `validation`, `spec`, `scoped`, `designed`, and
`review` are also NOT maturity values. A `doing` card under active work is
`in-progress` (renders yellow), not `implementation`, `spec`, or `idea`. Any
other `maturity` renders as a red invalid card.

## Open Gaps

- A fresh clone can't type-check: the engine-written types in `muki-pet/.claude-plugin/types/` are git-ignored (MPI-17 Phase 4).
- `docs/handoffs/` duplicates "where we left off" with the task board; decide
  whether cards or handoff files are the source of truth for open work.

## Mode Notes

- 2026-11-22: mvp. Shortcuts are fine when named as debt here or in a plan;
  the mods API changes between Claude Code versions, so read the types for the
  installed build before relying on a feature.
