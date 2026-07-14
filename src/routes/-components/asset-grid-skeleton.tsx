import { AssetTileSkeleton } from '@/features/assets/components/asset-tile'
import { ItemGridSkeleton } from '@/features/listing/item-grid/components/hybrid-grid'

export function AssetGridSkeleton({ count }: { count?: number }) {
  return (
    <ItemGridSkeleton count={count}>
      {() => <AssetTileSkeleton />}
    </ItemGridSkeleton>
  )
}
