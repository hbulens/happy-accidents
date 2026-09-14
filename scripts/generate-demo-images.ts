// Paints the bundled demo lesson's pictures into public/demo: the finished
// picture once, then each step revealed from it.
// Run once with REPLICATE_API_TOKEN in .env or .env.local:  bun run demo:images
import { mkdir, writeFile } from 'node:fs/promises'
import { DEMO_LESSON } from '../src/features/lessons/data/demo-lesson'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { paintLesson, regionsFor, buildSteps, CANVAS_W, CANVAS_H } from '../src/features/lessons/server/images'
import { decodeJpeg, resize } from '../src/lib/raster'

const outDir = new URL('../public/demo/', import.meta.url)
await mkdir(outDir, { recursive: true })

function bytes(dataUrl: string): Buffer {
  return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64')
}

const finalPath = new URL('final.jpg', outDir)
if (existsSync(finalPath) && !process.argv.includes('--repaint')) {
  console.log('Reusing final.jpg (pass --repaint to paint it again). Mapping steps…')
  const final = resize(decodeJpeg(new Uint8Array(await readFile(finalPath))), CANVAS_W, CANVAS_H)
  const regionsArg = process.argv.indexOf('--regions')
  const regions = regionsArg >= 0 ? JSON.parse(await readFile(process.argv[regionsArg + 1], 'utf8')) : await regionsFor(DEMO_LESSON, final)
  await writeFile(new URL('regions.json', outDir), JSON.stringify(regions))
  await buildSteps(
    DEMO_LESSON,
    final,
    regions,
    async (img) => {
      if (img.kind === 'final') return
      await writeFile(new URL(`step-${img.index}.jpg`, outDir), bytes(img.dataUrl))
      console.log(`  step-${img.index}.jpg`)
    },
    (err) => console.error(`  ${err.kind} ${err.index} failed: ${err.error}`),
    (message) => console.log(message + '…'),
  )
} else await paintLesson(
  DEMO_LESSON,
  null,
  async (img) => {
    const name = img.kind === 'final' ? 'final.jpg' : `step-${img.index}.jpg`
    await writeFile(new URL(name, outDir), bytes(img.dataUrl))
    console.log(`  ${name}`)
  },
  (err) => console.error(`  ${err.kind} ${err.index} failed: ${err.error}`),
  (message) => console.log(message + '…'),
)
console.log('Done.')
