import { FavoriteButton } from '../../-components/favorite-button'
import type { Asset } from '@/domain/asset/asset.schema'
import { JustifiedAssetGrid } from '@/features/assets/components/justified-asset-grid'
import { AlbumLinkList } from '@/features/albums/components/album-link-list'

// module-level so memoized grid rows see stable references
const tileRelatedLinks = (item: Asset) =>
  item.albums ? <AlbumLinkList albums={item.albums} /> : undefined
const tileActions = (item: Asset) => <FavoriteButton assetKey={item.key} />

export function AssetResultsGrid({ items }: { items: Array<Asset> }) {
  return (
    <JustifiedAssetGrid
      items={items}
      tileRelatedLinks={tileRelatedLinks}
      tileActions={tileActions}
    />
  )
}
