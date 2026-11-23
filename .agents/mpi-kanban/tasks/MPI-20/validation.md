# MPI-20 Validation

## Automated (2026-11-23)

- `node tools/version-check.mjs`: passes at 0.1.0; fails (exit 1) when the newest changelog entry says 0.1.1; passes with a local `v0.1.0` tag on HEAD (tag deleted after).
- `npm test`: all steps pass, version check included (55 tests).

## Waiting

- Fabio said: push and release (done below).
- 2026-11-23: pushed adad6a0, tag v0.1.0 pushed, release https://github.com/MadPonyInteractive/muki-pet/releases/tag/v0.1.0 created from the changelog entry; version check passes with the tag; CI green.
