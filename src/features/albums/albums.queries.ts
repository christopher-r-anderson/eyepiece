import {
  infiniteQueryOptions,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query'
import { makeAlbumsRepo, useAlbumsRepo } from './albums.repo'
import type { AlbumsRepo } from './albums.repo'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { AlbumKey, AlbumKeyString } from '@/domain/album/album.schema'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import { flattenAssetsSelector } from '@/lib/eyepiece-api-client/client'
import { toAlbumKeyString } from '@/domain/album/album.utils'

type AlbumCacheKey = ['albums', AlbumKeyString]

function albumCacheKey(albumKey: AlbumKey): AlbumCacheKey {
  return ['albums', toAlbumKeyString(albumKey)] as const
}

type GetAlbumFn = AlbumsRepo['getAlbum']
type AlbumPage = Awaited<ReturnType<GetAlbumFn>>
type AlbumInfinite = InfiniteData<AlbumPage, number>

export function getInfiniteAlbumOptions<TSelectData = AlbumInfinite>({
  repo,
  albumKey,
  select,
}: {
  repo: Pick<AlbumsRepo, 'getAlbum'>
  albumKey: AlbumKey
  select?: (data: AlbumInfinite) => TSelectData
}) {
  return infiniteQueryOptions({
    queryKey: albumCacheKey(albumKey),
    queryFn: ({ pageParam = 1 }) => {
      return repo.getAlbum(albumKey, { page: pageParam })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next,
    select,
  })
}

export function useSuspenseInfiniteAlbumAssets(albumKey: AlbumKey) {
  const repo = useAlbumsRepo()
  return useSuspenseInfiniteQuery(
    getInfiniteAlbumOptions({ repo, albumKey, select: flattenAssetsSelector }),
  )
}

export function ensureInfiniteAlbum({
  albumKey,
  eyepieceClient,
  queryClient,
}: {
  albumKey: AlbumKey
  eyepieceClient: EyepieceClient
  queryClient: QueryClient
}) {
  const albumsRepo = makeAlbumsRepo(eyepieceClient)
  return queryClient.ensureInfiniteQueryData(
    getInfiniteAlbumOptions({ repo: albumsRepo, albumKey: albumKey }),
  )
}
