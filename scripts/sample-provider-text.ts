// Samples raw NASA and Smithsonian responses and reports how their text
// fields actually behave, so the asset text model (#184) is decided from data
// rather than from the one fixture per provider. Responses bypass our Zod
// schemas: the point is to see the fields those schemas strip.
//
//   pnpm sample-provider-text [--refetch]
//
// Requests are sequential and spaced; raw responses are cached under
// provider-samples/raw so re-runs analyze without touching the APIs.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { SHOWCASE_CURATION } from '@/features/collections/collections.showcase'

const OUT_DIR = 'provider-samples'
const RAW_DIR = `${OUT_DIR}/raw`
const EDGE_CASE_DIR = `${OUT_DIR}/edge-cases`

const REQUEST_SPACING_MS = 1500
const MAX_ATTEMPTS = 3
const USER_AGENT =
  'eyepiece-research/1.0 (+https://github.com/christopher-r-anderson/eyepiece)'

const NASA_QUERIES = [
  'apollo',
  'mars rover',
  'hubble',
  'earth from orbit',
  'saturn',
  'astronaut portrait',
  'launch',
  'nebula',
  'international space station',
  'space shuttle',
  'eclipse',
  'spacewalk',
]

const SI_QUERIES = [
  'apollo',
  'spacesuit',
  'wright brothers',
  'rocket engine',
  'lunar module',
  'aircraft',
  'satellite',
  'helicopter',
  'jet engine',
  'balloon',
  'telescope',
  'uniform',
]

const SI_SEARCH_FILTER =
  'online_media_type:Images AND data_source:"National Air and Space Museum"'

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

// the api key is redacted before both the digest and the label, so a rotated
// or per-developer key still hits the same cache entry
function cacheName(url: string) {
  const redacted = redact(url)
  const digest = createHash('sha1').update(redacted).digest('hex').slice(0, 10)
  const label = redacted
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
  return `${label.slice(0, 90)}.${digest}.json`
}

async function fetchJson(url: string, refetch: boolean): Promise<unknown> {
  const file = `${RAW_DIR}/${cacheName(url)}`
  if (!refetch) {
    try {
      return JSON.parse(await readFile(file, 'utf8'))
    } catch {}
  }
  for (let attempt = 1; ; attempt++) {
    await sleep(REQUEST_SPACING_MS)
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
    })
    if (response.ok) {
      const body = await response.text()
      await writeFile(file, body)
      return JSON.parse(body)
    }
    // 429 and 5xx are the only ones worth waiting out; anything else is our bug
    if (
      attempt >= MAX_ATTEMPTS ||
      (response.status !== 429 && response.status < 500)
    ) {
      throw new Error(
        `${response.status} ${response.statusText} for ${redact(url)}`,
      )
    }
    await sleep(attempt * 10_000)
  }
}

function redact(url: string) {
  return url.replace(/api_key=[^&]+/, 'api_key=REDACTED')
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

function asArray(value: unknown): Array<unknown> {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

interface Sample {
  id: string
  source: string
  fields: Record<string, string>
  // kept so awkward records can be lifted straight out as parsing fixtures
  raw: unknown
}

async function collectNasa(refetch: boolean): Promise<Array<Sample>> {
  const samples: Array<Sample> = []
  const seen = new Set<string>()

  const take = (items: Array<unknown>, source: string) => {
    for (const item of items) {
      const data = asRecord(asArray(asRecord(item).data)[0])
      const id = asString(data.nasa_id)
      if (!id || seen.has(id)) continue
      seen.add(id)
      samples.push({
        id,
        source,
        raw: item,
        fields: {
          title: asString(data.title),
          description: asString(data.description),
          description_508: asString(data.description_508),
          secondary_creator: asString(data.secondary_creator),
          location: asString(data.location),
          keywords: asArray(data.keywords).map(asString).join(', '),
        },
      })
    }
  }

  for (const query of NASA_QUERIES) {
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=100`
    const body = asRecord(await fetchJson(url, refetch))
    take(asArray(asRecord(body.collection).items), `search:${query}`)
  }

  for (const item of SHOWCASE_CURATION.collections.flatMap(
    (collection) => collection.items,
  )) {
    if (item.providerId !== 'nasa_ivl') continue
    const url = `https://images-api.nasa.gov/search?nasa_id=${encodeURIComponent(item.externalId)}`
    const body = asRecord(await fetchJson(url, refetch))
    const before = samples.length
    // the search endpoint fuzzy-matches nasa_id, the same reason the adapter
    // exact-filters this lookup
    const matches = asArray(asRecord(body.collection).items).filter(
      (candidate) =>
        asString(asRecord(asArray(asRecord(candidate).data)[0]).nasa_id) ===
        item.externalId,
    )
    take(matches, 'showcase')
    // showcase ids already pulled in by a query keep their original source row
    if (samples.length === before) {
      const existing = samples.find((sample) => sample.id === item.externalId)
      if (existing) existing.source = `${existing.source}+showcase`
    }
  }

  return samples
}

interface SiStructure {
  freetextKeys: Record<string, number>
  noteLabels: Record<string, number>
  nonStringContent: number
  recordsWithMedia: number
  recordsWithoutFreetext: number
  mediaCounts: Array<number>
}

function bump(tally: Record<string, number>, key: string) {
  tally[key] = (tally[key] ?? 0) + 1
}

function siNotes(freetext: Record<string, unknown>, label: string) {
  return asArray(freetext.notes)
    .map(asRecord)
    .filter((note) => asString(note.label) === label)
    .map((note) => asString(note.content))
    .filter(Boolean)
}

async function collectSi(
  apiKey: string,
  refetch: boolean,
): Promise<{ samples: Array<Sample>; structure: SiStructure }> {
  const samples: Array<Sample> = []
  const seen = new Set<string>()
  const structure: SiStructure = {
    freetextKeys: {},
    noteLabels: {},
    nonStringContent: 0,
    recordsWithMedia: 0,
    recordsWithoutFreetext: 0,
    mediaCounts: [],
  }

  const take = (rows: Array<unknown>, source: string) => {
    for (const row of rows) {
      const record = asRecord(row)
      const id = asString(record.id)
      if (!id || seen.has(id)) continue
      seen.add(id)

      const content = asRecord(record.content)
      const dnr = asRecord(content.descriptiveNonRepeating)
      const freetext = asRecord(content.freetext)
      const media = asArray(asRecord(dnr.online_media).media).map(asRecord)

      if (Object.keys(freetext).length === 0) structure.recordsWithoutFreetext++
      if (media.length > 0) structure.recordsWithMedia++
      structure.mediaCounts.push(media.length)
      for (const key of Object.keys(freetext)) bump(structure.freetextKeys, key)
      for (const entry of asArray(freetext.notes).map(asRecord)) {
        bump(structure.noteLabels, asString(entry.label) || '(no label)')
      }
      for (const entries of Object.values(freetext)) {
        for (const entry of asArray(entries).map(asRecord)) {
          if ('content' in entry && typeof entry.content !== 'string') {
            structure.nonStringContent++
          }
        }
      }

      const summaries = siNotes(freetext, 'Summary')
      samples.push({
        id,
        source,
        raw: row,
        fields: {
          title: asString(record.title),
          dnr_title: asString(asRecord(dnr.title).content),
          altTextAccessibility: asString(media[0]?.altTextAccessibility),
          extDescrAccessibility: asString(media[0]?.extDescrAccessibility),
          summary_first: summaries[0] ?? '',
          summary_joined: summaries.join('\n\n'),
          physicalDescription: asArray(freetext.physicalDescription)
            .map(asRecord)
            .map(
              (entry) => `${asString(entry.label)}: ${asString(entry.content)}`,
            )
            .join('; '),
          caption: siNotes(freetext, 'Caption').join('\n\n'),
        },
      })
    }
  }

  for (const query of SI_QUERIES) {
    const url = `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(`${query} AND ${SI_SEARCH_FILTER}`)}&rows=100&api_key=${apiKey}`
    const body = asRecord(await fetchJson(url, refetch))
    take(asArray(asRecord(body.response).rows), `search:${query}`)
  }

  return { samples, structure }
}

// content records are the detail endpoint's payload; search rows may carry a
// reduced copy of the same record, so a sample of both tells us whether the
// detail page can rely on what search returned
async function compareSiContent(
  samples: Array<Sample>,
  apiKey: string,
  refetch: boolean,
) {
  const picks = samples.slice(0, 10)
  const diffs: Array<string> = []
  for (const pick of picks) {
    const url = `https://api.si.edu/openaccess/api/v1.0/content/${encodeURIComponent(pick.id)}?api_key=${apiKey}`
    const body = asRecord(await fetchJson(url, refetch))
    const record = asRecord(asRecord(body).response)
    const content = asRecord(record.content)
    const dnr = asRecord(content.descriptiveNonRepeating)
    const media = asArray(asRecord(dnr.online_media).media).map(asRecord)
    const freetext = asRecord(content.freetext)
    const candidates: Array<[string, string]> = [
      ['altTextAccessibility', asString(media[0]?.altTextAccessibility)],
      ['extDescrAccessibility', asString(media[0]?.extDescrAccessibility)],
      ['summary_first', siNotes(freetext, 'Summary')[0] ?? ''],
    ]
    const changes = candidates
      .filter(([field, value]) => value !== pick.fields[field])
      .map(([field]) => field)
    diffs.push(
      `${pick.id}: ${changes.length ? changes.join(', ') : 'identical'}`,
    )
  }
  return diffs
}

const normalize = (value: string) =>
  value.replace(/\s+/g, ' ').trim().toLowerCase()

const HTML_PATTERN = /<[a-z/][^>]*>|&[a-z]+;|&#\d+;/i

interface FieldStats {
  field: string
  present: number
  eqTitle: number
  startsWithTitle: number
  html: number
  median: number
  p90: number
}

function fieldStats(samples: Array<Sample>, field: string): FieldStats {
  const values = samples.map((sample) => sample.fields[field] ?? '')
  const filled = values.filter((value) => value.trim().length > 0)
  const lengths = filled.map((value) => value.length).sort((a, b) => a - b)
  const at = (fraction: number) =>
    lengths.length ? lengths[Math.floor((lengths.length - 1) * fraction)] : 0
  return {
    field,
    present: filled.length,
    eqTitle: samples.filter(
      (sample) =>
        (sample.fields[field] ?? '').trim() &&
        normalize(sample.fields[field] ?? '') ===
          normalize(sample.fields.title),
    ).length,
    startsWithTitle: samples.filter((sample) => {
      const value = normalize(sample.fields[field] ?? '')
      const title = normalize(sample.fields.title)
      return value && title && value !== title && value.startsWith(title)
    }).length,
    html: filled.filter((value) => HTML_PATTERN.test(value)).length,
    median: at(0.5),
    p90: at(0.9),
  }
}

function pairOverlap(samples: Array<Sample>, a: string, b: string) {
  const both = samples.filter(
    (sample) =>
      (sample.fields[a] ?? '').trim() && (sample.fields[b] ?? '').trim(),
  )
  const same = both.filter(
    (sample) =>
      normalize(sample.fields[a] ?? '') === normalize(sample.fields[b] ?? ''),
  )
  return { both: both.length, same: same.length }
}

interface EdgeRule {
  name: string
  match: (sample: Sample) => boolean
}

const filled = (value: string | undefined) => Boolean(value && value.trim())

const NASA_EDGE_RULES: Array<EdgeRule> = [
  { name: 'no-description', match: (s) => !filled(s.fields.description) },
  {
    name: 'description-equals-title',
    match: (s) =>
      filled(s.fields.description) &&
      normalize(s.fields.description) === normalize(s.fields.title),
  },
  {
    name: 'description-restates-title',
    match: (s) =>
      filled(s.fields.description) &&
      normalize(s.fields.description) !== normalize(s.fields.title) &&
      normalize(s.fields.description).startsWith(normalize(s.fields.title)),
  },
  {
    name: 'html-in-description',
    match: (s) => HTML_PATTERN.test(s.fields.description),
  },
  {
    name: 'distinct-508',
    match: (s) =>
      filled(s.fields.description_508) &&
      normalize(s.fields.description_508) !== normalize(s.fields.description) &&
      normalize(s.fields.description_508) !== normalize(s.fields.title),
  },
  {
    name: '508-equals-title',
    match: (s) =>
      filled(s.fields.description_508) &&
      normalize(s.fields.description_508) === normalize(s.fields.title),
  },
  {
    name: 'very-long-description',
    match: (s) => s.fields.description.length > 2000,
  },
]

function siParts(sample: Sample) {
  const content = asRecord(asRecord(sample.raw).content)
  const freetext = asRecord(content.freetext)
  const media = asArray(
    asRecord(asRecord(content.descriptiveNonRepeating).online_media).media,
  ).map(asRecord)
  return { freetext, media }
}

const SI_EDGE_RULES: Array<EdgeRule> = [
  {
    name: 'freetext-content-not-string',
    match: (s) =>
      Object.values(siParts(s).freetext).some((entries) =>
        asArray(entries)
          .map(asRecord)
          .some(
            (entry) => 'content' in entry && typeof entry.content !== 'string',
          ),
      ),
  },
  {
    name: 'no-freetext',
    match: (s) => Object.keys(siParts(s).freetext).length === 0,
  },
  {
    name: 'media-without-alt-text',
    match: (s) =>
      siParts(s).media.length > 0 && !filled(s.fields.altTextAccessibility),
  },
  {
    name: 'alt-and-ext-descr',
    match: (s) =>
      filled(s.fields.altTextAccessibility) &&
      filled(s.fields.extDescrAccessibility),
  },
  { name: 'no-online-media', match: (s) => siParts(s).media.length === 0 },
  { name: 'multiple-media', match: (s) => siParts(s).media.length > 1 },
  {
    name: 'multiple-summaries',
    match: (s) => siNotes(siParts(s).freetext, 'Summary').length > 1,
  },
  {
    name: 'title-differs-from-dnr-title',
    match: (s) =>
      filled(s.fields.dnr_title) &&
      normalize(s.fields.title) !== normalize(s.fields.dnr_title),
  },
  {
    name: 'physical-description-only',
    match: (s) =>
      !filled(s.fields.summary_first) &&
      !filled(s.fields.extDescrAccessibility) &&
      filled(s.fields.physicalDescription),
  },
  {
    name: 'html-in-ext-descr',
    match: (s) => HTML_PATTERN.test(s.fields.extDescrAccessibility),
  },
]

const EDGE_CASES_PER_RULE = 3

async function writeEdgeCases(
  provider: string,
  samples: Array<Sample>,
  rules: Array<EdgeRule>,
) {
  const dir = EDGE_CASE_DIR
  await mkdir(dir, { recursive: true })
  const lines: Array<string> = []
  for (const rule of rules) {
    const matches = samples.filter((sample) => rule.match(sample))
    for (const sample of matches.slice(0, EDGE_CASES_PER_RULE)) {
      const safeId = sample.id.replace(/[^a-z0-9._-]+/gi, '-').slice(0, 80)
      await writeFile(
        `${dir}/${provider}.${rule.name}.${safeId}.json`,
        JSON.stringify(sample.raw, null, 2),
      )
    }
    lines.push(
      `- ${rule.name}: ${matches.length} matched${matches.length ? `, kept ${Math.min(matches.length, EDGE_CASES_PER_RULE)}` : ''}`,
    )
  }
  return lines
}

function statsTable(samples: Array<Sample>, fields: Array<string>) {
  const total = samples.length
  const rows = fields.map((field) => fieldStats(samples, field))
  const lines = [
    '| field | present | % | == title | starts with title | has html | len p50 | len p90 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map(
      (row) =>
        `| ${row.field} | ${row.present} | ${Math.round((row.present / total) * 100)}% | ${row.eqTitle} | ${row.startsWithTitle} | ${row.html} | ${row.median} | ${row.p90} |`,
    ),
  ]
  return lines.join('\n')
}

function csvCell(value: string) {
  return `"${value.replace(/\s+/g, ' ').trim().slice(0, 300).replace(/"/g, '""')}"`
}

async function writeCsv(
  name: string,
  samples: Array<Sample>,
  fields: Array<string>,
) {
  const header = ['id', 'source', ...fields].join(',')
  const rows = samples.map((sample) =>
    [
      csvCell(sample.id),
      csvCell(sample.source),
      ...fields.map((field) => csvCell(sample.fields[field] ?? '')),
    ].join(','),
  )
  await writeFile(`${OUT_DIR}/${name}`, [header, ...rows].join('\n'))
}

function counts(record: Record<string, number>) {
  return Object.entries(record)
    .sort(([, a], [, b]) => b - a)
    .map(([key, count]) => `${key} (${count})`)
    .join(', ')
}

async function main() {
  const refetch = process.argv.includes('--refetch')
  await mkdir(RAW_DIR, { recursive: true })

  const apiKey = process.env.SI_OA_API_KEY
  if (!apiKey) throw new Error('Missing SI_OA_API_KEY')

  const nasa = await collectNasa(refetch)
  const { samples: si, structure } = await collectSi(apiKey, refetch)
  const siContentDiffs = await compareSiContent(si, apiKey, refetch)

  const nasaFields = [
    'title',
    'description',
    'description_508',
    'secondary_creator',
    'location',
  ]
  const siFields = [
    'title',
    'dnr_title',
    'altTextAccessibility',
    'extDescrAccessibility',
    'summary_first',
    'summary_joined',
    'physicalDescription',
    'caption',
  ]

  await writeCsv('nasa-records.csv', nasa, nasaFields)
  await writeCsv('si-records.csv', si, siFields)

  // a later run can select fewer records for a rule, and leftovers from an
  // earlier one would still read as current when fixtures get picked
  await rm(EDGE_CASE_DIR, { recursive: true, force: true })
  const nasaEdges = await writeEdgeCases('nasa', nasa, NASA_EDGE_RULES)
  const siEdges = await writeEdgeCases('si', si, SI_EDGE_RULES)

  const showcase = nasa.filter((sample) => sample.source.includes('showcase'))
  const cached = (await readdir(RAW_DIR)).length

  const report = [
    '# Provider text sampling',
    '',
    `NASA records: ${nasa.length} (${NASA_QUERIES.length} image searches + ${showcase.length} showcase ids)`,
    `Smithsonian records: ${si.length} (${SI_QUERIES.length} searches, NASM images only)`,
    `Cached raw responses: ${cached}`,
    '',
    '## NASA fields',
    '',
    statsTable(nasa, nasaFields),
    '',
    `description vs description_508: ${JSON.stringify(pairOverlap(nasa, 'description', 'description_508'))}`,
    '',
    '## NASA showcase records',
    '',
    statsTable(showcase, nasaFields),
    '',
    '## Smithsonian fields',
    '',
    statsTable(si, siFields),
    '',
    `title vs dnr_title: ${JSON.stringify(pairOverlap(si, 'title', 'dnr_title'))}`,
    `altText vs extDescr: ${JSON.stringify(pairOverlap(si, 'altTextAccessibility', 'extDescrAccessibility'))}`,
    `extDescr vs summary_first: ${JSON.stringify(pairOverlap(si, 'extDescrAccessibility', 'summary_first'))}`,
    '',
    '## Smithsonian structure',
    '',
    `records with online media: ${structure.recordsWithMedia}/${si.length}`,
    `records with no freetext: ${structure.recordsWithoutFreetext}`,
    `media items per record: max ${Math.max(...structure.mediaCounts, 0)}, more than one on ${structure.mediaCounts.filter((count) => count > 1).length}`,
    `freetext entries whose content is not a string: ${structure.nonStringContent}`,
    '',
    `freetext keys: ${counts(structure.freetextKeys)}`,
    '',
    `note labels: ${counts(structure.noteLabels)}`,
    '',
    '## Smithsonian search row vs content record',
    '',
    ...siContentDiffs.map((diff) => `- ${diff}`),
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
  ].join('\n')

  await writeFile(`${OUT_DIR}/report.md`, report)
  process.stdout.write(report)
}

await main()
