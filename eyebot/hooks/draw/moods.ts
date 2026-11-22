// How each mood looks on his face, and the slide from one face to the next.
// To change how a mood looks, edit MOOD_RULES.

import { FADE_IN } from './constants.ts'
import { rules } from './math.ts'

// What he feels. The brain (brain/machine.ts) picks one from what Claude Code
// is doing.
export const MOODS = ['neutral', 'alert', 'focused', 'happy', 'sad', 'curious', 'sleepy', 'asleep'] as const
export type Mood = (typeof MOODS)[number]

// The moods he stays home in (the ones Claude's work flips between): no trips
// out, so a swap never catches him away from home.
export const STILL: Mood[] = ['alert', 'focused', 'curious', 'sad', 'asleep']

// How each mood looks: CSS rules on the face parts. `.eye`/`.eyeL`/`.eyeR` are
// the eyes, `.top`/`.topL`/`.topR` the top lids (hidden above the eye at rest),
// `.lid` the bottom lids, `.gz` where the eyes sit, `.pt` the head's lean.
// Hover and touch rules are more specific, so they still win over a mood.
const MOOD_RULES: Record<Mood, Array<[string, string]>> = {
  neutral: [],
  alert: [
    ['.eye', 'transform:scale(1.18)'],
    // Delayed until the old drawing on top is gone, or both would show.
    ['.hop', 'animation:hop .5s ease-out 1s'],
  ],
  focused: [
    ['.top', 'transform:translateY(3px)'],
    ['.eye', 'transform:scaleX(.9)'],
  ],
  happy: [
    ['.lid', 'transform:translateY(-7px)'],
    ['.hop', 'animation:hop .5s ease-out 1s 2'],
  ],
  sad: [
    ['.topL', 'transform:translateY(4px) rotate(-24deg)'],
    ['.topR', 'transform:translateY(4px) rotate(24deg)'],
    ['.gz', 'transform:translateY(3px)'],
  ],
  curious: [
    ['.eyeR', 'transform:scale(1.22)'],
    ['.topL', 'transform:translateY(3px) rotate(8deg)'],
    ['.pt', 'transform:rotate(-8deg)'],
    ['.gz', 'transform:translate(1px,2px)'],
  ],
  sleepy: [['.top', 'transform:translateY(6px)']],
  asleep: [
    ['.top', 'transform:translateY(9px)'],
    ['.lid', 'transform:translateY(-4px)'],
    ['.s', 'animation-play-state:paused!important'],
    ['.zz', 'display:inline'],
    ['svg:hover .top', 'transform:translateY(5px)'],
    // A cookie wakes him: eyes open, no z's while he fetches it.
    ['.c:focus~.bot .top', 'transform:translateY(-3px)'],
    ['.c:focus~.bot .zz', 'display:none'],
  ],
}

// The resting transform of every part a mood moves: where a slide from the
// last mood starts when that mood left the part alone.
const REST: Array<[string, string]> = [
  ['.eye', 'transform:none'],
  ['.top', 'transform:translateY(-3px)'],
  ['.lid', 'transform:none'],
  ['.gz', 'transform:none'],
  ['.pt', 'transform:none'],
]

// Each face part, and the mood selectors that reach it (later ones win).
const PARTS: Array<[string, string[]]> = [
  ['.eyeL', ['.eye', '.eyeL']],
  ['.eyeR', ['.eye', '.eyeR']],
  ['.topL', ['.top', '.topL']],
  ['.topR', ['.top', '.topR']],
  ['.lid', ['.lid']],
  ['.gz', ['.gz']],
  ['.pt', ['.pt']],
]

// The transform a mood gives the part reached by `sels`.
export const partTransform = (mood: Mood, sels: string[]) => {
  let value = 'none'
  for (const [sel, decl] of [...REST, ...MOOD_RULES[mood]]) {
    if (sels.includes(sel) && decl.startsWith('transform:')) value = decl.slice('transform:'.length)
  }
  return value
}

// The mood's own rules, plus a slide from the face the previous mood had. The
// slide waits for FADE_IN so it plays where it can be seen.
export function moodCss(mood: Mood, from: Mood | undefined): string {
  let slide = ''
  if (from && from !== mood) {
    PARTS.forEach(([sel, sels], i) => {
      const was = partTransform(from, sels)
      if (was !== partTransform(mood, sels)) {
        slide += `${sel}{animation:f${i} .45s ease-out ${FADE_IN} backwards}@keyframes f${i}{from{transform:${was}}}`
      }
    })
  }
  return rules(MOOD_RULES[mood]) + slide
}
