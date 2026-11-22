// Being sick after the 6th cookie in a row: the face goes green, his eyes
// squeeze, he leans back, lurches forward and a rainbow pours out of his mouth
// into a puddle; then dizzy eyes and droopy lids before he rolls home. When
// each step happens is in cues.ts.

import { K, layerNo } from '../../classes.ts'
import { afterDash } from '../../timeline.ts'
import { CUE, LET_GO_SICK } from './cues.ts'

const L6 = `.${layerNo(6)}:focus`

export const SICK_CSS =
  `${L6}{pointer-events:all;x:-5000px;width:12000px;animation:gone 0s calc(var(--t) + var(--r) + ${LET_GO_SICK}s) forwards}` +
  // No petting him mid-sick (a click on him would end it): clicks go to the strip.
  `${L6}~.${K.bot},${L6}~.${K.bot} .${K.pet}{pointer-events:none}` +
  `${L6}~.${K.bot} .${K.eye}{animation:sickc 5.8s ease-out ${afterDash(CUE.ill)},squeeze 2.9s ease-in-out ${afterDash(CUE.ill)}}` +
  `${L6}~.${K.bot} .${K.top}{animation:droop 3s ease-in-out ${afterDash(CUE.dizzy)}}` +
  `@keyframes sickc{8%,80%{fill:#a5e05a}}` +
  `@keyframes squeeze{12%{transform:scale(1.1,.6)}22%{transform:scale(.95,.8)}32%,85%{transform:scale(1.15,.3)}}` +
  `@keyframes ill{25%{transform:rotate(calc(var(--s) * -7deg))}33%,80%{transform:rotate(calc(var(--s) * 12deg))}}` +
  `@keyframes gag{10%,88%{transform:scale(1.5,2.3)}}` +
  `@keyframes dizzy{0%,100%{transform:translate(3px,0)}25%{transform:translate(0,2px)}50%{transform:translate(-3px,0)}75%{transform:translate(0,-2px)}}` +
  `@keyframes droop{15%,80%{transform:translateY(5px)}}` +
  `.${K.rainbow},.${K.puddle}{display:none}${L6}~.${K.bot} .${K.rainbow},${L6}~.${K.bot} .${K.puddle}{display:inline}` +
  `.${K.rainbowSide}{transform:scaleX(var(--s))}.${K.puddle}{transform:scaleX(var(--s))}` +
  `.${K.rainbowSide} path{fill:none;stroke-linecap:round;stroke-dasharray:100 200;stroke-dashoffset:100;animation:pour 1.9s linear ${afterDash(CUE.pour)}}` +
  `@keyframes pour{30%,62%{stroke-dashoffset:0}100%{stroke-dashoffset:-100}}` +
  `.${K.puddleInner}{transform:scale(0);animation:puddle 4.6s ease-out ${afterDash(CUE.puddle)}}` +
  `@keyframes puddle{0%{transform:scale(.2)}12%,70%{transform:none;opacity:1}100%{transform:none;opacity:0}}`

const RAINBOW = ['#ff5a5a', '#ffa24a', '#ffe14a', '#6de36a', '#4ab8ff', '#a87aff']

// The rainbow, from his mouth (head coordinates) down to the ground beside him.
export function rainbow(): string {
  const paths = RAINBOW.map(
    (c, i) => `<path pathLength="100" d="M0,1C15,-12 40,-6 50,43" stroke="${c}" stroke-width="${9 - i * 1.5}"/>`,
  ).join('')
  return `<g class="${K.rainbow}" transform="translate(0,-19)"><g class="${K.rainbowSide}">${paths}</g></g>`
}

// The puddle it leaves on the ground.
export function puddle(): string {
  const rings = RAINBOW.filter((_, i) => i % 2 === 0)
    .map((c, i) => `<ellipse rx="${10 - i * 3}" ry="${2.2 - i * 0.6}" fill="${c}"/>`)
    .join('')
  return `<g class="${K.puddle}"><g transform="translate(42,0)"><g class="${K.puddleInner}">${rings}</g></g></g>`
}
