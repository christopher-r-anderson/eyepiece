import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { FavoriteButton } from '../-components/favorite-button'
import { MetadataButton } from './-components/metadata/button'
import { getTitleText } from '@/lib/utils'
import { ensureAsset, useSuspenseAsset } from '@/features/assets/assets.queries'
import { Link } from '@/components/ui/link'
import { assetKeySchema } from '@/domain/asset/asset.schema'
import { NASA_IVL_PROVIDER } from '@/domain/provider/provider.schema'
import { PrettyException } from '@/components/ui/error'

function AssetHeading({ name = 'Asset' }: { name?: string }) {
  return <h1>{name}</h1>
}

export const Route = createFileRoute('/(pages)/assets/$assetId')({
  component: AssetPage,
  beforeLoad: ({ params }) => {
    const assetKey = assetKeySchema.parse({
      provider: NASA_IVL_PROVIDER,
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
      <div css={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {returnUrl && (
          <Link to={returnUrl}>
            <ArrowLeftIcon aria-label="Back to search results" />
          </Link>
        )}
        <AssetHeading name={data.title} />
        <FavoriteButton assetKey={assetKey} />
        <MetadataButton assetKey={assetKey} />
      </div>
      <div
        css={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          marginInline: '2rem',
          maxWidth: '1200px',
          '@media (min-width: 1024px)': {
            flexDirection: 'row',
          },
        }}
      >
        {/*
          title as alt: it isn't ideal since it is in the h1 and not primarily describe-what-is-in-the-image
          but there isn't specific data for that, it *often does* describe what you can see in the image
          and the image is the focus of the page, not decorative so an empty alt doesn't seem appropriate either.
          Description is potentially paragraphs of content going beyond what is in the image.
          Revisit if there is feedback.
        */}
        <img
          css={{
            maxWidth: '100%',
            maxHeight: '65vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'scale-down',
            minHeight: '300px',
            position: 'sticky',
            top: '2rem',
            alignSelf: 'flex-start',
            viewTransitionName: `asset-${data.id}`,
          }}
          src={data.image.href}
          alt={data.title}
          width={data.image.width}
          height={data.image.height}
        />
        <figcaption>
          <div
            css={{
              maxWidth: 'calc(clamp(45ch, 90%, 75ch) + 1rem)',
              margin: 'auto',
              lineHeight: '1.5',
              whiteSpace: 'pre-line',
            }}
          >
            {data.description}
          </div>
        </figcaption>
      </div>
    </>
  )
}
