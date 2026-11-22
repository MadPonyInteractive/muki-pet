// Double buffer. Desktop keeps a frame only while its Svg is identical, and a
// new frame is blank until it loads. So the band has two slots: the new
// drawing goes in the free one, in the flow, while the old one stays on top
// (absolute) for SWAP_MS, then goes. Each frame stays in its own slot for its
// whole life, so the morph always finds it in the same place.
//
// Plain functions over module state: the mod loader only lets `$` be passed
// to functions declared at the top of the module's own files.

import { brainState } from '../brain/runtime.ts'
import { debugLog } from './debug-log.ts'

type Timer = { cancel: () => void }

// How long the old drawing stays on top while a new one loads under it. The
// load is slower while the app is busy (a message being sent), so keep it long.
const SWAP_MS = 900

const f = {
  slots: [undefined, undefined] as Array<string | undefined>,
  // The slot in the flow (the newest drawing); the other one is on top.
  active: 0,
  timer: undefined as Timer | undefined,
  width: 0,
}

// What the band shows: the two slots and which one is in the flow.
export function framesView() {
  return { slots: f.slots as ReadonlyArray<string | undefined>, active: f.active, swapping: f.timer !== undefined }
}

function dropOldAfter($: any) {
  f.timer?.cancel()
  f.timer = $.clock.after(SWAP_MS, () => {
    f.timer = undefined
    f.slots[1 - f.active] = undefined
    debugLog($, 'drop old', framesView(), brainState())
    $.ui.invalidate('ui.render')
  })
}

// Puts a drawing in the band. False when it is already the one shown.
export function swapIn($: any, source: string, width: number): boolean {
  if (f.slots[f.active] === source) return false
  if (width !== f.width) {
    // A new width: no old drawing stays on top. Opening a chat always goes
    // through a narrower width first (784, then 792 px), and Desktop has just
    // rebuilt the band, so the old drawing is no smoother than the new one: it
    // restarts too, at its own (maybe stale) spot, and showed two robots.
    f.timer?.cancel()
    f.timer = undefined
    f.slots = [source, undefined]
    f.active = 0
    f.width = width
    return true
  }
  const top = 1 - f.active
  if (f.timer && f.slots[top] === source) {
    // Back to the drawing still on top (a mood that lasted a blink, like
    // curious for an auto-approved tool): it takes over, the one loading goes.
    f.timer.cancel()
    f.timer = undefined
    f.slots[f.active] = undefined
    f.active = top
    return true
  }
  if (f.timer) {
    // A swap is still running: the old drawing stays on top and only the one
    // loading under it is replaced. Flipping now would blank the frame on top.
    f.slots[f.active] = source
    dropOldAfter($)
    return true
  }
  if (f.slots[f.active] !== undefined) {
    f.active = top
    dropOldAfter($)
  }
  f.slots[f.active] = source
  return true
}
