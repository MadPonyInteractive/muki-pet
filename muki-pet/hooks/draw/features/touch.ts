// Touch: four invisible strips over the robot. Hovering him lifts his eyes and
// he hops; while the button is held (petting), the strip under the hand says
// which way his head leans into it, and hearts float up. A click focuses a
// strip (tabindex), which starts the boop wobble.
//
// Boops in a row (MPI-5): the strips come in BOOP_LAYERS layers, like the
// cookie game's. A layer takes clicks only while a strip of the layer below
// has focus, and a focus lasts IN_A_ROW, so each click before then climbs a
// layer. The top layer is wider and makes him mad (features/mad.ts). Tired
// (30% context and over) he has no energy for it: the ladder is off.

import { COLORS } from '../../character/palette.ts'
import { K, boopLayer, heartNo, heatLevel, petZone } from '../classes.ts'
import type { Feature } from '../feature.ts'

// How far his head leans for each strip, left to right.
const PETS = [-9, -4, 4, 9]

export const BOOP_LAYERS = 5
// How long a boop's focus lasts: a click before then is the next in a row.
const IN_A_ROW = '1.5s'
// How long he stays mad (the top layer's focus).
const MAD_FOR = '15s'
const layers = Array.from({ length: BOOP_LAYERS }, (_, i) => i + 1)

// The top layer is wider, so he can dodge your hand inside it.
const petZones = () =>
  layers
    .map((k) => {
      const w = k < BOOP_LAYERS ? 13 : 35
      return PETS.map((_, i) => `<rect class="${K.pet} ${petZone(i)} ${boopLayer(k)}" x="${-2 * w + i * w}" y="-66" width="${w}" height="68" tabindex="0"/>`).join('')
    })
    .join('')

const ladderCss = (bot: string) =>
  `${layers.slice(1).map((k) => `.${boopLayer(k)}`).join(',')}{pointer-events:none}` +
  layers.slice(1).map((k) => `${bot}:has(>.${boopLayer(k - 1)}:focus)>.${boopLayer(k)}{pointer-events:all}`).join('') +
  // Mad: the whole top layer takes the mouse, so he can dodge it.
  `${bot}:has(>.${boopLayer(BOOP_LAYERS)}:focus)>.${boopLayer(BOOP_LAYERS)}{pointer-events:all}` +
  `${bot}:not(:active)>.${K.pet}:focus{animation-duration:${IN_A_ROW}}` +
  `${bot}:not(:active)>.${boopLayer(BOOP_LAYERS)}:focus{animation-duration:${MAD_FOR}}` +
  // Tired: one layer, and the old quick hand-back of the focus.
  `.${heatLevel(2)} .${boopLayer(2)},.${heatLevel(3)} .${boopLayer(2)}{pointer-events:none!important}` +
  `.${heatLevel(2)} ${bot}:not(:active)>.${K.pet}:focus,.${heatLevel(3)} ${bot}:not(:active)>.${K.pet}:focus{animation-duration:.8s}`

const petCss = () => PETS.map((deg, i) => `.${K.bot}:active>.${petZone(i)}:hover~.${K.body} .${K.petTilt}{transform:rotate(${deg}deg);transition:transform .45s ease-out}`).join('')

// A small heart that floats up while he is being petted.
function heart(i: number, x: number, y: number): string {
  return (
    `<g transform="translate(${x},${y})"><path class="${K.heart} ${heartNo(i)}" fill="${COLORS.blush}" ` +
    `d="M0,3C-5,-1 -3.5,-5.5 0,-2.2C3.5,-5.5 5,-1 0,3Z"/></g>`
  )
}

const hearts = () => heart(0, -31, -40) + heart(1, 31, -46) + heart(2, -27, -54)

const bot = `.${K.bot}`

const touchCss = () =>
  `${bot}:hover .${K.eyesRoam}{transform:translateY(-2px)!important}` +
  // Touch wins over any mood: his face goes back to rest under the happy look.
  // Eyes, lids and head start after .3 s (a mouse just crossing him doesn't
  // count), and once you go they stay plain for GLOW (face.ts) before his
  // mood's eyes come back (Fabio, 2026-11-22).
  `.${K.travel} ${bot}:hover .${K.eye}{transform:none;transition:transform .45s ease-out .3s}` +
  `.${K.travel} ${bot}:hover .${K.top}{transform:translateY(-3px);transition:transform .45s ease-out .3s}` +
  `.${K.travel} ${bot}:hover .${K.gaze}{transform:none}` +
  `.${K.travel} ${bot}:hover .${K.petTilt}{transform:none;transition:transform .45s ease-out .3s}` +
  `${bot}:hover .${K.lid}{transform:translateY(-8px)}` +
  `${bot}:hover .${K.hop}{animation:hop .5s ease-out}` +
  // Touch: a press squashes him and closes his eyes in bliss, a drag pets him.
  `${bot}{cursor:grab}${bot}:active{cursor:grabbing}` +
  `.${K.body}{pointer-events:none}.${K.pet}{fill:#000;fill-opacity:0;pointer-events:all;outline:none}` +
  `.${K.squash}{transition:transform .4s cubic-bezier(.3,1.9,.5,1)}` +
  `${bot}:active .${K.squash}{transform:scale(1.07,.9);transition:transform .12s ease-out}` +
  `${bot}:active .${K.lid}{transform:translateY(-11px)}` +
  petCss() +
  `.${K.blush}{opacity:0;transition:opacity 2.5s ease-in 1.2s}` +
  `${bot}:active .${K.blush}{opacity:.8;transition:opacity .25s}` +
  `.${K.heart}{opacity:0}${bot}:active .${K.heart}{animation:hrt 1.1s ease-out infinite}` +
  `${bot}:active .${heartNo(1)}{animation-delay:.37s}${bot}:active .${heartNo(2)}{animation-delay:.74s}` +
  `@keyframes hrt{0%{opacity:0;transform:scale(.4)}25%{opacity:1}100%{opacity:0;transform:translateY(-15px) scale(1.1)}}` +
  // A happy wobble when let go: a springy transition back from a lean, so it
  // plays only on release (an animation would also play whenever a new
  // drawing loads, under the old one still on top: a ghost).
  `.${K.wobble}{transition:transform .8s cubic-bezier(.25,2.6,.45,.7)}` +
  `${bot}:active .${K.wobble}{transform:rotate(-4deg);transition:transform .15s ease-out}` +
  // A click (boop) is too short for the press to show, so letting go of a
  // focused strip plays a full boing and wobble from the held pose. It needs
  // focus, which a new drawing never has, so it can't replay under one. The
  // strip then hides for a moment, which drops its focus, so the next click
  // boops again (the cookie strips end the same way).
  `${bot}:not(:active)>.${K.pet}:focus~.${K.body} .${K.squash}{animation:boing .5s ease-out}` +
  `${bot}:not(:active)>.${K.pet}:focus~.${K.body} .${K.wobble}{animation:wob .75s ease-out}` +
  `${bot}:not(:active)>.${K.pet}:focus{animation:pend .8s step-end forwards}` +
  `@keyframes boing{0%{transform:scale(1.07,.9)}35%{transform:scale(.95,1.06)}65%{transform:scale(1.02,.98)}100%{transform:none}}` +
  `@keyframes wob{0%{transform:rotate(-4deg)}22%{transform:rotate(5deg)}45%{transform:rotate(-3deg)}68%{transform:rotate(1.5deg)}100%{transform:none}}` +
  `@keyframes pend{to{visibility:hidden}}` +
  ladderCss(bot)

export const touch: Feature = {
  name: 'touch',
  css: touchCss,
  slots: { zones: petZones, overHead: hearts },
}
