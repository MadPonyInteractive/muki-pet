// The state machine on its own: events in, state and effects out. No host.

import { expect, test } from 'claude-code/testing'

import { visitPlan } from '../character/geometry.ts'
import { passingMs } from '../character/moods.ts'
import { NEAR_GRACE_MS, PROP_GAP, SECOND } from '../character/tuning.ts'
import { feeling, initialState, nearHold, step, type Effect, type Event, type State } from './machine.ts'

const go = (s: State, event: Event, now = 0) => step(s, event, now)
const has = (fx: Effect[], type: Effect['type'], name?: string) =>
  fx.some(f => f.type === type && (name === undefined || ('name' in f && f.name === name)))
// A band 720 px wide, as the render tells it.
const drawn = () => go(initialState(), { type: 'band', width: 720 }).state

test('a turn: alert, focused once the flash ends, happy for the answer, then calm', () => {
  let r = go(drawn(), { type: 'turnStart' })
  expect(r.state.mood).toBe('alert')
  expect(has(r.effects, 'redraw')).toBe(true)
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'flash', ms: passingMs('alert') })
  expect(has(r.effects, 'cancelTimer', 'sleepy') && has(r.effects, 'cancelTimer', 'asleep')).toBe(true)

  r = go(r.state, { type: 'timer', name: 'flash' })
  expect(r.state.mood).toBe('focused')

  r = go(r.state, { type: 'turnComplete', reason: 'answer' })
  expect(r.state.mood).toBe('happy')
  expect(has(r.effects, 'startTimer', 'sleepy') && has(r.effects, 'startTimer', 'asleep')).toBe(true)

  r = go(r.state, { type: 'timer', name: 'flash' })
  expect(r.state.mood).toBe('neutral')
  r = go(r.state, { type: 'timer', name: 'sleepy' })
  expect(r.state.mood).toBe('sleepy')
  r = go(r.state, { type: 'timer', name: 'asleep' })
  expect(r.state.mood).toBe('asleep')
})

test('curious wins while a tool waits for your OK, and a failed tool saddens him', () => {
  let r = go(drawn(), { type: 'toolAsk' })
  expect(feeling(r.state)).toBe('curious')
  r = go(r.state, { type: 'toolDone', failed: true })
  expect(r.state.mood).toBe('sad')
})

test('no redraw when nothing he shows changes', () => {
  const r = go(drawn(), { type: 'toolDone', failed: false })
  expect(r.effects).toEqual([])
  expect(go(drawn(), { type: 'heat', level: 0 }).effects).toEqual([])
})

test('what the band sees changes the state and never asks for anything', () => {
  for (const event of [{ type: 'band', width: 500 }, { type: 'heatSeen', level: 2 }, { type: 'homeSeen', home: 0.2 }] as Event[]) {
    expect(go(drawn(), event).effects).toEqual([])
  }
  expect(go(drawn(), { type: 'heatSeen', level: 2 }).state.heat).toBe(2)
  expect(go(drawn(), { type: 'homeSeen', home: 0.2 }).state.home).toBe(0.2)
})

test('a visit moves his home, saves it, and waits out its own end', () => {
  const now = 100 * SECOND
  const r = go(drawn(), { type: 'toolStart', prop: 'file' }, now)
  const plan = visitPlan(720, 0.5, 1)
  expect(r.state.visit).toEqual({ prop: 'file', from: 0.5, n: 1, start: now, end: now + plan.end * SECOND })
  expect(r.state.home).toBe(plan.toU)
  expect(r.effects).toContainEqual({ type: 'saveHome', home: plan.toU })
  expect(has(r.effects, 'startTimer', 'visitEnd')).toBe(true)
  expect(has(r.effects, 'redraw')).toBe(true)
})

test('no visit before the band is drawn, while asleep, or sooner than the gap', () => {
  expect(go(initialState(), { type: 'toolStart', prop: 'file' }, 1e6).state.visit).toBeUndefined()
  expect(go({ ...drawn(), mood: 'asleep' }, { type: 'toolStart', prop: 'file' }, 1e6).state.visit).toBeUndefined()
  const first = go(drawn(), { type: 'toolStart', prop: 'file' }, 1e6).state
  const soon = go(first, { type: 'toolStart', prop: 'lens' }, 1e6 + PROP_GAP - 1).state
  expect(soon.visit?.prop).toBe('file')
  const later = go(first, { type: 'toolStart', prop: 'lens' }, 1e6 + PROP_GAP).state
  expect(later.visit?.prop).toBe('lens')
})

test('a mood change during a visit waits for its end, then gets its full time', () => {
  const now = 1e6
  let r = go(drawn(), { type: 'toolStart', prop: 'lens' }, now)
  r = go(r.state, { type: 'turnComplete', reason: 'answer' }, now + SECOND)
  expect(r.state.mood).toBe('happy')
  expect(has(r.effects, 'redraw')).toBe(false)
  expect(r.state.deferred).toBe(true)
  // Only one visit-end timer: the visit already started it.
  expect(has(r.effects, 'startTimer', 'visitEnd')).toBe(false)

  r = go(r.state, { type: 'timer', name: 'visitEnd' }, r.state.visit!.end + 300)
  expect(has(r.effects, 'redraw')).toBe(true)
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'flash', ms: passingMs('happy') })
  expect(r.state.deferred).toBe(false)
})

test('a visit with nothing waiting still redraws at its end, so the band ends on a plain drawing', () => {
  let r = go(drawn(), { type: 'toolStart', prop: 'pencil' }, 1e6)
  r = go(r.state, { type: 'timer', name: 'visitEnd' }, r.state.visit!.end + 300)
  expect(r.effects).toEqual([{ type: 'redraw' }])
})

test('while your mouse is over him nothing redraws and no prop drops; what waited is drawn once you have gone', () => {
  let r = go(drawn(), { type: 'near', on: true })
  expect(r.effects).toContainEqual({ type: 'cancelTimer', name: 'nearEnd' })
  r = go(r.state, { type: 'turnStart' })
  expect(r.state.mood).toBe('alert')
  expect(has(r.effects, 'redraw')).toBe(false)
  r = go(r.state, { type: 'toolStart', prop: 'file' }, 50 * SECOND)
  expect(r.state.visit).toBe(undefined)
  r = go(r.state, { type: 'heat', level: 2 })
  expect(has(r.effects, 'redraw')).toBe(false)

  // Leaving starts the grace; still no redraw.
  r = go(r.state, { type: 'near', on: false })
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'nearEnd', ms: NEAR_GRACE_MS })
  r = go(r.state, { type: 'timer', name: 'flash' })
  expect(has(r.effects, 'redraw')).toBe(false)

  // Back within the grace: the grace is off, the hold goes on.
  r = go(r.state, { type: 'near', on: true })
  expect(has(r.effects, 'cancelTimer', 'nearEnd')).toBe(true)
  r = go(r.state, { type: 'near', on: false })
  r = go(r.state, { type: 'timer', name: 'nearEnd' })
  expect(r.effects).toEqual([{ type: 'redraw' }])
  expect(nearHold(r.state)).toBe(false)
})

test('a passing mood that waited for you gets its full time once you have gone', () => {
  let r = go(drawn(), { type: 'near', on: true })
  r = go(r.state, { type: 'turnComplete', reason: 'answer' })
  r = go(r.state, { type: 'near', on: false })
  r = go(r.state, { type: 'timer', name: 'nearEnd' })
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'flash', ms: passingMs('happy') })
  expect(has(r.effects, 'redraw')).toBe(true)
})

test('a visit that ends while you are near waits for you, and leaving with nothing waiting redraws nothing', () => {
  let r = go(drawn(), { type: 'toolStart', prop: 'pencil' }, 1e6)
  r = go(r.state, { type: 'near', on: true })
  r = go(r.state, { type: 'timer', name: 'visitEnd' }, r.state.visit!.end + 300)
  expect(has(r.effects, 'redraw')).toBe(false)
  r = go(r.state, { type: 'near', on: false })
  r = go(r.state, { type: 'timer', name: 'nearEnd' }, 2e6)
  expect(r.effects).toEqual([{ type: 'redraw' }])

  r = go(drawn(), { type: 'near', on: true })
  r = go(r.state, { type: 'near', on: false })
  expect(go(r.state, { type: 'timer', name: 'nearEnd' }).effects).toEqual([])
})
