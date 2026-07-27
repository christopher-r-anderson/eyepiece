import { makeAdminClient, thumbHref } from './collections-fixture'

// the seeded login user (supabase/seeds/users.sql); favorites specs seed
// their own uniquely-titled rows so parallel workers never share a tile
export const SEED_USER_ID = '7e5dfb34-a0ad-41bb-ac2a-bb159c270ee3'

export interface FavoriteFixture {
  id: string
  externalId: string
  title: string
}

export async function seedUserFavorite(fixture: FavoriteFixture) {
  const admin = makeAdminClient()
  const { error: snapshotError } = await admin
    .from('asset_preview_snapshots')
    .upsert({
      id: fixture.id,
      provider_id: 'nasa_ivl',
      external_id: fixture.externalId,
      title: fixture.title,
      thumb_href: thumbHref(fixture.externalId),
      thumb_width: 400,
      thumb_height: 300,
    })
  if (snapshotError) {
    throw new Error(
      `Failed to seed favorite snapshot: ${snapshotError.message}`,
    )
  }
  const { error: favoriteError } = await admin.from('favorites').upsert({
    owner_id: SEED_USER_ID,
    asset_preview_snapshot_id: fixture.id,
  })
  if (favoriteError) {
    throw new Error(`Failed to seed favorite: ${favoriteError.message}`)
  }
}

export async function deleteUserFavorite(fixture: FavoriteFixture) {
  const admin = makeAdminClient()
  await admin
    .from('favorites')
    .delete()
    .eq('owner_id', SEED_USER_ID)
    .eq('asset_preview_snapshot_id', fixture.id)
  await admin.from('asset_preview_snapshots').delete().eq('id', fixture.id)
}
