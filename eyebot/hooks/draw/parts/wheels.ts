// A wheel: tyre, three spokes and a hub. `.wh` wanders, `.sp` spins on the
// dash to a cookie, `.vw` spins during a visit.

import { COLORS, WHEEL_R } from '../../character/palette.ts'
import { K } from '../classes.ts'
import { r1 } from '../math.ts'

export function wheelShape(dx: number): string {
  const spokes = [0, 120, 240]
    .map(a => {
      const r = (a * Math.PI) / 180
      return `<line x1="0" y1="0" x2="${r1(Math.cos(r) * 7.5)}" y2="${r1(Math.sin(r) * 7.5)}"/>`
    })
    .join('')
  return (
    `<g transform="translate(${dx},${-WHEEL_R})"><g class="${K.wheel} ${K.loop}"><g class="${K.spin}"><g class="${K.visitWheel}">` +
    `<circle class="${K.tyre} ${K.rim}" r="${WHEEL_R - 1}" fill="${COLORS.tyre}" stroke="${COLORS.rim}" stroke-width="2.5"/>` +
    `<g class="${K.rim}" stroke="${COLORS.rim}" stroke-width="2" stroke-linecap="round">${spokes}</g>` +
    `<circle r="2.4" fill="${COLORS.eye}"/>` +
    `</g></g></g></g>`
  )
}
