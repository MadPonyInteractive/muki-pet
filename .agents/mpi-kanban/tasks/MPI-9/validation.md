# MPI-9 validation

2026-11-22: the chat-start ghost fixed in a7cca4f (every render waits for the same saved-home read).

- Test "two renders at once both wait for his saved spot" fails on the old code, passes on the new; type-check 0, tests 33/33, golden identical (2934 drawings), validate passes.
- Fabio's eye-test: after `/reload-plugins` here, and in a new chat in another repo: "shows him, no ghost".
- A chat opened before the eyebot -> muki-pet rename loses him on `/reload-plugins` (old plugin path); a new chat fixes it. Not a bug in the mod.
- Left open elsewhere: cookies sending him back or teleporting him while Claude works are MPI-6; removing the redraw log is MPI-3.
