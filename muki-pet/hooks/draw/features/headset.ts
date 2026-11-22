// His Remote Control headset (MPI-15, Fabio's idea): while a phone is attached
// to the chat, a thin band over his screen head, one round earpiece on the
// right, a boom mic curving down to the bottom corner of his face, and a short
// antenna whose tip blinks softly. The drawing that puts it on drops it from
// above with a little bounce while he squints happily; the one that takes it
// off lifts it away. Drawn on the head, so the head's lean and lag carry it.

import { COLORS } from '../../character/palette.ts'
import { K } from '../classes.ts'
import type { Feature } from '../feature.ts'

// Head coordinates: the screen is x -28..28, y -50..-12.
const headset = () =>
  `<g class="${K.headset}" fill="${COLORS.headset}">` +
  // The band over the top, and its pad on the left side.
  `<path d="M-30,-34C-30,-62 30,-62 30,-34" fill="none" stroke="${COLORS.headset}" stroke-width="3" stroke-linecap="round"/>` +
  `<rect x="-33" y="-37" width="4.5" height="9" rx="2.2" fill="${COLORS.headsetPad}"/>` +
  // The antenna, from the top of the earpiece, and its blinking tip.
  `<line x1="33" y1="-38" x2="37" y2="-50" stroke="${COLORS.headset}" stroke-width="1.6" stroke-linecap="round"/>` +
  `<circle class="${K.headsetTip}" cx="37.4" cy="-51.2" r="2.1" fill="${COLORS.antennaTip}"/>` +
  // The boom mic, down and in to the bottom corner of the screen.
  `<path d="M32,-24Q34,-9 20,-8" fill="none" stroke="${COLORS.headset}" stroke-width="2" stroke-linecap="round"/>` +
  `<ellipse cx="19" cy="-8" rx="3.2" ry="2.3"/>` +
  // The earpiece on the right.
  `<ellipse cx="32" cy="-31" rx="4.6" ry="8"/>` +
  `<ellipse cx="33.2" cy="-31" rx="2" ry="4.6" fill="${COLORS.headsetPad}"/>` +
  `</g>`

const headsetCss = () =>
  `.${K.headsetTip}{animation:hsb 2.6s ease-in-out infinite}` +
  `@keyframes hsb{0%,100%{opacity:.3}50%{opacity:1}}` +
  // Putting it on: it drops from above and settles with a small bounce; once
  // it's on, he squints happily (no fill, so his mood's lids come back after).
  `.${K.headsetDrop} .${K.headset}{animation:hsd .8s cubic-bezier(.3,.7,.4,1) both}` +
  `@keyframes hsd{0%{transform:translateY(-34px);opacity:0}30%{opacity:1}65%{transform:translateY(2px)}82%{transform:translateY(-1.5px)}100%{transform:none}}` +
  `.${K.headsetDrop} .${K.lid}{animation:hsq 1.3s ease-in-out .6s}` +
  `@keyframes hsq{0%,100%{transform:none}25%,75%{transform:translateY(-7px)}}` +
  // Taking it off: it lifts away and stays gone.
  `.${K.headsetLift} .${K.headset}{animation:hsl .7s ease-in forwards}` +
  `@keyframes hsl{0%{transform:none;opacity:1}100%{transform:translateY(-34px);opacity:0}}`

export const headsetFeature: Feature = {
  name: 'headset',
  rootClass: (d) =>
    d.options.headset === 'drop' ? K.headsetDrop : d.options.headset === 'lift' ? K.headsetLift : '',
  css: (d) => (d.options.headset ? headsetCss() : ''),
  slots: { head: (d) => (d.options.headset ? headset() : '') },
}
