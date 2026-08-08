import { devices } from '@playwright/test'
import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE } from './support/collections-fixture'
import {
  logInAsFixtureUser,
  stubSeededAssetApi,
} from './support/collections-helpers'

const { publicCollection } = COLLECTIONS_FIXTURE

// the mobile projects stay disabled (playwright.config.ts), so the
// coarse-pointer tile styling gets targeted emulated coverage here.
// Chromium only: firefox does not support isMobile emulation
test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'coarse-pointer emulation is chromium-only',
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
  // hidden controls also leave the accessibility tree
  await expect(page.getByRole('button', { name: 'Star' })).toHaveCount(0)
})

test('manage controls stay reachable on touch outside the hidden veil', async ({
  page,
}) => {
  await logInAsFixtureUser(page, `/collections/${publicCollection.id}/manage`)

  // the veil hides on touch here like everywhere else
  await expect(page.locator('[data-tile-reveal]').first()).toBeHidden()

  // remove lives outside the reveal rules and shows without any hover
  await page.getByRole('button', { name: 'Edit items' }).click()
  await expect(
    page.getByRole('button', { name: /^Remove / }).first(),
  ).toBeVisible()
})
