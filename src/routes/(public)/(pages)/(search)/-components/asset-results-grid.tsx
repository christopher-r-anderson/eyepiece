import { FavoriteButton } from '../../-components/favorite-button'
import type { Asset } from '@/domain/asset/asset.schema'
import type { HistoryState } from '@tanstack/react-router'
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

// SPIKE (overlay route masking): the tile stays on the search route and
// records the asset in history state; the mask displays the real detail
// URL, so copy/share and reload (unmaskOnReload) land on the full page
const renderTileLinkProps = (item: Asset) => ({
  to: '.',
  search: (current: unknown) => current,
  resetScroll: false,
  state: (prev: HistoryState) => ({
    ...prev,
    viewingAsset: item.key,
    dialogPushed: true,
  }),
  mask: {
    to: '/assets/$providerId/$assetId',
    params: {
      providerId: item.key.providerId,
      assetId: item.key.externalId,
    },
    unmaskOnReload: true,
  },
})

export function AssetResultsGrid({ items }: { items: Array<Asset> }) {
  return (
    <JustifiedAssetGrid
      items={items}
      tileRelatedLinks={renderTileRelatedLinks}
      tileActions={renderTileActions}
      tileLinkProps={renderTileLinkProps}
    />
  )
}
