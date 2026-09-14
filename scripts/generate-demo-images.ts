// Paints the bundled demo lesson's pictures into public/demo using Replicate.
// Run once with REPLICATE_API_TOKEN in .env or .env.local (bun loads both):  bun run demo:images
import { mkdir, writeFile } from 'node:fs/promises'
import { DEMO_LESSON } from '../src/features/lessons/data/demo-lesson'
import { paintFinal, paintSteps } from '../src/features/lessons/server/images'

const outDir = new URL('../public/demo/', import.meta.url)

function dataUrlToBuffer(dataUrl: string): Buffer {
  return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64')
}

await mkdir(outDir, { recursive: true })
console.log('Painting the finished picture…')
const final = await paintFinal(DEMO_LESSON, null)
await writeFile(new URL('final.webp', outDir), dataUrlToBuffer(final.dataUrl))
console.log('  final.webp')

console.log('Painting each step…')
await paintSteps(
  final.url,
  DEMO_LESSON,
  async (img) => {
    await writeFile(new URL(`step-${img.index}.webp`, outDir), dataUrlToBuffer(img.dataUrl))
    console.log(`  step-${img.index}.webp`)
  },
  (err) => console.error(`  step-${err.index} failed: ${err.error}`),
)
console.log('Done.')
