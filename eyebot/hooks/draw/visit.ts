// A prop visit: where the prop lands, where he stops beside it (his new home),
// and the CSS that rolls him there, has him inspect it, and poofs it.

import { EDGE } from './constants.ts'
import { bandX, clamp, deg, r1 } from './math.ts'
import { partTransform, type Mood } from './moods.ts'

export type VisitPlan = {
  fromX: number
  toX: number
  // His new home, as a share of the band.
  toU: number
  // The prop's x from his new home.
  off: number
  // Which way he goes: 1 right, -1 left.
  s: number
  // The roll there, its arrival, when he leaves the prop, and the visit's end,
  // in seconds from the start.
  go: number
  arrive: number
  leave: number
  end: number
}

// A visit starts only after the swap that brings it in is over, so the old
// drawing on top never shows him doing something else beside it. The swap is
// 0.9 s by the hook's clock, and the redraw that ends it can reach the band late
// while the app is busy, so the lead-in keeps a margin over it.
const LEAD = 1.5

// Where the prop goes and how the visit runs. He rolls from his home to the
// prop, and the spot beside it becomes his new home (no trip back). Only the
// width, the old home and the visit's number decide it, so the hook and every
// drawing during one visit agree.
export function visitPlan(width: number, fromU: number, n: number): VisitPlan {
  const W = Math.round(width)
  const fromX = Math.round(bandX(W, fromU))
  const s = fromX < W / 2 ? 1 : -1
  const X = clamp(fromX + s * (110 + 120 * ((n * 0.618034) % 1)), 30, W - 30)
  const toX = Math.round(clamp(X - s * 32, EDGE, Math.max(EDGE, W - EDGE)))
  const go = Math.round(clamp(Math.abs(toX - fromX) / 110, 0.7, 2.5) * 100) / 100
  const arrive = 0.9 + go
  const leave = arrive + 2.4
  return {
    fromX,
    toX,
    toU: W > 2 * EDGE ? (toX - EDGE) / (W - 2 * EDGE) : 0.5,
    off: Math.round(X - toX),
    s,
    go,
    arrive,
    leave,
    end: Math.round((leave + 0.7 + LEAD) * 100) / 100,
  }
}

// The visit's CSS. Each part runs one keyframe track over the whole visit,
// eased per step; `elapsed` picks a later start when a new drawing (a mood
// change) comes in the middle of it. While he checks the prop out he wears the
// curious face, then goes back to the face of his mood.
export function visitCss(v: VisitPlan, elapsed: number, mood: Mood): string {
  // The visit's own time runs from the end of the lead-in.
  const T = Math.round((v.end - LEAD) * 100) / 100
  elapsed -= LEAD
  const at = (sec: number) => `${Math.round((clamp(sec, 0, T) / T) * 100000) / 1000}%`
  const track = (name: string, stops: Array<[number, string]>) =>
    `@keyframes ${name}{${stops.map(([sec, val]) => `${at(sec)}{${val}}`).join('')}}`
  const run = (name: string) => `animation:${name} ${T}s ease-in-out ${Math.round(-elapsed * 100) / 100}s both`
  const { s, arrive: A, leave: L } = v
  const E = T
  const from = v.fromX - v.toX
  const tx = (px: number) => `transform:translateX(${px}px)`
  const rot = (d: number) => `transform:rotate(${r1(d)}deg)`
  const rest = (sels: string[]) => `transform:${partTransform(mood, sels)}`
  // A face part: his mood's look before and after, the curious look in between.
  const face = (name: string, sels: string[], from: number, to: number, look = partTransform('curious', sels)) =>
    track(name, [[0, rest(sels)], [from, rest(sels)], [from + 0.3, `transform:${look}`], [to, `transform:${look}`], [to + 0.35, rest(sels)], [E, rest(sels)]])
  return (
    // His loop waits, held on his spot, until the visit is over.
    `.s{animation-delay:${Math.round((T - elapsed) * 100) / 100}s;animation-fill-mode:backwards}` +
    `.vp{display:inline}.vi .vq{display:inline}` +
    // The roll over: body and wheels.
    `.ix{${run('vx')}}` +
    track('vx', [[0, tx(from)], [0.9, tx(from)], [A, tx(0)], [E, tx(0)]]) +
    `.vw{${run('vw')}}` +
    track('vw', [[0, rot(deg(from))], [0.9, rot(deg(from))], [A, rot(0)], [E, rot(0)]]) +
    // His head leans into the roll, then toward the prop.
    `.vi .ln{${run('vl')}}` +
    track('vl', [
      [0, rot(0)], [0.9, rot(0)], [0.9 + v.go * 0.35, rot(-s * 9)], [A - 0.1, rot(-s * 5)], [A + 0.3, rot(s * 14)],
      [L, rot(s * 11)], [L + 0.5, rot(0)], [E, rot(0)],
    ]) +
    // His eyes: toward the prop, then down at it.
    `.vi .gz{${run('vg')}}` +
    track('vg', [
      [0, rest(['.gz'])], [0.35, `transform:translate(${s * 5}px,0)`], [A, `transform:translate(${s * 5}px,0)`],
      [A + 0.25, `transform:translate(${s * 4}px,3px)`], [L, `transform:translate(${s * 4}px,3px)`],
      [L + 0.5, rest(['.gz'])], [E, rest(['.gz'])],
    ]) +
    // The curious face.
    `.vi .eyeL{${run('vcl')}}.vi .eyeR{${run('vcr')}}.vi .topL{${run('vtl')}}.vi .topR{${run('vtr')}}` +
    face('vcl', ['.eye', '.eyeL'], 0.35, L) +
    face('vcr', ['.eye', '.eyeR'], 0.35, L) +
    face('vtl', ['.top', '.topL'], 0.35, A + 1.5) +
    face('vtr', ['.top', '.topR'], 0.35, A + 1.5) +
    `.vi .lid{${run('vd')}}` +
    // The "!": a happy squint before he leaves.
    face('vd', ['.lid'], A + 1.4, L, 'translateY(-9px)') +
    `.vi .hop{animation:hop .5s ease-out ${Math.round((0.3 - elapsed) * 100) / 100}s}` +
    // The "?" and the "!" over his head.
    `.vq1{${run('vq1')}}` +
    track('vq1', [[0, 'opacity:0'], [A + 0.2, 'opacity:0;transform:translateY(3px)'], [A + 0.45, 'opacity:1;transform:none'], [A + 1.3, 'opacity:1;transform:none'], [A + 1.45, 'opacity:0'], [E, 'opacity:0']]) +
    `.vq2{${run('vq2')}}` +
    track('vq2', [[0, 'opacity:0'], [A + 1.45, 'opacity:0;transform:scale(.4)'], [A + 1.65, 'opacity:1;transform:scale(1.2)'], [A + 1.8, 'opacity:1;transform:none'], [L, 'opacity:1;transform:none'], [L + 0.2, 'opacity:0'], [E, 'opacity:0']]) +
    // The prop: pops in, gets nudged, poofs.
    `.vpa{${run('vpa')}}` +
    track('vpa', [
      [0, 'transform:scale(0)'], [0.3, 'transform:scale(1.18)'], [0.45, 'transform:none'], [A + 0.6, 'transform:none'],
      [A + 0.75, 'transform:rotate(-14deg)'], [A + 0.9, 'transform:rotate(10deg)'], [A + 1.05, 'transform:none'],
      [L, 'transform:none;opacity:1'], [L + 0.15, 'transform:scale(1.25);opacity:1'], [L + 0.45, 'transform:scale(0);opacity:0'], [E, 'transform:scale(0);opacity:0'],
    ])
  )
}
