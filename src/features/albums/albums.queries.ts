import {
  infiniteQueryOptions,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query'
import { makeAlbumsRepo, useAlbumsRepo } from './albums.repo'
import type { AlbumsRepo } from './albums.repo'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { AlbumKey } from '@/domain/album/album.schema'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import type { Asset } from '@/domain/asset/asset.schema'
import type { PaginatedCollection } from '@/domain/pagination/pagination.schema'
import { flattenAssetsSelector } from '@/lib/eyepiece-api-client/client'
import { DEFAULT_PAGE_SIZE } from '@/domain/pagination/pagination.schema'

const albumKeys = {
  all: ['albums'] as const,
  album: (key: AlbumKey) => [...albumKeys.all, key] as const,
}

type AlbumPage = Promise<PaginatedCollection<Asset>>
type AlbumInfinite = InfiniteData<Awaited<AlbumPage>, number>

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
    queryKey: albumKeys.album(albumKey),
    queryFn: ({ pageParam = 1 }) => {
      return repo.getAlbum(albumKey, {
        page: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
      })
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
