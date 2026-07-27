import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE, thumbHref } from './support/collections-fixture'
import { TINY_PNG, stubFixtureImages } from './support/collections-helpers'
import type { Page } from '@playwright/test'

const { publicCollection, snapshots } = COLLECTIONS_FIXTURE
const wideSnapshot = snapshots[0]
const wideKey = `nasa_ivl-${wideSnapshot.externalId}`

async function stubAssetApi(page: Page) {
  const image = {
    href: thumbHref(wideSnapshot.externalId),
    width: wideSnapshot.width,
    height: wideSnapshot.height,
  }
  await page.route(
    `**/api/v1/asset/nasa_ivl/${wideSnapshot.externalId}`,
    (route) =>
      route.fulfill({
        json: {
          key: { providerId: 'nasa_ivl', externalId: wideSnapshot.externalId },
          title: wideSnapshot.title,
          description: 'Stubbed asset for the overlay journeys',
          thumbnail: image,
          image,
          original: image,
        },
      }),
  )
  await stubFixtureImages(page)
}

async function openOverlayFromCollection(page: Page) {
  await page.goto(`/collections/${publicCollection.id}`)
  // enabled star = hydrated (the click upgrade needs the router)
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()
  await page.getByRole('link', { name: wideSnapshot.title }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

test('opening a tile masks the URL above the still-mounted list', async ({
  page,
}) => {
  await stubAssetApi(page)
  await page.goto(`/collections/${publicCollection.id}`)
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()
  const rows = page.getByRole('grid').getByRole('row')
  await expect(rows).toHaveCount(3)

  await expect(
    page.getByRole('link', { name: wideSnapshot.title }),
  ).not.toHaveAttribute('aria-current')

  const lengthBefore = await page.evaluate(() => history.length)
  await page.getByRole('link', { name: wideSnapshot.title }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await expect(page).toHaveURL(`/assets/nasa_ivl/${wideSnapshot.externalId}`)
  await expect(page).toHaveTitle(new RegExp(wideSnapshot.title))
  // the overlay is the detail surface: title heading and action row
  await expect(
    dialog.getByRole('heading', { level: 2, name: wideSnapshot.title }),
  ).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Metadata' })).toBeVisible()
  // the list stays mounted underneath
  await expect(rows).toHaveCount(3)
  expect(await page.evaluate(() => history.length)).toBe(lengthBefore + 1)
})

test('Escape closes back to the list and refocuses the origin tile', async ({
  page,
}) => {
  await stubAssetApi(page)
  await openOverlayFromCollection(page)

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page).toHaveURL(`/collections/${publicCollection.id}`)
  await expect(page).toHaveTitle(new RegExp(publicCollection.name))
  // the exact element that opened the overlay gets focus back
  await expect(
    page.locator(`[data-tile-primary-link][data-asset-key="${wideKey}"]`),
  ).toBeFocused()

  // Forward restores the masked entry: overlay reopens on the asset URL
  await page.goForward()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveURL(`/assets/nasa_ivl/${wideSnapshot.externalId}`)
  await page.goBack()
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page).toHaveURL(`/collections/${publicCollection.id}`)
})

test('clicking the backdrop closes the overlay', async ({ page }) => {
  await stubAssetApi(page)
  await openOverlayFromCollection(page)

  // the dismissable overlay's backdrop is the area outside the sheet
  await page.mouse.click(10, 10)
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page).toHaveURL(`/collections/${publicCollection.id}`)
})

test('reloading while open lands on the full detail page', async ({ page }) => {
  // the reload produces a fresh document whose SSR loader cannot be
  // stubbed, so this journey rides a live homepage strip record (the same
  // exposure the deep-link specs carry)
  await page.goto('/')
  const firstTileLink = page.locator('a[data-tile-primary-link]').first()
  await expect(firstTileLink).toBeVisible()
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()
  const maskedHref = await firstTileLink.getAttribute('href')
  expect(maskedHref).toMatch(/^\/assets\//)

  await firstTileLink.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveURL(maskedHref ?? /assets/)

  await page.reload()
  await expect(page).toHaveURL(maskedHref ?? /assets/)
  await expect(page.getByRole('dialog')).toBeHidden()
  // the full detail page, not the overlay: whether a subsequent back
  // restores the masked entry or the list is browser bfcache territory
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test(
  'the overlay opens from the private favorites grid',
  { tag: '@user' },
  async ({ page }) => {
    // favorites belong to the shared fixture user, so the overlay fetch is
    // stubbed generically from the requested key
    await page.route('**/api/v1/asset/**', (route) => {
      const segments = new URL(route.request().url()).pathname.split('/')
      const [providerId, externalId] = segments.slice(-2)
      const image = {
        href: 'https://example.com/stub.png',
        width: 400,
        height: 300,
      }
      return route.fulfill({
        json: {
          key: { providerId, externalId },
          title: 'Stubbed Favorite',
          description: 'Stubbed asset for the overlay journey',
          thumbnail: image,
          image,
          original: image,
        },
      })
    })
    await page.route('https://example.com/stub.png', (route) =>
      route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
    )
    await page.goto('/favorites')
    await expect(
      page.getByRole('button', { name: 'Star' }).first(),
    ).toBeEnabled()

    const firstTileLink = page
      .getByRole('grid')
      .getByRole('row')
      .first()
      .locator('a[data-tile-primary-link]')
    const maskedHref = await firstTileLink.getAttribute('href')
    expect(maskedHref).toMatch(/^\/assets\//)
    await firstTileLink.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page).toHaveURL(maskedHref ?? /assets/)

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page).toHaveURL('/favorites')
  },
)
