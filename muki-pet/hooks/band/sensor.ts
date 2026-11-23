// Tells the hooks when your mouse is over the band (MPI-9, 2026-11-22). The
// robot's own frame has no script and reports nothing, but the band Box can
// restyle on hover: render.tsx draws this region full width, and the hover
// squeezes it to 0 wide. The surface hands it every resize, so 0 columns
// after having been wide means "the mouse is over the band"; it posts each
// change to the `ui.message` hook. Runs on the drawing thread, without `$`.
//
// What it has seen lives in the module, not in `surface.setState`: a setState
// on three renders in a row with no pointer, key or props between counts as a
// render loop and unmounts the instance. Every resize here is a render, so the
// sensor died after its first visit (wake, over, left) and your pets and
// cookies stopped reaching his attention clock (MPI-18, 2026-11-23).

import type { ClientModule } from 'claude-code'

const seen = { wide: false, over: false }

const Sensor: ClientModule<null> = (_props, surface) => {
  const columns = surface.columns
  // Before its first layout the region is 0 wide too: that isn't a hover.
  seen.wide ||= columns > 0
  const over = seen.wide && columns === 0
  if (over !== seen.over) {
    seen.over = over
    surface.post({ over })
  }
  return surface.elements.Box({})
}

export default Sensor
