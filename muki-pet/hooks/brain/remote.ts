// Remote Control: while you're talking to the chat from your phone or the web,
// Muki wears his headset (MPI-15). The mods API has no "Remote Control is on"
// flag, and turning it on attaches no surface (probe, 2026-11-22: the roster
// stayed `desktop`). What it does have is where each message came from
// (`prompt.submit`'s `origin.kind`): `bridge` is a message over Remote Control,
// `composer` one typed in Desktop (seen live). So a phone message puts the
// headset on; a message typed at the desk, or REMOTE_IDLE_MS with no phone
// message, takes it off.

import type { EngineInterface } from 'claude-code'

import { REMOTE_IDLE_MS } from '../character/tuning.ts'

// Origins that are you at the desk (Desktop stamps `composer`; the others are
// the terminal's and an SDK host's own).
const DESK = new Set(['composer', 'sdk', 'unclassified'])

type Timer = { cancel: () => void }
let on = false
let idle: Timer | undefined

// Whether the headset is on now.
export const remoteOn = () => on

// A message entered the chat, from wherever it came.
export function promptSeen($: EngineInterface, kind: string) {
  if (kind === 'bridge') {
    setRemote($, true)
    idle?.cancel()
    idle = $.clock.after(REMOTE_IDLE_MS, () => setRemote($, false))
  } else if (DESK.has(kind)) {
    setRemote($, false)
  }
}

function setRemote($: EngineInterface, value: boolean) {
  if (!value) {
    idle?.cancel()
    idle = undefined
  }
  if (on === value) return
  on = value
  $.ui.invalidate('ui.render')
}
