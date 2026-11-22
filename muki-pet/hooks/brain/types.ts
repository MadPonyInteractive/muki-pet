// The brain's shared vocabulary: his state, the events that reach him and the
// effects he asks for. Types only (the slice types come from the behaviours),
// so nothing here can form an import cycle.

import type { Mood } from '../character/moods.ts'
import type { Prop } from '../character/props.ts'
import type { ActivityState } from './activity.ts'
import type { AttentionSlice } from './behaviours/attention.ts'
import type { HoldSlice } from './behaviours/hold.ts'
import type { ReactionSlice } from './behaviours/reaction.ts'
import type { PapersSlice } from './behaviours/papers.ts'
import type { VisitSlice } from './behaviours/visit.ts'

// Timers are namespaced by whoever owns them.
export type TimerName = 'activity.sleepy' | 'activity.asleep' | 'reaction.flash' | 'hold.visitEnd' | 'hold.nearEnd' | 'attention.next' | 'papers.next'

export type Event =
  // From Claude Code.
  | { type: 'turnStart' }
  | { type: 'turnComplete'; reason: string }
  | { type: 'toolAsk' }
  | { type: 'toolStart'; prop: Prop }
  | { type: 'toolDone'; failed: boolean }
  | { type: 'heat'; level: number }
  // Background tasks still running at the end of a turn (the paper pile).
  | { type: 'papers'; count: number }
  // Your mouse came over the band (true) or left it (false).
  | { type: 'near'; on: boolean }
  // A timer this machine started.
  | { type: 'timer'; name: TimerName }
  // Seen while drawing the band: change the state, never cause a redraw.
  | { type: 'band'; width: number }
  | { type: 'heatSeen'; level?: number }
  | { type: 'homeSeen'; home?: number }
  // Between behaviours (a behaviour asks for these with an `emit` request):
  // a visit just started and ends in `endsIn` ms; a redraw that waited is
  // being drawn now.
  | { type: 'visitStarted'; endsIn: number }
  | { type: 'released' }

// What the runtime carries out.
export type Effect =
  // Starts a timer, replacing a running one of the same name.
  | { type: 'startTimer'; name: TimerName; ms: number }
  | { type: 'cancelTimer'; name: TimerName }
  | { type: 'redraw' }
  | { type: 'saveHome'; home: number }

// What a behaviour may ask for: an effect, or an event for all the behaviours
// (handled in place, so effects keep their order).
export type Request = Effect | { type: 'emit'; event: Event }

// A visit's end spot is his new home.
export type Visit = { prop: Prop; from: number; n: number; start: number; end: number }

export type State = {
  // His lasting state (idle, working, asking, sleepy, asleep) and its table.
  activity: { state: ActivityState; resume: Exclude<ActivityState, 'asking'> }
  // What the band shows. Every drawing starts him resting at his home spot
  // (`home`, a share of the band), so a new drawing never has to guess how far
  // he got in the old one: drawings can't share a clock, each starts its own
  // when it loads, which may be much later than the hook thinks.
  mood: Mood
  heat: number
  home: number
  // Whether heat and home were read yet (from usage or the store).
  heatKnown: boolean
  homeKnown: boolean
  // The band's width in px, 0 until it is first drawn. A visit needs it.
  width: number
  // One slice per behaviour, under its name.
  slices: { reaction: ReactionSlice; attention: AttentionSlice; visit: VisitSlice; papers: PapersSlice; hold: HoldSlice }
}

// What a behaviour is told besides the event.
export type Ctx = {
  now: number
  // His state with the slices of the behaviours before this one already updated.
  state: State
  // This event changed what he shows (mood or heat), so the band wants a redraw.
  wants: boolean
}

export type Result<S> = {
  slice: S
  effects: Request[]
  // A behaviour that moves him gives his new home.
  home?: number
}

// A behaviour's say in what he feels: the highest priority wins.
export type MoodVote = { mood: Mood; priority: number }

// What a behaviour adds to the drawing (the brain never imports draw/; this
// has the shape of draw's options).
export type DrawingOptions = {
  visit?: { prop: Prop; from: number; n: number; elapsed: number }
  pile?: { count: number; visit?: { from: number; n: number; elapsed: number } }
}
