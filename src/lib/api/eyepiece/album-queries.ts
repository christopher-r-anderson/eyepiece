import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import { flattenAssetsSelector } from './client'
import type { EyepieceClient } from './client'
import type { InfiniteData } from '@tanstack/react-query'
import type { AlbumKey, AlbumKeyString } from '@/domain/album/album.schemas'
import { toAlbumKeyString } from '@/domain/album/album.util'

type AlbumCacheKey = ['albums', AlbumKeyString]

function albumCacheKey(albumKey: AlbumKey): AlbumCacheKey {
  return ['albums', toAlbumKeyString(albumKey)] as const
}

type GetAlbumFn = EyepieceClient['getAlbum']
type AlbumPage = Awaited<ReturnType<GetAlbumFn>>
type AlbumInfinite = InfiniteData<AlbumPage, number>

export function getAlbumOptions<TSelectData = AlbumInfinite>(
  client: EyepieceClient,
  albumKey: AlbumKey,
  select?: (data: AlbumInfinite) => TSelectData,
) {
  return infiniteQueryOptions({
    queryKey: albumCacheKey(albumKey),
    queryFn: ({ pageParam = 1 }) => {
      return client.getAlbum(albumKey, { page: pageParam })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    select,
  })
}

export function useAlbumAssets(client: EyepieceClient, albumKey: AlbumKey) {
  return useInfiniteQuery(
    getAlbumOptions(client, albumKey, flattenAssetsSelector),
  )
}
