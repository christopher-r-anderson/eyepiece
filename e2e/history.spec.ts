import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE } from './support/collections-fixture'
import type { Page } from '@playwright/test'

const { publicCollection, snapshots } = COLLECTIONS_FIXTURE
const wideSnapshot = snapshots[0]

// D13: closing a dialog never pushes history forward. An open pushed by the
// app is consumed with a real back(); a deep-linked open closes by replace.

// the tile -> detail journey navigates client-side, so the browser fetches
// the asset through /api/v1 and the spec can serve it deterministically
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

test('closing the metadata dialog consumes its history entry', async ({
  page,
}) => {
  await stubAssetApi(page)
  await page.goto(`/collections/${publicCollection.id}`)
  // enabled star = hydrated (tile links work pre-hydration, dialogs do not)
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()
  await page.getByRole('link', { name: wideSnapshot.title }).click()
  await page.waitForURL(`/assets/nasa_ivl/${wideSnapshot.externalId}`)
  // the detail page has replaced the grid once its own controls exist;
  // its single enabled star is then the hydration gate
  await expect(
    page.getByRole('button', { name: 'View metadata' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Star' })).toBeEnabled()

  const lengthBefore = await page.evaluate(() => history.length)
  await page.getByRole('button', { name: 'View metadata' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForFunction(() => location.hash === '#metadata')
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  await page.keyboard.press('Escape')
  await page.waitForFunction(() => location.hash === '')
  await expect(page.getByRole('dialog')).toBeHidden()
  // the close went back over the entry the open pushed - no forward growth
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  // and one more back skips the dialog entirely
  await page.goBack()
  await page.waitForURL(`/collections/${publicCollection.id}`)
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('a deep-linked metadata dialog closes in place', async ({ page }) => {
  // a deep link is by definition a fresh document, so this journey needs a
  // server-rendered detail page; it uses a live, stable NASA asset and
  // shares the suite's existing live-SSR exposure (search sections do the
  // same). Everything else in this file is hermetic.
  await page.goto('/assets/nasa_ivl/PIA14417#metadata')
  await expect(page.getByRole('dialog')).toBeVisible()

  const lengthBefore = await page.evaluate(() => history.length)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => location.hash === '')
  await expect(page.getByRole('dialog')).toBeHidden()
  // nothing to go back over: the close replaced the deep-linked entry
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore)
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
  // no entry was pushed to open it, so the close replaced in place
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore)
  expect(await page.evaluate(() => location.pathname)).toBe(
    `/collections/${publicCollection.id}`,
  )
})

test('the auth dialog occupies one history entry from open to close', async ({
  page,
}) => {
  // a known prior entry lets the final goBack prove the close truly went
  // back over the dialog entry (a replace-close would preserve length and
  // pathname but leave Back stranded on the collection)
  await page.goto('/')
  await page.goto(`/collections/${publicCollection.id}`)
  const tile = page.getByRole('listitem').first()
  await expect(tile.getByRole('button', { name: 'Star' })).toBeEnabled()
  // the veil must be revealed before its controls take the pointer
  await tile.hover()

  const lengthBefore = await page.evaluate(() => history.length)
  await tile.getByRole('button', { name: 'Star' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForFunction(() => location.search.includes('auth=login'))
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  // the forgot-password link stays inside the same entry
  await page.getByRole('link', { name: 'Forgot Password?' }).click()
  await page.waitForFunction(() => location.search.includes('fp=1'))
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)

  // as do tab switches
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

  // Back leaves the page entirely - the dialog entry is gone
  await page.goBack()
  await page.waitForURL('/')
  await expect(page.getByRole('dialog')).toBeHidden()
})
