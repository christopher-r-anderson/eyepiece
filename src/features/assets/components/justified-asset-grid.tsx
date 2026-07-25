import { css } from 'styled-system/css'
import { AssetTile } from './asset-tile'
import type { CSSProperties, ReactNode } from 'react'
import type { AssetPreview } from '@/domain/asset/asset.schema'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

interface JustifiedAssetGridProps<TItem extends AssetPreview> {
  items: Array<TItem>
  tileActions?: (item: TItem) => ReactNode
  tileRelatedLinks?: (item: TItem) => ReactNode
}

// CSS-only justified rows: flex-basis carries each tile's aspect ratio at
// the target row height and flex-grow shares a row's leftover space in
// ratio proportion, so every tile in a row lands on one common height. The
// ::after filler soaks up the last row's slack instead of letting its tiles
// stretch.
export function JustifiedAssetGrid<TItem extends AssetPreview>({
  items,
  tileActions,
  tileRelatedLinks,
}: JustifiedAssetGridProps<TItem>) {
  return (
    <ul
      // Safari drops list semantics with list-style: none
      role="list"
      className={css({
        display: 'flex',
        flexWrap: 'wrap',
        gap: '3',
        listStyle: 'none',
        paddingInlineStart: '0',
        '--row-h': '225px',
        mdDown: { gap: '2', '--row-h': '122px' },
        _after: { content: '""', flex: '10000 1 0' },
      })}
    >
      {items.map((item) => (
        <li
          key={toAssetKeyString(item.key)}
          style={
            {
              '--ar': (item.thumbnail.width / item.thumbnail.height).toFixed(4),
            } as CSSProperties
          }
          className={css({
            flex: 'calc(var(--ar) * 100) 1 calc(var(--ar) * var(--row-h))',
            aspectRatio: 'var(--ar)',
            // caps how far a wide tile can stretch when its row is sparse
            maxWidth: 'calc(2.4 * var(--row-h) * 1.6)',
            // lets tiles shrink below basis so a row always fits the line
            minWidth: 0,
          })}
        >
          <AssetTile
            assetPreview={item}
            relatedLinks={tileRelatedLinks?.(item)}
            actions={tileActions?.(item)}
            // width and height both set leaves the tile's own square
            // aspect-ratio inert; the ratio lives on the list item
            className={css({ width: '100%', height: '100%' })}
          />
        </li>
      ))}
    </ul>
  )
}
