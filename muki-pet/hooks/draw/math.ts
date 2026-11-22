// Small number helpers shared by the drawing code.

import { WHEEL_R } from '../character/palette.ts'

export { bandX, clamp } from '../character/geometry.ts'

// Minimum-jerk easing: starts and stops with zero speed and zero acceleration.
export const ease = (u: number) => u * u * u * (10 + u * (-15 + 6 * u))

// One decimal place.
export const r1 = (v: number) => Math.round(v * 10) / 10

// Frame i of n as a keyframe percentage.
export const pct = (i: number, n: number) => `${Math.round((i / n) * 100000) / 1000}%`

// How far a wheel turns, in degrees, to roll `px` pixels.
export const deg = (px: number) => (px / WHEEL_R) * (180 / Math.PI)

// A list of [selector, declarations] as CSS.
export const rules = (list: Array<[string, string]>) => list.map(([sel, decl]) => `${sel}{${decl}}`).join('')

// A seeded random generator, so the same seed always gives the same wandering.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
