import { PROVIDER_IMAGE_DELIVERY } from '../provider/provider.schema'
import type { ImageDeliveryPolicy } from '../provider/provider.schema'

const policyByOrigin = new Map<string, ImageDeliveryPolicy>(
  Object.values(PROVIDER_IMAGE_DELIVERY).map((policy) => [
    policy.origin,
    policy,
  ]),
)

// e2e fixture runs serve provider responses from recordings and must not let
// the local image CDN emulator fetch live origins, so they build with 'false'
export function isImageCdnEnabled() {
  return import.meta.env.VITE_IMAGE_CDN_ENABLED !== 'false'
}

// Routes a rendition through the Netlify image CDN when its origin belongs
// to a configured provider; anything else - old snapshot hrefs, unknown
// hosts - passes through untouched. The requested width is the rendition's
// own, so this changes format and caching, never geometry; width selection
// against rendered slots is #245.
export function toDeliveryHref(
  href: string,
  width: number,
  enabled = isImageCdnEnabled(),
): string {
  if (!enabled) {
    return href
  }
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return href
  }
  const policy = policyByOrigin.get(url.origin)
  if (!policy) {
    return href
  }
  const source =
    policy.source === 'remote'
      ? url.toString()
      : `${policy.source.pathPrefix}${url.pathname}${url.search}`
  return `/.netlify/images?url=${encodeURIComponent(source)}&w=${width}`
}
