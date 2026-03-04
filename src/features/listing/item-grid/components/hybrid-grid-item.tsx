import { useGridListItem } from 'react-aria'
import { useRef } from 'react'
import type { ListState, useListState } from '@react-stately/list'
import type { ReactNode } from 'react'
import type { GridItem } from '@/features/listing/item-grid/hooks/use-grid-list-state'

function isFromInteractiveTarget(event: Event) {
  const t = event.target as HTMLElement | null
  if (!t) return false
  return !!t.closest(
    'a,button,input,textarea,select,summary,[role="button"],[role="link"],[role="checkbox"]',
  )
}

export type HybridGridItemProvidedProps<T extends GridItem> = {
  isVirtualized: boolean
  state: ListState<T>
}

export function HybridGridItem<T extends GridItem>({
  item,
  state,
  onRowAction,
  children,
  isVirtualized,
}: {
  item: T
  state: ReturnType<typeof useListState<T>>
  onRowAction?: (item: T) => void
  children: ReactNode
  isVirtualized: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  const node = state.collection.getItem(item.id)
  if (!node) return null

  const { rowProps, gridCellProps } = useGridListItem(
    {
      node,
      isVirtualized,
    },
    state,
    ref,
  )

  return (
    <div
      {...rowProps}
      ref={ref}
      onClick={(e) => {
        // ignore clicks on nested links, etc.
        if (isFromInteractiveTarget(e.nativeEvent)) return
        onRowAction?.(item)
      }}
    >
      <div {...gridCellProps}>{children}</div>
    </div>
  )
}
