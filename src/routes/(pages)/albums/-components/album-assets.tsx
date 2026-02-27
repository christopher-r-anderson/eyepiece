import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { AlbumKey } from '@/domain/album/album.schemas'
import { paramsToUiResetKey } from '@/features/listing/infinite-loader/util'
import { InfiniteLoader } from '@/features/listing/infinite-loader/infinite-loader'
import {
  HybridGrid,
  ItemGridSkeleton,
} from '@/features/listing/item-grid/hybrid-grid'
import {
  AssetTile,
  AssetTileSkeleton,
} from '@/features/assets/components/asset-tile'
import { useAlbumAssets } from '@/features/albums/api/album.queries'
import { HybridGridItem } from '@/features/listing/item-grid/hybrid-grid-item'
import { useEyepieceClient } from '@/lib/api/eyepiece/eyepiece-client-provider'

export interface AlbumAssetsProps {
  albumKey: AlbumKey
}

export function AlbumAssets({ albumKey }: AlbumAssetsProps) {
  const client = useEyepieceClient()
  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAlbumAssets(client, albumKey)
  const navigate = useNavigate()

  const uiResetKey = useMemo(() => paramsToUiResetKey({ albumKey }), [albumKey])

  if (isPending) {
    return <ItemGridSkeleton>{() => <AssetTileSkeleton />}</ItemGridSkeleton>
  }

  if (isError) {
    return (
      <div>
        <p>Error loading album assets</p>
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
              navigate({
                to: `/assets/$assetId`,
                params: { assetId: item.externalId },
              })
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
