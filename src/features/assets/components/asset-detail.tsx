import { css } from 'styled-system/css'
import { stack } from 'styled-system/patterns'
import type { Asset } from '@/domain/asset/asset.schema'
import { Heading } from '@/components/ui/heading'

// Max constraints only: the box is the picture at any aspect ratio, so the
// title sits directly beneath it. The reserve covers the chrome above, the
// title, and the sliver of description left peeking as a scroll cue.
const imageCss = css({
  maxWidth: '100%',
  maxHeight: 'calc(100dvh - 19rem)',
  width: 'auto',
  height: 'auto',
  objectFit: 'contain',
})

const titleCss = css({
  textStyle: 'display.sm',
  textAlign: 'center',
  textWrap: 'balance',
  maxWidth: '40ch',
  overflowWrap: 'anywhere',
})

const descriptionCss = css({
  maxWidth: 'readingMax',
  color: 'text.muted',
  lineHeight: 'base',
  whiteSpace: 'pre-line',
})

export function AssetDetail({
  asset,
  titleLevel,
}: {
  asset: Asset
  titleLevel: 1 | 2
}) {
  return (
    <div
      className={stack({
        gap: '4',
        alignItems: 'center',
        width: '100%',
        maxWidth: 'contentMax',
        margin: '0 auto',
        paddingInline: '4',
      })}
    >
      {/*
          the title stands in when a provider has no text alternative: an empty
          alt would drop the image out of the accessibility tree, which costs
          more on a page whose subject is the image
        */}
      <img
        className={imageCss}
        src={asset.image.href}
        alt={asset.alt ?? asset.title}
        width={asset.image.width}
        height={asset.image.height}
      />
      <Heading level={titleLevel} className={titleCss}>
        {asset.title}
      </Heading>
      {asset.description && (
        <p className={descriptionCss}>{asset.description}</p>
      )}
    </div>
  )
}
