import { z } from 'zod'
import {
  PROVIDER_KEY_DELIMITER,
  providerSchema,
} from '../provider/provider.schema'

export const externalAlbumIdSchema = z.string().min(1)

export type ExternalAlbumId = z.infer<typeof externalAlbumIdSchema>

export const albumKeyStringSchema = z.templateLiteral([
  providerSchema,
  z.literal(PROVIDER_KEY_DELIMITER),
  externalAlbumIdSchema,
])

export type AlbumKeyString = z.infer<typeof albumKeyStringSchema>

export const albumKeySchema = z.object({
  provider: providerSchema,
  externalId: externalAlbumIdSchema,
})

export type AlbumKey = z.infer<typeof albumKeySchema>
