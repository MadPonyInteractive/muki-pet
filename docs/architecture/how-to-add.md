# How to add things to Eyebot

Short recipes, each with the files it touches. The map of the code is in `how-it-works.md`. After any recipe run the four checks: `npm run check`, `node tools/golden.mjs` (a new mood, prop or level adds drawings: run it with `--write` and say so), `claude plugin test ./eyebot`, `claude plugin validate ./eyebot`. Then `/reload-plugins` in a chat to see it.

## A mood (one file)

`eyebot/hooks/character/moods.ts`: add an entry to `MOOD_TABLE`.

```ts
grumpy: {
  kind: 'passing',   // 'lasting' holds until something changes it; 'passing' shows for ms, then goes
  ms: 2500,          // passing only; the type makes it required
  still: true,       // he stays home while he feels it
  face: [
    ['.top', 'transform:translateY(5px)'],
    ['.eye', 'transform:scaleY(.8)'],
  ],
},
```

`face` rules use only the face classes listed at the top of the file (`.eye`, `.eyeL`, `.eyeR`, `.top`, `.topL`, `.topR`, `.lid`, `.gz`, `.pt`, `.hop`); `draw/classes.test.ts` fails on any other. The `Mood` type, the root class (`m-grumpy`) and the slide between faces come for free. Try it with `robotSvg(760, { mood: 'grumpy' })`.

Something must still *choose* the mood: a passing mood is shown by a behaviour (see "A behaviour", or add a `case` in `brain/behaviours/reaction.ts`); a lasting one by an activity state (`FEEL` in `brain/activity.ts`).

## A prop (one file)

`eyebot/hooks/character/props.ts`: add an entry to `PROP_TABLE` with `tools` (Claude Code tool names that drop it), an optional `match` regex for tools not listed, and `shape` (SVG markup standing on the ground at x = 0, about 20 px tall). The visit, its timing and the `p-<name>` root class come from the existing visit code.

## A heat level (one file)

`eyebot/hooks/character/heat.ts`: add an entry to `HEAT_LEVELS` (keep them in rising `from` order): `from` (context %), `bezel`, `chassis`, `rim`, `tyre` colours, `droop` (px the top lids drop), `sweat` (0, 1 or 2 drops). `MAX_HEAT`, `heatOf` and the CSS (`draw/features/heat.ts`) follow the table.

## A behaviour (one new file + two small edits)

1. `eyebot/hooks/brain/behaviours/<name>.ts`: a class extending `Behaviour<Slice>` (from `behaviour.ts`). Give it `readonly name`, `initial()` and `on(event, slice, ctx) -> { slice, effects }`; add `mood(slice)` (a `{ mood, priority }` vote: asking is 30, reactions 20, activity 10) or `drawing(slice, now)` (drawing options) if it needs them. Return effects as data (`startTimer`, `cancelTimer`, `redraw`, `{ type: 'emit', event }`); never touch `$`. `reaction.ts` is the smallest example.
2. `eyebot/hooks/brain/types.ts`: add its slice to `State['slices']`, its timers to `TimerName` (name them `<behaviour>.<timer>`), and any new event to `Event`.
3. `eyebot/hooks/brain/machine.ts`: add it to `BEHAVIOURS` (before `hold`, which must stay last) and its `initial()` to `initialState`'s `slices`.
4. A test in `brain/machine.test.ts` from a fresh state.

A new Claude Code event also needs a line in `register.tsx` that `send`s it (hooks call `next(e)` and return its result untouched, inside `try`).

## A drawing feature (one new file + one line)

1. `eyebot/hooks/draw/features/<name>.ts`: export a `Feature` (shape in `draw/feature.ts`): `rootClass(d)` for classes on the svg root, `css(d)` for always-on rules, `drawingCss(d)` for per-drawing rules (after the mood), `defs`, and `slots` (`head`, `overHead`, `ground`, `zones`, `behind`, `front`, `props`) returning markup. `d` has the width, ground, height, options, mood and active visit. Keep it pure; memoize per width if it is expensive.
2. `eyebot/hooks/draw/features/index.ts`: add it to `FEATURES`. The order is the markup, root-class and CSS order.
3. New class names go in `eyebot/hooks/draw/classes.ts` (`K` or a helper), never as string literals; the test checks they are unique and used.
4. Timed sequences: build tracks with `timeline(total)` from `draw/timeline.ts` against named cues (see `features/visit.ts` `cues(plan)`), not raw percentages.

Keep the widest band under 131,072 characters (`node tools/golden.mjs` prints it).
