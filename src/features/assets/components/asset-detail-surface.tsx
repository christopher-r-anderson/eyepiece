import { css } from 'styled-system/css'
import { wrap } from 'styled-system/patterns'
import { AssetDetail } from './asset-detail'
import { MetadataDisclosure } from './metadata-disclosure'
import type { ReactNode } from 'react'
import type { Asset } from '@/domain/asset/asset.schema'
import type { AssetDetailHeightModel } from './asset-detail'
import { CapturedCatchBoundary } from '@/components/errors/captured-errors'
import { Heading } from '@/components/ui/heading'
import { providerSupportsMetadata } from '@/domain/provider/provider.schema'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

// the sheet body is a bare full-width scroller, so the surface owns its
// content column in both hosts
const surfaceCss = css.raw({
  width: '100%',
  maxWidth: 'contentMax',
  marginInline: 'auto',
  paddingInline: '4',
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
  flexShrink: 0,
})

// The full detail page minus app chrome, shared by the detail route and
// the list overlay.
export function AssetDetailSurface({
  asset,
  titleLevel,
  heightModel,
  back,
  actions,
  albumList,
}: {
  asset: Asset
  titleLevel: 1 | 2
  heightModel: AssetDetailHeightModel
  back?: ReactNode
  actions?: ReactNode
  // threaded from the route level; features must not import other features
  albumList?: ReactNode
}) {
  const canViewMetadata = providerSupportsMetadata(asset.key.providerId)
  return (
    <div className={css(surfaceCss)}>
      <AssetDetail
        asset={asset}
        titleLevel={titleLevel}
        heightModel={heightModel}
        chrome={
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '3',
              flexShrink: 0,
            })}
          >
            {back}
            <div
              className={css({
                marginInlineStart: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2',
              })}
            >
              {actions}
            </div>
          </div>
        }
      />
      {albumList && (
        <section
          className={wrap({ align: 'baseline', columnGap: '3', rowGap: '1' })}
        >
          <Heading
            level={titleLevel === 1 ? 2 : 3}
            css={{
              color: 'text.muted',
              fontSize: 'base',
              fontWeight: 600,
            }}
          >
            Albums
          </Heading>
          {albumList}
        </section>
      )}
      {canViewMetadata && (
        <MetadataDisclosure
          assetKey={asset.key}
          headingLevel={titleLevel === 1 ? 2 : 3}
          errorBoundary={(children) => (
            <CapturedCatchBoundary
              resetKey={toAssetKeyString(asset.key)}
              message="Couldn't load metadata."
              captureContext={{
                boundaryKind: 'catch',
                feature: 'assets',
                providerId: asset.key.providerId,
                operation: 'load_metadata',
              }}
            >
              {children}
            </CapturedCatchBoundary>
          )}
        />
      )}
    </div>
  )
}
