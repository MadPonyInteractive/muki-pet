// The one shape every behaviour has. A behaviour is pure: it gets an event and
// its own slice of the state, and gives back the new slice plus effects as
// data. It never holds the host (`$`); runtime.ts carries the effects out.
//
// This base class does nothing; a behaviour overrides what it needs, one level
// deep (no further subclassing). Its timers are named `<name>.<what>`.

import type { Ctx, DrawingOptions, Event, MoodVote, Result } from '../types.ts'

export abstract class Behaviour<S> {
  abstract readonly name: string

  // Its slice of the state at the start.
  abstract initial(): S

  // An event came in: its new slice and what it asks for.
  on(_event: Event, slice: S, _ctx: Ctx): Result<S> {
    return { slice, effects: [] }
  }

  // Its say in what he feels, if any; the highest priority wins.
  mood(_slice: S): MoodVote | undefined {
    return undefined
  }

  // What it adds to the next drawing, if anything.
  drawing(_slice: S, _now: number): DrawingOptions | undefined {
    return undefined
  }
}
