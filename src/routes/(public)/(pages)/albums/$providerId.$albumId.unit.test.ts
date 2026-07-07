import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return Object.assign({}, actual as object, {
    createFileRoute: () => (config: unknown) => config,
  })
})

const mockEnsureInfiniteAlbum = vi.fn()
vi.mock('@/features/albums/albums.queries', () => ({
  ensureInfiniteAlbum: mockEnsureInfiniteAlbum,
}))

vi.mock('./-components/album-assets', () => ({
  AlbumAssets: () => createElement('div', null, 'album assets'),
}))

vi.mock('@/lib/utils', () => ({
  getTitleText: (title: string) => `Eyepiece | ${title}`,
}))

const { Route } = await import('./$providerId.$albumId')
const route = Route as any

afterEach(() => {
  cleanup()
})

describe('album page component', () => {
  beforeEach(() => {
    route.useRouteContext = vi.fn()
    route.useLoaderData = vi.fn()
    route.useRouteContext.mockReturnValue({
      albumKey: {
        providerId: NASA_IVL_PROVIDER_ID,
        externalId: 'GSFC_MASTERFILE_STS-107',
      },
    })
  })

  it('renders loader title in page heading', () => {
    route.useLoaderData.mockReturnValue({ title: 'Mission Highlights' })

    render(route.component())

    expect(
      screen.getByRole('heading', { name: 'Mission Highlights' }),
    ).toBeTruthy()
  })
})

describe('album page route', () => {
  beforeEach(() => {
    mockEnsureInfiniteAlbum.mockReset()
    mockEnsureInfiniteAlbum.mockResolvedValue({ pages: [] })
  })

  it('builds an albumKey from route params', () => {
    const result = route.beforeLoad({
      params: {
        providerId: NASA_IVL_PROVIDER_ID,
        albumId: 'GSFC_MASTERFILE_STS-107',
      },
    })

    expect(result).toEqual({
      albumKey: {
        providerId: NASA_IVL_PROVIDER_ID,
        externalId: 'GSFC_MASTERFILE_STS-107',
      },
    })
  })

  it('rejects invalid album route params', () => {
    expect(() =>
      route.beforeLoad({
        params: { providerId: 'bad_provider', albumId: 'abc' },
      }),
    ).toThrow()
  })

  it('prefetches album assets using loader context', async () => {
    const eyepieceClient = { request: vi.fn() }
    const queryClient = { prefetchInfiniteQuery: vi.fn() }
    const albumKey = {
      providerId: SI_OA_PROVIDER_ID,
      externalId: 'sioa-collection-42',
    }

    const result = await route.loader({
      context: { eyepieceClient, queryClient, albumKey },
    })

    expect(mockEnsureInfiniteAlbum).toHaveBeenCalledWith({
      eyepieceClient,
      queryClient,
      albumKey,
    })
    expect(result).toEqual({ title: 'sioa-collection-42' })
  })

  it('loader falls back to album external id when collection title is missing', async () => {
    const result = await route.loader({
      context: {
        eyepieceClient: { request: vi.fn() },
        queryClient: { prefetchInfiniteQuery: vi.fn() },
        albumKey: {
          providerId: NASA_IVL_PROVIDER_ID,
          externalId: 'GSFC_MASTERFILE_STS-107',
        },
      },
    })

    expect(result).toEqual({ title: 'GSFC_MASTERFILE_STS-107' })
  })

  it('uses loader title for document metadata and falls back when missing', () => {
    const withTitle = route.head({
      loaderData: { title: 'Mission Highlights' },
    })
    const fallback = route.head({ loaderData: undefined })

    expect(withTitle.meta).toEqual([
      { title: 'Eyepiece | Mission Highlights Media' },
    ])

    expect(fallback.meta).toEqual([{ title: 'Eyepiece | Album Media' }])
  })

  it('loader prefers collection title when available', async () => {
    mockEnsureInfiniteAlbum.mockResolvedValue({
      pages: [{ collection: { title: 'Mission Highlights' } }],
    })

    const result = await route.loader({
      context: {
        eyepieceClient: { request: vi.fn() },
        queryClient: { prefetchInfiniteQuery: vi.fn() },
        albumKey: {
          providerId: NASA_IVL_PROVIDER_ID,
          externalId: 'GSFC_MASTERFILE_STS-107',
        },
      },
    })

    expect(result).toEqual({ title: 'Mission Highlights' })
  })
})
