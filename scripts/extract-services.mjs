// Crop each treatment's photo out of the services screenshots.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SRC = 'raw-assets/services'
const OUT = 'public/services'
mkdirSync(OUT, { recursive: true })

// screenshot -> treatment slugs, left to right
const MAP = [
  ['Screenshot 2026-07-17 152258.png', ['meso-therapy','microneedling','carbon-laser']],
  ['Screenshot 2026-07-17 152319.png', ['prp','booster-prp','gfc']],
  ['Screenshot 2026-07-17 152331.png', ['laser-toning','yellow-peel','hifu']],
  ['Screenshot 2026-07-17 152342.png', ['scar-removal','acne-treatment','basic-hydra']],
  ['Screenshot 2026-07-17 152404.png', ['adv-hydra','pro-hydra','bb-glow']],
  ['Screenshot 2026-07-17 152416.png', ['lip-tint','microblading','ultra-clarity-facial']],
  ['Screenshot 2026-07-17 152428.png', ['biluminous-facial','glass-glow-facial','aqua-infusion']],
  ['Screenshot 2026-07-17 152437.png', ['ultra-revive-facial','ultra-luminous-facial','ozone-clarity-facial']],
  ['Screenshot 2026-07-17 152449.png', ['freckles','glutathione-iv-drip','wart-mole-removal']],
  ['Screenshot 2026-07-17 152459.png', ['mono-threads','cog-threads','botox']],
  ['Screenshot 2026-07-17 152509.png', ['full-body-lhr','face-lhr','underarm-lhr']],
  ['Screenshot 2026-07-17 152543.png', ['bikini-lhr','full-hand-full-legs-lhr','full-hand-underarms-lhr']],
  ['Screenshot 2026-07-17 152553.png', ['back-chest-lhr']],
]

const isLight = (r,g,b) => r>235 && g>230 && b>222

for (const [file, slugs] of MAP) {
  const { data, info } = await sharp(`${SRC}/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  const px = (x,y) => { const p=(y*W+x)*C; return [data[p],data[p+1],data[p+2]] }

  // 1) find card x-ranges via light gutters
  const colLight = []
  for (let x=0;x<W;x++){ let n=0,t=0; for(let y=0;y<H;y+=4){ const c=px(x,y); if(isLight(...c)) n++; t++ } colLight.push(n/t) }
  const gut=[]; let s=null
  for (let x=0;x<W;x++){ if(colLight[x]>0.93){ if(s===null)s=x } else { if(s!==null&&x-s>8) gut.push([s,x-1]); s=null } }
  if(s!==null) gut.push([s,W-1])
  const cards=[]
  for(let i=0;i<gut.length-1;i++){ const a=gut[i][1]+1, b=gut[i+1][0]-1; if(b-a>120) cards.push([a,b]) }
  // if fewer gutters than expected, fall back to equal split
  if (cards.length < slugs.length) {
    cards.length = 0
    const cw = Math.floor(W/slugs.length)
    for (let i=0;i<slugs.length;i++) cards.push([i*cw+6,(i+1)*cw-6])
  }

  for (let i=0;i<slugs.length && i<cards.length;i++){
    const [x0,x1]=cards[i]
    // 2) photo bottom = first sustained run of light rows (the white card body)
    const rowLight=[]
    for(let y=0;y<H;y++){ let n=0,t=0; for(let x=x0;x<=x1;x+=3){ if(isLight(...px(x,y))) n++; t++ } rowLight.push(n/t) }
    // find where the PHOTO starts first (some screenshots show the tail of the
    // previous row of cards at the top, which is white and fooled the old scan).
    // photo start = first SUSTAINED dark run (single dark rows are card borders /
    // divider lines and must not be mistaken for the photo).
    let photoTop = 0
    for (let y = 0; y < H - 40; y++) {
      let sum = 0
      for (let k = 0; k < 30; k++) sum += rowLight[y + k]
      if (sum / 30 < 0.65) { photoTop = y; break }
    }
    // then the photo ends at the first sustained run of light rows after it
    let photoBottom = H
    for(let y=photoTop+30;y<H-25;y++){
      let allLight=true
      for(let k=0;k<25;k++) if(rowLight[y+k] < 0.9){ allLight=false; break }
      if(allLight){ photoBottom = y; break }
    }
    const h = photoBottom - photoTop
    if (h < 60) { console.log(`  skip ${slugs[i]} (photo h=${h})`); continue }
    // Drop the right ~16% of the card before resizing: that's where the source
    // "% Off" badge sits, and we render our own badge on the card.
    const fullW = x1 - x0 + 1
    const cropW = Math.round(fullW * 0.70)
    const top = photoTop + 4          // skip the card's top edge/rounded corner
    await sharp(`${SRC}/${file}`)
      .extract({ left: x0, top, width: cropW, height: Math.max(60, h - 4) })
      .resize({ width: 640, height: 480, fit: 'cover', position: 'centre' })
      .webp({ quality: 80 })
      .toFile(`${OUT}/${slugs[i]}.webp`)
    console.log(`  ${slugs[i]}.webp  from x${x0}-${x1} y${photoTop}-${photoBottom} (h=${h})`)
  }
}
console.log('\ndone')
