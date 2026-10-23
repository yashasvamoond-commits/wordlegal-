import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'
import path from 'node:path'

const svg = fs.readFileSync('/tmp/icon/icon.svg', 'utf8')
const out = 'android/app/src/main/res'
const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }

const fgSvg = svg
  .replace(/<rect width="512" height="512" rx="116" fill="url\(#bg\)"\/>/, '')
  .replace(/<circle cx="256" cy="256" r="196"[^/]*\/>/, '')

function render(size, transparent = false) {
  const r = new Resvg(transparent ? fgSvg : svg, { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' })
  return r.render().asPng()
}

for (const [d, px] of Object.entries(sizes)) {
  const dir = path.join(out, `mipmap-${d}`)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), render(px))
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), render(px))
  fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), render(Math.round(px * 2.25), true))
}
fs.mkdirSync('public', { recursive: true })
fs.writeFileSync('public/icon-192.png', render(192))
fs.writeFileSync('public/icon-512.png', render(512))
fs.writeFileSync('public/icon.svg', svg)
console.log('icons written')
