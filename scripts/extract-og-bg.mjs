import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const svg = fs.readFileSync(path.join(dir, 'og-template.svg'), 'utf8')
const m = svg.match(/xlink:href="(data:image\/[^"]+)"/)
if (!m) {
  console.error('no embedded image')
  process.exit(1)
}
const dataUrl = m[1]
const base64 = dataUrl.split(',')[1]
const buf = Buffer.from(base64, 'base64')
const out = path.join(dir, 'og-bg-original.png')
fs.writeFileSync(out, buf)
console.log('wrote', out, buf.length)
