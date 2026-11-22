// The cookie game. Narrow focusable strips travel with him on both sides; a
// click focuses one, which (by its own rule) sets how far away it is (--d), how
// far his wheels turn to get there (--w), how long the dash takes (--t) and
// which way (--s), and how long the roll back takes (--r). The strip's focus
// ends by itself a while after he is back.
//
// Counting cookies in a row, with no script: the strips come in six layers.
// Layer k takes clicks only while a layer k-1 strip has focus, so each click
// before the last cookie's focus ends climbs one layer, and the 6th one makes
// him sick. Each layer has its own cookie (after the robot, so it's drawn in
// front of him); it is hidden until its layer has focus, and showing it starts
// its animations afresh. Worked out in tools/frame-lab-ladder-test.svg.
//
// The same strips carry the mouse reactions: `gN` says where his eyes look
// while the mouse is over one (parts/face.ts).

import { BACK, DASH, ROLL } from '../../../character/tuning.ts'
import { K, gazeLevel, heartNo, layerNo, cookieNo, stripNo } from '../../classes.ts'
import { clamp, deg, r1 } from '../../math.ts'
import { cookie, cookieCss } from './cookie.ts'
import { LET_GO } from './cues.ts'
import { eatingCss, STAY_EAT, STAY_SICK } from './eating.ts'
import { SICK_CSS } from './sick.ts'

export const LAYERS = 6

const layers = Array.from({ length: LAYERS }, (_, i) => i + 1)

// The strips (`strips`, one set per layer, inside the robot's travelling group),
// the cookies (`cookies`, after the robot) and all the game's CSS. `top` is the
// ground's y and `H` the band height: each strip covers the band's full height.
export function cookieGame(W: number, top: number, H: number): { css: string; strips: string; cookies: string } {
  const extent = Math.max(W, 300)
  // One strip over his resting spot too: in a game a click on him falls through
  // to the strips (see gameCss), and a gap there would drop the focus mid-roll.
  const strips: Array<{ x: number; w: number; d: number; side: number }> = [{ x: -26, w: 52, d: 0, side: 1 }]
  for (const side of [-1, 1]) {
    for (let a = 26; a < extent; ) {
      const w = a < 300 ? 24 : a < 800 ? 40 : 64
      strips.push(side > 0 ? { x: a, w, d: a + w / 2, side } : { x: -(a + w), w, d: -(a + w / 2), side })
      a += w
    }
  }
  let css = ''
  const one: string[] = []
  strips.forEach(({ x, w, d, side }, i) => {
    const far = Math.abs(d)
    // Where his eyes look while the mouse is over this strip: 6 levels.
    const g = (side < 0 ? 2 : 3) + side * (far < 80 ? 0 : far < 170 ? 1 : 2)
    const t = Math.round(clamp(0.26 + far / 1100, 0.3, 1.5) * 100) / 100
    const back = Math.round(clamp(far / 75, 1.2, 7) * 10) / 10
    css += `.${stripNo(i)}:focus,.${stripNo(i)}:focus~*{--d:${d}px;--w:${r1(deg(d))}deg;--t:${t}s;--r:${back}s;--s:${side}}`
    // y and height are set in CSS (the same for every strip), to save space.
    one.push(`class="${K.strip} ${stripNo(i)} ${gazeLevel(g)} L@" tabindex="0" x="${x}" width="${w}"`)
  })
  // Layers top-down: L6 first, L1 last, so a focused strip lies over the next
  // layer's strips (see gameCss: it rides with him and takes clicks on him).
  let strip = ''
  let cookies = ''
  for (let k = LAYERS; k >= 1; k--) strip += one.map(a => `<rect ${a.replace('L@', layerNo(k))}/>`).join('')
  for (let k = 1; k <= LAYERS; k++) cookies += cookie(k)
  return {
    css: `.${K.strip}{fill:#000;fill-opacity:0;pointer-events:all;outline:none}` + css + gameCss(top, H),
    strips: strip,
    cookies,
  }
}

const focused = (n: number) => `.${layerNo(n)}:focus`

// Dash to the cookie (head leaning back, eyes on it), eat it, joy, then roll
// back; the strip lets go of the focus a while later.
function gameCss(top: number, H: number): string {
  const bot = `.${K.bot}`
  const c = `.${K.strip}`
  const pressed = `${c}:focus:active:not(.${layerNo(LAYERS)})`
  return (
    `${c}{y:${-top}px;height:${H}px}` +
    // A click on him mid-game feeds nothing (Fabio, 2026-11-22, second pick):
    // the focused strip shrinks to his size and rides with him, over the next
    // layer, so a click on him hits the strip that already has focus and
    // nothing changes. A boop there would move the focus, drop his roll home
    // mid-way and snap him home, so the touch strips step aside.
    `${c}:focus{x:-26px;width:52px;cursor:grab;transform:translateX(var(--d));transition:transform var(--t) ${DASH};` +
    `animation:gone 0s calc(var(--t) + var(--r) + ${LET_GO}s) forwards,ride var(--r) ${ROLL} ${STAY_EAT} forwards,` +
    `aside 0s calc(${STAY_EAT} + var(--r)) forwards}` +
    `@keyframes gone{to{visibility:hidden}}@keyframes ride{from{transform:translateX(var(--d))}to{transform:none}}` +
    // Once he is home the strip steps aside and his touch strips come back (a
    // boop can't snap him now), while the focus still waits for the next cookie.
    // (Odd and even layers use different names, so each cookie restarts it.)
    `@keyframes aside{to{pointer-events:none;cursor:auto}}@keyframes tchA{to{pointer-events:all}}@keyframes tchB{to{pointer-events:all}}` +
    `${c}:focus~${bot} .${K.pet}{pointer-events:none}` +
    // Petting him while he's out (the press is on the riding strip, which keeps
    // the focus): hearts float up, the game goes on. Not while he's sick.
    `${pressed}{cursor:grabbing}` +
    `${pressed}~${bot} .${K.heart}{animation:hrt 1.1s ease-out infinite}` +
    `${pressed}~${bot} .${heartNo(1)}{animation-delay:.37s}${pressed}~${bot} .${heartNo(2)}{animation-delay:.74s}` +
    layers.map((n) => `${focused(n)}~${bot} .${K.pet}{animation:tch${n % 2 ? 'A' : 'B'} 0s calc(${STAY_EAT} + var(--r)) forwards}`).join('') +
    // Only the focused strip and the layer after it take clicks.
    `${layers.slice(1).map((n) => `.${layerNo(n)}`).join(',')}{pointer-events:none}` +
    `svg:has(${c}:focus) ${c}{pointer-events:none}` +
    `${layers.slice(0, -1).map((n) => `svg:has(${focused(n)}) .${layerNo(n + 1)}`).join(',')}{pointer-events:all}` +
    `svg:has(${c}:focus) ${c}:focus{pointer-events:all}` +
    `.${K.cookie}{display:none;pointer-events:none;transform:translate(var(--d),-29px)}` +
    `${layers.map((n) => `${focused(n)}~.${cookieNo(n)}`).join(',')}{display:inline}` +
    cookieCss(LAYERS) +
    // His mouth: hidden until he eats.
    `.${K.mouth}{transform:scale(0);transform-box:fill-box;transform-origin:center}` +
    `${bot}{transition:transform ${BACK}}.${K.spin}{transition:transform ${BACK}}` +
    // While he goes for a cookie, his mood's face is put aside: one feeling at
    // a time (Fabio, 2026-11-22: curious mixed with the coin's joy).
    `${c}:focus~${bot} .${K.eye}{transform:none;animation:none}${c}:focus~${bot} .${K.top}{transform:translateY(-3px);animation:none}` +
    `${c}:focus~${bot} .${K.petTilt}{transform:none;animation:none}${c}:focus~${bot} .${K.lid}{transform:none}` +
    // The roll back is an animation that ends where the focus-free style puts
    // him, so nothing moves when the focus goes.
    eatingCss('A', [1, 3, 5], STAY_EAT) +
    eatingCss('B', [2, 4], STAY_EAT) +
    eatingCss('C', [6], STAY_SICK) +
    SICK_CSS
  )
}
