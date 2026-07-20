// Build the favicon from the brand's official "K" mark.
//
// Source: raw-assets/kotil-favicon-source.png — the exact icon used on the live
// site (kotilskinscience.com): a transparent PNG of the serif K. Using the real
// asset keeps this site's tab icon identical to the main site.
//
// Run: npm run assets:favicon
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const SRC = 'raw-assets/kotil-favicon-source.png'
const CREAM = '#f6eee3'
await mkdir('public', { recursive: true })

// 192px covers browser tabs, bookmarks and Android home-screen icons. The
// transparent background lets the mark sit on any tab colour.
const out = await sharp(SRC)
  .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile('public/favicon.png')
console.log(`public/favicon.png          ${out.width}x${out.height}  ${(out.size / 1024).toFixed(1)}KB  (transparent)`)

// iOS ignores transparency on home-screen icons and composites onto black,
// which would hide a dark mark — so this one gets an opaque cream plate.
const apple = await sharp(SRC)
  .resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 15, bottom: 15, left: 15, right: 15, background: CREAM })
  .flatten({ background: CREAM })
  .png({ compressionLevel: 9 })
  .toFile('public/apple-touch-icon.png')
console.log(`public/apple-touch-icon.png ${apple.width}x${apple.height}  ${(apple.size / 1024).toFixed(1)}KB  (cream plate)`)
