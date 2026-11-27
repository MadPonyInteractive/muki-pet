// Muki's hooks: Claude Code's events go to the brain (brain/machine.ts
// decides what he feels and when the band redraws), and the band above the
// prompt draws him (band/render.tsx, drawing code in draw/).
//
// Every hook passes its event on and returns the result untouched; a failure
// in Muki's own code never gets in Claude Code's way.

import type { Register } from 'claude-code'

import { renderBand } from './band/render.tsx'
import { isConfirmation, saidByYou } from './character/confirm.ts'
import { heatOf } from './character/heat.ts'
import { propFor } from './character/props.ts'
import { addPaper, sendPapers, startsBackgroundTask } from './brain/pile-store.ts'
import { send } from './brain/runtime.ts'

export const register: Register = on => {
  on('ui.render', { component: 'AbovePrompt' }, renderBand)

  // The band's sensor (band/sensor.ts): your mouse came over him or left.
  on('ui.message', async ($, e, next) => {
    try {
      const data = e.data as { over?: unknown } | null
      if (e.element === 'near' && typeof data?.over === 'boolean') {
        await send($, { type: 'near', on: data.over })
      }
    } catch {}
    return next(e)
  })

  // Remote Control: a message from your phone puts his headset on; one typed
  // at the desk takes it off (brain/behaviours/remote.ts).
  // A short "it worked" from you makes him celebrate. It is read here, not at
  // turn.start: a message typed while Claude is still working goes into the
  // running turn, and no turn.start comes for it (MPI-24).
  on('prompt.submit', async ($, e, next) => {
    try {
      const confirmed = !e.command && !e.isMeta && saidByYou(e.origin) && isConfirmation(e.text)
      await send($, { type: 'prompt', origin: e.origin.kind, confirmed })
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

  // A turn of Claude's main loop starts (sub-agents' turns don't count).
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
      if (verdict.decision === 'ask' && e.tool_use_id && e.approver === 'person') await send($, { type: 'toolAsk', id: e.tool_use_id })
    } catch {}
    return verdict
  })

  // A tool Claude starts may drop a prop; when it ends, a failure saddens him
  // (not a sub-agent's: those are not his business). Its id ends a question
  // about that tool only.
  on('tool.call', async ($, e, next) => {
    try {
      const prop = !e.agentId && propFor(e.tool)
      if (prop) await send($, { type: 'toolStart', prop })
      // Background work Claude starts lands on the paper pile straight away.
      if (!e.agentId && startsBackgroundTask(e.tool, e)) await addPaper($)
    } catch {}
    const result = await next(e)
    try {
      const failed = !e.agentId && ('deny' in result || Boolean((result as { isError?: boolean }).isError))
      await send($, { type: 'toolDone', failed, id: e.tool_use_id })
    } catch {}
    return result
  })

  // The paper pile: at the end of every turn, one paper per background task
  // still running (shells, sub-agents, monitors, workflows). A task that ends
  // wakes Claude, and that turn's end takes its paper away. The count is
  // saved per chat, so a reload of the mod still shows the pile.
  on('classic.Stop', async ($, e, next) => {
    const result = await next(e)
    try {
      const tasks = e.background_tasks
      if (Array.isArray(tasks)) await sendPapers($, tasks.length)
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
