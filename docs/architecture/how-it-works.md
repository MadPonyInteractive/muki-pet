# How the mod works

## Files (`eyebot/` in this repo)

| File | Job |
| --- | --- |
| `.claude-plugin/plugin.json` | Manifest: name `eyebot`, version, MIT licence. |
| `hooks/hooks.json` | Names the hooks module: `{ "modules": ["./register.tsx"] }`. |
| `hooks/register.tsx` | One `ui.render` hook on `AbovePrompt`. Draws the robot `Svg` (two slots, for the swap) and stacks whatever other mods drew (`await next(e)`) under it. Skips the terminal and surveys. Mood hooks, and `session.measure` for heat. |
| `hooks/robot.ts` | Builds the robot as one SVG string, `robotSvg(width, { mood, from, at, heat })`. Pure: the same options always give the same string. |
| `hooks/register.test.tsx` | 12 tests, run with `claude plugin test ./eyebot`. |

## How the drawing works

The robot is **one self-animating SVG**, drawn with `Svg` and `isInteractive` (Desktop puts it in a script-less sandboxed frame where CSS animation and `:hover` work).

1. `robot.ts` simulates about 45 to 60 s of motion at 30 fps **around a home spot** (`simulate(W, homeX, seed)`, cached per width and home in `routeAround`): rest at home, a short trip out, a look around, back home, repeated; the loop starts and ends resting at home. Also the head spring and the eye direction. Home is a share of the band (`home`, 0 to 1, `x = 44 + home * (W - 88)`), so a resize keeps him at the same share.
2. Each track is thinned to the samples that linear interpolation can't stand in for, then written out as CSS `@keyframes`. The result is 33 KB (240 px band) to 76 KB (2600 px); the limit is 131,072 characters. Most of it is the coin strips, which grow with the width.
3. Mouse reactions are pure CSS: about 50 to 100 narrow invisible strips ride along with the robot (`.c0`, `.c1`, ...: 24 px wide near him, 40 px from 300 px out, 64 px from 800 px out), and `:hover` on a strip turns the eyes by its gaze class (`.gK:hover ~ .bot .gz`, 6 levels). Hovering the band pauses the motion (`animation-play-state: paused`). `!important` overrides the paused eye animation without knocking it out of sync with the body.
3b. **Coin game:** the same strips have `tabindex="0"`, so a click focuses one. Each strip's own rule sets `--d` (its distance from him), `--w` (wheel turn), `--t` (dash time) and `--s` (side) on itself and its later siblings. `.c:focus ~ .bot` transitions him to `translateX(var(--d))`; `.mv:focus-within` pauses his loop so he dashes from a frozen spot. Each strip is followed by its own coin (`.c:focus + .cu`, a `<use href="#cn">`), so every click pops a fresh coin. The roll back is an animation (`home`, from `translateX(var(--d))` to none over `--r`, starting at `--t` + 1.9 s, `forwards`), with `spin` for the wheels and `leanb`/`swingb` for the head. The strip's focus ends by itself after it: `.c:focus{animation:gone 0s calc(var(--t) + var(--r) + 2.2s) forwards}` hides it and the frame drops focus. He is already at rest by then, so nothing moves (checked: no transition starts). An early blur (clicking on him mid-run) still rolls him back over 1 s by `.bot`'s own transition.
4. Touch: four invisible strips over the robot (`.p0`…`.p3`) sit in `.bot` before the body (`.bd`, which ignores the pointer). `.bot:active` is the press, and `.bot:active>.pN:hover~.bd .pt` leans the head while you drag. The release wiggle uses `.bot:not(:active) .wg{animation:...}`: the rule starts matching again on release, so the animation restarts.
5. The hooks module sends the same string every time for the same width, mood and heat, so redraws don't restart the animation.
7. **Props (visits):** `tool.call` (main loop, before `next(e)`) maps the tool to a prop and calls `startVisit` (at most one per 12 s, not while asleep). `visitPlan(width, fromHome, n)` (pure) decides where the prop goes, where he stops beside it (`toU`, his new home) and the timeline. The visit drawing's route is the one around the new home, held with `.s{animation-delay:<visit length - elapsed>s; animation-fill-mode:backwards}` (so he rests at the new home until the visit ends), and `.ix` starts offset back at the old home and rolls him over. While a visit runs, `sourceFor` keeps the visit drawing (only a width change rebuilds it) and `redraw` holds mood and heat changes until it ends (+0.3 s), restarting a waiting passing mood's timer so it gets its full time; each moving part runs one whole-visit keyframe track (`vx` on the new `.ix` wrapper around strips, coins and `.bot`; `vw` on a new `.vw` wrapper in each wheel; `vl` head; `vg` eyes; `vd` lids; `vq1`/`vq2` the "?" and "!"; `vpa` the prop), delayed by `-elapsed`, so a drawing made mid-visit (a mood change) picks it up where it is. In a visit drawing only the shifted route keyframes are sent (not the cached ones too), which keeps a 3000 px band at 87 KB.
6. **Heat** is a class on the svg root (`h0` to `h3`) with static rules (`.h2 .sw1{display:inline}` etc.). The mood is also a class there (`m-happy`); tests read the mood from it.

Why this way, and not a frame-by-frame redraw: see `research/mods-api.md`.

## Moods

- `register.tsx` keeps what he feels in module variables: a lasting mood (neutral, focused, sleepy, asleep), a passing one (alert, happy, sad, on a `$.clock.after` timer) and `asking` (curious). When the result changes it calls `$.ui.invalidate('ui.render')`.
- Each mood (or heat level, or width) is its own SVG source, so a change means a new frame, blank until it loads. Three tricks hide that:
  - **Double buffer (built 2026-11-22):** the band has two slots, each a column Box. The new drawing goes into the free slot, in the flow; the old slot turns `position="absolute"` (top/left/right 0) and stays on top for 900 ms (`$.clock.after`), then is emptied. A second change while a swap is running replaces only the frame loading underneath (or, if it goes back to the drawing on top, that one simply takes over), so the frame on top is never thrown away mid-swap. A frame stays in the same slot for its whole life, so Desktop's morph finds the identical iframe in the same place whether it matches by position or by `isEqualNode`. The alt is constant (`'Eyebot, a small robot on two wheels'`), because the alt is part of what the morph compares.
  - **Continuity (rewritten 2026-11-22):** every drawing starts him resting at his home spot; the hook only keeps `home`. The first version counted his loop time and wrote `.s{animation-delay:-Ns}`, but each frame starts its own clock when it loads, which can be long after the hook thinks (a frame made while the window isn't showing may load only when it shows again), and hovering pauses him without the hook knowing. Fabio saw him appear in the middle of the band while the old drawing had him on the right. With a home spot, two drawings disagree only if he was out on a trip at the swap, by at most that trip.
  - **Smooth face change:** in the new frame `.bot` is hidden for 0.15 s and fades in over 0.25 s, and each face part that differs gets `animation: fN .45s ease-out .15s backwards` with `@keyframes fN{from{transform:<old face>}}`. (Until 2026-11-22 this was `@starting-style`, which would play while the new frame is still hidden under the old one.) The alert and happy hops wait 0.2 s for the same reason. (First built with 0.38 s and a 480 ms overlap; too tight when the app is busy, see the log.)
- `robotSvg(width, { mood, from, at, heat })`: the route is simulated once; the body CSS is cached per width; only the root classes, the mood CSS and the delay change. A width or heat change passes `from = mood`, so the face doesn't slide.
- Every mood hook calls `next(e)` and returns its result untouched, with the mood code in `try`, so it can never block or change a tool call or turn.

## Cookie game: counting clicks in a row with no script (2026-11-22)

- The click strips (narrow focusable `rect`s that travel with him, each setting `--d --w --t --r --s` for the robot by `.cN:focus~*`) now come in **six layers** (`L1`..`L6`, the same strip set repeated, `y`/`height` set in CSS to save space). Only `L1` takes clicks normally; `.Lk:focus~.Lk+1{pointer-events:all}` makes the next layer clickable while a strip of the layer below has focus, and it lies on top, so each click during a sequence climbs one layer. A focus ends by itself (the `gone` animation hides the strip), which resets the count.
- **Restarting animations on the always-shown robot:** an animation only restarts when its name changes, so odd layers use one set of keyframes (`homeA`, `leanA`, ...) and even layers another (`...B`); `L6` uses set `C` plus the sick animations. `eatingCss()` in `robot.ts` builds a set.
- **Cookies:** one per layer, placed after the robot (drawn in front of him), hidden until its layer has focus; going from `display:none` to shown restarts its own animations, so the cookie rules are shared. Bites are a `<mask>` per cookie with three circles that grow (the mask must come after the strips in the document for the `~` rules to reach it).
- **The 6th:** its focused strip grows to cover the whole band (`x`/`width` in CSS) so further clicks hit it and change nothing, and the robot ignores the pointer while he's sick.
- Lab proof: `tools/frame-lab-ladder-test.svg` (ladder, alternating names, mask bites, the growing 6th strip). Checked with `:focus` swapped for a class; the real click-to-focus was already proven by the coin game.
- Size: 78K characters at a 3000 px band (limit 131,072).

## Band width

The band reports its width in text cells (`bodyColumns`). The SVG width is `bodyColumns × 8 px`, which is a **guess** at the Desktop cell width, not yet checked in the app.

## Dev workflow

- **Preview without the app:** `node tools/preview.mjs <out-folder>` writes `robot.svg` and `index.html`. Serve that folder (`python -m http.server 8765 --bind 127.0.0.1 --directory <out-folder>`) and open `http://127.0.0.1:8765/robot.svg` in the browser pane. Opening `file:///` gives a static snapshot.
- **Checks:** `claude plugin validate ./eyebot` and `claude plugin test ./eyebot`. No TypeScript compiler is installed on this machine, so there's no type-check yet.
- **Getting it to load in a chat:** `eyebot/` in this repo loads in every chat through `CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json` (next to `~/.claude/mods/context-bar`). Edit it here directly. An old copy under `~/.claude/dev-mods/<session-id>/` (where the plugin-authoring skill first put it) loads only in its own session and is obsolete: don't edit it.
- **After editing `eyebot/`, type `/reload-plugins` in the chat** to see the change without starting a new one.
