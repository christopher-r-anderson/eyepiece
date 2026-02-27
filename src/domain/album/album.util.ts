import {
  PROVIDER_KEY_DELIMITER,
  providerSchema,
} from '../provider/provider.schemas'
import {
  albumKeySchema,
  albumKeyStringSchema,
  externalAlbumIdSchema,
} from './album.schemas'
import type { AlbumKey, AlbumKeyString } from './album.schemas'

export function toAlbumKeyString(albumKey: AlbumKey): AlbumKeyString {
  const { provider, externalId } = albumKey
  return albumKeyStringSchema.parse(
    `${provider}${PROVIDER_KEY_DELIMITER}${externalId}`,
  )
}

export function fromAlbumKeyString(keyString: AlbumKeyString): AlbumKey {
  const indexOfDelimiter = keyString.indexOf(PROVIDER_KEY_DELIMITER)
  if (indexOfDelimiter === -1) {
    throw new Error(`Invalid album key: ${keyString}`)
  }
  const provider = providerSchema.parse(
    keyString.substring(0, indexOfDelimiter),
  )
  const externalId = externalAlbumIdSchema.parse(
    keyString.substring(indexOfDelimiter + PROVIDER_KEY_DELIMITER.length),
  )
  return albumKeySchema.parse({ provider, externalId })
}
