// The robot's body: wheels, chassis, neck and head, and the groups around them
// that the features hook into (see feature.ts for the places, `SlotName`).
// This file knows no feature: it only leaves room for what they bring.
//
// Nesting, outside in: ground line, `.mv` (slides along the band, wanders),
// `.ix` (carries everything that travels with him; a visit moves it), `.bot`
// (him), `.bd` (his body), then scale, hop, squash and wobble groups round the
// parts.

import { COLORS, SCALE } from '../../character/palette.ts'
import { K } from '../classes.ts'
import type { SlotName } from '../feature.ts'
import { FACE_DEFS } from './face.ts'
import { head } from './head.ts'
import { wheelShape } from './wheels.ts'

const parts = (headExtra: string) =>
  wheelShape(-15) +
  wheelShape(15) +
  `<rect class="${K.chassis}" x="-21" y="-27" width="42" height="11" rx="5.5" fill="${COLORS.bezel}"/>` +
  head(headExtra)

// The robot and his surroundings, from <defs> to the closing </svg> tag.
// `defs` adds to the shared <defs>; `slots` is what each feature drew, by place.
export function robotMarkup(W: number, ground: number, defs: string, slots: Record<SlotName, string>): string {
  return (
    `<defs>${FACE_DEFS}${defs}</defs>` +
    `<line x1="0" y1="${ground + 0.5}" x2="${W}" y2="${ground + 0.5}" stroke="${COLORS.bezel}" stroke-opacity=".45"/>` +
    `<g transform="translate(0,${ground})">` +
    slots.scene +
    `<g class="${K.travel} ${K.loop}">` +
    slots.props +
    `<g class="${K.carry}">` +
    slots.behind +
    `<g class="${K.bot}"><ellipse cx="0" cy="0.5" rx="24" ry="2.5" fill="#000" fill-opacity=".3"/>` +
    slots.zones +
    `<g class="${K.body}"><g transform="scale(${SCALE})"><g class="${K.hop}"><g class="${K.squash}"><g class="${K.wobble}">${parts(slots.head)}</g></g></g></g>` +
    slots.ground +
    slots.overHead +
    `</g></g>` +
    slots.front +
    `</g></g></g></svg>`
  )
}
