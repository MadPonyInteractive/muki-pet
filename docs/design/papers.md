# The paper pile (MPI-14)

Fabio's idea, 2026-11-22: a pile of papers at the right-hand end of Muki's road, one paper per background task Claude has running. Now and then Muki rolls over, rolls his eyes at the pile ("oh my gosh, work, I don't want to do that") and rolls away.

## How it behaves

- **Count:** the `classic.Stop` hook (`register.tsx`) gets `background_tasks` at the end of every turn: shells, sub-agents, monitors and workflows still running. One paper each, at most 6 (`MAX_PAPERS`). When a background task ends, Claude is woken, and that turn's end takes its paper away. The count is saved per chat (`brain/pile-store.ts`, store key `papers`, `{ <session id>: count }`, newest 20 chats), so a reload of the mod reads it back before the first drawing. Added 2026-11-22 after Fabio reloaded and the pile vanished while its task still ran. A turn end that comes in before that read wins over the saved count.
- **Pile:** drawn in the new `scene` slot (`draw/feature.ts`, `draw/parts/body.ts`), on the ground line outside the wandering group, so it stays put while he roams. Sheets lie flat with a fixed jitter; the top one has scribbles and lifts a corner every 6 s.
- **Visits:** first visit 30 s after a pile appears (`PILE_FIRST`), then one every 3 to 6 minutes (`pileGap`), while papers remain. He goes only when Claude is idle (not working or asking), he isn't asleep, your mouse isn't on him, and no prop visit is running. Otherwise he tries again in 30 s.
- **The visit** (`character/papers.ts` `pilePlan`, CSS in `draw/features/papers.ts`): he rolls to a spot beside the pile, leans toward it and looks at it. Then his eyes roll up and over from right to left, his top lids drop halfway (unimpressed), he shakes his head and rolls 120 to 240 px to the left. That spot is his new home. While he's there no prop visit starts, and redraws wait (`hold.ts`), just as for a prop visit.

## Checked

- Stills paused at each moment of the visit, at 3x, in the browser pane (2026-11-22). Rolling, look, eye roll (up-right, top, up-left), half lids, head shake, leaving, home all read. The first eye-roll arc (±4 px) was too small to see; it is now ±6 px and 8.5 px up. Fabio, live (2026-11-22): the roll should be faster and more of an arc. It was 4 stops over 0.85 s, each easing to a halt; now it is 13 samples on a circle (-25 to 200 degrees, 6.5 x 7 px) at an even speed (`animation-timing-function:linear` on each stop) in 0.5 s, and the lids follow 0.2 s later.
- `tools/frame-lab-papers-test.svg`: a pile visit with 4 papers, played as Desktop plays it (`tools/frame-lab.html?src=frame-lab-papers-test.svg&w=760&h=76`).
- With no pile, every drawing is byte-identical to before (golden 3366/3366): the pile's CSS is only written when there are papers.

## Open

- Fabio's eye-test of the faster eye-roll arc.

Seen live (Fabio, 2026-11-22): `classic.Stop` reaches the mod with `background_tasks` filled (a pile appeared for a running task), the visit plays, and the pile survives `/reload-plugins` (tested in another chat).
