// What is going on right now, asked by several behaviours: is a prop visit or
// a pile visit playing, is your hand on him. A leaf file (type imports only),
// so hold.ts, visit.ts and papers.ts can all use it without an import cycle.

import type { Visit } from '../types.ts'
import type { HoldSlice } from './hold.ts'
import type { PapersSlice, PileVisit } from './papers.ts'
import type { VisitSlice } from './visit.ts'

export const activeVisit = (slice: VisitSlice, now: number): Visit | undefined => (slice.visit && now < slice.visit.end ? slice.visit : undefined)

export const activePile = (slice: PapersSlice, now: number): PileVisit | undefined => (slice.visit && now < slice.visit.end ? slice.visit : undefined)

// Your mouse is over the band, or left it a moment ago.
export const held = (slice: HoldSlice) => slice.near || slice.nearGrace
