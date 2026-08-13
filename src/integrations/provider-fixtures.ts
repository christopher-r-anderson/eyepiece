// Replays recorded upstream responses so e2e does not depend on NASA and
// Smithsonian being up. Server-side provider calls happen during SSR, where
// Playwright's page.route cannot reach them, so the seam has to be here.
//
//   PROVIDER_FIXTURE_MODE=record  real request, response written to disk
//   PROVIDER_FIXTURE_MODE=replay  fixture only, a miss is an error
//
// Fixtures are read from the working directory, which is the repo root for
// every way we run the suite.
import { createHash } from 'node:crypto'

const FIXTURE_DIR = 'e2e/__provider-fixtures__'

// misses accumulate here so the suite can fail loudly on them: the throw
// below reaches specs only when a journey depends on the response, while a
// tolerated path (an intent preload) would otherwise rot silently
export const FIXTURE_MISS_LOG = 'e2e/.fixture-misses.log'

let writeCounter = 0

export type ProviderFixtureMode = 'record' | 'replay'

export function getProviderFixtureMode(): ProviderFixtureMode | undefined {
  const mode = process.env.PROVIDER_FIXTURE_MODE
  return mode === 'record' || mode === 'replay' ? mode : undefined
}

export function redactProviderUrl(url: string) {
  return url.replace(/api_key=[^&]+/, 'api_key=REDACTED')
}

// the key ignores the api key so a rotated or per-developer key still
// resolves the same fixture
export function providerFixturePath(url: string) {
  const redacted = redactProviderUrl(url)
  const digest = createHash('sha1').update(redacted).digest('hex').slice(0, 10)
  const label = redacted
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .slice(0, 80)
  return `${FIXTURE_DIR}/${label}.${digest}.json`
}

interface ProviderFixture {
  status: number
  statusText: string
  contentType: string
  body?: unknown
  text?: string
}

export async function replayProviderFixture(url: string): Promise<Response> {
  const { readFile } = await import('node:fs/promises')
  const path = providerFixturePath(url)
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    const { appendFileSync } = await import('node:fs')
    try {
      appendFileSync(FIXTURE_MISS_LOG, `${path} <- ${redactProviderUrl(url)}\n`)
    } catch {
      // the log is best-effort; the throw below still reports the miss
    }
    // falling through to the network would quietly restore the dependency
    // this mode exists to remove
    throw new Error(
      `No provider fixture for ${redactProviderUrl(url)} (expected ${path}). Record one with pnpm test:e2e:record.`,
    )
  }
  const fixture = JSON.parse(raw) as ProviderFixture
  const body = fixture.text ?? JSON.stringify(fixture.body)
  return new Response(body, {
    status: fixture.status,
    // both clients read the provider's error description from the body and
    // fall back to statusText, so a replayed error has to carry both
    statusText: fixture.statusText,
    headers: { 'content-type': fixture.contentType },
  })
}

// only the url is redacted by the fixture name; a provider that echoes the
// request in an error body would otherwise put the key in a committed file
function scrubApiKey(text: string) {
  const apiKey = process.env.SI_OA_API_KEY
  if (!apiKey) return text
  return text
    .split(apiKey)
    .join('REDACTED')
    .split(encodeURIComponent(apiKey))
    .join('REDACTED')
}

export async function recordProviderFixture(url: string, response: Response) {
  const { mkdir, rename, writeFile } = await import('node:fs/promises')
  const text = scrubApiKey(await response.clone().text())
  const shared = {
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type') ?? 'application/json',
  }
  let fixture: ProviderFixture
  try {
    fixture = { ...shared, body: JSON.parse(text) }
  } catch {
    fixture = { ...shared, text }
  }
  await mkdir(FIXTURE_DIR, { recursive: true })
  const path = providerFixturePath(url)
  // several workers can request the same url at once, and concurrent writes
  // to one path can leave it torn
  const pending = `${path}.${process.pid}.${writeCounter++}.tmp`
  await writeFile(pending, JSON.stringify(fixture, null, 2))
  await rename(pending, path)
}
