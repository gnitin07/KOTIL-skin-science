// Extract the Kotil logo (incl. the ® mark) from the white-background screenshot
// into transparent WebP.
//   kotil-logo.webp       - original colours (black wordmark) for light backgrounds
//   kotil-logo-light.webp - wordmark recoloured to cream for the dark navy nav
// Run: npm run assets:logo
import sharp from 'sharp'
import path from 'node:path'

const SRC = path.resolve('raw-assets/Screenshot 2026-07-17 153107.png')
const OUT = path.resolve('public/assets')

const CREAM = [246, 238, 227] // --cream

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))

// NB: no sharp .trim() here — the source has a transparent margin, so a
// white-background trim never fires. We trim from the composed alpha below.
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

const { width, height, channels } = info
console.log(`source ${width}x${height} (${channels}ch)`)

const normal = Buffer.alloc(width * height * 4)
const light = Buffer.alloc(width * height * 4)

for (let i = 0; i < width * height; i++) {
  const p = i * channels
  const r = data[p], g = data[p + 1], b = data[p + 2]
  const srcA = data[p + 3]

  // The source screenshot is only PARTLY a white card — the margin around it is
  // fully transparent rgba(0,0,0,0). Those pixels are black with zero alpha, so
  // deriving ink from RGB alone reads them as maximum ink and paints a solid bar
  // down the edge. Honour the source alpha first.
  if (srcA < 8) continue

  // Inside the white card: ink coverage = how far the darkest channel is from
  // white, which gives clean anti-aliased alpha on the serif edges.
  const alpha = 255 - Math.min(r, g, b)

  if (alpha <= 3) continue // white background -> fully transparent

  // Un-premultiply the white background to recover the true ink colour,
  // otherwise every edge pixel stays milky.
  const a = alpha / 255
  const R = clamp((r - 255 * (1 - a)) / a)
  const G = clamp((g - 255 * (1 - a)) / a)
  const B = clamp((b - 255 * (1 - a)) / a)

  const o = i * 4
  normal[o] = R; normal[o + 1] = G; normal[o + 2] = B; normal[o + 3] = alpha

  // Light variant: the wordmark + ® are achromatic (black/grey) -> cream.
  // "Skin Science" and the rule are warm gold -> leave alone.
  const isAchromatic = Math.max(R, G, B) - Math.min(R, G, B) < 40
  if (isAchromatic) {
    light[o] = CREAM[0]; light[o + 1] = CREAM[1]; light[o + 2] = CREAM[2]
  } else {
    light[o] = R; light[o + 1] = G; light[o + 2] = B
  }
  light[o + 3] = alpha
}

// Trim to the real ink bounds (from the alpha we just built).
let minX = width, maxX = -1, minY = height, maxY = -1
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (normal[(y * width + x) * 4 + 3] > 12) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}
const cropW = maxX - minX + 1
const cropH = maxY - minY + 1
console.log(`ink bounds x:${minX}-${maxX} y:${minY}-${maxY} -> ${cropW}x${cropH}`)

const raw = { raw: { width, height, channels: 4 } }

// The nav cross-fades the two variants on scroll, so BOTH ship on every page
// load. As 220px PNGs that was ~81KB of the first paint.
//
// WebP only — no PNG. The favicon comes from its own source
// (raw-assets/kotil-favicon-source.png, see favicon.mjs) and the social card is
// og.jpg, so nothing ever read the logo PNGs; they just shipped.
for (const [buf, name] of [[normal, 'kotil-logo'], [light, 'kotil-logo-light']]) {
  const webpPath = path.join(OUT, `${name}.webp`)

  // The nav renders the logo at most 48px tall (see .nav__logo img), so 220px
  // was ~4.5x oversampled. 128px still covers a 2.7x DPR screen and costs a
  // third of the bytes. Lossless because lossy rings on the hard serif edges
  // and, at this size, does not even come out smaller.
  await sharp(buf, raw)
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .resize({ height: 128, withoutEnlargement: true })
    .webp({ lossless: true, effort: 6 })
    .toFile(webpPath)

  const meta = await sharp(webpPath).metadata()
  const webp = (await sharp(webpPath).toBuffer()).length
  console.log(
    `${name.padEnd(18)} ${meta.width}x${meta.height} alpha=${meta.hasAlpha}  ` +
    `webp ${(webp / 1024).toFixed(1)}KB`
  )
}
