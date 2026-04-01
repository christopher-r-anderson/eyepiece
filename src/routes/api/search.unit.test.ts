import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
}))

vi.mock('@/server/lib/middleware', () => ({
  buildUrlSearchParamsMiddleware: vi.fn(() => 'middleware-stub'),
}))

const mockService = {
  searchAssets: vi.fn(),
  getAlbum: vi.fn(),
  getAsset: vi.fn(),
  getMetadata: vi.fn(),
}

vi.mock('@/server/eyepiece/service', () => ({
  makeEyepieceProviderService: () => mockService,
}))

// ---------------------------------------------------------------------------
// Import the route config AFTER mocks are in place.
// createFileRoute is mocked to return its argument directly so Route is the
// raw config object, giving us access to server.handlers.GET.
// ---------------------------------------------------------------------------

const { Route } = await import('./search')
const handler = (Route as any).server.handlers.GET

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(searchParams: Record<string, unknown>) {
  return { searchParams }
}

const validNasaParams = {
  q: 'apollo',
  page: 1,
  pageSize: 24,
  providerId: NASA_IVL_PROVIDER_ID,
  mediaType: 'image',
}

const validSioaParams = {
  q: 'moon landing',
  page: 1,
  pageSize: 24,
  providerId: SI_OA_PROVIDER_ID,
}

const emptyPage = { items: [], pagination: { next: null, total: 0 } }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/search handler', () => {
  beforeEach(() => {
    mockService.searchAssets.mockReset()
    mockService.searchAssets.mockResolvedValue(emptyPage)
  })

  it('calls searchAssets with the parsed query, filters, and pagination', async () => {
    await handler({ context: makeContext(validNasaParams) })

    expect(mockService.searchAssets).toHaveBeenCalledWith(
      'apollo',
      { providerId: NASA_IVL_PROVIDER_ID, filters: { mediaType: 'image' } },
      { page: 1, pageSize: 24 },
    )
  })

  it('returns a JSON response with the search results', async () => {
    const results = {
      items: [{ title: 'Apollo 11' }],
      pagination: { next: null, total: 1 },
    }
    mockService.searchAssets.mockResolvedValue(results)

    const response = await handler({ context: makeContext(validNasaParams) })
    const body = await response.json()

    expect(body).toEqual(results)
  })

  it('routes SI-OA searches to the service with si_oa provider filters', async () => {
    await handler({ context: makeContext(validSioaParams) })

    expect(mockService.searchAssets).toHaveBeenCalledWith(
      'moon landing',
      expect.objectContaining({ providerId: SI_OA_PROVIDER_ID }),
      expect.objectContaining({ page: 1 }),
    )
  })

  it('throws a 400 response when the search query is missing', async () => {
    const { q: _omit, ...withoutQ } = validNasaParams

    await expect(
      handler({ context: makeContext(withoutQ) }),
    ).rejects.toMatchObject({
      name: 'ZodError',
    })
  })

  it('throws a 400 response when the providerId is invalid', async () => {
    const params = { ...validNasaParams, providerId: 'not_a_provider' }

    await expect(
      handler({ context: makeContext(params) }),
    ).rejects.toMatchObject({
      name: 'ZodError',
    })
  })
})
