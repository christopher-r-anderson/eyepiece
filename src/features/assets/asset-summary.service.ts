import { z } from 'zod'
import type { AssetSummary, AssetSummaryId } from '@/domain/asset/asset.schemas'
import {
  assetProviderSchema,
  assetSummaryIdSchema,
  externalIdSchema,
} from '@/domain/asset/asset.schemas'
import { Err, Ok } from '@/lib/result'
import { createSupabaseClient } from '@/lib/supabase/client'

const dbAssetSummarySchema = z.object({
  id: assetSummaryIdSchema,
  provider: assetProviderSchema,
  external_id: externalIdSchema,
  title: z.string().nullable(),
  thumb_href: z.url(),
  thumb_width: z.number().int().positive(),
  thumb_height: z.number().int().positive(),
})

const dbAssetSummariesSchema = z.array(dbAssetSummarySchema)

type DbAssetSummary = z.infer<typeof dbAssetSummarySchema>

function mapAssetSummary({
  id,
  provider,
  external_id,
  title,
  thumb_href,
  thumb_width,
  thumb_height,
}: DbAssetSummary): AssetSummary {
  return {
    id,
    provider,
    externalId: external_id,
    title: title ?? 'No Title',
    thumbnail: {
      href: thumb_href,
      width: thumb_width,
      height: thumb_height,
    },
  }
}

export async function getAssetSummaries(
  assetSummaryIds: Array<AssetSummaryId>,
) {
  const { data, error: pgError } = await createSupabaseClient()
    .from('asset_summaries')
    .select(
      'id, provider, external_id, title, thumb_href, thumb_width, thumb_height',
    )
    .in('id', assetSummaryIds)
  if (pgError) {
    return Err({
      message: pgError.message,
      cause: pgError,
    })
  }
  const { data: dbAssetSummaries, error: parseError } =
    dbAssetSummariesSchema.safeParse(data)
  if (parseError) {
    return Err({
      message: parseError.message,
      cause: parseError,
    })
  }
  return Ok(dbAssetSummaries.map(mapAssetSummary))
}
