import { css } from 'styled-system/css'
import { stack } from 'styled-system/patterns'
import { token } from 'styled-system/tokens'
import type { ReactNode } from 'react'
import type { Asset } from '@/domain/asset/asset.schema'
import { Heading } from '@/components/ui/heading'
import { PROVIDER_DISPLAY } from '@/domain/provider/provider.schema'
import {
  toAspectRatio,
  toFallbackSrc,
  toSrcSet,
} from '@/domain/asset/asset.utils'

// the route measures the height off the viewport; the sheet already bounds it
export type AssetDetailHeightModel = 'viewport' | 'container'

// the surface's wrapper owns the content column
const boxCss = css.raw({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  flexShrink: 0,
})

const viewportBoxCss = css(boxCss, {
  // the header and page padding sit above it; the last term leaves a sliver of
  // prose showing. Short viewports take the proportion instead.
  minHeight:
    'max(60dvh, calc(100dvh - token(sizes.stickyHeader) - token(spacing.4) - token(spacing.8)))',
})

const containerBoxCss = css(boxCss, {
  // floored against the sheet scrollport so expanding the metadata cannot
  // reflow the viewer; the last term leaves the prose sliver
  minHeight: 'calc(100cqh - token(spacing.8))',
})

const viewerCss = css({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '4',
})

// contentMax less the surface wrapper's padding, which is as wide as the
// picture can get
const CONTENT_MAX = parseFloat(token('sizes.contentMax'))
const PADDING = 2 * parseFloat(token('spacing.4'))
const DETAIL_MAX_SLOT = 16 * (CONTENT_MAX - PADDING)

// a portrait is bounded by the height instead, so its share is the ratio
// times imageCss's maxHeight, with vh standing in for dvh since sizes
// resolves before layout
function detailImageSizes(aspectRatio: number) {
  const heightBound = `calc(max(45vh, 100vh - 19rem) * ${aspectRatio.toFixed(4)})`
  return `(max-width: ${CONTENT_MAX}rem) min(calc(100vw - ${PADDING}rem), ${heightBound}), min(${CONTENT_MAX - PADDING}rem, ${heightBound})`
}

// bounded by the viewport, not by what the title leaves. The subtraction
// covers the chrome above and a caption of a line or two.
const imageCss = css({
  maxWidth: '100%',
  maxHeight: 'max(45dvh, calc(100dvh - 19rem))',
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
  flexShrink: 0,
})

const sourceCss = css({
  textStyle: 'meta',
  color: 'text.muted',
  textAlign: 'center',
  textWrap: 'balance',
  '& a': {
    color: 'inherit',
    _hovered: { color: 'text' },
  },
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
  heightModel,
  chrome,
}: {
  asset: Asset
  titleLevel: 1 | 2
  heightModel: AssetDetailHeightModel
  chrome?: ReactNode
}) {
  return (
    <>
      <div
        className={
          heightModel === 'viewport' ? viewportBoxCss : containerBoxCss
        }
      >
        {chrome}
        <div className={viewerCss}>
          {/* an empty alt would drop the image out of the accessibility tree */}
          {asset.image && (
            <img
              className={imageCss}
              src={toFallbackSrc(asset.image)}
              srcSet={toSrcSet(asset.image, DETAIL_MAX_SLOT)}
              sizes={detailImageSizes(toAspectRatio(asset.image))}
              // the LCP element on asset pages
              fetchPriority="high"
              decoding="async"
              alt={asset.alt ?? asset.title}
              width={asset.image.width}
              height={asset.image.height}
            />
          )}
          <Heading level={titleLevel} className={titleCss}>
            {asset.title}
          </Heading>
        </div>
      </div>
      <div
        className={stack({
          gap: '4',
          alignItems: 'center',
          width: '100%',
        })}
      >
        <p className={sourceCss}>
          {PROVIDER_DISPLAY[asset.key.providerId].displayName}
          {asset.sourceUrl && (
            <>
              {' · '}
              <a href={asset.sourceUrl} target="_blank" rel="noreferrer">
                source record
              </a>
            </>
          )}
        </p>
        {asset.description && (
          <p className={descriptionCss}>{asset.description}</p>
        )}
      </div>
    </>
  )
}
