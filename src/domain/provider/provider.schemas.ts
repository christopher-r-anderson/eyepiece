import { z } from 'zod'

export const PROVIDERS = ['nasa_ivl'] as const
export const NASA_IVL_PROVIDER: Provider = PROVIDERS[0]
export const PROVIDER_KEY_DELIMITER = '-' as const

export const providerSchema = z.enum(PROVIDERS)

export type Provider = z.infer<typeof providerSchema>
