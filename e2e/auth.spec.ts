import { expect, test } from './fixtures'

test.describe('Protected Routes', () => {
  test('unauthenticated user can not visit protected settings page', async ({
    page,
  }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/login/)
  })
  test(
    'authenticated user can visit protected settings page',
    { tag: '@user' },
    async ({ page }) => {
      await page.goto('/settings')
      await expect(page).not.toHaveURL(/login/)
    },
  )
})
