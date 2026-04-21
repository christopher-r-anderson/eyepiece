import { vi } from 'vitest'

export function stubFetchJsonOnce({
  ok = true,
  status = ok ? 200 : 500,
  statusText = 'OK',
  json,
}: {
  ok?: boolean
  status?: number
  statusText?: string
  json: unknown
}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(json),
  })
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)
  return fetchMock
}
