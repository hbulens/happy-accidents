# Happy Accidents

Step-by-step wet-on-wet oil painting lessons in the spirit of *The Joy of Painting*. Describe a scene or upload a photo, and the app composes a full lesson: palette, brushes, 10 to 14 narrated steps with technique, tips and "happy accident" recoveries. An image model paints the finished picture in the wet-on-wet style and a picture of what your canvas should look like after every step. Lessons are read aloud and can be driven entirely by voice so you never touch the keyboard with painty fingers.

## Stack

TanStack Start (React 19, Vite 7, Nitro), Tailwind v4, zustand, zod, the Anthropic SDK (Claude Opus 5 with structured outputs) for the lesson text, and Replicate (Flux 2 Pro, with Flux Kontext Pro for a signature-removal pass) for the pictures. Package manager: bun.

## Run it

```bash
cp .env.example .env      # add ANTHROPIC_API_KEY and REPLICATE_API_TOKEN
bun install
bun run demo:images       # once: paints the demo lesson's pictures into public/demo (needs the Replicate token)
bun dev                   # http://localhost:3000
```

Without keys the app still runs: use **Open the demo lesson** on the home page (its pictures appear once `demo:images` has run). Lesson generation and "Ask Bob" need the Anthropic key; the pictures need the Replicate token. Without the Replicate token, lessons are generated text-only.

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

`POST /api/lessons` streams Server-Sent Events. First Claude writes the lesson: the request (prompt, or the resized photo as base64) goes in with a system prompt that encodes the wet-on-wet method: materials, the 13-colour palette, brush and knife techniques, order of operations, and the instructor voice. The response is constrained with a zod schema via structured outputs (`src/features/lessons/schema.ts`). Step titles are reported as they stream so the waiting screen shows real progress.

Then the pictures, with no reimagining. Flux 2 Pro paints the finished picture once from the lesson's painting prompt (using your photo as a reference in photo mode). Claude then looks at that picture, with a coordinate grid drawn over it, and outlines the area each step paints. The server reveals the finished painting step by step: each picture shows it only inside the regions painted so far and bare primed canvas everywhere else, so every picture is exactly the previous one plus new paint. Compositing is pure JavaScript. Where a later object covers an earlier layer, that patch stays bare canvas until its step. Images stream to the browser as data URLs and are stored in IndexedDB; lesson text lives in localStorage. The lesson page opens as soon as the finished picture is in and the step pictures keep arriving in the background.

`POST /api/ask` answers mid-lesson questions with the current step as context.

Set `HAPPY_ACCIDENTS_EFFORT` (`low` to `max`) to trade lesson quality for speed, and `HAPPY_ACCIDENTS_PAINT_MODEL` / `HAPPY_ACCIDENTS_EDIT_MODEL` to swap Replicate models.

## Layout

```
src/
  routes/            pages and API routes (thin)
  features/lessons/
    schema.ts        zod contract shared by server and client
    prompts.ts       method reference and instructor voice
    palette.ts       classic palette, surprise prompts, waiting quotes
    server/          Anthropic lesson generation and Replicate image pipeline (server only)
    components/      player, painting display, creator, progress screen, voice bar
    hooks/           speech synthesis and continuous recognition
    stores/          lessons (persisted), images (IndexedDB-backed), generation (background stream)
    utils/           command parser, SSE reader, image encoding, IndexedDB
    data/            bundled demo lesson
  lib/               anthropic client, replicate client, http helpers, cn
scripts/             generate-demo-images.ts
test/                vitest unit tests
```

## Deploying

The Nitro preset is `vercel`. A full lesson with pictures takes three to five minutes, so `vercel.json` raises the function timeout to 300 s (needs a plan that allows it). Set `ANTHROPIC_API_KEY` and `REPLICATE_API_TOKEN` in the project environment.

## A note on the name

The instructor teaches in the wet-on-wet style Bob Ross made famous and never claims to be him. "Bob Ross" and his likeness are trademarks of Bob Ross Inc.; if you publish this, keep the instructor generic or get a licence.
