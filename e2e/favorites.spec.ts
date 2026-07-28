import { expect, test } from './fixtures'
import {
  TINY_PNG,
  nextServerPost,
  stubSeededAssetApi,
} from './support/collections-helpers'
import {
  deleteUserFavorite,
  seedUserFavorite,
} from './support/favorites-fixture'
import type { FavoriteFixture } from './support/favorites-fixture'
import type { TestInfo } from '@playwright/test'

function focusFixture({ workerIndex }: TestInfo): FavoriteFixture {
  const slot = String(workerIndex).padStart(12, '0')
  return {
    id: `e2efac00-0000-4000-8000-${slot}`,
    externalId: `e2e-favorites-focus-${workerIndex}`,
    title: `E2E Focus Favorite ${workerIndex}`,
  }
}

test.beforeEach(async ({ page }, testInfo) => {
  await seedUserFavorite(focusFixture(testInfo))
  await page.route('**/image/e2e-favorites-*/**', (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  )
  await stubSeededAssetApi(page)
})

test.afterEach(async () => {
  await deleteUserFavorite(focusFixture(test.info()))
})

// the removal/restore swap unmounts the control being pressed; without
// explicit handling focus falls to body
test(
  'the star removal swap keeps focus in the tile',
  { tag: '@user' },
  async ({ page }, testInfo) => {
    const fixture = focusFixture(testInfo)
    await page.goto('/favorites')
    await expect(
      page.getByRole('button', { name: 'Star' }).first(),
    ).toBeEnabled()

    const row = page.getByRole('row', { name: fixture.title })
    // veil controls are hit-testable only while hover-revealed
    await row.hover()

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
