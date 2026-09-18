import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'

const fonts = [
  ['great-vibes', '../node_modules/@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff'],
  ['allura', '../node_modules/@fontsource/allura/files/allura-latin-400-normal.woff'],
  ['italianno', '../node_modules/@fontsource/italianno/files/italianno-latin-400-normal.woff'],
  ['tangerine', '../node_modules/@fontsource/tangerine/files/tangerine-latin-400-normal.woff'],
  ['alex-brush', '../node_modules/@fontsource/alex-brush/files/alex-brush-latin-400-normal.woff'],
  ['pinyon-script', '../node_modules/@fontsource/pinyon-script/files/pinyon-script-latin-400-normal.woff'],
  ['sacramento', '../node_modules/@fontsource/sacramento/files/sacramento-latin-400-normal.woff'],
  ['arizonia', '../node_modules/@fontsource/arizonia/files/arizonia-latin-400-normal.woff'],
  ['qwigley', '../node_modules/@fontsource/qwigley/files/qwigley-latin-400-normal.woff'],
  ['mr-dafoe', '../node_modules/@fontsource/mr-dafoe/files/mr-dafoe-latin-400-normal.woff'],
]

function fitPath(d, size = 100, pad = 10) {
  const cmds = []
  const re = /([MLCQZmlcqzHV])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g
  let match
  let cur = ''
  const nums = []
  while ((match = re.exec(d))) {
    if (match[1]) {
      if (cur)
        cmds.push({ t: cur, n: nums.splice(0) })
      cur = match[1]
    }
    else {
      nums.push(Number(match[2]))
    }
  }
  if (cur)
    cmds.push({ t: cur, n: nums })

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let x = 0
  let y = 0
  const visit = (nx, ny) => {
    x = nx
    y = ny
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  for (const c of cmds) {
    const t = c.t.toUpperCase()
    if (t === 'Z')
      continue
    if (t === 'H') {
      visit(c.n[0], y)
      continue
    }
    if (t === 'V') {
      visit(x, c.n[0])
      continue
    }
    for (let i = 0; i < c.n.length; i += 2)
      visit(c.n[i], c.n[i + 1])
  }
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  const scale = (size - pad * 2) / Math.max(w, h)
  const ox = (size - w * scale) / 2 - minX * scale
  const oy = (size - h * scale) / 2 - minY * scale
  const mapX = v => (v * scale + ox).toFixed(2)
  const mapY = v => (v * scale + oy).toFixed(2)

  x = 0
  y = 0
  return cmds.map((c) => {
    const t = c.t
    if (t.toUpperCase() === 'Z')
      return t
    if (t.toUpperCase() === 'H') {
      const nx = t === t.toUpperCase() ? c.n[0] : x + c.n[0]
      x = nx
      return `${t}${mapX(nx)}`
    }
    if (t.toUpperCase() === 'V') {
      const ny = t === t.toUpperCase() ? c.n[0] : y + c.n[0]
      y = ny
      return `${t}${mapY(ny)}`
    }
    const n = []
    for (let i = 0; i < c.n.length; i += 2) {
      const nx = t === t.toUpperCase() ? c.n[i] : x + c.n[i]
      const ny = t === t.toUpperCase() ? c.n[i + 1] : y + c.n[i + 1]
      x = nx
      y = ny
      n.push(mapX(nx), mapY(ny))
    }
    return t + n.join(' ')
  }).join('')
}

const results = []
for (const [name, rel] of fonts) {
  const buf = readFileSync(fileURLToPath(new URL(rel, import.meta.url)))
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
  const fontSize = 220
  const scale = fontSize / font.unitsPerEm
  const glyphA = font.charToGlyph('a')
  const glyphQ = font.charToGlyph('q')
  const aPath = glyphA.getPath(0, 0, fontSize)
  const qPath = glyphQ.getPath(glyphA.advanceWidth * scale * 0.84, 0, fontSize)
  const fitted = fitPath(`${aPath.toPathData(2)}${qPath.toPathData(2)}`, 100, 9)
  writeFileSync(new URL(`./fonts/${name}-aq.svg`, import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/><path fill="#111" d="${fitted}"/></svg>`)
  results.push({ name, fitted })
  console.log(name, 'ok', fitted.slice(0, 80))
}

writeFileSync(new URL('./fonts/preview.json', import.meta.url), JSON.stringify(results.map(r => r.name)))
writeFileSync(new URL('./fonts/paths.json', import.meta.url), JSON.stringify(Object.fromEntries(results.map(r => [r.name, r.fitted])), null, 2))

const { default: sharp } = await import('sharp')
for (const { name } of results) {
  const svg = readFileSync(new URL(`./fonts/${name}-aq.svg`, import.meta.url))
  await sharp(svg).resize(400, 400).png().toFile(fileURLToPath(new URL(`./fonts/${name}-aq.png`, import.meta.url)))
  console.log('png', name)
}
