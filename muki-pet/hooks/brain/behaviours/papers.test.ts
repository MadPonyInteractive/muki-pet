// The paper pile (MPI-14): the count from background tasks, when he visits it,
// and what the drawing gets.

import type { EngineInterface } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { MAX_PAPERS, PILE_FIRST, PILE_RETRY, pileGap, pilePlan } from '../../character/papers.ts'
import { SECOND } from '../../character/tuning.ts'
import { robotSvg } from '../../draw/index.ts'
import { drawingOptions, initialState, step, type Effect, type Event, type State } from '../machine.ts'
import { readPapers, sendPapers, STORE_PAPERS } from '../pile-store.ts'
import { createBrain } from '../runtime.ts'

const go = (s: State, event: Event, now = 0) => step(s, event, now)
const has = (fx: Effect[], type: Effect['type'], name?: string) =>
  fx.some(f => f.type === type && (name === undefined || ('name' in f && f.name === name)))
const drawn = () => go(initialState(), { type: 'band', width: 720 }).state
const timer = { type: 'timer', name: 'papers.next' } as const

test('papers come from background tasks: a redraw and the first-visit timer, capped, gone at zero', () => {
  let r = go(drawn(), { type: 'papers', count: 4 })
  expect(r.state.slices.papers.count).toBe(4)
  expect(has(r.effects, 'redraw')).toBe(true)
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'papers.next', ms: PILE_FIRST })

  // The same count again changes nothing.
  r = go(r.state, { type: 'papers', count: 4 })
  expect(has(r.effects, 'redraw') || has(r.effects, 'startTimer', 'papers.next')).toBe(false)

  r = go(r.state, { type: 'papers', count: 40 })
  expect(r.state.slices.papers.count).toBe(MAX_PAPERS)

  r = go(r.state, { type: 'papers', count: 0 })
  expect(r.state.slices.papers.count).toBe(0)
  expect(has(r.effects, 'cancelTimer', 'papers.next')).toBe(true)
  expect(has(r.effects, 'redraw')).toBe(true)
})

test('he visits the pile when idle: new home, the hold waits, the next visit is minutes away', () => {
  const s = go(drawn(), { type: 'papers', count: 2 }).state
  const r = go(s, timer, 1000)
  const plan = pilePlan(720, s.home, 1)
  expect(r.state.slices.papers.visit).toEqual({ from: s.home, n: 1, start: 1000, end: 1000 + plan.end * SECOND })
  expect(r.state.home).toBe(plan.toU)
  expect(r.effects).toContainEqual({ type: 'saveHome', home: plan.toU })
  expect(has(r.effects, 'redraw')).toBe(true)
  expect(has(r.effects, 'startTimer', 'hold.visitEnd')).toBe(true)
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'papers.next', ms: plan.end * SECOND + pileGap(1) })

  // He ends left of the pile, after stopping beside it.
  expect(plan.atX).toBeGreaterThan(plan.toX)
  expect(plan.leave).toBeGreaterThan(plan.arrive)

  // The drawing gets the pile and the visit.
  const options = drawingOptions(r.state, 2000)
  expect(options.pile).toEqual({ count: 2, visit: { from: s.home, n: 1, elapsed: 1 } })
  const svg = robotSvg(720, { home: r.state.home, pile: options.pile })
  expect(svg.includes('class="pl"')).toBe(true)
  expect(svg.includes('@keyframes pg')).toBe(true)
  // After the visit only the pile is drawn.
  const after = robotSvg(720, { home: r.state.home, pile: drawingOptions(r.state, 1000 + plan.end * SECOND + 1).pile })
  expect(after.includes('class="pl"')).toBe(true)
  expect(after.includes('@keyframes pg')).toBe(false)
})

test('no visit while Claude works or a prop visit runs; he tries again soon', () => {
  let s = go(drawn(), { type: 'papers', count: 1 }).state
  s = go(s, { type: 'turnStart' }).state
  let r = go(s, timer, 1000)
  expect(r.state.slices.papers.visit).toBe(undefined)
  expect(r.effects).toContainEqual({ type: 'startTimer', name: 'papers.next', ms: PILE_RETRY })

  // A prop visit is on: the pile waits too.
  s = go(drawn(), { type: 'papers', count: 1 }).state
  s = go(s, { type: 'toolStart', prop: 'file' }, 0).state
  r = go(s, timer, 500)
  expect(r.state.slices.papers.visit).toBe(undefined)
})

test('no prop visit while he is at the pile', () => {
  let s = go(drawn(), { type: 'papers', count: 1 }).state
  s = go(s, timer, 0).state
  const r = go(s, { type: 'toolStart', prop: 'file' }, 500)
  expect(r.state.slices.visit.visit).toBe(undefined)
})

test('a reload of the mod keeps the pile of this chat, and a newer turn end wins over it', async () => {
  // The test engine has no store: a small fake shared by two loads of the mod.
  const saved: Record<string, unknown> = {}
  const fake = (session: string) =>
    ({
      clock: { now: async () => 0, after: () => ({ cancel() {} }) },
      ui: { invalidate() {} },
      session: { id: async () => session },
      store: { get: async (k: string) => saved[k], set: async (k: string, v: unknown) => void (saved[k] = v) },
    }) as unknown as EngineInterface
  const $ = fake('chat-a')
  await sendPapers($, 3, createBrain())
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  expect(saved[STORE_PAPERS]).toEqual({ 'chat-a': 3 })

  // Reloaded: a fresh brain reads it back.
  const reloaded = createBrain()
  await readPapers($, reloaded)
  expect(reloaded.state.slices.papers.count).toBe(3)

  // Another chat has no pile.
  const other = createBrain()
  await readPapers(fake('chat-b'), other)
  expect(other.state.slices.papers.count).toBe(0)

  // A turn end before the read: the saved count is older and is not read over it.
  const fresh = createBrain()
  await sendPapers($, 0, fresh)
  await readPapers($, fresh)
  expect(fresh.state.slices.papers.count).toBe(0)
})

test('no papers, no pile in the drawing', () => {
  expect(drawingOptions(drawn(), 0).pile).toBe(undefined)
  expect(robotSvg(720, {}).includes('class="pl"')).toBe(false)
})
