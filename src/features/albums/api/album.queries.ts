import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import type { AlbumKey, AlbumKeyString } from '@/domain/album/album.schemas'
import type { AlbumsRepo } from '../albums-repo'
import { flattenAssetsSelector } from '@/lib/eyepiece-api-client/client'
import { toAlbumKeyString } from '@/domain/album/album.util'

type AlbumCacheKey = ['albums', AlbumKeyString]

function albumCacheKey(albumKey: AlbumKey): AlbumCacheKey {
  return ['albums', toAlbumKeyString(albumKey)] as const
}

type GetAlbumFn = AlbumsRepo['getAlbum']
type AlbumPage = Awaited<ReturnType<GetAlbumFn>>
type AlbumInfinite = InfiniteData<AlbumPage, number>

export function getAlbumOptions<TSelectData = AlbumInfinite>({
  repo,
  albumKey,
  select,
}: {
  repo: Pick<AlbumsRepo, 'getAlbum'>
  albumKey: AlbumKey
  select?: (data: AlbumInfinite) => TSelectData
}) {
  return infiniteQueryOptions({
    queryKey: albumCacheKey(albumKey),
    queryFn: ({ pageParam = 1 }) => {
      return repo.getAlbum(albumKey, { page: pageParam })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    select,
  })
}

export function useAlbumAssets({
  repo,
  albumKey,
}: {
  repo: Pick<AlbumsRepo, 'getAlbum'>
  albumKey: AlbumKey
}) {
  return useInfiniteQuery(
    getAlbumOptions({ repo, albumKey, select: flattenAssetsSelector }),
  )
}
