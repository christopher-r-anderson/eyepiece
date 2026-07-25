import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE } from './support/collections-fixture'
import type { Page } from '@playwright/test'

const {
  publicCollection,
  privateCollection,
  pagingCollection,
  unknownCollectionId,
  user,
} = COLLECTIONS_FIXTURE

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

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
  // a stub bitmap keeps the console clean regardless of upstream image
  // availability; layout comes from the stored dimensions
  for (const snapshot of COLLECTIONS_FIXTURE.snapshots) {
    await page.route(`**/image/${snapshot.externalId}/**`, (route) =>
      route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
    )
  }

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

  const tiles = page.getByRole('list').getByRole('listitem')
  await expect(tiles).toHaveCount(3)
  await expect(page.getByRole('link', { name: 'E2E Wide' })).toHaveAttribute(
    'href',
    `/assets/nasa_ivl/${COLLECTIONS_FIXTURE.snapshots[0].externalId}`,
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
  // the public detail read is deliberately viewer-independent (public
  // client, CDN-cacheable), so owning the collection must change nothing
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password)
  await Promise.all([
    page.waitForURL('/'),
    page.getByRole('button', { name: 'Log In' }).click(),
  ])
  // the header swaps to the avatar once auth settles; navigating before
  // that races the post-login work and firefox aborts the goto
  await expect(page.getByRole('button', { name: 'User Menu' })).toBeVisible()

  const response = await page.goto(`/collections/${privateCollection.id}`)

  expect(response?.status()).toBe(404)
  await expect(page.getByText(/not found/i).first()).toBeVisible()
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
  const tiles = page.getByRole('list').getByRole('listitem')
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
