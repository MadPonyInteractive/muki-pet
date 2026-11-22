// Passing moods: alert when you send a message, happy for an answer, sad for
// an error or a failed tool. Each shows on top of what he is doing for a while
// (character/moods.ts), then goes.

import { passingMs, type PassingMood } from '../../character/moods.ts'
import type { Ctx, Event, MoodVote, Request, Result } from '../types.ts'
import { Behaviour } from './behaviour.ts'

export type ReactionSlice = { flash?: PassingMood }

// Passing moods beat what he is doing, but not a question waiting for you.
const PRIORITY = 20

export class Reaction extends Behaviour<ReactionSlice> {
  readonly name = 'reaction'

  initial(): ReactionSlice {
    return {}
  }

  on(event: Event, slice: ReactionSlice, _ctx: Ctx): Result<ReactionSlice> {
    const effects: Request[] = []
    let flash = slice.flash
    const show = (mood: PassingMood) => {
      flash = mood
      effects.push({ type: 'startTimer', name: 'reaction.flash', ms: passingMs(mood) })
    }
    switch (event.type) {
      case 'turnStart':
        show('alert')
        break
      case 'turnComplete':
        if (event.reason === 'answer') show('happy')
        else if (event.reason === 'error' || event.reason === 'refusal') show('sad')
        else {
          effects.push({ type: 'cancelTimer', name: 'reaction.flash' })
          flash = undefined
        }
        break
      case 'toolDone':
        if (event.failed) show('sad')
        break
      case 'timer':
        if (event.name === 'reaction.flash') flash = undefined
        break
      // A passing mood that waited for a visit or for you gets its full time
      // from the moment it is drawn.
      case 'released':
        if (flash) show(flash)
        break
    }
    return { slice: { flash }, effects }
  }

  mood(slice: ReactionSlice): MoodVote | undefined {
    return slice.flash && { mood: slice.flash, priority: PRIORITY }
  }
}
