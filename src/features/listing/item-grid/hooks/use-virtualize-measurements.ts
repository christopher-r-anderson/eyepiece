import { useMemo } from 'react'
import { useElementLayout } from './use-element-layout'
import type { RefObject } from 'react'

export function useVirtualizeMeasurements(
  ref: RefObject<HTMLElement | null>,
  gap: number,
  minTileWidth: number,
) {
  const layout = useElementLayout(ref)

  const itemsPerRow = useMemo(() => {
    if (!layout) return null
    const padding = 0
    const usable = Math.max(0, layout.width - padding * 2)
    const n = Math.floor((usable + gap) / (minTileWidth + gap))
    return Math.max(1, n || 1)
  }, [minTileWidth, gap, layout])

  const estimateRowHeight = useMemo(() => {
    if (layout === null || itemsPerRow === null) return null
    const totalGapWidth = (itemsPerRow - 1) * gap
    const itemWidth = (layout.width - totalGapWidth) / itemsPerRow

    return itemWidth // 1:1 Aspect Ratio
  }, [layout, itemsPerRow, gap])

  if (layout === null || itemsPerRow === null || estimateRowHeight === null) {
    return null
  }

  return {
    itemsPerRow,
    estimateRowHeight,
    scrollMargin: layout.offsetTop,
  }
}
