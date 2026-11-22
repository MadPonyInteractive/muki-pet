# MPI-3 validation

2026-11-22: the temporary redraw log is gone. Fabio saw no ghost after the MPI-9 fix ("New chat there shows him, no ghost").

- Deleted `muki-pet/hooks/band/debug-log.ts` and its calls in `band/render.tsx`, `band/frames.ts` and `register.tsx`, plus the imports only they used. `grep debugLog` finds nothing.
- Type-check 0, `claude plugin test ./muki-pet` 33/33, `node tools/golden.mjs` identical (2934 drawings), `claude plugin validate` passes.
- Not seen live: Fabio needs `/reload-plugins` (or a new chat). Nothing he can see should change; the only difference is that no new `muki-pet-debug.log.*` files are written.
