// The celebration through the whole machine (MPI-12).

import { expect, test } from 'claude-code/testing'

import { passingMs } from '../../character/moods.ts'
import { initialState, step, type State } from '../machine.ts'

const drawn = (): State => step(initialState(), { type: 'band', width: 720 }, 0).state

const yes = { type: 'prompt', origin: 'composer', confirmed: true } as const

test('"it worked" makes him celebrate over the alert and the work, then he settles', () => {
  // The prompt comes first, then the turn it starts.
  let r = step(drawn(), yes, 0)
  expect(r.state.mood).toBe('celebrate')
  expect(r.effects).toContainEqual({ type: 'redraw' })
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'celebrate.end', ms: passingMs('celebrate') })
  r = step(r.state, { type: 'turnStart' }, 50)
  expect(r.state.mood).toBe('celebrate')
  // The alert's flash ending doesn't cut it short.
  r = step(r.state, { type: 'timer', name: 'reaction.flash' }, 2500)
  expect(r.state.mood).toBe('celebrate')
  r = step(r.state, { type: 'timer', name: 'celebrate.end' }, passingMs('celebrate'))
  expect(r.state.mood).toBe('focused')
})

test('any other message is the usual alert', () => {
  const r = step(drawn(), { type: 'prompt', origin: 'composer', confirmed: false }, 0)
  expect(step(r.state, { type: 'turnStart' }, 50).state.mood).toBe('alert')
  expect(step(drawn(), { type: 'turnStart' }, 0).state.mood).toBe('alert')
})

// Desktop, 2026-11-27 (MPI-24): a message typed while Claude is still working
// goes into the running turn; prompt.submit sees it, and no turnStart follows.
test('"it worked" typed while Claude is still working celebrates too, with no turn of its own', () => {
  let r = step(drawn(), { type: 'turnStart' }, 0)
  r = step(r.state, { type: 'timer', name: 'reaction.flash' }, 2500)
  expect(r.state.mood).toBe('focused')
  r = step(r.state, yes, 4000)
  expect(r.state.mood).toBe('celebrate')
  expect(r.effects).toContainEqual({ type: 'redraw' })
})

test('with your mouse on him the party waits, and gets its full time once you go', () => {
  let r = step(drawn(), { type: 'near', on: true }, 0)
  r = step(r.state, yes, 100)
  expect(r.effects).not.toContainEqual({ type: 'redraw' })
  r = step(r.state, { type: 'near', on: false }, 200)
  r = step(r.state, { type: 'timer', name: 'hold.nearEnd' }, 9000)
  expect(r.effects).toContainEqual({ type: 'redraw' })
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'celebrate.end', ms: passingMs('celebrate') })
})
