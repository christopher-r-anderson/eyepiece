import { vi } from 'vitest'

export function stubFetchJsonOnce({
  ok = true,
  statusText = 'OK',
  json,
}: {
  ok?: boolean
  statusText?: string
  json: unknown
}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    statusText,
    json: vi.fn().mockResolvedValue(json),
  })
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)
  return fetchMock
}
