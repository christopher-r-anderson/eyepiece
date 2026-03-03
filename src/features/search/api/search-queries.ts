import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import type { EyepiecePageSearchParams } from '@/lib/eyepiece-api-client/types'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import type { SearchRepo } from '../search-repo'
import { flattenAssetsSelector } from '@/lib/eyepiece-api-client/client'

type SearchCacheKey = ['search', EyepiecePageSearchParams]

function searchCacheKey(params: EyepiecePageSearchParams): SearchCacheKey {
  return ['search', params] as const
}

type SearchImagesFn = EyepieceClient['searchImages']
type SearchImagesPage = Awaited<ReturnType<SearchImagesFn>>
type SearchImagesInfinite = InfiniteData<SearchImagesPage, number>

export function searchImagesOptions<TSelectData = SearchImagesInfinite>({
  repo,
  params,
  select,
}: {
  repo: SearchRepo
  params: EyepiecePageSearchParams
  select?: (data: SearchImagesInfinite) => TSelectData
}) {
  return infiniteQueryOptions({
    queryKey: searchCacheKey(params),
    queryFn: ({ queryKey, pageParam = 1 }) =>
      repo.searchImages({ ...queryKey[1], page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    staleTime: 1000 * 60 * 5,
    select,
  })
}

export function useSearchResults(
  repo: SearchRepo,
  params: EyepiecePageSearchParams,
) {
  return useInfiniteQuery(
    searchImagesOptions({ repo, params, select: flattenAssetsSelector }),
  )
}
