// Draws the band above the prompt: the robot's Svg (in the double buffer's two
// slots), over whatever other mods drew there.

import { heatOf, STORE_HEAT, STORE_HOME } from '../brain/config.ts'
import { brainState, note } from '../brain/runtime.ts'
import { BAND_HEIGHT } from '../draw/index.ts'
import { debugLog } from './debug-log.ts'
import { createDrawings } from './drawing.ts'
import { framesView, swapIn } from './frames.ts'

// Desktop cells are roughly this many CSS pixels wide; the band is sized in cells.
const CELL_PX = 8
// The alt is part of what Desktop compares to keep a frame, so it never changes.
const ALT = 'Eyebot, a small robot on two wheels'

const drawingFor = createDrawings()

// Heat on every redraw, as the context bar does: the live figure, or the last
// one saved (a fresh reload has none until the next response).
async function readHeat($: any) {
  try {
    let percent = (await $.session.usage()).context.percent
    if (percent !== undefined) {
      void Promise.resolve()
        .then(() => $.store.set(STORE_HEAT, percent))
        .catch(() => {})
    } else if (!brainState().heatKnown) {
      const saved = await $.store.get(STORE_HEAT)
      if (typeof saved === 'number') percent = saved
    }
    note({ type: 'heatSeen', level: percent === undefined ? undefined : heatOf(percent) })
  } catch {
    // No usage figures (the test engine): he stays as he is.
  }
}

// His saved home, once per load of the mod.
async function readHome($: any) {
  if (brainState().homeKnown) return
  note({ type: 'homeSeen' })
  try {
    const home = await $.store.get(STORE_HOME)
    if (typeof home === 'number' && home >= 0 && home <= 1) note({ type: 'homeSeen', home })
  } catch {}
}

// The `ui.render` hook for the AbovePrompt band.
export async function renderBand($: any, e: any, next: (e: any) => any) {
  // The terminal has no Svg (a Raster version is a later milestone).
  if (e.surface === 'terminal' || e.props.hasSurvey) return next(e)

  // The band is shared: what other mods draw here (the context bar) goes under him.
  const below = await next(e)
  const { Box, Svg } = $.ui.resolve(e)
  const width = Math.max(240, e.props.bodyColumns * CELL_PX)

  await readHeat($)
  await readHome($)
  note({ type: 'band', width })
  let now = 0
  try {
    now = await $.clock.now()
  } catch {}
  const source = drawingFor(brainState(), width, now)
  if (swapIn($, source, width)) {
    debugLog($, `swap width=${width} cols=${e.props.bodyColumns} working=${e.props.isWorking}`, framesView(), brainState())
  }

  const frames = framesView()
  const slot = (i: number) => {
    const source = frames.slots[i]
    const svg = source && <Svg source={source} alt={ALT} width={width} height={BAND_HEIGHT} isInteractive />
    return i === frames.active ? (
      <Box flexDirection="column">{svg}</Box>
    ) : (
      <Box flexDirection="column" position="absolute" top={0} left={0} right={0}>
        {svg}
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        {slot(0)}
        {slot(1)}
      </Box>
      {below}
    </Box>
  )
}
