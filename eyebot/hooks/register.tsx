// Eyebot's hooks: Claude Code's events go to the brain (brain/machine.ts
// decides what he feels and when the band redraws), and the band above the
// prompt draws him (band/render.tsx, drawing code in draw/).
//
// Every hook passes its event on and returns the result untouched; a failure
// in Eyebot's own code never gets in Claude Code's way.

import type { Register } from 'claude-code'

import { debugLog } from './band/debug-log.ts'
import { framesView } from './band/frames.ts'
import { renderBand } from './band/render.tsx'
import { heatOf, propFor } from './brain/config.ts'
import { brainState, send } from './brain/runtime.ts'

export const register: Register = on => {
  on('ui.render', { component: 'AbovePrompt' }, renderBand)

  // The band's sensor (band/sensor.ts): your mouse came over him or left.
  on('ui.message', async ($, e, next) => {
    try {
      const data = e.data as { over?: unknown } | null
      if (e.element === 'near' && typeof data?.over === 'boolean') {
        await send($, { type: 'near', on: data.over })
        debugLog($, `near ${data.over ? 'on' : 'off'}`, framesView(), brainState())
      }
    } catch {}
    return next(e)
  })

  // Heat: the context window filling up warms him.
  on('session.measure', async ($, e, next) => {
    try {
      if (e.context.percent !== undefined) await send($, { type: 'heat', level: heatOf(e.context.percent) })
    } catch {}
    return next(e)
  })

  // You sent a message (sub-agents' turns don't count).
  on('turn.start', async ($, e, next) => {
    if (!e.agentId) {
      try {
        await send($, { type: 'turnStart' })
      } catch {}
    }
    return next(e)
  })

  // A tool needs your OK.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    try {
      if (verdict.decision === 'ask' && e.tool_use_id && e.approver === 'person') await send($, { type: 'toolAsk' })
    } catch {}
    return verdict
  })

  // A tool Claude starts may drop a prop; when it ends, a failure saddens him.
  on('tool.call', async ($, e, next) => {
    try {
      const prop = !e.agentId && propFor(e.tool)
      if (prop) await send($, { type: 'toolStart', prop })
    } catch {}
    const result = await next(e)
    try {
      const failed = 'deny' in result || Boolean((result as { isError?: boolean }).isError)
      await send($, { type: 'toolDone', failed })
    } catch {}
    return result
  })

  // Claude finished.
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (!e.agentId) {
      try {
        await send($, { type: 'turnComplete', reason: e.reason })
      } catch {}
    }
    return result
  })
}
