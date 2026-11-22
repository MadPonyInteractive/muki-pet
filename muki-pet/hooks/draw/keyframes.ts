// Turns the simulated wandering (wander.ts) into CSS keyframes, cached per band
// width, home spot and whether he roams.

import { FPS } from '../character/tuning.ts'
import { deg, pct, r1 } from './math.ts'
import { simulate } from './wander.ts'

// Keeps only the samples linear interpolation cannot stand in for.
function simplify(values: number[], tol: number): number[] {
  const n = values.length
  const keep = [0]
  let start = 0
  for (let j = 2; j <= n; j++) {
    const end = j === n ? values[0]! : values[j]!
    let ok = true
    for (let m = start + 1; m < j; m++) {
      const u = (m - start) / (j - start)
      const v = values[start]! + (end - values[start]!) * u
      if (Math.abs(v - values[m]!) > tol) {
        ok = false
        break
      }
    }
    if (!ok) {
      keep.push(j - 1)
      start = j - 1
    }
  }
  return keep
}

function keyframes(name: string, values: number[], tol: number, css: (v: number) => string): string {
  const n = values.length
  const idx = simplify(values, tol)
  const stops = idx.map(i => `${pct(i, n)}{transform:${css(values[i]!)}}`)
  stops.push(`100%{transform:${css(values[0]!)}}`)
  return `@keyframes ${name}{${stops.join('')}}`
}

// Eye glances move in x and y together, so they share one keyframe set: a
// sample is kept when either axis needs it.
function eyeKeyframes(xs: number[], ys: number[]): string {
  const n = xs.length
  const keep = new Set([...simplify(xs, 0.25), ...simplify(ys, 0.25)])
  const stops = [...keep]
    .sort((a, b) => a - b)
    .map(i => `${pct(i, n)}{transform:translate(${r1(xs[i]!)}px,${r1(ys[i]!)}px)}`)
  stops.push(`100%{transform:translate(${r1(xs[0]!)}px,${r1(ys[0]!)}px)}`)
  return `@keyframes ey{${stops.join('')}}`
}

const routes = new Map<string, { kf: string; loop: string }>()

// His wandering around one home spot on one band width (`slow` > 1 when tired): the keyframes (`mv`
// position, `tl` head tilt, `wh` wheels, `ey` eyes) and the loop length in s.
export function routeAround(W: number, homeX: number, roam: boolean, slow = 1) {
  const key = `${W}|${homeX}|${roam}|${slow}`
  let r = routes.get(key)
  if (!r) {
    const t = simulate(W, homeX, 7, roam, slow)
    r = {
      kf:
        keyframes('mv', t.x, 0.4, v => `translateX(${r1(v)}px)`) +
        keyframes('tl', t.tilt, 0.35, v => `rotate(${r1(v)}deg)`) +
        keyframes('wh', t.x.map(deg), 2, v => `rotate(${r1(v)}deg)`) +
        eyeKeyframes(t.eyeX, t.eyeY),
      loop: (t.x.length / FPS).toFixed(2),
    }
    if (routes.size > 40) routes.clear()
    routes.set(key, r)
  }
  return r
}
