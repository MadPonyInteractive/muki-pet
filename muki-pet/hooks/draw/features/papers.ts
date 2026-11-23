// The paper pile (MPI-14): one paper per background task, lying at the right
// end of his road (the `scene` place: it stays put while he wanders). On a pile
// visit he rolls over, looks at it, rolls his eyes, drops his lids ("ugh,
// work"), shakes his head and rolls off to his new home. The route and its
// timings are character/papers.ts (pilePlan); this turns them into CSS, as
// features/visit.ts does for a prop.

import { LEAD } from '../../character/tuning.ts'
import { pilePlan, pileX, sheet, type PilePlan } from '../../character/papers.ts'
import type { Mood } from '../../character/moods.ts'
import { K } from '../classes.ts'
import type { DrawCtx, Feature } from '../feature.ts'
import { deg, r1 } from '../math.ts'
import { partTransform } from '../moods.ts'
import { calm } from '../parts/body-css.ts'
import { r2, timeline, type Stop } from '../timeline.ts'

// The pile, its top sheet lifting a corner now and then.
function pile(d: DrawCtx): string {
  const count = d.options.pile?.count ?? 0
  if (count <= 0) return ''
  let sheets = ''
  for (let i = 0; i < count; i++) {
    const top = i === count - 1
    sheets += top ? `<g class="${K.pileTop}">${sheet(i, true)}</g>` : sheet(i, false)
  }
  return `<g class="${K.pile}" transform="translate(${pileX(d.W)},0) scale(1.25)">${sheets}</g>`
}

// The eye roll: how long it takes, and the arc the eyes follow, sampled finely
// and run at an even speed (each stop says `linear`, so the arc doesn't ease
// to a halt at every sample). From down-right, where the pile is, over the top,
// to the left: angles in degrees, 0 = right, 90 = straight up.
const ROLL_S = 0.5
const ROLL_FROM = -25
const ROLL_TO = 200
const ROLL_STEPS = 12
function rollArc(start: number): Stop[] {
  const stops: Stop[] = []
  for (let i = 0; i <= ROLL_STEPS; i++) {
    const u = i / ROLL_STEPS
    const a = ((ROLL_FROM + (ROLL_TO - ROLL_FROM) * u) * Math.PI) / 180
    const decl = `transform:translate(${r1(6.5 * Math.cos(a))}px,${r1(-1.5 - 7 * Math.sin(a))}px)`
    stops.push([start + ROLL_S * u, i < ROLL_STEPS ? `${decl};animation-timing-function:linear` : decl])
  }
  return stops
}

// The visit's moments, in seconds from the drawing's start (lead-in included).
function cues(p: PilePlan) {
  const A = p.arrive
  return {
    roll: LEAD + 0.4,
    lean: LEAD + 0.4 + p.go * 0.35,
    nearly: A - 0.1,
    arrive: A,
    look: A + 0.3,
    // The eye roll: one quick arc, up and over, right to left (ROLL_ARC).
    rollStart: A + 0.85,
    rollEnd: A + 0.85 + ROLL_S,
    // Lids down, unimpressed; then the head shake.
    lids: A + 0.85 + ROLL_S + 0.2,
    shake1: A + 2.25,
    shake2: A + 2.45,
    shake3: A + 2.65,
    leave: p.leave,
    away: p.leave + p.back * 0.5,
    home: p.home,
  }
}

export function pileCss(p: PilePlan, elapsed: number, mood: Mood): string {
  const T = p.end
  const { track } = timeline(T)
  const run = (name: string) => `animation:${name} ${T}s ease-in-out ${r2(-elapsed)}s both`
  const c = cues(p)
  const E = T
  const from = p.fromX - p.toX
  const at = p.atX - p.toX
  const tx = (px: number) => `transform:translateX(${px}px)`
  const rot = (d: number) => `transform:rotate(${r1(d)}deg)`
  const rest = (sels: string[]) => `transform:${partTransform(mood, sels)}`
  const gz = (x: number, y: number) => `transform:translate(${x}px,${y}px)`
  const gzRest = rest([`.${K.gaze}`])
  const lid = (name: string, sels: string[]) =>
    track(name, [[0, rest(sels)], [c.rollEnd, rest(sels)], [c.lids, 'transform:translateY(6px)'], [c.leave, 'transform:translateY(6px)'], [c.away, rest(sels)], [E, rest(sels)]])
  return (
    // His loop waits, held on his spot, until the visit is over.
    `.${K.loop}{animation-delay:${r2(T - elapsed)}s;animation-fill-mode:backwards}` +
    // The roll there and the roll off.
    `.${K.carry}{${run('px')}}` +
    track('px', [[0, tx(from)], [c.roll, tx(from)], [c.arrive, tx(at)], [c.leave, tx(at)], [c.home, tx(0)], [E, tx(0)]]) +
    `.${K.visitWheel}{${run('pw')}}` +
    track('pw', [[0, rot(deg(from))], [c.roll, rot(deg(from))], [c.arrive, rot(deg(at))], [c.leave, rot(deg(at))], [c.home, rot(0)], [E, rot(0)]]) +
    // His head: leans into the roll, toward the pile, shakes "no", leans off.
    `.${K.pileVisit} .${K.lean}{${run('pl')}}` +
    track('pl', [
      [0, rot(0)], [c.roll, rot(0)], [c.lean, rot(-9)], [c.nearly, rot(-5)], [c.look, rot(8)], [c.rollEnd, rot(4)],
      [c.shake1, rot(-9)], [c.shake2, rot(5)], [c.shake3, rot(-7)], [c.leave, rot(-4)], [c.away, rot(8)], [c.home, rot(0)], [E, rot(0)],
    ]) +
    // His eyes: at the pile, then up and over in a roll, then a bored look away.
    `.${K.pileVisit} .${K.gaze}{${run('pg')}}` +
    track('pg', [
      [0, gzRest], [c.nearly, gz(4, 0)], [c.look, gz(5, 3)],
      ...rollArc(c.rollStart),
      [c.lids, gz(-4, 1)], [c.leave, gz(-4, 1)], [c.away, gz(-5, 0)], [c.home, gzRest], [E, gzRest],
    ]) +
    // The lids drop halfway: unimpressed.
    `.${K.pileVisit} .${K.topL}{${run('ptl')}}.${K.pileVisit} .${K.topR}{${run('ptr')}}` +
    lid('ptl', [`.${K.top}`, `.${K.topL}`]) +
    lid('ptr', [`.${K.top}`, `.${K.topR}`]) +
    // Less motion: no roll there and back, no head shake; he does the eye roll
    // and the lids where he is (his new home).
    calm(`.${K.carry},.${K.visitWheel},.${K.pileVisit} .${K.lean}{animation:none!important}`)
  )
}

const pileCssFor = (d: DrawCtx) => {
  const v = d.options.pile?.visit
  if (!v) return ''
  const plan = pilePlan(d.W, v.from, v.n)
  return v.elapsed < plan.end ? pileCss(plan, Math.max(0, v.elapsed), d.mood) : ''
}

export const papers: Feature = {
  name: 'papers',
  rootClass: (d) => (pileCssFor(d) ? K.pileVisit : ''),
  // Only with a pile, so a drawing without one stays as it was.
  css: (d) =>
    !d.options.pile?.count
      ? ''
      : `.${K.pile}{pointer-events:none}` +
    `.${K.pileTop}{transform-origin:-11px 0;animation:plf 6s ease-in-out infinite}` +
    `@keyframes plf{0%,78%,100%{transform:none}84%{transform:rotate(-7deg)}90%{transform:rotate(-2deg)}}`,
  drawingCss: pileCssFor,
  slots: { scene: pile },
}
