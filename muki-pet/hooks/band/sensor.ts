// Tells the hooks when your mouse is over the band (MPI-9, 2026-11-22). The
// robot's own frame has no script and reports nothing, but the band Box can
// restyle on hover: render.tsx draws this region full width, and the hover
// squeezes it to 0 wide. The surface hands it every resize, so 0 columns
// after having been wide means "the mouse is over the band"; it posts each
// change to the `ui.message` hook. Runs on the drawing thread, without `$`.

import type { ClientModule } from 'claude-code'

type Seen = { wide: boolean; over: boolean }

const Sensor: ClientModule<null, Seen> = (_props, surface) => {
  const seen = surface.state ?? { wide: false, over: false }
  const columns = surface.columns
  // Before its first layout the region is 0 wide too: that isn't a hover.
  const wide = seen.wide || columns > 0
  const over = wide && columns === 0
  if (wide !== seen.wide || over !== seen.over) {
    surface.setState({ wide, over })
    if (over !== seen.over) surface.post({ over })
  }
  return surface.elements.Box({})
}

export default Sensor
