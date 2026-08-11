import { css } from 'styled-system/css'
import { token } from 'styled-system/tokens'
import type { CollectionCard as CollectionCardData } from '../collections.schema'
import { BELOW_MD_QUERY } from '@/lib/breakpoints'
import { Link } from '@/components/ui/link'
import { toFallbackSrc, toSrcSet } from '@/domain/asset/asset.utils'

// mirrors the column count and gap in collection-card-grid's cardGridCss;
// the page stops growing at contentMax, so past it a card's width is fixed
const CONTENT_MAX = parseFloat(token('sizes.contentMax'))
const CARD_MAX =
  (CONTENT_MAX -
    2 * parseFloat(token('spacing.4')) -
    2 * parseFloat(token('spacing.5'))) /
  3
const COVER_SIZES = `${BELOW_MD_QUERY} 100vw, (max-width: ${CONTENT_MAX}rem) 33vw, ${CARD_MAX.toFixed(2)}rem`
// full-viewport below md, so the widest slot is just under the breakpoint
const COVER_MAX_SLOT = 16 * parseFloat(token('breakpoints.md'))

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
  loading?: 'lazy' | 'eager'
}

export function CollectionCard({
  card,
  curatedBy,
  showVisibility,
  linkTarget = 'publicDetail',
  titleLevel = 3,
  loading = 'lazy',
}: CollectionCardProps) {
  const { collection, itemCount, cover } = card
  const TitleTag = `h${titleLevel}` as const
  const content = (
    <>
      {cover?.image ? (
        <img
          src={toFallbackSrc(cover.image)}
          srcSet={toSrcSet(cover.image, COVER_MAX_SLOT)}
          sizes={COVER_SIZES}
          alt=""
          loading={loading}
          decoding="async"
          width={cover.image.width}
          height={cover.image.height}
          className={css({
            width: 'full',
            aspectRatio: 2.1,
            objectFit: 'cover',
            transitionFast: 'opacity',
          })}
        />
      ) : (
        <div
          className={css({
            width: 'full',
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
          textStyle: 'meta',
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
      css={{
        display: 'block',
        minWidth: '0',
        color: 'text',
        textDecoration: 'none',
        _hover: { '& img': { opacity: 0.88 } },
      }}
    >
      {content}
    </Link>
  )
}
