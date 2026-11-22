// Each mood's face as CSS, and the slide from one face to the next. To change
// how a mood looks, edit its `face` in character/moods.ts.

import { moodDef, type Mood } from '../character/moods.ts'
import { FADE_IN } from '../character/tuning.ts'
import { K } from './classes.ts'
import { rules } from './math.ts'

// The resting transform of every part a mood moves: where a slide from the
// last mood starts when that mood left the part alone.
const REST: Array<[string, string]> = [
  [`.${K.eye}`, 'transform:none'],
  [`.${K.top}`, 'transform:translateY(-3px)'],
  [`.${K.lid}`, 'transform:none'],
  [`.${K.gaze}`, 'transform:none'],
  [`.${K.petTilt}`, 'transform:none'],
]

// Each face part, and the mood selectors that reach it (later ones win).
const PARTS: Array<[string, string[]]> = [
  [`.${K.eyeL}`, [`.${K.eye}`, `.${K.eyeL}`]],
  [`.${K.eyeR}`, [`.${K.eye}`, `.${K.eyeR}`]],
  [`.${K.topL}`, [`.${K.top}`, `.${K.topL}`]],
  [`.${K.topR}`, [`.${K.top}`, `.${K.topR}`]],
  [`.${K.lid}`, [`.${K.lid}`]],
  [`.${K.gaze}`, [`.${K.gaze}`]],
  [`.${K.petTilt}`, [`.${K.petTilt}`]],
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
