import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import type { EyepiecePageSearchParams } from '@/lib/eyepiece-api-client/types'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import { flattenAssetsSelector } from '@/lib/eyepiece-api-client/client'

type SearchCacheKey = ['search', EyepiecePageSearchParams]

type SearchImagesFn = EyepieceClient['searchImages']
type SearchImagesPage = Awaited<ReturnType<SearchImagesFn>>
type SearchImagesInfinite = InfiniteData<SearchImagesPage, number>

export function searchImagesOptions<TSelectData = SearchImagesInfinite>(
  client: EyepieceClient,
  params: EyepiecePageSearchParams,
  select?: (data: SearchImagesInfinite) => TSelectData,
) {
  return infiniteQueryOptions({
    queryKey: ['search', params] as const satisfies SearchCacheKey,
    queryFn: ({ queryKey, pageParam = 1 }) =>
      client.searchImages({ ...queryKey[1], page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    staleTime: 1000 * 60 * 5,
    select,
  })
}

export function useSearchResults(
  client: EyepieceClient,
  params: EyepiecePageSearchParams,
) {
  return useInfiniteQuery(
    searchImagesOptions(client, params, flattenAssetsSelector),
  )
}
