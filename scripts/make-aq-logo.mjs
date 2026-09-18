import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function parseCubics(d) {
  const nums = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi).map(Number)
  const segs = []
  let px = nums[0]
  let py = nums[1]
  for (let i = 2; i < nums.length; i += 6) {
    const p0 = { x: px, y: py }
    const p1 = { x: nums[i], y: nums[i + 1] }
    const p2 = { x: nums[i + 2], y: nums[i + 3] }
    const p3 = { x: nums[i + 4], y: nums[i + 5] }
    segs.push([p0, p1, p2, p3])
    px = p3.x
    py = p3.y
  }
  return segs
}

function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  }
}

function cubicDeriv(p0, p1, p2, p3, t) {
  const u = 1 - t
  return {
    x: 3 * u ** 2 * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t ** 2 * (p3.x - p2.x),
    y: 3 * u ** 2 * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t ** 2 * (p3.y - p2.y),
  }
}

function sample(segs, steps = 32) {
  const pts = []
  for (const seg of segs) {
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const p = cubic(...seg, t)
      const d = cubicDeriv(...seg, t)
      const len = Math.hypot(d.x, d.y) || 1
      const nx = -d.y / len
      const ny = d.x / len
      const down = Math.max(0, d.y / len)
      const width = 0.32 + down * 0.58
      pts.push({ ...p, nx, ny, width, dx: d.x / len, dy: d.y / len })
    }
  }
  const last = segs.at(-1)
  const p = cubic(...last, 1)
  const d = cubicDeriv(...last, 0.999)
  const len = Math.hypot(d.x, d.y) || 1
  pts.push({
    ...p,
    nx: -d.y / len,
    ny: d.x / len,
    width: 0.3,
    dx: d.x / len,
    dy: d.y / len,
  })
  return pts
}

function circle(p) {
  const r = p.width
  return `M${(p.x - r).toFixed(2)} ${p.y.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(r * 2).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-r * 2).toFixed(2)} 0`
}

function toFilled(pts) {
  const parts = []
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const al = { x: a.x + a.nx * a.width, y: a.y + a.ny * a.width }
    const ar = { x: a.x - a.nx * a.width, y: a.y - a.ny * a.width }
    const bl = { x: b.x + b.nx * b.width, y: b.y + b.ny * b.width }
    const br = { x: b.x - b.nx * b.width, y: b.y - b.ny * b.width }
    parts.push(`M${al.x.toFixed(2)} ${al.y.toFixed(2)}L${bl.x.toFixed(2)} ${bl.y.toFixed(2)}L${br.x.toFixed(2)} ${br.y.toFixed(2)}L${ar.x.toFixed(2)} ${ar.y.toFixed(2)}Z`)
    parts.push(circle(a))
  }
  parts.push(circle(pts.at(-1)))
  return parts.join('')
}

// Modeled on antfu's original "af" rhythm:
// left a-loop → q bowl → long descender → finishing flick (撇)
const center = [
  'M43.8 39.3',
  'C43.5 29 38 27 31 35.5',
  'C17 58.4 35 61 42.5 46',
  'C44.5 42.5 45.5 37 45.5 37',
  'C44.9 42.3 43.8 46 43.8 50',
  'C43.8 56.6 48 57.9 54.5 48.4',
  'C61 40 71 38 75 45',
  'C79 52 73 58 65 55',
  'C61 53 63 49 67 47',
  'C65 62 56 82 53.2 91',
  'C51.5 98.5 63 98 61 80',
  'C59.5 66 52.5 44 48 36',
  'C51 41 59 53 68.5 58.5',
].join('')

const segs = parseCubics(center)
const pts = sample(segs, 36)
const filled = toFilled(pts)

const logo = `<template>
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <title>aq</title>
    <mask id="aq-mask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="14" y="22" width="68" height="80">
      <path fill="white" d="${filled}" />
    </mask>
    <g mask="url(#aq-mask)">
      <path
        class="path1"
        d="${center}"
        stroke="black"
        stroke-width="2.4"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>

<style scoped>
@media (prefers-reduced-motion) {
  .path1 {
    animation: none !important;
    stroke-dasharray: unset !important;
  }
}
@media print {
  .path1 {
    animation: none !important;
    stroke-dasharray: unset !important;
  }
}
@keyframes grow {
  0% {
    stroke-dashoffset: 1px;
    stroke-dasharray: 0 350px;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  40% {
    stroke-dasharray: 350px 0;
  }
  85% {
    stroke-dasharray: 350px 0;
  }
  95%,
  to {
    stroke-dasharray: 0 350px;
  }
}
.path1 {
  stroke-dashoffset: 1px;
  stroke-dasharray: 350px 0;
  animation: grow 10s ease forwards infinite;
  transform-origin: center;
  stroke: #303030;
}
.dark .path1 {
  stroke: #fdfdfd;
}
</style>
`

writeFileSync(new URL('../src/components/Logo.vue', import.meta.url), logo)
writeFileSync(new URL('../src/components/LogoStroke.vue', import.meta.url), `<template>
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <title>aq</title>
    <path fill="currentColor" d="${filled}" />
  </svg>
</template>
`)
writeFileSync(new URL('../public/favicon.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <style>
    .s { fill: #333; }
    @media (prefers-color-scheme: dark) { .s { fill: #eee; } }
  </style>
  <path class="s" d="${filled}" />
</svg>
`)
writeFileSync(new URL('../public/logo.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#303030" d="${filled}" /></svg>
`)
writeFileSync(new URL('../public/logo-dark.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#fdfdfd" d="${filled}" /></svg>
`)

const preview = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <rect width="100" height="100" fill="#fff"/>
  <path fill="#111" d="${filled}" />
</svg>`
writeFileSync(new URL('./fonts/thin-aq.svg', import.meta.url), preview)

const { default: sharp } = await import('sharp')
await sharp(Buffer.from(preview)).png().toFile(fileURLToPath(new URL('./fonts/thin-aq.png', import.meta.url)))
console.log('thin signature logo written')
