import {
  createFileRoute,
  notFound,
  useRouterState,
} from '@tanstack/react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { FavoriteButton } from '../-components/favorite-button'
import { AddToCollectionButton } from '@/app/add-to-collection-button'
import { AlbumLinkList } from '@/features/albums/components/album-link-list'
import { AssetDetailSurface } from '@/features/assets/components/asset-detail-surface'
import { Heading } from '@/components/ui/heading'
import { getTitleText } from '@/lib/utils'
import { socialMeta } from '@/lib/social-meta'
import { toSocialImage } from '@/domain/asset/asset.utils'
import { ensureAsset, useSuspenseAsset } from '@/features/assets/assets.queries'
import { Link } from '@/components/ui/link'
import {
  assetKeySchema,
  externalAssetIdSchema,
} from '@/domain/asset/asset.schema'
import { NotFound } from '@/components/errors/not-found'
import { LoadingNotice } from '@/components/loading-notice'
import { RouteError } from '@/app/layout/route-error'
import { isNotFoundApiError } from '@/lib/eyepiece-api-client/client'
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
    try {
      const asset = await ensureAsset({ assetKey, queryClient, eyepieceClient })
      return {
        title: asset.title,
        description: asset.description,
        image: asset.image,
      }
    } catch (error) {
      if (isNotFoundApiError(error)) {
        throw notFound()
      }
      throw error
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: getTitleText(loaderData?.title || 'NASA Media') },
      ...(loaderData
        ? socialMeta({
            title: loaderData.title,
            description: loaderData.description,
            image: loaderData.image && toSocialImage(loaderData.image),
          })
        : []),
    ],
  }),
  errorComponent: AssetRouteError,
  notFoundComponent: () => (
    <NotFound title="Asset not found" message="We couldn't find that asset." />
  ),
  pendingComponent: () => (
    <>
      <AssetHeading />
      <LoadingNotice>Loading asset…</LoadingNotice>
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
      heightModel="viewport"
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
          <FavoriteButton assetKey={assetKey} variant="detail" />
          <AddToCollectionButton assetKey={assetKey} variant="detail" />
        </>
      }
      albumList={
        data.albums?.length ? (
          <AlbumLinkList albums={data.albums} inline />
        ) : undefined
      }
    />
  )
}
