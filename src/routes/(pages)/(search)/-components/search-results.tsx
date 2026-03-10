import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FavoriteButton } from '../../-components/favorite-button'
import type { EyepiecePageSearchParams } from '@/lib/eyepiece-api-client/types'
import { useSuspenseInfiniteSearch } from '@/features/search/search.queries'
import { paramsToUiResetKey } from '@/features/listing/infinite-loader/components/infinite-loader.utils'
import { InfiniteLoader } from '@/features/listing/infinite-loader/components/infinite-loader'
import { AssetTile } from '@/features/assets/components/asset-tile'
import { HybridGrid } from '@/features/listing/item-grid/components/hybrid-grid'
import { HybridGridItem } from '@/features/listing/item-grid/components/hybrid-grid-item'
import { AlbumLinkList } from '@/features/albums/components/album-link-list'

interface SearchResultsProps {
  searchParams: EyepiecePageSearchParams
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const navigate = useNavigate()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteSearch(searchParams)

  const uiResetKey = useMemo(
    () => paramsToUiResetKey(searchParams),
    [searchParams],
  )

  return (
    <InfiniteLoader
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      loadedCount={data.assets.length}
      uiResetKey={uiResetKey}
      css={{ width: '100%' }}
    >
      <HybridGrid css={{ width: '100%' }} items={data.assets}>
        {(item, itemProps) => (
          <HybridGridItem
            item={item}
            onRowAction={() => {
              navigate({
                to: `/assets/$assetId`,
                params: { assetId: item.externalId },
              })
            }}
            {...itemProps}
          >
            <AssetTile
              asset={item}
              relatedLinks={
                item.albums ? <AlbumLinkList albums={item.albums} /> : undefined
              }
              actions={<FavoriteButton assetKey={item} />}
            />
          </HybridGridItem>
        )}
      </HybridGrid>
    </InfiniteLoader>
  )
}
