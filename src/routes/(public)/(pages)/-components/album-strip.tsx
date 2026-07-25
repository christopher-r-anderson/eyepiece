import { Suspense } from 'react'
import { CatchBoundary } from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { useId } from 'react-aria'
import { css } from 'styled-system/css'
import { wrap } from 'styled-system/patterns'
import { FavoriteButton } from './favorite-button'
import type { CSSProperties } from 'react'
import type { AlbumKey } from '@/domain/album/album.schema'
import {
  AssetTile,
  AssetTileSkeleton,
} from '@/features/assets/components/asset-tile'
import { useSuspenseInfiniteAlbumAssets } from '@/features/albums/albums.queries'
import { CapturedAlertError } from '@/app/layout/route-error'
import { Heading } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

interface AlbumStripSectionProps {
  albumKey: AlbumKey
  title: string
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
  '--strip-h': '186px',
  mdDown: { gap: '2', '--strip-h': '138px' },
})

const stripTileCss = css.raw({
  flex: '0 0 auto',
  scrollSnapAlign: 'start',
  height: 'var(--strip-h)',
  aspectRatio: 'var(--ar)',
})

export function AlbumStripSection({ albumKey, title }: AlbumStripSectionProps) {
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
        <Heading
          level={2}
          id={headingId}
          css={css.raw({ textStyle: 'title.md' })}
        >
          <span
            className={css({
              display: 'block',
              fontFamily: 'mono',
              fontSize: 'mono',
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
          css={css.raw({ whiteSpace: 'nowrap' })}
        >
          See the album
        </Link>
      </div>
      <CatchBoundary
        getResetKey={() => hashKey(['album-strip', albumKey])}
        errorComponent={({ error }) => (
          <CapturedAlertError
            error={error}
            message={`Couldn't load “${title}” right now.`}
            captureContext={{
              boundaryKind: 'catch',
              feature: 'home',
              operation: 'load_album_strip',
            }}
          />
        )}
      >
        <Suspense fallback={<AlbumStripSkeleton />}>
          <AlbumStripItems albumKey={albumKey} />
        </Suspense>
      </CatchBoundary>
    </section>
  )
}

function AlbumStripItems({ albumKey }: { albumKey: AlbumKey }) {
  const { data } = useSuspenseInfiniteAlbumAssets(albumKey)
  return (
    <ul
      // Safari drops list semantics with list-style: none
      role="list"
      className={css(stripCss)}
    >
      {data.items.map((item) => (
        <li
          key={toAssetKeyString(item.key)}
          style={
            {
              '--ar': (item.thumbnail.width / item.thumbnail.height).toFixed(4),
            } as CSSProperties
          }
          className={css(stripTileCss)}
        >
          <AssetTile
            assetPreview={item}
            actions={<FavoriteButton assetKey={item.key} />}
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
