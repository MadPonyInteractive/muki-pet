// What the band does, not how it is drawn: the mood and heat classes on the
// drawing's root, how many drawings are up, the shared band, swap timing, a
// visit's start and end, and the hover hold. The drawing's own details (the
// CSS, the markup) are `tools/golden.mjs` and `draw/classes.test.ts`.
//
// Class names come from `draw/classes.ts`, never typed here.

import type { EngineInterface, Hook } from 'claude-code'
import { expect, mock, test, type Mounted as TestMounted } from 'claude-code/testing'

import { K, heatLevel, moodClass, propClass } from './draw/classes.ts'
import { MOODS, PROPS, robotSvg, visitPlan, type Mood, type Prop } from './draw/index.ts'
import { STORE_HOME, createBrain, readHome } from './brain/runtime.ts'

const BAND = {
  plugin: 'muki-pet',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 90,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

const FRAME_LIMIT = 131072
const ALT = 'Muki, a small robot on two wheels'
const HEAT_LEVELS = [0, 1, 2, 3]

// Stands for the engine's own (empty) band beneath the plugins.
const emptyBand = ($: EngineInterface, e: Parameters<Hook<'ui.render'>>[1]) => {
  const { Box } = $.ui.resolve(e)
  return <Box />
}

// What the drawing's root says: its classes, and the mood, heat and prop in them.
const rootClasses = (source: unknown) => (/^<svg[^>]*\sclass="([^"]*)"/.exec(String(source))?.[1] ?? '').split(' ')
const moodOf = (source: unknown): Mood | undefined => MOODS.find(m => rootClasses(source).includes(moodClass(m)))
const heatOfDrawing = (source: unknown) => HEAT_LEVELS.find(n => rootClasses(source).includes(heatLevel(n)))
const propOf = (source: unknown): Prop | undefined => PROPS.find(p => rootClasses(source).includes(propClass(p)))
const isVisiting = (source: unknown) => rootClasses(source).includes(K.visiting)

type Mounted = TestMounted<'desktop', 'AbovePrompt'>
type Clock = ReturnType<typeof mock.clock>

// The drawing once the swap is over, when one is left.
async function settled(ui: Mounted, clock: Clock) {
  await clock.settle()
  await clock.advance(1000)
  const all = await ui.findAll({ type: 'Svg' })
  expect(all).toHaveLength(1)
  expect(all[0]!.props.alt).toBe(ALT) // the alt never changes
  return all[0]!.props.source
}

test('the robot draws as one interactive Svg in the desktop band', async ($, on) => {
  on('ui.render', emptyBand)
  mock.clock(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svg = await ui.find({ type: 'Svg' })

  expect(svg).toBeDefined()
  expect(svg?.props.isInteractive).toBe(true)
  expect(svg?.props.width).toBe(720)
  expect(String(svg?.props.source).startsWith('<svg')).toBe(true)
  expect(String(svg?.props.source).length).toBeLessThan(FRAME_LIMIT)
  expect(moodOf(svg?.props.source)).toBe('neutral')
  expect(heatOfDrawing(svg?.props.source)).toBe(0)
  expect(isVisiting(svg?.props.source)).toBe(false)
  expect(await ui.findAll({ type: 'Svg' })).toHaveLength(1)
  // The sensor takes no click from him.
  expect((await ui.find({ type: 'Client' }))?.props.height).toBe(0)
  await ui.unmount()
})

test('the same width hands back the same drawing, so redraws do not restart him', async ($, on) => {
  on('ui.render', emptyBand)
  mock.clock(on)
  const a = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const first = (await a.find({ type: 'Svg' }))?.props.source
  await a.unmount()
  const b = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await b.find({ type: 'Svg' }))?.props.source).toBe(first)
  await b.unmount()
})

test('he shares the band: what another mod draws stays, under him', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>context bar</Text>
  })
  mock.clock(on)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: /context bar/ }))?.text).toBe('context bar')
  await ui.unmount()
})

test('he steps aside for a survey and on the terminal', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  const survey = await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, hasSurvey: true } })
  expect(await survey.find({ type: 'Svg' })).toBeUndefined()
  await survey.unmount()

  const term = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await term.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  await term.unmount()
})

test('every mood draws, and the same mood hands back the same drawing', () => {
  for (const mood of MOODS) {
    const svg = robotSvg(720, { mood, from: 'neutral', home: 0.3 })
    expect(moodOf(svg)).toBe(mood)
    expect(heatOfDrawing(svg)).toBe(0)
    expect(svg.length).toBeLessThan(FRAME_LIMIT)
    expect(svg).toBe(robotSvg(720, { mood, from: 'neutral', home: 0.3 }))
  }
  // A new drawing slides from the last face: where he came from shows.
  expect(robotSvg(720, { mood: 'sad', from: 'happy', home: 0.3 })).not.toBe(robotSvg(720, { mood: 'sad', from: 'sad', home: 0.3 }))
})

test('the widest band, hot and in any mood, stays under the frame size limit', () => {
  for (const mood of MOODS) expect(robotSvg(3000, { mood, from: 'happy', home: 0.9, heat: 3 }).length).toBeLessThan(FRAME_LIMIT)
  for (const prop of PROPS) {
    expect(robotSvg(3000, { mood: 'focused', heat: 3, visit: { prop, from: 0.9, n: 2, elapsed: 2 } }).length).toBeLessThan(FRAME_LIMIT)
  }
  const hot = robotSvg(720, { heat: 3 })
  expect(moodOf(hot)).toBe('neutral')
  expect(heatOfDrawing(hot)).toBe(3)
})

test('moods follow the turn: alert, happy, back to calm, then sleepy and asleep', async ($, on) => {
  on('ui.render', emptyBand)
  const clock = mock.clock(on, { now: 1_000_000 })
  // Stand-ins for the engine beneath the plugins.
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const mood = async () => moodOf(await settled(ui, clock))
  expect(await mood()).toBe('neutral')

  // A mood change draws the new robot under the old one, which stays on top
  // for a moment and then goes.
  const before = (await ui.find({ type: 'Svg' }))?.props.source
  await $.turn.start({ text: 'hello', turnId: 't1' })
  await clock.settle()
  const both = await ui.findAll({ type: 'Svg' })
  expect(both).toHaveLength(2)
  expect(both.map(s => s.props.source)).toContain(before)
  expect(await mood()).toBe('alert')

  await clock.advance(2500)
  expect(await mood()).toBe('focused')

  await $.turn.complete({ turnId: 't1', answer: 'hi', durationMs: 3000, isAborted: false, reason: 'answer' })
  expect(await mood()).toBe('happy')

  await clock.advance(7000)
  expect(await mood()).toBe('neutral')

  await clock.advance(5 * 60_000)
  expect(await mood()).toBe('sleepy')

  await clock.advance(10 * 60_000)
  expect(await mood()).toBe('asleep')
  await ui.unmount()
})

test('a second change during a swap keeps the old drawing on top', async ($, on) => {
  on('ui.render', emptyBand)
  const clock = mock.clock(on, { now: 3_000_000 })
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await clock.advance(1000)
  const shown = (await ui.find({ type: 'Svg' }))?.props.source
  await $.turn.start({ text: 'again', turnId: 't2' })
  await clock.settle()
  await clock.advance(200)
  await $.turn.complete({ turnId: 't2', answer: 'ok', durationMs: 200, isAborted: false, reason: 'answer' })
  await clock.settle()
  const both = (await ui.findAll({ type: 'Svg' })).map(s => s.props.source)
  expect(both).toHaveLength(2)
  expect(both).toContain(shown)
  await clock.advance(1000)
  expect(await ui.findAll({ type: 'Svg' })).toHaveLength(1)
  await ui.unmount()
})

test('a filling context window warms him, one level at a time', async ($, on) => {
  on('ui.render', emptyBand)
  const clock = mock.clock(on, { now: 5_000_000 })
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const heat = async (percent: number) => {
    await $.session.measure({ context: { percent, window: 200000 }, rateLimits: [], changed: ['context'] })
    return heatOfDrawing(await settled(ui, clock))
  }
  expect(await heat(10)).toBe(0)
  expect(await heat(20)).toBe(1)
  expect(await heat(30)).toBe(2)
  expect(await heat(40)).toBe(3) // at 40% he really suffers
  expect(await heat(5)).toBe(0)
  await ui.unmount()
})

test('a prop lands inside the band, he ends beside it, and that spot is his new home', () => {
  for (const width of [240, 720, 1600]) {
    for (const from of [0, 0.3, 0.7, 1]) {
      for (const n of [1, 2, 3]) {
        const v = visitPlan(width, from, n)
        expect(v.toX + v.off).toBeGreaterThan(29)
        expect(v.toX + v.off).toBeLessThan(width - 29)
        expect(v.toX).toBe(Math.round(44 + v.toU * (width - 88)))
        expect(v.end).toBeGreaterThan(v.leave)
        // Once it's over, the drawing is the plain one at the new home.
        expect(robotSvg(width, { visit: { prop: 'file', from, n, elapsed: v.end + 1 } })).toBe(robotSvg(width, { home: v.toU }))
      }
    }
  }
  const visiting = robotSvg(720, { visit: { prop: 'lens', from: 0.2, n: 1, elapsed: 0 } })
  expect(isVisiting(visiting)).toBe(true)
  expect(propOf(visiting)).toBe('lens')
  expect(moodOf(visiting)).toBe('neutral')
})

test('Claude reading a file drops a prop he goes to look at, at most every 12 s', async ($, on) => {
  on('ui.render', emptyBand)
  const clock = mock.clock(on, { now: 9_000_000 })
  on('tool.call', () => ({ result: { content: 'ok' } }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await clock.advance(1000)
  const drawing = async () => settled(ui, clock)
  await $.tool.call({ tool: 'Read', tool_use_id: 'r1', file_path: 'a.txt' })
  expect(propOf(await drawing())).toBe('file')
  await clock.advance(1000)
  await $.tool.call({ tool: 'Bash', tool_use_id: 'b1', command: 'ls' })
  expect(propOf(await drawing())).toBe('file') // too soon for another one
  await clock.advance(12_000)
  await $.tool.call({ tool: 'Bash', tool_use_id: 'b2', command: 'ls' })
  expect(propOf(await drawing())).toBe('terminal')
  // A mood change waits for the visit to end, then shows.
  await $.turn.complete({ turnId: 'tp', answer: 'done', durationMs: 1, isAborted: false, reason: 'answer' })
  const during = await drawing()
  expect(propOf(during)).toBe('terminal')
  expect(moodOf(during)).not.toBe('happy')
  await clock.advance(8000)
  expect(moodOf(await drawing())).toBe('happy')
  await ui.unmount()
})

// Desktop draws a chat's last drawing again, from its start, when the chat is
// opened; a visit there would replay beside the robot at his new home.
test('once a visit is over, the band shows the plain drawing at his new home', async ($, on) => {
  on('ui.render', emptyBand)
  const clock = mock.clock(on, { now: 20_000_000 })
  on('tool.call', () => ({ result: { content: 'ok' } }))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await clock.advance(1000)
  await $.tool.call({ tool: 'Grep', tool_use_id: 'g1', pattern: 'x' })
  const during = await settled(ui, clock)
  expect(isVisiting(during)).toBe(true)
  expect(propOf(during)).toBe('lens')
  await clock.advance(10_000)
  const after = await settled(ui, clock)
  expect(isVisiting(after)).toBe(false)
  expect(propOf(after)).toBeUndefined()
  await ui.unmount()
})

// Opening a chat goes through a narrower band first (784, then 792 px), and
// Desktop rebuilds the band then anyway: an old drawing kept on top would only
// restart at its own spot beside the new one.
test('a new width replaces the drawing at once, with no old one on top', async ($, on) => {
  on('ui.render', emptyBand)
  const clock = mock.clock(on, { now: 30_000_000 })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, bodyColumns: 98 } })
  await clock.advance(1000)
  await ui.redraw({ ...BAND.props, bodyColumns: 99 })
  const all = await ui.findAll({ type: 'Svg' })
  expect(all).toHaveLength(1)
  expect(all[0]!.props.width).toBe(792)
  await ui.unmount()
})

test('while your mouse is over the band (the sensor squeezed to 0 wide) a turn does not redraw him; after you go it does', async ($, on) => {
  on('ui.render', emptyBand)
  const clock = mock.clock(on, { now: 40_000_000 })
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await clock.advance(1000)
  const shown = (await ui.find({ type: 'Svg' }))?.props.source

  await ui.resize({ columns: 90, rows: 0 })
  await ui.resize({ columns: 0, rows: 0 }) // the hover squeezes it: mouse over
  await clock.settle()
  await $.turn.start({ text: 'hi', turnId: 't-near' })
  await clock.settle()
  await clock.advance(1000)
  const held = (await ui.findAll({ type: 'Svg' })).map(s => s.props.source)
  expect(held).toEqual([shown])

  await ui.resize({ columns: 90, rows: 0 }) // the mouse left
  await clock.settle()
  await clock.advance(1000)
  expect((await ui.findAll({ type: 'Svg' })).map(s => s.props.source)).toEqual([shown])
  await clock.advance(2500) // past the grace: the waiting mood is drawn
  const after = (await ui.findAll({ type: 'Svg' })).map(s => s.props.source)
  expect(after).not.toContain(undefined)
  expect(after.some(s => s !== shown)).toBe(true)
  expect(after.some(s => moodOf(s) !== moodOf(shown))).toBe(true)
  await ui.unmount()
})

// Opening a chat fires two renders at once. One that didn't wait for his saved
// spot drew him in the middle, then the saved spot came in and both showed.
test('two renders at once both wait for his saved spot', async () => {
  // The test engine has no store: a small fake with a slow one.
  const saved: Record<string, unknown> = { [STORE_HOME]: 0.3 }
  const $ = {
    clock: { now: async () => 0, after: () => ({ cancel() {} }) },
    ui: { invalidate() {} },
    store: {
      get: async (k: string) => {
        for (let i = 0; i < 5; i++) await Promise.resolve()
        return saved[k]
      },
      set: async () => {},
    },
  } as unknown as EngineInterface
  const brain = createBrain()
  const first = readHome($, brain)
  await readHome($, brain)
  expect(brain.state.home).toBe(0.3)
  await first
})
