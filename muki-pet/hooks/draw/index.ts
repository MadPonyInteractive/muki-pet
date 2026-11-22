// The drawing's public face: `robotSvg` builds the robot as one self-animating
// SVG. Pure: the same options always give the same string.
//
// Where to change what:
//   ../character/      what he is, as data: moods, props, heat levels, colours,
//                      timings, band geometry. Start there.
//   compose.ts         puts the parts and features together
//   feature.ts         the shape a feature plugs in with (places, CSS, classes)
//   features/          heat, sleep, touch, visit, cookies/ (one file each)
//   parts/             his body: wheels, head, face, the groups round them
//   classes.ts         every CSS class name, once
//   timeline.ts        named cues for keyframe tracks and delays
//   moods.ts           mood faces as CSS      wander.ts, keyframes.ts  wandering

// Tools and tests reach the shared definitions through here too.
export { BAND_HEIGHT, visitPlan, type VisitPlan } from '../character/geometry.ts'
export { MOODS, type Mood } from '../character/moods.ts'
export { PROPS, type Prop } from '../character/props.ts'
export { robotSvg } from './compose.ts'
export type { RobotOptions } from './feature.ts'
export { LAYERS } from './features/cookies/index.ts'
