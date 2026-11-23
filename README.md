# Muki (project and plugin: muki-pet)

An unofficial, open-source companion mod for Claude Code: a small robot pet whose face is two big expressive eyes. Work in progress.

See `CLAUDE.md` for the plan and `prototype/face.html` for the face sketch (open it in a browser).

## Develop

You need Node 22.18 or newer (it runs the `.ts` files directly) and Claude Code (the `claude` CLI).

1. `npm install` (dev tools only: the mod itself has no dependencies).
2. Get the mod's TypeScript types: run `claude --plugin-dir ./muki-pet` once from the repo root, then quit it (`/exit`). Claude Code writes the types for your version into `muki-pet/.claude-plugin/types/` when it loads the mod. They aren't committed, and change with each Claude Code release, so do this again after an update.
3. `npm test` runs the four checks: type-check, golden drawings, `claude plugin test` and `claude plugin validate`. If the `claude` on your PATH is older than the app's, point `CLAUDE` at the newer binary.

`node tools/preview.mjs <folder>` previews the robot without the app. `npm run icon` redraws the plugin icon from his face (needs Chrome).

## Licence

MIT, see `LICENSE`.
