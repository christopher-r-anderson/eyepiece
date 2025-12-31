import { createFileRoute } from '@tanstack/react-router'
import { AlbumAssets } from './-components/album-assets'
import { getAlbumOptions } from '@/lib/api/eyepiece/album-queries'

export const Route = createFileRoute('/(pages)/albums/$albumId')({
  component: AlbumView,
  beforeLoad: () => ({
    title: 'Album of NASA Images and Videos',
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureInfiniteQueryData(
      getAlbumOptions(params.albumId),
    ),
})

function AlbumView() {
  const { albumId } = Route.useParams()
  return (
    <div
      css={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '2rem',
      }}
    >
      <h1 css={{ color: 'var(--text-accent)' }}>
        Album of NASA images and videos
      </h1>
      <AlbumAssets albumId={albumId} />
    </div>
  )
}
