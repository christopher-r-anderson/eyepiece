import type { Asset } from '@/domain/asset/asset.schema'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

export function AssetDetail({ asset }: { asset: Asset }) {
  return (
    <div
      css={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        marginInline: '2rem',
        maxWidth: '1200px',
        '@media (min-width: 1024px)': {
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
          maxWidth: '100%',
          maxHeight: '65vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'scale-down',
          minHeight: '300px',
          position: 'sticky',
          top: '2rem',
          alignSelf: 'flex-start',
          viewTransitionName: `asset-${toAssetKeyString(asset.key)}`,
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
            margin: 'auto',
            lineHeight: '1.5',
            whiteSpace: 'pre-line',
          }}
        >
          {asset.description}
        </div>
      </figcaption>
    </div>
  )
}
