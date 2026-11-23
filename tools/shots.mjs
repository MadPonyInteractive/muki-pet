// Writes the README's still pictures of Muki into docs/images/, drawn from the
// mod's own code. Rerun it when his look changes.
// Usage: node tools/shots.mjs [name ...]      (no names: all of them)
// Needs Chrome. It drives a headless Chrome over its DevTools protocol, so the
// pictures come from the real drawing: real mouse moves, clicks and held
// buttons for the play shots, then every animation paused at the chosen moment.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const mod = (p) => import(pathToFileURL(join(here, '..', 'muki-pet', 'hooks', ...p.split('/'))).href)
const { robotSvg, visitPlan, BAND_HEIGHT, PROPS } = await mod('draw/index.ts')
const { pilePlan } = await mod('character/papers.ts')

const OUT = join(here, '..', 'docs', 'images')
const W = 760 // band width
const HOME = 0.5
const BG = '#1e1e1e' // a dark chat background, as in Desktop's dark theme
const SCALE = 2 // pixels per band pixel, so the pictures are crisp
const PAD = 16 // around what a shot shows
const MIN_W = 180
const MIN_W_STRIP = 110

// One shot: the drawing's options, then either `at` (every animation of the
// drawing seeked to that moment, in ms) or `act` (mouse steps in real time,
// after which everything is paused where it is). `show` lists what the
// picture must include besides him (a prop, the pile, the fireworks).
const shot = (options, more = {}) => ({ options: { home: HOME, ...options }, at: 1500, show: [], ...more })

// Mouse steps, as offsets from his middle (x) and the band's top (y).
const hover = { move: [0, 40] }
const SHOTS = {
  resting: shot({ mood: 'neutral' }),
  wandering: shot({ mood: 'neutral' }, { at: 8450 }),
  ...strip('moods', ['alert', 'focused', 'happy', 'sad', 'curious', 'sleepy', 'asleep'].map((mood) => [mood, shot({ mood }, { at: 1500 })])),
  ...strip(
    'props',
    // A visit's drawing has the visit's end spot as his home, as the brain does.
    PROPS.map((prop) => [
      prop,
      shot({ mood: 'focused', home: visitPlan(W, HOME, 1).toU, visit: { prop, from: HOME, n: 1, elapsed: 0 } }, { at: 3300, show: ['.vp'] }),
    ]),
  ),
  // The pile lies at the right end of the band, so he lives near it here. The
  // eye roll's middle: arrival (pilePlan) + 0.85 s + half the roll.
  ...strip('pile', [
    ['papers waiting', shot({ mood: 'neutral', home: 0.85, pile: { count: 6 } }, { show: ['.pl'] })],
    ['ugh, work', shot({ mood: 'neutral', home: pilePlan(W, 0.85, 1).toU, pile: { count: 6, visit: { from: 0.85, n: 1, elapsed: 0 } } }, { at: 3750, show: ['.pl'] })],
  ]),
  ...strip('heat', [['cool', shot({ heat: 0 })], ['warm', shot({ heat: 1 })], ['hot', shot({ heat: 2 })], ['suffering', shot({ heat: 3 })]]),
  ...strip('attention', [
    ['lonely', shot({ mood: 'lonely' }, { at: 1500 })],
    ['mad', shot({ mood: 'mad' }, { at: 1500 })],
    // The burst starts 2 s in; the heart cracks 0.6 s later.
    ['tantrum', shot({ mood: 'tantrum' }, { at: 2950 })],
  ]),
  ...strip('play', [
    ['pet', shot({ mood: 'neutral' }, { act: [hover, { wait: 300 }, { down: true }, { wait: 1200 }] })],
    ['boop', shot({ mood: 'neutral' }, { act: [hover, { wait: 300 }, { click: true }, { wait: 250 }] })],
    ['cookie', shot({ mood: 'neutral' }, { act: [{ move: [130, 40] }, { click: true }, { move: [0, 200] }, { wait: 1300 }] })],
    [
      'sick',
      shot({ mood: 'neutral' }, {
        act: [...Array.from({ length: 6 }, (_, i) => [{ move: [120 + 10 * i, 40] }, { click: true }, { wait: 150 }]).flat(), { move: [0, 200] }, { wait: 3500 }],
        show: ['.pd'],
      }),
    ],
  ]),
  celebrate: shot({ mood: 'celebrate' }, { at: 2700, show: ['.fw'] }),
  headset: shot({ mood: 'neutral', headset: 'on' }, { show: ['.hs'] }),
}

// Shots shown side by side in one picture, with a word under each. The parts
// are drawn to a temp folder; only the strip lands in docs/images.
function strip(name, parts) {
  const entries = Object.fromEntries(parts.map(([label, s]) => [`${name}-${label}`, { ...s, part: name, label }]))
  return { ...entries, [name]: { strip: Object.keys(entries) } }
}

const browser = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => p && existsSync(p))
if (!browser) throw new Error('no Chrome found (set CHROME to its path)')

const wanted = process.argv.slice(2)
for (const w of wanted) if (!(w in SHOTS)) throw new Error(`no shot named ${w}; shots: ${Object.keys(SHOTS).join(', ')}`)
// A strip asked for by name draws its parts too.
const names = (wanted.length ? wanted : Object.keys(SHOTS)).flatMap((n) => (SHOTS[n].strip ? [...SHOTS[n].strip, n] : [n]))
const todo = [...new Set(names)]

const dir = mkdtempSync(join(tmpdir(), 'muki-shots-'))
mkdirSync(OUT, { recursive: true })
const chrome = spawn(browser, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--remote-debugging-port=0',
  `--user-data-dir=${join(dir, 'profile')}`,
  'about:blank',
], { stdio: 'ignore' })

let cdp
try {
  cdp = await connect(join(dir, 'profile', 'DevToolsActivePort'))
  for (const name of todo) {
    const s = SHOTS[name]
    const file = s.part ? join(dir, `${name}.png`) : join(OUT, `${name}.png`)
    if (s.strip) await drawStrip(s.strip, file)
    else await drawShot(s, file)
    // The width to give its <img> in the README, so every picture shows at the same scale.
    if (!s.part) console.log(`wrote docs/images/${name}.png (width="${readFileSync(file).readUInt32BE(16) / SCALE}")`)
  }
  await cdp.send('Browser.close', {}, false)
} finally {
  cdp?.close()
  chrome.kill()
  // Chrome lets go of its profile a moment after it closes.
  for (let i = 0; i < 20 && existsSync(dir); i++) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      await sleep(250)
    }
  }
}

async function drawShot(s, file) {
  const page = join(dir, 'shot.html')
  writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${BG}}#band{width:${W}px;height:${BAND_HEIGHT}px}#band>svg{display:block;width:100%;height:100%}</style>` +
      `<div id="band">${robotSvg(W, s.options)}</div>`,
  )
  // The page is taller than the band, so the mouse can rest off him.
  await cdp.page('Emulation.setDeviceMetricsOverride', { width: W, height: BAND_HEIGHT + 200, deviceScaleFactor: SCALE, mobile: false })
  await cdp.page('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: BAND_HEIGHT + 150 })
  await load(page)
  await sleep(100)
  const mid = await evaluate(`(() => { const r = document.querySelector('.bot').getBoundingClientRect(); return r.x + r.width / 2 })()`)
  if (s.act) {
    // He fades in at FADE_IN (.75 s): play only once he's there.
    await sleep(900)
    let down = false
    let at = [mid, 40]
    for (const step of s.act) {
      if (step.move) {
        at = [mid + step.move[0], step.move[1]]
        await cdp.page('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at[0], y: at[1], buttons: down ? 1 : 0 })
      }
      if (step.down) {
        down = true
        await cdp.page('Input.dispatchMouseEvent', { type: 'mousePressed', x: at[0], y: at[1], button: 'left', buttons: 1, clickCount: 1 })
      }
      if (step.click) {
        await cdp.page('Input.dispatchMouseEvent', { type: 'mousePressed', x: at[0], y: at[1], button: 'left', buttons: 1, clickCount: 1 })
        await cdp.page('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at[0], y: at[1], button: 'left', buttons: 0, clickCount: 1 })
      }
      if (step.wait) await sleep(step.wait)
    }
    await evaluate(`document.getAnimations().forEach((a) => a.pause())`)
  } else {
    // Ones already paused wait for a hand (the tantrum's calm-down latch):
    // seeking them would play it.
    await evaluate(`document.getAnimations().forEach((a) => { if (a.playState === 'paused') return; a.pause(); a.currentTime = ${s.at} })`)
  }
  // What to show: his body (`.bd`, not `.bot`, whose touch strips are wide) and the shot's extras, across the band's full height.
  const box = await evaluate(`(() => {
    const rs = ${JSON.stringify(['.bd', ...s.show])}.flatMap((q) => [...document.querySelectorAll(q)])
      .map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height)
    return [Math.min(...rs.map((r) => r.left)), Math.max(...rs.map((r) => r.right))]
  })()`)
  let [x0, x1] = [box[0] - PAD, box[1] + PAD]
  // Shots in a strip are cropped tighter, so a row fits a README's width.
  const minW = s.part ? MIN_W_STRIP : MIN_W
  if (x1 - x0 < minW) [x0, x1] = [(x0 + x1 - minW) / 2, (x0 + x1 + minW) / 2]
  x0 = Math.max(0, Math.round(x0))
  x1 = Math.min(W, Math.round(x1))
  await snap(file, { x: x0, y: 0, width: x1 - x0, height: BAND_HEIGHT })
  // Let go of the button, so the next page starts clean.
  if (s.act?.some((step) => step.down)) await cdp.page('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 5, y: BAND_HEIGHT + 150, button: 'left', buttons: 0, clickCount: 1 })
}

async function drawStrip(parts, file) {
  const page = join(dir, 'strip.html')
  const figures = parts
    .map((p) => `<figure><img src="${pathToFileURL(join(dir, `${p}.png`)).href}" style="height:${BAND_HEIGHT}px"><figcaption>${SHOTS[p].label}</figcaption></figure>`)
    .join('')
  writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${BG}}` +
      `#row{display:inline-flex;gap:4px;padding:6px 8px 10px}figure{margin:0;text-align:center}img{display:block}` +
      `figcaption{color:#9aa4aa;font:12px system-ui,sans-serif;margin-top:2px}</style><div id="row">${figures}</div>`,
  )
  await cdp.page('Emulation.setDeviceMetricsOverride', { width: 2400, height: 400, deviceScaleFactor: SCALE, mobile: false })
  await load(page)
  const r = await evaluate(`(() => { const r = document.getElementById('row').getBoundingClientRect(); return { x: 0, y: 0, width: Math.ceil(r.width), height: Math.ceil(r.height) } })()`)
  await snap(file, r)
}

async function snap(file, clip) {
  const { data } = await cdp.page('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } })
  writeFileSync(file, Buffer.from(data, 'base64'))
}

async function load(page) {
  const loaded = cdp.once('Page.loadEventFired')
  await cdp.page('Page.navigate', { url: pathToFileURL(page).href })
  await loaded
}

async function evaluate(expression) {
  const r = await cdp.page('Runtime.evaluate', { expression, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
  return r.result.value
}

// A small DevTools-protocol client: one socket to the browser, one page.
async function connect(portFile) {
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100)
  await sleep(100)
  const [port, path] = readFileSync(portFile, 'utf8').trim().split('\n')
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`)
  await new Promise((ok, fail) => ((ws.onopen = ok), (ws.onerror = fail)))
  let id = 0
  const waiting = new Map()
  const listeners = new Map()
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data)
    if (m.id && waiting.has(m.id)) {
      const { ok, fail } = waiting.get(m.id)
      waiting.delete(m.id)
      m.error ? fail(new Error(`${m.error.message} ${m.error.data ?? ''}`)) : ok(m.result)
    } else if (m.method && listeners.has(m.method)) {
      listeners.get(m.method)(m.params)
      listeners.delete(m.method)
    }
  }
  const send = (method, params = {}, answer = true, sessionId) =>
    answer
      ? new Promise((ok, fail) => {
          waiting.set(++id, { ok, fail })
          ws.send(JSON.stringify({ id, method, params, sessionId }))
        })
      : ws.send(JSON.stringify({ id: ++id, method, params, sessionId }))
  const { targetInfos } = await send('Target.getTargets')
  const target = targetInfos.find((t) => t.type === 'page')
  const { sessionId } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true })
  const page = (method, params) => send(method, params, true, sessionId)
  await page('Page.enable')
  return {
    send,
    page,
    once: (method) => new Promise((ok) => listeners.set(method, ok)),
    close: () => ws.close(),
  }
}

function sleep(ms) {
  return new Promise((ok) => setTimeout(ok, ms))
}
