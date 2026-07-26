import { css } from 'styled-system/css'
import type { CollectionCard as CollectionCardData } from '../collections.schema'
import { Link } from '@/components/ui/link'

interface CollectionCardProps {
  card: CollectionCardData
  curatedBy?: string
  showVisibility?: boolean
  // a private collection has no viewable destination, so its card can
  // render as static content
  isLinked?: boolean
}

export function CollectionCard({
  card,
  curatedBy,
  showVisibility,
  isLinked = true,
}: CollectionCardProps) {
  const { collection, itemCount, cover } = card
  const content = (
    <>
      {cover ? (
        <img
          src={cover.thumbnail.href}
          alt=""
          loading="lazy"
          width={cover.thumbnail.width}
          height={cover.thumbnail.height}
          className={css({
            width: '100%',
            aspectRatio: 2.1,
            objectFit: 'cover',
            transitionFast: 'opacity',
          })}
        />
      ) : (
        <div
          className={css({
            width: '100%',
            aspectRatio: 2.1,
            backgroundColor: 'bg.surface.1',
          })}
        />
      )}
      <h3
        className={css({
          textStyle: 'title.sm',
          marginTop: '2',
          overflowWrap: 'anywhere',
        })}
      >
        {collection.name}
      </h3>
      <p
        className={css({
          marginTop: '1',
          fontFamily: 'mono',
          fontSize: 'mono',
          textTransform: 'lowercase',
          color: 'text.muted',
        })}
      >
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
        {curatedBy ? ` · curated by ${curatedBy}` : ''}
        {showVisibility ? ` · ${collection.visibility}` : ''}
      </p>
    </>
  )

  if (!isLinked) {
    return <div className={css({ minWidth: 0 })}>{content}</div>
  }

  return (
    <Link
      to="/collections/$collectionId"
      params={{ collectionId: collection.id }}
      css={css.raw({
        display: 'block',
        minWidth: 0,
        color: 'text',
        textDecoration: 'none',
        _hover: { '& img': { opacity: 0.88 } },
      })}
    >
      {content}
    </Link>
  )
}
