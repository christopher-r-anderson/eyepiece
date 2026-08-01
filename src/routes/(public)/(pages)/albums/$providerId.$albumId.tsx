import { createFileRoute } from '@tanstack/react-router'
import { AlbumAssets } from './-components/album-assets'
import { PageHeader } from '@/components/page-header'
import { RouteError } from '@/app/layout/route-error'
import { albumKeySchema } from '@/domain/album/album.schema'
import { PROVIDER_DISPLAY } from '@/domain/provider/provider.schema'
import { ensureInfiniteAlbum } from '@/features/albums/albums.queries'
import { getTitleText } from '@/lib/utils'
import { AssetGridSkeleton } from '@/features/assets/components/asset-grid-skeleton'

export const Route = createFileRoute(
  '/(public)/(pages)/albums/$providerId/$albumId',
)({
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
      heading={<PageHeader title="Album" />}
      message="Error loading album."
      captureContext={{
        boundaryKind: 'route',
        feature: 'albums',
        operation: 'load_album',
      }}
    />
  ),
  pendingComponent: () => (
    <>
      <PageHeader title="Album" />
      <AssetGridSkeleton />
    </>
  ),
})

function AlbumPage() {
  const { albumKey } = Route.useRouteContext()
  const { title } = Route.useLoaderData()
  return (
    <>
      <PageHeader
        title={title}
        meta={`an album from ${PROVIDER_DISPLAY[albumKey.providerId].displayName}`}
      />
      <AlbumAssets albumKey={albumKey} />
    </>
  )
}
