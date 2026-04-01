import { PROVIDER_KEY_DELIMITER } from '../provider/provider.schema'
import { assetKeyStringSchema } from './asset.schema'
import type { AssetKey, AssetKeyString } from './asset.schema'

export function toAssetKeyString(assetKey: AssetKey): AssetKeyString {
  const { providerId, externalId } = assetKey
  return assetKeyStringSchema.parse(
    `${providerId}${PROVIDER_KEY_DELIMITER}${externalId}`,
  )
}

export const assetKeyIsEqual = (a: AssetKey, b: AssetKey) => {
  return a.providerId === b.providerId && a.externalId === b.externalId
}
