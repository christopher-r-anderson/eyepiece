import {
  PROVIDER_KEY_DELIMITER,
  providerIdSchema,
} from '../provider/provider.schema'
import {
  assetKeySchema,
  assetKeyStringSchema,
  externalAssetIdSchema,
} from './asset.schema'
import type { Result } from '@/lib/result'
import type { AssetKey, AssetKeyString } from './asset.schema'
import { Err, Ok } from '@/lib/result'

export function toAssetKeyString(assetKey: AssetKey): AssetKeyString {
  const { providerId, externalId } = assetKey
  return assetKeyStringSchema.parse(
    `${providerId}${PROVIDER_KEY_DELIMITER}${externalId}`,
  )
}

export const assetKeyIsEqual = (a: AssetKey, b: AssetKey) => {
  return a.providerId === b.providerId && a.externalId === b.externalId
}

export function parseAssetKeyString(keyString: unknown): Result<AssetKey> {
  if (typeof keyString !== 'string') {
    return Err({ message: 'Asset key string must be a string' })
  }
  const indexOfDelimiter = keyString.indexOf(PROVIDER_KEY_DELIMITER)
  if (indexOfDelimiter === -1) {
    return Err({ message: 'Missing asset key delimiter' })
  }
  const providerId = providerIdSchema.safeParse(
    keyString.substring(0, indexOfDelimiter),
  )
  if (providerId.error) {
    return Err({ message: 'Invalid provider ID', cause: providerId.error })
  }
  const externalId = externalAssetIdSchema.safeParse(
    keyString.substring(indexOfDelimiter + PROVIDER_KEY_DELIMITER.length),
  )
  if (externalId.error) {
    return Err({ message: 'Invalid external ID', cause: externalId.error })
  }
  const result = assetKeySchema.safeParse({
    providerId: providerId.data,
    externalId: externalId.data,
  })
  if (result.error) {
    return Err({ message: 'Invalid asset key', cause: result.error })
  }
  return Ok(result.data)
}
