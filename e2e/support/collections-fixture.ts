import { createClient } from '@supabase/supabase-js'

// Fixture rows for the collection detail spec, seeded by collections.setup.ts
// with the service role against the local stack. Ids are fixed (and valid v4:
// read-side schemas reject other version/variant nibbles) so reseeding stays
// idempotent and the spec can address rows without a manifest file.
export const COLLECTIONS_FIXTURE = {
  user: {
    id: 'e2ec0000-0000-4000-8000-000000000001',
    email: 'e2e-collections@example.com',
    password: 'hunter2-e2e-collections',
    displayName: 'e2e curator',
  },
  // real NASA external ids so tile -> detail navigation works in journey
  // specs, chosen OUTSIDE the showcase set (snapshots are unique per
  // provider+external id, so showcase-owned assets would collide); titles
  // and dimensions stay synthetic - stored dims drive layout, not bitmaps
  snapshots: [
    {
      id: 'e2ec0000-0000-4000-8000-00000000a001',
      externalId: 'PIA14417',
      title: 'E2E Wide',
      width: 600,
      height: 300,
    },
    {
      id: 'e2ec0000-0000-4000-8000-00000000a002',
      externalId: 'PIA03606',
      title: 'E2E Square',
      width: 300,
      height: 300,
    },
    {
      id: 'e2ec0000-0000-4000-8000-00000000a003',
      externalId: 'ARC-2010-ACD10-0054-007',
      title: 'E2E Tall',
      width: 200,
      height: 300,
    },
  ],
  publicCollection: {
    id: 'e2ec0000-0000-4000-8000-00000000c001',
    name: 'e2e public collection',
  },
  privateCollection: {
    id: 'e2ec0000-0000-4000-8000-00000000c002',
    name: 'e2e private collection',
  },
  // three pages at the default page size, so the paging spec can observe
  // whether page 3 waits for page 2's thumbnails
  pagingCollection: {
    id: 'e2ec0000-0000-4000-8000-00000000c003',
    name: 'e2e paging collection',
    itemCount: 60,
  },
  unknownCollectionId: 'e2ec0000-0000-4000-8000-00000000dead',
} as const

export function pagingSnapshot(index: number) {
  const suffix = String(index).padStart(2, '0')
  return {
    id: `e2ec0000-0000-4000-8000-00000000b0${suffix}`,
    externalId: `e2e-collections-page-${suffix}`,
    title: `E2E Page Item ${suffix}`,
    width: 200 + (index % 5) * 100,
    height: 300,
  }
}

export function thumbHref(externalId: string) {
  return `https://images-assets.nasa.gov/image/${externalId}/${externalId}~thumb.jpg`
}

// The spec process gets no env injection from the harness; the same local
// values the app server uses live in .env.test / .env.local (CI generates
// .env.local in the e2e job). loadEnvFile never overrides existing vars.
export function makeAdminClient() {
  for (const file of ['.env.test', '.env.local']) {
    try {
      process.loadEnvFile(file)
    } catch {
      // absent file; the other one carries the values
    }
  }
  const url = process.env.VITE_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL / SUPABASE_SECRET_KEY for e2e seeding. Run `pnpm supabase start` and populate .env.test or .env.local.',
    )
  }
  return createClient(url, secretKey, { auth: { persistSession: false } })
}
