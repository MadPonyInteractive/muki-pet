// One cookie: its drawing, its bites and crumbs, and their CSS.
//
// A "cookie" is one of three foods, picked at random (Fabio, 2026-11-26): a
// cookie, a hamburger or a slice of cake. Every layer's cookie holds all three
// drawings and shows one. The pick (the same trick as the toys', see
// features/toys.ts): an animation on the group round the cookies flips a
// custom property through 0, 1, 2 for ever, and it pauses while a strip has
// focus, which holds the number it had at the click. Each layer adds its own
// offset, so the foods of a run differ from one another.

import { COLORS } from '../../../character/palette.ts'
import { K, biteNo, cookieNo, crumbNo, foodNo, layerNo } from '../../classes.ts'
import { r1 } from '../../math.ts'
import { sec } from '../../timeline.ts'
import { biteDelay, gulpDelay } from './cues.ts'

// The foods, in pick order: their ids in <defs>.
const FOODS = ['ck', 'bg', 'cs']
// How long the pick stays on one food.
const PICK_S = 0.13
// What each layer adds to the pick (layer 1 first).
const OFFSET = [0, 2, 1, 1, 0, 2]

// The foods, each drawn once in <defs> and used by every layer's cookie. All
// are about 14 px across, round the same middle, so the bites fit each.
const COOKIE =
  `<g id="ck"><circle r="7" fill="${COLORS.cookie}" stroke="${COLORS.cookieEdge}" stroke-width="1.3"/>` +
  `<g fill="${COLORS.chip}"><circle cx="-2.8" cy="-2.2" r="1.2"/><circle cx="2.6" cy="-0.6" r="1.1"/><circle cx="-0.6" cy="3" r="1.2"/><circle cx="3.2" cy="3.6" r=".8"/><circle cx="-3.8" cy="1.6" r=".7"/></g></g>`
// A hamburger: bun with seeds, lettuce, cheese, patty, bun.
const BURGER =
  `<g id="bg"><path d="M-7,-.6A7,6.4 0 0 1 7,-.6Z" fill="#e3a352" stroke="#a86a2c" stroke-width=".8"/>` +
  `<g fill="#fff3d6"><ellipse cx="-3" cy="-3.6" rx=".9" ry=".5"/><ellipse cx=".6" cy="-5" rx=".9" ry=".5"/><ellipse cx="3.6" cy="-3" rx=".9" ry=".5"/></g>` +
  `<path d="M-7.6,-.2Q-5.7,1.8 -3.8,0T0,0T3.8,0T7.6,-.2V1H-7.6Z" fill="#6cc04a"/>` +
  `<rect x="-7.2" y=".9" width="14.4" height="3.1" rx="1.5" fill="#6b3a1e"/>` +
  `<path d="M-6,.9H1L-2.4,3.4Z" fill="#ffcf4d"/>` +
  `<rect x="-6.6" y="4" width="13.2" height="3" rx="1.5" fill="#e3a352" stroke="#a86a2c" stroke-width=".8"/></g>`
// A slice of cake, from the side: sponge, a cream line, pink icing, a cherry.
const CAKE =
  `<g id="cs"><path d="M-7,6.5V-1.5H7V6.5Z" fill="#f6d7a0" stroke="#c99a55" stroke-width=".8"/>` +
  `<rect x="-6.6" y="1.9" width="13.2" height="1.5" fill="#fff"/>` +
  `<path d="M-7.4,-1Q-7.4,-4.2 -4.4,-4.2H4.4Q7.4,-4.2 7.4,-1V.4Q6.2,2 5,.4T2.6,.4T.2,.4T-2.2,.4T-4.6,.4T-7.4,.4Z" fill="#ff8fb8"/>` +
  `<circle cx="1" cy="-5.8" r="1.9" fill="#e5484d"/><circle cx=".4" cy="-6.4" r=".5" fill="#ffb3b6"/></g>`
export const COOKIE_DEF = COOKIE + BURGER + CAKE

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
    `<g class="${K.cookie} ${cookieNo(k)}"><g class="${K.cookieCore}"><g mask="url(#bt${k})">${FOODS.map((id, i) => `<use class="${K.food} ${foodNo(i)}" href="#${id}"/>`).join('')}</g></g>` +
    `<mask id="bt${k}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="20" height="20">` +
    `<rect x="-10" y="-10" width="20" height="20" fill="#fff"/>` +
    BITES.map(([x, y], i) => `<circle class="${K.bite} ${biteNo(i)}" cx="${x}" cy="${y}" r="3.6"/>`).join('') +
    `</mask>` +
    BITES.map(([x], i) => `<circle class="${K.crumb} ${crumbNo(i)}" cx="${r1(x * 0.6)}" cy="-4" r="1.1"/>`).join('') +
    `</g>`
  )
}

// Which food each layer's cookie shows, by the pick held at the click.
function foodCss(layers: number): string {
  const n = FOODS.length
  const shown = (pick: number) => Array.from({ length: layers }, (_, i) => `.${cookieNo(i + 1)} .${foodNo((pick + OFFSET[i % OFFSET.length]!) % n)}`).join(',')
  return (
    `.${K.food}{display:none}` +
    `.${K.foods}{animation:fpk ${sec(Math.round(PICK_S * n * 100) / 100)}s step-end infinite}` +
    `@keyframes fpk{${FOODS.map((_, i) => `${Math.round((i * 1000) / n) / 10}%{--fp:${i}}`).join('')}}` +
    `.${K.strip}:focus~.${K.foods}{animation-play-state:paused}` +
    FOODS.map((_, pick) => `@container style(--fp:${pick}){${shown(pick)}{display:inline}}`).join('')
  )
}

// The cookie pops in, is bitten and crumbs fall, then he gulps the rest.
export function cookieCss(layers: number): string {
  return (
    foodCss(layers) +
    `.${K.cookieCore}{animation:cpop .35s cubic-bezier(.3,1.8,.5,1) backwards,cgulp .22s ease-in ${gulpDelay} forwards}` +
    `@keyframes cpop{from{transform:scale(0)}}@keyframes cgulp{to{transform:translateY(-7px) scale(0)}}` +
    // A mask's content is styled and animated even while its cookie is hidden
    // (masks ignore display:none), so a bite animation set on .bt alone ran at
    // load and every cookie came out already bitten (Fabio, 2026-11-22). The
    // animation's name is only set while that cookie's layer has focus, so it
    // starts with the click; the .btN delays still apply.
    `.${K.bite}{transform:scale(0);transform-box:fill-box;transform-origin:center;animation-duration:.12s;animation-timing-function:ease-out;animation-fill-mode:forwards}` +
    `${Array.from({ length: layers }, (_, i) => `.${layerNo(i + 1)}:focus~.${K.foods} .${cookieNo(i + 1)} .${K.bite}`).join(',')}{animation-name:bite}` +
    `.${biteNo(0)}{animation-delay:${biteDelay(0)}}.${biteNo(1)}{animation-delay:${biteDelay(1)}}.${biteNo(2)}{animation-delay:${biteDelay(2)}}` +
    `@keyframes bite{to{transform:none}}` +
    `.${K.crumb}{fill:${COLORS.cookieEdge};opacity:0;animation:crumb .6s ease-in}` +
    `.${crumbNo(0)}{animation-delay:${biteDelay(0)}}.${crumbNo(1)}{animation-delay:${biteDelay(1)}}.${crumbNo(2)}{animation-delay:${biteDelay(2)}}` +
    `@keyframes crumb{0%{opacity:1}100%{opacity:0;transform:translateY(28px)}}`
  )
}
