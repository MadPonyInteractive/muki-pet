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

Built and committed (2026-11-22), not pushed: MPI-14's commit must land first (agreed with the session "Background task visual cards"; HEAD needs its papers files to build). Seen live by Fabio: boop anger works; lonely, mad and the tantrum showed; the tantrum was made bigger (jumps) and the prop kick when mad was added, both only seen in the frame lab. Timings are now 10/15/20 min (was 20/28/35).

Next action: read the newest `%TEMP%/claude/muki-pet-attention.log.*` for this chat and check with Fabio:
1. Over 30% (heat 2+) his lonely face may not show: the heat's droopy lid (`.tw`, features/heat.ts) probably covers the sad slant. Fabio: "I don't think sad goes over the tired." Check in the frame lab (mood lonely, heat 2) and make the lonely slant win.
2. "He stayed angry after petting and cookies" (another chat, before the log existed): not reproduced; suspected boop-mad from clicking him. Ask Fabio to press-and-drag to pet a mad Muki under 30% and read the log.
3. Fabio's look at the bigger tantrum and the kick in the app (a chat under 30%).
4. Remove the TEMPORARY log (`brain/debug-log.ts` and its call in `brain/runtime.ts`) before the card closes.

Gotchas: `/reload-plugins` restarts his attention clock. In a hidden browser pane `:focus`/`:hover` never match and animations freeze: swap them for classes. The frame lab: `python -m http.server 8765` in tools/, open frame-lab.html?src=<svg>.

## Plan Drift

- 2026-11-22: timings shortened to 10/15/20 min; tantrum made bigger (jumps); prop kick when mad added (Fabio's ideas); temporary attention log added.

- 2026-11-22: hunger and energy bars dropped (Fabio: context is his energy); the cookie game's tch comeback moved to q1 only.
