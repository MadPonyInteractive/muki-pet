// Mad at you, inside one drawing (MPI-5, Fabio 2026-11-22):
//  - booped too many times in a row (the top boop layer has focus, see
//    touch.ts): angry lids, no happy face, no hearts, and he dodges your hand,
//    leaning his body away from the side the mouse is on;
//  - woken from sleep: the mouse on him while he's asleep gets the angry face
//    instead of the happy one. Not when tired (30% context and over): then he
//    has no energy to get mad.
// Rules start with `.mv` so they beat touch's happy-face rules.

import { K, boopLayer, heatLevel, moodClass, petZone } from '../classes.ts'
import type { Feature } from '../feature.ts'
import { BOOP_LAYERS } from './touch.ts'

const top = `.${boopLayer(BOOP_LAYERS)}`
const bot = `.${K.travel} .${K.bot}`
const booped = `${bot}>${top}:focus~.${K.body}`
const woken = [0, 1].map((h) => `.${moodClass('asleep')}.${heatLevel(h)} ${bot}:hover`)

// The angry face, for each place it shows (`at` ends just above the face parts).
const angry = (at: string[]) => {
  const each = (part: string, decl: string) => `${at.map((a) => `${a} .${part}`).join(',')}{${decl}}`
  return (
    each(K.topL, 'transform:translateY(4px) rotate(20deg)') +
    each(K.topR, 'transform:translateY(4px) rotate(-20deg)') +
    each(K.eye, 'transform:scaleY(.92)') +
    each(K.lid, 'transform:none') +
    each(K.hop, 'animation:none') +
    each(K.blush, 'opacity:0') +
    each(K.heart, 'animation:none')
  )
}

// Which way he dodges from each strip of the wide top layer: away from the hand.
const DODGE = [30, 30, -30, -30]

const madCss = () =>
  angry([booped, ...woken]) +
  `.${moodClass('asleep')} ${bot}:hover .${K.zz}{display:none}` +
  `.${K.body}{transition:transform .35s cubic-bezier(.3,1.4,.5,1)}` +
  DODGE.map((dx, i) => `${bot}:has(>${top}:focus)>${top}.${petZone(i)}:hover~.${K.body}{transform:translateX(${dx}px)}`).join('')

export const mad: Feature = {
  name: 'mad',
  css: madCss,
}
