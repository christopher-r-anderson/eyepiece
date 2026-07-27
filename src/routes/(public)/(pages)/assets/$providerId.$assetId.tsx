import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { FavoriteButton } from '../-components/favorite-button'
import { AddToCollectionButton } from '@/app/add-to-collection-button'
import { AssetDetailSurface } from '@/app/asset-detail-surface'
import { Heading } from '@/components/ui/heading'
import { getTitleText } from '@/lib/utils'
import { ensureAsset, useSuspenseAsset } from '@/features/assets/assets.queries'
import { Link } from '@/components/ui/link'
import {
  assetKeySchema,
  externalAssetIdSchema,
} from '@/domain/asset/asset.schema'
import { RouteError } from '@/app/layout/route-error'
import { providerIdSchema } from '@/domain/provider/provider.schema'

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

const assetHeaderBackCss = css.raw({
  gridArea: 'back',
  justifySelf: 'start',
})

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
  const returnUrl = useRouterState({
    select: (s) => s.resolvedLocation?.state.returnUrl,
  })
  return (
    <AssetDetailSurface
      asset={data}
      titleLevel={1}
      back={
        returnUrl && (
          <Link
            to={returnUrl}
            aria-label="Back to search results"
            variant="ghost"
            css={assetHeaderBackCss}
          >
            <ArrowLeftIcon aria-hidden="true" size={18} />
            <span>Back</span>
          </Link>
        )
      }
      actions={
        <>
          <FavoriteButton assetKey={assetKey} />
          <AddToCollectionButton assetKey={assetKey} variant="detail" />
        </>
      }
    />
  )
}
