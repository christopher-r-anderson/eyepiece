import { useMemo } from 'react'
import { hashKey } from '@tanstack/react-query'
import { css } from 'styled-system/css'
import { AssetResultsGrid } from './asset-results-grid'
import { EmptyResultsNotice } from './empty-results-notice'
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
    return <EmptyResultsNotice query={query} providerId={filters.providerId} />
  }

  return (
    <InfiniteLoader
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      loadedCount={data.items.length}
      total={data.total}
      loadMoreVariant="text"
      uiResetKey={uiResetKey}
      className={css({ width: '100%' })}
    >
      <AssetResultsGrid items={data.items} />
    </InfiniteLoader>
  )
}
