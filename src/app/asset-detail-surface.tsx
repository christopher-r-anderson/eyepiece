import { CatchBoundary } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import type { ReactNode } from 'react'
import type { Asset } from '@/domain/asset/asset.schema'
import { AssetDetail } from '@/features/assets/components/asset-detail'
import { MetadataDisclosure } from '@/features/assets/components/metadata-disclosure'
import { Heading } from '@/components/ui/heading'
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
        className={grid({
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gridTemplateAreas: '"back actions" "title title"',
          alignItems: 'center',
          rowGap: '3',
          columnGap: '3',
          alignSelf: 'stretch',
          width: '100%',
          maxWidth: 'contentMax',
          marginInline: 'auto',
          paddingTop: '2',
          paddingInline: '4',
          paddingBottom: 0,
          containerType: 'inline-size',
          '@/2xl': {
            gridTemplateColumns: 'auto minmax(0, 1fr) auto',
            gridTemplateAreas: '"back title actions"',
            columnGap: '4',
            rowGap: '2',
          },
        })}
      >
        {back}
        <div
          className={css({
            gridArea: 'title',
            minWidth: 0,
            textAlign: 'center',
          })}
        >
          <Heading
            level={titleLevel}
            css={css.raw({
              minWidth: 0,
              overflowWrap: 'anywhere',
            })}
          >
            {asset.title}
          </Heading>
        </div>
        <div
          className={css({
            gridArea: 'actions',
            justifySelf: 'end',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2',
          })}
        >
          {actions}
        </div>
      </div>
      <AssetDetail asset={asset} />
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
