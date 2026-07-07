import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { FavoriteButton } from '../../-components/favorite-button'
import type { SearchFilters, SearchQuery } from '@/domain/search/search.schema'
import { useSuspenseInfiniteSearch } from '@/features/search/search.queries'
import { InfiniteLoader } from '@/features/listing/infinite-loader/components/infinite-loader'
import { AssetTile } from '@/features/assets/components/asset-tile'
import { HybridGrid } from '@/features/listing/item-grid/components/hybrid-grid'
import { HybridGridItem } from '@/features/listing/item-grid/components/hybrid-grid-item'
import { AlbumLinkList } from '@/features/albums/components/album-link-list'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

interface SearchResultsProps {
  query: SearchQuery
  filters: SearchFilters
}

export function SearchResults({ query, filters }: SearchResultsProps) {
  const navigate = useNavigate()

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
      <HybridGrid
        css={{ width: '100%' }}
        items={data.items}
        getItemKey={(item) => toAssetKeyString(item.key)}
        getItemTextValue={(item) => item.title}
      >
        {(item, itemProps) => (
          <HybridGridItem
            item={item}
            onRowAction={() => {
              navigate({
                to: `/assets/$providerId/$assetId`,
                params: {
                  providerId: item.key.providerId,
                  assetId: item.key.externalId,
                },
              })
            }}
            {...itemProps}
          >
            <AssetTile
              assetPreview={item}
              relatedLinks={
                item.albums ? <AlbumLinkList albums={item.albums} /> : undefined
              }
              actions={<FavoriteButton assetKey={item.key} />}
            />
          </HybridGridItem>
        )}
      </HybridGrid>
    </InfiniteLoader>
  )
}
