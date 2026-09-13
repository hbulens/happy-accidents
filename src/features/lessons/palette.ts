// The classic wet-on-wet oil palette and tool kit. Hex values approximate the
// paint straight from the tube so the UI swatches read true.

export const KNOWN_COLORS: Record<string, string> = {
  'titanium white': '#f4f1e8',
  'liquid white': '#f7f5ee',
  'phthalo blue': '#0b2c6a',
  'phthalo green': '#0d4a3f',
  'prussian blue': '#0f2540',
  'midnight black': '#121214',
  'dark sienna': '#3d1f12',
  'van dyke brown': '#2e1c10',
  'alizarin crimson': '#7c1329',
  'sap green': '#3d5a1e',
  'cadmium yellow': '#f2c11c',
  'yellow ochre': '#c8912a',
  'indian yellow': '#e39a1b',
  'bright red': '#c8201d',
  'liquid clear': '#efefe6',
}

export function resolveHex(name: string, fallback: string): string {
  const key = name.trim().toLowerCase()
  return KNOWN_COLORS[key] ?? fallback
}

export const SURPRISE_PROMPTS = [
  'A snow-covered cabin at the edge of a frozen lake, late afternoon winter light',
  'A mountain lake at sunrise with mist rising off the water and a few evergreens on the shore',
  'A quiet autumn path through birch trees with a little wooden bridge',
  'A rugged seascape with waves breaking on dark rocks under a stormy sky',
  'A desert canyon at golden hour with a lone cottonwood and a dry creek bed',
  'A meadow of wildflowers below distant purple mountains on a clear summer day',
  'A waterfall tumbling into a mossy forest pool, soft light through the trees',
  'A lighthouse on a headland at dusk with a calm pink and violet sky',
  'A covered bridge over a stream in early spring, snow still on the banks',
  'Northern lights over a still lake with a dark tree line on the far shore',
]

export function randomSurprise(): string {
  return SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)]
}

export const WAITING_QUOTES = [
  'We don\'t make mistakes, just happy little accidents.',
  'Talent is a pursued interest. Anything you\'re willing to practice, you can do.',
  'There\'s nothing wrong with having a tree as a friend.',
  'Let\'s get crazy. Just let it happen.',
  'In painting you have unlimited power. You have the ability to move mountains.',
  'Beat the devil out of it.',
  'The secret to doing anything is believing that you can do it.',
  'Just go out and talk to a tree. Make friends with it.',
  'This is your world. You\'re the creator. Find freedom on this canvas.',
  'It\'s so important to do something every day that will make you happy.',
]
