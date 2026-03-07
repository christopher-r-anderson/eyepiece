import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { MetadataButton } from './-components/metadata/button'
import { getTitleText } from '@/lib/utils'
import { getAssetOptions, useAsset } from '@/features/assets/assets.queries'
import { Link } from '@/components/ui/link'
import { useEyepieceClient } from '@/lib/eyepiece-api-client/eyepiece-client-provider'
import { assetKeySchema } from '@/domain/asset/asset.schema'
import { PrettyException } from '@/components/ui/error'
import { NASA_IVL_PROVIDER } from '@/domain/provider/provider.schema'
import { makeAssetsRepo } from '@/features/assets/assets.repo'

export const Route = createFileRoute('/(pages)/assets/$assetId')({
  component: AssetPage,
  beforeLoad: ({ params }) => {
    const assetKey = assetKeySchema.parse({
      provider: NASA_IVL_PROVIDER,
      externalId: params.assetId,
    })
    return { assetKey }
  },
  loader: ({ context }) => {
    const repo = makeAssetsRepo(context.eyepieceClient)
    return context.queryClient.ensureQueryData(
      getAssetOptions({ repo, assetKey: context.assetKey }),
    )
  },
  head: ({ loaderData }) => ({
    meta: [{ title: getTitleText(loaderData?.title || 'NASA Media') }],
  }),
})

export function AssetPage() {
  const { assetKey } = Route.useRouteContext()
  const client = useEyepieceClient()
  const repo = makeAssetsRepo(client)
  const { data, isPending, isError, error } = useAsset({ repo, assetKey })
  const returnUrl = useRouterState({
    select: (s) => s.resolvedLocation?.state.returnUrl,
  })

  if (isPending) {
    return <div>Loading...</div>
  }

  if (isError) {
    return <PrettyException error={error} headingLevel={1} />
  }

  return (
    <main
      css={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div css={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {returnUrl && (
          <Link to={returnUrl}>
            <ArrowLeftIcon aria-label="Back to search results" />
          </Link>
        )}
        <h1 css={{ color: 'var(--text-accent)' }}>{data.title}</h1>
        <MetadataButton assetKey={assetKey} assetsRepo={repo} />
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
    </main>
  )
}
