# MPI-5 Plan

Design and decisions: `brief.md`.

## Steps

1. Brain: `brain/behaviours/attention.ts`, a clock since the last play (mouse over the band 5 s or more). Under 30% context (heat < 2): lonely 20 min, mad 28, tantrum 35. Over 30%: lonely 10 min after play, never mad. Nothing while asleep. Priority 15 (over his activity, under passing moods).
2. Moods: `lonely` (sad face, lasting), `mad` (angry lids), `tantrum` (angry, stomp and steam every 2 min) in `character/moods.ts`; steam and "!!" markup in `draw/features/tantrum.ts`.
3. Slow rolling over 30%: `wander.ts` / `keyframes.ts` take a slow flag from heat >= 2.
4. Boop ladder in `draw/features/touch.ts`: 5 layers of touch strips (`q1`..`q5`); each focus holds 1.5 s, so a click before then climbs a layer; layer 5 = mad for 15 s (angry face, dodges the hand). Off at heat >= 2. Cookie game's touch-strip comeback only on layer 1.
5. Woken from sleep under 30%: hovering him while asleep shows the angry face, no hop (`draw/features/mad.ts`).

## Verification

**Verify mode:** user-ux

- `npm run check`, `claude plugin test ./muki-pet`, `claude plugin validate ./muki-pet`, `node tools/golden.mjs` (re-record with `--write`, new moods add drawings).
- Frame lab: boop ladder climbs to mad with 5 clicks; dodge; tantrum burst.
- Fabio in the app after `/reload-plugins`.

## Completed

- 2026-11-22: steps 1-5 built; tsc, plugin test 35/35, validate, golden (re-recorded, widest 97,780) and frame lab checks passed.

## Remaining Work

- See Current State: lonely face over heat, the stayed-angry report, Fabio's look at tantrum and kick, remove the temporary log.

## Current State

Done and verified by Fabio (2026-11-22 22:54). Closed by mpi-end-session: the temporary attention log (brain/debug-log.ts and its call in brain/runtime.ts) is removed in the close-out commit.

Seen live: lonely, mad, tantrum (bigger, with jumps) and the prop kick when mad; Fabio: the kick is "very funny", the tantrum "looks fine". One 1-3 s pet cheers him up from lonely or mad (log r7ei: mad, 3.4 s near span, mood ->neutral, idle 0). Earlier double pets were chats still on the old 5 s rule.

Known and accepted (Fabio): he falls asleep 15 min after the last reply and asleep shows no need, while mad and tantrum come 15/20 min after the last play, so in a quiet chat he is usually asleep first (in the test chat, 9 s before the tantrum); they show in busy chats. A waiting question hides it too (curious, priority 30). To test the ladder quickly, lower LONELY/MAD/TANTRUM_AFTER in character/tuning.ts temporarily (2/3/4 min worked).

## Plan Drift

- 2026-11-22: timings shortened to 10/15/20 min; tantrum made bigger (jumps); prop kick when mad added (Fabio's ideas); temporary attention log added.

- 2026-11-22: hunger and energy bars dropped (Fabio: context is his energy); the cookie game's tch comeback moved to q1 only.
