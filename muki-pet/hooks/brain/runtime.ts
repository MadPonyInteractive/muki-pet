// Runs the brain against the host: owns its state and its timers (one brain per
// load of the mod, so one per chat), reads the store and usage figures, and
// carries out the effects `step` asks for. The only brain file that touches `$`.
//
// The mod loader only lets `$` be passed to functions declared at the top of
// the module's own files, so this is plain functions over a `Brain` record
// (state and timers, no host in it), not an object with methods. Tests make a
// fresh one with `createBrain()` and pass it in.

import type { EngineInterface } from 'claude-code'

import { heatOf } from '../character/heat.ts'
import { readForChat, saveForChat } from './chat-store.ts'
import { initialState, step } from './machine.ts'
import type { Effect, Event, State, TimerName } from './types.ts'

// Keys in the mod's store: his home spot, and the last context percentage seen
// (per chat: { <session id>: percent }, chat-store.ts).
export const STORE_HOME = 'home'
export const STORE_HEAT = 'context'

type Timer = { cancel: () => void }

export type Brain = { state: State; timers: Map<TimerName, Timer>; homeLoad?: Promise<void> }

export const createBrain = (): Brain => ({ state: initialState(), timers: new Map() })

// The mod's brain (one per load).
const current = createBrain()

// What the brain says now. Read-only for everyone else.
export function brainState(brain: Brain = current): State {
  return brain.state
}

// An event from Claude Code, the band or a timer, at the host's time.
export async function send($: EngineInterface, event: Event, brain: Brain = current) {
  const now = await $.clock.now()
  const next = step(brain.state, event, now)
  brain.state = next.state
  for (const fx of next.effects) run($, brain, fx)
}

// Heat on every redraw, as the context bar does: the live figure, or the last
// one saved (a fresh reload has none until the next response).
export async function readHeat($: EngineInterface, brain: Brain = current) {
  try {
    let percent = (await $.session.usage()).context.percent
    if (percent !== undefined) {
      const live = percent
      void Promise.resolve()
        .then(() => saveForChat($, STORE_HEAT, live))
        .catch(() => {})
    } else if (!brain.state.heatKnown) {
      // This chat's own figure: another chat's context is not his (MPI-17).
      const saved = await readForChat($, STORE_HEAT)
      if (typeof saved === 'number') percent = saved
    }
    await send($, { type: 'heatSeen', level: percent === undefined ? undefined : heatOf(percent) }, brain)
  } catch {
    // No usage figures (the test engine): he stays as he is.
  }
}

// His saved home, once per load of the mod.
// Every render waits for the same read: opening a chat fires two renders at
// once, and one that didn't wait drew him at the default spot, then the saved
// spot came in and the old drawing stayed on top (two robots, MPI-9).
export function readHome($: EngineInterface, brain: Brain = current) {
  brain.homeLoad ??= loadHome($, brain)
  return brain.homeLoad
}

async function loadHome($: EngineInterface, brain: Brain) {
  // Inside the try: a failed read here would otherwise fail every render of the chat.
  try {
    await send($, { type: 'homeSeen' }, brain)
    const home = await $.store.get(STORE_HOME)
    if (typeof home === 'number' && home >= 0 && home <= 1) await send($, { type: 'homeSeen', home }, brain)
  } catch {}
}

function run($: EngineInterface, brain: Brain, fx: Effect) {
  if (fx.type === 'startTimer') {
    brain.timers.get(fx.name)?.cancel()
    const timer: Timer = $.clock.after(fx.ms, () => {
      if (brain.timers.get(fx.name) === timer) brain.timers.delete(fx.name)
      void send($, { type: 'timer', name: fx.name }, brain).catch(() => {})
    })
    brain.timers.set(fx.name, timer)
  } else if (fx.type === 'cancelTimer') {
    brain.timers.get(fx.name)?.cancel()
    brain.timers.delete(fx.name)
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
