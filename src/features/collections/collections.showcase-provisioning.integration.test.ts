import { afterEach, describe, expect, vi } from 'vitest'
import { provisionShowcaseContent } from './collections.showcase-provisioning'
import type { FetchShowcaseAsset } from './collections.showcase-provisioning'
import type { ShowcaseCuration } from './collections.showcase'
import { createAdminClient, it } from '@/test/integration-fixtures'

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function makeCuration(): ShowcaseCuration {
  const suffix = uniqueSuffix()
  return {
    user: {
      id: crypto.randomUUID(),
      email: `showcase-test-${suffix}@example.com`,
      displayName: 'showcase test',
    },
    collections: [
      {
        id: crypto.randomUUID(),
        name: 'first collection',
        visibility: 'public',
        items: [
          { providerId: 'nasa_ivl', externalId: `showcase-${suffix}-a` },
          { providerId: 'nasa_ivl', externalId: `showcase-${suffix}-b` },
          { providerId: 'nasa_ivl', externalId: `showcase-${suffix}-c` },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'second collection',
        visibility: 'public',
        items: [{ providerId: 'nasa_ivl', externalId: `showcase-${suffix}-d` }],
      },
    ],
  }
}

const stubFetchAsset: FetchShowcaseAsset = (assetKey) =>
  Promise.resolve({
    title: `Showcase asset ${assetKey.externalId}`,
    thumbnail: {
      href: `https://images.example.com/${assetKey.externalId}.jpg`,
      width: 640,
      height: 480,
    },
  })

const provisionedUserIds: Array<string> = []
const provisionedExternalIds: Array<string> = []

function trackCuration(curation: ShowcaseCuration): ShowcaseCuration {
  provisionedUserIds.push(curation.user.id)
  provisionedExternalIds.push(
    ...curation.collections.flatMap((collection) =>
      collection.items.map((item) => item.externalId),
    ),
  )
  return curation
}

afterEach(async () => {
  const admin = createAdminClient()
  // deleting the user cascades collections and items, which releases the
  // RESTRICT references so the snapshots can be deleted afterwards
  for (const userId of provisionedUserIds.splice(0)) {
    await admin.auth.admin.deleteUser(userId).catch(() => {})
  }
  if (provisionedExternalIds.length > 0) {
    await admin
      .from('asset_preview_snapshots')
      .delete()
      .in('external_id', provisionedExternalIds.splice(0))
  }
})

describe('provisionShowcaseContent', () => {
  it('provisions user, profile, collections, and items from scratch', async ({
    adminClient,
  }) => {
    const curation = trackCuration(makeCuration())
    const summary = await provisionShowcaseContent(
      adminClient,
      stubFetchAsset,
      curation,
    )

    expect(summary).toEqual({
      userCreated: true,
      snapshotsFetched: 4,
      collectionsWritten: 2,
      collectionsDeleted: 0,
      itemsWritten: 4,
      itemsRemoved: 0,
    })

    const { data: authUser } = await adminClient.auth.admin.getUserById(
      curation.user.id,
    )
    expect(authUser.user?.email).toBe(curation.user.email)

    const { data: profile } = await adminClient
      .from('profiles')
      .select('display_name')
      .eq('id', curation.user.id)
      .single()
    expect(profile?.display_name).toBe(curation.user.displayName)

    const { data: collections } = await adminClient
      .from('collections')
      .select('id, name, visibility, position')
      .eq('owner_id', curation.user.id)
      .order('position')
    expect(collections).toEqual([
      {
        id: curation.collections[0].id,
        name: 'first collection',
        visibility: 'public',
        position: 1,
      },
      {
        id: curation.collections[1].id,
        name: 'second collection',
        visibility: 'public',
        position: 2,
      },
    ])

    const { data: items } = await adminClient
      .from('collection_items')
      .select('position, asset_preview_snapshots(external_id)')
      .eq('collection_id', curation.collections[0].id)
      .order('position')
    expect(
      items?.map((item) => item.asset_preview_snapshots.external_id),
    ).toEqual(curation.collections[0].items.map((item) => item.externalId))
  })

  it('is idempotent and skips provider fetches for fresh snapshots', async ({
    adminClient,
  }) => {
    const curation = trackCuration(makeCuration())
    await provisionShowcaseContent(adminClient, stubFetchAsset, curation)

    const countingFetch = vi.fn(stubFetchAsset)
    const summary = await provisionShowcaseContent(
      adminClient,
      countingFetch,
      curation,
    )

    expect(countingFetch).not.toHaveBeenCalled()
    expect(summary).toEqual({
      userCreated: false,
      snapshotsFetched: 0,
      collectionsWritten: 2,
      collectionsDeleted: 0,
      itemsWritten: 4,
      itemsRemoved: 0,
    })

    const { count } = await adminClient
      .from('collections')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', curation.user.id)
    expect(count).toBe(2)
  })

  it('reconciles renames, reorders, and removals on a later run', async ({
    adminClient,
  }) => {
    const curation = trackCuration(makeCuration())
    await provisionShowcaseContent(adminClient, stubFetchAsset, curation)

    const [first] = curation.collections
    const edited: ShowcaseCuration = {
      user: {
        ...curation.user,
        email: `renamed-${curation.user.email}`,
        displayName: 'renamed curator',
      },
      collections: [
        {
          ...first,
          name: 'renamed collection',
          // drop the first item, reverse the rest
          items: [first.items[2], first.items[1]],
        },
        // second collection dropped entirely
      ],
    }

    const summary = await provisionShowcaseContent(
      adminClient,
      stubFetchAsset,
      edited,
    )
    expect(summary).toEqual({
      userCreated: false,
      snapshotsFetched: 0,
      collectionsWritten: 1,
      collectionsDeleted: 1,
      itemsWritten: 2,
      // one pruned from the kept collection, one cascaded with the dropped one
      itemsRemoved: 2,
    })

    const { data: authUser } = await adminClient.auth.admin.getUserById(
      curation.user.id,
    )
    expect(authUser.user?.email).toBe(edited.user.email)
    expect(authUser.user?.email_confirmed_at).toBeTruthy()
    expect(authUser.user?.user_metadata.display_name).toBe('renamed curator')

    const { data: profile } = await adminClient
      .from('profiles')
      .select('display_name')
      .eq('id', curation.user.id)
      .single()
    expect(profile?.display_name).toBe('renamed curator')

    const { data: collections } = await adminClient
      .from('collections')
      .select('id, name')
      .eq('owner_id', curation.user.id)
    expect(collections).toEqual([{ id: first.id, name: 'renamed collection' }])

    const { data: items } = await adminClient
      .from('collection_items')
      .select('position, asset_preview_snapshots(external_id)')
      .eq('collection_id', first.id)
      .order('position')
    expect(
      items?.map((item) => item.asset_preview_snapshots.external_id),
    ).toEqual([first.items[2].externalId, first.items[1].externalId])
  })

  it('never touches collections owned by other users', async ({
    adminClient,
    user,
    client,
  }) => {
    const { data: theirCollection } = await client
      .from('collections')
      .insert({
        owner_id: user.id,
        name: 'their collection',
        visibility: 'private',
        position: 1,
      })
      .select('id')
      .single()

    const curation = trackCuration(makeCuration())
    await provisionShowcaseContent(adminClient, stubFetchAsset, curation)

    const { data: still } = await adminClient
      .from('collections')
      .select('id, owner_id')
      .eq('id', theirCollection!.id)
      .single()
    expect(still?.owner_id).toBe(user.id)
  })

  it('refuses a curation whose collection id belongs to another user', async ({
    adminClient,
    user,
    client,
  }) => {
    const { data: theirCollection } = await client
      .from('collections')
      .insert({
        owner_id: user.id,
        name: 'their collection',
        visibility: 'private',
        position: 1,
      })
      .select('id')
      .single()

    const curation = trackCuration(makeCuration())
    curation.collections[0].id = theirCollection!.id

    await expect(
      provisionShowcaseContent(adminClient, stubFetchAsset, curation),
    ).rejects.toThrow(/owned by another user/)

    const { data: still } = await adminClient
      .from('collections')
      .select('owner_id, name')
      .eq('id', theirCollection!.id)
      .single()
    expect(still).toEqual({ owner_id: user.id, name: 'their collection' })
  })
})
