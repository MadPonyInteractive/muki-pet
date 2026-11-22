// Builds the robot as one self-animating SVG document. Pure: the same options
// always give the same string.
//
// It puts the body parts (parts/) and the features (features/) together:
// each feature adds root classes, CSS and markup at named places (feature.ts),
// and this file only loops over the list. The motion (rolling, wheel spin, head
// lag, where the eyes look) is simulated once (wander.ts), sampled, and written
// out as CSS keyframes (keyframes.ts), so the surface plays it smoothly with no
// redraws. Mouse reactions are CSS :hover on invisible strips that travel with
// the robot (the desktop draws the SVG in a script-less frame).

import { BAND_HEIGHT, bandX, visitPlan } from '../character/geometry.ts'
import { moodDef } from '../character/moods.ts'
import { K, moodClass } from './classes.ts'
import type { DrawCtx, RobotOptions, SlotName } from './feature.ts'
import { FEATURES } from './features/index.ts'
import { routeAround } from './keyframes.ts'
import { moodCss } from './moods.ts'
import { bodyCss } from './parts/body-css.ts'
import { robotMarkup } from './parts/body.ts'
import { faceCss } from './parts/face.ts'

export function robotSvg(width: number, options: RobotOptions = {}): string {
  const W = Math.round(width)
  const ground = BAND_HEIGHT - 4
  const mood = options.mood ?? 'neutral'
  const plan = options.visit && visitPlan(W, options.visit.from, options.visit.n)
  // A visit that is over is drawn as the plain drawing at its end spot.
  const visit = plan && options.visit && options.visit.elapsed < plan.end ? { plan, ...options.visit } : undefined
  const d: DrawCtx = { W, ground, H: BAND_HEIGHT, options, mood, visit }
  const route = routeAround(W, plan ? plan.toX : Math.round(bandX(W, options.home ?? 0.5)), !moodDef(mood).still)

  const each = (pick: (f: (typeof FEATURES)[number]) => string | undefined) => FEATURES.map(pick).join('')
  const slot = (name: SlotName) => each((f) => f.slots?.[name]?.(d))
  const slots: Record<SlotName, string> = {
    head: slot('head'),
    overHead: slot('overHead'),
    ground: slot('ground'),
    zones: slot('zones'),
    behind: slot('behind'),
    front: slot('front'),
    props: slot('props'),
  }
  const roots = [moodClass(mood), ...FEATURES.map((f) => f.rootClass?.(d)).filter(Boolean)].join(' ')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${BAND_HEIGHT}" width="${W}" height="${BAND_HEIGHT}" class="${roots}">` +
    `<style>` +
    bodyCss() +
    faceCss() +
    each((f) => f.css?.(d)) +
    `.${K.loop}{animation-duration:${route.loop}s}` +
    route.kf +
    moodCss(mood, options.from) +
    each((f) => f.drawingCss?.(d)) +
    `</style>` +
    robotMarkup(
      W,
      ground,
      each((f) => f.defs),
      slots,
    )
  )
}
