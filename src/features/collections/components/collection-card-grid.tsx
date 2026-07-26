import { css } from 'styled-system/css'
import { CollectionCard } from './collection-card'
import type { CollectionCard as CollectionCardData } from '../collections.schema'

const cardGridCss = css.raw({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '5',
  mdDown: { gridTemplateColumns: '1fr' },
})

export function CollectionCardGrid({
  cards,
  curatedBy,
}: {
  cards: Array<CollectionCardData>
  curatedBy?: string
}) {
  if (cards.length === 0) {
    return (
      <p className={css({ color: 'text.muted' })}>No public collections yet.</p>
    )
  }
  return (
    <ul
      // Safari drops list semantics with list-style: none
      role="list"
      className={css(cardGridCss, {
        listStyle: 'none',
        paddingInlineStart: '0',
      })}
    >
      {cards.map((card) => (
        <li key={card.collection.id} className={css({ minWidth: 0 })}>
          <CollectionCard card={card} curatedBy={curatedBy} />
        </li>
      ))}
    </ul>
  )
}

export function CollectionCardGridSkeleton() {
  return (
    <div aria-hidden="true" className={css(cardGridCss)}>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index}>
          <div
            className={css({
              width: '100%',
              aspectRatio: 2.1,
              backgroundColor: 'assetTile.bg',
            })}
          />
          <div
            className={css({
              height: '1.1875rem',
              width: '60%',
              marginTop: '2',
              backgroundColor: 'bg.surface.1',
            })}
          />
        </div>
      ))}
    </div>
  )
}
