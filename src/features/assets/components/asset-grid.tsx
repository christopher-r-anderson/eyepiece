import { useNavigate } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { AssetTile } from './asset-tile'
import type { ReactNode } from 'react'
import type { AssetPreview } from '@/domain/asset/asset.schema'
import { HybridGrid } from '@/features/listing/item-grid/components/hybrid-grid'
import { HybridGridItem } from '@/features/listing/item-grid/components/hybrid-grid-item'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

interface AssetGridProps<TItem extends AssetPreview> {
  items: Array<TItem>
  tileActions?: (item: TItem) => ReactNode
  tileRelatedLinks?: (item: TItem) => ReactNode
}

export function AssetGrid<TItem extends AssetPreview>({
  items,
  tileActions,
  tileRelatedLinks,
}: AssetGridProps<TItem>) {
  const navigate = useNavigate()

  return (
    <HybridGrid
      className={css({ width: '100%' })}
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
            relatedLinks={tileRelatedLinks?.(item)}
            actions={tileActions?.(item)}
          />
        </HybridGridItem>
      )}
    </HybridGrid>
  )
}
