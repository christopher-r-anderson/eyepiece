import { expect, test } from './fixtures'
import { TINY_PNG } from './support/collections-helpers'
import {
  deleteUserFavorite,
  seedUserFavorite,
} from './support/favorites-fixture'

// Server functions are same-origin RPC endpoints; createCsrfMiddleware in
// start.ts must reject anything else. The endpoint URL is build-hashed, so
// the journey captures one from a real mutation and replays it forged.
test(
  'cross-site server-fn posts are rejected',
  { tag: '@user' },
  async ({ page }, testInfo) => {
    const fixture = {
      id: `e2ecc000-0000-4000-8000-${String(testInfo.workerIndex).padStart(12, '0')}`,
      externalId: `e2e-csrf-${testInfo.workerIndex}`,
      title: `E2E Csrf ${testInfo.workerIndex}`,
    }
    await seedUserFavorite(fixture)
    try {
      await page.route('**/image/e2e-csrf-*/**', (route) =>
        route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
      )
      const serverFnUrl = new Promise<string>((resolve) => {
        page.on('request', (request) => {
          // the endpoint path spelling differs between dev and prod
          // builds; the RPC marker header identifies a server-fn call
          if (
            request.method() === 'POST' &&
            request.headers()['x-tsr-serverfn'] === 'true'
          ) {
            resolve(request.url())
          }
        })
      })
      await page.goto('/favorites')
      const row = page.getByRole('row', { name: fixture.title })
      await expect(row.getByRole('button', { name: 'Star' })).toBeEnabled()
      await row.hover()
      await row.getByRole('button', { name: 'Star' }).click()
      const url = await serverFnUrl

      const forged = await page.request.post(url, {
        headers: {
          Origin: 'https://evil.example',
          'Sec-Fetch-Site': 'cross-site',
          'Content-Type': 'application/json',
        },
        data: '{}',
      })
      expect(forged.status()).toBe(403)

      const headerless = await page.request.post(url, {
        headers: { 'Content-Type': 'application/json' },
        data: '{}',
      })
      expect(headerless.status()).toBe(403)
    } finally {
      await deleteUserFavorite(fixture)
    }
  },
)
