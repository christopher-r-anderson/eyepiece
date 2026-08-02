// Regenerates the public/ icon set from src/assets/eyepiece-mark.svg.
// Outputs are committed; rerun after changing the mark: pnpm generate-icons
import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

// mark violet on dark surfaces; the deeper cut carries legibility where the
// backdrop is unknown or light (legacy ico, transparent manifest icons)
const VIOLET = '#8D7DC4'
const VIOLET_DEEP = '#7263A8'
const CANVAS = '#14121C'

const markSvg = await readFile('src/assets/eyepiece-mark.svg', 'utf8')

const colored = (color) => markSvg.replaceAll('currentColor', color)

// the mark centered at `scale` of a size x size canvas, optional solid bg
function framed({ size, scale, color, background }) {
  const inner = Math.round(size * scale)
  const offset = Math.round((size - inner) / 2)
  const body = colored(color).replace(
    '<svg ',
    `<svg width="${inner}" height="${inner}" x="${offset}" y="${offset}" `,
  )
  const bg = background
    ? `<rect width="${size}" height="${size}" fill="${background}"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${bg}${body}</svg>`
}

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer()

// icon.svg: the mark itself, following the OS theme
const themed = markSvg.replace(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <style>svg{color:${VIOLET_DEEP}}@media(prefers-color-scheme:dark){svg{color:${VIOLET}}}</style>`,
)
await writeFile('public/icon.svg', themed)

// favicon.ico: 32 primary + 16 for crisp small rendering
await writeFile(
  'public/favicon.ico',
  await pngToIco([
    await png(colored(VIOLET_DEEP), 32),
    await png(colored(VIOLET_DEEP), 16),
  ]),
)

// apple-touch-icon: solid background, ~20px padding at 180
await writeFile(
  'public/apple-touch-icon.png',
  await png(
    framed({ size: 180, scale: 0.78, color: VIOLET, background: CANVAS }),
    180,
  ),
)

// manifest icons: transparent any-purpose pair + opaque maskable
// (mask scale keeps the mark inside the 409px safe circle at 512)
await writeFile('public/icon-192.png', await png(colored(VIOLET_DEEP), 192))
await writeFile('public/icon-512.png', await png(colored(VIOLET_DEEP), 512))
await writeFile(
  'public/icon-mask.png',
  await png(
    framed({ size: 512, scale: 0.8, color: VIOLET, background: CANVAS }),
    512,
  ),
)

console.log(
  'wrote icon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, icon-mask.png',
)
