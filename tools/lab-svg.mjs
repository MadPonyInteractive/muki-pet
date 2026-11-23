// Writes a drawing from the current code for tools/frame-lab.html, so lab
// drawings never go stale. Usage:
//   node tools/lab-svg.mjs <preset> [width]      presets: see PRESETS
//   node tools/lab-svg.mjs '<robotSvg options as JSON>' [width]
// Writes tools/frame-lab-<preset>.svg (or frame-lab-custom.svg) and prints the
// lab URL. Generated files are git-ignored; the small hand-written proofs
// (frame-lab-coin-test.svg, frame-lab-ladder-test.svg) stay in git.

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const { robotSvg } = await import(pathToFileURL(join(here, '..', 'muki-pet', 'hooks', 'draw', 'index.ts')).href)

const PRESETS = {
  // At rest: touch, boops, cookies, the gaze strips.
  boop: { mood: 'neutral' },
  // A mad visit: he kicks the prop away.
  kick: { mood: 'mad', visit: { prop: 'file', from: 0.15, n: 1, elapsed: 0 } },
  // A visit to a pile of 4 papers.
  papers: { mood: 'neutral', pile: { count: 4, visit: { from: 0.15, n: 1, elapsed: 0 } } },
  // A tantrum (the burst comes 2 s in).
  tantrum: { mood: 'tantrum', heat: 0 },
}

const [arg, w] = process.argv.slice(2)
if (!arg) {
  console.log(`usage: node tools/lab-svg.mjs <${Object.keys(PRESETS).join('|')}|'{json}'> [width]`)
  process.exit(1)
}
const name = arg in PRESETS ? arg : 'custom'
const options = arg in PRESETS ? PRESETS[arg] : JSON.parse(arg)
const width = Number(w ?? 760)
const file = `frame-lab-${name}.svg`
writeFileSync(join(here, file), robotSvg(width, options))
console.log(`wrote tools/${file}; serve tools/ (python -m http.server 8765 --bind 127.0.0.1) and open`)
console.log(`http://127.0.0.1:8765/frame-lab.html?src=${file}&w=${width}&h=76`)
