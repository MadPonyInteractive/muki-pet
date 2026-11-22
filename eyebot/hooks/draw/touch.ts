// Touch: four invisible strips over the robot. While the button is held
// (petting), the strip under the hand says which way his head leans into it,
// and hearts float up. A click focuses a strip (tabindex), which starts the
// boop wobble. The press, bliss and wobble rules are in body-css.ts.

import { COLORS } from './constants.ts'

// How far his head leans for each strip, left to right.
const PETS = [-9, -4, 4, 9]

export const petZones = () =>
  PETS.map((_, i) => `<rect class="p p${i}" x="${-26 + i * 13}" y="-66" width="13" height="68" tabindex="0"/>`).join('')

export const petCss = () => PETS.map((deg, i) => `.bot:active>.p${i}:hover~.bd .pt{transform:rotate(${deg}deg)}`).join('')

// A small heart that floats up while he is being petted.
function heart(cls: string, x: number, y: number): string {
  return (
    `<g transform="translate(${x},${y})"><path class="hrt ${cls}" fill="${COLORS.blush}" ` +
    `d="M0,3C-5,-1 -3.5,-5.5 0,-2.2C3.5,-5.5 5,-1 0,3Z"/></g>`
  )
}

export const hearts = () => heart('h0', -31, -40) + heart('h1', 31, -46) + heart('h2', -27, -54)
