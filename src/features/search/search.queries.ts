import {
  infiniteQueryOptions,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query'
import { makeSearchRepo, useSearchRepo } from './search.repo'
import type { SearchRepo } from './search.repo'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { EyepiecePageSearchParams } from '@/lib/eyepiece-api-client/types'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import { flattenAssetsSelector } from '@/lib/eyepiece-api-client/client'

type SearchCacheKey = ['search', EyepiecePageSearchParams]

function searchCacheKey(params: EyepiecePageSearchParams): SearchCacheKey {
  return ['search', params] as const
}

type SearchImagesFn = EyepieceClient['searchImages']
type SearchImagesPage = Awaited<ReturnType<SearchImagesFn>>
type SearchImagesInfinite = InfiniteData<SearchImagesPage, number>

export function getInfiniteSearchImagesOptions<
  TSelectData = SearchImagesInfinite,
>({
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
    queryFn: ({ queryKey, pageParam = 1 }) => {
      return repo.searchImages({ ...queryKey[1], page: pageParam })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    staleTime: 1000 * 60 * 5,
    select,
  })
}

export function useSuspenseInfiniteSearch(params: EyepiecePageSearchParams) {
  const repo = useSearchRepo()
  return useSuspenseInfiniteQuery(
    getInfiniteSearchImagesOptions({
      repo,
      params,
      select: flattenAssetsSelector,
    }),
  )
}

export function prefetchInfiniteSearch({
  eyepieceClient,
  queryClient,
  searchParams,
}: {
  eyepieceClient: EyepieceClient
  queryClient: QueryClient
  searchParams: EyepiecePageSearchParams
}) {
  const searchRepo = makeSearchRepo(eyepieceClient)
  return queryClient.prefetchInfiniteQuery(
    getInfiniteSearchImagesOptions({ repo: searchRepo, params: searchParams }),
  )
}
