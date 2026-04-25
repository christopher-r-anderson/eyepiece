import { z } from 'zod'
import { albumCollectionMetadataSchema } from '@/domain/album/album.schema'
import { assetSchema, metadataSchema } from '@/domain/asset/asset.schema'
import {
  createPaginatedCollectionSchema,
  paginationSchema,
} from '@/domain/pagination/pagination.schema'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'
import { searchQuerySchema } from '@/domain/search/search.schema'
import { nasaIvlSearchFiltersSchema } from '@/domain/search/providers/nasa-ivl-filters'
import { sioaSearchFiltersSchema } from '@/domain/search/providers/si-oa-filters'

export const searchQueryParamSchema = z.object({
  q: searchQuerySchema,
})

export const searchFiltersParamsSchema = z.discriminatedUnion('providerId', [
  nasaIvlSearchFiltersSchema.extend({
    providerId: z.literal(NASA_IVL_PROVIDER_ID),
  }),
  sioaSearchFiltersSchema.extend({ providerId: z.literal(SI_OA_PROVIDER_ID) }),
])

export const searchRequestSchema = searchQueryParamSchema
  .and(paginationSchema)
  .and(searchFiltersParamsSchema)

export const searchResponseSchema = createPaginatedCollectionSchema(assetSchema)

export const assetResponseSchema = assetSchema

export const assetMetadataResponseSchema = metadataSchema

export const albumRequestSchema = paginationSchema

export const albumResponseSchema = createPaginatedCollectionSchema(
  assetSchema,
  albumCollectionMetadataSchema,
)
