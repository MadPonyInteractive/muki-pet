# MPI-14 Checklist

- [x] Count from `classic.Stop` `background_tasks` (register.tsx)
- [x] Papers behaviour in the brain (visit timer, conditions, new home), with tests
- [x] Pile drawn in a fixed `scene` slot; eye-roll visit CSS
- [x] Hold and prop visits respect a pile visit
- [x] Checks: tsc, plugin test 40/40, validate, golden 3366 identical
- [x] Stills in the browser pane; frame-lab proof SVG
- [x] Reload keeps the pile: count saved per chat (pile-store.ts), test 41/41
- [x] Live: pile appears for a running task, visit plays, pile survives a reload (Fabio, 2026-11-22)
- [x] A paper appears as soon as Claude starts background work, not only at the turn end (tool.call), test 42/42
- [x] Fabio's eye-test of the faster eye-roll arc: good (2026-11-22)
- [ ] Live check: a background task started after /reload-plugins shows a paper at once, and it stays through a second reload
- [ ] Commit, after MPI-5 lands: the shared lines in types.ts, machine.ts, compose.ts, features/index.ts, classes.ts, classes.test.ts sit next to MPI-5's uncommitted lines (agreed with "Hungry and mad"). Plan: "Hungry and mad" commits MPI-5 plus those six files whole, then messages; this card then commits its own files (papers.ts x3, papers.test.ts, pile-store.ts, render.tsx, hold.ts, visit.ts, feature.ts, body.ts, drawing.ts, register.tsx, docs, frame-lab-papers-test.svg). No push until both commits are in.
