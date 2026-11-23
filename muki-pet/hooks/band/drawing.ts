// The robot drawing for the band, from the brain's state. The drawing for one
// width, mood, heat and home is built once, so redraws hand back the very same
// string and the surface has no reason to restart it. It keeps the mood it was
// drawn with, for the face slide into the next one.

import { activeVisit, drawingOptions, nearHold, type State } from '../brain/machine.ts'
import { robotSvg, type Mood } from '../draw/index.ts'
import { activePile } from '../brain/behaviours/papers.ts'

export function createDrawings() {
  let cached = { key: '', width: 0, mood: 'neutral' as Mood, visit: undefined as number | undefined, source: '' }

  return function drawingFor(s: State, width: number, now: number): string {
    // While you're with him, the drawing shown stays (the host redraws the
    // band for its own reasons too); only a new width changes it.
    if (nearHold(s) && cached.source && cached.width === width) return cached.source
    // A prop visit or a visit to the paper pile (never both at once).
    const active = activeVisit(s, now) ?? activePile(s.slices.papers, now)
    // Mid-visit, only a new width makes a new drawing; the rest waits.
    if (active && cached.visit === active.start && cached.width === width) return cached.source
    const { visit, pile, headset } = drawingOptions(s, now)
    const key = `${width}|${s.mood}|${s.heat}|${s.home}|${s.slices.papers.count}|${headset}`
    // A visit drawing that outlived its visit is rebuilt as the plain one.
    if (cached.key !== key || (cached.visit !== undefined && !active)) {
      cached = {
        key,
        width,
        mood: s.mood,
        visit: active?.start,
        source: robotSvg(width, { mood: s.mood, from: cached.mood, heat: s.heat, home: s.home, visit, pile, headset }),
      }
    }
    return cached.source
  }
}
