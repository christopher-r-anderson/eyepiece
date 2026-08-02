import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Err, Ok } from '@/lib/result'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
}))

vi.mock('@/server/lib/middleware', () => ({
  buildPublicApiCacheMiddleware: vi.fn(() => 'public-cache-middleware-stub'),
}))

vi.mock('@/integrations/supabase/public', () => ({
  createPublicSupabaseClient: vi.fn(() => ({})),
}))

const mockListPublicCollectionIds = vi.fn()
vi.mock('@/features/collections/collections.repo', () => ({
  makeCollectionsRepo: () => ({
    listPublicCollectionIds: mockListPublicCollectionIds,
  }),
}))

vi.mock('@/features/home/home.curation', () => ({
  FEATURED_ALBUMS: [
    {
      albumKey: { providerId: 'nasa_ivl', externalId: 'Apollo-at-50' },
      title: 'Apollo, at fifty',
    },
    {
      albumKey: { providerId: 'nasa_ivl', externalId: 'Q&A_<session>' },
      title: 'escaping probe',
    },
  ],
}))

vi.mock('@/lib/utils', () => ({
  getOrigin: () => 'https://example.test',
}))

const { Route } = await import('./sitemap[.]xml')

const routeConfig = Route as unknown as {
  server: { handlers: { GET: () => Promise<Response> } }
}
const get = () => routeConfig.server.handlers.GET()

describe('sitemap route', () => {
  beforeEach(() => {
    mockListPublicCollectionIds.mockResolvedValue(
      Ok([
        '21c33a8c-f642-410a-9188-11054399140f',
        'eef5ca48-ba1f-44f0-85e8-5c8d0d6755dd',
      ]),
    )
  })

  it('lists the homepage, curated albums, and public collections', async () => {
    const response = await get()

    expect(response.headers.get('content-type')).toBe('application/xml')
    const body = await response.text()
    expect(body).toContain('<loc>https://example.test/</loc>')
    expect(body).toContain(
      '<loc>https://example.test/albums/nasa_ivl/Apollo-at-50</loc>',
    )
    expect(body).toContain(
      '<loc>https://example.test/collections/21c33a8c-f642-410a-9188-11054399140f</loc>',
    )
    expect(body).toContain(
      '<loc>https://example.test/collections/eef5ca48-ba1f-44f0-85e8-5c8d0d6755dd</loc>',
    )
  })

  it('percent-encodes album path segments', async () => {
    const body = await (await get()).text()

    expect(body).toContain(
      '<loc>https://example.test/albums/nasa_ivl/Q%26A_%3Csession%3E</loc>',
    )
    expect(body).not.toContain('Q&A_<session>')
  })

  it('throws when the collection lookup fails', async () => {
    mockListPublicCollectionIds.mockResolvedValue(Err({ message: 'boom' }))

    await expect(get()).rejects.toThrow()
  })
})
