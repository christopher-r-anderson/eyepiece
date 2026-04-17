import { useState } from 'react'
import { useLocation } from '@tanstack/react-router'
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

const figureCss = {
  position: 'relative' as const,
  width: '100%',
  height: '100%',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}

const thumbnailCss = {
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'scale-down' as const,
  width: 'auto',
  height: 'auto',
  viewTransitionClass: 'asset-image',
}

const captionCss = {
  fontSize: 'var(--text-sm)',
  backgroundColor: 'var(--asset-tile-caption-bg)',
  backdropFilter: 'blur(4px)',
  position: 'absolute' as const,
  padding: 'var(--space-3)',
  bottom: 0,
  right: 0,
  left: 0,
}

const captionTextCss = {
  margin: 0,
  color: 'var(--asset-tile-caption-text)',
  height: '2.2em',
  lineHeight: '1.1em',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical' as const,
  WebkitLineClamp: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
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
      css={{
        width: '100%',
        height: '100%',
        display: 'block',
        color: 'inherit',
        borderRadius: 'calc(var(--radius-lg) - var(--space-2))',
        overflow: 'hidden',
        '&[data-focus-visible]': {
          outline: '1px solid var(--outline-color)',
          outlineOffset: '-2px',
        },
      }}
    >
      <figure css={figureCss}>
        <img
          css={thumbnailCss}
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
        <figcaption css={captionCss}>
          <p css={captionTextCss}>{assetPreview.title}</p>
        </figcaption>
      </figure>
    </Link>
  )
}

const containerCss = {
  backgroundColor: 'var(--asset-tile-bg)',
  padding: 'var(--space-2)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--asset-tile-border)',
  boxShadow: 'var(--shadow-sm)',
  position: 'relative' as const,
  display: 'flex',
  alignItems: 'center',
  aspectRatio: '1 / 1',
  overflow: 'hidden',
}

const relatedCss = {
  position: 'absolute' as const,
  top: 'var(--space-2)',
  left: 'var(--space-2)',
  margin: 0,
  padding: 'var(--space-1) var(--space-2)',
  border: '1px solid var(--asset-tile-badge-border)',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--asset-tile-badge-bg)',
  color: 'var(--asset-tile-badge-text)',
  backdropFilter: 'blur(6px)',
  boxShadow: 'var(--shadow-sm)',
  fontSize: 'var(--text-xs)',
}

const actionsBarCss = {
  position: 'absolute' as const,
  top: 'var(--space-1)',
  right: 'var(--space-1)',
  display: 'flex',
  justifyContent: 'flex-end',
  padding: 'var(--space-1)',
  backgroundColor: 'var(--asset-tile-action-bg)',
  color: 'var(--asset-tile-badge-text)',
  border: '1px solid var(--asset-tile-action-border)',
  borderRadius: 'var(--radius-md)',
  backdropFilter: 'blur(4px)',
}

export function AssetTile({
  assetPreview,
  relatedLinks,
  actions,
  ...props
}: AssetTileProps) {
  return (
    <div css={containerCss} {...props}>
      <Thumbnail assetPreview={assetPreview} />
      {relatedLinks && <div css={relatedCss}>{relatedLinks}</div>}
      {actions && <div css={actionsBarCss}>{actions}</div>}
    </div>
  )
}

export function AssetTileSkeleton(
  props: Omit<ComponentPropsWithoutRef<'div'>, 'children'>,
) {
  return <div css={containerCss} aria-hidden="true" {...props}></div>
}
