import { createFileRoute } from '@tanstack/react-router'
import { AlbumAssets } from './-components/album-assets'
import { getAlbumOptions } from '@/features/albums/albums.queries'
import { getTitleText } from '@/lib/utils'
import { NASA_IVL_PROVIDER } from '@/domain/provider/provider.schema'
import { albumKeySchema } from '@/domain/album/album.schema'
import { makeAlbumsRepo } from '@/features/albums/albums.repo'

export const Route = createFileRoute('/(pages)/albums/$albumId')({
  component: AlbumView,
  beforeLoad: ({ params }) => {
    const albumKey = albumKeySchema.parse({
      provider: NASA_IVL_PROVIDER,
      externalId: params.albumId,
    })
    return { albumKey }
  },
  loader: ({ context }) => {
    const albumsRepo = makeAlbumsRepo(context.eyepieceClient)
    return context.queryClient.ensureInfiniteQueryData(
      getAlbumOptions({ repo: albumsRepo, albumKey: context.albumKey }),
    )
  },
  head: ({ match }) => ({
    // https://github.com/TanStack/router/issues/4785
    meta: [
      { title: getTitleText(`${match.context.albumKey.externalId} Media`) },
    ],
  }),
})

function AlbumView() {
  const { albumKey } = Route.useRouteContext()
  return (
    <main
      css={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '2rem',
      }}
    >
      <h1 css={{ color: 'var(--text-accent)' }}>{albumKey.externalId} Media</h1>
      <AlbumAssets albumKey={albumKey} />
    </main>
  )
}
