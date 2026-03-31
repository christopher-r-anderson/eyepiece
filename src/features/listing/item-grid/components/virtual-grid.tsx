import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { Fragment } from 'react'
import type { ListState } from '@react-stately/list'
import type { HybridGridItemProvidedProps } from './hybrid-grid-item'
import type { ComponentPropsWithoutRef, ReactNode, RefObject } from 'react'

const rowCss = {
  display: 'grid',
  justifyContent: 'center',
  width: '100%',
  position: 'absolute' as const,
  top: 0,
  left: 0,
}

export function VirtualGrid<T extends object>({
  ref,
  items,
  getItemKey,
  state,
  itemsPerRow,
  minTileWidth,
  gap,
  children,
  estimateRowHeight = 260,
  scrollMargin,
  ...props
}: Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  ref: RefObject<HTMLDivElement | null>
  items: Array<T>
  getItemKey: (item: T) => string
  state: ListState<T>
  itemsPerRow: number
  minTileWidth: number
  gap: number
  scrollMargin: number
  children: (item: T, itemProps: HybridGridItemProvidedProps<T>) => ReactNode
  estimateRowHeight?: number
}) {
  const rowCount = Math.ceil(items.length / itemsPerRow)

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimateRowHeight,
    overscan: 6,
    gap,
    scrollMargin,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  return (
    <div
      ref={ref}
      style={{
        height: rowVirtualizer.getTotalSize(),
        position: 'relative',
      }}
      {...props}
    >
      {virtualRows.map((vr) => {
        const rowIndex = vr.index
        const start = rowIndex * itemsPerRow
        const end = Math.min(start + itemsPerRow, items.length)
        const rowSlice = items.slice(start, end)
        return (
          <div
            data-index={vr.index}
            key={vr.key}
            ref={rowVirtualizer.measureElement}
            css={rowCss}
            style={{
              gap,
              gridTemplateColumns: `repeat(${itemsPerRow}, minmax(${minTileWidth}px, 1fr))`,
              transform: `translateY(${vr.start - scrollMargin}px)`,
            }}
          >
            {rowSlice.map((item) => (
              <Fragment key={getItemKey(item)}>
                {children(item, {
                  isVirtualized: true,
                  state,
                  itemKey: getItemKey(item),
                })}
              </Fragment>
            ))}
          </div>
        )
      })}
    </div>
  )
}
