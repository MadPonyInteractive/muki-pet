// The drawing's features, in drawing order. To add one: write a file here with
// a `Feature` (see ../feature.ts) and add it to the list. The order is the
// order of markup within each place (`slots`), of the root classes and of the
// CSS: heat comes before visit so the root reads `h2 vi p-lens`, cookies after
// the others so their rules and the rainbow come after theirs, and toys last:
// their play wins over everything while a toy is out.

import type { Feature } from '../feature.ts'
import { celebrate } from './celebrate.ts'
import { cookies } from './cookies/index.ts'
import { headsetFeature } from './headset.ts'
import { heat } from './heat.ts'
import { mad } from './mad.ts'
import { papers } from './papers.ts'
import { sleep } from './sleep.ts'
import { tantrum } from './tantrum.ts'
import { touch } from './touch.ts'
import { toys } from './toys.ts'
import { visit } from './visit.ts'

export const FEATURES: readonly Feature[] = [touch, sleep, tantrum, mad, heat, headsetFeature, celebrate, visit, papers, cookies, toys]
