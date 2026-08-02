// Regenerates public/og.jpg, the default social preview: pnpm generate-og
import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

// JWST "Cosmic Cliffs", NASA public domain, near the 1.91:1 OG ratio
const SOURCE_URL =
  'https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~large.jpg'

const WIDTH = 1200
const HEIGHT = 630

const TEXT = '#EDEAF6'
const VIOLET_RAISED = '#A99CDD'

const markSvg = await readFile('src/assets/eyepiece-mark.svg', 'utf8')
const wordSvg = await readFile('src/assets/eyepiece-logo.svg', 'utf8')

const inner = (svg) => svg.replace(/^[^>]*>/, '').replace(/<\/svg>\s*$/, '')

// the drop shadow separates the glyphs from the stars behind them
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="2" stdDeviation="4.5" flood-color="#050409" flood-opacity="1"/>
  </filter></defs>
  <g transform="translate(64, 36)" filter="url(#s)">
    <g transform="scale(3.9)">${inner(markSvg).replaceAll('currentColor', VIOLET_RAISED)}</g>
    <g transform="translate(102, 10) scale(1.62)">${inner(wordSvg).replaceAll('currentColor', TEXT)}</g>
  </g>
</svg>`

const source = Buffer.from(await (await fetch(SOURCE_URL)).arrayBuffer())

const image = await sharp(source)
  .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
  .composite([{ input: Buffer.from(overlay) }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toBuffer()

await writeFile('public/og.jpg', image)
console.log(`wrote public/og.jpg (${WIDTH}x${HEIGHT}, ${image.length} bytes)`)
