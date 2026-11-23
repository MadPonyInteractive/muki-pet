// Checks that Muki's version is said the same way everywhere:
// - `version` in muki-pet/.claude-plugin/plugin.json (the one place it is set:
//   users keep their cached copy until it changes, so every release raises it)
// - the newest `## <version>` heading in CHANGELOG.md
// - no `version` in the marketplace entry (the manifest's would win silently)
// - a git tag `v<version>`, if there is one, points at a commit that has this
//   version (a tag on an older commit means the number wasn't raised)
// Usage: node tools/version-check.mjs
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')
const fail = (msg) => {
  console.error(`version check failed: ${msg}`)
  process.exit(1)
}

const version = JSON.parse(read('muki-pet/.claude-plugin/plugin.json')).version
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) fail(`plugin.json version "${version}" is not x.y.z`)

const newest = read('CHANGELOG.md').match(/^## (\S+)/m)?.[1]
if (newest !== version) fail(`CHANGELOG.md's newest entry is ${newest ?? 'missing'}, plugin.json says ${version}`)

const entries = JSON.parse(read('.claude-plugin/marketplace.json')).plugins
if (entries.some((p) => 'version' in p)) fail('marketplace.json sets a version; keep it in plugin.json only')

let tagged
try {
  tagged = execFileSync('git', ['show', `v${version}:muki-pet/.claude-plugin/plugin.json`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
} catch {
  // No tag yet: this version isn't released, which is fine.
}
if (tagged && JSON.parse(tagged).version !== version) fail(`tag v${version} points at a commit with version ${JSON.parse(tagged).version}`)

console.log(`version ${version}: plugin.json, CHANGELOG.md${tagged ? ` and tag v${version}` : ' (not tagged yet)'} agree`)
