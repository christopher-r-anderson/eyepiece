import { css } from 'styled-system/css'
import type { CollectionCard as CollectionCardData } from '../collections.schema'
import { Link } from '@/components/ui/link'

interface CollectionCardProps {
  card: CollectionCardData
  curatedBy?: string
  showVisibility?: boolean
  // owner surfaces link to the manage page (the only viewable destination
  // for a private collection); public surfaces link to public detail
  linkTarget?: 'publicDetail' | 'manage'
  // defaults to 3 for cards under a section heading; pages whose cards sit
  // directly under the h1 pass 2 to keep the outline gapless
  titleLevel?: 2 | 3
}

export function CollectionCard({
  card,
  curatedBy,
  showVisibility,
  linkTarget = 'publicDetail',
  titleLevel = 3,
}: CollectionCardProps) {
  const { collection, itemCount, cover } = card
  const TitleTag = `h${titleLevel}` as const
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
      <TitleTag
        className={css({
          textStyle: 'title.sm',
          marginTop: '2',
          overflowWrap: 'anywhere',
        })}
      >
        {collection.name}
      </TitleTag>
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

  return (
    <Link
      to={
        linkTarget === 'manage'
          ? '/collections/$collectionId/manage'
          : '/collections/$collectionId'
      }
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
