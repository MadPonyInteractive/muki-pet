// Writes the plugin icon (muki-pet/.claude-plugin/icon.png): his screen head
// and eyes, drawn from the mod's own shapes, as a 1024 px square PNG.
// Usage: node tools/icon.mjs [out.png] [--blush]
// Needs Chrome (headless screenshot); rerun when his face changes.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const mod = (p) => import(pathToFileURL(join(here, '..', 'muki-pet', 'hooks', ...p.split('/'))).href)
const { face, FACE_DEFS } = await mod('draw/parts/face.ts')
const { COLORS } = await mod('character/palette.ts')

const args = process.argv.slice(2)
const out = resolve(args.find((a) => !a.startsWith('--')) ?? join(here, '..', 'muki-pet', '.claude-plugin', 'icon.png'))
const blush = args.includes('--blush')
const SIZE = 1024

// The screen is 56 x 38 at (-28,-50) in head coordinates; centre it in a 72-unit square.
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="-36 -67 72 72">` +
  `<defs>${FACE_DEFS}</defs>` +
  // At rest the mouth is hidden, and the blush shows only on a pet. The lids
  // sit just off the eyes; hidden here, so a big render shows no notch.
  `<style>.mo,.top,.lid{display:none}.bl{opacity:${blush ? 0.8 : 0}}</style>` +
  `<rect x="-36" y="-67" width="72" height="72" fill="#1e262b"/>` +
  `<rect x="-28" y="-50" width="56" height="38" rx="11" fill="${COLORS.screen}" stroke="${COLORS.bezel}" stroke-width="3.5"/>` +
  face() +
  `</svg>`

// Chrome, not Edge: Edge's launcher returns before its screenshot is written.
const browser = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => p && existsSync(p))
if (!browser) throw new Error('no Chrome found for the headless screenshot (set CHROME to its path)')

const dir = mkdtempSync(join(tmpdir(), 'muki-icon-'))
try {
  const page = join(dir, 'icon.html')
  writeFileSync(page, `<!doctype html><body style="margin:0;overflow:hidden">${svg}`)
  execFileSync(browser, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    `--user-data-dir=${join(dir, 'profile')}`,
    `--window-size=${SIZE},${SIZE}`,
    `--screenshot=${out}`,
    pathToFileURL(page).href,
  ], { stdio: 'ignore' })
} finally {
  rmSync(dir, { recursive: true, force: true })
}
console.log(`wrote ${out}`)
