// When things happen in the cookie game, in seconds after the dash to the
// cookie ends (the dash itself is `--t`, known only to the CSS). Eating,
// being sick and the cookie's own animation all read these, so "he chews a
// bit longer" is one edit here.

import { afterCue, afterDash } from '../../timeline.ts'

export const CUE = {
  eat: 0.15, // the first chew
  joy: 1.3, // "^ ^" and a blush
  hop: 1.4, // two happy hops
  ill: 1.5, // the 6th cookie turns his face green and his head back
  gag: 2.3,
  pour: 2.45, // the rainbow
  puddle: 2.9,
  dizzy: 4.4, // dizzy eyes and droopy lids
  stayEat: 3, // he rolls home after this
  staySick: 7.4,
} as const

export const EAT = afterDash(CUE.eat)
export const STAY_EAT = afterDash(CUE.stayEat)
export const STAY_SICK = afterDash(CUE.staySick)

// The three bites, and the crumbs that fall at each, after the first chew;
// then the last bit goes into his mouth.
export const BITE_AT = [0.05, 0.4, 0.75] as const
export const GULP_AT = 1.1
export const biteDelay = (i: number) => afterCue(EAT, BITE_AT[i]!)
export const gulpDelay = afterCue(EAT, GULP_AT)

// The strip lets go of the focus a while after he is back.
export const LET_GO = 5.5
export const LET_GO_SICK = 8.6
