import type { Asset, AssetKey } from '@/domain/asset/asset.schema'
import type { SupabaseClient } from '@/integrations/supabase/types'

export interface RevalidateStaleSnapshotsOptions {
  client: SupabaseClient
  fetchAsset: (assetKey: AssetKey) => Promise<Asset | null>
  staleBefore: Date
  spacingMs?: number
  pageSize?: number
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

// Re-ensures referenced snapshots older than the stale window; nothing else
// refreshes a row unless the same user stars the same asset again. The
// selection rules live with select_stale_referenced_snapshots.
export async function revalidateStaleSnapshots({
  client,
  fetchAsset,
  staleBefore,
  spacingMs = 250,
  pageSize = 200,
  log = () => {},
}: RevalidateStaleSnapshotsOptions): Promise<RevalidateStaleSnapshotsResult> {
  let candidates = 0
  let refreshed = 0
  let missing = 0
  const failures: Array<string> = []
  let after: { updatedAt: string; id: string } | undefined

  for (;;) {
    const { data, error } = await client.rpc(
      'select_stale_referenced_snapshots',
      {
        p_stale_before: staleBefore.toISOString(),
        ...(after && {
          p_after_updated_at: after.updatedAt,
          p_after_id: after.id,
        }),
        p_limit: pageSize,
      },
    )
    if (error) {
      throw new Error(`Failed to read stale snapshots: ${error.message}`)
    }
    if (data.length === 0) break

    for (const row of data) {
      candidates++
      const label = `${row.provider_id}:${row.external_id}`
      await sleep(spacingMs)
      try {
        const asset = await fetchAsset({
          providerId: row.provider_id,
          externalId: row.external_id,
        })
        if (!asset) {
          // gone upstream: the row stays as it is, updated_at included, so
          // the next run asks again
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
        failures.push(`${label}: ${(caught as Error).message}`)
      }
    }

    const last = data[data.length - 1]
    after = { updatedAt: last.updated_at, id: last.id }
    if (data.length < pageSize) break
  }

  return { candidates, refreshed, missing, failures }
}
