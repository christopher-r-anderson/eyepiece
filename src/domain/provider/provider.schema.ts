import { z } from 'zod'
import {
  NASA_IMAGE_HREF_PREFIX,
  NASA_IMAGE_SOURCE_PREFIX,
  SI_IMAGE_HREF_PREFIX,
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
  // hrefs carrying this prefix route through the image CDN
  hrefPrefix: string
  // 'remote': the CDN fetches the origin directly. A path prefix routes the
  // fetch through our same-site source, whose headers the transforms inherit.
  source: 'remote' | { pathPrefix: string }
}

export const PROVIDER_IMAGE_DELIVERY = {
  [NASA_IVL_PROVIDER_ID]: {
    // origin-wide since we include video records in results and their
    // stills live under /video/
    hrefPrefix: NASA_IMAGE_HREF_PREFIX,
    source: { pathPrefix: NASA_IMAGE_SOURCE_PREFIX },
  },
  [SI_OA_PROVIDER_ID]: {
    hrefPrefix: SI_IMAGE_HREF_PREFIX,
    source: 'remote',
  },
} as const satisfies Record<ProviderId, ImageDeliveryPolicy>
