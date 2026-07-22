// Zodiak and Switzer are ITF Free Font License fonts (Fontshare): free to
// self-host for this site, but not to redistribute as font files — so they are
// fetched at build time instead of committed. The manifest pins exact CDN URLs
// and hashes; a mismatch fails the build rather than shipping a changed font.
// The Spline Sans Mono files are OFL and live in the repo.
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const fontsDir = join(root, 'public', 'fonts')
const manifest = JSON.parse(
  await readFile(join(root, 'scripts', 'fonts-manifest.json'), 'utf8'),
)

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

await mkdir(fontsDir, { recursive: true })

let fetched = 0
for (const font of manifest) {
  const path = join(fontsDir, font.file)
  const existing = await readFile(path).catch(() => null)
  if (existing && sha256(existing) === font.sha256) continue

  const res = await fetch(font.url)
  if (!res.ok) {
    throw new Error(
      `${font.file}: download failed (${res.status}) from ${font.url}`,
    )
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const hash = sha256(buf)
  if (hash !== font.sha256) {
    throw new Error(
      `${font.file}: hash mismatch — expected ${font.sha256}, got ${hash}. ` +
        'The CDN file changed; re-verify the font and update the manifest.',
    )
  }
  await writeFile(path, buf)
  fetched += 1
}

console.log(
  fetched === 0
    ? `fonts: all ${manifest.length} fetched files present and verified`
    : `fonts: fetched ${fetched} of ${manifest.length} files`,
)
