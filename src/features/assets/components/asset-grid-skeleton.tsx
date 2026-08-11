import { css } from 'styled-system/css'
import { AssetTileSkeleton } from './asset-tile'
import { justifiedGridCss, justifiedGridItemCss } from './justified-asset-grid'
import type { CSSProperties } from 'react'
import { DEFAULT_PAGE_SIZE } from '@/domain/pagination/pagination.schema'

// varied ratios so the pending state reads as justified rows, not squares
const SKELETON_RATIOS = [1.5, 1, 1.33, 0.75, 1.78, 1.25, 0.8, 1.6]

export function AssetGridSkeleton({
  count = DEFAULT_PAGE_SIZE,
}: {
  count?: number
}) {
  return (
    <div aria-hidden="true" className={css(justifiedGridCss)}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          style={
            {
              '--ar': SKELETON_RATIOS[index % SKELETON_RATIOS.length],
            } as CSSProperties
          }
          className={css(justifiedGridItemCss)}
        >
          <AssetTileSkeleton
            className={css({ width: 'full', height: 'full' })}
          />
        </div>
      ))}
    </div>
  )
}
