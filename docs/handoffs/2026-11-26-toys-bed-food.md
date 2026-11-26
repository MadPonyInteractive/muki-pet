# Handoff 2026-11-26: toys, the cotton bed, burger and cake (MPI-22), released in 0.1.1

Replaces `2026-11-24-play-vs-work.md` as the current handoff.

## Where things stand

- **MPI-21** (play survives Claude's work): Fabio, 2026-11-26: "it's a bit better now". Nothing more asked. Still open on the board; close it with the release.
- **MPI-22, released in 0.1.1 (2026-11-26); toys and middle-click seen live by Fabio, bed and foods not confirmed by him:**
  - Middle-click or right-click: a random toy (punching bag or ball); again swaps; left click puts it away. Desktop shows its own menu on a right-click and it can't be stopped, hence the middle button.
  - Asleep, middle-click or right-click: a heap of cotton up to his eyes; he sleeps on with happy eyes.
  - Left click: the food is a cookie, a hamburger or a slice of cake, at random.
- All four checks pass; golden re-recorded. Widest drawing 118,460 of 131,072 characters: about 12,600 left, so another toy or food must be small.
- How it works: `architecture/how-it-works.md` § Right-click play. What was tried: `log/2026-11-26.md`.

## Next

1. Done 2026-11-26: Fabio saw the toys ("looks cool") and the middle-click ("works"). The sleep timers are back at 5 and 15 min. He has not said he saw the bed or the foods.
2. To watch for: Desktop's own menu on a right-click; the play's speed and look; the cotton.
3. Done 2026-11-26: committed and released as 0.1.1 on Fabio's go (MPI-21 and MPI-22 closed). README pictures added the same day (`docs/images/food.png`, `toys.png`, from `tools/shots.mjs`). Open ideas: more toys (balloon, wind-up mouse, jack-in-the-box, rubber duck).

4. **MPI-23 (2026-11-26, not committed yet):** the middle click mostly gave food live. Cause: Chromium's middle-button autoscroll (the chat can scroll) swallows `auxclick`. The switches now start on `mouseup` and end on `click+.001s`; proven in headless Chrome with real presses, all four checks pass. Fabio, live after `/reload-plugins` (2026-11-26): "it's working for now" (it also worked at first last time). Committed. He'll watch it in other chats for a day or so; if it holds, close MPI-23 and offer a release (0.1.2). Known leftover: the first left click after a middle click only stops the autoscroll (swaps the toy instead of putting it away). Details: `log/2026-11-26.md` § Middle click.

## Paste-ready resume prompt

```
Continue MPI-22 in C:\AI\Mpi\Plugins\Code-Companion. Read docs/README.md and docs/handoffs/2026-11-26-toys-bed-food.md first. Fabio's live look at the toys, bed and food: <his words>
```
