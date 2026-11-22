// The numbers and lists that tune how he behaves. Change behaviour here first.

import type { Mood, Prop } from '../draw/index.ts'

export const SECOND = 1000
export const MINUTE = 60 * SECOND

// How long a passing feeling lasts before he goes back to what he was doing.
export const FLASH_MS: Partial<Record<Mood, number>> = { alert: 2500, happy: 6000, sad: 5000 }
export const FLASH_DEFAULT_MS = 4 * SECOND

// A long quiet spell after a turn: sleepy, then asleep.
export const SLEEPY_AFTER = 5 * MINUTE
export const ASLEEP_AFTER = 15 * MINUTE

// What Claude is doing, as a prop he goes to look at. Tools not listed get none.
const PROP_FOR: Record<string, Prop> = {
  Read: 'file',
  Grep: 'lens',
  Glob: 'lens',
  ToolSearch: 'lens',
  Edit: 'pencil',
  Write: 'pencil',
  NotebookEdit: 'pencil',
  Bash: 'terminal',
  PowerShell: 'terminal',
  WebFetch: 'globe',
  WebSearch: 'globe',
}
export const propFor = (tool: string): Prop | undefined =>
  PROP_FOR[tool] ?? (/browser|navigate|fetch/i.test(tool) ? 'globe' : undefined)

// At most one prop this often, so the band stays calm and swaps stay rare.
export const PROP_GAP = 12 * SECOND
// A redraw waits this long past a visit's end, so the visit drawing is done.
export const AFTER_VISIT_MS = 300
// While your mouse is over the band (petting, cookies, he's watching you) the
// band doesn't redraw: a new drawing would put him back home mid-game. After
// the mouse leaves, it waits this long more, so a cookie he's still eating gets
// finished (Fabio, 2026-11-22).
export const NEAR_GRACE_MS = 3 * SECOND

// Keys in the mod's store: his home spot, and the last context percentage seen.
export const STORE_HOME = 'home'
export const STORE_HEAT = 'context'

// How hot he runs from how full the context window is: cool under 15%, warm
// from 15, red and sweating from 25, suffering from 35% (Fabio, 2026-11-22: at
// 40% he should really be suffering).
export const heatOf = (percent: number) => (percent >= 35 ? 3 : percent >= 25 ? 2 : percent >= 15 ? 1 : 0)
