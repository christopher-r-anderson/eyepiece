import { test as setup } from '@playwright/test'
import { STORAGE_STATE_PATH } from './support/paths'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email' }).fill('user1@example.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('hunter2')
  await Promise.all([
    page.waitForURL('/'),
    page.getByRole('button', { name: 'Log In' }).click(),
  ])

  await page.context().storageState({ path: STORAGE_STATE_PATH })
})
