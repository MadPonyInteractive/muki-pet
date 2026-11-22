# MPI-15 checklist

- [x] Probe: brain/remote.ts logs attach / detach / roster changes to %TEMP%/claude/muki-pet-remote.log (TEMPORARY, remove before close)
- [x] Headset follows the roster: every render reads `$.session.surfaces()`; anything but terminal/desktop/vscode counts as remote
- [x] draw/features/headset.ts (band, earpiece, boom mic, antenna, blinking tip) + index.ts line; colours in character/palette.ts
- [x] Drop-on with happy squint, lift-off, CSS keyframes only
- [x] render.tsx + drawing.ts wiring (drop/lift play once, when the state changes)
- [x] Test (classes.test.ts), golden identical (3366), tsc, plugin test 43/43, validate passes; zoomed preview looked at
- [x] Live probe 2026-11-22: turning Remote Control on attached no surface (roster stayed `desktop`), so the roster signal is dead
- [x] Switched to `prompt.submit` origin (Fabio's pick): `bridge` message puts it on; a desk message (composer/sdk/unclassified) or 15 min with no phone message (tuning REMOTE_IDLE_MS) takes it off
- [ ] Fabio live check (new signal): phone message, then desk message; Remote Control on (phone open on the chat, then not), off, reopen chat; read the probe log
- [ ] Remove the probe log, record the real signal in docs/research/mods-api.md, commit
