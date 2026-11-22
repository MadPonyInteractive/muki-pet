# MPI-14 — Paper pile for background tasks

Fabio's idea (2026-11-22), from a screenshot of the Desktop "Background tasks" panel showing four running tasks.

## What he wants

- On the right-hand end of Muki's road, a small pile of papers (newspaper / sheets with scribbles) lying on the floor.
- One paper per running background task. Four tasks running = four papers piled up.
- While papers are there, every now and then Muki rolls over to the pile, looks at it, rolls his eyes ("oh my gosh, work, I don't want to do that, leave it") and rolls away.
- Papers go away as tasks finish; no tasks = no pile, no visit.

## Known so far

- The mod types (`muki-pet/.claude-plugin/types/claude-code/index.d.ts`) have `BackgroundTaskSummary` (id, type `shell`/`subagent`/`monitor`/`workflow`, status, description). It rides on the `Stop` and `SubagentStop` hook inputs as `background_tasks` ("in-flight background work ... empty when nothing is in flight").
- Open: whether the mods hooks module receives those payloads (or another event/state for background tasks), and whether the count updates when a task finishes mid-idle, not only at turn end. Check before planning.

## Constraints (project rules)

- Papers are part of the pure `robotSvg()` drawing; the visit and eye-roll are CSS keyframes, not redraws. A change in paper count is a new drawing, so he restarts from his saved home (see MPI-9 / how-it-works § Moods).
- The eye-roll is a new mood/face shape: eyes look up and sweep across, maybe a half-lid after.
- Look-and-feel needs Fabio's eye-test.
