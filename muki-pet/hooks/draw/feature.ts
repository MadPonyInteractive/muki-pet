// The shape every optional part of the drawing plugs into (heat, sleep, touch,
// visit, cookies). compose.ts loops over the list in features/index.ts, so
// adding a feature is one file and one line there; the body parts (parts/)
// know nothing about any feature.

import type { VisitPlan } from '../character/geometry.ts'
import type { Mood } from '../character/moods.ts'
import type { Prop } from '../character/props.ts'

export type RobotOptions = {
  mood?: Mood
  // The mood he had before: the drawing starts from that face and slides over.
  from?: Mood
  // His home spot, as a share of the band (0 = left end, 1 = right end). Every
  // drawing starts him resting there.
  home?: number
  // How hot he runs, 0 to MAX_HEAT, from how full the context window is.
  heat?: number
  // A prop he is visiting: from which home, the visit's number, and how far
  // into it this drawing starts. Its end spot is his home.
  visit?: { prop: Prop; from: number; n: number; elapsed: number }
}

// A visit still playing in this drawing (a finished one draws as no visit).
export type ActiveVisit = { plan: VisitPlan; prop: Prop; from: number; n: number; elapsed: number }

// What a feature is told about the drawing being built.
export type DrawCtx = {
  W: number // band width
  ground: number // y of the ground line
  H: number // band height
  options: RobotOptions
  mood: Mood
  visit: ActiveVisit | undefined
}

// Where a feature's markup goes (each is a place inside the robot's SVG):
//   head      on the screen head, after the face (drawn in head coordinates)
//   overHead  over his head, in the body group (unscaled)
//   ground    on the ground beside him, in the body group
//   zones     invisible touch zones over him, inside `.bot`, before the body
//   behind    inside the travelling group, before the robot (invisible strips)
//   front     inside the travelling group, after the robot (drawn in front)
//   props     inside the moving group, before everything that travels (a prop)
// Within one place, features come in the order of the list.
export type SlotName = 'head' | 'overHead' | 'ground' | 'zones' | 'behind' | 'front' | 'props'

export type Feature = {
  name: string
  // Classes added to the svg root, after `m-<mood>`.
  rootClass?: (d: DrawCtx) => string
  // Always-on rules for this feature. They go after the body parts' rules and
  // before the drawing's own wandering, mood and visit rules.
  css?: (d: DrawCtx) => string
  // Rules that depend on this drawing (a visit's timeline). They go last, after
  // the mood's rules, so they win over it.
  drawingCss?: (d: DrawCtx) => string
  // Added to the shared <defs>.
  defs?: string
  slots?: { [S in SlotName]?: (d: DrawCtx) => string }
}
