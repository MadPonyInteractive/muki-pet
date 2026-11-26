// Right-click play (MPI-22, Fabio 2026-11-26): a right-click on the band gives
// him a toy, picked at random; the next right-click swaps it for another one,
// and a toy goes by itself after its play (or on a left click). Asleep, a
// right-click tucks him into a heap of cotton instead: only his eyes and the
// top of his head show, happy eyes, and he sleeps on.
//
// CSS can't tell a right-click from a left one (both press and focus), so the
// switch is SMIL: a `<set>` on the svg root that starts on `mouseup` (any
// button) and ends 1 ms after a `click` (a left click only), so only a middle
// or a right release leaves it on. Desktop pops its own Copy / Select All menu
// on a right one and nothing in the frame can stop it, so the middle button is
// the clean way (Fabio saw the menu live, 2026-11-26). Not `auxclick`: when
// the chat around the band can scroll, a middle press starts Chromium's
// autoscroll and no `auxclick` comes at all (MPI-23). The 1 ms matters: an end
// at the same instant as the begin is ignored. The `<set>` adds a class to the
// root for as long as it runs (research/mods-api.md, CSS tricks). All the play
// is CSS under that class. It needs no focus, so the host's blur on a band
// update can't end it.
//
// Turns with no script: the switches are turns 1 to N (N = how many toys).
// While turn k is on, a see-through sheet `o<k>` covers the band. A middle
// click on it ends turn k and starts turn k + 1 (the last one starts the first
// again), and a left click on it puts the toy away (the release starts the
// next turn, its click ends that one too). With no toy out, the release lands
// on his strips, inside the travelling group `tv`, which starts turn 1. The
// press also focuses the strip under it (a cookie or a boop would start), so
// while a toy or the bed is out every strip hides, which drops that focus at
// once.
//
// Random with no script (tools/frame-lab-pick-test.svg): an animation on the
// svg root flips a custom property through 0 to N - 1 for ever, a few times a
// second. A toy coming out pauses it, which holds the number it had at that
// instant: nobody can time a click that finely, so it is a fair pick. The toy
// shown is (pick + turn) mod N, read by container style queries, so the next
// turn is always a different toy.
//
// No toys in a tantrum or a party (they move the same parts) or on a trip.

import type { Mood } from '../../character/moods.ts'
import { K, PLAYING, BED_ON, overNo, toyNo } from '../classes.ts'
import type { DrawCtx, Feature } from '../feature.ts'
import { partTransform } from '../moods.ts'
import { TRAVEL_ID } from '../parts/body.ts'
import { type Stop, sec, timeline } from '../timeline.ts'

// How long each toy's play lasts, in seconds, and how long a turn lasts (the
// longest play).
const BAG = 13
const BALL = 11.5
const TOYS = [BAG, BALL]
const TURN = Math.max(...TOYS)
// How long the pick stays on one number.
const PICK_S = 0.19

const NO_TOYS: Mood[] = ['asleep', 'tantrum', 'celebrate']
const toysOn = (d: DrawCtx) => !NO_TOYS.includes(d.mood) && !d.visit && !d.options.pile?.visit
const bedOn = (d: DrawCtx) => d.mood === 'asleep'

const overId = (k: number) => `o${k}`
const BED_ID = 'ob'

// The switches and the sheets, on the svg root.
function switches(d: DrawCtx): string {
  const sheet = (id: string, cls: string) => `<rect id="${id}" class="${K.over} ${cls}" width="${d.W}" height="${d.H}"/>`
  if (bedOn(d)) {
    return (
      `<set attributeName="class" to="${d.roots} ${PLAYING} ${BED_ON}" begin="${TRAVEL_ID}.mouseup" end="${BED_ID}.click;${TRAVEL_ID}.click+.001s"/>` +
      sheet(BED_ID, K.bedOver)
    )
  }
  if (!toysOn(d)) return ''
  const n = TOYS.length
  return TOYS.map((_, i) => {
    const k = i + 1
    const before = i === 0 ? n : i
    // Any release starts the turn; a left click's own `click`, at the same
    // instant, ends it again before it is ever drawn.
    const begin = (i === 0 ? `${TRAVEL_ID}.mouseup;` : '') + `${overId(before)}.mouseup`
    const end = `${overId(k)}.mouseup;${overId(k)}.click;` + (i === 0 ? `${TRAVEL_ID}.click+.001s;` : '') + `${overId(before)}.click+.001s`
    return (
      `<set attributeName="class" to="${d.roots} ${PLAYING} ${toyNo(k)}" begin="${begin}" end="${end}" dur="${TURN}s"/>` +
      sheet(overId(k), overNo(k))
    )
  }).join('')
}

// --- The drawings -----------------------------------------------------------

// The punching bag: hung from the top of the band on a rope, beside his head.
// `.tbs` swings about the rope's top; `.tbd` drops it in and throws it off.
const BAG_X = 38
const bag = (top: number) =>
  `<g class="${K.toy} ${K.toyBag}" transform="translate(${BAG_X},${-top})"><g class="${K.bagDrop}"><g class="${K.bagSwing}">` +
  `<line x1="0" y1="-4" x2="0" y2="15" stroke="#8a9aa5" stroke-width="1.4"/>` +
  `<path d="M0,13C3.5,13 4.5,17 5.5,22C7,28 7.5,36 0,36C-7.5,36 -7,28 -5.5,22C-4.5,17 -3.5,13 0,13Z" fill="#e5484d"/>` +
  `<path d="M-5.9,23.5C-2,25 2,25 5.9,23.5L6.5,26.5C2,28 -2,28 -6.5,26.5Z" fill="#b3363b"/>` +
  `<rect x="-2.6" y="12" width="5.2" height="3" rx="1.2" fill="#3a444b"/>` +
  `<path d="M-3.2,29C-3.6,31.5 -2.6,33.3 -1,33.8" fill="none" stroke="#ff9a9d" stroke-width="1.2" stroke-linecap="round"/>` +
  `</g></g></g>`

// The ball: `.tbx` moves it sideways, `.tby` up and down, `.tbr` spins it.
const BALL_X = 34
const BALL_R = 5
const ball = () =>
  `<g class="${K.toy} ${K.toyBall}" transform="translate(${BALL_X},${-BALL_R})"><g class="${K.ballX}"><g class="${K.ballY}"><g class="${K.ballSpin}">` +
  `<circle r="${BALL_R}" fill="#4da3ff"/>` +
  `<path d="M-5,0A5,5 0 0 1 5,0A8,3.2 0 0 0 -5,0Z" fill="#fff"/>` +
  `<circle r="${BALL_R}" fill="none" stroke="#2b6fbd" stroke-width=".8"/>` +
  `<circle cx="0" cy="-2.9" r="1" fill="#ffcf4d"/>` +
  `</g></g></g></g>`

// The bed (Fabio, 2026-11-26: "covers his whole body ... like a baby"): a heap
// of cotton in front of him, from the ground up to just under his eyes, so
// only his eyes and the top of his head show. Rows of puffs, bottom to top;
// every other puff is a shade darker, so it reads as fluff and not as a blob.
const ROWS: Array<[y: number, r: number, half: number, n: number]> = [
  [-6, 9.5, 37, 7],
  [-17, 9.5, 33, 6],
  [-27, 9, 30, 6],
  [-35, 7, 27, 6],
]
const bed = () =>
  `<g class="${K.bed}"><rect x="-30" y="-34" width="60" height="34" rx="8" fill="#fff"/>` +
  ROWS.map(([y, r, half, n], row) =>
    Array.from({ length: n }, (_, i) => `<circle cx="${Math.round((-half + (2 * half * i) / (n - 1)) * 10) / 10}" cy="${y}" r="${r}" fill="${(i + row) % 2 ? '#fff' : '#e3eaf0'}"/>`).join(''),
  ).join('') +
  `</g>`

// --- The play, as CSS -------------------------------------------------------

type Span = [from: number, to: number, look: string, ramp?: number]

// One toy's rules: every part runs one track over the toy's whole time, and
// loops (the fast hits, the bounces) play on top of it for a while.
function play(k: number, T: number, mood: Mood) {
  const { track } = timeline(T)
  const root = `.${PLAYING} .${K.travel}`
  const name = (part: string) => `y${k}${part}`
  let css = ''
  // A part's base track, plus loops listed after it (they win while they run).
  const part = (cls: string, id: string, stops: Stop[], ...loops: string[]) => {
    css += `${root} .${cls}{animation:${[`${name(id)} ${T}s ease-in-out both`, ...loops].join(',')}}` + track(name(id), stops)
  }
  // A face part: his mood's look outside the spans, each span's look inside.
  const face = (cls: string, id: string, sels: string[], spans: Span[], ...loops: string[]) => {
    const rest = partTransform(mood, sels)
    const tf = (v: string) => `transform:${v === 'rest' ? rest : v}`
    const stops: Stop[] = [[0, tf('rest')]]
    let was = 'rest'
    let last = 0
    for (const [from, to, look, ramp = 0.2] of spans) {
      stops.push([from, tf(was)], [from + ramp, tf(look)], [to, tf(look)])
      was = look
      last = to
    }
    stops.push([last + 0.3, tf('rest')], [T, tf('rest')])
    part(cls, id, stops, ...loops)
  }
  const eyes = (spans: Span[]) => {
    face(K.eyeL, 'el', [`.${K.eye}`, `.${K.eyeL}`], spans)
    face(K.eyeR, 'er', [`.${K.eye}`, `.${K.eyeR}`], spans)
  }
  // Top lids: `left` is the left lid's look; the right one mirrors any slant.
  const tops = (spans: Span[]) => {
    face(K.topL, 'tl', [`.${K.top}`, `.${K.topL}`], spans)
    face(K.topR, 'tr', [`.${K.top}`, `.${K.topR}`], spans.map(([a, b, look, r]) => [a, b, look.replace(/rotate\((-?)/, (_m, minus: string) => `rotate(${minus ? '' : '-'}`), r]))
  }
  const lids = (spans: Span[]) => face(K.lid, 'ld', [`.${K.lid}`], spans)
  const gaze = (spans: Span[], ...loops: string[]) => face(K.gaze, 'gz', [`.${K.gaze}`], spans, ...loops)
  const add = (rules: string) => {
    css += rules
  }
  return { part, eyes, tops, lids, gaze, add, root, name, css: () => css }
}

const rot = (d: number) => `transform:rotate(${d}deg)`
const tx = (px: number) => `transform:translateX(${px}px)`
const ty = (px: number) => `transform:translateY(${px}px)`
const OPEN = 'translateY(-3px)'
const SHUT = 'scaleY(.12)'

// A head-butt at `t`: he leans back, snaps his head at the bag, and it settles.
const butt = (t: number, back = -9, hit = 14): Stop[] => [[t - 0.4, rot(0)], [t - 0.2, rot(back)], [t, rot(hit)], [t + 0.18, rot(3)], [t + 0.35, rot(0)]]
const jerk = (t: number, px = 4): Stop[] => [[t - 0.4, tx(0)], [t - 0.2, tx(-2)], [t, tx(px)], [t + 0.2, tx(0)]]

// The punching bag (Fabio's script): it drops in, he butts it and likes it;
// the second time it swings back and bonks him; he is upset, then hits it
// again and again with focused eyes; a last big hit sends it flying.
function bagCss(mood: Mood): string {
  const p = play(1, BAG, mood)
  const H1 = 1.1
  const H2 = 2.3
  const BONK = 2.82
  const FAST = 4.45 // the fast hits: FAST_N of them, one every FAST_S
  const FAST_S = 0.65
  const FAST_N = 7
  const fastEnd = FAST + FAST_S * FAST_N
  const LAST = 10
  const loop = (id: string, delay: number) => `${p.name(id)} ${sec(FAST_S)}s ease-in-out ${sec(delay)}s ${FAST_N}`
  // In the fast loop the hit comes 52% in; the bag's loop starts on the hit.
  const hitAt = FAST + FAST_S * 0.52
  p.part(
    K.lean, 'ln',
    [[0, rot(0)], ...butt(H1), ...butt(H2), [BONK - 0.06, rot(0)], [BONK + 0.05, rot(-17)], [BONK + 0.3, rot(-8)], [BONK + 0.5, rot(-11)], [BONK + 0.8, rot(0)], ...butt(LAST, -15, 18), [BAG, rot(0)]],
    loop('lf', FAST),
  )
  p.add(`@keyframes ${p.name('lf')}{0%,100%{${rot(0)}}30%{${rot(-8)}}52%{${rot(14)}}75%{${rot(3)}}}`)
  p.part(
    K.body, 'bd',
    [[0, tx(0)], ...jerk(H1), ...jerk(H2), [BONK - 0.06, tx(0)], [BONK + 0.05, tx(-5)], [BONK + 0.5, tx(0)], ...jerk(LAST, 6), [BAG, tx(0)]],
    loop('bf', FAST),
  )
  p.add(`@keyframes ${p.name('bf')}{0%,80%,100%{${tx(0)}}30%{${tx(-2)}}52%{${tx(4)}}}`)
  p.part(
    K.bagSwing, 'sw',
    [
      [0, rot(0)], [H1, rot(0)], [H1 + 0.22, rot(-30)], [H1 + 0.5, rot(6)], [H1 + 0.75, rot(-3)], [H1 + 0.95, rot(0)],
      [H2, rot(0)], [H2 + 0.22, rot(-44)], [BONK, rot(21)], [BONK + 0.2, rot(-12)], [BONK + 0.45, rot(5)], [BONK + 0.7, rot(0)],
      [LAST, rot(0)], [LAST + 0.15, rot(-50)], [LAST + 0.7, rot(-200)], [BAG, rot(-200)],
    ],
    loop('sf', hitAt),
  )
  p.add(`@keyframes ${p.name('sf')}{0%,100%{${rot(0)}}33%{${rot(-32)}}75%{${rot(3)}}}`)
  p.part(K.bagDrop, 'dr', [
    [0, ty(-52)], [0.3, ty(2)], [0.42, ty(0)], [LAST + 0.1, 'transform:none;opacity:1'], [LAST + 0.7, 'transform:translate(90px,-30px);opacity:1'],
    [LAST + 0.9, 'transform:translate(120px,-14px);opacity:0'], [BAG, 'transform:translate(120px,-14px);opacity:0'],
  ])
  p.gaze([[0.25, LAST + 0.6, 'translate(5px,-1px)']])
  p.eyes([[0.3, 1, 'scale(1.12)'], [1, BONK, 'none'], [BONK, 3.3, SHUT, 0.06], [3.5, FAST, 'scaleY(.92)'], [FAST, fastEnd, 'scaleX(.9)'], [fastEnd, 12.2, 'none']])
  p.tops([[0.3, 3.5, OPEN], [3.5, FAST, 'translateY(4px) rotate(20deg)'], [FAST, fastEnd, 'translateY(3px)'], [fastEnd, 12.2, OPEN]])
  p.lids([[0.3, H1 + 0.25, 'none'], [H1 + 0.25, 2.1, 'translateY(-7px)'], [2.1, LAST + 0.3, 'none'], [LAST + 0.3, 12.2, 'translateY(-8px)']])
  // An angry little hop when it hits him, a happy one when it flies off.
  p.add(`${p.root} .${K.hop}{animation:hop .4s ease-out 3.7s,hop .5s ease-out ${sec(LAST + 0.5)}s}`)
  return p.css()
}

// The ball: it drops in beside him and he bounces it off the ground with his
// head, watching it go up and down; a last big one sends it out of the top of
// the band, it comes down on his head, and rolls off.
function ballCss(mood: Mood): string {
  const p = play(2, BALL, mood)
  const START = 1.6 // the bounces: N of them, one every S
  const S = 0.7
  const N = 9
  const end = START + S * N
  const UP = -36 // the top of a bounce, at his head's height
  const BIG = end + 0.35 // the big hit, at the top of one more bounce
  const LAND = 9.6 // it lands on his head
  const loop = (id: string) => `${p.name(id)} ${sec(S)}s linear ${sec(START)}s ${N}`
  const down = 'animation-timing-function:ease-in'
  const up = 'animation-timing-function:ease-out'
  p.part(
    K.ballY, 'by',
    [
      [0, `${ty(-85)};${down}`], [0.35, `${ty(0)};${up}`], [0.55, `${ty(-16)};${down}`], [0.75, `${ty(0)};${up}`], [0.88, `${ty(-5)};${down}`], [1, ty(0)],
      [end, `${ty(0)};${up}`], [BIG, `${ty(UP)};${up}`], [BIG + 0.4, ty(-110)], [LAND - 0.3, `${ty(-110)};${down}`], [LAND, `${ty(-63)};${up}`],
      [LAND + 0.25, `${ty(-73)};${down}`], [LAND + 0.7, `${ty(0)};${up}`], [LAND + 0.85, `${ty(-8)};${down}`], [LAND + 1, ty(0)], [BALL, ty(0)],
    ],
    loop('yb'),
  )
  p.add(`@keyframes ${p.name('yb')}{0%,100%{${ty(0)};${up}}50%{${ty(UP)};${down}}}`)
  p.part(K.ballX, 'bx', [
    [0, 'transform:none;opacity:1'], [BIG + 0.4, 'transform:none;opacity:1'], [LAND - 0.3, tx(-28)], [LAND, `${tx(-28)};animation-timing-function:linear`],
    [LAND + 0.7, tx(2)], [LAND + 1, 'transform:translateX(14px);opacity:1'], [LAND + 1.4, 'transform:translateX(30px);opacity:0'], [BALL, 'transform:translateX(30px);opacity:0'],
  ])
  p.add(`${p.root} .${K.ballSpin}{animation:${p.name('sp')} 1.4s linear infinite}@keyframes ${p.name('sp')}{to{${rot(360)}}}`)
  // His head nods at the ball at the top of each bounce, then the big one.
  p.part(
    K.lean, 'ln',
    [[0, rot(0)], [end + 0.05, rot(0)], [BIG - 0.13, rot(-10)], [BIG, rot(16)], [BIG + 0.25, rot(0)], [BALL, rot(0)]],
    loop('nd'),
  )
  p.add(`@keyframes ${p.name('nd')}{0%,100%{${rot(0)}}35%{${rot(-5)}}50%{${rot(11)}}70%{${rot(2)}}}`)
  // It lands on his head: he squashes under it.
  p.part(K.squash, 'sq', [[0, 'transform:none'], [LAND, 'transform:none'], [LAND + 0.08, 'transform:scale(1.1,.86)'], [LAND + 0.3, 'transform:scale(.96,1.05)'], [LAND + 0.5, 'transform:none'], [BALL, 'transform:none']])
  p.gaze(
    [[0.2, BIG + 0.1, 'translate(5px,3px)'], [BIG + 0.1, LAND - 0.05, 'translate(2px,-5px)'], [LAND + 0.4, LAND + 1.2, 'translate(5px,2px)']],
    `${p.name('gf')} ${sec(S)}s ease-in-out ${sec(START)}s ${N}`,
  )
  p.add(`@keyframes ${p.name('gf')}{0%,100%{transform:translate(5px,3px)}50%{transform:translate(5px,-2px)}}`)
  p.eyes([[0.3, BIG + 0.1, 'none'], [BIG + 0.1, LAND - 0.05, 'scale(1.12)'], [LAND, LAND + 0.45, SHUT, 0.06], [LAND + 0.45, 11, 'none']])
  p.tops([[0.3, 11, OPEN]])
  p.lids([[0.3, 0.9, 'none'], [0.9, BIG, 'translateY(-5px)'], [BIG, LAND + 0.6, 'none'], [LAND + 0.6, 11, 'translateY(-8px)']])
  p.add(`${p.root} .${K.hop}{animation:hop .5s ease-out ${sec(LAND + 0.8)}s}`)
  return p.css()
}

// Always-on rules: the sheets, what hides while he plays, the toys and the bed
// hidden until their turn.
const baseCss = () =>
  `.${K.over}{fill:#000;fill-opacity:0;pointer-events:none}` +
  `.${K.toy},.${K.bed}{display:none;pointer-events:none}` +
  // Hands off while a toy or the bed is out: the strips hide (which drops the
  // focus the right-click's press gave one), and he stays where he is.
  `.${PLAYING} :is(.${K.strip},.${K.pet}){visibility:hidden}` +
  `.${PLAYING} .${K.loop}{animation-play-state:paused}`

function toysCss(d: DrawCtx): string {
  const n = TOYS.length
  const turns = TOYS.map((_, i) => i + 1)
  // Toy j's rules apply while (pick + turn) mod n is j.
  const when = (j: number, rules: string) =>
    `@container ${turns.map((k) => `style(--tk:${(((j - k) % n) + n) % n} ${k})`).join(' or ')}{${rules}}`
  const shown = (cls: string) => `.${PLAYING} .${cls}{display:inline}`
  return (
    // The pick, its hold, and the turn.
    `svg{animation:ypk ${sec(Math.round(PICK_S * n * 100) / 100)}s step-end infinite;--th:0;--tk:var(--tp) var(--th)}` +
    `@keyframes ypk{${turns.map((_, i) => `${(i * 100) / n}%{--tp:${i}}`).join('')}}` +
    `.${PLAYING}{animation-play-state:paused}` +
    turns.map((k) => `.${toyNo(k)}{--th:${k}}.${toyNo(k)} .${overNo(k)}{pointer-events:all}`).join('') +
    when(0, shown(K.toyBag) + bagCss(d.mood)) +
    when(1, shown(K.toyBall) + ballCss(d.mood))
  )
}

// The bed: it puffs up over him, he sinks into it and snuggles, then sleeps on
// with happy eyes. A left click takes it away.
const bedCss = () => {
  const on = `.${BED_ON} .${K.travel}`
  return (
    `.${BED_ON} .${K.bedOver}{pointer-events:all}` +
    `${on} .${K.bed}{display:inline;transform-box:fill-box;transform-origin:50% 100%;animation:ybed .45s cubic-bezier(.3,1.7,.5,1) backwards}` +
    `@keyframes ybed{from{transform:scale(.2,0)}}` +
    `${on} .${K.squash}{animation:yplop 1.9s ease-in-out forwards}` +
    `@keyframes yplop{0%{transform:none}14%{transform:translateY(-3px)}26%{transform:translateY(3px) scale(1.07,.9)}40%{transform:translateY(1px) scale(.98,1.03)}55%,100%{transform:translateY(2px)}}` +
    `${on} .${K.wobble}{animation:ysnug 1.3s ease-in-out .6s}` +
    `@keyframes ysnug{0%,100%{transform:none}20%{transform:rotate(-5deg)}45%{transform:rotate(4deg)}70%{transform:rotate(-2.5deg)}}` +
    // Happy sleeping eyes (the mouse on the band opens them halfway otherwise).
    // (The top lids move at once: their usual way back waits GLOW, parts/face.ts.)
    `${on} .${K.top}{transform:translateY(-1px);transition:transform .45s ease-out}${on} .${K.lid}{transform:translateY(-9px)}` +
    `${on} .${K.blush}{opacity:.8;transition:opacity .6s ease-out .5s}`
  )
}

export const toys: Feature = {
  name: 'toys',
  css: baseCss,
  drawingCss: (d) => (bedOn(d) ? bedCss() : toysOn(d) ? toysCss(d) : ''),
  slots: {
    front: (d) => (toysOn(d) ? bag(d.ground) + ball() : ''),
    ground: (d) => (bedOn(d) ? bed() : ''),
    over: switches,
  },
}
