// Sizes, colours and timings every part of the drawing shares.

export const BAND_HEIGHT = 76

// Simulation frames per second for his wandering.
export const FPS = 30
export const WHEEL_R = 11
// The robot is drawn at this scale inside the band.
export const SCALE = 0.85
// How close to either end of the band he may roll.
export const EDGE = 44

export const COLORS = {
  bezel: '#3a444b',
  screen: '#0b1216',
  eye: '#5ee7f0',
  tyre: '#1c2328',
  rim: '#56626a',
  blush: '#ff7aa8',
  sweat: '#9fdcff',
  cookie: '#d39a5c',
  cookieEdge: '#9a6332',
  chip: '#4b2c17',
}

// A new drawing loads under the old one, which stays on top for 0.9 s (see
// band/frames.ts). He stays hidden in the new one until just before the old one
// goes, then fades in fast. Showing him early (it was .15s) put two robots in
// the band whenever the old drawing had him elsewhere, mid-cookie or out on a
// trip, as the hook cannot know (MPI-9, 2026-11-22). Tried .9s (no overlap at
// all): he blinked out on every redraw, which is every few seconds while Claude
// works (Fabio: "flickering a lot"), because the new frame also takes a moment
// to load. Back to .75s: the 0.15 s overlap hides the load, and while your mouse
// is over him (cookies, petting) the band doesn't redraw at all (`near`).
export const FADE_IN = '.75s'
// How he shows in a new drawing (the `rbin` keyframes are in body-css.ts).
export const RBIN = `rbin .15s ease-out ${FADE_IN} backwards`

// Easings for the cookie dash, the roll home, and the 1 s roll back after an
// early blur.
export const DASH = 'cubic-bezier(.6,0,.25,1)'
export const ROLL = 'cubic-bezier(.45,0,.55,1)'
export const BACK = '1s cubic-bezier(.45,0,.3,1)'
