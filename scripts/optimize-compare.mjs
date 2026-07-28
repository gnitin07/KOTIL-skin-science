// Optimise before/after pairs for the draggable comparison sliders.
//
// A slider only reads as one photograph revealing another if BOTH frames are
// pixel-identical in size and framing, so each pair is cover-cropped to one
// fixed output box rather than optimised independently.
//
// Sources: raw-assets/compare/<slug>-before.* and <slug>-after.*
// Output:  public/compare/<slug>-before.webp and <slug>-after.webp
//
// Run: npm run assets:compare
import sharp from 'sharp'
import { readFileSync, mkdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'

const SRC = 'raw-assets/compare'
const OUT = 'public/compare'
if (!existsSync(SRC)) { console.error(`No ${SRC}/`); process.exit(1) }
mkdirSync(OUT, { recursive: true })

// cropBottom: fraction of height to drop before fitting. The stretch-mark
// photos ship with "Before"/"After" burned into the bottom-left corner; the
// slider draws its own labels, and the burned-in ones would sit there no
// matter where the handle is. Trimming that strip is the only way to remove
// them without repainting over the photo.
// The burned-in label box measures y 620..671 in both stretch-mark sources
// (~703px tall), so anything under 0.131 leaves its top edge showing.
const PAIRS = [
  { slug: 'stretchmarks', width: 900, height: 676, cropBottom: 0.14 },
  { slug: 'hair', width: 900, height: 779, cropBottom: 0 },
]

const kb = (b) => (b / 1024).toFixed(0) + 'KB'
const find = (slug, side) => {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const p = path.join(SRC, `${slug}-${side}.${ext}`)
    if (existsSync(p)) return p
  }
  return null
}

let before = 0
let after = 0
for (const pair of PAIRS) {
  for (const side of ['before', 'after']) {
    const src = find(pair.slug, side)
    if (!src) { console.warn(`skip ${pair.slug}-${side}: no source`); continue }
    const out = path.join(OUT, `${pair.slug}-${side}.webp`)

    // read into a buffer so sharp never holds the source file open
    let img = sharp(readFileSync(src))
    if (pair.cropBottom > 0) {
      const m = await img.metadata()
      const h = Math.round(m.height * (1 - pair.cropBottom))
      img = sharp(await img.extract({ left: 0, top: 0, width: m.width, height: h }).toBuffer())
    }
    await img
      .resize(pair.width, pair.height, { fit: 'cover', position: 'centre' })
      .webp({ quality: 86, effort: 5 })
      .toFile(out)

    const s = statSync(src).size, o = statSync(out).size
    before += s; after += o
    console.log(`${path.basename(src).padEnd(30)} ${kb(s).padStart(9)} -> ${path.basename(out).padEnd(26)} ${kb(o).padStart(8)}`)
  }
}
console.log(`\nTOTAL ${kb(before)} -> ${kb(after)}  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`)
