import { createElement, memo, useMemo, useRef } from 'react'
import { useGridList, useGridListItem } from 'react-aria'
import { useListState } from '@react-stately/list'
import { Item as StatelyItem } from '@react-stately/collections'
import { css, cx } from 'styled-system/css'
import { AssetTile } from './asset-tile'
import { JustifiedKeyboardDelegate } from './justified-keyboard-delegate'
import {
  eagerTileCount,
  justifiedTileImageGeometry,
} from './justified-grid.layout'
import type { TileLinkProps } from './asset-tile'
import type { Key } from 'react-aria'
import type { ListState } from '@react-stately/list'
import type { CSSProperties, ReactNode } from 'react'
import type { AssetPreview } from '@/domain/asset/asset.schema'
import { toAspectRatio, toAssetKeyString } from '@/domain/asset/asset.utils'

// CSS-only justified rows: flex-basis carries each tile's aspect ratio at
// the target row height and flex-grow shares a row's leftover space in
// ratio proportion, so every tile in a row lands on one common height. The
// ::after filler soaks up the last row's slack instead of letting its tiles
// stretch.
export const justifiedGridCss = css.raw({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  '--row-h': 'token(sizes.assetGridRow)',
  mdDown: { gap: '2', '--row-h': 'token(sizes.assetGridRowNarrow)' },
  _after: { content: '""', flex: '10000 1 0' },
})

export const justifiedGridItemCss = css.raw({
  flex: 'calc(var(--ar) * 100) 1 calc(var(--ar) * var(--row-h))',
  aspectRatio: 'var(--ar)',
  // caps how far a wide tile can stretch when its row is sparse
  maxWidth: 'calc(2.4 * var(--row-h) * 1.6)',
  // lets tiles shrink below basis so a row always fits the line
  minWidth: 0,
})

const fillCss = css.raw({ width: '100%', height: '100%' })

interface JustifiedAssetGridProps<TItem extends AssetPreview> {
  items: Array<TItem>
  'aria-label'?: string
  tileActions?: (item: TItem) => ReactNode
  tileRelatedLinks?: (item: TItem) => ReactNode
  // extra class for a tile's row, keyed off the item (e.g. ghost dimming)
  tileClassName?: (item: TItem) => string | undefined
  // ghost rows stay rendered but must not navigate (row action or link)
  tileLinkDisabled?: (item: TItem) => boolean
  tileLinkProps?: (item: TItem) => TileLinkProps | undefined
  tilePersistentActions?: (item: TItem) => ReactNode
  // only for the grid holding the page's LCP candidate; a later grid's
  // first tile sits below the fold
  priorityFirstTile?: boolean
}

export function JustifiedAssetGrid<TItem extends AssetPreview>({
  items,
  'aria-label': ariaLabel = 'Results',
  tileActions,
  tileRelatedLinks,
  tileClassName,
  tileLinkDisabled,
  tileLinkProps,
  tilePersistentActions,
  priorityFirstTile,
}: JustifiedAssetGridProps<TItem>) {
  const gridRef = useRef<HTMLDivElement>(null)

  const state = useListState<TItem>({
    selectionMode: 'none',
    items,
    children: (item) =>
      createElement(StatelyItem<TItem>, {
        key: toAssetKeyString(item.key),
        textValue: item.title,
        children: item.title,
      }),
  })

  const keyboardDelegate = useMemo(
    () => new JustifiedKeyboardDelegate(state.collection, gridRef),
    [state.collection],
  )

  const { gridProps } = useGridList(
    {
      'aria-label': ariaLabel,
      keyboardDelegate,
      keyboardNavigationBehavior: 'tab',
      // Enter opens the focused tile through its own link so every
      // navigation shares one path (state, mask)
      onAction: (key: Key) => {
        const item = state.collection.getItem(key)?.value
        if (item && tileLinkDisabled?.(item)) {
          return
        }
        gridRef.current
          ?.querySelector<HTMLAnchorElement>(
            `[data-key="${CSS.escape(String(key))}"] a[data-tile-primary-link]`,
          )
          ?.click()
      },
    },
    state,
    gridRef,
  )

  const focusedKey = state.selectionManager.focusedKey
  const tabStopKey = focusedKey ?? state.collection.getFirstKey()

  const eagerCount = useMemo(
    () => eagerTileCount(items.map((item) => toAspectRatio(item.image))),
    [items],
  )

  // the first tile with a file to fetch; a record with no image would soak
  // up the priority
  const priorityIndex = priorityFirstTile
    ? items.findIndex((item) => item.image)
    : -1

  return (
    <div ref={gridRef} {...gridProps} className={css(justifiedGridCss)}>
      {[...state.collection].map((node, index) => {
        const item = node.value
        if (!item) return null
        return (
          <JustifiedGridRow
            key={node.key}
            item={item}
            itemKey={node.key}
            state={state}
            isTabStop={node.key === tabStopKey}
            isFocused={node.key === focusedKey}
            loading={index < eagerCount ? undefined : 'lazy'}
            fetchPriority={index === priorityIndex ? 'high' : undefined}
            tileActions={tileActions}
            tileRelatedLinks={tileRelatedLinks}
            tileClassName={tileClassName}
            tileLinkDisabled={tileLinkDisabled}
            tileLinkProps={tileLinkProps}
            tilePersistentActions={tilePersistentActions}
          />
        )
      })}
    </div>
  )
}

interface JustifiedGridRowProps<TItem extends AssetPreview> {
  item: TItem
  itemKey: Key
  state: ListState<TItem>
  isTabStop: boolean
  isFocused: boolean
  loading?: 'lazy'
  fetchPriority?: 'high'
  tileActions?: (item: TItem) => ReactNode
  tileRelatedLinks?: (item: TItem) => ReactNode
  tileClassName?: (item: TItem) => string | undefined
  tileLinkDisabled?: (item: TItem) => boolean
  tileLinkProps?: (item: TItem) => TileLinkProps | undefined
  tilePersistentActions?: (item: TItem) => ReactNode
}

function JustifiedGridRowInner<TItem extends AssetPreview>({
  item,
  itemKey,
  state,
  loading,
  fetchPriority,
  tileActions,
  tileRelatedLinks,
  tileClassName,
  tileLinkDisabled,
  tileLinkProps,
  tilePersistentActions,
}: JustifiedGridRowProps<TItem>) {
  const ref = useRef<HTMLDivElement>(null)

  const node = state.collection.getItem(itemKey)
  if (!node) return null

  const { rowProps, gridCellProps } = useGridListItem({ node }, state, ref)

  return (
    <div
      {...rowProps}
      ref={ref}
      data-key={itemKey}
      style={
        {
          '--ar': toAspectRatio(item.image).toFixed(4),
        } as CSSProperties
      }
      className={cx(css(justifiedGridItemCss), tileClassName?.(item))}
    >
      <div {...gridCellProps} className={css(fillCss)}>
        <AssetTile
          assetPreview={item}
          {...justifiedTileImageGeometry(toAspectRatio(item.image))}
          loading={loading}
          fetchPriority={fetchPriority}
          relatedLinks={tileRelatedLinks?.(item)}
          actions={tileActions?.(item)}
          isLinkDisabled={tileLinkDisabled?.(item)}
          linkProps={tileLinkProps?.(item)}
          persistentActions={tilePersistentActions?.(item)}
          // width and height both set leaves the tile's own square
          // aspect-ratio inert; the ratio lives on the row
          className={css(fillCss)}
        />
      </div>
    </div>
  )
}

// Shallow-compare every prop except state, whose identity changes each
// render by RAC's design; keydown handling that needs fresh list state
// lives on the container. isFocused must stay a compared prop: the row
// that gains focus has to re-render for useGridListItem to move DOM
// focus onto it.
const JustifiedGridRow = memo(JustifiedGridRowInner, (prev, next) => {
  const prevKeys = Object.keys(prev)
  if (prevKeys.length !== Object.keys(next).length) {
    return false
  }
  for (const key of prevKeys) {
    if (key === 'state') {
      continue
    }
    if (
      !Object.is(
        (prev as Record<string, unknown>)[key],
        (next as Record<string, unknown>)[key],
      )
    ) {
      return false
    }
  }
  return true
}) as typeof JustifiedGridRowInner
