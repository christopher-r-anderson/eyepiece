import { randomUUID } from 'node:crypto'
import { expect, test } from './fixtures'
import {
  COLLECTIONS_FIXTURE,
  makeAdminClient,
} from './support/collections-fixture'
import {
  logInAsFixtureUser,
  nextServerPost,
} from './support/collections-helpers'

const { publicCollection, snapshots, user } = COLLECTIONS_FIXTURE

// mutating specs get their own collection (on the shared read-only fixture
// snapshots) so the detail specs running in parallel never see the edits
async function seedManageCollection(name: string) {
  const admin = makeAdminClient()
  const collectionId = randomUUID()
  const { error: collectionError } = await admin.from('collections').insert({
    id: collectionId,
    owner_id: user.id,
    name,
    visibility: 'private',
    position: 90,
  })
  if (collectionError) {
    throw new Error(
      `Failed to seed manage collection: ${collectionError.message}`,
    )
  }
  const { error: itemsError } = await admin.from('collection_items').insert(
    snapshots.map((snapshot, index) => ({
      collection_id: collectionId,
      asset_preview_snapshot_id: snapshot.id,
      position: index + 1,
    })),
  )
  if (itemsError) {
    throw new Error(`Failed to seed manage items: ${itemsError.message}`)
  }
  return collectionId
}

test(
  "the manage page is not found for another owner's collection",
  { tag: '@user' },
  async ({ page }) => {
    // signed in as user1, who does not own the fixture collection
    await page.goto(`/collections/${publicCollection.id}/manage`)
    await expect(
      page.getByRole('heading', { name: 'Collection Not Found' }),
    ).toBeVisible()

    await page.goto('/collections/not-a-uuid/manage')
    await expect(
      page.getByRole('heading', { name: 'Collection Not Found' }),
    ).toBeVisible()
  },
)

test('owner manages: rename, visibility, ghost removal with undo, delete', async ({
  page,
}) => {
  const name = `e2e manage ${Date.now()}`
  const collectionId = await seedManageCollection(name)
  try {
    await logInAsFixtureUser(page, '/collections')

    // list cards link to the manage page; navigating by click keeps the
    // session hydrated for everything below
    await page.getByRole('link', { name }).click()
    await page.waitForURL(`/collections/${collectionId}/manage`)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()

    // rename
    const renamed = `${name} renamed`
    await page.getByRole('textbox', { name: 'Name' }).fill(renamed)
    await page.getByRole('button', { name: 'Rename' }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: renamed }),
    ).toBeVisible()

    // visibility
    const visibilitySwitch = page.getByRole('switch', {
      name: 'Public collection',
    })
    await expect(visibilitySwitch).not.toBeChecked()
    // the switch input is visually hidden; the label is the click target
    await page.getByText('Public collection').click()
    await expect(visibilitySwitch).toBeChecked()

    // ghost removal: the tile keeps its slot, dimmed, with inline undo.
    // Each mutation runs on the page-side per-item queue with no visible
    // settle signal (by design), so the spec awaits the server-fn POST of
    // every operation before issuing the next state-dependent step
    await page.getByRole('button', { name: 'Edit items' }).click()
    const rows = page.getByRole('grid').getByRole('row')
    await expect(rows).toHaveCount(3)
    // veil controls are hit-testable only while hover-revealed
    await rows.nth(1).hover()
    const removedOnce = nextServerPost(page)
    await page.getByRole('button', { name: 'Remove E2E Square' }).click()
    await expect(page.getByText('Removed')).toBeVisible()
    await expect(rows).toHaveCount(3)
    // the swap unmounts the pressed Remove; focus lands on the Undo that
    // takes its slot, not on the body
    await expect(page.getByRole('button', { name: 'Undo' })).toBeFocused()
    await removedOnce

    // undo restores in place: the remove control comes back, nothing moved
    const reAdded = nextServerPost(page)
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByText('Removed')).toHaveCount(0)
    const removeControl = page.getByRole('button', {
      name: 'Remove E2E Square',
    })
    await expect(removeControl).toBeVisible()
    await expect(removeControl).toBeFocused()
    await expect(rows).toHaveCount(3)
    await reAdded

    // remove again and let it stand: the ghost clears on the next visit
    await rows.nth(1).hover()
    const removedAgain = nextServerPost(page)
    await page.getByRole('button', { name: 'Remove E2E Square' }).click()
    await expect(page.getByText('Removed')).toBeVisible()
    await removedAgain

    // a settings mutation while a ghost is showing must not refetch the
    // grid out from under it
    const renamedAgain = `${renamed} again`
    await page.getByRole('textbox', { name: 'Name' }).fill(renamedAgain)
    await page.getByRole('button', { name: 'Rename' }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: renamedAgain }),
    ).toBeVisible()
    await expect(page.getByText('Removed')).toBeVisible()
    await expect(rows).toHaveCount(3)

    // belt over the POST waits: confirm the persisted end state directly
    await expect
      .poll(async () => {
        const { count } = await makeAdminClient()
          .from('collection_items')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collectionId)
        return count
      })
      .toBe(2)
    await page.reload()
    await expect(page.getByRole('grid').getByRole('row')).toHaveCount(2)
    // the visibility change survived too
    await expect(
      page.getByRole('switch', { name: 'Public collection' }),
    ).toBeChecked()

    // delete with confirm, then back on the list without the card
    await expect(async () => {
      await page.getByRole('button', { name: 'Delete collection' }).click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1000 })
    }).toPass()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click()
    await page.waitForURL('/collections')
    await expect(page.getByRole('link', { name: renamedAgain })).toHaveCount(0)
  } finally {
    await makeAdminClient().from('collections').delete().eq('id', collectionId)
  }
})
