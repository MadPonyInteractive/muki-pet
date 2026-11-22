# MPI-15 plan: headset when Remote Control is on

## The signal (checked in the types, not yet live)

The mods API has no "remote control on" flag. The closest signal, from
`muki-pet/.claude-plugin/types/claude-code/index.d.ts`:

- `session.attach` `{ surface, clientId }`: a remote client joins the session's roster (line ~5848).
- `session.detach` `{ surface, clientId, reason }`: it leaves (`detach`, or `end`).
- `$.session.surfaces()`: the roster now, `terminal` first, then remote ones in attach order.

Guess: turning Remote Control on and opening the chat on the phone attaches a `mobile` client.
**Not proven.** The phone may attach only when it opens the chat, not when Remote Control is
switched on, or it may not attach at all. So step 1 is a probe.

Fallback if attach never fires: a prompt whose source `kind` is `'bridge'` (a message sent over
Remote Control, line ~11940) can put the headset on, but there is no matching "off" event. We'd
then need another way to take it off, which is Fabio's call.

## Steps

1. **Probe.** In `register.tsx`, log `session.attach`, `session.detach` and
   `$.session.surfaces()` to the debug log (`brain/debug-log.ts`). Fabio reloads and turns
   Remote Control on and off, once with the phone app open on the chat and once without.
   Write down what fired in `docs/research/mods-api.md`.
2. **State.** Keep a set of attached remote client ids (surface not `desktop`/`terminal`;
   `vscode` counts as local). The headset is on while the set is non-empty. Seed the set from
   `$.session.surfaces()` at register so a reload during Remote Control keeps it on.
   Every hook calls `next(e)` and returns its result, inside `try`.
3. **Drawing.** New feature `draw/features/headset.ts` plus one line in `features/index.ts`:
   - `head` slot: band arc over the screen, earpiece on the side, boom mic, antenna with a
     tip dot. Plain SVG shapes in head coordinates, so the head's spring lag carries it.
   - CSS keyframes only: tip blink (slow opacity), drop-on (translateY from above + small
     bounce) and lift-off. No `ui.render` redraws for motion.
   - `RobotOptions.headset?: { on: boolean; since?: 'on' | 'off' }`. `since` plays drop-on or
     lift-off once at the start of that drawing; a later drawing shows it at rest.
   - On drop-on, a short happy squint, reusing the happy eye shape (no new mood).
4. **Wire it.** `band/render.tsx` passes the headset state into the drawing. Turning it on or
   off triggers one redraw (the Svg source changes, so Desktop restarts the frame; he starts
   at his saved home, as in every drawing).
5. **Checks.** A test in `draw/classes.test.ts` style that the headset markup appears with
   `headset.on` and not without; update `tools/golden.json` if it changes;
   `node tools/preview.mjs` frame to look at it; `claude plugin validate` and `claude plugin test`.
6. **Live (Fabio).** Reload, Remote Control on: headset drops on, antenna blinks. Off: it
   lifts off. Reopening the chat must not replay the drop-on (see the "last cached tree"
   note in MEMORY: a drop-on drawing left as the last tree replays when the chat opens, so
   after the drop-on, render a rest drawing).

## Files

New: `muki-pet/hooks/draw/features/headset.ts`.
Edit: `draw/features/index.ts`, `draw/feature.ts` (option), `band/render.tsx`, `register.tsx`,
maybe `draw/parts/head.ts` for the head size.

## Blocked on

On 2026-11-22, `register.tsx`, `band/render.tsx`, `draw/feature.ts` and `draw/parts/body.ts`
are claimed by the paper-pile session (MPI-14), and `draw/compose.ts`/`classes.ts` by the
needs-attention session (MPI-5), both with uncommitted work. Start the build once those
claims are released, or coordinate with those sessions first.
