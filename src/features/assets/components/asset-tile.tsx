import { useLocation } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import type {
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  ReactNode,
} from 'react'
import type { AssetPreview } from '@/domain/asset/asset.schema'
import { Link } from '@/components/ui/link'
import {
  toAssetKeyString,
  toFallbackSrc,
  toSrcSet,
} from '@/domain/asset/asset.utils'

// navigation overrides for the primary link (target, state, mask);
// presentation props stay owned by the tile
export type TileLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  'children' | 'className' | 'style' | 'css'
>

interface AssetTileProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  assetPreview: AssetPreview
  // how wide this tile renders is the surface's layout to know, and a srcset
  // without it falls back to assuming the full viewport
  sizes: string
  // the widest CSS width the surface ever renders this tile at; bounds the
  // srcset candidates
  maxSlotWidth: number
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high'
  relatedLinks?: ReactNode
  actions?: ReactNode
  // never hidden: owner-management controls have no overlay equivalent
  persistentActions?: ReactNode
  // ghost tiles keep their markup but must not navigate or take focus
  isLinkDisabled?: boolean
  linkProps?: TileLinkProps
}

const Thumbnail = ({
  assetPreview,
  sizes,
  maxSlotWidth,
  loading,
  fetchPriority,
  isLinkDisabled,
  linkProps,
}: {
  assetPreview: AssetPreview
  sizes: string
  maxSlotWidth: number
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high'
  isLinkDisabled?: boolean
  linkProps?: TileLinkProps
}) => {
  const { href } = useLocation()
  return (
    <Link
      isDisabled={isLinkDisabled}
      to="/assets/$providerId/$assetId"
      params={{
        providerId: assetPreview.key.providerId,
        assetId: assetPreview.key.externalId,
      }}
      state={(prev) => ({ ...prev, returnUrl: href })}
      {...(linkProps as object | undefined)}
      data-asset-key={toAssetKeyString(assetPreview.key)}
      // the visible title sits in the veil outside the link
      aria-label={assetPreview.title}
      // the grid's row action opens the tile through this link so every
      // navigation shares one path
      data-tile-primary-link
      css={{
        width: '100%',
        height: '100%',
        display: 'block',
        position: 'relative',
        color: 'inherit',
        overflow: 'hidden',
        // the halo must paint above the thumbnail, so it lives on a pseudo
        // element; an inset shadow on the link would be covered by the image
        _focusVisible: {
          outline: 'focusRing',
          outlineOffset: '-2px',
          _after: {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            boxShadow: 'focusHalo',
          },
        },
      }}
    >
      {/* no renderable file leaves the tile's own background showing, the
          same as a skeleton */}
      {assetPreview.image && (
        <img
          className={css({
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          })}
          src={toFallbackSrc(assetPreview.image)}
          srcSet={toSrcSet(assetPreview.image, maxSlotWidth)}
          sizes={sizes}
          alt=""
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          width={assetPreview.image.width}
          height={assetPreview.image.height}
        />
      )}
    </Link>
  )
}

const containerCss = css.raw({
  position: 'relative',
  backgroundColor: 'assetTile.bg',
  aspectRatio: '1 / 1',
  overflow: 'hidden',
  containerType: 'inline-size',
  // the grid's roving focus lands on the ancestor row, not on the tile, so
  // the reveal also keys off a focused row - :focus-within on the tile
  // alone would miss keyboard navigation
  '&:is(:hover, :focus-within) [data-tile-reveal], [role="row"]:focus-within & [data-tile-reveal]':
    {
      opacity: 1,
      translate: '0 0',
    },
  // hidden controls must not be hit-testable: pointer-events re-enables
  // per element, so a tap on an unrevealed tile would hit the invisible
  // star instead of the link
  '&:is(:hover, :focus-within) [data-tile-controls], [role="row"]:focus-within & [data-tile-controls]':
    {
      pointerEvents: 'auto',
    },
  // display, not opacity: tap focus must not flash the bare touch grid's
  // veil through :focus-within
  _coarsePointer: {
    '& [data-tile-reveal]': {
      display: 'none',
    },
  },
})

// revealed by the containerCss selectors; blocks add their own resting
// translate for the slide direction
const revealCss = css.raw({
  opacity: 0,
  pointerEvents: 'none',
  transitionFast: 'opacity, translate',
  _motionReduce: {
    transition: 'none',
    translate: '0 0',
  },
})

const actionPillCss = css.raw({
  position: 'absolute',
  top: '2',
  right: '2',
  display: 'flex',
  alignItems: 'center',
  // keeps adjacent controls' extended hit areas out of each other's
  // visible squares
  gap: '2',
  padding: '1',
  backgroundColor: 'assetTile.captionBg',
  color: 'assetTile.captionText',
})

// the cluster (28px star box + controlHeightSm square + gaps, padding,
// and corner offsets) needs ~104px; narrow-row portrait tiles go below it
const NARROW_TILE_QUERY = '@container (max-width: 104px)'

const relatedLinksCss = css(revealCss, {
  position: 'absolute',
  top: '2',
  left: '2',
  // leaves the action pill's corner alone
  maxWidth:
    'calc(100% - token(sizes.controlHeightSm) - 28px - (6 * token(spacing.2)))',
  overflow: 'hidden',
  paddingBlock: '1',
  paddingInline: '2',
  backgroundColor: 'assetTile.captionBg',
  color: 'assetTile.captionText',
  fontSize: 'xs',
  translate: '0 -4px',
  [NARROW_TILE_QUERY]: {
    maxWidth: 'calc(100% - (2 * token(spacing.2)))',
  },
})

const revealedActionsCss = css(actionPillCss, revealCss, {
  translate: '0 -4px',
  [NARROW_TILE_QUERY]: {
    display: 'none',
  },
})

const persistentActionsCss = css(actionPillCss)

const veilCss = css(revealCss, {
  position: 'absolute',
  insetInline: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  paddingBlock: '2',
  paddingInline: '3',
  backgroundColor: 'assetTile.captionBg',
  color: 'assetTile.captionText',
  translate: '0 4px',
})

const titleCss = css({
  flex: 1,
  minWidth: 0,
  fontSize: 'sm',
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
})

export function AssetTile({
  assetPreview,
  sizes,
  maxSlotWidth,
  loading,
  fetchPriority,
  relatedLinks,
  actions,
  persistentActions,
  className,
  isLinkDisabled,
  linkProps,
  ...props
}: AssetTileProps) {
  return (
    <div className={cx(css(containerCss), className)} {...props}>
      <Thumbnail
        assetPreview={assetPreview}
        sizes={sizes}
        maxSlotWidth={maxSlotWidth}
        loading={loading}
        fetchPriority={fetchPriority}
        isLinkDisabled={isLinkDisabled}
        linkProps={linkProps}
      />
      {relatedLinks && (
        <div data-tile-reveal data-tile-controls className={relatedLinksCss}>
          {relatedLinks}
        </div>
      )}
      {actions && (
        <div data-tile-reveal data-tile-controls className={revealedActionsCss}>
          {actions}
        </div>
      )}
      {persistentActions && (
        <div data-tile-controls className={persistentActionsCss}>
          {persistentActions}
        </div>
      )}
      <div
        data-tile-reveal
        // clicks over the veil fall through to the link
        className={veilCss}
      >
        <p
          // the thumbnail link already exposes the title via aria-label;
          // this is its visible echo
          aria-hidden="true"
          className={titleCss}
        >
          {assetPreview.title}
        </p>
      </div>
    </div>
  )
}

export function AssetTileSkeleton({
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<'div'>, 'children'>) {
  return (
    <div
      className={cx(css(containerCss), className)}
      aria-hidden="true"
      {...props}
    ></div>
  )
}
