# Make Eyebot easy to change: type-check, one definition per thing, a real state machine, pluggable behaviours and drawing features

Written 2026-11-22 after reviewing the first refactor (commit 37f4866). Planning only: nothing here is built yet.

## Current State

Project mode: `mvp`. Card MPI-7, in `doing`. Phase 0 and the first bug step committed (d614144). **MPI-10 and MPI-11 closed 2026-11-22** (Fabio confirmed both). **MPI-9 second fix built 2026-11-22 (uncommitted, not seen live):** Fabio's two reports after reload showed the jump home on any redraw while he's away, plus the 0.75-0.9 s overlap. Fabio's pick: while his mouse is over the band, Claude's events have no effect. Built as a hover sensor (`band/sensor.ts`, a `Client` the band's hover squeezes to 0 wide; `ui.message` hook; brain `near` event + `nearHold`, 3 s grace); seen working live (log `near on`/`near off`). `FADE_IN` .9s made him flicker on every redraw, so it is back to .75s. A click on him mid-cookie snapped him home (in-frame, not a redraw): now it's another cookie (`.c:focus~.bot .p{pointer-events:none}` + centre strip). **Fabio's look (2026-11-22, after reload): no ghosting now; being sick after many cookies works. But he can't click or pet him while he eats or rolls home (each click is another cookie), and he said "forget about giving him cookies in a row" so clicking and petting aren't mixed up with cookies.** Open question for him: does that mean dropping the in-a-row ladder entirely (which is what makes him sick), or only that a click ON him mid-game should not be a cookie (boop/pet instead, accepting the snap home, or a better fix)? Ask before changing. MPI-9: Fabio sees no ghosting and will report if teleporting returns; close it with that note. **/reload-plugins only reloads the chat it is typed in.** Next: Fabio's look in a reloaded chat, then close MPI-9, then Phase 1. Every change must keep `npm run check` 0 and `node tools/golden.mjs` identical unless the fix is meant to change drawings (then `--write` and list why).

**What the first refactor gave us (keep):**

- `eyebot/hooks/register.tsx` (68 lines) only wires Claude Code events to the brain.
- `brain/machine.ts` is a pure `step(state, event, now) -> state + effects`, with 8 tests. Effects are data (start/cancel timer, redraw, save home); `brain/runtime.ts` carries them out. This is the right skeleton.
- `band/` holds the double buffer and the drawing cache; `draw/` is 15 small pure files, proven byte-identical to the old `robot.ts` on 1,625 drawings.

**What the review found (the reasons for this plan):**

1. **It is TypeScript, but nothing checks the types.** Every file is `.ts`/`.tsx`, yet there is no `tsconfig.json`, no `package.json`, no compiler on the machine, and the host objects are typed `any` (`$: any`, `e: any`, 9 places in `brain/runtime.ts` and `band/`). A typo in an event name or a store key is found only by running it. The context-bar mod already has the answer: a `tsconfig.json` that extends generated types in `.claude-plugin/types/`.
2. **The "state machine" is a bag of flags.** `State` has `base`, `flash`, `asking`, `visit`, `deferred`, `visitEndSet`, and which one wins is hard-coded in `feeling()`. There are no named states and no transition table. A new behaviour (MPI-5 boop anger, pings, chat) means editing `State`, `Event`, the `switch`, the helper closures, `config.ts`, `band/drawing.ts`, `RobotOptions` and the drawing: seven places.
3. **Each thing is defined in several files.** A mood: its name and face in `draw/moods.ts`, its duration in `brain/config.ts`, whether it is lasting or passing only implied by the machine, whether he stays home in `STILL`. A prop: shape in `draw/props.ts`, tool mapping in `brain/config.ts`. Heat: thresholds in `config.ts`, looks as hard-coded colour strings in `draw/heat.ts`.
4. **The brain imports the drawing** (`machine.ts` imports `visitPlan`, `Mood`, `Prop` from `draw/`). The arrow should point the other way: both should read shared definitions.
5. **Drawing features are not pluggable.** Heat, sick, touch, visit and cookies each reach into `draw/body.ts` (`sweat()`, `rainbow()`, `puddle()`, `hearts()`, `overHead()`), `draw/index.ts` and the CSS. They are tied together by short CSS class names typed as strings in many files; one collision already happened (`.b1`/`.b2` were both the blink and the cookie bites).
6. **Animation sequences are hand-written keyframe maths.** `draw/visit.ts` and `draw/cookies/eating.ts` build timelines from magic numbers (`A + 1.45`, `calc(var(--t) + 7.4s)`). Changing "he looks at the prop a bit longer" means editing six tracks.
7. **The safety net is gone.** The golden-drawing script that proved the first refactor lived in a scratchpad and no longer exists. `register.test.tsx` (290 lines) asserts on raw CSS strings, so it breaks on any drawing refactor even when nothing visible changed. Tests also rely on module state carrying over from one test to the next.
8. **Small leftovers:** `note()` runs the machine with `now = 0`; store reads live in `band/render.tsx` instead of the runtime; `.agents/rules/project.md`, the project profile and parts of `how-it-works.md` still say `robot.ts`.

**Hard limits any design must respect:**

- Mod loader: a hook passed to `on()` must be a top-level function declaration, and `$` may only be passed to top-level function declarations in the mod's own files. So **no class may hold `$` or take it in a method**. Classes are fine for pure code that returns effects as data. (Whether the loader accepts `class` syntax at all in these files is unverified: Phase 0 checks it.)
- The frame has no script. Inside one drawing, "animation states" are CSS selectors (`:hover`, `:focus`, `:active`, root classes), not code. So there are two machines: the **brain** (code, decides which drawing) and the **in-frame** one (CSS, generated from data). A class-based animation state machine can only exist on the brain side; the in-frame side can be *described* as data and generated.
- `robotSvg()` stays pure; SVG under 131,072 characters; alt constant; every hook passes `next(e)` through.

## Target design

```
eyebot/hooks/
  register.tsx        wiring only (as now)
  character/          WHAT HE IS, as data. One definition per thing.
    moods.ts            each mood: name, kind (lasting | passing), how long, stays-home, face rules
    props.ts            each prop: name, shape, which tools drop it
    heat.ts             each level: from which %, colours, lid droop, sweat
    palette.ts          colours, sizes (the skin)
    tuning.ts           timings: sleep, prop gap, swap, lead-in
    geometry.ts         bandX, visitPlan (pure, used by brain and draw)
  brain/              WHAT HE DOES. Code state machine.
    machine.ts          core: runs the activity table + the behaviour list, collects effects
    activity.ts         named states (idle, working, asking, sleepy, asleep) and a transition TABLE
    behaviours/         one file per behaviour, all the same shape
      reaction.ts         passing moods (alert, happy, sad)
      visit.ts            prop visits
      (later) ping.ts, boop.ts, chat.ts
    runtime.ts          state, timers, store, carries out effects (the only brain file that touches $)
  draw/               HOW HE LOOKS. Pure.
    compose.ts          robotSvg: puts the parts and features together
    classes.ts          every CSS class name, once, as named constants (test: all unique)
    timeline.ts         named cues -> keyframe tracks (used by visit, eating, sick)
    parts/              body, head, face, wheels
    features/           one file per feature, all the same shape: heat, sleep, touch, visit, cookies/
    wander.ts, keyframes.ts, math.ts
  band/               WHERE HE IS SHOWN. render, frames, drawing cache
```

**The two shapes everything plugs into:**

- `Behaviour` (brain): `{ name, initial(), on(event, slice, ctx) -> { slice, effects }, mood?(slice) -> { mood, priority }, drawing?(slice) -> options }`. The core keeps one state slice per behaviour, namespaces its timers, asks each for a mood and shows the highest priority. Adding boop anger = one new file + one line in the list.
- `Feature` (draw): `{ name, rootClass?(options), css(ctx), defs?, slots: { head?, overHead?, behind?, front?, ground? } }`. `compose.ts` loops over the list. Adding a feature no longer edits `body.ts`.

**On classes and inheritance (Fabio asked for them):** my recommendation is interfaces plus plain objects in a list for moods, props, heat levels and drawing features (they are data; a contributor adds a skin by adding an entry, with no class to extend), and **classes only for behaviours**, where there is real shared logic: an abstract `Behaviour` base with default no-op methods that `VisitBehaviour`, `ReactionBehaviour`, later `PingBehaviour` extend. Deep inheritance trees are what make a codebase hard to change; a flat "base + one level" keeps the class feel without that. This is Decision 1 below.

## Decisions (settled by Fabio, 2026-11-22: all three recommended picks)

Settled: 1 = A (classes one level deep for behaviours only, data tables elsewhere; still subject to the Phase 0 loader spike), 2 = root `package.json` with TypeScript, 3 = Phase 0, then MPI-9 and MPI-10 on the current code, then Phases 1 onward. Fabio also said the first refactor still shows issues after `/reload-plugins` and he will not eye-test it again as it is; which issues is not yet recorded (ask at the start of the bug step).

The options as they were put:

1. **Class style.** Pick A (recommended): data tables + interfaces everywhere, classes one level deep for behaviours only. Pick B: classes everywhere (Mood, Prop, Feature as classes with inheritance). B costs more code and makes data-file skins harder.
2. **Type-check tooling.** Recommended: a `package.json` at the **repo root** (not inside `eyebot/`, so the mod itself stays dependency-free) with `typescript` as a dev dependency and an `npm run check` script. Needs `npm install` once (free, about 25 MB in `node_modules`, git-ignored).
3. **Order against the open bugs.** Recommended: Phase 0 first, then fix MPI-9 (ghosts) and MPI-10 (cookie bites) on the current code, then Phases 1 to 5. Refactoring over a live visual bug makes it hard to tell which change did what.

## Completed

- [x] Review of commit 37f4866 and this plan (2026-11-22).
- [x] Phase 0 (2026-11-22, not committed): golden check in the repo (2,934 drawings), type-check on (TypeScript 7.0.2, `npm run check` 0 after 26 index-access fixes, all type-only), host objects typed, class spike passed (classes load), stale `robot.ts` names fixed. Log: `docs/log/2026-11-22.md` § MPI-7 Phase 0.

## Remaining Work

## Phase 0: Safety net (no behaviour change)

- [x] Put the golden-drawing check in the repo: `tools/golden.mjs` runs `robotSvg` and `visitPlan` over the option matrix (widths, moods, from-moods, heat, home, visits at several elapsed times) and writes or compares hashes in `tools/golden.json`. **Verify:** `node tools/golden.mjs` prints "identical" on a clean tree, and fails when one colour in `draw/constants.ts` is changed and changed back.
- [x] Generate the Claude Code types for the installed build into `eyebot/.claude-plugin/types/` (mods docs, "get the types for your build"); add `eyebot/tsconfig.json` extending them, strict; add root `package.json` with `typescript` and `npm run check` (`tsc --noEmit -p eyebot`). Depends on Decision 2. **Verify:** `npm run check` runs and its error list is recorded in `docs/log/`.
- [x] Replace every `$: any` / `e: any` with the generated types; fix what the compiler finds. **Verify:** `npm run check` exits 0; `claude plugin test ./eyebot` 22/22; `claude plugin validate ./eyebot` passes; golden identical.
- [x] Loader spike: a throwaway branch of the code with one `class` in `brain/` (no `$` inside) and the root `package.json` present. **Verify:** validate and test pass and the mod still loads after `/reload-plugins`; result written to `docs/research/mods-api.md`. If classes fail to load, Decision 1 becomes "objects only" and the plan says so in Plan Drift.
- [x] Fix the stale names: `.agents/rules/project.md`, `project-profile.md`, `how-it-works.md` (`robot.ts` -> `draw/`), add `npm run check` and `node tools/golden.mjs` to the checks. **Verify:** `grep -rn "robot\.ts" .agents docs/architecture CLAUDE.md` returns only history.

## Phase 1: One definition per thing (`character/`)

Sequential: it moves names that both `brain/` and `draw/` import.

- [ ] Create `character/moods.ts` (name, kind, duration, stays-home, face rules in one table), `props.ts` (shape + tools), `heat.ts` (levels table: threshold, colours, droop, sweat; `heat.ts` CSS generated from it), `palette.ts`, `tuning.ts`, `geometry.ts` (`bandX`, `visitPlan`). `brain/config.ts`, `draw/constants.ts`, `draw/props.ts` and the data half of `draw/moods.ts` empty into them. `brain/` no longer imports from `draw/`. **Verify:** golden identical; `npm run check` 0; tests 22/22; `grep -rn "from '../draw" eyebot/hooks/brain` is empty.
- [ ] Type-level guard: `Mood`, `Prop` and heat level types are derived from the tables, so a mood missing a face or a duration is a compile error. **Verify:** temporarily delete one mood's face entry, `npm run check` fails naming it; restore.

## Parallel Batch: brain and drawing (after Phase 1 and Decision 1)

Disjoint folders, so two workers can run at once (`mpi-execute-parallel`, shared checkout, no worktrees).

- [ ] **Brain: named states + behaviours.** `brain/activity.ts` with the states and a transition table (state x event -> state); `brain/behaviours/reaction.ts` and `visit.ts` behind the `Behaviour` shape, each with its own state slice and timers; `machine.ts` becomes the core loop (activity, then behaviours, mood by priority, the "redraw waits for a visit" rule expressed once as a behaviour holding the redraw). `runtime.ts` gains `createBrain()` so tests start from a fresh state, takes over the store reads from `band/render.tsx` as effects, and `note()` with `now = 0` goes. Ownership: `eyebot/hooks/brain/**`, `eyebot/hooks/band/render.tsx`, `eyebot/hooks/band/drawing.ts`. Briefings: project, behaviour. **Verify:** the 8 machine tests pass unchanged in meaning (same event sequences, same moods and effects), plus one new test per behaviour and one for the transition table; a recorded event trace replayed through old and new machine gives the same sequence of (mood, heat, home, visit, redraw); `npm run check` 0.
- [ ] **Drawing: features, class registry, timeline.** `draw/classes.ts` (every class name once; test that values are unique); `draw/timeline.ts` (named cues -> tracks); `Feature` shape and `draw/compose.ts`; move heat, sleep, touch, visit, cookies into `draw/features/`, body pieces into `draw/parts/`; `body.ts` no longer imports any feature. Ownership: `eyebot/hooks/draw/**`, `tools/preview.mjs`, `tools/golden.mjs`. Briefings: project, behaviour. **Verify:** golden identical for every step that only moves code; where the timeline helper changes rounding, the diff is limited to keyframe percentages, listed in `validation.md`, and looked at in `tools/frame-lab.html`; widest band still under 131,072 characters; `npm run check` 0.

## Phase 2: Tests and contributor docs

- [ ] Rewrite `register.test.tsx` to assert behaviour (which mood class is on the root, one Svg, shared band, swap timing) instead of raw CSS strings; drawing details are covered by golden + small unit tests per feature. No test depends on another's leftover state. **Verify:** tests pass when run alone and in any order; renaming one CSS class in `classes.ts` breaks no test.
- [ ] `docs/architecture/how-it-works.md` rewritten to the new map, plus `docs/architecture/how-to-add.md`: add a mood, a prop, a heat level, a behaviour, a drawing feature, each as a short recipe with the files touched (target: one or two files each). **Verify:** follow the "add a mood" recipe for a throwaway mood; it shows in `node tools/preview.mjs` with edits in `character/moods.ts` only; revert.
- [ ] Fabio eye-test after `/reload-plugins`: nothing looks different from before this plan. **Verify:** his "1".

## After this plan (separate cards, not part of it)

MPI-9 ghosts, MPI-10 cookie bites, MPI-8 / MPI-4 heat retune (becomes an edit to the heat table), MPI-6 cookies and home, MPI-5 boop anger (first new behaviour file), MPI-3 debug log removal, then pings, chat, skins as data files.

## Plan Drift

- 2026-11-22: the engine does not write types for a `CLAUDE_CODE_PLUGIN_DIRS` mod; they were copied from the old dev-mods copy (2.1.321). TypeScript 7.0.2 (latest) used, not 5.x. The class spike was proven with `claude plugin test` (engine host), not `/reload-plugins`; the reload is Fabio's.
- 2026-11-22: the CRLF rule was stale (all of `eyebot/` is LF); rules updated.

## Verification

**Verify mode:** auto (Phases 0, 1 and the batch are proven by golden drawings, the type-check and tests). The last task of Phase 2 is `user-ux`.

End to end: `npm run check` exits 0; `claude plugin validate ./eyebot` passes; `claude plugin test ./eyebot` all pass; `node tools/golden.mjs` identical (or the listed timeline-rounding diffs only); the "add a mood" recipe works in one file; Fabio sees no difference in the app.

## Preservation Notes

- `docs/research/mods-api.md`: loader spike result (classes, `package.json` beside the mod), where the generated types come from.
- `docs/log/2026-11-22.md`: this review's findings.
- `.agents/rules/project.md`: new rules once true: "one definition per thing in `character/`", "class names only from `draw/classes.ts`", "brain never imports draw", "run `npm run check` and `node tools/golden.mjs` before claiming done".
- CRLF note in the rules names two files that no longer exist as such: recheck which files are CRLF.
- Project memory: nothing new yet.
