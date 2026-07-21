// Optimise before/after result photos.
//
// Drop the originals (any filename) into raw-assets/results/ and run this.
// Outputs square-cropped WebP to public/results/ and prints a ready-to-paste
// RESULTS array for src/data.js.
//
// Run: npm run assets:results
import sharp from 'sharp'
import { readdirSync, statSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const SRC = 'raw-assets/results'
const OUT = 'public/results'

if (!existsSync(SRC)) {
  console.error(`No ${SRC}/ — create it and add the before/after images first.`)
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })

const files = readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()
if (!files.length) {
  console.error(`${SRC}/ is empty — add the before/after images first.`)
  process.exit(1)
}

const kb = (b) => (b / 1024).toFixed(0) + 'KB'
let before = 0
let after = 0
const entries = []

for (let i = 0; i < files.length; i++) {
  const src = path.join(SRC, files[i])
  const name = `r${i + 1}.webp`
  const out = path.join(OUT, name)

  // These are side-by-side composites, so keep the full frame (contain-style
  // square) rather than cropping — cropping would cut off one half.
  await sharp(src)
    .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(out)

  const s = statSync(src).size
  const o = statSync(out).size
  before += s
  after += o
  entries.push(`  { src: '/results/${name}', treatment: 'Treatment result', alt: 'Before and after treatment result at Kotil Skin Science' },`)
  console.log(`${files[i].slice(0, 34).padEnd(36)} ${kb(s).padStart(8)} -> ${name.padEnd(9)} ${kb(o).padStart(8)}`)
}

console.log(`\nTOTAL ${kb(before)} -> ${kb(after)}  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`)
console.log(`\nPaste into src/data.js (set each `treatment` to the real one):\n`)
console.log('export const RESULTS = [\n' + entries.join('\n') + '\n]')
