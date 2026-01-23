import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import { flattenAssetsSelector } from './client'
import type { EyepieceClient } from './client'
import type { InfiniteData } from '@tanstack/react-query'

type AlbumCacheKey = ['albums', string]

type GetAlbumFn = EyepieceClient['getAlbum']
type AlbumPage = Awaited<ReturnType<GetAlbumFn>>
type AlbumInfinite = InfiniteData<AlbumPage, number>

export function getAlbumOptions<TSelectData = AlbumInfinite>(
  client: EyepieceClient,
  id: string,
  select?: (data: AlbumInfinite) => TSelectData,
) {
  return infiniteQueryOptions({
    queryKey: ['albums', id] as const satisfies AlbumCacheKey,
    queryFn: ({ queryKey, pageParam = 1 }) => {
      return client.getAlbum(queryKey[1], { page: pageParam })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    select,
  })
}

export function useAlbumAssets(client: EyepieceClient, id: string) {
  return useInfiniteQuery(getAlbumOptions(client, id, flattenAssetsSelector))
}
