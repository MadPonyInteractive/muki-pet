// Heat from a filling context window, as a class on the svg root (`h0` to
// `h3`): his whole body (head, neck, chassis, wheels) reddens step by step, his
// lids get heavier, then he sweats. The levels (from which percentage, which
// colours, how much droop and sweat) are in character/heat.ts; this turns them
// into CSS.

import { HEAT_LEVELS, type HotLevel } from '../character/heat.ts'
import { COLORS } from '../character/palette.ts'

const [, ...HOT] = HEAT_LEVELS

// One rule per hot level for one part, as `.h1 .bz{...}.h2 .bz{...}...`.
const each = (sel: string, decl: (l: HotLevel) => string) => HOT.map((l, i) => `.h${i + 1} ${sel}{${decl(l)}}`).join('')

// One drop from the level with sweat 1, both from the level with sweat 2.
const sweating = HOT.flatMap((l, i) => (l.sweat === 2 ? [`.h${i + 1} .sw`] : l.sweat === 1 ? [`.h${i + 1} .sw1`] : []))

export const HEAT_CSS =
  each('.bz', (l) => `stroke:${l.bezel}`) +
  each('.chs', (l) => `fill:${l.chassis}`) +
  each('.rm', (l) => `stroke:${l.rim}`) +
  each('.ty', (l) => `fill:${l.tyre}`) +
  each('.tw', (l) => `transform:translateY(${l.droop}px)`) +
  `.sw{display:none}` +
  (sweating.length ? `${sweating.join(',')}{display:inline}` : '') +
  `.sw path{opacity:0;transform-box:fill-box;transform-origin:center;animation:drip 2.4s ease-in infinite}.sw2 path{animation-delay:1.2s}` +
  `@keyframes drip{0%{opacity:0;transform:scale(.5)}15%{opacity:.9;transform:none}100%{opacity:0;transform:translateY(16px)}}`

// Two sweat drops on his head (head coordinates).
const drop = `<path d="M0,0C1,2 2.6,3.6 2.6,5.4A2.6,2.6 0 0 1 -2.6,5.4C-2.6,3.6 -1,2 0,0Z"/>`
export const sweat = () =>
  `<g class="sw sw1" fill="${COLORS.sweat}" transform="translate(30,-46)">${drop}</g>` +
  `<g class="sw sw2" fill="${COLORS.sweat}" transform="translate(-30,-42)">${drop}</g>`
