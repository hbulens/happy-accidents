// Paints the bundled demo lesson's pictures into public/demo, layer by layer.
// Run once with REPLICATE_API_TOKEN in .env or .env.local:  bun run demo:images
import { mkdir, writeFile } from 'node:fs/promises'
import { DEMO_LESSON } from '../src/features/lessons/data/demo-lesson'
import { paintLayers } from '../src/features/lessons/server/images'

const outDir = new URL('../public/demo/', import.meta.url)
await mkdir(outDir, { recursive: true })

function bytes(dataUrl: string): Buffer {
  return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64')
}

console.log('Painting layer by layer…')
await paintLayers(
  DEMO_LESSON,
  async (img) => {
    const name = img.kind === 'final' ? 'final.jpg' : `step-${img.index}.jpg`
    await writeFile(new URL(name, outDir), bytes(img.dataUrl))
    console.log(`  ${name}`)
  },
  (err) => console.error(`  step-${err.index} failed: ${err.error}`),
)
console.log('Done.')
