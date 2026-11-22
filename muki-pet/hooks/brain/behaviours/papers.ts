// The paper pile (MPI-14): how many background tasks Claude has running, and his
// visits to the pile. While papers lie there he rolls over every few minutes,
// rolls his eyes at them and rolls off; the spot he rolls off to is his new home.
// He only goes when nothing else has him: Claude isn't working or asking, he
// isn't asleep, your mouse isn't on him, and no prop visit runs. The pile's
// numbers and the route are in character/papers.ts.

import { MAX_PAPERS, PILE_FIRST, PILE_RETRY, pileGap, pilePlan } from '../../character/papers.ts'
import { AFTER_VISIT_MS, SECOND } from '../../character/tuning.ts'
import type { Ctx, DrawingOptions, Event, Request, Result } from '../types.ts'
import { Behaviour } from './behaviour.ts'
import { held } from './hold.ts'
import { activeVisit } from './visit.ts'

export type PileVisit = { from: number; n: number; start: number; end: number }

export type PapersSlice = {
  // Papers in the pile (capped at MAX_PAPERS).
  count: number
  visit?: PileVisit
  visits: number
  // The next-visit timer is running.
  timerSet: boolean
}

export const activePile = (slice: PapersSlice, now: number): PileVisit | undefined => (slice.visit && now < slice.visit.end ? slice.visit : undefined)

export class Papers extends Behaviour<PapersSlice> {
  readonly name = 'papers'

  initial(): PapersSlice {
    return { count: 0, visits: 0, timerSet: false }
  }

  on(event: Event, slice: PapersSlice, ctx: Ctx): Result<PapersSlice> {
    const { state, now } = ctx
    if (event.type === 'papers') {
      const count = Math.max(0, Math.min(MAX_PAPERS, Math.floor(event.count)))
      if (count === 0) {
        return { slice: { ...slice, count, timerSet: false }, effects: slice.timerSet ? [{ type: 'cancelTimer', name: 'papers.next' }] : [] }
      }
      if (slice.timerSet) return { slice: { ...slice, count }, effects: [] }
      return { slice: { ...slice, count, timerSet: true }, effects: [{ type: 'startTimer', name: 'papers.next', ms: PILE_FIRST }] }
    }
    if (event.type !== 'timer' || event.name !== 'papers.next') return { slice, effects: [] }

    if (slice.count === 0) return { slice: { ...slice, timerSet: false }, effects: [] }
    const free =
      state.activity.state === 'idle' &&
      state.mood !== 'asleep' &&
      state.width > 0 &&
      !held(state.slices.hold) &&
      !activeVisit(state.slices.visit, now) &&
      !activePile(slice, now)
    if (!free) return { slice: { ...slice, timerSet: true }, effects: [{ type: 'startTimer', name: 'papers.next', ms: PILE_RETRY }] }

    const n = slice.visits + 1
    const plan = pilePlan(state.width, state.home, n)
    const visit: PileVisit = { from: state.home, n, start: now, end: now + plan.end * SECOND }
    const effects: Request[] = [
      { type: 'saveHome', home: plan.toU },
      // The hold waits for the visit's end before it redraws.
      { type: 'emit', event: { type: 'visitStarted', endsIn: plan.end * SECOND + AFTER_VISIT_MS } },
      { type: 'redraw' },
      { type: 'startTimer', name: 'papers.next', ms: plan.end * SECOND + pileGap(n) },
    ]
    return { slice: { ...slice, visit, visits: n, timerSet: true }, effects, home: plan.toU }
  }

  drawing(slice: PapersSlice, now: number): DrawingOptions | undefined {
    if (slice.count === 0) return undefined
    const active = activePile(slice, now)
    return { pile: { count: slice.count, visit: active && { from: active.from, n: active.n, elapsed: (now - active.start) / SECOND } } }
  }
}
