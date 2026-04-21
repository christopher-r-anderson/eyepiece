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
import { RouteError } from '@/app/layout/route-error'
import {
  providerIdSchema,
  providerSupportsMetadata,
} from '@/domain/provider/provider.schema'

function AssetHeading({ name = 'Asset' }: { name?: string }) {
  return (
    <h1
      css={{
        margin: 0,
        minWidth: 0,
        fontSize: 'var(--text-2xl)',
        lineHeight: 'var(--line-height-tight)',
        overflowWrap: 'anywhere',
      }}
    >
      {name}
    </h1>
  )
}

const assetHeaderCss = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gridTemplateAreas: '"back actions" "title title"',
  alignItems: 'center',
  rowGap: 'var(--space-3)',
  columnGap: 'var(--space-3)',
  alignSelf: 'stretch',
  width: '100%',
  maxWidth: 'var(--size-content-max)',
  margin: '0 auto var(--space-5)',
  padding: 'var(--space-2) var(--space-4) 0',
  containerType: 'inline-size',
  [`@container (min-width: ${COMPACT_LAYOUT_MIN_WIDTH})`]: {
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    gridTemplateAreas: '"back title actions"',
    columnGap: 'var(--space-4)',
    rowGap: 'var(--space-2)',
  },
}

const assetHeaderBackCss = {
  gridArea: 'back',
  justifySelf: 'start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  minHeight: 'calc(var(--size-control-height) - var(--space-1))',
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: 'var(--primary-text-muted)',
  fontWeight: 600,
  lineHeight: 'var(--line-height-tight)',
  '&[data-hovered]': {
    color: 'var(--text)',
    textDecoration: 'none',
    border:
      '1px solid color-mix(in oklab, var(--border-color) 88%, var(--text) 12%)',
    backgroundColor:
      'color-mix(in oklab, var(--tertiary-bg) 72%, var(--background) 28%)',
  },
}

const assetHeaderTitleCss = {
  gridArea: 'title',
  minWidth: 0,
  textAlign: 'center' as const,
}

const assetHeaderActionsCss = {
  gridArea: 'actions',
  justifySelf: 'end',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
}

const headerActionButtonCss = {
  minWidth: 'calc(var(--size-control-height) - var(--space-1))',
  minHeight: 'calc(var(--size-control-height) - var(--space-1))',
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
      <div css={assetHeaderCss}>
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
        <div css={assetHeaderTitleCss}>
          <AssetHeading name={data.title} />
        </div>
        <div css={assetHeaderActionsCss}>
          <FavoriteButton assetKey={assetKey} />
          {canViewMetadata ? (
            <MetadataButton assetKey={assetKey} css={headerActionButtonCss} />
          ) : null}
        </div>
      </div>
      <AssetDetail asset={data} />
    </>
  )
}
