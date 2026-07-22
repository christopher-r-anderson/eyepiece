import { FavoriteButton } from '../../-components/favorite-button'
import type { Asset } from '@/domain/asset/asset.schema'
import { AssetGrid } from '@/features/assets/components/asset-grid'
import { AlbumLinkList } from '@/features/albums/components/album-link-list'

export function AssetResultsGrid({ items }: { items: Array<Asset> }) {
  return (
    <AssetGrid
      items={items}
      tileRelatedLinks={(item) =>
        item.albums ? <AlbumLinkList albums={item.albums} /> : undefined
      }
      tileActions={(item) => <FavoriteButton assetKey={item.key} />}
    />
  )
}
