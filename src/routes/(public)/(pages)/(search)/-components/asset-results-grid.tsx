import { useNavigate } from '@tanstack/react-router'
import { FavoriteButton } from '../../-components/favorite-button'
import type { Asset } from '@/domain/asset/asset.schema'
import { AssetTile } from '@/features/assets/components/asset-tile'
import { HybridGrid } from '@/features/listing/item-grid/components/hybrid-grid'
import { HybridGridItem } from '@/features/listing/item-grid/components/hybrid-grid-item'
import { AlbumLinkList } from '@/features/albums/components/album-link-list'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

export function AssetResultsGrid({ items }: { items: Array<Asset> }) {
  const navigate = useNavigate()

  return (
    <HybridGrid
      css={{ width: '100%' }}
      items={items}
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
            relatedLinks={
              item.albums ? <AlbumLinkList albums={item.albums} /> : undefined
            }
            actions={<FavoriteButton assetKey={item.key} />}
          />
        </HybridGridItem>
      )}
    </HybridGrid>
  )
}
