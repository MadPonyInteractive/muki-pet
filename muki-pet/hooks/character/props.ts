// Props: small things that pop up for what Claude is doing. He rolls over and
// inspects one ("?", a nudge, "!"); draw/features/visit.ts runs the visit. One entry per
// prop: the Claude Code tools that drop it (`match` catches tool names not
// listed, by pattern), and its drawing, standing on the ground at x = 0.

type PropDef = { tools: string[]; match?: RegExp; shape: string }

export const PROP_TABLE = {
  file: {
    tools: ['Read'],
    shape:
      `<path d="M-6,-18H3L7,-14V0H-6Z" fill="#e8eef2" stroke="#8a9aa5" stroke-width="1.2"/>` +
      `<path d="M3,-18V-14H7" fill="none" stroke="#8a9aa5" stroke-width="1.2"/>` +
      `<g stroke="#8a9aa5" stroke-width="1.2"><line x1="-3.5" y1="-11" x2="4" y2="-11"/><line x1="-3.5" y1="-7.5" x2="4" y2="-7.5"/><line x1="-3.5" y1="-4" x2="2" y2="-4"/></g>`,
  },
  lens: {
    tools: ['Grep', 'Glob', 'ToolSearch'],
    shape:
      `<line x1="2.5" y1="-6.5" x2="7.5" y2="-0.5" stroke="#8a9aa5" stroke-width="3.2" stroke-linecap="round"/>` +
      `<circle cx="-1.5" cy="-11" r="6" fill="#5ee7f0" fill-opacity=".25" stroke="#cfe3ea" stroke-width="2.2"/>`,
  },
  pencil: {
    tools: ['Edit', 'Write', 'NotebookEdit'],
    shape:
      `<g transform="rotate(-30)"><rect x="-2.6" y="-19" width="5.2" height="13" fill="#ffcf4d"/>` +
      `<path d="M-2.6,-6L0,-0.5L2.6,-6Z" fill="#f3d9b1"/><path d="M-0.8,-2.2L0,-0.5L0.8,-2.2Z" fill="#3a444b"/>` +
      `<rect x="-2.6" y="-21.5" width="5.2" height="2.8" rx="1" fill="#ff7aa8"/></g>`,
  },
  terminal: {
    tools: ['Bash', 'PowerShell'],
    shape:
      `<rect x="-9" y="-15" width="18" height="14" rx="2.5" fill="#0b1216" stroke="#56626a" stroke-width="1.5"/>` +
      `<path d="M-5.5,-11L-2.5,-8L-5.5,-5" stroke="#5ee7f0" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<line x1="-1" y1="-4.8" x2="4" y2="-4.8" stroke="#5ee7f0" stroke-width="1.5" stroke-linecap="round"/>`,
  },
  globe: {
    tools: ['WebFetch', 'WebSearch'],
    match: /browser|navigate|fetch/i,
    shape:
      `<circle cy="-8" r="7.5" fill="#2b6f9e" stroke="#9fdcff" stroke-width="1.2"/>` +
      `<ellipse cy="-8" rx="3.2" ry="7.5" fill="none" stroke="#9fdcff" stroke-width="1"/>` +
      `<line x1="-7.5" y1="-8" x2="7.5" y2="-8" stroke="#9fdcff" stroke-width="1"/>`,
  },
} satisfies Record<string, PropDef>

export type Prop = keyof typeof PROP_TABLE
export const PROPS = Object.keys(PROP_TABLE) as Prop[]
const DEFS: Record<Prop, PropDef> = PROP_TABLE

export const propShape = (prop: Prop) => DEFS[prop].shape

const BY_TOOL = new Map(PROPS.flatMap((prop) => DEFS[prop].tools.map((tool) => [tool, prop] as const)))

// The prop a tool drops, if any. Tools not listed or matched get none.
export const propFor = (tool: string): Prop | undefined =>
  BY_TOOL.get(tool) ?? PROPS.find((prop) => DEFS[prop].match?.test(tool))
