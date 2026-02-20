import { useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import type { ComponentPropsWithRef, ComponentPropsWithoutRef } from 'react'
import type { AssetSummary } from '@/domain/asset/asset.schemas'
import { Link } from '@/components/ui/link'

interface AssetTileProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  asset: AssetSummary
  actions?: React.ReactNode
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
  fontSize: '0.9rem',
  backgroundColor: 'rgba(1, 1, 1, 0.5)',
  backdropFilter: 'blur(4px)',
  position: 'absolute' as const,
  padding: '0.5rem',
  bottom: 0,
  right: 0,
  left: 0,
}

const captionTextCss = {
  margin: 0,
  color: 'white',
  height: '2.2em',
  lineHeight: '1.1em',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical' as const,
  WebkitLineClamp: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const Thumbnail = ({ asset }: { asset: AssetSummary }) => {
  const [detailClicked, setDetailClicked] = useState<boolean>(false)
  const { href } = useLocation()
  return (
    <Link
      to="/assets/$assetId"
      params={{ assetId: asset.externalId }}
      state={(prev) => ({ ...prev, returnUrl: href })}
      onClick={() => setDetailClicked(true)}
      css={{
        width: '100%',
        height: '100%',
      }}
    >
      <figure css={figureCss}>
        <img
          css={thumbnailCss}
          style={{
            viewTransitionName: detailClicked ? `asset-${asset.id}` : undefined,
          }}
          src={asset.thumbnail.href}
          alt=""
          width={asset.thumbnail.width}
          height={asset.thumbnail.height}
        />
        <figcaption css={captionCss}>
          <p css={captionTextCss}>{asset.title}</p>
        </figcaption>
      </figure>
    </Link>
  )
}

const containerCss = {
  backgroundColor: 'black',
  padding: '0.5rem',
  borderRadius: '8px',
  position: 'relative' as const,
  display: 'flex',
  alignItems: 'center',
  aspectRatio: '1 / 1',
}

const albumListCss = {
  position: 'absolute' as const,
  top: '0.5rem',
  left: '0.5rem',
  listStyleType: 'none',
  margin: 0,
  padding: '0.25rem 0.5rem',
  border: '1px solid black',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  fontSize: '0.75rem',
}

const actionsBarCss = {
  position: 'absolute' as const,
  top: '0.5rem',
  right: '0.5rem',
  display: 'flex',
  justifyContent: 'flex-end',
}

export function AssetTile({ asset, actions, ...props }: AssetTileProps) {
  const albums = asset.albums || []
  return (
    <div css={containerCss} {...props}>
      <Thumbnail asset={asset} />
      {albums.length > 0 && (
        <ul css={albumListCss}>
          {albums.map((album) => (
            <li key={album}>
              <Link
                to="/albums/$albumId"
                params={{ albumId: album }}
                css={{ color: 'gray', textDecoration: 'underline' }}
              >
                {album}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {actions && <div css={actionsBarCss}>{actions}</div>}
    </div>
  )
}

export function AssetTileSkeleton(
  props: Omit<ComponentPropsWithoutRef<'div'>, 'children'>,
) {
  return <div css={containerCss} aria-hidden="true" {...props}></div>
}
