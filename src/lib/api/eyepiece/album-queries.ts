import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import { flattenAssetsSelector, getAlbum } from './client'
import type { InfiniteData } from '@tanstack/react-query'

type AlbumCacheKey = ['albums', string]

export function getAlbumOptions<
  TSelectData = InfiniteData<Awaited<ReturnType<typeof getAlbum>>, number>,
>(
  id: string,
  select?: (
    data: InfiniteData<Awaited<ReturnType<typeof getAlbum>>, number>,
  ) => TSelectData,
) {
  return infiniteQueryOptions({
    queryKey: ['albums', id] as AlbumCacheKey,
    queryFn: ({ queryKey, pageParam = 1 }) => {
      return getAlbum(queryKey[1], { page: pageParam })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    select,
  })
}

export function useAlbumAssets(id: string) {
  return useInfiniteQuery(getAlbumOptions(id, flattenAssetsSelector))
}
