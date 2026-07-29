import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE, thumbHref } from './support/collections-fixture'
import type { Locator, Page } from '@playwright/test'

const { publicCollection, snapshots } = COLLECTIONS_FIXTURE
const wideSnapshot = snapshots[0]

// a portrait stub regardless of what the record claims: the box the image
// occupies has to come from the picture itself, not from the column or from
// provider dimensions, which Smithsonian records routinely get wrong
const PORTRAIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1800"><rect width="1200" height="1800" fill="#402f6b"/></svg>`

async function stubPortraitImages(page: Page, pattern: string) {
  await page.route(pattern, (route) =>
    route.fulfill({ body: PORTRAIT_SVG, contentType: 'image/svg+xml' }),
  )
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) {
    throw new Error('element did not render')
  }
  return box
}

async function expectFitsWithTitleBeneath(
  page: Page,
  image: Locator,
  title: Locator,
) {
  const viewport = page.viewportSize()
  if (!viewport) {
    throw new Error('spec needs a sized viewport')
  }
  const imageBox = await boxOf(image)
  const titleBox = await boxOf(title)

  // the box is the picture: a portrait image never spans the column
  expect(imageBox.width).toBeLessThan(imageBox.height)
  expect(imageBox.width / imageBox.height).toBeCloseTo(1200 / 1800, 1)
  // image and title both fit without scrolling, the title beneath the image
  expect(titleBox.y).toBeGreaterThanOrEqual(imageBox.y + imageBox.height)
  expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(viewport.height)
}

test('the detail page fits the image and its title in the viewport', async ({
  page,
}) => {
  await stubPortraitImages(page, '**/image/PIA14417/**')
  await page.goto('/assets/nasa_ivl/PIA14417')

  const image = page.getByRole('img', { name: /dumbbell nebula/i })
  await expect(image).toBeVisible()
  await expectFitsWithTitleBeneath(
    page,
    image,
    page.getByRole('heading', { level: 1 }),
  )
})

test('the overlay sizes the image the same way', async ({ page }) => {
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
          description: 'Stubbed asset for the detail layout journeys',
          thumbnail: image,
          image,
          original: image,
        },
      }),
  )
  await stubPortraitImages(page, '**/image/e2e-collections-*/**')

  await page.goto(`/collections/${publicCollection.id}`)
  // enabled star = hydrated (the click upgrade needs the router)
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()
  await page.getByRole('link', { name: wideSnapshot.title }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expectFitsWithTitleBeneath(
    page,
    dialog.getByRole('img', { name: wideSnapshot.title }),
    dialog.getByRole('heading', { level: 2, name: wideSnapshot.title }),
  )
})
