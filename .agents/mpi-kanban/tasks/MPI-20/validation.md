# MPI-20 Validation

## Automated (2026-11-23)

- `node tools/version-check.mjs`: passes at 0.1.0; fails (exit 1) when the newest changelog entry says 0.1.1; passes with a local `v0.1.0` tag on HEAD (tag deleted after).
- `npm test`: all steps pass, version check included (55 tests).

## Waiting

- Fabio's go to push, tag v0.1.0 and make the GitHub release.
