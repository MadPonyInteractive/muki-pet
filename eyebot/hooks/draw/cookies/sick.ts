// Being sick after the 6th cookie in a row: the face goes green, his eyes
// squeeze, he leans back, lurches forward and a rainbow pours out of his mouth
// into a puddle; then dizzy eyes and droopy lids before he rolls home.

export const SICK_CSS =
  `.L6:focus{pointer-events:all;x:-5000px;width:12000px;animation:gone 0s calc(var(--t) + var(--r) + 8.6s) forwards}` +
  // No petting him mid-sick (a click on him would end it): clicks go to the strip.
  `.L6:focus~.bot,.L6:focus~.bot .p{pointer-events:none}` +
  `.L6:focus~.bot .eye{animation:sickc 5.8s ease-out calc(var(--t) + 1.5s),squeeze 2.9s ease-in-out calc(var(--t) + 1.5s)}` +
  `.L6:focus~.bot .top{animation:droop 3s ease-in-out calc(var(--t) + 4.4s)}` +
  `@keyframes sickc{8%,80%{fill:#a5e05a}}` +
  `@keyframes squeeze{12%{transform:scale(1.1,.6)}22%{transform:scale(.95,.8)}32%,85%{transform:scale(1.15,.3)}}` +
  `@keyframes ill{25%{transform:rotate(calc(var(--s) * -7deg))}33%,80%{transform:rotate(calc(var(--s) * 12deg))}}` +
  `@keyframes gag{10%,88%{transform:scale(1.5,2.3)}}` +
  `@keyframes dizzy{0%,100%{transform:translate(3px,0)}25%{transform:translate(0,2px)}50%{transform:translate(-3px,0)}75%{transform:translate(0,-2px)}}` +
  `@keyframes droop{15%,80%{transform:translateY(5px)}}` +
  `.rb,.pd{display:none}.L6:focus~.bot .rb,.L6:focus~.bot .pd{display:inline}` +
  `.rbs{transform:scaleX(var(--s))}.pd{transform:scaleX(var(--s))}` +
  `.rbs path{fill:none;stroke-linecap:round;stroke-dasharray:100 200;stroke-dashoffset:100;animation:pour 1.9s linear calc(var(--t) + 2.45s)}` +
  `@keyframes pour{30%,62%{stroke-dashoffset:0}100%{stroke-dashoffset:-100}}` +
  `.pdi{transform:scale(0);animation:puddle 4.6s ease-out calc(var(--t) + 2.9s)}` +
  `@keyframes puddle{0%{transform:scale(.2)}12%,70%{transform:none;opacity:1}100%{transform:none;opacity:0}}`

const RAINBOW = ['#ff5a5a', '#ffa24a', '#ffe14a', '#6de36a', '#4ab8ff', '#a87aff']

// The rainbow, from his mouth (head coordinates) down to the ground beside him.
export function rainbow(): string {
  const paths = RAINBOW.map(
    (c, i) => `<path pathLength="100" d="M0,1C15,-12 40,-6 50,43" stroke="${c}" stroke-width="${9 - i * 1.5}"/>`,
  ).join('')
  return `<g class="rb" transform="translate(0,-19)"><g class="rbs">${paths}</g></g>`
}

// The puddle it leaves on the ground.
export function puddle(): string {
  const rings = RAINBOW.filter((_, i) => i % 2 === 0)
    .map((c, i) => `<ellipse rx="${10 - i * 3}" ry="${2.2 - i * 0.6}" fill="${c}"/>`)
    .join('')
  return `<g class="pd"><g transform="translate(42,0)"><g class="pdi">${rings}</g></g></g>`
}
