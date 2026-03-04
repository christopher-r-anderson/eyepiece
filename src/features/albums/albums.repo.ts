import type { AlbumKey } from '@/domain/album/album.schema'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'

export interface AlbumsRepo {
  getAlbum: (
    albumKey: AlbumKey,
    options: { page: number },
  ) => Promise<Awaited<ReturnType<EyepieceClient['getAlbum']>>>
}

export function makeAlbumsRepo(client: EyepieceClient) {
  return {
    getAlbum: async (albumKey: AlbumKey, { page }: { page: number }) => {
      return client.getAlbum(albumKey, { page })
    },
  }
}
