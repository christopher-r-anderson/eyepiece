import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import type { EyepiecePageSearchParams } from '@/lib/api/eyepiece/types'
import { flattenAssetsSelector, searchImages } from '@/lib/api/eyepiece/client'

type SearchCacheKey = ['search', EyepiecePageSearchParams]

export function searchImagesOptions<
  TSelectData = InfiniteData<Awaited<ReturnType<typeof searchImages>>, number>,
>(
  params: EyepiecePageSearchParams,
  select?: (
    data: InfiniteData<Awaited<ReturnType<typeof searchImages>>, number>,
  ) => TSelectData,
) {
  return infiniteQueryOptions({
    queryKey: ['search', params] as SearchCacheKey,
    queryFn: ({ queryKey, pageParam = 1 }) =>
      searchImages({ ...queryKey[1], page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    staleTime: 1000 * 60 * 5,
    select,
  })
}

export function useSearchResults(params: EyepiecePageSearchParams) {
  return useInfiniteQuery(searchImagesOptions(params, flattenAssetsSelector))
}
