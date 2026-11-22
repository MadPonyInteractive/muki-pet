// Heat from a filling context window, as a class on the svg root (`h0` to
// `h3`): his whole body (head, neck, chassis, wheels) reddens step by step, his
// lids get heavier, then he sweats. Which percentage gives which level is in
// brain/config.ts.

import { COLORS } from './constants.ts'

export const HEAT_CSS =
  `.h1 .bz{stroke:#6e4a4d}.h2 .bz{stroke:#9a4044}.h3 .bz{stroke:#c8383a}` +
  `.h1 .chs{fill:#6e4a4d}.h2 .chs{fill:#9a4044}.h3 .chs{fill:#c8383a}` +
  `.h1 .rm{stroke:#86585c}.h2 .rm{stroke:#b04a4e}.h3 .rm{stroke:#e0484a}` +
  `.h1 .ty{fill:#2a1f22}.h2 .ty{fill:#3a1c1f}.h3 .ty{fill:#4a1719}` +
  `.h1 .tw{transform:translateY(1px)}.h2 .tw{transform:translateY(2px)}.h3 .tw{transform:translateY(3.5px)}` +
  `.sw{display:none}.h2 .sw1,.h3 .sw{display:inline}` +
  `.sw path{opacity:0;transform-box:fill-box;transform-origin:center;animation:drip 2.4s ease-in infinite}.sw2 path{animation-delay:1.2s}` +
  `@keyframes drip{0%{opacity:0;transform:scale(.5)}15%{opacity:.9;transform:none}100%{opacity:0;transform:translateY(16px)}}`

// Two sweat drops on his head (head coordinates), shown from level 2.
const drop = `<path d="M0,0C1,2 2.6,3.6 2.6,5.4A2.6,2.6 0 0 1 -2.6,5.4C-2.6,3.6 -1,2 0,0Z"/>`
export const sweat = () =>
  `<g class="sw sw1" fill="${COLORS.sweat}" transform="translate(30,-46)">${drop}</g>` +
  `<g class="sw sw2" fill="${COLORS.sweat}" transform="translate(-30,-42)">${drop}</g>`
