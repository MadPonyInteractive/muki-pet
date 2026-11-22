// The cookie game as a feature: strips behind him, a cookie per layer in front
// of him, the rainbow and puddle when he is sick. The strips depend only on the
// band width, so they are built once per width.

import type { Feature } from '../../feature.ts'
import { COOKIE_DEF } from './cookie.ts'
import { cookieGame } from './game.ts'
import { puddle, rainbow } from './sick.ts'

export { LAYERS } from './game.ts'

let built: { key: string; game: ReturnType<typeof cookieGame> } | undefined

const gameFor = (W: number, ground: number, H: number) => {
  const key = `${W}|${ground}|${H}`
  if (built?.key !== key) built = { key, game: cookieGame(W, ground, H) }
  return built.game
}

export const cookies: Feature = {
  name: 'cookies',
  defs: COOKIE_DEF,
  css: (d) => gameFor(d.W, d.ground, d.H).css,
  slots: {
    behind: (d) => gameFor(d.W, d.ground, d.H).strips,
    front: (d) => gameFor(d.W, d.ground, d.H).cookies,
    head: rainbow,
    ground: puddle,
  },
}
