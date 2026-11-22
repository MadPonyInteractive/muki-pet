// The head: a thin neck and the screen with its face. `.ln` leans it, `.pt`
// tilts it into a hand, `.tl` tilts it while wandering. `extra` is what the
// features draw on it (sweat, a rainbow), in head coordinates.

import { COLORS } from '../../character/palette.ts'
import { K } from '../classes.ts'
import { face } from './face.ts'

export const head = (extra: string) =>
  `<g transform="translate(0,-24)"><g class="${K.lean}"><g class="${K.petTilt}"><g class="${K.tilt} ${K.loop}">` +
  `<line class="${K.bezel}" x1="0" y1="0" x2="0" y2="-13" stroke="${COLORS.bezel}" stroke-width="4" stroke-linecap="round"/>` +
  `<rect class="${K.bezel}" x="-28" y="-50" width="56" height="38" rx="11" fill="${COLORS.screen}" stroke="${COLORS.bezel}" stroke-width="3.5"/>` +
  face() +
  extra +
  `</g></g></g></g>`
