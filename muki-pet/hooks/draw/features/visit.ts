// A prop visit: it rolls him to the prop, has him inspect it, and poofs it.
// Where the prop lands and when each step runs is the plan, in
// character/geometry.ts (visitPlan); this turns the plan into CSS. The steps
// are named cues (below), and every part's track is written against them: to
// have him look at the prop longer, move the `leave` cue's offset once.

import { COLORS } from '../../character/palette.ts'
import { LEAD } from '../../character/tuning.ts'
import { propShape } from '../../character/props.ts'
import type { VisitPlan } from '../../character/geometry.ts'
import type { Mood } from '../../character/moods.ts'
import { K, propClass } from '../classes.ts'
import type { ActiveVisit, DrawCtx, Feature } from '../feature.ts'
import { deg, r1 } from '../math.ts'
import { partTransform } from '../moods.ts'
import { calm } from '../parts/body-css.ts'
import { r2, timeline } from '../timeline.ts'

// Less motion (Fabio, 2026-11-23): no roll over. The drawing is placed at his
// new home, so with the roll gone he is simply beside the prop from the start;
// his head stays straight. Face, "?"/"!" and the prop's pop stay.
const stillRoll = (kick: boolean) =>
  calm(`.${K.carry},.${K.visitWheel},.${K.visiting} .${K.lean}${kick ? `,.${K.propAnim}` : ''}{animation:none!important}`)

// The visit's moments, in seconds from the end of the lead-in. `arrive` and
// `leave` come from the plan; the rest are offsets from them.
function cues(v: VisitPlan) {
  const { arrive: A, leave: L } = v
  return {
    start: 0,
    // He begins to roll, his head leans into it.
    roll: 0.9,
    lean: 0.9 + v.go * 0.35,
    nearly: A - 0.1,
    arrive: A,
    // The prop pops in early, while he is still rolling.
    popIn: 0.3,
    popped: 0.45,
    // His eyes find the prop before he gets there, then drop to it.
    glance: 0.35,
    eyesDown: A + 0.25,
    headTurn: A + 0.3,
    // He nudges the prop: the "?".
    askUp: A + 0.2,
    ask: A + 0.45,
    askEnd: A + 1.3,
    nudge: A + 0.6,
    nudgeLeft: A + 0.75,
    nudgeRight: A + 0.9,
    nudgeBack: A + 1.05,
    // The curious top lids give way a little before the "!".
    lidsUp: A + 1.5,
    // The "!" and the happy squint before he leaves.
    squint: A + 1.4,
    bang: A + 1.45,
    bangPop: A + 1.65,
    bangSet: A + 1.8,
    leave: L,
    bangEnd: L + 0.2,
    headBack: L + 0.5,
    puff: L + 0.15,
    gone: L + 0.45,
  }
}

// The visit's CSS. Each part runs one keyframe track over the whole visit,
// eased per step; `elapsed` picks a later start when a new drawing (a mood
// change) comes in the middle of it. While he checks the prop out he wears the
// curious face, then goes back to the face of his mood.
export function visitCss(v: VisitPlan, elapsed: number, mood: Mood): string {
  if (KICKING.includes(mood)) return kickCss(v, elapsed)
  // The visit's own time runs from the end of the lead-in.
  const T = r2(v.end - LEAD)
  elapsed -= LEAD
  const { track } = timeline(T)
  const run = (name: string) => `animation:${name} ${T}s ease-in-out ${r2(-elapsed)}s both`
  const { s } = v
  const c = cues(v)
  const E = T
  const from = v.fromX - v.toX
  const tx = (px: number) => `transform:translateX(${px}px)`
  const rot = (d: number) => `transform:rotate(${r1(d)}deg)`
  const rest = (sels: string[]) => `transform:${partTransform(mood, sels)}`
  // A face part: his mood's look before and after, the curious look in between.
  const face = (name: string, sels: string[], from: number, to: number, look = partTransform('curious', sels)) =>
    track(name, [[0, rest(sels)], [from, rest(sels)], [from + 0.3, `transform:${look}`], [to, `transform:${look}`], [to + 0.35, rest(sels)], [E, rest(sels)]])
  return (
    // His loop waits, held on his spot, until the visit is over.
    `.${K.loop}{animation-delay:${r2(T - elapsed)}s;animation-fill-mode:backwards}` +
    `.${K.prop}{display:inline}.${K.visiting} .${K.query}{display:inline}` +
    // The roll over: body and wheels.
    `.${K.carry}{${run('vx')}}` +
    track('vx', [[c.start, tx(from)], [c.roll, tx(from)], [c.arrive, tx(0)], [E, tx(0)]]) +
    `.${K.visitWheel}{${run('vw')}}` +
    track('vw', [[c.start, rot(deg(from))], [c.roll, rot(deg(from))], [c.arrive, rot(0)], [E, rot(0)]]) +
    // His head leans into the roll, then toward the prop.
    `.${K.visiting} .${K.lean}{${run('vl')}}` +
    track('vl', [
      [c.start, rot(0)], [c.roll, rot(0)], [c.lean, rot(-s * 9)], [c.nearly, rot(-s * 5)], [c.headTurn, rot(s * 14)],
      [c.leave, rot(s * 11)], [c.headBack, rot(0)], [E, rot(0)],
    ]) +
    // His eyes: toward the prop, then down at it.
    `.${K.visiting} .${K.gaze}{${run('vg')}}` +
    track('vg', [
      [c.start, rest([`.${K.gaze}`])], [c.glance, `transform:translate(${s * 5}px,0)`], [c.arrive, `transform:translate(${s * 5}px,0)`],
      [c.eyesDown, `transform:translate(${s * 4}px,3px)`], [c.leave, `transform:translate(${s * 4}px,3px)`],
      [c.headBack, rest([`.${K.gaze}`])], [E, rest([`.${K.gaze}`])],
    ]) +
    // The curious face.
    `.${K.visiting} .${K.eyeL}{${run('vcl')}}.${K.visiting} .${K.eyeR}{${run('vcr')}}.${K.visiting} .${K.topL}{${run('vtl')}}.${K.visiting} .${K.topR}{${run('vtr')}}` +
    face('vcl', [`.${K.eye}`, `.${K.eyeL}`], c.glance, c.leave) +
    face('vcr', [`.${K.eye}`, `.${K.eyeR}`], c.glance, c.leave) +
    face('vtl', [`.${K.top}`, `.${K.topL}`], c.glance, c.lidsUp) +
    face('vtr', [`.${K.top}`, `.${K.topR}`], c.glance, c.lidsUp) +
    `.${K.visiting} .${K.lid}{${run('vd')}}` +
    // The "!": a happy squint before he leaves.
    face('vd', [`.${K.lid}`], c.squint, c.leave, 'translateY(-9px)') +
    `.${K.visiting} .${K.hop}{animation:hop .5s ease-out ${r2(0.3 - elapsed)}s}` +
    // The "?" and the "!" over his head.
    `.${K.query1}{${run('vq1')}}` +
    track('vq1', [[c.start, 'opacity:0'], [c.askUp, 'opacity:0;transform:translateY(3px)'], [c.ask, 'opacity:1;transform:none'], [c.askEnd, 'opacity:1;transform:none'], [c.bang, 'opacity:0'], [E, 'opacity:0']]) +
    `.${K.query2}{${run('vq2')}}` +
    track('vq2', [[c.start, 'opacity:0'], [c.bang, 'opacity:0;transform:scale(.4)'], [c.bangPop, 'opacity:1;transform:scale(1.2)'], [c.bangSet, 'opacity:1;transform:none'], [c.leave, 'opacity:1;transform:none'], [c.bangEnd, 'opacity:0'], [E, 'opacity:0']]) +
    // The prop: pops in, gets nudged, poofs.
    `.${K.propAnim}{${run('vpa')}}` +
    track('vpa', [
      [c.start, 'transform:scale(0)'], [c.popIn, 'transform:scale(1.18)'], [c.popped, 'transform:none'], [c.nudge, 'transform:none'],
      [c.nudgeLeft, 'transform:rotate(-14deg)'], [c.nudgeRight, 'transform:rotate(10deg)'], [c.nudgeBack, 'transform:none'],
      [c.leave, 'transform:none;opacity:1'], [c.puff, 'transform:scale(1.25);opacity:1'], [c.gone, 'transform:scale(0);opacity:0'], [E, 'transform:scale(0);opacity:0'],
    ]) +
    stillRoll(false)
  )
}

// Mad, he kicks the prop away instead (Fabio, 2026-11-22, MPI-5): he glares at
// it, dashes over, hits it hard (his body jerks into it, his head snaps at it)
// and it flies off spinning, out of the band. He keeps his mood's face (no "?"
// or "!"), gives one satisfied hop, and stays there as usual. Same plan and
// timings as a normal visit, so the hook and the drawing still agree; only
// the look differs.
const KICKING: Mood[] = ['mad', 'tantrum']

function kickCss(v: VisitPlan, elapsed: number): string {
  const T = r2(v.end - LEAD)
  elapsed -= LEAD
  const { track } = timeline(T)
  const run = (name: string) => `animation:${name} ${T}s ease-in-out ${r2(-elapsed)}s both`
  const { s, arrive: A } = v
  const E = T
  const from = v.fromX - v.toX
  const tx = (px: number) => `transform:translateX(${px}px)`
  const rot = (d: number) => `transform:rotate(${r1(d)}deg)`
  // He glares a moment, then dashes in half the time a calm visit takes.
  const dash = r2(Math.max(0.9, A - v.go * 0.5))
  const hit = A + 0.06
  return (
    `.${K.loop}{animation-delay:${r2(T - elapsed)}s;animation-fill-mode:backwards}` +
    `.${K.prop}{display:inline}` +
    // The dash, and a jerk into the kick.
    `.${K.carry}{${run('vx')}}` +
    track('vx', [[0, tx(from)], [dash, tx(from)], [A, tx(0)], [hit, tx(s * 7)], [A + 0.3, tx(0)], [E, tx(0)]]) +
    `.${K.visitWheel}{${run('vw')}}` +
    track('vw', [[0, rot(deg(from))], [dash, rot(deg(from))], [A, rot(0)], [hit, rot(deg(s * 7))], [A + 0.3, rot(0)], [E, rot(0)]]) +
    // Head: leans back into the dash, snaps at the prop, then back.
    `.${K.visiting} .${K.lean}{${run('vl')}}` +
    track('vl', [[0, rot(0)], [dash, rot(0)], [dash + 0.1, rot(-s * 14)], [A - 0.05, rot(-s * 10)], [hit, rot(s * 24)], [A + 0.45, rot(s * 8)], [A + 1.1, rot(0)], [E, rot(0)]]) +
    // Eyes on the prop, then following it as it flies.
    `.${K.visiting} .${K.gaze}{${run('vg')}}` +
    track('vg', [[0, 'transform:none'], [0.35, `transform:translate(${s * 5}px,0)`], [A + 0.2, `transform:translate(${s * 5}px,-2px)`], [A + 0.7, `transform:translate(${s * 6}px,-3px)`], [A + 1.3, 'transform:none'], [E, 'transform:none']]) +
    `.${K.visiting} .${K.hop}{animation:hop .5s ease-out ${r2(A + 0.9 - elapsed)}s}` +
    // The prop: pops in, shivers while he glares, then flies off spinning.
    `.${K.propAnim}{${run('vpa')}}` +
    track('vpa', [
      [0, 'transform:scale(0)'], [0.3, 'transform:scale(1.18)'], [0.45, 'transform:none'], [dash - 0.2, 'transform:none'], [dash - 0.1, 'transform:rotate(-6deg)'], [dash, 'transform:rotate(5deg)'], [dash + 0.1, 'transform:none'],
      [hit, 'transform:none;opacity:1'], [A + 0.35, `transform:translate(${s * 130}px,-38px) rotate(${s * 300}deg);opacity:1`],
      [A + 0.75, `transform:translate(${s * 280}px,-14px) rotate(${s * 620}deg);opacity:0`], [E, `transform:translate(${s * 280}px,-14px);opacity:0`],
    ]) +
    // The prop doesn't fly off either; it sits until the drawing after the visit.
    stillRoll(true)
  )
}

// A feature only draws while a visit is still playing (`d.visit`).
const rootClass = (d: DrawCtx) => (d.visit ? `${K.visiting} ${propClass(d.visit.prop)}` : '')

const prop = (v: ActiveVisit) =>
  `<g class="${K.prop}" transform="translate(${v.plan.off},0)"><g class="${K.propAnim}">${propShape(v.prop)}</g></g>`

const queries = () =>
  `<g class="${K.query}" transform="translate(20,-58)" fill="${COLORS.eye}" font-family="sans-serif" font-weight="700" font-size="11">` +
  `<text class="${K.query1}">?</text><text class="${K.query2}" x="1">!</text></g>`

export const visit: Feature = {
  name: 'visit',
  rootClass,
  css: () => `.${K.prop},.${K.query}{display:none;pointer-events:none}.${K.query} text{opacity:0}`,
  drawingCss: (d) => (d.visit ? visitCss(d.visit.plan, Math.max(0, d.visit.elapsed), d.mood) : ''),
  slots: {
    props: (d) => (d.visit ? prop(d.visit) : ''),
    overHead: queries,
  },
}
