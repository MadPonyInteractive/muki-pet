// The brain's shared vocabulary: his state, the events that reach him and the
// effects he asks for. Types only (the slice types come from the behaviours),
// so nothing here can form an import cycle.

import type { Mood } from '../character/moods.ts'
import type { Prop } from '../character/props.ts'
import type { ActivityState } from './activity.ts'
import type { Slices } from './machine.ts'

// Timers are namespaced by whoever owns them.
export type TimerName = 'activity.sleepy' | 'activity.asleep' | 'reaction.flash' | 'hold.visitEnd' | 'hold.nearEnd' | 'attention.next' | 'papers.next' | 'celebrate.end' | 'remote.idle' | 'remote.settle'

export type Event =
  // From Claude Code.
  | { type: 'turnStart' }
  | { type: 'turnComplete'; reason: string }
  // `id`: the tool call's id, so only the asked tool's end ends the question.
  | { type: 'toolAsk'; id?: string }
  | { type: 'toolStart'; prop: Prop }
  | { type: 'toolDone'; failed: boolean; id?: string }
  | { type: 'heat'; level: number }
  // A message entered the chat; `origin` is where from (`prompt.submit`'s origin.kind).
  // `confirmed`: you said it worked (character/confirm.ts). It comes here, not
  // with turnStart: a message typed mid-turn starts no turn (MPI-24).
  | { type: 'prompt'; origin: string; confirmed?: boolean }
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
  // `asked`: while asking, the ids of the tools still waiting for your OK.
  activity: { state: ActivityState; resume: Exclude<ActivityState, 'asking'>; asked?: string[] }
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
  // One slice per behaviour, under its name (from the list in machine.ts).
  slices: Slices
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
  headset?: 'on' | 'drop' | 'lift'
}
