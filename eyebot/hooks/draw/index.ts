// Builds the robot as one self-animating SVG document. Pure: the same options
// always give the same string.
//
// The motion (rolling, wheel spin, head lag, where the eyes look) is simulated
// once (wander.ts), sampled, and written out as CSS keyframes (keyframes.ts), so
// the surface plays it smoothly with no redraws. Mouse reactions are CSS :hover
// on invisible strips that travel with the robot, so "left of him" / "right of
// him" is known without script (the desktop draws the SVG in a script-less
// frame). The same strips take clicks: a click focuses one, and :focus rules
// run the cookie game (cookies/).
//
// Where to change what:
//   ../character/   what he is, as data: moods, props, heat levels, colours,
//                   timings, band geometry. Start there.
//   moods.ts        mood faces as CSS            visit.ts     prop visits
//   wander.ts       how he wanders               heat.ts      heat as CSS
//   body.ts         his drawing (markup)         touch.ts     petting
//   body-css.ts     mouse, touch, blink, sleep   cookies/     the cookie game

import { BAND_HEIGHT, bandX, clamp, visitPlan } from '../character/geometry.ts'
import { MAX_HEAT } from '../character/heat.ts'
import { moodDef, type Mood } from '../character/moods.ts'
import { propShape, type Prop } from '../character/props.ts'
import { baseCss } from './body-css.ts'
import { robotMarkup } from './body.ts'
import { COOKIE_DEF } from './cookies/cookie.ts'
import { cookieGame } from './cookies/game.ts'
import { HEAT_CSS } from './heat.ts'
import { routeAround } from './keyframes.ts'
import { moodCss } from './moods.ts'
import { visitCss } from './visit.ts'

// Tools and tests reach the shared definitions through here too.
export { BAND_HEIGHT, visitPlan, type VisitPlan } from '../character/geometry.ts'
export { LAYERS } from './cookies/game.ts'
export { MOODS, type Mood } from '../character/moods.ts'
export { PROPS, type Prop } from '../character/props.ts'

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

// Everything that depends only on the width is built once per width; only the
// mood, heat, home and visit parts change between drawings.
let body: { width: number; css: string; before: string; after: string } | undefined

function bodyFor(W: number) {
  if (body?.width !== W) {
    const ground = BAND_HEIGHT - 4
    const game = cookieGame(W, ground, BAND_HEIGHT)
    body = {
      width: W,
      css: baseCss() + game.css + HEAT_CSS,
      ...robotMarkup(W, ground, { defs: COOKIE_DEF, strips: game.strips, cookies: game.cookies }),
    }
  }
  return body
}

export function robotSvg(width: number, options: RobotOptions = {}): string {
  const W = Math.round(width)
  const parts = bodyFor(W)
  const mood = options.mood ?? 'neutral'
  const heat = clamp(Math.round(options.heat ?? 0), 0, MAX_HEAT)
  const plan = options.visit && visitPlan(W, options.visit.from, options.visit.n)
  // A visit that is over is drawn as the plain drawing at its end spot.
  const visit = plan && options.visit && options.visit.elapsed < plan.end ? { plan, ...options.visit } : undefined
  const route = routeAround(W, plan ? plan.toX : Math.round(bandX(W, options.home ?? 0.5)), !moodDef(mood).still)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${BAND_HEIGHT}" width="${W}" height="${BAND_HEIGHT}" class="m-${mood} h${heat}${visit ? ` vi p-${visit.prop}` : ''}">` +
    `<style>${parts.css}` +
    `.s{animation-duration:${route.loop}s}` +
    route.kf +
    moodCss(mood, options.from) +
    (visit ? visitCss(visit.plan, Math.max(0, visit.elapsed), mood) : '') +
    `</style>` +
    parts.before +
    (visit ? `<g class="vp" transform="translate(${visit.plan.off},0)"><g class="vpa">${propShape(visit.prop)}</g></g>` : '') +
    parts.after
  )
}
