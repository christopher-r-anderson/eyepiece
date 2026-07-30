import { COLLECTIONS_FIXTURE } from './collections-fixture'
import { singleRenditionImage } from './asset-image'
import type { Page } from '@playwright/test'

// 1x1 stub bitmap: fixture thumbnails do not exist upstream; layout still
// comes from the stored dimensions
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

export async function stubFixtureImages(page: Page) {
  await page.route('**/image/e2e-collections-*/**', (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  )
}

// the app's next= redirect avoids a post-login goto that automated
// firefox aborts
// seeded snapshots exist at no provider, and a tile hover preloads its asset,
// so these lookups are answered from the requested key rather than reaching
// the provider for a record that is guaranteed to be missing
export async function stubSeededAssetApi(page: Page) {
  await page.route('**/api/v1/asset/**', (route) => {
    const segments = new URL(route.request().url()).pathname.split('/')
    const [providerId, externalId] = segments.slice(-2)
    const image = singleRenditionImage('https://example.com/stub.png', 400, 300)
    return route.fulfill({
      json: {
        key: { providerId, externalId },
        title: 'Stubbed Asset',
        image,
      },
    })
  })
}

export async function logInAsFixtureUser(page: Page, next: string) {
  await stubFixtureImages(page)
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page
    .getByRole('textbox', { name: 'Email' })
    .fill(COLLECTIONS_FIXTURE.user.email)
  await page
    .getByRole('textbox', { name: 'Password' })
    .fill(COLLECTIONS_FIXTURE.user.password)
  await Promise.all([
    page.waitForURL(next),
    page.getByRole('button', { name: 'Log In' }).click(),
  ])
}

// mutations settle asynchronously with no visible signal by design; specs
// await each operation's server-fn POST before state-dependent steps
export function nextServerPost(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().startsWith('http://localhost:8888'),
  )
}
