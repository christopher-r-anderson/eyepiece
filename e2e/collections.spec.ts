import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE } from './support/collections-fixture'
import { TINY_PNG, stubSeededAssetApi } from './support/collections-helpers'
import { singleRenditionImage } from './support/asset-image'
import type { Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await stubSeededAssetApi(page)
})

const {
  publicCollection,
  privateCollection,
  pagingCollection,
  unknownCollectionId,
  user,
} = COLLECTIONS_FIXTURE

function collectConsoleErrors(page: Page) {
  const errors: Array<string> = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  return errors
}

test('public collection renders name, meta line, and justified tiles', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page)
  // fixture thumbnails do not exist upstream; a stub bitmap keeps the
  // console clean while layout still comes from the stored dimensions
  await page.route('**/image/e2e-collections-*/**', (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  )

  const response = await page.goto(`/collections/${publicCollection.id}`)

  expect(response?.status()).toBe(200)
  expect(response?.headers()['cache-control']).toContain('public')
  await expect(page).toHaveTitle(
    `${publicCollection.name} | eyepiece: NASA Media Explorer`,
  )
  await expect(
    page.getByRole('heading', { level: 1, name: publicCollection.name }),
  ).toBeVisible()
  await expect(
    page.getByText(`3 items · curated by ${user.displayName}`),
  ).toBeVisible()

  const tiles = page.getByRole('grid').getByRole('row')
  await expect(tiles).toHaveCount(3)
  await expect(page.getByRole('link', { name: 'E2E Wide' })).toHaveAttribute(
    'href',
    '/assets/nasa_ivl/e2e-collections-wide',
  )

  // the justified row: tiles share one height and split width by aspect
  // ratio, so the 2:1 tile renders twice as wide as the square one
  const wide = tiles.nth(0)
  const square = tiles.nth(1)
  const wideBox = await wide.boundingBox()
  const squareBox = await square.boundingBox()
  if (!wideBox || !squareBox) {
    throw new Error('fixture tiles did not render')
  }
  expect(Math.abs(wideBox.height - squareBox.height)).toBeLessThanOrEqual(1)
  expect(wideBox.width / squareBox.width).toBeGreaterThan(1.9)
  expect(wideBox.width / squareBox.width).toBeLessThan(2.1)

  expect(consoleErrors).toEqual([])
})

// `netlify serve` retries a 404 against static-file spellings (.html,
// /index.html, ...) and hands the client the LAST probe's body, which is
// the router's global not-found rather than the route-level one this route
// renders on real Netlify (verified live on /profile). The specs therefore
// pin the status and a body that works in both environments.
test('private collection is not found, even by id', async ({ page }) => {
  const response = await page.goto(`/collections/${privateCollection.id}`)

  expect(response?.status()).toBe(404)
  await expect(page.getByText(/not found/i).first()).toBeVisible()
})

test('private collection is not found even for its signed-in owner', async ({
  page,
}) => {
  // the viewer-independent read means the owner still gets the 404 (status
  // pinned by the anonymous test); the app's next= redirect avoids a
  // post-login goto that automated firefox aborts
  const target = `/collections/${privateCollection.id}`
  await page.goto(`/login?next=${encodeURIComponent(target)}`)
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password)
  await Promise.all([
    page.waitForURL(target),
    page.getByRole('button', { name: 'Log In' }).click(),
  ])

  await expect(
    page.getByRole('heading', { name: 'Collection Not Found' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'User Menu' })).toBeVisible()
})

test('later pages wait for prior thumbnails to settle', async ({ page }) => {
  await page.route('**/image/e2e-collections-page-*/**', (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  )
  // an injected delay makes the snapshot-fetch window observable, so the
  // event order below is deterministic rather than a latency race
  await page.route('**/rest/v1/asset_preview_snapshots*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.fallback()
  })
  const events: Array<string> = []
  page.on('request', (request) => {
    if (request.url().includes('/rest/v1/collection_items')) {
      events.push('edges-request')
    }
  })
  page.on('response', (response) => {
    if (response.url().includes('/rest/v1/asset_preview_snapshots')) {
      events.push('snapshots-response')
    }
  })

  await page.goto(`/collections/${pagingCollection.id}`)
  const tiles = page.getByRole('grid').getByRole('row')
  await expect(tiles).toHaveCount(24)
  // an enabled star is the deterministic hydration signal; scrolling
  // earlier gets undone by scroll restoration before the observer attaches
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()

  // page 1 arrives with SSR, so the client fetch sequence starts at page 2
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(tiles).toHaveCount(48, { timeout: 15000 })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(tiles).toHaveCount(pagingCollection.itemCount, {
    timeout: 15000,
  })

  // the page-3 edge request must not fire while page 2's thumbnails are
  // still in flight - the loader stays busy through the snapshot phase
  const secondEdgesRequest = events.indexOf(
    'edges-request',
    events.indexOf('edges-request') + 1,
  )
  const firstSnapshotsResponse = events.indexOf('snapshots-response')
  expect(firstSnapshotsResponse).toBeGreaterThan(-1)
  expect(secondEdgesRequest).toBeGreaterThan(firstSnapshotsResponse)
})

test('unknown and malformed collection ids are not found', async ({ page }) => {
  const unknownResponse = await page.goto(`/collections/${unknownCollectionId}`)
  expect(unknownResponse?.status()).toBe(404)
  await expect(page.getByText(/not found/i).first()).toBeVisible()

  const malformedResponse = await page.goto('/collections/not-a-uuid')
  expect(malformedResponse?.status()).toBe(404)
  await expect(page.getByText(/not found/i).first()).toBeVisible()
})

test('grid arrows navigate by geometry with a roving tab stop', async ({
  page,
}) => {
  await page.route('**/image/e2e-collections-page-*/**', (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  )
  await page.goto(`/collections/${pagingCollection.id}`)
  const rows = page.getByRole('grid').getByRole('row')
  await expect(rows).toHaveCount(24)
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()

  // roving tab stop: the grid is the single entry point until a row is
  // visited, then the visited row carries the stop
  await expect(page.getByRole('grid')).toHaveAttribute('tabindex', '0')
  await expect(rows.first()).toHaveAttribute('tabindex', '-1')

  await rows.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(rows.nth(1)).toBeFocused()
  await expect(rows.nth(1)).toHaveAttribute('tabindex', '0')

  // ArrowDown lands on a lower row that horizontally overlaps the origin;
  // justified tiles never column-align, so this is the geometric contract.
  // boundingBox is viewport-relative and arrow moves scroll the focused
  // row into view, so positions are normalized to document coordinates
  const documentBox = async (locator: ReturnType<Page['locator']>) => {
    const box = await locator.boundingBox()
    if (!box) {
      throw new Error('grid row did not render')
    }
    const scrollY = await page.evaluate(() => window.scrollY)
    return { ...box, y: box.y + scrollY }
  }
  const originBox = await documentBox(rows.nth(1))
  await page.keyboard.press('ArrowDown')
  const belowBox = await documentBox(page.locator('[role="row"]:focus'))
  expect(belowBox.y).toBeGreaterThan(originBox.y + 1)
  expect(belowBox.x).toBeLessThan(originBox.x + originBox.width)
  expect(belowBox.x + belowBox.width).toBeGreaterThan(originBox.x)

  await page.keyboard.press('ArrowUp')
  const backBox = await documentBox(page.locator('[role="row"]:focus'))
  expect(backBox.y).toBeLessThan(belowBox.y - 1)

  // the delegate pages by viewport height (the base class pages by the
  // container box, which spans the whole document-scrolled grid)
  const viewportHeight = await page.evaluate(() => window.innerHeight)
  await page.keyboard.press('PageDown')
  const pagedBox = await documentBox(page.locator('[role="row"]:focus'))
  expect(pagedBox.y - backBox.y).toBeGreaterThanOrEqual(viewportHeight - 1)
  await page.keyboard.press('PageUp')
  const pagedBackBox = await documentBox(page.locator('[role="row"]:focus'))
  expect(pagedBox.y - pagedBackBox.y).toBeGreaterThanOrEqual(viewportHeight - 1)
})

test('keyboard reaches the tile link and star; Enter opens the tile', async ({
  page,
}) => {
  await page.route('**/image/e2e-collections-*/**', (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  )
  await page.route('**/api/v1/asset/nasa_ivl/e2e-collections-wide*', (route) =>
    route.fulfill({
      json: {
        key: { providerId: 'nasa_ivl', externalId: 'e2e-collections-wide' },
        title: 'E2E Wide',
        description: 'Stubbed asset for the keyboard journey',
        image: singleRenditionImage('https://example.com/wide.png', 200, 100),
      },
    }),
  )
  await page.goto(`/collections/${publicCollection.id}`)
  const rows = page.getByRole('grid').getByRole('row')
  await expect(rows).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Star' }).first()).toBeEnabled()

  // Tab dives into the focused row's focusables: link first, then the star
  await rows.first().focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'E2E Wide' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(rows.first().getByRole('button', { name: 'Star' })).toBeFocused()

  // Enter on the row itself opens the tile through its own link
  await rows.first().focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/assets/nasa_ivl/e2e-collections-wide')
})
