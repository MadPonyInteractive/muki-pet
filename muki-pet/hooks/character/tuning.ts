// How long things take. Change his pace here.

export const SECOND = 1000
export const MINUTE = 60 * SECOND

// A long quiet spell after a turn: sleepy, then asleep.
export const SLEEPY_AFTER = 5 * MINUTE
export const ASLEEP_AFTER = 15 * MINUTE

// He needs attention (Fabio, 2026-11-22). Play = your mouse over the band for
// PLAY_MS or more (a pet or a cookie; the hook can't tell them apart). With no
// play he gets lonely, then mad, then throws tantrums. Over 30% context he has
// no energy to get mad: he only gets lonely, TIRED_LONELY after the last play.
// Shortened 2026-11-22 (was 20/28/35 min): Fabio found 35 min too long.
// 0.4 s (2026-11-23, MPI-18, from the logs): a quick cookie keeps the mouse on
// the band for 0.5 to 0.6 s, and Fabio wants a cookie to count; a mouse just
// crossing the band shows for 0 to 0.3 s. (1 s missed quick cookies; 5 s missed
// most play.)
export const PLAY_MS = 0.4 * SECOND
export const LONELY_AFTER = 10 * MINUTE
export const MAD_AFTER = 15 * MINUTE
export const TANTRUM_AFTER = 20 * MINUTE
export const TIRED_LONELY = 10 * MINUTE
// The heat level from which he is tired (30% context, character/heat.ts): no
// anger, and he rolls slowly.
export const TIRED_HEAT = 2
// How much slower he rolls when tired.
export const TIRED_SLOW = 1.8

// At most one prop this often, so the band stays calm and swaps stay rare.
export const PROP_GAP = 12 * SECOND
// A redraw waits this long past a visit's end, so the visit drawing is done.
export const AFTER_VISIT_MS = 300
// While your mouse is over the band (petting, cookies, he's watching you) the
// band doesn't redraw: a new drawing would put him back home mid-game. After
// the mouse leaves, it waits this long more, so a cookie he's still eating gets
// finished (Fabio, 2026-11-22).
export const NEAR_GRACE_MS = 3 * SECOND

// A new drawing loads under the old one, which stays on top for 0.9 s (see
// band/frames.ts). He stays hidden in the new one until just before the old one
// goes, then fades in fast. Showing him early (it was .15s) put two robots in
// the band whenever the old drawing had him elsewhere, mid-cookie or out on a
// trip, as the hook cannot know (MPI-9, 2026-11-22). Tried .9s (no overlap at
// all): he blinked out on every redraw, which is every few seconds while Claude
// works (Fabio: "flickering a lot"), because the new frame also takes a moment
// to load. Back to .75s: the 0.15 s overlap hides the load, and while your mouse
// is over him (cookies, petting) the band doesn't redraw at all (`near`).
export const FADE_IN = '.75s'

// A visit starts only after the swap that brings it in is over, so the old
// drawing on top never shows him doing something else beside it. The swap is
// 0.9 s by the hook's clock, and the redraw that ends it can reach the band late
// while the app is busy, so the lead-in keeps a margin over it. In seconds.
export const LEAD = 1.5

// Simulation frames per second for his wandering.
export const FPS = 30

// After a pet or a cookie his eyes stay plain and open this long before his
// mood's eyes (sleepy, sad, curious, ...) come back, so he doesn't seem to
// ignore you once your hand is gone (Fabio, 2026-11-22: "at least 10 to 20
// seconds"; no mouth or blush). Pure CSS (a delayed transition back,
// draw/parts/face.ts), never a brain mood: a mood would redraw him, and a
// redraw while he's out on a trip jumps him home.
export const GLOW = '15s'

// Easings for the cookie dash, the roll home, and the 1 s roll back after an
// early blur.
export const DASH = 'cubic-bezier(.6,0,.25,1)'
export const ROLL = 'cubic-bezier(.45,0,.55,1)'
export const BACK = '1s cubic-bezier(.45,0,.3,1)'

// The Remote Control headset comes off this long after your last message from
// the phone or web (MPI-15), unless you type at the desk first. In ms.
export const REMOTE_IDLE_MS = 15 * MINUTE
// How long the headset's drop (or lift) plays before drawings show it at rest
// (its longest animation, the happy squint, ends at 1.9 s).
export const HEADSET_SETTLE_MS = 2.5 * SECOND
