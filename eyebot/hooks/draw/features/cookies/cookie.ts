// One cookie: its drawing, its bites and crumbs, and their CSS.

import { COLORS } from '../../../character/palette.ts'
import { K, biteNo, cookieNo, crumbNo, layerNo } from '../../classes.ts'
import { r1 } from '../../math.ts'
import { biteDelay, gulpDelay } from './cues.ts'

// The whole cookie, drawn once in <defs> and used by every layer's cookie.
export const COOKIE_DEF =
  `<g id="ck"><circle r="7" fill="${COLORS.cookie}" stroke="${COLORS.cookieEdge}" stroke-width="1.3"/>` +
  `<g fill="${COLORS.chip}"><circle cx="-2.8" cy="-2.2" r="1.2"/><circle cx="2.6" cy="-0.6" r="1.1"/><circle cx="-0.6" cy="3" r="1.2"/><circle cx="3.2" cy="3.6" r=".8"/><circle cx="-3.8" cy="1.6" r=".7"/></g></g>`

// The bites all come from the top edge, the side his mouth is on (the cookie
// is held below it; bites from the bottom looked wrong: Fabio, 2026-11-22),
// left to right, each overlapping the last, so the cookie stays round with a
// scalloped bite (spread around the edge, they left a three-pointed star).
const BITES: Array<[number, number]> = [
  [-4.5, -7.2],
  [0, -8.4],
  [4.5, -7.2],
]

// One layer's cookie (`k` is the layer): bitten three times (a mask with three
// growing holes), crumbs falling at each bite, then the last bit goes into his
// mouth.
export function cookie(k: number): string {
  return (
    `<g class="${K.cookie} ${cookieNo(k)}"><g class="${K.cookieCore}"><use href="#ck" mask="url(#bt${k})"/></g>` +
    `<mask id="bt${k}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="20" height="20">` +
    `<rect x="-10" y="-10" width="20" height="20" fill="#fff"/>` +
    BITES.map(([x, y], i) => `<circle class="${K.bite} ${biteNo(i)}" cx="${x}" cy="${y}" r="3.6"/>`).join('') +
    `</mask>` +
    BITES.map(([x], i) => `<circle class="${K.crumb} ${crumbNo(i)}" cx="${r1(x * 0.6)}" cy="-4" r="1.1"/>`).join('') +
    `</g>`
  )
}

// The cookie pops in, is bitten and crumbs fall, then he gulps the rest.
export function cookieCss(layers: number): string {
  return (
    `.${K.cookieCore}{animation:cpop .35s cubic-bezier(.3,1.8,.5,1) backwards,cgulp .22s ease-in ${gulpDelay} forwards}` +
    `@keyframes cpop{from{transform:scale(0)}}@keyframes cgulp{to{transform:translateY(-7px) scale(0)}}` +
    // A mask's content is styled and animated even while its cookie is hidden
    // (masks ignore display:none), so a bite animation set on .bt alone ran at
    // load and every cookie came out already bitten (Fabio, 2026-11-22). The
    // animation's name is only set while that cookie's layer has focus, so it
    // starts with the click; the .btN delays still apply.
    `.${K.bite}{transform:scale(0);transform-box:fill-box;transform-origin:center;animation-duration:.12s;animation-timing-function:ease-out;animation-fill-mode:forwards}` +
    `${Array.from({ length: layers }, (_, i) => `.${layerNo(i + 1)}:focus~.${cookieNo(i + 1)} .${K.bite}`).join(',')}{animation-name:bite}` +
    `.${biteNo(0)}{animation-delay:${biteDelay(0)}}.${biteNo(1)}{animation-delay:${biteDelay(1)}}.${biteNo(2)}{animation-delay:${biteDelay(2)}}` +
    `@keyframes bite{to{transform:none}}` +
    `.${K.crumb}{fill:${COLORS.cookieEdge};opacity:0;animation:crumb .6s ease-in}` +
    `.${crumbNo(0)}{animation-delay:${biteDelay(0)}}.${crumbNo(1)}{animation-delay:${biteDelay(1)}}.${crumbNo(2)}{animation-delay:${biteDelay(2)}}` +
    `@keyframes crumb{0%{opacity:1}100%{opacity:0;transform:translateY(28px)}}`
  )
}
