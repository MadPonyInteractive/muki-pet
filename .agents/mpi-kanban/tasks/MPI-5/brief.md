# MPI-5: Needs attention and boop anger

## Decisions (Fabio, 2026-11-22)

Context level is his energy. Two worlds:

- **Under 30% context (he has energy):**
  - **Needs attention:** with no attention he gets sad, then mad, then throws temper tantrums. The only way to stop it: pet him or give him a cookie.
  - Tantrum: stomp and steam. Angry lids, rocking back and forth on his wheels, head shaking "no", steam puffs, a red "!!". About 4 s, repeated every couple of minutes until he gets attention.
  - **Mad from boops:** 5 boops in a row (each within about 1.5 s of the last) make him mad for about 15 s: angry lids, and hovering makes him dodge and roll away. ("If I keep clicking on him repeatedly, he gets mad.")
  - **Woken from sleep:** the mouse coming over him while he's asleep makes him mad for about 10 s, then neutral.
- **Over 30% context (no energy):** he can't get mad at all (no boop anger, no waking anger, no tantrum). He is sad, and a pet takes the sadness away for a while. He rolls slowly.

## Limits (why it is built this way)

- The hook can't tell a cookie from a pet: the frame has no script, and only "mouse over the band" reaches the hook (`band/sensor.ts`). Both count as attention, so the hook treats play over the band (about 5 s or more) as attention and resets his clock; inside one drawing CSS reacts right away (a pet or cookie ends sad/mad on the spot).
- No visible bars: Fabio wants people to figure him out.

## Picks made without asking (say if wrong)

- Earlier hunger and energy bars are dropped: Fabio's 2026-11-22 rework makes context his energy and attention (pet or cookie) the one need.
- Timings under 30%: sad after 10 min with no attention, mad at 15 min, tantrums from 20 min (Fabio, 2026-11-22; first 20/28/35). Never while asleep.
- Over 30%: "for a while" = 10 min of no sadness after play.
- Event moods (alert, focused, happy, sad) still show over these briefly.

## Noticed
