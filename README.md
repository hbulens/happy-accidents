# Happy Accidents

Step-by-step wet-on-wet oil painting lessons in the spirit of *The Joy of Painting*. Describe a scene or upload a photo, and the app composes a full lesson: palette, brushes, 10 to 14 narrated steps with technique, tips and "happy accident" recoveries, plus a simplified sketch of the canvas that grows step by step. Lessons are read aloud and can be driven entirely by voice so you never touch the keyboard with painty fingers.

## Stack

TanStack Start (React 19, Vite 7, Nitro), Tailwind v4, zustand, zod, and the Anthropic SDK (Claude Opus 5 with structured outputs). Package manager: bun.

## Run it

```bash
cp .env.example .env      # add your ANTHROPIC_API_KEY
bun install
bun dev                   # http://localhost:3000
```

Without a key the app still runs: use **Try the demo lesson** on the home page. Lesson generation and "Ask Bob" need the key.

Other scripts: `bun run build`, `bun run typecheck`, `bun test`, `bun run lint`.

## Voice control

Turn on the microphone in the lesson player. It listens continuously (Chrome, Edge and Safari; Firefox has no speech recognition) and pauses itself while the instructor is talking so it does not transcribe the narration.

| Say | Does |
|---|---|
| "next", "continue", "done" | next step |
| "back", "previous" | previous step |
| "repeat", "say that again" | reads the step again |
| "tips" | reads tips, the watch-out and the happy accident |
| "palette", "what colors" | shows the palette and names this step's colors |
| "tools", "which brush" | shows the tools |
| "show the finished painting" | shows the full sketch |
| "go to step seven" | jumps |
| "stop", "quiet" | stops the voice |
| "Bob, …" or any question | asks the instructor; the answer is spoken |

Keyboard: left and right arrows move between steps, space repeats or hushes.

## How a lesson is made

`POST /api/lessons` sends the prompt (or the resized photo as base64) to Claude with a system prompt that encodes the wet-on-wet method: materials, the 13-color palette, brush and knife techniques, order of operations, and the instructor voice. The response is constrained with a zod schema via structured outputs (`src/features/lessons/schema.ts`), so every lesson has the same shape. Each step carries a few polygon "layers" in a 100 x 75 coordinate space; the client stacks them to draw the canvas preview.

`POST /api/ask` answers mid-lesson questions with the current step as context.

Set `HAPPY_ACCIDENTS_EFFORT` (`low` to `max`) to trade lesson quality for speed. Lessons are stored in the browser (localStorage).

## Layout

```
src/
  routes/            pages and API routes (thin)
  features/lessons/
    schema.ts        zod contract shared by server and client
    prompts.ts       method reference and instructor voice
    palette.ts       classic palette, surprise prompts, waiting quotes
    server/          Anthropic calls (server only)
    components/      player, canvas preview, creator, voice bar
    hooks/           speech synthesis and continuous recognition
    stores/          zustand persisted store
    utils/           command parser, layer math, image encoding
    data/            bundled demo lesson
  lib/               anthropic client, http helpers, cn
test/                vitest unit tests
```

## Deploying

The Nitro preset is `vercel`. Lesson generation can take one to three minutes, so `vercel.json` raises the function timeout to 300 s (needs a plan that allows it). Set `ANTHROPIC_API_KEY` in the project environment.

## A note on the name

The instructor teaches in the wet-on-wet style Bob Ross made famous and never claims to be him. "Bob Ross" and his likeness are trademarks of Bob Ross Inc.; if you publish this, keep the instructor generic or get a licence.
