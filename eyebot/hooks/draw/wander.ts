// His wandering, simulated frame by frame: where he is, how his head leans on
// its spring, and where his eyes look. keyframes.ts turns it into CSS.

import { EDGE, FPS } from './constants.ts'
import { clamp, ease, mulberry32 } from './math.ts'

type Segment = { kind: 'idle'; dur: number } | { kind: 'move'; to: number; dur: number }
export type Tracks = { x: number[]; tilt: number[]; eyeX: number[]; eyeY: number[] }

// Rest at home, a short trip out, a look around, back home, and so on. The loop
// starts and ends resting at home, so every new drawing can start him there.
// Drawings can't share a clock (each starts its own when it loads, and the hook
// can only guess when that was), so home is the one place two drawings always
// agree on.
//
// A drawing is swapped out while the old one stays on top for a moment, and a
// swap while he is out on a trip shows two robots (a ghost). So: no trips at all
// in the moods Claude's work flips between (`roam` false), and every loop opens
// with a long rest, longer than the passing moods (alert, happy, sad) last, so
// a swap out of one of those always finds him at home.
const FIRST_REST = 8

export function simulate(width: number, home: number, seed: number, roam = true): Tracks {
  const rand = mulberry32(seed)
  const lo = EDGE
  const hi = Math.max(lo + 1, width - EDGE)

  const plan: Segment[] = []
  let planned = 0
  if (!roam) {
    plan.push({ kind: 'idle', dur: 40 })
    planned = Infinity
  }
  while (planned < 45) {
    const rest = plan.length ? 4 + rand() * 6 : FIRST_REST + rand() * 3
    let dir = rand() < 0.5 ? -1 : 1
    // Short trips: a swap while he's out can only jump him this far.
    const want = 20 + rand() * 60
    if ((dir < 0 ? home - lo : hi - home) < 40) dir = -dir
    const to = clamp(home + dir * want, lo, hi)
    const out = Math.max(1, Math.abs(to - home) / (55 + rand() * 60))
    const stay = 1 + rand() * 2.5
    const back = Math.max(1, Math.abs(to - home) / (55 + rand() * 60))
    plan.push({ kind: 'idle', dur: rest }, { kind: 'move', to, dur: out }, { kind: 'idle', dur: stay }, { kind: 'move', to: home, dur: back })
    planned += rest + out + stay + back
  }
  if (roam) plan.push({ kind: 'idle', dur: 2 })

  const { x, lookX, lookY } = play(plan, home, rand)
  const n = x.length
  const dt = 1 / FPS
  const at_ = (arr: number[], i: number) => arr[(i + n) % n]
  const vel = x.map((_, i) => (at_(x, i + 1) - at_(x, i - 1)) / (2 * dt))
  const acc = x.map((_, i) => (at_(x, i + 1) - 2 * x[i] + at_(x, i - 1)) / (dt * dt))
  return { x, tilt: headSpring(vel, acc), ...eyes(vel, lookX, lookY) }
}

// Position, frame by frame, and where idle eyes glance (NaN while moving: the
// eyes then follow his speed).
function play(plan: Segment[], home: number, rand: () => number) {
  const x: number[] = []
  const lookX: number[] = []
  const lookY: number[] = []
  let from = home
  let glanceX = 0
  let glanceY = 0
  let glanceLeft = 0
  for (const seg of plan) {
    const frames = Math.round(seg.dur * FPS)
    for (let f = 0; f < frames; f++) {
      if (seg.kind === 'move') {
        x.push(from + (seg.to - from) * ease(f / frames))
        lookX.push(NaN)
        lookY.push(0)
      } else {
        x.push(from)
        if (glanceLeft <= 0) {
          glanceLeft = Math.round((0.5 + rand() * 1.3) * FPS)
          const centred = rand() < 0.35
          glanceX = centred ? 0 : (rand() * 2 - 1) * 5
          glanceY = centred ? 0 : -3 + rand() * 4.5
        }
        glanceLeft--
        lookX.push(glanceX)
        lookY.push(glanceY)
      }
    }
    if (seg.kind === 'move') from = seg.to
  }
  return { x, lookX, lookY }
}

// Head on a damped spring, pushed back by speed and by acceleration. Rolling
// left (negative velocity) leans the head right (positive rotation). Two passes
// so the loop's end flows into its start.
function headSpring(vel: number[], acc: number[]): number[] {
  const n = vel.length
  const dt = 1 / FPS
  const omega = 2 * Math.PI * 1.5
  const zeta = 0.28
  const tilt: number[] = new Array(n)
  let th = 0
  let w = 0
  const sub = 8
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const target = clamp(-(0.07 * vel[i] + 0.022 * acc[i]), -16, 16)
      for (let s = 0; s < sub; s++) {
        const h = dt / sub
        w += (omega * omega * (target - th) - 2 * zeta * omega * w) * h
        th += w * h
      }
      tilt[i] = clamp(th, -20, 20)
    }
  }
  return tilt
}

// Eyes: look where he is going while moving, glance around while idle.
function eyes(vel: number[], lookX: number[], lookY: number[]) {
  const n = vel.length
  const eyeX: number[] = new Array(n)
  const eyeY: number[] = new Array(n)
  let ex = 0
  let ey = 0
  const k = 1 - Math.exp(-1 / FPS / 0.09)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const tx = Number.isNaN(lookX[i]) ? clamp(vel[i] / 50, -1, 1) * 5 : lookX[i]
      ex += (tx - ex) * k
      ey += (lookY[i] - ey) * k
      eyeX[i] = ex
      eyeY[i] = ey
    }
  }
  return { eyeX, eyeY }
}
