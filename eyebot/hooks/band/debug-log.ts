// TEMPORARY redraw log (2026-11-22, ghost hunt; removal is card MPI-3): every
// swap and every drop of the old drawing, per chat, so we can see whether the
// old one really goes. Written to %TEMP%/claude/eyebot-debug.log.<chat>.

import type { EngineInterface } from 'claude-code'
import type { State } from '../brain/machine.ts'

type Frames = { slots: ReadonlyArray<string | undefined>; active: number; swapping: boolean }

const DEBUG_LOG = 'C:/Users/Fabio/AppData/Local/Temp/claude/eyebot-debug.log'
const chatId = Math.random().toString(36).slice(2, 6)
const lines: string[] = []
const tag = (s?: string) => (s ? `${s.length}:${s.slice(-6) === '</svg>' ? /class="([^"]+)"/.exec(s)?.[1] : '?'}` : '-')

export function debugLog($: EngineInterface, what: string, frames: Frames, s: State) {
  try {
    const line =
      `${new Date().toISOString().slice(11, 23)} ${chatId} ${what} | active=${frames.active} ` +
      `s0=${tag(frames.slots[0])} s1=${tag(frames.slots[1])} timer=${frames.swapping ? 'on' : 'off'} ` +
      `mood=${s.mood} heat=${s.heat} home=${s.home.toFixed(3)}`
    lines.push(line)
    if (lines.length > 400) lines.splice(0, lines.length - 400)
    void Promise.resolve()
      .then(() => $.fs.write(DEBUG_LOG + '.' + chatId, lines.join(String.fromCharCode(10)) + String.fromCharCode(10)))
      .catch(() => {})
  } catch {}
}
