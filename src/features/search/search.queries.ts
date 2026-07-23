import { useMemo } from 'react'
import {
  infiniteQueryOptions,
  useInfiniteQuery,
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

function flattenSearchSelector(data: SearchImagesInfinite) {
  return {
    ...flattenAssetsSelector(data),
    total: data.pages[0].pagination.total,
  }
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
      select: flattenSearchSelector,
    }),
  )
}

// non-suspending read of the same query the results panel renders; the
// shared key means this never adds a request
export function useSearchTotal(query: SearchQuery, filters: SearchFilters) {
  const repo = useSearchRepo()
  const { data } = useInfiniteQuery({
    ...getInfiniteSearchImagesOptions({
      repo,
      query,
      filters,
      select: flattenSearchSelector,
    }),
  })
  return data?.total
}

export const ALL_SCOPE_SECTION_SIZE = 6

// A select over the same query the scoped tab uses; the key must stay
// identical so "See all" renders from cache (see the key-parity test).
// Reads the first page only, so n must stay <= DEFAULT_PAGE_SIZE.
export function makeTopNSearchSelector(n: number) {
  return (data: SearchImagesInfinite) => {
    const firstPage = data.pages[0]
    return {
      items: firstPage.items.slice(0, n),
      total: firstPage.pagination.total,
    }
  }
}

export function useSuspenseSearchSection(
  query: SearchQuery,
  filters: SearchFilters,
  n: number = ALL_SCOPE_SECTION_SIZE,
) {
  const repo = useSearchRepo()
  const select = useMemo(() => makeTopNSearchSelector(n), [n])
  return useSuspenseInfiniteQuery(
    getInfiniteSearchImagesOptions({ repo, query, filters, select }),
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
