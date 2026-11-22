// Heat from a filling context window, as a class on the svg root (`h0` to
// `h3`): his whole body (head, neck, chassis, wheels) reddens step by step, his
// lids get heavier, then he sweats. The levels (from which percentage, which
// colours, how much droop and sweat) are in character/heat.ts; this turns them
// into CSS.

import { HEAT_LEVELS, MAX_HEAT, type HotLevel } from '../../character/heat.ts'
import { COLORS } from '../../character/palette.ts'
import { K, heatLevel } from '../classes.ts'
import type { Feature } from '../feature.ts'
import { clamp } from '../math.ts'

const [, ...HOT] = HEAT_LEVELS

// One rule per hot level for one part, as `.h1 .bz{...}.h2 .bz{...}...`.
const each = (sel: string, decl: (l: HotLevel) => string) =>
  HOT.map((l, i) => `.${heatLevel(i + 1)} ${sel}{${decl(l)}}`).join('')

// One drop from the level with sweat 1, both from the level with sweat 2.
const sweating = HOT.flatMap((l, i) =>
  l.sweat === 2 ? [`.${heatLevel(i + 1)} .${K.sweat}`] : l.sweat === 1 ? [`.${heatLevel(i + 1)} .${K.sweat1}`] : [],
)

const HEAT_CSS =
  each(`.${K.bezel}`, (l) => `stroke:${l.bezel}`) +
  each(`.${K.chassis}`, (l) => `fill:${l.chassis}`) +
  each(`.${K.rim}`, (l) => `stroke:${l.rim}`) +
  each(`.${K.tyre}`, (l) => `fill:${l.tyre}`) +
  each(`.${K.tired}`, (l) => `transform:translateY(${l.droop}px)`) +
  `.${K.sweat}{display:none}` +
  (sweating.length ? `${sweating.join(',')}{display:inline}` : '') +
  `.${K.sweat} path{opacity:0;transform-box:fill-box;transform-origin:center;animation:drip 2.4s ease-in infinite}.${K.sweat2} path{animation-delay:1.2s}` +
  `@keyframes drip{0%{opacity:0;transform:scale(.5)}15%{opacity:.9;transform:none}100%{opacity:0;transform:translateY(16px)}}`

// Two sweat drops on his head (head coordinates).
const drop = `<path d="M0,0C1,2 2.6,3.6 2.6,5.4A2.6,2.6 0 0 1 -2.6,5.4C-2.6,3.6 -1,2 0,0Z"/>`
const sweat = () =>
  `<g class="${K.sweat} ${K.sweat1}" fill="${COLORS.sweat}" transform="translate(30,-46)">${drop}</g>` +
  `<g class="${K.sweat} ${K.sweat2}" fill="${COLORS.sweat}" transform="translate(-30,-42)">${drop}</g>`

export const heat: Feature = {
  name: 'heat',
  rootClass: (d) => heatLevel(clamp(Math.round(d.options.heat ?? 0), 0, MAX_HEAT)),
  css: () => HEAT_CSS,
  slots: { head: sweat },
}
