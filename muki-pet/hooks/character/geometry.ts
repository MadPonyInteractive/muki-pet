// Where things are in the band. Pure, and shared: the brain plans a prop visit
// with visitPlan, and the drawing rolls him along the same plan.

import { LEAD } from './tuning.ts'

export const BAND_HEIGHT = 76
// How close to either end of the band he may roll.
export const EDGE = 44

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// A share of the band (0 = left end, 1 = right end) as an x in pixels.
export const bandX = (W: number, u: number) => EDGE + clamp(u, 0, 1) * Math.max(0, W - 2 * EDGE)

// And back: an x in pixels as a share of the band (the middle when it's too narrow).
export const toU = (W: number, x: number) => (W > 2 * EDGE ? (x - EDGE) / (W - 2 * EDGE) : 0.5)

// A number in [0, 1) that changes a lot from one n to the next (golden ratio),
// so visit n+1 doesn't look like visit n.
export const jitter = (n: number) => (n * 0.618034) % 1

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

// Where the prop goes and how the visit runs. He rolls from his home to the
// prop, and the spot beside it becomes his new home (no trip back). Only the
// width, the old home and the visit's number decide it, so the hook and every
// drawing during one visit agree. The visit's CSS is in draw/features/visit.ts.
export function visitPlan(width: number, fromU: number, n: number): VisitPlan {
  const W = Math.round(width)
  const fromX = Math.round(bandX(W, fromU))
  const s = fromX < W / 2 ? 1 : -1
  const X = clamp(fromX + s * (110 + 120 * jitter(n)), 30, W - 30)
  const toX = Math.round(clamp(X - s * 32, EDGE, Math.max(EDGE, W - EDGE)))
  const go = Math.round(clamp(Math.abs(toX - fromX) / 110, 0.7, 2.5) * 100) / 100
  const arrive = 0.9 + go
  const leave = arrive + 2.4
  return {
    fromX,
    toX,
    toU: toU(W, toX),
    off: Math.round(X - toX),
    s,
    go,
    arrive,
    leave,
    end: Math.round((leave + 0.7 + LEAD) * 100) / 100,
  }
}
