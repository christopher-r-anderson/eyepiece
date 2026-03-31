import {
  PROVIDER_KEY_DELIMITER,
  providerIdSchema,
} from '../provider/provider.schema'
import {
  albumKeySchema,
  albumKeyStringSchema,
  externalAlbumIdSchema,
} from './album.schema'
import type { Result } from '@/lib/result'
import type { AlbumKey, AlbumKeyString } from './album.schema'
import { Err, Ok } from '@/lib/result'

export function toAlbumKeyString(albumKey: AlbumKey): AlbumKeyString {
  const { providerId, externalId } = albumKey
  return albumKeyStringSchema.parse(
    `${providerId}${PROVIDER_KEY_DELIMITER}${externalId}`,
  )
}

export function parseAlbumKeyString(keyString: unknown): Result<AlbumKey> {
  if (typeof keyString !== 'string') {
    return Err({ message: 'Album key string must be a string' })
  }
  const indexOfDelimiter = keyString.indexOf(PROVIDER_KEY_DELIMITER)
  if (indexOfDelimiter === -1) {
    return Err({ message: 'Missing album key delimiter' })
  }
  const providerId = providerIdSchema.safeParse(
    keyString.substring(0, indexOfDelimiter),
  )
  if (providerId.error) {
    return Err({ message: 'Invalid provider ID', cause: providerId.error })
  }
  const externalId = externalAlbumIdSchema.safeParse(
    keyString.substring(indexOfDelimiter + PROVIDER_KEY_DELIMITER.length),
  )
  if (externalId.error) {
    return Err({ message: 'Invalid external ID', cause: externalId.error })
  }
  const result = albumKeySchema.safeParse({
    providerId: providerId.data,
    externalId: externalId.data,
  })
  if (result.error) {
    return Err({ message: 'Invalid album key', cause: result.error })
  }
  return Ok(result.data)
}
