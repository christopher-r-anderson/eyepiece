import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { EyepiecePageSearchParams } from '@/lib/api/eyepiece/types'
import { useSearchResults } from '@/features/search/api/search-queries'
import { paramsToUiResetKey } from '@/features/listing/infinite-loader/util'
import { InfiniteLoader } from '@/features/listing/infinite-loader/infinite-loader'
import {
  AssetTile,
  AssetTileSkeleton,
} from '@/features/assets/components/asset-tile'
import {
  HybridGrid,
  ItemGridSkeleton,
} from '@/features/listing/item-grid/hybrid-grid'
import { HybridGridItem } from '@/features/listing/item-grid/hybrid-grid-item'
import { useEyepieceClient } from '@/lib/api/eyepiece/eyepiece-client-provider'

interface SearchResultsProps {
  searchParams: EyepiecePageSearchParams
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const navigate = useNavigate()
  const client = useEyepieceClient()
  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchResults(client, searchParams)

  const uiResetKey = useMemo(
    () => paramsToUiResetKey(searchParams),
    [searchParams],
  )

  if (isPending) {
    return <ItemGridSkeleton>{() => <AssetTileSkeleton />}</ItemGridSkeleton>
  }

  if (isError) {
    return (
      <div>
        <p>Error loading search results</p>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

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
              navigate({ to: `/assets/$assetId`, params: { assetId: item.id } })
            }}
            {...itemProps}
          >
            <AssetTile asset={item} />
          </HybridGridItem>
        )}
      </HybridGrid>
    </InfiniteLoader>
  )
}
