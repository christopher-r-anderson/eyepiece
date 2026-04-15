import { Fragment } from 'react'
import { StaticGrid } from './static-grid'
import { VirtualGrid } from './virtual-grid'
import type { HybridGridItemProvidedProps } from './hybrid-grid-item'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { useVirtualizeMeasurements } from '@/features/listing/item-grid/hooks/use-virtualize-measurements'
import { useGridListState } from '@/features/listing/item-grid/hooks/use-grid-list-state'
import { DEFAULT_PAGE_SIZE } from '@/domain/pagination/pagination.schema'

export function HybridGrid<T extends object>({
  children,
  items,
  getItemKey,
  getItemTextValue,
  gap = 12,
  minTileWidth = 200,
  ...props
}: Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  children: (item: T, itemProps: HybridGridItemProvidedProps<T>) => ReactNode
  items: Array<T>
  getItemKey: (item: T) => string
  getItemTextValue: (item: T) => string
  gap?: number
  minTileWidth?: number
}) {
  const { state, gridProps, gridRef } = useGridListState(
    items,
    getItemKey,
    getItemTextValue,
  )
  const measurements = useVirtualizeMeasurements(gridRef, gap, minTileWidth)
  return measurements ? (
    <VirtualGrid
      ref={gridRef}
      items={items}
      getItemKey={getItemKey}
      state={state}
      scrollMargin={measurements.scrollMargin}
      itemsPerRow={measurements.itemsPerRow}
      minTileWidth={minTileWidth}
      gap={gap}
      estimateRowHeight={measurements.estimateRowHeight}
      {...props}
      {...gridProps}
    >
      {children}
    </VirtualGrid>
  ) : (
    <StaticGrid
      ref={gridRef}
      items={items}
      getItemKey={getItemKey}
      state={state}
      minTileWidth={minTileWidth}
      gap={gap}
      {...props}
      {...gridProps}
    >
      {children}
    </StaticGrid>
  )
}

const skeletonCss = {
  display: 'grid',
  listStyleType: 'none',
  padding: 0,
  justifyContent: 'center',
  margin: 0,
  width: '100%',
}

export function ItemGridSkeleton({
  children,
  gap = 12,
  minTileWidth = 200,
  ...props
}: Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  children: () => ReactNode
  gap?: number
  minTileWidth?: number
}) {
  return (
    <div
      aria-hidden="true"
      css={skeletonCss}
      style={{
        gap,
        gridTemplateColumns: `repeat(auto-fit, minmax(${minTileWidth}px, 1fr))`,
      }}
      {...props}
    >
      {Array.from({ length: DEFAULT_PAGE_SIZE }).map((_, index) => (
        <Fragment key={index}>{children()}</Fragment>
      ))}
    </div>
  )
}
