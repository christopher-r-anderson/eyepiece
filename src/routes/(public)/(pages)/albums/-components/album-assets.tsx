import { useMemo } from 'react'
import { hashKey } from '@tanstack/react-query'
import { css } from 'styled-system/css'
import { FavoriteButton } from '../../-components/favorite-button'
import { useViewingAssetTileLinkProps } from '../../-components/asset-viewing-overlay'
import type { AlbumKey } from '@/domain/album/album.schema'
import type { Asset } from '@/domain/asset/asset.schema'
import { AddToCollectionButton } from '@/app/add-to-collection-button'
import { InfiniteLoader } from '@/components/infinite-loader/infinite-loader'
import { EmptyState } from '@/components/empty-state'
import { JustifiedAssetGrid } from '@/features/assets/components/justified-asset-grid'
import { useSuspenseInfiniteAlbumAssets } from '@/features/albums/albums.queries'

export interface AlbumAssetsProps {
  albumKey: AlbumKey
}

// module-level so memoized grid rows see stable references
const renderTileActions = (item: Asset) => (
  <>
    <FavoriteButton assetKey={item.key} />
    <AddToCollectionButton assetKey={item.key} variant="tile" />
  </>
)

export function AlbumAssets({ albumKey }: AlbumAssetsProps) {
  const tileLinkProps = useViewingAssetTileLinkProps()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteAlbumAssets(albumKey)

  const uiResetKey = useMemo(
    () => hashKey(['album-assets', albumKey]),
    [albumKey],
  )

  if (data.items.length === 0) {
    return <EmptyState>This album is empty.</EmptyState>
  }

  return (
    <InfiniteLoader
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      loadedCount={data.items.length}
      total={data.total}
      uiResetKey={uiResetKey}
      className={css({ width: '100%' })}
    >
      <JustifiedAssetGrid
        priorityFirstTile
        items={data.items}
        tileActions={renderTileActions}
        tileLinkProps={tileLinkProps}
      />
    </InfiniteLoader>
  )
}
