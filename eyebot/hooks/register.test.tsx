import type { EngineInterface, Hook } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { MOODS, PROPS, robotSvg, visitPlan } from './draw/index.ts'

const BAND = {
  plugin: 'eyebot',
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

// Stands for the engine's own (empty) band beneath the plugins.
const emptyBand = ($: EngineInterface, e: Parameters<Hook<'ui.render'>>[1]) => {
  const { Box } = $.ui.resolve(e)
  return <Box />
}

test('the robot draws as one interactive Svg in the desktop band', async ($, on) => {
  on('ui.render', emptyBand)
  mock.clock(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svg = await ui.find({ type: 'Svg' })

  expect(svg).toBeDefined()
  expect(svg?.props.isInteractive).toBe(true)
  expect(svg?.props.width).toBe(720)
  const source = String(svg?.props.source)
  expect(source.startsWith('<svg')).toBe(true)
  expect(source.length).toBeLessThan(131072)
  expect(source).toContain('@keyframes mv')
  expect(source).toContain('.bot:active') // press and pet reactions
  expect(source).toContain('tabindex="0"') // cookie strips take a click
  expect(source).toContain('.L1:focus~.bot,.L3:focus~.bot,.L5:focus~.bot{transform:translateX(var(--d))') // and he dashes there
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
    expect(svg).toContain(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 76" width="720" height="76" class="m-${mood} h0">`)
    expect(svg.length).toBeLessThan(131072)
    expect(svg).toBe(robotSvg(720, { mood, from: 'neutral', home: 0.3 }))
  }
  // A new drawing slides from the last face once the new frame shows him.
  const sad = robotSvg(720, { mood: 'sad', from: 'happy', home: 0.3 })
  expect(sad).toContain('.lid{animation:f4 .45s ease-out .75s backwards}@keyframes f4{from{transform:translateY(-7px)}}')
})

test('the widest band, hot and in any mood, stays under the frame size limit', () => {
  for (const mood of MOODS) expect(robotSvg(3000, { mood, from: 'happy', home: 0.9, heat: 3 }).length).toBeLessThan(131072)
  for (const prop of PROPS) {
    expect(robotSvg(3000, { mood: 'focused', heat: 3, visit: { prop, from: 0.9, n: 2, elapsed: 2 } }).length).toBeLessThan(131072)
  }
  expect(robotSvg(720, { heat: 3 })).toContain('class="m-neutral h3"')
})

test('every drawing starts him resting at home, and his loop ends back there', () => {
  for (const width of [240, 600, 1400]) {
    for (const home of [0, 0.3, 1]) {
      const mv = /@keyframes mv\{([^@]*)\}\}/.exec(robotSvg(width, { home }))?.[1] ?? ''
      const xs = [...mv.matchAll(/translateX\(([\d.]+)px\)/g)].map(m => Number(m[1]))
      const homeX = Math.round(44 + home * (width - 88))
      expect(xs[0]).toBe(homeX)
      expect(xs[xs.length - 1]).toBe(homeX)
      expect(Math.min(...xs)).toBeGreaterThan(43)
      expect(Math.max(...xs)).toBeLessThan(width - 43)
    }
  }
})

// Runs last: it leaves his mood state behind.
test('moods follow the turn: alert, happy, back to calm, then sleepy and asleep', async ($, on) => {
  on('ui.render', emptyBand)
  const clock = mock.clock(on, { now: 1_000_000 })
  // Stand-ins for the engine beneath the plugins.
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  // The mood is a class on the drawing's root; the alt never changes. Read
  // after the swap is over, when one drawing is left.
  const mood = async () => {
    await clock.advance(1000)
    const all = await ui.findAll({ type: 'Svg' })
    expect(all).toHaveLength(1)
    expect(all[0]!.props.alt).toBe('Eyebot, a small robot on two wheels')
    return /class="m-(\w+)/.exec(String(all[0]!.props.source))?.[1]
  }
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
  await clock.settle()
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

// Runs after the moods test: it also leaves state behind (sets heat back to cool).
test('a filling context window warms him, one level at a time', async ($, on) => {
  on('ui.render', emptyBand)
  const clock = mock.clock(on, { now: 5_000_000 })
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const heat = async (percent: number) => {
    await $.session.measure({ context: { percent, window: 200000 }, rateLimits: [], changed: ['context'] })
    await clock.settle()
    await clock.advance(1000)
    return /class="m-\w+ h(\d)"/.exec(String((await ui.find({ type: 'Svg' }))?.props.source))?.[1]
  }
  expect(await heat(10)).toBe('0')
  expect(await heat(20)).toBe('1')
  expect(await heat(30)).toBe('2')
  expect(await heat(40)).toBe('3') // at 40% he really suffers
  expect(await heat(5)).toBe('0')
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
  expect(visiting).toContain('class="m-neutral h0 vi p-lens"')
  expect(visiting).toContain('animation-fill-mode:backwards') // his wandering waits for the visit
})

test('Claude reading a file drops a prop he goes to look at, at most every 12 s', async ($, on) => {
  on('ui.render', emptyBand)
  const clock = mock.clock(on, { now: 9_000_000 })
  on('tool.call', () => ({ result: { content: 'ok' } }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await clock.advance(1000)
  const cls = async () => {
    await clock.settle()
    await clock.advance(1000) // the swap is over: one drawing left
    const all = await ui.findAll({ type: 'Svg' })
    expect(all).toHaveLength(1)
    return /class="([^"]+)"/.exec(String(all[0]!.props.source))?.[1] ?? ''
  }
  await $.tool.call({ tool: 'Read', tool_use_id: 'r1', file_path: 'a.txt' })
  expect(await cls()).toContain('p-file')
  await clock.advance(1000)
  await $.tool.call({ tool: 'Bash', tool_use_id: 'b1', command: 'ls' })
  await clock.settle()
  await clock.advance(1000)
  expect(await cls()).toContain('p-file') // too soon for another one
  await clock.advance(12_000)
  await $.tool.call({ tool: 'Bash', tool_use_id: 'b2', command: 'ls' })
  expect(await cls()).toContain('p-terminal')
  // A mood change waits for the visit to end, then shows.
  await $.turn.complete({ turnId: 'tp', answer: 'done', durationMs: 1, isAborted: false, reason: 'answer' })
  expect(await cls()).toContain('p-terminal')
  await clock.advance(8000)
  expect(await cls()).toContain('m-happy')
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
  await clock.settle()
  await clock.advance(1000)
  expect(String((await ui.find({ type: 'Svg' }))?.props.source)).toContain(' vi p-lens')
  await clock.advance(10_000)
  await clock.settle()
  await clock.advance(1000)
  const all = await ui.findAll({ type: 'Svg' })
  expect(all).toHaveLength(1)
  expect(String(all[0]!.props.source)).not.toContain(' vi ')
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
  const sensor = await ui.find({ type: 'Client' })
  expect(sensor?.props.height).toBe(0) // takes no click from him
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
  await ui.unmount()
})
