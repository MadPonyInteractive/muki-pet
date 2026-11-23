// The paper pile per chat, kept in the mod's store ({ <session id>: count }), so
// a reload of the mod still shows it (Fabio, 2026-11-22: he reloaded and the
// pile was gone while the task still ran). Background tasks belong to one chat
// and the store is shared by all of them (chat-store.ts keeps the newest few).
// The brain itself is reset by a reload, so this lives beside it (runtime.ts).

import type { EngineInterface } from 'claude-code'

import { readForChat, saveForChat } from './chat-store.ts'
import { brainState, send, type Brain } from './runtime.ts'

export const STORE_PAPERS = 'papers'

// Per brain (one per load; tests make their own): the one read of the saved
// pile, and whether a turn's end has told the pile since (then the saved one is
// older and never read over it).
type Load = { read?: Promise<void>; seen: boolean }
const loads = new WeakMap<object, Load>()
const DEFAULT = {}
const loadOf = (brain: Brain | undefined) => {
  const key = brain ?? DEFAULT
  let load = loads.get(key)
  if (!load) loads.set(key, (load = { seen: false }))
  return load
}

// The background tasks a turn's end left running: the pile, saved for this chat.
export async function sendPapers($: EngineInterface, count: number, brain?: Brain) {
  loadOf(brain).seen = true
  await send($, { type: 'papers', count }, brain)
  void savePapers($, count).catch(() => {})
}

// The tools that start background work (Fabio, 2026-11-22: a task started in a
// long turn showed no paper until that turn ended). A shell only with its
// background flag; a sub-agent, a Monitor and a Workflow always run alongside.
// The turn's end then sets the real count.
const ALWAYS_BACKGROUND = new Set(['Agent', 'Task', 'Monitor', 'Workflow'])
export const startsBackgroundTask = (tool: string, input: unknown) =>
  ALWAYS_BACKGROUND.has(tool) ||
  ((tool === 'Bash' || tool === 'PowerShell') && (input as { run_in_background?: unknown } | null)?.run_in_background === true)

// One more paper now, for background work Claude just started.
export async function addPaper($: EngineInterface, brain?: Brain) {
  const state = brain ? brain.state : brainState()
  await sendPapers($, state.slices.papers.count + 1, brain)
}

async function savePapers($: EngineInterface, count: number) {
  await saveForChat($, STORE_PAPERS, count)
}

// This chat's saved pile, once per load of the mod. Every render waits for the
// same read, as for his home (runtime.ts readHome).
export function readPapers($: EngineInterface, brain?: Brain) {
  const load = loadOf(brain)
  load.read ??= loadPapers($, brain, load)
  return load.read
}

async function loadPapers($: EngineInterface, brain: Brain | undefined, load: Load) {
  try {
    const count = await readForChat($, STORE_PAPERS)
    if (!load.seen && typeof count === 'number' && count > 0) await send($, { type: 'papers', count }, brain)
  } catch {}
}
