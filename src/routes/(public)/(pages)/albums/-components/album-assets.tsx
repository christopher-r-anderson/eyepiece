import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { FavoriteButton } from '../../-components/favorite-button'
import type { AlbumKey } from '@/domain/album/album.schema'
import { InfiniteLoader } from '@/features/listing/infinite-loader/components/infinite-loader'
import { HybridGrid } from '@/features/listing/item-grid/components/hybrid-grid'
import { AssetTile } from '@/features/assets/components/asset-tile'
import { useSuspenseInfiniteAlbumAssets } from '@/features/albums/albums.queries'
import { HybridGridItem } from '@/features/listing/item-grid/components/hybrid-grid-item'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

export interface AlbumAssetsProps {
  albumKey: AlbumKey
}

export function AlbumAssets({ albumKey }: AlbumAssetsProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteAlbumAssets(albumKey)
  const navigate = useNavigate()

  const uiResetKey = useMemo(
    () => hashKey(['album-assets', albumKey]),
    [albumKey],
  )

  if (data.items.length === 0) {
    return <p>Album is empty.</p>
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
              actions={<FavoriteButton assetKey={item.key} />}
            />
          </HybridGridItem>
        )}
      </HybridGrid>
    </InfiniteLoader>
  )
}
