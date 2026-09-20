import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '..')
const ogSVg = fs.readFileSync(path.join(dir, 'og-template.svg'), 'utf8')

async function generateOg(title, output) {
  await fs.promises.mkdir(path.dirname(output), { recursive: true })
  const lines = title.trim().split(/(.{0,30})(?:\s|$)/g).filter(Boolean)
  const data = {
    line1: lines[0] || '',
    line2: lines[1] || '',
    line3: lines[2] || '',
  }
  const svg = ogSVg.replace(/\{\{([^}]+)\}\}/g, (_, name) => data[name] || '')
  console.log('Generating', output)
  await sharp(Buffer.from(svg))
    .resize(1200 * 1.1, 630 * 1.1)
    .png()
    .toFile(output)
}

const jobs = [
  ['前端离线容灾', 'public/og/frontend-offline-resilience-zh.png'],
  ['Photos', 'public/og/photos.png'],
  ['Projects', 'public/og/projects.png'],
]

for (const [title, rel] of jobs) {
  const output = path.join(root, rel)
  if (fs.existsSync(output))
    fs.unlinkSync(output)
  await generateOg(title, output)
}
