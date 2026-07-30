// Re-ensures asset preview snapshots older than the stale window through
// their providers (#205). Runs weekly from
// .github/workflows/revalidate-snapshots.yml; safe by hand:
//
//   pnpm revalidate-snapshots
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/database.types'
import { ASSET_PREVIEW_SNAPSHOT_STALE_TIME } from '@/features/assets/asset-preview-snapshots.const'
import { revalidateStaleSnapshots } from '@/features/assets/asset-preview-snapshots.revalidation'
import { makeEyepieceProviderService } from '@/server/eyepiece/service'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing env var ${name} (set it, or populate .env.local via pnpm print-supabase-env)`,
    )
  }
  return value
}

const client = createClient<Database>(
  requireEnv('VITE_SUPABASE_URL'),
  requireEnv('SUPABASE_SECRET_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } },
)

async function main() {
  const service = makeEyepieceProviderService()
  const result = await revalidateStaleSnapshots({
    client,
    fetchAsset: (assetKey) => service.getAsset(assetKey),
    staleBefore: new Date(Date.now() - ASSET_PREVIEW_SNAPSHOT_STALE_TIME),
    log: (line) => process.stdout.write(`  ${line}\n`),
  })
  process.stdout.write(
    `${result.candidates} stale, refreshed ${result.refreshed}, gone upstream ${result.missing}, failed ${result.failures.length}\n`,
  )
  for (const failure of result.failures) {
    process.stdout.write(`  ${failure}\n`)
  }
  // failed rows are retried next run; going red makes an outage visible
  if (result.failures.length > 0) process.exitCode = 1
}

await main()
