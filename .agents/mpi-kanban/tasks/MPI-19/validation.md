# MPI-19 validation

## Automated (2026-11-23, timers back at 10/15/20 min)

- `npm run check`: exit 0.
- `node tools/golden.mjs`: identical, 3648 drawings, widest 106,325 characters (limit 131,072). Golden rewritten on purpose: every drawing carries the tantrum CSS.
- `claude plugin test ./muki-pet` (Desktop's 2.1.330 claude.exe): 55 pass, 0 fail.
- `claude plugin validate ./muki-pet`: passes with the usual warnings.

## Frame lab (tools/frame-lab.html, debug copy, seeking the animations)

- Heart pops, beats, cracks, halves fall beside his wheels and flatten under the slams, fade at the burst's end. Fabio: "looks right".
- Real mouse hover for 1 s, then away: `--rage` 0, stomp and head shake at identity, steam opacity 0; stays so after the mouse leaves.
- Tantrum drawing on a paper-pile trip (`m-tantrum pv`): trip runs, hop / pet tilt animations none, steam display none.

## Live (Fabio, 1/2/3 min timers)

- First pass: heart fine, but the jumps too slow, and after a pet the stomp came back alone and the calm drawing ghosted in. Fixed (fast stamping; loops keep running under the hand).
- Second pass: asked for calm at once after play, and no tantrum during the pile trip. Fixed; Fabio: "it's more responsive now".
- Not confirmed live: the no-tantrum-on-a-trip case (lab only), reduced motion.
