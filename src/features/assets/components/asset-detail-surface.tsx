import { css } from 'styled-system/css'
import { AssetDetail } from './asset-detail'
import { MetadataDisclosure } from './metadata-disclosure'
import type { ReactNode } from 'react'
import type { Asset } from '@/domain/asset/asset.schema'
import type { AssetDetailHeightModel } from './asset-detail'
import { CapturedCatchBoundary } from '@/components/errors/captured-errors'
import { providerSupportsMetadata } from '@/domain/provider/provider.schema'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

// The full detail page minus app chrome, shared by the detail route and
// the list overlay.
export function AssetDetailSurface({
  asset,
  titleLevel,
  heightModel,
  back,
  actions,
}: {
  asset: Asset
  titleLevel: 1 | 2
  heightModel: AssetDetailHeightModel
  back?: ReactNode
  actions?: ReactNode
}) {
  const canViewMetadata = providerSupportsMetadata(asset.key.providerId)
  return (
    <>
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
    </>
  )
}
