import {
  getProviderFixtureMode,
  recordProviderFixture,
  replayProviderFixture,
} from './provider-fixtures'

// generous against real provider tails (11s NASA responses succeed) while
// staying inside the platform's function ceiling, so a hung connection
// surfaces as a structured provider error instead of a platform 502
const PROVIDER_DEADLINE_MS = 25_000

export async function providerFetch(
  url: string,
  // a best-effort request that a page must not wait out passes its own,
  // shorter deadline
  options?: { deadlineMs?: number },
) {
  const fixtureMode = getProviderFixtureMode()
  if (fixtureMode === 'replay') {
    return replayProviderFixture(url)
  }
  const response = await fetch(url, {
    signal: AbortSignal.timeout(options?.deadlineMs ?? PROVIDER_DEADLINE_MS),
  })
  if (fixtureMode === 'record') {
    await recordProviderFixture(url, response)
  }
  return response
}
