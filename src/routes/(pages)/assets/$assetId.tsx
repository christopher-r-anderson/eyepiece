import { getTitleText, NOT_FOUND_IMAGE } from '@/lib/util'
import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { getAssetOptions, useAsset } from '@/features/assets/api/asset-queries'
import { Link } from '@/components/ui/link'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { MetadataButton } from './-components/metadata/button'

export const Route = createFileRoute('/(pages)/assets/$assetId')({
  component: AssetView,
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(getAssetOptions(params.assetId)),
  head: ({ loaderData }) => ({
    meta: [{ title: getTitleText(loaderData?.title || 'NASA Media') }],
  }),
})

export function AssetView() {
  const { assetId } = Route.useParams()
  const { data, isPending, isError, error } = useAsset(assetId)
  const returnUrl = useRouterState({
    select: (s) => s?.resolvedLocation?.state.returnUrl,
  })

  if (isPending) {
    return <div>Loading...</div>
  }

  if (isError) {
    return (
      <div>
        <p>Error loading asset</p>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }
  const image = data.image || NOT_FOUND_IMAGE

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
        <MetadataButton id={data.id} />
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
          src={image.href}
          alt={data.description}
          width={image.width}
          height={image.height}
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
