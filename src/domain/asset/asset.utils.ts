import {
  PROVIDER_KEY_DELIMITER,
  providerSchema,
} from '../provider/provider.schema'
import {
  assetKeySchema,
  assetKeyStringSchema,
  externalAssetIdSchema,
} from './asset.schema'
import type { AssetKey, AssetKeyString } from './asset.schema'

export function toAssetKeyString(assetKey: AssetKey): AssetKeyString {
  const { provider, externalId } = assetKey
  return assetKeyStringSchema.parse(
    `${provider}${PROVIDER_KEY_DELIMITER}${externalId}`,
  )
}

export function fromAssetKeyString(keyString: AssetKeyString): AssetKey {
  const indexOfDelimiter = keyString.indexOf(PROVIDER_KEY_DELIMITER)
  if (indexOfDelimiter === -1) {
    throw new Error(`Invalid asset key: ${keyString}`)
  }
  const provider = providerSchema.parse(
    keyString.substring(0, indexOfDelimiter),
  )
  const externalId = externalAssetIdSchema.parse(
    keyString.substring(indexOfDelimiter + PROVIDER_KEY_DELIMITER.length),
  )
  return assetKeySchema.parse({ provider, externalId })
}
