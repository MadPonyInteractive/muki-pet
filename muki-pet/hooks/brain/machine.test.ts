// The state machine on its own: events in, state and effects out. No host.

import { expect, test } from 'claude-code/testing'

import { visitPlan } from '../character/geometry.ts'
import { passingMs } from '../character/moods.ts'
import {
  LONELY_AFTER, MAD_AFTER, MINUTE, NEAR_GRACE_MS, PLAY_MS, PROP_GAP, SECOND, TANTRUM_AFTER, TIRED_HEAT, TIRED_LONELY,
} from '../character/tuning.ts'
import { ACTIVITY_TABLE, advance, type ActivityState } from './activity.ts'
import { Hold } from './behaviours/hold.ts'
import { Reaction } from './behaviours/reaction.ts'
import { VisitBehaviour } from './behaviours/visit.ts'
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
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'reaction.flash', ms: passingMs('alert') })
  expect(has(r.effects, 'cancelTimer', 'activity.sleepy') && has(r.effects, 'cancelTimer', 'activity.asleep')).toBe(true)

  r = go(r.state, { type: 'timer', name: 'reaction.flash' })
  expect(r.state.mood).toBe('focused')

  r = go(r.state, { type: 'turnComplete', reason: 'answer' })
  expect(r.state.mood).toBe('happy')
  expect(has(r.effects, 'startTimer', 'activity.sleepy') && has(r.effects, 'startTimer', 'activity.asleep')).toBe(true)

  r = go(r.state, { type: 'timer', name: 'reaction.flash' })
  expect(r.state.mood).toBe('neutral')
  r = go(r.state, { type: 'timer', name: 'activity.sleepy' })
  expect(r.state.mood).toBe('sleepy')
  r = go(r.state, { type: 'timer', name: 'activity.asleep' })
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

test('what the band sees changes the state and never asks for a redraw', () => {
  for (const event of [{ type: 'band', width: 500 }, { type: 'heatSeen', level: 2 }, { type: 'homeSeen', home: 0.2 }] as Event[]) {
    // (Heat 2 moves his attention timer: tired, he gets lonely sooner.)
    expect(go(drawn(), event).effects.filter(f => f.type !== 'startTimer')).toEqual([])
  }
  expect(go(drawn(), { type: 'heatSeen', level: 2 }).state.heat).toBe(2)
  expect(go(drawn(), { type: 'homeSeen', home: 0.2 }).state.home).toBe(0.2)
})

test('a visit moves his home, saves it, and waits out its own end', () => {
  const now = 100 * SECOND
  const r = go(drawn(), { type: 'toolStart', prop: 'file' }, now)
  const plan = visitPlan(720, 0.5, 1)
  expect(r.state.slices.visit.visit).toEqual({ prop: 'file', from: 0.5, n: 1, start: now, end: now + plan.end * SECOND })
  expect(r.state.home).toBe(plan.toU)
  expect(r.effects).toContainEqual({ type: 'saveHome', home: plan.toU })
  expect(has(r.effects, 'startTimer', 'hold.visitEnd')).toBe(true)
  expect(has(r.effects, 'redraw')).toBe(true)
})

test('no visit before the band is drawn, while asleep, or sooner than the gap', () => {
  expect(go(initialState(), { type: 'toolStart', prop: 'file' }, 1e6).state.slices.visit.visit).toBeUndefined()
  expect(go({ ...drawn(), mood: 'asleep' }, { type: 'toolStart', prop: 'file' }, 1e6).state.slices.visit.visit).toBeUndefined()
  const first = go(drawn(), { type: 'toolStart', prop: 'file' }, 1e6).state
  const soon = go(first, { type: 'toolStart', prop: 'lens' }, 1e6 + PROP_GAP - 1).state
  expect(soon.slices.visit.visit?.prop).toBe('file')
  const later = go(first, { type: 'toolStart', prop: 'lens' }, 1e6 + PROP_GAP).state
  expect(later.slices.visit.visit?.prop).toBe('lens')
})

test('a mood change during a visit waits for its end, then gets its full time', () => {
  const now = 1e6
  let r = go(drawn(), { type: 'toolStart', prop: 'lens' }, now)
  r = go(r.state, { type: 'turnComplete', reason: 'answer' }, now + SECOND)
  expect(r.state.mood).toBe('happy')
  expect(has(r.effects, 'redraw')).toBe(false)
  expect(r.state.slices.hold.deferred).toBe(true)
  // Only one visit-end timer: the visit already started it.
  expect(has(r.effects, 'startTimer', 'hold.visitEnd')).toBe(false)

  r = go(r.state, { type: 'timer', name: 'hold.visitEnd' }, r.state.slices.visit.visit!.end + 300)
  expect(has(r.effects, 'redraw')).toBe(true)
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'reaction.flash', ms: passingMs('happy') })
  expect(r.state.slices.hold.deferred).toBe(false)
})

test('a visit with nothing waiting still redraws at its end, so the band ends on a plain drawing', () => {
  let r = go(drawn(), { type: 'toolStart', prop: 'pencil' }, 1e6)
  r = go(r.state, { type: 'timer', name: 'hold.visitEnd' }, r.state.slices.visit.visit!.end + 300)
  expect(r.effects).toEqual([{ type: 'redraw' }])
})

test('while your mouse is over him nothing redraws and no prop drops; what waited is drawn once you have gone', () => {
  let r = go(drawn(), { type: 'near', on: true })
  expect(r.effects).toContainEqual({ type: 'cancelTimer', name: 'hold.nearEnd' })
  r = go(r.state, { type: 'turnStart' })
  expect(r.state.mood).toBe('alert')
  expect(has(r.effects, 'redraw')).toBe(false)
  r = go(r.state, { type: 'toolStart', prop: 'file' }, 50 * SECOND)
  expect(r.state.slices.visit.visit).toBe(undefined)
  r = go(r.state, { type: 'heat', level: 2 })
  expect(has(r.effects, 'redraw')).toBe(false)

  // Leaving starts the grace; still no redraw.
  r = go(r.state, { type: 'near', on: false })
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'hold.nearEnd', ms: NEAR_GRACE_MS })
  r = go(r.state, { type: 'timer', name: 'reaction.flash' })
  expect(has(r.effects, 'redraw')).toBe(false)

  // Back within the grace: the grace is off, the hold goes on.
  r = go(r.state, { type: 'near', on: true })
  expect(has(r.effects, 'cancelTimer', 'hold.nearEnd')).toBe(true)
  r = go(r.state, { type: 'near', on: false })
  r = go(r.state, { type: 'timer', name: 'hold.nearEnd' })
  expect(r.effects).toEqual([{ type: 'redraw' }])
  expect(nearHold(r.state)).toBe(false)
})

test('a passing mood that waited for you gets its full time once you have gone', () => {
  let r = go(drawn(), { type: 'near', on: true })
  r = go(r.state, { type: 'turnComplete', reason: 'answer' })
  r = go(r.state, { type: 'near', on: false })
  r = go(r.state, { type: 'timer', name: 'hold.nearEnd' })
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'reaction.flash', ms: passingMs('happy') })
  expect(has(r.effects, 'redraw')).toBe(true)
})

// Rule (docs/architecture/how-it-works.md § No redraw from play): play happens
// while he may be out on a wander trip, and any redraw then jumps him home. His
// reaction to play lives in the drawing's CSS (draw/features/touch.ts), never
// in a brain mood. A 'pleased' mood here teleported him (Fabio, 2026-11-22).
test('play with him while he wanders never redraws him', () => {
  let r = go(drawn(), { type: 'near', on: true })
  r = go(r.state, { type: 'near', on: false }, PLAY_MS)
  expect(r.state.mood).toBe('neutral')
  expect(has(r.effects, 'redraw')).toBe(false)
  r = go(r.state, { type: 'timer', name: 'hold.nearEnd' }, PLAY_MS + NEAR_GRACE_MS)
  expect(has(r.effects, 'redraw')).toBe(false)
  expect(r.state.mood).toBe('neutral')
})

test('a visit that ends while you are near waits for you, and leaving with nothing waiting redraws nothing', () => {
  let r = go(drawn(), { type: 'toolStart', prop: 'pencil' }, 3e5)
  r = go(r.state, { type: 'near', on: true })
  r = go(r.state, { type: 'timer', name: 'hold.visitEnd' }, r.state.slices.visit.visit!.end + 300)
  expect(has(r.effects, 'redraw')).toBe(false)
  r = go(r.state, { type: 'near', on: false })
  // (Before LONELY_AFTER: he isn't lonely yet, attention.ts.)
  r = go(r.state, { type: 'timer', name: 'hold.nearEnd' }, 4e5)
  expect(r.effects).toEqual([{ type: 'redraw' }])

  r = go(drawn(), { type: 'near', on: true })
  r = go(r.state, { type: 'near', on: false })
  expect(go(r.state, { type: 'timer', name: 'hold.nearEnd' }).effects).toEqual([])
})

// --- Behaviours and the activity table, each on its own ---

const ctx = (state: State, now = 0, wants = false) => ({ now, state, wants })

test('activity: the transition table, state by state', () => {
  const at = (state: ActivityState, resume: ActivityState = state) => ({ state, resume }) as State['activity']
  expect(advance(at('idle'), { type: 'turnStart' }).activity.state).toBe('working')
  expect(advance(at('working'), { type: 'turnComplete', reason: 'answer' }).activity.state).toBe('idle')
  expect(advance(at('working'), { type: 'toolAsk' }).activity).toEqual({ state: 'asking', resume: 'working' })
  expect(advance(at('asking', 'working'), { type: 'toolDone', failed: false }).activity.state).toBe('working')
  // Not asking: a finished tool changes nothing.
  expect(advance(at('working'), { type: 'toolDone', failed: false }).activity.state).toBe('working')
  // A sleep timer while asking changes what he returns to, not the question.
  expect(advance(at('asking', 'idle'), { type: 'timer', name: 'activity.sleepy' }).activity).toEqual({ state: 'asking', resume: 'sleepy' })
  expect(advance(at('idle'), { type: 'timer', name: 'activity.sleepy' }).activity.state).toBe('sleepy')
  expect(advance(at('sleepy'), { type: 'timer', name: 'activity.asleep' }).activity.state).toBe('asleep')
  expect(advance(at('asleep'), { type: 'turnStart' }).activity.state).toBe('working')
  // Every state has a row, and an event the table doesn't know changes nothing.
  for (const state of Object.keys(ACTIVITY_TABLE) as ActivityState[]) {
    expect(advance(at(state), { type: 'near', on: true }).activity).toEqual(at(state))
  }
})

test('reaction: passing moods on their events, each with its own timer', () => {
  const b = new Reaction()
  let r = b.on({ type: 'turnComplete', reason: 'answer' }, b.initial(), ctx(initialState()))
  expect(r.slice.flash).toBe('happy')
  expect(r.effects).toEqual([{ type: 'startTimer', name: 'reaction.flash', ms: passingMs('happy') }])
  expect(b.mood(r.slice)).toEqual({ mood: 'happy', priority: 20 })
  r = b.on({ type: 'timer', name: 'reaction.flash' }, r.slice, ctx(initialState()))
  expect(b.mood(r.slice)).toBeUndefined()
  expect(b.on({ type: 'toolDone', failed: true }, b.initial(), ctx(initialState())).slice.flash).toBe('sad')
  // A pause or an interrupted turn clears it.
  expect(b.on({ type: 'turnComplete', reason: 'stop' }, { flash: 'sad' }, ctx(initialState())).effects).toEqual([{ type: 'cancelTimer', name: 'reaction.flash' }])
})

test('visit: starts when allowed, moves his home, and says so for the hold', () => {
  const b = new VisitBehaviour()
  const s = drawn()
  const r = b.on({ type: 'toolStart', prop: 'lens' }, b.initial(), ctx(s, 1e6))
  const plan = visitPlan(720, 0.5, 1)
  expect(r.home).toBe(plan.toU)
  expect(r.slice.visit?.end).toBe(1e6 + plan.end * SECOND)
  expect(r.effects.map(f => f.type)).toEqual(['saveHome', 'emit', 'redraw'])
  expect(b.drawing(r.slice, 1e6 + SECOND)?.visit).toEqual({ prop: 'lens', from: 0.5, n: 1, elapsed: 1 })
  expect(b.drawing(r.slice, r.slice.visit!.end)).toBeUndefined()
  // Not while he is held.
  const held = { ...s, slices: { ...s.slices, hold: { ...s.slices.hold, near: true } } }
  expect(b.on({ type: 'toolStart', prop: 'lens' }, b.initial(), ctx(held, 1e6)).effects).toEqual([])
})

test('hold: a wanted redraw waits for a visit or for you, and is drawn once', () => {
  const b = new Hold()
  const s = drawn()
  expect(b.on({ type: 'heat', level: 1 }, b.initial(), ctx(s, 0, true)).effects).toEqual([{ type: 'redraw' }])
  const near = b.on({ type: 'near', on: true }, b.initial(), ctx(s))
  const waiting = b.on({ type: 'heat', level: 1 }, near.slice, ctx(s, 0, true))
  expect(waiting.slice.deferred).toBe(true)
  expect(waiting.effects).toEqual([])
  const gone = b.on({ type: 'near', on: false }, waiting.slice, ctx(s))
  const done = b.on({ type: 'timer', name: 'hold.nearEnd' }, gone.slice, ctx(s))
  expect(done.effects).toEqual([{ type: 'emit', event: { type: 'released' } }, { type: 'redraw' }])
  expect(done.slice.deferred).toBe(false)
})

test('attention: with no play he gets lonely, then mad, then throws tantrums; play ends it', () => {
  const at = (s: State, min: number) => go(s, { type: 'timer', name: 'attention.next' }, min * MINUTE)
  let s = drawn()
  expect(s.mood).toBe('neutral')
  let r = at(s, LONELY_AFTER / MINUTE)
  expect(r.state.mood).toBe('lonely')
  expect(has(r.effects, 'redraw')).toBe(true)
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'attention.next', ms: MAD_AFTER - LONELY_AFTER })
  expect(at(r.state, MAD_AFTER / MINUTE).state.mood).toBe('mad')
  s = at(r.state, TANTRUM_AFTER / MINUTE).state
  expect(s.mood).toBe('tantrum')
  // A quick pass of the mouse is not play.
  r = go(s, { type: 'near', on: true }, 40 * MINUTE)
  r = go(r.state, { type: 'near', on: false }, 40 * MINUTE + PLAY_MS - 1)
  expect(r.state.mood).toBe('tantrum')
  // Play is: the mood waits for the hold, then he's fine and the clock restarts.
  r = go(r.state, { type: 'near', on: true }, 41 * MINUTE)
  r = go(r.state, { type: 'near', on: false }, 41 * MINUTE + PLAY_MS)
  expect(r.state.mood).toBe('neutral')
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'attention.next', ms: LONELY_AFTER })
})

test('attention: tired (30% context) he only gets lonely, sooner, and never mad; asleep he shows none', () => {
  let s = go(drawn(), { type: 'heat', level: TIRED_HEAT }).state
  let r = go(s, { type: 'timer', name: 'attention.next' }, TIRED_LONELY)
  expect(r.state.mood).toBe('lonely')
  r = go(r.state, { type: 'timer', name: 'attention.next' }, TANTRUM_AFTER + MINUTE)
  expect(r.state.mood).toBe('lonely')
  // Cooler again: the full ladder from the same clock.
  expect(go(r.state, { type: 'heat', level: 1 }, TANTRUM_AFTER + MINUTE).state.mood).toBe('tantrum')
  s = go(drawn(), { type: 'turnComplete', reason: 'answer' }).state
  s = go(s, { type: 'timer', name: 'reaction.flash' }).state
  s = go(s, { type: 'timer', name: 'activity.asleep' }, LONELY_AFTER).state
  expect(s.mood).toBe('asleep')
})
