import { createElement } from 'react'
import { useGridList, useObjectRef } from 'react-aria'
import { useListState } from '@react-stately/list'
import { Item as StatelyItem } from '@react-stately/collections'
import type { RefObject } from 'react'

export interface GridItem {
  id: string
  title: string
}

export function useGridListState<T extends GridItem>(
  items: Array<T>,
  ref?: RefObject<HTMLDivElement | null>,
) {
  const gridRef = useObjectRef(ref)
  const state = useListState<T>({
    selectionMode: 'none',
    items,
    children: (item: T) =>
      // children in props is to satisfy ItemProps<T>
      createElement(StatelyItem<T>, {
        key: item.id,
        textValue: item.title,
        children: item.title,
      }),
  })

  const { gridProps } = useGridList({ 'aria-label': 'Results' }, state, gridRef)

  return { state, gridProps, gridRef }
}
