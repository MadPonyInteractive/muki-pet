// You told Claude it worked (MPI-12): he celebrates for a while, jumping about
// with fireworks behind him, then settles. character/confirm.ts decides what
// counts; the `prompt` event carries its answer (not `turnStart`: a message
// typed while Claude works goes into the running turn and starts none, MPI-24).

import { passingMs } from '../../character/moods.ts'
import type { Ctx, Event, MoodVote, Request, Result } from '../types.ts'
import { Behaviour } from './behaviour.ts'

export type CelebrateSlice = { on: boolean }

// Above the passing moods (the alert your message brings) and Claude's work,
// below a question waiting for you.
const PRIORITY = 25

export class Celebrate extends Behaviour<CelebrateSlice> {
  readonly name = 'celebrate'

  initial(): CelebrateSlice {
    return { on: false }
  }

  on(event: Event, slice: CelebrateSlice, _ctx: Ctx): Result<CelebrateSlice> {
    const effects: Request[] = []
    let on = slice.on
    const start = () => {
      on = true
      effects.push({ type: 'startTimer', name: 'celebrate.end', ms: passingMs('celebrate') })
    }
    switch (event.type) {
      case 'prompt':
        if (event.confirmed) start()
        break
      case 'timer':
        if (event.name === 'celebrate.end') on = false
        break
      // A party that waited for you to let go of him gets its full time then.
      case 'released':
        if (on) start()
        break
    }
    return { slice: { on }, effects }
  }

  mood(slice: CelebrateSlice): MoodVote | undefined {
    return slice.on ? { mood: 'celebrate', priority: PRIORITY } : undefined
  }
}
