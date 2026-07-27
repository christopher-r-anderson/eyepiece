import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE } from './support/collections-fixture'
import type { Page } from '@playwright/test'

const { publicCollection, snapshots } = COLLECTIONS_FIXTURE
const wideSnapshot = snapshots[0]

// Closing a dialog must never push history forward: an app-pushed open is
// consumed with a real back(), a deep-linked open closes by replace.

// client-side navigation fetches the asset through /api/v1 in the browser,
// so these journeys serve it themselves; only the deep-link spec needs a
// fresh document and has to hit the live provider during SSR
async function stubAssetApi(page: Page) {
  const image = {
    href: `https://images-assets.nasa.gov/image/${wideSnapshot.externalId}/${wideSnapshot.externalId}~thumb.jpg`,
    width: wideSnapshot.width,
    height: wideSnapshot.height,
  }
  await page.route(
    `**/api/v1/asset/nasa_ivl/${wideSnapshot.externalId}/metadata`,
    (route) => route.fulfill({ json: { instrument: 'stub' } }),
  )
  await page.route(
    `**/api/v1/asset/nasa_ivl/${wideSnapshot.externalId}`,
    (route) =>
      route.fulfill({
        json: {
          key: { providerId: 'nasa_ivl', externalId: wideSnapshot.externalId },
          title: wideSnapshot.title,
          description: 'Stubbed asset for the history journey',
          thumbnail: image,
          image,
          original: image,
        },
      }),
  )
}

test('the metadata disclosure expands in place with no history entry', async ({
  page,
}) => {
  await stubAssetApi(page)
  await page.route(
    `**/api/v1/asset/nasa_ivl/${wideSnapshot.externalId}/metadata`,
    (route) => route.fulfill({ json: { Camera: 'E2E Cam' } }),
  )
  await page.goto(`/collections/${publicCollection.id}`)
  // enabled star = hydrated (tile links work pre-hydration, expansion does
  // not need it, but the journey should mirror real use)
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()
  await page.getByRole('link', { name: wideSnapshot.title }).click()
  await page.waitForURL(`/assets/nasa_ivl/${wideSnapshot.externalId}`)

  const trigger = page.getByRole('button', { name: 'Metadata' })
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  const lengthBefore = await page.evaluate(() => history.length)
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('cell', { name: 'E2E Cam' })).toBeVisible()
  // in-surface expansion: no hash, no history entry
  expect(await page.evaluate(() => location.hash)).toBe('')
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore)

  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore)

  await page.goBack()
  await page.waitForURL(`/collections/${publicCollection.id}`)
})

test('a legacy #metadata deep link renders the page without a dialog', async ({
  page,
}) => {
  // a fresh document can't be stubbed from the page, so this uses a
  // stable live NASA record (the same exposure the search specs carry);
  // the dialog is retired, so the old hash spelling must land inert
  await page.goto('/assets/nasa_ivl/PIA14417#metadata')
  await expect(page.getByRole('button', { name: 'Metadata' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(await page.evaluate(() => location.pathname)).toBe(
    '/assets/nasa_ivl/PIA14417',
  )
})

test('a deep-linked auth dialog closes in place', async ({ page }) => {
  await page.goto(`/collections/${publicCollection.id}?auth=login`)
  await expect(page.getByRole('dialog')).toBeVisible()

  const lengthBefore = await page.evaluate(() => history.length)
  await page
    .getByRole('button', { name: 'Close Log In or Register dialog' })
    .click()
  await page.waitForFunction(() => !location.search.includes('auth'))
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore)
  expect(await page.evaluate(() => location.pathname)).toBe(
    `/collections/${publicCollection.id}`,
  )
})

test('the auth dialog occupies one history entry from open to close', async ({
  page,
}) => {
  // the extra prior entry lets the final goBack distinguish a real
  // back-close from a same-URL replace
  await page.goto('/')
  await page.goto(`/collections/${publicCollection.id}`)
  const tile = page.getByRole('grid').getByRole('row').first()
  await expect(tile.getByRole('button', { name: 'Star' })).toBeEnabled()
  // the veil must be revealed before its controls take the pointer
  await tile.hover()

  const lengthBefore = await page.evaluate(() => history.length)
  await tile.getByRole('button', { name: 'Star' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForFunction(() => location.search.includes('auth=login'))
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  await page.getByRole('link', { name: 'Forgot Password?' }).click()
  await page.waitForFunction(() => location.search.includes('fp=1'))
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  await page.getByRole('tab', { name: 'Register' }).click()
  await page.waitForFunction(() => location.search.includes('auth=register'))
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  await page
    .getByRole('button', { name: 'Close Log In or Register dialog' })
    .click()
  await page.waitForFunction(() => !location.search.includes('auth'))
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)
  expect(await page.evaluate(() => location.pathname)).toBe(
    `/collections/${publicCollection.id}`,
  )

  await page.goBack()
  await page.waitForURL('/')
  await expect(page.getByRole('dialog')).toBeHidden()
})
