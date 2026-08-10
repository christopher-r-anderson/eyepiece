import { FavoriteButton } from '../../-components/favorite-button'
import { useViewingAssetTileLinkProps } from '../../-components/asset-viewing-overlay'
import type { Asset } from '@/domain/asset/asset.schema'
import { AddToCollectionButton } from '@/app/add-to-collection-button'
import { JustifiedAssetGrid } from '@/features/assets/components/justified-asset-grid'
import { AlbumLinkList } from '@/features/albums/components/album-link-list'

// module-level so memoized grid rows see stable references
const renderTileRelatedLinks = (item: Asset) =>
  item.albums ? <AlbumLinkList albums={item.albums} /> : undefined
const renderTileActions = (item: Asset) => (
  <>
    <FavoriteButton assetKey={item.key} />
    <AddToCollectionButton assetKey={item.key} variant="tile" />
  </>
)

export function AssetResultsGrid({
  items,
  priorityFirstTile,
}: {
  items: Array<Asset>
  priorityFirstTile?: boolean
}) {
  const tileLinkProps = useViewingAssetTileLinkProps()
  return (
    <JustifiedAssetGrid
      items={items}
      priorityFirstTile={priorityFirstTile}
      tileRelatedLinks={renderTileRelatedLinks}
      tileActions={renderTileActions}
      tileLinkProps={tileLinkProps}
    />
  )
}
