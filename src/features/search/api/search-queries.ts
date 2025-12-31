import { searchImages, flattenAssetsSelector } from '@/lib/api/eyepiece/client'
import { EyepiecePageSearchParams } from '@/lib/api/eyepiece/types'
import {
  InfiniteData,
  infiniteQueryOptions,
  useInfiniteQuery,
} from '@tanstack/react-query'

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
