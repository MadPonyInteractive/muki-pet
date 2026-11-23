# MPI-18 Checklist

- [x] Find the cause live (temporary attention + sensor log, short timers)
- [x] Fix band/sensor.ts: no setState (module variable)
- [x] Test: sensor posts every visit, never calls setState (fails on old code)
- [x] Remove temporary log, timers back to 10/15/20
- [x] Four checks: tsc 0, plugin test 55/55, validate, golden identical 3,648
- [x] Fabio live: "it looks right now"
- [ ] Commit (handoff) and close (mpi-end-session)
