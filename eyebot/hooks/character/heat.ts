// How hot he runs from how full the context window is, one entry per level:
// from which percentage, the colours of his bezel, chassis, rims and tyres, how
// far his top lids droop (px), and how many sweat drops show (0, 1 or 2).
// Level 0 is his plain look (palette.ts). draw/features/heat.ts turns this into CSS.
// Cool under 15%, warm from 15, red and sweating from 25, suffering from 35%
// (Fabio, 2026-11-22: at 40% he should really be suffering).

type Cool = { from: 0 }
export type HotLevel = {
  from: number
  bezel: string
  chassis: string
  rim: string
  tyre: string
  droop: number
  sweat: 0 | 1 | 2
}

export const HEAT_LEVELS: readonly [Cool, ...HotLevel[]] = [
  { from: 0 },
  { from: 15, bezel: '#6e4a4d', chassis: '#6e4a4d', rim: '#86585c', tyre: '#2a1f22', droop: 1, sweat: 0 },
  { from: 25, bezel: '#9a4044', chassis: '#9a4044', rim: '#b04a4e', tyre: '#3a1c1f', droop: 2, sweat: 1 },
  { from: 35, bezel: '#c8383a', chassis: '#c8383a', rim: '#e0484a', tyre: '#4a1719', droop: 3.5, sweat: 2 },
]

export const MAX_HEAT = HEAT_LEVELS.length - 1

// The level for a context percentage: the hottest one it has reached.
export function heatOf(percent: number): number {
  let level = 0
  HEAT_LEVELS.forEach((l, i) => {
    if (percent >= l.from) level = i
  })
  return level
}
