// Reconciles the showcase user and curated collections against the database
// in SHOWCASE_CURATION. Targets whatever VITE_SUPABASE_URL /
// SUPABASE_SECRET_KEY point at (falling back to .env.local), so the same
// command provisions local Supabase after a db reset and production from CI.
//
//   pnpm provision-showcase
import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import type { FetchShowcaseAsset } from '@/features/collections/collections.showcase-provisioning'
import type { Asset } from '@/domain/asset/asset.schema'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { Database } from '@/integrations/supabase/database.types'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { makeNasaIvlAdapter } from '@/server/eyepiece/providers/nasa-ivl/nasa-ivl.provider'
import {
  getApiKey as getSioaApiKey,
  makeSiOaAdapter,
} from '@/server/eyepiece/providers/si-oa/si-oa.provider'
import { SHOWCASE_CURATION } from '@/features/collections/collections.showcase'
import { provisionShowcaseContent } from '@/features/collections/collections.showcase-provisioning'

function loadEnvFallback() {
  if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) return
  if (!existsSync('.env.local')) return
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const match = /^([A-Z0-9_]+)=("?)(.*)\2$/.exec(line.trim())
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[3]
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing env var ${name} (set it, or populate .env.local via pnpm print-supabase-env)`,
    )
  }
  return value
}

interface AssetLookup {
  getAsset: (externalId: string) => Promise<Asset | null>
}

// adapters are built lazily so a provider's requirements (the SI_OA api key)
// only apply when the curation actually references that provider
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

const fetchAsset: FetchShowcaseAsset = async (assetKey) => {
  const asset = await adapterFor(assetKey.providerId).getAsset(
    assetKey.externalId,
  )
  if (asset === null) return null
  return { title: asset.title, thumbnail: asset.thumbnail }
}

loadEnvFallback()
const url = requireEnv('VITE_SUPABASE_URL')
const adminClient = createClient<Database>(
  url,
  requireEnv('SUPABASE_SECRET_KEY'),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
)

console.log(`Provisioning showcase content on ${new URL(url).host}`)
const summary = await provisionShowcaseContent(
  adminClient,
  fetchAsset,
  SHOWCASE_CURATION,
)
console.log(
  [
    `user ${summary.userCreated ? 'created' : 'already provisioned'}`,
    `${summary.collectionsWritten} collections written (${summary.collectionsDeleted} pruned)`,
    `${summary.itemsWritten} items written (${summary.itemsRemoved} pruned)`,
    `${summary.snapshotsFetched} snapshots fetched from providers`,
  ].join('\n'),
)
