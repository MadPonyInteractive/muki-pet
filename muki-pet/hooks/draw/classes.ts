// Every CSS class name the drawing uses, once. The markup and the CSS both
// take their names from here, so a rename is one edit and two parts can't
// pick the same short name by accident (the blink and the cookie bites once
// both used `.b1`/`.b2`). `classes.test.ts` checks that all of them differ.
//
// Keyframe names (`@keyframes b1`) are a separate namespace and stay as text.
// The face rules in character/moods.ts name `.eye`, `.top`, `.lid`, `.gz`,
// `.pt`, `.hop` and the eye/lid sides as text too (character/ imports nothing);
// the same test checks that each of those exists here.

// One entry per element or group. The value is the class in the SVG.
export const K = {
  // Travel and wandering: `s` is on everything that runs the wander loop.
  loop: 's',
  travel: 'mv', // the whole robot slides along the band
  carry: 'ix', // everything that travels with him (a visit moves this)
  bot: 'bot', // the robot, his shadow and his touch zones
  body: 'bd', // his body group (not the strips or the cookies)
  tilt: 'tl', // head tilt while wandering
  wheel: 'wh', // a wheel while wandering
  eyesRoam: 'ey', // where the eyes glance while wandering
  spin: 'sp', // a wheel's spin (the dash to a cookie)
  visitWheel: 'vw', // a wheel's spin during a visit
  // His parts.
  hop: 'hop',
  squash: 'sq',
  wobble: 'wg',
  lean: 'ln', // the head leans (rolling, cookies)
  petTilt: 'pt', // the head leans into a hand
  gaze: 'gz', // where the eyes sit on the screen
  eye: 'eye',
  eyeL: 'eyeL',
  eyeR: 'eyeR',
  top: 'top', // top lid
  topL: 'topL',
  topR: 'topR',
  lid: 'lid', // bottom lid
  tired: 'tw', // a lower top lid on top of any mood when hot
  blush: 'bl',
  mouth: 'mo',
  bezel: 'bz', // parts drawn in the bezel colour (heat recolours them)
  chassis: 'chs',
  tyre: 'ty',
  rim: 'rm',
  blinkA: 'b1',
  blinkB: 'b2',
  // Touch.
  pet: 'p', // a touch strip over him
  heart: 'hrt', // a floating heart
  // A tantrum: steam puffs and a red heart over his head that breaks, falls
  // and gets run over.
  steam: 'stm',
  puff: 'pf',
  heartBreak: 'hbk', // the whole heart: pops in, beats, fades
  halfLeft: 'hhl', // a half: cracks off and falls
  halfRight: 'hhr',
  flatLeft: 'hfl', // a fallen half: a wheel squashes it flat
  flatRight: 'hfr',
  // Sleep and visit marks over his head.
  zz: 'zz',
  z1: 'z1',
  z2: 'z2',
  query: 'vq', // the "?" and "!" group
  query1: 'vq1',
  query2: 'vq2',
  // A visit.
  prop: 'vp', // the prop's position
  propAnim: 'vpa', // the prop's own pop, nudge and poof
  visiting: 'vi', // on the svg root while a visit plays
  // The paper pile (one paper per background task).
  pile: 'pl',
  pileTop: 'plf', // the top sheet, lifting a corner now and then
  pileVisit: 'pv', // on the svg root while he visits the pile
  // The Remote Control headset.
  headset: 'hs',
  headsetTip: 'hst', // the antenna's blinking tip
  headsetDrop: 'hsd', // on the svg root while it drops on
  headsetLift: 'hsl', // on the svg root while it lifts off
  // A celebration: fireworks behind him.
  fireworks: 'fw',
  burst: 'fwb', // one firework's sparks, growing and fading
  // Heat.
  sweat: 'sw',
  sweat1: 'sw1',
  sweat2: 'sw2',
  // Cookies.
  strip: 'c', // a cookie strip
  cookie: 'cu', // one layer's cookie
  cookieCore: 'cc',
  foods: 'fds', // the group round every layer's cookie: it holds the random pick
  food: 'fd', // one of the foods a cookie can be (cookie, burger, cake)
  bite: 'bt',
  crumb: 'crm',
  // Being sick.
  rainbow: 'rb',
  rainbowSide: 'rbs',
  puddle: 'pd',
  puddleInner: 'pdi',
  // Right-click play: toys and the bed (features/toys.ts).
  over: 'ov', // a see-through sheet over the band while a toy or the bed is out
  bedOver: 'ovb', // the bed's sheet
  toy: 'tt', // a toy, hidden until its turn
  toyBag: 'tbg',
  bagDrop: 'tbd', // the bag drops in, and flies off at the end
  bagSwing: 'tbs', // the bag swings on its rope
  toyBall: 'tbl',
  ballX: 'tbx',
  ballY: 'tby',
  ballSpin: 'tbr',
  bed: 'bed',
} as const

// Families of classes with a number. Each prefix is its own letter(s) so the
// families can't meet each other or the table above.
export const petZone = (i: number) => `p${i}` // touch strip i (which way the head leans)
export const boopLayer = (k: number) => `q${k}` // touch-strip layer k (boops in a row)
export const stripNo = (i: number) => `c${i}` // cookie strip i (its distance)
export const gazeLevel = (i: number) => `g${i}` // where the eyes look over a strip
export const layerNo = (k: number) => `L${k}` // cookie-game layer k
export const cookieNo = (k: number) => `k${k}` // the cookie of layer k
export const foodNo = (i: number) => `f${i}` // which food: 0 cookie, 1 burger, 2 cake
export const biteNo = (i: number) => `bt${i}`
export const crumbNo = (i: number) => `r${i}`
export const heartNo = (i: number) => `h${i}` // NOTE: same text as heatLevel(i), see the test
export const heatLevel = (n: number) => `h${n}` // on the svg root
export const toyNo = (k: number) => `t${k}` // on the svg root while toy k is out (set by SMIL, never in the markup)
export const overNo = (k: number) => `o${k}` // toy k's sheet
export const moodClass = (mood: string) => `m-${mood}`
export const propClass = (prop: string) => `p-${prop}`

// On the svg root while a toy or the bed is out, and while the bed is out.
// SMIL sets them (features/toys.ts), so no drawing has them in its markup.
export const PLAYING = 'tg'
export const BED_ON = 'bdn'

// The one place two names are meant to be the same text: a heart `h0` and the
// root's heat class `h0` never meet (a heart has no children and sits below
// the root). Renaming the hearts would be a clean fix; it changes the output.
export const KNOWN_SHARED = ['h0', 'h1', 'h2'] as const
