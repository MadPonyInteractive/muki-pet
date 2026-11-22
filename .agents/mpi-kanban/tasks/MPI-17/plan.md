# Review fixes, public-readiness and the README with pictures

## Current State

Project mode: mvp. Source: the codebase review of 2026-11-22 (Fabio asked for all of it as one plan, with the README last).

- All four checks pass at the start: `npm run check`, `node tools/golden.mjs` (3,534 drawings identical, widest 98,563 characters), `claude plugin test ./muki-pet` (49 pass), `claude plugin validate ./muki-pet` (one warning: no icon).
- The three bugs in Phase 1 were found by reading the code. None was seen live. Reproduce each in a test before fixing it; if one can't be reproduced, record that in `## Plan Drift` and skip the fix.
- Drawing size is not a worry: the heaviest drawing is 100,733 characters at 3840 px (limit 131,072).
- Rules that apply throughout: `.agents/rules/project.md` (pure `robotSvg`, no redraw from play, every hook returns `next(e)` untouched inside `try`, `$` only to top-level functions, the four checks before "done").
- Run phases in order, one at a time. No parallel batch: the phases are small and several touch the same files (`register.tsx`, `runtime.ts`, the docs).

## Completed

- [ ] Nothing yet.

## Remaining Work

## Phase 1: Likely bugs

- [ ] **The band's render hook gets a safety net.** `muki-pet/hooks/band/render.tsx` `renderBand` runs Muki's code with no `try` (only the clock read has one), so a throw in `readHome`, `send`, `drawingFor` or `swapIn` can take down what other mods drew in the band (the context bar). Keep `const below = await next(e)` outside; wrap everything after it and return `below` on failure. **Verify:** a new test in `register.test.tsx` where the drawing throws (for example a store or clock that rejects) still returns the other mod's elements; the four checks pass.
- [ ] **Heat is saved per chat.** `brain/runtime.ts` `readHeat` saves the context percentage under one key (`STORE_HEAT = 'context'`) in a store shared by all chats, and a chat with no figure yet reads it back, so a new chat can start hot from another chat's context. Save it per session id, the way `brain/pile-store.ts` saves the paper pile (`{ <session id>: value }`, newest 20 kept); consider one shared helper for both. An old plain-number value is ignored. **Verify:** a test with two session ids: chat A at 45%, chat B with no usage figure draws at heat 0; chat A reloaded with no figure still draws hot.
- [ ] **"Curious" ends only when the asked tool ends.** `register.tsx` `tool.call` sends `toolDone` for every tool (sub-agents' and parallel ones too), and `activity.ts` moves `asking` back on any `toolDone`. Carry the tool's id: `toolAsk` remembers `e.tool_use_id` (already required at `tool.check`), `toolDone` carries its own id, and `asking` resumes only on the matching one (a `turnComplete` still ends it). Decide in the same step whether a sub-agent's failed tool should sadden him; my pick: no, add `!e.agentId` to the `failed` reaction only, and still pass the id so an asked sub-agent tool ends the question. Read the generated types (`muki-pet/.claude-plugin/types/`) for the id field on `tool.call` first. **Verify:** machine tests: ask for tool A, tool B done → still curious; tool A done → back to work. The existing activity-table test still passes.

## Phase 2: Safety net

- [ ] **Golden drawings cover the paper pile and the headset.** `tools/golden.mjs` never passes `pile` or `headset`. Add: pile counts 1, 3, 6 at rest; a pile visit at a few `elapsed` values; headset `on`, `drop`, `lift`; one pile + headset + heat combination per width. Run with `--write` and say so in the commit (new keys only: the existing 3,534 hashes must not change). Add the heaviest combination (tantrum, heat 3, pile 6, headset) to the size test in `register.test.tsx`. **Verify:** `node tools/golden.mjs` reports the old keys identical before `--write`, then a higher count after; the size test passes.
- [ ] **The headset goes through the brain.** `brain/remote.ts` keeps its own module state and timer and calls `$.ui.invalidate` directly, so it skips the hold (`behaviours/hold.ts`): a change while the mouse is on him shows only at some later redraw. Make it a behaviour (`behaviours/remote.ts`, slice `{ on }`, timer `remote.idle`, events `prompt` with its origin kind), let the machine's `wants` include a headset change, and have `band/drawing.ts` read it from the state. Check the `drop`/`lift` drawing is never left as the band's last drawing (a chat opened again replays its last drawing): schedule a plain redraw after the animation, like `hold.visitEnd`, if it is. **Verify:** machine tests: a phone message while `near` defers the redraw and draws it once after the grace; a desk message takes it off; the idle timer takes it off. The existing headset test in `classes.test.ts` still passes.

## Phase 3: Docs that mislead

- [ ] **A current handoff.** `docs/handoffs/2026-11-22-ghost-hunt-fixed.md` is listed as current but predates MPI-12 to MPI-15 (it says Eyebot, `robot.ts`, `DEBUG_LOG` still in, tests 14/14). Write a new handoff for the real state and update the list in `docs/README.md`. Old handoffs stay as they are (history).
- [ ] **Stale lines.** `.agents/mpi-kanban/project-profile.md` § Open Gaps ("not a git repository yet", "no TypeScript compiler") and its test list; `muki-pet/hooks/band/render.tsx:26` ("a Raster version is a later milestone": dropped); `docs/architecture/how-it-works.md` (`robotSvg(width, { mood, from, at, heat })` has no `at`; the test-files row misses `confirm.test.ts`, `celebrate.test.ts`, `papers.test.ts`; the list numbered 1, 2, 3, 3b, 4, 5, 7, 6; `remote.ts`, `pile-store.ts`, `papers.ts`, `celebrate.ts`, `attention.ts` missing from the files table); `CLAUDE.md` § Target (Pane, Raster, VS Code) and § Mood mapping ("first pass": add lonely, mad, tantrum, celebrate, or point at `character/moods.ts`). Also run `/mpi-project-refresh` for the pack drift (1.8.0 → 1.10.0).
- [ ] **`how-it-works.md` describes only what is true now.** Move the history ("was 1 s", "first try…", who saw what when) into `docs/log/2026-11-22.md` (append, don't rewrite the log), keeping one line per rule that says why it exists.
- [ ] **Milestone 3 in `CLAUDE.md`.** Your call (Fabio): is the ping timer with a toast and speech bubble still wanted, given he doesn't talk? My pick: strike it, as milestones 4 and 6 were.
- **Verify (phase):** `grep -rn "Eyebot\|robot\.ts\|DEBUG_LOG\|Raster version" CLAUDE.md docs/architecture docs/README.md .agents/rules .agents/mpi-kanban/project-profile.md muki-pet/hooks` finds nothing; every file named in `how-it-works.md`'s table exists; `validate_board.py` passes.

## Phase 4: Ready for a public repo

- [ ] **Licence and manifest.** Add `LICENSE` (MIT, holder: Mad Pony Interactive unless Fabio says otherwise) at the repo root. In `muki-pet/.claude-plugin/plugin.json` add `author`, `repository`, `homepage` and `keywords` (read the plugin schema in the generated types or the plugins reference first). **Verify:** `claude plugin validate ./muki-pet` passes.
- [ ] **Icon.** A square PNG, 512 px or more, at `muki-pet/.claude-plugin/icon.png`: his head and eyes, drawn from the mod's own shapes (`draw/parts/head.ts`, `face.ts`) with the same capture tool as Phase 6. The validator notes the first submitted icon sticks, so Fabio approves the picture before any submission. **Verify:** the `ICON_MISSING` warning is gone. User-ux: Fabio looks at the icon.
- [ ] **A fresh clone can check itself.** The types in `muki-pet/.claude-plugin/types/` are engine-written and git-ignored, so a clone can't run `npm run check`. Find the supported way to generate them (mods reference, "get the types for your build"; the plugin-authoring skill) and document it in the README's "Develop" section; if they may be committed (check their own header for a licence note), commit them instead. Add `npm test` that runs type-check, golden, `claude plugin test` and `claude plugin validate` in one go. **Verify:** in a fresh clone in the scratchpad, the documented steps make `npm test` pass.
- [ ] **CI.** A GitHub Actions workflow running what can run without the app: golden always; the type-check if the types are available there; `claude plugin test`/`validate` only if the CLI installs cleanly on the runner. Read `~/.claude/memory/tools/gh-cli.md` and `github-actions-concurrency.md` first. Pushing is Fabio's call (`push_policy: ask`). **Verify:** the workflow is green on the pushed commit, or reported as not pushed.
- [ ] **Reduced motion.** With `prefers-reduced-motion: reduce` he stays at home: no wander loop, no hop, stomp or fireworks; blink, mood faces and touch stay. One `@media` block (in `draw/parts/body-css.ts`, with each feature adding its own lines through `css`). This changes every drawing: golden `--write`, said in the commit. **Verify:** in the browser pane with the media feature emulated, he rests at home and still reacts to hover; the size test passes. User-ux: Fabio decides whether it feels right.

## Phase 5: Small tidying (no behaviour change)

- [ ] **One home for the visit tests.** `behaviours/hold.ts` and `visit.ts` re-implement "is a visit running" inline to avoid import cycles. Move `activeVisit`, `activePile` and `held` into one leaf file that only imports types, and use it everywhere.
- [ ] **Behaviour registration without casts.** `machine.ts` uses `Array<Behaviour<any>>` and `as keyof State['slices']`; a new behaviour needs edits in `types.ts`, the list and `initialState`. Derive `initialState().slices` from the list and type the lookup once. Update `docs/architecture/how-to-add.md` § A behaviour to match.
- [ ] **Duplicates.** Share the `lonely`/`sad` face and the `mad`/`tantrum` base face in `character/moods.ts`; one `jitter(n)` for the three `(n * 0.618034) % 1`; one `toU(W, x)` for the two copies in `geometry.ts` and `papers.ts`; `REMOTE_IDLE_MS` written with `MINUTE`.
- [ ] **Lab drawings.** `tools/frame-lab-*-test.svg` are 272 KB of hand-made snapshots that go stale. Keep the small hand-written proofs (`coin`, `ladder`); for the rest, either a script that writes them from the current code, or delete them and say in the docs how they were made. Ask Fabio before deleting.
- **Verify (phase):** `node tools/golden.mjs` says identical (no `--write` in this phase), and the other three checks pass.

## Phase 6: The README, with pictures (last)

- [ ] **A capture tool.** `tools/shots.mjs`: writes one still PNG per state from `robotSvg` into `docs/images/`. The drawing is animated CSS, so each shot needs the moment chosen: load the SVG in a headless browser, freeze the animations at a set time (a negative `animation-delay` added to the SVG's style, or the browser's animation clock), force `:hover`/`:focus` where a state needs it (a cookie, a pet), then screenshot on a dark background that matches Desktop. Pick the lightest tool that works: the app's browser pane first; a dev-only Playwright dependency in the root `package.json` if not (the mod itself stays dependency-free). Shots to make:
  - resting and wandering (neutral), and a strip of his moods: alert, focused, happy, sad, curious, sleepy, asleep
  - a prop visit: one shot per prop or one strip (file, lens, pencil, terminal, globe)
  - the paper pile with several papers, and his eye-roll at it
  - heat: the four levels side by side (cool, warm, red and sweating, suffering)
  - lonely, mad, a tantrum with steam
  - a cookie being eaten, the sixth cookie (sick), a pet with hearts, a boop
  - the celebration with fireworks
  - the Remote Control headset
  - **Verify:** every PNG exists, is non-empty, and was looked at (Read the image): the state it claims is what it shows.
- [ ] **The README.** Replace the stub `README.md`. Plain, friendly, short sections, each with its picture:
  - What he is: an unofficial robot pet for Claude Code; company and laughs, not an assistant. Not affiliated with Anthropic.
  - Where he works: **Claude Code Desktop only** (the app's band above the prompt). Not the terminal, not VS Code; say why in one line (the terminal only takes still images).
  - What he does, in Fabio's order: what Claude is doing (props for reading, searching, editing, running, the web; focused while Claude works, happy at an answer, sad at a failure, curious when a tool needs your OK); background tasks (the paper pile); how he moves (wanders, head on a spring, watches your mouse, sleeps after a quiet spell); the context window (he heats up at 20/30/40%, tired and slow, "time for a new chat"); attention (lonely, mad, tantrums; play fixes it); play (pet, boop, cookies, too many cookies); celebration when you say it worked; the headset when you message from your phone.
  - What he doesn't do: no chat, no model or network calls, no credits used.
  - Install: check the real steps for a plugin with a hooks module at writing time (plugin-authoring skill, mods reference); don't write them from memory.
  - Develop: the four checks, the preview tool, where things live (`docs/architecture/how-to-add.md`), how to get the types.
  - Licence: MIT.
  - Two marked places near the top for Fabio's own screenshots of him above the chat (`docs/images/in-app-1.png`, `-2.png`), so the page works before and after he adds them.
  - Write it per `~/.claude/memory/general.md` (Fabio's wording preferences) before drafting.
  - **Verify:** every image link resolves to a file in the repo; the page reads right rendered (browser pane or GitHub preview); `claude plugin validate ./muki-pet` still passes (it takes the repo README). User-ux: Fabio reads it and adds his screenshots.

## Plan Drift

- None yet.

## Verification

**Verify mode:** user-ux

Phases 1, 2, 3 and 5 are `auto`: the four checks plus each step's own test. Phase 4 stops for Fabio on the icon and on reduced motion. Phase 6 stops for Fabio on the README and its pictures.

End to end: `npm test` (or the four checks) passes; golden reports only the intended changes (new keys in Phase 2, all drawings in the reduced-motion step, nothing in Phase 5); `/reload-plugins` in a chat shows him behaving as before; the README on GitHub shows every picture.

## Preservation Notes

- Each bug in Phase 1: write in `docs/log/` whether it was reproduced, and how.
- New rules worth keeping in `.agents/rules/project.md`: the render hook returns `below` on failure; anything saved in `$.store` that belongs to one chat is keyed by session id.
- `docs/architecture/how-it-works.md` and `how-to-add.md` change in Phases 2, 3 and 5; keep them current in the same commit as the code.
- The capture tool (`tools/shots.mjs`) is worth a line in the dev workflow docs: rerun it when his look changes.
- Skins (MPI-16) will want the same capture tool for a skin gallery.
