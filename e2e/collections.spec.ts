import { expect, test } from './fixtures'
import { COLLECTIONS_FIXTURE } from './support/collections-fixture'
import type { Page } from '@playwright/test'

const { publicCollection, privateCollection, unknownCollectionId, user } =
  COLLECTIONS_FIXTURE

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

  const tiles = page.getByRole('list').getByRole('listitem')
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

test('unknown and malformed collection ids are not found', async ({ page }) => {
  const unknownResponse = await page.goto(`/collections/${unknownCollectionId}`)
  expect(unknownResponse?.status()).toBe(404)
  await expect(page.getByText(/not found/i).first()).toBeVisible()

  const malformedResponse = await page.goto('/collections/not-a-uuid')
  expect(malformedResponse?.status()).toBe(404)
  await expect(page.getByText(/not found/i).first()).toBeVisible()
})
