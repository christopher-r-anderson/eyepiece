import { createFileRoute } from '@tanstack/react-router'
import { AlbumAssets } from './-components/album-assets'
import { PageHeading } from '@/routes/-components/page-heading'
import { RouteError } from '@/app/layout/route-error'
import { albumKeySchema } from '@/domain/album/album.schema'
import {
  ensureInfiniteAlbum,
  useSuspenseInfiniteAlbum,
} from '@/features/albums/albums.queries'
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
    const album = await ensureInfiniteAlbum({
      eyepieceClient,
      queryClient,
      albumKey,
    })

    return {
      title: album.pages[0]?.collection?.title ?? albumKey.externalId,
    }
  },
  head: ({ loaderData }) => ({
    // https://github.com/TanStack/router/issues/4785
    meta: [{ title: getTitleText(`${loaderData?.title ?? 'Album'} Media`) }],
  }),
  errorComponent: ({ error }) => (
    <RouteError
      error={error}
      heading={<PageHeading>Album</PageHeading>}
      message="Error loading album."
    />
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
  const { data } = useSuspenseInfiniteAlbum(albumKey)
  const title = data.collection?.title ?? albumKey.externalId
  return (
    <>
      <PageHeading>{title}</PageHeading>
      <AlbumAssets albumKey={albumKey} />
    </>
  )
}
