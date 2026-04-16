import { DETAIL_SPLIT_MIN_WIDTH } from '../../../../lib/breakpoints'
import type { Asset } from '@/domain/asset/asset.schema'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

export function AssetDetail({ asset }: { asset: Asset }) {
  return (
    <div
      css={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        alignSelf: 'stretch',
        width: '100%',
        maxWidth: 'var(--size-content-max)',
        margin: '0 auto',
        paddingInline: 'var(--space-4)',
        containerType: 'inline-size',
        [`@container (min-width: ${DETAIL_SPLIT_MIN_WIDTH})`]: {
          flexDirection: 'row',
        },
      }}
    >
      {/*
          title as alt: it isn't ideal since it is in the h1 and not primarily describe-what-is-in-the-image
          but there isn't specific data for that, it *often does* describe what you can see in the image
          and the image is the focus of the page, not decorative so an empty alt doesn't seem appropriate either.
          Description is potentially paragraphs of content going beyond what is in the image.
          Revisit if there is feedback.
        */}
      <img
        css={{
          width: '100%',
          maxWidth: '100%',
          maxHeight: '65vh',
          height: 'auto',
          objectFit: 'scale-down',
          minHeight: '300px',
          position: 'static',
          alignSelf: 'stretch',
          viewTransitionName: `asset-${toAssetKeyString(asset.key)}`,
          [`@container (min-width: ${DETAIL_SPLIT_MIN_WIDTH})`]: {
            width: 'auto',
            position: 'sticky',
            top: 'var(--space-6)',
            alignSelf: 'flex-start',
          },
        }}
        src={asset.image.href}
        alt={asset.title}
        width={asset.image.width}
        height={asset.image.height}
      />
      <figcaption>
        <div
          css={{
            maxWidth: 'calc(clamp(45ch, 90%, 75ch) + 1rem)',
            margin: 0,
            lineHeight: 'var(--line-height-base)',
            whiteSpace: 'pre-line',
          }}
        >
          {asset.description}
        </div>
      </figcaption>
    </div>
  )
}
