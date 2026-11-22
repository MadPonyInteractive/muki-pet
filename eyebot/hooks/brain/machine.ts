// His behaviour as one state machine. Pure: `step(state, event, now)` gives the
// next state and a list of effects (timers to start or cancel, a redraw, saving
// his home); runtime.ts carries the effects out. Every rule about what he
// feels, when a prop visit runs and when the band redraws lives here, so a new
// behaviour is a new event or a new case, not a new variable somewhere else.

import { visitPlan } from '../character/geometry.ts'
import { passingMs, type Mood, type PassingMood } from '../character/moods.ts'
import type { Prop } from '../character/props.ts'
import { AFTER_VISIT_MS, ASLEEP_AFTER, NEAR_GRACE_MS, PROP_GAP, SECOND, SLEEPY_AFTER } from '../character/tuning.ts'

export type TimerName = 'flash' | 'sleepy' | 'asleep' | 'visitEnd' | 'nearEnd'

// A prop visit. Its end spot is his new home.
export type Visit = { prop: Prop; from: number; n: number; start: number; end: number }

export type State = {
  // What he feels: a lasting mood (neutral, focused, sleepy, asleep), a passing
  // one on top (alert, happy, sad), and curious while a question waits for you.
  base: Mood
  flash?: PassingMood
  asking: boolean
  // What the band shows. Every drawing starts him resting at his home spot
  // (`home`, a share of the band), so a new drawing never has to guess how far
  // he got in the old one: drawings can't share a clock, each starts its own
  // when it loads, which may be much later than the hook thinks.
  mood: Mood
  heat: number
  home: number
  // Whether heat and home were read yet (from usage or the store).
  heatKnown: boolean
  homeKnown: boolean
  // The band's width in px, 0 until it is first drawn. A visit needs it.
  width: number
  visit?: Visit
  visits: number
  lastVisit: number
  // Your mouse is over the band, or left it less than NEAR_GRACE_MS ago: the
  // band keeps its drawing (no redraws, no new props) so he isn't sent home
  // mid-game.
  near: boolean
  nearGrace: boolean
  // A mood or heat change came during a visit (or while you were near) and
  // waits for its end.
  deferred: boolean
  // The visit-end timer is running.
  visitEndSet: boolean
}

export type Event =
  // From Claude Code.
  | { type: 'turnStart' }
  | { type: 'turnComplete'; reason: string }
  | { type: 'toolAsk' }
  | { type: 'toolStart'; prop: Prop }
  | { type: 'toolDone'; failed: boolean }
  | { type: 'heat'; level: number }
  // Your mouse came over the band (true) or left it (false).
  | { type: 'near'; on: boolean }
  // A timer this machine started.
  | { type: 'timer'; name: TimerName }
  // Seen while drawing the band: change the state, never cause a redraw.
  | { type: 'band'; width: number }
  | { type: 'heatSeen'; level?: number }
  | { type: 'homeSeen'; home?: number }

export type Effect =
  // Starts a timer, replacing a running one of the same name.
  | { type: 'startTimer'; name: TimerName; ms: number }
  | { type: 'cancelTimer'; name: TimerName }
  | { type: 'redraw' }
  | { type: 'saveHome'; home: number }

export const initialState = (): State => ({
  base: 'neutral',
  asking: false,
  mood: 'neutral',
  heat: 0,
  home: 0.5,
  heatKnown: false,
  homeKnown: false,
  width: 0,
  visits: 0,
  lastVisit: -Infinity,
  near: false,
  nearGrace: false,
  deferred: false,
  visitEndSet: false,
})

// The mood that wins: curious while asking, else the passing one, else the lasting one.
export const feeling = (s: State): Mood => (s.asking ? 'curious' : (s.flash ?? s.base))

export const activeVisit = (s: State, now: number) => (s.visit && now < s.visit.end ? s.visit : undefined)

// The band keeps the drawing it shows while you're with him.
export const nearHold = (s: State) => s.near || s.nearGrace

export function step(state: State, event: Event, now: number): { state: State; effects: Effect[] } {
  const s: State = { ...state }
  const fx: Effect[] = []

  const flash = (mood: PassingMood) => {
    s.flash = mood
    fx.push({ type: 'startTimer', name: 'flash', ms: passingMs(mood) })
  }
  // Redraws once the visit is over. Always, even with nothing waiting: the
  // visit drawing gives way to a plain one at his new home, so the band's last
  // drawing is never a visit. (Desktop draws a chat's last drawing again, from
  // its start, when the chat is opened, and a visit would replay: the ghost of
  // 2026-11-22.)
  const afterVisit = (ms: number) => {
    if (s.visitEndSet) return
    s.visitEndSet = true
    fx.push({ type: 'startTimer', name: 'visitEnd', ms })
  }
  // A visit is never cut short: a redraw during one waits for its end. Nor is
  // your play with him: a redraw then waits until you've gone.
  const redraw = () => {
    if (nearHold(s)) {
      s.deferred = true
      return
    }
    const v = activeVisit(s, now)
    if (v) {
      s.deferred = true
      afterVisit(v.end - now + AFTER_VISIT_MS)
      return
    }
    fx.push({ type: 'redraw' })
  }
  const show = () => {
    const mood = feeling(s)
    if (mood === s.mood) return
    s.mood = mood
    redraw()
  }
  const startVisit = (prop: Prop) => {
    if (s.mood === 'asleep' || nearHold(s) || !s.width || now - s.lastVisit < PROP_GAP || activeVisit(s, now)) return
    const n = ++s.visits
    const plan = visitPlan(s.width, s.home, n)
    s.visit = { prop, from: s.home, n, start: now, end: now + plan.end * SECOND }
    s.home = plan.toU
    s.lastVisit = now
    fx.push({ type: 'saveHome', home: s.home })
    afterVisit(plan.end * SECOND + AFTER_VISIT_MS)
    fx.push({ type: 'redraw' })
  }

  switch (event.type) {
    // You sent a message: wide awake, then focused while Claude works.
    case 'turnStart':
      fx.push({ type: 'cancelTimer', name: 'sleepy' }, { type: 'cancelTimer', name: 'asleep' })
      s.base = 'focused'
      s.asking = false
      flash('alert')
      show()
      break
    // Claude finished: happy for an answer, sad for an error, then rest, and
    // after a long quiet spell sleepy, then asleep.
    case 'turnComplete':
      s.base = 'neutral'
      s.asking = false
      if (event.reason === 'answer') flash('happy')
      else if (event.reason === 'error' || event.reason === 'refusal') flash('sad')
      else {
        fx.push({ type: 'cancelTimer', name: 'flash' })
        s.flash = undefined
      }
      fx.push({ type: 'startTimer', name: 'sleepy', ms: SLEEPY_AFTER }, { type: 'startTimer', name: 'asleep', ms: ASLEEP_AFTER })
      show()
      break
    // A tool needs your OK: curious until it's answered.
    case 'toolAsk':
      s.asking = true
      show()
      break
    // A tool Claude starts may drop a prop for him to go and look at.
    case 'toolStart':
      startVisit(event.prop)
      break
    // A tool finished: sad for a moment if it failed or was refused.
    case 'toolDone':
      s.asking = false
      if (event.failed) flash('sad')
      show()
      break
    // Your mouse over the band holds every redraw; once it has left (and the
    // grace is over), what waited is drawn.
    case 'near':
      if (event.on) {
        s.near = true
        s.nearGrace = false
        fx.push({ type: 'cancelTimer', name: 'nearEnd' })
      } else if (s.near) {
        s.near = false
        s.nearGrace = true
        fx.push({ type: 'startTimer', name: 'nearEnd', ms: NEAR_GRACE_MS })
      }
      break
    case 'heat':
      s.heatKnown = true
      if (event.level !== s.heat) {
        s.heat = event.level
        redraw()
      }
      break
    case 'timer':
      if (event.name === 'flash') {
        s.flash = undefined
        show()
      } else if (event.name === 'sleepy' || event.name === 'asleep') {
        s.base = event.name
        show()
      } else if (event.name === 'nearEnd') {
        s.nearGrace = false
        if (s.deferred) {
          // A passing mood (happy, sad) that waited gets its full time from now.
          if (s.flash) flash(s.flash)
          s.deferred = false
          redraw()
        }
      } else {
        s.visitEndSet = false
        // You're still with him: the plain drawing waits for you to go.
        if (nearHold(s)) {
          s.deferred = true
          break
        }
        // A passing mood (happy, sad) that waited gets its full time from now.
        if (s.deferred && s.flash) flash(s.flash)
        s.deferred = false
        fx.push({ type: 'redraw' })
      }
      break
    case 'band':
      s.width = event.width
      break
    case 'heatSeen':
      s.heatKnown = true
      if (event.level !== undefined) s.heat = event.level
      break
    case 'homeSeen':
      s.homeKnown = true
      if (event.home !== undefined) s.home = event.home
      break
  }
  return { state: s, effects: fx }
}
