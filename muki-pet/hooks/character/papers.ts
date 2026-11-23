// The paper pile (MPI-14): one paper per background task Claude has running
// (shells, sub-agents, monitors, workflows), lying at the right end of his road.
// Now and then he rolls over, rolls his eyes at it ("ugh, work") and rolls off.
// Pure, and shared: the brain plans a visit with pilePlan, and the drawing
// (draw/features/papers.ts) rolls him along the same plan.

import { bandX, clamp, EDGE, jitter, toU } from './geometry.ts'
import { LEAD, MINUTE, SECOND } from './tuning.ts'

// At most this many papers are drawn; more tasks don't grow the pile.
export const MAX_PAPERS = 6
// His first look at a new pile, and then one look every few minutes while it
// stays (between PILE_EVERY_MIN and PILE_EVERY_MAX, varied per visit). A look
// that can't happen (Claude is working, your mouse is on him) tries again soon.
export const PILE_FIRST = 30 * SECOND
export const PILE_EVERY_MIN = 3 * MINUTE
export const PILE_EVERY_MAX = 6 * MINUTE
export const PILE_RETRY = 30 * SECOND

// The wait before visit n+1 (n >= 1).
export const pileGap = (n: number) => Math.round(PILE_EVERY_MIN + (PILE_EVERY_MAX - PILE_EVERY_MIN) * jitter(n))

// The pile's middle: near the right end of the band.
export const pileX = (W: number) => Math.round(W - 24)

export type PilePlan = {
  fromX: number
  // Where he stops to look at the pile, and where he rolls off to (his new home).
  atX: number
  toX: number
  toU: number
  // The roll there, its arrival, when he turns away, his arrival at the new
  // home, and the visit's end, in seconds from the start (lead-in included).
  go: number
  arrive: number
  leave: number
  back: number
  home: number
  end: number
}

// Only the width, the old home and the visit's number decide it, so the brain
// and every drawing during one visit agree.
export function pilePlan(width: number, fromU: number, n: number): PilePlan {
  const W = Math.round(width)
  const fromX = Math.round(bandX(W, fromU))
  const hi = Math.max(EDGE, W - EDGE)
  const atX = Math.round(clamp(pileX(W) - 40, EDGE, hi))
  const toX = Math.round(clamp(atX - (120 + 120 * jitter(n)), EDGE, hi))
  const go = Math.round(clamp(Math.abs(atX - fromX) / 110, 0.6, 2.5) * 100) / 100
  const back = Math.round(clamp(Math.abs(atX - toX) / 140, 0.6, 2) * 100) / 100
  const arrive = LEAD + 0.4 + go
  const leave = arrive + 3.1
  const home = leave + back
  return {
    fromX,
    atX,
    toX,
    toU: toU(W, toX),
    go,
    arrive,
    leave,
    back,
    home,
    end: Math.round((home + 0.5) * 100) / 100,
  }
}

// One sheet, lying on the floor: a flat slanted page with a few scribbled
// lines, `i` sheets up the pile. The jitter is fixed per sheet so the pile
// looks the same in every drawing.
const JITTER = [0, 3, -2, 4, -3, 1]
export function sheet(i: number, top: boolean): string {
  const dx = JITTER[i % JITTER.length]!
  const y = -2.6 * i
  const lines = top
    ? `<g stroke="#8a9aa5" stroke-width="1" stroke-linecap="round"><line x1="-6" y1="-3.2" x2="3" y2="-3.2"/><line x1="-4" y1="-1.6" x2="6" y2="-1.6"/></g>`
    : ''
  return (
    `<g transform="translate(${dx},${y})">` +
    `<path d="M-11,0L9,0L12,-4.5L-8,-4.5Z" fill="#e8eef2" stroke="#8a9aa5" stroke-width="1" stroke-linejoin="round"/>` +
    lines +
    `</g>`
  )
}
