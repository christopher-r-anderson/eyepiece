// Re-ensures stored asset preview snapshots against their provider so they
// carry a real rendition ladder (#194). The migration that introduced the
// ladder could only derive a single entry from the thumbnail it replaced, and
// on Smithsonian records that entry can carry the aspect ratio of the 4:3
// fallback the mapper used to apply, which the justified grid breaks rows on.
//
//   pnpm backfill-snapshot-renditions [--dry-run] [--limit=N] [--all]
//
// This is a one-off: snapshots written by the current code already carry a
// ladder, and nothing refreshes them on read. It selects only single-entry
// rows unless --all is passed, so a re-run costs one provider request per row
// that legitimately has one rendition rather than per row in the table.
//
// Safe to interrupt and re-run: each row is an independent upsert through the
// same RPC the app uses, and a row that fails is left for the next run.
//
// Delete this once production is backfilled.
import { createClient } from '@supabase/supabase-js'
import type { Asset } from '@/domain/asset/asset.schema'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { Database } from '@/integrations/supabase/database.types'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { makeNasaIvlAdapter } from '@/server/eyepiece/providers/nasa-ivl/nasa-ivl.provider'
import {
  getApiKey as getSioaApiKey,
  makeSiOaAdapter,
} from '@/server/eyepiece/providers/si-oa/si-oa.provider'

// providers are public APIs with their own budgets, and a backfill has no
// deadline worth spending one on
const REQUEST_SPACING_MS = 250
const PAGE_SIZE = 200

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing env var ${name} (set it, or populate .env.local via pnpm print-supabase-env)`,
    )
  }
  return value
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

interface AssetLookup {
  getAsset: (externalId: string) => Promise<Asset | null>
}

// built lazily so a provider's requirements (the SI_OA api key) only apply
// when the table actually holds one of its records
const adapters = new Map<ProviderId, AssetLookup>()

function adapterFor(providerId: ProviderId): AssetLookup {
  let adapter = adapters.get(providerId)
  if (!adapter) {
    adapter =
      providerId === NASA_IVL_PROVIDER_ID
        ? makeNasaIvlAdapter()
        : makeSiOaAdapter(getSioaApiKey())
    adapters.set(providerId, adapter)
  }
  return adapter
}

function parseLimit() {
  const flag = process.argv.find((arg) => arg.startsWith('--limit='))
  if (!flag) return undefined
  const limit = Number(flag.slice('--limit='.length))
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error(`invalid --limit value: ${flag}`)
  }
  return limit
}

const dryRun = process.argv.includes('--dry-run')
const all = process.argv.includes('--all')
const limit = parseLimit()

const client = createClient<Database>(
  requireEnv('VITE_SUPABASE_URL'),
  requireEnv('SUPABASE_SECRET_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } },
)

async function readCandidates() {
  const rows = []
  for (let page = 0; ; page++) {
    const { data, error } = await client
      .from('asset_preview_snapshots')
      .select('id, provider_id, external_id, renditions')
      .order('id', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (error) throw new Error(`Failed to read snapshots: ${error.message}`)
    if (data.length === 0) break
    for (const row of data) {
      const ladder = Array.isArray(row.renditions) ? row.renditions : []
      if (all || ladder.length <= 1) rows.push(row)
      if (limit && rows.length >= limit) return rows
    }
    if (data.length < PAGE_SIZE) break
  }
  return rows
}

async function main() {
  const candidates = await readCandidates()
  process.stdout.write(
    `${candidates.length} snapshot(s) to re-ensure${dryRun ? ' (dry run)' : ''}\n`,
  )

  let refreshed = 0
  let missing = 0
  const failures: Array<string> = []

  for (const row of candidates) {
    const label = `${row.provider_id}:${row.external_id}`
    if (dryRun) {
      process.stdout.write(`  would re-ensure ${label}\n`)
      continue
    }
    await sleep(REQUEST_SPACING_MS)
    try {
      const asset = await adapterFor(row.provider_id).getAsset(row.external_id)
      if (!asset) {
        // the provider no longer has the record; the stored row is the only
        // copy left, so it stays as it is
        missing++
        process.stdout.write(`  gone upstream, left alone: ${label}\n`)
        continue
      }
      const { error } = await client.rpc('ensure_asset_preview_snapshot', {
        p_provider_id: row.provider_id,
        p_external_id: row.external_id,
        p_title: asset.title,
        ...(asset.image && {
          p_image_width: asset.image.width,
          p_image_height: asset.image.height,
          p_renditions: asset.image.renditions,
        }),
      })
      if (error) throw new Error(error.message)
      refreshed++
    } catch (error) {
      failures.push(`${label}: ${(error as Error).message}`)
    }
  }

  if (!dryRun) {
    process.stdout.write(
      `refreshed ${refreshed}, gone upstream ${missing}, failed ${failures.length}\n`,
    )
    for (const failure of failures) process.stdout.write(`  ${failure}\n`)
  }
  // a row that failed keeps its old ladder and renders, so this reports
  // rather than exits non-zero: failing here would block the deploy behind an
  // upstream outage
}

await main()
