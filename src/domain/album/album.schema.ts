import { z } from 'zod'
import {
  PROVIDER_KEY_DELIMITER,
  providerIdSchema,
} from '../provider/provider.schema'

export const externalAlbumIdSchema = z.string().min(1)

export type ExternalAlbumId = z.infer<typeof externalAlbumIdSchema>

export const albumKeyStringSchema = z.templateLiteral([
  providerIdSchema,
  z.literal(PROVIDER_KEY_DELIMITER),
  externalAlbumIdSchema,
])

export type AlbumKeyString = z.infer<typeof albumKeyStringSchema>

export const albumKeySchema = z.object({
  providerId: providerIdSchema,
  externalId: externalAlbumIdSchema,
})

export type AlbumKey = z.infer<typeof albumKeySchema>
