import { z } from 'zod'

export const NASA_IVL_PROVIDER_ID = 'nasa_ivl' as const
export const SI_OA_PROVIDER_ID = 'si_oa' as const
export const PROVIDERS = [NASA_IVL_PROVIDER_ID, SI_OA_PROVIDER_ID] as const
export const PROVIDER_KEY_DELIMITER = '-' as const

export const providerIdSchema = z.enum(PROVIDERS, {
  error: (issue) =>
    `${issue.message ?? 'Invalid providerId'}, received '${issue.input}'`,
})

export type ProviderId = z.infer<typeof providerIdSchema>

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

export function providerSupportsAlbums(providerId: ProviderId) {
  const capabilities: ProviderCapabilities = PROVIDER_CAPABILITIES[providerId]
  return capabilities.albums === true
}

export function providerSupportsMetadata(providerId: ProviderId) {
  const capabilities: ProviderCapabilities = PROVIDER_CAPABILITIES[providerId]
  return capabilities.metadata === true
}
