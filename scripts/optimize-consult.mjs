// Right-size the photos /consult uses.
//
// WHY THIS EXISTS
// /consult is a single narrow column — 480 CSS px of content on a phone, 536 on
// a desktop — and its clinic rail draws cards that are never wider than 230.
// It was reusing the homepage's files, which are sized for the bento gallery
// (960x1280) and the treatment cards (900x1350). That is right for the homepage
// and roughly ten times more pixels than this page can show, so the rail alone
// cost ~277 KB of AVIF to draw five thumbnails.
//
// The homepage's copies CANNOT simply be shrunk — it genuinely displays them
// large — so this writes a second, smaller set instead. That is ordinary
// responsive-image practice: one file cannot be correct for both pages.
//
// Sources: public/ (already cropped and colour-corrected by the other scripts)
// Output:  public/assets/c-*.webp   — the c- prefix marks "consult copy"
//
// /assets/ and not /consult/, deliberately: vercel.json's catch-all redirect
// only whitelists a fixed set of directories, so a new /consult/ folder would
// have every image 301'd to the homepage. /assets/ is already whitelisted and
// already carries the one-year immutable cache header on both hosts.
//
// Run: npm run assets:consult   (then `npm run assets:avif` for the AVIF twins)
import sharp from 'sharp'
import { readFileSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'

const OUT = 'public/assets'

// width/height are the OUTPUT box in device pixels. Each is roughly 2x the
// largest CSS size the element is ever drawn at, which covers a 2x phone and
// leaves a 3x phone very slightly soft on a photo that sits under a gradient.
const JOBS = [
  // --- treatment explorer panes: 3:4 card, full column width ---------------
  // Sources are 2:3 or 9:16. Cropping to the card's own 3:4 here means the
  // bytes we ship are the pixels that get shown, rather than a third of each
  // photo being thrown away by object-fit at paint time. `top` keeps the
  // subject: these are all portrait treatment shots framed head-down.
  { src: 'assets/t2.webp', out: 'c-pigment.webp', width: 800, height: 1066, position: 'top' },
  { src: 'assets/t1.webp', out: 'c-hairfall.webp', width: 800, height: 1066, position: 'top' },
  { src: 'assets/t3.webp', out: 'c-laser.webp', width: 800, height: 1066, position: 'top' },
  // The acne source is a 640x480 landscape screenshot crop — the only one the
  // clinic has. Cropping it to 3:4 leaves 360x480, and upscaling a screenshot
  // only adds bytes, so this one ships at what it actually is.
  { src: 'services/acne-treatment.webp', out: 'c-acne.webp', width: 360, height: 480, position: 'centre' },

  // --- "inside the clinic" rail: 4:5 cards, 230 CSS px at the very widest ---
  { src: 'clinic/storefront.webp', out: 'c-shot-front.webp', width: 360, height: 450, position: 'centre' },
  { src: 'clinic/g1.webp', out: 'c-shot-lounge.webp', width: 460, height: 575, position: 'centre' },
  { src: 'clinic/g3.webp', out: 'c-shot-consult.webp', width: 460, height: 575, position: 'centre' },
  { src: 'clinic/g4.webp', out: 'c-shot-room.webp', width: 460, height: 575, position: 'centre' },
  { src: 'clinic/g6.webp', out: 'c-shot-machines.webp', width: 460, height: 575, position: 'centre' },

  // --- doctor-led card: 4:3, full column width ------------------------------
  { src: 'clinic/g3.webp', out: 'c-doctor.webp', width: 800, height: 600, position: 'centre' },
]

const kb = (b) => (b / 1024).toFixed(1) + 'KB'
let before = 0
let after = 0

for (const job of JOBS) {
  const src = path.join('public', job.src)
  if (!existsSync(src)) { console.warn(`skip ${job.out}: no ${src}`); continue }
  const out = path.join(OUT, job.out)

  // read into a buffer so sharp never holds the source file open — the same
  // file is the source for two different jobs (g3 feeds the rail and the
  // doctor card), and Windows will not let it be reopened while locked.
  await sharp(readFileSync(src))
    .resize(job.width, job.height, { fit: 'cover', position: job.position })
    .webp({ quality: 82, effort: 6 })
    .toFile(out)

  const s = statSync(src).size
  const o = statSync(out).size
  before += s
  after += o
  console.log(`${job.src.padEnd(30)} ${kb(s).padStart(9)} -> ${job.out.padEnd(22)} ${kb(o).padStart(8)}`)
}

console.log(`\nTOTAL ${kb(before)} -> ${kb(after)}  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`)
console.log('Now run `npm run assets:avif` to emit the AVIF twins.')
