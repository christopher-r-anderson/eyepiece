import { COLLECTIONS_FIXTURE } from './collections-fixture'
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
