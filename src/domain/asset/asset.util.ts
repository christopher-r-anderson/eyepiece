import {
  ASSET_KEY_DELIMITER,
  assetKeySchema,
  assetKeyStringSchema,
  assetProviderSchema,
  externalIdSchema,
} from './asset.schemas'
import type { AssetKey, AssetKeyString } from './asset.schemas'

export function toAssetKeyString(assetKey: AssetKey): AssetKeyString {
  const { provider, externalId } = assetKey
  return assetKeyStringSchema.parse(
    `${provider}${ASSET_KEY_DELIMITER}${externalId}`,
  )
}

export function fromAssetKeyString(keyString: AssetKeyString): AssetKey {
  const indexOfDelimiter = keyString.indexOf(ASSET_KEY_DELIMITER)
  if (indexOfDelimiter === -1) {
    throw new Error(`Invalid asset key: ${keyString}`)
  }
  const provider = assetProviderSchema.parse(
    keyString.substring(0, indexOfDelimiter),
  )
  const externalId = externalIdSchema.parse(
    keyString.substring(indexOfDelimiter + ASSET_KEY_DELIMITER.length),
  )
  return assetKeySchema.parse({ provider, externalId })
}
