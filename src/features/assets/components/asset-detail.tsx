import { css } from 'styled-system/css'
import { stack } from 'styled-system/patterns'
import type { Asset } from '@/domain/asset/asset.schema'

export function AssetDetail({ asset }: { asset: Asset }) {
  return (
    <div
      className={stack({
        gap: '6',
        alignSelf: 'stretch',
        width: '100%',
        maxWidth: 'contentMax',
        margin: '0 auto',
        paddingInline: '4',
        containerType: 'inline-size',
        '@/4xl': {
          flexDirection: 'row',
        },
      })}
    >
      {/*
          the title stands in when a provider has no text alternative: an empty
          alt would drop the image out of the accessibility tree, which costs
          more on a page whose subject is the image
        */}
      <img
        className={css({
          width: '100%',
          maxWidth: '100%',
          maxHeight: '65vh',
          height: 'auto',
          objectFit: 'scale-down',
          minHeight: '300px',
          position: 'static',
          alignSelf: 'stretch',
          '@/4xl': {
            width: 'auto',
            position: 'sticky',
            top: '6',
            alignSelf: 'flex-start',
          },
        })}
        src={asset.image.href}
        alt={asset.alt ?? asset.title}
        width={asset.image.width}
        height={asset.image.height}
      />
      {asset.description && (
        <div
          className={css({
            maxWidth: 'calc(clamp(45ch, 90%, token(sizes.readingMax)) + 1rem)',
            lineHeight: 'base',
            whiteSpace: 'pre-line',
          })}
        >
          {asset.description}
        </div>
      )}
    </div>
  )
}
