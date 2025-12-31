import { EyepieceAssetItem } from '@/lib/api/eyepiece/types'
import { NOT_FOUND_IMAGE } from '@/server/lib/util'
import { Link } from '@/components/ui/link'
import { ComponentPropsWithoutRef, ComponentPropsWithRef } from 'react'

interface ThumbnailProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  asset: EyepieceAssetItem
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

export function Thumbnail({ asset, ...props }: ThumbnailProps) {
  const albums = asset.albums || []
  const thumbnail = asset.thumbnail || NOT_FOUND_IMAGE
  return (
    <div css={containerCss} {...props}>
      <Link
        to="/assets/$assetId"
        params={{ assetId: asset.id }}
        css={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <figure css={figureCss}>
          <img
            css={{ maxWidth: '100%', height: 'auto' }}
            src={thumbnail.href}
            alt={asset.description}
            width={thumbnail.width}
            height={thumbnail.height}
          />
          <figcaption css={captionCss}>
            <p css={captionTextCss}>{asset.title}</p>
          </figcaption>
        </figure>
      </Link>
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
    </div>
  )
}

export function ThumbnailSkeleton(
  props: Omit<ComponentPropsWithoutRef<'div'>, 'children'>,
) {
  return <div css={containerCss} aria-hidden="true" {...props}></div>
}
