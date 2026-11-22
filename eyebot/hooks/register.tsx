import type { Register } from 'claude-code'

import { BAND_HEIGHT, robotSvg, visitPlan, type Mood, type Prop } from './robot.ts'

// Desktop cells are roughly this many CSS pixels wide; the band is sized in cells.
const CELL_PX = 8

const SECOND = 1000
const MINUTE = 60 * SECOND

// How long a passing feeling lasts before he goes back to what he was doing.
const FLASH_MS: Partial<Record<Mood, number>> = { alert: 2500, happy: 6000, sad: 5000 }
const SLEEPY_AFTER = 5 * MINUTE
const ASLEEP_AFTER = 15 * MINUTE
// How long the old drawing stays on top while a new one loads under it. The
// load is slower while the app is busy (a message being sent), so keep it long.
const SWAP_MS = 900
// The alt is part of what Desktop compares to keep a frame, so it never changes.
const ALT = 'Eyebot, a small robot on two wheels'

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
const propFor = (tool: string): Prop | undefined =>
  PROP_FOR[tool] ?? (/browser|navigate|fetch/i.test(tool) ? 'globe' : undefined)
// At most one prop this often, so the band stays calm and swaps stay rare.
const PROP_GAP = 12 * SECOND

// How hot he runs from how full the context window is: cool under 15%, warm
// from 15, red and sweating from 25, suffering from 35% (Fabio, 2026-11-22: at
// 40% he should really be suffering).
const heatOf = (percent: number) => (percent >= 35 ? 3 : percent >= 25 ? 2 : percent >= 15 ? 1 : 0)
const HEAT_KEY = 'context'

type Timer = { cancel: () => void }
// The parts of `$` the mood code uses.
type Host = {
  clock: { now: () => Promise<number>; after: (ms: number, fn: () => void) => Timer }
  ui: { invalidate: (event: 'ui.render') => void }
  store: { get: (key: string) => Promise<unknown>; set: (key: string, value: unknown) => Promise<unknown> }
}

// What he feels: a lasting mood (neutral, focused, sleepy, asleep), a passing
// one on top (alert, happy, sad), and curious while a question waits for you.
const feel = {
  base: 'neutral' as Mood,
  flash: undefined as Mood | undefined,
  asking: false,
  flashTimer: undefined as Timer | undefined,
  idleTimers: [] as Timer[],
}
const current = (): Mood => (feel.asking ? 'curious' : (feel.flash ?? feel.base))

// What the band should show. Every drawing starts him resting at his home
// spot (`home`, a share of the band), so a new drawing never has to guess how
// far he got in the old one. (Drawings can't share a clock: each starts its own
// when it loads, which may be much later than the hook thinks.)
const shown = { mood: 'neutral' as Mood, heat: 0, heatRead: false, home: 0.5, homeRead: false }
// Home is saved, so a reload of the mod (which forgets everything) doesn't
// draw him back in the middle while the old drawing still has him elsewhere.
const HOME_KEY = 'home'
// The prop he is visiting. Its end spot is his new home. Mood and heat changes
// wait until it is over, so a visit is never cut short.
let visit: { prop: Prop; from: number; n: number; start: number; end: number } | undefined
let visits = 0
let lastVisit = -Infinity
let pending: Timer | undefined

async function redraw($: Host) {
  const now = await $.clock.now()
  if (visit && now < visit.end) {
    pending ??= $.clock.after(visit.end - now + 300, () => {
      pending = undefined
      // A passing mood (happy, sad) that waited gets its full time from now.
      if (feel.flash) flash($, feel.flash)
      $.ui.invalidate('ui.render')
    })
    return
  }
  $.ui.invalidate('ui.render')
}

async function startVisit($: Host, prop: Prop) {
  const now = await $.clock.now()
  if (shown.mood === 'asleep' || !cached.width || now - lastVisit < PROP_GAP || (visit && now < visit.end)) return
  const n = ++visits
  const plan = visitPlan(cached.width, shown.home, n)
  visit = { prop, from: shown.home, n, start: now, end: now + plan.end * SECOND }
  shown.home = plan.toU
  void Promise.resolve()
    .then(() => $.store.set(HOME_KEY, shown.home))
    .catch(() => {})
  lastVisit = now
  $.ui.invalidate('ui.render')
}

async function show($: Host) {
  const mood = current()
  if (mood === shown.mood) return
  shown.mood = mood
  await redraw($)
}

async function setHeat($: Host, heat: number) {
  shown.heatRead = true
  if (heat === shown.heat) return
  shown.heat = heat
  await redraw($)
}

function flash($: Host, mood: Mood) {
  feel.flashTimer?.cancel()
  feel.flash = mood
  feel.flashTimer = $.clock.after(FLASH_MS[mood] ?? 4 * SECOND, () => {
    feel.flash = undefined
    void show($).catch(() => {})
  })
}

function stopIdle() {
  for (const t of feel.idleTimers) t.cancel()
  feel.idleTimers = []
}

function startIdle($: Host) {
  stopIdle()
  const doze = (mood: Mood) => () => {
    feel.base = mood
    void show($).catch(() => {})
  }
  feel.idleTimers = [$.clock.after(SLEEPY_AFTER, doze('sleepy')), $.clock.after(ASLEEP_AFTER, doze('asleep'))]
}

// The drawing for one width, mood, heat and home is built once, so redraws
// hand back the very same string and the surface has no reason to restart it.
// It keeps the mood it was drawn with, for the face slide into the next one.
let cached = { key: '', width: 0, mood: 'neutral' as Mood, visit: undefined as number | undefined, source: '' }

async function sourceFor($: Host, width: number): Promise<string> {
  let now = 0
  try {
    now = await $.clock.now()
  } catch {}
  const active = visit && now < visit.end ? visit : undefined
  // Mid-visit, only a new width makes a new drawing; the rest waits.
  if (active && cached.visit === active.start && cached.width === width) return cached.source
  const key = `${width}|${shown.mood}|${shown.heat}|${shown.home}`
  if (cached.key !== key) {
    const v = active && { prop: active.prop, from: active.from, n: active.n, elapsed: (now - active.start) / SECOND }
    cached = {
      key,
      width,
      mood: shown.mood,
      visit: active?.start,
      source: robotSvg(width, { mood: shown.mood, from: cached.mood, heat: shown.heat, home: shown.home, visit: v }),
    }
  }
  return cached.source
}

// Double buffer. Desktop keeps a frame only while its Svg is identical, and a
// new frame is blank until it loads. So the band has two slots: the new
// drawing goes in the free one, in the flow, while the old one stays on top
// (absolute) for SWAP_MS, then goes. Each frame stays in its own slot for its
// whole life, so the morph always finds it in the same place.
const frames = {
  slots: [undefined, undefined] as Array<string | undefined>,
  active: 0,
  timer: undefined as Timer | undefined,
}

// TEMPORARY redraw log (2026-11-22, ghost hunt): every swap and every drop of
// the old drawing, per chat, so we can see whether the old one really goes.
// Remove once the ghost is understood.
const DEBUG_LOG = 'C:/Users/Fabio/AppData/Local/Temp/claude/eyebot-debug.log'
const chatId = Math.random().toString(36).slice(2, 6)
const logLines: string[] = []
const tag = (s?: string) => (s ? `${s.length}:${s.slice(-6) === '</svg>' ? /class="([^"]+)"/.exec(s)?.[1] : '?'}` : '-')
function log($: any, what: string) {
  try {
    const line = `${new Date().toISOString().slice(11, 23)} ${chatId} ${what} | active=${frames.active} s0=${tag(frames.slots[0])} s1=${tag(frames.slots[1])} timer=${frames.timer ? 'on' : 'off'} mood=${shown.mood} heat=${shown.heat} home=${shown.home.toFixed(3)}`
    logLines.push(line)
    if (logLines.length > 400) logLines.splice(0, logLines.length - 400)
    void Promise.resolve()
      .then(() => $.fs.write(DEBUG_LOG + '.' + chatId, logLines.join(String.fromCharCode(10)) + String.fromCharCode(10)))
      .catch(() => {})
  } catch {}
}

function dropOldAfter($: Host) {
  frames.timer?.cancel()
  frames.timer = $.clock.after(SWAP_MS, () => {
    frames.timer = undefined
    frames.slots[1 - frames.active] = undefined
    log($, 'drop old')
    $.ui.invalidate('ui.render')
  })
}

function swapIn($: Host, source: string): boolean {
  if (frames.slots[frames.active] === source) return false
  const top = 1 - frames.active
  if (frames.timer && frames.slots[top] === source) {
    // Back to the drawing still on top (a mood that lasted a blink, like
    // curious for an auto-approved tool): it takes over, the one loading goes.
    frames.timer.cancel()
    frames.timer = undefined
    frames.slots[frames.active] = undefined
    frames.active = top
    return true
  }
  if (frames.timer) {
    // A swap is still running: the old drawing stays on top and only the one
    // loading under it is replaced. Flipping now would blank the frame on top.
    frames.slots[frames.active] = source
    dropOldAfter($)
    return true
  }
  if (frames.slots[frames.active] !== undefined) {
    frames.active = top
    dropOldAfter($)
  }
  frames.slots[frames.active] = source
  return true
}

export const register: Register = on => {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // The terminal has no Svg (a Raster version is a later milestone).
    if (e.surface === 'terminal' || e.props.hasSurvey) return next(e)

    // The band is shared: what other mods draw here (the context bar) goes under him.
    const below = await next(e)
    const { Box, Svg } = $.ui.resolve(e)
    const width = Math.max(240, e.props.bodyColumns * CELL_PX)

    // Heat on every redraw, as the context bar does: the live figure, or the
    // last one saved (a fresh reload has none until the next response).
    try {
      let percent = (await $.session.usage()).context.percent
      if (percent !== undefined) {
        void Promise.resolve().then(() => $.store.set(HEAT_KEY, percent)).catch(() => {})
      } else if (!shown.heatRead) {
        const saved = await $.store.get(HEAT_KEY)
        if (typeof saved === 'number') percent = saved
      }
      shown.heatRead = true
      if (percent !== undefined) shown.heat = heatOf(percent)
    } catch {
      // No usage figures (the test engine): he stays as he is.
    }

    if (!shown.homeRead) {
      shown.homeRead = true
      try {
        const home = await $.store.get(HOME_KEY)
        if (typeof home === 'number' && home >= 0 && home <= 1) shown.home = home
      } catch {}
    }

    const source = await sourceFor($, width)
    if (swapIn($, source)) log($, `swap width=${width} cols=${e.props.bodyColumns} working=${e.props.isWorking}`)
    const slot = (i: number) => {
      const source = frames.slots[i]
      const svg = source && <Svg source={source} alt={ALT} width={width} height={BAND_HEIGHT} isInteractive />
      return i === frames.active ? (
        <Box flexDirection="column">{svg}</Box>
      ) : (
        <Box flexDirection="column" position="absolute" top={0} left={0} right={0}>
          {svg}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="column">
          {slot(0)}
          {slot(1)}
        </Box>
        {below}
      </Box>
    )
  })

  // Heat: the context window filling up warms him.
  on('session.measure', async ($, e, next) => {
    try {
      if (e.context.percent !== undefined) await setHeat($, heatOf(e.context.percent))
    } catch {}
    return next(e)
  })

  // Moods. Each hook passes the event on untouched; a failure in the mood code
  // never gets in Claude Code's way.

  // You sent a message: wide awake, then focused while Claude works.
  on('turn.start', async ($, e, next) => {
    if (!e.agentId) {
      try {
        stopIdle()
        feel.base = 'focused'
        feel.asking = false
        flash($, 'alert')
        await show($)
      } catch {}
    }
    return next(e)
  })

  // A tool needs your OK: curious, looking down at the prompt, until it's answered.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    try {
      if (verdict.decision === 'ask' && e.tool_use_id && e.approver === 'person') {
        feel.asking = true
        await show($)
      }
    } catch {}
    return verdict
  })

  // A tool failed or was refused: sad for a moment. A tool Claude starts may
  // drop a prop on the band for him to go and look at.
  on('tool.call', async ($, e, next) => {
    try {
      const prop = !e.agentId && propFor(e.tool)
      if (prop) await startVisit($, prop)
    } catch {}
    const result = await next(e)
    try {
      feel.asking = false
      if ('deny' in result || (result as { isError?: boolean }).isError) flash($, 'sad')
      await show($)
    } catch {}
    return result
  })

  // Claude finished: happy for an answer, sad for an error, then rest, and
  // after a long quiet spell sleepy, then asleep.
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (!e.agentId) {
      try {
        feel.base = 'neutral'
        feel.asking = false
        if (e.reason === 'answer') flash($, 'happy')
        else if (e.reason === 'error' || e.reason === 'refusal') flash($, 'sad')
        else {
          feel.flashTimer?.cancel()
          feel.flash = undefined
        }
        startIdle($)
        await show($)
      } catch {}
    }
    return result
  })
}
