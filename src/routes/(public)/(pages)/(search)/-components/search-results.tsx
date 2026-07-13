import { useMemo } from 'react'
import { hashKey } from '@tanstack/react-query'
import { AssetResultsGrid } from './asset-results-grid'
import type { SearchFilters, SearchQuery } from '@/domain/search/search.schema'
import { useSuspenseInfiniteSearch } from '@/features/search/search.queries'
import { InfiniteLoader } from '@/features/listing/infinite-loader/components/infinite-loader'

interface SearchResultsProps {
  query: SearchQuery
  filters: SearchFilters
}

export function SearchResults({ query, filters }: SearchResultsProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteSearch(query, filters)

  const uiResetKey = useMemo(
    () => hashKey(['search-results', query, filters]),
    [query, filters],
  )

  if (data.items.length === 0) {
    return <p>No results found.</p>
  }

  return (
    <InfiniteLoader
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      loadedCount={data.items.length}
      uiResetKey={uiResetKey}
      css={{ width: '100%' }}
    >
      <AssetResultsGrid items={data.items} />
    </InfiniteLoader>
  )
}
