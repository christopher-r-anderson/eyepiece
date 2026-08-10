import { PROVIDER_IMAGE_DELIVERY } from '../provider/provider.schema'
import type { ImageDeliveryPolicy } from '../provider/provider.schema'

const policies: Array<ImageDeliveryPolicy> = Object.values(
  PROVIDER_IMAGE_DELIVERY,
)

// e2e fixture runs serve provider responses from recordings and must not let
// the local image CDN emulator fetch live origins, so they build with 'false'
export function isImageCdnEnabled() {
  return import.meta.env.VITE_IMAGE_CDN_ENABLED !== 'false'
}

// Routes a rendition through the Netlify image CDN when its href carries a
// configured provider prefix; anything else - old snapshot hrefs, unknown
// hosts, same-host urls outside the prefix like SI's ids/download fallback -
// passes through untouched. The requested width is the rendition's own, so
// this changes format and caching, never geometry; width selection against
// rendered slots is #245.
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
  const normalized = url.toString()
  const policy = policies.find((candidate) =>
    normalized.startsWith(candidate.hrefPrefix),
  )
  if (!policy) {
    return href
  }
  const source =
    policy.source === 'remote'
      ? normalized
      : `${policy.source.pathPrefix}${url.pathname}${url.search}`
  return `/.netlify/images?url=${encodeURIComponent(source)}&w=${width}`
}
