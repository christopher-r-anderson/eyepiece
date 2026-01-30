import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { MetadataButton } from './-components/metadata/button'
import { NOT_FOUND_IMAGE, getTitleText } from '@/lib/util'
import { getAssetOptions, useAsset } from '@/features/assets/api/asset-queries'
import { Link } from '@/components/ui/link'
import { useEyepieceClient } from '@/lib/api/eyepiece/eyepiece-client-provider'
import { createEyepieceClient } from '@/lib/api/eyepiece/client'

export const Route = createFileRoute('/(pages)/assets/$assetId')({
  component: AssetView,
  loader: ({ context, location, params }) => {
    const client = createEyepieceClient({
      origin: location.url.origin,
    })
    return context.queryClient.ensureQueryData(
      getAssetOptions(client, params.assetId),
    )
  },
  head: ({ loaderData }) => ({
    meta: [{ title: getTitleText(loaderData?.title || 'NASA Media') }],
  }),
})

export function AssetView() {
  const { assetId } = Route.useParams()
  const client = useEyepieceClient()
  const { data, isPending, isError, error } = useAsset(client, assetId)
  const returnUrl = useRouterState({
    select: (s) => s.resolvedLocation?.state.returnUrl,
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
          src={image.href}
          alt={data.title}
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
