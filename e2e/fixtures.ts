import { test as base } from '@playwright/test'
import { STORAGE_STATE_PATH } from './support/paths'

export const test = base.extend({
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
