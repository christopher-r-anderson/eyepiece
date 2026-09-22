import { test as base } from '@playwright/test'
import { STORAGE_STATE_PATH } from './support/paths'
import { TINY_PNG } from './support/collections-helpers'

export const test = base.extend({
  // names the running test on every request the browser makes, so a
  // server-side log (a provider fixture read or miss) can be traced back
  // to the spec that caused it
  // eslint-disable-next-line no-empty-pattern
  extraHTTPHeaders: async ({}, use, testInfo) => {
    await use({ 'x-e2e-spec': testInfo.titlePath.join(' > ') })
  },
  context: async ({ context }, use) => {
    // no assertion needs real image bytes; keep the suite off the live image hosts
    await context.route(/images-assets\.nasa\.gov|ids\.si\.edu/, (route) =>
      route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
    )
    await use(context)
  },
  // playwright requires destructuring even though we aren't using anything
  // eslint-disable-next-line no-empty-pattern
  storageState: async ({}, use, testInfo) => {
    const isUserTest = testInfo.tags.includes('@user')
    if (isUserTest) {
      await use(STORAGE_STATE_PATH)
    } else {
      await use({ cookies: [], origins: [] })
    }
  },
})

export { expect } from '@playwright/test'
