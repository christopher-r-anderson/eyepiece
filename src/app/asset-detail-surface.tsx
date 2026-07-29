import { CatchBoundary } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import type { ReactNode } from 'react'
import type { Asset } from '@/domain/asset/asset.schema'
import { AssetDetail } from '@/features/assets/components/asset-detail'
import { MetadataDisclosure } from '@/features/assets/components/metadata-disclosure'
import { CapturedAlertError } from '@/app/layout/route-error'
import { providerSupportsMetadata } from '@/domain/provider/provider.schema'
import { toAssetKeyString } from '@/domain/asset/asset.utils'

// The full detail page minus app chrome, shared by the detail route and
// the list overlay.
export function AssetDetailSurface({
  asset,
  titleLevel,
  back,
  actions,
}: {
  asset: Asset
  titleLevel: 1 | 2
  back?: ReactNode
  actions?: ReactNode
}) {
  const canViewMetadata = providerSupportsMetadata(asset.key.providerId)
  return (
    <>
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '3',
          alignSelf: 'stretch',
          width: '100%',
          maxWidth: 'contentMax',
          marginInline: 'auto',
          paddingTop: '2',
          paddingInline: '4',
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
      <AssetDetail asset={asset} titleLevel={titleLevel} />
      {canViewMetadata && (
        <MetadataDisclosure
          assetKey={asset.key}
          headingLevel={titleLevel === 1 ? 2 : 3}
          errorBoundary={(children) => (
            <CatchBoundary
              getResetKey={() => toAssetKeyString(asset.key)}
              errorComponent={({ error }) => (
                <CapturedAlertError
                  error={error}
                  message="Couldn't load metadata."
                  captureContext={{
                    boundaryKind: 'catch',
                    feature: 'assets',
                    providerId: asset.key.providerId,
                    operation: 'load_metadata',
                  }}
                />
              )}
            >
              {children}
            </CatchBoundary>
          )}
        />
      )}
    </>
  )
}
