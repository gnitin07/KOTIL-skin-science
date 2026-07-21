// Compress clinic videos for the web and generate a poster frame for each.
//
// Sources live in raw-assets/videos/ (phone recordings, 4-16 Mbps, 135 MB total).
// Output goes to public/videos/ as H.264 MP4 with +faststart so playback can
// begin before the file finishes downloading.
//
// Run: npm run assets:videos
import { execFileSync } from 'node:child_process'
import { readdirSync, statSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import ffmpegPath from 'ffmpeg-static'

const SRC = 'raw-assets/videos'
const OUT = 'public/videos'
mkdirSync(OUT, { recursive: true })

if (!existsSync(SRC)) {
  console.error(`No ${SRC}/ — put the original videos there first.`)
  process.exit(1)
}

const mb = (b) => (b / 1048576).toFixed(1) + ' MB'
const files = readdirSync(SRC).filter((f) => /\.(mp4|mov|webm|m4v)$/i.test(f))

let before = 0
let after = 0

for (const file of files) {
  const src = path.join(SRC, file)
  const slug = file.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const out = path.join(OUT, `${slug}.mp4`)
  const poster = path.join(OUT, `${slug}.webp`)

  // Probe orientation so vertical reels aren't letterboxed.
  // `ffmpeg -i <file>` with no output always exits non-zero and prints the
  // stream info on stderr, so the throw is expected — read it from the error.
  let meta = ''
  try {
    meta = execFileSync(ffmpegPath, ['-hide_banner', '-i', src], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).toString()
  } catch (e) {
    meta = (e.stderr || '').toString()
  }
  const dims = (meta.match(/,\s(\d{2,5})x(\d{2,5})/) || []).slice(1).map(Number)
  const [w, h] = dims.length === 2 ? dims : [1080, 1920]
  const vertical = h >= w
  // cap the long edge at 1280 — plenty for an inline gallery
  const scale = vertical ? 'scale=-2:1280' : 'scale=1280:-2'

  const encode = (crf, longEdge) => execFileSync(ffmpegPath, [
    '-y', '-i', src,
    '-vf', `${vertical ? `scale=-2:${longEdge}` : `scale=${longEdge}:-2`},fps=30`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf),
    '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
    '-movflags', '+faststart',
    out,
  ], { stdio: ['ignore', 'ignore', 'ignore'] })

  encode(30, 1280)
  // Long/high-motion clips can still land far too heavy at CRF 30. Nothing in a
  // gallery should be a multi-megabyte download, so squeeze the outliers again.
  const TARGET = 6 * 1048576
  if (statSync(out).size > TARGET) {
    const first = statSync(out).size
    encode(34, 960)
    console.log(`   ${slug}: ${mb(first)} exceeded target, re-encoded smaller`)
  }

  // poster = a frame ~1s in (frame 0 is often a dark/blurred shutter frame)
  execFileSync(ffmpegPath, [
    '-y', '-ss', '1', '-i', src, '-frames:v', '1',
    '-vf', scale, '-q:v', '80', poster,
  ], { stdio: ['ignore', 'ignore', 'ignore'] })

  const s = statSync(src).size
  const o = statSync(out).size
  before += s
  after += o
  console.log(`${slug.padEnd(28)} ${mb(s).padStart(9)} -> ${mb(o).padStart(9)}  (${w}x${h}${vertical ? ' vertical' : ''})`)
}

console.log(`\nTOTAL ${mb(before)} -> ${mb(after)}  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`)
