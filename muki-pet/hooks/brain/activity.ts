// What he is doing, as named states and a transition table (state x event ->
// state). Pure data plus two small functions; the machine (machine.ts) runs it
// before the behaviours.
//
//   idle     nothing going on
//   working  Claude is working on a turn
//   asking   a tool waits for your OK (he goes back to what he was)
//   sleepy   a long quiet spell
//   asleep   a longer one
//
// Reading the table: `row[event]` is where he goes. Missing = no change.

import { ASLEEP_AFTER, SLEEPY_AFTER } from '../character/tuning.ts'
import type { Effect, Event, MoodVote, State } from './types.ts'

export type ActivityState = 'idle' | 'working' | 'asking' | 'sleepy' | 'asleep'
type Resting = Exclude<ActivityState, 'asking'>

// The events that move him between states.
export type ActivityEvent = 'turnStart' | 'turnComplete' | 'toolAsk' | 'toolDone' | 'sleepy' | 'asleep'

// A cell: the next state; 'resume' = what he was before asking; or
// { keep } = still asking, but he'll go back to something else.
type Cell = ActivityState | 'resume' | { keep: Resting }

export const ACTIVITY_TABLE: Record<ActivityState, Partial<Record<ActivityEvent, Cell>>> = {
  idle: { turnStart: 'working', turnComplete: 'idle', toolAsk: 'asking', sleepy: 'sleepy', asleep: 'asleep' },
  working: { turnStart: 'working', turnComplete: 'idle', toolAsk: 'asking', sleepy: 'sleepy', asleep: 'asleep' },
  asking: { turnStart: 'working', turnComplete: 'idle', toolAsk: 'asking', toolDone: 'resume', sleepy: { keep: 'sleepy' }, asleep: { keep: 'asleep' } },
  sleepy: { turnStart: 'working', turnComplete: 'idle', toolAsk: 'asking', sleepy: 'sleepy', asleep: 'asleep' },
  asleep: { turnStart: 'working', turnComplete: 'idle', toolAsk: 'asking', sleepy: 'sleepy', asleep: 'asleep' },
}

// What each state feels like, and how strongly: asking beats a passing mood
// (priority 20, reaction.ts), which beats the rest.
const FEEL: Record<ActivityState, MoodVote> = {
  idle: { mood: 'neutral', priority: 10 },
  working: { mood: 'focused', priority: 10 },
  asking: { mood: 'curious', priority: 30 },
  sleepy: { mood: 'sleepy', priority: 10 },
  asleep: { mood: 'asleep', priority: 10 },
}

export const initialActivity = (): State['activity'] => ({ state: 'idle', resume: 'idle' })

export const activityMood = (a: State['activity']): MoodVote => FEEL[a.state]

// Which table column an event is, if any.
export function activityKey(event: Event): ActivityEvent | undefined {
  switch (event.type) {
    case 'turnStart':
    case 'turnComplete':
    case 'toolAsk':
    case 'toolDone':
      return event.type
    case 'timer':
      return event.name === 'activity.sleepy' ? 'sleepy' : event.name === 'activity.asleep' ? 'asleep' : undefined
    default:
      return undefined
  }
}

// The next state, and the timers that come with the event: a turn cancels the
// sleep timers, its end starts them.
export function advance(a: State['activity'], event: Event): { activity: State['activity']; effects: Effect[] } {
  const key = activityKey(event)
  const cell = key && ACTIVITY_TABLE[a.state][key]
  const effects: Effect[] = []
  if (key === 'turnStart') effects.push({ type: 'cancelTimer', name: 'activity.sleepy' }, { type: 'cancelTimer', name: 'activity.asleep' })
  if (key === 'turnComplete') effects.push({ type: 'startTimer', name: 'activity.sleepy', ms: SLEEPY_AFTER }, { type: 'startTimer', name: 'activity.asleep', ms: ASLEEP_AFTER })
  if (!cell) return { activity: a, effects }
  if (cell === 'resume') return { activity: { state: a.resume, resume: a.resume }, effects }
  if (typeof cell === 'object') return { activity: { state: 'asking', resume: cell.keep }, effects }
  if (cell === 'asking') return { activity: a.state === 'asking' ? a : { state: 'asking', resume: a.state as Resting }, effects }
  return { activity: { state: cell, resume: cell }, effects }
}

