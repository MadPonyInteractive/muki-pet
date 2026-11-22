// The one place that decides whether a redraw happens now. A redraw would put
// him back home in a fresh drawing, so it waits while
//  - a prop visit runs (a visit is never cut short), and
//  - your mouse is over the band, and for NEAR_GRACE_MS after it left (your
//    play with him is not cut short either).
// What waited is drawn once, when the hold ends, and a passing mood that waited
// gets its full time then (the `released` event, see reaction.ts).
//
// It must come last in the behaviour list: it is told (`ctx.wants`) whether
// anything the others did changed what he shows.
//
// A visit's own drawing at its start is not held (visit.ts asks for it
// directly). At the visit's end there is always a redraw, even with nothing
// waiting, so the band's last drawing is never a visit: Desktop draws a chat's
// last drawing again from its start when the chat is opened, and a visit would
// replay (the ghost of 2026-11-22).

import { AFTER_VISIT_MS, NEAR_GRACE_MS } from '../../character/tuning.ts'
import type { Ctx, Event, Request, Result } from '../types.ts'
import { Behaviour } from './behaviour.ts'

export type HoldSlice = {
  // Your mouse is over the band, or left it less than NEAR_GRACE_MS ago.
  near: boolean
  nearGrace: boolean
  // A redraw waits for the hold to end.
  deferred: boolean
  // The visit-end timer is running.
  visitEndSet: boolean
}

export const held = (slice: HoldSlice) => slice.near || slice.nearGrace

export class Hold extends Behaviour<HoldSlice> {
  readonly name = 'hold'

  initial(): HoldSlice {
    return { near: false, nearGrace: false, deferred: false, visitEndSet: false }
  }

  on(event: Event, slice: HoldSlice, ctx: Ctx): Result<HoldSlice> {
    const s: HoldSlice = { ...slice }
    const effects: Request[] = []
    const afterVisit = (ms: number) => {
      if (s.visitEndSet) return
      s.visitEndSet = true
      effects.push({ type: 'startTimer', name: 'hold.visitEnd', ms })
    }
    // The held redraw is drawn now: whatever waited is released first.
    const release = () => {
      if (s.deferred) effects.push({ type: 'emit', event: { type: 'released' } })
      s.deferred = false
    }
    const redraw = () => {
      if (held(s)) {
        s.deferred = true
        return
      }
      // (visit.ts and papers.ts have the same test as activeVisit/activePile;
      // they can't be imported here without a cycle.)
      const prop = ctx.state.slices.visit.visit
      const pile = ctx.state.slices.papers.visit
      const v = prop && ctx.now < prop.end ? prop : pile
      if (v && ctx.now < v.end) {
        s.deferred = true
        afterVisit(v.end - ctx.now + AFTER_VISIT_MS)
        return
      }
      effects.push({ type: 'redraw' })
    }

    switch (event.type) {
      case 'near':
        if (event.on) {
          s.near = true
          s.nearGrace = false
          effects.push({ type: 'cancelTimer', name: 'hold.nearEnd' })
        } else if (s.near) {
          s.near = false
          s.nearGrace = true
          effects.push({ type: 'startTimer', name: 'hold.nearEnd', ms: NEAR_GRACE_MS })
        }
        break
      case 'visitStarted':
        afterVisit(event.endsIn)
        break
      case 'timer':
        if (event.name === 'hold.nearEnd') {
          s.nearGrace = false
          if (s.deferred) {
            release()
            // A visit may still be running: then it waits again.
            redraw()
          }
        } else if (event.name === 'hold.visitEnd') {
          s.visitEndSet = false
          // You're still with him: the plain drawing waits for you to go.
          if (held(s)) {
            s.deferred = true
          } else {
            release()
            effects.push({ type: 'redraw' })
          }
        }
        break
    }
    if (ctx.wants) redraw()
    return { slice: s, effects }
  }
}
