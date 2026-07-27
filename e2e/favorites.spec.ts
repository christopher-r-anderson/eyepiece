import { randomUUID } from 'node:crypto'
import { expect, test } from './fixtures'
import { TINY_PNG, nextServerPost } from './support/collections-helpers'
import {
  deleteUserFavorite,
  seedUserFavorite,
} from './support/favorites-fixture'
import type { FavoriteFixture } from './support/favorites-fixture'

// per-run identity (fresh id/title each test) so the chromium, firefox,
// and webkit projects never seed, restore, and delete the same row
let fixture: FavoriteFixture

test.beforeEach(async ({ page }, testInfo) => {
  const token = `${testInfo.project.name}-${randomUUID()}`
  fixture = {
    id: randomUUID(),
    externalId: `e2e-favorites-${token}`,
    title: `E2E Focus Favorite ${token}`,
  }
  await seedUserFavorite(fixture)
  await page.route('**/image/e2e-favorites-*/**', (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  )
})

test.afterEach(async () => {
  await deleteUserFavorite(fixture)
})

// the removal/restore swap unmounts the control being pressed; without
// explicit handling focus falls to body
test(
  'the star removal swap keeps focus in the tile',
  { tag: '@user' },
  async ({ page }) => {
    await page.goto('/favorites')
    await expect(
      page.getByRole('button', { name: 'Star' }).first(),
    ).toBeEnabled()

    const row = page.getByRole('row', { name: fixture.title })
    // veil controls are hit-testable only while hover-revealed
    await row.hover()

    // await each POST before subscribing for the next; nextServerPost
    // matches any POST, so an un-awaited unstar could satisfy the restore
    const unstarred = nextServerPost(page)
    await row.getByRole('button', { name: 'Star' }).click()
    const undo = row.getByRole('button', { name: 'Undo' })
    await expect(undo).toBeFocused()
    await unstarred

    const restored = nextServerPost(page)
    await undo.click()
    await expect(row.getByRole('button', { name: 'Star' })).toBeFocused()
    await expect(row.getByText('Removed')).toBeHidden()
    await restored
  },
)
