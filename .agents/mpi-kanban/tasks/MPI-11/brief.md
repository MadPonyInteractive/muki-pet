# MPI-11 brief

## Findings 2026-11-22 (MPI-7 bug step)

- The drawing is not broken: in tools/frame-lab.html (Desktop sanitizer, CSP, sandbox) a real press on his body lands on the pet zones (.p) inside .bot, .bot:active turns on and .sq reaches scale(1.07,.9). With transitions off, every mood (and a visit) gives the full squish, lean and lid lift under :active.
- The press CSS has not changed since the initial commit 0d5584b (only the cookie bites differ), so the refactor did not cause it.
- Likely cause: the release wiggle was turned from an animation into a release-only spring transition in the home-spot session (log 2026-11-22, the in-place ghost fix). A quick click holds :active for about 0.1 s, so the squish barely starts and the spring back is tiny: it reads as nothing.
- Not yet ruled out: Desktop not giving :active to the frame at all. Test: hold the button on him for a second. Squash + closed eyes + hearts = drawing fine, the fix is a wobble that plays fully on a click (e.g. a :focus-started animation like the cookie strips, which cannot play at load). Nothing = a Desktop problem to research.
