# Project

Governs all work on the Muki mod in this repo.

## Rules

- Start by reading `docs/README.md` and the newest file in `docs/handoffs/`. Write findings, failed attempts and decisions into `docs/` the same day; `docs/log/` is append-only.
- Edit the mod in `muki-pet/` only. It loads in every chat from this folder (`CLAUDE_CODE_PLUGIN_DIRS`); a `~/.claude/dev-mods/` copy is obsolete.
- `robotSvg()` in `muki-pet/hooks/draw/index.ts` stays pure: the same options always give the same string, so redraws do not restart the animation.
- Never drive animation through `ui.render` redraws. Motion is pre-simulated CSS keyframes inside one interactive `Svg`.
- Never carry motion across drawings with the hook's clock; every drawing starts him resting at home.
- Keep the Svg alt constant. Desktop keeps the iframe only if source, alt, width and height are all identical.
- Every hook calls `next(e)` and returns its result untouched, with its own code in `try`.
- The SVG string must stay under 131,072 characters; check the widest band after changing it.
- Files in `muki-pet/` are LF in the index and the working tree (`git ls-files --eol`, 2026-11-22; git's "LF will be replaced by CRLF" warning is `core.autocrlf` talk, not the file). Still, a Python edit that writes `'\n'` into a JS string can become a real line break.
- Before claiming done: `npm run check` (type-check) exits 0, `node tools/golden.mjs` says identical (or the change is meant to alter drawings: then `--write` and say which), `claude plugin test ./muki-pet` and `claude plugin validate ./muki-pet` pass.
- Classes load in the mod (spike 2026-11-22), but no class may hold `$` or take it in a method: `$` goes only to top-level function declarations.
- One definition per thing: what he is (moods, props, heat levels, colours, timings, band geometry) lives once in `muki-pet/hooks/character/`. `character/` imports nothing from `brain/`, `draw/` or `band/`, and `brain/` never imports `draw/`.
- Original character only: no Emo (Living.AI) or Wall-E look, no Claude branding or mascot. Label it "unofficial". MIT licence.

## Sub-Agent Briefing

Muki is an unofficial Claude Code mod: a robot pet drawn as one interactive SVG in the band above the chat input in Claude Desktop. Code is in `muki-pet/hooks/`: `register.tsx` wires events to the brain, `brain/` (pure state machine + runtime), `band/` (draws the band, double buffer), `draw/` (pure SVG builder, `robotSvg` in `draw/index.ts`), `character/` (what he is, as data: moods, props, heat, palette, tuning, geometry; read by brain and draw, imports neither), tests `register.test.tsx` and `brain/machine.test.ts`. Design and architecture are in `docs/design/robot.md` and `docs/architecture/how-it-works.md`.

- Checks: `npm run check` (TypeScript, from the repo root; `npm install` once), `node tools/golden.mjs` (drawings unchanged), `claude plugin validate ./muki-pet` and `claude plugin test ./muki-pet`, run with the Desktop app's claude.exe (path in the newest `docs/handoffs/` file).
- Preview without the app: `node tools/preview.mjs <out-folder>`.
- `robotSvg()` must stay pure (same options, same string). Do not animate by redrawing; do not use the hook's clock to place him; keep the Svg alt constant.
- Every hook calls `next(e)` and returns its result untouched, inside `try`.
- Keep the SVG under 131,072 characters at the widest band.
- Never write a literal `'\n'` into JS strings from a script edit.
- No class may hold `$` or take it in a method.
- Never edit a `~/.claude/dev-mods/` copy, never add Claude branding or copy Emo / Wall-E.
- Record what you found or tried (including failures) for the lead to put in `docs/`.

## Notes

Sources: `CLAUDE.md`, `docs/architecture/how-it-works.md`, the 2026-11-22 handoffs and the project memory. Split specific rules out of this file as real conventions appear.
