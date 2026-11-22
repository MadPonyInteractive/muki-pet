// Writes the robot SVG to a folder so it can be watched in a browser without
// the Claude app. Usage: node tools/preview.mjs <out-folder> [width]
// Then serve the folder and open /robot.svg (file:/// gives a static snapshot).
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const { robotSvg, BAND_HEIGHT } = await import(pathToFileURL(join(here, '..', 'muki-pet', 'hooks', 'draw', 'index.ts')).href)

const out = process.argv[2]
if (!out) {
  console.error('usage: node tools/preview.mjs <out-folder> [width]')
  process.exit(1)
}
const width = Number(process.argv[3] ?? 760)
mkdirSync(out, { recursive: true })
const svg = robotSvg(width)
writeFileSync(join(out, 'robot.svg'), svg)
writeFileSync(
  join(out, 'index.html'),
  `<!doctype html><body style="margin:0;padding:40px;background:#1e1e1e">` +
    `<img src="robot.svg" width="${width}" height="${BAND_HEIGHT}" style="border:1px dashed #444">` +
    `<p style="color:#888;font:13px system-ui">Image view (no hover). Open <a style="color:#5ee7f0" href="robot.svg">robot.svg</a> for hover.</p>`,
)
console.log(`wrote ${svg.length} characters to ${join(out, 'robot.svg')}`)
