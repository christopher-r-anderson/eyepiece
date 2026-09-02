import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FIXTURE_MISS_LOG,
  getProviderFixtureMode,
  providerFixturePath,
  recordProviderFixture,
  redactProviderUrl,
  replayProviderFixture,
} from './provider-fixtures'
import { runWithRequestAttribution } from '@/server/lib/request-attribution'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getProviderFixtureMode', () => {
  it('recognizes the two modes', () => {
    vi.stubEnv('PROVIDER_FIXTURE_MODE', 'record')
    expect(getProviderFixtureMode()).toBe('record')

    vi.stubEnv('PROVIDER_FIXTURE_MODE', 'replay')
    expect(getProviderFixtureMode()).toBe('replay')
  })

  it('treats anything else as off', () => {
    vi.stubEnv('PROVIDER_FIXTURE_MODE', '')
    expect(getProviderFixtureMode()).toBeUndefined()

    vi.stubEnv('PROVIDER_FIXTURE_MODE', 'true')
    expect(getProviderFixtureMode()).toBeUndefined()
  })
})

describe('redactProviderUrl', () => {
  it('removes the api key and keeps the rest of the query', () => {
    expect(
      redactProviderUrl(
        'https://api.si.edu/openaccess/api/v1.0/search?q=moon&api_key=secret-key&rows=24',
      ),
    ).toBe(
      'https://api.si.edu/openaccess/api/v1.0/search?q=moon&api_key=REDACTED&rows=24',
    )
  })
})

describe('recordProviderFixture', () => {
  it('keeps a reflected api key out of the written fixture', async () => {
    const { mkdir, readFile, mkdtemp } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const dir = await mkdtemp(join(tmpdir(), 'eyepiece-record-'))
    const cwd = process.cwd()
    vi.stubEnv('SI_OA_API_KEY', 'super-secret-key')

    try {
      process.chdir(dir)
      await mkdir('e2e/__provider-fixtures__', { recursive: true })
      const url =
        'https://api.si.edu/openaccess/api/v1.0/search?api_key=super-secret-key'

      await recordProviderFixture(
        url,
        new Response(
          JSON.stringify({
            message: 'bad key super-secret-key for api_key=super-secret-key',
          }),
          { status: 403, headers: { 'content-type': 'application/json' } },
        ),
      )

      const written = await readFile(providerFixturePath(url), 'utf8')
      expect(written).not.toContain('super-secret-key')
      expect(written).toContain('REDACTED')
    } finally {
      process.chdir(cwd)
    }
  })
})

describe('replayProviderFixture', () => {
  it('reproduces the recorded status', async () => {
    const { mkdtemp, writeFile } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const dir = await mkdtemp(join(tmpdir(), 'eyepiece-fixtures-'))
    const cwd = process.cwd()

    try {
      const url = 'https://images-api.nasa.gov/album/gone?page=1'
      process.chdir(dir)
      await import('node:fs/promises').then(({ mkdir }) =>
        mkdir('e2e/__provider-fixtures__', { recursive: true }),
      )
      await writeFile(
        join(dir, providerFixturePath(url)),
        JSON.stringify({
          status: 404,
          statusText: 'Not Found',
          contentType: 'application/json',
          body: { reason: 'No assets found' },
        }),
      )

      const response = await replayProviderFixture(url)

      expect(response.status).toBe(404)
      expect(response.statusText).toBe('Not Found')
      await expect(response.json()).resolves.toEqual({
        reason: 'No assets found',
      })
    } finally {
      process.chdir(cwd)
    }
  })

  // misses append to the log the teardown guard reads, so they run from a
  // temp directory to keep the repo's log untouched
  async function inTempDir(run: () => Promise<void>) {
    const { mkdtemp, mkdir } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const dir = await mkdtemp(join(tmpdir(), 'eyepiece-fixtures-'))
    const cwd = process.cwd()
    process.chdir(dir)
    try {
      await mkdir('e2e/__provider-fixtures__', { recursive: true })
      await run()
    } finally {
      process.chdir(cwd)
    }
  }

  it('fails on a miss instead of reaching the network', async () => {
    await inTempDir(async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')

      await expect(
        replayProviderFixture(
          'https://images-api.nasa.gov/search?q=no-fixture',
        ),
      ).rejects.toThrow(/No provider fixture/)
      expect(fetchSpy).not.toHaveBeenCalled()

      fetchSpy.mockRestore()
    })
  })

  it('logs the miss for the teardown guard', async () => {
    await inTempDir(async () => {
      const url = 'https://images-api.nasa.gov/search?q=no-fixture'
      await replayProviderFixture(url).catch(() => {})

      const { readFile } = await import('node:fs/promises')
      const log = await readFile(FIXTURE_MISS_LOG, 'utf8')
      expect(log).toContain(providerFixturePath(url))
      expect(log).toContain(url)
    })
  })

  it('names the request that caused the miss when one is in scope', async () => {
    await inTempDir(async () => {
      const url = 'https://images-api.nasa.gov/search?nasa_id=iss034e010322'
      const request = new Request(
        'https://localhost:8888/api/v1/asset/nasa_ivl/iss034e010322',
        { headers: { referer: 'https://localhost:8888/favorites' } },
      )
      const error = await runWithRequestAttribution(request, () =>
        replayProviderFixture(url).catch((thrown: unknown) => thrown),
      )

      const attribution =
        'during GET /api/v1/asset/nasa_ivl/iss034e010322 referer=https://localhost:8888/favorites'
      expect(String(error)).toContain(attribution)
      const { readFile } = await import('node:fs/promises')
      const log = await readFile(FIXTURE_MISS_LOG, 'utf8')
      expect(log).toContain(`${url} ${attribution}`)
    })
  })

  it('keeps the api key out of the miss message', async () => {
    await inTempDir(async () => {
      const error = await replayProviderFixture(
        'https://api.si.edu/openaccess/api/v1.0/search?q=moon&api_key=secret-key',
      ).catch((thrown: unknown) => thrown)

      expect(String(error)).not.toContain('secret-key')
      expect(String(error)).toContain('api_key=REDACTED')
    })
  })
})
