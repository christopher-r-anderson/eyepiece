import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as MiddlewareModule from '@/server/lib/middleware'
import { AppException } from '@/lib/result'
import { operationalErrorObservability } from '@/lib/error-observability'
import { paginationSchema } from '@/domain/pagination/pagination.schema'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
  isRedirect: () => false,
  isNotFound: () => false,
  notFound: vi.fn(),
}))

vi.mock('@tanstack/react-start', () => ({
  createMiddleware: () => ({
    server: (handler: unknown) => handler,
  }),
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

const { buildUrlSearchParamsMiddleware } = await vi.importActual<
  typeof MiddlewareModule
>('@/server/lib/middleware')

const { Route, searchFiltersParamsSchema, searchQueryParamSchema } =
  await import('./search')
const handler = (Route as any).server.handlers.GET
const searchParamsMiddleware = buildUrlSearchParamsMiddleware(
  searchQueryParamSchema.and(paginationSchema).and(searchFiltersParamsSchema),
) as any

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

async function expectBadRequest(
  request: Promise<unknown>,
  expectedBody: unknown,
) {
  try {
    const response = (await request) as Response

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual(expectedBody)
  } catch (error) {
    const response = error as Response

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual(expectedBody)
  }
}

const nasaSearchResults = {
  items: [
    {
      key: { providerId: NASA_IVL_PROVIDER_ID, externalId: 'PIA24439' },
      title: 'Apollo Footprint',
      description:
        'Buzz Aldrin took this iconic image of a bootprint on the Moon.',
      thumbnail: {
        href: 'https://images-assets.nasa.gov/image/PIA24439/PIA24439~thumb.jpg',
        width: 640,
        height: 626,
      },
      image: {
        href: 'https://images-assets.nasa.gov/image/PIA24439/PIA24439~large.jpg',
        width: 1920,
        height: 1880,
      },
      original: {
        href: 'https://images-assets.nasa.gov/image/PIA24439/PIA24439~orig.jpg',
        width: 3294,
        height: 3226,
      },
      albums: [
        { providerId: NASA_IVL_PROVIDER_ID, externalId: 'Apollo-at-50' },
      ],
    },
  ],
  pagination: { next: 2, total: 6130 },
}

const sioaSearchResults = {
  items: [
    {
      key: {
        providerId: SI_OA_PROVIDER_ID,
        externalId: 'ld1-1643400021979-1643400027050-0',
      },
      title: 'Command and Service Modules, Apollo #105, ASTP Mockup',
      description: 'Command and Service Modules, Apollo #105, ASTP Mockup',
      thumbnail: {
        href: 'https://ids.si.edu/ids/download?id=NASM-A19740798000-NASM2018-10165_thumb',
        width: 640,
        height: 480,
      },
      image: {
        href: 'https://ids.si.edu/ids/download?id=NASM-A19740798000-NASM2018-10165_screen',
        width: 640,
        height: 480,
      },
      original: {
        href: 'https://ids.si.edu/ids/download?id=NASM-A19740798000-NASM2018-10165.jpg',
        width: 6575,
        height: 5260,
      },
      mediaType: 'image',
    },
  ],
  pagination: { next: 2, total: 37 },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/v1/search handler', () => {
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

  it('returns provider-specific NASA search results as JSON', async () => {
    mockService.searchAssets.mockResolvedValue(nasaSearchResults)

    const response = await handler({ context: makeContext(validNasaParams) })
    const body = await response.json()

    expect(mockService.searchAssets).toHaveBeenCalledWith(
      'apollo',
      { providerId: NASA_IVL_PROVIDER_ID, filters: { mediaType: 'image' } },
      { page: 1, pageSize: 24 },
    )
    expect(body).toEqual(nasaSearchResults)
  })

  it('returns provider-specific Smithsonian search results as JSON', async () => {
    mockService.searchAssets.mockResolvedValue(sioaSearchResults)

    const response = await handler({ context: makeContext(validSioaParams) })
    const body = await response.json()

    expect(mockService.searchAssets).toHaveBeenCalledWith(
      'moon landing',
      { providerId: SI_OA_PROVIDER_ID, filters: {} },
      { page: 1, pageSize: 24 },
    )
    expect(body).toEqual(sioaSearchResults)
  })

  it('routes SI-OA searches to the service with si_oa provider filters', async () => {
    await handler({ context: makeContext(validSioaParams) })

    expect(mockService.searchAssets).toHaveBeenCalledWith(
      'moon landing',
      expect.objectContaining({ providerId: SI_OA_PROVIDER_ID }),
      expect.objectContaining({ page: 1 }),
    )
  })

  it('returns a 400 response from middleware when the search query is missing', async () => {
    await expectBadRequest(
      searchParamsMiddleware({
        request: new Request(
          'https://example.com/api/v1/search?providerId=nasa_ivl&page=1&pageSize=24&mediaType=image',
        ),
        next: vi.fn(),
      }),
      {
        error: {
          code: 'INVALID_QUERY_PARAMS',
          message: 'One or more query parameters are invalid.',
          issues: [
            {
              code: 'invalid_type',
              message: 'Invalid input: expected string, received undefined',
              path: 'q',
            },
          ],
        },
      },
    )
  })

  it('returns a 400 response from middleware when the providerId is invalid', async () => {
    const next = vi.fn()

    await expectBadRequest(
      searchParamsMiddleware({
        request: new Request(
          'https://example.com/api/v1/search?q=apollo&providerId=not_a_provider&page=1&pageSize=24&mediaType=image',
        ),
        next,
      }),
      {
        error: {
          code: 'INVALID_QUERY_PARAMS',
          message: 'One or more query parameters are invalid.',
          issues: [
            {
              code: 'invalid_union',
              message: 'Invalid input',
              path: 'providerId',
            },
          ],
        },
      },
    )

    expect(next).not.toHaveBeenCalled()
  })

  it('rethrows handled provider failures with route context', async () => {
    mockService.searchAssets.mockRejectedValue(
      new AppException({
        message: 'Provider failed',
        observability: operationalErrorObservability({
          tags: {
            feature: 'providers',
            operation: 'search.fetch',
            'provider.id': NASA_IVL_PROVIDER_ID,
          },
        }),
      }),
    )

    await expect(
      handler({ context: makeContext(validNasaParams) }),
    ).rejects.toMatchObject({
      appError: {
        observability: {
          tags: {
            feature: 'providers',
            operation: 'search.fetch',
            'provider.id': NASA_IVL_PROVIDER_ID,
            'api.route': '/api/v1/search',
            'http.method': 'GET',
          },
        },
      },
    })
  })
})
