// Named cues instead of magic offsets. An animation is a list of cues (moments,
// each with a name and a time in seconds) and tracks (what a part does at
// which cue). Two flavours:
//
// - `timeline(total)` for a drawing that knows its own length (a prop visit):
//   a track's stops are written at cue times and become keyframe percentages.
// - `afterDash(s)` for the cookie game, whose length is only known to the CSS
//   (`--t` is how long the dash takes): a cue is a delay `s` seconds after the
//   dash, written as a `calc()`.

import { clamp } from './math.ts'

// Seconds as CSS writes them: `.15`, `1.1`, `3`.
export const sec = (n: number) => String(n).replace(/^(-?)0\./, (_m, minus: string) => `${minus}.`)

// Rounded to hundredths, for delays and lengths.
export const r2 = (n: number) => Math.round(n * 100) / 100

export type Stop = [cue: number, value: string]

export function timeline(total: number) {
  // A moment as a keyframe percentage of the whole length (clamped to it).
  const at = (cue: number) => `${Math.round((clamp(cue, 0, total) / total) * 100000) / 1000}%`
  // `@keyframes name` with one stop per [cue, declarations].
  const track = (name: string, stops: Stop[]) =>
    `@keyframes ${name}{${stops.map(([cue, val]) => `${at(cue)}{${val}}`).join('')}}`
  return { at, track }
}

// A delay of `s` seconds after the dash to a cookie ends.
export const afterDash = (s: number) => `calc(var(--t) + ${sec(s)}s)`
// A delay of `s` seconds after a cue that is itself a delay.
export const afterCue = (cue: string, s: number) => `calc(${cue} + ${sec(s)}s)`
