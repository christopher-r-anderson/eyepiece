import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getProviderFixtureMode,
  redactProviderUrl,
  replayProviderFixture,
} from './provider-fixtures'

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

describe('replayProviderFixture', () => {
  it('fails on a miss instead of reaching the network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await expect(
      replayProviderFixture('https://images-api.nasa.gov/search?q=no-fixture'),
    ).rejects.toThrow(/No provider fixture/)
    expect(fetchSpy).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })

  it('keeps the api key out of the miss message', async () => {
    const error = await replayProviderFixture(
      'https://api.si.edu/openaccess/api/v1.0/search?q=moon&api_key=secret-key',
    ).catch((thrown: unknown) => thrown)

    expect(String(error)).not.toContain('secret-key')
    expect(String(error)).toContain('api_key=REDACTED')
  })
})
