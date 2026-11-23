# MPI-18 Validation

- 2026-11-23, automated: tsc 0; claude plugin test 55/55 (new test fails on the old sensor, passes on the new); claude plugin validate passes (usual warnings); node tools/golden.mjs identical (3,648 drawings, widest 98,894).
- 2026-11-23, live (Fabio, timers at 1/2/3 min, temporary log): "it looks right now". Log: lonely, mad and tantrum each went back to neutral on a pet, five visits in a row (previously the sensor went silent after its first visit).
- Cause and fix: docs/log/2026-11-23.md; rule recorded in docs/research/mods-api.md (Client modules).
- 2026-11-23, follow-up: a quick cookie (0.5-0.6 s on the band) did not count under PLAY_MS 1 s; now 0.4 s. tsc 0, tests 55/55, golden identical. Not yet seen live.
