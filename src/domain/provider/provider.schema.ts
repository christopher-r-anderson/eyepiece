import { z } from 'zod'
import {
  NASA_IMAGE_ORIGIN,
  NASA_IMAGE_SOURCE_PREFIX,
  SI_IMAGE_ORIGIN,
} from './provider-image-delivery'

export const NASA_IVL_PROVIDER_ID = 'nasa_ivl' as const
export const SI_OA_PROVIDER_ID = 'si_oa' as const
export const PROVIDERS = [NASA_IVL_PROVIDER_ID, SI_OA_PROVIDER_ID] as const
export const PROVIDER_KEY_DELIMITER = '-' as const

export const providerIdSchema = z.enum(PROVIDERS, {
  error: (issue) =>
    `${issue.message ?? 'Invalid providerId'}, received '${issue.input}'`,
})

export type ProviderId = z.infer<typeof providerIdSchema>

export type ProviderDisplay = {
  shortLabel: string
  displayName: string
}

export const PROVIDER_DISPLAY = {
  [NASA_IVL_PROVIDER_ID]: {
    shortLabel: 'NASA',
    displayName: 'NASA Image and Video Library',
  },
  [SI_OA_PROVIDER_ID]: {
    shortLabel: 'Smithsonian',
    displayName: 'Smithsonian National Air and Space Museum',
  },
} as const satisfies Record<ProviderId, ProviderDisplay>

export type ProviderCapabilities = {
  albums?: true
  metadata?: true
}

export const PROVIDER_CAPABILITIES = {
  [NASA_IVL_PROVIDER_ID]: {
    albums: true,
    metadata: true,
  },
  [SI_OA_PROVIDER_ID]: {},
} as const satisfies Record<ProviderId, ProviderCapabilities>

export function providerSupportsMetadata(providerId: ProviderId) {
  const capabilities: ProviderCapabilities = PROVIDER_CAPABILITIES[providerId]
  return capabilities.metadata === true
}

export type ImageDeliveryPolicy = {
  origin: string
  // 'remote': the image CDN fetches the provider origin itself. A path
  // prefix instead routes the fetch through our same-site source at that
  // prefix, whose cache headers the transformed responses then inherit.
  source: 'remote' | { pathPrefix: string }
}

// NASA cannot stay 'remote': its origin serves max-age=300, transforms
// inherit it, and a headers rule on the transform path does not apply
// (verified in the #253 spike). ids.si.edu serves two days and is fine.
// The netlify.toml [images] allowlist and the edge function are the two
// artifacts that cannot read this map; the sync test in
// provider-image-delivery.unit.test.ts holds them together.
export const PROVIDER_IMAGE_DELIVERY = {
  [NASA_IVL_PROVIDER_ID]: {
    origin: NASA_IMAGE_ORIGIN,
    source: { pathPrefix: NASA_IMAGE_SOURCE_PREFIX },
  },
  [SI_OA_PROVIDER_ID]: {
    origin: SI_IMAGE_ORIGIN,
    source: 'remote',
  },
} as const satisfies Record<ProviderId, ImageDeliveryPolicy>
