// Paints the bundled demo lesson's pictures into public/demo using Replicate.
// Run once with REPLICATE_API_TOKEN in .env or .env.local (bun loads both):  bun run demo:images
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { DEMO_LESSON } from '../src/features/lessons/data/demo-lesson'
import { paintFinal, paintSteps } from '../src/features/lessons/server/images'

const outDir = new URL('../public/demo/', import.meta.url)

function dataUrlToBuffer(dataUrl: string): Buffer {
  return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64')
}

await mkdir(outDir, { recursive: true })
const finalPath = new URL('final.webp', outDir)
let finalUrl: string
if (existsSync(finalPath) && !process.argv.includes('--repaint')) {
  console.log('Reusing existing final.webp (pass --repaint to paint it again)')
  finalUrl = `data:image/webp;base64,${(await readFile(finalPath)).toString('base64')}`
} else {
  console.log('Painting the finished picture…')
  const final = await paintFinal(DEMO_LESSON, null)
  await writeFile(finalPath, dataUrlToBuffer(final.dataUrl))
  console.log('  final.webp')
  finalUrl = final.url
}

console.log('Painting each step…')
await paintSteps(
  finalUrl,
  DEMO_LESSON,
  async (img) => {
    if (existsSync(new URL(`step-${img.index}.jpg`, outDir))) return
    await writeFile(new URL(`step-${img.index}.jpg`, outDir), dataUrlToBuffer(img.dataUrl))
    console.log(`  step-${img.index}.jpg`)
  },
  (err) => console.error(`  step-${err.index} failed: ${err.error}`),
)
console.log('Done.')
