import { useMemo } from 'react'
import { hashKey } from '@tanstack/react-query'
import { css } from 'styled-system/css'
import { FavoriteButton } from '../../-components/favorite-button'
import type { AlbumKey } from '@/domain/album/album.schema'
import type { Asset } from '@/domain/asset/asset.schema'
import { InfiniteLoader } from '@/components/infinite-loader/infinite-loader'
import { JustifiedAssetGrid } from '@/features/assets/components/justified-asset-grid'
import { useSuspenseInfiniteAlbumAssets } from '@/features/albums/albums.queries'

export interface AlbumAssetsProps {
  albumKey: AlbumKey
}

// module-level so memoized grid rows see stable references
const renderTileActions = (item: Asset) => (
  <FavoriteButton assetKey={item.key} />
)

export function AlbumAssets({ albumKey }: AlbumAssetsProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteAlbumAssets(albumKey)

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
      className={css({ width: '100%' })}
    >
      <JustifiedAssetGrid items={data.items} tileActions={renderTileActions} />
    </InfiniteLoader>
  )
}
