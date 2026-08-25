import { css } from 'styled-system/css'
import { stack } from 'styled-system/patterns'
import { token } from 'styled-system/tokens'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
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
  width: 'full',
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  flexShrink: 0,
})

const viewportBoxCss = css(boxCss, {
  // the header and page padding sit above it; the last term leaves a sliver of
  // prose showing. Short viewports take the proportion instead.
  minHeight:
    '[max(60dvh, calc(100dvh - token(sizes.stickyHeader) - token(spacing.4) - token(spacing.8)))]',
})

const containerBoxCss = css(boxCss, {
  // floored against the sheet scrollport so expanding the metadata cannot
  // reflow the viewer; the last term leaves the prose sliver
  minHeight: '[calc(100cqh - token(spacing.8))]',
})

const viewerCss = css({
  flex: '1',
  minHeight: '0',
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
const DETAIL_IMAGE_HEIGHT_LIMIT = token('sizes.detailImageHeightLimit')
const ASPECT_RATIO_RELATIVE_TOLERANCE = 0.01

type AspectRatioStyle = CSSProperties & { '--ar': string }

function aspectRatioStyle(aspectRatio: number): AspectRatioStyle {
  return { '--ar': aspectRatio.toFixed(4) }
}

// a portrait is bounded by the height instead, so its share is the ratio
// times imageCss's height limit. Dynamic viewport units work directly in the
// sizes hint, so it follows the same approximate composition budget.
function detailImageSizes(aspectRatio: number) {
  const heightBound = `calc(${DETAIL_IMAGE_HEIGHT_LIMIT} * ${aspectRatio.toFixed(4)})`
  return `(max-width: ${CONTENT_MAX}rem) min(calc(100vw - ${PADDING}rem), ${heightBound}), min(${CONTENT_MAX - PADDING}rem, ${heightBound})`
}

// The provider ratio reserves the box before image bytes arrive. React swaps
// in a materially different decoded ratio after hydration so the rendered
// geometry recovers from bad provider dimensions. Responsive candidate hints
// remain provider-based; the stable width-driven model keeps those candidates
// from deciding the rendered size in WebKit.
const imageCss = css({
  width: '[min(100%, calc(token(sizes.detailImageHeightLimit) * var(--ar)))]',
  height: 'auto',
  aspectRatio: 'var(--ar)',
  objectFit: 'contain',
})

function measuredAspectRatio(element: HTMLImageElement | null) {
  if (!element || element.naturalWidth <= 0 || element.naturalHeight <= 0) {
    return null
  }
  return element.naturalWidth / element.naturalHeight
}

type IntrinsicRatio = { src: string; value: number }

function aspectRatiosAgree(a: number, b: number) {
  return Math.abs(a / b - 1) <= ASPECT_RATIO_RELATIVE_TOLERANCE
}

function reconciledIntrinsicRatio(
  current: IntrinsicRatio | null,
  element: HTMLImageElement | null,
  src: string,
  providerRatio: number,
) {
  const value = measuredAspectRatio(element)
  // Master metadata and resized renditions commonly differ by a rounded
  // pixel. Only reconcile differences large enough to affect the layout.
  if (value === null) return current
  if (aspectRatiosAgree(value, providerRatio)) {
    return current?.src === src ? null : current
  }
  if (current?.src === src && aspectRatiosAgree(current.value, value)) {
    return current
  }
  return { src, value }
}

function DetailImage({
  asset,
  image,
}: {
  asset: Asset
  image: NonNullable<Asset['image']>
}) {
  const src = toFallbackSrc(image)
  const imageRef = useRef<HTMLImageElement>(null)
  const [intrinsicRatio, setIntrinsicRatio] = useState<IntrinsicRatio | null>(
    null,
  )
  const providerRatio = toAspectRatio(image)
  const usesIntrinsicRatio = intrinsicRatio?.src === src
  const aspectRatio = usesIntrinsicRatio ? intrinsicRatio.value : providerRatio

  // React does not replay a load event that fires before hydration. Reconcile
  // the initially decoded element afterward so a warm-cache visit still
  // replaces bad provider dimensions. Later sources reconcile through load.
  useEffect(() => {
    const element = imageRef.current
    if (element?.complete) {
      setIntrinsicRatio((current) =>
        reconciledIntrinsicRatio(current, element, src, providerRatio),
      )
    }
    // This is a hydration-only check and intentionally captures the first
    // source. Re-running it after a src change could measure the old bitmap.
  }, [])

  return (
    <img
      ref={imageRef}
      className={imageCss}
      style={aspectRatioStyle(aspectRatio)}
      data-test-ratio-source={usesIntrinsicRatio ? 'intrinsic' : 'provider'}
      src={src}
      srcSet={toSrcSet(image, DETAIL_MAX_SLOT)}
      sizes={detailImageSizes(providerRatio)}
      // the LCP element on asset pages
      fetchPriority="high"
      decoding="async"
      onLoad={(event) => {
        const element = event.currentTarget
        setIntrinsicRatio((current) =>
          reconciledIntrinsicRatio(current, element, src, providerRatio),
        )
      }}
      alt={asset.alt ?? asset.title}
      width={image.width}
      height={image.height}
    />
  )
}

const titleCss = css({
  textStyle: 'display.sm',
  textAlign: 'center',
  textWrap: 'balance',
  maxWidth: '[40ch]',
  overflowWrap: 'anywhere',
  flexShrink: 0,
})

const sourceCss = css({
  textStyle: 'meta',
  color: 'text.muted',
  textAlign: 'center',
  textWrap: 'balance',
  '& a': {
    color: '[inherit]',
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
          {asset.image && <DetailImage asset={asset} image={asset.image} />}
          <Heading level={titleLevel} className={titleCss}>
            {asset.title}
          </Heading>
        </div>
      </div>
      <div
        className={stack({
          gap: '4',
          alignItems: 'center',
          width: 'full',
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
