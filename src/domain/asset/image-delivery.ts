import { PROVIDER_IMAGE_DELIVERY } from '../provider/provider.schema'
import type { ImageDeliveryPolicy } from '../provider/provider.schema'

const policies: Array<ImageDeliveryPolicy> = Object.values(
  PROVIDER_IMAGE_DELIVERY,
)

// e2e builds set 'false': tests are written against origin URLs
export function isImageCdnEnabled() {
  return import.meta.env.VITE_IMAGE_CDN_ENABLED !== 'false'
}

export function isCdnDelivered(href: string, enabled = isImageCdnEnabled()) {
  return enabled && findPolicy(href) !== undefined
}

function findPolicy(href: string): ImageDeliveryPolicy | undefined {
  let normalized: string
  try {
    normalized = new URL(href).toString()
  } catch {
    return undefined
  }
  return policies.find((candidate) =>
    normalized.startsWith(candidate.hrefPrefix),
  )
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
  const policy = findPolicy(href)
  if (!policy) {
    return href
  }
  const url = new URL(href)
  const source =
    policy.source === 'remote'
      ? url.toString()
      : `${policy.source.pathPrefix}${url.pathname}${url.search}`
  return `/.netlify/images?url=${encodeURIComponent(source)}&w=${width}`
}
