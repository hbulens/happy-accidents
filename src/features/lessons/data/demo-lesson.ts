import type { LessonContent } from '@/features/lessons/schema'

// A hand-written lesson so the app is fully explorable without an API key.
// It doubles as a fixture for tests and as an example of the expected shape.
export const DEMO_LESSON: LessonContent = {
  title: 'Winter Cabin by the Lake',
  intro:
    "Hi, and welcome. Today we're going to paint a quiet little cabin tucked up against a frozen lake, with some big soft mountains way off in the distance. Nothing fancy, just a peaceful place you'd like to be. Grab your two-inch brush, get your canvas covered in Liquid White, and let's have some fun.",
  sceneDescription:
    'A snow-covered log cabin sits on the left bank of a still, partly frozen lake. Behind it, a line of dark evergreens leads back to pale blue mountains under a soft winter sky. A path of footprints leads from the bottom right toward the cabin door.',
  mood: 'Late winter afternoon, soft cool light, quiet and calm.',
  difficulty: 'beginner',
  canvas: '18 x 24 inch stretched canvas',
  totalMinutes: 75,
  basecoat:
    'A thin, even coat of Liquid White over the whole canvas with the 2-inch brush. Just enough to make it slick; if it looks white and wet, you have too much.',
  palette: [
    { name: 'Liquid White', hex: '#f7f5ee', role: 'Base coat that keeps the canvas wet' },
    { name: 'Titanium White', hex: '#f4f1e8', role: 'Sky, snow, highlights and water lines' },
    { name: 'Phthalo Blue', hex: '#0b2c6a', role: 'Sky, water and snow shadows' },
    { name: 'Prussian Blue', hex: '#0f2540', role: 'Mountain base and tree darks' },
    { name: 'Van Dyke Brown', hex: '#2e1c10', role: 'Cabin, tree trunks and dark mixtures' },
    { name: 'Alizarin Crimson', hex: '#7c1329', role: 'Warms the mountain shadow and the sky near the horizon' },
    { name: 'Sap Green', hex: '#3d5a1e', role: 'Evergreens' },
    { name: 'Cadmium Yellow', hex: '#f2c11c', role: 'Tree highlights and the cabin window' },
    { name: 'Bright Red', hex: '#c8201d', role: 'Signature' },
    { name: 'Dark Sienna', hex: '#3d1f12', role: 'Warms the cabin logs' },
  ],
  tools: [
    { name: '2-inch background brush', role: 'Base coat, sky, water and snow' },
    { name: '1-inch landscape brush', role: 'Distant trees and bushes' },
    { name: 'Fan brush', role: 'Evergreens and grass' },
    { name: '#10 painting knife', role: 'Mountains and the cabin' },
    { name: '#5 painting knife', role: 'Water lines and the cabin window' },
    { name: 'Script liner brush', role: 'Trunks, branches, footprints and the signature' },
  ],
  paintingPrompt:
    'A serene winter landscape in soft wet-on-wet oils. A small dark log cabin with a snow-covered roof and one glowing yellow window sits on the left bank of a still, frozen lake. Three dark evergreens of different heights stand behind and beside it, with a pale line of distant trees along the far shore. Beyond, two soft blue-grey mountains with broken white snow highlights dissolve into mist. Late-afternoon winter light, pale blue sky warming to a faint pink glow at the horizon. Soft white snowbanks with blue shadows in the foreground and a trail of footprints leading toward the cabin door.',
  composition: {
    horizonY: 44,
    focalPoint: { x: 30, y: 50 },
    notes:
      'The cabin sits on the left third at the horizon, with the tree line leading the eye toward it. The lake fills the lower right, and the footprints lead in from the bottom corner. The mountains stay pale and far so they never compete with the cabin.',
  },
  steps: [
    {
      title: 'Liquid White',
      phase: 'prep',
      tool: '2-inch background brush',
      colors: ['Titanium White'],
      instruction:
        "Let's start by covering the whole canvas with a thin coat of Liquid White. Load a little on the two-inch brush and go long strokes, up and down, then across, until every bit of the canvas is slick. Don't let it puddle; if the canvas looks wet and shiny, wipe some off with a clean brush. This is what lets us blend right on the canvas. Take your time here, it matters more than it looks.",
      technique: 'Base coat',
      brushLoading: 'A small amount of Liquid White on the 2-inch brush, worked in until the canvas is just slick',
      tips: ['Use long, firm strokes in both directions.', 'The canvas should feel slick, not wet.'],
      watchOut: 'Too much Liquid White makes every color slide and turn milky.',
      happyAccident: null,
      minutes: 5,
      canvasAfter:
        'The whole canvas is covered in a thin, slick, even coat of Liquid White. Nothing else is painted yet; it is a blank, faintly glossy white canvas.',
    },
    {
      title: 'A soft winter sky',
      phase: 'sky',
      tool: '2-inch background brush',
      colors: ['Phthalo Blue', 'Titanium White', 'Alizarin Crimson'],
      instruction:
        "Tap a little Phthalo Blue into the bristles of the two-inch brush. Start at the top of the canvas with little criss-cross strokes and work your way down, letting it get lighter and lighter as you get near the horizon. Right at the horizon, tap in a tiny touch of Alizarin Crimson with a bit of white; it warms the sky and pushes it way back. Now take a clean, dry two-inch brush and blend with long horizontal strokes, then a soft criss-cross to take out any lines. Very light pressure, just the tips of the bristles.",
      technique: 'Criss-cross strokes and blending',
      brushLoading: 'Tap the corner into the paint, then work it into the bristles on the palette; a little goes a long way',
      tips: ['Start light. You can always add more blue.', 'Blend with a clean brush; a dirty brush makes mud.'],
      watchOut: 'Pressing hard while blending drags the blue down into the horizon.',
      happyAccident: 'A darker patch at the top becomes a weather front coming in; leave it and enjoy it.',
      minutes: 7,
      canvasAfter:
        'A softly blended winter sky fills the top half: pale blue at the top fading to a warm, almost white glow at the horizon, with a faint touch of pink. The bottom half of the canvas is still bare white.',
    },
    {
      title: 'The frozen lake',
      phase: 'water',
      tool: '2-inch background brush',
      colors: ['Phthalo Blue', 'Titanium White'],
      instruction:
        "Decide where your horizon goes; ours sits a little below the middle. With the same two-inch brush and a little more Phthalo Blue, pull straight down from the horizon line to the bottom of the canvas. Straight down, that's the secret to reflections. Then very gently go across, horizontally, to lay it all flat like ice. Keep the water darker than the sky near the shore and lighter at the horizon. Take a clean brush and lightly blend where the sky meets the water so there is no hard line yet.",
      technique: 'Pulling down and laying flat',
      brushLoading: 'Same brush, a little more blue tapped in',
      tips: ['Straight down, then gently across.', 'Leave the far edge lighter so the lake feels far away.'],
      watchOut: 'Curved downward strokes make the water look like it is pouring.',
      happyAccident: null,
      minutes: 5,
      canvasAfter:
        'The sky is finished. Below the horizon, a smooth pale blue-grey frozen lake fills the bottom of the canvas, lighter near the horizon and darker toward the bottom, with soft horizontal blending. No land, trees or mountains yet.',
    },
    {
      title: 'Big soft mountains',
      phase: 'mountains',
      tool: '#10 painting knife',
      colors: ['Prussian Blue', 'Van Dyke Brown', 'Alizarin Crimson', 'Titanium White'],
      instruction:
        "Mix Prussian Blue, Van Dyke Brown and a touch of Alizarin Crimson into a dark grey-blue. Cut across it with the knife so you get a little roll of paint on the edge. Now, with firm pressure, pull the mountain shape: one big peak on the right, a lower one to the left. Just the basic shape, don't fuss. Then take a clean two-inch brush and pull the paint down from the peaks to make the mountain body, and tap the base to soften it. For the highlight, pick up a little white with a touch of blue on the knife, no pressure at all, and let it glide down the right side of each peak, breaking the stroke so it flips off. The shadow side gets the dark mixture pulled the other way.",
      technique: 'Knife pull with highlight and shadow',
      brushLoading: 'Cut across the pile of paint to load a thin roll on the knife edge',
      tips: ['No pressure on the highlight; let the paint break.', 'Keep the mountains paler than the trees you will paint later.'],
      watchOut: 'Pressing on the highlight mixes it into the dark and you lose the sparkle.',
      happyAccident: 'If a highlight skips, that gap is a shadowed ravine. Leave it.',
      minutes: 10,
      canvasAfter:
        'Two pale blue-grey palette-knife mountains rise across the horizon, the taller one on the right, with crisp broken white snow highlights on their right faces and darker blue shadows on their left. Sky above, frozen lake below; no trees or cabin yet.',
    },
    {
      title: 'Mist at the base',
      phase: 'mountains',
      tool: '2-inch background brush',
      colors: ['Titanium White'],
      instruction:
        "Now let's push those mountains way back. Take a clean, dry two-inch brush and tap along the base of the mountains, then lift upward with a gentle sweep. You are just pulling the light color up into the dark. Do this a couple of times until the bottom of the mountain disappears into mist. This one little move gives you all that distance. Tap, lift, and walk away from it.",
      technique: 'Tap and lift',
      brushLoading: 'Clean, dry brush, no paint',
      tips: ['Tap first, then lift; never scrub.', 'The mist should be brightest right at the base.'],
      watchOut: 'Overworking turns the mist grey and kills the mountain.',
      happyAccident: null,
      minutes: 3,
      canvasAfter:
        'The base of the mountains dissolves into soft white mist so they look far away. Sky, mountains with snow highlights, mist, and the frozen lake are painted. Still no trees, cabin or snowbanks.',
    },
    {
      title: 'Distant tree line',
      phase: 'background',
      tool: '1-inch landscape brush',
      colors: ['Prussian Blue', 'Sap Green', 'Titanium White'],
      instruction:
        "Mix a soft blue-green with Prussian Blue, a little Sap Green and quite a bit of white, so it stays pale and far away. Load the top corner of the one-inch brush and, starting at the horizon on the left, tap in little tree tops and pull each one straight down. Make them different heights; nature is never even. Let them get a little taller as they come toward the cabin side. Then tap the bottom edge with a clean brush to sit them in the mist.",
      technique: 'Corner tapping and pulling down',
      brushLoading: 'Just the top corner of the brush, tapped into the mixture',
      tips: ['Pale color keeps them far away.', 'Vary the heights and the spacing.'],
      watchOut: 'Too dark and they jump in front of the mountains.',
      happyAccident: null,
      minutes: 5,
      canvasAfter:
        'A soft, pale blue-green line of small distant trees sits along the far shore on the left two-thirds, under the misty mountains. Sky, mountains, mist, distant trees and the frozen lake are painted; no foreground yet.',
    },
    {
      title: 'The far shore and its reflection',
      phase: 'midground',
      tool: '2-inch background brush',
      colors: ['Titanium White', 'Phthalo Blue'],
      instruction:
        "Load a little white with a touch of Phthalo Blue on the two-inch brush and lay in the snowy far shore right along the horizon on the left, under the tree line, with short horizontal strokes. Now pull straight down into the water from the tree line to make their reflection; just a soft shadow of the trees, not a copy. Then lightly stroke across to lay it flat. Finish with a thin line of pure white along the edge of the shore with the knife, held flat, barely touching.",
      technique: 'Reflections pulled down and laid flat',
      brushLoading: 'A small amount of white tapped into the corner',
      tips: ['Reflections are always a bit darker and softer than the object.', 'Water lines are horizontal and thin.'],
      watchOut: 'A crooked water line tips the whole lake.',
      happyAccident: null,
      minutes: 5,
      canvasAfter:
        'A thin white snowy far shore runs along the horizon under the distant trees, with a soft, slightly darker reflection of the tree line pulled straight down into the ice and a bright thin white water line along the shore edge. No evergreens, cabin or snowbanks yet.',
    },
    {
      title: 'Happy little evergreens',
      phase: 'midground',
      tool: 'Fan brush',
      colors: ['Sap Green', 'Van Dyke Brown', 'Prussian Blue'],
      instruction:
        "Mix Sap Green, Van Dyke Brown and Prussian Blue into a good dark green. Load the fan brush on both sides. Behind where the cabin will go, on the left, touch the top of a tree with just the corner, then wiggle side to side as you come down, pressing harder and letting the branches get wider. Give it a friend or two, some taller, some shorter. Leave a gap for the cabin. These are the trees that make the cabin feel cozy, so make them dark and full.",
      technique: 'Fan brush wiggle',
      brushLoading: 'Pull the fan brush through the paint on both sides until it is fully loaded',
      tips: ['Start with the corner for the tip of the tree.', 'Trees come in families; give them friends.'],
      watchOut: 'Starting wide at the top makes a lollipop, not a pine.',
      happyAccident: 'A tree that leans is a tree with character. Build a little bush at its foot.',
      minutes: 8,
      canvasAfter:
        'Three dark green evergreen trees of different heights stand on the left half in front of the distant tree line, painted with a fan brush, with a gap on the right of them for a cabin, and soft yellow-green highlights on their right sides. Everything behind them is finished; no cabin, snowbanks or details yet.',
    },
    {
      title: 'The little cabin',
      phase: 'midground',
      tool: '#10 painting knife',
      colors: ['Van Dyke Brown', 'Titanium White', 'Cadmium Yellow'],
      instruction:
        "Here's our cabin. With Van Dyke Brown on the knife, put in the back edge of the cabin first, a small vertical stroke, then the front wall a little bigger, so it has depth. Scrape a few horizontal lines in the wall with the knife edge to suggest logs. Now mix white with a touch of blue and, with a little roll of paint on the knife, lay the snowy roof on top, angled down toward the back. Put a tiny touch of Cadmium Yellow with white in the wall for a window with the lamp lit; that one little dot makes somebody live here.",
      technique: 'Knife building, back to front',
      brushLoading: 'A small roll of paint on the long edge of the knife',
      tips: ['Back wall first, then front, then roof.', 'Keep it small. A big cabin flattens the picture.'],
      watchOut: 'A roof that is level with the ground looks like a box; angle it.',
      happyAccident: 'A wobbly wall is an old cabin. Add a lean-to and it looks on purpose.',
      minutes: 8,
      canvasAfter:
        'A small dark log cabin with a snowy white roof and one warm yellow lit window sits to the right of the evergreens at the shoreline. Sky, mountains, mist, distant trees, far shore, evergreens and cabin are painted; the foreground snow is not yet.',
    },
    {
      title: 'Snowbanks and the near shore',
      phase: 'foreground',
      tool: '2-inch background brush',
      colors: ['Titanium White', 'Phthalo Blue'],
      instruction:
        "Load the two-inch brush with white and a touch of blue on one corner. Starting at the base of the cabin and the trees, tap in soft snowbanks, pulling the paint in the direction the ground lies, down and to the right toward the lake. Keep the lit side white and the shadow side bluish. Bring a bank around the lower right corner of the canvas so the lake has a near shore and we are standing on it. Use just the corner of the brush and let the strokes follow the land.",
      technique: 'Tapping and pulling in the lay of the land',
      brushLoading: 'White on the brush, a touch of blue on the corner for shadows',
      tips: ['Follow the lay of the land with every stroke.', 'Shadows in snow are blue, never grey.'],
      watchOut: 'Flat horizontal snow reads as more water.',
      happyAccident: null,
      minutes: 6,
      canvasAfter:
        'Soft white snowbanks with blue shadows sweep from the base of the trees and cabin down toward the lake, and a snowy near shore curves around the bottom right corner so the viewer stands on the bank. Only small details and the signature are missing.',
    },
    {
      title: 'Bushes, trunks and footprints',
      phase: 'details',
      tool: 'Script liner brush',
      colors: ['Van Dyke Brown', 'Sap Green', 'Cadmium Yellow', 'Phthalo Blue'],
      instruction:
        "Thin some Van Dyke Brown with paint thinner until it flows like ink and load the script liner by turning it in the paint. Put a couple of little trunks under the evergreens and some bare branches poking out of the snow near the cabin, turning the brush as you pull so the lines stay thin. With the fan brush and the dark green, tap in a few bushes at the base of the trees and touch the tops with green and Cadmium Yellow on the light side. Finally, with a little blue-white on the liner, dot in a trail of footprints from the bottom right up toward the cabin door, getting smaller as they go.",
      technique: 'Liner brush lines and fan brush bushes',
      brushLoading: 'Thin the paint until it flows, turn the liner to a point',
      tips: ['If the liner drags, the paint is too thick; thin it more.', 'Footprints get smaller and closer as they go away.'],
      watchOut: 'Too many details and the eye has nowhere to rest.',
      happyAccident: 'A blob from the liner is a stump under the snow.',
      minutes: 8,
      canvasAfter:
        'A dark green bush with yellow-green highlights sits at the foot of the trees, thin dark trunks show under the evergreens, and a trail of small footprints in the snow leads from the bottom right up to the cabin door. The painting is complete except for the signature.',
    },
    {
      title: 'Sign it, it is yours',
      phase: 'finish',
      tool: 'Script liner brush',
      colors: ['Bright Red'],
      instruction:
        "Step back and look at it. Look at that, you did that. Now thin a little Bright Red, load the liner brush, and put your signature down in the bottom left corner, small and tidy. Then wash your brushes, beat the devil out of them, and go show somebody. From all of us here, happy painting, and God bless.",
      technique: 'Signature',
      brushLoading: 'Thin Bright Red on the script liner, brought to a fine point',
      tips: ['Sign small; it is a painting, not a poster.', 'Let it dry flat for a few days before framing.'],
      watchOut: 'Signing into wet dark paint makes the red muddy; keep it light.',
      happyAccident: null,
      minutes: 3,
      canvasAfter:
        'The finished painting: winter cabin by a frozen lake with evergreens, misty snow-capped mountains and footprints in the snow, with a small red signature in the bottom left corner.',
    },
  ],
  closing:
    "I hope you had as much fun as I did. This is your world, and you can put anything you want in it. Keep that canvas up where you can see it, and I'll see you at the easel next time.",
  adaptationNotes: null,
}
