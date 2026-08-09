import { devices } from '@playwright/test'
import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE } from './support/collections-fixture'
import {
  logInAsFixtureUser,
  stubSeededAssetApi,
} from './support/collections-helpers'

const { publicCollection } = COLLECTIONS_FIXTURE

// the desktop-only projects never match pointer: coarse; this file covers
// the coarse-pointer tile styling under phone emulation
test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'firefox does not support isMobile emulation',
)
test.use({ ...devices['Pixel 7'] })

test.beforeEach(async ({ page }) => {
  await stubSeededAssetApi(page)
})

test('touch grids are bare: no veil, title, or tile controls', async ({
  page,
}) => {
  await page.goto(`/collections/${publicCollection.id}`)
  await expect(page.getByRole('grid').getByRole('row')).toHaveCount(3)

  for (const veil of await page.locator('[data-tile-reveal]').all()) {
    await expect(veil).toBeHidden()
  }
  await expect(page.getByRole('button', { name: 'Star' })).toHaveCount(0)
})

test('manage controls stay reachable on touch outside the hidden veil', async ({
  page,
}) => {
  await logInAsFixtureUser(page, `/collections/${publicCollection.id}/manage`)

  await expect(page.locator('[data-tile-reveal]').first()).toBeHidden()

  await page.getByRole('button', { name: 'Edit items' }).click()
  await expect(
    page.getByRole('button', { name: /^Remove / }).first(),
  ).toBeVisible()
})
