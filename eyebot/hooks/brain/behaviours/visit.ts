// Prop visits: a tool Claude starts may drop a prop for him to roll over and
// look at. At most one at a time and one per PROP_GAP; the spot beside the
// prop becomes his new home. The redraws a visit holds back are hold.ts's job.

import { visitPlan } from '../../character/geometry.ts'
import { AFTER_VISIT_MS, PROP_GAP, SECOND } from '../../character/tuning.ts'
import type { Ctx, DrawingOptions, Event, Request, Result, Visit } from '../types.ts'
import { Behaviour } from './behaviour.ts'
import { held } from './hold.ts'

export type VisitSlice = { visit?: Visit; visits: number; lastVisit: number }

export const activeVisit = (slice: VisitSlice, now: number): Visit | undefined => (slice.visit && now < slice.visit.end ? slice.visit : undefined)

export class VisitBehaviour extends Behaviour<VisitSlice> {
  readonly name = 'visit'

  initial(): VisitSlice {
    return { visits: 0, lastVisit: -Infinity }
  }

  on(event: Event, slice: VisitSlice, ctx: Ctx): Result<VisitSlice> {
    const { state, now } = ctx
    if (event.type !== 'toolStart') return { slice, effects: [] }
    if (state.mood === 'asleep' || held(state.slices.hold) || !state.width || now - slice.lastVisit < PROP_GAP || activeVisit(slice, now)) {
      return { slice, effects: [] }
    }
    const n = slice.visits + 1
    const plan = visitPlan(state.width, state.home, n)
    const visit: Visit = { prop: event.prop, from: state.home, n, start: now, end: now + plan.end * SECOND }
    const effects: Request[] = [
      { type: 'saveHome', home: plan.toU },
      // The hold waits for the visit's end before it redraws.
      { type: 'emit', event: { type: 'visitStarted', endsIn: plan.end * SECOND + AFTER_VISIT_MS } },
      { type: 'redraw' },
    ]
    return { slice: { visit, visits: n, lastVisit: now }, effects, home: plan.toU }
  }

  drawing(slice: VisitSlice, now: number): DrawingOptions | undefined {
    const active = activeVisit(slice, now)
    return active && { visit: { prop: active.prop, from: active.from, n: active.n, elapsed: (now - active.start) / SECOND } }
  }
}
