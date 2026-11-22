# MPI-15 validation

- Fabio, live 2026-11-22 23:12: after `/reload-plugins`, a message from his phone put the headset on (screenshot: band, orange earpiece, mic, antenna); a message typed in Desktop took it off at once.
- Probe log: `prompt bridge` (phone) at 23:12:04, `prompt composer` (Desktop) at 23:12:22. Earlier probe: turning Remote Control on attached no surface (roster stayed `desktop`).
- `npm run check` clean; `claude plugin test ./muki-pet` 44/44; `claude plugin validate` passes. Golden: no change from the headset (the 168 `pleased` changes are MPI-6's new mood, not this card).
- Not checked live: the 15-minute idle take-off (`REMOTE_IDLE_MS`).
