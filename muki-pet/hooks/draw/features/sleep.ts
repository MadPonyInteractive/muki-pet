// The sleep z's over his head. Hidden until the asleep mood shows them (its
// face rules in character/moods.ts).

import { COLORS } from '../../character/palette.ts'
import { K } from '../classes.ts'
import type { Feature } from '../feature.ts'

const zs = () =>
  `<g class="${K.zz}" transform="translate(24,-52)" fill="${COLORS.eye}" font-family="sans-serif" font-weight="700">` +
  `<text class="${K.z1}" font-size="9">z</text><text class="${K.z2}" x="5" y="-3" font-size="7">z</text></g>`

const sleepCss = () =>
  `.${K.zz}{display:none}.${K.zz} text{animation:zz 2.6s ease-out infinite;opacity:0}.${K.zz} .${K.z2}{animation-delay:1.3s}` +
  `@keyframes zz{0%{opacity:0;transform:translate(0,0) scale(.6)}25%{opacity:.9}100%{opacity:0;transform:translate(7px,-12px) scale(1.15)}}`

export const sleep: Feature = {
  name: 'sleep',
  css: sleepCss,
  slots: { overHead: zs },
}
