// A celebration (MPI-12): you said it worked. The celebrate mood
// (character/moods.ts) starts the `party` jumps and the `cheer` head wiggle;
// this file has those keyframes and the fireworks, which go off behind him
// only in that mood.

import { K } from '../classes.ts'
import type { Feature } from '../feature.ts'
import { r1 } from '../math.ts'

// Where each burst goes (around him, above the ground), its colour and when it
// starts (s). The first waits for the old drawing to fade out (FADE_IN).
const BURSTS: Array<[x: number, y: number, color: string, delay: number]> = [
  [-56, -48, '#ffd23f', 1],
  [60, -40, '#ff5d8f', 1.35],
  [-110, -36, '#4fd1ff', 1.7],
  [112, -50, '#8cff6b', 2.05],
  [-8, -56, '#c18bff', 2.4],
]
const SPARKS = 12
const BURST_S = 1.3
const ROUNDS = 3

const burst = ([x, y, color]: (typeof BURSTS)[number]) => {
  let rays = ''
  for (let i = 0; i < SPARKS; i++) {
    const a = (i / SPARKS) * Math.PI * 2
    const [c, s] = [Math.cos(a), Math.sin(a)]
    rays += `<line x1="${r1(c * 6)}" y1="${r1(s * 6)}" x2="${r1(c * 16)}" y2="${r1(s * 16)}"/>`
  }
  return (
    `<g transform="translate(${x},${y})"><g class="${K.burst}" stroke="${color}" stroke-width="2" stroke-linecap="round">` +
    rays +
    `<circle r="2" fill="${color}" stroke="none"/></g></g>`
  )
}

const fireworks = () => `<g class="${K.fireworks}">${BURSTS.map(burst).join('')}</g>`

// Only in the celebrate mood, so every other drawing stays as it was.
const css = () =>
  // Each burst grows from its centre and fades, a few times over.
  `.${K.burst}{opacity:0;transform-origin:0 0;animation:fwb ${BURST_S}s ease-out ${ROUNDS}}` +
  BURSTS.map((b, i) => `.${K.fireworks}>g:nth-child(${i + 1})>.${K.burst}{animation-delay:${b[3]}s}`).join('') +
  `@keyframes fwb{0%{opacity:1;transform:scale(.15)}60%{opacity:1}100%{opacity:0;transform:scale(1)}}` +
  // The jumps: up and to one side, land squashed, up to the other side.
  `@keyframes party{0%,100%{transform:none}` +
  `20%{transform:translate(-9px,-8px) rotate(-12deg)}35%{transform:translate(-6px,0) scale(1.1,.88)}` +
  `60%{transform:translate(9px,-8px) rotate(12deg)}75%{transform:translate(6px,0) scale(1.1,.88)}}` +
  `@keyframes cheer{0%,100%{transform:none}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}`

export const celebrate: Feature = {
  name: 'celebrate',
  drawingCss: d => (d.mood === 'celebrate' ? css() : ''),
  slots: { behind: d => (d.mood === 'celebrate' ? fireworks() : '') },
}
