// Remote Control: while you're talking to the chat from your phone or the web,
// Muki wears his headset (MPI-15). The mods API has no "Remote Control is on"
// flag, and turning it on attaches no surface (probe, 2026-11-22: the roster
// stayed `desktop`). What it does have is where each message came from
// (`prompt.submit`'s `origin.kind`): `bridge` is a message over Remote Control,
// `composer` one typed in Desktop (seen live). So a phone message puts the
// headset on; a message typed at the desk, or REMOTE_IDLE_MS with no phone
// message, takes it off.
//
// The drawings made while it `changing` play it going on or off; after
// HEADSET_SETTLE_MS the next one shows it at rest. That settle is a change too,
// so the band's last drawing is never the drop or the lift: Desktop draws a
// chat's last drawing again when the chat is opened, and it would replay.
// Its redraws go through the hold like any other change (machine.ts).

import { HEADSET_SETTLE_MS, REMOTE_IDLE_MS } from '../../character/tuning.ts'
import type { Ctx, DrawingOptions, Event, Request, Result } from '../types.ts'
import { Behaviour } from './behaviour.ts'

export type RemoteSlice = { on: boolean; changing: boolean }

// Origins that are you at the desk (Desktop stamps `composer`; the others are
// the terminal's and an SDK host's own).
const DESK = new Set(['composer', 'sdk', 'unclassified'])

export class Remote extends Behaviour<RemoteSlice> {
  readonly name = 'remote'

  initial(): RemoteSlice {
    return { on: false, changing: false }
  }

  on(event: Event, slice: RemoteSlice, _ctx: Ctx): Result<RemoteSlice> {
    const effects: Request[] = []
    let s = slice
    const set = (on: boolean) => {
      if (on === s.on) return
      s = { on, changing: true }
      effects.push({ type: 'startTimer', name: 'remote.settle', ms: HEADSET_SETTLE_MS })
    }
    if (event.type === 'prompt') {
      if (event.origin === 'bridge') {
        set(true)
        effects.push({ type: 'startTimer', name: 'remote.idle', ms: REMOTE_IDLE_MS })
      } else if (DESK.has(event.origin)) {
        set(false)
        effects.push({ type: 'cancelTimer', name: 'remote.idle' })
      }
    } else if (event.type === 'timer') {
      if (event.name === 'remote.idle') set(false)
      else if (event.name === 'remote.settle') s = { ...s, changing: false }
    }
    return { slice: s, effects }
  }

  drawing(slice: RemoteSlice): DrawingOptions | undefined {
    const headset = slice.changing ? (slice.on ? 'drop' : 'lift') : slice.on ? 'on' : undefined
    return headset ? { headset } : undefined
  }
}
