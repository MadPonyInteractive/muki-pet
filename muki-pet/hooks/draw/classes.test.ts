// The class registry: every name differs, every class in a drawing is in it,
// and every class the mood faces name exists.

import { expect, test } from 'claude-code/testing'

import { MOOD_TABLE } from '../character/moods.ts'
import {
  K, KNOWN_SHARED, biteNo, boopLayer, cookieNo, crumbNo, gazeLevel, heartNo, heatLevel, layerNo, moodClass, petZone, propClass, stripNo,
} from './classes.ts'
import { MOODS, PROPS, robotSvg } from './index.ts'

const values: string[] = Object.values(K)

// The numbered families, with how many of each a drawing can hold.
const families = () => [
  ...[0, 1, 2, 3].map(petZone),
  ...[1, 2, 3, 4, 5].map(boopLayer),
  ...Array.from({ length: 60 }, (_, i) => stripNo(i)),
  ...[0, 1, 2, 3, 4, 5].map(gazeLevel),
  ...[1, 2, 3, 4, 5, 6].map(layerNo),
  ...[1, 2, 3, 4, 5, 6].map(cookieNo),
  ...[0, 1, 2].map(biteNo),
  ...[0, 1, 2].map(crumbNo),
  ...[0, 1, 2].map(heartNo),
  ...[0, 1, 2, 3].map(heatLevel),
]

test('every class in the registry is a different name', () => {
  const dupes = values.filter((v, i) => values.indexOf(v) !== i)
  expect(dupes).toEqual([])
  // A family member must not be the same text as a table name or another family's.
  const all = [...values, ...families()].filter((v) => !(KNOWN_SHARED as readonly string[]).includes(v))
  expect(all.filter((v, i) => all.indexOf(v) !== i)).toEqual([])
  // The one allowed overlap is the hearts and the root's heat classes, nothing else.
  const shared = families().filter((v, i, a) => a.indexOf(v) !== i)
  expect([...new Set(shared)].sort()).toEqual([...KNOWN_SHARED].sort())
  expect(values.some((v) => (KNOWN_SHARED as readonly string[]).includes(v))).toBe(false)
})

test('every class a drawing uses is in the registry, and every registered name is used', () => {
  const known = new Set<string>([...values, ...families(), ...MOODS.map(moodClass), ...PROPS.map(propClass)])
  const used = new Set<string>()
  for (const prop of PROPS) {
    const svg = robotSvg(784, { mood: 'happy', heat: 3, visit: { prop, from: 0.1, n: 1, elapsed: 0 } })
    for (const m of svg.matchAll(/class="([^"]+)"/g)) for (const c of m[1]!.split(' ')) used.add(c)
  }
  // The Remote Control headset going on and coming off (MPI-15).
  for (const headset of ['drop', 'lift'] as const) {
    const svg = robotSvg(784, { mood: 'happy', headset })
    for (const m of svg.matchAll(/class="([^"]+)"/g)) for (const c of m[1]!.split(' ')) used.add(c)
  }
  // A visit to the paper pile (MPI-14).
  const pile = robotSvg(784, { mood: 'happy', pile: { count: 3, visit: { from: 0.1, n: 1, elapsed: 0 } } })
  for (const m of pile.matchAll(/class="([^"]+)"/g)) for (const c of m[1]!.split(' ')) used.add(c)
  expect([...used].filter((c) => !known.has(c))).toEqual([])
  expect(values.filter((v) => !used.has(v))).toEqual([])
})

test('the classes the mood faces name exist in the registry', () => {
  const names = new Set<string>(values)
  const selectors = Object.values(MOOD_TABLE).flatMap((m) => m.face.map(([sel]) => sel))
  const missing = selectors.flatMap((s) => [...s.matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1]!)).filter((c) => !names.has(c))
  expect(missing).toEqual([])
})

test('the headset shows only while Remote Control is on, and plays only when it changes', () => {
  expect(robotSvg(784, { mood: 'happy' })).not.toContain('class="hs"')
  for (const headset of ['on', 'drop', 'lift'] as const) expect(robotSvg(784, { mood: 'happy', headset })).toContain('class="hs"')
  expect(robotSvg(784, { mood: 'happy', headset: 'on' })).not.toMatch(/class="[^"]*\b(hsd|hsl)\b/)
  expect(robotSvg(784, { mood: 'happy', headset: 'drop' })).toMatch(/<svg[^>]*class="[^"]*\bhsd\b/)
})
