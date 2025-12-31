import { NOT_FOUND_IMAGE } from '@/server/lib/util'
import { createFileRoute } from '@tanstack/react-router'
import { getAssetOptions, useAsset } from '@/features/assets/api/asset-queries'

export const Route = createFileRoute('/(pages)/assets/$assetId')({
  component: AssetView,
  beforeLoad: () => ({
    title: 'Asset Details',
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(getAssetOptions(params.assetId)),
})

export function AssetView() {
  const { assetId } = Route.useParams()
  const { data, isPending, isError, error } = useAsset(assetId)
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
    <div
      css={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '2rem',
      }}
    >
      <h1 css={{ color: 'var(--text-accent)' }}>Asset </h1>
      <div>
        <p>{data.title}</p>
        <img
          css={{ maxWidth: '100%', height: 'auto' }}
          src={image.href}
          alt={data.description}
          width={image.width}
          height={image.height}
        />
      </div>
    </div>
  )
}
