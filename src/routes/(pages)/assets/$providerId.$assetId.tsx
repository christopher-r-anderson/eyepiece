import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { COMPACT_LAYOUT_MIN_WIDTH } from '../../../lib/breakpoints'
import { FavoriteButton } from '../-components/favorite-button'
import { MetadataButton } from './-components/metadata/button'
import { AssetDetail } from './-components/asset-detail'
import { getTitleText } from '@/lib/utils'
import { ensureAsset, useSuspenseAsset } from '@/features/assets/assets.queries'
import { Link } from '@/components/ui/link'
import {
  assetKeySchema,
  externalAssetIdSchema,
} from '@/domain/asset/asset.schema'
import { PrettyException } from '@/components/ui/error'
import { providerIdSchema } from '@/domain/provider/provider.schema'

function AssetHeading({ name = 'Asset' }: { name?: string }) {
  return <h1>{name}</h1>
}

export const Route = createFileRoute('/(pages)/assets/$providerId/$assetId')({
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
  errorComponent: ({ error }) => (
    <>
      <AssetHeading />
      <p>Error loading asset.</p>
      <PrettyException error={error} headingLevel={1} />
    </>
  ),
  pendingComponent: () => (
    <>
      <AssetHeading />
      <p>Loading asset...</p>
    </>
  ),
})

function AssetPage() {
  const { assetKey } = Route.useRouteContext()
  const { data } = useSuspenseAsset(assetKey)
  const returnUrl = useRouterState({
    select: (s) => s.resolvedLocation?.state.returnUrl,
  })
  return (
    <>
      <div
        css={{
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          justifyContent: 'start',
          alignItems: 'center',
          gap: 'var(--space-3)',
          alignSelf: 'stretch',
          width: '100%',
          maxWidth: 'var(--size-content-max)',
          margin: '0 auto',
          paddingInline: 'var(--space-4)',
          containerType: 'inline-size',
          '& > h1': {
            gridColumn: '1 / -1',
            margin: 0,
          },
          [`@container (min-width: ${COMPACT_LAYOUT_MIN_WIDTH})`]: {
            gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
            '& > h1': {
              gridColumn: 'auto',
            },
          },
        }}
      >
        {returnUrl && (
          <Link to={returnUrl}>
            <ArrowLeftIcon aria-label="Back to search results" />
          </Link>
        )}
        <AssetHeading name={data.title} />
        <FavoriteButton assetKey={assetKey} />
        <MetadataButton assetKey={assetKey} />
      </div>
      <AssetDetail asset={data} />
    </>
  )
}
