import { useMemo } from 'react'
import type {
  AlbumCollectionMetadata,
  AlbumKey,
} from '@/domain/album/album.schema'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import type {
  CursorPageRequest,
  PaginatedCollection,
} from '@/domain/pagination/pagination.schema'
import type { Asset } from '@/domain/asset/asset.schema'
import { useEyepieceClient } from '@/lib/eyepiece-api-client/eyepiece-client-provider'

export interface AlbumsRepo {
  getAlbum: (
    albumKey: AlbumKey,
    page: CursorPageRequest,
  ) => Promise<PaginatedCollection<Asset, AlbumCollectionMetadata>>
}

export function makeAlbumsRepo(client: EyepieceClient) {
  return {
    getAlbum: async (albumKey: AlbumKey, page: CursorPageRequest) => {
      return client.getAlbum(albumKey, page)
    },
  }
}

export function useAlbumsRepo() {
  const client = useEyepieceClient()
  return useMemo(() => makeAlbumsRepo(client), [client])
}
