// The face on the screen: two eyes (each with a top and a bottom lid), blush
// and a mouth, plus the rules that belong to the face itself: where the eyes
// look when the mouse is over a strip, the resting lids, and blinking. Mood
// faces (moods.ts) and touch reactions (features/touch.ts) change these parts.

import { COLORS } from '../../character/palette.ts'
import { GLOW } from '../../character/tuning.ts'
import { K, gazeLevel } from '../classes.ts'

// One eye: the eye itself, a top lid hidden above it (slides down for angry,
// sleepy, sad) and a bottom lid below (rises for happy).
function eyeShape(dx: number, eye: string, top: string): string {
  return (
    `<g transform="translate(${dx},0)">` +
    `<rect class="${K.eye} ${eye}" x="-5.5" y="-7" width="11" height="14" rx="4" fill="${COLORS.eye}"/>` +
    // `.tw` (tired) lowers the lid a little more on top of any mood when he's hot.
    `<g class="${K.tired}"><rect class="${K.top} ${top}" x="-10" y="-25" width="20" height="18" fill="${COLORS.screen}"/></g>` +
    `<ellipse class="${K.lid}" cx="0" cy="16" rx="10" ry="9" fill="${COLORS.screen}"/>` +
    `</g>`
  )
}

// The face: eyes (blinking in `.b1`/`.b2`), blush and mouth.
export const face = () =>
  `<g clip-path="url(#scr)"><g class="${K.gaze}"><g class="${K.eyesRoam} ${K.loop}"><g transform="translate(0,-31)">` +
  `<g class="${K.blinkA}"><g class="${K.blinkB}">${eyeShape(-11, K.eyeL, K.topL)}${eyeShape(11, K.eyeR, K.topR)}</g></g>` +
  `</g></g></g>` +
  `<g class="${K.blush}" fill="${COLORS.blush}"><ellipse cx="-17" cy="-21" rx="5" ry="2.5"/><ellipse cx="17" cy="-21" rx="5" ry="2.5"/></g>` +
  `<rect class="${K.mouth}" x="-3.5" y="-20.75" width="7" height="3.5" rx="1.75" fill="${COLORS.eye}"/>` +
  `</g>`

// The clip every face is cut to, for the shared <defs>.
export const FACE_DEFS = `<clipPath id="scr"><rect x="-26" y="-48" width="52" height="34" rx="9"/></clipPath>`

// Where the eyes look while the mouse is over a strip, by its gaze level (set
// per strip in features/cookies/game.ts).
const gazeCss = () =>
  [-6, -4.5, -2.5, 2.5, 4.5, 6].map((gaze, i) => `.${gazeLevel(i)}:hover~.${K.bot} .${K.gaze}{transform:translate(${gaze}px,-1px)}`).join('')

export const faceCss = () =>
  `.${K.gaze}{transition:transform .22s ease-out}` +
  `.${K.strip}:hover~.${K.bot} .${K.eyesRoam}{transform:none!important}` +
  gazeCss() +
  `.${K.lid}{transition:transform .25s ease-out}` +
  // Going back to his mood's eyes waits GLOW: after a pet (touch.ts) or a
  // cookie (cookies/game.ts) put his face to rest, the plain eyes stay a
  // while. A transition never plays on load, so no redraw is needed (and none
  // may be: CLAUDE.md, no redraw from play). Mood changes slide by animation
  // (draw/moods.ts), so this delay doesn't touch them.
  `.${K.top}{transform:translateY(-3px)}.${K.eye},.${K.top},.${K.petTilt}{transition:transform .45s ease-out ${GLOW}}` +
  // Blinking: two overlapping rhythms. (`.b1`/`.b2` are taken: the cookie
  // bites once used them too and ran the blink instead of the bite; classes.ts
  // keeps every name apart now.)
  `.${K.blinkA}{animation:b1 4.7s infinite}.${K.blinkB}{animation:b2 7.3s infinite}` +
  `@keyframes b1{0%,94%,100%{transform:none}97%{transform:scaleY(.1)}}` +
  `@keyframes b2{0%,58%,64%,70%,100%{transform:none}61%,67%{transform:scaleY(.1)}}`
