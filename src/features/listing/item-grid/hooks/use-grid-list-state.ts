import { createElement } from 'react'
import { useGridList, useObjectRef } from 'react-aria'
import { useListState } from '@react-stately/list'
import { Item as StatelyItem } from '@react-stately/collections'
import type { RefObject } from 'react'

export function useGridListState<T extends object>(
  items: Array<T>,
  getItemKey: (item: T) => string,
  getItemTextValue: (item: T) => string,
  ref?: RefObject<HTMLDivElement | null>,
) {
  const gridRef = useObjectRef(ref)
  const state = useListState<T>({
    selectionMode: 'none',
    items,
    children: (item: T) => {
      const textValue = getItemTextValue(item)
      return createElement(StatelyItem<T>, {
        key: getItemKey(item),
        textValue,
        children: textValue,
      })
    },
  })

  const { gridProps } = useGridList({ 'aria-label': 'Results' }, state, gridRef)

  return { state, gridProps, gridRef }
}
