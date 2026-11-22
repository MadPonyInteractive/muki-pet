# MPI-7 checklist

Derived 2026-11-22 from `plan.md` (the large plan). The first refactor's list is at the bottom.

## Phase 0: Safety net (no behaviour change)

- [x] Golden-drawing check in `tools/golden.mjs` + `tools/golden.json`
- [x] Generated types in `eyebot/.claude-plugin/types/`, `eyebot/tsconfig.json`, root `package.json`, `npm run check`
- [x] `$: any` / `e: any` replaced with generated types; `npm run check` exits 0
- [x] Loader spike: does a `class` load?
- [x] Stale `robot.ts` names fixed in rules, profile, how-it-works.md

## Bugs on the current code

- [ ] MPI-11 click does nothing (built, waiting on Fabio's look)
- [ ] MPI-9 ghosts (built, waiting on Fabio's look)
- [x] MPI-10 cookie bites (Fabio: okay, 2026-11-22)

## Phase 1: One definition per thing (`character/`)

- [ ] `character/` tables; brain no longer imports draw
- [ ] Mood / Prop / heat types derived from the tables

## Parallel Batch

- [ ] Brain: named states + behaviours
- [ ] Drawing: features, class registry, timeline

## Phase 2: Tests and contributor docs

- [ ] `register.test.tsx` asserts behaviour, not CSS strings
- [ ] how-it-works.md + how-to-add.md
- [ ] Fabio eye-test after `/reload-plugins`

## First refactor (commit 37f4866, done)

- [x] Split robot.ts into `draw/`, `brain/`, `band/`; byte-identical on 1,625 drawings; machine tests; validate + test pass
- [ ] Fabio eye-test (declined: he will look after the bugs are fixed)
