import sharp from 'sharp'
// Square favicon: the K monogram on navy.
const SRC = 'public/assets/kotil-logo-light.png'
const NAVY = { r: 13, g: 27, b: 42, alpha: 1 }

// Find the K's actual bounds by scanning the left slice for opaque pixels.
const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info
let minX = width, maxX = 0, minY = height, maxY = 0
const SLICE = Math.round(width * 0.22) // left ~22% holds the K
for (let y = 0; y < height; y++) {
  for (let x = 0; x < SLICE; x++) {
    if (data[(y * width + x) * channels + 3] > 40) {
      if (x < minX) minX = x; if (x > maxX) maxX = x
      if (y < minY) minY = y; if (y > maxY) maxY = y
    }
  }
}
const w = maxX - minX + 1, h = maxY - minY + 1
console.log(`K bounds x:${minX}-${maxX} y:${minY}-${maxY} (${w}x${h})`)

const pad = Math.round(Math.max(w, h) * 0.30)
await sharp({ create: { width: 256, height: 256, channels: 4, background: NAVY } })
  .composite([{
    input: await sharp(SRC).extract({ left: minX, top: minY, width: w, height: h })
      .resize(256 - pad * 2, 256 - pad * 2, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toBuffer(),
    gravity: 'centre',
  }])
  .png().toFile('public/favicon.png')
console.log('favicon.png written')
