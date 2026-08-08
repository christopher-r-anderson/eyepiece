import { useLocation } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
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
  relatedLinks?: ReactNode
  // revealed with the veil on hover/focus
  actions?: ReactNode
  // shown unconditionally, outside the reveal rules: owner-management
  // controls (remove, undo) have no overlay equivalent on any device
  persistentActions?: ReactNode
  // ghost tiles keep their markup but must not navigate or take focus
  isLinkDisabled?: boolean
  linkProps?: TileLinkProps
}

const Thumbnail = ({
  assetPreview,
  sizes,
  isLinkDisabled,
  linkProps,
}: {
  assetPreview: AssetPreview
  sizes: string
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
      css={css.raw({
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
      })}
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
          srcSet={toSrcSet(assetPreview.image)}
          sizes={sizes}
          alt=""
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
  // touch grids stay bare (photo-grid convention); the detail overlay
  // carries the title and every control. display, not opacity: tap focus
  // must not flash the veil through :focus-within. pointer: coarse, the
  // same predicate as the controlHeight bump - hover: none would also
  // catch pointerless environments (headless Firefox reports no pointer
  // devices at all, which broke its e2e project)
  '@media (pointer: coarse)': {
    '& [data-tile-reveal]': {
      display: 'none',
    },
  },
})

export function AssetTile({
  assetPreview,
  sizes,
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
        isLinkDisabled={isLinkDisabled}
        linkProps={linkProps}
      />
      {relatedLinks && (
        <div
          data-tile-reveal
          data-tile-controls
          className={css({
            position: 'absolute',
            top: '2',
            left: '2',
            // leaves the action pill's corner alone: its cluster is the
            // 28px star box plus a controlHeightSm square with the pill
            // padding and gaps around them
            maxWidth:
              'calc(100% - token(sizes.controlHeightSm) - 28px - (6 * token(spacing.2)))',
            paddingBlock: '1',
            paddingInline: '2',
            backgroundColor: 'assetTile.captionBg',
            color: 'assetTile.captionText',
            fontSize: 'xs',
            opacity: 0,
            translate: '0 -4px',
            pointerEvents: 'none',
            transitionFast: 'opacity, translate',
            _motionReduce: {
              transition: 'none',
              translate: '0 0',
            },
          })}
        >
          {relatedLinks}
        </div>
      )}
      {actions && (
        <div
          data-tile-reveal
          data-tile-controls
          className={flex({
            position: 'absolute',
            top: '2',
            right: '2',
            alignItems: 'center',
            // keeps adjacent controls' extended hit areas out of each
            // other's visible squares
            gap: '2',
            padding: '1',
            backgroundColor: 'assetTile.captionBg',
            color: 'assetTile.captionText',
            opacity: 0,
            translate: '0 -4px',
            pointerEvents: 'none',
            transitionFast: 'opacity, translate',
            _motionReduce: {
              transition: 'none',
              translate: '0 0',
            },
          })}
        >
          {actions}
        </div>
      )}
      {persistentActions && (
        <div
          className={flex({
            position: 'absolute',
            top: '2',
            right: '2',
            alignItems: 'center',
            gap: '2',
            padding: '1',
            backgroundColor: 'assetTile.captionBg',
            color: 'assetTile.captionText',
          })}
        >
          {persistentActions}
        </div>
      )}
      <div
        data-tile-reveal
        // clicks over the veil fall through to the link
        className={flex({
          position: 'absolute',
          insetInline: 0,
          bottom: 0,
          alignItems: 'center',
          paddingBlock: '2',
          paddingInline: '3',
          backgroundColor: 'assetTile.captionBg',
          color: 'assetTile.captionText',
          opacity: 0,
          translate: '0 4px',
          pointerEvents: 'none',
          transitionFast: 'opacity, translate',
          _motionReduce: {
            transition: 'none',
            translate: '0 0',
          },
        })}
      >
        <p
          // the thumbnail link already exposes the title via aria-label;
          // this is its visible echo
          aria-hidden="true"
          className={css({
            flex: 1,
            minWidth: 0,
            fontSize: 'sm',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          })}
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
