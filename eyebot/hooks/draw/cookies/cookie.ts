// One cookie: its drawing, its bites and crumbs, and their CSS.

import { COLORS } from '../constants.ts'
import { r1 } from '../math.ts'
import { EAT } from './eating.ts'

// The whole cookie, drawn once in <defs> and used by every layer's cookie.
export const COOKIE_DEF =
  `<g id="ck"><circle r="7" fill="${COLORS.cookie}" stroke="${COLORS.cookieEdge}" stroke-width="1.3"/>` +
  `<g fill="${COLORS.chip}"><circle cx="-2.8" cy="-2.2" r="1.2"/><circle cx="2.6" cy="-0.6" r="1.1"/><circle cx="-0.6" cy="3" r="1.2"/><circle cx="3.2" cy="3.6" r=".8"/><circle cx="-3.8" cy="1.6" r=".7"/></g></g>`

// The bites all come from the bottom edge, the side his mouth is on, left to
// right, each overlapping the last, so the cookie stays round with a scalloped
// bite (spread around the edge, they left a three-pointed star: Fabio,
// 2026-11-22).
const BITES = [
  [-4.5, 7.2],
  [0, 8.4],
  [4.5, 7.2],
]

// One layer's cookie (`k` is the layer): bitten three times (a mask with three
// growing holes), crumbs falling at each bite, then the last bit goes into his
// mouth.
export function cookie(k: number): string {
  return (
    `<g class="cu k${k}"><g class="cc"><use href="#ck" mask="url(#bt${k})"/></g>` +
    `<mask id="bt${k}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="20" height="20">` +
    `<rect x="-10" y="-10" width="20" height="20" fill="#fff"/>` +
    BITES.map(([x, y], i) => `<circle class="bt bt${i}" cx="${x}" cy="${y}" r="3.6"/>`).join('') +
    `</mask>` +
    BITES.map(([x], i) => `<circle class="crm r${i}" cx="${r1(x * 0.6)}" cy="3" r="1.1"/>`).join('') +
    `</g>`
  )
}

// The cookie pops in, is bitten and crumbs fall, then he gulps the rest.
export function cookieCss(layers: number): string {
  return (
    `.cc{animation:cpop .35s cubic-bezier(.3,1.8,.5,1) backwards,cgulp .22s ease-in calc(${EAT} + 1.1s) forwards}` +
    `@keyframes cpop{from{transform:scale(0)}}@keyframes cgulp{to{transform:translateY(-7px) scale(0)}}` +
    // A mask's content is styled and animated even while its cookie is hidden
    // (masks ignore display:none), so a bite animation set on .bt alone ran at
    // load and every cookie came out already bitten (Fabio, 2026-11-22). The
    // animation's name is only set while that cookie's layer has focus, so it
    // starts with the click; the .btN delays still apply.
    `.bt{transform:scale(0);transform-box:fill-box;transform-origin:center;animation-duration:.12s;animation-timing-function:ease-out;animation-fill-mode:forwards}` +
    `${Array.from({ length: layers }, (_, i) => `.L${i + 1}:focus~.k${i + 1} .bt`).join(',')}{animation-name:bite}` +
    `.bt0{animation-delay:calc(${EAT} + .05s)}.bt1{animation-delay:calc(${EAT} + .4s)}.bt2{animation-delay:calc(${EAT} + .75s)}` +
    `@keyframes bite{to{transform:none}}` +
    `.crm{fill:${COLORS.cookieEdge};opacity:0;animation:crumb .6s ease-in}` +
    `.r0{animation-delay:calc(${EAT} + .05s)}.r1{animation-delay:calc(${EAT} + .4s)}.r2{animation-delay:calc(${EAT} + .75s)}` +
    `@keyframes crumb{0%{opacity:1}100%{opacity:0;transform:translateY(28px)}}`
  )
}
