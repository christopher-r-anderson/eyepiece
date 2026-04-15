import { PROVIDER_KEY_DELIMITER } from '../provider/provider.schema'
import { albumKeyStringSchema } from './album.schema'
import type { AlbumKey, AlbumKeyString } from './album.schema'

export function toAlbumKeyString(albumKey: AlbumKey): AlbumKeyString {
  const { providerId, externalId } = albumKey
  return albumKeyStringSchema.parse(
    `${providerId}${PROVIDER_KEY_DELIMITER}${externalId}`,
  )
}
