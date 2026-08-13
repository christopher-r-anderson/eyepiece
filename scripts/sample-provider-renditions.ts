// Samples raw NASA and Smithsonian responses and reports what image renditions
// they actually carry, so the asset image model (#194) is decided from data
// rather than from whichever label happened to be present when the mapper was
// written. This is the #184 method applied to images instead of text.
//
//   pnpm sample-provider-renditions [--refetch] [--probe]
//
// --refetch re-hits the search APIs; without it the run analyzes the cache
// shared with sample-provider-text. --probe additionally fetches a bounded
// sample of image files to check that the renditions we would fall back to
// really serve, and that declared dimensions match the pixels.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import {
  NASA_QUERIES,
  OUT_DIR,
  RAW_DIR,
  SI_QUERIES,
  SI_SEARCH_FILTER,
  USER_AGENT,
  asArray,
  asNumber,
  asRecord,
  asString,
  bump,
  csvCell,
  edgeCaseDir,
  fetchJson,
  markdownTable,
  percent,
  quantile,
  sleep,
} from './provider-sampling'

// sampled as a second corpus, not as test inputs
const FIXTURE_DIRS = [
  'src/integrations/nasa-ivl/__fixtures__',
  'src/integrations/si-oa/__fixtures__',
  'e2e/__provider-fixtures__',
]

// what each surface asks of an image, in CSS pixels. Tiles are laid out at the
// justified grid's row height; the typical width is a 3:2 tile in a desktop
// row, the wide one is the per-tile cap. Detail is contentMax less its padding.
const SURFACES = [
  { name: 'tile (mobile row, 3:2)', css: 183 },
  { name: 'tile (desktop row, 3:2)', css: 338 },
  { name: 'tile (widest allowed)', css: 864 },
  { name: 'detail image', css: 1120 },
]

const DEVICE_PIXEL_RATIOS = [1, 2]

// browsers do not decode TIFF, so a TIFF rendition is not a candidate for any
// surface no matter how large it is
const UNRENDERABLE_EXTENSIONS = new Set(['tif', 'tiff'])

interface Rendition {
  label: string
  href: string
  width?: number
  height?: number
  bytes?: number
}

interface RecordSample {
  id: string
  source: string
  renditions: Array<Rendition>
  raw: unknown
}

function extensionOf(href: string) {
  const path = href.split('?')[0]!
  const dot = path.lastIndexOf('.')
  return dot === -1 ? '' : path.slice(dot + 1).toLowerCase()
}

function isRenderable(rendition: Rendition) {
  return !UNRENDERABLE_EXTENSIONS.has(extensionOf(rendition.href))
}

const hasDeclaredDimensions = (renditions: Array<Rendition>) =>
  renditions.some((rendition) => rendition.width && rendition.height)

// ---------------------------------------------------------------- collection

function nasaRenditions(item: unknown): Array<Rendition> {
  return asArray(asRecord(item).links)
    .map(asRecord)
    .filter((link) => asString(link.render) === 'image')
    .map((link) => {
      const href = asString(link.href)
      // the file suffix names the rendition far more usefully than `rel` does:
      // `alternate` covers three different sizes
      const suffix = /~([a-z0-9]+)\./i.exec(href)?.[1] ?? 'unsuffixed'
      return {
        label: `${asString(link.rel)}/${suffix}`,
        href,
        width: asNumber(link.width),
        height: asNumber(link.height),
        bytes: asNumber(link.size),
      }
    })
}

async function collectNasa(refetch: boolean): Promise<Array<RecordSample>> {
  const samples: Array<RecordSample> = []
  const seen = new Set<string>()
  for (const query of NASA_QUERIES) {
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=100`
    const body = asRecord(await fetchJson(url, refetch))
    for (const item of asArray(asRecord(body.collection).items)) {
      const id = asString(asRecord(asArray(asRecord(item).data)[0]).nasa_id)
      if (!id || seen.has(id)) continue
      seen.add(id)
      samples.push({
        id,
        source: `search:${query}`,
        renditions: nasaRenditions(item),
        raw: item,
      })
    }
  }
  return samples
}

// a media item's renditions are labelled, and the two hi-res labels are the
// only ones that ever declare dimensions
function siRenditions(media: Record<string, unknown>): Array<Rendition> {
  return asArray(media.resources)
    .map(asRecord)
    .map((resource) => ({
      label: asString(resource.label) || '(unlabelled)',
      href: asString(resource.url),
      width: asNumber(resource.width),
      height: asNumber(resource.height),
    }))
}

interface SiSample extends RecordSample {
  mediaCount: number
  idsId: string
}

function siMediaItems(record: Record<string, unknown>) {
  return asArray(
    asRecord(
      asRecord(asRecord(record.content).descriptiveNonRepeating).online_media,
    ).media,
  ).map(asRecord)
}

async function collectSi(
  apiKey: string,
  refetch: boolean,
): Promise<Array<SiSample>> {
  const samples: Array<SiSample> = []
  const seen = new Set<string>()
  for (const query of SI_QUERIES) {
    const url = `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(`${query} AND ${SI_SEARCH_FILTER}`)}&rows=100&api_key=${apiKey}`
    const body = asRecord(await fetchJson(url, refetch))
    for (const row of asArray(asRecord(body.response).rows)) {
      const record = asRecord(row)
      const id = asString(record.id)
      if (!id || seen.has(id)) continue
      seen.add(id)
      const media = siMediaItems(record)
      samples.push({
        id,
        source: `search:${query}`,
        // the mapper reads media[0]; everything here is about that same choice
        renditions: media[0] ? siRenditions(media[0]) : [],
        mediaCount: media.length,
        idsId: asString(media[0]?.idsId),
        raw: row,
      })
    }
  }
  return samples
}

// ------------------------------------------------------------------ analysis

function labelCoverage(samples: Array<RecordSample>) {
  const present: Record<string, number> = {}
  const withDimensions: Record<string, number> = {}
  const widthsByLabel: Record<string, Array<number>> = {}
  for (const sample of samples) {
    for (const rendition of sample.renditions) {
      bump(present, rendition.label)
      if (rendition.width && rendition.height) {
        bump(withDimensions, rendition.label)
      }
      if (rendition.width) {
        ;(widthsByLabel[rendition.label] ??= []).push(rendition.width)
      }
    }
  }
  return Object.entries(present)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([label, count]) => {
      const widths = widthsByLabel[label] ?? []
      return [
        label,
        count,
        percent(count, samples.length),
        withDimensions[label] ?? 0,
        widths.length ? quantile(widths, 0) : '-',
        widths.length ? quantile(widths, 0.5) : '-',
        widths.length ? quantile(widths, 1) : '-',
      ]
    })
}

function renderableCeiling(renditions: Array<Rendition>) {
  const widths = renditions
    .filter(isRenderable)
    .map((rendition) => rendition.width)
    .filter((width): width is number => Boolean(width))
  return widths.length ? Math.max(...widths) : 0
}

function surfaceFit(samples: Array<RecordSample>, ceilings: Array<number>) {
  return SURFACES.flatMap((surface) =>
    DEVICE_PIXEL_RATIOS.map((dpr) => {
      const needed = surface.css * dpr
      const met = ceilings.filter((ceiling) => ceiling >= needed).length
      return [
        surface.name,
        `${dpr}x`,
        needed,
        met,
        percent(met, samples.length),
      ]
    }),
  )
}

// what the mapper does today, so the report states the gap rather than implying it
function currentNasaImage(sample: RecordSample): Rendition | undefined {
  return sample.renditions
    .filter((rendition) => rendition.label.startsWith('alternate/'))
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
}

function currentSiImage(sample: RecordSample) {
  return sample.renditions.find(
    (rendition) => rendition.label === 'Screen Image',
  )
}

// ------------------------------------------------------------- fixture audit

interface FixtureRow {
  corpus: string
  id: string
  detail: string
}

async function auditFixtures() {
  const nasa: Array<FixtureRow> = []
  const si: Array<FixtureRow> = []
  const seenNasa = new Set<string>()
  const seenSi = new Set<string>()

  for (const dir of FIXTURE_DIRS) {
    let entries: Array<string>
    try {
      entries = (await readdir(dir)).filter((name) => name.endsWith('.json'))
    } catch {
      continue
    }
    for (const entry of entries) {
      const body = JSON.parse(await readFile(`${dir}/${entry}`, 'utf8'))
      const parsed = asRecord(body)

      for (const item of asArray(asRecord(parsed.collection).items)) {
        const id = asString(asRecord(asArray(asRecord(item).data)[0]).nasa_id)
        if (!id || seenNasa.has(id)) continue
        seenNasa.add(id)
        const renditions = nasaRenditions(item)
        const alternates = renditions.filter((rendition) =>
          rendition.label.startsWith('alternate/'),
        )
        const canonical = renditions.find((rendition) =>
          rendition.label.startsWith('canonical/'),
        )
        nasa.push({
          corpus: dir,
          id,
          detail: [
            `alternates=${alternates.length}`,
            `canonical=${canonical ? extensionOf(canonical.href) || 'none' : 'absent'}`,
            canonical && !canonical.width ? 'canonical-undeclared' : '',
            `ceiling=${renderableCeiling(renditions)}`,
          ]
            .filter(Boolean)
            .join(' '),
        })
      }

      // search responses nest rows; a content response is the record itself
      const rows = asArray(asRecord(parsed.response).rows)
      const siRows = rows.length ? rows : [asRecord(parsed.response)]
      for (const row of siRows) {
        const record = asRecord(row)
        const media = siMediaItems(record)
        const [firstMedia] = media
        if (!firstMedia) continue
        const id = asString(firstMedia.idsId) || asString(record.id)
        if (!id || seenSi.has(id)) continue
        seenSi.add(id)
        const renditions = siRenditions(firstMedia)
        const declared = renditions.find(
          (rendition) => rendition.width && rendition.height,
        )
        si.push({
          corpus: dir,
          id,
          detail: [
            `media=${media.length}`,
            declared
              ? `declared=${declared.width}x${declared.height}`
              : 'declared=none',
            renditions.map((rendition) => rendition.label).join('+'),
          ].join(' '),
        })
      }
    }
  }
  return { nasa, si }
}

// --------------------------------------------------------------- live probes

// reads the pixel dimensions out of a JPEG or PNG header without pulling the
// whole file, so probing a 130MB original stays cheap
function readPixelSize(buffer: Buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) {
        offset++
        continue
      }
      // the loop condition keeps offset + 1 in bounds
      const marker = buffer[offset + 1]!
      const length = buffer.readUInt16BE(offset + 2)
      const isStartOfFrame =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      if (isStartOfFrame) {
        return {
          width: buffer.readUInt16BE(offset + 7),
          height: buffer.readUInt16BE(offset + 5),
        }
      }
      offset += 2 + length
    }
  }
  if (buffer.subarray(1, 4).toString() === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }
  return undefined
}

interface ProbeResult {
  status: number
  contentType?: string
  width?: number
  height?: number
  error?: string
}

const PROBE_BYTE_LIMIT = 65_536

// a host that ignores the Range header answers 200 with the whole file, so
// the cap is enforced on the stream too
async function readPrefix(body: ReadableStream<Uint8Array> | null) {
  if (!body) return Buffer.alloc(0)
  const reader = body.getReader()
  const chunks: Array<Uint8Array> = []
  let size = 0
  while (size < PROBE_BYTE_LIMIT) {
    const { done, value } = await reader.read()
    if (done) break
    // a chunk can be arbitrarily large, so the last one is cut to the budget
    chunks.push(value.subarray(0, PROBE_BYTE_LIMIT - size))
    size += value.length
  }
  await reader.cancel().catch(() => {})
  return Buffer.concat(chunks)
}

async function probeImage(url: string): Promise<ProbeResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
        range: `bytes=0-${PROBE_BYTE_LIMIT - 1}`,
      },
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok) return { status: response.status }
    const buffer = await readPrefix(response.body)
    return {
      status: response.status,
      contentType: response.headers.get('content-type') ?? '',
      ...readPixelSize(buffer),
    }
  } catch (error) {
    return { status: 0, error: (error as Error).message.slice(0, 60) }
  }
}

const PROBE_LIMIT = 12

// mirrors MAX_ORIGINAL_BYTES in nasa-ivl.utils.ts; the sampler observes the
// raw data independently of app code, so the value is duplicated knowingly
const NASA_ORIGINAL_CAP_BYTES = 3 * 1024 * 1024

// the rendition the production rule would serve a no-alternate record: the
// canonical when it is decodable, dimensioned and under the cap, else the
// preview
function servableFallback(sample: RecordSample) {
  const canonical = sample.renditions.find((rendition) =>
    rendition.label.startsWith('canonical/'),
  )
  const eligible =
    canonical &&
    isRenderable(canonical) &&
    canonical.width &&
    canonical.height &&
    (canonical.bytes ?? Infinity) <= NASA_ORIGINAL_CAP_BYTES
  return eligible
    ? canonical
    : sample.renditions.find((rendition) =>
        rendition.label.startsWith('preview/'),
      )
}

// checks the claims the report would otherwise be making on trust: that the
// fallback rendition serves, and that a declared size is the real one
async function probeNasa(samples: Array<RecordSample>) {
  const gaps = samples.filter((sample) => !currentNasaImage(sample))
  const lines: Array<string> = []
  let served = 0
  for (const sample of gaps.slice(0, PROBE_LIMIT)) {
    const fallback = servableFallback(sample)
    if (!fallback) {
      lines.push(`- ${sample.id}: nothing servable to fall back to`)
      continue
    }
    const result = await probeImage(fallback.href)
    const declared = fallback.width
      ? `${fallback.width}x${fallback.height}`
      : 'undeclared'
    const actual = result.width ? `${result.width}x${result.height}` : '?'
    // the probe asks for a byte range, so a healthy answer is 206 as often as 200
    if (result.status === 200 || result.status === 206) served++
    lines.push(
      `- ${sample.id} (${fallback.label}): ${result.status} ${result.contentType ?? ''} declared ${declared}, actual ${actual}${declared !== 'undeclared' && declared !== actual ? ' **mismatch**' : ''}`,
    )
    await sleep(400)
  }
  return {
    lines,
    summary: `${served}/${Math.min(gaps.length, PROBE_LIMIT)} of the sampled no-alternate records serve the rendition production falls back to`,
  }
}

// the Smithsonian delivery service is a IIIF image server; the ladder needs
// both halves of that verified, the reported master size and an
// arbitrary-width cut
const CUT_PROBE_WIDTH = 640

async function probeSi(samples: Array<SiSample>) {
  const undeclared = samples.filter(
    (sample) => sample.idsId && !hasDeclaredDimensions(sample.renditions),
  )
  const lines: Array<string> = []
  let answered = 0
  let cutsServed = 0
  for (const sample of undeclared.slice(0, PROBE_LIMIT)) {
    const url = `https://ids.si.edu/ids/iiif/${encodeURIComponent(sample.idsId)}/info.json`
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': USER_AGENT },
        signal: AbortSignal.timeout(30_000),
      })
      const info = asRecord(await response.json())
      const width = asNumber(info.width)
      const height = asNumber(info.height)
      if (width && height) answered++
      // info.json only proves the size is known; the ladder rests on the
      // server actually cutting a requested width, so ask for one, clamped
      // to the master the way the production ladder never asks an upscale
      await sleep(400)
      const cutWidth = Math.min(CUT_PROBE_WIDTH, width ?? CUT_PROBE_WIDTH)
      const cut = await probeImage(
        `https://ids.si.edu/ids/iiif/${encodeURIComponent(sample.idsId)}/full/${cutWidth},/0/default.jpg`,
      )
      const cutExact = cut.width === cutWidth
      if (cutExact) cutsServed++
      lines.push(
        `- ${sample.idsId}: ${response.status} ${width}x${height}, ${cutWidth}px cut ${cutExact ? 'exact' : `${cut.status} ${cut.width ?? '?'}x${cut.height ?? '?'}`}`,
      )
    } catch (error) {
      lines.push(`- ${sample.idsId}: failed, ${(error as Error).message}`)
    }
    await sleep(400)
  }
  const probed = Math.min(undeclared.length, PROBE_LIMIT)
  return {
    lines,
    summary: `${answered}/${probed} of the sampled records with no declared dimensions answer over IIIF, ${cutsServed}/${probed} serve a ${CUT_PROBE_WIDTH}px cut at exactly that width`,
  }
}

// ---------------------------------------------------------------- edge cases

interface EdgeRule {
  name: string
  match: (sample: RecordSample) => boolean
}

const NASA_EDGE_RULES: Array<EdgeRule> = [
  {
    name: 'no-alternate',
    match: (sample) => !currentNasaImage(sample),
  },
  {
    name: 'no-canonical',
    match: (sample) =>
      !sample.renditions.some((rendition) =>
        rendition.label.startsWith('canonical/'),
      ),
  },
  {
    name: 'tiff-canonical',
    match: (sample) =>
      sample.renditions.some(
        (rendition) =>
          rendition.label.startsWith('canonical/') && !isRenderable(rendition),
      ),
  },
  {
    name: 'canonical-without-dimensions',
    match: (sample) =>
      sample.renditions.some(
        (rendition) =>
          rendition.label.startsWith('canonical/') && !rendition.width,
      ),
  },
  {
    name: 'renderable-ceiling-under-1280',
    match: (sample) => renderableCeiling(sample.renditions) < 1280,
  },
]

const SI_EDGE_RULES: Array<EdgeRule> = [
  {
    name: 'no-declared-dimensions',
    match: (sample) => !hasDeclaredDimensions(sample.renditions),
  },
  {
    name: 'no-hi-res-jpeg',
    match: (sample) =>
      !sample.renditions.some(
        (rendition) => rendition.label === 'High-resolution JPEG',
      ),
  },
  {
    name: 'no-screen-image',
    match: (sample) =>
      !sample.renditions.some(
        (rendition) => rendition.label === 'Screen Image',
      ),
  },
  {
    name: 'unlabelled-resource',
    match: (sample) =>
      sample.renditions.some((rendition) => rendition.label === '(unlabelled)'),
  },
]

const EDGE_CASES_PER_RULE = 3

async function writeEdgeCases(
  provider: string,
  samples: Array<RecordSample>,
  rules: Array<EdgeRule>,
) {
  const lines: Array<string> = []
  for (const rule of rules) {
    const matches = samples.filter((sample) => rule.match(sample))
    for (const sample of matches.slice(0, EDGE_CASES_PER_RULE)) {
      const safeId = sample.id.replace(/[^a-z0-9._-]+/gi, '-').slice(0, 80)
      await writeFile(
        `${edgeCaseDir('renditions')}/${provider}.${rule.name}.${safeId}.json`,
        JSON.stringify(sample.raw, null, 2),
      )
    }
    lines.push(
      `- ${rule.name}: ${matches.length} of ${samples.length} (${percent(matches.length, samples.length)})${matches.length ? `, kept ${Math.min(matches.length, EDGE_CASES_PER_RULE)}` : ''}`,
    )
  }
  return lines
}

// ----------------------------------------------------------------- reporting

async function writeCsv(name: string, samples: Array<RecordSample>) {
  const header = ['id', 'source', 'renderable_ceiling', 'renditions'].join(',')
  const rows = samples.map((sample) =>
    [
      csvCell(sample.id),
      csvCell(sample.source),
      renderableCeiling(sample.renditions),
      csvCell(
        sample.renditions
          .map(
            (rendition) =>
              `${rendition.label}${rendition.width ? `@${rendition.width}x${rendition.height}` : '@?'}`,
          )
          .join(' '),
      ),
    ].join(','),
  )
  await writeFile(`${OUT_DIR}/${name}`, [header, ...rows].join('\n'))
}

async function main() {
  const refetch = process.argv.includes('--refetch')
  const probe = process.argv.includes('--probe')
  await mkdir(RAW_DIR, { recursive: true })

  const apiKey = process.env.SI_OA_API_KEY
  if (!apiKey) throw new Error('Missing SI_OA_API_KEY')

  // request spacing is per provider, so the two collections can overlap
  const [nasa, si] = await Promise.all([
    collectNasa(refetch),
    collectSi(apiKey, refetch),
  ])

  const nasaCeilings = nasa.map((sample) =>
    renderableCeiling(sample.renditions),
  )
  const siCeilings = si.map((sample) => renderableCeiling(sample.renditions))

  const nasaGaps = nasa.filter((sample) => !currentNasaImage(sample))
  const siFallbackAspect = si.filter(
    (sample) => !hasDeclaredDimensions(sample.renditions),
  )
  const siScreenMissing = si.filter((sample) => !currentSiImage(sample))

  await writeCsv('nasa-renditions.csv', nasa)
  await writeCsv('si-renditions.csv', si)

  // a later run can select fewer records for a rule, and leftovers from an
  // earlier one would still read as current when fixtures get picked
  await rm(edgeCaseDir('renditions'), { recursive: true, force: true })
  await mkdir(edgeCaseDir('renditions'), { recursive: true })
  const nasaEdges = await writeEdgeCases('nasa', nasa, NASA_EDGE_RULES)
  const siEdges = await writeEdgeCases('si', si, SI_EDGE_RULES)
  const fixtures = await auditFixtures()

  const probes = probe
    ? await Promise.all([probeNasa(nasa), probeSi(si)]).then(
        ([nasaProbe, siProbe]) => ({ nasa: nasaProbe, si: siProbe }),
      )
    : undefined

  const cached = (await readdir(RAW_DIR)).length

  const report = [
    '# Provider rendition sampling',
    '',
    `NASA records: ${nasa.length} (${NASA_QUERIES.length} image searches)`,
    `Smithsonian records: ${si.length} (${SI_QUERIES.length} searches, NASM images only)`,
    `Cached raw responses: ${cached}`,
    '',
    '## NASA renditions',
    '',
    markdownTable(
      [
        'rendition',
        'records',
        '%',
        'with dimensions',
        'min w',
        'p50 w',
        'max w',
      ],
      labelCoverage(nasa),
    ),
    '',
    `Records where the current rule (largest \`alternate\`) finds nothing: ${nasaGaps.length} (${percent(nasaGaps.length, nasa.length)}). Every one of those renders the 1x1 placeholder today.`,
    '',
    '### What a browser can display',
    '',
    markdownTable(
      ['surface', 'dpr', 'css px needed', 'records that can serve it', '%'],
      surfaceFit(nasa, nasaCeilings),
    ),
    '',
    '## Smithsonian renditions',
    '',
    markdownTable(
      [
        'rendition',
        'records',
        '%',
        'with dimensions',
        'min w',
        'p50 w',
        'max w',
      ],
      labelCoverage(si),
    ),
    '',
    `Records whose media item declares no dimensions anywhere: ${siFallbackAspect.length} (${percent(siFallbackAspect.length, si.length)}). Those take the hardcoded 4:3 today.`,
    `Records with no Screen Image rendition: ${siScreenMissing.length}.`,
    `Media items per record: max ${Math.max(...si.map((sample) => sample.mediaCount), 0)}, more than one on ${si.filter((sample) => sample.mediaCount > 1).length}.`,
    '',
    '### What a browser can display',
    '',
    markdownTable(
      ['surface', 'dpr', 'css px needed', 'records that can serve it', '%'],
      surfaceFit(si, siCeilings),
    ),
    '',
    'Those percentages count only the renditions the API lists. The delivery service resizes on demand, so the real ceiling is the master image.',
    '',
    '## Edge cases (bodies in provider-samples/edge-cases)',
    '',
    '### NASA',
    '',
    ...nasaEdges,
    '',
    '### Smithsonian',
    '',
    ...siEdges,
    '',
    '## Committed fixture coverage',
    '',
    `NASA records across ${FIXTURE_DIRS.length} fixture corpora: ${fixtures.nasa.length}`,
    '',
    ...fixtures.nasa.map((row) => `- \`${row.id}\` ${row.detail}`),
    '',
    `Smithsonian records: ${fixtures.si.length}`,
    '',
    ...fixtures.si.map((row) => `- \`${row.id}\` ${row.detail}`),
    '',
    ...(probes
      ? [
          '## Live probes',
          '',
          `NASA: ${probes.nasa.summary}`,
          '',
          ...probes.nasa.lines,
          '',
          `Smithsonian: ${probes.si.summary}`,
          '',
          ...probes.si.lines,
          '',
        ]
      : []),
  ].join('\n')

  await writeFile(`${OUT_DIR}/renditions-report.md`, report)
  process.stdout.write(report)
}

await main()
