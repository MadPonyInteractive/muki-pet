// His brain as one pure loop: `step(state, event, now)` gives the next state
// and a list of effects (timers to start or cancel, a redraw, saving his home);
// runtime.ts carries the effects out. Per event:
//   1. what the band saw (width, heat, home) is noted;
//   2. his activity moves along its transition table (activity.ts);
//   3. each behaviour (behaviours/) handles the event on its own state slice;
//   4. what he shows is the highest-priority mood vote.
// Whether a change is drawn now or waits is the last behaviour's call
// (behaviours/hold.ts), so that rule lives in one place. A new behaviour is a
// new file and one line in BEHAVIOURS.

import { initialActivity, advance, activityMood } from './activity.ts'
import type { Behaviour } from './behaviours/behaviour.ts'
import { held, Hold } from './behaviours/hold.ts'
import { Reaction } from './behaviours/reaction.ts'
import { activeVisit as activeOf, VisitBehaviour } from './behaviours/visit.ts'
import type { DrawingOptions, Effect, Event, MoodVote, State, Visit } from './types.ts'

export type { Effect, Event, State, TimerName, Visit } from './types.ts'

// In the order they run. The hold goes last: it decides about redraws after
// the others have said what changed.
const reaction = new Reaction()
const visit = new VisitBehaviour()
const hold = new Hold()
// Each is keyed in State.slices by its name.
const BEHAVIOURS: Array<Behaviour<any>> = [reaction, visit, hold]

export const initialState = (): State => ({
  activity: initialActivity(),
  mood: 'neutral',
  heat: 0,
  home: 0.5,
  heatKnown: false,
  homeKnown: false,
  width: 0,
  slices: { reaction: reaction.initial(), visit: visit.initial(), hold: hold.initial() },
})

// The mood that wins: the highest priority among the activity's and the behaviours' votes.
export function feeling(s: State): State['mood'] {
  const votes = [activityMood(s.activity), ...BEHAVIOURS.map(b => b.mood(s.slices[b.name as keyof State['slices']]))]
  let best = votes[0]!
  for (const v of votes) if (v && v.priority > best.priority) best = v
  return best.mood
}

export const activeVisit = (s: State, now: number): Visit | undefined => activeOf(s.slices.visit, now)

// The band keeps the drawing it shows while you're with him.
export const nearHold = (s: State) => held(s.slices.hold)

// What the behaviours add to the next drawing.
export function drawingOptions(s: State, now: number): DrawingOptions {
  let options: DrawingOptions = {}
  for (const b of BEHAVIOURS) options = { ...options, ...b.drawing(s.slices[b.name as keyof State['slices']], now) }
  return options
}

export function step(state: State, event: Event, now: number): { state: State; effects: Effect[] } {
  const s: State = { ...state, slices: { ...state.slices } }
  const fx: Effect[] = []
  // Heat is the one thing besides his mood that makes the band want a redraw.
  let heatChanged = false

  // One event through the activity and every behaviour. `top` is the event
  // that came in; the ones behaviours emit are handled in place, so effects
  // keep their order.
  const run = (ev: Event, top: boolean) => {
    switch (ev.type) {
      case 'band':
        s.width = ev.width
        break
      case 'heatSeen':
        s.heatKnown = true
        if (ev.level !== undefined) s.heat = ev.level
        break
      case 'homeSeen':
        s.homeKnown = true
        if (ev.home !== undefined) s.home = ev.home
        break
      case 'heat':
        s.heatKnown = true
        if (ev.level !== s.heat) {
          s.heat = ev.level
          heatChanged = true
        }
        break
    }
    const next = advance(s.activity, ev)
    s.activity = next.activity
    fx.push(...next.effects)

    for (const b of BEHAVIOURS) {
      const wants = top && (heatChanged || feeling(s) !== s.mood)
      const r = b.on(ev, s.slices[b.name as keyof State['slices']], { now, state: s, wants })
      Object.assign(s.slices, { [b.name]: r.slice })
      if (r.home !== undefined) s.home = r.home
      for (const req of r.effects) {
        if (req.type === 'emit') run(req.event, false)
        else fx.push(req)
      }
    }
  }
  run(event, true)
  s.mood = feeling(s)
  return { state: s, effects: fx }
}
