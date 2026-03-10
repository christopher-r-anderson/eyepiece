import { AssetTileSkeleton } from '@/features/assets/components/asset-tile'
import { ItemGridSkeleton } from '@/features/listing/item-grid/components/hybrid-grid'

export function AssetGridSkeleton() {
  return <ItemGridSkeleton>{() => <AssetTileSkeleton />}</ItemGridSkeleton>
}
