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
function fixtureName(url: string) {
  const redacted = redactProviderUrl(url)
  const digest = createHash('sha1').update(redacted).digest('hex').slice(0, 10)
  const label = redacted
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .slice(0, 80)
  return `${FIXTURE_DIR}/${label}.${digest}.json`
}

export async function replayProviderFixture(url: string): Promise<Response> {
  const { readFile } = await import('node:fs/promises')
  const path = fixtureName(url)
  let body: string
  try {
    body = await readFile(path, 'utf8')
  } catch {
    // falling through to the network would quietly restore the dependency
    // this mode exists to remove
    throw new Error(
      `No provider fixture for ${redactProviderUrl(url)} (expected ${path}). Record one with pnpm test:e2e:record.`,
    )
  }
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

export async function recordProviderFixture(url: string, response: Response) {
  if (!response.ok) return
  const { mkdir, writeFile } = await import('node:fs/promises')
  await mkdir(FIXTURE_DIR, { recursive: true })
  await writeFile(fixtureName(url), await response.clone().text())
}
