// Builds the robot as one self-animating SVG document.
//
// The motion (rolling, wheel spin, head lag, where the eyes look) is simulated
// here once, sampled, and written out as CSS keyframes, so the surface plays it
// smoothly with no redraws. Mouse reactions are CSS :hover on invisible strips
// that travel with the robot, so "left of him" / "right of him" is known
// without script (the desktop draws the SVG in a script-less frame). The same
// strips take clicks: a click focuses one, and :focus rules run the cookie game.

export const BAND_HEIGHT = 76

// What he feels. The hooks module picks one from what Claude Code is doing.
export const MOODS = ['neutral', 'alert', 'focused', 'happy', 'sad', 'curious', 'sleepy', 'asleep'] as const
export type Mood = (typeof MOODS)[number]

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

const partTransform = (mood: Mood, sels: string[]) => {
  let value = 'none'
  for (const [sel, decl] of [...REST, ...MOOD_RULES[mood]]) {
    if (sels.includes(sel) && decl.startsWith('transform:')) value = decl.slice('transform:'.length)
  }
  return value
}

const rules = (list: Array<[string, string]>) => list.map(([sel, decl]) => `${sel}{${decl}}`).join('')

// A new drawing loads under the old one, which stays on top for 0.9 s (see
// register.tsx). He shows in the new one after this short delay and fades in,
// so he is there well before the old one goes, even when the load is slow.
const FADE_IN = '.15s'

// The mood's own rules, plus a slide from the face the previous mood had. The
// slide waits for FADE_IN so it plays where it can be seen.
function moodCss(mood: Mood, from: Mood | undefined): string {
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

const COLORS = {
  bezel: '#3a444b',
  screen: '#0b1216',
  eye: '#5ee7f0',
  tyre: '#1c2328',
  rim: '#56626a',
  blush: '#ff7aa8',
  sweat: '#9fdcff',
  cookie: '#d39a5c',
  cookieEdge: '#9a6332',
  chip: '#4b2c17',
}

const FPS = 30
const WHEEL_R = 11
const SCALE = 0.85
const EDGE = 44

type Segment = { kind: 'idle'; dur: number } | { kind: 'move'; to: number; dur: number }

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
// Minimum-jerk easing: starts and stops with zero speed and zero acceleration.
const ease = (u: number) => u * u * u * (10 + u * (-15 + 6 * u))

type Tracks = { x: number[]; tilt: number[]; eyeX: number[]; eyeY: number[] }

// His wandering: rest at home, a short trip out, a look around, back home, and
// so on. The loop starts and ends resting at home, so every new drawing can
// start him there. Drawings can't share a clock (each starts its own when it
// loads, and the hook can only guess when that was), so home is the one place
// two drawings always agree on.
//
// A drawing is swapped out while the old one stays on top for a moment, and a
// swap while he is out on a trip shows two robots (a ghost). So: no trips at all
// in the moods Claude's work flips between (`roam` false), and every loop opens
// with a long rest, longer than the passing moods (alert, happy, sad) last, so
// a swap out of one of those always finds him at home.
const FIRST_REST = 8

function simulate(width: number, home: number, seed: number, roam = true): Tracks {
  const rand = mulberry32(seed)
  const lo = EDGE
  const hi = Math.max(lo + 1, width - EDGE)

  const plan: Segment[] = []
  let planned = 0
  if (!roam) {
    plan.push({ kind: 'idle', dur: 40 })
    planned = Infinity
  }
  while (planned < 45) {
    const rest = plan.length ? 4 + rand() * 6 : FIRST_REST + rand() * 3
    let dir = rand() < 0.5 ? -1 : 1
    // Short trips: a swap while he's out can only jump him this far.
    const want = 20 + rand() * 60
    if ((dir < 0 ? home - lo : hi - home) < 40) dir = -dir
    const to = clamp(home + dir * want, lo, hi)
    const out = Math.max(1, Math.abs(to - home) / (55 + rand() * 60))
    const stay = 1 + rand() * 2.5
    const back = Math.max(1, Math.abs(to - home) / (55 + rand() * 60))
    plan.push({ kind: 'idle', dur: rest }, { kind: 'move', to, dur: out }, { kind: 'idle', dur: stay }, { kind: 'move', to: home, dur: back })
    planned += rest + out + stay + back
  }
  if (roam) plan.push({ kind: 'idle', dur: 2 })

  // Position, frame by frame, and where idle eyes glance.
  const x: number[] = []
  const lookX: number[] = []
  const lookY: number[] = []
  let from = home
  let glanceX = 0
  let glanceY = 0
  let glanceLeft = 0
  for (const seg of plan) {
    const frames = Math.round(seg.dur * FPS)
    for (let f = 0; f < frames; f++) {
      if (seg.kind === 'move') {
        x.push(from + (seg.to - from) * ease(f / frames))
        lookX.push(NaN) // filled from velocity below
        lookY.push(0)
      } else {
        x.push(from)
        if (glanceLeft <= 0) {
          glanceLeft = Math.round((0.5 + rand() * 1.3) * FPS)
          const centred = rand() < 0.35
          glanceX = centred ? 0 : (rand() * 2 - 1) * 5
          glanceY = centred ? 0 : -3 + rand() * 4.5
        }
        glanceLeft--
        lookX.push(glanceX)
        lookY.push(glanceY)
      }
    }
    if (seg.kind === 'move') from = seg.to
  }

  const n = x.length
  const dt = 1 / FPS
  const at_ = (arr: number[], i: number) => arr[(i + n) % n]
  const vel = x.map((_, i) => (at_(x, i + 1) - at_(x, i - 1)) / (2 * dt))
  const acc = x.map((_, i) => (at_(x, i + 1) - 2 * x[i] + at_(x, i - 1)) / (dt * dt))

  // Head on a damped spring, pushed back by speed and by acceleration.
  // Rolling left (negative velocity) leans the head right (positive rotation).
  const omega = 2 * Math.PI * 1.5
  const zeta = 0.28
  const tilt: number[] = new Array(n)
  let th = 0
  let w = 0
  const sub = 8
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const target = clamp(-(0.07 * vel[i] + 0.022 * acc[i]), -16, 16)
      for (let s = 0; s < sub; s++) {
        const h = dt / sub
        w += (omega * omega * (target - th) - 2 * zeta * omega * w) * h
        th += w * h
      }
      tilt[i] = clamp(th, -20, 20)
    }
  }

  // Eyes: look where he is going while moving, glance around while idle.
  const eyeX: number[] = new Array(n)
  const eyeY: number[] = new Array(n)
  let ex = 0
  let ey = 0
  const k = 1 - Math.exp(-dt / 0.09)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const tx = Number.isNaN(lookX[i]) ? clamp(vel[i] / 50, -1, 1) * 5 : lookX[i]
      ex += (tx - ex) * k
      ey += (lookY[i] - ey) * k
      eyeX[i] = ex
      eyeY[i] = ey
    }
  }

  return { x, tilt, eyeX, eyeY }
}

// Keeps only the samples linear interpolation cannot stand in for.
function simplify(values: number[], tol: number): number[] {
  const n = values.length
  const keep = [0]
  let start = 0
  for (let j = 2; j <= n; j++) {
    const end = j === n ? values[0] : values[j]
    let ok = true
    for (let m = start + 1; m < j; m++) {
      const u = (m - start) / (j - start)
      const v = values[start] + (end - values[start]) * u
      if (Math.abs(v - values[m]) > tol) {
        ok = false
        break
      }
    }
    if (!ok) {
      keep.push(j - 1)
      start = j - 1
    }
  }
  return keep
}

const r1 = (v: number) => Math.round(v * 10) / 10
const pct = (i: number, n: number) => `${Math.round((i / n) * 100000) / 1000}%`
const deg = (px: number) => (px / WHEEL_R) * (180 / Math.PI)

function keyframes(name: string, values: number[], tol: number, css: (v: number) => string): string {
  const n = values.length
  const idx = simplify(values, tol)
  const stops = idx.map(i => `${pct(i, n)}{transform:${css(values[i])}}`)
  stops.push(`100%{transform:${css(values[0])}}`)
  return `@keyframes ${name}{${stops.join('')}}`
}

const bandX = (W: number, u: number) => EDGE + clamp(u, 0, 1) * Math.max(0, W - 2 * EDGE)

// His wandering around one home spot on one band width, as keyframes.
const routes = new Map<string, { kf: string; loop: string }>()

// The moods he stays home in (the ones Claude's work flips between).
const STILL: Mood[] = ['alert', 'focused', 'curious', 'sad', 'asleep']

function routeAround(W: number, homeX: number, roam: boolean) {
  const key = `${W}|${homeX}|${roam}`
  let r = routes.get(key)
  if (!r) {
    const t = simulate(W, homeX, 7, roam)
    r = {
      kf:
        keyframes('mv', t.x, 0.4, v => `translateX(${r1(v)}px)`) +
        keyframes('tl', t.tilt, 0.35, v => `rotate(${r1(v)}deg)`) +
        keyframes('wh', t.x.map(deg), 2, v => `rotate(${r1(v)}deg)`) +
        eyeKeyframes(t.eyeX, t.eyeY),
      loop: (t.x.length / FPS).toFixed(2),
    }
    if (routes.size > 40) routes.clear()
    routes.set(key, r)
  }
  return r
}

// Props: small things that pop up for what Claude is doing. He rolls over,
// inspects one ("?", a nudge, "!"), and rolls back while it poofs.
export const PROPS = ['file', 'lens', 'pencil', 'terminal', 'globe'] as const
export type Prop = (typeof PROPS)[number]

const PROP_SHAPES: Record<Prop, string> = {
  file:
    `<path d="M-6,-18H3L7,-14V0H-6Z" fill="#e8eef2" stroke="#8a9aa5" stroke-width="1.2"/>` +
    `<path d="M3,-18V-14H7" fill="none" stroke="#8a9aa5" stroke-width="1.2"/>` +
    `<g stroke="#8a9aa5" stroke-width="1.2"><line x1="-3.5" y1="-11" x2="4" y2="-11"/><line x1="-3.5" y1="-7.5" x2="4" y2="-7.5"/><line x1="-3.5" y1="-4" x2="2" y2="-4"/></g>`,
  lens:
    `<line x1="2.5" y1="-6.5" x2="7.5" y2="-0.5" stroke="#8a9aa5" stroke-width="3.2" stroke-linecap="round"/>` +
    `<circle cx="-1.5" cy="-11" r="6" fill="#5ee7f0" fill-opacity=".25" stroke="#cfe3ea" stroke-width="2.2"/>`,
  pencil:
    `<g transform="rotate(-30)"><rect x="-2.6" y="-19" width="5.2" height="13" fill="#ffcf4d"/>` +
    `<path d="M-2.6,-6L0,-0.5L2.6,-6Z" fill="#f3d9b1"/><path d="M-0.8,-2.2L0,-0.5L0.8,-2.2Z" fill="#3a444b"/>` +
    `<rect x="-2.6" y="-21.5" width="5.2" height="2.8" rx="1" fill="#ff7aa8"/></g>`,
  terminal:
    `<rect x="-9" y="-15" width="18" height="14" rx="2.5" fill="#0b1216" stroke="#56626a" stroke-width="1.5"/>` +
    `<path d="M-5.5,-11L-2.5,-8L-5.5,-5" stroke="#5ee7f0" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<line x1="-1" y1="-4.8" x2="4" y2="-4.8" stroke="#5ee7f0" stroke-width="1.5" stroke-linecap="round"/>`,
  globe:
    `<circle cy="-8" r="7.5" fill="#2b6f9e" stroke="#9fdcff" stroke-width="1.2"/>` +
    `<ellipse cy="-8" rx="3.2" ry="7.5" fill="none" stroke="#9fdcff" stroke-width="1"/>` +
    `<line x1="-7.5" y1="-8" x2="7.5" y2="-8" stroke="#9fdcff" stroke-width="1"/>`,
}

export type VisitPlan = {
  fromX: number
  toX: number
  toU: number
  off: number
  s: number
  go: number
  arrive: number
  leave: number
  end: number
}

// Where the prop goes and how the visit runs, in seconds from its start. He
// rolls from his home to the prop, and the spot beside it becomes his new home
// (no trip back). Only the width, the old home and the visit's number decide
// it, so the hook and every drawing during one visit agree.
// A visit starts only after the swap that brings it in is over, so the old
// drawing on top never shows him doing something else beside it.
const LEAD = 1

export function visitPlan(width: number, fromU: number, n: number): VisitPlan {
  const W = Math.round(width)
  const fromX = Math.round(bandX(W, fromU))
  const s = fromX < W / 2 ? 1 : -1
  const X = clamp(fromX + s * (110 + 120 * ((n * 0.618034) % 1)), 30, W - 30)
  const toX = Math.round(clamp(X - s * 32, EDGE, Math.max(EDGE, W - EDGE)))
  const go = Math.round(clamp(Math.abs(toX - fromX) / 110, 0.7, 2.5) * 100) / 100
  const arrive = 0.9 + go
  const leave = arrive + 2.4
  return {
    fromX,
    toX,
    toU: W > 2 * EDGE ? (toX - EDGE) / (W - 2 * EDGE) : 0.5,
    off: Math.round(X - toX),
    s,
    go,
    arrive,
    leave,
    end: Math.round((leave + 0.7 + LEAD) * 100) / 100,
  }
}

// The visit's CSS. Each part runs one keyframe track over the whole visit,
// eased per step; `elapsed` picks a later start when a new drawing (a mood
// change) comes in the middle of it. While he checks the prop out he wears the
// curious face, then goes back to the face of his mood.
function visitCss(v: VisitPlan, elapsed: number, mood: Mood): string {
  // The visit's own time runs from the end of the lead-in.
  const T = Math.round((v.end - LEAD) * 100) / 100
  elapsed -= LEAD
  const at = (sec: number) => `${Math.round((clamp(sec, 0, T) / T) * 100000) / 1000}%`
  const track = (name: string, stops: Array<[number, string]>) =>
    `@keyframes ${name}{${stops.map(([sec, val]) => `${at(sec)}{${val}}`).join('')}}`
  const run = (name: string) => `animation:${name} ${T}s ease-in-out ${Math.round(-elapsed * 100) / 100}s both`
  const { s, arrive: A, leave: L } = v
  const E = T
  const from = v.fromX - v.toX
  const tx = (px: number) => `transform:translateX(${px}px)`
  const rot = (d: number) => `transform:rotate(${r1(d)}deg)`
  // A face part: his mood's look before and after, the curious look in between.
  const face = (name: string, sels: string[], from: number, to: number, look = partTransform('curious', sels)) => {
    const rest = `transform:${partTransform(mood, sels)}`
    return track(name, [[0, rest], [from, rest], [from + 0.3, `transform:${look}`], [to, `transform:${look}`], [to + 0.35, rest], [E, rest]])
  }
  return (
    // His loop waits, held on his spot, until the visit is over.
    `.s{animation-delay:${Math.round((T - elapsed) * 100) / 100}s;animation-fill-mode:backwards}` +
    `.vp{display:inline}.vi .vq{display:inline}` +
    `.ix{${run('vx')}}` +
    track('vx', [[0, tx(from)], [0.9, tx(from)], [A, tx(0)], [E, tx(0)]]) +
    `.vw{${run('vw')}}` +
    track('vw', [[0, rot(deg(from))], [0.9, rot(deg(from))], [A, rot(0)], [E, rot(0)]]) +
    `.vi .ln{${run('vl')}}` +
    track('vl', [
      [0, rot(0)], [0.9, rot(0)], [0.9 + v.go * 0.35, rot(-s * 9)], [A - 0.1, rot(-s * 5)], [A + 0.3, rot(s * 14)],
      [L, rot(s * 11)], [L + 0.5, rot(0)], [E, rot(0)],
    ]) +
    `.vi .gz{${run('vg')}}` +
    track('vg', [
      [0, `transform:${partTransform(mood, ['.gz'])}`], [0.35, `transform:translate(${s * 5}px,0)`], [A, `transform:translate(${s * 5}px,0)`],
      [A + 0.25, `transform:translate(${s * 4}px,3px)`], [L, `transform:translate(${s * 4}px,3px)`],
      [L + 0.5, `transform:${partTransform(mood, ['.gz'])}`], [E, `transform:${partTransform(mood, ['.gz'])}`],
    ]) +
    `.vi .eyeL{${run('vcl')}}.vi .eyeR{${run('vcr')}}.vi .topL{${run('vtl')}}.vi .topR{${run('vtr')}}` +
    face('vcl', ['.eye', '.eyeL'], 0.35, L) +
    face('vcr', ['.eye', '.eyeR'], 0.35, L) +
    face('vtl', ['.top', '.topL'], 0.35, A + 1.5) +
    face('vtr', ['.top', '.topR'], 0.35, A + 1.5) +
    `.vi .lid{${run('vd')}}` +
    // The "!": a happy squint before he leaves.
    face('vd', ['.lid'], A + 1.4, L, 'translateY(-9px)') +
    `.vi .hop{animation:hop .5s ease-out ${Math.round((0.3 - elapsed) * 100) / 100}s}` +
    `.vq1{${run('vq1')}}` +
    track('vq1', [[0, 'opacity:0'], [A + 0.2, 'opacity:0;transform:translateY(3px)'], [A + 0.45, 'opacity:1;transform:none'], [A + 1.3, 'opacity:1;transform:none'], [A + 1.45, 'opacity:0'], [E, 'opacity:0']]) +
    `.vq2{${run('vq2')}}` +
    track('vq2', [[0, 'opacity:0'], [A + 1.45, 'opacity:0;transform:scale(.4)'], [A + 1.65, 'opacity:1;transform:scale(1.2)'], [A + 1.8, 'opacity:1;transform:none'], [L, 'opacity:1;transform:none'], [L + 0.2, 'opacity:0'], [E, 'opacity:0']]) +
    `.vpa{${run('vpa')}}` +
    track('vpa', [
      [0, 'transform:scale(0)'], [0.3, 'transform:scale(1.18)'], [0.45, 'transform:none'], [A + 0.6, 'transform:none'],
      [A + 0.75, 'transform:rotate(-14deg)'], [A + 0.9, 'transform:rotate(10deg)'], [A + 1.05, 'transform:none'],
      [L, 'transform:none;opacity:1'], [L + 0.15, 'transform:scale(1.25);opacity:1'], [L + 0.45, 'transform:scale(0);opacity:0'], [E, 'transform:scale(0);opacity:0'],
    ])
  )
}

function eyeShape(dx: number, side: 'L' | 'R'): string {
  return (
    `<g transform="translate(${dx},0)">` +
    `<rect class="eye eye${side}" x="-5.5" y="-7" width="11" height="14" rx="4" fill="${COLORS.eye}"/>` +
    // `.tw` (tired) lowers the lid a little more on top of any mood when he's hot.
    `<g class="tw"><rect class="top top${side}" x="-10" y="-25" width="20" height="18" fill="${COLORS.screen}"/></g>` +
    `<ellipse class="lid" cx="0" cy="16" rx="10" ry="9" fill="${COLORS.screen}"/>` +
    `</g>`
  )
}

function wheelShape(dx: number): string {
  const spokes = [0, 120, 240]
    .map(a => {
      const r = (a * Math.PI) / 180
      return `<line x1="0" y1="0" x2="${r1(Math.cos(r) * 7.5)}" y2="${r1(Math.sin(r) * 7.5)}"/>`
    })
    .join('')
  return (
    `<g transform="translate(${dx},${-WHEEL_R})"><g class="wh s"><g class="sp"><g class="vw">` +
    `<circle class="ty rm" r="${WHEEL_R - 1}" fill="${COLORS.tyre}" stroke="${COLORS.rim}" stroke-width="2.5"/>` +
    `<g class="rm" stroke="${COLORS.rim}" stroke-width="2" stroke-linecap="round">${spokes}</g>` +
    `<circle r="2.4" fill="${COLORS.eye}"/>` +
    `</g></g></g></g>`
  )
}

export type RobotOptions = {
  mood?: Mood
  // The mood he had before: the drawing starts from that face and slides over.
  from?: Mood
  // His home spot, as a share of the band (0 = left end, 1 = right end). Every
  // drawing starts him resting there.
  home?: number
  // How hot he runs, 0 to 3, from how full the context window is.
  heat?: number
  // A prop he is visiting: from which home, the visit's number, and how far
  // into it this drawing starts. Its end spot is his home.
  visit?: { prop: Prop; from: number; n: number; elapsed: number }
}

// The body is built once per width; only the mood part and root classes change.
let body_: { width: number; css: string; tailA: string; tailB: string } | undefined

export function robotSvg(width: number, options: RobotOptions = {}): string {
  const W = Math.round(width)
  if (body_?.width !== W) body_ = { width: W, ...robotParts(W) }
  const mood = options.mood ?? 'neutral'
  const heat = clamp(Math.round(options.heat ?? 0), 0, 3)
  const plan = options.visit && visitPlan(W, options.visit.from, options.visit.n)
  const visit = plan && options.visit && options.visit.elapsed < plan.end ? { plan, ...options.visit } : undefined
  const route = routeAround(W, plan ? plan.toX : Math.round(bandX(W, options.home ?? 0.5)), !STILL.includes(mood))
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${BAND_HEIGHT}" width="${W}" height="${BAND_HEIGHT}" class="m-${mood} h${heat}${visit ? ` vi p-${visit.prop}` : ''}">` +
    `<style>${body_.css}` +
    `.s{animation-duration:${route.loop}s}` +
    route.kf +
    moodCss(mood, options.from) +
    (visit ? visitCss(visit.plan, Math.max(0, visit.elapsed), mood) : '') +
    `</style>` +
    body_.tailA +
    (visit ? `<g class="vp" transform="translate(${visit.plan.off},0)"><g class="vpa">${PROP_SHAPES[visit.prop]}</g></g>` : '') +
    body_.tailB
  )
}

// The cookie game. Narrow focusable strips travel with him on both sides; a
// click focuses one, which (by its own rule) sets how far away it is (--d), how
// far his wheels turn to get there (--w), how long the dash takes (--t) and
// which way (--s), and how long the roll back takes (--r). The strip's focus
// ends by itself a while after he is back.
//
// Counting cookies in a row, with no script: the strips come in six layers.
// Layer k takes clicks only while a layer k-1 strip has focus, so each click
// before the last cookie's focus ends climbs one layer, and the 6th one makes
// him sick. Each layer has its own cookie (after the robot, so it's drawn in
// front of him); it is hidden until its layer has focus, and showing it starts
// its animations afresh. Worked out in tools/frame-lab-ladder-test.svg.
export const LAYERS = 6

function cookieParts(W: number): { css: string; strips: string; cookies: string } {
  const extent = Math.max(W, 300)
  const strips: Array<{ x: number; w: number; d: number; side: number }> = []
  for (const side of [-1, 1]) {
    for (let a = 26; a < extent; ) {
      const w = a < 300 ? 24 : a < 800 ? 40 : 64
      strips.push(side > 0 ? { x: a, w, d: a + w / 2, side } : { x: -(a + w), w, d: -(a + w / 2), side })
      a += w
    }
  }
  let css = ''
  const one: string[] = []
  strips.forEach(({ x, w, d, side }, i) => {
    const far = Math.abs(d)
    // Where his eyes look while the mouse is over this strip: 6 levels.
    const g = (side < 0 ? 2 : 3) + side * (far < 80 ? 0 : far < 170 ? 1 : 2)
    const t = Math.round(clamp(0.26 + far / 1100, 0.3, 1.5) * 100) / 100
    const back = Math.round(clamp(far / 75, 1.2, 7) * 10) / 10
    css += `.c${i}:focus,.c${i}:focus~*{--d:${d}px;--w:${r1(deg(d))}deg;--t:${t}s;--r:${back}s;--s:${side}}`
    // y and height are set in CSS (the same for every strip), to save space.
    one.push(`class="c c${i} g${g} L@" tabindex="0" x="${x}" width="${w}"`)
  })
  let strip = ''
  let cookies = ''
  for (let k = 1; k <= LAYERS; k++) {
    strip += one.map(a => `<rect ${a.replace('@', String(k))}/>`).join('')
    cookies += cookie(k)
  }
  return { css, strips: strip, cookies }
}

// One layer's cookie: bitten three times (a mask with three growing holes),
// crumbs falling at each bite, then the last bit goes into his mouth.
function cookie(k: number): string {
  const bites = [
    [6.5, -4.5],
    [-6, -5.5],
    [1, 7],
  ]
  return (
    `<g class="cu k${k}"><g class="cc"><use href="#ck" mask="url(#bt${k})"/></g>` +
    `<mask id="bt${k}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="20" height="20">` +
    `<rect x="-10" y="-10" width="20" height="20" fill="#fff"/>` +
    bites.map(([x, y], i) => `<circle class="bt b${i}" cx="${x}" cy="${y}" r="4.2"/>`).join('') +
    `</mask>` +
    bites.map(([x], i) => `<circle class="crm r${i}" cx="${r1(x * 0.6)}" cy="3" r="1.1"/>`).join('') +
    `</g>`
  )
}

// The parts of the eating sequence that live on the robot. The robot is always
// shown, so an animation there only restarts when its name changes: clicks in
// a row alternate between set A (odd layers) and set B (even), and the 6th
// cookie (set C) adds being sick. All times count from the click; --t is the
// dash, he eats from there, and rolls home at `stay`.
const EAT = 'calc(var(--t) + .15s)'
const STAY_EAT = 'calc(var(--t) + 3s)'
const STAY_SICK = 'calc(var(--t) + 7.4s)'

function eatingCss(set: string, layers: number[], stay: string): string {
  const on = (sub: string) => layers.map(k => `.L${k}:focus~.bot${sub}`).join(',')
  const x = (name: string) => name + set
  return (
    `${on('')}{transform:translateX(var(--d));transition:transform var(--t) ${DASH};animation:${RBIN},${x('home')} var(--r) ${ROLL} ${stay} forwards}` +
    `@keyframes ${x('home')}{from{transform:translateX(var(--d))}to{transform:none}}` +
    `${on(' .sp')}{transform:rotate(var(--w));transition:transform var(--t) ${DASH};animation:${x('spin')} var(--r) ${ROLL} ${stay} forwards}` +
    `@keyframes ${x('spin')}{from{transform:rotate(var(--w))}to{transform:none}}` +
    `${on(' .ln')}{animation:${x('lean')} var(--t) ease-in-out,${x('swing')} .9s ease-out var(--t),` +
    `${x('leanb')} var(--r) ease-in-out ${stay},${x('swingb')} .9s ease-out calc(${stay} + var(--r))` +
    (set === 'C' ? `,ill 2.9s ease-in-out calc(var(--t) + 1.5s)` : '') +
    `}` +
    `@keyframes ${x('lean')}{30%,80%{transform:rotate(calc(var(--s) * -15deg))}}` +
    `@keyframes ${x('swing')}{25%{transform:rotate(calc(var(--s) * 13deg))}55%{transform:rotate(calc(var(--s) * -6deg))}80%{transform:rotate(calc(var(--s) * 2.5deg))}}` +
    `@keyframes ${x('leanb')}{30%,80%{transform:rotate(calc(var(--s) * 8deg))}}` +
    `@keyframes ${x('swingb')}{25%{transform:rotate(calc(var(--s) * -7deg))}55%{transform:rotate(calc(var(--s) * 3deg))}}` +
    `${on(' .gz')}{animation:${x('look')} var(--t) ease-out,${x('lookb')} var(--r) ease-in-out ${stay}` +
    (set === 'C' ? `,dizzy .8s linear calc(var(--t) + 4.4s) 3` : '') +
    `}` +
    `@keyframes ${x('look')}{25%,85%{transform:translate(calc(var(--s) * 6px),-1px)}}` +
    `@keyframes ${x('lookb')}{15%,85%{transform:translate(calc(var(--s) * -5px),0)}}` +
    // Chewing, then "^ ^" and a blush (no joy when he's about to be sick).
    `${on(' .mo')}{animation:${x('chew')} .34s ease-in-out ${EAT} 4` +
    (set === 'C' ? `,gag 2.2s ease-in-out calc(var(--t) + 2.3s),sickc 5.8s ease-out calc(var(--t) + 1.5s)` : '') +
    `}` +
    `@keyframes ${x('chew')}{0%,100%{transform:scale(.75,.35)}50%{transform:none}}` +
    (set === 'C'
      ? ''
      : `${on(' .lid')}{animation:${x('joy')} 1.6s ease-out calc(var(--t) + 1.3s)}@keyframes ${x('joy')}{15%,80%{transform:translateY(-10px)}}` +
        `${on(' .hop')}{animation:${x('hop')} .5s ease-out calc(var(--t) + 1.4s) 2}@keyframes ${x('hop')}{0%,100%{transform:none}35%{transform:translateY(-7px)}60%{transform:translateY(1px)}}` +
        `${on(' .bl')}{opacity:.8;transition:opacity .3s calc(var(--t) + 1.3s)}`)
  )
}

// Being sick after the 6th cookie in a row: the face goes green, his eyes
// squeeze, he leans back, lurches forward and a rainbow pours out of his mouth
// into a puddle; then dizzy eyes and droopy lids before he rolls home.
const SICK_CSS =
  `.L6:focus{pointer-events:all;x:-5000px;width:12000px;animation:gone 0s calc(var(--t) + var(--r) + 8.6s) forwards}` +
  // No petting him mid-sick (a click on him would end it): clicks go to the strip.
  `.L6:focus~.bot,.L6:focus~.bot .p{pointer-events:none}` +
  `.L6:focus~.bot .eye{animation:sickc 5.8s ease-out calc(var(--t) + 1.5s),squeeze 2.9s ease-in-out calc(var(--t) + 1.5s)}` +
  `.L6:focus~.bot .top{animation:droop 3s ease-in-out calc(var(--t) + 4.4s)}` +
  `@keyframes sickc{8%,80%{fill:#a5e05a}}` +
  `@keyframes squeeze{12%{transform:scale(1.1,.6)}22%{transform:scale(.95,.8)}32%,85%{transform:scale(1.15,.3)}}` +
  `@keyframes ill{25%{transform:rotate(calc(var(--s) * -7deg))}33%,80%{transform:rotate(calc(var(--s) * 12deg))}}` +
  `@keyframes gag{10%,88%{transform:scale(1.5,2.3)}}` +
  `@keyframes dizzy{0%,100%{transform:translate(3px,0)}25%{transform:translate(0,2px)}50%{transform:translate(-3px,0)}75%{transform:translate(0,-2px)}}` +
  `@keyframes droop{15%,80%{transform:translateY(5px)}}` +
  `.rb,.pd{display:none}.L6:focus~.bot .rb,.L6:focus~.bot .pd{display:inline}` +
  `.rbs{transform:scaleX(var(--s))}.pd{transform:scaleX(var(--s))}` +
  `.rbs path{fill:none;stroke-linecap:round;stroke-dasharray:100 200;stroke-dashoffset:100;animation:pour 1.9s linear calc(var(--t) + 2.45s)}` +
  `@keyframes pour{30%,62%{stroke-dashoffset:0}100%{stroke-dashoffset:-100}}` +
  `.pdi{transform:scale(0);animation:puddle 4.6s ease-out calc(var(--t) + 2.9s)}` +
  `@keyframes puddle{0%{transform:scale(.2)}12%,70%{transform:none;opacity:1}100%{transform:none;opacity:0}}`

// The rainbow, from his mouth (head coordinates) down to the ground beside him.
const RAINBOW = ['#ff5a5a', '#ffa24a', '#ffe14a', '#6de36a', '#4ab8ff', '#a87aff']
function rainbow(): string {
  const paths = RAINBOW.map(
    (c, i) => `<path pathLength="100" d="M0,1C15,-12 40,-6 50,43" stroke="${c}" stroke-width="${9 - i * 1.5}"/>`,
  ).join('')
  return `<g class="rb" transform="translate(0,-19)"><g class="rbs">${paths}</g></g>`
}
function puddle(): string {
  const rings = RAINBOW.filter((_, i) => i % 2 === 0)
    .map((c, i) => `<ellipse rx="${10 - i * 3}" ry="${2.2 - i * 0.6}" fill="${c}"/>`)
    .join('')
  return `<g class="pd"><g transform="translate(42,0)"><g class="pdi">${rings}</g></g></g>`
}

const DASH = 'cubic-bezier(.6,0,.25,1)'
const ROLL = 'cubic-bezier(.45,0,.55,1)'
const RBIN = `rbin .25s ease-out ${FADE_IN} backwards`
const BACK = '1s cubic-bezier(.45,0,.3,1)'

function robotParts(W: number): { css: string; tailA: string; tailB: string } {
  const H = BAND_HEIGHT
  const ground = H - 4
  const cookies = cookieParts(W)

  // Touch strips over the robot himself. While the button is held (petting), the
  // strip under the hand says which way his head leans into it.
  const pets = [-9, -4, 4, 9]
  const petZones = pets
    .map((_, i) => `<rect class="p p${i}" x="${-26 + i * 13}" y="-66" width="13" height="68"/>`)
    .join('')
  const petCss = pets.map((deg, i) => `.bot:active>.p${i}:hover~.bd .pt{transform:rotate(${deg}deg)}`).join('')

  // Where the eyes look while the mouse is over a strip, by its gaze level.
  const gazeCss = [-6, -4.5, -2.5, 2.5, 4.5, 6]
    .map((gaze, i) => `.g${i}:hover~.bot .gz{transform:translate(${gaze}px,-1px)}`)
    .join('')

  const css =
    `.s{animation-timing-function:linear;animation-iteration-count:infinite}` +
    `.mv{animation-name:mv}.tl{animation-name:tl}.wh{animation-name:wh}.ey{animation-name:ey}` +
    // He stops under the mouse, and on his spot while he fetches a cookie.
    `svg:hover .s,.mv:focus-within,.mv:focus-within .s{animation-play-state:paused}` +
    // A new drawing shows him only once the old one on top is about to go.
    `.bot{animation:${RBIN}}@keyframes rbin{from{opacity:0}}` +
    `.vp,.vq{display:none;pointer-events:none}.vq text{opacity:0}` +
    `.c{fill:#000;fill-opacity:0;pointer-events:all;outline:none}` +
    `.gz{transition:transform .22s ease-out}` +
    `.c:hover~.bot .ey{transform:none!important}` +
    gazeCss +
    `.bot:hover .ey{transform:translateY(-2px)!important}` +
    `.lid{transition:transform .25s ease-out}` +
    `.top{transform:translateY(-3px)}.eye,.top,.pt{transition:transform .45s ease-out}` +
    // Touch wins over any mood: his face goes back to rest under the happy look.
    `.mv .bot:hover .eye{transform:none}.mv .bot:hover .top{transform:translateY(-3px)}` +
    `.mv .bot:hover .gz{transform:none}.mv .bot:hover .pt{transform:none}` +
    `.zz{display:none}.zz text{animation:zz 2.6s ease-out infinite;opacity:0}.zz .z2{animation-delay:1.3s}` +
    `@keyframes zz{0%{opacity:0;transform:translate(0,0) scale(.6)}25%{opacity:.9}100%{opacity:0;transform:translate(7px,-12px) scale(1.15)}}` +
    `.bot:hover .lid{transform:translateY(-8px)}` +
    `.bot:hover .hop{animation:hop .5s ease-out}` +
    // Touch: a press squashes him and closes his eyes in bliss, a drag pets him.
    `.bot{cursor:grab}.bot:active{cursor:grabbing}` +
    `.bd{pointer-events:none}.p{fill:#000;fill-opacity:0;pointer-events:all}` +
    `.sq{transition:transform .4s cubic-bezier(.3,1.9,.5,1)}` +
    `.bot:active .sq{transform:scale(1.07,.9);transition:transform .12s ease-out}` +
    `.bot:active .lid{transform:translateY(-11px)}` +
    petCss +
    `.bl{opacity:0;transition:opacity 2.5s ease-in 1.2s}` +
    `.bot:active .bl{opacity:.8;transition:opacity .25s}` +
    `.hrt{opacity:0}.bot:active .hrt{animation:hrt 1.1s ease-out infinite}` +
    `.bot:active .h1{animation-delay:.37s}.bot:active .h2{animation-delay:.74s}` +
    `@keyframes hrt{0%{opacity:0;transform:scale(.4)}25%{opacity:1}100%{opacity:0;transform:translateY(-15px) scale(1.1)}}` +
    // A happy wobble when let go: a springy transition back from a lean, so it
    // plays only on release (an animation would also play whenever a new
    // drawing loads, under the old one still on top: a ghost).
    `.wg{transition:transform .8s cubic-bezier(.25,2.6,.45,.7)}` +
    `.bot:active .wg{transform:rotate(-4deg);transition:transform .15s ease-out}` +
    `@keyframes hop{0%,100%{transform:none}35%{transform:translateY(-7px)}60%{transform:translateY(1px)}}` +
    `.b1{animation:b1 4.7s infinite}.b2{animation:b2 7.3s infinite}` +
    `@keyframes b1{0%,94%,100%{transform:none}97%{transform:scaleY(.1)}}` +
    `@keyframes b2{0%,58%,64%,70%,100%{transform:none}61%,67%{transform:scaleY(.1)}}` +
    // The cookie game: dash to the cookie (head leaning back, eyes on it), eat
    // it, joy, then roll back; the strip lets go of the focus a while later.
    cookies.css +
    `.c{y:${-ground}px;height:${H}px}` +
    `.c:focus{animation:gone 0s calc(var(--t) + var(--r) + 5.5s) forwards}@keyframes gone{to{visibility:hidden}}` +
    // Only the layer after the focused one takes clicks.
    `.L2,.L3,.L4,.L5,.L6{pointer-events:none}` +
    `.L1:focus~.L2,.L2:focus~.L3,.L3:focus~.L4,.L4:focus~.L5,.L5:focus~.L6{pointer-events:all}` +
    `.cu{display:none;pointer-events:none;transform:translate(var(--d),-29px)}` +
    `.L1:focus~.k1,.L2:focus~.k2,.L3:focus~.k3,.L4:focus~.k4,.L5:focus~.k5,.L6:focus~.k6{display:inline}` +
    `.cc{animation:cpop .35s cubic-bezier(.3,1.8,.5,1) backwards,cgulp .22s ease-in calc(${EAT} + 1.1s) forwards}` +
    `@keyframes cpop{from{transform:scale(0)}}@keyframes cgulp{to{transform:translateY(-7px) scale(0)}}` +
    `.bt{transform:scale(0);transform-box:fill-box;transform-origin:center;animation:bite .12s ease-out forwards}` +
    `.b0{animation-delay:calc(${EAT} + .05s)}.b1{animation-delay:calc(${EAT} + .4s)}.b2{animation-delay:calc(${EAT} + .75s)}` +
    `@keyframes bite{to{transform:none}}` +
    `.crm{fill:${COLORS.cookieEdge};opacity:0;animation:crumb .6s ease-in}` +
    `.r0{animation-delay:calc(${EAT} + .05s)}.r1{animation-delay:calc(${EAT} + .4s)}.r2{animation-delay:calc(${EAT} + .75s)}` +
    `@keyframes crumb{0%{opacity:1}100%{opacity:0;transform:translateY(28px)}}` +
    // His mouth: hidden until he eats.
    `.mo{transform:scale(0);transform-box:fill-box;transform-origin:center}` +
    `.bot{transition:transform ${BACK}}.sp{transition:transform ${BACK}}` +
    // While he goes for a cookie, his mood's face is put aside: one feeling at
    // a time (Fabio, 2026-11-22: curious mixed with the coin's joy).
    `.c:focus~.bot .eye{transform:none;animation:none}.c:focus~.bot .top{transform:translateY(-3px);animation:none}` +
    `.c:focus~.bot .pt{transform:none;animation:none}.c:focus~.bot .lid{transform:none}` +
    // The roll back is an animation that ends where the focus-free style puts
    // him, so nothing moves when the focus goes.
    eatingCss('A', [1, 3, 5], STAY_EAT) +
    eatingCss('B', [2, 4], STAY_EAT) +
    eatingCss('C', [6], STAY_SICK) +
    SICK_CSS +
    // Heat from a filling context window: his whole body (head, neck, chassis,
    // wheels) reddens step by step, his lids get heavier, then he sweats.
    `.h1 .bz{stroke:#6e4a4d}.h2 .bz{stroke:#9a4044}.h3 .bz{stroke:#c8383a}` +
    `.h1 .chs{fill:#6e4a4d}.h2 .chs{fill:#9a4044}.h3 .chs{fill:#c8383a}` +
    `.h1 .rm{stroke:#86585c}.h2 .rm{stroke:#b04a4e}.h3 .rm{stroke:#e0484a}` +
    `.h1 .ty{fill:#2a1f22}.h2 .ty{fill:#3a1c1f}.h3 .ty{fill:#4a1719}` +
    `.h1 .tw{transform:translateY(1px)}.h2 .tw{transform:translateY(2px)}.h3 .tw{transform:translateY(3.5px)}` +
    `.sw{display:none}.h2 .sw1,.h3 .sw{display:inline}` +
    `.sw path{opacity:0;transform-box:fill-box;transform-origin:center;animation:drip 2.4s ease-in infinite}.sw2 path{animation-delay:1.2s}` +
    `@keyframes drip{0%{opacity:0;transform:scale(.5)}15%{opacity:.9;transform:none}100%{opacity:0;transform:translateY(16px)}}`

  const eyes =
    `<g clip-path="url(#scr)"><g class="gz"><g class="ey s"><g transform="translate(0,-31)">` +
    `<g class="b1"><g class="b2">${eyeShape(-11, 'L')}${eyeShape(11, 'R')}</g></g>` +
    `</g></g></g>` +
    `<g class="bl" fill="${COLORS.blush}"><ellipse cx="-17" cy="-21" rx="5" ry="2.5"/><ellipse cx="17" cy="-21" rx="5" ry="2.5"/></g>` +
    `<rect class="mo" x="-3.5" y="-20.75" width="7" height="3.5" rx="1.75" fill="${COLORS.eye}"/>` +
    `</g>`

  const drop = `<path d="M0,0C1,2 2.6,3.6 2.6,5.4A2.6,2.6 0 0 1 -2.6,5.4C-2.6,3.6 -1,2 0,0Z"/>`
  const head =
    `<g transform="translate(0,-24)"><g class="ln"><g class="pt"><g class="tl s">` +
    `<line class="bz" x1="0" y1="0" x2="0" y2="-13" stroke="${COLORS.bezel}" stroke-width="4" stroke-linecap="round"/>` +
    `<rect class="bz" x="-28" y="-50" width="56" height="38" rx="11" fill="${COLORS.screen}" stroke="${COLORS.bezel}" stroke-width="3.5"/>` +
    eyes +
    `<g class="sw sw1" fill="${COLORS.sweat}" transform="translate(30,-46)">${drop}</g>` +
    `<g class="sw sw2" fill="${COLORS.sweat}" transform="translate(-30,-42)">${drop}</g>` +
    rainbow() +
    `</g></g></g></g>`

  const body =
    wheelShape(-15) +
    wheelShape(15) +
    `<rect class="chs" x="-21" y="-27" width="42" height="11" rx="5.5" fill="${COLORS.bezel}"/>` +
    head

  return {
    css,
    tailA:
      `<defs><clipPath id="scr"><rect x="-26" y="-48" width="52" height="34" rx="9"/></clipPath>` +
      `<g id="ck"><circle r="7" fill="${COLORS.cookie}" stroke="${COLORS.cookieEdge}" stroke-width="1.3"/>` +
      `<g fill="${COLORS.chip}"><circle cx="-2.8" cy="-2.2" r="1.2"/><circle cx="2.6" cy="-0.6" r="1.1"/><circle cx="-0.6" cy="3" r="1.2"/><circle cx="3.2" cy="3.6" r=".8"/><circle cx="-3.8" cy="1.6" r=".7"/></g></g></defs>` +
      `<line x1="0" y1="${ground + 0.5}" x2="${W}" y2="${ground + 0.5}" stroke="${COLORS.bezel}" stroke-opacity=".45"/>` +
      `<g transform="translate(0,${ground})"><g class="mv s">`,
    tailB:
      `<g class="ix">` +
      cookies.strips +
      `<g class="bot"><ellipse cx="0" cy="0.5" rx="24" ry="2.5" fill="#000" fill-opacity=".3"/>` +
      petZones +
      `<g class="bd"><g transform="scale(${SCALE})"><g class="hop"><g class="sq"><g class="wg">${body}</g></g></g></g>` +
      puddle() +
      heart('h0', -31, -40) +
      heart('h1', 31, -46) +
      heart('h2', -27, -54) +
      `<g class="zz" transform="translate(24,-52)" fill="${COLORS.eye}" font-family="sans-serif" font-weight="700">` +
      `<text class="z1" font-size="9">z</text><text class="z2" x="5" y="-3" font-size="7">z</text></g>` +
      `<g class="vq" transform="translate(20,-58)" fill="${COLORS.eye}" font-family="sans-serif" font-weight="700" font-size="11">` +
      `<text class="vq1">?</text><text class="vq2" x="1">!</text></g>` +
      `</g></g>` +
      cookies.cookies +
      `</g></g></g></svg>`,
  }
}

// A small heart that floats up while he is being petted.
function heart(cls: string, x: number, y: number): string {
  return (
    `<g transform="translate(${x},${y})"><path class="hrt ${cls}" fill="${COLORS.blush}" ` +
    `d="M0,3C-5,-1 -3.5,-5.5 0,-2.2C3.5,-5.5 5,-1 0,3Z"/></g>`
  )
}

// Eye glances move in x and y together, so they share one keyframe set: a
// sample is kept when either axis needs it.
function eyeKeyframes(xs: number[], ys: number[]): string {
  const n = xs.length
  const keep = new Set([...simplify(xs, 0.25), ...simplify(ys, 0.25)])
  const stops = [...keep]
    .sort((a, b) => a - b)
    .map(i => `${pct(i, n)}{transform:translate(${r1(xs[i])}px,${r1(ys[i])}px)}`)
  stops.push(`100%{transform:translate(${r1(xs[0])}px,${r1(ys[0])}px)}`)
  return `@keyframes ey{${stops.join('')}}`
}
