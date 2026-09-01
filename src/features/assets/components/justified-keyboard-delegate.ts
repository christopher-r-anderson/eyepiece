import { ListKeyboardDelegate } from 'react-aria'
import type { Key } from 'react-aria'
import type { ListState } from 'react-stately'
import type { RefObject } from 'react'

// Tiles in a justified grid share a row top but their left edges never
// align between rows, so the stock grid delegate's exact-x column match
// cannot find a key below or above. Match the adjacent row's tile with the
// most horizontal overlap instead. Rects are read per keydown, when layout
// is already clean.
export class JustifiedKeyboardDelegate<T> extends ListKeyboardDelegate<T> {
  private gridRef: RefObject<HTMLElement | null>
  private gridCollection: ListState<T>['collection']

  constructor(
    collection: ListState<T>['collection'],
    ref: RefObject<HTMLElement | null>,
  ) {
    super({
      collection,
      ref,
      layout: 'grid',
      orientation: 'vertical',
      direction: 'ltr',
    })
    this.gridRef = ref
    this.gridCollection = collection
  }

  private rectOf(key: Key): DOMRect | null {
    const element = this.gridRef.current?.querySelector(
      `[data-key="${CSS.escape(String(key))}"]`,
    )
    return element?.getBoundingClientRect() ?? null
  }

  private keyInAdjacentRow(key: Key, forward: boolean): Key | null {
    const origin = this.rectOf(key)
    if (!origin) return null

    let candidate: Key | null = null
    let bestScore = -Infinity
    let rowTop: number | null = null
    let currentKey = forward
      ? this.gridCollection.getKeyAfter(key)
      : this.gridCollection.getKeyBefore(key)

    while (currentKey != null) {
      const rect = this.rectOf(currentKey)
      if (rect) {
        const pastOwnRow = forward
          ? rect.top > origin.top + 1
          : rect.top < origin.top - 1
        if (pastOwnRow) {
          rowTop ??= rect.top
          if (Math.abs(rect.top - rowTop) > 1) break
          const overlap =
            Math.min(origin.right, rect.right) -
            Math.max(origin.left, rect.left)
          const centerGap = Math.abs(
            rect.left + rect.width / 2 - (origin.left + origin.width / 2),
          )
          // overlap decides; center distance only breaks ties
          const score = overlap * 1000 - centerGap
          if (score > bestScore) {
            bestScore = score
            candidate = currentKey
          }
        }
      }
      currentKey = forward
        ? this.gridCollection.getKeyAfter(currentKey)
        : this.gridCollection.getKeyBefore(currentKey)
    }

    return candidate
  }

  // The grid scrolls with the document, so the base class's page jump (the
  // container's own client box) would span the entire list. Page by
  // viewport height instead.
  private pageKey(key: Key, forward: boolean): Key | null {
    const origin = this.rectOf(key)
    if (!origin) return null

    let currentKey: Key = key
    for (let step = 0; step < this.gridCollection.size; step++) {
      const nextKey = forward
        ? this.getKeyBelow(currentKey)
        : this.getKeyAbove(currentKey)
      if (nextKey == null) {
        const edgeKey = forward ? this.getLastKey() : this.getFirstKey()
        return edgeKey === key ? null : edgeKey
      }
      const rect = this.rectOf(nextKey)
      if (!rect || Math.abs(rect.top - origin.top) >= window.innerHeight) {
        return nextKey
      }
      currentKey = nextKey
    }
    return null
  }

  getKeyBelow(key: Key): Key | null {
    return this.keyInAdjacentRow(key, true)
  }

  getKeyAbove(key: Key): Key | null {
    return this.keyInAdjacentRow(key, false)
  }

  getKeyPageBelow(key: Key): Key | null {
    return this.pageKey(key, true)
  }

  getKeyPageAbove(key: Key): Key | null {
    return this.pageKey(key, false)
  }
}
