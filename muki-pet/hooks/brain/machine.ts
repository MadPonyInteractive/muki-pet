// His brain as one pure loop: `step(state, event, now)` gives the next state
// and a list of effects (timers to start or cancel, a redraw, saving his home);
// runtime.ts carries the effects out. Per event:
//   1. what the band saw (width, heat, home) is noted;
//   2. his activity moves along its transition table (activity.ts);
//   3. each behaviour (behaviours/) handles the event on its own state slice;
//   4. what he shows is the highest-priority mood vote.
// Whether a change is drawn now or waits is the last behaviour's call
// (behaviours/hold.ts), so that rule lives in one place. A new behaviour is a
// new file and one entry in BEHAVIOURS: its slice in State comes from the list.

import { initialActivity, advance, activityMood } from './activity.ts'
import { Attention } from './behaviours/attention.ts'
import type { Behaviour } from './behaviours/behaviour.ts'
import { Celebrate } from './behaviours/celebrate.ts'
import { Hold } from './behaviours/hold.ts'
import { Papers } from './behaviours/papers.ts'
import { Reaction } from './behaviours/reaction.ts'
import { Remote } from './behaviours/remote.ts'
import { activeVisit as activeOf, held } from './behaviours/running.ts'
import { VisitBehaviour } from './behaviours/visit.ts'
import type { DrawingOptions, Effect, Event, MoodVote, State, Visit } from './types.ts'

export type { Effect, Event, State, TimerName, Visit } from './types.ts'

// In the order they run. The hold goes last: it decides about redraws after
// the others have said what changed.
const BEHAVIOURS = [new Reaction(), new Celebrate(), new Attention(), new VisitBehaviour(), new Papers(), new Remote(), new Hold()] as const

// State.slices: each behaviour's slice, under its name (types.ts uses this).
type Each = (typeof BEHAVIOURS)[number]
export type Slices = { [B in Each as B['name']]: ReturnType<B['initial']> }

// The loops below see every behaviour the same way; each one's own slice
// is fetched by name in one place.
const ALL: ReadonlyArray<Behaviour<unknown>> = BEHAVIOURS
const sliceOf = (b: Behaviour<unknown>, s: State): unknown => (s.slices as Record<string, unknown>)[b.name]

export const initialState = (): State => ({
  activity: initialActivity(),
  mood: 'neutral',
  heat: 0,
  home: 0.5,
  heatKnown: false,
  homeKnown: false,
  width: 0,
  slices: Object.fromEntries(ALL.map(b => [b.name, b.initial()])) as Slices,
})

// The mood that wins: the highest priority among the activity's and the behaviours' votes.
export function feeling(s: State): State['mood'] {
  const votes = [activityMood(s.activity), ...ALL.map(b => b.mood(sliceOf(b, s)))]
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
  for (const b of ALL) options = { ...options, ...b.drawing(sliceOf(b, s), now) }
  return options
}

export function step(state: State, event: Event, now: number): { state: State; effects: Effect[] } {
  const s: State = { ...state, slices: { ...state.slices } }
  const fx: Effect[] = []
  // Heat and the paper pile are the things besides his mood that make the band want a redraw.
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

    for (const b of ALL) {
      // A paper more or less in the pile is drawn too, and the headset going on, off or settling.
      const wants = top && (heatChanged || feeling(s) !== s.mood || s.slices.papers.count !== state.slices.papers.count || s.slices.remote !== state.slices.remote)
      const r = b.on(ev, sliceOf(b, s), { now, state: s, wants })
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
