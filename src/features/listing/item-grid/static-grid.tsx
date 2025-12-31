import { ReactNode, Fragment, RefObject, ComponentPropsWithoutRef } from 'react'
import { HybridGridItemProvidedProps } from './hybrid-grid-item'
import { GridItem } from './hooks/use-grid-list-state'
import { ListState } from '@react-stately/list'

const gridCss = {
  display: 'grid',
  justifyContent: 'center',
}

export function StaticGrid<T extends GridItem>({
  ref,
  items,
  state,
  children,
  gap,
  minTileWidth,
  ...props
}: Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  items: T[]
  state: ListState<T>
  children: (item: T, itemProps: HybridGridItemProvidedProps<T>) => ReactNode
  minTileWidth: number
  gap: number
  ref: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={ref}
      css={gridCss}
      style={{
        gap,
        gridTemplateColumns: `repeat(auto-fit, minmax(${minTileWidth}px, 1fr))`,
      }}
      {...props}
    >
      {items.map((item, i) => (
        <Fragment key={(item as any).id ?? i}>
          {children(item, { isVirtualized: false, state })}
        </Fragment>
      ))}
    </div>
  )
}
