import { Suspense } from 'react'
import { hashKey } from '@tanstack/react-query'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { wrap } from 'styled-system/patterns'
import { token } from 'styled-system/tokens'
import { FavoriteButton } from './favorite-button'
import { useViewingAssetTileLinkProps } from './asset-viewing-overlay'
import type { CSSProperties } from 'react'
import type { AlbumKey } from '@/domain/album/album.schema'
import {
  AssetTile,
  AssetTileSkeleton,
} from '@/features/assets/components/asset-tile'
import { useSuspenseInfiniteAlbumAssets } from '@/features/albums/albums.queries'
import { CapturedCatchBoundary } from '@/components/errors/captured-errors'
import { Heading } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { BELOW_MD_QUERY } from '@/lib/breakpoints'
import { toAspectRatio, toAssetKeyString } from '@/domain/asset/asset.utils'

interface AlbumStripSectionProps {
  albumKey: AlbumKey
  title: string
  // set on the strip that starts in the viewport: its visible tiles load
  // eagerly
  startsInViewport?: boolean
}

const stripCss = css.raw({
  display: 'flex',
  gap: '3',
  listStyle: 'none',
  paddingInlineStart: '0',
  overflowX: 'auto',
  scrollbarThin: true,
  scrollSnapType: 'x proximity',
  paddingBottom: '2',
  '--strip-h': 'token(sizes.albumStripRow)',
  mdDown: { gap: '2', '--strip-h': 'token(sizes.albumStripRowNarrow)' },
})

const stripTileCss = css.raw({
  flex: '0 0 auto',
  scrollSnapAlign: 'start',
  height: 'var(--strip-h)',
  aspectRatio: 'var(--ar)',
})

const STRIP_ROW = parseFloat(token('sizes.albumStripRow'))
const STRIP_ROW_NARROW = parseFloat(token('sizes.albumStripRowNarrow'))

// strip tiles sit at a fixed height and never grow, so a tile renders at
// exactly its ratio times the row height
function stripTileImageGeometry(aspectRatio: number) {
  return {
    sizes: `${BELOW_MD_QUERY} ${Math.round(aspectRatio * STRIP_ROW_NARROW)}px, ${Math.round(aspectRatio * STRIP_ROW)}px`,
    maxSlotWidth: Math.round(aspectRatio * STRIP_ROW),
  }
}

// the widest the unscrolled strip can be: the content column. The count it
// yields also covers narrow screens, whose tiles shrink faster than their
// scrollport does.
const SCROLLPORT_MAX = 16 * parseFloat(token('sizes.contentMax'))

function eagerStripTileCount(aspectRatios: Array<number>) {
  let offset = 0
  let index = 0
  while (index < aspectRatios.length && offset < SCROLLPORT_MAX) {
    offset += aspectRatios[index] * STRIP_ROW
    index += 1
  }
  return index
}

export function AlbumStripSection({
  albumKey,
  title,
  startsInViewport,
}: AlbumStripSectionProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId}>
      <div
        className={wrap({
          justify: 'space-between',
          align: 'baseline',
          gap: '4',
          marginBottom: '4',
        })}
      >
        <Heading level={2} id={headingId} css={{ textStyle: 'title.md' }}>
          <span
            className={css({
              display: 'block',
              textStyle: 'meta',
              color: 'text.muted',
              marginBottom: '1',
            })}
          >
            editor’s picks
          </span>
          {title}
        </Heading>
        <Link
          to="/albums/$providerId/$albumId"
          params={{
            providerId: albumKey.providerId,
            albumId: albumKey.externalId,
          }}
          css={{ whiteSpace: 'nowrap' }}
        >
          See the album
        </Link>
      </div>
      <CapturedCatchBoundary
        resetKey={hashKey(['album-strip', albumKey])}
        message={`Couldn't load “${title}” right now.`}
        captureContext={{
          boundaryKind: 'catch',
          feature: 'home',
          operation: 'load_album_strip',
        }}
      >
        <Suspense fallback={<AlbumStripSkeleton />}>
          <AlbumStripItems
            albumKey={albumKey}
            startsInViewport={startsInViewport}
          />
        </Suspense>
      </CapturedCatchBoundary>
    </section>
  )
}

function AlbumStripItems({
  albumKey,
  startsInViewport,
}: {
  albumKey: AlbumKey
  startsInViewport?: boolean
}) {
  const tileLinkProps = useViewingAssetTileLinkProps()
  const { data } = useSuspenseInfiniteAlbumAssets(albumKey)
  const eagerCount = startsInViewport
    ? eagerStripTileCount(data.items.map((item) => toAspectRatio(item.image)))
    : 0
  return (
    <ul
      // Safari drops list semantics with list-style: none
      role="list"
      className={css(stripCss)}
    >
      {data.items.map((item, index) => (
        <li
          key={toAssetKeyString(item.key)}
          style={
            {
              '--ar': toAspectRatio(item.image).toFixed(4),
            } as CSSProperties
          }
          className={css(stripTileCss)}
        >
          <AssetTile
            assetPreview={item}
            {...stripTileImageGeometry(toAspectRatio(item.image))}
            loading={index < eagerCount ? undefined : 'lazy'}
            actions={<FavoriteButton assetKey={item.key} />}
            linkProps={tileLinkProps(item)}
            className={css({ width: '100%', height: '100%' })}
          />
        </li>
      ))}
    </ul>
  )
}

function AlbumStripSkeleton() {
  return (
    <ul role="list" aria-hidden="true" className={css(stripCss)}>
      {Array.from({ length: 8 }, (_, index) => (
        <li
          key={index}
          style={{ '--ar': '1' } as CSSProperties}
          className={css(stripTileCss)}
        >
          <AssetTileSkeleton
            className={css({ width: '100%', height: '100%' })}
          />
        </li>
      ))}
    </ul>
  )
}
