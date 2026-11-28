// Whether your message says "it worked" (MPI-12): then he celebrates. Exact
// and cheap, no model call. Only a short message counts, so "it works, but..."
// or a long reply that happens to start with "perfect" does not.
//
// A bare "1" is the "looks right" answer to a verify prompt. "Yes" alone is
// not: it agrees to a plan, it doesn't say something worked.

// The phrases, lower case, without punctuation.
const PHRASES = new Set([
  '1',
  'works',
  'it works',
  'that works',
  'worked',
  'it worked',
  'that worked',
  'working',
  'its working',
  'works now',
  'it works now',
  'works perfectly',
  'works great',
  'perfect',
  'perfecto',
  'looks good',
  'looks right',
  'looks great',
  'looks perfect',
  'all good',
  'lgtm',
  'nailed it',
  'that did it',
  'fixed',
  'its fixed',
  'great',
  'excellent',
  'awesome',
  'brilliant',
  'amazing',
  'nice',
  'yay',
])

// One filler word in front still counts: "yes it works", "wow perfect".
const LEAD = /^(yes|yep|yeah|ok|okay|oh|wow|great|nice|cool|ah) /

// Longer than this is a real message, not a cheer.
const MAX_LENGTH = 40

export function isConfirmation(text: string): boolean {
  // "works?" asks, it doesn't confirm.
  if (text.length > MAX_LENGTH || text.includes('?')) return false
  const words = text
    .toLowerCase()
    .replace(/[’']/g, '')
    // Punctuation and emoji become spaces.
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return PHRASES.has(words) || PHRASES.has(words.replace(LEAD, ''))
}

// Whether a question card's result holds an "it worked" answer. Its answers
// sit in `result.answers`, question text to the picked label (seen live:
// `{ result: { answers: { "...": "1" } } }`).
export function answeredYes(result: unknown): boolean {
  const answers = (result as { result?: { answers?: unknown } } | null)?.result?.answers
  if (!answers || typeof answers !== 'object') return false
  return Object.values(answers).some(a => typeof a === 'string' && isConfirmation(a))
}

// Whether a message is your own words: typed at the desk, sent from your phone
// (Remote Control), `claude -p`, or a plugin speaking as you. A task
// notification, another session or a schedule is not you saying it worked.
export function saidByYou(origin: { kind: string; asUser?: boolean }): boolean {
  if (origin.kind === 'plugin') return origin.asUser === true
  return origin.kind === 'composer' || origin.kind === 'bridge' || origin.kind === 'sdk'
}
