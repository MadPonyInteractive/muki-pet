// What the robot does with a cookie: dash, eat, joy, roll home.
//
// The robot is always shown, so an animation on him only restarts when its
// name changes: clicks in a row alternate between set A (odd layers) and set B
// (even), and the 6th cookie (set C) adds being sick (sick.ts). All times count
// from the click; --t is the dash, he eats from there, and rolls home at `stay`.

import { DASH, ROLL } from '../../character/tuning.ts'
import { RBIN } from '../body-css.ts'

export const EAT = 'calc(var(--t) + .15s)'
export const STAY_EAT = 'calc(var(--t) + 3s)'
export const STAY_SICK = 'calc(var(--t) + 7.4s)'

export function eatingCss(set: string, layers: number[], stay: string): string {
  const on = (sub: string) => layers.map(k => `.L${k}:focus~.bot${sub}`).join(',')
  const x = (name: string) => name + set
  const sick = set === 'C'
  return (
    // The dash there and the roll home, body and wheels.
    `${on('')}{transform:translateX(var(--d));transition:transform var(--t) ${DASH};animation:${RBIN},${x('home')} var(--r) ${ROLL} ${stay} forwards}` +
    `@keyframes ${x('home')}{from{transform:translateX(var(--d))}to{transform:none}}` +
    `${on(' .sp')}{transform:rotate(var(--w));transition:transform var(--t) ${DASH};animation:${x('spin')} var(--r) ${ROLL} ${stay} forwards}` +
    `@keyframes ${x('spin')}{from{transform:rotate(var(--w))}to{transform:none}}` +
    // His head: leans back on the dash, swings on the stop, the same going home.
    `${on(' .ln')}{animation:${x('lean')} var(--t) ease-in-out,${x('swing')} .9s ease-out var(--t),` +
    `${x('leanb')} var(--r) ease-in-out ${stay},${x('swingb')} .9s ease-out calc(${stay} + var(--r))` +
    (sick ? `,ill 2.9s ease-in-out calc(var(--t) + 1.5s)` : '') +
    `}` +
    `@keyframes ${x('lean')}{30%,80%{transform:rotate(calc(var(--s) * -15deg))}}` +
    `@keyframes ${x('swing')}{25%{transform:rotate(calc(var(--s) * 13deg))}55%{transform:rotate(calc(var(--s) * -6deg))}80%{transform:rotate(calc(var(--s) * 2.5deg))}}` +
    `@keyframes ${x('leanb')}{30%,80%{transform:rotate(calc(var(--s) * 8deg))}}` +
    `@keyframes ${x('swingb')}{25%{transform:rotate(calc(var(--s) * -7deg))}55%{transform:rotate(calc(var(--s) * 3deg))}}` +
    // His eyes: on the cookie, then on the way home.
    `${on(' .gz')}{animation:${x('look')} var(--t) ease-out,${x('lookb')} var(--r) ease-in-out ${stay}` +
    (sick ? `,dizzy .8s linear calc(var(--t) + 4.4s) 3` : '') +
    `}` +
    `@keyframes ${x('look')}{25%,85%{transform:translate(calc(var(--s) * 6px),-1px)}}` +
    `@keyframes ${x('lookb')}{15%,85%{transform:translate(calc(var(--s) * -5px),0)}}` +
    // Chewing, then "^ ^" and a blush (no joy when he's about to be sick).
    `${on(' .mo')}{animation:${x('chew')} .34s ease-in-out ${EAT} 4` +
    (sick ? `,gag 2.2s ease-in-out calc(var(--t) + 2.3s),sickc 5.8s ease-out calc(var(--t) + 1.5s)` : '') +
    `}` +
    `@keyframes ${x('chew')}{0%,100%{transform:scale(.75,.35)}50%{transform:none}}` +
    (sick
      ? ''
      : `${on(' .lid')}{animation:${x('joy')} 1.6s ease-out calc(var(--t) + 1.3s)}@keyframes ${x('joy')}{15%,80%{transform:translateY(-10px)}}` +
        `${on(' .hop')}{animation:${x('hop')} .5s ease-out calc(var(--t) + 1.4s) 2}@keyframes ${x('hop')}{0%,100%{transform:none}35%{transform:translateY(-7px)}60%{transform:translateY(1px)}}` +
        `${on(' .bl')}{opacity:.8;transition:opacity .3s calc(var(--t) + 1.3s)}`)
  )
}
