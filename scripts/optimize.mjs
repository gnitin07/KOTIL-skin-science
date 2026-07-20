// Downscale + convert the raw source photos into web-sized WebP.
// Reads originals from raw-assets/ (git-ignored) and writes what the site ships.
// Run: npm run assets:optimize
import sharp from 'sharp'
import { stat, mkdir } from 'node:fs/promises'
import path from 'node:path'

const SRC_DIR = path.resolve('raw-assets')
const OUT_DIR = path.resolve('public/assets')
await mkdir(OUT_DIR, { recursive: true })

// [source, output, resize opts, extra]
//   extra.trim  -> crop away empty transparent margins (cut-out PNGs)
//   extra.alpha -> keep transparency (higher quality alpha channel)
const JOBS = [
  ...['m1', 'm2', 'm3', 'm4', 'm5'].map((n) => [`${n}.png`, `${n}.webp`, { height: 1500 }, { alpha: true }]),
  ['team.png', 'team.webp', { width: 2000 }, { alpha: true }],
  // NB: the hero uses the BACKGROUND-REMOVED cut-out, not the original photo.
  // Pointing this at hero-treatment.png silently ships the grey studio backdrop.
  ['hero-treatment-cutout.png', 'hero-treatment.webp', { height: 1400 }, { trim: true, alpha: true }],
  ['glow.png', 'glow.webp', { width: 2000 }],
  ...['t1', 't2', 't3', 't4', 't5'].map((n) => [`${n}.png`, `${n}.webp`, { width: 900 }]),
]

const kb = (b) => (b / 1024).toFixed(0) + 'KB'

let before = 0
let after = 0

for (const [src, out, resize, extra = {}] of JOBS) {
  const srcPath = path.join(SRC_DIR, src)
  const outPath = path.join(OUT_DIR, out)
  try {
    const s = await stat(srcPath)
    let img = sharp(srcPath)
    if (extra.trim) img = sharp(await img.trim({ threshold: 10 }).toBuffer())
    await img
      .resize({ ...resize, withoutEnlargement: true })
      .webp(extra.alpha
        ? { quality: 88, effort: 5, alphaQuality: 90 }
        : { quality: 82, effort: 5 })
      .toFile(outPath)
    const o = await stat(outPath)
    before += s.size
    after += o.size
    console.log(`${src.padEnd(10)} ${kb(s.size).padStart(8)} -> ${out.padEnd(11)} ${kb(o.size).padStart(8)}`)
  } catch (e) {
    console.warn(`skip ${src}: ${e.message}`)
  }
}

console.log(`\nTOTAL ${kb(before)} -> ${kb(after)}  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`)
