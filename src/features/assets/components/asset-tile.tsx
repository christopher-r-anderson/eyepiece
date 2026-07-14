import { useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { center, flex } from 'styled-system/patterns'
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
      css={css.raw({
        width: '100%',
        height: '100%',
        display: 'block',
        color: 'inherit',
        borderRadius: 'calc(token(radii.lg) - token(spacing.2))',
        overflow: 'hidden',
        _focusVisible: {
          outline: 'focusRing',
          outlineOffset: '-2px',
        },
      })}
    >
      <figure
        className={center({
          position: 'relative',
          width: '100%',
          height: '100%',
          margin: 0,
          overflow: 'hidden',
        })}
      >
        <img
          className={css({
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'scale-down',
            width: 'auto',
            height: 'auto',
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
        <figcaption
          className={css({
            fontSize: 'sm',
            backgroundColor: 'assetTile.captionBg',
            backdropFilter: 'blur(4px)',
            position: 'absolute',
            padding: '3',
            bottom: 0,
            right: 0,
            left: 0,
          })}
        >
          <p
            className={css({
              margin: 0,
              color: 'assetTile.captionText',
              height: '2.2em',
              lineHeight: '1.1em',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            })}
          >
            {assetPreview.title}
          </p>
        </figcaption>
      </figure>
    </Link>
  )
}

const containerCss = css.raw({
  backgroundColor: 'assetTile.bg',
  padding: '2',
  borderRadius: 'lg',
  border: '1px solid token(colors.assetTile.border)',
  boxShadow: 'sm',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  aspectRatio: '1 / 1',
  overflow: 'hidden',
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
      {relatedLinks && (
        <div
          className={css({
            position: 'absolute',
            top: '2',
            left: '2',
            margin: 0,
            paddingBlock: '1',
            paddingInline: '2',
            border: '1px solid token(colors.assetTile.badgeBorder)',
            borderRadius: 'sm',
            backgroundColor: 'assetTile.badgeBg',
            color: 'assetTile.badgeText',
            backdropFilter: 'blur(6px)',
            boxShadow: 'sm',
            fontSize: 'xs',
          })}
        >
          {relatedLinks}
        </div>
      )}
      {actions && (
        <div
          className={flex({
            position: 'absolute',
            top: '1',
            right: '1',
            justify: 'flex-end',
            padding: '1',
            backgroundColor: 'assetTile.actionBg',
            color: 'assetTile.badgeText',
            border: '1px solid token(colors.assetTile.actionBorder)',
            borderRadius: 'md',
            backdropFilter: 'blur(4px)',
          })}
        >
          {actions}
        </div>
      )}
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
