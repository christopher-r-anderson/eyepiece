import { useState } from 'react'
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
import { toAssetKeyString } from '@/domain/asset/asset.utils'

interface AssetTileProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  assetPreview: AssetPreview
  relatedLinks?: ReactNode
  actions?: ReactNode
}

const Thumbnail = ({ assetPreview }: { assetPreview: AssetPreview }) => {
  const [detailClicked, setDetailClicked] = useState<boolean>(false)
  const { href } = useLocation()
  return (
    <Link
      to="/assets/$providerId/$assetId"
      params={{
        providerId: assetPreview.key.providerId,
        assetId: assetPreview.key.externalId,
      }}
      state={(prev) => ({ ...prev, returnUrl: href })}
      onClick={() => setDetailClicked(true)}
      // the visible title sits in the veil outside the link
      aria-label={assetPreview.title}
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
      <img
        className={css({
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          viewTransitionClass: 'asset-image',
        })}
        style={{
          viewTransitionName: detailClicked
            ? `asset-${toAssetKeyString(assetPreview.key)}`
            : undefined,
        }}
        src={assetPreview.thumbnail.href}
        alt=""
        width={assetPreview.thumbnail.width}
        height={assetPreview.thumbnail.height}
      />
    </Link>
  )
}

const containerCss = css.raw({
  position: 'relative',
  backgroundColor: 'assetTile.bg',
  aspectRatio: '1 / 1',
  overflow: 'hidden',
  '&:is(:hover, :focus-within) [data-tile-veil]': {
    opacity: 1,
    translate: '0 0',
  },
})

export function AssetTile({
  assetPreview,
  relatedLinks,
  actions,
  className,
  ...props
}: AssetTileProps) {
  return (
    <div className={cx(css(containerCss), className)} {...props}>
      <Thumbnail assetPreview={assetPreview} />
      <div
        data-tile-veil
        // clicks over the veil fall through to the link; only its
        // controls take the pointer back
        className={flex({
          position: 'absolute',
          insetInline: 0,
          bottom: 0,
          alignItems: 'center',
          gap: '2',
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
        <div className={css({ flex: 1, minWidth: 0 })}>
          <p
            className={css({
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
          {relatedLinks && (
            <div
              className={css({
                fontSize: 'xs',
                pointerEvents: 'auto',
                display: 'inline-block',
              })}
            >
              {relatedLinks}
            </div>
          )}
        </div>
        {actions && (
          <div
            className={flex({
              pointerEvents: 'auto',
              flexShrink: 0,
              alignItems: 'center',
            })}
          >
            {actions}
          </div>
        )}
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
