import { beforeEach, describe, expect, it, vi } from 'vitest'
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

vi.mock('@/lib/utils', () => ({
  getTitleText: (title: string) => `Eyepiece | ${title}`,
}))

const { Route } = await import('./$providerId.$albumId')
const route = Route as any

describe('album page route', () => {
  beforeEach(() => {
    mockEnsureInfiniteAlbum.mockReset()
    mockEnsureInfiniteAlbum.mockResolvedValue(undefined)
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

    await route.loader({
      context: { eyepieceClient, queryClient, albumKey },
    })

    expect(mockEnsureInfiniteAlbum).toHaveBeenCalledWith({
      eyepieceClient,
      queryClient,
      albumKey,
    })
  })

  it('derives head title from albumKey external id', () => {
    const head = route.head({
      match: {
        context: {
          albumKey: {
            providerId: NASA_IVL_PROVIDER_ID,
            externalId: 'GSFC_MASTERFILE_STS-107',
          },
        },
      },
    })

    expect(head.meta).toEqual([
      { title: 'Eyepiece | GSFC_MASTERFILE_STS-107 Media' },
    ])
  })
})
