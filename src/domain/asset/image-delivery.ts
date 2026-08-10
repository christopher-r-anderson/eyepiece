import { PROVIDER_IMAGE_DELIVERY } from '../provider/provider.schema'
import type { ImageDeliveryPolicy } from '../provider/provider.schema'

const policies: Array<ImageDeliveryPolicy> = Object.values(
  PROVIDER_IMAGE_DELIVERY,
)

// e2e builds set 'false': tests are written against origin URLs
export function isImageCdnEnabled() {
  return import.meta.env.VITE_IMAGE_CDN_ENABLED !== 'false'
}

// Maps an image's href into a CDN transform URL when matching a provider
// prefix. Otherwise passes through untouched.
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
