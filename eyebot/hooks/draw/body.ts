// The robot's markup: wheels, chassis, neck, the screen head with its eyes,
// and everything that rides along with him. Class names are what the CSS
// files hook into: `.s` runs the wandering loop, `.ln`/`.pt`/`.tl` lean the
// head, `.gz`/`.ey` move the eyes, `.eye`/`.top`/`.lid` shape the face.

import { COLORS, SCALE, WHEEL_R } from '../character/palette.ts'
import { r1 } from './math.ts'
import { puddle, rainbow } from './cookies/sick.ts'
import { sweat } from './heat.ts'
import { hearts, petZones } from './touch.ts'

// One eye: the eye itself, a top lid hidden above it (slides down for angry,
// sleepy, sad) and a bottom lid below (rises for happy).
function eyeShape(dx: number, side: 'L' | 'R'): string {
  return (
    `<g transform="translate(${dx},0)">` +
    `<rect class="eye eye${side}" x="-5.5" y="-7" width="11" height="14" rx="4" fill="${COLORS.eye}"/>` +
    // `.tw` (tired) lowers the lid a little more on top of any mood when he's hot.
    `<g class="tw"><rect class="top top${side}" x="-10" y="-25" width="20" height="18" fill="${COLORS.screen}"/></g>` +
    `<ellipse class="lid" cx="0" cy="16" rx="10" ry="9" fill="${COLORS.screen}"/>` +
    `</g>`
  )
}

function wheelShape(dx: number): string {
  const spokes = [0, 120, 240]
    .map(a => {
      const r = (a * Math.PI) / 180
      return `<line x1="0" y1="0" x2="${r1(Math.cos(r) * 7.5)}" y2="${r1(Math.sin(r) * 7.5)}"/>`
    })
    .join('')
  return (
    `<g transform="translate(${dx},${-WHEEL_R})"><g class="wh s"><g class="sp"><g class="vw">` +
    `<circle class="ty rm" r="${WHEEL_R - 1}" fill="${COLORS.tyre}" stroke="${COLORS.rim}" stroke-width="2.5"/>` +
    `<g class="rm" stroke="${COLORS.rim}" stroke-width="2" stroke-linecap="round">${spokes}</g>` +
    `<circle r="2.4" fill="${COLORS.eye}"/>` +
    `</g></g></g></g>`
  )
}

// The face on the screen: eyes (blinking in `.b1`/`.b2`), blush and mouth.
const face = () =>
  `<g clip-path="url(#scr)"><g class="gz"><g class="ey s"><g transform="translate(0,-31)">` +
  `<g class="b1"><g class="b2">${eyeShape(-11, 'L')}${eyeShape(11, 'R')}</g></g>` +
  `</g></g></g>` +
  `<g class="bl" fill="${COLORS.blush}"><ellipse cx="-17" cy="-21" rx="5" ry="2.5"/><ellipse cx="17" cy="-21" rx="5" ry="2.5"/></g>` +
  `<rect class="mo" x="-3.5" y="-20.75" width="7" height="3.5" rx="1.75" fill="${COLORS.eye}"/>` +
  `</g>`

const head = () =>
  `<g transform="translate(0,-24)"><g class="ln"><g class="pt"><g class="tl s">` +
  `<line class="bz" x1="0" y1="0" x2="0" y2="-13" stroke="${COLORS.bezel}" stroke-width="4" stroke-linecap="round"/>` +
  `<rect class="bz" x="-28" y="-50" width="56" height="38" rx="11" fill="${COLORS.screen}" stroke="${COLORS.bezel}" stroke-width="3.5"/>` +
  face() +
  sweat() +
  rainbow() +
  `</g></g></g></g>`

const body = () =>
  wheelShape(-15) +
  wheelShape(15) +
  `<rect class="chs" x="-21" y="-27" width="42" height="11" rx="5.5" fill="${COLORS.bezel}"/>` +
  head()

// Sleep z's, and the "?" / "!" of a prop visit, over his head.
const overHead = () =>
  `<g class="zz" transform="translate(24,-52)" fill="${COLORS.eye}" font-family="sans-serif" font-weight="700">` +
  `<text class="z1" font-size="9">z</text><text class="z2" x="5" y="-3" font-size="7">z</text></g>` +
  `<g class="vq" transform="translate(20,-58)" fill="${COLORS.eye}" font-family="sans-serif" font-weight="700" font-size="11">` +
  `<text class="vq1">?</text><text class="vq2" x="1">!</text></g>`

// The robot and his surroundings, in two parts: a prop being visited goes
// between them. `defs` adds to the shared <defs>; `strips` and `cookies` come
// from the cookie game.
export function robotMarkup(W: number, ground: number, game: { defs: string; strips: string; cookies: string }) {
  return {
    before:
      `<defs><clipPath id="scr"><rect x="-26" y="-48" width="52" height="34" rx="9"/></clipPath>` +
      game.defs +
      `</defs>` +
      `<line x1="0" y1="${ground + 0.5}" x2="${W}" y2="${ground + 0.5}" stroke="${COLORS.bezel}" stroke-opacity=".45"/>` +
      `<g transform="translate(0,${ground})"><g class="mv s">`,
    after:
      // `.ix` carries everything that travels with him (moved by a visit).
      `<g class="ix">` +
      game.strips +
      `<g class="bot"><ellipse cx="0" cy="0.5" rx="24" ry="2.5" fill="#000" fill-opacity=".3"/>` +
      petZones() +
      `<g class="bd"><g transform="scale(${SCALE})"><g class="hop"><g class="sq"><g class="wg">${body()}</g></g></g></g>` +
      puddle() +
      hearts() +
      overHead() +
      `</g></g>` +
      game.cookies +
      `</g></g></g></svg>`,
  }
}
