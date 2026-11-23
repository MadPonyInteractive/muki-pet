// A temper tantrum (Fabio, 2026-11-22): every 2 minutes, for about 5 s, he
// stamps his wheels on the spot, fast, one then the other, shakes his head "no"
// and steam puffs off his head. A red heart pops up over him, cracks in the
// middle, its halves fall to the floor and his wheels squash them flat as he
// stomps (MPI-19, Fabio 2026-11-23). The tantrum mood (character/moods.ts)
// shows the marks and starts the `stomp` and `shake` loops; this file has the
// marks and the keyframes. Hover or touch stops it while your hand is on him
// (petting calms him), and play that lasts PLAY_MS calms him for the rest of
// the drawing (RAGE below). A trip (a prop or the paper pile) has no tantrum.

import { SCALE } from '../../character/palette.ts'
import { PLAY_MS } from '../../character/tuning.ts'
import { K, moodClass } from '../classes.ts'
import type { Feature } from '../feature.ts'
import { r1 } from '../math.ts'
import { calm } from '../parts/body-css.ts'
import { WHEEL_DX } from '../parts/body.ts'
import { type Stop, timeline } from '../timeline.ts'

// One cycle: the burst, then calm until the next one.
const CYCLE = 120
const BURST = 5
const SWINGS = 20

const { at, track } = timeline(CYCLE)

// How angry he is, 1 to 0: every move and mark of the tantrum is scaled by it.
// Your hand on him, or a cookie, for PLAY_MS (the time the brain counts as
// play) turns it to 0 for the rest of this drawing, so he is calm at once and
// stays calm after you go, with no redraw (Fabio 2026-11-23: "okay right away").
// The switch is an animation that runs only while you play and holds its end.
const RAGE = 'var(--rage)'
const byRage = (n: number, unit = '') => `calc(${n}${unit} * ${RAGE})`

// Stop i of the burst (1 to SWINGS - 1): when it comes, and how strong it is
// (strong at first, a little weaker at the end).
const stopTime = (i: number) => (i * BURST) / SWINGS
const strength = (i: number) => 1 - (i / SWINGS) * 0.3

// Back-and-forth stops over the burst, still the rest of the cycle.
function swing(name: string, value: (side: number, fade: number, i: number) => string): string {
  let stops = `0%{transform:none}`
  for (let i = 1; i < SWINGS; i++) stops += `${at(stopTime(i))}{transform:${value(i % 2 ? 1 : -1, strength(i), i)}}`
  return `@keyframes ${name}{${stops}${at(BURST)},100%{transform:none}}`
}

// The stomp (Fabio, 2026-11-23: "a lot faster ... like kids do when they have
// a temper tantrum, one leg at a time"): on the spot, he rocks onto one wheel,
// lifting the other, and slams it down, then the other wheel, STOMPS times in
// the burst. Stomp k: the lift peaks a little past its middle, the slam (a
// small squash) ends it. Even k is his right wheel, odd k his left.
const STOMPS = 34
const STOMP_S = BURST / STOMPS
const stompSide = (k: number) => (k % 2 ? -1 : 1)
const slamTime = (k: number) => (k + 1) * STOMP_S
const LIFT_DEG = 10
// Tilted about the other wheel's foot, so the stamping wheel comes up.
const lift = (side: number, deg: number) => {
  const pivot = -side * WHEEL_DX
  return `translate(${pivot}px,0) rotate(${byRage(r1(-side * deg), 'deg')}) translate(${-pivot}px,0)`
}
const stompKeyframes = () => {
  let stops = `0%{transform:none}`
  for (let k = 0; k < STOMPS; k++) {
    const fade = 1 - (k / STOMPS) * 0.3
    stops += `${at(k * STOMP_S + STOMP_S * 0.55)}{transform:${lift(stompSide(k), LIFT_DEG * fade)}}`
    stops += `${at(slamTime(k))}{transform:scale(calc(1 + .04 * ${RAGE}),calc(1 - .05 * ${RAGE}))}`
  }
  return `@keyframes stomp{${stops}${at(BURST + 0.1)},100%{transform:none}}`
}

// Where his wheel comes down on side `side`, in the body group's units.
const wheelAt = (side: number) => SCALE * side * WHEEL_DX

// The heart's cues, in s from the burst's start.
const HEART = {
  pop: 0.12,
  set: 0.22,
  beat: 0.36,
  beatEnd: 0.48,
  crack: 0.6,
  parted: 0.72,
  fall: 0.8,
  land: 1.18,
  bounce: 1.27,
  rest: 1.35,
  fade: BURST - 0.4,
  gone: BURST,
}
// Where the heart floats, in the steam group (which sits at -62 over the ground).
const HEART_Y = -3
const HEART_SCALE = 1.5
// How far a half drops: from the heart's middle to lying on the floor.
const DROP = 62 - HEART_Y - 3.5

// The first few slams of each wheel once its half lies there: each flattens it
// a little more.
const hits = (side: number) =>
  Array.from({ length: STOMPS }, (_, k) => k)
    .filter((k) => stompSide(k) === side && slamTime(k) > HEART.rest)
    .slice(0, 3)
    .map(slamTime)

// The halves of the heart: same outline as the petting hearts (touch.ts), cut
// down the middle along a zigzag crack. Both share the crack, so together they
// are the whole heart.
const CRACK = 'L.6,1.6L-.6,.3L.7,-1Z'
const HALF_LEFT = `M0,-2.2C-3.5,-5.5 -5,-1 0,3${CRACK}`
const HALF_RIGHT = `M0,-2.2C3.5,-5.5 5,-1 0,3${CRACK}`
const RED = '#e0484a'

const half = (flat: string, fall: string, d: string) =>
  `<g class="${flat}"><g class="${fall}"><path transform="scale(${HEART_SCALE})" d="${d}"/></g></g>`

const PUFFS = [-12, 12, -4, 6]
const puff = (x: number) => `<circle class="${K.puff}" cx="${x}" cy="0" r="3.2"/>`
// Each puff a little after the last (no inline styles: one rule per puff).
const puffDelays = () => PUFFS.map((_, i) => `.${K.puff}:nth-child(${i + 1}){animation-delay:${r1(2 + i * 0.9)}s}`).join('')

const marks = () =>
  `<g class="${K.steam}" transform="translate(0,-62)">` +
  `<g fill="#d8dde6" fill-opacity=".85">${PUFFS.map(puff).join('')}</g>` +
  `<g transform="translate(0,${HEART_Y})" fill="${RED}"><g class="${K.heartBreak}">` +
  half(K.flatLeft, K.halfLeft, HALF_LEFT) +
  half(K.flatRight, K.halfRight, HALF_RIGHT) +
  `</g></g></g>`

// Pops in, beats once, and fades at the burst's end.
const heartStops: Stop[] = [
  [0, 'opacity:0;transform:scale(.3)'],
  [HEART.pop, 'opacity:1;transform:scale(1.3)'],
  [HEART.set, 'transform:none'],
  [HEART.beat, 'transform:scale(1.15)'],
  [HEART.beatEnd, 'transform:none'],
  [HEART.fade, 'opacity:1'],
  [HEART.gone, 'opacity:0'],
]

// A half cracks off, tilting out, falls with a tumble and lies on its back,
// on the spot where his wheel will come down.
function fallStops(side: number): Stop[] {
  const x = r1(wheelAt(side) - side * 2)
  const lying = (lift: number, turn: number) => `transform:translate(${x}px,${r1(DROP - lift)}px) rotate(${side * turn}deg)`
  const parted = `transform:translate(${side * 1.5}px,-1px) rotate(${side * 18}deg)`
  return [
    [0, 'transform:none'],
    [HEART.crack, 'transform:none'],
    [HEART.parted, parted],
    [HEART.fall, `${parted};animation-timing-function:cubic-bezier(.55,.085,.68,.53)`],
    [HEART.land, lying(0, 90)],
    [HEART.bounce, lying(3, 96)],
    [HEART.rest, lying(0, 90)],
    [HEART.gone, lying(0, 90)],
    [HEART.gone + 0.05, 'transform:none'],
  ]
}

// Each time his wheel lands on it, the half gets flatter.
function flatStops(side: number): Stop[] {
  const stops: Stop[] = [[0, 'transform:none']]
  hits(side).forEach((t, k) => {
    if (k === 0) stops.push([t - 0.03, 'transform:none'])
    stops.push([t, `transform:scale(${r1(1.5 + 0.1 * k)},${Math.round((0.32 - 0.04 * k) * 100) / 100})`])
  })
  stops.push([HEART.gone + 0.05, 'transform:none'])
  return stops
}

const run = (name: string) => `${name} ${CYCLE}s linear 2s infinite`

const heartCss = () =>
  `.${K.heartBreak}{opacity:0;transform-box:fill-box;transform-origin:center;animation:${run('hbk')}}` +
  `.${K.halfLeft},.${K.halfRight}{transform-box:fill-box;transform-origin:center}` +
  `.${K.halfLeft}{animation:${run('hhl')}}.${K.halfRight}{animation:${run('hhr')}}` +
  `.${K.flatLeft},.${K.flatRight}{transform-box:fill-box;transform-origin:50% 100%}` +
  `.${K.flatLeft}{animation:${run('hfl')}}.${K.flatRight}{animation:${run('hfr')}}` +
  track('hbk', heartStops) +
  track('hhl', fallStops(-1)) +
  track('hhr', fallStops(1)) +
  track('hfl', flatStops(-1)) +
  track('hfr', flatStops(1))

const tantrumCss = () =>
  // A plain custom property: @property's "<number>" looks like a tag to the
  // app's sanitizer, which strips it. Unregistered, it animates as a flip.
  `.${K.body}{--rage:1;animation:rage ${PLAY_MS / 1000}s step-end forwards paused}` +
  `.${K.bot}:hover .${K.body},.${K.travel}:focus-within .${K.body}{animation-play-state:running}` +
  `@keyframes rage{to{--rage:0}}` +
  `.${K.steam}{display:none;opacity:${RAGE}}` +
  // No tantrum on a trip: the drawing after it brings him back to his spot,
  // and the next burst 2 s in.
  `.${K.visiting} .${K.steam},.${K.pileVisit} .${K.steam}{display:none}` +
  `.${moodClass('tantrum')}.${K.pileVisit} .${K.hop},.${moodClass('tantrum')}.${K.visiting} .${K.petTilt},.${moodClass('tantrum')}.${K.pileVisit} .${K.petTilt}{animation:none}` +
  `.${K.puff}{opacity:0;transform-box:fill-box;transform-origin:center;animation:puff ${CYCLE}s ease-out infinite}` +
  puffDelays() +
  `@keyframes puff{0%{opacity:0;transform:scale(.5)}0.25%{opacity:.9}1%{opacity:0;transform:translateY(-12px) scale(1.6)}100%{opacity:0}}` +
  heartCss() +
  stompKeyframes() +
  swing('shake', (side, fade) => `rotate(${byRage(r1(-side * 14 * fade), 'deg')})`) +
  // Your hand on him calms him while it's there. Every loop keeps running
  // underneath (an animation swapped out restarts when your hand leaves: the
  // stomp came back alone 2 s later and the calm drawing caught him mid-stomp,
  // Fabio 2026-11-23); the !important rules only hold him still and hide the
  // marks.
  `.${moodClass('tantrum')} .${K.bot}:hover .${K.hop}{animation:${run('stomp')};transform:none!important}` +
  `.${moodClass('tantrum')} .${K.bot}:hover .${K.petTilt}{transform:none!important}` +
  `.${K.bot}:hover .${K.steam}{visibility:hidden}` +
  // Less motion: no head shake (the stomp goes with the hop, parts/body-css.ts),
  // and the heart just beats and fades, whole.
  calm(
    `.${moodClass('tantrum')} .${K.petTilt}{animation:none!important}` +
      `.${K.halfLeft},.${K.halfRight},.${K.flatLeft},.${K.flatRight}{animation:none!important}`,
  )

export const tantrum: Feature = {
  name: 'tantrum',
  css: tantrumCss,
  slots: { overHead: marks },
}
