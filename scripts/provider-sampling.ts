// Shared plumbing for the provider sampling scripts. Responses bypass our Zod
// schemas on purpose: sampling exists to see the fields those schemas strip.
//
// Raw responses are cached under provider-samples/raw and keyed by a redacted
// URL, so the text and rendition samplers share one cache and re-runs analyze
// without touching the APIs.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

export const OUT_DIR = 'provider-samples'
export const RAW_DIR = `${OUT_DIR}/raw`
// each sampler owns a subdirectory: a run clears its own edge cases so a rule
// that now selects fewer records leaves no stale files behind, and clearing
// one sampler's output must not take the other's with it
export const edgeCaseDir = (sampler: string) =>
  `${OUT_DIR}/edge-cases/${sampler}`

// one query list per provider, shared by every sampler: the raw cache is
// keyed by URL, so samplers with diverging queries would stop sharing it and
// analyze different populations
export const NASA_QUERIES = [
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

export const SI_QUERIES = [
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

export const SI_SEARCH_FILTER =
  'online_media_type:Images AND data_source:"National Air and Space Museum"'

const REQUEST_SPACING_MS = 1500
const MAX_ATTEMPTS = 3
export const USER_AGENT =
  'eyepiece-research/1.0 (+https://github.com/christopher-r-anderson/eyepiece)'

export const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

function redact(url: string) {
  return url.replace(/api_key=[^&]+/, 'api_key=REDACTED')
}

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

export async function fetchJson(
  url: string,
  refetch: boolean,
): Promise<unknown> {
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

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

export function asArray(value: unknown): Array<unknown> {
  return Array.isArray(value) ? value : []
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function bump(tally: Record<string, number>, key: string) {
  tally[key] = (tally[key] ?? 0) + 1
}

export function counts(record: Record<string, number>) {
  return Object.entries(record)
    .sort(([, a], [, b]) => b - a)
    .map(([key, count]) => `${key} (${count})`)
    .join(', ')
}

export function percent(part: number, whole: number) {
  return whole === 0 ? '0%' : `${Math.round((part / whole) * 100)}%`
}

export function quantile(values: Array<number>, fraction: number) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) * fraction)] ?? 0
}

export function csvCell(value: string) {
  return `"${value.replace(/\s+/g, ' ').trim().slice(0, 300).replace(/"/g, '""')}"`
}

export function markdownTable(
  headers: Array<string>,
  rows: Array<Array<string | number>>,
) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n')
}
