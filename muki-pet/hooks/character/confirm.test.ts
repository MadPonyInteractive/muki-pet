import { expect, test } from 'claude-code/testing'

import { isConfirmation } from './confirm.ts'

test('a short "it worked" counts', () => {
  for (const text of ['1', ' 1 ', 'works', 'It works!', 'it works now', 'Perfect.', 'perfect!!', 'Looks good', 'LGTM', "it's working", 'yes it works', 'Wow, perfect 🎉', 'nailed it'])
    expect([text, isConfirmation(text)]).toEqual([text, true])
})

test('anything else does not', () => {
  for (const text of ['', '2', '12', '1 but the eyes are off', 'yes', 'Yes, go', 'ok', 'it works, but the wheels jitter', 'works?', 'not working', 'perfect except the colour', 'Perfect. Now make the fireworks bigger and slower please'])
    expect([text, isConfirmation(text)]).toEqual([text, false])
})
