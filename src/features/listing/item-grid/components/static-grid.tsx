import { Fragment } from 'react'
import { css, cx } from 'styled-system/css'
import type { ListState } from '@react-stately/list'
import type { HybridGridItemProvidedProps } from './hybrid-grid-item'
import type { ComponentPropsWithoutRef, ReactNode, RefObject } from 'react'

export function StaticGrid<T extends object>({
  ref,
  items,
  getItemKey,
  state,
  children,
  gap,
  minTileWidth,
  ...props
}: Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  items: Array<T>
  getItemKey: (item: T) => string
  state: ListState<T>
  children: (item: T, itemProps: HybridGridItemProvidedProps<T>) => ReactNode
  minTileWidth: number
  gap: number
  ref: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={ref}
      style={{
        gap,
        gridTemplateColumns: `repeat(auto-fit, minmax(${minTileWidth}px, 1fr))`,
      }}
      {...props}
      className={cx(
        css({ display: 'grid', justifyContent: 'center' }),
        props.className,
      )}
    >
      {items.map((item) => (
        <Fragment key={getItemKey(item)}>
          {children(item, {
            isVirtualized: false,
            state,
            itemKey: getItemKey(item),
          })}
        </Fragment>
      ))}
    </div>
  )
}
