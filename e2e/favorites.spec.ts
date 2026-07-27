import { expect, test } from './fixtures'
import { TINY_PNG, nextServerPost } from './support/collections-helpers'
import {
  deleteUserFavorite,
  seedUserFavorite,
} from './support/favorites-fixture'

const FOCUS_FAVORITE = {
  id: 'e2ec0000-0000-4000-8000-00000000fa01',
  externalId: 'e2e-favorites-focus',
  title: 'E2E Focus Favorite',
}

test.beforeEach(async ({ page }) => {
  await seedUserFavorite(FOCUS_FAVORITE)
  await page.route('**/image/e2e-favorites-*/**', (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  )
})

test.afterEach(async () => {
  await deleteUserFavorite(FOCUS_FAVORITE)
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

    const row = page.getByRole('row', { name: FOCUS_FAVORITE.title })
    // veil controls are hit-testable only while hover-revealed
    await row.hover()
    await row.getByRole('button', { name: 'Star' }).click()

    const undo = row.getByRole('button', { name: 'Undo' })
    await expect(undo).toBeFocused()

    // the restore settles before afterEach deletes the fixture rows
    const restored = nextServerPost(page)
    await undo.click()
    await expect(row.getByRole('button', { name: 'Star' })).toBeFocused()
    await expect(row.getByText('Removed')).toBeHidden()
    await restored
  },
)
