import { PROVIDER_KEY_DELIMITER } from '../provider/provider.schema'
import { assetKeyStringSchema } from './asset.schema'
import { isCdnDelivered, toDeliveryHref } from './image-delivery'
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

// one candidate set across surfaces: shared widths keep the CDN's per-node
// transform cache warm
const DELIVERY_WIDTHS = [320, 480, 640, 960, 1280, 1920, 2560]

// the ladder tops out at 2x the slot (what denser screens get) and at the
// source width, which the CDN would silently upscale past
function toImageCandidates(image: AssetImage, maxSlotWidth: number) {
  const widest = image.renditions[0]
  if (!isCdnDelivered(widest.href)) {
    return image.renditions.map((rendition) => ({
      href: toDeliveryHref(rendition.href, rendition.width),
      width: rendition.width,
    }))
  }
  const cap = Math.min(
    widest.width,
    DELIVERY_WIDTHS.find((width) => width >= 2 * maxSlotWidth) ??
      DELIVERY_WIDTHS[DELIVERY_WIDTHS.length - 1],
  )
  return [...DELIVERY_WIDTHS.filter((width) => width < cap), cap]
    .reverse()
    .map((width) => ({ href: toDeliveryHref(widest.href, width), width }))
}

export function toSrcSet(image: AssetImage, maxSlotWidth: number) {
  return toImageCandidates(image, maxSlotWidth)
    .map((candidate) => `${candidate.href} ${candidate.width}w`)
    .join(', ')
}

// srcset with width descriptors takes over wherever it is understood, so this
// is only reached by a browser that ignores it, or when every candidate fails.
// The narrowest is the cheaper thing to be wrong about, and serving it from
// its own rendition keeps it usable when the widest file cannot be served.
export function toFallbackSrc(image: AssetImage) {
  const narrowest = image.renditions[image.renditions.length - 1]
  return toDeliveryHref(narrowest.href, narrowest.width)
}

// grids break rows on this; a record with no usable file lays out square
export const toAspectRatio = (image: AssetImage | undefined) =>
  image ? image.width / image.height : 1

// scrapers cap what they fetch, and the widest rendition can be enormous.
// Not routed through the image CDN: scrapers do not negotiate formats.
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
