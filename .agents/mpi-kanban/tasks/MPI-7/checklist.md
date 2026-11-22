# MPI-7 checklist

- [x] Record reference drawings (robotSvg + visitPlan over a matrix of options) before touching code
- [x] Split robot.ts into small pure modules under eyebot/hooks/draw/
- [x] Reference drawings byte-identical after the split
- [x] Mood / visit / heat logic as one pure state machine (eyebot/hooks/brain/)
- [x] Double buffer and drawing cache in their own modules (eyebot/hooks/band/)
- [x] register.tsx only wires hooks to the machine
- [x] Unit tests for the state machine
- [x] plugin test + plugin validate pass
- [x] docs/architecture/how-it-works.md updated to the new file map
- [ ] Fabio eye-test after /reload-plugins
