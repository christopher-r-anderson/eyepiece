import { Fragment } from 'react'
import { StaticGrid } from './static-grid'
import { VirtualGrid } from './virtual-grid'
import { useGridListState } from './hooks/use-grid-list-state'
import { useVirtualizeMeasurements } from './hooks/use-virtualize-measurements'
import type { GridItem } from './hooks/use-grid-list-state'
import type { HybridGridItemProvidedProps } from './hybrid-grid-item'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export function HybridGrid<T extends GridItem>({
  children,
  items,
  gap = 12,
  minTileWidth = 200,
  ...props
}: Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  children: (item: T, itemProps: HybridGridItemProvidedProps<T>) => ReactNode
  items: Array<T>
  gap?: number
  minTileWidth?: number
}) {
  const { state, gridProps, gridRef } = useGridListState(items)
  const measurements = useVirtualizeMeasurements(gridRef, gap, minTileWidth)
  return measurements ? (
    <VirtualGrid
      ref={gridRef}
      items={items}
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
      {Array.from({ length: 24 }).map((_, index) => (
        <Fragment key={index}>{children()}</Fragment>
      ))}
    </div>
  )
}
