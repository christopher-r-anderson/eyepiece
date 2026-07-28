import {
  getProviderFixtureMode,
  recordProviderFixture,
  replayProviderFixture,
} from './provider-fixtures'

// generous against real provider tails (11s NASA responses succeed) while
// staying inside the platform's function ceiling, so a hung connection
// surfaces as a structured provider error instead of a platform 502
const PROVIDER_DEADLINE_MS = 25_000

export async function providerFetch(url: string) {
  const fixtureMode = getProviderFixtureMode()
  if (fixtureMode === 'replay') {
    return replayProviderFixture(url)
  }
  const response = await fetch(url, {
    signal: AbortSignal.timeout(PROVIDER_DEADLINE_MS),
  })
  if (fixtureMode === 'record') {
    await recordProviderFixture(url, response)
  }
  return response
}
