// TEMPORARY attention log (2026-11-22, MPI-5; remove before the card closes):
// every mouse-over-band change, timer and mood change, per chat, so we can see
// why petting and cookies didn't calm him. Written to
// %TEMP%/claude/muki-pet-attention.log.<chat>.

import type { EngineInterface } from 'claude-code'
import type { Effect, Event, State } from './types.ts'

const LOG = 'C:/Users/Fabio/AppData/Local/Temp/claude/muki-pet-attention.log'
const chatId = Math.random().toString(36).slice(2, 6)
const lines: string[] = []

export function attentionLog($: EngineInterface, now: number, event: Event, before: State, after: State, effects: Effect[]) {
  try {
    const what = event.type + ('on' in event ? ` ${event.on}` : '') + ('name' in event ? ` ${event.name}` : '')
    if (event.type !== 'near' && event.type !== 'timer' && before.mood === after.mood) return
    const a = after.slices.attention
    const line =
      `${new Date().toISOString().slice(11, 23)} ${what} | mood ${before.mood}->${after.mood} need=${a.need ?? '-'} ` +
      `idle=${a.since === undefined ? '?' : Math.round((now - a.since) / 1000)}s heat=${after.heat} ` +
      `held=${after.slices.hold.near || after.slices.hold.nearGrace} fx=${effects.map((f) => f.type + ('name' in f ? ':' + f.name : '')).join(',')}`
    lines.push(line)
    if (lines.length > 400) lines.splice(0, lines.length - 400)
    void Promise.resolve()
      .then(() => $.fs.write(LOG + '.' + chatId, lines.join(String.fromCharCode(10)) + String.fromCharCode(10)))
      .catch(() => {})
  } catch {}
}
