import { useGridListItem } from 'react-aria'
import { useRef } from 'react'
import type { ListState, useListState } from '@react-stately/list'
import type { ReactNode } from 'react'

function isFromInteractiveTarget(event: Event) {
  const t = event.target as HTMLElement | null
  if (!t) return false
  return !!t.closest(
    'a,button,input,textarea,select,summary,[role="button"],[role="link"],[role="checkbox"]',
  )
}

export type HybridGridItemProvidedProps<T extends object> = {
  isVirtualized: boolean
  state: ListState<T>
  itemKey: string
}

export function HybridGridItem<T extends object>({
  item,
  itemKey,
  state,
  onRowAction,
  children,
  isVirtualized,
}: {
  item: T
  itemKey: string
  state: ReturnType<typeof useListState<T>>
  onRowAction?: (item: T) => void
  children: ReactNode
  isVirtualized: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  const node = state.collection.getItem(itemKey)
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
