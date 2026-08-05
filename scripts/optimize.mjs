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
  // trim crops the transparent margin off each cut-out so it sits on the rig floor
  // 1000px, not 1500: .tech__media img caps the machine photo at 480px tall
  // (clamp(320px, 44vw, 480px)), so 1500 was ~3x oversampled and m2 alone was
  // the single heaviest thing on the page. 1000 still covers a 2x screen.
  ...['m1', 'm2', 'm3', 'm4'].map((n) => [`${n}.png`, `${n}.webp`, { height: 1000 }, { trim: true, alpha: true }]),
  ...['t1', 't2', 't3', 't4', 't5'].map((n) => [`${n}.png`, `${n}.webp`, { width: 900 }]),
  // Removed: team / hero-treatment / glow. They were left over from the old
  // GSAP hero rig, which TechSlider replaced — nothing in src/ renders them, so
  // they were ~590KB of WebP+AVIF shipping to Vercel for no reason. Their raw
  // originals went with them; `git show e8f38a3` has them if the design ever
  // wants that hero back.
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
