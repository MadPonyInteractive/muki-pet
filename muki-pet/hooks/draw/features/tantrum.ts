// A temper tantrum (Fabio, 2026-11-22): every 2 minutes, for about 5 s, he
// jumps from side to side, landing squashed like stomping, shakes his head "no",
// steam puffs off his head and a red "!!" flashes. The tantrum mood
// (character/moods.ts) shows the marks and starts the `stomp` and `shake`
// loops; this file has the marks and the keyframes. Hover or touch stops it
// while your hand is on him (petting calms him).

import { K } from '../classes.ts'
import type { Feature } from '../feature.ts'
import { r1 } from '../math.ts'

// One cycle: the burst, then calm until the next one.
const CYCLE = 120
const BURST = 5
const SWINGS = 20

// Percent of the cycle for a time in s.
const at = (s: number) => `${Math.round((s / CYCLE) * 100000) / 1000}%`

// Back-and-forth stops over the burst, still the rest of the cycle. `i` is the
// stop's number (1 to SWINGS - 1).
function swing(name: string, value: (side: number, fade: number, i: number) => string): string {
  let stops = `0%{transform:none}`
  for (let i = 1; i < SWINGS; i++) {
    const side = i % 2 ? 1 : -1
    // Strong at first, a little weaker at the end.
    const fade = 1 - (i / SWINGS) * 0.3
    stops += `${at((i * BURST) / SWINGS)}{transform:${value(side, fade, i)}}`
  }
  return `@keyframes ${name}{${stops}${at(BURST)},100%{transform:none}}`
}

// The stomp (Fabio, 2026-11-22: "more obvious, jump around more"): he jumps
// up and to one side, lands squashed, jumps to the other side, and so on. Two
// stops per jump: up in the air (tilted), then down on the ground (squashed).
// The jump height stays within the band (his head nearly touches its top).
const stomp = (_side: number, fade: number, i: number) => {
  const side = Math.floor((i - 1) / 2) % 2 ? -1 : 1
  return i % 2
    ? `translate(${r1(side * 8 * fade)}px,${r1(-7 * fade)}px) rotate(${r1(side * 14 * fade)}deg)`
    : `translate(${r1(side * 10 * fade)}px,0) scale(${r1(1 + 0.12 * fade)},${r1(1 - 0.14 * fade)})`
}

const PUFFS = [-12, 12, -4, 6]
const puff = (x: number) => `<circle class="${K.puff}" cx="${x}" cy="0" r="3.2"/>`
// Each puff a little after the last (no inline styles: one rule per puff).
const puffDelays = () => PUFFS.map((_, i) => `.${K.puff}:nth-child(${i + 1}){animation-delay:${r1(2 + i * 0.9)}s}`).join('')

const marks = () =>
  `<g class="${K.steam}" transform="translate(0,-62)">` +
  `<g fill="#d8dde6" fill-opacity=".85">${PUFFS.map(puff).join('')}</g>` +
  `<text class="${K.bang}" x="20" y="-2" fill="#e0484a" font-family="sans-serif" font-weight="900" font-size="11">!!</text></g>`

const tantrumCss = () =>
  `.${K.steam}{display:none}` +
  `.${K.puff}{opacity:0;transform-box:fill-box;transform-origin:center;animation:puff ${CYCLE}s ease-out infinite}` +
  puffDelays() +
  `.${K.bang}{opacity:0;animation:bang ${CYCLE}s step-end 2s infinite}` +
  `@keyframes puff{0%{opacity:0;transform:scale(.5)}0.25%{opacity:.9}1%{opacity:0;transform:translateY(-12px) scale(1.6)}100%{opacity:0}}` +
  `@keyframes bang{0%{opacity:1}0.4%{opacity:0}0.8%{opacity:1}1.2%{opacity:0}1.6%{opacity:1}${at(BURST)}{opacity:0}}` +
  swing('stomp', stomp) +
  swing('shake', (side, fade) => `rotate(${r1(-side * 14 * fade)}deg)`) +
  // Your hand on him calms him while it's there.
  `.${K.bot}:hover .${K.petTilt}{animation:none}.${K.bot}:hover .${K.steam}{display:none}`

export const tantrum: Feature = {
  name: 'tantrum',
  css: tantrumCss,
  slots: { overHead: marks },
}
