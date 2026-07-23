// Reconciles the showcase user and curated collections against the database
// in SHOWCASE_CURATION. Targets whatever VITE_SUPABASE_URL /
// SUPABASE_SECRET_KEY point at (the pnpm script loads .env.local when
// present; explicit env always wins), so the same command provisions local
// Supabase after a db reset and production from CI. SHOWCASE_USER_EMAIL sets
// the account's email; it must be an address the deployment owner controls.
//
//   pnpm provision-showcase [--phase=apply|prune]
//
// CI splits the run around the Netlify publish: --phase=apply before it,
// --phase=prune after it succeeds. Without the flag both phases run.
import { createClient } from '@supabase/supabase-js'
import type {
  FetchShowcaseAsset,
  ProvisionShowcasePhase,
} from '@/features/collections/collections.showcase-provisioning'
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

function parsePhase(): ProvisionShowcasePhase {
  const flag = process.argv.find((arg) => arg.startsWith('--phase='))
  if (!flag) return 'full'
  const phase = flag.slice('--phase='.length)
  if (phase !== 'apply' && phase !== 'prune') {
    throw new Error(`invalid --phase value: ${phase} (use apply or prune)`)
  }
  return phase
}

const phase = parsePhase()
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

console.log(`Provisioning showcase content on ${new URL(url).host} (${phase})`)
const summary = await provisionShowcaseContent(
  adminClient,
  fetchAsset,
  SHOWCASE_CURATION,
  { email: requireEnv('SHOWCASE_USER_EMAIL'), phase },
)
console.log(
  [
    ...(phase !== 'prune'
      ? [
          `user ${summary.userCreated ? 'created' : 'already provisioned'}`,
          `${summary.collectionsWritten} collections written`,
          `${summary.itemsWritten} items written`,
          `${summary.snapshotsFetched} snapshots fetched from providers`,
        ]
      : []),
    ...(phase !== 'apply'
      ? [`${summary.collectionsDeleted} collections pruned`]
      : []),
    `${summary.itemsRemoved} items pruned`,
  ].join('\n'),
)
