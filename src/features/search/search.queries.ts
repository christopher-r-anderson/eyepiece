import {
  infiniteQueryOptions,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query'
import { makeSearchRepo, useSearchRepo } from './search.repo'
import type { SearchRepo } from './search.repo'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import type { PaginatedCollection } from '@/domain/pagination/pagination.schema'
import type { Asset } from '@/domain/asset/asset.schema'
import type { SearchFilters, SearchQuery } from '@/domain/search/search.schema'
import { flattenAssetsSelector } from '@/lib/eyepiece-api-client/client'
import { DEFAULT_PAGE_SIZE } from '@/domain/pagination/pagination.schema'

const searchKeys = {
  all: ['search'] as const,
  query: (query: SearchQuery, filters: SearchFilters) =>
    [...searchKeys.all, 'byQuery', query, filters] as const,
}

type SearchImagesPage = Promise<PaginatedCollection<Asset>>
type SearchImagesInfinite = InfiniteData<Awaited<SearchImagesPage>, number>

export function getInfiniteSearchImagesOptions<
  TSelectData = SearchImagesInfinite,
>({
  repo,
  query,
  filters,
  select,
}: {
  repo: SearchRepo
  query: SearchQuery
  filters: SearchFilters
  select?: (data: SearchImagesInfinite) => TSelectData
}) {
  return infiniteQueryOptions({
    queryKey: searchKeys.query(query, filters),
    queryFn: ({ pageParam = 1 }) => {
      return repo.searchImages(query, filters, {
        page: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    staleTime: 1000 * 60 * 5,
    select,
  })
}

export function useSuspenseInfiniteSearch(
  query: SearchQuery,
  filters: SearchFilters,
) {
  const repo = useSearchRepo()
  return useSuspenseInfiniteQuery(
    getInfiniteSearchImagesOptions({
      repo,
      query,
      filters,
      select: flattenAssetsSelector,
    }),
  )
}

export function prefetchInfiniteSearch({
  query,
  filters,
  eyepieceClient,
  queryClient,
}: {
  query: SearchQuery
  filters: SearchFilters
  eyepieceClient: EyepieceClient
  queryClient: QueryClient
}) {
  const searchRepo = makeSearchRepo(eyepieceClient)
  return queryClient.prefetchInfiniteQuery(
    getInfiniteSearchImagesOptions({
      repo: searchRepo,
      query,
      filters,
    }),
  )
}
