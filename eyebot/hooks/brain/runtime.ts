// Runs the state machine against the host: owns its one state and its timers
// (one per load of the mod, so one per chat), and carries out the effects
// `step` asks for.
//
// The mod loader only lets `$` be passed to functions declared at the top of
// the module's own files, so this is plain functions over module state, not an
// object with methods.

import { STORE_HOME } from './config.ts'
import { initialState, step, type Effect, type Event, type State, type TimerName } from './machine.ts'

type Timer = { cancel: () => void }

let state: State = initialState()
const timers = new Map<TimerName, Timer>()

// What the brain says now. Read-only for everyone else.
export function brainState(): State {
  return state
}

// An event from Claude Code or a timer, at the host's time.
export async function send($: any, event: Event) {
  const now = await $.clock.now()
  const next = step(state, event, now)
  state = next.state
  for (const fx of next.effects) run($, fx)
}

// Something seen while drawing the band (`band`, `heatSeen`, `homeSeen`):
// these change the state and never ask for anything.
export function note(event: Extract<Event, { type: 'band' | 'heatSeen' | 'homeSeen' }>) {
  state = step(state, event, 0).state
}

function run($: any, fx: Effect) {
  if (fx.type === 'startTimer') {
    timers.get(fx.name)?.cancel()
    const timer: Timer = $.clock.after(fx.ms, () => {
      if (timers.get(fx.name) === timer) timers.delete(fx.name)
      void send($, { type: 'timer', name: fx.name }).catch(() => {})
    })
    timers.set(fx.name, timer)
  } else if (fx.type === 'cancelTimer') {
    timers.get(fx.name)?.cancel()
    timers.delete(fx.name)
  } else if (fx.type === 'redraw') {
    $.ui.invalidate('ui.render')
  } else {
    // Home is saved, so a reload of the mod (which forgets everything) doesn't
    // draw him back in the middle while the old drawing still has him elsewhere.
    void Promise.resolve()
      .then(() => $.store.set(STORE_HOME, fx.home))
      .catch(() => {})
  }
}
