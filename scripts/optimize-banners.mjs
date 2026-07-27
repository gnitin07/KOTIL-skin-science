// Optimise the hero banner set (a desktop + mobile image per slide).
//
// Sources: raw-assets/banners/<n>-<slug>-{desktop,mobile}.{jpg,png}
// Output:  public/banners/<same-name>.webp
//
// Run: npm run assets:banners
import sharp from 'sharp'
import { readdirSync, statSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const SRC = 'raw-assets/banners'
const OUT = 'public/banners'
if (!existsSync(SRC)) { console.error(`No ${SRC}/`); process.exit(1) }
mkdirSync(OUT, { recursive: true })

const kb = (b) => (b / 1024).toFixed(0) + 'KB'
const files = readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()

let before = 0
let after = 0
for (const file of files) {
  const src = path.join(SRC, file)
  const out = path.join(OUT, file.replace(/\.[^.]+$/, '.webp'))
  const isMobile = /mobile/i.test(file)
  // Cap the long edge: desktop 1920 wide, mobile 1080 wide. Retina-sharp,
  // still a fraction of the multi-MB source.
  const resize = isMobile ? { width: 1080 } : { width: 1920 }
  await sharp(src).resize({ ...resize, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(out)
  const s = statSync(src).size, o = statSync(out).size
  before += s; after += o
  console.log(`${file.padEnd(26)} ${kb(s).padStart(9)} -> ${path.basename(out).padEnd(26)} ${kb(o).padStart(8)}`)
}
console.log(`\nTOTAL ${kb(before)} -> ${kb(after)}  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`)
