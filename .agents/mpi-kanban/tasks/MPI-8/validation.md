# MPI-8 validation

2026-11-22: thresholds set to 20/30/40% in `muki-pet/hooks/character/heat.ts` (Fabio's numbers, same as his context bar).

- `heatOf`: 19%=0, 20%=1, 29%=1, 30%=2, 39%=2, 40%=3 (ran, passed)
- `claude plugin test ./muki-pet`: 32 pass, 0 fail
- `node tools/golden.mjs`: identical, 2934 drawings
- `npm run check`, `claude plugin validate ./muki-pet`: pass

Closed 2026-11-22 on the checks above. Fabio chose the numbers, kept the looks as they are ("Leave the looks"), and said "end session" after being told to say it once Muki looked right in the app; he did not describe what he saw.

Eye-test 2026-11-22 (Fabio, screenshot from another session): with the context bar at 30% Muki shows level 2: red body and wheels, heavier lids, one sweat drop on the right of his head. Levels 1 (20%) and 3 (40%) were not reported.
