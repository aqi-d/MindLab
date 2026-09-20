import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '..')

const originalBg = path.join(dir, 'og-bg-original.png')
const logoSvgPath = path.join(root, 'public/logo.svg')
const brandedBg = path.join(dir, 'og-bg-branded.png')
const templatePath = path.join(dir, 'og-template.svg')

const image = sharp(originalBg)
const meta = await image.metadata()
const width = meta.width
const height = meta.height
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
const channels = info.channels
console.log('bg', width, height, channels)

function sample(x, y, size = 8) {
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let py = y; py < y + size; py++) {
    for (let px = x; px < x + size; px++) {
      const i = (py * width + px) * channels
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
      n++
    }
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
}

const bgColor = sample(700, 540, 16)
console.log('bg color', bgColor)

function eraseBright(region, threshold = 28) {
  const { x, y, w, h } = region
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const i = (py * width + px) * channels
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (lum <= threshold)
        continue
      data[i] = bgColor[0]
      data[i + 1] = bgColor[1]
      data[i + 2] = bgColor[2]
    }
  }
}

function fillRect(region) {
  const { x, y, w, h } = region
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const i = (py * width + px) * channels
      data[i] = bgColor[0]
      data[i + 1] = bgColor[1]
      data[i + 2] = bgColor[2]
    }
  }
}

// Measured boxes on the 2400x1350 canvas:
//   af logo  x=314-423 y=579-772
//   Anthony Fu x=560-927 y=581-632
eraseBright({ x: 300, y: 565, w: 140, h: 220 }, 16)
fillRect({ x: 548, y: 568, w: 430, h: 78 })
eraseBright({ x: 930, y: 575, w: 80, h: 70 }, 16)

const cleaned = await sharp(data, {
  raw: { width, height, channels },
})
  .png()
  .toBuffer()

const logoSvg = fs.readFileSync(logoSvgPath, 'utf8').replace(/fill="#303030"/g, 'fill="#ffffff"')
const logoRaw = await sharp(Buffer.from(logoSvg))
  .resize(400, 400)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

let lx0 = logoRaw.info.width
let ly0 = logoRaw.info.height
let lx1 = 0
let ly1 = 0
for (let y = 0; y < logoRaw.info.height; y++) {
  for (let x = 0; x < logoRaw.info.width; x++) {
    const a = logoRaw.data[(y * logoRaw.info.width + x) * logoRaw.info.channels + 3]
    if (a < 12)
      continue
    lx0 = Math.min(lx0, x)
    ly0 = Math.min(ly0, y)
    lx1 = Math.max(lx1, x)
    ly1 = Math.max(ly1, y)
  }
}
const pad = 8
lx0 = Math.max(0, lx0 - pad)
ly0 = Math.max(0, ly0 - pad)
lx1 = Math.min(logoRaw.info.width - 1, lx1 + pad)
ly1 = Math.min(logoRaw.info.height - 1, ly1 + pad)
console.log('logo ink box', { lx0, ly0, lx1, ly1, w: lx1 - lx0 + 1, h: ly1 - ly0 + 1 })

const logoPng = await sharp(logoRaw.data, {
  raw: {
    width: logoRaw.info.width,
    height: logoRaw.info.height,
    channels: logoRaw.info.channels,
  },
})
  .extract({ left: lx0, top: ly0, width: lx1 - lx0 + 1, height: ly1 - ly0 + 1 })
  .resize({ height: 196 })
  .png()
  .toBuffer()

const nameSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text x="560" y="632" fill="#9a9a9a" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="64" letter-spacing="0.06em">aqi</text>
</svg>`

await sharp(cleaned)
  .composite([
    { input: logoPng, left: 310, top: 576 },
    { input: Buffer.from(nameSvg), left: 0, top: 0 },
  ])
  .png()
  .toFile(brandedBg)

console.log('wrote', brandedBg)

const brandedBuf = fs.readFileSync(brandedBg)
const dataUrl = `data:image/png;base64,${brandedBuf.toString('base64')}`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="675" fill="none"
  viewBox="0 0 1200 675">
  <g clip-path="url(#clip0_402_22)">
    <rect width="1200" height="675" fill="url(#pattern0)" />
    <text fill="#fff" xml:space="preserve"
      style="white-space:pre" font-family="Inter" font-size="50" letter-spacing="0em">
      <tspan x="274" y="382.898">{{line1}}</tspan>
      <tspan x="274" y="465">{{line2}}</tspan>
    </text>
  </g>
  <defs>
    <pattern id="pattern0" width="1" height="1" patternContentUnits="objectBoundingBox">
      <use transform="scale(0.000416667 0.000740741)" xlink:href="#image0_402_22" />
    </pattern>
    <clipPath id="clip0_402_22">
      <rect width="1200" height="675" fill="#fff" />
    </clipPath>
    <image id="image0_402_22" width="2400" height="1350"
      xlink:href="${dataUrl}" />
  </defs>
</svg>
`

fs.writeFileSync(templatePath, svg)
console.log('rewrote og-template.svg')
