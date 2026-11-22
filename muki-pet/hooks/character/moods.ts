// What he feels, one entry per mood: everything about a mood is here. The
// brain (brain/machine.ts) picks one from what Claude Code is doing; the
// drawing (draw/moods.ts) turns `face` into CSS and slides between faces.
//
// - kind: `lasting` moods hold until something changes them (neutral, focused
//   while Claude works, curious while a question waits for you, sleepy,
//   asleep); `passing` ones show on top for `ms`, then he goes back.
// - still: he stays home in it (the moods Claude's work flips between), so a
//   redraw never catches him away from home.
// - face: CSS rules on the face parts. `.eye`/`.eyeL`/`.eyeR` are the eyes,
//   `.top`/`.topL`/`.topR` the top lids (hidden above the eye at rest), `.lid`
//   the bottom lids, `.gz` where the eyes sit, `.pt` the head's lean, `.hop` the little jump. Hover and
//   touch rules are more specific, so they still win over a mood.

type Rule = [string, string]
type Lasting = { kind: 'lasting'; still: boolean; face: Rule[] }
type Passing = { kind: 'passing'; ms: number; still: boolean; face: Rule[] }
export type MoodDef = Lasting | Passing

export const MOOD_TABLE = {
  neutral: { kind: 'lasting', still: false, face: [] },
  alert: {
    kind: 'passing',
    ms: 2500,
    still: true,
    face: [
      ['.eye', 'transform:scale(1.18)'],
      // Delayed until the old drawing on top is gone, or both would show.
      ['.hop', 'animation:hop .5s ease-out 1s'],
    ],
  },
  focused: {
    kind: 'lasting',
    still: true,
    face: [
      ['.top', 'transform:translateY(3px)'],
      ['.eye', 'transform:scaleX(.9)'],
    ],
  },
  happy: {
    kind: 'passing',
    ms: 6000,
    still: false,
    face: [
      ['.lid', 'transform:translateY(-7px)'],
      ['.hop', 'animation:hop .5s ease-out 1s 2'],
    ],
  },
  sad: {
    kind: 'passing',
    ms: 5000,
    still: true,
    face: [
      ['.topL', 'transform:translateY(4px) rotate(-24deg)'],
      ['.topR', 'transform:translateY(4px) rotate(24deg)'],
      ['.gz', 'transform:translateY(3px)'],
    ],
  },
  curious: {
    kind: 'lasting',
    still: true,
    face: [
      ['.eyeR', 'transform:scale(1.22)'],
      ['.topL', 'transform:translateY(3px) rotate(8deg)'],
      ['.pt', 'transform:rotate(-8deg)'],
      ['.gz', 'transform:translate(1px,2px)'],
    ],
  },
  // He wants attention (brain/behaviours/attention.ts): lonely, then mad, then
  // tantrums. Lonely is the sad face, lasting until you play with him.
  lonely: {
    kind: 'lasting',
    still: false,
    face: [
      ['.topL', 'transform:translateY(4px) rotate(-24deg)'],
      ['.topR', 'transform:translateY(4px) rotate(24deg)'],
      ['.gz', 'transform:translateY(3px)'],
    ],
  },
  // Angry: the top lids slant down at the inner corners.
  mad: {
    kind: 'lasting',
    still: false,
    face: [
      ['.topL', 'transform:translateY(4px) rotate(20deg)'],
      ['.topR', 'transform:translateY(4px) rotate(-20deg)'],
      ['.eye', 'transform:scaleY(.92)'],
    ],
  },
  // Mad, and every 2 min a stomp-and-steam tantrum (draw/features/tantrum.ts).
  tantrum: {
    kind: 'lasting',
    still: true,
    face: [
      ['.topL', 'transform:translateY(4px) rotate(20deg)'],
      ['.topR', 'transform:translateY(4px) rotate(-20deg)'],
      ['.eye', 'transform:scaleY(.92)'],
      ['.stm', 'display:inline'],
      ['.hop', 'animation:stomp 120s linear 2s infinite'],
      ['.pt', 'animation:shake 120s linear 2s infinite'],
    ],
  },
  sleepy: { kind: 'lasting', still: false, face: [['.top', 'transform:translateY(6px)']] },
  asleep: {
    kind: 'lasting',
    still: true,
    face: [
      ['.top', 'transform:translateY(9px)'],
      ['.lid', 'transform:translateY(-4px)'],
      ['.s', 'animation-play-state:paused!important'],
      ['.zz', 'display:inline'],
      ['svg:hover .top', 'transform:translateY(5px)'],
      // A cookie wakes him: eyes open, no z's while he fetches it.
      ['.c:focus~.bot .top', 'transform:translateY(-3px)'],
      ['.c:focus~.bot .zz', 'display:none'],
    ],
  },
} satisfies Record<string, MoodDef>

export type Mood = keyof typeof MOOD_TABLE
// The moods that show for a while on top of a lasting one.
export type PassingMood = { [M in Mood]: (typeof MOOD_TABLE)[M]['kind'] extends 'passing' ? M : never }[Mood]

export const MOODS = Object.keys(MOOD_TABLE) as Mood[]
export const moodDef = (mood: Mood): MoodDef => MOOD_TABLE[mood]
// How long a passing mood shows.
export const passingMs = (mood: PassingMood): number => MOOD_TABLE[mood].ms
