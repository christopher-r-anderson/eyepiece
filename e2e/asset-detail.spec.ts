import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE, thumbHref } from './support/collections-fixture'
import { singleRenditionImage } from './support/asset-image'
import type { Locator, Page } from '@playwright/test'

const { publicCollection, snapshots } = COLLECTIONS_FIXTURE
const wideSnapshot = snapshots[0]

// wraps to several lines at any width, like real provider titles
const LONG_TITLE =
  'Expedition 74 crew members pose for a portrait at the Johnson Space Center in Houston, Texas'

// a different shape than the record claims: the box comes from the picture
const PORTRAIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1800"><rect width="1200" height="1800" fill="#402f6b"/></svg>`
const LANDSCAPE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640"><rect width="1280" height="640" fill="#402f6b"/></svg>`

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

async function expectImageDecoded(image: Locator) {
  await expect
    .poll(() =>
      image.evaluate((element) => {
        const imageElement = element as HTMLImageElement
        return imageElement.complete && imageElement.naturalWidth > 0
      }),
    )
    .toBe(true)
}

// the budget stands for chrome in other files, so this notices when one grows
async function expectPictureSizedToViewport(
  page: Page,
  image: Locator,
  title: Locator,
) {
  await expect(image).toHaveAttribute('data-test-ratio-source', 'intrinsic')
  const viewport = page.viewportSize()
  if (!viewport) {
    throw new Error('spec needs a sized viewport')
  }
  const imageBox = await boxOf(image)
  const titleBox = await boxOf(title)

  expect(imageBox.width).toBeLessThan(imageBox.height)
  expect(imageBox.width / imageBox.height).toBeCloseTo(1200 / 1800, 1)
  expect(imageBox.width).toBeLessThanOrEqual(viewport.width)
  expect(imageBox.height).toBeLessThanOrEqual(viewport.height)
  expect(titleBox.y).toBeGreaterThanOrEqual(imageBox.y + imageBox.height)
}

test('the detail page fits the image and its title in the viewport', async ({
  page,
}) => {
  await stubPortraitImages(page, '**/image/PIA14417/**')
  await page.goto('/assets/nasa_ivl/PIA14417')

  const image = page.getByRole('img', { name: /dumbbell nebula/i })
  const title = page.getByRole('heading', { level: 1 })
  await expectPictureSizedToViewport(page, image, title)

  const viewport = page.viewportSize()
  const titleBox = await boxOf(title)
  expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(
    viewport?.height ?? 0,
  )
})

test('the detail title holds position while an accurately described image loads', async ({
  page,
}) => {
  let releaseImage = () => {}
  let markImageRequested = () => {}
  const imageGate = new Promise<void>((resolve) => {
    releaseImage = resolve
  })
  const imageRequested = new Promise<void>((resolve) => {
    markImageRequested = resolve
  })

  await page.route('**/image/PIA14417/**', async (route) => {
    markImageRequested()
    await imageGate
    await route.fulfill({ body: LANDSCAPE_SVG, contentType: 'image/svg+xml' })
  })

  await page.goto('/assets/nasa_ivl/PIA14417', {
    waitUntil: 'domcontentloaded',
  })
  await imageRequested

  const title = page.getByRole('heading', { level: 1 })
  await expect(title).toBeVisible()
  const image = page.getByRole('img', { name: /dumbbell nebula/i })
  const beforeLoad = await boxOf(title)
  const beforeImage = await boxOf(image)

  releaseImage()
  await expectImageDecoded(image)
  const afterLoad = await boxOf(title)
  const afterImage = await boxOf(image)

  expect(
    Math.abs(afterLoad.y - beforeLoad.y),
    `image box changed from ${JSON.stringify(beforeImage)} to ${JSON.stringify(afterImage)}`,
  ).toBeLessThan(1)
})

test('an image loaded before hydration hands off to intrinsic sizing', async ({
  page,
}) => {
  let releaseScripts = () => {}
  const scriptsGate = new Promise<void>((resolve) => {
    releaseScripts = resolve
  })

  await page.route('**/*.js', async (route) => {
    await scriptsGate
    await route.continue()
  })
  await page.route('**/image/PIA14417/**', (route) =>
    route.fulfill({ body: PORTRAIT_SVG, contentType: 'image/svg+xml' }),
  )

  try {
    await page.goto('/assets/nasa_ivl/PIA14417', { waitUntil: 'commit' })
    const image = page.getByRole('img', { name: /dumbbell nebula/i })
    await expect(image).toBeAttached()
    await expectImageDecoded(image)
    const beforeHydration = await boxOf(image)
    expect(beforeHydration.width / beforeHydration.height).toBeCloseTo(2, 1)

    releaseScripts()
    await expect(page.getByRole('button', { name: 'Star' })).toBeEnabled()
    await expect(image).toHaveAttribute('data-test-ratio-source', 'intrinsic')
    const afterHydration = await boxOf(image)
    expect(afterHydration.width / afterHydration.height).toBeCloseTo(
      1200 / 1800,
      1,
    )
  } finally {
    releaseScripts()
  }
})

test('the detail image keeps its intrinsic shape on a narrow viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await stubPortraitImages(page, '**/image/PIA14417/**')
  await page.goto('/assets/nasa_ivl/PIA14417')

  const image = page.getByRole('img', { name: /dumbbell nebula/i })
  await expectPictureSizedToViewport(
    page,
    image,
    page.getByRole('heading', { level: 1 }),
  )
})

test('a landscape detail image stays proportionate on a narrow viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/image/PIA14417/**', (route) =>
    route.fulfill({ body: LANDSCAPE_SVG, contentType: 'image/svg+xml' }),
  )
  await page.goto('/assets/nasa_ivl/PIA14417')

  const image = page.getByRole('img', { name: /dumbbell nebula/i })
  await expectImageDecoded(image)
  await expect(image).toHaveAttribute('data-test-ratio-source', 'provider')
  const imageBox = await boxOf(image)
  const titleBox = await boxOf(page.getByRole('heading', { level: 1 }))

  expect(imageBox.width / imageBox.height).toBeCloseTo(2, 1)
  expect(imageBox.width).toBeLessThanOrEqual(390)
  expect(imageBox.height).toBeLessThanOrEqual(844)
  expect(titleBox.y).toBeGreaterThanOrEqual(imageBox.y + imageBox.height)
})

test('the overlay sizes the image the same way', async ({ page }) => {
  const image = singleRenditionImage(
    thumbHref(wideSnapshot.externalId),
    wideSnapshot.width,
    wideSnapshot.height,
  )
  await page.route(
    `**/api/v1/asset/nasa_ivl/${wideSnapshot.externalId}`,
    (route) =>
      route.fulfill({
        json: {
          key: { providerId: 'nasa_ivl', externalId: wideSnapshot.externalId },
          title: LONG_TITLE,
          description: 'Stubbed asset for the detail layout journeys',
          image,
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
  const picture = dialog.getByRole('img', { name: LONG_TITLE })
  const title = dialog.getByRole('heading', { level: 2, name: LONG_TITLE })
  await expectPictureSizedToViewport(page, picture, title)

  // the wrapped title costs caption position, not picture size
  const viewport = page.viewportSize()
  expect((await boxOf(picture)).height).toBeGreaterThan(
    (viewport?.height ?? 0) * 0.4,
  )
  const titleBox = await boxOf(title)
  const source = await boxOf(dialog.getByText(/NASA Image and Video Library/))
  expect(source.y).toBeGreaterThanOrEqual(titleBox.y + titleBox.height)
})
