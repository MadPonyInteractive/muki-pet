// Values that belong to one chat, in the mod's store. The store is shared by
// every chat, so each such key holds { <session id>: value }, and only the
// newest CHATS_KEPT chats are kept. Used for the paper pile (pile-store.ts) and
// the last context figure (runtime.ts readHeat).

import type { EngineInterface } from 'claude-code'

const CHATS_KEPT = 20

// This chat's value under `key`, or undefined (also for an old plain value).
export async function readForChat($: EngineInterface, key: string): Promise<unknown> {
  const id = await $.session.id()
  const saved = await $.store.get(key)
  return saved && typeof saved === 'object' ? (saved as Record<string, unknown>)[id] : undefined
}

export async function saveForChat($: EngineInterface, key: string, value: unknown) {
  const id = await $.session.id()
  const saved = await $.store.get(key)
  const all: Record<string, unknown> = saved && typeof saved === 'object' ? { ...(saved as Record<string, unknown>) } : {}
  // Re-added last, so the oldest chats are the first ones dropped.
  delete all[id]
  all[id] = value
  const keys = Object.keys(all)
  for (const k of keys.slice(0, Math.max(0, keys.length - CHATS_KEPT))) delete all[k]
  await $.store.set(key, all)
}
