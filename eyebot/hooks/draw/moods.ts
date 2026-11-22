// Each mood's face as CSS, and the slide from one face to the next. To change
// how a mood looks, edit its `face` in character/moods.ts.

import { moodDef, type Mood } from '../character/moods.ts'
import { FADE_IN } from '../character/tuning.ts'
import { rules } from './math.ts'

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
  for (const [sel, decl] of [...REST, ...moodDef(mood).face]) {
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
  return rules(moodDef(mood).face) + slide
}
