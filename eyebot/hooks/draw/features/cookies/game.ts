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

import { BACK } from '../../../character/tuning.ts'
import { K, gazeLevel, layerNo, cookieNo, stripNo } from '../../classes.ts'
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
  let strip = ''
  let cookies = ''
  for (let k = 1; k <= LAYERS; k++) {
    strip += one.map(a => `<rect ${a.replace('L@', layerNo(k))}/>`).join('')
    cookies += cookie(k)
  }
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
  return (
    `${c}{y:${-top}px;height:${H}px}` +
    `${c}:focus{animation:gone 0s calc(var(--t) + var(--r) + ${LET_GO}s) forwards}@keyframes gone{to{visibility:hidden}}` +
    // Only the layer after the focused one takes clicks.
    `${layers.slice(1).map((n) => `.${layerNo(n)}`).join(',')}{pointer-events:none}` +
    `${layers.slice(0, -1).map((n) => `${focused(n)}~.${layerNo(n + 1)}`).join(',')}{pointer-events:all}` +
    // In a game a click on him is another cookie where he is, not a boop: a
    // touch strip taking the focus would drop his roll home mid-way, and he'd
    // snap home (Fabio, 2026-11-22).
    `${c}:focus~${bot} .${K.pet}{pointer-events:none}` +
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
