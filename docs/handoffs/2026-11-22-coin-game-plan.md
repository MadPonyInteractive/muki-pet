# Handoff 2026-11-22: flicker found, coin game designed, nothing built yet

## Where things stand

- Eyebot code is **unchanged** since `2026-11-22-moods-built.md` (v0.1.0, validate passes, tests 6/6). This chat only researched, tested in the frame lab and wrote docs.
- **Fabio's live report:** mood changes make him flicker and teleport, mostly at the start of a chat. Hovering or petting him in a mood looks wrong (mood lids stay on under the happy face).
- **Why:** each mood change is a new Svg source, and Desktop keeps a frame only while it is byte-identical. So every change starts a new frame: blank while it loads, then he restarts at the hook's guess of his loop time, which runs ahead of the frame by every second he spent paused under the mouse. Full detail: `research/mods-api.md` § How Desktop really draws an interactive Svg, and § CSS tricks.
- **No way to change his mood without a new frame:** a raw `div` is refused, Box sizes can't carry a signal, and "freeze without pausing" doesn't work in Chromium. So the plan hides the swap instead.
- New tool: `tools/frame-lab.html` draws any SVG exactly as Desktop does (same sanitizer, CSP, sandbox). Keep the browser pane **visible** when using it (a hidden pane has a 0-wide viewport and frozen animations).

## Build plan (in this order; each step is small enough to check)

### 1. Touch resets his face (Fabio's complaint, small)

In `robot.ts` base CSS, with higher specificity than the single-class mood rules (put a `.mv` in front):
`.mv .bot:hover .eye{transform:none}`, `.mv .bot:hover .top{transform:translateY(-3px)}`, `.mv .bot:hover .gz{transform:none}`, `.mv .bot:hover .pt{transform:none}`. The petting rules (`.bot:active>.pN:hover~.bd .pt`) are more specific still, so they keep winning. Asleep's `svg:hover .top` must not beat the reset when the pointer is on him (touch wakes him happy).

### 2. One route shape for every width (removes the resize teleport)

Simulate once at a reference width (900 px), store the route as `u` from 0 to 1, and per width map `x = 44 + u * (W - 88)`. Wheel angle from the mapped `x`. Tilt and eye tracks stay as simulated (width-free strings, cache them). Then a band resize moves him in proportion instead of onto a new random route.

### 3. Double-buffered swap (removes the flicker)

In `register.tsx`, when the drawing changes (mood, width or heat), keep the old one on top for about 480 ms while the new one loads under it:

```
Box column
  Box column                  (the stage; gets position:relative by itself)
    Box column > Svg NEW      (in flow)
    Box column position="absolute" top={0} left={0} right={0} > Svg OLD
  {below}
```

Then a `$.clock.after(480)` drops the old one and invalidates. The morph keeps OLD alive because its iframe is identical and its tag path (div > div > div > iframe) matches. Requirements: **a constant `alt`** (the title is part of the identity check; tests should read the mood from a class on the svg root, e.g. `<svg class="m-happy h1">`, not from alt). The new frame hides its robot for 0.38 s and fades it in over 0.2 s (`.bot{animation:rbin .2s ease-out .38s backwards}`). The old robot vanishes as the new one appears. Move the face slide from `@starting-style` to animations with the same 0.38 s delay (`sel{animation:fN .45s ease-out .38s backwards} @keyframes fN{from{transform:OLD}}`), or it plays while hidden. Give the alert and happy hops a 0.4 s delay too.

Remaining: he still jumps by the time he spent paused under the mouse (hover or coin) since the last change. Fewer swaps make that rarer. Possible extra step: merge each passing mood into the next lasting one (a "focused" frame that opens with 2.5 s of alert, a "neutral" frame that opens with 6 s of happy), which cuts swaps per turn from 4 to 2.

### 4. Coin game, pure CSS inside the frame (everything below was proved in the lab)

- Replace the 6 hover strips (`.z0`…`.z5`) with about 100 narrow, focusable strips relative to him, from ±26 px out to ±2600 px. Widths: 24 px up to 300 px out, 40 px up to 800, 64 px beyond. Each `<rect class="c cN gK" tabindex="0" ...>`. `gK` is its gaze level (same 6 levels as now): `.gK:hover~.bot .gz{...}`.
- Per strip, one rule sets the numbers: `.cN:focus,.cN:focus~*{--d:<offset>px;--w:<offset/WHEEL_R in deg>deg;--t:<dash s>s;--s:<±1>}`, with dash time `t = clamp(.26 + |d|/1100, .3, 1.5)`. About 7 KB of CSS plus 8 KB of rects, which fits under the 131,072 limit.
- **Freeze his spot while the sequence runs:** `.mv:focus-within,.mv:focus-within .s{animation-play-state:paused}`. The coin and the dash are relative to that frozen spot.
- **Dash:** `.c:focus~.bot{transform:translateX(var(--d));transition:transform var(--t) cubic-bezier(.6,0,.25,1)}`, returning with `.bot{transition:transform 1s cubic-bezier(.45,0,.3,1)}`. Wheels: a new `.sp` group inside each wheel gets `rotate(var(--w))` with the same timing.
- **Head lag:** a new `.ln` group between the head's translate and `.pt` runs two animations: lean back during the dash (`rotate(calc(var(--s) * -15deg))`, back to 0 at the stop), then a forward swing that settles (`+13°, -6°, +2.5°, 0` over 0.9 s, delay `var(--t)`).
- **Eyes:** an animation on `.gz` looks toward the coin during the dash. **Joy at pickup:** `.lid` `joy` animation (eyes "^ ^" for about 1.6 s, delay `var(--t)`, no fill), `.hop` twice, blush on. The asleep look gives way during a coin (he wakes for it): open the top lids, hide the `z`s.
- **Coin:** a `.cg` group after the strips, before `.bot`: `display:none; pointer-events:none`, shown by `.c:focus~.cg` at `translateX(var(--d))`, about 30 px above the shelf. Nested groups: pop in (scale with overshoot), spin (scaleX), collect at `var(--t)` (fly up, grow, fade), plus a sparkle burst at `var(--t)`. Any small pickup works (coin, star, bolt).
- **End:** `.c:focus{outline:none;animation:gone 0s calc(var(--t) + 2.4s) forwards} @keyframes gone{to{visibility:hidden}}` drops the focus. He rolls back to his spot and carries on.
- Clicking on him is still a boop (his touch strips are on top). A click on another spot moves the coin. A redraw from the hook blurs the frame and ends the sequence (rare, acceptable).

### 5. Heat from context (Fabio's idea)

Levels: under 30% = 0, 30–50 = 1, 50–70 = 2, 70%+ = 3. Read `(await $.session.usage()).context.percent` (in `try`, the test engine may lack it) and update on the `session.measure` event (`e.context.percent`), as `~/.claude/mods/context-bar/hooks/register.tsx` does. Only a level change swaps the drawing. Looks, getting stronger by level: warm cheeks (`.ht`, apart from the petting blush), bezel tinted toward red (`.bz{stroke:...}`), sweat drops sliding down the side of the head (`transform-box:fill-box`), slightly heavier top lids from a new `.tw` wrapper around each top lid (so it adds to any mood).

### 6. Checks

Update the tests: the mood comes from the svg root class, a test for the two-Svg overlay during a swap (gone after 480 ms), and source size. Run `claude plugin validate ./eyebot` and `claude plugin test ./eyebot`. Preview in `tools/frame-lab.html?src=...` with the pane visible: click a spot, watch the dash, pickup and return. Then Fabio runs `/reload-plugins` for the live look.

## Open for Fabio

- **What makes him mad: decided by Fabio 2026-11-22: both** (1) being booped too many times in a row and (2) being woken from sleep. A mad Eyebot dodges your hand and rolls away (in the mad mood, `.bot:hover` starts a roll-away animation instead of the happy face). Not in steps 1–6; build it after them. Open question for the builder: the frame has no script, so "too many boops" needs a way to count presses (maybe a chain of focusable layers, each press focusing the next).
- He can't stop under the mouse without his clock drifting, so a small jump on a mood change after a long hover or petting remains. Acceptable?

## Paste-ready resume prompt

```
Continue the Eyebot project in C:\AI\Mpi\Plugins\Code-Companion. Read docs/README.md and docs/handoffs/2026-11-22-coin-game-plan.md first. Nothing is built yet from that plan: do steps 1 to 6 in order (touch face reset, one route for all widths, double-buffered swap, coin game, heat from context, checks), then ask me to /reload-plugins and look.
```
