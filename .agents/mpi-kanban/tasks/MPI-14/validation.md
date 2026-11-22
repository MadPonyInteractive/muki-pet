# MPI-14 Validation

Closed 2026-11-22 on Fabio's word ("the paper is gone, close the card").

## Automated

- `npx tsc -p muki-pet/tsconfig.json --noEmit`: clean.
- `claude plugin test ./muki-pet`: 42/42, on the committed tree alone (`git archive 9eb0332`).
- `claude plugin validate ./muki-pet`: passes (with the usual warnings).
- `node tools/golden.mjs`: 3366 drawings identical (the pile's CSS is only written when there are papers).

## Seen live (Fabio)

- A pile appears for a running background task, and the visit plays.
- The faster, arced eye roll: "good now".
- The pile survives `/reload-plugins` (tested in another chat).
- A background task started after a reload shows its paper at once, before the turn ends.
- Stopping the task: the paper is gone after the next turn ends.

## Commits

- 3a62917 card; 25676f8 the pile, visits, eye roll and per-chat save; 9eb0332 a paper as soon as background work starts. The shared wiring lines went in with MPI-5 (05f2b13). All pushed.

## Known limits

- A shell that Claude Code moves to the background on its own (a timeout) gets its paper only at the turn's end.
- A finished task's paper goes at the next turn's end, not the moment it finishes.
