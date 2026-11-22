// The drawing's features, in drawing order. To add one: write a file here with
// a `Feature` (see ../feature.ts) and add it to the list. The order is the
// order of markup within each place (`slots`), of the root classes and of the
// CSS: heat comes before visit so the root reads `h2 vi p-lens`, and cookies
// last so their rules and the rainbow come after the others.

import type { Feature } from '../feature.ts'
import { cookies } from './cookies/index.ts'
import { heat } from './heat.ts'
import { sleep } from './sleep.ts'
import { touch } from './touch.ts'
import { visit } from './visit.ts'

export const FEATURES: readonly Feature[] = [touch, sleep, heat, visit, cookies]
