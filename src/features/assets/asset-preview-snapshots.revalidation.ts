import type { Asset, AssetKey } from '@/domain/asset/asset.schema'
import type { SupabaseClient } from '@/integrations/supabase/types'

export interface RevalidateStaleSnapshotsOptions {
  // service role: reads every row and writes through the ensure RPC
  client: SupabaseClient
  fetchAsset: (assetKey: AssetKey) => Promise<Asset | null>
  staleBefore: Date
  // providers are public APIs with their own budgets, and a scheduled job
  // has no deadline worth spending one on
  spacingMs?: number
  log?: (line: string) => void
}

export interface RevalidateStaleSnapshotsResult {
  candidates: number
  refreshed: number
  missing: number
  failures: Array<string>
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

// Re-ensures every snapshot older than the stale window through its
// provider. The read model refreshes only on the star/collect write path,
// so without this a title or ladder stays stale until the same user stars
// the same asset again (#205).
export async function revalidateStaleSnapshots({
  client,
  fetchAsset,
  staleBefore,
  spacingMs = 250,
  log = () => {},
}: RevalidateStaleSnapshotsOptions): Promise<RevalidateStaleSnapshotsResult> {
  const { data, error } = await client
    .from('asset_preview_snapshots')
    .select('provider_id, external_id')
    .lt('updated_at', staleBefore.toISOString())
    .order('updated_at', { ascending: true })
  if (error) {
    throw new Error(`Failed to read stale snapshots: ${error.message}`)
  }

  let refreshed = 0
  let missing = 0
  const failures: Array<string> = []
  for (const row of data) {
    const label = `${row.provider_id}:${row.external_id}`
    await sleep(spacingMs)
    try {
      const asset = await fetchAsset({
        providerId: row.provider_id,
        externalId: row.external_id,
      })
      if (!asset) {
        // the provider no longer has the record; the stored row is the only
        // copy left, so it stays as it is. Its updated_at stays old too, so
        // the next run asks again in case the record returns.
        missing++
        log(`gone upstream, left alone: ${label}`)
        continue
      }
      const { error: ensureError } = await client.rpc(
        'ensure_asset_preview_snapshot',
        {
          p_provider_id: row.provider_id,
          p_external_id: row.external_id,
          p_title: asset.title,
          ...(asset.image && {
            p_image_width: asset.image.width,
            p_image_height: asset.image.height,
            p_renditions: asset.image.renditions,
          }),
        },
      )
      if (ensureError) throw new Error(ensureError.message)
      refreshed++
    } catch (caught) {
      // the row keeps its data and stays stale, so the next run retries it
      failures.push(`${label}: ${(caught as Error).message}`)
    }
  }
  return { candidates: data.length, refreshed, missing, failures }
}
