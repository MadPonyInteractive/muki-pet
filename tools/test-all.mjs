// `npm test`: the four checks in one go, stopping at the first failure.
// 1. type-check (needs the engine-written types; see README § Develop)
// 2. golden drawings
// 3. claude plugin test
// 4. claude plugin validate
// The Claude Code CLI is `claude` on PATH; set CLAUDE to another binary's path
// (for example the one the desktop app ships, when PATH has an older one).
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const claude = process.env.CLAUDE || 'claude'

if (!existsSync(join(root, 'muki-pet', '.claude-plugin', 'types', 'claude-code', 'index.d.ts'))) {
  console.error('No types yet: run `claude --plugin-dir ./muki-pet` once, then quit it (README § Develop).')
  process.exit(1)
}

const steps = [
  ['type-check', process.execPath, [join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'muki-pet']],
  ['golden', process.execPath, [join(root, 'tools', 'golden.mjs')]],
  ['plugin test', claude, ['plugin', 'test', './muki-pet']],
  ['plugin validate', claude, ['plugin', 'validate', './muki-pet']],
]

for (const [name, cmd, args] of steps) {
  console.log(`\n== ${name}`)
  // A bare `claude` on Windows may be an npm `.cmd` shim, which only a shell finds.
  const shell = process.platform === 'win32' && cmd === 'claude'
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell })
  if (r.status !== 0) {
    console.error(`\n${name} failed${r.error ? `: ${r.error.message}` : ''}`)
    process.exit(r.status || 1)
  }
}
console.log('\nAll four checks passed.')
