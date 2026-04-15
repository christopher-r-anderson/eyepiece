import { createFileRoute } from '@tanstack/react-router'
import { AlbumAssets } from './-components/album-assets'
import { PageHeading } from '@/routes/-components/page-heading'
import { PrettyException } from '@/components/ui/error'
import { albumKeySchema } from '@/domain/album/album.schema'
import { ensureInfiniteAlbum } from '@/features/albums/albums.queries'
import { getTitleText } from '@/lib/utils'
import { AssetGridSkeleton } from '@/routes/-components/asset-grid-skeleton'

export const Route = createFileRoute('/(pages)/albums/$providerId/$albumId')({
  component: AlbumPage,
  beforeLoad: ({ params }) => {
    const albumKey = albumKeySchema.parse({
      providerId: params.providerId,
      externalId: params.albumId,
    })
    return { albumKey }
  },
  loader: async ({ context: { eyepieceClient, queryClient, albumKey } }) => {
    await ensureInfiniteAlbum({
      eyepieceClient,
      queryClient,
      albumKey,
    })
  },
  head: ({ match }) => ({
    // https://github.com/TanStack/router/issues/4785
    meta: [
      { title: getTitleText(`${match.context.albumKey.externalId} Media`) },
    ],
  }),
  errorComponent: ({ error }) => (
    <>
      <PageHeading>Album</PageHeading>
      <p>Error loading album.</p>
      <PrettyException error={error} headingLevel={1} />
    </>
  ),
  pendingComponent: () => (
    <>
      <PageHeading>Album</PageHeading>
      <AssetGridSkeleton />
    </>
  ),
})

function AlbumPage() {
  const { albumKey } = Route.useRouteContext()
  return (
    <>
      <PageHeading>{albumKey.externalId} Album</PageHeading>
      <AlbumAssets albumKey={albumKey} />
    </>
  )
}
