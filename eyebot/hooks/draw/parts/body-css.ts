// The body's own CSS: the wandering loop (keyframes from keyframes.ts), pausing
// it, and how he shows in a new drawing. The face's rules are in face.ts;
// touch, sleep, heat, visits and cookies have their own in features/.

import { FADE_IN } from '../../character/tuning.ts'
import { K } from '../classes.ts'

// How he shows in a new drawing: hidden until FADE_IN, then a fast fade.
export const RBIN = `rbin .15s ease-out ${FADE_IN} backwards`

export const bodyCss = () =>
  // The wandering loop (keyframes from keyframes.ts).
  `.${K.loop}{animation-timing-function:linear;animation-iteration-count:infinite}` +
  `.${K.travel}{animation-name:mv}.${K.tilt}{animation-name:tl}.${K.wheel}{animation-name:wh}.${K.eyesRoam}{animation-name:ey}` +
  // He stops under the mouse, and on his spot while he fetches a cookie.
  `svg:hover .${K.loop},.${K.travel}:focus-within,.${K.travel}:focus-within .${K.loop}{animation-play-state:paused}` +
  // A new drawing shows him only once the old one on top is about to go.
  `.${K.bot}{animation:${RBIN}}@keyframes rbin{from{opacity:0}}` +
  `@keyframes hop{0%,100%{transform:none}35%{transform:translateY(-7px)}60%{transform:translateY(1px)}}`
