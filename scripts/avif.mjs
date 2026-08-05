// Emit an AVIF twin next to every WebP the site ships, and record which ones
// are worth serving in src/avif-manifest.json.
//
// Why re-encode from public/*.webp instead of raw-assets/? Those WebPs are
// already the exact display size each of the other scripts decided on, so this
// stays one script instead of five parallel job tables — and it still works on
// a clone that has not pulled the Git LFS originals.
//
// AVIF is NOT universally smaller: on small, flat, low-detail images its
// container overhead can beat the savings. Anything that does not come out
// meaningfully smaller is deleted and left out of the manifest, so <Img> keeps
// serving the WebP for it.
// Run: npm run assets:avif
import sharp from 'sharp'
import { readdir, stat, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'

const PUBLIC_DIR = path.resolve('public')
const MANIFEST = path.resolve('src/avif-manifest.json')

// Keep the AVIF only if it saves at least this share of the WebP's bytes.
// Below this, the extra request/decode cost is not worth the churn.
const MIN_SAVING = 0.08

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (entry.isFile() && entry.name.endsWith('.webp')) yield full
  }
}

const kb = (b) => (b / 1024).toFixed(1) + 'KB'
const kept = []
let webpTotal = 0
let avifTotal = 0
let skipped = 0

for await (const webpPath of walk(PUBLIC_DIR)) {
  const avifPath = webpPath.replace(/\.webp$/, '.avif')
  // the URL the site requests, e.g. /clinic/g1.webp
  const url = '/' + path.relative(PUBLIC_DIR, webpPath).split(path.sep).join('/')

  try {
    const webpSize = (await stat(webpPath)).size

    await sharp(webpPath)
      // effort 6 is the knee of the curve: near-max compression, sane runtime
      .avif({ quality: 58, effort: 6, chromaSubsampling: '4:2:0' })
      .toFile(avifPath)

    const avifSize = (await stat(avifPath)).size
    const saving = 1 - avifSize / webpSize

    if (saving < MIN_SAVING) {
      await unlink(avifPath)
      skipped++
      console.log(`${url.padEnd(46)} ${kb(webpSize).padStart(9)} -> keep WebP (AVIF ${kb(avifSize)})`)
      continue
    }

    kept.push(url)
    webpTotal += webpSize
    avifTotal += avifSize
    console.log(`${url.padEnd(46)} ${kb(webpSize).padStart(9)} -> ${kb(avifSize).padStart(9)}  (-${(saving * 100).toFixed(0)}%)`)
  } catch (e) {
    console.warn(`skip ${url}: ${e.message}`)
  }
}

kept.sort()
await writeFile(MANIFEST, JSON.stringify(kept, null, 2) + '\n')

console.log(
  `\n${kept.length} AVIF kept, ${skipped} left as WebP` +
  `\nTOTAL ${kb(webpTotal)} -> ${kb(avifTotal)}  (${(100 - (avifTotal / webpTotal) * 100).toFixed(1)}% smaller)` +
  `\nmanifest -> ${path.relative(process.cwd(), MANIFEST)}`
)
