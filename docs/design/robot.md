# Robot design

Decided with Fabio on 2026-11-21 (from his sketch). Overall goals and personality are in `CLAUDE.md`.

## Where he lives

His own band directly above the chat input (the `AbovePrompt` site), like a shelf he rolls along. Not a side pane.
The band is shared with Fabio's usage-bar mod (`context-bar`): Muki sits on top, the bars stay just above the input.

## Body (side view, cartoon)

- Two spoked wheels (front and back), a small rounded chassis on top of them.
- A thin neck rising from the chassis to the head.
- Head = dark rounded screen with a grey bezel and two cyan rounded-rectangle eyes (same face as `prototype/face.html`).
- Colours: bezel `#3a444b`, screen `#0b1216`, eyes `#5ee7f0`, tyres `#1c2328`, rims `#56626a`.
- Drawn at 0.85 scale in a 76 px tall band, with a faint "shelf" line under the wheels.

## Motion

- **Home spot (2026-11-22):** he rests at his home spot (3.5 to 8.5 s), takes a short trip out (20 to 80 px, left or right; was up to 220 px, cut so a swap mid-trip can only jump him a little), looks around there (1 to 3.5 s), and rolls back home, at a varied speed. Starts and stops smoothly. Home starts in the middle of the band and moves when he visits a prop (the prop's spot becomes his new home). Before 2026-11-22 he roamed the whole band on one long route; that made mood changes jump or ghost, because each new drawing had to guess where he was on it.
- Wheels spin in step with the distance rolled.
- **Head lag:** the head is on a damped spring. Speeding up or cruising tips it back (rolling left leans it right), and stopping makes it swing forward past upright and settle. This was the key request from the sketch.
- Eyes look where he's going while moving, and glance around while idle.
- Blinks on two overlapping timers (4.7 s and 7.3 s), so blinks feel irregular, with an occasional double blink.

## Mouse

- Mouse anywhere over his band: he stops and his eyes follow the mouse left or right (graded by distance).
- Mouse on him: happy "^ ^" eyes and a little hop.
- Mouse leaves: he carries on from where he stopped.
- Fabio confirmed all of the above in the app on 2026-11-22.

## Touch (added 2026-11-22, Fabio asked for click and petting)

- **Press on him (boop):** he squashes down, his eyes close into blissful "^ ^" crescents, pink cheeks appear, and hearts float up beside his head. The cursor is a grab hand.
- **Hold and drag across him (petting):** his head leans toward your hand (four strips across him, ±4° and ±9°), so stroking left and right rocks his head along.
- **Let go:** he springs back up with a little overshoot, wobbles back from a small lean (a springy transition; it used to be an animation, which also played on every new drawing under the old one and made his head ghost), and the blush fades slowly (starts after about 1 s, gone after about 3.5 s).
- **A click (boop, 2026-11-22, MPI-11):** a click is too short for the press to show, so letting go of a clicked spot plays a full boing (squash, stretch, settle) and a wobble from the held pose, about 0.75 s. Each touch strip has a tabindex, a click focuses it, and focus is what starts it; the strip then hides for a moment, which drops its focus, so the next click boops again. A new drawing never has focus, so the boop cannot replay under it.
- Pure CSS (`:active` plus `:hover`), because the frame has no scripts and doesn't send clicks to the mod.

## Moods (milestone 2, added 2026-11-22)

What Claude Code is doing sets his face. Each mood (its look, how long it lasts, whether he stays home) is one entry in `muki-pet/hooks/character/moods.ts`; the events are in `muki-pet/hooks/register.tsx` and `muki-pet/hooks/brain/machine.ts`.

| When | Mood | Look | How long |
| --- | --- | --- | --- |
| You send a message (`turn.start`) | alert | eyes 18% bigger, a hop | 2.5 s, then focused |
| Claude is working | focused | top lids down a little, eyes a bit narrower | until the turn ends |
| A tool needs your OK (`tool.check` says ask) | curious | head tilted, eyes down toward the prompt, one eye bigger, one lid cocked | until you answer |
| A tool fails or is refused | sad | top lids slanted down at the outer corners, eyes lower | 5 s |
| Claude answers (`turn.complete`, `answer`) | happy | "^ ^" eyes, two hops | 6 s, then neutral |
| The turn ends on an error or refusal | sad | as above | 5 s |
| You stop the turn | neutral | | |
| 5 min with no turn | sleepy | top lids half down | until 15 min |
| 15 min with no turn | asleep | eyes closed to thin lines, stops rolling, floating "z"s; hovering opens them halfway | until the next turn |

- Subagents' turns don't change his mood; their tool failures do.
- Hover and touch win over any mood: touching him resets his face to rest under the happy look (built 2026-11-22; before that a mood's lids stayed on under it).
- Each mood change swaps the drawing. The old drawing stays on top for 0.9 s while the new one loads under it; in the new one he stays hidden for 0.15 s, fades in over 0.25 s, and his eyes slide from the old face to the new one (0.45 s). Every new drawing starts him resting at home, so the two drawings agree on where he is unless he was out on a trip at that moment. He also does his little wiggle on each change. **Since 2026-11-22 (later) he takes no trips in the moods Claude's work flips between (alert, focused, curious, sad, asleep), and every drawing opens with at least 8 s at home**, longer than the passing moods last, so a swap out of those finds him home. **Fabio still sees a lot of ghosting** (see the current handoff): not solved.

## Cookie game (built 2026-11-22, Fabio's idea; replaces the coin game; not yet seen live)

- Click anywhere on the band where he isn't: a chocolate-chip cookie pops up there, he stops wandering and dashes to it (same dash as the coin had: 0.3 to 1.5 s, wheels spin, head leans back then swings, eyes on the cookie).
- He eats it: a little mouth appears on his screen (eye colour, hidden otherwise) and chews four times; the cookie gets three bite marks with a crumb falling at each, then the last bit goes in. Then "^ ^", a blush and two hops.
- He waits about 3 s after arriving, then rolls home at his wandering pace. The click is remembered for about 5.5 s more after that.
- **While he goes for a cookie his mood's face is put aside** (Fabio, 2026-11-22: he was curious and the coin's joy mixed in). One feeling at a time.
- **Cookies in a row:** a click before the last cookie's memory runs out counts as the next one in a row. **The 6th in a row makes him sick:** after eating it his eyes go green and squeeze, he leans back, lurches forward with his mouth wide open and a rainbow pours from his mouth to the ground into a little rainbow puddle; then dizzy eyes and droopy lids, the green fades, and he rolls home. Clicks are ignored while he's sick (and you can't pet him then: a click on him would end it).
- A cookie wakes him from sleep.
- A redraw from the hook (a mood change) ends a run and resets the count. Rare, accepted.
- How it counts without script: `architecture/how-it-works.md` § Cookie game.

## Props: what Claude is doing (built 2026-11-22, Fabio chose "add props")

When Claude starts a tool (main agent only), a small prop pops up on the band and he goes to look at it. At most one every 12 s.

| Tool | Prop |
| --- | --- |
| Read | file (page with lines) |
| Grep, Glob, ToolSearch | magnifying glass |
| Edit, Write, NotebookEdit | pencil |
| Bash, PowerShell | terminal (`>_`) |
| WebFetch, WebSearch, browser tools | globe |

The visit (about 5.5 to 9 s): the prop pops up 110 to 230 px away on the side with more room; he spots it (eyes on it, a hop); he rolls over with his head leaning back and stops 32 px short; he leans in with a "?"; he nudges it (it wobbles); "!" and a happy squint; from spotting it until the "!" he wears the curious face (right eye bigger, left lid cocked; Fabio asked for this 2026-11-22), then his mood's face comes back; the prop poofs and he stays there: that spot is his new home (Fabio, 2026-11-22: no rushing back). His mood stays as it is throughout (focused during a turn). **Mad (mad or tantrum mood), he kicks it instead** (Fabio, 2026-11-22, MPI-5): he glares at it while it shivers, dashes over in half the time, jerks into it with his head snapping at it, and it flies off spinning out of the band; no "?"/"!" and no curious face, one satisfied hop, then he stays there. Same plan and timings, so only the drawing differs (`kickCss` in `draw/features/visit.ts`). Mood and heat changes wait until the visit is over (a passing mood like happy then gets its full time).

## Heat (built 2026-11-22, Fabio's idea)

How full the context window is warms him up, on top of any mood:

| Context | Level | Look |
| --- | --- | --- |
| under 20% | 0 | normal |
| 20-29% | 1 | whole body (head bezel, neck, chassis, wheel rims and tyres) a bit reddish, lids 1 px heavier |
| 30-39% | 2 | body redder, lids 2 px heavier, a sweat drop slides down one side of his head |
| 40%+ | 3 | body red, lids 3.5 px heavier, sweat on both sides |

No red cheeks (Fabio, 2026-11-22: not red cheeks all the time; the whole body, wheels too). Levels moved down the same day (were 30/50/70%): at 40% Fabio saw almost nothing and said he should really be suffering. Colours made stronger too. Retuned again the same day to 20/30/40% (MPI-8): 15/25/35 made him red at 15% and too hot at 25%; the new steps match Fabio's context bar, and 40% is where he changes session, so a suffering Muki means "time for a new chat".

## Needs attention, mad, tired (built 2026-11-22, MPI-5, Fabio's design; not yet seen live)

Context level is his energy. Attention is a pet or a cookie.

- **Under 30% context (he has energy):**
  - With no attention: **lonely** (the sad face, lasting) after 10 min, **mad** (angry lids: top lids slanted down at the inner corners, eyes a little squinted) at 15 min, **tantrum** from 20 min (Fabio, same day: first 20/28/35 min, 35 was too long). A tantrum: every 2 min, about 5 s of jumping from side to side and landing squashed like stomping (made bigger the same day: Fabio wanted it more obvious, "jump around more"; first it only rocked on his wheels), head shaking "no", four steam puffs off his head and a red "!!" flashing; angry face in between. He stays home in it. 2026-11-23 (MPI-19, Fabio): the "!!" became a red heart that cracks in the middle, its halves fall beside his wheels and get squashed flat; the jumps became fast stamping on the spot, one wheel then the other (about 7 a second, "like kids do"); 0.4 s of play (a pet or a cookie) calms him at once for the rest of the drawing; no tantrum during a trip to a prop or the paper pile.
  - **5 boops in a row** (each within 1.5 s of the last) make him **mad for 15 s**: angry face that stays angry under your hand, no hop, no hearts, no blush, and he dodges your hand, sliding his body 30 px away from the side the mouse is on.
  - **Woken from sleep:** your mouse on him while he's asleep gets the angry face (no hop, the z's stop) instead of the happy one, for as long as it's there.
- **Over 30% context (no energy):** he can't get mad: no boop anger, no waking anger, no tantrum. With no attention for 10 min he's lonely. He rolls slowly (trips take 1.8x as long). Boops work as before.
- A pet or a cookie calms him at once inside the drawing (touch wins over any mood). For the next drawing, the hook counts your mouse over the band for 0.4 s or more (a quick cookie counts; a mouse just crossing the band does not) as attention (was 5 s: the hover sensor loses the mouse 1 to 3 s into play, so petting almost never counted) and restarts the clock: it can't tell a pet from a cookie or from just resting the mouse there.
- Asleep, he shows none of it; the clock keeps running, so if you were away long he may wake up mid-tantrum.
- Passing moods (alert, happy, sad) and a question waiting for you still show over these.
- Timings: `character/tuning.ts`; faces: `character/moods.ts` (`lonely`, `mad`, `tantrum`).

## Known limits of v1

- The route is one pre-made loop of about 62 s, so it repeats. If that's noticeable, re-plan the route now and then.
- He can't roll toward the mouse; he only stops and looks.
- He can't tell a click from a long hold (no script). Clicks are counted with focus ladders (cookies, boops). A wiggle also plays once when the page first loads.


## Showing up in a new drawing (2026-11-22, MPI-9)

He stays hidden in a new drawing for 0.75 s and then fades in over 0.15 s, so he appears just as the old drawing on top goes (0.9 s). Shown earlier, two robots were in the band whenever the old drawing had him elsewhere (mid-cookie, out on a trip). A drawing that loads late can leave a short moment with no robot instead. The mood face slide waits for the same moment. A redraw during a cookie game still ends the game: the new frame knows nothing of the click.
