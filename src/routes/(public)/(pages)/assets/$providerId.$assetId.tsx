import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { FavoriteButton } from '../-components/favorite-button'
import { MetadataButton } from './-components/metadata/button'
import { AssetDetail } from './-components/asset-detail'
import { Heading } from '@/components/ui/heading'
import { getTitleText } from '@/lib/utils'
import { ensureAsset, useSuspenseAsset } from '@/features/assets/assets.queries'
import { Link } from '@/components/ui/link'
import {
  assetKeySchema,
  externalAssetIdSchema,
} from '@/domain/asset/asset.schema'
import { RouteError } from '@/app/layout/route-error'
import {
  providerIdSchema,
  providerSupportsMetadata,
} from '@/domain/provider/provider.schema'

function AssetHeading({ name = 'Asset' }: { name?: string }) {
  return (
    <Heading
      level={1}
      css={css.raw({
        minWidth: 0,
        overflowWrap: 'anywhere',
      })}
    >
      {name}
    </Heading>
  )
}

// mirrors the button recipe's ghost variant - a Link can't be a RAC Button,
// and recipe classes lose to the ui Link's own utility styles by layer order
const assetHeaderBackCss = css.raw(
  {
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    color: 'primary.textMuted',
    _hovered: {
      color: 'text',
      border:
        '1px solid color-mix(in oklab, token(colors.border) 88%, token(colors.text) 12%)',
      backgroundColor:
        'color-mix(in oklab, token(colors.tertiary.bg) 72%, token(colors.background) 28%)',
    },
  },
  {
    gridArea: 'back',
    justifySelf: 'start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    minHeight: 'controlHeightSm',
    paddingBlock: '2',
    paddingInline: '3',
    borderRadius: 'md',
    fontWeight: 600,
    lineHeight: 'tight',
    _hovered: {
      textDecoration: 'none',
    },
  },
)

export const Route = createFileRoute(
  '/(public)/(pages)/assets/$providerId/$assetId',
)({
  component: AssetPage,
  params: {
    parse: (raw) => {
      const { providerId, assetId } = raw
      return {
        providerId: providerIdSchema.parse(providerId),
        assetId: externalAssetIdSchema.parse(assetId),
      }
    },
  },
  beforeLoad: ({ params }) => {
    const assetKey = assetKeySchema.parse({
      providerId: params.providerId,
      externalId: params.assetId,
    })
    return { assetKey }
  },
  loader: async ({ context: { assetKey, queryClient, eyepieceClient } }) => {
    const asset = await ensureAsset({ assetKey, queryClient, eyepieceClient })
    return {
      title: asset.title,
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: getTitleText(loaderData?.title || 'NASA Media') }],
  }),
  errorComponent: AssetRouteError,
  pendingComponent: () => (
    <>
      <AssetHeading />
      <p>Loading asset...</p>
    </>
  ),
})

function AssetRouteError({ error }: { error: unknown }) {
  const { providerId } = Route.useParams()

  return (
    <RouteError
      error={error}
      heading={<AssetHeading />}
      message="Error loading asset."
      captureContext={{
        boundaryKind: 'route',
        feature: 'assets',
        providerId,
        operation: 'load_asset',
      }}
    />
  )
}

function AssetPage() {
  const { assetKey } = Route.useRouteContext()
  const { data } = useSuspenseAsset(assetKey)
  const canViewMetadata = providerSupportsMetadata(assetKey.providerId)
  const returnUrl = useRouterState({
    select: (s) => s.resolvedLocation?.state.returnUrl,
  })
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
        {returnUrl && (
          <Link
            to={returnUrl}
            aria-label="Back to search results"
            css={assetHeaderBackCss}
          >
            <ArrowLeftIcon aria-hidden="true" size={18} />
            <span>Back</span>
          </Link>
        )}
        <div
          className={css({
            gridArea: 'title',
            minWidth: 0,
            textAlign: 'center',
          })}
        >
          <AssetHeading name={data.title} />
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
          <FavoriteButton assetKey={assetKey} />
          {canViewMetadata ? (
            <MetadataButton
              assetKey={assetKey}
              css={css.raw({
                minWidth: 'controlHeightSm',
                minHeight: 'controlHeightSm',
              })}
            />
          ) : null}
        </div>
      </div>
      <AssetDetail asset={data} />
    </>
  )
}
