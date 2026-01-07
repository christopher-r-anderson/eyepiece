import { createFileRoute } from '@tanstack/react-router'
import { AlbumAssets } from './-components/album-assets'
import { getAlbumOptions } from '@/lib/api/eyepiece/album-queries'
import { getTitleText } from '@/lib/util'

export const Route = createFileRoute('/(pages)/albums/$albumId')({
  component: AlbumView,
  loader: ({ context, params }) =>
    context.queryClient.ensureInfiniteQueryData(
      getAlbumOptions(params.albumId),
    ),
  head: ({ params }) => ({
    meta: [{ title: getTitleText(`${params.albumId} Media`) }],
  }),
})

function AlbumView() {
  const { albumId } = Route.useParams()
  return (
    <main
      css={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '2rem',
      }}
    >
      <h1 css={{ color: 'var(--text-accent)' }}>{albumId} Media</h1>
      <AlbumAssets albumId={albumId} />
    </main>
  )
}
