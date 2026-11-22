// The robot's always-on CSS: his wandering loop, mouse and touch reactions,
// sleep z's and blinking. Moods (moods.ts), heat (heat.ts), visits (visit.ts)
// and the cookie game (cookies/) add their own rules on top.

import { RBIN } from './constants.ts'
import { petCss } from './touch.ts'

// Where the eyes look while the mouse is over a strip, by its gaze level
// (`gN`, set per strip in cookies/game.ts).
const gazeCss = () =>
  [-6, -4.5, -2.5, 2.5, 4.5, 6].map((gaze, i) => `.g${i}:hover~.bot .gz{transform:translate(${gaze}px,-1px)}`).join('')

export const baseCss = () =>
  // The wandering loop (keyframes from keyframes.ts).
  `.s{animation-timing-function:linear;animation-iteration-count:infinite}` +
  `.mv{animation-name:mv}.tl{animation-name:tl}.wh{animation-name:wh}.ey{animation-name:ey}` +
  // He stops under the mouse, and on his spot while he fetches a cookie.
  `svg:hover .s,.mv:focus-within,.mv:focus-within .s{animation-play-state:paused}` +
  // A new drawing shows him only once the old one on top is about to go.
  `.bot{animation:${RBIN}}@keyframes rbin{from{opacity:0}}` +
  `.vp,.vq{display:none;pointer-events:none}.vq text{opacity:0}` +
  // Mouse: the strips are invisible; his eyes follow the mouse over them.
  `.c{fill:#000;fill-opacity:0;pointer-events:all;outline:none}` +
  `.gz{transition:transform .22s ease-out}` +
  `.c:hover~.bot .ey{transform:none!important}` +
  gazeCss() +
  `.bot:hover .ey{transform:translateY(-2px)!important}` +
  `.lid{transition:transform .25s ease-out}` +
  `.top{transform:translateY(-3px)}.eye,.top,.pt{transition:transform .45s ease-out}` +
  // Touch wins over any mood: his face goes back to rest under the happy look.
  `.mv .bot:hover .eye{transform:none}.mv .bot:hover .top{transform:translateY(-3px)}` +
  `.mv .bot:hover .gz{transform:none}.mv .bot:hover .pt{transform:none}` +
  // Sleep z's (shown by the asleep mood).
  `.zz{display:none}.zz text{animation:zz 2.6s ease-out infinite;opacity:0}.zz .z2{animation-delay:1.3s}` +
  `@keyframes zz{0%{opacity:0;transform:translate(0,0) scale(.6)}25%{opacity:.9}100%{opacity:0;transform:translate(7px,-12px) scale(1.15)}}` +
  `.bot:hover .lid{transform:translateY(-8px)}` +
  `.bot:hover .hop{animation:hop .5s ease-out}` +
  // Touch: a press squashes him and closes his eyes in bliss, a drag pets him.
  `.bot{cursor:grab}.bot:active{cursor:grabbing}` +
  `.bd{pointer-events:none}.p{fill:#000;fill-opacity:0;pointer-events:all;outline:none}` +
  `.sq{transition:transform .4s cubic-bezier(.3,1.9,.5,1)}` +
  `.bot:active .sq{transform:scale(1.07,.9);transition:transform .12s ease-out}` +
  `.bot:active .lid{transform:translateY(-11px)}` +
  petCss() +
  `.bl{opacity:0;transition:opacity 2.5s ease-in 1.2s}` +
  `.bot:active .bl{opacity:.8;transition:opacity .25s}` +
  `.hrt{opacity:0}.bot:active .hrt{animation:hrt 1.1s ease-out infinite}` +
  `.bot:active .h1{animation-delay:.37s}.bot:active .h2{animation-delay:.74s}` +
  `@keyframes hrt{0%{opacity:0;transform:scale(.4)}25%{opacity:1}100%{opacity:0;transform:translateY(-15px) scale(1.1)}}` +
  // A happy wobble when let go: a springy transition back from a lean, so it
  // plays only on release (an animation would also play whenever a new
  // drawing loads, under the old one still on top: a ghost).
  `.wg{transition:transform .8s cubic-bezier(.25,2.6,.45,.7)}` +
  `.bot:active .wg{transform:rotate(-4deg);transition:transform .15s ease-out}` +
  // A click (boop) is too short for the press to show, so letting go of a
  // focused strip plays a full boing and wobble from the held pose. It needs
  // focus, which a new drawing never has, so it can't replay under one. The
  // strip then hides for a moment, which drops its focus, so the next click
  // boops again (the cookie strips end the same way).
  `.bot:not(:active)>.p:focus~.bd .sq{animation:boing .5s ease-out}` +
  `.bot:not(:active)>.p:focus~.bd .wg{animation:wob .75s ease-out}` +
  `.bot:not(:active)>.p:focus{animation:pend .8s step-end forwards}` +
  `@keyframes boing{0%{transform:scale(1.07,.9)}35%{transform:scale(.95,1.06)}65%{transform:scale(1.02,.98)}100%{transform:none}}` +
  `@keyframes wob{0%{transform:rotate(-4deg)}22%{transform:rotate(5deg)}45%{transform:rotate(-3deg)}68%{transform:rotate(1.5deg)}100%{transform:none}}` +
  `@keyframes pend{to{visibility:hidden}}` +
  `@keyframes hop{0%,100%{transform:none}35%{transform:translateY(-7px)}60%{transform:translateY(1px)}}` +
  // Blinking: two overlapping rhythms. (`.b1`/`.b2` are taken: the cookie
  // bites once used them too and ran the blink instead of the bite.)
  `.b1{animation:b1 4.7s infinite}.b2{animation:b2 7.3s infinite}` +
  `@keyframes b1{0%,94%,100%{transform:none}97%{transform:scaleY(.1)}}` +
  `@keyframes b2{0%,58%,64%,70%,100%{transform:none}61%,67%{transform:scaleY(.1)}}`
