import { css } from 'styled-system/css'
import { stack } from 'styled-system/patterns'
import type { ReactNode } from 'react'
import type { Asset } from '@/domain/asset/asset.schema'
import { Heading } from '@/components/ui/heading'
import { PROVIDER_DISPLAY } from '@/domain/provider/provider.schema'

// the route measures the height off the viewport; the sheet already bounds it
export type AssetDetailHeightModel = 'viewport' | 'container'

// a floor, not a fixed height: a long title moves the caption, never overlaps
const boxCss = css.raw({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  width: '100%',
  maxWidth: 'contentMax',
  marginInline: 'auto',
  paddingInline: '4',
  flexShrink: 0,
})

const viewportBoxCss = css(boxCss, {
  // the header and page padding sit above it; the last term leaves a sliver of
  // prose showing. Short viewports take the proportion instead.
  minHeight:
    'max(60dvh, calc(100dvh - token(sizes.stickyHeader) - token(spacing.4) - token(spacing.8)))',
})

const containerBoxCss = css(boxCss, {
  minHeight: '100%',
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
        </div>
      </div>
      <div
        className={stack({
          gap: '4',
          alignItems: 'center',
          width: '100%',
          maxWidth: 'contentMax',
          marginInline: 'auto',
          paddingInline: '4',
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
