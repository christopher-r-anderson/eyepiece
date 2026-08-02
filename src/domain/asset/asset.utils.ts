import { PROVIDER_KEY_DELIMITER } from '../provider/provider.schema'
import { assetKeyStringSchema } from './asset.schema'
import type { AssetImage, AssetKey, AssetKeyString } from './asset.schema'

export function toAssetKeyString(assetKey: AssetKey): AssetKeyString {
  const { providerId, externalId } = assetKey
  return assetKeyStringSchema.parse(
    `${providerId}${PROVIDER_KEY_DELIMITER}${externalId}`,
  )
}

export const assetKeyIsEqual = (a: AssetKey, b: AssetKey) => {
  return a.providerId === b.providerId && a.externalId === b.externalId
}

export function toSrcSet(image: AssetImage) {
  return image.renditions
    .map((rendition) => `${rendition.href} ${rendition.width}w`)
    .join(', ')
}

// srcset with width descriptors takes over wherever it is understood, so this
// is only reached by a browser that ignores it, or when every candidate fails.
// The narrowest is the cheaper thing to be wrong about.
export function toFallbackSrc(image: AssetImage) {
  return image.renditions[image.renditions.length - 1].href
}

// grids break rows on this; a record with no usable file lays out square
export const toAspectRatio = (image: AssetImage | undefined) =>
  image ? image.width / image.height : 1

// scrapers cap what they fetch, and the widest rendition can be enormous
export function toSocialImage(image: AssetImage) {
  const rendition =
    image.renditions.find((r) => r.width <= 1600) ??
    image.renditions[image.renditions.length - 1]
  return {
    url: rendition.href,
    width: rendition.width,
    height: rendition.height,
  }
}
