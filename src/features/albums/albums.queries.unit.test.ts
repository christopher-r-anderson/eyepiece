import { describe, expect, it, vi } from 'vitest'
import { flattenAlbumSelector, getInfiniteAlbumOptions } from './albums.queries'
import type { AlbumsRepo } from './albums.repo'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { DEFAULT_PAGE_SIZE } from '@/domain/pagination/pagination.schema'

const albumKey = {
  providerId: NASA_IVL_PROVIDER_ID,
  externalId: 'GSFC_MASTERFILE_STS-107',
} as const

const emptyPage = { items: [], pagination: { next: null, total: 0 } }

describe('getInfiniteAlbumOptions', () => {
  it('requests page 1 by default with the configured page size', async () => {
    const getAlbum = vi.fn().mockResolvedValue(emptyPage)
    const repo: Pick<AlbumsRepo, 'getAlbum'> = { getAlbum }

    const options = getInfiniteAlbumOptions({ repo, albumKey })
    await (options.queryFn as any)({})

    expect(getAlbum).toHaveBeenCalledWith(albumKey, {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  })

  it('forwards the pageParam to the repo for subsequent pages', async () => {
    const getAlbum = vi.fn().mockResolvedValue(emptyPage)
    const repo: Pick<AlbumsRepo, 'getAlbum'> = { getAlbum }

    const options = getInfiniteAlbumOptions({ repo, albumKey })
    await (options.queryFn as any)({ pageParam: 4 })

    expect(getAlbum).toHaveBeenCalledWith(albumKey, {
      page: 4,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  })

  it('returns pagination.next as the next page cursor', () => {
    const repo: Pick<AlbumsRepo, 'getAlbum'> = { getAlbum: vi.fn() as any }
    const options = getInfiniteAlbumOptions({ repo, albumKey })

    const next = (options.getNextPageParam as any)({
      pagination: { next: 3, total: 72 },
    })

    expect(next).toBe(3)
  })

  it('returns null next page cursor on the last page', () => {
    const repo: Pick<AlbumsRepo, 'getAlbum'> = { getAlbum: vi.fn() as any }
    const options = getInfiniteAlbumOptions({ repo, albumKey })

    const next = (options.getNextPageParam as any)({
      pagination: { next: null, total: 48 },
    })

    expect(next).toBeNull()
  })

  it('scopes the query key to the album key', () => {
    const repo: Pick<AlbumsRepo, 'getAlbum'> = { getAlbum: vi.fn() as any }

    const options = getInfiniteAlbumOptions({ repo, albumKey })

    expect(options.queryKey).toEqual(['albums', albumKey])
  })

  it('two different album keys produce distinct query keys', () => {
    const repo: Pick<AlbumsRepo, 'getAlbum'> = { getAlbum: vi.fn() as any }
    const otherAlbumKey = {
      providerId: NASA_IVL_PROVIDER_ID,
      externalId: 'OTHER_ALBUM',
    } as const

    const opts1 = getInfiniteAlbumOptions({ repo, albumKey })
    const opts2 = getInfiniteAlbumOptions({ repo, albumKey: otherAlbumKey })

    expect(opts1.queryKey).not.toEqual(opts2.queryKey)
  })

  it('wires a custom select transform when provided', () => {
    const repo: Pick<AlbumsRepo, 'getAlbum'> = { getAlbum: vi.fn() as any }
    const select = vi.fn()

    const options = getInfiniteAlbumOptions({ repo, albumKey, select })

    expect(options.select).toBe(select)
  })
})

describe('flattenAlbumSelector', () => {
  it('keeps collection metadata from the first page while flattening items', () => {
    const selected = flattenAlbumSelector({
      pages: [
        {
          items: [
            {
              key: { providerId: NASA_IVL_PROVIDER_ID, externalId: 'a1' },
              title: 'A',
            },
          ],
          pagination: { next: 2, total: 2 },
          collection: { title: 'Album Title' },
        },
        {
          items: [
            {
              key: { providerId: NASA_IVL_PROVIDER_ID, externalId: 'a2' },
              title: 'B',
            },
          ],
          pagination: { next: null, total: 2 },
          collection: { title: 'Should not replace first page title' },
        },
      ],
      pageParams: [1, 2],
    } as any)

    expect(selected.items).toHaveLength(2)
    expect(selected.collection).toEqual({ title: 'Album Title' })
  })
})
