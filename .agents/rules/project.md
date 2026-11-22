# Project

Governs all work on the Eyebot mod in this repo.

## Rules

- Start by reading `docs/README.md` and the newest file in `docs/handoffs/`. Write findings, failed attempts and decisions into `docs/` the same day; `docs/log/` is append-only.
- Edit the mod in `eyebot/` only. It loads in every chat from this folder (`CLAUDE_CODE_PLUGIN_DIRS`); a `~/.claude/dev-mods/` copy is obsolete.
- `robotSvg()` in `eyebot/hooks/robot.ts` stays pure: the same options always give the same string, so redraws do not restart the animation.
- Never drive animation through `ui.render` redraws. Motion is pre-simulated CSS keyframes inside one interactive `Svg`.
- Never carry motion across drawings with the hook's clock; every drawing starts him resting at home.
- Keep the Svg alt constant. Desktop keeps the iframe only if source, alt, width and height are all identical.
- Every hook calls `next(e)` and returns its result untouched, with its own code in `try`.
- The SVG string must stay under 131,072 characters; check the widest band after changing it.
- `register.tsx` and `robot.ts` have CRLF line endings. A Python edit that writes `'\n'` into a JS string can become a real line break.
- Original character only: no Emo (Living.AI) or Wall-E look, no Claude branding or mascot. Label it "unofficial". MIT licence.

## Sub-Agent Briefing

Eyebot is an unofficial Claude Code mod: a robot pet drawn as one interactive SVG in the band above the chat input in Claude Desktop. Code is in `eyebot/` (`hooks/register.tsx` = hooks module, `hooks/robot.ts` = pure SVG builder, `hooks/register.test.tsx` = tests). Design and architecture are in `docs/design/robot.md` and `docs/architecture/how-it-works.md`.

- Checks: `claude plugin validate ./eyebot` and `claude plugin test ./eyebot`, run with the Desktop app's claude.exe (path in the newest `docs/handoffs/` file). There is no TypeScript compiler.
- Preview without the app: `node tools/preview.mjs <out-folder>`.
- `robotSvg()` must stay pure (same options, same string). Do not animate by redrawing; do not use the hook's clock to place him; keep the Svg alt constant.
- Every hook calls `next(e)` and returns its result untouched, inside `try`.
- Keep the SVG under 131,072 characters at the widest band.
- `register.tsx` and `robot.ts` are CRLF; never write a literal `'\n'` into JS strings from a script edit.
- Never edit a `~/.claude/dev-mods/` copy, never add Claude branding or copy Emo / Wall-E.
- Record what you found or tried (including failures) for the lead to put in `docs/`.

## Notes

Sources: `CLAUDE.md`, `docs/architecture/how-it-works.md`, the 2026-11-22 handoffs and the project memory. Split specific rules out of this file as real conventions appear.
