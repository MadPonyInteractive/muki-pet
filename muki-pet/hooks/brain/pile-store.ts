// The paper pile per chat, kept in the mod's store ({ <session id>: count }), so
// a reload of the mod still shows it (Fabio, 2026-11-22: he reloaded and the
// pile was gone while the task still ran). Background tasks belong to one chat
// and the store is shared by all of them; only the newest PAPER_CHATS are kept.
// The brain itself is reset by a reload, so this lives beside it (runtime.ts).

import type { EngineInterface } from 'claude-code'

import { send, type Brain } from './runtime.ts'

export const STORE_PAPERS = 'papers'
const PAPER_CHATS = 20

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

async function savePapers($: EngineInterface, count: number) {
  const id = await $.session.id()
  const saved = await $.store.get(STORE_PAPERS)
  const all: Record<string, unknown> = saved && typeof saved === 'object' ? { ...(saved as Record<string, unknown>) } : {}
  // Re-added last, so the oldest chats are the first ones dropped.
  delete all[id]
  all[id] = count
  const keys = Object.keys(all)
  for (const k of keys.slice(0, Math.max(0, keys.length - PAPER_CHATS))) delete all[k]
  await $.store.set(STORE_PAPERS, all)
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
    const id = await $.session.id()
    const saved = (await $.store.get(STORE_PAPERS)) as Record<string, unknown> | undefined
    const count = saved?.[id]
    if (!load.seen && typeof count === 'number' && count > 0) await send($, { type: 'papers', count }, brain)
  } catch {}
}
