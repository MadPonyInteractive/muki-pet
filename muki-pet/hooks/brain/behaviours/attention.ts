// He needs attention (Fabio, 2026-11-22). A clock runs from the last time you
// played with him (your mouse over the band for PLAY_MS or more: a pet or a
// cookie, which the hook can't tell apart). With energy (under 30% context) no
// play makes him lonely, then mad, then he throws tantrums. Tired (30% and
// over) he only gets lonely, sooner after the last play, and never mad. Asleep,
// he shows none of it (the clock keeps running).
//
// Inside one drawing a pet or a cookie cheers him up at once (touch wins over
// any mood, draw/features/touch.ts); this clock is what the next drawing shows.

import {
  LONELY_AFTER, MAD_AFTER, PLAY_MS, TANTRUM_AFTER, TIRED_HEAT, TIRED_LONELY,
} from '../../character/tuning.ts'
import type { Ctx, Event, MoodVote, Request, Result } from '../types.ts'
import { Behaviour } from './behaviour.ts'

export type Need = 'lonely' | 'mad' | 'tantrum'

export type AttentionSlice = {
  // When he last had attention (the first event he saw, before any play).
  since?: number
  // When your mouse came over the band, while it is there.
  nearSince?: number
  // What he feels for want of attention, if anything.
  need?: Need
  // When the running timer fires, so it is only restarted when that changes.
  nextAt?: number
}

// Over what he is doing, under passing moods and a question waiting for you.
const PRIORITY = 15

// The steps, from how long since the last play: [after ms, need].
const steps = (tired: boolean): Array<[number, Need]> =>
  tired ? [[TIRED_LONELY, 'lonely']] : [[LONELY_AFTER, 'lonely'], [MAD_AFTER, 'mad'], [TANTRUM_AFTER, 'tantrum']]

export class Attention extends Behaviour<AttentionSlice> {
  readonly name = 'attention'

  initial(): AttentionSlice {
    return {}
  }

  on(event: Event, slice: AttentionSlice, ctx: Ctx): Result<AttentionSlice> {
    const s: AttentionSlice = { ...slice }
    s.since ??= ctx.now
    if (event.type === 'near') {
      if (event.on) s.nearSince ??= ctx.now
      else {
        if (s.nearSince !== undefined && ctx.now - s.nearSince >= PLAY_MS) s.since = ctx.now
        s.nearSince = undefined
      }
    }

    const idle = ctx.now - s.since
    const list = steps(ctx.state.heat >= TIRED_HEAT)
    let need: Need | undefined
    let nextAt: number | undefined
    for (const [after, n] of list) {
      if (idle >= after) need = n
      else {
        nextAt = s.since + after
        break
      }
    }
    s.need = ctx.state.activity.state === 'asleep' ? undefined : need

    const effects: Request[] = []
    if (nextAt !== s.nextAt) {
      effects.push(nextAt === undefined ? { type: 'cancelTimer', name: 'attention.next' } : { type: 'startTimer', name: 'attention.next', ms: nextAt - ctx.now })
      s.nextAt = nextAt
    }
    return { slice: s, effects }
  }

  mood(slice: AttentionSlice): MoodVote | undefined {
    return slice.need && { mood: slice.need, priority: PRIORITY }
  }
}
