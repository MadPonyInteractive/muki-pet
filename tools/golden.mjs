// Golden drawings: proves a refactor changed nothing he draws.
// Runs robotSvg and visitPlan over a matrix of options and compares a hash of
// each result with tools/golden.json.
//   node tools/golden.mjs          compare; exits 1 and lists the first changes
//   node tools/golden.mjs --write  record the current drawings as the reference
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const file = join(here, 'golden.json')
const { robotSvg, visitPlan, MOODS, PROPS } = await import(pathToFileURL(join(here, '..', 'eyebot', 'hooks', 'draw', 'index.ts')).href)

const WIDTHS = [300, 520, 784, 792, 1200, 2400]
const HOMES = [0, 0.25, 0.5, 0.9, 1]
const FROMS = [0.1, 0.5, 0.9]
const NS = [1, 2, 7]
const ELAPSED = [0, 1, 3, 100]

const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 16)
const got = {}
let widest = 0
const draw = (key, W, o) => {
  const svg = robotSvg(W, o)
  widest = Math.max(widest, svg.length)
  got[key] = hash(svg)
}

for (const W of WIDTHS) {
  draw(`${W} plain`, W, undefined)
  for (const mood of MOODS) for (const from of [undefined, ...MOODS]) draw(`${W} ${mood}<${from}`, W, { mood, from })
  for (const heat of [0, 1, 2, 3]) for (const mood of MOODS) draw(`${W} heat${heat} ${mood}`, W, { heat, mood })
  for (const home of HOMES) for (const mood of ['neutral', 'happy', 'focused']) draw(`${W} home${home} ${mood}`, W, { home, mood })
  for (const prop of PROPS)
    for (const from of FROMS)
      for (const n of NS) {
        got[`${W} plan ${from} ${n}`] = hash(JSON.stringify(visitPlan(W, from, n)))
        for (const elapsed of ELAPSED)
          for (const mood of ['neutral', 'focused'])
            draw(`${W} visit ${prop} ${from} ${n} ${elapsed} ${mood}`, W, { mood, heat: n % 4, visit: { prop, from, n, elapsed } })
      }
}

const count = Object.keys(got).length
if (process.argv.includes('--write')) {
  writeFileSync(file, JSON.stringify(got, null, 1) + '\n')
  console.log(`recorded ${count} drawings; widest ${widest} characters`)
  process.exit(0)
}
if (!existsSync(file)) {
  console.error('no tools/golden.json yet: run with --write on a known-good tree')
  process.exit(1)
}
const want = JSON.parse(readFileSync(file, 'utf8'))
const changed = Object.keys({ ...want, ...got }).filter((k) => want[k] !== got[k])
if (changed.length) {
  console.error(`${changed.length} of ${count} drawings changed, for example:`)
  for (const k of changed.slice(0, 10)) console.error(`  ${k}${k in got ? '' : ' (gone)'}${k in want ? '' : ' (new)'}`)
  process.exit(1)
}
console.log(`identical: ${count} drawings; widest ${widest} characters`)
