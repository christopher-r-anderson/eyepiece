import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { AlbumKey } from '@/domain/album/album.schema'
import { paramsToUiResetKey } from '@/features/listing/infinite-loader/components/infinite-loader.utils'
import { InfiniteLoader } from '@/features/listing/infinite-loader/components/infinite-loader'
import { HybridGrid } from '@/features/listing/item-grid/components/hybrid-grid'
import { AssetTile } from '@/features/assets/components/asset-tile'
import { useSuspenseInfiniteAlbumAssets } from '@/features/albums/albums.queries'
import { HybridGridItem } from '@/features/listing/item-grid/components/hybrid-grid-item'

export interface AlbumAssetsProps {
  albumKey: AlbumKey
}

export function AlbumAssets({ albumKey }: AlbumAssetsProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteAlbumAssets(albumKey)
  const navigate = useNavigate()

  const uiResetKey = useMemo(() => paramsToUiResetKey({ albumKey }), [albumKey])

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
