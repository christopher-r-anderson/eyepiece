// generous against real provider tails (11s NASA responses succeed) while
// staying inside the platform's function ceiling, so a hung connection
// surfaces as a structured provider error instead of a platform 502
const PROVIDER_DEADLINE_MS = 25_000

export function providerFetch(url: string) {
  return fetch(url, { signal: AbortSignal.timeout(PROVIDER_DEADLINE_MS) })
}
