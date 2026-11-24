# MPI-21 validation

- `npm test`: all checks passed (type-check, golden identical after re-record, version check, 56 plugin tests, validate).
- New brain test: after play the hold waits `PLAY_GRACE_MS`; a quick crossing keeps the end; a later crossing gets the 3 s grace.
- Headless Chrome, real mouse over a visit drawing: the trip pauses under the mouse and resumes (152 → 77, held 2 s, → 0).
- Headless Chrome: an animation-flipped custom property does not start a transition (snap smoothing not possible in CSS as the game is).
- Context bar (outside the repo): type-check and `plugin validate` pass.
- Not seen live in Desktop yet (Fabio: `/reload-plugins`, then play while Claude works).
