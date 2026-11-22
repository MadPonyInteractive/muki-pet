# MPI-7 checklist

Derived 2026-11-22 from `plan.md` (the large plan). The first refactor's list is at the bottom.

## Phase 0: Safety net (no behaviour change)

- [x] Golden-drawing check in `tools/golden.mjs` + `tools/golden.json`
- [x] Generated types in `eyebot/.claude-plugin/types/`, `eyebot/tsconfig.json`, root `package.json`, `npm run check`
- [x] `$: any` / `e: any` replaced with generated types; `npm run check` exits 0
- [x] Loader spike: does a `class` load?
- [x] Stale `robot.ts` names fixed in rules, profile, how-it-works.md

## Bugs on the current code

- [x] MPI-11 click does nothing (Fabio: okay, 2026-11-22)
- [x] MPI-9 ghosts: no ghosting now; the rest parked until after the refactor (Fabio, 2026-11-22)
- [x] MPI-10 cookie bites (Fabio: okay, 2026-11-22)

## Phase 1: One definition per thing (`character/`)

- [x] `character/` tables; brain no longer imports draw (golden identical, check 0, tests 26/26, validate)
- [x] Mood / Prop / heat types derived from the tables (missing face / ms / rim fails `npm run check`)

## Parallel Batch

- [x] Brain: named states + behaviours (trace-equal on 837,736 steps; tests 30)
- [x] Drawing: features, class registry, timeline (golden re-recorded for CSS order only; tests 33)

## Phase 2: Tests and contributor docs

- [x] `register.test.tsx` asserts behaviour, not CSS strings (32/32; reversed, shuffled, alone, doubled all pass; class rename breaks no register test)
- [x] how-it-works.md + how-to-add.md (mood recipe: one file, type-check 0)
- [x] Fabio eye-test after `/reload-plugins` ("1, looks the same", 2026-11-22)

## First refactor (commit 37f4866, done)

- [x] Split robot.ts into `draw/`, `brain/`, `band/`; byte-identical on 1,625 drawings; machine tests; validate + test pass
- [ ] Fabio eye-test (declined: he will look after the bugs are fixed)
